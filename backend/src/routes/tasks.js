import { Router } from 'express'
import Task from '../models/Task.js'
import { verifyLogin, managerOnly } from '../middleware/verifyLogin.js'

const router = Router()
router.use(verifyLogin)

router.get('/', async (req, res) => {
  if (!req.query.project) return res.status(400).json({ message: 'project query is required' })
  res.json(await Task.find({ project: req.query.project }).populate('assignedTo', 'name').sort({ createdAt: -1 }))
})

router.post('/', managerOnly, async (req, res) => {
  try {
    const { project, title, priority, dueDate, assignedTo } = req.body
    if (!project || !title) return res.status(400).json({ message: 'project and title are required' })
    res.status(201).json(await Task.create({ project, title, priority, dueDate: dueDate || undefined, assignedTo }))
  } catch (e) { res.status(500).json({ message: e.message }) }
})

// Manager can edit anything; members can update only the status of tasks assigned to them
router.patch('/:id', async (req, res) => {
  const task = await Task.findById(req.params.id)
  if (!task) return res.status(404).json({ message: 'Task not found' })
  const mine = task.assignedTo?.toString() === req.user.id
  if (req.user.role !== 'manager' && !mine) return res.status(403).json({ message: 'You can update only your own tasks' })
  if (req.body.status && !['Todo', 'In Progress', 'Done'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid status' })
  if (req.body.status) task.status = req.body.status
  await task.save()
  res.json(task)
})

export default router
