const Tasks = (() => {
  function createTask(data) {
    const task = {
      id:          Storage.generateId(),
      title:       (data.title || '').trim(),
      description: (data.description || '').trim(),
      category:    data.category    || 'personal',
      priority:    data.priority    || 'medium',
      status:      data.status      || 'todo',
      dueDate:     data.dueDate     || '',
      dueTime:     data.dueTime     || '',
      important:   data.important   === true,
      completed:   false,
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    };

    if (!task.title) return { success: false, error: 'Title is required' };

    const ok = Storage.addTask(task);
    return ok ? { success: true, task } : { success: false, error: 'Storage error' };
  }

  function updateTask(id, data) {
    const updates = {
      title:       (data.title || '').trim(),
      description: (data.description || '').trim(),
      category:    data.category    || 'personal',
      priority:    data.priority    || 'medium',
      status:      data.status      || 'todo',
      dueDate:     data.dueDate     || '',
      dueTime:     data.dueTime     || '',
      important:   data.important   === true,
    };

    if (!updates.title) return { success: false, error: 'Title is required' };

    const ok = Storage.updateTask(id, updates);
    return ok ? { success: true } : { success: false, error: 'Task not found' };
  }

  function deleteTask(id) {
    return Storage.deleteTask(id);
  }

  function toggleComplete(id) {
    const task = Storage.getTaskById(id);
    if (!task) return false;
    const newCompleted = !task.completed;
    return Storage.updateTask(id, {
      completed: newCompleted,
      status:    newCompleted ? 'completed' : 'todo',
    });
  }

  function toggleImportant(id) {
    const task = Storage.getTaskById(id);
    if (!task) return false;
    return Storage.updateTask(id, { important: !task.important });
  }

  function updateStatus(id, status) {
    const task = Storage.getTaskById(id);
    if (!task) return false;
    const completed = status === 'completed';
    return Storage.updateTask(id, { status, completed });
  }

  function getAll() {
    return Storage.getTasks();
  }

  function getByView(view) {
    const all = getAll();
    const today = getTodayStr();

    switch (view) {
      case 'today':
        return all.filter(t => t.dueDate === today);

      case 'upcoming':
        return all.filter(t => t.dueDate && t.dueDate > today && !t.completed);

      case 'overdue':
        return all.filter(t => t.dueDate && t.dueDate < today && !t.completed);

      case 'completed':
        return all.filter(t => t.completed);

      case 'important':
        return all.filter(t => t.important);

      case 'all':
      default:
        return all;
    }
  }

  function filterAndSearch(tasks, { search = '', category = '', priority = '' }) {
    let result = [...tasks];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }

    if (category && category !== 'all') {
      result = result.filter(t => t.category === category);
    }

    if (priority && priority !== 'all') {
      result = result.filter(t => t.priority === priority);
    }

    return result;
  }

  function sortTasks(tasks, sortBy = 'createdAt') {
    const sorted = [...tasks];
    const priorityOrder = { high: 0, medium: 1, low: 2 };

    switch (sortBy) {
      case 'priority':
        return sorted.sort((a, b) =>
          (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9)
        );

      case 'dueDate':
        return sorted.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        });

      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));

      case 'createdAt':
      default:
        return sorted.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );
    }
  }

  function getStats() {
    const all    = getAll();
    const today  = getTodayStr();
    const total  = all.length;
    const done   = all.filter(t => t.completed).length;
    const overdue = all.filter(t => t.dueDate && t.dueDate < today && !t.completed).length;
    const inProgress = all.filter(t => !t.completed && t.status === 'inprogress').length;
    const todayTasks = all.filter(t => t.dueDate === today).length;
    const important  = all.filter(t => t.important).length;
    const upcoming   = all.filter(t => t.dueDate && t.dueDate > today && !t.completed).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    return { total, done, overdue, inProgress, todayTasks, important, upcoming, pct };
  }

  function getStatsByCategory() {
    const all = getAll();
    const cats = ['work', 'study', 'personal', 'health'];
    return cats.map(cat => ({
      name:  cat,
      total: all.filter(t => t.category === cat).length,
      done:  all.filter(t => t.category === cat && t.completed).length,
    }));
  }

  function getWeeklyData() {
    const all = getAll();
    const days = [];
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayTasks = all.filter(t => t.dueDate === dateStr);

      days.push({
        label:     labels[d.getDay()],
        date:      dateStr,
        total:     dayTasks.length,
        completed: dayTasks.filter(t => t.completed).length,
      });
    }

    return days;
  }

  function getAnalyticsData() {
    const all = getAll();
    const today = getTodayStr();
    const categories = ['work', 'study', 'personal', 'health'];
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const categoryMap = Object.fromEntries(categories.map(name => [name, { total: 0, done: 0 }]));
    const weeklyMap = new Map();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      weeklyMap.set(dateStr, {
        label: labels[d.getDay()],
        date: dateStr,
        total: 0,
        completed: 0,
      });
    }

    let done = 0;
    let overdue = 0;
    let inProgress = 0;
    let todayTasks = 0;
    let important = 0;
    let upcoming = 0;

    for (const task of all) {
      if (task.completed) done++;
      if (task.dueDate && task.dueDate < today && !task.completed) overdue++;
      if (!task.completed && task.status === 'inprogress') inProgress++;
      if (task.dueDate === today) todayTasks++;
      if (task.important) important++;
      if (task.dueDate && task.dueDate > today && !task.completed) upcoming++;

      const cat = categoryMap[task.category];
      if (cat) {
        cat.total++;
        if (task.completed) cat.done++;
      }

      const week = weeklyMap.get(task.dueDate);
      if (week) {
        week.total++;
        if (task.completed) week.completed++;
      }
    }

    const total = all.length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    return {
      stats: { total, done, overdue, inProgress, todayTasks, important, upcoming, pct },
      categories: categories.map(name => ({ name, ...categoryMap[name] })),
      weekly: Array.from(weeklyMap.values()),
    };
  }

  function getKanbanGroups() {
    const all = getAll();
    return {
      todo:       all.filter(t => !t.completed && t.status === 'todo'),
      inprogress: all.filter(t => !t.completed && t.status === 'inprogress'),
      completed:  all.filter(t => t.completed || t.status === 'completed'),
    };
  }

  function getTasksByDate(year, month) {
    const all = getAll();
    const map = {};
    all.forEach(t => {
      if (!t.dueDate) return;
      const [y, m] = t.dueDate.split('-').map(Number);
      if (y === year && m === month) {
        const day = parseInt(t.dueDate.split('-')[2]);
        if (!map[day]) map[day] = [];
        map[day].push(t);
      }
    });
    return map;
  }

  function getTodayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function isOverdue(task) {
    if (!task.dueDate || task.completed) return false;
    return task.dueDate < getTodayStr();
  }

  function isToday(task) {
    return task.dueDate === getTodayStr();
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((date - today) / 86400000);

    if (diff === 0)  return 'Today';
    if (diff === 1)  return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff > 0 && diff < 7) return `In ${diff} days`;
    if (diff < 0)   return `${Math.abs(diff)} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  }

  function getPriorityIcon(priority) {
    const icons = { high: 'fa-circle-exclamation', medium: 'fa-circle-half-stroke', low: 'fa-circle' };
    return icons[priority] || icons.medium;
  }

  function getCategoryIcon(category) {
    const icons = { work: 'fa-briefcase', study: 'fa-graduation-cap', personal: 'fa-user', health: 'fa-heart-pulse' };
    return icons[category] || 'fa-tag';
  }

  return {
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    toggleImportant,
    updateStatus,
    getAll,
    getByView,
    filterAndSearch,
    sortTasks,
    getStats,
    getStatsByCategory,
    getWeeklyData,
    getAnalyticsData,
    getKanbanGroups,
    getTasksByDate,
    getTodayStr,
    isOverdue,
    isToday,
    formatDate,
    getPriorityIcon,
    getCategoryIcon,
  };
})();
