export const detectarIntent = (mensaje) => {

    const text = mensaje.toLowerCase();

    if (text.includes("hora") ||text.includes("fecha") ||text.includes("qué hora") ||text.includes("que hora") ||text.includes("qué día") ||text.includes("que día")
    ) {
        return {tipo: "directo",tool: "obtenerFechaHora"};
    }

    // MESAS
    if (text.includes("mesa")) {
        return { tipo: "directo", tool: "obtenerMesas" };
    }
    // INVENTARIO
    if (text.includes("inventario")) {
        let nombre = "";

        const match = text.match(/inventario(?:\s+de)?\s+(.+)/i);
        if (match) { nombre = match[1].trim(); }
        return {tipo: "directo", tool: "obtenerInventario",params: { nombre }};

    }

    // VENTAS
    if (text.includes("venta")) {
        return { tipo: "directo", tool: "obtenerVentasHoy" };
    }

    // CLIENTES
    if (text.includes("cliente")) {
        return { tipo: "directo", tool: "obtenerClientes" };
    }

    // Cuando no encuentra un intent específico, se asume que es una pregunta para la IA
    return {tipo: "ia",tool: null,params: {}
    };

};