import { Component, Input, signal } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { HttpEventType } from '@angular/common/http';

import { ManageCircuitsComponent } from '../manage-circuits/manage-circuits.component';
import { SportPerformanceComponent } from '../sport-performance/sport-performance.component';
import { DisplayCircuitLoopComponent } from '../display-circuit-loop/display-circuit-loop.component';
import { BuildLoopFromPerfComponent } from '../build-loop/build-loop-from-perf.component';

import { configServer, LoginIdentif } from '../../JsonServerClass';
import { classFileSport, classNewLoop, classCircuitRec, classFilePerf, classWorkCircuit, classHeaderFileSport, PerfLeg } from '../classSport';
import { fillHeaderFile, perfFileName } from '../commonSportFunctions';
import { formatHHMNSS } from '../../MyStdFunctions';

import { ManageGoogleService } from '../../CloudServices/ManageGoogle.service';

type ActionPerf = 'perfYes' | 'perfNo' | 'circuitYes' | 'circuitNo';

/** max distance (in degrees) between the PoR and the record kept for it, beyond that the leg is excluded */
const EXCLUDE_TOLERANCE = 0.00035;
/** search window (records) around the record where the distance of the leg is reached */
const SEARCH_INTERVAL = 10;

@Component({
  selector: 'app-sport-reports',
  templateUrl: './sport-reports.component.html',
  styleUrls: ['./sport-reports.component.css'],
  standalone: true,
  imports: [BuildLoopFromPerfComponent, SportPerformanceComponent, ManageCircuitsComponent, DisplayCircuitLoopComponent],
})
export class SportReportsComponent {

  constructor(
    private scroller: ViewportScroller,
    private ManageGoogleService: ManageGoogleService,
  ) { }

  isRefresh=signal(false);

  @Input() configServer = new configServer;
  @Input() identification = new LoginIdentif;

  firstPoR: string = "";
  firstPoRNb: number = 0;
  displayTabTwo: number = 2;
  headerPerf = new classHeaderFileSport;
  nbSave: number = 0;

  theFile = new classFileSport;
  nameFilePerf: string = "";

  circuitPOR: Array<classWorkCircuit> = [];
  perfCircuit: Array<PerfLeg> = [];

  specificCircuit = new classCircuitRec;
  filePerf: Array<classFilePerf> = [];

  selectionCircuit=signal<boolean>(false);
  isPerfRetrieved=signal<boolean>(false);
  isFilePerfReceived=signal<boolean>(false);
  isSpecificCircuitReceived=signal<boolean>(false);
  isFilesToSave=signal<boolean>(false);
  isBuildFromPerf=signal<boolean>(false);

  errorMessage=signal<string>("");       // perfCircuit file not found in the cloud
  calcErrorMessage=signal<string>("");   // start point not found while calculating
  isPerfCircuitRetrieved=signal<boolean>(false);   // 1 retrieved, 2 not found, 3 not requested
  saveMsg=signal<string>("");

  nbErrUpload: number = -1;
  nbSuccessUpload: number = 0;

  // ---------------------------------------------------------------- helpers

  /** new arrays (not splice) so that the children see the change */
  private resetTab() {
    this.circuitPOR = [];
    this.perfCircuit = [];
  }

  private resetVar() {
    this.saveMsg.set("");
    this.isFilesToSave.set(false);
    this.errorMessage.set("");
    this.calcErrorMessage.set("");
    this.isRefresh.set(false);
  }

  /** render first, then scroll: the anchor must exist in the DOM */
  private refresh() {
    this.isRefresh.set(true);
    this.scroller.scrollToAnchor('bottomPage');
  }

  private fileNameFor(kind: 'perf' | 'cPOR', perfName: string): string {
    return perfFileName(this.theFile.sport, this.specificCircuit.code, kind, this.theFile.theDate, perfName);
  }

  // ---------------------------------------------------------------- selections

  onActionPerf(action: ActionPerf) {
    switch (action) {
      case 'perfYes': this.isPerfRetrieved.set(true); this.resetVar(); break;
      case 'perfNo': this.isPerfRetrieved.set(false); break;
      case 'circuitYes': this.resetVar(); this.selectionCircuit.set(true); break;
      case 'circuitNo': this.selectionCircuit.set(false); break;
    }
    this.refresh();
  }

