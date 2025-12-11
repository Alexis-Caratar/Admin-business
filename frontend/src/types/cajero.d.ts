export interface ProductoCajero {
  id: number;
  nombre: string;
  precio_venta: number;
  imagen_plato: string | null;
}

export interface CategoriaCajero {
  id: number;
  categoria: string;
  imagen: string | null;
  platos: ProductoCajero[];
}
export interface AperturaCaja {
  id_usuario: number;
  monto_inicial: number;
}

export interface CierreCaja {
  id_caja: number;
  monto_final: number;
}

  export interface ItemCarrito extends ProductoCajero {
  cantidad: number;
}

// types/cajero.ts

export interface Caja {
  id: number;
  id_usuario: number;
  monto_inicial: number;
  estado: "ABIERTA" | "CERRADA";
  fecha_apertura: string;
  fecha_cierre?: string;
  total_ventas: number;
  dinero_recaudado:number;
}

export interface EstadoCajaResponse {
  abierta: boolean;
  caja: Caja | null;
  error?: string;
}
