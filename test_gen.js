import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const key = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(key);

async function testGen(modelName) {
    console.log(`\nTesting ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello.");
        console.log(`SUCCESS with ${modelName}!`);
        return true;
    } catch (error) {
        console.log(`FAILED: ${error.message.split('\n')[0]}`);
        return false;
    }
}

async function run() {
    const candidates = [
        "gemini-flash-latest",
        "gemini-pro-latest",
        "gemini-exp-1206",
        "gemini-2.0-flash-exp"
    ];

    for (const m of candidates) {
        if (await testGen(m)) {
            console.log(`\n>>> FOUND WORKING MODEL: ${m} <<<`);
            return;
        }
    }
    console.log("\nALL MODELS FAILED.");
}

run();
