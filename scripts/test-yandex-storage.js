#!/usr/bin/env node
/**
 * Проверка доступа к Yandex Object Storage
 * Запуск: node scripts/test-yandex-storage.js
 * Или: cd backend && node -e "require('dotenv').config(); ..."
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const BUCKET = process.env.S3_BUCKET || 'olga-website-media';
const ENDPOINT = process.env.S3_ENDPOINT || 'https://storage.yandexcloud.net';

console.log('=== Проверка Yandex Object Storage ===\n');
console.log('S3_ENDPOINT:', process.env.S3_ENDPOINT || '(не задан, используется default)');
console.log('S3_BUCKET:', BUCKET);
console.log('S3_ACCESS_KEY:', process.env.S3_ACCESS_KEY ? '***задан***' : 'НЕ ЗАДАН');
console.log('S3_SECRET_KEY:', process.env.S3_SECRET_KEY ? '***задан***' : 'НЕ ЗАДАН');
console.log('');

// Тест публичного URL (без авторизации)
const testUrl = `${ENDPOINT.replace(/\/$/, '')}/${BUCKET}/`;
console.log('Тест публичного доступа к бакету:');
console.log('  URL:', testUrl);
console.log('  Откройте в браузере — должен открыться список или XML');
console.log('');
console.log('Пример URL видео (подставьте реальный key из API):');
console.log(`  ${ENDPOINT.replace(/\/$/, '')}/${BUCKET}/videos/1769616331549-1______________7min.mov`);
console.log('');
console.log('Полный аудит: guides/YANDEX_STORAGE_AUDIT.md');
