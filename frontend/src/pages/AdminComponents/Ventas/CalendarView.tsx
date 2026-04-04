import React, { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg } from "@fullcalendar/interaction";
import { Box, Typography } from "@mui/material";
import type { Venta } from "../../../types/ventas";

interface Props {
  ventas: Venta[];
  onSelectDate: (fecha: string) => void;
}

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);

const CalendarView: React.FC<Props> = ({ ventas, onSelectDate }) => {
  
  // 🔥 AGRUPAR POR DÍA
  const events = useMemo(() => {
    const grouped: Record<string, { total: number; count: number }> = {};

    ventas.forEach((v) => {
      if (!v.fecha) return;

      const fecha = v.fecha.includes("T")
        ? v.fecha.split("T")[0]
        : v.fecha;

      
      if (!grouped[fecha]) {
        grouped[fecha] = { total: 0, count: 0 };
      }

      grouped[fecha].total += v.total;
      grouped[fecha].count += v.cantidad;
    });

    return Object.entries(grouped).map(([date, data]) => ({
      title: formatCOP(data.total),
      date,
      allDay: true,
      extendedProps: {
        total: data.total,
        count: data.count,
      },
    }));
  }, [ventas]);

  const handleDateClick = (info: DateClickArg) => {
    onSelectDate(info.dateStr);
  };

  // 🎨 COLOR DINÁMICO SEGÚN DINERO
  const getColor = (total: number) => {
    if (total > 500000) return "#2e7d32"; // alto
    if (total > 200000) return "#ed6c02"; // medio
    return "#1565c0"; // bajo
  };

  return (
    <Box
      sx={{
        borderRadius: 4,
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        border: "1px solid #eee",
        background: "#fff",
        p: 2,
      }}
    >
      {/* HEADER DASHBOARD */}
      <Box mb={2}>
        <Typography fontWeight={800} fontSize={18}>
          📅 Calendario de Ventas
        </Typography>
        <Typography fontSize={12} color="text.secondary">
          Visualiza ingresos diarios y accede al detalle por fecha
        </Typography>
      </Box>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height="75vh"
        events={events}
        dateClick={handleDateClick}
        dayMaxEvents={2}
        selectable

        // 🔥 HEADER MODERNO
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek",
        }}

        // 🔥 RENDER PERSONALIZADO
        eventContent={(eventInfo) => {
          const { total, count } = eventInfo.event.extendedProps;
          const color = getColor(total);

          return (
            <Box
              sx={{
                width: "100%",
                p: 0.5,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${color}, #ffffff)`,
                color: "#fff",
                fontSize: 9,
                fontWeight: 700,
                textAlign: "center",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              }}
            >
              💰 {formatCOP(total)}
              <br />
              🧾 {count} ventas
            </Box>
          );
        }}

        // 🔥 TOOLTIP
        eventDidMount={(info) => {
          const { total, count } = info.event.extendedProps;

          info.el.setAttribute(
            "title",
            `Total: ${formatCOP(total)}\nVentas: ${count}`
          );
        }}

        // 🔥 ESTILO GLOBAL
        dayCellClassNames={() => "calendar-day"}
      />

      {/* 🎨 ESTILOS EXTRA */}
      <style>
        {`
          .fc {
            font-family: 'Inter', sans-serif;
          }

          .fc-daygrid-day {
            transition: all .2s ease;
          }

          .fc-daygrid-day:hover {
            background: #f5faff;
            cursor: pointer;
          }

          .fc-toolbar-title {
            font-weight: 800;
            font-size: 18px;
          }

          .fc-button {
            border-radius: 8px !important;
            text-transform: capitalize !important;
            box-shadow: none !important;
          }

          .fc-button-primary {
            background: #1976d2 !important;
            border: none !important;
          }

          .fc-button-primary:hover {
            background: #1565c0 !important;
          }
        `}
      </style>
    </Box>
  );
};

export default CalendarView;