# API Examples - AI Explanation System

## Table of Contents
1. [AI Settings Management](#ai-settings-management)
2. [Explanation Generation](#explanation-generation)
3. [Error Scenarios](#error-scenarios)
4. [Admin Operations](#admin-operations)

---

## AI Settings Management

### 1. Get Current AI Configuration

**Request:**
```http
GET /api/v1/ai-settings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success - 200 OK):**
```json
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
  "preferences": {
    "autoGenerate": true,
    "maxTokensPerExplanation": 300,
    "preferredModel": "gpt-4o-mini"
  },
  "usagePercentage": 4.9
}
```

**Response (No Configuration - 200 OK):**
```json
{
  "aiProvider": "none",
  "hasApiKey": false,
  "tokenUsage": {
    "currentMonth": 0,
    "totalUsed": 0,
    "lastResetDate": "2026-01-16T10:30:00.000Z"
  },
  "tokenQuota": 50000,
  "isEnabled": true,
  "preferences": {
    "autoGenerate": true,
    "maxTokensPerExplanation": 300
  },
  "usagePercentage": 0
}
```

---

### 2. Test API Key (Before Saving)

**Request:**
```http
POST /api/v1/ai-settings/test-key
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "aiProvider": "openai",
  "apiKey": "sk-proj-abc123xyz456..."
}
```

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "message": "API key is valid and working",
  "testResult": {
    "explanation": "The number 4 is correct because when you add 2 and 2 together, you perform basic addition: 2 + 2 = 4. This is a fundamental arithmetic operation that demonstrates how combining two equal quantities results in their sum.",
    "tokensUsed": 156,
    "model": "gpt-4o-mini-2024-07-18"
  }
}
```

**Response (Invalid Key - 400 Bad Request):**
```json
{
  "success": false,
  "error": "API key validation failed",
  "message": "Incorrect API key provided: sk-proj-abc1***xyz4. You can find your API key at https://platform.openai.com/account/api-keys."
}
```

**Response (Invalid Format - 400 Bad Request):**
```json
{
  "error": "Invalid OpenAI API key",
  "message": "OpenAI API keys should start with \"sk-\""
}
```

---

### 3. Save API Key

**Request:**
```http
PUT /api/v1/ai-settings/provider
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "aiProvider": "openai",
  "apiKey": "sk-proj-abc123xyz456..."
}
```

**Response (Success - 200 OK):**
```json
{
  "message": "AI provider updated successfully",
  "aiProvider": "openai",
  "hasApiKey": true
}
```

---

### 4. Remove API Key

**Request:**
```http
DELETE /api/v1/ai-settings/provider
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success - 200 OK):**
```json
{
  "message": "API key removed successfully"
}
```

---

### 5. Update Preferences

**Request:**
```http
PUT /api/v1/ai-settings/preferences
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "autoGenerate": true,
  "maxTokensPerExplanation": 250,
  "preferredModel": "gpt-4o-mini"
}
```

**Response (Success - 200 OK):**
```json
{
  "message": "Preferences updated successfully",
  "preferences": {
    "autoGenerate": true,
    "maxTokensPerExplanation": 250,
    "preferredModel": "gpt-4o-mini"
  }
}
```

---

### 6. Get Usage History

**Request:**
```http
GET /api/v1/ai-settings/usage-history?limit=10&skip=0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success - 200 OK):**
```json
{
  "total": 45,
  "history": [
    {
      "_id": "65abc123def456...",
      "date": "2026-01-16T14:23:15.000Z",
      "tokensUsed": 245,
      "action": "explanation_generated",
      "mcqId": {
        "_id": "64xyz789...",
        "question": "What is the primary function of mitochondria?",
        "subject": "biology"
      },
      "mcqType": "MCQ"
    },
    {
      "_id": "65abc124def457...",
      "date": "2026-01-16T13:15:42.000Z",
      "tokensUsed": 198,
      "action": "explanation_generated",
      "mcqId": {
        "_id": "64xyz790...",
        "question": "Calculate the acceleration of an object...",
        "subject": "physics"
      },
      "mcqType": "MCQ"
    },
    {
      "_id": "65abc125def458...",
      "date": "2026-01-01T00:00:00.000Z",
      "tokensUsed": 0,
      "action": "quota_reset",
      "mcqId": null,
      "mcqType": null
    }
  ]
}
```

