import { GoogleGenerativeAI } from '@google/generative-ai';
/**
 * AI Service for Google Gemini
 */
class AIService {
    constructor(provider, apiKey) {
        if (provider !== 'gemini') {
            throw new Error('Only Google Gemini is supported');
        }
        this.provider = provider;
        this.apiKey = apiKey;
        this.client = new GoogleGenerativeAI(this.apiKey);
    }
    /**
     * Generate MCQ explanation using AI
     * @param {Object} mcqData - MCQ question, options, correct answer
     * @returns {Promise<{explanation: string, tokensUsed: number}>}
     */
    async generateExplanation(mcqData) {
        const { question, options, correctOption, subject, difficulty } = mcqData;
        const prompt = this.buildPrompt(question, options, correctOption, subject, difficulty);
        try {
            return await this.generateWithGemini(prompt);
        }
        catch (error) {
            throw new Error(`AI generation failed: ${error.message}`);
        }
    }
    buildPrompt(question, options, correctOption, subject, difficulty) {
        const optionLabels = ['A', 'B', 'C', 'D'];
        const formattedOptions = options
            .map((opt, idx) => `${optionLabels[idx]}) ${opt}`)
            .join('\n');
        const correctLabel = optionLabels[correctOption - 1];
        const correctText = options[correctOption - 1];
        return `You are an expert educator specializing in ${subject}. A student needs help understanding the following MCQ.

**Question:**
${question}

**Options:**
${formattedOptions}

**Correct Answer:** ${correctLabel}) ${correctText}

**Task:** 
Provide a clear, step-by-step explanation of why option ${correctLabel} is correct. Your explanation should:
1. Be concise (2-3 sentences or a brief paragraph)
2. Explain the underlying concept
3. Show the reasoning process
4. Be appropriate for ${difficulty} difficulty level
5. Avoid unnecessary jargon but maintain accuracy
6. Be safe and educational for all audiences

You must follow the following format:
💡 Explanation:
<2–4 concise sentences explaining why the correct option is correct>

❌ <Option text> (Option <letter>):
<1 sentence explaining why this option is incorrect>

❌ <Option text> (Option <letter>):
<1 sentence explaining why this option is incorrect>

❌ <Option text> (Option <letter>):
<1 sentence explaining why this option is incorrect>

Rules:
- Use factual, textbook-level explanations
- No speculation
- No markdown
- No bullet points
- Emojis must be exactly as shown

Do not mention other options unless necessary for comparison. Focus on teaching the concept.`;
    }
    async generateWithGemini(prompt) {
        var _a, _b;
        const { HarmCategory, HarmBlockThreshold } = await import('@google/generative-ai');
        const model = this.client.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1000,
                topP: 0.95,
                topK: 40,
            },
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
            ],
        });
        const result = await model.generateContent(prompt);
        const response = result.response;
        // Check if response was blocked
        if (!response.candidates || response.candidates.length === 0) {
            throw new Error('Response was blocked by safety filters');
        }
        const candidate = response.candidates[0];
        if (candidate.finishReason === 'SAFETY') {
            throw new Error('Response blocked due to safety concerns');
        }
        const text = response.text();
        // Gemini token counting
        const tokensUsed = (((_a = response.usageMetadata) === null || _a === void 0 ? void 0 : _a.promptTokenCount) || 0) +
            (((_b = response.usageMetadata) === null || _b === void 0 ? void 0 : _b.candidatesTokenCount) || 0);
        return {
            explanation: text.trim(),
            tokensUsed: tokensUsed || this.constructor.estimateTokens(prompt + text),
            model: 'gemini-2.5-flash',
        };
    }
    /**
     * Generate chat response with context
     * @param {string} prompt - Context-aware chat prompt
     * @returns {Promise<{explanation: string, tokensUsed: number}>}
     */
    async generateChatResponse(prompt) {
        try {
            return await this.generateChatWithGemini(prompt);
        }
        catch (error) {
            throw new Error(`Chat generation failed: ${error.message}`);
        }
    }
    async generateChatWithGemini(prompt) {
        var _a, _b;
        const { HarmCategory, HarmBlockThreshold } = await import('@google/generative-ai');
        const model = this.client.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 400,
                topP: 0.95,
                topK: 40,
            },
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
            ],
        });
        const result = await model.generateContent(prompt);
        const response = result.response;
        if (!response.candidates || response.candidates.length === 0) {
            throw new Error('Response was blocked by safety filters');
        }
        const candidate = response.candidates[0];
        if (candidate.finishReason === 'SAFETY') {
            throw new Error('Response blocked due to safety concerns');
        }
        const text = response.text();
        const tokensUsed = (((_a = response.usageMetadata) === null || _a === void 0 ? void 0 : _a.promptTokenCount) || 0) +
            (((_b = response.usageMetadata) === null || _b === void 0 ? void 0 : _b.candidatesTokenCount) || 0);
        return {
            explanation: text.trim(),
            tokensUsed: tokensUsed || this.constructor.estimateTokens(prompt + text),
            model: 'gemini-2.5-flash',
        };
    }
    /**
     * Estimate token count for a prompt (rough approximation)
     */
    static estimateTokens(text) {
        // Rough estimate: 1 token ≈ 4 characters
        return Math.ceil(text.length / 4);
    }
}
export default AIService;
