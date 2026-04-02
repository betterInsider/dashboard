import { DB, AppState } from './data.js';
import { Components } from './components.js';

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('sidebar-toggle-btn');
const logoIcon = document.querySelector('.sidebar-header .logo-icon');
const mobileBtn = document.getElementById('mobile-menu-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const logoutBtns = document.querySelectorAll('#logout-btn, #dropdown-logout');

const mainNav = document.getElementById('main-nav');
const contentArea = document.getElementById('content-area');
const pageTitle = document.getElementById('page-title');
const chatbotRoot = document.getElementById('chatbot-root');

// User details DOM
const sidebarAvatar = document.getElementById('sidebar-user-avatar');
const sidebarName = document.getElementById('sidebar-user-name');
const sidebarRole = document.getElementById('sidebar-user-role');
const headerAvatar = document.getElementById('header-user-avatar');
const dropdownName = document.getElementById('dropdown-user-name');
const dropdownRole = document.getElementById('dropdown-user-role');

// Interactions
const notifBtn = document.getElementById('notif-btn');
const notifDropdown = document.querySelector('.notification-dropdown');
const profileBtn = document.getElementById('profile-btn');
const profileMenu = document.querySelector('.profile-menu');
const globalSearchInput = document.getElementById('global-search-input');
const globalSearchResults = document.getElementById('global-search-results');
const confirmModalOverlay = document.getElementById('confirm-modal-overlay');
const confirmModalTitle = document.getElementById('confirm-modal-title');
const confirmModalMessage = document.getElementById('confirm-modal-message');
const confirmModalClose = document.getElementById('confirm-modal-close');
const confirmModalCancel = document.getElementById('confirm-modal-cancel');
const confirmModalConfirm = document.getElementById('confirm-modal-confirm');

let confirmModalAction = null;
let chatWidgetState = null;

function getChatStorageKey() {
    return `betterInside_chat_widget_${AppState.currentUser?.id || 'guest'}`;
}

function formatChatTime(date = new Date()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function createAssistantMessage(sender, text, senderName) {
    return {
        id: `assistant-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        sender,
        senderName,
        text,
        time: formatChatTime()
    };
}

function createGlobalMessage(user, text, time = formatChatTime()) {
    return {
        id: `global-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        userId: user.id,
        name: user.name,
        text,
        time
    };
}

function buildDefaultGlobalMessages() {
    const currentUser = AppState.currentUser || { id: 'guest', name: 'Teammate' };
    const teammates = DB.users.filter((user) => String(user.id) !== String(currentUser.id));
    const firstTeammate = teammates[0] || { id: 'ops', name: 'Ops Team' };
    const secondTeammate = teammates[1] || { id: 'design', name: 'Design Team' };

    return [
        {
            id: 'global-seed-1',
            userId: firstTeammate.id,
            name: firstTeammate.name,
            text: 'Morning team. The client review deck is ready for comments before noon.',
            time: '09:12 AM'
        },
        {
            id: 'global-seed-2',
            userId: secondTeammate.id,
            name: secondTeammate.name,
            text: 'Perfect. I will drop visual revisions after the standup so everyone can review in one place.',
            time: '09:18 AM'
        },
        {
            id: 'global-seed-3',
            userId: currentUser.id,
            name: currentUser.name,
            text: 'I am using this mock global chat to sanity-check the new collaboration UI.',
            time: '09:23 AM'
        }
    ];
}

function getDefaultChatWidgetState() {
    const currentUser = AppState.currentUser || { id: 'guest', name: 'Teammate' };
    const participantList = DB.users.length
        ? DB.users.map((user) => ({ id: user.id, name: user.name, role: user.role }))
        : [{ id: currentUser.id, name: currentUser.name, role: 'employee' }];

    return {
        isOpen: false,
        activeTab: 'assistant',
        assistantTyping: false,
        assistantMessages: [
            {
                id: 'assistant-seed-1',
                sender: 'assistant',
                senderName: 'Better Assistant',
                text: `Hi ${currentUser.name.split(' ')[0] || 'there'}, I am ready as a UI mock. Future integrations can plug project search, summaries, and AI actions directly into this panel.`,
                time: 'Now'
            }
        ],
        globalMessages: buildDefaultGlobalMessages(),
        quickPrompts: [
            'Summarize my current workload',
            'Draft a client status update',
            'What should I prioritize today?'
        ],
        participants: participantList,
        unreadGlobalCount: 2,
        drafts: {
            assistant: '',
            global: ''
        }
    };
}

function loadChatWidgetState() {
    const baseState = getDefaultChatWidgetState();

    try {
        const savedState = JSON.parse(localStorage.getItem(getChatStorageKey()) || '{}');
        const savedUnreadCount = Number(savedState.unreadGlobalCount);
        return {
            ...baseState,
            isOpen: Boolean(savedState.isOpen),
            activeTab: savedState.activeTab === 'global' ? 'global' : 'assistant',
            assistantTyping: false,
            assistantMessages: Array.isArray(savedState.assistantMessages) && savedState.assistantMessages.length
                ? savedState.assistantMessages
                : baseState.assistantMessages,
            globalMessages: Array.isArray(savedState.globalMessages) && savedState.globalMessages.length
                ? savedState.globalMessages
                : baseState.globalMessages,
            unreadGlobalCount: Number.isFinite(savedUnreadCount) ? savedUnreadCount : baseState.unreadGlobalCount,
            drafts: {
                assistant: '',
                global: ''
            }
        };
    } catch (error) {
        return baseState;
    }
}

function persistChatWidgetState() {
    if (!AppState.currentUser || !chatWidgetState) return;

    localStorage.setItem(getChatStorageKey(), JSON.stringify({
        isOpen: chatWidgetState.isOpen,
        activeTab: chatWidgetState.activeTab,
        assistantMessages: chatWidgetState.assistantMessages,
        globalMessages: chatWidgetState.globalMessages,
        unreadGlobalCount: chatWidgetState.unreadGlobalCount
    }));
}

function syncChatWidgetScroll() {
    const assistantMessages = document.getElementById('chatbot-assistant-messages');
    const globalMessages = document.getElementById('chatbot-global-messages');

    if (assistantMessages) {
        assistantMessages.scrollTop = assistantMessages.scrollHeight;
    }
    if (globalMessages) {
        globalMessages.scrollTop = globalMessages.scrollHeight;
    }
}

function focusActiveChatInput() {
    if (!chatWidgetState?.isOpen) return;

    const activeInput = document.getElementById(
        chatWidgetState.activeTab === 'global'
            ? 'chatbot-global-input'
            : 'chatbot-assistant-input'
    );

    if (activeInput) {
        activeInput.focus();
        activeInput.setSelectionRange(activeInput.value.length, activeInput.value.length);
    }
}

function renderChatWidget({ focusInput = false } = {}) {
    if (!chatbotRoot || !AppState.currentUser || !chatWidgetState) {
        if (chatbotRoot) chatbotRoot.innerHTML = '';
        return;
    }

    chatbotRoot.innerHTML = Components.renderChatbotWidget(chatWidgetState);
    bindChatWidgetEvents();

    const assistantInput = document.getElementById('chatbot-assistant-input');
    const globalInput = document.getElementById('chatbot-global-input');
    if (assistantInput) assistantInput.value = chatWidgetState.drafts.assistant || '';
    if (globalInput) globalInput.value = chatWidgetState.drafts.global || '';

    requestAnimationFrame(() => {
        syncChatWidgetScroll();
        if (focusInput) focusActiveChatInput();
    });
}

function initializeChatWidget() {
    if (!AppState.currentUser) {
        chatWidgetState = null;
        if (chatbotRoot) chatbotRoot.innerHTML = '';
        return;
    }

    chatWidgetState = loadChatWidgetState();
    renderChatWidget();
}

function setChatWidgetOpen(isOpen) {
    if (!chatWidgetState) return;
    chatWidgetState.isOpen = isOpen;
    persistChatWidgetState();
    renderChatWidget({ focusInput: isOpen });
}

function setChatWidgetTab(tab) {
    if (!chatWidgetState) return;
    chatWidgetState.activeTab = tab === 'global' ? 'global' : 'assistant';
    if (chatWidgetState.activeTab === 'global') {
        chatWidgetState.unreadGlobalCount = 0;
    }
    persistChatWidgetState();
    renderChatWidget({ focusInput: true });
}

function buildAssistantReply(prompt) {
    const normalizedPrompt = String(prompt || '').trim().toLowerCase();

    if (!normalizedPrompt) {
        return 'I am in mock mode right now, but the UI is ready for future assistant workflows and backend actions.';
    }

    if (/task|milestone|deadline|priority/.test(normalizedPrompt)) {
        return 'A live version can surface assigned tasks, upcoming deadlines, and suggested priorities directly from this workspace.';
    }

    if (/client|status|update|email/.test(normalizedPrompt)) {
        return 'This panel is set up for future client-facing drafting flows like status updates, meeting recaps, and polished replies.';
    }

    if (/project|progress|report|summary/.test(normalizedPrompt)) {
        return 'Once connected, I can turn project and task data into quick summaries, health signals, and next-step recommendations.';
    }

    if (/help|ticket|issue|support/.test(normalizedPrompt)) {
        return 'A backend integration could pull helpdesk context here so teams can triage tickets without leaving the dashboard.';
    }

    return 'This is a frontend-only demo, but the layout is ready for AI responses, tool calls, and company-wide assistant workflows.';
}

function handleAssistantPrompt(prompt) {
    const assistantInput = document.getElementById('chatbot-assistant-input');
    if (!assistantInput || !chatWidgetState) return;

    chatWidgetState.drafts.assistant = prompt;
    assistantInput.value = prompt;
    assistantInput.focus();
    assistantInput.setSelectionRange(prompt.length, prompt.length);
}

function handleAssistantSubmit(event) {
    event.preventDefault();
    if (!chatWidgetState || !AppState.currentUser) return;

    const input = document.getElementById('chatbot-assistant-input');
    const message = input?.value.trim();
    if (!message) return;

    chatWidgetState.assistantMessages.push(createAssistantMessage('user', message, AppState.currentUser.name));
    chatWidgetState.drafts.assistant = '';
    chatWidgetState.assistantTyping = true;
    chatWidgetState.isOpen = true;
    chatWidgetState.activeTab = 'assistant';
    persistChatWidgetState();
    renderChatWidget({ focusInput: true });

    window.setTimeout(() => {
        if (!chatWidgetState) return;
        chatWidgetState.assistantTyping = false;
        chatWidgetState.assistantMessages.push(createAssistantMessage('assistant', buildAssistantReply(message), 'Better Assistant'));
        persistChatWidgetState();
        renderChatWidget();
    }, 700);
}

function handleGlobalChatSubmit(event) {
    event.preventDefault();
    if (!chatWidgetState || !AppState.currentUser) return;

    const input = document.getElementById('chatbot-global-input');
    const message = input?.value.trim();
    if (!message) return;

    chatWidgetState.globalMessages.push(createGlobalMessage(AppState.currentUser, message));
    chatWidgetState.drafts.global = '';
    chatWidgetState.isOpen = true;
    chatWidgetState.activeTab = 'global';
    chatWidgetState.unreadGlobalCount = 0;
    persistChatWidgetState();
    renderChatWidget({ focusInput: true });
}

function bindChatWidgetEvents() {
    const toggleButton = document.getElementById('chatbot-toggle-btn');
    const closeButton = document.getElementById('chatbot-close-btn');
    const assistantForm = document.getElementById('chatbot-assistant-form');
    const globalForm = document.getElementById('chatbot-global-form');
    const assistantInput = document.getElementById('chatbot-assistant-input');
    const globalInput = document.getElementById('chatbot-global-input');

    toggleButton?.addEventListener('click', () => setChatWidgetOpen(!chatWidgetState?.isOpen));
    closeButton?.addEventListener('click', () => setChatWidgetOpen(false));
    assistantForm?.addEventListener('submit', handleAssistantSubmit);
    globalForm?.addEventListener('submit', handleGlobalChatSubmit);

    assistantInput?.addEventListener('input', (event) => {
        if (!chatWidgetState) return;
        chatWidgetState.drafts.assistant = event.target.value;
    });

    globalInput?.addEventListener('input', (event) => {
        if (!chatWidgetState) return;
        chatWidgetState.drafts.global = event.target.value;
    });

    chatbotRoot?.querySelectorAll('[data-chat-tab]').forEach((button) => {
        button.addEventListener('click', () => {
            setChatWidgetTab(button.dataset.chatTab);
        });
    });

    chatbotRoot?.querySelectorAll('[data-chat-prompt]').forEach((button) => {
        button.addEventListener('click', () => {
            handleAssistantPrompt(button.dataset.chatPrompt || '');
        });
    });
}

// Application Initialization
async function init() {
    await AppState.init();

    // Theme setup
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark-theme');
        document.documentElement.classList.add('light-theme');
    } else if (savedTheme === 'dark') {
        document.documentElement.classList.remove('light-theme');
        document.documentElement.classList.add('dark-theme');
    }
    const isDark = document.documentElement.classList.contains('dark-theme');
    updateThemeIcon(isDark);

    if (AppState.currentUser) {
        if (appScreen) showAppInfo();
        else if (window.location.pathname.startsWith('/login')) window.location.href = '/';
    } else {
        initializeChatWidget();
        if (loginScreen) {
            loginScreen.classList.add('active');
        } else if (window.location.pathname === '/') {
            window.location.href = '/login/';
        }
        if (appScreen) appScreen.classList.remove('active');
    }

    setupEventListeners();
}

// Routing & Links
const routes = {
    employee: [
        { id: 'dashboard', name: 'Dashboard', icon: 'bx-grid-alt', renderer: Components.renderDashboard },
        { id: 'projects', name: 'Projects', icon: 'bx-briefcase', renderer: Components.renderProjects },
        { id: 'tasks', name: 'Tasks Allotted', icon: 'bx-task', renderer: Components.renderTasks },
        { id: 'progress', name: 'Progress', icon: 'bx-trending-up', renderer: Components.renderProgress },
        { id: 'helpdesk', name: 'Helpdesk', icon: 'bx-support', renderer: Components.renderHelpdesk },
        { id: 'skills', name: 'Skills & Roles', icon: 'bx-award', renderer: Components.renderSkills },
        { id: 'about', name: 'About Company', icon: 'bx-buildings', renderer: Components.renderAboutCompany }
    ],
    admin: [
        { id: 'dashboard', name: 'Dashboard', icon: 'bx-grid-alt', renderer: Components.renderDashboard },
        { id: 'clients', name: 'Clients', icon: 'bx-user-circle', renderer: Components.renderClients },
        { id: 'projects', name: 'Projects', icon: 'bx-briefcase', renderer: Components.renderProjects },
        { id: 'tasks', name: 'Tasks Allotted', icon: 'bx-task', renderer: Components.renderTasks },
        { id: 'progress', name: 'Progress', icon: 'bx-trending-up', renderer: Components.renderProgress },
        { id: 'helpdesk', name: 'Helpdesk', icon: 'bx-support', renderer: Components.renderHelpdesk },
        { id: 'skills', name: 'Skills & Roles', icon: 'bx-award', renderer: Components.renderSkills },
        { id: 'credentials', name: 'Credentials', icon: 'bx-key', renderer: Components.renderCredentialsPage },
        { id: 'about', name: 'About Company', icon: 'bx-buildings', renderer: Components.renderAboutCompany }
    ]
};

function showAppInfo() {
    if (loginScreen) loginScreen.classList.remove('active');
    if (appScreen) appScreen.classList.add('active');

    const u = AppState.currentUser;
    sidebarAvatar.src = u.avatar;
    headerAvatar.src = u.avatar;
    sidebarName.textContent = u.name;
    dropdownName.textContent = u.name;
    sidebarRole.textContent = u.role.toUpperCase();
    dropdownRole.textContent = u.role.toUpperCase();

    buildNavigation(u.role);
    renderNotifications();

    navigateTo('dashboard', routes[u.role].find(r => r.id === 'dashboard').renderer);
    initializeChatWidget();
}

function buildNavigation(role) {
    if (!mainNav) return;
    mainNav.innerHTML = '';
    routes[role].forEach(r => {
        const li = document.createElement('li');
        li.innerHTML = `
            <a href="#" data-route="${r.id}">
                <i class='bx ${r.icon}'></i>
                <span class="link-name">${r.name}</span>
            </a>
            <span class="tooltip">${r.name}</span>
        `;
        li.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(r.id, r.renderer, r.name);
            document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
            li.querySelector('a').classList.add('active');

            // on mobile, close sidebar
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('mobile-active');
            }
        });
        mainNav.appendChild(li);
    });

    // activate first
    const firstA = mainNav.querySelector('a');
    if (firstA) firstA.classList.add('active');
}

