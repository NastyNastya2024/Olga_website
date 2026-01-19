/**
 * Роуты для работы с блогом
 */

const express = require('express');
const router = express.Router();
const { loadData, saveData } = require('../utils/data-storage');

// Загружаем данные из файла при старте
let data = loadData('blog');
let posts = data.items || [];
let nextId = data.nextId || 1;

// Функция для сохранения данных
function persistData() {
  saveData('blog', { items: posts, nextId });
}

// Функция для получения всех статей (для публичного роута)
const getPosts = () => posts;

/**
 * GET /api/admin/blog
 * Получить список всех статей
 */
router.get('/', (req, res) => {
  res.json(posts);
});

/**
 * GET /api/admin/blog/:id
 * Получить статью по ID
 */
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const post = posts.find(p => p.id === id);
  
  if (!post) {
    return res.status(404).json({ error: 'Статья не найдена' });
  }
  
  res.json(post);
});

/**
 * POST /api/admin/blog
 * Создать новую статью
 */
router.post('/', (req, res) => {
  const { title, content, cover_url, category_id, meta_title, meta_description, status } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Заголовок и содержание обязательны' });
  }
  
  const newPost = {
    id: nextId++,
    title,
    content,
    cover_url: cover_url || null,
    category_id: category_id || null,
    meta_title: meta_title || null,
    meta_description: meta_description || null,
    status: status || 'draft',
    published_at: status === 'published' ? new Date().toISOString() : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  posts.push(newPost);
  persistData();
  
  res.status(201).json(newPost);
});

/**
 * PUT /api/admin/blog/:id
 * Обновить статью
 */
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const postIndex = posts.findIndex(p => p.id === id);
  
  if (postIndex === -1) {
    return res.status(404).json({ error: 'Статья не найдена' });
  }
  
  const { title, content, cover_url, category_id, meta_title, meta_description, status } = req.body;
  
  posts[postIndex] = {
    ...posts[postIndex],
    title: title || posts[postIndex].title,
    content: content || posts[postIndex].content,
    cover_url: cover_url !== undefined ? cover_url : posts[postIndex].cover_url,
    category_id: category_id !== undefined ? category_id : posts[postIndex].category_id,
    meta_title: meta_title !== undefined ? meta_title : posts[postIndex].meta_title,
    meta_description: meta_description !== undefined ? meta_description : posts[postIndex].meta_description,
    status: status || posts[postIndex].status,
    published_at: status === 'published' && !posts[postIndex].published_at 
      ? new Date().toISOString() 
      : posts[postIndex].published_at,
    updated_at: new Date().toISOString(),
  };
  
  persistData();
  res.json(posts[postIndex]);
});

/**
 * DELETE /api/admin/blog/:id
 * Удалить статью
 */
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const postIndex = posts.findIndex(p => p.id === id);
  
  if (postIndex === -1) {
    return res.status(404).json({ error: 'Статья не найдена' });
  }
  
  posts.splice(postIndex, 1);
  persistData();
  
  res.json({ success: true, message: 'Статья удалена' });
});

module.exports = { router, getPosts };
