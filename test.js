import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});
const base64ImageFile = fs.readFileSync("screenshot.png", {
    encoding: "base64",
});

const contents = [
    {
        inlineData: {
            mimeType: "image/png",
            data: base64ImageFile,
        },
    },
    { text: "Caption this image." },
];

const response = await ai.models.generateContent({
    model: "gemini-3-flash",
    contents: contents,
});
console.log(response.text);