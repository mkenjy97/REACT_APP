import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Mail, Globe, Apple, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export function Auth() {
  const [step, setStep] = useState<'login' | 'register'>('login');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const loginSchema = z.object({
    email: z.string().email(t('auth.invalid_email')),
    password: z.string().min(6, t('auth.password_min')),
  });

  type LoginForm = z.infer<typeof loginSchema>;

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    // Mock Firebase login
    login({
      uid: 'mock-uid-123',
      email: data.email,
      role: 'User',
      displayName: data.email.split('@')[0],
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Input label={t('auth.full_name')} placeholder="John Doe" />
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
              type="password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />
            
            <Button type="submit" className="mt-4 w-full">
              {step === 'login' ? t('auth.sign_in') : t('auth.sign_up')}
            </Button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-glass-border"></div>
            <span className="flex-shrink-0 mx-4 text-text-muted text-sm">{t('auth.or_continue')}</span>
            <div className="flex-grow border-t border-glass-border"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="glass" className="w-full grayscale opacity-50 cursor-not-allowed hidden sm:flex" disabled>
              <Apple size={18} className="mr-2" /> Apple
            </Button>
            <Button variant="glass" className="w-full grayscale opacity-50 cursor-not-allowed" disabled>
              <Globe size={18} className="mr-2" /> Google
            </Button>
            <Button variant="glass" className="w-full grayscale opacity-50 cursor-not-allowed" disabled>
              <Mail size={18} className="mr-2" /> Microsoft
            </Button>
            <Button variant="glass" className="w-full grayscale opacity-50 cursor-not-allowed" disabled>
              <Code size={18} className="mr-2" /> Github
            </Button>
          </div>

          <div className="text-center mt-2">
            <button
              onClick={() => setStep(step === 'login' ? 'register' : 'login')}
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