let currentRouteId = 'dashboard';

function clearGlobalSearchResults() {
    if (!globalSearchResults) return;
    globalSearchResults.classList.remove('active');
    globalSearchResults.innerHTML = '';
}

function closeConfirmModal() {
    if (!confirmModalOverlay) return;
    confirmModalOverlay.classList.remove('show');
    setTimeout(() => {
        confirmModalOverlay.classList.remove('active');
    }, 150);
    confirmModalAction = null;
}

function showConfirmModal({ title, message, confirmLabel = 'Confirm', onConfirm }) {
    if (!confirmModalOverlay) {
        if (window.confirm(message)) onConfirm?.();
        return;
    }

    confirmModalTitle.textContent = title;
    confirmModalMessage.textContent = message;
    confirmModalConfirm.textContent = confirmLabel;
    confirmModalAction = onConfirm || null;
    confirmModalOverlay.classList.add('active');
    requestAnimationFrame(() => confirmModalOverlay.classList.add('show'));
}

function renderTaskChatMessages(task) {
    if (!task) return '';
    if (!task.comments || task.comments.length === 0) {
        return '<p style="color:var(--text-secondary); text-align:center; padding: 20px;">No messages yet. Start the conversation!</p>';
    }

    return task.comments.map((comment) => {
        const isMine = String(comment.senderId) === String(AppState.currentUser.id);
        const initials = (isMine ? AppState.currentUser.name : comment.sender).split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
        return `
            <div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:16px;${isMine ? 'flex-direction:row-reverse;' : ''}">
                <div style="width:32px;height:32px;border-radius:50%;background:${isMine ? 'var(--primary)' : '#475569'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;">${initials}</div>
                <div style="max-width:68%;">
                    <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;${isMine ? 'text-align:right;' : ''}">${isMine ? 'You' : comment.sender} &middot; ${comment.time}</div>
                    <div style="background:${isMine ? 'var(--primary)' : 'var(--bg-main)'};color:${isMine ? '#fff' : 'var(--text-primary)'};padding:10px 14px;border-radius:${isMine ? '16px 4px 16px 16px' : '4px 16px 16px 16px'};font-size:14px;line-height:1.5;word-break:break-word;border:1px solid ${isMine ? 'transparent' : 'var(--border)'}">
                        ${comment.text ? `<span>${comment.text}</span>` : ''}
                        ${comment.attachment ? `<div style="margin-top:8px;"><img src="${comment.attachment}" style="max-width:100%;border-radius:8px;"></div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function syncTaskChatView(taskId) {
    const task = DB.tasks.find((item) => String(item.id) === String(taskId));
    const container = document.getElementById('chat-messages-container');
    if (!task || !container) return;

    const wasNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
    container.innerHTML = renderTaskChatMessages(task);
    if (wasNearBottom) {
        container.scrollTop = container.scrollHeight;
    }
}

function handleSearchSelection(result) {
    clearGlobalSearchResults();
    if (globalSearchInput) globalSearchInput.value = '';

    if (result.type === 'client') {
        AppState.activeViewClientId = result.id;
        navigateTo('view-client', () => Components.renderClientDetailsPage(result.id), 'Client Details');
        return;
    }

    if (result.type === 'project') {
        AppState.activeViewProjectId = result.id;
        navigateTo('view-project', () => Components.renderProjectDetailsPage(result.id), 'Project Details');
        return;
    }

    if (result.type === 'task') {
        AppState.activeViewTaskId = result.id;
        navigateTo('view-task', () => Components.renderTaskDetailsPage(result.id), 'Task Details');
        bindTaskViewEvents();
        return;
    }

    if (result.type === 'ticket') {
        navigateTo('helpdesk', routes[AppState.currentUser.role].find((route) => route.id === 'helpdesk').renderer, 'Helpdesk');
        return;
    }

    if (result.type === 'contract') {
        navigateTo('clients', routes[AppState.currentUser.role].find((route) => route.id === 'clients').renderer, 'Clients');
    }
}

function renderGlobalSearchResults() {
    if (!globalSearchInput || !globalSearchResults || !AppState.currentUser) return;

    const query = globalSearchInput.value.trim();
    if (!query) {
        clearGlobalSearchResults();
        return;
    }

    const results = AppState.searchWorkspace(query);
    if (!results.length) {
        globalSearchResults.classList.add('active');
        globalSearchResults.innerHTML = `<div class="search-result-item" style="cursor:default;"><div><strong>No results</strong><small>Try a client, project, task, or helpdesk keyword.</small></div></div>`;
        return;
    }

    globalSearchResults.classList.add('active');
    globalSearchResults.innerHTML = results.map((result, index) => `
        <button type="button" class="search-result-item" data-index="${index}">
            <div>
                <strong>${result.title}</strong>
                <small>${result.subtitle}</small>
            </div>
            <span class="search-result-type">${result.type}</span>
        </button>
    `).join('');

    globalSearchResults.querySelectorAll('.search-result-item').forEach((button) => {
        button.addEventListener('click', () => {
            const selected = results[Number(button.dataset.index)];
            if (selected) handleSearchSelection(selected);
        });
    });
}

function navigateTo(routeId, renderFn, routeName = 'Dashboard') {
    if (!contentArea) return;
    clearGlobalSearchResults();
    currentRouteId = routeId;
    pageTitle.textContent = routeName;
    contentArea.innerHTML = renderFn();

    // Reattach listeners for dynamically rendered content
    if (routeId === 'dashboard') {
        renderCharts();

        // Attach link to dashboard buttons
        const btnProj = document.getElementById('dash-projects-btn');
        const btnTasksTodo = document.getElementById('dash-tasks-todo-btn');
        const btnTasksProg = document.getElementById('dash-tasks-prog-btn');
        const btnTasksDone = document.getElementById('dash-tasks-done-btn');

        const goToRoute = (targetRouteId) => {
            const role = AppState.currentUser.role;
            const r = routes[role].find(rt => rt.id === targetRouteId);
            if (r) {
                document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
                const navLink = document.querySelector(`.nav-links a[data-route="${targetRouteId}"]`);
                if (navLink) navLink.classList.add('active');
                navigateTo(r.id, r.renderer, r.name);
            }
        };

        if (btnProj) btnProj.addEventListener('click', () => goToRoute('projects'));
        if (btnTasksTodo) btnTasksTodo.addEventListener('click', () => goToRoute('tasks'));  
        if (btnTasksProg) btnTasksProg.addEventListener('click', () => goToRoute('progress'));
        if (btnTasksDone) btnTasksDone.addEventListener('click', () => goToRoute('tasks'));

    } else if (routeId === 'progress') {
        renderProgressChart();
    } else if (routeId === 'about') {
        document.getElementById('btn-create-doc')?.addEventListener('click', () => {
            navigateTo('create-doc', Components.renderCreateDocumentPage, 'Upload Document');
        });

        // Document Downloads
        const downloadBtns = document.querySelectorAll('.btn-download-doc');
        downloadBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const docId = btn.dataset.id;
                const doc = DB.companyInfo.documents.find(d => d.id === docId);
                if (doc) {
                    if (doc.content) {
                        const link = document.createElement('a');
                        link.href = doc.content;
                        link.download = `${doc.title}.${doc.type}`;
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                    } else {
                        alert(`Document is listed, but its file data is not available for download: ${doc.title}`);
                    }
                }
            });
        });
        
        // Document Deletes
        const deleteBtns = document.querySelectorAll('.btn-delete-doc');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const docId = btn.dataset.id;
                showConfirmModal({
                    title: 'Delete Document',
                    message: 'Delete this company document from the dashboard?',
                    confirmLabel: 'Delete',
                    onConfirm: () => {
                    DB.companyInfo.documents = DB.companyInfo.documents.filter(d => d.id !== docId);
                    AppState.saveDB();
                    navigateTo('about', Components.renderAboutCompany, 'About Company');
                    }
                });
            });
        });

    } else if (routeId === 'clients') {
        // btn-add-client → Add New Client form
        document.getElementById('btn-add-client')?.addEventListener('click', () => {
            navigateTo('add-client', () => `
                <div class="table-container" style="max-width:500px;margin:0 auto;">
                    <div class="section-header"><h2><i class='bx bx-user-plus'></i> Add New Client</h2></div>
                    <form id="add-client-form">
                        <div class="input-group"><label>Client Name</label><div class="input-wrapper"><input type="text" id="client-name" required placeholder="Company Name"></div></div>
                        <div class="input-group"><label>Contact Email</label><div class="input-wrapper"><input type="email" id="client-contact" required placeholder="email@example.com"></div></div>
                        <div style="display:flex;gap:15px;margin-top:30px;">
                            <button type="button" class="btn btn-secondary" id="btn-cancel-client" style="flex:1;">Cancel</button>
                            <button type="submit" class="btn btn-primary" style="flex:2;">Add Client</button>
                        </div>
                    </form>
                </div>`, 'Add New Client');
        });

        // Create Contract button — ID in component is btn-create-contract
        document.getElementById('btn-create-contract')?.addEventListener('click', () => {
            navigateTo('add-contract', Components.renderCreateContractPage, 'Create New Contract');
        });

        document.querySelectorAll('.btn-view-client').forEach((btn) => {
            btn.addEventListener('click', () => {
                AppState.activeViewClientId = btn.dataset.id;
                navigateTo('view-client', () => Components.renderClientDetailsPage(btn.dataset.id), 'Client Details');
            });
        });

    } else if (routeId === 'view-client') {
        document.getElementById('btn-back-clients')?.addEventListener('click', () => {
            AppState.activeViewClientId = null;
            navigateTo('clients', routes.admin.find((route) => route.id === 'clients').renderer, 'Clients');
        });

        document.getElementById('btn-delete-client-details')?.addEventListener('click', () => {
            window.deleteClient(document.getElementById('btn-delete-client-details').dataset.id);
        });

    } else if (routeId === 'credentials') {
        document.querySelectorAll('.btn-update-cred').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.dataset.id;
                const newUsername = document.getElementById(`user-${uid}`)?.value?.trim();
                const newRole = document.getElementById(`role-${uid}`)?.value;
                const newPassword = document.getElementById(`pass-${uid}`)?.value;

                // Update in local DB
                const user = DB.users.find(u => u.id === uid);
                if (user) {
                    if (newUsername) user.username = newUsername;
                    if (newRole) user.role = newRole;
                    if (newPassword) user.password = newPassword; // stored for sync only
                }

                // Send to Django backend directly
                fetch('/api/db', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': window.CSRF_TOKEN
                    },
                    body: JSON.stringify({ users: [{ id: uid, username: newUsername, role: newRole, password: newPassword || '' }] })
                }).then(async res => {
                    if (res.ok) {
                        alert(`✅ Updated successfully!`);
                    } else {
                        const txt = await res.text();
                        alert('Update failed: ' + txt);
                    }
                }).catch(err => alert('Error: ' + err));
            });
        });
    } else if (routeId === 'skills') {
        document.getElementById('btn-save-skill-updates')?.addEventListener('click', async () => {
            const updates = Array.from(document.querySelectorAll('.employee-skills-input')).map((input) => ({
                id: input.dataset.id,
                skills: input.value
                    .split(',')
                    .map((skill) => skill.trim())
                    .filter(Boolean)
            }));

            const result = await AppState.updateUserSkills(updates);
            if (!result.success) {
                alert(result.message || 'Skill update failed.');
                return;
            }

            navigateTo('skills', routes[AppState.currentUser.role].find((route) => route.id === 'skills').renderer, 'Skills & Roles');
            alert('Employee skills updated successfully.');
        });
    } else if (routeId === 'helpdesk') {
        document.getElementById('btn-create-ticket')?.addEventListener('click', () => {
            navigateTo('add-ticket', Components.renderCreateTicketPage, AppState.currentUser.role === 'admin' ? 'Assign Ticket' : 'Raise Ticket');
        });

        document.querySelectorAll('.ticket-status-select').forEach((select) => {
            select.addEventListener('change', () => {
                AppState.updateTicket(select.dataset.id, { status: select.value });
                navigateTo('helpdesk', routes[AppState.currentUser.role].find(r => r.id === 'helpdesk').renderer, 'Helpdesk');
            });
        });
    } else if (routeId === 'projects') {
        document.getElementById('btn-create-project')?.addEventListener('click', () => {
            navigateTo('add-project', Components.renderCreateProjectPage, 'Create New Project');
        });

        document.querySelectorAll('.btn-view-project').forEach((btn) => {
            btn.addEventListener('click', () => {
                AppState.activeViewProjectId = btn.dataset.id;
                navigateTo('view-project', () => Components.renderProjectDetailsPage(btn.dataset.id), 'Project Details');
            });
        });

        document.querySelectorAll('.btn-edit-project').forEach((btn) => {
            btn.addEventListener('click', () => {
                AppState.activeViewProjectId = btn.dataset.id;
                navigateTo('edit-project', () => Components.renderEditProjectPage(btn.dataset.id), 'Edit Project');
            });
        });
    } else if (routeId === 'view-project') {
        document.getElementById('btn-back-projects')?.addEventListener('click', () => {
            AppState.activeViewProjectId = null;
            navigateTo('projects', routes[AppState.currentUser.role].find((route) => route.id === 'projects').renderer, 'Projects');
        });

        document.getElementById('btn-open-edit-project')?.addEventListener('click', () => {
            const projectId = document.getElementById('btn-open-edit-project').dataset.id;
            AppState.activeViewProjectId = projectId;
            navigateTo('edit-project', () => Components.renderEditProjectPage(projectId), 'Edit Project');
        });
    } else if (routeId === 'tasks') {
        document.getElementById('btn-create-task')?.addEventListener('click', () => {
            navigateTo('add-task', Components.renderCreateTaskPage, 'Create New Task');
        });
        
        // Task Deletes (on list cards)
        document.querySelectorAll('.btn-delete-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
               e.stopPropagation();
               showConfirmModal({
                   title: 'Delete Task',
                   message: 'Delete this task from the task board?',
                   confirmLabel: 'Delete',
                   onConfirm: () => {
                   AppState.deleteTask(btn.dataset.id);
                   navigateTo('tasks', routes[AppState.currentUser.role].find(r => r.id === 'tasks').renderer, 'Tasks Allotted');
                   }
               });
            });
        });

        // View & Edit buttons
        document.querySelectorAll('.btn-view-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = btn.dataset.id;
                AppState.activeViewTaskId = taskId;
                navigateTo('view-task', () => Components.renderTaskDetailsPage(taskId), 'Task Details');
                bindTaskViewEvents();
            });
        });

        // Kanban cards click
        const cards = document.querySelectorAll('.task-card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                // don't trigger if clicked on a button inside the card
                if (e.target.closest('button')) return;
                
                const taskId = card.dataset.id;
                AppState.activeViewTaskId = taskId;
                navigateTo('view-task', () => Components.renderTaskDetailsPage(taskId), 'Task Details');
                bindTaskViewEvents();
            });
        });

        // Accept Buttons
        document.querySelectorAll('.btn-accept-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                AppState.acceptTask(btn.dataset.id);
                navigateTo('tasks', routes[AppState.currentUser.role].find(r => r.id === 'tasks').renderer, 'Tasks Allotted');
            });
        });
    } else if (routeId === 'add-project') {
        const dueDateInput = document.getElementById('fp-date');
        const dueDateTrigger = document.getElementById('fp-date-trigger');
        const today = new Date().toISOString().split('T')[0];

        const openDatePicker = () => {
            if (!dueDateInput) return;
            dueDateInput.focus();
            if (typeof dueDateInput.showPicker === 'function') {
                dueDateInput.showPicker();
            }
        };

        if (dueDateInput) dueDateInput.min = today;
        dueDateInput?.addEventListener('click', openDatePicker);
        dueDateTrigger?.addEventListener('click', openDatePicker);

        document.getElementById('project-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const result = AppState.addProject(
                document.getElementById('fp-name').value,
                document.getElementById('fp-client').value,
                document.getElementById('fp-date').value,
                document.getElementById('fp-desc').value
            );
            if (!result?.success) {
                alert(result?.message || 'Project could not be created.');
                return;
            }
            navigateTo('projects', routes.admin.find(r => r.id === 'projects').renderer, 'Projects');
        });
        document.getElementById('btn-cancel-project')?.addEventListener('click', () => {
            navigateTo('projects', routes.admin.find(r => r.id === 'projects').renderer, 'Projects');
        });
    } else if (routeId === 'edit-project') {
        const dueDateInput = document.getElementById('edit-project-date');
        if (dueDateInput) dueDateInput.min = new Date().toISOString().split('T')[0];

        document.getElementById('edit-project-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const projectId = e.currentTarget.dataset.id;
            const result = AppState.updateProject(projectId, {
                name: document.getElementById('edit-project-name').value,
                description: document.getElementById('edit-project-desc').value,
                clientId: document.getElementById('edit-project-client').value,
                dueDate: document.getElementById('edit-project-date').value,
                status: document.getElementById('edit-project-status').value,
                progress: document.getElementById('edit-project-progress').value
            });

            if (!result?.success) {
                alert(result?.message || 'Project could not be updated.');
                return;
            }

            AppState.activeViewProjectId = projectId;
            navigateTo('view-project', () => Components.renderProjectDetailsPage(projectId), 'Project Details');
        });

        document.getElementById('btn-cancel-edit-project')?.addEventListener('click', () => {
            const projectId = document.getElementById('edit-project-form')?.dataset.id;
            if (!projectId) return;
            AppState.activeViewProjectId = projectId;
            navigateTo('view-project', () => Components.renderProjectDetailsPage(projectId), 'Project Details');
        });
    } else if (routeId === 'add-client') {
        document.getElementById('add-client-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            AppState.addClient(
                document.getElementById('client-name').value,
                document.getElementById('client-contact').value
            );
            navigateTo('clients', routes.admin.find(r => r.id === 'clients').renderer, 'Clients');
        });
        document.getElementById('btn-cancel-client')?.addEventListener('click', () => {
            navigateTo('clients', routes.admin.find(r => r.id === 'clients').renderer, 'Clients');
        });
    } else if (routeId === 'add-task') {
        document.getElementById('task-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Collect milestones if any
            const msRows = document.querySelectorAll('.milestone-entry-row');
            const milestones = Array.from(msRows).map((row, i) => ({
                title: row.querySelector('.ms-title').value,
                startDate: row.querySelector('.ms-start-date').value,
                deliveryDate: row.querySelector('.ms-delivery-date').value,
                order: i
            })).filter((milestone) => milestone.title.trim() !== '');

            const invalidMilestone = milestones.find((milestone) => milestone.startDate && milestone.deliveryDate && milestone.startDate > milestone.deliveryDate);
            if (invalidMilestone) {
                alert('Milestone delivery date cannot be earlier than the milestone start date.');
                return;
            }

            AppState.addTask(
                document.getElementById('ft-title').value,
                document.getElementById('ft-desc').value,
                document.getElementById('ft-assignee').value,
                document.getElementById('ft-project').value,
                document.getElementById('ft-priority').value,
                milestones
            );
            navigateTo('tasks', routes.admin.find(r => r.id === 'tasks').renderer, 'Tasks Allotted');
        });
        document.getElementById('btn-cancel-task')?.addEventListener('click', () => {
            navigateTo('tasks', routes.admin.find(r => r.id === 'tasks').renderer, 'Tasks Allotted');
        });
        // Milestone adding logic
        document.getElementById('btn-add-milestone-field')?.addEventListener('click', () => {
            const container = document.getElementById('milestones-container');
            const div = document.createElement('div');
            div.className = 'milestone-entry-row';
            div.style = 'display:grid; grid-template-columns: 1.2fr 1fr 1fr auto; gap:10px; margin-bottom:10px;';
            div.innerHTML = `
                <input type="text" class="ms-title" placeholder="Milestone Title" style="padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-primary);">
                <input type="date" class="ms-start-date" style="padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-primary);">
                <input type="date" class="ms-delivery-date" style="padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-primary);">
                <button type="button" class="btn-remove-ms" style="background:none; border:none; color:#ff4d4d; cursor:pointer; font-size:20px;"><i class='bx bx-x-circle'></i></button>
            `;
            div.querySelector('.btn-remove-ms').onclick = () => div.remove();
            container.appendChild(div);
        });
    } else if (routeId === 'add-contract') {
        const contractDateInput = document.getElementById('fc-date');
        const contractClientInput = document.getElementById('fc-client');
        const contractContactInput = document.getElementById('fc-contact');
        const contractStartDateInput = document.getElementById('fc-start-date');
        const contractEndDateInput = document.getElementById('fc-end-date');
        const today = new Date().toISOString().split('T')[0];

        if (contractDateInput) contractDateInput.max = today;
        if (contractStartDateInput) contractStartDateInput.min = today;
        if (contractEndDateInput) contractEndDateInput.min = today;

        const syncSelectedClient = () => {
            const clientId = contractClientInput?.value;
            const client = AppState.getClientById(clientId);
            if (contractContactInput) {
                contractContactInput.value = client?.contact || '';
            }
        };

        contractClientInput?.addEventListener('change', syncSelectedClient);

        document.getElementById('contract-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const clientId = document.getElementById('fc-client').value;
            const client = DB.clients.find((item) => item.id === clientId || item.name === clientId);
            const clientName = client?.name || clientId;

            if (contractStartDateInput?.value && contractEndDateInput?.value && contractStartDateInput.value > contractEndDateInput.value) {
                alert('Contract end date cannot be earlier than the start date.');
                return;
            }

            const newC = AppState.addContract({
                clientId,
                clientName,
                clientContact: document.getElementById('fc-contact').value,
                projectDetails: document.getElementById('fc-project').value,
                serviceScope: document.getElementById('fc-scope').value,
                amount: document.getElementById('fc-amount').value,
                date: document.getElementById('fc-date').value,
                startDate: document.getElementById('fc-start-date').value,
                endDate: document.getElementById('fc-end-date').value,
                paymentTerms: document.getElementById('fc-payment-terms').value,
                termsAndConditions: document.getElementById('fc-terms').value
            });
            // Generate & download the PDF, then go back to clients
            window.downloadContract(newC.id);
            navigateTo('clients', routes[AppState.currentUser.role].find(r => r.id === 'clients').renderer, 'Clients');
        });
        document.getElementById('btn-cancel-contract')?.addEventListener('click', () => {
            navigateTo('clients', routes[AppState.currentUser.role].find(r => r.id === 'clients').renderer, 'Clients');
        });
    } else if (routeId === 'add-ticket') {
        document.getElementById('ticket-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const clientId = document.getElementById('ticket-client').value;
            const projectId = document.getElementById('ticket-project').value;
            const client = AppState.getClientById(clientId);
            const project = DB.projects.find((item) => item.id === projectId);
            const assigneeId = document.getElementById('ticket-assignee')?.value || '';

            if (AppState.currentUser.role === 'admin' && !assigneeId) {
                alert('Please assign this helpdesk ticket to an employee.');
                return;
            }

            AppState.addTicket({
                title: document.getElementById('ticket-title').value.trim(),
                description: document.getElementById('ticket-description').value.trim(),
                ticketType: document.getElementById('ticket-type').value,
                priority: document.getElementById('ticket-priority').value,
                createdBy: AppState.currentUser.id,
                createdByName: AppState.currentUser.name,
                assignedTo: assigneeId,
                clientId,
                clientName: client?.name || '',
                projectId,
                projectName: project?.name || '',
                createdAt: new Date().toLocaleDateString()
            });

            navigateTo('helpdesk', routes[AppState.currentUser.role].find(r => r.id === 'helpdesk').renderer, 'Helpdesk');
        });
        document.getElementById('btn-cancel-ticket')?.addEventListener('click', () => {
            navigateTo('helpdesk', routes[AppState.currentUser.role].find(r => r.id === 'helpdesk').renderer, 'Helpdesk');
        });
    } else if (routeId === 'create-doc') {
        const formEl = document.getElementById('doc-form');
        const fileInput = document.getElementById('fd-file');
        const previewWrap = document.getElementById('file-info-preview');
        const previewInfo = document.getElementById('fd-detected-info');

        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (!file) {
                if (previewWrap) previewWrap.style.display = 'none';
                return;
            }

            const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'file';
            if (previewInfo) {
                previewInfo.textContent = `${file.name} (${ext.toUpperCase()} • ${formatFileSize(file.size)})`;
            }
            if (previewWrap) previewWrap.style.display = 'block';
        });

        formEl?.addEventListener('submit', (e) => {
            e.preventDefault();

            const file = fileInput?.files?.[0];
            const title = document.getElementById('fd-title')?.value?.trim();
            if (!title || !file) {
                alert('Please add a document title and select a file.');
                return;
            }

            const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'file';
            const reader = new FileReader();
            reader.onload = (ev) => {
                AppState.addDocument(
                    title,
                    ext,
                    formatFileSize(file.size),
                    ev.target?.result || null
                );
                navigateTo('about', Components.renderAboutCompany, 'About Company');
            };
            reader.onerror = () => {
                alert('Could not upload this file. Please try again.');
            };
            reader.readAsDataURL(file);
        });

        document.getElementById('btn-cancel-doc')?.addEventListener('click', () => {
            navigateTo('about', Components.renderAboutCompany, 'About Company');
        });
    } else if (routeId === 'profile') {
        const uploadEl = document.getElementById('profile-upload');
        const previewEl = document.getElementById('profile-preview-large');
        const formEl = document.getElementById('profile-settings-form');
        
        let pendingAvatarData = null;

        uploadEl?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    pendingAvatarData = ev.target.result;
                    previewEl.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        formEl?.addEventListener('submit', (e) => {
            e.preventDefault();
            if (pendingAvatarData) {
                AppState.updateCurrentUserAvatar(pendingAvatarData);
                alert('Profile picture updated successfully! ✨');
            }
            navigateTo('dashboard', routes[AppState.currentUser.role].find(r => r.id === 'dashboard').renderer, 'Dashboard Overview');
        });

        document.getElementById('btn-cancel-profile')?.addEventListener('click', () => {
             navigateTo('dashboard', routes[AppState.currentUser.role].find(r => r.id === 'dashboard').renderer, 'Dashboard Overview');
        });
    }
}

