import WebSocket from 'ws';

const BASE_HTTP = 'http://localhost:3100';
const WS_URL = 'ws://localhost:3100/ws';

async function rpcCall(method, params = {}) {
  const res = await fetch(`${BASE_HTTP}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Math.floor(Math.random() * 10000),
      method,
      params
    })
  });
  return { status: res.status, body: await res.json() };
}

async function runMcpSuite() {
  console.log('================================================================');
  console.log('🤖 XL-FLOW MCP SERVER (PORT 3100) PROTOCOL & TOOL SUITE 🤖');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(cond, name, details = '') {
    total++;
    if (cond) {
      passed++;
      console.log(`  ✅ [PASS] ${name}`);
      if (details) console.log(`     ↳ ${details}`);
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      if (details) console.error(`     ↳ ${details}`);
      throw new Error(`Assertion failed: ${name}`);
    }
  }

  // 1. GET /health
  console.log('--- 1. Health & Server Info Endpoint ---');
  const healthRes = await fetch(`${BASE_HTTP}/health`);
  assert(healthRes.status === 200, 'GET /health returns HTTP 200');
  const healthData = await healthRes.json();
  assert(healthData.status === 'online', 'MCP status is "online"');
  assert(healthData.protocol?.includes('Model Context Protocol'), 'MCP protocol declared');
  assert(Array.isArray(healthData.tools), 'Health returns tool list array');
  assert(healthData.tools.length >= 8, `Tool catalog contains ${healthData.tools.length} registered tools`);
  assert(healthData.tools.includes('get_campus_presence'), 'Catalog includes get_campus_presence');
  assert(healthData.tools.includes('find_mutual_free_slots'), 'Catalog includes find_mutual_free_slots');

  // 2. GET /sse Transport Negotiation
  console.log('\n--- 2. SSE Transport Protocol Handshake ---');
  const sseController = new AbortController();
  const sseTimeout = setTimeout(() => sseController.abort(), 3000);
  try {
    const sseRes = await fetch(`${BASE_HTTP}/sse`, {
      signal: sseController.signal,
      headers: { 'Accept': 'text/event-stream' }
    });
    assert(sseRes.status === 200, 'GET /sse returns HTTP 200');
    assert(sseRes.headers.get('content-type')?.includes('text/event-stream'), 'SSE Content-Type is text/event-stream');
    
    // Read initial chunk to verify endpoint event
    const reader = sseRes.body.getReader();
    const { value } = await reader.read();
    const chunkStr = new TextDecoder().decode(value);
    assert(chunkStr.includes('event: endpoint'), 'SSE sends initial "endpoint" event');
    assert(chunkStr.includes('/messages?sessionId='), 'SSE endpoint announces message routing URL');
    reader.cancel();
  } finally {
    clearTimeout(sseTimeout);
  }

  // 3. JSON-RPC Protocol: initialize
  console.log('\n--- 3. JSON-RPC Handshake: initialize ---');
  const initRes = await rpcCall('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'E2E-Verification-Agent', version: '1.0.0' }
  });
  assert(initRes.status === 200, 'POST /messages (initialize) returns HTTP 200');
  assert(initRes.body?.result?.serverInfo?.name === 'xlflow-academic-mcp', 'serverInfo reports xlflow-academic-mcp');
  assert(initRes.body?.result?.capabilities?.tools !== undefined, 'capabilities exposes tools');

  // 4. JSON-RPC Protocol: tools/list
  console.log('\n--- 4. JSON-RPC Catalog: tools/list ---');
  const listRes = await rpcCall('tools/list');
  assert(listRes.status === 200, 'POST /messages (tools/list) returns HTTP 200');
  const toolList = listRes.body?.result?.tools || [];
  const toolNames = toolList.map(t => t.name);
  console.log(`     Catalog: ${toolNames.join(', ')}`);
  
  assert(toolNames.includes('get_campus_presence'), 'Tool catalog contains get_campus_presence');
  assert(toolNames.includes('find_mutual_free_slots'), 'Tool catalog contains find_mutual_free_slots');
  assert(toolNames.includes('get_student_schedule'), 'Tool catalog contains get_student_schedule');
  assert(toolNames.includes('get_attendance_safety'), 'Tool catalog contains get_attendance_safety');
  assert(toolNames.includes('simulate_bunk_impact'), 'Tool catalog contains simulate_bunk_impact');
  assert(toolNames.includes('search_batch_roster'), 'Tool catalog contains search_batch_roster');
  assert(toolNames.includes('find_natural_getaways'), 'Tool catalog contains find_natural_getaways');
  assert(toolNames.includes('trigger_browser_action'), 'Tool catalog contains trigger_browser_action');

  // 5. Tool Call: get_campus_presence
  console.log('\n--- 5. Tool Call: get_campus_presence ---');
  const presenceRes = await rpcCall('tools/call', {
    name: 'get_campus_presence',
    arguments: { zone: 'all' }
  });
  assert(presenceRes.status === 200, 'tools/call get_campus_presence returns HTTP 200');
  const presenceContent = JSON.parse(presenceRes.body.result.content[0].text);
  assert(typeof presenceContent.totalActive === 'number', 'Presence reports totalActive count');
  assert(presenceContent.countsByZone !== undefined, 'Presence reports countsByZone mapping', `Active Beacons: ${presenceContent.totalActive}`);

  // Also test zone-specific filter
  const nescafePresence = await rpcCall('tools/call', {
    name: 'get_campus_presence',
    arguments: { zone: 'nescafe' }
  });
  const nescafeContent = JSON.parse(nescafePresence.body.result.content[0].text);
  assert(nescafeContent.zone === 'nescafe', 'Filtered presence returns requested zone');
  assert(Array.isArray(nescafeContent.students), 'Filtered presence returns students list');

  // 6. Tool Call: find_mutual_free_slots
  console.log('\n--- 6. Tool Call: find_mutual_free_slots ---');
  const mutualRes = await rpcCall('tools/call', {
    name: 'find_mutual_free_slots',
    arguments: { rollNos: ['B25349', 'B25308'] }
  });
  assert(mutualRes.status === 200, 'tools/call find_mutual_free_slots returns HTTP 200');
  const mutualContent = JSON.parse(mutualRes.body.result.content[0].text);
  assert(Array.isArray(mutualContent.rolls), 'Rolls array returned');
  assert(typeof mutualContent.mutualFreeSlots === 'number', 'mutualFreeSlots count returned');
  assert(mutualContent.mutualFreeSlots > 0, `Found ${mutualContent.mutualFreeSlots} mutual free slots between B25349 and B25308`);

  // 7. Tool Call: get_student_schedule
  console.log('\n--- 7. Tool Call: get_student_schedule ---');
  const schedRes = await rpcCall('tools/call', {
    name: 'get_student_schedule',
    arguments: { courseCode: 'OMCR' }
  });
  assert(schedRes.status === 200, 'tools/call get_student_schedule returns HTTP 200');
  const schedContent = JSON.parse(schedRes.body.result.content[0].text);
  assert(schedContent.student?.id === 'B25349' || schedContent.student?.rollNo === 'B25349', 'Identifies student ID B25349');
  assert(schedContent.count > 0, `Retrieved ${schedContent.count} sessions for OMCR`);

  // 8. Tool Call: get_attendance_safety
  console.log('\n--- 8. Tool Call: get_attendance_safety ---');
  const attendRes = await rpcCall('tools/call', {
    name: 'get_attendance_safety',
    arguments: { courseCode: 'OMCR' }
  });
  assert(attendRes.status === 200, 'tools/call get_attendance_safety returns HTTP 200');
  const attendContent = JSON.parse(attendRes.body.result.content[0].text);
  assert(attendContent.code === 'OMCR', 'Course code matches OMCR');
  assert(typeof attendContent.currentPercentage === 'number', 'Attendance percentage computed');
  assert(typeof attendContent.safeBunks === 'number', 'Safe bunks computed', `Percentage: ${attendContent.currentPercentage}%, Tier: ${attendContent.tier}`);

  // 9. Tool Call: simulate_bunk_impact
  console.log('\n--- 9. Tool Call: simulate_bunk_impact ---');
  const simRes = await rpcCall('tools/call', {
    name: 'simulate_bunk_impact',
    arguments: { courseCode: 'OMCR', skips: 2, attends: 0 }
  });
  assert(simRes.status === 200, 'tools/call simulate_bunk_impact returns HTTP 200');
  const simContent = JSON.parse(simRes.body.result.content[0].text);
  assert(simContent.course === 'OMCR', 'Simulated course is OMCR');
  assert(typeof simContent.projectedPercentage === 'number', 'Projected percentage returned');
  assert(simContent.recommendation !== undefined, 'Actionable recommendation generated', `Projected %: ${simContent.projectedPercentage}% (${simContent.status})`);

  // 10. Tool Call: search_batch_roster
  console.log('\n--- 10. Tool Call: search_batch_roster ---');
  const rosterRes = await rpcCall('tools/call', {
    name: 'search_batch_roster',
    arguments: { query: 'B25349' }
  });
  assert(rosterRes.status === 200, 'tools/call search_batch_roster returns HTTP 200');
  const rosterContent = JSON.parse(rosterRes.body.result.content[0].text);
  assert(rosterContent.matchCount >= 1, 'Roster match count >= 1');
  assert(rosterContent.results[0]?.roll === 'B25349', 'Roster correctly found student B25349 (Janmejai Singh)', `Name: ${rosterContent.results[0]?.name}, Section: ${rosterContent.results[0]?.section}`);

  // 11. Tool Call: find_natural_getaways
  console.log('\n--- 11. Tool Call: find_natural_getaways ---');
  const getawaysRes = await rpcCall('tools/call', {
    name: 'find_natural_getaways',
    arguments: { minDays: 3, maxBunksAllowed: 1 }
  });
  assert(getawaysRes.status === 200, 'tools/call find_natural_getaways returns HTTP 200');
  const getawaysContent = JSON.parse(getawaysRes.body.result.content[0].text);
  assert(Array.isArray(getawaysContent.topOpportunities), 'Opportunities array returned');
  assert(getawaysContent.topOpportunities.length > 0, `Identified ${getawaysContent.topOpportunities.length} getaway opportunities`);

  // 12. Tool Call: trigger_browser_action
  console.log('\n--- 12. Tool Call: trigger_browser_action ---');
  const actionRes = await rpcCall('tools/call', {
    name: 'trigger_browser_action',
    arguments: { action: 'NAVIGATE_TAB', tab: 'trips' }
  });
  assert(actionRes.status === 200, 'tools/call trigger_browser_action returns HTTP 200');
  const actionContent = JSON.parse(actionRes.body.result.content[0].text);
  assert(actionContent.success === true, 'Browser action dispatch indicates success');
  assert(actionContent.action === 'NAVIGATE_TAB', 'Action executed is NAVIGATE_TAB');

  // 13. JSON-RPC Protocol: resources/list
  console.log('\n--- 13. JSON-RPC Protocol: resources/list ---');
  const resList = await rpcCall('resources/list');
  assert(resList.status === 200, 'POST /messages (resources/list) returns HTTP 200');
  const resources = resList.body?.result?.resources || [];
  assert(resources.length >= 2, `MCP exposes ${resources.length} academic resources`);

  // 14. Live WebSocket Bridge: ws://localhost:3100/ws
  console.log('\n--- 14. Live WebSocket Bridge: ws://localhost:3100/ws ---');
  let wsConnected = false;
  const ws = new WebSocket(WS_URL);

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('MCP WS connection timeout')), 3000);
    ws.on('open', () => {
      wsConnected = true;
      // Send a snapshot update
      ws.send(JSON.stringify({
        type: 'SNAPSHOT_UPDATE',
        payload: { activeTab: 'radar', testAgent: true }
      }));
      clearTimeout(timer);
      resolve();
    });
    ws.on('error', reject);
  });

  assert(wsConnected, 'WebSocket bridge connected successfully on ws://localhost:3100/ws');
  ws.close();

  console.log('\n================================================================');
  console.log(`🎉 MCP SERVER RESULTS: ${passed}/${total} PASSED (100%)`);
  console.log('================================================================\n');
}

runMcpSuite().catch(err => {
  console.error('Fatal MCP suite error:', err);
  process.exit(1);
});
