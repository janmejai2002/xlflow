import React, { useState, useEffect } from 'react';
import { 
  BookOpen, X, Smartphone, ShieldCheck, Calendar, Calculator, 
  Search, Bot, Sparkles, CheckCircle2, ChevronRight, HelpCircle, 
  ExternalLink, Copy, Check, Info, Flame
} from 'lucide-react';

const SECTIONS = [
  { id: 'quickstart', name: 'Quick Start', icon: Sparkles },
  { id: 'bunkmath', name: '80% Bunk Math', icon: Calculator },
  { id: 'mobile', name: 'Mobile App (PWA)', icon: Smartphone },
  { id: 'calendar', name: 'Calendar Sync', icon: Calendar },
  { id: 'roster', name: 'Roster & Pass', icon: Search },
  { id: 'privacy', name: 'Privacy Guarantee', icon: ShieldCheck },
  { id: 'ai', name: 'AI & MCP Bridge', icon: Bot },
  { id: 'faq', name: 'FAQs', icon: HelpCircle }
];

export default function InstructionBookletModal({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState('quickstart');
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      backgroundColor: 'rgba(21, 21, 18, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }} onClick={onClose}>
      
      <div style={{
        backgroundColor: 'var(--paper)',
        color: 'var(--ink)',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '88vh',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>

        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              backgroundColor: 'rgba(var(--mizu-rgb), 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--mizu)'
            }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-serif)' }}>
                XL-Flow Instruction Booklet & Guide
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '2px' }}>
                Batch 2025–27 • Term-5 Academic Companion
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              color: 'var(--ink-muted)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Section Navigation Tabs (Horizontal Scrolling) */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--card)',
          padding: '0 16px',
          gap: '4px'
        }}>
          {SECTIONS.map(sec => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 14px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--mizu)' : 'var(--ink-muted)',
                  borderBottom: isActive ? '2px solid var(--mizu)' : '2px solid transparent',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} />
                <span>{sec.name}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Content */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
          lineHeight: 1.6,
          fontSize: '13.5px'
        }}>

          {/* 1. Quick Start */}
          {activeSection === 'quickstart' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '20px' }}>⚡</span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                  10-Second Quick Start for Non-Techies
                </h3>
              </div>
              <p style={{ color: 'var(--ink-muted)', marginTop: 0 }}>
                XL-Flow is crafted for zero friction. You do not need any coding knowledge or technical setup.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <div style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  gap: '12px'
                }}>
                  <div style={{ fontWeight: 800, color: 'var(--mizu)', fontSize: '16px' }}>1</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>Open the App & Connect</div>
                    <div style={{ color: 'var(--ink-muted)', fontSize: '12.5px', marginTop: '2px' }}>
                      Click the <strong>Connect Live ERP</strong> button in the header. If you are already logged into XLRI ERP (<code>xlerp.xlri.ac.in</code>) on your browser, paste your session token or click <strong>Explore with Demo Mode</strong> to test with real Term-5 data instantly.
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  gap: '12px'
                }}>
                  <div style={{ fontWeight: 800, color: 'var(--mizu)', fontSize: '16px' }}>2</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>Check Today's Radar & Schedule</div>
                    <div style={{ color: 'var(--ink-muted)', fontSize: '12.5px', marginTop: '2px' }}>
                      The <strong>Radar</strong> tab displays your next lecture, classroom venue (e.g. <code>CR-04</code>), countdown timer, and a 28-day schedule heatmap.
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  gap: '12px'
                }}>
                  <div style={{ fontWeight: 800, color: 'var(--mizu)', fontSize: '16px' }}>3</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>Inspect Bunk Margins</div>
                    <div style={{ color: 'var(--ink-muted)', fontSize: '12.5px', marginTop: '2px' }}>
                      Switch to the <strong>Bunks</strong> tab to see how many classes you can safely miss per course without dropping below XLRI's mandatory 80.0% rule.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. 80% Bunk Math */}
          {activeSection === 'bunkmath' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Calculator size={20} style={{ color: 'var(--moss)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                  XLRI's Mandatory 80.0% Attendance Algorithm
                </h3>
              </div>
              <p style={{ color: 'var(--ink-muted)', marginTop: 0 }}>
                XL-Flow implements the exact mathematical formula prescribed by the academic handbook to protect you from debarment.
              </p>

              <div style={{
                backgroundColor: 'var(--card)',
                padding: '16px',
                borderRadius: '14px',
                border: '1px solid var(--border)',
                marginBottom: '16px'
              }}>
                <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--ink)' }}>The Safe Bunks Formula:</div>
                <code style={{
                  display: 'block',
                  backgroundColor: 'var(--paper)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontFamily: 'monospace',
                  color: 'var(--mizu)'
                }}>
                  Max Misses = ⌊ (Attended + (TotalPlanned - Conducted) - 0.80 × TotalPlanned) ⌋
                </code>
                <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '8px' }}>
                  This guarantees that even if you take all your safe bunks today, attending the remainder of the term keeps you above 80.0%.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--wash-moss)', border: '1px solid rgba(var(--moss-rgb), 0.3)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--moss)', fontSize: '13px' }}>🟢 Safe Tier (&ge; 85%)</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)', marginTop: '4px' }}>Ample buffer. You can miss upcoming classes safely.</div>
                </div>

                <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--wash-ochre)', border: '1px solid rgba(var(--ochre-rgb), 0.3)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--ochre)', fontSize: '13px' }}>🟡 Warning Tier (80–84%)</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)', marginTop: '4px' }}>Low buffer. Missing even one more class risks debarment.</div>
                </div>

                <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--wash-hanko)', border: '1px solid rgba(var(--hanko-rgb), 0.3)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--hanko)', fontSize: '13px' }}>🔴 Danger Tier (&lt; 80%)</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)', marginTop: '4px' }}>Debarment risk! You must attend consecutive classes to recover.</div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Mobile App PWA */}
          {activeSection === 'mobile' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Smartphone size={20} style={{ color: 'var(--mizu)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                  Install as Mobile App (iPhone & Android)
                </h3>
              </div>
              <p style={{ color: 'var(--ink-muted)', marginTop: 0 }}>
                You don't need the App Store or Play Store. XL-Flow is a high-performance Progressive Web App (PWA) that installs in 2 taps.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                {/* iPhone instructions */}
                <div style={{
                  padding: '16px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🍎</span> On Apple iPhone (Safari)
                  </div>
                  <ol style={{ margin: '10px 0 0 0', paddingLeft: '20px', fontSize: '12.5px', color: 'var(--ink-muted)' }}>
                    <li>Open this URL in <strong>Safari</strong> on your iPhone.</li>
                    <li>Tap the <strong>Share button</strong> (the square icon with an upward arrow at the bottom).</li>
                    <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                    <li>Tap <strong>Add</strong> in the top-right corner.</li>
                  </ol>
                  <div style={{ fontSize: '11.5px', color: 'var(--moss)', fontWeight: 600, marginTop: '8px' }}>
                    ✓ It will now appear on your home screen and launch full-screen with no browser address bar!
                  </div>
                </div>

                {/* Android instructions */}
                <div style={{
                  padding: '16px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🤖</span> On Android (Google Chrome)
                  </div>
                  <ol style={{ margin: '10px 0 0 0', paddingLeft: '20px', fontSize: '12.5px', color: 'var(--ink-muted)' }}>
                    <li>Open this URL in <strong>Chrome</strong>.</li>
                    <li>Tap the <strong>three dots menu (⋮)</strong> in the top-right corner.</li>
                    <li>Tap <strong>Install App</strong> or <strong>Add to Home Screen</strong>.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* 4. Calendar Sync */}
          {activeSection === 'calendar' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Calendar size={20} style={{ color: 'var(--ochre)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                  1-Click Calendar Sync (Google & Apple)
                </h3>
              </div>
              <p style={{ color: 'var(--ink-muted)', marginTop: 0 }}>
                Never open ERP just to check class timings. Sync your full Term-5 timetable directly to your phone calendar.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
                <div style={{ padding: '14px', borderRadius: '14px', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '13.5px' }}>How to export to Google Calendar:</div>
                  <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '12.5px', color: 'var(--ink-muted)' }}>
                    <li>Navigate to the <strong>Classes (Timetable)</strong> tab in XL-Flow.</li>
                    <li>Click <strong>Export .ICS Calendar</strong> at the top.</li>
                    <li>Open Google Calendar on your laptop &gt; Settings &gt; Import &amp; Export &gt; upload the downloaded <code>.ics</code> file.</li>
                  </ol>
                </div>

                <div style={{ padding: '14px', borderRadius: '14px', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '13.5px' }}>On iPhone / Mac:</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--ink-muted)', marginTop: '4px' }}>
                    Tapping the downloaded <code>.ics</code> file on iOS or macOS will prompt <em>"Add all 40 events to Calendar?"</em>. Tap <strong>Add All</strong> and your phone alerts will be set automatically!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. Roster & Social Pass */}
          {activeSection === 'roster' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Search size={20} style={{ color: 'var(--plum)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                  Batch Roster (Ctrl+K) & Academic Pass
                </h3>
              </div>
              <p style={{ color: 'var(--ink-muted)', marginTop: 0 }}>
                Find any batchmate in seconds without digging through WhatsApp spreadsheets or ERP search bars.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
                <div style={{ padding: '14px', borderRadius: '14px', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⚡ Quick Shortcut:</span>
                    <kbd style={{ backgroundColor: 'var(--paper)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '11px' }}>
                      Ctrl + K
                    </kbd>
                    <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>or Cmd+K on Mac</span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--ink-muted)', marginTop: '8px' }}>
                    Instant live search indexing all 178 students across <strong>Section E, Section F, and Section G</strong>. Type a name, a 3-digit roll number, or a section code.
                  </div>
                </div>

                <div style={{ padding: '14px', borderRadius: '14px', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '13.5px' }}>Shareable Academic Pass:</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--ink-muted)', marginTop: '4px' }}>
                    Click the <strong>Pass icon</strong> in the top header to render a boarding-pass style card showing your roll number, attendance streak, and Term-5 course lineup. Perfect for group project intros or WhatsApp status updates.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. Privacy Guarantee */}
          {activeSection === 'privacy' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <ShieldCheck size={20} style={{ color: 'var(--moss)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                  100% Privacy-Preserving Guarantee
                </h3>
              </div>
              <p style={{ color: 'var(--ink-muted)', marginTop: 0 }}>
                Why your credentials and attendance data are 100% safe with XL-Flow:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', borderRadius: '12px', backgroundColor: 'var(--card)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--moss)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>Zero Third-Party Servers</div>
                    <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
                      There is no external database or backend storing your details. All network requests go straight from your device to <code>xlerp.xlri.ac.in</code>.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', borderRadius: '12px', backgroundColor: 'var(--card)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--moss)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>Encrypted Local Storage</div>
                    <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
                      Your timetable and attendance snapshots are saved strictly on your own device in your browser's private storage.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', borderRadius: '12px', backgroundColor: 'var(--card)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--moss)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>Zero Cost & Zero Maintenance</div>
                    <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
                      The app is hosted statically on GitHub's free worldwide CDN. It has no monthly server bills, meaning it will never go down because of billing lapses.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. AI & MCP Bridge */}
          {activeSection === 'ai' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Bot size={20} style={{ color: 'var(--mizu)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                  Astra Co-Pilot & Universal MCP Bridge
                </h3>
              </div>
              <p style={{ color: 'var(--ink-muted)', marginTop: 0 }}>
                XL-Flow is the first student app equipped with an agentic Model Context Protocol (MCP) bridge.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
                <div style={{ padding: '14px', borderRadius: '14px', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '13.5px' }}>1. In-App Astra AI Assistant:</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--ink-muted)', marginTop: '4px' }}>
                    Click the <strong>Astra</strong> button in the header. Ask questions like <em>"Can I bunk OMCR?"</em> or <em>"Find 4-day getaways"</em>. Astra executes real actions on the screen!
                  </div>
                </div>

                <div style={{ padding: '14px', borderRadius: '14px', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '13.5px' }}>2. Connect External AI (Claude Desktop / Cursor):</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--ink-muted)', marginTop: '4px' }}>
                    To let Claude Desktop or Cursor inspect your schedule or control your browser tab, add this to your <code>claude_desktop_config.json</code>:
                  </div>
                  
                  <div style={{ position: 'relative', marginTop: '8px' }}>
                    <pre style={{
                      backgroundColor: 'var(--paper)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontFamily: 'monospace',
                      overflowX: 'auto',
                      margin: 0,
                      border: '1px solid var(--border)'
                    }}>
{`{
  "mcpServers": {
    "xlflow": {
      "command": "bun",
      "args": ["<path-to-xlflow>/mcp-server/stdio.js"]
    }
  }
}`}
                    </pre>
                    <button
                      onClick={() => handleCopy(`{\n  "mcpServers": {\n    "xlflow": {\n      "command": "bun",\n      "args": ["<path-to-xlflow>/mcp-server/stdio.js"]\n    }\n  }\n}`)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--ink)'
                      }}
                    >
                      {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8. FAQs */}
          {activeSection === 'faq' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <HelpCircle size={20} style={{ color: 'var(--indigo)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                  Frequently Asked Questions
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
                <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>Q: What if ERP updates or reschedules a lecture?</div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '4px' }}>
                    Click the <strong>Refresh</strong> button (circular arrow icon in header). The app refetches the latest timetable immediately and updates your room numbers and timings.
                  </div>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>Q: Does this work without internet?</div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '4px' }}>
                    Yes! XL-Flow caches your entire timetable and attendance status locally. You can inspect classrooms and calculate bunk safety even in basement lecture halls with zero signal.
                  </div>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>Q: Will this system stop working during mid-terms or finals?</div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '4px' }}>
                    No. The deployment is 100% static on GitHub Pages CDN with zero server dependencies, guaranteeing 24/7 availability for the entire duration of Term-5.
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'var(--ink-muted)'
        }}>
          <div>
            Need help? Reach out on the batch group.
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              backgroundColor: 'var(--ink)',
              color: 'var(--paper)',
              border: 'none',
              borderRadius: '9999px',
              fontWeight: 600,
              fontSize: '12.5px',
              cursor: 'pointer'
            }}
          >
            Got it, Let's Go
          </button>
        </div>

      </div>
    </div>
  );
}
