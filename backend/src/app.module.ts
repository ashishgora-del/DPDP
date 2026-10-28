import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CatalogModule } from './catalog/catalog.module';
import { LearningModule } from './learning/learning.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { RiskAssessmentModule } from './risk-assessment/risk-assessment.module';
import { TemplateGenerationModule } from './template-generation/template-generation.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate limiting: Higher limits for development
    // Auth endpoints use stricter limits via @Throttle() decorator
    // Read-only endpoints (GET) skip throttling via @SkipThrottle()
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,  // 60 seconds
        limit: 5000,  // Very high limit for development/testing
      },
      {
        name: 'auth',
        ttl: 60_000,
        limit: 20,   // 20 auth attempts per minute
      },
    ]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    LearningModule,
    AdminModule,
    HealthModule,
    RiskAssessmentModule,
    TemplateGenerationModule,
    ProjectsModule,
  ],
  providers: [
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
