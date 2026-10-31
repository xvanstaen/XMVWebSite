import { classFilePerf } from './classSport';

export interface TcxLap {
  lap: number; date: string; time: string; dist: string; maxSpeed: number; maxHeart: string; avgHeart: string; cal: string;
}

/** text of the first descendant with this local name (namespace prefix ignored) */
const descendantText = (el: Element, tag: string) => el.getElementsByTagNameNS('*', tag)[0]?.textContent ?? '';

/** text of a DIRECT child with this local name (so a lap value is never confused with a trackpoint value) */
const childEl = (el: Element, tag: string) => Array.from(el.children).find(c => c.localName === tag);
const childText = (el: Element, tag: string) => childEl(el, tag)?.textContent ?? '';

/**
 * Converts a TCX text into laps (summary) and trackpoints (classFilePerf rows).
 * Parsed once with DOMParser: linear time and no limit on the number of laps
 * (the previous version stopped after 100 laps and re-copied the remaining text for every trackpoint).
 */
export function fromTCXtoJSON(event: { text: string }): { theLaps: Array<TcxLap>; thePerf: Array<classFilePerf> } {
  const theLaps: Array<TcxLap> = [];
  const thePerf: Array<classFilePerf> = [];

  const doc = new DOMParser().parseFromString(event.text, 'application/xml');
  if (doc.querySelector('parsererror')) {
    return { theLaps, thePerf };
  }

  const laps = doc.getElementsByTagNameNS('*', 'Lap');
  for (let n = 0; n < laps.length; n++) {
    const lap = laps[n];
    const avg = childEl(lap, 'AverageHeartRateBpm');
    const max = childEl(lap, 'MaximumHeartRateBpm');

    theLaps.push({
      lap: n + 1,
      date: lap.getAttribute('StartTime') ?? '',
      time: childText(lap, 'TotalTimeSeconds'),
      dist: childText(lap, 'DistanceMeters'),
      cal: childText(lap, 'Calories'),
      maxSpeed: Number(childText(lap, 'MaximumSpeed')) * 3.6,
      avgHeart: avg ? descendantText(avg, 'Value') : '',
      maxHeart: max ? descendantText(max, 'Value') : ''
    });

    const trackpoints = lap.getElementsByTagNameNS('*', 'Trackpoint');
    for (let t = 0; t < trackpoints.length; t++) {
      addTrackpoint(trackpoints[t], thePerf);
    }
  }
  return { theLaps, thePerf };
}

/** appends one <Trackpoint> to perf (speed in km/h, slope in %) */
export function addTrackpoint(tp: Element, perf: Array<classFilePerf>): Array<classFilePerf> {
  const rec = new classFilePerf;
  // the time stays the ISO string, as before (it is converted later by the perf file processing)
  (rec as any).time = descendantText(tp, 'Time');
  rec.lat = Number(descendantText(tp, 'LatitudeDegrees'));
  rec.lon = Number(descendantText(tp, 'LongitudeDegrees'));
  rec.alt = Number(descendantText(tp, 'AltitudeMeters'));
  rec.dist = Number(descendantText(tp, 'DistanceMeters'));
  rec.heart = Number(descendantText(tp, 'Value'));

  const prev = perf.length > 0 ? perf[perf.length - 1] : undefined;
  const speed = Number(descendantText(tp, 'Speed')) * 3.6;
  if (speed === 0 && prev) {
    // TODO check the unit: (dist diff) * 100 * 3.6 is kept as it was, but *100 looks suspicious
    rec.speed = (rec.dist - prev.dist) * 100 * 3.6;
  } else {
    rec.speed = speed;
  }

  if (prev) {
    const dd = prev.dist - rec.dist;
    rec.slope = dd !== 0 ? (prev.alt - rec.alt) / dd * 100 : 0;   // no more NaN / Infinity
  }
  perf.push(rec);
  return perf;
}

/** @deprecated text based version, kept only for existing callers; use addTrackpoint */
export function processTrackPoint(theString: string, perf: any) {
  const tabLabels = ['Time>', 'LatitudeDegrees>', 'LongitudeDegrees>', 'AltitudeMeters>', 'DistanceMeters>', 'Value>', 'ns3:Speed>'];
  const tabResults: Array<string> = [];
  for (let i = 0; i < tabLabels.length; i++) {
    const start = theString.indexOf('<' + tabLabels[i]) + tabLabels[i].length;
    const end = theString.indexOf('</' + tabLabels[i]);
    tabResults[i] = theString.substring(start + 1, end);
  }
  const thePerf = new classFilePerf;
  perf.push(thePerf);
  const last = perf[perf.length - 1];
  last.time = tabResults[0];
  last.lat = Number(tabResults[1]);
  last.lon = Number(tabResults[2]);
  last.alt = Number(tabResults[3]);
  last.dist = Number(tabResults[4]);
  last.heart = Number(tabResults[5]);
  if (Number(tabResults[6]) * 3.6 === 0 && perf.length > 1) {
    last.speed = (last.dist - perf[perf.length - 2].dist) * 100 * 3.6;
  } else {
    last.speed = Number(tabResults[6]) * 3.6;
  }
  if (perf.length > 1) {
    const dd = perf[perf.length - 2].dist - last.dist;
    last.slope = dd !== 0 ? (perf[perf.length - 2].alt - last.alt) / dd * 100 : 0;
  }
  return perf;
}
