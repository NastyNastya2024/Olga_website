/**
 * Роуты для работы с пользователями/учениками
 */

const express = require('express');
const router = express.Router();
const { loadData, saveData } = require('../utils/data-storage');

// Загружаем данные из файла при старте
let data = loadData('users');
// Хэш пароля для admin123: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
let users = data.items || [
  {
    id: 1,
    email: 'admin@example.com',
    name: 'Admin User',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', // admin123
    role: 'admin',
    status: 'active',
    tariff: null,
    assigned_videos: [],
    program_notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];
let nextId = data.nextId || 2;

// Функция для сохранения данных
function persistData() {
  saveData('users', { items: users, nextId });
}

/**
 * GET /api/admin/users
 * Получить список всех пользователей
 */
router.get('/', (req, res) => {
  // Не возвращаем пароли в списке пользователей
  const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
  res.json(usersWithoutPasswords);
});

/**
 * POST /api/admin/users
 * Создать нового пользователя
 */
router.post('/', async (req, res) => {
  const { name, email, password, role, tariff, assigned_videos, program_notes } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }
  
  // Проверяем, не существует ли уже пользователь с таким email
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
  }
  
  const newUser = {
    id: nextId++,
    email,
    name: name || '',
    role: role || 'student',
    status: 'active',
    tariff: tariff || null,
    assigned_videos: assigned_videos || [],
    program_notes: program_notes || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  // Хешируем пароль
  try {
    const bcrypt = require('bcryptjs');
    if (!password.startsWith('$2a$')) {
      newUser.password = await bcrypt.hash(password, 10);
    } else {
      newUser.password = password;
    }
  } catch (error) {
    console.error('Ошибка хеширования пароля:', error);
    return res.status(500).json({ error: 'Ошибка при обработке пароля' });
  }
  
  users.push(newUser);
  persistData();
  
  // Не возвращаем пароль в ответе
  const { password: _, ...userResponse } = newUser;
  res.status(201).json(userResponse);
});

/**
 * GET /api/admin/users/:id
 * Получить пользователя по ID
 */
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);
  
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  
  // Не возвращаем пароль в ответе
  const { password: _, ...userResponse } = user;
  res.json(userResponse);
});

/**
 * PUT /api/admin/users/:id
 * Обновить пользователя
 */
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  
  const { name, email, password, role, tariff, assigned_videos, program_notes } = req.body;
  
  const updatedUser = {
    ...users[userIndex],
    name: name !== undefined ? name : users[userIndex].name,
    email: email !== undefined ? email : users[userIndex].email,
    role: role !== undefined ? role : users[userIndex].role,
    tariff: tariff !== undefined ? tariff : users[userIndex].tariff,
    assigned_videos: assigned_videos !== undefined ? assigned_videos : users[userIndex].assigned_videos,
    program_notes: program_notes !== undefined ? program_notes : users[userIndex].program_notes,
    updated_at: new Date().toISOString(),
  };
  
  // Если указан новый пароль, хешируем его
  if (password && password.trim() !== '') {
    try {
      const bcrypt = require('bcryptjs');
      // Если пароль уже захеширован, оставляем как есть, иначе хешируем
      if (!password.startsWith('$2a$')) {
        updatedUser.password = await bcrypt.hash(password, 10);
      } else {
        updatedUser.password = password;
      }
    } catch (error) {
      console.error('Ошибка хеширования пароля:', error);
      return res.status(500).json({ error: 'Ошибка при обработке пароля' });
    }
  }
  // Если пароль не указан, сохраняем существующий
  else {
    updatedUser.password = users[userIndex].password;
  }
  
  users[userIndex] = updatedUser;
  persistData();
  
  // Не возвращаем пароль в ответе
  const { password: _, ...userResponse } = users[userIndex];
  res.json(userResponse);
});

/**
 * DELETE /api/admin/users/:id
 * Удалить пользователя
 */
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  
  users.splice(userIndex, 1);
  persistData();
  
  res.json({ success: true, message: 'Пользователь удален' });
});

module.exports = router;
