# AI Explanation System - Architecture Diagrams

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
│  ┌────────────────────┐              ┌────────────────────┐        │
│  │  MCQ Solver Page   │              │  AI Settings Page  │        │
│  │  - View questions  │              │  - Add API key     │        │
│  │  - Flip to explain │              │  - View usage      │        │
│  │  - See AI badge    │              │  - Test provider   │        │
│  └────────────────────┘              └────────────────────┘        │
└──────────────┬─────────────────────────────────┬───────────────────┘
               │                                  │
               │ POST /explanation/generate       │ PUT /ai-settings/provider
               │                                  │
┌──────────────▼─────────────────────────────────▼───────────────────┐
│                         BACKEND API                                 │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                     Middleware Layer                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │ │
│  │  │   authUser   │→ │ checkAIQuota │→ │  aiService   │      │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    Service Layer                              │ │
│  │  ┌──────────────────────────────────────────────────────┐   │ │
│  │  │           AIService (aiService.js)                    │   │ │
│  │  │  ┌─────────────┐         ┌──────────────┐           │   │ │
│  │  │  │OpenAI Client│         │Anthropic SDK │           │   │ │
│  │  │  └─────────────┘         └──────────────┘           │   │ │
│  │  │  - Prompt builder                                    │   │ │
│  │  │  - Token estimation                                  │   │ │
│  │  │  - Error handling                                    │   │ │
│  │  └──────────────────────────────────────────────────────┘   │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    Data Layer                                 │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │ │
│  │  │  MCQ Model   │  │ UserAIConfig │  │  SeriesMCQ   │      │ │
│  │  │  .explain    │  │  .apiKey     │  │  .explain    │      │ │
│  │  │  .aiGen...   │  │  .tokenUsage │  │  .aiGen...   │      │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────┬─────────────────────────────────┬───────────────────┘
               │                                  │
               │ API Call                         │ Store encrypted
               ▼                                  ▼
┌──────────────────────────┐      ┌────────────────────────────┐
│   AI Provider APIs       │      │      MongoDB Database       │
│  - OpenAI GPT-4o Mini    │      │  - UserAIConfig collection │
│  - Anthropic Claude 3.5  │      │  - MCQ collections         │
└──────────────────────────┘      └────────────────────────────┘
```

---

## Request Flow Diagram

### Scenario: User Views Explanation

```
┌──────┐
│ User │ Clicks "View Explanation"
└──┬───┘
   │
   ▼
┌─────────────────────┐
│  Mcqs.tsx Component │
└──────────┬──────────┘
           │
           │ Check: Does explanation exist?
           │
    ┌──────┴──────┐
    │             │
  YES             NO
    │             │
    │             ▼
    │      ┌────────────────────────┐
    │      │ Call generateExplana.. │
    │      └───────────┬────────────┘
    │                  │
    │                  │ POST /api/v1/explanation/generate
    │                  │ { mcqId, mcqType }
    │                  ▼
    │      ┌───────────────────────┐
    │      │   authUser Middleware │ ← Check JWT
    │      └───────────┬───────────┘
    │                  │
    │                  ▼
    │      ┌───────────────────────┐
    │      │ checkAIQuota Middleware│
    │      └───────────┬───────────┘
    │                  │
    │          Checks: ┌─ API key configured?
    │                  ├─ Quota remaining?
    │                  └─ Feature enabled?
    │                  │
    │                  │ All OK
    │                  ▼
    │      ┌───────────────────────┐
    │      │  Fetch MCQ from DB    │
    │      └───────────┬───────────┘
    │                  │
    │                  ▼
    │      ┌───────────────────────┐
    │      │  Initialize AIService │
    │      └───────────┬───────────┘
    │                  │
    │                  │ Decrypt API key
    │                  │ Build prompt
    │                  ▼
    │      ┌───────────────────────┐
    │      │  Call AI Provider API │ ← OpenAI/Anthropic
    │      └───────────┬───────────┘
    │                  │
    │                  │ Response with explanation
    │                  ▼
    │      ┌───────────────────────┐
    │      │  Update Token Usage   │
    │      └───────────┬───────────┘
    │                  │
    │                  ▼
    │      ┌───────────────────────┐
    │      │ Cache in MCQ document │
    │      └───────────┬───────────┘
    │                  │
    │                  │ Return { explanation, tokensUsed }
    │                  ▼
    ▼                  │
