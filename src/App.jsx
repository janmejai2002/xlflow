import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import RadarView from './components/RadarView';
import BunkMeterView from './components/BunkMeterView';
import TimetableView from './components/TimetableView';
import TripPlannerView from './components/TripPlannerView';
import DeadlinesView from './components/DeadlinesView';
import LoginModal from './components/LoginModal';
import BatchSearchModal from './components/BatchSearchModal';
import ShareCardModal from './components/ShareCardModal';
import AstraCopilotDrawer from './components/AstraCopilotDrawer';
import McpHudIndicator from './components/McpHudIndicator';
import InstructionBookletModal from './components/InstructionBookletModal';
import OnboardingModal from './components/OnboardingModal';
import { useMcpBridge } from './hooks/useMcpBridge';
import { StorageKeys, fetchLiveStudentData, getSampleDataPayload } from './services/api';
import { calculateBunkStats } from './services/bunkCalculator';
import { toggleAmbientSoundscape, playChime } from './services/soundEngine';
import { fireStreakConfetti } from './services/confetti';
import { WifiOff } from 'lucide-react';
import { Toaster, toast } from 'sonner';

export default function App() {
  const [activeTab, setActiveTab] = useState('radar');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isShareCardModalOpen, setIsShareCardModalOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isBookletOpen, setIsBookletOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    return !localStorage.getItem('has_seen_onboarding_v1');
  });
  const [isAmbientOn, setIsAmbientOn] = useState(false);
  const [timetableSelectedDate, setTimetableSelectedDate] = useState(null);

  const [isSyncing, setIsSyncing] = useState(false);
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

  // Toggle 432Hz Ambient Focus Soundscape
  const handleToggleAmbient = () => {
    const next = toggleAmbientSoundscape();
    setIsAmbientOn(next);
    if (next) {
      toast.success("432Hz Meditative Soundscape Active", {
        description: "Warm binaural theta hum playing for deep focus"
      });
    } else {
      toast("Soundscape Paused");
    }
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
    } else if (action.type === 'TOGGLE_SOUNDSCAPE') {
      handleToggleAmbient();
    }
  };

  // Live Universal MCP Bridge (Pattern A: Web-to-Agent WebSocket connection)
  const { isConnected: isMcpConnected, activeCommand: mcpActiveCommand } = useMcpBridge({
    onExecuteAction: handleExecuteCopilotAction,
    localData: dataPayload
  });

  // 4. Calculate warning count for badges
  const coursesWithStats = (dataPayload.courses || []).map(c => ({
    ...c,
    stats: calculateBunkStats(c.attended, c.conducted, c.totalPlanned)
  }));

  const warningCount = coursesWithStats.filter(c => c.stats.tier === 'warning' || c.stats.tier === 'danger').length;
  const pendingDeadlinesCount = (dataPayload.deadlines || []).filter(d => !d.completed).length;

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
      
      {/* Centered Mobile-App Shell container */}
      <div style={{
        width: '100%',
        maxWidth: '540px',
        minHeight: '100vh',
        backgroundColor: 'var(--paper)',
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
          isAmbientOn={isAmbientOn}
          onToggleAmbient={handleToggleAmbient}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onOpenBooklet={() => setIsBookletOpen(true)}
        />

        {/* Offline Alert Ribbon if disconnected */}
        {!isOnline && (
          <div style={{
            backgroundColor: 'var(--wash-ochre)',
            borderBottom: '1px solid rgba(194, 145, 58, 0.3)',
            padding: '6px 16px',
            fontSize: '12px',
            color: 'var(--ochre)',
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
          padding: '16px 16px 84px 16px',
          overflowY: 'auto'
        }}>
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
            />
          )}

          {activeTab === 'timetable' && (
            <TimetableView
              schedule={dataPayload.schedule}
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
        </main>

        {/* Bottom Navigation with 5 Tabs */}
        <Navigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          warningCount={warningCount}
          pendingDeadlinesCount={pendingDeadlinesCount}
        />
      </div>

      {/* Login & Demo Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onStartDemo={handleStartDemo}
      />

      {/* Batch Roster Search Modal (Ctrl+K) */}
      <BatchSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      {/* Social Academic Pass Modal */}
      <ShareCardModal
        isOpen={isShareCardModalOpen}
        onClose={() => setIsShareCardModalOpen(false)}
        student={dataPayload.student}
        courses={dataPayload.courses}
        theme={theme}
      />

      {/* Instruction Booklet & Student Guide Modal */}
      <InstructionBookletModal
        isOpen={isBookletOpen}
        onClose={() => setIsBookletOpen(false)}
      />

      {/* First-Time Student Onboarding Modal */}
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

      {/* Astra Neural Co-Pilot Drawer */}
      <AstraCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        context={dataPayload}
        onExecuteAction={handleExecuteCopilotAction}
      />

      {/* Universal MCP Live Bridge HUD Indicator */}
      <McpHudIndicator
        isConnected={isMcpConnected}
        activeCommand={mcpActiveCommand}
      />

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
