import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class DebugJwtMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const secretBase64 = process.env.SUPABASE_JWT_SECRET;
      
      console.log('--- DEBUG JWT ---');
      console.log('Token (first 10 chars):', token.substring(0, 10));
      console.log('Secret loaded:', secretBase64 ? 'Yes' : 'No');
      
      const decodedUnverified = jwt.decode(token, { complete: true });
      console.log('Token Header:', decodedUnverified?.header);
      
      if (secretBase64) {
        try {
          const secret = Buffer.from(secretBase64, 'base64');
          const decoded = jwt.verify(token, secret);
          console.log('Verificación con Buffer.from(base64): ÉXITO');
        } catch (e: any) {
          console.log('Verificación con Buffer.from(base64) FALLÓ:', e.message);
        }

        try {
          const decoded = jwt.verify(token, secretBase64);
          console.log('Verificación con texto plano: ÉXITO');
        } catch (e: any) {
          console.log('Verificación con texto plano FALLÓ:', e.message);
        }
      }
      console.log('-----------------');
    }
    next();
  }
}
