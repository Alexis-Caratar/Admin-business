/* ---------- /src/pages/CajeroDashboard.tsx ---------- */
import React, { useEffect, useState } from "react";
import { Avatar, Box, Grid, Card, CardContent, Typography, Stack, Chip, Button, TextField, InputAdornment, Collapse } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockIcon from "@mui/icons-material/Lock";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SavingsIcon from "@mui/icons-material/Savings";

import type { ProductoCajero, CategoriaCajero, Caja } from "../../../../types/cajero";
import { apiListarProductos, apiAbrirCaja, apiArqueoCaja, apiCerrarCaja, estado_caja, finalizar_venta } from "../../../../api/cajero";
import Swal from "sweetalert2";
import { Mesas } from "./components/Mesas";
import { Carrito } from "./components/Carrito";
import { AperturaCajaModal } from "./components/AperturaCaja";
import { ArqueoCajaModal } from "./components/ArqueoCaja";
import { CierreCajaModal } from "./components/CierreCaja";
import { ProductosCategoriaModal } from "./components/ProductosCategoria";
import { Categorias } from "./components/Categorias";
import { CarritoMobile } from "./components/CarritoMobile";
import PersonIcon from '@mui/icons-material/Person';

export const CajeroDashboard: React.FC = () => {
  const [categorias, setCategorias] = useState<CategoriaCajero[]>([]);
  const [caja, setCaja] = useState<Caja[]>([]);
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

  const [mesas] = useState(
    Array.from({ length: 18 }, (_, i) => ({
      id: i + 1,
      numero: i + 1,
      estado: ["Disponible", "Ocupada", "Reservada"][Math.floor(Math.random() * 3)],
    }))
  );
  const [mesaSeleccionada, setMesaSeleccionada] = useState<any | null>(null);

  const idUsuario = localStorage.getItem("id_usuario");



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
        setLoadingCategorias(true);
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
  const finalizarVenta = async (cliente:any,datos_adicionales:any) => {
    console.log("cliente",cliente);
        console.log("datos_adicionales",datos_adicionales);

    
    if (carrito.length === 0) return;
    console.log("carrito",carrito);
    

    const subtotal = carrito.reduce((acc, v) => acc + v.precio_venta * v.cantidad, 0);
    const descuento = 0; // Si tienes lógica de descuento
    const descuento_porcentaje = 0;
    const impuesto = 0;
    const total = subtotal - descuento + impuesto;

    const payload = {
      id_cliente: cliente ? cliente : 18, 
      id_caja: idCaja,
      fecha: new Date().toISOString(),
      subtotal,
      descuento,
      descuento_porcentaje,
      impuesto,
      total,
      estado: "PENDIENTE",
      nota: "",
      //para guardar en la tabla pagos
      metodo_pago: datos_adicionales.metodo_pago,
      monto_pagado:total,
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
        checkCaja();

      Swal.fire({
        icon: "success",
        title: "¡Venta Registrada!",
        text: "La operación se realizó correctamente.",
        showConfirmButton: true,
        confirmButtonColor: "#4CAF50",
      });    
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

        {/* MÉTRICAS DE VENTAS */}
        <Grid item xs={12} md={8}>
          <Grid
            container
            spacing={1}
            sx={{
              display: "flex",
              alignItems: "stretch"
            }}
          >

            {/* CARD 1 */}
            <Grid item xs={6}>
              <Card
                sx={{
                  borderRadius: 2,
                  boxShadow: 3,
                  height: { xs: 90, sm: 110, md: "auto" },   // 🔥 Fuerza tamaño pequeño en celulares
                  p: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center"
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Typography
                    fontWeight="bold"
                    sx={{
                      fontSize: { xs: "11px", sm: "13px", md: "16px" }
                    }}
                  >
                    Cantidad de Ventas
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: { xs: "18px", sm: "24px", md: "30px" },
                      fontWeight: "bold",
                      color: "primary.main"
                    }}
                  >
                    {caja.total_ventas}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* CARD 2 */}
            <Grid item xs={6}>
              <Card
                sx={{
                  borderRadius: 2,
                  boxShadow: 3,
                  height: { xs: 90, sm: 110, md: "auto" },   // 🔥 Igual altura, tamaño reducido
                  p: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center"
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Typography
                    fontWeight="bold"
                    sx={{
                      fontSize: { xs: "11px", sm: "13px", md: "16px" }
                    }}
                  >
                    Dinero Recaudado
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: { xs: "18px", sm: "24px", md: "30px" },
                      fontWeight: "bold",
                      color: "success.main"
                    }}
                  >
                    {caja.dinero_recaudado}
                  </Typography>
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
            width: { xs: "35%", md: "30%" },
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
            width: { xs: "100%", sm: "100%", md: "90%" }, // 🔥 MÓVIL 100% - ESCRITORIO 50%
            px: 1,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            maxHeight: "100%",
          }}
        >

          {/* MESAS */}
          <Box sx={{ flex: 1 }}>
            <Mesas mesas={mesas} onSelect={(m) => setMesaSeleccionada(m)} />
          </Box>
        </Box>


        {/* === CARRITO === */}
        {/* === CARRITO ESCRITORIO === */}
        <Box
          sx={{
            width: "40%",
            borderLeft: "1px solid #e0e0e0",
            pl: 1,
            display: { xs: "none", md: "flex" }, // ⬅️ OCULTAR EN MÓVIL, MOSTRAR EN DESKTOP
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
          <Carrito
            carrito={carrito}
            onRemove={removeItem}
            onAdd={sumarCantidad}
            onSub={restarCantidad}
            onFinalizar={finalizarVenta}
          />
        </Box>

        {/* === CARRITO MÓVIL (BOTÓN + MODAL) === */}
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <CarritoMobile
            carrito={carrito}
            onRemove={removeItem}
            onAdd={sumarCantidad}
            onSub={restarCantidad}
            onFinalizar={finalizarVenta}
          />
        </Box>


      </Box>


      {/* === MODALES === */}
      <AperturaCajaModal open={modalApertura} onClose={() => setModalApertura(false)} monto={montoApertura} setMonto={setMontoApertura} onAbrir={abrirCajaReal} />
      <ArqueoCajaModal open={modalArqueo} onClose={() => setModalArqueo(false)} arqueoInfo={arqueoInfo} />
      <CierreCajaModal open={modalCierre} onClose={() => setModalCierre(false)} totalVentas= {caja.total_ventas} dineroTotal={caja.dinero_recaudado} onCerrar={cerrarCajaReal} />
      <ProductosCategoriaModal open={modalProductosOpen} onClose={closeCategoria} categoria={categoriaSeleccionada ?? undefined} onAgregar={addCart}
      />
    </Box>



  );
};

export default CajeroDashboard;
