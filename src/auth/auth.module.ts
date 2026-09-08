import { Global, Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './jwt.strategy.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';

@Global()
@Module({
  imports: [
    forwardRef(() => UsuariosModule),
    PassportModule.register({ defaultStrategy: 'jwt' }), // 👈 corrigido
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'chef-sys-secret-dev',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [PassportModule, JwtModule, AuthService],
})
export class AuthModule {}