// ---- Task Specific Events ----
window.bindTaskViewEvents = function() {
    // Back button - correct ID from component
    document.getElementById('btn-back-to-tasks')?.addEventListener('click', () => {
        AppState.activeViewTaskId = null;
        navigateTo('tasks', routes[AppState.currentUser.role].find(r => r.id === 'tasks').renderer, 'Tasks Allotted');
    });

    // Admin - Mark Complete
    document.getElementById('btn-mark-done')?.addEventListener('click', () => {
        AppState.updateTaskStatus(AppState.activeViewTaskId, 'done');
        alert('Task marked as complete! ✅');
        navigateTo('view-task', () => Components.renderTaskDetailsPage(AppState.activeViewTaskId), 'Task Details');
        bindTaskViewEvents();
    });

    // Admin - Delete Task
    document.getElementById('btn-delete-task')?.addEventListener('click', () => {
        showConfirmModal({
            title: 'Delete Task',
            message: 'Delete this task permanently?',
            confirmLabel: 'Delete',
            onConfirm: () => {
            AppState.deleteTask(AppState.activeViewTaskId);
            AppState.activeViewTaskId = null;
            navigateTo('tasks', routes[AppState.currentUser.role].find(r => r.id === 'tasks').renderer, 'Tasks Allotted');
            }
        });
    });

    // Chat: file attach (correct ID = chat-file)
    const chatFileInput = document.getElementById('chat-file');
    const chatFilePreview = document.getElementById('chat-file-preview');
    const chatFileName = document.getElementById('chat-file-name');
    const chatFileRemove = document.getElementById('chat-file-remove');
    let pendingAttachment = null;

    chatFileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                pendingAttachment = ev.target.result;
                if (chatFilePreview) chatFilePreview.style.display = 'block';
                if (chatFileName) chatFileName.textContent = file.name;
            };
            reader.readAsDataURL(file);
        }
    });

    chatFileRemove?.addEventListener('click', () => {
        pendingAttachment = null;
        if (chatFilePreview) chatFilePreview.style.display = 'none';
        if (chatFileName) chatFileName.textContent = '';
        if (chatFileInput) chatFileInput.value = '';
    });

    // Chat: send message
    const chatForm = document.getElementById('chat-form');
    chatForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = document.getElementById('chat-input').value.trim();
        if (!text && !pendingAttachment) return;

        AppState.addCommentToTask(AppState.activeViewTaskId, AppState.currentUser.id, text, pendingAttachment);

        // Reset
        document.getElementById('chat-input').value = '';
        pendingAttachment = null;
        if (chatFilePreview) chatFilePreview.style.display = 'none';
        if (chatFileName) chatFileName.textContent = '';
        if (chatFileInput) chatFileInput.value = '';

        syncTaskChatView(AppState.activeViewTaskId);
        const container = document.getElementById('chat-messages-container');
        if (container) container.scrollTop = container.scrollHeight;
    });

    // Save Task Description form
    const taskDetailsForm = document.getElementById('task-details-form');
    taskDetailsForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const desc = document.getElementById('f-task-desc').value;
        AppState.updateTaskDetails(AppState.activeViewTaskId, desc, undefined);
        alert('Description saved! ✅');
        navigateTo('view-task', () => Components.renderTaskDetailsPage(AppState.activeViewTaskId), 'Task Details');
        bindTaskViewEvents();
    });

    const milestoneProofState = {};
    const addMilestoneBtn = document.getElementById('btn-add-inline-milestone');
    const addMilestoneForm = document.getElementById('inline-milestone-form');
    const saveMilestoneBtn = document.getElementById('btn-save-inline-milestone');
    const cancelMilestoneBtn = document.getElementById('btn-cancel-inline-milestone');

    addMilestoneBtn?.addEventListener('click', () => {
        if (addMilestoneForm) addMilestoneForm.style.display = 'block';
    });

    cancelMilestoneBtn?.addEventListener('click', () => {
        if (addMilestoneForm) addMilestoneForm.style.display = 'none';
        const titleInput = document.getElementById('inline-ms-title');
        const descInput = document.getElementById('inline-ms-desc');
        const startDateInput = document.getElementById('inline-ms-start-date');
        const deliveryDateInput = document.getElementById('inline-ms-delivery-date');
        if (titleInput) titleInput.value = '';
        if (descInput) descInput.value = '';
        if (startDateInput) startDateInput.value = '';
        if (deliveryDateInput) deliveryDateInput.value = '';
    });

    saveMilestoneBtn?.addEventListener('click', () => {
        const title = document.getElementById('inline-ms-title')?.value?.trim();
        const description = document.getElementById('inline-ms-desc')?.value?.trim();
        const startDate = document.getElementById('inline-ms-start-date')?.value;
        const deliveryDate = document.getElementById('inline-ms-delivery-date')?.value;

        if (!title) {
            alert('Please enter a milestone title.');
            return;
        }

        if (startDate && deliveryDate && startDate > deliveryDate) {
            alert('Milestone delivery date cannot be earlier than the start date.');
            return;
        }

        AppState.addMilestoneToTask(AppState.activeViewTaskId, title, description, startDate, deliveryDate);
        navigateTo('view-task', () => Components.renderTaskDetailsPage(AppState.activeViewTaskId), 'Task Details');
        bindTaskViewEvents();
    });

    document.querySelectorAll('.milestone-proof-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            const milestoneId = input.dataset.id;
            if (!file || !milestoneId) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                milestoneProofState[milestoneId] = {
                    image: ev.target?.result || '',
                    name: file.name
                };

                const preview = document.querySelector(`.milestone-proof-preview[data-id="${milestoneId}"]`);
                const previewImg = preview?.querySelector('img');
                const previewName = preview?.querySelector('.milestone-proof-name');
                if (preview) preview.style.display = 'block';
                if (previewImg) previewImg.src = milestoneProofState[milestoneId].image;
                if (previewName) previewName.textContent = file.name;
            };
            reader.readAsDataURL(file);
        });
    });

    // Employee: Start Milestone
    document.querySelectorAll('.btn-start-milestone').forEach(btn => {
        btn.addEventListener('click', () => {
            AppState.updateMilestone(btn.dataset.id, { status: 'in-progress' });
            navigateTo('view-task', () => Components.renderTaskDetailsPage(AppState.activeViewTaskId), 'Task Details');
            bindTaskViewEvents();
        });
    });

    // Employee: Submit Milestone for Review
    document.querySelectorAll('.btn-submit-milestone').forEach(btn => {
        btn.addEventListener('click', () => {
            const milestoneId = btn.dataset.id;
            const milestone = DB.milestones.find(m => String(m.id) === String(milestoneId));
            const proofInput = document.querySelector(`.milestone-proof-input[data-id="${milestoneId}"]`);
            const proofNote = document.querySelector(`.milestone-proof-note[data-id="${milestoneId}"]`);
            const stagedProof = milestoneProofState[milestoneId];
            const proofImage = stagedProof?.image || milestone?.proofImage;
            const proofName = stagedProof?.name || milestone?.proofName || proofInput?.files?.[0]?.name || '';
            const submissionNote = proofNote?.value?.trim() || '';

            if (!proofImage) {
                alert('Please upload a screenshot before submitting this milestone for review.');
                return;
            }

            AppState.updateMilestone(btn.dataset.id, {
                status: 'pending',
                submittedAt: new Date().toLocaleDateString(),
                proofImage,
                proofName,
                submissionNote,
                adminFeedback: ''
            });
            navigateTo('view-task', () => Components.renderTaskDetailsPage(AppState.activeViewTaskId), 'Task Details');
            bindTaskViewEvents();
        });
    });

    // Admin: Approve Milestone
    document.querySelectorAll('.btn-approve-milestone').forEach(btn => {
        btn.addEventListener('click', () => {
            AppState.updateMilestone(btn.dataset.id, {
                status: 'approved',
                adminFeedback: ''
            });
            navigateTo('view-task', () => Components.renderTaskDetailsPage(AppState.activeViewTaskId), 'Task Details');
            bindTaskViewEvents();
        });
    });

    // Admin: Reject Milestone
    document.querySelectorAll('.btn-reject-milestone').forEach(btn => {
        btn.addEventListener('click', () => {
            const feedback = prompt('Enter reason for rejection:');
            if (feedback !== null) {
                AppState.updateMilestone(btn.dataset.id, {
                    status: 'rejected',
                    adminFeedback: feedback,
                    submittedAt: null
                });
                navigateTo('view-task', () => Components.renderTaskDetailsPage(AppState.activeViewTaskId), 'Task Details');
                bindTaskViewEvents();
            }
        });
    });
}

