import { Component, OnInit, Input, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, ViewportScroller } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Observable, retry, timeout } from 'rxjs';

import { configServer, LoginIdentif } from '../JsonServerClass';
import { ManageGoogleService } from '../CloudServices/ManageGoogle.service';
import { DictionaryComponent } from '../dictionary/dictionary.component';
import { classPosDiv } from '../getPosDiv';
import { strDateTime } from '../MyStdFunctions';

import { ClassCaloriesFat, mainClassCaloriesFat, ClassItem, DailyReport, ClassMeal, ClassDish } from '../Health/ClassHealthCalories';
import { mainConvItem, mainClassConv } from '../ClassConverter';
import { calcFatCalories, HealthResult } from '../Health/CalcFatCalories';

// ---------------------------------------------------------------------------
// Data classes
// ---------------------------------------------------------------------------
export class classRecipe {
  id: number = 0;
  ingr: string = '';
  quantity: number = 0;
  unit: string = 'gram';
}

export class classNutrition {
  calories: number = 0;
  proteins: number = 0;
  carbs: number = 0;
  sugar: number = 0;
  cholesterol: number = 0;
  satFat: number = 0;
  totalSat: number = 0;
  totalWeight: number = 0;
}

export class classRecordRecipe {
  typeFr: string = '';
  typeEn: string = '';
  name: string = '';
  data: Array<classRecipe> = [];
  dataPerso: Array<classRecipe> = [];
  materiel: string = '';
  materielBox: number = 0;
  materielPerso: string = '';
  materielPersoBox: number = 0;
  nutrition = new classNutrition();
  nutritionPerso = new classNutrition();
  comments: string = '';
  commentsBox: number = 0;
  commentsEn: string = '';
  commentsEnBox: number = 0;
  commentsPerso: string = '';
  commentsPersoBox: number = 0;
}

export class classFileRecipe {
  fileType: string = '';
  updatedAt: string = '';
  listTypeRecipe: Array<any> = [];
  recipe: Array<classRecordRecipe> = [];
}

type NutritionTarget = 'std' | 'perso' | 'all';
type CommentBoxKey = 'commentsBox' | 'commentsEnBox' | 'commentsPersoBox' | 'materielBox' | 'materielPersoBox';

const NETWORK_TIMEOUT_MS = 30000;
const NETWORK_RETRIES = 3;
const DEGREE_C = '°C';

@Component({
  selector: 'app-recipe',
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule, DictionaryComponent],
  // NOTE: not switched to OnPush because many plain fields (message, tabSearch, ...) are
  // mutated directly. Convert them to signals first, then enable ChangeDetectionStrategy.OnPush.
})
export class RecipeComponent implements OnInit {

  @Input() configServer = new configServer();
  @Input() identification = new LoginIdentif();
  @Input() InConvToDisplay = new mainConvItem();
  @Input() dictionaryOnly: boolean = false;

  private readonly destroyRef = inject(DestroyRef);

  ConfigCaloriesFat = new mainClassCaloriesFat();
  ConvertUnit = new mainClassConv();

  returnData: HealthResult = {
    errors: [],
    outHealthData: new DailyReport(),
  };

  posDivAfterTitle = new classPosDiv();
  posDivBeforeTitle = new classPosDiv();

  masterFile = new classFileRecipe();
  recipeFile = new classFileRecipe();
  initialRecipeFile = new classFileRecipe();

  googleBucketName: string = '';
  theListOfObjects: Array<{ header: string; name: string; json: string }> = [];
  Error_Access_Server: string = '';

  recipe: string = '';
  recordRecipe: number = 0;

  listActions: Array<string> = ['Cancel', 'Delete', 'Add after', 'Add before', 'Copy', 'Copy ALL', 'Move after', 'Move before', 'Change value for all', 'Calculate nutrition facts'];
  tabRecipe: Array<any> = [];
  tabActionRecipe: Array<string> = ['Cancel', 'Create', 'Rename', 'Duplicate', 'Delete', 'Reinitialise', 'Translate FR to UK', 'Translate UK to FR', 'Calculate nut. facts for all recipes', 'Transfer nut. facts to CalFat'];
  tabActionComments: Array<string> = ['Cancel', 'Translate FR to UK', 'Translate UK to FR', 'Zoom in - Std box', 'Zoom out - Std box', 'Zoom in - English box', 'Zoom out - English box', 'Zoom in - Ustens. box', 'Zoom out - Ustens. box', 'Zoom in - Perso box', 'Zoom out - Perso box',
    'Zoom in - Ustens. Perso box', 'Zoom out - Ustens. Perso box'];
  tabActionCommentsPerso: Array<string> = ['Cancel', 'Translate FR to UK', 'Translate UK to FR', 'Zoom in - Perso box', 'Zoom out - Perso box', 'Zoom in - Ustens. Perso box', 'Zoom out - Ustens. Perso box', 'Zoom in - Std box', 'Zoom out - Std box', 'Zoom in - English box', 'Zoom out - English box',
    'Zoom in - Ustens. box', 'Zoom out - Ustens. box'];

  textToSearch: string = '';
  tabSearch: Array<any> = [];
  tabListCalFat: Array<any> = [];
  tabDropdownType: Array<any> = [];
  tabDialog: Array<boolean> = [];
  prevDialog: number = 0;

  fileNb: number = -1;

  isDictionary: boolean = false; // @input to activate the management of the dictionary

  isListOfObjectsRetrieved: boolean = false;
  isFileRetrieved = signal<boolean>(false);
  isMessage = signal<boolean>(false);
  IsSaveConfirmed = signal<boolean>(false);

  isActionComments = signal<boolean>(false);
  isActionRecipe = signal<boolean>(false);

  isCreateRecipeName = signal<boolean>(false);
  isChangeRecipeName = signal<boolean>(false);
  isDeleteRecipe = signal<boolean>(false);
  isDuplicate = signal<boolean>(false);

  isChangeValueForAll = signal<boolean>(false);
  isChangeValueForAllPerso = signal<boolean>(false);
  isRecipeModified = signal<boolean>(false);
  isListTypeUpdated = signal<boolean>(false);
  isListTypeFr: boolean = false;
  isListTypeEn: boolean = false;
  isSearchText: boolean = false;
  isIngrDropDown = signal(false);
  shouldShowDropdownStd: Array<boolean> = [];
  shouldShowDropdownPerso: Array<boolean> = [];

