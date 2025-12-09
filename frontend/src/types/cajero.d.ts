export interface ProductoCajero {
  id: number;
  nombre: string;
  precio: number;
  url_imagen: string | null;
}

export interface AperturaCaja {
  id_usuario: number;
  monto_inicial: number;
}

export interface CierreCaja {
  id_caja: number;
  monto_final: number;
}
