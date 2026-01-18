/**
 * Скрипт для генерации bcrypt хэша пароля
 * 
 * Использование:
 * node scripts/generate-password-hash.js your_password
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'admin123';

if (!password) {
    console.error('Использование: node generate-password-hash.js <password>');
    process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);

console.log('\n=== Генерация хэша пароля ===\n');
console.log('Пароль:', password);
console.log('Хэш:', hash);
console.log('\nSQL для обновления:');
console.log(`UPDATE users SET password = '${hash}' WHERE email = 'admin@example.com';\n`);
