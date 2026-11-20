 import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import taskRoutes from './routes/tasks.js'
import { verifyLogin, managerOnly } from './middleware/verifyLogin.js'
import User from './models/User.js'

const app = express()
app.use(cors({ origin: true, credentials: true }));
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/tasks', taskRoutes)
app.get('/api/users', verifyLogin, managerOnly, async (_req, res) => res.json(await User.find().select('name email role')))

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => app.listen(process.env.PORT || 5000, () => console.log('API running on port', process.env.PORT || 5000)))
  .catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1) })
