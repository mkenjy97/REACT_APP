import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Expense, Income, Budget, UserSettings } from '@/types/budget.types';
import i18n from '@/i18n/config';

interface ExportParams {
  expenses: Expense[];
  incomes: Income[];
  budget: Budget;
  settings: UserSettings | null;
  reportType: 'month' | 'year' | 'week';
  targetKey: string; // "2023-10", "2023", "2023-W42"
}

function getWeekKey(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export const ExportService = {
  generateReport: async ({ expenses, incomes, budget, settings, reportType, targetKey }: ExportParams) => {
    // 1. Filter Data
    let periodExpenses: Expense[] = [];
    let periodIncomes: Income[] = [];

    if (reportType === 'month' || reportType === 'year') {
      periodExpenses = expenses.filter(e => e.date.startsWith(targetKey));
      periodIncomes = incomes.filter(i => i.date.startsWith(targetKey));
    } else if (reportType === 'week') {
      periodExpenses = expenses.filter(e => getWeekKey(new Date(e.date)) === targetKey);
      periodIncomes = incomes.filter(i => getWeekKey(new Date(i.date)) === targetKey);
    }

    // Spese fisse limitate al periodo selezionato
    const fixedTemplates = periodExpenses.filter(e => e.isFixed);
    
    const totalIncome = periodIncomes.reduce((acc, curr) => acc + curr.amount, 0);
    const totalSpent = periodExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalFixedTemplates = fixedTemplates.reduce((acc, curr) => acc + curr.amount, 0);
    
    const netSavings = totalIncome - totalSpent;
    const monthlyBudgetLimit = budget.monthlyLimit || 0;
    
    let budgetLimit = monthlyBudgetLimit;
    if (reportType === 'year') budgetLimit = monthlyBudgetLimit * 12;
    if (reportType === 'week') budgetLimit = budget.weeklyLimit || (monthlyBudgetLimit / 4);

    const budgetPercentage = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;
    const currency = settings?.currency || '€';

    // 2. Setup PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(22);
    doc.text(i18n.t('export_report.title'), pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    let periodLabel = targetKey;
    if (reportType === 'month') periodLabel = i18n.t('export_report.period_month', { period: targetKey });
    if (reportType === 'year') periodLabel = i18n.t('export_report.period_year', { period: targetKey });
    if (reportType === 'week') periodLabel = i18n.t('export_report.period_week', { period: targetKey });
    
    doc.text(i18n.t('export_report.period', { period: periodLabel }), pageWidth / 2, 28, { align: 'center' });

    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(i18n.t('export_report.financial_summary'), 14, 45);

    autoTable(doc, {
      startY: 50,
      head: [[i18n.t('export_report.item'), i18n.t('export_report.amount')]],
      body: [
        [i18n.t('export_report.total_income'), `${currency} ${totalIncome.toFixed(2)}`],
        [i18n.t('export_report.total_expenses'), `${currency} ${totalSpent.toFixed(2)}`],
        [i18n.t('export_report.total_fixed'), `${currency} ${totalFixedTemplates.toFixed(2)}`],
        [i18n.t('export_report.net_savings'), `${currency} ${netSavings.toFixed(2)}`],
        [i18n.t('export_report.budget_used'), `${budgetPercentage.toFixed(1)}% (${i18n.t('export_report.out_of')} ${currency} ${budgetLimit.toFixed(2)})`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] },
    });

    // Time-based Grouping
    if (reportType === 'month' || reportType === 'year') {
      const timeGroupTotals: Record<string, number> = {};
      
      periodExpenses.forEach(e => {
        let groupKey = '';
        if (reportType === 'month') {
          groupKey = getWeekKey(new Date(e.date));
        } else if (reportType === 'year') {
          groupKey = e.date.substring(0, 7);
        }
        timeGroupTotals[groupKey] = (timeGroupTotals[groupKey] || 0) + e.amount;
      });

      const timeGroupData = Object.entries(timeGroupTotals)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([group, amount]) => [group, `${currency} ${amount.toFixed(2)}`]);

      doc.setFontSize(14);
      doc.text(reportType === 'month' ? i18n.t('export_report.expenses_by_week') : i18n.t('export_report.expenses_by_month'), 14, (doc as any).lastAutoTable.finalY + 15);
      
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [[reportType === 'month' ? i18n.t('export_report.week') : i18n.t('export_report.month'), i18n.t('export_report.total_spent')]],
        body: timeGroupData.length > 0 ? timeGroupData : [[i18n.t('export_report.no_data'), '-']],
        theme: 'striped',
      });
    }

    // Group expenses by category
    const categoryTotals: Record<string, number> = {};
    periodExpenses.forEach(e => {
      const cat = i18n.t(`spendless.categories.${e.category}`) || e.category;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
    });

    const categoryData = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => [cat, `${currency} ${amount.toFixed(2)}`]);

    doc.setFontSize(14);
    doc.text(i18n.t('export_report.details_by_category'), 14, (doc as any).lastAutoTable.finalY + 15);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [[i18n.t('export_report.category'), i18n.t('export_report.total_spent')]],
      body: categoryData.length > 0 ? categoryData : [[i18n.t('export_report.no_expenses'), '-']],
      theme: 'striped',
    });

    // Fixed Expenses
    doc.setFontSize(14);
    doc.text(i18n.t('export_report.fixed_expenses'), 14, (doc as any).lastAutoTable.finalY + 15);
    
    const fixedData = fixedTemplates.map(f => [
      f.description || f.category, 
      `${currency} ${f.amount.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [[i18n.t('export_report.description'), i18n.t('export_report.monthly_amount')]],
      body: fixedData.length > 0 ? fixedData : [[i18n.t('export_report.no_fixed'), '-']],
      theme: 'plain',
    });

    // 3. AI DATA BLOCK
    const aiDataBlock = `
--- BEGIN AI ANALYSIS DATA ---
Context: Currency ${currency}, Period: ${targetKey} (${reportType}), Budget: ${budgetLimit}, Language: ${i18n.language}.
L'utente ha un budget impostato di ${budgetLimit} ${currency}, ha queste spese fisse e vive in una regione con lingua ${i18n.language}.
Questo blocco è ottimizzato per l'analisi tramite IA. Analizza queste spese e suggerisci dove posso risparmiare:

Trend_Temporali: 
- Totale Corrente (${targetKey}): ${totalSpent.toFixed(2)}

Fixed_Expenses: [${fixedTemplates.map(f => `[FIXED] ${f.description || f.category}: ${f.amount}`).join(', ')}]

Daily_Expenses_CSV:
Date, Tag, Category, Amount, Desc
${periodExpenses.map(e => `${e.date}, [VARIABLE], ${e.category}, ${e.amount.toFixed(2)}, ${e.description.replace(/,/g, ' ')}`).join('\n')}
--- END AI ANALYSIS DATA ---`;

    doc.addPage();
    doc.setFontSize(10);
    doc.setTextColor(50);
    const splitAiText = doc.splitTextToSize(aiDataBlock, pageWidth - 20);
    doc.text(splitAiText, 10, 20);

    // 4. Save PDF
    doc.save(`SpendLess_Report_${targetKey}.pdf`);
  }
};
