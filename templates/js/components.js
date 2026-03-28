import { DB, AppState } from './data.js';

export const Components = {
    // ---- Dashboard Overview ----
    renderDashboard() {
        const user = AppState.currentUser;
        const tasks = AppState.getTasksForUser(user.id);
        const projects = AppState.getProjectsForUser(user.id);
        const tickets = user.role === 'admin'
            ? DB.tickets
            : DB.tickets.filter((ticket) => ticket.createdBy === user.id);
        const todoCount = tasks.filter(t => t.status === 'todo').length;
        const inProgCount = tasks.filter(t => t.status === 'in-progress').length;
        const doneCount = tasks.filter(t => t.status === 'done').length;
        const avgProgress = tasks.length ? Math.round(tasks.reduce((sum, task) => sum + (Number(task.progress) || 0), 0) / tasks.length) : 0;
        const activeProjects = projects.filter((project) => !['completed', 'done'].includes(String(project.status || '').toLowerCase())).length;
        const openTickets = tickets.filter((ticket) => ticket.status !== 'resolved').length;
        const unreadNotifications = AppState.getUnreadNotificationCount(user.id);
        const deliveryHealth = projects.length ? Math.round(projects.reduce((sum, project) => sum + (Number(project.progress) || 0), 0) / projects.length) : avgProgress;
        const projectRows = projects.slice(0, 6).map((project) => `
            <tr>
                <td>
                    <strong>${project.name}</strong><br>
                    <small style="color:var(--text-secondary)">${project.client || 'Internal'}</small>
                </td>
                <td><span class="status ${String(project.status || 'pending').toLowerCase().replace(' ', '-')}">${project.status || 'Pending'}</span></td>
                <td>
                    <div class="mini-progress">
                        <div class="mini-progress-bar" style="width:${Number(project.progress) || 0}%"></div>
                    </div>
                    <small style="color:var(--text-secondary)">${Number(project.progress) || 0}% complete</small>
                </td>
                <td>${project.dueDate || 'TBD'}</td>
            </tr>
        `).join('');
        const spotlightItems = [
            { label: 'Delivery Health', value: `${deliveryHealth}%`, note: 'Across active project execution' },
            { label: 'Open Tickets', value: String(openTickets), note: 'Issues and suggestions awaiting closure' },
            { label: 'Unread Alerts', value: String(unreadNotifications), note: 'Fresh admin or task notifications' }
        ];

        return `
            <div class="dashboard-grid dashboard-metrics-grid">
                <div class="stat-card primary dashboard-action-card" id="dash-projects-btn">
                    <div class="stat-card-info">
                        <h3>Total Projects</h3>
                        <h2>${projects.length}</h2>
                        <p>${activeProjects} currently active</p>
                    </div>
                    <div class="stat-card-icon"><i class='bx bx-briefcase'></i></div>
                </div>
                <div class="stat-card warning dashboard-action-card" id="dash-tasks-todo-btn">
                    <div class="stat-card-info">
                        <h3>Pending Tasks</h3>
                        <h2>${todoCount}</h2>
                        <p>${tasks.length} assigned in total</p>
                    </div>
                    <div class="stat-card-icon"><i class='bx bx-notepad'></i></div>
                </div>
                <div class="stat-card info dashboard-action-card" id="dash-tasks-prog-btn">
                    <div class="stat-card-info">
                        <h3>In Progress</h3>
                        <h2>${inProgCount}</h2>
                        <p>Average completion ${avgProgress}%</p>
                    </div>
                    <div class="stat-card-icon"><i class='bx bx-loader-alt bx-spin-hover'></i></div>
                </div>
                <div class="stat-card success dashboard-action-card" id="dash-tasks-done-btn">
                    <div class="stat-card-info">
                        <h3>Completed</h3>
                        <h2>${doneCount}</h2>
                        <p>${openTickets} open tickets</p>
                    </div>
                    <div class="stat-card-icon"><i class='bx bx-check-circle'></i></div>
                </div>
            </div>

            <div class="dashboard-hero-panel">
                <div class="dashboard-hero-copy">
                    <span class="company-kicker">Operations Pulse</span>
                    <h2>${user.role === 'admin' ? 'Company-wide delivery visibility' : 'Your delivery cockpit'} with live projects, tasks, and support signals.</h2>
                    <p>Track work volume, compare project momentum, and spot risks quickly without jumping between tabs.</p>
                </div>
                <div class="dashboard-spotlight-grid">
                    ${spotlightItems.map((item) => `
                        <div class="spotlight-card">
                            <span>${item.label}</span>
                            <strong>${item.value}</strong>
                            <small>${item.note}</small>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="dashboard-chart-grid">
                <div class="chart-container">
                    <div class="section-header">
                        <h3>Workload Analytics</h3>
                    </div>
                    <div class="analytics-chart-wrap">
                        <canvas id="tasksChart"></canvas>
                    </div>
                </div>
                <div class="chart-container">
                    <div class="section-header">
                        <h3>Project Progress Matrix</h3>
                    </div>
                    <div class="analytics-chart-wrap compact">
                        <canvas id="projectHealthChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="dashboard-detail-grid">
                <div class="table-container">
                    <div class="section-header">
                        <h3>Current Delivery Snapshot</h3>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Status</th>
                                <th>Progress</th>
                                <th>Due</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${projectRows || `
                                <tr>
                                    <td colspan="4" style="text-align:center; color:var(--text-secondary); padding:24px;">No projects available yet.</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
                <div class="table-container">
                    <div class="section-header">
                        <h3>Execution Summary</h3>
                    </div>
                    <div class="project-deadline-list">
                        <div class="deadline-item">
                            <div>
                                <strong>Assigned Tasks</strong>
                                <p>Open workload currently mapped to this workspace.</p>
                            </div>
                            <div class="deadline-meta">
                                <span>${tasks.length}</span>
                                <small>${avgProgress}% average completion</small>
                            </div>
                        </div>
                        <div class="deadline-item">
                            <div>
                                <strong>Projects in Motion</strong>
                                <p>Programs still being delivered or reviewed.</p>
                            </div>
                            <div class="deadline-meta">
                                <span>${activeProjects}</span>
                                <small>${projects.length} total tracked projects</small>
                            </div>
                        </div>
                        <div class="deadline-item">
                            <div>
                                <strong>Support Requests</strong>
                                <p>Internal issues and suggestions tied to company or project work.</p>
                            </div>
                            <div class="deadline-meta">
                                <span>${openTickets}</span>
                                <small>${unreadNotifications} unread alerts</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // ---- Projects List ----
    renderProjects() {
        const user = AppState.currentUser;
        const projects = AppState.getProjectsForUser(user.id);
        const totalProjects = projects.length;
        const avgProgress = totalProjects ? Math.round(projects.reduce((sum, project) => sum + (Number(project.progress) || 0), 0) / totalProjects) : 0;
        const atRisk = projects.filter((project) => (Number(project.progress) || 0) < 40 && String(project.status || '').toLowerCase() !== 'completed').length;
        const dueSoon = projects.filter((project) => project.dueDate).sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
        const completedProjects = projects.filter((project) => ['completed', 'done'].includes(String(project.status || '').toLowerCase()) || Number(project.progress) >= 100).length;
        const clientCount = new Set(projects.map((project) => project.client || 'Internal Delivery')).size;
        let headerActions = user.role === 'admin' ? `<button class="btn btn-primary btn-sm" id="btn-create-project"><i class='bx bx-plus'></i> New Project</button>` : '';

        let tableRows = projects.map((p) => {
            const progress = Number(p.progress) || 0;
            const statusText = String(p.status || 'Pending');
            const healthLabel = progress >= 75 ? 'Strong' : progress >= 40 ? 'Steady' : 'Needs support';
            return `
            <tr>
                <td>
                    <strong>${p.name}</strong><br>
                    <small style="color:var(--text-secondary)">${p.client || 'Internal Delivery'}</small>
                    <div class="project-description-snippet">${p.description || 'No description added yet.'}</div>
                </td>
                <td><span class="status ${statusText.toLowerCase().replace(' ', '-')}">${statusText}</span></td>
                <td>
                    <div class="mini-progress">
                        <div class="mini-progress-bar" style="width:${progress}%"></div>
                    </div>
                    <small style="color:var(--text-secondary)">${progress}% complete</small>
                </td>
                <td>${p.dueDate || 'TBD'}</td>
                <td><span class="portfolio-health ${healthLabel.toLowerCase().replace(' ', '-')}">${healthLabel}</span></td>
                <td>
                    <div class="action-cell">
                        ${user.role === 'admin' ? `
                            <button class="icon-btn" title="Delete Project" onclick="window.deleteProject('${p.id}')" style="color: var(--danger);"><i class='bx bx-trash'></i></button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
        }).join('');

        return `
            <div class="dashboard-grid project-summary-grid">
                <div class="stat-card primary">
                    <div class="stat-card-info">
                        <h3>Total Projects</h3>
                        <h2>${totalProjects}</h2>
                    </div>
                    <div class="stat-card-icon"><i class='bx bx-briefcase'></i></div>
                </div>
                <div class="stat-card info">
                    <div class="stat-card-info">
                        <h3>Average Progress</h3>
                        <h2>${avgProgress}%</h2>
                    </div>
                    <div class="stat-card-icon"><i class='bx bx-line-chart'></i></div>
                </div>
                <div class="stat-card warning">
                    <div class="stat-card-info">
                        <h3>Needs Attention</h3>
                        <h2>${atRisk}</h2>
                    </div>
                    <div class="stat-card-icon"><i class='bx bx-error-circle'></i></div>
                </div>
                <div class="stat-card success">
                    <div class="stat-card-info">
                        <h3>Completed</h3>
                        <h2>${completedProjects}</h2>
                        <p>${clientCount} client buckets covered</p>
                    </div>
                    <div class="stat-card-icon"><i class='bx bx-check-shield'></i></div>
                </div>
            </div>

            <div class="project-overview-shell">
                <div class="project-overview-card">
                    <div>
                        <span class="company-kicker">Portfolio Overview</span>
                        <h2>Projects are grouped by delivery confidence, timeline, and client ownership.</h2>
                    </div>
                    <p>Use this section to spot weak progress early, balance attention across clients, and keep delivery status grounded in actual completion percentages.</p>
                </div>
                <div class="project-deadline-list">
                    ${dueSoon.length ? dueSoon.slice(0, 3).map((project) => `
                        <div class="deadline-item">
                            <div>
                                <strong>${project.name}</strong>
                                <p>${project.client || 'Internal Delivery'}</p>
                            </div>
                            <div class="deadline-meta">
                                <span>${project.dueDate || 'TBD'}</span>
                                <small>${Number(project.progress) || 0}% complete</small>
                            </div>
                        </div>
                    `).join('') : '<p style="color:var(--text-secondary);">No project deadlines available yet.</p>'}
                </div>
            </div>

            <div class="dashboard-detail-grid">
                <div class="table-container">
                    <div class="section-header">
                        <h2>Project Portfolio</h2>
                        ${headerActions}
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Status</th>
                                <th>Progress</th>
                                <th>Due Date</th>
                                <th>Health</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows || `
                                <tr>
                                    <td colspan="6" style="text-align:center; color:var(--text-secondary); padding:24px;">No projects available yet.</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
                <div class="table-container">
                    <div class="section-header">
                        <h3>Confidence Ladder</h3>
                    </div>
                    <div class="project-deadline-list">
                        ${projects.length ? projects
                            .slice()
                            .sort((a, b) => (Number(a.progress) || 0) - (Number(b.progress) || 0))
                            .map((project) => `
                            <div class="deadline-item portfolio-health-item">
                                <div>
                                    <strong>${project.name}</strong>
                                    <p>${project.client || 'Internal Delivery'} · ${project.status || 'Pending'}</p>
                                </div>
                                <div class="deadline-meta">
                                    <span>${Number(project.progress) || 0}%</span>
                                    <small>${Number(project.progress) || 0}% complete</small>
                                </div>
                            </div>
                        `).join('') : '<p style="color:var(--text-secondary);">No projects available yet.</p>'}
                    </div>
                </div>
            </div>
        `;
    },

    // ---- Tasks Kanban ----
    renderTasks() {
        const user = AppState.currentUser;
        const tasks = AppState.getTasksForUser(user.id);
        
        const active = tasks.filter(t => t.status === 'todo' || t.status === 'in-progress');
        const done = tasks.filter(t => t.status === 'done');

        const mapTaskCards = (taskList) => {
            return taskList.map(t => {
                const assignedUser = DB.users.find(u => u.id === t.assignedTo) || { avatar: '' };
                const isAssignee = AppState.currentUser.id === t.assignedTo;
                const isPending = t.accepted === false && isAssignee;
                
                let actionBtn = '';
                if (isPending) {
                    actionBtn = `
                        <button class="btn btn-primary btn-sm btn-accept-task" data-id="${t.id}" style="width: 100%; margin-top: 10px;">
                            <i class='bx bx-check'></i> Accept Task
                        </button>
                    `;
                } else {
                    actionBtn = `
                        <button class="btn btn-secondary btn-sm btn-view-task" data-id="${t.id}" style="width: 100%; margin-top: 10px; background: transparent; border: 1px solid var(--border);">
                            <i class='bx bx-edit'></i> View & Edit
                        </button>
                    `;
                }

                return `
                <div class="task-card" ${!isPending ? 'draggable="true"' : 'draggable="false" style="border-left: 4px solid var(--warning); opacity: 0.8;"'} data-id="${t.id}" id="${t.id}">
                    <div class="task-card-header">
                        <div class="task-tags">
                            <span>${t.priority}</span>
                            ${t.progress > 0 ? `<span style="background: rgba(var(--primary-rgb),0.2); color: var(--primary);">${t.progress}%</span>` : ''}
                        </div>
                    </div>
                    <h4>${t.title}</h4>
                    <p style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${t.description}</p>
                    <div class="task-card-footer">
                        <img src="${assignedUser.avatar}" alt="User" style="width: 24px; height: 24px; border-radius: 50%;">
                        <span style="font-size: 12px; color: var(--text-secondary)"><i class='bx bx-message-square-dots'></i> ${t.comments ? t.comments.length : 0}</span>
                    </div>
                    ${actionBtn}
                </div>
                `;
            }).join('');
        };

        let headerActions = user.role === 'admin' ? `<button class="btn btn-primary btn-sm" id="btn-create-task"><i class='bx bx-plus'></i> Assign Task</button>` : '';

        return `
            <div class="section-header" style="margin-bottom: 20px;">
                <h2>Tasks Allotted</h2>
                ${headerActions}
            </div>
            <div class="kanban-board" style="grid-template-columns: repeat(2, 1fr);">
                <div class="kanban-column" id="col-active" data-status="in-progress">
                    <h3>Active Tasks <span class="count">${active.length}</span></h3>
                    <div class="kanban-items">
                        ${mapTaskCards(active)}
                    </div>
                </div>
                <div class="kanban-column" id="col-done" data-status="done">
                    <h3>Done <span class="count">${done.length}</span></h3>
                    <div class="kanban-items">
                        ${mapTaskCards(done)}
                    </div>
                </div>
            </div>
        `;
    },

    // ---- User Progress ----
    renderProgress() {
        return `
            <div class="chart-container">
                <div class="section-header">
                    <h3>Personal Performance Progress</h3>
                </div>
                <div class="progress-wave-shell">
                    <canvas id="progressChart"></canvas>
                </div>
            </div>
        `;
    },

    // ---- Skills & Roles ----
    renderSkills() {
        const user = AppState.currentUser;
        
        return `
            <div class="table-container" style="max-width: 600px;">
                <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 30px;">
                    <img src="${user.avatar}" alt="" style="width: 80px; height: 80px; border-radius: 12px;">
                    <div>
                        <h2 style="font-size: 24px; margin-bottom: 5px;">${user.name}</h2>
                        <span style="color: var(--text-secondary); text-transform: uppercase; font-size: 12px; font-weight: 700; letter-spacing: 1px;">${user.role}</span>
                    </div>
                </div>
                
                <h3 style="margin-bottom: 15px;">Your Skills</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 30px;">
                    ${user.skills.map(s => `<span style="padding: 8px 16px; background: rgba(92, 60, 252, 0.1); color: var(--primary); border-radius: 20px; font-weight: 600;">${s}</span>`).join('')}
                </div>
                
                <h3 style="margin-bottom: 15px;">Role Capabilities</h3>
                <ul style="color: var(--text-secondary); padding-left: 20px; line-height: 1.8;">
                    ${user.role === 'admin' 
                        ? '<li>Create and manage client contracts.</li><li>Assign tasks to employees globally.</li><li>View administrative progress insights.</li><li>Access all internal platform tools.</li>' 
                        : '<li>View assigned projects and project timelines.</li><li>Manage tasks via Kanban boards.</li><li>Track personal productivity progress.</li><li>Access important company documents.</li>'}
                </ul>
            </div>
        `;
    },

    // ---- About Company ----
    renderAboutCompany() {
        const info = DB.companyInfo;
        const user = AppState.currentUser;
        const values = info.values || [
            'Clarity in communication and delivery updates',
            'Creative quality backed by execution discipline',
            'One operating space for clients, projects, tasks, and credentials'
        ];
        const companySnapshot = info.companySnapshot || [
            `Homepage draft reference: ${info.websiteDraftReference || 'Better Inside Homepage Design.pdf'}`,
            'Positioning centers on creative services, digital execution, and team coordination',
            'Internal dashboard extends that same brand into day-to-day operations'
        ];
        
        const mapDocs = () => {
            if (info.documents.length === 0) return '<p style="color:var(--text-secondary); font-size:13px;">No documents available yet.</p>';
            return info.documents.map(d => `
                <li class="document-item" data-id="${d.id}">
                    <div class="document-info">
                        ${d.type === 'pdf' ? `<i class='bx bxs-file-pdf'></i>` : `<i class='bx bxs-file-doc'></i>`}
                        <div>
                            <span style="font-weight: 500; font-size: 14px;">${d.title}</span><br>
                            <span style="font-size: 12px; color: var(--text-secondary);">${d.size} &middot; ${d.type.toUpperCase()}</span>
                        </div>
                    </div>
                    <div style="display:flex; gap: 8px;">
                        ${user.role === 'admin' ? `
                        <button class="icon-btn btn-delete-doc" data-id="${d.id}" title="Delete Document" style="color: #ff4d4d; cursor: pointer;">
                            <i class='bx bx-trash'></i>
                        </button>
                        ` : ''}
                        <button class="icon-btn btn-download-doc" data-id="${d.id}" title="Download" style="cursor: pointer;">
                            <i class='bx bx-download'></i>
                        </button>
                    </div>
                </li>
            `).join('');
        };

        const adminDocAction = user.role === 'admin' ? `<button class="btn btn-primary btn-sm" id="btn-create-doc" style="margin-top: 15px;"><i class='bx bx-upload'></i> Upload Document</button>` : '';

        return `
            <div class="about-layout">
                <div class="info-card company-hero-card">
                    <div class="company-kicker">Company Overview</div>
                    <h2><i class='bx bx-buildings'></i> ${info.name || 'Better Inside'}</h2>
                    <p class="company-tagline">${info.tagline || ''}</p>
                    <p style="margin-bottom: 20px;">${info.description}</p>
                    <div class="company-meta-grid">
                        <div><strong>Founded</strong><span>${info.founded}</span></div>
                        <div><strong>Location</strong><span>${info.location}</span></div>
                        <div><strong>Primary Contact</strong><span>${info.contactEmail || '-'}</span></div>
                        <div><strong>Draft Reference</strong><span>${info.websiteDraftReference || '-'}</span></div>
                    </div>
                </div>
                <div class="about-sections">
                    <div class="info-card">
                        <h2><i class='bx bx-layer'></i> Core Services</h2>
                        <ul class="company-detail-list">
                            ${(info.coreServices || []).map((item) => `<li>${item}</li>`).join('') || '<li>Services will appear here.</li>'}
                        </ul>
                    </div>
                    <div class="info-card">
                        <h2><i class='bx bx-git-branch'></i> Operating Model</h2>
                        <ul class="company-detail-list">
                            ${(info.operatingModel || []).map((item) => `<li>${item}</li>`).join('') || '<li>Operating model details will appear here.</li>'}
                        </ul>
                    </div>
                    <div class="info-card">
                        <h2><i class='bx bx-group'></i> Leadership</h2>
                        <div class="leadership-list">
                            ${(info.leadership || []).map((leader) => `
                                <div class="leader-card">
                                    <strong>${leader.name}</strong>
                                    <span>${leader.role}</span>
                                </div>
                            `).join('') || '<p style="color:var(--text-secondary);">Leadership details will appear here.</p>'}
                        </div>
                    </div>
                    <div class="info-card">
                        <h2><i class='bx bx-bulb'></i> Brand & Website Draft Reference</h2>
                        <ul class="company-detail-list">
                            ${companySnapshot.map((item) => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="info-card">
                        <h2><i class='bx bx-heart'></i> Company Values</h2>
                        <ul class="company-detail-list">
                            ${values.map((item) => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="info-card" id="important-documents">
                        <h2><i class='bx bx-folder-open'></i> Important Documents</h2>
                        <p style="margin-bottom: 20px; font-size: 13px;">View and download essential internal resources and draft references.</p>
                        <ul class="document-list">
                            ${mapDocs()}
                        </ul>
                        ${adminDocAction}
                    </div>
                </div>
            </div>
        `;
    },

    // ---- Admin: Clients & Contracts ----
    renderClients() {
        const clients = AppState.getClients();
        const clientRows = clients.length
            ? clients.map(c => `
                <tr id="client-${c.id}">
                    <td><strong>${c.name}</strong></td>
                    <td>${c.contact || '-'}</td>
                    <td>${DB.projects.filter((project) => project.client === c.name).length}</td>
                    <td>
                        <div class="action-cell">
                            <button class="icon-btn" title="Delete Client" style="color: var(--danger)" onclick="window.deleteClient('${c.id}')"><i class='bx bx-trash'></i></button>
                        </div>
                    </td>
                </tr>
            `).join('')
            : `
                <tr>
                    <td colspan="4" style="text-align:center; color: var(--text-secondary); padding: 24px;">
                        No clients added yet.
                    </td>
                </tr>
            `;

        let rows = DB.contracts.map(c => `
            <tr id="contract-${c.id}">
                <td>${c.id}</td>
                <td><strong>${c.clientName}</strong></td>
                <td>${c.projectDetails}</td>
                <td>$${c.amount}</td>
                <td>${c.date}</td>
                <td>
                    <div class="action-cell">
                        <button class="icon-btn" title="Download PDF" onclick="window.downloadContract('${c.id}')"><i class='bx bxs-file-pdf' style="color: var(--danger)"></i></button>
                        <button class="icon-btn" title="Delete" style="color: var(--text-secondary)" onclick="window.deleteContract('${c.id}')"><i class='bx bx-trash'></i></button>
                    </div>
                </td>
            </tr>
        `).join('') || `
            <tr>
                <td colspan="6" style="text-align:center; color: var(--text-secondary); padding: 24px;">
                    No contracts created yet.
                </td>
            </tr>
        `;

        return `
            <div class="dashboard-grid" style="grid-template-columns: 1fr;">
                <div class="table-container">
                    <div class="section-header">
                        <h2>Clients</h2>
                        <button class="btn btn-secondary" id="btn-add-client"><i class='bx bx-user-plus'></i> Create Client</button>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Client Name</th>
                                <th>Contact Email</th>
                                <th>Active Projects</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clientRows}
                        </tbody>
                    </table>
                </div>

                <div class="table-container">
                    <div class="section-header">
                        <h2>Client Contracts</h2>
                        <button class="btn btn-primary" id="btn-create-contract"><i class='bx bx-file-blank'></i> Create Contract</button>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Client Name</th>
                                <th>Project Details</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="contracts-tbody">
                            ${rows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // ---- Admin: Credentials Management ----
    renderCredentialsPage() {
        const users = DB.users;
        const rows = users.map(u => `
            <tr>
                <td><strong>${u.name}</strong></td>
                <td><code>${u.id}</code></td>
                <td>
                    <div class="input-wrapper" style="width: auto;">
                        <input type="text" id="user-${u.id}" value="${u.username}" style="padding: 6px 12px; font-family: monospace; font-size: 14px; width: 100%;">
                    </div>
                </td>
                <td>
                    <select id="role-${u.id}" class="status ${u.role === 'admin' ? 'todo' : 'in-progress'}" style="padding: 4px 8px; border: none; outline: none; border-radius: 4px; font-weight: 600;">
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="employee" ${u.role === 'employee' ? 'selected' : ''}>Employee</option>
                    </select>
                </td>
                <td>
                    <div class="input-wrapper" style="width: auto;">
                        <input type="text" id="pass-${u.id}" value="${u.password || ''}" placeholder="Enter password" style="padding: 6px 12px; font-family: monospace; font-size: 14px; width: 100%;">
                    </div>
                </td>
                <td>
                    <button class="btn btn-primary btn-sm btn-update-cred" data-id="${u.id}" style="padding: 6px 12px;">Update</button>
                </td>
            </tr>
        `).join('');

        return `
            <div class="dashboard-grid credential-summary-grid">
                <div class="stat-card primary">
                    <div class="stat-card-info">
                        <h3>Total Accounts</h3>
                        <h2>${users.length}</h2>
                        <p>All dashboard logins listed below</p>
                    </div>
                    <div class="stat-card-icon"><i class='bx bx-id-card'></i></div>
                </div>
                <div class="stat-card info">
                    <div class="stat-card-info">
                        <h3>Admin Accounts</h3>
                        <h2>${users.filter((user) => user.role === 'admin').length}</h2>
                        <p>Manager and founder access</p>
                    </div>
                    <div class="stat-card-icon"><i class='bx bx-shield-quarter'></i></div>
                </div>
                <div class="stat-card warning">
                    <div class="stat-card-info">
                        <h3>Employee Accounts</h3>
                        <h2>${users.filter((user) => user.role === 'employee').length}</h2>
                        <p>Execution and project delivery access</p>
                    </div>
                    <div class="stat-card-icon"><i class='bx bx-user'></i></div>
                </div>
            </div>

            <div class="dashboard-grid" style="grid-template-columns: 1fr;">
                <div class="table-container">
                    <div class="section-header">
                        <h2><i class='bx bx-key'></i> Employee Credentials & Roles</h2>
                    </div>
                    <p style="margin-bottom:16px; font-size:13px;">This table includes every stored user ID, login username, role, and password currently available in the system.</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>User ID</th>
                                <th>Username</th>
                                <th>System Role</th>
                                <th>Password</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderTickets() {
        const user = AppState.currentUser;
        const tickets = user.role === 'admin'
            ? DB.tickets
            : DB.tickets.filter((ticket) => ticket.createdBy === user.id);

        return `
            <div class="dashboard-detail-grid">
                <div class="table-container">
                    <div class="section-header">
                        <h2>${user.role === 'admin' ? 'Employee Tickets' : 'My Tickets'}</h2>
                        <button class="btn btn-primary btn-sm" id="btn-create-ticket"><i class='bx bx-message-square-add'></i> Raise Ticket</button>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Type</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Project / Client</th>
                                <th>Raised By</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tickets.length ? tickets.map((ticket) => `
                                <tr>
                                    <td>
                                        <strong>${ticket.title}</strong>
                                        <div class="project-description-snippet">${ticket.description || 'No description provided.'}</div>
                                    </td>
                                    <td><span class="status ${ticket.ticketType === 'issue' ? 'pending' : 'in-progress'}">${ticket.ticketType}</span></td>
                                    <td>${ticket.priority}</td>
                                    <td><span class="status ${ticket.status === 'resolved' ? 'done' : ticket.status === 'in-review' ? 'in-progress' : 'pending'}">${ticket.status}</span></td>
                                    <td>${ticket.projectName || ticket.clientName || 'General'}</td>
                                    <td>${ticket.createdByName || 'Unknown'}<br><small style="color:var(--text-secondary)">${ticket.createdAt || ''}</small></td>
                                    <td>
                                        ${user.role === 'admin' ? `
                                            <select class="ticket-status-select" data-id="${ticket.id}">
                                                <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Open</option>
                                                <option value="in-review" ${ticket.status === 'in-review' ? 'selected' : ''}>In Review</option>
                                                <option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                                            </select>
                                        ` : `<span style="color:var(--text-secondary);">Awaiting review</span>`}
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="7" style="text-align:center; color:var(--text-secondary); padding:24px;">No tickets raised yet.</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
                <div class="table-container">
                    <div class="section-header">
                        <h3>Ticket Guidelines</h3>
                    </div>
                    <ul class="company-detail-list">
                        <li>Use <strong>Issue</strong> for blockers, bugs, access problems, or delivery risks.</li>
                        <li>Use <strong>Suggestion</strong> for process improvements, tooling ideas, or client/project enhancements.</li>
                        <li>Attach the related client or project whenever possible so admins can route the request faster.</li>
                        <li>Admins can move tickets through open, in review, and resolved states directly from this page.</li>
                    </ul>
                </div>
            </div>
        `;
    },

    renderHelpdesk() {
        const user = AppState.currentUser;
        const recentTickets = (user.role === 'admin'
            ? DB.tickets
            : DB.tickets.filter((ticket) => ticket.createdBy === user.id))
            .slice(0, 5);

        return `
            <div class="dashboard-detail-grid">
                <div class="table-container">
                    <div class="section-header">
                        <h2><i class='bx bx-support'></i> Employee Helpdesk</h2>
                        <button class="btn btn-primary btn-sm" id="btn-create-ticket"><i class='bx bx-message-square-add'></i> Raise Ticket</button>
                    </div>
                    <div class="project-overview-card" style="margin-bottom:20px;">
                        <div>
                            <span class="company-kicker">Support Channel</span>
                            <h2>Raise blockers, access issues, process feedback, or project suggestions from one place.</h2>
                        </div>
                        <p>Use this tab when something needs attention from admins or when you want to suggest an improvement for the company or a specific project.</p>
                    </div>
                    <div class="project-deadline-list">
                        <div class="deadline-item">
                            <div>
                                <strong>Company Issues</strong>
                                <p>Access problems, HR process pain points, internal tooling requests, or policy suggestions.</p>
                            </div>
                            <div class="deadline-meta">
                                <span>General</span>
                                <small>No project required</small>
                            </div>
                        </div>
                        <div class="deadline-item">
                            <div>
                                <strong>Project Issues</strong>
                                <p>Client blockers, delivery confusion, missing approvals, or timeline risks.</p>
                            </div>
                            <div class="deadline-meta">
                                <span>Project linked</span>
                                <small>Add client/project when possible</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="table-container">
                    <div class="section-header">
                        <h3>${user.role === 'admin' ? 'Recent Tickets' : 'My Recent Tickets'}</h3>
                    </div>
                    <div class="project-deadline-list">
                        ${recentTickets.length ? recentTickets.map((ticket) => `
                            <div class="deadline-item">
                                <div>
                                    <strong>${ticket.title}</strong>
                                    <p>${ticket.projectName || ticket.clientName || 'General company support'}</p>
                                </div>
                                <div class="deadline-meta">
                                    <span>${ticket.status}</span>
                                    <small>${ticket.priority} priority</small>
                                </div>
                            </div>
                        `).join('') : '<p style="color:var(--text-secondary);">No tickets have been raised yet.</p>'}
                    </div>
                </div>
            </div>
        `;
    },

    // Full Page Creators
    renderCreateContractPage() {
        const clients = AppState.getClients();
        const clientOptions = clients.length
            ? [`<option value="" disabled selected>Select a client</option>`, ...clients.map((client) => `<option value="${client.id}">${client.name}</option>`)].join('')
            : `<option value="" disabled selected>No clients available</option>`;
        return `
            <div class="table-container" style="max-width: 600px; margin: 0 auto;">
                <div class="section-header">
                    <h2><i class='bx bx-file-blank'></i> Create New Contract</h2>
                </div>
                <form id="contract-form">
                    <div class="input-group">
                        <label>Client Name</label>
                        <div class="input-wrapper">
                            <select id="fc-client" ${clients.length ? 'required' : 'disabled'}>
                                ${clientOptions}
                            </select>
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Project Details</label>
                        <div class="input-wrapper">
                            <input type="text" id="fc-project" required placeholder="e.g. Landing Page Design">
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Total Amount ($)</label>
                        <div class="input-wrapper">
                            <input type="number" id="fc-amount" required placeholder="15000">
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Contract Date</label>
                        <div class="input-wrapper date-input-wrapper">
                            <input type="date" id="fc-date" required>
                            <button type="button" class="date-picker-trigger" id="fc-date-trigger" aria-label="Open calendar">
                                <i class='bx bx-calendar'></i>
                            </button>
                        </div>
                    </div>
                    <div style="display: flex; gap: 15px; margin-top: 30px;">
                        <button type="button" class="btn btn-secondary btn-block" id="btn-cancel-contract" style="flex: 1;">Cancel</button>
                        <button type="submit" class="btn btn-primary btn-block" style="flex: 2;"><i class='bx bx-file-blank'></i> Generate Contract</button>
                    </div>
                </form>
            </div>
        `;
    },
    
    renderCreateProjectPage() {
        const uniqueClients = AppState.getClients();

        const clientsOptions = uniqueClients.length
            ? [
                `<option value="" disabled selected>Select an existing client</option>`,
                ...uniqueClients.map(c => `<option value="${c.id}">${c.name}</option>`)
            ].join('')
            : `<option value="" disabled selected>No clients available</option>`;

        return `
            <div class="table-container" style="max-width: 600px; margin: 0 auto;">
                <div class="section-header">
                    <h2><i class='bx bx-briefcase'></i> Create New Project</h2>
                </div>
                <form id="project-form">
                    <div class="input-group">
                        <label>Project Name</label>
                        <div class="input-wrapper">
                            <input type="text" id="fp-name" required placeholder="e.g. Alpha Build">
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Project Details / Description</label>
                        <div class="input-wrapper">
                            <textarea id="fp-desc" rows="4" required placeholder="Explain the project milestones and detailed scope..."></textarea>
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Client</label>
                        <div class="input-wrapper">
                            <select id="fp-client" ${uniqueClients.length ? 'required' : 'disabled'}>
                                ${clientsOptions}
                            </select>
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Timeline / Due Date</label>
                        <div class="input-wrapper date-input-wrapper">
                            <input type="date" id="fp-date" required>
                            <button type="button" class="date-picker-trigger" id="fp-date-trigger" aria-label="Open calendar">
                                <i class='bx bx-calendar'></i>
                            </button>
                        </div>
                    </div>
                    <div style="display: flex; gap: 15px; margin-top: 30px;">
                        <button type="button" class="btn btn-secondary btn-block" id="btn-cancel-project" style="flex: 1;">Cancel</button>
                        <button type="submit" class="btn btn-primary btn-block" style="flex: 2;">Create Project</button>
                    </div>
                </form>
            </div>
        `;
    },

    renderCreateTicketPage() {
        const clients = AppState.getClients();
        const projects = AppState.getProjectsCatalog();
        return `
            <div class="table-container" style="max-width: 700px; margin: 0 auto;">
                <div class="section-header">
                    <h2><i class='bx bx-help-circle'></i> Raise Ticket</h2>
                </div>
                <form id="ticket-form">
                    <div class="input-group">
                        <label>Ticket Title</label>
                        <div class="input-wrapper">
                            <input type="text" id="ticket-title" required placeholder="Describe the issue or suggestion clearly">
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Description</label>
                        <div class="input-wrapper">
                            <textarea id="ticket-description" rows="4" required placeholder="Include the problem, impact, and any useful context."></textarea>
                        </div>
                    </div>
                    <div class="ticket-form-grid">
                        <div class="input-group">
                            <label>Type</label>
                            <div class="input-wrapper">
                                <select id="ticket-type">
                                    <option value="issue">Issue</option>
                                    <option value="suggestion">Suggestion</option>
                                </select>
                            </div>
                        </div>
                        <div class="input-group">
                            <label>Priority</label>
                            <div class="input-wrapper">
                                <select id="ticket-priority">
                                    <option value="low">Low</option>
                                    <option value="medium" selected>Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="ticket-form-grid">
                        <div class="input-group">
                            <label>Related Client</label>
                            <div class="input-wrapper">
                                <select id="ticket-client">
                                    <option value="">General / No Client</option>
                                    ${clients.map((client) => `<option value="${client.id}">${client.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="input-group">
                            <label>Related Project</label>
                            <div class="input-wrapper">
                                <select id="ticket-project">
                                    <option value="">General / No Project</option>
                                    ${projects.map((project) => `<option value="${project.id}">${project.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 15px; margin-top: 30px;">
                        <button type="button" class="btn btn-secondary btn-block" id="btn-cancel-ticket" style="flex: 1;">Cancel</button>
                        <button type="submit" class="btn btn-primary btn-block" style="flex: 2;">Submit Ticket</button>
                    </div>
                </form>
            </div>
        `;
    },
    
    renderCreateTaskPage() {
        // Exclude the main system 'Admin' account (u1), but allow assigning to all other team members (Founders/Employees)
        const users = DB.users.filter(u => u.id !== 'u1').map(u => `<option value="${u.id}">${u.name}</option>`).join('');
        const projects = DB.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

        return `
            <div class="table-container" style="max-width: 600px; margin: 0 auto;">
                <div class="section-header">
                    <h2><i class='bx bx-task'></i> Assign New Task</h2>
                </div>
                <form id="task-form">
                    <div class="input-group">
                        <label>Task Title</label>
                        <div class="input-wrapper">
                            <input type="text" id="ft-title" required placeholder="Design wireframes">
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Description</label>
                        <div class="input-wrapper">
                            <textarea id="ft-desc" rows="3" required placeholder="Detailed task description..."></textarea>
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Assign Project</label>
                        <div class="input-wrapper">
                            <select id="ft-project">${projects}</select>
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Allot To Employee</label>
                        <div class="input-wrapper">
                            <select id="ft-assignee">${users}</select>
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Priority</label>
                        <div class="input-wrapper">
                            <select id="ft-priority">
                                <option>Low</option>
                                <option selected>Medium</option>
                                <option>High</option>
                            </select>
                        </div>
                    </div>

                    <!-- Milestone Section -->
                    <div style="margin-top: 20px; border-top: 1px solid var(--border); padding-top: 20px;">
                        <h3 style="font-size: 16px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                            Task Milestones
                            <button type="button" class="btn btn-secondary btn-sm" id="btn-add-milestone-field" style="padding: 4px 10px; font-size: 11px;">
                                <i class='bx bx-plus'></i> Add Milestone
                            </button>
                        </h3>
                        <div id="milestones-container">
                            <!-- Dynamically added milestones will go here -->
                        </div>
                    </div>
                    <div style="display: flex; gap: 15px; margin-top: 30px;">
                        <button type="button" class="btn btn-secondary btn-block" id="btn-cancel-task" style="flex: 1;">Cancel</button>
                        <button type="submit" class="btn btn-primary btn-block" style="flex: 2;">Assign Task</button>
                    </div>
                </form>
            </div>
        `;
    },
    
    renderCreateDocumentPage() {
        return `
            <div class="table-container" style="max-width: 600px; margin: 0 auto;">
                <div class="section-header">
                    <h2><i class='bx bx-upload'></i> Upload New Document</h2>
                </div>
                <form id="doc-form">
                    <div class="input-group">
                        <label>Document Title</label>
                        <div class="input-wrapper">
                            <input type="text" id="fd-title" required placeholder="e.g. Employee Handbook">
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Select PDF / Document</label>
                        <div class="input-wrapper">
                            <input type="file" id="fd-file" accept=".pdf,.doc,.docx,.xls,.xlsx" required style="padding-left: 15px;">
                        </div>
                    </div>
                    <div id="file-info-preview" style="display: none; margin-bottom: 20px; font-size: 13px; color: var(--primary);">
                        Detected: <span id="fd-detected-info"></span>
                    </div>
                    <div style="display: flex; gap: 15px; margin-top: 30px;">
                        <button type="button" class="btn btn-secondary btn-block" id="btn-cancel-doc" style="flex: 1;">Cancel</button>
                        <button type="submit" class="btn btn-primary btn-block" style="flex: 2;"><i class='bx bx-cloud-upload'></i> Add Document</button>
                    </div>
                </form>
            </div>
        `;
    },
    
    // ---- Edit Task Details ----
    renderTaskDetailsPage(taskId) {
        const task = DB.tasks.find(t => t.id === taskId);
        if (!task) return '<h2>Task Not Found</h2>';
        const project = DB.projects.find(p => p.id === task.projectId) || { name: 'Direct Task' };
        
        let adminActions = '';
        if (AppState.currentUser.role === 'admin') {
            if (task.progress === 100 && task.status !== 'done') {
                adminActions += `<button type="button" class="btn btn-success btn-sm" id="btn-mark-done"><i class='bx bx-check-double'></i> Mark Complete</button>`;
            }
            adminActions += `<button type="button" class="btn btn-sm" id="btn-delete-task" style="background: rgba(255,0,0,0.1); color: red; border: 1px solid red;"><i class='bx bx-trash'></i> Delete Task</button>`;
        }
        
        const mapComments = () => {
            if (!task.comments || task.comments.length === 0) return '<p style="color:var(--text-secondary); text-align:center; padding: 20px;">No messages yet. Start the conversation!</p>';
            return task.comments.map(c => {
                const isMine = String(c.senderId) === String(AppState.currentUser.id);
                const initials = (isMine ? AppState.currentUser.name : c.sender).split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase();
                return `
                <div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:16px;${isMine ? 'flex-direction:row-reverse;' : ''}">
                    <div style="width:32px;height:32px;border-radius:50%;background:${isMine ? 'var(--primary)' : '#475569'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;">${initials}</div>
                    <div style="max-width:68%;">
                        <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;${isMine ? 'text-align:right;' : ''}">${isMine ? 'You' : c.sender} &middot; ${c.time}</div>
                        <div style="background:${isMine ? 'var(--primary)' : 'var(--bg-main)'};color:${isMine ? '#fff' : 'var(--text-primary)'};padding:10px 14px;border-radius:${isMine ? '16px 4px 16px 16px' : '4px 16px 16px 16px'};font-size:14px;line-height:1.5;word-break:break-word;border:1px solid ${isMine ? 'transparent' : 'var(--border)'}">
                            ${c.text ? `<span>${c.text}</span>` : ''}
                            ${c.attachment ? `<div style="margin-top:8px;"><img src="${c.attachment}" style="max-width:100%;border-radius:8px;"></div>` : ''}
                        </div>
                    </div>
                </div>`;
            }).join('');
        };


        return `
            <div class="table-container" style="max-width: 800px; margin: 0 auto;">
                <div class="section-header" style="align-items: flex-start; flex-wrap: wrap;">
                    <div>
                        <h2><i class='bx bx-task'></i> ${task.title}</h2>
                        <p style="color: var(--text-secondary); margin-top: 5px;">Project: <strong>${project.name}</strong> &middot; Status: <strong>${task.status.toUpperCase()}</strong></p>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn btn-secondary btn-sm" id="btn-back-to-tasks"><i class='bx bx-arrow-back'></i> Back</button>
                        ${adminActions}
                    </div>
                </div>
                
                <form id="task-details-form">
                    <div class="input-group">
                        <label>Task Description & Details</label>
                        <div class="input-wrapper" style="align-items: flex-start;">
                            <textarea id="f-task-desc" rows="6" style="padding-left: 15px;" placeholder="Add progress logs, notes, or expand on the description...">${task.description}</textarea>
                        </div>
                    </div>
                    
                    <div class="input-group">
                        <label>Task Completion Progress: <strong style="color: var(--primary);">${task.progress}%</strong></label>
                        <div style="width: 100%; height: 8px; background: rgba(var(--primary-rgb),0.1); border-radius: 4px; overflow: hidden; margin-top: 10px;">
                            <div style="width: ${task.progress}%; height: 100%; background: var(--primary); transition: 0.5s;"></div>
                        </div>
                        <input type="hidden" id="f-task-prog" value="${task.progress}">
                    </div>

                    <!-- Milestone Section -->
                    <div style="margin-top: 40px; border-top: 1px solid var(--border); padding-top: 25px;">
                        <h3 style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                            <span><i class='bx bx-git-commit'></i> Task Milestones</span>
                            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                                <span style="font-size: 11px; color: var(--text-secondary); font-weight: normal; background: rgba(var(--primary-rgb),0.1); padding: 4px 8px; border-radius: 20px;">Milestone Review System</span>
                                ${AppState.currentUser.role === 'admin' ? `<button type="button" class="btn btn-secondary btn-sm" id="btn-add-inline-milestone" style="padding: 6px 12px; font-size: 11px;"><i class='bx bx-plus'></i> Add Milestone</button>` : ''}
                            </div>
                        </h3>

                        ${AppState.currentUser.role === 'admin' ? `
                            <div id="inline-milestone-form" style="display:none; margin-bottom: 18px; padding: 14px; border-radius: 12px; border: 1px dashed var(--border); background: rgba(255,255,255,0.03);">
                                <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap: 10px; margin-bottom: 10px;">
                                    <input type="text" id="inline-ms-title" placeholder="Milestone title" style="padding:10px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-primary);">
                                    <input type="date" id="inline-ms-deadline" style="padding:10px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-primary);">
                                </div>
                                <textarea id="inline-ms-desc" rows="3" placeholder="Milestone description" style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-primary); font-family:inherit;"></textarea>
                                <div style="display:flex; gap:10px; margin-top: 12px;">
                                    <button type="button" class="btn btn-primary btn-sm" id="btn-save-inline-milestone" style="padding: 6px 12px;">Save Milestone</button>
                                    <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-inline-milestone" style="padding: 6px 12px;">Cancel</button>
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="milestone-stepper" style="display: flex; flex-direction: column; gap: 20px;">
                            ${(() => {
                                const msList = AppState.getMilestonesForTask(taskId);
                                if (msList.length === 0) return '<p style="color: var(--text-secondary); font-size: 13px;">No milestones defined for this task.</p>';
                                
                                return msList.map((m, idx) => {
                                    const isAdmin = AppState.currentUser.role === 'admin';
                                    const previousMilestone = idx > 0 ? msList[idx - 1] : null;
                                    const isUnlocked = idx === 0 || previousMilestone?.status === 'approved';
                                    const isLocked = !isAdmin && !isUnlocked;
                                    let statusColor = '#94a3b8';
                                    let statusText = m.status.toUpperCase();
                                    
                                    if(m.status === 'approved') statusColor = '#10b981';
                                    if(m.status === 'pending') statusColor = '#f59e0b';
                                    if(m.status === 'rejected') statusColor = '#ef4444';
                                    if(m.status === 'in-progress') statusColor = 'var(--primary)';

                                    let actions = '';
                                    if (isAdmin) {
                                        if (m.status === 'pending') {
                                            actions = `
                                                <div style="margin-top: 12px; padding: 12px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px dashed var(--border);">
                                                    <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px;">Employee Submission</div>
                                                    ${m.submissionNote ? `<div style="font-size: 13px; margin-bottom: 10px; color: var(--text-primary);"><strong>Note:</strong> ${m.submissionNote}</div>` : ''}
                                                    ${m.proofImage ? `
                                                        <div style="display:flex; flex-direction:column; gap:8px;">
                                                            <img src="${m.proofImage}" alt="${m.proofName || 'Milestone proof'}" style="max-width: 240px; width: 100%; border-radius: 10px; border: 1px solid var(--border); object-fit: cover;">
                                                            <div style="font-size: 11px; color: var(--text-secondary);">${m.proofName || 'Screenshot attached'}${m.submittedAt ? ` • Submitted ${m.submittedAt}` : ''}</div>
                                                        </div>
                                                    ` : `<div style="font-size: 12px; color: #f59e0b;">No screenshot attached yet.</div>`}
                                                </div>
                                                <div style="display: flex; gap: 8px; margin-top: 12px;">
                                                    <button type="button" class="btn btn-success btn-sm btn-approve-milestone" data-id="${m.id}" style="padding: 4px 10px; font-size: 11px;"><i class='bx bx-check'></i> Approve</button>
                                                    <button type="button" class="btn btn-sm btn-reject-milestone" data-id="${m.id}" style="padding: 4px 10px; font-size: 11px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid #ef4444;"><i class='bx bx-x'></i> Reject</button>
                                                </div>
                                            `;
                                        }
                                    } else {
                                        // Employee actions
                                        if (isLocked) {
                                            actions = `<div style="margin-top: 12px; font-size: 12px; color: var(--text-secondary);"><i class='bx bx-lock-alt'></i> Complete and get approval on the previous milestone to unlock this one.</div>`;
                                        } else if (m.status === 'not-started') {
                                            actions = `<button type="button" class="btn btn-primary btn-sm btn-start-milestone" data-id="${m.id}" style="padding: 4px 10px; font-size: 11px; margin-top: 12px;">Start Milestone</button>`;
                                        } else if (m.status === 'in-progress' || m.status === 'rejected') {
                                            actions = `
                                                <div style="margin-top: 12px; padding: 12px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px dashed var(--border);">
                                                    <label style="display:block; font-size:12px; color: var(--text-secondary); margin-bottom: 8px;">Upload Work Screenshot</label>
                                                    <input type="file" class="milestone-proof-input" data-id="${m.id}" accept="image/*" style="width: 100%; margin-bottom: 10px;">
                                                    <textarea class="milestone-proof-note" data-id="${m.id}" rows="2" placeholder="Add what you completed in this milestone..." style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-primary); font-family:inherit; font-size:13px;">${m.submissionNote || ''}</textarea>
                                                    <div class="milestone-proof-preview" data-id="${m.id}" style="margin-top: 10px; ${m.proofImage ? '' : 'display:none;'}">
                                                        <img src="${m.proofImage || ''}" alt="${m.proofName || 'Milestone proof'}" style="max-width: 220px; width: 100%; border-radius: 10px; border: 1px solid var(--border); object-fit: cover;">
                                                        <div class="milestone-proof-name" style="font-size: 11px; color: var(--text-secondary); margin-top: 6px;">${m.proofName || ''}</div>
                                                    </div>
                                                </div>
                                                <button type="button" class="btn btn-warning btn-sm btn-submit-milestone" data-id="${m.id}" style="padding: 4px 10px; font-size: 11px; margin-top: 12px;">Submit for Review</button>
                                            `;
                                        } else if (m.status === 'pending') {
                                            actions = `
                                                <div style="margin-top: 12px; padding: 12px; border-radius: 10px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); font-size: 12px; color: #f59e0b;">
                                                    Waiting for admin approval.${m.submittedAt ? ` Submitted on ${m.submittedAt}.` : ''}
                                                </div>
                                                ${m.proofImage ? `<img src="${m.proofImage}" alt="${m.proofName || 'Submitted screenshot'}" style="margin-top:10px; max-width: 220px; width:100%; border-radius: 10px; border: 1px solid var(--border); object-fit: cover;">` : ''}
                                            `;
                                        } else if (m.status === 'approved' && idx < msList.length - 1) {
                                            actions = `<div style="margin-top: 12px; font-size: 12px; color: #10b981;"><i class='bx bx-check-circle'></i> Approved. The next milestone is now unlocked.</div>`;
                                        } else if (m.status === 'approved') {
                                            actions = `<div style="margin-top: 12px; font-size: 12px; color: #10b981;"><i class='bx bx-check-circle'></i> Approved. This milestone is complete.</div>`;
                                        }
                                    }

                                    return `
                                        <div class="milestone-card" style="display: flex; gap: 15px; background: rgba(255,255,255,0.02); padding: 15px; border-radius: 12px; border: 1px solid var(--border); position: relative; ${m.status === 'approved' ? 'border-color: rgba(16, 185, 129, 0.2);' : ''} ${isLocked ? 'opacity: 0.6;' : ''}">
                                            <div style="width: 24px; height: 24px; border-radius: 50%; background: ${statusColor}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; flex-shrink: 0; margin-top: 2px;">${idx + 1}</div>
                                            <div style="flex: 1;">
                                                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                                    <h4 style="font-size: 15px; margin: 0 0 5px 0; color: ${m.status === 'approved' ? '#10b981' : 'var(--text-primary)'};">${m.title}</h4>
                                                    <span style="font-size: 10px; padding: 2px 8px; border-radius: 4px; background: ${statusColor}1A; color: ${statusColor}; border: 1px solid ${statusColor}4D; font-weight: 600;">${statusText}</span>
                                                </div>
                                                <p style="font-size: 13px; color: var(--text-secondary); margin: 5px 0;">${m.description || 'No description provided.'}</p>
                                                ${m.deadline ? `<p style="font-size: 11px; color: var(--text-secondary);"><i class='bx bx-calendar-event'></i> Deadline: ${m.deadline}</p>` : ''}
                                                ${m.submittedAt ? `<p style="font-size: 11px; color: var(--text-secondary); margin-top: 6px;"><i class='bx bx-time-five'></i> Submitted: ${m.submittedAt}</p>` : ''}
                                                ${m.adminFeedback ? `<div style="margin-top:10px; padding: 10px; background: rgba(239, 68, 68, 0.05); border-radius: 6px; font-size: 12px; color: #ef4444;"><strong>Feedback:</strong> ${m.adminFeedback}</div>` : ''}
                                                ${actions}
                                            </div>
                                        </div>
                                    `;
                                }).join('');
                            })()}
                        </div>
                    </div>
                    
                    <div style="margin-top: 30px;">
                        <button type="submit" class="btn btn-primary btn-block"><i class='bx bx-save'></i> Save Task Description</button>
                    </div>
                </form>

                <div style="margin-top: 40px; border-top: 1px solid var(--border); padding-top: 20px;">
                    <h3><i class='bx bx-message-square-dots'></i> Task Chat / Updates</h3>
                    <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; height: 400px; margin-top: 15px;">
                        <div id="chat-messages-container" style="flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column;">
                            ${mapComments()}
                        </div>
                        
                        <div id="chat-file-preview" style="display: none; padding: 5px 15px; background: var(--bg-main); font-size: 12px; color: var(--primary);">Attached: <span id="chat-file-name"></span> <i class='bx bx-x' id="chat-file-remove" style="cursor:pointer; vertical-align: middle;"></i></div>
                        
                        <form id="chat-form" style="display: flex; gap: 10px; padding: 15px; background: var(--bg-main); border-top: 1px solid var(--border); align-items: center; margin: 0;">
                            <label for="chat-file" style="cursor: pointer; color: var(--text-secondary); padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: 0.3s; margin:0;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-secondary)'">
                                <i class='bx bx-image-add' style="font-size: 24px;"></i>
                            </label>
                            <input type="file" id="chat-file" accept="image/*" style="display: none;">
                            
                            <input type="text" id="chat-input" placeholder="Type a message or attach screenshot..." style="flex: 1; padding: 10px 15px; border-radius: 20px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-primary); outline: none;">
                            
                            <button type="submit" class="btn btn-primary" style="padding: 10px 20px; border-radius: 20px;"><i class='bx bx-send'></i> Send</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    // ---- Profile Settings ----
    renderProfileSettingsPage() {
        const user = AppState.currentUser;
        return `
            <div class="table-container" style="max-width: 600px; margin: 0 auto;">
                <div class="section-header">
                    <h2><i class='bx bx-user-circle'></i> Profile Settings</h2>
                </div>
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="position: relative; display: inline-block;">
                        <img id="profile-preview-large" src="${user.avatar}" style="width: 120px; height: 120px; border-radius: 50%; border: 4px solid var(--primary); object-fit: cover;">
                        <label for="profile-upload" style="position: absolute; bottom: 5px; right: 5px; background: var(--primary); color: #fff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
                            <i class='bx bx-camera' style="font-size: 18px;"></i>
                        </label>
                        <input type="file" id="profile-upload" accept="image/*" style="display: none;">
                    </div>
                    <h3 style="margin-top: 15px;">${user.name}</h3>
                    <p style="color: var(--text-secondary);">${user.role.toUpperCase()}</p>
                </div>
                
                <form id="profile-settings-form">
                    <div class="input-group">
                        <label>Display Name</label>
                        <div class="input-wrapper">
                            <input type="text" id="fs-name" value="${user.name}" readonly style="opacity: 0.7;">
                        </div>
                        <small style="color: var(--text-secondary); font-size: 11px; margin-top: 5px;">(Contact Admin to change name)</small>
                    </div>
                    
                    <div style="margin-top: 30px; display: flex; gap: 15px;">
                        <button type="button" class="btn btn-secondary btn-block" id="btn-cancel-profile" style="flex: 1;">Cancel</button>
                        <button type="submit" class="btn btn-primary btn-block" style="flex: 2;"><i class='bx bx-save'></i> Update Avatar</button>
                    </div>
                </form>
            </div>
        `;
    }
};