// ---- Global action helpers (used by inline onclick= in components) ----
window.deleteContract = function(contractId) {
    showConfirmModal({
        title: 'Delete Contract',
        message: 'Delete this contract permanently?',
        confirmLabel: 'Delete',
        onConfirm: () => {
        AppState.deleteContract(contractId);
        navigateTo('clients', routes[AppState.currentUser.role].find(r => r.id === 'clients').renderer, 'Clients');
        }
    });
};

window.deleteClient = function(clientId) {
    showConfirmModal({
        title: 'Delete Client',
        message: 'Delete this client permanently? This will remove its contracts and unlink related tickets.',
        confirmLabel: 'Delete',
        onConfirm: () => {
            const result = AppState.deleteClient(clientId);
            if (result?.blocked) {
                alert(`This client cannot be deleted yet because ${result.projects.length} project(s) still depend on it. Reassign or remove those projects first.`);
                return;
            }
            navigateTo('clients', routes[AppState.currentUser.role].find(r => r.id === 'clients').renderer, 'Clients');
        }
    });
};

window.deleteProject = function(projectId) {
    showConfirmModal({
        title: 'Delete Project',
        message: 'Delete this project permanently? All associated tasks will remain.',
        confirmLabel: 'Delete',
        onConfirm: () => {
        DB.projects = DB.projects.filter(p => p.id !== projectId);
        AppState.saveDB();
        navigateTo('projects', routes[AppState.currentUser.role].find(r => r.id === 'projects').renderer, 'Projects');
        }
    });
};

