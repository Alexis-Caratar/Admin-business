/*
 * Carrito de la tienda. Se guarda en este navegador (localStorage) para que
 * no se pierda al navegar o recargar; caduca a las 24 horas.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { CategoriaTienda } from "./api";

import { ContextoCarrito, claveDe, precioLinea } from "./carritoContexto";
import type { Carrito, Linea } from "./carritoContexto";

const CADUCA_MS = 24 * 60 * 60 * 1000;
const MAX_UNIDADES = 50;


// Un carrito por negocio
const almacen = (negocio: string) => `pu_carrito_${negocio}`;

function leer(negocio: string): Linea[] {
  try {
    const v = JSON.parse(localStorage.getItem(almacen(negocio)) ?? "null");
    if (!v || Date.now() - v.actualizado > CADUCA_MS || !Array.isArray(v.lineas)) return [];
    return v.lineas;
  } catch {
    return [];
  }
}

export function CarritoProvider({ negocio, children }: { negocio: string; children: ReactNode }) {
  const [lineas, setLineas] = useState<Linea[]>(() => leer(negocio));
  const actuales = useRef(lineas);
  useEffect(() => { actuales.current = lineas; }, [lineas]);

  useEffect(() => {
    try {
      localStorage.setItem(almacen(negocio), JSON.stringify({ lineas, actualizado: Date.now() }));
    } catch {
      // sin almacenamiento: el carrito vale para esta visita
    }
  }, [lineas, negocio]);

  const agregar = useCallback((l: Omit<Linea, "clave">) => {
    const clave = claveDe(l.id_producto, l.opciones);
    setLineas((prev) => {
      const existe = prev.find((x) => x.clave === clave);
      if (existe) {
        return prev.map((x) => (x.clave === clave ? { ...x, cantidad: Math.min(MAX_UNIDADES, x.cantidad + l.cantidad) } : x));
      }
      return [...prev, { ...l, clave }];
    });
  }, []);

  const cambiarCantidad = useCallback((clave: string, cantidad: number) => {
    setLineas((prev) =>
      cantidad <= 0
        ? prev.filter((x) => x.clave !== clave)
        : prev.map((x) => (x.clave === clave ? { ...x, cantidad: Math.min(MAX_UNIDADES, cantidad) } : x))
    );
  }, []);

  const quitar = useCallback((clave: string) => setLineas((prev) => prev.filter((x) => x.clave !== clave)), []);
  const vaciar = useCallback(() => setLineas([]), []);

  const sincronizar = useCallback((catalogo: CategoriaTienda[]) => {
    const platos = new Map(catalogo.flatMap((c) => c.platos).map((p) => [p.id, p]));
    const quitados: string[] = [];
    const nuevas = actuales.current.flatMap((l) => {
        const p = platos.get(l.id_producto);
        const opciones = l.opciones.map((o) => p?.productos_complementos.find((c) => c.id_producto_complemento === o.id));
        if (!p || opciones.some((o) => !o)) {
          quitados.push(l.nombre);
          return [];
        }
        return [{
          ...l,
          precio: p.precio_venta,
          opciones: opciones.map((o) => ({ id: o!.id_producto_complemento, nombre: o!.nombre, precio: o!.precio_venta })),
        }];
      });
    setLineas(nuevas);
    return quitados;
  }, []);

  const valor = useMemo<Carrito>(
    () => ({
      lineas,
      unidades: lineas.reduce((a, l) => a + l.cantidad, 0),
      subtotal: lineas.reduce((a, l) => a + precioLinea(l), 0),
      agregar, cambiarCantidad, quitar, vaciar, sincronizar,
    }),
    [lineas, agregar, cambiarCantidad, quitar, vaciar, sincronizar]
  );

  return <ContextoCarrito.Provider value={valor}>{children}</ContextoCarrito.Provider>;
}
