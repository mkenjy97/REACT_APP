import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Search as SearchIcon, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Search() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState(t('search.filters.all'));
  const filters = [
    t('search.filters.all'), 
    t('search.filters.recent'), 
    t('search.filters.favorites'), 
    t('search.filters.archived')
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-md pt-4 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
          <Input 
            className="pl-12 bg-glass-bg border-glass-border shadow-sm rounded-full" 
            placeholder={t('search.placeholder')} 
          />
        </div>
        
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
          <div className="flex-shrink-0 p-2 text-text-muted">
            <Filter size={18} />
          </div>
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f 
                  ? 'bg-primary-500 text-bg-color' 
                  : 'bg-glass-bg border border-glass-border text-text hover:bg-glass-border'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center mt-12 opacity-50">
        <SearchIcon size={48} className="mb-4 text-text-muted" />
        <h3 className="text-xl font-medium">{t('search.start_typing')}</h3>
        <p className="text-sm mt-2 max-w-sm">
          {t('search.desc')}
        </p>
      </div>
    </div>
  );
}
