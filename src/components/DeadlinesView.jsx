import React, { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { filterCurrentDeadlines } from '../services/academicTerm';
import { playTactileClick } from '../services/soundEngine';
import {
  IconDeadlines,
  IconCheckmark,
  IconCross,
  IconChronometer
} from './icons';

const DEADLINES_STORAGE_KEY = 'xlflow_user_deadlines';

/**
 * DeadlinesView: 2026 Academic Submission Ledger
 *
 * Replaces generic to-do checkboxes with an authoritative academic submission docket:
 * - Hairline-separated docket entries
 * - Tabular due dates with countdown badge (OVERDUE, DUE TODAY, DUE IN 2D) using Japanese .hanko-stamp
 * - Tactile mechanical button check toggling
 * - Sovereign local storage persistence
 */
export default function DeadlinesView({ initialDeadlines = [], courses = [], schedule = [] }) {
  const [deadlines, setDeadlines] = useState(() => {
    const saved = localStorage.getItem(DEADLINES_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const own = parsed.filter((d) => String(d.id || '').startsWith('custom-'));
        const fromErp = filterCurrentDeadlines(
          parsed.filter((d) => !String(d.id || '').startsWith('custom-')),
          courses,
          schedule
        );
        return [...fromErp, ...own];
      } catch (e) {}
    }
    return initialDeadlines;
  });

  const [filter, setFilter] = useState('pending'); // 'pending' | 'urgent' | 'completed' | 'all'
  const [showAddForm, setShowAddForm] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState(courses[0]?.code || 'OMCR');
  const [newType, setNewType] = useState('Case Submission');
  const [newDueDate, setNewDueDate] = useState('');

  // Persist to localStorage whenever deadlines change
  useEffect(() => {
    localStorage.setItem(DEADLINES_STORAGE_KEY, JSON.stringify(deadlines));
  }, [deadlines]);

  const toggleTask = (id) => {
    playTactileClick(600);
    setDeadlines((prev) => prev.map((d) => (d.id === id ? { ...d, completed: !d.completed } : d)));
  };

  const deleteTask = (id) => {
    playTactileClick(400);
    setDeadlines((prev) => prev.filter((d) => d.id !== id));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    playTactileClick(650);
    const newTask = {
      id: `custom-${Date.now()}`,
      courseCode: newCourse,
      title: newTitle.trim(),
      type: newType,
      dueDate: newDueDate || new Date(Date.now() + 86400000 * 2).toISOString(),
      completed: false,
      isCustom: true
    };

    setDeadlines([newTask, ...deadlines]);
    setNewTitle('');
    setShowAddForm(false);
  };

  // Format due date and compute urgency countdown
  const getDueInfo = (dateStr) => {
    try {
      const due = new Date(dateStr);
      const now = new Date();
      const diffMs = due.getTime() - now.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHrs / 24);

      let urgency = 'normal';
      let stampText = '';

      if (diffMs < 0) {
        stampText = 'OVERDUE';
        urgency = 'urgent';
      } else if (diffDays === 0) {
        stampText = diffHrs <= 6 ? `DUE IN ${diffHrs}H` : 'DUE TODAY';
        urgency = 'urgent';
      } else if (diffDays === 1) {
        stampText = 'DUE TOMORROW';
        urgency = 'warning';
      } else if (diffDays <= 4) {
        stampText = `DUE IN ${diffDays}D`;
        urgency = 'warning';
      } else {
        stampText = `IN ${diffDays}D`;
        urgency = 'normal';
      }

      return {
        stampText,
        urgency,
        formatted: due.toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    } catch (e) {
      return { stampText: 'UPCOMING', urgency: 'normal', formatted: dateStr };
    }
  };

  // Filter list
  const filteredDeadlines = useMemo(() => {
    return deadlines.filter((d) => {
      if (filter === 'pending') return !d.completed;
      if (filter === 'completed') return d.completed;
      if (filter === 'urgent') {
        if (d.completed) return false;
        const { urgency } = getDueInfo(d.dueDate);
        return urgency === 'urgent' || urgency === 'warning';
      }
      return true; // 'all'
    });
  }, [deadlines, filter]);

  const pendingCount = useMemo(() => deadlines.filter((d) => !d.completed).length, [deadlines]);
  const completedCount = useMemo(() => deadlines.filter((d) => d.completed).length, [deadlines]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '36px' }}>
      {/* Header with Add Task Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                fontWeight: 700,
                color: 'var(--plum)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}
            >
              ACADEMIC DELIVERABLES
            </span>
            <span style={{ fontSize: '11px', color: 'var(--border)' }}>·</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-faint)' }}>
              SUBMISSION LEDGER
            </span>
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '24px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--ink)',
              margin: 0
            }}
          >
            Deadlines & Quizzes
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '3px', margin: 0 }}>
            {pendingCount} pending submission{pendingCount === 1 ? '' : 's'} · {completedCount} archived
          </p>
        </div>

        <button
          className="btn-tactile"
          onClick={() => {
            playTactileClick(500);
            setShowAddForm(!showAddForm);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '4px',
            backgroundColor: 'var(--ink)',
            color: 'var(--paper)',
            border: '1px solid var(--ink)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            cursor: 'pointer'
          }}
        >
          <Plus size={13} />
          <span>{showAddForm ? 'CLOSE DOCKET' : 'ADD DEADLINE'}</span>
        </button>
      </div>

      {/* Add Task Drawer / Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddTask}
          className="editorial-slate"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconDeadlines size={16} color="var(--mizu)" />
            <h4
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--ink)',
                margin: 0
              }}
            >
              New Academic Deliverable Docket
            </h4>
          </div>

          <div>
            <label
              style={{
                fontSize: '10.5px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'var(--ink-soft)',
                display: 'block',
                marginBottom: '4px',
                textTransform: 'uppercase'
              }}
            >
              Activity Title / Deliverable Name
            </label>
            <input
              type="text"
              placeholder="e.g. Case Analysis Pre-Read, Quiz Prep, Committee Memo"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--paper)',
                color: 'var(--ink)',
                fontSize: '13px',
                fontFamily: 'var(--font-brand)',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label
                style={{
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: 'var(--ink-soft)',
                  display: 'block',
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}
              >
                Course
              </label>
              <select
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--paper)',
                  color: 'var(--ink)',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer'
                }}
              >
                {courses.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.name.slice(0, 16)}...)
                  </option>
                ))}
                <option value="GENERAL">GENERAL MBA</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: 'var(--ink-soft)',
                  display: 'block',
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}
              >
                Submission Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--paper)',
                  color: 'var(--ink)',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer'
                }}
              >
                <option value="Case Submission">Case Submission</option>
                <option value="Quiz">Quiz</option>
                <option value="Group Project">Group Project</option>
                <option value="Pre-read">Pre-read</option>
                <option value="Committee Work">Committee Work</option>
              </select>
            </div>
          </div>

          <div>
            <label
              style={{
                fontSize: '10.5px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'var(--ink-soft)',
                display: 'block',
                marginBottom: '4px',
                textTransform: 'uppercase'
              }}
            >
              Statutory Due Date & Time
            </label>
            <input
              type="datetime-local"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--paper)',
                color: 'var(--ink)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              className="btn-tactile"
              onClick={() => setShowAddForm(false)}
              style={{
                padding: '6px 14px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                backgroundColor: 'transparent',
                color: 'var(--ink-soft)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="btn-tactile"
              style={{
                padding: '6px 16px',
                borderRadius: '4px',
                backgroundColor: 'var(--mizu)',
                color: '#FFFFFF',
                border: '1px solid var(--mizu)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                cursor: 'pointer'
              }}
            >
              COMMIT DEADLINE
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        {[
          { id: 'pending', label: `PENDING (${pendingCount})` },
          { id: 'urgent', label: 'URGENT' },
          { id: 'completed', label: `COMPLETED (${completedCount})` },
          { id: 'all', label: 'ALL SUBMISSIONS' }
        ].map((tab) => (
          <button
            key={tab.id}
            className="btn-tactile"
            onClick={() => {
              playTactileClick(450);
              setFilter(tab.id);
            }}
            style={{
              padding: '5px 12px',
              borderRadius: '4px',
              border: filter === tab.id ? '1px solid var(--ink)' : '1px solid var(--border)',
              backgroundColor: filter === tab.id ? 'var(--ink)' : 'var(--card)',
              color: filter === tab.id ? 'var(--paper)' : 'var(--ink)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Academic Submission Ledger: Hairline-Separated Docket Entries */}
      <div
        className="editorial-slate"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {filteredDeadlines.map((task, i) => {
          const { stampText, urgency, formatted } = getDueInfo(task.dueDate);
          const isDone = task.completed;

          const stampColor = isDone
            ? 'var(--moss)'
            : urgency === 'urgent'
            ? 'var(--hanko)'
            : urgency === 'warning'
            ? 'var(--ochre)'
            : 'var(--indigo)';

          const stampWash = isDone
            ? 'var(--wash-moss)'
            : urgency === 'urgent'
            ? 'var(--wash-hanko)'
            : urgency === 'warning'
            ? 'var(--wash-ochre)'
            : 'transparent';

          return (
            <div
              key={task.id}
              style={{
                padding: '12px 16px',
                borderTop: i === 0 ? 'none' : '1px solid var(--border-soft)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                backgroundColor: isDone ? 'var(--paper-subtle)' : 'transparent',
                opacity: isDone ? 0.65 : 1,
                transition: 'opacity 0.2s ease'
              }}
            >
              {/* Tactile Architectural Checkbox */}
              <button
                className="btn-tactile"
                onClick={() => toggleTask(task.id)}
                aria-label={isDone ? `Mark ${task.title} as incomplete` : `Mark ${task.title} as complete`}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  marginTop: '2px',
                  flexShrink: 0
                }}
              >
                {isDone ? (
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '3px',
                      backgroundColor: 'var(--moss)',
                      border: '1px solid var(--moss)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <IconCheckmark size={12} color="#FFFFFF" strokeWidth={2.4} />
                  </div>
                ) : (
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '3px',
                      border: '1.5px solid var(--border-strong)',
                      backgroundColor: 'var(--paper)'
                    }}
                  />
                )}
              </button>

              {/* Task Details & Metadata */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginBottom: '3px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        backgroundColor: 'var(--wash-indigo)',
                        color: 'var(--indigo)'
                      }}
                    >
                      {task.courseCode}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--ink-faint)',
                        textTransform: 'uppercase'
                      }}
                    >
                      {task.type}
                    </span>
                  </div>

                  {/* Japanese Hanko Stamp Countdown Seal */}
                  <span
                    className="hanko-stamp"
                    style={{
                      color: stampColor,
                      borderColor: stampColor,
                      backgroundColor: stampWash
                    }}
                  >
                    {isDone ? <IconCheckmark size={10} color="var(--moss)" /> : <IconChronometer size={10} />}
                    <span>{isDone ? 'COMPLETED' : stampText}</span>
                  </span>
                </div>

                <h4
                  style={{
                    fontFamily: 'var(--font-brand)',
                    fontSize: '14.5px',
                    fontWeight: 700,
                    letterSpacing: '-0.015em',
                    color: isDone ? 'var(--ink-faint)' : 'var(--ink)',
                    margin: '0 0 5px 0',
                    lineHeight: 1.3,
                    textDecoration: isDone ? 'line-through' : 'none'
                  }}
                >
                  {task.title}
                </h4>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'var(--font-mono)',
                    fontFeatureSettings: '"tnum"',
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: '11px',
                    color: 'var(--ink-soft)'
                  }}
                >
                  <span
                    style={{
                      color: 'var(--ink-faint)',
                      textTransform: 'uppercase',
                      fontSize: '10px',
                      fontWeight: 700
                    }}
                  >
                    Due:
                  </span>
                  <span>{formatted}</span>
                </div>
              </div>

              {/* Delete Button for Custom Tasks */}
              {task.isCustom && (
                <button
                  className="btn-tactile"
                  onClick={() => deleteTask(task.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ink-faint)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '3px',
                    flexShrink: 0
                  }}
                  title="Delete custom deadline"
                >
                  <IconCross size={14} />
                </button>
              )}
            </div>
          );
        })}

        {filteredDeadlines.length === 0 && (
          <div
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--card)'
            }}
          >
            <IconCheckmark size={24} color="var(--moss)" style={{ margin: '0 auto 8px auto' }} />
            <h4
              style={{
                fontFamily: 'var(--font-brand)',
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--ink)',
                margin: '0 0 4px 0'
              }}
            >
              No Deadlines in Active Ledger
            </h4>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '14px',
                color: 'var(--ink-soft)',
                margin: 0
              }}
            >
              All academic submissions satisfied. You are completely ahead of schedule.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
