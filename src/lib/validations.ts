import { z } from "zod";

// ===== OS Form Validation =====
export const osFormSchema = z.object({
  osId: z.string().min(1, "Informe o número da OS"),
  cliente: z.string().min(1, "Informe o cliente"),
  date: z.string().min(1, "Informe a data"),
  tipo: z.string().min(1, "Selecione o tipo"),
  dificuldadeId: z.string().min(1, "Selecione a dificuldade"),
  duracaoId: z.string().min(1, "Selecione a duração"),
  valorOs: z.number().min(0, "Valor deve ser positivo").optional(),
  setor: z.string().optional(),
  obs: z.string().optional(),
  employeeId: z.string().min(1, "Selecione um colaborador"),
});

export type OSFormData = z.infer<typeof osFormSchema>;

// ===== Employee Form Validation =====
export const employeeFormSchema = z.object({
  name: z.string().min(1, "Informe o nome do colaborador"),
  role: z.string().optional(),
  email: z.string()
    .min(1, "Informe o email do colaborador")
    .email("Email inválido"),
});

export type EmployeeFormData = z.infer<typeof employeeFormSchema>;

// ===== Config Validation =====
export const configSchema = z.object({
  bonusCap: z.number().min(0, "Teto deve ser positivo"),
  maxPts: z.number().min(1, "Pontuação máxima deve ser maior que 0"),
  horasEsperadas: z.number().min(1, "Horas esperadas deve ser maior que 0"),
});

export type ConfigFormData = z.infer<typeof configSchema>;

// ===== Validation Helper =====
export function validateWithZod<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map((e) => e.message);
  return { success: false, errors };
}

// ===== Get first error =====
export function getFirstError<T>(schema: z.ZodSchema<T>, data: unknown): string | null {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return null;
  }
  
  return result.error.errors[0]?.message || "Erro de validação";
}
