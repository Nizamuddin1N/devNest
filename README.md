# 🏠 DevNest

**A unified campus platform for opportunities, learning, and community. Everything your college scattered across ten different places, in one.**

[![GitHub](https://img.shields.io/badge/GitHub-Nizamuddin1N-181717?style=flat-square&logo=github)](https://github.com/Nizamuddin1N/devNest)
[![React](https://img.shields.io/badge/react-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Node](https://img.shields.io/badge/node-20.x-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/mongodb-atlas-47A248?style=flat-square&logo=mongodb)](https://mongodb.com)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

---

Campus life has an information problem. Hackathons are posted in one WhatsApp group, learning resources in another, event announcements on a notice board nobody checks, and anonymous feedback goes nowhere. DevNest puts all of it in one place.

Four modules — opportunities, learning roadmaps, community discussions, and anonymous posting with real moderation. A background scraper pulls fresh hackathons and competitions from Unstop and Devpost automatically so the opportunity feed is always current without anyone manually updating it. Anonymous posts are actually anonymous but still moderated — admins can reveal identity on reported content without exposing it publicly.

Built for college students who are tired of missing things because the information was in the wrong channel.

---

## What it actually does

- **Opportunity dashboard** — hackathons, competitions, internships aggregated automatically from Unstop and Devpost via CRON-scheduled scraper. Search, filter, click through to external page
- **Auto-scraper engine** — runs on a schedule, fetches, validates, cleans, normalizes, and saves opportunities. Retries on failure, logs errors, notifies frontend of new data via WebSocket
- **Learning module** — structured skill roadmaps, curated resources per path, progress tracking saved to DB per user
- **Community posts** — create discussions either identified or anonymous, likes, reports, real-time updates via Socket.IO
- **Anonymous posting with real moderation** — posts are genuinely anonymous to other users, but admins can reveal the author of reported content. Ban/unban users. View analytics
- **Google OAuth + JWT** — sign in with Google or email/password, refresh token strategy, role-based access control

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React, TypeScript, Vite, TailwindCSS, React Router, Socket.IO client |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB Atlas |
| Auth | JWT (access + refresh), Google OAuth 2.0, bcrypt |
| Real-time | Socket.IO — post updates, reports, admin actions, user status |
| Automation | Node-cron — scheduled scraper jobs |
| Scraping | Unstop, Devpost opportunity aggregation |

---

## How the anonymous moderation works

This was the trickiest part to design. Full anonymity means users feel safe posting honestly. But full anonymity with no moderation means bad actors can abuse the system without consequences.

The solution is a separate **Anonymous Identity Mapping** collection in MongoDB. When a user creates an anonymous post, their real userId is stored in this collection mapped to the post ID — completely separate from the post document itself. The post document has no author field. Other users and the API never return this mapping.

When a post gets reported and an admin reviews it, a protected admin-only endpoint queries the identity mapping collection. The author is revealed only to the admin, only for that post, only after a report. It never appears in any public response.

Anonymous to everyone. Accountable when it matters.

---

## System architecture
```
React + TypeScript (Frontend)
        │
   REST + WebSockets
        │
        ▼
   Express API (Backend)
        │
 ┌──────┼───────────────────┐
 ▼      ▼                   ▼
Auth  Community          Opportunity
      Learning            Service
      Service               │
        │               CRON Scraper
        ▼               (Unstop, Devpost)
    MongoDB Atlas
```

---

## Getting started locally
```bash
# Clone
git clone https://github.com/Nizamuddin1N/devNest
cd devNest

# Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend → `http://localhost:3000`
Backend API → `http://localhost:5000/api`

---

## Environment variables
```env
# Backend
MONGO_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CLIENT_URL=http://localhost:3000

# Frontend
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Project structure
```
devNest/
├── backend/
│   ├── services/
│   │   ├── auth/           JWT, Google OAuth, refresh tokens
│   │   ├── community/      Posts, likes, reports, moderation
│   │   ├── opportunity/    CRUD + scraper integration
│   │   ├── learning/       Roadmaps, resources, progress
│   │   └── scraper/        CRON jobs, Unstop + Devpost fetchers
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Opportunity.js
│   │   ├── LearningProgress.js
│   │   └── AnonymousMapping.js   ← never exposed publicly
│   └── socket/             WebSocket event handlers
└── frontend/
    └── src/
        ├── pages/          Dashboard, Opportunities, Learning, Community
        ├── components/
        ├── context/        Auth context
        └── api/            Axios instances
```

---

## API overview

**Auth** — register, login, Google OAuth, refresh token, get current user

**Posts** — create (anonymous or identified), list, delete, like, report

**Opportunities** — list, search, filter, get by ID

**Learning** — get roadmaps, get resources by skill, save progress

**Admin (protected)** — reveal anonymous author, ban/unban user, view reported posts, view analytics

**WebSocket events** — new post, post reported, admin action, user online status

---

## Known limitations

- Scraper depends on Unstop and Devpost HTML structure — breaking changes on their end require selector updates
- Anonymous identity mapping adds a DB lookup on every admin moderation action
- No mobile layout yet, designed for desktop browsers
  
---

*Built by [Nizamuddin](https://github.com/Nizamuddin1N)*
