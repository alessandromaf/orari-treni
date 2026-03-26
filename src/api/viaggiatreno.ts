import type { Station, Train, JourneySolution, TrainStatus, TrainStop } from '../types';

const API_BASE = '/api';
const BFF_WORKER = 'https://orari-treni-bff.alessandro-000.workers.dev';

export async function searchStations(query: string): Promise<Station[]> {
  if (query.length < 2) return [];

  const res = await fetch(`${API_BASE}/autocompletaStazione/${encodeURIComponent(query)}`);
  const text = await res.text();

  if (!text.trim()) return [];

  return text
    .trim()
    .split('\n')
    .map((line) => {
      const parts = line.split('|');
      return {
        name: parts[0].trim(),
        code: parts[1]?.trim() || '',
      };
    })
    .filter((s) => s.code);
}

export async function getDepartures(stationCode: string, datetime?: Date): Promise<Train[]> {
  const date = datetime || new Date();
  const dateStr = formatDateForApi(date);
  const res = await fetch(`${API_BASE}/partenze/${stationCode}/${encodeURIComponent(dateStr)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getArrivals(stationCode: string, datetime?: Date): Promise<Train[]> {
  const date = datetime || new Date();
  const dateStr = formatDateForApi(date);
  const res = await fetch(`${API_BASE}/arrivi/${stationCode}/${encodeURIComponent(dateStr)}`);
  if (!res.ok) return [];
  return res.json();
}

export interface TrainAutocompleteResult {
  label: string;       // e.g. "9514 - NAPOLI CENTRALE"
  trainNum: number;
  originCode: string;
}

export async function searchTrainNumber(trainNumber: string): Promise<TrainAutocompleteResult[]> {
  if (!trainNumber.trim()) return [];
  const res = await fetch(`${API_BASE}/cercaNumeroTrenoTrenoAutocomplete/${encodeURIComponent(trainNumber)}`);
  const text = await res.text();
  if (!text.trim()) return [];

  // Response format: "trainNum - originStation|trainNum-originCode\n..."
  return text.trim().split('\n').map((line) => {
    const [label, key] = line.split('|');
    if (!key) return null;
    const [trainNum, originCode] = key.split('-');
    return {
      label: label.trim(),
      trainNum: parseInt(trainNum.trim(), 10),
      originCode: originCode.trim(),
    };
  }).filter((r): r is TrainAutocompleteResult => r !== null);
}

export async function getTrainStatus(originCode: string, trainNumber: number): Promise<TrainStatus | null> {
  // Need departure date — use today at midnight
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const depDate = now.getTime();
  const res = await fetch(`${API_BASE}/andamentoTreno/${originCode}/${trainNumber}/${depDate}`);
  if (!res.ok) return null;

  const data = await res.json();
  if (!data) return null;

  const formatTime = (ts: number | null) => {
    if (!ts) return null;
    return new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stops: TrainStop[] = (data.fermate || []).map((f: any) => ({
    stazione: f.stazione || '',
    programmata: formatTime(f.programmata),
    effettiva: formatTime(f.effettiva),
    ritardo: f.ritardoPartenza ?? f.ritardoArrivo ?? 0,
    tipo: f.tipoFermata as 'P' | 'F' | 'A',
    binario: f.binarioEffettivoPartenzaDescrizione || f.binarioProgrammatoPartenzaDescrizione || f.binarioEffettivoArrivoDescrizione || f.binarioProgrammatoArrivoDescrizione || '',
    actualFermpilesito: f.actualFermataType?.toString() || '',
  }));

  return {
    numeroTreno: data.numeroTreno,
    compNumeroTreno: data.compNumeroTreno || `${data.numeroTreno}`,
    categoria: data.categoria || '',
    categoriaDescrizione: data.categoriaDescrizione || data.categoria || '',
    origine: data.origine || '',
    destinazione: data.destinazione || '',
    orarioPartenza: data.orarioPartenza,
    orarioArrivo: data.orarioArrivo,
    ritardo: data.ritardo ?? 0,
    compRitardo: data.compRitardo || [],
    tipoTreno: data.tipoTreno || '',
    circolante: data.circolante ?? false,
    provpilesito: data.provpilesito || '',
    stops,
    subTitle: data.subTitle || '',
    lastDetection: data.stazioneUltimoRilevamento || '',
  };
}

function stationCodeToLocationId(code: string): number {
  const numeric = code.replace(/^S/, '');
  return parseInt(`8300${numeric}`, 10);
}

export async function searchSolutions(
  originCode: string,
  destCode: string,
  datetime: Date,
): Promise<JourneySolution[]> {
  const originId = stationCodeToLocationId(originCode);
  const destId = stationCodeToLocationId(destCode);

  const y = datetime.getFullYear();
  const m = String(datetime.getMonth() + 1).padStart(2, '0');
  const d = String(datetime.getDate()).padStart(2, '0');
  const h = String(datetime.getHours()).padStart(2, '0');
  const min = String(datetime.getMinutes()).padStart(2, '0');
  const isoTime = `${y}-${m}-${d}T${h}:${min}:00`;

  const res = await fetch(`${BFF_WORKER}/website/ticket/solutions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      departureLocationId: originId,
      arrivalLocationId: destId,
      departureTime: isoTime,
      adults: 1,
      children: 0,
      criteria: {
        frecceOnly: false,
        regionalOnly: false,
        noChanges: false,
        order: 'DEPARTURE_DATE',
        limit: 10,
        offset: 0,
      },
      advancedSearchRequest: {
        bestFare: false,
      },
    }),
  });

  if (!res.ok) return [];

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const solutions: any[] = data.solutions || [];

  const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return solutions.map((sol: any) => {
    const s = sol.solution;
    const depDate = new Date(s.departureTime);
    const arrDate = new Date(s.arrivalTime);
    const diffMs = arrDate.getTime() - depDate.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    const diffM = Math.round((diffMs % 3600000) / 60000);
    const duration = `${diffH}h ${String(diffM).padStart(2, '0')}min`;

    // Per-leg details come from nodes (each node = one train leg)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodes: any[] = s.nodes || [];
    const trains = nodes.map((node: any) => ({  // eslint-disable-line @typescript-eslint/no-explicit-any
      name: node.train
        ? `${node.train.trainCategory || node.train.acronym || ''} ${node.train.name || ''}`.trim()
        : '',
      departureStation: node.origin || '',
      arrivalStation: node.destination || '',
      departureTime: node.departureTime
        ? new Date(node.departureTime).toLocaleTimeString('it-IT', timeOpts)
        : '',
      arrivalTime: node.arrivalTime
        ? new Date(node.arrivalTime).toLocaleTimeString('it-IT', timeOpts)
        : '',
    }));

    const priceVal = s.price?.amount ?? null;
    const price = priceVal != null ? `${Number(priceVal).toFixed(2)} €` : null;

    return {
      origin: s.origin || '',
      destination: s.destination || '',
      departureTime: depDate.toLocaleTimeString('it-IT', timeOpts),
      arrivalTime: arrDate.toLocaleTimeString('it-IT', timeOpts),
      duration,
      trains,
      price,
      status: s.status || '',
    };
  });
}

function formatDateForApi(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const day = days[date.getDay()];
  const month = months[date.getMonth()];
  const dateNum = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, '0');
  const offsetMins = String(absOffset % 60).padStart(2, '0');

  return `${day} ${month} ${dateNum} ${year} ${hours}:${minutes}:${seconds} GMT${sign}${offsetHours}${offsetMins}`;
}
