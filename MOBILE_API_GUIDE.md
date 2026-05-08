# Mobile API Guide

This guide documents the backend routes currently implemented in Zendo for a mobile frontend.

It covers:
- authentication routes and auth model
- task CRUD
- chat endpoints and current chat limitations
- goals CRUD
- goal detail and goal history data flow
- how task history works

## 1. Authentication Model

Zendo currently uses two auth patterns:

1. Auth0 web session
   - used by the web app
   - available through Auth0 middleware routes like `/auth/login`

2. Bearer token auth
   - used by mobile clients against most `/api/app/*` routes
   - send `Authorization: Bearer <access_token>`

### Important mobile auth note

Most `/api/app/*` routes in this guide accept Bearer auth by validating the Auth0 JWT.

However, `POST /api/app/chat/messages` only generates an AI reply when there is a web Auth0 session. With Bearer-only mobile auth, the route still accepts and stores the message, but it does not run the OpenAI reply path.

## 2. Authentication Endpoints

### 2.1 Auth0 middleware routes

These are not implemented under `src/app/api`, but they are part of the live auth surface used by the app:

- `GET /auth/login`
  - starts Auth0 login flow
- `GET /auth/signup`
  - starts Auth0 signup flow
- `GET /auth/logout`
  - logs user out
- `GET /auth/callback`
  - Auth0 callback route
- `GET /auth/profile`
  - Auth0 profile route

Use these if your mobile flow opens browser-based Auth0 login.

### 2.2 Current session user

`GET /api/auth/me`

Purpose:
- check the current web session user

Auth:
- session-based
- not useful for Bearer-only mobile auth validation

Response:

```json
{
  "user": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "picture": "https://..."
  }
}
```

If no session exists:

```json
{
  "user": null
}
```

### 2.3 Register auth source

`POST /api/app/auth/source`

Purpose:
- records the auth user and inferred client source
- useful after mobile sign-in so the backend can associate the auth user record

Auth:
- Auth0 session or Bearer token

Request body:
- no body required

Response:

```json
{
  "ok": true,
  "source": "mobile"
}
```

## 3. Common Mobile Headers

For mobile requests to `/api/app/*`, use:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Recommended client behavior:
- on `401`, force token refresh or sign-in again
- use `cache: no-store` for task/chat/history reads where freshness matters

## 4. Tasks API

Base route: ` /api/app/tasks `

Supports full CRUD plus reorder and batch updates.

## 4.1 Fetch tasks

`GET /api/app/tasks`

Auth:
- session or Bearer

Query params:
- `format=mobile`
- `view=active|completed|all`
- `includeGoal=1`
- `archived=1`
- `includeArchived=1`

Recommended mobile request:

```http
GET /api/app/tasks?format=mobile&view=all&includeGoal=1
```

Mobile response shape:

```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Deep work block",
      "position": 3,
      "completed": false,
      "status": "todo",
      "dueDate": "2026-02-20T10:00:00Z",
      "completedAt": null,
      "goal": {
        "id": "goal-uuid",
        "title": "Ship weekly outcome"
      },
      "user_id": "self",
      "createdAt": "2026-02-20T08:00:00Z",
      "startDate": "2026-02-20",
      "dueDateOnly": "2026-02-20",
      "startAt": null,
      "dueAt": "2026-02-20T10:00:00Z"
    }
  ]
}
```

Server behavior:
- excludes archived tasks by default
- excludes soft-deleted tasks when schema supports `deleted`
- `view=active` excludes `done`
- `view=completed` returns only `done`
- `archived=1` returns archived tasks only
- `includeGoal=1` attaches goal title info
- `format=mobile` converts DB rows into a mobile-friendly shape

Frontend grouping rules:
- active tasks: `status !== "done" && status !== "archived"`
- completed tasks: `status === "done"`
- active sort: `position ASC`, then created time
- completed sort: `completedAt DESC`

## 4.2 Create task

`POST /api/app/tasks`

Request body:

```json
{
  "title": "Task title",
  "goalId": "uuid or null",
  "startDate": "2026-02-20",
  "dueDate": "2026-02-28",
  "startAt": "2026-02-20T09:00:00Z",
  "dueAt": "2026-02-28T14:00:00Z",
  "position": 3
}
```

Rules:
- `title` is required
- `goalId`, date fields, and time fields are optional
- if `position` is omitted, server puts the task at the end of the active list

