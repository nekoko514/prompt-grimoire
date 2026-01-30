import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const key = process.env.VITE_GEMINI_API_KEY;
if (!key) process.exit(1);

const genAI = new GoogleGenerativeAI(key);

async function listModels() {
    console.log(`\nListing available models...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
        console.log("SUCCESS! Available models:");
        if (data.models) {
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(` - ${m.name}`);
                }
            });
        } else {
            console.log("No models found.");
        }
    } else {
        console.error("FAILED to list models! Error:");
        console.error(JSON.stringify(data, null, 2));
    }
}

async function run() {
    await listModels();
}

run();
