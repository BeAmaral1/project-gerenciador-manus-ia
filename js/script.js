// TaskFlow - JS Completo
// =====================

// ---------------------
// Utilitários
// ---------------------

// Exibe um toast (mensagem temporária) na tela
function showToast(msg, type = "info") {
    const toast = document.getElementById('toast');
    const toastBody = toast.querySelector('.toast-body');
    toastBody.textContent = msg;
    toast.className = `toast align-items-center text-bg-${type} border-0 position-fixed top-0 end-0 mt-4 me-4 show ${type}`;
    toast.style.display = "block";
    setTimeout(() => { toast.classList.remove('show'); toast.style.display = "none"; }, 2500);
}

// ---------------------
// Dados e Storage
// ---------------------

// Carrega tarefas do localStorage ou inicia vazio
let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
// Define a visualização padrão (lista ou kanban)
let currentView = localStorage.getItem('currentView') || 'list';
// Carrega o tema salvo ou usa o padrão
let currentTheme = localStorage.getItem('theme') || 'default';

// Aplica o tema salvo no localStorage ao carregar o dashboard
document.addEventListener('DOMContentLoaded', function () {
    const temaSalvo = localStorage.getItem('theme');
    if (temaSalvo) {
        applyTheme(temaSalvo);
    }
});

// ---------------------
// Renderização
// ---------------------

// Renderiza as tarefas na tela (lista ou kanban)
function renderTasks() {
    const list = document.getElementById('task-list');
    list.innerHTML = '';
    let filtered = filterTasks(tasks);

    // Se for visualização Kanban, chama função específica
    if (currentView === 'kanban') {
        renderKanban(filtered);
        return;
    }

    // Renderiza cada tarefa como item de lista
    filtered.forEach((task, idx) => {
        const originalIdx = tasks.findIndex(t => t === task);
        const li = document.createElement('li');
        li.className = `list-group-item d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2${task.completed ? ' completed' : ''}`;
        li.setAttribute('data-priority', task.priority);
        li.setAttribute('tabindex', 0);
        li.setAttribute('role', 'listitem');
        li.dataset.idx = originalIdx;

        // Monta o conteúdo principal da tarefa
        const left = document.createElement('div');
        if (task.category)
            left.innerHTML += `<span class="badge-category">${task.category}</span>`;
        left.innerHTML += `<span class="priority">${capitalize(task.priority)}</span>`;
        left.innerHTML += `<span class="fw-semibold ms-2">${escapeHtml(task.title)}</span>`;
        if (task.due)
            left.innerHTML += `<span class="due-date ms-2"><i class="bi bi-calendar-event"></i> ${task.due}</span>`;

        // Renderiza subtarefas, se houver
        if (task.subtasks && task.subtasks.length) {
            const ul = document.createElement('ul');
            ul.className = "subtasks list-unstyled ms-4 mt-2";
            task.subtasks.forEach((st, i) => {
                ul.innerHTML += `<li>
                    <input type="checkbox" ${st.done ? "checked" : ""} data-subidx="${i}" aria-label="Marcar subtarefa">
                    ${escapeHtml(st.text)}
                </li>`;
            });
            left.appendChild(ul);
        }

        // Botões de ação da tarefa
        const actions = document.createElement('div');
        actions.className = "actions d-flex gap-2";
        actions.innerHTML = `
            ${task.status === "doing" ? `
                <button class="btn btn-secondary btn-sm to-todo-btn" title="Mover para A Fazer">
                    <i class="bi bi-arrow-left"></i>
                </button>
            ` : `
                <button class="btn btn-warning btn-sm in-progress-btn" title="Mover para Em andamento">
                    <i class="bi bi-arrow-repeat"></i>
                </button>
            `}
            <button class="btn btn-primary btn-sm edit-btn" title="Editar">
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-danger btn-sm delete-btn" title="Excluir">
                <i class="bi bi-trash"></i>
            </button>
            <button class="btn btn-success btn-sm complete-btn" title="Concluir">
                <i class="bi bi-check-lg"></i>
            </button>
        `;

        li.appendChild(left);
        li.appendChild(actions);
        list.appendChild(li);
    });

    updateStats();
}

