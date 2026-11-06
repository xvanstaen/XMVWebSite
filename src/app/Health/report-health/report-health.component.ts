import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output,
  SimpleChanges, computed, input, signal, viewChildren,
} from '@angular/core';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';

import { MainManageFileComponent } from '../../fileAccessMgt/file-access.component';
import { ColorPaletteComponent } from '../../color-picker/color-palette/color-palette.component';
import { ColorSliderComponent } from '../../color-picker/color-slider/color-slider.component';

import { mainDailyReport } from '../ClassHealthCalories';
import { classchartHealth } from '../classConfigChart';
import { classPosSlider, configServer, LoginIdentif, classtheEvent } from '../../JsonServerClass';
import { classFileParamChart, classReturnColor, classTabFormChart } from '../classChart';
import { classAccessFile, classHeaderReturnDataFS } from '../../classFileSystem';
import { addMonthDay, strDateTime } from '../../MyStdFunctions';
import { specialDraw } from '../../manageChartFn';
import { fillHealthDataSet } from '../../fillChartData';

// ───────────────────────────── constants & small helpers ─────────────────────────────

const LOCK_FILE = 5;               // index of the chart-config file inside tabLock
const MAX_CANVAS = 5;              // number of charts / canvases
const CHECK_THROTTLE_MS = 5000;    // min delay between two lock checks triggered by user activity
const DATE_RE = /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/;

type ColorKey = 'canvas' | 'legend' | 'chartTitle' | 'box' | 'xBorder' | 'xTicks' | 'yBorder' | 'yTicks';
type ListKind = 'type' | 'period' | 'periodAll' | 'fontWeight' | 'textAlign' | 'titlePosition' | 'titleDisplay';
type FieldKind = 'label' | 'limit';
type RgbaPair = { slider: classReturnColor; palette: classReturnColor };

const COLOR_KEYS: ColorKey[] = ['canvas', 'legend', 'chartTitle', 'box', 'xBorder', 'xTicks', 'yBorder', 'yTicks'];

const newRgba = (): RgbaPair => ({ slider: new classReturnColor, palette: new classReturnColor });

/** Deep copy that keeps the prototype; falls back to the original reference if the value cannot be cloned. */
function clone<T>(v: T): T {
  try {
    const c = structuredClone(v);
    return v && typeof v === 'object' ? Object.setPrototypeOf(c, Object.getPrototypeOf(v)) : c;
  } catch {
    return v;
  }
}

/** 'false' / false => false, anything else => true (same rule the original code applied to "stacked"). */
const toBool = (v: unknown): boolean => !(v === false || v === 'false');

/** Disabled, non-nullable control (the whole form is enabled only when the user owns the file lock). */
const ctl = (value: unknown, validators: ValidatorFn[] = []) =>
  new FormControl<any>({ value, disabled: true }, { nonNullable: true, validators });
const dateCtl = () => ctl('', [Validators.required, Validators.pattern(DATE_RE)]);
const axisForm = () => new FormGroup({
  borderColor: ctl(''), borderWidth: ctl(0), position: ctl(''), stacked: ctl(''), ticksColor: ctl(''),
});

/** Limit line drawn on top of a bar dataset. `ref` = per-day reference array returned by fillHealthDataSet. */
interface LimitDef { name: string; idx: number; value: (h: any) => number; ref?: 'refSaturated' | 'refSugar' | 'refCarbs'; }
const LIMIT_DEFS: Record<string, LimitDef> = {
  'Cholesterol':   { name: 'Chol. limit',      idx: 0, value: h => Number(h.Cholesterol.myLimit) },
  'Saturated Fat': { name: 'Sat. limit',       idx: 1, value: h => Number(h.SaturatedFat), ref: 'refSaturated' },
  'Proteins':      { name: 'Prot. limit',      idx: 2, value: h => Number(h.Protein) },
  'Carbs':         { name: 'Carbs limit',      idx: 3, value: h => Number(h.Carbs), ref: 'refCarbs' },
  'Sugar':         { name: 'Add. Sugar limit', idx: 4, value: h => Number(h.Sugar), ref: 'refSugar' },
};

