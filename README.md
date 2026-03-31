# DevNest – Campus Communication and Opportunity Platform

DevNest is a unified digital ecosystem built to support campus communication, opportunity discovery, learning guidance, and anonymous discussions. The platform integrates multiple subsystems—authentication, community interaction, automated event aggregation, learning resources, and administrative tools—into a cohesive, scalable, and secure application.

This documentation describes the system's conceptual structure, technical workflow, module behaviors, background automation, and architectural design.

---

## 1. Overview

DevNest addresses the recurring challenges faced in academic environments:

* Fragmented communication channels
* Lack of centralized access to opportunities
* Unstructured learning roadmaps
* Unsafe or unmoderated anonymous discussions
* Absence of automated tools for campus event curation

By consolidating these functions, DevNest becomes a comprehensive platform that improves student engagement, faculty communication, and administrative oversight.

The platform consists of four primary domains:

1. **User Communication Layer**
2. **Opportunity Dashboard with Automated Scraping**
3. **Learning Module for Skill Development**
4. **Community and Anonymous Posting System with Moderation**

All modules interconnect through an organized backend architecture and a predictable user workflow.

---

## 2. End-to-End System Workflow

### “DevNest: Full System Workflow”

Below is the complete system workflow integrated into the project.

---

### **Start Process**

* User opens the DevNest application, initiating UI setup and user session checks.

---

### **User Access Layer**

1. **Is the user logged in?**

   * If *No*:

     * Redirect to Login/Signup
     * Authenticate via Email/Password or Google OAuth
     * On success → Redirect to Dashboard
   * If *Yes*:

     * Load Dashboard immediately

---

### **Dashboard Operations**

After authentication, the dashboard loads:

* User profile
* User preferences
* Core modules:

  * Opportunity Dashboard
  * Learning Module
  * Community Module

Next, the user chooses one of the modules.

---

### **Module Selection Workflow**

#### **A. Opportunity Dashboard**

* Allows search and filtering of opportunities
* Displays detailed event information
* Redirects to external event pages
* Receives live updates from the scraper engine

#### **B. Learning Module**

* User selects a skill path
* Loads structured learning roadmaps
* Displays resources and progress tracking
* Stores progress data in the database

#### **C. Community Module**

* View existing posts
* Create new discussions (anonymous or identified)
* Submit posts → Stored in database
* User interactions (likes, reports) are logged

---

## 3. Backend System (Parallel Process)

A dedicated backend subsystem runs continuously alongside user interactions.

### **API Gateway**

* Handles incoming requests
* Manages authentication, data retrieval, and validation
* Routes queries to appropriate services

### **Database Query Engine**

* Processes CRUD operations
* Returns structured data for UI rendering

### **Output Delivery**

* Sends updated content to frontend
* Supports real-time updates using WebSockets

---

## 4. Automated Scraper Engine (Background System)

The scraper engine enhances DevNest by continuously collecting opportunities.

### **Scheduling Mechanism**

* Uses CRON jobs to trigger scraper tasks at intervals

### **Scraping Process**

* Fetches opportunities from:

  * Unstop
  * Devpost
* Validates responses
* If invalid:

  * Log error
  * Retry automatically

### **Successful Flow**

1. Extract data
2. Clean and validate fields
3. Normalize structure
4. Update database
5. Notify UI about new opportunities

This background process ensures that opportunity data is always fresh and relevant.

---

## 5. Database Structure

The DevNest database is organized around functional collections:

* **Users**
* **Opportunities**
* **Posts & Discussions**
* **Learning Resources**
* **Anonymous Identity Mapping**
* **Logs & Analytics**

Each collection is indexed for performance and supports scalable expansion.

---

## 6. Analytics & Monitoring Layer

The platform includes integrated monitoring capabilities:

* Usage tracking for various modules
* Scraper performance logs
* Interaction heatmaps
* Error and retry logs
* Engagement analytics for administrators

These insights inform improvements and maintain platform health.

---

## 7. System Architecture

DevNest follows a layered architecture:

```
Frontend (React + TypeScript)
│
└── Communicates via REST + WebSockets ──► Backend (Node.js + Express)
                                           │
                                           ├── Authentication Service
                                           ├── Learning Service
                                           ├── Community Service
                                           ├── Opportunity Service
                                           └── Scraper Engine (CRON)
                                             
Database Layer (MongoDB)
```

This architecture ensures:

* Logical separation of concerns
* Maintainable code structure
* Support for scaling modules independently
* Clean communication between client and server

---

## 8. Tech Stack

### **Frontend**

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* WebSocket (Socket.IO client)

### **Backend**

* Node.js
* Express
* MongoDB + Mongoose
* JWT Authentication + Google OAuth 2.0
* bcrypt Password Hashing
* Cron-based Automation
* Socket.IO for real-time updates

---

## 9. Installation Guide

### **1. Clone Repository**

```bash
git clone https://github.com/Nizamuddin1N/devNest
cd devNest
```

### **2. Backend Setup**

```bash
cd backend
npm install
cp .env.example .env
```

### **3. Frontend Setup**

```bash
cd frontend
npm install
cp .env.example .env
```

### **4. Start Application**

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

Access at:

* Frontend → [http://localhost:3000](http://localhost:3000)
* Backend API → [http://localhost:5000/api](http://localhost:5000/api)

---

## 10. API Overview

### **Authentication**

* Register
* Login
* Google OAuth Login
* Get Current User

### **Posts**

* Create
* Retrieve
* Delete
* Report

### **Admin**

* Identify anonymous author
* Ban/unban users
* View reported posts
* View analytics

### **WebSocket Events**

* Post updates
* Reports
* Admin actions
* User status

---

## 11. System Strengths

* Centralized campus information
* Automated event collection
* Secure anonymous environment
* Structured learning guidance
* Admin-driven moderation
* Real-time updates
* Scalable microservice-like organization

---

## 12. Conclusion

DevNest is a technologically robust, fully integrated platform built to enhance the academic ecosystem.
Its combination of modular design, automated data ingestion, secure interaction models, and user-friendly interfaces makes it a scalable and modern solution for campus communities.
