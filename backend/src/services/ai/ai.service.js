import { preguntarGemini } from "./gemini/gemini.service.js";
import { detectarIntent } from "./intent.router.js";
import { tools } from "./tools.service.js";

import dotenv from "dotenv";
dotenv.config();

export const preguntarIA = async (mensaje) => {

    const proveedor = process.env.AI_PROVIDER;

    switch (proveedor) {

        case "gemini":
           // 1. detectar intención
                const intent = detectarIntent(mensaje);
                let data = null;
                // 2. ejecutar tool si existe intención
                if (intent && tools[intent]) {
                    data = await tools[intent]();
                }
                // 3. mandar a Gemini con o sin contexto
                const respuesta = await preguntarGemini(mensaje, data);
                console.log("Respuesta de Gemini:", respuesta);
                return respuesta;

        case "openai":
         //   return await preguntarOpenAI(mensaje);

        default:
            throw new Error("Proveedor de IA no configurado.");
    }

};
