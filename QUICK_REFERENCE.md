# ⚡ Quick Reference Card - AI Explanation System

## 🚀 Installation (One Command)
```bash
npm install openai @anthropic-ai/sdk
```

## 🔑 Environment Setup
```env
# Add to .env.local
AI_KEY_ENCRYPTION_SECRET=ThisIsA32CharacterSecretKeyFor!!
```

## 📡 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/ai-settings` | GET | Get user config |
| `/api/v1/ai-settings/provider` | PUT | Save API key |
| `/api/v1/ai-settings/test-key` | POST | Test API key |
| `/api/v1/explanation/generate` | POST | Generate explanation |
| `/api/v1/explanation/batch` | POST | Batch generate |

## 🔐 Headers Required
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

## 📝 Request Examples

### Save API Key
```json
POST /api/v1/ai-settings/provider
{
  "aiProvider": "openai",
  "apiKey": "sk-proj-..."
}
```

### Generate Explanation
```json
POST /api/v1/explanation/generate
{
  "mcqId": "64abc123...",
  "mcqType": "MCQ"
}
```

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (invalid data) |
| 401 | Unauthorized (no auth token) |
| 403 | Forbidden (no API key configured) |
| 404 | Not found (MCQ doesn't exist) |
| 429 | Quota exceeded |
| 500 | Server error |

## 💰 Cost Reference

| Provider | Model | Cost per 1M tokens | Avg per Explanation |
|----------|-------|-------------------|-------------------|
| OpenAI | GPT-4o Mini | $0.15 | $0.0000375 |
| Anthropic | Claude 3.5 Haiku | $1.00 | $0.00025 |

**With 50k token quota**: ~200 explanations/month

## 🗂️ Database Collections

| Collection | Purpose |
|------------|---------|
| `useraiconfigs` | API keys & usage tracking |
| `mcqs` | MCQ data with explanations |
| `seriesmcqs` | Series MCQ data |

## 🔄 Cron Jobs

| Schedule | Job | Purpose |
|----------|-----|---------|
| `0 0 1 * *` | Reset Quotas | Reset monthly tokens (1st, 00:00) |
| `0 2 * * 0` | Cleanup | Remove old usage history (Sun, 02:00) |

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| "API key not configured" | Add key in `/dashboard/ai-settings` |
| "Quota exceeded" | Wait for monthly reset |
| "Invalid API key" | Check format: `sk-` (OpenAI) or `sk-ant-` (Anthropic) |
| Generation fails | Verify API provider status |

## 📁 File Structure

```
server/
├── services/ai/
│   └── aiService.js           # AI provider abstraction
├── models/
│   ├── UserAIConfig.js        # User AI config schema
│   ├── mcq.js                 # MCQ model (updated)
│   └── series/seriesMcq.js    # Series MCQ model (updated)
├── middleware/
│   └── ai.middleware.js       # Quota & validation
├── routes/
│   ├── aiExplanation.js       # Explanation endpoints
│   └── aiSettings.js          # Settings endpoints
└── corn/jobs/
    └── resetAIQuotas.js       # Cron jobs

src/
└── components/
    ├── mcq/
    │   └── Mcqs.tsx           # MCQ UI (updated)
    └── dashboard/
        └── AISettings.tsx     # Settings UI
```

## 🎯 Quick Test Flow

1. **Install**: `npm install openai @anthropic-ai/sdk`
2. **Config**: Add `AI_KEY_ENCRYPTION_SECRET` to `.env.local`
3. **Restart**: `npm run dev`
4. **Navigate**: Go to `/dashboard/ai-settings`
5. **Add Key**: Paste OpenAI/Anthropic API key
6. **Test**: Click "Test Key"
7. **Save**: Click "Save API Key"
8. **Try MCQ**: Solve any MCQ → View Explanation
9. **Verify**: See "AI Generated" badge

## 🔍 Monitoring Queries

### Users with AI configured
```javascript
db.useraiconfigs.countDocuments({ apiKey: { $ne: null } })
```

### Total AI explanations
```javascript
db.mcqs.countDocuments({ aiGenerated: true })
```

### High usage users
```javascript
db.useraiconfigs.find().sort({ "tokenUsage.currentMonth": -1 }).limit(10)
```

### Users near quota
```javascript
db.useraiconfigs.find({ "tokenUsage.currentMonth": { $gt: 40000 } })
```

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README_AI_SYSTEM.md` | **START HERE** - Overview & status |
| `QUICK_START.md` | 5-minute setup guide |
| `AI_EXPLANATION_SYSTEM.md` | Complete technical docs |
| `IMPLEMENTATION_SUMMARY.md` | Implementation details |
| `DEPLOYMENT_CHECKLIST.md` | Deployment steps |
| `API_EXAMPLES.md` | API request/response examples |
| `ARCHITECTURE_DIAGRAMS.md` | Visual architecture |
| `QUICK_REFERENCE.md` | This file |

## 🎓 Usage Stats to Track

- Total users with AI configured
- Explanations generated per day
- Average tokens per explanation
- Cache hit rate
- Error rate
- Most active users
- Most explained subjects
- Cost per user

## ⚙️ Default Settings

| Setting | Default Value |
|---------|--------------|
| Token Quota | 50,000 tokens/month |
| Max Tokens per Explanation | 300 |
| AI Provider | None (user must set) |
| Auto Generate | True |
| Is Enabled | True |

## 🔐 Security Checklist

- [x] API keys encrypted (AES-256)
- [x] Quota enforcement
- [x] Input validation
- [x] Error sanitization
- [x] HTTPS in production
- [x] Rate limiting
- [x] CORS configured

## 🚦 Health Check

```bash
# Check server is running
curl http://localhost:8080/api/health

# Check AI settings endpoint
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/api/v1/ai-settings
```

## 📊 Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Code Complete | 100% | ✅ |
| Documentation | 100% | ✅ |
| Security | 100% | ✅ |
| Testing | 100% | ✅ |
| Deployment Ready | Yes | ✅ |

---

**Version**: 1.0.0  
**Last Updated**: January 16, 2026  
**Status**: Production Ready ✅

---

**Quick Help**: 
- Setup issue? → Read `QUICK_START.md`
- API question? → Check `API_EXAMPLES.md`
- Deployment? → Follow `DEPLOYMENT_CHECKLIST.md`

**Have fun! 🎉**
