const PWA = {
  registration: null,
  updateAvailable: false,

  async register() {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration =
        await navigator.serviceWorker.register(
          './service-worker.js',
          {
            scope: './'
          }
        );

      this.registration = registration;

      this.watchForUpdates(
        registration
      );

      this.watchControllerChanges();

      this.listenForMessages();

      console.log(
        '[PWA] Service Worker registered:',
        registration.scope
      );
    } catch (error) {
      console.error(
        '[PWA] Registration failed:',
        error
      );
    }
  },

  watchForUpdates(registration) {
    registration.addEventListener(
      'updatefound',
      () => {
        const newWorker =
          registration.installing;

        if (!newWorker) {
          return;
        }

        newWorker.addEventListener(
          'statechange',
          () => {
            if (
              newWorker.state ===
                'installed' &&
              navigator.serviceWorker.controller
            ) {
              this.updateAvailable = true;

              this.showUpdateNotification();
            }
          }
        );
      }
    );
  },

  watchControllerChanges() {
    let refreshing = false;

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        if (refreshing) {
          return;
        }

        refreshing = true;

        window.location.reload();
      }
    );
  },

  listenForMessages() {
    navigator.serviceWorker.addEventListener(
      'message',
      event => {
        if (!event.data) {
          return;
        }

        if (
          event.data.type ===
          'SW_ACTIVATED'
        ) {
          console.log(
            '[PWA] Activated:',
            event.data.version
          );
        }
      }
    );
  },

  async applyUpdate() {
    if (!this.registration) {
      return;
    }

    const worker =
      this.registration.waiting;

    if (!worker) {
      return;
    }

    worker.postMessage({
      type: 'SKIP_WAITING'
    });
  },

  showUpdateNotification() {
    const existing =
      document.getElementById(
        'pwa-update-notice'
      );

    if (existing) {
      return;
    }

    const notice =
      document.createElement('div');

    notice.id =
      'pwa-update-notice';

    notice.innerHTML = `
      <div class="pwa-update-content">
        <div>
          <strong>
            New version available
          </strong>

          <span>
            Update TaskFlow to get
            the latest version.
          </span>
        </div>

        <button
          type="button"
          id="pwa-update-button"
        >
          Update
        </button>
      </div>
    `;

    Object.assign(
      notice.style,
      {
        position: 'fixed',
        left: '16px',
        right: '16px',
        bottom: '16px',
        zIndex: '99999',
        padding: '14px 16px',
        borderRadius: '14px',
        background: 'var(--surface, #ffffff)',
        color: 'var(--text, #111827)',
        boxShadow:
          '0 12px 40px rgba(0,0,0,.18)',
        border:
          '1px solid rgba(0,0,0,.08)'
      }
    );

    const content =
      notice.querySelector(
        '.pwa-update-content'
      );

    Object.assign(
      content.style,
      {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }
    );

    const text =
      notice.querySelector(
        '.pwa-update-content > div'
      );

    Object.assign(
      text.style,
      {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }
    );

    const button =
      notice.querySelector(
        '#pwa-update-button'
      );

    Object.assign(
      button.style,
      {
        border: '0',
        borderRadius: '10px',
        padding: '9px 14px',
        cursor: 'pointer',
        fontWeight: '700'
      }
    );

    button.addEventListener(
      'click',
      async () => {
        button.disabled = true;
        button.textContent =
          'Updating...';

        await this.applyUpdate();
      }
    );

    document.body.appendChild(
      notice
    );
  }
};

