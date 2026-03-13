import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MonthlyData {
  month: string;
  monthNum: number;
  year: number;
  total: number;
  count: number;
}

export interface CategoryData {
  category: string;
  label: string;
  total: number;
  count: number;
  percentage: number;
}

export interface ExpenseItem {
  id: string;
  supplier: string;
  category: string;
  total_value: number;
  invoice_date: string | null;
  status: string;
  user_name: string | null;
  user_id: string;
}

export interface CostAlert {
  id: string;
  type: "spike" | "high_category" | "optimization";
  severity: "warning" | "error" | "info";
  title: string;
  description: string;
  value?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  transporte: "Transporte",
  alimentacao: "Alimentação",
  hospedagem: "Hospedagem",
  suprimentos: "Suprimentos",
  tecnologia: "Tecnologia",
  outros: "Outros",
};

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export const useFinancialAnalytics = () => {
  const { isAdmin, session } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<"6m" | "12m" | "ytd" | "all">("12m");

  useEffect(() => {
    if (!isAdmin || !session) return;

    const fetchData = async () => {
      setIsLoading(true);
      const [{ data: inv }, { data: prof }] = await Promise.all([
        supabase.from("invoices").select("*").order("invoice_date", { ascending: true }),
        supabase.from("profiles").select("user_id, full_name, department"),
      ]);
      setInvoices(inv || []);
      setProfiles(prof || []);
      setIsLoading(false);
    };

    fetchData();
  }, [isAdmin, session]);

  const profileMap = useMemo(() => {
    const map: Record<string, string> = {};
    profiles.forEach((p) => (map[p.user_id] = p.full_name || "Usuário"));
    return map;
  }, [profiles]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter invoices by period
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (!inv.invoice_date) return true;
      const d = new Date(inv.invoice_date);
      if (periodFilter === "6m") {
        const sixMonthsAgo = new Date(currentYear, currentMonth - 6, 1);
        return d >= sixMonthsAgo;
      }
      if (periodFilter === "12m") {
        const twelveMonthsAgo = new Date(currentYear, currentMonth - 12, 1);
        return d >= twelveMonthsAgo;
      }
      if (periodFilter === "ytd") {
        return d.getFullYear() === currentYear;
      }
      return true;
    });
  }, [invoices, periodFilter, currentMonth, currentYear]);

  // Monthly data
  const monthlyData = useMemo((): MonthlyData[] => {
    const map: Record<string, MonthlyData> = {};

    filteredInvoices.forEach((inv) => {
      const d = inv.invoice_date ? new Date(inv.invoice_date) : new Date(inv.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map[key]) {
        map[key] = {
          month: `${MONTH_NAMES[d.getMonth()]}/${d.getFullYear().toString().slice(-2)}`,
          monthNum: d.getMonth(),
          year: d.getFullYear(),
          total: 0,
          count: 0,
        };
      }
      map[key].total += inv.total_value;
      map[key].count += 1;
    });

    return Object.values(map).sort(
      (a, b) => a.year - b.year || a.monthNum - b.monthNum
    );
  }, [filteredInvoices]);

  // Category data
  const categoryData = useMemo((): CategoryData[] => {
    const map: Record<string, { total: number; count: number }> = {};
    let grandTotal = 0;

    filteredInvoices.forEach((inv) => {
      const cat = inv.category || "outros";
      if (!map[cat]) map[cat] = { total: 0, count: 0 };
      map[cat].total += inv.total_value;
      map[cat].count += 1;
      grandTotal += inv.total_value;
    });

    return Object.entries(map)
      .map(([category, data]) => ({
        category,
        label: CATEGORY_LABELS[category] || category,
        total: data.total,
        count: data.count,
        percentage: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredInvoices]);

  // KPI summary
  const kpis = useMemo(() => {
    const thisMonthInvoices = invoices.filter((inv) => {
      const d = inv.invoice_date ? new Date(inv.invoice_date) : new Date(inv.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const lastMonthInvoices = invoices.filter((inv) => {
      const d = inv.invoice_date ? new Date(inv.invoice_date) : new Date(inv.created_at);
      const lm = currentMonth === 0 ? 11 : currentMonth - 1;
      const ly = currentMonth === 0 ? currentYear - 1 : currentYear;
      return d.getMonth() === lm && d.getFullYear() === ly;
    });
    const yearInvoices = invoices.filter((inv) => {
      const d = inv.invoice_date ? new Date(inv.invoice_date) : new Date(inv.created_at);
      return d.getFullYear() === currentYear;
    });

    const totalMonth = thisMonthInvoices.reduce((s, i) => s + i.total_value, 0);
    const totalLastMonth = lastMonthInvoices.reduce((s, i) => s + i.total_value, 0);
    const totalYear = yearInvoices.reduce((s, i) => s + i.total_value, 0);

    const monthsWithData = new Set(
      yearInvoices.map((inv) => {
        const d = inv.invoice_date ? new Date(inv.invoice_date) : new Date(inv.created_at);
        return d.getMonth();
      })
    ).size;

    const monthlyAvg = monthsWithData > 0 ? totalYear / monthsWithData : 0;
    const variation = totalLastMonth > 0
      ? ((totalMonth - totalLastMonth) / totalLastMonth) * 100
      : totalMonth > 0 ? 100 : 0;

    return { totalMonth, totalLastMonth, totalYear, monthlyAvg, variation };
  }, [invoices, currentMonth, currentYear]);

  // Expense items list (current period)
  const expenseItems = useMemo((): ExpenseItem[] => {
    return filteredInvoices.map((inv) => ({
      id: inv.id,
      supplier: inv.supplier,
      category: CATEGORY_LABELS[inv.category] || inv.category,
      total_value: inv.total_value,
      invoice_date: inv.invoice_date,
      status: inv.status,
      user_name: profileMap[inv.user_id] || "Usuário",
      user_id: inv.user_id,
    }));
  }, [filteredInvoices, profileMap]);

  // 3-month trend report
  const quarterReport = useMemo(() => {
    const last3 = monthlyData.slice(-3);
    if (last3.length < 2) return { months: last3, trend: "stable" as const, topCategories: categoryData.slice(0, 3) };

    const first = last3[0]?.total || 0;
    const last = last3[last3.length - 1]?.total || 0;
    const trend = last > first * 1.1 ? ("up" as const) : last < first * 0.9 ? ("down" as const) : ("stable" as const);

    return { months: last3, trend, topCategories: categoryData.slice(0, 3) };
  }, [monthlyData, categoryData]);

  // Annual report
  const annualReport = useMemo(() => {
    const yearData = monthlyData.filter((m) => m.year === currentYear);
    const totalYear = yearData.reduce((s, m) => s + m.total, 0);
    const avg = yearData.length > 0 ? totalYear / yearData.length : 0;
    const maxMonth = yearData.reduce((max, m) => (m.total > max.total ? m : max), yearData[0] || { month: "-", total: 0 });
    const minMonth = yearData.reduce((min, m) => (m.total < min.total ? m : min), yearData[0] || { month: "-", total: 0 });

    return { totalYear, avg, maxMonth, minMonth, months: yearData };
  }, [monthlyData, currentYear]);

  // Cost alerts
  const costAlerts = useMemo((): CostAlert[] => {
    const alerts: CostAlert[] = [];

    // Category spike detection
    if (monthlyData.length >= 2) {
      const current = monthlyData[monthlyData.length - 1];
      const previous = monthlyData[monthlyData.length - 2];
      if (current && previous && previous.total > 0) {
        const growth = ((current.total - previous.total) / previous.total) * 100;
        if (growth > 30) {
          alerts.push({
            id: "monthly-spike",
            type: "spike",
            severity: growth > 50 ? "error" : "warning",
            title: `Aumento de ${growth.toFixed(0)}% nos gastos`,
            description: `Os gastos em ${current.month} foram ${growth.toFixed(0)}% maiores que ${previous.month}.`,
            value: current.total - previous.total,
          });
        }
      }
    }

    // High category alerts
    categoryData.forEach((cat) => {
      if (cat.percentage > 40) {
        alerts.push({
          id: `high-cat-${cat.category}`,
          type: "high_category",
          severity: "warning",
          title: `${cat.label} representa ${cat.percentage.toFixed(0)}% dos gastos`,
          description: `A categoria "${cat.label}" concentra a maior parte das despesas. Considere diversificar ou negociar.`,
          value: cat.total,
        });
      }
    });

    // Optimization suggestions
    if (categoryData.length > 0) {
      const top = categoryData[0];
      alerts.push({
        id: "optimization-top",
        type: "optimization",
        severity: "info",
        title: `Otimize gastos com ${top.label}`,
        description: `Maior categoria de gasto. Avalie contratos, fornecedores alternativos ou políticas de uso.`,
        value: top.total,
      });
    }

    return alerts;
  }, [monthlyData, categoryData]);

  return {
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
    profileMap,
  };
};
