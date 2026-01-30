import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const key = process.env.VITE_GEMINI_API_KEY;

async function testModel(modelName) {
    console.log(`\nTesting ${modelName}...`);
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say hello in one word.");
        console.log(`✓ SUCCESS: ${modelName}`);
        console.log(`  Response: ${result.response.text().substring(0, 50)}`);
        return modelName;
    } catch (error) {
        const msg = error.message.split('\n')[0];
        console.log(`✗ FAILED: ${msg.substring(0, 80)}`);
        return null;
    }
}

async function run() {
    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-flash-latest",
        "gemini-pro",
    ];

    console.log("=== Testing Available Gemini Models ===");

    for (const m of models) {
        const result = await testModel(m);
        if (result) {
            console.log(`\n>>> WORKING MODEL FOUND: ${result} <<<\n`);
            break;
        }
        // Small delay between requests
        await new Promise(r => setTimeout(r, 500));
    }
}

run();
