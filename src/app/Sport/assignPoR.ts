

// perf-por.util.ts
import { classCircuitRec, classFilePerf, classPointOfRef } from './classSport';

export interface PoRMatch {
  ref: string;
  index: number;      // index in the samples array
  time: number;
  dist: number;
  deviationM: number;
}

export interface UpdateOptions {
  toleranceFactor?: number;  // multiplies varLat/varLon (default 1)
  maxGapSamples?: number;    // max gap inside one pass over a PoR (default 15)
  clearExisting?: boolean;   // default true
}

export interface UpdateResult {
  filePerf: classFilePerf[];  // new array, same rows with refPoR updated
  matches: PoRMatch[];
  notFound: string[];
  codeName: string;           // circuit.code
  circuitName: string;        // circuit.name
  refPoints: string[];        // PoR names found
}

const M_PER_DEG = 111_320;

function distMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dy = (lat1 - lat2) * M_PER_DEG;
  const dx = (lon1 - lon2) * M_PER_DEG * Math.cos((lat2 * Math.PI) / 180);
  return Math.hypot(dx, dy);
}

export function updatePerfRefPoints(
  samples: classFilePerf[],
  circuits: classCircuitRec[],
  circuitCode = 'SI-2',
  options: UpdateOptions = {}
): UpdateResult {
  const { toleranceFactor = 1, maxGapSamples = 15, clearExisting = true } = options;

  const circuit = circuits.find(
    c => c.code.trim().toUpperCase() === circuitCode.trim().toUpperCase()
  );
  if (!circuit) throw new Error(`Circuit ${circuitCode} not found`);

  // SI-2 lists the same PoR twice (out and back): one entry per place.
  const uniquePoints: classPointOfRef[] = [
    ...new Map(
      circuit.points.map(p => [`${p.ref}|${p.lat}|${p.lon}`, p] as const)
    ).values(),
  ];

  const candidates = new Map<number, PoRMatch>();

  for (const p of uniquePoints) {
    const tolLat = p.varLat * toleranceFactor;
    const tolLon = p.varLon * toleranceFactor;
    const prioKey: 'lat' | 'lon' = p.prio === 'lon' ? 'lon' : 'lat';

    let cluster: number[] = [];
    let last = -Infinity;

    const flush = () => {
      if (!cluster.length) return;
      let best = cluster[0];
      let bestPrio = Infinity;
      let bestDist = Infinity;
      for (const i of cluster) {
        const s = samples[i];
        const prioDev = Math.abs(s[prioKey] - p[prioKey]);
        const d = distMeters(s.lat, s.lon, p.lat, p.lon);
        if (prioDev < bestPrio || (prioDev === bestPrio && d < bestDist)) {
          best = i; bestPrio = prioDev; bestDist = d;
        }
      }
      const match: PoRMatch = {
        ref: p.ref, index: best, time: samples[best].time,
        dist: samples[best].dist, deviationM: bestDist,
      };
      const existing = candidates.get(best);
      if (!existing || match.deviationM < existing.deviationM) candidates.set(best, match);
      cluster = [];
    };

    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      if (Math.abs(s.lat - p.lat) > tolLat || Math.abs(s.lon - p.lon) > tolLon) continue;
      if (cluster.length && i - last > maxGapSamples) flush();
      cluster.push(i);
      last = i;
    }
    flush();
  }

  const matches = [...candidates.values()].sort((a, b) => a.index - b.index);
  const matchedRefs = new Set(matches.map(m => m.ref));
  const notFound = uniquePoints.map(p => p.ref).filter(r => !matchedRefs.has(r));

  const filePerf: classFilePerf[] = samples.map(s =>
    clearExisting && s.refPoR ? { ...s, refPoR: '' } : s
  );
  for (const m of matches) filePerf[m.index] = { ...filePerf[m.index], refPoR: m.ref };

  return {
    filePerf, matches, notFound,
    codeName: circuit.code,
    circuitName: circuit.name,
    refPoints: [...matchedRefs],
  };
}