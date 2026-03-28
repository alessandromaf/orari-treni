import { useState, useRef, useEffect } from 'react';
import { searchStations, searchSolutions, searchTrainNumber, getTrainStatus } from '../api/viaggiatreno';
import { t } from '../i18n';
import type { Station, JourneySolution, TrainStatus } from '../types';

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
          {loading && <div className="dropdown-item loading">{t('search')}</div>}
          {!loading && results.map((s) => (
            <button key={s.code} className="dropdown-item" onClick={() => handleSelect(s)}>
              {s.name}
            </button>
          ))}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="dropdown-item loading">{t('noResults')}</div>
          )}
        </div>
      )}
    </div>
  );
}

interface JourneySearchProps {
  onTrainClick?: (trainNumber: number, originCode: string) => void;
}

export default function JourneySearch({ onTrainClick }: JourneySearchProps) {
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
      setError(t('searchError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="journey-search">
      <div className="journey-form">
        <div className="journey-stations">
          <StationInput
            label={t('from')}
            value={origin}
            onSelect={setOrigin}
            placeholder={t('departureStation')}
          />
          <button className="swap-btn" onClick={handleSwap} aria-label={t('swapStations')}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
          <StationInput
            label={t('to')}
            value={destination}
            onSelect={setDestination}
            placeholder={t('arrivalStation')}
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
            {t('departureDatetime')}
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
          {loading ? t('search') : t('searchSolutions')}
        </button>
      </div>

      {loading && solutions.length === 0 && (
        <div className="board-status">
          <div className="spinner" />
          {t('searchingSolutions')}
        </div>
      )}

      {error && <div className="board-status error">{error}</div>}

      {!loading && searched && !error && solutions.length === 0 && (
        <div className="board-status">{t('noSolutions')}</div>
      )}

      <div className="solutions-list">
        {solutions.map((sol, i) => (
          <SolutionCard key={i} solution={sol} onTrainClick={onTrainClick} />
        ))}
      </div>
    </div>
  );
}

function getDelayClass(delay: number) {
  if (delay <= 0) return 'delay-ontime';
  if (delay <= 10) return 'delay-small';
  return 'delay-big';
}

function getStatusDelayClass(ts: TrainStatus) {
  if (!ts.circolante) {
    const hints = [...(ts.compRitardo || []), ts.subTitle || ''].join(' ').toLowerCase();
    if (hints.includes('cancel') || hints.includes('soppress')) return 'delay-cancelled';
    return 'delay-ontime';
  }
  return getDelayClass(ts.ritardo);
}

function getStatusDelayText(ts: TrainStatus) {
  if (!ts.circolante) {
    const hints = [...(ts.compRitardo || []), ts.subTitle || ''].join(' ').toLowerCase();
    if (hints.includes('cancel') || hints.includes('soppress')) return t('cancelled');
    return t('onTime');
  }
  if (ts.ritardo === 0) return t('onTime');
  if (ts.ritardo > 0) return `+${ts.ritardo} ${t('min')}`;
  return `${ts.ritardo} ${t('min')}`;
}

interface SolutionCardProps {
  solution: JourneySolution;
  onTrainClick?: (trainNumber: number, originCode: string) => void;
}

function SolutionCard({ solution, onTrainClick }: SolutionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [trainStatuses, setTrainStatuses] = useState<Record<number, TrainStatus | null>>({});
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const fetchedRef = useRef(false);
  const changes = solution.trains.length - 1;

  useEffect(() => {
    if (!expanded || fetchedRef.current) return;
    fetchedRef.current = true;

    const trainNumbers = solution.trains
      .map(t => t.trainNumber)
      .filter((n): n is number => n !== null);

    if (trainNumbers.length === 0) return;

    setLoadingStatuses(true);

    Promise.all(
      trainNumbers.map(async (num) => {
        try {
          const results = await searchTrainNumber(String(num));
          if (!results.length) return { num, status: null, originCode: '' };
          const status = await getTrainStatus(results[0].originCode, results[0].trainNum);
          return { num, status, originCode: results[0].originCode };
        } catch {
          return { num, status: null, originCode: '' };
        }
      })
    ).then((results) => {
      const map: Record<number, TrainStatus | null> = {};
      for (const r of results) {
        if (r.status) map[r.num] = r.status;
      }
      setTrainStatuses(map);
      setLoadingStatuses(false);
    });
  }, [expanded, solution.trains]);

  function handleTrainClick(trainNumber: number | null, e: React.MouseEvent) {
    e.stopPropagation();
    if (!trainNumber || !onTrainClick) return;

    // Look up origin code from fetched statuses
    const status = trainStatuses[trainNumber];
    if (status) {
      // We have the status, use the origin code from the search
      searchTrainNumber(String(trainNumber)).then(results => {
        if (results.length) onTrainClick(trainNumber, results[0].originCode);
      });
    } else {
      // Fetch origin code on the fly
      searchTrainNumber(String(trainNumber)).then(results => {
        if (results.length) onTrainClick(trainNumber, results[0].originCode);
      });
    }
  }

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
            <span className="solution-changes">{changes} {changes > 1 ? t('changes') : t('change')}</span>
          )}
          {changes === 0 && (
            <span className="solution-direct">{t('direct')}</span>
          )}
        </div>
      </div>

      <div className="solution-footer">
        <div className="solution-trains-summary">
          {solution.trains.map((tr, j) => {
            const status = tr.trainNumber ? trainStatuses[tr.trainNumber] : null;
            return (
              <span key={j} className="train-badge">
                {tr.name}
                {status && (
                  <span className={`train-badge-delay ${getStatusDelayClass(status)}`}>
                    {' '}{getStatusDelayText(status)}
                  </span>
                )}
              </span>
            );
          })}
          {loadingStatuses && <span className="train-badge-loading" />}
        </div>
        {solution.price && (
          <span className="solution-price">{t('priceFrom')} {solution.price}</span>
        )}
      </div>

      {expanded && solution.trains.length > 0 && (
        <div className="solution-details">
          {solution.trains.map((train, j) => {
            const status = train.trainNumber ? trainStatuses[train.trainNumber] : null;
            return (
              <div key={j} className="solution-leg">
                <div
                  className={`leg-train ${onTrainClick && train.trainNumber ? 'leg-train-clickable' : ''}`}
                  onClick={onTrainClick && train.trainNumber ? (e) => handleTrainClick(train.trainNumber, e) : undefined}
                >
                  {train.name}
                  {status && (
                    <span className={`leg-delay ${getStatusDelayClass(status)}`}>
                      {getStatusDelayText(status)}
                    </span>
                  )}
                  {onTrainClick && train.trainNumber && (
                    <svg className="leg-train-arrow" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </div>
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
                  <div className="leg-change">{t('changeover')}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