Response:

```json
{
  "task": {
    "id": "uuid",
    "title": "Task title",
    "goal_id": "uuid",
    "status": "todo",
    "position": 3,
    "start_date": "2026-02-20",
    "due_date": "2026-02-28",
    "start_at": "2026-02-20T09:00:00Z",
    "due_at": "2026-02-28T14:00:00Z",
    "completed_at": null,
    "created_at": "2026-02-20T08:00:00Z"
  }
}
```

Server side effects:
- inserts task with `status: "todo"`
- records `last_updated_via` and `last_updated_by` when available
- logs a system chat event for `task_created`

## 4.3 Update a single task

`PATCH /api/app/tasks`

Request body:

```json
{
  "taskId": "uuid",
  "title": "Updated title",
  "goalId": "uuid or null",
  "startDate": "2026-02-20 or null",
  "dueDate": "2026-02-28 or null",
  "startAt": "2026-02-20T09:00:00Z or null",
  "dueAt": "2026-02-28T14:00:00Z or null",
  "position": 5,
  "status": "todo|in_progress|done|archived",
  "completed": true,
  "archived": false
}
```

Supported update semantics:
- `completed: true` sets `status = "done"`
- `completed: false` sets `status = "todo"`
- `status: "completed"` is normalized to `done` for back-compat
- `archived: true` archives the task
- `archived: false` unarchives the task and restores it as `todo`

Important completion behavior:
- transition into `done` sets `completed_at`
- transition out of `done` clears `completed_at`
- when changing from `done` to `todo` without an explicit `position`, the server moves the task to the bottom of the active list
- server normalizes active task positions after done/non-done transitions

Response:

```json
{
  "task": {
    "id": "uuid",
    "title": "Updated title",
    "status": "done",
    "completed_at": "2026-02-20T11:00:00.000Z"
  }
}
```

Server side effects:
- logs `task_started` when status changes to `in_progress`
- logs `task_completed` when status changes to `done`

## 4.4 Reorder active tasks

`PATCH /api/app/tasks`

Request body:

```json
{
  "reorder": {
    "activeTaskIds": ["id1", "id2", "id3"]
  }
}
```

Behavior:
- only reorders active tasks
- ignores `done` and `archived` tasks in the supplied list
- normalizes positions after reorder

Response:

```json
{
  "ok": true,
  "reordered": 3
}
```

Frontend recommendation:
- reorder optimistically in memory
- call the endpoint only when drag ends
- rollback on failure

## 4.5 Batch update tasks

`PATCH /api/app/tasks`

Request body:

```json
{
  "updates": [
    {
      "taskId": "uuid",
      "position": 1,
      "startDate": "2026-02-20",
      "dueDate": "2026-02-28",
      "startAt": null,
      "dueAt": null
    }
  ]
}
```

Use this for:
- bulk position updates
- bulk date/time edits

Response:

```json
{
  "ok": true
}
```

## 4.6 Delete task

`DELETE /api/app/tasks`

Request body:

```json
{
  "taskId": "uuid"
}
```

Behavior:
- prefers soft delete: `deleted = true`, `archived = true`, `status = "archived"`
- falls back to hard delete on older schemas without delete/archive columns

Response:

```json
{
  "ok": true
}
```

## 4.7 Archived tasks

Fetch archived tasks:

```http
GET /api/app/tasks?archived=1
```

Unarchive a task:

```json
{
  "taskId": "uuid",
  "archived": false
}
```

Unarchive behavior:
- task is restored with `status = "todo"`
- not restored to `done` or `in_progress`

## 5. Chat API

Base route: ` /api/app/chat/messages `

Current state:
- read and create are implemented
- update and delete are not implemented
- unread/read state is handled by a separate route
- chat task-activity visibility is handled by a separate route

## 5.1 Fetch chat messages

`GET /api/app/chat/messages`

Auth:
- session or Bearer

Response:

```json
{
  "messages": [
    {
      "id": "uuid",
      "content": "How are things going today?",
      "sender": "ai",
      "created_at": "2026-02-20T08:00:00Z",
      "timestamp": "08:00 AM"
    }
  ]
}
```

Notes:
- system welcome splash messages are filtered out
- `assistant` rows are normalized to `ai` in the response

## 5.2 Create chat message

`POST /api/app/chat/messages`

