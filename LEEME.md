# DGEA App v4 — Guía de instalación (app en celular + notificaciones + datos compartidos)

## Qué incluye esta versión
1. **Cronograma de actividades por tarea** — botón 📅 en cada tarea (tabla y Vista Técnico). Los técnicos añaden sub-actividades con fecha, las marcan ✓, y se ve la barra de progreso.
2. **Notificaciones** — botón 🔔 en cada tarea, manda resumen a Telegram y correo. Se puede activar el envío automático al completar una tarea.
3. **App instalable en el celular (PWA)** — ícono propio, pantalla completa, funciona sin internet para ver datos ya cargados.
4. **Datos compartidos en vivo con todo el equipo** — activando la sincronización en ⚙️ Ajustes, todos los celulares ven la misma información (guardada en una Google Sheet automática, no en cada celular por separado).

---

## Paso 1 — Subir la app a GitHub Pages

**Yo no puedo acceder a tu cuenta de GitHub** (no tengo tus credenciales ni debo pedírtelas), así que este paso lo haces tú, pero es solo arrastrar y soltar, sin comandos:

1. Crea cuenta gratis en [github.com](https://github.com) si no tienes.
2. **New repository** → nómbralo por ejemplo `dgea-app` → Create.
3. Dentro del repo: **Add file → Upload files** → arrastra los 5 archivos de la carpeta `dgea-app` que te compartí (`index.html`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`) → **Commit changes**.
4. **Settings → Pages** → Source: rama `main`, carpeta `/root` → **Save**.
5. En 1–2 minutos tu app queda en: `https://TU-USUARIO.github.io/dgea-app/`

## Paso 2 — Configurar Telegram, correo y datos compartidos (Apps Script)

1. Ve a [script.google.com](https://script.google.com) → **Nuevo proyecto**.
2. Borra el contenido y pega TODO el archivo `Code.gs`.
3. Menú ⚙️ **Configuración del proyecto → Propiedades del script → Añadir propiedad**:
   - Propiedad: `TELEGRAM_TOKEN`
   - Valor: tu token de @BotFather
   (No necesitas crear ninguna Google Sheet a mano — el script crea sola una llamada "DGEA App – Datos compartidos" la primera vez que se usa).
4. **Implementar → Nueva implementación → Aplicación web**:
   - Ejecutar como: *Yo*
   - Acceso: *Cualquier usuario*
   - Implementar → autoriza los permisos.
5. Copia la **URL que termina en `/exec`**.

## Paso 3 — Obtener el Chat ID del grupo "DGEA notificaciones"

1. Agrega tu bot al grupo si no está.
2. Abre: `https://api.telegram.org/bot<TU_TOKEN>/getUpdates`
3. Escribe cualquier mensaje en el grupo → recarga esa URL.
4. Busca `"chat":{"id":-100...}` — ese número es el Chat ID.

## Paso 4 — Conectar todo dentro de la app

1. Abre la app → ⚙️ (arriba a la derecha).
2. Pega la **URL de Apps Script** y el **Chat ID**.
3. Elige **tu nombre** en "Tu nombre" (para identificar quién sincronizó).
4. Marca **"Compartir datos en vivo con todo el equipo"** — esto activa que todos vean lo mismo.
5. Marca "Notificar automáticamente" si quieres avisos sin apretar 🔔 cada vez.
6. Guardar ajustes.
7. **Repite el paso 4 en el celular de cada técnico** (con la misma URL de Apps Script), eligiendo el nombre de cada uno. Así todos comparten los mismos datos.

> El ícono ☁️ en la parte superior muestra el estado: "Sincronizado", "Sincronizando…" o "Error de sync". Puedes tocarlo para forzar una sincronización manual.

## Paso 5 — Instalar la app en el celular

- **Android (Chrome):** abre la URL de GitHub Pages → botón "📲 Instalar app" o menú (⋮) → "Instalar aplicación".
- **iPhone (Safari):** botón compartir (□↑) → "Agregar a pantalla de inicio".

---

## Cómo funciona la sincronización (en simple)

- Cada vez que alguien cambia algo, la app espera 3 segundos y sube automáticamente ese cambio a la Google Sheet central.
- Cada 15 segundos, la app pregunta si hay algo nuevo de otros compañeros y lo trae.
- Si dos personas editan casi al mismo tiempo, **gana el último guardado** (no se mezclan automáticamente) — por eso conviene que cada técnico solo edite sus propias tareas.
- Puedes abrir esa Google Sheet en cualquier momento desde tu Google Drive (se llama "DGEA App – Datos compartidos") como respaldo — ahí queda el JSON completo de todos los datos.
