import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  COMPOST_PROGRAMS,
  DEMO_STATIONS,
  POINTS_PER_CLEAN_SCAN,
  POINTS_PER_VERIFIED_LB,
  REWARD_THRESHOLD_LBS,
  calculateBotanicalProjection,
  calculateEcoImpact,
  computeScrapCheckStatus,
  evaluateScannedItem,
  type CompostProgramId,
  type MaterialCategory,
  type ScannedItem,
  type ScrapCheckSummary,
} from './src/shared/compostingRules.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'ecoscrap-db.json');

type WorkspaceMode = 'demo' | 'real';
type RewardChoice = 'energy-drink' | 'snack-alternative';

interface StudentProfile {
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

interface ScanRecord {
  id: string;
  workspace: WorkspaceMode;
  isDemo: boolean;
  studentId: string;
  programId: CompostProgramId;
  createdAt: string;
  imagePreviewUrl?: string;
  items: ScannedItem[];
  scrapCheck: ScrapCheckSummary;
  depositInitiated: boolean;
  addedToRoomBin?: boolean;
}

interface DormRoomBinBatch {
  id: string;
  studentId: string;
  scanId: string;
  itemNames: string[];
  estimatedWeightLbs: number;
  addedAt: string;
}

interface DepositRecord {
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

interface VoucherRecord {
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

interface DormTeamRecord {
  id: string;
  name: string;
  totalLbs: number;
  participatingStudents: number;
  weeklyLbs: number;
  isDemo: boolean;
}

interface ContaminationIncident {
  id: string;
  material: string;
  category: MaterialCategory;
  stationOrScanId: string;
  resolvedByUser: boolean;
  timestamp: string;
  isDemo: boolean;
}

interface WorkspaceState {
  students: Record<string, StudentProfile>;
  activeStudentId: string;
  roomBinBatches?: DormRoomBinBatch[];
  scans: ScanRecord[];
  deposits: DepositRecord[];
  vouchers: VoucherRecord[];
  dorms: DormTeamRecord[];
  contaminationIncidents: ContaminationIncident[];
  weeklySeries: Array<{ week: string; lbs: number; incidents: number }>;
}

interface AccountRecord {
  id: string;
  accountType: 'guest' | 'member';
  displayName: string;
  dormId: string;
  username?: string;
  passwordHash?: { salt: string; hash: string };
  guestCodePrefix?: string;
  guestCodeHash?: { salt: string; hash: string };
  createdAt: string;
}

interface PublicAccount {
  id: string;
  accountType: 'guest' | 'member';
  displayName: string;
  dormId: string;
  username?: string;
  guestCodeHint?: string;
  createdAt: string;
}

interface PersistedDatabase {
  staffPasscodeHash?: { salt: string; hash: string };
  accounts?: Record<string, AccountRecord>;
  demo: WorkspaceState;
  real: WorkspaceState;
}

interface AuthSession {
  token: string;
  role: 'student' | 'staff';
  studentId?: string;
  displayName: string;
  createdAt: number;
}

const activeSessions = new Map<string, AuthSession>();
const authRateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkAuthRateLimit(req: express.Request, res: express.Response): boolean {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const maxAttempts = 30;
  const existing = authRateBuckets.get(ip);
  if (!existing || now > existing.resetAt) {
    authRateBuckets.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  existing.count += 1;
  if (existing.count > maxAttempts) {
    res.status(429).json({
      error: 'Too many account attempts. Please wait a few minutes and try again.',
    });
    return false;
  }
  return true;
}

function createInitialDemoWorkspace(): WorkspaceState {
  const demoStudentId = 'stu-demo-alex';
  return {
    activeStudentId: demoStudentId,
    students: {
      [demoStudentId]: {
        id: demoStudentId,
        displayName: 'Alex Rivera (Demo Student)',
        dormId: 'juniper',
        verifiedWeightLbs: 0,
        ecoPoints: 0,
        monthlyGoalLbs: 5,
        preferredReward: 'energy-drink',
        quizAnswered: 0,
        quizCorrect: 0,
      },
    },
    roomBinBatches: [],
    scans: [],
    deposits: [],
    vouchers: [],
    dorms: [
      { id: 'juniper', name: 'Juniper Hall', totalLbs: 142.5, participatingStudents: 38, weeklyLbs: 28.4, isDemo: true },
      { id: 'beacon', name: 'Beacon Hall', totalLbs: 144.0, participatingStudents: 41, weeklyLbs: 26.8, isDemo: true },
      { id: 'summit', name: 'Summit Hall', totalLbs: 124.5, participatingStudents: 34, weeklyLbs: 21.2, isDemo: true },
      { id: 'poplar', name: 'Poplar Hall', totalLbs: 108.0, participatingStudents: 29, weeklyLbs: 18.5, isDemo: true },
      { id: 'cypress', name: 'Cypress Hall', totalLbs: 94.5, participatingStudents: 25, weeklyLbs: 14.9, isDemo: true },
    ],
    contaminationIncidents: [
      { id: 'inc-demo-1', material: 'Plastic Fork', category: 'plastic_utensil', stationOrScanId: 'Sample Intake #104', resolvedByUser: true, timestamp: '2026-11-18T14:20:00Z', isDemo: true },
      { id: 'inc-demo-2', material: 'Snack Wrapper', category: 'plastic_wrapper_film', stationOrScanId: 'Sample Intake #109', resolvedByUser: true, timestamp: '2026-11-19T11:10:00Z', isDemo: true },
      { id: 'inc-demo-3', material: 'PLA Cold Cup', category: 'bioplastic_pla', stationOrScanId: 'Sample Intake #112', resolvedByUser: true, timestamp: '2026-11-20T09:45:00Z', isDemo: true },
      { id: 'inc-demo-4', material: 'Lined Coffee Cup', category: 'coated_paper_foil', stationOrScanId: 'Sample Intake #118', resolvedByUser: false, timestamp: '2026-11-20T16:05:00Z', isDemo: true },
    ],
    weeklySeries: [
      { week: 'Wk 1', lbs: 112.4, incidents: 14 },
      { week: 'Wk 2', lbs: 138.2, incidents: 11 },
      { week: 'Wk 3', lbs: 159.6, incidents: 8 },
      { week: 'Wk 4', lbs: 203.3, incidents: 5 },
    ],
  };
}

function createInitialRealWorkspace(): WorkspaceState {
  const defaultRealStudent = 'stu-live-guest';
  return {
    activeStudentId: defaultRealStudent,
    students: {
      [defaultRealStudent]: {
        id: defaultRealStudent,
        displayName: 'USF Student',
        dormId: 'juniper',
        verifiedWeightLbs: 0,
        ecoPoints: 0,
        monthlyGoalLbs: 5,
        preferredReward: 'energy-drink',
        quizAnswered: 0,
        quizCorrect: 0,
      },
    },
    roomBinBatches: [],
    scans: [],
    deposits: [],
    vouchers: [],
    dorms: [
      { id: 'juniper', name: 'Juniper Hall', totalLbs: 0, participatingStudents: 1, weeklyLbs: 0, isDemo: false },
      { id: 'beacon', name: 'Beacon Hall', totalLbs: 0, participatingStudents: 0, weeklyLbs: 0, isDemo: false },
      { id: 'summit', name: 'Summit Hall', totalLbs: 0, participatingStudents: 0, weeklyLbs: 0, isDemo: false },
      { id: 'poplar', name: 'Poplar Hall', totalLbs: 0, participatingStudents: 0, weeklyLbs: 0, isDemo: false },
      { id: 'cypress', name: 'Cypress Hall', totalLbs: 0, participatingStudents: 0, weeklyLbs: 0, isDemo: false },
    ],
    contaminationIncidents: [],
    weeklySeries: [
      { week: 'Current Week', lbs: 0, incidents: 0 },
    ],
  };
}

function loadDatabase(): PersistedDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw) as PersistedDatabase;
      if (parsed && parsed.demo && parsed.real) {
        if (!parsed.accounts) parsed.accounts = {};
        return parsed;
      }
    }
  } catch (err) {
    console.error('Could not load persisted EcoScrap store, initializing fresh store:', err);
  }
  return {
    accounts: {},
    demo: createInitialDemoWorkspace(),
    real: createInitialRealWorkspace(),
  };
}

