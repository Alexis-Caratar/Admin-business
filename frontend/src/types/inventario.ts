export type InventarioFisico = {
  id: number;
  nombre: string;
  unidad: string;
  tipo: "INSUMO" | "PRODUCTO" | "ACTIVO";
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
  costo_unitario: number;
};
export interface InventarioFisicoDetalle {
  id:                   number;
  id_inventario_fisico: number;
  id_producto:          number;
  id_activo:            null;
  cantidad_sistema:     string;
  cantidad_fisica:      string;
  diferencia:           string;
  observacion:          string;
  fecha_registro:       Date;
  id_negocio:           number;
  codigo:               string;
  nombre:               string;
  descripcion:          string;
  unidad_medida:        string;
  tipo:                  "PRODUCTOS" | "ACTIVOS"|"OTROS";
}

export interface InventarioConDetalles {
  inventario: InventarioFisico;
  detalles: InventarioFisicoDetalle[];
}
