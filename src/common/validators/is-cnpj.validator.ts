import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

function calcularDigito(cnpj: string, tamanho: number): number {
  const numeros = cnpj.substring(0, tamanho);
  const pesos =
    tamanho === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const soma = numeros
    .split('')
    .reduce((acc, num, i) => acc + Number(num) * pesos[i], 0);

  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

@ValidatorConstraint({ name: 'isCnpj', async: false })
class IsCnpjConstraint implements ValidatorConstraintInterface {
  validate(cnpj: unknown): boolean {
    if (!cnpj || typeof cnpj !== 'string') return false;

    const limpo = cnpj.replace(/\D/g, '');
    if (limpo.length !== 14) return false;

    // Rejeita sequências repetidas (ex: "11111111111111")
    if (/^(\d)\1{13}$/.test(limpo)) return false;

    const digito1 = calcularDigito(limpo, 12);
    const digito2 = calcularDigito(limpo.substring(0, 13), 13);

    return digito1 === Number(limpo[12]) && digito2 === Number(limpo[13]);
  }

  defaultMessage(): string {
    return 'CNPJ inválido.';
  }
}

export function IsCnpj(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCnpj',
      target: object.constructor,
      propertyName,
      options,
      validator: IsCnpjConstraint,
    });
  };
}
