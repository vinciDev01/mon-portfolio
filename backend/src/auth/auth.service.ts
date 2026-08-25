import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

import { lireSecretJwt } from '../config/secrets';

// Lu au chargement du module : une configuration manquante fait echouer le
// demarrage, pas la premiere tentative de connexion d'un visiteur.
const JWT_SECRET = lireSecretJwt(process.env);

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.adminUser.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Identifiants invalides');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Identifiants invalides');

    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return { token, email: user.email };
  }

  validateToken(token: string): { sub: string; email: string } {
    try {
      return jwt.verify(token, JWT_SECRET) as { sub: string; email: string };
    } catch {
      throw new UnauthorizedException('Token invalide');
    }
  }
}
