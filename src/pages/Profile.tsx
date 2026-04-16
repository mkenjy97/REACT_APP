
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore, type Palette } from '@/store/useThemeStore';
import { Moon, Sun, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { getContrastRatio } from '@/lib/contrast';



export function Profile() {
  const { user, logout, setRole } = useAuthStore();
  const { isDark, toggleTheme, language, setLanguage, palette, setPaletteColor } = useThemeStore();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    toast.success("Successfully logged out");
  };

  const handlePaletteBlur = () => {
    const ratio = getContrastRatio(palette[50], palette[500]);
    
    // WCAG Minimum Contrast ratio for normal text is 4.5:1
    if (ratio < 4.5) {
      toast.warning(`Accessibility Alert: The contrast ratio between shade 50 and 500 is very low (${ratio.toFixed(1)}:1). This may violate accessibility readability rules.`);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="mb-2">
        <h1 className="text-3xl font-bold">{t('navigation.profile')}</h1>
      </header>

      <GlassCard className="flex items-center gap-6 p-6">
        <div className="w-20 h-20 rounded-full border-4 border-glass-border bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center shrink-0">
           <span className="text-2xl font-bold text-white uppercase">
            {user?.email?.substring(0, 2) || 'U'}
          </span>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{user?.displayName || 'User'}</h2>
          <p className="text-text-muted mb-2">{user?.email}</p>
          <RoleBadge role={user?.role || 'User'} />
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-glass-border pt-6 mt-4">
        {/* Appearance Settings */}
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-lg">{t('profile.appearance')}</h3>
          
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
              <div>
                <p className="font-medium">{t('profile.palette')}</p>
                <p className="text-xs text-text-muted">{t('profile.palette_desc')}</p>
              </div>
              
              <div className="flex flex-col gap-2 mt-2">
                {(Object.keys(palette) as unknown as (keyof Palette)[]).map((shade) => (
                  <div key={shade} className="flex items-center justify-between pb-2 border-b border-glass-border/30 last:border-0 last:pb-0">
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

        {/* Preferences / Dev Settings */}
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

      <div className="mt-8 flex justify-center">
        <Button variant="ghost" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
          <LogOut size={18} className="mr-2" />
          {t('profile.logout')}
        </Button>
      </div>
    </div>
  );
}
