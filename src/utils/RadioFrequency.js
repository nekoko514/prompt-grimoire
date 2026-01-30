import { GoogleGenerativeAI } from "@google/generative-ai";
import personaText from '../data/Alastor_Persona.txt?raw';
import MemoryCore from './MemoryCore';

class RadioFrequency {
    constructor() {
        // Check sessionStorage first (user-entered key), then environment variable
        this.apiKey = sessionStorage.getItem('geminiApiKey') || import.meta.env.VITE_GEMINI_API_KEY || '';
        this.basePrompt = personaText;
        this.genAI = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;
    }

    setApiKey(key) {
        this.apiKey = key;
        this.genAI = key ? new GoogleGenerativeAI(key) : null;
        console.log('[RadioFrequency] API Key updated');
    }

    async getEnhancedPrompt() {
        try {
            // Ensure MemoryCore is initialized
            await MemoryCore.init();

            // Get memory and knowledge to add to the prompt
            const memoryText = await MemoryCore.getMemoriesAsText();
            const knowledgeText = await MemoryCore.getKnowledgeAsText();

            return this.basePrompt + memoryText + knowledgeText;
        } catch (error) {
            console.error('Error getting enhanced prompt:', error);
            return this.basePrompt; // Fallback to base prompt
        }
    }

    async transmit(userMessage, history = []) {
        // Fallback to Mock if no key
        if (!this.apiKey || !this.genAI) {
            console.warn("No API Key configured. Returning Mock Response.");
            return this.mockResponse(userMessage);
        }

        try {
            // Get enhanced prompt with memory and knowledge
            const enhancedPrompt = await this.getEnhancedPrompt();

            // Create model with dynamic system instruction
            const model = this.genAI.getGenerativeModel({
                model: "gemini-flash-latest",
                systemInstruction: enhancedPrompt,
            });

            // Construct history for the API
            const apiHistory = history.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            const chat = model.startChat({
                history: apiHistory,
                generationConfig: {
                    maxOutputTokens: 4096,
                    temperature: 0.95,
                },
            });

            const result = await chat.sendMessage(userMessage);
            const response = result.response;
            const text = response.text();
            console.log('[RadioFrequency] Response length:', text.length, 'chars');
            return text;

        } catch (error) {
            console.error("Transmission Error:", error);
            return this.mockResponse(userMessage);
        }
    }

    async mockResponse(input) {
        await new Promise(resolve => setTimeout(resolve, 1500));

        const responses = [
            "ハハッ！なんて愉快な提案でしょう！",
            "おや、何か言いましたか？電波が少し...乱れているようです。",
            "エンターテイメント！この世界で最も不足しているものですね！",
            "*ラジオノイズ* ...そのままお待ちください...",
            "おやまあ、ごきげんよう！相変わらず酷い顔色ですね！",
            "こんなに楽しませてもらったのは、1929年の大暴落以来ですよ！",
            "笑顔を忘れずに！笑顔なしでは「完全」とは言えませんから。",
            "これは...「インターネット」というやつですか？なんとも旧式な。",
            "素晴らしい！実に素晴らしい！",
            "退屈は私の最大の敵ですが、君はなかなか楽しませてくれますね。"
        ];

        const lowerInput = input.toLowerCase();
        if (lowerInput.includes("hello") || lowerInput.includes("こんにちは")) {
            return "ごきげんよう！放送の時間ですよ！";
        }
        if (lowerInput.includes("who are you") || lowerInput.includes("誰") || lowerInput.includes("だれ")) {
            return "アラスター！ラジオ・デーモン、以後お見知り置きを！ *録音された笑い声*";
        }
        if (lowerInput.includes("test") || lowerInput.includes("テスト")) {
            return "マイクテスト、ワン、ツー！入ってますか？";
        }

        return responses[Math.floor(Math.random() * responses.length)];
    }
}

export default new RadioFrequency();
