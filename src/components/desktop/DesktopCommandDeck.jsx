import React, { useState } from 'react';
import DesktopSidebar from './DesktopSidebar';
import DesktopTopBar from './DesktopTopBar';
import DesktopTimetableGrid from './DesktopTimetableGrid';
import DesktopInspectorDock from './DesktopInspectorDock';
import RadarView from '../RadarView';
import BunkMeterView from '../BunkMeterView';
import TripPlannerView from '../TripPlannerView';
import DeadlinesView from '../DeadlinesView';

export default function DesktopCommandDeck({
  activeTab,
  onSelectTab,
  dataPayload,
  isDemo,
  theme,
  onToggleTheme,
  onRefresh,
  onLogout,
  isSyncing,
  warningCount,
  pendingDeadlinesCount,
  onOpenSearch,
  onOpenShareCard,
  onOpenBooklet,
  onOpenGroupSynergy,
  onOpenShortcuts,
  isAmbientOn,
  onToggleAmbient,
  onExecuteAction,
  timetableSelectedDate,
  onSelectDateFromHeatmap
}) {
  const [selectedSession, setSelectedSession] = useState(null);

  const handleSelectSessionFromAnywhere = (session) => {
    setSelectedSession(session);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '240px 1fr auto',
      minHeight: '100vh',
      width: '100%',
      backgroundColor: 'var(--paper)',
      color: 'var(--ink)',
      position: 'relative'
    }}>
      {/* Pane I: Executive Left Rail (240px) */}
      <DesktopSidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        student={dataPayload.student}
        isDemo={isDemo}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onRefresh={onRefresh}
        onLogout={onLogout}
        isSyncing={isSyncing}
        warningCount={warningCount}
        pendingDeadlinesCount={pendingDeadlinesCount}
        onOpenSearch={onOpenSearch}
        onOpenShareCard={onOpenShareCard}
        onOpenBooklet={onOpenBooklet}
        onOpenGroupSynergy={onOpenGroupSynergy}
        isAmbientOn={isAmbientOn}
        onToggleAmbient={onToggleAmbient}
      />

      {/* Pane II: Centerstage Workspace */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100vh',
        overflow: 'hidden'
      }}>
        {/* Desktop TopBar */}
        <DesktopTopBar
          activeTab={activeTab}
          onOpenSearch={onOpenSearch}
          onOpenShortcuts={onOpenShortcuts}
          onOpenGroupSynergy={onOpenGroupSynergy}
          student={dataPayload.student}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onRefresh={onRefresh}
          isSyncing={isSyncing}
        />

        {/* Centerstage Fluid Canvas */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 32px 48px 32px'
        }}>
          {activeTab === 'radar' && (
            <RadarView
              schedule={dataPayload.schedule}
              courses={dataPayload.courses}
              deadlines={dataPayload.deadlines}
              onSelectTab={onSelectTab}
              onSelectDate={onSelectDateFromHeatmap}
              onSelectSession={handleSelectSessionFromAnywhere}
            />
          )}

          {activeTab === 'bunkmeter' && (
            <BunkMeterView
              courses={dataPayload.courses}
            />
          )}

          {activeTab === 'timetable' && (
            <DesktopTimetableGrid
              schedule={dataPayload.schedule}
              onSelectSession={handleSelectSessionFromAnywhere}
              selectedSessionId={selectedSession?.sessionId}
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
      </div>

      {/* Pane III: Context Inspector & Astra Copilot Dock (340px) */}
      <DesktopInspectorDock
        selectedSession={selectedSession}
        courses={dataPayload.courses}
        schedule={dataPayload.schedule}
        deadlines={dataPayload.deadlines}
        onSelectTab={onSelectTab}
        onExecuteAction={onExecuteAction}
        student={dataPayload.student}
      />
    </div>
  );
}
