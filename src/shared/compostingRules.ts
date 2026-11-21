export type CompostProgramId = 'tampa-backyard' | 'usf-commercial';

export type SortClassification = 'GREEN' | 'YELLOW' | 'RED';

export type MaterialCategory =
  | 'fruit_peel_core'
  | 'vegetable_scrap'
  | 'coffee_tea_grounds'
  | 'eggshells'
  | 'plain_grains_bread_rice'
  | 'paper_napkin_unbleached'
  | 'citrus_acidic_peels'
  | 'meat_bones_fish'
  | 'dairy_oil_grease'
  | 'plastic_utensil'
  | 'plastic_wrapper_film'
  | 'bioplastic_pla'
  | 'coated_paper_foil'
  | 'unknown_ambiguous';

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface ScannedItem {
  id: string;
  itemName: string;
  materialCategory: MaterialCategory;
  confidence: number;
  classification: SortClassification;
  explanation: string;
  disposalRecommendation: string;
  contaminationConcerns: string;
  needsClarification: boolean;
  clarificationQuestion?: string;
  clarificationResolved?: boolean;
  hasReliableBounds: boolean;
  boundingBox?: BoundingBox;
  separated: boolean;
}

export interface ScrapCheckSummary {
  isReadyToCompost: boolean;
  alertTone: 'ready' | 'warning' | 'danger' | 'empty';
  alertMessage: string;
  acceptedCount: number;
  uncertainCount: number;
  contaminantCount: number;
  separatedCount: number;
}

export interface CompostProgramRule {
  classification: SortClassification;
  explanation: string;
  disposalRecommendation: string;
  contaminationConcerns: string;
}

export interface CompostProgramConfig {
  id: CompostProgramId;
  name: string;
  shortName: string;
  authority: string;
  description: string;
  isDefault: boolean;
  rules: Record<MaterialCategory, CompostProgramRule>;
}

