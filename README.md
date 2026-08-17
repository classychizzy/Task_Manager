# Task Manager API

# Task Manager API

**Live API:** https://task-manager-net8.onrender.com  
**API Documentation:** https://task-manager-net8.onrender.com/api-docs


A production-style backend built with TypeScript, Express, PostgreSQL, and TypeORM that demonstrates secure authentication, role-based authorization, task collaboration, audit logging, background processing, and production-ready API design.

Designed to simulate the architecture and security practices used in modern SaaS applications.

## Architecture

The project follows a layered architecture:

Controllers
↓

Services
↓

Repositories
↓

PostgreSQL

Business logic is isolated in the service layer, promoting maintainability and testability.

## 🚀 Technologies Used

- **Runtime**: [Node.js](https://nodejs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **ORM**: [TypeORM](https://typeorm.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Security**: [JWT](https://jwt.io/) (JSON Web Tokens), [Bcrypt](https://github.com/kelektiv/node.bcrypt.js)
- **Validation**: [class-validator](https://github.com/typestack/class-validator), [class-transformer](https://github.com/typestack/class-transformer)
- **Testing**: [Jest](https://jestjs.io/), [Supertest](https://github.com/ladjs/supertest)

## ✨ Core Features

### User Authentication
- Secure user registration and login
- JWT-based authentication
- Refresh token rotation
- Password hashing with bcrypt

### 🛡️ Authorization & Access Control
- Role-Based Access Control (RBAC)
- OWNER, EDIT, and VIEW permissions
- Horizontal access control through resource ownership validation
- Secure ownership transfer between collaborators
- Permission management for shared tasks
- Soft deletion of task assignments
- **Project Management**
- Create, update, archive, and delete projects
- Organize tasks into projects
### ✅ Task Management
- Full CRUD operations
- Status tracking
- Priorities
- Due dates
- Soft delete support

### 👥 Collaboration
- Assign tasks to multiple users
- Bulk task assignment
- Task comments
- Permission-based collaboration

### ⏰ Background Processing
- Automatic overdue task detection
- Notification scheduling
- Daily cron jobs

### 📊 Observability
- Structured logging with Pino
- Audit logging for security-sensitive operations
- Log rotation
- Sensitive data redaction

### 🧪 Testing
- Unit tests with Jest
- API testing with Supertest


## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env` file (refer to `.env.example` if available)
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🧪 Running Tests
```bash
npm test
```

---
[Original UML Diagram Link](https://app.diagrams.net/?src=about#G1EPP3bdUsVmzIkomrUfI9G2qjiYDc8IGr#%7B%22pageId%22%3A%22Fs2OGKSr5x9JGBmGOfYn%22%7D)