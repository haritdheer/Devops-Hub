<div align="center">

# ⚡ DevOps Utility Hub

**A modular, desktop-inspired React platform for essential DevOps workflows**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-latest-FF0055?style=flat-square&logo=framer)](https://www.framer.com/motion)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

<br/>

> Instead of juggling multiple browser tabs and disconnected tools, engineers get one high-performance workspace to **inspect**, **validate**, **compare**, and **troubleshoot** operational artifacts.

</div>

---

## ✨ Features at a Glance

| Tool | What it does |
|---|---|
| 🟢 **YAML Validator** | Validate, format, prettify YAML with line-level error reporting |
| 🟡 **JSON Formatter** | Validate, minify, prettify JSON with structure stats |
| 🟣 **JWT Decoder** | Decode tokens, inspect claims, show expiry status |
| 🔵 **Cron Tester** | Parse cron expressions, explain in plain English, preview next 8 runs |
| 🟠 **Base64 Tool** | Encode / decode Base64 with instant conversion |
| 🩵 **Docker Compose Previewer** | Parse compose files into visual service cards |
| 🔷 **Kubernetes Inspector** | Inspect multi-resource YAML, extract containers / replicas / ports |
| 🩷 **Env Diff Checker** | Side-by-side `.env` comparison with secret masking |
| 🔴 **Log Analyzer** | Highlight severity, count patterns, group repeated errors |
| 🩵 **cURL Converter** | Convert cURL commands to `fetch` and `axios` |

### Platform-level Features

- **Command Palette** — `Ctrl+K` / `Cmd+K` search across all tools with keyboard navigation
- **Persistence Layer** — last editor input per tool saved to `localStorage` automatically
- **Saved Snippets** — save and revisit inputs categorised by tool
- **Animated Dashboard** — count-up stats, stacked category bar, animated progress bars
- **Plugin Architecture** — each tool registered via a central `ToolPlugin` contract
- **Collapsible Sidebar** — animated, with category grouping and active route highlight
- **Settings Page** — General, Storage, Appearance, Keyboard Shortcuts

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
# Clone the repository
git clone https://github.com/haritdheer/Devops-Hub.git
cd Devops-Hub

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── router/          # React Router v6 configuration
│   ├── store/           # Zustand global state (sidebar, recent tools)
│   └── providers/
├── components/
│   ├── layout/          # AppLayout, Sidebar, Topbar
│   ├── common/          # ToolShell, StatusBadge
│   └── command-palette/ # Cmd+K modal
├── features/
│   ├── dashboard/       # Dashboard page with animated stats
│   ├── tools/           # One folder per tool
│   ├── snippets/        # Saved snippets page
│   └── settings/        # Settings page
├── plugins/
│   ├── registry/        # Central tool registry (single source of truth)
│   └── types/           # ToolPlugin interface
├── lib/
│   ├── parsers/         # Pure parser logic (yaml, json, jwt, cron, docker, k8s, curl, env-diff)
│   └── analyzers/       # Log analyzer
└── hooks/
    └── useToolPersistence.ts  # localStorage persistence hook
```

### Plugin Architecture

Every tool is registered once via a `ToolPlugin` contract:

```ts
export interface ToolPlugin {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: string;
  category: 'validation' | 'inspection' | 'conversion' | 'analysis';
  tags: string[];
  persistenceKey: string;
  featured?: boolean;
  color: string;
  gradient: string;
}
```

The dashboard cards, sidebar links, command palette results, and recent-tools tracking are all **automatically generated** from this registry — no duplication.

---

## 🧠 Parser Layer

All parsing logic lives in `src/lib/` as **pure TypeScript functions** — completely decoupled from React:

| Parser | Library / Approach |
|---|---|
| YAML | `js-yaml` with `mark` for line/column errors |
| JSON | Native `JSON.parse/stringify` |
| JWT | Manual Base64URL decode, claim interpretation |
| Cron | `cronstrue` (human text) + `cron-parser` (next runs) |
| Docker Compose | `js-yaml` + structured service extraction |
| Kubernetes | `yaml.loadAll` for multi-document manifests |
| Env Diff | Custom line parser with key normalisation |
| Log Analyzer | Regex-based level detection + pattern normalisation |
| cURL | Regex tokeniser → `fetch` / `axios` codegen |

---

## 🎨 Design System

- **Theme:** Near-black slate background with translucent glassmorphism surfaces
- **Accents:** Cyan · Blue · Violet · Green · Orange
- **Utilities:** `.glass`, `.glass-card`, `.text-gradient` defined in `src/index.css`
- **Animations:** Framer Motion — stagger cards, count-up numbers, animated progress bars, smooth page transitions
- **Typography:** System UI / Inter, monospace for code panels

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript 5 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS v3 |
| Animation | Framer Motion |
| State | Zustand (with `persist` middleware) |
| Routing | React Router v6 |
| Icons | Lucide React |
| YAML parsing | js-yaml |
| Cron parsing | cronstrue + cron-parser |
| Utility | clsx, date-fns |

---

## 📁 Key Files

| File | Purpose |
|---|---|
| `src/plugins/registry/index.ts` | Central tool registry |
| `src/hooks/useToolPersistence.ts` | localStorage persistence hook |
| `src/app/store/index.ts` | Zustand global store |
| `src/components/layout/AppLayout.tsx` | Root shell with command palette |
| `src/components/layout/Sidebar.tsx` | Animated collapsible sidebar |
| `src/features/dashboard/DashboardPage.tsx` | Dashboard with animated stats |

---

## 👥 Built By — ⚡ Blitzkrieg Team

<table>
<tr>
<td align="center" width="50%">
<h3>Hardik Dheer</h3>
<b>Specialist Programmer · Infosys</b><br/>
B.Tech CSE · GGSIPU · GPA 9.5<br/><br/>
<code>Spring Boot</code> <code>React</code> <code>Kafka</code> <code>PostgreSQL</code> <code>TypeScript</code><br/><br/>
Full-stack engineer with deep backend expertise. Builds GST compliance systems processing 1M+ daily transactions.<br/><br/>
<a href="https://www.linkedin.com/in/hardik-dheer-646582216/">🔗 LinkedIn</a> &nbsp;·&nbsp;
<a href="mailto:hardikdheer12@gmail.com">📧 hardikdheer12@gmail.com</a>
</td>
<td align="center" width="50%">
<h3>Harit Dheer</h3>
<b>Software Developer · THB / Sekhmet Technologies</b><br/>
B.Tech IT · GGSIPU · GPA 9.36<br/><br/>
<code>React</code> <code>TypeScript</code> <code>Node.js</code> <code>Next.js</code> <code>Redux</code> <code>PWA</code><br/><br/>
Frontend-focused full-stack developer building scalable healthcare CRMs with performance-first architecture.<br/><br/>
<a href="https://www.linkedin.com/in/harit-dheer-612a28203/">🔗 LinkedIn</a> &nbsp;·&nbsp;
<a href="mailto:haritdheer@gmail.com">📧 haritdheer@gmail.com</a>
</td>
</tr>
</table>

> Two brothers. One shared obsession with clean code, great developer tooling, and shipping things that actually work.

---

## 📄 License

MIT © 2026 Blitzkrieg Team
