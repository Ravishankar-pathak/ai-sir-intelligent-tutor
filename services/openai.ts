import { SYSTEM_PROMPT } from "../constants";

export const generateOpenAIResponse = async (
  apiKey: string,
  prompt: string,
  imageBase64: string | null,
  history: { role: string; content: string }[]
): Promise<string> => {
  if (!apiKey) throw new Error("OpenAI API Key is required");

  const messages: any[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map(h => ({ role: h.role, content: h.content }))
  ];

  if (imageBase64) {
    // GPT-4o supports vision
    messages.push({
      role: "user",
      content: [
        { type: "text", text: prompt },
        {
          type: "image_url",
          image_url: {
            url: imageBase64
          }
        }
      ]
    });
  } else {
    messages.push({ role: "user", content: prompt });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "OpenAI API Error");
  }

  const data = await response.json();
  return data.choices[0].message.content;
};
