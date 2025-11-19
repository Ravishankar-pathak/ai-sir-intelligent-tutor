// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Only POST allowed" });
//   }

//   const { prompt } = req.body || {};
//   if (!prompt) {
//     return res.status(400).json({ error: "Prompt required" });
//   }

//   const key = process.env.GEMINI_API_KEY;
//   if (!key) {
//     return res.status(500).json({ error: "GEMINI_API_KEY missing" });
//   }

//   try {
//     const url =
//       "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
//       key;

//     const body = {
//       contents: [
//         {
//           parts: [{ text: prompt }]
//         }
//       ]
//     };

//     const resp = await fetch(url, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(body)
//     });

//     const data = await resp.json();

//     if (!resp.ok) {
//       return res.status(resp.status).json(data);
//     }

//     const text =
//       data?.candidates?.[0]?.content?.parts?.[0]?.text ||
//       JSON.stringify(data);

//     return res.status(200).json({ text });
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }
// }

















export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { prompt, imageBase64, history, systemPrompt } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: "Prompt required" });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "Server AI key missing" });
  }

  try {
    // ⭐ CHANGE MODEL HERE
    const model = "gemini-3.1-flash";

    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${key}`;

    // Convert chat history to Gemini format
    const convertedHistory = history.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    const contents = [...convertedHistory];

    // Add system prompt
    contents.push({
      role: "user",
      parts: [{ text: systemPrompt }]
    });

    // Handle image input
    if (imageBase64) {
      contents.push({
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64.split(",")[1]
            }
          }
        ]
      });
    }

    // Add user question
    contents.push({
      role: "user",
      parts: [{ text: prompt }]
    });

    const body = { contents };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const json = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: json });
    }

    const text =
      json?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "AI returned empty response";

    return res.status(200).json({ text, raw: json });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