export const COMPOST_PROGRAMS: Record<CompostProgramId, CompostProgramConfig> = {
  'tampa-backyard': {
    id: 'tampa-backyard',
    name: 'City of Tampa Backyard Composting Guidance',
    shortName: 'City of Tampa Rules',
    authority: 'City of Tampa Solid Waste & Backyard Composting Guidelines',
    description:
      'Default campus rule profile modeled on City of Tampa backyard and residential bin guidance: fruit/vegetable scraps, coffee grounds, and eggshells are accepted; meats, dairy, oils, and plastics are strictly excluded.',
    isDefault: true,
    rules: {
      fruit_peel_core: {
        classification: 'GREEN',
        explanation: 'Nitrogen-rich fruit scraps break down cleanly in backyard and campus compost piles.',
        disposalRecommendation: 'Place in your EcoScrap compost bin or bring to a participating USF station.',
        contaminationConcerns: 'Remove any produce stickers (PLU plastic labels) before composting.',
      },
      vegetable_scrap: {
        classification: 'GREEN',
        explanation: 'Raw and steamed plant-based vegetable scraps are core green feedstock.',
        disposalRecommendation: 'Compost directly. Chop bulky stems into smaller pieces for faster breakdown.',
        contaminationConcerns: 'Ensure scraps are not coated in heavy butter, meat gravy, or salad oil.',
      },
      coffee_tea_grounds: {
        classification: 'GREEN',
        explanation: 'Coffee grounds and natural paper filters add valuable nitrogen and trace minerals.',
        disposalRecommendation: 'Compost grounds and unbleached paper filters together.',
        contaminationConcerns: 'Check tea bags for synthetic mesh, nylon sachets, or metal staples.',
      },
      eggshells: {
        classification: 'GREEN',
        explanation: 'Eggshells supply calcium carbonate that helps balance compost pile pH.',
        disposalRecommendation: 'Rinse lightly and crush shells before adding to your compost container.',
        contaminationConcerns: 'Avoid adding raw egg yolk or liquid whites to backyard bins.',
      },
      plain_grains_bread_rice: {
        classification: 'YELLOW',
        explanation: 'Plain cooked rice, bread, or pasta can decompose, but large quantities attract pests in backyard bins.',
        disposalRecommendation: 'Verify that grains are plain (no oil, butter, or meat sauce) and bury under brown leaves.',
        contaminationConcerns: 'Sauced, greasy, or dairy-topped grains violate City of Tampa backyard rules.',
      },
      paper_napkin_unbleached: {
        classification: 'YELLOW',
        explanation: 'Clean or lightly damp unbleached paper napkins act as helpful carbon browns.',
        disposalRecommendation: 'Verify no grease, meat residue, or chemical spray before composting.',
        contaminationConcerns: 'Oil-soaked, bleached/printed, or sanitizer-wet wipes must go to trash.',
      },
      citrus_acidic_peels: {
        classification: 'YELLOW',
        explanation: 'Citrus peels are plant matter, though large amounts can temporarily acidify backyard piles.',
        disposalRecommendation: 'Accepted in moderation when mixed with dry browns and other fruit scraps.',
        contaminationConcerns: 'Remove plastic mesh bags or produce stickers.',
      },
      meat_bones_fish: {
        classification: 'RED',
        explanation: 'Meat, poultry, fish, and bones are prohibited in City of Tampa backyard composting.',
        disposalRecommendation: 'Separate and place in landfill waste unless using an industrial high-heat facility.',
        contaminationConcerns: 'Causes severe odors, attracts rodents, and harbors pathogens in ambient piles.',
      },
      dairy_oil_grease: {
        classification: 'RED',
        explanation: 'Cheese, dairy, cooking oils, and greasy dressings coat organics and block oxygen flow.',
        disposalRecommendation: 'Do not compost. Dispose of solid dairy in trash and collect waste cooking oil separately.',
        contaminationConcerns: 'Creates anaerobic rot, rancid odors, and pest issues.',
      },
      plastic_utensil: {
        classification: 'RED',
        explanation: 'Conventional petroleum plastic forks, spoons, and knives never biodegrade in compost.',
        disposalRecommendation: 'Remove immediately and place in trash or clean campus recycling if accepted.',
        contaminationConcerns: 'Major physical contaminant—fragments remain as microplastics in finished soil.',
      },
      plastic_wrapper_film: {
        classification: 'RED',
        explanation: 'Chip bags, snack wrappers, plastic film, and condiment packets are non-compostable.',
        disposalRecommendation: 'Separate and discard in trash (or specialized film drop-off if clean).',
        contaminationConcerns: 'Shreds into persistent plastic litter that spoils garden soil quality.',
      },
      bioplastic_pla: {
        classification: 'RED',
        explanation: 'Plant-based "compostable" PLA cups and utensils require sustained industrial heat (>131°F) unavailable in backyard systems.',
        disposalRecommendation: 'Keep out of City of Tampa backyard compost piles; place in trash unless sent to an industrial facility.',
        contaminationConcerns: 'Remains intact for years in ambient compost piles and triggers batch rejection.',
      },
      coated_paper_foil: {
        classification: 'RED',
        explanation: 'Plastic-lined coffee cups, waxy cartons, and aluminum foil cannot safely break down.',
        disposalRecommendation: 'Place foil in clean metal recycling and lined paper cups in trash.',
        contaminationConcerns: 'Hidden polyethylene liners leach microplastics into compost.',
      },
      unknown_ambiguous: {
        classification: 'YELLOW',
        explanation: 'Material could not be confidently classified under City of Tampa guidance.',
        disposalRecommendation: 'Clarify item composition below or remove from your compost batch to stay safe.',
        contaminationConcerns: 'Unverified items risk contaminating an entire collection bin.',
      },
    },
  },
  'usf-commercial': {
    id: 'usf-commercial',
    name: 'USF Commercial In-Vessel Program (Configurable)',
    shortName: 'USF Commercial Rules',
    authority: 'Configurable High-Temperature Campus & Commercial Composting Profile',
    description:
      'Optional future configuration for high-temperature aerated static pile or in-vessel campus composting: expands acceptance to cooked grains, unbleached paper napkins, and verified BPI-certified packaging.',
    isDefault: false,
    rules: {
      fruit_peel_core: {
        classification: 'GREEN',
        explanation: 'Accepted across all commercial and campus composting streams.',
        disposalRecommendation: 'Place in USF Commercial compost stream.',
        contaminationConcerns: 'Remove plastic PLU stickers.',
      },
      vegetable_scrap: {
        classification: 'GREEN',
        explanation: 'Accepted in all campus commercial composting stations.',
        disposalRecommendation: 'Place in USF Commercial compost stream.',
        contaminationConcerns: 'Watch for hidden plastic toothpicks or rubber bands.',
      },
      coffee_tea_grounds: {
        classification: 'GREEN',
        explanation: 'Accepted feedstock for high-temperature commercial composting.',
        disposalRecommendation: 'Compost grounds and unbleached paper filters.',
        contaminationConcerns: 'Remove plastic K-cups or nylon tea sachets.',
      },
      eggshells: {
        classification: 'GREEN',
        explanation: 'Accepted in commercial aerated compost systems.',
        disposalRecommendation: 'Place in USF Commercial compost stream.',
        contaminationConcerns: 'Discard foam or plastic egg cartons separately.',
      },
      plain_grains_bread_rice: {
        classification: 'GREEN',
        explanation: 'High-heat commercial systems rapidly process cooked rice, bread, and pasta.',
        disposalRecommendation: 'Accepted in USF Commercial compost bins.',
        contaminationConcerns: 'Ensure no plastic wrappers or foil are mixed with leftovers.',
      },
      paper_napkin_unbleached: {
        classification: 'GREEN',
        explanation: 'Food-soiled paper napkins are accepted as carbon feedstock in commercial composting.',
        disposalRecommendation: 'Compost alongside food scraps.',
        contaminationConcerns: 'Keep out chemical cleaning wipes and plastic-coated papers.',
      },
      citrus_acidic_peels: {
        classification: 'GREEN',
        explanation: 'Large commercial batches buffer citrus acidity effectively.',
        disposalRecommendation: 'Place in USF Commercial compost stream.',
        contaminationConcerns: 'Remove plastic produce stickers.',
      },
      meat_bones_fish: {
        classification: 'YELLOW',
        explanation: 'Accepted only in certified high-temperature in-vessel units, not open campus piles.',
        disposalRecommendation: 'Confirm station signage accepts meat/bones before depositing.',
        contaminationConcerns: 'If station follows backyard rules, meat causes odor and pest violations.',
      },
      dairy_oil_grease: {
        classification: 'YELLOW',
        explanation: 'Small food-bound dairy/oil residues are processed commercially, but liquid grease is excluded.',
        disposalRecommendation: 'Verify station acceptance; pour off free liquids first.',
        contaminationConcerns: 'Excess liquid oil causes leachate and anaerobic pockets.',
      },
      plastic_utensil: {
        classification: 'RED',
        explanation: 'Petroleum-based cutlery is never compostable in any campus program.',
        disposalRecommendation: 'Remove from scraps and place in trash.',
        contaminationConcerns: 'High-priority physical contaminant at campus sorting stations.',
      },
      plastic_wrapper_film: {
        classification: 'RED',
        explanation: 'Conventional plastic wrappers and films contaminate commercial compost.',
        disposalRecommendation: 'Remove and dispose in trash.',
        contaminationConcerns: 'Fails screening and downgrades finished compost grade.',
      },
      bioplastic_pla: {
        classification: 'YELLOW',
        explanation: 'Accepted in commercial facilities ONLY if stamped BPI-certified or ASTM D6400.',
        disposalRecommendation: 'Check bottom/handle for "BPI Compostable" stamp; otherwise discard in trash.',
        contaminationConcerns: '"Biodegradable" look-alike plastics without BPI certification contaminate batches.',
      },
      coated_paper_foil: {
        classification: 'RED',
        explanation: 'Foil and polyethylene-lined cups do not break down cleanly.',
        disposalRecommendation: 'Separate and place in trash or clean metal recycling.',
        contaminationConcerns: 'Leaves metallic or plastic film fragments in finished compost.',
      },
      unknown_ambiguous: {
        classification: 'YELLOW',
        explanation: 'Item requires visual verification before commercial intake.',
        disposalRecommendation: 'Clarify item material or separate before drop-off.',
        contaminationConcerns: 'Unidentified materials risk station rejection.',
      },
    },
  },
};

