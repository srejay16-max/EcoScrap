import React, { useEffect, useState } from 'react';
import {
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  PackageCheck,
  Scale,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  XCircle,
} from 'lucide-react';
import type { NavTab, StaffAuthStatus, VoucherRecord, WorkspaceSnapshot } from '../types';
import { api, hasStaffToken } from '../api/client';
import { QrCodeSvg } from './QrCodeSvg';
import { useAppBaseUrl } from '../utils/appUrl';

interface DepositsViewProps {
  snapshot: WorkspaceSnapshot;
  onSnapshotUpdated: (snapshot: WorkspaceSnapshot, unlockedVouchers?: VoucherRecord[]) => void;
  onNavigate: (tab: NavTab) => void;
}

export const DepositsView: React.FC<DepositsViewProps> = ({
  snapshot,
  onSnapshotUpdated,
  onNavigate,
}) => {
  const queryStationId =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('station')
      : null;
  const matchedQueryStation = queryStationId
    ? snapshot.stations.find((s) => s.id.toLowerCase() === queryStationId.toLowerCase())
    : undefined;

  const defaultDormStationId =
    matchedQueryStation?.id ||
    snapshot.stations.find((s) => s.dormId === snapshot.student.dormId)?.id ||
    snapshot.stations[0]?.id ||
    'JUN-02';

  const [subView, setSubView] = useState<'student' | 'staff'>('student');
  const [selectedStationId, setSelectedStationId] = useState(defaultDormStationId);
  const appBaseUrl = useAppBaseUrl();
  const [estWeight, setEstWeight] = useState('2.0');
  const [scaleWeightInput, setScaleWeightInput] = useState(
    snapshot.roomBin.totalEstimatedLbs > 0
      ? snapshot.roomBin.totalEstimatedLbs.toFixed(1)
      : '2.5'
  );
  const [dumpLoading, setDumpLoading] = useState(false);
  const [weightInputs, setWeightInputs] = useState<Record<string, string>>({});
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Live Mode Staff Auth State
  const [staffStatus, setStaffStatus] = useState<StaffAuthStatus | null>(null);
  const [staffAuthed, setStaffAuthed] = useState(hasStaffToken());
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!snapshot.isDemo) {
      api
        .getStaffAuthStatus()
        .then(setStaffStatus)
        .catch(() => {});
    }
    setStaffAuthed(hasStaffToken());
  }, [snapshot.isDemo]);

  useEffect(() => {
    if (matchedQueryStation) {
      setSelectedStationId(matchedQueryStation.id);
      return;
    }
    const matched = snapshot.stations.find((s) => s.dormId === snapshot.student.dormId);
    if (matched) {
      setSelectedStationId(matched.id);
    }
  }, [matchedQueryStation?.id, snapshot.student.dormId, snapshot.stations]);

  useEffect(() => {
    if (snapshot.roomBin.totalEstimatedLbs > 0) {
      setScaleWeightInput(snapshot.roomBin.totalEstimatedLbs.toFixed(1));
    }
  }, [snapshot.roomBin.totalEstimatedLbs]);

  const handleDumpRoomBin = async () => {
    setActionError(null);
    setActionMsg(null);
    setDumpLoading(true);
    try {
      const measuredWeight =
        Number(scaleWeightInput) || snapshot.roomBin.totalEstimatedLbs || 2.0;
      const res = await api.dumpRoomBinAtStation(snapshot.workspace, {
        stationId: selectedStationId,
        measuredWeightLbs: measuredWeight,
      });
      onSnapshotUpdated(res.snapshot);
      const stationLabel =
        snapshot.stations.find((s) => s.id === selectedStationId)?.name || selectedStationId;
      setActionMsg(
        `Room bin dumped at ${stationLabel}. Station scale weighed ${measuredWeight.toFixed(
          1
        )} lbs and reported it back to EcoScrap for final staff confirmation.`
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not dump dorm room bin.');
    } finally {
      setDumpLoading(false);
    }
  };

  const handleDirectInitiate = async () => {
    setActionError(null);
    setActionMsg(null);
    try {
      const res = await api.initiateDeposit(snapshot.workspace, {
        stationId: selectedStationId,
        estimatedWeightLbs: Number(estWeight) || 2.0,
      });
      onSnapshotUpdated(res.snapshot);
      setActionMsg(
        `Simulated deposit queued at ${selectedStationId}. Switch to Staff Verification View to weigh and approve.`
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not initiate deposit.');
    }
  };

  const handleStaffVerify = async (depositId: string, decision: 'approve' | 'reject', presetWeight?: number) => {
    setActionError(null);
    setActionMsg(null);
    setLoadingId(depositId);
    try {
      const targetDep = snapshot.deposits.find((d) => d.id === depositId);
      const defaultWeight =
        targetDep?.scaleReportedWeightLbs ?? targetDep?.estimatedWeightLbs ?? 2.0;
      const confirmedWeight =
        presetWeight ?? (Number(weightInputs[depositId]) || defaultWeight);
      const res = await api.verifyDeposit(snapshot.workspace, depositId, {
        decision,
        confirmedWeightLbs: decision === 'approve' ? confirmedWeight : undefined,
        rejectionReason: decision === 'reject' ? rejectReasons[depositId] : undefined,
      });
      onSnapshotUpdated(res.snapshot, res.newlyUnlockedVouchers);
      if (decision === 'approve') {
        const voucherNote =
          res.newlyUnlockedVouchers.length > 0
            ? ` Milestone reached! Unlocked ${res.newlyUnlockedVouchers.length} reward voucher.`
            : '';
        setActionMsg(
          `Deposit ${depositId} verified at ${confirmedWeight.toFixed(1)} lbs.${voucherNote}`
        );
      } else {
        setActionMsg(`Deposit ${depositId} marked rejected.`);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleStaffAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setActionError(null);
    try {
      if (staffStatus && !staffStatus.hasPasscodeConfigured) {
        await api.claimStaffPasscode(passcodeInput);
        setStaffStatus({ hasPasscodeConfigured: true, isEnvManaged: false });
      } else {
        await api.loginStaff(passcodeInput);
      }
      setStaffAuthed(true);
      setPasscodeInput('');
      setActionMsg('Staff verification session unlocked.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Staff authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const activeStation =
    snapshot.stations.find((s) => s.id === selectedStationId) || snapshot.stations[0];

  return (
    <div className="space-y-6">
      {/* Header + Student / Staff Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#143326]/10 pb-5">
        <div>
          <p className="text-xs font-medium text-[#4F775A]">
            Verified Compost Deposits · {snapshot.isDemo ? 'Simulated Demo Stations' : 'Live Campus Ledger'}
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[#143326]">
            Station Drop-Off &amp; Staff Scale Verification
          </h1>
          <p className="mt-1.5 text-sm text-[#143326]/75 max-w-2xl">
            A photo alone never counts as verified compost. Deposits must be weighed on a station scale and
            approved by staff before updating rewards or EcoImpact.
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-[#143326]/15 bg-white p-1 shrink-0">
          <button
            type="button"
            onClick={() => setSubView('student')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              subView === 'student'
                ? 'bg-[#143326] text-white'
                : 'text-[#143326]/75 hover:bg-[#FAF8F3]'
            }`}
          >
            Student Drop-Off
          </button>
          <button
            type="button"
            onClick={() => setSubView('staff')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              subView === 'staff'
                ? 'bg-[#143326] text-white'
                : 'text-[#143326]/75 hover:bg-[#FAF8F3]'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            Staff Verification View
            {snapshot.adminMetrics.pendingDepositsCount > 0 && (
              <span className="font-mono-data text-[11px] opacity-85">
                ({snapshot.adminMetrics.pendingDepositsCount})
              </span>
            )}
          </button>
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-[#B91C1C]/30 bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]"
        >
          {actionError}
        </div>
      )}

      {actionMsg && (
        <div className="rounded-xl border border-[#15803D]/30 bg-[#ECFDF5] px-4 py-3 text-sm text-[#143326] flex flex-wrap items-center justify-between gap-2">
          <span>{actionMsg}</span>
          <div className="flex flex-wrap items-center gap-3">
            {subView === 'student' && snapshot.adminMetrics.pendingDepositsCount > 0 && (
              <button
                type="button"
                onClick={() => setSubView('staff')}
                className="text-xs font-semibold text-[#143326] underline cursor-pointer"
              >
                Open Staff Verification View ({snapshot.adminMetrics.pendingDepositsCount})
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('rewards')}
              className="text-xs font-semibold text-[#15803D] hover:underline cursor-pointer"
            >
              Check EcoRewards Progress →
            </button>
          </div>
        </div>
      )}

      {subView === 'student' ? (
        <div className="space-y-6">
          {/* End-of-Day / End-of-Week Dorm Room Bin -> Dorm Building Station Weigh-In */}
          <section className="rounded-2xl border border-[#143326]/15 bg-white p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#143326]/10 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#4F775A]">
                  <Building2 className="h-4 w-4 text-[#15803D]" />
                  <span>Dorm Room Compost Bin → Dorm Building Station Weigh-In</span>
                </div>
                <h2 className="mt-1 font-display text-lg font-semibold text-[#143326]">
                  Empty Your Dorm Room Bin at Your Building&rsquo;s Compost Station
                </h2>
                <p className="mt-0.5 text-xs text-[#143326]/70 max-w-2xl">
                  Keep ScrapCheck-approved food scraps in your in-room bin. At the end of the day or week, dump them
                  into your dorm building&rsquo;s smart scale hopper—it weighs the batch, reports back to EcoScrap,
                  and credits your EcoRewards after verification.
                </p>
              </div>

              <div className="text-left md:text-right shrink-0">
                <div className="text-xs text-[#143326]/65">Current Room Bin Contents</div>
                <div className="font-mono-data text-xl font-bold text-[#143326]">
                  {snapshot.roomBin.batches.length} batch{snapshot.roomBin.batches.length === 1 ? '' : 'es'}
                  <span className="text-sm font-normal text-[#4F775A]">
                    {' '}
                    · ~{snapshot.roomBin.totalEstimatedLbs.toFixed(1)} lbs
                  </span>
                </div>
              </div>
            </div>

            {snapshot.roomBin.batches.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#143326]/20 bg-[#FAF8F3] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#143326]">
                    Your dorm room compost bin is currently empty
                  </p>
                  <p className="mt-0.5 text-xs text-[#143326]/70">
                    Upload a photo in the AI Waste Scanner to identify compostable scraps, then tap
                    &ldquo;Add Compostables to Room Bin&rdquo;.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('scanner')}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#143326] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1E4A38] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Camera className="h-4 w-4 text-[#BEF264]" />
                  Open AI Waste Scanner
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Room Bin Saved Batches */}
                <div className="lg:col-span-6 space-y-2">
                  <div className="text-xs font-semibold text-[#143326]/75">
                    Saved Approved Scraps Waiting in Your Room Bin
                  </div>
                  <div className="divide-y divide-[#143326]/10 rounded-xl border border-[#143326]/12 bg-[#FAF8F3] px-3.5">
                    {snapshot.roomBin.batches.map((batch) => (
                      <div key={batch.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-medium text-[#143326]">
                            {batch.itemNames.join(', ')}
                          </div>
                          <div className="font-mono-data text-[11px] text-[#143326]/55">
                            {batch.id} · {new Date(batch.addedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <span className="font-mono-data font-semibold text-[#15803D] shrink-0">
                          ~{batch.estimatedWeightLbs.toFixed(1)} lbs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dorm Station Hopper Dump + Smart Scale Simulator */}
                <div className="lg:col-span-6 rounded-xl border border-[#15803D]/25 bg-[#ECFDF5]/60 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#143326]">
                      Dorm Building Station Hopper Weigh-In
                    </span>
                    <span className="font-mono-data text-[11px] text-[#15803D]">
                      Station: {selectedStationId}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="dorm-dump-station"
                        className="block text-[11px] font-medium text-[#143326]/75 mb-1"
                      >
                        Your Dorm Building Station
                      </label>
                      <select
                        id="dorm-dump-station"
                        value={selectedStationId}
                        onChange={(e) => setSelectedStationId(e.target.value)}
                        className="w-full rounded-lg border border-[#143326]/20 bg-white px-2.5 py-2 text-xs text-[#143326]"
                      >
                        {snapshot.stations.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.id} · {st.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="dorm-scale-weight"
                        className="block text-[11px] font-medium text-[#143326]/75 mb-1"
                      >
                        Station Scale Reading (lbs)
                      </label>
                      <input
                        id="dorm-scale-weight"
                        type="number"
                        min="0.2"
                        max="50"
                        step="0.1"
                        value={scaleWeightInput}
                        onChange={(e) => setScaleWeightInput(e.target.value)}
                        className="w-full rounded-lg border border-[#143326]/20 bg-white px-2.5 py-2 text-xs font-mono-data text-[#143326]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[#143326]/65">Simulate scale:</span>
                      {[2.0, 3.0, 5.0].map((wt) => (
                        <button
                          key={wt}
                          type="button"
                          onClick={() => setScaleWeightInput(wt.toFixed(1))}
                          className="rounded-md border border-[#143326]/15 bg-white px-2 py-1 text-[11px] font-mono-data text-[#143326] hover:bg-[#FAF8F3] cursor-pointer"
                        >
                          {wt.toFixed(1)} lb
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={dumpLoading}
                      onClick={() => void handleDumpRoomBin()}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#143326] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E4A38] disabled:opacity-50 whitespace-nowrap cursor-pointer"
                    >
                      <PackageCheck className="h-4 w-4 text-[#BEF264]" />
                      {dumpLoading ? 'Weighing & Reporting...' : 'Dump Bin & Report Scale Weight'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Participating Station Kiosk Selector */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-[#143326]/15 bg-white p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-semibold text-[#143326]">
                  Participating Campus Stations
                </h2>
                <span className="text-xs text-[#4F775A] font-medium">Demo Kiosks</span>
              </div>

              <div className="space-y-2">
                {snapshot.stations.map((station) => (
                  <button
                    key={station.id}
                    type="button"
                    onClick={() => setSelectedStationId(station.id)}
                    className={`w-full text-left rounded-xl border p-3 transition-colors cursor-pointer ${
                      selectedStationId === station.id
                        ? 'border-[#143326] bg-[#FAF8F3]'
                        : 'border-[#143326]/12 bg-white hover:bg-[#FAF8F3]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-sm font-semibold text-[#143326]">
                        {station.name}
                      </span>
                      <span className="font-mono-data text-xs text-[#15803D] font-medium">
                        {station.id}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-[#143326]/65">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {station.location}
                    </p>
                  </button>
                ))}
              </div>

              {activeStation && (
                <div className="rounded-xl border border-[#143326]/12 bg-[#FAF8F3] p-4 flex flex-col sm:flex-row items-center gap-4">
                  <QrCodeSvg
                    value={`${appBaseUrl}/?tab=deposits&workspace=${snapshot.workspace}&station=${encodeURIComponent(activeStation.id)}`}
                    caption={activeStation.qrCode}
                    size={100}
                  />
                  <div className="text-xs space-y-1">
                    <div className="font-semibold text-[#143326]">Station Check-In QR</div>
                    <p className="text-[#143326]/75">{activeStation.scaleModel}</p>
                    <p className="text-[#143326]/65">
                      Scan at the kiosk after passing ScrapCheck to queue your drop-off for weighing.
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Deposit Queue Form */}
              <div className="pt-3 border-t border-[#143326]/10 space-y-3">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label
                      htmlFor="quick-est-weight"
                      className="block text-xs font-medium text-[#143326]/75 mb-1"
                    >
                      Estimated Scrap Weight (lbs)
                    </label>
                    <input
                      id="quick-est-weight"
                      type="number"
                      min="0.5"
                      max="50"
                      step="0.5"
                      value={estWeight}
                      onChange={(e) => setEstWeight(e.target.value)}
                      className="w-full rounded-xl border border-[#143326]/20 bg-[#FAF8F3] px-3 py-2 text-xs font-mono-data"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDirectInitiate()}
                    className="rounded-xl bg-[#143326] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E4A38] whitespace-nowrap cursor-pointer"
                  >
                    Queue Drop-Off
                  </button>
                </div>
                <p className="text-[11px] text-[#143326]/60">
                  Tip: In Hackathon Demo Mode, queue a 2-lb and 3-lb deposit, then switch to Staff Verification View
                  to unlock the 5-lb energy drink voucher.
                </p>
              </div>
            </div>
          </div>

          {/* Student Deposit History Table */}
          <div className="lg:col-span-7 rounded-2xl border border-[#143326]/15 bg-white p-5">
            <h2 className="font-display text-base font-semibold text-[#143326]">
              Deposit Verification Ledger
            </h2>
            <p className="mt-0.5 text-xs text-[#143326]/65">
              Only staff-approved weights credit your EcoRewards meter and EcoImpact savings.
            </p>

            {snapshot.deposits.filter((d) => d.studentId === snapshot.student.id).length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-[#143326]/20 bg-[#FAF8F3] p-6 text-center">
                <Scale className="h-6 w-6 text-[#143326]/45 mx-auto" />
                <p className="mt-2 text-sm font-medium text-[#143326]">No compost deposits queued yet</p>
                <p className="mt-1 text-xs text-[#143326]/65">
                  Run a ScrapCheck scan first or click &ldquo;Queue Drop-Off&rdquo; to simulate bringing scraps to a
                  station.
                </p>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-[#143326]/10">
                {snapshot.deposits
                  .filter((d) => d.studentId === snapshot.student.id)
                  .map((dep) => (
                  <div key={dep.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono-data font-semibold text-[#143326]">{dep.id}</span>
                        <span aria-hidden="true" className="text-[#143326]/30">·</span>
                        <span className="text-[#143326]/75">{dep.stationId}</span>
                        {dep.source === 'dorm-bin-dump' && (
                          <>
                            <span aria-hidden="true" className="text-[#143326]/30">·</span>
                            <span className="font-medium text-[#15803D]">Dorm Bin Station Weigh-In</span>
                          </>
                        )}
                        {dep.isDemo && (
                          <>
                            <span aria-hidden="true" className="text-[#143326]/30">·</span>
                            <span className="text-[#4F775A]">Simulated</span>
                          </>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-[#143326]">{dep.stationName}</p>
                      <p className="text-xs text-[#143326]/65">
                        Items: {dep.itemSummary.join(', ')}
                      </p>
                    </div>

                    <div className="text-right">
                      {dep.status === 'approved' ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D]">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-mono-data">{dep.verifiedWeightLbs.toFixed(1)} lbs Verified</span>
                        </div>
                      ) : dep.status === 'rejected' ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C]">
                          <XCircle className="h-4 w-4" />
                          <span>Rejected</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B45309]">
                          <Clock className="h-4 w-4" />
                          <span>
                            {dep.scaleReportedWeightLbs
                              ? `Station Reported ${dep.scaleReportedWeightLbs.toFixed(1)} lbs · Awaiting Staff Confirm`
                              : `Pending Scale Check (~${dep.estimatedWeightLbs.toFixed(1)} lbs)`}
                          </span>
                        </div>
                      )}
                      <div className="mt-0.5 font-mono-data text-[11px] text-[#143326]/55">
                        {new Date(dep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      ) : (
        /* Staff Verification Console */
        <div className="space-y-4">
          {!snapshot.isDemo && !staffAuthed ? (
            <div className="max-w-md rounded-2xl border border-[#143326]/15 bg-white p-6">
              <div className="flex items-center gap-2.5 text-[#143326]">
                <Lock className="h-5 w-5 text-[#15803D]" />
                <h2 className="font-display text-lg font-semibold">
                  {staffStatus && !staffStatus.hasPasscodeConfigured
                    ? 'Set Up Staff Verification Passcode'
                    : 'Staff Verification Sign-In'}
                </h2>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#143326]/75">
                {staffStatus && !staffStatus.hasPasscodeConfigured
                  ? 'First-run setup: create a Staff Verifier passcode (6+ chars) to authorize live deposit approvals and single-use voucher redemptions.'
                  : 'Enter the USF Compost Station Staff passcode to approve or reject live student deposits.'}
              </p>
              <form onSubmit={handleStaffAuthSubmit} className="mt-4 space-y-3">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="Enter staff passcode..."
                  className="w-full rounded-xl border border-[#143326]/20 bg-[#FAF8F3] px-3 py-2 text-sm text-[#143326]"
                />
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full rounded-xl bg-[#143326] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1E4A38] disabled:opacity-50 cursor-pointer"
                >
                  {authLoading
                    ? 'Verifying...'
                    : staffStatus && !staffStatus.hasPasscodeConfigured
                    ? 'Claim Staff Passcode & Unlock'
                    : 'Unlock Staff Console'}
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#143326]/15 bg-white p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#143326]/10 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#15803D]">
                    <ShieldCheck className="h-4 w-4" />
                    <span>
                      {snapshot.isDemo
                        ? 'Simulated Demo Staff Verification Console'
                        : 'Authorized USF Staff Verification Console'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#143326]/70">
                    Inspect physical scraps, record measured scale weight in pounds, and approve or reject once
                    (double approvals are blocked).
                  </p>
                </div>
              </div>

              {snapshot.deposits.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#143326]/20 bg-[#FAF8F3] p-8 text-center">
                  <ShieldAlert className="h-6 w-6 text-[#143326]/45 mx-auto" />
                  <p className="mt-2 text-sm font-medium text-[#143326]">
                    No deposits waiting in the verification queue
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubView('student')}
                    className="mt-3 rounded-xl bg-[#143326] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                  >
                    Switch to Student Drop-Off to Queue Deposit
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {snapshot.deposits.map((dep) => {
                    const isPending = dep.status === 'pending';
                    const currentWeight =
                      weightInputs[dep.id] ??
                      (dep.scaleReportedWeightLbs ?? dep.estimatedWeightLbs).toFixed(1);
                    return (
                      <div
                        key={dep.id}
                        className="rounded-xl border border-[#143326]/15 bg-[#FAF8F3] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono-data font-semibold text-[#143326]">{dep.id}</span>
                            <span aria-hidden="true" className="text-[#143326]/30">·</span>
                            <span className="font-medium text-[#143326]">{dep.studentAlias}</span>
                            <span aria-hidden="true" className="text-[#143326]/30">·</span>
                            <span className="text-[#4F775A]">{dep.stationId}</span>
                            {dep.source === 'dorm-bin-dump' && (
                              <>
                                <span aria-hidden="true" className="text-[#143326]/30">·</span>
                                <span className="font-medium text-[#15803D]">
                                  Station Scale Reported {(dep.scaleReportedWeightLbs ?? dep.estimatedWeightLbs).toFixed(1)} lbs
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-[#143326]">{dep.stationName}</p>
                          <p className="text-xs text-[#143326]/70">
                            ScrapCheck Items: {dep.itemSummary.join(', ')}
                          </p>
                        </div>

                        {isPending ? (
                          <div className="flex flex-wrap items-center gap-2.5">
                            <div className="flex items-center gap-1.5">
                              <label htmlFor={`wt-${dep.id}`} className="text-xs font-medium text-[#143326]">
                                Scale (lbs):
                              </label>
                              <input
                                id={`wt-${dep.id}`}
                                type="number"
                                min="0.1"
                                max="100"
                                step="0.1"
                                value={currentWeight}
                                onChange={(e) =>
                                  setWeightInputs((prev) => ({ ...prev, [dep.id]: e.target.value }))
                                }
                                className="w-20 rounded-lg border border-[#143326]/20 bg-white px-2.5 py-1.5 text-xs font-mono-data text-[#143326]"
                              />
                            </div>

                            {snapshot.isDemo && (
                              <div className="flex items-center gap-1">
                                {[2.0, 3.0].map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    disabled={loadingId === dep.id}
                                    onClick={() => void handleStaffVerify(dep.id, 'approve', preset)}
                                    className="rounded-lg border border-[#15803D]/30 bg-white px-2.5 py-1.5 text-[11px] font-mono-data font-semibold text-[#15803D] hover:bg-[#ECFDF5] cursor-pointer"
                                  >
                                    +{preset.toFixed(0)} lb
                                  </button>
                                ))}
                              </div>
                            )}

                            <button
                              type="button"
                              disabled={loadingId === dep.id}
                              onClick={() => void handleStaffVerify(dep.id, 'approve')}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-[#15803D] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#166534] disabled:opacity-50 cursor-pointer whitespace-nowrap"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approve Scale Weight
                            </button>

                            <input
                              type="text"
                              placeholder="Rejection reason (optional)"
                              value={rejectReasons[dep.id] || ''}
                              onChange={(e) =>
                                setRejectReasons((prev) => ({ ...prev, [dep.id]: e.target.value }))
                              }
                              className="w-40 rounded-lg border border-[#143326]/15 bg-white px-2.5 py-1.5 text-xs"
                            />
                            <button
                              type="button"
                              disabled={loadingId === dep.id}
                              onClick={() => void handleStaffVerify(dep.id, 'reject')}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[#B91C1C]/30 bg-white px-3 py-2 text-xs font-semibold text-[#B91C1C] hover:bg-[#FEF2F2] disabled:opacity-50 cursor-pointer whitespace-nowrap"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="text-right text-xs">
                            {dep.status === 'approved' ? (
                              <span className="inline-flex items-center gap-1.5 font-semibold text-[#15803D]">
                                <CheckCircle2 className="h-4 w-4" />
                                Locked · Approved ({dep.verifiedWeightLbs.toFixed(1)} lbs)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 font-semibold text-[#B91C1C]">
                                <XCircle className="h-4 w-4" />
                                Locked · Rejected
                              </span>
                            )}
                            <div className="mt-0.5 text-[11px] text-[#143326]/60">
                              {dep.verifiedBy} · Double-approval blocked
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
