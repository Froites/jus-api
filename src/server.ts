import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import pool from './config/database';
import { Publicacao, PublicacaoCreate, PublicacaoFilters } from './types/Publicacao';

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

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'JUS API - Sistema de Gerenciamento de Publicações do DJE',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      publicacoes: '/api/publicacoes'
    }
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

app.get('/api/publicacoes', async (req: Request, res: Response) => {
  try {
    const filters = req.query as PublicacaoFilters;
    const page = parseInt(filters.page || '1') || 1;
    const limit = parseInt(filters.limit || '20') || 20;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM publicacoes WHERE 1=1';
    const values: any[] = [];
    let paramCount = 0;

    // Filtros dinâmicos
    if (filters.status) {
      query += ` AND status = $${++paramCount}`;
      values.push(filters.status);
    }

    if (filters.numero_processo) {
      query += ` AND numero_processo ILIKE $${++paramCount}`;
      values.push(`%${filters.numero_processo}%`);
    }

    if (filters.autor) {
      query += ` AND autores ILIKE $${++paramCount}`;
      values.push(`%${filters.autor}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total: result.rowCount || 0
      }
    });

  } catch (error) {
    console.error('Erro ao buscar publicações:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

app.post('/api/publicacoes', async (req: Request, res: Response) => {
  try {
    const publicacao: PublicacaoCreate = req.body;

    const query = `
      INSERT INTO publicacoes (
        numero_processo, data_disponibilizacao, autores, advogados,
        conteudo_completo, valor_principal_bruto, valor_juros_moratorios,
        honorarios_advocaticios, url_publicacao
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      publicacao.numero_processo,
      publicacao.data_disponibilizacao,
      publicacao.autores,
      publicacao.advogados,
      publicacao.conteudo_completo,
      publicacao.valor_principal_bruto,
      publicacao.valor_juros_moratorios,
      publicacao.honorarios_advocaticios,
      publicacao.url_publicacao
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      message: 'Publicação criada com sucesso',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar publicação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/publicacoes/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['nova', 'lida', 'processada'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const query = `
      UPDATE publicacoes 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;

    const result = await pool.query(query, [status, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Publicação não encontrada' });
    }

    res.json({
      message: 'Status atualizado com sucesso',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Middleware de erro
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

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
  console.log(`🩺 Health: http://localhost:${PORT}/health`);
});

export default app;