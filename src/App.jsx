import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import { useBreakpoint } from './hooks/useBreakpoint';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { StorageKeys, fetchLiveStudentData, getSampleDataPayload } from './services/api';
import { calculateBunkStats } from './services/bunkCalculator';
import { playChime } from './services/soundEngine';
import { fireStreakConfetti } from './services/confetti';
import { selfAttendanceStore } from './services/selfAttendanceStore';
import { fetchCloudPrefs } from './services/cloudStorage';
import { WifiOff } from 'lucide-react';
import { Toaster, toast } from 'sonner';

const RadarView = lazy(() => import('./components/RadarView'));
const BunkMeterView = lazy(() => import('./components/BunkMeterView'));
const TimetableView = lazy(() => import('./components/TimetableView'));
const TripPlannerView = lazy(() => import('./components/TripPlannerView'));
const DeadlinesView = lazy(() => import('./components/DeadlinesView'));
const LoginModal = lazy(() => import('./components/LoginModal'));
const BatchSearchModal = lazy(() => import('./components/BatchSearchModal'));
const ShareCardModal = lazy(() => import('./components/ShareCardModal'));
const AstraCopilotDrawer = lazy(() => import('./components/AstraCopilotDrawer'));
const InstructionBookletModal = lazy(() => import('./components/InstructionBookletModal'));
const OnboardingModal = lazy(() => import('./components/OnboardingModal'));
const KeyboardShortcutsModal = lazy(() => import('./components/KeyboardShortcutsModal'));
const DesktopHorizonDeck = lazy(() => import('./components/desktop/DesktopHorizonDeck'));
const AiSettingsModal = lazy(() => import('./components/AiSettingsModal'));
const QuickTourModal = lazy(() => import('./components/QuickTourModal'));

function PaneFallback() {
  return (
    <div
      aria-busy="true"
      style={{
        flex: 1,
        minHeight: '160px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--ink-faint)',
        fontSize: '12px',
        fontFamily: 'var(--font-mono)'
      }}
    >
      Loading...
    </div>
  );
}

