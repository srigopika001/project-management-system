import jwt from 'jsonwebtoken'

// Checks the JWT token and attaches req.user = { id, role }
export function verifyLogin(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ message: 'Please login first' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export function managerOnly(req, res, next) {
  if (req.user.role !== 'manager') return res.status(403).json({ message: 'Managers only' })
  next()
}
