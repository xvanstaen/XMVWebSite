import {
  Component, Injectable, inject, Input, input, Output, HostListener,
  EventEmitter, 
  signal } from '@angular/core';

import { MatIconModule} from '@angular/material/icon';
import { CommonModule,  } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormGroup, FormControl, Validators,} from '@angular/forms';

import { MainManageFileComponent } from '../../fileAccessMgt/file-access.component';
import { HealthComponent } from '../../Health/healthfood/health.component';``
import { CaloriesFatComponent } from '../../Health/calories-fat/calories-fat.component';
import { ReportHealthComponent } from '../../Health/report-health/report-health.component';
import { ConfigHTMLHealthComponent } from '../../config-htmlhealth/config-htmlhealth.component';
import { ManageCacheFiles } from '../../manage-cache-files/manage-cache-files';
import {  Bucket_List_Info } from '../../JsonServerClass';

import { msginLogConsole } from '../../consoleLog'
import { configServer, LoginIdentif, msgConsole, classCredentials, classtheEvent, classCheckLock } from '../../JsonServerClass';

import { mainClassConv, mainConvItem } from '../../ClassConverter'

import { mainClassCaloriesFat } from '../ClassHealthCalories'
import { DailyReport, mainDailyReport, ClassMeal, ClassDish } from '../ClassHealthCalories'

import { classConfHTMLFitHealth, classConfTableAll } from '../classConfHTMLTableAll';
import { classConfigChart,  } from '../classConfigChart';
import { classFileParamChart } from '../classChart';
import { classAccessFile, classHeaderReturnDataFS, classRetrieveFile } from '../../classFileSystem';
import { ManageGoogleService } from '../../CloudServices/ManageGoogle.service';

import { convertDate, strDateTime,  } from '../../MyStdFunctions';
import { FillHealthAllInOut } from '../../copyFilesFunction';
import { calcFatCalories, HealthResult } from '../CalcFatCalories';

@Injectable({ providedIn: 'root' })
export class HealthCalculatorService {
  calculate(
    report: DailyReport,
    foods: mainClassCaloriesFat,
    conv: mainClassConv,
  ): HealthResult {
    return calcFatCalories(foods, report, conv);
  }
}

export class returnSignal{
  nb:number=-1;
  function:string="";
}
interface SaveResultEvent {
  iWait: number;
  status?: number;
  err?: string;
}

@Component({
  selector: 'app-main-health',
  templateUrl: './main-health.component.html',
  styleUrls: ['./main-health.component.css'],
  standalone:true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule,
    MainManageFileComponent, CaloriesFatComponent, ReportHealthComponent, HealthComponent, ConfigHTMLHealthComponent,ManageCacheFiles ]
  })
export class MainHealthComponent {

  constructor(
    private ManageGoogleService: ManageGoogleService,
    
  ) { }
 private calculator = inject(HealthCalculatorService);

  @Input() configServer = new configServer;
  @Input() identification = new LoginIdentif;
  @Input() tabLock: Array<classAccessFile> = [];
  @Input() triggerFunction: number = 0;
  
  @Input() credentials = new classCredentials;
  @Input() credentialsMongo = new classCredentials;
  @Input() credentialsFS = new classCredentials;

  @Output() onTriggerSave = new EventEmitter<any>();

  openFileAccess=signal<boolean>(true);
  signalActionHealth=signal<number>(-1);

  displayHealthAll=signal<boolean>(false);
  displayCalFat=signal<boolean>(false);

  actionRecipe=signal<number>(-1);

  recipeFileRetrieved=signal<number>(-1);
  calFatFileRetrieved=signal<number>(-1);
  triggerCalFatSave=signal<number>(-1);
  triggerParamSave=signal<number>(-1);

  isConfigHealth=signal<boolean>(false);
  isErrorMsg=signal<boolean>(false);

  configHTMLRetrieved:number=-1; 

  isRetrieveFile :boolean=false;
  iWaitToRetrieve:Array<classRetrieveFile>=[];

  resultCheckLimitHealth:number=-1;
  resultCheckLimitCalFat=signal<number>(-1);
  resultCheckLimitParamChart:number=0;
  resultCheckLimitRecipe:number=0;

  returnDataFS=new classHeaderReturnDataFS;

  triggerCheckToLimit=signal<number>(-1);
  triggerFileSystem=signal<number>(-1);
  triggerReadFile=signal<number>(-1);
  triggerSaveFile=signal<number>(-1);

  InHealthAllData = new mainDailyReport; // initial object
  HealthAllData = new mainDailyReport; // modifiable object

  convToDisplay=new mainConvItem;

  tabNewRecordAll: Array<any> = [
    {
      ngStyle:0,
      even:0,
      change:false,
      nb: 0,
      meal: [{
        nb: 0,
        food: [{ nb: 0, }]
      }]
    }
  ];

