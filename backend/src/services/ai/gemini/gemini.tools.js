export const geminiTools = [
    {
        name: "obtenerVentasHoy",
        description: "Obtiene ventas del día",
        parameters: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "obtenerInventario",
        description: "Consulta inventario por nombre",
        parameters: {
            type: "object",
            properties: {
                nombre: { type: "string" }
            }
        }
    },
    {
        name: "obtenerMesas",
        description: "Lista mesas",
        parameters: {
            type: "object",
            properties: {}
        }
    }
];