import axios from "axios";

export interface AISubmissionDetails {
  name: string;
  company: string;
  industry: string;
  budget: number;
  notes: string;
}

export class AIProviderService {
  private apiKey: string;
  private provider: string; // "gemini" | "openai"

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || "";
    this.provider = process.env.GEMINI_API_KEY ? "gemini" : "openai";
  }

  async generateLeadSummary(details: AISubmissionDetails): Promise<string> {
    if (!this.apiKey) {
      // Deterministic fallback generator
      return `${details.name} is a contact from ${details.company || "an unlisted firm"} in the ${details.industry || "general"} sector. They have a budget of $${details.budget.toLocaleString()} and noted: "${details.notes || "None"}".`;
    }

    try {
      if (this.provider === "gemini") {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: `Summarize this sales lead opportunity in 2 sentences:\nName: ${details.name}\nCompany: ${details.company}\nIndustry: ${details.industry}\nBudget: $${details.budget}\nNotes: ${details.notes}`,
                  },
                ],
              },
            ],
          }
        );
        return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to parse Gemini summary.";
      } else {
        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "user",
                content: `Summarize this sales lead opportunity in 2 sentences:\nName: ${details.name}\nCompany: ${details.company}\nIndustry: ${details.industry}\nBudget: $${details.budget}\nNotes: ${details.notes}`,
              },
            ],
          },
          { headers: { Authorization: `Bearer ${this.apiKey}` } }
        );
        return response.data?.choices?.[0]?.message?.content || "Failed to parse OpenAI summary.";
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("[AI Provider Service] Error generating lead summary:", errorMessage);
      return "Unable to compile AI summaries at this moment.";
    }
  }

  async computeLeadScore(details: AISubmissionDetails): Promise<number> {
    if (!this.apiKey) {
      // Rule-based deterministic lead score fallback
      let score = 50;
      if (details.budget > 50000) score += 20;
      if (details.notes && details.notes.toLowerCase().includes("urgent")) score += 15;
      if (details.industry === "Technology" || details.industry === "Software") score += 10;
      return Math.min(score, 100);
    }

    try {
      const prompt = `Based on the following lead opportunity details, return ONLY an integer between 1 and 100 representing the purchase intent index. Do not write text, only a single number:\nName: ${details.name}\nCompany: ${details.company}\nIndustry: ${details.industry}\nBudget: $${details.budget}\nNotes: ${details.notes}`;
      
      if (this.provider === "gemini") {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
          { contents: [{ parts: [{ text: prompt }] }] }
        );
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const score = parseInt(text.trim(), 10);
        return isNaN(score) ? 65 : score;
      } else {
        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
          },
          { headers: { Authorization: `Bearer ${this.apiKey}` } }
        );
        const text = response.data?.choices?.[0]?.message?.content || "";
        const score = parseInt(text.trim(), 10);
        return isNaN(score) ? 65 : score;
      }
    } catch {
      return 60; // Safe default
    }
  }
}
export const aiProvider = new AIProviderService();
