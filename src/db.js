import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Manejo básico de errores de conexión
pool.on('error', (err) => {
  console.error('Error inesperado en la conexión de la DB:', err);
});