export function evaluateScannedItem(
  raw: {
    id: string;
    itemName: string;
    materialCategory: MaterialCategory;
    confidence: number;
    needsClarification?: boolean;
    clarificationQuestion?: string;
    hasReliableBounds?: boolean;
    boundingBox?: BoundingBox;
    separated?: boolean;
    clarificationResolved?: boolean;
  },
  programId: CompostProgramId
): ScannedItem {
  const program = COMPOST_PROGRAMS[programId] ?? COMPOST_PROGRAMS['tampa-backyard'];
  const rule = program.rules[raw.materialCategory] ?? program.rules.unknown_ambiguous;

  const lowConfidence = raw.confidence < 0.65 && !raw.clarificationResolved;
  const needsClarification = Boolean(raw.needsClarification || lowConfidence);
  const classification: SortClassification = needsClarification && rule.classification === 'GREEN'
    ? 'YELLOW'
    : rule.classification;

  return {
    id: raw.id,
    itemName: raw.itemName,
    materialCategory: raw.materialCategory,
    confidence: Math.max(0, Math.min(1, raw.confidence)),
    classification,
    explanation: rule.explanation,
    disposalRecommendation: rule.disposalRecommendation,
    contaminationConcerns: rule.contaminationConcerns,
    needsClarification,
    clarificationQuestion:
      raw.clarificationQuestion ||
      (needsClarification
        ? `Could you confirm what "${raw.itemName}" is made of so we can apply ${program.shortName}?`
        : undefined),
    clarificationResolved: raw.clarificationResolved ?? false,
    hasReliableBounds: Boolean(raw.hasReliableBounds && raw.boundingBox),
    boundingBox: raw.hasReliableBounds ? raw.boundingBox : undefined,
    separated: Boolean(raw.separated),
  };
}

