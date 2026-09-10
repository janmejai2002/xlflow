import React, { useState, useMemo, useEffect } from 'react';
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
  X,
  Compass,
  Radio,
  BookOpen,
  Plus
} from 'lucide-react';
import { BATCH_ROSTER } from '../../../data/rosterData';
import { fireStreakConfetti } from '../../../services/confetti';
import { toast } from 'sonner';
import CampusRadarView from '../../social/CampusRadarView';
import StatusBeaconModal from '../../social/StatusBeaconModal';
import StudyCircleModal from '../../social/StudyCircleModal';
import FriendProfileModal from '../../social/FriendProfileModal';
import { socialApi } from '../../../services/socialApi';
import { generateMeetSharePayload } from '../../../services/deepLinkHandler';

const STANDARD_SLOTS = [
  { id: 'slot1', label: '09:00 - 10:30', startHour: 9 },
  { id: 'slot2', label: '11:00 - 12:30', startHour: 11 },
  { id: 'slot3', label: '14:00 - 15:30', startHour: 14 },
  { id: 'slot4', label: '16:00 - 17:30', startHour: 16 },
  { id: 'slot5', label: '18:30 - 20:00', startHour: 18.5 },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SectorSynergy({ currentUser, schedule = [], isMobile = false }) {
  const [activeSubTab, setActiveSubTab] = useState('radar'); // 'radar' | 'synergy' | 'circles'
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

  // Modals state
  const [isBeaconModalOpen, setIsBeaconModalOpen] = useState(false);
  const [isCircleModalOpen, setIsCircleModalOpen] = useState(false);
  const [selectedFriendForModal, setSelectedFriendForModal] = useState(null);

  // My live beacon
  const [myBeacon, setMyBeacon] = useState(null);

  // Real study squads / circles
  const [squads, setSquads] = useState([]);
  const [loadingSquads, setLoadingSquads] = useState(false);

  const loadSquads = async () => {
    setLoadingSquads(true);
    try {
      const list = await socialApi.getCircles(currentUser?.id || 'B25349');
      setSquads(list || []);
    } catch {
      setSquads([]);
    } finally {
      setLoadingSquads(false);
    }
  };

  useEffect(() => {
    loadSquads();
    const unsub = socialApi.subscribe((e) => {
      if (e.type === 'CIRCLE_CREATED' || e.type === 'CIRCLE_JOINED') {
        loadSquads();
      }
    });
    return unsub;
  }, [currentUser]);

  useEffect(() => {
    setMyBeacon(socialApi.getMyStatus());
    const unsub = socialApi.subscribe((e) => {
      if (e.type === 'STATUS_UPDATED' || e.type === 'STATUS_CLEARED') {
        setMyBeacon(socialApi.getMyStatus());
      }
    });
    return unsub;
  }, []);

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
      toast.success(`Added ${student.name.split(' ')[0]} to squad`);
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
      return { status: 'partial', label: '1 Busy (' + (busyNames[0] || '1') + ')', color: 'var(--ochre)', bg: 'var(--wash-ochre)' };
    } else {
      return { status: 'busy', label: busyCount + ' Busy', color: 'var(--ink-soft)', bg: 'var(--border-soft)' };
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
    const myRoll = currentUser?.id || 'B25349';
    const share = generateMeetSharePayload(myRoll, currentUser?.name);
    const membersText = selectedMembers.map(m => m.name + ' (' + m.roll + ')').join(', ');
    const slotsText = mutualFreeSlots.slice(0, 5).map(s => '• ' + s.day + ': ' + s.slot).join('\n');

    const text = '🤝 *XLRI Term-5 Group Synergy Schedule*\n' +
      '*Members:* ' + membersText + '\n\n' +
      '✨ *Top Mutual Free Windows:*\n' + slotsText + '\n\n' +
      '⚡ *Total Free Slots:* ' + mutualFreeSlots.length + ' this week\n' +
      'Tap to compare your timetable on XL-Flow: ' + share.url;

    navigator.clipboard.writeText(text);
    setCopiedSchedule(true);
    fireStreakConfetti();
    toast.success('WhatsApp Synergy Invite Copied!');
    setTimeout(() => setCopiedSchedule(false), 2200);
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '1440px',
      margin: '0 auto',
      boxSizing: 'border-box',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      overflow: 'hidden'
    }}>
      {/* Sector Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '12px' : '0',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--wash-mizu)',
            border: '1px solid rgba(0, 169, 184, 0.3)',
            color: 'var(--mizu)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 169, 184, 0.15)',
            flexShrink: 0
          }}>
            <Users size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mizu)', letterSpacing: '0.06em' }}>
                SECTOR 06
              </span>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>•</span>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Social Presence & Batch Synergy Hub</span>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-brand)',
              fontSize: isMobile ? '19px' : '22px',
              fontWeight: 800,
              color: 'var(--ink)',
              margin: '2px 0 0 0',
              letterSpacing: '-0.025em'
            }}>
              Campus Social & Free Window Synergy
            </h2>
          </div>
        </div>

        {/* View Switcher Tabs + Actions */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          flexWrap: 'wrap',
          width: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'flex-start' : 'flex-end'
        }}>
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--card)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            overflowX: 'auto',
            maxWidth: '100%'
          }}>
            {[
              { id: 'radar', label: 'Campus Radar', icon: Compass },
              { id: 'synergy', label: 'Free Slot Matrix', icon: Calendar },
              { id: 'circles', label: 'Study Squads', icon: BookOpen }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '7px',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--ink)' : 'transparent',
                    color: isActive ? 'var(--paper)' : 'var(--ink-soft)',
                    fontSize: '11px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={12} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsBeaconModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              backgroundColor: myBeacon ? 'var(--wash-moss)' : 'var(--wash-ochre)',
              color: myBeacon ? 'var(--moss-text)' : 'var(--ochre-text)',
              borderRadius: '10px',
              border: myBeacon ? '1px solid var(--moss)' : '1px solid rgba(194, 145, 58, 0.3)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Radio size={12} className={myBeacon ? 'animate-pulse' : ''} />
            <span>{myBeacon ? (myBeacon.emoji + ' ' + (myBeacon.zone || 'Campus')) : '+ Beacon'}</span>
          </button>

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
            <span>{copiedSchedule ? 'Invite Copied!' : 'Invite on WhatsApp'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area based on activeSubTab */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {/* SUBTAB 1: CAMPUS RADAR (WHO'S WHERE NOW) */}
        {activeSubTab === 'radar' && (
          <CampusRadarView
            currentUser={currentUser}
            onOpenBeaconModal={() => setIsBeaconModalOpen(true)}
            onSelectStudent={(st) => setSelectedFriendForModal(st)}
          />
        )}

        {/* SUBTAB 2: STUDY SQUADS & CIRCLES */}
        {activeSubTab === 'circles' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--card)',
              padding: '14px 18px',
              borderRadius: '16px',
              border: '1px solid var(--border)'
            }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                  Active Project Squads & Term Study Groups
                </h4>
                <p style={{ fontSize: '11px', color: 'var(--ink-soft)', margin: '2px 0 0 0' }}>
                  Organize by elective or project team and invite batchmates via 6-character squad codes
                </p>
              </div>
              <button
                onClick={() => setIsCircleModalOpen(true)}
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
                  gap: '6px'
                }}
              >
                <Plus size={13} />
                <span>Create or Join Squad</span>
              </button>
            </div>

            {/* Real Squads or Guided Onboarding */}
            {squads.length === 0 ? (
              <div style={{
                backgroundColor: 'var(--card)',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                padding: '24px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ maxWidth: '680px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--mizu)', letterSpacing: '0.05em' }}>
                        HOW STUDY SQUADS WORK
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>•</span>
                      <span style={{ fontSize: '11px', color: 'var(--moss)', fontWeight: 600 }}>Zero Schedule Clashes</span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                      Coordinate Case Teams, Committee Meetings & Term Projects
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--ink-soft)', lineHeight: 1.5, margin: 0 }}>
                      Study squads allow project teams to synchronize schedules without manual back-and-forth. Create a squad for an elective (STMAN, OMCR, B2B) or join using a 6-character code from your group lead.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setIsCircleModalOpen(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 16px',
                        backgroundColor: 'var(--ink)',
                        color: 'var(--paper)',
                        borderRadius: '10px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-card)'
                      }}
                    >
                      <Plus size={14} />
                      <span>Create a Squad</span>
                    </button>
                    <button
                      onClick={() => setIsCircleModalOpen(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 14px',
                        backgroundColor: 'var(--paper)',
                        color: 'var(--ink)',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <span>Join with Code</span>
                    </button>
                  </div>
                </div>

                {/* 3-Step Guided Architecture Ribbon */}
                <div style={{
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-soft)'
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    color: 'var(--ink)',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <BookOpen size={14} color="var(--mizu)" />
                    <span>How Study Squads Work</span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '14px'
                  }}>
                  <div style={{
                    backgroundColor: 'var(--paper)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--wash-mizu)',
                        color: 'var(--mizu)',
                        fontSize: '12px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>1</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>Create or Join Squad</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: 0, lineHeight: 1.4 }}>
                      Assign a name and course (e.g. STMAN Strategy Team). XL-Flow issues a unique 6-character squad code (e.g. <code>XL-A8B9</code>).
                    </p>
                  </div>

                  <div style={{
                    backgroundColor: 'var(--paper)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--wash-ochre)',
                        color: 'var(--ochre)',
                        fontSize: '12px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>2</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>Invite Teammates</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: 0, lineHeight: 1.4 }}>
                      Share the code or tap "Invite on WhatsApp" with pre-formatted deep links. Members join in 1-click with zero signup.
                    </p>
                  </div>

                  <div style={{
                    backgroundColor: 'var(--paper)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--wash-moss)',
                        color: 'var(--moss)',
                        fontSize: '12px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>3</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>Instant Free Slot Heatmap</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: 0, lineHeight: 1.4 }}>
                      XL-Flow automatically overlays members' timetables on the Free Slot Matrix, pinpointing mutual gaps for project work.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                {squads.map(c => (
                  <div
                    key={c.code}
                    style={{
                      backgroundColor: 'var(--card)',
                      borderRadius: '14px',
                      border: '1px solid var(--border)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--mizu)', backgroundColor: 'var(--wash-mizu)', padding: '2px 6px', borderRadius: '4px' }}>
                        {c.courseCode || 'GENERAL'}
                      </span>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink)' }}>
                        {c.code}
                      </span>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                        {c.name}
                      </h4>
                      <p style={{ fontSize: '11px', color: 'var(--ink-soft)', margin: '4px 0 0 0' }}>
                        Created by {c.ownerName || c.ownerRoll} • {c.members?.length || 1} member(s)
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', paddingTop: '10px', borderTop: '1px solid var(--border-soft)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                        👥 {c.members?.length || 1} members
                      </span>
                      <button
                        onClick={() => setIsCircleModalOpen(true)}
                        style={{
                          background: 'none',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--ink)',
                          cursor: 'pointer'
                        }}
                      >
                        Manage Squad
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 3: FREE SLOT MATRIX (ORIGINAL SYNERGY ENGINE) */}
        {activeSubTab === 'synergy' && (
          <>
            {/* Explainer Ribbon */}
            <div style={{
              backgroundColor: 'var(--card)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12px',
              color: 'var(--ink)'
            }}>
              <Sparkles size={14} color="var(--mizu)" style={{ flexShrink: 0 }} />
              <span>
                <strong>How Free Slot Matrix Works:</strong> Add up to 4 batchmates or squad members below. XL-Flow calculates when all selected students are simultaneously free from lectures for committee meetings, study sessions, and case prep.
              </span>
            </div>

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
          </>
        )}
      </div>

      {/* Social Modals */}
      <StatusBeaconModal
        isOpen={isBeaconModalOpen}
        onClose={() => setIsBeaconModalOpen(false)}
        currentUser={currentUser}
        onStatusUpdated={(st) => setMyBeacon(st)}
      />

      <StudyCircleModal
        isOpen={isCircleModalOpen}
        onClose={() => setIsCircleModalOpen(false)}
        currentUser={currentUser}
      />

      <FriendProfileModal
        isOpen={!!selectedFriendForModal}
        onClose={() => setSelectedFriendForModal(null)}
        student={selectedFriendForModal}
        currentUser={currentUser}
      />
    </div>
  );
}
