import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

const SLOW_QUERY_THRESHOLD_MS = 200;

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'warn' | 'error'>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private connected = false;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';

    super({
      log: isProduction
        ? [
            { level: 'warn', emit: 'event' },
            { level: 'error', emit: 'event' },
          ]
        : [
            { level: 'query', emit: 'event' },
            { level: 'warn', emit: 'event' },
            { level: 'error', emit: 'event' },
          ],
    });
  }

  async onModuleInit() {
    // Log de queries (só ativo em dev, conforme configurado no construtor)
    this.$on('query', (event: Prisma.QueryEvent) => {
      const isSlow = event.duration > SLOW_QUERY_THRESHOLD_MS;
      const message = `[${event.duration}ms] ${event.query}`;

      if (isSlow) {
        this.logger.warn(`Query lenta detectada: ${message}`);
      } else {
        this.logger.debug(message);
      }
    });

    this.$on('warn', (event: Prisma.LogEvent) => {
      this.logger.warn(event.message);
    });

    this.$on('error', (event: Prisma.LogEvent) => {
      this.logger.error(event.message);
    });

    try {
      await this.$connect();
      this.connected = true;
      this.logger.log('Conexão com o banco de dados estabelecida com sucesso.');
    } catch (error) {
      this.connected = false;
      this.logger.error(
        'Falha ao conectar com o banco de dados.',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    this.connected = false;
    await this.$disconnect();
  }

  /**
   * Verifica se o banco de dados está acessível no momento da chamada.
   * Usado pelo endpoint /health para reportar o status real da conexão,
   * não apenas o estado registrado na inicialização.
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error(
        'Health check falhou: banco de dados inacessível.',
        error instanceof Error ? error.stack : String(error),
      );
      return false;
    }
  }
}
