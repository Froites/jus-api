import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import pool from './config/database';
import authRoutes from './routes/auth';
import publicacoesRoutes from './routes/publicacoes';

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Teste de conexão com banco
app.get('/api/db-test', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({
      status: 'Banco conectado!',
      time: result.rows[0].current_time
    });
  } catch (error) {
    console.error('❌ Erro de conexão:', error);
    res.status(500).json({
      error: 'Erro de conexão com banco',
      details: error
    });
  }
});

// Rota raiz
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'JUS API - Sistema de Gerenciamento de Publicações do DJE',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      publicacoes: '/api/publicacoes'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/publicacoes', publicacoesRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// 404
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 JUS API rodando na porta ${PORT}`);
  console.log(`📍 Acesse: http://localhost:${PORT}`);
});

export default app;