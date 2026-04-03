# ZB Deploy UI

A modern web interface for managing and executing ZB deployment scripts.

## Features

- 📋 **Script Management** — Create, edit and delete deployment scripts with name, description, command and environment
- ▶️ **One-click Execution** — Run scripts with live output streaming and status tracking
- 📜 **Execution History** — Browse per-script logs with timestamps, duration and exit codes
- 🔍 **Search & Filter** — Filter scripts by name/description or environment
- 📊 **Dashboard Stats** — At-a-glance view of total, running, succeeded and failed scripts

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 8](https://vite.dev/) (build tool)
- [Tailwind CSS v4](https://tailwindcss.com/) (styling)
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) (tests)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Development

```bash
# Lint
npm run lint

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/      # UI components (ScriptCard, ScriptForm, Modal, etc.)
├── services/        # Business logic & localStorage persistence
├── test/            # Unit tests
├── types/           # TypeScript type definitions
├── App.tsx          # Root application component
└── main.tsx         # Entry point
```

> **Note:** This version uses browser `localStorage` for persistence. In a production deployment this would be replaced with a backend API.
