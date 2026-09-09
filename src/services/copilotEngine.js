/**
 * Astra Neural Co-Pilot Engine for XL-Flow
 * Interprets student prompts and maps them directly to executable app actions and insights.
 */

import { calculateBunkStats, simulateAttendance, STATUTORY_THRESHOLD } from './bunkCalculator';
import { findNaturalGetaways } from './tripPlanner';
import { BATCH_ROSTER } from '../data/rosterData';

export function processCopilotMessage(input, context) {
  const query = input.trim().toLowerCase();
  const { courses = [], schedule = [], deadlines = [] } = context;

  // 1. Simulate Bunk Intent
  if (query.includes('bunk') || query.includes('skip') || query.includes('miss')) {
    let matchedCourse = courses.find(c => query.includes(c.code.toLowerCase()) || query.includes(c.name.toLowerCase())) || courses[0];
    const skipsMatch = query.match(/(\d+)\s*(classes|class|bunk|bunks|times)/);
    const skips = skipsMatch ? parseInt(skipsMatch[1], 10) : 1;

    const stats = calculateBunkStats(matchedCourse.attended, matchedCourse.conducted, matchedCourse.totalPlanned);
    const projected = simulateAttendance(matchedCourse.attended, matchedCourse.conducted, 0, skips);
    const isSafe = projected >= STATUTORY_THRESHOLD * 100;

    return {
      reply: `For **${matchedCourse.code} (${matchedCourse.name})**, skipping **${skips} class${skips > 1 ? 'es' : ''}** will adjust your projected attendance to **${projected.toFixed(1)}%**. ${
        isSafe
          ? `You have **${stats.safeBunks} safe bunks** remaining in reserve. You are within the statutory 80% safety margin.`
          : `⚠️ **Danger**: This drops you below the mandatory 80.0% threshold! Immediate recovery required.`
      }`,
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

  // Default intelligent assistant response
  return {
    reply: `I can help you coordinate your Term-5 commitments at XLRI. Try asking:
- *"Can I bunk OMCR this Friday?"*
- *"Where is my next class?"*
- *"Find long weekends for a trip"*
- *"Search for roll 349"*
- *"Play 432Hz focus ambient"*`,
    action: null
  };
}