  returnDataFSHealth=new classHeaderReturnDataFS;
  returnDataFSCalFat=new classHeaderReturnDataFS;
  returnDataFSParamChart=new classHeaderReturnDataFS;
  returnDataFSRecipe=new classHeaderReturnDataFS;

  returnData = {
    error: 0,
    outHealthData: new DailyReport
  }

  ConfigCaloriesFat = new mainClassCaloriesFat;
  fileRecipe = new mainClassCaloriesFat;
  ConfigHTMLFitHealth = new classConfHTMLFitHealth;
  confTableAll = new classConfTableAll;
  ConfigChart = new classConfigChart;
  fileParamChart = new classFileParamChart;
  ConvertUnit = new mainClassConv;

  myLogConsole: boolean = false;
  myConsole: Array<msgConsole> = [];
  returnConsole: Array<msgConsole> = [];
  SaveConsoleFinished: boolean = false;
  type: string = '';

  HTTP_Address: string = '';
  HTTP_AddressPOST: string = '';
  Google_Bucket_Access_Root: string = 'https://storage.googleapis.com/storage/v1/b/';
  Google_Bucket_Access_RootPOST: string = 'https://storage.googleapis.com/upload/storage/v1/b/';
  Google_Object_Health: string = 'HealthTracking';
  Google_Object_Console: string = 'LogConsole';
  Google_Object_Calories: string = 'ConfigCaloriesFat';
  bucket_data: string = '';
  myListOfObjects = new Bucket_List_Info;
  DisplayListOfObjects: boolean = false;


  errorMsg=signal<string>("");

  EventHTTPReceived: Array<boolean> = [];
  EventStopWaitHTTP: Array<boolean> = [];
  maxEventHTTPrequest: number = 12;
  id_Animation: Array<number> = [];
  TabLoop: Array<number> = [];
  NbWaitHTTP: number = 0;

  saveServer={
    google:"",
    mongo:"",
    FS:""
  }

  isconfirmSaveA:boolean=false;
  isconfirmSave:boolean=false;
  //isDisplayAll:boolean=false;

  isCopyFile=signal<boolean>(false);
  isMgtCaloriesFat:boolean=false;

  isDisplayChart:boolean=false;
  isSaveCaloriesFat:boolean=false;

  calfatNameFile: string = '';
  errCalcCalFat=signal<string>('');

  processDestroy: boolean = false;
  passDestroy: number = 0;

  eventLockLimit= new classtheEvent;

  resultFileSystemHealth:number=0;
  resultFileSystemCalFath:number=0;
  resultFileSystemParamChart:number=0;
  resultFileSystemRecipe:number=0;

  iWait:number=0;

  statusSaveFnHealth:any;
  statusSaveFnCalFat:any;
  statusSaveFnParamChart:any;
  statusSaveFnRecipe:any;
 
  TheSelectDisplays: FormGroup = new FormGroup({
    DisplayAll: new FormControl('N', { nonNullable: true }),
    CopyFile: new FormControl('N', { nonNullable: true }),
    MgtCalories: new FormControl('N', { nonNullable: true }),
    CalculCalories: new FormControl('N', { nonNullable: true }),
    SelectedDate: new FormControl(Date(), { nonNullable: true }),
    theAction: new FormControl('Action', { nonNullable: true }),
    DisplayChart: new FormControl('N', { nonNullable: true }),
    ReloadHTML: new FormControl('N', { nonNullable: true }),
    ReloadChart: new FormControl('N', { nonNullable: true }),
    CreateNewHealthCheckFile: new FormControl('N', { nonNullable: true }),
    searchString: new FormControl('', { nonNullable: true }),
    startRange: new FormControl('', [
      Validators.required,
      // validates date format yyyy-mm-dd with regular expression
      Validators.pattern(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/)
    ]),
    endRange: new FormControl('', [
      Validators.required,
      // validates date format yyyy-mm-dd with regular expression
      Validators.pattern(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/)
    ]),
  })

  SpecificForm = new FormGroup({
    FileName: new FormControl('', { nonNullable: true }),
  })

  initialHealthFileName:string="";

