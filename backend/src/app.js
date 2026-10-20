import express from "express";
import cors from "cors";

// Rutas

import menus_sistema from "./routes/menusistema.route.js";
import authRoutes from "./routes/auth.routes.js"; 
import usuariosRoutes from "./routes/usuarios.routes.js";
import negociosRoutes from "./routes/negocios.routes.js";
import reservasRoutes from "./routes/reservas.routes.js";
import productosRoutes from "./routes/productos.routes.js";
import empleadosRoutes from "./routes/empleados.routes.js";
import inventariosRoutes from "./routes/inventarios.routes.js";
import ventasRoutes from "./routes/ventas.routes.js";
import categoriasRouter from "./routes/categorias.routes.js";
import cajero from "./routes/cajero.routes.js";
import compras from "./routes/compras.routes.js";
import ai from "./routes/ai.route.js";
import tiendaRoutes from "./routes/tienda.routes.js";
import pedidosRoutes from "./routes/pedidos.routes.js";
import sitioRoutes from "./routes/sitio.routes.js";
import { tipos as tiposNegocio } from "./controllers/sitio.controller.js";




// Middleware JWT
import { authenticate } from "./middlewares/auth.middleware.js";

const app = express();

// Detrás de nginx/ALB: necesario para que req.ip sea la IP real (límite de peticiones)
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);

// CORS_ORIGINS="https://puntourbano.co,https://admin.puntourbano.co" restringe los orígenes.
// Sin definir se mantiene el comportamiento anterior (cualquier origen).
const origenes = (process.env.CORS_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
app.use(cors(origenes.length ? { origin: origenes } : undefined));
app.use(express.json({ limit: "100kb" }));

// ---------------------------
//  RUTAS PÚBLICAS
// ---------------------------

// LOGIN Y REGISTRO
app.use("/api/auth", authRoutes);

// TIENDA WEB (catálogo, pedidos y webhook de pagos)
app.use("/api/tienda", tiendaRoutes);

// SITIO WEB PÚBLICO DE CADA NEGOCIO
app.use("/api/sitio", sitioRoutes);

// ---------------------------
//  RUTAS PROTEGIDAS
// ---------------------------
app.use("/api/usuarios", authenticate, usuariosRoutes);
app.use("/api/ai",  authenticate, ai);
app.use("/api/menus_sistema",  authenticate, menus_sistema);
app.use("/api/negocios",  authenticate, negociosRoutes);
app.use("/api/categorias",  authenticate, categoriasRouter);
app.use("/api/productos",  authenticate, productosRoutes);
app.use("/api/reservas",  authenticate, reservasRoutes);
app.use("/api/empleados",  authenticate, empleadosRoutes);
app.use("/api/inventario",  authenticate, inventariosRoutes);
app.use("/api/ventas",  authenticate, ventasRoutes);
app.use("/api/cajero",  authenticate, cajero);
app.use("/api/compras",  authenticate, compras);
app.use("/api/pedidos",  authenticate, pedidosRoutes);
app.get("/api/tipos-negocio", authenticate, tiposNegocio);


export default app;
