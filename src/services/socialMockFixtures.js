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

export const INITIAL_CIRCLES = [
  {
    code: 'XL-STRAT',
    name: 'Strategy Term-5 Project Squad',
    courseCode: 'STMAN',
    ownerRoll: 'B25349',
    members: ['B25349', 'B25304', 'B25308', 'B25348'],
    createdAt: '2026-09-08T10:00:00.000Z'
  },
  {
    code: 'XL-OMCR',
    name: 'Omnichannel Retailing Case Team',
    courseCode: 'OMCR',
    ownerRoll: 'B25308',
    members: ['B25308', 'B25349', 'B25350'],
    createdAt: '2026-09-09T14:30:00.000Z'
  },
  {
    code: 'XL-COFFEE',
    name: 'Nescafe Coffee & Break Crew',
    courseCode: 'GENERAL',
    ownerRoll: 'B25317',
    members: ['B25317', 'B25349', 'B25301', 'B25339', 'B25354'],
    createdAt: '2026-09-07T18:00:00.000Z'
  }
];

export const INITIAL_BATCH_STATUSES = {
  'B25301': {
    rollNo: 'B25301',
    name: 'Aakash Lakhangaonkar',
    section: 'E',
    emoji: '☕',
    text: 'Cold coffee at Nescafe with project group',
    zone: 'nescafe',
    updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    expiresAt: Date.now() + 45 * 60000
  },
  'B25304': {
    rollNo: 'B25304',
    name: 'Devika Tyagi',
    section: 'E',
    emoji: '📚',
    text: 'Strategy Case reading @ Library 2nd floor',
    zone: 'library',
    updatedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    expiresAt: Date.now() + 75 * 60000
  },
  'B25308': {
    rollNo: 'B25308',
    name: 'Mayank Jain',
    section: 'E',
    emoji: '⚡',
    text: 'Free until 14:45 • Sitting near MCR 07',
    zone: 'academic',
    updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    expiresAt: Date.now() + 35 * 60000
  },
  'B25317': {
    rollNo: 'B25317',
    name: 'Shreya Monga',
    section: 'E',
    emoji: '☕',
    text: 'Nescafe table 4 • Reviewing elective bids',
    zone: 'nescafe',
    updatedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    expiresAt: Date.now() + 30 * 60000
  },
  'B25348': {
    rollNo: 'B25348',
    name: 'Debashish Das',
    section: 'E',
    emoji: '💻',
    text: 'Preparing PPT for OMCR presentation',
    zone: 'library',
    updatedAt: new Date(Date.now() - 40 * 60000).toISOString(),
    expiresAt: Date.now() + 80 * 60000
  },
  'B25350': {
    rollNo: 'B25350',
    name: 'Kashish Jain',
    section: 'E',
    emoji: '🏸',
    text: 'Badminton match at Sports Complex',
    zone: 'recreation',
    updatedAt: new Date(Date.now() - 20 * 60000).toISOString(),
    expiresAt: Date.now() + 40 * 60000
  },
  'B25354': {
    rollNo: 'B25354',
    name: 'Satyam Singh',
    section: 'E',
    emoji: '☕',
    text: 'Tea Point evening break',
    zone: 'nescafe',
    updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    expiresAt: Date.now() + 55 * 60000
  }
};

export const INITIAL_FRIENDS_FOR_JANMEJAI = [
  'B25304', // Devika Tyagi
  'B25308', // Mayank Jain
  'B25317', // Shreya Monga
  'B25348', // Debashish Das
  'B25350', // Kashish Jain
  'B25354'  // Satyam Singh
];
