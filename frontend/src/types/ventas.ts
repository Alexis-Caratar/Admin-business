export interface Venta {
  id: number;
  id_negocio: number;
  id_cliente: number | null;
  fecha: string;
  subtotal: number;
  descuento: number;
  descuento_porcentaje: number;
  impuesto: number;
  total: number;
  estado: string;
  metodo_pago: string;
  nota: string | null;
  items: VentaItem[];
}

export interface VentaItem {
  id?: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  descuento?: number;
  descuento_porcentaje?: number;
  impuesto?: number;
  subtotal: number;
}

export interface VentaPayload {
  id_cliente: number | null;
  fecha: string;
  subtotal: number;
  descuento: number;
  descuento_porcentaje: number;
  impuesto: number;
  total: number;
  estado: string;
  metodo_pago: string;
  nota?: string | null;
  items: VentaItem[];
}

export interface Venta {
  id: number;
  id_cliente: number;
  fecha: string;
  total: number;
  estado: string;
  metodo_pago: string;
}
