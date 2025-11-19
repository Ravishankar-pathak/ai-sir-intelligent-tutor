import { SYSTEM_PROMPT } from "../constants";

export const generateOllamaResponse = async (
  baseUrl: string,
  model: string,
  prompt: string,
  imageBase64: string | null,
  history: { role: string; content: string }[]
): Promise<string> => {
  
  // Format history
  let fullContext = `${SYSTEM_PROMPT}\n\n`;
  history.forEach(h => {
    fullContext += `${h.role.toUpperCase()}: ${h.content}\n`;
  });
  fullContext += `USER: ${prompt}\nASSISTANT:`;

  const payload: any = {
    model: model,
    prompt: fullContext,
    stream: false
  };

  // Note: Most standard Ollama text models (llama2, mistral) don't support images well via the generate endpoint 
  // unless using llava. If using llama3.2 (text only version), images might be ignored or cause errors.
  // We will try to send the image if provided, but user must ensure model supports it (like llava).
  if (imageBase64) {
    payload.images = [imageBase64.split(',')[1]]; // Base64 without header
  }

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Ollama connection failed. Ensure Ollama is running with OLLAMA_ORIGINS='*'");
    }

    const data = await response.json();
    return data.response;
  } catch (e) {
    console.error(e);
    throw new Error("Could not connect to Ollama. Make sure it is running and CORS is allowed.");
  }
};
