const UI = (() => {

  function buildTaskCard(task) {
    const overdue   = Tasks.isOverdue(task);
    const todayTask = Tasks.isToday(task);
    const dateLabel = Tasks.formatDate(task.dueDate);

    const card = document.createElement('div');
    card.className = `task-card priority-${task.priority} ${task.completed ? 'completed-task' : ''}`;
    card.dataset.id = task.id;
    card.setAttribute('draggable', 'true');

    card.innerHTML = `
      <div class="task-card-header">
        <div class="task-checkbox ${task.completed ? 'checked' : ''}"
             data-action="toggle" data-id="${task.id}">
          ${task.completed ? '<i class="fa-solid fa-check" style="font-size:11px;"></i>' : ''}
        </div>
        <div class="task-title">${escHtml(task.title)}</div>
        <i class="fa-solid fa-star task-important-star ${task.important ? 'starred' : 'not-starred'}"
           data-action="important" data-id="${task.id}"></i>
      </div>
      ${task.description ? `<p class="task-description">${escHtml(task.description)}</p>` : ''}
      <div class="task-meta">
        <span class="task-badge badge-${task.priority}">
          <i class="fa-solid ${Tasks.getPriorityIcon(task.priority)}"></i>
          ${capitalize(task.priority)}
        </span>
        <span class="task-badge badge-${task.category}">
          <i class="fa-solid ${Tasks.getCategoryIcon(task.category)}"></i>
          ${capitalize(task.category)}
        </span>
        ${task.dueDate ? `
          <span class="task-date ${overdue ? 'overdue' : todayTask ? 'today' : ''}">
            <i class="fa-regular fa-calendar"></i>
            ${dateLabel}
            ${task.dueTime ? `<span style="margin-left:2px;">· ${task.dueTime}</span>` : ''}
          </span>` : ''}
      </div>
      <div class="task-footer">
        <span class="task-badge" style="background:${getStatusBg(task.status)};color:${getStatusColor(task.status)};">
          <i class="fa-solid ${getStatusIcon(task.status)}"></i>
          ${getStatusLabel(task.status)}
        </span>
        <div class="task-actions">
          <button class="task-action-btn" data-action="edit" data-id="${task.id}"
                  title="Edit task"><i class="fa-regular fa-pen-to-square"></i></button>
          <button class="task-action-btn delete" data-action="delete" data-id="${task.id}"
                  title="Delete task"><i class="fa-regular fa-trash-can"></i></button>
        </div>
      </div>
    `;

    return card;
  }

  function buildTaskListItem(task) {
    const overdue   = Tasks.isOverdue(task);
    const dateLabel = Tasks.formatDate(task.dueDate);

    const item = document.createElement('div');
    item.className = `task-list-item priority-${task.priority}`;
    item.dataset.id = task.id;
    item.setAttribute('draggable', 'true');

    item.innerHTML = `
      <div class="task-checkbox ${task.completed ? 'checked' : ''}"
           data-action="toggle" data-id="${task.id}">
        ${task.completed ? '<i class="fa-solid fa-check" style="font-size:11px;"></i>' : ''}
      </div>
      <div class="task-list-info">
        <div class="task-list-title ${task.completed ? 'done' : ''}">${escHtml(task.title)}</div>
        <div class="task-list-sub">
          <i class="fa-solid ${Tasks.getCategoryIcon(task.category)}" style="margin-right:4px;color:var(--accent-primary);font-size:11px;"></i>
          ${capitalize(task.category)}
          ${task.dueDate ? ` · <span class="${overdue ? 'overdue' : ''}" style="${overdue ? 'color:var(--priority-high);font-weight:600;' : ''}">${dateLabel}</span>` : ''}
        </div>
      </div>
      <div class="task-list-meta">
        ${task.important ? '<i class="fa-solid fa-star" style="color:#f59e0b;font-size:13px;"></i>' : ''}
        <span class="task-badge badge-${task.priority}">
          <i class="fa-solid ${Tasks.getPriorityIcon(task.priority)}"></i>
          ${capitalize(task.priority)}
        </span>
        <button class="task-action-btn" data-action="edit"   data-id="${task.id}" title="Edit"><i class="fa-regular fa-pen-to-square"></i></button>
        <button class="task-action-btn delete" data-action="delete" data-id="${task.id}" title="Delete"><i class="fa-regular fa-trash-can"></i></button>
      </div>
    `;

    return item;
  }

  function buildKanbanCard(task) {
    const card = document.createElement('div');
    card.className = `kanban-card priority-${task.priority}`;
    card.dataset.id = task.id;
    card.setAttribute('draggable', 'true');

    card.innerHTML = `
      <div class="kanban-card-title">${escHtml(task.title)}</div>
      <div class="kanban-card-meta">
        <span class="task-badge badge-${task.priority}">
          <i class="fa-solid ${Tasks.getPriorityIcon(task.priority)}"></i>
          ${capitalize(task.priority)}
        </span>
        <span class="task-badge badge-${task.category}">
          <i class="fa-solid ${Tasks.getCategoryIcon(task.category)}"></i>
          ${capitalize(task.category)}
        </span>
      </div>
      ${task.dueDate ? `<div class="task-date" style="margin-top:8px;font-size:0.72rem;">
        <i class="fa-regular fa-calendar" style="margin-right:4px;"></i>${Tasks.formatDate(task.dueDate)}
      </div>` : ''}
    `;

    return card;
  }

  function renderTasks(container, tasks, viewMode = 'grid') {
    container.innerHTML = '';

    if (!tasks || tasks.length === 0) {
      container.appendChild(buildEmptyState());
      return;
    }

    container.className = viewMode === 'list' ? 'tasks-list' : 'tasks-grid';

    tasks.forEach(task => {
      const el = viewMode === 'list' ? buildTaskListItem(task) : buildTaskCard(task);
      container.appendChild(el);
    });
  }

  function buildEmptyState(message = 'No tasks found', sub = 'Add a new task to get started!') {
    const div = document.createElement('div');
    div.className = 'empty-state';
    div.innerHTML = `
      <i class="fa-regular fa-clipboard"></i>
      <h3>${message}</h3>
      <p>${sub}</p>
    `;
    return div;
  }

  function updateStats(stats) {
    setEl('#stat-total',      stats.total);
    setEl('#stat-completed',  stats.done);
    setEl('#stat-inprogress', stats.inProgress);
    setEl('#stat-overdue',    stats.overdue);

    const fill = document.getElementById('progress-fill');
    const pctEl = document.getElementById('progress-pct');
    if (fill)   fill.style.width = stats.pct + '%';
    if (pctEl)  pctEl.textContent = stats.pct + '%';

    updateNavBadges(stats);
  }

  function updateNavBadges(stats) {
    setEl('[data-badge="overdue"]',  stats.overdue   || '');
    setEl('[data-badge="today"]',    stats.todayTasks || '');
    setEl('[data-badge="important"]',stats.important  || '');
    setEl('[data-badge="completed"]',stats.done       || '');
  }

  function renderRecentTasks(container, tasks) {
    container.innerHTML = '';
    const recent = tasks.slice(0, 6);
    if (!recent.length) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-muted);font-size:0.82rem;padding:20px 0;">No tasks yet</p>';
      return;
    }
    recent.forEach(task => {
      const item = document.createElement('div');
      item.className = 'recent-task-item';
      item.innerHTML = `
        <div class="recent-task-dot" style="background:${getPriorityColor(task.priority)};"></div>
        <div class="recent-task-info">
          <div class="recent-task-title ${task.completed ? 'done' : ''}">${escHtml(task.title)}</div>
          <div class="recent-task-date">
            ${capitalize(task.category)}
            ${task.dueDate ? ` · ${Tasks.formatDate(task.dueDate)}` : ''}
          </div>
        </div>
        <div class="task-checkbox ${task.completed ? 'checked' : ''}"
             style="width:18px;height:18px;"
             data-action="toggle" data-id="${task.id}">
          ${task.completed ? '<i class="fa-solid fa-check" style="font-size:9px;"></i>' : ''}
        </div>
      `;
      container.appendChild(item);
    });
  }

  function renderCategoryChart(container, catData) {
    const fragment = document.createDocumentFragment();
    const max = Math.max(...catData.map(c => c.total), 1);
    const colors = {
      work: 'var(--cat-work)', study: 'var(--cat-study)',
      personal: 'var(--cat-personal)', health: 'var(--cat-health)',
    };
    const icons = {
      work: 'fa-briefcase', study: 'fa-graduation-cap',
      personal: 'fa-user', health: 'fa-heart-pulse',
    };

    catData.forEach(cat => {
      const pct = max > 0 ? (cat.total / max) * 100 : 0;
      const row = document.createElement('div');
      row.className = 'category-bar-row';
      row.innerHTML = `
        <div class="category-bar-label">
          <i class="fa-solid ${icons[cat.name]}" style="color:${colors[cat.name]};margin-right:5px;font-size:11px;"></i>
          ${capitalize(cat.name)}
        </div>
        <div class="category-bar-track">
          <div class="category-bar-fill" style="width:${pct}%;background:${colors[cat.name]};"></div>
        </div>
        <div class="category-bar-count">${cat.total}</div>
      `;
      fragment.appendChild(row);
    });
    container.replaceChildren(fragment);
  }

  function renderWeeklyChart(container, weekData) {
    const fragment = document.createDocumentFragment();
    const maxVal = Math.max(...weekData.map(d => d.total), 1);

    weekData.forEach(day => {
      const heightPct = maxVal > 0 ? (day.total / maxVal) * 85 : 4;
      const col = document.createElement('div');
      col.className = 'week-bar-col';
      col.innerHTML = `
        <div class="week-bar-value" style="font-size:0.65rem;">${day.total}</div>
        <div class="week-bar" style="height:${Math.max(heightPct, 4)}%" title="${day.label}: ${day.total} tasks"></div>
        <div class="week-bar-label">${day.label}</div>
      `;
      fragment.appendChild(col);
    });
    container.replaceChildren(fragment);
  }

  function renderCalendar(container, year, month, taskMap) {
    container.innerHTML = '';

    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysInPrev  = new Date(year, month - 1, 0).getDate();
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const priorityColors = { high: 'var(--priority-high)', medium: 'var(--priority-medium)', low: 'var(--priority-low)' };

    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
      const h = document.createElement('div');
      h.className = 'calendar-day-header';
      h.textContent = d;
      container.appendChild(h);
    });

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = document.createElement('div');
      day.className = 'calendar-day other-month';
      day.innerHTML = `<div class="day-number">${daysInPrev - i}</div>`;
      container.appendChild(day);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday = dateStr === todayStr;
      const dayTasks = taskMap[d] || [];

      const day = document.createElement('div');
      day.className = `calendar-day ${isToday ? 'today' : ''}`;
      day.dataset.date = dateStr;

      const dotsHtml = dayTasks.slice(0, 3).map(t => `
        <div class="day-task-dot"
             style="background:${priorityColors[t.priority] || 'var(--accent-primary)'}20;
                    color:${priorityColors[t.priority] || 'var(--accent-primary)'};">
          ${escHtml(t.title)}
        </div>
      `).join('');

      const more = dayTasks.length > 3 ? `<div style="font-size:0.6rem;color:var(--text-muted);margin-top:1px;">+${dayTasks.length - 3} more</div>` : '';

      day.innerHTML = `<div class="day-number">${d}</div>${dotsHtml}${more}`;
      container.appendChild(day);
    }

    const totalCells = firstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let d = 1; d <= remaining; d++) {
      const day = document.createElement('div');
      day.className = 'calendar-day other-month';
      day.innerHTML = `<div class="day-number">${d}</div>`;
      container.appendChild(day);
    }
  }

  function renderKanban(groups) {
    const cols = {
      todo:       document.getElementById('kanban-todo'),
      inprogress: document.getElementById('kanban-inprogress'),
      completed:  document.getElementById('kanban-completed'),
    };
    const counts = {
      todo:       document.getElementById('kanban-count-todo'),
      inprogress: document.getElementById('kanban-count-inprogress'),
      completed:  document.getElementById('kanban-count-done'),
    };

    Object.entries(groups).forEach(([key, tasks]) => {
      const col   = cols[key];
      const count = counts[key];
      if (!col) return;
      col.innerHTML = '';
      if (count) count.textContent = tasks.length;

      if (!tasks.length) {
        col.innerHTML = '<div style="text-align:center;padding:24px 10px;color:var(--text-muted);font-size:0.8rem;"><i class="fa-regular fa-circle-check" style="font-size:1.5rem;display:block;margin-bottom:8px;"></i>Empty</div>';
      } else {
        tasks.forEach(t => col.appendChild(buildKanbanCard(t)));
      }
    });
  }

  function updateClock() {
    const now = new Date();
    const el = document.getElementById('live-clock');
    if (el) {
      el.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }

  function updateDateDisplay() {
    const now = new Date();
    const el = document.getElementById('current-date');
    if (el) {
      el.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }
  }

  function showToast(title, message = '', type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
      success: 'fa-circle-check',
      error:   'fa-circle-xmark',
      warning: 'fa-triangle-exclamation',
      info:    'fa-circle-info',
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="fa-solid ${icons[type] || icons.info} toast-icon"></i>
      <div class="toast-content">
        <div class="toast-title">${escHtml(title)}</div>
        ${message ? `<div class="toast-message">${escHtml(message)}</div>` : ''}
      </div>
      <button class="toast-close" onclick="UI.removeToast(this.parentElement)">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    container.appendChild(toast);

    const timer = setTimeout(() => removeToast(toast), duration);
    toast.dataset.timer = timer;
  }

  function removeToast(toast) {
    if (!toast || !toast.parentElement) return;
    clearTimeout(toast.dataset.timer);
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }

  function openModal(modalId) {
    const overlay = document.getElementById(modalId);
    if (overlay) {
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal(modalId) {
    const overlay = document.getElementById(modalId);
    if (overlay) {
      overlay.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.innerHTML = theme === 'dark'
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
      btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
  }

  function setSidebarCollapsed(collapsed) {
    const sidebar = document.getElementById('sidebar');
    const wrapper = document.getElementById('main-wrapper');
    if (!sidebar || !wrapper) return;

    if (collapsed) {
      sidebar.classList.add('collapsed');
      wrapper.classList.add('sidebar-collapsed');
    } else {
      sidebar.classList.remove('collapsed');
      wrapper.classList.remove('sidebar-collapsed');
    }

    const toggle = document.getElementById('sidebar-toggle');
    if (toggle) {
      toggle.innerHTML = collapsed
        ? '<i class="fa-solid fa-chevron-right"></i>'
        : '<i class="fa-solid fa-chevron-left"></i>';
    }
  }

  function setActiveNav(view) {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === view);
    });
  }

  function setActivePage(view) {
    document.querySelectorAll('.view-page').forEach(el => {
      el.classList.toggle('active', el.id === `page-${view}`);
    });
  }

  function updatePageTitle(view) {
    const titles = {
      dashboard: 'Dashboard',
      all:       'All Tasks',
      today:     "Today's Tasks",
      upcoming:  'Upcoming Tasks',
      overdue:   'Overdue Tasks',
      completed: 'Completed Tasks',
      important: 'Important Tasks',
      calendar:  'Calendar View',
      kanban:    'Kanban Board',
      analytics: 'Productivity Analytics',
    };
    const el = document.getElementById('page-title-text');
    if (el) el.textContent = titles[view] || 'TaskFlow';
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function setEl(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  function getPriorityColor(priority) {
    const c = { high: 'var(--priority-high)', medium: 'var(--priority-medium)', low: 'var(--priority-low)' };
    return c[priority] || c.medium;
  }

  function getStatusBg(status) {
    const m = {
      todo:      'var(--bg-tertiary)',
      inprogress:'var(--status-inprogress-bg)',
      completed: 'var(--status-completed-bg)',
    };
    return m[status] || m.todo;
  }

  function getStatusColor(status) {
    const m = {
      todo:      'var(--text-muted)',
      inprogress:'var(--status-inprogress)',
      completed: 'var(--status-completed)',
    };
    return m[status] || m.todo;
  }

  function getStatusIcon(status) {
    const m = {
      todo:      'fa-circle-dot',
      inprogress:'fa-circle-half-stroke',
      completed: 'fa-circle-check',
    };
    return m[status] || m.todo;
  }

  function getStatusLabel(status) {
    const m = { todo: 'To Do', inprogress: 'In Progress', completed: 'Completed' };
    return m[status] || 'To Do';
  }

  return {
    buildTaskCard,
    buildTaskListItem,
    buildKanbanCard,
    renderTasks,
    renderRecentTasks,
    renderCategoryChart,
    renderWeeklyChart,
    renderCalendar,
    renderKanban,
    updateStats,
    updateNavBadges,
    updateClock,
    updateDateDisplay,
    showToast,
    removeToast,
    openModal,
    closeModal,
    applyTheme,
    setSidebarCollapsed,
    setActiveNav,
    setActivePage,
    updatePageTitle,
    escHtml,
    capitalize,
    getPriorityColor,
    getStatusLabel,
  };
})();
