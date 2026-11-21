import React, { useState } from 'react';
import { Award, CheckCircle2, Coffee, Leaf, Sparkles, Ticket, UserCircle2, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import type { RewardChoice, VoucherRecord, WorkspaceSnapshot } from '../types';
import { api } from '../api/client';
import { QrCodeSvg } from './QrCodeSvg';
import { useAppBaseUrl } from '../utils/appUrl';

interface RewardsViewProps {
  snapshot: WorkspaceSnapshot;
  recentUnlockedVoucher: VoucherRecord | null;
  onDismissCelebration: () => void;
  onSnapshotUpdated: (snapshot: WorkspaceSnapshot) => void;
  onOpenAccount?: () => void;
}

export const RewardsView: React.FC<RewardsViewProps> = ({
  snapshot,
  recentUnlockedVoucher,
  onDismissCelebration,
  onSnapshotUpdated,
  onOpenAccount,
}) => {
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const appBaseUrl = useAppBaseUrl();

  const { student, rewards } = snapshot;
  const progressPct = Math.min(
    100,
    Math.round((rewards.currentCycleLbs / rewards.thresholdLbs) * 100)
  );
  const isAtExactMilestone =
    student.verifiedWeightLbs > 0 &&
    student.verifiedWeightLbs % rewards.thresholdLbs === 0;

  const handlePreferenceChange = async (choice: RewardChoice) => {
    try {
      const updated = await api.updateProfile(snapshot.workspace, {
        preferredReward: choice,
      });
      onSnapshotUpdated(updated);
    } catch (err) {
      setRedeemError(err instanceof Error ? err.message : 'Could not save reward preference.');
    }
  };

  const handleRedeem = async (voucher: VoucherRecord) => {
    setRedeemError(null);
    setRedeemingId(voucher.id);
    try {
      const res = await api.redeemVoucher(
        snapshot.workspace,
        voucher.id,
        student.preferredReward
      );
      onSnapshotUpdated(res.snapshot);
    } catch (err) {
      setRedeemError(err instanceof Error ? err.message : 'Could not redeem voucher.');
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#143326]/10 pb-5">
        <div>
          <p className="text-xs font-medium text-[#4F775A]">
            EcoScrap Rewards · Compost 5. Get Energized.
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[#143326]">
            EcoScrap Wallet &amp; Milestone Rewards
          </h1>
          <p className="mt-1.5 text-sm text-[#143326]/75 max-w-2xl">
            Every 5.0 lbs of verified compost deposits unlocks a single-use QR voucher for a free energy drink or
            non-caffeinated campus snack alternative.
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
          <div className="text-left sm:text-right">
            <div className="text-xs text-[#143326]/65">Prototype Notice</div>
            <div className="text-xs font-medium text-[#143326]">
              Simulated Hackathon Rewards · Not affiliated with external brands
            </div>
          </div>
        </div>
      </div>

      {/* Account / Guest Rewards Tracking Bar */}
      {onOpenAccount && (
        <div className="rounded-2xl border border-[#143326]/15 bg-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#15803D] shrink-0">
              <UserCircle2 className="h-5 w-5" />
            </div>
            <div>
              {snapshot.account ? (
                <>
                  <div className="font-display text-sm font-semibold text-[#143326]">
                    Tracking Rewards for {snapshot.account.displayName}{' '}
                    <span className="font-normal text-[#4F775A]">
                      ({snapshot.account.accountType === 'guest' ? 'Guest Account' : `@${snapshot.account.username}`})
                    </span>
                  </div>
                  <p className="text-xs text-[#143326]/70">
                    Your verified lbs and EcoRewards vouchers are saved to your profile.
                  </p>
                </>
              ) : (
                <>
                  <div className="font-display text-sm font-semibold text-[#143326]">
                    Save &amp; Access Your Rewards Anytime
                  </div>
                  <p className="text-xs text-[#143326]/70">
                    Create a quick Guest Account with a recovery code or sign in to keep track of your own vouchers.
                  </p>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAccount}
            className="rounded-xl bg-[#143326] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E4A38] whitespace-nowrap shrink-0 cursor-pointer"
          >
            {snapshot.account ? 'My Account & Access Code' : 'Guest / Sign In'}
          </button>
        </div>
      )}

      {/* Milestone Celebration Banner */}
      {recentUnlockedVoucher && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-[#84CC16] bg-[#143326] text-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.8, repeat: 2 }}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#84CC16] text-[#143326] shrink-0"
            >
              <Sparkles className="h-6 w-6" />
            </motion.div>
            <div>
              <p className="text-xs font-semibold text-[#BEF264]">
                5-lb Compost Milestone Unlocked!
              </p>
              <h2 className="font-display text-lg font-semibold">
                Compost 5. Get Energized. — Voucher {recentUnlockedVoucher.code} Ready
              </h2>
              <p className="text-xs text-white/80 mt-0.5">
                You reached {recentUnlockedVoucher.milestoneLbs} verified lbs! Your single-use QR voucher is in your
                EcoScrap Wallet below.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismissCelebration}
            className="rounded-xl bg-white/15 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/25 whitespace-nowrap cursor-pointer"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Progress Meter Card + Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-2xl border border-[#143326]/15 bg-white p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <motion.div
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#15803D]"
              >
                <Leaf className="h-5 w-5" />
              </motion.div>
              <div>
                <h2 className="font-display text-lg font-semibold text-[#143326]">
                  Next Reward Progress (0 to 5 lbs)
                </h2>
                <p className="text-xs text-[#143326]/70">
                  {isAtExactMilestone
                    ? `Milestone ${rewards.completedRewardsCount} complete! Keep composting toward your next 5 lbs.`
                    : `${rewards.currentCycleLbs.toFixed(1)} / 5 lbs — Just ${rewards.lbsUntilNextReward.toFixed(1)} lbs until your next reward!`}
                </p>
              </div>
            </div>

            <div className="font-mono-data text-2xl font-semibold text-[#143326]">
              {rewards.currentCycleLbs.toFixed(1)}{' '}
              <span className="text-sm font-normal text-[#143326]/60">/ 5.0 lbs</span>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="relative">
            <div className="h-4 w-full rounded-full bg-[#FAF8F3] border border-[#143326]/12 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#4F775A] via-[#15803D] to-[#84CC16]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <div className="mt-2 flex justify-between font-mono-data text-[11px] text-[#143326]/60">
              <span>0 lbs</span>
              <span>1.25 lbs</span>
              <span>2.5 lbs</span>
              <span>3.75 lbs</span>
              <span>5.0 lbs · Free Drink / Snack</span>
            </div>
          </div>

          {/* Reward Choice Preference */}
          <div className="pt-4 border-t border-[#143326]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[#143326]">Preferred Milestone Reward</div>
              <p className="text-xs text-[#143326]/65">
                Choose your default reward option (available on unlocked vouchers).
              </p>
            </div>
            <div className="inline-flex rounded-xl border border-[#143326]/15 bg-[#FAF8F3] p-1">
              <button
                type="button"
                onClick={() => void handlePreferenceChange('energy-drink')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  student.preferredReward === 'energy-drink'
                    ? 'bg-[#143326] text-white'
                    : 'text-[#143326]/75 hover:bg-white'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                Energy Drink
              </button>
              <button
                type="button"
                onClick={() => void handlePreferenceChange('snack-alternative')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  student.preferredReward === 'snack-alternative'
                    ? 'bg-[#143326] text-white'
                    : 'text-[#143326]/75 hover:bg-white'
                }`}
              >
                <Coffee className="h-3.5 w-3.5" />
                Healthy Snack (No Caffeine)
              </button>
            </div>
          </div>
        </div>

        {/* Lifetime Stats Column */}
        <div className="lg:col-span-4 rounded-2xl border border-[#143326]/15 bg-white p-6 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div>
              <div className="text-xs text-[#143326]/65">Total Lifetime Verified Compost</div>
              <div className="mt-1 font-mono-data text-3xl font-semibold text-[#143326]">
                {student.verifiedWeightLbs.toFixed(1)} <span className="text-base font-normal">lbs</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#143326]/10">
              <div>
                <div className="text-xs text-[#143326]/65">Completed Rewards</div>
                <div className="mt-0.5 font-mono-data text-xl font-semibold text-[#15803D]">
                  {rewards.completedRewardsCount}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#143326]/65">EcoPoints Balance</div>
                <div className="mt-0.5 font-mono-data text-xl font-semibold text-[#143326]">
                  {student.ecoPoints} <span className="text-xs font-normal">pts</span>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-[#FAF8F3] border border-[#143326]/10 p-3 text-xs text-[#143326]/75">
            Earn <span className="font-mono-data font-semibold">20 pts/lb</span> for verified deposits plus{' '}
            <span className="font-mono-data font-semibold">10 pts</span> per clean ScrapCheck screen.
          </div>
        </div>
      </div>

      {redeemError && (
        <div role="alert" className="rounded-xl border border-[#B91C1C]/30 bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
          {redeemError}
        </div>
      )}

      {/* EcoScrap Wallet & QR Vouchers */}
      <div className="rounded-2xl border border-[#143326]/15 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#143326]/10">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-[#15803D]" />
            <h2 className="font-display text-lg font-semibold text-[#143326]">
              EcoScrap Wallet — Single-Use QR Vouchers
            </h2>
          </div>
          <span className="text-xs text-[#143326]/65">
            Each voucher has a unique ID and can be redeemed once
          </span>
        </div>

        {rewards.vouchers.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-[#143326]/20 bg-[#FAF8F3] p-8 text-center">
            <Award className="h-7 w-7 text-[#143326]/40 mx-auto" />
            <p className="mt-2 text-sm font-medium text-[#143326]">No unlocked vouchers yet</p>
            <p className="mt-1 text-xs text-[#143326]/65 max-w-md mx-auto">
              Reach 5.0 lbs of verified compost deposits to unlock your first free energy drink or healthy snack
              QR voucher.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.vouchers.map((voucher) => (
              <div
                key={voucher.id}
                className={`rounded-xl border p-4 flex flex-col sm:flex-row items-center gap-4 ${
                  voucher.status === 'redeemed'
                    ? 'border-[#143326]/12 bg-[#FAF8F3] opacity-75'
                    : 'border-[#15803D]/30 bg-[#ECFDF5]/45'
                }`}
              >
                <QrCodeSvg
                  value={`${appBaseUrl}/?tab=rewards&workspace=${snapshot.workspace}&voucher=${encodeURIComponent(voucher.code)}`}
                  caption={voucher.code}
                  size={104}
                />

                <div className="flex-1 space-y-1.5 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                    <span className="font-semibold text-[#15803D]">
                      Milestone #{voucher.milestoneNumber} ({voucher.milestoneLbs} lbs)
                    </span>
                    <span aria-hidden="true" className="text-[#143326]/30">·</span>
                    <span className="font-mono-data text-[#143326]/65">{voucher.id}</span>
                  </div>
                  <h3 className="font-display text-base font-semibold text-[#143326]">
                    {voucher.rewardTitle}
                  </h3>
                  <p className="text-xs text-[#143326]/70">
                    {voucher.status === 'redeemed'
                      ? `Redeemed on ${new Date(voucher.redeemedAt || '').toLocaleDateString()} · Single-use complete`
                      : snapshot.isDemo
                      ? 'Ready for simulated redemption at demo counter.'
                      : 'Show this QR code to authorized campus staff to redeem once.'}
                  </p>

                  {voucher.status === 'available' ? (
                    <button
                      type="button"
                      disabled={redeemingId === voucher.id}
                      onClick={() => void handleRedeem(voucher)}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#143326] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1E4A38] disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {snapshot.isDemo ? 'Simulate Counter Redemption' : 'Redeem (Staff Authorized)'}
                    </button>
                  ) : (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#143326]/65">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#15803D]" />
                      Voucher Redeemed
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
