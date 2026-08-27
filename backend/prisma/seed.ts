/**
 * Seed script — Mental Health Conversation Flow
 * Source: questions-answers-module.md
 *
 * Graph summary:
 *   Module 1 (Initial Assessment & Triage)          — 5 questions
 *   Module 2 (Cognitive Restructuring & Tools)       — 5 questions
 *   Module 3 (Escalation & Professional Support)     — 5 questions
 *
 * Strategy:
 *   1. Create all Modules
 *   2. Create all Questions (without nextQuestionId on Options yet)
 *   3. Create all Options with correct nextQuestionId references
 *      (two-pass so forward references are safe)
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱  Starting seed...\n')

  // ── Wipe existing seed data (idempotent re-runs) ───────────────────────────
  await prisma.flowHistory.deleteMany()
  await prisma.flowState.deleteMany()
  await prisma.option.deleteMany()
  await prisma.question.deleteMany()
  await prisma.module.deleteMany()
  console.log('🗑   Cleared existing data')

  // ── 1. Modules ─────────────────────────────────────────────────────────────
  const m1 = await prisma.module.create({
    data: { name: 'Initial Assessment & Triage', description: 'Understand the user\'s baseline and route them to either tools or human support.' },
  })
  const m2 = await prisma.module.create({
    data: { name: 'Cognitive Restructuring & Tools', description: 'Provide interactive grounding and breathing exercises.' },
  })
  const m3 = await prisma.module.create({
    data: { name: 'Escalation & Professional Support', description: 'Lock in safety and provide human intervention pathways.' },
  })
  console.log(`✅  Created 3 modules`)

  // ── 2. Questions (no options yet) ──────────────────────────────────────────
  // Module 1
  const m1q1 = await prisma.question.create({ data: { moduleId: m1.id, text: 'Welcome back! How would you describe your mood over the past few days?',                                                                           isCheckpoint: false } })
  const m1q2 = await prisma.question.create({ data: { moduleId: m1.id, text: 'I love hearing that. Maintaining a good mood takes practice. Want to do a quick gratitude check?',                                                 isCheckpoint: false } })
  const m1q3 = await prisma.question.create({ data: { moduleId: m1.id, text: 'I hear you. Anxiety can be exhausting. What area of your life is it impacting the most right now?',                                                isCheckpoint: true  } })
  const m1q4 = await prisma.question.create({ data: { moduleId: m1.id, text: 'That makes sense. How long has this specific issue been bothering you?',                                                                            isCheckpoint: false } })
  const m1q5 = await prisma.question.create({ data: { moduleId: m1.id, text: 'No problem at all. I\'ll be right here whenever you need me. Take care!',                                                                          isCheckpoint: false } })

  // Module 2
  const m2q1 = await prisma.question.create({ data: { moduleId: m2.id, text: 'Let\'s work on getting you grounded. We can do a visual exercise or a breathing exercise. Which sounds better?',                                   isCheckpoint: false } })
  const m2q2 = await prisma.question.create({ data: { moduleId: m2.id, text: 'Look around the room. Find 5 things you can see, and say them out loud. Tap below when you\'re done.',                                            isCheckpoint: false } })
  const m2q3 = await prisma.question.create({ data: { moduleId: m2.id, text: 'Great job. Now find 4 things you can physically feel (like your chair). Tap when done.',                                                           isCheckpoint: true  } })
  const m2q4 = await prisma.question.create({ data: { moduleId: m2.id, text: 'Let\'s try box breathing. Inhale for 4, hold for 4, exhale for 4. Try this for two minutes.',                                                     isCheckpoint: false } })
  const m2q5 = await prisma.question.create({ data: { moduleId: m2.id, text: 'You did great work today. Building these mental muscles takes time. Would you like to save this tool?',                                            isCheckpoint: false } })

  // Module 3
  const m3q1 = await prisma.question.create({ data: { moduleId: m3.id, text: 'It sounds like things are really heavy right now. As an AI, my abilities are limited. Can I connect you with a human professional?',              isCheckpoint: true  } })
  const m3q2 = await prisma.question.create({ data: { moduleId: m3.id, text: 'I can connect you to our text-based therapist network, or show you local community support groups. Which do you prefer?',                         isCheckpoint: false } })
  const m3q3 = await prisma.question.create({ data: { moduleId: m3.id, text: 'I\'ve unlocked the Therapy tab for your account. You can browse available professionals there.',                                                   isCheckpoint: false } })
  const m3q4 = await prisma.question.create({ data: { moduleId: m3.id, text: 'I\'ve sent a list of verified, anonymous support groups to your email.',                                                                           isCheckpoint: false } })
  const m3q5 = await prisma.question.create({ data: { moduleId: m3.id, text: 'Professional support is a huge, brave step. We are proud of you. A team member will follow up tomorrow.',                                          isCheckpoint: true  } })

  console.log(`✅  Created 15 questions (5 per module)`)

  // ── 3. Options (with full cross-module routing) ────────────────────────────
  // M1:Q1 → options
  await prisma.option.createMany({ data: [
    { questionId: m1q1.id, text: '🟢 Feeling good!',           nextQuestionId: m1q2.id },
    { questionId: m1q1.id, text: '🟡 A bit anxious.',          nextQuestionId: m1q3.id },
    { questionId: m1q1.id, text: '🔴 Completely overwhelmed.', nextQuestionId: m3q1.id }, // Cross-module jump
  ]})

  // M1:Q2 → options
  await prisma.option.createMany({ data: [
    { questionId: m1q2.id, text: '🟢 Yes, let\'s do it.', nextQuestionId: m2q1.id }, // Cross-module jump
    { questionId: m1q2.id, text: '⚪ Not today.',          nextQuestionId: m1q5.id },
  ]})

  // M1:Q3 (Checkpoint) → options
  await prisma.option.createMany({ data: [
    { questionId: m1q3.id, text: '🔵 My sleep.',               nextQuestionId: m1q4.id },
    { questionId: m1q3.id, text: '🔵 My work/focus.',          nextQuestionId: m1q4.id },
    { questionId: m1q3.id, text: '🔴 I feel like I can\'t cope.', nextQuestionId: m3q1.id }, // Cross-module jump
  ]})

  // M1:Q4 → options
  await prisma.option.createMany({ data: [
    { questionId: m1q4.id, text: '🟡 Just a few days.', nextQuestionId: m2q1.id }, // Cross-module jump
    { questionId: m1q4.id, text: '🔴 For weeks now.',   nextQuestionId: m3q2.id }, // Cross-module jump
  ]})

  // M1:Q5 → options (End of flow)
  await prisma.option.createMany({ data: [
    { questionId: m1q5.id, text: '⚪ Close chat.', nextQuestionId: null },
  ]})

  // M2:Q1 → options
  await prisma.option.createMany({ data: [
    { questionId: m2q1.id, text: '🔵 Visual grounding.', nextQuestionId: m2q2.id },
    { questionId: m2q1.id, text: '🔵 Deep breathing.',   nextQuestionId: m2q4.id },
  ]})

  // M2:Q2 → options
  await prisma.option.createMany({ data: [
    { questionId: m2q2.id, text: '🟢 Done.', nextQuestionId: m2q3.id },
  ]})

  // M2:Q3 (Checkpoint) → options
  await prisma.option.createMany({ data: [
    { questionId: m2q3.id, text: '🟢 Done, feeling calmer.', nextQuestionId: m2q5.id },
    { questionId: m2q3.id, text: '🔴 I\'m still really tense.', nextQuestionId: m2q4.id },
  ]})

  // M2:Q4 → options
  await prisma.option.createMany({ data: [
    { questionId: m2q4.id, text: '🟢 That helped.',               nextQuestionId: m2q5.id },
    { questionId: m2q4.id, text: '🔴 This isn\'t working for me.', nextQuestionId: m3q1.id }, // Cross-module jump
  ]})

  // M2:Q5 → options (End of flow — both paths)
  await prisma.option.createMany({ data: [
    { questionId: m2q5.id, text: '🟢 Yes, save it.', nextQuestionId: null },
    { questionId: m2q5.id, text: '⚪ No thanks.',    nextQuestionId: null },
  ]})

  // M3:Q1 (Checkpoint) → options
  await prisma.option.createMany({ data: [
    { questionId: m3q1.id, text: '🟢 Yes, I need to talk to someone.', nextQuestionId: m3q2.id },
    { questionId: m3q1.id, text: '⚪ No, I just want self-care tools.', nextQuestionId: m2q1.id }, // Cross-module jump
  ]})

  // M3:Q2 → options
  await prisma.option.createMany({ data: [
    { questionId: m3q2.id, text: '🔵 Text a therapist.', nextQuestionId: m3q3.id },
    { questionId: m3q2.id, text: '🔵 Support groups.',   nextQuestionId: m3q4.id },
  ]})

  // M3:Q3 → options
  await prisma.option.createMany({ data: [
    { questionId: m3q3.id, text: '🟢 Take me to the Therapy tab.', nextQuestionId: m3q5.id },
  ]})

  // M3:Q4 → options
  await prisma.option.createMany({ data: [
    { questionId: m3q4.id, text: '🟢 Got it, thanks.',                   nextQuestionId: m3q5.id },
    { questionId: m3q4.id, text: '⚪ Actually, I\'d prefer 1-on-1 therapy.', nextQuestionId: m3q3.id },
  ]})

  // M3:Q5 (Checkpoint) → options (End of flow)
  await prisma.option.createMany({ data: [
    { questionId: m3q5.id, text: '⚪ Understood.', nextQuestionId: null },
  ]})

  console.log(`✅  Created all options with cross-module routing`)

  // ── Summary ────────────────────────────────────────────────────────────────
  const counts = {
    modules:   await prisma.module.count(),
    questions: await prisma.question.count(),
    options:   await prisma.option.count(),
  }
  console.log(`\n📊  Seed complete!`)
  console.log(`    Modules:   ${counts.modules}`)
  console.log(`    Questions: ${counts.questions}`)
  console.log(`    Options:   ${counts.options}`)
  console.log(`\n🗺   Cross-module routes seeded:`)
  console.log(`    M1:Q1 "Overwhelmed"   → M3:Q1  (escalation)`)
  console.log(`    M1:Q2 "Yes grounded"  → M2:Q1  (tools)`)
  console.log(`    M1:Q3 "Can't cope"    → M3:Q1  (escalation)`)
  console.log(`    M1:Q4 "Few days"      → M2:Q1  (tools)`)
  console.log(`    M1:Q4 "Weeks"         → M3:Q2  (escalation)`)
  console.log(`    M2:Q4 "Not working"   → M3:Q1  (escalation)`)
  console.log(`    M3:Q1 "Self-care"     → M2:Q1  (tools)`)
}

main()
  .catch((e) => { console.error('❌  Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
