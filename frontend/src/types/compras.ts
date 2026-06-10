export interface Compra {
  id: number;
  numero_factura: string;
  fecha_compra: string;
  proveedor: string;
  identificacion: string;
  metodo_pago: string;
  tipo_compra: string;
  total: number;
  estado: string;
}

export interface CompraItem {
  id: number;
  id_producto: number;
  codigo: string;
  nombre: string;
  cantidad: number;
  costo_unitario: number;
  subtotal: number;
}

export interface CompraRequest {
  id_negocio: number;
  id_proveedor: number;
  id_metodo_pago: number;
  numero_factura: string;
  tipo_compra: string;
  observacion: string;

  items: {
    id_producto: number;
    cantidad: number;
    costo_unitario: number;
  }[];
}