// Renderiza as tarefas no modo Kanban
function renderKanban(filtered) {
    const kanbanContainer = document.getElementById('task-list');
    kanbanContainer.innerHTML = `
        <div class="row g-3">
            <div class="col-md-4">
                <div class="kanban-col">
                    <h5 class="text-center mb-3">A Fazer</h5>
                    <div id="todo-tasks" class="kanban-tasks"></div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="kanban-col">
                    <h5 class="text-center mb-3">Fazendo</h5>
                    <div id="doing-tasks" class="kanban-tasks"></div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="kanban-col">
                    <h5 class="text-center mb-3">Feito</h5>
                    <div id="done-tasks" class="kanban-tasks"></div>
                </div>
            </div>
        </div>
    `;

    // Distribui tarefas por status
    const todoTasks = document.getElementById('todo-tasks');
    const doingTasks = document.getElementById('doing-tasks');
    const doneTasks = document.getElementById('done-tasks');

    filtered.forEach((task, idx) => {
        const originalIdx = tasks.findIndex(t => t === task);
        const card = document.createElement('div');
        card.className = 'kanban-task card mb-2';
        card.dataset.idx = originalIdx;
        card.innerHTML = `
            <div class="card-body p-3">
                ${task.category ? `<span class="badge-category">${task.category}</span>` : ''}
                <span class="priority">${capitalize(task.priority)}</span>
                <h6 class="card-title mt-2">${escapeHtml(task.title)}</h6>
                ${task.due ? `<small class="text-muted"><i class="bi bi-calendar-event"></i> ${task.due}</small>` : ''}
                <div class="actions d-flex gap-1 mt-2">
                    ${task.status === "doing" ? `
                        <button class="btn btn-secondary btn-sm to-todo-btn" title="Mover para A Fazer">
                            <i class="bi bi-arrow-left"></i>
                        </button>
                    ` : `
                        <button class="btn btn-warning btn-sm in-progress-btn" title="Mover para Em andamento">
                            <i class="bi bi-arrow-repeat"></i>
                        </button>
                    `}
                    <button class="btn btn-primary btn-sm edit-btn" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-danger btn-sm delete-btn" title="Excluir">
                        <i class="bi bi-trash"></i>
                    </button>
                    <button class="btn btn-success btn-sm complete-btn" title="Concluir">
                        <i class="bi bi-check-lg"></i>
                    </button>
                </div>
            </div>
        `;

        if (task.status === 'todo' || !task.status) {
            todoTasks.appendChild(card);
        } else if (task.status === 'doing') {
            doingTasks.appendChild(card);
        } else if (task.status === 'done' || task.completed) {
            doneTasks.appendChild(card);
        }
    });

    updateStats();
}

// Atualiza estatísticas do dashboard
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    document.getElementById('total-tasks').textContent = total;
    document.getElementById('completed-tasks').textContent = completed;
    document.getElementById('pending-tasks').textContent = pending;
}

// Salva tarefas no localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Capitaliza primeira letra
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Escapa HTML para evitar XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ---------------------
// Filtros
// ---------------------

// Filtra as tarefas conforme busca, categoria, prioridade e filtros rápidos
function filterTasks(list) {
    let filtered = [...list];
    const search = document.getElementById('search-input')?.value?.toLowerCase() || "";
    const cat = document.getElementById('filter-category')?.value || "";
    const prio = document.getElementById('filter-priority')?.value || "";

    if (search) filtered = filtered.filter(t => t.title.toLowerCase().includes(search));
    if (cat) filtered = filtered.filter(t => t.category === cat);
    if (prio) filtered = filtered.filter(t => t.priority === prio);

    // Filtros rápidos: hoje, semana, atrasadas
    if (window.quickFilter === "today") {
        const today = new Date().toISOString().slice(0,10);
        filtered = filtered.filter(t => t.due === today);
    }
    if (window.quickFilter === "week") {
        const now = new Date();
        const week = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString().slice(0,10);
        filtered = filtered.filter(t => t.due && t.due <= week && t.due >= now.toISOString().slice(0,10));
    }
    if (window.quickFilter === "late") {
        const today = new Date().toISOString().slice(0,10);
        filtered = filtered.filter(t => t.due && t.due < today && !t.completed);
    }
    return filtered;
}

// ---------------------
// Eventos de Formulários
// ---------------------

// Adiciona nova tarefa ao enviar o formulário
document.getElementById('task-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('task-input').value.trim();
    const category = document.getElementById('category-input').value.trim();
    const priority = document.getElementById('priority-input').value;
    const due = document.getElementById('date-input').value;
    if (!title) return showToast("❌ Por favor, digite o nome da tarefa. 😉", "error");

    tasks.push({
        title, category, priority, due,
        completed: false,
        status: "todo",
        subtasks: []
    });
    saveTasks();
    renderTasks();
    updateCategoryFilter();
    e.target.reset();
    showToast("✅ Tarefa adicionada com sucesso! 🚀", "success");
});

// Atualiza lista ao usar filtros
document.getElementById('filters-form')?.addEventListener('input', () => renderTasks());

