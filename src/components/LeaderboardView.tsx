import React, { useState } from 'react';
import { Award, Building2, CheckCircle2, Medal, Trophy, Users } from 'lucide-react';
import { motion } from 'motion/react';
import type { WorkspaceSnapshot } from '../types';
import { api } from '../api/client';

const DORM_BANNER_IMG = '/src/assets/images/dorm_campus_greens_1795288880551.jpg';

interface LeaderboardViewProps {
  snapshot: WorkspaceSnapshot;
  onSnapshotUpdated: (snapshot: WorkspaceSnapshot) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  snapshot,
  onSnapshotUpdated,
}) => {
  const [timeframe, setTimeframe] = useState<'monthly' | 'weekly'>('monthly');
  const [switchingDorm, setSwitchingDorm] = useState(false);

  const sortedDorms = [...snapshot.dorms].sort((a, b) =>
    timeframe === 'monthly' ? b.totalLbs - a.totalLbs : b.weeklyLbs - a.weeklyLbs
  );
  const topLbs = Math.max(
    1,
    ...sortedDorms.map((d) => (timeframe === 'monthly' ? d.totalLbs : d.weeklyLbs))
  );

  const handleJoinDorm = async (dormId: string) => {
    setSwitchingDorm(true);
    try {
      const updated = await api.updateProfile(snapshot.workspace, { dormId });
      onSnapshotUpdated(updated);
    } finally {
      setSwitchingDorm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Header with Real Campus Photo + Measured Scrim */}
      <div className="relative overflow-hidden rounded-2xl border border-[#143326]/15 min-h-[210px] flex items-end">
        <img
          src={DORM_BANNER_IMG}
          alt="USF residence hall courtyard with campus compost station"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D2118]/90 via-[#143326]/55 to-transparent" />
        <div className="relative z-10 w-full p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
          <div>
            <p className="text-xs font-medium text-[#BEF264]">
              Dorm vs. Dorm Composting Competition ·{' '}
              {snapshot.isDemo
                ? 'Sample USF Residence Hall Data (Demonstration)'
                : 'Live Campus Residence Hall Totals'}
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">
              USF Residence Hall Leaderboard
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-white/85 max-w-xl">
              Join a residence hall team to contribute verified compost pounds. Individual student identities and
              deposits stay private.
            </p>
          </div>

          <div className="inline-flex rounded-xl bg-white/15 backdrop-blur-xs p-1 border border-white/20 shrink-0">
            <button
              type="button"
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                timeframe === 'monthly' ? 'bg-[#84CC16] text-[#143326]' : 'text-white hover:bg-white/10'
              }`}
            >
              Monthly Standings
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                timeframe === 'weekly' ? 'bg-[#84CC16] text-[#143326]' : 'text-white hover:bg-white/10'
              }`}
            >
              Weekly Progress
            </button>
          </div>
        </div>
      </div>

      {/* Main Split: Leaderboard + Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Dorm Rankings */}
        <div className="lg:col-span-7 rounded-2xl border border-[#143326]/15 bg-white p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#143326]/10 pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#B45309]" />
              <h2 className="font-display text-lg font-semibold text-[#143326]">
                {timeframe === 'monthly' ? 'Monthly Residence Hall Rankings' : 'This Week’s Compost Sprint'}
              </h2>
            </div>
            <span className="text-xs text-[#143326]/65">
              {snapshot.isDemo ? 'Sample demonstration totals' : 'Verified deposits only'}
            </span>
          </div>

          <div className="space-y-3">
            {sortedDorms.map((dorm, index) => {
              const valueLbs = timeframe === 'monthly' ? dorm.totalLbs : dorm.weeklyLbs;
              const barPct = Math.max(4, Math.round((valueLbs / topLbs) * 100));
              const isMyDorm = snapshot.student.dormId === dorm.id;

              return (
                <div
                  key={dorm.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    isMyDorm
                      ? 'border-[#15803D]/40 bg-[#ECFDF5]/45'
                      : 'border-[#143326]/12 bg-[#FAF8F3]/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg font-mono-data text-sm font-bold shrink-0 ${
                          index === 0
                            ? 'bg-[#FEF3C7] text-[#B45309]'
                            : index === 1
                            ? 'bg-[#E2E8F0] text-[#334155]'
                            : index === 2
                            ? 'bg-[#FFEDD5] text-[#9A3412]'
                            : 'bg-white border border-[#143326]/15 text-[#143326]/70'
                        }`}
                      >
                        {index < 3 ? <Medal className="h-4 w-4" /> : `#${index + 1}`}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-base font-semibold text-[#143326]">
                            {dorm.name}
                          </h3>
                          {isMyDorm && (
                            <span className="text-xs font-semibold text-[#15803D]">· Your Team</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#143326]/65">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {dorm.participatingStudents} students
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-data">{dorm.lbsPerStudent.toFixed(1)} lbs/student</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-mono-data text-lg font-semibold text-[#143326]">
                          {valueLbs.toFixed(1)} <span className="text-xs font-normal">lbs</span>
                        </div>
                        <div className="text-[11px] text-[#143326]/60">
                          {timeframe === 'monthly' ? 'Cumulative' : 'This week'}
                        </div>
                      </div>

                      {!isMyDorm && (
                        <button
                          type="button"
                          disabled={switchingDorm}
                          onClick={() => void handleJoinDorm(dorm.id)}
                          className="rounded-lg border border-[#143326]/20 bg-white px-2.5 py-1.5 text-xs font-medium text-[#143326] hover:bg-[#143326] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Join Team
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 h-2 w-full rounded-full bg-[#143326]/10 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        index === 0 ? 'bg-[#15803D]' : 'bg-[#4F775A]'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Personal Achievement Badges & Team Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-[#143326]/15 bg-white p-5">
            <div className="flex items-center gap-2 text-[#143326]">
              <Building2 className="h-5 w-5 text-[#15803D]" />
              <h2 className="font-display text-base font-semibold">Your Residence Hall Team</h2>
            </div>
            <p className="mt-1 text-xs text-[#143326]/70">
              Currently representing{' '}
              <span className="font-semibold text-[#143326]">
                {snapshot.dorms.find((d) => d.id === snapshot.student.dormId)?.name || 'Juniper Hall'}
              </span>{' '}
              (Ranked <span className="font-mono-data font-semibold">#{snapshot.studentDormRank}</span>). Every
              verified deposit you complete boosts your hall’s score.
            </p>
          </div>

          <div className="rounded-2xl border border-[#143326]/15 bg-white p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#15803D]" />
              <h2 className="font-display text-base font-semibold text-[#143326]">
                Composting Achievement Badges
              </h2>
            </div>

            <div className="space-y-2.5">
              {snapshot.achievements.map((badge) => (
                <div
                  key={badge.id}
                  className={`rounded-xl border p-3 flex items-start justify-between gap-3 ${
                    badge.unlocked
                      ? 'border-[#15803D]/30 bg-[#ECFDF5]/60'
                      : 'border-[#143326]/12 bg-[#FAF8F3]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      {badge.unlocked && <CheckCircle2 className="h-4 w-4 text-[#15803D]" />}
                      <span className="font-display text-sm font-semibold text-[#143326]">
                        {badge.title}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#143326]/70">{badge.description}</p>
                  </div>
                  <span className="font-mono-data text-[11px] font-medium text-[#143326]/75 shrink-0">
                    {badge.progressText}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