  triggerCalculateCalFat:boolean=false;
  tabSelRadio:Array<string>=[];
  createNewHealth=signal<boolean>(false);

ngOnInit(): void {
  // used to open files in parallel using the google and mongo servers
  const { googleServer, mongoServer, fileSystemServer } = this.configServer;
  this.saveServer.google = googleServer;
  this.saveServer.mongo = mongoServer;
  this.saveServer.FS = fileSystemServer;

  const n = this.maxEventHTTPrequest;
  this.EventHTTPReceived = new Array(n).fill(false);
  this.EventStopWaitHTTP = new Array(n).fill(false);
  this.TabLoop = new Array(n).fill(0);
  this.tabSelRadio = new Array(20).fill('N');

  this.eventLockLimit.checkLock.action = 'firstLoop';

  const initialControl: Record<number, string> = {
    3: 'DisplayAll',
    5: 'MgtCalories',
    7: 'DisplayChart',
  };

  if (this.triggerFunction !== 0) {
    const control = initialControl[this.triggerFunction];
    if (control) {
      this.TheSelectDisplays.controls[control].setValue('Y');
    }
    this.SelRadio(`Y-${this.triggerFunction}`);
  }

  this.SelectDisplay();
}  
resultFileSystemFn(event: classHeaderReturnDataFS): void {
  this.eventLockLimit.checkLock.iCheck = false;
  this.errorMsg.set('');
  event.nbRecall++;

  const radio = this.tabSelRadio;

  switch (event.iWait) {
    case 0:
      this.returnDataFSHealth = event;
      this.resultCheckLimitHealth++;
      if (radio[3] === 'Y' || radio[4] === 'Y' || radio[6] === 'Y') {
        this.displayHealthAll.set(true);
      }
      break;

    case 1:
      this.returnDataFSCalFat = event;
      if (radio[5] === 'Y') {
        this.bumpCalFatCheck();
        this.displayCalFat.set(true);
      }
      break;

    case 5:
      this.returnDataFSParamChart = event;
      this.bumpCalFatCheck();
      break;

    case 6:
      this.returnDataFSRecipe = event;
      this.bumpCalFatCheck();
      this.displayCalFat.set(true);
      break;
  }
}

private bumpCalFatCheck(): void {
  this.resultCheckLimitCalFat.update(n => n + 1);
}
resultSaveRecord(event: SaveResultEvent): void {
  this.openFileAccess.set(false);

  switch (event.iWait) {
    case 0:
      this.handleHealthSaveResult(event);
      break;
    case 1:
    case 6:
      this.statusSaveFnCalFat = event;
      this.triggerCalFatSave.update(n => n + 1);
      break;
    case 5:
      this.statusSaveFnParamChart = event;
      this.triggerParamSave.update(n => n + 1);
      break;
  }
}

handleHealthSaveResult(event: any): void {
  const ok = event.status === 200 || event.status === 0;

  switch (this.actionSave) {
    case 'saveCopy':
      if (ok) {
        this.cancelCopy();
        this.errorMsg.set('Copy of the file has been successfully saved');
       
        this.tabSelRadio[4] = 'N';
      } else {
        this.errorMsg.set(event.err ?? 'Creation of the new Health File failed');
      }
      break;

    case 'createNewHealth':
      if (ok) {
        this.errorMsg.set('Creation of the new Health File is successful');
        this.applyHealthSaveSuccess(event);
      } else {
        this.errorMsg.set(event.err ?? 'Creation of the new Health File failed');
        this.createNewHealth.set(true);
      }
      this.tabSelRadio[10] = 'N';
      this.tabSelRadio[3] = 'Y';
      
      break;

    case '':
      if (ok) {
        this.errorMsg.set('Update of the Health file is successful');
        this.applyHealthSaveSuccess(event);
      } else {
        this.errorMsg.set(event.err ?? 'update of the Health file failed');
      }
  }
  this.actionSave = '';
}

private applyHealthSaveSuccess(event: any): void {
  this.statusSaveFnHealth = event;
  const ok = event.status === 200 || event.status === 0;
  if (ok) {
    this.InHealthAllData.tabDailyReport.length=0;
    this.InHealthAllData = FillHealthAllInOut(this.InHealthAllData, this.HealthAllData);
    this.initTrackRecord();
    if (this.actionSave==="createNewHealth"){
      this.afterNewHealth();
    }
    
  }
  this.signalActionHealth.update(n => n + 1);
}
  afterNewHealth(){
    // new file has been created
    // call Health component to fill-in this empty file
    this.identification.fitness.files.fileHealth=this.SpecificForm.controls['FileName'].value;
    this.createNewHealth.set(false);
    this.displayHealthAll.set(true);
    this.EventHTTPReceived[0]=true;
    this.tabLock[0].lock=3; // Next test does not make sense ??????
    // lock the newly created file 
        this.iWaitToRetrieve.splice(0,this.iWaitToRetrieve.length);
        this.tabLock[0].action='lock';
        this.iWait=0;
        const theClass=new classRetrieveFile;
        this.iWaitToRetrieve.push(theClass);
        this.iWaitToRetrieve[0].iWait=0;
        this.iWaitToRetrieve[0].accessFS=true;
        this.triggerFileSystem.update (fs => fs + 1);
        this.openFileAccess.set(true);
    
  }

resultGetRecord(event: any): void {
  const { iWait, content } = event;
  this.EventStopWaitHTTP[iWait] = true;

  const failed = event.status !== undefined && event.status !== 200 && event.status !== 0;
  //this.isErrorMsg.set(failed);
  if (failed) {
    this.errorMsg.update(msg => `${msg} error:${event.status} when retrieving the file ${this.tabLock[iWait].object}`);
    return;                                   // content is not usable
  }

  switch (iWait) {
    case 0:  this.receiveHealth(content); break;
    case 1:  this.receiveCalFat(content); break;
    case 2:  this.receiveConvert(content); break;
    case 3:  this.receiveHtmlConfig(content); break;
    case 4:
      this.configServer.googleServer = this.saveServer.google;
      this.copyHeader(this.ConfigChart, content);
      this.ConfigChart.chartHealth = content.chartHealth;
      break;
    case 5:
      this.copyHeader(this.fileParamChart, content);
      this.fileParamChart.data = content.data;
      break;
    case 6:
      this.copyHeader(this.fileRecipe, content);
      this.fileRecipe.tabCaloriesFat = content.tabCaloriesFat;
      this.displayCalFat.set(true);
      this.recipeFileRetrieved.update(n => n + 1);
      break;
    case 10:
      this.convToDisplay = content;
      break;
  }

  this.EventHTTPReceived[iWait] = true;

  const received = this.EventHTTPReceived;
  if (this.triggerCalculateCalFat === true && received[0] && received[1] && received[2]) {
    this.processCalculateCalFat();
  }
}

// ---------- one handler per file ----------

private receiveHealth(content: any): void {
  this.configServer.googleServer = this.saveServer.google;

  this.HealthAllData.tabDailyReport.length = 0;
  this.HealthAllData = FillHealthAllInOut(this.HealthAllData, content);
  this.HealthAllData.tabDailyReport.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (this.HealthAllData.fileType === '') {
    this.HealthAllData.fileType = this.identification.fitness.fileType.Health;
  }
  if (this.InHealthAllData.fileType === '') {   // keep an untouched copy for change detection
    this.InHealthAllData.tabDailyReport.length = 0;
    this.InHealthAllData = FillHealthAllInOut(this.InHealthAllData, this.HealthAllData);
  }

  this.initTrackRecord();
  this.SpecificForm.controls['FileName'].setValue(this.identification.fitness.files.fileHealth);
  this.initialHealthFileName=this.identification.fitness.files.fileHealth;
  this.displayHealthAll.set(true);
}

private receiveCalFat(content: any): void {
  this.copyHeader(this.ConfigCaloriesFat, content, this.identification.fitness.fileType.FitnessMyConfig);
  this.ConfigCaloriesFat.tabCaloriesFat = content.tabCaloriesFat;
  this.displayCalFat.set(true);
  this.calFatFileRetrieved.update(n => n + 1);
}

private receiveConvert(content: any): void {
  this.ConvertUnit = content;
  this.copyHeader(this.ConvertUnit, content, this.identification.configFitness.fileType.convertUnit);
}

private receiveHtmlConfig(content: any): void {
  const cfg = this.ConfigHTMLFitHealth;

  cfg.fileType = content.fileType;
  cfg.debugPhone = content.debugPhone;

  cfg.ConfigHealth.fileType = content.ConfigHealth.fileType;
  cfg.ConfigHealth.updatedAt = content.ConfigHealth.updatedAt ?? '';
  cfg.ConfigHealth.confTableAll = content.ConfigHealth.confTableAll;

  cfg.ConfigCalFat.fileType = content.ConfigCalFat.fileType;
  cfg.ConfigCalFat.updatedAt = content.ConfigCalFat.updatedAt ?? '';
  cfg.ConfigCalFat.confCaloriesFat = content.ConfigCalFat.confCaloriesFat;

  this.confTableAll = cfg.ConfigHealth.confTableAll;
  this.configHTMLRetrieved++;
}

/** Copies fileType and updatedAt. A default fileType is used only when one is given and the file's is empty. */
private copyHeader(
  target: { fileType: string; updatedAt: string },
  content: { fileType: string; updatedAt?: string },
  defaultType?: string,
): void {
  target.fileType = defaultType !== undefined && content.fileType === '' ? defaultType : content.fileType;
  target.updatedAt = content.updatedAt ?? '';
}

