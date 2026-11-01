const Storage = (() => {
  const KEYS = {
    TASKS:    'taskflow_tasks',
    SETTINGS: 'taskflow_settings',
    THEME:    'taskflow_theme',
  };

  function getTasks() {
    try {
      const raw = localStorage.getItem(KEYS.TASKS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Storage.getTasks error:', e);
      return [];
    }
  }

  function saveTasks(tasks) {
    try {
      localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
      return true;
    } catch (e) {
      console.error('Storage.saveTasks error:', e);
      return false;
    }
  }

  function addTask(task) {
    const tasks = getTasks();
    tasks.unshift(task);
    return saveTasks(tasks);
  }

  function updateTask(id, updates) {
    const tasks = getTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return false;
    tasks[idx] = { ...tasks[idx], ...updates, updatedAt: new Date().toISOString() };
    return saveTasks(tasks);
  }

  function deleteTask(id) {
    const tasks = getTasks();
    const filtered = tasks.filter(t => t.id !== id);
    if (filtered.length === tasks.length) return false;
    return saveTasks(filtered);
  }

  function getTaskById(id) {
    return getTasks().find(t => t.id === id) || null;
  }

  function getSettings() {
    try {
      const raw = localStorage.getItem(KEYS.SETTINGS);
      return raw ? JSON.parse(raw) : getDefaultSettings();
    } catch (e) {
      return getDefaultSettings();
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (e) {
      return false;
    }
  }

  function getDefaultSettings() {
    return {
      sidebarCollapsed: false,
      defaultView: 'list',
      defaultCategory: 'all',
    };
  }

  function getTheme() {
    return localStorage.getItem(KEYS.THEME) || 'dark';
  }

  function saveTheme(theme) {
    localStorage.setItem(KEYS.THEME, theme);
  }

  function clearAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  }

  function exportData() {
    return {
      tasks: getTasks(),
      settings: getSettings(),
      exportedAt: new Date().toISOString(),
    };
  }

  function seedDemoData() {
    if (getTasks().length > 0) return;

    const now = new Date();
    const fmt = (d) => d.toISOString().slice(0, 10);
    const today = fmt(now);

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 6);

    const demoTasks = [];

    saveTasks(demoTasks);
  }

  function generateId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  }

  return {
    getTasks,
    saveTasks,
    addTask,
    updateTask,
    deleteTask,
    getTaskById,
    getSettings,
    saveSettings,
    getTheme,
    saveTheme,
    clearAll,
    exportData,
    seedDemoData,
    generateId,
  };
})();
