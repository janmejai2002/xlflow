import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, AlertCircle, Clock, Plus, Trash2, Calendar, Tag, Check } from 'lucide-react';
import { filterCurrentDeadlines } from '../services/academicTerm';

const DEADLINES_STORAGE_KEY = 'xlflow_user_deadlines';

export default function DeadlinesView({ initialDeadlines = [], courses = [], schedule = [] }) {
  const [deadlines, setDeadlines] = useState(() => {
    const saved = localStorage.getItem(DEADLINES_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // This list was persisted before previous-term activities were filtered
        // out, so a returning student still has last term's quizzes saved here.
        // Tasks the student added themselves are theirs to keep, however old.
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
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, completed: !d.completed } : d));
  };

  const deleteTask = (id) => {
    setDeadlines(prev => prev.filter(d => d.id !== id));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

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

  // Helper to format due date and urgency
  const getDueInfo = (dateStr) => {
    try {
      const due = new Date(dateStr);
      const now = new Date();
      const diffMs = due.getTime() - now.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHrs / 24);

      let urgency = 'normal';
      let text = '';

      if (diffMs < 0) {
        text = 'Overdue';
        urgency = 'urgent';
      } else if (diffDays === 0) {
        text = diffHrs <= 6 ? `Due in ${diffHrs}h (Urgent)` : `Due today at ${due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        urgency = 'urgent';
      } else if (diffDays === 1) {
        text = 'Due tomorrow';
        urgency = 'warning';
      } else if (diffDays <= 4) {
        text = `Due in ${diffDays} days`;
        urgency = 'warning';
      } else {
        text = due.toLocaleDateString([], { month: 'short', day: 'numeric' });
        urgency = 'normal';
      }

      return { text, urgency, formatted: due.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) };
    } catch (e) {
      return { text: 'Upcoming', urgency: 'normal', formatted: dateStr };
    }
  };

  // Filter list
  const filteredDeadlines = deadlines.filter(d => {
    if (filter === 'pending') return !d.completed;
    if (filter === 'completed') return d.completed;
    if (filter === 'urgent') {
      if (d.completed) return false;
      const { urgency } = getDueInfo(d.dueDate);
      return urgency === 'urgent' || urgency === 'warning';
    }
    return true; // 'all'
  });

  const pendingCount = deadlines.filter(d => !d.completed).length;
  const completedCount = deadlines.filter(d => d.completed).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>
      
      {/* Header with Add Button */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '24px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--ink)'
          }}>
            Deadlines & Quizzes
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '2px' }}>
            {pendingCount} pending task{pendingCount === 1 ? '' : 's'} • {completedCount} completed
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '10px',
            backgroundColor: 'var(--ink)',
            color: 'var(--paper)',
            border: 'none',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <Plus size={14} />
          <span>Add Task</span>
        </button>
      </div>

      {/* Add Task Drawer / Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddTask}
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '16px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
            New Academic Deadline
          </h4>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>
              Title / Activity Name
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
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--paper)',
                color: 'var(--ink)',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>
                Course
              </label>
              <select
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--paper)',
                  color: 'var(--ink)',
                  fontSize: '12px'
                }}
              >
                {courses.map(c => (
                  <option key={c.code} value={c.code}>{c.code} ({c.name.slice(0, 14)}...)</option>
                ))}
                <option value="GENERAL">General MBA</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>
                Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--paper)',
                  color: 'var(--ink)',
                  fontSize: '12px'
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
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>
              Due Date & Time
            </label>
            <input
              type="datetime-local"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--paper)',
                color: 'var(--ink)',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'transparent',
                color: 'var(--ink-soft)',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--mizu)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Save Deadline
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { id: 'pending', label: `Pending (${pendingCount})` },
          { id: 'urgent', label: 'Urgent' },
          { id: 'completed', label: `Completed (${completedCount})` },
          { id: 'all', label: 'All' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            style={{
              padding: '6px 12px',
              borderRadius: '9999px',
              border: filter === tab.id ? '1px solid var(--ink)' : '1px solid var(--border)',
              backgroundColor: filter === tab.id ? 'var(--ink)' : 'var(--card)',
              color: filter === tab.id ? 'var(--paper)' : 'var(--ink-soft)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Deadlines List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredDeadlines.map(task => {
          const { text, urgency, formatted } = getDueInfo(task.dueDate);
          const isDone = task.completed;

          let badgeBg = 'var(--wash-moss)';
          let badgeColor = 'var(--moss)';
          if (!isDone) {
            if (urgency === 'urgent') {
              badgeBg = 'var(--wash-hanko)';
              badgeColor = 'var(--hanko)';
            } else if (urgency === 'warning') {
              badgeBg = 'var(--wash-ochre)';
              badgeColor = 'var(--ochre)';
            }
          }

          return (
            <div
              key={task.id}
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '14px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                opacity: isDone ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTask(task.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  marginTop: '2px',
                  color: isDone ? 'var(--moss)' : 'var(--ink-soft)'
                }}
              >
                {isDone ? (
                  <CheckSquare size={20} strokeWidth={2.3} style={{ color: 'var(--moss)' }} />
                ) : (
                  <Square size={20} strokeWidth={1.8} />
                )}
              </button>

              {/* Task Details */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--wash-indigo)',
                    color: 'var(--indigo)'
                  }}>
                    {task.courseCode}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                    {task.type}
                  </span>
                </div>

                <h4 style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  margin: '0 0 6px 0',
                  textDecoration: isDone ? 'line-through' : 'none'
                }}>
                  {task.title}
                </h4>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                  <span style={{
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: '5px',
                    backgroundColor: isDone ? 'var(--wash-moss)' : badgeBg,
                    color: isDone ? 'var(--moss)' : badgeColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Clock size={11} />
                    {isDone ? 'Completed' : text}
                  </span>
                  <span style={{ color: 'var(--ink-soft)' }}>
                    {formatted}
                  </span>
                </div>
              </div>

              {/* Delete Button for Custom Tasks */}
              {task.isCustom && (
                <button
                  onClick={() => deleteTask(task.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ink-soft)',
                    cursor: 'pointer',
                    padding: '4px',
                    opacity: 0.6
                  }}
                  title="Delete custom task"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          );
        })}

        {filteredDeadlines.length === 0 && (
          <div style={{
            padding: '36px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--card)',
            borderRadius: '12px',
            border: '1px solid var(--border)'
          }}>
            <CheckSquare size={28} style={{ color: 'var(--moss)', margin: '0 auto 10px auto' }} />
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', color: 'var(--ink)', marginBottom: '4px' }}>
              No Deadlines in This View
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
              All clear! You are ahead of schedule.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