  processCalculateCalFat(): void {
    this.triggerCalculateCalFat = false;
    const allErrors: string[] = [];
    for (const report of this.HealthAllData.tabDailyReport) {
      const { errors, outHealthData } = this.calculateHealth(report);
      allErrors.push(...errors);
      report.total = outHealthData.total;
      report.meal = outHealthData.meal;
    }

    this.initTrackRecord();

    this.errorMsg.set('*** Calculation of calories and fat is completed');
    this.errCalcCalFat.set(allErrors.length
        ? `*** ${allErrors.length} error(s) found while calculating calories and fat`
        : '');
    this.TheSelectDisplays = new FormGroup({
        calculCalories: new FormControl<'Y' | 'N'>('N', { nonNullable: true }),
        // ...
      });
    //this.selectDisplays.controls.calculCalories.setValue('N');
  }

  private calculateHealth(report: DailyReport): HealthResult {
  return this.calculator.calculate(report, this.ConfigCaloriesFat, this.ConvertUnit);
}
/*
  unlockFile(iWait:number){
    //this.resetSignal();
    this.tabLock[iWait].action="unlock";
    this.triggerFileSystem.update (fs => fs + 1);
    this.openFileAccess.set(true);
  }
    */
  
  SelectDisplay() {
    this.errorMsg.set("");
    if (this.TheSelectDisplays.controls['DisplayAll'].value === 'Y') {
      //this.isDisplayAll = true;
    } else {
      //this.isDisplayAll = false;
    }
  }

SelRadio(event: string): void {
  const flag = event.charAt(0);              // 'Y' | 'N'
  const on = flag === 'Y';
  const id = Number(event.slice(2));

  this.openFileAccess.set(false);
  this.iWaitToRetrieve.length = 0;
  this.errorMsg.set('');
  this.tabSelRadio[id] = flag;

  switch (id) {
    case 3:  this.selHealth(on); break;
    case 4:  this.selCopyFile(on); break;
    case 5:  this.selCalFatMgt(on); break;
    case 6:  if (on) this.selCalculate(); break;
    case 7:  this.selChart(on); break;
    case 8:  this.isConfigHealth.set(on); break;
    case 9:  if (on) this.selReloadChartConfig(); break;
    case 10: this.selCreateHealthFile(on); break;
  }
}

// ---------- one method per radio button ----------

private selHealth(on: boolean): void {
  if (this.initialHealthFileName!=="" && this.initialHealthFileName!==this.identification.fitness.files.fileHealth){
      if (this.tabLock[0].lock === 1) this.unlockFile(0); 
      this.tabSelRadio[10] = 'N';
      this.identification.fitness.files.fileHealth=this.initialHealthFileName;
      this.InHealthAllData = new mainDailyReport;
      this.EventHTTPReceived[0] = false;
      this.iWaitToRetrieve=[];
      this.iWaitToRetrieveFn(0);
      if (this.iWaitToRetrieve[0].accessFS=true) this.triggerFileSystem.update(n => n + 1);
      this.openFileAccess.set(true);
      this.displayHealthAll.set(false);
      return;
  }
    
  if (!on) {
    if (this.tabLock[0].lock === 1) this.unlockFile(0);
    //this.isDisplayAll = false;
    this.displayHealthAll.set(false);
    return;
  }

  if (this.tabSelRadio[10] === 'Y') {          // switch off "create new Health file"
    this.tabSelRadio[10] = 'N';
    this.TheSelectDisplays.controls['CreateNewHealthCheckFile'].setValue('N');
    this.createNewHealth.set(false);
    if (this.tabLock[0].lock === 1) this.unlockFile(0);
  }

  if (this.tabLock[0].lock !== 1 || this.EventHTTPReceived[0] === false) {
    this.lockFile(0);
  }

  //this.isDisplayAll = true;
  this.displayHealthAll.set(this.EventHTTPReceived[0] === true);

  this.queueMissing([1, 3, 2]);
  this.flushReads();
}

private selCopyFile(on: boolean): void {
  
  if (on) {
    const name = this.SpecificForm.controls['FileName'];
    name.setValue(`COPY ${name.value}`);
    this.isCopyFile.set(true);
  } else {this.isCopyFile.set(false)}
}

private selCalFatMgt(on: boolean): void {
  if (on) {
    this.isMgtCaloriesFat = true;
    if (this.tabLock[1].lock !== 1 || this.EventHTTPReceived[1] === false) {
      this.EventHTTPReceived[1] = false;
      this.lockFile(1);
    }
    this.displayCalFat.set(this.EventHTTPReceived[1] === true);

    this.queueMissing([3, 6, 2, 10]);
    this.flushReads();
    return;
  }

  this.isMgtCaloriesFat = false;
  this.displayCalFat.set(false);

  const toUnlock = [1, 6];
  if (this.tabSelRadio[3] === 'N') toUnlock.push(0);

  for (const slot of toUnlock) {
    if (this.tabLock[slot].lock === 1) {
      this.tabLock[slot].action = 'unlock';
      this.iWaitToRetrieveFn(slot);
    }
  }
  if (this.iWaitToRetrieve.length > 0) {
    this.triggerFileSystem.update(n => n + 1);
    this.openFileAccess.set(true);
  }
}

private selCalculate(): void {
  if (this.tabLock[0].lock !== 1 || this.EventHTTPReceived[0] === false) {
    this.EventHTTPReceived[0] = false;
    this.lockFile(0);
  }
  this.queueMissing([1, 2]);

  this.openFileAccess.set(true);
  if (this.iWaitToRetrieve.length > 0) {
    this.triggerReadFile.update(n => n + 1);
    this.triggerCalculateCalFat = true;
  }
  this.processCalculateCalFat();
}

private selChart(on: boolean): void {
  if (!on) {
    this.isDisplayChart = false;
    if (this.tabLock[5].lock === 1 && this.identification.triggerFileSystem.toUpperCase() === 'YES') {
      this.unlockFile(5);
    }
    return;
  }

  this.isDisplayChart = true;
  if (this.tabLock[5].lock !== 1 || this.fileParamChart.data.length === 0 || this.EventHTTPReceived[5] === false) {
    this.EventHTTPReceived[5] = false;
    this.lockFile(5);
  }
  this.queueMissing([0, 4]);
  this.flushReads();
}

private selReloadChartConfig(): void {
  this.tabLock[4].action = '';
  this.iWait = 4;
  this.queueRetrieve(4, false);
  this.triggerReadFile.update(n => n + 1);
  this.openFileAccess.set(true);
}

selCreateHealthFile(on: boolean): void {
  if (on) {
    this.createNewHealth.set(true);
    this.tabSelRadio[3] = 'N';
    //this.isDisplayAll = false;
    this.displayHealthAll.set(false);
    this.TheSelectDisplays.controls['DisplayAll'].setValue('N');
    this.SpecificForm.controls['FileName'].setValue('');
  } else {
    this.createNewHealth .set(false);
    this.TheSelectDisplays.controls['CreateNewHealthCheckFile'].setValue('N');
    this.tabSelRadio[10] = 'N';
  }
}

// ---------- shared helpers ----------

/** Queue one file to retrieve. accessFS is only set when given, so class defaults still apply. */
private queueRetrieve(iWait: number, accessFS?: boolean): void {
  const r = new classRetrieveFile();
  r.iWait = iWait;
  if (accessFS !== undefined) r.accessFS = accessFS;
  this.iWaitToRetrieve.push(r);
}

/** Queue every slot whose file has not been received yet, in the order given. */
private queueMissing(slots: number[]): void {
  for (const slot of slots) {
    if (this.EventHTTPReceived[slot] === false) this.queueRetrieve(slot);
  }
}

lockFile(slot: number): void {
  this.tabLock[slot].action = 'lock';
  this.iWait = slot;
  this.queueRetrieve(slot, true);
}

unlockFile(slot: number): void {
  this.tabLock[slot].action = 'unlock';
  this.iWait = slot;
  this.queueRetrieve(slot, true);
  this.triggerFileSystem.update(n => n + 1);
  this.openFileAccess.set(true);
}

/** Read whatever was queued, if anything. */
private flushReads(): void {
  if (this.iWaitToRetrieve.length > 0) {
    this.triggerReadFile.update(n => n + 1);
    this.openFileAccess.set(true);
  }
}

iWaitToRetrieveFn(iWait:number){
    const theClass=new classRetrieveFile;
    this.iWaitToRetrieve.push(theClass);
    this.iWaitToRetrieve[0].iWait=iWait;
    if (this.identification.triggerFileSystem.toUpperCase()==="YES"){ 
      this.iWaitToRetrieve[0].accessFS=true;    
    } else {
      this.iWaitToRetrieve[0].accessFS=false;
    }     
  }

confirmCreateNewHealthFile(action: string): void {
  if (action !== 'Save') {                      // cancel
    this.createNewHealth.set(false);
    this.TheSelectDisplays.controls['CreateNewHealthCheckFile'].setValue('N');
    //this.isDisplayAll = false;
    this.tabSelRadio[10] = 'N';
    this.EventHTTPReceived[0] = false;
    this.displayHealthAll.set(false);
    return;
  }

  const fileName = (this.SpecificForm.controls['FileName'].value ?? '').trim();
  if (!fileName) {
    this.errorMsg.set('You must provide the name of the new file');
    return;
  }

  const today = convertDate(new Date(), 'yyyy-mm-dd');
  this.TheSelectDisplays.controls['SelectedDate'].setValue(today);

  // build the starter report locally, then attach it once
  const dish = new ClassDish();
  dish.name = 'A';
  const meal = new ClassMeal();
  meal.name = 'Breakfast';
  meal.dish.push(dish);
  const report = new DailyReport();
  report.date = new Date();
  report.meal.push(meal);

  const reports = this.HealthAllData.tabDailyReport;
  reports.splice(0, reports.length, report);    // clear and insert in one call

  this.initTrackRecord();
  this.actionSave = 'createNewHealth';

  const myEvent = new classtheEvent();
  Object.assign(myEvent.checkLock, { iWait: 0, isDataModified: true, isSaveFile: true, iCheck: true });
  myEvent.fileName = fileName;
  myEvent.object = fileName;
  this.processSaveHealth(myEvent);
}

checkLockLimitFn(event: classtheEvent | classCheckLock): void {
  const nbCalls = this.eventLockLimit.nbCalls + 1;

  if ((event as classtheEvent).bucket === undefined) {
    this.eventLockLimit.checkLock = event as classCheckLock;
  } else {
    this.eventLockLimit = event as classtheEvent;
  }

  this.eventLockLimit.iWait = this.eventLockLimit.checkLock.iWait;
  this.eventLockLimit.nbCalls = nbCalls;
  this.openFileAccess.set(true);
  this.isRetrieveFile = true;
}

retrieveRecord(iWait: number): void {
  this.iWait = iWait;
  this.tabLock[iWait].action = 'check&update';

  const request = new classRetrieveFile();
  request.iWait = iWait;
  request.accessFS = iWait === 0 || iWait === 3;
  this.iWaitToRetrieve.splice(0, this.iWaitToRetrieve.length, request);

  this.triggerFileSystem.update(n => n + 1);
  this.triggerReadFile.update(n => n + 1);
  this.isRetrieveFile = true;
  this.openFileAccess.set(true);
}

initTrackRecord(): void {
  this.tabNewRecordAll = this.HealthAllData.tabDailyReport.map((report, i) => {
    const odd = i % 2 !== 0 ? 1 : 0;
    return {
      ngStyle: odd,
      even: odd,
      change: false,
      nb: 0,
      meal: report.meal.map(m => ({ nb: 0, food: m.dish.map(() => ({ nb: 0 })) })),
    };
  });
}

saveParamChart(event: classtheEvent): void {
  const { bucket, fileType, files } = this.identification.fitness;

  this.openFileAccess.set(true);
  this.errorMsg.set('');

  this.fileParamChart.fileType = fileType.myChart;
  this.fileParamChart.updatedAt = strDateTime();

  Object.assign(event, {
    iWait: 5,
    bucket,
    object: event.fileName || files.myChartConfig,
    fileContent: this.fileParamChart,
    saveCalls: event.saveCalls + 1,
  });
  event.checkLock.iCheck = true;

  this.triggerSaveFile.update(n => n + 1);
  this.checkLockLimitFn(event);
}

