import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DatabaseService } from '../database/database.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private db: DatabaseService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  async check() {
    const startTime = Date.now();

    try {
      // Check database connection
      const dbHealth = await this.db.healthCheck();
      const responseTime = Date.now() - startTime;

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbHealth ? 'connected' : 'disconnected',
        responseTime: `${responseTime}ms`,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'disconnected',
        responseTime: `${responseTime}ms`,
        error: error.message,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
      };
    }
  }

  @Get('db')
  @ApiOperation({ summary: 'Database connection check' })
  async checkDatabase() {
    try {
      const isHealthy = await this.db.healthCheck();

      if (!isHealthy) {
        return {
          status: 'error',
          database: 'disconnected',
          message: 'Database connection failed',
        };
      }

      // Get database stats
      const result = await this.db.query(
        `SELECT 
          current_database() as database,
          current_user as user,
          version() as version,
          NOW() as server_time`,
        []
      );

      return {
        status: 'ok',
        database: 'connected',
        details: result.rows[0],
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        message: error.message,
      };
    }
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes/container orchestration' })
  async ready() {
    try {
      const dbHealth = await this.db.healthCheck();

      if (!dbHealth) {
        return {
          status: 'not_ready',
          reason: 'Database not available',
        };
      }

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'not_ready',
        reason: error.message,
      };
    }
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes/container orchestration' })
  live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
