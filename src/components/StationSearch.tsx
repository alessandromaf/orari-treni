import { useState, useEffect, useRef } from 'react';
import { searchStations } from '../api/viaggiatreno';
import type { Station } from '../types';

const POPULAR_STATIONS: Station[] = [
  { name: 'Milano Centrale', code: 'S01700' },
  { name: 'Roma Termini', code: 'S08409' },
  { name: 'Napoli Centrale', code: 'S09218' },
  { name: 'Torino Porta Nuova', code: 'S00219' },
  { name: 'Bologna Centrale', code: 'S05043' },
  { name: 'Firenze S.M.N.', code: 'S05014' },
  { name: 'Venezia Santa Lucia', code: 'S02430' },
];

const RECENT_KEY = 'recentStations';

function getRecentStations(): Station[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRecentStation(station: Station) {
  const recent = getRecentStations().filter((s) => s.code !== station.code);
  recent.unshift(station);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 5)));
}

interface Props {
  onSelect: (station: Station) => void;
  selectedStation: Station | null;
}

export default function StationSearch({ onSelect, selectedStation }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Station[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInput(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const stations = await searchStations(value);
      setResults(stations);
      setLoading(false);
      setShowDropdown(true);
    }, 300);
  }

  function handleSelect(station: Station) {
    setQuery(station.name);
    setShowDropdown(false);
    saveRecentStation(station);
    onSelect(station);
  }

  function handleFocus() {
    if (query.length < 2) {
      setShowDropdown(true);
    } else if (results.length > 0) {
      setShowDropdown(true);
    }
  }

  function handleClear() {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  }

  const recentStations = getRecentStations();

  return (
    <div className="station-search" ref={wrapperRef}>
      <div className="search-input-wrapper">
        <svg className="search-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Cerca stazione..."
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={handleFocus}
          className="search-input"
        />
        {query && (
          <button className="clear-btn" onClick={handleClear} aria-label="Cancella">
            &times;
          </button>
        )}
      </div>

      {selectedStation && (
        <div className="selected-station">
          <span>{selectedStation.name}</span>
        </div>
      )}

      {showDropdown && (
        <div className="dropdown">
          {loading && <div className="dropdown-item loading">Ricerca...</div>}

          {!loading && results.length > 0 && (
            <>
              {results.map((station) => (
                <button
                  key={station.code}
                  className="dropdown-item"
                  onClick={() => handleSelect(station)}
                >
                  {station.name}
                </button>
              ))}
            </>
          )}

          {!loading && query.length < 2 && (
            <>
              {recentStations.length > 0 && (
                <>
                  <div className="dropdown-header">Recenti</div>
                  {recentStations.map((station) => (
                    <button
                      key={`recent-${station.code}`}
                      className="dropdown-item"
                      onClick={() => handleSelect(station)}
                    >
                      {station.name}
                    </button>
                  ))}
                </>
              )}
              <div className="dropdown-header">Stazioni principali</div>
              {POPULAR_STATIONS.map((station) => (
                <button
                  key={`pop-${station.code}`}
                  className="dropdown-item"
                  onClick={() => handleSelect(station)}
                >
                  {station.name}
                </button>
              ))}
            </>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="dropdown-item loading">Nessun risultato</div>
          )}
        </div>
      )}
    </div>
  );
}
