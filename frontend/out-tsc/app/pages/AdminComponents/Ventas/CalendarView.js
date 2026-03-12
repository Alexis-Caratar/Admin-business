"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("@fullcalendar/react");
var daygrid_1 = require("@fullcalendar/daygrid");
var interaction_1 = require("@fullcalendar/interaction");
var CalendarView = function (_a) {
    var ventas = _a.ventas, onSelectDate = _a.onSelectDate;
    // --- Convertir ventas a eventos válidos ---
    var events = ventas.map(function (v) {
        var fecha = typeof v.fecha === "string" ? v.fecha : "";
        var normal = fecha.includes("T") ? fecha.split("T")[0] : fecha;
        return {
            title: "Venta $".concat(v.total),
            date: normal, // <-- SIEMPRE válido
            allDay: true,
        };
    });
    var handleDateClick = function (info) {
        console.log("Click en fecha:", info.dateStr);
        onSelectDate(info.dateStr); // <-- Aquí siempre abre modal
    };
    return ((0, jsx_runtime_1.jsx)(react_1.default, { plugins: [daygrid_1.default, interaction_1.default], initialView: "dayGridMonth", height: "80vh", events: events, dateClick: handleDateClick, selectable: true, dayMaxEvents: 2, headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridWeek,dayGridDay",
        } }));
};
exports.default = CalendarView;
