import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, MapPin, Loader2, Navigation } from 'lucide-react';
import { useBudgetStore } from '@/store/useBudgetStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { PAGE_VARIANTS, STAGGER_CONTAINER, STAGGER_ITEM } from '@/constants/animations';
import { DEFAULT_CATEGORIES } from '@/types/budget.types';
import { cn } from '@/components/ui/GlassCard';
import { Edit2, X as XIcon, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { expenseSchema, type ExpenseFormData } from '@/validation/budget.schema';
import { toast } from 'sonner';

type GeoLocation = { lat: number; lng: number; label?: string };

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'it' } }
    );
    const data = await res.json();
    const addr = data.address;
    return (
      addr?.road
        ? `${addr.road}${addr.house_number ? ` ${addr.house_number}` : ''}, ${addr.city || addr.town || addr.village || ''}`
        : data.display_name?.split(',').slice(0, 2).join(',').trim()
    ) || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

function HistoryExpenseRow({ e, currency, privacyMode, onDelete, onEdit }: {
  e: any;
  currency: string;
  privacyMode: boolean;
  onDelete: (id: string) => void;
  onEdit: (id: string, data: Partial<ExpenseFormData> & { location?: GeoLocation | null }) => void;
}) {
  const { t } = useTranslation();
  const cat = DEFAULT_CATEGORIES.find(c => c.name === e.category);
  const [isEditing, setIsEditing] = useState(false);
  const [editLocation, setEditLocation] = useState<GeoLocation | null>(e.location ?? null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [manualAddress, setManualAddress] = useState(e.location?.label || '');

  const { register, handleSubmit, reset } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: e.amount,
      category: e.category,
      description: e.description,
      date: e.date,
      isFixed: e.isFixed || false
    }
  });

  const handleGeolocate = async () => {
    if (!navigator.geolocation) {
      toast.error(t('spendless.geo_not_supported'));
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const label = await reverseGeocode(lat, lng);
        const geo: GeoLocation = { lat, lng, label };
        setEditLocation(geo);
        setManualAddress(label);
        toast.success(`${t('spendless.location')}: ${label}`);
        setGeoLoading(false);
      },
      (err) => {
        toast.error(`${t('auth.generic_error')}: ${err.message}`);
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleManualAddressChange = (val: string) => {
    setManualAddress(val);
    if (!val) {
      setEditLocation(null);
    } else {
      const newLoc = editLocation ? { ...editLocation, label: val } : { lat: 0, lng: 0, label: val };
      setEditLocation(newLoc);
    }
  };

  const submitEdit = (data: any) => {
    onEdit(e.id, { ...data, location: editLocation });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="py-3 border-b border-glass-border">
        <form onSubmit={handleSubmit(submitEdit as any)} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} className="w-1/3 px-2 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-sm" />
            <select {...register('category')} className="w-2/3 px-2 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-sm">
              {DEFAULT_CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <input type="text" {...register('description')} className="w-full px-2 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-sm" placeholder={t('spendless.description')} />
          <input type="date" {...register('date')} className="w-full px-2 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-sm" />

          {/* Refined Geolocation in edit mode */}
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="relative">
              <MapPin size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder={t('spendless.location')}
                value={manualAddress}
                onChange={(e) => handleManualAddressChange(e.target.value)}
                className="w-full pl-7 pr-7 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-xs focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
              {manualAddress && (
                <button type="button" onClick={() => { setManualAddress(''); setEditLocation(null); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted">
                  <XIcon size={12} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleGeolocate}
              disabled={geoLoading}
              className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary-500/10 border border-primary-500/30 text-primary-400 text-[10px] font-bold transition hover:bg-primary-500/20 disabled:opacity-50"
            >
              {geoLoading ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
              {geoLoading ? `${t('common.loading')}...` : t('spendless.detect_location')}
            </button>
          </div>

          <div className="flex justify-end gap-2 mt-1">
            <button type="button" onClick={() => { setIsEditing(false); reset(); setEditLocation(e.location ?? null); setManualAddress(e.location?.label || ''); }} className="p-1.5 rounded-lg text-text-muted hover:bg-glass-border"><XIcon size={16}/></button>
            <button type="submit" className="p-1.5 rounded-lg text-primary-400 hover:bg-primary-500/10"><Check size={16}/></button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-glass-border last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-xl">{cat?.icon ?? '📦'}</span>
        <div>
          <p className="text-sm font-medium">{e.description}</p>
          <p className="text-xs text-text-muted capitalize">
            {t(`spendless.categories.${e.category}`)} {e.addedBy && ` • ${e.addedBy}`}
          </p>
          {e.location && (
            <p className="text-xs text-primary-400 flex items-center gap-0.5 mt-0.5">
              <MapPin size={10} />
              {e.location.label ?? `${e.location.lat.toFixed(4)}, ${e.location.lng.toFixed(4)}`}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn('text-sm font-bold text-red-400', { 'blur-sm': privacyMode })}>
          -{currency}{e.amount.toFixed(2)}
        </span>
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 rounded-full text-text-muted hover:bg-glass-border transition"
          aria-label={t('common.edit')}
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={() => onDelete(e.id)}
          className="p-1 rounded-full text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition"
          aria-label={t('common.remove')}
        >
          ×
        </button>
      </div>
    </div>
  );
}

type FilterPeriod = 'week' | 'month' | 'all';

export function ExpenseHistoryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { expenses, deleteExpense, updateExpense, privacyMode, settings } = useBudgetStore();
  const [period, setPeriod] = useState<FilterPeriod>('month');

  const currency = settings?.currency ?? '€';
  const now = new Date();

  const filtered = expenses
    .filter(e => !e.isFixed)
    .filter(e => {
      if (period === 'all') return true;
      const d = new Date(e.date);
      if (period === 'week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(now);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);
        return d >= weekStart;
      }
      if (period === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    })
    .sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.createdAt - a.createdAt;
    });

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  // Group by date
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, e) => {
    const key = e.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const handleEdit = async (id: string, data: Partial<ExpenseFormData> & { location?: GeoLocation | null }) => {
    try {
      const partialExpense: any = { ...data };
      if (partialExpense.billingDay === null) partialExpense.billingDay = undefined;
      if (partialExpense.accountSource === null) partialExpense.accountSource = undefined;
      if (partialExpense.location === null) partialExpense.location = null; // explicit null = removed

      await updateExpense(id, partialExpense);
      toast.success(t('common.success'));
    } catch {
      toast.error(t('auth.generic_error'));
    }
  };

  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col gap-5 pb-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate(-1)} className="p-2 glass-button" aria-label={t('common.back')}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold">{t('spendless.history')}</h1>
          <p className="text-xs text-text-muted">{t('spendless.history_subtitle')}</p>
        </div>
      </div>

      {/* Period filter pills */}
      <div className="flex gap-2">
        {(['week', 'month', 'all'] as FilterPeriod[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
              period === p
                ? 'bg-gradient-to-r from-primary-400 to-primary-500 text-white shadow'
                : 'glass-button'
            )}
          >
            {p === 'week' ? t('spendless.this_week') : p === 'month' ? t('spendless.this_month') : t('spendless.all')}
          </button>
        ))}
      </div>

      {/* Total */}
      <GlassCard className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-widest">{t('spendless.history')}</p>
          <p className={cn('text-3xl font-bold text-red-400 tabular-nums mt-1', {
            'blur-md select-none': privacyMode,
          })}>
            {currency}{total.toFixed(2)}
          </p>
        </div>
        <span className="text-4xl">📊</span>
      </GlassCard>

      {/* Grouped List */}
      {Object.keys(grouped).length === 0 ? (
        <GlassCard className="text-center py-10">
          <p className="text-4xl mb-3">🗓️</p>
          <p className="font-medium text-text-muted">{t('spendless.no_expenses')}</p>
        </GlassCard>
      ) : (
        <motion.div variants={STAGGER_CONTAINER} initial="initial" animate="animate" className="flex flex-col gap-4">
          {Object.entries(grouped).map(([date, items]) => {
            const dateLabel = new Date(date).toLocaleDateString('it-IT', {
              weekday: 'short', day: 'numeric', month: 'short',
            });
            const dayTotal = items.reduce((s, e) => s + e.amount, 0);

            return (
              <motion.div key={date} variants={STAGGER_ITEM}>
                <GlassCard className="!p-0 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-glass-bg border-b border-glass-border">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wide">{dateLabel}</span>
                    <span className={cn('text-xs font-bold text-red-400', { 'blur-sm': privacyMode })}>
                      -{currency}{dayTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="px-4">
                    {items.map(e => (
                      <HistoryExpenseRow
                        key={e.id}
                        e={e}
                        currency={currency}
                        privacyMode={privacyMode}
                        onDelete={deleteExpense}
                        onEdit={handleEdit}
                      />
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
