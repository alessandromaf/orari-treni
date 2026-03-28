import type { Train, BoardType } from '../types';
import { t } from '../i18n';

interface Props {
  train: Train;
  type: BoardType;
  onClick?: () => void;
}

function isCancelled(train: Train): boolean {
  // Check all languages in compRitardo for cancel/suppress keywords
  const hints = [
    ...(train.compRitardo || []),
    train.subTitle || '',
  ].join(' ').toLowerCase();
  return hints.includes('cancel') || hints.includes('soppress');
}

function getDelayClass(train: Train): string {
  if (!train.circolante) {
    return isCancelled(train) ? 'delay-cancelled' : 'delay-ontime';
  }
  if (train.ritardo <= 0) return 'delay-ontime';
  if (train.ritardo <= 10) return 'delay-small';
  return 'delay-big';
}

function formatDelay(train: Train): string {
  if (!train.circolante) {
    if (isCancelled(train)) return t('cancelled');
    return t('onTime');
  }
  if (train.ritardo === 0) return t('onTime');
  if (train.ritardo > 0) return `+${train.ritardo} ${t('min')}`;
  return `${train.ritardo} ${t('min')}`;
}

export default function TrainRow({ train, type, onClick }: Props) {
  const delayClass = getDelayClass(train);
  const time = type === 'partenze' ? train.compOrarioPartenza : train.compOrarioArrivo;
  const station = type === 'partenze' ? train.destinazione : train.origine;
  const platform =
    type === 'partenze'
      ? train.binarioEffettivoPartenzaDescrizione || train.binarioProgrammatoPartenzaDescrizione
      : train.binarioEffettivoArrivoDescrizione || train.binarioProgrammatoArrivoDescrizione;

  const trainLabel = train.categoriaDescrizione
    ? `${train.categoriaDescrizione} ${train.numeroTreno}`
    : `${train.categoria || ''} ${train.numeroTreno}`;

  return (
    <div className={`train-row ${!train.circolante && isCancelled(train) ? 'cancelled' : ''}`} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className="train-time">
        <span className="time">{time}</span>
        <span className={`delay ${delayClass}`}>
          {formatDelay(train)}
        </span>
      </div>
      <div className="train-info">
        <span className="train-number">{trainLabel.trim()}</span>
        <span className="train-station">{station}</span>
      </div>
      <div className="train-platform">
        {platform && (
          <>
            <span className="platform-label">{t('platform')}</span>
            <span className="platform-number">{platform}</span>
          </>
        )}
      </div>
    </div>
  );
}
