import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { toast } from 'sonner';

import { PAGE_VARIANTS } from '@/constants/animations';
import { useBudgetStore, getMonthKey } from '@/store/useBudgetStore';
import { ExportService } from '@/services/ExportService';

export function ExportPage() {
  const { t } = useTranslation();
  const { expenses, incomes, budget, settings } = useBudgetStore();

  const [exportType, setExportType] = useState<'month' | 'year' | 'week'>('month');
  const [exportTarget, setExportTarget] = useState(getMonthKey());
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await ExportService.generateReport({
        expenses,
        incomes,
        budget,
        settings,
        reportType: exportType,
        targetKey: exportTarget,
      });
      toast.success(t('common.success') || 'Report esportato con successo');
    } catch {
      toast.error(t('auth.generic_error') || "Errore durante l'esportazione");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col gap-5 pb-24"
    >
      <div className="pt-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Icon name="Download" size={20} className="text-primary-400" />
          {t('profile.export_data')}
        </h1>
        <p className="text-sm text-text-muted mt-0.5">{t('profile.export_pdf')}</p>
      </div>

      <GlassCard className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted flex items-center gap-2 ml-1">
              <Icon name="Calendar" size={14} /> {t('profile.report_type')}
            </label>
            <select
              value={exportType}
              onChange={(e) => {
                const val = e.target.value as 'month' | 'year' | 'week';
                setExportType(val);
                if (val === 'year') setExportTarget(new Date().getFullYear().toString());
                else if (val === 'month') setExportTarget(getMonthKey());
                else setExportTarget(`${new Date().getFullYear()}-W01`);
              }}
              className="flex h-12 w-full rounded-full border border-glass-border bg-surface px-4 text-sm text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 shadow-sm"
            >
              <option value="month">{t('profile.report_month')}</option>
              <option value="year">{t('profile.report_year')}</option>
              <option value="week">{t('profile.report_week')}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted flex items-center gap-2 ml-1">
              <Icon name="Calendar" size={14} /> {t('profile.select_period')}
            </label>
            <input
              type={exportType === 'year' ? 'number' : exportType}
              value={exportTarget}
              onChange={(e) => setExportTarget(e.target.value)}
              min={exportType === 'year' ? 2000 : undefined}
              max={exportType === 'year' ? 2100 : undefined}
              className="flex h-12 w-full rounded-full border border-glass-border bg-surface px-4 py-2 text-sm text-text transition-colors placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 shadow-sm"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-glass-border mt-2">
          <Button size="sm" onClick={handleExport} disabled={isExporting || !exportTarget}>
            {isExporting ? (
              <Icon name="Info" size={15} className="animate-spin mr-1.5" />
            ) : (
              <Icon name="Download" size={15} className="mr-1.5" />
            )}
            {t('profile.export_pdf')}
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
