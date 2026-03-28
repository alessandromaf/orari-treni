import { useState, useEffect, useRef } from 'react';
import StationSearch from './components/StationSearch';
import DepartureBoard from './components/DepartureBoard';
import TrainSearch from './components/TrainSearch';
import JourneySearch from './components/JourneySearch';
import { t, getLang, setLanguage, onLanguageChange, SUPPORTED_LANGS } from './i18n';
import type { Station, AppView } from './types';
import './styles/app.css';

export default function App() {
  const [station, setStation] = useState<Station | null>(null);
  const [view, setView] = useState<AppView>('stazione');
  const [pendingTrain, setPendingTrain] = useState<{ trainNumber: number; originCode: string } | null>(null);
  const [, setLangTick] = useState(0);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => onLanguageChange(() => setLangTick(n => n + 1)), []);

  useEffect(() => {
    if (!langOpen) return;
    function close(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [langOpen]);

  function handleTrainClick(trainNumber: number, originCode: string) {
    setPendingTrain({ trainNumber, originCode });
    setView('treno');
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path d="M9 21v-4h6v4" />
            <path d="M8 7h8" />
            <path d="M8 11h8" />
            <circle cx="9" cy="15" r="1" />
            <circle cx="15" cy="15" r="1" />
          </svg>
          {t('appTitle')}
        </h1>
        <div className="lang-picker" ref={langRef}>
          <button className="lang-toggle" onClick={() => setLangOpen(!langOpen)} aria-label="Language">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <ellipse cx="12" cy="12" rx="4" ry="10" />
              <path d="M2 12h20" />
            </svg>
            <span className="lang-code">{getLang().toUpperCase()}</span>
          </button>
          {langOpen && (
            <div className="lang-dropdown">
              {SUPPORTED_LANGS.map(({ code, label }) => (
                <button
                  key={code}
                  className={`lang-option ${getLang() === code ? 'active' : ''}`}
                  onClick={() => { setLanguage(code); setLangOpen(false); }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        {view === 'stazione' && (
          <>
            <StationSearch onSelect={setStation} selectedStation={station} />
            {station && <DepartureBoard station={station} onTrainClick={handleTrainClick} />}
          </>
        )}
        {view === 'treno' && <TrainSearch initialTrain={pendingTrain} />}
        {view === 'viaggio' && <JourneySearch onTrainClick={handleTrainClick} />}
      </main>

      <nav className="bottom-nav">
        <button
          className={`nav-item ${view === 'stazione' ? 'active' : ''}`}
          onClick={() => setView('stazione')}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 3v18" />
          </svg>
          <span>{t('navStation')}</span>
        </button>
        <button
          className={`nav-item ${view === 'treno' ? 'active' : ''}`}
          onClick={() => setView('treno')}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="3" width="16" height="14" rx="2" />
            <path d="M9 17v4" />
            <path d="M15 17v4" />
            <path d="M7 21h10" />
            <path d="M8 7h8" />
            <path d="M8 11h8" />
          </svg>
          <span>{t('navTrain')}</span>
        </button>
        <button
          className={`nav-item ${view === 'viaggio' ? 'active' : ''}`}
          onClick={() => setView('viaggio')}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="5" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
            <line x1="7" y1="12" x2="17" y2="12" />
            <polyline points="14 8 17 12 14 16" />
          </svg>
          <span>{t('navJourney')}</span>
        </button>
      </nav>
    </div>
  );
}
