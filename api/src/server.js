import { createServer } from 'node:http';
import { Pool } from 'pg';

const port = Number(process.env.PORT ?? 3000);
const databaseUrl = process.env.DATABASE_URL;
const pool = new Pool({
  ...(databaseUrl
    ? { connectionString: databaseUrl }
    : {
        host: process.env.PGHOST ?? 'localhost',
        port: Number(process.env.PGPORT ?? 5432),
        database: process.env.PGDATABASE ?? 'appdb',
        user: process.env.PGUSER ?? 'appuser',
        password: process.env.PGPASSWORD ?? 'cambiar_esta_clave',
      }),
  ...(process.env.DATABASE_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
});

const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
};

async function readBody(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1_000_000) throw new Error('El cuerpo supera 1 MB');
  }
  return raw ? JSON.parse(raw) : {};
}

await pool.query(`
  CREATE TABLE IF NOT EXISTS products (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`);

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  const path = url.pathname;
  try {
    if (req.method === 'GET' && path === '/api/health') {
      await pool.query('SELECT 1');
      return json(res, 200, { status: 'ok', database: 'connected' });
    }

    if (req.method === 'GET' && path === '/api/products') {
      const result = await pool.query('SELECT id, name, description, price, stock, created_at FROM products ORDER BY id');
      return json(res, 200, result.rows);
    }

    if (req.method === 'POST' && path === '/api/products') {
      if (process.env.API_KEY && req.headers['x-api-key'] !== process.env.API_KEY) return json(res, 401, { error: 'API key inválida o ausente' });
      const { name, description = '', price, stock = 0 } = await readBody(req);
      if (typeof name !== 'string' || !name.trim() || typeof description !== 'string' ||
          !Number.isFinite(Number(price)) || Number(price) < 0 ||
          !Number.isInteger(Number(stock)) || Number(stock) < 0) {
        return json(res, 400, { error: 'name y description deben ser texto; price y stock deben ser números no negativos' });
      }
      const result = await pool.query(
        'INSERT INTO products (name, description, price, stock) VALUES ($1, $2, $3, $4) RETURNING id, name, description, price, stock, created_at',
        [name.trim(), description.trim(), price, stock],
      );
      return json(res, 201, result.rows[0]);
    }

    const match = path.match(/^\/api\/products\/(\d+)$/);
    if (match && req.method === 'GET') {
      const result = await pool.query(
        'SELECT id, name, description, price, stock, created_at FROM products WHERE id = $1', [match[1]],
      );
      return result.rowCount ? json(res, 200, result.rows[0]) : json(res, 404, { error: 'Producto no encontrado' });
    }

    if (match && req.method === 'PUT') {
      if (process.env.API_KEY && req.headers['x-api-key'] !== process.env.API_KEY) return json(res, 401, { error: 'API key inválida o ausente' });
      const { name, description = '', price, stock = 0 } = await readBody(req);
      if (typeof name !== 'string' || !name.trim() || typeof description !== 'string' ||
          !Number.isFinite(Number(price)) || Number(price) < 0 ||
          !Number.isInteger(Number(stock)) || Number(stock) < 0) {
        return json(res, 400, { error: 'name y description deben ser texto; price y stock deben ser números no negativos' });
      }
      const result = await pool.query(
        'UPDATE products SET name = $1, description = $2, price = $3, stock = $4 WHERE id = $5 RETURNING id, name, description, price, stock, created_at',
        [name.trim(), description.trim(), price, stock, match[1]],
      );
      return result.rowCount ? json(res, 200, result.rows[0]) : json(res, 404, { error: 'Producto no encontrado' });
    }

    if (match && req.method === 'DELETE') {
      if (process.env.API_KEY && req.headers['x-api-key'] !== process.env.API_KEY) return json(res, 401, { error: 'API key inválida o ausente' });
      const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [match[1]]);
      return result.rowCount ? json(res, 200, { deleted: true, id: result.rows[0].id }) : json(res, 404, { error: 'Producto no encontrado' });
    }

    return json(res, 404, { error: 'Ruta no encontrada' });
  } catch (error) {
    if (error instanceof SyntaxError) return json(res, 400, { error: 'JSON inválido' });
    console.error(error);
    return json(res, 500, { error: 'Error interno del servidor' });
  }
});

server.listen(port, '0.0.0.0', () => console.log(`API lista en http://localhost:${port}`));

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);


