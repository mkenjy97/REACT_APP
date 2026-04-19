import { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { Icon } from '@/components/ui/Icon';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { authService } from '@/services/auth.service';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_CONFIG } from '@/config/app.config';
import { PAGE_VARIANTS } from '@/constants/animations';
import { resetAllStores } from '@/store/resetStores';

export function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const { isDark, toggleTheme, language, setLanguage, appName, setAppName, appIconUrl, setAppIcon } = useThemeStore();
  const { t } = useTranslation();

  // ─── Account editing ───────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // ─── Password change ────────────────────────────────────────────────────────
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleLogout = () => {
    resetAllStores();
    toast.success('Logout effettuato.');
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      if (authService.getCurrentUser()) {
        await authService.updateDisplayName(displayName);
      }
      updateProfile({ displayName, phoneNumber });
      toast.success('Profilo aggiornato con successo.');
    } catch {
      toast.error('Errore durante il salvataggio del profilo.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('La nuova password deve essere almeno 6 caratteri.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Le password non coincidono.');
      return;
    }

    setIsSavingPassword(true);
    try {
      const firebaseUser = authService.getCurrentUser();
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error('Utente non autenticato.');
      }

      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);

      toast.success('Password aggiornata con successo.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPasswordError('Password attuale non corretta.');
      } else if (code === 'auth/too-many-requests') {
        setPasswordError('Troppi tentativi. Riprova più tardi.');
      } else {
        setPasswordError('Errore durante il cambio password. Riprova.');
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  const isDirty =
    displayName !== (user?.displayName || '') ||
    phoneNumber !== (user?.phoneNumber || '');

  return (
    <motion.div 
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col gap-6"
    >
      <header className="mb-2">
        <h1 className="text-3xl font-bold">{t('navigation.profile')}</h1>
      </header>

      <GlassCard className="flex items-center gap-6 p-6">
        <div className="w-20 h-20 rounded-full border-4 border-glass-border bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold text-white uppercase">
            {user?.displayName?.substring(0, 2) || user?.email?.substring(0, 2) || 'U'}
          </span>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{user?.displayName || 'Utente'}</h2>
          <p className="text-text-muted mb-2">{user?.email}</p>
          <RoleBadge role={user?.role || 'User'} />
        </div>
      </GlassCard>

      <section className="flex flex-col gap-4">
        <h3 className="font-semibold text-lg">Account</h3>

        <GlassCard className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted flex items-center gap-2 ml-1">
              <Icon name="User" size={14} />
              Nome profilo
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Il tuo nome"
              className="flex h-12 w-full rounded-full border border-glass-border bg-surface px-4 py-2 text-sm text-text transition-colors placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted flex items-center gap-2 ml-1">
              <Icon name="Notifications" size={14} /> {/* Using Notifications as a generic info/alert icon if no Phone */}
              Numero di telefono
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+39 000 0000000"
              className="flex h-12 w-full rounded-full border border-glass-border bg-surface px-4 py-2 text-sm text-text transition-colors placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted flex items-center gap-2 ml-1">
              <Icon name="Email" size={14} />
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              disabled
              className="flex h-12 w-full rounded-full border border-glass-border bg-surface px-4 py-2 text-sm text-text-muted opacity-60 cursor-not-allowed shadow-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {isDirty && (
              <Button
                variant="glass"
                size="sm"
                onClick={() => {
                  setDisplayName(user?.displayName || '');
                  setPhoneNumber(user?.phoneNumber || '');
                }}
              >
                <Icon name="Close" size={15} className="mr-1.5" />
                Annulla
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSaveProfile}
              disabled={!isDirty || isSavingProfile}
            >
              {isSavingProfile ? (
                <Icon name="Info" size={15} className="animate-spin mr-1.5" />
              ) : (
                <Icon name="Check" size={15} className="mr-1.5" />
              )}
              Salva profilo
            </Button>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col gap-3 p-6">
          <button
            type="button"
            onClick={() => { setShowPasswordSection((v) => !v); setPasswordError(null); }}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-3">
              <Icon name="Password" size={18} className="text-primary-400" />
              <div className="text-left">
                <p className="font-medium">Cambia password</p>
                <p className="text-xs text-text-muted">Aggiorna le credenziali di accesso</p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: showPasswordSection ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-text-muted"
            >
              <Icon name="ChevronRight" size={18} />
            </motion.div>
          </button>

          <AnimatePresence>
            {showPasswordSection && (
              <motion.div
                key="pwd-section"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-3 overflow-hidden"
              >
                <div className="border-t border-glass-border pt-4 flex flex-col gap-3">
                  <Input
                    label="Password attuale"
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <Input
                    label="Nuova password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Input
                    label="Conferma nuova password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />

                  <AnimatePresence>
                    {passwordError && (
                      <motion.p
                        key="pwd-error"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-red-400 ml-2"
                      >
                        {passwordError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => { setShowPasswordSection(false); setPasswordError(null); }}
                    >
                      <Icon name="Close" size={15} className="mr-1.5" />
                      Annulla
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleChangePassword}
                      disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
                    >
                      {isSavingPassword ? (
                        <Icon name="Info" size={15} className="animate-spin mr-1.5" />
                      ) : (
                        <Icon name="Check" size={15} className="mr-1.5" />
                      )}
                      Aggiorna password
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-glass-border pt-6 mt-2">
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-lg">{t('profile.appearance')}</h3>

          {user?.role !== 'User' && (
            <GlassCard className="flex flex-col gap-4 p-4 mt-4 mb-4">
              <h4 className="font-medium">App Branding (Admin/Manager)</h4>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-muted flex items-center gap-2 ml-1">
                  <Icon name="Add" size={14} />
                  Nome App
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Nome dell'applicazione"
                  className="flex h-12 w-full rounded-full border border-glass-border bg-surface px-4 py-2 text-sm text-text transition-colors placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-muted flex items-center gap-2 ml-1">
                  <Icon name="Search" size={14} />
                  URL Icona App
                </label>
                <input
                  type="url"
                  value={appIconUrl || ''}
                  onChange={(e) => setAppIcon(e.target.value || null)}
                  placeholder="https://example.com/icon.png"
                  className="flex h-12 w-full rounded-full border border-glass-border bg-surface px-4 py-2 text-sm text-text transition-colors placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 shadow-sm"
                />
              </div>
            </GlassCard>
          )}

          <GlassCard className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{t('profile.theme')}</p>
              <p className="text-xs text-text-muted">{t('profile.theme_desc')}</p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-3 rounded-full bg-glass-bg border border-glass-border hover:bg-glass-border transition-colors"
            >
              <Icon name={isDark ? 'Search' : 'Search'} size={20} /> {/* Placeholder for Sun/Moon */}
            </button>
          </GlassCard>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-lg">{t('profile.preferences')}</h3>

          <GlassCard className="flex flex-col gap-2 p-4">
            <div>
              <p className="font-medium">{t('profile.language')}</p>
              <p className="text-xs text-text-muted">{t('profile.language_desc')}</p>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="mt-2 h-10 w-full rounded-lg border border-glass-border bg-glass-bg px-3 text-sm focus:outline-none focus:border-primary-300"
            >
              {APP_CONFIG.i18n.supportedLanguages.map(lang => (
                <option key={lang} value={lang}>{lang.toUpperCase()}</option>
              ))}
            </select>
          </GlassCard>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Button variant="ghost" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
          <Icon name="Logout" size={18} className="mr-2" />
          {t('profile.logout')}
        </Button>
      </div>
    </motion.div>
  );
}
