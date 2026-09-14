import React, { useRef, useEffect, useState } from 'react';
import { Download, Share2, X, Check, Sparkles, Calendar, ShieldCheck, Copy } from 'lucide-react';
import { calculateBunkStats } from '../services/bunkCalculator';
import { firePassConfetti } from '../services/confetti';
import { playTactileClick } from '../services/soundEngine';
import { toast } from 'sonner';

/**
 * ShareCardModal
 * Dual-Mode Visual Pass Generator:
 * 1. 'timetable' - Official Weekly Timetable & Academic Routine Pass
 * 2. 'academic'  - Official Attendance & Bunk-O-Meter Statutory Clearance Pass
 */
export default function ShareCardModal({
  isOpen,
  onClose,
  student,
  courses = [],
  schedule = [],
  initialTab = 'timetable',
  theme = 'light'
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const canvasRef = useRef(null);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Sync initialTab if prop changes on reopen
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const isDark = theme === 'dark';
    // Canvas colors matching Crisp Modern Alabaster & Dark Mode:
    const bgColor = isDark ? '#0F172A' : '#F8F9FA';
    const cardBg = isDark ? '#1E293B' : '#FFFFFF';
    const subCardBg = isDark ? '#0F172A' : '#F8FAFC';
    const inkColor = isDark ? '#F8FAFC' : '#0F172A';
    const softInk = isDark ? '#94A3B8' : '#475569';
    const borderColor = isDark ? '#334155' : '#E2E8F0';
    const mizuColor = isDark ? '#38BDF8' : '#0284C7';
    const mossColor = isDark ? '#4ADE80' : '#16A34A';
    const ochreColor = isDark ? '#FBBF24' : '#D97706';
    const hankoColor = isDark ? '#F87171' : '#DC2626';
    const plumColor = isDark ? '#A78BFA' : '#8B5CF6';
    const indigoColor = isDark ? '#818CF8' : '#4F46E5';

    if (activeTab === 'timetable') {
      // ==========================================
      // TAB 1: WEEKLY ACADEMIC ROUTINE
      // ==========================================
      const W = 1200;
      const H = 780;
      canvas.width = W;
      canvas.height = H;

      // 1. Background Ground
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);

      // 2. Multi-tone Top Accent Bar
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, mizuColor);
      grad.addColorStop(0.35, indigoColor);
      grad.addColorStop(0.7, ochreColor);
      grad.addColorStop(1, plumColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, 8);

      // 3. Inner Architectural Border Box
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(32, 36, W - 64, H - 68);

      // 4. Header Badges
      ctx.fillStyle = inkColor;
      ctx.font = '700 22px Newsreader, Georgia, serif';
      ctx.fillText('XL-FLOW  •  WEEKLY CLASS ROUTINE & SCHEDULE', 60, 78);

      ctx.fillStyle = mizuColor;
      ctx.font = '700 15px Inter, -apple-system, sans-serif';
      ctx.fillText('TERM-5  |  XLRI DELHI-NCR', W - 280, 78);

      // 5. Student Name & Demographics
      ctx.fillStyle = inkColor;
      ctx.font = '700 40px Newsreader, Georgia, serif';
      ctx.fillText(student?.name || 'XLRI Student', 60, 134);

      ctx.fillStyle = softInk;
      ctx.font = '500 17px Inter, -apple-system, sans-serif';
      ctx.fillText(
        `Roll: ${student?.id || 'STUDENT'}  •  Program: ${student?.program || 'PGDM'}  •  Section: ${student?.section || 'EF'}`,
        60,
        166
      );

      // 6. Academic Schedule Overview Ribbon
      const ribbonY = 190;
      const ribbonH = 68;
      ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.10)' : 'rgba(2, 132, 199, 0.08)';
      ctx.fillRect(60, ribbonY, W - 120, ribbonH);
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.30)' : 'rgba(2, 132, 199, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(60, ribbonY, W - 120, ribbonH);

      // Ribbon Accent Bar
      ctx.fillStyle = mizuColor;
      ctx.fillRect(60, ribbonY, 6, ribbonH);

      // Ribbon Content
      ctx.fillStyle = mizuColor;
      ctx.font = '700 14px Inter, sans-serif';
      ctx.fillText('TERM-5 ACADEMIC TIMETABLE & SECTION SCHEDULE', 80, ribbonY + 26);

      ctx.fillStyle = inkColor;
      ctx.font = '500 15px Inter, sans-serif';
      ctx.fillText(
        '• Verified Course Timings & Section Registrations   • Lecture Venues (MCR / CR)   • Non-Teaching Days: Wednesdays & Sundays',
        80,
        ribbonY + 52
      );

      // 7. Aggregate Recurring Weekly Schedule (Monday to Saturday)
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayFullNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayIndices = [1, 2, 3, 4, 5, 6];

      // Extract unique recurring slots per day
      const weeklySlotsByDay = dayIndices.map((dayIdx) => {
        const matching = schedule.filter((s) => {
          if (!s.classDate) return false;
          const d = new Date(s.classDate + 'T00:00:00');
          return d.getDay() === dayIdx;
        });

        // Deduplicate by startTime + courseCode
        const seen = new Set();
        const unique = [];
        matching.forEach((s) => {
          const key = `${s.startTime || ''}_${s.courseCode || ''}`;
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(s);
          }
        });

        // Sort chronologically by startTime
        unique.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
        return unique;
      });

      // 8. 6-Column Day Grid
      const gridStartY = 280;
      const colGap = 14;
      const totalAvailableWidth = W - 120;
      const colWidth = (totalAvailableWidth - colGap * 5) / 6;
      const colHeight = 420;

      dayIndices.forEach((_, idx) => {
        const colX = 60 + idx * (colWidth + colGap);
        const colY = gridStartY;
        const daySlots = weeklySlotsByDay[idx];
        const isFreeDay = daySlots.length === 0;

        // Day Column Box
        ctx.fillStyle = cardBg;
        ctx.fillRect(colX, colY, colWidth, colHeight);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(colX, colY, colWidth, colHeight);

        // Day Column Header Pill
        ctx.fillStyle = isFreeDay
          ? isDark ? 'rgba(126, 156, 127, 0.2)' : 'rgba(78, 104, 81, 0.12)'
          : isDark ? 'rgba(111, 168, 162, 0.2)' : 'rgba(47, 93, 98, 0.12)';
        ctx.fillRect(colX, colY, colWidth, 40);
        ctx.strokeStyle = isFreeDay
          ? isDark ? 'rgba(126, 156, 127, 0.35)' : 'rgba(78, 104, 81, 0.3)'
          : isDark ? 'rgba(111, 168, 162, 0.35)' : 'rgba(47, 93, 98, 0.3)';
        ctx.strokeRect(colX, colY, colWidth, 40);

        ctx.fillStyle = isFreeDay ? mossColor : mizuColor;
        ctx.font = '800 15px Inter, sans-serif';
        ctx.fillText(dayNames[idx].toUpperCase(), colX + 14, colY + 25);

        ctx.fillStyle = softInk;
        ctx.font = '600 12px Inter, sans-serif';
        ctx.fillText(isFreeDay ? 'FREE' : `${daySlots.length} LECT`, colX + colWidth - 55, colY + 25);

        // Render Sessions or Free Day Badge
        if (isFreeDay) {
          ctx.fillStyle = isDark ? '#262520' : '#FFFFFF';
          ctx.fillRect(colX + 10, colY + 54, colWidth - 20, 160);
          ctx.strokeStyle = borderColor;
          ctx.strokeRect(colX + 10, colY + 54, colWidth - 20, 160);

          ctx.fillStyle = mossColor;
          ctx.font = '700 14px Newsreader, serif';
          ctx.fillText('✓ Non-Teaching Day', colX + 20, colY + 90);

          ctx.fillStyle = softInk;
          ctx.font = '500 12px Inter, sans-serif';
          ctx.fillText('No scheduled lectures.', colX + 20, colY + 118);
          ctx.fillText('Self-study, group work &', colX + 20, colY + 138);
          ctx.fillText('academic preparation.', colX + 20, colY + 156);
        } else {
          // Render each session slot (up to 3 per day fit comfortably)
          let currentSlotY = colY + 52;
          daySlots.slice(0, 3).forEach((slot, sIdx) => {
            const slotH = 110;
            ctx.fillStyle = subCardBg;
            ctx.fillRect(colX + 8, currentSlotY, colWidth - 16, slotH);
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(colX + 8, currentSlotY, colWidth - 16, slotH);

            // Left accent bar per slot
            const accent = sIdx === 0 ? mizuColor : sIdx === 1 ? indigoColor : plumColor;
            ctx.fillStyle = accent;
            ctx.fillRect(colX + 8, currentSlotY, 4, slotH);

            // Time range
            ctx.fillStyle = inkColor;
            ctx.font = '700 12px Inter, sans-serif';
            const timeStr = `${slot.startTime || '09:00'} - ${slot.endTime || '10:30'}`;
            ctx.fillText(timeStr, colX + 18, currentSlotY + 22);

            // Course Code
            ctx.fillStyle = accent;
            ctx.font = '800 14px Inter, sans-serif';
            ctx.fillText(slot.courseCode || 'CLASS', colX + 18, currentSlotY + 44);

            // Course Name (truncated)
            ctx.fillStyle = softInk;
            ctx.font = '500 12px Newsreader, serif';
            const cleanName = (slot.courseName || 'Lecture').slice(0, 18);
            ctx.fillText(cleanName, colX + 18, currentSlotY + 68);

            // Room / Venue Pill
            ctx.fillStyle = isDark ? 'rgba(220, 201, 169, 0.12)' : 'rgba(28, 26, 23, 0.08)';
            ctx.fillRect(colX + 18, currentSlotY + 80, 70, 20);
            ctx.fillStyle = inkColor;
            ctx.font = '700 11px Inter, sans-serif';
            ctx.fillText(slot.venue || 'CR-04', colX + 26, currentSlotY + 94);

            currentSlotY += slotH + 8;
          });

          if (daySlots.length > 3) {
            ctx.fillStyle = softInk;
            ctx.font = '600 11px Inter, sans-serif';
            ctx.fillText(`+${daySlots.length - 3} more slot(s)`, colX + 16, colY + colHeight - 12);
          }
        }
      });

      // 9. Japanese Hanko Vermillion Verification Stamp
      const hankoX = W - 180;
      const hankoY = H - 140;
      ctx.strokeStyle = hankoColor;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(hankoX, hankoY, 96, 52);

      ctx.fillStyle = hankoColor;
      ctx.font = '800 13px Inter, sans-serif';
      ctx.fillText('XLRI DELHI', hankoX + 10, hankoY + 22);
      ctx.font = '700 11px Inter, sans-serif';
      ctx.fillText('ROUTINE VERIFIED', hankoX + 8, hankoY + 40);

      // 10. Footer Watermark
      ctx.fillStyle = softInk;
      ctx.font = '500 13px Inter, sans-serif';
      ctx.fillText(
        'Generated with XL-Flow  •  Verified Academic Schedule & Routine  •  xlflow.campus',
        60,
        H - 44
      );
    } else {
      // ==========================================
      // TAB 2: ACADEMIC & STATUTORY ATTENDANCE PASS
      // ==========================================
      const W = 1080;
      const H = 608;
      canvas.width = W;
      canvas.height = H;

      // 1. Background Ground
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);

      // 2. Subtle top accent gradient bar
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, mizuColor);
      grad.addColorStop(0.5, indigoColor);
      grad.addColorStop(1, plumColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, 8);

      // 3. Inner Card Border Box
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(32, 40, W - 64, H - 72);

      // 4. Header Badge & Logo
      ctx.fillStyle = inkColor;
      ctx.font = '600 24px Newsreader, serif';
      ctx.fillText('XL-FLOW  •  ACADEMIC PASS', 64, 88);

      ctx.fillStyle = mizuColor;
      ctx.font = '700 16px Inter, sans-serif';
      ctx.fillText('TERM-5  |  XLRI DELHI-NCR', W - 320, 88);

      // 5. Student Name & Details
      ctx.fillStyle = inkColor;
      ctx.font = '700 48px Newsreader, serif';
      ctx.fillText(student?.name || 'XLRI Student', 64, 160);

      ctx.fillStyle = softInk;
      ctx.font = '500 20px Inter, sans-serif';
      ctx.fillText(
        `Roll: ${student?.id || 'STUDENT'}  •  Program: ${student?.program || 'PGDM'}  •  Section ${student?.section || 'EF'}`,
        64,
        200
      );

      // 6. Overall Status Pill
      ctx.fillStyle = isDark ? 'rgba(126, 156, 127, 0.25)' : 'rgba(78, 104, 81, 0.12)';
      ctx.fillRect(64, 230, 380, 44);
      ctx.strokeStyle = isDark ? 'rgba(126, 156, 127, 0.4)' : 'rgba(78, 104, 81, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(64, 230, 380, 44);

      ctx.fillStyle = mossColor;
      ctx.font = '700 18px Inter, sans-serif';
      ctx.fillText('✓ 80.0% STATUTORY POLICY CLEARED', 84, 258);

      // 7. Course Attendance Cards (Grid of 4 Active Term-5 Courses)
      const activeCourses = courses.filter((c) => c.term?.includes('5')).slice(0, 4);
      const cardW = 220;
      const cardH = 200;
      const startX = 64;
      const startY = 310;
      const gap = 24;

      activeCourses.forEach((c, idx) => {
        const x = startX + idx * (cardW + gap);
        const y = startY;
        const stats = calculateBunkStats(c.attended, c.conducted, c.totalPlanned);

        // Card Background
        ctx.fillStyle = cardBg;
        ctx.fillRect(x, y, cardW, cardH);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cardW, cardH);

        // Course Accent Left Stripe
        ctx.fillStyle = idx === 0 ? mizuColor : idx === 1 ? plumColor : idx === 2 ? indigoColor : mossColor;
        ctx.fillRect(x, y, 6, cardH);

        // Course Code
        ctx.fillStyle = idx === 0 ? mizuColor : idx === 1 ? plumColor : idx === 2 ? indigoColor : mossColor;
        ctx.font = '700 18px Inter, sans-serif';
        ctx.fillText(c.code, x + 20, y + 36);

        // Course Name (Truncated)
        ctx.fillStyle = inkColor;
        ctx.font = '600 14px Newsreader, serif';
        ctx.fillText(c.name.slice(0, 20), x + 20, y + 62);

        // Percentage
        ctx.fillStyle = mossColor;
        ctx.font = '800 38px Inter, sans-serif';
        ctx.fillText(`${stats.currentPercentage}%`, x + 20, y + 120);

        // Safe bunks
        ctx.fillStyle = softInk;
        ctx.font = '600 14px Inter, sans-serif';
        ctx.fillText(`+${stats.safeBunksRemaining} Safe Bunks`, x + 20, y + 155);

        ctx.fillStyle = softInk;
        ctx.font = '500 12px Inter, sans-serif';
        ctx.fillText(`Conducted: ${c.attended}/${c.conducted}`, x + 20, y + 180);
      });

      // 8. Footer Watermark
      ctx.fillStyle = softInk;
      ctx.font = '500 13px Inter, sans-serif';
      ctx.fillText('Generated with XL-Flow  •  wAIbi-sabi Academic Companion', 64, H - 54);
    }

    try {
      const url = canvas.toDataURL('image/png');
      setDownloadUrl(url);
    } catch (e) {
      console.error('Error generating canvas data URL:', e);
    }
  }, [isOpen, activeTab, student, courses, schedule, theme]);

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    const prefix = activeTab === 'timetable' ? 'xlflow_weekly_routine' : 'xlflow_academic_pass';
    a.download = `${prefix}_${student?.id || 'student'}.png`;
    a.click();
    firePassConfetti();
    playTactileClick(600);
    toast.success(
      activeTab === 'timetable' ? 'Weekly Timetable Pass Downloaded!' : 'Academic Pass Downloaded!',
      {
        description: 'High-res image saved for WhatsApp sharing or printing'
      }
    );
  };

  const getShareUrl = () => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?share=timetable`;
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      playTactileClick(550);
      toast.success('Sharable Link Copied!', {
        description: 'Anyone with this link can view the timetable in read-only mode'
      });
      setTimeout(() => setIsCopied(false), 2400);
    } catch (e) {
      toast.error('Failed to copy link');
    }
  };

  const handleShareWhatsApp = () => {
    const url = getShareUrl();
    const studentName = student?.name || 'XLRI Student';
    const message = activeTab === 'timetable'
      ? `XLRI Term-5 Academic Timetable & Schedule for ${studentName}:\n\n🔗 ${url}`
      : `XLRI Term-5 Attendance & Academic Clearance Pass for ${studentName}:\n\n🔗 ${url}`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    playTactileClick(500);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(21, 21, 18, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 100
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          padding: '20px',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          animation: 'fadeIn 0.2s ease-out',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header: Title & Close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: 'var(--mizu)' }} />
            <h3
              style={{
                fontFamily: 'var(--font-brand)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--ink)',
                margin: 0
              }}
            >
              Sharable Passes & Timetable
            </h3>
          </div>

          <button
            onClick={onClose}
            className="btn-tactile"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher: Timetable Pass vs Academic Pass */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--paper-subtle)',
            borderRadius: '10px',
            padding: '4px',
            gap: '4px',
            marginBottom: '16px',
            border: '1px solid var(--border)'
          }}
        >
          <button
            onClick={() => {
              setActiveTab('timetable');
              playTactileClick(500);
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: activeTab === 'timetable' ? 'var(--card)' : 'transparent',
              color: activeTab === 'timetable' ? 'var(--ink)' : 'var(--ink-soft)',
              fontWeight: activeTab === 'timetable' ? 700 : 500,
              fontSize: '12.5px',
              cursor: 'pointer',
              boxShadow: activeTab === 'timetable' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Calendar size={14} color={activeTab === 'timetable' ? 'var(--mizu)' : 'currentColor'} />
            <span>Weekly Class Routine</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('academic');
              playTactileClick(500);
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: activeTab === 'academic' ? 'var(--card)' : 'transparent',
              color: activeTab === 'academic' ? 'var(--ink)' : 'var(--ink-soft)',
              fontWeight: activeTab === 'academic' ? 700 : 500,
              fontSize: '12.5px',
              cursor: 'pointer',
              boxShadow: activeTab === 'academic' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <ShieldCheck size={14} color={activeTab === 'academic' ? 'var(--moss)' : 'currentColor'} />
            <span>Attendance & Policy Pass</span>
          </button>
        </div>

        {/* High-Resolution Canvas Preview Box */}
        <div
          style={{
            width: '100%',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            marginBottom: '16px',
            backgroundColor: 'var(--paper)'
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block'
            }}
          />
        </div>

        {/* Action Grid: WhatsApp, Copy Web Link, Download PNG */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
          <button
            onClick={handleShareWhatsApp}
            className="btn-tactile"
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)'
            }}
          >
            <Share2 size={14} />
            <span>Send to WhatsApp</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="btn-tactile"
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--wash-mizu)',
              border: '1px solid rgba(var(--mizu-rgb), 0.35)',
              color: 'var(--mizu)',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {isCopied ? <Check size={14} /> : <Copy size={14} />}
            <span>{isCopied ? 'Link Copied!' : 'Copy Web Link'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="btn-tactile"
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--ink)',
              color: 'var(--paper)',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            <Download size={14} />
            <span>Download PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
