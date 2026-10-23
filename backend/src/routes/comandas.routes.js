import { Router } from "express";
import * as c from "../controllers/comandas.controller.js";
import { negocioConModulo, requierePermiso } from "../middlewares/auth.middleware.js";

// authenticate en app.js. Solo si el negocio tiene activo el módulo Meseros.
// La caja (cajero.*) consulta y cobra; el mesero (meseros.*) crea y adiciona.
const router = Router();
router.use(negocioConModulo("meseros"));
const consultar = requierePermiso(["meseros.ver", "cajero.ver"]);
router.get("/catalogo", requierePermiso(["meseros.crear", "meseros.adicionar"]), c.catalogo);
router.get("/mesas", consultar, c.mesasMesero);
router.get("/", consultar, c.listar);
router.get("/:id", consultar, c.detalle);
router.post("/", requierePermiso("meseros.crear"), c.crear);
router.post("/:id/items", requierePermiso("meseros.adicionar"), c.adicionar);
router.post("/:id/imprimir", requierePermiso(["meseros.imprimir", "cajero.cobrar"]), c.reimprimir);
router.post("/:id/anular", requierePermiso("meseros.anular"), c.anular);
router.post("/:id/cobrar", requierePermiso("cajero.cobrar"), c.cobrar);
export default router;
