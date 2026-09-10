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
    service: "Lisan Translation API",
    model: "gemini-2.5-flash-lite"
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
You are Lisan, a real-time conversational translator.

Translate this message from ${source} to ${target}.

Rules:
- Return ONLY the translated sentence.
- No explanation.
- No quotation marks.
- Preserve the exact meaning.
- Make it natural and conversational.
- Do not add or remove information.

Text:
${text}
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
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
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 200
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", JSON.stringify(data, null, 2));

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini request failed"
      });
    }

    const translation =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!translation) {
      console.error(
        "Unexpected Gemini response:",
        JSON.stringify(data, null, 2)
      );

      return res.status(500).json({
        error: "Gemini returned no translation"
      });
    }

    res.json({
      translation
    });

  } catch (error) {
    console.error("Server error:", error);

    res.status(500).json({
      error: "Translation server error"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Lisan backend running on port ${PORT}`);
});
