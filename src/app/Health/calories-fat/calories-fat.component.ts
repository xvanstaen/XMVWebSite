import {
  Component, EventEmitter, HostListener, Input, NgZone, OnChanges, OnDestroy, OnInit,
  Output, SimpleChanges, effect, inject, input, signal, untracked,
} from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { MainManageFileComponent } from '../../fileAccessMgt/file-access.component';
import { configServer, LoginIdentif, classtheEvent } from '../../JsonServerClass';
import { classPosDiv, getPosDiv } from '../../getPosDiv';
import { mainClassCaloriesFat, ClassCaloriesFat, ClassItem } from '../ClassHealthCalories';
import { mainConvItem } from '../../ClassConverter';
import { classAccessFile, classHeaderReturnDataFS } from '../../classFileSystem';
import { classConfCaloriesFat } from '../classConfHTMLTableAll';
import { strDateTime, findIds } from '../../MyStdFunctions';

/* Kept only because other files may import them; no longer used by this component. */
export class classTabNewRec { ngStyle = 0; even = 0; change = false; nb = 0; food: classFood[] = []; }
export class classFood { nb = 0; ngStyle = 0; }
export class returnSignal { nb = -1; function = ''; }

type NumericField =
  'Calories' | 'Protein' | 'Carbs' | 'Cholesterol' | 'Sugar' | 'naturalSugar' | 'addedSugar' | 'GlyIndex';

const NUTRIENTS: readonly NumericField[] =
  ['Calories', 'Protein', 'Carbs', 'Cholesterol', 'Sugar', 'naturalSugar', 'addedSugar', 'GlyIndex'];

/** input-id prefix -> numeric field (ids look like 'calo-3-1') */
const NUMERIC_BY_KEY: Record<string, NumericField | 'Serving'> = {
  serv: 'Serving', calo: 'Calories', prot: 'Protein', carb: 'Carbs', glyi: 'GlyIndex',
  suga: 'Sugar', naturalSuga: 'naturalSugar', addedSuga: 'addedSugar', chol: 'Cholesterol',
};

type PendingAction = '' | 'onAction' | 'onInput' | 'onInputRecipe' | 'onSelRecipeFood';
interface NameItem { name: string; }
interface ActionItem { name: string; action: string; }

const CANCEL = 'cancel';
const norm = (s: unknown): string => String(s ?? '').toLowerCase().trim();

@Component({
  selector: 'app-calories-fat',
  templateUrl: './calories-fat.component.html',
  styleUrls: ['./calories-fat.component.css'],
  standalone: true,
  imports: [NgClass, DecimalPipe, ReactiveFormsModule, MatIconModule, MainManageFileComponent],
})
export class CaloriesFatComponent implements OnInit, OnChanges, OnDestroy {
  private readonly ngZone = inject(NgZone);

  // ───────────── inputs / outputs (names unchanged: the parent binds to them) ─────────────
  @Input() configServer = new configServer();
  @Input() identification = new LoginIdentif();
  @Input() ConfigCaloriesFat = new mainClassCaloriesFat();
  @Input() inFileRecipe = new mainClassCaloriesFat();
  @Input() HTMLCaloriesFat = new classConfCaloriesFat();
  @Input() actionCalFat = 0;       // unused here, kept so parent bindings still compile
  @Input() actionRecipe = 0;       // unused here, kept so parent bindings still compile
  @Input() tabLock: Array<classAccessFile> = [];
  @Input() convToDisplay = new mainConvItem();
  @Input() returnDataFSCalFat = new classHeaderReturnDataFS();
  @Input() returnDataFSRecipe = new classHeaderReturnDataFS();
  @Input() statusSaveFn: any;
  @Input() configHTMLRetrieved = -1;

  resultCheckLimitCalFat = input<number>();
  triggerCalFatSave = input.required<number>();
  calFatFileRetrieved = input.required<number>();
  recipeFileRetrieved = input.required<number>();

  @Output() checkLockLimit = new EventEmitter<any>();   // unused here, kept for parent bindings
  @Output() retrieveRecord = new EventEmitter<any>();   // unused here, kept for parent bindings
  @Output() processSave = new EventEmitter<any>();
  @Output() unlockFile = new EventEmitter<any>();

  // ───────────── data ─────────────
  outConfigCaloriesFat = new mainClassCaloriesFat();
  outFileRecipe = new mainClassCaloriesFat();

  // ───────────── signals used by the template ─────────────
  openFileAccess = signal(false);
  isInitComplete = signal(false);
  isNgStyleCompleted = signal(false);
  isSaveConfirmed = signal(false);
  isSaveRecipeConfirmed = signal(false);
  isCalFatModified = signal(false);
  isRecipeModified = signal(false);
  isDeleteType = signal(false);
  isDeleteFood = signal(false);
  isDeleteRecipe = signal(false);
  isDeleteRecipeFood = signal(false);
  isRecipeFoodInput = signal(false);
  isUserTimeOut = signal(false);
  isErrorFS = signal(false);
  signalTime = signal(0);               // ticks once per second while the countdown runs
  triggerCheckToLimit = signal(0);
  triggerFileSystem = signal(-1);
  triggerReadFile = signal(-1);
  triggerSaveFile = signal(-1);

