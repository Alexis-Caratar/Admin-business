export interface Venta {
  id: number;
  id_negocio: number;
  numero_factura:string;
  id_cliente: number | null;
  identificacion_cliente:string;
  nombre_completo:string;
  fecha: string;
  subtotal: number;
  descuento: number;
  descuento_porcentaje: number;
  impuesto: number;
  venta_total: number;
  mesa:string;
  estado_pago: boolean;
  estado_venta:string;
  metodo_pago: string;
  nota: string | null;
  nombre_vendedor: string;
  total: number;
  cantidad:number;
  egresos: number;
  id_caja:number;
}

