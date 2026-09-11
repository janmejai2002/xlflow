import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  Sparkles,
  X,
  Share2,
  Trash2,
  Check,
  Radio,
  Flame
} from 'lucide-react';
import { CAMPUS_ZONES, STATUS_PRESETS } from '../../services/socialMockFixtures';
import { socialApi } from '../../services/socialApi';
import { generateBeaconSharePayload } from '../../services/deepLinkHandler';
import { toast } from 'sonner';
import { fireStreakConfetti } from '../../services/confetti';

export default function StatusBeaconModal({ isOpen, onClose, currentUser, onStatusUpdated }) {
  if (!isOpen) return null;

  const [selectedZone, setSelectedZone] = useState('nescafe');
  const [statusText, setStatusText] = useState('Coffee at Nescafe • Come join!');
  const [selectedEmoji, setSelectedEmoji] = useState('☕');
  const [durationMins, setDurationMins] = useState(45);
  const [activeStatus, setActiveStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const current = socialApi.getMyStatus();
    if (current) {
      setActiveStatus(current);
      setSelectedZone(current.zone || 'nescafe');
      setStatusText(current.text || '');
      setSelectedEmoji(current.emoji || '📍');
    }
  }, [isOpen]);

  const handleApplyPreset = (preset) => {
    setSelectedZone(preset.zone);
    setStatusText(preset.text);
    setSelectedEmoji(preset.emoji);
    setDurationMins(preset.defaultMins);
  };

  const handlePublishStatus = async () => {
    if (!statusText.trim()) {
      toast.error('Please enter a short status note');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        rollNo: currentUser?.id || 'B25349',
        name: currentUser?.name || 'Janmejai Singh',
        section: currentUser?.section || 'E',
        emoji: selectedEmoji,
        text: statusText.trim(),
        zone: selectedZone,
        durationMins
      };

      const res = await socialApi.setStatus(payload);
      setActiveStatus(res.status || payload);
      fireStreakConfetti();
      toast.success('Campus Beacon Live!', {
        description: 'Broadcasting across ' + selectedZone.toUpperCase() + ' for ' + durationMins + 'm'
      });
      if (onStatusUpdated) onStatusUpdated(res.status || payload);
      onClose();
    } catch {
      toast.error('Failed to broadcast beacon');
    } finally {
      setLoading(false);
    }
  };

  const handleClearStatus = async () => {
    const roll = currentUser?.id || 'B25349';
    await socialApi.clearStatus(roll);
    setActiveStatus(null);
    toast('Beacon cleared');
    if (onStatusUpdated) onStatusUpdated(null);
    onClose();
  };

  const handleWhatsAppShare = () => {
    const payload = activeStatus || {
      zone: selectedZone,
      emoji: selectedEmoji,
      text: statusText
    };
    const share = generateBeaconSharePayload(payload);
    window.open(share.whatsappUrl, '_blank');
  };

  const remainingMins = activeStatus?.expiresAt
    ? Math.max(0, Math.round((new Date(activeStatus.expiresAt).getTime() - Date.now()) / 60000))
    : 0;

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
          maxWidth: '520px',
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
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--card-hover)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--wash-ochre)',
              border: '1px solid rgba(194, 145, 58, 0.3)',
              color: 'var(--ochre)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Radio size={18} className="animate-pulse motion-reduce:animate-none" />
            </div>
            <div>
              <h3 style={{
                fontFamily: 'var(--font-brand)',
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--ink)',
                margin: 0
              }}>
                Broadcast Campus Beacon
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--ink-soft)', margin: '2px 0 0 0' }}>
                Let friends & batchmates know where you are hanging out or studying
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '18px', maxHeight: '70vh', overflowY: 'auto' }}>
          
          {/* Active Beacon Banner (if any) */}
          {activeStatus && remainingMins > 0 && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: 'var(--wash-moss)',
              border: '1px solid rgba(110, 140, 99, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{activeStatus.emoji}</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--moss)' }}>
                    Active Beacon • {remainingMins}m left
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink)' }}>
                    {activeStatus.text}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={handleWhatsAppShare}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ink)',
                    color: 'var(--paper)',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Share2 size={12} /> WhatsApp
                </button>
                <button
                  onClick={handleClearStatus}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--wash-hanko)',
                    color: 'var(--hanko)',
                    border: '1px solid rgba(210, 84, 63, 0.2)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Trash2 size={12} /> Clear
                </button>
              </div>
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-soft)', letterSpacing: '0.04em' }}>
              QUICK CAMPUS PRESETS
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {STATUS_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(preset)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    backgroundColor: statusText === preset.text ? 'var(--wash-mizu)' : 'var(--paper)',
                    color: statusText === preset.text ? 'var(--mizu)' : 'var(--ink)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{preset.emoji}</span>
                  <span>{preset.text.split('•')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location / Zone Selector */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-soft)', letterSpacing: '0.04em' }}>
              CAMPUS HOTSPOT ZONE
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginTop: '8px' }}>
              {CAMPUS_ZONES.map(z => {
                const isSelected = selectedZone === z.id;
                return (
                  <div
                    key={z.id}
                    onClick={() => setSelectedZone(z.id)}
                    style={{
                      padding: '10px',
                      borderRadius: '12px',
                      border: isSelected ? ('2px solid ' + z.color) : '1px solid var(--border)',
                      backgroundColor: isSelected ? z.wash : 'var(--paper)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{z.emoji}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? z.color : 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {z.name.split(' ')[0]}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>
                        {z.tag}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Note & Emoji */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-soft)', letterSpacing: '0.04em' }}>
              CUSTOM NOTE & EMOJI
            </label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <input
                type="text"
                value={selectedEmoji}
                onChange={(e) => setSelectedEmoji(e.target.value)}
                maxLength={4}
                style={{
                  width: '48px',
                  textAlign: 'center',
                  fontSize: '20px',
                  backgroundColor: 'var(--paper)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  outline: 'none',
                  color: 'var(--ink)'
                }}
              />
              <input
                type="text"
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                placeholder="What are you up to?"
                maxLength={80}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  fontSize: '13px',
                  backgroundColor: 'var(--paper)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  outline: 'none',
                  color: 'var(--ink)'
                }}
              />
            </div>
          </div>

          {/* Expiration Duration */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-soft)', letterSpacing: '0.04em' }}>
              AUTO-EXPIRE AFTER
            </label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {[
                { label: '30m', val: 30 },
                { label: '45m', val: 45 },
                { label: '1h', val: 60 },
                { label: '2h', val: 120 },
                { label: '4h', val: 240 }
              ].map(d => (
                <button
                  key={d.val}
                  onClick={() => setDurationMins(d.val)}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: '8px',
                    border: durationMins === d.val ? '1px solid var(--ink)' : '1px solid var(--border)',
                    backgroundColor: durationMins === d.val ? 'var(--ink)' : 'var(--paper)',
                    color: durationMins === d.val ? 'var(--paper)' : 'var(--ink)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 22px',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--card-hover)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--paper)',
              color: 'var(--ink)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            onClick={handlePublishStatus}
            disabled={loading}
            style={{
              padding: '9px 20px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: 'var(--ink)',
              color: 'var(--paper)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <Sparkles size={14} color="var(--ochre)" />
            {loading ? 'Broadcasting...' : 'Set Active Beacon'}
          </button>
        </div>

      </div>
    </div>
  );
}