// ---- Contract Generation (PDF) ----
window.downloadContract = function (contractId) {
    const c = DB.contracts.find(x => x.id === contractId);
    if (!c) return;

    // populate template
    document.getElementById('c-date').textContent = c.date;
    document.getElementById('c-id').textContent = c.id;
    document.getElementById('c-client-name').textContent = c.clientName;
    document.getElementById('c-client-contact').textContent = c.clientContact || 'Not provided';
    document.getElementById('c-project').textContent = c.projectDetails;
    document.getElementById('c-service-scope').textContent = c.serviceScope || 'Detailed scope will be defined in the attached statement of work.';
    document.getElementById('c-amount').textContent = c.amount;
    document.getElementById('c-start-date').textContent = c.startDate || 'TBD';
    document.getElementById('c-end-date').textContent = c.endDate || 'TBD';
    document.getElementById('c-payment-terms').textContent = c.paymentTerms || 'Payment schedule to be agreed by both parties.';
    document.getElementById('c-terms').textContent = c.termsAndConditions || 'Both parties agree to follow the approved scope, timelines, and delivery responsibilities.';
    document.getElementById('c-client-sign').textContent = c.clientName;

    const el = document.getElementById('contract-pdf-template');
    if (!el) return;
    el.style.display = 'block';

    const opt = {
        margin: 0,
        filename: `Contract_${c.clientName}_${c.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(el).save().then(() => {
        el.style.display = 'none';
    });
}

// ---- Charts ----
function renderCharts() {
    const tasksCtx = document.getElementById('tasksChart')?.getContext('2d');
    const projectsCtx = document.getElementById('projectHealthChart')?.getContext('2d');
    if (!tasksCtx && !projectsCtx) return;

    const existing = Chart.getChart('tasksChart');
    if (existing) existing.destroy();
    const existingProjectChart = Chart.getChart('projectHealthChart');
    if (existingProjectChart) existingProjectChart.destroy();

    const isDark = document.documentElement.classList.contains('dark-theme');
    const textColor = isDark ? '#a0aec0' : '#4a5568';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    const tasks = AppState.getTasksForUser(AppState.currentUser.id);
    const projects = AppState.getProjectsForUser(AppState.currentUser.id);
    const todo = tasks.filter(t => t.status === 'todo').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const avgProjectProgress = projects.length ? Math.round(projects.reduce((sum, project) => sum + (Number(project.progress) || 0), 0) / projects.length) : 0;
    const openTickets = (AppState.currentUser.role === 'admin'
        ? DB.tickets
        : DB.tickets.filter((ticket) => ticket.createdBy === AppState.currentUser.id))
        .filter((ticket) => ticket.status !== 'resolved').length;
    const unreadNotifications = AppState.getUnreadNotificationCount(AppState.currentUser.id);

    if (tasksCtx) {
        new Chart(tasksCtx, {
            type: 'bar',
            data: {
                labels: ['Pending Tasks', 'In Progress', 'Completed', 'Open Tickets', 'Unread Alerts'],
                datasets: [
                    {
                        label: 'Current Count',
                        data: [todo, inProgress, completed, openTickets, unreadNotifications],
                        backgroundColor: ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#38bdf8'],
                        borderRadius: 12,
                        maxBarThickness: 44
                    },
                    {
                        type: 'line',
                        label: 'Context Trend',
                        data: [todo, inProgress, completed, projects.length, avgProjectProgress],
                        borderColor: isDark ? '#f8fafc' : '#0f172a',
                        backgroundColor: 'transparent',
                        pointBackgroundColor: '#ec4899',
                        pointBorderWidth: 0,
                        pointRadius: 4,
                        tension: 0.35
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor, font: { family: 'Outfit', size: 12 }, padding: 20, usePointStyle: true }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor }
                    }
                }
            }
        });
    }

    if (projectsCtx) {
        const projectLabels = projects.length ? projects.map((project) => project.name) : ['No Projects'];
        const projectData = projects.length ? projects.map((project) => Number(project.progress) || 0) : [0];

        new Chart(projectsCtx, {
            type: 'bar',
            data: {
                labels: projectLabels,
                datasets: [{
                    label: 'Progress %',
                    data: projectData,
                    borderRadius: 10,
                    backgroundColor: projectData.map((value) => value >= 75 ? '#10b981' : value >= 40 ? '#f59e0b' : '#ef4444')
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.parsed.x}% complete`
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            callback: (value) => `${value}%`
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: textColor }
                    }
                }
            }
        });
    }
}

