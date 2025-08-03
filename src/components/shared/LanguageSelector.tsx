import React from 'react';
import { ProgrammingLanguage } from '@shared/api.ts';
import { getStorageProvider } from '../../services/storage/index';

const LANGUAGE_LABELS: Record<ProgrammingLanguage, string> = {
  [ProgrammingLanguage.Python]: 'Python',
  [ProgrammingLanguage.JavaScript]: 'JavaScript',
  [ProgrammingLanguage.TypeScript]: 'TypeScript',
  [ProgrammingLanguage.Java]: 'Java',
  [ProgrammingLanguage.Go]: 'Go',
  [ProgrammingLanguage.Cpp]: 'C++',
  [ProgrammingLanguage.Swift]: 'Swift',
  [ProgrammingLanguage.Kotlin]: 'Kotlin',
  [ProgrammingLanguage.Ruby]: 'Ruby',
  [ProgrammingLanguage.SQL]: 'SQL',
  [ProgrammingLanguage.R]: 'R',
  [ProgrammingLanguage.PHP]: 'PHP',
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface LanguageSelectorProps {}

export const LanguageSelector: React.FC<LanguageSelectorProps> = () => {
  const storageProvider = getStorageProvider();
  const [currentLanguage, setCurrentLanguage] =
    React.useState<ProgrammingLanguage>(ProgrammingLanguage.Python);

  React.useEffect(() => {
    storageProvider
      .getSolutionLanguage()
      .then(setCurrentLanguage)
      .catch(console.error);
  }, [storageProvider]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as ProgrammingLanguage;
    storageProvider
      .setSolutionLanguage(newLanguage)
      .then(() => {
        setCurrentLanguage(newLanguage);
      })
      .catch((error) => {
        console.error('Error updating language:', error);
      });
  };

  return (
    <div className="mb-3 px-2 space-y-1">
      <div className="flex items-center justify-between text-[13px] font-medium text-white/90">
        <span>Code in</span>
        <select
          value={currentLanguage}
          onChange={handleLanguageChange}
          className="bg-white/10 rounded-sm px-2 py-1 text-sm outline-hidden border border-white/10 focus:border-white/20"
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
