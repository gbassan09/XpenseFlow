import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Settings, 
  Bell, 
  Search,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  Building2,
  BarChart3,
  Shield,
  Loader2,
  LogOut,
  Download,
  FileSpreadsheet,
  FileUp,
  AlertTriangle,
  Eye,
  AlertCircle,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminData } from "@/hooks/useAdminData";
import { useInvoices, Invoice } from "@/hooks/useInvoices";
import { useReportGeneration } from "@/hooks/useReportGeneration";
import { useAdminStatements } from "@/hooks/useAdminStatements";
import { useReconciliation, GlobalReconciliationReport } from "@/hooks/useReconciliation";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserHistoryModal } from "@/components/admin/UserHistoryModal";
import { ReconciliationAlerts } from "@/components/admin/ReconciliationAlerts";
import FinancialDashboard from "@/components/admin/FinancialDashboard";

const Admin = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [globalReport, setGlobalReport] = useState<GlobalReconciliationReport | null>(null);
  
  const { isAdmin, isLoading: authLoading, signOut, profile } = useAuth();
  const { users, stats, isLoading: adminLoading, toggleUserRole } = useAdminData();
  const { invoices, isLoading: invoicesLoading, updateInvoiceStatus, refetch } = useInvoices("pending");
  const { isGenerating, downloadReportAsPDF, downloadReportAsCSV } = useReportGeneration();
  const { statements, isLoading: statementsLoading } = useAdminStatements();
  const { generateGlobalReport, isLoading: reconciliationLoading } = useReconciliation();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load global reconciliation report when viewing dashboard
  useEffect(() => {
    if (activeSection === "dashboard" && isAdmin && !globalReport) {
      generateGlobalReport().then(setGlobalReport);
    }
  }, [activeSection, isAdmin, globalReport, generateGlobalReport]);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, authLoading, navigate]);

  const handleApprove = async (invoiceId: string) => {
    const { error } = await updateInvoiceStatus(invoiceId, "approved");
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a fatura.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Fatura aprovada com sucesso.",
      });
      refetch();
    }
  };

  const handleReject = async (invoiceId: string) => {
    if (!rejectionReason) {
      toast({
        title: "Erro",
        description: "Informe o motivo da rejeição.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await updateInvoiceStatus(invoiceId, "rejected", rejectionReason);
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a fatura.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Fatura rejeitada",
        description: "A fatura foi rejeitada.",
      });
      setRejectingId(null);
      setRejectionReason("");
      refetch();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "users", label: "Usuários", icon: Users },
    { id: "expenses", label: "Aprovações", icon: FileText },
    { id: "statements", label: "Faturas PDF", icon: FileUp },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  const alertsCount = globalReport?.totalAlerts || 0;
  const criticalAlertsCount = globalReport?.criticalAlerts || 0;

  const statCards = [
    { label: "Usuários Ativos", value: stats.totalUsers.toString(), icon: Users, trend: "+12%", color: "from-blue-500 to-cyan-500" },
    { label: "Despesas Pendentes", value: stats.pendingInvoices.toString(), icon: Clock, trend: "-8%", color: "from-amber-500 to-orange-500" },
    { label: "Total Aprovado", value: formatCurrency(stats.approvedTotal), icon: CheckCircle2, trend: "+23%", color: "from-emerald-500 to-green-500" },
    { label: "Alertas", value: alertsCount.toString(), icon: AlertCircle, trend: criticalAlertsCount > 0 ? `${criticalAlertsCount} críticos` : "", color: criticalAlertsCount > 0 ? "from-red-500 to-pink-500" : "from-amber-500 to-orange-500" },
  ];

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const handleMenuSelect = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - desktop always visible, mobile as drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 glass-card-strong rounded-none border-r border-white/10 p-4
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white">Admin Panel</h1>
              <p className="text-xs text-white/50">XpenseFlow</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-white/10 text-white/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuSelect(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                activeSection === item.id
                  ? "bg-primary/20 text-primary"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-white/70 hover:bg-white/5 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl glass-card hover:bg-white/10 transition-colors"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
            <div>
            <h1 className="text-2xl font-bold text-white">
              {activeSection === "dashboard" && "Dashboard Administrativo"}
              {activeSection === "users" && "Gerenciar Usuários"}
              {activeSection === "expenses" && "Aprovações Pendentes"}
              {activeSection === "statements" && "Faturas PDF"}
              {activeSection === "settings" && "Configurações"}
            </h1>
            <p className="text-white/60">Bem-vindo, {profile?.full_name || "Administrador"}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                placeholder="Buscar..."
                className="glass-input pl-10 pr-4 py-2 w-64"
              />
            </div>
            <button className="relative p-2 glass-card rounded-xl hover:bg-white/10 transition-colors">
              <Bell className="w-5 h-5 text-white" />
              {stats.pendingInvoices > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-xs flex items-center justify-center text-white">
                  {stats.pendingInvoices}
                </span>
              )}
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
              {profile?.full_name?.charAt(0) || "A"}
            </div>
          </div>
        </header>

        {/* Dashboard View */}
        {activeSection === "dashboard" && <FinancialDashboard />}

        {/* Users View */}
        {activeSection === "users" && (
          <div className="glass-card">
            <h2 className="text-lg font-semibold text-white mb-4">Usuários Cadastrados</h2>
            <div className="space-y-3">
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-white/30 mb-4" />
                  <p className="text-white/60">Nenhum usuário cadastrado</p>
                </div>
              ) : (
                users.map((user) => {
                  const userAlerts = globalReport?.users.find((u) => u.userId === user.user_id)?.alerts || [];
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-white font-medium">
                          {user.full_name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.full_name || "Usuário"}</p>
                          <p className="text-white/50 text-sm">{user.department || "Sem departamento"}</p>
                          {userAlerts.length > 0 && (
                            <ReconciliationAlerts alerts={userAlerts} compact />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                          {user.roles.map((role) => (
                            <span
                              key={role}
                              className={`px-2 py-1 rounded-full text-xs ${
                                role === "admin" ? "bg-primary/20 text-primary" : "bg-white/10 text-white/60"
                              }`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUserId(user.user_id);
                              setSelectedUserName(user.full_name || "Usuário");
                            }}
                            className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors text-primary"
                            title="Ver histórico completo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => downloadReportAsPDF(user.user_id)}
                            disabled={isGenerating}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white disabled:opacity-50"
                            title="Baixar PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => downloadReportAsCSV(user.user_id)}
                            disabled={isGenerating}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white disabled:opacity-50"
                            title="Exportar para Google Sheets (CSV)"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>
                          {!user.roles.includes("admin") && (
                            <button
                              onClick={() => toggleUserRole(user.user_id, "admin", "add")}
                              className="text-xs text-primary hover:underline ml-2"
                            >
                              Tornar Admin
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Expenses/Approvals View */}
        {activeSection === "expenses" && (
          <div className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Aprovações Pendentes</h2>
              <span className="px-3 py-1 rounded-full bg-warning/20 text-warning text-sm">
                {invoices.length} pendentes
              </span>
            </div>

            {invoicesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="mx-auto h-12 w-12 text-success/50 mb-4" />
                <p className="text-white/60">Nenhuma aprovação pendente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-white font-medium">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{invoice.supplier}</p>
                          <p className="text-white/50 text-sm">
                            {invoice.description || invoice.category}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-white font-semibold text-lg">
                          {formatCurrency(invoice.total_value)}
                        </span>
                        <p className="text-white/40 text-xs">
                          {invoice.invoice_date
                            ? format(new Date(invoice.invoice_date), "dd/MM/yyyy", { locale: ptBR })
                            : "-"}
                        </p>
                      </div>
                    </div>

                    {rejectingId === invoice.id ? (
                      <div className="mt-3 space-y-2">
                        <input
                          type="text"
                          placeholder="Motivo da rejeição..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="glass-input w-full text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(invoice.id)}
                            className="flex-1 py-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors text-sm"
                          >
                            Confirmar Rejeição
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(null);
                              setRejectionReason("");
                            }}
                            className="px-4 py-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleApprove(invoice.id)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Aprovar
                        </button>
                        <button
                          onClick={() => setRejectingId(invoice.id)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PDF Statements View */}
        {activeSection === "statements" && (
          <div className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Faturas PDF dos Usuários</h2>
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm">
                {statements.length} faturas
              </span>
            </div>

            {statementsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : statements.length === 0 ? (
              <div className="text-center py-12">
                <FileUp className="mx-auto h-12 w-12 text-white/30 mb-4" />
                <p className="text-white/60">Nenhuma fatura PDF cadastrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {statements.map((stmt) => (
                  <div
                    key={stmt.id}
                    className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-white font-medium">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            Fatura {stmt.period_month}/{stmt.period_year}
                          </p>
                          <p className="text-white/50 text-sm">
                            {stmt.user_name} {stmt.user_department && `- ${stmt.user_department}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-white font-semibold text-lg">
                          {formatCurrency(stmt.total_value)}
                        </span>
                        <p className="text-white/40 text-xs">
                          {format(new Date(stmt.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-white/60">
                          Total calculado: <span className="text-white">{formatCurrency(stmt.calculated_total)}</span>
                        </span>
                        {stmt.status === "divergente" && (
                          <span className="flex items-center gap-1 text-destructive">
                            <AlertTriangle className="w-4 h-4" />
                            Diferença: {formatCurrency(Math.abs(stmt.difference))}
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          stmt.status === "batida"
                            ? "bg-success/20 text-success"
                            : stmt.status === "divergente"
                            ? "bg-destructive/20 text-destructive"
                            : "bg-warning/20 text-warning"
                        }`}
                      >
                        {stmt.status === "batida" ? "Batida" : stmt.status === "divergente" ? "Divergente" : "Em Análise"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings View */}
        {activeSection === "settings" && (
          <div className="glass-card">
            <h2 className="text-lg font-semibold text-white mb-4">Configurações</h2>
            <p className="text-white/60">Configurações do sistema em desenvolvimento...</p>
          </div>
        )}

        {/* User History Modal */}
        {selectedUserId && (
          <UserHistoryModal
            userId={selectedUserId}
            userName={selectedUserName}
            onClose={() => {
              setSelectedUserId(null);
              setSelectedUserName("");
            }}
          />
        )}
      </main>
    </div>
  );
};

export default Admin;
