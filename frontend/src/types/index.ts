export interface User {
  id_usuario: number;
  id_persona: number;
  nombres: string;
  apellidos: string;
  tipo_identificacion: string;
  identificacion: string;
  telefono: string;
  direccion: string;
  email: string;
  rol: "admin" | "cliente" | "empleado";
  password?: string;
  id_negocio: string;
  imagen: string| null
}

export interface Negocio {
  id?: number;
  nombre: string;
  direccion?: string; 
  telefono?: string;
  descripcion?: string;
  imagen?:string;
}


export interface Producto {
  id?: number;
  codigo_barra: string;
  nombre: string;
  descripcion?: string;
  unidad_medida?: string;

  // Inventario
  stock_actual?: number;
  stock_minimo?: number;
  stock_maximo?: number;

  // Estado del producto
  estado?: number;
  creacion?: string;
  actualizacion?: string;

  // Precios
  precios?: ProductoPrecio | null;

  // Imágenes (carrusel)
  imagenes?: ProductoImagen[];
}

export interface ProductoPrecio {
  id?: number;
  id_producto: number;
  precio_costo?: number;
  precio_venta?: number;
  precio_anterior?: number;
  precio_mayorista?: number;
  descuento_valor?: number;
  descuento_porcentaje?: number;
  fecha_inicio_promo?: string;
  fecha_fin_promo?: string;
  activo_promo?: number;
  utilidad_porcentaje?: number;
  usuario_modifico?: string;
  fecha_modificacion?: string;
}

export interface ProductoImagen {
  id?: number;
  id_producto: number;
  url: string;
  orden: number;
  activo: number;
}
