import express, { Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db';
import * as repo from './repository/dbRepository';
import * as biz from './services/businessLogic';
import { authMiddleware, AuthRequest } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = Array.from(
  new Set(
    (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
      .split(',')
      .concat('https://sdmx-pagina-principal.vercel.app')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ),
);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

// Middleware de Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- RUTA CENTRALIZADA (Compatibilidad Legacy) ---
app.post('/api/request', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { action, payload } = req.body;
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(403).json({ error: 'Contexto de tenant faltante en el token' });
  }
  
  try {
    let result: any;
    
    switch (action) {
      case 'listar_solicitudes': result = await repo.listarSolicitudes(tenantId, payload); break;
      case 'get_solicitud': result = await repo.getSolicitudByFolio(tenantId, payload.folio); break;
      case 'crear_solicitud': result = await repo.crearSolicitud(tenantId, payload); break;
      case 'listar_clientes': result = await repo.listarClientes(tenantId, payload); break;
      case 'listar_gastos': result = await repo.listarGastos(tenantId, payload); break;
      case 'listar_stock': result = await repo.listarStock(tenantId, payload); break;
      case 'resumen_finanzas': result = await repo.getResumenFinanzas(tenantId, payload); break;
      case 'generar_reporte_operativo': result = await repo.generarReporteOperativo(tenantId, payload); break;
      case 'validar_admin_password': result = await biz.handleValidarAdminPassword(tenantId, payload); break;
      default:
        return res.status(400).json({ error: `Acción legacy no soportada: ${action}` });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// --- RUTAS REST (SaaS Grade) ---

// Solicitudes
app.get('/api/solicitudes', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await repo.listarSolicitudes(req.user!.tenantId, req.query);
  res.json(result);
});

app.get('/api/solicitudes/:folio', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await repo.getSolicitudByFolio(req.user!.tenantId, req.params.folio);
  res.json(result);
});

app.post('/api/solicitudes', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await repo.crearSolicitud(req.user!.tenantId, req.body);
  res.json(result);
});

// Equipos
app.get('/api/equipos', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await repo.getSemaforoData(req.user!.tenantId, req.query);
  res.json(result);
});

app.get('/api/equipos/:folio', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await repo.getEquipoByFolio(req.user!.tenantId, req.params.folio);
  res.json(result);
});

app.put('/api/equipos/:folio', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await repo.actualizarEquipo(req.user!.tenantId, req.params.folio, req.body);
  res.json(result);
});

// Clientes
app.get('/api/clientes', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await repo.listarClientes(req.user!.tenantId, req.query);
  res.json(result);
});

app.post('/api/clientes', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await repo.guardarCliente(req.user!.tenantId, req.body);
  res.json(result);
});

// Stock
app.get('/api/stock', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await repo.listarStock(req.user!.tenantId, req.query);
  res.json(result);
});

app.post('/api/stock', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await repo.guardarProductoStock(req.user!.tenantId, req.body);
  res.json(result);
});

// Gastos
app.get('/api/gastos', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await repo.listarGastos(req.user!.tenantId, req.query);
  res.json(result);
});

app.post('/api/gastos', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await repo.guardarGasto(req.user!.tenantId, req.body);
  res.json(result);
});

// Auth
app.post('/api/auth/login', async (req, res) => {
  const result = await biz.handleLoginInterno(req.body);
  if (!result.ok) return res.status(401).json(result);
  res.json(result);
});

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Init
initDb().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}).catch(err => {
  console.error('DB Init Error:', err);
  process.exit(1);
});
