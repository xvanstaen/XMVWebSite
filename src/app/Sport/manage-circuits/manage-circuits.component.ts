import { Component, signal, Input, Output, EventEmitter, DestroyRef, inject } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { configServer, LoginIdentif, classTabMetaPerso } from '../../JsonServerClass';
import { classPointOfRef, classCircuitRec, classCountryPoR } from '../classSport';
import { findIds } from '../../MyStdFunctions';
import { ManagePointOfRefComponent } from '../manage-point-of-ref/manage-point-of-ref.component';
import { ManageGoogleService } from '../../CloudServices/ManageGoogle.service';

type Handler = (event: any) => void;

@Component({
  selector: 'app-manage-circuits',
  templateUrl: './manage-circuits.component.html',
  styleUrls: ['./manage-circuits.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ManagePointOfRefComponent],
})
export class ManageCircuitsComponent {

  private readonly scroller = inject(ViewportScroller);
  private readonly ManageGoogleService = inject(ManageGoogleService);
  private readonly destroyRef = inject(DestroyRef);

  @Output() returnCircuit = new EventEmitter<any>();
  @Input() configServer = new configServer;
  @Input() identification = new LoginIdentif;
  @Input() selectionCircuit = false;

  debug = false;

  tabPoR: Array<classCountryPoR> = [];
  selectedPoint = new classPointOfRef;

  isCircuitSelected = true;
  listCountry: Array<{ country: string; code: string }> = [];
  fileCircuit: Array<classCircuitRec> = [];

  errorMessage = signal<string>("");
  isFileModified = signal<boolean>(false);
  isFileCircuitReceived = signal<boolean>(false);

  formOptions = new FormGroup({
    pointRef: new FormControl("", { nonNullable: true }),
    lat: new FormControl(0, { nonNullable: true }),
    lgt: new FormControl(0, { nonNullable: true }),
    dist: new FormControl(0, { nonNullable: true }),
    fileName: new FormControl("", { nonNullable: true }),
  });

  tabAction = ["Cancel", "Add before", "Add after", "Delete"];
  tabActionH = ["Cancel", "Add before", "Add after", "Delete", "Zoom-in", "Zoom-out"];
  tabRef: Array<classPointOfRef> = [];
  tabDialog: Array<boolean> = [];
  iDialog = 0;
  expandCircuit = -1;

  isTabOfRefReceived = false;
  isDeleteCircuit = false;
  isDeletePoR = false;
  saveConfirmed = false;

  TabOfId: Array<any> = [];
  errorMsg = "";
  sizeBox = 0;
  sizeRow = 30;

  // country name -> PoR list, rebuilt whenever tabPoR changes
  private porByCountry = new Map<string, classPointOfRef[]>();

  // ---- dispatch table replaces the long if / else-if chain in onInput ----
  private readonly handlers: Record<string, Handler> = {
    actionH:       () => this.openDialog(1),
    selActionH:    () => this.onCircuitAction(),
    name:          e  => this.setCircuitField('name', e.target.value),
    country:       e  => this.setCircuitField('country', e.target.value),
    city:          e  => this.setCircuitField('city', e.target.value),
    dist:          e  => { this.fileCircuit[this.TabOfId[0]].dist[this.TabOfId[1]] = Number(e.target.value); this.isFileModified.set(true); },
    PoRef:         e  => this.onPoRSearch(e.target.value),
    selPoR:        () => this.onPoRSelected(),
    actionPoR:     () => this.openDialog(2),
    selAction:     () => this.onPoRAction(),
    delPoRYES:     () => { this.isDeletePoR = false; this.fileCircuit[this.TabOfId[0]].points.splice(this.TabOfId[1], 1); this.isFileModified.set(true); },
    delPoRNO:      () => { this.isDeletePoR = false; },
    delCircuitYES: () => { this.isDeleteCircuit = false; this.fileCircuit.splice(this.TabOfId[0], 1); this.isFileModified.set(true); this.sizeTheBox(); },
    delCircuitNO:  () => { this.isDeleteCircuit = false; },
    returnCircuit: () => this.returnCircuit.emit(this.fileCircuit[this.TabOfId[0]]),
  };

  ngOnInit() {
    this.loadCircuits(this.identification.circuits.bucket, this.identification.circuits.file);
    this.loadCountries("config-xmvit", "CountryISOPreferred.json");
  }

  resetBooleans() {
    this.tabDialog[this.iDialog] = false;
    this.errorMessage.set("");
    this.errorMsg = "";
  }

  manageFile(event: any) {
    this.tabPoR = event;
    this.porByCountry.clear();
    for (const c of this.tabPoR) this.porByCountry.set(c.country, c.PoR);
    this.isTabOfRefReceived = true;
  }

  onInput(event: any) {
    this.resetBooleans();
    const { tabOfId, strFound } = findIds(event.target.id, "-");
    this.TabOfId = [...tabOfId];
    this.handlers[strFound]?.(event);
    this.scrollBottom();
  }

  // ---------- dialogs ----------
  private openDialog(index: number) {
    this.iDialog = index;
    this.tabDialog = this.tabDialog.map(() => false);
    this.tabDialog[index] = true;
  }

  // ---------- circuit actions ----------
  private newCircuit(): classCircuitRec {
    const c = new classCircuitRec;
    c.points.push(new classPointOfRef);
    return c;
  }

  private onCircuitAction() {
    this.iDialog = 1;
    this.tabDialog[1] = false;
    const [ci, ai] = this.TabOfId;
    switch (this.tabActionH[ai]) {
      case "Add after":  this.fileCircuit.splice(ci + 1, 0, this.newCircuit()); this.isFileModified.set(true); break;
      case "Add before": this.fileCircuit.splice(ci, 0, this.newCircuit());     this.isFileModified.set(true); break;
      case "Delete":     this.isDeleteCircuit = true; break;   // modified flag set only once confirmed
      case "Zoom-in":    this.expandCircuit = ci; this.sizeTheBox(); break;
      case "Zoom-out":   this.expandCircuit = -1; this.sizeTheBox(); break;
    }
  }

  private setCircuitField(field: 'name' | 'country' | 'city', value: string) {
    this.fileCircuit[this.TabOfId[0]][field] = value;
    this.isFileModified.set(true);
  }

  // ---------- point of reference ----------
  private onPoRSearch(value: string) {
    this.openDialog(0);
    this.tabRef.length = 0;                                   // was never cleared between keystrokes
    const list = this.porByCountry.get(this.fileCircuit[this.TabOfId[0]].country) ?? [];
    const needle = value.toLowerCase().trim();
    for (const p of list) {
      if (p.ref.toLowerCase().includes(needle)) this.tabRef.push(p);
    }
    if (this.tabRef.length === 1) {
      this.applyPoR(this.tabRef[0]);
      this.tabRef.length = 0;
    }
  }

  private onPoRSelected() {
    this.applyPoR(this.tabRef[this.TabOfId[2]]);
    this.tabRef.length = 0;
  }

  private applyPoR(src: classPointOfRef) {
    const dst = this.fileCircuit[this.TabOfId[0]].points[this.TabOfId[1]];
    dst.ref = src.ref;
    dst.alt = src.alt;
    dst.lat = src.lat;
    dst.lon = src.lon;
    dst.varLat = src.varLat;
    dst.varLon = src.varLon;
    dst.prio = src.prio;
    this.isFileModified.set(true);
  }

  private onPoRAction() {
    this.iDialog = 2;
    this.tabDialog[2] = false;
    const [ci, pi, ai] = this.TabOfId;
    const points = this.fileCircuit[ci].points;
    switch (this.tabActionH[ai]) {
      case "Add after":  points.splice(pi + 1, 0, new classPointOfRef); this.isFileModified.set(true); break;
      case "Add before": points.splice(pi, 0, new classPointOfRef);     this.isFileModified.set(true); break;
      case "Delete":     this.isDeletePoR = true; break;
    }
  }

  updateAllCircuits(event: any) {
    if (event.target.id !== "updatePoRYES") return;
    for (const circuit of this.fileCircuit) {
      const list = this.porByCountry.get(circuit.country);
      if (!list) continue;
      const byRef = new Map(list.map(p => [p.ref, p] as const));   // O(n) instead of O(n*m)
      for (const pt of circuit.points) {
        const src = byRef.get(pt.ref);
        if (src) {
          pt.lat = src.lat;
          pt.lon = src.lon;
          pt.varLat = src.varLat;
          pt.varLon = src.varLon;
          pt.prio = src.prio;
        }
      }
    }
    this.isFileModified.set(true);
  }

  onSelectPoR(event: any) {
    this.selectedPoint = event;
  }

  // ---------- save / reload ----------
  manageUpdates(event: any) {
    switch (event.target.id) {
      case "confirmSave":
        this.saveConfirmed = true;
        this.formOptions.controls.fileName.setValue(this.identification.circuits.file);
        break;
      case "reinitialize":
        this.loadCircuits(this.identification.circuits.bucket, this.identification.circuits.file);
        this.saveConfirmed = false;
        this.isFileModified.set(false);
        break;
      case "saveFile":
        this.checkCodeCircuit();
        this.saveFile(this.identification.circuits.bucket, this.formOptions.controls.fileName.value, this.fileCircuit);
        break;
      case "cancelSave":
        this.saveConfirmed = false;
        break;
    }
  }

  checkCodeCircuit() {
    this.fileCircuit.forEach((c, i) => {
      if (!c.code) {
        const found = this.listCountry.find(x => x.country === c.country);   // old code crashed when not found
        c.code = (found?.code ?? "XX") + '-' + i;
      }
    });
  }

  saveFile(bucket: string, object: string, record: any) {
    this.errorMessage.set("");
    const meta = new classTabMetaPerso;
    meta.key = "fileType";
    meta.value = "circuit";
    const type = 'application/json';
    const file = new File([JSON.stringify(record)], object, { type });

    this.ManageGoogleService.uploadObjectMetaPerso(this.configServer, bucket, file, object, "", type, [meta])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          if (res.type === 4) {
            this.errorMessage.set("file " + object + " has been successfully saved");
            this.log(this.errorMessage());
            this.isFileModified.set(false);
            this.saveConfirmed = false;
            this.scrollBottom();
          }
        },
        error: err => {
          this.errorMessage.set('failure to save record ' + object + ' ;  error = ' + JSON.stringify(err));
          this.log(this.errorMessage());
          this.scrollBottom();
        },
      });
  }

  sizeTheBox() {
    const maxSizeBox = 400;
    const marginSizeBox = 60;
    const rows = this.expandCircuit !== -1
      ? this.fileCircuit[this.expandCircuit].points.length + this.fileCircuit.length
      : this.fileCircuit.length;
    const extra = this.expandCircuit !== -1 ? 80 : 0;
    this.sizeBox = Math.min(rows * this.sizeRow + marginSizeBox + extra, maxSizeBox);
  }

  // ---------- loading ----------
  private loadCircuits(bucket: string, object: string) {
    this.errorMessage.set("");
    this.ManageGoogleService.getContentObject(this.configServer, bucket, object)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any[]) => {
          this.fileCircuit = data.map(d => {
            const c = new classCircuitRec;
            c.city = d.city;
            c.code = d.code;
            c.name = d.name;
            c.country = d.country;
            c.points = d.points;
            c.dist = d.dist ?? d.points.map(() => 0);
            return c;
          });
          this.isFileCircuitReceived.set(true);
          if (this.selectionCircuit) this.returnCircuit.emit(this.fileCircuit);
          this.sizeTheBox();
          this.scrollBottom();
        },
        error: error => {
          this.errorMessage.set('failure to get record ' + object + ' ;  error = ' + JSON.stringify(error));
          this.log(this.errorMessage());
          const c = this.newCircuit();
          c.name = "";
          c.country = "Singapore";
          c.city = "";
          c.code = "SI-1";
          this.fileCircuit = [c];
          this.isFileCircuitReceived.set(true);
          this.sizeTheBox();
          this.scrollBottom();
        },
      });
  }

  private loadCountries(bucket: string, object: string) {
    this.ManageGoogleService.getContentObject(this.configServer, bucket, object)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          if (data.text === undefined) {
            this.listCountry = data;
          } else {
            this.listCountry = this.parseCountries(data.text);
            this.saveFile("config-xmvit", "CountryISO.json", this.listCountry);
          }
          this.scrollBottom();
        },
        error: error => {
          this.errorMessage.set('failure to get record ' + object + ' ;  error = ' + JSON.stringify(error));
          this.log(this.errorMessage());
        },
      });
  }

  // same parsing logic as before, isolated and without repeated substring copies of listCountry
  private parseCountries(text: string): Array<{ country: string; code: string }> {
    const out: Array<{ country: string; code: string }> = [];
    const sep = " = '";
    let str = text;
    while (str.length > 5) {
      const i = str.indexOf(sep);
      if (i === -1) break;                                    // old loop could spin forever here
      out.push({ country: str.substring(1, i), code: str.substring(i + 4, i + 6).toUpperCase() });
      str = str.substring(i + 11);
    }
    return out;
  }

  private scrollBottom() {
    this.scroller.scrollToAnchor('bottomCircuit');
  }

  private log(...args: unknown[]) {
    if (this.debug) console.log('[manage-circuits:]', ...args);
  }
}
