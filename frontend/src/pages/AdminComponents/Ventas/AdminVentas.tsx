import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Box, Dialog, DialogContent, DialogTitle } from "@mui/material";

import StatsCards from "./StatsCards";
import CalendarView from "./CalendarView";
import VentasDelDia from "./VentasDelDia";

import type { Venta } from "../../../types/ventas";
import { getVentas } from "../../../api/ventas";

const AdminVentas: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // -------------------------------------------------------------------
  // Cargar ventas desde la API
  // -------------------------------------------------------------------
  const loadVentas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getVentas();

      // Normalización por si la API devuelve estructura { ok, ventas }
      setVentas(Array.isArray(data?.ventas) ? data.ventas : data ?? []);
    } catch (error) {
      console.error("Error cargando ventas:", error);
      setVentas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVentas();
  }, [loadVentas]);

  // -------------------------------------------------------------------
  // Estadísticas calculadas
  // -------------------------------------------------------------------
  const stats = useMemo(() => {
    if (!ventas.length) {
      return {
        totalVentas: 0,
        totalDinero: 0,
        ventaMayor: 0,
      };
    }

    const totalVentas = ventas.length;
    const totalDinero = ventas.reduce((sum, v) => sum + Number(v.total || 0), 0);
    const ventaMayor = Math.max(...ventas.map((v) => Number(v.total || 0)));

    return { totalVentas, totalDinero, ventaMayor };
  }, [ventas]);

  // -------------------------------------------------------------------
  // Render UI
  // -------------------------------------------------------------------
  return (
    <Box p={3}>
      {/* TARJETAS DE ESTADÍSTICAS */}
      <StatsCards stats={stats} loading={loading} />

      {/* CALENDARIO */}
      <CalendarView ventas={ventas} onSelectDate={setSelectedDate} />

      {/* MODAL: VENTAS POR DÍA */}
      <Dialog
        open={Boolean(selectedDate)}
        onClose={() => setSelectedDate(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>
          Ventas del {selectedDate}
        </DialogTitle>

        <DialogContent dividers>
          {selectedDate && (
            <VentasDelDia ventas={ventas} fecha={selectedDate} />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AdminVentas;