  SaveCaloriesFat(event: any) {

    this.openFileAccess.set(true);
    this.errorMsg.set("");
    this.isSaveCaloriesFat = true;

    if (event.target.id==='RecipeSave'){
      this.processSaveRecipe(event);
    } else {
      this.processSaveCaloriesFat(event);
    }
    event.checkLock.iCheck=true;
    event.saveCalls++
    this.triggerSaveFile.update (sf => sf + 1)
    this.checkLockLimitFn(event);
  }

  processSaveCaloriesFat(event: any) {
    if (this.ConfigCaloriesFat.fileType === '') {
        this.ConfigCaloriesFat.fileType = this.identification.configFitness.fileType.calories;
      }
      this.ConfigCaloriesFat.updatedAt = strDateTime();
      Object.assign(event, {
      bucket:this.identification.configFitness.bucket,
      object:event.fileName,
      fileContent:this.ConfigCaloriesFat,
      iWait:1
    });
    /*
      event.bucket=this.identification.configFitness.bucket;
      event.object=event.fileName;
      event.fileContent=this.ConfigCaloriesFat;
      event.iWait=1;
      */
  }

  processSaveRecipe(event: any) {

    if (this.fileRecipe.fileType === '') {
        this.fileRecipe.fileType = this.identification.fitness.fileType.recipe;
    }
    this.fileRecipe.updatedAt = strDateTime();
    Object.assign(event, {
      bucket:this.identification.fitness.bucket,
      object:event.fileName,
      fileContent:this.fileRecipe,
      iWait:6
    });
    /*
    event.bucket=this.identification.fitness.bucket;
    event.object=event.fileName;
    event.fileContent=this.fileRecipe;
    event.iWait=6;
    */
  }