  // ───────────── countdown ─────────────
  private readonly secondsLeft = signal(0);
  private deadline = 0;
  private timer?: ReturnType<typeof setInterval>;
  get displayHour(): number { return Math.floor(this.secondsLeft() / 3600); }
  get displayMin(): number { return Math.floor((this.secondsLeft() % 3600) / 60); }
  get displaySec(): number { return this.secondsLeft() % 60; }

  // ───────────── form / state ─────────────
  SpecificForm = new FormGroup({
    FileName: new FormControl('', { nonNullable: true }),
    FileNameRecipe: new FormControl('', { nonNullable: true }),
  });

  errorMsg = '';
  errorMsgFS = '';
  checkText = '';
  lastInputAt = '';
  theEvent = new classtheEvent();
  returnEmit = { saveAction: '', saveCode: '' };
  private onInputAction: PendingAction = '';

  TabOfId: number[] = [];
  filterType = false;
  filterFood = false;
  filterRecipe = false;
  filterRecipeFood = false;
  selType = '';
  selFood = '';
  RecipeSel = '';
  RecipeSelFood = '';

  // dropdown sources ('cancel' is always the first entry)
  tabType: NameItem[] = [{ name: CANCEL }];
  tabFood: NameItem[] = [{ name: CANCEL }];
  tabRecipe: NameItem[] = [{ name: CANCEL }];
  tabRecipeFood: NameItem[] = [{ name: CANCEL }];
  tabInputRecipeFood: NameItem[] = [{ name: CANCEL }];

  readonly TabAction: ActionItem[] = CaloriesFatComponent.buildActions(['Type', 'Food'], []);
  readonly TabActionRecipe: ActionItem[] = CaloriesFatComponent.buildActions(['Recipe', 'Food'], [
    { name: 'Calculate', action: 'Total' },
    { name: 'Recipe', action: 'Transfer' },
    { name: 'AllRecipe', action: 'reCalculate' },
  ]);
  dialogueCalFat = [false, false, false, false]; // [0] calories-table action menu, [1] recipe-table action menu

  // geometry used by the template
  posType = 585;
  posFood = 660;
  posDeletedItem = 0;
  nameDeletedItem = '';
  titleHeight = 0;
  posItemAction = 0;
  posDivTable = new classPosDiv();
  selectedPosition = { x: 0, y: 0 };
  sizeBoxRecipeFood = 0;
  readonly heightItemOptionBox = 25;

  // lazily rebuilt name -> food lookup (replaces the nested loops)
  private foodIndex = new Map<string, ClassItem>();
  private foodIndexDirty = true;

  constructor() {
    // one small effect per input; the work runs untracked so no stray dependencies are created
    this.onChange(this.resultCheckLimitCalFat, () => this.processCheckLimit());
    this.onChange(this.calFatFileRetrieved, () => {
      this.initialiseFiles('calFat');
      // TODO: confirm intent – reloading the calories file discards *recipe* edits (and vice versa below)
      this.cancelUpdates('recipe');
    });
    this.onChange(this.recipeFileRetrieved, () => {
      this.initialiseFiles('recipe');
      this.cancelUpdates('calFat');
    });
    this.onChange(this.triggerCalFatSave, () => this.processCalFatSave());
  }

private onChange(source: () => number | undefined, handler: () => void): void {
  let previous = -1;
  effect(() => {
    const value = source();
    untracked(() => {
      if (value === undefined || value === previous) { return; }
      previous = value;
      handler();
    });
  });
}

  private static buildActions(names: string[], extra: ActionItem[]): ActionItem[] {
    const verbs = ['add before', 'add after', 'delete'];
    return [
      { name: 'Cancel', action: '' },
      ...names.flatMap(name => verbs.map(action => ({ name, action }))),
      ...extra,
    ];
  }

  // ───────────── lifecycle ─────────────
  get inputReadOnly(): boolean { return this.tabLock[1]?.lock !== 1; }
  private get fsEnabled(): boolean { return this.identification?.triggerFileSystem?.toUpperCase() === 'YES'; }

  ngOnChanges(changes: SimpleChanges): void {
    const c = changes['configHTMLRetrieved'];
    if (c && c.currentValue !== -1) { this.isNgStyleCompleted.set(true); }
  }

  ngOnInit(): void {
    this.titleHeight = Number(this.HTMLCaloriesFat.title.height);
    this.initialiseFiles('calFat');
    this.initialiseFiles('recipe');
    this.SpecificForm.controls.FileName.setValue(this.identification.configFitness.files.calories);
    this.lastInputAt = strDateTime();
  }

  ngOnDestroy(): void { this.stopCountdown(); }

