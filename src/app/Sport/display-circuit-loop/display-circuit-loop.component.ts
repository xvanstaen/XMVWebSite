import { Component, signal, Input, Output, SimpleChanges, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';

import { classFileSport, classHeaderFileSport, classFilePerf, classNewLoop, PerfLeg } from '../classSport';
import { formatHHMNSS } from '../../MyStdFunctions';
import { fillHeaderFile, reinitTotal, copyLegInOut, copyInOut, copyLoopInOut, createPerfTotal, speedKmh } from '../commonSportFunctions';
// NOTE: add `export` in front of `function speedKmh` in commonSportFunctions.ts

@Component({
  selector: 'app-display-circuit-loop',
  templateUrl: './display-circuit-loop.component.html',
  styleUrls: ['./display-circuit-loop.component.css'],
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule],
})
export class DisplayCircuitLoopComponent implements OnInit, OnChanges {

  private debug: boolean = false;

  @Input() perfCircuit: Array<PerfLeg> = [];
  @Input() filePerf: Array<classFilePerf> = [];
  @Input() headerPerf = new classHeaderFileSport;
  @Input() displayTab: number = 0;

  @Output() savePerf = new EventEmitter<any>();
  @Output() uploadPerfCircuit = new EventEmitter<any>();
  @Output() displaySportChart = new EventEmitter<any>();

  /** rows of the table body: PoR rows carry the name of the PoR of the leg in the first column */
  readonly detailRows: ReadonlyArray<{ key: 'perfRecordFrom' | 'perfRecordTo' | 'theTime' | 'strTime' | 'dist' | 'speed'; label: string; leg: 'from' | 'to' | '' }> = [
    { key: 'perfRecordFrom', label: '', leg: 'from' },
    { key: 'perfRecordTo', label: '', leg: 'to' },
    { key: 'theTime', label: 'Time (sec)', leg: '' },
    { key: 'strTime', label: 'Time', leg: '' },
    { key: 'dist', label: 'Distance (km)', leg: '' },
    { key: 'speed', label: 'Speed (km/h)', leg: '' },
  ];

  tabIdScroll: Array<string> = [];

  theFile = new classFileSport;
  savePerfCircuit: Array<PerfLeg> = [];

  selectedLoop: number = 0;
  isActionDisplay = signal<boolean>(false);
  actionDisplay: Array<string> = ["Cancel", "Exclude", "Delete", "Restore"];
  perfTotalCircuit: Array<any> = [];
  maxWidthTable: number = 0;
  widthTable: number = 0;
  tabManageLoop: Array<string> = [];
  nbItemsLoop: number = -1;
  isManageExclude: boolean = false;
  excludeItem: number = 0;
  tabExclDel: Array<string> = [];
  formOptions: FormGroup = new FormGroup({
    fileName: new FormControl("", { nonNullable: true }),
    record: new FormControl("", { nonNullable: true }),
  });
  newLat: number = 0;
  newLon: number = 0;
  TabOfId: Array<any> = [];
  strFound: string = "";

  isPerfCircuitRetrieved: number = 0;

  isModifOk: boolean = false;
  isFilesToSave: boolean = false;
  isNewRecordValid: boolean = false;
  errorMessage = signal<string>("");
  errorMsg = signal<string>("");

  nbSavedFiles: number = 0;
  saveMsg = signal<string>("");
  maxFiles: number = 0;

  colOne: number = 240;

  isPbDetected = signal<boolean>(false);
  stringPerfCircuit: string = "";
  isSaveFileRequested: boolean = false;

  // ---------------------------------------------------------------- init

