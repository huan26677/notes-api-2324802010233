// Chay tren API cua chinh nhom, khong in token hoac mat khau.
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const base = 'http://127.0.0.1:3000';
const password = randomBytes(18).toString('hex');
const run = Date.now();

async function request(method, path, token, body) {
  const headers = token ? { Authorization: 'Bearer ' + token } : {};
  if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(base + path, {
    method, headers, body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body)
  });
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = null; }
  return { status: response.status, data, headers: response.headers };
}

function check(label, response, expected) {
  console.log(label + ': HTTP ' + response.status + ' (expected ' + expected + ')');
  assert.equal(response.status, expected, label);
  return response.data;
}

async function auth(label) {
  const email = 'lab4-' + label + '-' + run + '@example.com';
  const user = check('Register ' + label, await request('POST', '/auth/register', null, {email, password}), 201);
  assert.ok(!user.passwordHash);
  const result = check('Login ' + label, await request('POST', '/auth/login', null, {email, password}), 200);
  assert.ok(result.token);
  return { token: result.token, id: user.id };
}

async function main() {
  if (process.argv.includes('--rate')) {
    console.log('=== RATE LIMIT: 20 requests / 15 min ===');
    const codes = [];
    for (let i = 1; i <= 25; i++) {
      const r = await request('POST', '/auth/login', null, { email:'rate-test@example.com', password:'wrongpassword' });
      codes.push(r.status);
      check('Attempt ' + i, r, i <= 20 ? 401 : 429);
    }
    console.log('PASS: first blocked request = ' + (codes.indexOf(429) + 1));
    return;
  }
  console.log('=== JWT / OWNER / NOSQL INJECTION ===');
  const a = await auth('A');
  const b = await auth('B');
  check('No token', await request('GET', '/notes'), 401);
  check('Invalid token', await request('GET', '/notes', 'invalid-token'), 401);
  check('Valid token A', await request('GET', '/notes', a.token), 200);
  check('NoSQL injection login', await request('POST', '/auth/login', null, { email: { $gt: '' }, password:'x' }), 401);
  const note = check('A creates note', await request('POST', '/notes', a.token, {
    title:'Bai 4 security test', content:'Owner isolation', tags:['lab4'], owner:b.id
  }), 201);
  assert.equal(note.owner, a.id, 'Owner comes from JWT');
  console.log('Owner spoofing ignored: PASS');
  const path = '/notes/' + note._id;
  check('A reads note', await request('GET', path, a.token), 200);
  const list = check('B lists own notes', await request('GET', '/notes', b.token), 200);
  assert.ok(!list.some(n => n._id === note._id));
  check('B reads A note', await request('GET', path, b.token), 404);
  check('B updates A note', await request('PUT', path, b.token, {title:'Unauthorized update'}), 404);
  const form = new FormData();
  form.append('file', new Blob(['test'], {type:'text/plain'}), 'test.txt');
  check('B attaches to A note', await request('POST', path + '/attachment', b.token, form), 404);
  check('B deletes A note', await request('DELETE', path, b.token), 404);
  check('A updates own note', await request('PUT', path, a.token, {title:'Updated by owner'}), 200);
  check('A deletes own test note', await request('DELETE', path, a.token), 204);
  const home = await request('GET','/');
  assert.equal(home.headers.get('x-content-type-options'), 'nosniff');
  console.log('Helmet X-Content-Type-Options: nosniff');
  console.log('PASS: all security checks');
}

main().catch(err => { console.error('FAIL:', err.message); process.exitCode = 1; });
