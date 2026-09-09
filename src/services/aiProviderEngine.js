/**
 * Universal Free AI Provider Engine for XL-Flow
 * Supports:
 *  1. Astra Instant (Deterministic offline engine - 0ms latency, zero API keys, zero errors)
 *  2. Google Gemini 2.0 Flash (Free tier via Google AI Studio - 1,500 RPD free)
 *  3. Groq Cloud (Free tier LLaMA-3.3-70B-Versatile - 30 RPM free)
 *  4. OpenRouter Free Tier (Llama 3.2, DeepSeek R1 free models)
 *  5. Custom Local Endpoint (Ollama / LM Studio / Localhost)
 */

import { processCopilotMessage } from './copilotEngine';
import { calculateBunkStats, simulateAttendance, STATUTORY_THRESHOLD } from './bunkCalculator';
import { findNaturalGetaways } from './tripPlanner';
import { BATCH_ROSTER } from '../data/rosterData';

export const AI_PROVIDERS = {
  ASTRA: {
    id: 'astra-instant',
    name: 'Astra Instant (Deterministic)',
    description: 'Guaranteed accurate calculations, zero latency, works 100% offline without API keys.',
    badge: 'Free & Offline',
    requiresKey: false
  },
  GEMINI: {
    id: 'gemini-free',
    name: 'Google Gemini 2.0 Flash',
    description: 'Google AI Studio official free tier (15 requests/min, 1,500 requests/day).',
    badge: '1,500 RPD Free',
    requiresKey: true,
    keyHelpUrl: 'https://aistudio.google.com/app/apikey',
    keyPlaceholder: 'AIzaSy...'
  },
  GROQ: {
    id: 'groq-free',
    name: 'Groq Cloud (LLaMA 3.3 70B)',
    description: 'Lightning-fast inference (<300ms) with 30 requests/min free tier.',
    badge: 'Ultra Fast Free',
    requiresKey: true,
    keyHelpUrl: 'https://console.groq.com/keys',
    keyPlaceholder: 'gsk_...'
  },
  OPENROUTER: {
    id: 'openrouter-free',
    name: 'OpenRouter Free Tier',
    description: 'Access DeepSeek R1, LLaMA 3.2, and Gemini Flash Lite free models.',
    badge: 'Free Models',
    requiresKey: true,
    keyHelpUrl: 'https://openrouter.ai/keys',
    keyPlaceholder: 'sk-or-v1-...'
  },
  CUSTOM: {
    id: 'custom-endpoint',
    name: 'Local AI / Ollama Endpoint',
    description: 'Connect to local models running on your computer via Ollama or LM Studio.',
    badge: 'Local Stdio / HTTP',
    requiresKey: false,
    endpointPlaceholder: 'http://localhost:11434/v1/chat/completions'
  }
};

// Storage Helpers
export function getStoredAiConfig() {
  if (typeof window === 'undefined') return { provider: 'astra-instant', keys: {} };
  try {
    const provider = localStorage.getItem('xlflow_ai_provider') || 'astra-instant';
    const rawKeys = localStorage.getItem('xlflow_ai_keys');
    const keys = rawKeys ? JSON.parse(rawKeys) : {};
    return { provider, keys };
  } catch (e) {
    return { provider: 'astra-instant', keys: {} };
  }
}

export function saveStoredAiConfig(provider, keys) {
  if (typeof window === 'undefined') return;
  try {
    if (provider) localStorage.setItem('xlflow_ai_provider', provider);
    if (keys) localStorage.setItem('xlflow_ai_keys', JSON.stringify(keys));
  } catch (e) {
    console.warn('Failed to save AI config to localStorage:', e);
  }
}

// Build compact system context string
function buildAcademicSystemPrompt(context) {
  const { courses = [], schedule = [] } = context;
  const courseList = courses.map(c => {
    const stats = calculateBunkStats(c.attended, c.conducted, c.totalPlanned);
    return `- ${c.code}: ${c.name} (Faculty: ${c.faculty}, Attended: ${c.attended}/${c.conducted}, Safe Bunks: ${stats.safeBunks}, Current: ${stats.currentPercentage.toFixed(1)}%)`;
  }).join('\n');

  const upcomingClasses = schedule.slice(0, 8).map(s => 
    `- ${s.classDate} [${s.startTime}-${s.endTime}]: ${s.courseCode} (${s.courseName}) at ${s.venue} (Faculty: ${s.faculty})`
  ).join('\n');

  return `You are Astra, the official Academic AI Co-Pilot for XLRI students using XL-Flow in Term-5 (Batch 2025-27).
Institute Attendance Policy: Mandatory minimum 80.0% attendance per course. Debarment occurs if attendance drops below 80%.

CURRENT STUDENT ENROLLED COURSES:
${courseList}

UPCOMING SCHEDULE (NEXT 8 LECTURES):
${upcomingClasses}

CAPABILITIES:
1. Attendance Safety: Calculate remaining safe bunks and analyze skipping impacts.
2. Schedule Guidance: Inform the student where and when their next classes are (e.g. MCR 07).
3. Travel Arbitrage: Recommend natural long weekends with 0 exam conflicts.
4. Batchmate Roster: Help locate batchmates across Sections E, F, G.

CRITICAL INSTRUCTIONS:
- Be concise, direct, supportive, and mathematically precise.
- Format responses in clean Markdown.
- If recommending an app action, end your message with an optional JSON action on its own line:
\`\`\`action
{"type": "NAVIGATE_TAB", "tab": "bunkmeter"}
\`\`\`
Supported action types:
- {"type": "NAVIGATE_TAB", "tab": "radar" | "bunkmeter" | "timetable" | "trips" | "deadlines"}
- {"type": "TRIGGER_CELEBRATION"}
- {"type": "TOGGLE_SOUNDSCAPE"}
- {"type": "OPEN_ROSTER", "query": "roll_or_name"}`;
}

