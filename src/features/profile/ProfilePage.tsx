import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore, type Palette } from '@/store/useThemeStore';
import { PREDEFINED_THEMES } from '@/config/themes.config';
import { Icon } from '@/components/ui/Icon';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { authService } from '@/services/auth.service';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Copy, Users } from 'lucide-react';

import { PAGE_VARIANTS } from '@/constants/animations';
import { resetAllStores } from '@/store/resetStores';
import { useBudgetStore } from '@/store/useBudgetStore';
import { db } from '@/services/firebase';

export function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const { 
    isDark, toggleTheme, language, setLanguage, 
    lightPalette, darkPalette, setPaletteColor, resetPalettes, saveUserTheme, setThemeFromPreset 
  } = useThemeStore();
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

  // ─── Theme Personalization ──────────────────────────────────────────────────
  const [showThemeSection, setShowThemeSection] = useState(false);
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  // ─── Family group ───────────────────────────────────────────────────────────
  const { settings, saveSettings, removeFamilyMember } = useBudgetStore();
  const [showFamilyCode, setShowFamilyCode] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<{ uid: string; email: string; displayName?: string }[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const handleLogout = () => {
    resetAllStores();
    toast.success(t('common.success'));
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      if (authService.getCurrentUser()) {
        await authService.updateDisplayName(displayName);
      }
      updateProfile({ displayName, phoneNumber });
      toast.success(t('common.success'));
    } catch {
      toast.error(t('auth.generic_error'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError(t('auth.password_too_short'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('auth.password_mismatch'));
      return;
    }

    setIsSavingPassword(true);
    try {
      const firebaseUser = authService.getCurrentUser();
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error(t('auth.unauthenticated'));
      }

      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);

      toast.success(t('profile.success_password_update'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPasswordError(t('auth.wrong_password'));
      } else if (code === 'auth/too-many-requests') {
        setPasswordError(t('auth.too_many_requests'));
      } else {
        setPasswordError(t('auth.generic_error'));
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSaveTheme = async () => {
    if (!user?.uid) return;
    setIsSavingTheme(true);
    try {
      await saveUserTheme(user.uid);
      toast.success(t('common.success'));
    } catch {
      toast.error(t('auth.generic_error'));
    } finally {
      setIsSavingTheme(false);
    }
  };

  const handleResetTheme = () => {
    resetPalettes();
    toast.success(t('common.success'));
  };

  useEffect(() => {
    const fetchMembers = async () => {
      const currentFamilyId = settings?.familyId || user?.uid;
      if (!currentFamilyId) {
        setFamilyMembers([]);
        return;
      }
      setLoadingMembers(true);
      try {
        const q = query(collection(db, 'userSettings'), where('familyId', '==', currentFamilyId));
        const snap = await getDocs(q);
        const members: any[] = [];
        let adminFound = false;

        for (const d of snap.docs) {
          const uId = d.data().userId;
          const uSnap = await getDoc(doc(db, 'users', uId));
          if (uSnap.exists()) {
            members.push({ uid: uId, ...uSnap.data() });
            if (uId === currentFamilyId) adminFound = true;
          }
        }

        if (!adminFound && currentFamilyId === user?.uid) {
          const uSnap = await getDoc(doc(db, 'users', currentFamilyId));
          if (uSnap.exists()) {
            members.push({ uid: currentFamilyId, ...uSnap.data() });
          }
        }

        setFamilyMembers(members);
      } catch (err) {
        console.error('Error fetching family members:', err);
      } finally {
        setLoadingMembers(false);
      }
    };
    if (showFamilyCode) {
      fetchMembers();
    }
  }, [settings?.familyId, user?.uid, showFamilyCode]);

  const handleJoinFamily = async () => {
    if (!joinCode || !user?.uid) return;
    try {
      await saveSettings(user.uid, { familyId: joinCode.trim() });
      toast.success(t('spendless.join_family_success'));
      setJoinCode('');
      setShowFamilyCode(false);
      window.location.reload();
    } catch {
      toast.error(t('auth.generic_error'));
    }
  };

  const copyCode = () => {
    if (!user?.uid) return;
    navigator.clipboard.writeText(user.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDirty =
    displayName !== (user?.displayName || '') ||
    phoneNumber !== (user?.phoneNumber || '');

  const shades: (keyof Palette)[] = [50, 100, 200, 300, 400, 500];

  return (
    <motion.div 
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col gap-6 pb-10"
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
          <h2 className="text-xl font-bold">{user?.displayName || t('profile.user_label')}</h2>
          <p className="text-text-muted mb-2">{user?.email}</p>
          <RoleBadge role={user?.role || 'User'} />
        </div>
      </GlassCard>

      <section className="flex flex-col gap-4">
        <h3 className="font-semibold text-lg">{t('profile.account')}</h3>

        <GlassCard className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted flex items-center gap-2 ml-1">
              <Icon name="User" size={14} />
              {t('profile.profile_name')}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('profile.profile_name_placeholder')}
              className="flex h-12 w-full rounded-full border border-glass-border bg-surface px-4 py-2 text-sm text-text transition-colors placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted flex items-center gap-2 ml-1">
              <Icon name="Notifications" size={14} /> 
              {t('profile.phone')}
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={t('profile.phone_placeholder')}
              className="flex h-12 w-full rounded-full border border-glass-border bg-surface px-4 py-2 text-sm text-text transition-colors placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 shadow-sm"
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
                {t('common.cancel')}
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
              {t('profile.save_profile')}
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
                <p className="font-medium">{t('profile.change_password')}</p>
                <p className="text-xs text-text-muted">{t('profile.change_password_desc')}</p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: showPasswordSection ? 180 : 0 }}
              className="text-text-muted"
            >
              <Icon name="ChevronRight" size={18} />
            </motion.div>
          </button>

          <AnimatePresence>
            {showPasswordSection && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-glass-border pt-4 flex flex-col gap-3">
                  <Input
                    label={t('profile.current_password')}
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <Input
                    label={t('profile.new_password')}
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Input
                    label={t('profile.confirm_new_password')}
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {passwordError && <p className="text-xs text-red-400 ml-2">{passwordError}</p>}
                  <div className="flex justify-end gap-2">
                    <Button size="sm" onClick={handleChangePassword} disabled={isSavingPassword}>
                      {t('profile.update_password_btn')}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* ── Personalizzazione Colori ── */}
        <GlassCard className="flex flex-col gap-3 p-6">
          <button
            type="button"
            onClick={() => setShowThemeSection((v) => !v)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-3">
              <Icon name="Palette" size={18} className="text-primary-400" />
              <div className="text-left">
                <p className="font-medium">{t('profile.app_colors')}</p>
                <p className="text-xs text-text-muted">{t('profile.app_colors_desc')}</p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: showThemeSection ? 180 : 0 }}
              className="text-text-muted"
            >
              <Icon name="ChevronRight" size={18} />
            </motion.div>
          </button>

          <AnimatePresence>
            {showThemeSection && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-glass-border pt-4 flex flex-col gap-6">
                  {/* Preset Selector */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest pl-1">{t('profile.choose_preset')}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PREDEFINED_THEMES.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setThemeFromPreset(t.id)}
                          className="flex flex-col gap-2 p-3 rounded-xl bg-glass-bg border border-glass-border hover:bg-glass-border transition-all text-xs font-medium text-left"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border border-glass-border shadow-sm" style={{ backgroundColor: t.light[500] }} />
                            <span>{t.name}</span>
                          </div>
                          <div 
                            className="w-full h-8 rounded-lg flex items-center justify-center border border-glass-border"
                            style={{ backgroundColor: isDark ? t.dark.bg : t.light.bg }}
                          >
                            <span style={{ color: isDark ? t.dark.text : t.light.text }} className="text-[10px] font-bold">Aa</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-glass-border" />

                  {/* Light Palette */}
                  <div>
                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" /> {t('profile.light_palette')}
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {shades.map(shade => (
                        <div key={`light-${shade}`} className="flex flex-col gap-1 items-center">
                          <input 
                            type="color" 
                            value={lightPalette[shade]} 
                            onChange={(e) => setPaletteColor('light', shade, e.target.value)}
                            className="w-10 h-10 rounded-full border border-glass-border bg-transparent cursor-pointer overflow-hidden color-picker-input hover:scale-110 transition-transform shadow-sm"
                          />
                          <span className="text-[10px] text-text-muted">{shade}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dark Palette */}
                  <div>
                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400" /> {t('profile.dark_palette')}
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {shades.map(shade => (
                        <div key={`dark-${shade}`} className="flex flex-col gap-1 items-center">
                          <input 
                            type="color" 
                            value={darkPalette[shade]} 
                            onChange={(e) => setPaletteColor('dark', shade, e.target.value)}
                            className="w-10 h-10 rounded-full border border-glass-border bg-transparent cursor-pointer overflow-hidden color-picker-input hover:scale-110 transition-transform shadow-sm"
                          />
                          <span className="text-[10px] text-text-muted">{shade}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-glass-border">
                    <Button variant="ghost" size="sm" onClick={handleResetTheme} className="text-text-muted">
                      <Icon name="Reset" size={14} className="mr-1.5" />
                      {t('profile.reset_defaults')}
                    </Button>
                    <Button size="sm" onClick={handleSaveTheme} disabled={isSavingTheme}>
                      {isSavingTheme ? <Icon name="Info" size={14} className="animate-spin mr-1.5" /> : <Icon name="Check" size={14} className="mr-1.5" />}
                      {t('profile.save_colors')}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{t('spendless.family_group')}</h3>
          <button
            onClick={() => setShowFamilyCode(!showFamilyCode)}
            className="text-xs text-primary-400 font-medium"
          >
            {showFamilyCode ? t('common.close') : t('common.manage')}
          </button>
        </div>

        <GlassCard>
          <AnimatePresence>
            {showFamilyCode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-3 overflow-hidden"
              >
                <div className="bg-glass-bg p-3 rounded-xl border border-glass-border flex flex-col gap-2">
                  <p className="text-xs text-text-muted">{t('spendless.invite_code')}:</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm tracking-wider font-bold">{user?.uid}</span>
                    <button onClick={copyCode} className="p-1.5 rounded-md glass-button text-text-muted">
                      {copied ? <CheckCircle size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t('spendless.family_code_placeholder')}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-glass-bg border border-glass-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                  <button
                    onClick={handleJoinFamily}
                    disabled={!joinCode}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-sm disabled:opacity-50 shrink-0 whitespace-nowrap"
                  >
                    {t('spendless.join_btn')}
                  </button>
                </div>

                {settings?.familyId && settings.familyId !== user?.uid && (
                  <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle size={12} /> {t('spendless.in_shared_group')}
                  </p>
                )}

                {(settings?.familyId || user?.uid) && (
                  <div className="mt-2">
                    <p className="text-xs text-text-muted mb-2 font-semibold uppercase tracking-widest">{t('spendless.group_members')}</p>
                    {loadingMembers ? (
                      <p className="text-xs text-text-muted">{t('common.loading')}</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {familyMembers.map((m) => (
                          <div key={m.uid} className="flex items-center justify-between bg-glass-bg p-2 rounded-xl border border-glass-border gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Users size={16} className="text-purple-400 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{m.displayName || m.email}</p>
                                <p className="text-[10px] text-text-muted truncate">{m.email}</p>
                              </div>
                            </div>
                            {m.uid !== (settings?.familyId || user?.uid) && (
                              <button
                                onClick={async () => {
                                  await removeFamilyMember(m.uid);
                                  setFamilyMembers((prev) => prev.filter((u) => u.uid !== m.uid));
                                  toast.success(t('common.success'));
                                }}
                                className="text-xs text-red-400 p-1.5 rounded-md hover:bg-red-500/10 transition-colors shrink-0 whitespace-nowrap"
                              >
                                {t('common.remove')}
                              </button>
                            )}
                            {m.uid === (settings?.familyId || user?.uid) && (
                              <span className="text-[10px] px-2 py-1 bg-purple-500/20 text-purple-400 rounded-md font-bold uppercase tracking-wider shrink-0 whitespace-nowrap">
                                {t('common.admin')}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!showFamilyCode && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-purple-400" />
                <p className="text-sm font-medium text-text-muted">{t('spendless.family_group')}</p>
              </div>
              <p className="text-xs text-text-muted">{t('common.manage')}</p>
            </div>
          )}
        </GlassCard>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="font-semibold text-lg">{t('profile.appearance')}</h3>
        <GlassCard className="flex items-center justify-between p-4">
          <div>
            <p className="font-medium">{t('profile.current_theme')}</p>
            <p className="text-xs text-text-muted">{isDark ? t('profile.dark_mode') : t('profile.light_mode')}</p>
          </div>
          <button
            onClick={toggleTheme}
            className="p-3 rounded-full bg-glass-bg border border-glass-border hover:bg-glass-border transition-colors text-primary-400"
          >
            <Icon name={isDark ? 'Show' : 'Hide'} size={20} />
          </button>
        </GlassCard>

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
            <option value="it">🇮🇹 Italiano</option>
            <option value="en">🇺🇸 English</option>
            <option value="es">🇪🇸 Español</option>
            <option value="fr">🇫🇷 Français</option>
            <option value="ja">🇯🇵 日本語</option>
            <option value="ru">🇷🇺 Русский</option>
            <option value="zh">🇨🇳 中文</option>
          </select>
        </GlassCard>
      </section>


      <div className="mt-4 flex justify-center">
        <Button variant="ghost" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
          <Icon name="Logout" size={18} className="mr-2" />
          {t('profile.logout')}
        </Button>
      </div>
    </motion.div>
  );
}
