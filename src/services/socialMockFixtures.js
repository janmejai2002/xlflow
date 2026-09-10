/**
 * Realistic Campus Social Seed Data & Presets
 * Pre-populates live campus presence, hotspots, and study circles
 * for all 178 students in Sections E, F, G.
 */

export const CAMPUS_ZONES = [
  {
    id: 'nescafe',
    name: 'Nescafe & Canteen',
    emoji: '☕',
    tag: 'Social Hub',
    color: 'var(--ochre)',
    wash: 'var(--wash-ochre)',
    description: 'Hot brews, casual discussions, and post-lecture decompressing'
  },
  {
    id: 'library',
    name: 'Sir Jehangir Ghandy Library',
    emoji: '📚',
    tag: 'Quiet Focus',
    color: 'var(--mizu)',
    wash: 'var(--wash-mizu)',
    description: '2nd floor silent reading room, case analysis & term projects'
  },
  {
    id: 'academic',
    name: 'Academic Block (MCR / CR)',
    emoji: '🏢',
    tag: 'In Lectures',
    color: 'var(--indigo)',
    wash: 'var(--wash-indigo)',
    description: 'MCR 07, CR 02, lecture halls, and committee rooms'
  },
  {
    id: 'recreation',
    name: 'Sports Complex & Gym',
    emoji: '🏸',
    tag: 'Wellness',
    color: 'var(--moss)',
    wash: 'var(--wash-moss)',
    description: 'Weight training, badminton courts, lawn walks'
  },
  {
    id: 'hostel',
    name: 'Hostel & Residences',
    emoji: '🛏️',
    tag: 'Dormitory',
    color: 'var(--plum)',
    wash: 'var(--wash-plum)',
    description: 'Dorm study tables and late-night group huddles'
  }
];

export const STATUS_PRESETS = [
  { emoji: '☕', text: 'Coffee at Nescafe • Come join!', zone: 'nescafe', defaultMins: 45 },
  { emoji: '📚', text: 'Deep Focus @ Library 2nd Floor', zone: 'library', defaultMins: 90 },
  { emoji: '⚡', text: 'Free window before next lecture', zone: 'academic', defaultMins: 35 },
  { emoji: '🍱', text: 'Grabbing quick lunch at Mess', zone: 'nescafe', defaultMins: 30 },
  { emoji: '🏋️', text: 'Gym workout session', zone: 'recreation', defaultMins: 60 },
  { emoji: '💻', text: 'Working on Strategy Term Paper', zone: 'library', defaultMins: 120 },
  { emoji: '😴', text: 'Quick power nap in hostel', zone: 'hostel', defaultMins: 45 }
];

export const INITIAL_CIRCLES = [];

export const INITIAL_BATCH_STATUSES = {};

export const INITIAL_FRIENDS_FOR_JANMEJAI = [];

