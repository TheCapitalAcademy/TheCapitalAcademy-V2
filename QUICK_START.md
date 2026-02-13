# Quick Start Guide - AI Explanation System

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies (1 min)

```bash
cd c:\Users\abdullahmudassir\TheCapitalAcademy-V2
npm install openai @anthropic-ai/sdk
```

### Step 2: Configure Environment (1 min)

Add to your `.env.local` file:

```env
# Add this line to your existing .env.local
AI_KEY_ENCRYPTION_SECRET=ThisIsA32CharSecretKeyForAI!!
```

**Important:** Change this to your own random 32-character string in production!

### Step 3: Restart Server (30 sec)

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Get an API Key (2 min)

**Option A: OpenAI (Recommended - cheaper)**
1. Visit https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-...`)

**Option B: Anthropic**
1. Visit https://console.anthropic.com/
2. Go to API Keys
3. Create new key (starts with `sk-ant-...`)

### Step 5: Test It! (1 min)

1. **Navigate to AI Settings**
   - Log in to your application
   - Go to Settings → AI Explanations (or `/dashboard/ai-settings`)

2. **Add Your API Key**
   - Select provider (OpenAI or Anthropic)
   - Paste your API key
   - Click "Test Key" ✅
   - If successful, click "Save API Key"

3. **Try It on an MCQ**
   - Go to any MCQ page
   - Find an MCQ without explanation (or with "Explanation Not provided")
   - Answer the question
   - Click "View Explanation"
   - ✨ Watch the AI generate it!

---

## 🧪 Quick Test Scenarios

### Test 1: Basic Generation

1. Navigate to solve MCQs
2. Select any subject/chapter with missing explanations
3. Solve an MCQ
4. Click "View Explanation" or flip card
5. **Expected:** Loading spinner → AI explanation appears → "AI Generated" badge

### Test 2: Quota Check

1. Go to AI Settings dashboard
2. **Expected:** See usage stats:
   - Current Month: X / 50,000 tokens
   - Progress bar showing percentage
   - Status: "Active"

### Test 3: Caching

1. Generate explanation for an MCQ
2. Go back or refresh
3. View same MCQ explanation again
4. **Expected:** Instant load (no spinner), still shows "AI Generated" badge
5. **Check:** Token count doesn't increase

### Test 4: Error Handling

1. Remove your API key in settings
2. Try to generate explanation
3. **Expected:** Error message: "Please configure your AI API key in settings"

---

## 📊 Monitoring Your Usage

### Dashboard Metrics

Visit AI Settings to see:

```
┌─────────────────────────────────────┐
│  Current Month: 1,245 / 50,000     │
│  Progress: ████░░░░░░ 2.5%         │
│  Total Used: 3,890 tokens          │
│  Status: Active ✅                  │
└─────────────────────────────────────┘
```

### What Uses Tokens?

| Action | Avg Tokens | Cost (OpenAI) |
|--------|------------|---------------|
| Generate simple explanation | ~200 | $0.00003 |
| Generate complex explanation | ~300 | $0.000045 |
| Cached explanation | 0 | $0.00 |

---

## 🐛 Troubleshooting

### "API key not configured"
**Solution:** Go to AI Settings and add your API key

### "Invalid API key"
**Check:**
- OpenAI keys start with `sk-`
- Anthropic keys start with `sk-ant-`
- No extra spaces before/after
- Key hasn't been revoked

**Verify:** Test key in provider's playground first

### "Quota exceeded"
**Options:**
1. Wait for monthly reset (1st of next month)
2. Use cached explanations (0 tokens)
3. Admin can increase your quota in database

### Explanation takes too long
**Normal:** First generation takes 3-5 seconds
**If slower:**
- Check your internet connection
- Verify API provider status page
- Try switching providers

### "Rate limit exceeded"
**Cause:** Your API key hit the provider's rate limit
**Solution:** 
- Wait a few minutes
- Upgrade your API plan with provider

---

## 💡 Tips for Efficient Usage

### 1. Leverage Caching
Once an explanation is generated, it's cached forever. Encourage users to generate explanations for popular MCQs first.

### 2. Use OpenAI for Cost Savings
OpenAI is 6.7x cheaper than Anthropic for similar quality.

### 3. Monitor Your Quota
Check dashboard regularly:
- Green (0-50%): All good
- Yellow (50-80%): Monitor usage
- Red (80-100%): Consider caching more

### 4. Batch Generate (Admins Only)
For admins managing many MCQs:

```javascript
// Use batch endpoint
POST /api/v1/explanation/batch
{
  "mcqIds": ["id1", "id2", "id3"],
  "mcqType": "MCQ"
}
```

---

## 🔒 Security Best Practices

### For Users:
- ✅ Never share your API key
- ✅ Keep key in secure location
- ✅ Revoke old keys when upgrading
- ✅ Monitor usage for anomalies

### For Admins:
- ✅ Use strong encryption key (32 chars)
- ✅ Store encryption key in environment variable
- ✅ Never commit keys to git
- ✅ Rotate encryption key periodically
- ✅ Set reasonable default quotas

---

## 📞 Need Help?

### Check These First:
1. **Console errors**: Open browser DevTools → Console
2. **Server logs**: Check terminal running server
3. **API status**: Visit OpenAI/Anthropic status pages
4. **Documentation**: Read `AI_EXPLANATION_SYSTEM.md`

### Common Questions:

**Q: Can I use both OpenAI and Anthropic?**  
A: Yes, but one at a time per user. Switch in settings.

**Q: What happens if I run out of quota?**  
A: You can still view cached explanations. New generations blocked until reset.

**Q: Are explanations saved permanently?**  
A: Yes, once generated, they're cached in database for all users.

**Q: Can I delete my API key?**  
A: Yes, in AI Settings → Remove button. Usage history preserved.

**Q: What subjects are supported?**  
A: All subjects in your MCQ database (Biology, Chemistry, Physics, English, Logic, etc.)

---

## 🎉 Success!

If you can:
- ✅ Save an API key
- ✅ Generate an explanation
- ✅ See it display with badge
- ✅ View usage stats

**You're all set!** The system is working perfectly.

---

## 📈 Next Steps

1. **Configure for all users**: Share setup guide
2. **Monitor costs**: Track token usage trends
3. **Optimize**: Generate explanations for popular MCQs
4. **Gather feedback**: Ask users about explanation quality
5. **Scale**: Adjust quotas based on usage patterns

---

**Happy Learning! 🎓✨**

For detailed technical information, see:
- `AI_EXPLANATION_SYSTEM.md` - Full documentation
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
