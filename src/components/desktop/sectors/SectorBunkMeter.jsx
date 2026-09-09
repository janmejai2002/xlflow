import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { calculateBunkStats } from '../../../services/bunkCalculator';
import { toast } from 'sonner';
import CourseSafetyCard from '../../CourseSafetyCard';

export default function SectorBunkMeter({ courses = [] }) {
  const [filterTerm, setFilterTerm] = useState('all');

  const evaluatedCourses = courses.map(course => {
    const stats = calculateBunkStats(course.attended, course.conducted, course.totalPlanned);
    return {
      ...course,
      stats
    };
  });

  const filteredCourses = evaluatedCourses.filter(c => {
    if (filterTerm === 'all') return true;
    return c.term?.includes(filterTerm);
  });

  const totalCourses = evaluatedCourses.length;
  const safeCount = evaluatedCourses.filter(c => c.stats.tier === 'safe').length;
  const riskCount = evaluatedCourses.filter(c => c.stats.tier === 'warning' || c.stats.tier === 'danger').length;

  const handleExportAuditPdf = () => {
    window.print();
    toast.success('Generated Dean Appeal Attendance Report');
  };

  return (
    <div style={{
      width: '1200px',
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
            background: 'var(--wash-moss)',
            border: '1px solid rgba(110, 140, 99, 0.3)',
            color: 'var(--moss)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(110, 140, 99, 0.15)'
          }}>
            <ShieldCheck size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--moss)', letterSpacing: '0.06em' }}>
                SECTOR 03
              </span>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>•</span>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Statutory Attendance Safety & Compliance Tracker</span>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--ink)',
              margin: '2px 0 0 0',
              letterSpacing: '-0.025em'
            }}>
              Bunk-O-Meter Safety Matrix
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleExportAuditPdf}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--ink)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <FileText size={13} />
            <span>Audit Report</span>
          </button>

          {/* Filter Pills */}
          {['all', 'Term-5', 'Term-4'].map(t => (
            <button
              key={t}
              onClick={() => setFilterTerm(t)}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '8px',
                border: filterTerm === t ? '1px solid var(--ink)' : '1px solid var(--border)',
                backgroundColor: filterTerm === t ? 'var(--ink)' : 'var(--card)',
                color: filterTerm === t ? 'var(--paper)' : 'var(--ink)',
                cursor: 'pointer'
              }}
            >
              {t === 'all' ? 'All Terms' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px'
      }}>
        <div style={{
          backgroundColor: 'var(--card)',
          padding: '12px 18px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>TOTAL COURSES</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
              {totalCourses} Tracked
            </div>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Term-5 / Core</span>
        </div>

        <div style={{
          backgroundColor: 'var(--wash-moss)',
          padding: '12px 18px',
          borderRadius: '12px',
          border: '1px solid rgba(110, 140, 99, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--moss-text)' }}>SAFE ZONE (≥85%)</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--moss-text)', marginTop: '2px' }}>
              {safeCount} Courses Safe
            </div>
          </div>
          <ShieldCheck size={20} color="var(--moss)" />
        </div>

        <div style={{
          backgroundColor: riskCount > 0 ? 'var(--wash-ochre)' : 'var(--card)',
          padding: '12px 18px',
          borderRadius: '12px',
          border: riskCount > 0 ? '1px solid rgba(194, 145, 58, 0.3)' : '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--ochre-text)' }}>ATTENDANCE WATCH</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ochre-text)', marginTop: '2px' }}>
              {riskCount} Under Watch
            </div>
          </div>
          <AlertTriangle size={20} color="var(--ochre)" />
        </div>
      </div>

      {/* 3-Column Course Grid */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '14px',
        alignContent: 'start'
      }}>
        {filteredCourses.map(course => (
          <CourseSafetyCard
            key={course.id || course.code}
            course={course}
            isCompact={true}
            onOpenDeepSim={(code) => {
              toast.info(`Opening detailed scenario planner for ${code}`);
            }}
          />
        ))}
      </div>
    </div>
  );
}
