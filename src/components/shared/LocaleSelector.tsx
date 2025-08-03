import React from 'react';
import { UserLanguage } from '../../../shared/api';
import { useSettings } from '../../contexts/SettingsContext';

const LANGUAGE_LABELS: Record<UserLanguage, string> = {
  [UserLanguage.EN_US]: 'English',
  [UserLanguage.ES_ES]: 'Español (ES)',
  [UserLanguage.ES_MX]: 'Español (MX)',
  [UserLanguage.ES_AR]: 'Español (AR)',
  [UserLanguage.PT_PT]: 'Português (PT)',
  [UserLanguage.PT_BR]: 'Português (BR)',
  [UserLanguage.FR_FR]: 'Français (FR)',
  [UserLanguage.FR_CA]: 'Français (CA)',
  [UserLanguage.DE_DE]: 'Deutsch (DE)',
  [UserLanguage.DE_AT]: 'Deutsch (AT)',
  [UserLanguage.UK_UA]: 'Українська',
  [UserLanguage.RU_RU]: 'Русский',
  [UserLanguage.ZH_CN]: '中文 (CN)',
  [UserLanguage.ZH_TW]: '中文 (TW)',
  [UserLanguage.JA_JP]: '日本語',
  [UserLanguage.KO_KR]: '한국어',
  [UserLanguage.HI_IN]: 'हिन्दी',
  [UserLanguage.AR_SA]: 'العربية (SA)',
  [UserLanguage.AR_EG]: 'العربية (EG)',
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface LocaleSelectorProps {}

export const LocaleSelector: React.FC<LocaleSelectorProps> = () => {
  const { userLanguage, updateUserLanguage, loading, error } = useSettings();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as UserLanguage;
    updateUserLanguage(newLanguage).catch((error) => {
      console.error('Error updating language:', error);
    });
  };

  if (error) {
    return (
      <div className="mb-3 px-2 space-y-1">
        <div className="text-[11px] text-red-400">
          Error loading locale settings
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 px-2 space-y-1">
      <div className="flex items-center justify-between text-[13px] font-medium text-white/90">
        <span>Thoughts in{loading ? ' (loading...)' : ''}</span>
        <select
          value={userLanguage}
          onChange={handleLanguageChange}
          disabled={loading}
          className="bg-white/10 rounded-sm px-2 py-1 text-sm outline-hidden border border-white/10 focus:border-white/20 disabled:opacity-50"
        >
          {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
