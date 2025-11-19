import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

export const generateGeminiResponse = async (
  apiKey: string, 
  prompt: string, 
  imageBase64: string | null,
  history: { role: string; content: string }[]
): Promise<string> => {
  if (!apiKey) throw new Error("Gemini API Key is required");

  const ai = new GoogleGenAI({ apiKey });
  
  // Gemini 1.5 Flash is excellent for multimodal (image + text) and speed
  // Note: Using the model name convention provided in instructions
  const modelId = 'gemini-2.5-flash'; 

  let contents: any[] = [];

  // Add history to context if it exists, formatted for Gemini
  // Ideally we would use the chat API, but for single turn mixed with images, 
  // we construct a content block.
  // For simplicity in this demo, we are appending history as text context or using chat if no image.
  
  // If there is an image, we treat it as a fresh generation with context
  if (imageBase64) {
     const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg', // Assuming JPEG for simplicity, could detect
        data: imageBase64.split(',')[1] // Remove data:image/jpeg;base64, prefix
      }
    };
    
    // Construct the full prompt including history context if needed
    // For a robust app, we'd summarize history, but here we append.
    const historyText = history.map(h => `${h.role}: ${h.content}`).join('\n');
    const fullPrompt = `${SYSTEM_PROMPT}\n\nPrevious conversation:\n${historyText}\n\nStudent's new input: ${prompt}`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [imagePart, { text: fullPrompt }]
      }
    });
    
    return response.text || "Sorry, I couldn't understand the image.";
  } else {
    // Text only chat
    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
      history: history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage({ message: prompt });
    return result.text || "Thinking...";
  }
};
