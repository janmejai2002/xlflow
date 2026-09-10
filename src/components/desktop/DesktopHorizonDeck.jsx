import React, { useState, useRef, useEffect, useCallback } from 'react';
import HorizonTopBar from './HorizonTopBar';
import HorizonMiniMap, { SECTORS } from './HorizonMiniMap';
import SectorRadar from './sectors/SectorRadar';
import SectorTimetable from './sectors/SectorTimetable';
import SectorBunkMeter from './sectors/SectorBunkMeter';
import SectorTrips from './sectors/SectorTrips';
import SectorDeadlines from './sectors/SectorDeadlines';
import SectorSynergy from './sectors/SectorSynergy';
import DesktopInspectorDock from './DesktopInspectorDock';
import AiSettingsModal from '../AiSettingsModal';
import StatusBeaconModal from '../social/StatusBeaconModal';
import QuickTourModal from '../QuickTourModal';
import { playTactileClick } from '../../services/soundEngine';

export default function DesktopHorizonDeck({
  dataPayload,
  isDemo,
  theme,
  onToggleTheme,
  onRefresh,
  onLogout,
  isSyncing,
  onOpenSearch,
  onOpenShareCard,
  onOpenBooklet,
  onOpenShortcuts,
  isAmbientOn,
  onToggleAmbient,
  onExecuteAction,
  onSelectDateFromHeatmap,
  onToggleLayoutMode,
  isDesktop
}) {
  const [activeSectorIndex, setActiveSectorIndex] = useState(0);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isBeaconModalOpen, setIsBeaconModalOpen] = useState(false);
  const [isQuickTourOpen, setIsQuickTourOpen] = useState(() => {
    return !localStorage.getItem('has_seen_quick_tour_v1');
  });

  // Smooth jump to sector
  const jumpToSector = useCallback((index) => {
    const clamped = Math.max(0, Math.min(SECTORS.length - 1, index));
    setActiveSectorIndex(clamped);
    playTactileClick(600);
  }, []);

  const handlePrevSector = () => {
    jumpToSector(activeSectorIndex - 1);
  };

  const handleNextSector = () => {
    jumpToSector(activeSectorIndex + 1);
  };

  // Keyboard Navigation: Arrow keys & 1-6
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextSector();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevSector();
      } else if (e.key >= '1' && e.key <= '6' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        jumpToSector(parseInt(e.key, 10) - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSectorIndex, jumpToSector]);

  // When a lecture or session is selected anywhere, open Context Inspector
  const handleSelectSession = (session) => {
    setSelectedSession(session);
    setIsInspectorOpen(true);
    playTactileClick(750);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: 'var(--paper)',
      color: 'var(--ink)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* 1. Floating Glassmorphic Header */}
      <HorizonTopBar
        student={dataPayload.student}
        isDemo={isDemo}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onRefresh={onRefresh}
        onLogout={onLogout}
        isSyncing={isSyncing}
        onOpenSearch={onOpenSearch}
        onOpenShortcuts={onOpenShortcuts}
        onOpenBooklet={onOpenBooklet}
        isAmbientOn={isAmbientOn}
        onToggleAmbient={onToggleAmbient}
        onOpenAiSettings={() => setIsAiSettingsOpen(true)}
        onToggleLayoutMode={onToggleLayoutMode}
        isDesktop={isDesktop}
        isInspectorOpen={isInspectorOpen}
        onToggleInspector={() => setIsInspectorOpen(prev => !prev)}
        onOpenBeaconModal={() => setIsBeaconModalOpen(true)}
        onOpenQuickTour={() => setIsQuickTourOpen(true)}
      />

      {/* 2. Focused Single-Active-Sector Workspace (Zero Horizontal Scroll, Zero Side Peek) */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        <main
          style={{
            flex: 1,
            height: '100%',
            overflow: 'hidden',
            padding: activeSectorIndex === 0 ? '12px 28px 8px 28px' : '16px 28px',
            position: 'relative'
          }}
        >
          {/* SECTOR 01: Chronos Radar & Live Flight Deck */}
          <section
            data-sector-index="0"
            data-sector-id="radar"
            style={{
              display: activeSectorIndex === 0 ? 'flex' : 'none',
              flexDirection: 'column',
              height: '100%',
              minHeight: 0,
              overflow: 'hidden',
              animation: 'sectorFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <SectorRadar
              schedule={dataPayload.schedule}
              courses={dataPayload.courses}
              deadlines={dataPayload.deadlines}
              onSelectSession={handleSelectSession}
              onSelectDate={onSelectDateFromHeatmap}
            />
          </section>

          {/* SECTOR 02: Architectural Weekly Matrix Timetable */}
          <section
            data-sector-index="1"
            data-sector-id="timetable"
            style={{
              display: activeSectorIndex === 1 ? 'flex' : 'none',
              flexDirection: 'column',
              height: '100%',
              minHeight: 0,
              overflow: 'hidden',
              animation: 'sectorFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <SectorTimetable
              schedule={dataPayload.schedule}
              onSelectSession={handleSelectSession}
              selectedSessionId={selectedSession?.sessionId}
            />
          </section>

          {/* SECTOR 03: Bunk-O-Meter Statutory Debt Matrix */}
          <section
            data-sector-index="2"
            data-sector-id="bunkmeter"
            style={{
              display: activeSectorIndex === 2 ? 'flex' : 'none',
              flexDirection: 'column',
              height: '100%',
              minHeight: 0,
              overflow: 'hidden',
              animation: 'sectorFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <SectorBunkMeter
              courses={dataPayload.courses}
              schedule={dataPayload.schedule}
              student={dataPayload.student}
            />
          </section>

          {/* SECTOR 04: Getaways & Natural Travel Windows */}
          <section
            data-sector-index="3"
            data-sector-id="trips"
            style={{
              display: activeSectorIndex === 3 ? 'flex' : 'none',
              flexDirection: 'column',
              height: '100%',
              minHeight: 0,
              overflow: 'hidden',
              animation: 'sectorFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <SectorTrips
              schedule={dataPayload.schedule}
              deadlines={dataPayload.deadlines}
              courses={dataPayload.courses}
            />
          </section>

          {/* SECTOR 05: Deadlines, Quizzes & Case Pipeline */}
          <section
            data-sector-index="4"
            data-sector-id="deadlines"
            style={{
              display: activeSectorIndex === 4 ? 'flex' : 'none',
              flexDirection: 'column',
              height: '100%',
              minHeight: 0,
              overflow: 'hidden',
              animation: 'sectorFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <SectorDeadlines
              initialDeadlines={dataPayload.deadlines}
              courses={dataPayload.courses}
            />
          </section>

          {/* SECTOR 06: Batch Synergy & Free Window Matrix */}
          <section
            data-sector-index="5"
            data-sector-id="synergy"
            style={{
              display: activeSectorIndex === 5 ? 'flex' : 'none',
              flexDirection: 'column',
              height: '100%',
              minHeight: 0,
              overflow: 'hidden',
              animation: 'sectorFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <SectorSynergy
              currentUser={dataPayload.student}
              schedule={dataPayload.schedule}
            />
          </section>
        </main>

        {/* 3. Slide-Over Context Inspector Dock (Toggles on Lecture Select) */}
        {isInspectorOpen && (
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            zIndex: 30,
            boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
            animation: 'fadeIn 0.15s ease-out'
          }}>
            <DesktopInspectorDock
              selectedSession={selectedSession}
              courses={dataPayload.courses}
              schedule={dataPayload.schedule}
              deadlines={dataPayload.deadlines}
              onExecuteAction={onExecuteAction}
              student={dataPayload.student}
              onClose={() => setIsInspectorOpen(false)}
              onOpenAiSettings={() => setIsAiSettingsOpen(true)}
            />
          </div>
        )}
      </div>

      {/* 4. Panoramic Bottom Spatial Mini-Map Scrubber with Mobile Switcher */}
      <HorizonMiniMap
        activeSectorIndex={activeSectorIndex}
        onJumpToSector={jumpToSector}
        onPrevSector={handlePrevSector}
        onNextSector={handleNextSector}
        onToggleLayoutMode={onToggleLayoutMode}
      />

      {/* 5. Free AI Key Vault & Provider Selection Modal */}
      <AiSettingsModal
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
      />

      {/* 6. Campus Presence Beacon Modal */}
      <StatusBeaconModal
        isOpen={isBeaconModalOpen}
        onClose={() => setIsBeaconModalOpen(false)}
        currentUser={dataPayload.student}
      />

      {/* 7. Interactive 30-Second Quick Tour */}
      <QuickTourModal
        isOpen={isQuickTourOpen}
        onClose={() => {
          localStorage.setItem('has_seen_quick_tour_v1', 'true');
          setIsQuickTourOpen(false);
        }}
        onJumpToSector={jumpToSector}
      />
    </div>
  );
}
