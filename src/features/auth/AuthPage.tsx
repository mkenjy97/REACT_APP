import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { authService } from '@/services/auth.service';
import { dbService } from '@/services/db.service';
import { AUTH_SCHEMAS } from '@/validation/schemas';
import { PAGE_VARIANTS, TRANSITIONS } from '@/constants/animations';

export function AuthPage() {
  const [step, setStep] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const currentSchema = step === 'login' ? AUTH_SCHEMAS.login : AUTH_SCHEMAS.register;
  type AuthForm = z.infer<typeof currentSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthForm>({
    resolver: zodResolver(currentSchema),
  });

  const getFirebaseErrorMessage = (code: string): string => {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return t('auth.invalid_credentials') || 'Email o password non corretti.';
      case 'auth/email-already-in-use':
        return t('auth.email_in_use') || 'Questa email è già registrata.';
      case 'auth/too-many-requests':
        return t('auth.too_many_requests') || 'Troppi tentativi. Riprova più tardi.';
      case 'auth/network-request-failed':
        return t('auth.network_error') || 'Errore di rete. Controlla la connessione.';
      default:
        return t('auth.generic_error') || 'Si è verificato un errore. Riprova.';
    }
  };

  const onSubmit = async (data: AuthForm) => {
    setIsLoading(true);
    setFirebaseError(null);
    try {
      let user: any;
      if (step === 'login') {
        const cred = await authService.login(data.email, data.password);
        user = await dbService.getDocument('users', cred.user.uid);
        
        if (!user) {
          user = {
            uid: cred.user.uid,
            email: cred.user.email!,
            role: 'User' as const,
            displayName: cred.user.displayName || cred.user.email!.split('@')[0],
          };
          await dbService.setDocument('users', cred.user.uid, user);
        }
      } else {
        const registerData = data as z.infer<typeof AUTH_SCHEMAS.register>;
        const cred = await authService.register(data.email, data.password);
        if (registerData.fullName) {
          await authService.updateDisplayName(registerData.fullName);
        }
        user = {
          uid: cred.user.uid,
          email: cred.user.email!,
          role: 'User' as const,
          displayName: registerData.fullName || cred.user.email!.split('@')[0],
        };
        await dbService.setDocument('users', cred.user.uid, user);
      }
      
      login(user);
      navigate('/');
    } catch (err: unknown) {
      console.error('Auth Error Details:', err);
      const code = (err as { code?: string })?.code ?? '';
      setFirebaseError(getFirebaseErrorMessage(code));
    } finally {
      setIsLoading(false);
    }
  };

  const EyeToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      className="text-text-muted hover:text-text transition-colors p-1"
      aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
    >
      <Icon name={showPassword ? 'Hide' : 'Show'} size={16} />
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        variants={PAGE_VARIANTS}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full max-w-md"
      >
        <GlassCard className="flex flex-col gap-8 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              {step === 'login' ? t('auth.welcome_back') : t('auth.create_account')}
            </h1>
            <p className="text-sm text-text-muted mt-2">
              {step === 'login' ? t('auth.enter_details') : t('auth.sign_up_start')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {step === 'register' && (
                <motion.div
                  key="fullname"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={TRANSITIONS.smooth}
                >
                  <Input
                    label={t('auth.full_name')}
                    placeholder="Mario Rossi"
                    {...register('fullName' as any)}
                    error={(errors as any).fullName?.message}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              label={t('auth.email')}
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label={t('auth.password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              rightElement={EyeToggle}
              {...register('password')}
              error={errors.password?.message}
            />

            {firebaseError && (
              <motion.div
                key="fb-error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                {firebaseError}
              </motion.div>
            )}

            <Button type="submit" className="mt-2 w-full" disabled={isLoading}>
              {isLoading && <Icon name="Info" size={18} className="animate-spin mr-2" />}
              {step === 'login' ? t('auth.sign_in') : t('auth.sign_up')}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-glass-border" />
            <span className="flex-shrink-0 mx-4 text-text-muted text-sm">{t('auth.or_continue')}</span>
            <div className="flex-grow border-t border-glass-border" />
          </div>

          {/* Social providers */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="glass" className="w-full grayscale opacity-40 cursor-not-allowed hidden sm:flex" disabled>
              <Icon name="Email" size={18} className="mr-2" /> Apple
            </Button>
            <Button variant="glass" className="w-full grayscale opacity-40 cursor-not-allowed" disabled>
              <Icon name="Search" size={18} className="mr-2" /> Google
            </Button>
          </div>

          <div className="text-center mt-2">
            <button
              type="button"
              onClick={() => {
                setStep(step === 'login' ? 'register' : 'login');
                setFirebaseError(null);
                setShowPassword(false);
              }}
              className="text-sm text-primary-500 hover:underline focus:outline-none"
            >
              {step === 'login' ? t('auth.no_account') : t('auth.have_account')}
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
