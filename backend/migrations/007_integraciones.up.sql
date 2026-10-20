-- =====================================================================
-- 007 · Integraciones por negocio (Wompi, WhatsApp y ajustes de la tienda)
-- Aplicar:  node scripts/migrar.js up 007_integraciones
-- Revertir: node scripts/migrar.js down 007_integraciones
-- Lo que se deja vacío se toma del .env del servidor (como hasta ahora).
-- Las columnas *_cifrado guardan secretos cifrados con AES-256-GCM
-- (clave CONFIG_SECRET del .env); nunca se guardan en texto plano.
-- =====================================================================
CREATE TABLE public.negocios_integraciones (
    id_negocio integer PRIMARY KEY REFERENCES public.negocios(id) ON DELETE CASCADE,
    -- Wompi
    wompi_entorno character varying(12) NOT NULL DEFAULT 'pruebas' CHECK (wompi_entorno IN ('pruebas', 'produccion')),
    wompi_public_key character varying(120),
    wompi_integrity_cifrado text,
    wompi_events_cifrado text,
    wompi_private_cifrado text,
    -- WhatsApp Cloud API (Meta)
    whatsapp_token_cifrado text,
    whatsapp_phone_number_id character varying(40),
    whatsapp_api_version character varying(10),
    whatsapp_idioma character varying(10),
    -- Tienda
    tienda_url_retorno character varying(255),
    tienda_validar_horario boolean NOT NULL DEFAULT true,
    actualizado_por integer,
    updated_at timestamp without time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.negocios_integraciones IS 'Credenciales y ajustes de pasarela/WhatsApp por negocio. Secretos cifrados.';
