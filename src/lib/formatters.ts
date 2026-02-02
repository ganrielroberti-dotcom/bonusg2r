// Formatting utilities for G2R Bonus Management

export function formatBRL(n: number): string {
  return Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatPercent(x: number): string {
  return Math.round((x || 0) * 100) + "%";
}

export function formatDate(isoDate: string): string {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function formatMonthKey(monthKey: string): string {
  if (!monthKey || monthKey.length < 7) return "";
  const [year, month] = monthKey.split("-");
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const monthIndex = parseInt(month, 10) - 1;
  return `${months[monthIndex]} ${year}`;
}