Request body:

```json
{
  "content": "Remind me to send the proposal at 4 PM",
  "sender": "user",
  "generateAi": true
}
```

Fields:
- `content` is required
- `sender` must be `user`, `ai`, or `system`
- `generateAi` defaults to `true`

Possible responses:

1. Standard stored message only:

```json
{
  "message": {
    "id": "uuid",
    "content": "Hello",
    "sender": "user",
    "created_at": "2026-02-20T08:00:00Z",
    "timestamp": "08:00 AM"
  }
}
```

2. Auto-created task flow returns multiple messages:

```json
{
  "messages": [
    { "id": "u1", "sender": "user", "content": "Remind me to send the proposal" },
    { "id": "s1", "sender": "system", "content": "{...user_action...}" },
    { "id": "a1", "sender": "ai", "content": "Added to your tasks: send the proposal" }
  ]
}
```

Behavior:
- stores the incoming chat message
- can auto-create tasks from qualifying user messages
- can insert system `user_action` events into chat history
- can generate AI chat replies only when a web Auth0 session exists

Important mobile limitation:
- Bearer-only mobile requests are authorized, but they do not enter the OpenAI chat generation path because that path currently requires a web session

## 5.3 Chat read receipts

### Get latest chat read marker

`GET /api/app/chat/read`

Response:

```json
{
  "lastChatReadAt": "2026-02-20T10:30:00.000Z"
}
```

### Update latest chat read marker

`POST /api/app/chat/read`

Request body:

```json
{
  "latestMs": 1771583400000
}
```

or:

```json
{
  "latestAt": "2026-02-20T10:30:00.000Z"
}
```

Behavior:
- server stores the latest read timestamp in `settings.last_chat_read_at`
- server only moves the read timestamp forward, never backward

Response:

```json
{
  "ok": true,
  "lastChatReadAt": "2026-02-20T10:30:00.000Z"
}
```

## 5.4 Chat activity visibility

This controls whether task activity system events should be shown in chat.

### Read setting

`GET /api/app/chat/activity`

Response:

```json
{
  "enabled": true
}
```

### Update setting

`POST /api/app/chat/activity`

Request body:

```json
{
  "enabled": true
}
```

Response:

```json
{
  "enabled": true
}
```

## 5.5 Chat CRUD status

- Create: implemented via `POST /api/app/chat/messages`
- Read: implemented via `GET /api/app/chat/messages`
- Update: implemented via `PATCH /api/app/chat/messages/:messageId`
- Delete: implemented via `DELETE /api/app/chat/messages/:messageId`

## 5.6 Chat message detail routes

### Get one message

`GET /api/app/chat/messages/:messageId`

Response:

```json
{
  "message": {
    "id": "uuid",
    "content": "Hello",
    "sender": "user",
    "created_at": "2026-02-20T08:00:00Z",
    "timestamp": "08:00 AM"
  }
}
```

### Edit one message

`PATCH /api/app/chat/messages/:messageId`

Request body:

```json
{
  "content": "Updated message text"
}
```

Rules:
- only user-authored messages can be edited
- AI messages and system messages are not editable

Response:

```json
{
  "message": {
    "id": "uuid",
    "content": "Updated message text",
    "sender": "user",
    "created_at": "2026-02-20T08:00:00Z",
    "timestamp": "08:00 AM"
  }
}
```

### Delete one message

`DELETE /api/app/chat/messages/:messageId`

Rules:
- system messages cannot be deleted
- user and AI messages can be deleted

Response:

```json
{
  "ok": true,
  "deletedId": "uuid"
}
```

## 6. Goals API

Base route: ` /api/app/goals `

Goals have full CRUD support.

## 6.1 Fetch goals

`GET /api/app/goals`

Auth:
- session or Bearer

Response:

```json
{
  "goals": [
    {
      "id": "uuid",
      "title": "Ship weekly outcome",
      "status": "active",
      "created_at": "2026-02-20T08:00:00Z",
      "position": 1,
      "metric_text": "I can show proof of progress each week",
      "metric_frequency": "weekly",
      "metric_rules": [
        {
          "id": "rule-uuid",
          "goal_id": "uuid",
          "metric_text": "I can show proof of progress each week",
          "metric_frequency": "weekly",
          "position": 1,
          "created_at": "2026-02-20T08:00:00Z"
        }
      ]
    }
  ]
}
```

