import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return null;
    }

    const { password_hash, ...result } = user;
    return result;
  }

  async register(registerDto: RegisterDto) {
    const { email, password, name, primaryRole } = registerDto;

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.usersService.create({
      email,
      passwordHash,
      name,
      primaryRole,
    });

    // Assign default LEARNER role
    await this.usersService.assignRole(user.id, 'LEARNER');

    const { password_hash: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken: await this.generateAccessToken(user),
      refreshToken: await this.generateRefreshToken(user),
    };
  }

  async login(user: any) {
    return {
      user,
      accessToken: await this.generateAccessToken(user),
      refreshToken: await this.generateRefreshToken(user),
    };
  }

  async generateAccessToken(user: any): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      primaryRole: user.primaryRole,
      isSuperAdmin: user.isSuperAdmin,
    };

    return this.jwtService.sign(payload);
  }

  async generateRefreshToken(user: any): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRATION') || '7d',
    });
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const { password_hash, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        accessToken: await this.generateAccessToken(user),
        refreshToken: await this.generateRefreshToken(user),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await this.usersService.findByIdWithRoles(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
