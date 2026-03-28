export interface Station {
  name: string;
  code: string;
}

export interface Train {
  numeroTreno: number;
  categoria: string;
  categoriaDescrizione: string;
  destinazione: string;
  origine: string;
  compOrarioPartenza: string;
  compOrarioArrivo: string;
  compRitardo: string[];
  ritardo: number;
  binarioEffettivoPartenzaDescrizione: string;
  binarioProgrammatoPartenzaDescrizione: string;
  binarioEffettivoArrivoDescrizione: string;
  binarioProgrammatoArrivoDescrizione: string;
  circolante: boolean;
  codOrigine: string;
  dataPartenzaTreno: number;
  compNumeroTreno: string;
  subTitle: string;
  inStazione: boolean;
  hpilesito: string;
  provpilesito: string;
}

export type BoardType = 'partenze' | 'arrivi';

export type AppView = 'stazione' | 'treno' | 'viaggio';

export interface JourneySolution {
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  trains: JourneyTrain[];
  price: string | null;
  status: string;
}

export interface JourneyTrain {
  name: string;
  trainNumber: number | null;
  departureStation: string;
  arrivalStation: string;
  departureTime: string;
  arrivalTime: string;
}

export interface TrainStop {
  stazione: string;
  programmata: string | null;
  effettiva: string | null;
  ritardo: number;
  tipo: 'P' | 'F' | 'A'; // Partenza, Fermata, Arrivo
  binario: string;
  actualFermpilesito?: string;
}

export interface TrainStatus {
  numeroTreno: number;
  compNumeroTreno: string;
  categoria: string;
  categoriaDescrizione: string;
  origine: string;
  destinazione: string;
  orarioPartenza: number | null;
  orarioArrivo: number | null;
  ritardo: number;
  compRitardo: string[];
  tipoTreno: string;
  circolante: boolean;
  provpilesito: string;
  stops: TrainStop[];
  subTitle: string;
  lastDetection: string;
}
