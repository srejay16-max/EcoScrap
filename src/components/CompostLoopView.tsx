import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Leaf,
  RefreshCw,
  Scale,
  Sprout,
  Trees,
} from 'lucide-react';
import {
  BOTANICAL_PROCESS_CONSTANTS,
  calculateBotanicalProjection,
} from '../shared/compostingRules';
import type { WorkspaceSnapshot } from '../types';

const HERO_BOTANICAL_IMG = '/src/assets/images/hero_usf_botanical_1795288880544.jpg';
const SOIL_ENRICHMENT_IMG = '/src/assets/images/garden_soil_enrichment_1795288879839.jpg';

const LOOP_STAGES = [
  {
    step: 1,
    title: 'Campus Food Scraps',
    short: 'Dining & Dorm Organics',
    icon: Leaf,
    detail:
      'Students generate eligible fruit peels, vegetable trimmings, coffee grounds, and plant scraps across USF dining halls and residence halls.',
    control: 'Tracked source: Participating student & dining prep stations.',
  },
  {
    step: 2,
    title: 'AI Sorting & Contamination Prevention',
    short: 'ScrapCheck Vision',
    icon: CheckCircle2,
    detail:
      'EcoScrap’s Gemini Vision scanner flags plastic forks, wrappers, and bioplastics before scraps ever reach a collection bin.',
    control: 'Rule profile: City of Tampa Backyard Guidance (or configurable USF Commercial rules).',
  },
  {
    step: 3,
    title: 'Verified Collection',
    short: 'Station Scale & Staff Check',
    icon: Scale,
    detail:
      'Students bring cleared scraps to campus kiosks where trained staff inspect contents and record verified scale weight in pounds.',
    control: 'Only verified station weights enter the campus organics ledger.',
  },
  {
    step: 4,
    title: 'Compost Processing & Quality Control',
    short: 'Thermophilic Breakdown (~38% Yield)',
    icon: FlaskConical,
    detail:
      'Eligible scraps enter controlled composting with carbon-rich woodchips and leaves. Moisture evaporation and microbial respiration reduce raw weight by ~62%, leaving nutrient-dense humus.',
    control: 'Quality checks: Temperature pathogen kill, screening, and plastic-free inspection.',
  },
  {
    step: 5,
    title: 'Botanical Gardens Soil Enrichment',
    short: 'Proposed Partnership Output',
    icon: Sprout,
    detail:
      'Under EcoScrap’s proposed USF Botanical Gardens partnership, finished QA-passed compost could support garden beds, educational plots, and campus horticulture—potentially reducing externally purchased soil amendments.',
    control: 'Status: Proposed Partnership / Future Campus Integration (not yet active).',
  },
];

interface CompostLoopViewProps {
  snapshot: WorkspaceSnapshot;
}

