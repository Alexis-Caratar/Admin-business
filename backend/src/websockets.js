import jwt from "jsonwebtoken";
import CajeroService from "./services/cajero.service.js";
import { WebSocketServer, WebSocket } from "ws";
export let wss; // exportarlo para usarlo en el controller de impresión

// Último estado de impresora reportado por el agente de cada negocio
const estadoImpresoraPorNegocio = new Map();

const OFFLINE = {
  ok: false,
  status: "OFFLINE",
  connected: false,
  message: "Agente desconectado"
};

// Verifica el JWT enviado en el mensaje y deja los datos en ws.user
const autenticar = (ws, token) => {
  if (ws.user) return true;
  if (!token) return false;
  try {
    ws.user = jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
};

const enviarAFrontends = (id_negocio, msg) => {
  const data = JSON.stringify(msg);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.isFrontend && client.user.id_negocio == id_negocio) {
      client.send(data);
    }
  });
};

// Envía una orden de impresión solo a los agentes del negocio
export const enviarAAgentes = (id_negocio, msg) => {
  if (!wss) return;
  const data = JSON.stringify(msg);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.isPrintAgent && client.user.id_negocio == id_negocio) {
      client.send(data);
    }
  });
};

export const initWebSockets = (server) => {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    ws.on("message", async (msg) => {
      try {
        const data = JSON.parse(msg.toString());

        if (!autenticar(ws, data.token)) {
          ws.send(JSON.stringify({ tipo: "error", message: "No autenticado" }));
          return ws.close(4001, "No autenticado");
        }

        const esAgente = ws.user.tipo === "agente_impresion";

        //conectar frontend
        if (data.tipo === "register_frontend" && !esAgente) {
          ws.isFrontend = true;
          const estado = estadoImpresoraPorNegocio.get(ws.user.id_negocio);
          if (estado) {
            ws.send(JSON.stringify({ tipo: "printer_status", payload: estado }));
          }
        }

        // REGISTRAR AGENTES DE IMPRESIÓN FACTURAS (requiere token de agente)
        if (data.tipo === "register_agent" && esAgente) {
          ws.isPrintAgent = true;
        }

        //ESTADO IMPRESORA
        if (data.tipo === "estado_impresora" && ws.isPrintAgent) {
          estadoImpresoraPorNegocio.set(ws.user.id_negocio, data.payload);
          // reenviar a frontends del mismo negocio
          enviarAFrontends(ws.user.id_negocio, { tipo: "printer_status", payload: data.payload });
        }

        if (esAgente) return;

        // SUSCRIPCIÓN A MESAS (siempre del negocio del token)
        if (data.tipo === "suscribirse_mesas") {
          ws.mesasNegocio = ws.user.id_negocio;
          const mesas = await CajeroService.mesas(ws.mesasNegocio);
          ws.send(JSON.stringify({tipo: "mesas",mesas,}));
        }
        // SUSCRIPCIÓN A CAJA (siempre la del usuario del token)
        if (data.tipo === "suscribirse_caja") {
          ws.idUsuario = ws.user.id;
          const rows = await CajeroService.estadoCaja({id_usuario: ws.idUsuario});
          ws.send( JSON.stringify({tipo: "actualizar_caja",caja: rows.length ? rows[0] : null,}));
        }

      } catch (error) {
        console.error("Error WS:", error);
      }
    });

    ws.on("close", () => {
      if (ws.isPrintAgent) {//para saber cuando el agente esta caido
        const id_negocio = ws.user.id_negocio;
        estadoImpresoraPorNegocio.set(id_negocio, OFFLINE);
        // reenviar OFFLINE
        enviarAFrontends(id_negocio, { tipo: "printer_status", payload: OFFLINE });
      }
    });
  });
};


// 🔵 NOTIFICAR MESAS
export const notificarMesas = async (id_negocio) => {
  if (!wss) return;

  const resultado = await CajeroService.mesas(id_negocio);

  const data = JSON.stringify({
    tipo: "mesas",
    mesas: resultado,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.mesasNegocio == id_negocio) {
      client.send(data);
    }
  });
};

// 🟢 NOTIFICAR CAJA
export const notificarCaja = async (id_usuario) => {
  if (!wss) return;

  const rows = await CajeroService.estadoCaja({ id_usuario });

  const data = JSON.stringify({
    tipo: "actualizar_caja",
    caja: rows.length ? rows[0] : null,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.idUsuario == id_usuario) {
      client.send(data);
    }
  });
};
