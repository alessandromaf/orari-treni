type Lang = 'it' | 'en' | 'ru';

const translations = {
  it: {
    // App
    appTitle: 'Orari Treni',
    navStation: 'Stazione',
    navTrain: 'Treno',
    navJourney: 'Cerca viaggio',

    // Common
    search: 'Ricerca...',
    noResults: 'Nessun risultato',
    connectionError: 'Errore di connessione',
    platform: 'Bin.',
    from: 'Da',
    to: 'A',

    // Station search
    searchStation: 'Cerca stazione...',
    clear: 'Cancella',
    recent: 'Recenti',
    popularStations: 'Stazioni principali',

    // Departure board
    departures: 'Partenze',
    arrivals: 'Arrivi',
    dateTime: 'Data e ora',
    now: 'Adesso',
    updatedAt: 'Aggiornato alle',
    refresh: 'Aggiorna',
    loading: 'Caricamento...',
    loadError: 'Errore nel caricamento dei dati',
    noTrains: 'Nessun treno trovato',

    // Train status
    cancelled: 'Cancellato',
    notStarted: 'Non ancora partito',
    onTime: 'In orario',
    min: 'min',
    earlyMin: 'min anticipo',
    hours: 'h',

    // Train search
    trainNotFound: 'Treno non trovato',
    cannotGetStatus: 'Impossibile ottenere lo stato del treno',
    trainPlaceholder: 'Numero treno (es. FR 9514, 4612)',
    searchTrain: 'Cerca treno',
    lastDetection: 'Ultimo rilevamento:',

    // Journey search
    departureStation: 'Stazione di partenza',
    arrivalStation: 'Stazione di arrivo',
    swapStations: 'Inverti stazioni',
    departureDatetime: 'Data e ora di partenza',
    searchSolutions: 'Cerca soluzioni',
    searchingSolutions: 'Ricerca soluzioni...',
    searchError: 'Errore nella ricerca delle soluzioni',
    noSolutions: 'Nessuna soluzione trovata',
    change: 'cambio',
    changes: 'cambi',
    changeover: 'Cambio',
    direct: 'Diretto',
    priceFrom: 'da',
  },
  en: {
    appTitle: 'Train Times',
    navStation: 'Station',
    navTrain: 'Train',
    navJourney: 'Search journey',

    search: 'Searching...',
    noResults: 'No results',
    connectionError: 'Connection error',
    platform: 'Plat.',
    from: 'From',
    to: 'To',

    searchStation: 'Search station...',
    clear: 'Clear',
    recent: 'Recent',
    popularStations: 'Popular stations',

    departures: 'Departures',
    arrivals: 'Arrivals',
    dateTime: 'Date and time',
    now: 'Now',
    updatedAt: 'Updated at',
    refresh: 'Refresh',
    loading: 'Loading...',
    loadError: 'Error loading data',
    noTrains: 'No trains found',

    cancelled: 'Cancelled',
    notStarted: 'Not yet departed',
    onTime: 'On time',
    min: 'min',
    earlyMin: 'min early',
    hours: 'h',

    trainNotFound: 'Train not found',
    cannotGetStatus: 'Unable to get train status',
    trainPlaceholder: 'Train number (e.g. FR 9514, 4612)',
    searchTrain: 'Search train',
    lastDetection: 'Last detection:',

    departureStation: 'Departure station',
    arrivalStation: 'Arrival station',
    swapStations: 'Swap stations',
    departureDatetime: 'Departure date and time',
    searchSolutions: 'Search solutions',
    searchingSolutions: 'Searching solutions...',
    searchError: 'Error searching solutions',
    noSolutions: 'No solutions found',
    change: 'change',
    changes: 'changes',
    changeover: 'Change',
    direct: 'Direct',
    priceFrom: 'from',
  },
  ru: {
    appTitle: 'Расписание поездов',
    navStation: 'Станция',
    navTrain: 'Поезд',
    navJourney: 'Поиск маршрута',

    search: 'Поиск...',
    noResults: 'Ничего не найдено',
    connectionError: 'Ошибка соединения',
    platform: 'Путь',
    from: 'Откуда',
    to: 'Куда',

    searchStation: 'Найти станцию...',
    clear: 'Очистить',
    recent: 'Недавние',
    popularStations: 'Основные станции',

    departures: 'Отправление',
    arrivals: 'Прибытие',
    dateTime: 'Дата и время',
    now: 'Сейчас',
    updatedAt: 'Обновлено в',
    refresh: 'Обновить',
    loading: 'Загрузка...',
    loadError: 'Ошибка загрузки данных',
    noTrains: 'Поезда не найдены',

    cancelled: 'Отменён',
    notStarted: 'Ещё не отправлен',
    onTime: 'Вовремя',
    min: 'мин',
    earlyMin: 'мин раньше',
    hours: 'ч',

    trainNotFound: 'Поезд не найден',
    cannotGetStatus: 'Не удалось получить статус поезда',
    trainPlaceholder: 'Номер поезда (напр. FR 9514, 4612)',
    searchTrain: 'Найти поезд',
    lastDetection: 'Последнее обнаружение:',

    departureStation: 'Станция отправления',
    arrivalStation: 'Станция прибытия',
    swapStations: 'Поменять станции',
    departureDatetime: 'Дата и время отправления',
    searchSolutions: 'Найти маршруты',
    searchingSolutions: 'Поиск маршрутов...',
    searchError: 'Ошибка поиска маршрутов',
    noSolutions: 'Маршруты не найдены',
    change: 'пересадка',
    changes: 'пересадки',
    changeover: 'Пересадка',
    direct: 'Прямой',
    priceFrom: 'от',
  },
} as const;

type TranslationKey = keyof typeof translations.it;

export const SUPPORTED_LANGS: { code: Lang; label: string }[] = [
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
];

const LANG_KEY = 'appLang';
const langMap: Record<string, Lang> = { it: 'it', ru: 'ru' };

function detectLanguage(): Lang {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved && saved in translations) return saved as Lang;
  const lang = navigator.language?.slice(0, 2).toLowerCase();
  return langMap[lang] ?? 'en';
}

let currentLang: Lang = detectLanguage();
const listeners: Array<() => void> = [];

export function getLang(): Lang {
  return currentLang;
}

export function setLanguage(lang: Lang) {
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  listeners.forEach(fn => fn());
}

export function onLanguageChange(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function t(key: TranslationKey): string {
  return translations[currentLang][key] ?? translations.en[key];
}

const timeLocales: Record<Lang, string> = { it: 'it-IT', en: 'en-GB', ru: 'ru-RU' };

export function getTimeLocale(): string {
  return timeLocales[currentLang];
}

// ViaggiaTreno compRitardo array indices: 0=it, 1=en, 2=de, 3=fr, 4=es, 5=ro, 6=ja, 7=zh, 8=ru
const compRitardoIndex: Record<Lang, number> = { it: 0, en: 1, ru: 8 };

export function pickCompRitardo(arr: string[]): string {
  if (!arr || arr.length === 0) return '';
  const idx = compRitardoIndex[currentLang] ?? 1;
  const val = arr[idx]?.trim();
  if (val) return val;
  return arr[0]?.trim() || '';
}

export function formatDuration(diffMs: number): string {
  const h = Math.floor(diffMs / 3600000);
  const m = Math.round((diffMs % 3600000) / 60000);
  return `${h}${t('hours')} ${String(m).padStart(2, '0')}${t('min')}`;
}
