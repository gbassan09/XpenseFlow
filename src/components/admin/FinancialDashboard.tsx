import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  AlertTriangle,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { useFinancialAnalytics } from "@/hooks/useFinancialAnalytics";
import { Loader2 } from "lucide-react";

const COLORS = [
  "hsl(234, 89%, 74%)",
  "hsl(270, 60%, 60%)",
  "hsl(142, 76%, 45%)",
  "hsl(45, 93%, 55%)",
  "hsl(0, 84%, 60%)",
  "hsl(200, 70%, 55%)",
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatCurrencyShort = (value: number) => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
  return formatCurrency(value);
};

const CATEGORY_LABELS: Record<string, string> = {
  transporte: "Transporte",
  alimentacao: "Alimentação",
  hospedagem: "Hospedagem",
  suprimentos: "Suprimentos",
  tecnologia: "Tecnologia",
  outros: "Outros",
};

const FinancialDashboard = () => {
  const {
    isLoading,
    monthlyData,
    categoryData,
    kpis,
    expenseItems,
    quarterReport,
    annualReport,
    costAlerts,
    periodFilter,
    setPeriodFilter,
  } = useFinancialAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  const TrendIcon = kpis.variation > 0 ? TrendingUp : kpis.variation < 0 ? TrendingDown : Minus;
  const trendColor = kpis.variation > 0 ? "text-destructive" : kpis.variation < 0 ? "text-success" : "text-muted-foreground";

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total do Mês"
          value={formatCurrency(kpis.totalMonth)}
          icon={<DollarSign className="w-5 h-5" />}
          gradient="from-primary to-accent"
          footer={
            <span className={`flex items-center gap-1 text-xs ${trendColor}`}>
              <TrendIcon className="w-3 h-3" />
              {Math.abs(kpis.variation).toFixed(1)}% vs mês anterior
            </span>
          }
        />
        <KPICard
          label="Total do Ano"
          value={formatCurrency(kpis.totalYear)}
          icon={<Calendar className="w-5 h-5" />}
          gradient="from-emerald-500 to-green-600"
        />
        <KPICard
          label="Média Mensal"
          value={formatCurrency(kpis.monthlyAvg)}
          icon={<BarChart3 className="w-5 h-5" />}
          gradient="from-amber-500 to-orange-500"
        />
        <KPICard
          label="Variação Mensal"
          value={`${kpis.variation >= 0 ? "+" : ""}${kpis.variation.toFixed(1)}%`}
          icon={<TrendIcon className="w-5 h-5" />}
          gradient={kpis.variation > 0 ? "from-red-500 to-pink-500" : "from-emerald-500 to-teal-500"}
          footer={
            <span className="text-xs text-white/60">
              Mês anterior: {formatCurrency(kpis.totalLastMonth)}
            </span>
          }
        />
      </div>

      {/* Period Filter */}
      <div className="flex gap-2">
        {([
          ["6m", "6 Meses"],
          ["12m", "12 Meses"],
          ["ytd", "Ano Atual"],
          ["all", "Tudo"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPeriodFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              periodFilter === key
                ? "bg-primary/20 text-primary"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Bar Chart */}
        <div className="glass-card lg:col-span-2">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Gastos por Mês
          </h3>
          {monthlyData.length === 0 ? (
            <p className="text-white/50 text-sm py-8 text-center">Sem dados disponíveis</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickFormatter={formatCurrencyShort} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(234, 30%, 20%)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Total"]}
                />
                <Bar dataKey="total" fill="hsl(234, 89%, 74%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Pie Chart */}
        <div className="glass-card">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-accent" />
            Categorias
          </h3>
          {categoryData.length === 0 ? (
            <p className="text-white/50 text-sm py-8 text-center">Sem dados</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPie>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="total"
                    nameKey="label"
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(234, 30%, 20%)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {categoryData.map((cat, i) => (
                  <div key={cat.category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-white/70">{cat.label}</span>
                    </div>
                    <span className="text-white font-medium">{cat.percentage.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reports Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 3-Month Report */}
        <div className="glass-card">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />
            Relatório Últimos 3 Meses
          </h3>
          <div className="space-y-3">
            {quarterReport.months.map((m) => (
              <div key={m.month} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <span className="text-white/70 text-sm">{m.month}</span>
                <div className="text-right">
                  <span className="text-white font-semibold">{formatCurrency(m.total)}</span>
                  <p className="text-white/40 text-xs">{m.count} despesas</p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              {quarterReport.trend === "up" && (
                <>
                  <ArrowUpRight className="w-4 h-4 text-destructive" />
                  <span className="text-destructive text-sm">Tendência de aumento</span>
                </>
              )}
              {quarterReport.trend === "down" && (
                <>
                  <ArrowDownRight className="w-4 h-4 text-success" />
                  <span className="text-success text-sm">Tendência de redução</span>
                </>
              )}
              {quarterReport.trend === "stable" && (
                <>
                  <Minus className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground text-sm">Gastos estáveis</span>
                </>
              )}
            </div>
            {quarterReport.topCategories.length > 0 && (
              <div className="pt-2">
                <p className="text-white/50 text-xs mb-2">Top categorias:</p>
                {quarterReport.topCategories.map((cat, i) => (
                  <div key={cat.category} className="flex items-center justify-between text-xs py-1">
                    <span className="text-white/60">{i + 1}. {cat.label}</span>
                    <span className="text-white">{formatCurrency(cat.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Annual Report */}
        <div className="glass-card">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Relatório Anual {new Date().getFullYear()}
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <p className="text-white font-bold text-lg">{formatCurrency(annualReport.totalYear)}</p>
              <p className="text-white/50 text-xs">Total no ano</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <p className="text-white font-bold text-lg">{formatCurrency(annualReport.avg)}</p>
              <p className="text-white/50 text-xs">Média mensal</p>
            </div>
          </div>
          {annualReport.maxMonth && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/10">
                <span className="text-white/60 text-sm">Maior gasto</span>
                <span className="text-white text-sm font-medium">
                  {annualReport.maxMonth.month}: {formatCurrency(annualReport.maxMonth.total)}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-success/10">
                <span className="text-white/60 text-sm">Menor gasto</span>
                <span className="text-white text-sm font-medium">
                  {annualReport.minMonth?.month}: {formatCurrency(annualReport.minMonth?.total || 0)}
                </span>
              </div>
            </div>
          )}
          {annualReport.months.length > 1 && (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={annualReport.months}>
                  <Line type="monotone" dataKey="total" stroke="hsl(234, 89%, 74%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(234, 89%, 74%)" }} />
                  <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(234, 30%, 20%)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Total"]}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Cost Alerts */}
      {costAlerts.length > 0 && (
        <div className="glass-card">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-warning" />
            Análise de Otimização de Custos
          </h3>
          <div className="space-y-3">
            {costAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-xl flex items-start gap-3 ${
                  alert.severity === "error"
                    ? "bg-destructive/10 border border-destructive/20"
                    : alert.severity === "warning"
                    ? "bg-warning/10 border border-warning/20"
                    : "bg-primary/10 border border-primary/20"
                }`}
              >
                <div className={`mt-0.5 ${
                  alert.severity === "error"
                    ? "text-destructive"
                    : alert.severity === "warning"
                    ? "text-warning"
                    : "text-primary"
                }`}>
                  {alert.type === "optimization" ? (
                    <Lightbulb className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{alert.title}</p>
                  <p className="text-white/60 text-xs mt-0.5">{alert.description}</p>
                </div>
                {alert.value !== undefined && (
                  <span className="text-white/70 text-sm font-medium whitespace-nowrap">
                    {formatCurrency(alert.value)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense Items Table */}
      <div className="glass-card">
        <h3 className="text-white font-semibold mb-4">Itens Cadastrados</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 text-white/50 font-medium">Despesa</th>
                <th className="text-left py-2 text-white/50 font-medium hidden sm:table-cell">Categoria</th>
                <th className="text-left py-2 text-white/50 font-medium hidden md:table-cell">Usuário</th>
                <th className="text-left py-2 text-white/50 font-medium hidden sm:table-cell">Data</th>
                <th className="text-right py-2 text-white/50 font-medium">Valor</th>
                <th className="text-center py-2 text-white/50 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {expenseItems.slice(0, 20).map((item) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-2.5 text-white">{item.supplier}</td>
                  <td className="py-2.5 text-white/60 hidden sm:table-cell">{item.category}</td>
                  <td className="py-2.5 text-white/60 hidden md:table-cell">{item.user_name}</td>
                  <td className="py-2.5 text-white/60 hidden sm:table-cell">
                    {item.invoice_date
                      ? new Date(item.invoice_date).toLocaleDateString("pt-BR")
                      : "-"}
                  </td>
                  <td className="py-2.5 text-white text-right font-medium">{formatCurrency(item.total_value)}</td>
                  <td className="py-2.5 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                        item.status === "approved"
                          ? "status-approved"
                          : item.status === "rejected"
                          ? "status-rejected"
                          : "status-pending"
                      }`}
                    >
                      {item.status === "approved" ? "Aprovada" : item.status === "rejected" ? "Rejeitada" : "Pendente"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {expenseItems.length > 20 && (
            <p className="text-white/40 text-xs text-center mt-3">
              Mostrando 20 de {expenseItems.length} itens
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const KPICard = ({
  label,
  value,
  icon,
  gradient,
  footer,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  footer?: React.ReactNode;
}) => (
  <div className="glass-card">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-white/60 text-sm">{label}</p>
        <p className="text-2xl font-bold text-white mt-1 truncate">{value}</p>
        {footer && <div className="mt-1">{footer}</div>}
      </div>
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shrink-0`}>
        {icon}
      </div>
    </div>
  </div>
);

export default FinancialDashboard;
