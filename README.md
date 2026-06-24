# Code Your Future Platform API

Backend API for managing program batches, students, companies, tasks, submissions, admin reviews, and skill ratings.

This README is written for API consumers first. For the interactive OpenAPI docs, run the app with `DEBUG=true` and open:

- Swagger UI: `GET /api`
- OpenAPI JSON: `GET /api-json`

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run start:dev
```

Build:

```bash
npm run build
```

Run e2e tests using the existing test env file:

```bash
npm run test:e2e
```

The app reads configuration from environment variables, especially `DATABASE_URL`. Docker scripts still exist in `package.json`, but they are optional helpers, not required for local development.

## Authentication

The API uses opaque bearer tokens.

Login:

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "username": "platform-admin",
  "password": "Str0ngP@ssword!"
}
```

Response:

```json
{
  "access_token": "opaque-token",
  "user": {
    "id": 1,
    "username": "platform-admin",
    "role": "admin"
  }
}
```

Authenticated requests:

```http
Authorization: Bearer opaque-token
```

Other auth endpoints:

| Method | Path | Roles | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | Public | Login with `username` and `password`. |
| `POST` | `/auth/logout` | `admin`, `student`, `company` | Revoke current token. |
| `PATCH` | `/auth/set-password` | Authenticated active user | Change own password. |
| `DELETE` | `/auth/reset-all-sessions/:userId` | `admin` | Revoke all sessions for a user. |

## Enum Values

### `Role`

```ts
admin
student
company
```

### Admin-creatable roles

Admins can create only:

```ts
admin
student
```

Companies sign up through public self-service.

### `TaskType`

```ts
regular
final
```

### `SubmissionLinkType`

```ts
github
google_drive
live_demo
video
```

Validation rules:

- `github` must be a `github.com` URL.
- `google_drive` must be a `drive.google.com` URL.
- `video` must be YouTube or Vimeo:
  - `youtube.com/watch?v=...`
  - `youtube.com/shorts/...`
  - `youtube.com/embed/...`
  - `youtu.be/...`
  - `vimeo.com/...`
  - `player.vimeo.com/video/...`
- `live_demo` accepts any valid URL.

### `SubmissionStatus`

```ts
submitted
reviewed
needs_changes
accepted
rejected
```

Admins can set review status to:

```ts
reviewed
needs_changes
accepted
rejected
```

`late` is not a stored status. Responses include `isLate`, derived from `submission.createdAt > task.deadlineAt`.

### User ordering

```ts
ASC
DESC
```

Student browsing defaults to ranking by `average_rating DESC`.

## Core Business Rules

- A batch is one iteration of the program.
- A student belongs to one batch.
- Admins create batches, skills, specializations, tasks, and admin/student accounts.
- Companies self-sign up using `POST /users`.
- Students and admins are not publicly registered.
- Users can update their own profile fields and links.
- A regular task belongs to one batch and is open to all students in that batch.
- A final task belongs to one batch and is assigned to exactly one student.
- Final tasks always require a `video` submission link.
- Students can submit once per task.
- Students can edit their submission before the task deadline.
- After the deadline, students can edit only if an admin sets the submission to `needs_changes`.
- Admins review submissions, add notes, set status, and rate only skills assigned to that task.
- Ratings are `0` to `10`.
- Student `averageRating` is stored on the user record and recomputed when ratings change.
- Average rating formula:

```text
averageRating = average(
  average(all ratings for skill A),
  average(all ratings for skill B),
  average(all ratings for skill C)
)
```

This prevents one frequently rated skill from dominating the whole student score.

## Users

### Company signup

```http
POST /users
Content-Type: application/json
```

```json
{
  "name": "Acme Hiring",
  "username": "acme-hiring",
  "password": "Str0ngP@ssword!"
}
```

Creates a `company` account and returns an auth token.

### Admin creates a student or admin

```http
POST /users/admin
Authorization: Bearer <admin-token>
Content-Type: application/json
```

```json
{
  "name": "Student One",
  "username": "student-one",
  "phone": "+9619111111",
  "password": "Str0ngP@ssword!",
  "role": "student",
  "batchId": 1,
  "specializationId": 1
}
```

Notes:

- `role` must be `student` or `admin`.
- `batchId` is required for students.
- `phone` is optional because `username` is the unique login identifier.

### Current user profile

| Method | Path | Roles | Description |
| --- | --- | --- | --- |
| `GET` | `/users/me` | Authenticated | Get current user. |
| `PATCH` | `/users/me` | Authenticated | Update own profile. |
| `DELETE` | `/users/me` | `admin`, `student` | Delete own account. |

Profile update fields:

