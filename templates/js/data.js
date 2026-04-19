export const DEFAULT_USER_AVATAR = '/static/Logos/Logo DP.png';

export function resolveUserAvatar(avatar = '') {
    const normalizedAvatar = String(avatar || '').trim();
    if (!normalizedAvatar || normalizedAvatar.includes('ui-avatars.com')) {
        return DEFAULT_USER_AVATAR;
    }
    return normalizedAvatar;
}

function normalizeUser(user = {}) {
    return {
        ...user,
        avatar: resolveUserAvatar(user.avatar)
    };
}

// Simulated Database
export const DB = {
    users: [
        { id: 'u1', name: 'Admin', username: 'betterinside@admin', role: 'admin', avatar: DEFAULT_USER_AVATAR, skills: ['System Admin'] },
        { id: 'u2', name: 'Ayush Sahay', username: 'ayush@betterinside', role: 'employee', avatar: DEFAULT_USER_AVATAR, skills: ['Marketing', 'Research'] },
        { id: 'u3', name: 'Krishna Kumar', username: 'krishna@betterinside', role: 'employee', avatar: DEFAULT_USER_AVATAR, skills: ['Backend Developer'] },
        { id: 'u4', name: 'Ajay Kumar', username: 'ajay@betterinside', role: 'employee', avatar: DEFAULT_USER_AVATAR, skills: ['Backend Developer'] },
        { id: 'u5', name: 'Apurva Garg', username: 'apurva@betterinside', role: 'admin', avatar: DEFAULT_USER_AVATAR, skills: ['Founder', 'Management'] },
        { id: 'u6', name: 'Rishabh Raj', username: 'rishabh@betterinside', role: 'admin', avatar: DEFAULT_USER_AVATAR, skills: ['Founder', 'Designer'] },
        { id: 'u7', name: 'Md Asif', username: 'md@betterinside', role: 'employee', avatar: DEFAULT_USER_AVATAR, skills: ['Backend Developer'] }
    ],
    projects: [],
    tasks: [],
    expenses: [],
    clients: [

    ],
    contracts: [],
    notifications: [],
    companyInfo: {
        name: 'Better Inside',
        tagline: 'Creative design, digital execution, and internal delivery in one operating system.',
        description: 'Better Inside is a creative and digital services company focused on brand systems, websites, design operations, and delivery management for growing clients.',
        founded: '2020',
        location: 'India',
        websiteDraftReference: 'Better Inside Homepage Design.pdf',
        coreServices: [],
        operatingModel: [],
        leadership: [],
        contactEmail: 'betterinside@admin',
        documents: [],
        companySnapshot: [],
        values: [],
        creatorProfile: {
            name: 'Krishna Singh',
            experience: 'Worked at TCS Bengalore',
            title: 'Fullstack Developer'
        }
    },
    milestones: [],
    tickets: []
};

