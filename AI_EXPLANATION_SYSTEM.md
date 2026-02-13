# AI-Powered MCQ Explanation System

## Overview
This system automatically generates explanations for MCQs that don't have one, using the user's own AI API key (Bring Your Own Key model).

## Architecture

### Backend Components

1. **AI Service Layer** (`server/services/ai/aiService.js`)
   - Abstraction layer supporting OpenAI and Anthropic
   - Handles prompt engineering for educational explanations
   - Tracks token usage per generation

2. **User AI Configuration Model** (`server/models/UserAIConfig.js`)
   - Stores encrypted API keys per user
   - Tracks token usage (current month, total, history)
   - Enforces monthly quotas (default: 50,000 tokens)
   - Preferences for auto-generation settings

3. **Middleware** (`server/middleware/ai.middleware.js`)
   - `checkAIQuota`: Validates user has remaining quota
   - `validateAIProvider`: Ensures API key format is correct
   - Auto-resets monthly usage on new month

4. **Routes**
   - `/api/v1/explanation/generate` - Generate single explanation
   - `/api/v1/explanation/batch` - Batch generate (max 10 at once)
   - `/api/v1/ai-settings/*` - Manage API keys and preferences

### Frontend Components

1. **AI Settings Dashboard** (`src/components/dashboard/AISettings.tsx`)
   - Configure AI provider (OpenAI/Anthropic)
   - Add/test/remove API keys
   - View token usage and quota
   - Compare provider pricing

2. **MCQ Component Enhancement** (`src/components/mcq/Mcqs.tsx`)
   - Auto-generates explanation when "View Explanation" is clicked
   - Shows loading state during generation
   - Caches generated explanations in session
   - Displays "AI Generated" badge

### Database Schema Updates

#### MCQ Models (both `mcq.js` and `seriesMcq.js`)
```javascript
{
  // ... existing fields
  aiGenerated: { type: Boolean, default: false }, // NEW
}
```

#### UserAIConfig (NEW)
```javascript
{
  userId: ObjectId,
  aiProvider: "openai" | "anthropic" | "none",
  apiKey: String, // encrypted
  tokenUsage: {
    currentMonth: Number,
    lastResetDate: Date,
    totalUsed: Number
  },
  tokenQuota: Number, // default 50,000
  usageHistory: [{ date, tokensUsed, action, mcqId }],
  preferences: {
    autoGenerate: Boolean,
    maxTokensPerExplanation: Number,
    preferredModel: String
  }
}
```

## Workflow

### Explanation Generation Flow

```
User clicks "View Explanation"
    ↓
Frontend checks if explanation exists
    ↓
If missing → POST /api/v1/explanation/generate
    ↓
Middleware checks:
  - User authenticated?
  - API key configured?
  - Quota remaining?
    ↓
Backend fetches MCQ from database
    ↓
AI Service generates explanation
    ↓
Update token usage in UserAIConfig
    ↓
Cache explanation in MCQ document
    ↓
Return explanation to frontend
    ↓
Display with "AI Generated" badge
```

### Quota Management

- **Monthly Reset**: Automatic via cron job or on-demand check
- **Default Quota**: 50,000 tokens/month (~166 explanations)
- **Tracking**: Every generation logged in `usageHistory`
- **Enforcement**: Middleware blocks requests when quota exceeded

## Prompt Engineering

The AI prompt is designed to generate:
- **Clear** explanations (3-5 sentences)
- **Step-by-step** reasoning
- **Difficulty-appropriate** language
- **Subject-specific** context
- **Educational** tone

Example prompt structure:
```
You are an expert educator specializing in {subject}.

Question: {question}
Options: A) ... B) ... C) ... D) ...
Correct Answer: B) ...

Task: Provide a clear explanation of why option B is correct.
- Be concise (3-5 sentences)
- Explain the underlying concept
- Show reasoning process
- Match {difficulty} level
- Be safe for all audiences
```

## Security Features

1. **API Key Encryption**
   - Keys encrypted using AES-256-CBC
   - Encryption key stored in environment variable
   - Decrypted only when needed for API calls

2. **Quota Enforcement**
   - Per-user limits prevent abuse
   - Monthly resets ensure fair usage
   - Hard caps on batch operations

3. **Error Handling**
   - Invalid API keys detected early
   - Rate limit errors caught and reported
   - Fallback to database explanations

## Cost Optimization

1. **Caching Strategy**
   - Generated explanations saved to database
   - Future users get cached version (0 tokens)
   - Only generates once per MCQ

2. **Token Limits**
   - Max 300 tokens per explanation
   - Uses cost-effective models:
     - OpenAI: GPT-4o Mini ($0.15/1M tokens)
     - Anthropic: Claude 3.5 Haiku ($1.00/1M tokens)