  ngOnInit() {
    this.tabIdScroll = this.displayTab === 1 ? ["scroll-3", "scroll-4"] : ["scroll-5", "scroll-6"];

    const pb = this.perfCircuit.length === 0 || this.perfCircuit.some(leg => leg === undefined);
    this.isPbDetected.set(pb);
    if (pb) {
      this.stringPerfCircuit = JSON.stringify(this.perfCircuit);
      return;
    }
    this.resetLoopFlags();
    this.perfTotalCircuit = createPerfTotal(this.perfCircuit, this.perfTotalCircuit);
    this.fnSizeTable();
    this.copyToSavePerfCirc();
  }

  /** one flag per loop, all cleared */
  private resetLoopFlags() {
    const nbLoops = this.perfCircuit[0].newLoop.length;
    this.tabManageLoop = new Array<string>(nbLoops).fill("");
    this.tabExclDel = [];
  }

  fnSizeTable() {
    this.widthTable = this.perfTotalCircuit[0].newLoop.length * 80 + this.colOne;
    this.maxWidthTable = Math.min(this.widthTable, 550);
  }

  // ---------------------------------------------------------------- helpers

  /** leg selected in the table (undefined when none) */
  get selectedLeg(): classNewLoop | undefined {
    return this.perfCircuit[this.TabOfId[0]]?.newLoop[this.TabOfId[1]];
  }

  private legAt(iLeg: number, jLoop: number): classNewLoop {
    return this.perfCircuit[iLeg].newLoop[jLoop];
  }

  private recordValue(): number {
    return Number(this.formOptions.controls["record"].value);
  }

  /** dist / time / speed of a leg from its perfRecordFrom / perfRecordTo records */
  private recomputeLeg(leg: classNewLoop) {
    const from = this.filePerf[leg.perfRecordFrom];
    const to = this.filePerf[leg.perfRecordTo];
    leg.dist = to.dist - from.dist;
    leg.theTime = to.time - from.time;
    leg.strTime = formatHHMNSS(leg.theTime);
    leg.speed = speedKmh(leg.dist, leg.theTime);
  }

  private refreshTotal(jLoop: number) {
    this.perfTotalCircuit = reinitTotal(jLoop, this.perfCircuit, this.perfTotalCircuit);
  }

  resetLeg(iLeg: number, iLoop: number) {
    Object.assign(this.legAt(iLeg, iLoop), {
      exclude: "", dist: 0, speed: 0, theTime: 0, strTime: "",
      from: "", to: "", perfRecordFrom: 0, perfRecordTo: 0,
    });
  }

  // ---------------------------------------------------------------- UI events

  manageExclude(iLeg: number, jLoop: number) {
    this.TabOfId = [iLeg, jLoop];
    this.isManageExclude = true;
    this.newLat = 0;
    this.newLon = 0;
    this.formOptions.controls["record"].setValue("");
  }

  manageDisplayLoop(event: any) {
    this.isActionDisplay.set(false);
    const id: string = event.target.id;

    if (id.startsWith("loop")) {
      this.selectedLoop = Number(id.substring(5)) - 1;
      this.actionDisplay[1] = this.tabManageLoop[this.selectedLoop] === "E" ? "Include" : "Exclude";
      this.isActionDisplay.set(true);
      return;
    }
    if (!id.startsWith("action")) { return; }

    const loop = this.selectedLoop;
    const setFlag = (flag: string) => {
      this.tabManageLoop[loop] = flag;
      this.tabExclDel[loop] = flag;
    };

    switch (Number(id.substring(7))) {
      case 1: // Exclude / Include
        setFlag(this.tabManageLoop[loop] === "E" ? "" : "E");
        break;
      case 2: // Delete
        for (let i = 0; i < this.perfCircuit.length; i++) { this.resetLeg(i, loop); }
        this.refreshTotal(loop);
        setFlag("D");
        break;
      case 3: // Restore
        this.perfCircuit = copyLoopInOut(this.savePerfCircuit, this.perfCircuit, loop);
        this.refreshTotal(loop);
        setFlag("");
        break;
      default: // Cancel
        setFlag("");
    }
  }

