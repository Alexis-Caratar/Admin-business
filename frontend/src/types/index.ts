export interface User {
  id: number;
  nombre: string;
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
  fecha_creacion?: string;
  imagen?:string;
}


export interface Producto {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  unidad_medida?: string;
}
