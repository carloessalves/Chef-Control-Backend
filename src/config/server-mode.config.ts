// server-mode.config.ts
export type ServerMode = 'local' | 'cloud';

export function getServerMode(): ServerMode {
  const mode = process.env.SERVER_MODE;
  if (mode !== 'local' && mode !== 'cloud') {
    throw new Error(
      `SERVER_MODE inválido ou não definido: "${mode}". Use "local" ou "cloud".`,
    );
  }
  return mode;
}

export function isLocalMode(): boolean {
  return getServerMode() === 'local';
}

export function isCloudMode(): boolean {
  return getServerMode() === 'cloud';
}
