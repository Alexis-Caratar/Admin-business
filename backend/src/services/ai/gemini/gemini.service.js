import gemini from "./gemini.client.js";
import systemPrompt from "../../../prompts/system.prompt.js";

export const preguntarGemini = async (mensaje, contexto = null) => {

    let prompt = `
${systemPrompt}

Pregunta del usuario:

${mensaje}
`;

    if (contexto) {

        prompt += `

DATOS DEL SISTEMA

${JSON.stringify(contexto, null, 2)}

REGLAS ADICIONALES:

- Responde ÚNICAMENTE utilizando los datos del sistema.
- No inventes información.
- No cambies cantidades.
- No hagas cálculos que no estén soportados por los datos.
- Si los datos están vacíos, indícalo al usuario.
- No menciones JSON, herramientas, funciones o procesos internos.
`;

    }

    const response = await gemini.models.generateContent({

        model: process.env.GEMINI_MODEL,

        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: prompt
                    }
                ]
            }
        ]

    });

    return response.text;

};