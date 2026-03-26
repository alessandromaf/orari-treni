import type { Train, BoardType } from '../types';

interface Props {
  train: Train;
  type: BoardType;
}

function getDelayClass(ritardo: number, circolante: boolean): string {
  if (!circolante) return 'delay-cancelled';
  if (ritardo <= 0) return 'delay-ontime';
  if (ritardo <= 10) return 'delay-small';
  return 'delay-big';
}

function formatDelay(ritardo: number, circolante: boolean): string {
  if (!circolante) return 'Cancellato';
  if (ritardo === 0) return 'In orario';
  if (ritardo > 0) return `+${ritardo} min`;
  return `${ritardo} min`;
}

export default function TrainRow({ train, type }: Props) {
  const delayClass = getDelayClass(train.ritardo, train.circolante);
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
    <div className={`train-row ${!train.circolante ? 'cancelled' : ''}`}>
      <div className="train-time">
        <span className="time">{time}</span>
        <span className={`delay ${delayClass}`}>
          {formatDelay(train.ritardo, train.circolante)}
        </span>
      </div>
      <div className="train-info">
        <span className="train-number">{trainLabel.trim()}</span>
        <span className="train-station">{station}</span>
      </div>
      <div className="train-platform">
        {platform && (
          <>
            <span className="platform-label">Bin.</span>
            <span className="platform-number">{platform}</span>
          </>
        )}
      </div>
    </div>
  );
}
