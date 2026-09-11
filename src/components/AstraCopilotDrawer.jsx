import React, { useState, useRef, useEffect } from 'react';
import { Drawer } from 'vaul';
import { Sparkles, Send, Bot, User, ArrowRight, Check, X, Headphones, Settings } from 'lucide-react';
import { queryAstraAi, getStoredAiConfig } from '../services/aiProviderEngine';
import ProactiveActionDeck from './copilot/ProactiveActionDeck';
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

export default function AstraCopilotDrawer({ isOpen, onClose, context, onExecuteAction, onOpenAiSettings }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hello Janmejai! I am **Astra**, your Term-5 AI Assistant. I can answer questions about your courses, calculate attendance margins, and help you navigate XL-Flow. What would you like to check?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 150);
    }
  }, [messages, isOpen, isAiLoading]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isAiLoading) return;

    playTactileClick(700);

    const newMsgs = [...messages, { role: 'user', text: query }];
    setMessages(newMsgs);
    setInputValue('');
    setIsAiLoading(true);

    try {
      const result = await queryAstraAi(query, context);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: result.reply,
        action: result.action,
        providerName: result.providerName
      }]);

      if (result.action && onExecuteAction) {
        onExecuteAction(result.action);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "I encountered an error. Falling back to offline solver."
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const suggestions = [
    "Can I bunk OMCR?",
    "Where is my next class?",
    "Find natural getaways",
    "Who is roll 349?",
    "Play focus soundscape"
  ];

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          zIndex: 85,
          backdropFilter: 'blur(4px)'
        }} />
        <Drawer.Content className="max-h-[85vh] overflow-y-auto" style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '540px',
          height: '80vh',
          backgroundColor: 'var(--card)',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          border: '1px solid var(--border)',
          zIndex: 95,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
          outline: 'none'
        }}>
          {/* Top Handle */}
          <div style={{
            width: '36px',
            height: '4px',
            borderRadius: '9999px',
            backgroundColor: 'var(--border)',
            margin: '10px auto 4px auto'
          }} />

          {/* Drawer Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'var(--wash-mizu)',
                border: '1px solid rgba(0, 169, 184, 0.3)',
                color: 'var(--mizu)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={16} />
              </div>
              <div>
                <Drawer.Title style={{
                  fontFamily: 'var(--font-brand)',
                  fontSize: '17px',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'var(--ink)',
                  margin: 0
                }}>
                  Astra AI Assistant
                </Drawer.Title>
                <p style={{ fontSize: '11px', color: 'var(--ink-soft)', margin: 0 }}>
                  Direct schedule and attendance assistant
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => onOpenAiSettings?.()}
                title="Configure AI Settings"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'var(--paper)',
                  border: '1px solid var(--border)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  color: 'var(--mizu)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Settings size={12} />
                <span>AI Settings</span>
              </button>

              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ink-soft)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <Drawer.Description style={{ display: 'none' }}>
            Astra AI assistant for XLRI students
          </Drawer.Description>

          {/* Message Stream */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* 2026 Proactive Agentic Action Deck */}
            <ProactiveActionDeck
              context={context}
              onExecuteAction={(action) => {
                if (onExecuteAction) onExecuteAction(action);
                onClose?.();
              }}
              isCompact={true}
            />

            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%'
                }}
              >
                {m.role === 'assistant' && (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--wash-mizu)',
                    color: 'var(--mizu)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <Bot size={13} />
                  </div>
                )}

                <div style={{
                  backgroundColor: m.role === 'user' ? 'var(--ink)' : 'var(--paper)',
                  color: m.role === 'user' ? 'var(--paper)' : 'var(--ink)',
                  padding: '10px 14px',
                  borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                  fontSize: '13px',
                  lineHeight: '1.45',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  {m.role === 'user' ? (
                    <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {m.text}
                    </div>
                  ) : (
                    <div>
                      {renderFormattedMarkdown(m.text)}
                      {m.action && (
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
                          <span>{formatActionLabel(m.action)}</span>
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
                <span>Astra is checking your schedule & attendance...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            padding: '6px 16px',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--paper-subtle)'
          }}>
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s)}
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--ink)',
                  fontSize: '11px',
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--card)'
          }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Astra about schedule, bunks, or courses..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--paper)',
                color: 'var(--ink)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim()}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: inputValue.trim() ? 'var(--ink)' : 'var(--border)',
                color: 'var(--paper)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s'
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
