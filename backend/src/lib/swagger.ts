import swaggerJsdoc from 'swagger-jsdoc'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wysa — Modular Conversation Flow API',
      version: '1.0.0',
      description: `
A backend service that powers a **modular conversation flow system** (automated support bot / dynamic survey).

## Authentication
1. First, call \`POST /api/auth/login\` with the user's email to create or retrieve the user.
2. Then, pass the \`x-user-email\` header on all subsequent requests.

This two-step approach guarantees the user exists in the database before any flow operations are attempted.

## How the flow works
1. **Login** → create/find user
2. **Start** a module → get the first question
3. **Answer** questions → engine routes you through the graph
4. **Back** to undo a step (blocked at checkpoints)
5. **History** to replay the full conversation ledger
      `.trim(),
      contact: { name: 'Wysa Assignment' },
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local dev server' },
    ],
    components: {
      securitySchemes: {
        userEmail: {
          type: 'apiKey',
          in: 'header',
          name: 'x-user-email',
          description: 'User email address (auto-creates user if new)',
        },
      },
      schemas: {
        // ── Core entities ──────────────────────────────────────────────────
        Option: {
          type: 'object',
          properties: {
            id:             { type: 'string', format: 'uuid' },
            text:           { type: 'string', example: '🟢 Feeling good!' },
            nextQuestionId: { type: 'string', format: 'uuid', nullable: true, description: 'null means end of flow' },
          },
        },
        Question: {
          type: 'object',
          properties: {
            id:           { type: 'string', format: 'uuid' },
            moduleId:     { type: 'string', format: 'uuid' },
            text:         { type: 'string', example: 'How would you describe your mood?' },
            isCheckpoint: { type: 'boolean', description: 'Wipes breadcrumb trail when answered — user cannot go back past this point' },
            options:      { type: 'array', items: { $ref: '#/components/schemas/Option' } },
          },
        },
        Module: {
          type: 'object',
          properties: {
            id:   { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Initial Assessment & Triage' },
          },
        },
        FlowState: {
          type: 'object',
          properties: {
            id:                { type: 'string', format: 'uuid' },
            userId:            { type: 'string', format: 'uuid' },
            currentModuleId:   { type: 'string', format: 'uuid' },
            currentQuestionId: { type: 'string', format: 'uuid' },
            breadcrumbTrail:   { type: 'array', items: { type: 'string', format: 'uuid' }, description: 'Ordered list of previously answered questionIds (for back navigation)' },
            updatedAt:         { type: 'string', format: 'date-time' },
          },
        },
        HistoryEntry: {
          type: 'object',
          properties: {
            id:        { type: 'string', format: 'uuid' },
            userId:    { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            question: {
              type: 'object',
              properties: {
                id:           { type: 'string', format: 'uuid' },
                text:         { type: 'string' },
                isCheckpoint: { type: 'boolean' },
                moduleId:     { type: 'string', format: 'uuid' },
              },
            },
            option: {
              type: 'object',
              properties: {
                id:             { type: 'string', format: 'uuid' },
                text:           { type: 'string' },
                nextQuestionId: { type: 'string', format: 'uuid', nullable: true },
              },
            },
          },
        },
        // ── Error responses ────────────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'No active flow session. Call POST /api/flow/start first.' },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            error:   { type: 'string', example: 'Validation failed' },
            details: { type: 'object', description: 'Zod flatten() output' },
          },
        },
      },
    },
    security: [{ userEmail: [] }],
  },
  // Pick up @swagger JSDoc blocks from route files
  apis: [
    path.join(__dirname, '../routes/*.ts'),   // dev (tsx)
    path.join(__dirname, '../routes/*.js'),   // prod (compiled)
  ],
}

export const swaggerSpec = swaggerJsdoc(options)
