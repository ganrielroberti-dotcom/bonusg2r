import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence } from "framer-motion";
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
import { Badge } from "@/components/ui/badge";
import { 
  Printer, 
  Download, 
  FileText, 
  BarChart3, 
  Table, 
  FileSpreadsheet, 
  Calendar, 
  Loader2,
  Sparkles,
  Shield,
  TrendingUp,
  Award
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("charts");
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
      
      buttons.forEach(btn => (btn as HTMLElement).style.display = '');
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = 190;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = 277;
      
      let position = 10;
      let heightLeft = pdfHeight;
      
      pdf.addImage(imgData, "PNG", 10, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`auditoria_${employee.name.replace(/\s+/g, "_")}_${monthKey}.pdf`);
      toast.success("PDF exportado com sucesso!");
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
      const clone = contentRef.current.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('.no-print').forEach(el => el.remove());
      
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
      toast.success("HTML exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar HTML:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const bonusPercentOfCap = camadas.teto > 0 ? (camadas.bonusTotal / camadas.teto) * 100 : 0;

  return (
    <div ref={contentRef} className="min-h-screen bg-background text-foreground">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 no-print">
        <div className="absolute inset-0 bg-background/60 backdrop-blur-xl border-b border-border/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                    <span className="text-primary">G2R</span>
                    <span className="text-muted-foreground mx-2">•</span>
                    Auditoria de Bônus
                  </h1>
                  <Badge className="bg-gradient-to-r from-primary/20 to-success/20 text-primary border border-primary/20 text-[10px]">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Relatório detalhado com transparência total
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/30">
                <Calendar className="w-4 h-4 text-primary" />
                <Select value={monthKey} onValueChange={setMonthKey}>
                  <SelectTrigger className="w-[140px] sm:w-[160px] h-8 text-xs sm:text-sm bg-transparent border-0 p-0 focus:ring-0">
                    <SelectValue placeholder="Selecione" />
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
              
              <div className="flex gap-1.5 sm:gap-2">
                <Button 
                  size="sm" 
                  onClick={handleDownloadPDF}
                  disabled={isExporting}
                  className="h-8 gap-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
                >
                  {isExporting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">PDF</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 gap-1.5 text-xs">
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Imprimir</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadHTML} className="h-8 gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">HTML</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Print Header */}
      <div className="hidden print:block px-6 py-6 border-b border-border/30">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">
              <span className="text-primary">G2R</span> • Auditoria de Bônus
            </h1>
            <p className="text-muted-foreground">
              {employee.name} | {employee.role} | Período: {monthKey}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Summary Section */}
        <AuditSummary
          employee={employee}
          monthKey={monthKey}
          osList={osList}
          camadas={camadas}
          cfg={db.cfg}
        />

        {/* Premium Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="no-print">
            <TabsList className="inline-flex h-auto p-1 bg-secondary/30 border border-border/30 rounded-xl">
              <TabsTrigger 
                value="charts" 
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Gráficos</span>
              </TabsTrigger>
              <TabsTrigger 
                value="layers" 
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Camadas</span>
              </TabsTrigger>
              <TabsTrigger 
                value="os" 
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                <Table className="w-4 h-4" />
                <span>Ordens de Serviço</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <AnimatePresence mode="wait">
            <TabsContent value="charts" className="mt-6 space-y-6 print:block" asChild>
              <motion.div
                key="charts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <PremiumCard
                    icon={<BarChart3 className="w-5 h-5" />}
                    title="Média por Critério de Qualidade"
                    description="Comparação entre a média obtida e o máximo de cada critério"
                  >
                    <CriteriaAverageChart osList={osList} />
                  </PremiumCard>

                  <PremiumCard
                    icon={<Award className="w-5 h-5" />}
                    title="Distribuição por Dificuldade"
                    description="Quantidade de OS por nível de dificuldade"
                  >
                    <DifficultyPieChart osList={osList} cfg={db.cfg} />
                  </PremiumCard>
                </div>

                <PremiumCard
                  icon={<TrendingUp className="w-5 h-5" />}
                  title="Evolução do CE Qualidade"
                  description="Acumulado de CE Final e CE Qualidade ao longo do mês"
                >
                  <CEQEvolutionChart osList={osList} />
                </PremiumCard>
              </motion.div>
            </TabsContent>

            <TabsContent value="layers" className="mt-6 space-y-6 print:block" asChild>
              <motion.div
                key="layers"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <PremiumCard
                  icon={<BarChart3 className="w-5 h-5" />}
                  title="Bônus por Camada"
                  description="Distribuição visual do bônus entre Esforço, Qualidade e Superação"
                >
                  <BonusLayersChart camadas={camadas} />
                </PremiumCard>

                <PremiumCard
                  icon={<FileSpreadsheet className="w-5 h-5" />}
                  title="Fórmula de Cálculo"
                  description="Transparência total no método de cálculo do bônus"
                >
                  <div className="space-y-3">
                    <FormulaBlock
                      title="Camada 1: Esforço"
                      formula="bonusEsforço = TETO × 0.50 × taxaPrazo"
                      hint="taxaPrazo = OS dentro do prazo / Total OS"
                      color="text-success"
                    />
                    <FormulaBlock
                      title="Camada 2: Qualidade"
                      formula="bonusQualidade = TETO × 0.40 × (médiaPontuação / maxPts)"
                      color="text-primary"
                    />
                    <FormulaBlock
                      title="Camada 3: Superação"
                      formula={`SE ceQTotal > médiaEquipe × 1.1: bonusSuperação = TETO × 0.10 × fatorSuperação`}
                      color="text-warning"
                    />
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-primary text-sm">Bônus Final</span>
                      </div>
                      <code className="text-xs sm:text-sm font-mono text-foreground">
                        bonusTotal = (bonusEsforço + bonusQualidade + bonusSuperação) × fatorHoras
                      </code>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                        fatorHoras = min(1, horasTrabalhadas / horasEsperadas)
                      </p>
                    </div>
                  </div>
                </PremiumCard>
              </motion.div>
            </TabsContent>

            <TabsContent value="os" className="mt-6 print:block" asChild>
              <motion.div
                key="os"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <PremiumCard
                  icon={<Table className="w-5 h-5" />}
                  title="Ordens de Serviço Executadas"
                  description={`Lista completa de ${osList.length} OS do colaborador no período selecionado (${monthKey})`}
                >
                  <AuditOSTable osList={osList} cfg={db.cfg} />
                </PremiumCard>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>

        {/* Premium Footer */}
        <footer className="pt-6 sm:pt-8 border-t border-border/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/50">
                <Shield className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Relatório gerado em {new Date().toLocaleString("pt-BR")}
                </p>
                <p className="text-[10px] text-muted-foreground/60">
                  Período de referência: {monthKey}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary font-bold text-sm">G2R</span>
              <span className="text-muted-foreground text-xs">• Sistema de Bonificação</span>
              <Badge variant="outline" className="text-[10px] h-5">
                v2.0
              </Badge>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

// Premium Card Component
function PremiumCard({ 
  icon, 
  title, 
  description, 
  children 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-border/30 bg-gradient-to-br from-card/80 via-card/50 to-transparent backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-border/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-lg font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription className="text-xs sm:text-sm mt-0.5">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 sm:pt-6">
        {children}
      </CardContent>
    </Card>
  );
}

// Formula Block Component
function FormulaBlock({ 
  title, 
  formula, 
  hint, 
  color 
}: { 
  title: string; 
  formula: string; 
  hint?: string;
  color: string;
}) {
  return (
    <div className="p-3 sm:p-4 rounded-xl bg-secondary/20 border border-border/20">
      <p className={`text-xs font-semibold ${color} mb-2`}>{title}</p>
      <code className="text-xs sm:text-sm font-mono text-foreground/90 block">
        {formula}
      </code>
      {hint && (
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">// {hint}</p>
      )}
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

  const win = window.open("", "_blank", "width=1200,height=900");
  if (!win) {
    toast.error("Não foi possível abrir a janela de auditoria. Verifique se pop-ups estão bloqueados.");
    return;
  }

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