export function computeScrapCheckStatus(
  items: ScannedItem[],
  programId: CompostProgramId
): ScrapCheckSummary {
  const program = COMPOST_PROGRAMS[programId] ?? COMPOST_PROGRAMS['tampa-backyard'];
  const activeItems = items.filter((item) => !item.separated);
  const contaminants = activeItems.filter((item) => item.classification === 'RED');
  const uncertain = activeItems.filter(
    (item) => item.classification === 'YELLOW' || item.needsClarification
  );
  const accepted = activeItems.filter(
    (item) => item.classification === 'GREEN' && !item.needsClarification
  );
  const separatedCount = items.filter((item) => item.separated).length;

  if (activeItems.length === 0) {
    return {
      isReadyToCompost: false,
      alertTone: 'empty',
      alertMessage:
        items.length > 0
          ? 'All scanned items were marked as separated. Scan eligible food scraps to submit a deposit.'
          : 'Scan food scraps to run ScrapCheck contamination detection.',
      acceptedCount: 0,
      uncertainCount: 0,
      contaminantCount: 0,
      separatedCount,
    };
  }

  if (contaminants.length > 0) {
    const firstNames = contaminants.map((c) => c.itemName.toLowerCase());
    const formatted =
      firstNames.length === 1
        ? firstNames[0]
        : `${firstNames.slice(0, -1).join(', ')} and ${firstNames[firstNames.length - 1]}`;
    return {
      isReadyToCompost: false,
      alertTone: 'danger',
      alertMessage: `Almost ready to compost! Remove the ${formatted} first.`,
      acceptedCount: accepted.length,
      uncertainCount: uncertain.length,
      contaminantCount: contaminants.length,
      separatedCount,
    };
  }

  if (uncertain.length > 0) {
    const names = uncertain.map((u) => u.itemName.toLowerCase()).join(', ');
    return {
      isReadyToCompost: false,
      alertTone: 'warning',
      alertMessage: `Almost ready! Clarify or separate ${names} under ${program.shortName}.`,
      acceptedCount: accepted.length,
      uncertainCount: uncertain.length,
      contaminantCount: 0,
      separatedCount,
    };
  }

  return {
    isReadyToCompost: accepted.length > 0,
    alertTone: 'ready',
    alertMessage: `Ready to Compost — All remaining scraps meet ${program.shortName}.`,
    acceptedCount: accepted.length,
    uncertainCount: 0,
    contaminantCount: 0,
    separatedCount,
  };
}