  @HostListener('window:mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    // only measure when one of the action menus is open (the click that selects an item)
    if (!this.dialogueCalFat[0] && !this.dialogueCalFat[1]) { return; }
    this.selectedPosition = { x: event.pageX, y: event.pageY };
    this.posDivTable = getPosDiv('posStartTable');
    const y = event.clientY - Number(this.posDivTable.ClientRect.Top) + this.titleHeight;
    this.posItemAction = Math.min(y, this.HTMLCaloriesFat.height / 2);
  }

  // ───────────── inactivity countdown ─────────────
  private restartCountdown(): void {
    if (this.isUserTimeOut()) { this.isUserTimeOut.set(false); }
    if (!this.fsEnabled) { this.stopCountdown(); return; }
    const t = this.configServer.timeoutFileSystem.userTimeOut;
    const total = t.hh * 3600 + t.mn * 60 + t.ss;
    this.deadline = Date.now() + total * 1000;
    this.secondsLeft.set(total);
    this.signalTime.update(n => n + 1);
    if (this.timer === undefined) {
      this.ngZone.runOutsideAngular(() => { this.timer = setInterval(() => this.tick(), 1000); });
    }
  }

  private tick(): void {
    const left = Math.max(0, Math.ceil((this.deadline - Date.now()) / 1000));
    this.ngZone.run(() => {
      this.secondsLeft.set(left);
      this.signalTime.update(n => n + 1);
      if (left === 0) { this.onUserTimeout(); }
    });
  }

  private stopCountdown(): void {
    if (this.timer !== undefined) { clearInterval(this.timer); this.timer = undefined; }
  }

  private onUserTimeout(): void {
    this.stopCountdown();
    this.signalTime.set(0);
    this.isUserTimeOut.set(true);
    this.tabLock[1].action = 'unlock';
    this.unlockFile.emit(1);
    if (this.isRecipeModified()) { this.discardRecipeChanges(); }
    if (this.isCalFatModified()) { this.discardCalFatChanges(); }
  }

  // ───────────── file-system (lock) round-trip ─────────────
  /** Restarts the countdown and, when the file system is enabled, asks the child to re-check the lock. */
  private touch(iWait: number, isDataModified: boolean): void {
    this.restartCountdown();
    if (!this.fsEnabled) { return; }
    this.lastInputAt = strDateTime();
    const c = this.theEvent.checkLock;
    c.action = 'checkTO';
    c.iWait = iWait;
    c.isDataModified = isDataModified;
    c.isSaveFile = false;
    c.iCheck = true;
    c.lastInputAt = this.lastInputAt;
    c.nbCalls++;
    this.triggerCheckToLimit.update(n => n + 1);
    this.openFileAccess.set(true);
  }

  /** Records the action, then either waits for the lock check (FS on) or runs it straight away (FS off). */
  private requestAction(action: PendingAction, iWait: number, isDataModified: boolean): void {
    this.onInputAction = action;
    if (this.fsEnabled) {
      this.touch(iWait, isDataModified);
    } else {
      this.restartCountdown();
      this.runPendingAction();
    }
  }

  private runPendingAction(): void {
    const action = this.onInputAction;
    this.onInputAction = '';
    switch (action) {
      case 'onAction': this.onActionA(this.theEvent); break;
      case 'onInput': this.onInputA(this.theEvent); break;
      case 'onInputRecipe': this.onInputRecipeA(this.theEvent); break;
      case 'onSelRecipeFood': this.onSelRecipeFoodA(this.theEvent); break;
    }
  }

  resultFileSystemFn(event: any): void {
    this.openFileAccess.set(false);
    event.nbRecall++;
    this.isUserTimeOut.set(false);
    if (event.iWait === 1) { this.returnDataFSCalFat = event; }
    else if (event.iWait === 6) { this.returnDataFSRecipe = event; }

    if (this.tabLock[1].lock === 1) {
      this.errorMsg = 'You can now update the file';
    } else if (this.tabLock[1].action === 'unlock') {
      this.errorMsg = 'File has been unlocked. Relaunch the application';
    } else {
      this.errorMsg = 'File is locked by another user. Relaunch the application later.';
    }
    this.lastInputAt = strDateTime();
    this.restartCountdown();
    this.processCheckLimit();
  }

  private processCheckLimit(): void {
    const isError = (r: classHeaderReturnDataFS) => r.errorCode !== 0 && r.errorCode !== 200;
    const failed = [this.returnDataFSCalFat, this.returnDataFSRecipe].find(isError);
    this.errorMsgFS = failed?.errorMsg ?? '';
    this.isErrorFS.set(!!failed);
    if (failed || this.tabLock[1].lock !== 1) { this.onInputAction = ''; return; }
    this.runPendingAction();
  }

