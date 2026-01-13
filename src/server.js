import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// SALUD
app.get('/api', (req, res) => {
  res.json({ status: 'API Online 🚀' });
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { cedula, clave } = req.body;

  if (!cedula || !clave) {
    return res.status(400).json({ msg: 'Datos incompletos' });
  }

  const result = await pool.query(
    'SELECT * FROM usuarios WHERE cedula = $1',
    [cedula]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ msg: 'Cédula no registrada' });
  }

  const usuario = result.rows[0];
  const ok = await bcrypt.compare(clave, usuario.clave);

  if (!ok) {
    return res.status(401).json({ msg: 'Contraseña incorrecta' });
  }

  res.json({
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      cedula: usuario.cedula,
    },
    msg: 'Login exitoso',
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend activo en puerto ${PORT}`);
});
