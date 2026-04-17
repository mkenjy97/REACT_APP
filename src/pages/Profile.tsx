import { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore, type Palette } from '@/store/useThemeStore';
import {
  Moon, Sun, LogOut, User, Phone, Mail, Lock, Check, X, Loader2, Link as LinkIcon, Edit3, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { getContrastRatio } from '@/lib/contrast';
import { auth } from '@/services/firebase';
import {
  updateProfile as firebaseUpdateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';

export function Profile() {
  const { user, logout, setRole, updateProfile } = useAuthStore();
  const { isDark, toggleTheme, language, setLanguage, palette, setPaletteColor, appName, setAppName, appIconUrl, setAppIcon, resetPalette } = useThemeStore();
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
    logout();
    toast.success('Logout effettuato.');
  };

  const handlePaletteBlur = () => {
    const ratio = getContrastRatio(palette[50], palette[500]);
    if (ratio < 4.5) {
      toast.warning(
        `Accessibility Alert: il contrasto tra shade 50 e 500 è basso (${ratio.toFixed(1)}:1).`
      );
    }
  };

  // ─── Save profile (name + phone) ───────────────────────────────────────────
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        await firebaseUpdateProfile(firebaseUser, { displayName });
      }
      updateProfile({ displayName, phoneNumber });
      toast.success('Profilo aggiornato con successo.');
    } catch {
      toast.error('Errore durante il salvataggio del profilo.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ─── Change password ────────────────────────────────────────────────────────
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
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error('Utente non autenticato.');
      }

      // Re-authenticate before sensitive operation
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
    <div className="flex flex-col gap-6">
      <header className="mb-2">
        <h1 className="text-3xl font-bold">{t('navigation.profile')}</h1>
      </header>

      {/* ── Avatar card ─────────────────────────────────────────────────────── */}
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

      {/* ── Account settings ─────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h3 className="font-semibold text-lg">Account</h3>

        <GlassCard className="flex flex-col gap-4 p-6">
          {/* Display name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted flex items-center gap-2 ml-1">
              <User size={14} />
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

          {/* Phone number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted flex items-center gap-2 ml-1">
              <Phone size={14} />
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

          {/* Email — read only */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted flex items-center gap-2 ml-1">
              <Mail size={14} />
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

          {/* Save profile */}
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
                <X size={15} className="mr-1.5" />
                Annulla
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSaveProfile}
              disabled={!isDirty || isSavingProfile}
            >
              {isSavingProfile ? (
                <Loader2 size={15} className="animate-spin mr-1.5" />
              ) : (
                <Check size={15} className="mr-1.5" />
              )}
              Salva profilo
            </Button>
          </div>
        </GlassCard>

        {/* ── Password change ─────────────────────────────────────────────────── */}
        <GlassCard className="flex flex-col gap-3 p-6">
          <button
            type="button"
            onClick={() => { setShowPasswordSection((v) => !v); setPasswordError(null); }}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-primary-400" />
              <div className="text-left">
                <p className="font-medium">Cambia password</p>
                <p className="text-xs text-text-muted">Aggiorna le credenziali di accesso</p>
              </div>
            </div>
            <motion.span
              animate={{ rotate: showPasswordSection ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-text-muted"
            >
              ▾
            </motion.span>
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
                      <X size={15} className="mr-1.5" />
                      Annulla
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleChangePassword}
                      disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
                    >
                      {isSavingPassword ? (
                        <Loader2 size={15} className="animate-spin mr-1.5" />
                      ) : (
                        <Check size={15} className="mr-1.5" />
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

      {/* ── Appearance + Preferences ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-glass-border pt-6 mt-2">
        {/* Appearance */}
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-lg">{t('profile.appearance')}</h3>

          {user?.role !== 'User' && (
            <GlassCard className="flex flex-col gap-4 p-4 mt-4 mb-4">
              <h4 className="font-medium">App Branding (Admin/Manager)</h4>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-muted flex items-center gap-2 ml-1">
                  <Edit3 size={14} />
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
                  <LinkIcon size={14} />
                  URL Icona App (Lascia vuoto per default)
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
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </GlassCard>

          {user?.role !== 'User' && (
            <GlassCard className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('profile.palette')}</p>
                  <p className="text-xs text-text-muted">{t('profile.palette_desc')}</p>
                </div>
                <Button 
                  variant="glass" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-full shrink-0 text-text-muted hover:text-primary-500" 
                  onClick={resetPalette} 
                  title="Ripristina colori predefiniti"
                >
                  <RotateCcw size={16} />
                </Button>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                {(Object.keys(palette) as unknown as (keyof Palette)[]).map((shade) => (
                  <div
                    key={shade}
                    className="flex items-center justify-between pb-2 border-b border-glass-border/30 last:border-0 last:pb-0"
                  >
                    <span className="text-sm font-medium">Primary {shade}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted uppercase w-16">{palette[shade]}</span>
                      <input
                        type="color"
                        value={palette[shade]}
                        onChange={(e) => setPaletteColor(shade, e.target.value)}
                        onBlur={handlePaletteBlur}
                        className="w-8 h-8 rounded-full border-0 p-0 overflow-hidden cursor-pointer bg-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Preferences */}
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
              <option value="en">English</option>
              <option value="it">Italiano</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
              <option value="ru">Русский</option>
            </select>
          </GlassCard>

          <GlassCard className="flex flex-col gap-2 p-4">
            <div>
              <p className="font-medium">{t('profile.dev_role')}</p>
              <p className="text-xs text-text-muted">{t('profile.dev_role_desc')}</p>
            </div>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant={user?.role === 'User' ? 'primary' : 'glass'} onClick={() => setRole('User')}>User</Button>
              <Button size="sm" variant={user?.role === 'Manager' ? 'primary' : 'glass'} onClick={() => setRole('Manager')}>Manager</Button>
              <Button size="sm" variant={user?.role === 'Admin' ? 'primary' : 'glass'} onClick={() => setRole('Admin')}>Admin</Button>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ── Logout ───────────────────────────────────────────────────────────── */}
      <div className="mt-8 flex justify-center">
        <Button variant="ghost" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
          <LogOut size={18} className="mr-2" />
          {t('profile.logout')}
        </Button>
      </div>
    </div>
  );
}
