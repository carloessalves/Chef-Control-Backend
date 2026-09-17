-- Garante nome único por unidade, mas somente entre dispositivos ativos.
-- Dispositivos desativados (soft delete) não bloqueiam reuso do nome.
CREATE UNIQUE INDEX "dispositivos_unidadeId_nome_ativo_unique"
ON "dispositivos" ("unidadeId", "nome")
WHERE "ativo" = true;