  // ───────────── loading / building the working copies ─────────────
  initialiseFiles(which: 'calFat' | 'recipe'): void {
    if (which === 'calFat') {
      if (!this.ConfigCaloriesFat.tabCaloriesFat) { return; }
      if (this.ConfigCaloriesFat.tabCaloriesFat.length > 0) {
        this.cloneFile(this.ConfigCaloriesFat, this.outConfigCaloriesFat, false);
      } else {
        this.initEmptyFile(this.outConfigCaloriesFat, 'calories');
      }
      this.rebuildCalLists();
      this.foodIndexDirty = true;
    } else {
      if (!this.inFileRecipe.tabCaloriesFat) { return; }
      if (this.inFileRecipe.tabCaloriesFat.length > 0) {
        this.cloneFile(this.inFileRecipe, this.outFileRecipe, true);
      } else {
        this.initEmptyFile(this.outFileRecipe, 'recipe');
      }
      this.rebuildRecipeLists();
    }
    this.isInitComplete.set(true);
  }

  private initEmptyFile(file: mainClassCaloriesFat, kind: 'calories' | 'recipe'): void {
    const type = new ClassCaloriesFat();
    type.Content.push(new ClassItem());
    file.tabCaloriesFat.splice(0, file.tabCaloriesFat.length, type);
    file.fileType = kind === 'calories'
      ? this.identification.configFitness.fileType.calories
      : this.identification.fitness.fileType.recipe;
  }

  /** Deep copy src -> dst, in place (the arrays keep their identity). updatedAt is handled by SaveFile. */
  private cloneFile(src: mainClassCaloriesFat, dst: mainClassCaloriesFat, withTotal: boolean): void {
    dst.fileType = src.fileType;
    const rows = src.tabCaloriesFat.map(t => {
      const row = new ClassCaloriesFat();
      row.Type = t.Type;
      if (withTotal) { row.Total = t.Total ? this.cloneItem(t.Total) : new ClassItem(); }
      row.Content = t.Content.map(c => this.cloneItem(c));
      return row;
    });
    dst.tabCaloriesFat.splice(0, dst.tabCaloriesFat.length, ...rows);
  }

  private cloneItem(src: ClassItem): ClassItem {
    const item = new ClassItem();
    this.copyContent(item, src);
    return item;
  }

  copyContent(out: ClassItem, src: ClassItem): void {
    out.Name = src.Name;
    out.Serving = src.Serving;
    out.ServingUnit = src.ServingUnit;
    for (const k of NUTRIENTS) { out[k] = src[k] ?? 0; }   // old files lack naturalSugar/addedSugar
    out.Fat.Saturated = src.Fat.Saturated;
    out.Fat.Total = src.Fat.Total;
    out.lockData = src.lockData ?? 'N';
  }

  private namesWithCancel(names: string[]): NameItem[] {
    const sorted = names.map(norm).filter(n => n !== '').sort((a, b) => a.localeCompare(b));
    return [{ name: CANCEL }, ...sorted.map(name => ({ name }))];
  }

  private rebuildCalLists(): void {
    const types = this.outConfigCaloriesFat.tabCaloriesFat;
    this.tabType = this.namesWithCancel(types.map(t => t.Type));
    this.tabFood = this.namesWithCancel(types.flatMap(t => t.Content.map(c => c.Name)));
  }

  private rebuildRecipeLists(): void {
    const recipes = this.outFileRecipe.tabCaloriesFat;
    this.tabRecipe = this.namesWithCancel(recipes.map(r => r.Type));
    this.tabRecipeFood = this.namesWithCancel(recipes.flatMap(r => r.Content.map(c => c.Name)));
    this.tabInputRecipeFood = this.tabRecipeFood.map(f => ({ ...f }));
    this.sizeBoxRecipeFood = (this.tabInputRecipeFood.length + 1) * this.heightItemOptionBox;
  }

  // ───────────── food lookup / calculations ─────────────
  private invalidateFoodIndex(): void { this.foodIndexDirty = true; }

  private findFood(name: string): ClassItem | undefined {
    if (this.foodIndexDirty) {
      this.foodIndex.clear();
      for (const t of this.outConfigCaloriesFat.tabCaloriesFat) {
        for (const f of t.Content) {
          const key = norm(f.Name);
          if (!this.foodIndex.has(key)) { this.foodIndex.set(key, f); } // first match wins, as before
        }
      }
      this.foodIndexDirty = false;
    }
    return this.foodIndex.get(norm(name));
  }

  /** Rescales an ingredient from the calories table (unless locked / empty). */
  private recalcFromReference(item: ClassItem): void {
    if (item.lockData === 'Y' || item.Serving === 0 || item.Name === '') { return; }
    const ref = this.findFood(item.Name);
    if (!ref || !ref.Serving) { return; }
    const q = item.Serving / ref.Serving;
    item.ServingUnit = ref.ServingUnit;
    // NOTE: GlyIndex is scaled like the others to keep existing behaviour, but a glycemic index is
    // not proportional to the portion size (see notes).
    for (const k of NUTRIENTS) { item[k] = ref[k] * q; }
    item.Fat.Saturated = ref.Fat.Saturated * q;
    item.Fat.Total = ref.Fat.Total * q;
  }

