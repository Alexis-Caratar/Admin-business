// CalendarView.tsx
import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { Venta } from "../../../types/ventas";

interface Props {
  ventas: Venta[];
  onSelectDate: (fecha: string) => void;
}

const CalendarView: React.FC<Props> = ({ ventas, onSelectDate }) => {
  // --- Convertir ventas a eventos válidos ---
  const events = ventas.map((v) => {
    const fecha = typeof v.fecha === "string" ? v.fecha : "";
    const normal = fecha.includes("T") ? fecha.split("T")[0] : fecha;

    return {
      title: `Venta $${v.total}`,
      date: normal, // <-- SIEMPRE válido
      allDay: true,
    };
  });

  const handleDateClick = (info: DateClickArg) => {
    console.log("Click en fecha:", info.dateStr);
    onSelectDate(info.dateStr); // <-- Aquí siempre abre modal
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      height="80vh"
      events={events}
      dateClick={handleDateClick}
      selectable={true}
      dayMaxEvents={2}
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,dayGridWeek,dayGridDay",
      }}
    />
  );
};

export default CalendarView;
