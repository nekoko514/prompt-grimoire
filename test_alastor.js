import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import 'dotenv/config';

const key = process.env.VITE_GEMINI_API_KEY;
const personaText = fs.readFileSync('./src/data/Alastor_Persona.txt', 'utf-8');

async function testAlastor() {
    console.log("Testing Alastor with gemini-flash-latest...\n");
    console.log(`Persona length: ${personaText.length} characters\n`);

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            systemInstruction: personaText,
        });

        const chat = model.startChat({
            generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.95,
            },
        });

        const result = await chat.sendMessage("こんにちは、アラスター");
        console.log("=== Alastor's Response ===\n");
        console.log(result.response.text());
        console.log("\n=== END ===");

    } catch (error) {
        console.error("Error:", error.message);
    }
}

testAlastor();
