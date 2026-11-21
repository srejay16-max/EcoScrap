import type {
  AuthAccountResponse,
  ChatTurnResponse,
  CompostProgramId,
  MaterialCategory,
  PublicAccount,
  RewardChoice,
  ScanResponse,
  StaffAuthStatus,
  VerifyDepositResponse,
  VoucherRecord,
  WorkspaceMode,
  WorkspaceSnapshot,
} from '../types';

// In-memory auth tokens only (never persisted to localStorage or sessionStorage)
let studentToken: string | null = null;
let staffToken: string | null = null;

export function setStudentToken(token: string | null) {
  studentToken = token;
}

export function setStaffToken(token: string | null) {
  staffToken = token;
}

export function hasStaffToken(): boolean {
  return Boolean(staffToken);
}

export function hasStudentToken(): boolean {
  return Boolean(studentToken);
}

async function requestJson<T>(
  url: string,
  options: RequestInit & { workspace?: WorkspaceMode; useStaffAuth?: boolean } = {}
): Promise<T> {
  const { workspace, useStaffAuth, headers: customHeaders, ...rest } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string> | undefined),
  };

  if (workspace) {
    headers['X-EcoScrap-Workspace'] = workspace;
  }

  const activeToken = useStaffAuth ? staffToken : studentToken || staffToken;
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

  const res = await fetch(url, { ...rest, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  getState(workspace: WorkspaceMode) {
    return requestJson<WorkspaceSnapshot>(`/api/state?workspace=${workspace}`, { workspace });
  },

  getStaffAuthStatus() {
    return requestJson<StaffAuthStatus>('/api/auth/staff-status');
  },

  async claimStaffPasscode(passcode: string) {
    const res = await requestJson<{ token: string; role: string; displayName: string }>(
      '/api/auth/claim-staff-passcode',
      {
        method: 'POST',
        body: JSON.stringify({ passcode }),
      }
    );
    staffToken = res.token;
    return res;
  },

  async loginStaff(passcode: string) {
    const res = await requestJson<{ token: string; role: string; displayName: string }>(
      '/api/auth/staff-login',
      {
        method: 'POST',
        body: JSON.stringify({ passcode }),
      }
    );
    staffToken = res.token;
    return res;
  },

  async loginStudent(displayName: string, dormId: string) {
    const res = await requestJson<{ token: string; role: string }>('/api/auth/student-login', {
      method: 'POST',
      body: JSON.stringify({ displayName, dormId }),
    });
    studentToken = res.token;
    return res;
  },

  async createGuestAccount(
    workspace: WorkspaceMode,
    payload: { displayName?: string; dormId: string }
  ) {
    const res = await requestJson<AuthAccountResponse>('/api/auth/guest', {
      method: 'POST',
      workspace,
      body: JSON.stringify({ ...payload, workspace }),
    });
    studentToken = res.token;
    return res;
  },

  async registerAccount(
    workspace: WorkspaceMode,
    payload: { displayName: string; username: string; password: string; dormId: string }
  ) {
    const res = await requestJson<AuthAccountResponse>('/api/auth/register', {
      method: 'POST',
      workspace,
      body: JSON.stringify({ ...payload, workspace }),
    });
    studentToken = res.token;
    return res;
  },

  async loginWithGuestCode(workspace: WorkspaceMode, guestCode: string) {
    const res = await requestJson<AuthAccountResponse>('/api/auth/login', {
      method: 'POST',
      workspace,
      body: JSON.stringify({ guestCode, workspace }),
    });
    studentToken = res.token;
    return res;
  },

  async loginWithCredentials(workspace: WorkspaceMode, username: string, password: string) {
    const res = await requestJson<AuthAccountResponse>('/api/auth/login', {
      method: 'POST',
      workspace,
      body: JSON.stringify({ username, password, workspace }),
    });
    studentToken = res.token;
    return res;
  },

  async upgradeGuestAccount(
    workspace: WorkspaceMode,
    payload: { displayName?: string; username: string; password: string }
  ) {
    return requestJson<{ account: PublicAccount; snapshot: WorkspaceSnapshot }>(
      '/api/auth/upgrade-guest',
      {
        method: 'POST',
        workspace,
        body: JSON.stringify({ ...payload, workspace }),
      }
    );
  },

  async logoutStudent() {
    try {
      await requestJson<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
    } catch {
      // Clear local in-memory token regardless of network error
    } finally {
      studentToken = null;
    }
  },

  updateProfile(
    workspace: WorkspaceMode,
    payload: { dormId?: string; preferredReward?: RewardChoice; monthlyGoalLbs?: number }
  ) {
    return requestJson<WorkspaceSnapshot>('/api/student/profile', {
      method: 'POST',
      workspace,
      body: JSON.stringify({ ...payload, workspace }),
    });
  },

  resetDemo() {
    return requestJson<WorkspaceSnapshot>('/api/demo/reset', {
      method: 'POST',
      workspace: 'demo',
      body: JSON.stringify({ workspace: 'demo' }),
    });
  },

  sendChatMessage(
    workspace: WorkspaceMode,
    payload: {
      message: string;
      imageBase64?: string;
      mimeType?: string;
      programId: CompostProgramId;
      history: Array<{ role: 'user' | 'assistant'; text: string }>;
    }
  ) {
    return requestJson<ChatTurnResponse>('/api/chat', {
      method: 'POST',
      workspace,
      body: JSON.stringify({ ...payload, workspace }),
    });
  },

  scanImage(
    workspace: WorkspaceMode,
    payload: { imageBase64: string; mimeType: string; programId: CompostProgramId }
  ) {
    return requestJson<ScanResponse>('/api/scan', {
      method: 'POST',
      workspace,
      body: JSON.stringify({ ...payload, workspace }),
    });
  },

  updateScanProgram(workspace: WorkspaceMode, scanId: string, programId: CompostProgramId) {
    return requestJson<ScanResponse>(`/api/scan/${scanId}/program`, {
      method: 'POST',
      workspace,
      body: JSON.stringify({ programId, workspace }),
    });
  },

  toggleSeparateItem(
    workspace: WorkspaceMode,
    scanId: string,
    itemId: string,
    separated: boolean
  ) {
    return requestJson<ScanResponse>(`/api/scan/${scanId}/items/${itemId}/separate`, {
      method: 'POST',
      workspace,
      body: JSON.stringify({ separated, workspace }),
    });
  },

  clarifyItem(
    workspace: WorkspaceMode,
    scanId: string,
    itemId: string,
    materialCategory: MaterialCategory,
    updatedName?: string
  ) {
    return requestJson<ScanResponse>(`/api/scan/${scanId}/items/${itemId}/clarify`, {
      method: 'POST',
      workspace,
      body: JSON.stringify({ materialCategory, updatedName, workspace }),
    });
  },

  initiateDeposit(
    workspace: WorkspaceMode,
    payload: { scanId?: string; stationId: string; estimatedWeightLbs: number }
  ) {
    return requestJson<{ deposit: unknown; snapshot: WorkspaceSnapshot }>('/api/deposits', {
      method: 'POST',
      workspace,
      body: JSON.stringify({ ...payload, workspace }),
    });
  },

  addToRoomBin(
    workspace: WorkspaceMode,
    payload: { scanId: string; estimatedWeightLbs: number }
  ) {
    return requestJson<{ snapshot: WorkspaceSnapshot }>('/api/room-bin/add', {
      method: 'POST',
      workspace,
      body: JSON.stringify({ ...payload, workspace }),
    });
  },

  dumpRoomBinAtStation(
    workspace: WorkspaceMode,
    payload: { stationId: string; measuredWeightLbs: number }
  ) {
    return requestJson<{ deposit: unknown; snapshot: WorkspaceSnapshot }>('/api/room-bin/dump', {
      method: 'POST',
      workspace,
      body: JSON.stringify({ ...payload, workspace }),
    });
  },

  verifyDeposit(
    workspace: WorkspaceMode,
    depositId: string,
    payload: {
      decision: 'approve' | 'reject';
      confirmedWeightLbs?: number;
      rejectionReason?: string;
    }
  ) {
    return requestJson<VerifyDepositResponse>(`/api/deposits/${depositId}/verify`, {
      method: 'POST',
      workspace,
      useStaffAuth: workspace === 'real',
      body: JSON.stringify({ ...payload, workspace }),
    });
  },

  redeemVoucher(workspace: WorkspaceMode, voucherId: string, rewardChoice: RewardChoice) {
    return requestJson<{ voucher: VoucherRecord; snapshot: WorkspaceSnapshot }>(
      `/api/vouchers/${voucherId}/redeem`,
      {
        method: 'POST',
        workspace,
        useStaffAuth: workspace === 'real',
        body: JSON.stringify({ rewardChoice, workspace }),
      }
    );
  },
};
