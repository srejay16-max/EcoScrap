import React, { useEffect, useState } from 'react';
import {
  Award,
  BarChart3,
  Globe2,
  Home,
  Leaf,
  Menu,
  MessageSquareText,
  QrCode,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sprout,
  Trophy,
  UserCircle2,
  X,
} from 'lucide-react';
import type { NavTab, ScanRecord, VoucherRecord, WorkspaceMode, WorkspaceSnapshot } from './types';
import { api } from './api/client';
import { HomeView } from './components/HomeView';
import { ChatbotView } from './components/ChatbotView';
import { DepositsView } from './components/DepositsView';
import { RewardsView } from './components/RewardsView';
import { LeaderboardView } from './components/LeaderboardView';
import { EcoImpactStrip } from './components/EcoImpactStrip';
import { CompostLoopView } from './components/CompostLoopView';
import { DashboardView } from './components/DashboardView';
import { WebsiteQrModal } from './components/WebsiteQrModal';
import { AccountModal } from './components/AccountModal';

const NAV_ITEMS: Array<{ id: NavTab; label: string; Icon: React.FC<{ className?: string }> }> = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'scanner', label: 'AI Waste Scanner', Icon: MessageSquareText },
  { id: 'rewards', label: 'EcoRewards', Icon: Award },
  { id: 'deposits', label: 'Compost Deposits', Icon: Scale },
  { id: 'leaderboard', label: 'Campus Leaderboard', Icon: Trophy },
  { id: 'dashboard', label: 'Campus Dashboard', Icon: BarChart3 },
  { id: 'ecoimpact', label: 'EcoImpact', Icon: Globe2 },
  { id: 'compost-loop', label: 'Campus Compost Loop', Icon: Sprout },
];

const VALID_TABS = new Set<NavTab>(NAV_ITEMS.map((item) => item.id));

function readInitialQueryParams(): { tab: NavTab; workspace: WorkspaceMode } {
  if (typeof window === 'undefined') {
    return { tab: 'home', workspace: 'demo' };
  }
  const params = new URLSearchParams(window.location.search);
  const rawTab = params.get('tab');
  const normalizedTab =
    rawTab === 'scrapcheck' || rawTab === 'chatbot' ? 'scanner' : (rawTab as NavTab | null);
  const rawWorkspace = params.get('workspace');
  return {
    tab: normalizedTab && VALID_TABS.has(normalizedTab) ? normalizedTab : 'home',
    workspace: rawWorkspace === 'real' ? 'real' : 'demo',
  };
}

