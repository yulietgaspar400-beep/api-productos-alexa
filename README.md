# API de productos en Node.js y PostgreSQL

API REST para administrar el catálogo de productos y utilizarlo como backend de una integración con Alexa.

## Iniciar

Ejecuta desde la raíz del repositorio:

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

JSON de creación/actualización:

```json
{"name":"Café molido","description":"Bolsa de 500 g","price":129.50,"stock":20}
```

Ejemplo desde PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/products -ContentType 'application/json' -Body '{"name":"Café molido","description":"Bolsa de 500 g","price":129.50,"stock":20}'
```

Para detener contenedores sin borrar la base: `docker compose down`. Los datos persisten en el volumen `postgres_data`.

La contraseña de `compose.yaml` es solo para desarrollo local; cámbiala antes de exponer los servicios a una red.
