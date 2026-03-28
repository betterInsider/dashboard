// Simulated Database
export const DB = {
    users: [
        { id: 'u1', name: 'Admin', username: 'betterinside@admin', role: 'admin', avatar: 'https://ui-avatars.com/api/?name=Admin', skills: ['System Admin'] },
        { id: 'u2', name: 'Ayush Sahay', username: 'ayush@betterinside', role: 'employee', avatar: 'https://ui-avatars.com/api/?name=Ayush+Sahay', skills: ['Marketing', 'Research'] },
        { id: 'u3', name: 'Krishna Kumar', username: 'krishna@betterinside', role: 'employee', avatar: 'https://ui-avatars.com/api/?name=Krishna+Kumar', skills: ['Backend Developer'] },
        { id: 'u4', name: 'Ajay Kumar', username: 'ajay@betterinside', role: 'employee', avatar: 'https://ui-avatars.com/api/?name=Ajay+Kumar', skills: ['Backend Developer'] },
        { id: 'u5', name: 'Apurva Garg', username: 'apurva@betterinside', role: 'admin', avatar: 'https://ui-avatars.com/api/?name=Apurva+Garg', skills: ['Founder', 'Management'] },
        { id: 'u6', name: 'Rishabh Raj', username: 'rishabh@betterinside', role: 'admin', avatar: 'https://ui-avatars.com/api/?name=Rishabh+Raj', skills: ['Founder', 'Designer'] },
        { id: 'u7', name: 'Md Asif', username: 'md@betterinside', role: 'employee', avatar: 'https://ui-avatars.com/api/?name=Md+Asif', skills: ['Backend Developer'] }
    ],
    projects: [],
    tasks: [],
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
        values: []
    },
    milestones: [],
    tickets: []
};

// State Management Wrapper
export const AppState = {
    currentUser: null,

    normalizeDB() {
        DB.clients = this.getClients();
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
                this.currentUser = result.user;
                localStorage.setItem('currentUser', JSON.stringify(result.user));
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
        localStorage.removeItem('currentUser');
    },

    async init() {
        try {
            const userResp = await fetch('/api/current_user');
            if (userResp.ok) {
                const userResult = await userResp.json();
                if (userResult.success) {
                    this.currentUser = userResult.user;
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
            const resp = await fetch('/api/db?_t=' + Date.now(), { cache: 'no-store' });
            if (resp.ok) {
                const parsedDB = await resp.json();
                if (Object.keys(parsedDB).length > 0) {
                    Object.assign(DB, parsedDB);
                    this.normalizeDB();
                }
            }
        } catch (e) {
            console.error("Failed to load remote DB", e);
            // Fallback to local
            const savedDB = localStorage.getItem('betterInside_DB');
            if (savedDB) {
                const parsedDB = JSON.parse(savedDB);
                Object.assign(DB, parsedDB);
                this.normalizeDB();
            }
        }
    },

    updateCurrentUserAvatar(dataUrl) {
        if (!this.currentUser) return;

        const user = DB.users.find(u => u.id === this.currentUser.id);
        if (user) {
            user.avatar = dataUrl;
            this.currentUser.avatar = dataUrl;
            this.saveDB({
                users: [{
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    avatar: dataUrl
                }]
            });

            // Local UI refresh for avatar elements
            const sidebarAvatar = document.getElementById('sidebar-user-avatar');
            const headerAvatar = document.getElementById('header-user-avatar');
            if (sidebarAvatar) sidebarAvatar.src = dataUrl;
            if (headerAvatar) headerAvatar.src = dataUrl;
        }
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

        return { ...payload, ...overrides };
    },

    saveDB(overrides = {}) {
        this.normalizeDB();
        const payload = this.buildSyncPayload(overrides);
        fetch('/api/db', {
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
            }
        }).catch(err => console.error("Sync failed:", err));

        localStorage.setItem('betterInside_DB', JSON.stringify(DB));
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

    addMilestoneToTask(taskId, title, description, deadline) {
        const existing = this.getMilestonesForTask(taskId);
        const newMilestone = {
            id: 'm' + Date.now(),
            taskId: String(taskId),
            title,
            description: description || '',
            deadline: deadline || '',
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
        DB.clients = DB.clients.filter((item) => String(item.id) !== String(clientId));

        if (client) {
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

            DB.projects = DB.projects.map((project) => {
                if (project.client !== client.name) return project;
                return {
                    ...project,
                    client: 'Internal Delivery'
                };
            });
        }

        this.saveDB();
    },

    addContract(clientName, projectDetails, amount, date, clientId = '') {
        const newContract = {
            id: 'con' + Date.now(),
            clientId: clientId || 'c_temp',
            clientName,
            projectDetails,
            amount,
            date
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
        const newProject = {
            id: 'p' + Date.now(),
            name: name,
            description: description || '',
            client: client ? client.name : 'Internal Delivery',
            status: 'Pending',
            dueDate: dueDate,
            progress: 0,
            team: DB.users.map(u => u.id) // Automatically add all active employees to the project
        };
        DB.projects.push(newProject);
        this.saveDB();
        return newProject;
    },

    addTicket(payload) {
        const now = Date.now();
        const newTicket = {
            id: 'tick' + now,
            title: payload.title,
            description: payload.description || '',
            ticketType: payload.ticketType || 'issue',
            priority: payload.priority || 'medium',
            status: 'open',
            createdBy: payload.createdBy,
            createdByName: payload.createdByName,
            clientId: payload.clientId || '',
            clientName: payload.clientName || '',
            projectId: payload.projectId || '',
            projectName: payload.projectName || '',
            createdAt: payload.createdAt || new Date().toLocaleDateString(),
            adminNote: ''
        };
        DB.tickets.unshift(newTicket);

        DB.users
            .filter((user) => user.role === 'admin' && user.id !== payload.createdBy)
            .forEach((admin) => {
                DB.notifications.unshift({
                    id: `n-${now}-${admin.id}`,
                    type: 'ticket',
                    message: `New ${newTicket.ticketType} ticket raised: "${newTicket.title}"`,
                    time: 'Just now',
                    read: false,
                    userId: admin.id
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

    addTask(title, desc, assignTo, projectId, priority, milestoneList = []) {
        const newTask = {
            id: 't' + Date.now(),
            projectId,
            title: title,
            description: desc,
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
                deadline: ms.deadline,
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
                avatar: u.avatar,
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
    }
};
