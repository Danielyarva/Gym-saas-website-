# AI Coach OS — Product & Technical Specification

> Full-Stack Development Master Prompt. This is the full spec — see `CLAUDE.md` in the repo root for how to work through it phase by phase.

## 1. Product Vision

AI Coach OS is an AI-powered operating system for fitness, transformation, and personal coaches.

The platform allows coaches to:

- Manage clients
- Onboard clients
- Create workout plans
- Create nutrition plans
- Track client progress
- Monitor adherence
- Review daily check-ins
- Communicate with clients
- Use AI to analyze client progress
- Generate weekly reports
- Receive alerts when clients are at risk
- Manage subscriptions

Clients can:

- Complete onboarding
- View their workout plan
- View their nutrition plan
- Complete daily check-ins
- Track weight, measurements, steps and sleep
- Upload progress photos
- Chat with AI Coach
- Communicate with their coach
- View progress charts
- View weekly reports

The application should feel like a premium modern fitness SaaS rather than a generic CRUD application.

---

## 2. Design System

Use a premium dark UI.

Reference screenshots are in `docs/design/`. Where they conflict with the description below, the screenshots win — treat this section as a fallback for anything the references don't cover, not the source of truth.

Primary design:

- Background: near-black
- Cards: dark charcoal
- Primary accent: gold/yellow
- Positive: green
- Warning: amber
- Danger: red
- Text: white/light gray
- Secondary text: muted gray

Use:

- Rounded cards
- Soft borders
- Subtle shadows
- Glassmorphism only where appropriate
- Smooth transitions
- Clean typography
- Large readable numbers
- Minimal visual clutter
- Professional charts
- High-quality icons

The UI should be inspired by premium fitness and SaaS applications.

Do NOT make every element glow.

Avoid excessive gradients.

The design must remain practical and readable.

---

## 3. Responsive Navigation

The application must be mobile-first.

On mobile:

Use a fixed bottom navigation:

- Home
- Clients
- Plans
- Chat
- More

Also provide a hamburger menu in the top-left.

On desktop/tablet:

Use a collapsible left sidebar.

The navigation should automatically adapt based on screen width.

Bottom navigation must not cover page content.

Use safe-area padding for modern mobile devices.

---

## 4. Frontend Technology

Use:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide icons
- React Hook Form
- Zod
- Zustand
- TanStack Query
- Recharts

Use reusable components.

Create a proper component architecture.

Example:

src/
app/
components/
ui/
layout/
dashboard/
clients/
plans/
chat/
reports/
hooks/
lib/
services/
stores/
types/
schemas/

Do not put everything inside page components.

---

## 5. Backend Technology

Create a separate backend:

Node.js + Express.js + TypeScript.

Use:

- Express
- Prisma
- PostgreSQL
- Zod
- JWT
- bcrypt/argon2
- Helmet
- CORS
- Rate limiting
- Pino/Winston logging
- Swagger/OpenAPI

Structure:

backend/
src/
config/
controllers/
routes/
services/
repositories/
middleware/
schemas/
utils/
jobs/
ai/
types/
app.ts
server.ts

Use a controller → service → repository architecture.

Business logic must NOT be placed directly inside routes.

---

## 6. Database

Use PostgreSQL.

Use Prisma ORM.

Main tables:

users
coaches
clients
coach_clients
client_profiles
goals
workout_plans
workout_days
workout_exercises
exercises
nutrition_plans
nutrition_meals
nutrition_foods
daily_checkins
body_measurements
progress_photos
workout_logs
exercise_logs
sleep_logs
step_logs
client_notes
coach_messages
ai_conversations
ai_messages
ai_insights
weekly_reports
notifications
subscriptions
payments
audit_logs

Use:

- UUID primary keys
- Foreign keys
- Unique constraints
- Proper indexes
- CreatedAt
- UpdatedAt

Use database transactions where necessary.

Never store plain-text passwords.

---

## 7. Authentication

Implement:

- Register
- Login
- Logout
- Refresh token
- Forgot password
- Reset password
- Email verification
- Session management

Support roles:

COACH
CLIENT
ADMIN

Use HTTP-only secure cookies where appropriate.

Protect private routes.

Implement role-based authorization.

A coach must only be able to access their own clients.

A client must only be able to access their own information.

---

## 8. Coach Dashboard

Create the main dashboard.

Display:

Active Clients
On Track
Needs Attention
At Risk
Average Adherence
Average Progress

Example:

47 Active Clients
32 On Track
10 Needs Attention
5 At Risk

Include:

- Client progress chart
- Recent activity
- AI insights
- Recent alerts
- Upcoming tasks
- Quick actions

AI Insights example:

