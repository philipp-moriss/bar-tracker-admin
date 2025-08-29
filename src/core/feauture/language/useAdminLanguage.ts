import { useTranslation } from "react-i18next";

export function useAdminLanguage() {
    const { i18n } = useTranslation();
    const lang = i18n.language || '';
    const isRTL = lang.startsWith('ar') || lang.startsWith('he');
    
    return { lang, isRTL };
}
