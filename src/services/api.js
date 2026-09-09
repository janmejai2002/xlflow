import { SAMPLE_STUDENT, SAMPLE_COURSES, SAMPLE_SCHEDULE, SAMPLE_DEADLINES } from '../data/sampleData';

const BASE_URL = '/api/v1';

export const StorageKeys = {
  TOKEN: 'xlflow_token',
  USER_DATA: 'xlflow_user_data',
  THEME: 'xlflow_theme',
  IS_DEMO: 'xlflow_is_demo'
};

export async function loginWithCredentials(email, password) {
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*'
      },
      body: JSON.stringify({ email: email.trim(), password: password.trim() })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed. Please check your credentials.');
    }

    const token = data.data?.token;
    if (!token) throw new Error('Token not received from server.');

    localStorage.setItem(StorageKeys.TOKEN, token);
    localStorage.removeItem(StorageKeys.IS_DEMO);
    return token;
  } catch (err) {
    console.error('Login error:', err);
    throw err;
  }
}

export async function fetchLiveStudentData(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json, text/plain, */*'
  };

  try {
    // 1. Fetch Student Profile
    const meRes = await fetch(`${BASE_URL}/auth/me`, { headers });
    const meData = meRes.ok ? (await meRes.json()).data?.user : SAMPLE_STUDENT;

    // 2. Fetch Courses
    const coursesRes = await fetch(`${BASE_URL}/course-offerings/my`, { headers });
    const rawCourses = coursesRes.ok ? (await coursesRes.json()).data || [] : [];

    // 3. Fetch Schedule (Rolling 45 days)
    const today = new Date();
    const startDate = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + 45 * 86400000).toISOString().split('T')[0];

    const schedRes = await fetch(`${BASE_URL}/schedule/my-schedule/student?startDate=${startDate}&endDate=${endDate}`, { headers });
    const rawSched = schedRes.ok ? (await schedRes.json()).data || [] : [];

    // 4. Fetch Attendance for active courses
    const normalizedCourses = [];
    for (const c of rawCourses) {
      const cid = c.id;
      const cInfo = c.course || {};
      let attended = 0;
      let conducted = 0;
      let totalPlanned = 20;

      try {
        const attRes = await fetch(`${BASE_URL}/attendance/course-offer/${cid}/me`, { headers });
        if (attRes.ok) {
          const attData = (await attRes.json()).data || {};
          const summ = attData.summary || {};
          attended = summ.present || 0;
          conducted = summ.marked || 0;
          totalPlanned = summ.totalSessions || 20;
        }
      } catch (e) {}

      normalizedCourses.push({
        id: cid,
        code: cInfo.courseCode || c.courseOfferCode || 'N/A',
        name: cInfo.courseName || 'Course',
        credits: c.credit || cInfo.credits || 3.0,
        type: c.type || 'Elective',
        term: c.terms?.[0]?.termName || 'Term-5',
        faculty: c.faculty?.[0]?.name || 'Faculty',
        attended,
        conducted,
        totalPlanned
      });
    }

    // 5. Normalize Schedule Sessions
    const normalizedSchedule = rawSched.map(s => ({
      sessionId: s.sessionId || Math.random().toString(),
      classDate: s.classDate,
      startTime: s.startTime,
      endTime: s.endTime,
      courseCode: s.course?.courseCode || 'CLASS',
      courseName: s.course?.courseName || 'Lecture',
      faculty: `${s.faculty?.prefix || ''} ${s.faculty?.firstName || ''} ${s.faculty?.lastName || ''}`.trim() || 'Faculty',
      venue: s.venue?.name || 'MCR 07',
      building: s.venue?.building || 'Academic Building',
      section: s.section?.sectionName || 'EF',
      status: s.status || 'scheduled'
    }));

    // 6. Fetch Deadlines / Activities
    const actRes = await fetch(`${BASE_URL}/class-activities/my`, { headers });
    const rawActs = actRes.ok ? (await actRes.json()).data || [] : [];
    const normalizedDeadlines = rawActs.map(a => ({
      id: a.id,
      courseCode: a.courseCode || 'ACAD',
      title: a.name || a.title || 'Assignment',
      type: a.type || 'Activity',
      dueDate: a.date || a.dueDate || new Date().toISOString(),
      completed: false
    }));

    const fullPayload = {
      student: {
        id: meData.studentId || meData.id || 'B25349',
        name: `${meData.firstName || ''} ${meData.lastName || ''}`.trim() || 'Janmejai Singh',
        email: meData.email || 'student@xlri.ac.in',
        program: meData.program || 'PGDM-BMD',
        batch: '2025-2027',
        term: 'Term-5',
        campus: 'XLRI Delhi-NCR'
      },
      courses: normalizedCourses.length > 0 ? normalizedCourses : SAMPLE_COURSES,
      schedule: normalizedSchedule.length > 0 ? normalizedSchedule : SAMPLE_SCHEDULE,
      deadlines: normalizedDeadlines.length > 0 ? normalizedDeadlines : SAMPLE_DEADLINES,
      lastSync: new Date().toISOString()
    };

    localStorage.setItem(StorageKeys.USER_DATA, JSON.stringify(fullPayload));
    return fullPayload;
  } catch (err) {
    console.error('Error fetching live data, falling back to cache:', err);
    const cached = localStorage.getItem(StorageKeys.USER_DATA);
    if (cached) return JSON.parse(cached);
    return getSampleDataPayload();
  }
}

export function getSampleDataPayload() {
  return {
    student: SAMPLE_STUDENT,
    courses: SAMPLE_COURSES,
    schedule: SAMPLE_SCHEDULE,
    deadlines: SAMPLE_DEADLINES,
    lastSync: new Date().toISOString(),
    isDemo: true
  };
}