"5 clients need attention today."

Clicking the insight opens the affected clients.

---

## 9. Client Management

Create:

/clients

Features:

- Search
- Filter
- Sort
- Status filters
- Add client
- Archive client
- Client cards
- Client table on desktop

Client status:

ON_TRACK
NEEDS_ATTENTION
AT_RISK
INACTIVE

Each client should display:

- Profile picture
- Name
- Weight
- Goal
- Adherence
- Current status
- Last check-in

---

## 10. Client Profile

Create:

/clients/[id]

Tabs:

Overview
Plan
Progress
Chat
Notes

Overview should show:

- Current weight
- Starting weight
- Goal weight
- Body measurements
- Adherence
- Workout completion
- Nutrition adherence
- Steps
- Sleep

Include charts.

Include:

Recent activity
Recent alerts
Coach notes

Allow coach to manually add notes.

---

## 11. Client Onboarding

Create a multi-step onboarding wizard.

Steps:

1. Basic information
2. Goals
3. Body measurements
4. Training experience
5. Equipment
6. Nutrition preferences
7. Lifestyle
8. Sleep
9. Medical/safety information
10. Review

Use progress indicator.

Allow saving progress.

Do not ask for unnecessary sensitive medical information.

Any health-related feature must include appropriate safety boundaries.

---

## 12. Workout Plan Builder

Create:

/plans/workout

Coach can:

- Create plan
- Add days
- Add exercises
- Set sets
- Set reps
- Set weight
- Set rest
- Set tempo
- Add notes
- Reorder exercises
- Duplicate workouts

Exercise library:

- Exercise name
- Muscle group
- Equipment
- Difficulty
- Instructions
- Video/image reference

Client sees:

Today's workout
Exercise list
Sets
Reps
Rest timer
Completion status

Client can mark exercises complete.

---

## 13. Nutrition Plan Builder

Coach can create:

Breakfast
Lunch
Dinner
Snacks

Each meal contains:

- Food
- Quantity
- Calories
- Protein
- Carbohydrates
- Fat
- Fiber

Calculate daily totals.

Display:

Calories
Protein
Carbs
Fat
Fiber
Water

Allow coach to edit AI-generated recommendations before assigning them.

Do not allow AI to independently provide medical nutrition advice.

---

## 14. Daily Check-In

Client submits:

Weight
Workout completed
Steps
Sleep
Mood
Energy
Nutrition adherence
Notes

Use a clean mobile UI.

Example:

Weight: 82.4 kg

Workout:
Completed

Steps:
9,842

Sleep:
6.4 hours

Mood:
Good

Energy:
Good

Notes:
Optional

Submit Check-in.

---

## 15. Progress Tracking

Create:

/progress

Charts:

Weight
Waist
Chest
Arms
Body measurements
Steps
Sleep
Workout adherence
Nutrition adherence

Provide:

Weekly
Monthly
3 Months
6 Months
All Time

Include progress photos.

Allow before/after comparison.

---

## 16. AI Coach

Create an AI chat interface.

Example:

Client:

"Can I replace rice with chapati?"

AI:

"Based on your coach-approved nutrition plan, you can use chapati as an alternative. Your coach's target macros should remain the priority."

The AI must use the client's authorized context:

- Goals
- Current plan
- Recent check-ins
- Workout plan
- Nutrition plan
- Progress
- Coach notes where permitted

Do not blindly send the entire database to the AI.

Create a context-building service.

Example:

AI Context:

client profile
+
current goals
+
approved workout plan
+
approved nutrition plan
+
recent check-ins
+
recent progress
+
coach instructions

Then send only relevant context to the model.

---

## 17. AI Progress Analysis

This is a major feature.

After each check-in, analyze:

- Weight trend
- Workout adherence
- Nutrition adherence
- Sleep
- Steps
- Mood
- Missed check-ins

Generate structured insights.

Example:

{
"riskLevel": "NEEDS_ATTENTION",
"confidence": 0.87,
"insights": [
"Workout adherence decreased from 82% to 51%",
"Client missed 3 check-ins",
"Weight has remained unchanged for 3 weeks"
],
"recommendedActions": [
"Contact client",
"Review adherence",
"Review current plan"
]
}

Do not allow AI to directly modify a client's plan.

The coach must approve changes.

---

## 18. AI Risk Detection

Automatically identify:

GREEN:
Healthy adherence

YELLOW:
Needs attention

RED:
At risk

Possible triggers:

- Multiple missed check-ins
- Major adherence decline
- Sudden unusual measurement change
- Repeated skipped workouts
- Significant sleep decline
- Client disengagement

The system should explain why a client was flagged.

Avoid making medical diagnoses.

---

