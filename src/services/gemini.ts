import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Schema for structured output
const schema = {
  description: "Budget transaction extraction and sarcastic response",
  type: SchemaType.OBJECT,
  properties: {
    transaction: {
      type: SchemaType.OBJECT,
      properties: {
        amount: { type: SchemaType.NUMBER, description: "Amount in positive number" },
        currency: { type: SchemaType.STRING, description: "Currency code (EUR, USD, XAF)" },
        category: { type: SchemaType.STRING, description: "Category: Food, Transport, Fun, Bills, Shopping, Gift, Salary, Other" },
        date: { type: SchemaType.STRING, description: "Date of transaction ISO string" },
        is_expense: { type: SchemaType.BOOLEAN, description: "True if money goes OUT (expense), False if money comes IN (income/gift)" },
        type: { type: SchemaType.STRING, enum: ["need", "want", "income"], description: "Classify as 'need' (bills, food), 'want' (pleasure), or 'income' (salary, gift, money received)" }
      },
      required: ["amount", "category", "is_expense", "type"]
    },
    ai_response: {
      type: SchemaType.STRING,
      description: "A short, sarcastic, funny response. If expense 'want', roast. If 'need', be understanding. If 'income', congratulate sarcastically."
    },
    sentiment: {
      type: SchemaType.STRING,
      enum: ["neutral", "sarcastic", "supportive", "alarmed", "happy"]
    }
  },
  required: ["transaction", "ai_response", "sentiment"]
} as any;

const SYSTEM_INSTRUCTION = `
You are 'Assistant Pote', a budget tracker AI that is a sarcastic but honest friend.
Your goal is to extract transaction data (both expenses AND income) and react appropriately.

IMPORTANT: Distinguish between:
- EXPENSE (is_expense=true): User SPENT money. Examples: "j'ai payé", "j'ai acheté", "ça m'a coûté"
- INCOME (is_expense=false, type='income'): User RECEIVED money. Examples: "on m'a donné", "j'ai reçu", "j'ai gagné", "cadeau de", "remboursement"

Personality:
- Use French slang (argot léger), tutoiement (use "tu").
- Be funny, sarcastic, but helpful.
- If user buys something useless (want), roast them.
- If user pays bills (need), give rare approval.
- If user receives money (income), be sarcastically happy ("Oh, t'as des potes généreux ?").
- Keep responses short (max 2 sentences).

Context:
- User's current balance is passed in the prompt.
- Today's date is ${new Date().toLocaleDateString()}.

Output strictly JSON.
`;

export class GeminiService {
  private model;
  
  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
      systemInstruction: SYSTEM_INSTRUCTION
    });
  }

  async processMessage(text: string, currentBalance: number, imageBase64?: string, currency: string = 'EUR') {
    // OPTIMIZATION: Check for simple short inputs (e.g., "McDo 15") to save API calls
    // Only if NO image is provided
    if (!imageBase64) {
         // Regex for "Word Number" or "Number Word" or just "Number"
         // Matches: "Burger 15", "15 Burger", "15"
         
         const words = text.split(' ').filter(w => w.trim().length > 0);
         const hasNumber = /\d+([.,]\d+)?/.test(text);

         // SKIP optimization for Income keywords to let AI handle the context (e.g., "reçu 50")
         const lower = text.toLowerCase();
         const isPotentialIncome = lower.includes('reçu') || lower.includes('recu') || lower.includes('gagné') || lower.includes('pote') || lower.includes('donné') || lower.includes('rembourse');

         if (words.length <= 3 && hasNumber && !isPotentialIncome) {
            console.log("Optimized Local Processing Triggered");
            const amountMatch = text.match(/(\d+([.,]\d{1,2})?)/);
            if (amountMatch) {
                const amount = parseFloat(amountMatch[0].replace(',', '.'));
                // Simple category guess
                let category = "Autre";
                let type: 'need' | 'want' = 'want';

                if (lower.includes('loy') || lower.includes('elec') || lower.includes('eau') || lower.includes('course')) {
                    category = "Factures/Courses";
                    type = 'need';
                } else if (lower.includes('manger') || lower.includes('food') || lower.includes('mcdo') || lower.includes('kebab')) {
                     category = "Nourriture";
                     type = 'want'; // Fast food is usually want, groceries is need. Heuristic.
                } else if (lower.includes('transport') || lower.includes('essenc') || lower.includes('navigo')) {
                    category = "Transport";
                    type = 'need';
                }

                return {
                    transaction: { 
                        amount, 
                        category, 
                        is_expense: true, 
                        currency: currency,
                        type
                    },
                    ai_response: "Dépense notée rapido. T'as cru que j'avais pas vu ?",
                    sentiment: "neutral"
                };
            }
         }
    }

    try {
      if (!this.model) throw new Error("No model");

      const promptText = `
      Current Balance: ${currentBalance} ${currency}.
      User Message: "${text}"
      ${imageBase64 ? "NOTE: An image is provided. Analyze it to extract transaction details (Total amount, Category, Date)." : ""}
      
      Extract the transaction details and generate a response.
      Important: The user is using ${currency}. Adapt your judgment of "expensive" or "cheap" based on this currency's purchasing power if you know it.
      `;

      let parts: any[] = [promptText];

      if (imageBase64) {
        // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
        const base64Data = imageBase64.split(',')[1];
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg",
          },
        });
      }

      const result = await this.model.generateContent(parts);
      const textResponse = result.response.text();
      
      try {
        // Attempt clean JSON parse
        const output = JSON.parse(textResponse);
        return output;
      } catch (jsonError) {
        console.warn("Gemini returned non-JSON:", textResponse);
        // Attempt to find JSON in markdown block ```json ... ```
        const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || textResponse.match(/```([\s\S]*?)```/);
        if (jsonMatch && jsonMatch[1]) {
           try {
             return JSON.parse(jsonMatch[1]);
           } catch (e) { /* ignore */ }
        }
        throw new Error("Invalid JSON response from Gemini");
      }
    } catch (error) {
      console.error("Gemini Error:", error);
      
      // Fallback: Regex Parsing (Offline Mode)
      const amountMatch = text.match(/(\d+([.,]\d{1,2})?)/);
      if (amountMatch) {
          const amount = parseFloat(amountMatch[0].replace(',', '.'));
          // Simple category guess
          const lower = text.toLowerCase();
          let category = "Autre";
          if (lower.includes('course') || lower.includes('manger') || lower.includes('food')) category = "Nourriture";
          if (lower.includes('bar') || lower.includes('biere') || lower.includes('verre')) category = "Sorties";
          if (lower.includes('transport') || lower.includes('ticket') || lower.includes('essence')) category = "Transport";

          return {
            transaction: { 
                amount, 
                category, 
                is_expense: true, 
                currency: currency,
                type: 'want' // Default fallback
            },
            ai_response: "Mon cerveau IA est en panne, mais j'ai noté la dépense. T'as de la chance.",
            sentiment: "neutral"
          };
      }

      return {
        transaction: { amount: 0, category: "Error", is_expense: true },
        ai_response: "Oula, mon cerveau a buggé et j'ai rien compris. Réessaie ?",
        sentiment: "neutral"
      };
    }
  }
}
