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

// ===== CORS =====
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json());

// ===== Servir frontend =====
app.use(express.static(path.join(__dirname, 'dist'))); // Ajustar si usas otro build

// ===== Ruta de salud =====
app.get('/api', (req,res) => {
  res.json({ status: 'API Online 🚀', database: 'Conectada ✅' });
});

// ==========================================
// 🔐 LOGIN
// ==========================================
app.post('/api/login', async (req,res) => {
  try {
    const { cedula, clave } = req.body;
    if (!cedula || !clave) return res.status(400).json({ msg: 'Cédula y clave requeridas' });

    const result = await pool.query('SELECT * FROM usuarios WHERE cedula = $1', [cedula]);
    if (result.rows.length === 0) return res.status(401).json({ msg: 'Cédula no registrada' });

    const usuario = result.rows[0];
    const match = await bcrypt.compare(clave, usuario.clave);
    if (!match) return res.status(401).json({ msg: 'Contraseña incorrecta' });

    res.json({ 
      usuario: { id: usuario.id, nombre: usuario.nombre, cedula: usuario.cedula },
      msg: 'Login exitoso'
    });
  } catch (err) {
    console.error('Error login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==========================================
// 👥 CRUD USUARIOS
// ==========================================
app.get('/api/usuarios', async (req,res) => {
  try {
    const result = await pool.query('SELECT id, cedula, nombre FROM usuarios ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/usuarios', async (req,res) => {
  try {
    const { cedula, nombre, clave } = req.body;
    if (!cedula || !nombre || !clave) return res.status(400).json({ msg: 'Datos incompletos' });

    const hash = await bcrypt.hash(clave, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (cedula, nombre, clave) VALUES ($1, $2, $3) RETURNING id, cedula, nombre',
      [cedula, nombre, hash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/usuarios/:id', async (req,res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.json({ msg: 'Usuario eliminado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 📚 CRUD MATERIAS
// ==========================================
app.get('/api/materias', async (req,res) => {
  try {
    const result = await pool.query('SELECT * FROM materias ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/materias', async (req,res) => {
  try {
    const { codigo, nombre } = req.body;
    if (!codigo || !nombre) return res.status(400).json({ msg: 'Datos incompletos' });

    const result = await pool.query(
      'INSERT INTO materias (codigo, nombre) VALUES ($1, $2) RETURNING *',
      [codigo, nombre]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 🎓 CRUD ESTUDIANTES
// ==========================================
app.get('/api/estudiantes', async (req,res) => {
  try {
    const result = await pool.query('SELECT * FROM estudiantes ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/estudiantes', async (req,res) => {
  try {
    const { cedula, nombre } = req.body;
    if (!cedula || !nombre) return res.status(400).json({ msg: 'Datos incompletos' });

    const result = await pool.query(
      'INSERT INTO estudiantes (cedula, nombre) VALUES ($1, $2) RETURNING *',
      [cedula, nombre]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 📝 CRUD NOTAS
// ==========================================
app.get('/api/notas', async (req,res) => {
  try {
    const sql = `
      SELECT n.id, e.nombre AS estudiante, m.nombre AS materia, n.nota
      FROM notas n
      JOIN estudiantes e ON n.estudiante_id = e.id
      JOIN materias m ON n.materia_id = m.id
      ORDER BY n.id ASC
    `;
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ==========================================
// 🚀 INICIO SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor activo en puerto ${PORT}`);
});

