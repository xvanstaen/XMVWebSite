import { classPointOfRef, classNewLoop, classFilePerf, classTabPoR, classHeaderFileSport, PerfLeg } from './classSport';
import { formatHHMNSS } from './../MyStdFunctions';

// fields copied by copyLegInOut (the persisted ones)
const LOOP_FIELDS = ['dist', 'exclude', 'from', 'to', 'loop', 'loopDel', 'perfRecordFrom', 'perfRecordTo',
  'speed', 'strTime', 'theTime'] as const;

/** one loop of the totals row (subset of classNewLoop) */
export type TotalLoop = Pick<classNewLoop, 'dist' | 'theTime' | 'speed' | 'strTime' | 'from' | 'to'>;
export interface PerfTotal { newLoop: TotalLoop[]; }

/** speed in km/h from a distance in km and a time in seconds (0 when no time elapsed) */
function speedKmh(distKm: number, seconds: number): number {
  return seconds > 0 ? distKm * 3600 / seconds : 0;
}

/** generic copy of a list of keys: keeps dst[k] = src[k] type-safe without 'any' */
function copyFields<K extends keyof classNewLoop>(dst: classNewLoop, src: classNewLoop, keys: readonly K[]): void {
  for (const k of keys) {
    dst[k] = src[k];
  }
}

/** initial values of a loop taken from the perf record holding the PoR */
function applyInitPerf(loop: classNewLoop, por: classTabPoR): void {
  const rec = por.content;
  loop.dist = rec.dist;
  loop.perfRecordFrom = por.recNb;
  loop.lon = rec.lon;
  loop.lat = rec.lat;
  loop.exclude = rec.exclude;
}

export function fillHeaderFile(inHeader: Partial<classHeaderFileSport>, outHeader: classHeaderFileSport): classHeaderFileSport {
  outHeader.circuit = inHeader.circuit!;
  outHeader.codeName = inHeader.codeName!;
  outHeader.fileType = inHeader.fileType!;
  outHeader.name = inHeader.name!;
  outHeader.sport = inHeader.sport!;
  outHeader.theDate = inHeader.theDate!;
  outHeader.refPoints = inHeader.refPoints ?? [];
  return outHeader;
}

/** records of the perf file which carry a PoR, with their record number */
export function updateTabPor(filePerf: Array<classFilePerf>): Array<classTabPoR> {
  const tabPerfPoR: Array<classTabPoR> = [];
  for (let i = 0; i < filePerf.length; i++) {
    if (filePerf[i].refPoR !== "") {
      const item = new classTabPoR();
      item.recNb = i;
      item.content = filePerf[i];
      tabPerfPoR.push(item);
    }
  }
  return tabPerfPoR;
}

/** initial values of a leg/loop taken from the perf record holding the PoR (kept for existing callers) */
export function copyInitPerf(j: number, k: number, i: number, perfCircuit: Array<PerfLeg>, perfPoR: Array<classTabPoR>) {
  applyInitPerf(perfCircuit[j].newLoop[k], perfPoR[i]);
  return perfCircuit;
}

export function createPerfTotal(perfCircuit: Array<PerfLeg>, perfTotalCircuit: Array<PerfTotal>) {
  const nbLoops = perfCircuit[0]?.newLoop.length ?? 0;
  const newLoop: TotalLoop[] = Array.from({ length: nbLoops },
    () => ({ dist: 0, theTime: 0, speed: 0, strTime: "", from: "", to: "" }));
  perfTotalCircuit.length = 0;
  perfTotalCircuit.push({ newLoop });
  for (let iLoop = 0; iLoop < nbLoops; iLoop++) {
    reinitTotal(iLoop, perfCircuit, perfTotalCircuit);
  }
  return perfTotalCircuit;
}

export function reinitTotal(jLoop: number, perfCircuit: Array<PerfLeg>, perfTotalCircuit: Array<PerfTotal>) {
  const total = perfTotalCircuit[0].newLoop[jLoop];
  let dist = 0;
  let time = 0;
  for (const leg of perfCircuit) {
    const loop = leg.newLoop[jLoop];
    if (loop !== undefined && loop.exclude === "" && loop.dist !== 0) {
      dist += loop.dist;
      time += loop.theTime;
    }
  }
  total.dist = dist;
  total.theTime = time;
  total.strTime = formatHHMNSS(time);
  total.speed = speedKmh(dist, time);
  return perfTotalCircuit;
}

/** deep copy of every leg appended to outFile */
export function copyInOut(inFile: Array<PerfLeg>, outFile: Array<PerfLeg>) {
  for (const leg of inFile) {
    outFile.push(structuredClone(leg));
  }
  return outFile;
}