  onSelectPerf(event: any) {
    this.isPerfCircuitRetrieved.set(false);
    this.isBuildFromPerf.set(false);
    this.resetVar();
    this.resetTab();
    this.theFile = event;
    this.filePerf = event.content;
    // new object, so that build-loop sees the change
    this.headerPerf = fillHeaderFile(this.theFile, new classHeaderFileSport);
    if (this.headerPerf.name === "") {
      this.headerPerf.name = event.name;
    }
    this.nameFilePerf = event.name;
    this.isPerfRetrieved.set(false);
    this.isFilePerfReceived.set(true);

    const hasPoR = this.filePerf.some(rec => rec.refPoR !== "");
    if (this.isSpecificCircuitReceived() && hasPoR) {
      this.isBuildFromPerf.set(true);
    }
    this.refresh();
  }

  onSelectCircuit(event: any) {
    this.isPerfCircuitRetrieved.set(false);
    this.isBuildFromPerf.set(false);
    this.resetVar();
    this.resetTab();
    this.specificCircuit = event;
    this.selectionCircuit.set(false);
    this.isSpecificCircuitReceived.set(true)
    if (this.isFilePerfReceived() && this.specificCircuit.points.length > 0) {
      this.isBuildFromPerf.set(true);
    }
    this.firstPoR = this.specificCircuit.points[0]?.ref ?? "";
    this.firstPoRNb = 0;
    this.refresh();
  }

  selFirstPoR(i: number) {
    this.firstPoR = this.specificCircuit.points[i].ref;
    this.firstPoRNb = i;
  }

  // ---------------------------------------------------------------- retrieve an existing perfCircuit file

  retrievePerfCircuit(resp: 'Yes' | 'No') {
    this.resetVar();
    if (resp !== 'Yes') {
      this.isPerfCircuitRetrieved.set(false);
      return;
    }
    const fileName = this.fileNameFor('perf', this.nameFilePerf);
    this.ManageGoogleService.getContentObject(this.configServer, 'xmv-sport-analysis', fileName)
      .subscribe({
        next: (data: any) => {
            this.isPerfCircuitRetrieved.set(true);
            if (data.status!==undefined){
              if (data.status===0 || data.status===200){
                  this.theFile = data;
                  if (Array.isArray(data.content)) {
                    this.perfCircuit = this.theFile.content;
                  } else {
                    this.perfCircuit=[];
                    this.errorMessage.set(" Circuit file content'" + fileName + "' is empty");
                    this.isPerfCircuitRetrieved.set(false);
                  }
              } else {
                this.perfCircuit=[];
                    this.errorMessage.set(" Error " + data.status +  ". Circuit file content'" + fileName + "' not found");
                    this.isPerfCircuitRetrieved.set(false);
              }
            }
        },
        error: () => {
          this.errorMessage.set(" Circuit file '" + fileName + "' not found");
          this.isPerfCircuitRetrieved.set(false);
        }
      });
  }

  // ---------------------------------------------------------------- calculation of the performance

  /** first record where the first PoR is reached (lat AND lon inside the tolerance); -1 when not found */
  private findStartRow(porNb: number): number {
    const p = this.specificCircuit.points[porNb];
    if (p.prio !== 'lat' && p.prio !== 'lon') { return -1; }
    const trunc6 = (x: number) => Math.trunc(x * 1e6) / 1e6;
    const specLat = trunc6(p.lat);
    const specLon = trunc6(p.lon);
    return this.filePerf.findIndex(r =>
      Math.abs(r.lat - specLat) <= p.varLat && Math.abs(r.lon - specLon) <= p.varLon);
  }

