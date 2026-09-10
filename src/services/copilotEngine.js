/**
 * Astra Neural Co-Pilot Engine for XL-Flow
 * Interprets student prompts and maps them directly to executable app actions and insights.
 */

import { calculateBunkStats, simulateAttendance, STATUTORY_THRESHOLD } from './bunkCalculator';
import { findNaturalGetaways } from './tripPlanner';
import { BATCH_ROSTER } from '../data/rosterData';
import { selfAttendanceStore } from './selfAttendanceStore';

export function processCopilotMessage(input, context) {
  const query = input.trim().toLowerCase();
  const { courses = [], schedule = [], deadlines = [] } = context;

  // 1. Simulate Bunk Intent
  if (query.includes('bunk') || query.includes('skip') || query.includes('miss')) {
    let matchedCourse = courses.find(c => {
      const codeMatch = c.code && query.includes(c.code.toLowerCase());
      const nameMatch = c.name && query.includes(c.name.toLowerCase());
      return codeMatch || nameMatch;
    }) || courses[0];

    const skipsMatch = query.match(/(\d+)\s*(classes|class|bunk|bunks|times|sessions)/);
    const skips = skipsMatch ? parseInt(skipsMatch[1], 10) : 1;

    const A = Number(matchedCourse.attended) || 0;
    const C = Number(matchedCourse.conducted) || 0;
    const N = Math.max(Number(matchedCourse.totalPlanned) || 20, C);
    const R = Math.max(0, N - C);

    const stats = calculateBunkStats(A, C, N);
    const safeBunks = stats.safeBunksRemaining;
    let reply = '';
    const isSafe = skips <= safeBunks;

    if (C === 0) {
      // Early-term / Term-5 Kickoff where 0 classes have been conducted so far
      const remainingAttended = Math.max(0, N - skips);
      const projectedTermPct = Number(((remainingAttended / N) * 100).toFixed(1));

      if (isSafe) {
        reply = `For **${matchedCourse.code} (${matchedCourse.name})**, 0 sessions have been conducted so far (Term-5 kickoff).\n\nAcross the **${N} planned sessions**, you have **${safeBunks} safe bunks** in reserve under XLRI's 80% statutory rule.\n\nSkipping **${skips} class${skips > 1 ? 'es' : ''}** projects your term attendance to **${projectedTermPct}%** (${remainingAttended}/${N} attended).\n\n🛡️ **Safe**: You remain comfortably above the mandatory 80.0% threshold.`;
      } else {
        reply = `For **${matchedCourse.code} (${matchedCourse.name})**, 0 sessions have been conducted so far.\n\nSkipping **${skips} classes** exceeds your statutory allowance of **${safeBunks} safe bunks** and drops your projected term attendance to **${projectedTermPct}%**.\n\n⚠️ **Debarment Risk**: This breaches the mandatory 80.0% statutory threshold.`;
      }
    } else {
      // In-progress course
      const projectedImmediate = Number(((A / (C + skips)) * 100).toFixed(1));
      const projectedTerm = Number((((A + Math.max(0, R - skips)) / N) * 100).toFixed(1));

      if (isSafe) {
        reply = `For **${matchedCourse.code} (${matchedCourse.name})**, your current attendance is **${A}/${C} (${stats.currentPercentage}%)** with **${safeBunks} safe bunks** in reserve.\n\nSkipping **${skips} class${skips > 1 ? 'es' : ''}** adjusts your immediate standing to **${projectedImmediate}%** and term projection to **${projectedTerm}%**.\n\n🛡️ **Safe**: You remain above the mandatory 80.0% statutory threshold.`;
      } else {
        reply = `For **${matchedCourse.code} (${matchedCourse.name})**, your current attendance is **${A}/${C} (${stats.currentPercentage}%)**.\n\nSkipping **${skips} class${skips > 1 ? 'es' : ''}** drops your immediate standing to **${projectedImmediate}%** and term trajectory to **${projectedTerm}%**.\n\n⚠️ **Danger**: This breaches the mandatory 80.0% threshold! You will need to attend **${stats.recoveryRequired || 1}** consecutive sessions to recover.`;
      }
    }

    return {
      reply,
      action: {
        type: 'NAVIGATE_AND_SIMULATE',
        tab: 'bunkmeter',
        courseCode: matchedCourse.code,
        skips
      }
    };
  }

  // 2. Next Class / Schedule Intent
  if (query.includes('next class') || query.includes('where') || query.includes('venue') || query.includes('room')) {
    const next = schedule[0];
    if (next) {
      return {
        reply: `Your next lecture is **${next.courseCode} (${next.courseName})** on **${next.classDate}** from **${next.startTime} to ${next.endTime}** at **📍 ${next.venue}** (${next.building || 'Main Block'}). Faculty: **${next.faculty}**.`,
        action: {
          type: 'INSPECT_CLASS',
          session: next
        }
      };
    }
  }

  // 3. Getaways / Trips Intent
  if (query.includes('trip') || query.includes('getaway') || query.includes('holiday') || query.includes('weekend') || query.includes('vacation')) {
    const getaways = findNaturalGetaways(schedule, []);
    const top = getaways[0];
    if (top) {
      return {
        reply: `I discovered a prime **${top.durationDays}-day natural getaway** from **${top.startDate} to ${top.endDate}**! It costs only **${top.classesMissed} class missed** with 0 exam conflicts.`,
        action: {
          type: 'NAVIGATE_TAB',
          tab: 'trips'
        }
      };
    }
  }

  // 4. Batch Roster Search Intent
  if (query.includes('who is') || query.includes('search') || query.includes('roll') || query.includes('find student') || query.includes('classmate')) {
    const rollMatch = query.match(/(\d{3,5})/);
    const nameKeywords = query.replace(/(who is|search|find|classmate|student|roll)/g, '').trim();

    const matched = Object.entries(BATCH_ROSTER).find(([roll, s]) => {
      if (rollMatch && roll.includes(rollMatch[1])) return true;
      if (nameKeywords && s.name.toLowerCase().includes(nameKeywords)) return true;
      return false;
    });

    if (matched) {
      const [roll, s] = matched;
      return {
        reply: `Found **${s.name}** (${roll}) in **Section ${s.section}**.`,
        action: {
          type: 'OPEN_ROSTER',
          query: roll
        }
      };
    }
  }

  // 5. Streak & Motivation Intent
  if (query.includes('streak') || query.includes('celebrate') || query.includes('confetti')) {
    return {
      reply: `Celebrating your **🔥 8-Day Attendance Streak**! Consistency before placement season is paramount. Keep the momentum going!`,
      action: {
        type: 'TRIGGER_CELEBRATION'
      }
    };
  }

  // 6. Ambient Focus Sound Intent
  if (query.includes('music') || query.includes('sound') || query.includes('audio') || query.includes('ambient') || query.includes('focus')) {
    return {
      reply: `Toggling the generative **432 Hz campus binaural study soundscape** to stimulate focus and calm.`,
      action: {
        type: 'TOGGLE_SOUNDSCAPE'
      }
    };
  }

  // 7. Policy & Debarment Explanation
  if (query.includes('policy') || query.includes('debar') || query.includes('rule') || query.includes('threshold')) {
    return {
      reply: `XLRI's academic policy mandates a strict **80.0% minimum attendance** per course. Falling below 80% results in course debarment or grade penalties. XL-Flow's Bunk-O-Meter evaluates safe margins using: $\\lfloor (A + R) - (0.80 \\times N) \\rfloor$.`,
      action: {
        type: 'NAVIGATE_TAB',
        tab: 'bunkmeter'
      }
    };
  }

  // 8. Self Attendance & Discrepancy Intent
  if (query.includes('discrepan') || query.includes('self') || query.includes('ground reality') || query.includes('audit') || query.includes('appeal') || query.includes('dean')) {
    const discrepancies = selfAttendanceStore.getAllDiscrepancies(courses, schedule);
    const storeData = selfAttendanceStore.load();
    const markedSessions = Object.keys(storeData.sessions || {}).length;

    let reply = '';
    if (discrepancies.length > 0) {
      const list = discrepancies.map(d => `• **${d.courseCode}**: ERP shows ${d.officialAttended}/${d.officialConducted}, but your personal log tracks ${d.selfAttended}/${d.selfConducted} (Δ ${d.difference > 0 ? `+${d.difference}` : d.difference}).`).join('\n');
      reply = `I audited your sovereign attendance records against the official ERP snapshot:\n\n⚠️ **${discrepancies.length} Course Discrepanc${discrepancies.length > 1 ? 'ies' : 'y'} Found**:\n${list}\n\nYou have personally logged **${markedSessions} sessions**. You can export a certified Dean Appeal Report or CSV directly from the Self-Log Audit panel in Bunk-O-Meter.`;
    } else {
      reply = `All your courses currently align between your personal log and the official ERP snapshot! You have tracked **${markedSessions} sessions** in sovereign storage. You can mark recent lectures or review historical audit logs anytime in the Bunk-O-Meter.`;
    }

    return {
      reply,
      action: {
        type: 'NAVIGATE_TAB',
        tab: 'bunkmeter'
      }
    };
  }

  // Default intelligent assistant response
  return {
    reply: `I can help you coordinate your Term-5 commitments at XLRI. Try asking:
- *"Can I bunk OMCR this Friday?"*
- *"Where is my next class?"*
- *"Check my attendance discrepancies"*
- *"Find long weekends for a trip"*
- *"Search for roll 349"*
- *"Play 432Hz focus ambient"*`,
    action: null
  };
}
