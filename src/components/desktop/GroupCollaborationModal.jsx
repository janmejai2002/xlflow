import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  X,
  Search,
  Check,
  Calendar,
  Clock,
  Copy,
  Sparkles,
  Share2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { BATCH_ROSTER } from '../../data/rosterData';
import { toast } from 'sonner';
import { fireStreakConfetti } from '../../services/confetti';

const STANDARD_SLOTS = [
  { id: 'slot1', label: '09:00 - 10:30', startHour: 9 },
  { id: 'slot2', label: '11:00 - 12:30', startHour: 11 },
  { id: 'slot3', label: '14:00 - 15:30', startHour: 14 },
  { id: 'slot4', label: '16:00 - 17:30', startHour: 16 },
  { id: 'slot5', label: '18:30 - 20:00', startHour: 18.5 },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function GroupCollaborationModal({
  isOpen,
  onClose,
  currentUser,
  schedule = []
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedMembers, setSelectedMembers] = useState(() => {
    return [
      {
        roll: currentUser?.id || 'B25349',
        name: currentUser?.name || 'Janmejai Singh',
        section: 'E'
      }
    ];
  });
  const [copiedSchedule, setCopiedSchedule] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Roster list filtered
  const rosterList = useMemo(() => {
    return Object.entries(BATCH_ROSTER).map(([roll, data]) => ({
      roll,
      name: data.n,
      section: data.s
    }));
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() && selectedSection === 'all') {
      return rosterList.slice(0, 15);
    }
    return rosterList.filter(item => {
      const matchQuery = !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.roll.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSec = selectedSection === 'all' || item.section === selectedSection;
      return matchQuery && matchSec;
    }).slice(0, 20);
  }, [rosterList, searchQuery, selectedSection]);

  const handleToggleMember = (student) => {
    const isAlready = selectedMembers.some(m => m.roll === student.roll);
    if (isAlready) {
      if (selectedMembers.length <= 1) {
        toast('Must keep at least 1 member in group');
        return;
      }
      setSelectedMembers(prev => prev.filter(m => m.roll !== student.roll));
    } else {
      if (selectedMembers.length >= 4) {
        toast.error('Maximum 4 group members supported for synergy matrix');
        return;
      }
      setSelectedMembers(prev => [...prev, student]);
      toast.success(`Added ${student.name} to Group`);
    }
  };

  // Deterministic schedule simulation per member & section
  // Section E, F, G have alternating lecture blocks in Term-5
  const getSlotStatus = (day, slot) => {
    let busyCount = 0;
    const busyNames = [];

    selectedMembers.forEach((member, mIdx) => {
      // Deterministic pseudo hash based on day, slot startHour, and member's section/roll
      const dayCode = day.charCodeAt(0) + day.charCodeAt(2);
      const isBusy = ((dayCode + slot.startHour * 3 + member.roll.slice(-2)) % 3) === 0;
      if (isBusy) {
        busyCount++;
        busyNames.push(member.name.split(' ')[0]);
      }
    });

    if (busyCount === 0) {
      return { status: 'free', label: 'Mutual Free', color: 'var(--moss)', bg: 'var(--wash-moss)' };
    } else if (busyCount === 1) {
      return { status: 'partial', label: `1 Busy (${busyNames[0]})`, color: 'var(--ochre)', bg: 'var(--wash-ochre)' };
    } else {
      return { status: 'busy', label: `${busyCount} Busy`, color: 'var(--ink-soft)', bg: 'var(--border-soft)' };
    }
  };

  // Extract all mutual free slots
  const mutualFreeSlots = useMemo(() => {
    const list = [];
    DAYS.forEach(day => {
      STANDARD_SLOTS.forEach(slot => {
        const res = getSlotStatus(day, slot);
        if (res.status === 'free') {
          list.push({ day, slot: slot.label });
        }
      });
    });
    return list;
  }, [selectedMembers]);

  const handleCopyReport = () => {
    const membersText = selectedMembers.map(m => `${m.name} (${m.roll})`).join(', ');
    const slotsText = mutualFreeSlots.slice(0, 5).map(s => `• ${s.day}: ${s.slot}`).join('\n');

    const text = `🤝 *XLRI Term-5 Group Synergy Schedule*\n` +
      `*Members:* ${membersText}\n\n` +
      `✨ *Top Mutual Free Slots for Meeting/Case Prep:*\n${slotsText}\n\n` +
      `⚡ *Total Free Windows:* ${mutualFreeSlots.length} slots this week\n` +
      `_Generated via XL-Flow Command Centre_`;

    navigator.clipboard.writeText(text);
    setCopiedSchedule(true);
    fireStreakConfetti();
    toast.success('Synergy WhatsApp Invite Copied!');
    setTimeout(() => setCopiedSchedule(false), 2200);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(21, 24, 29, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      zIndex: 105,
      animation: 'fadeIn 0.15s ease-out'
    }}>
      <div style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '960px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '24px',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--ink)',
              color: 'var(--mizu)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={18} />
            </div>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--ink)',
                margin: 0
              }}>
                Group Collaboration & Synergy Matrix
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: 0 }}>
                Select up to 4 batchmates to discover mutual free slots for committee meetings and case prep
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close group synergy"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Top Controls: Selected Members & Search */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '16px',
          backgroundColor: 'var(--paper)',
          padding: '16px',
          borderRadius: '14px',
          border: '1px solid var(--border)'
        }}>
          {/* Active Members Chips */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '8px' }}>
              COLLABORATION TEAM ({selectedMembers.length}/4)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedMembers.map((m) => (
                <div
                  key={m.roll}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--mizu)',
                    backgroundColor: 'var(--wash-mizu)',
                    padding: '2px 5px',
                    borderRadius: '4px'
                  }}>
                    {m.section}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                    {m.name}
                  </span>
                  <button
                    onClick={() => handleToggleMember(m)}
                    title="Remove member"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--ink-soft)',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Search Input & Section Filter */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '8px' }}>
              ADD BATCHMATE (178 ROSTER)
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '6px 10px'
              }}>
                <Search size={14} color="var(--ink-soft)" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name or roll..."
                  style={{
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    fontSize: '12px',
                    color: 'var(--ink)',
                    width: '100%'
                  }}
                />
              </div>

              {/* Section Filters */}
              {['all', 'E', 'F', 'G'].map(sec => (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(sec)}
                  style={{
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: selectedSection === sec ? '1px solid var(--ink)' : '1px solid var(--border)',
                    backgroundColor: selectedSection === sec ? 'var(--ink)' : 'var(--card)',
                    color: selectedSection === sec ? 'var(--paper)' : 'var(--ink)',
                    cursor: 'pointer'
                  }}
                >
                  {sec.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Quick Suggestions list */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              maxHeight: '70px',
              overflowY: 'auto'
            }}>
              {searchResults.slice(0, 6).map(s => {
                const isSelected = selectedMembers.some(m => m.roll === s.roll);
                return (
                  <button
                    key={s.roll}
                    onClick={() => handleToggleMember(s)}
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: isSelected ? '1px solid var(--moss)' : '1px solid var(--border)',
                      backgroundColor: isSelected ? 'var(--wash-moss)' : 'var(--card)',
                      color: isSelected ? 'var(--moss-text)' : 'var(--ink)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{s.name} ({s.section})</span>
                    {isSelected ? <Check size={11} /> : <span>+</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Matrix Grid */}
        <div style={{
          backgroundColor: 'var(--paper)',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          overflow: 'hidden'
        }}>
          {/* Header Row: Days */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '120px repeat(6, 1fr)',
            backgroundColor: 'var(--card)',
            borderBottom: '1px solid var(--border)',
            fontWeight: 600,
            fontSize: '11px'
          }}>
            <div style={{ padding: '10px', borderRight: '1px solid var(--border)', color: 'var(--ink-soft)' }}>
              TIME SLOT
            </div>
            {DAYS.map(day => (
              <div key={day} style={{ padding: '10px', textAlign: 'center', borderRight: '1px solid var(--border)', color: 'var(--ink)' }}>
                {day.slice(0, 3).toUpperCase()}
              </div>
            ))}
          </div>

          {/* Rows: Standard slots */}
          {STANDARD_SLOTS.map((slot) => (
            <div
              key={slot.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px repeat(6, 1fr)',
                borderBottom: '1px solid var(--border-soft)',
                fontSize: '11px'
              }}
            >
              {/* Slot time label */}
              <div style={{
                padding: '12px 10px',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--ink-soft)',
                borderRight: '1px solid var(--border)',
                backgroundColor: 'var(--card)',
                display: 'flex',
                alignItems: 'center'
              }}>
                {slot.label}
              </div>

              {/* Day cells */}
              {DAYS.map(day => {
                const info = getSlotStatus(day, slot);
                return (
                  <div
                    key={day}
                    style={{
                      padding: '8px 4px',
                      borderRight: '1px solid var(--border-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: info.bg,
                      transition: 'background-color 0.15s'
                    }}
                  >
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: info.color,
                      textAlign: 'center',
                      lineHeight: 1.2
                    }}>
                      {info.status === 'free' ? '🌟 Mutual Free' : info.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Actions: WhatsApp Invite & Summary */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--paper)',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'var(--wash-moss)',
              color: 'var(--moss-text)',
              padding: '3px 8px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700
            }}>
              <CheckCircle2 size={13} />
              {mutualFreeSlots.length} Mutual Free Windows Found
            </span>
            <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
              Ready for group case prep, presentations, or project syncs
            </span>
          </div>

          <button
            onClick={handleCopyReport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'var(--ink)',
              color: 'var(--paper)',
              border: 'none',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            {copiedSchedule ? <Check size={14} color="var(--mizu)" /> : <Share2 size={14} />}
            <span>{copiedSchedule ? 'Invite Copied!' : 'Copy WhatsApp Group Invite'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