---

## Explanation Generation

### 1. Generate Single Explanation (First Time)

**Request:**
```http
POST /api/v1/explanation/generate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "mcqId": "64abc123def456...",
  "mcqType": "MCQ"
}
```

**Response (Success - AI Generated - 200 OK):**
```json
{
  "explanation": "Mitochondria are often referred to as the 'powerhouses' of the cell because their primary function is to produce ATP (adenosine triphosphate), which is the main energy currency used by cells. Through a process called cellular respiration, mitochondria convert nutrients like glucose into ATP, providing the energy needed for various cellular activities. This makes option B correct, as energy production is the fundamental role of mitochondria in maintaining cellular function.",
  "source": "ai_generated",
  "cached": false,
  "tokensUsed": 245,
  "model": "gpt-4o-mini-2024-07-18",
  "remainingQuota": 49755
}
```

---

### 2. Get Cached Explanation (Subsequent Request)

**Request:**
```http
POST /api/v1/explanation/generate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "mcqId": "64abc123def456...",
  "mcqType": "MCQ"
}
```

**Response (Success - Cached - 200 OK):**
```json
{
  "explanation": "Mitochondria are often referred to as the 'powerhouses' of the cell because their primary function is to produce ATP (adenosine triphosphate)...",
  "source": "database",
  "cached": true,
  "tokensUsed": 0
}
```

---

### 3. Batch Generate Explanations

**Request:**
```http
POST /api/v1/explanation/batch
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "mcqIds": [
    "64abc123def456...",
    "64abc124def457...",
    "64abc125def458..."
  ],
  "mcqType": "MCQ"
}
```

**Response (Success - 200 OK):**
```json
{
  "summary": {
    "total": 3,
    "succeeded": 2,
    "skipped": 1,
    "failed": 0,
    "totalTokensUsed": 485
  },
  "results": [
    {
      "mcqId": "64abc123def456...",
      "status": "success",
      "tokensUsed": 245
    },
    {
      "mcqId": "64abc124def457...",
      "status": "skipped",
      "reason": "Explanation already exists"
    },
    {
      "mcqId": "64abc125def458...",
      "status": "success",
      "tokensUsed": 240
    }
  ],
  "errors": [],
  "remainingQuota": 49515
}
```

---

## Error Scenarios

### 1. No API Key Configured

**Request:**
```http
POST /api/v1/explanation/generate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "mcqId": "64abc123def456...",
  "mcqType": "MCQ"
}
```

**Response (403 Forbidden):**
```json
{
  "error": "API key not configured",
  "message": "Please add your AI provider API key in settings",
  "action": "api_key_required"
}
```

---

### 2. Quota Exceeded

**Response (429 Too Many Requests):**
```json
{
  "error": "Quota exceeded",
  "message": "You have reached your monthly token quota",
  "usage": {
    "current": 50000,
    "limit": 50000,
    "resetsAt": "2026-02-01T00:00:00.000Z"
  }
}
```

---

### 3. Invalid API Key

**Response (401 Unauthorized):**
```json
{
  "error": "Invalid API key",
  "message": "Your AI provider API key appears to be invalid. Please update it in settings."
}
```

---

### 4. Rate Limit from Provider

**Response (429 Too Many Requests):**
```json
{
  "error": "Rate limit exceeded",
  "message": "Your AI provider rate limit has been exceeded. Please try again later."
}
```

---

### 5. MCQ Not Found

**Response (404 Not Found):**
```json
{
  "error": "MCQ not found",
  "message": "The requested MCQ does not exist"
}
```

---

### 6. Authentication Required

