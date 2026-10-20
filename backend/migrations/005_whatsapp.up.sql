-- =====================================================================
-- 005 · Avisos por WhatsApp del estado de los pedidos web
-- Aplicar:  node scripts/migrar.js up 005_whatsapp
-- Revertir: node scripts/migrar.js down 005_whatsapp
-- =====================================================================

-- El cliente acepta (en el checkout) recibir avisos por WhatsApp
ALTER TABLE public.pedidos ADD COLUMN avisos_whatsapp boolean NOT NULL DEFAULT false;

-- Cola de mensajes: se guarda antes de enviar, se reintenta si falla y
-- nunca se envía dos veces el mismo aviso del mismo pedido.
CREATE TABLE public.notificaciones_whatsapp (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pedido bigint NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    evento character varying(20) NOT NULL
        CHECK (evento IN ('RECIBIDO', 'CONFIRMADO', 'LISTO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO')),
    telefono character varying(20) NOT NULL,
    plantilla character varying(60) NOT NULL,
    parametros jsonb NOT NULL DEFAULT '[]',
    estado character varying(12) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'ENVIADO', 'ERROR')),
    intentos smallint NOT NULL DEFAULT 0,
    id_mensaje character varying(120),
    error character varying(500),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    enviado_at timestamp with time zone,
    UNIQUE (id_pedido, evento)
);
CREATE INDEX idx_notif_whatsapp_pendientes ON public.notificaciones_whatsapp (estado, created_at) WHERE estado = 'PENDIENTE';