Behavior:
- ordered by `position ASC`, then `created_at DESC`
- attempts to attach `metric_rules` from `goal_metric_rules`

## 6.2 Create goal

`POST /api/app/goals`

Request body:

```json
{
  "title": "Run a stronger weekly operating rhythm"
}
```

Rules:
- `title` is required
- server assigns the next position when possible

Response:

```json
{
  "goal": {
    "id": "uuid",
    "title": "Run a stronger weekly operating rhythm",
    "status": "active",
    "created_at": "2026-02-20T08:00:00Z",
    "position": 4,
    "metric_text": "I can show proof of progress toward this goal",
    "metric_frequency": "weekly"
  }
}
```

Server side effects:
- logs a `goal_created` system event in chat
- may generate a default metric suggestion
- may create the first `goal_metric_rules` row

## 6.3 Update goal

`PATCH /api/app/goals`

### A. Update a single goal

Request body:

```json
{
  "goalId": "uuid",
  "title": "Updated title",
  "status": "active|paused|archived",
  "position": 2,
  "metricText": "I can show proof of progress every week",
  "metricFrequency": "weekly"
}
```

Response:

```json
{
  "goal": {
    "id": "uuid",
    "title": "Updated title",
    "status": "active",
    "metric_text": "I can show proof of progress every week",
    "metric_frequency": "weekly"
  }
}
```

### B. Reorder goals

Request body:

```json
{
  "updates": [
    { "goalId": "id1", "position": 1 },
    { "goalId": "id2", "position": 2 }
  ]
}
```

Response:

```json
{
  "ok": true
}
```

### C. Manage metric rules

Add a rule:

```json
{
  "goalId": "uuid",
  "metricRule": {
    "metricText": "I can show a shipped deliverable every week",
    "metricFrequency": "weekly"
  }
}
```

Update a rule:

```json
{
  "goalId": "uuid",
  "metricRule": {
    "id": "rule-uuid",
    "metricText": "I can show a shipped deliverable every week",
    "metricFrequency": "weekly"
  }
}
```

Delete a rule:

```json
{
  "goalId": "uuid",
  "deleteMetricRuleId": "rule-uuid"
}
```

Behavior:
- keeps goal-level `metric_text` and `metric_frequency` synchronized with the primary rule
- if primary rule is deleted, next rule is promoted

## 6.4 Delete goal

`DELETE /api/app/goals`

Request body:

```json
{
  "goalId": "uuid"
}
```

Response:

```json
{
  "ok": true
}
```

## 6.5 Legacy goal create route

There is also a legacy helper route:

- `POST /api/app/goal`

Request body:

```json
{
  "title": "Goal title"
}
```

Recommendation:
- prefer `POST /api/app/goals` for new mobile work

## 6.6 Goal detail routes

### Get one goal

`GET /api/app/goals/:goalId`

Response:

```json
{
  "goal": {
    "id": "uuid",
    "title": "Ship weekly outcome",
    "status": "active",
    "created_at": "2026-02-20T08:00:00Z",
    "position": 1,
    "metric_text": "I can show proof of progress each week",
    "metric_frequency": "weekly",
    "metric_rules": []
  }
}
```

Optional query:
- `includeTasks=1`

With tasks included:

```json
{
  "goal": { "id": "uuid", "title": "Ship weekly outcome" },
  "tasks": [
    {
      "id": "task-uuid",
      "title": "Ship the billing fix",
      "goal_id": "uuid",
      "status": "todo",
      "position": 1,
      "created_at": "2026-02-20T08:00:00Z"
    }
  ]
}
```

### Update one goal

`PATCH /api/app/goals/:goalId`

Request body matches the single-goal body used by `PATCH /api/app/goals`:

```json
{
  "title": "Updated title",
  "status": "active",
  "position": 2,
  "metricText": "I can show proof of progress every week",
  "metricFrequency": "weekly"
}
```

Metric-rule operations are also supported on the detail route:

```json
{
  "metricRule": {
    "metricText": "I can ship one meaningful deliverable every week",
    "metricFrequency": "weekly"
  }
}
```

or:

```json
{
  "deleteMetricRuleId": "rule-uuid"
}
```

### Delete one goal

`DELETE /api/app/goals/:goalId`

Response:

```json
{
  "ok": true,
  "deletedId": "uuid"
}
```

