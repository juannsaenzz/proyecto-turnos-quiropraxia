import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';
import { createClient } from '@supabase/supabase-js';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private supabase;

  constructor(private reflector: Reflector) {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_ANON_KEY || ''
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token inválido o ausente');
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await this.supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    // Guardar el usuario en la request para que los controladores puedan usarlo
    request.user = { userId: user.id, email: user.email };
    return true;
  }
}
