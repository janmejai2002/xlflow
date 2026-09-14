/**
 * ERP Integration Layer for XLFlow Cloudflare Worker
 * Supports both:
 *  1. Real-time Live XLRI ERP REST API (https://xlerp.xlri.ac.in/api/v1)
 *  2. High-speed Offline / Downtime Fallback Cache
 */

export const XLRI_API_BASE = "https://xlerp.xlri.ac.in/api/v1";

const HEADERS = {
  "Content-Type": "application/json",
  "Accept": "application/json",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
};

export const STATUTORY_THRESHOLD = 0.80; // XLRI 80.0% statutory minimum

export interface CourseData {
  id?: string;
  code: string;
  name: string;
  faculty: string;
  credits: number;
  attended: number;
  conducted: number;
  totalPlanned: number;
}

export interface BunkStats {
  courseCode: string;
  courseName: string;
  faculty: string;
  attended: number;
  conducted: number;
  remaining: number;
  currentPercentage: number;
  safeBunksRemaining: number;
  safeImmediateBunks: number;
  recoveryRequired: number;
  isDebarredRisk: boolean;
  tier: "safe" | "warning" | "danger";
}

// -----------------------------------------------------------------------------
// 1. Live XLRI ERP API Integration
// -----------------------------------------------------------------------------

