import CajeroService from "../services/cajero.service.js";


export const estadoCaja = async (req, res) => {
  try {
    
    const estado = await CajeroService.estadoCaja(req.body);
    return res.json({ ok: true, estado });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};

export const listarProductos = async (req, res) => {
  try {
    const productos = await CajeroService.listarProductos();
    return res.json({ ok: true, productos });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};

export const abrirCaja = async (req, res) => {
  try {
    const result = await CajeroService.abrirCaja(req.body);
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
    const result = await CajeroService.arqueo(req.body);
    return res.json({ ok: true, result });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
  
};

export const finalizarVenta = async (req, res) => {
  try {
   const payload = req.body;
      const resultado = await CajeroService.finalizarVenta(payload);
    return res.json({ ok: true, result: resultado });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
  
};

export const buscarCliente = async (req, res) => {
  try {
   const {id_cliente} = req.body;   
      const resultado = await CajeroService.buscarCliente(id_cliente);
    return res.json({ ok: true,result: resultado });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
  
};

export const mesas = async (req, res) => {
  try {
   const {id_negocio} = req.body;   
      const resultado = await CajeroService.mesas(id_negocio);
    return res.json({ ok: true,result: resultado });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
  
};

export const detallesMesa = async (req, res) => {
  try {
   const {id_negocio,mesaId} = req.body;   
      const resultado = await CajeroService.detallesMesa(id_negocio,mesaId);
    return res.json({ ok: true,result: resultado });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
  
};

export const listarEgresos = async (req, res) => {
  try {
    const { id_negocio, id_caja } = req.params;    
    const egresos = await CajeroService.listarEgresos(
      id_negocio,
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
    const {idUsuario,id_negocio,id_caja,descripcion,metodo_pago,monto,observacion} = req.body;

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

    await CajeroService.actualizarEgreso(Number(id), req.body);

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
    const { id,idUsuario} = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        message: "ID es obligatorio"
      });
    }

    await CajeroService.eliminarEgreso(Number(id),Number(idUsuario));

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
    const { id_mesa,id_negocio } = req.params;
    
    const respuesta = await CajeroService.liberar_mesa(id_mesa,id_negocio);
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

};


