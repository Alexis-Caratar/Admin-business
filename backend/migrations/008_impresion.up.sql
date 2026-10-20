-- =====================================================================
-- 008 · Impresión por negocio (facturas, comandas y pedidos)
-- Aplicar:  node scripts/migrar.js up 008_impresion
-- Revertir: node scripts/migrar.js down 008_impresion
-- Todo lo que antes estaba fijo en el agente local (ancho, textos, QR,
-- documento de consumidor final, impresoras) se configura aquí por negocio.
-- agente_version: al generar un token nuevo sube y los anteriores dejan de servir.
-- =====================================================================
CREATE TABLE public.negocios_impresion (
    id_negocio integer PRIMARY KEY REFERENCES public.negocios(id) ON DELETE CASCADE,
    ancho_caracteres smallint NOT NULL DEFAULT 32 CHECK (ancho_caracteres IN (32, 42, 48)),
    encabezado text,                                   -- líneas extra bajo los datos del negocio
    pie text NOT NULL DEFAULT E'¡Gracias por tu compra!\nVuelve pronto',
    mostrar_qr boolean NOT NULL DEFAULT true,
    qr_contenido character varying(10) NOT NULL DEFAULT 'tienda' CHECK (qr_contenido IN ('tienda', 'factura', 'texto')),
    qr_texto character varying(300),
    qr_leyenda character varying(80) DEFAULT 'Escanea y visita nuestra tienda',
    documento_consumidor character varying(20) NOT NULL DEFAULT '222222222222',
    imprimir_comanda_al_vender boolean NOT NULL DEFAULT true,
    copias_comanda smallint NOT NULL DEFAULT 1 CHECK (copias_comanda BETWEEN 1 AND 5),
    agente_version integer NOT NULL DEFAULT 1,
    updated_at timestamp without time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.negocios_impresion IS 'Formato de tickets y control del agente local de impresión por negocio.';