  reCalculateValues(): void {
    this.outFileRecipe.tabCaloriesFat.forEach((recipe, i) => {
      recipe.Content.forEach(item => this.recalcFromReference(item));
      this.calculateTotal(i);
      this.transferToCalFat(i);
    });
  }

  calculateTotal(iRecipe: number): void {
    const recipe = this.outFileRecipe.tabCaloriesFat[iRecipe];
    if (!recipe) { return; }
    const total = recipe.Total;
    const sum = (f: (c: ClassItem) => number) => recipe.Content.reduce((s, c) => s + f(c), 0);
    for (const k of NUTRIENTS) { total[k] = sum(c => c[k]); }
    total.Fat.Saturated = sum(c => c.Fat.Saturated);
    total.Fat.Total = sum(c => c.Fat.Total);
    total.Serving = sum(c => c.Serving * this.gramFactor(c.ServingUnit));
    total.ServingUnit = 'gram';
  }

  private gramFactor(unit: string): number {
    const u = norm(unit);
    return u === 'gram' ? 1 : (this.getConversion(u, 'gram') || 1);
  }

  private getConversion(from: string, to: string): number {
    const items = this.convToDisplay.tabConvItem;
    const direct = items.find(c => c.from === from && c.to === to);
    if (direct) { return direct.valueFromTo; }
    const inverse = items.find(c => c.from === to && c.to === from);
    return inverse && inverse.valueFromTo ? 1 / inverse.valueFromTo : 0;
  }

  // ───────────── structure edits ─────────────
  private addType(index: number): void {
    const type = new ClassCaloriesFat();
    type.Content.push(new ClassItem());
    this.outConfigCaloriesFat.tabCaloriesFat.splice(index, 0, type);
    this.invalidateFoodIndex();
  }

  private addFood(typeIdx: number, index: number): void {
    this.outConfigCaloriesFat.tabCaloriesFat[typeIdx].Content.splice(index, 0, new ClassItem());
    this.invalidateFoodIndex();
  }

  private addRecipe(index: number): void {
    const recipe = new ClassCaloriesFat();
    recipe.Content.push(new ClassItem());
    this.outFileRecipe.tabCaloriesFat.splice(index, 0, recipe);
  }

  private addRecipeFood(recipeIdx: number, index: number): void {
    this.outFileRecipe.tabCaloriesFat[recipeIdx].Content.splice(index, 0, new ClassItem());
  }

  transferToCalFat(iRecipe: number): void {
    const recipe = this.outFileRecipe.tabCaloriesFat[iRecipe];
    if (!recipe) { return; }
    const types = this.outConfigCaloriesFat.tabCaloriesFat;
    this.isCalFatModified.set(true);

    let i = types.findIndex(t => norm(t.Type) === 'recipe');
    let j: number;
    if (i < 0) {
      this.addType(types.length);
      i = types.length - 1;
      types[i].Type = 'Recipe';
      j = 0;                                   // reuse the blank first item of the new type
    } else {
      const name = norm(recipe.Type);
      j = types[i].Content.findIndex(f => norm(f.Name) === name);
      if (j < 0) {
        this.addFood(i, types[i].Content.length);
        j = types[i].Content.length - 1;
      }
    }
    this.copyContent(types[i].Content[j], recipe.Total);
    types[i].Content[j].Name = recipe.Type;
    this.invalidateFoodIndex();
  }

  // ───────────── action menus & delete confirmation ─────────────
  onAction(event: any): void {
    this.dialogueCalFat[0] = false;
    this.dialogueCalFat[1] = false;
    this.errorMsg = '';
    const el = event.currentTarget?.id ? event.currentTarget : event.target;
    if (el?.id) {
      this.theEvent.target.id = el.id;
      this.theEvent.target.value = el.value;
    } else if (event.target.textContent) {
      this.theEvent.target.id = '';
      this.theEvent.target.textContent = event.target.textContent;
    }
    this.requestAction('onAction', 1, this.isCalFatModified());
  }

  onActionA(event: any): void {
    let id = '';
    let iAction = 0;
    const el = event.currentTarget?.id ? event.currentTarget : event.target;
    if (el?.id) {
      id = el.id;
      this.manageIds(id);
      iAction = Number(el.value);
    } else if (event.target.textContent) {
      const text: string = event.target.textContent;
      let cut = text.indexOf('-', 1);
      if (cut < 0) { cut = text.length; }
      const type = text.substring(0, cut).trim();
      const action = text.substring(cut + 1).trim();
      id = 'selAction';
      iAction = Math.max(0, this.TabAction.findIndex(a => a.name === type && a.action === action));
    }
    this.theEvent.target.id = id;

    if (id.startsWith('RecipeOpenAction')) {
      this.dialogueCalFat[1] = true;
    } else if (id.startsWith('RecipeSelAction')) {
      this.recipeAction(iAction);
    } else if (id.startsWith('openAction')) {
      this.dialogueCalFat[0] = true;
    } else if (id.startsWith('selAction')) {
      this.calFatAction(iAction);
    } else if (id.startsWith('YesDel')) {
      this.confirmDeleteCalFat();
    } else if (id.startsWith('NoDel')) {
      this.isDeleteType.set(false);
      this.isDeleteFood.set(false);
    } else if (id.startsWith('RecipeYesDel')) {
      this.confirmDeleteRecipe();
    } else if (id.startsWith('RecipeNoDel')) {
      this.isDeleteRecipe.set(false);
      this.isDeleteRecipeFood.set(false);
    }
  }

