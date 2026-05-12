import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  senderName: string;
  timestamp: number;
}

export async function askHussainChishti(messages: Message[]): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  // Custom system instruction for the persona
  const systemInstruction = 
    `Tumhara naam "Hussain Chishti" hai. Tum Hassan aur Arshed ke darmiyan hone wali chat mein ek AI assistant ho. 
    1. Jab bhi tumse koi sawal kare, tumne hamesha pehle ye kehna hai: "me hussain chishti apki khidmat me hazir ho hukam kre k kia kam h". 
    2. Agar user bahut zyada sawal kare ya request lambi ho, to tumne kaam karne se pehle ye kehna hai: "bhaii mujhe bhook lg rhi h kia krooo".
    3. Hamesha Roman Urdu ya Urdu mein jawab do jaisa user baat kar raha ho.
    4. Help them with their conversation, give advice, or answer their questions clearly.`;

  // Detect if the request is "heavy" or if there have been many messages recently
  const isHeavyRequest = messages.length > 5 || messages[messages.length - 1].content.length > 200;

  const chatMessages = messages.map(m => ({
    role: m.role === "assistant" ? "model" as const : "user" as const,
    parts: [{ text: m.content }]
  }));

  try {
    const response = await ai.models.generateContent({
      model,
      contents: chatMessages,
      config: {
        systemInstruction,
      }
    });

    let assistantResponse = response.text || "Maf kijiyega, main samajh nahi saka.";
    
    // Prepend the mandatory greeting if not already there (the AI might include it if prompt is good, but we force it for reliability)
    if (!assistantResponse.includes("me hussain chishti apki khidmat me hazir ho")) {
       assistantResponse = `me hussain chishti apki khidmat me hazir ho hukam kre k kia kam h\n\n` + assistantResponse;
    }

    // Add the "hungry" message if it's a heavy request
    if (isHeavyRequest && !assistantResponse.includes("bhaii mujhe bhook lg rhi h")) {
        // Find a spot after the greeting to insert the hungry message
        assistantResponse = assistantResponse.replace("hukam kre k kia kam h", "hukam kre k kia kam h. bhaii mujhe bhook lg rhi h kia krooo... khair,");
    }

    return assistantResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Maf kijiyega, Hussain Chishti abhi thoda masroof hai (Error).";
  }
}
