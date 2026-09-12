import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    console.log("JWT Secret loaded:", process.env.SUPABASE_JWT_SECRET ? process.env.SUPABASE_JWT_SECRET.substring(0, 5) + "..." : "fallback_secret");
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SUPABASE_JWT_SECRET 
        ? Buffer.from(process.env.SUPABASE_JWT_SECRET, 'base64') 
        : 'fallback_secret',
    });
  }

  async validate(payload: any) {
    // payload contiene los datos decodificados del JWT de Supabase
    // Por ejemplo: payload.email, payload.sub (user id)
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
