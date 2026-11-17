import { useEffect, useState } from 'react'
import { api } from './api.js'

const COLS = ['Todo', 'In Progress', 'Done']
const PRIORITIES = ['Low', 'Medium', 'High']

function Auth({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'member' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setErr('')
    try { onLogin(await api(`/auth/${mode}`, { method: 'POST', body: f })) }
    catch (x) { setErr(x.message) }
  }

  return (
    <div className="auth">
      <form className="card" onSubmit={submit}>
        <h1>TaskBoard</h1>
        <p className="muted">{mode === 'login' ? 'Sign in to your workspace' : 'Create your account'}</p>
        {mode === 'register' && <input placeholder="Full name" value={f.name} onChange={set('name')} required />}
        <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
        <input type="password" placeholder="Password" value={f.password} onChange={set('password')} required minLength={6} />
        {mode === 'register' && (
          <select value={f.role} onChange={set('role')}>
            <option value="member">Team Member</option>
            <option value="manager">Project Manager</option>
          </select>
        )}
        {err && <div className="err">{err}</div>}
        <button className="btn">{mode === 'login' ? 'Login' : 'Register'}</button>
        <a className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'New here? Register' : 'Have an account? Login'}
        </a>
      </form>
    </div>
  )
}

function Board({ user, token, onLogout }) {
  const isManager = user.role === 'manager'
  const [projects, setProjects] = useState([])
  const [current, setCurrent] = useState(null)
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [pForm, setPForm] = useState({ name: '', description: '' })
  const [tForm, setTForm] = useState({ title: '', priority: 'Medium', dueDate: '', assignedTo: '' })
  const [msg, setMsg] = useState('')

  const loadProjects = () => api('/projects', { token }).then((p) => { setProjects(p); if (!current && p[0]) setCurrent(p[0]._id) }).catch((e) => setMsg(e.message))
  const loadTasks = () => current && api(`/tasks?project=${current}`, { token }).then(setTasks).catch((e) => setMsg(e.message))

  useEffect(() => { loadProjects(); if (isManager) api('/users', { token }).then(setUsers) }, [])
  useEffect(() => { loadTasks() }, [current])

  async function addProject(e) {
    e.preventDefault()
    try {
      const p = await api('/projects', { method: 'POST', body: pForm, token })
      setPForm({ name: '', description: '' }); setCurrent(p._id); loadProjects()
    } catch (x) { setMsg(x.message) }
  }
  async function addTask(e) {
    e.preventDefault()
    try {
      await api('/tasks', { method: 'POST', body: { ...tForm, project: current, assignedTo: tForm.assignedTo || undefined }, token })
      setTForm({ title: '', priority: 'Medium', dueDate: '', assignedTo: '' }); loadTasks()
    } catch (x) { setMsg(x.message) }
  }
  async function move(id, status) { await api(`/tasks/${id}`, { method: 'PATCH', body: { status }, token }); loadTasks() }
  async function removeProject() {
    if (!confirm('Delete this project and its tasks?')) return
    await api(`/projects/${current}`, { method: 'DELETE', token })
    setCurrent(null); setTasks([]); loadProjects().then(() => {})
  }

  const done = tasks.filter((t) => t.status === 'Done').length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0
  const proj = projects.find((p) => p._id === current)

  return (
    <div className="layout">
      <aside>
        <h1>TaskBoard</h1>
        <div className="muted small">{user.name} · {user.role}</div>
        <div className="plist">
          {projects.map((p) => (
            <button key={p._id} className={'pitem' + (p._id === current ? ' on' : '')} onClick={() => setCurrent(p._id)}>{p.name}</button>
          ))}
          {projects.length === 0 && <div className="muted small">No projects yet</div>}
        </div>
        {isManager && (
          <form onSubmit={addProject} className="stack">
            <input placeholder="New project name" value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} required />
            <input placeholder="Description" value={pForm.description} onChange={(e) => setPForm({ ...pForm, description: e.target.value })} />
            <button className="btn">+ Add Project</button>
          </form>
        )}
        <button className="btn ghost" onClick={onLogout}>Logout</button>
      </aside>

      <main>
        {msg && <div className="err">{msg}</div>}
        {!proj ? <p className="muted">Select or create a project to begin.</p> : (
          <>
            <div className="top">
              <div>
                <h2>{proj.name}</h2>
                <div className="muted">{proj.description}</div>
              </div>
              {isManager && <button className="btn danger sm" onClick={removeProject}>Delete</button>}
            </div>
            <div className="progress"><div style={{ width: pct + '%' }} /></div>
            <div className="muted small">{done}/{tasks.length} tasks done · {pct}%</div>

            {isManager && (
              <form className="card row" onSubmit={addTask}>
                <input placeholder="Task title" value={tForm.title} onChange={(e) => setTForm({ ...tForm, title: e.target.value })} required />
                <select value={tForm.priority} onChange={(e) => setTForm({ ...tForm, priority: e.target.value })}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select>
                <input type="date" value={tForm.dueDate} onChange={(e) => setTForm({ ...tForm, dueDate: e.target.value })} />
                <select value={tForm.assignedTo} onChange={(e) => setTForm({ ...tForm, assignedTo: e.target.value })}>
                  <option value="">Unassigned</option>
                  {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
                <button className="btn">Add Task</button>
              </form>
            )}

            <div className="cols">
              {COLS.map((c) => (
                <div className="col" key={c}>
                  <h3>{c} <span>{tasks.filter((t) => t.status === c).length}</span></h3>
                  {tasks.filter((t) => t.status === c).map((t) => (
                    <div className="task" key={t._id}>
                      <b>{t.title}</b>
                      <div className="meta">
                        <span className={'pri ' + t.priority}>{t.priority}</span>
                        {t.dueDate && <span>Due {t.dueDate.slice(0, 10)}</span>}
                      </div>
                      <div className="muted small">{t.assignedTo?.name || 'Unassigned'}</div>
                      <select value={t.status} onChange={(e) => move(t._id, e.target.value)}>{COLS.map((s) => <option key={s}>{s}</option>)}</select>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('session') || 'null'))
  const login = (s) => { localStorage.setItem('session', JSON.stringify(s)); setSession(s) }
  const logout = () => { localStorage.removeItem('session'); setSession(null) }
  return session ? <Board user={session.user} token={session.token} onLogout={logout} /> : <Auth onLogin={login} />
}
