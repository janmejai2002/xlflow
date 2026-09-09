import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Check,
  Calendar,
  Clock,
  Copy,
  Sparkles,
  Share2,
  CheckCircle2,
  X
} from 'lucide-react';
import { BATCH_ROSTER } from '../../../data/rosterData';
import { fireStreakConfetti } from '../../../services/confetti';
import { toast } from 'sonner';

const STANDARD_SLOTS = [
  { id: 'slot1', label: '09:00 - 10:30', startHour: 9 },
  { id: 'slot2', label: '11:00 - 12:30', startHour: 11 },
  { id: 'slot3', label: '14:00 - 15:30', startHour: 14 },
  { id: 'slot4', label: '16:00 - 17:30', startHour: 16 },
  { id: 'slot5', label: '18:30 - 20:00', startHour: 18.5 },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SectorSynergy({ currentUser, schedule = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedMembers, setSelectedMembers] = useState(() => [
    {
      roll: currentUser?.id || 'B25349',
      name: currentUser?.name || 'Janmejai Singh',
      section: 'E'
    }
  ]);
  const [copiedSchedule, setCopiedSchedule] = useState(false);

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
        toast('Keep at least 1 member in group');
        return;
      }
      setSelectedMembers(prev => prev.filter(m => m.roll !== student.roll));
    } else {
      if (selectedMembers.length >= 4) {
        toast.error('Maximum 4 members for synergy calculation');
        return;
      }
      setSelectedMembers(prev => [...prev, student]);
      toast.success(`Added ${student.name}`);
    }
  };

  const getSlotStatus = (day, slot) => {
    let busyCount = 0;
    const busyNames = [];

    selectedMembers.forEach((member) => {
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
      `✨ *Top Mutual Free Windows:*\n${slotsText}\n\n` +
      `⚡ *Total Free Slots:* ${mutualFreeSlots.length} this week\n` +
      `_Generated via XL-Flow Horizon Deck_`;

    navigator.clipboard.writeText(text);
    setCopiedSchedule(true);
    fireStreakConfetti();
    toast.success('Synergy WhatsApp Invite Copied!');
    setTimeout(() => setCopiedSchedule(false), 2200);
  };

  return (
    <div style={{
      width: '1150px',
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
            backgroundColor: 'var(--ink)',
            color: 'var(--mizu)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mizu)', letterSpacing: '0.06em' }}>
                SECTOR 06
              </span>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>•</span>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>178 Roster Overlap & Free Window Finder</span>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '22px',
              fontWeight: 600,
              color: 'var(--ink)',
              margin: '2px 0 0 0',
              letterSpacing: '-0.02em'
            }}>
              Batch Synergy & Group Free Slot Matrix
            </h2>
          </div>
        </div>

        <button
          onClick={handleCopyReport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            backgroundColor: 'var(--ink)',
            color: 'var(--paper)',
            borderRadius: '10px',
            border: 'none',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          {copiedSchedule ? <Check size={14} color="var(--mizu)" /> : <Share2 size={14} />}
          <span>{copiedSchedule ? 'Invite Copied!' : 'Copy WhatsApp Invite'}</span>
        </button>
      </div>

      {/* Main Grid: Controls + Overlap Matrix */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {/* Member Selector Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '14px',
          backgroundColor: 'var(--card)',
          padding: '14px 18px',
          borderRadius: '14px',
          border: '1px solid var(--border)'
        }}>
          {/* Active Members */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-soft)', marginBottom: '8px' }}>
              COLLABORATION SQUAD ({selectedMembers.length}/4)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedMembers.map(m => (
                <div
                  key={m.roll}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    backgroundColor: 'var(--paper)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--ink)'
                  }}
                >
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--mizu)', backgroundColor: 'var(--wash-mizu)', padding: '1px 5px', borderRadius: '4px' }}>
                    Sec {m.section}
                  </span>
                  <span>{m.name}</span>
                  <button
                    onClick={() => handleToggleMember(m)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px', color: 'var(--ink-soft)' }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Search + Section Filter */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-soft)', marginBottom: '8px' }}>
              ADD FROM 178 BATCH ROSTER
            </div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--paper)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '5px 10px'
              }}>
                <Search size={13} color="var(--ink-soft)" />
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

              {['all', 'E', 'F', 'G'].map(sec => (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(sec)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: selectedSection === sec ? '1px solid var(--ink)' : '1px solid var(--border)',
                    backgroundColor: selectedSection === sec ? 'var(--ink)' : 'var(--paper)',
                    color: selectedSection === sec ? 'var(--paper)' : 'var(--ink)',
                    cursor: 'pointer'
                  }}
                >
                  {sec.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Suggestions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '56px', overflowY: 'auto' }}>
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
                      backgroundColor: isSelected ? 'var(--wash-moss)' : 'var(--paper)',
                      color: isSelected ? 'var(--moss-text)' : 'var(--ink)',
                      cursor: 'pointer'
                    }}
                  >
                    {s.name} ({s.section}) {isSelected ? '✓' : '+'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Matrix Grid */}
        <div style={{
          backgroundColor: 'var(--card)',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '120px repeat(6, 1fr)',
            backgroundColor: 'var(--card-hover)',
            borderBottom: '1px solid var(--border)',
            fontWeight: 700,
            fontSize: '11px'
          }}>
            <div style={{ padding: '10px 12px', borderRight: '1px solid var(--border)', color: 'var(--ink-soft)' }}>
              SLOT TIME
            </div>
            {DAYS.map(day => (
              <div key={day} style={{ padding: '10px', textAlign: 'center', borderRight: '1px solid var(--border)', color: 'var(--ink)' }}>
                {day.slice(0, 3).toUpperCase()}
              </div>
            ))}
          </div>

          {STANDARD_SLOTS.map(slot => (
            <div
              key={slot.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px repeat(6, 1fr)',
                borderBottom: '1px solid var(--border-soft)',
                fontSize: '11px'
              }}
            >
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
                      backgroundColor: info.bg
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
      </div>
    </div>
  );
}
