# Deployment Checklist - AI Explanation System

## 📋 Pre-Deployment Checklist

### 1. Dependencies ✓
- [ ] Install OpenAI SDK: `npm install openai`
- [ ] Install Anthropic SDK: `npm install @anthropic-ai/sdk`
- [ ] Verify node-cron is installed (check package.json)
- [ ] Run `npm install` to ensure all dependencies are installed

### 2. Environment Configuration ✓
- [ ] Add `AI_KEY_ENCRYPTION_SECRET` to `.env.local` (32 characters)
- [ ] Verify secret is NOT committed to git
- [ ] Set `AI_DEFAULT_QUOTA=50000` (optional)
- [ ] Verify `MONGODB_URI` is correct
- [ ] Check `FRONTEND_URL` is configured

### 3. Database Setup
- [ ] MongoDB connection is working
- [ ] Collections exist: `users`, `mcqs`, `seriesmcqs`
- [ ] Optional: Run migration to add `aiGenerated: false` to existing MCQs

**Migration Script (Optional):**
```javascript
// Connect to MongoDB and run:
db.mcqs.updateMany(
  { explain: { $exists: true, $ne: "", $ne: "Explanation Not provided" } },
  { $set: { aiGenerated: false } }
);
db.seriesmcqs.updateMany(
  { explain: { $exists: true, $ne: "" } },
  { $set: { aiGenerated: false } }
);
```

### 4. Code Verification
- [ ] All new files created (check list below)
- [ ] All existing files modified correctly
- [ ] No TypeScript/JavaScript errors
- [ ] Routes registered in server.mjs
- [ ] Cron jobs initialized in server/corn/index.js

**New Files Created:**
```
✓ server/services/ai/aiService.js
✓ server/models/UserAIConfig.js
✓ server/middleware/ai.middleware.js
✓ server/routes/aiExplanation.js
✓ server/routes/aiSettings.js
✓ server/corn/jobs/resetAIQuotas.js
✓ src/components/dashboard/AISettings.tsx
✓ AI_EXPLANATION_SYSTEM.md
✓ IMPLEMENTATION_SUMMARY.md
✓ QUICK_START.md
✓ ARCHITECTURE_DIAGRAMS.md
✓ This file (DEPLOYMENT_CHECKLIST.md)
```

**Modified Files:**
```
✓ server/models/mcq.js (added aiGenerated field)
✓ server/models/series/seriesMcq.js (added aiGenerated field)
✓ server.mjs (registered new routes)
✓ server/corn/index.js (added cron jobs)
✓ src/components/mcq/Mcqs.tsx (integrated AI generation)
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] AI Service initializes correctly
- [ ] Encryption/decryption works
- [ ] Token counting is accurate
- [ ] Quota checking middleware blocks properly
- [ ] Cron job logic is correct

### Integration Tests
- [ ] Can save API key via UI
- [ ] Can test API key validation
- [ ] Can generate explanation for MCQ
- [ ] Explanation caches in database
- [ ] Token usage updates correctly
- [ ] Quota enforcement works
- [ ] Monthly reset works (simulate date change)

### End-to-End Tests
1. **Happy Path:**
   - [ ] User signs up
   - [ ] User navigates to AI Settings
   - [ ] User adds OpenAI API key
   - [ ] User tests key (success)
   - [ ] User saves key
   - [ ] User solves MCQ
   - [ ] User views explanation (generates)
   - [ ] Check: "AI Generated" badge appears
   - [ ] Check: Token usage increases
   - [ ] User views same explanation again
   - [ ] Check: Loads instantly (cached)

2. **Error Scenarios:**
   - [ ] Try without API key → Error message correct
   - [ ] Try with invalid API key → Error caught
   - [ ] Exceed quota → Error message correct
   - [ ] Network error → Handled gracefully

---

## 🚀 Deployment Steps

### Step 1: Backup
```bash
# Backup current database
mongodump --uri="your_mongodb_uri" --out=backup_$(date +%Y%m%d)

# Backup current code
git commit -am "Backup before AI system deployment"
git push origin backup-branch
```

### Step 2: Deploy Code
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build frontend (if applicable)
npm run build
```

### Step 3: Configure Environment
```bash
# Verify .env.local has required variables
echo $AI_KEY_ENCRYPTION_SECRET # Should output 32-char string
```

### Step 4: Start Server
```bash
# Development
npm run dev

# Production
npm start
# or with PM2:
pm2 start server.mjs --name "capital-academy"
pm2 save
```

### Step 5: Verify Deployment
- [ ] Server starts without errors
- [ ] Check logs: "Connected to MongoDB" ✓
- [ ] Check logs: "[CRON] cron jobs initialized" ✓
- [ ] Access frontend: http://localhost:3000
- [ ] Access AI Settings page
- [ ] Test API endpoints manually (Postman/curl)

---

## 🔍 Post-Deployment Verification

