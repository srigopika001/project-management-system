import { Router } from 'express'
import Project from '../models/Project.js'
import Task from '../models/Task.js'
import { verifyLogin, managerOnly } from '../middleware/verifyLogin.js'

const router = Router()
router.use(verifyLogin)

router.get('/', async (_req, res) => res.json(await Project.find().sort({ createdAt: -1 })))

router.post('/', managerOnly, async (req, res) => {
  try {
    if (!req.body.name) return res.status(400).json({ message: 'Project name is required' })
    res.status(201).json(await Project.create({ name: req.body.name, description: req.body.description, owner: req.user.id }))
  } catch (e) { res.status(500).json({ message: e.message }) }
})

router.delete('/:id', managerOnly, async (req, res) => {
  await Task.deleteMany({ project: req.params.id })
  await Project.findByIdAndDelete(req.params.id)
  res.json({ message: 'Deleted' })
})

export default router
