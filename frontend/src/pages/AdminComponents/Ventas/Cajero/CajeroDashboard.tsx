/* ---------- /src/pages/CajeroDashboard.tsx ---------- */
import React, { useEffect, useState } from "react";
import { Box, Grid, Card, CardContent, Typography, Stack, Chip, Button } from "@mui/material";

import type { ProductoCajero, CategoriaCajero } from "../../../../types/cajero";
import { apiListarProductos, apiAbrirCaja, apiArqueoCaja, apiCerrarCaja } from "../../../../api/cajero";

import { Mesas } from "./components/Mesas";
import { Carrito } from "./components/Carrito";
import { AperturaCajaModal } from "./components/AperturaCaja";
import { ArqueoCajaModal } from "./components/ArqueoCaja";
import { CierreCajaModal } from "./components/CierreCaja";
import { ProductosCategoriaModal } from "./components/ProductosCategoria";
import { Categorias } from "./components/Categorias";

export const CajeroDashboard: React.FC = () => {
  const [categorias, setCategorias] = useState<CategoriaCajero[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);

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

  const totalVentas = ventas.length;
  const dineroTotal = ventas.reduce((acc, v) => acc + Number(v.total ?? 0), 0);

  const getPrecio = (p: Partial<ProductoCajero>) => Number(p.precio_venta ?? 0);

const addCart = (p: ProductoCajero) => {
console.log("p",p);


  const precio = getPrecio(p);

  setCarrito((prev) => {
    // Buscamos si ya existe exactamente el mismo producto
    const existe = prev.find((x) => x.id_producto === p.id_producto);

    if (existe) {
      // Si existe, incrementamos cantidad
      return prev.map((x) =>
        x.id_producto === p.id_producto ? { ...x, cantidad: x.cantidad + 1 } : x
      );
    }

    // Si no existe, lo agregamos como un nuevo item
    return [...prev, { ...p, cantidad: 1, precio_venta: precio }];
  });
};


  const sumarCantidad = (id: number) => setCarrito((prev) => prev.map((item) => (item.id === id ? { ...item, cantidad: item.cantidad + 1 } : item)));
  const restarCantidad = (id: number) =>
    setCarrito((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, cantidad: item.cantidad - 1 } : item))
        .filter((item) => item.cantidad > 0)
    );
  const removeItem = (id: number) => setCarrito((prev) => prev.filter((item) => item.id !== id));

  const finalizarVenta = async () => {
    if (carrito.length === 0) return;
    const total = carrito.reduce((acc, v) => acc + v.precio_venta * v.cantidad, 0);
    setVentas((prev) => [...prev, { id: Date.now(), fecha: new Date().toISOString(), total, productos: carrito }]);
    setCarrito([]);
  };

  const abrirCajaReal = async () => {
    try {
      const { data } = await apiAbrirCaja({ id_usuario: 1, monto_inicial: Number(montoApertura) });
      if (data?.ok) {
        setCajaAbierta(true);
        setIdCaja(data.result.id);
        setModalApertura(false);
      }
    } catch (err) {
      console.error("Error abrirCajaReal:", err);
    }
  };

  const cargarArqueo = async () => {
    try {
      const { data } = await apiArqueoCaja({ id_caja: idCaja });
      if (data?.ok) setArqueoInfo(data.result);
    } catch (err) {
      console.error("Error arqueo:", err);
    }
  };

  const cerrarCajaReal = async () => {
    try {
      const { data } = await apiCerrarCaja({
        id_caja: idCaja ?? 0,
        monto_final: Number(montoApertura) + carrito.reduce((acc, v) => acc + v.precio_venta * v.cantidad, 0),
      });
      if (data?.ok) {
        setCajaAbierta(false);
        setVentas([]);
        setCarrito([]);
        setMontoApertura("");
        setIdCaja(null);
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
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", p: 3 }}>
      <Typography variant="h4" fontWeight="bold" mb={2}>
        Perfil del Cajero
      </Typography>



      <Grid container spacing={2} mb={3}>
        {/* Estado de Caja */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="h6">Estado de Caja</Typography>

                <Chip
                  label={cajaAbierta ? "Caja Abierta" : "Caja Cerrada"}
                  color={cajaAbierta ? "success" : "error"}
                  sx={{ width: "fit-content" }}
                />

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
                  <Stack spacing={1} sx={{ mt: 2 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="warning"
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
                      onClick={() => setModalCierre(true)}
                    >
                      Cerrar Caja
                    </Button>
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Estadísticas de Ventas */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h6">Cantidad de Ventas</Typography>
                  <Typography variant="h4" color="primary">{totalVentas}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6}>
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
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

{/* esto es el contenido mas importante */}
      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Categorías */}
        <Box sx={{ width: "20%", borderRight: "1px solid #e0e0e0", pr: 1, display: "flex", flexDirection: "column", overflowY: "auto", minHeight: 0 }}>
          <Categorias categorias={categorias} loading={loadingCategorias} onOpen={openCategoria} />
        </Box>

        {/* Mesas */}
        <Box sx={{ width: "60%", px: 2, display: "flex", flexDirection: "column", overflowY: "auto", minHeight: 0 }}>
          <Mesas mesas={mesas} onSelect={(m) => setMesaSeleccionada(m)} />
        </Box>

        {/* Carrito */}
        <Box sx={{ width: "20%", borderLeft: "1px solid #e0e0e0", pl: 3, display: "flex", flexDirection: "column", overflowY: "auto", minHeight: 0 }}>
<Carrito
  carrito={carrito}
  onRemove={removeItem}
  onAdd={sumarCantidad}
  onSub={restarCantidad}
  onFinalizar={finalizarVenta}
/>
        </Box>
      </Box>

      {/* Modales */}
      <AperturaCajaModal open={modalApertura} onClose={() => setModalApertura(false)} monto={montoApertura} setMonto={setMontoApertura} onAbrir={abrirCajaReal} />
      <ArqueoCajaModal open={modalArqueo} onClose={() => setModalArqueo(false)} arqueoInfo={arqueoInfo} />
      <CierreCajaModal open={modalCierre} onClose={() => setModalCierre(false)} totalVentas={totalVentas} dineroTotal={dineroTotal} onCerrar={cerrarCajaReal} />
<ProductosCategoriaModal
  open={modalProductosOpen}
  onClose={closeCategoria}
  categoria={categoriaSeleccionada ?? undefined}
  onAgregar={addCart}
/>
    </Box>



  );
};

export default CajeroDashboard;
