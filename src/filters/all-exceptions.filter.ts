import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message, error } = this.resolveException(exception);

    const body: ErrorResponseBody = {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log completo (com stack) fica só no servidor — nunca vai pro cliente.
    this.logException(exception, request, statusCode);

    response.status(statusCode).json(body);
  }

  private resolveException(exception: unknown): {
    statusCode: number;
    message: string | string[];
    error: string;
  } {
    // 1. Exceptions HTTP nativas do Nest (BadRequestException, NotFoundException, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      const message =
        typeof res === 'string'
          ? res
          : (res as any).message ?? exception.message;

      return {
        statusCode: status,
        message,
        error: (res as any).error ?? HttpStatus[status] ?? 'Error',
      };
    }

    // 2. Erros conhecidos do Prisma
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.mapPrismaError(exception);
    }

    // 3. Erro de validação do Prisma (ex: tipo de dado incorreto)
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Dados inválidos enviados para a operação no banco de dados.',
        error: 'Bad Request',
      };
    }

    // 4. Qualquer outro erro não mapeado (fallback seguro)
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Erro interno do servidor.',
      error: 'Internal Server Error',
    };
  }

  private mapPrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    statusCode: number;
    message: string;
    error: string;
  } {
    switch (exception.code) {
      // Violação de unique constraint
      case 'P2002': {
        const target = (exception.meta?.target as string[])?.join(', ');
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `Já existe um registro com o mesmo valor para: ${target ?? 'campo único'}.`,
          error: 'Conflict',
        };
      }

      // Violação de foreign key
      case 'P2003': {
        const field = exception.meta?.field_name as string | undefined;
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Referência inválida: o valor informado para "${field ?? 'campo relacionado'}" não existe.`,
          error: 'Bad Request',
        };
      }

      // Registro não encontrado (ex: update/delete em ID inexistente)
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Registro não encontrado.',
          error: 'Not Found',
        };

      // Fallback para outros códigos do Prisma não mapeados explicitamente
      default:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Erro ao processar a operação no banco de dados.',
          error: 'Bad Request',
        };
    }
  }

  private logException(exception: unknown, request: Request, statusCode: number) {
    const errorInfo =
      exception instanceof Error
        ? exception.stack
        : JSON.stringify(exception);

    // Erros 5xx são críticos — log como error. Erros 4xx como warn (esperados).
    const logMessage = `[${request.method}] ${request.url} -> ${statusCode}`;

    if (statusCode >= 500) {
      this.logger.error(logMessage, errorInfo);
    } else {
      this.logger.warn(logMessage);
    }
  }
}