/** Authenticates user directly against XLRI portal and returns Bearer token */
export async function loginToXlerp(email: string, password: string): Promise<{ token?: string; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${XLRI_API_BASE}/auth/login`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    const data = await res.json() as { success?: boolean; data?: { token?: string }; message?: string };
    if (!res.ok || !data.success || !data.data?.token) {
      return { error: data.message || "Invalid campus email or ERP password." };
    }

    return { token: data.data.token };
  } catch (err) {
    return { error: `Could not reach XLRI ERP: ${(err as Error).message}` };
  }
}

/** Fetches real-time course list and live attendance per course */
export async function fetchLiveAttendance(erpToken: string): Promise<BunkStats[] | null> {
  try {
    const authHeaders = { ...HEADERS, Authorization: `Bearer ${erpToken}` };

    // 1. Fetch Enrolled Courses
    const coursesRes = await fetch(`${XLRI_API_BASE}/course-offerings/my`, {
      headers: authHeaders
    });
    if (!coursesRes.ok) return null;

    const coursesJson = await coursesRes.json() as { data?: any[] };
    const rawCourses = coursesJson.data || [];
    if (rawCourses.length === 0) return null;

    // 2. Fetch live attendance for each enrolled course in parallel
    const courseStats = await Promise.all(
      rawCourses.map(async (c: any) => {
        const cid = c.id;
        const cInfo = c.course || {};
        const code = (cInfo.courseCode || c.courseCode || "ELECTIVE").toUpperCase();
        const name = cInfo.courseName || c.courseName || "Untitled Course";
        const f = c.faculty || {};
        const faculty = `${f.prefix || ""} ${f.firstName || ""} ${f.lastName || ""}`.trim() || "Faculty TBA";
        const credits = cInfo.credits || 3.0;
        const totalPlanned = cInfo.totalSessions || 20;

        let attended = 0;
        let conducted = 0;

        if (cid) {
          try {
            const attRes = await fetch(`${XLRI_API_BASE}/attendance/course-offer/${cid}/me`, {
              headers: authHeaders
            });
            if (attRes.ok) {
              const attJson = await attRes.json() as { data?: { summary?: { present?: number; conducted?: number } } };
              const summ = attJson.data?.summary || {};
              attended = summ.present || 0;
              conducted = summ.conducted || 0;
            }
          } catch {
            // Keep 0 if single call fails
          }
        }

        return computeStats({
          id: cid,
          code,
          name,
          faculty,
          credits,
          attended,
          conducted,
          totalPlanned
        });
      })
    );

    return courseStats;
  } catch {
    return null;
  }
}

/** Fetches real-time rolling calendar schedule */
export async function fetchLiveSchedule(
  erpToken: string,
  startDate?: string,
  endDate?: string
): Promise<any[] | null> {
  try {
    const today = new Date();
    const start = startDate || new Date(today.getTime() - 2 * 86400000).toISOString().split("T")[0];
    const end = endDate || new Date(today.getTime() + 30 * 86400000).toISOString().split("T")[0];

    const authHeaders = { ...HEADERS, Authorization: `Bearer ${erpToken}` };
    const res = await fetch(`${XLRI_API_BASE}/schedule/my-schedule/student?startDate=${start}&endDate=${end}`, {
      headers: authHeaders
    });
    if (!res.ok) return null;

    const json = await res.json() as { data?: any[] };
    const sessions = json.data || [];

    return sessions.map((s: any) => {
      const f = s.faculty || {};
      const v = s.venue || {};
      const course = s.course || {};
      return {
        date: s.classDate || s.date || "TBA",
        time: `${(s.startTime || "").slice(0, 5)} - ${(s.endTime || "").slice(0, 5)}`,
        courseCode: (course.courseCode || s.courseCode || "").toUpperCase(),
        courseName: course.courseName || s.courseName || "Untitled",
        faculty: `${f.prefix || ""} ${f.firstName || ""} ${f.lastName || ""}`.trim() || "Faculty TBA",
        room: v.name || v.code || String(v || "CR-TBA"),
        status: s.status || "Scheduled"
      };
    });
  } catch {
    return null;
  }
}

/** Fetches immediate upcoming sessions (Today & Tomorrow) */
export async function fetchUpcomingImmediate(erpToken: string): Promise<any | null> {
  try {
    const authHeaders = { ...HEADERS, Authorization: `Bearer ${erpToken}` };
    const res = await fetch(`${XLRI_API_BASE}/schedule/my-schedule/student/upcoming`, {
      headers: authHeaders
    });
    if (!res.ok) return null;

    const json = await res.json() as { data?: any };
    return json.data || null;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// 2. High-Speed Offline / Fallback Cache
// -----------------------------------------------------------------------------

export const CACHED_COURSES: CourseData[] = [
  { code: "OMCR", name: "Omnichannel Retailing", faculty: "Dr. Smitu Malhotra", credits: 3.0, attended: 14, conducted: 16, totalPlanned: 20 },
  { code: "BDM", name: "Brand Management", faculty: "Dr. Madhu Mandal", credits: 3.0, attended: 15, conducted: 16, totalPlanned: 20 },
  { code: "B2B", name: "Business to Business Marketing", faculty: "Dr. Mohit Malhan", credits: 3.0, attended: 13, conducted: 16, totalPlanned: 20 },
  { code: "IMCE", name: "Int'l Business Models for Circular Economy", faculty: "Dr. Sanchayan Nath", credits: 3.0, attended: 12, conducted: 15, totalPlanned: 19 },
  { code: "EGB", name: "Economics of Green Business", faculty: "Dr. Sunil Kumar", credits: 1.5, attended: 8, conducted: 10, totalPlanned: 10 },
  { code: "PEVC", name: "Private Equity and Venture Capital", faculty: "Prof. Abhimanyu", credits: 3.0, attended: 14, conducted: 15, totalPlanned: 20 }
];

export const CACHED_SCHEDULE = [
  { date: "2026-09-15", time: "09:00 - 10:30", courseCode: "OMCR", courseName: "Omnichannel Retailing", room: "CR-201", faculty: "Dr. Smitu Malhotra", status: "Scheduled" },
  { date: "2026-09-15", time: "11:00 - 12:30", courseCode: "BDM", courseName: "Brand Management", room: "CR-203", faculty: "Dr. Madhu Mandal", status: "Scheduled" },
  { date: "2026-09-16", time: "09:00 - 10:30", courseCode: "B2B", courseName: "B2B Marketing", room: "CR-201", faculty: "Dr. Mohit Malhan", status: "Scheduled" },
  { date: "2026-09-16", time: "14:00 - 15:30", courseCode: "IMCE", courseName: "Circular Economy", room: "CR-104", faculty: "Dr. Sanchayan Nath", status: "Scheduled" },
  { date: "2026-09-17", time: "10:00 - 11:30", courseCode: "PEVC", courseName: "PE & VC", room: "CR-302", faculty: "Prof. Abhimanyu", status: "Scheduled" }
];

export const CACHED_DEADLINES = [
  { date: "2026-09-18", courseCode: "OMCR", title: "Omnichannel Case Analysis (Nike D2C)", type: "Case Submission", priority: "High" },
  { date: "2026-09-22", courseCode: "BDM", title: "Brand Audit Presentation Deck", type: "Group Project", priority: "Critical" },
  { date: "2026-09-25", courseCode: "B2B", title: "Sales Funnel Architecture Document", type: "Assignment", priority: "Medium" },
  { date: "2026-10-05", courseCode: "PEVC", title: "Mid-Term Examination", type: "Exam", priority: "High" }
];

export const ROSTER = [
  { roll: "B25301", name: "Aarav Sharma", section: "E" },
  { roll: "B25312", name: "Aditi Rao", section: "E" },
  { roll: "B25350", name: "Ananya Patel", section: "E" },
  { roll: "B25368", name: "Pooja Verma", section: "F" },
  { roll: "B25389", name: "Rohan Nair", section: "F" },
  { roll: "B25410", name: "Sneha Mukherjee", section: "G" },
  { roll: "B25425", name: "Vikram Malhotra", section: "G" }
];

// -----------------------------------------------------------------------------
// 3. Mathematical Bunk Engine
// -----------------------------------------------------------------------------

export function computeStats(course: CourseData, threshold = STATUTORY_THRESHOLD): BunkStats {
  const A = Number(course.attended) || 0;
  const C = Number(course.conducted) || 0;
  const N = Math.max(course.totalPlanned || 20, C);
  const R = Math.max(0, N - C);

  const currentPercentage = C > 0 ? (A / C) * 100 : 100.0;
  const safeAcrossRemaining = Math.floor(Number(((A + R) - (threshold * N)).toFixed(6)));
  const safeBunksRemaining = Math.max(0, Math.min(R, safeAcrossRemaining));
  const safeImmediate = Math.floor(Number(((A / threshold) - C).toFixed(6)));
  const safeImmediateBunks = Math.max(0, Math.min(R, safeImmediate));

  let recoveryRequired = 0;
  let isDebarredRisk = false;
  if (currentPercentage < threshold * 100) {
    const rawReq = Math.ceil(Number(((threshold * C - A) / (1 - threshold)).toFixed(6)));
    recoveryRequired = Math.max(0, rawReq);
    if (recoveryRequired > R) isDebarredRisk = true;
  }

  let tier: "safe" | "warning" | "danger" = "safe";
  if (currentPercentage < threshold * 100 || isDebarredRisk) tier = "danger";
  else if (currentPercentage < 85.0 || safeBunksRemaining <= 1) tier = "warning";

  return {
    courseCode: course.code,
    courseName: course.name,
    faculty: course.faculty,
    attended: A,
    conducted: C,
    remaining: R,
    currentPercentage: Number(currentPercentage.toFixed(1)),
    safeBunksRemaining,
    safeImmediateBunks,
    recoveryRequired,
    isDebarredRisk,
    tier
  };
}
