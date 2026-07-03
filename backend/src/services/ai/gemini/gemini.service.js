import gemini from "./gemini.client.js";
import systemPrompt from "../../../prompts/system.prompt.js";

export const preguntarGemini = async (mensaje, contexto = null) => {

    const response = await gemini.models.generateContent({
        model: process.env.GEMINI_MODEL,

        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: `
                        ${systemPrompt}
                        Usuario: ${mensaje}

                        ${contexto ? `Datos del sistema:
                        ${JSON.stringify(contexto)}` : ""}
                        `
                    }
                ]
            }
        ]
    });

    return response.text;
};