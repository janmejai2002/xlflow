import React from 'react';
import { Calendar, Download, Sparkles, Layers } from 'lucide-react';
import DesktopTimetableGrid from '../DesktopTimetableGrid';
import { downloadIcsFile } from '../../../services/calendarExport';
import { toast } from 'sonner';

export default function SectorTimetable({
  schedule = [],
  onSelectSession,
  selectedSessionId
}) {
  const handleExportAll = () => {
    downloadIcsFile(schedule, 'xlri_term5_timetable.ics');
    toast.success('Term-5 Calendar Exported (.ics)', {
      description: '15-minute advance alarms configured for all lectures'
    });
  };

  return (
    <div style={{
      width: '1260px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      flexShrink: 0
    }}>
      {/* Sector Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--wash-mizu)',
            border: '1px solid rgba(0, 169, 184, 0.3)',
            color: 'var(--mizu)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 169, 184, 0.15)'
          }}>
            <Calendar size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mizu)', letterSpacing: '0.06em' }}>
                SECTOR 02
              </span>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>•</span>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>6-Day Weekly Schedule & Conflict Navigator</span>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--ink)',
              margin: '2px 0 0 0',
              letterSpacing: '-0.025em'
            }}>
              Architectural Timetable Matrix
            </h2>
          </div>
        </div>

        <button
          onClick={handleExportAll}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            color: 'var(--ink)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <Download size={14} color="var(--mizu)" />
          <span>Export .ICS</span>
        </button>
      </div>

      {/* Grid Container */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <DesktopTimetableGrid
          schedule={schedule}
          onSelectSession={onSelectSession}
          selectedSessionId={selectedSessionId}
        />
      </div>
    </div>
  );
}
