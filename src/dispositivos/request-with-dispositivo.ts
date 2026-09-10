import { Request } from 'express';

export interface RequestWithDispositivo extends Request {
  dispositivo: {
    id: string;
    identificador: string;
    unidadeId: string;
    ativo: boolean;
    nome?: string | null;
  };
}
