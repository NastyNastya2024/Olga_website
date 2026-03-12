/**
 * Роуты для работы с пользователями/учениками
 */

const express = require('express');
const router = express.Router();
const { loadData, saveData } = require('../utils/data-storage');
const { authenticateToken } = require('../middleware/auth');

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
 * Вычислить дату окончания тарифа по дате платежа и сроку подписки (месяцев)
 */
function computeTariffEndDate(paymentDate, durationMonths) {
  const start = new Date(paymentDate);
  start.setMonth(start.getMonth() + (durationMonths || 1));
  return start.toISOString();
}

/**
 * Дополнить tariff_end_date для ученика, если отсутствует: ищем тариф по имени и прибавляем срок к дате платежа
 */
function ensureTariffEndDate(user, allUsers, nextIdVal) {
  if (user.role !== 'student' || user.tariff_end_date || !user.payment_date || !user.tariff) return;
  const tariffsData = loadData('pricingTariffs');
  const tariffs = tariffsData.items || [];
  const tariff = tariffs.find(t => (t.name || '').trim().toLowerCase() === (user.tariff || '').trim().toLowerCase());
  const months = tariff?.duration_months || 1;
  const endDate = computeTariffEndDate(user.payment_date, months);
  const idx = allUsers.findIndex(u => u.id === user.id);
  if (idx !== -1) {
    allUsers[idx].tariff_end_date = endDate;
    allUsers[idx].updated_at = new Date().toISOString();
    user.tariff_end_date = endDate;
    saveData('users', { items: allUsers, nextId: nextIdVal });
  }
}

/**
 * GET /api/admin/users
 * Получить список всех пользователей
 */
router.get('/', (req, res) => {
  // Перезагружаем из файла (могут быть новые пользователи из webhook оплаты)
  const freshData = loadData('users');
  users = freshData.items || users;
  nextId = freshData.nextId || nextId;
  // Для учеников без tariff_end_date — вычисляем по дате платежа + срок тарифа
  users.forEach(u => ensureTariffEndDate(u, users, nextId));
  // Не возвращаем пароли в списке пользователей
  const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
  res.json(usersWithoutPasswords);
});

/**
 * POST /api/admin/users
 * Создать нового пользователя
 */