export default function App() {
  const initialQuery = readInitialQueryParams();
  const [workspace, setWorkspace] = useState<WorkspaceMode>(initialQuery.workspace);
  const [activeTab, setActiveTab] = useState<NavTab>(initialQuery.tab);
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeScan, setActiveScan] = useState<ScanRecord | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [recentUnlockedVoucher, setRecentUnlockedVoucher] = useState<VoucherRecord | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [websiteQrOpen, setWebsiteQrOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [activeAccessCode, setActiveAccessCode] = useState<string | null>(null);

  const loadSnapshot = async (mode: WorkspaceMode) => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api.getState(mode);
      setSnapshot(data);
      setActiveScan(data.scans[0] || null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to load EcoScrap data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSnapshot(workspace);
  }, [workspace]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set('tab', activeTab);
    params.set('workspace', workspace);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', nextUrl);
  }, [activeTab, workspace]);

  const handleWorkspaceSwitch = (nextMode: WorkspaceMode) => {
    if (nextMode === workspace) return;
    setPreviewImageUrl(null);
    setRecentUnlockedVoucher(null);
    setWorkspace(nextMode);
  };

  const handleAccountAuthSuccess = (nextSnapshot: WorkspaceSnapshot, accessCode?: string | null) => {
    setSnapshot(nextSnapshot);
    setActiveScan(nextSnapshot.scans[0] || null);
    setRecentUnlockedVoucher(null);
    if (accessCode !== undefined) {
      setActiveAccessCode(accessCode);
    }
  };

  const handleAccountLoggedOut = async () => {
    setActiveAccessCode(null);
    setRecentUnlockedVoucher(null);
    await loadSnapshot(workspace);
  };

  const navigateTo = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleSnapshotUpdated = (
    updated: WorkspaceSnapshot,
    unlockedVouchers?: VoucherRecord[]
  ) => {
    setSnapshot(updated);
    if (unlockedVouchers && unlockedVouchers.length > 0) {
      setRecentUnlockedVoucher(unlockedVouchers[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#143326] flex flex-col lg:flex-row">
      {/* Desktop Left Sidebar Navigation (256px) */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-[#143326]/12 z-30">
        <div className="px-5 py-5 border-b border-[#143326]/10">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2.5 text-left cursor-pointer"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#143326] text-[#BEF264] shrink-0">
              <Leaf className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-[#143326] whitespace-nowrap">
              EcoScrap
            </span>
          </button>
          <p className="mt-1.5 text-xs text-[#4F775A] font-medium">From Scraps to Soil.</p>
        </div>

        <nav aria-label="Primary Navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => navigateTo(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#143326] text-white'
                    : 'text-[#143326]/80 hover:bg-[#FAF8F3] hover:text-[#143326]'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${active ? 'text-[#BEF264]' : 'text-[#4F775A]'}`}
                />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Workspace Mode Switcher in Sidebar Footer */}
        <div className="p-4 border-t border-[#143326]/10 bg-[#FAF8F3] space-y-2.5">
          <div className="text-[11px] font-medium text-[#143326]/65">Environment Separation</div>
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-[#143326]/15 bg-white p-1">
            <button
              type="button"
              onClick={() => handleWorkspaceSwitch('demo')}
              className={`rounded-lg py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                workspace === 'demo' ? 'bg-[#143326] text-white' : 'text-[#143326]/70 hover:bg-[#FAF8F3]'
              }`}
            >
              Demo Mode
            </button>
            <button
              type="button"
              onClick={() => handleWorkspaceSwitch('real')}
              className={`rounded-lg py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                workspace === 'real' ? 'bg-[#143326] text-white' : 'text-[#143326]/70 hover:bg-[#FAF8F3]'
              }`}
            >
              Live USF
            </button>
          </div>
          <button
            type="button"
            onClick={() => setAccountModalOpen(true)}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#143326]/20 bg-white px-3 py-2 text-xs font-semibold text-[#143326] hover:bg-[#ECFDF5] transition-colors cursor-pointer truncate"
          >
            <UserCircle2 className="h-3.5 w-3.5 text-[#15803D] shrink-0" aria-hidden="true" />
            <span className="truncate">
              {snapshot?.account
                ? `${snapshot.account.accountType === 'guest' ? 'Guest: ' : ''}${snapshot.account.displayName}`
                : 'Guest / Create Account'}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Clean 3-Zone Top Bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-[#143326]/10 px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          {/* Zone 1: Brand on mobile / Active view label on desktop */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden rounded-lg p-2 text-[#143326] hover:bg-[#FAF8F3] cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-display text-base font-bold tracking-tight text-[#143326] whitespace-nowrap shrink-0 lg:hidden">
              EcoScrap
            </span>
            <span className="hidden lg:inline text-sm font-medium text-[#143326]/80 whitespace-nowrap truncate">
              {NAV_ITEMS.find((n) => n.id === activeTab)?.label || 'Home'}
            </span>
          </div>

          {/* Zone 2: Concise Status Text (no pill clutter) */}
          <div className="hidden md:flex items-center gap-3 text-xs text-[#143326]/70 whitespace-nowrap">
            <span>
              {workspace === 'demo'
                ? 'Simulated Hackathon Demo Mode'
                : 'Live Campus Mode · Real Records'}
            </span>
            {snapshot && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono-data font-medium text-[#143326]">
                  {snapshot.student.verifiedWeightLbs.toFixed(1)} lbs verified
                </span>
              </>
            )}
          </div>

          {/* Zone 3: Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setAccountModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#143326]/20 bg-white px-3 py-2 text-xs font-semibold text-[#143326] hover:bg-[#ECFDF5] transition-colors whitespace-nowrap shrink-0 cursor-pointer max-w-[160px]"
            >
              <UserCircle2 className="h-3.5 w-3.5 text-[#15803D] shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline truncate">
                {snapshot?.account ? snapshot.account.displayName : 'Guest / Sign In'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setWebsiteQrOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#143326]/20 bg-[#FAF8F3] px-3 py-2 text-xs font-semibold text-[#143326] hover:bg-[#ECFDF5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <QrCode className="h-3.5 w-3.5 text-[#15803D]" aria-hidden="true" />
              <span className="hidden sm:inline">Website QR</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('scanner')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#143326] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1E4A38] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <MessageSquareText className="h-3.5 w-3.5 text-[#BEF264]" aria-hidden="true" />
              AI Waste Scanner
            </button>
          </div>
        </header>

        {/* Mobile Slide-Out Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col shadow-xl">
              <div className="px-5 py-4 border-b border-[#143326]/10 flex items-center justify-between">
                <span className="font-display text-lg font-bold text-[#143326]">EcoScrap</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-1.5 rounded-lg text-[#143326]/70 hover:bg-[#FAF8F3]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {NAV_ITEMS.map(({ id, label, Icon }) => {
                  const active = activeTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => navigateTo(id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap ${
                        active ? 'bg-[#143326] text-white' : 'text-[#143326]/80 hover:bg-[#FAF8F3]'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-[#143326]/10 bg-[#FAF8F3] space-y-2">
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-[#143326]/15 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => handleWorkspaceSwitch('demo')}
                    className={`rounded-lg py-1.5 text-xs font-semibold ${
                      workspace === 'demo' ? 'bg-[#143326] text-white' : 'text-[#143326]/70'
                    }`}
                  >
                    Demo Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWorkspaceSwitch('real')}
                    className={`rounded-lg py-1.5 text-xs font-semibold ${
                      workspace === 'real' ? 'bg-[#143326] text-white' : 'text-[#143326]/70'
                    }`}
                  >
                    Live USF
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAccountModalOpen(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#143326]/20 bg-white px-3 py-2 text-xs font-semibold text-[#143326]"
                >
                  <UserCircle2 className="h-3.5 w-3.5 text-[#15803D]" aria-hidden="true" />
                  <span className="truncate">
                    {snapshot?.account ? snapshot.account.displayName : 'Guest / Create Account'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Viewport */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loadError && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-[#B91C1C]/30 bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B] flex items-center justify-between gap-3"
            >
              <span>{loadError}</span>
              <button
                type="button"
                onClick={() => void loadSnapshot(workspace)}
                className="inline-flex items-center gap-1 text-xs font-semibold underline cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          )}

          {loading || !snapshot ? (
            <div className="space-y-4">
              <div className="h-56 rounded-2xl bg-[#143326]/8 animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="h-32 rounded-2xl bg-[#143326]/6 animate-pulse" />
                <div className="h-32 rounded-2xl bg-[#143326]/6 animate-pulse" />
                <div className="h-32 rounded-2xl bg-[#143326]/6 animate-pulse" />
                <div className="h-32 rounded-2xl bg-[#143326]/6 animate-pulse" />
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeView
                  snapshot={snapshot}
                  onNavigate={navigateTo}
                  onSnapshotUpdated={handleSnapshotUpdated}
                />
              )}

              {activeTab === 'scanner' && (
                <ChatbotView
                  snapshot={snapshot}
                  onScanCompleted={(scan, nextSnap, imgUrl) => {
                    setActiveScan(scan);
                    setSnapshot(nextSnap);
                    setPreviewImageUrl(imgUrl);
                  }}
                  onSnapshotUpdated={handleSnapshotUpdated}
                  onNavigate={navigateTo}
                />
              )}

              {activeTab === 'deposits' && (
                <DepositsView
                  snapshot={snapshot}
                  onSnapshotUpdated={handleSnapshotUpdated}
                  onNavigate={navigateTo}
                />
              )}

              {activeTab === 'rewards' && (
                <RewardsView
                  snapshot={snapshot}
                  recentUnlockedVoucher={recentUnlockedVoucher}
                  onDismissCelebration={() => setRecentUnlockedVoucher(null)}
                  onSnapshotUpdated={handleSnapshotUpdated}
                  onOpenAccount={() => setAccountModalOpen(true)}
                />
              )}

              {activeTab === 'leaderboard' && (
                <LeaderboardView
                  snapshot={snapshot}
                  onSnapshotUpdated={handleSnapshotUpdated}
                />
              )}

              {activeTab === 'ecoimpact' && (
                <div className="space-y-6">
                  <div className="border-b border-[#143326]/10 pb-5">
                    <p className="text-xs font-medium text-[#4F775A]">
                      EcoImpact · Documented EPA WARM v16 Comparison
                    </p>
                    <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[#143326]">
                      Personal &amp; Campus Environmental Impact
                    </h1>
                    <p className="mt-1.5 text-sm text-[#143326]/75 max-w-2xl">
                      Measured compost weights are tracked separately from modeled CO₂e savings. Only verified
                      station deposits count toward actual EcoImpact metrics.
                    </p>
                  </div>

                  <EcoImpactStrip
                    impact={snapshot.ecoImpact}
                    isDemo={snapshot.isDemo}
                    onUpdateGoal={async (goalLbs) => {
                      const updated = await api.updateProfile(snapshot.workspace, {
                        monthlyGoalLbs: goalLbs,
                      });
                      setSnapshot(updated);
                    }}
                    defaultExpanded={true}
                    compact={false}
                  />

                  <div className="rounded-2xl border border-[#143326]/15 bg-white p-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-[#15803D]" />
                      <div>
                        <div className="font-display text-sm font-semibold text-[#143326]">
                          Campus-Wide Verified Impact ({snapshot.isDemo ? 'Demo Total' : 'Live Total'})
                        </div>
                        <p className="text-xs text-[#143326]/70">
                          <span className="font-mono-data font-semibold">
                            {snapshot.adminMetrics.totalCollectedLbs.toFixed(1)} lbs
                          </span>{' '}
                          diverted across USF teams · Estimated{' '}
                          <span className="font-mono-data font-semibold">
                            {snapshot.adminMetrics.campusImpact.estimatedKgCo2eAvoided.toFixed(1)} kg CO₂e
                          </span>{' '}
                          avoided.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateTo('dashboard')}
                      className="rounded-xl bg-[#143326] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E4A38] cursor-pointer"
                    >
                      Open Sustainability Analytics
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'compost-loop' && <CompostLoopView snapshot={snapshot} />}

              {activeTab === 'dashboard' && (
                <DashboardView
                  snapshot={snapshot}
                  onSnapshotUpdated={handleSnapshotUpdated}
                  onNavigate={navigateTo}
                />
              )}
            </>
          )}
        </main>

        {/* Quiet Footer */}
        <footer className="border-t border-[#143326]/10 bg-white/70 px-6 py-4 text-xs text-[#143326]/65 flex flex-wrap items-center justify-between gap-2">
          <span>EcoScrap · From Scraps to Soil · USF Tampa Campus Sustainability Prototype</span>
          <span>Botanical Gardens integration is a proposed partnership · Demo rewards are simulated</span>
        </footer>
      </div>

      {/* Website QR Modal */}
      <WebsiteQrModal
        open={websiteQrOpen}
        onClose={() => setWebsiteQrOpen(false)}
      />

      {/* Account & Guest Pass Modal */}
      <AccountModal
        open={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        workspace={workspace}
        snapshot={snapshot}
        activeAccessCode={activeAccessCode}
        onAuthSuccess={handleAccountAuthSuccess}
        onLoggedOut={handleAccountLoggedOut}
        onNavigate={navigateTo}
      />
    </div>
  );
}
