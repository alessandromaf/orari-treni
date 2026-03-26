import { useState } from 'react';
import StationSearch from './components/StationSearch';
import DepartureBoard from './components/DepartureBoard';
import TrainSearch from './components/TrainSearch';
import JourneySearch from './components/JourneySearch';
import type { Station, AppView } from './types';
import './styles/app.css';

export default function App() {
  const [station, setStation] = useState<Station | null>(null);
  const [view, setView] = useState<AppView>('stazione');

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
          Orari Treni
        </h1>
      </header>

      <main className="main-content">
        {view === 'stazione' && (
          <>
            <StationSearch onSelect={setStation} selectedStation={station} />
            {station && <DepartureBoard station={station} />}
          </>
        )}
        {view === 'treno' && <TrainSearch />}
        {view === 'viaggio' && <JourneySearch />}
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
          <span>Stazione</span>
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
          <span>Treno</span>
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
          <span>Cerca viaggio</span>
        </button>
      </nav>
    </div>
  );
}