router.post('/', async (req, res) => {
  const { name, email, password, role, tariff, tariff_end_date, status, assigned_videos, program_notes } = req.body;
  
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
    status: status || 'active',
    tariff: tariff || null,
    tariff_end_date: tariff_end_date || null,
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
 * Проверить и отключить ученика при истечении подписки
 */
function checkAndDisableExpiredStudent(user, currentUsers, userIndex, nextIdVal) {
  if (user.role !== 'student' || !user.tariff_end_date || user.status !== 'active') return;
  const endDate = new Date(user.tariff_end_date);
  if (endDate <= new Date()) {
    currentUsers[userIndex].status = 'disabled';
    currentUsers[userIndex].updated_at = new Date().toISOString();
    saveData('users', { items: currentUsers, nextId: nextIdVal });
    user.status = 'disabled';
    console.log('Ученик отключён по истечении подписки:', user.id);
  }
}

/**
 * GET /api/admin/users/me
 * Получить данные текущего пользователя
 * ВАЖНО: Этот роут должен быть ПЕРЕД /:id, иначе Express будет перехватывать /me как /:id
 */
router.get('/me', authenticateToken, (req, res) => {
  const userId = req.user?.userId;
  
  console.log('GET /me - req.user:', JSON.stringify(req.user, null, 2));
  console.log('GET /me - userId:', userId, 'тип:', typeof userId);
  
  if (!userId) {
    console.error('GET /me - userId отсутствует в req.user');
    return res.status(401).json({ error: 'Не авторизован' });
  }
  
  // ВАЖНО: Перезагружаем данные из файла для гарантии актуальности
  const freshData = loadData('users');
  const currentUsers = freshData.items || users;
  users = currentUsers;
  nextId = freshData.nextId || nextId;
  
  // Преобразуем userId в число для корректного сравнения
  const userIdNumber = parseInt(userId);
  
  console.log('GET /me - userIdNumber:', userIdNumber);
  console.log('GET /me - все пользователи из файла:', currentUsers.map(u => ({ id: u.id, idType: typeof u.id, email: u.email, assigned_videos: u.assigned_videos })));
  
  // Ищем пользователя, сравнивая как числа
  const userIndex = currentUsers.findIndex(u => parseInt(u.id) === userIdNumber);
  const user = userIndex >= 0 ? currentUsers[userIndex] : null;
  
  console.log('GET /me - найденный пользователь:', user ? { id: user.id, email: user.email, assigned_videos: user.assigned_videos } : 'не найден');
  
  if (!user) {
    console.error('GET /me - Пользователь не найден! userId:', userIdNumber, 'доступные ID:', currentUsers.map(u => u.id));
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  
  // Для учеников: проверяем истечение подписки
  checkAndDisableExpiredStudent(user, currentUsers, userIndex, freshData.nextId || nextId);
  
  // Не возвращаем пароль
  const { password: _, ...userResponse } = user;
  console.log('GET /me - возвращаем пользователя с assigned_videos:', userResponse.assigned_videos);
  res.json(userResponse);
});

/**
 * PUT /api/admin/users/me
 * Обновить данные текущего пользователя
 * ВАЖНО: Этот роут должен быть ПЕРЕД /:id
 */
router.put('/me', authenticateToken, async (req, res) => {
  const userId = req.user?.userId;
  
  if (!userId) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  
  // Перезагружаем данные из файла
  const freshData = loadData('users');
  const currentUsers = freshData.items || users;
  const userIndex = currentUsers.findIndex(u => parseInt(u.id) === parseInt(userId));
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  
  const { name, email, password, currentPassword, video_folders } = req.body;
  
  const updatedUser = {
    ...currentUsers[userIndex],
    name: name !== undefined ? name : currentUsers[userIndex].name,
    email: email !== undefined ? email : currentUsers[userIndex].email,
    updated_at: new Date().toISOString(),
  };

  // Ученики могут обновлять свои папки для видео (только для назначенных им)
  if (video_folders !== undefined && currentUsers[userIndex].role === 'student') {
    const assigned = (currentUsers[userIndex].assigned_videos || []).map(String);
    const sanitized = {};
    for (const [vid, folder] of Object.entries(video_folders || {})) {
      if (assigned.includes(String(vid)) && typeof folder === 'string') {
        const f = folder.trim();
        if (f) sanitized[String(vid)] = f;
      }
    }
    updatedUser.video_folders = sanitized;
  }
  
  // Если указан новый пароль, проверяем текущий и хешируем новый
  if (password && password.trim() !== '') {
    if (!currentPassword || currentPassword.trim() === '') {
      return res.status(400).json({ error: 'Для изменения пароля необходимо ввести текущий пароль' });
    }
    
    try {
      const bcrypt = require('bcryptjs');
      // Проверяем текущий пароль
      const currentPasswordValid = await bcrypt.compare(currentPassword, currentUsers[userIndex].password);
      
      if (!currentPasswordValid) {
        return res.status(401).json({ error: 'Неверный текущий пароль' });
      }
      
      // Хешируем новый пароль
      updatedUser.password = await bcrypt.hash(password, 10);
    } catch (error) {
      console.error('Ошибка обработки пароля:', error);
      return res.status(500).json({ error: 'Ошибка при обработке пароля' });
    }
  } else {
    // Если пароль не указан, сохраняем существующий
    updatedUser.password = currentUsers[userIndex].password;
  }
  
  currentUsers[userIndex] = updatedUser;
  saveData('users', { items: currentUsers, nextId });
  
  // Не возвращаем пароль в ответе
  const { password: _, ...userResponse } = currentUsers[userIndex];
  res.json(userResponse);
});

/**
 * GET /api/admin/users/:id
 * Получить пользователя по ID
 */
router.get('/:id', (req, res) => {
  const freshData = loadData('users');
  users = freshData.items || users;
  nextId = freshData.nextId || nextId;
  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);
  
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  
  ensureTariffEndDate(user, users, nextId);
  
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
  
  const { name, email, password, role, tariff, tariff_end_date, status, assigned_videos, program_notes } = req.body;
  
  console.log('PUT /users/:id - Обновление пользователя ID:', id);
  console.log('PUT /users/:id - assigned_videos из запроса:', assigned_videos);
  console.log('PUT /users/:id - Текущие assigned_videos:', users[userIndex].assigned_videos);
  
  const updatedUser = {
    ...users[userIndex],
    name: name !== undefined ? name : users[userIndex].name,
    email: email !== undefined ? email : users[userIndex].email,
    role: role !== undefined ? role : users[userIndex].role,
    tariff: tariff !== undefined ? tariff : users[userIndex].tariff,
    tariff_end_date: tariff_end_date !== undefined ? tariff_end_date : users[userIndex].tariff_end_date,
    status: status !== undefined ? status : (users[userIndex].status || 'active'),
    assigned_videos: assigned_videos !== undefined ? assigned_videos : users[userIndex].assigned_videos,
    program_notes: program_notes !== undefined ? program_notes : users[userIndex].program_notes,
    updated_at: new Date().toISOString(),
  };
  
  console.log('PUT /users/:id - Обновленные assigned_videos:', updatedUser.assigned_videos);
  
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
  
  // Перезагружаем данные из файла для гарантии актуальности
  const freshData = loadData('users');
  users = freshData.items || users;
  const updatedUserFromFile = users.find(u => u.id === id);
  
  console.log('PUT /users/:id - Пользователь после сохранения (из файла):', updatedUserFromFile ? { id: updatedUserFromFile.id, assigned_videos: updatedUserFromFile.assigned_videos } : 'не найден');
  
  // Не возвращаем пароль в ответе
  const { password: _, ...userResponse } = updatedUserFromFile || updatedUser;
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
