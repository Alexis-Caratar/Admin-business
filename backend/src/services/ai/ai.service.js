import dotenv from "dotenv";

import { detectarIntent } from "./intent.router.js";
import { preguntarGemini } from "./gemini/gemini.service.js";
import { tools } from "./tools.service.js";

dotenv.config();

// ctx.id_negocio viene del token: las herramientas solo consultan ese negocio
export const preguntarIA = async (mensaje, ctx) => {

    const intent = detectarIntent(mensaje);

    // Preguntas generales → IA
    if (intent.tipo === "ia") {

        return {
            ok: true,
            tipo: "texto",
            mensaje: await preguntarGemini(mensaje),
            data: null
        };

    }

    const tool = tools[intent.tool];

    if (!tool || typeof tool.execute !== "function") {

        return {
            ok: false,
            tipo: "error",
            mensaje: "No existe la herramienta solicitada.",
            data: null
        };

    }

    const resultado = await tool.execute(intent.params, ctx);

    // Herramientas que responden directamente
    if (!tool.useAI) {

        return {
            ok: true,
            tipo: tool.tipo ?? "texto",
            titulo: tool.titulo ?? "",
            mensaje: tool.format(resultado, intent),
            data: resultado
        };

    }

    // Herramientas que necesitan interpretación de la IA
    const respuestaIA = await preguntarGemini(mensaje, resultado);

    return {
        ok: true,
        tipo: "texto",
        mensaje: respuestaIA,
        data: resultado
    };

};