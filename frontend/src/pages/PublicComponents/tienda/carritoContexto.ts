/* Tipos, contexto y hook del carrito (el proveedor está en carrito.tsx) */
import { createContext, useContext } from "react";
import type { CategoriaTienda } from "./api";

export type Opcion = { id: number; nombre: string; precio: number };

export type Linea = {
  /** Plato + opciones elegidas: la misma combinación se agrupa en una línea */
  clave: string;
  id_producto: number;
  nombre: string;
  imagen?: string;
  precio: number;
  cantidad: number;
  opciones: Opcion[];
};

export type Carrito = {
  lineas: Linea[];
  unidades: number;
  subtotal: number;
  agregar: (l: Omit<Linea, "clave">) => void;
  cambiarCantidad: (clave: string, cantidad: number) => void;
  quitar: (clave: string) => void;
  vaciar: () => void;
  /** Ajusta precios y quita lo que ya no está disponible según el catálogo */
  sincronizar: (catalogo: CategoriaTienda[]) => string[];
};

export const claveDe = (id: number, opciones: Opcion[]) => `${id}:${opciones.map((o) => o.id).sort((a, b) => a - b).join(",")}`;
export const precioLinea = (l: Pick<Linea, "precio" | "opciones" | "cantidad">) =>
  (l.precio + l.opciones.reduce((a, o) => a + o.precio, 0)) * l.cantidad;

export const ContextoCarrito = createContext<Carrito | null>(null);

export function useCarrito(): Carrito {
  const ctx = useContext(ContextoCarrito);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de <CarritoProvider>");
  return ctx;
}
