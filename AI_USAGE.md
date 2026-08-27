# AI Usage Documentation

This document outlines how AI was utilized during the development of this backend service, fulfilling the requirement for transparent and responsible AI usage.

## 1. AI Tools Used
*   **Google Gemini:** Used primarily as an architectural sounding board, schema validator, and boilerplate generator.

## 2. Prompts Given
Instead of asking the AI to "write the assignment," I used it iteratively to discuss architecture and edge cases. Key prompts included:
*   *"What is the actual problem they want me to solve? Is this a standard quiz or a chat platform?"* (To define the mental model of a stateful directed graph).
*   *"How should I structure the relational database tables to handle the modules, questions, options, history, and state?"*
*   *"Can you give me the perfect tech stack to build this? JS or Python based."*
*   *"Why use Redis for active state? Won't it fail to store the active state permanently if the cache expires, breaking the deep-link requirement?"*
*   *"Why are you calling it a UserSession? A session is considered the duration the time a user is logged in."*
*   *"Provide a backend master prompt so I can generate the Express controller boilerplate for the specific Prisma schema we agreed on."*

## 3. What I Modified from AI Output
*   **Storage Architecture (Dropping Redis):** The AI initially recommended using Redis to store the user's active `breadcrumbTrail` (for the "Go Back" bonus feature). I rejected this because the assignment requires handling "old deep links or notifications." If the Redis cache expires, that state is lost, and the deep link fails. I forced the architecture to use a durable PostgreSQL `FlowState` table with a JSONB column instead.
*   **Naming Conventions:** The AI suggested naming the state table `UserSession`. I modified this to `FlowState` because "session" implies a temporary authentication token, whereas this table tracks durable traversal context.
*   **UI/UX Logic:** The AI suggested adding a "Restart Flow" button at the end of the frontend flow. I removed this because the assignment explicitly requires the system to defensively block "returning to a previously visited module."

## 4. What AI Got Wrong
*   **The Mental Model:** Early in the brainstorming phase, the AI oversimplified the problem by comparing it to a standard "quiz." It missed the nuance that a standard quiz is linear, whereas this assignment requires a graph where options dictate dynamic cross-module routing. I had to explicitly redirect the AI to focus on the "Bonus" requirement and the "Checkpoint" logic to get it to understand the strict separation between immutable history and mutable session state.
*   **Over-engineering Auth:** The AI started suggesting JWTs and password hashing for user management. I had to correct its course to keep the focus strictly on the core logic evaluation, opting for a simulated `x-user-email` header approach instead to keep the reviewer's testing process frictionless.

## 5. How I Verified Correctness
*   **Database Constraints:** I did not blindly trust the AI's ORM logic. I verified the Prisma schema manually to ensure that `nextQuestionId` was mapped as a strict database-level relation. This guarantees the backend defensively handles "broken question references" by throwing a foreign-key error at the database level if an option points to a non-existent question.
*   **State vs. History Separation Testing:** I verified the core logic by manually querying the database during flow traversal. I confirmed that submitting an answer triggers an `INSERT` into `FlowHistory` (which never shrinks) and an `UPDATE` to the `FlowState.breadcrumbTrail` array.
*   **Checkpoint Verification:** I wrote specific seed data (simulating a Wysa mental health triage flow) where certain nodes had `isCheckpoint = true`. I verified that when passing these nodes, the backend successfully wiped the `breadcrumbTrail` array, correctly triggering a `400 Bad Request` if the user subsequently attempted to hit the `POST /api/flow/back` endpoint.
*   **Stale Deep-Link Testing:** I tested the `GET /api/flow/questions/:questionId` endpoint by passing a UUID that existed in my `FlowHistory` but did not match my current `FlowState.currentQuestionId`. I verified the API correctly caught the mismatch and returned the current valid state instead of the stale requested state.