```json
{
  "name": "Student One",
  "bio": "Fullstack developer",
  "githubUrl": "https://github.com/student-one",
  "linkedinUrl": "https://www.linkedin.com/in/student-one",
  "portfolioUrl": "https://student-one.dev",
  "cvUrl": "https://drive.google.com/file/d/example",
  "googleDriveUrl": "https://drive.google.com/drive/folders/example",
  "specializationId": 1
}
```

### Student browsing

```http
GET /users/students
Authorization: Bearer <admin-or-company-token>
```

Allowed roles: `admin`, `company`.

Optional query params:

| Param | Description |
| --- | --- |
| `page` | Page number. |
| `limit` | Page size, max `100`. |
| `search` | Matches student `name` or `username`. |
| `batchId` | Filter by batch. |
| `specializationId` | Filter by specialization. |

Students are returned ranked by `averageRating` descending.

Admin-only user endpoints:

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/users` | List users with filters. |
| `GET` | `/users/:id` | Get one user. |
| `DELETE` | `/users/:id` | Delete a user. |

## Catalogs

Batches, skills, and specializations are small admin-managed catalogs. Authenticated users can read them; only admins can write them.

### Batches

| Method | Path | Roles |
| --- | --- | --- |
| `POST` | `/batches` | `admin` |
| `GET` | `/batches` | Authenticated |
| `GET` | `/batches/:id` | Authenticated |
| `PATCH` | `/batches/:id` | `admin` |
| `DELETE` | `/batches/:id` | `admin` |

Create/update body:

```json
{
  "name": "Fullstack 2026",
  "description": "Fullstack web development cohort",
  "startsAt": "2026-01-01T00:00:00.000Z",
  "endsAt": "2026-06-01T00:00:00.000Z"
}
```

### Skills

| Method | Path | Roles |
| --- | --- | --- |
| `POST` | `/skills` | `admin` |
| `GET` | `/skills` | Authenticated |
| `GET` | `/skills/:id` | Authenticated |
| `PATCH` | `/skills/:id` | `admin` |
| `DELETE` | `/skills/:id` | `admin` |

Body:

```json
{
  "name": "React",
  "description": "React UI development"
}
```

### Specializations

| Method | Path | Roles |
| --- | --- | --- |
| `POST` | `/specializations` | `admin` |
| `GET` | `/specializations` | Authenticated |
| `GET` | `/specializations/:id` | Authenticated |
| `PATCH` | `/specializations/:id` | `admin` |
| `DELETE` | `/specializations/:id` | `admin` |

Body:

```json
{
  "name": "Fullstack Developer",
  "description": "Frontend and backend web development"
}
```

Catalog list endpoints support:

| Param | Description |
| --- | --- |
| `page` | Page number. |
| `limit` | Page size. |
| `search` | Searches `name` and `description`. |

## Tasks

Tasks are assignments.

| Method | Path | Roles | Description |
| --- | --- | --- | --- |
| `POST` | `/tasks` | `admin` | Create a task with required links and skills. |
| `GET` | `/tasks` | `admin`, `student` | List tasks. Students see only eligible tasks. |
| `GET` | `/tasks/:id` | `admin`, `student` | Get one task. |
| `PATCH` | `/tasks/:id` | `admin` | Update a task. |
| `DELETE` | `/tasks/:id` | `admin` | Delete a task. |

### Create regular task

```http
POST /tasks
Authorization: Bearer <admin-token>
Content-Type: application/json
```

```json
{
  "title": "Build a portfolio API",
  "description": "Create a REST API for a personal portfolio.",
  "type": "regular",
  "batchId": 1,
  "deadlineAt": "2026-08-01T23:59:59.000Z",
  "requiredLinkTypes": ["github", "google_drive"],
  "skillIds": [1, 2]
}
```

### Create final task

```json
{
  "title": "Final project",
  "description": "Submit your final project.",
  "type": "final",
  "batchId": 1,
  "assignedStudentId": 12,
  "deadlineAt": "2026-08-15T23:59:59.000Z",
  "requiredLinkTypes": ["github"],
  "skillIds": [1, 2, 3]
}
```

Final tasks automatically include `video` in `requiredLinkTypes`, even if omitted.

Task rules:

- `skillIds` is required and cannot be empty.
- All rated submission skills must be among the task skills.
- `regular` tasks cannot have `assignedStudentId`.
- `final` tasks must have `assignedStudentId`.
- The assigned final-task student must belong to the task batch.
- Required links and skills cannot be changed after submissions exist.

Task list filters:

| Param | Description |
| --- | --- |
| `page` | Page number. |
| `limit` | Page size. |
| `search` | Searches title and description. |
| `type` | `regular` or `final`. |
| `batchId` | Filter by batch. |
| `assignedStudentId` | Filter final tasks by assigned student. |

## Submissions

Students submit work to tasks. Admins review it.

| Method | Path | Roles | Description |
| --- | --- | --- | --- |
| `POST` | `/submissions` | `student` | Submit work to a task. |
| `GET` | `/submissions` | `admin`, `student` | List submissions. Students see only their own. |
| `GET` | `/submissions/:id` | `admin`, `student` | Get one submission. |
| `PATCH` | `/submissions/:id` | `student` | Edit own submission links. |
| `PATCH` | `/submissions/:id/review` | `admin` | Review, set status, and rate skills. |

### Create submission

```http
POST /submissions
Authorization: Bearer <student-token>
Content-Type: application/json
```

```json
{
  "taskId": 1,
  "links": [
    {
      "type": "github",
      "url": "https://github.com/student/project"
    },
    {
      "type": "google_drive",
      "url": "https://drive.google.com/file/d/example"
    }
  ]
}
```

Final task submission example:

```json
{
  "taskId": 2,
  "links": [
    {
      "type": "github",
      "url": "https://github.com/student/final-project"
    },
    {
      "type": "video",
      "url": "https://www.youtube.com/watch?v=abc123"
    }
  ]
}
```

Submission rules:

- Only students submit.
- Students can submit only to regular tasks in their batch.
- Students can submit to final tasks only when assigned to them.
- One submission per student per task.
- All task `requiredLinkTypes` must be present.
- Link types cannot be duplicated in the same submission.
- Editing resets status back to `submitted`.
- Students cannot edit reviewed/accepted/rejected submissions.
- Students cannot edit after deadline unless status is `needs_changes`.

### List submissions

```http
GET /submissions?taskId=1&status=submitted
Authorization: Bearer <admin-or-student-token>
```

Filters:

| Param | Description |
| --- | --- |
| `page` | Page number. |
| `limit` | Page size. |
| `taskId` | Filter by task. |
| `studentId` | Admin-only useful filter. Students are always scoped to themselves. |
| `batchId` | Filter by task batch. |
| `status` | One of `submitted`, `reviewed`, `needs_changes`, `accepted`, `rejected`. |

### Review submission

```http
PATCH /submissions/:id/review
Authorization: Bearer <admin-token>
Content-Type: application/json
```

```json
{
  "status": "accepted",
  "notes": "Strong final submission.",
  "skillRatings": [
    {
      "skillId": 1,
      "rating": 8.5,
      "notes": "Good implementation quality."
    },
    {
      "skillId": 2,
      "rating": 7,
      "notes": "Solid deployment work."
    }
  ]
}
```

Review rules:

- `status` must be `reviewed`, `needs_changes`, `accepted`, or `rejected`.
- `rating` must be between `0` and `10`.
- Each `skillId` can appear once in a review request.
- Each `skillId` must belong to the reviewed task.
- Rating changes recompute the student's `averageRating`.

## Pagination Shape

List endpoints return `nestjs-typeorm-paginate` style responses:

```json
{
  "items": [],
  "meta": {
    "totalItems": 1,
    "itemCount": 1,
    "itemsPerPage": 10,
    "totalPages": 1,
    "currentPage": 1
  },
  "links": {
    "first": "...",
    "previous": "",
    "next": "",
    "last": "..."
  }
}
```

## Common Response Fields

Task response includes:

```json
{
  "id": 1,
  "title": "Final project",
  "type": "final",
  "batchId": 1,
  "assignedStudentId": 12,
  "deadlineAt": "2026-08-15T23:59:59.000Z",
  "requiredLinkTypes": ["github", "video"],
  "skills": [
    {
      "id": 10,
      "skillId": 1,
      "name": "React"
    }
  ],
  "createdAt": "2026-06-24T12:00:00.000Z",
  "updatedAt": "2026-06-24T12:00:00.000Z"
}
```

Submission response includes:

```json
{
  "id": 1,
  "taskId": 2,
  "studentId": 12,
  "status": "accepted",
  "notes": "Strong final submission.",
  "reviewedById": 1,
  "reviewedAt": "2026-06-24T12:00:00.000Z",
  "isLate": false,
  "links": [
    {
      "id": 1,
      "type": "github",
      "url": "https://github.com/student/final-project"
    }
  ],
  "skillRatings": [
    {
      "id": 1,
      "skillId": 1,
      "skillName": "React",
      "rating": 8.5,
      "notes": "Good implementation quality.",
      "reviewerId": 1
    }
  ],
  "createdAt": "2026-06-24T12:00:00.000Z",
  "updatedAt": "2026-06-24T12:00:00.000Z"
}
```
