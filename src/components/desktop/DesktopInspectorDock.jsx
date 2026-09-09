import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  MapPin,
  Clock,
  Calendar,
  User,
  Copy,
  Check,
  ExternalLink,
  Download,
  ShieldCheck,
  AlertTriangle,
  Send,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Bot,
  Info,
  Layers,
  Flame,
  ArrowRight,
  X
} from 'lucide-react';
import { COURSE_COLORS } from '../../data/rosterData';
import { calculateBunkStats, simulateAttendance, STATUTORY_THRESHOLD } from '../../services/bunkCalculator';
import { getGoogleCalendarUrl, downloadIcsFile } from '../../services/calendarExport';
import { processCopilotMessage } from '../../services/copilotEngine';
import { playTactileClick } from '../../services/soundEngine';
import { toast } from 'sonner';

export default function DesktopInspectorDock({
  selectedSession,
  courses = [],
  schedule = [],
  deadlines = [],
  onSelectTab,
  onExecuteAction,
  student,
  onClose
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dockTab, setDockTab] = useState('lecture'); // 'lecture' | 'copilot'
  const [copiedVenue, setCopiedVenue] = useState(false);
  const [simulateSkip, setSimulateSkip] = useState(false);

  // Copilot State
  const [copilotMessages, setCopilotMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! I am **Astra**, your Term-5 Neural Co-Pilot. Click any lecture on the grid or ask me about bunks, schedules, or batchmates!"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll copilot messages
  useEffect(() => {
    if (dockTab === 'copilot') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [copilotMessages, dockTab]);

  // When a session is selected externally, switch dock tab to 'lecture'
  useEffect(() => {
    if (selectedSession) {
      setDockTab('lecture');
      setSimulateSkip(false);
    }
  }, [selectedSession]);

  // Active session fallback: either selectedSession or the first upcoming session
  const activeSession = selectedSession || schedule[0] || {
    courseCode: 'OMCR',
    courseName: 'Operations Management',
    faculty: 'Prof. T. Gangopadhyay',
    venue: 'CR-04',
    building: 'Academic Block',
    classDate: new Date().toISOString().split('T')[0],
    startTime: '09:00:00',
    endTime: '10:30:00',
    section: 'EF'
  };

  // Find course details for attendance calculations
  const courseMatch = courses.find(c => c.code === activeSession.courseCode) || {
    code: activeSession.courseCode,
    name: activeSession.courseName,
    attended: 17,
    conducted: 20,
    totalPlanned: 20
  };

  const stats = calculateBunkStats(courseMatch.attended, courseMatch.conducted, courseMatch.totalPlanned);

  // Simulated stats if student skips this active lecture
  const simulatedAttended = simulateSkip ? courseMatch.attended : courseMatch.attended;
  const simulatedConducted = simulateSkip ? courseMatch.conducted + 1 : courseMatch.conducted;
  const projectedPct = simulateAttendance(courseMatch.attended, courseMatch.conducted, 0, simulateSkip ? 1 : 0);

  const colors = COURSE_COLORS[activeSession.courseCode] || {
    accent: '#4E6E9C',
    bg: 'rgba(78, 110, 156, 0.12)'
  };

  const handleCopyVenue = () => {
    navigator.clipboard.writeText(activeSession.venue);
    setCopiedVenue(true);
    toast.success(`Venue Copied: ${activeSession.venue}`);
    setTimeout(() => setCopiedVenue(false), 2000);
  };

  const handleOpenGCal = () => {
    const url = getGoogleCalendarUrl(activeSession);
    window.open(url, '_blank');
  };

  const handleDownloadSessionIcs = () => {
    downloadIcsFile([activeSession], `${activeSession.courseCode}_session.ics`);
    toast.success('Session saved (.ics)');
  };

  const handleSendCopilot = (text) => {
    const q = text || inputValue;
    if (!q.trim()) return;

    playTactileClick(700);
    const newMsgs = [...copilotMessages, { role: 'user', text: q }];
    setCopilotMessages(newMsgs);
    setInputValue('');

    setTimeout(() => {
      const res = processCopilotMessage(q, { courses, schedule, deadlines });
      setCopilotMessages(prev => [...prev, {
        role: 'assistant',
        text: res.reply,
        action: res.action
      }]);

      if (res.action && onExecuteAction) {
        onExecuteAction(res.action);
      }
    }, 300);
  };

  if (isCollapsed) {
    return (
      <aside style={{
        width: '44px',
        backgroundColor: 'var(--card)',
        borderLeft: '1px solid var(--border)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 25,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 0',
        gap: '16px'
      }}>
        <button
          onClick={() => setIsCollapsed(false)}
          title="Expand Context Inspector"
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '8px',
            color: 'var(--ink)',
            cursor: 'pointer'
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <div style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--ink-soft)',
          letterSpacing: '0.05em'
        }}>
          INSPECTOR & CO-PILOT
        </div>
      </aside>
    );
  }

  return (
    <aside style={{
      width: '340px',
      backgroundColor: 'var(--card)',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 25,
      overflow: 'hidden'
    }}>
      {/* 1. Header & Segmented Tab Switch */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: 'var(--ink)',
              color: 'var(--mizu)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={13} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
              Inspector & Co-Pilot
            </span>
          </div>

          <button
            onClick={() => {
              if (onClose) onClose();
              else setIsCollapsed(true);
            }}
            title="Close Inspector"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          backgroundColor: 'var(--paper)',
          padding: '3px',
          borderRadius: '10px',
          border: '1px solid var(--border)'
        }}>
          <button
            onClick={() => setDockTab('lecture')}
            style={{
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              backgroundColor: dockTab === 'lecture' ? 'var(--card)' : 'transparent',
              color: dockTab === 'lecture' ? 'var(--ink)' : 'var(--ink-soft)',
              boxShadow: dockTab === 'lecture' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Calendar size={12} color={dockTab === 'lecture' ? 'var(--mizu)' : 'currentColor'} />
            <span>Lecture Details</span>
          </button>

          <button
            onClick={() => setDockTab('copilot')}
            style={{
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              backgroundColor: dockTab === 'copilot' ? 'var(--card)' : 'transparent',
              color: dockTab === 'copilot' ? 'var(--ink)' : 'var(--ink-soft)',
              boxShadow: dockTab === 'copilot' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Bot size={12} color={dockTab === 'copilot' ? 'var(--ochre)' : 'currentColor'} />
            <span>Astra AI Chat</span>
          </button>
        </div>
      </div>

      {/* 2. Body Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {dockTab === 'lecture' && (
          <>
            {/* Main Lecture Card */}
            <div style={{
              backgroundColor: 'var(--paper)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '16px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Color Stripe */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                backgroundColor: colors.accent
              }} />

              {/* Course Tag & Section */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: colors.accent,
                  backgroundColor: 'var(--card)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)'
                }}>
                  {activeSession.courseCode}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: 'var(--ink-soft)',
                  backgroundColor: 'var(--card)',
                  padding: '2px 6px',
                  borderRadius: '6px'
                }}>
                  Section {activeSession.section || 'EF'}
                </span>
              </div>

              {/* Title */}
              <h3 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '17px',
                fontWeight: 600,
                color: 'var(--ink)',
                margin: '0 0 6px 0',
                lineHeight: 1.3
              }}>
                {activeSession.courseName}
              </h3>

              {/* Faculty */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--ink-soft)', marginBottom: '14px' }}>
                <User size={13} color="var(--ink-soft)" />
                <span>{activeSession.faculty}</span>
              </div>

              {/* Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                backgroundColor: 'var(--card)',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                marginBottom: '14px'
              }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>TIMING</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
                    {activeSession.startTime.slice(0, 5)} - {activeSession.endTime.slice(0, 5)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>DATE</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
                    {activeSession.classDate}
                  </div>
                </div>
              </div>

              {/* Venue Card with 1-Click Copy */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: 'var(--card)',
                borderRadius: '10px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={15} color={colors.accent} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                      {activeSession.venue}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>
                      {activeSession.building || 'Academic Complex'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCopyVenue}
                  title="Copy room code"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--paper)',
                    color: copiedVenue ? 'var(--moss)' : 'var(--ink)',
                    cursor: 'pointer'
                  }}
                >
                  {copiedVenue ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedVenue ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Attendance Risk & Simulation Card */}
            <div style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                  Attendance Safety Status
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: stats.tier === 'danger' ? 'var(--hanko)' : (stats.tier === 'warning' ? 'var(--ochre)' : 'var(--moss)'),
                  backgroundColor: stats.tier === 'danger' ? 'var(--wash-hanko)' : (stats.tier === 'warning' ? 'var(--wash-ochre)' : 'var(--wash-moss)'),
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  {(stats.currentPercentage || 0).toFixed(1)}% Current
                </span>
              </div>

              {/* Safe Bunks Callout */}
              <div style={{
                fontSize: '12px',
                color: 'var(--ink-soft)',
                lineHeight: 1.4,
                marginBottom: '12px'
              }}>
                {(stats.safeBunksRemaining || 0) > 0 ? (
                  <span>You have <strong style={{ color: 'var(--moss)' }}>{stats.safeBunksRemaining} safe bunks</strong> remaining without falling below the 80.0% threshold.</span>
                ) : (
                  <span>⚠️ <strong style={{ color: 'var(--hanko)' }}>Warning</strong>: Must attend next {stats.recoveryRequired || 1} classes to restore 80% safety margin.</span>
                )}
              </div>

              {/* What-If Simulator Toggle */}
              <div style={{
                padding: '10px',
                backgroundColor: 'var(--paper)',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink)' }}>
                    Simulate Bunking This Class:
                  </span>
                  <input
                    type="checkbox"
                    checked={simulateSkip}
                    onChange={(e) => setSimulateSkip(e.target.checked)}
                    style={{ cursor: 'pointer', accentColor: 'var(--hanko)' }}
                  />
                </div>

                {simulateSkip && (
                  <div style={{
                    fontSize: '11px',
                    color: projectedPct >= 80 ? 'var(--moss-text)' : 'var(--hanko)',
                    backgroundColor: projectedPct >= 80 ? 'var(--wash-moss)' : 'var(--wash-hanko)',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    fontWeight: 500
                  }}>
                    Projected: <strong>{(projectedPct || 0).toFixed(1)}%</strong> ({(stats.currentPercentage || 0) > projectedPct ? '↓' : ''} {Math.abs((stats.currentPercentage || 0) - (projectedPct || 0)).toFixed(1)}% impact)
                  </div>
                )}
              </div>
            </div>

            {/* Quick Export Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleOpenGCal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px',
                  backgroundColor: 'var(--ink)',
                  color: 'var(--paper)',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s'
                }}
              >
                <ExternalLink size={14} />
                <span>Add to Google Calendar</span>
              </button>

              <button
                onClick={handleDownloadSessionIcs}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px',
                  backgroundColor: 'var(--paper)',
                  color: 'var(--ink)',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <Download size={14} />
                <span>Download .ICS (Apple/Outlook)</span>
              </button>
            </div>
          </>
        )}

        {dockTab === 'copilot' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
            {/* Suggestions Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                "Can I bunk OMCR today?",
                "Where is my next class?",
                "Find 3-day getaways",
                "Who is free at 3 PM?"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendCopilot(chip)}
                  style={{
                    fontSize: '10px',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--paper)',
                    border: '1px solid var(--border)',
                    color: 'var(--ink-soft)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Message Stream */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              paddingRight: '4px'
            }}>
              {copilotMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '100%'
                  }}
                >
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    backgroundColor: msg.role === 'user' ? 'var(--ink)' : 'var(--paper)',
                    color: msg.role === 'user' ? 'var(--paper)' : 'var(--ink)',
                    fontSize: '12px',
                    lineHeight: 1.4,
                    border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendCopilot();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--paper)',
                padding: '6px 10px',
                borderRadius: '10px',
                border: '1px solid var(--border)'
              }}
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Astra Co-Pilot..."
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  fontSize: '12px',
                  color: 'var(--ink)'
                }}
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                style={{
                  background: 'var(--ink)',
                  border: 'none',
                  color: 'var(--paper)',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  cursor: inputValue.trim() ? 'pointer' : 'default',
                  opacity: inputValue.trim() ? 1 : 0.4
                }}
              >
                <Send size={12} />
              </button>
            </form>
          </div>
        )}

      </div>
    </aside>
  );
}
