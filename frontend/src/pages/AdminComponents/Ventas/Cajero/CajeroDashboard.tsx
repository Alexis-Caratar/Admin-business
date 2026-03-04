/* ---------- /src/pages/CajeroDashboard.tsx ---------- */
import React, { useEffect, useState } from "react";
import { Avatar, Box, Grid, Card, CardContent, Typography, Stack, Chip, Button, TextField, InputAdornment, Collapse, Drawer, Fab, useTheme, useMediaQuery, Badge, Dialog } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockIcon from "@mui/icons-material/Lock";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SavingsIcon from "@mui/icons-material/Savings";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import type { ProductoCajero, CategoriaCajero, Caja, Mesa } from "../../../../types/cajero";
import { apiListarProductos, apiAbrirCaja, apiArqueoCaja, apiCerrarCaja, estado_caja, finalizar_venta, apimesas } from "../../../../api/cajero";
import Swal from "sweetalert2";
import { Mesas } from "./components/Mesas";
import { Carrito } from "./components/Carrito";
import { AperturaCajaModal } from "./components/AperturaCaja";
import { ArqueoCajaModal } from "./components/ArqueoCaja";
import { CierreCajaModal } from "./components/CierreCaja";
import { ProductosCategoriaModal } from "./components/ProductosCategoria";
import { Categorias } from "./components/Categorias";
import { CarritoMobile } from "./components/CarritoMobile";
import Egresos from "./components/Egresos";
import PersonIcon from '@mui/icons-material/Person';
import { motion } from "framer-motion";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import PaymentsIcon from "@mui/icons-material/Payments";