function renderProgressChart() {
    const ctx = document.getElementById('progressChart')?.getContext('2d');
    if (!ctx) return;

    const existing = Chart.getChart('progressChart');
    if (existing) existing.destroy();

    const isDark = document.documentElement.classList.contains('dark-theme');
    const textColor = isDark ? '#a0aec0' : '#4a5568';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const canvas = ctx.canvas;
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height || 400);
    gradient.addColorStop(0, isDark ? 'rgba(236, 72, 153, 0.40)' : 'rgba(236, 72, 153, 0.30)');
    gradient.addColorStop(0.55, isDark ? 'rgba(99, 102, 241, 0.22)' : 'rgba(99, 102, 241, 0.16)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.03)');

    const tasks = AppState.getTasksForUser(AppState.currentUser.id);
    const formattedTasks = tasks.map((t, index) => ({
        label: (t.title && t.title.length > 12 ? t.title.substring(0, 12) + '...' : t.title) || `Task ${index + 1}`,
        fullLabel: t.title || `Task ${index + 1}`,
        value: Number(t.progress) || 0
    }));

    if (tasks.length === 0) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['No Tasks'],
                datasets: [{
                    data: [0],
                    borderColor: '#6366f1',
                    pointRadius: 0,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor }
                    }
                }
            }
        });
        return;
    }

    // Chart.js shows only a dot when there is a single point.
    // Add soft anchor points so 1-2 tasks still render like a wave.
    let chartPoints = [...formattedTasks];
    if (formattedTasks.length === 1) {
        const point = formattedTasks[0];
        chartPoints = [
            { label: '', fullLabel: '', value: Math.max(point.value - 18, 0), anchor: true },
            point,
            { label: '', fullLabel: '', value: Math.min(point.value + 12, 100), anchor: true }
        ];
    } else if (formattedTasks.length === 2) {
        chartPoints = [
            { label: '', fullLabel: '', value: Math.max(formattedTasks[0].value - 12, 0), anchor: true },
            ...formattedTasks,
            { label: '', fullLabel: '', value: Math.min(formattedTasks[1].value + 8, 100), anchor: true }
        ];
    }

    const labels = chartPoints.map(point => point.label);
    const data = chartPoints.map(point => point.value);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Progress (%)',
                data: data,
                borderColor: '#6366f1',
                backgroundColor: gradient,
                fill: true,
                tension: 0.42,
                cubicInterpolationMode: 'monotone',
                borderWidth: 3,
                pointRadius: chartPoints.map(point => point.anchor ? 0 : 4),
                pointHoverRadius: chartPoints.map(point => point.anchor ? 0 : 6),
                pointBackgroundColor: chartPoints.map(point => point.anchor ? 'transparent' : '#ffffff'),
                pointBorderColor: chartPoints.map(point => point.anchor ? 'transparent' : '#ec4899'),
                pointBorderWidth: chartPoints.map(point => point.anchor ? 0 : 2)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: gridColor },
                    ticks: {
                        color: textColor,
                        callback: (value) => `${value}%`
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: textColor,
                        maxRotation: 0,
                        callback: (_, index) => chartPoints[index]?.anchor ? '' : labels[index]
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? '#111827' : '#ffffff',
                    titleColor: isDark ? '#f8fafc' : '#111827',
                    bodyColor: isDark ? '#cbd5e1' : '#374151',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.15)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    filter: (tooltipItem) => !chartPoints[tooltipItem.dataIndex]?.anchor,
                    callbacks: {
                        title: (items) => {
                            const point = chartPoints[items[0]?.dataIndex];
                            return point?.fullLabel || '';
                        },
                        label: (context) => `Progress: ${context.parsed.y}%`
                    }
                }
            }
        }
    });
}