  /** returns the work leg #idx, creating the missing ones (legs before the first PoR are placeholders) */
  private ensureLeg(idx: number): classWorkCircuit {
    while (this.circuitPOR.length <= idx) {
      const n = this.circuitPOR.length;
      const leg = new classWorkCircuit;
      leg.name = this.specificCircuit.points[n].ref;
      leg.spec = n;
      leg.exclude[0] = "";
      if (n < this.firstPoRNb) {
        leg.dist[0] = 0;
        leg.value[0] = 0;
      } else {
        leg.dist[0] = this.specificCircuit.dist[n];
      }
      this.circuitPOR.push(leg);
    }
    return this.circuitPOR[idx];
  }

  onCalculatePerf() {
    const pts = this.specificCircuit.points;
    const nbPts = pts.length;
    const perf = this.filePerf;

    this.resetTab();
    this.isFilesToSave.set(false);
    this.calcErrorMessage.set("");

    // *** the start point must be found, otherwise stop and display an error
    const startRow = this.findStartRow(this.firstPoRNb);
    if (startRow < 0) {
      this.calcErrorMessage .set("start point not found; restart your selection");
      this.isPerfRetrieved.set(false);
      this.selectionCircuit.set(false);
      this.isSpecificCircuitReceived.set(false);
      this.filePerf = [];
      this.refresh();
      return;
    }
    this.ensureLeg(this.firstPoRNb).value[0] = startRow;

    // *** find each PoR based on distance
    let iLoop = -1;
    let startRef = this.firstPoRNb;   // the first loop starts at the selected PoR, the next ones at 0
    let stop = false;
    for (let jRow = startRow; jRow < perf.length && !stop; jRow++) {
      iLoop++;
      for (let iRef = startRef; iRef < nbPts && jRow < perf.length; iRef++) {
        const leg = this.ensureLeg(iRef);
        leg.dist[iLoop] = this.specificCircuit.dist[iRef];

        const fromRow = leg.value[iLoop];
        if (fromRow === undefined) { stop = true; break; }   // the previous leg did not find its end
        const fromDist = perf[fromRow].dist;

        const nextRef = iRef < nbPts - 1 ? iRef + 1 : 0;
        const target = pts[nextRef];

        // first look for the best record while the distance of the leg is not exceeded
        let bestRow = -1;
        let k = jRow;
        for (; k < perf.length && perf[k].dist - fromDist <= this.specificCircuit.dist[iRef]; k++) {
          const dLat = Math.abs(perf[k].lat - target.lat);
          const dLon = Math.abs(perf[k].lon - target.lon);
          if (dLat <= target.varLat && dLon <= target.varLon) {
            if (bestRow < 0 ||
               (dLat <= Math.abs(perf[bestRow].lat - target.lat) && dLon <= Math.abs(perf[bestRow].lon - target.lon))) {
              bestRow = k;
            }
          }
        }
        if (bestRow >= 0) { k = bestRow; }

        // then refine on the priority coordinate in a window around k
        const start = Math.max(0, k - SEARCH_INTERVAL);
        let selRow = Math.min(start + 1, perf.length - 1);
        jRow = start;
        const coord: 'lat' | 'lon' | '' = target.prio === 'lat' ? 'lat' : target.prio === 'lon' ? 'lon' : '';
        for (let jInt = 0; jInt < SEARCH_INTERVAL * 3 && jRow < perf.length; jInt++, jRow++) {
          if (coord !== '' &&
              Math.abs(perf[jRow][coord] - target[coord]) < Math.abs(perf[selRow][coord] - target[coord])) {
            selRow = jRow;
          }
        }

        if (selRow < perf.length) {
          const toLeg = this.ensureLeg(nextRef);
          // the end of the last leg is the start of the next loop of leg 0
          const toIdx = iRef === nbPts - 1 ? iLoop + 1 : iLoop;
          toLeg.value[toIdx] = selRow;
          leg.dist[iLoop] = perf[selRow].dist - fromDist;

          const tooFar = coord !== '' && perf[selRow][coord] !== 0 &&
                         Math.abs(perf[selRow][coord] - target[coord]) > EXCLUDE_TOLERANCE;
          toLeg.exclude[toIdx] = tooFar ? "E" : "";
        }
      }
      startRef = 0;
    }

    this.createPerfCircuit();
    this.refresh();
  }

