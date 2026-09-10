import React, { useState, useMemo } from 'react';
import {
  Users,
  Sparkles,
  Search,
  CheckCircle2,
  ArrowRight,
  X,
  Calendar,
  Compass
} from 'lucide-react';
import { ROSTER, BATCH_ROSTER } from '../../data/rosterData';
import { socialApi } from '../../services/socialApi';
import { clearDeepLinkParams } from '../../services/deepLinkHandler';
import { fireStreakConfetti } from '../../services/confetti';
import { toast } from 'sonner';

export default function InviteWelcomeModal({ isOpen, onClose, deepLinkData, onIdentitySelected }) {
  if (!isOpen || !deepLinkData?.hasLink) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');

  const rosterList = useMemo(() => {
    return Object.entries(BATCH_ROSTER).map(([roll, data]) => ({
      roll,
      name: data.n,
      section: data.s
    }));
  }, []);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim() && selectedSection === 'all') {
      return rosterList.slice(0, 12);
    }
    return rosterList.filter(item => {
      const matchQuery = !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.roll.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSec = selectedSection === 'all' || item.section === selectedSection;
      return matchQuery && matchSec;
    }).slice(0, 20);
  }, [rosterList, searchQuery, selectedSection]);

  const handleSelectStudent = async (student) => {
    fireStreakConfetti();
    toast.success('Welcome, ' + student.name + '!');

    // If join link, auto-join circle
    if (deepLinkData.type === 'join' && deepLinkData.circleCode) {
      try {
        await socialApi.joinCircle({
          code: deepLinkData.circleCode,
          rollNo: student.roll,
          name: student.name
        });
        toast.success('Joined Squad ' + deepLinkData.circleCode + '!');
      } catch {}
    }

    // If meet link, add inviter as friend
    if (deepLinkData.type === 'meet' && deepLinkData.inviterRoll) {
      try {
        await socialApi.toggleFriend(student.roll, deepLinkData.inviterRoll);
      } catch {}
    }

    clearDeepLinkParams();
    if (onIdentitySelected) {
      onIdentitySelected(student, deepLinkData);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 10000,
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
          borderRadius: '24px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card), 0 30px 60px -15px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Hero */}
        <div style={{
          padding: '24px 24px 20px',
          background: 'linear-gradient(135deg, var(--wash-mizu) 0%, var(--wash-ochre) 100%)',
          borderBottom: '1px solid var(--border)',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.4)',
              border: 'none',
              borderRadius: '50%',
              padding: '6px',
              cursor: 'pointer',
              color: 'var(--ink)'
            }}
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={16} color="var(--ochre)" />
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              XL-Flow Social Invite
            </span>
          </div>

          {deepLinkData.type === 'meet' ? (
            <div>
              <h3 style={{
                fontFamily: 'var(--font-brand)',
                fontSize: '22px',
                fontWeight: 800,
                color: 'var(--ink)',
                margin: 0,
                lineHeight: 1.25
              }}>
                {deepLinkData.inviterName || 'A classmate'} wants to compare free slots!
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: '6px 0 0 0' }}>
                Inviter: <b>{deepLinkData.inviterRoll}</b> (Sec {deepLinkData.inviterSection || 'E'}). Find when both of you are free without sharing raw timetable screenshots.
              </p>
            </div>
          ) : deepLinkData.type === 'join' ? (
            <div>
              <h3 style={{
                fontFamily: 'var(--font-brand)',
                fontSize: '22px',
                fontWeight: 800,
                color: 'var(--ink)',
                margin: 0,
                lineHeight: 1.25
              }}>
                Join Study Squad: {deepLinkData.circleCode}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: '6px 0 0 0' }}>
                You were invited to collaborate with your project group on XL-Flow.
              </p>
            </div>
          ) : (
            <div>
              <h3 style={{ fontFamily: 'var(--font-brand)', fontSize: '22px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                Campus Radar Broadcast
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: '6px 0 0 0' }}>
                Viewing live hotspot: <b>{deepLinkData.zone?.toUpperCase()}</b>
              </p>
            </div>
          )}
        </div>

        {/* Identity Selector Section */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-soft)', letterSpacing: '0.04em' }}>
              TAP YOUR NAME FROM THE 178 BATCH ROSTER
            </label>
            <p style={{ fontSize: '11px', color: 'var(--ink-soft)', margin: '2px 0 8px 0' }}>
              Zero password entry required — tap to jump in instantly.
            </p>

            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--paper)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '6px 12px'
              }}>
                <Search size={14} color="var(--ink-soft)" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your name or roll number..."
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
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '8px',
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

            {/* Student List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
              {filteredStudents.map(s => (
                <div
                  key={s.roll}
                  onClick={() => handleSelectStudent(s)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--paper)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--mizu)';
                    e.currentTarget.style.backgroundColor = 'var(--card-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.backgroundColor = 'var(--paper)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--wash-mizu)',
                      color: 'var(--mizu)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '13px'
                    }}>
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
                        {s.roll} • Section {s.section}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--mizu)', fontSize: '11px', fontWeight: 700 }}>
                    <span>Select</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