  syncScrollBar(event: Event) {
    const scrollLeft = (event.target as HTMLElement | null)?.scrollLeft;
    if (scrollLeft === undefined) { return; }
    for (const id of this.tabIdScroll) {
      const elem = document.getElementById(id);
      if (elem !== null) { elem.scrollLeft = scrollLeft; }
    }
  }

  onRequestSaveFile() {
    this.resetVar();
    this.formOptions.controls['fileName'].setValue(this.headerPerf.name);
    this.isSaveFileRequested = true;
    // request to confirm the upload of the file in the cloud as well as the name of the file
  }

  onUploadCircuit() {
    if (this.displayTab === 2) {
      this.uploadPerfCircuit.emit(this.perfCircuit);
    }
  }

  displayCharts() { this.emitCharts(true); }
  noDisplayCharts() { this.emitCharts(false); }
  private emitCharts(display: boolean) {
    this.displaySportChart.emit({ filePerf: this.perfCircuit, fileTotal: this.perfTotalCircuit, display });
  }

  // ---------------------------------------------------------------- save

  onSaveFile(event: any) {
    if (event === "Cancel") {
      this.isSaveFileRequested = false;
      this.isFilesToSave = false;
      return;
    }
    const fileName: string = this.formOptions.controls["fileName"].value;
    if (event !== "Confirm" || fileName === "") { return; } // confirm with empty file name: nothing to do

    this.isSaveFileRequested = false;
    this.isFilesToSave = true;

    this.updateFilePerfFromCircuit();

    this.headerPerf.name = fileName;
    this.headerPerf.codeName = fileName;
    this.theFile = fillHeaderFile(this.headerPerf, this.theFile);
    this.theFile.content = this.filePerf;
    // every PoR of filePerf, without duplicates, sorted
    this.theFile.refPoints = [...new Set(this.filePerf.map(r => r.refPoR).filter(r => r !== ""))].sort();
    this.savePerf.emit(this.theFile);

    this.removeDeletedLoops();
  }

  /** reports exclusions / deletions / modified PoR of perfCircuit (vs savePerfCircuit) into filePerf */
  private updateFilePerfFromCircuit() {
    const clearRecord = (rec: number) => {
      this.filePerf[rec].refPoR = "";
      this.filePerf[rec].exclude = "";
    };

    // loops deleted as a whole: their PoR are removed from filePerf
    this.tabManageLoop.forEach((flag, iLoop) => {
      if (flag !== "D") { return; }
      for (const leg of this.savePerfCircuit) { clearRecord(leg.newLoop[iLoop].perfRecordFrom); }
    });

    for (let i = 0; i < this.perfCircuit.length; i++) {
      const legName = this.savePerfCircuit[i].newLoop[0].from; // name of the PoR starting this leg
      for (let iLoop = 0; iLoop < this.perfCircuit[i].newLoop.length; iLoop++) {
        if (this.tabManageLoop[iLoop] === "D") { continue; } // already cleared above
        const cur = this.legAt(i, iLoop);
        const old = this.savePerfCircuit[i].newLoop[iLoop];

        if (cur.exclude === "D") {
          clearRecord(old.perfRecordFrom);
          continue;
        }
        if (cur.exclude === "E") {
          this.filePerf[cur.perfRecordFrom].exclude = "E";
        } else if (old.exclude === "E") { // cur.exclude === "" : exclusion has been removed
          this.filePerf[old.perfRecordFrom].exclude = "";
        }
        if (old.perfRecordFrom !== cur.perfRecordFrom) { // PoR has been moved to another record
          this.filePerf[cur.perfRecordFrom].refPoR = legName;
          this.filePerf[cur.perfRecordFrom].exclude = cur.exclude;
          clearRecord(old.perfRecordFrom);
        }
      }
    }

    // the last perfRecordTo refers to the last PoR: its ref must also be stored in filePerf
    for (let iLoop = this.perfCircuit[0].newLoop.length - 1; iLoop >= 0; iLoop--) {
      for (let i = this.perfCircuit.length - 1; i >= 0; i--) {
        const cur = this.legAt(i, iLoop);
        if (cur.perfRecordFrom !== 0 && cur.perfRecordTo !== 0) {
          this.filePerf[cur.perfRecordTo].refPoR = this.savePerfCircuit[i].newLoop[0].to;
          this.filePerf[cur.perfRecordTo].exclude = cur.exclude;
          return; // last item found
        }
      }
    }
  }