## 7. Goal Detail API Strategy

Goal detail can now be built in two valid ways:

1. Direct detail route
  - `GET /api/app/goals/:goalId`
  - or `GET /api/app/goals/:goalId?includeTasks=1`
2. Composed route strategy
  - `GET /api/app/goals`
  - `GET /api/app/tasks?format=mobile&view=all&includeGoal=1`
  - `GET /api/app/goals/history?goalId=<goalId>`

Recommended mobile strategy:
- use `GET /api/app/goals/:goalId?includeTasks=1` for the initial goal detail screen payload
- use `GET /api/app/goals/history?goalId=<goalId>` for the punchcard/history overlay

## 8. Goal History Endpoint

`GET /api/app/goals/history?goalId=<goalId>`

Auth:
- currently session-based in the route implementation

Required query param:
- `goalId`

Response:

```json
{
  "timezone": "Africa/Lagos",
  "today": "2026-02-20",
  "windowStart": "2026-02-01",
  "windowEnd": "2026-04-30",
  "days": [
    {
      "date": "2026-02-20",
      "status": "none",
      "completedTasks": 2,
      "tasksDue": 3,
      "tasksDone": 2
    }
  ],
  "createdAt": "2026-02-01T08:00:00Z",
  "createdDay": "2026-02-01",
  "completedTasksLast30Days": 11
}
```

What it gives you:
- a full current-month plus next-two-months day grid
- completed task counts per day for a goal
- due task counts per day for a goal
- done-due-task counts per day for a goal
- total completed tasks in the last 30 days

Frontend usage:
- use `days` to render the goal punchcard/calendar
- use `createdDay` as the tracking start marker
- use `completedTasksLast30Days` for summary stats

## 9. How Task History Works

This is the part the mobile frontend needs to get right.

## 9.1 Source of truth

Task history is not stored in a separate task history table.

It is derived from:
- `tasks.completed_at`
- `tasks.status`
- `tasks.goal_id`
- system events written into `chat_messages`

## 9.2 What happens when a task is completed

When the client sends:

```json
{
  "taskId": "uuid",
  "completed": true
}
```

the backend:
- sets `status = "done"`
- sets `completed_at = now()`
- normalizes positions if needed
- logs a `task_completed` system event into chat history

That means a task completion appears in two places:

1. On the task row itself via `completed_at`
2. In chat as a system event

## 9.3 What happens when a task is uncompleted

When the client sends:

```json
{
  "taskId": "uuid",
  "completed": false
}
```

the backend:
- sets `status = "todo"`
- clears `completed_at`
- moves the task to the bottom of the active list if no position is supplied

Important consequence:
- goal history and task completion history rely on `completed_at`
- uncompleting a task removes that completion timestamp from the live task row
- if the task is completed again later, a new `completed_at` timestamp is written

## 9.4 Chat system events for task history

The backend writes structured JSON events into `chat_messages` for:
- `task_created`
- `task_started`
- `task_completed`
- `goal_created`

Example system event payload:

```json
{
  "kind": "user_action",
  "metaId": "ua_task_completed_uuid_123",
  "timestamp": "10:42 AM",
  "action": "task_completed",
  "taskId": "task-uuid",
  "taskTitle": "Send proposal",
  "goalId": "goal-uuid",
  "text": "Send proposal"
}
```

Use this for:
- chat activity feed
- human-readable recent activity

Do not use it as the only source of truth for done state.

## 9.5 Goal history calculations

`GET /api/app/goals/history` calculates history from tasks using:
- `goal_id`
- `completed_at`
- `due_date`
- `status`
- user timezone from settings

The route:
- groups completed tasks by local day using `completed_at`
- groups due tasks by `due_date`
- counts how many due tasks are already `done`

Timezone behavior:
- timestamps are stored in UTC
- the history route converts task completion timestamps into the user timezone before grouping by day

## 9.6 Day detail drill-down

Current UI behavior for a goal history day drill-down is:

1. call `GET /api/app/tasks`
2. filter tasks client-side by `goal_id`
3. filter again by `completed_at.slice(0, 10) === selectedDay`

For mobile, a cleaner implementation is:
- fetch all tasks once
- keep them in local state
- derive day details client-side from `completedAt` and goal id

## 9.7 Archived and deleted task effects on history

