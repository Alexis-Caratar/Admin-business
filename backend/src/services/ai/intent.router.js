export const detectarIntent = (mensaje) => {

    const text = mensaje.toLowerCase();

    if (text.includes("mesa")) return "obtenerMesas";
    if (text.includes("cuantas mesas")) return "obtenerMesas";
    if (text.includes("ventas")) return "obtenerVentasHoy";

    return null;
};