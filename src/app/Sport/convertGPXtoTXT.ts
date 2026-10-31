export interface GpxRow {
  lat: string; lon: string; ele: string; heart: string; time: string; elapse: number; cumulElapse: number;
}

/**
 * Converts a GPX text into
 *  - theFile : one row per <trkpt>
 *  - theTXT  : tab separated text  lat, lon, ele, hr, time, cumulElapse (CRLF terminated lines)
 * Parsed once with DOMParser (the previous version re-copied the remaining text for every point: O(n²)).
 * Elements are matched by local name, so any namespace prefix works (ns3:hr, gpxtpx:hr ...).
 */
export function fromGPXtoTXT(event: { text: string }): { theTXT: string; theFile: Array<GpxRow> } {
  const doc = new DOMParser().parseFromString(event.text, 'application/xml');
  if (doc.querySelector('parsererror')) {
    return { theTXT: '', theFile: [] };
  }

  const text = (el: Element, tag: string) => el.getElementsByTagNameNS('*', tag)[0]?.textContent ?? '';
  const points = doc.getElementsByTagNameNS('*', 'trkpt');

  const theFile: Array<GpxRow> = [];
  const lines: Array<string> = [];
  let t0 = 0;
  let prevCumul = 0;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const time = text(p, 'time');
    const ms = Date.parse(time);
    if (i === 0) { t0 = ms; }

    // seconds since the first point; Date.parse makes this safe across midnight
    const cumulElapse = Number.isFinite(ms) && Number.isFinite(t0) ? Math.round((ms - t0) / 1000) : prevCumul;
    const row: GpxRow = {
      lat: p.getAttribute('lat') ?? '',
      lon: p.getAttribute('lon') ?? '',
      ele: text(p, 'ele'),
      heart: text(p, 'hr'),
      time,
      elapse: i === 0 ? 0 : cumulElapse - prevCumul,
      cumulElapse
    };
    prevCumul = cumulElapse;
    theFile.push(row);
    lines.push(`${row.lat}\t${row.lon}\t${row.ele}\t${row.heart}\t${row.time}\t${row.cumulElapse}`);
  }

  return { theTXT: lines.length > 0 ? lines.join('\r\n') + '\r\n' : '', theFile };
}