**Response (401 Unauthorized):**
```json
{
  "error": "Authentication required",
  "message": "Please log in to use AI features"
}
```

---

## Admin Operations

### 1. Get System-Wide Statistics (Custom Endpoint)

**Request:**
```http
GET /api/v1/ai-settings/admin/stats
Authorization: Bearer ADMIN_JWT_TOKEN
```

**Response (Success - 200 OK):**
```json
{
  "totalUsers": 150,
  "usersWithApiKey": 87,
  "totalExplanationsGenerated": 1245,
  "totalTokensUsed": 312450,
  "averageTokensPerUser": 3593,
  "topUsers": [
    {
      "userId": "64user123...",
      "username": "john_doe",
      "tokensUsed": 15000
    },
    {
      "userId": "64user124...",
      "username": "jane_smith",
      "tokensUsed": 12500
    }
  ],
  "explanationsBySubject": {
    "biology": 450,
    "chemistry": 320,
    "physics": 275,
    "english": 150,
    "logic": 50
  }
}
```

---

### 2. Adjust User Quota (Custom Endpoint)

**Request:**
```http
PUT /api/v1/ai-settings/admin/quota/:userId
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "tokenQuota": 100000
}
```

**Response (Success - 200 OK):**
```json
{
  "message": "Quota updated successfully",
  "userId": "64user123...",
  "newQuota": 100000,
  "previousQuota": 50000
}
```

---

## cURL Examples

### Test API Key
```bash
curl -X POST http://localhost:8080/api/v1/ai-settings/test-key \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "aiProvider": "openai",
    "apiKey": "sk-proj-abc123..."
  }'
```

### Generate Explanation
```bash
curl -X POST http://localhost:8080/api/v1/explanation/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mcqId": "64abc123def456...",
    "mcqType": "MCQ"
  }'
```

### Get Usage Stats
```bash
curl -X GET http://localhost:8080/api/v1/ai-settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Postman Collection

### Import this JSON into Postman:

```json
{
  "info": {
    "name": "AI Explanation System",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "AI Settings",
      "item": [
        {
          "name": "Get Config",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/v1/ai-settings",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "ai-settings"]
            }
          }
        },
        {
          "name": "Test API Key",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"aiProvider\": \"openai\",\n  \"apiKey\": \"sk-proj-...\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/v1/ai-settings/test-key",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "ai-settings", "test-key"]
            }
          }
        },
        {
          "name": "Save API Key",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"aiProvider\": \"openai\",\n  \"apiKey\": \"sk-proj-...\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/v1/ai-settings/provider",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "ai-settings", "provider"]
            }
          }
        }
      ]
    },
    {
      "name": "Explanations",
      "item": [
        {
          "name": "Generate Explanation",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"mcqId\": \"{{mcq_id}}\",\n  \"mcqType\": \"MCQ\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/v1/explanation/generate",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "explanation", "generate"]
            }
          }
        },
        {
          "name": "Batch Generate",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"mcqIds\": [\"id1\", \"id2\", \"id3\"],\n  \"mcqType\": \"MCQ\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/v1/explanation/batch",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "explanation", "batch"]
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8080",
      "type": "string"
    },
    {
      "key": "jwt_token",
      "value": "your_jwt_token_here",
      "type": "string"
    }
  ]
}
```

---

## WebSocket Events (Future Enhancement)

If you add real-time updates:

```javascript
// Client subscribes
socket.emit('subscribe:ai-usage', { userId: '64user123...' });

// Server sends updates
socket.on('ai-usage:updated', (data) => {
  console.log('Token usage updated:', data);
  // {
  //   currentMonth: 2695,
  //   totalUsed: 9165,
  //   percentage: 5.39
  // }
});

// Explanation generated event
socket.on('explanation:generated', (data) => {
  console.log('New explanation:', data);
  // {
  //   mcqId: '64abc123...',
  //   tokensUsed: 245,
  //   source: 'ai_generated'
  // }
});
```

---

These examples cover all the main API endpoints and error scenarios for the AI Explanation System.