  /** after saving, deleted loops disappear from the table (highest index first so indexes stay valid) */
  private removeDeletedLoops() {
    let removed = false;
    for (let iLoop = this.tabManageLoop.length - 1; iLoop >= 0; iLoop--) {
      if (this.tabManageLoop[iLoop] !== "D") { continue; }
      for (const leg of this.perfCircuit) { leg.newLoop.splice(iLoop, 1); }
      removed = true;
    }
    if (removed) {
      this.resetLoopFlags();
      this.perfTotalCircuit = createPerfTotal(this.perfCircuit, this.perfTotalCircuit);
      this.fnSizeTable();
    }
  }

  // ---------------------------------------------------------------- reinit / copy

  reInitialisePerf() {
    this.resetVar();
    this.perfCircuit = copyInOut(this.savePerfCircuit, []);
    this.resetLoopFlags();
    this.perfTotalCircuit = createPerfTotal(this.perfCircuit, this.perfTotalCircuit);
  }

  copyToSavePerfCirc() {
    this.savePerfCircuit = copyInOut(this.perfCircuit, []);
  }

  resetVar() {
    this.saveMsg.set("");
    this.isFilesToSave = false;
    this.errorMessage.set("");
    this.errorMsg.set("");
  }

  // ---------------------------------------------------------------- exclude / modify a leg

  actionExclude(event: any) {
    this.resetVar();
    this.isManageExclude = false;
    this.isModifOk = false;

    const id: string = event.target.id;
    const [iLeg, jLoop] = this.TabOfId;

    switch (id) {
      case "accept":
        this.legAt(iLeg, jLoop).exclude = "";
        this.refreshTotal(jLoop);
        break;
      case "delete":
        this.resetLeg(iLeg, jLoop);
        this.legAt(iLeg, jLoop).exclude = "D";
        this.refreshTotal(jLoop);
        break;
      case "exclude":
        this.legAt(iLeg, jLoop).exclude = "E";
        this.refreshTotal(jLoop);
        break;
      case "restore":
        this.perfCircuit = copyLegInOut(this.savePerfCircuit, this.perfCircuit, iLeg, jLoop);
        this.refreshTotal(jLoop);
        break;
      case "search":
        this.searchRecord();
        break;
      case "modFrom":
      case "modTo":
        this.modifyPoR(id, iLeg, jLoop);
        break;
    }
  }

  private searchRecord() {
    this.isManageExclude = true;
    this.isNewRecordValid = false;
    const raw = this.formOptions.controls["record"].value;
    const rec = Number(raw);
    if (raw === "" || isNaN(rec)) {
      this.errorMsg.set('record must be a numeric value');
    } else if (Number.isInteger(rec) && rec >= 0 && rec < this.filePerf.length) {
      this.isNewRecordValid = true;
      this.newLat = this.filePerf[rec].lat;
      this.newLon = this.filePerf[rec].lon;
      this.isModifOk = true;
    } else {
      this.errorMsg.set("record does not exist");
    }
  }

