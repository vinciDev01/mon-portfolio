import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

const JWT_SECRET = process.env.JWT_SECRET || 'portfolio-secret-key-change-in-prod';

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
