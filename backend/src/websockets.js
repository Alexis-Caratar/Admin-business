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

// Envía una orden de impresión solo a los agentes del negocio (formato antiguo)
export const enviarAAgentes = (id_negocio, msg) => {
  if (!wss) return 0;
  const data = JSON.stringify(msg);
  let enviados = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.isPrintAgent && client.user.id_negocio == id_negocio) {
      client.send(data);
      enviados++;
    }
  });
  return enviados;
};

const conectados = (id_negocio) => (wss ? [...wss.clients] : [])
  .filter((c) => c.readyState === WebSocket.OPEN && c.isPrintAgent && c.user.id_negocio == id_negocio);

// Agentes conectados de un negocio (para el admin y la caja)
export const agentesDe = (id_negocio) => conectados(id_negocio).map((c) => ({
  punto: c.agente?.punto ?? "Agente",
  protocolo: c.agente?.protocolo ?? 1,
  version: c.agente?.version ?? null,
  impresoras: c.agente?.impresoras ?? [],
  estado: c.agente?.estado ?? null,
  conectado_desde: c.agente?.desde ?? null,
}));

// Órdenes enviadas a agentes v2 que esperan confirmación
const pendientes = new Map();
let secuencia = 0;
const ESPERA_MS = 8000;

/**
 * Envía un ticket ya armado. Agentes v2 lo imprimen y confirman; agentes antiguos
 * reciben `legado` (formato anterior) sin confirmación.
 * Devuelve { ok, agentes, mensaje }.
 */
export const enviarDocumento = (id_negocio, documento, legado) => new Promise((resolve) => {
  const agentes = conectados(id_negocio);
  if (!agentes.length) {
    return resolve({ ok: false, agentes: 0, mensaje: "No hay agente de impresión conectado para este negocio" });
  }
  const nuevos = agentes.filter((a) => (a.agente?.protocolo ?? 1) >= 2);
  const antiguos = agentes.filter((a) => (a.agente?.protocolo ?? 1) < 2);
  if (legado) antiguos.forEach((a) => a.send(JSON.stringify(legado)));
  if (!nuevos.length) {
    return resolve(legado
      ? { ok: true, confirmado: false, agentes: agentes.length, mensaje: "Enviado a impresión (agente sin confirmación: actualízalo)" }
      : { ok: false, agentes: agentes.length, mensaje: "El agente conectado es una versión antigua: actualízalo para esta función" });
  }
  const id = `${Date.now()}-${++secuencia}`;
  const estado = { esperados: nuevos.length, respuestas: [] };
  const terminar = () => {
    clearTimeout(estado.timer);
    pendientes.delete(id);
    const impresas = estado.respuestas.filter((r) => r.ok);
    const errores = estado.respuestas.filter((r) => !r.ok && !r.omitido);
    if (impresas.length) return resolve({ ok: true, confirmado: true, agentes: agentes.length, mensaje: `Impreso en ${impresas.map((r) => r.impresora || r.punto).join(", ")}` });
    if (errores.length) return resolve({ ok: false, agentes: agentes.length, mensaje: `Error de impresora: ${errores.map((r) => r.error).join(" · ")}` });
    if (estado.respuestas.length) return resolve({ ok: false, agentes: agentes.length, mensaje: `Ningún punto tiene impresora de ${documento.rol}` });
    return resolve({ ok: false, agentes: agentes.length, mensaje: "El agente no respondió a tiempo: revisa la impresora" });
  };
  estado.alResponder = (r) => { estado.respuestas.push(r); if (estado.respuestas.length >= estado.esperados) terminar(); };
  estado.timer = setTimeout(terminar, ESPERA_MS);
  pendientes.set(id, estado);
  nuevos.forEach((a) => a.send(JSON.stringify({ tipo: "imprimir_documento", id, documento })));
});

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

        // REGISTRAR AGENTES DE IMPRESIÓN (requiere token de agente vigente)
        if (data.tipo === "register_agent" && esAgente) {
          const { tokenAgenteVigente } = await import("./services/impresion/impresion.service.js");
          if (!(await tokenAgenteVigente(ws.user))) {
            ws.send(JSON.stringify({ tipo: "error", message: "Token del agente revocado: genera uno nuevo en Admin > Negocios > Impresión" }));
            return ws.close(4003, "Token revocado");
          }
          ws.isPrintAgent = true;
          ws.agente = {
            protocolo: Number(data.protocolo) || 1,
            version: data.version ? String(data.version).slice(0, 20) : null,
            punto: data.punto ? String(data.punto).slice(0, 60) : "Agente",
            impresoras: Array.isArray(data.impresoras) ? data.impresoras.slice(0, 10) : [],
            desde: new Date().toISOString(),
          };
        }

        // Confirmación de un ticket (agentes v2)
        if (data.tipo === "resultado_impresion" && ws.isPrintAgent) {
          pendientes.get(String(data.id))?.alResponder({
            ok: Boolean(data.ok), omitido: Boolean(data.omitido), error: data.error ? String(data.error).slice(0, 200) : null,
            impresora: data.impresora ? String(data.impresora).slice(0, 60) : null, punto: ws.agente?.punto,
          });
        }

        //ESTADO IMPRESORA
        if (data.tipo === "estado_impresora" && ws.isPrintAgent) {
          if (ws.agente) ws.agente.estado = data.payload;
          if (Array.isArray(data.payload?.impresoras) && ws.agente) ws.agente.impresoras = data.payload.impresoras.slice(0, 10);
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
        // Si el negocio tiene otro punto de venta conectado, sigue en línea
        if (conectados(id_negocio).some((c) => c !== ws)) return;
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

// 🟣 NOTIFICAR PEDIDOS WEB
// Solo viaja el evento y el id (sin datos del cliente): la pantalla
// vuelve a consultar el detalle por la API, que valida permisos.
export const notificarPedido = (id_negocio, evento, id_pedido) => {
  if (!wss) return;
  enviarAFrontends(id_negocio, { tipo: "pedido_evento", evento, id_pedido });
};

// 🟠 NOTIFICAR COMANDAS (meseros → caja). Como los pedidos web: solo el evento
// y el id; cada pantalla consulta el detalle por la API, que valida permisos.
export const notificarComanda = (id_negocio, evento, id_comanda) => {
  if (!wss) return;
  enviarAFrontends(id_negocio, { tipo: "comanda_evento", evento, id_comanda });
};
