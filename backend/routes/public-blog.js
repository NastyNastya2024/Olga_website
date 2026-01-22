/**
 * Публичные роуты для блога (только опубликованные статьи)
 */

const express = require('express');
const router = express.Router();

let getPosts = () => [];

router.setPostsGetter = (getter) => {
  getPosts = getter;
};

/**
 * GET /api/public/blog
 * Получить список опубликованных статей
 */
router.get('/', (req, res) => {
  try {
    const allPosts = getPosts();
    
    console.log('Все статьи из getPosts():', allPosts);
    console.log('Количество статей:', allPosts.length);
    
    // Фильтруем только опубликованные статьи
    const publishedPosts = allPosts.filter(post => 
      post.status === 'published'
    );
    
    console.log('Опубликованные статьи:', publishedPosts);
    console.log('Количество опубликованных статей:', publishedPosts.length);
    
    // Сортируем по дате публикации (новые сначала)
    publishedPosts.sort((a, b) => {
      const dateA = a.published_at ? new Date(a.published_at) : new Date(0);
      const dateB = b.published_at ? new Date(b.published_at) : new Date(0);
      return dateB - dateA;
    });
    
    res.json(publishedPosts);
  } catch (error) {
    console.error('Ошибка получения публичных статей:', error);
    res.status(500).json({ error: 'Ошибка загрузки статей' });
  }
});

module.exports = router;
