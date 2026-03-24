// websockets.js
import { WebSocketServer } from "ws";
import CajeroService from "./services/cajero.service.js";

let wss;

export const initWebSockets = (server) => {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    ws.on("message", async (msg) => {
      try {
        const data = JSON.parse(msg.toString());

        // SUSCRIPCIÓN A MESAS
        if (data.tipo === "suscribirse_mesas") {
          ws.idNegocio = data.id_negocio;

          const mesas = await CajeroService.mesas(data.id_negocio);

          ws.send(
            JSON.stringify({
              tipo: "mesas",
              mesas,
            })
          );
        }

        // SUSCRIPCIÓN A CAJA
        if (data.tipo === "suscribirse_caja") {
          ws.idUsuario = data.id_usuario;

          const rows = await CajeroService.estadoCaja({
            id_usuario: data.id_usuario,
          });

          ws.send(
            JSON.stringify({
              tipo: "actualizar_caja",
              caja: rows.length ? rows[0] : null,
            })
          );
        }
      } catch (error) {
        console.error("Error WS:", error);
      }
    });

    ws.on("close", () => {
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

//  console.log("notificar mesas",data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1 && client.idNegocio == id_negocio) {
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
  //console.log("notificar caja",data);

  wss.clients.forEach((client) => {
    if (client.readyState === 1 && client.idUsuario == id_usuario) {
      client.send(data);
    }
  });
};