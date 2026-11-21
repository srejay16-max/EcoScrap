import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from 'recharts';
import {
  AlertTriangle,
  Award,
  Building2,
  CheckCircle2,
  History,
  ShieldCheck,
  Sprout,
  Users,
} from 'lucide-react';
import type { NavTab, WorkspaceSnapshot } from '../types';
import { api } from '../api/client';
import { EcoImpactStrip } from './EcoImpactStrip';

interface DashboardViewProps {
  snapshot: WorkspaceSnapshot;
  onSnapshotUpdated: (snapshot: WorkspaceSnapshot) => void;
  onNavigate: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  snapshot,
  onSnapshotUpdated,
  onNavigate,
}) => {
  const [roleTab, setRoleTab] = useState<'student' | 'admin'>('student');

  const { student, adminMetrics } = snapshot;

  const handleUpdateGoal = async (goalLbs: number) => {
    try {
      const updated = await api.updateProfile(snapshot.workspace, { monthlyGoalLbs: goalLbs });
      onSnapshotUpdated(updated);
    } catch {
      // Ignore transient errors
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Student / Campus Admin Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#143326]/10 pb-5">
        <div>
          <p className="text-xs font-medium text-[#4F775A]">
            Campus Sustainability Dashboard · {snapshot.isDemo ? 'Hackathon Demo Data' : 'Live USF Workspace'}
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[#143326]">
            {roleTab === 'student'
              ? `Sustainability Summary · ${student.displayName}`
              : 'Campus Administrator Analytics'}
          </h1>
        </div>

        <div className="inline-flex rounded-xl border border-[#143326]/15 bg-white p-1 shrink-0">
          <button
            type="button"
            onClick={() => setRoleTab('student')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              roleTab === 'student' ? 'bg-[#143326] text-white' : 'text-[#143326]/75 hover:bg-[#FAF8F3]'
            }`}
          >
            Student Dashboard
          </button>
          <button
            type="button"
            onClick={() => setRoleTab('admin')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              roleTab === 'admin' ? 'bg-[#143326] text-white' : 'text-[#143326]/75 hover:bg-[#FAF8F3]'
            }`}
          >
            Campus Admin View
          </button>
        </div>
      </div>

      {roleTab === 'student' ? (
        <>
          {/* Student 4-KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-[#143326]/15 bg-white p-4">
              <div className="text-xs text-[#143326]/65">Verified Compost Weight</div>
              <div className="mt-1 font-mono-data text-2xl font-semibold text-[#143326]">
                {student.verifiedWeightLbs.toFixed(1)} <span className="text-sm font-normal">lbs</span>
              </div>
              <div className="mt-1 text-xs text-[#15803D]">
                {snapshot.rewards.completedRewardsCount} reward milestone(s) completed
              </div>
            </div>

            <div className="rounded-2xl border border-[#143326]/15 bg-white p-4">
              <div className="text-xs text-[#143326]/65">Personal Est. CO₂e Impact</div>
              <div className="mt-1 font-mono-data text-2xl font-semibold text-[#143326]">
                {snapshot.ecoImpact.estimatedKgCo2eAvoided.toFixed(1)}{' '}
                <span className="text-sm font-normal">kg</span>
              </div>
              <div className="mt-1 text-xs text-[#143326]/65">EPA WARM lifecycle estimate</div>
            </div>

            <div className="rounded-2xl border border-[#143326]/15 bg-white p-4">
              <div className="text-xs text-[#143326]/65">Dorm Competition Rank</div>
              <div className="mt-1 font-mono-data text-2xl font-semibold text-[#143326]">
                #{snapshot.studentDormRank}
              </div>
              <div className="mt-1 text-xs text-[#143326]/65">
                {snapshot.dorms.find((d) => d.id === student.dormId)?.name || 'Juniper Hall'}
              </div>
            </div>

            <div className="rounded-2xl border border-[#143326]/15 bg-white p-4">
              <div className="text-xs text-[#143326]/65">EcoPoints &amp; Badges</div>
              <div className="mt-1 font-mono-data text-2xl font-semibold text-[#143326]">
                {student.ecoPoints} <span className="text-sm font-normal">pts</span>
              </div>
              <div className="mt-1 text-xs text-[#143326]/65">
                {snapshot.achievements.filter((a) => a.unlocked).length} / {snapshot.achievements.length} badges unlocked
              </div>
            </div>
          </div>

          {/* Scan History + Badges & Dorm Room Bin Snapshot */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Recent Scan History */}
            <div className="lg:col-span-7 rounded-2xl border border-[#143326]/15 bg-white p-5">
              <div className="flex items-center justify-between border-b border-[#143326]/10 pb-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-[#15803D]" />
                  <h2 className="font-display text-base font-semibold text-[#143326]">
                    Recent ScrapCheck Scan History
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('scanner')}
                  className="text-xs font-semibold text-[#15803D] hover:underline cursor-pointer"
                >
                  + New Scan
                </button>
              </div>

              {snapshot.scans.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-[#143326]/20 bg-[#FAF8F3] p-6 text-center">
                  <p className="text-sm font-medium text-[#143326]">No AI scans recorded yet</p>
                  <p className="mt-1 text-xs text-[#143326]/65">
                    Scan food scraps to see multi-item classification and contamination alerts here.
                  </p>
                </div>
              ) : (
                <div className="mt-3 divide-y divide-[#143326]/10">
                  {snapshot.scans.slice(0, 6).map((sc) => (
                    <div key={sc.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono-data font-semibold text-[#143326]">{sc.id}</span>
                          <span aria-hidden="true" className="text-[#143326]/30">·</span>
                          <span className="text-[#143326]/70">{sc.items.length} items detected</span>
                        </div>
                        <p className="mt-0.5 text-xs text-[#143326]/75">
                          {sc.items.map((i) => i.itemName).join(', ')}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          sc.scrapCheck.isReadyToCompost ? 'text-[#15803D]' : 'text-[#B45309]'
                        }`}
                      >
                        {sc.scrapCheck.isReadyToCompost ? 'Ready to Compost' : 'Needs Screening'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dorm Room Bin & Achievements Summary */}
            <div className="lg:col-span-5 rounded-2xl border border-[#143326]/15 bg-white p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#143326]/10 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#15803D]" />
                  <h2 className="font-display text-base font-semibold text-[#143326]">
                    Dorm Room Bin &amp; Milestones
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('deposits')}
                  className="text-xs font-semibold text-[#15803D] hover:underline cursor-pointer"
                >
                  Open Station →
                </button>
              </div>

              <div className="rounded-xl bg-[#FAF8F3] border border-[#143326]/10 p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-[#143326]/65">Current Dorm Room Bin</div>
                  <div className="mt-0.5 font-mono-data text-lg font-semibold text-[#143326]">
                    {snapshot.roomBin.batches.length} batch{snapshot.roomBin.batches.length === 1 ? '' : 'es'}
                    <span className="text-xs font-normal text-[#4F775A]">
                      {' '}
                      · ~{snapshot.roomBin.totalEstimatedLbs.toFixed(1)} lbs
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(snapshot.roomBin.batches.length > 0 ? 'deposits' : 'scanner')}
                  className="rounded-lg bg-[#143326] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1E4A38] whitespace-nowrap cursor-pointer"
                >
                  {snapshot.roomBin.batches.length > 0 ? 'Dump at Station' : 'Scan Scraps'}
                </button>
              </div>

              <div className="space-y-2">
                {snapshot.achievements.slice(0, 4).map((ach) => (
                  <div
                    key={ach.id}
                    className={`rounded-xl border px-3 py-2.5 flex items-center justify-between gap-2 text-xs ${
                      ach.unlocked
                        ? 'border-[#15803D]/25 bg-[#ECFDF5]/60 text-[#143326]'
                        : 'border-[#143326]/10 bg-white text-[#143326]/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Award
                        className={`h-4 w-4 shrink-0 ${ach.unlocked ? 'text-[#15803D]' : 'text-[#143326]/30'}`}
                      />
                      <span className="font-medium truncate">{ach.title}</span>
                    </div>
                    <span className="font-mono-data text-[11px] shrink-0">{ach.progressText}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom of Student Dashboard: Prominent Compact EcoImpact Strip */}
          <EcoImpactStrip
            impact={snapshot.ecoImpact}
            isDemo={snapshot.isDemo}
            onUpdateGoal={handleUpdateGoal}
            compact={true}
          />
        </>
      ) : (
        /* Campus Administrator Analytics View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-[#143326]/15 bg-white p-4">
              <div className="flex items-center justify-between text-xs text-[#143326]/65">
                <span>Total Verified Deposits</span>
                <ShieldCheck className="h-4 w-4 text-[#15803D]" />
              </div>
              <div className="mt-1 font-mono-data text-2xl font-semibold text-[#143326]">
                {adminMetrics.totalVerifiedDeposits}
              </div>
              <div className="mt-1 text-xs text-[#143326]/65">
                {adminMetrics.pendingDepositsCount} awaiting scale check
              </div>
            </div>

            <div className="rounded-2xl border border-[#143326]/15 bg-white p-4">
              <div className="flex items-center justify-between text-xs text-[#143326]/65">
                <span>Campus Scrap Weight</span>
                <Sprout className="h-4 w-4 text-[#15803D]" />
              </div>
              <div className="mt-1 font-mono-data text-2xl font-semibold text-[#143326]">
                {adminMetrics.totalCollectedLbs.toFixed(1)} <span className="text-sm font-normal">lbs</span>
              </div>
              <div className="mt-1 text-xs text-[#15803D]">
                Est. {adminMetrics.campusImpact.estimatedKgCo2eAvoided.toFixed(1)} kg CO₂e avoided
              </div>
            </div>

            <div className="rounded-2xl border border-[#143326]/15 bg-white p-4">
              <div className="flex items-center justify-between text-xs text-[#143326]/65">
                <span>Contamination Incidents</span>
                <AlertTriangle className="h-4 w-4 text-[#B45309]" />
              </div>
              <div className="mt-1 font-mono-data text-2xl font-semibold text-[#143326]">
                {adminMetrics.contaminationIncidentsCount}
              </div>
              <div className="mt-1 text-xs text-[#143326]/65">
                Caught by ScrapCheck &amp; station intake
              </div>
            </div>

            <div className="rounded-2xl border border-[#143326]/15 bg-white p-4">
              <div className="flex items-center justify-between text-xs text-[#143326]/65">
                <span>Participating Students</span>
                <Users className="h-4 w-4 text-[#15803D]" />
              </div>
              <div className="mt-1 font-mono-data text-2xl font-semibold text-[#143326]">
                {adminMetrics.participatingStudents}
              </div>
              <div className="mt-1 text-xs text-[#143326]/65">
                Across {snapshot.dorms.length} USF residence halls
              </div>
            </div>
          </div>

          {/* Recharts Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-2xl border border-[#143326]/15 bg-white p-5">
              <h2 className="font-display text-base font-semibold text-[#143326]">
                Weekly Compost Weight &amp; Contamination Trend
              </h2>
              <p className="text-xs text-[#143326]/65 mb-4">
                {snapshot.isDemo
                  ? 'Sample USF campus pilot trend updated live by verified demo deposits'
                  : 'Verified weekly campus collections'}
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={adminMetrics.weeklySeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,51,38,0.08)" />
                    <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#143326' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#143326' }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="lbs"
                      name="Verified Lbs"
                      stroke="#15803D"
                      fill="#BBF7D0"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-[#143326]/15 bg-white p-5">
              <h2 className="font-display text-base font-semibold text-[#143326]">
                Commonly Mis-Sorted Materials
              </h2>
              <p className="text-xs text-[#143326]/65 mb-4">
                Flagged contaminants during ScrapCheck &amp; station intake
              </p>
              {adminMetrics.commonlyMisSorted.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-[#143326]/60">
                  No contamination incidents logged yet.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={adminMetrics.commonlyMisSorted}
                      layout="vertical"
                      margin={{ left: 16, right: 16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,51,38,0.08)" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="material"
                        width={110}
                        tick={{ fontSize: 11, fill: '#143326' }}
                      />
                      <Tooltip />
                      <Bar dataKey="count" name="Incidents" fill="#B91C1C" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Proposed Processing & Garden Delivery Records */}
          <div className="rounded-2xl border border-[#143326]/15 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#143326]/10">
              <div>
                <h2 className="font-display text-base font-semibold text-[#143326]">
                  Proposed Compost Processing &amp; USF Botanical Gardens Projection
                </h2>
                <p className="text-xs text-[#143326]/70">
                  Proposed Partnership Model — figures reflect projected finished yield (~38%) from campus scraps, not
                  active deliveries.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('compost-loop')}
                className="text-xs font-semibold text-[#15803D] hover:underline cursor-pointer"
              >
                Explore Campus Compost Loop →
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-[#143326]/65">Verified Scraps</div>
                <div className="font-mono-data text-lg font-semibold text-[#143326]">
                  {adminMetrics.botanicalProjection.verifiedScrapsCollectedLbs.toFixed(1)} lbs
                </div>
              </div>
              <div>
                <div className="text-xs text-[#143326]/65">Projected Finished Compost</div>
                <div className="font-mono-data text-lg font-semibold text-[#15803D]">
                  {adminMetrics.botanicalProjection.projectedFinishedCompostLbs.toFixed(1)} lbs
                </div>
              </div>
              <div>
                <div className="text-xs text-[#143326]/65">Est. 40-lb Bags Displaced</div>
                <div className="font-mono-data text-lg font-semibold text-[#143326]">
                  {adminMetrics.botanicalProjection.projectedExternalBagsDisplaced.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#143326]/65">Partnership Status</div>
                <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#78593A] mt-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Proposed Concept
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
