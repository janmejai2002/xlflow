#!/usr/bin/env python3
"""
Fetch class schedule from XLRI ERP (https://xlerp.xlri.ac.in).
Reads credentials securely from .env without exposing them in chat.
"""

import os
import sys
import json
from datetime import datetime, timedelta
from pathlib import Path
import requests
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

BASE_URL = "https://xlerp.xlri.ac.in/api/v1"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Content-Type": "application/json",
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://xlerp.xlri.ac.in",
    "Referer": "https://xlerp.xlri.ac.in/login",
}


def authenticate(email: str, password: str) -> dict:
    """Authenticates against XLRI API and returns the token data."""
    url = f"{BASE_URL}/auth/login"
    payload = {"email": email.strip(), "password": password.strip()}

    print(f"[*] Authenticating as: {email.strip()}...")
    resp = requests.post(url, json=payload, headers=HEADERS, timeout=15)
    
    if resp.status_code != 200 and resp.status_code != 201:
        print(f"[!] Login failed with HTTP status {resp.status_code}: {resp.text}", file=sys.stderr)
        sys.exit(1)

    return resp.json()


def fetch_classes(token: str):
    """Fetches upcoming sessions, date-range schedule, and enrolled courses."""
    auth_headers = dict(HEADERS)
    auth_headers["Authorization"] = f"Bearer {token}"

    print("[*] Fetching enrolled courses...")
    courses_resp = requests.get(f"{BASE_URL}/course-offerings/my", headers=auth_headers, timeout=15)
    courses_data = courses_resp.json().get("data", []) if courses_resp.ok else []

    print("[*] Fetching upcoming sessions...")
    upcoming_resp = requests.get(f"{BASE_URL}/schedule/my-schedule/student/upcoming", headers=auth_headers, timeout=15)
    upcoming_data = upcoming_resp.json().get("data", {}) if upcoming_resp.ok else {}

    # Fetch full schedule for current month / next 30 days
    today = datetime.now()
    start_date = (today - timedelta(days=7)).strftime("%Y-%m-%d")
    end_date = (today + timedelta(days=45)).strftime("%Y-%m-%d")
    print(f"[*] Fetching schedule from {start_date} to {end_date}...")
    
    schedule_resp = requests.get(
        f"{BASE_URL}/schedule/my-schedule/student",
        headers=auth_headers,
        params={"startDate": start_date, "endDate": end_date},
        timeout=15
    )
    schedule_data = schedule_resp.json().get("data", []) if schedule_resp.ok else []

    return {
        "enrolled_courses": courses_data,
        "upcoming_sessions": upcoming_data,
        "schedule": schedule_data,
        "fetched_at": datetime.now().isoformat()
    }


