# Task Manager API

A robust backend RESTful API for managing tasks, projects, and team collaborations.

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

- **User Authentication**: Secure user registration and login using JWT for stateless authentication, with support for refresh tokens.
- **Project Management**: Organize work by creating, updating, and deleting projects.
- **Task Management**: Full CRUD operations for tasks within projects, including status tracking and priorities.
- **Task Assignments**: Assign tasks to multiple users to facilitate team collaboration.
- **Comments System**: Add and manage comments on specific tasks for better communication.
- **Reliability**: Comprehensive test suite ensuring API stability and security.
- **Observability**: Structured production-ready logging with rotation and redaction.

## 📊 Observability & Logging

The system implements a production-grade observability stack:

- **Structured Logging**: Powered by [Pino](https://getpino.io/) for high-performance JSON logs that are easy to parse by log aggregators.
- **Environment-based Levels**: Log levels (debug, info, warn, error) are controlled via the `LOG_LEVEL` environment variable.
- **Sensitive Data Redaction**: Automatic redaction of sensitive fields (e.g., `password`, `token`) to ensure security compliance.
- **Containerized Logging**: Pre-configured Docker `json-file` driver for seamless log collection.
- **Log Rotation**: Built-in rotation to prevent disk exhaustion (configured for 3 files of 10MB each).


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