  private createPerfCircuit() {
    const por = this.circuitPOR;
    if (por.length === 0) { return; }
    const perf = this.filePerf;
    const hasRow = (n: number) => n > 0 && n < perf.length;
    const legs: Array<PerfLeg> = por.map(() => ({ newLoop: [] }));

    for (let iLoop = 0; iLoop < por[0].dist.length; iLoop++) {
      for (let i = 0; i < por.length; i++) {
        if (iLoop >= por[i].dist.length) { continue; }   // this leg has no such loop
        const loop = new classNewLoop;
        loop.from = por[i].name;
        loop.dist = por[i].dist[iLoop];
        loop.perfRecordFrom = por[i].value[iLoop] ?? 0;
        loop.exclude = por[i].exclude[iLoop] ?? "";
        loop.spec = i;
        if (i < por.length - 1) {
          loop.to = por[i + 1].name;
          loop.perfRecordTo = por[i + 1].value[iLoop] ?? 0;
        } else {
          // last leg of the loop: ends where the next loop of leg 0 starts, if that loop exists
          loop.to = por[0].name;
          if (iLoop < por[0].value.length - 1) {
            loop.perfRecordTo = por[0].value[iLoop + 1] ?? 0;
          }
        }
        if (hasRow(loop.perfRecordFrom) && hasRow(loop.perfRecordTo)) {
          const from = perf[loop.perfRecordFrom];
          const to = perf[loop.perfRecordTo];
          loop.theTime = to.time - from.time;
          loop.dist = to.dist - from.dist;
          loop.speed = loop.theTime > 0 ? loop.dist * 1000 / loop.theTime * 3.6 : 0;
          loop.strTime = formatHHMNSS(loop.theTime);
        }
        legs[i].newLoop.push(loop);
      }
    }

    // each leg must have the same number of loops as leg 0: add or cut
    const nbLoops = legs[0].newLoop.length;
    for (let i = 1; i < legs.length; i++) {
      while (legs[i].newLoop.length < nbLoops) { legs[i].newLoop.push(new classNewLoop); }
      legs[i].newLoop.length = nbLoops;
    }
    this.perfCircuit = legs;
  }

  // ---------------------------------------------------------------- save

  savePerf(event: any) {
    // name of the file is managed by the calling component
    this.saveMsg.set("");
    this.fnSavePerf(this.identification.performanceSport.bucket, event.codeName, event);
  }

  uploadPerfCircuit(event: any) {
    const perfName = this.theFile.name;
    this.theFile.codeName = this.fileNameFor('perf', perfName);
    this.fnSave('perfCircuit', event, this.theFile.codeName, 'xmv-sport-analysis');

    if (this.circuitPOR.length > 0) {
      this.theFile.codeName = this.fileNameFor('cPOR', perfName);
      this.fnSave('circuitPOR', this.circuitPOR, this.theFile.codeName, 'xmv-tests');
    }
  }

  private upload(bucket: string, fileName: string, obj: any) {
    const file = new File([JSON.stringify(obj)], fileName, { type: 'application/json' });
    return this.ManageGoogleService.uploadObject(this.configServer, bucket, file, fileName);
  }

  fnSavePerf(bucket: string, fileName: string, aFile: any) {
    this.upload(bucket, fileName, aFile).subscribe({
      next: (res: any) => {
        if (res.type === HttpEventType.Response) {
          this.nbSuccessUpload++;
          this.nbSave = this.nbSuccessUpload;
          this.saveMsg.set(" file has been updated and stored in the cloud ");
        }
      },
      error: () => {
        this.nbErrUpload--;
        this.nbSave = this.nbErrUpload;
        this.saveMsg.set(" upload pb - file has not been updated");
      }
    });
  }

  fnSave(type: string, content: any, fileName: string, bucket: string) {
    this.theFile.fileType = type;
    this.theFile.content = content;
    const name = fileName;
    this.upload(bucket, fileName, this.theFile).subscribe({
      next: (res: any) => { if (res.type === HttpEventType.Response) { this.saveMsg.set("File '"+name+"' saved") } },
      error: () => { this.saveMsg.set("File '"+name+"' not saved"); }
    });
  }
}