  private calFatAction(iAction: number): void {
    if (iAction === 0) {
      this.isDeleteType.set(false);
      this.isDeleteFood.set(false);
      return;
    }
    const act = this.TabAction[iAction];
    if (!act) { return; }
    this.isCalFatModified.set(true);
    const [ti = 0, fi = 0] = this.TabOfId;
    const types = this.outConfigCaloriesFat.tabCaloriesFat;

    if (act.name === 'Type') {
      if (act.action === 'add before') { this.addType(ti); }
      else if (act.action === 'add after') { this.addType(ti + 1); }
      else if (act.action === 'delete') {
        if (types.length === 1) {
          this.nameDeletedItem = '';
          this.errorMsg = 'only one item - cannot be deleted';
        } else {
          this.nameDeletedItem = 'Type item: ' + types[ti].Type;
          this.posDeletedItem = this.posType;
          this.isDeleteType.set(true);
        }
      }
    } else if (act.name === 'Food') {
      if (act.action === 'add before') { this.addFood(ti, fi); }
      else if (act.action === 'add after') { this.addFood(ti, fi + 1); }
      else if (act.action === 'delete') {
        if (types.length === 1 && types[0].Content.length === 1) {
          this.nameDeletedItem = '';
          this.errorMsg = 'only one item - cannot be deleted';
        } else {
          this.nameDeletedItem = 'food item: ' + types[ti].Content[fi].Name;
          this.posDeletedItem = this.posFood;
          this.isDeleteFood.set(true);
        }
      }
    }
  }

  private recipeAction(iAction: number): void {
    if (iAction === 0) {
      this.isDeleteRecipe.set(false);
      this.isDeleteRecipeFood.set(false);
      return;
    }
    const act = this.TabActionRecipe[iAction];
    if (!act) { return; }
    this.isRecipeModified.set(true);
    const [ri = 0, fi = 0] = this.TabOfId;
    const recipes = this.outFileRecipe.tabCaloriesFat;

    if (act.name === 'Recipe') {
      if (act.action === 'add before') { this.addRecipe(ri); }
      else if (act.action === 'add after') { this.addRecipe(ri + 1); }
      else if (act.action === 'Transfer') { this.transferToCalFat(ri); }
      else if (act.action === 'delete') {
        if (recipes.length === 1) {
          this.nameDeletedItem = '';
          this.errorMsg = 'only one item - cannot be deleted';
        } else {
          this.nameDeletedItem = 'Type item: ' + recipes[ri].Type;
          this.posDeletedItem = this.posType;
          this.isDeleteRecipe.set(true);
        }
      }
    } else if (act.name === 'Calculate') {
      this.calculateTotal(ri);
    } else if (act.name === 'Food') {
      if (act.action === 'add before') { this.addRecipeFood(ri, fi); }
      else if (act.action === 'add after') { this.addRecipeFood(ri, fi + 1); }
      else if (act.action === 'delete') {
        if (recipes.length === 1 && recipes[0].Content.length === 1) {
          this.nameDeletedItem = '';
          this.errorMsg = 'only one food item - cannot be deleted';
        } else {
          this.nameDeletedItem = 'food item: ' + recipes[ri].Content[fi].Name;
          this.posDeletedItem = this.posFood;
          this.isDeleteRecipeFood.set(true);
        }
      }
    } else if (act.name === 'AllRecipe') {
      this.reCalculateValues();
    }
  }

  private confirmDeleteCalFat(): void {
    const [ti = 0, fi = 0] = this.TabOfId;
    if (this.isDeleteType()) { this.outConfigCaloriesFat.tabCaloriesFat.splice(ti, 1); }
    if (this.isDeleteFood()) { this.outConfigCaloriesFat.tabCaloriesFat[ti].Content.splice(fi, 1); }
    this.invalidateFoodIndex();
    this.isDeleteType.set(false);
    this.isDeleteFood.set(false);
  }

  private confirmDeleteRecipe(): void {
    const [ri = 0, fi = 0] = this.TabOfId;
    if (this.isDeleteRecipe()) { this.outFileRecipe.tabCaloriesFat.splice(ri, 1); }
    if (this.isDeleteRecipeFood()) { this.outFileRecipe.tabCaloriesFat[ri].Content.splice(fi, 1); }
    this.isDeleteRecipe.set(false);
    this.isDeleteRecipeFood.set(false);
  }

