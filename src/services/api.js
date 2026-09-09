import { SAMPLE_STUDENT, SAMPLE_COURSES, SAMPLE_SCHEDULE, SAMPLE_DEADLINES } from '../data/sampleData';

const BASE_URL = 'https://xlerp.xlri.ac.in/api/v1';

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
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email: email.trim(), password: password.trim() })
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error('Non-JSON server response:', text);
      throw new Error(`Server returned non-JSON response (${res.status}). Please verify internet or ERP status.`);
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Login failed. Please check your credentials.');
    }

    const token = data.data?.token;
    if (!token) throw new Error('Authentication token not received from ERP.');

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
    'Accept': 'application/json'
  };

  try {
    // 1. Fetch Student Profile
    let meData = SAMPLE_STUDENT;
    try {
      const meRes = await fetch(`${BASE_URL}/auth/me`, { headers });
      if (meRes.ok) {
        const json = await meRes.json();
        if (json.data?.user) meData = json.data.user;
      }
    } catch (e) {
      console.warn('Could not fetch student profile, using fallback:', e);
    }

    // Extract student roll / ID from email or profile
    const extractedRoll = meData.email ? meData.email.split('@')[0].toUpperCase() : 'B25349';

    // 2. Fetch Enrolled Courses
    let rawCourses = [];
    try {
      const coursesRes = await fetch(`${BASE_URL}/course-offerings/my`, { headers });
      if (coursesRes.ok) {
        const json = await coursesRes.json();
        rawCourses = json.data || [];
      }
    } catch (e) {
      console.warn('Could not fetch courses:', e);
    }

    // 3. Fetch Schedule (Rolling 45 days)
    const today = new Date();
    const startDate = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + 45 * 86400000).toISOString().split('T')[0];

    let rawSched = [];
    try {
      const schedRes = await fetch(`${BASE_URL}/schedule/my-schedule/student?startDate=${startDate}&endDate=${endDate}`, { headers });
      if (schedRes.ok) {
        const json = await schedRes.json();
        rawSched = json.data || [];
      }
    } catch (e) {
      console.warn('Could not fetch schedule:', e);
    }

    // 4. Fetch Attendance for active courses
    const normalizedCourses = [];
    for (const c of rawCourses) {
      const cid = c.id;
      const cInfo = c.course || {};
      let attended = 0;
      let conducted = 0;
      let totalPlanned = 20;

      if (cid) {
        try {
          const attRes = await fetch(`${BASE_URL}/attendance/course-offer/${cid}/me`, { headers });
          if (attRes.ok) {
            const attJson = await attRes.json();
            const summ = attJson.data?.summary || {};
            attended = summ.present || 0;
            conducted = summ.marked || 0;
            totalPlanned = summ.totalSessions || 20;
          }
        } catch (e) {}
      }

      normalizedCourses.push({
        id: cid,
        code: cInfo.courseCode || c.courseOfferCode || 'N/A',
        name: cInfo.courseName || 'Course',
        credits: c.credit || cInfo.credits || 3.0,
        type: c.type || 'Elective',
        term: c.terms?.[0]?.termName?.includes('Term-5') ? 'Term-5' : (c.terms?.[0]?.termName || 'Term-5'),
        faculty: c.faculty?.[0]?.name || (c.faculty?.[0]?.firstName ? `${c.faculty[0].firstName} ${c.faculty[0].lastName || ''}`.trim() : 'Faculty'),
        attended,
        conducted,
        totalPlanned: totalPlanned > 0 ? totalPlanned : 20
      });
    }

    // 5. Normalize Schedule Sessions
    const normalizedSchedule = rawSched.map(s => {
      const fac = s.faculty || {};
      const facName = `${fac.prefix || ''} ${fac.firstName || ''} ${fac.lastName || ''}`.trim() || 'Faculty';
      return {
        sessionId: s.sessionId || Math.random().toString(),
        classDate: s.classDate,
        startTime: s.startTime,
        endTime: s.endTime,
        courseCode: s.course?.courseCode || 'CLASS',
        courseName: s.course?.courseName || 'Lecture',
        faculty: facName,
        venue: s.venue?.name || 'CR-04',
        building: s.venue?.building || 'Academic Building',
        section: s.section?.sectionName || 'EF',
        status: s.status || 'scheduled'
      };
    });

    // 6. Fetch Deadlines / Activities
    let rawActs = [];
    try {
      const actRes = await fetch(`${BASE_URL}/class-activities/my`, { headers });
      if (actRes.ok) {
        const json = await actRes.json();
        rawActs = json.data || [];
      }
    } catch (e) {
      console.warn('Could not fetch class activities:', e);
    }

    const normalizedDeadlines = rawActs.map(a => ({
      id: a.id,
      courseCode: a.courseCode || a.course?.courseCode || 'ACAD',
      title: a.name || a.title || 'Assignment',
      type: a.type || 'Activity',
      dueDate: a.date || a.dueDate || new Date().toISOString(),
      completed: false
    }));

    const fullPayload = {
      student: {
        id: extractedRoll,
        name: `${meData.firstName || ''} ${meData.lastName || ''}`.trim() || 'Janmejai Singh',
        email: meData.email || 'b25349@astra.xlri.ac.in',
        program: meData.program || 'PGDM-BMD',
        batch: '2025-2027',
        term: 'Term-5',
        campus: meData.instituteName || 'XLRI Delhi-NCR'
      },
      courses: normalizedCourses.length > 0 ? normalizedCourses : SAMPLE_COURSES,
      schedule: normalizedSchedule.length > 0 ? normalizedSchedule : SAMPLE_SCHEDULE,
      deadlines: normalizedDeadlines.length > 0 ? normalizedDeadlines : SAMPLE_DEADLINES,
      lastSync: new Date().toISOString(),
      isDemo: false
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