function resolveTaskFromNotification(notification) {
    if (!notification) return null;

    if (notification.taskId) {
        const byId = DB.tasks.find(t => String(t.id) === String(notification.taskId));
        if (byId) return byId;
    }

    const quotedTitleMatch = notification.message?.match(/"([^"]+)"/);
    if (quotedTitleMatch?.[1]) {
        const byQuotedTitle = DB.tasks.find(t => t.title === quotedTitleMatch[1]);
        if (byQuotedTitle) return byQuotedTitle;
    }

    const assignedTaskMatch = notification.message?.match(/assigned a new task:\s*(.+)$/i);
    if (assignedTaskMatch?.[1]) {
        const cleanedTitle = assignedTaskMatch[1].trim().replace(/^["']|["']$/g, '');
        const byLooseTitle = DB.tasks.find(t => t.title.trim().toLowerCase() === cleanedTitle.toLowerCase());
        if (byLooseTitle) return byLooseTitle;
    }

    return null;
}

function openNotificationTarget(notification) {
    if (notification?.type === 'ticket') {
        const helpdeskRoute = routes[AppState.currentUser.role]?.find(r => r.id === 'helpdesk');
        if (helpdeskRoute) {
            if (notifDropdown) notifDropdown.classList.remove('active');
            navigateTo(helpdeskRoute.id, helpdeskRoute.renderer, helpdeskRoute.name);
            return;
        }
    }

    const task = resolveTaskFromNotification(notification);
    if (task) {
        AppState.activeViewTaskId = task.id;
        if (notifDropdown) notifDropdown.classList.remove('active');
        navigateTo('view-task', () => Components.renderTaskDetailsPage(task.id), 'Task Details');
        bindTaskViewEvents();
        return;
    }

    const tasksRoute = routes[AppState.currentUser.role]?.find(r => r.id === 'tasks');
    if (tasksRoute) {
        if (notifDropdown) notifDropdown.classList.remove('active');
        navigateTo(tasksRoute.id, tasksRoute.renderer, tasksRoute.name);
    }
}

function renderNotifications() {
    const list = document.getElementById('notif-list');
    if (!list) return;
    const notifs = AppState.getNotificationsForUser(AppState.currentUser.id);
    const unread = AppState.getUnreadNotificationCount(AppState.currentUser.id);
    const badge = document.querySelector('.notification-wrapper .badge');

    if (badge) {
        badge.textContent = unread > 99 ? '99+' : String(unread);
        badge.style.display = unread > 0 ? 'flex' : 'none';
    }

    list.innerHTML = '';
    
    if (notifs.length === 0) {
        list.innerHTML = '<p class="empty-notif" style="padding:20px;text-align:center;color:var(--text-secondary);font-size:14px;">No new notifications</p>';
        return;
    }

    notifs.forEach(n => {
        const div = document.createElement('div');
        div.className = `notif-item ${n.read ? 'read' : 'unread'}`;
        div.style.cursor = 'pointer';
        div.innerHTML = `
            <div class="notif-content">
                <p>${n.message}</p>
                <span>${n.time}</span>
            </div>
            ${!n.read ? '<span class="unread-dot"></span>' : ''}
            <button class="delete-notif" data-id="${n.id}"><i class='bx bx-x'></i></button>
        `;
        div.addEventListener('click', () => {
            openNotificationTarget(n);
        });
        div.querySelector('.delete-notif').addEventListener('click', (e) => {
            e.stopPropagation();
            AppState.deleteNotification(n.id);
            renderNotifications();
        });
        list.appendChild(div);
    });
}

function formatFileSize(bytes) {
    if (!bytes || Number.isNaN(bytes)) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---- Listeners & Setup ----
function setupEventListeners() {
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Prevent login if DB failed to load
            if (!DB || !DB.users) {
                alert('Connection issue. Please try again.');
                return;
            }

            const success = await AppState.login(usernameInput.value, passwordInput.value);
            if (success) {
                window.location.href = '/';
            } else {
                alert('Invalid credentials!');
            }
        });
    }

    // Theme toggle
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isCurrentlyDark = document.documentElement.classList.contains('dark-theme');

            if (isCurrentlyDark) {
                document.documentElement.classList.remove('dark-theme');
                document.documentElement.classList.add('light-theme');
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.classList.remove('light-theme');
                document.documentElement.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark');
            }

            const isDarkNow = document.documentElement.classList.contains('dark-theme');
            updateThemeIcon(isDarkNow);

            // re-render charts so labels adapt color
            if (document.getElementById('tasksChart')) renderCharts();
            if (document.getElementById('progressChart')) renderProgressChart();
        });
    }

    // Sidebar Toggles
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar?.classList.toggle('collapsed');
        });
    }

    // Click on logo icon (collapsed state) to expand sidebar
    if (logoIcon) {
        logoIcon.addEventListener('click', () => {
            if (sidebar?.classList.contains('collapsed')) {
                sidebar.classList.remove('collapsed');
            }
        });
    }

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            sidebar?.classList.toggle('mobile-active');
        });
    }

    // Headers Dropdowns
    if (notifBtn) {
        notifBtn.addEventListener('click', () => {
            if (notifDropdown) {
                notifDropdown.classList.toggle('active');
                if (profileMenu) profileMenu.classList.remove('active');

                // Mark as read when opened
                AppState.markNotificationsRead(AppState.currentUser.id);
                renderNotifications();
            }
        });
    }

    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', () => {
            profileMenu.classList.toggle('active');
            if (notifDropdown) notifDropdown.classList.remove('active');
            
            // Add Listeners to Dropdown Menu Items
            const profileLink = profileMenu.querySelector('ul li:nth-child(1) a');
            const settingsLink = profileMenu.querySelector('ul li:nth-child(2) a');
            
            if (profileLink && !profileLink.hasAttribute('data-hooked')) {
                profileLink.setAttribute('data-hooked', 'true');
                profileLink.onclick = (e) => {
                    e.preventDefault();
                    navigateTo('profile', Components.renderProfileSettingsPage, 'Profile Settings');
                    profileMenu.classList.remove('active');
                };
            }
            if (settingsLink && !settingsLink.hasAttribute('data-hooked')) {
                settingsLink.setAttribute('data-hooked', 'true');
                settingsLink.onclick = (e) => {
                    e.preventDefault();
                    navigateTo('profile', Components.renderProfileSettingsPage, 'Profile Settings');
                    profileMenu.classList.remove('active');
                };
            }
        });
    }

    if (logoutBtns) {
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                await AppState.logout();
                window.location.href = '/login/';
            });
        });
    }

    globalSearchInput?.addEventListener('input', renderGlobalSearchResults);
    globalSearchInput?.addEventListener('focus', renderGlobalSearchResults);

    document.addEventListener('click', (event) => {
        if (globalSearchResults && globalSearchInput) {
            const clickedInsideSearch = event.target.closest('.search-bar');
            if (!clickedInsideSearch) {
                clearGlobalSearchResults();
            }
        }

        if (confirmModalOverlay && event.target === confirmModalOverlay) {
            closeConfirmModal();
        }
    });

    confirmModalClose?.addEventListener('click', closeConfirmModal);
    confirmModalCancel?.addEventListener('click', closeConfirmModal);
    confirmModalConfirm?.addEventListener('click', () => {
        const action = confirmModalAction;
        closeConfirmModal();
        action?.();
    });
}

