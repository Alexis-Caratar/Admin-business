// Pago dividido (varios medios en una cuenta): estado y validación en el navegador.
// El servidor vuelve a validar contra el total real de la venta.
export type LineaPago = { metodo_pago: string; monto: number | ""; monto_recibido: number | "" };
export const MEDIOS_DIVIDIDO: [string, string][] = [["EFECTIVO", "💵 Efectivo"], ["NEQUI", "📲 Nequi"], ["DAVIPLATA", "📲 DaviPlata"], ["TARJETA", "💳 Tarjeta"], ["TRANSFERENCIA", "🔁 Transferencia"]];

export const lineasIniciales = (total: number): LineaPago[] => [
  { metodo_pago: "NEQUI", monto: "", monto_recibido: "" },
  { metodo_pago: "EFECTIVO", monto: total || "", monto_recibido: "" },
];

export const estadoPago = (lineas: LineaPago[], total: number) => {
  const asignado = lineas.reduce((a, l) => a + (Number(l.monto) || 0), 0);
  const falta = Math.round(total - asignado);
  const efectivoCorto = lineas.some((l) => l.metodo_pago === "EFECTIVO" && l.monto_recibido !== "" && Number(l.monto_recibido) < Number(l.monto));
  const cambio = lineas.reduce((a, l) => a + (l.metodo_pago === "EFECTIVO" && l.monto_recibido !== "" ? Math.max(0, Number(l.monto_recibido) - Number(l.monto)) : 0), 0);
  const valido = lineas.length >= 2 && lineas.every((l) => Number(l.monto) > 0) && falta === 0 && !efectivoCorto;
  return { asignado, falta, cambio, efectivoCorto, valido };
};

// Lo que se envía al servidor
export const paraEnviar = (lineas: LineaPago[]) => lineas.map((l) => ({
  metodo_pago: l.metodo_pago, monto: Number(l.monto), ...(l.metodo_pago === "EFECTIVO" && l.monto_recibido !== "" ? { monto_recibido: Number(l.monto_recibido) } : {}),
}));
