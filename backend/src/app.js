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

// Middleware JWT
import { authenticate } from "./middlewares/auth.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

// ---------------------------
//  RUTAS PÚBLICAS
// ---------------------------

// LOGIN Y REGISTRO
app.use("/api/auth", authRoutes);

// CRUD de usuarios (si quieres que estos SÍ requieran token, los mueves abajo)
app.use("/api/usuarios", usuariosRoutes);

// ---------------------------
//  RUTAS PROTEGIDAS
// ---------------------------
app.use("/api/menus_sistema", /* authenticate,*/ menus_sistema);
app.use("/api/negocios", /* authenticate,*/ negociosRoutes);
app.use("/api/productos", /* authenticate,*/ productosRoutes);
app.use("/api/reservas", /* authenticate,*/ reservasRoutes);
app.use("/api/empleados", /* authenticate,*/ empleadosRoutes);
app.use("/api/inventario", /* authenticate,*/ inventariosRoutes);
app.use("/api/ventas", /* authenticate,*/ ventasRoutes);

export default app;
