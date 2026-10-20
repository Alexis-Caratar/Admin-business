import CajeroService from "../services/cajero.service.js";
import dotenv from "dotenv";

import { configImpresion, imprimirComanda, imprimirFactura, ticketFactura } from "../services/impresion/impresion.service.js";


export const estadoCaja = async (req, res) => {
  try {
    
    const estado = await CajeroService.estadoCaja({ id_usuario: req.user.id });
    return res.json({ ok: true, estado });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};

export const listarProductos = async (req, res) => {
  try {
    const productos = await CajeroService.listarProductos(req.user.id_negocio);
    return res.json({ ok: true, productos });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};

export const abrirCaja = async (req, res) => {
  try {    
    const result = await CajeroService.abrirCaja({ ...req.body, id_usuario: req.user.id });
    return res.json({ ok: true, result });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};

export const cerrarCaja = async (req, res) => {
  try {
    const result = await CajeroService.cerrarCaja(req.body);
    return res.json({ ok: true, result });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};

export const arqueo = async (req, res) => {
  try {
    const result = await CajeroService.arqueo(req.body,req.user.id_negocio);
    return res.json({ ok: true, result });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
  
};

export const finalizarVenta = async (req, res) => {
  try {
   const payload = { ...req.body, id_negocio: req.user.id_negocio, idUsuario: req.user.id };
      const resultado = await CajeroService.finalizarVenta(payload);

      // La comanda sale sola si el negocio lo tiene activo (Admin > Negocios > Impresión).
      // Un problema de impresión nunca deshace la venta.
      let impresion = null;
      try {
        const cfg = await configImpresion(req.user.id_negocio);
        if (cfg.imprimir_comanda_al_vender) impresion = await imprimircomanda_fisica(payload);
      } catch (err) {
        console.error("Comanda no impresa:", err.message);
      }
      return res.json({ ok: true, result: resultado, impresion });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
  
};


export const imprimir_comanda = async (req, res) => {
  try {
   const payload = { ...req.body, id_negocio: req.user.id_negocio };
      const r = await imprimircomanda_fisica(payload);
      return res.json({ ok: true, impreso: r.ok, ...r });
  } catch (e) {
    return res.status(e.status || 500).json({ ok: false, error: e.message });
  }
  
};

// Comanda con el formato del negocio; responde si se imprimió y devuelve el ticket
export const imprimircomanda_fisica = (payload) => imprimirComanda(payload.id_negocio, {
  numero: payload.venta?.numero_factura,
  mesa: payload.mesa && payload.mesa !== "N/A" ? payload.mesa : null,
  mesero: payload.nombre_vendedor,
  productos: payload.productos ?? [],
  nota: payload.nota,
});


export const buscarCliente = async (req, res) => {
  try {
   const {id_cliente} = req.body;   
      const resultado = await CajeroService.buscarCliente(id_cliente);
    return res.json({ ok: true,result: resultado });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
  
};


export const crearcliente = async (req, res) => {
  try {
    const resultado = await CajeroService.crearcliente(req.body);
  
  
    return res.json(resultado);

  } catch (e) {
    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor",
      error: e.message,
    });
  }
};

export const mesas = async (req, res) => {
  try {
      const resultado = await CajeroService.mesas(req.user.id_negocio);
    return res.json({ ok: true,result: resultado });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
  
};

export const detallesMesa = async (req, res) => {
  try {
   const { mesaId } = req.body;
      const resultado = await CajeroService.detallesMesa(req.user.id_negocio, mesaId);
    return res.json({ ok: true,result: resultado });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
  
};

export const listarEgresos = async (req, res) => {
  try {
    const { id_caja } = req.params;
    const egresos = await CajeroService.listarEgresos(
      req.user.id_negocio,
      id_caja
    );

    res.json(egresos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al listar egresos" });
  }
};

export const crearEgreso = async (req, res) => {
  try {    
    const {id_caja,descripcion,metodo_pago,monto,observacion} = req.body;
    const idUsuario = req.user.id;
    const id_negocio = req.user.id_negocio;

    // 🔐 Validación obligatoria
    if (!id_negocio || !descripcion || !monto) {
      return res.status(400).json({
        ok: false,
        message: "id_negocio, id_caja, descripcion y monto son obligatorios",
        body_recibido: req.body
      });
    }
    const result = await CajeroService.crearEgreso({idUsuario,id_negocio,id_caja,descripcion,metodo_pago,monto,observacion });
    return res.json({
      ok: true,
      message: "Egreso creado correctamente",
      id: result
    });

  } catch (error) {
    console.error("Error crearEgreso:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al crear egreso"
    });
  }
};

export const actualizarEgreso = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        message: "ID es obligatorio"
      });
    }

    await CajeroService.actualizarEgreso(Number(id), { ...req.body, idUsuario: req.user.id }, req.user.id_negocio);

    return res.json({
      ok: true,
      message: "Egreso actualizado correctamente"
    });

  } catch (error) {
    console.error("Error actualizarEgreso:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al actualizar egreso"
    });
  }
};

export const eliminarEgreso = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        message: "ID es obligatorio"
      });
    }

    await CajeroService.eliminarEgreso(Number(id), req.user.id, req.user.id_negocio);

    return res.json({
      ok: true,
      message: "Egreso eliminado correctamente"
    });

  } catch (error) {
    console.error("Error eliminarEgreso:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al eliminar egreso"
    });
  }
};