let db: PersistedDatabase = loadDatabase();

function saveDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('Failed to persist database:', err);
  }
}

function hashPasscode(passcode: string, salt?: string): { salt: string; hash: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(passcode, actualSalt, 64).toString('hex');
  return { salt: actualSalt, hash: derived };
}

function verifyPasscode(input: string): boolean {
  const envPasscode = process.env.STAFF_ADMIN_PASSCODE?.trim();
  if (envPasscode) {
    const a = Buffer.from(input);
    const b = Buffer.from(envPasscode);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }
  if (db.staffPasscodeHash) {
    const { hash } = hashPasscode(input, db.staffPasscodeHash.salt);
    const a = Buffer.from(hash, 'hex');
    const b = Buffer.from(db.staffPasscodeHash.hash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }
  return false;
}

function verifySecretHash(
  input: string,
  stored: { salt: string; hash: string } | undefined
): boolean {
  if (!stored) return false;
  const { hash } = hashPasscode(input, stored.salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(stored.hash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

const GUEST_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateGuestAccessCode(): { code: string; prefix: string } {
  const bytes = crypto.randomBytes(12);
  let raw = '';
  for (let i = 0; i < 12; i++) {
    raw += GUEST_CODE_ALPHABET[bytes[i] % GUEST_CODE_ALPHABET.length];
  }
  const part1 = raw.slice(0, 4);
  const part2 = raw.slice(4, 8);
  const part3 = raw.slice(8, 12);
  return {
    code: `ECO-${part1}-${part2}-${part3}`,
    prefix: part1,
  };
}

function normalizeGuestCode(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const body = cleaned.startsWith('ECO') ? cleaned.slice(3) : cleaned;
  if (body.length !== 12) return '';
  return `ECO-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`;
}

function toPublicAccount(account: AccountRecord): PublicAccount {
  return {
    id: account.id,
    accountType: account.accountType,
    displayName: account.displayName,
    dormId: account.dormId,
    username: account.username,
    guestCodeHint: account.guestCodePrefix ? `ECO-${account.guestCodePrefix}-••••-••••` : undefined,
    createdAt: account.createdAt,
  };
}

function getAccountsMap(): Record<string, AccountRecord> {
  if (!db.accounts) db.accounts = {};
  return db.accounts;
}

function ensureStudentProfileForAccount(ws: WorkspaceState, account: AccountRecord): StudentProfile {
  const existing = ws.students[account.id];
  if (existing) {
    existing.displayName = account.displayName;
    if (ws.dorms.some((d) => d.id === account.dormId)) {
      existing.dormId = account.dormId;
    }
    return existing;
  }
  const validDorm = ws.dorms.some((d) => d.id === account.dormId) ? account.dormId : 'juniper';
  const profile: StudentProfile = {
    id: account.id,
    displayName: account.displayName,
    dormId: validDorm,
    verifiedWeightLbs: 0,
    ecoPoints: 0,
    monthlyGoalLbs: 5,
    preferredReward: 'energy-drink',
    quizAnswered: 0,
    quizCorrect: 0,
  };
  ws.students[account.id] = profile;
  const dorm = ws.dorms.find((d) => d.id === validDorm);
  if (dorm) dorm.participatingStudents += 1;
  return profile;
}

function issueStudentSession(account: AccountRecord): string {
  const token = crypto.randomBytes(32).toString('hex');
  activeSessions.set(token, {
    token,
    role: 'student',
    studentId: account.id,
    displayName: account.displayName,
    createdAt: Date.now(),
  });
  return token;
}

function resolveAuthenticatedAccount(req: express.Request): AccountRecord | null {
  const session = getAuthSession(req);
  if (!session || session.role !== 'student' || !session.studentId) return null;
  const accounts = getAccountsMap();
  return accounts[session.studentId] || null;
}

function extractBearerToken(req: express.Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

function getAuthSession(req: express.Request): AuthSession | null {
  const token = extractBearerToken(req);
  if (!token) return null;
  return activeSessions.get(token) ?? null;
}

function getWorkspaceMode(req: express.Request): WorkspaceMode {
  const raw =
    (typeof req.query.workspace === 'string' ? req.query.workspace : undefined) ||
    (typeof req.body?.workspace === 'string' ? req.body.workspace : undefined) ||
    (typeof req.headers['x-ecoscrap-workspace'] === 'string'
      ? req.headers['x-ecoscrap-workspace']
      : undefined);
  return raw === 'real' ? 'real' : 'demo';
}

function resolveStudent(ws: WorkspaceState, req: express.Request): StudentProfile {
  const account = resolveAuthenticatedAccount(req);
  if (account) {
    return ensureStudentProfileForAccount(ws, account);
  }
  const session = getAuthSession(req);
  if (session?.studentId && ws.students[session.studentId]) {
    return ws.students[session.studentId];
  }
  return ws.students[ws.activeStudentId] || Object.values(ws.students)[0];
}

function computeAchievements(student: StudentProfile, ws: WorkspaceState): Array<{
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progressText: string;
}> {
  const lbs = student.verifiedWeightLbs;
  const cleanScans = ws.scans.filter((s) => s.studentId === student.id && s.scrapCheck.isReadyToCompost).length;
  return [
    {
      id: 'first-pound',
      title: 'First Pound',
      description: 'Complete at least 1.0 lb of verified compost deposits.',
      unlocked: lbs >= 1,
      progressText: `${Math.min(lbs, 1).toFixed(1)} / 1.0 lbs`,
    },
    {
      id: 'eco-rookie',
      title: 'Eco Rookie',
      description: 'Pass ScrapCheck contamination screening on a scan.',
      unlocked: cleanScans >= 1,
      progressText: `${Math.min(cleanScans, 1)} / 1 clean scan`,
    },
    {
      id: 'compost-champion',
      title: 'Compost Champion',
      description: 'Reach 5.0 lbs of verified compost and unlock a reward.',
      unlocked: lbs >= 5,
      progressText: `${Math.min(lbs, 5).toFixed(1)} / 5.0 lbs`,
    },
    {
      id: 'milestone-25',
      title: '25-lb Milestone',
      description: 'Divert 25.0 verified pounds from landfill disposal.',
      unlocked: lbs >= 25,
      progressText: `${Math.min(lbs, 25).toFixed(1)} / 25.0 lbs`,
    },
    {
      id: 'waste-warrior',
      title: 'Campus Waste Warrior',
      description: 'Earn 250+ EcoPoints across verified deposits and sorting accuracy.',
      unlocked: student.ecoPoints >= 250,
      progressText: `${Math.min(student.ecoPoints, 250)} / 250 pts`,
    },
  ];
}

function buildWorkspaceSnapshot(
  mode: WorkspaceMode,
  req: express.Request,
  overrideAccount?: AccountRecord | null
) {
  const ws = db[mode];
  const account = overrideAccount !== undefined ? overrideAccount : resolveAuthenticatedAccount(req);
  const student = account ? ensureStudentProfileForAccount(ws, account) : resolveStudent(ws, req);
  const ecoImpact = calculateEcoImpact(student.verifiedWeightLbs, student.monthlyGoalLbs);
  const totalCampusLbs = ws.dorms.reduce((sum, d) => sum + d.totalLbs, 0);
  const campusImpact = calculateEcoImpact(totalCampusLbs, 500);
  const botanicalProjection = calculateBotanicalProjection(totalCampusLbs);

  const studentVouchers = ws.vouchers.filter((v) => v.studentId === student.id);
  const currentCycleLbs = Number((student.verifiedWeightLbs % REWARD_THRESHOLD_LBS).toFixed(2));
  const lbsUntilNextReward = Number(
    (
      REWARD_THRESHOLD_LBS -
      (student.verifiedWeightLbs > 0 && currentCycleLbs === 0 ? 0 : currentCycleLbs)
    ).toFixed(2)
  );
  const completedRewardsCount = Math.floor(student.verifiedWeightLbs / REWARD_THRESHOLD_LBS);

  // Aggregate commonly mis-sorted materials for Administrator Dashboard
  const misSortedMap = new Map<string, number>();
  for (const inc of ws.contaminationIncidents) {
    misSortedMap.set(inc.material, (misSortedMap.get(inc.material) || 0) + 1);
  }
  const commonlyMisSorted = Array.from(misSortedMap.entries())
    .map(([material, count]) => ({ material, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const sortedDorms = [...ws.dorms].sort((a, b) => b.totalLbs - a.totalLbs);
  const studentDormRank = sortedDorms.findIndex((d) => d.id === student.dormId) + 1;

  const studentBatches = (ws.roomBinBatches || []).filter((b) => b.studentId === student.id);
  const totalEstimatedLbs = Number(
    studentBatches.reduce((sum, b) => sum + b.estimatedWeightLbs, 0).toFixed(2)
  );
  const totalItemsCount = studentBatches.reduce((sum, b) => sum + b.itemNames.length, 0);

  return {
    workspace: mode,
    isDemo: mode === 'demo',
    account: account ? toPublicAccount(account) : null,
    student,
    roomBin: {
      batches: studentBatches,
      totalEstimatedLbs,
      totalItemsCount,
    },
    ecoImpact,
    rewards: {
      thresholdLbs: REWARD_THRESHOLD_LBS,
      currentCycleLbs:
        student.verifiedWeightLbs > 0 && currentCycleLbs === 0
          ? REWARD_THRESHOLD_LBS
          : currentCycleLbs,
      lbsUntilNextReward:
        student.verifiedWeightLbs > 0 && currentCycleLbs === 0
          ? REWARD_THRESHOLD_LBS
          : lbsUntilNextReward,
      completedRewardsCount,
      vouchers: studentVouchers,
    },
    achievements: computeAchievements(student, ws),
    scans: ws.scans.filter((s) => s.studentId === student.id).slice(0, 20),
    deposits: ws.deposits,
    dorms: sortedDorms.map((d, idx) => ({
      ...d,
      rank: idx + 1,
      lbsPerStudent:
        d.participatingStudents > 0
          ? Number((d.totalLbs / d.participatingStudents).toFixed(2))
          : 0,
    })),
    studentDormRank: studentDormRank || 1,
    stations: DEMO_STATIONS,
    programs: Object.values(COMPOST_PROGRAMS),
    adminMetrics: {
      totalVerifiedDeposits: ws.deposits.filter((d) => d.status === 'approved').length,
      pendingDepositsCount: ws.deposits.filter((d) => d.status === 'pending').length,
      totalCollectedLbs: Number(totalCampusLbs.toFixed(2)),
      campusImpact,
      contaminationIncidentsCount: ws.contaminationIncidents.length,
      commonlyMisSorted,
      participatingStudents: ws.dorms.reduce((sum, d) => sum + d.participatingStudents, 0),
      weeklySeries: ws.weeklySeries,
      botanicalProjection,
    },
  };
}

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

const ALLOWED_CATEGORIES: MaterialCategory[] = [
  'fruit_peel_core',
  'vegetable_scrap',
  'coffee_tea_grounds',
  'eggshells',
  'plain_grains_bread_rice',
  'paper_napkin_unbleached',
  'citrus_acidic_peels',
  'meat_bones_fish',
  'dairy_oil_grease',
  'plastic_utensil',
  'plastic_wrapper_film',
  'bioplastic_pla',
  'coated_paper_foil',
  'unknown_ambiguous',
];

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // 1. Auth & Staff Verification Routes
  app.get('/api/auth/staff-status', (_req, res) => {
    const isEnvManaged = Boolean(process.env.STAFF_ADMIN_PASSCODE?.trim());
    const hasClaimedHash = Boolean(db.staffPasscodeHash);
    res.json({
      hasPasscodeConfigured: isEnvManaged || hasClaimedHash,
      isEnvManaged,
    });
  });

  app.post('/api/auth/claim-staff-passcode', (req, res) => {
    if (process.env.STAFF_ADMIN_PASSCODE?.trim() || db.staffPasscodeHash) {
      res.status(409).json({
        error: 'Staff passcode has already been claimed or configured via environment secrets.',
      });
      return;
    }
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
    if (passcode.length < 6 || passcode.length > 64) {
      res.status(400).json({ error: 'Staff passcode must be between 6 and 64 characters.' });
      return;
    }
    db.staffPasscodeHash = hashPasscode(passcode);
    saveDatabase();

    const token = crypto.randomBytes(24).toString('hex');
    activeSessions.set(token, {
      token,
      role: 'staff',
      displayName: 'USF Compost Staff Verifier',
      createdAt: Date.now(),
    });
    res.json({ token, role: 'staff', displayName: 'USF Compost Staff Verifier' });
  });

  app.post('/api/auth/staff-login', (req, res) => {
    if (!checkAuthRateLimit(req, res)) return;
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
    if (!passcode) {
      res.status(400).json({ error: 'Passcode is required.' });
      return;
    }
    if (!verifyPasscode(passcode)) {
      res.status(401).json({ error: 'Invalid staff verification passcode.' });
      return;
    }
    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.set(token, {
      token,
      role: 'staff',
      displayName: 'USF Compost Staff Verifier',
      createdAt: Date.now(),
    });
    res.json({ token, role: 'staff', displayName: 'USF Compost Staff Verifier' });
  });

  // Create a Guest Account with a high-entropy Access Code to return to rewards anytime
  app.post('/api/auth/guest', (req, res) => {
    if (!checkAuthRateLimit(req, res)) return;
    const mode = getWorkspaceMode(req);
    const rawName =
      typeof req.body?.displayName === 'string' ? req.body.displayName.trim().slice(0, 48) : '';
    const dormId = typeof req.body?.dormId === 'string' ? req.body.dormId.trim() : 'juniper';
    const validDorm = db[mode].dorms.some((d) => d.id === dormId) ? dormId : 'juniper';

    const { code, prefix } = generateGuestAccessCode();
    const displayName = rawName.length >= 2 ? rawName : `Guest ${prefix}`;
    const id = `acc-${crypto.randomBytes(6).toString('hex')}`;

    const account: AccountRecord = {
      id,
      accountType: 'guest',
      displayName,
      dormId: validDorm,
      guestCodePrefix: prefix,
      guestCodeHash: hashPasscode(code),
      createdAt: new Date().toISOString(),
    };

    const accounts = getAccountsMap();
    accounts[id] = account;
    ensureStudentProfileForAccount(db[mode], account);
    saveDatabase();

    const token = issueStudentSession(account);
    res.json({
      token,
      account: toPublicAccount(account),
      accessCode: code,
      snapshot: buildWorkspaceSnapshot(mode, req, account),
    });
  });

  // Create a Member Account (username + password)
  app.post('/api/auth/register', (req, res) => {
    if (!checkAuthRateLimit(req, res)) return;
    const mode = getWorkspaceMode(req);
    const displayName =
      typeof req.body?.displayName === 'string' ? req.body.displayName.trim().slice(0, 48) : '';
    const rawUsername =
      typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const dormId = typeof req.body?.dormId === 'string' ? req.body.dormId.trim() : 'juniper';

    if (displayName.length < 2) {
      res.status(400).json({ error: 'Display name must be at least 2 characters.' });
      return;
    }
    if (!/^[a-z0-9._-]{3,24}$/.test(rawUsername)) {
      res.status(400).json({
        error: 'Username must be 3–24 characters using letters, numbers, dots, underscores, or hyphens.',
      });
      return;
    }
    if (password.length < 6 || password.length > 64) {
      res.status(400).json({ error: 'Password must be between 6 and 64 characters.' });
      return;
    }

    const accounts = getAccountsMap();
    const taken = Object.values(accounts).some((a) => a.username === rawUsername);
    if (taken) {
      res.status(409).json({ error: 'That username is already taken. Try signing in instead.' });
      return;
    }

    const validDorm = db[mode].dorms.some((d) => d.id === dormId) ? dormId : 'juniper';
    const id = `acc-${crypto.randomBytes(6).toString('hex')}`;
    const account: AccountRecord = {
      id,
      accountType: 'member',
      displayName,
      dormId: validDorm,
      username: rawUsername,
      passwordHash: hashPasscode(password),
      createdAt: new Date().toISOString(),
    };

    accounts[id] = account;
    ensureStudentProfileForAccount(db[mode], account);
    saveDatabase();

    const token = issueStudentSession(account);
    res.json({
      token,
      account: toPublicAccount(account),
      snapshot: buildWorkspaceSnapshot(mode, req, account),
    });
  });

  // Sign into an existing Guest Account (via Guest Access Code) OR Member Account (via username + password)
  app.post('/api/auth/login', (req, res) => {
    if (!checkAuthRateLimit(req, res)) return;
    const mode = getWorkspaceMode(req);
    const accounts = getAccountsMap();

    const rawGuestCode = typeof req.body?.guestCode === 'string' ? req.body.guestCode.trim() : '';
    if (rawGuestCode) {
      const normalized = normalizeGuestCode(rawGuestCode);
      if (!normalized) {
        res.status(400).json({
          error: 'Enter a valid Guest Access Code (format: ECO-XXXX-XXXX-XXXX).',
        });
        return;
      }
      const prefix = normalized.slice(4, 8);
      const candidates = Object.values(accounts).filter(
        (a) => a.guestCodePrefix === prefix && Boolean(a.guestCodeHash)
      );
      const matched = candidates.find((a) => verifySecretHash(normalized, a.guestCodeHash));
      if (!matched) {
        res.status(401).json({ error: 'Guest Access Code not recognized. Please check and try again.' });
        return;
      }

      ensureStudentProfileForAccount(db[mode], matched);
      saveDatabase();
      const token = issueStudentSession(matched);
      res.json({
        token,
        account: toPublicAccount(matched),
        accessCode: normalized,
        snapshot: buildWorkspaceSnapshot(mode, req, matched),
      });
      return;
    }

    const rawUsername =
      typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!rawUsername || !password) {
      res.status(400).json({ error: 'Enter your username and password, or your Guest Access Code.' });
      return;
    }

    const matched = Object.values(accounts).find((a) => a.username === rawUsername);
    if (!matched || !verifySecretHash(password, matched.passwordHash)) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    ensureStudentProfileForAccount(db[mode], matched);
    saveDatabase();
    const token = issueStudentSession(matched);
    res.json({
      token,
      account: toPublicAccount(matched),
      snapshot: buildWorkspaceSnapshot(mode, req, matched),
    });
  });

  // Upgrade an active Guest Account into a permanent username/password account while keeping all rewards
  app.post('/api/auth/upgrade-guest', (req, res) => {
    if (!checkAuthRateLimit(req, res)) return;
    const mode = getWorkspaceMode(req);
    const account = resolveAuthenticatedAccount(req);
    if (!account) {
      res.status(401).json({ error: 'Sign in to a guest account first.' });
      return;
    }

    const rawUsername =
      typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const rawName =
      typeof req.body?.displayName === 'string' ? req.body.displayName.trim().slice(0, 48) : '';

    if (!/^[a-z0-9._-]{3,24}$/.test(rawUsername)) {
      res.status(400).json({
        error: 'Username must be 3–24 characters using letters, numbers, dots, underscores, or hyphens.',
      });
      return;
    }
    if (password.length < 6 || password.length > 64) {
      res.status(400).json({ error: 'Password must be between 6 and 64 characters.' });
      return;
    }

    const accounts = getAccountsMap();
    const taken = Object.values(accounts).some(
      (a) => a.id !== account.id && a.username === rawUsername
    );
    if (taken) {
      res.status(409).json({ error: 'That username is already taken.' });
      return;
    }

    if (rawName.length >= 2) {
      account.displayName = rawName;
    }
    account.accountType = 'member';
    account.username = rawUsername;
    account.passwordHash = hashPasscode(password);
    ensureStudentProfileForAccount(db[mode], account);
    saveDatabase();

    res.json({
      account: toPublicAccount(account),
      snapshot: buildWorkspaceSnapshot(mode, req, account),
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = extractBearerToken(req);
    if (token) {
      activeSessions.delete(token);
    }
    res.json({ ok: true });
  });

  app.post('/api/auth/student-login', (req, res) => {
    if (!checkAuthRateLimit(req, res)) return;
    const displayName =
      typeof req.body?.displayName === 'string' ? req.body.displayName.trim().slice(0, 48) : '';
    const dormId = typeof req.body?.dormId === 'string' ? req.body.dormId.trim() : 'juniper';
    if (!displayName || displayName.length < 2) {
      res.status(400).json({ error: 'Please enter a student display name (at least 2 characters).' });
      return;
    }
    const ws = db.real;
    const validDorm = ws.dorms.some((d) => d.id === dormId) ? dormId : 'juniper';
    const { code, prefix } = generateGuestAccessCode();
    const id = `acc-${crypto.randomBytes(6).toString('hex')}`;
    const account: AccountRecord = {
      id,
      accountType: 'guest',
      displayName,
      dormId: validDorm,
      guestCodePrefix: prefix,
      guestCodeHash: hashPasscode(code),
      createdAt: new Date().toISOString(),
    };
    const accounts = getAccountsMap();
    accounts[id] = account;
    const student = ensureStudentProfileForAccount(ws, account);
    saveDatabase();

    const token = issueStudentSession(account);
    res.json({ token, role: 'student', student, account: toPublicAccount(account), accessCode: code });
  });

  // 2. State Snapshot & Student Preferences
  app.get('/api/state', (req, res) => {
    const mode = getWorkspaceMode(req);
    res.json(buildWorkspaceSnapshot(mode, req));
  });

  app.post('/api/student/profile', (req, res) => {
    const mode = getWorkspaceMode(req);
    const ws = db[mode];
    const student = resolveStudent(ws, req);
    const account = resolveAuthenticatedAccount(req);

    if (typeof req.body?.dormId === 'string' && ws.dorms.some((d) => d.id === req.body.dormId)) {
      student.dormId = req.body.dormId;
      if (account) account.dormId = req.body.dormId;
    }
    if (
      req.body?.preferredReward === 'energy-drink' ||
      req.body?.preferredReward === 'snack-alternative'
    ) {
      student.preferredReward = req.body.preferredReward;
    }
    if (typeof req.body?.monthlyGoalLbs === 'number' && req.body.monthlyGoalLbs >= 1 && req.body.monthlyGoalLbs <= 100) {
      student.monthlyGoalLbs = Number(req.body.monthlyGoalLbs.toFixed(1));
    }
    saveDatabase();
    res.json(buildWorkspaceSnapshot(mode, req));
  });

  app.post('/api/student/quiz', (req, res) => {
    const mode = getWorkspaceMode(req);
    const ws = db[mode];
    const student = resolveStudent(ws, req);
    const isCorrect = Boolean(req.body?.isCorrect);
    student.quizAnswered += 1;
    if (isCorrect) {
      student.quizCorrect += 1;
      student.ecoPoints += 5;
    }
    saveDatabase();
    res.json(buildWorkspaceSnapshot(mode, req));
  });

  app.post('/api/demo/reset', (req, res) => {
    db.demo = createInitialDemoWorkspace();
    saveDatabase();
    res.json(buildWorkspaceSnapshot('demo', req));
  });

  // 3A. AI Waste & Drop-Off Chatbot (Multimodal Gemini 4 Hydrogen: Photo + Text -> Compost/Recycle/Trash + Nearby Stations)
  app.post('/api/chat', async (req, res) => {
    const mode = getWorkspaceMode(req);
    const ws = db[mode];
    const student = resolveStudent(ws, req);

    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    const imageBase64 = typeof req.body?.imageBase64 === 'string' ? req.body.imageBase64 : '';
    const mimeType = typeof req.body?.mimeType === 'string' ? req.body.mimeType : 'image/jpeg';
    const programId: CompostProgramId =
      req.body?.programId === 'usf-commercial' ? 'usf-commercial' : 'tampa-backyard';
    const historyRaw = Array.isArray(req.body?.history) ? req.body.history : [];
    const history: Array<{ role: 'user' | 'assistant'; text: string }> = historyRaw
      .filter(
        (h: unknown): h is { role: 'user' | 'assistant'; text: string } =>
          Boolean(h) &&
          typeof (h as { text?: unknown }).text === 'string' &&
          ((h as { role?: unknown }).role === 'user' || (h as { role?: unknown }).role === 'assistant')
      )
      .slice(-6);

    if (!message && !imageBase64) {
      res.status(400).json({ error: 'Please type a question or attach a photo.' });
      return;
    }

    if (imageBase64) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
        res.status(400).json({ error: 'Unsupported image format. Please use JPEG, PNG, or WebP.' });
        return;
      }
      const cleanCheck = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      if (cleanCheck.length > 10_000_000) {
        res.status(413).json({ error: 'Image is too large. Please keep photos under 7 MB.' });
        return;
      }
    }

    const dormInfo = ws.dorms.find((d) => d.id === student.dormId);
    const homeStation = DEMO_STATIONS.find((s) => s.dormId === student.dormId) || DEMO_STATIONS[0];
    const program = COMPOST_PROGRAMS[programId];

    const stationDirectoryText = DEMO_STATIONS.map(
      (s) => `- ${s.id}: ${s.name} (${s.location}) [Program: ${s.programId}]`
    ).join('\n');

    const historyTranscript =
      history.length > 0
        ? `Recent conversation:\n${history
            .map((h) => `${h.role === 'user' ? 'Student' : 'EcoScrap AI'}: ${h.text}`)
            .join('\n')}\n\n`
        : '';

    const promptText = `${historyTranscript}Student's Dorm Hall: ${dormInfo?.name || 'Juniper Hall'} (Closest Dorm Station: ${homeStation.id} - ${homeStation.name})
Active Composting Ruleset: ${program.name} (${program.description})
Available USF Campus Compost Drop-Off Stations:
${stationDirectoryText}
Campus Recycling & Trash Context: Single-stream blue recycling bins (empty plastic bottles/jugs, aluminum/tin cans, clean flattened cardboard) and landfill trash bins are located beside every USF dorm lobby and campus building corridor. City of Tampa recycling does NOT accept plastic bags/film, styrofoam, or loose plastic utensils (those go to Trash).

Student Message: ${message || 'Please identify every item in this photo as Compost, Recycle, or Trash, and tell me the closest USF locations to drop them off.'}

Respond strictly as JSON with:
1. "reply": Concise, friendly, actionable answer telling the student which items go in Compost, Recycle, or Trash, and specifically where nearby at USF Tampa to drop them off (starting with their dorm station ${homeStation.id} if compostables are present).
2. "items": Array of EVERY distinct item visible in the photo (or mentioned in their question if no photo). For each item:
   - "itemName": clear human label (e.g., "Banana Peel", "Aluminum Soda Can", "White Plastic Fork")
   - "bin": strictly one of "COMPOST", "RECYCLE", or "TRASH"
   - "materialCategory": closest match from ${ALLOWED_CATEGORIES.join(', ')}
   - "reason": 1 short sentence explaining why it goes in Compost, Recycle, or Trash
   - "contaminationNote": short tip (e.g., "Rinse container first", "Remove plastic sticker", or "Keep out of your dorm room compost bin")
3. "recommendedStationIds": Array of 2-3 station IDs from [${DEMO_STATIONS.map((s) => s.id).join(', ')}] ordered from closest/most relevant to the student's dorm (${dormInfo?.name || 'Juniper Hall'}).`;

    try {
      const ai = getGeminiClient();
      const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [];
      if (imageBase64) {
        const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        parts.push({
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        });
      }
      parts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction:
            'You are EcoScrap AI Assistant for University of South Florida (USF Tampa) students. You classify waste photos accurately into COMPOST, RECYCLE, or TRASH using City of Tampa / USF rules, warn about contamination, and guide students to nearby USF drop-off stations.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    itemName: { type: Type.STRING },
                    bin: { type: Type.STRING },
                    materialCategory: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    contaminationNote: { type: Type.STRING },
                  },
                  required: ['itemName', 'bin', 'materialCategory', 'reason'],
                },
              },
              recommendedStationIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['reply', 'items', 'recommendedStationIds'],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim()) as {
        reply?: string;
        items?: Array<{
          itemName: string;
          bin: string;
          materialCategory: string;
          reason: string;
          contaminationNote?: string;
        }>;
        recommendedStationIds?: string[];
      };

      const sortedItems = (Array.isArray(parsed.items) ? parsed.items : []).map((raw) => {
        const normalizedBin =
          raw.bin === 'COMPOST' || raw.bin === 'RECYCLE' || raw.bin === 'TRASH'
            ? raw.bin
            : raw.materialCategory === 'fruit_peel_core' ||
              raw.materialCategory === 'vegetable_scrap' ||
              raw.materialCategory === 'coffee_tea_grounds' ||
              raw.materialCategory === 'eggshells' ||
              raw.materialCategory === 'plain_grains_bread_rice' ||
              raw.materialCategory === 'paper_napkin_unbleached'
            ? 'COMPOST'
            : 'TRASH';

        return {
          itemName: raw.itemName || 'Unidentified Item',
          bin: normalizedBin as 'COMPOST' | 'RECYCLE' | 'TRASH',
          reason: raw.reason || '',
          contaminationNote: raw.contaminationNote || undefined,
          materialCategory: ALLOWED_CATEGORIES.includes(raw.materialCategory as MaterialCategory)
            ? (raw.materialCategory as MaterialCategory)
            : 'unknown_ambiguous',
        };
      });

      // Build nearby drop-off location cards anchored to student's dorm + campus stations
      const requestedIds = Array.isArray(parsed.recommendedStationIds)
        ? parsed.recommendedStationIds
        : [];
      const orderedStations = [
        homeStation,
        ...requestedIds
          .map((id) => DEMO_STATIONS.find((s) => s.id === id))
          .filter((s): s is (typeof DEMO_STATIONS)[number] => Boolean(s)),
        ...DEMO_STATIONS.filter((s) => s.id === 'MSC-01' || s.id === 'LIB-03'),
      ].filter((s, idx, arr) => arr.findIndex((x) => x.id === s.id) === idx);

      const nearbyLocations = orderedStations.slice(0, 3).map((st) => ({
        stationId: st.id,
        name: st.name,
        location: st.location,
        distanceHint:
          st.dormId === student.dormId
            ? `Your Dorm (${dormInfo?.name || 'Residence Hall'}) · ~1 min walk`
            : st.id === 'MSC-01'
            ? 'Central Campus · Marshall Student Center'
            : st.id === 'LIB-03'
            ? 'Campus Core · USF Library East Terrace'
            : 'Nearby USF Residence Hall Station',
        acceptedStreams:
          st.programId === 'usf-commercial'
            ? 'Compost (Commercial) · Campus Recycling & Trash nearby'
            : 'Compost (Room Bin Dump & Weigh-In) · Lobby Recycling & Trash nearby',
      }));

      // If an image was sent and items were identified, record a ScanRecord so student can toss COMPOST items into their Dorm Room Bin
      let createdScan: ScanRecord | undefined;
      if (imageBase64 && sortedItems.length > 0) {
        const evaluatedItems: ScannedItem[] = sortedItems.map((it, idx) =>
          evaluateScannedItem(
            {
              id: `item-${idx + 1}-${crypto.randomBytes(3).toString('hex')}`,
              itemName: it.itemName,
              materialCategory:
                it.bin === 'COMPOST' && it.materialCategory === 'unknown_ambiguous'
                  ? 'vegetable_scrap'
                  : it.materialCategory,
              confidence: 0.9,
              needsClarification: false,
              hasReliableBounds: false,
            },
            programId
          )
        );
        // Auto-mark non-compostables (Recycle/Trash) as separated when user wants to add only compostables to room bin,
        // or keep ScrapCheck honest so contaminants are flagged if still mixed.
        const scrapCheck = computeScrapCheckStatus(evaluatedItems, programId);
        createdScan = {
          id: `SCN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          workspace: mode,
          isDemo: mode === 'demo',
          studentId: student.id,
          programId,
          createdAt: new Date().toISOString(),
          items: evaluatedItems,
          scrapCheck,
          depositInitiated: false,
        };
        ws.scans.unshift(createdScan);
        if (ws.scans.length > 40) ws.scans = ws.scans.slice(0, 40);

        for (const item of evaluatedItems) {
          if (item.classification === 'RED') {
            ws.contaminationIncidents.unshift({
              id: `inc-${crypto.randomBytes(4).toString('hex')}`,
              material: item.itemName,
              category: item.materialCategory,
              stationOrScanId: createdScan.id,
              resolvedByUser: false,
              timestamp: createdScan.createdAt,
              isDemo: mode === 'demo',
            });
          }
        }
        if (scrapCheck.isReadyToCompost) {
          student.ecoPoints += POINTS_PER_CLEAN_SCAN;
        }
        saveDatabase();
      }

      res.json({
        reply:
          parsed.reply ||
          'Here is your Compost / Recycle / Trash breakdown and the closest USF drop-off locations.',
        sortedItems: sortedItems.map(({ itemName, bin, reason, contaminationNote }) => ({
          itemName,
          bin,
          reason,
          contaminationNote,
        })),
        nearbyLocations,
        scan: createdScan,
        snapshot: buildWorkspaceSnapshot(mode, req),
      });
    } catch (err) {
      console.error('Gemini Chat Error:', err);
      const errMsg =
        err instanceof Error ? err.message : 'Failed to analyze message with Gemini AI.';
      res.status(502).json({ error: errMsg });
    }
  });

  // 3. AI Compost Scanner & ScrapCheck (Gemini 4 Hydrogen Vision + Deterministic Rules Engine)
  app.post('/api/scan', async (req, res) => {
    const mode = getWorkspaceMode(req);
    const ws = db[mode];
    const student = resolveStudent(ws, req);

    const imageBase64 = typeof req.body?.imageBase64 === 'string' ? req.body.imageBase64 : '';
    const mimeType = typeof req.body?.mimeType === 'string' ? req.body.mimeType : 'image/jpeg';
    const programId: CompostProgramId =
      req.body?.programId === 'usf-commercial' ? 'usf-commercial' : 'tampa-backyard';

    if (!imageBase64) {
      res.status(400).json({ error: 'Please upload or capture an image to scan.' });
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      res.status(400).json({ error: 'Unsupported image format. Please use JPEG, PNG, or WebP.' });
      return;
    }
    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    if (cleanBase64.length > 10_000_000) {
      res.status(413).json({ error: 'Image is too large. Please keep photos under 7 MB.' });
      return;
    }

    try {
      const ai = getGeminiClient();
      const prompt = `Analyze this photograph of food scraps and food-related items for campus composting screening.
Identify EVERY distinct item visible in the image (for example: banana peels, apple cores, rice, vegetable scraps, meat or bones, plastic forks, food wrappers, paper napkins, food packaging, cups, etc.).

For each item:
1. Give a clear human-friendly "itemName" (e.g., "Banana Peel", "Chopped Vegetable Scraps", "White Plastic Fork", "Brown Paper Napkin").
2. Choose the single closest "materialCategory" from this exact list:
   - fruit_peel_core
   - vegetable_scrap
   - coffee_tea_grounds
   - eggshells
   - plain_grains_bread_rice
   - paper_napkin_unbleached
   - citrus_acidic_peels
   - meat_bones_fish
   - dairy_oil_grease
   - plastic_utensil
   - plastic_wrapper_film
   - bioplastic_pla
   - coated_paper_foil
   - unknown_ambiguous
3. Provide "confidence" from 0.0 to 1.0.
4. Set "needsClarification" to true ONLY if the object cannot be confidently identified (e.g., unclear whether a fork is petroleum plastic or BPI compostable, unclear liquid/sauce, blurry wrapper). Provide a concise "clarificationQuestion".
5. Provide normalized 0-1000 bounding box coordinates ("ymin", "xmin", "ymax", "xmax") and set "hasReliableBounds" to true ONLY when you can tightly localize the object in the frame. If items are scattered or overlapping and cannot be cleanly boxed, set "hasReliableBounds" to false.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          systemInstruction:
            'You are EcoScrap ScrapCheck Vision, an accurate agricultural and waste-sorting visual classifier. Identify every food scrap and potential contaminant in the image strictly according to the schema. Never invent bounding boxes if uncertain.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    itemName: { type: Type.STRING },
                    materialCategory: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    needsClarification: { type: Type.BOOLEAN },
                    clarificationQuestion: { type: Type.STRING },
                    hasReliableBounds: { type: Type.BOOLEAN },
                    boundingBox: {
                      type: Type.OBJECT,
                      properties: {
                        ymin: { type: Type.NUMBER },
                        xmin: { type: Type.NUMBER },
                        ymax: { type: Type.NUMBER },
                        xmax: { type: Type.NUMBER },
                      },
                    },
                  },
                  required: [
                    'itemName',
                    'materialCategory',
                    'confidence',
                    'needsClarification',
                    'hasReliableBounds',
                  ],
                },
              },
            },
            required: ['items'],
          },
        },
      });

      const rawText = (response.text || '{}').trim();
      const parsed = JSON.parse(rawText) as {
        items?: Array<{
          itemName: string;
          materialCategory: string;
          confidence: number;
          needsClarification?: boolean;
          clarificationQuestion?: string;
          hasReliableBounds?: boolean;
          boundingBox?: { ymin: number; xmin: number; ymax: number; xmax: number };
        }>;
      };

      const detectedList = Array.isArray(parsed.items) ? parsed.items : [];
      const evaluatedItems: ScannedItem[] = detectedList.map((raw, idx) => {
        const safeCategory: MaterialCategory = ALLOWED_CATEGORIES.includes(
          raw.materialCategory as MaterialCategory
        )
          ? (raw.materialCategory as MaterialCategory)
          : 'unknown_ambiguous';

        const validBox =
          raw.hasReliableBounds &&
          raw.boundingBox &&
          raw.boundingBox.ymax > raw.boundingBox.ymin &&
          raw.boundingBox.xmax > raw.boundingBox.xmin
            ? {
                ymin: Math.max(0, Math.min(1000, raw.boundingBox.ymin)),
                xmin: Math.max(0, Math.min(1000, raw.boundingBox.xmin)),
                ymax: Math.max(0, Math.min(1000, raw.boundingBox.ymax)),
                xmax: Math.max(0, Math.min(1000, raw.boundingBox.xmax)),
              }
            : undefined;

        return evaluateScannedItem(
          {
            id: `item-${idx + 1}-${crypto.randomBytes(3).toString('hex')}`,
            itemName: raw.itemName || 'Unidentified Item',
            materialCategory: safeCategory,
            confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.75,
            needsClarification: Boolean(raw.needsClarification),
            clarificationQuestion: raw.clarificationQuestion,
            hasReliableBounds: Boolean(validBox),
            boundingBox: validBox,
          },
          programId
        );
      });

      const scrapCheck = computeScrapCheckStatus(evaluatedItems, programId);
      const scanRecord: ScanRecord = {
        id: `SCN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        workspace: mode,
        isDemo: mode === 'demo',
        studentId: student.id,
        programId,
        createdAt: new Date().toISOString(),
        items: evaluatedItems,
        scrapCheck,
        depositInitiated: false,
      };

      ws.scans.unshift(scanRecord);
      if (ws.scans.length > 40) ws.scans = ws.scans.slice(0, 40);

      // Record any RED contaminants into contamination analytics
      for (const item of evaluatedItems) {
        if (item.classification === 'RED') {
          ws.contaminationIncidents.unshift({
            id: `inc-${crypto.randomBytes(4).toString('hex')}`,
            material: item.itemName,
            category: item.materialCategory,
            stationOrScanId: scanRecord.id,
            resolvedByUser: false,
            timestamp: scanRecord.createdAt,
            isDemo: mode === 'demo',
          });
        }
      }
      if (scrapCheck.isReadyToCompost) {
        student.ecoPoints += POINTS_PER_CLEAN_SCAN;
      }

      saveDatabase();
      res.json({ scan: scanRecord, snapshot: buildWorkspaceSnapshot(mode, req) });
    } catch (err) {
      console.error('Gemini Scan Error:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to analyze food scrap image with Gemini AI.';
      res.status(502).json({ error: message });
    }
  });

  app.post('/api/scan/:scanId/program', (req, res) => {
    const mode = getWorkspaceMode(req);
    const ws = db[mode];
    const scan = ws.scans.find((s) => s.id === req.params.scanId);
    if (!scan) {
      res.status(404).json({ error: 'Scan record not found.' });
      return;
    }
    const programId: CompostProgramId =
      req.body?.programId === 'usf-commercial' ? 'usf-commercial' : 'tampa-backyard';
    scan.programId = programId;
    scan.items = scan.items.map((item) =>
      evaluateScannedItem(
        {
          ...item,
          clarificationResolved: item.clarificationResolved,
        },
        programId
      )
    );
    scan.scrapCheck = computeScrapCheckStatus(scan.items, programId);
    saveDatabase();
    res.json({ scan, snapshot: buildWorkspaceSnapshot(mode, req) });
  });

  app.post('/api/scan/:scanId/items/:itemId/separate', (req, res) => {
    const mode = getWorkspaceMode(req);
    const ws = db[mode];
    const student = resolveStudent(ws, req);
    const scan = ws.scans.find((s) => s.id === req.params.scanId);
    if (!scan) {
      res.status(404).json({ error: 'Scan record not found.' });
      return;
    }
    const item = scan.items.find((i) => i.id === req.params.itemId);
    if (!item) {
      res.status(404).json({ error: 'Scanned item not found.' });
      return;
    }
    const wasReady = scan.scrapCheck.isReadyToCompost;
    item.separated = typeof req.body?.separated === 'boolean' ? req.body.separated : !item.separated;
    scan.scrapCheck = computeScrapCheckStatus(scan.items, scan.programId);

    if (item.separated && item.classification === 'RED') {
      const incident = ws.contaminationIncidents.find(
        (inc) => inc.stationOrScanId === scan.id && inc.material === item.itemName
      );
      if (incident) incident.resolvedByUser = true;
    }
    if (!wasReady && scan.scrapCheck.isReadyToCompost) {
      student.ecoPoints += POINTS_PER_CLEAN_SCAN;
    }

    saveDatabase();
    res.json({ scan, snapshot: buildWorkspaceSnapshot(mode, req) });
  });

  app.post('/api/scan/:scanId/items/:itemId/clarify', (req, res) => {
    const mode = getWorkspaceMode(req);
    const ws = db[mode];
    const student = resolveStudent(ws, req);
    const scan = ws.scans.find((s) => s.id === req.params.scanId);
    if (!scan) {
      res.status(404).json({ error: 'Scan record not found.' });
      return;
    }
    const itemIndex = scan.items.findIndex((i) => i.id === req.params.itemId);
    if (itemIndex === -1) {
      res.status(404).json({ error: 'Scanned item not found.' });
      return;
    }
    const chosenCategory = req.body?.materialCategory as MaterialCategory;
    if (!ALLOWED_CATEGORIES.includes(chosenCategory)) {
      res.status(400).json({ error: 'Invalid material category selected.' });
      return;
    }
    const current = scan.items[itemIndex];
    const wasReady = scan.scrapCheck.isReadyToCompost;

    scan.items[itemIndex] = evaluateScannedItem(
      {
        ...current,
        itemName:
          typeof req.body?.updatedName === 'string' && req.body.updatedName.trim()
            ? req.body.updatedName.trim().slice(0, 80)
            : current.itemName,
        materialCategory: chosenCategory,
        confidence: 0.95,
        needsClarification: false,
        clarificationResolved: true,
      },
      scan.programId
    );
    scan.scrapCheck = computeScrapCheckStatus(scan.items, scan.programId);
    if (!wasReady && scan.scrapCheck.isReadyToCompost) {
      student.ecoPoints += POINTS_PER_CLEAN_SCAN;
    }

    saveDatabase();
    res.json({ scan, snapshot: buildWorkspaceSnapshot(mode, req) });
  });

  // 4. Verified Compost Deposit Workflow (Student Initiates -> Staff Approves/Rejects)
  app.post('/api/deposits', (req, res) => {
    const mode = getWorkspaceMode(req);
    const ws = db[mode];
    const student = resolveStudent(ws, req);

    const scanId = typeof req.body?.scanId === 'string' ? req.body.scanId : '';
    const stationId = typeof req.body?.stationId === 'string' ? req.body.stationId : 'MSC-01';
    const estimatedWeightLbs =
      typeof req.body?.estimatedWeightLbs === 'number' && req.body.estimatedWeightLbs > 0
        ? Math.min(50, Number(req.body.estimatedWeightLbs.toFixed(1)))
        : 2.0;

    const station = DEMO_STATIONS.find((s) => s.id === stationId || s.qrCode === stationId);
    if (!station) {
      res.status(400).json({ error: 'Please select a valid participating USF station.' });
      return;
    }

    const scan = ws.scans.find((s) => s.id === scanId);
    if (scan && !scan.scrapCheck.isReadyToCompost) {
      res.status(400).json({
        error: 'ScrapCheck is not cleared yet. Please remove or separate contaminants before initiating a deposit.',
      });
      return;
    }

    const acceptedItems = scan
      ? scan.items.filter((i) => !i.separated && i.classification === 'GREEN').map((i) => i.itemName)
      : ['Verified Compostable Food Scraps'];

    const deposit: DepositRecord = {
      id: `DEP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      workspace: mode,
      isDemo: mode === 'demo',
      studentId: student.id,
      studentAlias: student.displayName,
      dormId: student.dormId,
      stationId: station.id,
      stationName: station.name,
      scanId: scan?.id || 'DIRECT-STATION',
      programId: scan?.programId || station.programId,
      itemSummary: acceptedItems,
      estimatedWeightLbs,
      source: 'direct-scan',
      verifiedWeightLbs: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    if (scan) scan.depositInitiated = true;
    ws.deposits.unshift(deposit);
    saveDatabase();
    res.json({ deposit, snapshot: buildWorkspaceSnapshot(mode, req) });
  });

  app.post('/api/room-bin/add', (req, res) => {
    const mode = getWorkspaceMode(req);
    const ws = db[mode];
    const student = resolveStudent(ws, req);

    const scanId = typeof req.body?.scanId === 'string' ? req.body.scanId : '';
    const estimatedWeightLbs =
      typeof req.body?.estimatedWeightLbs === 'number' && req.body.estimatedWeightLbs > 0
        ? Math.min(25, Number(req.body.estimatedWeightLbs.toFixed(1)))
        : 1.0;

    const scan = ws.scans.find((s) => s.id === scanId);
    if (!scan) {
      res.status(404).json({ error: 'Scan record not found.' });
      return;
    }
    if (!scan.scrapCheck.isReadyToCompost) {
      res.status(400).json({
        error: 'Separate red contaminants or clarify yellow items before placing scraps in your dorm room bin.',
      });
      return;
    }

    const acceptedItems = scan.items
      .filter((i) => !i.separated && i.classification === 'GREEN')
      .map((i) => i.itemName);

    if (!ws.roomBinBatches) ws.roomBinBatches = [];
    ws.roomBinBatches.unshift({
      id: `BIN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      studentId: student.id,
      scanId: scan.id,
      itemNames: acceptedItems,
      estimatedWeightLbs,
      addedAt: new Date().toISOString(),
    });
    scan.addedToRoomBin = true;
    saveDatabase();
    res.json({ snapshot: buildWorkspaceSnapshot(mode, req) });
  });

  app.post('/api/room-bin/dump', (req, res) => {
    const mode = getWorkspaceMode(req);
    const ws = db[mode];
    const student = resolveStudent(ws, req);

    const stationId = typeof req.body?.stationId === 'string' ? req.body.stationId : 'JUN-02';
    const station = DEMO_STATIONS.find((s) => s.id === stationId || s.qrCode === stationId);
    if (!station) {
      res.status(400).json({ error: 'Please select a valid dorm building compost station.' });
      return;
    }

    const batches = (ws.roomBinBatches || []).filter((b) => b.studentId === student.id);
    if (batches.length === 0) {
      res.status(400).json({ error: 'Your dorm room compost bin is currently empty.' });
      return;
    }

    const rawScaleWeight = Number(req.body?.measuredWeightLbs);
    const measuredWeightLbs =
      Number.isFinite(rawScaleWeight) && rawScaleWeight > 0 && rawScaleWeight <= 100
        ? Number(rawScaleWeight.toFixed(2))
        : Number(batches.reduce((sum, b) => sum + b.estimatedWeightLbs, 0).toFixed(2));

    const allItems = Array.from(new Set(batches.flatMap((b) => b.itemNames)));

    const deposit: DepositRecord = {
      id: `DEP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      workspace: mode,
      isDemo: mode === 'demo',
      studentId: student.id,
      studentAlias: student.displayName,
      dormId: student.dormId,
      stationId: station.id,
      stationName: station.name,
      scanId: batches[0].scanId,
      programId: station.programId,
      itemSummary: allItems.length > 0 ? allItems : ['Room Bin Food Scraps'],
      estimatedWeightLbs: measuredWeightLbs,
      scaleReportedWeightLbs: measuredWeightLbs,
      source: 'dorm-bin-dump',
      verifiedWeightLbs: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    ws.roomBinBatches = (ws.roomBinBatches || []).filter((b) => b.studentId !== student.id);
    ws.deposits.unshift(deposit);
    saveDatabase();
    res.json({ deposit, snapshot: buildWorkspaceSnapshot(mode, req) });
  });

  app.post('/api/deposits/:depositId/verify', (req, res) => {
    const mode = getWorkspaceMode(req);
    const ws = db[mode];

    // Strict authorization check in Live Campus Mode
    if (mode === 'real') {
      const session = getAuthSession(req);
      if (!session || session.role !== 'staff') {
        res.status(403).json({
          error:
            'Unauthorized: Only authenticated compost station staff or campus admins can approve or reject live deposits.',
        });
        return;
      }
    }

    const deposit = ws.deposits.find((d) => d.id === req.params.depositId);
    if (!deposit) {
      res.status(404).json({ error: 'Deposit record not found.' });
      return;
    }

    // Prevent double approval or re-processing
    if (deposit.status !== 'pending') {
      res.status(409).json({
        error: `Deposit ${deposit.id} has already been ${deposit.status} and cannot be modified twice.`,
      });
      return;
    }

    const decision = req.body?.decision === 'reject' ? 'reject' : 'approve';
    const verifierLabel =
      mode === 'demo' ? 'Demo Station Staff (Simulated)' : 'Authorized USF Station Verifier';

    if (decision === 'reject') {
      const reason =
        typeof req.body?.rejectionReason === 'string' && req.body.rejectionReason.trim()
          ? req.body.rejectionReason.trim().slice(0, 160)
          : 'Physical scale inspection found unseparated contamination.';
      deposit.status = 'rejected';
      deposit.rejectionReason = reason;
      deposit.verifiedAt = new Date().toISOString();
      deposit.verifiedBy = verifierLabel;
      saveDatabase();
      res.json({
        deposit,
        newlyUnlockedVouchers: [],
        snapshot: buildWorkspaceSnapshot(mode, req),
      });
      return;
    }

    const rawWeight = Number(req.body?.confirmedWeightLbs);
    if (!Number.isFinite(rawWeight) || rawWeight <= 0 || rawWeight > 100) {
      res.status(400).json({ error: 'Confirmed scale weight must be between 0.1 and 100.0 lbs.' });
      return;
    }

    const confirmedWeightLbs = Number(rawWeight.toFixed(2));
    deposit.status = 'approved';
    deposit.verifiedWeightLbs = confirmedWeightLbs;
    deposit.verifiedAt = new Date().toISOString();
    deposit.verifiedBy = verifierLabel;

    const student = ws.students[deposit.studentId];
    const newlyUnlockedVouchers: VoucherRecord[] = [];

    if (student) {
      const previousMilestones = Math.floor(student.verifiedWeightLbs / REWARD_THRESHOLD_LBS);
      student.verifiedWeightLbs = Number((student.verifiedWeightLbs + confirmedWeightLbs).toFixed(2));
      student.ecoPoints += Math.round(confirmedWeightLbs * POINTS_PER_VERIFIED_LB);
      const newMilestones = Math.floor(student.verifiedWeightLbs / REWARD_THRESHOLD_LBS);

      // Update Dorm leaderboard
      const dorm = ws.dorms.find((d) => d.id === deposit.dormId);
      if (dorm) {
        dorm.totalLbs = Number((dorm.totalLbs + confirmedWeightLbs).toFixed(2));
        dorm.weeklyLbs = Number((dorm.weeklyLbs + confirmedWeightLbs).toFixed(2));
      }

      // Update latest weekly series bucket
      if (ws.weeklySeries.length > 0) {
        const latest = ws.weeklySeries[ws.weeklySeries.length - 1];
        latest.lbs = Number((latest.lbs + confirmedWeightLbs).toFixed(2));
      }

      // Mint 1 unique single-use voucher per crossed 5-lb milestone
      for (let m = previousMilestones + 1; m <= newMilestones; m++) {
        const choice: RewardChoice = student.preferredReward || 'energy-drink';
        const voucher: VoucherRecord = {
          id: `VCH-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          code: `ECO-${crypto.randomBytes(3).toString('hex').toUpperCase()}-${m}`,
          workspace: mode,
          isDemo: mode === 'demo',
          studentId: student.id,
          milestoneNumber: m,
          milestoneLbs: m * REWARD_THRESHOLD_LBS,
          rewardTitle:
            choice === 'energy-drink'
              ? 'Free Energy Drink Voucher (Simulated)'
              : 'Free Healthy Campus Snack Voucher (Simulated)',
          rewardChoice: choice,
          status: 'available',
          unlockedAt: new Date().toISOString(),
        };
        ws.vouchers.unshift(voucher);
        newlyUnlockedVouchers.push(voucher);
      }
    }

    saveDatabase();
    res.json({
      deposit,
      newlyUnlockedVouchers,
      snapshot: buildWorkspaceSnapshot(mode, req),
    });
  });

  // 5. Single-Use Voucher Redemption (Staff Authorized in Live Mode)
  app.post('/api/vouchers/:voucherId/redeem', (req, res) => {
    const mode = getWorkspaceMode(req);
    const ws = db[mode];

    if (mode === 'real') {
      const session = getAuthSession(req);
      if (!session || session.role !== 'staff') {
        res.status(403).json({
          error:
            'Unauthorized: Reward vouchers can only be redeemed by authorized staff verification.',
        });
        return;
      }
    }

    const voucher = ws.vouchers.find((v) => v.id === req.params.voucherId);
    if (!voucher) {
      res.status(404).json({ error: 'Voucher not found.' });
      return;
    }
    if (mode !== 'real') {
      const student = resolveStudent(ws, req);
      if (voucher.studentId !== student.id) {
        res.status(403).json({ error: 'You can only redeem reward vouchers belonging to your account.' });
        return;
      }
    }
    if (voucher.status !== 'available') {
      res.status(409).json({ error: 'This voucher has already been redeemed (single-use only).' });
      return;
    }

    const choice: RewardChoice =
      req.body?.rewardChoice === 'snack-alternative' ? 'snack-alternative' : voucher.rewardChoice;
    voucher.rewardChoice = choice;
    voucher.rewardTitle =
      choice === 'energy-drink'
        ? 'Free Energy Drink Voucher (Simulated)'
        : 'Free Healthy Campus Snack Voucher (Simulated)';
    voucher.status = 'redeemed';
    voucher.redeemedAt = new Date().toISOString();
    voucher.redeemedByStaff =
      mode === 'demo' ? 'Demo Campus Counter (Simulated)' : 'Authorized Campus Partner Staff';

    saveDatabase();
    res.json({ voucher, snapshot: buildWorkspaceSnapshot(mode, req) });
  });

  app.get('/api/app-url-status', async (_req, res) => {
    const appUrl = (process.env.APP_URL || '').replace(/\/+$/, '');
    const sharedUrl = appUrl.includes('://ais-dev-')
      ? appUrl.replace('://ais-dev-', '://ais-pre-')
      : appUrl;

    let sharedUrlLive = false;
    if (sharedUrl && sharedUrl !== appUrl) {
      try {
        const probe = await fetch(sharedUrl, {
          method: 'HEAD',
          redirect: 'manual',
          signal: AbortSignal.timeout(1500),
        });
        sharedUrlLive = probe.status >= 200 && probe.status < 400;
      } catch {
        sharedUrlLive = false;
      }
    } else if (sharedUrl) {
      sharedUrlLive = true;
    }

    res.json({ appUrl, sharedUrl, sharedUrlLive });
  });

  // Vite dev middleware or production static build
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EcoScrap server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