@Component({
  selector: 'app-report-health',
  templateUrl: './report-health.component.html',
  styleUrls: ['./report-health.component.css'],
  // small utility classes that replace the inline styles repeated dozens of times in the template
  styles: [`
    :host .rh-row { width:100%; display:inline-block; margin-top:5px; }
    :host .rh-section { text-align:center; width:100%; color:blue; font-weight:bold; font-size:14px; display:inline-block; margin-top:10px; }
    :host .rh-swatch { width:20px; height:20px; margin-left:10px; border:1px solid black; }
    :host .rh-dialog { width:98%; max-width:410px; margin-left:20px; border:solid 2px blue; display:inline-block; height:480px; }
    :host .rh-dialog-title { margin-top:8px; text-align:center; width:100%; display:block; font-size:16px; color:blue; float:right; }
    :host .rh-cross { font-size:16px; color:black; font-weight:bold; margin-top:-2px; }
    :host .rh-box { width:95%; max-width:410px; margin-left:20px; border:solid 2px blue; display:block; }
    :host .rh-pick { width:47%; display:inline-block; margin-left:10px; }
    :host .rh-pick-name { width:50%; margin-left:10px; color:blue; display:inline-block; }
    :host .rh-note { width:99%; display:inline-block; margin-left:10px; color:blue; }
    :host .rh-btn { margin-left:30px; width:90px; height:45px; }
  `],
  standalone: true,
  imports: [DecimalPipe, NgTemplateOutlet, ReactiveFormsModule, MainManageFileComponent, ColorPaletteComponent, ColorSliderComponent],
})
export class ReportHealthComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  // ───────────────────────────── inputs / outputs ─────────────────────────────
  @Input() identification = new LoginIdentif;
  @Input() HealthAllData = new mainDailyReport;
  @Input() ConfigChartHealth = new classchartHealth;
  @Input() inFileParamChart = new classFileParamChart;
  @Input() configServer = new configServer;
  @Input() tabLock: Array<classAccessFile> = [];   // .lock: 0=unlocked; 1=locked by user; 2=locked by other user; 3=must be checked
  @Input() returnDataFSParamChart = new classHeaderReturnDataFS;
  @Input() resultCheckLimitParamChart: number = 0;
  @Input() statusSaveFn: any;

  triggerParamSave = input.required<number>();

  // kept for the parent's bindings
  @Output() checkLockLimit = new EventEmitter<any>();
  @Output() processSave = new EventEmitter<any>();
  @Output() retrieveRecord = new EventEmitter<any>();
  @Output() unlockFile = new EventEmitter<any>();
  @Output() cancelUpdates = new EventEmitter<any>();

  // ───────────────────────────── file-access child ─────────────────────────────
  triggerCheckToLimit = signal(0);
  triggerFileSystem = signal(-1);
  triggerReadFile = signal(-1);
  triggerSaveFile = signal(-1);
  openFileAccess = signal(false);
  theEvent = new classtheEvent;
  lockValueBeforeCheck = 0;
  onInputAction = '';
  lastInputAt = '';
  private lastCheckAt = 0;

  /** state of the file lock (0,1,2,3) – read through getters so the template never touches tabLock[5] directly */
  get lockState(): number | undefined { return this.tabLock[LOCK_FILE]?.lock; }
  get isLocked(): boolean { return this.lockState === 1; }
  get isLockedByOther(): boolean { return this.lockState === 2; }

  // ───────────────────────────── forms ─────────────────────────────
  readonly tabPeriod = ['daily', 'weekly'];
  readonly chartNumbers = [1, 2, 3, 4, 5];

  paramAllCharts = new FormGroup({
    period: new FormControl({ value: 'daily', disabled: false }, { nonNullable: true }),
    nbWeeks: new FormControl({ value: 1, disabled: false }, { nonNullable: true }),
    startRange: new FormControl({ value: '', disabled: false }, [Validators.required, Validators.pattern(DATE_RE)]),
    endRange: new FormControl({ value: '', disabled: false }, [Validators.required, Validators.pattern(DATE_RE)]),
  });

  selectChart: FormGroup = new FormGroup({
    chartType: ctl('line'), barThickness: ctl(0), chartTitle: ctl(''), colorChartTitle: ctl(''), ratio: ctl(0),
    canvasWidth: ctl(0), canvasHeight: ctl(0), canvasMarginLeft: ctl(0), stackedX: ctl(''), stackedY: ctl(''),
    canvasBackground: ctl(''), legendTitle: ctl(''), colorLegendTitle: ctl(''),
    boxwidth: ctl(0), boxheight: ctl(0), boxpointStyle: ctl(''), boxusePointStyle: ctl(false), boxcolor: ctl(''),
    boxfontSize: ctl(0), boxradius: ctl(0), boxfontWeight: ctl(''), boxfontFamily: ctl(''),
    period: ctl(''), nbWeeks: ctl(1), startRange: dateCtl(), endRange: dateCtl(),
  });

  selectTitle: FormGroup = new FormGroup({
    paddingTop: ctl(0), paddingBottom: ctl(0), paddingLeft: ctl(0), position: ctl(''), display: ctl(false),
    text: ctl(''), align: ctl(''), color: ctl(''),
    paletteRgba: ctl(0), paletteXpos: ctl(0), paletteYpos: ctl(0), sliderRgba: ctl(0), sliderXpos: ctl(0), sliderYpos: ctl(0),
    fontSize: ctl(0), fontWeight: ctl(''), family: ctl(''),
  });

  selectAxisX: FormGroup = axisForm();
  selectAxisY: FormGroup = axisForm();
  readonly axes = [
    { title: 'Axis X', form: this.selectAxisX, border: 'xBorder' as ColorKey, ticks: 'xTicks' as ColorKey },
    { title: 'Axis Y', form: this.selectAxisY, border: 'yBorder' as ColorKey, ticks: 'yTicks' as ColorKey },
  ];

  SpecificForm = new FormGroup({ FileName: new FormControl('', { nonNullable: true }) });
  IsSaveConfirmed = signal(false);

  // ───────────────────────────── chart data ─────────────────────────────
  selectedChart = 0;                                 // 0 = none, 1..5
  errorMsg = '';
  lineChartType: string[] = [];
  tabParamChart: classTabFormChart[] = [];           // working table (one entry per chart)
  tabCtx: any[] = [];
  tabChart: any[] = [];
  canvas: Array<{ width: any; height: any; background: any; marginLeft: any }> =
    Array.from({ length: MAX_CANVAS }, () => ({ width: '', height: '', background: '', marginLeft: '' }));
  private readonly canvasRefs = viewChildren<ElementRef<HTMLCanvasElement>>('baseChart');

  // selected items (Y/N) + colours for the current chart
  selectedFields: string[] = [];
  selectedLimitFields: string[] = [];
  tabOfLabelsColor: string[] = [];
  tabOfLimitLabelsColor: string[] = [];
  tabLabelRgba: any[] = [newRgba()];
  tabLimitLabelRgba: any[] = [newRgba()];

  // ───────────────────────────── drop-down lists / dialogs ─────────────────────────────
  readonly tabFontWeight = ['cancel', '100', '200', '300', '400', '500', '600', '700', '800', '900', 'bold', 'bolder', 'lighter', 'normal'];
  readonly tabTextAlign = ['cancel', 'center', 'left', 'right', 'end', 'start', 'inherit', 'initial'];
  readonly tabTitlePosition = ['cancel', 'top', 'bottom'];
  readonly tabDisplay = [false, true];

  /** the single drop-down list currently open (replaces seven separate boolean signals) */
  openList = signal<ListKind | null>(null);
  isParamTitle = signal(false);
  isParamLegend = signal(false);
  isParamAxis = signal(false);

  // ───────────────────────────── colour picker ─────────────────────────────
  isSliderSelected = signal(false);
  titleDialogColor = signal(false);                  // picker opened from the title/legend dialog
  private colorKey: ColorKey | null = null;          // main-form colour being edited
  private labelPick: { kind: FieldKind; idx: number } | null = null;

  selColor: Record<ColorKey, string> = Object.fromEntries(COLOR_KEYS.map(k => [k, ''])) as Record<ColorKey, string>;
  rgbaOf: Record<ColorKey, RgbaPair> = Object.fromEntries(COLOR_KEYS.map(k => [k, newRgba()])) as Record<ColorKey, RgbaPair>;
  selected_colorTitle = '';
  temporaryColor = '';

  my_input_child1 = '';   // palette input
  my_input_child2 = '';   // slider input
  returnSlider: any = { rgba: '', xPos: 0, yPos: 0 };
  returnPalette: any = { rgba: '', xPos: 0, yPos: 0 };
  posSlider = new classPosSlider;
  posPalette = new classPosSlider;
  paramChange = 0;
  mainWindow = { top: 120, left: 20 };
  subWindow = { top: 20, left: 10 };

  // ───────────────────────────── inactivity countdown ─────────────────────────────
  private timerId: ReturnType<typeof setInterval> | undefined;
  private deadline = 0;
  isUserTimeOut = false;
  readonly timeLeft = signal(0);   // seconds
  readonly timeLeftParts = computed(() => {
    const s = this.timeLeft();
    return { h: Math.floor(s / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
  });

  // ───────────────────────────── lifecycle ─────────────────────────────

  ngOnInit() {
    const cfg = this.ConfigChartHealth.barDefault.datasets;

    this.posSlider.VerHor = 'H';
    this.posSlider.top = 5;
    this.posSlider.left = 60;
    this.posSlider.div.left = this.mainWindow.left + this.subWindow.left;
    this.posSlider.div.top = this.mainWindow.top + this.subWindow.top;
    this.posPalette.div.left = this.mainWindow.left + this.subWindow.left;
    this.posPalette.div.top = this.mainWindow.top + this.subWindow.top;
    this.posPalette.top = 0;
    this.posPalette.left = 60;

    this.selectedFields = cfg.labels.map(() => 'N');
    this.tabLabelRgba = Array.from({ length: Math.max(1, cfg.labels.length) }, newRgba);
    this.selectedLimitFields = cfg.labelsLimits.map(() => 'N');
    this.tabLimitLabelRgba = Array.from({ length: Math.max(1, cfg.labelsLimits.length) }, newRgba);
    this.lineChartType = [...this.ConfigChartHealth.chartTypes];

    // one working entry per chart: from the saved file when there is one, from the defaults otherwise
    this.tabParamChart = [];
    let nbFromFile = 0;
    if (this.inFileParamChart.fileType !== undefined && this.inFileParamChart.fileType !== '') {
      nbFromFile = Math.min(this.inFileParamChart.data.length, MAX_CANVAS);
      for (let i = 0; i < nbFromFile; i++) {
        this.loadChartFromFile(i);
      }
    }
    for (let i = nbFromFile; i < MAX_CANVAS; i++) {
      this.initTabParamCanvas(i);
    }
    for (let i = 0; i < MAX_CANVAS; i++) {
      this.changeCanvas(i);
    }
    this.lockValueBeforeCheck = this.lockState ?? 0;

    // every chart starts on "last month .. today" whatever the file says
    const startDefault = addMonthDay(new Date(), -1, 0, '-');
    this.paramAllCharts.controls['startRange'].setValue(startDefault);
    const period = this.paramAllCharts.controls['period'].value.toLowerCase().trim();
    for (const t of this.tabParamChart) {
      t.period = period;
      t.nbWeeks = this.paramAllCharts.controls['nbWeeks'].value;
      t.startRange = startDefault;
      t.endRange = '';
    }

    this.lastInputAt = strDateTime();
    this.startCountdown();
    this.setFormsEnabled(this.isLocked);
  }

  ngAfterViewInit() {
    this.canvasRefs().forEach((ref, i) => this.tabCtx[i] = ref.nativeElement.getContext('2d'));
    this.forAllCharts('apply');   // builds the 5 charts once
  }

  ngOnDestroy() {
    this.stopCountdown();
    this.tabChart.forEach(c => c?.destroy?.());
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const prop of Object.keys(changes)) {
      const ch = changes[prop];
      switch (prop) {
        case 'tabLock': {
          const prev = ch.previousValue?.[LOCK_FILE]?.lock;
          if (this.isLocked) {
            if (prev !== undefined && prev !== 1) {
              this.errorMsg = 'You can now update the file';
              this.isUserTimeOut = false;     // lock regained => new inactivity window
              this.startCountdown();
            }
            this.setFormsEnabled(true);
          } else {
            if (prev === 1) { this.errorMsg = 'File is locked by another user'; }
            this.setFormsEnabled(false);
          }
          break;
        }
        case 'triggerParamSave':   // result of the save requested through processSave
          if (!ch.firstChange && this.onInputAction === 'saveParamChart') {
            const lock = this.tabLock[LOCK_FILE];
            if (lock?.lock === 1 && (lock.status === 0 || lock.status === 300)) {
              this.errorMsg = this.theEvent.target.id === 'save'
                ? 'parameters for chart#' + this.selectedChart + ' have been saved'
                : 'for all charts, parameters have been saved';
            } else {
              this.errorMsg = 'Parameters cannot be saved - error=' + lock?.status;
            }
            this.onInputAction = '';
          }
          break;
        case 'returnDataFSParamChart':
          if (!ch.firstChange) {
            if (!this.isLocked && this.onInputAction === 'saveParamChart') {
              this.errorMsg = 'file has been locked by another user; all your updates are lost ('
                + this.returnDataFSParamChart.errorMsg + ') status=' + this.tabLock[LOCK_FILE]?.status;
            }
            this.setFormsEnabled(this.isLocked);
            this.onInputAction = '';
          }
          break;
        case 'statusSaveFn':
          if (!ch.firstChange) {
            this.onInputAction = '';
            this.theEvent.checkLock.action = '';
            if (this.statusSaveFn.status === 200 || this.statusSaveFn.status === 0) {
              this.errorMsg = 'File has been successfully saved';
            } else {
              this.errorMsg = this.statusSaveFn.err;
            }
          }
          break;
      }
    }
  }

  // ───────────────────────────── inactivity / lock check ─────────────────────────────

  private timeoutMs(): number {
    const t = this.configServer.timeoutFileSystem.userTimeOut;
    return (t.hh * 3600 + t.mn * 60 + t.ss) * 1000;
  }

  private startCountdown() {
    this.stopCountdown();
    this.deadline = Date.now() + this.timeoutMs();
    this.tick();
    this.timerId = setInterval(() => this.tick(), 1000);   // 1 tick/second instead of a 60 fps requestAnimationFrame loop
  }

  private stopCountdown() {
    if (this.timerId !== undefined) { clearInterval(this.timerId); this.timerId = undefined; }
  }

  private tick() {
    const left = Math.ceil((this.deadline - Date.now()) / 1000);
    if (left <= 0) {
      this.stopCountdown();
      this.timeLeft.set(0);
      this.isUserTimeOut = true;
      this.unlockFile.emit(LOCK_FILE);
      this.resetBooleans();
    } else {
      this.timeLeft.set(left);
    }
  }

  /** Called on every user action: restarts the countdown and, for theAction='only', asks the file-access child to check the lock. */
  timeOutactivity(iWait: number, isDataModified: boolean, isSaveFile: boolean, theAction: string) {
    this.openFileAccess.set(false);
    if (this.isUserTimeOut) { return; }
    this.lastInputAt = strDateTime();
    this.deadline = Date.now() + this.timeoutMs();
    if (!this.timerId) { this.startCountdown(); }
    if (theAction !== 'only') { return; }

    // a lock check = a server round-trip: do not fire one per click / keystroke (iWait=0 is a confirm-save, always checked)
    const now = Date.now();
    if (iWait !== 0 && now - this.lastCheckAt < CHECK_THROTTLE_MS) { return; }
    this.lastCheckAt = now;

    const cl = this.theEvent.checkLock;
    cl.action = 'checkTO';
    cl.iWait = iWait;
    cl.isDataModified = isDataModified;
    cl.isSaveFile = isSaveFile;
    cl.iCheck = true;
    cl.lastInputAt = this.lastInputAt;
    cl.nbCalls++;
    this.triggerCheckToLimit.update(v => v + 1);
    this.openFileAccess.set(true);
    this.lockValueBeforeCheck = this.lockState ?? 0;
  }

  resultAccessFile(theEvent: any) {
    this.openFileAccess.set(false);
    if (this.lockValueBeforeCheck !== this.lockState) {
      if (this.isLocked) {
        this.setFormsEnabled(true);
        this.errorMsg = 'You can now update the file';
      } else {
        this.errorMsg = 'File is locked by another user';
        this.setFormsEnabled(false);
      }
    }
    if (this.onInputAction === 'confirmSave') {
      this.SpecificForm.controls['FileName'].setValue(this.identification.fitness.files.myChartConfig);
      this.IsSaveConfirmed.set(true);
    }
  }

  private setFormsEnabled(on: boolean) {
    for (const f of [this.selectChart, this.selectTitle, this.selectAxisX, this.selectAxisY]) {
      on ? f.enable({ emitEvent: false }) : f.disable({ emitEvent: false });
    }
  }

  // ───────────────────────────── chart building ─────────────────────────────

  changeCanvas(i: number) {
    const t = this.tabParamChart[i];
    const d = this.ConfigChartHealth.barDefault.canvas;
    const c = this.canvas[i];
    c.height = t.canvasHeight !== 0 ? t.canvasHeight : d.maxHeight;
    c.width = t.canvasWidth !== 0 ? t.canvasWidth : d.maxWidth;
    c.background = t.canvasBackground !== '' ? t.canvasBackground : d.backgroundcolor;
    c.marginLeft = t.canvasMarginLeft !== 0 ? t.canvasMarginLeft : d.marginleft;
  }

  buildChart(nb: number) {
    this.changeCanvas(nb);
    this.tabChart[nb]?.destroy?.();
    this.collectSpecialData(nb);
  }

  forAllCharts(action: 'clear' | 'apply') {
    const p = this.paramAllCharts.controls;
    if (action === 'clear') {
      p['period'].setValue(this.tabPeriod[0]);
      p['nbWeeks'].setValue(0);
      p['startRange'].setValue(addMonthDay(new Date(), -1, 0, '-'));
      p['endRange'].setValue('');
      return;
    }
    const period = p['period'].value.toLowerCase().trim();
    for (let nb = 0; nb < MAX_CANVAS; nb++) {
      const t = this.tabParamChart[nb];
      t.period = period;
      t.nbWeeks = p['nbWeeks'].value;
      if (p['startRange'].value !== null) { t.startRange = p['startRange'].value; }
      if (p['endRange'].value !== null) { t.endRange = p['endRange'].value; }
      this.buildChart(nb);
    }
    // the form shows the selected chart only (it used to be left on the data of chart #5)
    if (this.selectedChart !== 0) { this.fillInFormFromTab(this.selectedChart - 1); }
  }

  private collectSpecialData(nb: number) {
    const param = this.tabParamChart[nb];
    const labels: any[] = [];
    let datasets: any[] = [];

    const ret = fillHealthDataSet(labels, datasets, this.HealthAllData, param, this.ConfigChartHealth, 0, this.identification);
    const refs = { refSaturated: [] as number[], refSugar: [] as number[], refCarbs: [] as number[] };
    if (ret !== undefined) {
      datasets = ret.datasets;
      refs.refSaturated = ret.refSaturated;
      refs.refSugar = ret.refSugar;
      refs.refCarbs = ret.refCarbs;
    }

    // add one horizontal "limit" line per dataset that has a limit defined
    const nbBars = datasets.length;
    const health = this.identification.health;
    for (let i = 0; i < nbBars; i++) {
      const src = datasets[i];
      const def = LIMIT_DEFS[src.label];
      if (!def) { continue; }
      const value = def.value(health);
      if (!(value > 0)) { continue; }

      let data: number[] = [];
      if (def.ref) {
        data = src.data.map((_: unknown, j: number) => refs[def.ref!][j]);
      } else if (param.period === 'daily') {
        data = src.data.map(() => value);
      } else if (param.period === 'weekly') {
        data = src.data.map(() => value * 7);
      }
      const color = param.limitLabelsColor[def.idx];
      const borderColor: any[] = [];
      borderColor[datasets.length] = color;
      datasets.push({
        type: 'line', label: def.name, backgroundColor: '', borderColor, data,
        borderWidth: 3, showLine: true, fill: false,
        pointBorderWidth: 0, pointBorderColor: '', pointBackgroundColor: color, pointStyle: false,
      });
    }

    this.tabChart[nb] = specialDraw(this.tabCtx[nb], param, this.ConfigChartHealth, labels, datasets);
  }

  // ───────────────────────────── chart selection & validation ─────────────────────────────

  selectChartNo(n: number) {
    this.timeOutactivity(5, true, false, 'only');
    if (this.selectedChart !== 0) {
      this.selColor.canvas = this.selColor.legend = this.selColor.box = this.selColor.chartTitle = '';
      this.selected_colorTitle = '';
      this.fillInTabOfCharts(this.selectedChart - 1);
    }
    this.selectedChart = n;
    this.fillInFormFromTab(n - 1);
  }

  cancelChartParam(target: 'all' | 'title' | 'axis') {
    this.timeOutactivity(5, true, false, 'only');
    if (target === 'all') {
      this.selectedChart = 0;
      this.isParamTitle.set(false);
      this.isParamLegend.set(false);
      this.isParamAxis.set(false);
      this.resetBooleans();
    } else if (target === 'title') {
      this.isParamTitle.set(false);
      this.isParamLegend.set(false);
    } else {
      this.isParamAxis.set(false);
    }
  }

  fnSelectChart() {
    this.errorMsg = '';
    const c = this.selectChart.controls;
    const norm = (s: string) => s.toLowerCase().trim();
    const type: string = c['chartType'].value;
    const period: string = c['period'].value;

    if (type !== '' && !this.lineChartType.some(t => norm(t) === norm(type))) {
      this.errorMsg = 'Field TYPE is unknown; please update it';
    } else if (period !== '' && !this.tabPeriod.some(t => norm(t) === norm(period))) {
      this.errorMsg = 'Field PERIOD is unknown; please update it';
    } else if (c['startRange'].value !== '' && c['endRange'].value !== '' && c['endRange'].value < c['startRange'].value) {
      this.errorMsg = 'end date cannot be before start date; please update';
    } else if (isNaN(c['canvasWidth'].value)) {
      this.errorMsg = 'Field CANVAS WIDTH is not a numeric';
    } else if (isNaN(c['canvasHeight'].value)) {
      this.errorMsg = 'Field CANVAS HEIGHT is not a numeric';
    } else if (isNaN(c['ratio'].value)) {
      this.errorMsg = 'Field RATIO is not a numeric';
    }
    if (this.errorMsg === '') {
      this.fillInTabOfCharts(this.selectedChart - 1);
      this.buildChart(this.selectedChart - 1);
    }
  }

  // ───────────────────────────── drop-down lists ─────────────────────────────

  openOptionList(kind: ListKind) {
    this.timeOutactivity(5, true, false, 'only');
    this.resetBooleans();
    this.openList.set(kind);
  }

  pickOption(kind: ListKind, value: any) {
    this.timeOutactivity(5, true, false, 'only');
    this.resetBooleans();                       // closes the list
    if (value === 'cancel') { return; }
    const text = String(value).trim();
    switch (kind) {
      case 'type':          this.selectChart.controls['chartType'].setValue(text); break;
      case 'period':        this.selectChart.controls['period'].setValue(text.toLowerCase()); break;
      case 'periodAll':     this.paramAllCharts.controls['period'].setValue(text.toLowerCase()); break;
      case 'fontWeight':    this.selectTitle.controls['fontWeight'].setValue(text); break;
      case 'textAlign':     this.selectTitle.controls['align'].setValue(text); break;
      case 'titlePosition': this.selectTitle.controls['position'].setValue(text); break;
      case 'titleDisplay':  this.selectTitle.controls['display'].setValue(value); break;   // keeps the boolean
    }
  }

  // ───────────────────────────── title / legend / axis dialogs ─────────────────────────────

  viewTitle(kind: 'chart' | 'legend') {
    this.timeOutactivity(5, true, false, 'only');
    this.resetBooleans();
    const t = this.tabParamChart[this.selectedChart - 1];
    if (kind === 'chart') { this.transferTitle('chart', t.chartTitle, t.chartTitleRgba); }
    else { this.transferTitle('legend', t.legendTitle, t.legendTitleRgba); }
  }

  viewAxis() {
    this.timeOutactivity(5, true, false, 'only');
    this.resetBooleans();
    this.isParamAxis.set(true);
  }

  private transferTitle(kind: 'chart' | 'legend', src: any, rgba: any) {
    this.resetBooleans();
    this.isParamTitle.set(false);
    this.isParamLegend.set(false);
    const main = this.selectChart.controls;
    const v: any = {
      fontWeight: src.font.weight, fontSize: src.font.size, family: src.font.family,
      align: src.align, position: src.position, display: src.display,
      paddingTop: src.padding.top, paddingBottom: src.padding.bottom,
      paletteRgba: rgba.palette.rgba, paletteXpos: rgba.palette.xPos, paletteYpos: rgba.palette.yPos,
      sliderRgba: rgba.slider.rgba, sliderXpos: rgba.slider.xPos, sliderYpos: rgba.slider.yPos,
    };
    if (kind === 'chart') {
      v.text = main['chartTitle'].value;
      v.color = main['colorChartTitle'].value;
      this.isParamTitle.set(true);
    } else {
      v.paddingLeft = this.tabParamChart[this.selectedChart - 1].legendTitle.padding.left;
      v.text = main['legendTitle'].value;
      v.color = main['colorLegendTitle'].value;
      this.isParamLegend.set(true);
    }
    this.selected_colorTitle = v.color;
    this.selectTitle.patchValue(v, { emitEvent: false });
  }

  processTitle() {
    const t = this.tabParamChart[this.selectedChart - 1];
    if (this.isParamTitle()) {
      this.fillTabTitle(t.chartTitle, t.chartTitleRgba);
      this.isParamTitle.set(false);
    } else if (this.isParamLegend()) {
      this.fillTabTitle(t.legendTitle, t.legendTitleRgba);
      this.isParamLegend.set(false);
    }
    this.selected_colorTitle = '';
  }

  private fillTabTitle(dst: any, rgba: any) {
    const c = this.selectTitle.controls;
    dst.text = c['text'].value;
    dst.font.weight = c['fontWeight'].value;
    dst.font.size = c['fontSize'].value;
    dst.font.family = c['family'].value;
    dst.align = c['align'].value;
    dst.position = c['position'].value;
    dst.display = toBool(c['display'].value);
    dst.color = c['color'].value;
    dst.padding.top = c['paddingTop'].value;
    dst.padding.bottom = c['paddingBottom'].value;
    rgba.palette.rgba = c['paletteRgba'].value;
    rgba.palette.xPos = c['paletteXpos'].value;
    rgba.palette.yPos = c['paletteYpos'].value;
    rgba.slider.rgba = c['sliderRgba'].value;
    rgba.slider.xPos = c['sliderXpos'].value;
    rgba.slider.yPos = c['sliderYpos'].value;

    if (this.isParamLegend()) {
      dst.padding.left = c['paddingLeft'].value;
      this.selectChart.patchValue({ legendTitle: dst.text, colorLegendTitle: dst.color }, { emitEvent: false });
    } else {
      this.selectChart.patchValue({ chartTitle: dst.text, colorChartTitle: dst.color }, { emitEvent: false });
    }
  }

  processAxis() {
    this.timeOutactivity(5, true, false, 'only');
    this.isParamAxis.set(false);
    const t = this.tabParamChart[this.selectedChart - 1];
    t.axisX.stacked = toBool(this.selectAxisX.controls['stacked'].value);
    t.axisY.stacked = toBool(this.selectAxisY.controls['stacked'].value);
    this.selectChart.patchValue({ stackedX: t.axisX.stacked, stackedY: t.axisY.stacked }, { emitEvent: false });
  }

  // ───────────────────────────── colour picker ─────────────────────────────

  private colorControl(key: ColorKey): AbstractControl {
    switch (key) {
      case 'canvas':     return this.selectChart.controls['canvasBackground'];
      case 'legend':     return this.selectChart.controls['colorLegendTitle'];
      case 'chartTitle': return this.selectChart.controls['colorChartTitle'];
      case 'box':        return this.selectChart.controls['boxcolor'];
      case 'xBorder':    return this.selectAxisX.controls['borderColor'];
      case 'xTicks':     return this.selectAxisX.controls['ticksColor'];
      case 'yBorder':    return this.selectAxisY.controls['borderColor'];
      case 'yTicks':     return this.selectAxisY.controls['ticksColor'];
    }
  }

  private openPicker(current: string, top: number) {
    this.mainWindow.top = top;
    this.posSlider.div.top = top + this.subWindow.top;
    this.my_input_child1 = current;
    this.my_input_child2 = current;
    this.temporaryColor = current;
    if (this.returnSlider.rgba !== '') { this.my_input_child2 = this.returnSlider.rgba; }
    if (this.returnPalette.rgba !== '') {
      this.my_input_child1 = this.returnPalette.rgba;
      this.temporaryColor = this.returnPalette.rgba;
    }
    this.isSliderSelected.set(true);
  }

  /** Click on a colour swatch. 'dialog' = the swatch of the title/legend dialog. */
  openColorPicker(target: ColorKey | 'dialog') {
    if (this.isLockedByOther) { return; }
    this.resetBooleans();
    this.timeOutactivity(5, true, false, 'only');

    let key: ColorKey;
    let viaDialog: boolean;
    if (target === 'dialog') {
      if (this.isParamLegend()) { key = 'legend'; }
      else if (this.isParamTitle()) { key = 'chartTitle'; }
      else { return; }
      viaDialog = true;
    } else {
      key = target;
      viaDialog = (key === 'legend' && this.isParamLegend()) || (key === 'chartTitle' && this.isParamTitle());
    }
    this.colorKey = key;
    this.titleDialogColor.set(viaDialog);
    this.returnSlider = this.rgbaOf[key].slider;
    this.returnPalette = this.rgbaOf[key].palette;
    this.openPicker(this.selColor[key], 120);
  }

  /** The user typed a colour in a text field: refresh the swatch and forget the previous picker position. */
  onColorFieldEdit(target: ColorKey | 'dialog') {
    if (this.isLockedByOther) { return; }
    this.resetBooleans();
    this.timeOutactivity(5, true, false, 'only');
    if (target === 'dialog') {
      this.selected_colorTitle = this.selectTitle.controls['color'].value;
      target = this.isParamLegend() ? 'legend' : 'chartTitle';
    } else {
      this.selColor[target] = this.colorControl(target).value;
    }
    this.initRgba(this.rgbaOf[target]);
  }

  selectLabelColor(kind: FieldKind, idx: number) {
    if (this.labelPick) { this.resetBooleans(); }
    if (this.isLockedByOther) { return; }
    this.timeOutactivity(5, true, false, 'only');
    this.labelPick = { kind, idx };
    const rgba = kind === 'limit' ? this.tabLimitLabelRgba[idx] : this.tabLabelRgba[idx];
    this.returnPalette = rgba.palette;
    this.returnSlider = rgba.slider;
    this.openPicker(kind === 'limit' ? this.tabOfLimitLabelsColor[idx] : this.tabOfLabelsColor[idx], 370);
  }

  fnSlider(event: any) { this.my_input_child1 = event; this.my_input_child2 = event; }   // slider -> palette
  fnSliderBis(event: any) { this.returnSlider = event; }
  fnPalette(event: any) { this.temporaryColor = event; }
  fnPaletteBis(event: any) { this.returnPalette = event; }

  fnExitPalette(action: 'Save' | 'Cancel') {
    if (this.isLockedByOther) { return; }
    this.timeOutactivity(5, true, false, 'only');
    if (action === 'Cancel') { this.resetBooleans(); return; }

    const color = this.temporaryColor;
    if (this.labelPick) {
      const { kind, idx } = this.labelPick;
      if (kind === 'label') { this.tabOfLabelsColor[idx] = color; this.tabLabelRgba[idx].palette = this.returnPalette; this.tabLabelRgba[idx].slider = this.returnSlider; }
      else { this.tabOfLimitLabelsColor[idx] = color; this.tabLimitLabelRgba[idx].palette = this.returnPalette; this.tabLimitLabelRgba[idx].slider = this.returnSlider; }
      this.labelPick = null;
    } else if (this.colorKey) {
      const k = this.colorKey;
      this.selColor[k] = color;
      this.colorControl(k).setValue(color);
      this.rgbaOf[k].palette = this.returnPalette;
      this.rgbaOf[k].slider = this.returnSlider;
      this.colorKey = null;
    }

    if (this.titleDialogColor()) {          // colour picked from the title/legend dialog
      this.selected_colorTitle = color;
      this.titleDialogColor.set(false);
      this.selectTitle.patchValue({
        color,
        paletteRgba: this.returnPalette.rgba, paletteXpos: this.returnPalette.xPos, paletteYpos: this.returnPalette.yPos,
        sliderRgba: this.returnSlider.rgba, sliderXpos: this.returnSlider.xPos, sliderYpos: this.returnSlider.yPos,
      }, { emitEvent: false });
    }
    this.isSliderSelected.set(false);
  }

  private initRgba(r: RgbaPair) {
    r.slider.xPos = 0; r.slider.yPos = 0; r.slider.rgba = '';
    r.palette.xPos = 0; r.palette.yPos = 0; r.palette.rgba = '';
  }

  resetBooleans() {
    this.openList.set(null);
    this.colorKey = null;
    this.labelPick = null;
    this.titleDialogColor.set(false);
    this.isSliderSelected.set(false);
  }

  // ───────────────────────────── items (labels / limits) of a chart ─────────────────────────────

  toggleField(kind: FieldKind, idx: number) {
    this.openFileAccess.set(false);
    if (this.isLockedByOther) { return; }
    this.timeOutactivity(5, true, false, 'only');
    const arr = kind === 'label' ? this.selectedFields : this.selectedLimitFields;
    if (arr[idx] === 'Y') { arr[idx] = 'N'; }
    else if (arr[idx] === 'N') { arr[idx] = 'Y'; }
  }

  // ───────────────────────────── save / cancel ─────────────────────────────

  confirmSave(event: Event, kind: 'save' | 'saveAll') {
    this.errorMsg = '';
    this.resetBooleans();
    const target = event.target as HTMLButtonElement;
    const ev = this.theEvent;
    ev.target.id = kind;
    ev.target.value = target.value;
    ev.target.textContent = target.textContent;
    ev.checkLock.iWait = 0;
    ev.checkLock.isDataModified = true;
    ev.checkLock.isSaveFile = false;
    ev.checkLock.lastInputAt = this.lastInputAt;
    ev.fileName = this.SpecificForm.controls['FileName'].value;
    this.onInputAction = 'confirmSave';
    this.timeOutactivity(0, true, false, 'only');
  }

  cancelTheSave() {
    this.openFileAccess.set(false);
    this.IsSaveConfirmed.set(false);
  }

  saveFn() {
    this.openFileAccess.set(false);
    this.errorMsg = '';
    this.IsSaveConfirmed.set(false);
    const sel = this.selectedChart - 1;
    this.fillInTabOfCharts(sel);
    if (this.errorMsg === '') {
      if (this.theEvent.target.id === 'save') {
        this.fillInCharts(this.tabParamChart[sel], this.inFileParamChart.data[sel]);
        this.buildChart(sel);
      } else {
        for (let i = 0; i < this.tabParamChart.length; i++) {
          this.fillInCharts(this.tabParamChart[i], this.inFileParamChart.data[i]);
          this.buildChart(i);                  // was buildChart(selectedChart - 1) inside the loop
        }
      }
    }
    const ev = this.theEvent;
    ev.checkLock.iWait = 5;
    ev.iWait = 5;
    ev.checkLock.isDataModified = true;
    ev.checkLock.isSaveFile = true;
    ev.checkLock.iCheck = true;
    ev.checkLock.lastInputAt = this.lastInputAt;
    ev.checkLock.action = 'saveParamChart';
    ev.fileName = this.SpecificForm.controls['FileName'].value;
    this.onInputAction = 'saveParamChart';
    this.timeOutactivity(5, true, true, 'saveParamChart');
    this.processSave.emit(ev);
  }

  cancelFn(kind: 'cancelAll' | 'cancelOne') {
    this.resetBooleans();
    this.timeOutactivity(5, true, false, 'only');
    const reload = (i: number) => {
      this.fillInCharts(this.inFileParamChart.data[i], this.tabParamChart[i]);
      this.buildChart(i);
    };
    if (kind === 'cancelAll') {
      for (let i = 0; i < this.tabParamChart.length; i++) { reload(i); }
    } else {
      reload(this.selectedChart - 1);
    }
    if (this.selectedChart !== 0) { this.fillInFormFromTab(this.selectedChart - 1); }
  }

  // ───────────────────────────── tab <-> form <-> file copies ─────────────────────────────

  private loadChartFromFile(i: number) {
    const cfg = this.ConfigChartHealth.barDefault.datasets;
    const t = new classTabFormChart;
    this.tabParamChart.push(t);
    this.fillInCharts(this.inFileParamChart.data[i], t);
    if (t.labels.length === 0) {
      for (let k = 0; k < cfg.fieldsToSelect.length; k++) {
        t.labels[k] = cfg.fieldsToSelect[k] === false ? 'N' : 'Y';
      }
    }
    for (let j = 0; j < t.labelsColor.length; j++) {
      if (t.labelsColor[j] === undefined || t.labelsColor[j] === '') { t.labelsColor[j] = cfg.borderColor[j]; }
    }
  }

  private initTabParamCanvas(_i: number) {
    const cfg = this.ConfigChartHealth;
    const d = cfg.barDefault;
    const t = new classTabFormChart;
    this.tabParamChart.push(t);

    t.chartType = 'line';
    this.copyTitle(d.options.plugins.title, t.chartTitle, false);
    this.copyTitle(d.options.plugins.legend.title, t.legendTitle, true);
    this.copyLegendBox(d.options.plugins.legend.labels, t.legendBox);
    t.bar = clone(cfg.barChart.datasets);            // one copy per chart: no longer shared with the other charts / the config
    t.line = clone(cfg.lineChart.datasetsDefault);
    t.canvasBackground = d.canvas.backgroundcolor;
    t.canvasHeight = d.canvas.height;
    t.canvasMarginLeft = d.canvas.marginleft;
    t.canvasWidth = d.canvas.width;

    for (let l = 0; l < d.datasets.labelsLimits.length; l++) {
      const sel = d.datasets.fieldsLimitsToSelect[l] === true ? 'Y' : 'N';
      t.limitLabels[l] = sel;
      this.selectedLimitFields[l] = sel;
      t.limitRgbaLabels[l] ??= newRgba();
      this.initRgba(t.limitRgbaLabels[l]);
      t.limitLabelsColor[l] = d.datasets.borderColorLimits[l];
    }
    for (let l = 0; l < d.datasets.fieldsToSelect.length; l++) {
      const sel = d.datasets.fieldsToSelect[l] === true ? 'Y' : 'N';
      t.labels[l] = sel;
      this.selectedFields[l] = sel;
      t.labelsColor[l] = d.datasets.borderColor[l];
      t.rgbaLabels[l] ??= newRgba();
      this.initRgba(t.rgbaLabels[l]);
    }

    t.period = 'daily';
    t.nbWeeks = 0;
    t.ratio = 2;
    this.copyAxis(d.options.scales.axisX, t.axisX);
    this.copyAxis(d.options.scales.axisY, t.axisY);
    this.initRgba(t.legendBoxRgba);
  }

  private copyTitle(s: any, d: any, withLeftPadding: boolean) {
    d.display = s.display; d.text = s.text; d.position = s.position;
    d.padding.top = s.padding.top; d.padding.bottom = s.padding.bottom;
    if (withLeftPadding) { d.padding.left = s.padding.left; }
    d.align = s.align; d.color = s.color;
    d.font.size = s.font.size; d.font.weight = s.font.weight; d.font.family = s.font.family;
  }

  private copyLegendBox(s: any, d: any) {
    d.boxWidth = s.boxWidth; d.boxHeight = s.boxHeight; d.borderRadius = s.borderRadius;
    d.pointStyle = s.pointStyle; d.usePointStyle = s.usePointStyle; d.color = s.color;
    d.font.size = s.font.size; d.font.weight = s.font.weight; d.font.family = s.font.family;
  }

  private copyAxis(s: any, d: any) {
    d.stacked = s.stacked; d.border.color = s.border.color; d.border.width = s.border.width;
    d.position = s.position;
    d.ticks = clone(s.ticks);                         // was shared by reference between all charts
  }

  private fillRgba(src: any, dst: any) {
    dst.palette.rgba = src.palette.rgba;
    dst.palette.xPos = src.palette.xPos;
    dst.palette.yPos = src.palette.yPos;
    dst.slider.rgba = src.slider.rgba;
    dst.slider.xPos = src.slider.xPos ?? 0;
    dst.slider.yPos = src.slider.yPos ?? 0;
  }

  /** copies one "chart parameters" object to another (file -> tab, tab -> file) */
  fillInCharts(inFile: any, outFile: any) {
    const cfg = this.ConfigChartHealth.barDefault.datasets;
    outFile.chartType = inFile.chartType.toLowerCase().trim();
    this.copyTitle(inFile.chartTitle, outFile.chartTitle, false);
    this.copyTitle(inFile.legendTitle, outFile.legendTitle, true);
    this.fillRgba(inFile.chartTitleRgba, outFile.chartTitleRgba);
    this.fillRgba(inFile.legendTitleRgba, outFile.legendTitleRgba);

    outFile.bar = clone(inFile.bar);
    outFile.line = clone(inFile.line);

    outFile.ratio = inFile.ratio;
    outFile.canvasWidth = inFile.canvasWidth;
    outFile.canvasHeight = inFile.canvasHeight;
    outFile.canvasBackground = inFile.canvasBackground;
    outFile.canvasMarginLeft = inFile.canvasMarginLeft;
    this.fillRgba(inFile.rgbaCanvas, outFile.rgbaCanvas);

    this.copyAxis(inFile.axisX, outFile.axisX);
    this.copyAxis(inFile.axisY, outFile.axisY);

    outFile.period = inFile.period.toLowerCase().trim();
    outFile.nbWeeks = inFile.nbWeeks ?? 1;
    outFile.startRange = inFile.startRange;
    outFile.endRange = inFile.endRange;

    this.copyLegendBox(inFile.legendBox, outFile.legendBox);
    this.fillRgba(inFile.legendBoxRgba, outFile.legendBoxRgba);

    this.syncLabels(inFile.labels, inFile.labelsColor, inFile.rgbaLabels,
      outFile.labels, outFile.labelsColor, outFile.rgbaLabels, cfg.fieldsToSelect.length);
    this.syncLabels(inFile.limitLabels, inFile.limitLabelsColor, inFile.limitRgbaLabels,
      outFile.limitLabels, outFile.limitLabelsColor, outFile.limitRgbaLabels, cfg.fieldsLimitsToSelect.length);
  }

  /** copies the items of the source, then pads up to `total` with "N" (item not selected) */
  private syncLabels(inL: any[], inColors: any[], inRgba: any[], outL: any[], outColors: any[], outRgba: any[], total: number) {
    const fallback = this.ConfigChartHealth.barDefault.datasets.backgroundColor;
    let i = 0;
    for (; i < inL.length; i++) {
      outL[i] = inL[i];
      outColors[i] = inColors[i];
      outRgba[i] ??= newRgba();
      this.fillRgba(inRgba[i], outRgba[i]);
    }
    for (; i < total; i++) {
      outL[i] = 'N';
      outColors[i] = fallback[i];
      outRgba[i] ??= newRgba();
    }
  }

  /** form -> working table */
  fillInTabOfCharts(nb: number) {
    const t = this.tabParamChart[nb];
    const c = this.selectChart.controls;
    const ax = this.selectAxisX.controls;
    const ay = this.selectAxisY.controls;

    t.chartType = c['chartType'].value.toLowerCase().trim();
    t.chartTitle.text = c['chartTitle'].value;
    t.chartTitle.color = c['colorChartTitle'].value;
    t.legendTitle.text = c['legendTitle'].value;
    t.legendTitle.color = c['colorLegendTitle'].value;
    this.fillRgba(this.rgbaOf.chartTitle, t.chartTitleRgba);
    this.fillRgba(this.rgbaOf.legend, t.legendTitleRgba);

    t.ratio = c['ratio'].value;
    t.canvasWidth = c['canvasWidth'].value;
    t.canvasHeight = c['canvasHeight'].value;
    t.canvasBackground = c['canvasBackground'].value;
    t.canvasMarginLeft = c['canvasMarginLeft'].value;
    t.bar.barThickness = c['barThickness'].value;
    this.fillRgba(this.rgbaOf.canvas, t.rgbaCanvas);

    t.legendBox.boxWidth = c['boxwidth'].value;
    t.legendBox.boxHeight = c['boxheight'].value;
    t.legendBox.pointStyle = c['boxpointStyle'].value;
    t.legendBox.usePointStyle = c['boxusePointStyle'].value;
    t.legendBox.font.size = c['boxfontSize'].value;
    t.legendBox.font.weight = c['boxfontWeight'].value;
    t.legendBox.font.family = c['boxfontFamily'].value;
    t.legendBox.borderRadius = c['boxradius'].value;
    t.legendBox.color = c['boxcolor'].value;
    this.fillRgba(this.rgbaOf.box, t.legendBoxRgba);

    t.axisX.stacked = toBool(c['stackedX'].value);
    t.axisY.stacked = toBool(c['stackedY'].value);
    t.axisX.border.color = ax['borderColor'].value;
    t.axisX.border.width = ax['borderWidth'].value;
    t.axisX.position = ax['position'].value;
    t.axisX.ticks.color = ax['ticksColor'].value;
    t.axisY.border.color = ay['borderColor'].value;
    t.axisY.border.width = ay['borderWidth'].value;
    t.axisY.position = ay['position'].value;
    t.axisY.ticks.color = ay['ticksColor'].value;

    t.period = c['period'].value.toLowerCase().trim();
    t.nbWeeks = c['nbWeeks'].value;
    t.startRange = c['startRange'].value;
    t.endRange = c['endRange'].value;

    for (let i = 0; i < this.selectedFields.length; i++) {
      t.labels[i] = this.selectedFields[i];
      t.labelsColor[i] = this.tabOfLabelsColor[i];
      this.fillRgba(this.tabLabelRgba[i], t.rgbaLabels[i]);
    }
    for (let i = 0; i < this.selectedLimitFields.length; i++) {
      t.limitLabels[i] = this.selectedLimitFields[i];
      t.limitLabelsColor[i] = this.tabOfLimitLabelsColor[i];
      t.limitRgbaLabels[i] ??= newRgba();
      this.fillRgba(this.tabLimitLabelRgba[i], t.limitRgbaLabels[i]);
    }
  }

  /** working table -> form (one patchValue per group, without emitting valueChanges for every control) */
  fillInFormFromTab(nb: number) {
    const t = this.tabParamChart[nb];
    const quiet = { emitEvent: false };

    this.selectChart.patchValue({
      chartType: t.chartType.toLowerCase().trim(),
      chartTitle: t.chartTitle.text,
      colorChartTitle: t.chartTitle.color,
      ratio: t.ratio,
      canvasWidth: t.canvasWidth,
      canvasHeight: t.canvasHeight,
      canvasMarginLeft: t.canvasMarginLeft,
      canvasBackground: t.canvasBackground,
      legendTitle: t.legendTitle.text,
      colorLegendTitle: t.legendTitle.color,
      stackedX: t.axisX.stacked,
      stackedY: t.axisY.stacked,
      period: t.period.toLowerCase().trim(),
      nbWeeks: t.nbWeeks ?? 1,
      startRange: t.startRange,
      endRange: t.endRange,
      barThickness: t.bar.barThickness,
      boxwidth: t.legendBox.boxWidth,
      boxheight: t.legendBox.boxHeight,
      boxpointStyle: t.legendBox.pointStyle,
      boxusePointStyle: t.legendBox.usePointStyle,
      boxfontSize: t.legendBox.font.size,
      boxfontWeight: t.legendBox.font.weight,
      boxfontFamily: t.legendBox.font.family,
      boxradius: t.legendBox.borderRadius,
      boxcolor: t.legendBox.color,
    }, quiet);
    for (const [form, axis] of [[this.selectAxisX, t.axisX], [this.selectAxisY, t.axisY]] as const) {
      form.patchValue({
        borderWidth: axis.border.width, borderColor: axis.border.color, position: axis.position,
        ticksColor: axis.ticks.color, stacked: axis.stacked,
      }, quiet);
    }

    this.selColor.xTicks = t.axisX.ticks.color;
    this.selColor.xBorder = t.axisX.border.color;
    this.selColor.yTicks = t.axisY.ticks.color;
    this.selColor.yBorder = t.axisY.border.color;
    this.selColor.canvas = t.canvasBackground;
    this.selColor.chartTitle = t.chartTitle.color;
    this.selColor.legend = t.legendTitle.color;
    this.selColor.box = t.legendBox.color;
    this.fillRgba(t.legendBoxRgba, this.rgbaOf.box);
    this.fillRgba(t.rgbaCanvas, this.rgbaOf.canvas);
    this.fillRgba(t.chartTitleRgba, this.rgbaOf.chartTitle);
    this.fillRgba(t.legendTitleRgba, this.rgbaOf.legend);
    if (this.isParamLegend()) { this.selected_colorTitle = this.selColor.legend; }
    else if (this.isParamTitle()) { this.selected_colorTitle = this.selColor.chartTitle; }

    this.tabLabelRgba = t.rgbaLabels;     // same objects as the working table, as before
    for (let i = 0; i < t.labels.length; i++) {
      this.selectedFields[i] = t.labels[i];
      this.tabOfLabelsColor[i] = t.labelsColor[i];
      if (t.rgbaLabels[i]) { this.fillRgba(t.rgbaLabels[i], t.rgbaLabels[i]); }   // normalises undefined slider positions
    }
    for (let i = 0; i < t.limitLabels.length; i++) {
      this.selectedLimitFields[i] = t.limitLabels[i];
      this.tabOfLimitLabelsColor[i] = t.limitLabelsColor[i];
      if (t.limitRgbaLabels[i] && this.tabLimitLabelRgba[i]) { this.fillRgba(t.limitRgbaLabels[i], this.tabLimitLabelRgba[i]); }
    }
  }
}
