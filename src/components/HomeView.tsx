import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  Bot,
  Building2,
  CheckCircle2,
  ExternalLink,
  Leaf,
  MessageSquareText,
  RotateCw,
  Scale,
  Trophy,
} from 'lucide-react';
import type { NavTab, WorkspaceSnapshot } from '../types';
import { EcoImpactStrip } from './EcoImpactStrip';
import { api } from '../api/client';

const ECOBOT_EXTERNAL_URL = 'https://ecobot-food-waste-scanner.ai.studio';

interface HomeViewProps {
  snapshot: WorkspaceSnapshot;
  onNavigate: (tab: NavTab) => void;
  onSnapshotUpdated: (snapshot: WorkspaceSnapshot) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  snapshot,
  onNavigate,
  onSnapshotUpdated,
}) => {
  const [scannerIframeKey, setScannerIframeKey] = useState(0);
  const handleUpdateGoal = async (goalLbs: number) => {
    try {
      const updated = await api.updateProfile(snapshot.workspace, { monthlyGoalLbs: goalLbs });
      onSnapshotUpdated(updated);
    } catch {
      // Ignore transient errors
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="rounded-2xl border border-[#143326]/15 bg-white p-6 sm:p-8 flex flex-col justify-between gap-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#4F775A]">
            <span>EcoScrap · USF Tampa Campus Pilot</span>
            <span aria-hidden="true">·</span>
            <span>From Scraps to Soil.</span>
          </div>

          <h1 className="text-[clamp(2rem,3.6vw,3.1rem)] font-semibold tracking-tight leading-[1.08] text-[#143326] text-balance">
            Your Food Scraps Can Grow Something Greater.
          </h1>

          <p className="text-base leading-relaxed text-[#143326]/80 max-w-2xl">
            Scan food waste, compost correctly, earn rewards, and help build a greener USF.
          </p>

          <p className="text-sm font-medium text-[#15803D]">
            &ldquo;Don&rsquo;t just throw it away. Grow something greater.&rdquo;
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('scanner')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#143326] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1E4A38] transition-colors whitespace-nowrap cursor-pointer"
          >
            <MessageSquareText className="h-4 w-4 text-[#BEF264]" aria-hidden="true" />
            Open AI Waste Scanner
          </button>
        </div>
      </section>

      {/* Embedded AI Waste Scanner on Home Screen */}
      <section className="rounded-2xl border border-[#143326]/15 bg-white overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#143326]/10 bg-[#FAF8F3] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#143326] text-[#BEF264]">
              <Bot className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-display text-sm sm:text-base font-semibold text-[#143326]">
                AI Waste Scanner
              </h2>
              <p className="text-[11px] text-[#4F775A]">
                Upload a photo to sort Compost, Recycle &amp; Trash and find nearby USF drop-offs
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setScannerIframeKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#143326]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#143326] hover:bg-[#ECFDF5] cursor-pointer"
            >
              <RotateCw className="h-3.5 w-3.5 text-[#15803D]" />
              Reload
            </button>
            <button
              type="button"
              onClick={() => onNavigate('scanner')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#143326]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#143326] hover:bg-[#ECFDF5] cursor-pointer"
            >
              Full Scanner View
              <ArrowRight className="h-3.5 w-3.5 text-[#15803D]" />
            </button>
            <a
              href={ECOBOT_EXTERNAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#143326] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1E4A38]"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[#BEF264]" />
              Open Full Tab
            </a>
          </div>
        </div>

        <div className="relative w-full bg-[#FAF8F3]">
          <iframe
            key={scannerIframeKey}
            src={ECOBOT_EXTERNAL_URL}
            title="EcoBot AI Waste Scanner"
            allow="camera *; microphone *; geolocation *; clipboard-write *"
            className="w-full h-[580px] border-0 bg-white block"
          />
        </div>
      </section>

      {/* Full-Width 4-Column Quick Status & Workflow Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('scanner')}
          className="text-left rounded-2xl border border-[#143326]/15 bg-white p-5 hover:border-[#15803D]/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-medium text-[#4F775A]">
            <span>01. AI Waste Scanner</span>
            <CheckCircle2 className="h-4 w-4 text-[#15803D]" />
          </div>
          <div className="mt-2 font-display text-base font-semibold text-[#143326] group-hover:text-[#15803D] transition-colors">
            Sort &amp; Find Drop-Offs
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#143326]/70">
            Upload a photo to see what is compost, recycle, or trash and locate nearby USF drop-off spots.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#15803D]">
            Open AI Waste Scanner <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('deposits')}
          className="text-left rounded-2xl border border-[#143326]/15 bg-white p-5 hover:border-[#15803D]/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-medium text-[#4F775A]">
            <span>02. Dorm Station Weigh-In</span>
            <Scale className="h-4 w-4 text-[#15803D]" />
          </div>
          <div className="mt-2 font-display text-base font-semibold text-[#143326] group-hover:text-[#15803D] transition-colors">
            Dump &amp; Weigh Scraps
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#143326]/70">
            <span className="font-mono-data font-semibold">{snapshot.roomBin.batches.length}</span>{' '}
            in room bin ·{' '}
            <span className="font-mono-data font-semibold">{snapshot.student.verifiedWeightLbs.toFixed(1)}</span>{' '}
            lbs verified.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#15803D]">
            Dorm Bin &amp; Station View <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('rewards')}
          className="text-left rounded-2xl border border-[#143326]/15 bg-white p-5 hover:border-[#15803D]/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-medium text-[#4F775A]">
            <span>03. Compost 5. Get Energized.</span>
            <Award className="h-4 w-4 text-[#15803D]" />
          </div>
          <div className="mt-2 font-display text-base font-semibold text-[#143326] group-hover:text-[#15803D] transition-colors">
            EcoRewards Wallet
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#143326]/70">
            <span className="font-mono-data font-semibold">
              {snapshot.rewards.currentCycleLbs.toFixed(1)} / 5.0 lbs
            </span>{' '}
            toward your next simulated reward voucher.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#15803D]">
            View Wallet <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('compost-loop')}
          className="text-left rounded-2xl border border-[#143326]/15 bg-white p-5 hover:border-[#15803D]/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-medium text-[#78593A]">
            <span>04. Proposed Partnership</span>
            <Trophy className="h-4 w-4 text-[#78593A]" />
          </div>
          <div className="mt-2 font-display text-base font-semibold text-[#143326] group-hover:text-[#15803D] transition-colors">
            USF Botanical Loop
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#143326]/70">
            Explore how campus scraps could support future Botanical Gardens soil beds.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#15803D]">
            Explore Loop <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </button>
      </section>

      {/* Dorm Room Compost Bin + Dorm Standings Split Row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[#143326]/15 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#15803D] shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-[#143326]">
                My Dorm Room Compost Bin
              </h2>
              <p className="text-xs text-[#143326]/70">
                {snapshot.roomBin.batches.length > 0 ? (
                  <>
                    <span className="font-mono-data font-semibold text-[#15803D]">
                      {snapshot.roomBin.batches.length} batch{snapshot.roomBin.batches.length === 1 ? '' : 'es'} (~
                      {snapshot.roomBin.totalEstimatedLbs.toFixed(1)} lbs)
                    </span>{' '}
                    ready to dump at{' '}
                    {snapshot.stations.find((s) => s.dormId === snapshot.student.dormId)?.id || 'your dorm station'}.
                  </>
                ) : (
                  'Scan scraps to fill your in-room bin, then dump at your dorm building station at end of day or week.'
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(snapshot.roomBin.batches.length > 0 ? 'deposits' : 'scanner')}
            className="rounded-xl bg-[#143326] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E4A38] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {snapshot.roomBin.batches.length > 0 ? 'Dump at Dorm Station' : 'Scan Scraps'}
          </button>
        </div>

        <div className="rounded-2xl border border-[#143326]/15 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#15803D] shrink-0">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-[#143326]">
                Dorm vs. Dorm Composting Challenge
              </h2>
              <p className="text-xs text-[#143326]/70">
                Your team ({snapshot.dorms.find((d) => d.id === snapshot.student.dormId)?.name || 'Juniper Hall'}) is
                currently ranked <span className="font-mono-data font-semibold">#{snapshot.studentDormRank}</span>{' '}
                across USF residence halls.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('leaderboard')}
            className="rounded-xl border border-[#143326]/20 bg-[#FAF8F3] px-4 py-2 text-xs font-semibold text-[#143326] hover:bg-[#143326] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Open Leaderboard
          </button>
        </div>
      </section>

      {/* Prominent Compact EcoImpact Strip at Bottom of Dashboard */}
      <EcoImpactStrip
        impact={snapshot.ecoImpact}
        isDemo={snapshot.isDemo}
        onUpdateGoal={handleUpdateGoal}
        compact={true}
      />
    </div>
  );
};