┌──────────────────────┴─┐
│ Display Explanation    │
│ + "AI Generated" badge │
└────────────────────────┘
```

---

## Data Flow

### API Key Storage & Encryption

```
User Inputs API Key: "sk-abc123xyz..."
           │
           ▼
┌──────────────────────┐
│  Validate Format     │ ← Must start with sk- or sk-ant-
└──────────┬───────────┘
           │ Valid
           ▼
┌──────────────────────┐
│  Encrypt with AES    │ ← Using AI_KEY_ENCRYPTION_SECRET
└──────────┬───────────┘
           │
           │ Encrypted: "a1b2c3d4:e5f6g7h8..."
           ▼
┌──────────────────────┐
│  Store in MongoDB    │ ← UserAIConfig.apiKey
└──────────────────────┘

When needed:
           │
           ▼
┌──────────────────────┐
│  Fetch from DB       │
└──────────┬───────────┘
           │ Encrypted: "a1b2c3d4:e5f6g7h8..."
           ▼
┌──────────────────────┐
│  Decrypt with AES    │
└──────────┬───────────┘
           │ Decrypted: "sk-abc123xyz..."
           ▼
┌──────────────────────┐
│  Use for API call    │
└──────────────────────┘
```

---

## Token Usage Tracking

```
Generate Explanation
       │
       ▼
┌─────────────────────┐
│  AI Provider Call   │
└──────┬──────────────┘
       │
       │ Returns: tokensUsed = 245
       ▼
┌─────────────────────────────────────┐
│  Update UserAIConfig                │
│                                     │
│  tokenUsage.currentMonth += 245    │ (2450 → 2695)
│  tokenUsage.totalUsed += 245       │ (8920 → 9165)
│                                     │
│  usageHistory.push({               │
│    date: now,                      │
│    tokensUsed: 245,                │
│    action: "explanation_generated",│
│    mcqId: "64abc...",              │
│    mcqType: "MCQ"                  │
│  })                                │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────┐
│  Save to DB         │
└─────────────────────┘
```

---

## Quota Reset (Monthly Cron Job)

```
1st of Month, 00:00
       │
       ▼
┌─────────────────────┐
│  Cron Job Triggers  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  For each UserAIConfig:             │
│                                     │
│  IF (current month != last reset)  │
│  THEN:                              │
│    tokenUsage.currentMonth = 0     │ RESET
│    tokenUsage.lastResetDate = now  │
│    usageHistory.push({             │
│      action: "quota_reset"         │
│    })                               │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────┐
│  Log: "Reset X      │
│   users' quotas"    │
└─────────────────────┘
```

---

## Caching Strategy

```
First User Generates Explanation
              │
              ▼
┌─────────────────────────────────────┐
│  POST /explanation/generate         │
│  mcqId: "64abc123"                  │
└──────────────┬──────────────────────┘
               │
               │ MCQ.explain = null
               ▼
      ┌────────────────┐
      │  Call AI API   │ ← Costs tokens
      └────────┬───────┘
               │
               │ explanation = "Mitochondria..."
               ▼
      ┌────────────────────────┐
      │  Update MCQ document   │
      │  .explain = "Mitochon.."│
      │  .aiGenerated = true    │
      └────────────────────────┘
               │
               │ Response: { source: "ai_generated", tokensUsed: 245 }
               ▼
      ┌────────────────┐
      │  User sees it  │
      └────────────────┘


Second User Views Same MCQ
              │
              ▼
┌─────────────────────────────────────┐
│  POST /explanation/generate         │
│  mcqId: "64abc123"                  │
└──────────────┬──────────────────────┘
               │
               │ MCQ.explain = "Mitochondria..."
               ▼
      ┌────────────────┐
      │  Return cached │ ← No API call!
      └────────┬───────┘
               │
               │ Response: { source: "database", tokensUsed: 0 }
               ▼
      ┌────────────────┐
      │  User sees it  │
      └────────────────┘
