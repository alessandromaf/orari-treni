import { useState, useEffect, useCallback } from 'react';
import { getDepartures, getArrivals } from '../api/viaggiatreno';
import TrainRow from './TrainRow';
import { t, getTimeLocale } from '../i18n';
import type { Station, Train, BoardType } from '../types';

interface Props {
  station: Station;
  onTrainClick?: (trainNumber: number, originCode: string) => void;
}

function toLocalDatetimeString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}

export default function DepartureBoard({ station, onTrainClick }: Props) {
  const [boardType, setBoardType] = useState<BoardType>('partenze');
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedDatetime, setSelectedDatetime] = useState<Date>(new Date());
  const [isCustomTime, setIsCustomTime] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const queryDate = isCustomTime ? selectedDatetime : new Date();
      const data =
        boardType === 'partenze'
          ? await getDepartures(station.code, queryDate)
          : await getArrivals(station.code, queryDate);
      setTrains(data);
      setLastUpdate(new Date());
    } catch {
      setError(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [station.code, boardType, selectedDatetime, isCustomTime]);

  useEffect(() => {
    fetchData();
    // Only auto-refresh when showing current time
    if (!isCustomTime) {
      const interval = setInterval(fetchData, 60000);
      return () => clearInterval(interval);
    }
  }, [fetchData, isCustomTime]);

  function handleDatetimeChange(value: string) {
    setSelectedDatetime(new Date(value));
    setIsCustomTime(true);
  }

  function handleResetToNow() {
    setSelectedDatetime(new Date());
    setIsCustomTime(false);
  }

  return (
    <div className="board">
      <div className="board-tabs">
        <button
          className={`tab ${boardType === 'partenze' ? 'active' : ''}`}
          onClick={() => setBoardType('partenze')}
        >
          {t('departures')}
        </button>
        <button
          className={`tab ${boardType === 'arrivi' ? 'active' : ''}`}
          onClick={() => setBoardType('arrivi')}
        >
          {t('arrivals')}
        </button>
      </div>

      <div className="datetime-picker">
        <div className="datetime-row">
          <label className="datetime-label">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {t('dateTime')}
          </label>
          {isCustomTime && (
            <button className="now-btn" onClick={handleResetToNow}>
              {t('now')}
            </button>
          )}
        </div>
        <input
          type="datetime-local"
          className="datetime-input"
          value={toLocalDatetimeString(isCustomTime ? selectedDatetime : new Date())}
          onChange={(e) => handleDatetimeChange(e.target.value)}
        />
      </div>

      {lastUpdate && (
        <div className="last-update">
          {t('updatedAt')} {lastUpdate.toLocaleTimeString(getTimeLocale(), { hour: '2-digit', minute: '2-digit' })}
          <button className="refresh-btn" onClick={fetchData} aria-label={t('refresh')}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>
      )}

      {loading && trains.length === 0 && (
        <div className="board-status">
          <div className="spinner" />
          {t('loading')}
        </div>
      )}

      {error && <div className="board-status error">{error}</div>}

      {!loading && !error && trains.length === 0 && (
        <div className="board-status">{t('noTrains')}</div>
      )}

      <div className="train-list">
        {trains.map((train, i) => (
          <TrainRow
            key={`${train.numeroTreno}-${i}`}
            train={train}
            type={boardType}
            onClick={onTrainClick ? () => onTrainClick(train.numeroTreno, train.codOrigine) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
