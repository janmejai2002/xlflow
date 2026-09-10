import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Share2,
  Copy,
  Check,
  X,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { socialApi } from '../../services/socialApi';
import { generateCircleSharePayload } from '../../services/deepLinkHandler';
import { toast } from 'sonner';
import { fireStreakConfetti } from '../../services/confetti';
import { ROSTER } from '../../data/rosterData';

export default function StudyCircleModal({ isOpen, onClose, currentUser, initialCode = '' }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState(initialCode ? 'join' : 'circles');
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [joinCode, setJoinCode] = useState(initialCode || '');
  const [newCircleName, setNewCircleName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('STMAN');
  const [copiedCode, setCopiedCode] = useState(null);

  const myRoll = currentUser?.id || 'B25349';
  const myName = currentUser?.name || 'Janmejai Singh';

  const loadCircles = async () => {
    setLoading(true);
    try {
      const data = await socialApi.getCircles(myRoll);
      setCircles(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCircles();
  }, [isOpen, myRoll]);

  const handleCreateCircle = async () => {
    if (!newCircleName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      const circle = await socialApi.createCircle({
        name: newCircleName.trim(),
        courseCode: newCourseCode.trim().toUpperCase(),
        ownerRoll: myRoll,
        ownerName: myName
      });
      fireStreakConfetti();
      toast.success('Circle Created! Squad Code: ' + circle.code);
      setNewCircleName('');
      setActiveTab('circles');
      loadCircles();
    } catch {
      toast.error('Failed to create circle');
    }
  };

  const handleJoinCircle = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      toast.error('Please enter a 6-character squad code');
      return;
    }

    try {
      const res = await socialApi.joinCircle({
        code,
        rollNo: myRoll,
        name: myName
      });
      if (res.ok) {
        fireStreakConfetti();
        toast.success('Joined Squad ' + code + '!');
        setJoinCode('');
        setActiveTab('circles');
        loadCircles();
      } else {
        toast.error(res.message || 'Circle not found');
      }
    } catch {
      toast.error('Failed to join circle');
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code ' + code + ' copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleShareCircle = (circle) => {
    const share = generateCircleSharePayload(circle.name, circle.code);
    window.open(share.whatsappUrl, '_blank');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--card)',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card), 0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          backgroundColor: 'var(--card-hover)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--wash-mizu)',
              border: '1px solid rgba(0, 169, 184, 0.3)',
              color: 'var(--mizu)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={18} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-brand)', fontSize: '18px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                Study Circles & Project Squads
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--ink-soft)', margin: '2px 0 0 0' }}>
                Coordinate term papers, case analysis & find group free meeting slots
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer', padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--paper)',
          padding: '0 20px'
        }}>
          {[
            { id: 'circles', label: 'My Squads (' + circles.length + ')' },
            { id: 'join', label: 'Join via Code' },
            { id: 'create', label: '+ Create Squad' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 14px',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--ink)' : '2px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === tab.id ? 'var(--ink)' : 'var(--ink-soft)',
                fontSize: '12px',
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '20px 22px', maxHeight: '65vh', overflowY: 'auto' }}>
          
          {/* TAB 1: MY CIRCLES */}
          {activeTab === 'circles' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--ink-soft)', fontSize: '12px' }}>
                  Loading study circles...
                </div>
              ) : circles.length === 0 ? (
                <div style={{
                  padding: '30px',
                  textAlign: 'center',
                  backgroundColor: 'var(--paper)',
                  borderRadius: '14px',
                  border: '1px dashed var(--border)'
                }}>
                  <Users size={32} color="var(--ink-soft)" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                    No Study Circles Joined Yet
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--ink-soft)', maxWidth: '280px', margin: '6px auto 14px' }}>
                    Create a squad for your Strategy or Marketing project group, or join with a 6-character code.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setActiveTab('create')}
                      style={{
                        padding: '7px 14px',
                        backgroundColor: 'var(--ink)',
                        color: 'var(--paper)',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      + Create Squad
                    </button>
                    <button
                      onClick={() => setActiveTab('join')}
                      style={{
                        padding: '7px 14px',
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        color: 'var(--ink)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Enter Code
                    </button>
                  </div>
                </div>
              ) : (
                circles.map(c => (
                  <div
                    key={c.code}
                    style={{
                      backgroundColor: 'var(--paper)',
                      borderRadius: '14px',
                      border: '1px solid var(--border)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--mizu)', backgroundColor: 'var(--wash-mizu)', padding: '1px 6px', borderRadius: '4px' }}>
                            {c.courseCode || 'GENERAL'}
                          </span>
                          <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                            {c.name}
                          </h4>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                            Squad Code:
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--ink)',
                            backgroundColor: 'var(--card)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--border)'
                          }}>
                            {c.code}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleCopyCode(c.code)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--card)',
                            color: 'var(--ink)',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {copiedCode === c.code ? <Check size={12} color="var(--moss)" /> : <Copy size={12} />}
                          <span>{copiedCode === c.code ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          onClick={() => handleShareCircle(c)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: 'var(--ink)',
                            color: 'var(--paper)',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Share2 size={12} />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>

                    {/* Member Avatars */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ink-soft)' }}>
                        MEMBERS ({c.members?.length || 0}):
                      </span>
                      {(c.members || []).map(roll => {
                        const info = ROSTER[roll] || { name: roll, section: 'E' };
                        return (
                          <span
                            key={roll}
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--card)',
                              border: '1px solid var(--border)',
                              color: 'var(--ink)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--mizu)' }}>{info.section}</span>
                            <span>{info.name.split(' ')[0]}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: JOIN VIA CODE */}
          {activeTab === 'join' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--wash-mizu)',
                border: '1px solid rgba(0, 169, 184, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <ShieldCheck size={20} color="var(--mizu)" />
                <div style={{ fontSize: '12px', color: 'var(--ink)' }}>
                  Enter the 6-character squad code shared by your group leader (e.g. <b>XL-STRAT</b>).
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-soft)', letterSpacing: '0.04em' }}>
                  SQUAD INVITE CODE
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="XL-XXXX"
                  maxLength={10}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '16px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.1em',
                    backgroundColor: 'var(--paper)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    outline: 'none',
                    color: 'var(--ink)',
                    marginTop: '6px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                onClick={handleJoinCircle}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'var(--ink)',
                  color: 'var(--paper)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                <span>Join Study Squad</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* TAB 3: CREATE SQUAD */}
          {activeTab === 'create' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-soft)', letterSpacing: '0.04em' }}>
                  SQUAD / PROJECT NAME
                </label>
                <input
                  type="text"
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  placeholder="e.g. Strategy Case Competition Squad"
                  maxLength={50}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '13px',
                    backgroundColor: 'var(--paper)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    outline: 'none',
                    color: 'var(--ink)',
                    marginTop: '6px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-soft)', letterSpacing: '0.04em' }}>
                  COURSE CODE / DOMAIN
                </label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {['STMAN', 'OMCR', 'FINTECH', 'PEVC', 'TALENT', 'GENERAL'].map(course => (
                    <button
                      key={course}
                      onClick={() => setNewCourseCode(course)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: newCourseCode === course ? '1px solid var(--ink)' : '1px solid var(--border)',
                        backgroundColor: newCourseCode === course ? 'var(--ink)' : 'var(--paper)',
                        color: newCourseCode === course ? 'var(--paper)' : 'var(--ink)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {course}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateCircle}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'var(--ink)',
                  color: 'var(--paper)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: 'var(--shadow-card)',
                  marginTop: '6px'
                }}
              >
                <Sparkles size={14} color="var(--ochre)" />
                <span>Create & Generate Share Code</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
