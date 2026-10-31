import { Component, signal, Output, Input, EventEmitter, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { RoutingAppComponent } from '../routing-app/routing-app.component';
import { SelectServerComponent } from '../select-server/select-server.component';

import { FitnessStatComponent } from '../Health/fitness-stat/fitness-stat.component';
import { MainHealthComponent } from '../Health/main-health/main-health.component';
import { ConverterComponent } from '../converter/converter.component';
import { RecipeComponent } from '../recipe/recipe.component';
import { TestServerJSComponent } from '../test-server-js/test-server-js.component';

import { ManagePointOfRefComponent } from '../Sport/manage-point-of-ref/manage-point-of-ref.component';
import { ManageCircuitsComponent } from '../Sport/manage-circuits/manage-circuits.component';
import { SportReportsComponent } from '../Sport/sport-reports/sport-reports.component';
import { SportAnalysisComponent } from '../Sport/sport-analysis/sport-analysis.component';
import { SportPerfRawDataMgtComponent } from '../Sport/sport-perf-raw-data-mgt/sport-perf-raw-data-mgt.component';
import { SportPerformanceComponent } from '../Sport/sport-performance/sport-performance.component';
import { RunningClockComponent } from '../Health/running-clock/running-clock.component';
import { MyCanvasComponent } from '../my-canvas/my-canvas.component';
import { Event27AugComponent } from '../Special-Services/Event-27AUG2022.component';
import { GetImagesComponent } from '../Special-Services/GetImages.component';
import { DictionaryComponent } from '../dictionary/dictionary.component';

import { LoginIdentif, configServer, EventAug, classCredentials, classDicoRecord } from '../JsonServerClass';
import { mainConvItem } from '../ClassConverter';
import { classAccessFile } from '../classFileSystem';
import { classPosSizeClock } from '../clockFunctions';

export class classTabApps {
  apps: string = "";
  select: number = 0;
  display: boolean = false;
}

interface ServerEvent {
  google: string;
  mongo: string;
  fileSystem: string;
}

type ServerEmit = 'Google' | 'Mongo' | 'FS';

// Static data: built once, not on every component instantiation.
const APP_DEFINITIONS: ReadonlyArray<{ apps: string; select: number }> = [
  { apps: "General", select: 0 },
  { apps: "Crypto", select: 6 },
  { apps: "Fitness", select: 24 },
  { apps: "Health", select: 0 },
  { apps: "Recipe", select: 14 },
  { apps: "Dictionary", select: 15 },
  { apps: "Canvas", select: 27 },
  { apps: "ConvFn", select: 10 },
  { apps: "UserInfo", select: 0 },
  { apps: "Config", select: 0 },
  { apps: "Photo", select: 25 },
  { apps: "Sport", select: 0 },
  { apps: "fileMgt", select: 0 },
  { apps: "caloriesMgt", select: 11 },
  { apps: "adminServer", select: 16 },
  { apps: "tutorials", select: 17 },
  { apps: "27Aug2022", select: 26 },
  { apps: "manageCUSS", select: 29 }
];

// select value -> health function (replaces the if/else chain)
const HEALTH_FUNCTION_BY_SELECT: Readonly<Record<number, number>> = { 11: 5, 12: 3, 13: 7 };
const SERVER_TEST_BY_SELECT: Readonly<Record<number, string>> = { 16: 'server', 17: 'tutorials' };

@Component({
  selector: 'app-user-functions',
  templateUrl: './user-functions.component.html',
  styleUrls: ['./user-functions.component.css'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RoutingAppComponent, SelectServerComponent, MainHealthComponent,
    ConverterComponent, RecipeComponent, TestServerJSComponent, ManageCircuitsComponent, ManagePointOfRefComponent,
    SportPerformanceComponent, SportReportsComponent, SportAnalysisComponent, SportPerfRawDataMgtComponent,
    FitnessStatComponent, RunningClockComponent, MyCanvasComponent, Event27AugComponent, GetImagesComponent,
    DictionaryComponent
  ],
})
export class UserFunctionsComponent implements OnInit {

  @Input() identification = new LoginIdentif();
  @Input() configServer = new configServer();
  @Input() credentials = new classCredentials();
  @Input() credentialsMongo = new classCredentials();
  @Input() credentialsFS = new classCredentials();
  @Input() configServerChanges: number = 0;
  isConfigServerChanges = signal<number>(-1);

  @Input() LoginTable_User_Data: Array<EventAug> = [];
  @Input() LoginTable_DecryptPSW: Array<string> = [];

  @Input() ConvToDisplay = new mainConvItem();

  @Input() devMode: string = "";

  @Output() serverChange = new EventEmitter<ServerEmit>();
  @Output() callUserFunction = new EventEmitter<boolean>();

  posSizeClock = new classPosSizeClock();

  dicoRecord: Array<classDicoRecord> = [];

  tabLock: Array<classAccessFile> = []; // 0=unlocked; 1=locked by user; 2=locked by other user; 3=must be checked
  maxEventHTTPrequest: number = 12;

  convertOnly: boolean = true;

  selectApps: number = 0;
  dictionaryOnly: boolean = false;
  selHealthFunction: number = 0;

  inputSelect: number = 0;
  isAppsSelected: boolean = false;

  isResetServer: boolean = false;
  isIdRetrieved: boolean = true;
  isConfigServerRetrieved: boolean = true;
  isCredentials: boolean = true;

  isInitTabLock: boolean = false;

  tabApps: Array<classTabApps> = [];
  nbAppsToDisplay: number = 0;

  errMsg: string = "";
  serverTest: string = "";

  ngOnInit(): void {
    this.initTabLock();
    this.initTabApps();

    // Replaces the nested loop with an empty body: O(n) lookup via Set,
    // and no double counting if the user's app list contains duplicates.
    const allowed = new Set(this.identification.apps);
    const showAll = this.identification.apps[0] === "All";
    const visible: classTabApps[] = [];

    for (const app of this.tabApps) {
      app.display = showAll || allowed.has(app.apps);
      if (app.display) visible.push(app);
    }
    this.nbAppsToDisplay = visible.length;

    if (visible.length === 1 && visible[0].select !== 0) {
      this.isAppsSelected = true;
      this.selectApps = visible[0].select;
    } else if (visible.length === 0) {
      this.errMsg = "This user cannot access any application; update the user file";
    }

    Object.assign(this.posSizeClock, {
      margLeft: 20,
      margTop: 20,
      width: 60,
      height: 60,
      displayAnalog: true,
      displayDigital: true
    });
    this.isInitTabLock = true;
  }

  initTabApps(): void {
    this.tabApps = APP_DEFINITIONS.map(({ apps, select }) => {
      const tab = new classTabApps();
      tab.apps = apps;
      tab.select = select;
      tab.display = false;
      return tab;
    });
  }

  onInput(event: Event): void {
    this.inputSelect = Number((event.target as HTMLSelectElement | HTMLInputElement).value);
    this.initTabLock();
    this.selectApps = 0;
    this.selHealthFunction = 0;
    this.dictionaryOnly = false;
    this.isAppsSelected = false;
  }

  onSelectApps(): void {
    const sel = this.inputSelect;
    this.isAppsSelected = true;
    this.selectApps = sel;

    if (sel === 1) this.callUserFunction.emit(false);

    if (sel in SERVER_TEST_BY_SELECT) this.serverTest = SERVER_TEST_BY_SELECT[sel];
    if (sel === 15) this.dictionaryOnly = true;

    // Note: original left selHealthFunction untouched for 15/16/17; onInput already resets it to 0.
    this.selHealthFunction = HEALTH_FUNCTION_BY_SELECT[sel] ?? 0;
  }

  initTabLock(): void {
    if (this.tabLock.length !== 0) return;

    const { identification, configServer, credentialsFS, maxEventHTTPrequest } = this;
    const lock = identification.triggerFileSystem === "No" ? 1 : 3;

    this.tabLock = Array.from({ length: maxEventHTTPrequest }, (_, i) => {
      const item = new classAccessFile();
      item.lock = lock;
      item.user = identification.UserId;
      item.iWait = i;
      item.timeoutFileSystem = { ...configServer.timeoutFileSystem }; // copy: avoid shared reference
      item.IpAddress = configServer.IpAddress;
      item.userServerId = credentialsFS.userServerId;
      item.credentialDate = credentialsFS.creationDate;
      return item;
    });

    const fitnessBucket = identification.fitness?.bucket;
    const fitnessFiles = identification.fitness?.files;
    const cfgBucket = identification.configFitness?.bucket;
    const cfgFiles = identification.configFitness?.files;

    const fileMappings = [
      { bucket: fitnessBucket, file: fitnessFiles?.fileHealth },
      { bucket: fitnessBucket, file: fitnessFiles?.recipe },
      { bucket: fitnessBucket, file: fitnessFiles?.myChartConfig },
      { bucket: cfgBucket, file: cfgFiles?.calories },
      { bucket: cfgBucket, file: cfgFiles?.convertUnit },
      { bucket: cfgBucket, file: cfgFiles?.confHTML },
      { bucket: cfgBucket, file: cfgFiles?.confChart },
      { bucket: cfgBucket, file: cfgFiles?.convToDisplay }
    ];

    fileMappings.forEach(({ bucket, file }, index) => {
      const item = this.tabLock[index];
      if (item && file) {
        item.bucket = bucket;
        item.object = file;
        item.objectName = file;
      }
    });
  }

  getServerNames(event: ServerEvent): void {
    const serverMappings = [
      { key: 'googleServer', eventVal: event.google, emitVal: 'Google' },
      { key: 'mongoServer', eventVal: event.mongo, emitVal: 'Mongo' },
      { key: 'fileSystemServer', eventVal: event.fileSystem, emitVal: 'FS' }
    ] as const;

    for (const { key, eventVal, emitVal } of serverMappings) {
      if (this.configServer[key] !== eventVal) {
        this.configServer[key] = eventVal;
        this.serverChange.emit(emitVal);
      }
    }

    this.selectApps = 0;
    this.configServerChanges++;
    this.isConfigServerChanges.update(prev => prev + 1);
  }

  // Unused stubs: remove if the template doesn't bind them.
  returnDicoFile(dico: any): void {}
  fnResetServer(event: any): void {}
  fnNewCredentials(credentials: any): void {}
}
