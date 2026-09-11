// ============================================================
//  TERM IV COMMAND CENTRE  —  COMPLETE (server writes fixed)
//  Deploy: Web App → Execute as Me → Anyone with link
//  Fixes:
//   • openById() instead of getActiveSpreadsheet() (standalone web app)
//   • userprefs sheet + getPrefs/setPrefs actions (cloud restore)
//   • client: URL-hash fallback + Restore-by-roll flow
//   • syncMark logs failures to console
// ============================================================
const CFG = {
  // TIMETABLE: read-only via CSV export. You only need view access (or link-share).
  TIMETABLE_ID:"1zh5JlvQnNig5ZRKnC5pySK5oyjfG5BjQqv5asLgIm70",
  // DATA: your OWN sheet — attendance + userprefs are written here. Must be editable by you.
  DATA_ID:"1VtmufCVbuBW2hMPZqoAwOWKcBQEfEZTFvvurgFGXhps",
  GID:"0", TERM_START:"2026-06-15", TERM_END:"2026-08-31", MAX_MISS:4,
  // WhatsApp number for the "Submit idea" button — country code + number, DIGITS ONLY
  // (no +, spaces or dashes). e.g. India 98765 43210 → "919876543210".
  WA_NUMBER:"918527561880"
};
const META = {
  BAV:{name:"Business Analysis & Valuation",full:"Business Analysis & Valuation"},
  CMN:{name:"Conflicts & Negotiations",full:"Conflicts Management and Negotiations"},
  CNB:{name:"Consumer Behaviour",full:"Consumer Behaviour"},
  CSP:{name:"Corporate Sustainability",full:"Corporate Sustainability in Practice"},
  DGM:{name:"Digital Marketing",full:"Digital Marketing"},
  DMD:{name:"Debt Markets & Derivatives",full:"Debt Markets and their Derivatives"},
  DPCC:{name:"Digital Product Mgmt",full:"Digital Product Management: C2C"},
  INM:{name:"International Management",full:"International Management"},
  LSC:{name:"Logistics & Supply Chain",full:"Logistics and Supply Chain Management"},
  MABA:{name:"Management of Banking",full:"Management of Banking"},
  PJM:{name:"Project Management",full:"Project Management"},
  PMG:{name:"Product Management",full:"Product Management"},
  PPBS:{name:"Public Policy & Biz Strategy",full:"Public Policy and Business Strategy"},
  QCAM:{name:"Quality Control & Mgmt",full:"Quality Control, Analysis and Management"},
  RBS:{name:"Resource Based Strategy",full:"Resource Based Strategy"},
  SGM:{name:"Strategic Marketing",full:"Strategic Marketing"}
};
const SLOTS = [
  ["8:00 AM",8,0],["8:30–10:00",8,30],["10:20–11:50",10,20],
  ["12:10–1:40",12,10],["2:45–4:15",14,45],["4:30–6:00",16,30],
  ["6:15–7:45",18,15],["8:00–9:30 PM",20,0]
];
// Announcements are now read from the "announcements" tab in your DATA sheet.
// Columns: id | text | type | date | active   (type: info|warn|hot; active: TRUE/blank shows, FALSE hides)
// This const is only a fallback if that tab can't be read.
const ANNOUNCEMENTS = [
  // {id:"1", text:"Term IV begins 15 June — first class 8:30 AM. Good luck everyone!", type:"info", date:"13 Jun"}
];

function doGet(e) {
  var groupParam = (e && e.parameter && e.parameter.group) || "";
  var joinParam  = (e && e.parameter && e.parameter.join)  || "";
  var rollParam  = (e && e.parameter && (e.parameter.roll||e.parameter.u)) || "";
  var viewParam  = (e && e.parameter && e.parameter.view)  || "";
  var hasParam   = groupParam || joinParam || rollParam || viewParam;

  // ── FAST PATH: serve the cached rendered page ──────────────────────────────
  // Base-URL requests (no ?group / ?join / ?roll / ?view) always produce
  // identical HTML, so we cache the whole thing keyed on the timetable sheet's
  // last-modified time.  A cache hit skips ALL data fetching and template work.
  var CACHE_VER = 1; // Bump this to bust the HTML cache on new deployments
  if (!hasParam) {
    try {
      var cache = CacheService.getScriptCache();
      var sig = "";
      try { sig = String(DriveApp.getFileById(CFG.TIMETABLE_ID).getLastUpdated().getTime()); } catch(e0) {}
      if (sig) {
        var pmRaw = cache.get("pg_meta_v" + CACHE_VER);
        if (pmRaw) {
          var pm = JSON.parse(pmRaw);
          if (pm.sig === sig && pm.chunks > 0) {
            var keys = [], j, v;
            for (var i = 0; i < pm.chunks; i++) keys.push("pg_v" + CACHE_VER + "_" + i);
            var got = cache.getAll(keys), parts = [], ok = true;
            for (j = 0; j < pm.chunks; j++) { v = got["pg_v" + CACHE_VER + "_" + j]; if (!v){ok=false;break;} parts.push(v); }
            if (ok) {
              return HtmlService.createHtmlOutput(parts.join(""))
                .setTitle("Term IV · Command Centre")
                .addMetaTag("viewport","width=device-width, initial-scale=1")
                .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
            }
          }
        }
      }
    } catch(eFast) {}
  }

  // ── SLOW PATH: build page fresh ────────────────────────────────────────────
  var sessions=[], err="";
  try { sessions=getSessionsCached_(); } catch(e1) { err=String(e1); }
  var ann=[]; try { ann=getAnnouncementsCached_(); } catch(e2) { ann=ANNOUNCEMENTS; }
  var exams=[]; try { exams=getExamsCached_(); } catch(e3) { exams=[]; }
  var courses={}; try { courses=getCourseInfoCached_(); } catch(e5) { courses={}; }

  var page = PAGE_TMPL
    .replace("__SESSIONS__", JSON.stringify(sessions))
    .replace("__META__",     JSON.stringify(META))
    .replace("__TS__",       CFG.TERM_START)
    .replace("__TE__",       CFG.TERM_END)
    .replace("__MM__",       String(CFG.MAX_MISS))
    .replace("__ERR__",      JSON.stringify(err))
    .replace("__ANN__",      JSON.stringify(ann))
    .replace("__EXAMS__",    JSON.stringify(exams))
    .replace("__COURSES__",  JSON.stringify(courses))
    .replace("__EXEC_URL__", ScriptApp.getService().getUrl())
    .replace("__SHEET_URL__", "https://docs.google.com/spreadsheets/d/"+CFG.TIMETABLE_ID+"/edit")
    .replace("__WA__",       CFG.WA_NUMBER)
    .replace("__ROSTER__",   JSON.stringify(ROSTER))
    .replace("__GROUP__",    JSON.stringify(groupParam).replace(/</g, "\\u003c"))
    .replace("__JOIN__",     JSON.stringify(joinParam).replace(/</g, "\\u003c"))
    .replace("__ROLL__",     JSON.stringify(String(rollParam).trim().toUpperCase()).replace(/</g, "\\u003c"))
    .replace("__VIEW__",     JSON.stringify(String(viewParam).trim().toUpperCase()).replace(/</g, "\\u003c"));

  // Store the rendered page so the next base-URL request hits the fast path.
  // Same Drive-sig key as the session cache, so a timetable edit busts both.
  if (!hasParam) {
    try {
      var sig2 = "";
      try { sig2 = String(DriveApp.getFileById(CFG.TIMETABLE_ID).getLastUpdated().getTime()); } catch(e4) {}
      if (sig2) {
        var cache2 = CacheService.getScriptCache();
        var sz = 90000, nc = Math.ceil(page.length / sz) || 1, put = {};
        for (var k = 0; k < nc; k++) put["pg_v" + CACHE_VER + "_" + k] = page.substr(k * sz, sz);
        cache2.putAll(put, 21600);
        cache2.put("pg_meta_v" + CACHE_VER, JSON.stringify({sig: sig2, chunks: nc}), 21600);
      }
    } catch(eStore) {}
  }

  return HtmlService.createHtmlOutput(page)
    .setTitle("Term IV · Command Centre")
    .addMetaTag("viewport","width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function fetchCSV_() {
  var url="https://docs.google.com/spreadsheets/d/"+CFG.TIMETABLE_ID+"/export?format=csv&gid="+CFG.GID;
  var res=UrlFetchApp.fetch(url,{headers:{Authorization:"Bearer "+ScriptApp.getOAuthToken()},muteHttpExceptions:true});
  if(res.getResponseCode()!==200) throw new Error("HTTP "+res.getResponseCode());
  var text=res.getContentText();
  var ct=res.getHeaders()["Content-Type"]||res.getHeaders()["content-type"]||"";
  // Google occasionally answers a 200 with an HTML sign-in / "request access" page
  // instead of CSV (e.g. a brief sharing-permission hiccup on the master sheet).
  // Treating that as valid CSV would silently produce an empty timetable for every
  // visitor with no error anywhere in the logs — fail loud instead.
  if(String(ct).indexOf("text/html")>=0 || /^\s*<(!doctype|html)/i.test(text)) {
    throw new Error("Timetable export returned HTML instead of CSV — check sharing settings on the master sheet");
  }
  return text;
}

function splitCSV_(text) {
  return text.split("\n").map(function(line){
    var cols=[],q=false,cur="";
    for(var i=0;i<line.length;i++){
      var ch=line[i];
      if(ch==='"')q=!q;
      else if(ch===','&&!q){cols.push(cur.trim());cur="";}
      else cur+=ch;
    }
    cols.push(cur.trim());return cols;
  });
}

// ── CLASSIFICATION ──  Deterministic rules — zero dependencies, always available,
// and the mandatory fallback whenever AI classification (below) is off/unavailable.
function matchCourseCode_(cu) {
  if(cu.indexOf("SGM")>=0) return "SGM";
  var sp=[["BAV","BAV"],["CMN","CMN"],["CNB","CNB"],["DGM","DGM"],["DPCC","DPCC"],["INM","INM"]];
  for(var k=0;k<sp.length;k++) if(cu.indexOf(sp[k][1])===0) return sp[k][0];
  // "PGM" observed live on the master sheet (Aug 2026 block) as a typo of "PMG"
  // (Product Management) — tolerate it rather than dropping 8 real sessions.
  var co=[["CSP","CSP"],["DMD","DMD"],["MABA","MABA"],["PJM","PJM"],["PPBS","PPBS"],["QCAM","QCAM"],["RBS","RBS"],["LSCM","LSC"],["LSC","LSC"],["PMG","PMG"],["PGM","PMG"]];
  for(var j=0;j<co.length;j++) if(cu.indexOf(co[j][0])===0) return co[j][1];
  return null;
}
function isBothSec_(s){return /[EF]\s*&\s*[EF]/i.test(s)||(s.indexOf("SEC E")>=0&&s.indexOf("SEC F")>=0);}
function secOf_(s){if(isBothSec_(s))return "BOTH";var m=s.match(/SEC\s*([EF])/i);return m?m[1].toUpperCase():"BOTH";}
// A regular teaching-session cell -> {code,sec}, or null (blank / registration /
// AOL / unrecognised). Callers MUST check examType_ FIRST and skip this call for
// exam cells, so a quiz/mid-term/end-term is never ALSO counted as a class.
function classifyCell_(cell) {
  var c=String(cell).trim(),cu=c.toUpperCase();
  if(!c) return null;
  if(cu.indexOf("REGISTRATION")>=0||cu.indexOf("AOL")>=0) return null;
  var code=matchCourseCode_(cu);
  return code ? {code:code, sec:secOf_(cu)} : null;
}
// Quiz / mid-term / end-term / AOL / registration-notice keyword detector —
// shown in the assessments panel, never counted toward regular class
// attendance. NOTE: \bQUIZ (no trailing \b) deliberately also matches
// "Quiz1"/"QUIZZES"/"Quiz:" etc. — a trailing \b would silently miss "Quiz1"
// (real cell text: "INM Quiz1(7:30)") since digits count as word characters,
// which is exactly the kind of miss that let a quiz get counted as a class.
function examType_(cell) {
  var u=String(cell).toUpperCase();
  if(/\bQUIZ/.test(u))                          return "Quiz";
  if(/MID[\s\-]*(TERM|SEM)|MIDTERM/.test(u))    return "Mid-Term";
  if(/END[\s\-]*(TERM|SEM)|ENDTERM|FINAL\s*EXAM/.test(u)) return "End-Term";
  if(/\bAOL\b/.test(u))                         return "AOL Exam";
  if(/\bREGISTRATION\b/.test(u))                return "Notice";
  return null;
}

// Inline room-code override ("MCR08", "MCR-07", "LCR 01", ...) parsed straight
// out of a cell's own text. Returns null when the cell doesn't mention one —
// we only ever show a room the sheet explicitly states, never a guess, so a
// parsing miss can never point someone at the wrong room.
function roomOf_(cell) {
  var m=String(cell).toUpperCase().match(/\b(MCR|LCR)[\s-]?0*(\d{1,3})\b/);
  if(!m) return null;
  var num=m[2].length<2?"0"+m[2]:m[2];
  return m[1]+"-"+num;
}
// Parses the "Venue: Sec E X , Sec F Y , Common Z" banner (top of the sheet)
// into per-section default rooms. Best-effort: any row/column shift or
// wording change just yields {} (no defaults) rather than a wrong guess —
// roomOf_() above still works on a per-cell basis regardless.
function defaultVenues_(rows) {
  var out={};
  for(var r=0;r<Math.min(rows.length,3);r++){
    var line=rows[r].join(" ");
    if(!/venue/i.test(line)) continue;
    var e=line.match(/SEC\s*E\s+([\w-]+)/i); if(e) out.E=e[1].replace(/[.,]+$/,"");
    var f=line.match(/SEC\s*F\s+([\w-]+)/i); if(f) out.F=f[1].replace(/[.,]+$/,"");
    var c=line.match(/COMMON\s+([\w-]+)/i);  if(c) out.BOTH=c[1].replace(/[.,]+$/,"");
    break;
  }
  return out;
}
// Course Code | Courses Name | Faculty | TA reference table that the
// committee keeps in the far-right columns of the same sheet. Scanned
// independently of the day/slot grid: any row whose column L looks like
// "<CODE>BD##-#" (e.g. "CMNBD25-4") contributes one entry, wherever it lands.
function parseCourseInfo_(rows) {
  var out={};
  rows.forEach(function(row){
    var raw=(row[11]||"").trim();
    if(!raw) return;
    var m=raw.match(/^([A-Z]{2,6})BD\d+-\d+$/i);
    if(!m) return;
    var code=m[1].toUpperCase();
    if(!META[code]) return;
    out[code]={
      faculty:(row[13]||"").trim().replace(/\s+/g," "),
      ta:(row[14]||"").trim().replace(/\s+/g," ")
    };
  });
  return out;
}

// ── AI-ASSISTED CLASSIFICATION (optional) ──  Set OPENROUTER_API_KEY in
// Project Settings → Script Properties to turn this on. Off by default; every
// failure mode below returns null and the caller falls straight back to
// classifyCell_/examType_ — the timetable must keep working correctly with
// this permanently disabled (no key, model down, bad JSON, rate limit, ...).
function aiClassifyCells_(uniqueTexts) {
  var props=PropertiesService.getScriptProperties();
  var key=props.getProperty("OPENROUTER_API_KEY");
  if(!key || !uniqueTexts || !uniqueTexts.length) return null;
  var model=props.getProperty("OPENROUTER_MODEL") || "meta-llama/llama-3.3-70b-instruct:free";
  var codeList=Object.keys(META).map(function(c){return c+" = "+META[c].full;}).join("\n");
  var sys=[
    "You classify raw cell text copied from a university term timetable spreadsheet.",
    "Each cell is one scheduled slot. Valid course codes and their full names:",
    codeList,
    "",
    "For EVERY input string, decide ONE of:",
    "- \"class\": a regular teaching session for one of the course codes above. Include \"section\": \"E\", \"F\", or \"BOTH\" (both sections combined, or no section mentioned at all).",
    "- \"quiz\": a quiz for a course.",
    "- \"midterm\": a mid-term exam for a course.",
    "- \"endterm\": an end-term / final exam for a course.",
    "- \"aol\": an \"AOL\" assessment (not tied to one course).",
    "- \"ignore\": blank, registration/orientation notices, room-only text, or anything you cannot confidently map to a course above.",
    "",
    "For quiz/midterm/endterm/class, include \"code\" = one exact course code above if you can tell which course, else omit it.",
    "Examples: \"CMN sec E\" -> class CMN section E. \"DPCC (AG) sec F\" -> class DPCC section F (ignore the (AG)/(HK)/(DB) initials — those are just faculty). \"5 SGM Sec F & E combined LCR01\" -> class SGM section BOTH. \"RBS Mid-Term\" -> midterm code RBS. \"DMD Quiz 1 (7:30 AM)\" -> quiz code DMD. \"AOL EXAM\" -> aol. \"Registration Term IV 9:30 am - 12:30 pm\" -> ignore. \"MABA\" -> class MABA section BOTH.",
    "",
    "Respond with ONLY JSON: {\"results\":[{\"text\":<exact input string>,\"kind\":<kind above>,\"code\":<course code, omit if n/a>,\"section\":<E|F|BOTH, class only>}]}",
    "Exactly one result per input string, same order, \"text\" copied verbatim."
  ].join("\n");
  try {
    var res=UrlFetchApp.fetch("https://openrouter.ai/api/v1/chat/completions", {
      method:"post", contentType:"application/json",
      headers:{Authorization:"Bearer "+key},
      payload:JSON.stringify({
        model:model, temperature:0, response_format:{type:"json_object"},
        messages:[{role:"system",content:sys},{role:"user",content:JSON.stringify(uniqueTexts)}]
      }),
      muteHttpExceptions:true
    });
    if(res.getResponseCode()!==200) return null;
    var body=JSON.parse(res.getContentText());
    var content=body&&body.choices&&body.choices[0]&&body.choices[0].message&&body.choices[0].message.content;
    if(!content) return null;
    var parsed=JSON.parse(content);
    if(!parsed||!Array.isArray(parsed.results)) return null;
    var codes=Object.keys(META), out={};
    parsed.results.forEach(function(r){
      if(!r||typeof r.text!=="string") return;
      if(r.kind==="class"){
        if(codes.indexOf(r.code)<0) return;
        out[r.text]={kind:"class",code:r.code,section:(r.section==="E"||r.section==="F")?r.section:"BOTH"};
      } else if(r.kind==="quiz"||r.kind==="midterm"||r.kind==="endterm"||r.kind==="aol"){
        out[r.text]={kind:r.kind, code:(codes.indexOf(r.code)>=0?r.code:null)};
      } else if(r.kind==="ignore"){
        out[r.text]={kind:"ignore"};
      }
    });
    return out;
  } catch(e){ return null; }
}

// Stable per-exam id, independent of array order or a re-parse — lets the
// client track "I attended this quiz" separately from regular class
// attendance (see EX_-prefixed skeys client-side) without any new server
// schema: it reuses the existing attendance sheet, just a different skey
// namespace that mySessions()-based stats never touch.
function examId_(date, si, text) {
  var h=0; for(var i=0;i<text.length;i++){ h=((h<<5)-h+text.charCodeAt(i))|0; }
  return "EX_"+date.replace(/-/g,"")+"_"+si+"_"+(h>>>0).toString(36);
}

// ── UNIFIED TIMETABLE PARSER ──  One pass builds both `sessions` (regular
// classes, attendance-trackable) and `exams` (quiz/mid-term/end-term/AOL,
// display-only, never counted as a class) from the same CSV text. A cell is
// EITHER a session OR an exam, NEVER both — e.g. "RBS Mid-Term" used to be
// logged as an RBS class session *and* an exam, inflating RBS's attendance
// count and showing a mid-term in the weekly timetable as if it were a normal
// lecture. AI classification (if configured) runs once per distinct cell text;
// anything it doesn't confidently cover falls back to the regex rules above.
function parseTimetable_(text) {
  var rows=splitCSV_(text), cells=[], curDate=null;
  for(var r=0;r<rows.length;r++){
    var row=rows[r];
    var dm=(row[1]||"").trim().match(/(\d{2})-(\d{2})-(\d{4})/);
    if(dm) curDate=dm[3]+"-"+dm[2]+"-"+dm[1];
    if(!curDate) continue;
    for(var si=0;si<8;si++){
      var cell=(row[si+2]||"").trim();
      if(cell) cells.push({date:curDate,si:si,text:cell});
    }
  }
  var uniq={}; cells.forEach(function(c){uniq[c.text]=1;});
  var aiMap=null;
  try { aiMap=aiClassifyCells_(Object.keys(uniq)); } catch(eAI){ aiMap=null; }
  var venues=defaultVenues_(rows);

  var sessions=[],exams=[],warnings=[],counters={},seenExam={};
  cells.forEach(function(c){
    var cu=c.text.toUpperCase();
    var ai=aiMap&&aiMap[c.text];
    var kind=null,code=null,sec=null,examT=null;

    if(ai&&ai.kind==="class"){ kind="class"; code=ai.code; sec=ai.section; }
    else if(ai&&(ai.kind==="quiz"||ai.kind==="midterm"||ai.kind==="endterm"||ai.kind==="aol")){
      kind="exam"; code=ai.code||matchCourseCode_(cu);
      examT=ai.kind==="quiz"?"Quiz":ai.kind==="midterm"?"Mid-Term":ai.kind==="endterm"?"End-Term":"AOL Exam";
    }
    else if(ai&&ai.kind==="ignore"){ kind="ignore"; }
    else {
      var et=examType_(c.text);
      if(et){ kind="exam"; examT=et; code=matchCourseCode_(cu); }
      else {
        var cl=classifyCell_(c.text);
        if(cl){ kind="class"; code=cl.code; sec=cl.sec; }
      }
    }

    var room=roomOf_(c.text);
    if(kind==="class"){
      var key=code+"_"+sec;
      counters[key]=(counters[key]||0)+1;
      sessions.push({date:c.date,code:code,section:sec,slot:SLOTS[c.si][0],sh:SLOTS[c.si][1],sm:SLOTS[c.si][2],n:counters[key],late:SLOTS[c.si][1]>=18?1:0,venue:room||venues[sec]||null});
    } else if(kind==="exam"){
      var dedup=c.date+"|"+SLOTS[c.si][0]+"|"+cu;
      if(!seenExam[dedup]){
        seenExam[dedup]=1;
        exams.push({id:examId_(c.date,c.si,c.text),date:c.date,type:examT,code:code||null,text:annEsc_(c.text),slot:SLOTS[c.si][0],sh:SLOTS[c.si][1],sm:SLOTS[c.si][2],venue:room||null});
      }
    } else if(kind!=="ignore"){
      warnings.push(c.date+" · "+SLOTS[c.si][0]+" · \""+c.text+"\"");
    }
  });
  logParseWarnings_(warnings);
  return {sessions:sessions, exams:exams, courses:parseCourseInfo_(rows)};
}
function fetchTimetableParsed_() { return parseTimetable_(fetchCSV_()); }

// ── PARSE WARNINGS ──  Any non-empty cell neither AI nor the deterministic
// rules could classify lands here instead of silently vanishing. Overwritten on
// every fresh parse (not an ever-growing log) — check this tab after editing
// the master timetable with a new course code / new phrasing.
function getOrCreateParseWarningsSheet_() {
  var ss=SpreadsheetApp.openById(CFG.DATA_ID), s=ss.getSheetByName("parse_warnings");
  if(!s){s=ss.insertSheet("parse_warnings");s.appendRow(["logged_at","cell"]);s.setFrozenRows(1);}
  return s;
}
function logParseWarnings_(warnings) {
  try {
    var s=getOrCreateParseWarningsSheet_();
    var oldRows=s.getLastRow()-1;
    if(oldRows>0) s.getRange(2,1,oldRows,2).clearContent();
    if(!warnings||!warnings.length) return;
    var now=new Date().toISOString();
    s.getRange(2,1,warnings.length,2).setValues(warnings.map(function(w){return [now,w];}));
  } catch(e){ /* best-effort; must never break the timetable */ }
}

// ── TIMETABLE CACHE ──  The timetable can change while term is running, so we
// never serve permanently-stale data — but we also never want ONE transient
// fetch failure (Google export hiccup, sharing-permission blip, quota spike) to
// blank the timetable for every visitor. Cache is keyed on the master file's
// Drive last-modified time; a request whose signature doesn't match re-parses,
// but if that re-parse throws, whatever's already cached (even if stale) is
// served instead of an empty page — stale beats blank.
function readCachedTimetable_(cache) {
  try {
    var metaRaw=cache.get("tt_meta");
    if(!metaRaw) return null;
    var meta=JSON.parse(metaRaw);
    if(!meta.chunks) return null;
    var keys=[]; for(var i=0;i<meta.chunks;i++) keys.push("tt_"+i);
    var got=cache.getAll(keys), parts=[];
    for(var j=0;j<meta.chunks;j++){ var v=got["tt_"+j]; if(v==null) return null; parts.push(v); }
    var blob=Utilities.newBlob(Utilities.base64Decode(parts.join("")),"application/x-gzip");
    var data=JSON.parse(Utilities.ungzip(blob).getDataAsString());
    return {sig:meta.sig, sessions:data.sessions, exams:data.exams, courses:data.courses||{}};
  } catch(e){ return null; }
}
function writeCachedTimetable_(cache, sig, parsed) {
  if(!sig) return;
  try {
    var b64=Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(JSON.stringify({sessions:parsed.sessions,exams:parsed.exams,courses:parsed.courses}))).getBytes());
    var size=90000, chunks=Math.ceil(b64.length/size)||1, put={};
    for(var k=0;k<chunks;k++) put["tt_"+k]=b64.substr(k*size,size);
    cache.putAll(put,21600);
    cache.put("tt_meta",JSON.stringify({sig:sig,chunks:chunks}),21600);
  } catch(e){}
}
function timetableSig_() {
  try { return String(DriveApp.getFileById(CFG.TIMETABLE_ID).getLastUpdated().getTime()); } catch(e){ return ""; }
}
var __TT_MEMO=null;
function getTimetable_() {
  if(__TT_MEMO) return __TT_MEMO;
  var cache=CacheService.getScriptCache();
  var sig=timetableSig_();
  var cached=readCachedTimetable_(cache);
  if(cached && sig && cached.sig===sig) return (__TT_MEMO=cached);
  try {
    var parsed=fetchTimetableParsed_();
    writeCachedTimetable_(cache, sig, parsed);
    return (__TT_MEMO={sig:sig, sessions:parsed.sessions, exams:parsed.exams, courses:parsed.courses});
  } catch(err) {
    if(cached) return (__TT_MEMO=cached);
    throw err;
  }
}
function getSessionsCached_()   { return getTimetable_().sessions; }
function getExamsCached_()      { return getTimetable_().exams; }
function getCourseInfoCached_() { return getTimetable_().courses||{}; }

// ============================================================
//  SERVER  —  POST router + sheet IO
// ============================================================
function doPost(e) {
  try {
    var d=JSON.parse(e.postData.contents);
    if(d.action==="get")      return getAttendance_(d.rollNo);
    if(d.action==="set")      return setAttendance_(d);
    if(d.action==="getPrefs") return getPrefs_(d.rollNo);
    if(d.action==="setPrefs") return setPrefs_(d);
    if(d.action==="getManyPrefs") return getManyPrefs_(d.rollNos);
    if(d.action==="getFriends") return getFriends_(d.rollNo);
    if(d.action==="setFriends") return setFriends_(d);
    if(d.action==="createGroup") return createGroup_(d);
    if(d.action==="joinGroup")   return joinGroup_(d);
    if(d.action==="leaveGroup")  return leaveGroup_(d);
    if(d.action==="getGroups")   return getGroups_(d.codes);
    if(d.action==="getMyGroups") return getMyGroups_(d.rollNo);
    if(d.action==="addGroupMember") return addGroupMember_(d);
    if(d.action==="logUser")     return logUser_(d);
    if(d.action==="setStatus")   return setStatus_(d);
    if(d.action==="getStatus")   return getStatus_(d.rollNo);
    return json_({ok:false,error:"Unknown action"});
  } catch(err) {
    return json_({ok:false,error:String(err)});
  }
}
function json_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ── ATTENDANCE ──  (openById so it works as a standalone web app)
function getOrCreateAttSheet_() {
  var ss=SpreadsheetApp.openById(CFG.DATA_ID), s=ss.getSheetByName("attendance");
  if(!s){s=ss.insertSheet("attendance");s.appendRow(["roll_no","user_section","skey","status","updated_at"]);s.setFrozenRows(1);}
  return s;
}
function getAttendance_(rollNo) {
  var sheet=getOrCreateAttSheet_(),rows=sheet.getDataRange().getValues(),result={};
  for(var i=1;i<rows.length;i++)
    if(String(rows[i][0]).trim().toUpperCase()===String(rollNo).trim().toUpperCase())
      result[String(rows[i][2])]=String(rows[i][3]);
  return json_({ok:true,data:result});
}
function setAttendance_(d) {
  var lock=LockService.getPublicLock();lock.waitLock(15000);
  try {
    var sheet=getOrCreateAttSheet_(),rows=sheet.getDataRange().getValues(),found=-1;
    for(var i=1;i<rows.length;i++)
      if(String(rows[i][0]).trim().toUpperCase()===String(d.rollNo).trim().toUpperCase()&&String(rows[i][2])===String(d.skey)){found=i+1;break;}
    var prev=found>0?String(rows[found-1][3]||""):"",next=d.status||"";
    if(!d.status){if(found>0)sheet.deleteRow(found);}
    else if(found>0) sheet.getRange(found,3,1,3).setValues([[d.skey,d.status,new Date().toISOString()]]);
    else sheet.appendRow([d.rollNo.toUpperCase(),d.userSection||"",d.skey,d.status,new Date().toISOString()]);
    if(prev!==next) logAttendance_(d.rollNo,d.skey,prev,next,d.src||"manual"); // audit trail (never blocks the mark)
    return json_({ok:true});
  } catch(err) {
    return json_({ok:false,error:String(err)});
  } finally { lock.releaseLock(); }
}
// ── ATTENDANCE AUDIT LOG ──  append-only history of every status change. Additive:
// it never touches the live "attendance" tab, so existing data is untouched.
function getOrCreateAttLogSheet_() {
  var ss=SpreadsheetApp.openById(CFG.DATA_ID), s=ss.getSheetByName("attendance_log");
  if(!s){s=ss.insertSheet("attendance_log");s.appendRow(["timestamp","roll_no","skey","from","to","source"]);s.setFrozenRows(1);}
  return s;
}
function logAttendance_(rollNo,skey,from,to,src) {
  try {
    getOrCreateAttLogSheet_().appendRow([new Date().toISOString(),String(rollNo).toUpperCase(),String(skey),from||"(unmarked)",to||"(unmarked)",src||"manual"]);
  } catch(e){ /* logging is best-effort; a failure must never affect attendance */ }
}

// ── USERS REGISTRY ──  every roll number that logs in, captured once for the admin.
// Columns: roll_no | name | section | first_seen | last_seen | visits
function getOrCreateUsersSheet_() {
  var ss=SpreadsheetApp.openById(CFG.DATA_ID), s=ss.getSheetByName("users");
  if(!s){s=ss.insertSheet("users");s.appendRow(["roll_no","name","section","first_seen","last_seen","visits"]);s.setFrozenRows(1);}
  return s;
}
function logUser_(d) {
  var lock=LockService.getPublicLock();lock.waitLock(10000);
  try {
    var roll=String(d.rollNo||"").trim().toUpperCase();
    if(!/^B25[0-9]{3}$/.test(roll)) return json_({ok:false,error:"Invalid roll"});
    var nm=(typeof ROSTER!=="undefined"&&ROSTER[roll]?ROSTER[roll].n:"")||d.name||"";
    var sheet=getOrCreateUsersSheet_(),rows=sheet.getDataRange().getValues(),now=new Date().toISOString(),found=-1;
    for(var i=1;i<rows.length;i++) if(String(rows[i][0]).trim().toUpperCase()===roll){found=i+1;break;}
    if(found>0){
      var visits=Number(rows[found-1][5]||0)+1;
      sheet.getRange(found,2,1,5).setValues([[nm||rows[found-1][1],d.section||rows[found-1][2],rows[found-1][3]||now,now,visits]]);
    } else {
      sheet.appendRow([roll,nm,d.section||"",now,now,1]);
    }
    return json_({ok:true});
  } catch(err){ return json_({ok:false,error:String(err)}); }
  finally { lock.releaseLock(); }
}

// ── USER PREFS ──  (cloud restore by roll number)
function getOrCreatePrefsSheet_() {
  var ss=SpreadsheetApp.openById(CFG.DATA_ID), s=ss.getSheetByName("userprefs");
  if(!s){s=ss.insertSheet("userprefs");s.appendRow(["roll_no","section","courses","updated_at","course_sections","groups"]);s.setFrozenRows(1);return s;}
  if(!s.getRange(1,5).getValue())s.getRange(1,5).setValue("course_sections"); // upgrade existing sheet
  if(!s.getRange(1,6).getValue())s.getRange(1,6).setValue("groups");          // upgrade: joined group codes
  return s;
}



function getPrefs_(rollNo) {
  var sheet=getOrCreatePrefsSheet_(),rows=sheet.getDataRange().getValues();
  for(var i=1;i<rows.length;i++)
    if(String(rows[i][0]).trim().toUpperCase()===String(rollNo).trim().toUpperCase()){
      var courses=[];try{courses=JSON.parse(rows[i][2]||"[]");}catch(e){courses=[];}
      var cs={};try{cs=JSON.parse(rows[i][4]||"{}");}catch(e){cs={};}
      var grp=[];try{grp=JSON.parse(rows[i][5]||"[]");}catch(e){grp=[];}
      return json_({ok:true,data:{section:String(rows[i][1]),courses:courses,courseSections:cs,groups:grp}});
    }
  return json_({ok:true,data:null});
}


function setPrefs_(d) {
  var lock=LockService.getPublicLock();lock.waitLock(15000);
  try {
    var sheet=getOrCreatePrefsSheet_(),rows=sheet.getDataRange().getValues(),found=-1;
    for(var i=1;i<rows.length;i++)
      if(String(rows[i][0]).trim().toUpperCase()===String(d.rollNo).trim().toUpperCase()){found=i+1;break;}
    var courses=JSON.stringify(d.courses||[]);
    var cs=JSON.stringify(d.courseSections||{});
    // NOTE: deliberately does NOT touch column F (groups). Group membership lives in the
    // groups sheet (members_json) and is derived via getMyGroups_, so onboarding/settings
    // can never wipe a user's groups.
    if(found>0) sheet.getRange(found,2,1,4).setValues([[d.section,courses,new Date().toISOString(),cs]]);
    else sheet.appendRow([d.rollNo.toUpperCase(),d.section,courses,new Date().toISOString(),cs]);
    return json_({ok:true});
  } catch(err) {
    return json_({ok:false,error:String(err)});
  } finally { lock.releaseLock(); }
}
// ── FRIENDS: fetch many schedules at once (by roll number) ──
function getManyPrefs_(rollNos) {
  var sheet=getOrCreatePrefsSheet_(),rows=sheet.getDataRange().getValues(),want={},out={};
  (rollNos||[]).forEach(function(r){want[String(r).trim().toUpperCase()]=1;});
  for(var i=1;i<rows.length;i++){
    var rn=String(rows[i][0]).trim().toUpperCase();
    if(want[rn]){
      var c=[];try{c=JSON.parse(rows[i][2]||"[]");}catch(e){c=[];}
      var cs={};try{cs=JSON.parse(rows[i][4]||"{}");}catch(e){cs={};}
      out[rn]={section:String(rows[i][1]),courses:c,courseSections:cs};
    }
  }
  var sm=getStatusMap_(want);
  Object.keys(out).forEach(function(rn){ out[rn].status=sm[rn]||null; });
  return json_({ok:true,data:out});
}
// ── FRIENDS LIST: stored per owner so it restores on a new device ──
function getOrCreateFriendsSheet_() {
  var ss=SpreadsheetApp.openById(CFG.DATA_ID), s=ss.getSheetByName("friends");
  if(!s){s=ss.insertSheet("friends");s.appendRow(["owner_roll","friends_json","updated_at"]);s.setFrozenRows(1);}
  return s;
}
function getFriends_(rollNo) {
  var sheet=getOrCreateFriendsSheet_(),rows=sheet.getDataRange().getValues();
  for(var i=1;i<rows.length;i++)
    if(String(rows[i][0]).trim().toUpperCase()===String(rollNo).trim().toUpperCase()){
      var list=[];try{list=JSON.parse(rows[i][1]||"[]");}catch(e){list=[];}
      return json_({ok:true,data:list});
    }
  return json_({ok:true,data:[]});
}
function setFriends_(d) {
  var lock=LockService.getPublicLock();lock.waitLock(15000);
  try {
    var sheet=getOrCreateFriendsSheet_(),rows=sheet.getDataRange().getValues(),found=-1;
    for(var i=1;i<rows.length;i++)
      if(String(rows[i][0]).trim().toUpperCase()===String(d.rollNo).trim().toUpperCase()){found=i+1;break;}
    var fjson=JSON.stringify(d.friends||[]);
    if(found>0) sheet.getRange(found,2,1,2).setValues([[fjson,new Date().toISOString()]]);
    else sheet.appendRow([d.rollNo.toUpperCase(),fjson,new Date().toISOString()]);
    return json_({ok:true});
  } catch(err) {
    return json_({ok:false,error:String(err)});
  } finally { lock.releaseLock(); }
}