Current backend behavior matters here:
- task list reads usually hide archived and soft-deleted tasks
- goal history counts completed tasks from the tasks table using `completed_at`
- due-task counts in goal history only consider statuses `todo`, `in_progress`, and `done`

Practical implication:
- archived or deleted tasks may disappear from task list UIs
- but past completion history can still remain visible if the underlying row still has `completed_at`

## 9.8 Recommended mobile state model for history

Recommended local state:

```ts
type MobileTaskStore = {
  tasksById: Record<string, Task>;
  activeTaskIds: string[];
  completedTaskIds: string[];
  archivedTaskIds: string[];
  lastChatReadAt: string | null;
  goalsById: Record<string, Goal>;
  goalHistoryByGoalId: Record<string, GoalHistoryResponse>;
};
```

Recommended optimistic rules:
- on complete: move task into completed list immediately and set local `completedAt`
- on uncomplete: move task into active list immediately and clear local `completedAt`
- on failure: revert local state fully

## 10. Additional Backend Endpoints

These routes exist in the backend and are relevant for broader mobile functionality.

## 10.1 Onboarding

### Get onboarding completion state

`GET /api/app/onboarding`

Auth:
- session only

Response:

```json
{
  "onboardingCompletedAt": "2026-02-20T08:00:00.000Z"
}
```

Notes:
- onboarding is considered complete if the user already has at least one goal
- route may return `200` with `warning` instead of failing hard on settings issues

### Set onboarding completion state

`POST /api/app/onboarding`

Request body:

```json
{
  "completedAt": "2026-02-20T08:00:00.000Z"
}
```

Response:

```json
{
  "ok": true,
  "onboardingCompletedAt": "2026-02-20T08:00:00.000Z"
}
```

## 10.2 Settings

### Get settings

`GET /api/app/settings`

Auth:
- session or Bearer

Response:

```json
{
  "prefs": {
    "afternoon": true,
    "evening": true
  },
  "timezone": "Africa/Lagos",
  "goalsAdvancedView": false,
  "enabledFlags": {
    "followup_email": true,
    "afternoon": true,
    "evening": true,
    "goals_advanced_view": false
  }
}
```

### Update settings

`PATCH /api/app/settings`

Request body:

```json
{
  "afternoon": true,
  "evening": true,
  "timezone": "Africa/Lagos",
  "goalsAdvancedView": true
}
```

## 10.3 Goal share links

`POST /api/app/goals/share`

Auth:
- session only

Request body:

```json
{
  "goalId": "uuid"
}
```

Response:

```json
{
  "url": "https://zendo.cc/shared/goal/token"
}
```

## 10.4 Push registration

### Register device

`POST /api/app/push/register`

Auth:
- session or Bearer

Request body:

