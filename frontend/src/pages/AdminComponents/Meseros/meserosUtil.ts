// Utilidades del módulo Meseros (sin componentes)
import Swal from "sweetalert2";
import { avisarImpresion } from "../../../components/impresion/ticket";
import type { ResultadoImpresionComanda } from "../../../api/comandas";

export const cop = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString("es-CO")}`;
export const hora = (f: string) => new Date(f).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", timeZone: "America/Bogota" });

// La comanda ya quedó guardada: aquí solo se informa cómo le fue a la impresora
export const avisarComanda = async (r: ResultadoImpresionComanda | null | undefined, guardada = "Comanda enviada") => {
  if (!r) return;
  if (r.estado === "CONFIRMADA") return Swal.fire({ icon: "success", title: guardada, text: r.mensaje, timer: 1500, showConfirmButton: false });
  if (r.estado === "ENVIADA") return Swal.fire({ icon: "info", title: guardada, text: "Se envió a la impresora, pero el agente no confirma la impresión (actualízalo).", timer: 2500, showConfirmButton: false });
  return avisarImpresion({ ok: false, mensaje: `${guardada}, pero no se imprimió: ${r.mensaje}. Puedes reintentar desde la comanda.`, documento: r.documento }, "La comanda");
};
