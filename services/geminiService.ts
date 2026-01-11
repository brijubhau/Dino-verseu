
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getGameNarration(score: number): Promise<string> {
  // Check for internet connection
  if (!navigator.onLine) {
    return "OFFLINE MODE: AI OVERSEER DISCONNECTED. PROCEED WITH CAUTION.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The player has reached a score of ${score} in a cyberpunk dinosaur escape game. 
      The dino is running through a glitching digital wasteland. 
      Generate a very short (max 12 words), epic, atmospheric narration or "system message" from an AI overseer. 
      Keep it cool, techy, and slightly mysterious.`,
      config: {
        temperature: 0.8,
        maxOutputTokens: 50,
      }
    });

    return response.text?.trim() || "Simulation integrity stable. Proceeding...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Neural link jittering... stay on track.";
  }
}

export async function getPowerUpName(type: string): Promise<string> {
    if (!navigator.onLine) return type;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a cool cyberpunk name for a power-up of type: ${type}. Max 2 words.`,
        config: {
          temperature: 0.9,
          maxOutputTokens: 20,
        }
      });
      return response.text?.trim() || type;
    } catch (e) {
        return type;
    }
}
