# Mental Health Conversation Flow (Seed Data Spec)

This document outlines the conversation graph used to seed the database for this project. It simulates a mental health triage and routing system, demonstrating cross-module jumps, checkpoints, and defensive state management.

## Module 1: Initial Assessment & Triage
**Goal:** Understand the user's baseline and route them to either tools or human support.

| Node ID | Question Text | Checkpoint? | Options | Routing Destination |
| :--- | :--- | :---: | :--- | :--- |
| **M1: Q1** | "Welcome back! How would you describe your mood over the past few days?" | `false` | 🟢 "Feeling good!"<br>🟡 "A bit anxious."<br>🔴 "Completely overwhelmed." | `M1: Q2`<br>`M1: Q3`<br>`M3: Q1` (Cross-Module) |
| **M1: Q2** | "I love hearing that. Maintaining a good mood takes practice. Want to do a quick gratitude check?" | `false` | 🟢 "Yes, let's do it."<br>⚪ "Not today." | `M2: Q1` (Cross-Module)<br>`M1: Q5` |
| **M1: Q3** | "I hear you. Anxiety can be exhausting. What area of your life is it impacting the most right now?" | `true` | 🔵 "My sleep."<br>🔵 "My work/focus."<br>🔴 "I feel like I can't cope." | `M1: Q4`<br>`M1: Q4`<br>`M3: Q1` (Cross-Module) |
| **M1: Q4** | "That makes sense. How long has this specific issue been bothering you?" | `false` | 🟡 "Just a few days."<br>🔴 "For weeks now." | `M2: Q1` (Cross-Module)<br>`M3: Q2` (Cross-Module) |
| **M1: Q5** | "No problem at all. I'll be right here whenever you need me. Take care!" | `false` | ⚪ "Close chat." | `null` (End Flow) |

---

## Module 2: Cognitive Restructuring & Tools
**Goal:** Provide interactive exercises. This module is ideal for testing the intra-module "Go Back" functionality.

| Node ID | Question Text | Checkpoint? | Options | Routing Destination |
| :--- | :--- | :---: | :--- | :--- |
| **M2: Q1** | "Let's work on getting you grounded. We can do a visual exercise or a breathing exercise. Which sounds better?" | `false` | 🔵 "Visual grounding."<br>🔵 "Deep breathing." | `M2: Q2`<br>`M2: Q4` |
| **M2: Q2** | "Look around the room. Find 5 things you can see, and say them out loud. Tap below when you're done." | `false` | 🟢 "Done." | `M2: Q3` |
| **M2: Q3** | "Great job. Now find 4 things you can physically feel (like your chair). Tap when done." | `true` | 🟢 "Done, feeling calmer."<br>🔴 "I'm still really tense." | `M2: Q5`<br>`M2: Q4` |
| **M2: Q4** | "Let's try box breathing. Inhale for 4, hold for 4, exhale for 4. Try this for two minutes." | `false` | 🟢 "That helped."<br>🔴 "This isn't working for me." | `M2: Q5`<br>`M3: Q1` (Cross-Module) |
| **M2: Q5** | "You did great work today. Building these mental muscles takes time. Would you like to save this tool?" | `false` | 🟢 "Yes, save it."<br>⚪ "No thanks." | `null` (End Flow)<br>`null` (End Flow) |

---

## Module 3: Escalation & Professional Support
**Goal:** Lock in safety and provide human intervention. This module heavily utilizes checkpoints to prevent users from backing out of safety workflows.

| Node ID | Question Text | Checkpoint? | Options | Routing Destination |
| :--- | :--- | :---: | :--- | :--- |
| **M3: Q1** | "It sounds like things are really heavy right now. As an AI, my abilities are limited. Can I connect you with a human professional?" | `true` | 🟢 "Yes, I need to talk to someone."<br>⚪ "No, I just want self-care tools." | `M3: Q2`<br>`M2: Q1` (Cross-Module) |
| **M3: Q2** | "I can connect you to our text-based therapist network, or show you local community support groups. Which do you prefer?" | `false` | 🔵 "Text a therapist."<br>🔵 "Support groups." | `M3: Q3`<br>`M3: Q4` |
| **M3: Q3** | "I've unlocked the Therapy tab for your account. You can browse available professionals there." | `false` | 🟢 "Take me to the Therapy tab." | `M3: Q5` |
| **M3: Q4** | "I've sent a list of verified, anonymous support groups to your email." | `false` | 🟢 "Got it, thanks."<br>⚪ "Actually, I'd prefer 1-on-1 therapy." | `M3: Q5`<br>`M3: Q3` |
| **M3: Q5** | "Professional support is a huge, brave step. We are proud of you. A team member will follow up tomorrow." | `true` | ⚪ "Understood." | `null` (End Flow) |