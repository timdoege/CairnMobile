import { Device } from '@nativescript/core/platform';
import { loadLocaleJSON } from '@nativescript-community/l';
import { prefs } from '../services/preferences';
export { l as $t, lt as $tt, lu as $tu, lc as $tc } from '@nativescript-community/l';
import dayjs from 'dayjs';
const supportedLanguages = ['en', 'fr'];
import { getString, setString } from '@nativescript/core/application-settings';
import updateLocale from 'dayjs/plugin/updateLocale';

dayjs.extend(updateLocale);

function setLang(newLang) {
    newLang = getOwmLanguage(newLang);
    if (supportedLanguages.indexOf(newLang) === -1) {
        newLang = 'en';
    }
    lang = newLang;
    console.log('changed lang', lang, Device.region);
    try {
        require(`dayjs/locale/${newLang}`);
    } catch (err) {
        console.log('failed to load dayjs locale', lang, `dayjs/locale/${newLang}`, err);
    }
    dayjs.locale(lang); // switch back to default English locale globally
    if (lang === 'fr') {
        dayjs.updateLocale('fr', {
            calendar: {
                lastDay: '[Hier à] LT',
                sameDay: "[Aujourd'hui à] LT",
                nextDay: '[Demain à] LT',
                lastWeek: 'dddd [dernier] [à] LT',
                nextWeek: 'dddd [à] LT',
                sameElse: 'L'
            }
        });
    }

    try {
        const localeData = require(`~/i18n/${lang}.json`);
        loadLocaleJSON(localeData);
    } catch (err) {
        console.log('failed to load lang json', lang, `~/i18n/${lang}.json`, err);
    }
    onLanguageChangedCallbacks.forEach(c => c(lang));
}
const onLanguageChangedCallbacks = [];
export function onLanguageChanged(callback) {
    onLanguageChangedCallbacks.push(callback);
}

let deviceLanguage = getString('language');
if (!deviceLanguage) {
    deviceLanguage = Device.language.split('-')[0].toLowerCase();
    // setString('language', deviceLanguage);
    // console.log('prefs language not set', deviceLanguage, getString('language'));
}
// console.log('deviceLanguage', deviceLanguage);
function getOwmLanguage(language) {
    if (language === 'cs') {
        // Czech
        return 'cz';
    } else if (language === 'ko') {
        // Korean
        return 'kr';
    } else if (language === 'lv') {
        // Latvian
        return 'la';
    } else {
        return language;
    }
}
export let lang;

// const rtf = new Intl.RelativeTimeFormat('es');

prefs.on('key:language', () => {
    const newLanguage = getString('language');
    console.log('language changed', newLanguage);
    // on pref change we are updating
    if (newLanguage === lang) {
        return;
    }
    setLang(newLanguage);
});

setLang(deviceLanguage);