  confirmSaveAction:boolean=false;
  actionSave:string="";

  confirmSave(event: any) {
   const { checkLock } = event;

    if (this.tabLock[checkLock.iWait].lock !== 1) return;

    Object.assign(this.eventLockLimit.checkLock, {
      iWait: checkLock.iWait,
      isDataModified: checkLock.isDataModified,
      isSaveFile: checkLock.isSaveFile,
      lastInputAt: event.lastInput,
      iCheck: true,
    });

    this.eventLockLimit.nbCalls++;
  }


saveCopy(): void {
  this.openFileAccess.set(true);          // setting a signal to the same value is a no-op
  this.actionSave = 'saveCopy';

  this.prepareForSave();

  Object.assign(this.eventLockLimit, {
    bucket: this.identification.fitness.bucket,
    object: this.SpecificForm.controls['FileName'].value,
    fileContent: this.HealthAllData,
    iWait: 0,
  });

  this.triggerSaveFile.update(n => n + 1);
}

/** Shared by every save path (saveCopy, the recalculation save, ...). */
private prepareForSave(): void {
  const data = this.HealthAllData;
  data.tabDailyReport.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  if (data.fileType === '') {
    data.fileType = this.identification.fitness.fileType.Health;
  }
  data.updatedAt = strDateTime();
}

