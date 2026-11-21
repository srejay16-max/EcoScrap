import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Globe2, Info, Leaf, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EPA_WARM_FACTORS, type EcoImpactMetrics } from '../shared/compostingRules';

interface EcoImpactStripProps {
  impact: EcoImpactMetrics;
  isDemo: boolean;
  onUpdateGoal?: (goalLbs: number) => void;
  defaultExpanded?: boolean;
  compact?: boolean;
}

export const EcoImpactStrip: React.FC<EcoImpactStripProps> = ({
  impact,
  isDemo,
  onUpdateGoal,
  defaultExpanded = false,
  compact = true,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    setPulseKey((prev) => prev + 1);
  }, [impact.verifiedLbs]);

  return (
    <section
      aria-label="EcoImpact Environmental Tracker"
      className="rounded-2xl border border-[#143326]/15 bg-white shadow-xs overflow-hidden"
    >
      {/* Compact Header Strip */}
      <div className="bg-[#143326] text-[#FAF8F3] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              key={pulseKey}
              initial={{ scale: 0.9, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#84CC16]/20 text-[#BEF264] border border-[#84CC16]/30 shrink-0"
            >
              <Globe2 className="h-5 w-5" aria-hidden="true" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2 text-xs text-[#BEF264]">
                <span className="font-semibold tracking-tight">EcoImpact Tracker</span>
                <span aria-hidden="true">·</span>
                <span>{isDemo ? 'Simulated Verified Deposits' : 'Verified Campus Deposits Only'}</span>
              </div>
              <p className="text-xs text-[#FAF8F3]/75 mt-0.5">
                Measured food waste diverted &amp; illustrative EPA WARM lifecycle comparison
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#FAF8F3]/20 bg-[#FAF8F3]/10 px-3 py-1.5 text-xs font-medium text-[#FAF8F3] hover:bg-[#FAF8F3]/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Info className="h-3.5 w-3.5 text-[#BEF264]" aria-hidden="true" />
            <span>{expanded ? 'Hide Calculation Breakdown' : 'How we calculate this'}</span>
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Three Main Metrics Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Metric 1: Food Waste Diverted */}
          <motion.div
            key={`lbs-${pulseKey}`}
            initial={{ opacity: 0.85, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl bg-[#FAF8F3]/8 border border-[#FAF8F3]/12 px-4 py-3"
          >
            <div className="flex items-center justify-between text-xs text-[#FAF8F3]/75">
              <span>1. Food Waste Diverted (Measured)</span>
              <Scale className="h-3.5 w-3.5 text-[#BEF264]" aria-hidden="true" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-mono-data text-2xl font-semibold text-white">
                {impact.verifiedLbs.toFixed(1)}
              </span>
              <span className="text-xs text-[#BEF264] font-medium">lbs</span>
            </div>
            <p className="mt-1 text-xs text-[#FAF8F3]/80">
              {impact.verifiedLbs.toFixed(1)} lbs diverted from landfill disposal.
            </p>
          </motion.div>

          {/* Metric 2: Estimated Carbon Emissions Avoided */}
          <motion.div
            key={`co2-${pulseKey}`}
            initial={{ opacity: 0.85, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl bg-[#FAF8F3]/8 border border-[#FAF8F3]/12 px-4 py-3"
          >
            <div className="flex items-center justify-between text-xs text-[#FAF8F3]/75">
              <span>2. Est. Carbon Emissions Avoided</span>
              <Leaf className="h-3.5 w-3.5 text-[#BEF264]" aria-hidden="true" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-mono-data text-2xl font-semibold text-white">
                {impact.estimatedKgCo2eAvoided.toFixed(1)}
              </span>
              <span className="text-xs text-[#BEF264] font-medium">kg CO₂e</span>
            </div>
            <p className="mt-1 text-xs text-[#FAF8F3]/80">
              Estimated {impact.estimatedKgCo2eAvoided.toFixed(1)} kg CO₂e avoided (illustrative EPA WARM estimate).
            </p>
          </motion.div>

          {/* Metric 3: Environmental Progress */}
          <div className="rounded-xl bg-[#FAF8F3]/8 border border-[#FAF8F3]/12 px-4 py-3">
            <div className="flex items-center justify-between text-xs text-[#FAF8F3]/75">
              <span>3. Monthly Goal Progress</span>
              <span className="font-mono-data text-xs text-[#BEF264]">
                {impact.verifiedLbs.toFixed(1)} / {impact.monthlyGoalLbs.toFixed(1)} lbs
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-mono-data text-2xl font-semibold text-white">
                {impact.monthlyGoalPercent}%
              </span>
              <span className="text-xs text-[#FAF8F3]/75">of {impact.monthlyGoalLbs} lb goal</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-[#FAF8F3]/15 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#84CC16]"
                initial={{ width: 0 }}
                animate={{ width: `${impact.monthlyGoalPercent}%` }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <p className="mt-1.5 text-xs text-[#FAF8F3]/80">
              {impact.monthlyGoalPercent}% of your monthly composting goal reached.
            </p>
          </div>
        </div>
      </div>

      {/* Expandable Methodology & Breakdown */}
      <AnimatePresence initial={false}>
        {(expanded || !compact) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-[#143326]/10 bg-[#FAF8F3] px-5 py-4 text-sm text-[#143326]"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-2.5">
                <h4 className="font-display text-sm font-semibold text-[#143326]">
                  How we calculate EcoImpact ({EPA_WARM_FACTORS.methodologyName})
                </h4>
                <p className="text-xs leading-relaxed text-[#143326]/80">
                  Measured scrap weight (<span className="font-mono-data font-medium">{impact.verifiedLbs.toFixed(1)} lbs</span>) comes
                  strictly from station-verified deposits—photos alone never count. Estimated CO₂e avoided is modeled
                  separately by comparing two documented EPA Waste Reduction Model (WARM) pathways for food waste:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl border border-[#143326]/12 bg-white p-3">
                    <div className="text-xs font-semibold text-[#B91C1C]">
                      Baseline Scenario: Landfill Disposal
                    </div>
                    <p className="mt-1 text-xs text-[#143326]/75 leading-relaxed">
                      Anaerobic food decomposition emits methane gas. Even with U.S. average landfill gas capture,
                      net lifecycle impact is approx. <span className="font-mono-data font-medium">+0.25 kg CO₂e/lb</span>{' '}
                      (your batch baseline: <span className="font-mono-data">+{impact.landfillBaselineKgCo2e.toFixed(2)} kg CO₂e</span>).
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#143326]/12 bg-white p-3">
                    <div className="text-xs font-semibold text-[#15803D]">
                      Composting Scenario: Aerobic Processing
                    </div>
                    <p className="mt-1 text-xs text-[#143326]/75 leading-relaxed">
                      Accounts for hauling &amp; windrow turning energy, offset by avoided methane and soil carbon storage:
                      approx. <span className="font-mono-data font-medium">-0.09 kg CO₂e/lb</span>{' '}
                      (net delta: <span className="font-mono-data font-semibold">0.34 kg CO₂e avoided/lb</span>).
                    </p>
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed text-[#143326]/65">
                  Assumptions &amp; boundaries: {EPA_WARM_FACTORS.transportAndProcessingDeductionNote} Goal progress
                  percentage ({impact.monthlyGoalPercent}%) tracks weight diverted toward your personal monthly target and
                  does not claim an overall percentage reduction in campus carbon emissions.
                </p>
              </div>

              <div className="rounded-xl border border-[#143326]/12 bg-white p-4 flex flex-col justify-between">
                <div>
                  <h5 className="font-display text-sm font-semibold text-[#143326]">
                    Personal Monthly Composting Goal
                  </h5>
                  <p className="mt-1 text-xs text-[#143326]/70">
                    Adjust your monthly target baseline (lbs of verified scraps).
                  </p>
                </div>
                {onUpdateGoal && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[5, 10, 15, 25].map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => onUpdateGoal(goal)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono-data font-medium transition-colors cursor-pointer ${
                          impact.monthlyGoalLbs === goal
                            ? 'bg-[#143326] text-white'
                            : 'bg-[#FAF8F3] text-[#143326] border border-[#143326]/15 hover:bg-[#143326]/5'
                        }`}
                      >
                        {goal} lbs
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
