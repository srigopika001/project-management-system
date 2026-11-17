import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const router = Router()
const sign = (u) => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role })

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required' })
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(400).json({ message: 'Email already registered' })
    // NOTE: role selectable only for demo purposes
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10), role: role === 'manager' ? 'manager' : 'member' })
    res.status(201).json({ token: sign(user), user: pub(user) })
  } catch (e) { res.status(500).json({ message: e.message }) }
})

router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: (req.body.email || '').toLowerCase() })
    if (!user || !(await bcrypt.compare(req.body.password || '', user.password)))
      return res.status(400).json({ message: 'Invalid email or password' })
    res.json({ token: sign(user), user: pub(user) })
  } catch (e) { res.status(500).json({ message: e.message }) }
})

export default router
