import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ MIDDLEWARES (ANTES DE RUTAS)
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));

// 🔥 ESTE ES EL CRÍTICO
app.use(express.json());

// ==========================================
// 🔐 LOGIN
// ==========================================
app.post('/api/login', async (req, res) => {
  try {
    console.log('BODY RECIBIDO:', req.body); // 👈 DEBUG

    const { cedula, clave } = req.body;

    if (!cedula || !clave) {
      return res.status(400).json({ msg: 'Cédula y clave requeridas' });
    }

    const result = await pool.query(
      'SELECT * FROM usuarios WHERE cedula = $1',
      [cedula]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ msg: 'Cédula no registrada' });
    }

    const usuario = result.rows[0];
    const match = await bcrypt.compare(clave, usuario.clave);

    if (!match) {
      return res.status(401).json({ msg: 'Contraseña incorrecta' });
    }

    res.json({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        cedula: usuario.cedula
      },
      msg: 'Login exitoso'
    });

  } catch (err) {
    console.error('Error login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