// Parse action from AI text
function extractActionFromText(text) {
  const match = text.match(/```action\s*([\s\S]*?)\s*```/);
  if (match) {
    try {
      const action = JSON.parse(match[1].trim());
      const cleanText = text.replace(/```action[\s\S]*?```/, '').trim();
      return { action, cleanText };
    } catch (e) {
      // ignore parse failure
    }
  }
  return { action: null, cleanText: text };
}

/**
 * Universal Query Dispatcher
 */
export async function queryAstraAi(userInput, context = {}) {
  const { provider, keys } = getStoredAiConfig();

  // 1. Google Gemini 2.0 Flash
  if (provider === 'gemini-free' && keys.gemini?.trim()) {
    try {
      const systemPrompt = buildAcademicSystemPrompt(context);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keys.gemini.trim()}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            { role: 'user', parts: [{ text: userInput }] }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 600
          }
        })
      });

      if (!res.ok) {
        const err = await res.text();
        console.warn('[Gemini API error, falling back to Astra Core]:', err);
        return processCopilotMessage(userInput, context);
      }

      const data = await res.json();
      const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawReply) {
        const { action, cleanText } = extractActionFromText(rawReply);
        return {
          reply: cleanText,
          action: action || detectImplicitAction(userInput, cleanText),
          providerName: 'Google Gemini 2.0 Flash'
        };
      }
    } catch (e) {
      console.warn('[Gemini fetch error, falling back]:', e);
      return processCopilotMessage(userInput, context);
    }
  }

  // 2. Groq Cloud (LLaMA 3.3 70B)
  if (provider === 'groq-free' && keys.groq?.trim()) {
    try {
      const systemPrompt = buildAcademicSystemPrompt(context);
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keys.groq.trim()}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userInput }
          ],
          temperature: 0.3,
          max_tokens: 600
        })
      });

      if (!res.ok) {
        console.warn('[Groq API error, falling back to Astra Core]');
        return processCopilotMessage(userInput, context);
      }

      const data = await res.json();
      const rawReply = data.choices?.[0]?.message?.content;
      if (rawReply) {
        const { action, cleanText } = extractActionFromText(rawReply);
        return {
          reply: cleanText,
          action: action || detectImplicitAction(userInput, cleanText),
          providerName: 'Groq LLaMA 3.3 70B'
        };
      }
    } catch (e) {
      console.warn('[Groq fetch error, falling back]:', e);
      return processCopilotMessage(userInput, context);
    }
  }

  // 3. OpenRouter Free Tier
  if (provider === 'openrouter-free' && keys.openrouter?.trim()) {
    try {
      const systemPrompt = buildAcademicSystemPrompt(context);
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keys.openrouter.trim()}`,
          'HTTP-Referer': 'https://janmejai2002.github.io/xlflow/',
          'X-Title': 'XL-Flow'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-lite-preview:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userInput }
          ],
          temperature: 0.3,
          max_tokens: 600
        })
      });

      if (res.ok) {
        const data = await res.json();
        const rawReply = data.choices?.[0]?.message?.content;
        if (rawReply) {
          const { action, cleanText } = extractActionFromText(rawReply);
          return {
            reply: cleanText,
            action: action || detectImplicitAction(userInput, cleanText),
            providerName: 'OpenRouter Free'
          };
        }
      }
    } catch (e) {
      console.warn('[OpenRouter fetch error, falling back]:', e);
    }
  }

  // 4. Default: Instant Deterministic Astra Engine (Guaranteed zero hallucination)
  const defaultRes = processCopilotMessage(userInput, context);
  return {
    ...defaultRes,
    providerName: 'Astra Instant (Deterministic)'
  };
}

// Fallback implicit action detector
function detectImplicitAction(query, reply) {
  const q = query.toLowerCase();
  if (q.includes('bunk') || q.includes('attendance') || q.includes('percent')) {
    return { type: 'NAVIGATE_TAB', tab: 'bunkmeter' };
  }
  if (q.includes('trip') || q.includes('getaway') || q.includes('weekend')) {
    return { type: 'NAVIGATE_TAB', tab: 'trips' };
  }
  if (q.includes('schedule') || q.includes('timetable') || q.includes('calendar')) {
    return { type: 'NAVIGATE_TAB', tab: 'timetable' };
  }
  if (q.includes('deadline') || q.includes('assignment') || q.includes('quiz')) {
    return { type: 'NAVIGATE_TAB', tab: 'deadlines' };
  }
  if (q.includes('streak') || q.includes('celebrate')) {
    return { type: 'TRIGGER_CELEBRATION' };
  }
  return null;
}