3. **Batch Operations**
   - Max 10 MCQs per batch
   - Stops if quota reached mid-batch

## API Endpoints

### Explanation Generation

**POST** `/api/v1/explanation/generate`
```json
Request:
{
  "mcqId": "64abc123...",
  "mcqType": "MCQ" // or "SeriesMCQ"
}

Response:
{
  "explanation": "The correct answer is B because...",
  "source": "ai_generated", // or "database"
  "cached": false,
  "tokensUsed": 245,
  "model": "gpt-4o-mini",
  "remainingQuota": 49755
}
```

### AI Settings Management

**GET** `/api/v1/ai-settings`
```json
Response:
{
  "aiProvider": "openai",
  "hasApiKey": true,
  "tokenUsage": {
    "currentMonth": 2450,
    "totalUsed": 8920,
    "lastResetDate": "2026-01-01T00:00:00.000Z"
  },
  "tokenQuota": 50000,
  "isEnabled": true,
  "usagePercentage": 4.9
}
```

**PUT** `/api/v1/ai-settings/provider`
```json
Request:
{
  "aiProvider": "openai",
  "apiKey": "sk-..."
}

Response:
{
  "message": "AI provider updated successfully",
  "aiProvider": "openai",
  "hasApiKey": true
}
```

**POST** `/api/v1/ai-settings/test-key`
```json
Request:
{
  "aiProvider": "openai",
  "apiKey": "sk-..."
}

Response:
{
  "success": true,
  "message": "API key is valid and working",
  "testResult": {
    "explanation": "Test explanation...",
    "tokensUsed": 156,
    "model": "gpt-4o-mini"
  }
}
```

## Installation

### 1. Install Dependencies

```bash
npm install openai @anthropic-ai/sdk
```

### 2. Environment Variables

Add to `.env.local`:
```env
AI_KEY_ENCRYPTION_SECRET=your-32-character-secret-key-here-!!!
```

### 3. Database Migration

Run a migration to add `aiGenerated` field to existing MCQs:
```javascript
// Optional: mark existing explanations as human-written
db.mcqs.updateMany(
  { explain: { $ne: "Explanation Not provided", $exists: true } },
  { $set: { aiGenerated: false } }
)
```

### 4. Update Routes in server.mjs

Already implemented in the code above.

### 5. Frontend Integration

Add AI Settings page to your dashboard navigation:
```tsx
import AISettings from '@/components/dashboard/AISettings'

// In your dashboard route
<Route path="/dashboard/ai-settings" element={<AISettings />} />
```

## Usage Guide for End Users

### Setting Up AI Explanations

1. **Get an API Key**
   - **OpenAI**: Visit https://platform.openai.com/api-keys
   - **Anthropic**: Visit https://console.anthropic.com/

2. **Configure in Dashboard**
   - Navigate to Settings → AI Explanations
   - Select your provider
   - Paste your API key
   - Click "Test Key" to verify
   - Click "Save"

3. **Using AI Explanations**
   - Solve MCQs normally
   - When you click "View Explanation"
   - If explanation is missing, it generates automatically
   - See token usage in real-time

### Best Practices

- **Use OpenAI for cost-effectiveness** ($0.15 vs $1.00 per 1M tokens)
- **Monitor your quota** in the dashboard
- **Cache is your friend** - explanations generate once, help everyone
- **Batch generate** if you're an admin managing many MCQs

## Monitoring & Analytics

Track in your admin dashboard:
- Total AI-generated explanations
- Token usage per user
- Most expensive subjects (token-wise)
- Cache hit rate

## Future Enhancements

1. **Explanation Quality Rating**
   - Let users rate AI explanations
   - Regenerate low-rated ones

2. **Multi-Language Support**
   - Generate explanations in user's preferred language

3. **Adaptive Difficulty**
   - Adjust explanation complexity based on user's performance

4. **Voice Explanations**
   - Convert text to speech for audio learners

5. **Cost Sharing**
   - Optional: pool tokens across organization

## Troubleshooting

### "API key not configured"
→ User needs to add their API key in settings

### "Quota exceeded"
→ Wait for monthly reset or adjust quota limit in UserAIConfig

### "Invalid API key"
→ Key format wrong or revoked - test in provider's dashboard

### Slow generation
→ Normal for complex MCQs; consider increasing max_tokens limit

### Rate limit errors
→ User's API key hit provider's rate limit - wait or upgrade plan

## Support

For issues or questions:
- Check error messages in browser console
- Review server logs for detailed errors
- Verify API key is valid in provider's dashboard
- Ensure sufficient credits in AI provider account
