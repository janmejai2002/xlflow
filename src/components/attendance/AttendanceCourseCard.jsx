import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, ChevronRight, PenLine, Clock } from 'lucide-react';
import { COURSE_COLORS } from '../../data/courseColors';
import { STATUTORY_THRESHOLD } from '../../services/bunkCalculator';
import { playTactileClick } from '../../services/soundEngine';

/**
 * AttendanceCourseCard - Editorial Academic Ledger Card
 *
 * One course, two verified columns: Sovereign Self-Log vs Official ERP Snapshot.
 * Features:
 * - Architectural hairline ledger split (1px border-soft)
 * - 2026 wAIbi-sabi aesthetics with restrained Five Earths washes
 * - Japanese Hanko stamps for statutory status (SAFE, WARNING, DANGER, DEBARRED)
 * - Authoritative Newsreader serif verdict statement
 * - Tabular numbers with font-feature-settings: 'tnum'
 * - Tactile mechanical depression for button ergonomics
 */
export default function AttendanceCourseCard({ course, recon, onOpenDetails, onMarkClass }) {
  const colors = COURSE_COLORS[course.code] || { accent: 'var(--indigo)' };

  const erp = recon.official;
  const you = recon.self;
  const active = recon.active;
  const threshold = STATUTORY_THRESHOLD * 100;

  // Only truly unknown when neither side has recorded anything.
  const noClassesYet = !recon.hasAnyData;

  // Nothing held yet is neither safe nor risky — it is simply unknown.
  const tier = noClassesYet ? 'none' : active.tier; // 'none' | 'safe' | 'warning' | 'danger'
  const tone =
    tier === 'none'
      ? { color: 'var(--ink-faint)', text: 'var(--ink-soft)', wash: 'transparent', rgb: '133, 123, 103' }
      : tier === 'danger'
      ? { color: 'var(--hanko)', text: 'var(--hanko-text)', wash: 'var(--wash-hanko)', rgb: 'var(--hanko-rgb)' }
      : tier === 'warning'
      ? { color: 'var(--ochre)', text: 'var(--ochre-text)', wash: 'var(--wash-ochre)', rgb: 'var(--ochre-rgb)' }
      : { color: 'var(--moss)', text: 'var(--moss-text)', wash: 'var(--wash-moss)', rgb: 'var(--moss-rgb)' };

  const StatusIcon =
    tier === 'none' ? Clock : tier === 'danger' ? AlertCircle : tier === 'warning' ? AlertTriangle : ShieldCheck;

  // Japanese Hanko stamp statutory state
  const stampLabel = noClassesYet ? 'NO DATA' : active.isDebarredRisk ? 'DEBARRED' : tier.toUpperCase();

  // Authoritative academic verdict in Newsreader serif
  let verdict;
  if (noClassesYet) {
    verdict = 'No academic sessions conducted or recorded yet for this course.';
  } else if (active.isDebarredRisk) {
    verdict = 'Cannot reach 80% statutory requirement — formal course office petition required.';
  } else if (tier === 'danger') {
    verdict = `Statutory deficit: attend the next ${active.recoveryRequired} consecutive class${active.recoveryRequired === 1 ? '' : 'es'} to restore 80% standing.`;
  } else if (active.safeBunksRemaining === 0) {
    verdict = 'Zero safety margin remaining — every scheduled class is compulsory.';
  } else {
    verdict = `Permitted absence allowance: can miss ${active.safeBunksRemaining} more class${active.safeBunksRemaining === 1 ? '' : 'es'} without dropping below 80%.`;
  }

  const { attendedDiff, conductedDiff } = recon.discrepancy;
  let diffNote = null;
  if (recon.discrepancy.hasDiscrepancy) {
    const n = Math.abs(conductedDiff);
    const cls = (k) => k + (k === 1 ? ' class' : ' classes');
    if (conductedDiff > 0 && attendedDiff === conductedDiff) {
      diffNote = 'The ERP has not recorded ' + cls(n) + ' you attended';
    } else if (conductedDiff > 0) {
      diffNote = 'The ERP has not recorded ' + cls(n) + ' you logged';
    } else if (conductedDiff < 0) {
      diffNote = 'You have not logged ' + cls(n) + ' the ERP has recorded';
    } else if (attendedDiff > 0) {
      diffNote = 'The ERP credits you ' + cls(Math.abs(attendedDiff)) + ' fewer than you logged';
    } else {
      diffNote = 'The ERP credits you ' + cls(Math.abs(attendedDiff)) + ' more than you logged';
    }
  }

  const isSelfDriving = !noClassesYet && recon.activeSource === 'self';
  const isErpDriving = !noClassesYet && recon.activeSource === 'erp';

  return (
    <div
      className="editorial-slate"
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${colors.accent}`,
        borderRadius: '4px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Course Header: Code, Title & Statutory Hanko Stamp */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '13px 16px 11px 16px',
          borderBottom: '1px solid var(--border-soft)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: 0, flex: 1 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
              fontWeight: 800,
              letterSpacing: '0.05em',
              color: colors.accent,
              flexShrink: 0
            }}
          >
            {course.code}
          </span>
          <h3
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '14.5px',
              fontWeight: 700,
              color: 'var(--ink)',
              lineHeight: 1.3,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {course.name}
          </h3>
        </div>

        <span
          className="hanko-stamp"
          style={{
            color: tone.color,
            borderColor: tone.color,
            backgroundColor: tier === 'none' ? 'transparent' : `rgba(${tone.rgb}, 0.06)`
          }}
        >
          {stampLabel}
        </span>
      </div>

      {/* The Architectural Hairline Ledger Split: You Logged vs ERP Snapshot */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          borderBottom: '1px solid var(--border-soft)',
          backgroundColor: 'transparent'
        }}
      >
        {/* Column 1: You Logged */}
        <div
          style={{
            padding: '11px 16px 12px 16px',
            borderRight: '1px solid var(--border-soft)',
            backgroundColor: isSelfDriving ? tone.wash : 'transparent'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: isSelfDriving ? tone.text : 'var(--ink-faint)'
              }}
            >
              You Logged
            </span>
            {isSelfDriving && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: tone.color
                }}
              >
                Driving
              </span>
            )}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontFeatureSettings: '"tnum"',
              fontVariantNumeric: 'tabular-nums',
              fontSize: '22px',
              fontWeight: 700,
              lineHeight: 1.15,
              marginTop: '4px',
              color: !recon.hasSelfData ? 'var(--ink-faint)' : isSelfDriving ? tone.text : 'var(--ink)'
            }}
          >
            {!recon.hasSelfData || you.conducted === 0 ? '—' : `${you.currentPercentage}%`}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontFeatureSettings: '"tnum"',
              fontVariantNumeric: 'tabular-nums',
              fontSize: '11px',
              color: 'var(--ink-muted)',
              marginTop: '2px'
            }}
          >
            {!recon.hasSelfData
              ? 'not logged'
              : you.conducted === 0
              ? 'no sessions'
              : `${you.attended} of ${you.conducted} attended`}
          </div>
        </div>

        {/* Column 2: ERP Snapshot */}
        <div
          style={{
            padding: '11px 16px 12px 16px',
            backgroundColor: isErpDriving ? tone.wash : 'transparent'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: isErpDriving ? tone.text : 'var(--ink-faint)'
              }}
            >
              ERP Snapshot
            </span>
            {isErpDriving && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: tone.color
                }}
              >
                Driving
              </span>
            )}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontFeatureSettings: '"tnum"',
              fontVariantNumeric: 'tabular-nums',
              fontSize: '22px',
              fontWeight: 700,
              lineHeight: 1.15,
              marginTop: '4px',
              color: erp.conducted === 0 ? 'var(--ink-faint)' : isErpDriving ? tone.text : 'var(--ink)'
            }}
          >
            {erp.conducted === 0 ? '—' : `${erp.currentPercentage}%`}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontFeatureSettings: '"tnum"',
              fontVariantNumeric: 'tabular-nums',
              fontSize: '11px',
              color: 'var(--ink-muted)',
              marginTop: '2px'
            }}
          >
            {erp.conducted === 0 ? 'no classes yet' : `${erp.attended} of ${erp.conducted} attended`}
          </div>
        </div>
      </div>

      {/* Verdict & Calibration Gauge */}
      <div style={{ padding: '13px 16px 12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <StatusIcon size={16} color={tone.color} style={{ flexShrink: 0, marginTop: '2.5px' }} />
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: '15px',
              color: 'var(--ink)',
              lineHeight: 1.4
            }}
          >
            {verdict}
          </span>
        </div>

        {/* Precision Statutory Gauge */}
        <div style={{ marginTop: '12px' }}>
          <div
            style={{
              position: 'relative',
              height: '5px',
              borderRadius: '2px',
              backgroundColor: 'var(--stone)',
              overflow: 'visible'
            }}
          >
            <div
              style={{
                width: noClassesYet ? '0%' : `${Math.min(100, active.currentPercentage)}%`,
                height: '100%',
                backgroundColor: tone.color,
                borderRadius: '2px',
                transition: 'width 0.3s ease'
              }}
            />
            {/* 80% statutory threshold hairline pin */}
            <div
              aria-hidden="true"
              title="80% statutory threshold"
              style={{
                position: 'absolute',
                left: `${threshold}%`,
                top: '-3px',
                bottom: '-3px',
                width: '1.5px',
                backgroundColor: 'var(--ink)',
                opacity: 0.75,
                zIndex: 2
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontFeatureSettings: '"tnum"',
              fontVariantNumeric: 'tabular-nums',
              fontSize: '10px',
              color: 'var(--ink-faint)',
              marginTop: '6px'
            }}
          >
            <span>0%</span>
            <span style={{ fontWeight: 600 }}>80% STATUTORY MINIMUM</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Discrepancy Reconciliation Notice */}
      {diffNote && (
        <div
          style={{
            margin: '0 16px 12px 16px',
            padding: '8px 12px',
            borderRadius: '4px',
            backgroundColor: 'var(--wash-ochre)',
            border: '1px solid rgba(var(--ochre-rgb), 0.3)',
            borderLeft: '3px solid var(--ochre)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--ochre-text)',
            lineHeight: 1.4
          }}
        >
          <AlertTriangle size={14} color="var(--ochre)" style={{ flexShrink: 0, marginTop: '1.5px' }} />
          <div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginRight: '6px'
              }}
            >
              Reconciliation Notice:
            </span>
            <span>{diffNote}</span>
          </div>
        </div>
      )}

      {/* Actions: Tactile Mechanical Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '11px 16px 13px 16px',
          borderTop: '1px solid var(--border-soft)'
        }}
      >
        <button
          className="btn-tactile"
          onClick={() => {
            playTactileClick();
            onMarkClass?.(course.code);
          }}
          style={{
            flex: 1,
            minHeight: '40px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            borderRadius: '4px',
            border: '1px solid var(--border-strong)',
            backgroundColor: 'var(--paper)',
            color: 'var(--ink)',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font-brand)'
          }}
        >
          <PenLine size={14} />
          <span>Mark classes</span>
        </button>
        <button
          className="btn-tactile"
          onClick={() => {
            playTactileClick();
            onOpenDetails?.(course.code);
          }}
          style={{
            flex: 1,
            minHeight: '40px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            borderRadius: '4px',
            border: '1px solid var(--ink)',
            backgroundColor: 'var(--ink)',
            color: 'var(--paper)',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font-brand)'
          }}
        >
          <span>Audit ledger</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
