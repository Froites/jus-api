import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../types/User';

interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'seu_jwt_secret_super_seguro';

  jwt.verify(token, jwtSecret, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }

    req.user = user as User;
    next();
  });
};

export const generateToken = (user: User): string => {
  const jwtSecret = process.env.JWT_SECRET || 'seu_jwt_secret_super_seguro';
  
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      nome: user.nome 
    },
    jwtSecret,
    { expiresIn: '24h' }
  );
};