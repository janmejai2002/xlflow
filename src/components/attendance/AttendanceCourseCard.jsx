import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, ChevronRight, PenLine, Clock } from 'lucide-react';
import { COURSE_COLORS } from '../../data/rosterData';
import { STATUTORY_THRESHOLD } from '../../services/bunkCalculator';
import { playTactileClick } from '../../services/soundEngine';

/**
 * One course, two numbers: what you logged, and what the ERP says.
 *
 * Everything else on this card is derived from those two. There is no mode to
 * pick and nothing to reconcile by hand — the margin is always computed from
 * whichever side is worse, and the card says which side that was.
 */
export default function AttendanceCourseCard({ course, recon, onOpenDetails, onMarkClass }) {
  const colors = COURSE_COLORS[course.code] || { accent: 'var(--indigo)' };

  const erp = recon.official;
  const you = recon.self;
  const active = recon.active;
  const threshold = STATUTORY_THRESHOLD * 100;

  const noClassesYet = active.conducted === 0;

  // Nothing held yet is neither safe nor risky — it is simply unknown, and must
  // not be painted green.
  const tier = noClassesYet ? 'none' : active.tier; // 'none' | 'safe' | 'warning' | 'danger'
  const tone =
    tier === 'none'
      ? { color: 'var(--ink-faint)', text: 'var(--ink-soft)', wash: 'var(--paper)', rgb: '0, 0, 0' }
      :
    tier === 'danger'
      ? { color: 'var(--hanko)', text: 'var(--hanko-text)', wash: 'var(--wash-hanko)', rgb: 'var(--hanko-rgb)' }
      : tier === 'warning'
      ? { color: 'var(--ochre)', text: 'var(--ochre-text)', wash: 'var(--wash-ochre)', rgb: 'var(--ochre-rgb)' }
      : { color: 'var(--moss)', text: 'var(--moss-text)', wash: 'var(--wash-moss)', rgb: 'var(--moss-rgb)' };

  const StatusIcon =
    tier === 'none' ? Clock : tier === 'danger' ? AlertCircle : tier === 'warning' ? AlertTriangle : ShieldCheck;

  // The single sentence a student actually needs.
  let verdict;
  if (noClassesYet) {
    verdict = 'No classes held yet';
  } else if (active.isDebarredRisk) {
    verdict = 'Cannot reach 80% — speak to the course office';
  } else if (tier === 'danger') {
    verdict = `Below 80% — attend the next ${active.recoveryRequired} to recover`;
  } else if (active.safeBunksRemaining === 0) {
    verdict = 'No margin left — attend every remaining class';
  } else {
    verdict = `Can miss ${active.safeBunksRemaining} more class${active.safeBunksRemaining === 1 ? '' : 'es'}`;
  }

  const { attendedDiff, conductedDiff } = recon.discrepancy;
  let diffNote = null;
  if (recon.discrepancy.hasDiscrepancy) {
    const parts = [];
    if (conductedDiff > 0) parts.push(`${conductedDiff} class${conductedDiff === 1 ? '' : 'es'} the ERP has not recorded yet`);
    else if (conductedDiff < 0) parts.push(`${-conductedDiff} class${conductedDiff === -1 ? '' : 'es'} you have not logged`);
    if (attendedDiff !== 0) {
      parts.push(`${Math.abs(attendedDiff)} attendance${Math.abs(attendedDiff) === 1 ? '' : 's'} ${attendedDiff > 0 ? 'missing from the ERP' : 'the ERP credits you that you did not log'}`);
    }
    diffNote = parts.join(', ');
  }

  const Column = ({ label, stats, isDriving, dim }) => (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: '10px 12px',
        borderRadius: '12px',
        backgroundColor: isDriving ? tone.wash : 'var(--paper)',
        border: `1px solid ${isDriving ? `rgba(${tone.rgb}, 0.35)` : 'var(--border)'}`
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.09em',
          textTransform: 'uppercase',
          color: isDriving ? tone.text : 'var(--ink-faint)'
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontFeatureSettings: '"tnum"',
          fontSize: '24px',
          fontWeight: 700,
          lineHeight: 1.15,
          marginTop: '4px',
          color: dim ? 'var(--ink-faint)' : isDriving ? tone.text : 'var(--ink)'
        }}
      >
        {dim || stats.conducted === 0 ? '—' : `${stats.currentPercentage}%`}
      </div>
      <div
        style={{
          fontSize: '11.5px',
          color: 'var(--ink-soft)',
          fontFamily: 'var(--font-mono)',
          fontFeatureSettings: '"tnum"',
          marginTop: '2px'
        }}
      >
        {dim ? 'not logged' : stats.conducted === 0 ? 'no classes yet' : `${stats.attended} of ${stats.conducted}`}
      </div>
    </div>
  );

  return (
    <div
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${colors.accent}`,
        borderRadius: '14px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: 'var(--shadow-card)'
      }}
    >
      {/* Course identity */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: 0 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.04em',
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

      {/* The comparison */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <Column
          label="You logged"
          stats={you}
          isDriving={!noClassesYet && recon.activeSource === 'self'}
          dim={!recon.hasSelfData}
        />
        <Column label="ERP" stats={erp} isDriving={!noClassesYet && recon.activeSource === 'erp'} />
      </div>

      {/* Threshold bar for whichever side is driving the margin */}
      <div>
        <div
          style={{
            position: 'relative',
            height: '6px',
            borderRadius: '3px',
            backgroundColor: 'var(--stone)',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: noClassesYet ? '0%' : `${Math.min(100, active.currentPercentage)}%`,
              height: '100%',
              backgroundColor: tone.color,
              borderRadius: '3px',
              transition: 'width 0.3s ease'
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: `${threshold}%`,
              top: 0,
              bottom: 0,
              width: '2px',
              backgroundColor: 'var(--ink)',
              opacity: 0.55
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: 'var(--ink-faint)',
            fontFamily: 'var(--font-mono)',
            marginTop: '4px'
          }}
        >
          <span>0%</span>
          <span>80% required</span>
          <span>100%</span>
        </div>
      </div>

      {/* Verdict */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <StatusIcon size={16} color={tone.color} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '13.5px', fontWeight: 700, color: tone.text, lineHeight: 1.3 }}>{verdict}</span>
      </div>

      {/* Only shown when the two sides actually disagree */}
      {diffNote && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '9px 11px',
            borderRadius: '10px',
            backgroundColor: 'var(--wash-ochre)',
            border: '1px solid rgba(var(--ochre-rgb), 0.3)',
            fontSize: '12px',
            color: 'var(--ochre-text)',
            lineHeight: 1.4
          }}
        >
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{diffNote}</span>
        </div>
      )}

      {/* Actions — both at a 44px touch target */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => {
            playTactileClick();
            onMarkClass?.(course.code);
          }}
          style={{
            flex: 1,
            minHeight: '44px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            borderRadius: '11px',
            border: '1px solid var(--border-strong)',
            backgroundColor: 'var(--paper)',
            color: 'var(--ink)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <PenLine size={15} />
          <span>Mark classes</span>
        </button>
        <button
          onClick={() => {
            playTactileClick();
            onOpenDetails?.(course.code);
          }}
          style={{
            flex: 1,
            minHeight: '44px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            borderRadius: '11px',
            border: 'none',
            backgroundColor: 'var(--ink)',
            color: 'var(--paper)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <span>Details</span>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
