import React, { useRef, useEffect, useState } from 'react';
import { Download, Share2, X, Check, Sparkles } from 'lucide-react';
import { calculateBunkStats } from '../services/bunkCalculator';
import { firePassConfetti } from '../services/confetti';
import { toast } from 'sonner';

export default function ShareCardModal({ isOpen, onClose, student, courses = [], theme = 'light' }) {
  if (!isOpen) return null;

  const canvasRef = useRef(null);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // High resolution canvas: 1080 x 608 (16:9 approx)
    const W = 1080;
    const H = 608;
    canvas.width = W;
    canvas.height = H;

    const isDark = theme === 'dark';
    // Canvas cannot resolve CSS custom properties, so the palette is literal here.
    // Keep these in sync with the tokens in src/index.css.
    const bgColor = isDark ? '#151512' : '#EFE7D8';
    const cardBg = isDark ? '#1E1E19' : '#F8F2E6';
    const inkColor = isDark ? '#DCC9A9' : '#1C1A17';
    const softInk = isDark ? '#9C8F79' : '#574F41';
    const borderColor = isDark ? '#322F27' : '#DCC9A9';
    const mizuColor = isDark ? '#6FA8A2' : '#2F5D62';
    const mossColor = isDark ? '#7E9C7F' : '#4E6851';
    const ochreColor = isDark ? '#D4A254' : '#B07524';
    const hankoColor = isDark ? '#D9614F' : '#B83A2D';
    const plumColor = isDark ? '#C08E7A' : '#8A5B4C';
    const indigoColor = isDark ? '#7E9CC0' : '#3D5570';

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
    ctx.fillText(student?.name || 'Janmejai Singh', 64, 160);

    ctx.fillStyle = softInk;
    ctx.font = '500 20px Inter, sans-serif';
    ctx.fillText(`Roll: ${student?.id || 'B25349'}  •  Program: ${student?.program || 'PGDM-BMD'}  •  Section EF`, 64, 200);

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
    const activeCourses = courses.filter(c => c.term?.includes('5')).slice(0, 4);
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

    try {
      const url = canvas.toDataURL('image/png');
      setDownloadUrl(url);
    } catch (e) {
      console.error('Error generating canvas data URL:', e);
    }
  }, [isOpen, student, courses, theme]);

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `xlflow_academic_pass_${student?.id || 'B25349'}.png`;
    a.click();
    firePassConfetti();
    toast.success('Academic Pass Downloaded!', {
      description: 'High-res 1080x608 PNG saved for WhatsApp & Instagram'
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(21, 21, 18, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 100
    }}>
      <div style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '560px',
        padding: '20px',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        animation: 'fadeIn 0.2s ease-out',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header with Close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: 'var(--mizu)' }} />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
              Social Academic Pass
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Canvas Preview Container */}
        <div style={{
          width: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          marginBottom: '16px'
        }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block'
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleDownload}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: '10px',
              backgroundColor: 'var(--ink)',
              color: 'var(--paper)',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Download size={15} />
            <span>Download High-Res PNG</span>
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '11px 18px',
              borderRadius: '10px',
              backgroundColor: 'var(--paper)',
              border: '1px solid var(--border)',
              color: 'var(--ink)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