/**
 * EPA WARM v16 Life-Cycle Emissions Methodology (Food Waste)
 * - Landfilling Food Waste (National Average Gas Recovery): ~ +0.50 MTCO2e / short ton (+0.25 kg CO2e / lb)
 * - Composting Food Waste (Aerated Windrow + Soil Carbon Storage - Hauling/Turning): ~ -0.18 MTCO2e / short ton (-0.09 kg CO2e / lb)
 * - Net Avoided Emissions Delta: 0.34 kg CO2e avoided per verified pound diverted from landfill to composting.
 * Note: Illustrative life-cycle estimate based on documented EPA WARM factors, not a fixed direct sensor reading.
 */
export const EPA_WARM_FACTORS = {
  methodologyName: 'EPA WARM v16 (Food Waste: Composting vs. Landfilling)',
  landfillEmissionKgPerLb: 0.25,
  compostingNetKgPerLb: -0.09,
  avoidedKgCo2ePerLb: 0.34,
  transportAndProcessingDeductionNote:
    'Includes estimated diesel hauling (~0.02 kg CO2e/lb) and windrow aeration/turning energy (~0.03 kg CO2e/lb), offset by avoided landfill methane and soil carbon sequestration.',
};

export interface EcoImpactMetrics {
  verifiedLbs: number;
  estimatedKgCo2eAvoided: number;
  landfillBaselineKgCo2e: number;
  compostingNetKgCo2e: number;
  monthlyGoalLbs: number;
  monthlyGoalPercent: number;
}

export function calculateEcoImpact(
  verifiedLbs: number,
  monthlyGoalLbs = 5
): EcoImpactMetrics {
  const safeLbs = Math.max(0, Number(verifiedLbs.toFixed(2)));
  const estimatedKgCo2eAvoided = Number(
    (safeLbs * EPA_WARM_FACTORS.avoidedKgCo2ePerLb).toFixed(1)
  );
  const landfillBaselineKgCo2e = Number(
    (safeLbs * EPA_WARM_FACTORS.landfillEmissionKgPerLb).toFixed(2)
  );
  const compostingNetKgCo2e = Number(
    (safeLbs * EPA_WARM_FACTORS.compostingNetKgPerLb).toFixed(2)
  );
  const monthlyGoalPercent =
    monthlyGoalLbs > 0
      ? Math.min(100, Math.round((safeLbs / monthlyGoalLbs) * 100))
      : 0;

  return {
    verifiedLbs: safeLbs,
    estimatedKgCo2eAvoided,
    landfillBaselineKgCo2e,
    compostingNetKgCo2e,
    monthlyGoalLbs,
    monthlyGoalPercent,
  };
}

/**
 * Proposed USF Botanical Gardens "From Scraps to Soil" Mass-Balance Model
 * Raw food scraps lose ~62% mass via moisture evaporation and microbial CO2 respiration during active composting,
 * yielding ~38% screened finished compost by weight (distinct from raw scrap weight).
 */
export const BOTANICAL_PROCESS_CONSTANTS = {
  finishedCompostYieldRatio: 0.38,
  moistureAndRespirationLossRatio: 0.62,
  screenedBagWeightLbs: 40,
  estimatedExternalBagCostUsd: 8.5,
};

export interface BotanicalLoopMetrics {
  verifiedScrapsCollectedLbs: number;
  enteringProcessingLbs: number;
  projectedFinishedCompostLbs: number;
  projectedDeliverableToGardensLbs: number;
  projectedExternalBagsDisplaced: number;
  projectedExternalSpendDisplacedUsd: number;
}

export function calculateBotanicalProjection(
  verifiedScrapsLbs: number,
  qaPassRate = 0.95
): BotanicalLoopMetrics {
  const safeScraps = Math.max(0, verifiedScrapsLbs);
  const enteringProcessingLbs = Number((safeScraps * qaPassRate).toFixed(2));
  const projectedFinishedCompostLbs = Number(
    (enteringProcessingLbs * BOTANICAL_PROCESS_CONSTANTS.finishedCompostYieldRatio).toFixed(2)
  );
  // Proposed allocation: 100% of QA-passed campus finished compost earmarked for proposed USF Botanical Gardens partnership
  const projectedDeliverableToGardensLbs = projectedFinishedCompostLbs;
  const projectedExternalBagsDisplaced = Number(
    (
      projectedDeliverableToGardensLbs /
      BOTANICAL_PROCESS_CONSTANTS.screenedBagWeightLbs
    ).toFixed(2)
  );
  const projectedExternalSpendDisplacedUsd = Number(
    (
      projectedExternalBagsDisplaced *
      BOTANICAL_PROCESS_CONSTANTS.estimatedExternalBagCostUsd
    ).toFixed(2)
  );

  return {
    verifiedScrapsCollectedLbs: Number(safeScraps.toFixed(2)),
    enteringProcessingLbs,
    projectedFinishedCompostLbs,
    projectedDeliverableToGardensLbs,
    projectedExternalBagsDisplaced,
    projectedExternalSpendDisplacedUsd,
  };
}

