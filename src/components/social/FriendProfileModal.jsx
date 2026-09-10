import React, { useState, useEffect } from 'react';
import {
  User,
  Star,
  Calendar,
  Clock,
  Share2,
  X,
  Sparkles,
  MapPin,
  Check
} from 'lucide-react';
import { socialApi } from '../../services/socialApi';
import { generateMeetSharePayload } from '../../services/deepLinkHandler';
import { toast } from 'sonner';
import { fireStreakConfetti } from '../../services/confetti';

export default function FriendProfileModal({ isOpen, onClose, student, currentUser, onFriendToggled }) {
  if (!isOpen || !student) return null;

  const [isFriend, setIsFriend] = useState(false);
  const [overlapData, setOverlapData] = useState(null);
  const [loadingOverlap, setLoadingOverlap] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const myRoll = currentUser?.id || 'B25349';
  const friendRoll = student.rollNo || student.roll;

  useEffect(() => {
    let mounted = true;
    const checkFriend = async () => {
      try {
        const friends = await socialApi.getFriends(myRoll);
        if (mounted) setIsFriend(friends.includes(friendRoll));
      } catch {}
    };

    const loadOverlap = async () => {
      setLoadingOverlap(true);
      try {
        const res = await socialApi.getScheduleOverlap([myRoll, friendRoll]);
        if (mounted) setOverlapData(res);
      } catch {} finally {
        if (mounted) setLoadingOverlap(false);
      }
    };

    checkFriend();
    loadOverlap();

    return () => { mounted = false; };
  }, [student, myRoll, friendRoll]);

  const handleToggleFriend = async () => {
    try {
      const res = await socialApi.toggleFriend(myRoll, friendRoll);
      setIsFriend(res.isFriend);
      if (res.isFriend) {
        fireStreakConfetti();
        toast.success('Added ' + (student.name || 'friend') + ' to starred friends!');
      } else {
        toast('Removed from starred friends');
      }
      if (onFriendToggled) onFriendToggled(friendRoll, res.isFriend);
    } catch {
      toast.error('Failed to update friend status');
    }
  };

  const handleShareInvite = () => {
    const share = generateMeetSharePayload(myRoll, currentUser?.name);
    window.open(share.whatsappUrl, '_blank');
  };

  const handleCopyMeetLink = () => {
    const share = generateMeetSharePayload(myRoll, currentUser?.name);
    navigator.clipboard.writeText(share.url);
    setCopiedLink(true);
    toast.success('Direct meet link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const mutualFreeSlots = overlapData?.grid?.filter(g => g.mutualFree) || [];

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
          maxWidth: '480px',
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
        {/* Profile Header */}
        <div style={{
          padding: '20px 22px',
          backgroundColor: 'var(--card-hover)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              backgroundColor: 'var(--wash-mizu)',
              border: '1px solid rgba(0, 169, 184, 0.3)',
              color: 'var(--mizu)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-brand)',
              fontSize: '20px',
              fontWeight: 800
            }}>
              {student.name ? student.name.charAt(0) : 'S'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{
                  fontFamily: 'var(--font-brand)',
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--ink)',
                  margin: 0
                }}>
                  {student.name}
                </h3>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--mizu)',
                  backgroundColor: 'var(--wash-mizu)',
                  padding: '1px 6px',
                  borderRadius: '4px'
                }}>
                  Sec {student.section || 'E'}
                </span>
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', marginTop: '2px' }}>
                {friendRoll} • XLRI Jamshedpur BM/HRM
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handleToggleFriend}
              style={{
                background: isFriend ? 'var(--wash-ochre)' : 'none',
                border: isFriend ? '1px solid rgba(194, 145, 58, 0.3)' : '1px solid var(--border)',
                color: isFriend ? 'var(--ochre)' : 'var(--ink-soft)',
                borderRadius: '8px',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              <Star size={13} fill={isFriend ? 'var(--ochre)' : 'none'} />
              <span>{isFriend ? 'Starred' : 'Star'}</span>
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer', padding: '6px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Active Status Badge if live */}
          {student.text && (
            <div style={{
              backgroundColor: 'var(--paper)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '24px' }}>{student.emoji || '📍'}</span>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                  Current Campus Presence
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                  {student.text}
                </div>
              </div>
            </div>
          )}

          {/* Schedule Overlap Summary */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-soft)', letterSpacing: '0.04em' }}>
                MUTUAL FREE WINDOWS THIS WEEK
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--moss)',
                backgroundColor: 'var(--wash-moss)',
                padding: '2px 8px',
                borderRadius: '999px'
              }}>
                {mutualFreeSlots.length} free slots
              </span>
            </div>

            {loadingOverlap ? (
              <div style={{ textAlign: 'center', padding: '20px', fontSize: '12px', color: 'var(--ink-soft)' }}>
                Comparing schedules...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                {mutualFreeSlots.slice(0, 6).map((slot, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--paper)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={13} color="var(--mizu)" />
                      <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{slot.day}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={12} color="var(--ink-soft)" />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-soft)' }}>
                        {slot.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 22px',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--card-hover)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          <button
            onClick={handleCopyMeetLink}
            style={{
              padding: '8px 14px',
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
            {copiedLink ? <Check size={13} color="var(--moss)" /> : <Clock size={13} />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Slot Link'}</span>
          </button>

          <button
            onClick={handleShareInvite}
            style={{
              padding: '8px 16px',
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
            <Share2 size={13} color="var(--mizu)" />
            <span>Invite to Catch Up</span>
          </button>
        </div>

      </div>
    </div>
  );
}
