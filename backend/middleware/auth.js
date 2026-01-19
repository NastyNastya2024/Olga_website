/**
 * Middleware для проверки JWT токенов
 */

const jwt = require('jsonwebtoken');
const { loadData } = require('../utils/data-storage');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware для проверки авторизации
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Токен доступа не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Токен истек' });
    }
    return res.status(403).json({ error: 'Недействительный токен' });
  }
}

/**
 * Middleware для проверки роли админа
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещен. Требуется роль администратора' });
  }

  next();
}

/**
 * Опциональная проверка авторизации (не блокирует запрос, но добавляет req.user)
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Игнорируем ошибки токена для опциональной авторизации
    }
  }

  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth,
};
