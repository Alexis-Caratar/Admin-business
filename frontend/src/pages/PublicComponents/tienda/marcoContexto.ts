/* Contexto del marco de la tienda: carrito, checkout y estado de la tienda */
import { createContext, useContext } from "react";
import type { EstadoTienda } from "./api";

export type Marco = {
  tienda: EstadoTienda | null;
  setTienda: (t: EstadoTienda) => void;
  abrirCarrito: () => void;
  abrirCheckout: () => void;
  /** Animación del producto volando al ícono del carrito */
  volar: (origen: HTMLElement | null, imagen?: string) => void;
  /** Se llama cuando un producto dejó de estar disponible al confirmar */
  onNoDisponible: () => void;
  setOnNoDisponible: (f: () => void) => void;
};

export const ContextoMarco = createContext<Marco | null>(null);

export function useMarco(): Marco {
  const m = useContext(ContextoMarco);
  if (!m) throw new Error("useMarco debe usarse dentro de <MarcoTienda>");
  return m;
}
