/**
 * Страница чата: 1) личный с админом, 2) общий (история не видна вновь присоединившимся)
 */

let chatPollInterval = null;
const CHAT_POLL_INTERVAL_MS = 3000;
let currentMode = 'private'; // 'private' | 'general'
let currentThreadId = null;
let isAdminUser = false;

export default {
    render: async () => {
        const isAdminUser = window.getUserRole && window.getUserRole() === 'admin';
        const privateTabLabel = isAdminUser ? 'Чаты с учениками' : 'Чат с админом';

        return `
            <div id="chat-page">
                <div class="page-header">
                    <h1>Чат</h1>
                </div>

                <div class="chat-tabs">
                    <button type="button" class="chat-tab active" data-tab="private">${privateTabLabel}</button>
                    <button type="button" class="chat-tab" data-tab="general">Общий чат</button>
                </div>

                <div id="chatPrivatePanel" class="chat-panel">
                    <div class="chat-private-layout">
                        <div class="chat-threads-list" id="chatThreadsList"></div>
                        <div class="chat-main-area" id="chatPrivateMain">
                            <div class="chat-placeholder" id="chatPrivatePlaceholder">Выберите чат</div>
                            <div class="chat-messages-wrap" id="chatPrivateMessagesWrap" style="display: none;">
                                <div class="chat-messages" id="chatPrivateMessages"></div>
                                <form class="chat-form" id="chatPrivateForm">
                                    <textarea id="chatPrivateInput" placeholder="Напишите сообщение..." rows="2" maxlength="2000"></textarea>
                                    <button type="submit" class="btn btn-primary">Отправить</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="chatGeneralPanel" class="chat-panel" style="display: none;">
                    <div class="chat-container">
                        <div class="chat-messages" id="chatGeneralMessages">
                            <div class="chat-loading">Загрузка сообщений...</div>
                        </div>
                        <form class="chat-form" id="chatGeneralForm">
                            <textarea id="chatGeneralInput" placeholder="Напишите сообщение..." rows="2" maxlength="2000"></textarea>
                            <button type="submit" class="btn btn-primary">Отправить</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    init: async () => {
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = 'Чат';

        window.__chatCleanup = stopChatPolling;

        isAdminUser = window.getUserRole && window.getUserRole() === 'admin';

        setupTabs();
        const threads = await loadThreads();
        setupPrivateChatForm();
        setupGeneralChatForm();

        if (!isAdminUser && threads && threads.length > 0) {
            selectThread(threads[0].id);
        }

        startChatPolling();
    }
};

function setupTabs() {
    document.querySelectorAll('.chat-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.chat-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.getElementById('chatPrivatePanel').style.display = tab === 'private' ? 'block' : 'none';
            document.getElementById('chatGeneralPanel').style.display = tab === 'general' ? 'block' : 'none';

            currentMode = tab;
            if (tab === 'general') {
                loadGeneralMessages();
            } else {
                if (currentThreadId) loadPrivateMessages(currentThreadId);
            }
        });
    });
}

async function loadThreads() {
    const listEl = document.getElementById('chatThreadsList');
    const isAdminUser = window.getUserRole && window.getUserRole() === 'admin';

    try {
        const threads = await api.get('/admin/chat/threads');

        if (listEl) {
            if (isAdminUser) {
                listEl.style.display = '';
                listEl.innerHTML = threads.length === 0
                    ? '<div class="chat-threads-empty">Нет учеников</div>'
                    : threads.map(t => `
                        <button type="button" class="chat-thread-item" data-thread-id="${t.id}">
                            <span class="chat-thread-name">${escapeHtml(t.student_name || t.student_email || 'Ученик')}</span>
                        </button>
                    `).join('');

                listEl.querySelectorAll('.chat-thread-item').forEach(btn => {
                    btn.addEventListener('click', () => selectThread(parseInt(btn.dataset.threadId, 10)));
                });
            } else {
                listEl.style.display = 'none';
            }
        }

        return threads;
    } catch (error) {
        console.error('Ошибка загрузки чатов:', error);
        if (listEl) listEl.innerHTML = `<div class="chat-error">Ошибка: ${error.message}</div>`;
        return [];
    }
}

function selectThread(threadId) {
    currentThreadId = threadId;
    document.querySelectorAll('.chat-thread-item').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.threadId, 10) === threadId);
    });

    const placeholder = document.getElementById('chatPrivatePlaceholder');
    const wrap = document.getElementById('chatPrivateMessagesWrap');
    if (placeholder && wrap) {
        placeholder.style.display = 'none';
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.flex = '1';
    }
    loadPrivateMessages(threadId);
}

async function loadPrivateMessages(threadId) {
    const container = document.getElementById('chatPrivateMessages');
    if (!container || currentMode !== 'private' || currentThreadId !== threadId) return;

    try {
        const messages = await api.get(`/admin/chat/threads/${threadId}/messages`);
        renderMessages(container, messages, true);
    } catch (error) {
        console.error('Ошибка загрузки сообщений:', error);
        container.innerHTML = `<div class="chat-error">Ошибка: ${error.message}</div>`;
    }
}

async function loadGeneralMessages() {
    const container = document.getElementById('chatGeneralMessages');
    if (!container || currentMode !== 'general') return;

    try {
        const messages = await api.get('/admin/chat/general/messages');
        renderMessages(container, messages, false);
    } catch (error) {
        console.error('Ошибка загрузки сообщений:', error);
        container.innerHTML = `<div class="chat-error">Ошибка: ${error.message}</div>`;
    }
}

function renderMessages(container, messages, isPrivateChat) {
    if (!container) return;

    if (!messages || messages.length === 0) {
        if (isPrivateChat && !isAdminUser) {
            container.innerHTML = `
                <div class="chat-welcome-new">
                    <p class="chat-welcome-title">Добро пожаловать!</p>
                    <p class="chat-welcome-text">Напишите приветствие администратору — он отправит вам доступ к видеоурокам.</p>
                </div>
            `;
        } else if (isPrivateChat && isAdminUser) {
            container.innerHTML = '<div class="chat-empty">Ученик ещё не написал. Напишите ему первым.</div>';
        } else {
            container.innerHTML = '<div class="chat-empty">Пока нет сообщений. Напишите первым!</div>';
        }
        return;
    }

    container.innerHTML = messages.map(msg => `
        <div class="chat-message" data-id="${msg.id}">
            <div class="chat-message-header">
                <span class="chat-message-author">${escapeHtml(msg.user_name || 'Пользователь')}</span>
                <span class="chat-message-time">${formatChatTime(msg.created_at)}</span>
            </div>
            <div class="chat-message-text">${escapeHtml(msg.text)}</div>
        </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function formatChatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;

    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function setupPrivateChatForm() {
    const form = document.getElementById('chatPrivateForm');
    const input = document.getElementById('chatPrivateInput');
    if (!form || !input) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text || !currentThreadId) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        const orig = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';

        try {
            await api.post(`/admin/chat/threads/${currentThreadId}/messages`, { text });
            input.value = '';
            await loadPrivateMessages(currentThreadId);
        } catch (error) {
            alert('Ошибка: ' + (error.message || 'Ошибка сервера'));
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = orig;
        }
    });
}

function setupGeneralChatForm() {
    const form = document.getElementById('chatGeneralForm');
    const input = document.getElementById('chatGeneralInput');
    if (!form || !input) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        const orig = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';

        try {
            await api.post('/admin/chat/general/messages', { text });
            input.value = '';
            await loadGeneralMessages();
        } catch (error) {
            alert('Ошибка: ' + (error.message || 'Ошибка сервера'));
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = orig;
        }
    });
}

function startChatPolling() {
    stopChatPolling();
    chatPollInterval = setInterval(() => {
        if (currentMode === 'private' && currentThreadId) {
            loadPrivateMessages(currentThreadId);
        } else if (currentMode === 'general') {
            loadGeneralMessages();
        }
    }, CHAT_POLL_INTERVAL_MS);
}

function stopChatPolling() {
    if (chatPollInterval) {
        clearInterval(chatPollInterval);
        chatPollInterval = null;
    }
}