```json
{
  "expoPushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

Response:

```json
{
  "ok": true
}
```

### Unregister device

`POST /api/app/push/unregister`

Request body:

```json
{
  "expoPushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

Response:

```json
{
  "ok": true
}
```

## 10.5 Follow-up email notifications

`POST /api/app/notifications/followup-email`

Auth:
- session or Bearer

Request body:

```json
{
  "kind": "morning",
  "event": {
    "kind": "morning_prompt",
    "timestamp": "08:00 AM",
    "goals": []
  }
}
```

Typical responses:

```json
{
  "ok": true,
  "sent": true
}
```

or:

```json
{
  "ok": true,
  "skipped": "disabled"
}
```

## 10.6 Task import

`POST /api/app/tasks/import/todoist`

Auth:
- session only

Request body:

```json
{
  "tasks": [
    {
      "title": "Imported task",
      "start_date": "2026-02-20",
      "due_date": "2026-02-28"
    }
  ]
}
```

Response:

```json
{
  "inserted": 1
}
```

## 10.7 AI credits and usage

### Credits

`GET /api/app/ai/credits`

Auth:
- session only

Response:

```json
{
  "credits": {
    "plan": "free",
    "limit": 50000,
    "used": 12000,
    "remaining": 38000,
    "periodStart": "2026-02-01"
  },
  "transcription": {
    "limitCents": 300,
    "usedCents": 0,
    "remainingCents": 300,
    "periodStart": "2026-02-01",
    "exhausted": false
  }
}
```

### Usage

`GET /api/app/ai/usage`

Response:

```json
{
  "periodStart": "2026-02-01",
  "plan": "free",
  "promptTokensTotal": 12000,
  "totalTokens": 16500
}
```

## 10.8 AI task prioritization

`POST /api/app/ai/prioritize`

Auth:
- session or Bearer

Request body:

```json
{
  "goalId": "uuid or null"
}
```

Response:

```json
{
  "goal": { "id": "all", "title": "All goals" },
  "tasks": [],
  "orderedTaskIds": [],
  "rationale": "short explanation",
  "usage": {
    "promptTokens": 0,
    "completionTokens": 0,
    "totalTokens": 0,
    "promptTokensTotal": 0
  }
}
```

## 10.9 AI task breakdown

`POST /api/app/ai/breakdown-task`

Auth:
- session or Bearer

Request body:

```json
{
  "goalTitle": "Ship weekly outcome",
  "taskTitle": "Design homepage",
  "existingTaskTitles": ["Fix header"]
}
```

Notes:
- returns suggestions only
- client still needs to create tasks via `POST /api/app/tasks`

## 10.10 Other AI helper routes

The following routes exist and are currently more session-oriented than mobile-oriented:

- `POST /api/app/ai/suggest-tasks`
  - body: `{ goalTitle: string }`
- `POST /api/app/ai/suggest-metrics`
  - body: `{ goalTitle: string }`
- `POST /api/app/ai/goal-progress-summary`
  - body: `{ items: [...] }`
- `POST /api/app/ai/parse-evening-follow-up`
  - body: `{ text: string, goalTitle?: string | null }`
- `POST /api/app/ai/followup-suggestions`
  - body: `{ variant?: "morning" | "evening", goals?: [], tasks?: [], acceptedSuggestions?: [] }`
- `POST /api/app/ai/transcribe`
  - body: `multipart/form-data` with an audio file
- `POST /api/app/suggestions/metric`
  - body: `{ goalTitle: string }`

Important caveat:
- most of these helper routes are still session-only today
- the two AI routes that are already mobile-safe with Bearer auth are `POST /api/app/ai/prioritize` and `POST /api/app/ai/breakdown-task`

## 11. What Is Not Implemented Yet

These are useful to know so the frontend does not assume they exist:

- no dedicated task history endpoint
- no dedicated day-detail history endpoint for goal history drill-down

## 12. Recommended Mobile Endpoint Set

If you want the smallest stable set for the mobile app, use these routes:

- auth bootstrap: `POST /api/app/auth/source`
- current web session check: `GET /api/auth/me`
- fetch tasks: `GET /api/app/tasks?format=mobile&view=all&includeGoal=1`
- create task: `POST /api/app/tasks`
- update task: `PATCH /api/app/tasks`
- delete task: `DELETE /api/app/tasks`
- fetch archived tasks: `GET /api/app/tasks?archived=1`
- fetch chat: `GET /api/app/chat/messages`
- send chat message: `POST /api/app/chat/messages`
- fetch one chat message: `GET /api/app/chat/messages/:messageId`
- update one chat message: `PATCH /api/app/chat/messages/:messageId`
- delete one chat message: `DELETE /api/app/chat/messages/:messageId`
- get chat read marker: `GET /api/app/chat/read`
- set chat read marker: `POST /api/app/chat/read`
- get chat activity setting: `GET /api/app/chat/activity`
- set chat activity setting: `POST /api/app/chat/activity`
- fetch goals: `GET /api/app/goals`
- fetch goal detail: `GET /api/app/goals/:goalId`
- fetch goal detail with tasks: `GET /api/app/goals/:goalId?includeTasks=1`
- create goal: `POST /api/app/goals`
- update goal: `PATCH /api/app/goals`
- delete goal: `DELETE /api/app/goals`
- update one goal: `PATCH /api/app/goals/:goalId`
- delete one goal: `DELETE /api/app/goals/:goalId`
- fetch goal history: `GET /api/app/goals/history?goalId=<goalId>`

## 13. Mobile Implementation Notes

- use Bearer auth for `/api/app/*` endpoints unless you are embedded in the web session flow
- treat task completion as a state transition, not just a checkbox toggle
- render completed tasks from `status === "done"`, not only from `completed === true`
- use `completedAt` for ordering completed tasks
- store read receipts separately from chat messages
- build goal detail from goal list + task list + goal history, because there is no dedicated goal detail endpoint

---

zendo.cc