  // ───────────── field input: calories table ─────────────
  onInput(event: any): void {
    this.returnEmit.saveAction = '';
    this.theEvent.target.id = event.target.id;
    this.theEvent.target.value = event.target.value;
    this.requestAction('onInput', 1, true);
  }

  onInputA(event: any): void {
    this.isCalFatModified.set(true);
    const id: string = event.target.id;
    const value: string = event.target.value;
    this.manageIds(id);
    const [ti = 0, fi = 0] = this.TabOfId;
    const type = this.outConfigCaloriesFat.tabCaloriesFat[ti];
    if (!type) { return; }
    const key = id.split('-')[0];

    if (key === 'type') { type.Type = norm(value); return; }
    const item = type.Content[fi];
    if (!item) { return; }
    if (key === 'name') {
      item.Name = norm(value);
      this.invalidateFoodIndex();
    } else {
      this.applyField(item, key, value);
    }
  }

  /** Writes a numeric/unit field from an input id prefix. Returns false if the prefix is unknown. */
  private applyField(item: ClassItem, key: string, value: string): boolean {
    const field = NUMERIC_BY_KEY[key];
    if (field) { item[field] = Number(value); return true; }
    switch (key) {
      case 'unit': item.ServingUnit = norm(value); return true;
      case 'satu': item.Fat.Saturated = Number(value); return true;
      case 'tota': item.Fat.Total = Number(value); return true;
      default: return false;
    }
  }

  // ───────────── field input: recipe table ─────────────
  onInputRecipe(event: any): void {
    this.theEvent.target.id = event.target.id;
    this.theEvent.target.value = event.target.value;
    this.requestAction('onInputRecipe', 6, true);
  }

  onInputRecipeA(event: any): void {
    this.returnEmit.saveAction = '';
    this.isRecipeModified.set(true);
    this.isRecipeFoodInput.set(false);
    const id: string = event.target.id;
    const value: string = event.target.value;
    this.manageIds(id);
    const [ri = 0, fi = 0] = this.TabOfId;
    const recipe = this.outFileRecipe.tabCaloriesFat[ri];
    if (!recipe) { return; }
    const key = id.split('-')[0];

    if (key === 'Recipe') {
      recipe.Type = norm(value);
      if (this.tabRecipe.some(r => r.name === norm(value))) {
        this.errorMsg = `recipe ${value} already exists`;
      }
      return;
    }
    const item = recipe.Content[fi];
    if (!item) { return; }

    if (key === 'name') {
      const text = norm(value);
      item.Name = text;
      this.tabInputRecipeFood = this.tabFood.filter(f => f.name.includes(text)).map(f => ({ name: f.name }));
      this.isRecipeFoodInput.set(true);
      if (this.tabInputRecipeFood.length === 1 && this.tabInputRecipeFood[0].name === text && item.lockData !== 'Y') {
        this.recalcFromReference(item);
        this.isRecipeFoodInput.set(false);
      }
      const rows = Math.min(this.tabInputRecipeFood.length + 1, 9);
      this.sizeBoxRecipeFood = rows * this.heightItemOptionBox;
    } else if (key === 'serv') {
      item.Serving = Number(value);
      this.recalcFromReference(item);
    } else if (key === 'lock') {
      const v = value.toUpperCase().trim();
      if (v === 'Y' || v === 'N') {
        item.lockData = v;
        if (v === 'N') { this.recalcFromReference(item); }
      } else {
        this.errorMsg = "Lock value must be 'Y' or 'N'";
      }
    } else {
      this.applyField(item, key, value);
    }
  }

  onSelRecipeFood(event: any): void {
    this.errorMsg = '';
    this.theEvent.target.id = event.target.id;
    this.theEvent.target.textContent = norm(event.target.textContent);
    this.requestAction('onSelRecipeFood', 1, true);
  }

  onSelRecipeFoodA(event: any): void {
    const id: string = event.target.id;
    if (!id.startsWith('selRecipeFood')) { return; }
    this.manageIds(id);
    const [ri = 0, fi = 0] = this.TabOfId;
    const text = norm(event.target.textContent);
    const item = this.outFileRecipe.tabCaloriesFat[ri]?.Content[fi];
    if (item && text !== CANCEL) {
      item.Name = text;
      this.recalcFromReference(item);
    }
    this.tabInputRecipeFood = this.tabRecipeFood.map(f => ({ ...f }));
    this.isRecipeFoodInput.set(false);
  }

  // ───────────── search / filters ─────────────
  SearchText(event: any): void {
    this.returnEmit.saveAction = '';
    const el = event.currentTarget;
    this.checkText = el.id === 'search' && el.value !== '' ? norm(el.value) : '';
    this.requestAction('', 1, true);
  }

