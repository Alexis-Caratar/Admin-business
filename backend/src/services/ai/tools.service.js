import { pool } from "../../config/db.js";

export const tools = {

    obtenerFechaHora: {
        tipo: "texto",
        titulo: "Fecha y hora",
        useAI: false,

        execute: async () => {

            return { fecha: new Date().toLocaleDateString("es-CO"), hora: new Date().toLocaleTimeString("es-CO") };
        },

        format(data) { return `Hoy es ${data.fecha} y la hora actual es ${data.hora}.`; }

    },

    obtenerVentasHoy: {
        tipo: "tarjetas",
        titulo: "Ventas de hoy",
        useAI: false,

        execute: async () => {

            const sql = `
            SELECT
                COUNT(*)::int AS cantidad,
                COALESCE(SUM(total), 0) AS total
            FROM ventas
            WHERE estado = 'activa'
            AND DATE(fecha) = CURRENT_DATE
        `;

            const { rows } = await pool.query(sql);

            return {
                resumen: {
                    cantidad: rows[0].cantidad,
                    total: Number(rows[0].total)
                }
            };

        },

        format(data) {
            return `Hoy llevas ${data.resumen.cantidad} venta(s) por un total de $${data.resumen.total.toLocaleString("es-CO")}.`;
        }

    },

    obtenerProducto: async ({ nombre }) => {

        const sql = `
            SELECT
                id,
                nombre,
                precio
            FROM productos
            WHERE nombre ILIKE $1
            LIMIT 10
        `;

        const { rows } = await db.query(sql, [`%${nombre}%`]);

        return rows;

    },

    obtenerInventario: {
        tipo: "tabla",
        titulo: "Inventario",
        useAI: false,

        execute: async (params = {}) => {

            const { nombre = "" } = params;

            let sql = `
            SELECT
                id,
                nombre,
                stock_actual
            FROM inventario
        `;

            const values = [];

            if (nombre) {
                sql += ` WHERE nombre ILIKE $1`;
                values.push(`%${nombre}%`);
            }

            sql += ` ORDER BY nombre LIMIT 20`;

            const { rows } = await pool.query(sql, values);

            return {
                resumen: {
                    total: rows.length
                },
                productos: rows
            };

        },

        format(data) {

            if (data.resumen.total === 0) {
                return "No se encontraron productos en el inventario.";
            }

            if (data.resumen.total === 1) {
                return "Se encontró 1 producto en el inventario.";
            }

            return `Se encontraron ${data.resumen.total} productos en el inventario.`;

        }

    },

    obtenerMesas: {
        tipo: "texto",
        titulo: "Estado de las mesas",
        useAI: false,
        execute: async () => {

            const sql = `
            SELECT
                id,
                nombre,
                estado
            FROM mesas
            ORDER BY nombre
        `;

            const { rows } = await pool.query(sql);

            return {
                total: rows.length,
                ocupadas: rows.filter(x => x.estado === "Ocupada").length,
                disponibles: rows.filter(x => x.estado === "Disponible").length,
                mesas: rows
            };

        },

        format(data) {

            return `Actualmente tienes ${data.total} mesas registradas. ${data.ocupadas} están ocupadas y ${data.disponibles} disponibles.`;

        }

    },

    obtenerClientes: async ({ nombre }) => {

        const sql = `
            SELECT
                id,
                nombre,
                telefono
            FROM clientes
            WHERE nombre ILIKE $1
            LIMIT 10
        `;

        const { rows } = await db.query(sql, [`%${nombre}%`]);

        return rows;

    }

};