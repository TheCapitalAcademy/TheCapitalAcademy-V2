import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Service abstraction layer
 * Supports multiple AI providers with BYO API Key model
 */
class AIService {
    constructor(provider, apiKey) {
        this.provider = provider;
        this.apiKey = apiKey;
        this.client = null;
        this.initializeClient();
    }

    initializeClient() {
        switch (this.provider) {
            case 'openai':
                this.client = new OpenAI({ apiKey: this.apiKey });
                break;
            case 'anthropic':
                this.client = new Anthropic({ apiKey: this.apiKey });
                break;
            case 'gemini':
                this.client = new GoogleGenerativeAI(this.apiKey);
                break;
            default:
                throw new Error(`Unsupported AI provider: ${this.provider}`);
        }
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
            if (this.provider === 'openai') {
                return await this.generateWithOpenAI(prompt);
            } else if (this.provider === 'anthropic') {
                return await this.generateWithAnthropic(prompt);
            } else if (this.provider === 'gemini') {
                return await this.generateWithGemini(prompt);
            }
        } catch (error) {
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

    async generateWithOpenAI(prompt) {
        const response = await this.client.chat.completions.create({
            model: 'gpt-4o-mini', // Cost-effective model
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert educator who provides clear, concise explanations for multiple-choice questions.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 300, // Limit response length
        });

        return {
            explanation: response.choices[0].message.content.trim(),
            tokensUsed: response.usage.total_tokens,
            model: response.model,
        };
    }

    async generateWithAnthropic(prompt) {
        const response = await this.client.messages.create({
            model: 'claude-3-5-haiku-20241022', // Cost-effective model
            max_tokens: 300,
            temperature: 0.7,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
        });

        // Anthropic uses different token counting
        const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

        return {
            explanation: response.content[0].text.trim(),
            tokensUsed: tokensUsed,
            model: response.model,
        };
    }

    async generateWithGemini(prompt) {
        const { HarmCategory, HarmBlockThreshold } = await import('@google/generative-ai');
        
        const model = this.client.getGenerativeModel({ 
            model: 'gemini-2.5-flash', // Fast and cost-effective model
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
        const tokensUsed = (response.usageMetadata?.promptTokenCount || 0) + 
                          (response.usageMetadata?.candidatesTokenCount || 0);

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
            if (this.provider === 'openai') {
                return await this.generateChatWithOpenAI(prompt);
            } else if (this.provider === 'anthropic') {
                return await this.generateChatWithAnthropic(prompt);
            } else if (this.provider === 'gemini') {
                return await this.generateChatWithGemini(prompt);
            }
        } catch (error) {
            throw new Error(`Chat generation failed: ${error.message}`);
        }
    }

    async generateChatWithOpenAI(prompt) {
        const response = await this.client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert educator helping students understand MCQ questions. Only answer questions related to the specific MCQ provided.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 400,
        });

        return {
            explanation: response.choices[0].message.content.trim(),
            tokensUsed: response.usage.total_tokens,
            model: response.model,
        };
    }

    async generateChatWithAnthropic(prompt) {
        const response = await this.client.messages.create({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 400,
            temperature: 0.7,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
        });

        const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

        return {
            explanation: response.content[0].text.trim(),
            tokensUsed: tokensUsed,
            model: response.model,
        };
    }

    async generateChatWithGemini(prompt) {
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
        const tokensUsed = (response.usageMetadata?.promptTokenCount || 0) + 
                          (response.usageMetadata?.candidatesTokenCount || 0);

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
