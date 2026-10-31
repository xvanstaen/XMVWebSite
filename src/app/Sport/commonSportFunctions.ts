import { classPointOfRef, classNewLoop, classFilePerf, classTabPoR, classHeaderFileSport, PerfLeg } from './classSport';
import { formatHHMNSS } from './../MyStdFunctions';

// fields copied by copyLegInOut (the persisted ones)
const LOOP_FIELDS = ['dist', 'exclude', 'from', 'to', 'loop', 'loopDel', 'perfRecordFrom', 'perfRecordTo',
  'speed', 'strTime', 'theTime'] as const;

/** speed in km/h from a distance in km and a time in seconds (0 when no time elapsed) */
function speedKmh(distKm: number, seconds: number): number {
  return seconds > 0 ? distKm * 1000 / seconds * 3.6 : 0;
}

export function fillHeaderFile(inHeader: any, outHeader: classHeaderFileSport): classHeaderFileSport {
  outHeader.circuit = inHeader.circuit;
  outHeader.codeName = inHeader.codeName;
  outHeader.fileType = inHeader.fileType;
  outHeader.name = inHeader.name;
  outHeader.sport = inHeader.sport;
  outHeader.theDate = inHeader.theDate;
  outHeader.refPoints = inHeader.refPoints ?? [];
  return outHeader;
}

/** records of the perf file which carry a PoR, with their record number */
export function updateTabPor(filePerf: Array<classFilePerf>): Array<classTabPoR> {
  const tabPerfPoR: Array<classTabPoR> = [];
  filePerf.forEach((rec, i) => {
    if (rec.refPoR !== "") {
      const item = new classTabPoR;
      item.recNb = i;
      item.content = rec;
      tabPerfPoR.push(item);
    }
  });
  return tabPerfPoR;
}

/** initial values of a leg/loop taken from the perf record holding the PoR (kept for existing callers) */
export function copyInitPerf(j: number, k: number, i: number, perfCircuit: Array<PerfLeg>, perfPoR: Array<classTabPoR>) {
  const loop = perfCircuit[j].newLoop[k];
  const por = perfPoR[i];
  loop.dist = por.content.dist;
  loop.perfRecordFrom = por.recNb;
  loop.lon = por.content.lon;
  loop.lat = por.content.lat;
  loop.exclude = por.content.exclude;
  return perfCircuit;
}

export function createPerfTotal(perfCircuit: Array<PerfLeg>, perfTotalCircuit: Array<any>) {
  perfTotalCircuit.splice(0, perfTotalCircuit.length);
  perfTotalCircuit.push({ newLoop: [] });
  for (let iLoop = 0; iLoop < perfCircuit[0].newLoop.length; iLoop++) {
    perfTotalCircuit[0].newLoop.push({ dist: 0, theTime: 0, speed: 0, strTime: "", from: "", to: "" });
    perfTotalCircuit = reinitTotal(iLoop, perfCircuit, perfTotalCircuit);
  }
  return perfTotalCircuit;
}

export function reinitTotal(jLoop: number, perfCircuit: Array<PerfLeg>, perfTotalCircuit: Array<any>) {
  const total = perfTotalCircuit[0].newLoop[jLoop];
  total.dist = 0;
  total.theTime = 0;
  for (const leg of perfCircuit) {
    const loop = leg.newLoop[jLoop];
    if (loop !== undefined && loop.exclude === "" && loop.dist !== 0) {
      total.dist += loop.dist;
      total.theTime += loop.theTime;
    }
  }
  total.strTime = formatHHMNSS(total.theTime);
  total.speed = speedKmh(total.dist, total.theTime);
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
  const src: any = inFile[iLeg].newLoop[jLoop];
  const dst: any = outFile[iLeg].newLoop[jLoop];
  for (const f of LOOP_FIELDS) {
    dst[f] = src[f];
  }
  return outFile;
}

export function copyLoopInOut(inFile: Array<PerfLeg>, outFile: Array<PerfLeg>, jLoop: number) {
  for (let i = 0; i < inFile.length; i++) {
    outFile = copyLegInOut(inFile, outFile, i, jLoop);
  }
  return outFile;
}

/**
 * Name of the cloud file for a perf file analysed against a circuit.
 * kind: 'perf' (perfCircuit file) or 'cPOR' (circuitPOR file).
 * Does NOT mutate its inputs (all '/' are removed from the date).
 */
export function perfFileName(sport: string, circuitCode: string, kind: 'perf' | 'cPOR', theDate: string, perfName: string): string {
  return sport.charAt(0).toUpperCase() + '-' + circuitCode + '-' + kind + '-' + theDate.replaceAll('/', '') + perfName.substring(0, 35);
}

/**
 * Builds the loops of a circuit from the PoR already stored in the perf file
 * (no distance checking). Pure function: returns the new structure.
 */
export function buildPerfCircuitRef(points: Array<classPointOfRef>, initPerfPoR: Array<classTabPoR>,
                                    filePerf: Array<classFilePerf>): Array<PerfLeg> {
  const nbLegs = points.length;
  const ref: Array<PerfLeg> = [];
  if (nbLegs === 0) { return ref; }

  points.forEach((p, j) => {
    const loop = new classNewLoop;
    loop.from = p.ref;
    loop.to = points[(j + 1) % nbLegs].ref;
    ref.push({ newLoop: [loop] });
  });

  const addLoopToAllLegs = () => ref.forEach(leg => leg.newLoop.push(new classNewLoop));
  const lastLoop = (leg: number) => ref[leg].newLoop.length - 1;
  const findLeg = (porName: string, start: number) => {
    let j = start;
    while (j < nbLegs && points[j].ref !== porName) { j++; }
    return j;
  };

  // dispatch every PoR of the perf file into its leg / loop
  let j = 0;
  for (let i = 0; i < initPerfPoR.length; i++) {
    const porName = initPerfPoR[i].content.refPoR;
    const isLastPoR = i === initPerfPoR.length - 1;
    j = findLeg(porName, j);
    if (j < nbLegs) {
      if (ref[j].newLoop[lastLoop(j)].dist !== 0) { addLoopToAllLegs(); }
      copyInitPerf(j, lastLoop(j), i, ref, initPerfPoR);
    } else if (!isLastPoR) {
      // end of circuit reached without finding it: start a new loop and search again from the beginning
      addLoopToAllLegs();
      j = findLeg(porName, 0);
      if (j < nbLegs) { copyInitPerf(j, lastLoop(j), i, ref, initPerfPoR); }
    }
    if (j === nbLegs - 1 && !isLastPoR) {
      addLoopToAllLegs();
      j = 0;
    }
  }

  // compute dist / time / speed of every leg
  for (let i = 0; i < nbLegs; i++) {
    const isLastLeg = i === nbLegs - 1;
    const nbLoops = ref[i].newLoop.length;
    for (let jl = 0; jl < nbLoops; jl++) {
      const loop = ref[i].newLoop[jl];
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
  if (i === nbLegs) { ref.forEach(leg => leg.newLoop.splice(iLoop, 1)); }

  return ref;
}
