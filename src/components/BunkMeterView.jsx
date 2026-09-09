import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Info, Calculator, Check } from 'lucide-react';
import { calculateBunkStats, STATUTORY_THRESHOLD } from '../services/bunkCalculator';
import NumberFlow from '@number-flow/react';
import CourseSafetyCard from './CourseSafetyCard';

export default function BunkMeterView({ courses = [] }) {
  const [filterTerm, setFilterTerm] = useState('all'); // 'all' | 'Term-5' | 'Term-4'

  // Compute stats for all courses
  const evaluatedCourses = courses.map(course => {
    const stats = calculateBunkStats(course.attended, course.conducted, course.totalPlanned);
    return {
      ...course,
      stats
    };
  });

  // Filtered courses
  const filteredCourses = evaluatedCourses.filter(c => {
    if (filterTerm === 'all') return true;
    return c.term?.includes(filterTerm);
  });

  // Overall metrics
  const totalCourses = evaluatedCourses.length;
  const warningOrDanger = evaluatedCourses.filter(c => c.stats.tier === 'warning' || c.stats.tier === 'danger').length;
  const safeCount = evaluatedCourses.filter(c => c.stats.tier === 'safe').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>
      {/* Title & Statutory Banner */}
      <div>
        <h2 style={{
          fontFamily: 'var(--font-brand)',
          fontSize: '24px',
          fontWeight: 800,
          letterSpacing: '-0.025em',
          color: 'var(--ink)'
        }}>
          Bunk-O-Meter
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '2px' }}>
          Real-time safety margins calibrated for XLRI's mandatory 80.0% policy.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px'
      }}>
        <div style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 500 }}>Tracked</span>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
            <NumberFlow value={totalCourses} />
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--wash-moss)',
          border: '1px solid rgba(110, 140, 99, 0.25)',
          borderRadius: '12px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--moss-text)', fontWeight: 600 }}>Safe (&ge;85%)</span>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--moss-text)', marginTop: '2px' }}>
            <NumberFlow value={safeCount} />
          </div>
        </div>

        <div style={{
          backgroundColor: warningOrDanger > 0 ? 'var(--wash-hanko)' : 'var(--card)',
          border: `1px solid ${warningOrDanger > 0 ? 'rgba(210, 84, 63, 0.25)' : 'var(--border)'}`,
          borderRadius: '12px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', color: warningOrDanger > 0 ? 'var(--hanko-text)' : 'var(--ink-soft)', fontWeight: 600 }}>
            Risk / Action
          </span>
          <div style={{ fontSize: '20px', fontWeight: 700, color: warningOrDanger > 0 ? 'var(--hanko-text)' : 'var(--ink)', marginTop: '2px' }}>
            <NumberFlow value={warningOrDanger} />
          </div>
        </div>
      </div>

      {/* Term Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
        {[
          { id: 'all', label: 'All Terms' },
          { id: 'Term-5', label: 'Term-5 (Current)' },
          { id: 'Term-4', label: 'Term-4 (Historical)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterTerm(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: filterTerm === tab.id ? '1px solid var(--ink)' : '1px solid var(--border)',
              backgroundColor: filterTerm === tab.id ? 'var(--ink)' : 'var(--card)',
              color: filterTerm === tab.id ? 'var(--paper)' : 'var(--ink-soft)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Course Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredCourses.map(course => (
          <CourseSafetyCard
            key={course.code}
            course={course}
          />
        ))}
      </div>

      {/* Statutory Attendance Policy Reference */}
      <div style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '18px',
        boxShadow: 'var(--shadow-card)',
        marginTop: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'var(--wash-mizu)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--mizu)'
          }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-brand)', fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
              XLRI Statutory Attendance Policy (80.0% Rule)
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
              Academic Committee Regulations & Debarment Protocol
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
          <div style={{
            padding: '10px 12px',
            borderRadius: '10px',
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)'
          }}>
            <strong style={{ color: 'var(--ink)' }}>• Mandatory Threshold:</strong> Students must maintain a minimum of <strong>80.0% physical presence</strong> across all enrolled courses to qualify for end-term examinations.
          </div>
          <div style={{
            padding: '10px 12px',
            borderRadius: '10px',
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)'
          }}>
            <strong style={{ color: 'var(--ink)' }}>• Safe Bunk Buffer:</strong> The indicator reflects exact permissible absences before breaching 80.0%. Courses at 0 safe buffer require 100% presence.
          </div>
          <div style={{
            padding: '10px 12px',
            borderRadius: '10px',
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)'
          }}>
            <strong style={{ color: 'var(--ink)' }}>• Automatic Debarment Flag:</strong> Any course falling below 80.0% without approved institutional or medical leave is subjected to automatic grade reduction or debarment.
          </div>
        </div>
      </div>
    </div>
  );
}
