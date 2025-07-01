// ===========================
// TASKFLOW - JavaScript Moderno
// ===========================

class TaskFlow {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('taskflow_tasks')) || [];
        this.currentView = 'list';
        this.currentTheme = localStorage.getItem('taskflow_theme') || 'default';
        this.editingTaskId = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applyTheme(this.currentTheme);
        this.updateStats();
        this.renderTasks();
        this.updateCategoryFilter();
        this.showWelcomeMessage();
    }

    setupEventListeners() {
        // Formulário de nova tarefa
        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Busca
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.filterTasks();
        });

        // Filtros
        document.getElementById('filter-category').addEventListener('change', () => {
            this.filterTasks();
        });

        document.getElementById('filter-priority').addEventListener('change', () => {
            this.filterTasks();
        });

        // Filtros rápidos
        document.getElementById('filter-today').addEventListener('click', () => {
            this.filterByDate('today');
        });

        document.getElementById('filter-week').addEventListener('click', () => {
            this.filterByDate('week');
        });

        document.getElementById('filter-late').addEventListener('click', () => {
            this.filterByDate('late');
        });

        // Alternância de visualização
        document.getElementById('toggle-view-btn').addEventListener('click', () => {
            this.toggleView();
        });

        // Temas
        document.querySelectorAll('[data-theme]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const theme = btn.getAttribute('data-theme');
                this.applyTheme(theme);
            });
        });

        // Exportar/Importar
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportTasks();
        });

        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importTasks(e.target.files[0]);
        });

        // Modal de edição
        document.getElementById('save-edit-btn').addEventListener('click', () => {
            this.saveEdit();
        });
    }

    addTask() {
        const taskInput = document.getElementById('task-input');
        const categoryInput = document.getElementById('category-input');
        const priorityInput = document.getElementById('priority-input');
        const dateInput = document.getElementById('date-input');

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
            
            document.getElementById('edit-task-input').value = task.text;
            document.getElementById('edit-category-input').value = task.category;
            document.getElementById('edit-priority-input').value = task.priority;
            document.getElementById('edit-date-input').value = task.date;
            
            const modal = new bootstrap.Modal(document.getElementById('editModal'));
            modal.show();
        }
    }

    saveEdit() {
        if (!this.editingTaskId) return;

        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (task) {
            const newText = document.getElementById('edit-task-input').value.trim();
            
            if (!newText) {
                this.showToast('Por favor, digite uma descrição para a tarefa.', 'warning');
                return;
            }

            task.text = newText;
            task.category = document.getElementById('edit-category-input').value.trim() || 'Geral';
            task.priority = document.getElementById('edit-priority-input').value;
            task.date = document.getElementById('edit-date-input').value;

            this.saveTasks();
            this.renderTasks();
            this.updateCategoryFilter();

            const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
            modal.hide();

            this.showToast('Tarefa atualizada com sucesso!', 'success');
        }

        this.editingTaskId = null;
    }

    filterTasks() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const categoryFilter = document.getElementById('filter-category').value;
        const priorityFilter = document.getElementById('filter-priority').value;

        const filteredTasks = this.tasks.filter(task => {
            const matchesSearch = task.text.toLowerCase().includes(searchTerm) ||
                                task.category.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || task.category === categoryFilter;
            const matchesPriority = !priorityFilter || task.priority === priorityFilter;

            return matchesSearch && matchesCategory && matchesPriority;
        });

        this.renderFilteredTasks(filteredTasks);
    }

    filterByDate(type) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let filteredTasks = [];

        switch (type) {
            case 'today':
                filteredTasks = this.tasks.filter(task => {
                    if (!task.date) return false;
                    const taskDate = new Date(task.date);
                    return taskDate.getTime() === today.getTime();
                });
                break;

            case 'week':
                const weekEnd = new Date(today);
                weekEnd.setDate(today.getDate() + 7);
                
                filteredTasks = this.tasks.filter(task => {
                    if (!task.date) return false;
                    const taskDate = new Date(task.date);
                    return taskDate >= today && taskDate <= weekEnd;
                });
                break;

            case 'late':
                filteredTasks = this.tasks.filter(task => {
                    if (!task.date || task.completed) return false;
                    const taskDate = new Date(task.date);
                    return taskDate < today;
                });
                break;
        }

        this.renderFilteredTasks(filteredTasks);
        
        // Feedback visual
        document.querySelectorAll('.quick-filters .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.getElementById(`filter-${type}`);
        activeBtn.classList.add('active');
        
        setTimeout(() => {
            activeBtn.classList.remove('active');
        }, 2000);
    }

    renderTasks() {
        if (this.currentView === 'list') {
            this.renderListView();
        } else {
            this.renderKanbanView();
        }
    }

    renderFilteredTasks(tasks) {
        if (this.currentView === 'list') {
            this.renderListView(tasks);
        } else {
            this.renderKanbanView(tasks);
        }
    }

    renderListView(tasksToRender = null) {
        const taskList = document.getElementById('task-list');
        const emptyState = document.getElementById('empty-state');
        const tasks = tasksToRender || this.tasks;

        taskList.innerHTML = '';

        if (tasks.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item fade-in ${task.completed ? 'completed' : ''}`;
            li.setAttribute('data-priority', task.priority);

            const priorityClass = `badge-priority-${task.priority}`;
            const statusIcon = this.getStatusIcon(task.status);
            const dateDisplay = task.date ? this.formatDate(task.date) : '';
            const isOverdue = this.isOverdue(task.date) && !task.completed;

            li.innerHTML = `
                <div class="task-content">
                    <div class="task-header">
                        <div class="task-title ${task.completed ? 'text-decoration-line-through' : ''}">
                            ${statusIcon} ${this.escapeHtml(task.text)}
                        </div>
                        <div class="task-badges">
                            <span class="badge badge-category">${this.escapeHtml(task.category)}</span>
                            <span class="badge ${priorityClass}">${task.priority.toUpperCase()}</span>
                            ${dateDisplay ? `<span class="task-date ${isOverdue ? 'text-danger' : ''}">
                                <i class="bi bi-calendar"></i> ${dateDisplay}
                                ${isOverdue ? '<i class="bi bi-exclamation-triangle text-danger"></i>' : ''}
                            </span>` : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        ${!task.completed ? `
                            <button class="btn btn-warning btn-sm" onclick="taskFlow.moveTaskToInProgress(${task.id})" 
                                    title="${task.status === 'doing' ? 'Voltar para A Fazer' : 'Mover para Em Andamento'}">
                                <i class="bi bi-arrow-repeat"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-info btn-sm" onclick="taskFlow.editTask(${task.id})" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="taskFlow.deleteTask(${task.id})" title="Excluir">
                            <i class="bi bi-trash"></i>
                        </button>
                        <button class="btn ${task.completed ? 'btn-secondary' : 'btn-success'} btn-sm" 
                                onclick="taskFlow.toggleTaskStatus(${task.id})" 
                                title="${task.completed ? 'Reabrir' : 'Concluir'}">
                            <i class="bi bi-${task.completed ? 'arrow-counterclockwise' : 'check-circle'}"></i>
                        </button>
                    </div>
                </div>
            `;

            taskList.appendChild(li);
        });
    }

    renderKanbanView(tasksToRender = null) {
        const tasks = tasksToRender || this.tasks;
        
        const todoTasks = tasks.filter(task => task.status === 'todo');
        const doingTasks = tasks.filter(task => task.status === 'doing');
        const doneTasks = tasks.filter(task => task.status === 'done' || task.completed);

        this.renderKanbanColumn('kanban-todo', todoTasks);
        this.renderKanbanColumn('kanban-doing', doingTasks);
        this.renderKanbanColumn('kanban-done', doneTasks);
    }

    renderKanbanColumn(columnId, tasks) {
        const column = document.getElementById(columnId);
        column.innerHTML = '';

        if (tasks.length === 0) {
            column.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-inbox"></i><br>Nenhuma tarefa</div>';
            return;
        }

        tasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = 'kanban-task slide-in';
            taskCard.setAttribute('data-priority', task.priority);

            const priorityClass = `badge-priority-${task.priority}`;
            const dateDisplay = task.date ? this.formatDate(task.date) : '';
            const isOverdue = this.isOverdue(task.date) && !task.completed;

            taskCard.innerHTML = `
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <span class="badge badge-category">${this.escapeHtml(task.category)}</span>
                    <span class="badge ${priorityClass}">${task.priority.toUpperCase()}</span>
                </div>
                <div class="fw-semibold mb-2 ${task.completed ? 'text-decoration-line-through' : ''}">
                    ${this.escapeHtml(task.text)}
                </div>
                ${dateDisplay ? `
                    <div class="task-date ${isOverdue ? 'text-danger' : ''} mb-2">
                        <i class="bi bi-calendar"></i> ${dateDisplay}
                        ${isOverdue ? '<i class="bi bi-exclamation-triangle text-danger"></i>' : ''}
                    </div>
                ` : ''}
                <div class="d-flex gap-1 justify-content-end">
                    ${!task.completed ? `
                        <button class="btn btn-warning btn-sm" onclick="taskFlow.moveTaskToInProgress(${task.id})" 
                                title="${task.status === 'doing' ? 'Voltar para A Fazer' : 'Mover para Em Andamento'}">
                            <i class="bi bi-arrow-repeat"></i>
                        </button>
                    ` : ''}
                    <button class="btn btn-info btn-sm" onclick="taskFlow.editTask(${task.id})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="taskFlow.deleteTask(${task.id})" title="Excluir">
                        <i class="bi bi-trash"></i>
                    </button>
                    <button class="btn ${task.completed ? 'btn-secondary' : 'btn-success'} btn-sm" 
                            onclick="taskFlow.toggleTaskStatus(${task.id})" 
                            title="${task.completed ? 'Reabrir' : 'Concluir'}">
                        <i class="bi bi-${task.completed ? 'arrow-counterclockwise' : 'check-circle'}"></i>
                    </button>
                </div>
            `;

            column.appendChild(taskCard);
        });
    }

    toggleView() {
        const listView = document.getElementById('list-view');
        const kanbanView = document.getElementById('kanban-view');
        const toggleBtn = document.getElementById('toggle-view-btn');
        const viewText = document.getElementById('view-text');

        if (this.currentView === 'list') {
            this.currentView = 'kanban';
            listView.style.display = 'none';
            kanbanView.style.display = 'block';
            toggleBtn.innerHTML = '<i class="bi bi-list-ul"></i> <span id="view-text">Lista</span>';
            this.renderKanbanView();
        } else {
            this.currentView = 'list';
            listView.style.display = 'block';
            kanbanView.style.display = 'none';
            toggleBtn.innerHTML = '<i class="bi bi-kanban"></i> <span id="view-text">Kanban</span>';
            this.renderListView();
        }
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;

        document.getElementById('total-tasks').textContent = total;
        document.getElementById('completed-tasks').textContent = completed;
        document.getElementById('pending-tasks').textContent = pending;

        // Animação nos números
        this.animateNumber('total-tasks', total);
        this.animateNumber('completed-tasks', completed);
        this.animateNumber('pending-tasks', pending);
    }

    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const currentValue = parseInt(element.textContent) || 0;
        
        if (currentValue === targetValue) return;

        const increment = targetValue > currentValue ? 1 : -1;
        const timer = setInterval(() => {
            const current = parseInt(element.textContent);
            if (current === targetValue) {
                clearInterval(timer);
            } else {
                element.textContent = current + increment;
            }
        }, 50);
    }

    updateCategoryFilter() {
        const categoryFilter = document.getElementById('filter-category');
        const categories = [...new Set(this.tasks.map(task => task.category))];
        
        const currentValue = categoryFilter.value;
        categoryFilter.innerHTML = '<option value="">Todas categorias</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
        
        categoryFilter.value = currentValue;
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        localStorage.setItem('taskflow_theme', theme);
        
        this.showToast(`Tema "${this.getThemeName(theme)}" aplicado!`, 'info');
    }

    getThemeName(theme) {
        const themes = {
            'default': 'Padrão',
            'dark': 'Escuro',
            'green': 'Verde',
            'red': 'Vermelho',
            'blue': 'Azul Pastel'
        };
        return themes[theme] || 'Padrão';
    }

    exportTasks() {
        if (this.tasks.length === 0) {
            this.showToast('Não há tarefas para exportar.', 'warning');
            return;
        }

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

                // Validar estrutura das tarefas
                const validTasks = importedTasks.filter(task => 
                    task.text && task.id && task.priority && task.category
                );

                if (validTasks.length === 0) {
                    throw new Error('Nenhuma tarefa válida encontrada no arquivo');
                }

                // Mesclar com tarefas existentes
                const existingIds = new Set(this.tasks.map(task => task.id));
                const newTasks = validTasks.filter(task => !existingIds.has(task.id));

                this.tasks.push(...newTasks);
                this.saveTasks();
                this.updateStats();
                this.renderTasks();
                this.updateCategoryFilter();

                this.showToast(`${newTasks.length} tarefas importadas com sucesso!`, 'success');
                
            } catch (error) {
                this.showToast('Erro ao importar arquivo: ' + error.message, 'error');
            }
        };

        reader.readAsText(file);
        
        // Limpar input
        document.getElementById('import-file').value = '';
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        const toastId = 'toast-' + Date.now();
        
        const toastHtml = `
            <div class="toast toast-${type}" id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <i class="bi bi-${this.getToastIcon(type)} me-2"></i>
                    <strong class="me-auto">TaskFlow</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Fechar"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 4000 });
        toast.show();
        
        // Remover toast após ser ocultado
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    getToastIcon(type) {
        const icons = {
            'success': 'check-circle-fill',
            'error': 'exclamation-triangle-fill',
            'warning': 'exclamation-triangle-fill',
            'info': 'info-circle-fill'
        };
        return icons[type] || 'info-circle-fill';
    }

    getStatusIcon(status) {
        const icons = {
            'todo': '<i class="bi bi-circle text-warning"></i>',
            'doing': '<i class="bi bi-arrow-repeat text-info"></i>',
            'done': '<i class="bi bi-check-circle-fill text-success"></i>'
        };
        return icons[status] || icons['todo'];
    }

    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Hoje';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Amanhã';
        } else {
            return date.toLocaleDateString('pt-BR');
        }
    }

    isOverdue(dateString) {
        if (!dateString) return false;
        
        const taskDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return taskDate < today;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveTasks() {
        localStorage.setItem('taskflow_tasks', JSON.stringify(this.tasks));
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

// Atalhos de teclado
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N para nova tarefa
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('task-input').focus();
    }
    
    // Ctrl/Cmd + K para busca
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input').focus();
    }
    
    // Ctrl/Cmd + Shift + K para alternar visualização
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        taskFlow.toggleView();
    }
});

// Service Worker para PWA (opcional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

