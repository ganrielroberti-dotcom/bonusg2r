import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Database, Employee, OSRecord, BonusCamadas } from "@/types/bonus";
import { calcBonusCamadas, getMonthOS } from "@/lib/bonusCalculator";
import { formatBRL } from "@/lib/formatters";
import { toast } from "sonner";
import { AuditSummary } from "./AuditSummary";
import { CriteriaAverageChart, DifficultyPieChart, CEQEvolutionChart, BonusLayersChart } from "./AuditCharts";
import { AuditOSTable } from "./AuditOSTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Download, FileText, BarChart3, Table, FileSpreadsheet, Calendar, Loader2 } from "lucide-react";

interface AuditContentProps {
  db: Database;
  initialMonthKey: string;
  employee: Employee;
}

function generateMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  
  return options;
}

function AuditContent({ db, initialMonthKey, employee }: AuditContentProps) {
  const [monthKey, setMonthKey] = useState(initialMonthKey);
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const monthOptions = generateMonthOptions();

  // Recalculate data based on selected month
  const allMonthOS = getMonthOS(db, monthKey);
  const osList = allMonthOS.filter((os) => os.employeeId === employee.id);
  const camadas = calcBonusCamadas(db.cfg, db, monthKey, employee.id, osList);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    
    setIsExporting(true);
    
    try {
      // Hide buttons during capture
      const buttons = contentRef.current.querySelectorAll('.no-print');
      buttons.forEach(btn => (btn as HTMLElement).style.display = 'none');
      
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0a0a0f',
        windowWidth: contentRef.current.scrollWidth,
        windowHeight: contentRef.current.scrollHeight,
      });
      
      // Restore buttons
      buttons.forEach(btn => (btn as HTMLElement).style.display = '');
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = 190;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = 277;
      
      let position = 10;
      let heightLeft = pdfHeight;
      
      // First page
      pdf.addImage(imgData, "PNG", 10, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      
      // Additional pages if needed
      while (heightLeft > 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`auditoria_${employee.name.replace(/\s+/g, "_")}_${monthKey}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadHTML = async () => {
    if (!contentRef.current) return;
    
    setIsExporting(true);
    
    try {
      // Clone the content for export
      const clone = contentRef.current.cloneNode(true) as HTMLElement;
      
      // Remove buttons from clone
      clone.querySelectorAll('.no-print').forEach(el => el.remove());
      
      // Get all styles
      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map((el) => el.outerHTML)
        .join("\n");
      
      const html = `
<!DOCTYPE html>
<html lang="pt-BR" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Auditoria de Bônus - ${employee.name} - ${monthKey}</title>
    ${styles}
    <style>
      body { background: #0a0a0f; color: white; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
  </head>
  <body>
    ${clone.outerHTML}
  </body>
</html>`;
      
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `auditoria_${employee.name.replace(/\s+/g, "_")}_${monthKey}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao exportar HTML:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div ref={contentRef} className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50 no-print">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold">
              <span className="text-primary">G2R</span> • Auditoria de Bônus
            </h1>
            <p className="text-sm text-muted-foreground">
              Relatório detalhado do período
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {/* Month Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Select value={monthKey} onValueChange={setMonthKey}>
                <SelectTrigger className="w-[180px] bg-background/50">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleDownloadPDF}
                disabled={isExporting}
                className="gap-2"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadHTML}>
                <Download className="w-4 h-4 mr-2" />
                HTML
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Print Header - Only visible in print */}
      <div className="hidden print:block px-4 py-4 border-b border-border/50">
        <h1 className="text-xl font-bold">
          <span className="text-primary">G2R</span> • Auditoria de Bônus
        </h1>
        <p className="text-sm text-muted-foreground">
          Colaborador: {employee.name} | Período: {monthKey}
        </p>
      </div>

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
          <TabsList className="grid w-full grid-cols-3 max-w-md no-print">
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

          <TabsContent value="charts" className="mt-6 space-y-6 print:block">
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

          <TabsContent value="layers" className="mt-6 space-y-6 print:block">
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

          <TabsContent value="os" className="mt-6 print:block">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">Ordens de Serviço Executadas</CardTitle>
                <CardDescription>
                  Lista completa de OS do colaborador no período selecionado ({monthKey})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuditOSTable osList={osList} cfg={db.cfg} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
          <p>
            Gerado em: {new Date().toLocaleString("pt-BR")} | Período: {monthKey}
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
    toast.error("Colaborador não encontrado");
    return;
  }

  // Open new window
  const win = window.open("", "_blank", "width=1200,height=900");
  if (!win) {
    toast.error("Não foi possível abrir a janela de auditoria. Verifique se pop-ups estão bloqueados.");
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
          body { background: #0a0a0f; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .print\\:block { display: block !important; }
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
          initialMonthKey={monthKey}
          employee={employee}
        />
      );
    }
  }, 100);
}