export interface CampusStation {
  id: string;
  qrCode: string;
  name: string;
  location: string;
  dormId?: string;
  programId: CompostProgramId;
  isDemoStation: boolean;
  scaleModel: string;
}

export const DEMO_STATIONS: CampusStation[] = [
  {
    id: 'JUN-02',
    qrCode: 'USF-JUN-02',
    name: 'Juniper Hall — Ground Floor Compost Station',
    location: 'Juniper Hall · Courtyard Smart Scale Hopper (Demo Station)',
    dormId: 'juniper',
    programId: 'tampa-backyard',
    isDemoStation: true,
    scaleModel: 'Dorm Smart Scale Hopper · 0.1 lb precision · Auto-reports to EcoScrap',
  },
  {
    id: 'BEA-04',
    qrCode: 'USF-BEA-04',
    name: 'Beacon Hall — Lobby Utility Compost Station',
    location: 'Beacon Hall · West Stairwell Alcove (Demo Station)',
    dormId: 'beacon',
    programId: 'tampa-backyard',
    isDemoStation: true,
    scaleModel: 'Dorm Smart Scale Hopper · 0.1 lb precision · Auto-reports to EcoScrap',
  },
  {
    id: 'SUM-05',
    qrCode: 'USF-SUM-05',
    name: 'Summit Hall — Commons Compost Drop-Off',
    location: 'Summit Hall · Ground Commons Exit (Demo Station)',
    dormId: 'summit',
    programId: 'tampa-backyard',
    isDemoStation: true,
    scaleModel: 'Dorm Smart Scale Hopper · 0.1 lb precision · Auto-reports to EcoScrap',
  },
  {
    id: 'POP-06',
    qrCode: 'USF-POP-06',
    name: 'Poplar Hall — Breezeway Compost Station',
    location: 'Poplar Hall · South Breezeway (Demo Station)',
    dormId: 'poplar',
    programId: 'tampa-backyard',
    isDemoStation: true,
    scaleModel: 'Dorm Smart Scale Hopper · 0.1 lb precision · Auto-reports to EcoScrap',
  },
  {
    id: 'CYP-07',
    qrCode: 'USF-CYP-07',
    name: 'Cypress Hall — East Courtyard Compost Station',
    location: 'Cypress Hall · Recycling & Organics Bay (Demo Station)',
    dormId: 'cypress',
    programId: 'tampa-backyard',
    isDemoStation: true,
    scaleModel: 'Dorm Smart Scale Hopper · 0.1 lb precision · Auto-reports to EcoScrap',
  },
  {
    id: 'MSC-01',
    qrCode: 'USF-MSC-01',
    name: 'Marshall Student Center — Atrium Scale Kiosk',
    location: 'MSC Level 1 · Bull Market Entrance (Demo Station)',
    programId: 'tampa-backyard',
    isDemoStation: true,
    scaleModel: 'Digital Bench Scale · 0.1 lb precision',
  },
  {
    id: 'LIB-03',
    qrCode: 'USF-LIB-03',
    name: 'USF Tampa Library — East Terrace Station',
    location: 'Library Plaza · Cafe Adjacent (Demo Station)',
    programId: 'usf-commercial',
    isDemoStation: true,
    scaleModel: 'Commercial Intake Scale · 0.1 lb precision',
  },
];

export const REWARD_THRESHOLD_LBS = 5;
export const POINTS_PER_VERIFIED_LB = 20;
export const POINTS_PER_CLEAN_SCAN = 10;
