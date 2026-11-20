import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma.service';

export interface JwtPayload {
  sub: number;
  email: string;
  orgId: number;
  roleId: number | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        'exhibition-app-local-jwt-secret-change-me',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.userMaster.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.status) {
      throw new UnauthorizedException('Invalid or inactive user');
    }

    const { password: _password, ...safeUser } = user;
    void _password;
    return safeUser;
  }
}