export const actualizaventa = async (req, res) => {
  try {
   const payload = req.body;
      const resultado = await CajeroService.actualizaventa(payload);
    return res.json({ ok: true, result: resultado });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
  
};


export const liberar_mesa = async (req, res) => {
  try {
    const { id_mesa } = req.params;

    const respuesta = await CajeroService.liberar_mesa(id_mesa, req.user.id_negocio);
    res.json(respuesta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar mesas" });
  }
};

export const facturaPorCaja = async (req, res) => {
  try {
    const { id_caja } = req.body;
    const result = await CajeroService.facturaPorCaja(id_caja);

    res.json({ok: true, result});
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: "Error obteniendo factura"
    });
  }

};

export const facturaPordetalle = async (req, res) => {
  try {
    const { id_venta } = req.body;
    const result = await CajeroService.facturaPordetalle(id_venta);

    res.json({ok: true, result});
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: "Error obteniendo factura"
    });
  }
}

// Factura: se arma con la venta guardada en la base (del negocio de quien imprime).
// Responde si el agente la imprimió y devuelve el ticket para imprimirlo desde el navegador.
export const imprimirfactura = async (req, res) => {
  try {
    const id_venta = Number(req.body?.id_venta ?? req.body?.venta?.id_venta);
    if (!id_venta) return res.status(400).json({ ok: false, error: "Falta la venta a imprimir" });
    const r = await imprimirFactura(id_venta, req.user.id_negocio);
    res.json({ ok: true, impreso: r.ok, ...r });
  } catch (error) {
    if (error.status && error.status < 500) return res.status(error.status).json({ ok: false, error: error.message });
    console.error("Error al enviar a impresión:", error);
    res.status(500).json({ ok: false, msg: "Error al enviar a impresión" });
  }
};

// Ticket de una venta para ver/compartir/imprimir desde el navegador
export const ticketVenta = async (req, res) => {
  try {
    const r = await ticketFactura(Number(req.params.id_venta), req.user.id_negocio);
    res.json({ ok: true, ...r });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, error: error.status ? error.message : "No se pudo armar el ticket" });
  }
};


export const cancelarFactura = async (req, res) => {
  try {
   const payload = req.body;   
     const result= await CajeroService.cancelar_factura(payload)
      res.json({ok: true, result});
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
  
};

export const obtenerInventario = async (req, res) => {
  try {
   const payload = req.user.id_negocio;   
     const result= await CajeroService.obtener_inventario(payload)
      res.json({ok: true, result});
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
  
};


export const guardarInventario = async (req, res) => {
  try {    
   const payload = req.body;
   
     const result= await CajeroService.guardar_inventario(payload,req.user.id)
      res.json({ok: true, result});
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
  
};

export const apiEliminarCaja = async (req, res) => {
  try {    
   const payload = req.body;
     const result= await CajeroService.apiEliminarCaja(payload, req.user.id_negocio)
      res.json({ok: true, result});
  } catch (e) {
    return res.status(e.status || 500).json({ ok: false, error: e.message });
  }
  
};

