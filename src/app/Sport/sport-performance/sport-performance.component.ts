import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';

import { ListBucketContentComponent } from '../../Special-Services/ListBucketContent.component';
import { ManagePointOfRefComponent } from '../../Sport/manage-point-of-ref/manage-point-of-ref.component';
import { configServer, LoginIdentif, OneBucketInfo, classTabMetaPerso } from '../../JsonServerClass';
import { classFileSport, classFilePerf } from '../classSport';
import { fromGPXtoTXT } from '../convertGPXtoTXT';
import { fromTCXtoJSON } from '../convertTCXtoTXT';
import { formatHHMNSS } from '../../MyStdFunctions';
import { ManageGoogleService } from '../../CloudServices/ManageGoogle.service';

/** one row of the "every N seconds" table */
interface SecondRow {
  dist: number;          // km during the interval
  interval: number;      // seconds
  speed: number;         // km/h
  cumulDist: number;     // km since start
  cumulInterval: number; // seconds since start
  cumulTime: string;     // hh:mm:ss
  cumulSpeed: number;    // km/h
}

/** one row of the "every N meters" table */
interface MeterRow {
  dist: number;
  time: number;
  speed: number;
  strTime: string;
  cumulDist: number;
  cumulTime: number;
  cumulSpeed: number;
  cumulStrTime: string;
}

const DEBUG_BUCKET = 'xmv-tests';
const MAX_ALT_HEART_INIT = 2000;

