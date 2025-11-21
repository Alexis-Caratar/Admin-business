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
  codigo: string;
  nombre: string;
  descripcion?: string;
  unidad_medida?: string;
  imagen?: string;
}
