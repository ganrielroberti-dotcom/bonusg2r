-- Atualizar max_pts padrão para 18 (novo critério "Capricho" adicionado)
UPDATE public.config SET max_pts = 18 WHERE max_pts = 16;

-- Atualizar o valor default para novas configs
ALTER TABLE public.config ALTER COLUMN max_pts SET DEFAULT 18;