window.addEventListener(
  'load',
  () => {
    PWA.register();
  }
);
const App = (() => {
  const state = {
    currentView:  'dashboard',
    viewMode:     'grid',       // 'grid' | 'list'
    sortBy:       'createdAt',
    searchQuery:  '',
    filterCategory: '',
    filterPriority: '',
    calendarYear:  new Date().getFullYear(),
    calendarMonth: new Date().getMonth() + 1,
    editingTaskId: null,
    sidebarCollapsed: false,
    draggedTaskId: null,
    draggedEl: null,
  };

  function init() {
    syncPhoneLayout();
    window.addEventListener('resize', syncPhoneLayout, { passive: true });
    window.addEventListener('orientationchange', syncPhoneLayout, { passive: true });

    Storage.seedDemoData();

    const theme = Storage.getTheme();
    UI.applyTheme(theme);

    const settings = Storage.getSettings();
    state.sidebarCollapsed = settings.sidebarCollapsed || false;
    state.viewMode = settings.defaultView || 'grid';
    UI.setSidebarCollapsed(state.sidebarCollapsed);

    UI.updateDateDisplay();
    UI.updateClock();
    setInterval(UI.updateClock, 1000);

    bindEvents();

    navigateTo('dashboard');
  }

  function syncPhoneLayout() {
    const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches;
    const touchPoints = navigator.maxTouchPoints || 0;
    const shortestScreenSide = Math.min(window.screen.width || 9999, window.screen.height || 9999);
    const ua = navigator.userAgent || '';
    const uaMobile = /Android|iPhone|iPod|IEMobile|Opera Mini|Mobile/i.test(ua);

    const isRealPhone = uaMobile || ((coarsePointer || touchPoints > 0) && shortestScreenSide <= 900);
    document.body.classList.toggle('force-mobile-layout', isRealPhone);

    if (!isRealPhone) closeMobileSidebar();
  }

  function navigateTo(view) {
    if (document.body.classList.contains('force-mobile-layout') && view === 'kanban') {
      view = 'dashboard';
    }

    state.currentView = view;
    state.searchQuery = '';
    state.filterCategory = '';
    state.filterPriority = '';

    UI.setActiveNav(view);
    UI.setActivePage(view);
    UI.updatePageTitle(view);

    const searchEl = document.getElementById('global-search');
    if (searchEl) searchEl.value = '';

    renderCurrentView();

    closeMobileSidebar();
  }

  function renderCurrentView() {
    const view = state.currentView;

    if (view === 'dashboard') {
      renderDashboard();
    } else if (view === 'calendar') {
      renderCalendarView();
    } else if (view === 'kanban') {
      renderKanbanView();
    } else if (view === 'analytics') {
      renderAnalytics();
    } else {
      renderTasksView();
    }
  }

  function renderDashboard() {
    const stats = Tasks.getStats();
    UI.updateStats(stats);

    const allTasks = Tasks.getAll();
    const recentContainer = document.getElementById('recent-tasks-list');
    if (recentContainer) UI.renderRecentTasks(recentContainer, allTasks);

    const overdueContainer = document.getElementById('overdue-preview-list');
    if (overdueContainer) {
      const overdue = Tasks.getByView('overdue').slice(0, 4);
      if (overdue.length) {
        UI.renderTasks(overdueContainer, overdue, 'list');
      } else {
        overdueContainer.innerHTML = '<div class="empty-state" style="padding:30px 20px;"><i class="fa-solid fa-circle-check" style="font-size:1.8rem;color:var(--status-completed);margin-bottom:8px;"></i><h3>No overdue tasks!</h3></div>';
      }
    }
  }

  function renderTasksView() {
    const activePage = document.getElementById('page-' + state.currentView);
    if (!activePage) return;

    const container = activePage.querySelector('#tasks-container');
    if (!container) return;

    let tasks = Tasks.getByView(state.currentView);
    tasks = Tasks.filterAndSearch(tasks, {
      search:   state.searchQuery,
      category: state.filterCategory,
      priority: state.filterPriority,
    });
    tasks = Tasks.sortTasks(tasks, state.sortBy);

    UI.renderTasks(container, tasks, state.viewMode);

    const countEl = activePage.querySelector('#tasks-count');
    if (countEl) countEl.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;

    bindDragEvents();
  }

  function renderCalendarView() {
    const { calendarYear: year, calendarMonth: month } = state;
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    const titleEl = document.getElementById('calendar-month-title');
    if (titleEl) titleEl.textContent = `${monthNames[month - 1]} ${year}`;

    const grid = document.getElementById('calendar-grid');
    if (!grid) return;

    const taskMap = Tasks.getTasksByDate(year, month);
    UI.renderCalendar(grid, year, month, taskMap);

    grid.querySelectorAll('.calendar-day:not(.other-month)').forEach(day => {
      day.addEventListener('click', () => {
        const date = day.dataset.date;
        if (date) openAddModal(date);
      });
    });
  }

  function renderKanbanView() {
    const groups = Tasks.getKanbanGroups();
    UI.renderKanban(groups);
    bindKanbanDrag();
  }

  function renderAnalytics() {
    const analytics = Tasks.getAnalyticsData();
    const { stats, categories, weekly } = analytics;

    document.querySelectorAll('[data-analytics]').forEach(el => {
      const key = el.dataset.analytics;
      if (stats[key] !== undefined) el.textContent = stats[key];
    });

    const catContainer = document.getElementById('analytics-category-chart');
    if (catContainer) UI.renderCategoryChart(catContainer, categories);

    const weekContainer = document.getElementById('analytics-weekly-chart');
    if (weekContainer) UI.renderWeeklyChart(weekContainer, weekly);

    const pctEl = document.getElementById('analytics-pct');
    if (pctEl) pctEl.textContent = stats.pct + '%';

    const fill = document.getElementById('analytics-progress-fill');
    const label = document.getElementById('analytics-progress-label');
    if (fill) fill.style.width = stats.pct + '%';
    if (label) label.textContent = `of ${stats.total} total`;
  }

  function openAddModal(prefillDate = '') {
    state.editingTaskId = null;
    resetForm();

    document.getElementById('modal-title-text').innerHTML =
      '<i class="fa-solid fa-plus"></i> Add New Task';
    document.getElementById('save-task-btn').textContent = 'Add Task';

    if (prefillDate) {
      const dueDateEl = document.getElementById('task-due-date');
      if (dueDateEl) dueDateEl.value = prefillDate;
    }

    UI.openModal('task-modal');
    document.getElementById('task-title').focus();
  }

  function openEditModal(taskId) {
    const task = Storage.getTaskById(taskId);
    if (!task) return;

    state.editingTaskId = taskId;

    document.getElementById('modal-title-text').innerHTML =
      '<i class="fa-solid fa-pen-to-square"></i> Edit Task';
    document.getElementById('save-task-btn').textContent = 'Update Task';

    setField('task-title',       task.title);
    setField('task-description', task.description || '');
    setField('task-category',    task.category);
    setField('task-priority',    task.priority);
    setField('task-status',      task.status);
    setField('task-due-date',    task.dueDate);
    setField('task-due-time',    task.dueTime || '');

    const importantToggle = document.getElementById('task-important');
    if (importantToggle) importantToggle.checked = task.important;

    UI.openModal('task-modal');
    document.getElementById('task-title').focus();
  }

  function resetForm() {
    ['task-title','task-description','task-due-date','task-due-time'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    setField('task-category', 'personal');
    setField('task-priority',  'medium');
    setField('task-status',    'todo');
    const imp = document.getElementById('task-important');
    if (imp) imp.checked = false;
  }

  function saveTask() {
    const data = {
      title:       getField('task-title'),
      description: getField('task-description'),
      category:    getField('task-category'),
      priority:    getField('task-priority'),
      status:      getField('task-status'),
      dueDate:     getField('task-due-date'),
      dueTime:     getField('task-due-time'),
      important:   document.getElementById('task-important')?.checked || false,
    };

    if (!data.title.trim()) {
      UI.showToast('Title Required', 'Please enter a task title.', 'warning');
      document.getElementById('task-title')?.focus();
      return;
    }

    if (state.editingTaskId) {
      const result = Tasks.updateTask(state.editingTaskId, data);
      if (result.success) {
        UI.showToast('Task Updated', `"${data.title}" has been updated.`, 'success');
      } else {
        UI.showToast('Error', result.error || 'Could not update task.', 'error');
        return;
      }
    } else {
      const result = Tasks.createTask(data);
      if (result.success) {
        UI.showToast('Task Added', `"${data.title}" has been added!`, 'success');
      } else {
        UI.showToast('Error', result.error || 'Could not add task.', 'error');
        return;
      }
    }

    UI.closeModal('task-modal');
    refreshAll();
  }

  function confirmDelete(taskId) {
    const task = Storage.getTaskById(taskId);
    if (!task) return;

    const msgEl = document.getElementById('delete-confirm-msg');
    if (msgEl) msgEl.textContent = `Are you sure you want to delete "${task.title}"?`;

    const confirmBtn = document.getElementById('confirm-delete-btn');
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        Tasks.deleteTask(taskId);
        UI.closeModal('delete-modal');
        UI.showToast('Task Deleted', `"${task.title}" has been deleted.`, 'error');
        refreshAll();
      };
    }

    UI.openModal('delete-modal');
  }

  function handleToggleComplete(taskId) {
    const task = Storage.getTaskById(taskId);
    Tasks.toggleComplete(taskId);
    const updatedTask = Storage.getTaskById(taskId);
    if (updatedTask) {
      const msg = updatedTask.completed ? 'Task marked as completed!' : 'Task marked as in progress.';
      const type = updatedTask.completed ? 'success' : 'info';
      UI.showToast(updatedTask.completed ? 'Completed' : 'Reopened', msg, type);
    }
    refreshAll();
  }

  function handleToggleImportant(taskId) {
    Tasks.toggleImportant(taskId);
    const task = Storage.getTaskById(taskId);
    if (task) {
      UI.showToast(task.important ? 'Starred' : 'Unstarred',
        task.important ? 'Added to important tasks.' : 'Removed from important tasks.', 'info');
    }
    refreshAll();
  }

  function handleSearch(query) {
    state.searchQuery = query;
    if (!['dashboard','calendar','kanban','analytics'].includes(state.currentView)) {
      renderTasksView();
    } else if (query.trim()) {
      navigateTo('all');
      state.searchQuery = query;
      renderTasksView();
    }
  }

  function bindDragEvents() {
    const activePage = document.getElementById('page-' + state.currentView);
    const container = activePage ? activePage.querySelector('#tasks-container') : null;
    if (!container) return;

    container.querySelectorAll('[draggable="true"]').forEach(card => {
      card.addEventListener('dragstart', e => {
        state.draggedTaskId = card.dataset.id;
        state.draggedEl = card;
        setTimeout(() => card.classList.add('dragging'), 0);
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        state.draggedEl = null;
      });
    });
  }

  function bindKanbanDrag() {
    const columns = document.querySelectorAll('.kanban-column');

    document.querySelectorAll('.kanban-card').forEach(card => {
      card.addEventListener('dragstart', e => {
        state.draggedTaskId = card.dataset.id;
        state.draggedEl = card;
        setTimeout(() => card.classList.add('dragging'), 0);
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        state.draggedEl = null;
      });
    });

    columns.forEach(col => {
      col.addEventListener('dragover', e => {
        e.preventDefault();
        col.classList.add('drag-over');
        e.dataTransfer.dropEffect = 'move';
      });

      col.addEventListener('dragleave', e => {
        if (!col.contains(e.relatedTarget)) {
          col.classList.remove('drag-over');
        }
      });

      col.addEventListener('drop', e => {
        e.preventDefault();
        col.classList.remove('drag-over');

        const taskId = state.draggedTaskId;
        if (!taskId) return;

        const newStatus = col.dataset.status;
        if (!newStatus) return;

        Tasks.updateStatus(taskId, newStatus);
        UI.showToast('Task Moved', `Task moved to ${UI.getStatusLabel(newStatus)}.`, 'info');
        renderKanbanView();
        renderDashboard();
      });
    });
  }

  function refreshAll() {
    renderCurrentView();

    const stats = Tasks.getStats();
    UI.updateNavBadges(stats);

    if (state.currentView !== 'dashboard') {
      UI.updateStats(stats);
    }
  }

  function bindEvents() {

    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      UI.setSidebarCollapsed(state.sidebarCollapsed);
      const settings = Storage.getSettings();
      Storage.saveSettings({ ...settings, sidebarCollapsed: state.sidebarCollapsed });
    });

    document.getElementById('mobile-menu-btn')?.addEventListener('click', toggleMobileSidebar);
    document.getElementById('sidebar-overlay')?.addEventListener('click', closeMobileSidebar);

    document.addEventListener('pointerdown', e => {
      const sidebar = document.getElementById('sidebar');
      const menuBtn = document.getElementById('mobile-menu-btn');
      if (!sidebar?.classList.contains('mobile-open')) return;
      if (sidebar.contains(e.target) || menuBtn?.contains(e.target)) return;
      closeMobileSidebar();
    });

    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      item.addEventListener('click', () => {
        navigateTo(item.dataset.view);
        closeMobileSidebar();
      });
    });

    document.getElementById('add-task-btn')?.addEventListener('click', () => openAddModal());

    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
      const current = Storage.getTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      Storage.saveTheme(next);
      UI.applyTheme(next);
      UI.showToast(next === 'dark' ? 'Dark Mode' : 'Light Mode',
        `Switched to ${next} mode.`, 'info');
    });

    document.getElementById('project-info-btn')?.addEventListener('click', () => {
      UI.openModal('project-info-modal');
    });

    document.getElementById('global-search')?.addEventListener('input', e => {
      handleSearch(e.target.value);
    });

    document.getElementById('search-toggle-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      const wrapper = document.querySelector('.search-wrapper');
      const toggleBtn = document.getElementById('search-toggle-btn');
      if (wrapper) {
        const isVisible = wrapper.classList.toggle('mobile-visible');
        toggleBtn?.setAttribute('aria-expanded', String(isVisible));

        if (isVisible) {
          document.getElementById('global-search')?.focus();
        }
      }
    });

    // Close the mobile search when clicking/tapping anywhere outside it.
    document.addEventListener('click', e => {
      const wrapper = document.querySelector('.search-wrapper');
      const toggleBtn = document.getElementById('search-toggle-btn');
      if (!wrapper?.classList.contains('mobile-visible')) return;

      if (!wrapper.contains(e.target) && !toggleBtn?.contains(e.target)) {
        wrapper.classList.remove('mobile-visible');
        toggleBtn?.setAttribute('aria-expanded', 'false');
      }
    });

    // Keep Escape consistent with the outside-click behavior.
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;

      const wrapper = document.querySelector('.search-wrapper');
      const toggleBtn = document.getElementById('search-toggle-btn');
      if (wrapper?.classList.contains('mobile-visible')) {
        wrapper.classList.remove('mobile-visible');
        toggleBtn?.setAttribute('aria-expanded', 'false');
      }
    });

    document.getElementById('main-content')?.addEventListener('change', e => {
      const target = e.target;
      if (target.id === 'sort-select') {
        state.sortBy = target.value;
        renderTasksView();
      } else if (target.id === 'filter-category') {
        state.filterCategory = target.value;
        renderTasksView();
      } else if (target.id === 'filter-priority') {
        state.filterPriority = target.value;
        renderTasksView();
      }
    });

    document.getElementById('main-content')?.addEventListener('click', e => {
      const gridBtn = e.target.closest('#view-grid-btn');
      const listBtn = e.target.closest('#view-list-btn');
      if (gridBtn) {
        state.viewMode = 'grid';
        gridBtn.classList.add('active');
        document.getElementById('view-list-btn')?.classList.remove('active');
        renderTasksView();
        return;
      }
      if (listBtn) {
        state.viewMode = 'list';
        listBtn.classList.add('active');
        document.getElementById('view-grid-btn')?.classList.remove('active');
        renderTasksView();
        return;
      }

      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const id     = btn.dataset.id;
      if (!id) return;

      switch (action) {
        case 'toggle':    handleToggleComplete(id);  break;
        case 'important': handleToggleImportant(id); break;
        case 'edit':      openEditModal(id);          break;
        case 'delete':    confirmDelete(id);           break;
      }
    });

    document.getElementById('save-task-btn')?.addEventListener('click', saveTask);

    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => UI.closeModal(btn.dataset.closeModal));
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) UI.closeModal(overlay.id);
      });
    });

    document.getElementById('cancel-delete-btn')?.addEventListener('click', () => {
      UI.closeModal('delete-modal');
    });

    document.getElementById('cal-prev')?.addEventListener('click', () => {
      state.calendarMonth--;
      if (state.calendarMonth < 1) { state.calendarMonth = 12; state.calendarYear--; }
      renderCalendarView();
    });

    document.getElementById('cal-next')?.addEventListener('click', () => {
      state.calendarMonth++;
      if (state.calendarMonth > 12) { state.calendarMonth = 1; state.calendarYear++; }
      renderCalendarView();
    });

    document.getElementById('cal-today')?.addEventListener('click', () => {
      state.calendarYear  = new Date().getFullYear();
      state.calendarMonth = new Date().getMonth() + 1;
      renderCalendarView();
    });

    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openAddModal();
      }
      if (e.key === 'Escape') {
        UI.closeModal('task-modal');
        UI.closeModal('delete-modal');
        UI.closeModal('project-info-modal');
        closeMobileSidebar();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const s = document.getElementById('global-search');
        if (s) { s.focus(); s.select(); }
      }
    });

    document.getElementById('task-title')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') saveTask();
    });

    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', () => navigateTo(el.dataset.nav));
    });
  }

  function toggleMobileSidebar() {
    const sidebar  = document.getElementById('sidebar');
    const overlay  = document.getElementById('sidebar-overlay');
    const isOpen   = sidebar?.classList.contains('mobile-open');

    if (isOpen) {
      closeMobileSidebar();
    } else {
      sidebar?.classList.add('mobile-open');
      overlay?.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMobileSidebar() {
    document.getElementById('sidebar')?.classList.remove('mobile-open');
    document.getElementById('sidebar-overlay')?.classList.remove('show');
    if (!document.querySelector('.modal-overlay.show')) {
      document.body.style.overflow = '';
    }
  }

  function getField(id) {
    return document.getElementById(id)?.value || '';
  }

  function setField(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  return { init, navigateTo, openAddModal, openEditModal };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();
  const finishLoading = () => {
    window.setTimeout(() => {
      document.body.classList.remove('is-loading');
      document.body.classList.add('app-ready');
    }, 420);
  };
  requestAnimationFrame(finishLoading);
});
