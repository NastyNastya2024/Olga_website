/**
 * Роуты для работы с пользователями/учениками
 */

const express = require('express');
const router = express.Router();
const { loadData, saveData } = require('../utils/data-storage');

// Загружаем данные из файла при старте
let data = loadData('users');
let users = data.items || [
  {
    id: 1,
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
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
  res.json(users);
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
  
  res.json(user);
});

/**
 * PUT /api/admin/users/:id
 * Обновить пользователя
 */
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  
  const { name, email, role, tariff, assigned_videos, program_notes } = req.body;
  
  users[userIndex] = {
    ...users[userIndex],
    name: name !== undefined ? name : users[userIndex].name,
    email: email !== undefined ? email : users[userIndex].email,
    role: role !== undefined ? role : users[userIndex].role,
    tariff: tariff !== undefined ? tariff : users[userIndex].tariff,
    assigned_videos: assigned_videos !== undefined ? assigned_videos : users[userIndex].assigned_videos,
    program_notes: program_notes !== undefined ? program_notes : users[userIndex].program_notes,
    updated_at: new Date().toISOString(),
  };
  
  persistData();
  res.json(users[userIndex]);
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