// State Management Wrapper
export const AppState = {
    currentUser: null,
    activeViewTaskId: null,
    activeViewProjectId: null,
    activeViewClientId: null,

    normalizeDB() {
        DB.users = (DB.users || []).map(normalizeUser);
        DB.clients = this.getClients();
        DB.contracts = (DB.contracts || []).map((contract) => ({
            ...contract,
            clientId: contract.clientId || contract.client_id || '',
            clientName: String(contract.clientName || contract.client_name || '').trim(),
            clientContact: contract.clientContact || contract.client_contact || '',
            projectDetails: String(contract.projectDetails || contract.project_details || '').trim(),
            serviceScope: contract.serviceScope || contract.service_scope || '',
            amount: contract.amount || '',
            date: contract.date || '',
            startDate: contract.startDate || contract.start_date || '',
            endDate: contract.endDate || contract.end_date || '',
            paymentTerms: contract.paymentTerms || contract.payment_terms || '',
            termsAndConditions: contract.termsAndConditions || contract.terms_and_conditions || ''
        })).filter((contract) => contract.clientName && contract.projectDetails);
        DB.projects = DB.projects.map((project) => ({
            ...project,
            name: String(project.name || '').trim(),
            description: project.description || '',
            client: String(project.client || '').trim(),
            status: project.status || 'Pending',
            dueDate: project.dueDate || '',
            progress: Number(project.progress) || 0,
            team: Array.isArray(project.team) ? project.team : []
        })).filter((project) => project.name);
        DB.tasks = (DB.tasks || []).map((task) => ({
            ...task,
            projectId: task.projectId || task.project_id || '',
            title: String(task.title || '').trim(),
            description: task.description || '',
            dueDate: task.dueDate || task.due_date || '',
            assignedTo: String(task.assignedTo || task.assigned_to || ''),
            status: task.status || 'todo',
            accepted: Boolean(task.accepted),
            priority: task.priority || 'medium',
            progress: Number(task.progress) || 0,
            comments: Array.isArray(task.comments) ? task.comments : []
        })).filter((task) => task.title);
        DB.milestones = (DB.milestones || []).map((milestone) => ({
            ...milestone,
            taskId: String(milestone.taskId || milestone.task_id || ''),
            title: String(milestone.title || '').trim(),
            description: milestone.description || '',
            startDate: milestone.startDate || milestone.start_date || '',
            deliveryDate: milestone.deliveryDate || milestone.delivery_date || milestone.deadline || '',
            deadline: milestone.deliveryDate || milestone.delivery_date || milestone.deadline || '',
            status: milestone.status || 'not-started',
            adminFeedback: milestone.adminFeedback || milestone.admin_feedback || '',
            submittedAt: milestone.submittedAt || milestone.submitted_at || null,
            proofImage: milestone.proofImage || milestone.proof_image || null,
            proofName: milestone.proofName || milestone.proof_name || '',
            submissionNote: milestone.submissionNote || milestone.submission_note || ''
        })).filter((milestone) => milestone.taskId && milestone.title);
        DB.tickets = (DB.tickets || []).map((ticket) => ({
            ...ticket,
            ticketType: ticket.ticketType || ticket.ticket_type || 'issue',
            priority: ticket.priority || 'medium',
            status: ticket.status || 'open',
            createdBy: ticket.createdBy || ticket.created_by || '',
            createdByName: ticket.createdByName || ticket.created_by_name || '',
            assignedTo: ticket.assignedTo || ticket.assigned_to || '',
            assignedToName: ticket.assignedToName || ticket.assigned_to_name || '',
            clientId: ticket.clientId || ticket.client_id || '',
            clientName: ticket.clientName || ticket.client_name || '',
            projectId: ticket.projectId || ticket.project_id || '',
            projectName: ticket.projectName || ticket.project_name || '',
            createdAt: ticket.createdAt || ticket.created_at || '',
            adminNote: ticket.adminNote || ticket.admin_note || ''
        })).filter((ticket) => String(ticket.title || '').trim());
        DB.expenses = (DB.expenses || []).map((expense) => ({
            ...expense,
            id: expense.id || `exp-${Date.now()}`,
            title: String(expense.title || '').trim(),
            category: expense.category || 'operations',
            amount: Number(expense.amount) || 0,
            expenseDate: expense.expenseDate || expense.expense_date || '',
            notes: expense.notes || '',
            createdBy: String(expense.createdBy || expense.created_by || ''),
            createdByName: expense.createdByName || expense.created_by_name || ''
        })).filter((expense) => expense.title && expense.expenseDate);

        DB.notifications = DB.notifications
            .map((notification, index) => ({
                ...notification,
                id: notification.id || `notif-${index}-${notification.userId || 'global'}`,
                message: String(notification.message || '').trim(),
                time: notification.time || 'Just now',
                read: Boolean(notification.read),
                userId: String(notification.userId || '')
            }))
            .filter((notification) => notification.userId && notification.message)
            .reduce((acc, notification) => {
                const exists = acc.find((item) =>
                    String(item.userId) === String(notification.userId) &&
                    String(item.message) === String(notification.message) &&
                    String(item.time) === String(notification.time)
                );
                if (!exists) acc.push(notification);
                return acc;
            }, []);

        DB.companyInfo = {
            name: 'Better Inside',
            tagline: '',
            description: '',
            founded: '',
            location: '',
            websiteDraftReference: '',
            coreServices: [],
            operatingModel: [],
            leadership: [],
            contactEmail: '',
            documents: [],
            companySnapshot: [],
            values: [],
            creatorProfile: {
                name: 'Krishna Singh',
                experience: 'Worked at TCS Bengalore',
                title: 'Fullstack Developer'
            },
            ...(DB.companyInfo || {})
        };
    },

    async login(username, password) {
        try {
            const resp = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': window.CSRF_TOKEN
                },
                body: JSON.stringify({ username, password })
            });
            const result = await resp.json();
            if (result.success) {
                this.currentUser = normalizeUser(result.user);
                return true;
            }
        } catch (e) {
            console.error("Login failed:", e);
        }
        return false;
    },

    async logout() {
        try {
            await fetch('/api/logout');
        } catch (e) {
            console.error(e);
        }
        this.currentUser = null;
    },

    async init() {
        try {
            const userResp = await fetch('/api/current_user');
            if (userResp.ok) {
                const userResult = await userResp.json();
                if (userResult.success) {
                    this.currentUser = normalizeUser(userResult.user);
                } else {
                    this.currentUser = null;
                }
            } else {
                this.currentUser = null;
            }
        } catch (e) {
            console.warn('Failed to fetch current user from server', e);
            this.currentUser = null;
        }

        try {
            const resp = await fetch('/api/db');
            if (resp.ok) {
                const parsedDB = await resp.json();
                if (Object.keys(parsedDB).length > 0) {
                    Object.assign(DB, parsedDB);
                    this.normalizeDB();
                }
            }
        } catch (e) {
            console.error("Failed to load remote DB", e);
        }
    },

    async updateCurrentUserAvatar(dataUrl) {
        if (!this.currentUser) {
            return { success: false, message: 'No logged-in user found.' };
        }

        const user = DB.users.find(u => u.id === this.currentUser.id);
        if (user) {
            user.avatar = resolveUserAvatar(dataUrl);
            this.currentUser.avatar = resolveUserAvatar(dataUrl);

            const saveResult = await this.saveDB({
                users: [{
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    avatar: user.avatar
                }]
            });

            if (!saveResult.success) {
                return saveResult;
            }

            // Local UI refresh for avatar elements
            const sidebarAvatar = document.getElementById('sidebar-user-avatar');
            const headerAvatar = document.getElementById('header-user-avatar');
            if (sidebarAvatar) sidebarAvatar.src = user.avatar;
            if (headerAvatar) headerAvatar.src = user.avatar;

            return { success: true, avatar: user.avatar };
        }

        return { success: false, message: 'User record not found.' };
    },

    buildSyncPayload(overrides = {}) {
        const payload = {
            clients: DB.clients,
            projects: DB.projects,
            tasks: DB.tasks,
            contracts: DB.contracts,
            notifications: DB.notifications,
            tickets: DB.tickets,
            milestones: DB.milestones,
            companyInfo: {
                ...DB.companyInfo,
                documents: DB.companyInfo.documents
            }
        };

        if (this.currentUser?.role === 'admin') {
            payload.expenses = DB.expenses;
        }

        return { ...payload, ...overrides };
    },

    saveDB(overrides = {}) {
        this.normalizeDB();
        const payload = this.buildSyncPayload(overrides);
        const request = fetch('/api/db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': window.CSRF_TOKEN
            },
            body: JSON.stringify(payload)
        }).then(async (res) => {
            if (!res.ok) {
                const text = await res.text();
                console.error('saveDB failed:', res.status, text);
                return { success: false, message: `Sync failed with status ${res.status}.` };
            }
            return { success: true };
        }).catch(err => {
            console.error("Sync failed:", err);
            return { success: false, message: 'Network sync failed.' };
        });

        return request;
    },

    getTasksForUser(userId) {
        return DB.tasks.filter(t => t.assignedTo === userId || this.currentUser.role === 'admin');
    },

    getProjectsForUser(userId) {
        return DB.projects.filter(p => p.team.includes(userId) || this.currentUser.role === 'admin');
    },

    getNotificationsForUser(userId) {
        return DB.notifications
            .filter(n => String(n.userId) === String(userId))
            .sort((a, b) => String(b.id).localeCompare(String(a.id)));
    },

    getUnreadNotificationCount(userId) {
        return this.getNotificationsForUser(userId).filter((notification) => !notification.read).length;
    },

    getClients() {
        return DB.clients
            .map((client) => ({
                id: client.id || client.name,
                name: String(client.name || '').trim(),
                contact: client.contact || ''
            }))
            .filter((client) => client.name !== '')
            .reduce((acc, client) => {
                const exists = acc.find((item) => String(item.id).toLowerCase() === String(client.id).toLowerCase());
                if (!exists) acc.push(client);
                return acc;
            }, [])
            .sort((a, b) => a.name.localeCompare(b.name));
    },

    getClientById(clientId) {
        return this.getClients().find((client) => String(client.id) === String(clientId)) || null;
    },

    getProjectsCatalog() {
        return DB.projects
            .map((project) => ({
                id: project.id,
                name: project.name,
                client: project.client || '',
                status: project.status || 'Pending',
                dueDate: project.dueDate || '',
                progress: Number(project.progress) || 0
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    },

    getExpenses() {
        return [...(DB.expenses || [])].sort((a, b) => {
            const dateCompare = String(b.expenseDate || '').localeCompare(String(a.expenseDate || ''));
            if (dateCompare !== 0) return dateCompare;
            return String(b.id).localeCompare(String(a.id));
        });
    },

    getExpenseSummary() {
        const expenses = this.getExpenses();
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const currentMonthExpenses = expenses.filter((expense) => String(expense.expenseDate || '').startsWith(currentMonth));

        const monthlyTotals = expenses.reduce((acc, expense) => {
            const monthKey = String(expense.expenseDate || '').slice(0, 7);
            if (!monthKey) return acc;
            if (!acc[monthKey]) acc[monthKey] = 0;
            acc[monthKey] += Number(expense.amount) || 0;
            return acc;
        }, {});

        return {
            totalExpenseCount: expenses.length,
            totalAmount: expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0),
            currentMonthAmount: currentMonthExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0),
            currentMonthCount: currentMonthExpenses.length,
            monthlyTotals
        };
    },

    getProjectById(projectId) {
        return DB.projects.find((project) => String(project.id) === String(projectId)) || null;
    },

    addExpense(payload) {
        const title = String(payload.title || '').trim();
        const amount = Number(payload.amount);
        const expenseDate = payload.expenseDate || '';

        if (!title) {
            return { success: false, message: 'Expense title is required.' };
        }
        if (!expenseDate) {
            return { success: false, message: 'Expense date is required.' };
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            return { success: false, message: 'Enter a valid expense amount.' };
        }

        const newExpense = {
            id: `exp-${Date.now()}`,
            title,
            category: payload.category || 'operations',
            amount: Math.round(amount * 100) / 100,
            expenseDate,
            notes: String(payload.notes || '').trim(),
            createdBy: String(this.currentUser?.id || ''),
            createdByName: this.currentUser?.name || 'Admin'
        };
        DB.expenses.unshift(newExpense);
        this.saveDB();
        return { success: true, expense: newExpense };
    },

    deleteExpense(expenseId) {
        DB.expenses = DB.expenses.filter((expense) => String(expense.id) !== String(expenseId));
        this.saveDB();
    },

    updateProject(projectId, updates) {
        const project = this.getProjectById(projectId);
        if (!project) {
            return { success: false, message: 'Project not found.' };
        }

        if (updates.clientId !== undefined) {
            const client = this.getClientById(updates.clientId);
            if (!client) {
                return { success: false, message: 'Please select a valid active client.' };
            }
            project.client = client.name;
        }

        if (updates.name !== undefined) project.name = String(updates.name || '').trim();
        if (updates.description !== undefined) project.description = String(updates.description || '').trim();
        if (updates.status !== undefined) project.status = updates.status || 'Pending';
        if (updates.dueDate !== undefined) project.dueDate = updates.dueDate || '';
        if (updates.progress !== undefined) project.progress = Math.max(0, Math.min(100, Number(updates.progress) || 0));

        if (!project.name) {
            return { success: false, message: 'Project name is required.' };
        }

        this.saveDB();
        return { success: true, project };
    },

    searchWorkspace(query) {
        const term = String(query || '').trim().toLowerCase();
        if (!term) return [];

        const visibleProjects = this.getProjectsForUser(this.currentUser?.id || '');
        const visibleTasks = this.getTasksForUser(this.currentUser?.id || '');
        const visibleTickets = this.currentUser?.role === 'admin'
            ? DB.tickets
            : DB.tickets.filter((ticket) =>
                String(ticket.createdBy) === String(this.currentUser?.id) ||
                String(ticket.assignedTo) === String(this.currentUser?.id)
            );
        const results = [];

        const pushResult = (result) => {
            if (results.length < 8) results.push(result);
        };

        this.getClients().forEach((client) => {
            const haystack = `${client.name} ${client.contact}`.toLowerCase();
            if (haystack.includes(term) && this.currentUser?.role === 'admin') {
                pushResult({
                    type: 'client',
                    id: client.id,
                    title: client.name,
                    subtitle: client.contact || 'Client record',
                    routeName: 'Clients'
                });
            }
        });

        visibleProjects.forEach((project) => {
            const haystack = `${project.name} ${project.client} ${project.description} ${project.status}`.toLowerCase();
            if (haystack.includes(term)) {
                pushResult({
                    type: 'project',
                    id: project.id,
                    title: project.name,
                    subtitle: `${project.client || 'No client'} · ${project.status || 'Pending'}`,
                    routeName: 'Projects'
                });
            }
        });

        visibleTasks.forEach((task) => {
            const haystack = `${task.title} ${task.description} ${task.priority} ${task.status}`.toLowerCase();
            if (haystack.includes(term)) {
                pushResult({
                    type: 'task',
                    id: task.id,
                    title: task.title,
                    subtitle: `${task.priority} priority · ${task.status}`,
                    routeName: 'Tasks Allotted'
                });
            }
        });

        visibleTickets.forEach((ticket) => {
            const haystack = `${ticket.title} ${ticket.description} ${ticket.clientName} ${ticket.projectName} ${ticket.ticketType} ${ticket.status}`.toLowerCase();
            if (haystack.includes(term)) {
                pushResult({
                    type: 'ticket',
                    id: ticket.id,
                    title: ticket.title,
                    subtitle: `${ticket.ticketType} · ${ticket.status}`,
                    routeName: 'Helpdesk'
                });
            }
        });

        DB.contracts.forEach((contract) => {
            const haystack = `${contract.clientName} ${contract.projectDetails} ${contract.clientContact}`.toLowerCase();
            if (haystack.includes(term) && this.currentUser?.role === 'admin') {
                pushResult({
                    type: 'contract',
                    id: contract.id,
                    title: contract.projectDetails,
                    subtitle: `${contract.clientName} · Contract`,
                    routeName: 'Clients'
                });
            }
        });

        return results;
    },

    getMilestonesForTask(taskId) {
        return DB.milestones.filter(m => String(m.taskId) === String(taskId)).sort((a, b) => a.order - b.order);
    },

    updateMilestone(milestoneId, updates) {
        const m = DB.milestones.find(m => String(m.id) === String(milestoneId));
        if (m) {
            Object.assign(m, updates);
            // Auto-calculate task progress
            this.recalculateTaskProgress(m.taskId);
            this.saveDB();
        }
    },

    recalculateTaskProgress(taskId) {
        const task = DB.tasks.find(t => String(t.id) === String(taskId));
        if (task) {
            const ms = this.getMilestonesForTask(taskId);
            if (ms.length === 0) return;
            const approved = ms.filter(m => m.status === 'approved').length;
            task.progress = Math.round((approved / ms.length) * 100);
            if (task.progress === 100) {
                task.status = 'done';
            } else if (ms.some(m => ['in-progress', 'pending', 'approved', 'rejected'].includes(m.status))) {
                task.status = 'in-progress';
            } else {
                task.status = 'todo';
            }
        }
    },

    addMilestoneToTask(taskId, title, description, startDate, deliveryDate) {
        const existing = this.getMilestonesForTask(taskId);
        const newMilestone = {
            id: 'm' + Date.now(),
            taskId: String(taskId),
            title,
            description: description || '',
            startDate: startDate || '',
            deliveryDate: deliveryDate || '',
            deadline: deliveryDate || '',
            order: existing.length,
            status: 'not-started',
            adminFeedback: '',
            submittedAt: null,
            proofImage: null,
            proofName: '',
            submissionNote: ''
        };
        DB.milestones.push(newMilestone);
        this.recalculateTaskProgress(taskId);
        this.saveDB();
        return newMilestone;
    },

    deleteNotification(notifId) {
        DB.notifications = DB.notifications.filter(n => n.id !== notifId);
        this.saveDB();
    },

    markNotificationsRead(userId) {
        let changed = false;
        DB.notifications.forEach((notification) => {
            if (notification.userId === userId && !notification.read) {
                notification.read = true;
                changed = true;
            }
        });
        if (changed) this.saveDB();
    },

    addClient(name, contact) {
        const normalizedName = String(name || '').trim();
        if (!normalizedName) return null;

        const normalizedContact = String(contact || '').trim();
        const existing = this.getClients().find((client) => client.name.toLowerCase() === normalizedName.toLowerCase());
        if (existing) {
            if (normalizedContact && existing.contact !== normalizedContact) {
                const target = DB.clients.find((client) => String(client.id) === String(existing.id));
                if (target) target.contact = normalizedContact;
                this.saveDB();
            }
            return existing;
        }

        const newClient = {
            id: 'c' + Date.now(),
            name: normalizedName,
            contact: normalizedContact
        };
        DB.clients.push(newClient);
        this.saveDB();
        return newClient;
    },

    deleteClient(clientId) {
        const client = this.getClientById(clientId);
        if (!client) {
            return { success: false, message: 'Client not found.' };
        }

        const linkedProjects = DB.projects.filter((project) => String(project.client || '').trim().toLowerCase() === client.name.toLowerCase());
        if (linkedProjects.length) {
            return {
                success: false,
                blocked: true,
                message: 'This client is still linked to active projects.',
                projects: linkedProjects
            };
        }

        DB.clients = DB.clients.filter((item) => String(item.id) !== String(clientId));

        DB.contracts = DB.contracts.filter((contract) =>
            String(contract.clientId) !== String(clientId) && contract.clientName !== client.name
        );

        DB.tickets = DB.tickets.map((ticket) => {
            if (String(ticket.clientId) !== String(clientId)) return ticket;
            return {
                ...ticket,
                clientId: '',
                clientName: ''
            };
        });

        this.saveDB();
        return { success: true, client };
    },

    addContract(payload) {
        const newContract = {
            id: 'con' + Date.now(),
            clientId: payload.clientId || 'c_temp',
            clientName: payload.clientName,
            clientContact: payload.clientContact || '',
            projectDetails: payload.projectDetails,
            serviceScope: payload.serviceScope || '',
            amount: payload.amount,
            date: payload.date,
            startDate: payload.startDate || '',
            endDate: payload.endDate || '',
            paymentTerms: payload.paymentTerms || '',
            termsAndConditions: payload.termsAndConditions || ''
        };
        DB.contracts.push(newContract);
        this.saveDB();
        return newContract;
    },

    deleteContract(id) {
        DB.contracts = DB.contracts.filter(c => c.id !== id);
        this.saveDB();
    },

    addProject(name, clientId, dueDate, description) {
        const client = this.getClientById(clientId) || DB.clients.find(c => c.id === clientId || c.name === clientId);
        if (!client) {
            return { success: false, message: 'A valid client is required before creating a project.' };
        }
        const newProject = {
            id: 'p' + Date.now(),
            name: name,
            description: description || '',
            client: client.name,
            status: 'Pending',
            dueDate: dueDate,
            progress: 0,
            team: DB.users.map(u => u.id) // Automatically add all active employees to the project
        };
        DB.projects.push(newProject);
        this.saveDB();
        return { success: true, project: newProject };
    },

    addTicket(payload) {
        const now = Date.now();
        const assignedUser = payload.assignedTo
            ? DB.users.find((user) => String(user.id) === String(payload.assignedTo))
            : null;
        const newTicket = {
            id: 'tick' + now,
            title: payload.title,
            description: payload.description || '',
            ticketType: payload.ticketType || 'issue',
            priority: payload.priority || 'medium',
            status: 'open',
            createdBy: payload.createdBy,
            createdByName: payload.createdByName,
            assignedTo: payload.assignedTo || '',
            assignedToName: assignedUser?.name || payload.assignedToName || '',
            clientId: payload.clientId || '',
            clientName: payload.clientName || '',
            projectId: payload.projectId || '',
            projectName: payload.projectName || '',
            createdAt: payload.createdAt || new Date().toLocaleDateString(),
            adminNote: ''
        };
        DB.tickets.unshift(newTicket);

        const notificationTargets = payload.assignedTo
            ? DB.users.filter((user) => String(user.id) === String(payload.assignedTo))
            : DB.users.filter((user) => user.role === 'admin' && user.id !== payload.createdBy);

        notificationTargets.forEach((targetUser) => {
                DB.notifications.unshift({
                    id: `n-${now}-${targetUser.id}`,
                    type: 'ticket',
                    message: payload.assignedTo
                        ? `A helpdesk ticket was assigned to you: "${newTicket.title}"`
                        : `New ${newTicket.ticketType} ticket raised: "${newTicket.title}"`,
                    time: 'Just now',
                    read: false,
                    userId: targetUser.id
                });
            });

        this.saveDB();
        return newTicket;
    },

    updateTicket(ticketId, updates) {
        const ticket = DB.tickets.find((item) => item.id === ticketId);
        if (!ticket) return;
        Object.assign(ticket, updates);
        this.saveDB();
    },

    deleteTicket(ticketId) {
        DB.tickets = DB.tickets.filter((item) => item.id !== ticketId);
        this.saveDB();
    },

    addTask(title, desc, assignTo, projectId, priority, dueDate = '', milestoneList = []) {
        const newTask = {
            id: 't' + Date.now(),
            projectId,
            title: title,
            description: desc,
            dueDate: dueDate || '',
            assignedTo: assignTo,
            status: 'todo',
            accepted: false,
            priority: priority,
            progress: 0,
            comments: []
        };
        DB.tasks.push(newTask);

        milestoneList.forEach((ms, index) => {
            DB.milestones.push({
                id: 'm' + Date.now() + index,
                taskId: newTask.id,
                title: ms.title,
                description: ms.description,
                startDate: ms.startDate || '',
                deliveryDate: ms.deliveryDate || ms.deadline || '',
                deadline: ms.deliveryDate || ms.deadline || '',
                order: index,
                status: 'not-started',
                adminFeedback: '',
                submittedAt: null
            });
        });

        // create notification
        DB.notifications.unshift({
            id: `n-task-${Date.now()}-${assignTo}`,
            type: 'task',
            message: `You were assigned a new task: "${title}"`,
            time: 'Just now',
            read: false,
            userId: assignTo
        });

        this.saveDB();
        return newTask;
    },

    updateTaskStatus(taskId, status) {
        const t = DB.tasks.find(t => t.id === taskId);
        if (t) {
            t.status = status;
            this.saveDB();
        }
    },

    deleteTask(taskId) {
        DB.tasks = DB.tasks.filter(t => t.id !== taskId);
        this.saveDB();
    },

    acceptTask(taskId) {
        const t = DB.tasks.find(t => t.id === taskId);
        if (t) {
            t.accepted = true;
            this.saveDB();
        }
    },

    updateTaskDetails(taskId, newDesc, newProgress) {
        const t = DB.tasks.find(t => t.id === taskId);
        if (t) {
            if (newDesc !== undefined) t.description = newDesc;
            if (newProgress !== undefined) t.progress = newProgress;
            this.saveDB();
        }
    },

    addDocument(title, type, size, content) {
        const newDoc = {
            id: 'doc' + Date.now(),
            title: title,
            type: type,
            size: size,
            content: content
        };
        DB.companyInfo.documents.push(newDoc);
        this.saveDB();
        return newDoc;
    },

    deleteDocument(docId) {
        DB.companyInfo.documents = DB.companyInfo.documents.filter(d => d.id !== docId);
        this.saveDB();
    },

    addCommentToTask(taskId, userId, text, attachmentStr) {
        const t = DB.tasks.find(t => String(t.id) === String(taskId));
        const u = DB.users.find(u => String(u.id) === String(userId));
        if (t && u) {
            t.comments.push({
                senderId: userId,
                sender: u.name,
                avatar: resolveUserAvatar(u.avatar),
                text: text,
                attachment: attachmentStr || null,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            this.saveDB();
        }
    },

    updateCredential(userId, newUsername, newPassword, newRole) {
        const user = DB.users.find(u => u.id === userId);
        if (user) {
            user.username = newUsername;
            if (newPassword) user.password = newPassword;
            user.role = newRole;
            this.saveDB();
        }
    },

    async updateUserSkills(skillUpdates = []) {
        if (!Array.isArray(skillUpdates) || skillUpdates.length === 0) {
            return { success: false, message: 'No skill changes provided.' };
        }

        skillUpdates.forEach((update) => {
            const user = DB.users.find((item) => String(item.id) === String(update.id));
            if (user) {
                user.skills = Array.isArray(update.skills) ? update.skills : [];
                if (this.currentUser && String(this.currentUser.id) === String(user.id)) {
                    this.currentUser.skills = user.skills;
                }
            }
        });

        try {
            const resp = await fetch('/api/db', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': window.CSRF_TOKEN
                },
                body: JSON.stringify({
                    users: skillUpdates.map((update) => ({
                        id: update.id,
                        skills: update.skills
                    }))
                })
            });

            if (!resp.ok) {
                const text = await resp.text();
                return { success: false, message: text || 'Skill update failed.' };
            }

            return { success: true };
        } catch (error) {
            return { success: false, message: String(error) };
        }
    }
};
