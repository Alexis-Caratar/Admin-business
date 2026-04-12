import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Box, Dialog, DialogContent } from "@mui/material";
import Loader from "../../../components/Loader";
import StatsCards from "./StatsCards";
import CalendarView from "./CalendarView";
import VentasDelDia from "./VentasDelDia";

import type { Venta } from "../../../types/ventas";
import { getResumenVentas, getVentasPorDia } from "../../../api/ventas";

const AdminVentas: React.FC = () => {
  // --- Estados ---
  const [resumen, setResumen] = useState<Venta[]>([]); // resumen por día
  const [ventasDelDia, setVentasDelDia] = useState<Venta[]>([]); // detalle por fecha
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // -------------------------------------------------------------------
  // Cargar resumen de ventas al montar
  // -------------------------------------------------------------------
  const loadResumen = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getResumenVentas(); // API que devuelve resumen por fecha
      setResumen(data.ventas || []);
    } catch (error) {
      console.error("Error cargando resumen de ventas:", error);
      setResumen([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResumen();
  }, [loadResumen]);

  // -------------------------------------------------------------------
  // Click en fecha: traer ventas completas
  // -------------------------------------------------------------------
  const handleDateClick = async (fecha: string) => {
    try {
      setLoading(true);
      setSelectedDate(fecha);

      const data = await getVentasPorDia(fecha); // API que devuelve ventas completas
      console.log("data",data);
      
      setVentasDelDia(data.ventas || []);
    } catch (error) {
      console.error("Error cargando ventas del día:", error);
      setVentasDelDia([]);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------
  // Estadísticas generales del resumen
  // -------------------------------------------------------------------
  const stats = useMemo(() => {
    if (!resumen.length) return { totalVentas: 0, totalDinero: 0,totalEgresos:0,totaltotal:0, ventaMayor: 0 };

    const totalVentas = resumen.reduce((sum, r) => sum + Number(r.cantidad || 0), 0);
    const totalDinero = resumen.reduce((sum, r) => sum + Number(r.total || 0), 0);
    const totalEgresos = resumen.reduce((sum, r) => sum + Number(r.egresos || 0), 0);
    const totaltotal = totalDinero-totalEgresos;
    const ventaMayor = Math.max(...resumen.map((r) => Number(r.total || 0)));


    return { totalVentas, totalDinero,totalEgresos,totaltotal, ventaMayor };
  }, [resumen]);

  if (loading && !resumen.length) {
  return <Loader text="Cargando ventas..." />;
}
  return (
    <Box p={3}>
      {/* TARJETAS DE ESTADÍSTICAS */}
      <StatsCards stats={stats} loading={loading} />

      {/* CALENDARIO */}
      <CalendarView ventas={resumen} onSelectDate={handleDateClick} />

      {/* MODAL: VENTAS POR DÍA */}
      <Dialog
        open={Boolean(selectedDate)}
        onClose={() => setSelectedDate(null)}
        fullWidth
        maxWidth="xl"
      >

        <DialogContent dividers>
        {loading ? (
          <Loader text="Cargando ventas del día..." />
        ) : (
          selectedDate && (
            <VentasDelDia
              ventas={ventasDelDia}
              fecha={selectedDate}
            />
          )
        )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AdminVentas;