  changeValue: number = 0;
  temporaryNameRecipe: string = '';
  posGramTabConvert: number = 0;
  ingrType: string = '';
  currentIngr: string = '';
  translateComment: string = '';
  margLeftChangeAll: number = 0;
  currentValue: number = 0;

  yourLanguage: number = 0; // 0 for FR, 1 for EN
  theStdPersoDisplay: Array<string> = ['Y', 'N'];
  eyeNutritionFact: Array<string> = ['N', 'N'];

  SpecificForm = new FormGroup({
    fileName: new FormControl('', { nonNullable: true }),
    fileHeader: new FormControl('', { nonNullable: true }),
    changeValue: new FormControl('', { nonNullable: true }),
  });

  idText: string = '';
  idNb: number = 0;

  radioSelect: number = -1;
  selectedTypeFr: string = '';
  recordListType: number = -1;

  delMsg: string = ''; // name of the recipe to delete

  tabUpdateRef: Array<{ init: number }> = []; // index of each recipe in initialRecipeFile (-1 = new)
  message: string = '';

  searchScroll: string = 'hidden';
  heightListType: number = 0;
  heightScroll: string = 'hidden';

  // Zoom-in & out of comments boxes
  heightMatCommBox: number = 90;
  maxHeightCommBox: number = 300;
  minHeightCommBox: number = 40;
  zoomInRate: number = 0.8;
  zoomOutRate: number = 1.4;

  // Dropdown boxes
  heightActionRecipe: number = 80;
  heightSearchDropdown: number = 0;
  heightListRecipe: number = 80;
  theHeight: number = 0;
  posTopDropDown: number = -25;
  heightDropDown: number = 0;
  scrollY: string = 'hidden';
  maxHeightDropDown: number = 200;
  heightItemDropDown: number = 25;
  marginLeft: number = 50;
  marginTop: number = 20;

  // Translation dictionaries
  tabFraEng: Array<any> = [];
  dicEnFr: Array<any> = [];
  dicFrEn: Array<any> = [];
  private wordMaps = new WeakMap<object, Map<string, string>>();

  tabLanguage = ['Fr', 'En'];
  errType: string = '';

  listTypeName: string[][] = [['Tous'], ['All']];

  private normCache = new Map<string, string>();

  private readonly zoomBoxes: Record<string, CommentBoxKey> = {
    'Std box': 'commentsBox',
    'English box': 'commentsEnBox',
    'Perso box': 'commentsPersoBox',
    'Ustens. box': 'materielBox',
    'Ustens. Perso box': 'materielPersoBox',
  };

  private readonly textFields = new Set(['comments', 'commentsEn', 'commentsPerso', 'materiel', 'materielPerso']);

  constructor(
    private scroller: ViewportScroller,
    private ManageGoogleService: ManageGoogleService,
  ) { }

  // -------------------------------------------------------------------------
  // Init & loading
  // -------------------------------------------------------------------------
  ngOnInit() {
    this.googleBucketName = this.identification.recipe.bucket;
    this.theHeight = (this.listActions.length + 1) * 25;

    const cfg = this.identification.configFitness;

    this.fetchObject(cfg.bucket, cfg.files.calories).subscribe({
      next: data => { this.ConfigCaloriesFat = data; },
      error: e => this.setLoadError('calories file', e),
    });

    this.fetchObject(cfg.bucket, cfg.files.convertUnit).subscribe({
      next: data => {
        this.ConvertUnit = data;
        const i = this.ConvertUnit.tabConv.findIndex(c => c.fromUnit === 'gram');
        if (i !== -1) this.posGramTabConvert = i;
      },
      error: e => this.setLoadError('unit conversion file', e),
    });

    this.GetAllObjects();
  }

