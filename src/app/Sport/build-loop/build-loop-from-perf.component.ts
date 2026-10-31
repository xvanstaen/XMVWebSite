import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';

import { classPointOfRef, classCircuitRec, classFilePerf, classHeaderFileSport, PerfLeg } from '../classSport';
import { updateTabPor, buildPerfCircuitRef } from '../commonSportFunctions';
import { DisplayCircuitLoopComponent } from '../display-circuit-loop/display-circuit-loop.component';

@Component({
  selector: 'app-build-loop-from-perf',
  templateUrl: './build-loop-from-perf.component.html',
  styleUrls: ['./build-loop-from-perf.component.css'],
  standalone: true,
  imports: [DisplayCircuitLoopComponent],
})
export class BuildLoopFromPerfComponent implements OnInit, OnChanges {

  @Input() specificCircuit = new classCircuitRec;
  @Input() filePerf: Array<classFilePerf> = [];
  @Input() headerPerf = new classHeaderFileSport;
  @Input() nbSave: number = 0;
  @Output() savePerf = new EventEmitter<any>();

  displayTab: number = 1;

  // forwarded to display-circuit
  loopNbSave: number = 0;
  fwdFilePerf: Array<classFilePerf> = [];
  fwdHeaderPerf = new classHeaderFileSport;

  perfCircuitRef: Array<PerfLeg> = [];
  errMsg: string = "";
  isInitFileEnded: boolean = false;

  ngOnInit() {
    this.rebuild();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['nbSave'] && !changes['nbSave'].firstChange) {
      // the perf file has been saved: tell display-circuit
      this.loopNbSave = this.nbSave;
    }
    const inputsChanged = ['filePerf', 'specificCircuit'].some(p => changes[p] && !changes[p].firstChange);
    if (inputsChanged) {
      this.rebuild();
    }
  }

  /** builds the loops from the PoR already stored in the perf file */
  private rebuild() {
    this.errMsg = "";
    this.isInitFileEnded = false;
    this.perfCircuitRef = [];

    const initPerfPoR = updateTabPor(this.filePerf);
    if (initPerfPoR.length === 0) {
      this.errMsg = "No Point Of References found in the perf file " + this.headerPerf.name;
      return;
    }
    this.perfCircuitRef = buildPerfCircuitRef(this.specificCircuit.points as Array<classPointOfRef>, initPerfPoR, this.filePerf);
    this.fwdFilePerf = this.filePerf;
    this.fwdHeaderPerf = this.headerPerf;
    this.isInitFileEnded = true;
  }

  fwdSavePerf(event: any) {
    this.savePerf.emit(event);
  }
}
