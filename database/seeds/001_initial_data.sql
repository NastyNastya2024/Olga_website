-- Начальные данные для базы данных

-- Insert default roles
INSERT INTO roles (name, permissions) VALUES
('admin', '{"all": true}'::jsonb),
('student', '{"view_videos": true, "view_tariff": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Insert default pages
INSERT INTO pages (slug, title, content, status) VALUES
('home', 'Главная', 'Содержимое главной страницы', 'published'),
('videos', 'Видео', 'Страница с видео', 'published'),
('tours', 'Туры', 'Страница с турами', 'published'),
('club', 'Клуб', 'Описание клуба', 'published'),
('blog', 'Блог', 'Страница блога', 'published')
ON CONFLICT (slug) DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value) VALUES
('site_name', 'Olga Website'),
('email', 'info@olga-website.com'),
('phone', '+7 (999) 123-45-67'),
('instagram', ''),
('facebook', ''),
('youtube', ''),
('meta_title', 'Olga Website'),
('meta_description', 'Описание сайта')
ON CONFLICT (key) DO NOTHING;

-- Insert default admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt (10 rounds)
-- ВАЖНО: В продакшене нужно изменить пароль!
-- Для генерации нового хэша используйте: node scripts/generate-password-hash.js ваш_пароль
INSERT INTO users (email, password, name, role, status) VALUES
('admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin User', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;