export const CajeroDashboard: React.FC = () => {
  const [categorias, setCategorias] = useState<CategoriaCajero[]>([]);
  const [caja, setCaja] = useState<Caja | null>(null);

  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [montoApertura, setMontoApertura] = useState("");
  const [idCaja, setIdCaja] = useState<number | null>(null);
  const [ventas, setVentas] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<(ProductoCajero & { cantidad: number; precio_venta: number })[]>([]);
  const [modalApertura, setModalApertura] = useState(false);
  const [modalCierre, setModalCierre] = useState(false);
  const [modalArqueo, setModalArqueo] = useState(false);
  const [arqueoInfo, setArqueoInfo] = useState<any | null>(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaCajero | null>(null);
  const [modalProductosOpen, setModalProductosOpen] = useState(false);
  const [openCarrito, setOpenCarrito] = useState(false);
  const [openEgresos, setOpenEgresos] = useState(false);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [openVentaRegistrada, setOpenVentaRegistrada] = useState(false);
  const [ventaPayload, setVentaPayload] = useState<any>(null);

  const idUsuario = localStorage.getItem("id_usuario");
  const id_negocio = localStorage.getItem("id_negocio");

  const abrirCarrito = () => {
    setOpenCarrito(true);
  };

 const cargarMesas = async () => {
  try {
    const { data } = await apimesas({ id_negocio });
    if (data?.ok && Array.isArray(data.result)) {
      setMesas(data.result);
    }
  } catch (err) {
    console.error("Error cargando mesas:", err);
  }
};

useEffect(() => {
  cargarMesas();
}, []);


  const checkCaja = async () => {
    try {
      const idUsuario = localStorage.getItem("id_usuario");
      const { data } = await estado_caja({ id_usuario: idUsuario });      

      if (data?.ok && data.estado.length > 0) {
        setCajaAbierta(true);
        setCaja(data.estado[0]);
        setIdCaja(data.estado[0].id);
        setMontoApertura(data.estado[0].monto_inicial.toString());
      } else {
        setModalApertura(true);
      }
    } catch (err) {
      console.error("Error consultando estado de caja:", err);
      setModalApertura(true);
    }
  };


  useEffect(() => {
    checkCaja();
  }, []);


  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoadingCategorias(true); setOpenCarrito
        const res = await apiListarProductos();
        let data: any[] = [];
        if (res && res.data) {
          if (Array.isArray(res.data)) data = res.data;
          else if (res.data.ok && res.data.productos) data = res.data.productos;
          else if (res.data.productos) data = res.data.productos;
        }
        if (mounted) setCategorias(data || []);
      } catch (err) {
        console.error("Error cargando categorías y productos:", err);
      } finally {
        if (mounted) setLoadingCategorias(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  //  const totalVentas = ventas.length;
  // const dineroTotal = ventas.reduce((acc, v) => acc + Number(v.total ?? 0), 0);

  const getPrecio = (p: Partial<ProductoCajero>) => Number(p.precio_venta ?? 0);


  const addCart = (p: ProductoCajero) => {
    const precio = getPrecio(p);
    setCarrito((prev) => {
      // Buscamos si ya existe exactamente el mismo producto
      const existe = prev.find((x) => x.id === p.id);

      if (existe) {
        // Si existe, incrementamos cantidad
        return prev.map((x) =>
          x.id === p.id ? { ...x, cantidad: x.cantidad + 1 } : x
        );
      }

      // Si no existe, lo agregamos como un nuevo item
      return [...prev, { ...p, cantidad: 1, precio_venta: precio }];
    });
  };


  const sumarCantidad = (id: number) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      )
    );
  };

  const restarCantidad = (id: number) => {
    setCarrito((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, cantidad: item.cantidad - 1 }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const removeItem = (id: number) => {
    setCarrito((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };


  //Finalizar venta
 const finalizarVenta = async (cliente: any, datos_adicionales: any) => {
  if (carrito.length === 0) return;

  const subtotal = carrito.reduce((acc, v) => acc + v.precio_venta * v.cantidad, 0);
  const descuento = 0;
  const impuesto = 0;
  const total = subtotal - descuento + impuesto;

  const payload = {
    id_cliente: cliente ? cliente : 18,
    id_caja: idCaja,
    id_mesa: mesaSeleccionada?.id,
    fecha: new Date().toISOString(),
    subtotal,
    descuento,
    descuento_porcentaje: 0,
    impuesto,
    total,
    estado: "PENDIENTE",
    nota: "",
    metodo_pago: datos_adicionales.metodo_pago,
    monto_pagado: total,
    monto_recibido: datos_adicionales.monto_recibido,
    cambio: datos_adicionales.cambio,
    productos: carrito.map((p) => ({
      id_producto: p.id,
      cantidad: p.cantidad,
      precio_unitario: p.precio_venta,
      descuento: 0,
      descuento_porcentaje: 0,
      impuesto: 0,
      subtotal: p.precio_venta * p.cantidad,
    })),
  };

  try {
    const { data } = await finalizar_venta(payload);
    if (data.ok) {
      setVentas((prev) => [...prev, { ...payload }]);
      setCarrito([]);
      setMesaSeleccionada(null);
      checkCaja();
      cargarMesas();

      // Abrir diálogo en lugar de Swal
      setVentaPayload(payload);
      setOpenVentaRegistrada(true);
    }
  } catch (err) {
    console.error("Error finalizando venta:", err);
  }
};
  //aperturar la caja 
  const abrirCajaReal = async () => {
    try {
      const { data } = await apiAbrirCaja({ id_usuario: idUsuario, monto_inicial: Number(montoApertura) });
      if (data?.ok) {
        setCajaAbierta(true);
        setIdCaja(data.result.id);
        setModalApertura(false);

        // Llamamos arqueo usando el ID recién recibido
        cargarArqueo(data.result.id);
        cerrarCajaReal(data.result.id);
      }
    } catch (err) {
      console.error("Error abrirCajaReal:", err);
    }
  };

  const cargarArqueo = async (id_caja_param?: number) => {
    try {
      const { data } = await apiArqueoCaja({ id_caja: id_caja_param ?? idCaja });
      if (data?.ok) setArqueoInfo(data.result);
    } catch (err) {
      console.error("Error arqueo:", err);
    }
  };

  const cerrarCajaReal = async () => {
    console.log("id caja", idCaja);

    if (!idCaja) {
      console.error("No hay una caja abierta para cerrar.");
      return;
    }

    try {
      const montoFinal =
        Number(montoApertura) +
        carrito.reduce((acc, v) => acc + v.precio_venta * v.cantidad, 0);

      const { data } = await apiCerrarCaja({
        id_caja: idCaja,
        monto_final: montoFinal,
      });

      if (data?.ok) {
        setCajaAbierta(false);
        setVentas([]);
        setCarrito([]);
        setMontoApertura("");
        setIdCaja(null); // limpiamos el ID
        setModalCierre(false);
        checkCaja();
      }
    } catch (err) {
      console.error("Error cerrarCajaReal:", err);
    }
  };


  const openCategoria = (categoria: CategoriaCajero) => {
    setCategoriaSeleccionada(categoria);
    setModalProductosOpen(true);
  };
  const closeCategoria = () => {
    setCategoriaSeleccionada(null);
    setModalProductosOpen(false);
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", p: 0, ml: 0 }}>

      <Typography
        sx={{
          display: 'flex',         // Para que icono y texto queden en línea
          alignItems: 'center',    // Centrar verticalmente
          borderRadius: 4,
          boxShadow: "0px 4px 20px rgba(0,0,0,0.12)",
          p: 1,
        }}
        variant="h5"
        fontWeight="bold"
        mb={2}
      >
        <PersonIcon sx={{ mr: 1, color: 'primary.main' }} /> {/* mr: margen a la derecha */}
        Perfil del Cajero
      </Typography>

      {/* === ESTADÍSTICAS SUPERIORES === */}
      <Grid container spacing={2} mb={1}>
        {/* Estado de Caja */}

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 4,
              boxShadow: "0px 4px 20px rgba(0,0,0,0.12)",
              p: 1,
            }}
          >
            <CardContent>
              <Stack spacing={2}>
                {/* ---------- TÍTULO ---------- */}
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: cajaAbierta ? "success.light" : "error.light",
                      width: 50,
                      height: 50,
                    }}
                  >
                    {cajaAbierta ? (
                      <LockOpenIcon sx={{ fontSize: 30, color: "success.dark" }} />
                    ) : (
                      <LockIcon sx={{ fontSize: 30, color: "error.dark" }} />
                    )}
                  </Avatar>

                  <Stack>
                    <Typography variant="body2" fontWeight="bold">
                      Estado de Caja
                    </Typography>
                    <Chip
                      label={cajaAbierta ? "Caja Abierta" : "Caja Cerrada"}
                      color={cajaAbierta ? "success" : "error"}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Stack>
                </Stack>

                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<LockOpenIcon />}
                  onClick={() => {
                    if (!cajaAbierta) setModalApertura(true);
                    else setExpanded(!expanded); // expandir si la caja está abierta
                  }}
                  sx={{ py: 0.5, borderRadius: 3 }}
                >
                  {cajaAbierta ? (expanded ? "MENOS INFO" : "MAS INFO") : "Abrir Caja"}
                </Button>

                {/* ---------- BOTONES COLAPSABLES ---------- */}
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                  <Stack spacing={1.5} sx={{ mt: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="warning"
                      startIcon={<ReceiptLongIcon />}
                      onClick={() => {
                        setModalArqueo(true);
                        cargarArqueo();
                      }}
                      sx={{ py: 1.3, borderRadius: 3, fontWeight: "bold" }}
                    >
                      Arqueo
                    </Button>

                    <Button
                      fullWidth
                      variant="contained"
                      color="error"
                      startIcon={<SavingsIcon />}
                      onClick={() => setModalCierre(true)}
                      sx={{ py: 1.3, borderRadius: 3, fontWeight: "bold" }}
                    >
                      Cerrar Caja
                    </Button>
                  </Stack>
                </Collapse>
              </Stack>
            </CardContent>
          </Card>
        </Grid>


        {/* ================= MÉTRICAS ================= */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>

            {/* ===== MONTO INICIAL ===== */}
            <Grid item xs={12} sm={4}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                  transition: "all .25s",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <CardContent sx={{ textAlign: "center" }}>
                  <Avatar
                    sx={{
                      bgcolor: "primary.light",
                      color: "black",
                      width: 48,
                      height: 48,
                      mx: "auto",
                      mb: 1,
                    }}
                  >
                    <MonetizationOnIcon />
                  </Avatar>

                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: "text.secondary" }}
                  >
                    Monto inicial
                  </Typography>

                  {caja && (
                    <Typography>
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "COP",
                        minimumFractionDigits: 0,
                      }).format(caja.monto_inicial)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* ===== TOTAL VENTAS ===== */}
            <Grid item xs={12} sm={4}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                  transition: "all .25s",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <CardContent sx={{ textAlign: "center" }}>
                  <Avatar
                    sx={{
                      bgcolor: "purple",
                      color: "black",
                      width: 48,
                      height: 48,
                      mx: "auto",
                      mb: 1,
                    }}
                  >
                    <ShoppingCartIcon />
                  </Avatar>

                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: "text.secondary" }}
                  >
                    Ventas realizadas
                  </Typography>

                  {caja && (
                    <Typography>
                      {caja.total_ventas}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* ===== DINERO RECAUDADO ===== */}
            <Grid item xs={12} sm={4}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                  transition: "all .25s",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <CardContent sx={{ textAlign: "center" }}>
                  <Avatar
                    sx={{
                      bgcolor: "success.light",
                      color: "white",
                      width: 48,
                      height: 48,
                      mx: "auto",
                      mb: 1,
                    }}
                  >
                    <PaymentsIcon />
                  </Avatar>

                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: "text.secondary" }}
                  >
                    Dinero recaudado
                  </Typography>

                  {caja && (
                    <Typography>
                    ${caja.dinero_recaudado}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

              {/* ===== EGRESOS ===== */}
         <Grid item xs={12} sm={4}>
            <Card
              onClick={() => setOpenEgresos(true)}
              sx={{
                height: "100%",
                borderRadius: 3,
                boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                transition: "all .25s",
                cursor: "pointer",
                "&:hover": {
                  transform: "translateY(-6px)",
                  boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
                },
              }}
            >
              <CardContent sx={{ textAlign: "center" }}>
                <Avatar
                  sx={{
                    bgcolor: "error.light",
                    color: "white",
                    width: 48,
                    height: 48,
                    mx: "auto",
                    mb: 1,
                  }}
                >
                  <PaymentsIcon />
                </Avatar>

                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: "text.secondary" }}
                >
                  Egresos
                </Typography>

                {caja && (
                  <Typography fontWeight={700} color="error.main">
                    ${caja.total_egresos}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          </Grid>
        </Grid>

      </Grid>


      {/* === CONTENIDO PRINCIPAL === */}
      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* === Categorías === */}
        <Box
          sx={{
            width: { xs: "35%", sm: "35%", md: "30%" },
            borderRight: { xs: "none", md: "1px solid #e0e0e0" },
            pr: { xs: 0, md: 1 },
            mb: { xs: 2, md: 0 }, // margen inferior en móvil
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            maxHeight: "100%",
          }}
        >
          <Categorias
            categorias={categorias}
            loading={loadingCategorias}
            onOpen={openCategoria}
          />
        </Box>



        {/* === MESAS === */}
        <Box
          sx={{
            width: { xs: "100%", sm: "100%", md: "80%" }, // 🔥 MÓVIL 100% - ESCRITORIO 50%
            px: 1,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            maxHeight: "100%",
          }}
        >

          {/* MESAS */}
          <Box sx={{ flex: 1 }}>
      <Mesas
      id_negocio={id_negocio}
      mesas={mesas}
      onSelect={(m) =>
        setMesaSeleccionada((prev) => (prev?.id === m.id ? null : m))
      }
    />
          </Box>
        </Box>


        {/* === BOTÓN ABRIR CARRITO EN DESKTOP === */}

        {!openCarrito && !isMobile && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            sx={{
              position: "fixed",
              bottom: 24,
              right: 24,
              zIndex: 1400,
            }}
          >
            <Fab
              color="primary"
              variant="extended"
              onClick={abrirCarrito}
              sx={{ position: "relative" }}
            >
              <Badge
                badgeContent={carrito.length}
                color="error"
                sx={{
                  "& .MuiBadge-badge": {
                    fontWeight: "bold",
                  },
                }}
              >
                <ShoppingCartIcon sx={{ mr: 1 }} />
              </Badge>
              Ver Carrito
            </Fab>

          </Box>
        )}



        {/* === DRAWER / CARRITO ESCRITORIO === */}
        <Drawer
          anchor="right"
          open={openCarrito && !isMobile}
          onClose={() => setOpenCarrito(false)}
          sx={{
            "& .MuiDrawer-paper": {
              width: 400,
              p: 2,
              boxSizing: "border-box",
            },
          }}
        >
          <Carrito
            carrito={carrito}
            onRemove={removeItem}
            onAdd={sumarCantidad}
            onSub={restarCantidad}
            onFinalizar={(c, p) => {
              finalizarVenta(c, p);
              setOpenCarrito(false);
            }}
             mesaSeleccionada={mesaSeleccionada}

          />
        </Drawer>


        {/* === CARRITO MÓVIL === */}
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          {isMobile && (
            <CarritoMobile
              open={openCarrito}
              onClose={() => setOpenCarrito(false)}
              carrito={carrito}
              onRemove={removeItem}
              onAdd={sumarCantidad}
              onSub={restarCantidad}
              onFinalizar={(c, p) => {
                finalizarVenta(c, p);
                setOpenCarrito(false);
              }}
            />
          )}

        </Box>


      </Box>


      {/* === MODALES === */}
      <AperturaCajaModal open={modalApertura} onClose={() => setModalApertura(false)} monto={montoApertura} setMonto={setMontoApertura} onAbrir={abrirCajaReal} />
      <ArqueoCajaModal open={modalArqueo} onClose={() => setModalArqueo(false)} arqueoInfo={arqueoInfo} />
      <CierreCajaModal open={modalCierre} onClose={() => setModalCierre(false)} totalVentas={caja?.total_ventas ?? 0} dineroTotal={caja?.dinero_recaudado ?? 0} onCerrar={cerrarCajaReal} />
      <ProductosCategoriaModal open={modalProductosOpen} onClose={closeCategoria} categoria={categoriaSeleccionada ?? undefined} categorias={categorias} onAgregar={addCart} />
      <Egresos open={openEgresos} onClose={() => setOpenEgresos(false)} id_negocio={id_negocio} id_caja={idCaja}/>
   
   {/* === DIALOG VENTA REGISTRADA === */}
      <Dialog
        open={openVentaRegistrada}
        onClose={() => setOpenVentaRegistrada(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 3,
            minWidth: 360,
            maxWidth: 420,
            textAlign: "center",
            boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
          },
        }}
      >
        <Box mb={2}>
          <Box
            sx={{
              bgcolor: "success.main",
              color: "white",
              borderRadius: "50%",
              width: 60,
              height: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
              fontSize: 32,
            }}
          >
            ✅
          </Box>

          <Typography variant="h6" fontWeight={600} gutterBottom>
            ¡Venta Registrada!
          </Typography>

          {ventaPayload && (
            <Typography variant="body2" color="text.secondary">
              Total: <strong>${ventaPayload.total.toLocaleString()}</strong>
              <br />
              Método de pago: <strong>{ventaPayload.metodo_pago}</strong>
            </Typography>
          )}
        </Box>

        <Stack direction="row" justifyContent="center" spacing={2} mt={4}>
          <Button
            variant="contained"
            color="success"
            onClick={() => setOpenVentaRegistrada(false)}
            sx={{ borderRadius: 3, px: 4, textTransform: "none" }}
          >
            Aceptar
          </Button>
        </Stack>
      </Dialog>
    </Box>



  );
};

export default CajeroDashboard;