  onFilter(event: any): void {
    this.returnEmit.saveAction = '';
    this.filterType = this.filterFood = this.filterRecipe = this.filterRecipeFood = false;
    this.selType = this.selFood = this.RecipeSel = this.RecipeSelFood = '';

    const id: string = event.target.id;
    const text = String(event.target.textContent ?? '').trim();
    const picked = text !== '' && norm(text) !== CANCEL;

    switch (id) {
      case 'Recipe': this.filterRecipe = true; break;
      case 'RecipeFood': this.filterRecipeFood = true; break;
      case 'Type': this.filterType = true; break;
      case 'Food': this.filterFood = true; break;
      case 'RecipeSel': if (picked) { this.RecipeSel = text; } break;
      case 'RecipeSelFood': if (picked) { this.RecipeSelFood = text; } break;
      case 'selType': if (picked) { this.selType = text; } break;
      case 'selFood': if (picked) { this.selFood = text; } break;
    }
    this.requestAction('', 1, true);
  }

  manageIds(theId: string): void {
    this.errorMsg = '';
    this.TabOfId = findIds(theId, '-').tabOfId;
  }

  // ───────────── save / cancel ─────────────
  ConfirmSave(event: any): void {
    if (event.target.id === 'RecipeSave') {
      this.isSaveRecipeConfirmed.set(true);
      this.SpecificForm.controls.FileNameRecipe.setValue(this.identification.fitness.files.recipe);
      return;
    }
    const types = this.outConfigCaloriesFat.tabCaloriesFat;
    const dupType = this.findDuplicate(types.map(t => norm(t.Type)));
    if (dupType !== undefined) {
      this.errorMsg = 'you have created dupe type-element   ' + dupType;
      return;
    }
    const dupFood = this.findDuplicate(types.flatMap(t => t.Content.map(c => norm(c.Name))));
    if (dupFood !== undefined) {
      this.errorMsg = 'you have created dupe food-element   ' + dupFood;
      return;
    }
    this.isSaveConfirmed.set(true);
  }

  private findDuplicate(names: string[]): string | undefined {
    const seen = new Set<string>();
    for (const n of names) {
      if (seen.has(n)) { return n; }
      seen.add(n);
    }
    return undefined;
  }

  CancelTheSave(event: any): void {
    if (event.target.id === 'RecipeCancel') { this.isSaveRecipeConfirmed.set(false); }
    else { this.isSaveConfirmed.set(false); }
  }

  CancelUpdates(event: any): void {
    this.cancelUpdates(event.target.id === 'RecipeCancel' ? 'recipe' : 'calFat');
  }

  private cancelUpdates(kind: 'calFat' | 'recipe'): void {
    if (!this.isRecipeModified() && !this.isCalFatModified()) { return; }
    this.requestAction('', 1, false);
    if (kind === 'recipe') { this.discardRecipeChanges(); } else { this.discardCalFatChanges(); }
  }

  private discardRecipeChanges(): void {
    this.isSaveRecipeConfirmed.set(false);
    this.isRecipeModified.set(false);
    this.initialiseFiles('recipe');
  }

  private discardCalFatChanges(): void {
    this.isSaveConfirmed.set(false);
    this.isCalFatModified.set(false);
    this.initialiseFiles('calFat');
  }

  SaveFile(event: any): void {
    const id: string = event.target.id;
    const isRecipe = id === 'RecipeSave';
    const now = strDateTime();
    this.errorMsg = '';
    this.lastInputAt = now;
    this.returnEmit.saveAction = id;
    this.theEvent.target.id = id;

    const c = this.theEvent.checkLock;
    c.isDataModified = true;
    c.isSaveFile = true;
    c.lastInputAt = now;
    c.iCheck = true;

    if (isRecipe) {
      this.isSaveRecipeConfirmed.set(false);
      this.cloneFile(this.outFileRecipe, this.inFileRecipe, true);
      this.outFileRecipe.updatedAt = this.inFileRecipe.updatedAt = now;
      this.rebuildRecipeLists();
      c.iWait = 6;
      c.action = 'saveRecipe';
      this.theEvent.fileName = this.SpecificForm.controls.FileNameRecipe.value;
    } else {
      this.isSaveConfirmed.set(false);
      this.cloneFile(this.outConfigCaloriesFat, this.ConfigCaloriesFat, false);
      this.outConfigCaloriesFat.updatedAt = this.ConfigCaloriesFat.updatedAt = now;
      this.rebuildCalLists();
      c.iWait = 1;
      c.action = 'saveCalFat';
      this.theEvent.fileName = this.SpecificForm.controls.FileName.value;
    }
    this.restartCountdown();
    this.processSave.emit(this.theEvent);
  }

  private processCalFatSave(): void {
    const ok = this.statusSaveFn?.status === 200 || this.statusSaveFn?.status === 0;
    this.errorMsg = ok ? 'File has been successfully saved' : (this.statusSaveFn?.err ?? 'Save failed');
    if (!ok) { return; }  // keep the "modified" state so the user can retry
    if (this.theEvent.target.id === 'RecipeSave') {
      this.isSaveRecipeConfirmed.set(false);
      this.isRecipeModified.set(false);
    } else {
      this.isSaveConfirmed.set(false);
      this.isCalFatModified.set(false);
      this.rebuildCalLists();
    }
  }
}