// Filtros rápidos: hoje, semana, atrasadas
document.getElementById('filter-today')?.addEventListener('click', () => { 
    window.quickFilter = "today"; 
    renderTasks(); 
    showToast("📅 Mostrando tarefas de hoje", "info");
});
document.getElementById('filter-week')?.addEventListener('click', () => { 
    window.quickFilter = "week"; 
    renderTasks(); 
    showToast("📅 Mostrando tarefas desta semana", "info");
});
document.getElementById('filter-late')?.addEventListener('click', () => { 
    window.quickFilter = "late"; 
    renderTasks(); 
    showToast("⚠️ Mostrando tarefas atrasadas", "warning");
});

// Limpar filtros
document.getElementById('clear-filters')?.addEventListener('click', () => {
    window.quickFilter = null;
    document.getElementById('search-input').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-priority').value = '';
    renderTasks();
    showToast("🔄 Filtros limpos", "info");
});

// ---------------------
// Ações nas tarefas
// ---------------------

// Lida com cliques nos botões das tarefas (modo lista e kanban)
document.getElementById('task-list').addEventListener('click', function(e) {
    const li = e.target.closest('li[data-idx], .kanban-task[data-idx]');
    if (!li) return;
    const idx = +li.dataset.idx;

    // Concluir tarefa
    if (e.target.closest('.complete-btn')) {
        tasks[idx].completed = !tasks[idx].completed;
        tasks[idx].status = tasks[idx].completed ? "done" : "todo";
        saveTasks();
        renderTasks();
        showToast(tasks[idx].completed ? "✅ Incrível! Você concluiu uma tarefa." : "✅ Tarefa marcada como pendente. Continue avançando!", "success");
    }

    // Excluir tarefa
    if (e.target.closest('.delete-btn')) {
        closeAllModals();
        window.taskToDeleteIdx = idx;
        const modal = new bootstrap.Modal(document.getElementById('modal-confirm-delete'));
        modal.show();
    }

    // Editar tarefa
    if (e.target.closest('.edit-btn')) {
        editTask(idx);
    }

    // Mover para Em andamento
    if (e.target.closest('.in-progress-btn')) {
        tasks[idx].status = "doing";
        tasks[idx].completed = false;
        saveTasks();
        renderTasks();
        showToast("🔄 Tarefa movida para Em andamento!", "info");
    }

    // Mover para A Fazer
    if (e.target.closest('.to-todo-btn')) {
        tasks[idx].status = "todo";
        tasks[idx].completed = false;
        saveTasks();
        renderTasks();
        showToast("📝 Tarefa movida para A Fazer!", "info");
    }

    // Marcar/desmarcar subtarefa
    if (e.target.type === 'checkbox' && e.target.dataset.subidx !== undefined) {
        const subIdx = +e.target.dataset.subidx;
        tasks[idx].subtasks[subIdx].done = e.target.checked;
        saveTasks();
        showToast(e.target.checked ? "✅ Subtarefa concluída!" : "📝 Subtarefa desmarcada!", "success");
    }
});

// ---------------------
// Edição de tarefas
// ---------------------

// Abre modal para editar tarefa
function editTask(idx) {
    const task = tasks[idx];
    window.editingTaskIdx = idx;
    
    document.getElementById('edit-task-title').value = task.title;
    document.getElementById('edit-task-category').value = task.category || '';
    document.getElementById('edit-task-priority').value = task.priority;
    document.getElementById('edit-task-date').value = task.due || '';
    
    const modal = new bootstrap.Modal(document.getElementById('modal-edit-task'));
    modal.show();
}

// Salva edições da tarefa
document.getElementById('edit-task-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const idx = window.editingTaskIdx;
    if (typeof idx !== 'number') return;
    
    const title = document.getElementById('edit-task-title').value.trim();
    const category = document.getElementById('edit-task-category').value.trim();
    const priority = document.getElementById('edit-task-priority').value;
    const due = document.getElementById('edit-task-date').value;
    
    if (!title) return showToast("❌ Por favor, digite o nome da tarefa.", "error");
    
    tasks[idx].title = title;
    tasks[idx].category = category;
    tasks[idx].priority = priority;
    tasks[idx].due = due;
    
    saveTasks();
    renderTasks();
    updateCategoryFilter();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('modal-edit-task'));
    modal.hide();
    
    showToast("✅ Tarefa editada com sucesso!", "success");
});

// ---------------------
// Exportar/Importar
// ---------------------

// Exporta tarefas para JSON
function exportTasks() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tarefas_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("📥 Tarefas exportadas com sucesso!", "success");
}

