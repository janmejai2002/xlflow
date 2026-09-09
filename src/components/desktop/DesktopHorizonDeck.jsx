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
  const containerRef = useRef(null);
  const [activeSectorIndex, setActiveSectorIndex] = useState(0);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);

  // Mouse Drag-to-Scroll state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // Smooth jump to sector
  const jumpToSector = useCallback((index) => {
    if (!containerRef.current) return;
    const clamped = Math.max(0, Math.min(SECTORS.length - 1, index));
    const targetElement = containerRef.current.querySelector(`section[data-sector-index="${clamped}"]`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      setActiveSectorIndex(clamped);
    }
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

  // Update active sector on horizontal scroll
  const handleScroll = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scrollPos = container.scrollLeft;
    const sectorEls = container.querySelectorAll('section[data-sector-index]');

    let closestIdx = 0;
    let minDiff = Infinity;

    sectorEls.forEach((el) => {
      const idx = parseInt(el.getAttribute('data-sector-index'), 10);
      const offsetLeft = el.offsetLeft;
      const diff = Math.abs(offsetLeft - scrollPos);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    if (closestIdx !== activeSectorIndex && closestIdx >= 0 && closestIdx < SECTORS.length) {
      setActiveSectorIndex(closestIdx);
    }
  };

  // Mouse Drag handlers
  const handleMouseDown = (e) => {
    // Only drag if left click and not clicking inside interactive controls
    if (e.button !== 0) return;
    const tag = e.target.tagName?.toLowerCase();
    if (tag === 'button' || tag === 'input' || tag === 'select' || tag === 'a') return;

    isDraggingRef.current = true;
    startXRef.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeftRef.current = containerRef.current.scrollLeft;
    containerRef.current.style.cursor = 'grabbing';
    containerRef.current.style.userSelect = 'none';
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5; // scroll sensitivity
    containerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    if (isDraggingRef.current && containerRef.current) {
      isDraggingRef.current = false;
      containerRef.current.style.cursor = 'grab';
      containerRef.current.style.removeProperty('user-select');
    }
  };

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
      />

      {/* 2. Panoramic Horizontal Horizon Track (Zero Vertical Scroll) */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex' }}>
        <main
          ref={containerRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          style={{
            flex: 1,
            height: '100%',
            overflowX: 'auto',
            overflowY: 'hidden',
            display: 'flex',
            flexDirection: 'row',
            gap: '36px',
            padding: '20px 36px',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            cursor: 'grab'
          }}
        >
          {/* SECTOR 01: Chronos Radar & Live Flight Deck */}
          <section data-sector-index="0" data-sector-id="radar" style={{ scrollSnapAlign: 'start', height: '100%' }}>
            <SectorRadar
              schedule={dataPayload.schedule}
              courses={dataPayload.courses}
              deadlines={dataPayload.deadlines}
              onSelectSession={handleSelectSession}
              onSelectDate={onSelectDateFromHeatmap}
            />
          </section>

          {/* Vertical Architectural Divider */}
          <div style={{
            width: '1px',
            height: '80%',
            backgroundColor: 'var(--border)',
            alignSelf: 'center',
            flexShrink: 0
          }} />

          {/* SECTOR 02: Architectural Weekly Matrix Timetable */}
          <section data-sector-index="1" data-sector-id="timetable" style={{ scrollSnapAlign: 'start', height: '100%' }}>
            <SectorTimetable
              schedule={dataPayload.schedule}
              onSelectSession={handleSelectSession}
              selectedSessionId={selectedSession?.sessionId}
            />
          </section>

          {/* Vertical Architectural Divider */}
          <div style={{
            width: '1px',
            height: '80%',
            backgroundColor: 'var(--border)',
            alignSelf: 'center',
            flexShrink: 0
          }} />

          {/* SECTOR 03: Bunk-O-Meter Statutory Debt Matrix */}
          <section data-sector-index="2" data-sector-id="bunkmeter" style={{ scrollSnapAlign: 'start', height: '100%' }}>
            <SectorBunkMeter
              courses={dataPayload.courses}
            />
          </section>

          {/* Vertical Architectural Divider */}
          <div style={{
            width: '1px',
            height: '80%',
            backgroundColor: 'var(--border)',
            alignSelf: 'center',
            flexShrink: 0
          }} />

          {/* SECTOR 04: Getaways & Natural Travel Windows */}
          <section data-sector-index="3" data-sector-id="trips" style={{ scrollSnapAlign: 'start', height: '100%' }}>
            <SectorTrips
              schedule={dataPayload.schedule}
              deadlines={dataPayload.deadlines}
              courses={dataPayload.courses}
            />
          </section>

          {/* Vertical Architectural Divider */}
          <div style={{
            width: '1px',
            height: '80%',
            backgroundColor: 'var(--border)',
            alignSelf: 'center',
            flexShrink: 0
          }} />

          {/* SECTOR 05: Deadlines, Quizzes & Case Pipeline */}
          <section data-sector-index="4" data-sector-id="deadlines" style={{ scrollSnapAlign: 'start', height: '100%' }}>
            <SectorDeadlines
              initialDeadlines={dataPayload.deadlines}
              courses={dataPayload.courses}
            />
          </section>

          {/* Vertical Architectural Divider */}
          <div style={{
            width: '1px',
            height: '80%',
            backgroundColor: 'var(--border)',
            alignSelf: 'center',
            flexShrink: 0
          }} />

          {/* SECTOR 06: Batch Synergy & Free Window Matrix */}
          <section data-sector-index="5" data-sector-id="synergy" style={{ scrollSnapAlign: 'start', height: '100%' }}>
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
    </div>
  );
}