  private fetchObject(bucket: string, objectName: string): Observable<any> {
    return this.ManageGoogleService.getContentObject(this.configServer, bucket, objectName).pipe(
      timeout(NETWORK_TIMEOUT_MS),
      retry({ count: NETWORK_RETRIES, delay: 1000 }),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  private setLoadError(what: string, e: any) {
    this.Error_Access_Server = `Could not retrieve ${what}: ${e?.message ?? e?.statusText ?? e?.status ?? 'unknown error'}`;
  }

  GetAllObjects() {
    this.scroller.scrollToAnchor('theTop');
    this.Error_Access_Server = '';
    const prefix: string = this.identification.recipe.fileStartName;

    this.ManageGoogleService.getListMetaObjects(this.configServer, this.googleBucketName).pipe(
      timeout(NETWORK_TIMEOUT_MS),
      retry({ count: NETWORK_RETRIES, delay: 1000 }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (data: any[]) => {
        // keep the files of the recipes of the user, most recent (last) first
        this.theListOfObjects = data
          .map(d => d.items.name as string)
          .filter(n => n.startsWith(prefix))
          .reverse()
          .map(n => {
            const dot = n.indexOf('.');
            return dot === -1
              ? { header: prefix, name: n.substring(prefix.length), json: '' }
              : { header: prefix, name: n.substring(prefix.length, dot), json: n.substring(dot) };
          });

        if (this.theListOfObjects.length === 1) {
          this.fileNb = 0;
          this.loadRecipeFile(this.objectNameOf(0));
          this.recordRecipe = 0;
        }
      },
      error: e => this.setLoadError('the list of files', e),
    });
  }

  private objectNameOf(i: number): string {
    const o = this.theListOfObjects[i];
    return o.header + o.name + o.json;
  }

  private loadRecipeFile(objectName: string) {
    this.Error_Access_Server = '';
    this.fetchObject(this.googleBucketName, objectName).subscribe({
      next: data => this.onRecipeFileLoaded(data),
      error: e => this.setLoadError(`file ${objectName}`, e),
    });
  }

  private onRecipeFileLoaded(data: any) {
    const trim = (s?: string) => s?.trim() ?? '';
    const min = this.minHeightCommBox;

    const types = (data.listTypeRecipe ?? []).map((t: any) => ({
      Fr: trim(t.Fr),
      En: trim(t.En),
      recipe: (t.recipe ?? []).filter((r: string) => r !== '').map((r: string) => r.trim()),
    }));

    const mapList = (list: any): classRecipe[] =>
      Array.isArray(list) ? list.map((item: any, j: number) => Object.assign(new classRecipe(), item, { id: j })) : [];

    const recipes: classRecordRecipe[] = (data.recipe ?? []).map((r: any) => {
      const rec = new classRecordRecipe();
      rec.typeFr = r.typeFr?.trim() ?? 'Creme';
      rec.typeEn = r.typeEn?.trim() ?? 'Cream';
      rec.name = trim(r.name);
      rec.comments = r.comments ?? '';
      rec.commentsPerso = r.commentsPerso ?? '';
      rec.commentsEn = r.commentsEn ?? '';
      rec.materiel = r.materiel ?? '';
      rec.materielPerso = r.materielPerso ?? '';
      rec.commentsBox = r.commentsBox ?? min;
      rec.commentsPersoBox = r.commentsPersoBox ?? min;
      rec.commentsEnBox = r.commentsEnBox ?? min;
      rec.materielBox = r.materielBox ?? min;
      rec.materielPersoBox = r.materielPersoBox ?? min;
      rec.nutrition = { ...new classNutrition(), ...r.nutrition };
      rec.nutritionPerso = { ...new classNutrition(), ...r.nutritionPerso };
      rec.data = mapList(r.data);
      rec.dataPerso = mapList(r.dataPerso);
      return rec;
    });

    const initial = this.initialRecipeFile;
    initial.fileType = data.fileType ?? '';
    initial.updatedAt = data.updatedAt ?? '';
    initial.listTypeRecipe = types;
    initial.recipe = recipes;
    if (types.length === 0) {
      this.updateFileType(initial);
    } else {
      this.rebuildListTypeName(types);
    }

    // working copy
    this.recipeFile.fileType = initial.fileType;
    this.recipeFile.updatedAt = initial.updatedAt;
    this.recipeFile.recipe = structuredClone(recipes);
    this.recipeFile.listTypeRecipe = structuredClone(initial.listTypeRecipe);
    this.resetUpdateRefs();

    this.isFileRetrieved.set(true);
  }

  private resetUpdateRefs() {
    this.tabUpdateRef = this.initialRecipeFile.recipe.map((_, i) => ({ init: i }));
  }

  returnDicoFile(inFile: any) {
    this.tabFraEng = inFile;
  }

  selLanguage(event: string) {
    if (event === 'FR') this.yourLanguage = 0;
    if (event === 'UK') this.yourLanguage = 1;
  }

  // -------------------------------------------------------------------------
  // File / type selection
  // -------------------------------------------------------------------------
  RadioSelection(event: any, id: number) {
    this.findId(event.currentTarget.id !== '' ? event.currentTarget.id : event.target.id);
    this.resetBooleans();

    if (this.idText === 'selFile') {
      this.radioSelect = this.idNb;
      this.recipeFile.recipe.length = 0;
      this.recipeFile.listTypeRecipe.length = 0;

      if (this.fileNb !== this.idNb) {
        this.initialRecipeFile.recipe.length = 0;
        this.initialRecipeFile.listTypeRecipe.length = 0;
        this.fileNb = this.radioSelect;
        this.loadRecipeFile(this.objectNameOf(this.fileNb));
        this.recordRecipe = 0;
      } else {
        // same file: restore the initial content
        this.fillFileRecord(this.initialRecipeFile, this.recipeFile);
        this.resetUpdateRefs();
      }
    } else if (this.idText === 'Type') {
      this.radioSelect = this.idNb - 1;
      if (this.idNb === 0) {
        this.selectedTypeFr = 'ALL';
        this.recordListType = -1;
        this.radioSelect = -1;
      } else {
        this.recordListType = this.idNb - 1;
        this.selectedTypeFr = this.recipeFile.listTypeRecipe[this.recordListType].Fr.trim();
        // first record of the selected type (0 if none: problem with the file)
        const first = this.recipeFile.recipe.findIndex(r => r.typeFr.trim() === this.selectedTypeFr);
        this.recordRecipe = first === -1 ? 0 : first;
      }
      this.rerunSearch();
    }
  }

  resetBooleans() {
    if (this.isActionRecipe()) this.isActionRecipe.set(false);
    this.isDeleteRecipe.set(false);
    this.isIngrDropDown.set(false);
    this.IsSaveConfirmed.set(false);
    this.isCreateRecipeName.set(false);
    this.tabDialog[this.prevDialog] = false;
    this.isChangeValueForAll.set(false);
    this.isChangeValueForAllPerso.set(false);
    this.isChangeRecipeName.set(false);
    this.isActionComments.set(false);
    this.isListTypeFr = false;
    this.isListTypeEn = false;
    this.shouldShowDropdownStd[this.prevDialog] = false;
    this.shouldShowDropdownPerso[this.prevDialog] = false;
    this.errType = '';
    this.isListTypeUpdated.set(true);
    this.message = '';
  }

  // -------------------------------------------------------------------------
  // Ingredient dialogs
  // -------------------------------------------------------------------------
  onAction(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target?.id) return;

    this.resetBooleans();
    const id = target.id;

    if (id === 'ActionRecipe') {
      this.isActionRecipe.set(true);
      return;
    }
    if (id === 'ActionComments' || id === 'ActionCommentsPerso') {
      this.isActionComments.set(true);
      return;
    }

    // dynamic ids, e.g. "Action-12" or "ActionPerso-3"
    const match = id.match(/^([a-zA-Z]+)-(\d+)$/);
    if (!match) return;

    const idText = match[1];
    const idNb = parseInt(match[2], 10);
    const isStandard = idText === 'Action';
    const isPerso = idText === 'ActionPerso';
    if (!isStandard && !isPerso) return;

    // the dropdown handlers rely on these
    this.idText = idText;
    this.idNb = idNb;

    this.prevDialog = idNb;
    this.tabDialog[idNb] = true;
    this.shouldShowDropdownStd[idNb] = isStandard;
    this.shouldShowDropdownPerso[idNb] = isPerso;

    const suffix = isStandard ? 'perso' : 'standard';
    this.listActions[4] = `Copy to ${suffix}`;
    this.listActions[5] = `Copy ALL to ${suffix}`;
  }

  afterDropDownPerso(event: any) {
    const r = this.recipeFile.recipe[this.recordRecipe];
    this.functionAfterDropDown(event, r.dataPerso, r.data, 'Perso');
    this.shouldShowDropdownPerso[this.prevDialog] = false;
  }

  afterDropDown(event: any) {
    const r = this.recipeFile.recipe[this.recordRecipe];
    this.functionAfterDropDown(event, r.data, r.dataPerso, 'Std');
    this.shouldShowDropdownStd[this.prevDialog] = false;
  }

  private functionAfterDropDown(event: any, inFile: classRecipe[], copyToFile: classRecipe[], perso: 'Std' | 'Perso') {
    this.tabDialog[this.prevDialog] = false;
    this.resetBooleans();

    const action: string = event.target.textContent.trim();
    if (action === 'Cancel') return;

    this.isRecipeModified.set(true);
    const idx = this.idNb;

    if (action === 'Delete') {
      inFile.splice(idx, 1);
      this.updateDataId(inFile);
    } else if (action === 'Add after') {
      inFile.splice(idx + 1, 0, new classRecipe());
      this.updateDataId(inFile);
    } else if (action === 'Add before') {
      inFile.splice(idx, 0, new classRecipe());
      this.updateDataId(inFile);
    } else if (action.startsWith('Copy ALL')) {
      copyToFile.length = 0;
      this.copyFromTo(copyToFile, inFile);
    } else if (action.startsWith('Copy')) {
      let i = copyToFile.findIndex(it => it.ingr === '');
      if (i === -1) {
        copyToFile.push(new classRecipe());
        i = copyToFile.length - 1;
      }
      const src = inFile[idx];
      Object.assign(copyToFile[i], { ingr: src.ingr, quantity: src.quantity, unit: src.unit });
      this.updateDataId(copyToFile);
    } else if (action === 'Move after') {
      if (idx < inFile.length - 1) {
        [inFile[idx], inFile[idx + 1]] = [inFile[idx + 1], inFile[idx]];
        this.updateDataId(inFile);
      }
    } else if (action === 'Move before') {
      if (idx > 0) {
        [inFile[idx], inFile[idx - 1]] = [inFile[idx - 1], inFile[idx]];
        this.updateDataId(inFile);
      }
    } else if (action === 'Change value for all') {
      if (perso === 'Perso') this.isChangeValueForAllPerso.set(true);
      else this.isChangeValueForAll.set(true);
      this.currentValue = inFile[idx].quantity;
      this.currentIngr = inFile[idx].ingr;
      this.margLeftChangeAll = 30;
    } else if (action === 'Calculate nutrition facts') {
      this.calculateNutrition(perso === 'Perso' ? 'perso' : 'std');
    }
  }

  private updateDataId(record: classRecipe[]) {
    record.forEach((r, i) => (r.id = i));
  }

  copyFromTo(toRecord: classRecipe[], fromRecord: classRecipe[]) {
    toRecord.push(...fromRecord.map((item, i) =>
      Object.assign(new classRecipe(), { id: i, ingr: item.ingr, quantity: item.quantity, unit: item.unit })));
  }

  afterDropDownSel(event: any) {
    this.tabDialog[this.prevDialog] = false;
    this.resetBooleans();

    const id: string = event.target.id;
    if (id === 'selRecipe') {
      if (event.target.textContent.trim() !== 'Cancel') {
        this.recordRecipe = this.tabRecipe[Number(event.target.value)].posRec;
      }
    } else if (id.startsWith('selText')) {
      this.findId(id);
      const item = this.tabSearch[this.idNb];
      if (item && this.recipeFile.recipe[item.posRec]) {
        this.recordRecipe = item.posRec;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Recipe actions
  // -------------------------------------------------------------------------
  afterDropDownRecipe(event: any) {
    this.tabDialog[this.prevDialog] = false;
    this.resetBooleans();
    this.isDuplicate.set(false);

    const action = this.tabActionRecipe[Number(event.target.value)];
    if (action === 'Cancel') return;

    this.isRecipeModified.set(true);
    switch (action) {
      case 'Delete':
        this.isDeleteRecipe.set(true);
        this.delMsg = this.recipeFile.recipe[this.recordRecipe].name;
        break;
      case 'Create':
        this.isCreateRecipeName.set(true);
        break;
      case 'Duplicate':
        this.isCreateRecipeName.set(true);
        this.isDuplicate.set(true);
        break;
      case 'Rename':
        this.isChangeRecipeName.set(true);
        this.temporaryNameRecipe = '';
        break;
      case 'Calculate nut. facts for all recipes':
        this.calculateNutritionForAllRecipe();
        break;
      case 'Transfer nut. facts to CalFat':
        this.transferToCalFat();
        break;
      case 'Translate FR to UK':
        this.translateComments('FrToUk');
        break;
      case 'Translate UK to FR':
        this.translateComments('UkToFr');
        break;
      case 'Reinitialise':
        this.reInitialieRecipe();
        break;
    }
  }

  onChangeName(event: any) {
    const id = event.target.id;
    if (id === 'cancel') {
      this.isChangeRecipeName.set(false);
    } else if (id === 'input') {
      this.temporaryNameRecipe = event.target.value;
    } else if (id === 'save') {
      const rec = this.recipeFile.recipe[this.recordRecipe];
      const oldName = rec.name;
      rec.name = this.temporaryNameRecipe;
      this.updateInListType(oldName, 'FR', 'Rename', this.temporaryNameRecipe);
      this.isRecipeModified.set(true);
      this.isChangeRecipeName.set(false);
      this.rerunSearch();
    }
  }

  nameRecipe(event: any) {
    switch (event.target.id) {
      case 'input':
        this.temporaryNameRecipe = (event.target as HTMLInputElement).value;
        break;
      case 'save':
        this.onSaveRecipe();
        this.isDuplicate.set(false);
        this.isCreateRecipeName.set(false);
        this.isRecipeModified.set(true);
        break;
      case 'clear':
        this.temporaryNameRecipe = '';
        break;
      case 'cancel':
        // the new recipe is only added on 'save', so there is nothing to remove here
        this.temporaryNameRecipe = '';
        this.isDuplicate.set(false);
        this.resetBooleans();
        break;
    }
  }

  private onSaveRecipe(): void {
    const recipes = this.recipeFile.recipe;
    const sourceIndex = this.recordRecipe;

    const newRecord = new classRecordRecipe();
    newRecord.data.push(new classRecipe());
    newRecord.dataPerso.push(new classRecipe());
    recipes.push(newRecord);
    this.recordRecipe = recipes.length - 1;

    if (this.isCreateRecipeName() && !this.isDuplicate()) {
      const min = this.minHeightCommBox;
      Object.assign(newRecord, {
        name: '',
        commentsBox: min, commentsPersoBox: min, commentsEnBox: min,
        materielBox: min, materielPersoBox: min,
      });
    } else {
      this.fillInRecord(recipes[sourceIndex], newRecord);
    }

    this.tabUpdateRef.push({ init: -1 });
    newRecord.name = this.temporaryNameRecipe;

    // listTypeRecipe[].recipe[] holds recipe names
    const matchingType = this.recipeFile.listTypeRecipe.find(
      t => t.Fr === newRecord.typeFr && t.En === newRecord.typeEn);
    if (matchingType && !matchingType.recipe.includes(newRecord.name)) {
      matchingType.recipe.push(newRecord.name);
    }
  }

  delRecipe(event: any) {
    this.isDeleteRecipe.set(false);
    if (event.target.id !== 'YesDelConfirm') return;

    this.isRecipeModified.set(true);
    this.updateInListType(this.recipeFile.recipe[this.recordRecipe].name, 'FR', 'Delete');
    this.tabUpdateRef.splice(this.recordRecipe, 1);
    this.recipeFile.recipe.splice(this.recordRecipe, 1);
    this.recordRecipe = 0;
    this.refreshFileType(this.recipeFile);
    this.isListTypeUpdated.set(true);

    if (this.isSearchText) {
      this.rerunSearch();
      if (this.tabSearch.length > 0) this.recordRecipe = this.tabSearch[0].posRec;
    }
  }

  reInitialieRecipe() {
    const ref = this.tabUpdateRef[this.recordRecipe];
    if (ref && ref.init !== -1) {
      this.fillInRecord(this.initialRecipeFile.recipe[ref.init], this.recipeFile.recipe[this.recordRecipe]);
    }
  }

  findId(id: string) {
    const i = id.indexOf('-');
    if (i === -1) {
      this.idText = id;
      this.idNb = 0;
    } else {
      this.idText = id.substring(0, i);
      this.idNb = Number(id.substring(i + 1));
    }
  }

  onChangeValues(event: any) {
    if (event.target.id === 'cancel') {
      this.resetBooleans();
    } else {
      this.changeValue = Number(this.SpecificForm.controls.changeValue.value);
      const rec = this.recipeFile.recipe[this.recordRecipe];
      const list = this.isChangeValueForAll() ? rec.data
        : this.isChangeValueForAllPerso() ? rec.dataPerso
        : null;
      const base = list ? Number(list[this.idNb]?.quantity) : 0;

      if (list && this.changeValue !== 0 && base) {
        const factor = this.changeValue / base;
        list.forEach(item => (item.quantity = Number(item.quantity) * factor));
      }
    }
    this.isChangeValueForAll.set(false);
    this.isChangeValueForAllPerso.set(false);
    this.currentIngr = '';
    this.currentValue = 0;
  }

  // -------------------------------------------------------------------------
  // Nutrition
  // -------------------------------------------------------------------------
  calculateNutrition(type: NutritionTarget, index: number = this.recordRecipe) {
    const r = this.recipeFile.recipe[index];
    if (type !== 'perso') this.computeNutrition(r.data, r.nutrition);
    if (type !== 'std') this.computeNutrition(r.dataPerso, r.nutritionPerso);
    this.isRecipeModified.set(true);
  }

  private computeNutrition(items: classRecipe[], target: classNutrition) {
    this.processNutrition(items);
    const t = this.returnData.outHealthData.total;
    Object.assign(target, {
      calories: t.Calories,
      carbs: t.Carbs,
      sugar: t.Sugar,
      proteins: t.Protein,
      cholesterol: t.Cholesterol,
      satFat: t.Fat.Saturated,
      totalSat: t.Fat.Total,
      totalWeight: this.totalGrams(items),
    });
  }

  private totalGrams(items: classRecipe[]): number {
    const conv = this.ConvertUnit.tabConv[this.posGramTabConvert]?.convert ?? [];
    return items.reduce((sum, it) => {
      const q = Number(it.quantity);
      if (it.unit === 'gram') return sum + q;
      const c = conv.find(x => x.toUnit === it.unit);
      return c ? sum + q / Number(c.value) : sum;
    }, 0);
  }

  processNutrition(infile: classRecipe[]) {
    const report = new DailyReport();
    report.date = new Date();
    const meal = new ClassMeal();
    report.meal.push(meal);
    for (const item of infile) {
      const dish = new ClassDish();
      dish.name = item.ingr;
      dish.quantity = item.quantity;
      dish.unit = item.unit;
      meal.dish.push(dish);
    }
    this.returnData = calcFatCalories(this.ConfigCaloriesFat, report, this.ConvertUnit);
  }

  calculateNutritionForAllRecipe() {
    for (let i = 0; i < this.recipeFile.recipe.length; i++) {
      this.calculateNutrition('all', i);
    }
    this.recipeFile.updatedAt = strDateTime();
    this.message = '';
    this.isRecipeModified.set(true);
  }

  transferToCalFat() {
    const r = this.recipeFile.recipe[this.recordRecipe];
    const tabs = this.ConfigCaloriesFat.tabCaloriesFat;

    let group = tabs.find(t => t.Type === 'Recipe');
    if (!group) {
      group = new ClassCaloriesFat();
      group.Type = 'Recipe';
      tabs.push(group);
    }

    const key = r.name.toLowerCase().trim();
    let item = group.Content.find(c => c.Name.toLowerCase().trim() === key);
    if (!item) {
      item = new ClassItem();
      group.Content.push(item);
    }

    const n = r.nutrition;
    item.Name = key;
    item.Serving = n.totalWeight;
    item.ServingUnit = 'gram';
    item.Calories = n.calories;
    item.Protein = n.proteins;
    item.Carbs = n.carbs;
    item.Sugar = n.sugar;
    item.Cholesterol = n.cholesterol;
    item.GlyIndex = 0;
    item.Fat.Saturated = n.satFat;
    item.Fat.Total = n.totalSat;

    this.ConfigCaloriesFat.updatedAt = strDateTime();
    this.putRecord(
      this.identification.configFitness.bucket,
      this.identification.configFitness.files.calories,
      this.ConfigCaloriesFat);
  }

  // -------------------------------------------------------------------------
  // Ingredient search / input
  // -------------------------------------------------------------------------
  onMouseUp(evt: MouseEvent) {
    this.modifInput(evt);
  }

  filterCalFat(ingr: string) {
    const q = ingr.toLowerCase().trim();
    this.tabListCalFat = this.ConfigCaloriesFat.tabCaloriesFat
      .flatMap(t => t.Content)
      .filter(c => c.Name.toLowerCase().includes(q))
      .map(c => ({ name: c.Name, serving: c.Serving, unit: c.ServingUnit }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const show = this.tabListCalFat.length > 0;
    this.isIngrDropDown.set(show);
    if (show) {
      const h = this.tabListCalFat.length * this.heightItemDropDown;
      this.heightDropDown = Math.min(h, this.maxHeightDropDown);
      this.scrollY = h > this.maxHeightDropDown ? 'scroll' : 'hidden';
    }
  }

  modifInput(event: any) {
    this.resetBooleans();
    this.findId(event.target.id);
    this.isIngrDropDown.set(false);
    this.isRecipeModified.set(true);

    const rec = this.recipeFile.recipe[this.recordRecipe];
    if (!rec) return;
    const value = event.target.value;

    if (this.textFields.has(this.idText)) {
      (rec as any)[this.idText] = value;
      return;
    }

    const perso = this.idText.endsWith('Perso');
    const field = perso ? this.idText.slice(0, -'Perso'.length) : this.idText;
    const list = perso ? rec.dataPerso : rec.data;
    const row = list[this.idNb];

    switch (field) {
      case 'ingr':
        row.ingr = value;
        this.ingrType = this.idText;
        this.filterCalFat(value);
        break;
      case 'selingr':
        row.ingr = this.tabListCalFat[value].name.trim();
        break;
      case 'quantity':
        row.quantity = value;
        break;
      case 'unit':
        row.unit = value;
        break;
    }
  }

  // -------------------------------------------------------------------------
  // Comments boxes
  // -------------------------------------------------------------------------
  dropdownComments(event: any) {
    this.resetBooleans();
    this.isActionComments.set(false);

    const action = this.tabActionComments[event.target.value];
    if (action === 'Translate FR to UK') return this.translateComments('FrToUk');
    if (action === 'Translate UK to FR') return this.translateComments('UkToFr');

    const m = action?.match(/^Zoom (in|out) - (.+)$/);
    const key = m && this.zoomBoxes[m[2]];
    if (m && key) {
      const rec = this.recipeFile.recipe[this.recordRecipe];
      const dir = m[1] as 'in' | 'out';
      rec[key] = this.calculateZoom(rec[key], dir === 'in' ? this.zoomInRate : this.zoomOutRate, dir);
    }
  }

  calculateZoom(inRecord: number, rate: number, zoom: string): number {
    if (inRecord === 0) return this.minHeightCommBox;

    if (zoom === 'in') {
      return Math.max(inRecord * rate, this.minHeightCommBox);
    }
    const factor = inRecord < this.maxHeightCommBox / 2.5 ? 1.8 : rate;
    return Math.min(inRecord * factor, this.maxHeightCommBox);
  }

  selStdPer(j: number) {
    if (j === 0 || j === 1) {
      this.theStdPersoDisplay[j] = this.theStdPersoDisplay[j] === 'Y' ? 'N' : 'Y';
    }
  }

  selEyeNutFact(event: any) {
    const j = event.target.id === 'eyeStd' ? 0 : event.target.id === 'eyePerso' ? 1 : -1;
    if (j !== -1) {
      this.eyeNutritionFact[j] = this.eyeNutritionFact[j] === 'Y' ? 'N' : 'Y';
    }
  }

  // -------------------------------------------------------------------------
  // Translation
  // -------------------------------------------------------------------------
  translateComments(lang: string) {
    if (this.dicFrEn.length === 0) {
      this.dicFrEn = this.buildDico('French', 'English', 'nbWordsFr', 'nbWordsEn');
    }
    if (this.dicEnFr.length === 0) {
      this.dicEnFr = this.buildDico('English', 'French', 'nbWordsEn', 'nbWordsFr');
    }

    const rec = this.recipeFile.recipe[this.recordRecipe];
    if (lang === 'FrToUk' && rec.comments !== '') {
      rec.commentsEn = this.processTranslation(this.dicFrEn, rec.comments);
    } else if (lang === 'UkToFr' && rec.commentsEn !== '') {
      rec.comments = this.processTranslation(this.dicEnFr, rec.commentsEn);
    }
  }

  private buildDico(inKey: string, outKey: string, inCount: string, outCount: string) {
    return this.tabFraEng
      .map(e => ({
        outLang: e[outKey],
        inLang: e[inKey],
        nbWordsOut: e[outCount],
        nbWordsIn: e[inCount],
      }))
      .sort((a, b) => b.nbWordsIn - a.nbWordsIn); // longest phrases first
  }

  private wordMap(dico: any[]): Map<string, string> {
    let map = this.wordMaps.get(dico);
    if (!map) {
      map = new Map<string, string>();
      for (const d of dico) {
        const k = String(d.inLang ?? '').trim().toLowerCase();
        if (k && !map.has(k)) map.set(k, d.outLang);
      }
      this.wordMaps.set(dico, map);
    }
    return map;
  }

  private capitalise(s: string): string {
    return s.charAt(0).toUpperCase() + s.substring(1);
  }

  processTranslation(dico: any[], inComments: string): string {
    // "0C" is typed as a shortcut for the degree symbol
    let text = inComments.replace(/0C/g, DEGREE_C);

    // 1. multi-word expressions are replaced first by placeholders
    const substitutions: string[] = [];
    for (const d of dico) {
      const phrase = String(d.inLang ?? '').trim();
      if (d.nbWordsIn === 1 || !phrase) continue;
      const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      text = text.replace(re, (match: string) => {
        const out = String(d.outLang).trim();
        substitutions.push(/^\p{Lu}/u.test(match) ? this.capitalise(out) : out);
        return `ZZZZZ${substitutions.length - 1}ZZZZZ`;
      });
    }

    // 2. word by word translation, separators are kept as they are
    const words = this.wordMap(dico);
    const tokens = text.split(/([ ,.\-'{}\[\]()/?*@!:;<>\\|\n]+)/);

    return tokens.map((tok, idx) => {
      if (idx % 2 === 1 || tok === '') return tok; // separator

      const ph = tok.match(/^ZZZZZ(\d+)ZZZZZ$/);
      if (ph) return substitutions[Number(ph[1])];

      const out = words.get(tok.trim().toLowerCase());
      if (out === undefined) return tok; // not found: keep the word
      return /^\p{Lu}/u.test(tok) ? this.capitalise(out) : out;
    }).join('');
  }

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------
  private normalize(s: string): string {
    let n = this.normCache.get(s);
    if (n === undefined) {
      n = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      this.normCache.set(s, n);
    }
    return n;
  }

  private rerunSearch() {
    if (this.isSearchText) {
      this.searchText({ target: { id: 'search', value: this.textToSearch } });
    }
  }

  searchText(event: any) {
    this.resetBooleans();
    const id = event.target.id;

    if (id === 'search') {
      this.isSearchText = true;
      const raw: string = event.target.value;
      this.textToSearch = raw.substring(0, 1).toUpperCase() + raw.substring(1).trim();
      const theText = this.normalize(raw);

      const type = this.radioSelect !== -1 ? this.recipeFile.listTypeRecipe[this.radioSelect] : null;

      this.tabSearch = this.recipeFile.recipe
        .map((r, posRec) => ({ r, posRec }))
        .filter(({ r }) =>
          (!type || (type.En === r.typeEn && type.Fr === r.typeFr)) &&
          (theText === '' || this.normalize(r.name).includes(theText)))
        .map(({ r, posRec }) => ({ name: r.name.trim(), posRec }))
        .sort((a, b) => a.name.localeCompare(b.name));

      if (this.tabSearch.length > 9) {
        this.heightSearchDropdown = 200;
        this.searchScroll = 'scroll';
      } else {
        this.heightSearchDropdown = 25 * this.tabSearch.length;
        this.searchScroll = 'hidden';
      }
    } else if (id === 'cancel') {
      this.isSearchText = false;
      this.textToSearch = '';
      this.heightSearchDropdown = 0;
      this.searchScroll = 'hidden';
      this.tabSearch = [];
      this.resetBooleans();
    }
  }

  // -------------------------------------------------------------------------
  // Recipe types
  // -------------------------------------------------------------------------
  onInputType(event: Event): void {
    this.resetBooleans();

    const target = event.target as HTMLInputElement;
    if (!target) return;

    const lang = target.id; // 'Fr' or 'En'
    const value = target.value;

    if (lang === 'Fr' || lang === 'En') {
      const otherLang = lang === 'Fr' ? 'En' : 'Fr';
      const result = this.findItemDico(value, lang, otherLang);

      if (result !== -1) {
        const rec = this.recipeFile.recipe[this.recordRecipe];
        rec.typeEn = this.tabFraEng[result].English;
        rec.typeFr = this.tabFraEng[result].French;
      } else {
        const missing = lang === 'Fr' ? 'English' : 'French';
        this.errType = `No ${missing} translation of ${value} found in the dictionary`;
      }

      if (this.tabDropdownType.length > 1) {
        if (lang === 'Fr') this.isListTypeFr = true;
        else this.isListTypeEn = true;
      }
    }

    if (this.errType === '') {
      this.refreshFileType(this.recipeFile);
      this.isListTypeUpdated.set(true);
      this.isRecipeModified.set(true);
    }

    this.createTabDropdownType(this.recipeFile.listTypeRecipe, lang.toUpperCase(), value);
    this.rerunSearch();
  }

  findItemDico(item: string, fromLang: string, toLang: string): number {
    const cleaned = item.trim().toUpperCase();
    const key = fromLang === 'Fr' && toLang === 'En' ? 'French'
      : fromLang === 'En' && toLang === 'Fr' ? 'English'
      : null;
    if (!key) return -1;
    return this.tabFraEng.findIndex(el => el[key].trim().toUpperCase() === cleaned);
  }

  updateInListType(recipeName: string, lang: 'FR' | 'UK', action: 'Delete' | 'Rename', newName?: string): void {
    this.isRecipeModified.set(true);

    const file = this.recipeFile;
    const current = file.recipe[this.recordRecipe];
    const targetType = lang === 'FR' ? current.typeFr : current.typeEn;
    const typeIndex = file.listTypeRecipe.findIndex(item => (lang === 'FR' ? item.Fr : item.En) === targetType);
    if (typeIndex === -1) return;

    const typeItem = file.listTypeRecipe[typeIndex];
    let theValue = 'ALL';

    if (action === 'Delete') {
      if (typeItem.recipe.length === 1) {
        file.listTypeRecipe.splice(typeIndex, 1);
      } else {
        const i = typeItem.recipe.indexOf(recipeName);
        if (i !== -1) typeItem.recipe.splice(i, 1);
        theValue = lang === 'FR' ? typeItem.Fr : typeItem.En;
      }
    } else {
      const i = typeItem.recipe.indexOf(recipeName);
      if (i !== -1 && newName !== undefined) typeItem.recipe[i] = newName;
      theValue = lang === 'FR' ? typeItem.Fr : typeItem.En;
    }

    this.createTabDropdownType(file.listTypeRecipe, lang, theValue);
  }

  createTabDropdownType(record: any[], lang: string, text: string): void {
    const langKey = lang === 'FR' ? 'Fr' : 'En';
    const unique = new Set<string>();
    for (const item of record) {
      const value = item?.[langKey];
      if (value && value.includes(text)) unique.add(value.trim());
    }

    this.tabDropdownType = [{ name: 'Cancel' }, ...Array.from(unique).map(name => ({ name }))];
    const count = this.tabDropdownType.length;
    this.theHeight = count > 8 ? 240 : count * 30;
  }

  onDropdownListType(event: any) {
    const chosen: string = event.target.textContent.trim();
    if (chosen === 'Cancel') {
      this.tabDialog[this.prevDialog] = false;
      this.idText = '';
      this.isActionRecipe.set(false);
    } else {
      const rec = this.recipeFile.recipe[this.recordRecipe];
      if (this.isListTypeFr) {
        this.updateTypeName(this.recipeFile, chosen, rec.typeFr, 'Fr', rec.name);
        rec.typeFr = chosen;
      } else {
        this.updateTypeName(this.recipeFile, chosen, rec.typeEn, 'En', rec.name);
        rec.typeEn = chosen;
      }
    }
    this.resetBooleans();
  }

  /** Moves the current recipe from its old type group to the new one (creating it if needed). */
  updateTypeName(inFile: any, newType: string, oldType: string, lang: string, recipeName: string) {
    this.isRecipeModified.set(true);
    if (oldType !== '' && newType === oldType) return;

    const cur = lang === 'Fr' ? 'Fr' : 'En';
    const alt = cur === 'Fr' ? 'En' : 'Fr';
    const rec = inFile.recipe[this.recordRecipe];
    const altVal: string = alt === 'Fr' ? rec.typeFr : rec.typeEn;
    const list: any[] = inFile.listTypeRecipe;

    // 1. remove the recipe from its old group
    if (oldType !== '') {
      const oldIdx = list.findIndex(t => t[cur] === oldType && t[alt] === altVal);
      if (oldIdx !== -1) {
        const old = list[oldIdx];
        old.recipe = old.recipe.filter((n: string) => n !== recipeName);
        if (old.recipe.length === 0) list.splice(oldIdx, 1);
      }
    }

    // 2. add it to the new group
    let target = list.find(t => t[cur] === newType && t[alt] === altVal);
    if (!target && oldType === '') {
      // a group with only the other language filled in
      target = list.find(t => t[alt] === altVal && t[cur] === '');
    }

    if (target) {
      target[cur] = newType;
      if (!target.recipe.includes(recipeName)) target.recipe.push(recipeName);
    } else {
      list.push({ [cur]: newType, [alt]: altVal, recipe: [recipeName] });
    }
  }

  onRefresh() {
    this.refreshFileType(this.recipeFile);
  }

  refreshFileType(inFile: any) {
    inFile.listTypeRecipe.length = 0;
    this.updateFileType(inFile);
  }

  updateFileType(inFile: any) {
    inFile.listTypeRecipe = [];

    if (inFile?.recipe?.length) {
      for (const { typeFr, typeEn, name } of inFile.recipe) {
        const existing = inFile.listTypeRecipe.find((t: any) => t.Fr === typeFr);
        if (existing) {
          existing.recipe.push(name);
        } else {
          inFile.listTypeRecipe.push({ Fr: typeFr, En: typeEn, recipe: [name] });
        }
      }
    }
    this.rebuildListTypeName(inFile.listTypeRecipe);
  }

  private rebuildListTypeName(list: any[]) {
    this.listTypeName = [
      ['Tous', ...list.map(t => t.Fr)],
      ['All', ...list.map(t => t.En)],
    ];
  }

  // -------------------------------------------------------------------------
  // Copy helpers
  // -------------------------------------------------------------------------
  fillFileRecord(inFile: classFileRecipe, outFile: classFileRecipe) {
    outFile.fileType = inFile.fileType;
    outFile.listTypeRecipe = inFile.listTypeRecipe.map(t => ({ Fr: t.Fr, En: t.En, recipe: [...t.recipe] }));
    outFile.recipe = inFile.recipe.map(r => {
      const copy = new classRecordRecipe();
      this.fillInRecord(r, copy);
      return copy;
    });
  }

  fillInRecord(inRecord: classRecordRecipe, outRecord: classRecordRecipe) {
    const {
      typeFr, typeEn, name,
      comments, commentsPerso, commentsEn, commentsBox, commentsPersoBox, commentsEnBox,
      materiel, materielPerso, materielBox, materielPersoBox,
      nutrition, nutritionPerso,
      data = [], dataPerso = [],
    } = inRecord;

    Object.assign(outRecord, {
      typeFr, typeEn, name,
      comments, commentsPerso, commentsEn, commentsBox, commentsPersoBox, commentsEnBox,
      materiel, materielPerso, materielBox, materielPersoBox,
    });

    outRecord.nutrition = { ...new classNutrition(), ...nutrition };
    outRecord.nutritionPerso = { ...new classNutrition(), ...nutritionPerso };

    const copyList = (list: classRecipe[]) =>
      list.map((item, j) => Object.assign(new classRecipe(), {
        id: j, ingr: item.ingr, quantity: item.quantity, unit: item.unit,
      }));
    outRecord.data = copyList(data);
    outRecord.dataPerso = copyList(dataPerso);
  }

  // -------------------------------------------------------------------------
  // Save / cancel
  // -------------------------------------------------------------------------
  CancelRecord() {
    this.fillFileRecord(this.initialRecipeFile, this.recipeFile);
    this.resetUpdateRefs();
    this.recordRecipe = 0;

    if (this.isSearchText) {
      this.rerunSearch();
      if (this.tabSearch.length > 0) this.recordRecipe = this.tabSearch[0].posRec;
    }
    this.resetBooleans();
    this.isRecipeModified.set(false);
    this.isCreateRecipeName.set(false);
  }

  CancelSave() {
    this.resetBooleans();
  }

  ConfirmSave() {
    this.resetBooleans();
    this.tabDialog[this.prevDialog] = false;
    const file = this.theListOfObjects[this.fileNb];
    if (!file) return;
    this.SpecificForm.controls.fileHeader.setValue(file.header);
    this.SpecificForm.controls.fileName.setValue(file.name + file.json);
    this.IsSaveConfirmed.set(true);
  }

  SaveRecord() {
    this.calculateNutrition('all');
    this.recipeFile.updatedAt = strDateTime();
    this.putRecord(
      this.googleBucketName,
      this.SpecificForm.controls.fileHeader.value + this.SpecificForm.controls.fileName.value,
      this.recipeFile);
    this.resetBooleans();
    this.isRecipeModified.set(false);
    this.isCreateRecipeName.set(false);
  }

  putRecord(GoogleBucket: string, GoogleObject: string, record: any) {
    const file = new File([JSON.stringify(record)], GoogleObject, { type: 'application/json' });
    this.ManageGoogleService.uploadObject(this.configServer, GoogleBucket, file, GoogleObject)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          if (res.type === HttpEventType.Response) {
            this.message = `File "${GoogleObject}" is successfully stored in the cloud`;
            this.isRecipeModified.set(false);
            this.IsSaveConfirmed.set(false);
            this.isMessage.set(true);
          }
        },
        error: e => {
          this.Error_Access_Server = `File ${GoogleObject} *** Save action failed - status is ${e.status}`;
        },
      });
  }
}
