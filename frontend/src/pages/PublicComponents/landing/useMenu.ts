import { useEffect, useState } from "react";
import { SITE } from "./siteConfig";

/*
 * Lee la carta real desde el backend:
 *   GET https://api.puntourbano.co/api/cajero/productos/1
 *   { ok, productos: [{ id, categoria, imagen, platos: [...] }] }
 */

type ComplementoApi = {
  nombre?: string;
  precio_venta?: number | null;
  estado?: boolean;
  obligatorio?: boolean;
  tipo_seleccion?: string;
  orden?: number;
};

type PlatoApi = {
  id: number;
  nombre?: string;
  imagenes?: string[] | null;
  precio_venta?: number | null;
  stock_actual?: number | null;
  productos_complementos?: ComplementoApi[] | null;
};

type CategoriaApi = {
  id: number;
  categoria?: string;
  imagen?: string | null;
  platos?: PlatoApi[] | null;
};

type RespuestaApi = { ok?: boolean; productos?: CategoriaApi[] };

export type Opcion = { nombre: string; extra: number };

export type Plato = {
  id: number;
  nombre: string;
  precio: number | null;
  imagen?: string;
  agotado: boolean;
  /** Opciones incluidas entre las que el cliente elige (ej. la bebida) */
  aElegir: Opcion[];
  /** Complementos opcionales */
  adiciones: Opcion[];
};

export type Categoria = {
  id: number;
  nombre: string;
  platos: Plato[];
};

export type EstadoMenu = "cargando" | "listo" | "error";

/** "1. Desayunos" → { orden: 1, nombre: "Desayunos" } */
function leerCategoria(texto: string): { orden: number; nombre: string } {
  const m = /^\s*(\d+)\s*[.)-]\s*(.+)$/.exec(texto);
  if (!m) return { orden: Number.MAX_SAFE_INTEGER, nombre: texto.trim() };
  return { orden: Number(m[1]), nombre: m[2].trim() };
}

function capitalizar(texto: string): string {
  const t = texto.trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function aOpcion(c: ComplementoApi): Opcion {
  return {
    nombre: capitalizar(c.nombre ?? ""),
    extra: typeof c.precio_venta === "number" ? c.precio_venta : 0,
  };
}

function aPlato(p: PlatoApi): Plato | null {
  const nombre = p.nombre?.trim();
  if (!nombre) return null;

  const complementos = (p.productos_complementos ?? [])
    .filter((c) => c.estado !== false && c.nombre?.trim())
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  return {
    id: p.id,
    nombre: capitalizar(nombre),
    precio:
      typeof p.precio_venta === "number" && p.precio_venta > 0
        ? p.precio_venta
        : null,
    imagen: p.imagenes?.[0] || undefined,
    // stock null = el producto no maneja inventario
    agotado: p.stock_actual === 0,
    aElegir: complementos.filter((c) => c.obligatorio).map(aOpcion),
    adiciones: complementos.filter((c) => !c.obligatorio).map(aOpcion),
  };
}

function aCategorias(data: RespuestaApi): Categoria[] {
  return (data.productos ?? [])
    .map((c) => {
      const { orden, nombre } = leerCategoria(c.categoria ?? "");
      const platos = (c.platos ?? [])
        .map(aPlato)
        .filter((p): p is Plato => p !== null);
      return { id: c.id, nombre, orden, platos };
    })
    .filter((c) => c.nombre && c.platos.length > 0)
    .sort((a, b) => a.orden - b.orden)
    .map(({ id, nombre, platos }) => ({ id, nombre, platos }));
}

export function useMenu(): { estado: EstadoMenu; categorias: Categoria[] } {
  const [estado, setEstado] = useState<EstadoMenu>("cargando");
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    const ctrl = new AbortController();

    fetch(SITE.menuUrl, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<RespuestaApi>;
      })
      .then((data) => {
        const lista = aCategorias(data);
        setCategorias(lista);
        setEstado(lista.length > 0 ? "listo" : "error");
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setEstado("error");
      });

    return () => ctrl.abort();
  }, []);

  return { estado, categorias };
}
