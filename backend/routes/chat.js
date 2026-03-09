/**
 * Роуты для чата (доступны всем авторизованным: ученики и админы)
 * Два типа чатов: 1) личный с админом, 2) общий (история не видна вновь присоединившимся)
 */

const express = require('express');
const router = express.Router();
const { loadData, saveData } = require('../utils/data-storage');
const { authenticateToken } = require('../middleware/auth');

function getUserName(userId) {
  const usersData = loadData('users');
  const user = (usersData.items || []).find(u => u.id === userId);
  return user ? (user.name || user.email) : 'Пользователь';
}

function getAdminId() {
  const usersData = loadData('users');
  const admin = (usersData.items || []).find(u => u.role === 'admin');
  return admin ? admin.id : null;
}

// --- Личные чаты (админ ↔ ученик) ---

/**
 * GET /api/admin/chat/threads
 * Список чатов: админ видит все чаты с учениками, ученик — только свой чат с админом
 */
router.get('/threads', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    const adminId = getAdminId();

    const threadsData = loadData('chatThreads');
    const threads = threadsData.items || [];
    const usersData = loadData('users');
    const users = usersData.items || [];

    let resultThreads = [];

    if (isAdmin) {
      // Админ видит все чаты с учениками (создаём треды для учеников без чата)
      const students = users.filter(u => u.role === 'student');
      const updatedThreads = [...threads];
      let nextId = threadsData.nextId || 1;

      resultThreads = students.map(student => {
        let thread = updatedThreads.find(t => t.admin_id === userId && t.student_id === student.id);
        if (!thread) {
          thread = { id: nextId++, admin_id: userId, student_id: student.id };
          updatedThreads.push(thread);
        }
        return {
          id: thread.id,
          student_id: student.id,
          student_name: student.name || student.email || 'Ученик',
          student_email: student.email || '',
        };
      });

      if (updatedThreads.length > threads.length) {
        saveData('chatThreads', { items: updatedThreads, nextId });
      }
      resultThreads.sort((a, b) => (a.student_name || '').localeCompare(b.student_name || ''));
    } else if (!isAdmin) {
      // Ученик видит только свой чат с админом
      let thread = threads.find(t => t.student_id === userId);
      if (!thread && adminId) {
        const nextId = (threadsData.nextId || 1);
        thread = { id: nextId, admin_id: adminId, student_id: userId };
        threads.push(thread);
        saveData('chatThreads', { items: threads, nextId: nextId + 1 });
      }
      if (thread) {
        const admin = users.find(u => u.id === adminId);
        resultThreads = [{
          id: thread.id,
          admin_id: adminId,
          admin_name: admin ? (admin.name || admin.email) : 'Админ',
        }];
      }
    }

    res.json(resultThreads);
  } catch (error) {
    console.error('Ошибка загрузки чатов:', error);
    res.status(500).json({ error: 'Ошибка загрузки чатов' });
  }
});

/**
 * GET /api/admin/chat/threads/:threadId/messages
 * Сообщения личного чата
 */
router.get('/threads/:threadId/messages', authenticateToken, (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';

    const threadsData = loadData('chatThreads');
    const thread = (threadsData.items || []).find(t => t.id === parseInt(threadId, 10));

    if (!thread) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    const hasAccess = isAdmin
      ? thread.admin_id === userId
      : thread.student_id === userId;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    const messagesData = loadData('privateChatMessages');
    const messages = (messagesData.items || [])
      .filter(m => m.thread_id === parseInt(threadId, 10))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    res.json(messages);
  } catch (error) {
    console.error('Ошибка загрузки сообщений:', error);
    res.status(500).json({ error: 'Ошибка загрузки сообщений' });
  }
});

/**
 * POST /api/admin/chat/threads/:threadId/messages
 * Отправить сообщение в личный чат
 */
router.post('/threads/:threadId/messages', authenticateToken, (req, res) => {
  try {
    const { threadId } = req.params;
    const { text } = req.body;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Текст сообщения обязателен' });
    }

    const threadsData = loadData('chatThreads');
    const thread = (threadsData.items || []).find(t => t.id === parseInt(threadId, 10));

    if (!thread) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    const hasAccess = isAdmin
      ? thread.admin_id === userId
      : thread.student_id === userId;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    const messagesData = loadData('privateChatMessages');
    const items = messagesData.items || [];
    const nextId = messagesData.nextId || 1;
    const userName = getUserName(userId);

    const newMessage = {
      id: nextId,
      thread_id: parseInt(threadId, 10),
      user_id: userId,
      user_name: userName,
      text: text.trim(),
      created_at: new Date().toISOString(),
    };

    items.push(newMessage);
    saveData('privateChatMessages', { items, nextId: nextId + 1 });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    res.status(500).json({ error: 'Ошибка отправки сообщения' });
  }
});

// --- Общий чат (история не видна вновь присоединившимся) ---

function ensureGeneralChatJoin(userId) {
  const joinsData = loadData('generalChatJoins');
  const items = joinsData.items || [];
  let join = items.find(j => j.user_id === userId);
  if (!join) {
    join = { user_id: userId, joined_at: new Date().toISOString() };
    items.push(join);
    saveData('generalChatJoins', { items });
  }
  return join.joined_at;
}

/**
 * GET /api/admin/chat/general/messages
 * Сообщения общего чата (только с момента присоединения пользователя)
 */
router.get('/general/messages', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const joinedAt = ensureGeneralChatJoin(userId);

    const data = loadData('generalChatMessages');
    const allMessages = (data.items || [])
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const messages = allMessages.filter(m => new Date(m.created_at) >= new Date(joinedAt));
    res.json(messages);
  } catch (error) {
    console.error('Ошибка загрузки сообщений общего чата:', error);
    res.status(500).json({ error: 'Ошибка загрузки сообщений' });
  }
});

/**
 * POST /api/admin/chat/general/messages
 * Отправить сообщение в общий чат
 */
router.post('/general/messages', authenticateToken, (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user.userId;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Текст сообщения обязателен' });
    }

    ensureGeneralChatJoin(userId);

    const data = loadData('generalChatMessages');
    const items = data.items || [];
    const nextId = data.nextId || 1;
    const userName = getUserName(userId);

    const newMessage = {
      id: nextId,
      user_id: userId,
      user_name: userName,
      text: text.trim(),
      created_at: new Date().toISOString(),
    };

    items.push(newMessage);
    saveData('generalChatMessages', { items, nextId: nextId + 1 });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    res.status(500).json({ error: 'Ошибка отправки сообщения' });
  }
});

module.exports = router;
