import type {
  BotanicalLoopMetrics,
  CampusStation,
  CompostProgramConfig,
  CompostProgramId,
  EcoImpactMetrics,
  MaterialCategory,
  ScannedItem,
  ScrapCheckSummary,
} from './shared/compostingRules';

export type WorkspaceMode = 'demo' | 'real';
export type RewardChoice = 'energy-drink' | 'snack-alternative';
export type AccountType = 'guest' | 'member';

export interface PublicAccount {
  id: string;
  accountType: AccountType;
  displayName: string;
  dormId: string;
  username?: string;
  guestCodeHint?: string;
  createdAt: string;
}

export interface AuthAccountResponse {
  token: string;
  account: PublicAccount;
  accessCode?: string;
  snapshot: WorkspaceSnapshot;
}

export type NavTab =
  | 'home'
  | 'scanner'
  | 'deposits'
  | 'rewards'
  | 'leaderboard'
  | 'ecoimpact'
  | 'compost-loop'
  | 'dashboard';

export interface StudentProfile {
  id: string;
  displayName: string;
  dormId: string;
  verifiedWeightLbs: number;
  ecoPoints: number;
  monthlyGoalLbs: number;
  preferredReward: RewardChoice;
  quizAnswered: number;
  quizCorrect: number;
}

export interface DormRoomBinBatch {
  id: string;
  scanId: string;
  itemNames: string[];
  estimatedWeightLbs: number;
  addedAt: string;
}

export interface ScanRecord {
  id: string;
  workspace: WorkspaceMode;
  isDemo: boolean;
  studentId: string;
  programId: CompostProgramId;
  createdAt: string;
  items: ScannedItem[];
  scrapCheck: ScrapCheckSummary;
  depositInitiated: boolean;
  addedToRoomBin?: boolean;
}

export interface DepositRecord {
  id: string;
  workspace: WorkspaceMode;
  isDemo: boolean;
  studentId: string;
  studentAlias: string;
  dormId: string;
  stationId: string;
  stationName: string;
  scanId: string;
  programId: CompostProgramId;
  itemSummary: string[];
  estimatedWeightLbs: number;
  scaleReportedWeightLbs?: number;
  source?: 'direct-scan' | 'dorm-bin-dump';
  verifiedWeightLbs: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface VoucherRecord {
  id: string;
  code: string;
  workspace: WorkspaceMode;
  isDemo: boolean;
  studentId: string;
  milestoneNumber: number;
  milestoneLbs: number;
  rewardTitle: string;
  rewardChoice: RewardChoice;
  status: 'available' | 'redeemed';
  unlockedAt: string;
  redeemedAt?: string;
  redeemedByStaff?: string;
}

export interface DormTeam {
  id: string;
  name: string;
  totalLbs: number;
  participatingStudents: number;
  weeklyLbs: number;
  isDemo: boolean;
  rank: number;
  lbsPerStudent: number;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progressText: string;
}

export interface WorkspaceSnapshot {
  workspace: WorkspaceMode;
  isDemo: boolean;
  account: PublicAccount | null;
  student: StudentProfile;
  roomBin: {
    batches: DormRoomBinBatch[];
    totalEstimatedLbs: number;
    totalItemsCount: number;
  };
  ecoImpact: EcoImpactMetrics;
  rewards: {
    thresholdLbs: number;
    currentCycleLbs: number;
    lbsUntilNextReward: number;
    completedRewardsCount: number;
    vouchers: VoucherRecord[];
  };
  achievements: AchievementItem[];
  scans: ScanRecord[];
  deposits: DepositRecord[];
  dorms: DormTeam[];
  studentDormRank: number;
  stations: CampusStation[];
  programs: CompostProgramConfig[];
  adminMetrics: {
    totalVerifiedDeposits: number;
    pendingDepositsCount: number;
    totalCollectedLbs: number;
    campusImpact: EcoImpactMetrics;
    contaminationIncidentsCount: number;
    commonlyMisSorted: Array<{ material: string; count: number }>;
    participatingStudents: number;
    weeklySeries: Array<{ week: string; lbs: number; incidents: number }>;
    botanicalProjection: BotanicalLoopMetrics;
  };
}

export interface StaffAuthStatus {
  hasPasscodeConfigured: boolean;
  isEnvManaged: boolean;
}

export interface ScanResponse {
  scan: ScanRecord;
  snapshot: WorkspaceSnapshot;
}

export type WasteStreamBin = 'COMPOST' | 'RECYCLE' | 'TRASH';

export interface ChatSortedItem {
  itemName: string;
  bin: WasteStreamBin;
  reason: string;
  contaminationNote?: string;
}

export interface ChatNearbyLocation {
  stationId: string;
  name: string;
  distanceHint: string;
  acceptedStreams: string;
  location: string;
}

export interface ChatTurnResponse {
  reply: string;
  sortedItems: ChatSortedItem[];
  nearbyLocations: ChatNearbyLocation[];
  scan?: ScanRecord;
  snapshot: WorkspaceSnapshot;
}

export interface VerifyDepositResponse {
  deposit: DepositRecord;
  newlyUnlockedVouchers: VoucherRecord[];
  snapshot: WorkspaceSnapshot;
}

export type { MaterialCategory, CompostProgramId, ScannedItem, ScrapCheckSummary };