export function copyLegInOut(inFile: Array<PerfLeg>, outFile: Array<PerfLeg>, iLeg: number, jLoop: number) {
  copyFields(outFile[iLeg].newLoop[jLoop], inFile[iLeg].newLoop[jLoop], LOOP_FIELDS);
  return outFile;
}

export function copyLoopInOut(inFile: Array<PerfLeg>, outFile: Array<PerfLeg>, jLoop: number) {
  for (let i = 0; i < inFile.length; i++) {
    copyLegInOut(inFile, outFile, i, jLoop);
  }
  return outFile;
}

/**
 * Name of the cloud file for a perf file analysed against a circuit.
 * kind: 'perf' (perfCircuit file) or 'cPOR' (circuitPOR file).
 * Does NOT mutate its inputs (all '/' are removed from the date).
 */
export function perfFileName(sport: string, circuitCode: string, kind: 'perf' | 'cPOR', theDate: string, perfName: string): string {
  return `${sport.charAt(0).toUpperCase()}-${circuitCode}-${kind}-${theDate.replaceAll('/', '')}${perfName.substring(0, 35)}`;
}

/**
 * Builds the loops of a circuit from the PoR already stored in the perf file
 * (no distance checking). Pure function: returns the new structure.
 */
export function buildPerfCircuitRef(points: Array<classPointOfRef>, initPerfPoR: Array<classTabPoR>,
                                    filePerf: Array<classFilePerf>): Array<PerfLeg> {
  const nbLegs = points.length;
  if (nbLegs === 0) { return []; }

  const ref: Array<PerfLeg> = points.map((p, j) => {
    const loop = new classNewLoop();
    loop.from = p.ref;
    loop.to = points[(j + 1) % nbLegs].ref;
    return { newLoop: [loop] };
  });

  // lookup built once: PoR name -> leg indexes (ascending), instead of rescanning points for every PoR
  const legsByName = new Map<string, number[]>();
  points.forEach((p, j) => {
    const list = legsByName.get(p.ref);
    if (list) { list.push(j); } else { legsByName.set(p.ref, [j]); }
  });
  /** first leg >= start named porName, or nbLegs when none */
  const findLeg = (porName: string, start: number): number =>
    legsByName.get(porName)?.find(j => j >= start) ?? nbLegs;

  const addLoopToAllLegs = () => { for (const leg of ref) { leg.newLoop.push(new classNewLoop()); } };
  const lastLoopOf = (leg: number) => ref[leg].newLoop[ref[leg].newLoop.length - 1];

  // dispatch every PoR of the perf file into its leg / loop
  let j = 0;
  const lastPoR = initPerfPoR.length - 1;
  for (let i = 0; i <= lastPoR; i++) {
    const por = initPerfPoR[i];
    const isLastPoR = i === lastPoR;
    j = findLeg(por.content.refPoR, j);
    if (j < nbLegs) {
      if (lastLoopOf(j).dist !== 0) { addLoopToAllLegs(); }
      applyInitPerf(lastLoopOf(j), por);
    } else if (!isLastPoR) {
      // end of circuit reached without finding it: start a new loop and search again from the beginning
      addLoopToAllLegs();
      j = findLeg(por.content.refPoR, 0);
      if (j < nbLegs) { applyInitPerf(lastLoopOf(j), por); }
    }
    if (j === nbLegs - 1 && !isLastPoR) {
      addLoopToAllLegs();
      j = 0;
    }
  }

  // compute dist / time / speed of every leg
  for (let i = 0; i < nbLegs; i++) {
    const isLastLeg = i === nbLegs - 1;
    const loops = ref[i].newLoop;
    const nbLoops = loops.length;
    for (let jl = 0; jl < nbLoops; jl++) {
      const loop = loops[jl];
      if (isLastLeg) {
        if (jl < nbLoops - 1) { loop.perfRecordTo = ref[0].newLoop[jl + 1].perfRecordFrom; }
      } else {
        loop.perfRecordTo = ref[i + 1].newLoop[jl].perfRecordFrom;
      }
      if (loop.perfRecordFrom !== 0 && loop.perfRecordTo !== 0) {
        const from = filePerf[loop.perfRecordFrom];
        const to = filePerf[loop.perfRecordTo];
        loop.dist = to.dist - from.dist;
        loop.theTime = to.time - from.time;
        loop.strTime = formatHHMNSS(loop.theTime);
        loop.speed = speedKmh(loop.dist, loop.theTime);
      }
    }
  }

  // drop the last loop when no leg (except the first) has been reached in it
  const iLoop = ref[0].newLoop.length - 1;
  let i = 1;
  while (i < nbLegs && ref[i].newLoop[iLoop].perfRecordFrom === 0) { i++; }
  if (i === nbLegs) { for (const leg of ref) { leg.newLoop.splice(iLoop, 1); } }

  return ref;
}
