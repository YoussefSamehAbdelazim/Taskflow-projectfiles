# TaskFlow — Smart Task Management & Productivity App

TaskFlow is a responsive, browser-based task management application designed to help users organize daily work, manage deadlines, track task progress, and understand their productivity through a clean interactive dashboard.

<p align="center">
  <strong>Plan your work. Track your progress. Stay focused.</strong>
</p>

## Live Demo

[Open TaskFlow](https://task-flow-smart-task-management-nine.vercel.app/)

## Project Overview

TaskFlow provides a personal workspace for creating and managing tasks in one place. Users can organize tasks by category, set priorities and due dates, update task statuses, and review their workload through multiple views.

The application is built with **HTML5, CSS3, and Vanilla JavaScript**. Task data, theme preferences, and interface settings are stored in the browser using **Local Storage**, so the app does not require a backend or database for its current functionality.

TaskFlow also includes Progressive Web App (PWA) features through a web app manifest and a service worker, allowing the application shell to be cached for offline access after it has been loaded.

## Main Features

### 1. Dashboard

- Overview of task statistics.
- Total tasks and completed tasks.
- In-progress, overdue, and upcoming task counts.
- Tasks scheduled for the current day.
- Important-task count and completion percentage.
- Recent tasks preview.
- Quick view of overdue tasks.
- Current date and live clock.

### 2. Task Management

- Create new tasks.
- Edit existing tasks.
- Delete tasks with a confirmation step.
- Mark tasks as completed or reopen them.
- Mark and unmark tasks as important.
- Add a task description.
- Assign a category and priority.
- Set a due date and optional due time.
- Choose a task status.

Each task contains information such as its title, description, category, priority, status, due date, importance flag, and creation/update timestamps.

### 3. Task Categories

Tasks can be organized into four categories:

| Category | Purpose |
|---|---|
| Work | Work-related tasks and responsibilities. |
| Study | Learning, studying, and academic tasks. |
| Personal | Personal activities and reminders. |
| Health | Health and wellness-related tasks. |

### 4. Priority & Status Tracking

**Priority levels:**

- High
- Medium
- Low

**Task statuses:**

- To Do
- In Progress
- Completed

Tasks can be moved between workflow stages using the Kanban board on supported screen layouts.

### 5. Task Views

TaskFlow includes dedicated views to make it easier to focus on different groups of tasks:

| View | Description |
|---|---|
| Dashboard | Displays an overview of productivity and task statistics. |
| All Tasks | Shows all saved tasks. |
| Today | Shows tasks due today. |
| Upcoming | Shows unfinished tasks with future due dates. |
| Overdue | Shows unfinished tasks with past due dates. |
| Completed | Shows completed tasks. |
| Important | Shows tasks marked as important. |

### 6. Search, Filtering & Sorting

- Search tasks by title, description, or category.
- Filter tasks by category.
- Filter tasks by priority.
- Sort tasks by newest first, due date, priority, or title.
- Switch between grid and list layouts.

### 7. Calendar View

- View tasks organized by their due dates.
- Navigate between months.
- Select a calendar day to open the task creation form with that date preselected.

### 8. Kanban Board

- Organizes tasks into workflow columns.
- Includes To Do, In Progress, and Completed columns.
- Supports drag-and-drop task movement between columns.
- Updates task status when a task is dropped into another column.

### 9. Productivity Analytics

- Displays overall task statistics.
- Calculates task completion percentage.
- Shows task distribution by category.
- Displays weekly task activity and completion data.
- Helps users review completed, overdue, and in-progress tasks.

### 10. Theme & Interface Preferences

- Light and dark theme options.
- Saves the selected theme in Local Storage.
- Collapsible sidebar.
- Responsive navigation for smaller screens.
- Grid and list task layouts.

### 11. Progressive Web App (PWA)

- Web app manifest for installable-app metadata and icons.
- Service worker registration.
- Caches the main application files.
- Uses a cache-first strategy for same-origin static resources.
- Provides a cached application page when a navigation request cannot reach the network.
- Detects available application updates and displays an update prompt.

> **Offline note:** TaskFlow stores task information in the current browser, and its service worker caches the application shell. Some externally hosted resources, such as Google Fonts and Font Awesome CDN assets, may still require an internet connection if they have not been cached by the browser.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + N` / `Cmd + N` | Open the new task form. |
| `Ctrl + K` / `Cmd + K` | Focus the global task search. |
| `Escape` | Close an open modal or mobile navigation panel. |

## Technologies

### Front-End

- **HTML5** — Application structure and semantic elements.
- **CSS3** — Layout, styling, themes, animations, and responsive design.
- **Vanilla JavaScript** — Application logic, task operations, event handling, and dynamic rendering.

### Browser APIs

- **Local Storage API** — Stores tasks, theme selection, and interface settings in the browser.
- **Service Worker API** — Handles application caching, offline navigation fallback, and update activation.
- **Cache API** — Stores application resources for reuse.
- **Drag and Drop API** — Supports moving tasks between Kanban columns.
- **Web App Manifest** — Provides installable PWA metadata and icons.
- **Media Queries & matchMedia** — Support responsive behavior and device-layout detection.

### Libraries & External Resources

- **Font Awesome 6.5.1** — Interface icons.
- **Google Fonts** — Inter and Roboto Mono typography.

## Project Structure

```text
TaskFlow-Smart-Task-Management/
│
├── index.html
│
├── css/
│   ├── variables.css
│   ├── style.css
│   └── responsive.css
│
├── js/
│   ├── app.js
│   ├── storage.js
│   ├── tasks.js
│   └── ui.js
│
├── service-worker.js
├── site.webmanifest
│
├── favicon.ico
├── favicon-96x96.png
├── apple-touch-icon.png
├── web-app-manifest-192x192.png
├── web-app-manifest-512x512.png
└── og-image.png
```

### JavaScript Modules

| File | Responsibility |
|---|---|
| `app.js` | Initializes the application, manages navigation and events, and connects the application modules. |
| `storage.js` | Handles Local Storage operations for tasks, settings, and theme preferences. |
| `tasks.js` | Contains task creation, editing, deletion, filtering, sorting, status handling, and analytics calculations. |
| `ui.js` | Handles interface rendering, task cards, calendar, Kanban board, charts, modals, notifications, and theme updates. |

## How to Run Locally

TaskFlow does not require a package installation or build step.

1. Download or clone the project repository.
2. Open the project folder in your code editor.
3. Run the project using a local development server, such as the **Live Server** extension in Visual Studio Code.
4. Open the local address provided by the development server in your browser.

> Run the project through a local server rather than relying on a direct `file://` URL. Service workers require a secure context, such as HTTPS or localhost, to work.

## Data & Storage

- Tasks are saved in the browser's Local Storage.
- Theme selection and interface settings are also stored locally.
- Data is associated with the browser and device being used.
- There is currently no server-side database, account system, or automatic cloud synchronization.
- Clearing the browser's site data may remove locally stored tasks and preferences.

## Current Scope & Limitations

- TaskFlow is a front-end application; it does not currently use a backend or remote database.
- Tasks are stored locally in the user's browser and are not automatically synchronized across devices.
- The current project does not include user authentication or multi-user collaboration.
- Some third-party assets are loaded from external CDNs and may not be available offline.
- The Kanban view is hidden on the mobile layout.

## Developer

**Youssef Sameh**

## Project Goal

TaskFlow was built to practice and demonstrate front-end development skills through a practical productivity application. The project focuses on DOM manipulation, state handling, reusable JavaScript modules, browser storage, responsive interface design, data visualization, drag-and-drop interactions, and Progressive Web App fundamentals.