// ── STATUS (Slack-style availability) ──
// Sheet "status": roll_no | emoji | text | updated_at | until (epoch ms; blank = no expiry).
// Anyone viewing your schedule (friends / groups / search) sees your active status.
function getOrCreateStatusSheet_() {
  var ss=SpreadsheetApp.openById(CFG.DATA_ID), s=ss.getSheetByName("status");
  if(!s){s=ss.insertSheet("status");s.appendRow(["roll_no","emoji","text","updated_at","until"]);s.setFrozenRows(1);}
  return s;
}
function setStatus_(d) {
  var lock=LockService.getPublicLock();lock.waitLock(15000);
  try {
    var roll=String(d.rollNo||"").trim().toUpperCase();
    if(!/^B25[0-9]{3}$/.test(roll)) return json_({ok:false,error:"Invalid roll"});
    var sheet=getOrCreateStatusSheet_(),rows=sheet.getDataRange().getValues(),found=-1;
    for(var i=1;i<rows.length;i++) if(String(rows[i][0]).trim().toUpperCase()===roll){found=i+1;break;}
    var text=String(d.text||"").trim().slice(0,80);
    if(/^[=+\-@]/.test(text)) text = "'" + text;
    text = annEsc_(text);
    if(!text){ if(found>0)sheet.deleteRow(found); return json_({ok:true,cleared:true}); }
    var emoji=String(d.emoji||"").trim().slice(0,8);
    if(/^[=+\-@]/.test(emoji)) emoji = "'" + emoji;
    emoji = annEsc_(emoji);
    var until=(d.until&&Number(d.until)>0)?String(Number(d.until)):"";
    if(found>0) sheet.getRange(found,2,1,4).setValues([[emoji,text,new Date().toISOString(),until]]);
    else sheet.appendRow([roll,emoji,text,new Date().toISOString(),until]);
    return json_({ok:true});
  } catch(err){ return json_({ok:false,error:String(err)}); }
  finally { lock.releaseLock(); }
}
// Returns {ROLL:{emoji,text,until}} for non-expired statuses among the wanted rolls.
function getStatusMap_(want) {
  var out={};
  try {
    var sheet=getOrCreateStatusSheet_(),rows=sheet.getDataRange().getValues(),now=Date.now();
    for(var i=1;i<rows.length;i++){
      var roll=String(rows[i][0]).trim().toUpperCase();
      if(want && !want[roll]) continue;
      var until=rows[i][4]?Number(rows[i][4]):0;
      if(until && now>until) continue;                 // expired → treat as no status
      var text=String(rows[i][2]||"").trim();
      if(!text) continue;
      out[roll]={emoji:String(rows[i][1]||""),text:annEsc_(text),until:until||0};
    }
  } catch(e){}
  return out;
}
function getStatus_(rollNo) {
  var roll=String(rollNo||"").trim().toUpperCase(),want={};want[roll]=1;
  var m=getStatusMap_(want);
  return json_({ok:true,data:m[roll]||null});
}

// ── GROUPS: a shareable circle. One row per group; membership is a roll-number list. ──
// Sheet "groups":  code | name | owner_roll | members_json | created_at
function getOrCreateGroupsSheet_() {
  var ss=SpreadsheetApp.openById(CFG.DATA_ID), s=ss.getSheetByName("groups");
  if(!s){s=ss.insertSheet("groups");s.appendRow(["code","name","owner_roll","members_json","created_at"]);s.setFrozenRows(1);}
  return s;
}
function genGroupCode_() {
  var chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion when sharing
  var c="";for(var i=0;i<6;i++)c+=chars.charAt(Math.floor(Math.random()*chars.length));
  return c;
}
function createGroup_(d) {
  var lock=LockService.getPublicLock();lock.waitLock(15000);
  try {
    var sheet=getOrCreateGroupsSheet_(),rows=sheet.getDataRange().getValues(),taken={};
    for(var i=1;i<rows.length;i++)taken[String(rows[i][0]).trim().toUpperCase()]=1;
    var code;do{code=genGroupCode_();}while(taken[code]);
    var roll=String(d.rollNo||"").trim().toUpperCase();
    if(!/^B25[0-9]{3}$/.test(roll)) return json_({ok:false,error:"Set a valid roll number first"});
    var name=String(d.name||"").trim()||("Group "+code);
    if(/^[=+\-@]/.test(name)) name = "'" + name; // Prevent spreadsheet formula injection
    name = annEsc_(name); // Prevent Stored XSS
    sheet.appendRow([code,name,roll,JSON.stringify([roll]),new Date().toISOString()]);
    return json_({ok:true,code:code,name:name});
  } catch(err){ return json_({ok:false,error:String(err)}); }
  finally { lock.releaseLock(); }
}
function joinGroup_(d) {
  var lock=LockService.getPublicLock();lock.waitLock(15000);
  try {
    var sheet=getOrCreateGroupsSheet_(),rows=sheet.getDataRange().getValues();
    var code=String(d.code||"").trim().toUpperCase(),roll=String(d.rollNo||"").trim().toUpperCase();
    if(!/^B25[0-9]{3}$/.test(roll)) return json_({ok:false,error:"Set a valid roll number first"});
    for(var i=1;i<rows.length;i++){
      if(String(rows[i][0]).trim().toUpperCase()===code){
        var members=[];try{members=JSON.parse(rows[i][3]||"[]");}catch(e){members=[];}
        if(members.indexOf(roll)<0){members.push(roll);sheet.getRange(i+1,4).setValue(JSON.stringify(members));}
        return json_({ok:true,code:code,name:String(rows[i][1])});
      }
    }
    return json_({ok:false,error:"No group found with code "+code});
  } catch(err){ return json_({ok:false,error:String(err)}); }
  finally { lock.releaseLock(); }
}
function leaveGroup_(d) {
  var lock=LockService.getPublicLock();lock.waitLock(15000);
  try {
    var sheet=getOrCreateGroupsSheet_(),rows=sheet.getDataRange().getValues();
    var code=String(d.code||"").trim().toUpperCase(),roll=String(d.rollNo||"").trim().toUpperCase();
    for(var i=1;i<rows.length;i++){
      if(String(rows[i][0]).trim().toUpperCase()===code){
        var members=[];try{members=JSON.parse(rows[i][3]||"[]");}catch(e){members=[];}
        members=members.filter(function(m){return m!==roll;});
        if(members.length) sheet.getRange(i+1,4).setValue(JSON.stringify(members));
        else sheet.deleteRow(i+1); // last member out → remove the empty group
        return json_({ok:true});
      }
    }
    return json_({ok:true});
  } catch(err){ return json_({ok:false,error:String(err)}); }
  finally { lock.releaseLock(); }
}
// Group owner ("admin") adds a member directly by roll number — no code-sharing needed.
function addGroupMember_(d) {
  var lock=LockService.getPublicLock();lock.waitLock(15000);
  try {
    var sheet=getOrCreateGroupsSheet_(),rows=sheet.getDataRange().getValues();
    var code=String(d.code||"").trim().toUpperCase(),me=String(d.rollNo||"").trim().toUpperCase(),member=String(d.member||"").trim().toUpperCase();
    if(!/^B25[0-9]{3}$/.test(member)) return json_({ok:false,error:"Invalid roll number"});
    for(var i=1;i<rows.length;i++){
      if(String(rows[i][0]).trim().toUpperCase()===code){
        if(String(rows[i][2]).trim().toUpperCase()!==me) return json_({ok:false,error:"Only the group creator can add members"});
        var members=[];try{members=JSON.parse(rows[i][3]||"[]");}catch(e){members=[];}
        if(members.indexOf(member)<0){members.push(member);sheet.getRange(i+1,4).setValue(JSON.stringify(members));}
        return json_({ok:true});
      }
    }
    return json_({ok:false,error:"Group not found"});
  } catch(err){ return json_({ok:false,error:String(err)}); }
  finally { lock.releaseLock(); }
}

// Fetch several groups + every member's schedule in just two sheet reads.
// Shared: collect groups matching `matchFn(code, members[])` + hydrate every member's schedule.
function hydrateGroups_(matchFn) {
  var gsheet=getOrCreateGroupsSheet_(),grows=gsheet.getDataRange().getValues();
  var groups=[],allRolls={};
  for(var i=1;i<grows.length;i++){
    var code=String(grows[i][0]).trim().toUpperCase();
    var members=[];try{members=JSON.parse(grows[i][3]||"[]");}catch(e){members=[];}
    var up=members.map(function(m){return String(m).trim().toUpperCase();});
    if(!matchFn(code,up))continue;
    up.forEach(function(m){allRolls[m]=1;});
    groups.push({code:code,name:String(grows[i][1]),owner:String(grows[i][2]).trim().toUpperCase(),members:up});
  }
  var psheet=getOrCreatePrefsSheet_(),prows=psheet.getDataRange().getValues(),prefMap={};
  for(var j=1;j<prows.length;j++){
    var rn=String(prows[j][0]).trim().toUpperCase();
    if(allRolls[rn]){
      var c=[];try{c=JSON.parse(prows[j][2]||"[]");}catch(e){c=[];}
      var cs={};try{cs=JSON.parse(prows[j][4]||"{}");}catch(e){cs={};}
      prefMap[rn]={section:String(prows[j][1]),courses:c,courseSections:cs};
    }
  }
  var sm=getStatusMap_(allRolls);
  Object.keys(prefMap).forEach(function(rn){ prefMap[rn].status=sm[rn]||null; });
  return {groups:groups,prefs:prefMap};
}
function getGroups_(codes) {
  var want={};(codes||[]).forEach(function(c){want[String(c).trim().toUpperCase()]=1;});
  return json_({ok:true,data:hydrateGroups_(function(code,members){return !!want[code];})});
}
// Your groups, derived from the groups sheet by membership — the source of truth.
// Nothing in onboarding/settings can wipe this, and it restores on any device by roll number.
function getMyGroups_(rollNo) {
  var roll=String(rollNo||"").trim().toUpperCase();
  if(!roll) return json_({ok:true,data:{groups:[],prefs:{}}});
  return json_({ok:true,data:hydrateGroups_(function(code,members){return members.indexOf(roll)>=0;})});
}

