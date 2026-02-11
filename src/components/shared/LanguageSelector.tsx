import React, { useState, useEffect } from 'react';
import { ProgrammingLanguage } from '@shared/api.ts';
import { useSettings } from '../../contexts/SettingsContext';

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
  const { solutionLanguage, updateSolutionLanguage, loading, error } =
    useSettings();
  const [readableVarNames, setReadableVarNames] = useState(false);

  useEffect(() => {
    if (window.electronAPI?.getReadableVarNames) {
      window.electronAPI
        .getReadableVarNames()
        .then((result) => {
          if (result.success && result.readableVarNames !== undefined) {
            setReadableVarNames(result.readableVarNames);
          }
        })
        .catch(console.error);
    }
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as ProgrammingLanguage;
    updateSolutionLanguage(newLanguage).catch((error) => {
      console.error('Error updating language:', error);
    });
  };

  const handleReadableVarNamesChange = (value: boolean) => {
    setReadableVarNames(value);
    if (window.electronAPI?.setReadableVarNames) {
      window.electronAPI.setReadableVarNames(value).catch(console.error);
    }
  };

  if (error) {
    return (
      <div className="mb-3 px-2 space-y-1">
        <div className="text-[11px] text-red-400">
          Error loading language settings
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 px-2 space-y-1">
      <div className="flex items-center justify-between text-[13px] font-medium text-white/90">
        <span>Code in{loading ? ' (loading...)' : ''}</span>
        <select
          value={solutionLanguage}
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
      <label className="flex items-center justify-between text-[13px] font-medium text-white/90 cursor-pointer">
        <span>Readable var names</span>
        <input
          type="checkbox"
          checked={readableVarNames}
          onChange={(e) => handleReadableVarNamesChange(e.target.checked)}
          className="accent-blue-500"
        />
      </label>
      <p className="text-[10px] leading-relaxed text-gray-400">
        e.g. leftIndex instead of l, currentSum instead of s. Simple loop
        iterators like i stay short.
      </p>
    </div>
  );
};
