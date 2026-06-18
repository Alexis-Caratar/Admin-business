import React, { useMemo } from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import type { DateClickArg } from "@fullcalendar/interaction";

import {
  Box,
  Typography,
 Chip,
} from "@mui/material";

import type { Venta } from "../../../../types/ventas";

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

const CalendarView: React.FC<Props> = ({
  ventas,
  onSelectDate,
}) => {
  // =====================================================
  // AGRUPAR VENTAS POR FECHA
  // =====================================================

  const events = useMemo(() => {
    const grouped: Record<
      string,
      {
        total: number;
        count: number;
      }
    > = {};

    ventas.forEach((v) => {
      if (!v.fecha) return;

      const fecha = v.fecha.includes("T")
        ? v.fecha.split("T")[0]
        : v.fecha;

      if (!grouped[fecha]) {
        grouped[fecha] = {
          total: 0,
          count: 0,
        };
      }

      grouped[fecha].total += v.total;
      grouped[fecha].count += v.cantidad;
    });

    return Object.entries(grouped).map(
      ([date, data]) => ({
        title: formatCOP(data.total),
        date,
        allDay: true,

        extendedProps: {
          total: data.total,
          count: data.count,
        },
      })
    );
  }, [ventas]);

  const handleDateClick = (
    info: DateClickArg
  ) => {
    onSelectDate(info.dateStr);
  };

  // =====================================================
  // COLORES SUAVES Y ELEGANTES
  // =====================================================

  const getColors = (total: number) => {
    if (total > 500000) {
      return {
        bg: "#ecfdf3",
        border: "#bbf7d0",
        text: "#166534",
      };
    }

    if (total > 200000) {
      return {
        bg: "#eff6ff",
        border: "#bfdbfe",
        text: "#1d4ed8",
      };
    }

    return {
      bg: "#faf5ff",
      border: "#e9d5ff",
      text: "#7e22ce",
    };
  };

  return (
    <Box
      sx={{
        borderRadius: "28px",
        overflow: "hidden",
        border:
          "1px solid rgba(226,232,240,0.9)",
        background:
          "linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)",
        boxShadow:
          "0 10px 40px rgba(15,23,42,0.06)",
      }}
    >
      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <Box
        sx={{
          px: { xs: 2, md: 3 },
          py: 3,
          borderBottom:
            "1px solid rgba(226,232,240,0.8)",

          background:
            "linear-gradient(135deg,#ffffff,#f8fafc)",
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems={{
            xs: "flex-start",
            md: "center",
          }}
          flexDirection={{
            xs: "column",
            md: "row",
          }}
          gap={2}
        >
          <Box>
            <Typography
              fontWeight={900}
              fontSize={{
                xs: 14,
                md: 18,
              }}
              color="#0f172a"
            >
              Calendario Financiero
            </Typography>

            <Typography
              fontSize={12}
              color="text.secondary"
              mt={0.5}
            >
              Visualiza ingresos diarios y
              consulta detalles rápidamente
            </Typography>
          </Box>

          <Box
            display="flex"
            gap={1}
            flexWrap="wrap"
          >
            <Chip
              label="Ventas"
              sx={{
                bgcolor: "#eff6ff",
                color: "#2563eb",
                fontWeight: 700,
                borderRadius: 3,
              }}
            />

            <Chip
              label="Ingresos"
              sx={{
                bgcolor: "#ecfdf3",
                color: "#16a34a",
                fontWeight: 700,
                borderRadius: 3,
              }}
            />

            <Chip
              label="Dashboard"
              sx={{
                bgcolor: "#faf5ff",
                color: "#9333ea",
                fontWeight: 700,
                borderRadius: 3,
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* ===================================================== */}
      {/* CALENDARIO */}
      {/* ===================================================== */}

      <Box p={{ xs: 1.5, md: 3 }}>
        <FullCalendar
          plugins={[
            dayGridPlugin,
            interactionPlugin,
          ]}
          initialView="dayGridMonth"
          height="70vh"
          events={events}
          dateClick={handleDateClick}
          selectable
          dayMaxEvents={2}

          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right:
              "dayGridMonth,dayGridWeek",
          }}

          eventContent={(eventInfo) => {
            const { total, count } =
              eventInfo.event.extendedProps;

            const colors = getColors(total);

            return (
              <Box
                sx={{
                  width: "100%",
                  px: 1,
                  py: 0.8,
                  borderRadius: 2.5,

                  bgcolor: colors.bg,
                  border: `1px solid ${colors.border}`,

                  color: colors.text,

                  fontSize: 10,
                  fontWeight: 800,

                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",

                  transition:
                    "all .2s ease",

                  "&:hover": {
                    transform:
                      "translateY(-1px)",
                  },
                }}
              >
                <Typography
                  fontSize={10}
                  fontWeight={900}
                  lineHeight={1.2}
                >
                  {formatCOP(total)}
                </Typography>

                <Typography
                  fontSize={9}
                  sx={{
                    opacity: 0.75,
                  }}
                >
                  {count} ventas
                </Typography>
              </Box>
            );
          }}

          eventDidMount={(info) => {
            const { total, count } =
              info.event.extendedProps;

            info.el.setAttribute(
              "title",
              `Total: ${formatCOP(
                total
              )}\nVentas: ${count}`
            );
          }}
        />

        {/* ===================================================== */}
        {/* ESTILOS FULLCALENDAR */}
        {/* ===================================================== */}

        <style>
          {`
            .fc {
              font-family: Inter, sans-serif;
            }

            .fc-theme-standard td,
            .fc-theme-standard th {
              border-color: #eef2f7;
            }

            .fc-scrollgrid {
              border-radius: 24px;
              overflow: hidden;
              border: 1px solid #eef2f7;
            }

            .fc-toolbar {
              margin-bottom: 24px !important;
            }

            .fc-toolbar-title {
              font-size: 22px !important;
              font-weight: 900 !important;
              color: #0f172a;
            }

            .fc-button {
              border: none !important;
              border-radius: 14px !important;
              padding: 8px 14px !important;
              text-transform: capitalize !important;
              font-weight: 700 !important;
              box-shadow: none !important;
              transition: all .2s ease !important;
            }

            .fc-button-primary {
              background: #f1f5f9 !important;
              color: #334155 !important;
            }

            .fc-button-primary:hover {
              background: #e2e8f0 !important;
            }

            .fc-button-active {
              background: #2563eb !important;
              color: white !important;
            }

            .fc-daygrid-day {
              transition: all .2s ease;
            }

            .fc-daygrid-day:hover {
              background: #f8fafc;
              cursor: pointer;
            }

            .fc-day-today {
              background: rgba(37,99,235,0.04) !important;
            }

            .fc-col-header-cell {
              background: #f8fafc;
              padding: 10px 0 !important;
            }

            .fc-col-header-cell-cushion {
              color: #475569;
              font-weight: 800;
              text-transform: capitalize;
            }

            .fc-daygrid-day-number {
              color: #0f172a;
              font-weight: 600;
              font-size: 11px !important; 
              padding: 8px !important;
            }

            .fc-event {
              border: none !important;
              background: transparent !important;
            }

            .fc-h-event {
              background: transparent !important;
              border: none !important;
            }
          `}
        </style>
      </Box>
    </Box>
  );
};

export default CalendarView;