function updateThemeIcon(isDark) {
    if (!themeToggleBtn) return;
    const icon = themeToggleBtn.querySelector('i');
    if (isDark) {
        if (icon) icon.className = 'bx bx-sun';
        const ln = themeToggleBtn.querySelector('.link-name');
        if (ln) ln.textContent = 'Light Mode';
    } else {
        if (icon) icon.className = 'bx bx-moon';
        const ln = themeToggleBtn.querySelector('.link-name');
        if (ln) ln.textContent = 'Dark Mode';
    }
}

// Start app
init();

// Global Sync Across Browser Tabs & Devices (Live Polling)
setInterval(async () => {
    if (!AppState.currentUser) return;
    // Never poll on credential/form pages to avoid SQLite lock contention
    const noPollingRoutes = ['credentials', 'add-project', 'add-task', 'add-client', 'add-contract', 'add-ticket', 'create-doc', 'profile'];
    if (noPollingRoutes.includes(currentRouteId)) return;
    try {
        const resp = await fetch('/api/db?_t=' + Date.now(), { cache: 'no-store' });
        if (!resp.ok) return;
        const parsedDB = await resp.json();

        // Fast diff
        const strOld = JSON.stringify(DB.tasks) + JSON.stringify(DB.notifications) + JSON.stringify(DB.tickets) + JSON.stringify(DB.clients) + JSON.stringify(DB.projects);
        Object.assign(DB, parsedDB);
        const strNew = JSON.stringify(DB.tasks) + JSON.stringify(DB.notifications) + JSON.stringify(DB.tickets) + JSON.stringify(DB.clients) + JSON.stringify(DB.projects);

        if (strOld === strNew) return; // Nothing relevant changed

        // Refresh UI if on relevant pages
        if (AppState.activeViewTaskId) {
            const chatIn = document.getElementById('chat-input');
            const isUserTyping = chatIn && document.activeElement === chatIn;
            const currentMsg = chatIn ? chatIn.value : '';

            if (currentRouteId === 'view-task' || isUserTyping) {
                syncTaskChatView(AppState.activeViewTaskId);
                if (isUserTyping && chatIn) {
                    chatIn.focus();
                    chatIn.value = currentMsg;
                }
            } else {
                navigateTo('view-task', () => Components.renderTaskDetailsPage(AppState.activeViewTaskId), 'Task Details');
                bindTaskViewEvents();
            }
        } else if (document.getElementById('page-title')) {
            // Only auto-refresh list views — never overwrite form pages
            const formPages = ['add-project', 'add-task', 'add-client', 'add-contract', 'add-ticket', 'create-doc', 'profile'];
            if (formPages.includes(currentRouteId)) return;

            if (currentRouteId === 'tasks') {
                navigateTo('tasks', routes[AppState.currentUser.role].find(r => r.id === 'tasks').renderer, 'Tasks Allotted');
            } else if (currentRouteId === 'projects') {
                navigateTo('projects', routes[AppState.currentUser.role].find(r => r.id === 'projects').renderer, 'Projects');
            } else if (currentRouteId === 'clients' && AppState.currentUser.role === 'admin') {
                navigateTo('clients', routes[AppState.currentUser.role].find(r => r.id === 'clients').renderer, 'Clients');
            } else if (currentRouteId === 'helpdesk' || currentRouteId === 'tickets') {
                navigateTo('helpdesk', routes[AppState.currentUser.role].find(r => r.id === 'helpdesk').renderer, 'Helpdesk');
            } else if (currentRouteId === 'dashboard') {
                navigateTo('dashboard', routes[AppState.currentUser.role].find(r => r.id === 'dashboard').renderer, 'Dashboard');
            }
        }
    } catch (err) { }
}, 5000);
