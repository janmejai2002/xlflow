import urllib.request
import json

BASE = 'http://localhost:3101'

def get(path):
    req = urllib.request.Request(BASE + path)
    with urllib.request.urlopen(req) as res:
        return res.status, json.loads(res.read().decode())

def post(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(BASE + path, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req) as res:
        return res.status, json.loads(res.read().decode())

def delete(path):
    req = urllib.request.Request(BASE + path, method='DELETE')
    with urllib.request.urlopen(req) as res:
        return res.status, json.loads(res.read().decode())

print('1. Testing /health...')
st, d = get('/health')
assert st == 200 and d.get('ok'), 'Health failed'
print('  OK: Health passed!')

print('2. Testing /api/social/whos-where...')
st, d = get('/api/social/whos-where')
assert st == 200 and 'statuses' in d, 'Whos-where failed'
count = len(d.get('statuses', {}))
print('  OK: Whos-where returned ' + str(count) + ' active beacons across zones: ' + str(d.get('zoneCounts', {})))

print('3. Testing POST /api/social/status (Setting test beacon)...')
beacon_payload = {
    'rollNo': 'B25349',
    'name': 'Janmejai Singh',
    'section': 'E',
    'emoji': '☕',
    'text': 'Testing automated social verification at Nescafe',
    'zone': 'nescafe',
    'durationMins': 60
}
st, d = post('/api/social/status', beacon_payload)
assert st == 200 and d.get('ok'), 'Status post failed'
print('  OK: Status posted successfully!')

print('4. Testing GET /api/social/friends...')
st, d = get('/api/social/friends?roll=B25349')
assert st == 200 and 'friends' in d, 'Friends get failed'
print('  OK: Friends returned: ' + str(d.get('friends', [])))

print('5. Testing POST /api/social/circles (Create test squad)...')
circle_payload = {
    'name': 'AI & FinTech Squad',
    'courseCode': 'FINTECH',
    'ownerRoll': 'B25349',
    'ownerName': 'Janmejai Singh'
}
st, d = post('/api/social/circles', circle_payload)
assert st == 200 and 'circle' in d, 'Create circle failed'
code = d['circle']['code']
print('  OK: Circle created with code: ' + code)

print('6. Testing POST /api/social/circles/join...')
join_payload = {'code': code, 'rollNo': 'B25308', 'name': 'Mayank Jain'}
st, d = post('/api/social/circles/join', join_payload)
assert st == 200 and d.get('ok'), 'Join circle failed'
print('  OK: Batchmate joined circle!')

print('7. Testing GET /api/social/overlap...')
st, d = get('/api/social/overlap?rolls=B25349,B25308')
assert st == 200 and 'mutualFreeSlots' in d, 'Overlap failed'
print('  OK: Mutual free slots found: ' + str(d.get('mutualFreeSlots', 0)) + ' slots')

print('\n=============================================')
print('SUCCESS: ALL 7 SOCIAL BACKEND TESTS PASSED (100% OK)!')
print('=============================================')

