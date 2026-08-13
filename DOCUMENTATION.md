# Task Manager Application Documentation

## 1. Overview
The Task Manager Application is a collaborative backend system for managing projects and tasks. It enables users to organize work into projects, track task progress, assign collaborators with specific roles, and communicate via task comments.

## 2. Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js (TypeScript)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Security**: 
  - JWT for secure authentication.
  - bcrypt for password hashing.
  - Helmet for HTTP header security.
  - Express-rate-limit for protecting sensitive endpoints.
- **Validation**: `class-validator` for request payload enforcement.

## 3. Database Schema & Entities

The system uses a relational PostgreSQL database managed through TypeORM entities:

- **User**: Core user profile data. Includes soft-delete capabilities.
- **Project**: High-level containers for tasks. Every project belongs to a specific user (owner).
- **Task**: The primary unit of work. Contains status (Pending, In Progress, Completed, Overdue), priority, and due dates.
- **Task Assignment**: Manages many-to-many relationships between Users and Tasks. Assigns specific roles (`TaskPermission`) to collaborators.
- **Comment**: Feedback and discussion threads attached to individual tasks.
- **Refresh Token**: Used to manage secure, persistent sessions by storing hashed tokens linked to users.

### Entity Relationships
- **User (1) ↔ Project (N)**: Users own projects.
- **Project (1) ↔ Task (N)**: Tasks belong to projects.
- **Task (1) ↔ Comment (N)**: Tasks have discussion threads.
- **Task (M) ↔ User (N)**: Accomplished via the **Task Assignment** junction table.

## 4. Authentication Flow

The application implements a stateless JWT-based authentication system:

1.  **Registration**: User provides details which are validated and stored (password hashed).
2.  **Login**: User receives an **Access Token** (short-lived for requests) and a **Refresh Token** (stored in DB for session persistence).
3.  **Authenticated Requests**: Access Tokens must be sent in the `Authorization` header: `Bearer <JWT_TOKEN>`.
4.  **Token Refresh**: When the Access Token expires, the client uses the Refresh Token to obtain a new one.
5.  **Logout**: Inactivates the session by revoking/removing the refresh token from the database.

## 5. Authorization & Access Control

Access control is enforced via middleware and service-layer logic:

### Global Access
- **`authenticateToken`**: Validates the JWT and populates `req.user` with the requester's ID and email.

### Task-Level Permissions (`TaskPermission`)
Users are assigned one of three levels of access per task:
- **OWNER**: Absolute control (Modify, Delete, Transfer Ownership, Assign others).
- **EDIT**: Can update task details and status.
- **VIEW**: Read-only access to task data and comments.

### Resource Ownership
- **Projects**: Only the project creator can update or delete the project.
- **Tasks**: Creators and users with `OWNER` permission have full administrative rights.

## 6. API Reference

All routes are prefixed with `/api/v1` unless stated otherwise.

### Connectivity & Health
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/welcome` | Connectivity test (returns "Welcome to Task Manager"). |
| `GET` | `/health` | Server health status, database connectivity, and uptime. |

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/register` | Register a new account. |
| `POST` | `/login` | Authenticate and get tokens (Rate limited). |
| `POST` | `/refresh` | Rotate access token using a valid refresh token. |
| `POST` | `/logout` | Revoke session and log out (Requires Token). |
| `POST` | `/user` | Search for a user by email address. |
| `DELETE` | `/delete/me` | Soft-delete the authenticated user's account. |

### Projects (`/api/v1/projects`)
*Requires Authentication*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/create` | Initialize a new project. |
| `GET` | `/all` | List all projects created by the user. |
| `GET` | `/:projectId` | Fetch specific project details. |
| `PUT` | `/:projectId/update` | Modify project metadata. |
| `DELETE` | `/:projectId/delete` | Soft-delete a project. |
| `PUT` | `/:projectId/restore` | Recover a deleted project. |

### Tasks (`/api/v1/tasks`)
*Requires Authentication*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/create` | Create a task within a specified project. |
| `GET` | `/all/:projectId` | List all tasks associated with a project. |
| `GET` | `/:taskId` | Fetch detailed task information. |
| `PUT` | `/:taskId/update` | Update task status, title, or description. |
| `DELETE` | `/:taskId/delete` | Soft-delete a task. |
| `PUT` | `/:taskId/restore` | Restore a previously deleted task. |

### Task Assignments (`/api/v1/taskassignments`)
*Requires Authentication*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/assign/:taskId` | Assign a user to a task with a specific role. |
| `PUT` | `/update/:taskId/:userId` | Change a collaborator's permission level. |
| `DELETE` | `/remove/:taskId` | Remove a collaborator from a task. |
| `GET` | `/permission/:taskId` | Get your own permission level for a task. |
| `GET` | `/assignments/:taskId` | List all collaborators on a specific task. |
| `GET` | `/assignedtasks` | List all tasks assigned to you. |
| `POST` | `/bulkassign/:taskId` | Assign multiple users to a task simultaneously. |
| `PUT` | `/transfer/:taskId` | Hand over ownership of a task to another user. |

### Comments (`/api/v1/comments`)
*Requires Authentication*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/comments/:taskId` | Add a comment to a task. |
| `GET` | `/comments/:taskId` | Retrieve all comments for a task. |
| `PUT` | `/comments/:commentId` | Edit a previously made comment. |
| `DELETE` | `/comments/:commentId` | Delete a specific comment. |


