import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  Sparkles,
  Users,
  Radio,
  Share2,
  RefreshCw,
  Plus,
  Compass,
  ArrowRight
} from 'lucide-react';
import { CAMPUS_ZONES } from '../../services/socialMockFixtures';
import { socialApi } from '../../services/socialApi';
import { generateBeaconSharePayload } from '../../services/deepLinkHandler';
import { toast } from 'sonner';

export default function CampusRadarView({ currentUser, onOpenBeaconModal, onSelectStudent }) {
  const [whosWhere, setWhosWhere] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myStatus, setMyStatus] = useState(null);

  const fetchPresence = async () => {
    setLoading(true);
    try {
      const data = await socialApi.getWhosWhere();
      setWhosWhere(data);
      setMyStatus(socialApi.getMyStatus());
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresence();
    const unsubscribe = socialApi.subscribe((event) => {
      if (event.type === 'STATUS_UPDATED' || event.type === 'STATUS_CLEARED') {
        fetchPresence();
      }
    });
    return unsubscribe;
  }, []);

  const handleShareRadar = () => {
    const total = whosWhere?.zoneCounts?.total || 0;
    const share = generateBeaconSharePayload({
      zone: 'campus',
      emoji: '📍',
      text: total + ' batchmates are active across XLRI campus right now!'
    });
    window.open(share.whatsappUrl, '_blank');
  };

  const myRemainingMins = myStatus?.expiresAt
    ? Math.max(0, Math.round((new Date(myStatus.expiresAt).getTime() - Date.now()) / 60000))
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Banner / Header Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--card)',
        padding: '14px 18px',
        borderRadius: '16px',
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            backgroundColor: 'var(--wash-mizu)',
            border: '1px solid rgba(0, 169, 184, 0.3)',
            color: 'var(--mizu)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 169, 184, 0.15)'
          }}>
            <Compass size={20} className="animate-spin-slow" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ink)' }}>
                Campus Presence Radar
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--moss)',
                backgroundColor: 'var(--wash-moss)',
                padding: '2px 8px',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--moss)' }} />
                {whosWhere?.zoneCounts?.total || 0} active now
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--ink-soft)', margin: '2px 0 0 0' }}>
              Real-time student beacons across campus hotspots with auto-expiration
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={fetchPresence}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '7px',
              cursor: 'pointer',
              color: 'var(--ink-soft)'
            }}
            title="Refresh presence"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleShareRadar}
            style={{
              padding: '7px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--paper)',
              color: 'var(--ink)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Share2 size={13} />
            <span>Invite via WhatsApp</span>
          </button>

          <button
            onClick={onOpenBeaconModal}
            style={{
              padding: '7px 14px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: 'var(--ink)',
              color: 'var(--paper)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            {myStatus && myRemainingMins > 0 ? (
              <>
                <span>{myStatus.emoji}</span>
                <span>{myRemainingMins}m left • Edit</span>
              </>
            ) : (
              <>
                <Radio size={13} color="var(--ochre)" />
                <span>+ Set My Beacon</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* How Campus Radar Works: Explainer Ribbon */}
      <div style={{
        backgroundColor: 'var(--card)',
        borderRadius: '14px',
        border: '1px solid var(--border)',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--ink)' }}>
          <Sparkles size={15} color="var(--mizu)" style={{ flexShrink: 0 }} />
          <span>
            <strong>How It Works:</strong> Tap <strong>+ Set My Beacon</strong> to let batchmates know where you are on campus (Library, Nescafe, Gym, CR). Beacons auto-expire in 30–90m.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: 'var(--ink-soft)' }}>
          <span>🔒 Zero tracking (opt-in only)</span>
          <span>⏱️ Auto-clears</span>
          <span>👥 Tap any card to view schedule</span>
        </div>
      </div>

      {/* Zero Active Beacons Prompt */}
      {(!whosWhere?.zoneCounts?.total || whosWhere.zoneCounts.total === 0) && (
        <div style={{
          backgroundColor: 'var(--card)',
          borderRadius: '14px',
          border: '1px dashed var(--border)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📍</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                No active beacons right now
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: '4px 0 0 0' }}>
              Be the first to broadcast where you are studying or grabbing coffee!
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onOpenBeaconModal}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--ink)',
                color: 'var(--paper)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              + Broadcast My Spot
            </button>
            <button
              onClick={handleShareRadar}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--paper)',
                color: 'var(--ink)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Share WhatsApp Link
            </button>
          </div>
        </div>
      )}

      {/* Campus Zones Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '14px'
      }}>
        {CAMPUS_ZONES.map(zone => {
          const studentsInZone = whosWhere?.byZone?.[zone.id] || [];
          const count = studentsInZone.length;

          return (
            <div
              key={zone.id}
              style={{
                backgroundColor: 'var(--card)',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Zone Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: zone.wash,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                  }}>
                    {zone.emoji}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                      {zone.name}
                    </h4>
                    <span style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>
                      {zone.tag}
                    </span>
                  </div>
                </div>

                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: count > 0 ? zone.wash : 'var(--border-soft)',
                  color: count > 0 ? zone.color : 'var(--ink-soft)'
                }}>
                  {count} {count === 1 ? 'person' : 'people'}
                </span>
              </div>

              {/* Student Presence Chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '60px' }}>
                {count === 0 ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '60px',
                    backgroundColor: 'var(--paper)',
                    borderRadius: '10px',
                    border: '1px dashed var(--border)',
                    fontSize: '11px',
                    color: 'var(--ink-soft)'
                  }}>
                    Quiet right now • Be the first to check in
                  </div>
                ) : (
                  studentsInZone.map(student => {
                    const remaining = student.expiresAt
                      ? Math.max(0, Math.round((new Date(student.expiresAt).getTime() - Date.now()) / 60000))
                      : 0;

                    return (
                      <div
                        key={student.rollNo}
                        onClick={() => onSelectStudent && onSelectStudent(student)}
                        style={{
                          backgroundColor: 'var(--paper)',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease, border-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = zone.color}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <span style={{ fontSize: '18px' }}>{student.emoji || '📍'}</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {student.name}
                              </span>
                              <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--mizu)', backgroundColor: 'var(--wash-mizu)', padding: '1px 4px', borderRadius: '4px' }}>
                                {student.section}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {student.text}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
                            {remaining}m left
                          </span>
                          <ArrowRight size={12} color="var(--ink-soft)" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
