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
    return res.status(500).json({ error: "GEMINI_API_KEY missing" });
  }

  try {
    const model = "gemini-1.5-flash-latest";  // ✔ WORKING MODEL

    const url =
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=` +
      key;

    const body = {
      contents: [
        {
          parts: [
            imageBase64
              ? {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: imageBase64.split(",")[1],
                  },
                }
              : null,
            { text: `${systemPrompt}\n\n${prompt}` },
          ].filter(Boolean),
        },
      ],
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return res.status(resp.status).json({ error: data });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      JSON.stringify(data);

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
