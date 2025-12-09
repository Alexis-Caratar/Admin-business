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