
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Camera, Image, Loader2, CheckCircle, ChevronLeft, ToggleLeft, ToggleRight, MapPin, X, Navigation } from 'lucide-react';
import { useBudgetStore } from '@/store/useBudgetStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useOCR } from '@/features/budget/hooks/useOCR';
import { expenseSchema, type ExpenseFormData } from '@/validation/budget.schema';
import { GlassCard } from '@/components/ui/GlassCard';
import { PAGE_VARIANTS } from '@/constants/animations';
import { DEFAULT_CATEGORIES } from '@/types/budget.types';
import { cn } from '@/components/ui/GlassCard';

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

export function ExpenseFormPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { addExpense, budget, summary } = useBudgetStore();
  const { extractAmount, status: ocrStatus, progress: ocrProgress, openCameraInput, openGalleryInput, inputRef, galleryInputRef } = useOCR();

  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [manualAddress, setManualAddress] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: undefined,
      category: 'altro',
      date: today,
      description: '',
      isFixed: false,
      isFinancing: false,
    },
  });

  const isFixedVal = watch('isFixed');
  const isFinancingVal = watch('isFinancing');

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
        setLocation(geo);
        setManualAddress(label);
        setValue('location', geo);
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

  const clearLocation = () => {
    setLocation(null);
    setManualAddress('');
    setValue('location', null);
  };

  const handleManualAddressChange = (val: string) => {
    setManualAddress(val);
    if (!val) {
      setValue('location', null);
      setLocation(null);
    } else {
      // If we have lat/lng already, keep them but update label
      const newLoc = location ? { ...location, label: val } : { lat: 0, lng: 0, label: val };
      setLocation(newLoc);
      setValue('location', newLoc);
    }
  };

  // Handle camera image picked
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.info(t('spendless.scan_receipt'));
    const amount = await extractAmount(file);
    if (amount !== null) {
      setValue('amount', amount, { shouldValidate: true });
      toast.success(`${t('spendless.amount')}: €${amount.toFixed(2)}`);
    } else {
      toast.error(t('spendless.ocr_error'));
    }
  };

  const onSubmit = async (data: ExpenseFormData) => {
    if (!user?.uid) return;

    try {
      await addExpense({
        userId: user.uid,
        amount: data.amount,
        category: data.category,
        date: data.date ?? today,
        description: data.description,
        isFixed: data.isFixed,
        isFinancing: data.isFixed && data.isFinancing ? true : false,
        totalFinanced: (data.isFixed && data.isFinancing && typeof data.totalFinanced === 'number') ? data.totalFinanced : undefined,
        totalInstallments: (data.isFixed && data.isFinancing && typeof data.totalInstallments === 'number') ? data.totalInstallments : undefined,
        currentInstallment: (data.isFixed && data.isFinancing && typeof data.currentInstallment === 'number') ? data.currentInstallment : undefined,
        addedBy: user.displayName || user.email || t('common.loading'),
        createdAt: Date.now(),
        location: data.location || (manualAddress ? { lat: 0, lng: 0, label: manualAddress } : null),
      });

      // Check if weekly budget exceeded
      const newWeeklyTotal = (summary?.totalSpentThisWeek ?? 0) + data.amount;
      if (newWeeklyTotal > budget.weeklyLimit) {
        toast.warning(`⚠️ ${t('spendless.weekly_budget')} ${t('spendless.remaining').toLowerCase()}! ${newWeeklyTotal.toFixed(2)}€ / ${budget.weeklyLimit}€`, {
          duration: 5000,
        });
      } else {
        toast.success(t('common.success'));
      }

      navigate('/');
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
          <h1 className="text-xl font-bold">{t('spendless.add_expense')}</h1>
          <p className="text-xs text-text-muted">{t('spendless.add_expense_subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit as any)} className="flex flex-col gap-4" id="expense-form">

        {/* OCR scanner */}
        <GlassCard className="!p-4 flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-text-muted">{t('spendless.scan_receipt')}</p>
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <motion.button
              type="button"
              onClick={openCameraInput}
              disabled={ocrStatus === 'processing'}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl glass-button font-semibold text-sm disabled:opacity-60"
              whileTap={{ scale: 0.96 }}
            >
              {ocrStatus === 'processing' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : ocrStatus === 'done' ? (
                <CheckCircle size={16} className="text-primary-400" />
              ) : (
                <Camera size={16} />
              )}
              {ocrStatus === 'processing'
                ? `${t('common.loading')}… ${ocrProgress}%`
                : ocrStatus === 'done'
                ? t('common.success')
                : t('spendless.camera')}
            </motion.button>
            <motion.button
              type="button"
              onClick={openGalleryInput}
              disabled={ocrStatus === 'processing'}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl glass-button font-semibold text-sm disabled:opacity-60"
              whileTap={{ scale: 0.96 }}
            >
              {ocrStatus === 'processing' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : ocrStatus === 'done' ? (
                <CheckCircle size={16} className="text-primary-400" />
              ) : (
                <Image size={16} />
              )}
              {ocrStatus === 'processing'
                ? `${t('common.loading')}…`
                : ocrStatus === 'done'
                ? t('common.success')
                : t('spendless.gallery')}
            </motion.button>
          </div>

          {/* Hidden file input for camera/gallery */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageChange}
            aria-label={t('spendless.camera')}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
            aria-label={t('spendless.gallery')}
          />

          {/* OCR progress bar */}
          <AnimatePresence>
            {ocrStatus === 'processing' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 8 }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full bg-glass-bg rounded-full overflow-hidden"
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-400 to-primary-500 rounded-full"
                  animate={{ width: `${ocrProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-muted pl-1">{t('spendless.amount')}</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-text-muted pointer-events-none">€</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              placeholder="0.00"
              id="expense-amount"
              className={cn(
                'w-full pl-8 pr-4 py-3.5 rounded-2xl bg-glass-bg border text-2xl font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary-400 transition',
                errors.amount ? 'border-red-500' : 'border-glass-border'
              )}
              {...register('amount', { valueAsNumber: true })}
            />
          </div>
          {errors.amount && <p className="text-xs text-red-400 pl-1">{errors.amount.message}</p>}
        </div>

        {/* Category */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text-muted pl-1">{t('spendless.category')}</label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <div className="grid grid-cols-5 gap-2">
                {DEFAULT_CATEGORIES.map(cat => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => field.onChange(cat.name)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-2xl border transition-all text-xs font-medium',
                      field.value === cat.name
                        ? 'border-transparent ring-2 ring-primary-400 bg-primary-100/30 scale-105'
                        : 'border-glass-border bg-glass-bg'
                    )}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-[9px] leading-tight text-center capitalize">{t(`spendless.categories.${cat.name}`)}</span>
                  </button>
                ))}
              </div>
            )}
          />
          {errors.category && <p className="text-xs text-red-400 pl-1">{errors.category.message}</p>}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="expense-description" className="text-sm font-semibold text-text-muted pl-1">{t('spendless.description')}</label>
          <input
            type="text"
            id="expense-description"
            placeholder={t('spendless.description')}
            className={cn(
              'w-full px-4 py-3 rounded-2xl bg-glass-bg border focus:outline-none focus:ring-2 focus:ring-primary-400 transition',
              errors.description ? 'border-red-500' : 'border-glass-border'
            )}
            {...register('description')}
          />
          {errors.description && <p className="text-xs text-red-400 pl-1">{errors.description.message}</p>}
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="expense-date" className="text-sm font-semibold text-text-muted pl-1">{t('spendless.date')}</label>
          <input
            type="date"
            id="expense-date"
            className={cn(
              'w-full px-4 py-3 rounded-2xl bg-glass-bg border focus:outline-none focus:ring-2 focus:ring-primary-400 transition',
              errors.date ? 'border-red-500' : 'border-glass-border'
            )}
            {...register('date')}
          />
          {errors.date && <p className="text-xs text-red-400 pl-1">{errors.date.message}</p>}
        </div>

        {/* Geolocation */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text-muted pl-1">{t('spendless.location')}</label>
          <div className="flex flex-col gap-2">
            <div className="relative">
              <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder={t('spendless.location')}
                value={manualAddress}
                onChange={(e) => handleManualAddressChange(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-glass-bg border border-glass-border focus:outline-none focus:ring-2 focus:ring-primary-400 transition text-sm"
              />
              {manualAddress && (
                <button 
                  type="button" 
                  onClick={clearLocation}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-red-400 transition"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <motion.button
              type="button"
              onClick={handleGeolocate}
              disabled={geoLoading}
              whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-400 text-xs font-bold transition hover:bg-primary-500/20 disabled:opacity-50"
            >
              {geoLoading ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
              {geoLoading ? `${t('common.loading')}...` : t('spendless.detect_location')}
            </motion.button>
          </div>
        </div>

        {/* Fixed Toggle */}
        <div className="flex flex-col gap-3">
          <GlassCard className="!p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{t('spendless.recurring')}</p>
              <p className="text-xs text-text-muted">{t('spendless.recurring_desc')}</p>
            </div>
            <Controller
              control={control}
              name="isFixed"
              render={({ field }) => (
                <button type="button" onClick={() => field.onChange(!field.value)} className="text-primary-500">
                  {field.value
                    ? <ToggleRight size={36} className="text-primary-400" />
                    : <ToggleLeft size={36} className="text-text-muted" />
                  }
                </button>
              )}
            />
          </GlassCard>

          <AnimatePresence>
            {isFixedVal && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden flex flex-col gap-3"
              >
                <GlassCard className="!p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{t('spendless.is_financing')}</p>
                      <p className="text-xs text-text-muted">{t('spendless.recurring_desc')}</p>
                    </div>
                    <Controller
                      control={control}
                      name="isFinancing"
                      render={({ field }) => (
                        <button type="button" onClick={() => field.onChange(!field.value)} className="text-primary-500">
                          {field.value
                            ? <ToggleRight size={36} className="text-primary-400" />
                            : <ToggleLeft size={36} className="text-text-muted" />
                          }
                        </button>
                      )}
                    />
                  </div>

                  <AnimatePresence>
                    {isFinancingVal && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col sm:grid sm:grid-cols-3 gap-3 overflow-hidden mt-3 pt-3 border-t border-glass-border"
                      >
                        <div>
                          <label className="text-[10px] text-text-muted mb-1 block">{t('spendless.amount')} (€)</label>
                          <input type="number" step="0.01" {...register('totalFinanced', { valueAsNumber: true })} className="w-full px-2 py-2 rounded-xl bg-glass-bg border border-glass-border text-xs focus:ring-2 focus:ring-primary-400" />
                        </div>
                        <div>
                          <label className="text-[10px] text-text-muted mb-1 block">{t('spendless.total_installments')}</label>
                          <input type="number" {...register('totalInstallments', { valueAsNumber: true })} className="w-full px-2 py-2 rounded-xl bg-glass-bg border border-glass-border text-xs focus:ring-2 focus:ring-primary-400" />
                        </div>
                        <div>
                          <label className="text-[10px] text-text-muted mb-1 block">{t('spendless.current_installment')}</label>
                          <input type="number" {...register('currentInstallment', { valueAsNumber: true })} className="w-full px-2 py-2 rounded-xl bg-glass-bg border border-glass-border text-xs focus:ring-2 focus:ring-primary-400" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-primary-400 to-primary-500 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          id="submit-expense-btn"
        >
          {isSubmitting && <Loader2 size={18} className="animate-spin" />}
          {t('spendless.save_expense')}
        </motion.button>
      </form>
    </motion.div>
  );
}