```

---

## Error Handling Flow

```
User Requests Explanation
       │
       ▼
┌──────────────────┐
│  Check AI Config │
└──────┬───────────┘
       │
       ├─→ No API key? → Return: "Please configure API key"
       │
       ├─→ Quota exceeded? → Return: "Monthly quota reached"
       │
       ├─→ Feature disabled? → Return: "AI feature disabled"
       │
       │ All checks pass
       ▼
┌──────────────────┐
│  Call AI API     │
└──────┬───────────┘
       │
       ├─→ Invalid API key? → Return: "API key invalid"
       │
       ├─→ Rate limit? → Return: "Rate limit exceeded"
       │
       ├─→ Network error? → Return: "Failed to generate"
       │
       │ Success
       ▼
┌──────────────────┐
│  Return explain  │
└──────────────────┘
```

---

## Database Schema Relationships

```
┌─────────────────────────┐
│        User             │
│  - _id                  │
│  - username             │
│  - email                │
└───────┬─────────────────┘
        │
        │ 1:1 relationship
        │
        ▼
┌─────────────────────────┐
│    UserAIConfig         │
│  - userId (ref)         │
│  - aiProvider           │
│  - apiKey (encrypted)   │
│  - tokenUsage           │
│  - tokenQuota           │
│  - usageHistory[]       │
└───────┬─────────────────┘
        │
        │ Logs usage for
        │
        ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│         MCQ             │         │      SeriesMCQ          │
│  - _id                  │         │  - _id                  │
│  - question             │         │  - question             │
│  - options[]            │         │  - options[]            │
│  - correctOption        │         │  - correctOption        │
│  - explain              │◄────────┤  - explain              │
│  - aiGenerated          │  Same   │  - aiGenerated          │
└─────────────────────────┘  Schema └─────────────────────────┘
```

---

## Frontend State Management

```
Mcqs.tsx Component State
┌──────────────────────────────────────┐
│  mcqs: Array<MCQ>                    │ ← All MCQs in test
│  index: number                       │ ← Current MCQ index
│  correctMcq: Array<id>               │ ← Correct answers
│  wrongMcq: Array<id>                 │ ← Wrong answers
│  isFlip: boolean                     │ ← Show explanation?
│  isGeneratingExplanation: boolean    │ ← Loading state
│  generatedExplanations: Map<id, str>│ ← Session cache
└──────────────────────────────────────┘
         │
         │ When user flips card
         ▼
┌──────────────────────────────────────┐
│  1. Set isFlip = true                │
│  2. Check if explanation exists      │
│  3. If not, call generateExplanation │
│  4. Set isGeneratingExplanation=true│
│  5. POST to /explanation/generate    │
│  6. Update mcqs[index].explain       │
│  7. Add to generatedExplanations     │
│  8. Set isGeneratingExplanation=false│
└──────────────────────────────────────┘
```

---

## Cost Calculation

```
Token Usage Breakdown
┌──────────────────────────────────────┐
│  Input Tokens (Prompt)               │
│  - System message: ~50 tokens        │
│  - Question: ~30-100 tokens          │
│  - Options: ~20-40 tokens            │
│  - Instructions: ~80 tokens          │
│  ────────────────────────────────    │
│  Total Input: ~150-270 tokens        │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│  Output Tokens (Explanation)         │
│  - Average: 80-120 tokens            │
│  - Max (limited): 300 tokens         │
└──────────────────────────────────────┘

Total per Explanation: ~250 tokens (avg)

Costs:
OpenAI GPT-4o Mini:
  Input:  $0.15 / 1M tokens
  Output: $0.60 / 1M tokens
  Avg:    ~$0.0000375 per explanation

Anthropic Claude 3.5 Haiku:
  Input:  $1.00 / 1M tokens
  Output: $5.00 / 1M tokens
  Avg:    ~$0.00025 per explanation

With 50,000 token quota:
  ~200 explanations per month
  OpenAI:    $0.75/month
  Anthropic: $5.00/month
```

---

These diagrams provide a comprehensive visual guide to understanding the AI explanation system architecture, data flow, and operational details.