export default function App() {
  const { isDesktop, layoutPreference, toggleLayoutMode } = useBreakpoint();
  const [activeTab, setActiveTab] = useState('radar');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isShareCardModalOpen, setIsShareCardModalOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isBookletOpen, setIsBookletOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    return !localStorage.getItem('has_seen_onboarding_v1');
  });
  const [isQuickTourOpen, setIsQuickTourOpen] = useState(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [timetableSelectedDate, setTimetableSelectedDate] = useState(null);

  const [isSyncing, setIsSyncing] = useState(false);
  // Marks mutate the attendance store in place, so the nav badge needs the
  // store's own tick to stay in sync with the Attendance tab.
  const [attendanceVer, setAttendanceVer] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // 1. Theme initialization
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(StorageKeys.THEME);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(StorageKeys.THEME, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // 2. Data initialization (Demo vs Live)
  const [dataPayload, setDataPayload] = useState(() => {
    const cached = localStorage.getItem(StorageKeys.USER_DATA);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return getSampleDataPayload();
  });

  const [isDemo, setIsDemo] = useState(() => {
    const token = localStorage.getItem(StorageKeys.TOKEN);
    return !token;
  });

  // Global Ctrl+K / Cmd+K listener for batch roster search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => selfAttendanceStore.subscribe(() => setAttendanceVer((v) => v + 1)), []);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Universal Cloud Persistence Sync (Google Sheets)
  useEffect(() => {
    const roll = dataPayload.student?.id || selfAttendanceStore.getCurrentRoll();
    if (roll) {
      selfAttendanceStore.syncWithCloud(roll);
      fetchCloudPrefs(roll).then(prefs => {
        if (prefs && prefs.section && prefs.section !== dataPayload.student?.section) {
          setDataPayload(prev => ({
            ...prev,
            student: {
              ...prev.student,
              section: prefs.section
            }
          }));
        }
      }).catch(err => console.warn('[App] Cloud prefs sync failed:', err));
    }
  }, [dataPayload.student?.id]);

  // 3. Sync / Refresh handler
  const handleRefresh = async () => {
    setIsSyncing(true);
    const token = localStorage.getItem(StorageKeys.TOKEN);

    if (token) {
      try {
        const live = await fetchLiveStudentData(token);
        setDataPayload(live);
        setIsDemo(false);
      } catch (err) {
        console.error('Failed to sync live data:', err);
      }
    } else {
      setTimeout(() => {
        setDataPayload(getSampleDataPayload());
      }, 500);
    }
    setIsSyncing(false);
  };

  const handleLoginSuccess = async (token) => {
    setIsLoginModalOpen(false);
    setIsDemo(false);
    setIsSyncing(true);
    try {
      const live = await fetchLiveStudentData(token);
      setDataPayload(live);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStartDemo = () => {
    localStorage.removeItem(StorageKeys.TOKEN);
    setIsDemo(true);
    setDataPayload(getSampleDataPayload());
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem(StorageKeys.TOKEN);
    localStorage.removeItem(StorageKeys.USER_DATA);
    setIsDemo(true);
    setDataPayload(getSampleDataPayload());
    setIsLoginModalOpen(true);
  };

  // Jump from Horizon Heatmap to specific date on timetable
  const handleSelectDateFromHeatmap = (dStr) => {
    setTimetableSelectedDate(dStr);
    setActiveTab('timetable');
  };

  // Agentic Action Execution from Astra Neural Co-Pilot or External MCP
  const handleExecuteCopilotAction = (action) => {
    if (!action) return;
    if (action.type === 'NAVIGATE_TAB' && action.tab) {
      setActiveTab(action.tab);
      setIsCopilotOpen(false);
      toast.success(`Navigated to ${action.tab.toUpperCase()}`);
    } else if (action.type === 'NAVIGATE_AND_SIMULATE' || action.type === 'SIMULATE_BUNK') {
      setActiveTab('bunkmeter');
      setIsCopilotOpen(false);
      toast.success(`Opened Bunk-O-Meter for ${action.courseCode || 'course'}`);
    } else if (action.type === 'OPEN_ROSTER') {
      setIsSearchModalOpen(true);
      setIsCopilotOpen(false);
    } else if (action.type === 'TRIGGER_CELEBRATION') {
      fireStreakConfetti();
      playChime();
      toast.success('🔥 Streak Celebration Triggered!');
    }
  };

  // 4. Nav badge. This must agree with what the Attendance tab shows, so it uses
  // the same reconciliation and the same current-term scope rather than raw ERP
  // numbers across every course the student has ever taken.
  const warningCount = useMemo(() => {
    const all = dataPayload.courses || [];
    const termOf = (c) => {
      const m = /Term-(\d+)/i.exec(c.term || '');
      return m ? Number(m[1]) : 0;
    };
    const currentTerm = Math.max(0, ...all.map(termOf));
    return all.filter((c) => {
      if (termOf(c) !== currentTerm) return false;
      const recon = selfAttendanceStore.getCourseStats(c, dataPayload.schedule || []);
      const stats = recon ? recon.active : calculateBunkStats(c.attended, c.conducted, c.totalPlanned);
      // A course with no classes held yet is unknown, not at risk.
      return stats.conducted > 0 && stats.tier !== 'safe';
    }).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataPayload.courses, dataPayload.schedule, attendanceVer]);
  const pendingDeadlinesCount = (dataPayload.deadlines || []).filter(d => !d.completed).length;

  // Global Desktop Keyboard Shortcuts Bus (1-5, Cmd+K, ?, T, M, Cmd+\)
  useKeyboardShortcuts({
    onSelectTab: setActiveTab,
    onOpenSearch: () => setIsSearchModalOpen(prev => !prev),
    onToggleTheme: toggleTheme,
    onOpenShortcuts: () => setIsShortcutsModalOpen(prev => !prev),
    onOpenCopilot: () => setIsCopilotOpen(prev => !prev),
    onToggleLayoutMode: () => {
      const next = toggleLayoutMode();
      toast(`Switched to ${next === 'desktop' ? 'Desktop Horizon Deck' : 'Mobile Shell'}`);
    }
  });

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--paper)',
      color: 'var(--ink)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative'
    }}>
      
      {isDesktop ? (
        /* The Horizon Deck: Avant-Garde Horizontal Panoramic Spatial Dashboard */
        <Suspense fallback={<PaneFallback />}>
        <DesktopHorizonDeck
          dataPayload={dataPayload}
          isDemo={isDemo}
          theme={theme}
          onToggleTheme={toggleTheme}
          onRefresh={handleRefresh}
          onLogout={handleLogout}
          isSyncing={isSyncing}
          onOpenSearch={() => setIsSearchModalOpen(true)}
          onOpenShareCard={() => setIsShareCardModalOpen(true)}
          onOpenBooklet={() => setIsBookletOpen(true)}
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
          onExecuteAction={handleExecuteCopilotAction}
          onSelectDateFromHeatmap={handleSelectDateFromHeatmap}
          onToggleLayoutMode={() => {
            const next = toggleLayoutMode();
            toast(`Switched to ${next === 'desktop' ? 'Desktop Horizon Deck' : 'Mobile Shell'}`);
          }}
          isDesktop={true}
        />
        </Suspense>
      ) : (
        /* Centered Mobile-App Shell container */
        <div style={{
          width: '100%',
          maxWidth: '540px',
          minHeight: '100dvh',
          backgroundColor: 'var(--paper)',
          borderLeft: '1px solid var(--border-soft)',
          borderRight: '1px solid var(--border-soft)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxShadow: '0 0 40px rgba(0,0,0,0.06)'
        }}>
          
          {/* Top Header with Cmd+K & Share Pass Triggers */}
          <Header
            student={dataPayload.student}
            isDemo={isDemo}
            theme={theme}
            onToggleTheme={toggleTheme}
            onRefresh={handleRefresh}
            onLogout={handleLogout}
            isSyncing={isSyncing}
            onOpenSearch={() => setIsSearchModalOpen(true)}
            onOpenShareCard={() => setIsShareCardModalOpen(true)}
            onOpenCopilot={() => setIsCopilotOpen(true)}
            onOpenBooklet={() => setIsBookletOpen(true)}
            onOpenQuickTour={() => setIsQuickTourOpen(true)}
            onToggleLayoutMode={() => {
              const next = toggleLayoutMode();
              toast(`Switched to ${next === 'desktop' ? 'Desktop Horizon Deck' : 'Mobile Shell'}`);
            }}
            isDesktop={false}
            schedule={dataPayload.schedule}
            courses={dataPayload.courses}
            deadlines={dataPayload.deadlines}
            onSelectTab={setActiveTab}
          />

          {/* Offline Alert Ribbon if disconnected */}
          {!isOnline && (
            <div style={{
              backgroundColor: 'var(--wash-ochre)',
              borderBottom: '1px solid rgba(var(--ochre-rgb), 0.3)',
              padding: '6px 16px',
              fontSize: '12px',
              color: 'var(--ochre-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center',
              fontWeight: 600
            }}>
              <WifiOff size={14} />
              <span>Offline mode active. Using cached schedule & attendance.</span>
            </div>
          )}

          {/* Main Content Area */}
          <main style={{
            flex: 1,
            padding: '16px 16px calc(88px + env(safe-area-inset-bottom, 16px)) 16px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            <Suspense fallback={<PaneFallback />}>
            {activeTab === 'radar' && (
              <RadarView
                schedule={dataPayload.schedule}
                courses={dataPayload.courses}
                deadlines={dataPayload.deadlines}
                onSelectTab={setActiveTab}
                onSelectDate={handleSelectDateFromHeatmap}
              />
            )}

            {activeTab === 'bunkmeter' && (
              <BunkMeterView
                courses={dataPayload.courses}
                schedule={dataPayload.schedule}
                student={dataPayload.student}
              />
            )}

            {activeTab === 'timetable' && (
              <TimetableView
                schedule={dataPayload.schedule}
                courses={dataPayload.courses}
                selectedDateProp={timetableSelectedDate}
              />
            )}

            {activeTab === 'trips' && (
              <TripPlannerView
                schedule={dataPayload.schedule}
                deadlines={dataPayload.deadlines}
                courses={dataPayload.courses}
              />
            )}

            {activeTab === 'deadlines' && (
              <DeadlinesView
                initialDeadlines={dataPayload.deadlines}
                courses={dataPayload.courses}
              />
            )}
            </Suspense>
          </main>

          {/* Bottom Navigation with 5 Tabs */}
          <Navigation
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            warningCount={warningCount}
            pendingDeadlinesCount={pendingDeadlinesCount}
          />
        </div>
      )}

      {/* Login & Demo Modal */}
      {isLoginModalOpen && (
        <Suspense fallback={null}>
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onStartDemo={handleStartDemo}
        />
        </Suspense>
      )}

      {/* Batch Roster Search Modal (Ctrl+K) */}
      {isSearchModalOpen && (
        <Suspense fallback={null}>
        <BatchSearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
        />
        </Suspense>
      )}

      {/* Social Academic Pass Modal */}
      {isShareCardModalOpen && (
        <Suspense fallback={null}>
        <ShareCardModal
          isOpen={isShareCardModalOpen}
          onClose={() => setIsShareCardModalOpen(false)}
          student={dataPayload.student}
          courses={dataPayload.courses}
          theme={theme}
        />
        </Suspense>
      )}

      {/* Instruction Booklet & Student Guide Modal */}
      {isBookletOpen && (
        <Suspense fallback={null}>
        <InstructionBookletModal
          isOpen={isBookletOpen}
          onClose={() => setIsBookletOpen(false)}
        />
        </Suspense>
      )}

      {/* First-Time Student Onboarding Modal */}
      {isOnboardingOpen && (
        <Suspense fallback={null}>
        <OnboardingModal
          isOpen={isOnboardingOpen}
          onClose={() => {
            localStorage.setItem('has_seen_onboarding_v1', 'true');
            setIsOnboardingOpen(false);
          }}
          onConnectErp={() => setIsLoginModalOpen(true)}
          onTryDemo={handleStartDemo}
          student={dataPayload.student}
        />
        </Suspense>
      )}

      {/* Keyboard Shortcuts Cheat Sheet Modal (?) */}
      {isShortcutsModalOpen && (
        <Suspense fallback={null}>
        <KeyboardShortcutsModal
          isOpen={isShortcutsModalOpen}
          onClose={() => setIsShortcutsModalOpen(false)}
        />
        </Suspense>
      )}

      {/* Astra Neural Co-Pilot Drawer (Mobile Drawer) */}
      {isCopilotOpen && (
        <Suspense fallback={null}>
        <AstraCopilotDrawer
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          context={dataPayload}
          onExecuteAction={handleExecuteCopilotAction}
          onOpenAiSettings={() => setIsAiSettingsOpen(true)}
        />
        </Suspense>
      )}

      {/* Free AI Engine & Key Vault Modal */}
      {isAiSettingsOpen && (
        <Suspense fallback={null}>
        <AiSettingsModal
          isOpen={isAiSettingsOpen}
          onClose={() => setIsAiSettingsOpen(false)}
        />
        </Suspense>
      )}

      {/* Interactive 30-Second Quick Tour */}
      {isQuickTourOpen && (
        <Suspense fallback={null}>
        <QuickTourModal
          isOpen={isQuickTourOpen}
          onClose={() => setIsQuickTourOpen(false)}
          onJumpToSector={(idx) => {
            const tabs = ['radar', 'timetable', 'bunkmeter', 'trips', 'deadlines'];
            setActiveTab(tabs[idx] || 'radar');
          }}
        />
        </Suspense>
      )}

      {/* Tactile Toaster Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--card)',
            color: 'var(--ink)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px'
          }
        }}
      />
    </div>
  );
}
