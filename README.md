# API de productos en Node.js y PostgreSQL

API REST para administrar un catálogo de productos y usarlo como backend de una integración con Alexa.

## Ejecutar localmente con Docker

Desde la raíz del repositorio:

```powershell
docker compose up -d --build
```

API: `http://localhost:3000` · PostgreSQL: `localhost:5432`.

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
