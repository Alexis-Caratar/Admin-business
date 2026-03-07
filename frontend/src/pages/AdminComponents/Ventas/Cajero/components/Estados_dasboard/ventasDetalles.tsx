import React, { useEffect, useState, useMemo, useCallback } from "react";

import {
  Box,
  Card,
  Typography,
  Divider,
  Stack,
  Button,
  Avatar,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Pagination,
  IconButton,
  Paper,
  DialogActions,
  Collapse
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonIcon from "@mui/icons-material/Person";
import PaymentsIcon from "@mui/icons-material/Payments";
import CircularProgress from "@mui/material/CircularProgress";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { motion } from "framer-motion";

import { facturaPorCaja, productosPorVenta } from "../../../../../../api/cajero";

type Props = {
  open: boolean;
  onClose: () => void;
  id_caja: number;
};

export default function VentasDetalles({ open, onClose, id_caja }: Props) {

  const [ventas, setVentas] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [filtro, setFiltro] = useState("todas");
  const [productosVenta, setProductosVenta] = useState<any>({});
  const [expand, setExpand] = useState<any>({});
  const porPagina =10;

  /* ================= CARGAR VENTAS ================= */

  useEffect(() => {
    if (open && id_caja) cargarVentas();
  }, [open, id_caja]);

  const cargarVentas = async () => {

    const { data } = await facturaPorCaja({ id_caja });

    if (data?.ok) {
      setVentas(data.result);
    }

  };

  /* ================= CARGAR PRODUCTOS (LAZY) ================= */

  const cargarProductos = async (id_venta:number) => {

    if(productosVenta[id_venta]) return;

    const { data } = await productosPorVenta({ id_venta });

    setProductosVenta((prev:any)=>({
      ...prev,
      [id_venta]: data.result
    }));

  };


  
  /* ================= EXPAND CARD ================= */

  const toggleExpand = async (id:number) => {

    setExpand((prev:any)=>({
      ...prev,
      [id]: !prev[id]
    }));

    if(!productosVenta[id]) {
      cargarProductos(id);
    }

  };

  /* ================= METRICAS ================= */

  const metrics = useMemo(() => {

    const totalPagadas = ventas.filter(v => Number(v.estado_pago) === 1).length;

    const totalPendientes = ventas.filter(v => Number(v.estado_pago) === 0).length;

    const totalVentas = ventas
      .filter(v => Number(v.estado_pago) === 1)
      .reduce((acc, v) => acc + Number(v.venta_total || 0), 0);

    const pendiente_pago = ventas
      .filter(v => Number(v.estado_pago) === 0)
      .reduce((acc, v) => acc + Number(v.venta_total || 0), 0);

    return {
      totalPagadas,
      totalPendientes,
      totalVentas,
      pendiente_pago
    };

  }, [ventas]);

  const totalFacturas = ventas.length;

  /* ================= FILTROS ================= */

  const ventasFiltradas = useMemo(() => {

    let data = [...ventas];

    if (filtro === "pagadas") {
      data = data.filter(v => Number(v.estado_pago) === 1);
    }

    if (filtro === "pendientes") {
      data = data.filter(v => Number(v.estado_pago) === 0);
    }

    if (busqueda) {
      data = data.filter(v =>
        v.numero_factura?.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    return data;

  }, [ventas, filtro, busqueda]);

  /* ================= PAGINACION ================= */

  const totalPaginas = Math.ceil(ventasFiltradas.length / porPagina);

  const ventasPagina = useMemo(()=>{

    const inicio = (pagina - 1) * porPagina;
    return ventasFiltradas.slice(inicio, inicio + porPagina);

  },[ventasFiltradas,pagina]);

  const imprimir = useCallback(()=>{
    window.print();
  },[]);


  
  return (

    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">

      {/* HEADER */}

      <DialogTitle sx={{borderBottom:"1px solid #eee"}}>

        <Stack direction="row" justifyContent="space-between">

          <Stack direction="row" spacing={2} alignItems="center">

            <Avatar sx={{bgcolor:"primary.main"}}>
              <ReceiptLongIcon/>
            </Avatar>

            <Box>

              <Typography fontWeight={700}>
                Ventas del día
              </Typography>

              <Typography variant="caption" color="text.secondary">
                {new Date().toLocaleDateString("es-CO")}
              </Typography>

            </Box>

          </Stack>

          <IconButton onClick={onClose}>
            <CloseIcon/>
          </IconButton>

        </Stack>

      </DialogTitle>

      {/* CONTENIDO */}

      <DialogContent>

        {/* BUSCADOR */}

        <Box mb={3}>

          <TextField
            fullWidth
            size="small"
            placeholder="Buscar factura..."
            value={busqueda}
            onChange={(e)=>{
              setBusqueda(e.target.value)
              setPagina(1)
            }}
            InputProps={{
              startAdornment:<SearchIcon sx={{mr:1}}/>
            }}
          />

        </Box>

        {/* METRICAS */}

        <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">

          <Paper onClick={()=>setFiltro("todas")} sx={{p:2,cursor:"pointer"}}>
            <Typography fontSize={12}>Facturas</Typography>
            <Typography fontWeight="bold">{totalFacturas}</Typography>
          </Paper>

          <Paper onClick={()=>setFiltro("pagadas")} sx={{p:2,cursor:"pointer",bgcolor:"#e8f5e9"}}>
            <Typography fontSize={12}>Pagadas</Typography>
            <Typography fontWeight="bold" color="success.main">
              {metrics.totalPagadas}
            </Typography>
          </Paper>

          <Paper onClick={()=>setFiltro("pendientes")} sx={{p:2,cursor:"pointer",bgcolor:"#ffebee"}}>
            <Typography fontSize={12}>Pendientes</Typography>
            <Typography fontWeight="bold" color="error.main">
              {metrics.totalPendientes}
            </Typography>
          </Paper>

        </Stack>

        {/* FACTURAS */}

        <Grid container spacing={3}>

          {ventasPagina.map((venta)=>(
            <Grid item xs={12} md={6} lg={4} key={venta.id_venta}>

              <motion.div whileHover={{scale:1.03}}>

                <Card sx={{borderRadius:3,p:2}}>

                  <Stack direction="row" justifyContent="space-between">

                    <Stack direction="row" spacing={1} alignItems="center">

                      <Avatar sx={{width:32,height:32}}>
                        <ReceiptLongIcon sx={{fontSize:18}}/>
                      </Avatar>

                      <Box>

                        <Typography fontWeight={700} fontSize={13}>
                          {venta.numero_factura}
                        </Typography>

                        <Typography variant="caption">
                          {venta.fecha}
                        </Typography>

                      </Box>

                    </Stack>

                    <Stack direction="row" spacing={1}>

                      <IconButton size="small" onClick={()=>toggleExpand(venta.id_venta)}>
                        <ExpandMoreIcon/>
                      </IconButton>

                      <IconButton size="small" onClick={imprimir}>
                        <PrintIcon/>
                      </IconButton>

                    </Stack>

                  </Stack>

                  <Divider sx={{my:1}}/>

                  <Stack spacing={1}>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <PersonIcon sx={{fontSize:16}}/>
                      <Typography fontSize={12}>
                        {venta.nombre_completo}
                      </Typography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between">

                      <Typography fontSize={12}>
                        Total
                      </Typography>

                      <Typography fontWeight={700}>
                        ${Number(venta.venta_total).toLocaleString()}
                      </Typography>

                    </Stack>

                    <Chip
                      label={venta.metodo_pago}
                      color={venta.estado_pago === 1 ? "success" : "error"}
                      size="small"
                    />

                  </Stack>

                  {/* PRODUCTOS LAZY */}

                  <Collapse in={expand[venta.id_venta]}>

                    <Divider sx={{my:1}}/>

                    <Stack spacing={1}>

                      {productosVenta[venta.id_venta]?.map((p:any)=>(
                        <Stack key={p.id_producto} direction="row" spacing={1} alignItems="center">

                          <Avatar
                            src={p.url_imagen}
                            variant="rounded"
                            sx={{width:28,height:28}}
                          />

                          <Box flex={1}>

                            <Typography fontSize={12}>
                              {p.nombre}
                            </Typography>

                            <Typography fontSize={10}>
                              x{p.cantidad}
                            </Typography>

                          </Box>

                          <Typography fontSize={12} fontWeight={700}>
                            ${Number(p.subtotal).toLocaleString()}
                          </Typography>

                        </Stack>
                      ))}

                    </Stack>

                  </Collapse>

                </Card>

              </motion.div>

            </Grid>
          ))}

        </Grid>

        {/* PAGINACION */}

        <Box mt={4} display="flex" justifyContent="center">

          <Pagination
            count={totalPaginas}
            page={pagina}
            onChange={(e,v)=>setPagina(v)}
          />

        </Box>

      </DialogContent>

      {/* FOOTER */}

      <DialogActions sx={{borderTop:"1px solid #eee"}}>

        <Stack direction="row" spacing={2} ml="auto">

          <Paper sx={{px:3,py:1,bgcolor:"#ffebee"}}>
            <Typography color="error.main" fontWeight="bold">
              Por cobrar: ${metrics.pendiente_pago.toLocaleString()}
            </Typography>
          </Paper>

          <Paper sx={{px:3,py:1,bgcolor:"#e8f5e9"}}>
            <Typography color="success.main" fontWeight="bold">
              Vendido: ${metrics.totalVentas.toLocaleString()}
            </Typography>
          </Paper>

        </Stack>

      </DialogActions>

    </Dialog>

  );

}