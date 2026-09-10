import React, { useState } from 'react';
import {
  Compass,
  ShieldCheck,
  Palmtree,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import { fireStreakConfetti } from '../services/confetti';
import { playTactileClick } from '../services/soundEngine';

const TOUR_SLIDES = [
  {
    id: 'radar',
    sectorNum: '01',
    title: "Today's Radar & Next Class HUD",
    tagline: 'Zero Search. Instant Room Codes.',
    icon: Compass,
    iconColor: 'var(--mizu)',
    iconBg: 'var(--wash-mizu)',
    description:
      'Never search through PDFs or emails for your classroom. Your next lecture is pinned at the top with a high-contrast room code (1-click copy), live countdown timer, and 1-tap attendance check-in as you step into class.',
    highlights: [
      '📍 1-Click Room Code copy (e.g. MCR 07)',
      '⏱️ Live countdown timer to next session',
      '✅ 1-Tap [Present / Bunk] attendance check-in'
    ]
  },
  {
    id: 'bunks',
    sectorNum: '03',
    title: 'Bunk-O-Meter Attendance Predictor',
    tagline: 'Zero Mental Math. 80% Statutory Rule.',
    icon: ShieldCheck,
    iconColor: 'var(--moss)',
    iconBg: 'var(--wash-moss)',
    description:
      "XLRI enforces a strict 80.0% minimum attendance threshold. The Bunk-O-Meter calculates your exact safety margin in plain English: see precisely how many classes you can skip without risk, or simulate future skips with instant sliders.",
    highlights: [
      '🛡️ Plain-English badges: "+4 Bunks Available"',
      '🚨 Debarment alerts before you cross below 80%',
      '📝 Sovereign self-attendance log when ERP lags'
    ]
  },
  {
    id: 'getaways',
    sectorNum: '04',
    title: 'Long Weekend & Getaway Optimizer',
    tagline: 'Vacation Arbitrage for MBA Students.',
    icon: Palmtree,
    iconColor: 'var(--ochre)',
    iconBg: 'var(--wash-ochre)',
    description:
      "Discover natural travel windows across the term. We cross-reference your class schedule against official campus holidays to reveal 4-to-5 day long weekends that require skipping only 1 or 2 low-risk lectures.",
    highlights: [
      '🏖️ Pre-calculated 4-5 day travel windows',
      '📊 Cost-per-trip: see exact attendance impact',
      '🎯 Zero-exam conflict verification'
    ]
  },
  {
    id: 'social',
    sectorNum: '06',
    title: 'Campus Social & Free Slot Finder',
    tagline: 'Zero Clash Coordination with Squads.',
    icon: Users,
    iconColor: 'var(--plum)',
    iconBg: 'var(--wash-plum)',
    description:
      "End the endless WhatsApp polling for group meetings. Form study squads with a 6-character code to instantly overlay timetables and uncover mutual free slots for case prep and committee meetings.",
    highlights: [
      '🤝 Automated clash-free meeting slot heatmap',
      '📍 Temporary opt-in campus presence beacons',
      '📲 1-Tap WhatsApp meeting invites'
    ]
  }
];

export default function QuickTourModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const slide = TOUR_SLIDES[currentStep];
  const Icon = slide.icon;
  const isLast = currentStep === TOUR_SLIDES.length - 1;

  const handleNext = () => {
    playTactileClick(650);
    if (isLast) {
      fireStreakConfetti();
      localStorage.setItem('has_seen_quick_tour_v1', 'true');
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    playTactileClick(500);
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleSkip = () => {
    playTactileClick(400);
    localStorage.setItem('has_seen_quick_tour_v1', 'true');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        backgroundColor: 'var(--card)',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
        width: '100%',
        maxWidth: '560px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Top Progress Bar & Close */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 22px 12px 22px',
          borderBottom: '1px solid var(--border-soft)'
        }}>
          {/* Slide Indicator Dots & Modal Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--mizu)',
              backgroundColor: 'var(--wash-mizu)',
              padding: '2px 8px',
              borderRadius: '6px',
              letterSpacing: '0.04em'
            }}>
              Quick Tour: How XL-Flow Works
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '6px' }}>
              {TOUR_SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(idx)}
                  style={{
                    width: idx === currentStep ? '20px' : '6px',
                    height: '6px',
                    borderRadius: '999px',
                    backgroundColor: idx === currentStep ? 'var(--mizu)' : 'var(--border)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  title={`Jump to step ${idx + 1}`}
                />
              ))}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
              {currentStep + 1} / {TOUR_SLIDES.length}
            </span>
          </div>

          <button
            onClick={handleSkip}
            aria-label="Close quick tour"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '8px',
              transition: 'background-color 0.15s'
            }}
            title="Close tour"
          >
            <X size={18} />
          </button>
        </div>

        {/* Slide Content */}
        <div style={{ padding: '26px 24px 20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Slide Hero Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              backgroundColor: slide.iconBg,
              color: slide.iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}>
              <Icon size={24} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: slide.iconColor,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}>
                  SECTOR {slide.sectorNum}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>•</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-soft)' }}>
                  {slide.tagline}
                </span>
              </div>
              <h2 style={{
                fontFamily: 'var(--font-brand)',
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--ink)',
                margin: '3px 0 0 0',
                letterSpacing: '-0.02em',
                lineHeight: 1.25
              }}>
                {slide.title}
              </h2>
            </div>
          </div>

          {/* Description Paragraph */}
          <p style={{
            fontSize: '13.5px',
            color: 'var(--ink-soft)',
            lineHeight: 1.55,
            margin: 0
          }}>
            {slide.description}
          </p>

          {/* Key Feature Highlights */}
          <div style={{
            backgroundColor: 'var(--paper)',
            borderRadius: '14px',
            border: '1px solid var(--border)',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {slide.highlights.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--ink)', fontWeight: 600 }}>
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '14px 24px 18px 24px',
          borderTop: '1px solid var(--border-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {currentStep > 0 ? (
            <button
              onClick={handlePrev}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                backgroundColor: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--ink)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={14} />
              <span>Previous</span>
            </button>
          ) : (
            <button
              onClick={handleSkip}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--ink-soft)',
                fontSize: '12px',
                cursor: 'pointer',
                padding: '8px 4px'
              }}
            >
              Skip Tour
            </button>
          )}

          <button
            onClick={handleNext}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '10px',
              backgroundColor: isLast ? 'var(--moss)' : 'var(--ink)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-card)',
              transition: 'transform 0.15s ease'
            }}
          >
            <span>{isLast ? 'Get Started 🎉' : 'Next Feature'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