  cancelCopy() {
    this.actionSave='';
    this.errorMsg.set("");
    this.isCopyFile.set(false);
    this.TheSelectDisplays.controls['CopyFile'].setValue('N');
  }

  cancelUpdates(iWait:number){
    this.errorMsg.set("");
    if (iWait === 0) {
      this.HealthAllData.tabDailyReport.splice(0, this.HealthAllData.tabDailyReport.length)
      this.HealthAllData = FillHealthAllInOut(this.HealthAllData, this.InHealthAllData);
      this.initTrackRecord();
    } 
    this.signalActionHealth.update (aHealth => aHealth + 1);
  }

  calculateCalFat(event: any){
    const { errors, outHealthData } = calcFatCalories(this.ConfigCaloriesFat, this.HealthAllData.tabDailyReport[event], this.ConvertUnit);
    if (errors.length > 0) {
      this.errorMsg .set(`${errors.length} error(s) detected`);
    } else {
      this.HealthAllData.tabDailyReport[event].total = outHealthData.total;
      this.HealthAllData.tabDailyReport[event].meal = outHealthData.meal;
    }
  }

  processSaveHealth(event: any) {
    if (!this.openFileAccess()){
      this.openFileAccess.set(true);
    }
    this.iWaitToRetrieve.length = 0;          // or splice(0), clearing in place
    this.errorMsg.set('');
    let nbErrors = 0;
    const reports = this.HealthAllData.tabDailyReport;

    reports.forEach((report, i) => {
      const flags = this.tabNewRecordAll[i];

      const isNew =
        flags.nb === 1 ||
        report.meal.some((_, j) =>
          flags.meal[j].nb === 1 ||
          report.meal[j].dish.some((_, k) => flags.meal[j].food[k].nb === 1)
        );
      if (!isNew) return;
        const { errors, outHealthData } = calcFatCalories(this.ConfigCaloriesFat, report, this.ConvertUnit);
        nbErrors += errors.length;
        if (errors.length === 0) {
          report.total = outHealthData.total;
          report.meal = outHealthData.meal;
        }
    });
    if (nbErrors > 0) {
      this.errorMsg.set(`${nbErrors} error(s) detected`);
    }
    reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (this.HealthAllData.fileType === '') {
      this.HealthAllData.fileType = this.identification.fitness.fileType.Health;
    }
    this.HealthAllData.updatedAt = strDateTime();

    event.bucket=this.identification.fitness.bucket;
    event.object=event.fileName;
    event.fileContent=this.HealthAllData;
    event.iWait=0;
    event.saveCalls++

    this.triggerSaveFile.update(sf => sf + 1)
    this.checkLockLimitFn(event);
  }

