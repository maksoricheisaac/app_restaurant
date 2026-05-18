import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET environment variable is required');
        return { secret, signOptions: { expiresIn: '15m' } };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [OnboardingController, AuthController],
  providers: [AuthService, OnboardingService, LocalStrategy, JwtStrategy],
  // Export JwtModule so GatewayModule can use JwtService without re-registering
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