// ── ANNOUNCEMENTS: read from the "announcements" tab in your DATA sheet ──
function getOrCreateAnnSheet_() {
  var ss=SpreadsheetApp.openById(CFG.DATA_ID), s=ss.getSheetByName("announcements");
  if(!s){
    s=ss.insertSheet("announcements");
    s.appendRow(["id","text","type","date","active"]);
    s.appendRow(["example","This is an example — edit, delete, or add rows here. Set active to TRUE to show.","info","15 Jun","FALSE"]);
    s.setFrozenRows(1);
  }
  return s;
}
function annEsc_(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
// Announcements change rarely; a 60s shared cache spares every page load a sheet read.
function getAnnouncementsCached_() {
  try {
    var cache=CacheService.getScriptCache(),hit=cache.get("ann_cache");
    if(hit) return JSON.parse(hit);
    var ann=fetchAnnouncements_();
    try { cache.put("ann_cache",JSON.stringify(ann),60); } catch(e){}
    return ann;
  } catch(err) { return fetchAnnouncements_(); }
}
function fetchAnnouncements_() {
  var sheet=getOrCreateAnnSheet_(),rows=sheet.getDataRange().getValues(),out=[];
  for(var i=1;i<rows.length;i++){
    var id=String(rows[i][0]||"").trim();
    var text=String(rows[i][1]||"").trim();
    var type=String(rows[i][2]||"").trim().toLowerCase();
    var date=String(rows[i][3]||"").trim();
    var active=String(rows[i][4]||"").trim().toUpperCase();
    if(!text) continue;
    if(active==="FALSE"||active==="NO"||active==="0") continue;  // blank/TRUE/anything else = show
    if(["info","warn","hot"].indexOf(type)<0) type="info";
    out.push({id:id||("row"+i),text:annEsc_(text),type:type,date:date});
  }
  return out;
}

// ── DIAGNOSTIC ──  Run once from the editor to verify writes work.
function testWrite() {
  var a=getOrCreateAttSheet_();
  a.appendRow(["TEST_ROLL","E","CMN_BOTH_1","present",new Date().toISOString()]);
  var p=getOrCreatePrefsSheet_();
  p.appendRow(["TEST_ROLL","E",JSON.stringify(["CMN","CNB"]),new Date().toISOString()]);
  Logger.log("attendance rows: "+a.getLastRow()+" | userprefs rows: "+p.getLastRow());
}

const PAGE_TMPL = `<html lang="en">
<head>
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
<meta charset="UTF-8"><title>Term IV</title>
<meta name="theme-color" content="#0a0a0b">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Term IV">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet"></noscript>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
button, .att-btn, .lp-chip, .lp-toggle, .tl-btn, .iconbtn, .sb-item, .bn-item, .ctog, .secbtn, .databtn, .f-del, .quick-att, .day-cell, [data-hmday], [data-nudge] {
  touch-action: manipulation;
}
:root{--bg:#0a0a0b;--s1:#111113;--s2:#18181b;--s3:#222226;--b1:rgba(255,255,255,.06);--b2:rgba(255,255,255,.11);--t1:#f4f1ec;--t2:#9b9792;--t3:#5a5754;--acc:#d4f244;--ok:#65cfa0;--okd:#1d9e75;--warn:#f0b84a;--warnd:#ef9f27;--bad:#f09595;--badd:#e24b4a;--r:10px;--nav-w:220px}
html,body{height:100%;overscroll-behavior-y:none}
body{background:var(--bg);color:var(--t1);font-family:'DM Mono',monospace;min-height:100vh;-webkit-font-smoothing:antialiased}
body::before{content:"";position:fixed;inset:0;background-image:radial-gradient(rgba(255,255,255,.028) 1px,transparent 1px);background-size:24px 24px;pointer-events:none;z-index:0}
#onboard,#shell{position:relative;z-index:1}
@keyframes panelIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes up{from{transform:translateY(18px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes spin{to{transform:rotate(360deg)}}
.refresh-ico{display:inline-block}
.spinning .refresh-ico{animation:spin .7s linear infinite}
.synced .refresh-inline{background:none;border:none;color:var(--acc);cursor:pointer;font-family:inherit;font-size:9px;padding:0 0 0 6px;text-decoration:underline}
.synced .pending-pill{color:var(--warn)}

/* ── LAYOUT ── */
#shell{display:flex;flex-direction:column;min-height:100vh}
#main-wrap{flex:1;padding-bottom:76px}
.top{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:.5px solid var(--b1);position:sticky;top:0;background:rgba(10,10,11,.93);backdrop-filter:blur(14px);z-index:20}
.top-l{display:flex;align-items:center;gap:9px}
.top-logo{font-family:'Syne',sans-serif;font-size:15px;font-weight:800;letter-spacing:-.02em}
.top-badge{font-size:10px;background:var(--s2);border:.5px solid var(--b2);border-radius:20px;padding:3px 9px;color:var(--t2)}
.top-r{display:flex;gap:6px}
.iconbtn{background:none;border:.5px solid var(--b2);border-radius:7px;color:var(--t2);padding:6px 10px;cursor:pointer;font-size:12px;font-family:'DM Mono',monospace;transition:.12s}
.iconbtn:active{background:var(--s2)}
.content{padding:16px 14px;max-width:720px;margin:0 auto}

/* ── BOTTOM NAV ── */
.bottomnav {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 480px;
  background: rgba(15, 15, 18, 0.45);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  display: flex;
  justify-content: space-around;
  padding: 6px 8px;
  z-index: 30;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4), 
              inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
}
.bn-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--t3);
  font-family: 'Outfit', sans-serif;
  font-weight: 500;
  font-size: 9px;
  padding: 6px 4px;
  flex: 1;
  position: relative;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 16px;
}
.bn-item:hover {
  color: var(--t2);
}
.bn-item.on {
  color: var(--acc);
}
.bn-item.on::after {
  content: "";
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: var(--acc);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--acc);
}
.bn-ico {
  font-size: 18px;
  line-height: 1;
  transition: transform 0.2s ease;
}
.bn-item.on .bn-ico {
  transform: translateY(-1px);
}
.info-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: var(--t3);
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  vertical-align: middle;
  font-weight: bold;
}
.info-trigger:hover {
  background: var(--acc);
  color: var(--b1);
  transform: scale(1.1);
}

/* ── DESKTOP SIDEBAR ── */
@media(min-width:900px){
  body{padding-bottom:0}
  #shell{flex-direction:row;min-height:100vh}
  .top{display:none}
  #sidebar{width:var(--nav-w);flex-shrink:0;background:var(--s1);border-right:.5px solid var(--b1);display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow-y:auto;padding:24px 0 16px}
  .sb-logo{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;letter-spacing:-.02em;padding:0 20px 4px}
  .sb-badge{font-size:10px;color:var(--t3);padding:0 20px 18px;border-bottom:.5px solid var(--b1);margin-bottom:12px}
  .sb-nav{display:flex;flex-direction:column;gap:2px;padding:0 10px;flex:1}
  .sb-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;background:none;border:none;cursor:pointer;color:var(--t2);font-family:'DM Mono',monospace;font-size:12px;text-align:left;width:100%;transition:.12s}
  .sb-item:hover{background:var(--s2);color:var(--t1)}
  .sb-item.on{background:rgba(212,242,68,.08);color:var(--acc)}
  .sb-footer{padding:14px 10px 0;border-top:.5px solid var(--b1);margin-top:auto;display:flex;flex-direction:column;gap:2px}
  .sb-sync{font-size:9px;color:var(--t3);padding:6px 12px}
  #main-wrap{flex:1;overflow-y:auto;padding-bottom:0}
  .content{padding:28px 32px;max-width:860px;margin:0}
  .bottomnav{display:none !important}
}
@media(min-width:600px) and (max-width:899px){.content{padding:20px 24px}}

/* ── ONBOARDING ── */
#onboard{position:fixed;inset:0;background:var(--bg);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto}
.ob{background:var(--s1);border:.5px solid var(--b2);border-radius:18px;padding:28px 24px;max-width:440px;width:100%;margin:auto}
.ob-tag{font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:.15em;color:var(--t3);text-transform:uppercase;margin-bottom:18px}
.ob-h{font-family:'Syne',sans-serif;font-size:23px;font-weight:800;letter-spacing:-.03em;line-height:1.15;margin-bottom:6px}
.ob-p{font-size:12px;color:var(--t2);line-height:1.6;margin-bottom:20px}
.ob-restore{background:var(--s2);border:.5px solid var(--b2);border-radius:9px;padding:12px 14px;margin-bottom:22px}
.ob-restore-row{display:flex;gap:8px}
.ob-restore-btn{background:var(--acc);color:#0a0a0b;border:none;border-radius:9px;padding:0 16px;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap}
.ob-restore-btn:active{transform:scale(.97)}
.ob-or{display:flex;align-items:center;gap:10px;color:var(--t3);font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:18px}
.ob-or::before,.ob-or::after{content:"";flex:1;height:.5px;background:var(--b1)}
.ob-l{font-size:10px;color:var(--t2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}
.secrow{display:flex;gap:8px;margin-bottom:22px}
.secbtn{flex:1;padding:11px;border-radius:9px;border:1px solid var(--b2);background:var(--s2);color:var(--t2);font-family:'Syne',sans-serif;font-size:15px;font-weight:700;cursor:pointer;transition:.15s}
.secbtn.on{border-color:var(--acc);color:var(--acc);background:rgba(212,242,68,.07)}
.cgrid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:22px;max-height:340px;overflow-y:auto;padding-right:4px}
.ctog{padding:9px 11px;border-radius:8px;border:1px solid var(--b2);background:var(--s2);cursor:pointer;transition:.15s}
.ctog .cc{font-size:11px;font-weight:500;display:block;margin-bottom:2px;color:var(--t2)}
.ctog .cn{font-size:10px;color:var(--t3);line-height:1.2}
.ctog.on{border-color:var(--acc);background:rgba(212,242,68,.05)}
.cta:disabled{opacity:.3;cursor:default}
.cta:active:not(:disabled){transform:scale(.96)}
.ctog.on .csec{display:flex}
.csec-l{font-size:8px;color:var(--t3);text-transform:uppercase;letter-spacing:.05em;margin-right:1px}
.csec-b{font-size:10px;font-family:'DM Mono',monospace;border:.5px solid var(--b2);background:var(--bg);color:var(--t2);border-radius:5px;padding:3px 8px;cursor:pointer;transition:.12s}
.csec-b.on{border-color:var(--acc);background:rgba(212,242,68,.1);color:var(--acc)}
.cta{width:100%;padding:13px;background:var(--acc);color:#0a0a0b;border:none;border-radius:9px;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:.15s}
.cta:disabled{opacity:.3;cursor:default}
.cta:active:not(:disabled){transform:scale(.98)}
.ob-input{width:100%;padding:11px 13px;background:var(--s2);border:1px solid var(--b2);border-radius:9px;color:var(--t1);font-family:'DM Mono',monospace;font-size:13px;margin-bottom:4px;outline:none;-webkit-appearance:none}
.ob-input:focus{border-color:var(--acc)}
.ob-hint{font-size:10px;color:var(--t3);margin-bottom:16px}

/* ── APP ── */
#app{display:none}
.panel{display:none}.panel.on{display:block;animation:panelIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)}
.synced{font-size:9px;color:var(--t3);text-align:center;padding:2px 0 10px}
.synced .dot{display:inline-block;width:5px;height:5px;background:var(--acc);border-radius:50%;margin-right:5px;animation:blink 2.5s infinite}
.sync-indicator{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--warn);margin-right:4px;animation:blink 1s infinite}
.errbar{background:rgba(226,75,74,.12);border:.5px solid rgba(226,75,74,.3);color:var(--bad);border-radius:8px;padding:9px 12px;font-size:11px;margin-bottom:12px}

/* ── ANNOUNCEMENTS ── */
.ann-scroll{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;margin-bottom:10px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.ann-scroll::-webkit-scrollbar{display:none}
.ann-card{flex-shrink:0;background:var(--s1);border:.5px solid var(--b2);border-radius:9px;padding:10px 12px;max-width:290px;display:flex;gap:8px;align-items:flex-start}
.ann-card.warn{border-color:rgba(240,184,74,.35)}.ann-card.hot{border-color:rgba(240,100,74,.35)}
.ann-dot{width:6px;height:6px;border-radius:50%;background:var(--acc);flex-shrink:0;margin-top:3px}
.ann-card.warn .ann-dot{background:var(--warn)}.ann-card.hot .ann-dot{background:var(--bad)}
.ann-text{font-size:11px;color:var(--t1);line-height:1.5}
.ann-date{font-size:9px;color:var(--t3);margin-top:2px}
.ann-x{background:none;border:none;color:var(--t3);cursor:pointer;font-size:14px;padding:0;flex-shrink:0;line-height:1}

/* ── INSTALL HINT + SHEET ── */
.install-hint{display:flex;align-items:center;gap:11px;background:linear-gradient(135deg,rgba(212,242,68,.09),rgba(127,119,221,.07));border:.5px solid var(--b2);border-radius:var(--r);padding:12px 14px;margin-bottom:12px}
.ih-ico{font-size:20px;flex-shrink:0}
.ih-body{flex:1;min-width:0}
.ih-t{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--t1)}
.ih-s{font-size:10px;color:var(--t2);margin-top:1px}
.ih-cta{background:var(--acc);color:#0a0a0b;border:none;border-radius:7px;padding:7px 12px;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0}
.ih-x{background:none;border:none;color:var(--t3);cursor:pointer;font-size:15px;padding:0 2px;flex-shrink:0}
.inst-tabs{display:flex;gap:6px;margin-bottom:18px}
.inst-tab{flex:1;padding:9px;border-radius:8px;border:1px solid var(--b2);background:var(--s2);color:var(--t2);font-family:'Syne',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:.15s}
.inst-tab.on{border-color:var(--acc);color:var(--acc);background:rgba(212,242,68,.07)}
.inst-step{display:flex;gap:12px;margin-bottom:14px;align-items:flex-start}
.inst-num{width:24px;height:24px;border-radius:50%;background:var(--acc);color:#0a0a0b;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.inst-txt{font-size:12px;color:var(--t1);line-height:1.55;padding-top:2px}
.inst-txt b{font-weight:500;color:var(--acc)}
.inst-note{font-size:10px;color:var(--t3);line-height:1.6;background:var(--s2);border:.5px solid var(--b1);border-radius:8px;padding:10px 12px;margin-top:6px}
.inst-benefit{font-size:11px;color:var(--t2);line-height:1.6;margin-bottom:16px}
.hero{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
@media(min-width:600px){.hero{grid-template-columns:repeat(4,1fr)}}
.hcard{background:var(--s1);border:.5px solid var(--b1);border-radius:var(--r);padding:13px 14px;transition:.15s}
.hl{font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px}
.hv{font-family:'Syne',sans-serif;font-size:21px;font-weight:700;letter-spacing:-.03em;line-height:1}
.hs{font-size:10px;color:var(--t2);margin-top:3px}
.acc{color:var(--acc)}

/* ── WEEK HEAT DOTS ── */
.week-heat{background:var(--s1);border:.5px solid var(--b1);border-radius:var(--r);padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;gap:10px}
.wh-label{font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:.07em;flex-shrink:0}
.wh-days{display:flex;gap:6px;flex:1;justify-content:space-around}
.wh-day{display:flex;flex-direction:column;align-items:center;gap:3px}
.wh-dot{width:9px;height:9px;border-radius:50%;background:var(--s3)}
.wh-dot.d1{background:rgba(212,242,68,.35)}.wh-dot.d2{background:rgba(212,242,68,.65)}.wh-dot.d3{background:rgba(240,184,74,.75)}.wh-dot.d4{background:rgba(240,80,74,.8)}
.wh-dn{font-size:8px;color:var(--t3)}
.wh-today .wh-dn{color:var(--acc)}.wh-today .wh-dot{box-shadow:0 0 0 2.5px rgba(212,242,68,.25)}

/* ── TODAY TIMELINE STRIP ── */
.t-strip{background:var(--s1);border:.5px solid var(--b1);border-radius:var(--r);padding:10px 14px 8px;margin-bottom:12px}
.t-head{font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:.07em;display:flex;justify-content:space-between;margin-bottom:6px}
.t-track{position:relative;height:30px;background:var(--s2);border-radius:5px;overflow:hidden}
.t-sess{position:absolute;top:4px;bottom:4px;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:600;color:#0a0a0b;overflow:hidden;white-space:nowrap;padding:0 3px}
.t-now{position:absolute;top:0;bottom:0;width:2px;background:var(--acc);border-radius:1px;box-shadow:0 0 6px rgba(212,242,68,.6)}
.t-labels{display:flex;justify-content:space-between;font-size:7px;color:var(--t3);margin-top:3px}

/* ── NEXT BANNER + SESSION CARDS ── */
.nbanner{background:var(--s1);border:.5px solid var(--b2);border-radius:var(--r);padding:13px 15px;display:flex;align-items:center;gap:12px;margin-bottom:12px}
.nb-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;background:var(--cc);animation:pulse 2s infinite}
.nb-l{font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:.07em}
.nb-c{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:var(--cc)}
.nb-t{font-size:10px;color:var(--t2);margin-top:2px}
.nb-p{margin-left:auto;font-size:10px;background:rgba(212,242,68,.1);color:var(--acc);border:.5px solid rgba(212,242,68,.25);border-radius:20px;padding:4px 9px;white-space:nowrap}
.daylabel{font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.07em;margin:14px 0 8px}
.scard{display:flex;align-items:center;gap:11px;padding:11px 13px;border-radius:9px;margin-bottom:5px;background:var(--s1);border:.5px solid var(--b1);position:relative;overflow:hidden;transition:.12s}
.scard::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--cc)}
.scard-tint{position:absolute;inset:0;background:var(--cc);opacity:.03;pointer-events:none}
@media(min-width:900px){.scard:hover{background:var(--s2);transform:translateX(2px)}}
.sc-code{font-size:11px;font-weight:500;color:var(--cc);width:42px;flex-shrink:0;padding-left:4px}
.sc-name{flex:1;font-size:12px;font-family:'Syne',sans-serif;font-weight:500;color:var(--t1);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sc-meta{font-size:10px;color:var(--t2);white-space:nowrap;text-align:right}
.late{font-size:9px;background:rgba(226,75,74,.13);color:var(--bad);border-radius:3px;padding:1px 5px;margin-left:4px}
.free{background:var(--s1);border:.5px solid var(--b1);border-radius:9px;padding:20px;text-align:center;color:var(--t3);font-size:12px}
.att-actions{display:flex;gap:5px;margin-left:8px}
.att-btn{border:.5px solid var(--b2);background:var(--s2);border-radius:6px;padding:5px 9px;font-size:11px;cursor:pointer;font-family:'DM Mono',monospace;color:var(--t2);transition:.12s}
.att-btn:active{transform:scale(.95)}
.att-btn.present.on{background:rgba(29,158,117,.18);border-color:var(--okd);color:var(--ok)}
.att-btn.absent.on{background:rgba(226,75,74,.16);border-color:var(--badd);color:var(--bad)}
.bulk-btn{width:100%;padding:9px;background:none;border:.5px solid var(--b2);border-radius:8px;color:var(--t2);font-size:11px;cursor:pointer;font-family:'DM Mono',monospace;margin:6px 0 14px;text-align:center;transition:.12s}
.bulk-btn:active{background:var(--s2)}

/* ── WEEK ── */
.wknav{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.wkl{font-family:'Syne',sans-serif;font-size:13px;font-weight:600}
.wkbtn{background:var(--s2);border:.5px solid var(--b2);border-radius:6px;color:var(--t1);padding:6px 13px;cursor:pointer;font-family:'DM Mono',monospace;font-size:13px}
.wkbtn:disabled{opacity:.25}
.wkgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.wd{background:var(--s1);border:.5px solid var(--b1);border-radius:7px;padding:7px 4px;min-height:60px}
.wd.today{border-color:var(--acc)}.wd.heavy{border-color:rgba(240,184,74,.3)}
.wd-d{font-size:7px;color:var(--t3)}.wd-n{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;line-height:1.1}
.today .wd-n{color:var(--acc)}.wd-top{padding-bottom:4px;border-bottom:.5px solid var(--b1);margin-bottom:5px}
.wd-empty{font-size:9px;color:var(--t3)}
.wchip{display:block;font-size:7px;font-weight:500;border-radius:3px;padding:2px 3px;margin-bottom:2px;background:var(--s3)}
.wchip .wct{font-size:6px;opacity:.6;display:block}
@media(min-width:600px){.wchip{font-size:9px;padding:2px 5px}.wchip .wct{font-size:8px}.wd-d{font-size:9px}.wd-n{font-size:15px}}
/* Phone: stack the week as a vertical agenda — one day per row, full-width */
@media(max-width:599px){
  .wkgrid{grid-template-columns:1fr;gap:6px}
  .wd{display:flex;align-items:flex-start;gap:12px;min-height:0;padding:11px 13px}
  .wd.today{background:rgba(212,242,68,.05)}
  .wd-top{display:flex;align-items:baseline;gap:7px;border:none;padding:0;margin:0;width:56px;flex-shrink:0}
  .wd-d{font-size:10px}
  .wd-n{font-size:17px}
  .wd-chips{flex:1;display:flex;flex-wrap:wrap;gap:5px;min-width:0}
  .wd .wchip{display:inline-flex;align-items:baseline;gap:5px;font-size:10px;padding:4px 8px;margin:0;background:var(--s3)}
  .wd .wchip .wct{display:inline;font-size:9px;opacity:.6}
  .wd-empty{align-self:center}
}

/* ── HEATMAP ── */
.heatmap-wrap{margin-top:16px;background:var(--s1);border:.5px solid var(--b1);border-radius:var(--r);padding:14px}
.hm-head{font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:12px}
.hm-months{display:flex;gap:20px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none}
.hm-months::-webkit-scrollbar{display:none}
.hm-month{flex-shrink:0}
.hm-mlabel{font-size:10px;color:var(--t2);font-family:'Syne',sans-serif;font-weight:600;margin-bottom:4px}
.hm-dow{display:grid;grid-template-columns:repeat(7,14px);gap:2px;margin-bottom:3px}
.hm-dow span{font-size:7px;color:var(--t3);text-align:center}
.hm-grid{display:grid;grid-template-columns:repeat(7,14px);gap:2px}
.hm-cell{width:14px;height:14px;border-radius:3px;position:relative}
.hm-empty{background:transparent!important}.hm-off{background:var(--s3)}
.hm-l1{background:rgba(212,242,68,.2)}.hm-l2{background:rgba(212,242,68,.5)}.hm-l3{background:rgba(240,184,74,.65)}.hm-l4{background:rgba(240,80,74,.8)}
.hm-today{outline:1.5px solid var(--acc);outline-offset:1px}
.hm-cell.hm-early::after{content:"";position:absolute;top:-1.5px;right:-1.5px;width:5px;height:5px;border-radius:50%;background:var(--warnd);box-shadow:0 0 0 1.5px var(--bg)}
.hm-cell.hm-exam::before{content:"";position:absolute;bottom:-1.5px;right:-1.5px;width:5px;height:5px;border-radius:50%;background:var(--bad);box-shadow:0 0 0 1.5px var(--bg)}
.hm-legend{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-top:10px;font-size:9px;color:var(--t3)}
.hm-legend .hm-cell{flex-shrink:0;width:11px;height:11px;border-radius:2px}
/* heatmap on steroids */
.hm-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.hm-toggle{display:flex;gap:3px;background:var(--s2);border:.5px solid var(--b1);border-radius:8px;padding:3px}
.hm-tb{font-size:10px;font-family:'DM Mono',monospace;color:var(--t3);background:none;border:none;border-radius:6px;padding:5px 10px;cursor:pointer}
.hm-tb.on{background:var(--s3);color:var(--acc)}
.hm-stats{display:flex;gap:6px;margin-bottom:10px}
.hm-stat{flex:1;background:var(--s2);border:.5px solid var(--b1);border-radius:8px;padding:8px 4px;text-align:center}
.hm-sv{font-family:'Syne',sans-serif;font-size:17px;font-weight:700;line-height:1}
.hm-sl{font-size:8px;color:var(--t3);margin-top:3px;white-space:nowrap}
.hm-hint{font-size:9px;color:var(--t3);margin-bottom:8px}
.hm-cell[data-hmday]{cursor:pointer;transition:transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), outline 0.15s ease}
.hm-cell[data-hmday]:hover{outline:1.5px solid var(--b2);outline-offset:1px}
.hm-cell[data-hmday]:active{transform:scale(0.85)}
.hm-good{background:rgba(29,158,117,.75)}.hm-part{background:rgba(240,184,74,.7)}
.hm-miss{background:var(--s3);box-shadow:inset 0 0 0 1px var(--b2)}
.hm-bad{background:rgba(226,75,74,.8)}.hm-future{background:rgba(127,119,221,.22)}
/* unmarked nudge */
.nudge{display:flex;align-items:center;gap:11px;background:linear-gradient(135deg,rgba(240,184,74,.12),rgba(240,80,74,.08));border:.5px solid rgba(240,184,74,.32);border-radius:var(--r);padding:11px 13px;margin-bottom:12px}
.nudge-ico{font-size:17px;flex-shrink:0}
.nudge-body{flex:1;min-width:0}
.nudge-t{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--t1)}
.nudge-s{font-size:10px;color:var(--t2);margin-top:1px}
.nudge-cta{background:var(--warn);color:#0a0a0b;border:none;border-radius:7px;padding:7px 13px;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0}
/* ── UPCOMING EXAMS / ASSESSMENTS ── */
.exam-wrap{margin-top:18px;background:var(--s1);border:.5px solid var(--b2);border-radius:var(--r);padding:14px 15px}
.exam-head{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.exam-title{font-family:'Syne',sans-serif;font-size:14px;font-weight:800;letter-spacing:-.02em}
.exam-count{font-size:9px;color:var(--t3);background:var(--s3);border-radius:20px;padding:2px 8px;margin-left:auto}
.exam-row{display:flex;align-items:center;gap:11px;padding:10px 0;border-bottom:.5px solid var(--b1)}
.exam-row:last-child{border-bottom:none}
.exam-badge{font-size:8px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;border-radius:5px;padding:4px 7px;flex-shrink:0;width:62px;text-align:center;font-family:'Syne',sans-serif}
.exam-badge.quiz{background:rgba(212,242,68,.14);color:var(--acc);border:.5px solid rgba(212,242,68,.3)}
.exam-badge.mid{background:rgba(240,184,74,.14);color:var(--warn);border:.5px solid rgba(240,184,74,.3)}
.exam-badge.end{background:rgba(226,75,74,.14);color:var(--bad);border:.5px solid rgba(226,75,74,.32)}
.exam-badge.aol{background:rgba(112,174,232,.14);color:#70aee8;border:.5px solid rgba(112,174,232,.32)}
.exam-badge.notice{background:rgba(136,135,128,.14);color:var(--t2);border:.5px solid var(--b2)}
.exam-body{flex:1;min-width:0}
.exam-text{font-size:12px;color:var(--t1);font-family:'Syne',sans-serif;font-weight:500;line-height:1.35;word-break:break-word}
.exam-when{font-size:10px;color:var(--t2);margin-top:2px}
.exam-venue{display:inline-block;margin-left:6px;font-size:9px;color:var(--t3);background:var(--s3);border-radius:5px;padding:1px 6px}
.exam-attend{background:none;border:.5px solid var(--b2);border-radius:6px;color:var(--t2);font-size:9px;padding:4px 8px;cursor:pointer;font-family:'DM Mono',monospace;white-space:nowrap;flex-shrink:0;margin-left:6px;margin-top:6px}
.exam-attend.on{background:rgba(212,242,68,.16);color:var(--acc);border-color:rgba(212,242,68,.4)}
.exam-see-all{display:block;text-align:center;font-size:10px;color:var(--t2);margin-top:10px;text-decoration:none;cursor:pointer}
.exam-see-all:active{color:var(--acc)}
#exov .exam-wrap{margin-top:0;border:none;padding:0;background:none}
#exov .exam-row{align-items:flex-start;flex-wrap:wrap}
.exam-cd{font-size:10px;color:var(--t3);white-space:nowrap;text-align:right;flex-shrink:0}
.exam-cd b{display:block;font-family:'Syne',sans-serif;font-size:15px;font-weight:800;line-height:1;color:var(--t1)}
.exam-cd.soon b{color:var(--warn)}.exam-cd.imminent b{color:var(--bad)}
.exam-note{font-size:9px;color:var(--t3);margin-top:10px;line-height:1.5}
.exam-cal{background:none;border:.5px solid var(--b2);border-radius:6px;color:var(--t2);font-size:9px;padding:4px 8px;cursor:pointer;font-family:'DM Mono',monospace;white-space:nowrap;flex-shrink:0;margin-left:8px}
.exam-cal:active{background:var(--s3)}
.exam-allcal{width:100%;padding:9px;background:none;border:.5px dashed var(--b2);border-radius:8px;color:var(--t2);font-size:11px;cursor:pointer;font-family:'DM Mono',monospace;margin-top:10px;transition:.12s}
.exam-allcal:active{background:var(--s2)}

/* ── SET STATUS (Slack-style) ── */
.h-status-strip{display:flex;align-items:center;gap:11px;background:linear-gradient(135deg,rgba(127,119,221,.10),rgba(212,242,68,.05));border:.5px solid var(--b2);border-radius:var(--r);padding:12px 14px;margin-bottom:12px;cursor:pointer;transition:.15s}
.h-status-strip:active{transform:scale(.99)}
.h-status-strip.set{background:linear-gradient(135deg,rgba(101,207,160,.10),rgba(127,119,221,.06));border-color:rgba(101,207,160,.28)}
.hss-emoji{font-size:20px;flex-shrink:0;line-height:1}
.hss-body{flex:1;min-width:0}
.hss-t{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hss-s{font-size:10px;color:var(--t2);margin-top:1px}
.hss-x{background:none;border:.5px solid var(--b2);border-radius:6px;color:var(--t3);cursor:pointer;font-size:12px;padding:5px 9px;flex-shrink:0;font-family:'DM Mono',monospace}
.st-presets{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:18px}
.st-chip{display:flex;align-items:center;gap:8px;padding:10px 11px;border-radius:8px;border:1px solid var(--b2);background:var(--s2);cursor:pointer;font-size:12px;color:var(--t2);transition:.12s;text-align:left}
.st-chip:active{transform:scale(.97)}
.st-chip.on{border-color:var(--acc);background:rgba(212,242,68,.06);color:var(--acc)}
.st-chip .ste{font-size:16px;flex-shrink:0}
.st-input-row{display:flex;gap:8px;margin-bottom:4px}
.st-durs{display:flex;flex-wrap:wrap;gap:6px}
.st-dur{font-size:10px;font-family:'DM Mono',monospace;border:.5px solid var(--b2);background:var(--s2);color:var(--t2);border-radius:6px;padding:6px 11px;cursor:pointer;transition:.12s}
.st-dur.on{border-color:var(--acc);background:rgba(212,242,68,.1);color:var(--acc)}
/* status pill shown on friend / group rows */
.status-pill{display:inline-flex;align-items:center;gap:5px;font-size:10px;color:#b8b0f5;background:rgba(127,119,221,.12);border:.5px solid rgba(127,119,221,.3);border-radius:12px;padding:2px 8px;margin-top:4px;max-width:100%}
.status-pill .sp-t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ── TIMETABLE CHANGE BANNER ── */
.changes-banner{background:linear-gradient(135deg,rgba(127,119,221,.13),rgba(55,138,221,.06));border:.5px solid rgba(127,119,221,.32);border-radius:var(--r);padding:12px 14px;margin-bottom:12px}
.cb-top{display:flex;align-items:center;gap:9px;margin-bottom:8px}
.cb-ico{font-size:16px}
.cb-t{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--t1);flex:1}
.cb-x{background:none;border:.5px solid var(--b2);border-radius:6px;color:var(--t3);cursor:pointer;font-size:11px;padding:4px 9px;font-family:'DM Mono',monospace}
.cb-row{font-size:11px;color:var(--t2);padding:3px 0;display:flex;align-items:center;gap:7px}
.cb-tag{font-size:8px;font-weight:700;border-radius:4px;padding:2px 6px;flex-shrink:0;font-family:'Syne',sans-serif;text-transform:uppercase}
.cb-tag.add{background:rgba(101,207,160,.15);color:var(--ok)}
.cb-tag.rem{background:rgba(226,75,74,.15);color:var(--bad)}

/* ── ATTENDANCE PROJECTION ── */
.ac-proj{font-size:10px;color:var(--t2);margin-top:6px;padding-top:6px;border-top:.5px dashed var(--b1);line-height:1.5}
.ac-proj b{color:var(--t1);font-weight:500}
.ac-proj .pj-ok{color:var(--ok)}.ac-proj .pj-warn{color:var(--warn)}.ac-proj .pj-bad{color:var(--bad)}

/* ── CONFETTI ── */
#confetti{position:fixed;inset:0;pointer-events:none;z-index:300;overflow:hidden;display:none}
#confetti.go{display:block}
.cf-bit{position:absolute;top:-12px;font-size:16px;will-change:transform,opacity;animation:cf-fall 1.6s linear forwards}
@keyframes cf-fall{0%{transform:translateY(-10px) rotate(0);opacity:1}100%{transform:translateY(102vh) rotate(540deg);opacity:.2}}
/* undo toast */
.toast{position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:120;display:flex;align-items:center;gap:12px;background:var(--s3);border:.5px solid var(--b2);border-radius:10px;padding:10px 14px;font-size:12px;color:var(--t1);box-shadow:0 10px 30px rgba(0,0,0,.55);opacity:0;pointer-events:none;transition:opacity .18s,bottom .18s;max-width:90vw}
.toast.show{opacity:1;pointer-events:auto;bottom:96px}
@media(min-width:900px){.toast{bottom:24px}.toast.show{bottom:32px}}
.toast-undo{background:none;border:.5px solid var(--acc);color:var(--acc);border-radius:6px;padding:5px 11px;font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;flex-shrink:0}

/* ── ATTEND ── */
.att-grid{display:flex;flex-direction:column;gap:8px}
@media(min-width:900px){.att-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}}
.acard{background:var(--s1);border:.5px solid var(--b1);border-radius:var(--r);padding:14px}
.acard.danger{border-color:rgba(226,75,74,.4)}.acard.warn{border-color:rgba(240,184,74,.35)}
.acard-inner{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.acard-left{flex:1;min-width:0}
.ac-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.ac-code{font-size:13px;font-weight:500;color:var(--cc)}
.ac-status{font-size:10px;padding:3px 8px;border-radius:20px}
.ac-status.safe{background:rgba(29,158,117,.15);color:var(--ok)}.ac-status.warn{background:rgba(240,184,74,.15);color:var(--warn)}.ac-status.danger{background:rgba(226,75,74,.15);color:var(--bad)}
.ac-name{font-size:11px;color:var(--t2);font-family:'Syne',sans-serif;margin-bottom:10px}
.ac-stats{display:flex;gap:14px;margin-bottom:10px}
.ac-sv{font-family:'Syne',sans-serif;font-size:18px;font-weight:700;line-height:1}
.ac-sl{font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:.05em;margin-top:2px}
.buffer-bar{height:5px;background:var(--s3);border-radius:3px;overflow:hidden;display:flex;gap:1px;margin-bottom:6px}
.bseg{flex:1;border-radius:1px}.bseg.used{background:var(--badd)}.bseg.free{background:var(--okd)}
.ac-note{font-size:10px;color:var(--t2)}
.share-row{display:flex;justify-content:flex-end;margin-bottom:10px}
.share-btn{display:flex;align-items:center;gap:5px;background:var(--s2);border:.5px solid var(--b2);border-radius:7px;color:var(--t2);font-size:11px;padding:7px 12px;cursor:pointer;font-family:'DM Mono',monospace;transition:.12s}
.share-btn:active{background:var(--s3)}

/* ── PROGRESS ── */
.prog-grid{display:flex;flex-direction:column;gap:8px}
@media(min-width:900px){.prog-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}}
.pcard{background:var(--s1);border:.5px solid var(--b1);border-radius:var(--r);padding:13px}
.pc-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.pc-code{font-size:12px;font-weight:500;color:var(--cc)}.pc-frac{font-size:10px;color:var(--t3)}
.pbar{height:4px;background:var(--s3);border-radius:2px;overflow:hidden}
.pfill{height:100%;background:var(--cc);border-radius:2px;transition:width .6s}

/* ── LEAVE ── */
.lp-impact{background:var(--s1);border:.5px solid var(--b2);border-radius:var(--r);padding:14px;margin-bottom:14px;position:sticky;top:0;z-index:5}
.lp-imp-title{font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}
.lp-imp-row{display:flex;justify-content:space-between;font-size:11px;padding:4px 0;border-bottom:.5px solid var(--b1)}
.lp-imp-row:last-child{border:none}
.lp-imp-warn{color:var(--bad)}.lp-imp-ok{color:var(--t2)}
.lp-intro{font-size:11px;color:var(--t2);line-height:1.6;margin-bottom:14px}
.lp-day{background:var(--s1);border:.5px solid var(--b1);border-radius:9px;padding:10px 12px;margin-bottom:6px}
.lp-date{font-size:11px;font-family:'Syne',sans-serif;font-weight:600;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center}
.lp-toggle{font-size:10px;border:.5px solid var(--b2);border-radius:6px;padding:4px 10px;cursor:pointer;background:var(--s2);color:var(--t2)}
.lp-toggle.on{background:rgba(226,75,74,.16);border-color:var(--badd);color:var(--bad)}
.lp-sess{display:flex;flex-wrap:wrap;gap:4px}
.lp-chip{font-size:10px;border-radius:5px;padding:3px 8px;background:var(--s3);color:var(--t2);border:.5px solid transparent;cursor:pointer}
.lp-chip.planned{background:rgba(226,75,74,.16);color:var(--bad);border-color:var(--badd)}

/* ── OVERLAYS ── */
.ovl-bg{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:100;opacity:0;pointer-events:none;transition:opacity .3s ease;display:flex;align-items:flex-end;justify-content:center}
.ovl-bg.open{opacity:1;pointer-events:auto}
.sheet{background:var(--s1);border:.5px solid var(--b1);border-top:1px solid rgba(255,255,255,0.08);border-radius:24px 24px 0 0;padding:26px 22px max(26px,env(safe-area-inset-bottom));width:100%;max-width:480px;max-height:88vh;overflow-y:auto;transform:translateY(100%);transition:transform .4s cubic-bezier(0.16,1,0.3,1);box-shadow:0 -10px 40px rgba(0,0,0,0.5)}
.ovl-bg.open .sheet{transform:translateY(0)}
@media(min-width:900px){.ovl-bg{align-items:center}.sheet{border-radius:24px;border:1px solid rgba(255,255,255,0.08);transform:scale(0.95);box-shadow:0 15px 50px rgba(0,0,0,0.6)}.ovl-bg.open .sheet{transform:scale(1)}}
body.no-scroll{overflow:hidden}
.ss-t{font-family:'Syne',sans-serif;font-size:16px;font-weight:700;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center}
.ss-x{background:none;border:none;color:var(--t2);cursor:pointer;font-size:19px}
.ss-sub{font-size:10px;color:var(--t3);margin:14px 0 8px;text-transform:uppercase;letter-spacing:.06em}
.databtns{display:flex;gap:8px;margin-top:8px}
.databtn{flex:1;padding:10px;border:.5px solid var(--b2);background:var(--s2);border-radius:8px;color:var(--t2);font-size:11px;cursor:pointer;font-family:'DM Mono',monospace}
.databtn:active{background:var(--s3)}

/* ── FRIENDS ── */
.f-card{background:var(--s2);border:.5px solid var(--b1);border-radius:10px;padding:12px 14px;margin-bottom:8px}
.f-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}
.f-name{font-family:'Syne',sans-serif;font-size:14px;font-weight:700}
.f-roll{font-size:10px;color:var(--t3);margin-top:1px}
.f-del{background:none;border:.5px solid var(--b2);border-radius:6px;color:var(--t3);cursor:pointer;font-size:10px;padding:8px 12px;font-family:'DM Mono',monospace;min-height:32px}
.fov-tabs{display:flex;gap:6px;margin:14px 0}
.fov-tabs .secbtn{padding:9px;font-size:12px}
.f-now{font-size:11px;color:var(--ok);display:flex;align-items:center;gap:5px}
.f-now::before{content:"●";font-size:8px;animation:pulse 1.5s infinite}
.f-next{font-size:11px;color:var(--t2)}.f-free{font-size:11px;color:var(--t3)}
.f-add-form{background:var(--s2);border:.5px solid var(--b1);border-radius:10px;padding:14px;margin-top:12px;display:none}
.f-add-title{font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px}
/* roll/name autocomplete */
.sug-wrap{position:relative}
.sug-box{display:none;position:absolute;left:0;right:0;top:100%;z-index:40;background:var(--s2);border:.5px solid var(--b2);border-radius:9px;margin-top:3px;overflow:hidden;box-shadow:0 8px 22px rgba(0,0,0,.5)}
.sug-item{display:flex;align-items:center;gap:8px;padding:9px 11px;cursor:pointer;border-bottom:.5px solid var(--b1)}
.sug-item:last-child{border:none}.sug-item:active,.sug-item:hover{background:var(--s3)}
.sug-roll{font-size:11px;color:var(--acc);font-family:'DM Mono',monospace;flex-shrink:0;width:54px}
.sug-name{flex:1;font-size:12px;color:var(--t1);font-family:'Syne',sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sug-sec{font-size:9px;color:var(--t3);border:.5px solid var(--b2);border-radius:10px;padding:1px 6px;flex-shrink:0}
.f-srow{display:flex;gap:8px}
.f-srow .ob-input{flex:1;margin:0}
.f-gobtn{background:var(--acc);color:#0a0a0b;border:none;border-radius:9px;padding:0 16px;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap}
/* groups */
.g-card{background:var(--s2);border:.5px solid var(--b1);border-radius:10px;margin-bottom:8px;overflow:hidden}
.g-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;cursor:pointer}
.g-name{font-family:'Syne',sans-serif;font-size:14px;font-weight:700}
.g-meta{font-size:10px;color:var(--t3);margin-top:1px}
.g-chev{color:var(--t3);font-size:13px;transition:.15s}
.g-card.open .g-chev{transform:rotate(180deg);color:var(--acc)}
.g-body{padding:0 14px 12px;border-top:.5px solid var(--b1)}
.g-summary{font-size:10px;color:var(--t2);padding:8px 0}
.gm-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:.5px solid var(--b1)}
.gm-row:last-child{border:none}
.gm-name{font-size:12px;color:var(--t1);font-family:'Syne',sans-serif;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gm-roll{font-size:9px;color:var(--t3);font-family:'DM Mono',monospace}
.g-actions{display:flex;gap:8px;margin-top:10px}
.g-act{flex:1;background:var(--s3);border:.5px solid var(--b2);border-radius:7px;color:var(--t2);font-size:11px;padding:8px;cursor:pointer;font-family:'DM Mono',monospace}
.g-act.warn{color:var(--bad)}

/* ── TIMELINE ── */
#tlsheet{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:110;display:none;align-items:flex-end;justify-content:center}
#tlsheet.open{display:flex}
.tl-inner{background:var(--s1);border:.5px solid var(--b2);border-radius:18px 18px 0 0;width:100%;max-width:480px;max-height:82vh;display:flex;flex-direction:column;animation:up .2s ease}
@media(min-width:900px){#tlsheet{align-items:center}.tl-inner{border-radius:18px;max-height:78vh}}
.tl-head{display:flex;justify-content:space-between;align-items:center;padding:18px 20px 12px;border-bottom:.5px solid var(--b1);flex-shrink:0}
.tl-title{font-family:'Syne',sans-serif;font-size:14px;font-weight:700}
.tl-close{background:none;border:none;color:var(--t2);cursor:pointer;font-size:19px;padding:0}
.tl-body{overflow-y:auto;padding:8px 20px 20px;-webkit-overflow-scrolling:touch}
.tl-row{display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:.5px solid var(--b1)}
.tl-row:last-child{border:none}
.tl-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.tl-sn{font-size:10px;color:var(--t3);width:24px;flex-shrink:0}
.tl-date{font-size:11px;color:var(--t1);flex:1}
.tl-slot{font-size:10px;color:var(--t3);white-space:nowrap}
.tl-st{font-size:9px;font-weight:500;padding:2px 7px;border-radius:12px;margin-left:4px;white-space:nowrap}
.tl-st.present{background:rgba(29,158,117,.15);color:var(--ok)}.tl-st.absent{background:rgba(226,75,74,.15);color:var(--bad)}
.tl-st.upcoming,.tl-st.unmarked{background:var(--s3);color:var(--t3)}
.tl-btn{background:none;border:.5px solid var(--b2);border-radius:6px;color:var(--t2);font-size:10px;padding:5px 10px;cursor:pointer;font-family:'DM Mono',monospace;width:100%;margin-top:10px;text-align:center}
.footer{text-align:center;padding:24px 14px;font-size:9px;color:var(--t3)}

/* ── GROUP TRIP PLANNER STYLES ── */
.gp-teal-free { background: #2ec4b6 !important; }
.gp-lime-low { background: rgba(212, 242, 68, 0.75) !important; }
.gp-yellow-med { background: rgba(240, 184, 74, 0.75) !important; }
.gp-red-heavy { background: rgba(226, 75, 74, 0.75) !important; }

.gp-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
}
@media(max-width: 900px) {
  .gp-grid {
    grid-template-columns: 1fr;
  }
}
.gp-inspector-panel {
  display: flex;
  flex-direction: column;
}
.gp-member-pill {
  font-size: 8px;
  background: var(--s2);
  border: .5px solid var(--b2);
  border-radius: 12px;
  padding: 2px 7px;
  color: var(--t2);
  display: inline-block;
  margin-right: 4px;
  margin-bottom: 4px;
}
.gp-slot-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: .5px solid var(--b1);
}
.gp-slot-row:last-child {
  border-bottom: none;
}
.gp-slot-time {
  font-size: 10px;
  color: var(--t3);
  width: 90px;
  flex-shrink: 0;
}
.gp-slot-status {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.gp-user-dot {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Syne', sans-serif;
  font-weight: 500;
}
.gp-user-dot.free {
  background: rgba(46, 196, 182, 0.12);
  color: #2ec4b6;
  border: .5px solid rgba(46, 196, 182, 0.3);
}
.gp-user-dot.busy {
  background: rgba(226, 75, 74, 0.12);
  color: var(--bad);
  border: .5px solid rgba(226, 75, 74, 0.3);
}
.gp-insight-card {
  background: var(--s2);
  border: .5px solid var(--b2);
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: .15s;
}
.gp-insight-card:hover {
  border-color: var(--acc);
  background: rgba(212,242,68,0.02);
}
.duration-selector {
  display: flex;
  background: var(--s1);
  border: 0.5px solid var(--b2);
  border-radius: 12px;
  padding: 2px;
}
.dur-btn {
  background: transparent;
  border: none;
  color: var(--t3);
  font-size: 10px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.dur-btn:hover {
  color: var(--t2);
}
.dur-btn.active {
  background: var(--acc);
  color: var(--b1);
}

/* ── TERM PROGRESS BAR ── */
.term-progress-wrap{background:var(--s1);border:.5px solid var(--b1);border-radius:var(--r);padding:10px 14px;margin-bottom:12px}
.tp-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.tp-label{font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:.07em}
.tp-pct{font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--acc)}
.tp-bar{height:4px;background:var(--s3);border-radius:2px;overflow:hidden;position:relative}
.tp-fill{height:100%;background:linear-gradient(90deg,var(--acc),#7f77dd);border-radius:2px;width:0%;transition:width 1s ease-out;position:relative}
.tp-fill::after{content:'';position:absolute;top:0;right:0;bottom:0;width:30px;background:rgba(255,255,255,0.15);filter:blur(3px);transform:skewX(-20deg);animation:tp-shimmer 2s infinite}
@keyframes tp-shimmer{0%{left:-30px}100%{left:100%}}

/* ── HERO STATS GRID V2 ── */
.hero-v2{display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:12px}
@media(min-width:480px){.hero-v2{grid-template-columns:1fr 1fr}}
.hcard-v2{background:var(--s1);border:.5px solid var(--b1);border-radius:var(--r);padding:14px 16px;display:flex;align-items:center;justify-content:space-between;position:relative;overflow:hidden;transition:.15s}
.hcard-v2.danger-glow{box-shadow:0 0 15px rgba(226,75,74,0.18);border-color:rgba(226,75,74,0.3)}
.hcard-v2.safe-glow{box-shadow:0 0 15px rgba(101,207,160,0.08);border-color:rgba(101,207,160,0.15)}
.hc-content{flex:1;min-width:0;display:flex;flex-direction:column}
.hc-title{font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px}
.hc-value{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-.03em;line-height:1.1}
.hc-sub{font-size:10px;color:var(--t2);margin-top:4px}
.hc-visual{flex-shrink:0;margin-left:12px}

/* Slider for Bunk-o-Meter & Sessions */
.bunk-slider-wrap{margin-top:8px;width:100%}
.bunk-slider-track{height:5px;background:var(--s3);border-radius:2.5px;position:relative;overflow:hidden}
.bunk-slider-fill{height:100%;border-radius:2.5px;transition:width 0.4s ease-out;position:relative}
.bunk-slider-fill.safe{background:var(--ok)}
.bunk-slider-fill.warn{background:var(--warn)}
.bunk-slider-fill.danger{background:var(--bad)}

/* Streak Glow */
.streak-value{display:flex;align-items:center;gap:6px}
.streak-flame{font-size:20px;animation:flame-pulse 1.2s infinite alternate}
@keyframes flame-pulse{
  0%{transform:scale(0.9);filter:drop-shadow(0 0 2px var(--warn))}
  100%{transform:scale(1.15);filter:drop-shadow(0 0 8px #ef9f27)}
}

/* Live Class Radar Pulse */
.pulse-live {
  display: inline-block;
  width: 7px;
  height: 7px;
  background-color: var(--ok);
  border-radius: 50%;
  position: relative;
  margin-right: 6px;
  vertical-align: middle;
}
.pulse-live::after {
  content: '';
  position: absolute;
  inset: -3px;
  border: 1.5px solid var(--ok);
  border-radius: 50%;
  animation: radar-pulse 1.5s infinite ease-out;
}
@keyframes radar-pulse {
  0% { transform: scale(0.6); opacity: 1; }
  100% { transform: scale(2.2); opacity: 0; }
}
.nb-l .pulse-live {
  margin-top: -2px;
}
</style>
</head>
<body>
<div id="onboard">
  <div class="ob">
    <div class="ob-tag">XLRI Delhi NCR · Term IV · 2025–27</div>
    <div class="ob-h">Your term,<br>fully tracked.</div>
    <div class="ob-p">Timetable, attendance, and leave planner — live from the master sheet. Attendance syncs across devices with your roll number.</div>
    <div class="ob-restore">
      <div class="ob-l" style="margin-bottom:8px">↩ Returning? Restore your setup</div>
      <div class="ob-restore-row">
        <div class="sug-wrap" style="flex:1;">
          <input type="text" id="ob-restore-roll" class="ob-input" placeholder="B25349" autocomplete="off" oninput="renderSug('ob-restore-sug',this.value)" onfocus="trackOnboardFocus(this)" style="text-transform:uppercase;margin:0;width:100%">
          <div id="ob-restore-sug" class="sug-box"></div>
        </div>
        <button class="ob-restore-btn" onclick="doRestore()">Restore</button>
      </div>
      <div id="ob-restore-hint" style="font-size:10px;color:var(--t3);margin-top:6px"></div>
    </div>
    <div class="ob-or">or set up new</div>
    <div class="ob-l">Roll number</div>
    <div class="sug-wrap">
      <input type="text" id="ob-roll" class="ob-input" placeholder="B25301" autocomplete="off" oninput="obReady();renderSug('ob-roll-sug',this.value)" onfocus="trackOnboardFocus(this)" style="text-transform:uppercase">
      <div id="ob-roll-sug" class="sug-box"></div>
    </div>
    <div class="ob-hint">B25301 – B25480</div>
    <div class="ob-l">Section</div>
    <div class="secrow"><button class="secbtn" data-s="E" onclick="obSec(this)">Section E</button><button class="secbtn" data-s="F" onclick="obSec(this)">Section F</button></div>
    <div class="ob-l">Your courses</div>
    <div class="cgrid" id="ob-cgrid"></div>
    <button class="cta" id="ob-cta" disabled onclick="obSave()">Continue →</button>
    
    <!-- VISUAL NUMPAD -->
    <div class="ob-numpad" id="ob-numpad" style="display:none;">
      <div class="np-grid">
        <button class="np-btn" onclick="handleNumpadPress('1')">1</button>
        <button class="np-btn" onclick="handleNumpadPress('2')">2</button>
        <button class="np-btn" onclick="handleNumpadPress('3')">3</button>
        <button class="np-btn" onclick="handleNumpadPress('4')">4</button>
        <button class="np-btn" onclick="handleNumpadPress('5')">5</button>
        <button class="np-btn" onclick="handleNumpadPress('6')">6</button>
        <button class="np-btn" onclick="handleNumpadPress('7')">7</button>
        <button class="np-btn" onclick="handleNumpadPress('8')">8</button>
        <button class="np-btn" onclick="handleNumpadPress('9')">9</button>
        <button class="np-btn" onclick="handleNumpadPress('B25')" style="font-size:11px;color:var(--acc)">B25</button>
        <button class="np-btn" onclick="handleNumpadPress('0')">0</button>
        <button class="np-btn" onclick="handleNumpadPress('back')">⌫</button>
      </div>
    </div>
  </div>
</div>

<!-- ── VIEW MODE: read-only timetable for shared links (?view=B25xxx) ── -->
<div id="view-mode" style="display:none;min-height:100vh;background:var(--bg);color:var(--t1)">
  <div class="top" style="position:sticky;top:0;z-index:20">
    <div class="top-l">
      <span class="top-logo" id="vm-name">Timetable</span>
      <span class="top-badge" id="vm-badge">—</span>
    </div>
    <div class="top-r">
      <a id="vm-setup-link" class="iconbtn" href="#" style="text-decoration:none;font-size:11px;white-space:nowrap">Set up yours →</a>
    </div>
  </div>
  <div class="content">
    <div id="vm-loading" style="display:flex;align-items:center;justify-content:center;height:50vh;gap:12px;flex-direction:column">
      <div style="font-size:28px;animation:spin 1s linear infinite">⟳</div>
      <div style="color:var(--t2);font-size:12px">Loading timetable…</div>
    </div>
    <div id="vm-error" class="errbar" style="display:none"></div>
    <div id="vm-content" style="display:none">
      <div id="vm-next-banner"></div>
      <!-- tab strip -->
      <div style="display:flex;gap:6px;margin-bottom:16px">
        <button class="secbtn on" data-vmtab="today" onclick="switchVmTab('today',this)" style="font-size:12px;padding:8px 14px">Today</button>
        <button class="secbtn" data-vmtab="week" onclick="switchVmTab('week',this)" style="font-size:12px;padding:8px 14px">Week</button>
      </div>
      <!-- today + tomorrow pane -->
      <div id="vm-today-pane">
        <div id="vm-today"></div>
        <div id="vm-tomorrow" style="margin-top:16px"></div>
        <div id="vm-exams" style="margin-top:16px"></div>
      </div>
      <!-- week pane -->
      <div id="vm-week-pane" style="display:none">
        <div class="wknav">
          <button class="wkbtn" id="vm-pw" onclick="shiftVmWk(-1)">←</button>
          <span class="wkl" id="vm-wkl"></span>
          <button class="wkbtn" id="vm-nw" onclick="shiftVmWk(1)">→</button>
        </div>
        <div class="wkgrid" id="vm-wkgrid"></div>
      </div>
    </div>
    <div class="footer" style="padding-bottom:30px">
      Read-only shared view ·
      <a id="vm-cta-link" href="#" style="color:var(--acc);text-decoration:none">Set up your own timetable →</a>
    </div>
  </div>
</div>

<div id="shell" style="display:none">
  <nav id="sidebar" style="display:none">
    <div class="sb-logo">Term IV</div>
    <div class="sb-badge" id="sb-badge">Sec E</div>
    <div class="sb-nav">
      <button class="sb-item on" data-p="home" onclick="nav('home',this)">◫ Home</button>
      <button class="sb-item" data-p="week" onclick="nav('week',this)">▦ Week</button>
      <button class="sb-item" data-p="att" onclick="nav('att',this)">✓ Attend</button>
      <button class="sb-item" data-p="leave" onclick="nav('leave',this)">⊘ Leave</button>
      <button class="sb-item" data-p="prog" onclick="nav('prog',this)">◴ Progress</button>
    </div>
    <div class="sb-footer">
      <button class="sb-item" id="refresh-btn-sb" onclick="refreshNow()"><span class="refresh-ico">⟳</span> Refresh</button>
      <button class="sb-item" onclick="openTripPlanner()">✈️ Solo Trip Planner</button>
      <button class="sb-item" onclick="openExams()">📌 Assessments</button>
      <button class="sb-item" onclick="shareMyTimetable()">↗ Share timetable</button>
      <button class="sb-item" onclick="openSheet()">🔗 Master sheet</button>
      <button class="sb-item" onclick="openIdea()">💡 Submit idea</button>
      <button class="sb-item" onclick="openF()">👥 Friends</button>
      <button class="sb-item" onclick="openS()">⚙ Settings</button>
      <div class="sb-sync" id="sb-sync"></div>
    </div>
  </nav>

  <div id="main-wrap">
    <div class="top">
      <div class="top-l"><span class="top-logo">Term IV</span><span class="top-badge" id="top-badge">Sec E</span></div>
      <div class="top-r">
        <button class="iconbtn" id="refresh-btn" onclick="refreshNow()" title="Refresh from sheet"><span class="refresh-ico">⟳</span></button>
        <button class="iconbtn" onclick="openF()" title="Friends">👥</button>
        <button class="iconbtn" onclick="openMenu()" title="More Options">⋮</button>
      </div>
    </div>
    <div class="content">
      <div class="synced" id="synced"></div>
      <div id="errbox"></div>

      <div class="panel on" id="p-home">
        <div id="gp-install-hint" class="install-hint" style="display:none;">
          <div class="ih-ico">📱</div>
          <div class="ih-body">
            <div class="ih-t">Add Term IV to Home Screen</div>
            <div class="ih-s">Launch full-screen from your app library.</div>
          </div>
          <button class="ih-cta" onclick="showInstallModal()">Install</button>
          <button class="ih-x" onclick="dismissInstallHint()">✕</button>
        </div>
        <div class="install-hint" id="h-share-tt" style="cursor:pointer;margin-bottom:10px" onclick="shareMyTimetable()">
          <div class="ih-ico">↗</div>
          <div class="ih-body">
            <div class="ih-t">Share your timetable</div>
            <div class="ih-s">Anyone with the link can view your schedule.</div>
          </div>
          <button class="ih-cta" onclick="event.stopPropagation();shareMyTimetable()">Copy link</button>
        </div>
        <div id="h-status"></div>
        <div id="h-ios"></div>
        <!-- TERM PROGRESS TICKER -->
        <div class="term-progress-wrap">
          <div class="tp-top">
            <div class="tp-label" id="h-term-elapsed">Term Progression</div>
            <div class="tp-pct" id="h-term-pct">0%</div>
          </div>
          <div class="tp-bar"><div class="tp-fill" id="h-term-fill"></div></div>
        </div>

        <div id="ann-wrap"></div>
        <div id="h-changes"></div>
        <div id="h-early"></div>
        <div class="hero-v2" id="h-hero-v2"></div>
        <div id="week-heat" class="week-heat"></div>
        <div id="h-banner"></div>
        <div id="h-nudge"></div>
        <div id="today-strip" class="t-strip" style="display:none"></div>
        <div id="h-today"></div>
        <div id="h-tomorrow"></div>
        <div id="h-exams"></div>
      </div>

      <div class="panel" id="p-week">
        <div class="wknav">
          <button class="wkbtn" id="pw" onclick="shiftWk(-1)">←</button>
          <span class="wkl" id="wkl"></span>
          <button class="wkbtn" id="nw" onclick="shiftWk(1)">→</button>
        </div>
        <div class="wkgrid" id="wkgrid"></div>
        <div id="heatmap-ct"></div>
      </div>

      <div class="panel" id="p-att"></div>
      <div class="panel" id="p-leave"></div>
      <div class="panel" id="p-prog"></div>
      <div class="footer">Live from the master timetable · session keys stable across reschedules</div>
    </div>
  </div>

  <div class="bottomnav" id="bnav">
    <button class="bn-item on" data-p="home" onclick="nav('home',this)"><span class="bn-ico">◫</span>Home</button>
    <button class="bn-item" data-p="week" onclick="nav('week',this)"><span class="bn-ico">▦</span>Week</button>
    <button class="bn-item" data-p="att" onclick="nav('att',this)"><span class="bn-ico">✓</span>Attend</button>
    <button class="bn-item" data-p="leave" onclick="nav('leave',this)"><span class="bn-ico">⊘</span>Leave</button>
    <button class="bn-item" data-p="prog" onclick="nav('prog',this)"><span class="bn-ico">◴</span>Progress</button>
  </div>
  <div id="toast" class="toast"></div>
</div>
<div id="confetti"></div>

<!-- INSTALL MODAL -->
<div id="imov" class="ovl-bg" onclick="if(event.target.id==='imov')closeInstallModal()">
  <div class="sheet" style="max-width:420px">
    <div class="ss-t">📱 Install App <button class="ss-x" onclick="closeInstallModal()">✕</button></div>
    <div class="inst-benefit">Add the app to your Home Screen to launch in full-screen standalone mode without the browser URL bar.</div>
    
    <div class="inst-tabs">
      <button class="inst-tab on" id="itab-safari" onclick="setInstTab('safari')">iOS / Safari</button>
      <button class="inst-tab" id="itab-chrome" onclick="setInstTab('chrome')">Android / Chrome</button>
    </div>
    
    <div id="inst-content-safari">
      <div class="inst-step"><div class="inst-num">1</div><div class="inst-txt">Tap the <b>Share</b> button <span style="font-size:15px;">⎙</span> in the browser toolbar.</div></div>
      <div class="inst-step"><div class="inst-num">2</div><div class="inst-txt">Scroll down and tap <b>Add to Home Screen</b> <span style="font-size:15px;">⊕</span>.</div></div>
      <div class="inst-note"><b>Note:</b> This option is only available when opening the link inside Safari.</div>
    </div>
    
    <div id="inst-content-chrome" style="display:none;">
      <div class="inst-step"><div class="inst-num">1</div><div class="inst-txt">Tap the <b>Menu</b> button <span style="font-size:15px;">⋮</span> in the top right corner.</div></div>
      <div class="inst-step"><div class="inst-num">2</div><div class="inst-txt">Tap <b>Add to Home Screen</b> or <b>Install App</b>.</div></div>
      <div class="inst-note"><b>Note:</b> Available on Chrome, Edge, and other major Android browsers.</div>
    </div>
    
    <button class="cta" onclick="closeInstallModal()" style="margin-top:14px;">Got it</button>
  </div>
</div>

<!-- INFO MODAL -->
<div id="info-modal" class="ovl-bg" onclick="if(event.target.id==='info-modal')closeInfoModal()">
  <div class="sheet" style="max-width:380px;">
    <div class="ss-t"><span id="info-modal-title">Information</span> <button class="ss-x" onclick="closeInfoModal()">✕</button></div>
    <div id="info-modal-body" style="font-size:12px;line-height:1.6;color:var(--t2);margin-top:12px;"></div>
    <button class="cta" onclick="closeInfoModal()" style="margin-top:14px;">Got it</button>
  </div>
</div>

<!-- EXAMS / ASSESSMENTS -->
<!-- UNMARKED ATTENDANCE -->
<div id="unmarked-ov" class="ovl-bg" onclick="if(event.target.id==='unmarked-ov')closeUnmarked()">
  <div class="sheet">
    <div class="ss-t">Unmarked Sessions <button class="ss-x" onclick="closeUnmarked()">✕</button></div>
    <button class="bulk-btn" onclick="bulkMarkPresent()" style="margin-bottom:14px">Mark all past unmarked → Present</button>
    <div id="unmarked-full-list" style="max-height:60vh;overflow-y:auto;padding-right:4px;"></div>
  </div>
</div>

<div id="exov" class="ovl-bg" onclick="if(event.target.id==='exov')closeExams()">
  <div class="sheet">
    <div class="ss-t">📌 Assessments <button class="ss-x" onclick="closeExams()">✕</button></div>
    <div id="ex-full-list"></div>
  </div>
</div>

<!-- SET STATUS -->
<div id="stov" class="ovl-bg" onclick="if(event.target.id==='stov')closeStatus()">
  <div class="sheet" style="max-width:420px">
    <div class="ss-t">Set your status <button class="ss-x" onclick="closeStatus()">✕</button></div>
    <div style="font-size:11px;color:var(--t2);line-height:1.6;margin-bottom:14px">Let friends know what you're up to. They'll see it when they check your schedule — handy for planning around free time.</div>
    <div class="st-presets" id="st-presets"></div>
    <div class="ss-sub">Or write your own</div>
    <div class="st-input-row">
      <input type="text" id="st-emoji" class="ob-input" maxlength="2" placeholder="🙂" style="width:54px;text-align:center;margin:0">
      <input type="text" id="st-text" class="ob-input" maxlength="80" placeholder="What's up?" style="flex:1;margin:0" oninput="stPreview()">
    </div>
    <div class="ss-sub">Clear after</div>
    <div class="st-durs" id="st-durs"></div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="cta" style="flex:1;margin:0" onclick="saveStatus()">Save status</button>
      <button class="cta" style="flex:0 0 auto;margin:0;background:var(--s2);color:var(--bad);border:.5px solid var(--b2);padding:13px 16px" onclick="clearStatus()">Clear</button>
    </div>
  </div>
</div>

<!-- MORE MENU -->
<div id="menu-ov" class="ovl-bg" onclick="if(event.target.id==='menu-ov')closeMenu()">
  <div class="sheet">
    <div class="ss-t">More <button class="ss-x" onclick="closeMenu()">✕</button></div>
    <div class="databtns" style="display:flex;flex-direction:column;gap:8px">
      <button class="databtn" style="text-align:left;padding:12px 16px;font-size:15px;display:flex;align-items:center" onclick="openTripPlanner()"><span style="margin-right:12px;font-size:18px">✈️</span> Solo Trip Planner</button>
      <button class="databtn" style="text-align:left;padding:12px 16px;font-size:15px;display:flex;align-items:center" onclick="openExams()"><span style="margin-right:12px;font-size:18px">📌</span> Assessments</button>
      <button class="databtn" style="text-align:left;padding:12px 16px;font-size:15px;display:flex;align-items:center" onclick="openS()"><span style="margin-right:12px;font-size:18px">⚙️</span> Settings</button>
      <button class="databtn" style="text-align:left;padding:12px 16px;font-size:15px;display:flex;align-items:center" onclick="shareMyTimetable()"><span style="margin-right:12px;font-size:18px">↗️</span> Share timetable</button>
      <button class="databtn" style="text-align:left;padding:12px 16px;font-size:15px;display:flex;align-items:center" onclick="openSheet()"><span style="margin-right:12px;font-size:18px">🔗</span> Master sheet</button>
      <button class="databtn" style="text-align:left;padding:12px 16px;font-size:15px;display:flex;align-items:center" onclick="openIdea()"><span style="margin-right:12px;font-size:18px">💡</span> Submit idea</button>
    </div>
  </div>
</div>

<!-- TRIP PLANNER -->
<div id="trip-ov" class="ovl-bg" onclick="if(event.target.id==='trip-ov')closeTripPlanner()">
  <div class="sheet">
    <div class="ss-t">Solo Trip Planner <button class="ss-x" onclick="closeTripPlanner()">✕</button></div>
    <div class="fov-tabs" style="margin-bottom:12px">
      <button class="secbtn on" id="trip-tab-btn-1" onclick="switchTripTab(1)">Upcoming Gaps</button>
      <button class="secbtn" id="trip-tab-btn-2" onclick="switchTripTab(2)">Custom Trip</button>
    </div>
    
    <div id="trip-tab-1">
      <div style="font-size:12px;color:var(--t2);margin-bottom:12px">Automatically finding consecutive days (2+) with minimal classes.</div>
      <div id="trip-gaps-list" style="max-height:50vh;overflow-y:auto;padding-right:4px;"></div>
    </div>
    
    <div id="trip-tab-2" style="display:none">
      <div class="ss-sub">Trip Duration (days)</div>
      <input type="number" id="trip-dur" class="ob-input" value="3" min="1" max="14" style="margin-bottom:12px" onchange="calcCustomTrip()">
      <div class="ss-sub">Max classes you're willing to miss total</div>
      <input type="number" id="trip-max-miss" class="ob-input" value="2" min="0" max="10" style="margin-bottom:12px" onchange="calcCustomTrip()">
      <div id="trip-custom-list" style="max-height:40vh;overflow-y:auto;padding-right:4px;"></div>
    </div>
  </div>
</div>

<!-- SETTINGS -->
<div id="sov" class="ovl-bg" onclick="if(event.target.id==='sov')closeS()">
  <div class="sheet">
    <div class="ss-t">Settings <button class="ss-x" onclick="closeS()">✕</button></div>
    <div class="ss-sub">Roll number</div>
    <input type="text" id="ss-roll" class="ob-input" placeholder="B25301" autocomplete="off" style="text-transform:uppercase;margin-bottom:14px">
    <div class="ss-sub">Section</div><div class="secrow" id="ss-sec"></div>
    <div class="ss-sub">Courses</div>
    <div class="cgrid" id="ss-cgrid" style="max-height:260px"></div>
    <button class="cta" style="margin-top:16px" onclick="applyS()">Save changes</button>
    <div class="ss-sub">Your data</div>
    <div class="databtns">
      <button class="databtn" onclick="exportData()">⤓ Export</button>
      <button class="databtn" onclick="document.getElementById('imp').click()">⤒ Import</button>
    </div>
    <input type="file" id="imp" accept=".json" style="display:none" onchange="importData(event)">
    <div class="databtns" style="margin-top:8px">
      <button class="databtn" onclick="exportTimetableICS()">📅 Add timetable to calendar</button>
    </div>
    <div class="databtns" style="margin-top:8px">
      <button class="databtn" style="color:var(--bad)" onclick="resetAll()">↺ Reset everything</button>
    </div>
  </div>
</div>

<!-- FRIENDS -->
<div id="fov" class="ovl-bg" onclick="if(event.target.id==='fov')closeF()">
  <div class="sheet">
    <div class="ss-t">People <button class="ss-x" onclick="closeF()">✕</button></div>

    <!-- INSTANT SEARCH: anyone's class, right now — always visible, most common quick action -->
    <div class="ss-sub">Find anyone's class now</div>
    <div class="sug-wrap">
      <div class="f-srow">
        <input type="text" id="f-search" class="ob-input" placeholder="Search by roll number or name" autocomplete="off" oninput="onSearchInput()" onkeydown="if(event.key==='Enter')searchRoll()">
        <button class="f-gobtn" onclick="searchRoll()">Go</button>
      </div>
      <div id="f-search-sug" class="sug-box"></div>
    </div>
    <div id="f-search-result"></div>

    <!-- Two focused panes instead of one long stacked list — each screen is
         shorter and single-purpose, which is the actual mobile-readability fix. -->
    <div class="fov-tabs">
      <button class="secbtn on" data-fovtab="friends" onclick="switchFovTab('friends',this)">👤 Friends</button>
      <button class="secbtn" data-fovtab="groups" onclick="switchFovTab('groups',this)">👥 Groups</button>
    </div>

    <div id="fov-friends-pane">
      <div class="ss-sub" style="display:flex;justify-content:space-between;align-items:center"><span>Friends</span><span id="f-sync-status" style="font-size:9px;color:var(--t3);text-transform:none;letter-spacing:0;font-weight:normal;display:none;animation:pulse 1.5s infinite">syncing...</span></div>
      <div id="f-list"></div>
      <button class="cta" style="margin-top:4px" onclick="showAddFriend()">+ Add friend</button>
      <div id="f-add-form" class="f-add-form">
        <div class="f-add-title">New friend</div>
        <div class="ob-l">Roll number</div>
        <div class="sug-wrap">
          <input type="text" id="f-roll" class="ob-input" placeholder="B25302" autocomplete="off" oninput="onFriendRollInput()" style="text-transform:uppercase;margin-bottom:4px">
          <div id="f-roll-sug" class="sug-box"></div>
        </div>
        <div class="ob-hint">Start typing a roll number or name — pick from the list.</div>
        <div id="f-add-hint" style="font-size:10px;color:var(--t3);margin-bottom:10px"></div>
        <div class="ob-l">Name <span style="color:var(--t3);text-transform:none;letter-spacing:0">(auto-filled, editable)</span></div>
        <input type="text" id="f-name" class="ob-input" placeholder="Rahul" autocomplete="off">
        <button class="cta" style="margin-top:10px" onclick="saveFriend()">Add friend</button>
      </div>
    </div>

    <div id="fov-groups-pane" style="display:none">
      <div class="ss-sub" style="display:flex;justify-content:space-between;align-items:center"><span>Groups</span><span id="g-sync-status" style="font-size:9px;color:var(--t3);text-transform:none;letter-spacing:0;font-weight:normal;display:none;animation:pulse 1.5s infinite">syncing...</span></div>
      <div id="g-list"></div>
      <div class="databtns">
        <button class="databtn" onclick="createGroupUI()">＋ Create group</button>
        <button class="databtn" onclick="joinGroupUI()">⊕ Join with code</button>
      </div>

      <div id="g-add-form" class="f-add-form" style="display:none;margin-top:12px;margin-bottom:12px;">
        <div class="f-add-title" id="g-add-title">Add member to group</div>
        <div class="ob-l">Member Name or Roll Number</div>
        <div class="sug-wrap">
          <input type="text" id="g-member-roll" class="ob-input" placeholder="Rahul or B25301" autocomplete="off" oninput="onGroupMemberInput()" style="text-transform:uppercase;margin-bottom:4px">
          <div id="g-member-sug" class="sug-box"></div>
        </div>
        <div class="ob-hint">Start typing a name or roll number, then pick from the list.</div>
        <div id="g-add-hint" style="font-size:10px;color:var(--t3);margin-bottom:10px"></div>
        <div style="display:flex;gap:8px;">
          <button class="cta" onclick="saveGroupMember()" style="flex:1;margin-top:0;">Add Member</button>
          <button class="cta" onclick="closeAddMemberUI()" style="flex:1;margin-top:0;background:var(--s2);color:var(--t2);border:.5px solid var(--b2);">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- SUBMIT IDEA -->
<div id="idov" class="ovl-bg" onclick="if(event.target.id==='idov')closeIdea()">
  <div class="sheet" style="max-width:420px">
    <div class="ss-t">💡 Submit an idea <button class="ss-x" onclick="closeIdea()">✕</button></div>
    <div style="font-size:11px;color:var(--t2);line-height:1.6;margin-bottom:12px">Got a feature you'd love? Describe it below and hit submit — it opens a WhatsApp chat to Jai with your idea ready to send.</div>
    <textarea id="idea-text" class="ob-input" rows="4" placeholder="e.g. Show a countdown to the next exam on the home screen" style="resize:vertical;min-height:90px;font-family:'DM Mono',monospace"></textarea>
    <div id="idea-hint" style="font-size:10px;color:var(--t3);margin:6px 0 12px"></div>
    <button class="cta" onclick="submitIdea()">Send via WhatsApp →</button>
  </div>
</div>

<!-- TIMELINE -->
<div id="tlsheet" onclick="if(event.target.id==='tlsheet')closeTL()">
  <div class="tl-inner">
    <div class="tl-head">
      <span class="tl-title" id="tl-title"></span>
      <button class="tl-close" onclick="closeTL()">✕</button>
    </div>
    <div class="tl-body" id="tl-body"></div>
  </div>
</div>

<!-- GROUP TRIP PLANNER -->
<div id="group-planner" style="display:none;min-height:100vh;background:var(--bg);color:var(--t1);padding:20px;position:relative;z-index:10;">
  <!-- Loading state -->
  <div id="gp-loading" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:80vh;gap:12px;">
    <div style="font-size:24px;animation:spin 1s linear infinite;">⟳</div>
    <div style="font-family:'Syne',sans-serif;font-weight:600;font-size:16px;">Loading Group Trip Planner...</div>
    <div id="gp-loading-detail" style="font-size:11px;color:var(--t3);">Fetching group schedule data</div>
  </div>
  
  <!-- Content view (initially hidden) -->
  <div id="gp-content" style="display:none;max-width:1100px;margin:0 auto;">
    <!-- Header banner -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:.5px solid var(--b1);padding-bottom:16px;margin-bottom:20px;flex-wrap:wrap;gap:16px;">
      <div>
        <div id="gp-group-name" style="font-family:'Syne',sans-serif;font-size:24px;font-weight:800;letter-spacing:-.02em;color:var(--acc);">Group Name</div>
        <div id="gp-group-meta" style="font-size:12px;color:var(--t2);margin-top:4px;">Loading members...</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="iconbtn" onclick="refreshGroupPlanner()" title="Refresh" id="gp-refresh-btn" style="font-size:14px;padding:8px 12px;">⟳ Refresh</button>
        <button class="iconbtn" onclick="window.close()" style="font-size:14px;padding:8px 12px;">✕ Close Tab</button>
      </div>
    </div>

    <!-- Error message (if any) -->
    <div id="gp-error" class="errbar" style="display:none;"></div>

    <!-- Layout Grid -->
    <div class="gp-grid">
      <!-- Left Column: Heatmap & Insights -->
      <div style="display:flex;flex-direction:column;gap:16px;">
        <!-- Heatmap Container -->
        <div class="heatmap-wrap" style="margin:0;">
          <div class="hm-top">
            <div class="hm-head" style="display:flex;align-items:center;gap:6px;">Group Trip Heatmap <span class="info-trigger" onclick="showInfoModal('trip', event)">ⓘ</span></div>
            <div style="font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:.05em;">Green Days = Low Group Load 🌴</div>
          </div>
          <div class="hm-hint">Days are colored by the average number of classes across all members. Tap a day to view timings.</div>
          <div class="hm-months" id="gp-heatmap-months"></div>
          <div class="hm-legend" style="margin-top:12px;">
            <span class="hm-cell" style="background:#2ec4b6"></span>0 (100% Free)
            <span class="hm-cell" style="background:rgba(212,242,68,0.75)"></span>0.1–1.0 (Low)
            <span class="hm-cell" style="background:rgba(240,184,74,0.75)"></span>1.1–2.0 (Med)
            <span class="hm-cell" style="background:rgba(226,75,74,0.75)"></span>2.1+ (Heavy)
            <span class="hm-cell hm-off"></span>No class / Weekend
          </div>
        </div>

        <!-- Insights / Smart Planner -->
        <div class="heatmap-wrap" style="margin:0;">
          <div class="hm-head" style="margin-bottom:8px;color:var(--acc);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <span>💡 Best Trip Candidates <span class="info-trigger" onclick="showInfoModal('trip', event)">ⓘ</span></span>
            <div class="duration-selector">
              <button class="dur-btn active" data-len="3" onclick="changeGpTripLen(3)">3D</button>
              <button class="dur-btn" data-len="4" onclick="changeGpTripLen(4)">4D</button>
              <button class="dur-btn" data-len="5" onclick="changeGpTripLen(5)">5D</button>
              <button class="dur-btn" data-len="9" onclick="changeGpTripLen(9)">9D</button>
            </div>
          </div>
          <div id="gp-insights" style="font-size:11px;line-height:1.6;display:flex;flex-direction:column;gap:8px;">
            <!-- Generated dynamically -->
          </div>
        </div>
      </div>

      <!-- Right Column: Day Inspector -->
      <div class="gp-inspector-panel">
        <div class="heatmap-wrap" style="margin:0;height:100%;min-height:350px;">
          <div class="hm-head" style="border-bottom:.5px solid var(--b1);padding-bottom:8px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
            <span>Day Availability Inspector</span>
            <span id="gp-inspector-date" style="color:var(--acc);font-family:'Syne',sans-serif;text-transform:none;letter-spacing:0;font-weight:700;">Select a day</span>
          </div>
          
          <div id="gp-inspector-content">
            <div class="free" style="padding:40px 10px;">Tap any day on the heatmap to check slot availability and schedule for all members.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
var EXEC_URL="__EXEC_URL__";
var INITIAL_GROUP = __GROUP__;
var INITIAL_JOIN = __JOIN__;
var INITIAL_ROLL = __ROLL__;
var INITIAL_VIEW = __VIEW__;
var SHEET_URL="__SHEET_URL__";
var WA_NUMBER="__WA__";
var ROSTER=__ROSTER__;
var SESSIONS=__SESSIONS__;
var META=__META__;
var TERM_START_MS=new Date("__TS__"+"T00:00:00+05:30").getTime();
var TERM_END_MS=new Date("__TE__"+"T23:59:59+05:30").getTime();
var MAX_MISS=__MM__;
var FETCH_ERR=__ERR__;
var ANN_DATA=__ANN__;
var EXAMS=__EXAMS__;
var COURSES=__COURSES__;
var SYNC=new Date().toLocaleString("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
var MO=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var DS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
var DF=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var SLOTS = [
  ["8:00 AM",8,0],["8:30–10:00",8,30],["10:20–11:50",10,20],
  ["12:10–1:40",12,10],["2:45–4:15",14,45],["4:30–6:00",16,30],
  ["6:15–7:45",18,15],["8:00–9:30 PM",20,0]
];
var PALETTE=["#7f77dd","#1d9e75","#ef9f27","#378add","#639922","#d4537e","#d85a30","#5dcaa5","#b8b0f5","#f0b84a","#70aee8","#8dc95a","#ed93b1","#888780","#9fe1cb","#fac775"];
var CCOLOR={};Object.keys(META).sort().forEach(function(c,i){CCOLOR[c]=PALETTE[i%PALETTE.length];});

var prefs={section:null,courses:[],courseSections:{},groups:[]},attendance={},plannedLeave={},friends=[],dismissed=[],myGroups=[],groupsLoading=false,friendsLoading=false;

function skey(s){return s.code+"_"+s.section+"_"+s.n;}
/* ── PER-COURSE SECTION (electives) ──
   Electives can run separate SEC E / SEC F slots; a student may sit in a
   different section for one course than their home section. courseSections
   = {code:"E"|"F"}, stored only when it differs from the home section, so
   users with no map behave exactly as before. */
function courseSecs(code){
  var m={};
  SESSIONS.forEach(function(s){if(s.code===code&&(s.section==="E"||s.section==="F"))m[s.section]=1;});
  return Object.keys(m).sort();                 // [] for BOTH-only courses
}
function courseSplit(code){return courseSecs(code).length>=1;}
function csecHTML(code,chosen){
  if(!courseSplit(code))return "";
  return '<div class="csec" data-csec="'+code+'" onclick="event.stopPropagation()"><span class="csec-l">slot</span>'
    +courseSecs(code).map(function(s){
      return '<button type="button" class="csec-b'+(s===chosen?" on":"")+'" data-cs="'+s+'" onclick="csecPick(event,this)">Sec '+s+'</button>';
    }).join("")+'</div>';
}
function csecPick(ev,b){
  ev.stopPropagation();
  var w=b.parentNode;
  w.querySelectorAll(".csec-b").forEach(function(x){x.classList.remove("on");});
  b.classList.add("on");w.dataset.pick="1";
}
function csecSyncDefaults(scope,sec){            // un-picked slots follow the home section
  document.querySelectorAll(scope+" .csec").forEach(function(w){
    if(w.dataset.pick)return;
    w.querySelectorAll(".csec-b").forEach(function(x){x.classList.toggle("on",x.dataset.cs===sec);});
  });
}
function readCS(scope,sec){                       // -> {code:section} only where it differs from home
  var out={};
  document.querySelectorAll(scope+" .ctog.on").forEach(function(t){
    var w=t.querySelector(".csec");if(!w)return;
    var on=w.querySelector(".csec-b.on"),pick=on?on.dataset.cs:sec;
    if(pick&&pick!==sec)out[t.dataset.c||t.dataset.ctog]=pick;
  });
  return out;
}
/* ── PERSISTENCE ──
   prefs are saved in THREE places for resilience:
   1. localStorage  — fast, but lost if the GAS deployment URL/origin changes
   2. URL #hash     — survives origin changes & bookmarks/shared links
   3. Sheets        — server of record, restorable by roll number on any device
*/
function saveP(){
  try{localStorage.setItem("t4_prefs",JSON.stringify(prefs));}catch(e){}
  try{history.replaceState(null,"","#"+btoa(unescape(encodeURIComponent(JSON.stringify(prefs)))));}catch(e){}
  try{if(prefs.rollNo)document.cookie="t4_roll="+encodeURIComponent(prefs.rollNo)+";max-age=15552000;path=/";}catch(e){} // iOS fallback identity
  try{baselineSnapshot();}catch(e){}   // re-baseline diff so editing your own courses isn't flagged as a timetable change
  if(prefs.rollNo)syncSavePrefs();
}
function readCookie(name){
  try{
    var parts=("; "+document.cookie).split("; "+name+"=");
    if(parts.length===2)return decodeURIComponent(parts.pop().split(";").shift());
  }catch(e){}
  return "";
}
function load(){
  // 1. localStorage
  try{
    var p=JSON.parse(localStorage.getItem("t4_prefs")||"null");
    if(p&&p.section&&p.courses&&p.courses.length){prefs=p;return true;}
  }catch(e){}
  // 2. URL hash fallback
  try{
    var h=window.location.hash.slice(1);
    if(h){
      var p2=JSON.parse(decodeURIComponent(escape(atob(h))));
      if(p2&&p2.section&&p2.courses&&p2.courses.length){
        prefs=p2;
        try{localStorage.setItem("t4_prefs",JSON.stringify(prefs));}catch(e){}
        return true;
      }
    }
  }catch(e){}
  return false;
}
function saveA(){localStorage.setItem("t4_att",JSON.stringify(attendance));}
function saveL(){localStorage.setItem("t4_leave",JSON.stringify(plannedLeave));}
function loadAll(){
  try{attendance=JSON.parse(localStorage.getItem("t4_att")||"{}")||{};}catch(e){attendance={};}
  try{plannedLeave=JSON.parse(localStorage.getItem("t4_leave")||"{}")||{};}catch(e){plannedLeave={};}
  try{friends=JSON.parse(localStorage.getItem("t4_friends")||"[]")||[];}catch(e){friends=[];}
  try{dismissed=JSON.parse(localStorage.getItem("t4_dismissed")||"[]")||[];}catch(e){dismissed=[];}
  try{myGroups=JSON.parse(localStorage.getItem("t4_my_groups")||"[]")||[];}catch(e){myGroups=[];}
  
  if(!friends || !Array.isArray(friends)) friends = [];
  if(!dismissed || !Array.isArray(dismissed)) dismissed = [];
  if(!myGroups || !Array.isArray(myGroups)) myGroups = [];
  if(!attendance || typeof attendance !== "object") attendance = {};
  if(!plannedLeave || typeof plannedLeave !== "object") plannedLeave = {};
  loadMyStatus();
  loadQ();
}
function saveFriends(){localStorage.setItem("t4_friends",JSON.stringify(friends));}
function saveDismissed(){localStorage.setItem("t4_dismissed",JSON.stringify(dismissed));}

function mySessions(){
  return SESSIONS.filter(function(s){
    if(prefs.courses.indexOf(s.code)<0)return false;
    if(s.section==="BOTH")return true;
    var want=(prefs.courseSections&&prefs.courseSections[s.code])||prefs.section;
    return s.section===want;
  });
}
function todayStr(){var d=new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());}
function dstr(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());}
function pad(n){return String(n).padStart(2,"0");}
function todayMs(){var d=new Date();d.setHours(0,0,0,0);return d.getTime();}
function byDate(ds){return mySessions().filter(function(s){return s.date===ds;}).sort(function(a,b){return a.sh*60+a.sm-(b.sh*60+b.sm);});}
function courseTotal(code){return mySessions().filter(function(s){return s.code===code;}).length;}
function sessionMs(s){return new Date(s.date+"T00:00:00+05:30").getTime()+(s.sh*60+s.sm)*6e4;}

function isDesktop(){return window.innerWidth>=900;}
function setDesktopMode(on){
  var sb=document.getElementById("sidebar"),bn=document.getElementById("bnav"),top=document.querySelector(".top");
  if(on){sb.style.display="flex";bn.style.display="none";top.style.display="none";}
  else{sb.style.display="none";bn.style.display="flex";top.style.display="flex";}
}

/* ── ONBOARDING ── */
var obSection=null,obCourses={};
function buildOb(){
  var avail=Object.keys(META).sort();
  document.getElementById("ob-cgrid").innerHTML=avail.map(function(c){
    return '<div class="ctog" data-c="'+c+'" onclick="obTog(this)"><span class="cc">'+c+'</span><span class="cn">'+META[c].name+'</span>'+csecHTML(c,null)+'</div>';
  }).join("");
}
function obSec(b){
  document.querySelectorAll("#onboard .secbtn").forEach(function(x){x.classList.remove("on");});
  b.classList.add("on");
  obSection=b.dataset.s;
  csecSyncDefaults("#ob-cgrid",obSection);
  obReady();
}
function obTog(el){
  el.classList.toggle("on");
  var c=el.dataset.c;
  if(el.classList.contains("on")){
    obCourses[c]=1;
  } else {
    delete obCourses[c];
  }
  obReady();
}
function obReady(){
  var q=document.getElementById("ob-roll").value.trim().toUpperCase();
  var r=q;
  if(/^\\d+$/.test(r)){
    if(r.length===3) r="B25"+r;
    else if(r.length===5) r="B"+r;
  }
  var rollOk=/^B25[0-9]{3}$/.test(r);
  if(!rollOk){
    var m=rosterMatches(q);
    if(m.length) rollOk=true;
  }
  var cta=document.getElementById("ob-cta");
  if(cta){
    if(rollOk && obSection && Object.keys(obCourses).length > 0){
      cta.disabled=false;
    } else {
      cta.disabled=true;
    }
  }
}
function obSave(){
  var q = document.getElementById("ob-roll").value.trim().toUpperCase();
  var r = q;
  if(/^\\d+$/.test(r)){
    if(r.length === 3) r = "B25" + r;
    else if(r.length === 5) r = "B" + r;
  }
  if(!/^B25[0-9]{3}$/.test(r)){
    var m = rosterMatches(q);
    if(m.length) r = m[0].roll;
  }

  var cta = document.getElementById("ob-cta");
  if(cta) cta.disabled = true;
  
  fetch(EXEC_URL, {
    method: "POST",
    body: JSON.stringify({action: "getPrefs", rollNo: r}),
    redirect: "follow"
  })
  .then(function(res){ return res.json(); })
  .then(function(d){
    if(cta) cta.disabled = false;
    if(d.ok && d.data && d.data.section && d.data.courses && d.data.courses.length) {
      var msg = "Roll number " + r + " already has a saved schedule on the server.\\n\\n"
        + "• If you are returning, please click Cancel and use the 'Restore' option at the top.\\n"
        + "• If you are setting up new, clicking OK will overwrite the existing schedule.\\n\\n"
        + "Do you want to overwrite and proceed?";
      if(!confirm(msg)) return;
    }
    prefs={rollNo:r,section:obSection,courses:Object.keys(obCourses),courseSections:readCS("#ob-cgrid",obSection),groups:[]};
    saveP();loadAll();launch();
  })
  .catch(function(){
    if(cta) cta.disabled = false;
    prefs={rollNo:r,section:obSection,courses:Object.keys(obCourses),courseSections:readCS("#ob-cgrid",obSection),groups:[]};
    saveP();loadAll();launch();
  });
}

/* ── RESTORE (cloud, by roll number) ── */
function doRestore(){
  var q=(document.getElementById("ob-restore-roll").value||"").trim().toUpperCase();
  var hint=document.getElementById("ob-restore-hint");
  var r = q;
  if(/^\\d+$/.test(r)){
    if(r.length === 3) r = "B25" + r;
    else if(r.length === 5) r = "B" + r;
  }
  if(!/^B25[0-9]{3}$/.test(r)){
    var m=rosterMatches(q);
    if(m.length) {
      r=m[0].roll;
    } else {
      hint.style.color="var(--bad)";
      hint.textContent="Enter a valid roll number or name";
      return;
    }
  }

  hint.style.color="var(--t3)";hint.textContent="Fetching your saved setup ("+r+")…";
  fetch(EXEC_URL,{method:"POST",body:JSON.stringify({action:"getPrefs",rollNo:r}),redirect:"follow"})
    .then(function(res){return res.json();})
    .then(function(d){
      if(d.ok&&d.data&&d.data.section&&d.data.courses&&d.data.courses.length){
        prefs={rollNo:r,section:d.data.section,courses:d.data.courses,courseSections:d.data.courseSections||{},groups:d.data.groups||[]};
        saveP();loadAll();launch();
      } else {
        hint.style.color="var(--warn)";
        hint.textContent="No saved setup found for "+r+". Set up new below.";
      }
    })
    .catch(function(){hint.style.color="var(--bad)";hint.textContent="Server unreachable — set up new below.";});
}

function launch(){
  if(INITIAL_GROUP){
    showGroupPlanner(INITIAL_GROUP);
    return;
  }
  if(!prefs.courseSections)prefs.courseSections={};
  if(!prefs.groups)prefs.groups=[];
  document.getElementById("onboard").style.display="none";
  document.getElementById("shell").style.display="flex";
  document.getElementById("top-badge").textContent="Sec "+prefs.section;
  var sb=document.getElementById("sb-badge");if(sb)sb.textContent="Sec "+prefs.section;
  document.getElementById("synced").innerHTML='<span class="dot"></span>live · synced '+SYNC;
  setDesktopMode(isDesktop());
  if(prefs.rollNo){
    logUserVisit();
    flushQueue().then(syncFetch);
    refreshFriends();
    restoreFriendsList();
    refreshGroups();
    maybeAutoJoin();
    fetchMyStatus();
  }
  if(FETCH_ERR)document.getElementById("errbox").innerHTML='<div class="errbar">Could not fetch timetable ('+FETCH_ERR+')</div>';
  renderHomeAll();
}
window.addEventListener("resize",function(){if(document.getElementById("shell").style.display!=="none")setDesktopMode(isDesktop());});
/* Record this roll number in the users registry — at most once per 12h per device. */
function logUserVisit(){
  if(!prefs.rollNo)return;
  try{var last=Number(localStorage.getItem("t4_userlog"))||0;if(Date.now()-last<432e5)return;}catch(e){}
  try{localStorage.setItem("t4_userlog",String(Date.now()));}catch(e){}
  fetch(EXEC_URL,{method:"POST",body:JSON.stringify({action:"logUser",rollNo:prefs.rollNo,section:prefs.section}),redirect:"follow"}).catch(function(){});
}

/* ── ANNOUNCEMENTS ── */
function renderAnnouncements(){
  var el=document.getElementById("ann-wrap");if(!el)return;
  var vis=ANN_DATA.filter(function(a){return dismissed.indexOf(a.id)<0;});
  if(!vis.length){el.innerHTML="";return;}
  el.innerHTML='<div class="ann-scroll">'+vis.map(function(a){
    return '<div class="ann-card '+(a.type||"info")+'"><span class="ann-dot"></span><div><div class="ann-text">'+a.text+'</div><div class="ann-date">'+a.date+'</div></div><button class="ann-x" data-ann="'+a.id+'">✕</button></div>';
  }).join("")+'</div>';
}
function dismissAnn(id){dismissed.push(id);saveDismissed();renderAnnouncements();}

/* ── WEEK HEAT DOTS ── */
function renderWeekHeat(){
  var el=document.getElementById("week-heat");if(!el)return;
  var today=todayMs(),mon=new Date(today);
  mon.setDate(mon.getDate()-((mon.getDay()+6)%7));
  var dns=["M","T","W","T","F","S","S"],days="";
  for(var i=0;i<7;i++){
    var d=new Date(mon);d.setDate(mon.getDate()+i);
    var ds=dstr(d),cnt=byDate(ds).length,isT=ds===todayStr();
    var cls=cnt===0?"":cnt===1?"d1":cnt<=2?"d2":cnt<=3?"d3":"d4";
    days+='<div class="wh-day'+(isT?" wh-today":"")+'"><div class="wh-dot '+cls+'"></div><div class="wh-dn">'+dns[i]+'</div></div>';
  }
  el.innerHTML='<span class="wh-label">This week</span><div class="wh-days">'+days+'</div>';
}

/* ── TODAY TIMELINE STRIP ── */
function renderTodayStrip(){
  var el=document.getElementById("today-strip");if(!el)return;
  var ss=byDate(todayStr());
  if(!ss.length){el.style.display="none";return;}
  el.style.display="";
  var DS2=480,DE=1320,SP=DE-DS2;
  var now=new Date(),nm=now.getHours()*60+now.getMinutes();
  var blocks=ss.map(function(s){
    var sm=s.sh*60+s.sm,l=Math.max(0,(sm-DS2)/SP*100),w=90/SP*100;
    return '<div class="t-sess" style="left:'+l.toFixed(1)+'%;width:'+w.toFixed(1)+'%;background:'+CCOLOR[s.code]+'">'+s.code+'</div>';
  }).join("");
  var nowHtml=(nm>=DS2&&nm<=DE)?'<div class="t-now" style="left:'+((nm-DS2)/SP*100).toFixed(1)+'%"></div>':"";
  el.innerHTML='<div class="t-head"><span>Today timeline</span><span>8 am &#8594; 10 pm</span></div>'
    +'<div class="t-track">'+blocks+nowHtml+'</div>'
    +'<div class="t-labels"><span>8</span><span>10</span><span>12</span><span>2pm</span><span>4</span><span>6</span><span>8</span><span>10</span></div>';
}

/* ── HEATMAP (two modes: Attendance / Load · stats strip · tap a day to mark) ── */
var hmMode="att";
function setHmMode(m){hmMode=m;var el=document.getElementById("heatmap-ct");if(el)el.innerHTML=buildHeatmap();}
function dayAgg(ds){
  var ss=byDate(ds),p=0,a=0,u=0,ts=todayStr();
  ss.forEach(function(s){var st=attendance[skey(s)];if(st==="present")p++;else if(st==="absent")a++;else u++;});
  return {total:ss.length,present:p,absent:a,unmarked:u,past:ds<=ts};
}
function hmClassDays(){var set={};mySessions().forEach(function(s){set[s.date]=1;});return Object.keys(set).sort();}
function hmStreak(){
  var ts=todayStr(),days=hmClassDays().filter(function(d){return d<=ts;}),streak=0;
  var started=false;
  for(var i=days.length-1;i>=0;i--){
    var d=days[i],ag=dayAgg(d);
    if(ag.absent>0){
      break;
    }
    if(ag.total>0&&ag.present===ag.total){
      streak++;
      started=true;
    }else if(ag.unmarked>0){
      if(started){
        break;
      }
    }
  }
  return streak;
}
function hmTotals(){
  var ts=todayStr(),p=0,a=0,u=0;
  mySessions().forEach(function(s){if(s.date<=ts){var st=attendance[skey(s)];if(st==="present")p++;else if(st==="absent")a++;else u++;}});
  return {present:p,absent:a,unmarked:u};
}
/* Dates with an 8:00 AM slot session or exam (the earliest slot — quizzes are
   usually scheduled here too, often noted as 7:00-7:30 AM within the cell
   text itself). Used for the heatmap's early-class dot and the day-before
   nudge. 8:30 starts are deliberately excluded — that's a normal first
   period, not the "don't stay out too late" case. */
function earlyDatesMap_(){
  var m={};
  mySessions().forEach(function(s){if(s.sh===8&&s.sm===0)m[s.date]=1;});
  (Array.isArray(EXAMS)?EXAMS:[]).forEach(function(x){
    if(x.sh===8&&x.sm===0&&(!x.code||prefs.courses.indexOf(x.code)>=0))m[x.date]=1;
  });
  return m;
}
function buildHeatmap(){
  var ts=todayStr(),att=hmMode==="att",mos=[{y:2026,m:5,n:"Jun"},{y:2026,m:6,n:"Jul"},{y:2026,m:7,n:"Aug"}];
  var cntMap={};mySessions().forEach(function(s){cntMap[s.date]=(cntMap[s.date]||0)+1;});
  var earlyMap=earlyDatesMap_(), examMap={};
  (Array.isArray(EXAMS)?EXAMS:[]).forEach(function(x){
    if(!x.code || prefs.courses.indexOf(x.code)>=0) examMap[x.date]=1;
  });
  var T=hmTotals(),streak=hmStreak(),mk=T.present+T.absent,pct=mk?Math.round(T.present/mk*100):0;
  var toggle='<div class="hm-toggle"><button class="hm-tb'+(att?" on":"")+'" data-hmmode="att">Attendance</button><button class="hm-tb'+(att?"":" on")+'" data-hmmode="load">Load</button></div>';
  var stats='<div class="hm-stats">'
    +'<div class="hm-stat"><div class="hm-sv" style="color:var(--acc)">'+streak+'</div><div class="hm-sl">🔥 streak</div></div>'
    +'<div class="hm-stat"><div class="hm-sv" style="color:var(--ok)">'+T.present+'</div><div class="hm-sl">present</div></div>'
    +'<div class="hm-stat"><div class="hm-sv" style="color:var(--bad)">'+T.absent+'</div><div class="hm-sl">absent</div></div>'
    +'<div class="hm-stat"><div class="hm-sv" style="color:var(--warn)">'+T.unmarked+'</div><div class="hm-sl">unmarked</div></div>'
    +'<div class="hm-stat"><div class="hm-sv">'+pct+'%</div><div class="hm-sl">present rate</div></div>'
    +'</div>';
  var months=mos.map(function(mo){
    var first=new Date(mo.y,mo.m,1),last=new Date(mo.y,mo.m+1,0),dow=(first.getDay()+6)%7,cells="";
    for(var i=0;i<dow;i++)cells+='<span class="hm-cell hm-empty"></span>';
    for(var d=1;d<=last.getDate();d++){
      var date=mo.y+"-"+pad(mo.m+1)+"-"+pad(d),inTerm=date>="2026-06-15"&&date<="2026-08-31";
      var cls,title,cnt=cntMap[date]||0,early=!!earlyMap[date],hasEx=!!examMap[date];
      if(!inTerm){cls="hm-off";title=d+" "+MO[mo.m];}
      else if(att){
        var ag=dayAgg(date);
        if(ag.total===0){cls="hm-off";title=d+" "+MO[mo.m]+" · no class";}
        else if(date>ts){cls="hm-future";title=d+" "+MO[mo.m]+" · "+ag.total+" upcoming";}
        else if(ag.absent>0){cls="hm-bad";title=d+" "+MO[mo.m]+" · "+ag.absent+" absent of "+ag.total;}
        else if(ag.unmarked===0){cls="hm-good";title=d+" "+MO[mo.m]+" · all "+ag.total+" present";}
        else if(ag.present>0){cls="hm-part";title=d+" "+MO[mo.m]+" · "+ag.present+"/"+ag.total+" marked";}
        else {cls="hm-miss";title=d+" "+MO[mo.m]+" · "+ag.total+" unmarked";}
      } else {
        cls=cnt===0?"hm-off":cnt===1?"hm-l1":cnt===2?"hm-l2":cnt===3?"hm-l3":"hm-l4";
        title=d+" "+MO[mo.m]+" · "+cnt+" sessions";
      }
      var click=((cnt>0||hasEx)&&inTerm)?' data-hmday="'+date+'"':'';   // any day with classes/exams is tappable
      cells+='<span class="hm-cell '+cls+(date===ts?" hm-today":"")+(early?" hm-early":"")+(hasEx?" hm-exam":"")+'"'+click+' title="'+title+(hasEx?" · 📝 Assessment":"")+(early?" · ⏰ early class":"")+'"></span>';
    }
    return '<div class="hm-month"><div class="hm-mlabel">'+mo.n+'</div>'
      +'<div class="hm-dow"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>'
      +'<div class="hm-grid">'+cells+'</div></div>';
  }).join("");
  var legend=att
    ?'<span class="hm-cell hm-good"></span>all present <span class="hm-cell hm-part"></span>partial <span class="hm-cell hm-miss"></span>unmarked <span class="hm-cell hm-bad"></span>absent <span class="hm-cell hm-future"></span>upcoming'
    :'<span class="hm-cell hm-off"></span>0 <span class="hm-cell hm-l1"></span>1 <span class="hm-cell hm-l2"></span>2 <span class="hm-cell hm-l3"></span>3 <span class="hm-cell hm-l4"></span>4+ <span class="hm-cell hm-early" style="background:var(--s2)"></span>⏰ early <span class="hm-cell hm-exam" style="background:var(--s2)"></span>📝 exam';
  return '<div class="heatmap-wrap"><div class="hm-top"><div class="hm-head">Term heatmap</div>'+toggle+'</div>'
    +stats+'<div class="hm-hint">Tap any day to see its classes · past days are markable.</div>'
    +'<div class="hm-months">'+months+'</div>'
    +'<div class="hm-legend">'+legend+'</div></div>';
}

/* ── SVG RING ── */
function svgRing(present,total,color){
  var sz=44,cx=22,cy=22,r=17,circ=2*Math.PI*r,pct=total?present/total:0;
  var dash=(circ*pct).toFixed(1),gap=(circ*(1-pct)).toFixed(1);
  return '<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 '+sz+' '+sz+'" style="flex-shrink:0">'
    +'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="var(--s3)" stroke-width="3.5"/>'
    +'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="3.5"'
    +' stroke-dasharray="'+dash+' '+gap+'" stroke-linecap="round" transform="rotate(-90 '+cx+' '+cy+')"'
    +' style="transition:stroke-dasharray .6s"/>'
    +'<text x="'+cx+'" y="'+(cy+4)+'" text-anchor="middle" fill="'+color+'" font-size="9" font-family="Syne,sans-serif" font-weight="700">'+Math.round(pct*100)+'%</text>'
    +'</svg>';
}
function svgRingLarge(present,total,color){
  var sz=52,cx=26,cy=26,r=20,circ=2*Math.PI*r,pct=total?present/total:0;
  var dash=(circ*pct).toFixed(1),gap=(circ*(1-pct)).toFixed(1);
  return '<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 '+sz+' '+sz+'" style="flex-shrink:0">'
    +'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="var(--s3)" stroke-width="4"/>'
    +'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="4"'
    +' stroke-dasharray="'+dash+' '+gap+'" stroke-linecap="round" transform="rotate(-90 '+cx+' '+cy+')"'
    +' style="transition:stroke-dasharray .6s"/>'
    +'<text x="'+cx+'" y="'+(cy+4)+'" text-anchor="middle" fill="'+color+'" font-size="11" font-family="Syne,sans-serif" font-weight="700">'+Math.round(pct*100)+'%</text>'
    +'</svg>';
}

/* ── SESSION CARD ── */
function scard(s,withAtt){
  var k=skey(s),late=s.late?'<span class="late">late</span>':'',att='';
  if(withAtt){var st=attendance[k];att='<div class="att-actions"><button class="att-btn present '+(st==='present'?"on":"")+'" data-k="'+k+'" data-st="present">P</button><button class="att-btn absent '+(st==='absent'?"on":"")+'" data-k="'+k+'" data-st="absent">A</button></div>';}
  var cc=META[s.code];if(!cc)return'';
  var venue=s.venue?'<span class="sc-venue">'+s.venue+'</span>':"";
  var calBtn=withAtt?'<button class="sc-cal" onclick="event.stopPropagation();addClassCal(\\''+k+'\\')" title="Add to calendar">＋</button>':"";
  return '<div class="scard" style="--cc:'+(CCOLOR[s.code]||"#888")+'"><div class="scard-tint"></div><span class="sc-code">'+s.code+'</span><span class="sc-name">'+cc.name+'</span><span class="sc-meta">S'+s.n+' · '+s.slot+late+venue+'</span>'+att+calBtn+'</div>';
}
function renderDay(ms,label,withAtt){
  var d=new Date(ms),ds=dstr(d),ss=byDate(ds);
  var h='<div class="daylabel">'+label+' · '+DF[d.getDay()]+', '+d.getDate()+' '+MO[d.getMonth()]+'</div>';
  return h+(ss.length?ss.map(function(s){return scard(s,withAtt);}).join(""):'<div class="free">No classes 🌿🤙</div>');
}

/* ── HOME ── */
function renderHomeAll(){renderMyStatus();renderIosPin();renderAnnouncements();renderChanges();renderEarlyWarning();renderWeekHeat();renderTodayStrip();renderHome();renderExams();}
/* Heads-up for an 8:00 AM class/quiz landing tomorrow or the day after, so
   there's time to plan the night before — not just the same-day heatmap dot. */
function renderEarlyWarning(){
  var el=document.getElementById("h-early");if(!el)return;
  var em=earlyDatesMap_();
  var tm=todayMs(),t1=dstr(new Date(tm+864e5)),t2=dstr(new Date(tm+2*864e5));
  var when=em[t1]?"tomorrow":em[t2]?"in 2 days":null;
  if(!when){el.innerHTML="";return;}
  el.innerHTML='<div class="nudge"><span class="nudge-ico">⏰</span>'
    +'<div class="nudge-body"><div class="nudge-t">Early start '+when+'</div>'
    +'<div class="nudge-s">8:00 AM class or quiz — plan your night accordingly.</div></div></div>';
}
/* ── UPCOMING EXAMS / ASSESSMENTS ──
   Server detects quiz / mid-term / end-term / AOL / registration-notice cells
   in the master sheet and sends the raw cell text (already HTML-escaped) plus
   a course code when it can tell which course. Filtered to courses the
   student is actually enrolled in (course-less entries — AOL, notices — always
   show, since they're not tied to one course). Home shows a short preview;
   the "See all" link opens the full dedicated section (#exov). */
function examBadgeClass_(type){
  return {"Quiz":"quiz","Mid-Term":"mid","End-Term":"end","AOL Exam":"aol","Notice":"notice"}[type]||"end";
}
function examRowHTML(x){
  var d=new Date(x.date+"T00:00:00+05:30"),tm=todayMs(),days=Math.round((d.getTime()-tm)/864e5);
  var cd,cdCls="";
  if(days<0){cd="<b>Past</b>";cdCls="";}
  else if(days===0){cd="<b>Today</b>";cdCls="imminent";}
  else if(days===1){cd="<b>1</b>day";cdCls="imminent";}
  else if(days<=3){cd="<b>"+days+"</b>days";cdCls="soon";}
  else{cd="<b>"+days+"</b>days";}
  var when=DF[d.getDay()]+", "+d.getDate()+" "+MO[d.getMonth()]+" · "+x.slot;
  var courseName=x.code&&META[x.code]?META[x.code].name+" — ":"";
  var venue=x.venue?'<span class="exam-venue">'+x.venue+'</span>':"";
  var isNotice=x.type==="Notice";
  var attended=attendance[x.id]==="present";
  var attendBtn=isNotice?"":'<button class="exam-attend'+(attended?" on":"")+'" onclick="toggleExamAttend(\\''+x.id+'\\')">'+(attended?"✓ Attended":"Mark attended")+'</button>';
  return '<div class="exam-row">'
    +'<span class="exam-badge '+examBadgeClass_(x.type)+'">'+x.type+'</span>'
    +'<div class="exam-body"><div class="exam-text">'+courseName+x.text+'</div><div class="exam-when">'+when+venue+'</div>'+attendBtn+'</div>'
    +'<div class="exam-cd '+cdCls+'">'+cd+'</div>'
    +(isNotice?'':'<button class="exam-cal" onclick="addExamCal(\\''+x.id+'\\')" title="Add to calendar">＋ Cal</button>')+'</div>';
}
function renderExams(){
  var el=document.getElementById("h-exams");if(!el)return;
  var full=document.getElementById("ex-full-list");
  if(!Array.isArray(EXAMS)||!EXAMS.length){el.innerHTML="";if(full)full.innerHTML='<div class="free">No assessments scheduled 🌿</div>';return;}
  var ts=todayStr();
  var rel=EXAMS.filter(function(x){return !x.code || prefs.courses.indexOf(x.code)>=0;});
  var up=rel.filter(function(x){return x.date>=ts;}).sort(function(a,b){
    return a.date<b.date?-1:a.date>b.date?1:(a.sh*60+a.sm)-(b.sh*60+b.sm);
  });
  var past=rel.filter(function(x){return x.date<ts;}).sort(function(a,b){
    return a.date>b.date?-1:a.date<b.date?1:(b.sh*60+b.sm)-(a.sh*60+a.sm); // reverse chron
  });
  examUpcoming=up;
  if(!up.length && !past.length){el.innerHTML="";if(full)full.innerHTML='<div class="free">No assessments scheduled 🌿</div>';return;}
  
  if(up.length) {
    var previewCount=Math.min(up.length,3);
    var rows=up.slice(0,previewCount).map(examRowHTML).join("");
    var seeAll=(up.length>previewCount || past.length)?'<a class="exam-see-all" onclick="openExams()">See all '+(up.length+past.length)+' →</a>':'';
    el.innerHTML='<div class="exam-wrap"><div class="exam-head"><span class="exam-title">📌 Upcoming Assessments</span>'
      +'<span class="exam-count">'+up.length+' scheduled</span></div>'
      +rows+seeAll+'</div>';
  } else {
    el.innerHTML='<div class="exam-wrap"><div class="exam-head"><span class="exam-title">📌 Assessments</span></div><a class="exam-see-all" onclick="openExams()">See past assessments →</a></div>';
  }
  if(full){
    var upHtml = up.length ? up.map(examRowHTML).join("") + '<button class="exam-allcal" onclick="addAllExamsCal()">＋ Add all '+up.length+' to calendar</button>' : '<div class="free">No upcoming assessments</div>';
    var pastHtml = past.length ? '<div class="exam-head" style="margin-top:24px"><span class="exam-title">⏳ Past Assessments</span></div>' + past.map(examRowHTML).join("") : '';
    full.innerHTML = upHtml + pastHtml + '<div class="exam-note">Filtered to your enrolled courses, plus anything not tied to one course (AOL, registration notices).</div>';
  }
}
var examUpcoming=[];
function openExams(){ renderExams(); var ov=document.getElementById("exov"); if(ov)ov.classList.add("open"); }
function closeExams(){ var ov=document.getElementById("exov"); if(ov)ov.classList.remove("open"); }
function toggleExamAttend(id){
  var x=EXAMS.find(function(e){return e.id===id;}); if(!x||x.type==="Notice")return;
  var ns=attendance[id]==="present"?"":"present";
  if(!ns)delete attendance[id];else attendance[id]=ns;
  try{if(navigator.vibrate)navigator.vibrate(9);}catch(e){}
  saveA();
  renderExams();
  if(prefs.rollNo)syncMark(id,ns||null,"exam");
  showToast(ns?"Marked attended":"Unmarked");
}

/* ── ICS / ADD TO CALENDAR ── */
function icsEsc(s){return String(s).replace(/\\\\/g,"\\\\\\\\").replace(/;/g,"\\\\;").replace(/,/g,"\\\\,").replace(/\\n/g,"\\\\n");}
function deEnt(s){return String(s).replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">");}
function icsLocal(date,sh,sm,addMin){
  var dt=new Date(date+"T00:00:00+05:30");dt.setHours(sh,sm+(addMin||0),0,0);
  return dt.getFullYear()+pad(dt.getMonth()+1)+pad(dt.getDate())+"T"+pad(dt.getHours())+pad(dt.getMinutes())+"00";
}
function buildICS(events){
  var L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Term IV Command Centre//EN","CALSCALE:GREGORIAN"];
  events.forEach(function(ev){
    L.push("BEGIN:VEVENT");
    L.push("UID:"+ev.uid);
    L.push("DTSTAMP:"+icsLocal(todayStr(),0,0,0));
    L.push("DTSTART:"+ev.start);
    L.push("DTEND:"+ev.end);
    L.push("SUMMARY:"+icsEsc(ev.summary));
    if(ev.desc)L.push("DESCRIPTION:"+icsEsc(ev.desc));
    (ev.alarms||[]).forEach(function(tr){L.push("BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+icsEsc(ev.summary),"TRIGGER:"+tr,"END:VALARM");});
    L.push("END:VEVENT");
  });
  L.push("END:VCALENDAR");
  return L.join("\\r\\n");
}
function downloadICS(fname,events){
  if(!events.length){showToast("Nothing to add");return;}
  var b=new Blob([buildICS(events)],{type:"text/calendar;charset=utf-8"});
  var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=fname;document.body.appendChild(a);a.click();a.remove();
  showToast(events.length+" added — open the file to save to your calendar");
}
function examEvent(x){
  var title=deEnt(x.text);
  return {uid:(x.date+"-"+x.sh+x.sm+"-"+x.type).replace(/[^A-Za-z0-9-]/g,"")+"@term4",
    start:icsLocal(x.date,x.sh,x.sm,0),end:icsLocal(x.date,x.sh,x.sm,90),
    summary:"["+x.type+"] "+title,desc:"Assessment from the Term IV timetable",
    alarms:["-P1D","-PT1H"]};
}
function addExamCal(id){var x=EXAMS.find(function(e){return e.id===id;});if(!x)return;downloadICS("assessment.ics",[examEvent(x)]);}
function addAllExamsCal(){downloadICS("term4-assessments.ics",examUpcoming.map(examEvent));}
function exportTimetableICS(){
  var ts=todayStr();
  var ev=mySessions().filter(function(s){return s.date>=ts;}).map(function(s){
    return {uid:(s.date+"-"+s.sh+s.sm+"-"+s.code).replace(/[^A-Za-z0-9-]/g,"")+"@term4",
      start:icsLocal(s.date,s.sh,s.sm,0),end:icsLocal(s.date,s.sh,s.sm,90),
      summary:s.code+" · "+META[s.code].name,desc:"S"+s.n+" · "+s.slot,alarms:["-PT30M"]};
  });
  downloadICS("term4-timetable.ics",ev);
}
/* Single-class add-to-calendar — same UID scheme as exportTimetableICS's bulk
   export, so a calendar app treats "add this one" and "add all" as the same
   event rather than creating a duplicate. */
function classEvent(s){
  return {uid:(s.date+"-"+s.sh+s.sm+"-"+s.code).replace(/[^A-Za-z0-9-]/g,"")+"@term4",
    start:icsLocal(s.date,s.sh,s.sm,0),end:icsLocal(s.date,s.sh,s.sm,90),
    summary:s.code+" · "+META[s.code].name,
    desc:"S"+s.n+" · "+s.slot+(s.venue?" · "+s.venue:""),alarms:["-PT30M"]};
}
function addClassCal(k){
  var s=mySessions().find(function(x){return skey(x)===k;});
  if(!s){showToast("Session not found");return;}
  downloadICS(s.code+"-"+s.date+".ics",[classEvent(s)]);
}

/* ── STATUS (Slack-style availability) ── */
var STATUS_PRESETS=[["📚","Studying"],["☕","Free to meet"],["🍔","Lunch"],["🏠","At home"],["😴","Resting"],["🎯","Focusing"],["🎧","In the zone"],["✈️","Travelling"]];
var STATUS_DURS=[["1 hour",36e5],["4 hours",144e5],["Today",-1],["This week",-2],["No expiry",0]];
var myStatus=null,stDur=144e5;
function loadMyStatus(){try{myStatus=JSON.parse(localStorage.getItem("t4_status")||"null");}catch(e){myStatus=null;}}
function saveMyStatusLocal(){try{if(myStatus)localStorage.setItem("t4_status",JSON.stringify(myStatus));else localStorage.removeItem("t4_status");}catch(e){}}
function statusActive(s){return s&&s.text&&(!s.until||Date.now()<s.until);}
function statusPillHTML(s){
  if(!statusActive(s))return"";
  return '<div class="status-pill">'+(s.emoji?'<span>'+s.emoji+'</span>':'')+'<span class="sp-t">'+s.text+'</span></div>';
}
function renderMyStatus(){
  var el=document.getElementById("h-status");if(!el)return;
  if(!prefs.rollNo){el.innerHTML="";return;}
  if(statusActive(myStatus)){
    var until=myStatus.until?(" · clears "+stUntilLabel(myStatus.until)):"";
    el.innerHTML='<div class="h-status-strip set" onclick="openStatus()">'
      +'<span class="hss-emoji">'+(myStatus.emoji||"💬")+'</span>'
      +'<div class="hss-body"><div class="hss-t">'+myStatus.text+'</div><div class="hss-s">Your status'+until+' · tap to edit</div></div>'
      +'<button class="hss-x" onclick="event.stopPropagation();clearStatus()">Clear</button></div>';
  } else {
    el.innerHTML='<div class="h-status-strip" onclick="openStatus()">'
      +'<span class="hss-emoji">💬</span>'
      +'<div class="hss-body"><div class="hss-t">Set a status</div><div class="hss-s">Tell friends you\\'re free, studying, or out — they\\'ll see it on your schedule</div></div>'
      +'<span class="hss-x">＋</span></div>';
  }
}
function stUntilLabel(ms){
  var d=new Date(ms),now=new Date();
  if(d.toDateString()===now.toDateString())return d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
  return d.getDate()+" "+MO[d.getMonth()];
}
function buildStatusModal(){
  document.getElementById("st-presets").innerHTML=STATUS_PRESETS.map(function(p,i){
    return '<div class="st-chip" data-sti="'+i+'" onclick="stPick('+i+')"><span class="ste">'+p[0]+'</span><span>'+p[1]+'</span></div>';
  }).join("");
  document.getElementById("st-durs").innerHTML=STATUS_DURS.map(function(p,i){
    return '<button class="st-dur'+(p[1]===stDur?" on":"")+'" data-std="'+i+'" onclick="stPickDur('+i+')">'+p[0]+'</button>';
  }).join("");
}
function stPick(i){
  var p=STATUS_PRESETS[i];if(!p)return;
  document.getElementById("st-emoji").value=p[0];
  document.getElementById("st-text").value=p[1];
  stPreview();
}
function stPickDur(i){stDur=STATUS_DURS[i][1];document.querySelectorAll("#st-durs .st-dur").forEach(function(b,j){b.classList.toggle("on",j===i);});}
function stPreview(){
  var txt=document.getElementById("st-text").value.trim().toLowerCase();
  document.querySelectorAll("#st-presets .st-chip").forEach(function(c){
    var i=Number(c.dataset.sti);c.classList.toggle("on",STATUS_PRESETS[i][1].toLowerCase()===txt);
  });
}
function untilFromDur(dur){
  if(dur===0)return 0;
  if(dur>0)return Date.now()+dur;
  var d=new Date();
  if(dur===-1){d.setHours(23,59,59,0);return d.getTime();}        // end of today
  var add=(7-d.getDay())%7;d.setDate(d.getDate()+add);d.setHours(23,59,59,0);return d.getTime(); // end of week (Sun)
}
function openStatus(){
  stDur=myStatus&&myStatus.until?(myStatus.until-Date.now()>0?(myStatus.until-Date.now()):144e5):144e5;
  stDur=144e5; // reset selector to a sensible default each open
  buildStatusModal();
  document.getElementById("st-emoji").value=(myStatus&&myStatus.emoji)||"";
  document.getElementById("st-text").value=(myStatus&&myStatus.text)||"";
  stPreview();
  var ov=document.getElementById("stov");if(ov)ov.classList.add("open");
}
function closeStatus(){var ov=document.getElementById("stov");if(ov)ov.classList.remove("open");}
function saveStatus(){
  if(!prefs.rollNo){alert("Set your roll number first (Settings).");return;}
  var text=document.getElementById("st-text").value.trim();
  if(!text){clearStatus();return;}
  var emoji=document.getElementById("st-emoji").value.trim();
  var until=untilFromDur(stDur);
  myStatus={emoji:emoji,text:text,until:until};
  saveMyStatusLocal();renderMyStatus();closeStatus();
  enqueue({action:"setStatus",rollNo:prefs.rollNo,emoji:emoji,text:text,until:until||""}); flushQueue();
  showToast("Status set "+(emoji||"💬"));
}
function clearStatus(){
  myStatus=null;saveMyStatusLocal();renderMyStatus();closeStatus();
  if(prefs.rollNo){ enqueue({action:"setStatus",rollNo:prefs.rollNo,text:""}); flushQueue(); }
}
function fetchMyStatus(){
  if(!prefs.rollNo)return;
  fetch(EXEC_URL,{method:"POST",body:JSON.stringify({action:"getStatus",rollNo:prefs.rollNo}),redirect:"follow"})
    .then(function(r){return r.json();})
    .then(function(d){
      if(d&&d.ok){ myStatus=statusActive(d.data)?d.data:null; saveMyStatusLocal(); renderMyStatus(); }
    }).catch(function(){});
}

/* ── "WHAT CHANGED?" TIMETABLE DIFF ── */
function ttSnapshot(){return mySessions().map(function(s){return s.date+"|"+s.code+"|"+s.section+"|"+s.slot;});}
function baselineSnapshot(){try{localStorage.setItem("t4_tt_snap",JSON.stringify(ttSnapshot()));}catch(e){}}
function fmtSnapItem(k){var p=k.split("|");var d=new Date(p[0]+"T00:00:00+05:30");return p[1]+" · "+DS[d.getDay()]+" "+d.getDate()+" "+MO[d.getMonth()]+" · "+p[3];}
function renderChanges(){
  var el=document.getElementById("h-changes");if(!el)return;
  var cur=ttSnapshot(),prevRaw=null;
  try{prevRaw=localStorage.getItem("t4_tt_snap");}catch(e){}
  if(!prevRaw){baselineSnapshot();el.innerHTML="";return;}            // first ever — just baseline, nothing to show
  var prev=[];try{prev=JSON.parse(prevRaw)||[];}catch(e){prev=[];}
  var prevSet={},curSet={};
  prev.forEach(function(k){prevSet[k]=1;});cur.forEach(function(k){curSet[k]=1;});
  var added=cur.filter(function(k){return !prevSet[k];});
  var removed=prev.filter(function(k){return !curSet[k];});
  if(!added.length&&!removed.length){el.innerHTML="";return;}
  var rows=added.slice(0,5).map(function(k){return '<div class="cb-row"><span class="cb-tag add">added</span>'+fmtSnapItem(k)+'</div>';})
    .concat(removed.slice(0,5).map(function(k){return '<div class="cb-row"><span class="cb-tag rem">removed</span>'+fmtSnapItem(k)+'</div>';})).join("");
  var more=(added.length+removed.length)-Math.min(added.length,5)-Math.min(removed.length,5);
  el.innerHTML='<div class="changes-banner"><div class="cb-top"><span class="cb-ico">🔔</span>'
    +'<span class="cb-t">Your timetable changed</span>'
    +'<button class="cb-x" onclick="dismissChanges()">Got it</button></div>'
    +rows+(more>0?'<div class="cb-row" style="color:var(--t3)">+'+more+' more…</div>':'')+'</div>';
}
function dismissChanges(){baselineSnapshot();var el=document.getElementById("h-changes");if(el)el.innerHTML="";}

/* ── DELIGHT: next-class countdown + streak confetti ── */
var cdTimer=null;
function startBannerCountdown(targetMs,ongoingEndMs){
  if(cdTimer){clearInterval(cdTimer);cdTimer=null;}
  function tick(){
    var pill=document.getElementById("nb-countdown");if(!pill){if(cdTimer)clearInterval(cdTimer);return;}
    var now=Date.now();
    if(ongoingEndMs&&now>=targetMs&&now<=ongoingEndMs){pill.textContent="ends in "+fmtDur(ongoingEndMs-now);return;}
    var diff=targetMs-now;
    if(diff<=0){pill.textContent="now";return;}
    pill.textContent="in "+fmtDur(diff);
  }
  tick();cdTimer=setInterval(tick,1000);
}
function fmtDur(ms){
  var s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;
  if(h>0)return h+"h "+pad(m)+"m";
  if(m>0)return m+"m "+pad(sec)+"s";
  return sec+"s";
}
var MILESTONES=[3,5,7,10,14,21,30,45,60];
function celebrateStreak(streak){
  if(MILESTONES.indexOf(streak)<0)return;
  var last=0;try{last=Number(localStorage.getItem("t4_streak_celeb"))||0;}catch(e){}
  if(streak<=last)return;
  try{localStorage.setItem("t4_streak_celeb",String(streak));}catch(e){}
  confetti();showToast("🔥 "+streak+"-day streak! Keep it up.");
}
function confetti(){
  var box=document.getElementById("confetti");if(!box)return;
  var bits=["🎉","✨","🔥","🎊","⭐","💚"];box.innerHTML="";
  for(var i=0;i<26;i++){
    var s=document.createElement("span");s.className="cf-bit";
    s.textContent=bits[i%bits.length];
    s.style.left=(Math.random()*100)+"%";
    s.style.animationDelay=(Math.random()*0.4)+"s";
    s.style.fontSize=(12+Math.random()*14)+"px";
    box.appendChild(s);
  }
  box.classList.add("go");
  setTimeout(function(){box.classList.remove("go");box.innerHTML="";},2100);
}
function renderHome(){
  var dismissed = false;
  try{ dismissed = localStorage.getItem("t4_install_dismissed") === "1"; }catch(e){}
  var isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  var hint = document.getElementById("gp-install-hint");
  if(hint) {
    if(!dismissed && !isStandalone) {
      hint.style.display = "flex";
    } else {
      hint.style.display = "none";
    }
  }

  var now=Date.now(),tm=todayMs();
  
  // ── TERM PROGRESS BAR CALCULATION ──
  var totalTermMs = TERM_END_MS - TERM_START_MS;
  var termElapsed = now - TERM_START_MS;
  var termPct = 0;
  var termDaysText = "";
  if(now < TERM_START_MS){
    termPct = 0;
    termDaysText = Math.ceil((TERM_START_MS - now)/864e5) + "d until term starts";
  } else if(now > TERM_END_MS){
    termPct = 100;
    termDaysText = "Term complete! 🎉";
  } else {
    termPct = Math.round((termElapsed / totalTermMs) * 100);
    termDaysText = Math.ceil((TERM_END_MS - now)/864e5) + "d left in term (" + termPct + "% elapsed)";
  }
  var elTermPct = document.getElementById("h-term-pct");
  var elTermFill = document.getElementById("h-term-fill");
  var elTermLabel = document.getElementById("h-term-elapsed");
  if(elTermPct) elTermPct.textContent = termPct + "%";
  if(elTermFill) elTermFill.style.width = termPct + "%";
  if(elTermLabel) elTermLabel.textContent = termDaysText;

  var my=mySessions(),ts=todayStr(),done=my.filter(function(s){return s.date<ts;}).length;
  var totP=0,totA=0;my.forEach(function(s){var st=attendance[skey(s)];if(st==="present")totP++;else if(st==="absent")totA++;});
  
  // Overall Attendance Rate
  var marked = totP + totA;
  var globalPct = marked ? Math.round(totP / marked * 100) : 0;
  var attColor = globalPct >= 75 ? "var(--ok)" : globalPct >= 65 ? "var(--warn)" : "var(--bad)";
  
  // Bunk-o-Meter Buffer Check
  var minBuffer = 999;
  prefs.courses.forEach(function(c){
    if(courseTotal(c) > 0) {
      var st = attStats(c);
      if(st.missLeft < minBuffer) minBuffer = st.missLeft;
    }
  });
  if(minBuffer === 999) minBuffer = MAX_MISS;
  var bunkClass = minBuffer <= 0 ? "danger" : minBuffer === 1 ? "warn" : "safe";
  var cardGlowClass = minBuffer <= 0 ? "danger-glow" : minBuffer === 1 ? "danger-glow" : "safe-glow";
  
  // Streak
  var streak = hmStreak();
  celebrateStreak(streak);

  // Sessions progress pct
  var sessionsPct = Math.round(done / (my.length || 1) * 100);

  // Render hero cards grid dynamically
  var heroContainer = document.getElementById("h-hero-v2");
  if(heroContainer){
    heroContainer.innerHTML = 
       '<div class="hcard-v2"><div class="hc-content">'
         +'<div class="hc-title">Attendance</div>'
         +'<div class="hc-value">'+globalPct+'%</div>'
         +'<div class="hc-sub">'+totP+' present · '+totA+' absent</div>'
         +'</div><div class="hc-visual">'+svgRingLarge(totP, marked, attColor)+'</div></div>'
       
       +'<div class="hcard-v2 '+cardGlowClass+'"><div class="hc-content">'
         +'<div class="hc-title" style="display:flex;align-items:center;gap:6px;">Bunk-o-Meter <span class="info-trigger" onclick="showInfoModal(\\\'bunk\\\', event)">ⓘ</span></div>'
         +'<div class="hc-value">'+(minBuffer <= 0 ? 'Danger! 🚨' : minBuffer === 1 ? '1 skip left' : minBuffer+' skips left')+'</div>'
         +'<div class="hc-sub">Min buffer across courses</div>'
         +'<div class="bunk-slider-wrap"><div class="bunk-slider-track"><div class="bunk-slider-fill '+bunkClass+'" style="width:'+Math.max(0, Math.min(100, (minBuffer / MAX_MISS) * 100))+'%"></div></div></div>'
         +'</div></div>'
       
       +'<div class="hcard-v2"><div class="hc-content">'
         +'<div class="hc-title">Streaks</div>'
         +'<div class="hc-value streak-value"><span class="streak-flame">🔥</span>'+streak+' days</div>'
         +'<div class="hc-sub">Active attendance streak</div>'
         +'</div></div>'
       
       +'<div class="hcard-v2"><div class="hc-content">'
         +'<div class="hc-title">Sessions Progress</div>'
         +'<div class="hc-value">'+sessionsPct+'%</div>'
         +'<div class="hc-sub">'+done+' of '+my.length+' classes done</div>'
         +'<div class="bunk-slider-wrap"><div class="bunk-slider-track"><div class="bunk-slider-fill" style="width:'+sessionsPct+'%; background:var(--acc)"></div></div></div>'
         +'</div></div>';
  }

  // Next up / Ongoing now banner
  var up=my.filter(function(s){return sessionMs(s)+90*6e4 > now;}).sort(function(a,b){return sessionMs(a)-sessionMs(b);});
  var bw=document.getElementById("h-banner");
  if(up.length){
    var n=up[0],nd=new Date(n.date+"T00:00:00+05:30");
    var isOngoing = now >= sessionMs(n) && now <= sessionMs(n)+90*6e4;
    var when=n.date===ts?"today":(nd.getTime()===tm+864e5?"tomorrow":DS[nd.getDay()]+" "+nd.getDate()+" "+MO[nd.getMonth()]);
    var late=n.late?'<span class="late">late</span>':'';
    var label = isOngoing ? '<span class="pulse-live"></span>Ongoing now' : 'Next up';
    var cardClass = isOngoing ? 'nbanner ongoing' : 'nbanner';
    bw.innerHTML='<div class="'+cardClass+'" style="--cc:'+CCOLOR[n.code]+'"><span class="nb-dot"></span><div><div class="nb-l">'+label+'</div><div class="nb-c">'+META[n.code].name+'</div><div class="nb-t">S'+n.n+' · '+n.slot+late+' · '+when+' · <span id="nb-countdown">…</span></div></div><div class="nb-p">S'+n.n+'/'+courseTotal(n.code)+'</div></div>';
    startBannerCountdown(sessionMs(n),sessionMs(n)+90*6e4);
  } else { bw.innerHTML=''; if(cdTimer){clearInterval(cdTimer);cdTimer=null;} }
  // Unmarked-classes nudge: keeps the buffer math honest. Tap → jump to the most recent unmarked day.
  var nudge=document.getElementById("h-nudge");
  if(nudge){
    var unm=my.filter(function(s){return s.date<ts&&!attendance[skey(s)];});
    if(unm.length){
      var recent=unm.map(function(s){return s.date;}).sort();recent=recent[recent.length-1];
      nudge.innerHTML='<div class="nudge"><span class="nudge-ico">⚠</span>'
        +'<div class="nudge-body"><div class="nudge-t">'+unm.length+' past class'+(unm.length>1?'es':'')+' unmarked</div>'
        +'<div class="nudge-s">Mark them so your attendance buffer stays accurate</div></div>'
        +'<button class="nudge-cta" onclick="openUnmarked()">Review</button></div>';
    } else nudge.innerHTML='';
  }
  document.getElementById("h-today").innerHTML=renderDay(tm,"Today",true);
  document.getElementById("h-tomorrow").innerHTML=renderDay(tm+864e5,"Tomorrow",false);
}
/* ── UNDO TOAST ── */
var toastTimer=null;
function showToast(msg,undoFn){
  var el=document.getElementById("toast");if(!el)return;
  el.innerHTML='<span>'+msg+'</span>'+(undoFn?'<button class="toast-undo" id="toast-undo">Undo</button>':'');
  el.classList.add("show");
  if(undoFn){document.getElementById("toast-undo").onclick=function(){undoFn();hideToast();};}
  clearTimeout(toastTimer);toastTimer=setTimeout(hideToast,6000);
}
function hideToast(){var el=document.getElementById("toast");if(el)el.classList.remove("show");}

function rerenderAfterMark(){
  renderHome();
  if(document.getElementById("p-att").classList.contains("on"))renderAtt();
  if(document.getElementById("p-week").classList.contains("on"))renderWeek();
  if(document.getElementById("unmarked-ov")&&document.getElementById("unmarked-ov").classList.contains("open"))renderUnmarked();
  refreshOpenTL();
}
function skLabel(k){var p=String(k).split("_");return p[0]+" S"+(p[2]||"");}
/* Set one session to an exact value ("" = unmarked) — the primitive behind mark/undo/bulk. */
function applyMark(k,value,src){
  if(!value)delete attendance[k];else attendance[k]=value;
  try{if(navigator.vibrate)navigator.vibrate(9);}catch(e){}
  saveA();rerenderAfterMark();
  if(prefs.rollNo)syncMark(k,value||null,src||"manual");
}
function mark(k,status,src){
  var prev=attendance[k]||"";                       // for undo
  var ns=attendance[k]===status?"":status;          // tap-again toggles off
  applyMark(k,ns,src||"manual");
  showToast(ns?(skLabel(k)+" → "+ns):(skLabel(k)+" cleared"),function(){applyMark(k,prev,"undo");});
}
function renderUnmarked(){
  var el=document.getElementById("unmarked-full-list");if(!el)return;
  var ts=todayStr();
  var un=mySessions().filter(function(s){return s.date<ts&&!attendance[skey(s)];});
  un.sort(function(a,b){return a.date>b.date?-1:a.date<b.date?1:(b.sh*60+b.sm)-(a.sh*60+a.sm);});
  if(!un.length){el.innerHTML='<div class="free" style="margin-top:10px">All caught up 🌿</div>';return;}
  var html = un.map(function(s){
    var d=new Date(s.date+"T00:00:00+05:30");
    var lbl = DF[d.getDay()]+", "+d.getDate()+" "+MO[d.getMonth()];
    return '<div style="margin-bottom:8px"><div class="daylabel" style="margin:4px 0">'+lbl+'</div>'+scard(s,true)+'</div>';
  }).join("");
  el.innerHTML=html;
}
function openUnmarked(){ renderUnmarked(); var ov=document.getElementById("unmarked-ov"); if(ov)ov.classList.add("open"); }
function closeUnmarked(){ var ov=document.getElementById("unmarked-ov"); if(ov)ov.classList.remove("open"); }
function bulkMarkPresent(){
  var ts=todayStr();
  var un=mySessions().filter(function(s){return s.date<ts&&!attendance[skey(s)];});
  if(!un.length){showToast("No unmarked past sessions");return;}
  if(!confirm("Mark "+un.length+" past unmarked sessions as Present?"))return;
  var keys=un.map(function(s){return skey(s);});
  keys.forEach(function(k){attendance[k]="present";if(prefs.rollNo)syncMark(k,"present","bulk");});
  saveA();rerenderAfterMark();
  showToast(keys.length+" marked present",function(){               // one-tap undo for the whole batch
    keys.forEach(function(k){delete attendance[k];if(prefs.rollNo)syncMark(k,null,"undo-bulk");});
    saveA();rerenderAfterMark();showToast(keys.length+" reverted");
  });
}

/* ── WEEK ── */
var wkOff=0;
function renderWeek(){
  var base=new Date(todayMs()),mon=new Date(base);
  mon.setDate(base.getDate()-((base.getDay()+6)%7)+wkOff*7);
  var days=[];for(var i=0;i<7;i++){var d=new Date(mon);d.setDate(mon.getDate()+i);days.push(d);}
  document.getElementById("wkl").textContent=mon.getDate()+" "+MO[mon.getMonth()]+" – "+days[6].getDate()+" "+MO[days[6].getMonth()];
  document.getElementById("pw").disabled=wkOff<=-2;
  document.getElementById("nw").disabled=wkOff>=12;
  document.getElementById("wkgrid").innerHTML=days.map(function(d){
    var ds=dstr(d),isT=ds===todayStr(),ss=byDate(ds),heavy=ss.length>=3;
    var chips=ss.map(function(s){return '<span class="wchip" style="color:'+CCOLOR[s.code]+'">'+s.code+'<span class="wct">'+s.slot+'</span></span>';}).join("");
    return '<div class="wd'+(isT?" today":"")+(heavy?" heavy":"")+'"><div class="wd-top"><div class="wd-d">'+DS[d.getDay()]+'</div><div class="wd-n">'+d.getDate()+'</div></div><div class="wd-chips">'+(chips||'<span class="wd-empty">—</span>')+'</div></div>';
  }).join("");
  document.getElementById("heatmap-ct").innerHTML=buildHeatmap();
}
function shiftWk(d){wkOff+=d;renderWeek();}

/* ── ATTEND ── */
function attStats(code){
  var all=mySessions().filter(function(s){return s.code===code;}),present=0,absent=0;
  all.forEach(function(s){var st=attendance[skey(s)];if(st==="present")present++;else if(st==="absent")absent++;});
  return {total:all.length,present:present,absent:absent,remaining:all.length-(present+absent),missLeft:MAX_MISS-absent};
}
function renderAtt(){
  var el=document.getElementById("p-att");
  var cards=prefs.courses.filter(function(c){return courseTotal(c)>0;}).map(function(code){
    var st=attStats(code),cls="",badge="",txt="";
    if(st.missLeft<0){cls="danger";badge="danger";txt="Over limit";}
    else if(st.missLeft===0){cls="danger";badge="danger";txt="At limit";}
    else if(st.missLeft===1){cls="warn";badge="warn";txt="1 left";}
    else{badge="safe";txt=st.missLeft+" buffer";}
    var segs="";for(var i=0;i<MAX_MISS;i++)segs+='<span class="bseg '+(i<st.absent?"used":"free")+'"></span>';
    var need=Math.max(0,st.remaining-st.missLeft),proj;
    if(st.missLeft<0)proj='<span class="pj-bad">Over the limit by '+(-st.missLeft)+' — every remaining class now counts.</span>';
    else if(st.remaining<=st.missLeft)proj='<span class="pj-ok">Safe — you could skip all '+st.remaining+' remaining and stay within '+MAX_MISS+'.</span>';
    else proj='Attend <b>'+need+'</b> of the '+st.remaining+' remaining to stay safe · <span class="'+(st.missLeft===1?'pj-warn':'')+'">skip up to '+st.missLeft+'</span>.';
    return '<div class="acard '+cls+'" style="--cc:'+CCOLOR[code]+'">'
      +'<div class="acard-inner"><div class="acard-left">'
      +'<div class="ac-top"><span class="ac-code">'+code+'</span><span class="ac-status '+badge+'">'+txt+'</span></div>'
      +'<div class="ac-name">'+META[code].full+'</div>'
      +'<div class="ac-stats"><div><div class="ac-sv" style="color:var(--ok)">'+st.present+'</div><div class="ac-sl">present</div></div>'
      +'<div><div class="ac-sv" style="color:var(--bad)">'+st.absent+'</div><div class="ac-sl">absent</div></div>'
      +'<div><div class="ac-sv" style="color:var(--t2)">'+st.remaining+'</div><div class="ac-sl">to come</div></div>'
      +'<div><div class="ac-sv">'+st.total+'</div><div class="ac-sl">total</div></div></div>'
      +'<div class="buffer-bar">'+segs+'</div>'
      +'<div class="ac-note">'+(st.missLeft<0?'⚠ Over the '+MAX_MISS+'-absence limit':st.missLeft===0?'⚠ No more absences allowed':'Can still miss '+st.missLeft+'/'+MAX_MISS)+'</div>'
      +'<div class="ac-proj">'+proj+'</div>'
      +'<button class="tl-btn" data-tl="'+code+'">View timeline</button>'
      +'</div>'+svgRing(st.present,st.total,CCOLOR[code])+'</div></div>';
  }).join("");
  el.innerHTML='<div class="share-row"><button class="share-btn" onclick="generateShareCard()">↗ Share attendance card</button></div>'
    +'<div class="daylabel">Attendance · max '+MAX_MISS+' absences per course</div>'
    +'<div class="att-grid">'+cards+'</div>'
    +'<div style="font-size:10px;color:var(--t3);margin-top:14px;line-height:1.6">Unmarked past sessions do not count as absent.</div>';
}

/* ── LEAVE ── */
function renderLeave(){
  var el=document.getElementById("p-leave"),ts=todayStr();
  var future=mySessions().filter(function(s){return s.date>=ts;}).sort(function(a,b){
    return a.date<b.date?-1:a.date>b.date?1:(a.sh*60+a.sm)-(b.sh*60+b.sm);
  });
  var impRows=prefs.courses.filter(function(c){return courseTotal(c)>0;}).map(function(code){
    var st=attStats(code),pl=mySessions().filter(function(s){return s.code===code&&plannedLeave[skey(s)];}).length;
    var proj=st.absent+pl,left=MAX_MISS-proj;
    return '<div class="lp-imp-row"><span style="color:'+CCOLOR[code]+'">'+code+'</span>'
      +'<span class="'+(left<=1?"lp-imp-warn":"lp-imp-ok")+'">'+proj+'/'+MAX_MISS+(pl?' (+'+pl+' planned)':'')+(left<0?' ⚠':'')+'</span></div>';
  }).join("");
  var byD={};future.forEach(function(s){(byD[s.date]=byD[s.date]||[]).push(s);});
  var blocks=Object.keys(byD).map(function(date){
    var ss=byD[date],d=new Date(date+"T00:00:00+05:30"),allP=ss.every(function(s){return plannedLeave[skey(s)];});
    var chips=ss.map(function(s){var k=skey(s);return '<span class="lp-chip '+(plannedLeave[k]?"planned":"")+'" data-lk="'+k+'">'+s.code+' '+s.slot+'</span>';}).join("");
    return '<div class="lp-day"><div class="lp-date"><span>'+DF[d.getDay()]+', '+d.getDate()+' '+MO[d.getMonth()]+'</span>'
      +'<span class="lp-toggle '+(allP?"on":"")+'" data-daytog="'+date+'">'+(allP?"skip all ✓":"skip day")+'</span></div>'
      +'<div class="lp-sess">'+chips+'</div></div>';
  }).join("");
  el.innerHTML='<div class="lp-impact"><div class="lp-imp-title">If you take all planned leaves</div>'+impRows+'</div>'
    +'<div class="lp-intro">Tap any session to plan an absence. Impact panel updates live.</div>'
    +(blocks||'<div class="free">No upcoming classes 🌿</div>');
}
function togLeave(k){if(plannedLeave[k])delete plannedLeave[k];else plannedLeave[k]=1;saveL();renderLeave();}
function togDay(date){
  var ss=mySessions().filter(function(s){return s.date===date;}),allP=ss.every(function(s){return plannedLeave[skey(s)];});
  ss.forEach(function(s){var k=skey(s);if(allP)delete plannedLeave[k];else plannedLeave[k]=1;});
  saveL();renderLeave();
}

/* ── PROGRESS ── */
function renderProg(){
  var el=document.getElementById("p-prog"),ts=todayStr();
  var cards=prefs.courses.filter(function(c){return courseTotal(c)>0;}).map(function(code){
    var all=mySessions().filter(function(s){return s.code===code;}).sort(chrono);
    var done=all.filter(function(s){return s.date<ts;}).length,tot=all.length,pct=tot?Math.round(done/tot*100):0;
    var nxt=all.find(function(s){return s.date>=ts;});
    var ns=nxt?'Next: S'+nxt.n+' · '+new Date(nxt.date+"T00:00:00+05:30").getDate()+' '+MO[new Date(nxt.date+"T00:00:00+05:30").getMonth()]+' · '+nxt.slot:'All sessions complete';
    return '<div class="pcard" style="--cc:'+CCOLOR[code]+'"><div class="pc-top"><span class="pc-code">'+code+' · '+META[code].name+'</span><span class="pc-frac">'+done+'/'+tot+'</span></div><div class="pbar"><div class="pfill" style="width:'+pct+'%"></div></div><div style="font-size:10px;color:var(--t3);margin-top:7px">'+ns+'</div></div>';
  }).join("");
  el.innerHTML='<div class="daylabel">Course progress</div><div class="prog-grid">'+cards+'</div>';
}

/* ── FRIENDS ──
   A friend is just {id, name, rollNo}. Their section + courses are pulled
   from THEIR OWN saved setup in userprefs (by roll number) and cached in
   {section, courses, cachedAt, pending}. Refreshed when Friends opens and on
   manual refresh, so a friend changing electives updates automatically.
*/
function findFreeTime(fid) {
  var f = friends.find(function(x){return x.id===fid;});
  if(!f) return;
  if(f.pending || !f.courses) { alert("Their schedule hasn't synced yet."); return; }
  
  var mySs = mySessions(), frSs = friendSessions(f);
  var ts = todayStr(), tmr = new Date(todayMs()+864e5).toISOString().split("T")[0];
  var ex = Array.isArray(EXAMS) ? EXAMS : [];
  var html = "";
  
  [ts, tmr].forEach(function(date) {
    var myDay = mySs.filter(function(s){return s.date===date;});
    var frDay = frSs.filter(function(s){return s.date===date;});
    var myEx = ex.filter(function(x){return x.date===date && (!x.code || prefs.courses.indexOf(x.code)>=0);});
    var frEx = ex.filter(function(x){return x.date===date && (!x.code || f.courses.indexOf(x.code)>=0);});
    
    var freeSlots = [];
    SLOTS.forEach(function(slot) {
      var myBusy = myDay.some(function(s){return s.sh===slot[1] && s.sm===slot[2];}) || myEx.some(function(x){return x.sh===slot[1] && x.sm===slot[2];});
      var frBusy = frDay.some(function(s){return s.sh===slot[1] && s.sm===slot[2];}) || frEx.some(function(x){return x.sh===slot[1] && x.sm===slot[2];});
      if(!myBusy && !frBusy) freeSlots.push(slot[0]);
    });
    
    var dStr = date===ts ? "Today" : "Tomorrow";
    if(freeSlots.length === SLOTS.length) {
      html += '<div class="ss-sub">' + dStr + '</div><div class="free" style="padding:12px">Both entirely free! 🎉</div>';
    } else if(freeSlots.length === 0) {
      html += '<div class="ss-sub">' + dStr + '</div><div class="free" style="padding:12px">No common free time 😢</div>';
    } else {
      var chips = freeSlots.map(function(sl){ return '<div style="background:var(--s2);border:.5px solid var(--b2);padding:6px 10px;border-radius:8px;font-family:\\'DM Mono\\',monospace;font-size:12px;color:var(--t1)">'+sl+'</div>'; }).join("");
      html += '<div class="ss-sub">' + dStr + '</div><div style="display:flex;flex-wrap:wrap;gap:8px">' + chips + '</div>';
    }
  });
  
  var ovHtml = '<div id="freetime-ov" class="ovl-bg open" onclick="if(event.target.id===\\'freetime-ov\\'){this.remove();document.body.classList.remove(\\'no-scroll\\');}">' +
    '<div class="sheet">' +
      '<div class="ss-t">Common Free Time <button class="ss-x" onclick="document.getElementById(\\'freetime-ov\\').remove();document.body.classList.remove(\\'no-scroll\\');">✕</button></div>' +
      '<div style="font-size:13px;color:var(--t2);margin-bottom:16px">You & ' + (f.name||f.rollNo) + '</div>' +
      html +
    '</div></div>';
    
  document.body.insertAdjacentHTML('beforeend', ovHtml);
  document.body.classList.add('no-scroll');
}
function friendSessions(f){
  if(!f||f.pending||!f.section||!f.courses||!Array.isArray(f.courses))return [];
  return SESSIONS.filter(function(s){
    if(f.courses.indexOf(s.code)<0)return false;
    if(s.section==="BOTH")return true;
    var want=(f.courseSections&&f.courseSections[s.code])||f.section;
    return s.section===want;
  });
}
function friendNow(f){
  var now=Date.now();
  return friendSessions(f).find(function(s){var sm=sessionMs(s);return now>=sm&&now<=(sm+90*6e4);});
}
function friendNext(f){
  var now=Date.now();
  var up=friendSessions(f).filter(function(s){return sessionMs(s)>now;}).sort(function(a,b){return sessionMs(a)-sessionMs(b);});
  return up[0]||null;
}
function renderFriends(){
  var list=document.getElementById("f-list");if(!list)return;
  var syncEl=document.getElementById("f-sync-status");
  if(syncEl)syncEl.style.display=friendsLoading?"inline":"none";
  var activeFriends = Array.isArray(friends) ? friends.filter(Boolean) : [];
  if(friendsLoading && !activeFriends.length){
    list.innerHTML='<div class="f-card skeleton" style="animation:pulse 1.5s infinite ease-in-out;opacity:0.6;border-color:var(--b2);padding:12px 14px"><div style="height:14px;width:120px;background:var(--s3);border-radius:4px;margin-bottom:8px"></div><div style="height:10px;width:150px;background:var(--s3);border-radius:3px"></div></div>'
      +'<div class="f-card skeleton" style="animation:pulse 1.5s infinite ease-in-out;opacity:0.4;border-color:var(--b2);padding:12px 14px"><div style="height:14px;width:90px;background:var(--s3);border-radius:4px;margin-bottom:8px"></div><div style="height:10px;width:110px;background:var(--s3);border-radius:3px"></div></div>';
    return;
  }
  if(!activeFriends.length){list.innerHTML='<div class="free" style="margin-bottom:12px">No friends added yet.</div>';return;}
  list.innerHTML=activeFriends.map(function(f){
    var status,sub;
    if(f.syncing){
      sub=f.rollNo+' · syncing schedule...';
      status='<div class="f-free" style="animation:pulse 1.5s infinite">Syncing schedule from server...</div>';
    } else if(f.pending){
      sub=f.rollNo+' · schedule not synced yet';
      status='<div class="f-free">They haven\\\'t set up the app yet — tap ⟳ to retry</div>';
    } else {
      sub=f.rollNo+' · Sec '+f.section;
      var cur=friendNow(f),nxt=friendNext(f);
      if(cur) status='<div class="f-now">In '+cur.code+' now · '+cur.slot+'</div>';
      else if(nxt){var nd=new Date(nxt.date+"T00:00:00+05:30");var when=nxt.date===todayStr()?"today":(nd.getTime()===todayMs()+864e5?"tomorrow":nd.getDate()+" "+MO[nd.getMonth()]);status='<div class="f-next">Next: '+nxt.code+' · '+nxt.slot+' · '+when+'</div>';}
      else status='<div class="f-free">No upcoming classes</div>';
    }
    var actions = '<div class="g-actions" style="margin-top:10px">' +
      '<button class="g-act" onclick="findFreeTime(\\''+f.id+'\\')" style="background:var(--s1);border:.5px solid var(--b2)">🔍 Compare schedules</button>' +
      '<button class="g-act f-del" data-fid="'+f.id+'" style="flex:0 0 auto;color:var(--bad);background:var(--s1);border:.5px solid var(--b2);border-radius:7px;padding:8px 12px;min-height:0">Remove</button>' +
      '</div>';
    return '<div class="f-card"><div class="f-top" style="margin-bottom:8px"><div><div class="f-name">'+(f.name||f.rollNo)+'</div><div class="f-roll">'+sub+'</div></div></div>'+status+statusPillHTML(f.status)+actions+'</div>';
  }).join("");
}
function showAddFriend(){
  document.getElementById("f-add-form").style.display="block";
  document.getElementById("f-add-hint").textContent="";
}
function saveFriend(){
  var name=document.getElementById("f-name").value.trim();
  var roll=document.getElementById("f-roll").value.trim().toUpperCase();
  var hint=document.getElementById("f-add-hint");
  if(!/^B25[0-9]{3}$/.test(roll)){hint.style.color="var(--bad)";hint.textContent="Enter a valid roll number (B25301–B25480)";return;}
  if(roll===(prefs.rollNo||"")){hint.style.color="var(--warn)";hint.textContent="That's your own roll number.";return;}
  var activeFriends = Array.isArray(friends) ? friends.filter(Boolean) : [];
  if(activeFriends.some(function(f){return f.rollNo===roll;})){hint.style.color="var(--warn)";hint.textContent="Already in your friends list.";return;}
  var f={id:Date.now().toString(),name:name||(ROSTER[roll]&&ROSTER[roll].n)||roll,rollNo:roll,pending:true};
  friends.push(f);saveFriends();syncFriendsList();
  document.getElementById("f-add-form").style.display="none";
  document.getElementById("f-name").value="";document.getElementById("f-roll").value="";
  document.getElementById("f-add-hint").textContent="";
  var rs=document.getElementById("f-roll-sug");if(rs){rs.style.display="none";rs.innerHTML="";}
  renderFriends();
  fetchFriendPrefs([roll]);   // hydrate their schedule
}
function deleteFriend(id){
  if(Array.isArray(friends)){
    friends=friends.filter(function(f){return f&&f.id!==id;});
    saveFriends();syncFriendsList();
  }
  renderFriends();
}
function switchFovTab(tab,btn){
  document.querySelectorAll("#fov .fov-tabs .secbtn").forEach(function(b){b.classList.remove("on");});
  if(btn)btn.classList.add("on");
  var fp=document.getElementById("fov-friends-pane"),gp=document.getElementById("fov-groups-pane");
  if(fp)fp.style.display=tab==="groups"?"none":"block";
  if(gp)gp.style.display=tab==="groups"?"block":"none";
}
function openF(){
  try { renderFriends(); } catch(e) { console.error("Error rendering friends:", e); }
  try { renderGroups(); } catch(e) { console.error("Error rendering groups:", e); }
  var sr=document.getElementById("f-search-result");if(sr)sr.innerHTML="";
  var sb=document.getElementById("f-search-sug");if(sb){sb.style.display="none";sb.innerHTML="";}
  switchFovTab("friends",document.querySelector('#fov .fov-tabs [data-fovtab="friends"]'));
  var overlay = document.getElementById("fov");
  if(overlay) overlay.classList.add("open");
  try { refreshFriends(); } catch(e) { console.error("Error refreshing friends:", e); }
  try { refreshGroups(); } catch(e) { console.error("Error refreshing groups:", e); }
}
function closeF(){var overlay=document.getElementById("fov");if(overlay)overlay.classList.remove("open");}

/* Pull section+courses for a set of friend roll numbers and cache them. */
function fetchFriendPrefs(rolls){
  if(!rolls||!rolls.length)return Promise.resolve();
  var changed=false;
  friends.forEach(function(f){
    if(rolls.indexOf(f.rollNo)>=0 && f.pending){
      f.syncing=true;
      changed=true;
    }
  });
  if(changed)renderFriends();
  return fetch(EXEC_URL,{method:"POST",body:JSON.stringify({action:"getManyPrefs",rollNos:rolls}),redirect:"follow"})
    .then(function(r){return r.json();})
    .then(function(d){
      friends.forEach(function(f){
        if(rolls.indexOf(f.rollNo)>=0) delete f.syncing;
      });
      if(!d||!d.ok||!d.data){renderFriends();return;}
      var chg=false;
      friends.forEach(function(f){
        var p=d.data[f.rollNo];
        if(!p)return;
        f.status=p.status||null;
        if(p.section&&p.courses&&p.courses.length){
          f.section=p.section;f.courses=p.courses;f.courseSections=p.courseSections||{};f.pending=false;f.cachedAt=Date.now();chg=true;
        }
      });
      if(chg)saveFriends();
      renderFriends();
    }).catch(function(){
      friends.forEach(function(f){
        if(rolls.indexOf(f.rollNo)>=0) delete f.syncing;
      });
      renderFriends();
    });
}
/* Refresh every friend's schedule (called when Friends opens / on manual refresh). */
function refreshFriends(){
  if(!friends.length)return Promise.resolve();
  friendsLoading=true;
  renderFriends();
  return fetchFriendPrefs(friends.map(function(f){return f.rollNo;}))
    .then(function(){
      friendsLoading=false;
      renderFriends();
    })
    .catch(function(){
      friendsLoading=false;
      renderFriends();
    });
}

/* ── ROSTER AUTOCOMPLETE (names from rollnumbers.csv, injected as ROSTER) ── */
function rosterMatches(q){
  q=(q||"").trim().toUpperCase();if(!q)return [];
  var out=[];
  for(var roll in ROSTER){
    var nm=ROSTER[roll].n||"";
    if(roll.indexOf(q)===0||nm.toUpperCase().indexOf(q)>=0){
      out.push({roll:roll,name:nm,sec:ROSTER[roll].s||""});
      if(out.length>=7)break;
    }
  }
  return out;
}
function renderSug(boxId,q){
  var box=document.getElementById(boxId);if(!box)return;
  var m=(""+(q||"")).trim()?rosterMatches(q):[];
  if(!m.length){box.style.display="none";box.innerHTML="";return;}
  box.style.display="block";
  box.innerHTML=m.map(function(x){
    return '<div class="sug-item" data-roll="'+x.roll+'" data-name="'+String(x.name).replace(/"/g,"&quot;")+'">'
      +'<span class="sug-roll">'+x.roll+'</span><span class="sug-name">'+x.name+'</span><span class="sug-sec">'+x.sec+'</span></div>';
  }).join("");
}
function onFriendRollInput(){
  var v=document.getElementById("f-roll").value;
  renderSug("f-roll-sug",v);
  var r=v.trim().toUpperCase(),hint=document.getElementById("f-add-hint");
  if(ROSTER[r]){hint.style.color="var(--t2)";hint.textContent="✓ "+ROSTER[r].n+" · Sec "+ROSTER[r].s;}
  else hint.textContent="";
}

/* ── INSTANT SEARCH: anyone's class right now, by roll or name ── */
function onSearchInput(){renderSug("f-search-sug",document.getElementById("f-search").value);}
function searchRoll(){
  var box=document.getElementById("f-search-sug");if(box){box.style.display="none";box.innerHTML="";}
  var q=document.getElementById("f-search").value.trim().toUpperCase(),roll=q;
  var res=document.getElementById("f-search-result");
  if(!/^B25[0-9]{3}$/.test(roll)){
    var m=rosterMatches(q);
    if(m.length)roll=m[0].roll;
    else{res.innerHTML='<div class="f-card"><div class="f-free">No student matches "'+q+'".</div></div>';return;}
  }
  if(!ROSTER[roll]){res.innerHTML='<div class="f-card"><div class="f-free">Unknown roll '+roll+'.</div></div>';return;}
  res.innerHTML='<div class="f-card"><div class="f-name">'+ROSTER[roll].n+'</div><div class="f-roll">'+roll+' · Sec '+ROSTER[roll].s+'</div><div class="f-free">Looking up schedule…</div></div>';
  fetch(EXEC_URL,{method:"POST",body:JSON.stringify({action:"getManyPrefs",rollNos:[roll]}),redirect:"follow"})
    .then(function(r){return r.json();})
    .then(function(d){
      var p=(d&&d.ok&&d.data)?d.data[roll]:null,status;
      if(!p||!p.courses||!p.courses.length){
        status='<div class="f-free">Hasn\\\'t set up the app yet — no schedule to show.</div>';
      } else {
        var pf={section:p.section,courses:p.courses,courseSections:p.courseSections};
        var cur=friendNow(pf),nxt=friendNext(pf);
        if(cur)status='<div class="f-now">In '+cur.code+' now · '+cur.slot+'</div>';
        else if(nxt){var nd=new Date(nxt.date+"T00:00:00+05:30");var when=nxt.date===todayStr()?"today":(nd.getTime()===todayMs()+864e5?"tomorrow":nd.getDate()+" "+MO[nd.getMonth()]);status='<div class="f-next">Next: '+nxt.code+' · '+nxt.slot+' · '+when+'</div>';}
        else status='<div class="f-free">No upcoming classes</div>';
      }
      var addBtn=(roll===(prefs.rollNo||""))?'':'<button class="f-del" onclick="quickAddFriend(\\\''+roll+'\\\')">+ Friend</button>';
      var sPill=(p&&p.status)?statusPillHTML(p.status):"";
      res.innerHTML='<div class="f-card"><div class="f-top"><div><div class="f-name">'+ROSTER[roll].n+'</div><div class="f-roll">'+roll+' · Sec '+ROSTER[roll].s+'</div></div>'+addBtn+'</div>'+status+sPill+'</div>';
    }).catch(function(){res.innerHTML='<div class="f-card"><div class="f-free">Server unreachable — try refresh.</div></div>';});
}
function quickAddFriend(roll){
  if(friends.some(function(f){return f.rollNo===roll;})){alert(ROSTER[roll]?ROSTER[roll].n+" is already a friend.":"Already a friend.");return;}
  var f={id:Date.now().toString(),name:(ROSTER[roll]&&ROSTER[roll].n)||roll,rollNo:roll,pending:true};
  friends.push(f);saveFriends();syncFriendsList();renderFriends();fetchFriendPrefs([roll]);
  var sr=document.getElementById("f-search-result");if(sr)sr.innerHTML='<div class="f-card"><div class="f-free">Added '+f.name+' to friends ✓</div></div>';
}

/* ── GROUPS (client) ──
   prefs.groups = [codes] you belong to (persisted via setPrefs, so it restores).
   myGroups     = hydrated [{code,name,owner,members:[roll],memberPrefs:{roll:{section,courses,...}}}]. */
function refreshGroups(){
  if(!prefs.rollNo){myGroups=[];renderGroups();return Promise.resolve();}
  groupsLoading=true;
  renderGroups();
  return fetch(EXEC_URL,{method:"POST",body:JSON.stringify({action:"getMyGroups",rollNo:prefs.rollNo}),redirect:"follow"})
    .then(function(r){return r.json();})
    .then(function(d){
      groupsLoading=false;
      if(d&&d.ok&&d.data){
        var pm=d.data.prefs||{};
        myGroups=(d.data.groups||[]).map(function(g){
          g.memberPrefs={};g.members.forEach(function(roll){g.memberPrefs[String(roll).toUpperCase()]=pm[String(roll).toUpperCase()];});
          return g;
        });
        try{localStorage.setItem("t4_my_groups",JSON.stringify(myGroups));}catch(e){}
      }
      renderGroups();
    }).catch(function(){
      groupsLoading=false;
      renderGroups();
    });
}
function renderGroups(){
  var el=document.getElementById("g-list");if(!el)return;
  var syncEl=document.getElementById("g-sync-status");
  if(syncEl)syncEl.style.display=groupsLoading?"inline":"none";
  var activeGroups = Array.isArray(myGroups) ? myGroups.filter(Boolean) : [];
  if(groupsLoading&&!activeGroups.length){
    el.innerHTML='<div class="g-card skeleton" style="animation:pulse 1.5s infinite ease-in-out;opacity:0.6;border-color:var(--b2)"><div style="padding:12px 14px"><div style="height:14px;width:140px;background:var(--s3);border-radius:4px;margin-bottom:8px"></div><div style="height:10px;width:100px;background:var(--s3);border-radius:3px"></div></div></div>'
      +'<div class="g-card skeleton" style="animation:pulse 1.5s infinite ease-in-out;opacity:0.4;border-color:var(--b2)"><div style="padding:12px 14px"><div style="height:14px;width:110px;background:var(--s3);border-radius:4px;margin-bottom:8px"></div><div style="height:10px;width:80px;background:var(--s3);border-radius:3px"></div></div></div>';
    return;
  }
  if(!activeGroups.length){el.innerHTML='<div class="f-free" style="margin-bottom:10px">No groups yet. Create one and share its code, or join a friend\\'s with their code.</div>';return;}
  el.innerHTML=activeGroups.map(function(g){
    var inNow=0,freeNow=0;
    var membersList = Array.isArray(g.members) ? g.members.filter(Boolean) : [];
    var memberPrefs = g.memberPrefs || {};
    var rows=membersList.map(function(roll){
      roll=String(roll).toUpperCase();
      var nm=(ROSTER[roll]&&ROSTER[roll].n)||roll,p=memberPrefs[roll],st;
      if(!p||!p.courses||!p.courses.length){st='<span class="f-free">not set up</span>';}
      else{
        var pf={section:p.section,courses:p.courses,courseSections:p.courseSections};
        var cur=friendNow(pf),nxt=friendNext(pf);
        if(cur){inNow++;st='<span class="f-now">'+cur.code+' now</span>';}
        else if(nxt){var nd=new Date(nxt.date+"T00:00:00+05:30");var when=nxt.date===todayStr()?"today":(nd.getTime()===todayMs()+864e5?"tmrw":nd.getDate()+" "+MO[nd.getMonth()]);st='<span class="f-next">'+nxt.code+' '+nxt.slot+' · '+when+'</span>';freeNow++;}
        else{st='<span class="f-free">free</span>';freeNow++;}
      }
      var you=roll===(prefs.rollNo||"")?' <span class="gm-roll">(you)</span>':'';
      var semoji=(p&&statusActive(p.status))?(p.status.emoji||'💬')+' ':'';
      var stitle=(p&&statusActive(p.status))?String(p.status.text).replace(/"/g,'&quot;'):'';
      return '<div class="gm-row"><span class="gm-name" title="'+stitle+'">'+semoji+nm+you+' <span class="gm-roll">'+roll+'</span></span>'+st+'</div>';
    }).join("");
    var isOwner=g.owner===(prefs.rollNo||"");
    var ownerBtn=isOwner?'<button class="g-act" onclick="addMemberUI(\\\''+g.code+'\\\')">＋ Add member</button>':'';
    var ownerTag=isOwner?' · you own this':'';
    return '<div class="g-card" id="gc-'+g.code+'"><div class="g-head" data-gtog="'+g.code+'">'
      +'<div><div class="g-name">'+(g.name||"Group")+'</div><div class="g-meta">'+membersList.length+' members · code '+g.code+ownerTag+'</div></div><span class="g-chev">▾</span></div>'
      +'<div class="g-body" id="gbody-'+g.code+'" style="display:none">'
      +'<div class="g-summary">'+inNow+' in class now · '+freeNow+' free/upcoming</div>'+rows
      +'<div class="g-actions">'+ownerBtn+'<button class="g-act" style="color:var(--acc);border-color:rgba(212,242,68,0.35)" onclick="openGroupPlanner(\\\''+g.code+'\\\')">📊 Trip Planner</button><button class="g-act" onclick="shareGroup(\\\''+g.code+'\\\')">↗ Share code</button><button class="g-act warn" onclick="leaveGroupUI(\\\''+g.code+'\\\')">Leave</button></div>'
      +'</div></div>';
  }).join("");
}
function createGroupUI(){
  if(!prefs.rollNo){alert("Set your roll number first (Settings).");return;}
  var name=prompt("Name your group (e.g. 'Marketing Squad'):");
  if(name===null)return;
  fetch(EXEC_URL,{method:"POST",body:JSON.stringify({action:"createGroup",rollNo:prefs.rollNo,name:name}),redirect:"follow"})
    .then(function(r){return r.json();})
    .then(function(d){
      if(d&&d.ok){
        refreshGroups();
        alert("Group '" + d.name + "' created!\\n\\nShare this link — tapping it adds friends to the group instantly:\\n\\n" + groupJoinLink(d.code) + "\\n\\n(Or share the code " + d.code + " for Friends → Join with code.)");
      } else alert("Could not create group"+(d&&d.error?": "+d.error:"")+".");
    }).catch(function(){alert("Server unreachable — try again.");});
}
function joinGroupUI(){
  if(!prefs.rollNo){alert("Set your roll number first (Settings).");return;}
  var code=prompt("Enter the group code:");
  if(code===null)return;code=code.trim().toUpperCase();
  if(!code)return;
  if(myGroups.some(function(g){return g.code===code;})){alert("You're already in that group.");return;}
  fetch(EXEC_URL,{method:"POST",body:JSON.stringify({action:"joinGroup",rollNo:prefs.rollNo,code:code}),redirect:"follow"})
    .then(function(r){return r.json();})
    .then(function(d){
      if(d&&d.ok){refreshGroups();}
      else alert((d&&d.error)||"Could not join group.");
    }).catch(function(){alert("Server unreachable — try again.");});
}
var activeAddGroupCode = null;

function addMemberUI(code){
  activeAddGroupCode = code;
  var g = myGroups.find(function(x){return x.code===code;});
  var name = g ? g.name : "";
  
  document.getElementById("g-add-title").textContent = "Add member to group: " + name;
  document.getElementById("g-member-roll").value = "";
  document.getElementById("g-add-hint").textContent = "";
  var sugBox = document.getElementById("g-member-sug");
  if(sugBox) {
    sugBox.style.display = "none";
    sugBox.innerHTML = "";
  }
  
  var form = document.getElementById("g-add-form");
  if(form) {
    form.style.display = "block";
    form.scrollIntoView({behavior: "smooth", block: "nearest"});
  }
}

function closeAddMemberUI(){
  activeAddGroupCode = null;
  var form = document.getElementById("g-add-form");
  if(form) form.style.display = "none";
}

function onGroupMemberInput(){
  var v = document.getElementById("g-member-roll").value;
  renderSug("g-member-sug", v);
  var r = v.trim().toUpperCase(), hint = document.getElementById("g-add-hint");
  if(ROSTER[r]){
    hint.style.color = "var(--ok)";
    hint.textContent = "✓ " + ROSTER[r].n + " · Sec " + ROSTER[r].s;
  } else {
    hint.textContent = "";
  }
}

function saveGroupMember(){
  if(!activeAddGroupCode) return;
  var roll = document.getElementById("g-member-roll").value.trim().toUpperCase();
  var hint = document.getElementById("g-add-hint");
  if(!/^B25[0-9]{3}$/.test(roll)){
    hint.style.color = "var(--bad)";
    hint.textContent = "Enter a valid roll number (B25301–B25480).";
    return;
  }
  
  var name = (ROSTER[roll] && ROSTER[roll].n) || roll;
  hint.style.color = "var(--t2)";
  hint.textContent = "Adding " + name + "...";
  
  fetch(EXEC_URL,{method:"POST",body:JSON.stringify({action:"addGroupMember",rollNo:prefs.rollNo,code:activeAddGroupCode,member:roll}),redirect:"follow"})
    .then(function(r){return r.json();})
    .then(function(d){
      if(d&&d.ok){
        hint.style.color = "var(--ok)";
        hint.textContent = "Added successfully! ✓";
        refreshGroups();
        setTimeout(closeAddMemberUI, 1000);
      } else {
        hint.style.color = "var(--bad)";
        hint.textContent = (d && d.error) || "Could not add member.";
      }
    })
    .catch(function(){
      hint.style.color = "var(--bad)";
      hint.textContent = "Server unreachable — try again.";
    });
}
function leaveGroupUI(code){
  if(!confirm("Leave this group?"))return;
  fetch(EXEC_URL,{method:"POST",body:JSON.stringify({action:"leaveGroup",rollNo:prefs.rollNo,code:code}),redirect:"follow"})
    .then(function(r){return r.json();})
    .then(function(){refreshGroups();})
    .catch(function(){refreshGroups();});
}
function groupJoinLink(code){return EXEC_URL+"?join="+encodeURIComponent(code);}
function shareGroup(code){
  var g=myGroups.find(function(x){return x.code===code;}),name=g?g.name:"my group";
  var link=groupJoinLink(code);
  var txt="Join \\""+name+"\\" on the Term IV Command Centre — tap this link to be added instantly:\\n"+link;
  if(navigator.share){navigator.share({title:"Join "+name,text:txt,url:link}).catch(function(){});}
  else{try{navigator.clipboard.writeText(link);alert("Invite link copied to clipboard!\\n\\n"+txt);}catch(e){alert(txt);}}
}
/* Auto-join via a ?join=CODE invite link. Idempotent on the server (re-clicking
   an invite you're already in is a no-op), so it's safe to run on every launch.
   Runs only once the user has a roll number — for a brand-new visitor it fires
   right after onboarding/restore, since launch() is what calls it. */
function maybeAutoJoin(){
  if(!INITIAL_JOIN||!prefs.rollNo)return;
  var code=String(INITIAL_JOIN).trim().toUpperCase();
  INITIAL_JOIN=null;                                  // never double-fire in this session
  if(!code)return;
  fetch(EXEC_URL,{method:"POST",body:JSON.stringify({action:"joinGroup",rollNo:prefs.rollNo,code:code}),redirect:"follow"})
    .then(function(r){return r.json();})
    .then(function(d){
      if(d&&d.ok){
        refreshGroups();
        try{openF();}catch(e){}
        alert("You've joined \\""+(d.name||code)+"\\"! 🎉\\n\\nFind it under Friends → Groups.");
      } else {
        alert((d&&d.error)||("Could not join group "+code+"."));
      }
    }).catch(function(){alert("Server unreachable — open Friends → Join with code: "+code);});
}
function openGroupPlanner(code){
  window.open(EXEC_URL+"?group="+code,"_blank");
}

/* ── SHARE CARD ── */
function rrect(ctx,x,y,w,h,r){
  if(w<=0||h<=0)return;r=Math.min(r,w/2,h/2);
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath();
}
function generateShareCard(){
  var W=1080,H=608,canvas=document.createElement("canvas");
  canvas.width=W;canvas.height=H;
  var ctx=canvas.getContext("2d");
  var courses=prefs.courses.filter(function(c){return courseTotal(c)>0;}).slice(0,8);

  ctx.fillStyle="#0a0a0b";ctx.fillRect(0,0,W,H);
  ctx.fillStyle="rgba(255,255,255,.025)";
  for(var px=12;px<W;px+=24)for(var py=12;py<H;py+=24){ctx.beginPath();ctx.arc(px,py,1,0,Math.PI*2);ctx.fill();}

  var g=ctx.createLinearGradient(0,0,W*.65,0);
  g.addColorStop(0,"#d4f244");g.addColorStop(.45,"#7f77dd");g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=g;ctx.fillRect(0,0,W,3);

  ctx.fillStyle="#5a5754";ctx.font="500 12px monospace";
  ctx.fillText("XLRI DELHI NCR · PGDM-BM · TERM IV 2025–27",48,52);
  ctx.fillStyle="#f4f1ec";ctx.font="bold 38px sans-serif";
  ctx.fillText(prefs.rollNo||"—",48,102);
  ctx.fillStyle="#5a5754";ctx.font="500 14px monospace";
  ctx.fillText("Section "+prefs.section+" · "+courses.length+" courses · "+new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}),48,130);

  ctx.fillStyle="#18181b";ctx.fillRect(48,148,W-96,1);

  var rowH=46,startY=162,BX=200,BW=720,BH=7;
  courses.forEach(function(code,i){
    var st=attStats(code),pct=st.total?st.present/st.total:0,color=CCOLOR[code],y=startY+i*rowH;
    ctx.beginPath();ctx.arc(58,y+rowH/2,5,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
    ctx.fillStyle=color;ctx.font="600 13px monospace";ctx.fillText(code,74,y+rowH/2+4);
    ctx.fillStyle="#222226";rrect(ctx,BX,y+rowH/2-BH/2,BW,BH,BH/2);ctx.fill();
    if(pct>0){ctx.fillStyle=color;rrect(ctx,BX,y+rowH/2-BH/2,Math.max(BH,BW*pct),BH,BH/2);ctx.fill();}
    ctx.fillStyle=pct<0.75?"#f09595":"#5a5754";ctx.font="500 12px monospace";ctx.textAlign="right";
    ctx.fillText(Math.round(pct*100)+"% · "+st.present+"/"+st.total,W-48,y+rowH/2+4);ctx.textAlign="left";
  });

  ctx.fillStyle="#18181b";ctx.fillRect(48,H-72,W-96,1);
  ctx.fillStyle="#5a5754";ctx.font="500 11px monospace";ctx.fillText("term4 · xlri · command centre",48,H-40);
  ctx.fillStyle="#d4f244";ctx.font="600 11px monospace";ctx.textAlign="right";
  ctx.fillText("TERM IV COMMAND CENTRE",W-48,H-40);ctx.textAlign="left";

  canvas.toBlob(function(blob){
    var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="t4-attendance-"+todayStr()+".png";a.click();
  },"image/png");
}

/* ── NAV ── */
function nav(p,btn){
  document.querySelectorAll(".panel").forEach(function(x){x.classList.remove("on");});
  document.querySelectorAll("[data-p]").forEach(function(x){x.classList.remove("on");});
  document.getElementById("p-"+p).classList.add("on");
  document.querySelectorAll("[data-p='"+p+"']").forEach(function(x){x.classList.add("on");});
  window.scrollTo(0,0);
  if(p==="home")renderHomeAll();
  if(p==="week")renderWeek();
  if(p==="att")renderAtt();
  if(p==="leave")renderLeave();
  if(p==="prog")renderProg();
}

/* ── SETTINGS ── */
function buildS(){
  try {
    document.getElementById("ss-roll").value=prefs.rollNo||"";
    document.getElementById("ss-sec").innerHTML=["E","F"].map(function(s){
      return '<button class="secbtn '+((prefs.section||"")===s?"on":"")+'" data-s="'+s+'" onclick="ssSec(this)">Section '+s+'</button>';
    }).join("");
    var cs=prefs.courseSections||{},avail=Object.keys(META).sort();
    var userCourses = prefs.courses || [];
    document.getElementById("ss-cgrid").innerHTML=avail.map(function(c){
      return '<div class="ctog '+(userCourses.indexOf(c)>=0?"on":"")+'" data-ctog="'+c+'"><span class="cc">'+c+'</span><span class="cn">'+(META[c] ? META[c].name : "")+'</span>'+csecHTML(c,cs[c]||prefs.section)+'</div>';
    }).join("");
    document.querySelectorAll("#ss-cgrid .csec").forEach(function(w){if(cs[w.dataset.csec])w.dataset.pick="1";});
  } catch (e) {
    console.error("Error in buildS:", e);
  }
}
function ssSec(b){document.querySelectorAll("#ss-sec .secbtn").forEach(function(x){x.classList.remove("on");});b.classList.add("on");csecSyncDefaults("#ss-cgrid",b.dataset.s);}
function openS(){
  try { buildS(); } catch(e) { console.error("Error building settings:", e); }
  var overlay = document.getElementById("sov");
  if(overlay) overlay.classList.add("open");
}
function closeS(){var overlay=document.getElementById("sov");if(overlay)overlay.classList.remove("open");}
function openSheet(){var a=document.createElement("a");a.href=SHEET_URL;a.target="_blank";a.rel="noopener";document.body.appendChild(a);a.click();a.remove();}
/* ── SUBMIT IDEA → WhatsApp ── */
function openIdea(){
  try {
    var hint = document.getElementById("idea-hint");
    if(hint) hint.textContent="";
    var overlay = document.getElementById("idov");
    if(overlay) overlay.classList.add("open");
    setTimeout(function(){var t=document.getElementById("idea-text");if(t)t.focus();},60);
  } catch(e) {
    console.error("Error in openIdea:", e);
  }
}
function closeIdea(){var overlay=document.getElementById("idov");if(overlay)overlay.classList.remove("open");}
function submitIdea(){
  var txt=(document.getElementById("idea-text").value||"").trim(),hint=document.getElementById("idea-hint");
  if(!txt){hint.style.color="var(--bad)";hint.textContent="Please type your idea first.";return;}
  if(!/^[0-9]{8,15}$/.test(WA_NUMBER)){hint.style.color="var(--warn)";hint.textContent="WhatsApp number isn't set up yet — ask the admin.";return;}
  var msg="Hi Jai, Is it possible to add the following feature : "+txt+". Thank You";
  var a=document.createElement("a");a.href="https://wa.me/"+WA_NUMBER+"?text="+encodeURIComponent(msg);
  a.target="_blank";a.rel="noopener";document.body.appendChild(a);a.click();a.remove();
  document.getElementById("idea-text").value="";closeIdea();
}
/* ── MORE MENU ── */
function openMenu(){var ov=document.getElementById("menu-ov");if(ov)ov.classList.add("open");}
function closeMenu(){var ov=document.getElementById("menu-ov");if(ov)ov.classList.remove("open");}

/* ── SOLO TRIP PLANNER ── */
function openTripPlanner() {
  closeMenu();
  var ov = document.getElementById("trip-ov");
  if(ov) ov.classList.add("open");
  switchTripTab(1);
}
function closeTripPlanner() {
  var ov = document.getElementById("trip-ov");
  if(ov) ov.classList.remove("open");
}
function switchTripTab(n) {
  document.getElementById("trip-tab-btn-1").className = "secbtn" + (n===1?" on":"");
  document.getElementById("trip-tab-btn-2").className = "secbtn" + (n===2?" on":"");
  document.getElementById("trip-tab-1").style.display = n===1?"block":"none";
  document.getElementById("trip-tab-2").style.display = n===2?"block":"none";
  if(n===1) calcTripGaps();
  if(n===2) calcCustomTrip();
}
function getDailyCountMap() {
  var m = {};
  var ts = todayStr();
  var tm = todayMs();
  for(var d = tm; d <= TERM_END_MS; d += 864e5) {
    var dstr = new Date(d).toISOString().split("T")[0];
    if(dstr >= ts) m[dstr] = {c:0, ex:0};
  }
  mySessions().forEach(function(s){ if(m[s.date]) m[s.date].c++; });
  (Array.isArray(EXAMS)?EXAMS:[]).forEach(function(x){
    if(m[x.date] && (!x.code || prefs.courses.indexOf(x.code)>=0)) m[x.date].ex++;
  });
  return m;
}
function getMissedClassesStr(sDate, eDate) {
  var ms = mySessions().filter(function(s){ return s.date >= sDate && s.date <= eDate; });
  if(!ms.length) return "Clear schedule!";
  var byCode = {};
  ms.forEach(function(s){ byCode[s.code] = (byCode[s.code]||0)+1; });
  return Object.keys(byCode).map(function(c){ return c + " (" + byCode[c] + ")"; }).join(", ");
}
function calcTripGaps() {
  var m = getDailyCountMap();
  var days = Object.keys(m).sort();
  var html = "";
  var stretches = [];
  for(var i=0; i<days.length-2; i++) {
    var c1 = m[days[i]], c2 = m[days[i+1]], c3 = m[days[i+2]];
    if(!c1||!c2||!c3) continue;
    if(c1.ex===0 && c2.ex===0 && c3.ex===0) {
      if(c1.c + c2.c + c3.c <= 1) {
        var end = i+2;
        while(end+1 < days.length && m[days[end+1]] && m[days[end+1]].ex === 0 && m[days[end+1]].c === 0) end++;
        stretches.push({s: days[i], e: days[end], tc: c1.c+c2.c+c3.c, len: end-i+1});
        i = end;
      }
    }
  }
  if(!stretches.length) {
    html = '<div class="free">No long gaps found for the rest of the term 🌿</div>';
  } else {
    html = stretches.map(function(st){
      var d1 = new Date(st.s+"T00:00:00+05:30"), d2 = new Date(st.e+"T00:00:00+05:30");
      var d1s = DF[d1.getDay()]+", "+d1.getDate()+" "+MO[d1.getMonth()];
      var d2s = DF[d2.getDay()]+", "+d2.getDate()+" "+MO[d2.getMonth()];
      var miss = st.tc > 0 ? ('<span style="color:var(--warn);font-weight:600">Miss '+st.tc+' class'+(st.tc>1?'es':'')+'</span> <span style="color:var(--t2)">(' + getMissedClassesStr(st.s, st.e) + ')</span>') : '<span style="color:var(--good);font-weight:600">Clear schedule! 0 classes</span>';
      return '<div style="background:var(--s1);border:.5px solid var(--b2);border-radius:var(--r);padding:12px;margin-bottom:8px">' +
        '<div style="font-family:\\'Syne\\',sans-serif;font-weight:700;margin-bottom:4px">' + st.len + ' Days</div>' +
        '<div style="font-size:13px;color:var(--t1);margin-bottom:6px">' + d1s + ' — ' + d2s + '</div>' +
        '<div style="font-size:11px">' + miss + '</div>' +
      '</div>';
    }).join("");
  }
  var el = document.getElementById("trip-gaps-list");
  if(el) el.innerHTML = html;
}
function calcCustomTrip() {
  var dur = parseInt(document.getElementById("trip-dur").value)||3;
  var maxM = parseInt(document.getElementById("trip-max-miss").value)||0;
  if(dur<1) dur=1; if(maxM<0) maxM=0;
  var m = getDailyCountMap();
  var days = Object.keys(m).sort();
  var html = "";
  var valid = [];
  for(var i=0; i<=days.length-dur; i++) {
    var tc = 0, tex = 0, missingData = false;
    for(var j=0; j<dur; j++){
      if(!m[days[i+j]]) { missingData = true; break; }
      tc += m[days[i+j]].c;
      tex += m[days[i+j]].ex;
    }
    if(!missingData && tex === 0 && tc <= maxM) {
      valid.push({s: days[i], e: days[i+dur-1], tc: tc});
    }
  }
  if(!valid.length) {
    html = '<div class="free">No '+dur+'-day trips missing &le; '+maxM+' classes 🌿</div>';
  } else {
    html = valid.map(function(st){
      var d1 = new Date(st.s+"T00:00:00+05:30"), d2 = new Date(st.e+"T00:00:00+05:30");
      var d1s = DF[d1.getDay()]+", "+d1.getDate()+" "+MO[d1.getMonth()];
      var d2s = (dur===1) ? "" : " — " + DF[d2.getDay()]+", "+d2.getDate()+" "+MO[d2.getMonth()];
      var miss = st.tc > 0 ? ('<span style="color:var(--warn);font-weight:600">Miss '+st.tc+' class'+(st.tc>1?'es':'')+'</span> <span style="color:var(--t2)">(' + getMissedClassesStr(st.s, st.e) + ')</span>') : '<span style="color:var(--good);font-weight:600">Clear schedule! 0 classes</span>';
      return '<div style="background:var(--s1);border:.5px solid var(--b2);border-radius:var(--r);padding:12px;margin-bottom:8px">' +
        '<div style="font-size:13px;font-weight:600;margin-bottom:4px">' + d1s + d2s + '</div>' +
        '<div style="font-size:11px">' + miss + '</div>' +
      '</div>';
    }).join("");
  }
  var el = document.getElementById("trip-custom-list");
  if(el) el.innerHTML = html;
}

function applyS(){
  var sec=document.querySelector("#ss-sec .secbtn.on");if(!sec)return;
  var cs=document.querySelectorAll("#ss-cgrid .ctog.on"),courses=[];
  cs.forEach(function(el){courses.push(el.dataset.ctog);});
  if(!courses.length)return;
  
  var nr=document.getElementById("ss-roll").value.trim().toUpperCase();
  var validRoll = /^B25[0-9]{3}$/.test(nr);
  
  if(validRoll && nr !== prefs.rollNo) {
    var msg = "You are changing your roll number from " + prefs.rollNo + " to " + nr + ".\\n\\n"
      + "This will switch accounts and load " + nr + "'s saved schedule and attendance. Your current local data will be replaced.\\n\\n"
      + "Do you want to switch accounts?";
    if(!confirm(msg)) {
      document.getElementById("ss-roll").value = prefs.rollNo;
      return;
    }
    
    attendance = {};
    plannedLeave = {};
    myGroups = [];
    friends = [];
    localStorage.removeItem("t4_att");
    localStorage.removeItem("t4_leave");
    localStorage.removeItem("t4_my_groups");
    localStorage.removeItem("t4_friends");
  }
  
  var oldRoll = prefs.rollNo;
  prefs={rollNo:validRoll?nr:prefs.rollNo,section:sec.dataset.s,courses:courses,courseSections:readCS("#ss-cgrid",sec.dataset.s),groups:prefs.groups||[]};
  saveP();closeS();
  
  if(validRoll && nr !== oldRoll) {
    saveA();
    saveL();
    saveFriends();
    flushQueue().then(syncFetch);
    restoreFriendsList();
    refreshGroups();
  }
  
  document.getElementById("top-badge").textContent="Sec "+prefs.section;
  var sb=document.getElementById("sb-badge");if(sb)sb.textContent="Sec "+prefs.section;
  var active=document.querySelector(".panel.on");
  if(active){
    var p=active.id.replace("p-","");
    if(p==="home")renderHomeAll();else if(p==="week")renderWeek();
    else if(p==="att")renderAtt();else if(p==="leave")renderLeave();else if(p==="prog")renderProg();
  }
} 
function exportData(){
  var b=new Blob([JSON.stringify({prefs:prefs,attendance:attendance,plannedLeave:plannedLeave,friends:friends,exported:new Date().toISOString()},null,2)],{type:"application/json"});
  var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="term4-backup-"+todayStr()+".json";a.click();
}
function importData(e){
  var f=e.target.files[0];if(!f)return;
  var r=new FileReader();r.onload=function(){
    try{
      var d=JSON.parse(r.result);
      if(d.prefs)prefs=d.prefs;if(d.attendance)attendance=d.attendance;
      if(prefs&&!prefs.courseSections)prefs.courseSections={};
      if(prefs&&!prefs.groups)prefs.groups=[];
      if(d.plannedLeave)plannedLeave=d.plannedLeave;if(d.friends)friends=d.friends;
      saveP();saveA();saveL();saveFriends();
      document.getElementById("top-badge").textContent="Sec "+prefs.section;
      closeS();renderHomeAll();alert("Backup restored ✓");
    }catch(err){alert("Invalid backup file");}
  };r.readAsText(f);
}
function resetAll(){if(confirm("Erase all data? Cannot be undone.")){localStorage.clear();location.hash="";location.reload();}}

/* ── SYNC + OFFLINE WRITE QUEUE ──
   Every write (attendance mark, prefs change) is attempted immediately.
   If it fails (offline, GAS lock timeout, rate limit), it's queued in
   localStorage and retried on: next launch, tab refocus, manual refresh,
   and after any later successful write. Latest-write-wins de-dup keeps
   the queue small. This guarantees a mark eventually reaches the sheet.
*/
var pendingQ=[],isRefreshing=false,lastAutoSync=0;
function loadQ(){try{pendingQ=JSON.parse(localStorage.getItem("t4_pending")||"[]");}catch(e){pendingQ=[];}}
function saveQ(){try{localStorage.setItem("t4_pending",JSON.stringify(pendingQ));}catch(e){}}
function enqueue(body){
  // de-dup: a 'set' for a given skey supersedes older sets for the same skey;
  // a 'setPrefs' supersedes older setPrefs.
  pendingQ=pendingQ.filter(function(b){
    if(body.action==="set"&&b.action==="set")return b.skey!==body.skey;
    if(body.action==="setPrefs"&&b.action==="setPrefs")return false;
    if(body.action==="setStatus"&&b.action==="setStatus")return false;
    if(body.action==="setFriends"&&b.action==="setFriends")return false;
    return true;
  });
  pendingQ.push(body);saveQ();updateSyncPill();
}
function postWrite(body){
  return fetch(EXEC_URL,{method:"POST",body:JSON.stringify(body),redirect:"follow"})
    .then(function(r){return r.json();})
    .then(function(d){if(!d||!d.ok)throw new Error(d&&d.error||"server error");return true;});
}
function flushQueue(){
  if(!pendingQ.length||!prefs.rollNo)return Promise.resolve();
  var batch=pendingQ.slice();
  // process sequentially so we don't hammer the single GAS deployment
  return batch.reduce(function(chain,body){
    return chain.then(function(){
      return postWrite(body).then(function(){
        pendingQ=pendingQ.filter(function(b){return b!==body;});saveQ();
      }).catch(function(){/* leave in queue, stop trying this round */throw "stop";});
    });
  },Promise.resolve()).catch(function(){}).then(function(){updateSyncPill();});
}

function updateSyncPill(){
  var el=document.getElementById("synced");if(!el)return;
  var t=new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
  var pend=pendingQ.length;
  var dot=pend?'<span class="dot" style="background:var(--warn)"></span>':'<span class="dot"></span>';
  var txt=pend?('saved locally · '+pend+' pending sync'):('live · synced '+t);
  el.innerHTML=dot+txt+'<button class="refresh-inline" onclick="refreshNow()">refresh</button>';
  var ss=document.getElementById("sb-sync");if(ss)ss.textContent=pend?(pend+" pending sync"):("synced "+t);
}

function syncFetch(){
  var el=document.getElementById("synced");
  if(el)el.innerHTML='<span class="sync-indicator"></span>syncing...';
  return fetch(EXEC_URL,{method:"POST",body:JSON.stringify({action:"get",rollNo:prefs.rollNo}),redirect:"follow"})
  .then(function(r){return r.json();})
  .then(function(d){
    if(d.ok&&d.data){
      // Sheet is source of truth, BUT never clobber a mark still waiting in the queue.
      var queuedKeys={};pendingQ.forEach(function(b){if(b.action==="set")queuedKeys[b.skey]=1;});
      Object.keys(d.data).forEach(function(k){if(queuedKeys[k])return;if(d.data[k])attendance[k]=d.data[k];else delete attendance[k];});
      // also drop locally-removed marks the sheet no longer has (unless queued)
      Object.keys(attendance).forEach(function(k){if(!d.data[k]&&!queuedKeys[k])delete attendance[k];});
      saveA();
      var active=document.querySelector(".panel.on");
      if(active){var p=active.id.replace("p-","");if(p==="home")renderHomeAll();else if(p==="att")renderAtt();else if(p==="prog")renderProg();else if(p==="leave")renderLeave();}
    }
    updateSyncPill();
  }).catch(function(){
    if(el)el.innerHTML='<span class="dot" style="background:var(--warn)"></span>offline – saved locally'+(pendingQ.length?' · '+pendingQ.length+' pending':'')+'<button class="refresh-inline" onclick="refreshNow()">retry</button>';
  });
}

function refreshNow(){
  if(isRefreshing||!prefs.rollNo)return;
  isRefreshing=true;
  ["refresh-btn","refresh-btn-sb"].forEach(function(id){var b=document.getElementById(id);if(b)b.classList.add("spinning");});
  Promise.all([
    flushQueue().then(syncFetch),
    refreshFriends(),
    refreshGroups()
  ]).then(function(){
    lastAutoSync=Date.now();
  }).catch(function(){}).then(function(){
    isRefreshing=false;
    ["refresh-btn","refresh-btn-sb"].forEach(function(id){var b=document.getElementById(id);if(b)b.classList.remove("spinning");});
  });
}

function syncMark(k,status,src){
  var body={action:"set",rollNo:prefs.rollNo,userSection:prefs.section,skey:k,status:status,src:src||"manual"};
  postWrite(body).then(function(){flushQueue();}).catch(function(){enqueue(body);});
}
function syncSavePrefs(){
  if(!prefs.rollNo)return;
  var body={action:"setPrefs",rollNo:prefs.rollNo,section:prefs.section,courses:prefs.courses,courseSections:prefs.courseSections||{},groups:prefs.groups||[]};
  postWrite(body).then(function(){flushQueue();}).catch(function(){enqueue(body);});
}
/* Friends LIST (names + rolls only) is saved to the sheet under your roll,
   so it comes back on Restore / a new device. Schedules are re-fetched live. */
function syncFriendsList(){
  if(!prefs.rollNo)return;
  var activeFriends = Array.isArray(friends) ? friends.filter(Boolean) : [];
  var slim=activeFriends.map(function(f){return {id:f.id,name:f.name,rollNo:f.rollNo};});
  enqueue({action:"setFriends",rollNo:prefs.rollNo,friends:slim}); flushQueue();
}
function restoreFriendsList(){
  if(!prefs.rollNo)return Promise.resolve();
  return fetch(EXEC_URL,{method:"POST",body:JSON.stringify({action:"getFriends",rollNo:prefs.rollNo}),redirect:"follow"})
    .then(function(r){return r.json();})
    .then(function(d){
      var addedRolls = [];
      if(d&&d.ok&&d.data&&d.data.length){
        var activeFriends = Array.isArray(friends) ? friends.filter(Boolean) : [];
        var seen={};activeFriends.forEach(function(f){if(f&&f.rollNo)seen[f.rollNo]=1;});
        d.data.forEach(function(cf){
          if(cf && cf.rollNo && !seen[cf.rollNo]){
            if(!Array.isArray(friends)) friends = [];
            friends.push({id:cf.id||Date.now().toString()+cf.rollNo,name:cf.name||cf.rollNo,rollNo:cf.rollNo,pending:true});
            seen[cf.rollNo]=1;
            addedRolls.push(cf.rollNo);
          }
        });
        if(addedRolls.length){
          saveFriends();
        }
      }
      if(addedRolls.length){
        return fetchFriendPrefs(addedRolls);
      }
    }).catch(function(){});
}

/* Auto re-sync when the tab regains focus (cross-device + manual sheet edits),
   throttled to once per 30s so it isn't chatty. */
document.addEventListener("visibilitychange",function(){
  if(document.visibilityState==="visible"&&prefs.rollNo&&Date.now()-lastAutoSync>30000){
    lastAutoSync=Date.now();flushQueue().then(syncFetch);
  }
});
window.addEventListener("online",function(){if(prefs.rollNo)flushQueue().then(syncFetch);});

/* ── TIMELINE ── (past rows are tappable: mark/change attendance for ANY older class) */
var tlCode=null,tlDay=null;
function chrono(a,b){return a.date<b.date?-1:a.date>b.date?1:(a.sh*60+a.sm)-(b.sh*60+b.sm);} // true date+time order
function attBtnsHTML(k,st){
  return '<div class="att-actions"><button class="att-btn present '+(st==="present"?"on":"")+'" data-k="'+k+'" data-st="present">P</button>'
        +'<button class="att-btn absent '+(st==="absent"?"on":"")+'" data-k="'+k+'" data-st="absent">A</button></div>';
}
function showTimeline(code){
  tlCode=code;tlDay=null;
  var ss=mySessions().filter(function(s){return s.code===code;});
  var ex=(Array.isArray(EXAMS)?EXAMS:[]).filter(function(x){return x.code===code;});
  var all=ss.concat(ex).sort(chrono),ts=todayStr();
  document.getElementById("tl-title").textContent=code+" – "+META[code].name;
  document.getElementById("tl-body").innerHTML=all.map(function(s){
    var isEx=!!s.type;
    var k=isEx?s.id:skey(s),st=attendance[k],isPast=s.date<=ts,d=new Date(s.date+"T00:00:00+05:30");
    var dl=d.getDate()+" "+MO[d.getMonth()]+" ("+DS[d.getDay()]+")";
    var dot=isPast?(st==="present"?"var(--okd)":st==="absent"?"var(--badd)":"var(--t3)"):"var(--s3)";
    if(isEx && st!=="present") dot = isPast ? "var(--t3)" : "var(--s3)";
    var right=isPast?attBtnsHTML(k,st):'<span class="tl-st upcoming">Upcoming</span>';
    var calBtn='<button class="sc-cal" style="margin-left:0;margin-right:6px" onclick="event.stopPropagation();'+(isEx?'addExamCal(\\''+k+'\\')':'addClassCal(\\''+k+'\\')')+'">＋</button>';
    var sn=isEx?(s.type==="AOL Exam"?"AOL":s.type):"S"+s.n;
    var snStyle=isEx?"width:auto;min-width:32px;color:var(--bad)":"";
    return '<div class="tl-row"><span class="tl-dot" style="background:'+dot+'"></span><span class="tl-sn" style="'+snStyle+'">'+sn+'</span><span class="tl-date">'+dl+'</span><span class="tl-slot">'+s.slot+'</span>'+calBtn+right+'</div>';
  }).join("");
  document.getElementById("tlsheet").classList.add("open");
}
/* Day detail (opened from the heatmap): all of one day's classes, in time order, markable. */
function showDay(ds){
  tlCode=null;tlDay=ds;
  var d=new Date(ds+"T00:00:00+05:30"),ss=byDate(ds),ts=todayStr();
  var ex=(Array.isArray(EXAMS)?EXAMS:[]).filter(function(x){
    return x.date===ds && (!x.code || prefs.courses.indexOf(x.code)>=0);
  });
  var all=ss.concat(ex).sort(chrono);
  document.getElementById("tl-title").textContent=DF[d.getDay()]+", "+d.getDate()+" "+MO[d.getMonth()];
  document.getElementById("tl-body").innerHTML=all.length?all.map(function(s){
    var isEx=!!s.type;
    var k=isEx?s.id:skey(s),st=attendance[k],isPast=s.date<=ts;
    var dot=isPast?(st==="present"?"var(--okd)":st==="absent"?"var(--badd)":"var(--t3)"):"var(--s3)";
    if(isEx && st!=="present") dot = isPast ? "var(--t3)" : "var(--s3)";
    var right=isPast?attBtnsHTML(k,st):'<span class="tl-st upcoming">Upcoming</span>';
    var calBtn='<button class="sc-cal" style="margin-left:0;margin-right:6px" onclick="event.stopPropagation();'+(isEx?'addExamCal(\\''+k+'\\')':'addClassCal(\\''+k+'\\')')+'">＋</button>';
    var sn=isEx?(s.code?s.code:s.type):s.code;
    var snStyle=isEx?"width:auto;min-width:32px;color:var(--bad)":"color:"+(CCOLOR[s.code]||"#888");
    var lbl=isEx?s.text:(META[s.code]?META[s.code].name:s.code);
    return '<div class="tl-row"><span class="tl-dot" style="background:'+dot+'"></span><span class="tl-sn" style="'+snStyle+'">'+sn+'</span><span class="tl-date">'+lbl+'</span><span class="tl-slot">'+s.slot+'</span>'+calBtn+right+'</div>';
  }).join(""):'<div class="free">No classes 🌿</div>';
  document.getElementById("tlsheet").classList.add("open");
}
function refreshOpenTL(){
  var tl=document.getElementById("tlsheet");
  if(!tl||!tl.classList.contains("open"))return;
  var tb=document.getElementById("tl-body"),sc=tb?tb.scrollTop:0;
  if(tlDay)showDay(tlDay);else if(tlCode)showTimeline(tlCode);
  var tb2=document.getElementById("tl-body");if(tb2)tb2.scrollTop=sc;
}
function closeTL(){document.getElementById("tlsheet").classList.remove("open");tlDay=null;tlCode=null;}

/* ── EVENTS ── */
document.addEventListener("click",function(e){
  var t=e.target;
  if(t.closest && !t.closest(".sug-wrap")) {
    var boxes = document.querySelectorAll(".sug-box");
    for (var i = 0; i < boxes.length; i++) {
      if (boxes[i].style.display !== "none") {
        boxes[i].style.display = "none";
        boxes[i].innerHTML = "";
      }
    }
  }
  if(t.classList.contains("att-btn")&&t.dataset.k){mark(t.dataset.k,t.dataset.st);}
  else if(t.classList.contains("lp-chip")&&t.dataset.lk){togLeave(t.dataset.lk);}
  else if(t.classList.contains("lp-toggle")&&t.dataset.daytog){togDay(t.dataset.daytog);}
  else if(t.classList.contains("tl-btn")&&t.dataset.tl){showTimeline(t.dataset.tl);}
  else if(t.classList.contains("ann-x")&&t.dataset.ann){dismissAnn(t.dataset.ann);}
  else if(t.classList.contains("f-del")&&t.dataset.fid){deleteFriend(t.dataset.fid);}
  else if(t.dataset&&t.dataset.hmmode){setHmMode(t.dataset.hmmode);}
  else if(t.closest&&t.closest("[data-hmday]")){showDay(t.closest("[data-hmday]").dataset.hmday);}
  else if(t.dataset&&t.dataset.nudge){showDay(t.dataset.nudge);}
  else if(t.closest&&t.closest(".sug-item")){
    var it=t.closest(".sug-item"),box=it.parentNode,roll=it.dataset.roll,nm=it.dataset.name;
    if(box.id==="f-roll-sug"){document.getElementById("f-roll").value=roll;var nf=document.getElementById("f-name");if(nf&&!nf.value)nf.value=nm;onFriendRollInput();}
    else if(box.id==="f-search-sug"){document.getElementById("f-search").value=roll;searchRoll();}
    else if(box.id==="ob-restore-sug"){
      document.getElementById("ob-restore-roll").value=roll;
      box.style.display="none";box.innerHTML="";
      doRestore();
      return;
    }
    else if(box.id==="ob-roll-sug"){
      document.getElementById("ob-roll").value=roll;
      var sec=ROSTER[roll]?ROSTER[roll].s:"";
      if(sec){
        var btn=document.querySelector('#onboard .secbtn[data-s="'+sec+'"]');
        if(btn)obSec(btn);
      }
      obReady();
    }
    else if(box.id==="g-member-sug"){
      document.getElementById("g-member-roll").value=roll;
      onGroupMemberInput();
    }
    box.style.display="none";box.innerHTML="";
  }
  else if(t.closest&&t.closest("[data-gtog]")){
    var gc=t.closest("[data-gtog]").dataset.gtog,card=document.getElementById("gc-"+gc),body=document.getElementById("gbody-"+gc);
    if(body){var show=body.style.display==="none";body.style.display=show?"block":"none";if(card)card.classList.toggle("open",show);}
  }
  else{
    var ct=t.closest?t.closest(".ctog[data-ctog]"):null;if(ct){ct.classList.toggle("on");return;}
  }
});

/* ── GROUP TRIP PLANNER CODE ── */
var plannerGroup = null;
var plannerPrefs = {};

function showGroupPlanner(code) {
  document.getElementById("onboard").style.display = "none";
  var shell = document.getElementById("shell");
  if(shell) shell.style.display = "none";
  
  var gp = document.getElementById("group-planner");
  if(gp) gp.style.display = "block";
  
  document.getElementById("gp-loading").style.display = "flex";
  document.getElementById("gp-content").style.display = "none";
  document.getElementById("gp-error").style.display = "none";
  
  fetchGroupPlannerData(code);
}

function fetchGroupPlannerData(code) {
  var refreshBtn = document.getElementById("gp-refresh-btn");
  if(refreshBtn) refreshBtn.classList.add("spinning");
  
  fetch(EXEC_URL, {
    method: "POST",
    body: JSON.stringify({action: "getGroups", codes: [code]}),
    redirect: "follow"
  })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    if(refreshBtn) refreshBtn.classList.remove("spinning");
    if(d && d.ok && d.data && d.data.groups && d.data.groups.length) {
      plannerGroup = d.data.groups[0];
      plannerPrefs = d.data.prefs || {};
      renderGroupPlanner();
    } else {
      showGroupPlannerError("Group not found or error loading group data.");
    }
  })
  .catch(function(err) {
    if(refreshBtn) refreshBtn.classList.remove("spinning");
    showGroupPlannerError("Failed to connect to the server: " + String(err));
  });
}

function showGroupPlannerError(msg) {
  document.getElementById("gp-loading").style.display = "none";
  document.getElementById("gp-content").style.display = "block";
  var errBox = document.getElementById("gp-error");
  errBox.style.display = "block";
  errBox.textContent = msg;
}

function refreshGroupPlanner() {
  if(plannerGroup && plannerGroup.code) {
    fetchGroupPlannerData(plannerGroup.code);
  } else if(INITIAL_GROUP) {
    fetchGroupPlannerData(INITIAL_GROUP);
  }
}

function renderGroupPlanner() {
  document.getElementById("gp-loading").style.display = "none";
  document.getElementById("gp-content").style.display = "block";
  
  document.getElementById("gp-group-name").textContent = plannerGroup.name;
  var names = plannerGroup.members.map(function(m) {
    var roll = String(m).toUpperCase();
    return (ROSTER[roll] && ROSTER[roll].n) || roll;
  }).join(", ");
  document.getElementById("gp-group-meta").textContent = plannerGroup.members.length + " members: " + names + " · Code: " + plannerGroup.code;
  
  renderGroupHeatmap();
  renderGroupInsights();
  inspectGpDay(todayStr());
}

function getGpMemberSessions(pref, ds) {
  if(!pref || !pref.section || !pref.courses) return [];
  return SESSIONS.filter(function(s){
    if(s.date !== ds) return false;
    if(pref.courses.indexOf(s.code) < 0) return false;
    if(s.section === "BOTH") return true;
    var want = (pref.courseSections && pref.courseSections[s.code]) || pref.section;
    return s.section === want;
  });
}

function renderGroupHeatmap() {
  var ts = todayStr();
  var mos = [{y:2026,m:5,n:"Jun"}, {y:2026,m:6,n:"Jul"}, {y:2026,m:7,n:"Aug"}];
  
  var months = mos.map(function(mo) {
    var first = new Date(mo.y, mo.m, 1);
    var last = new Date(mo.y, mo.m + 1, 0);
    var dow = (first.getDay() + 6) % 7;
    var cells = "";
    
    for(var i=0; i<dow; i++) {
      cells += '<span class="hm-cell hm-empty"></span>';
    }
    
    for(var d=1; d<=last.getDate(); d++) {
      var date = mo.y + "-" + pad(mo.m + 1) + "-" + pad(d);
      var inTerm = date >= "2026-06-15" && date <= "2026-08-31";
      var dayOfWeek = new Date(date + "T00:00:00+05:30").getDay();
      
      var cls = "hm-off";
      var title = d + " " + MO[mo.m];
      
      if(inTerm) {
        var totalClasses = 0;
        plannerGroup.members.forEach(function(m) {
          var p = plannerPrefs[String(m).toUpperCase()];
          totalClasses += getGpMemberSessions(p, date).length;
        });
        var avgLoad = totalClasses / plannerGroup.members.length;
        
        if(totalClasses === 0) {
          cls = "gp-teal-free";
          title += " · 100% Free! 🌴";
        } else if(avgLoad <= 1.0) {
          cls = "gp-lime-low";
          title += " · Low load (avg " + avgLoad.toFixed(1) + ")";
        } else if(avgLoad <= 2.0) {
          cls = "gp-yellow-med";
          title += " · Medium load (avg " + avgLoad.toFixed(1) + ")";
        } else {
          cls = "gp-red-heavy";
          title += " · Heavy load (avg " + avgLoad.toFixed(1) + ")";
        }
      }
      
      var click = inTerm ? ' onclick="inspectGpDay(\\\'' + date + '\\\')"' : '';
      var todayCls = date === ts ? " hm-today" : "";
      cells += '<span class="hm-cell ' + cls + todayCls + '" data-date="' + date + '"' + click + ' title="' + title + '" style="cursor:pointer;"></span>';
    }
    
    return '<div class="hm-month"><div class="hm-mlabel">' + mo.n + '</div>'
      + '<div class="hm-dow"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>'
      + '<div class="hm-grid">' + cells + '</div></div>';
  }).join("");
  
  document.getElementById("gp-heatmap-months").innerHTML = months;
}

function inspectGpDay(date) {
  var inspector = document.getElementById("gp-inspector-content");
  var dateTitle = document.getElementById("gp-inspector-date");
  if(!inspector) return;
  
  var d = new Date(date + "T00:00:00+05:30");
  if(isNaN(d.getTime())) {
    inspector.innerHTML = '<div class="free" style="padding:40px 10px;">Select a day on the heatmap to check availability.</div>';
    dateTitle.textContent = "Select a day";
    return;
  }
  
  dateTitle.textContent = DF[d.getDay()] + ", " + d.getDate() + " " + MO[d.getMonth()];
  
  var slotData = SLOTS.map(function(slot) {
    var time = slot[0];
    var sh = slot[1];
    var sm = slot[2];
    var busyUsers = [];
    var freeUsers = [];
    
    plannerGroup.members.forEach(function(m) {
      var roll = String(m).toUpperCase();
      var p = plannerPrefs[roll];
      var sessions = getGpMemberSessions(p, date);
      var isBusy = sessions.some(function(s) {
        return s.sh === sh && s.sm === sm;
      });
      
      var name = (ROSTER[roll] && ROSTER[roll].n) || roll;
      if(isBusy) {
        var sess = sessions.find(function(s) { return s.sh === sh && s.sm === sm; });
        busyUsers.push({roll: roll, name: name, code: sess.code});
      } else {
        freeUsers.push({roll: roll, name: name});
      }
    });
    
    return {
      time: time,
      busy: busyUsers,
      free: freeUsers,
      allFree: busyUsers.length === 0
    };
  });
  
  var commonFree = slotData.filter(function(s) { return s.allFree; }).map(function(s) { return s.time; });
  var commonFreeHTML = "";
  if(commonFree.length > 0) {
    commonFreeHTML = '<div style="background:rgba(46,196,182,0.12);border:.5px solid rgba(46,196,182,0.3);color:#2ec4b6;padding:10px 12px;border-radius:8px;font-size:11px;margin-bottom:16px;">'
      + '🌟 <b>Common Free Slots:</b> ' + commonFree.join(", ") + '</div>';
  } else {
    commonFreeHTML = '<div style="background:var(--s2);border:.5px solid var(--b2);color:var(--t2);padding:10px 12px;border-radius:8px;font-size:11px;margin-bottom:16px;">'
      + '⚠️ No slots today where <i>everyone</i> is free simultaneously.</div>';
  }
  
  var rowsHTML = slotData.map(function(s) {
    var isCommon = s.allFree ? ' <span style="font-size:8px;background:rgba(46,196,182,0.15);color:#2ec4b6;border-radius:12px;padding:1px 5px;margin-left:4px;">Free</span>' : '';
    
    var dots = plannerGroup.members.map(function(m) {
      var roll = String(m).toUpperCase();
      var b = s.busy.find(function(u) { return u.roll === roll; });
      var f = s.free.find(function(u) { return u.roll === roll; });
      
      if(b) {
        return '<span class="gp-user-dot busy" title="' + b.name + ' (' + b.roll + ') busy in ' + b.code + '">' + b.name.split(" ")[0] + ' (' + b.code + ')</span>';
      } else {
        return '<span class="gp-user-dot free" title="' + f.name + ' (' + f.roll + ') is free">' + f.name.split(" ")[0] + '</span>';
      }
    }).join("");
    
    return '<div class="gp-slot-row">'
      + '<div class="gp-slot-time"><b>' + s.time + '</b>' + isCommon + '</div>'
      + '<div class="gp-slot-status">' + dots + '</div>'
      + '</div>';
  }).join("");
  
  inspector.innerHTML = commonFreeHTML + '<div style="display:flex;flex-direction:column;gap:4px;">' + rowsHTML + '</div>';
  
  document.querySelectorAll("#gp-heatmap-months .hm-cell").forEach(function(cell) {
    cell.style.outline = "none";
    cell.style.outlineOffset = "0px";
  });
  var selectedCell = document.getElementById("gp-heatmap-months").querySelector('.hm-cell[onclick*="' + date + '"]');
  if(selectedCell) {
    selectedCell.style.outline = "2px solid var(--acc)";
    selectedCell.style.outlineOffset = "1px";
  }
}

var gpTripLen = 3;

function changeGpTripLen(k) {
  gpTripLen = k;
  document.querySelectorAll(".dur-btn").forEach(function(btn) {
    btn.classList.toggle("active", parseInt(btn.dataset.len, 10) === k);
  });
  renderGroupInsights();
}

function highlightGpHeatmapRange(startDate, endDate) {
  document.querySelectorAll("#gp-heatmap-months .hm-cell").forEach(function(cell) {
    cell.style.outline = "none";
    cell.style.outlineOffset = "0px";
    cell.style.boxShadow = "none";
  });
  document.querySelectorAll("#gp-heatmap-months .hm-cell").forEach(function(cell) {
    var d = cell.dataset.date;
    if (d && d >= startDate && d <= endDate) {
      cell.style.outline = "2px solid var(--acc)";
      cell.style.outlineOffset = "1px";
      cell.style.boxShadow = "0 0 8px var(--acc)";
    }
  });
}

function toggleGpInsightDetail(card, startDate, endDate) {
  var detail = card.querySelector(".gp-insight-detail");
  if (detail) {
    var show = detail.style.display === "none";
    detail.style.display = show ? "block" : "none";
  }
  highlightGpHeatmapRange(startDate, endDate);
}

function stdDev(arr) {
  var n = arr.length;
  if (n <= 1) return 0;
  var mean = arr.reduce(function(a, b) { return a + b; }, 0) / n;
  var variance = arr.reduce(function(a, b) { return a + Math.pow(b - mean, 2); }, 0) / n;
  return Math.sqrt(variance);
}

function getVulnerability(buffer) {
  if (buffer <= 0) return 1000;
  if (buffer === 1) return 10;
  if (buffer === 2) return 3;
  return 1;
}

function renderGroupInsights() {
  var insightsEl = document.getElementById("gp-insights");
  if(!insightsEl) return;
  
  var start = new Date("2026-06-15T00:00:00+05:30");
  var end = new Date("2026-08-31T00:00:00+05:30");
  var days = [];
  
  for(var d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    var dateStr = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    
    var totalClasses = 0;
    plannerGroup.members.forEach(function(m) {
      var p = plannerPrefs[String(m).toUpperCase()];
      totalClasses += getGpMemberSessions(p, dateStr).length;
    });
    
    days.push({
      date: dateStr,
      totalClasses: totalClasses,
      dateObj: new Date(d)
    });
  }
  
  var k = gpTripLen;
  var candidates = [];
  
  for (var i = 0; i <= days.length - k; i++) {
    var windowDays = days.slice(i, i + k);
    var hasIllegalMember = false;
    var totalClassesMissed = 0;
    var individualPenalties = [];
    
    plannerGroup.members.forEach(function(m) {
      var roll = String(m).toUpperCase();
      var p = plannerPrefs[roll];
      if (!p) {
        individualPenalties.push(0);
        return;
      }
      
      var missedCount = {};
      windowDays.forEach(function(wd) {
        var daySessions = getGpMemberSessions(p, wd.date);
        daySessions.forEach(function(s) {
          missedCount[s.code] = (missedCount[s.code] || 0) + 1;
          totalClassesMissed++;
        });
      });
      
      var p_u = 0;
      p.courses.forEach(function(c) {
        var missed = missedCount[c] || 0;
        if (missed > 0) {
          var initialAbsent = (roll === prefs.rollNo) ? attStats(c).absent : 0;
          var finalBuffer = 4 - (initialAbsent + missed);
          if (finalBuffer < 0) hasIllegalMember = true;
          p_u += missed * getVulnerability(finalBuffer);
        }
      });
      
      individualPenalties.push(p_u);
    });
    
    var maxPenalty = Math.max.apply(null, individualPenalties);
    var std = stdDev(individualPenalties);
    var jointPenalty = maxPenalty + 0.5 * std;
    
    var freeDays = windowDays.filter(function(wd) { return wd.totalClasses === 0; }).length;
    var LR = freeDays / k;
    
    var score = jointPenalty - 2.0 * LR;
    if (hasIllegalMember) score = 9999;
    
    candidates.push({
      windowDays: windowDays,
      score: score,
      totalClassesMissed: totalClassesMissed,
      LR: LR,
      hasIllegalMember: hasIllegalMember,
      individualPenalties: individualPenalties
    });
  }
  
  candidates.sort(function(a, b) {
    return a.score - b.score;
  });
  
  var topCandidates = candidates.filter(function(c) { return !c.hasIllegalMember; }).slice(0, 4);
  if (topCandidates.length === 0) {
    insightsEl.innerHTML = '<div style="color:var(--t3);padding:10px 0;">No feasible trip options found for ' + k + ' days (all options cause attendance limits to be breached for some members).</div>';
    return;
  }
  
  insightsEl.innerHTML = topCandidates.map(function(c) {
    var stretch = c.windowDays;
    var sDate = stretch[0].dateObj;
    var eDate = stretch[stretch.length - 1].dateObj;
    var dateRangeStr = sDate.getDate() + " " + MO[sDate.getMonth()] + " – " + eDate.getDate() + " " + MO[eDate.getMonth()];
    var avgLoad = c.totalClassesMissed / plannerGroup.members.length;
    
    var badgeText = "";
    var badgeStyle = "";
    if (c.score <= 0) {
      badgeText = "🌴 Perfect";
      badgeStyle = "background:rgba(46,196,182,0.15);color:#2ec4b6;";
    } else if (c.score < 3) {
      badgeText = "Feasible";
      badgeStyle = "background:rgba(212,242,68,0.15);color:#b3d600;";
    } else {
      badgeText = "Caution";
      badgeStyle = "background:rgba(240,184,74,0.15);color:var(--warn);";
    }
    
    var memberDetailsHTML = plannerGroup.members.map(function(m) {
      var roll = String(m).toUpperCase();
      var p = plannerPrefs[roll];
      var name = ROSTER[roll] ? ROSTER[roll].n : roll;
      if (!p) return '<div>👤 <b>' + name + '</b>: No setup loaded</div>';
      
      var missedClasses = {};
      var totalMissed = 0;
      stretch.forEach(function(wd) {
        getGpMemberSessions(p, wd.date).forEach(function(s) {
          missedClasses[s.code] = (missedClasses[s.code] || 0) + 1;
          totalMissed++;
        });
      });
      
      var coursesText = [];
      for (var code in missedClasses) {
        var missed = missedClasses[code];
        var initialAbsent = (roll === prefs.rollNo) ? attStats(code).absent : 0;
        var finalBuffer = 4 - (initialAbsent + missed);
        var bufferClass = finalBuffer <= 1 ? 'color:var(--bad);font-weight:bold;' : (finalBuffer === 2 ? 'color:var(--warn);' : 'color:var(--ok);');
        coursesText.push(code + ': <b>' + missed + '</b> missed (<span style="' + bufferClass + '">' + finalBuffer + ' buffer left</span>)');
      }
      
      var detailStr = totalMissed === 0 
        ? '<span style="color:var(--ok);">0 classes missed</span>' 
        : coursesText.join(", ");
        
      return '<div style="margin-bottom:4px;font-size:10px;color:var(--t2);">'
        + '👤 <b>' + name + '</b>: ' + detailStr
        + '</div>';
    }).join("");
    
    return '<div class="gp-insight-card" onclick="toggleGpInsightDetail(this, \\\'' + stretch[0].date + '\\\', \\\'' + stretch[stretch.length - 1].date + '\\\')">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">'
      + '<b style="color:var(--ok);">' + dateRangeStr + '</b>'
      + '<span style="font-size:10px;border-radius:12px;padding:2px 8px;font-weight:600;' + badgeStyle + '">' + badgeText + '</span>'
      + '</div>'
      + '<div style="display:flex;gap:6px;margin:6px 0;flex-wrap:wrap;">'
      + '<span style="font-size:9px;background:rgba(46,196,182,0.1);color:#2ec4b6;padding:2px 6px;border-radius:4px;">' + (c.LR * 100).toFixed(0) + '% Free Days</span>'
      + '<span style="font-size:9px;background:rgba(255,255,255,0.05);color:var(--t2);padding:2px 6px;border-radius:4px;">Avg ' + avgLoad.toFixed(1) + ' missed classes</span>'
      + '</div>'
      + '<div class="gp-insight-detail" style="display:none;margin-top:10px;padding-top:10px;border-top:.5px solid var(--b1);">'
      + memberDetailsHTML
      + '</div>'
      + '</div>';
  }).join("");
}
function showInfoModal(type, ev) {
  if (ev) ev.stopPropagation();
  var title = "";
  var body = "";
  if (type === 'bunk') {
    title = "ℹ️ Bunk-o-Meter Guide";
    body = "<p>The <b>Bunk-o-Meter</b> calculates your remaining safety cushion before you exceed the attendance limit (maximum of 4 allowed absences per course).</p>"
      + "<p style='margin-top:8px;'>• <b>Skips Left</b>: Displays the lowest cushion among all your enrolled courses.</p>"
      + "<p style='margin-top:8px;'>• <b>Slider Color</b>:"
      + "<br>&nbsp;&nbsp;- <span style='color:var(--ok);font-weight:bold;'>Green (Safe)</span>: 2 or more skips remaining in all courses."
      + "<br>&nbsp;&nbsp;- <span style='color:var(--warn);font-weight:bold;'>Orange (Warning)</span>: Exactly 1 skip remaining in at least one course."
      + "<br>&nbsp;&nbsp;- <span style='color:var(--bad);font-weight:bold;'>Red (Danger)</span>: 0 skips remaining (limit reached) or exceeded.</p>";
  } else if (type === 'trip') {
    title = "ℹ️ Smart Trip Planner Guide";
    body = "<p>The <b>Group Trip Planner</b> finds the best travel windows of your selected length (3, 4, 5, or 9 days) by analyzing group class load and leveraging weekends/holidays.</p>"
      + "<p style='margin-top:8px;'><b>Explainable Score Badges</b>:</p>"
      + "<p style='margin-top:4px;'>• <span style='color:var(--ok);font-weight:bold;'>🌴 Perfect</span>: Nobody in the group misses a single class.</p>"
      + "<p style='margin-top:4px;'>• <span style='color:#b3d600;font-weight:bold;'>Feasible</span>: Members miss classes, but everyone's attendance buffer remains safe (2+ skips left).</p>"
      + "<p style='margin-top:4px;'>• <span style='color:var(--warn);font-weight:bold;'>Caution</span>: Safe to travel, but eats up buffer (leaves someone with only 1 skip left).</p>"
      + "<p style='margin-top:8px;'><b>Automatic Pruning</b>: Any trip that would cause even <i>one</i> member to drop below 0 skips (violating the attendance limit) is automatically filtered out as Critical/Illegal.</p>"
      + "<p style='margin-top:8px;'><i>Tip: Click on a trip card to view exact classes missed and buffers for each member, and highlight the range on the heatmap.</i></p>";
  }
  document.getElementById("info-modal-title").textContent = title;
  document.getElementById("info-modal-body").innerHTML = body;
  var m = document.getElementById("info-modal");
  if(m) m.classList.add("open");
}
function closeInfoModal() {
  var m = document.getElementById("info-modal");
  if(m) m.classList.remove("open");
}

/* ── INSTALL APP CODE ── */
function showInstallModal(){
  var im = document.getElementById("imov");
  if(im) im.classList.add("open");
}
function closeInstallModal(){
  var im = document.getElementById("imov");
  if(im) im.classList.remove("open");
}
function dismissInstallHint(){
  var hint = document.getElementById("gp-install-hint");
  if(hint) hint.style.display = "none";
  try{ localStorage.setItem("t4_install_dismissed", "1"); }catch(e){}
}
function setInstTab(platform){
  var tabs = ["safari", "chrome"];
  tabs.forEach(function(p){
    var tab = document.getElementById("itab-" + p);
    var content = document.getElementById("inst-content-" + p);
    if(p === platform){
      if(tab) tab.classList.add("on");
      if(content) content.style.display = "block";
    } else {
      if(tab) tab.classList.remove("on");
      if(content) content.style.display = "none";
    }
  });
}
var activeOnboardInput = null;

function trackOnboardFocus(input) {
  activeOnboardInput = input;
  document.getElementById("ob-numpad").style.display = "block";
}

function handleNumpadPress(val) {
  if (!activeOnboardInput) return;
  var input = activeOnboardInput;
  var startVal = input.value;
  
  if (val === 'back') {
    input.value = startVal.slice(0, -1);
  } else if (val === 'B25') {
    if (!input.value.startsWith('B')) {
      input.value = 'B25' + input.value;
    }
  } else {
    input.value = startVal + val;
  }
  
  var current = input.value.trim();
  if (/^\\d/.test(current)) {
    if (current.length <= 3) {
      input.value = 'B25' + current;
    } else if (current.length === 5) {
      input.value = 'B' + current;
    }
  }
  
  if (input.id === "ob-restore-roll") {
    renderSug('ob-restore-sug', input.value);
  } else if (input.id === "ob-roll") {
    obReady();
    renderSug('ob-roll-sug', input.value);
  }
}

document.addEventListener("click", function(e) {
  var pad = document.getElementById("ob-numpad");
  if (!pad) return;
  var isInput = e.target.classList.contains("ob-input") || e.target.id === "ob-roll" || e.target.id === "ob-restore-roll";
  var isPad = e.target.closest("#ob-numpad") || e.target.classList.contains("np-btn");
  if (!isInput && !isPad) {
    pad.style.display = "none";
  }
});

/* ── INIT ── */
// iOS Safari wipes the sandboxed-iframe localStorage between launches, so a
// ?roll=B25xxx link (preserved by a bookmark / Home-Screen icon) lets us restore
// the saved setup from the sheet with zero typing.
function autoRestoreByRoll(roll){
  roll=String(roll||"").trim().toUpperCase();
  var ob=document.getElementById("onboard");
  if(!/^B25[0-9]{3}$/.test(roll)){if(ob)ob.style.display="flex";return;}
  fetch(EXEC_URL,{method:"POST",body:JSON.stringify({action:"getPrefs",rollNo:roll}),redirect:"follow"})
    .then(function(r){return r.json();})
    .then(function(d){
      if(d&&d.ok&&d.data&&d.data.section&&d.data.courses&&d.data.courses.length){
        prefs={rollNo:roll,section:d.data.section,courses:d.data.courses,courseSections:d.data.courseSections||{},groups:d.data.groups||[]};
        saveP();loadAll();launch();
      } else {
        if(ob)ob.style.display="flex";
        var inp=document.getElementById("ob-roll");if(inp){inp.value=roll;obReady();}     // prefill so they don't retype
      }
    }).catch(function(){ if(ob)ob.style.display="flex"; });
}
/* ── iOS "stay signed in" ──
   iOS wipes the iframe's localStorage, so we steer iPhone users onto a personal
   ?roll= URL: tapping "Fix it" rewrites the top-frame URL (allowed under the tap's
   user-activation) so a bookmark / Home-Screen icon captures it and restores them
   forever. Hidden once they're already on a ?roll= link or after they dismiss it. */
function isIOS(){return /iP(hone|od|ad)/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&'ontouchend' in document);}
function personalLink(){return EXEC_URL+"?roll="+encodeURIComponent(prefs.rollNo||"");}
function renderIosPin(){
  var el=document.getElementById("h-ios");if(!el)return;
  var done=false;try{done=localStorage.getItem("t4_ios_pinned")==="1";}catch(e){}
  if(!isIOS()||!prefs.rollNo||INITIAL_ROLL||done){el.innerHTML="";return;}
  el.innerHTML='<div class="install-hint"><div class="ih-ico">📌</div>'
    +'<div class="ih-body"><div class="ih-t">iPhone: stay signed in</div>'
    +'<div class="ih-s">One tap so you never retype your roll number.</div></div>'
    +'<button class="ih-cta" onclick="iosStaySignedIn()">Fix it</button>'
    +'<button class="ih-x" onclick="dismissIosPin()">✕</button></div>';
}
function dismissIosPin(){try{localStorage.setItem("t4_ios_pinned","1");}catch(e){}var el=document.getElementById("h-ios");if(el)el.innerHTML="";}
function iosStaySignedIn(){
  var link=personalLink();
  try{navigator.clipboard.writeText(link);}catch(e){}
  try{window.top.location.href=link;}catch(e){}              // user-gesture top nav → bookmark/icon now carries ?roll
  setTimeout(function(){                                      // only runs if the nav was blocked
    showInstallModal();
    alert("Your personal link is copied:\\n\\n"+link+"\\n\\nOpen it once, then Add to Home Screen — it'll remember you.");
  },1000);
}
/* ── SHARE MY TIMETABLE ── */
function shareMyTimetable(){
  if(!prefs.rollNo){showToast("Set your roll number first (Settings).");return;}
  var link=EXEC_URL+"?view="+encodeURIComponent(prefs.rollNo);
  if(navigator.share){
    navigator.share({title:(ROSTER[prefs.rollNo]?ROSTER[prefs.rollNo].n+" · ":"")+"Term IV Timetable",url:link}).catch(function(){});
    return;
  }
  var copied=false;
  try{
    navigator.clipboard.writeText(link).then(function(){showToast("Link copied — send it to anyone!");});
    copied=true;
  }catch(e){}
  if(!copied){
    var ta=document.createElement("textarea");ta.value=link;ta.style.cssText="position:fixed;opacity:0;left:-9999px";
    document.body.appendChild(ta);ta.focus();ta.select();
    try{document.execCommand("copy");showToast("Link copied — send it to anyone!");}catch(e){alert("Your timetable link:\\n\\n"+link);}
    document.body.removeChild(ta);
  }
}

/* ── VIEW MODE (read-only, for ?view=B25xxx links) ── */
var vmWkOff=0;
function loadViewMode(roll){
  roll=String(roll||"").trim().toUpperCase();
  if(!/^B25[0-9]{3}$/.test(roll)){
    // Fall back to normal onboarding if roll is invalid
    document.getElementById("onboard").style.display="flex";
    return;
  }
  document.getElementById("onboard").style.display="none";
  var vmDiv=document.getElementById("view-mode");
  if(vmDiv)vmDiv.style.display="block";
  var lnk=document.getElementById("vm-setup-link");if(lnk)lnk.href=EXEC_URL;
  var cta=document.getElementById("vm-cta-link");if(cta)cta.href=EXEC_URL;
  fetch(EXEC_URL,{method:"POST",body:JSON.stringify({action:"getPrefs",rollNo:roll}),redirect:"follow"})
    .then(function(r){return r.json();})
    .then(function(d){
      if(d&&d.ok&&d.data&&d.data.section&&d.data.courses&&d.data.courses.length){
        prefs={rollNo:roll,section:d.data.section,courses:d.data.courses,courseSections:d.data.courseSections||{},groups:[]};
        loadAll();
        renderViewMode();
      } else {
        document.getElementById("vm-loading").style.display="none";
        var err=document.getElementById("vm-error");
        if(err){err.style.display="block";err.textContent=roll+" hasn't set up their timetable yet. Tap 'Set up yours →' above.";}
      }
    })
    .catch(function(){
      document.getElementById("vm-loading").style.display="none";
      var err=document.getElementById("vm-error");
      if(err){err.style.display="block";err.textContent="Could not load timetable — check your connection and refresh.";}
    });
}
function renderViewMode(){
  document.getElementById("vm-loading").style.display="none";
  document.getElementById("vm-content").style.display="block";
  var name=(ROSTER[prefs.rollNo]&&ROSTER[prefs.rollNo].n)||prefs.rollNo;
  var nameEl=document.getElementById("vm-name");if(nameEl)nameEl.textContent=name;
  var badgeEl=document.getElementById("vm-badge");if(badgeEl)badgeEl.textContent="Sec "+prefs.section;
  try{document.title=name+"'s Timetable · Term IV";}catch(e){}
  // Next-up banner (read-only)
  var now=Date.now(),my=mySessions();
  var up=my.filter(function(s){return sessionMs(s)+90*6e4>now;}).sort(function(a,b){return sessionMs(a)-sessionMs(b);});
  var nb=document.getElementById("vm-next-banner");
  if(nb&&up.length){
    var n=up[0],nd=new Date(n.date+"T00:00:00+05:30"),ts=todayStr(),tm=todayMs();
    var isOngoing=now>=sessionMs(n)&&now<=sessionMs(n)+90*6e4;
    var when=n.date===ts?"today":(nd.getTime()===tm+864e5?"tomorrow":DS[nd.getDay()]+" "+nd.getDate()+" "+MO[nd.getMonth()]);
    var label=isOngoing?'<span class="pulse-live"></span>Ongoing now':'Next up';
    nb.innerHTML='<div class="nbanner" style="--cc:'+CCOLOR[n.code]+';margin-bottom:14px"><span class="nb-dot"></span><div><div class="nb-l">'+label+'</div><div class="nb-c">'+META[n.code].name+'</div><div class="nb-t">S'+n.n+' · '+n.slot+' · '+when+'</div></div><div class="nb-p">S'+n.n+'/'+courseTotal(n.code)+'</div></div>';
  } else if(nb){nb.innerHTML="";}
  // Today / Tomorrow
  var today=todayMs();
  document.getElementById("vm-today").innerHTML=renderDay(today,"Today",false);
  document.getElementById("vm-tomorrow").innerHTML=renderDay(today+864e5,"Tomorrow",false);
  // Exams
  var exEl=document.getElementById("vm-exams");
  if(exEl&&Array.isArray(EXAMS)&&EXAMS.length){
    var ts2=todayStr(),tm2=todayMs();
    var upExams=EXAMS.filter(function(x){return x.date>=ts2;}).slice(0,4).map(function(x){
      var d=new Date(x.date+"T00:00:00+05:30"),days=Math.round((d.getTime()-tm2)/864e5);
      var badge=x.type==="Quiz"?"quiz":x.type==="Mid-Term"?"mid":"end";
      var when=DF[d.getDay()]+", "+d.getDate()+" "+MO[d.getMonth()]+" · "+x.slot;
      var cd=days<=0?"Today":days===1?"1 day":days+" days";
      return '<div class="exam-row"><span class="exam-badge '+badge+'">'+x.type+'</span>'
        +'<div class="exam-body"><div class="exam-text">'+x.text+'</div><div class="exam-when">'+when+'</div></div>'
        +'<div class="exam-cd'+(days<=1?" imminent":days<=3?" soon":"")+'"><b>'+cd+'</b></div></div>';
    }).join("");
    if(upExams)exEl.innerHTML='<div class="exam-wrap" style="margin-top:0"><div class="exam-head"><span class="exam-title">📌 Upcoming Assessments</span></div>'+upExams+'</div>';
    else exEl.innerHTML="";
  } else if(exEl){exEl.innerHTML="";}
  renderViewWeek();
}
function renderViewWeek(){
  var base=new Date(todayMs()),mon=new Date(base);
  mon.setDate(base.getDate()-((base.getDay()+6)%7)+vmWkOff*7);
  var days=[];for(var i=0;i<7;i++){var d2=new Date(mon);d2.setDate(mon.getDate()+i);days.push(d2);}
  var wkl=document.getElementById("vm-wkl");if(wkl)wkl.textContent=mon.getDate()+" "+MO[mon.getMonth()]+" – "+days[6].getDate()+" "+MO[days[6].getMonth()];
  var pw=document.getElementById("vm-pw");if(pw)pw.disabled=vmWkOff<=-2;
  var nw=document.getElementById("vm-nw");if(nw)nw.disabled=vmWkOff>=12;
  var grid=document.getElementById("vm-wkgrid");if(!grid)return;
  grid.innerHTML=days.map(function(d2){
    var ds=dstr(d2),isT=ds===todayStr(),ss=byDate(ds),heavy=ss.length>=3;
    var chips=ss.map(function(s){return '<span class="wchip" style="color:'+CCOLOR[s.code]+'">'+s.code+'<span class="wct">'+s.slot+'</span></span>';}).join("");
    return '<div class="wd'+(isT?" today":"")+(heavy?" heavy":"")+'"><div class="wd-top"><div class="wd-d">'+DS[d2.getDay()]+'</div><div class="wd-n">'+d2.getDate()+'</div></div><div class="wd-chips">'+(chips||'<span class="wd-empty">—</span>')+'</div></div>';
  }).join("");
}
function shiftVmWk(d){vmWkOff+=d;renderViewWeek();}
function switchVmTab(tab,btn){
  document.querySelectorAll("[data-vmtab]").forEach(function(b){b.classList.remove("on");});
  if(btn)btn.classList.add("on");
  document.getElementById("vm-today-pane").style.display=tab==="week"?"none":"block";
  document.getElementById("vm-week-pane").style.display=tab==="week"?"block":"none";
}

// UX: Lock background scroll when an overlay is open
var scrollObs = new MutationObserver(function() {
  var anyOpen = document.querySelector('.ovl-bg.open');
  if(anyOpen) document.body.classList.add('no-scroll');
  else document.body.classList.remove('no-scroll');
});
document.querySelectorAll('.ovl-bg').forEach(function(el){
  scrollObs.observe(el, {attributes:true, attributeFilter:['class']});
});

if(INITIAL_VIEW){
  loadViewMode(INITIAL_VIEW);
} else {
  buildOb();
  if(load()){loadAll();launch();}
  else if(INITIAL_ROLL){autoRestoreByRoll(INITIAL_ROLL);}
  else{var ckRoll=readCookie("t4_roll");if(ckRoll){autoRestoreByRoll(ckRoll);}else document.getElementById("onboard").style.display="flex";}
}
</script>
</body>
</html>`;