import { useEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Database, Employee, OSRecord, BonusCamadas } from "@/types/bonus";
import { calcBonusCamadas, getMonthOS } from "@/lib/database";
import { AuditSummary } from "./AuditSummary";
import { CriteriaAverageChart, DifficultyPieChart, CEQEvolutionChart, BonusLayersChart } from "./AuditCharts";
import { AuditOSTable } from "./AuditOSTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Download, FileText, BarChart3, Table, FileSpreadsheet } from "lucide-react";

interface AuditContentProps {
  db: Database;
  monthKey: string;
  employee: Employee;
  osList: OSRecord[];
  camadas: BonusCamadas;
}

function AuditContent({ db, monthKey, employee, osList, camadas }: AuditContentProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHTML = () => {
    const html = document.documentElement.outerHTML;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria_${employee.name.replace(/\s+/g, "_")}_${monthKey}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              <span className="text-primary">G2R</span> • Auditoria de Bônus
            </h1>
            <p className="text-sm text-muted-foreground">
              Relatório detalhado do período
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadHTML}>
              <Download className="w-4 h-4 mr-2" />
              Baixar HTML
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Summary Section */}
        <AuditSummary
          employee={employee}
          monthKey={monthKey}
          osList={osList}
          camadas={camadas}
          cfg={db.cfg}
        />

        {/* Tabs for Charts and Tables */}
        <Tabs defaultValue="charts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md print:hidden">
            <TabsTrigger value="charts" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Gráficos
            </TabsTrigger>
            <TabsTrigger value="layers" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Camadas
            </TabsTrigger>
            <TabsTrigger value="os" className="flex items-center gap-2">
              <Table className="w-4 h-4" />
              Ordens de Serviço
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg">Média por Critério de Qualidade</CardTitle>
                  <CardDescription>
                    Comparação entre a média obtida e o máximo de cada critério
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CriteriaAverageChart osList={osList} />
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg">Distribuição por Dificuldade</CardTitle>
                  <CardDescription>
                    Quantidade de OS por nível de dificuldade
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DifficultyPieChart osList={osList} cfg={db.cfg} />
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">Evolução do CE Qualidade</CardTitle>
                <CardDescription>
                  Acumulado de CE Final e CE Qualidade ao longo do mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CEQEvolutionChart osList={osList} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="layers" className="mt-6 space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">Bônus por Camada</CardTitle>
                <CardDescription>
                  Distribuição do bônus entre Esforço, Qualidade e Superação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BonusLayersChart camadas={camadas} />
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">Fórmula de Cálculo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/30 font-mono text-sm">
                  <p className="text-muted-foreground mb-2">// Camada 1: Esforço</p>
                  <p>bonusEsforço = TETO × 0.50 × taxaPrazo</p>
                  <p className="text-muted-foreground">// taxaPrazo = OS dentro do prazo / Total OS</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/30 font-mono text-sm">
                  <p className="text-muted-foreground mb-2">// Camada 2: Qualidade</p>
                  <p>bonusQualidade = TETO × 0.40 × (médiaPontuação / maxPts)</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/30 font-mono text-sm">
                  <p className="text-muted-foreground mb-2">// Camada 3: Superação</p>
                  <p>SE ceQTotal {'>'} médiaEquipe × 1.1:</p>
                  <p className="ml-4">bonusSuperação = TETO × 0.10 × fatorSuperação</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 font-mono text-sm">
                  <p className="text-primary mb-2">// Bônus Final</p>
                  <p>bonusTotal = (bonusEsforço + bonusQualidade + bonusSuperação) × fatorHoras</p>
                  <p className="text-muted-foreground">// fatorHoras = min(1, horasTrabalhadas / horasEsperadas)</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="os" className="mt-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">Ordens de Serviço Executadas</CardTitle>
                <CardDescription>
                  Lista completa de OS do colaborador no período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuditOSTable osList={osList} cfg={db.cfg} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="pt-8 border-t border-border/50 text-center text-sm text-muted-foreground print:mt-8">
          <p>
            Gerado em: {new Date().toLocaleString("pt-BR")}
          </p>
          <p className="mt-1">
            G2R • Bonificação — Dev. Gabriel Roberti
          </p>
        </footer>
      </main>
    </div>
  );
}

export function openAuditWindow(
  db: Database,
  monthKey: string,
  employeeId: string
): void {
  const employee = db.employees.find((e) => e.id === employeeId);
  if (!employee) {
    alert("Colaborador não encontrado.");
    return;
  }

  const allMonthOS = getMonthOS(db, monthKey);
  const osList = allMonthOS.filter((os) => os.employeeId === employeeId);
  const camadas = calcBonusCamadas(db.cfg, db, monthKey, employeeId, osList);

  // Open new window
  const win = window.open("", "_blank", "width=1200,height=900");
  if (!win) {
    alert("Não foi possível abrir a janela de auditoria. Verifique se pop-ups estão bloqueados.");
    return;
  }

  // Copy styles from main document
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join("\n");

  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR" class="dark">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Auditoria de Bônus - ${employee.name} - ${monthKey}</title>
        ${styles}
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print\\:hidden { display: none !important; }
            .print\\:mt-8 { margin-top: 2rem !important; }
          }
        </style>
      </head>
      <body>
        <div id="audit-root"></div>
      </body>
    </html>
  `);
  win.document.close();

  // Wait for document to be ready and render React
  setTimeout(() => {
    const root = win.document.getElementById("audit-root");
    if (root) {
      createRoot(root).render(
        <AuditContent
          db={db}
          monthKey={monthKey}
          employee={employee}
          osList={osList}
          camadas={camadas}
        />
      );
    }
  }, 100);
}
