/*
 * Lectura de códigos de barras en la caja.
 * Los lectores USB/Bluetooth funcionan como un teclado: escriben el código muy
 * rápido y terminan con Enter. Se reconocen por esa velocidad, así que no se
 * confunden con alguien escribiendo a mano.
 */
import { useEffect, useRef } from "react";
import type { CategoriaCajero, ProductoCajero } from "../../../../../types/cajero";

const normalizar = (c: string) => c.trim().replace(/\s+/g, "").toUpperCase();

/** "3*7701234567890" → { cantidad: 3, codigo: "7701234567890" } */
export function leerEntrada(texto: string): { cantidad: number; codigo: string } {
  const m = /^(\d{1,3})\s*[*xX]\s*(.+)$/.exec(texto.trim());
  if (m && Number(m[1]) > 0) return { cantidad: Math.min(Number(m[1]), 999), codigo: normalizar(m[2]) };
  return { cantidad: 1, codigo: normalizar(texto) };
}

export type Encontrado = { producto: ProductoCajero; categoria: CategoriaCajero };

/** Busca el producto por código entre los que la caja ya tiene cargados */
export function buscarPorCodigo(categorias: CategoriaCajero[], codigo: string): Encontrado | null {
  const c = normalizar(codigo);
  if (!c) return null;
  for (const categoria of categorias) {
    const producto = categoria.platos.find((p) => p.codigo_barra && normalizar(String(p.codigo_barra)) === c);
    if (producto) return { producto, categoria };
  }
  return null;
}

const escribiendoEnCampo = (el: Element | null) =>
  !!el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || (el as HTMLElement).isContentEditable);

/**
 * Escucha el lector aunque el cursor no esté en la barra de escaneo
 * (por ejemplo, después de tocar una tarjeta). Si el foco está en otro campo,
 * no intercepta nada: ese campo recibe lo que se escribe.
 */
export function useLectorGlobal(onCodigo: (codigo: string) => void, activo: boolean) {
  const buffer = useRef("");
  const ultima = useRef(0);
  const callback = useRef(onCodigo);
  useEffect(() => { callback.current = onCodigo; }, [onCodigo]);

  useEffect(() => {
    if (!activo) return;
    const alPresionar = (e: KeyboardEvent) => {
      if (escribiendoEnCampo(document.activeElement) || e.ctrlKey || e.metaKey || e.altKey) return;
      const ahora = performance.now();
      // Más de 60 ms entre teclas = persona escribiendo: se empieza de nuevo
      if (ahora - ultima.current > 60) buffer.current = "";
      ultima.current = ahora;
      if (e.key === "Enter") {
        if (buffer.current.length >= 4) {
          e.preventDefault();
          callback.current(buffer.current);
        }
        buffer.current = "";
        return;
      }
      if (e.key.length === 1) buffer.current += e.key;
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [activo]);
}
