# API de productos en Node.js y PostgreSQL

API REST para administrar un catálogo de productos y usarlo como backend de una integración con Alexa.

## Ejecutar localmente con Docker

Desde la raíz del repositorio:

```powershell
docker compose up -d --build
```

API: `http://localhost:3000` · PostgreSQL: `localhost:5432`.

### Conectar la API local a PostgreSQL de Render

Si quieres que la API que ejecutas en Docker use la misma base de Render, crea un archivo `.env` en la raíz del repositorio y agrega la **External Database URL** de Render (Render → PostgreSQL → Connect → External Database URL):

```dotenv
DATABASE_URL=postgresql://usuario:clave@host-render:5432/base
DATABASE_SSL=true
```

No compartas ni subas ese archivo: `.env` está excluido de Git. Después reinicia la API:

```powershell
docker compose up -d --build
```

La API local seguirá disponible en `http://localhost:3000`, pero las altas y consultas irán a la base de Render. Para volver a la base Docker local, borra `DATABASE_URL` del `.env` (o elimina el archivo) y ejecuta de nuevo `docker compose up -d --build`.

## Rutas

- `GET /api/health` — estado de la API y conexión a PostgreSQL.
- `GET /api/products` — listar productos.
- `GET /api/products/:id` — consultar un producto.
- `POST /api/products` — crear producto.
- `PUT /api/products/:id` — actualizar producto.
- `DELETE /api/products/:id` — eliminar producto.

Las rutas de escritura requieren el encabezado `x-api-key`. En local, la clave de ejemplo es `local-demo-key`.

JSON para crear o actualizar:

```json
{"name":"Café molido","description":"Bolsa de 500 g","price":129.50,"stock":20}
```

Ejemplo de creación en PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/products -Headers @{ 'x-api-key' = 'local-demo-key' } -ContentType 'application/json' -Body '{"name":"Café molido","description":"Bolsa de 500 g","price":129.50,"stock":20}'
```

## Despliegue en Render

El archivo `render.yaml` configura una API Node con plan Free y PostgreSQL Free. Render genera una clave `API_KEY` aleatoria para proteger las rutas de escritura. El endpoint de lectura permanece público.

El PostgreSQL Free de Render tiene 1 GB y vence 30 días después de su creación; no se recomienda para datos de producción. Para conservar datos más tiempo, cambia la base a un plan pagado en Render.

Para detener Docker sin borrar la base local: `docker compose down`. Los datos locales persisten en el volumen `postgres_data`.
