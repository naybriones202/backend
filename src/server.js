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

// ===== CONFIGURACIÓN =====
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../'))); 

// ===== RUTA DE SALUD =====
app.get('/api', (req, res) => {
  res.json({ status: 'API Online 🚀', database: 'Conectada ✅' });
});

// ==========================================
// 🔐 AUTENTICACIÓN (LOGIN Y REGISTRO)
// ==========================================

app.post('/api/login', async (req, res) => {
  try {
    const { cedula, clave } = req.body;
    const result = await pool.query('SELECT * FROM usuarios WHERE cedula = $1', [cedula]);
    
    if (result.rows.length === 0) return res.status(401).json({ msg: 'Usuario no encontrado' });

    const usuario = result.rows[0];
    const match = await bcrypt.compare(clave, usuario.clave);
    if (!match) return res.status(401).json({ msg: 'Contraseña incorrecta' });

    res.json({ 
      usuario: { id: usuario.id, nombre: usuario.nombre, cedula: usuario.cedula },
      msg: 'Bienvenido'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/usuarios', async (req, res) => {
  try {
    const { cedula, nombre, clave } = req.body;
    const hash = await bcrypt.hash(clave, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (cedula, nombre, clave) VALUES ($1, $2, $3) RETURNING id, nombre',
      [cedula, nombre, hash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 👥 CRUD USUARIOS (GESTORES DEL SISTEMA)
// ==========================================

app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, cedula, nombre FROM usuarios ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);
    res.json({ msg: 'Usuario eliminado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 📚 CRUD MATERIAS (EDITAR Y ELIMINAR)
// ==========================================

app.get('/api/materias', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM materias ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/materias', async (req, res) => {
  try {
    const { codigo, nombre } = req.body;
    const result = await pool.query('INSERT INTO materias (codigo, nombre) VALUES ($1, $2) RETURNING *', [codigo, nombre]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/materias/:id', async (req, res) => {
  try {
    const { codigo, nombre } = req.body;
    await pool.query('UPDATE materias SET codigo = $1, nombre = $2 WHERE id = $3', [codigo, nombre, req.params.id]);
    res.json({ msg: 'Materia actualizada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/materias/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM materias WHERE id = $1', [req.params.id]);
    res.json({ msg: 'Materia eliminada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 🎓 CRUD ESTUDIANTES (EDITAR Y ELIMINAR)
// ==========================================

app.get('/api/estudiantes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM estudiantes ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/estudiantes', async (req, res) => {
  try {
    const { cedula, nombre } = req.body;
    const result = await pool.query('INSERT INTO estudiantes (cedula, nombre) VALUES ($1, $2) RETURNING *', [cedula, nombre]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/estudiantes/:id', async (req, res) => {
  try {
    const { cedula, nombre } = req.body;
    await pool.query('UPDATE estudiantes SET cedula = $1, nombre = $2 WHERE id = $3', [cedula, nombre, req.params.id]);
    res.json({ msg: 'Estudiante actualizado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/estudiantes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM estudiantes WHERE id = $1', [req.params.id]);
    res.json({ msg: 'Estudiante eliminado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 📝 CRUD NOTAS (EDITAR Y ELIMINAR)
// ==========================================

app.get('/api/notas', async (req, res) => {
  try {
    const sql = `
      SELECT n.id, e.nombre AS estudiante, m.nombre AS materia, n.nota
      FROM notas n
      JOIN estudiantes e ON n.estudiante_id = e.id
      JOIN materias m ON n.materia_id = m.id
      ORDER BY n.id ASC`;
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/notas', async (req, res) => {
  try {
    const { estudiante_id, materia_id, nota } = req.body;
    const result = await pool.query(
      'INSERT INTO notas (estudiante_id, materia_id, nota) VALUES ($1, $2, $3) RETURNING *',
      [estudiante_id, materia_id, nota]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/notas/:id', async (req, res) => {
  try {
    const { nota } = req.body;
    await pool.query('UPDATE notas SET nota = $1 WHERE id = $2', [nota, req.params.id]);
    res.json({ msg: 'Nota actualizada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/notas/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM notas WHERE id = $1', [req.params.id]);
    res.json({ msg: 'Nota eliminada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== MANEJO DE RUTAS FRONTEND (CORRECCIÓN PATH ERROR) =====
app.get(/(.*)/, (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../index.html'));
  }
});

// ===== INICIO =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor activo en puerto ${PORT}`);
});
