# Google Gemini Setup Guide

## ✨ What's New

Your AI Explanation System now supports **Google Gemini 1.5 Flash** - the fastest and most cost-effective option!

### Why Gemini?

- **50% Cheaper** than OpenAI ($0.075 vs $0.15 per 1M tokens)
- **13x Cheaper** than Anthropic ($0.075 vs $1.00)
- **Very Fast** response times
- **Excellent** quality explanations

---

## 🚀 Quick Setup (2 minutes)

### 1. Get Your Gemini API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (starts with `AIza...`)

### 2. Configure in Dashboard

1. Go to: `/dashboard/ai-settings`
2. Select **"Google Gemini 1.5 Flash"** from provider dropdown
3. Paste your API key
4. Click **"Test Key"** to verify
5. Click **"Save API Key"**

### 3. Start Using!

- Navigate to any MCQ
- Answer the question
- Click "View Explanation"
- ✨ AI will generate it instantly!

---

## 📊 Cost Comparison

| Provider | Model | Cost/1M tokens | 50k tokens |
|----------|-------|----------------|------------|
| **Gemini** | 1.5 Flash | **$0.075** | **$0.004** |
| OpenAI | GPT-4o Mini | $0.15 | $0.008 |
| Anthropic | Claude 3.5 Haiku | $1.00 | $0.050 |

**With 50,000 token monthly quota:**
- Gemini: ~$0.004/month (~200 explanations)
- OpenAI: ~$0.008/month
- Anthropic: ~$0.050/month

---

## 🔐 API Key Format

**Gemini keys start with:** `AIza...`

Example: `AIzaSyD-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Valid key format:**
- Starts with `AIza`
- ~39 characters long
- Alphanumeric with hyphens

---

## 🎯 Features

All features work exactly the same with Gemini:

✅ Automatic explanation generation  
✅ Token usage tracking  
✅ Monthly quota (50,000 tokens)  
✅ Caching (first user pays, others get free)  
✅ Secure encryption  
✅ Test before saving  
✅ Usage statistics  

---

## 🧪 Testing Your Key

After entering your key, click **"Test Key"** to verify:

**What it tests:**
1. Valid API key format
2. Active API key (not revoked)
3. Generates a test explanation
4. Returns token count

**Success response:**
```
✅ API key is valid and working
Test explanation generated using 45 tokens
```

---

## 🛠️ Technical Details

### Model Used
- **Gemini 1.5 Flash**
- Fast inference (<2 seconds)
- 300 max output tokens
- Temperature: 0.7

### Integration
```javascript
// AI Service automatically detects provider
const aiService = new AIService('gemini', apiKey);
const result = await aiService.generateExplanation(mcqData);
```

### Token Counting
Gemini provides accurate token counts:
```javascript
tokensUsed = promptTokens + outputTokens
```

---

## 📈 Dashboard Navigation

New **"AI Settings"** button added to dashboard sidebar:

```
📊 Stats
📅 Study Planner
🔖 Saved MCQs
👥 Test Series
🔔 Subscriptions
✨ AI Settings     ← NEW!
👤 Profile
```

Location: Above Profile button  
Icon: Sparkles (✨)  
Path: `/dashboard/ai-settings`

---

## 🔄 Switching Providers

You can switch between providers anytime:

1. Go to AI Settings
2. Select different provider
3. Enter new API key
4. Test and save

**Note:** Only one provider active at a time per user

---

## ⚡ Performance

### Average Response Times
- Gemini: 1-2 seconds
- OpenAI: 2-3 seconds
- Anthropic: 3-4 seconds

### Token Usage
- Simple explanation: ~150-200 tokens
- Complex explanation: ~250-300 tokens
- Cached explanation: **0 tokens** ✨

---

## 🐛 Troubleshooting

### "Invalid Gemini API key"
**Check:**
- Key starts with `AIza`
- No spaces before/after
- Not revoked in Google Cloud Console

### "API key validation failed"
**Solutions:**
1. Verify key is active at https://makersuite.google.com
2. Check if API is enabled
3. Try regenerating the key

### Rate Limits
Gemini free tier limits:
- 15 requests per minute
- 1,500 requests per day

**If hit:**
- Wait a few minutes
- Upgrade to paid tier for higher limits

---

## 💡 Best Practices

### For Maximum Savings
1. **Use Gemini** (cheapest option)
2. **Generate popular MCQs first** (caching benefits all users)
3. **Monitor usage** in dashboard
4. **Stay within quota** (50k tokens/month)

### For Best Performance
1. Gemini is fastest option
2. Cached explanations load instantly
3. Generate during off-peak hours for lowest latency

---

## 🔒 Security

Your Gemini API key is:
- ✅ Encrypted with AES-256-CBC
- ✅ Never logged or displayed after save
- ✅ Only decrypted for API calls
- ✅ Stored securely in database

**Environment Variable Required:**
```env
AI_KEY_ENCRYPTION_SECRET=YourSecure32CharacterSecretKey!
```

---

## 📚 Additional Resources

- **Gemini API Docs**: https://ai.google.dev/docs
- **Pricing**: https://ai.google.dev/pricing
- **API Keys**: https://makersuite.google.com/app/apikey
- **Status**: https://status.cloud.google.com

---

## 🎉 Success Checklist

- [ ] Installed `@google/generative-ai` package
- [ ] Got Gemini API key from makersuite.google.com
- [ ] Configured in AI Settings dashboard
- [ ] Tested key successfully
- [ ] Generated first explanation
- [ ] Verified usage tracking works
- [ ] Checked cost savings vs other providers

---

## 📞 Support

If you encounter issues:

1. **Check API Key**: Verify in Google Cloud Console
2. **Test Key**: Use dashboard test function
3. **Check Quota**: View usage stats in dashboard
4. **Server Logs**: Check terminal for errors
5. **Browser Console**: Check for frontend errors

---

## 🚀 What's Installed

New dependency added:
```json
{
  "@google/generative-ai": "^0.x.x"
}
```

Updated files:
- ✅ `server/services/ai/aiService.js` - Added Gemini support
- ✅ `server/middleware/ai.middleware.js` - Added Gemini validation
- ✅ `src/components/dashboard/AISettings.tsx` - Added Gemini UI
- ✅ `src/app/dashboard/layout.tsx` - Added navigation button
- ✅ `src/app/dashboard/ai-settings/page.tsx` - Created page route

---

**Ready to save money and get faster explanations? Set up Gemini now!** 🚀✨

For full system documentation, see:
- `README_AI_SYSTEM.md` - Complete overview
- `QUICK_START.md` - Setup guide
- `API_EXAMPLES.md` - API reference
