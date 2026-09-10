import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Lisan Translation API"
  });
});

app.post("/translate", async (req, res) => {
  try {
    const { text, source, target } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "Text is required"
      });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key is not configured"
      });
    }

    const prompt = `
You are Lisan, a professional real-time conversational translator.

Translate the following message from ${source} to ${target}.

Rules:
- Return ONLY the translation.
- Do not explain.
- Do not add quotation marks.
- Preserve the exact meaning.
- Make it natural for everyday conversation.
- Do not add information.
- Do not remove information.

Text:
${text}
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);

      return res.status(response.status).json({
        error: data?.error?.message || "Gemini request failed"
      });
    }

    const translation =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!translation) {
      return res.status(500).json({
        error: "No translation returned"
      });
    }

    res.json({
      translation: translation.trim()
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Translation server error"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Lisan backend running on port ${PORT}`);
});