### 1. Health Checks (15 min after deployment)
```bash
# Check server is running
curl http://localhost:3000/api/health

# Check MongoDB connection
# (Should see in logs: "Connected to MongoDB")

# Check if routes are registered
curl -X GET http://localhost:3000/api/v1/ai-settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Functional Tests
- [ ] **Test 1:** Register new user account
- [ ] **Test 2:** Navigate to AI Settings page
- [ ] **Test 3:** Add valid OpenAI API key
- [ ] **Test 4:** Test key validation
- [ ] **Test 5:** Generate explanation for MCQ
- [ ] **Test 6:** Verify token usage updates
- [ ] **Test 7:** View same explanation (cached)

### 3. Monitor for Issues
**Watch logs for:**
```bash
# Linux/Mac
tail -f logs/server.log

# Windows
Get-Content logs/server.log -Wait

# PM2
pm2 logs capital-academy
```

**Look for:**
- ❌ No MongoDB connection errors
- ❌ No unhandled promise rejections
- ❌ No 500 errors on AI endpoints
- ✅ Successful explanation generations
- ✅ Cron jobs running

---

## 📊 Monitoring & Metrics

### Key Metrics to Track

**Day 1-7:**
- Number of users configuring API keys
- Number of explanations generated
- Average tokens per explanation
- Cache hit rate
- Error rate

**Week 1-4:**
- Total token usage across all users
- Most active users (by token usage)
- Most explained subjects
- User feedback on explanation quality

### Monitoring Tools

**Database Queries:**
```javascript
// Total users with AI configured
db.useraiconfigs.countDocuments({ apiKey: { $ne: null } })

// Total explanations generated
db.mcqs.countDocuments({ aiGenerated: true }) +
db.seriesmcqs.countDocuments({ aiGenerated: true })

// Users approaching quota limit
db.useraiconfigs.find({
  "tokenUsage.currentMonth": { $gt: 40000 }
})

// High token users (top 10)
db.useraiconfigs.find().sort({ "tokenUsage.currentMonth": -1 }).limit(10)
```

**Analytics Dashboard** (optional):
```javascript
// Create aggregate view
db.useraiconfigs.aggregate([
  {
    $group: {
      _id: null,
      totalUsers: { $sum: 1 },
      totalTokens: { $sum: "$tokenUsage.totalUsed" },
      avgTokensPerUser: { $avg: "$tokenUsage.currentMonth" }
    }
  }
])
```

---

## 🔐 Security Checklist

### Before Going Live:
- [ ] Change `AI_KEY_ENCRYPTION_SECRET` to strong random value
- [ ] Verify API keys are encrypted in database
- [ ] Test decryption works correctly
- [ ] Ensure `.env.local` is in `.gitignore`
- [ ] No hardcoded keys in codebase
- [ ] HTTPS enabled in production
- [ ] Rate limiting configured
- [ ] CORS properly configured

### Ongoing Security:
- [ ] Rotate encryption key every 90 days
- [ ] Monitor for unusual token usage patterns
- [ ] Audit user API keys periodically
- [ ] Keep AI SDKs updated
- [ ] Review usage logs weekly

---

## 🐛 Common Issues & Solutions

### Issue: "AI_KEY_ENCRYPTION_SECRET is not defined"
**Solution:**
```bash
# Add to .env.local
AI_KEY_ENCRYPTION_SECRET=ThisIsA32CharacterSecretKeyFor!!
```

### Issue: "Cannot find module 'openai'"
**Solution:**
```bash
npm install openai @anthropic-ai/sdk
```

### Issue: Cron jobs not running
**Solution:**
```javascript
// Verify in server/corn/index.js:
console.log('[CRON] Initializing cron jobs...');
// Check server logs for this message
```

### Issue: Explanation generation fails silently
**Solution:**
```javascript
// Check browser console for errors
// Check server logs for API errors
// Verify API key is valid in provider dashboard
```

### Issue: Token usage not updating
**Solution:**
```javascript
// Check if middleware is applied:
// aiExplanationRouter.post('/generate', authUser, checkAIQuota, ...)
```

---

## 📞 Support & Rollback

### If Critical Issues Arise:

**Rollback Steps:**
```bash
# 1. Stop server
pm2 stop capital-academy

# 2. Revert code
git revert HEAD
git push origin main

# 3. Restore database (if needed)
mongorestore --uri="your_mongodb_uri" backup_YYYYMMDD

# 4. Restart server
pm2 start capital-academy
```

### Contact Information:
- Technical Lead: [Name]
- DevOps: [Name]
- Database Admin: [Name]

---

## ✅ Final Sign-Off

**Deployment Approved By:**
- [ ] Technical Lead: _________________ Date: _______
- [ ] QA Lead: _________________ Date: _______
- [ ] Product Owner: _________________ Date: _______

**Post-Deployment Verified By:**
- [ ] Developer: _________________ Date: _______
- [ ] QA: _________________ Date: _______

**Production Release:**
- Date: _______________________
- Time: _______________________
- Version: ____________________

---

## 🎉 Success Criteria

Deployment is successful when:
- ✅ Server running without errors
- ✅ At least 1 test user can configure API key
- ✅ At least 1 explanation generated successfully
- ✅ Token usage tracked correctly
- ✅ No critical errors in logs
- ✅ Cache working (2nd view is instant)
- ✅ Cron jobs initialized

---

**Good luck with your deployment! 🚀**

For questions, refer to:
- `AI_EXPLANATION_SYSTEM.md` - Technical documentation
- `QUICK_START.md` - User guide
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
