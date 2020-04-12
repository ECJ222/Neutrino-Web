import i18next from 'i18next';
import { mergeDeepRight } from 'ramda'
import { initReactI18next } from 'react-i18next';

import englishTranslation from './en-us';
import russianTranslation from './ru-ru';
import chineseTranslation from './ch';

export const LanguageEnum = {
    EN: 'en',
    RU: 'ru',
    CH: 'ch',
};

const localStorageKey = 'default-locale';
const getDefaultLanguage = () => {
    return (
        (typeof window !== undefined && localStorage.getItem(localStorageKey)) || LanguageEnum.EN
    );
};
const onChangeLanguage = (i18n, language) => {
    if (typeof window !== undefined) {
        localStorage.setItem(localStorageKey, language);
    }
    i18n.changeLanguage(language);
};

i18next.use(initReactI18next).init({
    interpolation: {
        // React already does escaping
        escapeValue: false,
    },
    lng: getDefaultLanguage(),
    resources: {
        [LanguageEnum.EN]: englishTranslation,
        [LanguageEnum.RU]: russianTranslation,
        [LanguageEnum.CH]: mergeDeepRight(englishTranslation, chineseTranslation),
    },
});

export const getLangDropdownItems = (i18n) => [
    {
        label: 'English',
        flag: '🇬🇧',
        lng: LanguageEnum.EN,
        onClick: () => onChangeLanguage(i18n, LanguageEnum.EN),
    },
    {
        label: '文言',
        flag: '🇨🇳',
        lng: LanguageEnum.CH,
        onClick: () => onChangeLanguage(i18n, LanguageEnum.CH),
    },
]
export const getLanguageDropdownProps = (i18n) => ({
    default: getLangDropdownItems(i18n).find(lang => lang.lng === getDefaultLanguage()),
    langs: getLangDropdownItems(i18n),
});

export const t = (text) => i18next.t(text);

export default i18next;
