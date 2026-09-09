import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  Plus,
  Check,
  Calendar,
  Sparkles
} from 'lucide-react';
import { COURSE_COLORS } from '../../../data/rosterData';
import { fireStreakConfetti } from '../../../services/confetti';
import { toast } from 'sonner';

export default function SectorDeadlines({ initialDeadlines = [], courses = [] }) {
  const [deadlines, setDeadlines] = useState(initialDeadlines);
  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState(courses[0]?.code || 'OMCR');

  const handleToggleCompleted = (id) => {
    setDeadlines(prev => prev.map(d => {
      if (d.id === id) {
        const next = !d.completed;
        if (next) {
          fireStreakConfetti();
          toast.success('Assignment Marked Complete! 🎉');
        }
        return { ...d, completed: next };
      }
      return d;
    }));
  };

  const handleAddDeadline = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem = {
      id: `dl_${Date.now()}`,
      courseCode: newCourse,
      title: newTitle.trim(),
      type: 'Assignment',
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      completed: false
    };

    setDeadlines(prev => [newItem, ...prev]);
    setNewTitle('');
    toast.success('Deliverable Added to Pipeline');
  };

  const pending = deadlines.filter(d => !d.completed);
  const completed = deadlines.filter(d => d.completed);

  return (
    <div style={{
      width: '1060px',
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
            background: 'var(--wash-mizu)',
            border: '1px solid rgba(0, 169, 184, 0.3)',
            color: 'var(--mizu)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 169, 184, 0.15)'
          }}>
            <CheckSquare size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mizu)', letterSpacing: '0.06em' }}>
                SECTOR 05
              </span>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>•</span>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Midterm Quotas & Deliverables Flight Deck</span>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--ink)',
              margin: '2px 0 0 0',
              letterSpacing: '-0.025em'
            }}>
              Deadlines, Quizzes & Case Pipeline
            </h2>
          </div>
        </div>

        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          color: pending.length > 0 ? 'var(--ochre-text)' : 'var(--moss-text)',
          backgroundColor: pending.length > 0 ? 'var(--wash-ochre)' : 'var(--wash-moss)',
          padding: '4px 10px',
          borderRadius: '8px'
        }}>
          {pending.length} Deliverables Pending
        </span>
      </div>

      {/* Quick Add Form */}
      <form
        onSubmit={handleAddDeadline}
        style={{
          display: 'flex',
          gap: '8px',
          backgroundColor: 'var(--card)',
          padding: '10px 14px',
          borderRadius: '12px',
          border: '1px solid var(--border)'
        }}
      >
        <select
          value={newCourse}
          onChange={(e) => setNewCourse(e.target.value)}
          style={{
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--ink)'
          }}
        >
          {courses.map(c => (
            <option key={c.code} value={c.code}>{c.code}</option>
          ))}
        </select>

        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add assignment, case brief, or quiz date..."
          style={{
            flex: 1,
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '12px',
            color: 'var(--ink)',
            outline: 'none'
          }}
        />

        <button
          type="submit"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--ink)',
            color: 'var(--paper)',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Plus size={14} />
          <span>Add Task</span>
        </button>
      </form>

      {/* 2-Column Board: Active Pipeline vs Completed */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: '16px'
      }}>
        {/* Active Column */}
        <div style={{
          backgroundColor: 'var(--card)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-soft)' }}>
            ACTIVE DELIVERABLES ({pending.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
            {pending.map(d => {
              const colors = COURSE_COLORS[d.courseCode] || { accent: '#4E6E9C' };
              const isUrgent = new Date(d.dueDate).getTime() - Date.now() < 48 * 3600 * 1000;

              return (
                <div
                  key={d.id}
                  style={{
                    backgroundColor: 'var(--paper)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={d.completed}
                      onChange={() => handleToggleCompleted(d.id)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--moss)' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: colors.accent,
                          backgroundColor: 'var(--card)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          border: '1px solid var(--border)'
                        }}>
                          {d.courseCode}
                        </span>
                        {isUrgent && (
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            color: 'var(--hanko)',
                            backgroundColor: 'var(--wash-hanko)',
                            padding: '1px 5px',
                            borderRadius: '4px'
                          }}>
                            URGENT
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                        {d.title}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--ink-soft)'
                  }}>
                    {d.dueDate?.slice(0, 10)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Completed Column */}
        <div style={{
          backgroundColor: 'var(--card)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-soft)' }}>
            COMPLETED DELIVERABLES ({completed.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
            {completed.map(d => (
              <div
                key={d.id}
                style={{
                  backgroundColor: 'var(--paper)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: 0.7
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={d.completed}
                    onChange={() => handleToggleCompleted(d.id)}
                    style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: 'var(--moss)' }}
                  />
                  <span style={{ fontSize: '12px', textDecoration: 'line-through', color: 'var(--ink-soft)' }}>
                    {d.title}
                  </span>
                </div>
                <Check size={14} color="var(--moss)" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
