import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { PublicacaoCreate, PublicacaoFilters } from '../types/Publicacao';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const filters = req.query as PublicacaoFilters;
    const page = parseInt(filters.page || '1') || 1;
    const limit = parseInt(filters.limit || '20') || 20;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM publicacoes WHERE 1=1';
    const values: any[] = [];
    let paramCount = 0;

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

    if (filters.data_inicio) {
      query += ` AND data_disponibilizacao >= $${++paramCount}`;
      values.push(filters.data_inicio);
    }

    if (filters.data_fim) {
      query += ` AND data_disponibilizacao <= $${++paramCount}`;
      values.push(filters.data_fim);
    }

    // Busca geral (processo, advogado)
    if (filters.search) {
      query += ` AND (
        numero_processo ILIKE $${++paramCount} OR 
        autores ILIKE $${paramCount} OR 
        advogados ILIKE $${paramCount}
      )`;
      values.push(`%${filters.search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    let countQuery = 'SELECT COUNT(*) FROM publicacoes WHERE 1=1';
    const countValues: any[] = [];
    let countParamCount = 0;

    if (filters.status) {
      countQuery += ` AND status = $${++countParamCount}`;
      countValues.push(filters.status);
    }

    if (filters.numero_processo) {
      countQuery += ` AND numero_processo ILIKE $${++countParamCount}`;
      countValues.push(`%${filters.numero_processo}%`);
    }

    if (filters.autor) {
      countQuery += ` AND autores ILIKE $${++countParamCount}`;
      countValues.push(`%${filters.autor}%`);
    }

    if (filters.data_inicio) {
      countQuery += ` AND data_disponibilizacao >= $${++countParamCount}`;
      countValues.push(filters.data_inicio);
    }

    if (filters.data_fim) {
      countQuery += ` AND data_disponibilizacao <= $${++countParamCount}`;
      countValues.push(filters.data_fim);
    }

    if (filters.search) {
      countQuery += ` AND (
        numero_processo ILIKE $${++countParamCount} OR 
        autores ILIKE $${countParamCount} OR 
        advogados ILIKE $${countParamCount}
      )`;
      countValues.push(`%${filters.search}%`);
    }

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
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
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.put('/:id/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const statusPermitidos = ['nova', 'lida', 'enviada_adv', 'concluida'];
    if (!statusPermitidos.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const currentResult = await pool.query('SELECT status FROM publicacoes WHERE id = $1', [id]);
    if (currentResult.rowCount === 0) {
      return res.status(404).json({ error: 'Publicação não encontrada' });
    }

    const currentStatus = currentResult.rows[0].status;

    // Regras de movimento do Kanban
    const movimentoValido = validarMovimentoKanban(currentStatus, status);
    if (!movimentoValido) {
      return res.status(400).json({ 
        error: 'Movimento não permitido. Verifique o fluxo do Kanban.' 
      });
    }

    const query = `
      UPDATE publicacoes 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;

    const result = await pool.query(query, [status, id]);

    res.json({
      message: 'Status atualizado com sucesso',
      data: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'nova' THEN 1 END) as novas,
        COUNT(CASE WHEN status = 'lida' THEN 1 END) as lidas,
        COUNT(CASE WHEN status = 'enviada_adv' THEN 1 END) as enviadas_adv,
        COUNT(CASE WHEN status = 'concluida' THEN 1 END) as concluidas,
        COALESCE(SUM(valor_principal_bruto), 0) as valor_total,
        COALESCE(AVG(valor_principal_bruto), 0) as valor_medio
      FROM publicacoes
    `;

    const result = await pool.query(statsQuery);
    const stats = result.rows[0];

    res.json({
      estatisticas: {
        total: parseInt(stats.total),
        por_status: {
          nova: parseInt(stats.novas),
          lida: parseInt(stats.lidas),
          enviada_adv: parseInt(stats.enviadas_adv),
          concluida: parseInt(stats.concluidas)
        },
        valores: {
          total: parseFloat(stats.valor_total),
          medio: parseFloat(stats.valor_medio)
        }
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Função para validar movimento no Kanban
function validarMovimentoKanban(statusAtual: string, novoStatus: string): boolean {
  const fluxosPermitidos: { [key: string]: string[] } = {
    'nova': ['lida'],
    'lida': ['enviada_adv'],
    'enviada_adv': ['concluida', 'lida'],
    'concluida': []
  };

  return fluxosPermitidos[statusAtual]?.includes(novoStatus) || false;
}

export default router;