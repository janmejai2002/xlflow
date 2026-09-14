/**
 * Course accent colors for wAIbi-sabi design (WCAG 2.1 AA compliant)
 * Extracted into dedicated lightweight module to prevent loading 178-student
 * batch roster into initial timetable and radar view bundles.
 */

export const COURSE_COLORS = {
  OMCR: { accent: 'var(--mizu)', border: 'var(--mizu)', wash: 'rgba(var(--mizu-rgb), 0.12)', bg: 'rgba(var(--mizu-rgb), 0.08)', label: 'Mizu Blue' },
  BDM:  { accent: 'var(--plum)', border: 'var(--plum)', wash: 'rgba(138, 102, 144, 0.12)', bg: 'rgba(138, 102, 144, 0.08)', label: 'Plum Aubergine' },
  B2B:  { accent: 'var(--indigo)', border: 'var(--indigo)', wash: 'rgba(var(--indigo-rgb), 0.12)', bg: 'rgba(var(--indigo-rgb), 0.08)', label: 'Deep Indigo' },
  IMCE: { accent: 'var(--moss)', border: 'var(--moss)', wash: 'rgba(var(--moss-rgb), 0.12)', bg: 'rgba(var(--moss-rgb), 0.08)', label: 'Moss Green' },
  DPCC: { accent: '#C2913A', border: '#C2913A', wash: 'rgba(var(--ochre-rgb), 0.12)', bg: 'rgba(var(--ochre-rgb), 0.08)', label: 'Clay Ochre' },
  DGM:  { accent: '#D2543F', border: '#D2543F', wash: 'rgba(var(--hanko-rgb), 0.12)', bg: 'rgba(var(--hanko-rgb), 0.08)', label: 'Hanko Red' },
  CMN:  { accent: '#5A6B7C', border: '#5A6B7C', wash: 'rgba(90, 107, 124, 0.12)', bg: 'rgba(90, 107, 124, 0.08)', label: 'Slate Gray' },
  CSP:  { accent: '#2D8275', border: '#2D8275', wash: 'rgba(45, 130, 117, 0.12)', bg: 'rgba(45, 130, 117, 0.08)', label: 'Pine Teal' },
  DEFAULT: { accent: 'var(--indigo)', border: 'var(--indigo)', wash: 'rgba(var(--indigo-rgb), 0.10)', bg: 'rgba(var(--indigo-rgb), 0.08)', label: 'Indigo' }
};
