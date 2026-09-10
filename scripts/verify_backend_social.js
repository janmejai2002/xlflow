import WebSocket from 'ws';

const BASE_HTTP = 'http://localhost:3101';
const BASE_WS = 'ws://localhost:3101/ws/social';

async function request(method, path, body = null) {
  const url = `${BASE_HTTP}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  let data;
  try {
    data = await res.json();
  } catch (err) {
    data = await res.text();
  }
  return { status: res.status, data };
}

async function runSocialSuite() {
  console.log('================================================================');
  console.log('⚡ XL-FLOW SOCIAL SERVER (PORT 3101) INTEGRATION TEST SUITE ⚡');
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
  console.log('--- 1. Health Check Endpoint ---');
  const healthRes = await request('GET', '/health');
  assert(healthRes.status === 200, 'GET /health returns HTTP 200');
  assert(healthRes.data?.ok === true, 'GET /health reports ok: true');
  assert(healthRes.data?.status === 'online', 'GET /health status is online');
  assert(healthRes.data?.port === 3101 || healthRes.data?.port === '3101', 'GET /health reports port 3101', `Active Beacons: ${healthRes.data?.activeBeacons}, Active Users: ${healthRes.data?.activeUsers}`);

  // 2. GET /api/social/whos-where
  console.log('\n--- 2. Campus Radar Endpoint (GET /api/social/whos-where) ---');
  const radarRes = await request('GET', '/api/social/whos-where');
  assert(radarRes.status === 200, 'GET /api/social/whos-where returns HTTP 200');
  assert(radarRes.data?.ok === true, 'Radar response has ok: true');
  assert(typeof radarRes.data?.zoneCounts === 'object', 'Radar contains zoneCounts object');
  assert(Array.isArray(radarRes.data?.allStatuses), 'Radar contains allStatuses array');
  assert(radarRes.data?.zones && typeof radarRes.data.zones === 'object', 'Radar contains zones mapping', `Total beacons: ${radarRes.data?.zoneCounts?.total}, Nescafe: ${radarRes.data?.zoneCounts?.nescafe}`);

  // 3. WebSocket Connection & Broadcast Verification
  console.log('\n--- 3. WebSocket Protocol & Live Event Broadcast ---');
  let wsConnected = false;
  let receivedBroadcast = null;
  let pongReceived = false;

  const ws = new WebSocket(`${BASE_WS}?roll=B25349`);
  
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('WS connection timeout')), 3000);
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'PING' }));
    });
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'CONNECTED') {
        wsConnected = true;
      } else if (msg.type === 'PONG') {
        pongReceived = true;
        clearTimeout(timer);
        resolve();
      } else if (msg.type === 'STATUS_UPDATED') {
        receivedBroadcast = msg;
      }
    });
  });

  assert(wsConnected, 'WebSocket connection established with roll=B25349');
  assert(pongReceived, 'WebSocket responds to PING with PONG');

  // 4. POST /api/social/status
  console.log('\n--- 4. Set Status Beacon (POST /api/social/status) ---');
  const beaconPayload = {
    rollNo: 'B25349',
    name: 'Janmejai Singh',
    section: 'E',
    emoji: '📍',
    text: 'Command Deck Verification at Nescafe',
    zone: 'nescafe',
    durationMins: 45
  };
  const postStatusRes = await request('POST', '/api/social/status', beaconPayload);
  assert(postStatusRes.status === 200, 'POST /api/social/status returns HTTP 200');
  assert(postStatusRes.data?.ok === true, 'Status response ok: true');
  assert(postStatusRes.data?.status?.rollNo === 'B25349', 'Status rollNo recorded as B25349');
  assert(postStatusRes.data?.status?.zone === 'nescafe', 'Status zone set to nescafe');
  assert(postStatusRes.data?.status?.expiresAt !== undefined, 'Status has calculated expiresAt');

  // Wait briefly for WS broadcast
  await new Promise(r => setTimeout(r, 200));
  assert(receivedBroadcast !== null, 'WebSocket received STATUS_UPDATED broadcast in real-time');
  assert(receivedBroadcast?.payload?.rollNo === 'B25349', 'Broadcast payload matches posted status roll');

  // 5. GET /api/social/status?roll=B25349
  console.log('\n--- 5. Get Specific Status Beacon (GET /api/social/status?roll=B25349) ---');
  const getStatusRes = await request('GET', '/api/social/status?roll=B25349');
  assert(getStatusRes.status === 200, 'GET /api/social/status?roll=B25349 returns HTTP 200');
  assert(getStatusRes.data?.status?.rollNo === 'B25349', 'Returned status matches B25349', `Text: "${getStatusRes.data?.status?.text}"`);

  // 6. DELETE /api/social/status?roll=B25349
  console.log('\n--- 6. Delete Status Beacon (DELETE /api/social/status?roll=B25349) ---');
  const delStatusRes = await request('DELETE', '/api/social/status?roll=B25349');
  assert(delStatusRes.status === 200, 'DELETE /api/social/status returns HTTP 200');
  assert(delStatusRes.data?.cleared === true, 'DELETE response indicates cleared: true');
  
  // Verify it is gone
  const verifyDelRes = await request('GET', '/api/social/status?roll=B25349');
  assert(verifyDelRes.data?.status === null, 'Status is null after deletion');

  // Re-create beacon for remaining social tests
  await request('POST', '/api/social/status', beaconPayload);

  // 7. GET /api/social/friends?roll=B25349
  console.log('\n--- 7. Friends Graph Query (GET /api/social/friends?roll=B25349) ---');
  // First ensure friend relationship
  await request('POST', '/api/social/friends', {
    ownerRoll: 'B25349',
    friendRoll: 'B25308',
    action: 'add'
  });
  const friendsRes = await request('GET', '/api/social/friends?roll=B25349');
  assert(friendsRes.status === 200, 'GET /api/social/friends returns HTTP 200');
  assert(Array.isArray(friendsRes.data?.friends), 'Friends response contains friends array');
  assert(friendsRes.data?.friends.includes('B25308'), 'Friends array includes B25308');
  assert(Array.isArray(friendsRes.data?.friendsData), 'Friends response contains enriched friendsData array', `Friend count: ${friendsRes.data?.friends.length}`);

  // 8. POST /api/social/circles
  console.log('\n--- 8. Create Study Circle (POST /api/social/circles) ---');
  const circlePayload = {
    name: 'Term 5 Systems & FinTech Squad',
    ownerRoll: 'B25349',
    ownerName: 'Janmejai Singh',
    courseCode: 'FINTECH'
  };
  const circleRes = await request('POST', '/api/social/circles', circlePayload);
  assert(circleRes.status === 200, 'POST /api/social/circles returns HTTP 200');
  assert(circleRes.data?.ok === true, 'Circle response ok: true');
  const createdCircle = circleRes.data?.circle;
  assert(typeof createdCircle?.code === 'string' && createdCircle.code.startsWith('XL-'), 'Circle code generated with XL- prefix', `Code: ${createdCircle?.code}`);
  assert(createdCircle?.members?.includes('B25349'), 'Owner added to circle members');

  // 9. POST /api/social/circles/join
  console.log('\n--- 9. Join Study Circle (POST /api/social/circles/join) ---');
  const joinPayload = {
    code: createdCircle.code,
    rollNo: 'B25308',
    name: 'Mayank Jain',
    section: 'E'
  };
  const joinRes = await request('POST', '/api/social/circles/join', joinPayload);
  assert(joinRes.status === 200, 'POST /api/social/circles/join returns HTTP 200');
  assert(joinRes.data?.ok === true, 'Join response ok: true');
  assert(joinRes.data?.circle?.members?.includes('B25308'), 'Classmate B25308 successfully enrolled in circle members', `Current members: ${joinRes.data?.circle?.members.join(', ')}`);

  // 10. GET /api/social/overlap?rolls=B25349,B25308
  console.log('\n--- 10. Schedule Overlap Matrix (GET /api/social/overlap?rolls=B25349,B25308) ---');
  const overlapRes = await request('GET', '/api/social/overlap?rolls=B25349,B25308');
  assert(overlapRes.status === 200, 'GET /api/social/overlap returns HTTP 200');
  assert(overlapRes.data?.ok === true, 'Overlap response ok: true');
  assert(overlapRes.data?.membersCount === 2, 'Members count is 2');
  assert(typeof overlapRes.data?.mutualFreeSlots === 'number', 'Calculated mutualFreeSlots count exists');
  assert(Array.isArray(overlapRes.data?.slots), 'Overlap slots array returned');
  assert(overlapRes.data?.slots.length > 0, 'Found non-zero mutual free slots', `Mutual Free Slots: ${overlapRes.data?.mutualFreeSlots}`);

  // 11. Edge Cases & Boundary Conditions
  console.log('\n--- 11. Edge Cases & Boundary Handling ---');
  
  // Missing query parameter on overlap
  const missingRollsRes = await request('GET', '/api/social/overlap');
  assert(missingRollsRes.status === 400, 'GET /api/social/overlap without rolls returns 400 Bad Request');
  assert(missingRollsRes.data?.ok === false, 'Error response contains ok: false');

  // Single roll on overlap (minimum 2 required)
  const singleRollRes = await request('GET', '/api/social/overlap?rolls=B25349');
  assert(singleRollRes.status === 400, 'GET /api/social/overlap with single roll returns 400 Bad Request');

  // Missing fields on POST /api/social/status
  const invalidStatusRes = await request('POST', '/api/social/status', {});
  assert(invalidStatusRes.status === 400, 'POST /api/social/status without body returns 400 Bad Request');

  // Join nonexistent circle
  const nonExistentJoin = await request('POST', '/api/social/circles/join', { code: 'XL-9999', rollNo: 'B25349' });
  assert(nonExistentJoin.status === 404, 'Joining nonexistent circle returns 404 Not Found');

  // Max group members overlap (8 classmates)
  const multiRolls = 'B25349,B25308,B25301,B25302,B25303,B25304,B25305,B25306';
  const multiOverlap = await request('GET', `/api/social/overlap?rolls=${multiRolls}`);
  assert(multiOverlap.status === 200, 'Max group overlap (8 members) computes successfully');
  assert(multiOverlap.data?.membersCount === 8, 'Reported member count is 8', `Slots: ${multiOverlap.data?.mutualFreeSlots}`);

  // Expired beacon auto-cleanup
  console.log('\n--- 12. Expired Beacon Lifecycle & Purge ---');
  // Inject an expired beacon directly
  await request('POST', '/api/social/status', {
    rollNo: 'TEMP_EXPIRED',
    name: 'Temporary Student',
    text: 'Will expire instantly',
    durationMins: -10 // expired in the past
  });
  // Next call to whos-where triggers cleanExpiredStatuses
  const radarAfterExpiry = await request('GET', '/api/social/whos-where');
  assert(radarAfterExpiry.data?.statuses['TEMP_EXPIRED'] === undefined, 'Expired beacon auto-purged on query', 'Expired beacon verified removed');

  ws.close();

  console.log('\n================================================================');
  console.log(`🎉 SOCIAL SERVER TEST RESULTS: ${passed}/${total} PASSED (100%)`);
  console.log('================================================================\n');
}

runSocialSuite().catch(err => {
  console.error('Fatal Error running test suite:', err);
  process.exit(1);
});