  @HostListener('window:unload', ['$event'])
  unloadHandler(event: any) {
    this.ngOnDestroy();
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: any) {
    this.ngOnDestroy();
  }
  
  ngOnDestroy() {
    this.passDestroy++
    //this.identification.fitness.files.fileHealth=this.initialHealthFileName;
    console.log('trigger ngOnDestroy  === pass=' + this.passDestroy);
    if (this.processDestroy === false) {
      this.processDestroy = true;
      var trouve = false;
      for (var i=0; i<this.tabLock.length; i++){
        if (this.tabLock[i].action!==''){
          this.tabLock[i].lock = 1;
        }
      }
      for (var i = 0; i < this.tabLock.length && trouve === false; i++) {
        if (this.tabLock[i].lock === 1) {
          trouve = true;
          this.tabLock[0].action = 'onDestroy';
          this.ManageGoogleService.onFileSystem(this.configServer, this.configServer.bucketFileSystem, 'fileSystem', this.tabLock, this.iWait.toString())
          .subscribe(
            data => {
              console.log('ngOnDestroy: successfull return from File System' );
            },
            err=>{
              console.log('ngOnDestroy: error from File System. Status=' + JSON.stringify(err))
            })
        }
      }
      for (var i=0; i<this.tabLock.length; i++){
        this.tabLock[i].lock = 3;
        this.tabLock[i].action = "";
      }
    }
  }


  LogMsgConsole(msg: string) {
    if (this.myConsole.length > 40) {
      //this.SaveNewRecord('logconsole', 'ConsoleLog.json', this.myLogConsole, -1);
    }
    this.SaveConsoleFinished = false;

    this.myLogConsole = true;
    msginLogConsole(msg, this.myConsole, this.myLogConsole, this.SaveConsoleFinished, this.HTTP_Address, this.type);
  }


}
