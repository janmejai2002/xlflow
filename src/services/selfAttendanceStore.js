/**
 * Self-Attendance Storage Engine & Discrepancy Reconciliation for XL-Flow
 * Solves the university ERP administrative lag & error problem by giving students
 * 100% sovereign, verified, offline-first personal attendance logs.
 */

import { calculateBunkStats } from './bunkCalculator';

const STORAGE_KEY = 'xlflow_self_attendance_v1';

export const ABSENCE_REASONS = [
  { id: 'interview', label: 'Placement / Interview', category: 'official' },
  { id: 'medical', label: 'Medical / Sick Leave', category: 'official' },
  { id: 'case_comp', label: 'Case Competition', category: 'official' },
  { id: 'academic', label: 'Academic Committee / Duty', category: 'official' },
  { id: 'travel', label: 'Out of Campus / Travel', category: 'personal' },
  { id: 'personal', label: 'Personal / General Bunk', category: 'personal' }
];

class SelfAttendanceStore {
  constructor() {
    this.state = this.loadFromStorage();
    this.listeners = new Set();
  }

  loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          markedSessions: parsed.markedSessions || {},
          courseAdjustments: parsed.courseAdjustments || {},
          sourceMode: parsed.sourceMode || 'hybrid' // 'hybrid' | 'self' | 'erp'
        };
      }
    } catch (e) {
      console.warn('Failed to load self-attendance from storage:', e);
    }

    return {
      markedSessions: {},
      courseAdjustments: {},
      sourceMode: 'hybrid'
    };
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to persist self-attendance:', e);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.saveToStorage();
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (e) {
        console.error('Listener error in selfAttendanceStore:', e);
      }
    }
  }

  // ==========================================
  // SESSION-LEVEL MARKING
  // ==========================================

  markSession(sessionId, status, metadata = {}) {
    if (!sessionId) return;
    
    if (!status || status === 'unmarked') {
      delete this.state.markedSessions[sessionId];
    } else {
      this.state.markedSessions[sessionId] = {
        status, // 'present' | 'absent' | 'cancelled'
        markedAt: new Date().toISOString(),
        reason: metadata.reason || (status === 'absent' ? 'personal' : ''),
        note: metadata.note || '',
        courseCode: metadata.courseCode || '',
        courseName: metadata.courseName || '',
        classDate: metadata.classDate || '',
        venue: metadata.venue || ''
      };
    }

    this.notify();
    return this.state.markedSessions[sessionId];
  }

  getSessionStatus(sessionId) {
    return this.state.markedSessions[sessionId] || null;
  }

  unmarkSession(sessionId) {
    if (this.state.markedSessions[sessionId]) {
      delete this.state.markedSessions[sessionId];
      this.notify();
    }
  }

  // ==========================================
  // COURSE-LEVEL MANUAL ADJUSTMENTS
  // ==========================================

  setCourseAdjustment(courseCode, adjustment = {}) {
    if (!courseCode) return;
    const existing = this.state.courseAdjustments[courseCode] || { deltaAttended: 0, deltaConducted: 0 };
    this.state.courseAdjustments[courseCode] = {
      ...existing,
      ...adjustment,
      updatedAt: new Date().toISOString()
    };
    this.notify();
  }

  quickAdjustCourse(courseCode, type) {
    const existing = this.state.courseAdjustments[courseCode] || { deltaAttended: 0, deltaConducted: 0 };
    let deltaAttended = existing.deltaAttended || 0;
    let deltaConducted = existing.deltaConducted || 0;

    if (type === 'add_present') {
      deltaAttended += 1;
      deltaConducted += 1;
    } else if (type === 'add_absent') {
      deltaConducted += 1;
    } else if (type === 'sub_present') {
      deltaAttended = Math.max(0, deltaAttended - 1);
      deltaConducted = Math.max(0, deltaConducted - 1);
    } else if (type === 'sub_absent') {
      deltaConducted = Math.max(deltaAttended, deltaConducted - 1);
    }

    this.setCourseAdjustment(courseCode, { deltaAttended, deltaConducted });
  }

  resetCourseAdjustment(courseCode) {
    if (this.state.courseAdjustments[courseCode]) {
      delete this.state.courseAdjustments[courseCode];
      this.notify();
    }
  }

  // ==========================================
  // SOURCE MODE PREFERENCE
  // ==========================================

  setSourceMode(mode) {
    if (['hybrid', 'self', 'erp'].includes(mode)) {
      this.state.sourceMode = mode;
      this.notify();
    }
  }

  getSourceMode() {
    return this.state.sourceMode || 'hybrid';
  }

  // ==========================================
  // RECONCILIATION & STATS COMPUTATION
  // ==========================================

  getCourseStats(course, schedule = []) {
    if (!course) return null;
    const courseCode = course.code;

    // 1. Official ERP numbers
    const officialAttended = Number(course.attended) || 0;
    const officialConducted = Number(course.conducted) || 0;
    const totalPlanned = Number(course.totalPlanned) || 20;

    // 2. Self-marked sessions from schedule
    let selfPresent = 0;
    let selfAbsent = 0;
    let selfCancelled = 0;

    const courseSessions = schedule.filter(s => s.courseCode === courseCode);
    courseSessions.forEach(s => {
      const mark = this.state.markedSessions[s.sessionId];
      if (mark) {
        if (mark.status === 'present') selfPresent++;
        else if (mark.status === 'absent') selfAbsent++;
        else if (mark.status === 'cancelled') selfCancelled++;
      }
    });

    // 3. Manual course adjustments
    const adj = this.state.courseAdjustments[courseCode] || { deltaAttended: 0, deltaConducted: 0 };
    const adjAttended = Number(adj.deltaAttended) || 0;
    const adjConducted = Number(adj.deltaConducted) || 0;

    // 4. Combined Self Numbers
    const selfConducted = selfPresent + selfAbsent + adjConducted;
    const selfAttended = selfPresent + adjAttended;

    // 5. Determine active values based on source mode
    let activeAttended = officialAttended;
    let activeConducted = officialConducted;

    if (this.state.sourceMode === 'self') {
      activeAttended = selfAttended;
      activeConducted = selfConducted;
    } else if (this.state.sourceMode === 'hybrid') {
      if (selfConducted > officialConducted || adjAttended !== 0 || adjConducted !== 0) {
        activeAttended = Math.max(officialAttended + adjAttended, selfAttended);
        activeConducted = Math.max(officialConducted + adjConducted, selfConducted);
      }
    }

    const officialStats = calculateBunkStats(officialAttended, officialConducted, totalPlanned);
    const selfStats = calculateBunkStats(selfAttended, selfConducted, totalPlanned);
    const activeStats = calculateBunkStats(activeAttended, activeConducted, totalPlanned);

    const discrepancy = {
      hasDiscrepancy: officialConducted !== selfConducted || officialAttended !== selfAttended,
      attendedDiff: selfAttended - officialAttended,
      conductedDiff: selfConducted - officialConducted
    };

    return {
      courseCode,
      courseName: course.name,
      official: officialStats,
      self: selfStats,
      active: activeStats,
      discrepancy,
      selfCounts: {
        present: selfPresent,
        absent: selfAbsent,
        cancelled: selfCancelled,
        adjAttended,
        adjConducted
      },
      sourceMode: this.state.sourceMode
    };
  }

  // ==========================================
  // DISCREPANCY AUDIT ACROSS ALL COURSES
  // ==========================================

  getAllDiscrepancies(courses = [], schedule = []) {
    const discrepancies = [];
    courses.forEach(c => {
      const stats = this.getCourseStats(c, schedule);
      if (stats && stats.discrepancy.hasDiscrepancy) {
        discrepancies.push(stats);
      }
    });
    return discrepancies;
  }

  // ==========================================
  // EXPORT & DEAN APPEAL REPORT GENERATOR
  // ==========================================

  exportAuditCsv(courses = [], schedule = [], student = {}) {
    const headers = [
      'Date',
      'Course Code',
      'Course Name',
      'Venue',
      'Status',
      'Excuse Category',
      'Excuse Note',
      'Logged At'
    ];

    const rows = [];

    schedule.forEach(s => {
      const mark = this.state.markedSessions[s.sessionId];
      if (mark) {
        const reasonObj = ABSENCE_REASONS.find(r => r.id === mark.reason);
        rows.push([
          `"${s.classDate || ''}"`,
          `"${s.courseCode || ''}"`,
          `"${(s.courseName || '').replace(/"/g, '""')}"`,
          `"${s.venue || ''}"`,
          `"${mark.status.toUpperCase()}"`,
          `"${reasonObj?.label || mark.reason || ''}"`,
          `"${(mark.note || '').replace(/"/g, '""')}"`,
          `"${mark.markedAt || ''}"`
        ]);
      }
    });

    Object.entries(this.state.courseAdjustments).forEach(([code, adj]) => {
      if (adj.deltaAttended || adj.deltaConducted) {
        rows.push([
          `"TERMWIDE ADJUSTMENT"`,
          `"${code}"`,
          `"Manual Override"`,
          `"N/A"`,
          `"+${adj.deltaAttended} Attended / +${adj.deltaConducted} Conducted"`,
          `"Manual Adjustment"`,
          `"${(adj.notes || '').replace(/"/g, '""')}"`,
          `"${adj.updatedAt || ''}"`
        ]);
      }
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    return csvContent;
  }

  exportBackupJson() {
    return JSON.stringify(this.state, null, 2);
  }

  importBackupJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object') {
        this.state = {
          markedSessions: parsed.markedSessions || {},
          courseAdjustments: parsed.courseAdjustments || {},
          sourceMode: parsed.sourceMode || 'hybrid'
        };
        this.notify();
        return { ok: true, count: Object.keys(this.state.markedSessions).length };
      }
    } catch (e) {
      return { ok: false, error: e.message };
    }
    return { ok: false, error: 'Invalid JSON format' };
  }

  clearAll() {
    this.state = {
      markedSessions: {},
      courseAdjustments: {},
      sourceMode: 'hybrid'
    };
    this.notify();
  }
}

export const selfAttendanceStore = new SelfAttendanceStore();
