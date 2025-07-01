import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { User, UserCreate, UserLogin, AuthResponse } from '../types/User';
import { authenticateToken, generateToken } from '../middleware/auth';

const router = Router();

// Registro de usuário
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { nome, email, senha }: UserCreate = req.body;

    // Validações básicas
    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!senhaRegex.test(senha)) {
      return res.status(400).json({ 
        error: 'A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial' 
      });
    }

    // Verificar se email já existe
    const existingUser = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(senha, saltRounds);

    // Criar usuário
    const result = await pool.query(
      'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email, created_at',
      [nome, email, hashedPassword]
    );

    const user: User = result.rows[0];
    const token = generateToken(user);

    const response: AuthResponse = {
      user,
      token,
      message: 'Usuário criado com sucesso'
    };

    res.status(201).json(response);

  } catch (error) {
    console.error('❌ Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Login de usuário
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, senha }: UserLogin = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const result = await pool.query(
      'SELECT id, nome, email, senha FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const userData = result.rows[0];

    // Verificar senha
    const isValidPassword = await bcrypt.compare(senha, userData.senha);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user: User = {
      id: userData.id,
      nome: userData.nome,
      email: userData.email
    };

    const token = generateToken(user);

    const response: AuthResponse = {
      user,
      token,
      message: 'Login realizado com sucesso'
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/me', authenticateToken, (req: any, res: Response) => {
  res.json({
    user: req.user,
    message: 'Usuário autenticado'
  });
});

router.post('/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logout realizado com sucesso' });
});

export default router;