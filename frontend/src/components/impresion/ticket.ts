/*
 * Tickets que arma el servidor (factura, comanda, pedido). Se imprimen con el
 * agente local o, si no hay agente, desde el navegador (celular o computador).
 */
import Swal from "sweetalert2";

export type LineaTicket =
  | { t: "texto"; v: string; a?: "c" | "i" | "d"; b?: boolean; g?: boolean }
  | { t: "cols"; i: string; d: string; b?: boolean }
  | { t: "sep" } | { t: "vacio" } | { t: "qr"; v: string };
export type DocumentoTicket = { tipo: string; rol: "factura" | "comanda"; ancho: number; copias?: number; lineas: LineaTicket[] };
export type ResultadoImpresion = { impreso?: boolean; ok?: boolean; mensaje?: string; documento?: DocumentoTicket };

// El visor se monta una vez (VisorTicket) y se abre desde cualquier pantalla
type Oyente = (doc: DocumentoTicket) => void;
let oyente: Oyente | null = null;
export const registrarVisor = (f: Oyente | null) => { oyente = f; };
export const mostrarTicket = (doc: DocumentoTicket) => oyente?.(doc);

/** Muestra si el agente imprimió; si no, ofrece imprimir desde este dispositivo */
export async function avisarImpresion(r: ResultadoImpresion, que = "El comprobante") {
  const impreso = r.impreso ?? r.ok;
  if (impreso) {
    return Swal.fire({ icon: "success", title: "Impreso", text: r.mensaje ?? `${que} se envió a la impresora`, timer: 1600, showConfirmButton: false });
  }
  const res = await Swal.fire({
    icon: "warning",
    title: "No se imprimió en el punto de venta",
    text: r.mensaje ?? "No hay agente de impresión conectado",
    showCancelButton: true,
    confirmButtonText: r.documento ? "Imprimir en este dispositivo" : "Aceptar",
    cancelButtonText: "Cerrar",
  });
  if (res.isConfirmed && r.documento) mostrarTicket(r.documento);
  return res;
}