  /** moves the start ("modFrom") or the end ("modTo") of a leg, and the neighbouring leg which shares that point */
  private modifyPoR(action: "modFrom" | "modTo", iLeg: number, jLoop: number) {
    this.isNewRecordValid = false;
    const rec = this.recordValue();
    const cur = this.legAt(iLeg, jLoop);
    const lastLeg = this.perfCircuit.length - 1;

    let neighbour: classNewLoop | null = null;
    let neighbourLoop = jLoop;

    if (action === "modFrom") {
      if (iLeg > 0) {
        neighbour = this.legAt(iLeg - 1, jLoop);
      } else if (jLoop > 0) { // previous leg is the last leg of the previous loop
        neighbourLoop = jLoop - 1;
        neighbour = this.legAt(lastLeg, neighbourLoop);
      }
      if (neighbour) { neighbour.perfRecordTo = rec; }
      cur.perfRecordFrom = rec;
    } else {
      if (iLeg < lastLeg) {
        neighbour = this.legAt(iLeg + 1, jLoop);
      } else if (jLoop < this.perfCircuit[iLeg].newLoop.length - 1) { // next leg is the first leg of the next loop
        neighbourLoop = jLoop + 1;
        neighbour = this.legAt(0, neighbourLoop);
      }
      if (neighbour) { neighbour.perfRecordFrom = rec; }
      cur.perfRecordTo = rec;
    }

    this.recomputeLeg(cur);
    if (neighbour) { this.recomputeLeg(neighbour); }

    // totals of the loop(s) concerned
    this.refreshTotal(jLoop);
    if (neighbourLoop !== jLoop) { this.refreshTotal(neighbourLoop); }
  }

  testValueModif(event: any) {
    // should be a warning ===> CODE NOT COMPLETED
    // verification to be made at time of file saving
    if (event !== "modFrom") { return; }

    const [iLeg, jLoop] = this.TabOfId;
    const value = this.formOptions.controls["record"].value;
    const lastLeg = this.perfCircuit.length - 1;
    const cur = this.legAt(iLeg, jLoop);
    const msg = (cmp: string, what: string, limit: number) =>
      `Cannot be modified - value entered ${value} cannot be ${cmp} than ${what} = ${limit}`;

    if (iLeg > 0 && jLoop > 0 && this.legAt(iLeg - 1, jLoop).perfRecordFrom >= value) {
      this.errorMsg.set(msg("smaller", "start of previous PoR", this.legAt(iLeg - 1, jLoop).perfRecordFrom));
    } else if (iLeg > 0 && iLeg < lastLeg && this.legAt(iLeg + 1, jLoop).perfRecordTo < value) {
      this.errorMsg.set(msg("greater", "end of next PoR", this.legAt(iLeg + 1, jLoop).perfRecordTo));
    } else if (cur.perfRecordTo < value) {
      this.errorMsg.set(msg("greater", "end of current PoR", cur.perfRecordTo));
    } else if (iLeg === 0 && jLoop > 0 && this.legAt(lastLeg, jLoop - 1).perfRecordFrom >= value) {
      this.errorMsg.set(msg("smaller", "start of previous PoR", this.legAt(lastLeg, jLoop - 1).perfRecordFrom));
    }
  }

  // ---------------------------------------------------------------- changes
  nbSave:number=-1;
  ngOnChanges(changes: SimpleChanges) {
    this.log("ngOnChanges display-circuit, nbSave=" + this.nbSave);
    let callInit = false;

    for (const propName of Object.keys(changes)) {
      if (changes[propName].firstChange) { continue; }
      if (propName === 'nbSave') {
        if (this.nbSave >= 0) {
          this.saveMsg.set("Perf file has been updated");
          this.log("display-circuit : perf file has been updated");
          this.copyToSavePerfCirc();
        } else {
          this.saveMsg.set("pb with upload - perf file has not been updated");
          this.log("pb with upload - display-circuit : perf file has not been updated");
        }
      } else if (propName === 'filePerf' || propName === 'headerPerf' || propName === 'perfCircuit') {
        callInit = true;
      }
    }
    if (callInit) { this.ngOnInit(); }
  }

  private log(...args: unknown[]) {
    if (this.debug) console.log('[display-circuit-loop:]', ...args);
  }
}