export const CompostLoopView: React.FC<CompostLoopViewProps> = ({ snapshot }) => {
  const [activeStage, setActiveStage] = useState<number>(1);
  const actualVerifiedCampusLbs = snapshot.adminMetrics.totalCollectedLbs;
  const [simulatedInputLbs, setSimulatedInputLbs] = useState<number>(
    Math.max(50, Math.round(actualVerifiedCampusLbs || 120))
  );

  const actualProjection = calculateBotanicalProjection(actualVerifiedCampusLbs);
  const whatIfProjection = calculateBotanicalProjection(simulatedInputLbs);
  const selectedStageObj = LOOP_STAGES.find((s) => s.step === activeStage) || LOOP_STAGES[0];

  return (
    <div className="space-y-6">
      {/* Proposed Partnership Notice Banner */}
      <div className="rounded-2xl border border-[#78593A]/30 bg-[#FEFCE8] px-5 py-4 text-[#143326]">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#78593A]">
          <Trees className="h-4 w-4" />
          <span>Proposed Partnership · Future Campus Integration Concept</span>
        </div>
        <p className="mt-1 text-xs sm:text-sm text-[#143326]/85 leading-relaxed">
          EcoScrap’s long-term vision is a circular campus partnership with the{' '}
          <span className="font-semibold">USF Botanical Gardens</span>. This integration is currently{' '}
          <span className="font-semibold">proposed and not officially established</span>—the USF Botanical Gardens do
          not currently accept EcoScrap deposits, and all garden deliveries below are illustrative projections.
        </p>
      </div>

      {/* Hero Editorial Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 rounded-2xl border border-[#143326]/15 bg-white p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-[#4F775A]">
              Campus Compost Loop · Circular USF Sustainability
            </p>
            <h1 className="mt-1.5 text-2xl sm:text-3xl font-semibold tracking-tight text-[#143326]">
              From Scraps to Soil: Keeping Campus Nutrients in Tampa
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-[#143326]/80">
              Today, most food waste leaves campus for disposal while garden operations purchase and haul soil
              amendments from outside suppliers. EcoScrap’s proposed loop connects student dining behavior directly to
              living campus ecosystems.
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#143326]/85">
              <div className="rounded-xl bg-[#FAF8F3] border border-[#143326]/10 p-3">
                <span className="font-semibold text-[#143326] block">Divert Landfill Organics</span>
                Reduce food scraps sent to landfill disposal and methane generation.
              </div>
              <div className="rounded-xl bg-[#FAF8F3] border border-[#143326]/10 p-3">
                <span className="font-semibold text-[#143326] block">Local Soil Amendment</span>
                Convert clean campus scraps into screened compost for horticultural beds.
              </div>
              <div className="rounded-xl bg-[#FAF8F3] border border-[#143326]/10 p-3">
                <span className="font-semibold text-[#143326] block">Displace External Hauling</span>
                Potentially reduce reliance on externally purchased and transported compost.
              </div>
              <div className="rounded-xl bg-[#FAF8F3] border border-[#143326]/10 p-3">
                <span className="font-semibold text-[#143326] block">Tangible Student Learning</span>
                Support garden workshops and connect student habits to visible campus growth.
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative overflow-hidden rounded-2xl border border-[#143326]/15 min-h-[260px]">
          <img
            src={HERO_BOTANICAL_IMG}
            alt="Subtropical botanical garden beds in warm Florida sunlight"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D2118]/85 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="text-xs font-medium text-[#BEF264]">Proposed Future Campus Partner</div>
            <div className="font-display text-base font-semibold">
              USF Botanical Gardens Soil Enrichment Concept
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 5-Stage Circular Flow Diagram */}
      <div className="rounded-2xl border border-[#143326]/15 bg-white p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#143326]">
              Interactive 5-Stage Campus Compost Loop
            </h2>
            <p className="text-xs text-[#143326]/70">
              Select any stage in the circular loop to inspect quality controls and processing steps.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4F775A]">
            <RefreshCw className="h-3.5 w-3.5" />
            Closed-Loop Circular Model
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {LOOP_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isActive = activeStage === stage.step;
            return (
              <div key={stage.step} className="flex items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => setActiveStage(stage.step)}
                  className={`flex-1 text-left rounded-xl border p-3.5 transition-colors cursor-pointer ${
                    isActive
                      ? 'border-[#143326] bg-[#143326] text-white'
                      : 'border-[#143326]/15 bg-[#FAF8F3] text-[#143326] hover:bg-[#ECFDF5]/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono-data text-xs font-semibold ${
                        isActive ? 'text-[#BEF264]' : 'text-[#4F775A]'
                      }`}
                    >
                      0{stage.step}
                    </span>
                    <Icon
                      className={`h-4 w-4 ${isActive ? 'text-[#BEF264]' : 'text-[#15803D]'}`}
                    />
                  </div>
                  <div className="mt-2 font-display text-sm font-semibold leading-snug">
                    {stage.title}
                  </div>
                  <div
                    className={`mt-1 text-[11px] ${
                      isActive ? 'text-white/75' : 'text-[#143326]/65'
                    }`}
                  >
                    {stage.short}
                  </div>
                </button>
                {idx < LOOP_STAGES.length - 1 && (
                  <div className="hidden md:flex items-center text-[#143326]/30">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-[#143326]/12 bg-[#FAF8F3] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-[#15803D]">
              Stage 0{selectedStageObj.step} Details
            </div>
            <h3 className="font-display text-base font-semibold text-[#143326]">
              {selectedStageObj.title}
            </h3>
            <p className="text-xs leading-relaxed text-[#143326]/80 max-w-3xl">
              {selectedStageObj.detail}
            </p>
          </div>
          <div className="rounded-lg border border-[#143326]/12 bg-white px-3.5 py-2.5 text-xs text-[#143326]/75 sm:max-w-xs shrink-0">
            {selectedStageObj.control}
          </div>
        </div>
      </div>

      {/* Interactive "From Scraps to Soil" Mass-Balance Demo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 rounded-2xl border border-[#143326]/15 bg-white p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-[#78593A]">
                Interactive Simulation · Proposed Partnership Model
              </span>
              <h2 className="mt-0.5 font-display text-xl font-semibold text-[#143326]">
                From Scraps to Soil — Mass-Balance Projection
              </h2>
              <p className="mt-1 text-xs text-[#143326]/75 max-w-2xl">
                Raw food scrap weight never equals finished compost weight. During active composting, ~62% of raw
                scrap mass leaves as water vapor and microbial CO₂ respiration, yielding ~38% screened compost.
              </p>
            </div>
          </div>

          {/* Interactive Scenario Slider */}
          <div className="rounded-xl border border-[#143326]/12 bg-[#FAF8F3] p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <label htmlFor="scrap-sim-slider" className="font-semibold text-[#143326]">
                Simulate Campus Verified Scraps Collected:
              </label>
              <div className="flex items-center gap-3">
                <span className="font-mono-data text-base font-semibold text-[#15803D]">
                  {simulatedInputLbs} lbs raw scraps
                </span>
                <button
                  type="button"
                  onClick={() => setSimulatedInputLbs(Math.max(1, Math.round(actualVerifiedCampusLbs)))}
                  className="text-[11px] font-medium underline text-[#143326]/75 hover:text-[#143326] cursor-pointer"
                >
                  Sync to Current Campus Ledger ({actualVerifiedCampusLbs.toFixed(1)} lbs)
                </button>
              </div>
            </div>
            <input
              id="scrap-sim-slider"
              type="range"
              min={5}
              max={1000}
              step={5}
              value={simulatedInputLbs}
              onChange={(e) => setSimulatedInputLbs(Number(e.target.value))}
              className="w-full accent-[#15803D] cursor-pointer"
            />
          </div>

          {/* 5 Separate Tracked Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="rounded-xl border border-[#143326]/12 bg-white p-3.5">
              <div className="text-[11px] text-[#143326]/65">1. Verified Scraps Collected</div>
              <div className="mt-1 font-mono-data text-lg font-semibold text-[#143326]">
                {whatIfProjection.verifiedScrapsCollectedLbs.toFixed(1)} lbs
              </div>
              <div className="mt-1 text-[11px] text-[#143326]/60">
                Ledger: {actualProjection.verifiedScrapsCollectedLbs.toFixed(1)} lbs
              </div>
            </div>

            <div className="rounded-xl border border-[#143326]/12 bg-white p-3.5">
              <div className="text-[11px] text-[#143326]/65">2. Entering Processing</div>
              <div className="mt-1 font-mono-data text-lg font-semibold text-[#143326]">
                {whatIfProjection.enteringProcessingLbs.toFixed(1)} lbs
              </div>
              <div className="mt-1 text-[11px] text-[#143326]/60">Assumes 95% QA intake</div>
            </div>

            <div className="rounded-xl border border-[#143326]/12 bg-[#ECFDF5]/60 p-3.5">
              <div className="text-[11px] text-[#15803D] font-medium">3. Finished Compost Yield</div>
              <div className="mt-1 font-mono-data text-lg font-semibold text-[#15803D]">
                {whatIfProjection.projectedFinishedCompostLbs.toFixed(1)} lbs
              </div>
              <div className="mt-1 text-[11px] text-[#143326]/65">
                {Math.round(BOTANICAL_PROCESS_CONSTANTS.finishedCompostYieldRatio * 100)}% after moisture loss
              </div>
            </div>

            <div className="rounded-xl border border-[#143326]/12 bg-white p-3.5">
              <div className="text-[11px] text-[#143326]/65">4. Proposed Garden Delivery</div>
              <div className="mt-1 font-mono-data text-lg font-semibold text-[#143326]">
                {whatIfProjection.projectedDeliverableToGardensLbs.toFixed(1)} lbs
              </div>
              <div className="mt-1 text-[11px] text-[#78593A]">Projected only · Not active</div>
            </div>

            <div className="rounded-xl border border-[#143326]/12 bg-white p-3.5">
              <div className="text-[11px] text-[#143326]/65">5. Est. External Bags Displaced</div>
              <div className="mt-1 font-mono-data text-lg font-semibold text-[#143326]">
                {whatIfProjection.projectedExternalBagsDisplaced.toFixed(1)} bags
              </div>
              <div className="mt-1 text-[11px] text-[#143326]/60">
                ~${whatIfProjection.projectedExternalSpendDisplacedUsd.toFixed(0)} est. (40-lb bags)
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-2xl border border-[#143326]/15 bg-white overflow-hidden flex flex-col">
          <div className="aspect-[4/3] w-full overflow-hidden">
            <img
              src={SOIL_ENRICHMENT_IMG}
              alt="Rich finished dark compost soil supporting healthy garden seedlings"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold text-[#143326]">
                From Scraps to Nutrient-Rich Soil
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#143326]/75">
                All finished compost yields and external bag displacement figures are illustrative engineering
                estimates for a future USF Botanical Gardens agreement.
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-[#143326]/10 text-[11px] text-[#143326]/60">
              Assumptions: 62% evaporation/respiration mass loss · 40-lb commercial compost bag equivalent ($8.50/bag).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
