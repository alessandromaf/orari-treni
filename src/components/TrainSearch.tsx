import { useState, useRef } from 'react';
import { searchTrainNumber, getTrainStatus } from '../api/viaggiatreno';
import type { TrainStatus } from '../types';

export default function TrainSearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [train, setTrain] = useState<TrainStatus | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function extractTrainNumber(input: string): string {
    // Strip category prefixes like "FR ", "REG ", "IC ", "FA ", "FB ", "ES ", etc.
    const cleaned = input.trim().replace(/^[A-Za-z]+\s*/i, '');
    // Return just the digits
    return cleaned.replace(/\D/g, '');
  }

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const num = extractTrainNumber(query);
    if (!num) return;

    setLoading(true);
    setError('');
    setTrain(null);

    try {
      const result = await searchTrainNumber(num);
      if (!result) {
        setError('Treno non trovato');
        setLoading(false);
        return;
      }

      const status = await getTrainStatus(result.originCode, result.trainNum);
      if (!status) {
        setError('Impossibile ottenere lo stato del treno');
        setLoading(false);
        return;
      }

      setTrain(status);
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  }

  function getDelayClass(delay: number) {
    if (delay <= 0) return 'delay-ontime';
    if (delay <= 10) return 'delay-small';
    return 'delay-big';
  }

  function getDelayText(delay: number) {
    if (delay < 0) return `${Math.abs(delay)} min anticipo`;
    if (delay === 0) return 'In orario';
    return `+${delay} min`;
  }

  function getStopStatus(stop: { effettiva: string | null; actualFermpilesito?: string }) {
    if (stop.effettiva) return 'visited';
    if (stop.actualFermpilesito === '1') return 'current';
    return 'upcoming';
  }

  return (
    <div className="train-search">
      <form className="train-search-form" onSubmit={handleSearch}>
        <div className="train-search-input-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            placeholder="Numero treno (es. FR 9514, 4612)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button type="button" className="clear-btn" onClick={() => { setQuery(''); setTrain(null); setError(''); inputRef.current?.focus(); }}>
              &times;
            </button>
          )}
        </div>
        <button type="submit" className="search-btn" disabled={!extractTrainNumber(query) || loading}>
          {loading ? 'Ricerca...' : 'Cerca treno'}
        </button>
      </form>

      {loading && (
        <div className="board-status"><div className="spinner" /></div>
      )}

      {error && (
        <div className="board-status error">{error}</div>
      )}

      {train && (
        <div className="train-detail">
          <div className="train-detail-header">
            <div className="train-detail-name">
              <span className="train-badge-large">{train.categoriaDescrizione} {train.compNumeroTreno}</span>
            </div>
            <div className={`train-detail-delay ${getDelayClass(train.ritardo)}`}>
              {getDelayText(train.ritardo)}
            </div>
          </div>

          <div className="train-detail-route">
            <div className="route-station">
              <span className="route-label">Da</span>
              <span className="route-name">{train.origine}</span>
            </div>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            <div className="route-station">
              <span className="route-label">A</span>
              <span className="route-name">{train.destinazione}</span>
            </div>
          </div>

          {train.lastDetection && (
            <div className="train-detail-detection">
              Ultimo rilevamento: <strong>{train.lastDetection}</strong>
            </div>
          )}

          <div className="train-stops-timeline">
            {train.stops.map((stop, i) => {
              const status = getStopStatus(stop);
              return (
                <div key={i} className={`timeline-stop ${status}`}>
                  <div className="timeline-dot-col">
                    <div className={`timeline-dot ${status}`} />
                    {i < train.stops.length - 1 && <div className={`timeline-line ${status}`} />}
                  </div>
                  <div className="timeline-info">
                    <div className="timeline-station">{stop.stazione}</div>
                    <div className="timeline-times">
                      <span className="timeline-prog">{stop.programmata || '--:--'}</span>
                      {stop.effettiva && stop.effettiva !== stop.programmata && (
                        <span className={`timeline-eff ${getDelayClass(stop.ritardo)}`}>{stop.effettiva}</span>
                      )}
                      {stop.effettiva && stop.effettiva === stop.programmata && (
                        <span className="timeline-eff delay-ontime">{stop.effettiva}</span>
                      )}
                    </div>
                  </div>
                  {stop.binario && (
                    <div className="timeline-platform">
                      <span className="platform-label">Bin.</span>
                      <span className="platform-number">{stop.binario}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