// Importa tarefas de arquivo JSON
function importTasks(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedTasks = JSON.parse(e.target.result);
            if (Array.isArray(importedTasks)) {
                tasks = importedTasks;
                saveTasks();
                renderTasks();
                updateCategoryFilter();
                showToast("📤 Tarefas importadas com sucesso!", "success");
            } else {
                showToast("❌ Arquivo inválido. Deve conter um array de tarefas.", "error");
            }
        } catch (error) {
            showToast("❌ Erro ao ler o arquivo. Verifique se é um JSON válido.", "error");
        }
    };
    reader.readAsText(file);
    
    // Limpa o input para permitir reimportar o mesmo arquivo
    event.target.value = '';
}

// Event listeners para exportar/importar
document.getElementById('export-btn')?.addEventListener('click', exportTasks);
document.getElementById('import-btn')?.addEventListener('click', () => {
    document.getElementById('import-file').click();
});
document.getElementById('import-file')?.addEventListener('change', importTasks);

// ---------------------
// Visualização (Lista/Kanban)
// ---------------------

// Alterna entre visualização lista e kanban
function toggleView() {
    currentView = currentView === 'list' ? 'kanban' : 'list';
    localStorage.setItem('currentView', currentView);
    renderTasks();
    
    const btn = document.getElementById('toggle-view-btn');
    if (btn) {
        btn.innerHTML = currentView === 'list' ? 
            '<i class="bi bi-kanban"></i> Kanban' : 
            '<i class="bi bi-list-ul"></i> Lista';
    }
    
    showToast(`📋 Visualização alterada para ${currentView === 'list' ? 'Lista' : 'Kanban'}`, "info");
}

document.getElementById('toggle-view-btn')?.addEventListener('click', toggleView);

// ---------------------
// Temas
// ---------------------

// Aplica o tema escolhido e salva no localStorage
function applyTheme(theme) {
    document.body.classList.remove('dark', 'theme-green', 'theme-red', 'theme-blue');
    if (theme === "dark") {
        document.body.classList.add('dark');
    } else if (theme === "green") {
        document.body.classList.add('theme-green');
    } else if (theme === "red") {
        document.body.classList.add('theme-red');
    } else if (theme === "blue") {
        document.body.classList.add('theme-blue');
    }
    // Se for padrão, não adiciona nenhuma classe!
    localStorage.setItem('theme', theme);
    currentTheme = theme;
    showToast(`🎨 Tema alterado para ${theme === 'default' ? 'Padrão' : capitalize(theme)}`, "info");
}

// Aplica o tema ao iniciar
applyTheme(currentTheme);

// Troca de tema ao clicar nos botões de tema
document.querySelectorAll('[data-theme]').forEach(el => {
    el.addEventListener('click', e => {
        e.preventDefault();
        const theme = el.getAttribute('data-theme');
        applyTheme(theme);
    });
});

// ---------------------
// Utilitários adicionais
// ---------------------

// Atualiza o filtro de categorias com as categorias existentes
function updateCategoryFilter() {
    const catSet = new Set(tasks.map(t => t.category).filter(Boolean));
    const catSel = document.getElementById('filter-category');
    if (catSel) {
        const currentValue = catSel.value;
        catSel.innerHTML = `<option value="">Todas categorias</option>`;
        catSet.forEach(cat => {
            catSel.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
        catSel.value = currentValue;
    }
}

// Habilita tooltips do Bootstrap
function enableTooltips() {
    if (window.bootstrap) {
        document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
            new bootstrap.Tooltip(el, {
                container: 'body',
                boundary: 'window',
                placement: window.innerWidth < 700 ? 'bottom' : 'top'
            });
        });
    }
}

// ---------------------
// Inicialização
// ---------------------

// Ao carregar a página, preenche filtros e renderiza tarefas
document.addEventListener('DOMContentLoaded', () => {
    updateCategoryFilter();
    renderTasks();
    enableTooltips();
    
    // Configura o botão de visualização
    const btn = document.getElementById('toggle-view-btn');
    if (btn) {
        btn.innerHTML = currentView === 'list' ? 
            '<i class="bi bi-kanban"></i> Kanban' : 
            '<i class="bi bi-list-ul"></i> Lista';
    }
});

// Fecha todos os modais abertos
function closeAllModals() {
    document.querySelectorAll('.modal.show').forEach(modalEl => {
        bootstrap.Modal.getInstance(modalEl)?.hide();
    });
}

// Confirma exclusão de tarefa (usado no modal)
function confirmDeleteTask() {
    const idx = window.taskToDeleteIdx;
    if (typeof idx === "number") {
        tasks.splice(idx, 1);
        saveTasks();
        renderTasks();
        updateCategoryFilter();
        showToast("✅ Tarefa removida. Menos uma para se preocupar!", "success");
        // Fecha o modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modal-confirm-delete'));
        if (modal) modal.hide();
    }
}
window.confirmDeleteTask = confirmDeleteTask;