# important
- cross env package added to script to help with  handling environment variables across different platforms .  


testing phase
edgecases
Authentication Phase
Registration Phase

Input validation

Empty/missing fields, wrong data types
Invalid email format
Username/password length limits (too short, too long)
Weak password rejection (complexity enforced)
Whitespace-only values (@Matches(/\S/) or trim-then-@IsNotEmpty())
Leading/trailing whitespace not trimmed (username, email — not password)
Extra/unexpected fields (whitelist: true + forbidNonWhitelisted: true)

Case sensitivity & normalization

Email case sensitivity — lowercase via @Transform()
Username case sensitivity
Unicode/emoji in username

Security

SQL injection payloads — test in username, not email
XSS payloads — test in username, not email
Password never returned in response body
Password never logged
User enumeration via timing/error message differences

Login Phase

Input validation

Missing fields (email/password)
Invalid email format
Empty strings in email/password
Leading/trailing whitespace in email/password
Extra fields (if forbidNonWhitelisted)

Credentials validation

Correct password vs. wrong password (exact match)
Correct email vs. non-existent email (should return 404 consistently)
Wrong case in email (if email normalized to lowercase)
Both correct vs. both wrong

Concurrency & race conditions

Simultaneous login attempts with same user
Login after password reset (should fail)
Login after account deletion (should fail)
Rate limiting (if implemented)

Security

Token leakage prevention (no token in error message)
Timing attacks (consistent timing)
SQL injection in username/email fields
XSS in username field
Password reset & forgot password

Invalid/expired token handling
Rate limiting on reset endpoint
Token expiration behavior (15 min vs 24 hours)
Case sensitivity in email validation
Race condition between valid & expired tokens
Security

updateuser

Update Profile
@IsOptional() on all fields
Uniqueness re-check on email/username change, excluding own record
whitelist/forbidNonWhitelisted blocks role, id, createdAt, etc.
IDOR: user_id never from body — always req.user.id
Password excluded from this DTO

Security

No tokens leaked in error messages
Timing attack resistance

v2 implementstion plan
add redis and ai agent
work with bullmq - If you add features like:

email notifications when assigned a task
reminder emails for overdue tasks
weekly reports
exporting tasks to PDF
generating analytics


fetchprojectbyId edge cases
Core behavior

Project exists and belongs to the requesting user → 200, returns project with tasks
Project exists but belongs to a different user → 404 (not 403) — this is the IDOR-safe choice, since returning 403 would confirm to an attacker "this project ID exists, you're just not allowed to see it," leaking information. 404 is the correct, non-leaking response, consistent with how you've handled similar cases elsewhere
Project doesn't exist at all (invalid/non-existent projectId) → 404, same message as above — deliberately indistinguishable from "exists but not yours," for the same enumeration-prevention reason
Soft-deleted project → should return 404 (already correctly filtered via is_deleted: false)

Input validation

projectId is non-numeric (e.g. /projects/abc) — since this comes from req.params.projectId and gets Number()-converted in your controller, confirm Number("abc") → NaN is handled gracefully (doesn't crash the query, returns 400 or 404 cleanly rather than a 500)
projectId is missing/empty in the URL — shouldn't be reachable given your route definition (/:projectId/...), but worth a defensive test anyway

Authentication

No token → 401 (handled by middleware, not this service)
Invalid/expired token → 403 (per your authenticateToken middleware's existing behavior)

Response contract

Response includes tasks relation correctly (confirm the array is populated, not empty when tasks exist)
Response doesn't leak the user relation's password — wait, actually check: does this query even load the user relation? Looking at your code, relations: ["tasks"] — no user relation loaded here, so there's no password-leak risk in this particular method, unlike getAllProjects. Worth confirming intentionally: do you want user info returned with a single project fetch? If yes, add the relation and remember to strip password; if no, current behavior is fine as-is.

Concurrency (lower priority, edge case)

Project gets soft-deleted by a concurrent request between the initial existence check and this fetch — not really applicable here since there's only one query, no multi-step race condition in this specific method

comments
The industry-standard approach for free-text fields

The consensus (OWASP's guidance included) is: don't restrict input characters for free text — sanitize/encode on output instead.

Length limits — yes, always. Prevents abuse (someone pasting a 500,000-character string) and DB bloat
Trim whitespace — yes
Reject empty/whitespace-only — yes
No character whitelist — let people type anything, including <, >, &, emoji, non-Latin scripts
XSS protection happens at render time, not input time — when the comment is eventually displayed (in your frontend, or anywhere else it's rendered as HTML), it must be escaped/encoded there — e.g. React does this automatically by default when rendering strings in JSX; if you ever build raw HTML templates, you'd need explicit escaping (like escapeHtml() or a templating engine that auto-escapes)
SQL injection isn't a concern here at all — since TypeORM parameterizes queries, arbitrary comment content (including '; DROP TABLE style text) is stored as inert data, never executed

This is why your earlier sqlInjectionPayloads/xssPayloads tests made sense for name (structured field, whitelist expected to reject them) but wouldn't make sense for content here — rejecting <script> as input isn't the right defense for a comment field; the defense is escaping it wherever it's displayed.