def format_schedule_markdown(data: dict) -> str:
    """Formats the schedule data into a readable Markdown report."""
    md = []
    md.append("# XLRI Class Schedule & Enrolled Courses\n")
    md.append(f"*Fetched from XLRI ERP at: {data.get('fetched_at', '')[:19].replace('T', ' ')}*\n")

    # 1. Upcoming immediate sessions (Today & Tomorrow)
    upcoming_obj = data.get("upcoming_sessions") or {}
    today_sessions = upcoming_obj.get("today", {}).get("sessions", [])
    tomorrow_sessions = upcoming_obj.get("tomorrow", {}).get("sessions", [])
    all_immediate = today_sessions + tomorrow_sessions

    if all_immediate:
        md.append("## Today & Tomorrow's Classes\n")
        md.append("| Day / Date | Time | Course | Faculty | Venue |")
        md.append("| :--- | :--- | :--- | :--- | :--- |")
        for s in all_immediate:
            dt = s.get("classDate") or s.get("date") or "TBA"
            t_start = (s.get("startTime") or "")[:5]
            t_end = (s.get("endTime") or "")[:5]
            time_str = f"{t_start} - {t_end}" if t_start else "TBA"
            course = s.get("course", {}).get("courseName") or s.get("courseName") or "N/A"
            code = s.get("course", {}).get("courseCode") or s.get("courseCode") or ""
            f = s.get("faculty") or {}
            fac_name = f"{f.get('prefix', '')} {f.get('firstName', '')} {f.get('lastName', '')}".strip() or "TBA"
            v = s.get("venue") or {}
            venue_name = v.get("name") if isinstance(v, dict) else str(v or "TBA")
            md.append(f"| {dt} | {time_str} | **{code}**: {course} | {fac_name} | {venue_name} |")
        md.append("")

    # 2. Complete Schedule Calendar
    sessions = data.get("schedule") or []
    md.append(f"## Upcoming Scheduled Classes ({len(sessions)} Sessions Found)\n")
    if sessions:
        # Sort chronologically
        sessions_sorted = sorted(sessions, key=lambda x: (x.get("classDate", ""), x.get("startTime", "")))
        md.append("| Date | Time | Course Code & Name | Faculty | Section | Venue | Building |")
        md.append("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
        for s in sessions_sorted:
            dt = s.get("classDate") or "TBA"
            t_start = (s.get("startTime") or "")[:5]
            t_end = (s.get("endTime") or "")[:5]
            time_str = f"{t_start} - {t_end}" if t_start else "TBA"
            course_obj = s.get("course") or {}
            c_name = course_obj.get("courseName") or "N/A"
            c_code = course_obj.get("courseCode") or ""
            course_str = f"**{c_code}**: {c_name}" if c_code else f"**{c_name}**"

            f = s.get("faculty") or {}
            fac_name = f"{f.get('prefix', '')} {f.get('firstName', '')} {f.get('lastName', '')}".strip() or "TBA"
            sec = (s.get("section") or {}).get("sectionName") or "N/A"
            v = s.get("venue") or {}
            v_name = v.get("name") or "TBA"
            v_bld = v.get("building") or "Campus"

            md.append(f"| {dt} | {time_str} | {course_str} | {fac_name} | {sec} | {v_name} | {v_bld} |")
    else:
        md.append("_No class sessions currently scheduled in this window._\n")

    # 3. Enrolled Courses
    courses = data.get("enrolled_courses") or []
    md.append(f"\n## Enrolled Courses ({len(courses)} Courses)\n")
    if courses:
        md.append("| Course Code | Course Name | Credits | Type | Term |")
        md.append("| :--- | :--- | :--- | :--- | :--- |")
        for c in courses:
            c_info = c.get("course") or {}
            code = c_info.get("courseCode") or c.get("courseOfferCode") or "N/A"
            name = c_info.get("courseName") or "N/A"
            credits = c.get("credit") or str(c_info.get("credits", "N/A"))
            ctype = c.get("type") or "Core"
            terms = ", ".join([t.get("termName", "") for t in c.get("terms", []) if t.get("termName")]) or "Current Term"
            md.append(f"| {code} | **{name}** | {credits} | {ctype} | {terms} |")
    else:
        md.append("_No enrolled courses found._\n")

    return "\n".join(md)


def main():
    email = os.getenv("XLRI_EMAIL")
    password = os.getenv("XLRI_PASSWORD")

    if not email or not password or "your_id" in email or "your_password" in password:
        print("[!] Error: Please set XLRI_EMAIL and XLRI_PASSWORD in your .env file first!", file=sys.stderr)
        sys.exit(1)

    auth_res = authenticate(email, password)
    res_data = auth_res.get("data", {})
    token = res_data.get("token")

    if not token:
        print(f"[!] Could not extract token from response: {auth_res}", file=sys.stderr)
        sys.exit(1)

    print("[+] Successfully logged in!")
    schedule_info = fetch_classes(token)

    # Save to JSON
    json_path = BASE_DIR / "xlri_schedule.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(schedule_info, f, indent=2, ensure_ascii=False)
    print(f"[+] Saved raw data to: {json_path}")

    # Save to Markdown
    md_content = format_schedule_markdown(schedule_info)
    md_path = BASE_DIR / "xlri_schedule.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"[+] Saved formatted schedule to: {md_path}")

    print("\n" + "="*60)
    print(md_content)
    print("="*60)


if __name__ == "__main__":
    main()