@Component({
  selector: 'app-sport-performance',
  templateUrl: './sport-performance.component.html',
  styleUrls: ['./sport-performance.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ListBucketContentComponent, ManagePointOfRefComponent],
})
export class SportPerformanceComponent implements OnInit {

  private scroller = inject(ViewportScroller);
  private google = inject(ManageGoogleService);

  @Output() returnPerf = new EventEmitter<any>();

  @Input() configServer = new configServer();
  @Input() identification = new LoginIdentif();
  /** true => create the perf file and return it to the calling component */
  @Input() isPerfRetrieved: boolean = false;

  /**
   * Debug only: when true, raw and converted import files are uploaded to the
   * 'xmv-tests' bucket (JSON.stringify of a whole file + one HTTP upload each).
   */
  private debugUploads = false;

  tabMetaPerso: Array<classTabMetaPerso> = [];
  perf: Array<classFilePerf> = [];
  filePerf = new classFileSport();

  bucketName: string = '';
  NbRefresh_Bucket = 0;
  SelectedBucketInfo = new OneBucketInfo();

  formOptions: FormGroup = new FormGroup({
    seconds: new FormControl(800, { nonNullable: true }),
    meters: new FormControl(500, { nonNullable: true }),
    fileName: new FormControl('', { nonNullable: true }),
    sport: new FormControl('', { nonNullable: true }),
    theDate: new FormControl('', { nonNullable: true }),
    perfName: new FormControl('', { nonNullable: true }),
  });

  isManagePointOfRef = false;
  isConfirmSave = false;
  isFileProcessed = false;
  isPerfProcessCompleted = false;

  tabSecond: Array<SecondRow> = [];
  tabMeter: Array<MeterRow> = [];
  alt = { lowest: MAX_ALT_HEART_INIT, lDist: 0, highest: 0, hDist: 0 };
  heart = { lowest: MAX_ALT_HEART_INIT, lDist: 0, highest: 0, hDist: 0 };
  speed = { highest: 0, dist: 0 };

  errorMsg = '';      // shown by the template
  errorMessage = '';  // save / lat-lon messages (not displayed by the current template)

  ngOnInit() {
    this.bucketName = this.identification.performanceSport.bucket;

    const meta = new classTabMetaPerso();
    meta.key = 'fileType';
    meta.value = 'performance';
    this.tabMetaPerso.push(meta);
  }

  // ---------------------------------------------------------------- UI events

  BucketInfo(event: any) {
    this.SelectedBucketInfo = event;
    this.formOptions.controls['fileName'].setValue(this.SelectedBucketInfo.name);
  }

  actionPointOfRef(event: string) {
    if (event === 'managePoRef') this.isManagePointOfRef = true;
    else if (event === 'cancelPoRef') this.isManagePointOfRef = false;
  }

  confirmSave(event: string) {
    if (event === 'confirmSave') this.isConfirmSave = true;
  }

  cancelFile() {
    this.isConfirmSave = false;
  }

  checkOptions() {
    this.errorMsg = '';
    const seconds = Number(this.formOptions.controls['seconds'].value);
    const meters = Number(this.formOptions.controls['meters'].value);

    if (!Number.isFinite(seconds) || seconds <= 0) {
      this.errorMsg = 'enter a numeric value greater than 0 for seconds';
    } else if (!Number.isFinite(meters) || meters <= 0) {
      this.errorMsg = 'enter a numeric value greater than 0 for meters';
    } else if (this.perf.length === 0) {
      this.errorMsg = 'file perf is empty - check the problem';
    }
    if (this.errorMsg === '') this.performancePerSec();
  }

  // ------------------------------------------------------------ file reception

  ReceivedData(event: any) {
    this.isPerfProcessCompleted = false;
    this.isFileProcessed = false;
    this.errorMsg = '';
    this.errorMessage = '';
    this.perf = [];
    this.scroller.scrollToAnchor('result');

    if (event && typeof event === 'object' && event.text !== undefined) {
      this.parseTextFile(event);
    } else if (Array.isArray(event) && event[0]?.speed !== undefined) {
      event.forEach(r => this.pushPerfRecord(r));
    } else if (event?.fileType !== undefined) {
      event.content.forEach((r: any) => this.pushPerfRecord(r));
      this.formOptions.controls['sport'].setValue(event.sport);
      this.formOptions.controls['theDate'].setValue(event.theDate);
    }

    this.fillMissingLatLon();

    if (this.perf.length === 0) {
      if (this.errorMsg === '') this.errorMsg = 'file perf is empty - check the problem';
    } else {
      this.isFileProcessed = true;
    }

    if (this.isPerfRetrieved) {
      this.createFilePerf();
      this.returnPerf.emit(this.filePerf);
    }
  }

  private parseTextFile(event: any) {
    const text: string = event.text;
    const isGPX = text.includes('<gpx creator=');
    const isTCX = !isGPX && text.includes('<TotalTimeSeconds>');

    this.debugUpload(event, isGPX ? 'myGPXfile' : 'myTCXfile');

    if (isGPX) {
      this.processGPXfile(event);
    } else if (isTCX) {
      this.processTCXfile(event);
    } else if (text.includes('RIDE')) {
      this.parseRide(text);
    } else {
      this.parseTabSeparated(text);
    }
  }

  /**
   * Tab separated text, one row per second.
   *   8 columns: time, dist, heart, speed, alt, lat, lon, slope
   *   3 columns: time, dist, speed
   * Header lines are skipped. The number of columns is taken from each row, so a
   * file with 8 columns but no "Altitude" header is read correctly.
   * If no line breaks are found (legacy "glued" export) falls back to a scanner.
   */
  private parseTabSeparated(text: string) {
    const num = (s: string) => { const n = Number(s); return Number.isFinite(n) ? n : 0; };

    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (t === '') continue;
      const f = t.split('\t');
      if (f.length < 3 || Number.isNaN(Number(f[0]))) continue; // header or junk

      const p = new classFilePerf();
      p.time = num(f[0]);
      p.dist = num(f[1]);
      if (f.length >= 8) {
        p.heart = num(f[2]);
        p.speed = num(f[3]);
        p.alt = num(f[4]);
        p.lat = num(f[5]);
        p.lon = num(f[6]);
        p.slope = num(f[7]);
      } else {
        p.speed = num(f[2]);
      }
      this.perf.push(p);
    }

    if (this.perf.length < 2) {
      this.perf = [];
      this.parseGluedText(text, text.includes('Altitude') ? 8 : 3);
    }
  }

  /**
   * Legacy format: columns are tab separated but the last column of a row is
   * glued to the "seconds" value of the next row (no line break). Rows are +1 sec,
   * so the length of the next "seconds" value is subtracted from the last field.
   */
  private parseGluedText(text: string, maxFields: number) {
    const isNum = (c: number) => (c >= 48 && c <= 57) || c === 46; // 0-9 .
    const len = text.length;
    let i = 0;
    while (i < len && !isNum(text.charCodeAt(i))) i++;

    let field = 0;
    for (; i < len; i++) {
      let j = i;
      while (j < len && text.charCodeAt(j) === 9) j++;      // skip tabs
      let k = j + 1;
      while (k < len && isNum(text.charCodeAt(k))) k++;
      const value = Number(text.substring(j, k));
      field++;

      const cur = this.perf[this.perf.length - 1];
      if (field === 1) {
        const p = new classFilePerf();
        p.time = value;
        this.perf.push(p);
      } else if (field === 2) {
        cur.dist = value;
      } else if (field === maxFields) {
        const processSec = text.charAt(k + 1) === '\t';
        let lengthSec = 0;
        if (k < len && processSec) {
          lengthSec = String(Math.trunc(this.perf.length + Number(this.perf[0].time))).length;
        }
        const last = Number(text.substring(j, k - lengthSec));
        if (maxFields === 3) cur.speed = last; else cur.slope = last;

        if (processSec) {
          if (k < len) {
            const p = new classFilePerf();
            p.time = this.perf.length + Number(this.perf[0].time);
            this.perf.push(p);
          }
          field = 1;
        } else {
          field = 0;
        }
      } else if (maxFields === 8) {
        if (field === 3) cur.heart = value;
        else if (field === 4) cur.speed = value;
        else if (field === 5) cur.alt = value;
        else if (field === 6) cur.lat = value;
        else if (field === 7) cur.lon = value;
      }
      i = k;
    }
  }

  /** "RIDE" record: {"SECS":..,"KM":..,"KPH":..,"HR":..,"ALT":..,"LAT":..,"LON":..,"SLOPE":..} */
  private parseRide(text: string) {
    const tags = ['"SECS":', '"KM":', '"KPH":', '"HR":', '"ALT":', '"LAT":', '"LON":', '"SLOPE":'];
    let rest = text.substring(text.indexOf('RIDE'));

    const next = (idx: number, sep: string): number => {
      const tag = tags[idx];
      rest = rest.substring(rest.indexOf(tag) + tag.length);
      const end = rest.indexOf(sep);
      if (end !== -1) return Number(rest.substring(0, end));
      return idx === 0 ? -1 : 0;
    };

    while (rest.length > 60) {
      const p = new classFilePerf();
      p.time = next(0, ',');
      p.dist = next(1, ',');
      p.speed = next(2, ',');
      p.heart = next(3, ',');
      p.alt = next(4, ',');
      p.lat = next(5, ',');
      p.lon = next(6, ',');
      p.slope = next(7, '}');
      this.perf.push(p);
    }
  }

  private pushPerfRecord(r: any) {
    const p = new classFilePerf();
    if (r.sec !== undefined) p.time = r.sec;
    else if (r.time !== undefined) p.time = r.time;

    const keys = ['dist', 'speed', 'heart', 'alt', 'lat', 'lon', 'slope', 'refPoR', 'exclude'];
    for (const key of keys) {
      if (r[key] !== undefined) (p as any)[key] = r[key];
    }
    this.perf.push(p);
  }

  /**
   * Rows whose lat/lon are 0 are linearly interpolated between the nearest valid
   * rows before and after. Leading / trailing zeros cannot be interpolated and
   * are left untouched. Single pass, O(n).
   */
  private fillMissingLatLon() {
    const p = this.perf;
    if (p.length === 0) return;

    const valid = (r: classFilePerf) => r.lat !== 0 && r.lon !== 0;
    let prev = -1;

    for (let i = 0; i < p.length; i++) {
      if (!valid(p[i])) continue;
      if (prev !== -1 && i - prev > 1) {
        const span = i - prev;
        for (let g = prev + 1; g < i; g++) {
          const t = (g - prev) / span;
          p[g].lat = p[prev].lat + (p[i].lat - p[prev].lat) * t;
          p[g].lon = p[prev].lon + (p[i].lon - p[prev].lon) * t;
        }
      }
      prev = i;
    }
    if (prev === -1) this.errorMessage = 'LAT & LON are nil and cannot be updated';
  }

  // ------------------------------------------------------ per second / per meter

  private updateExtremes(row: classFilePerf) {
    if (row.alt < this.alt.lowest) { this.alt.lowest = row.alt; this.alt.lDist = row.dist; }
    if (row.alt > this.alt.highest) { this.alt.highest = row.alt; this.alt.hDist = row.dist; }
    if (row.heart < this.heart.lowest) { this.heart.lowest = row.heart; this.heart.lDist = row.dist; }
    if (row.heart > this.heart.highest) { this.heart.highest = row.heart; this.heart.hDist = row.dist; }
    if (row.speed > this.speed.highest) { this.speed.highest = row.speed; this.speed.dist = row.dist; }
  }

  /** km/h from km and seconds (same as dist*1000/sec*3.6), 0 when no time elapsed */
  private kmh(distKm: number, sec: number): number {
    return sec > 0 ? (distKm * 3600) / sec : 0;
  }

  performancePerSec() {
    const perf = this.perf;
    this.tabSecond = [];
    this.tabMeter = [];
    this.alt = { lowest: MAX_ALT_HEART_INIT, lDist: 0, highest: 0, hDist: 0 };
    this.heart = { lowest: MAX_ALT_HEART_INIT, lDist: 0, highest: 0, hDist: 0 };
    this.speed = { highest: 0, dist: 0 };

    const intervalSec = Number(this.formOptions.controls['seconds'].value);
    const intervalDistance = Number(this.formOptions.controls['meters'].value) / 1000;

    // Tables are relative to the first record (a file may start at e.g. 2793 s / 18.69 km)
    const d0 = perf[0].dist;
    const t0 = perf[0].time;

    const newSecond = (cumulDist: number, interval: number): SecondRow =>
      ({ dist: 0, interval, speed: 0, cumulDist, cumulInterval: 0, cumulTime: '', cumulSpeed: 0 });
    const newMeter = (cumulDist: number, cumulTime: number): MeterRow =>
      ({ dist: 0, time: 0, speed: 0, strTime: '', cumulDist, cumulTime, cumulSpeed: 0, cumulStrTime: '' });

    let jSec = 0;               // seconds since the last interval boundary
    let meterCount = 0;
    let lastMeterPushed = false;

    for (let i = 1; i < perf.length; i++) {
      const prev = perf[i - 1];
      const cur = perf[i];
      this.updateExtremes(cur);

      const dt = cur.time - prev.time;
      jSec += dt;

      lastMeterPushed = false;
      if (cur.dist - d0 > intervalDistance * (meterCount + 1)) {
        meterCount++;
        this.tabMeter.push(newMeter(prev.dist - d0, prev.time - t0));
        lastMeterPushed = true;
      }

      if (jSec === intervalSec) {
        this.tabSecond.push(newSecond(cur.dist - d0, intervalSec));
        jSec = 0;
      } else if (jSec > intervalSec) {
        // the boundary was crossed inside this step: interpolate the distance at the boundary
        const distPerSec = dt > 0 ? (cur.dist - prev.dist) / dt : 0;
        let cumulDist = (prev.dist - d0) + (intervalSec - (jSec - dt)) * distPerSec;
        this.tabSecond.push(newSecond(cumulDist, intervalSec));
        jSec -= intervalSec;

        // a long gap (pause) can span several whole intervals
        const extra = Math.floor(jSec / intervalSec);
        for (let n = 0; n < extra; n++) {
          cumulDist += distPerSec * intervalSec;
          this.tabSecond.push(newSecond(cumulDist, intervalSec));
        }
        jSec -= extra * intervalSec;
      }
    }

    const last = perf[perf.length - 1];
    if (!lastMeterPushed) this.tabMeter.push(newMeter(last.dist - d0, last.time - t0));
    if (jSec > 0) this.tabSecond.push(newSecond(last.dist - d0, jSec));

    this.finalizeSeconds();
    this.finalizeMeters();

    this.scroller.scrollToAnchor('bottomPage');
    this.isPerfProcessCompleted = true;
  }

  private finalizeSeconds() {
    this.tabSecond.forEach((r, i, a) => {
      const prev = a[i - 1];
      r.dist = r.cumulDist - (prev?.cumulDist ?? 0);
      r.speed = this.kmh(r.dist, r.interval);
      r.cumulInterval = r.interval + (prev?.cumulInterval ?? 0);
      r.cumulTime = formatHHMNSS(r.cumulInterval);
      r.cumulSpeed = this.kmh(r.cumulDist, r.cumulInterval);
    });
  }

  private finalizeMeters() {
    this.tabMeter.forEach((r, i, a) => {
      const prev = a[i - 1];
      r.dist = r.cumulDist - (prev?.cumulDist ?? 0);
      r.time = r.cumulTime - (prev?.cumulTime ?? 0);
      r.strTime = formatHHMNSS(r.time);
      r.speed = this.kmh(r.dist, r.time);
      r.cumulStrTime = formatHHMNSS(r.cumulTime);
      r.cumulSpeed = this.kmh(r.cumulDist, r.cumulTime);
    });
  }

  // ------------------------------------------------------------------- saving

  createFilePerf() {
    this.filePerf.fileType = 'perfRawData';
    this.filePerf.circuit = '';
    this.filePerf.name = this.SelectedBucketInfo.name;
    this.filePerf.sport = this.formOptions.controls['sport'].value;
    this.filePerf.theDate = this.formOptions.controls['theDate'].value;
    this.filePerf.content = this.perf;
  }

  saveFile() {
    this.errorMessage = '';
    this.createFilePerf();

    const fileName: string = this.formOptions.controls['fileName'].value;
    const type = 'application/json';
    const file = new File([JSON.stringify(this.filePerf)], fileName, { type });

    this.google
      .uploadObjectMetaPerso(this.configServer, this.identification.performanceSport.bucket, file, fileName, '', type, this.tabMetaPerso)
      .subscribe({
        next: res => {
          if (res.type === HttpEventType.Response) {
            this.errorMessage = `file ${fileName} has been successfully saved`;
            this.isConfirmSave = false;
          }
        },
        error: err => {
          this.errorMessage = `failure to save ${fileName} ; error = ${JSON.stringify(err)}`;
          console.log(this.errorMessage);
        },
      });
  }

  // -------------------------------------------------------------- debug / GPX / TCX

  private debugUpload(content: unknown, name: string) {
    if (!this.debugUploads) return;
    const file = new File([JSON.stringify(content)], name, { type: 'application/json' });
    this.google.uploadObject(this.configServer, DEBUG_BUCKET, file, name)
      .subscribe({ error: err => console.log(err) });
  }

  /** GPX/TCX are only converted and uploaded for inspection; they do not fill this.perf yet. */
  private processGPXfile(event: any) {
    this.errorMsg = 'GPX import does not build a performance table yet - file perf is empty';
    if (!this.debugUploads) return;
    const r = fromGPXtoTXT(event);
    this.debugUpload(r.theFile, 'myJSON-GPXfile');
    this.debugUpload(r.theTXT, 'myTEXT-GPXfile');
  }

  private processTCXfile(event: any) {
    this.errorMsg = 'TCX import does not build a performance table yet - file perf is empty';
    if (!this.debugUploads) return;
    const r = fromTCXtoJSON(event);
    this.debugUpload(r.theLaps, 'myJSON-CSVfile');
    this.debugUpload(r.thePerf, 'myJSON-TCXfile');
  }
}
