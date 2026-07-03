import {db  } from "../../config/db.js";

export const tools = {

    obtenerHora: async () => {

        return {
            hora: new Date().toLocaleTimeString("es-CO"),
        };

    },

    obtenerFecha: async () => {

        return {
            fecha: new Date().toLocaleDateString("es-CO"),
        };

    },

    obtenerVentasHoy: async () => {

        const sql = `
            SELECT
                COALESCE(SUM(total),0) AS total
            FROM ventas
            WHERE estado='activa'
            AND DATE(fecha)=CURRENT_DATE
        `;

        const { rows } = await db.query(sql);

        return rows[0];

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

    obtenerInventario: async ({ nombre }) => {

        const sql = `
            SELECT
                id,
                nombre,
                stock_actual
            FROM inventario
            WHERE nombre ILIKE $1
            LIMIT 20
        `;

        const { rows } = await db.query(sql, [`%${nombre}%`]);

        return rows;

    },

    obtenerMesas: async () => {

        const sql = `
            SELECT
                id,
                nombre,
                estado
            FROM mesas
            ORDER BY nombre
        `;

        const { rows } = await db.query(sql);

        return rows;

    },

    obtenerMesasOcupadas: async () => {

        const sql = `
            SELECT
                id,
                nombre,
                estado
            FROM mesas
            WHERE estado='Ocupada'
            ORDER BY nombre
        `;

        const { rows } = await db.query(sql);

        return rows;

    },
    obtenerMesasDisponibles: async () => {

        const sql = `
            SELECT
                id,
                nombre,
                estado
            FROM mesas
            WHERE estado='Disponible'
            ORDER BY nombre
        `;

        const { rows } = await db.query(sql);

        return rows;

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