## 19. AI Weekly Report

Every week generate:

Overall progress
Weight change
Measurement change
Workout adherence
Nutrition adherence
Steps
Sleep
Wins
Problems
AI insights
Suggested coach actions

Example:

Overall Progress: +1.8%

Weight:
82.4 → 81.6 kg

Workout adherence:
91%

Nutrition adherence:
78%

AI Summary:

"Strong progress this week. Weight and waist decreased while workout adherence remained high."

Recommendations:

- Focus on weekend nutrition
- Maintain workout consistency
- Improve sleep

Coach can:

Edit
Approve
Send to client

---

## 20. Messaging

Implement coach-client messaging.

Features:

- Conversations
- Read/unread
- Typing indicator
- Attachments
- Notifications
- Message timestamps

Do not build real-time WebSockets initially unless necessary.

Start with REST + polling.

Later introduce Socket.IO/WebSockets.

---

## 21. Notifications

Create notification center.

Notification types:

CLIENT_CHECKIN
CLIENT_AT_RISK
MISSED_WORKOUT
WEEKLY_REPORT
NEW_MESSAGE
SUBSCRIPTION
SYSTEM

Support:

In-app notifications
Email notifications
Push notifications later

---

## 22. Hamburger Menu

The hamburger menu should contain:

Dashboard
Clients
Plans
Progress
AI Coach
Reports
Messages
Notifications
Subscription
Settings
Help & Support
Logout

Use animated drawer on mobile.

---

## 23. Settings

Create:

Profile
Account
Security
Notifications
AI Preferences
Client Preferences
Subscription
Billing
Help & Support

---

## 24. Subscription System

Implement subscription architecture.

Plans:

STARTER
PRO
BUSINESS

Limits should be configurable.

Example:

Starter:
5 clients

Pro:
25 clients

Business:
75 clients

Do not hardcode limits throughout the application.

Store plan limits in configuration/database.

Integrate Razorpay initially for India.

Design payment abstraction so Stripe can be added later.

---

## 25. API Design

Use REST APIs.

Examples:

POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout

GET /api/dashboard

GET /api/clients
POST /api/clients
GET /api/clients/:id
PATCH /api/clients/:id
DELETE /api/clients/:id

POST /api/clients/:id/checkins
GET /api/clients/:id/checkins

GET /api/clients/:id/progress

POST /api/workout-plans
GET /api/workout-plans/:id
PATCH /api/workout-plans/:id

POST /api/nutrition-plans
GET /api/nutrition-plans/:id

POST /api/ai/chat
POST /api/ai/analyze-checkin
POST /api/ai/generate-report

GET /api/reports
GET /api/reports/:id

GET /api/notifications

POST /api/messages

All endpoints must validate input using Zod.

Return consistent API responses.

Example:

{
"success": true,
"data": {},
"message": "Success"
}

Errors:

{
"success": false,
"error": {
"code": "VALIDATION_ERROR",
"message": "Invalid request"
}
}

---

## 26. Security

Implement:

- Helmet
- CORS
- Rate limiting
- Input validation
- Authentication middleware
- Authorization middleware
- Password hashing
- Secure cookies
- SQL injection protection through Prisma
- XSS protection
- File upload validation
- File size limits
- API request logging
- Audit logs

Never expose:

- Password hashes
- Refresh tokens
- API keys
- Internal system prompts
- Sensitive server configuration

Store secrets in environment variables.

---

## 27. File Uploads

Support:

Profile photos
Progress photos
Exercise media
Documents

Use Cloudinary or S3.

Never store large binary files directly in PostgreSQL.

Validate:

File type
File size
Extension

Generate secure URLs.

---

## 28. Background Jobs

Use Redis + BullMQ later for:

- Weekly report generation
- AI analysis
- Email sending
- Notifications
- Reminder jobs
- Subscription events

Do not make users wait for long AI operations.

Example:

Client submits check-in.

API immediately responds:

"Check-in submitted."

Background worker:

Analyze check-in
→ Generate insights
→ Update client status
→ Create notification

---

## 29. AI Architecture

Create an AI service abstraction.

Do NOT tightly couple the entire application to one AI provider.

Example:

AIProvider
generateText()
generateStructuredOutput()
generateEmbedding()

Then implement:

AnthropicProvider (Claude) — default, since this is built with Claude Code. Swap for OpenAIProvider first if you'd rather start there.

Later:

OpenAIProvider
GoogleAIProvider

Use structured JSON outputs whenever AI results are consumed by application logic.

Never trust raw AI output.

Validate AI output with Zod before saving it.

---

## 30. AI Cost Control

Do not send huge prompts for every request.

Implement:

- Context selection
- Summaries
- Token limits
- Caching
- Recent-data windows
- Structured prompts
- Model selection

Use cheaper models for simple classification.

Use stronger models for complex reports.

Track:

AI request count
Tokens
Estimated cost
Latency
Errors

---

## 31. Analytics

Track SaaS metrics:

- New coaches
- Active coaches
- Active clients
- Client retention
- Check-in rate
- Weekly active users
- AI usage
- Subscription conversion
- Churn

Create an admin dashboard later.

---

## 32. Testing

Frontend:

- Unit tests
- Component tests
- Playwright E2E

Backend:

- Unit tests
- Integration tests
- API tests

Test:

Authentication
Authorization
Client isolation
Plan creation
Check-ins
AI responses
Payments
Subscription limits

Security test that Coach A cannot access Coach B's clients.

---

## 33. Documentation

Create:

README.md

API documentation using Swagger/OpenAPI.

Document:

Environment variables
Database setup
Migration
Seed data
Development
Testing
Production deployment

---

## 34. Environment Variables

Use:

DATABASE_URL
JWT_SECRET
JWT_REFRESH_SECRET
AI_API_KEY
REDIS_URL
CLOUDINARY_URL
EMAIL_API_KEY
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
FRONTEND_URL
BACKEND_URL

Never commit .env files.

Create:

.env.example

---

## 35. Deployment

Frontend:

Vercel

Backend:

Render/Railway initially.

Database:

Managed PostgreSQL.

Redis:

Managed Redis.

Storage:

Cloudinary/S3.

Production should use HTTPS.

Configure:

CORS
Environment variables
Logging
Error monitoring
Database migrations

---

## 36. Development Phases

DO NOT attempt to build everything simultaneously.

Phase 1:
Authentication
Coach dashboard
Client management
Client profile

Phase 2:
Onboarding
Workout plans
Nutrition plans
Daily check-ins

Phase 3:
Progress tracking
Charts
Progress photos
Weekly reports

Phase 4:
AI Coach
AI check-in analysis
AI insights
AI weekly reports

Phase 5:
Messaging
Notifications

Phase 6:
Subscriptions
Payments

Phase 7:
Redis
Background jobs
Push notifications

Phase 8:
Analytics
Admin panel
Performance optimization

---

## 37. Critical Product Rule

The coach must remain in control.

AI can:

- Analyze
- Recommend
- Summarize
- Detect patterns
- Draft messages
- Generate reports

AI should NOT automatically:

- Diagnose medical conditions
- Change treatment
- Make unsafe health claims
- Change coach-approved plans without approval
- Make autonomous high-impact decisions

For potentially concerning health information, direct the user toward appropriate professional care.

---

## 38. UX Requirements

Every page must have:

- Loading state
- Empty state
- Error state
- Success feedback
- Skeleton loading where appropriate
- Responsive layout

Never show a blank page while data loads.

Use toast notifications for successful actions.

Use confirmation dialogs for destructive actions.

Forms must show inline validation.

---

## 39. Final UI Requirements

The final application should visually match a premium AI fitness SaaS.

Mobile:

Hamburger menu
+
Top header
+
Content
+
Fixed bottom navigation

Desktop:

Left sidebar
+
Top header
+
Main content

Use consistent:

Spacing
Typography
Buttons
Cards
Icons
Charts
Status badges
Forms
Modals
Drawers

The UI should closely match the reference screenshots in `docs/design/` (see §2).

Do not copy branding or assets from existing products.

---

## 40. Coding Rules

Write clean production-quality TypeScript.

Avoid:

- any
- duplicated business logic
- giant components
- hardcoded data
- hardcoded API URLs
- database queries inside UI components
- secrets in source code
- unnecessary dependencies

Use reusable components.

Use environment variables.

Use TypeScript interfaces/types.

Use Zod schemas for runtime validation.

Use Prisma migrations.

Use meaningful error messages.

Use proper HTTP status codes.

Write comments only where they add meaningful context.

---

## 41. Implementation Instructions

Start by generating:

1. Complete architecture
2. Folder structure
3. Database schema
4. Prisma schema
5. API specification
6. Authentication architecture
7. Frontend routing structure
8. Component architecture
9. AI architecture

Then implement the application incrementally.

Do NOT generate thousands of lines of code in one response.

For every phase:

1. Explain what is being built
2. Create the required files
3. Provide complete code
4. Explain where each file belongs
5. Provide installation commands
6. Provide database migration commands
7. Provide test instructions
8. Verify integration with the previous phase

The application must remain runnable after every phase.

Prioritize a working MVP over unnecessary complexity.

The final goal is a SaaS product that can be deployed and used by real fitness/transformation coaches.
