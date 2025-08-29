import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const languages = [
    { code: 'en', name: 'EN', dir: 'ltr' },
  ];

  return (
    <div className="flex gap-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            i18n.language === lang.code 
              ? 'bg-blue-500 text-white shadow-sm' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          dir={lang.dir}
        >
          {lang.name}
        </button>
      ))}
    </div>
  );
}; 