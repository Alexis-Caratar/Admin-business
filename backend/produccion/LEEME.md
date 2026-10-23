# Actualizar la base de datos de producción

Archivos de esta carpeta:

| Archivo | Qué hace | ¿Cambia datos? |
|---|---|---|
| `verificar.sql` | Muestra qué migraciones están aplicadas, negocios, módulo Pedidos, códigos de barras repetidos y conteos | No (solo lectura) |
| `actualizacion.sql` | Aplica las migraciones 001 a 016 que falten, en orden, en **una sola transacción** | Sí |
| `reversion.sql` | Deshace las migraciones (016 → 001). Solo para emergencias | Sí (borra lo nuevo) |

`actualizacion.sql` es seguro de repetir: lo ya aplicado se omite, y si detecta cambios aplicados antes
a mano (sin registro) solo los registra. Si algo falla, **no se aplica nada** (la base queda como estaba).

Se probó sobre una copia del respaldo de producción `Bd/backup24072026 .dump`: se aplicó completo,
se repitió sin cambios, los datos quedaron intactos y las 107 pruebas del backend pasaron sobre esa copia (incluidas 011 tiqueteras, 012 meseros/comandas/permisos, 013 pago dividido, 014 configuración del negocio, 015 factura al cobrar y 016 publicidad).

> Si se agrega una migración nueva en `migrations/`, vuelve a generar estos archivos con
> `node scripts/armar-produccion.js` (y agrega su "huella" en ese script).

---

## Paso a paso (servidor: `ssh -i bakend_prod.pem ubuntu@3.227.242.168`)

### 1. Subir el código
Haz commit y push desde tu equipo, y en el servidor:
```bash
cd ~/Admin-business && git pull
```

### 2. Respaldo (obligatorio)
```bash
sudo -u postgres pg_dump -d adminbusiness -F c -f /tmp/antes_actualizacion.dump
sudo mv /tmp/antes_actualizacion.dump ~/Admin-business/Bd/
```

### 3. Ver el estado actual
```bash
cp ~/Admin-business/backend/produccion/*.sql /tmp/
sudo -u postgres psql -d adminbusiness -f /tmp/verificar.sql
```
(Se copian a `/tmp` porque el usuario `postgres` no puede leer la carpeta de `ubuntu`.)

Si aparece algún **código de barras repetido** en un negocio, corrígelo después desde el admin de productos
(el sistema ya no deja guardar códigos repetidos).

### 4. Aplicar la actualización
```bash
sudo -u postgres psql -d adminbusiness -f /tmp/actualizacion.sql
```
Al final muestra la lista de migraciones aplicadas. Si sale un `ERROR`, no se aplicó nada: copia el
mensaje y no sigas.

### 5. Comprobar
```bash
sudo -u postgres psql -d adminbusiness -f /tmp/verificar.sql
```
Las 10 migraciones deben salir **APLICADA**.

**Si el backend NO se conecta con el usuario `postgres`** (mira `DB_USER` en `backend/.env`), dale permisos
sobre las tablas nuevas (cambia `usuario_app`):
```bash
sudo -u postgres psql -d adminbusiness -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO usuario_app; GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO usuario_app; GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO usuario_app;"
```

### 6. Variables nuevas en `backend/.env` de producción
Compara con `backend/.env.example`. Las importantes:

```bash
# Clave para cifrar las credenciales que se guardan desde el admin. Genérala UNA vez y no la cambies:
#   openssl rand -hex 32
CONFIG_SECRET=
# En producción VACÍA: cada negocio regresa a su dominio después de pagar
TIENDA_URL_PUBLICA=
TIENDA_VALIDAR_HORARIO=true
# Si hay nginx delante del backend
TRUST_PROXY=1
# Dominios del frontend separados por coma (vacío = cualquiera)
CORS_ORIGINS=https://puntourbano.co
# Wompi y WhatsApp: opcionales aquí (respaldo). Se pueden poner por negocio en el admin.
WOMPI_ENTORNO=produccion
```
`IMPRESORAPRINCIPAL_CAJA` ya no se usa (las impresoras se eligen en cada agente).

### 7. Reiniciar backend y publicar el frontend
```bash
cd ~/Admin-business/backend && npm install && pm2 restart all     # o como se inicie el backend
cd ~/Admin-business/frontend && npm install && npm run build      # y publica dist/ donde lo sirve nginx
```

### 8. Configurar desde el admin (Negocios > Editar)
- **Módulos:** activa **Pedidos** en los negocios que lo usen y asígnalo a sus usuarios. Las finanzas están dentro de **Ventas** (no hay que activar nada aparte).
- **Sitio web / Tienda en línea:** revisa la `url_negocio`, publica el sitio y activa la tienda.
- **Pagos y WhatsApp:** llaves de Wompi de producción (o déjalas en el `.env`) y la URL de eventos en el panel de Wompi.
- **Impresión:** formato del ticket y "Instalar en un punto de venta" para el token de cada agente
  (ver `agente-local/README.md`). Los agentes antiguos siguen imprimiendo hasta que generes un token nuevo.
- **Meseros, Mesas y Módulos y permisos (012):** actívalos en el negocio (Negocios → módulos). Luego, con un
  usuario que tenga "Módulos y permisos", asigna el perfil **Mesero** a los meseros. Los usuarios que ya
  existen siguen igual (sin perfil = todas las acciones de sus módulos). Detalle en `docs/MESEROS_COMANDAS_PERMISOS.md`.
  **Configuración (014):** el menú "Usuarios" pasa a "Configuración" (Mi negocio, Página web, Usuarios, Permisos y
  Tiqueteras). "Mi negocio" queda disponible donde ya se administran usuarios; cada usuario lo recibe por su perfil
  (el perfil Administrador lo tiene) o asignándole el módulo. La URL y el dominio siguen siendo del administrador del sistema.
  **Factura al cobrar (015):** en Configuración → Factura e impresión se elige si la caja pregunta (por defecto),
  imprime siempre o nunca la factura al quedar pagada una cuenta. La comanda sigue aparte.
  **Publicidad (016):** módulo nuevo (menú del día y promociones para estados de WhatsApp). Queda activo donde se usa
  Ventas y asignado a quienes administran usuarios; a los demás se les da por perfil o asignación.
  Ojo: desde esta versión la caja y Usuarios exigen su módulo; un usuario sin el módulo Cajero (o Ventas) ya no
  entra a la caja aunque conozca la dirección.

---

## Si hay que deshacer

- **Durante el paso 4 falló algo:** no hay que hacer nada; la transacción no aplicó cambios.
- **Después de aplicar, hay que volver atrás:**
  - Lo más seguro es restaurar el respaldo del paso 2:
    ```bash
    sudo -u postgres pg_restore -d adminbusiness --clean --if-exists ~/Admin-business/Bd/antes_actualizacion.dump
    ```
    (Se pierden las ventas hechas después de la actualización.)
  - O `sudo -u postgres psql -d adminbusiness -f /tmp/reversion.sql`, que conserva las ventas pero **borra**
    pedidos web, configuración de sitios, tipos de negocio, credenciales e impresión.

## Desde ahora (migraciones futuras)
```bash
cd ~/Admin-business/backend
node scripts/migrar.js estado        # qué está aplicado
node scripts/migrar.js pendientes    # aplica lo que falte, en orden
```
