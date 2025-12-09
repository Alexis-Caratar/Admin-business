import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { apiListarProductos, apiAbrirCaja, apiCerrarCaja, apiArqueoCaja } from "../../../../api/cajero";
import { CrearVenta } from "../../../../api/ventas"; // DEBES TENERLO YA CREADO

export default function CajeroDashboard() {
  const [productos, setProductos] = useState<any[]>([]);
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [montoApertura, setMontoApertura] = useState("");
  const [idCaja, setIdCaja] = useState<number | null>(null);
  const [ventas, setVentas] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [modalApertura, setModalApertura] = useState(false);
  const [modalCierre, setModalCierre] = useState(false);
  const [modalArqueo, setModalArqueo] = useState(false);
  const [arqueoInfo, setArqueoInfo] = useState<any>(null);

  /** ================================
   * 📌 Cargar productos reales
   * ================================ */
  useEffect(() => {
    apiListarProductos().then((res) => {
      if (res.data.ok) setProductos(res.data.productos);
    });
  }, []);

  /** 📊 Estadísticas */
  const totalVentas = ventas.length;
  const dineroTotal = ventas.reduce((acc, v) => acc + v.total, 0);

  /** ➕ Agregar producto */
  const addCart = (p: any) => {
    setCarrito([...carrito, p]);
  };

  /** 🗑 Eliminar producto */
  const removeItem = (index: number) => {
    const copy = [...carrito];
    copy.splice(index, 1);
    setCarrito(copy);
  };

  /** 💰 Finalizar venta REAL */
  const finalizarVenta = async () => {
    if (carrito.length === 0) return;

    const total = carrito.reduce((acc, v) => acc + Number(v.precio), 0);

    // Registrar venta REAL
    const { data } = await apiCrearVenta({
      id_caja: idCaja,
      total,
      productos: carrito.map((c) => ({
        id_producto: c.id,
        precio: c.precio,
      })),
    });

    if (data.ok) {
      setVentas([
        ...ventas,
        {
          id: data.venta.id,
          fecha: data.venta.fecha,
          total,
          productos: carrito,
        },
      ]);
      setCarrito([]);
    }
  };

  /** 📌 Abrir caja REAL */
  const abrirCajaReal = async () => {
    const { data } = await apiAbrirCaja({
      id_usuario: 1, // <- reemplazar por el user logueado
      monto_inicial: montoApertura,
    });

    if (data.ok) {
      setCajaAbierta(true);
      setIdCaja(data.result.id);
      setModalApertura(false);
    }
  };

  /** 📌 Arqueo REAL */
  const cargarArqueo = async () => {
    const { data } = await apiArqueoCaja({ id_caja: idCaja });
    if (data.ok) {
      setArqueoInfo(data.result);
    }
  };

  /** 📌 Cierre de caja REAL */
  const cerrarCajaReal = async () => {
    const { data } = await apiCerrarCaja({
      id_caja: idCaja,
      monto_final: Number(montoApertura) + dineroTotal,
    });

    if (data.ok) {
      setCajaAbierta(false);
      setVentas([]);
      setCarrito([]);
      setMontoApertura("");
      setIdCaja(null);
      setModalCierre(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Perfil del Cajero
      </Typography>

      {/* ========================== */}
      {/* 📦 Estado de Caja */}
      {/* ========================== */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Estado de Caja</Typography>
              <Typography color={cajaAbierta ? "green" : "red"}>
                {cajaAbierta ? "Caja Abierta" : "Caja Cerrada"}
              </Typography>

              {!cajaAbierta ? (
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={() => setModalApertura(true)}
                >
                  Abrir Caja
                </Button>
              ) : (
                <>
                  <Button
                    fullWidth
                    variant="contained"
                    color="warning"
                    sx={{ mt: 2 }}
                    onClick={() => {
                      setModalArqueo(true);
                      cargarArqueo();
                    }}
                  >
                    Arqueo
                  </Button>

                  <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    sx={{ mt: 2 }}
                    onClick={() => setModalCierre(true)}
                  >
                    Cerrar Caja
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ========================== */}
        {/* 📊 Estadísticas */}
        {/* ========================== */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Cantidad de Ventas</Typography>
                  <Typography variant="h4" color="primary">
                    {totalVentas}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Dinero Recaudado</Typography>
                  <Typography variant="h4" color="success.main">
                    ${dineroTotal.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* ========================== */}
      {/* 🛒 Productos */}
      {/* ========================== */}
      <Typography variant="h5" fontWeight="bold" mt={4} mb={2}>
        Productos
      </Typography>

      <Grid container spacing={2}>
        {productos.map((p) => (
          <Grid item xs={12} sm={6} md={3} key={p.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{p.nombre}</Typography>
                <Typography color="primary">${p.precio}</Typography>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={() => addCart(p)}
                >
                  Agregar
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ========================== */}
      {/* 🛒 Carrito */}
      {/* ========================== */}
      <Box mt={4}>
        <Typography variant="h5" fontWeight="bold" mb={2}>
          Carrito
        </Typography>

        <Card>
          <CardContent>
            {carrito.length === 0 ? (
              <Typography>No hay productos agregados.</Typography>
            ) : (
              <>
                <List>
                  {carrito.map((item, idx) => (
                    <ListItem
                      key={idx}
                      secondaryAction={
                        <IconButton onClick={() => removeItem(idx)}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={item.nombre}
                        secondary={`$ ${item.precio}`}
                      />
                    </ListItem>
                  ))}
                </List>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6">
                  Total: $
                  {carrito
                    .reduce((acc, v) => acc + Number(v.precio), 0)
                    .toLocaleString()}
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  sx={{ mt: 2 }}
                  onClick={finalizarVenta}
                >
                  Finalizar Venta
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* ===================================================================== */}
      {/* 💵 MODALES: Apertura | Cierre | Arqueo */}
      {/* ===================================================================== */}

      {/* Modal Apertura */}
      <Dialog open={modalApertura} onClose={() => setModalApertura(false)}>
        <DialogTitle>Abrir Caja</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Monto inicial"
            type="number"
            sx={{ mt: 2 }}
            value={montoApertura}
            onChange={(e) => setMontoApertura(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalApertura(false)}>Cancelar</Button>
          <Button variant="contained" onClick={abrirCajaReal}>
            Abrir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Arqueo */}
      <Dialog open={modalArqueo} onClose={() => setModalArqueo(false)}>
        <DialogTitle>Arqueo de Caja</DialogTitle>
        <DialogContent>
          {arqueoInfo ? (
            <>
              <Typography>Monto inicial: ${arqueoInfo.monto_inicial}</Typography>
              <Typography>Ventas totales: ${arqueoInfo.total_ventas}</Typography>
              <Typography>
                Total en caja: $
                {Number(arqueoInfo.monto_inicial) +
                  Number(arqueoInfo.total_ventas)}
              </Typography>
            </>
          ) : (
            <Typography>Cargando...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalArqueo(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Cierre */}
      <Dialog open={modalCierre} onClose={() => setModalCierre(false)}>
        <DialogTitle>Cerrar Caja</DialogTitle>
        <DialogContent>
          <Typography>Total ventas: {totalVentas}</Typography>
          <Typography>Dinero total: ${dineroTotal}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalCierre(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={cerrarCajaReal}>
            Cerrar Caja
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
