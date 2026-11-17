// Run with: npm test   (start the server first: npm run dev). Needs Node 18+
const BASE = process.env.API_URL || 'http://localhost:5000/api'
const stamp = Date.now()

async function call(path, method = 'GET', body, token) {
  const r = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: r.status, data: await r.json() }
}
const check = (name, ok) => { console.log(ok ? 'PASS' : 'FAIL', '-', name); if (!ok) process.exitCode = 1 }

let r = await call('/health'); check('health', r.status === 200)
r = await call('/auth/register', 'POST', { name: 'Boss', email: `boss${stamp}@mail.com`, password: '123456', role: 'manager' }); check('register manager', r.status === 201)
const mgr = r.data.token
r = await call('/auth/register', 'POST', { name: 'Dev', email: `dev${stamp}@mail.com`, password: '123456' }); check('register member', r.status === 201)
const mem = r.data.token, memId = r.data.user.id
r = await call('/projects'); check('blocked without token', r.status === 401)
r = await call('/projects', 'POST', { name: 'Website' }, mem); check('member cannot create project', r.status === 403)
r = await call('/projects', 'POST', { name: 'Website', description: 'Demo' }, mgr); check('manager creates project', r.status === 201)
const pid = r.data._id
r = await call('/tasks', 'POST', { project: pid, title: 'Design UI', assignedTo: memId }, mgr); check('manager creates task', r.status === 201)
const tid = r.data._id
r = await call('/tasks/' + tid, 'PATCH', { status: 'In Progress' }, mem); check('assignee updates status', r.data.status === 'In Progress')
r = await call('/tasks?project=' + pid, 'GET', null, mgr); check('list tasks', r.data.length === 1)
