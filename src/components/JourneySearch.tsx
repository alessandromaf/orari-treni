import { useState, useRef, useEffect } from 'react';
import { searchStations, searchSolutions } from '../api/viaggiatreno';
import type { Station, JourneySolution } from '../types';

function toLocalDatetimeString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}

interface StationInputProps {
  label: string;
  value: Station | null;
  onSelect: (s: Station) => void;
  placeholder: string;
}

function StationInput({ label, value, onSelect, placeholder }: StationInputProps) {
  const [query, setQuery] = useState(value?.name || '');
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

  useEffect(() => {
    setQuery(value?.name || '');
  }, [value]);

  function handleInput(val: string) {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) { setResults([]); return; }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const stations = await searchStations(val);
      setResults(stations);
      setLoading(false);
      setShowDropdown(true);
    }, 300);
  }

  function handleSelect(station: Station) {
    setQuery(station.name);
    setShowDropdown(false);
    onSelect(station);
  }

  return (
    <div className="journey-field" ref={wrapperRef}>
      <label className="journey-label">{label}</label>
      <input
        type="text"
        className="journey-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => results.length > 0 && setShowDropdown(true)}
      />
      {showDropdown && (
        <div className="dropdown journey-dropdown">
          {loading && <div className="dropdown-item loading">Ricerca...</div>}
          {!loading && results.map((s) => (
            <button key={s.code} className="dropdown-item" onClick={() => handleSelect(s)}>
              {s.name}
            </button>
          ))}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="dropdown-item loading">Nessun risultato</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function JourneySearch() {
  const [origin, setOrigin] = useState<Station | null>(null);
  const [destination, setDestination] = useState<Station | null>(null);
  const [datetime, setDatetime] = useState<Date>(new Date());
  const [solutions, setSolutions] = useState<JourneySolution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  function handleSwap() {
    const tmp = origin;
    setOrigin(destination);
    setDestination(tmp);
  }

  async function handleSearch() {
    if (!origin || !destination) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const data = await searchSolutions(origin.code, destination.code, datetime);
      setSolutions(data);
    } catch {
      setError('Errore nella ricerca delle soluzioni');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="journey-search">
      <div className="journey-form">
        <div className="journey-stations">
          <StationInput
            label="Da"
            value={origin}
            onSelect={setOrigin}
            placeholder="Stazione di partenza"
          />
          <button className="swap-btn" onClick={handleSwap} aria-label="Inverti stazioni">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
          <StationInput
            label="A"
            value={destination}
            onSelect={setDestination}
            placeholder="Stazione di arrivo"
          />
        </div>

        <div className="journey-datetime">
          <label className="journey-label">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Data e ora di partenza
          </label>
          <input
            type="datetime-local"
            className="datetime-input"
            value={toLocalDatetimeString(datetime)}
            onChange={(e) => setDatetime(new Date(e.target.value))}
          />
        </div>

        <button
          className="search-btn"
          onClick={handleSearch}
          disabled={!origin || !destination || loading}
        >
          {loading ? 'Ricerca...' : 'Cerca soluzioni'}
        </button>
      </div>

      {loading && solutions.length === 0 && (
        <div className="board-status">
          <div className="spinner" />
          Ricerca soluzioni...
        </div>
      )}

      {error && <div className="board-status error">{error}</div>}

      {!loading && searched && !error && solutions.length === 0 && (
        <div className="board-status">Nessuna soluzione trovata</div>
      )}

      <div className="solutions-list">
        {solutions.map((sol, i) => (
          <SolutionCard key={i} solution={sol} />
        ))}
      </div>
    </div>
  );
}

function SolutionCard({ solution }: { solution: JourneySolution }) {
  const [expanded, setExpanded] = useState(false);
  const changes = solution.trains.length - 1;

  return (
    <div className="solution-card" onClick={() => setExpanded(!expanded)}>
      <div className="solution-header">
        <div className="solution-times">
          <span className="time">{solution.departureTime}</span>
          <span className="solution-arrow">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
          <span className="time">{solution.arrivalTime}</span>
        </div>
        <div className="solution-meta">
          <span className="solution-duration">{solution.duration}</span>
          {changes > 0 && (
            <span className="solution-changes">{changes} cambio{changes > 1 ? 'i' : ''}</span>
          )}
          {changes === 0 && (
            <span className="solution-direct">Diretto</span>
          )}
        </div>
      </div>

      <div className="solution-footer">
        <div className="solution-trains-summary">
          {solution.trains.map((t, j) => (
            <span key={j} className="train-badge">{t.name}</span>
          ))}
        </div>
        {solution.price && (
          <span className="solution-price">da {solution.price}</span>
        )}
      </div>

      {expanded && solution.trains.length > 0 && (
        <div className="solution-details">
          {solution.trains.map((train, j) => (
            <div key={j} className="solution-leg">
              <div className="leg-train">{train.name}</div>
              <div className="leg-stops">
                <div className="leg-stop">
                  <span className="leg-time">{train.departureTime}</span>
                  <span className="leg-station">{train.departureStation}</span>
                </div>
                <div className="leg-line" />
                <div className="leg-stop">
                  <span className="leg-time">{train.arrivalTime}</span>
                  <span className="leg-station">{train.arrivalStation}</span>
                </div>
              </div>
              {j < solution.trains.length - 1 && (
                <div className="leg-change">Cambio</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
