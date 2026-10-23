// Utilidades de tiqueteras en la caja (sin componentes, para que el refresco en caliente funcione)
import type { Consumo, Tiquetera } from "../../../../../../api/tiqueteras";

export const cop = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString("es-CO")}`;

export const motivoNoUsable = (t: Tiquetera) =>
  t.estado === "ANULADA" ? "Anulada" : t.vencida ? `Vencida (${t.fecha_vencimiento})` : t.disponibles <= 0 ? "Sin almuerzos" : null;

// Resumen para el aviso de éxito (SweetAlert); los textos del cliente se escapan
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
export const resumenConsumo = (r: Consumo) => `
  <div style="text-align:left;font-size:14px;line-height:1.6">
    <b>${esc(r.tiquetera.cliente)}</b> · ${esc(r.tiquetera.codigo)}<br/>
    Factura ${esc(r.venta.numero_factura)}: ${r.venta.almuerzos} almuerzo(s) con tiquetera<br/>
    ${r.venta_resto ? `Factura ${esc(r.venta_resto.numero_factura)}: $${Math.round(r.venta_resto.total).toLocaleString("es-CO")} en ${r.venta_resto.metodo_pago}<br/>` : ""}
    Saldo: ${r.antes.disponibles} → <b style="color:#16a34a">${r.despues.disponibles}</b> de ${r.tiquetera.almuerzos_total}
  </div>`;
