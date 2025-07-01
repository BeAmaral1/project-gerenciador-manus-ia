// ===========================
// TASKFLOW - JavaScript Completo e Funcional
// ===========================

class TaskFlow {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('taskflow_tasks')) || [];
        this.currentView = 'list';
        this.currentTheme = localStorage.getItem('taskflow_theme') || 'default';
        this.editingTaskId = null;
        this.currentPage = 'tasks'; // 'tasks' ou 'dashboard'
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applyTheme(this.currentTheme);
        this.updateStats();
        this.renderTasks();
        this.updateCategoryFilter();
        this.showWelcomeMessage();
        this.setupNavigation();
    }

    setupNavigation() {
        // Navegação entre páginas
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active de todos os links
                navLinks.forEach(l => l.classList.remove('active'));
                
                // Adiciona active ao link clicado
                link.classList.add('active');
                
                // Determina qual página mostrar
                const linkText = link.textContent.trim().toLowerCase();
                if (linkText.includes('dashboard')) {
                    this.showDashboard();
                } else {
                    this.showTasks();
                }
            });
        });
    }

    showDashboard() {
        this.currentPage = 'dashboard';
        
        // Esconde seções de tarefas
        const sectionsToHide = [
            '.section', 
            '#task-list-container', 
            '#kanban-container',
            '.action-buttons'
        ];
        
        sectionsToHide.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.display = 'none';
            }
        });

        // Mostra dashboard
        const dashboardCards = document.querySelector('.dashboard-cards');
        if (dashboardCards) {
            dashboardCards.style.display = 'grid';
        }

        // Cria ou mostra gráficos do dashboard
        this.renderDashboard();
    }

    showTasks() {
        this.currentPage = 'tasks';
        
        // Mostra seções de tarefas
        const sectionsToShow = [
            '.section', 
            '#task-list-container', 
            '.action-buttons'
        ];
        
        sectionsToShow.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.display = 'block';
            }
        });

        // Mostra dashboard cards também na página de tarefas
        const dashboardCards = document.querySelector('.dashboard-cards');
        if (dashboardCards) {
            dashboardCards.style.display = 'grid';
        }

        // Esconde kanban se estiver ativo
        const kanbanContainer = document.querySelector('#kanban-container');
        if (kanbanContainer) {
            kanbanContainer.style.display = 'none';
        }

        this.renderTasks();
    }

    renderDashboard() {
        // Cria container para gráficos se não existir
        let dashboardContent = document.querySelector('#dashboard-content');
        if (!dashboardContent) {
            dashboardContent = document.createElement('div');
            dashboardContent.id = 'dashboard-content';
            dashboardContent.className = 'mt-4';
            
            const main = document.querySelector('main');
            main.appendChild(dashboardContent);
        }

        // Limpa conteúdo anterior
        dashboardContent.innerHTML = '';

        // Estatísticas detalhadas
        const stats = this.getDetailedStats();
        
        dashboardContent.innerHTML = `
            <div class="row g-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">
                                <i class="bi bi-graph-up"></i> Estatísticas Detalhadas
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-md-3">
                                    <div class="stat-item">
                                        <div class="stat-label">Total de Tarefas</div>
                                        <div class="stat-value text-primary">${stats.total}</div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="stat-item">
                                        <div class="stat-label">Concluídas</div>
                                        <div class="stat-value text-success">${stats.completed}</div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="stat-item">
                                        <div class="stat-label">Em Andamento</div>
                                        <div class="stat-value text-warning">${stats.inProgress}</div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="stat-item">
                                        <div class="stat-label">Pendentes</div>
                                        <div class="stat-value text-info">${stats.pending}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="card-title mb-0">Tarefas por Prioridade</h6>
                        </div>
                        <div class="card-body">
                            <div class="priority-stats">
                                <div class="priority-item">
                                    <span class="priority-label">Alta</span>
                                    <span class="priority-count badge bg-danger">${stats.priorities.alta}</span>
                                </div>
                                <div class="priority-item">
                                    <span class="priority-label">Média</span>
                                    <span class="priority-count badge bg-warning">${stats.priorities.media}</span>
                                </div>
                                <div class="priority-item">
                                    <span class="priority-label">Baixa</span>
                                    <span class="priority-count badge bg-success">${stats.priorities.baixa}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="card-title mb-0">Tarefas por Categoria</h6>
                        </div>
                        <div class="card-body">
                            <div class="category-stats">
                                ${Object.entries(stats.categories).map(([category, count]) => `
                                    <div class="category-item">
                                        <span class="category-label">${category}</span>
                                        <span class="category-count badge bg-primary">${count}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getDetailedStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const inProgress = this.tasks.filter(t => t.status === 'doing').length;
        const pending = total - completed - inProgress;

        const priorities = {
            alta: this.tasks.filter(t => t.priority === 'alta').length,
            media: this.tasks.filter(t => t.priority === 'media').length,
            baixa: this.tasks.filter(t => t.priority === 'baixa').length
        };

        const categories = {};
        this.tasks.forEach(task => {
            const category = task.category || 'Geral';
            categories[category] = (categories[category] || 0) + 1;
        });

        return {
            total,
            completed,
            inProgress,
            pending,
            priorities,
            categories
        };
    }

    setupEventListeners() {
        // Formulário de nova tarefa
        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTask();
            });
        }

        // Busca
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.filterTasks();
            });
        }

        // Filtros
        const filterCategory = document.getElementById('filter-category');
        if (filterCategory) {
            filterCategory.addEventListener('change', () => {
                this.filterTasks();
            });
        }

        const filterPriority = document.getElementById('filter-priority');
        if (filterPriority) {
            filterPriority.addEventListener('change', () => {
                this.filterTasks();
            });
        }

        // Filtros rápidos
        const filterToday = document.getElementById('filter-today');
        if (filterToday) {
            filterToday.addEventListener('click', () => {
                this.filterByDate('today');
            });
        }

        const filterWeek = document.getElementById('filter-week');
        if (filterWeek) {
            filterWeek.addEventListener('click', () => {
                this.filterByDate('week');
            });
        }

        const filterLate = document.getElementById('filter-late');
        if (filterLate) {
            filterLate.addEventListener('click', () => {
                this.filterByDate('late');
            });
        }

        // Alternância de visualização
        const toggleViewBtn = document.getElementById('toggle-view-btn');
        if (toggleViewBtn) {
            toggleViewBtn.addEventListener('click', () => {
                this.toggleView();
            });
        }

        // Temas
        document.querySelectorAll('[data-theme]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const theme = btn.getAttribute('data-theme');
                this.applyTheme(theme);
            });
        });

        // Exportar/Importar
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportTasks();
            });
        }

        const importBtn = document.getElementById('import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const importFile = document.getElementById('import-file');
                if (importFile) {
                    importFile.click();
                }
            });
        }

        const importFile = document.getElementById('import-file');
        if (importFile) {
            importFile.addEventListener('change', (e) => {
                this.importTasks(e.target.files[0]);
            });
        }

        // Modal de edição
        const saveEditBtn = document.getElementById('save-edit-btn');
        if (saveEditBtn) {
            saveEditBtn.addEventListener('click', () => {
                this.saveEdit();
            });
        }
    }

    addTask() {
        const taskInput = document.getElementById('task-input');
        const categoryInput = document.getElementById('category-input');
        const priorityInput = document.getElementById('priority-input');
        const dateInput = document.getElementById('date-input');

        if (!taskInput || !categoryInput || !priorityInput || !dateInput) {
            console.error('Elementos do formulário não encontrados');
            return;
        }

        const task = {
            id: Date.now(),
            text: taskInput.value.trim(),
            category: categoryInput.value.trim() || 'Geral',
            priority: priorityInput.value,
            date: dateInput.value,
            status: 'todo',
            completed: false,
            createdAt: new Date().toISOString()
        };

        if (!task.text) {
            this.showToast('Por favor, digite uma descrição para a tarefa.', 'warning');
            return;
        }

        this.tasks.push(task);
        this.saveTasks();
        this.updateStats();
        this.renderTasks();
        this.updateCategoryFilter();

        // Limpar formulário
        taskInput.value = '';
        categoryInput.value = '';
        priorityInput.value = 'media';
        dateInput.value = '';

        this.showToast('Tarefa adicionada com sucesso!', 'success');
        
        // Animação de foco
        taskInput.focus();
    }

    deleteTask(id) {
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveTasks();
            this.updateStats();
            this.renderTasks();
            this.updateCategoryFilter();
            this.showToast('Tarefa excluída com sucesso!', 'success');
        }
    }

    toggleTaskStatus(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.status = task.completed ? 'done' : 'todo';
            this.saveTasks();
            this.updateStats();
            this.renderTasks();
            
            const message = task.completed ? 'Tarefa concluída!' : 'Tarefa reaberta!';
            this.showToast(message, 'success');
        }
    }

    moveTaskToInProgress(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.status = task.status === 'doing' ? 'todo' : 'doing';
            this.saveTasks();
            this.renderTasks();
            
            const message = task.status === 'doing' ? 'Tarefa movida para "Em Andamento"!' : 'Tarefa movida para "A Fazer"!';
            this.showToast(message, 'info');
        }
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.editingTaskId = id;
            
            const editTaskInput = document.getElementById('edit-task-input');
            const editCategoryInput = document.getElementById('edit-category-input');
            const editPriorityInput = document.getElementById('edit-priority-input');
            const editDateInput = document.getElementById('edit-date-input');

            if (editTaskInput) editTaskInput.value = task.text;
            if (editCategoryInput) editCategoryInput.value = task.category;
            if (editPriorityInput) editPriorityInput.value = task.priority;
            if (editDateInput) editDateInput.value = task.date;
            
            const editModal = document.getElementById('editModal');
            if (editModal && typeof bootstrap !== 'undefined') {
                const modal = new bootstrap.Modal(editModal);
                modal.show();
            }
        }
    }

    saveEdit() {
        if (!this.editingTaskId) return;

        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (task) {
            const editTaskInput = document.getElementById('edit-task-input');
            const newText = editTaskInput ? editTaskInput.value.trim() : '';
            
            if (!newText) {
                this.showToast('Por favor, digite uma descrição para a tarefa.', 'warning');
                return;
            }

            task.text = newText;
            
            const editCategoryInput = document.getElementById('edit-category-input');
            const editPriorityInput = document.getElementById('edit-priority-input');
            const editDateInput = document.getElementById('edit-date-input');

            if (editCategoryInput) task.category = editCategoryInput.value.trim() || 'Geral';
            if (editPriorityInput) task.priority = editPriorityInput.value;
            if (editDateInput) task.date = editDateInput.value;

            this.saveTasks();
            this.updateStats();
            this.renderTasks();
            this.updateCategoryFilter();

            const editModal = document.getElementById('editModal');
            if (editModal && typeof bootstrap !== 'undefined') {
                const modal = bootstrap.Modal.getInstance(editModal);
                if (modal) modal.hide();
            }

            this.showToast('Tarefa editada com sucesso!', 'success');
            this.editingTaskId = null;
        }
    }

    toggleView() {
        this.currentView = this.currentView === 'list' ? 'kanban' : 'list';
        
        const toggleBtn = document.getElementById('toggle-view-btn');
        const taskListContainer = document.getElementById('task-list-container');
        const kanbanContainer = document.getElementById('kanban-container');

        if (this.currentView === 'kanban') {
            if (toggleBtn) {
                toggleBtn.innerHTML = '<i class="bi bi-list"></i> Lista';
            }
            if (taskListContainer) taskListContainer.style.display = 'none';
            if (kanbanContainer) kanbanContainer.style.display = 'block';
            this.renderKanban();
        } else {
            if (toggleBtn) {
                toggleBtn.innerHTML = '<i class="bi bi-kanban"></i> Kanban';
            }
            if (taskListContainer) taskListContainer.style.display = 'block';
            if (kanbanContainer) kanbanContainer.style.display = 'none';
            this.renderTasks();
        }
    }

    renderTasks() {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;

        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <div class="empty-title">Nenhuma tarefa encontrada</div>
                    <div class="empty-subtitle">Adicione uma nova tarefa para começar!</div>
                </div>
            `;
            return;
        }

        taskList.innerHTML = filteredTasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-content">
                    <div class="task-header">
                        <div class="task-title">${this.escapeHtml(task.text)}</div>
                        <div class="task-actions">
                            <button class="btn-action btn-edit" onclick="taskFlow.editTask(${task.id})" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn-action btn-delete" onclick="taskFlow.deleteTask(${task.id})" title="Excluir">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="task-meta">
                        <span class="task-category">
                            <i class="bi bi-tag"></i> ${this.escapeHtml(task.category)}
                        </span>
                        <span class="task-priority priority-${task.priority}">
                            <i class="bi bi-flag"></i> ${this.getPriorityText(task.priority)}
                        </span>
                        ${task.date ? `
                            <span class="task-date">
                                <i class="bi bi-calendar"></i> ${this.formatDate(task.date)}
                            </span>
                        ` : ''}
                    </div>
                </div>
                
                <div class="task-controls">
                    <button class="btn-control btn-progress" onclick="taskFlow.moveTaskToInProgress(${task.id})" title="${task.status === 'doing' ? 'Mover para A Fazer' : 'Mover para Em Andamento'}">
                        <i class="bi bi-arrow-right-circle"></i>
                    </button>
                    <button class="btn-control btn-complete" onclick="taskFlow.toggleTaskStatus(${task.id})" title="${task.completed ? 'Marcar como Pendente' : 'Marcar como Concluída'}">
                        <i class="bi bi-check-circle${task.completed ? '-fill' : ''}"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderKanban() {
        const kanbanContainer = document.getElementById('kanban-container');
        if (!kanbanContainer) return;

        const todoTasks = this.tasks.filter(t => t.status === 'todo' && !t.completed);
        const doingTasks = this.tasks.filter(t => t.status === 'doing' && !t.completed);
        const doneTasks = this.tasks.filter(t => t.completed);

        kanbanContainer.innerHTML = `
            <div class="kanban-board">
                <div class="kanban-column">
                    <div class="kanban-header">
                        <i class="bi bi-circle"></i> A Fazer
                        <span class="task-count">${todoTasks.length}</span>
                    </div>
                    <div class="kanban-tasks">
                        ${todoTasks.map(task => this.renderKanbanTask(task)).join('')}
                        ${todoTasks.length === 0 ? '<div class="kanban-empty">Nenhuma tarefa</div>' : ''}
                    </div>
                </div>
                
                <div class="kanban-column">
                    <div class="kanban-header">
                        <i class="bi bi-arrow-clockwise"></i> Em Andamento
                        <span class="task-count">${doingTasks.length}</span>
                    </div>
                    <div class="kanban-tasks">
                        ${doingTasks.map(task => this.renderKanbanTask(task)).join('')}
                        ${doingTasks.length === 0 ? '<div class="kanban-empty">Nenhuma tarefa</div>' : ''}
                    </div>
                </div>
                
                <div class="kanban-column">
                    <div class="kanban-header">
                        <i class="bi bi-check-circle"></i> Concluído
                        <span class="task-count">${doneTasks.length}</span>
                    </div>
                    <div class="kanban-tasks">
                        ${doneTasks.map(task => this.renderKanbanTask(task)).join('')}
                        ${doneTasks.length === 0 ? '<div class="kanban-empty">Nenhuma tarefa</div>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderKanbanTask(task) {
        return `
            <div class="kanban-task" data-id="${task.id}">
                <div class="kanban-task-title">${this.escapeHtml(task.text)}</div>
                <div class="kanban-task-meta">
                    <span class="kanban-category">${this.escapeHtml(task.category)}</span>
                    <span class="kanban-priority priority-${task.priority}">${this.getPriorityText(task.priority)}</span>
                </div>
                <div class="kanban-task-actions">
                    <button class="btn-kanban-action" onclick="taskFlow.editTask(${task.id})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn-kanban-action" onclick="taskFlow.moveTaskToInProgress(${task.id})" title="Mover">
                        <i class="bi bi-arrow-right"></i>
                    </button>
                    <button class="btn-kanban-action" onclick="taskFlow.toggleTaskStatus(${task.id})" title="Concluir">
                        <i class="bi bi-check"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getFilteredTasks() {
        let filtered = [...this.tasks];

        // Filtro de busca
        const searchInput = document.getElementById('search-input');
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        if (searchTerm) {
            filtered = filtered.filter(task => 
                task.text.toLowerCase().includes(searchTerm) ||
                task.category.toLowerCase().includes(searchTerm)
            );
        }

        // Filtro de categoria
        const filterCategory = document.getElementById('filter-category');
        const selectedCategory = filterCategory ? filterCategory.value : '';
        if (selectedCategory) {
            filtered = filtered.filter(task => task.category === selectedCategory);
        }

        // Filtro de prioridade
        const filterPriority = document.getElementById('filter-priority');
        const selectedPriority = filterPriority ? filterPriority.value : '';
        if (selectedPriority) {
            filtered = filtered.filter(task => task.priority === selectedPriority);
        }

        return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    filterByDate(type) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let filtered = [];

        switch (type) {
            case 'today':
                filtered = this.tasks.filter(task => {
                    if (!task.date) return false;
                    const taskDate = new Date(task.date);
                    taskDate.setHours(0, 0, 0, 0);
                    return taskDate.getTime() === today.getTime();
                });
                break;

            case 'week':
                const weekEnd = new Date(today);
                weekEnd.setDate(today.getDate() + 7);
                filtered = this.tasks.filter(task => {
                    if (!task.date) return false;
                    const taskDate = new Date(task.date);
                    return taskDate >= today && taskDate <= weekEnd;
                });
                break;

            case 'late':
                filtered = this.tasks.filter(task => {
                    if (!task.date || task.completed) return false;
                    const taskDate = new Date(task.date);
                    taskDate.setHours(0, 0, 0, 0);
                    return taskDate < today;
                });
                break;
        }

        // Renderiza apenas as tarefas filtradas
        const taskList = document.getElementById('task-list');
        if (!taskList) return;

        if (filtered.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📅</div>
                    <div class="empty-title">Nenhuma tarefa encontrada</div>
                    <div class="empty-subtitle">Não há tarefas para o filtro selecionado.</div>
                </div>
            `;
            return;
        }

        taskList.innerHTML = filtered.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-content">
                    <div class="task-header">
                        <div class="task-title">${this.escapeHtml(task.text)}</div>
                        <div class="task-actions">
                            <button class="btn-action btn-edit" onclick="taskFlow.editTask(${task.id})" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn-action btn-delete" onclick="taskFlow.deleteTask(${task.id})" title="Excluir">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="task-meta">
                        <span class="task-category">
                            <i class="bi bi-tag"></i> ${this.escapeHtml(task.category)}
                        </span>
                        <span class="task-priority priority-${task.priority}">
                            <i class="bi bi-flag"></i> ${this.getPriorityText(task.priority)}
                        </span>
                        ${task.date ? `
                            <span class="task-date">
                                <i class="bi bi-calendar"></i> ${this.formatDate(task.date)}
                            </span>
                        ` : ''}
                    </div>
                </div>
                
                <div class="task-controls">
                    <button class="btn-control btn-progress" onclick="taskFlow.moveTaskToInProgress(${task.id})" title="${task.status === 'doing' ? 'Mover para A Fazer' : 'Mover para Em Andamento'}">
                        <i class="bi bi-arrow-right-circle"></i>
                    </button>
                    <button class="btn-control btn-complete" onclick="taskFlow.toggleTaskStatus(${task.id})" title="${task.completed ? 'Marcar como Pendente' : 'Marcar como Concluída'}">
                        <i class="bi bi-check-circle${task.completed ? '-fill' : ''}"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.showToast(`Filtro aplicado: ${filtered.length} tarefa(s) encontrada(s)`, 'info');
    }

    filterTasks() {
        this.renderTasks();
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;

        const totalElement = document.getElementById('total-tasks');
        const completedElement = document.getElementById('completed-tasks');
        const pendingElement = document.getElementById('pending-tasks');

        if (totalElement) totalElement.textContent = total;
        if (completedElement) completedElement.textContent = completed;
        if (pendingElement) pendingElement.textContent = pending;
    }

    updateCategoryFilter() {
        const filterCategory = document.getElementById('filter-category');
        if (!filterCategory) return;

        const categories = [...new Set(this.tasks.map(t => t.category))];
        const currentValue = filterCategory.value;

        filterCategory.innerHTML = '<option value="">Todas categorias</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            filterCategory.appendChild(option);
        });

        filterCategory.value = currentValue;
    }

    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `taskflow_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showToast('Tarefas exportadas com sucesso!', 'success');
    }

    importTasks(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedTasks)) {
                    throw new Error('Formato de arquivo inválido');
                }

                this.tasks = importedTasks;
                this.saveTasks();
                this.updateStats();
                this.renderTasks();
                this.updateCategoryFilter();
                
                this.showToast(`${importedTasks.length} tarefa(s) importada(s) com sucesso!`, 'success');
            } catch (error) {
                this.showToast('Erro ao importar arquivo. Verifique o formato.', 'error');
            }
        };
        
        reader.readAsText(file);
    }

    applyTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('taskflow_theme', theme);
        
        this.showToast(`Tema "${this.getThemeText(theme)}" aplicado!`, 'success');
    }

    getThemeText(theme) {
        const themes = {
            'default': 'Padrão',
            'dark': 'Escuro',
            'green': 'Verde',
            'red': 'Vermelho',
            'blue': 'Azul Pastel'
        };
        return themes[theme] || 'Padrão';
    }

    getPriorityText(priority) {
        const priorities = {
            'baixa': 'Baixa',
            'media': 'Média',
            'alta': 'Alta'
        };
        return priorities[priority] || 'Média';
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveTasks() {
        localStorage.setItem('taskflow_tasks', JSON.stringify(this.tasks));
    }

    showToast(message, type = 'info') {
        // Remove toasts existentes
        const existingToasts = document.querySelectorAll('.toast-notification');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="bi bi-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="bi bi-x"></i>
            </button>
        `;

        document.body.appendChild(toast);

        // Auto remove após 3 segundos
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    showWelcomeMessage() {
        if (this.tasks.length === 0) {
            setTimeout(() => {
                this.showToast('Bem-vindo ao TaskFlow! Adicione sua primeira tarefa para começar.', 'info');
            }, 1000);
        }
    }
}

// Inicializar aplicação
let taskFlow;
document.addEventListener('DOMContentLoaded', () => {
    taskFlow = new TaskFlow();
});

// Expor globalmente para uso nos event handlers inline
window.taskFlow = taskFlow;

