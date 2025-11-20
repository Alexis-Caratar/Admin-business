export interface InventarioFisico {
  id: number;
  id_persona: number | null;
  id_negocio: number | null;
  fecha: string;
  tipo: "PRODUCTOS" | "ACTIVOS"|"OTROS";
  nombre: string | null;
}

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
}

export interface InventarioConDetalles {
  inventario: InventarioFisico;
  detalles: InventarioFisicoDetalle[];
}
