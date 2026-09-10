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
  X,
  Settings
} from 'lucide-react';
import { COURSE_COLORS } from '../../data/rosterData';
import { calculateBunkStats, STATUTORY_THRESHOLD } from '../../services/bunkCalculator';
import { selfAttendanceStore } from '../../services/selfAttendanceStore';
import SelfAttendanceMarkPill from '../attendance/SelfAttendanceMarkPill';
import { getGoogleCalendarUrl, downloadIcsFile } from '../../services/calendarExport';
import { queryAstraAi, getStoredAiConfig, AI_PROVIDERS } from '../../services/aiProviderEngine';
import { playTactileClick } from '../../services/soundEngine';
import ProactiveActionDeck from '../copilot/ProactiveActionDeck';
import { toast } from 'sonner';

// Helper to safely render markdown in chat messages
function renderFormattedMarkdown(text) {
  if (!text) return null;
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const formatted = escaped
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--ink);font-weight:700;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color:var(--ink-soft);">$1</em>')
    .replace(/`([^`]+)`/g, '<code style="font-family:var(--font-mono);font-size:11px;background:rgba(0,0,0,0.06);padding:1px 5px;border-radius:4px;">$1</code>')
    .replace(/\n\n/g, '<div style="height:6px"></div>')
    .replace(/\n/g, '<br/>');

  return (
    <div
      dangerouslySetInnerHTML={{ __html: formatted }}
      style={{
        lineHeight: 1.5,
        wordBreak: 'break-word',
        color: 'inherit'
      }}
    />
  );
}

function formatActionLabel(action) {
  if (!action) return '';
  switch (action.type) {
    case 'NAVIGATE_AND_SIMULATE':
      return `Simulating ${action.skips} bunk(s) for ${action.courseCode}`;
    case 'NAVIGATE_TAB':
      return `Switched view to ${action.tab}`;
    case 'INSPECT_CLASS':
      return `Inspecting ${action.session?.courseCode || 'lecture'}`;
    case 'OPEN_ROSTER':
      return `Searched batch roster for ${action.query}`;
    case 'TRIGGER_CELEBRATION':
      return 'Attendance streak celebrated!';
    case 'TOGGLE_SOUNDSCAPE':
      return '432Hz focus audio active';
    default:
      return 'Action executed';
  }
}

export default function DesktopInspectorDock({
  selectedSession,
  courses = [],
  schedule = [],
  deadlines = [],
  onSelectTab,
  onExecuteAction,
  student,
  onClose,
  onOpenAiSettings
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dockTab, setDockTab] = useState('lecture'); // 'lecture' | 'copilot'
  const [copiedVenue, setCopiedVenue] = useState(false);
  const [, setStoreVer] = useState(0);

  useEffect(() => {
    const unsub = selfAttendanceStore.subscribe(() => setStoreVer(v => v + 1));
    return unsub;
  }, []);

  // Copilot State
  const [copilotMessages, setCopilotMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! I am **Astra**, your Term-5 Neural Co-Pilot. Click any lecture on the grid or ask me about bunks, schedules, or batchmates!"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll copilot messages
  useEffect(() => {
    if (dockTab === 'copilot') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [copilotMessages, dockTab, isAiLoading]);

  // Handle Copilot send with multi-provider free AI
  const handleSendCopilot = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isAiLoading) return;

    playTactileClick(700);

    const userMsg = { role: 'user', text: query };
    setCopilotMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsAiLoading(true);

    try {
      const res = await queryAstraAi(query, {
        courses,
        schedule,
        deadlines,
        student
      });

      setCopilotMessages(prev => [...prev, {
        role: 'assistant',
        text: res.reply,
        action: res.action,
        providerName: res.providerName
      }]);

      if (res.action && onExecuteAction) {
        onExecuteAction(res.action);
      }
    } catch (err) {
      setCopilotMessages(prev => [...prev, {
        role: 'assistant',
        text: "I encountered an error connecting to the AI provider. Switching to offline solver."
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // When a session is selected externally, switch dock tab to 'lecture'
  useEffect(() => {
    if (selectedSession) {
      setDockTab('lecture');
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

  const recon = selfAttendanceStore.getCourseStats(courseMatch, schedule);
  const stats = recon ? recon.active : calculateBunkStats(courseMatch.attended, courseMatch.conducted, courseMatch.totalPlanned);

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

            {/* Attendance Safety Status Card */}
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

              {/* Statutory Policy Note */}
              <div style={{
                padding: '10px',
                backgroundColor: 'var(--paper)',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <Info size={13} style={{ color: 'var(--ink-muted)', marginTop: '1px', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                  XLRI requires <strong style={{ color: 'var(--ink)' }}>80% minimum attendance</strong> per course. Students below threshold may be debarred from end-term examinations.
                </span>
              </div>
            </div>

            {/* Sovereign Self-Attendance Marking Card */}
            <div style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} color="var(--mizu)" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>
                    Ground Reality Attendance
                  </span>
                </div>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--moss-text)',
                  backgroundColor: 'var(--wash-moss)',
                  padding: '2px 6px',
                  borderRadius: '6px'
                }}>
                  Sovereign Log
                </span>
              </div>

              <p style={{ fontSize: '11px', color: 'var(--ink-soft)', margin: 0, lineHeight: 1.4 }}>
                ERP lags by days. Mark this class to update your real-time safety margin:
              </p>

              <SelfAttendanceMarkPill session={activeSession} isCompact={false} />
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
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
            {/* AI Engine Status & Key Vault Trigger */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              backgroundColor: 'var(--paper)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              fontSize: '11px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bot size={13} style={{ color: 'var(--mizu)' }} />
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                  {getStoredAiConfig().provider === 'gemini-free' ? 'Gemini 2.0 Flash' :
                   getStoredAiConfig().provider === 'groq-free' ? 'Groq LLaMA 3.3' :
                   getStoredAiConfig().provider === 'openrouter-free' ? 'OpenRouter Free' : 'Astra Instant (0ms)'}
                </span>
              </div>
              <button
                onClick={() => onOpenAiSettings?.()}
                title="Configure Free AI Providers & Keys"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--mizu)',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 600
                }}
              >
                <Settings size={11} />
                <span>AI Vault</span>
              </button>
            </div>

            {/* 2026 Proactive Agentic Action Deck */}
            <ProactiveActionDeck
              context={{ courses, schedule, deadlines, student }}
              onExecuteAction={onExecuteAction}
              isCompact={true}
            />

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
                    lineHeight: 1.5,
                    border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    maxWidth: '92%'
                  }}>
                    {msg.role === 'user' ? (
                      <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {msg.text}
                      </div>
                    ) : (
                      <div>
                        {renderFormattedMarkdown(msg.text)}
                        {msg.action && (
                          <div style={{
                            marginTop: '8px',
                            paddingTop: '6px',
                            borderTop: '1px solid rgba(0, 169, 184, 0.2)',
                            fontSize: '11px',
                            color: 'var(--mizu)',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            <Check size={12} />
                            <span>{formatActionLabel(msg.action)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isAiLoading && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--paper)',
                  border: '1px solid var(--border)',
                  fontSize: '11px',
                  color: 'var(--ink-soft)'
                }}>
                  <Sparkles size={13} style={{ color: 'var(--mizu)', animation: 'pulse 1.5s infinite' }} />
                  <span>Astra is analyzing academic schedule & formulas...</span>
                </div>
              )}
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
