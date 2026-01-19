/**
 * Роуты для авторизации
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { loadData } = require('../utils/data-storage');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * POST /api/admin/auth/login
 * Вход в систему
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    // Загружаем пользователей из файла
    const data = loadData('users');
    const users = data.items || [];
    
    console.log('Попытка входа:', { email, usersCount: users.length });
    
    // Ищем пользователя по email
    const user = users.find(u => u.email === email);

    if (!user) {
      console.log('Пользователь не найден:', email);
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    console.log('Пользователь найден:', { id: user.id, email: user.email, hasPassword: !!user.password });

    // Проверяем пароль
    // Если пароль не захеширован (старые данные), проверяем напрямую
    // В противном случае используем bcrypt
    let passwordValid = false;
    
    if (!user.password) {
      console.log('У пользователя нет пароля');
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    if (user.password.startsWith('$2a$')) {
      // Пароль захеширован с помощью bcrypt
      console.log('Проверка bcrypt пароля...');
      passwordValid = await bcrypt.compare(password, user.password);
      console.log('Результат проверки пароля:', passwordValid);
    } else {
      // Старый формат или пароль не захеширован
      // Для совместимости проверяем напрямую (только для тестовых данных)
      console.log('Проверка пароля напрямую (не захеширован)...');
      passwordValid = user.password === password;
      console.log('Результат проверки пароля:', passwordValid);
      
      // Если пароль совпал, но не захеширован, хешируем его и сохраняем
      if (passwordValid && !user.password.startsWith('$2a$')) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        // Сохраняем обновленного пользователя
        const { saveData } = require('../utils/data-storage');
        const userData = loadData('users');
        const userIndex = userData.items.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
          userData.items[userIndex] = user;
          saveData('users', userData);
        }
      }
    }

    if (!passwordValid) {
      console.log('Пароль неверный');
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Проверяем статус пользователя
    if (user.status && user.status !== 'active') {
      return res.status(403).json({ error: 'Аккаунт заблокирован' });
    }

    // Генерируем JWT токен
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    
    console.log('Создание токена для пользователя:', { userId: user.id, userIdType: typeof user.id, email: user.email });
    
    const token = jwt.sign(
      tokenPayload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    console.log('Токен создан, payload:', tokenPayload);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    res.status(500).json({ error: 'Ошибка сервера при авторизации' });
  }
});

/**
 * POST /api/admin/auth/logout
 * Выход из системы (на клиенте просто удаляется токен)
 */
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Выход выполнен' });
});

/**
 * GET /api/admin/auth/me
 * Получить информацию о текущем пользователе
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Загружаем пользователя из файла
    const data = loadData('users');
    const users = data.items || [];
    const user = users.find(u => u.id === decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Недействительный токен' });
    }
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
