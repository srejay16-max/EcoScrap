import React, { useState } from 'react';
import {
  AlertCircle,
  Bot,
  Building2,
  ExternalLink,
  Globe2,
  MapPin,
  RotateCw,
} from 'lucide-react';
import { COMPOST_PROGRAMS } from '../shared/compostingRules';
import type { NavTab, ScanRecord, WorkspaceSnapshot } from '../types';

const ECOBOT_EXTERNAL_URL = 'https://ecobot-food-waste-scanner.ai.studio';

interface ChatbotViewProps {
  snapshot: WorkspaceSnapshot;
  onScanCompleted?: (scan: ScanRecord, snapshot: WorkspaceSnapshot, imageUrl: string) => void;
  onSnapshotUpdated?: (snapshot: WorkspaceSnapshot) => void;
  onNavigate: (tab: NavTab) => void;
}

export const ChatbotView: React.FC<ChatbotViewProps> = ({
  snapshot,
  onNavigate,
}) => {
  const homeStation =
    snapshot.stations.find((s) => s.dormId === snapshot.student.dormId) || snapshot.stations[0];

  const [iframeKey, setIframeKey] = useState(0);
  const program = COMPOST_PROGRAMS['tampa-backyard'];

  return (
    <div className="space-y-6 pb-16 relative">
      {/* Header + Program Rule Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#143326]/10 pb-5">
        <div>
          <p className="text-xs font-medium text-[#4F775A]">
            AI Waste Scanner
            <span aria-hidden="true"> · </span>
            <span>{program.authority}</span>
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[#143326]">
            Upload a photo to sort Compost, Recycle &amp; Trash
          </h1>
          <p className="mt-1.5 text-sm text-[#143326]/75 max-w-2xl">
            Ask EcoScrap AI what belongs in each bin and find the nearest USF dorm or campus drop-off station.
          </p>
        </div>

        {/* External Link */}
        <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
          <a
            href={ECOBOT_EXTERNAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D] hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open ecobot-food-waste-scanner.ai.studio in New Tab
          </a>
        </div>
      </div>

      {/* Main Split Workspace: Connected EcoBot + Dorm/Station Context */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Main Bot Workspace */}
        <div className="lg:col-span-8 rounded-2xl border border-[#143326]/15 bg-white flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#143326]/10 bg-[#FAF8F3] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#143326] text-[#BEF264]">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <div className="font-display text-sm font-semibold text-[#143326]">
                  EcoBot Food Waste Scanner
                </div>
                <div className="text-[11px] font-mono-data text-[#4F775A]">
                  {ECOBOT_EXTERNAL_URL}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIframeKey((k) => k + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#143326]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#143326] hover:bg-[#ECFDF5] cursor-pointer"
              >
                <RotateCw className="h-3.5 w-3.5 text-[#15803D]" />
                Reload
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
              key={iframeKey}
              src={ECOBOT_EXTERNAL_URL}
              title="EcoBot AI Waste Scanner"
              allow="camera *; microphone *; geolocation *; clipboard-write *"
              className="w-full h-[640px] border-0 bg-white block"
            />
          </div>
        </div>

        {/* Right Context Rail: Closest Dorm Station + Room Bin + Rules Guide */}
        <div className="lg:col-span-4 space-y-4">
          {/* Closest Station to Student's Dorm */}
          <div className="rounded-2xl border border-[#143326]/15 bg-white p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-[#4F775A]">
              <MapPin className="h-4 w-4 text-[#15803D]" />
              <span>Your Closest Drop-Off Location</span>
            </div>
            <div>
              <div className="font-display text-base font-semibold text-[#143326]">
                {homeStation?.name || 'Juniper Hall — Ground Floor Compost Station'}
              </div>
              <p className="mt-0.5 text-xs text-[#143326]/70">
                {homeStation?.location} ·{' '}
                <span className="font-mono-data font-semibold text-[#15803D]">
                  {homeStation?.id}
                </span>
              </p>
            </div>
            <p className="text-xs text-[#143326]/70">
              Compost smart scale hopper on-site; single-stream blue Recycling and Trash bins are right beside the
              building lobby exit.
            </p>
          </div>

          {/* Current Dorm Room Compost Bin */}
          <div className="rounded-2xl border border-[#143326]/15 bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#15803D]" />
                <h2 className="font-display text-sm font-semibold text-[#143326]">
                  My Dorm Room Compost Bin
                </h2>
              </div>
              <span className="font-mono-data text-xs font-semibold text-[#15803D]">
                {snapshot.roomBin.batches.length} batch{snapshot.roomBin.batches.length === 1 ? '' : 'es'}
              </span>
            </div>
            <p className="text-xs text-[#143326]/70">
              {snapshot.roomBin.batches.length > 0
                ? `~${snapshot.roomBin.totalEstimatedLbs.toFixed(
                    1
                  )} lbs waiting in your room bin. Bring to ${homeStation?.id} at end of day or week to weigh & earn EcoRewards.`
                : 'Upload a photo in the AI Waste Scanner to verify compostable scraps, then add them to your dorm room bin.'}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('deposits')}
              className="w-full rounded-xl border border-[#143326]/20 bg-[#FAF8F3] px-3.5 py-2 text-xs font-semibold text-[#143326] hover:bg-[#143326] hover:text-white transition-colors cursor-pointer"
            >
              Open Dorm Bin &amp; Station Weigh-In
            </button>
          </div>

          {/* 3-Stream Sorting Quick Reference */}
          <div className="rounded-2xl border border-[#143326]/15 bg-white p-5 space-y-3">
            <h2 className="font-display text-sm font-semibold text-[#143326]">
              USF &amp; Tampa 3-Bin Sorting Guide
            </h2>
            <div className="space-y-2 text-xs">
              <div className="rounded-xl bg-[#ECFDF5]/60 border border-[#15803D]/20 p-2.5">
                <span className="font-semibold text-[#15803D]">COMPOST: </span>
                <span className="text-[#143326]/80">
                  Fruit/veg scraps, coffee grounds, unbleached napkins, plain grains ({program.shortName}).
                </span>
              </div>
              <div className="rounded-xl bg-[#F0F9FF]/80 border border-[#0369A1]/20 p-2.5">
                <span className="font-semibold text-[#0369A1]">RECYCLE: </span>
                <span className="text-[#143326]/80">
                  Empty plastic bottles/jugs, aluminum cans, clean flattened cardboard.
                </span>
              </div>
              <div className="rounded-xl bg-[#FEF2F2]/75 border border-[#B91C1C]/20 p-2.5">
                <span className="font-semibold text-[#B91C1C]">TRASH: </span>
                <span className="text-[#143326]/80">
                  Plastic forks, film wrappers, styrofoam, coated cups, food-soiled packaging.
                </span>
              </div>
            </div>
            <p className="text-[11px] text-[#143326]/60 flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#4F775A]" />
              <span>{program.description}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Floating "View Impact" Action */}
      <button
        type="button"
        onClick={() => onNavigate('ecoimpact')}
        className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-xl bg-[#143326] px-4 py-2.5 text-xs font-semibold text-[#FAF8F3] shadow-lg border border-[#84CC16]/40 hover:bg-[#1E4A38] transition-colors cursor-pointer"
      >
        <Globe2 className="h-4 w-4 text-[#BEF264]" aria-hidden="true" />
        <span>View Impact</span>
        <span className="font-mono-data text-[#BEF264]">
          ({snapshot.ecoImpact.estimatedKgCo2eAvoided.toFixed(1)} kg CO₂e)
        </span>
      </button>
    </div>
  );
};
