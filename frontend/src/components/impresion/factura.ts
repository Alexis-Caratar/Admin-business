/*
 * Factura al cobrar: es aparte de la comanda y solo se ofrece cuando la cuenta
 * quedó pagada. Lo que hace depende de Configuración → Factura e impresión:
 *   preguntar → el aviso de venta registrada trae "Imprimir factura"
 *   siempre   → se imprime sola
 *   nunca     → solo el aviso (se puede imprimir después desde las ventas)
 */
import Swal, { type SweetAlertOptions } from "sweetalert2";
import axios from "../../api/axios";
import { imprimirfactura } from "../../api/cajero";
import { avisarImpresion } from "./ticket";

type Preferencia = "preguntar" | "siempre" | "nunca";
let cache: { valor: Promise<Preferencia>; hasta: number } | null = null;

export const preferenciaFactura = (): Promise<Preferencia> => {
  if (!cache || cache.hasta < Date.now()) {
    const valor = axios.get<{ factura_al_cobrar: Preferencia }>("/cajero/preferencia-factura")
      .then((r) => r.data.factura_al_cobrar ?? "preguntar")
      .catch(() => { cache = null; return "preguntar" as Preferencia; });
    cache = { valor, hasta: Date.now() + 60_000 };   // si cambian la configuración, se toma en un minuto
  }
  return cache.valor;
};

export const imprimirFacturas = async (ids: number[]) => {
  for (const id of ids) {
    try {
      const { data } = await imprimirfactura({ id_venta: id });
      await avisarImpresion(data, ids.length > 1 ? `La factura ${id}` : "La factura");
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      await Swal.fire("No se imprimió la factura", msg ?? "Inténtalo desde las ventas del día", "error");
    }
  }
};

// Aviso de venta registrada + factura según la configuración del negocio
export async function ventaCobrada(ids: number[], aviso: SweetAlertOptions = {}) {
  const pref = await preferenciaFactura();
  const base: SweetAlertOptions = { icon: "success", title: "Venta registrada", confirmButtonColor: "#16a34a", ...aviso };
  if (!ids.length || pref === "nunca") { await Swal.fire({ ...base, confirmButtonText: "Continuar" }); return; }
  if (pref === "siempre") { Swal.fire({ ...base, timer: 1400, showConfirmButton: false }); await imprimirFacturas(ids); return; }
  const r = await Swal.fire({
    ...base, showCancelButton: true, reverseButtons: true,
    confirmButtonText: ids.length > 1 ? `Imprimir ${ids.length} facturas` : "Imprimir factura", cancelButtonText: "Continuar",
    confirmButtonColor: "#2563EB",
  });
  if (r.isConfirmed) await imprimirFacturas(ids);
}
