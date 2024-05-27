import {
  Component, OnInit, Input, Output, ViewChild, HostListener, HostBinding, ChangeDetectionStrategy,
  SimpleChanges, EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID
} from '@angular/core';

import { DatePipe, formatDate, ViewportScroller } from '@angular/common';

//import  { Color, Label } from 'ng2-charts';
import {
  Chart, ChartOptions, ChartType, ChartConfiguration, PluginChartOptions, ScaleChartOptions, ChartDataset,
  BarController, BarElement, CategoryScale, ChartData, LinearScale, LineController, LineElement, PointElement,
} from 'chart.js/auto';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormGroup, FormControl, UntypedFormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { Observable } from 'rxjs';


// configServer is needed to use ManageGoogleService
// it is stored in MongoDB and accessed via ManageMongoDBService


import { environment } from 'src/environments/environment';

import { classPosDiv, getPosDiv } from '../../getPosDiv';

import { manage_input } from '../../manageinput';
import { eventoutput, thedateformat } from '../../apt_code_name';
import { msginLogConsole } from '../../consoleLog';

import { mainClassCaloriesFat, mainDailyReport } from '../ClassHealthCalories';
import { mainConvItem, mainRecordConvert, mainClassUnit, mainClassConv } from '../../ClassConverter';
import { classConfigChart, classchartHealth } from '../classConfigChart';
import { classPosSlider } from '../../JsonServerClass';

import { configServer, LoginIdentif, msgConsole, classtheEvent } from '../../JsonServerClass';
import { ManageMongoDBService } from 'src/app/CloudServices/ManageMongoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { AccessConfigService } from 'src/app/CloudServices/access-config.service';
import { classAxis, classLegendChart, classPluginTitle, classTabFormChart, classFileParamChart, classReturnColor } from '../classChart';
import { classFileSystem, classAccessFile, classReturnDataFS, classHeaderReturnDataFS } from '../../classFileSystem';
import { fnAddTime, addMonthDay, convertDate, strDateTime, fnCheckTimeOut, defineMyDate, formatDateInSeconds, formatDateInMilliSeconds, findIds } from '../../MyStdFunctions';
import { drawNumbers, drawHourHand, drawMinuteHand, drawSecondHand, classPosSizeClock} from '../../clockFunctions'

import { buildBarChartDataSet,buildLineChartDataSet, specialDraw } from '../../manageChartFn';
import { fillHealthDataSet } from '../../fillChartData'
@Component({
  selector: 'app-report-health',
  templateUrl: './report-health.component.html',
  styleUrls: ['./report-health.component.css']
})

export class ReportHealthComponent implements OnInit {

  SelChartForm: FormGroup;
  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageMongoDBService: ManageMongoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    @Inject(LOCALE_ID) private locale: string,
  ) {
    this.SelChartForm = this.fb.group({
      //title: new FormControl(''),
      selectedItems: this.fb.array([]),
    })
  }

  get ListChart() {
    return this.SelChartForm.controls["selectedItems"] as FormArray;
  }

  FormChart(): FormGroup {
    return this.fb.group({
      selected: new FormControl('N', { nonNullable: true })
    })
  }
  FillSelected = { 'selected': '' };

  @Input() identification = new LoginIdentif;
  @Input() HealthAllData = new mainDailyReport;
  @Input() ConfigChartHealth = new classchartHealth;
  @Input() inFileParamChart = new classFileParamChart;
  @Input() configServer = new configServer;

  @Input() triggerCheckToLimit:number=9000;

  //inData=new classAccessFile;
  //@Input() tabLock = new classAccessFile; //.lock ++> 0=unlocked; 1=locked by user; 2=locked by other user; 3=must be checked;
  @Input() tabLock: Array<classAccessFile> = [];
  @Input() returnDataFSParamChart = new classHeaderReturnDataFS;
  @Input() actionParamChart:number = 0;
  @Input() resultCheckLimitParamChart:number = 0;
  @Input() statusSaveFn:any;
  //@Input() callSaveFn:any;

  posSlider = new classPosSlider;
  posPalette = new classPosSlider;
  paramChange: number = 0; // used to trigger the change on slider position

  @Output() checkLockLimit = new EventEmitter<any>();
  @Output() processSave = new EventEmitter<any>();
  @Output() retrieveRecord = new EventEmitter<any>();
  @Output() unlockFile = new EventEmitter<any>();
  @Output() cancelUpdates = new EventEmitter<any>();

  @ViewChild('baseChart', { static: true })

  secondaryLevelFn:boolean=true;

isSaveParamChart:boolean=false;
isMustSaveFile:boolean=false;


  // DEBUG
  debugPhone: boolean = false;

  current_Chart: number = 0;
  tabParamChart: Array<classTabFormChart> = []; // working table

  tabCtx: Array<any> = [];
  tabChart: Array<any> = [];
  myTabChart: Array<Chart> = [];

  mainWindow = {
    top: 120,
    left: 20,
  }
  subWindow = {
    top: 20,
    left: 10,
  }

  tabCanvasId: Array<string> = ['canvas1', 'canvas2', 'canvas3', 'canvas4', 'canvas5'];

  //tabofLabels:Array<string>=['Calories burnt', 'Calories intake', 'Cholesterol', 'Saturated fat', 'Total fat', 'Proteins', 'Carbs','Sugar'];
  //tabofExistLabels:Array<boolean>=[true,true,true,true,true,true,true,false]
  tabOfLabelsColor: Array<string> = [];
  tabLabelRgba: Array<any> = [{
    slider: new classReturnColor,
    palette: new classReturnColor,
  }];

  tabOfLimitLabelsColor: Array<string> = [];
  tabLimitLabelRgba: Array<any> = [{
    slider: new classReturnColor,
    palette: new classReturnColor,
  }];

  returnTitleRgba = {
    slider: new classReturnColor,
    palette: new classReturnColor,
  }

  returnLegendRgba = {
    slider: new classReturnColor,
    palette: new classReturnColor,
  }
  returnCanvasRgba = {
    slider: new classReturnColor,
    palette: new classReturnColor,
  }
  returnBoxRgba = {
    slider: new classReturnColor,
    palette: new classReturnColor,
  }

  lineChartType: Array<string> = [];

  tabPeriod = ['daily', 'weekly'];

  paramAllCharts = new FormGroup({
    period: new FormControl({ value: 'daily', disabled: false }, { nonNullable: true }), //daily, weekly
    nbWeeks: new FormControl({ value: 1, disabled: false }, { nonNullable: true }), //nb of weeks if option 'weekly' is defined
    startRange: new FormControl({ value: '', disabled: false }, [
      Validators.required,
      // validates date format yyyy-mm-dd with regular expression
      Validators.pattern(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/)
    ]),
    endRange: new FormControl({ value: '', disabled: false }, [
      Validators.required,
      // validates date format yyyy-mm-dd with regular expression
      Validators.pattern(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/)
    ])
  });

  selectChart: FormGroup = new FormGroup({
    chartType: new FormControl({ value: 'line', disabled: true }, { nonNullable: true }),
    barThickness: new FormControl({ value: 'line', disabled: true }, { nonNullable: true }),
    chartTitle: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    colorChartTitle: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    ratio: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    canvasWidth: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    canvasHeight: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    canvasMarginLeft: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    stackedX: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    stackedY: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    canvasBackground: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    legendTitle: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    colorLegendTitle: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    boxwidth: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    boxheight: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    boxpointStyle: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    boxusePointStyle: new FormControl(false, { nonNullable: true }),
    boxcolor: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    boxfontSize: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    boxradius: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    boxfontWeight: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    boxfontFamily: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    period: new FormControl({ value: '', disabled: true }, { nonNullable: true }), //daily, weekly
    nbWeeks: new FormControl({ value: 1, disabled: true }, { nonNullable: true }), 
    startRange: new FormControl({ value: '', disabled: true }, [
      Validators.required,
      // validates date format yyyy-mm-dd with regular expression
      Validators.pattern(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/)
    ]),
    endRange: new FormControl({ value: '', disabled: true }, [
      Validators.required,
      // validates date format yyyy-mm-dd with regular expression
      Validators.pattern(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/)
    ])
  });



  selectTitle: FormGroup = new FormGroup({
    paddingTop: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    paddingBottom: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    paddingLeft: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    position: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    display: new FormControl(false, { nonNullable: true }),
    text: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    align: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    color: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    paletteRgba: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    paletteXpos: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    paletteYpos: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    sliderRgba: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    sliderXpos: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    sliderYpos: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    fontSize: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    fontWeight: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    family: new FormControl({ value: '', disabled: true }, { nonNullable: true })
  });



  selectAxisX: FormGroup = new FormGroup({
    borderColor: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    borderWidth: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    position: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    stacked: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    ticksColor: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
  });

  selectAxisY: FormGroup = new FormGroup({
    borderColor: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    borderWidth: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    position: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    stacked: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    ticksColor: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
  });


  canvas: Array<any> = [{
    width: '',
    height: '',
    background: '',
    marginLeft: '',
  }];

  overallTab: Array<any> = [
    {
      datasetBar: [],
      labelBar: []
    }
  ]

  overallTabLimit: Array<any> = [
    {
      dataset: [],
      label: []
    }
  ]


  // user by slider and palette
  my_input_child1: string = '';
  my_input_child2: string = '';
  my_output_child1: string = '';
  my_output_child2: string = '';

  selected_canvasColor: string = '';
  selected_legendColor: string = '';
  selected_boxColor: string = '';
  selected_chartTitleColor: string = '';
  selected_colorTitle: string = "";
  selected_XBorderColor: string = "";
  selected_YBorderColor: string = "";
  selected_XTicksColor: string = "";
  selected_YTicksColor: string = "";

  selectedFields: Array<any> = [];
  selectedLimitFields: Array<any> = [];

  isSelectCanvasColor: boolean = false;
  isSelectLegendColor: boolean = false;
  isSelectLChartTitleColor: boolean = false;
  isSelectBoxColor: boolean = false;

  isSelectAxisXBorderColor: boolean = false;
  isSelectAxisXTicksColor: boolean = false;
  isSelectAxisYBorderColor: boolean = false;
  isSelectAxisYTicksColor: boolean = false;

  isTypeSelected: boolean = false;
  isPeriodSelected: boolean = false;
  isTestLineChart: boolean = false;

  isParamTitle: boolean = false;
  isParamLegend: boolean = false;
  isParamAxis: boolean = false;

  isFontWeight: boolean = false;
  isTextAlign: boolean = false;
  isTitlePosition: boolean = false;
  isTitleDisplay: boolean = false;

  isSelectChartTitleColor: boolean = false;

  isSelectXBorderColor: boolean = false;
  isSelectYBorderColor: boolean = false;
  isSelectXTicksColor: boolean = false;
  isSelectYTicksColor: boolean = false;
  isSliderSelected: boolean = false;


  returnXBorderColorRgba = {
    slider: new classReturnColor,
    palette: new classReturnColor,

  };
  returnYBorderColorRgba = {
    slider: new classReturnColor,
    palette: new classReturnColor,

  }
  returnXTicksRgba = {
    slider: new classReturnColor,
    palette: new classReturnColor,

  };
  returnYTicksRgba = {
    slider: new classReturnColor,
    palette: new classReturnColor,

  };
  dialogLabColor: Array<boolean> = [];
  dialogLimitLabColor: Array<boolean> = [];
  currentLabColor: number = 0;
  isSelectLabColor: boolean = false;

  // from color-slider
  returnSlider = {
    rgba: '',
    xPos: 0,
    yPos: 0
  }

  returnPalette = {
    rgba: '',
    xPos: 0,
    yPos: 0
  }
  newtabChart: any;
  newtabCtx: any;

  isPosDivSlider: boolean = false;
  isPosDivSliderTrue: boolean = false;

  posDivPosSlider = new classPosDiv;
  posDivPosSliderTrue = new classPosDiv;

  tabFontWeight: Array<string> = ["cancel", "100", "200", "300", "400", "500", "600", "700", "800", "900", "bold", "bolder", "lighter", "normal"];
  tabTextAlign: Array<string> = ["cancel", "center", "left", "right", "end", "start", "inherit", "initial"];
  tabTitlePosition: Array<string> = ["cancel", "top", "bottom"];
  tabDisplay: Array<boolean> = [false, true];

  eventClientY: number = 0;
  eventPageY: number = 0;

  onInputAction:string="";

  lastInputAt:string="";

  theEvent = new classtheEvent;

  errorTimeOut:string="";
  userActivity:string= "";

  posSizeClock=new classPosSizeClock;
  maxCanvas:number=5;

  SpecificForm = new FormGroup({
    FileName: new FormControl('', { nonNullable: true }),
  })

  isConfirmSaveA:boolean=false;
  IsSaveConfirmed: boolean = false;

  lockValueBeforeCheck:number=0;
  @HostListener('window:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    //this.selectedPosition = { x: event.pageX, y: event.pageY };
    if (this.debugPhone === true) {
      //this.getPosDivPosSliderTrue();
      this.posDivPosSliderTrue = getPosDiv("posDivSliderTrue");
      this.eventClientY = event.clientY;
      this.eventPageY = event.pageY;
    }
  }


  ngAfterViewInit() { // this.ConfigChartHealth.barChart.length     

    for (var i = 0; i < this.tabCanvasId.length; i++) {
      this.tabChart[i] = document.getElementById(this.tabCanvasId[i]);

      this.tabCtx[i] = this.tabChart[i].getContext('2d');
      this.overallTab.push({ datasetBar: [], labelBar: [] });
      this.overallTabLimit.push({ dataset: [], label: [] });
      this.collectSpecialData(i, this.overallTab[i].datasetBar, this.overallTab[i].labelBar, this.overallTabLimit[i].dataset, this.overallTabLimit[i].label);
    }
    

    const event = {
      target: {
        id: 'apply'
      }
    }
    this.forAllCharts(event);
    
  }


  ngOnInit() {
    console.log('===> ngOnInit report-health');


    if (this.debugPhone === true) {
      this.posDivPosSlider = getPosDiv("posDivSlider");
      //this.getPosDivPosSlider();
    }
    var i = 0;
    this.posSlider.VerHor = 'H';
    this.posSlider.top = 5;
    this.posSlider.left = 60;
    this.posSlider.div.left = this.mainWindow.left + this.subWindow.left;
    this.posSlider.div.top = this.mainWindow.top + this.subWindow.top;
    this.posPalette.div.left = this.mainWindow.left + this.subWindow.left;
    this.posPalette.div.top = this.mainWindow.top + this.subWindow.top;
    this.posPalette.top = 0;
    this.posPalette.left = 60;
    for (i = 0; i < this.ConfigChartHealth.barDefault.datasets.labels.length; i++) {

      this.FillSelected.selected = 'N';
      this.ListChart.push(this.FormChart());
      this.ListChart.controls[i].setValue(this.FillSelected);
      this.selectedFields[i] = 'N';
      this.dialogLabColor[i] = false;
      if (i > 0) {
        const myRgba = { slider: new classReturnColor, palette: new classReturnColor }
        this.tabLabelRgba.push(myRgba);
      }
    }

    for (i = 0; i < this.ConfigChartHealth.barDefault.datasets.labelsLimits.length; i++) {

      this.FillSelected.selected = 'N';
      this.ListChart.push(this.FormChart());
      this.ListChart.controls[i + this.ConfigChartHealth.barDefault.datasets.labels.length - 1].setValue(this.FillSelected);

      this.selectedLimitFields[i] = 'N';
      this.dialogLimitLabColor[i] = false;
      if (i > 0) {
        const myRgba = { slider: new classReturnColor, palette: new classReturnColor }
        this.tabLimitLabelRgba.push(myRgba);
      }
    }

    // log which chart types are supported
    for (i = 0; i < this.ConfigChartHealth.chartTypes.length; i++) {
      this.lineChartType[i] = this.ConfigChartHealth.chartTypes[i];
    }

    this.tabParamChart.splice(0, this.tabParamChart.length);

    if (this.inFileParamChart.fileType !== undefined && this.inFileParamChart.fileType !== '') {
      for (i = 0; i < this.inFileParamChart.data.length; i++) {
        const classParam = new classTabFormChart;
        this.tabParamChart.push(classParam);
        this.fillInCharts(this.inFileParamChart.data[i], this.tabParamChart[i]);
        if (this.tabParamChart[i].labels.length === 0) {
          for (var k = 0; k < this.ConfigChartHealth.barDefault.datasets.fieldsToSelect.length; k++) {
            if (this.ConfigChartHealth.barDefault.datasets.fieldsToSelect[k] === false) {
              this.tabParamChart[i].labels[k] = 'N';
            } else {
              this.tabParamChart[i].labels[k] = 'Y';
            }
          }
        }
        for (var j = 0; j < this.tabParamChart[i].labelsColor.length; j++) {
          if (this.tabParamChart[i].labelsColor[j] === undefined || this.tabParamChart[i].labelsColor[j] === "") {
            this.tabParamChart[i].labelsColor[j] = this.ConfigChartHealth.barDefault.datasets.borderColor[j];
          }
        }

        this.fillInFormFromTab(i);
        this.canvas.push({ width: '', height: '', background: 0, marginLeft: '' });
        this.changeCanvas(i);
      }
      for (i = i; i < this.maxCanvas; i++) {
          this.initTabParamCanvas(i);
      }
    } else {
      for (i = 0; i < this.maxCanvas; i++) {
        this.initTabParamCanvas(i);
        
      }

      this.lockValueBeforeCheck=this.tabLock[5].lock;
  
    }

    const theDate = new Date();
    const newDate = addMonthDay(theDate, -1, 0, '-') // minus 1 month
    this.paramAllCharts.controls['startRange'].setValue(newDate);
    for (var nb = 0; nb < this.maxCanvas; nb++) {
      this.tabParamChart[nb].period = this.paramAllCharts.controls['period'].value.toLowerCase().trim();
      this.tabParamChart[nb].nbWeeks = this.paramAllCharts.controls['nbWeeks'].value;
      this.tabParamChart[nb].startRange = newDate;
      this.tabParamChart[nb].endRange = "";

      //this.fillInFormFromTab(nb);

    }

    this.posSizeClock.margLeft = 440;
    this.posSizeClock.margTop = -20;
    this.posSizeClock.width = 60;
    this.posSizeClock.height = 60;
    this.posSizeClock.displayAnalog = false;
    this.posSizeClock.displayDigital = true;

    this.lastInputAt = strDateTime();
    this.refDate=new Date();
    this.callTimeToGo();
    if (this.tabLock[5].lock===1){
      this.enableForm();
    } else {
      this.disableForm();
    }
    

  }
/*
  ngAfterViewChecked(){
    for (var i = 0; i < this.tabCanvasId.length; i++) {
      this.collectSpecialData(i, this.overallTab[i].datasetBar, this.overallTab[i].labelBar, this.overallTabLimit[i].dataset, this.overallTabLimit[i].label);
    }

    const theDate = new Date();
    const newDate = addMonthDay(theDate, -1, 0, '-') // minus 1 month
    this.paramAllCharts.controls['startRange'].setValue(newDate);
    const event = {
      target: {
        id: 'apply'
      }
    }
    this.forAllCharts(event);

  }

*/

  //isSaveFile:boolean=false;
  isDataModified:boolean=false;
  isUserTimeOut:boolean=false;
  refDate=new Date();
  displaySec:number=0;
  displayMin:number=0;
  displayHour:number=0;
  idAnimation:any;

  openFileAccess:boolean=false;

  timeOutactivity(iWait: number, isDataModified: boolean, isSaveFile: boolean,theAction:string){
      window.cancelAnimationFrame(this.idAnimation);
      this.callTimeToGo();
      this.refDate=new Date();
      this.lastInputAt = strDateTime();
      if (theAction==="only"){
        this.openFileAccess=true;
        this.theEvent.checkLock.action='checkTO';
        this.theEvent.checkLock.iWait=iWait;
        this.theEvent.checkLock.isDataModified=isDataModified;
        this.theEvent.checkLock.isSaveFile=isSaveFile;
        this.theEvent.checkLock.iCheck=true;
        this.theEvent.checkLock.lastInputAt=this.lastInputAt;
        this.theEvent.checkLock.nbCalls++;
        this.triggerCheckToLimit++
        this.lockValueBeforeCheck=this.tabLock[5].lock;
        //this.checkLockLimit.emit({iWait:iWait,isDataModified:isDataModified,isSaveFile:isSaveFile, lastInputAt:this.lastInputAt, iCheck:true,nbCalls:0,action:theAction});
      }
    }

  callTimeToGo(){
    const currSeconds=this.refDate.getSeconds() ;
    const currMinutes=this.refDate.getMinutes();
    const currHour=this.refDate.getHours();
    const currentDateSec = currHour*3600+currMinutes*60+currSeconds;
    this.timeToGo(currentDateSec,this.configServer.timeoutFileSystem.userTimeOut.hh * 3600 +this.configServer.timeoutFileSystem.userTimeOut.mn * 60 + this.configServer.timeoutFileSystem.userTimeOut.ss);
    
  }

  timeToGo(refDateSec:any, timeOutSec:any){
    // nb of seconds before timeout is reached
    const theDate=new Date();
    const currentDateSec = theDate.getHours()*3600+theDate.getMinutes()*60+theDate.getSeconds();
    const timeSpent = Number(currentDateSec) - Number(refDateSec);
    const timeLeft= timeOutSec - timeSpent;

    if (timeLeft <= 0 ){
        window.cancelAnimationFrame(this.idAnimation);
        this.isUserTimeOut=true;
        this.unlockFile.emit(5);
        //this.isSaveFile=false;
        this.isDataModified=false;
        this.resetBooleans();
    } else {
        this.displayHour = Math.floor(timeLeft / 3600);
        const minSec = timeLeft % 3600 ;
        this.displayMin = Math.floor(minSec / 60);
        this.displaySec = minSec % 60 ;
        this.idAnimation=window.requestAnimationFrame(() => this.timeToGo(refDateSec,timeOutSec));
    }
  }

  enableForm() {
    this.selectChart.get('chartType')?.enable();
    this.selectChart.get('barThickness')?.enable();
    this.selectChart.get('chartTitle')?.enable();
    this.selectChart.get('colorChartTitle')?.enable();
    this.selectChart.get('ratio')?.enable();
    this.selectChart.get('canvasWidth')?.enable();
    this.selectChart.get('canvasHeight')?.enable();
    this.selectChart.get('canvasMarginLeft')?.enable();
    this.selectChart.get('stackedX')?.enable();
    this.selectChart.get('stackedY')?.enable();
    this.selectChart.get('canvasBackground')?.enable();
    this.selectChart.get('legendTitle')?.enable();
    this.selectChart.get('colorLegendTitle')?.enable();
    this.selectChart.get('boxwidth')?.enable();
    this.selectChart.get('boxheight')?.enable();
    this.selectChart.get('boxpointStyle')?.enable();
    this.selectChart.get('boxusePointStyle')?.enable();
    this.selectChart.get('boxcolor')?.enable();
    this.selectChart.get('boxfontSize')?.enable();
    this.selectChart.get('boxradius')?.enable();
    this.selectChart.get('boxfontWeight')?.enable();
    this.selectChart.get('boxfontFamily')?.enable();
    this.selectChart.get('period')?.enable();
    this.selectChart.get('nbWeeks')?.enable();
    this.selectChart.get('startRange')?.enable();
    this.selectChart.get('endRange')?.enable();

    this.selectTitle.get('paddingTop')?.enable();
    this.selectTitle.get('paddingBottom')?.enable();
    this.selectTitle.get('paddingLeft')?.enable();
    this.selectTitle.get('position')?.enable();
    this.selectTitle.get('display')?.enable();
    this.selectTitle.get('text')?.enable();
    this.selectTitle.get('align')?.enable();
    this.selectTitle.get('color')?.enable();
    this.selectTitle.get('paletteRgba')?.enable();
    this.selectTitle.get('paletteXpos')?.enable();
    this.selectTitle.get('paletteYpos')?.enable();
    this.selectTitle.get('sliderRgba')?.enable();
    this.selectTitle.get('sliderXpos')?.enable();
    this.selectTitle.get('sliderYpos')?.enable();
    this.selectTitle.get('fontSize')?.enable();
    this.selectTitle.get('fontWeight')?.enable();
    this.selectTitle.get('family')?.enable();

    this.selectAxisX.get('borderColor')?.enable();
    this.selectAxisX.get('borderWidth')?.enable();
    this.selectAxisX.get('position')?.enable();
    this.selectAxisX.get('stacked')?.enable();
    this.selectAxisX.get('ticksColor')?.enable();

    this.selectAxisY.get('borderColor')?.enable();
    this.selectAxisY.get('borderWidth')?.enable();
    this.selectAxisY.get('position')?.enable();
    this.selectAxisY.get('stacked')?.enable();
    this.selectAxisY.get('ticksColor')?.enable();
  }


  disableForm() {
    this.selectChart.get('chartType')?.disable();
    this.selectChart.get('barThickness')?.disable();
    this.selectChart.get('chartTitle')?.disable();
    this.selectChart.get('colorChartTitle')?.disable();
    this.selectChart.get('ratio')?.disable();
    this.selectChart.get('canvasWidth')?.disable();
    this.selectChart.get('canvasHeight')?.disable();
    this.selectChart.get('canvasMarginLeft')?.disable();
    this.selectChart.get('stackedX')?.disable();
    this.selectChart.get('stackedY')?.disable();
    this.selectChart.get('canvasBackground')?.disable();
    this.selectChart.get('legendTitle')?.disable();
    this.selectChart.get('colorLegendTitle')?.disable();
    this.selectChart.get('boxwidth')?.disable();
    this.selectChart.get('boxheight')?.disable();
    this.selectChart.get('boxpointStyle')?.disable();
    this.selectChart.get('boxusePointStyle')?.disable();
    this.selectChart.get('boxcolor')?.disable();
    this.selectChart.get('boxfontSize')?.disable();
    this.selectChart.get('boxradius')?.disable();
    this.selectChart.get('boxfontWeight')?.disable();
    this.selectChart.get('boxfontFamily')?.disable();
    this.selectChart.get('period')?.disable();
    this.selectChart.get('nbWeeks')?.disable();
    this.selectChart.get('startRange')?.disable();
    this.selectChart.get('endRange')?.disable();

    this.selectTitle.get('paddingTop')?.disable();
    this.selectTitle.get('paddingBottom')?.disable();
    this.selectTitle.get('paddingLeft')?.disable();
    this.selectTitle.get('position')?.disable();
    this.selectTitle.get('display')?.disable();
    this.selectTitle.get('text')?.disable();
    this.selectTitle.get('align')?.disable();
    this.selectTitle.get('color')?.disable();
    this.selectTitle.get('paletteRgba')?.disable();
    this.selectTitle.get('paletteXpos')?.disable();
    this.selectTitle.get('paletteYpos')?.disable();
    this.selectTitle.get('sliderRgba')?.disable();
    this.selectTitle.get('sliderXpos')?.disable();
    this.selectTitle.get('sliderYpos')?.disable();
    this.selectTitle.get('fontSize')?.disable();
    this.selectTitle.get('fontWeight')?.disable();
    this.selectTitle.get('family')?.disable();

    this.selectAxisX.get('borderColor')?.disable();
    this.selectAxisX.get('borderWidth')?.disable();
    this.selectAxisX.get('position')?.disable();
    this.selectAxisX.get('stacked')?.disable();
    this.selectAxisX.get('ticksColor')?.disable();

    this.selectAxisY.get('borderColor')?.disable();
    this.selectAxisY.get('borderWidth')?.disable();
    this.selectAxisY.get('position')?.disable();
    this.selectAxisY.get('stacked')?.disable();
    this.selectAxisY.get('ticksColor')?.disable();
  }

  changeCanvas(i: number) {
    if (this.tabParamChart[i].canvasHeight !== 0) {
      this.canvas[i].height = this.tabParamChart[i].canvasHeight;
    } else {
      this.canvas[i].height = this.ConfigChartHealth.barDefault.canvas.maxHeight;
    }
    if (this.tabParamChart[i].canvasWidth !== 0) {
      this.canvas[i].width = this.tabParamChart[i].canvasWidth;
    } else {
      this.canvas[i].width = this.ConfigChartHealth.barDefault.canvas.maxWidth;
    }
    if (this.tabParamChart[i].canvasBackground !== '') {
      this.canvas[i].background = this.tabParamChart[i].canvasBackground;
    } else {
      this.canvas[i].background = this.ConfigChartHealth.barDefault.canvas.backgroundcolor;
    }
    if (this.tabParamChart[i].canvasMarginLeft !== 0) {
      this.canvas[i].marginLeft = this.tabParamChart[i].canvasMarginLeft;
    } else {
      this.canvas[i].marginLeft = this.ConfigChartHealth.barDefault.canvas.marginleft;
    }
  }

  forAllCharts(event: any) {
    if (event.target.id === "clear") {
      this.paramAllCharts.controls['period'].setValue(this.tabPeriod[0]);
      this.paramAllCharts.controls['nbWeeks'].setValue(0);
      const theDate = new Date();
      const newDate = addMonthDay(theDate, -1, 0, '-') // minus 1 month
      this.paramAllCharts.controls['startRange'].setValue(newDate);
      this.paramAllCharts.controls['endRange'].setValue('');

    } else if (event.target.id === "apply") {
      for (var nb = 0; nb < this.maxCanvas; nb++) {
        this.tabParamChart[nb].period = this.paramAllCharts.controls['period'].value.toLowerCase().trim();
        this.tabParamChart[nb].nbWeeks = this.paramAllCharts.controls['nbWeeks'].value;
        if (this.paramAllCharts.controls['startRange'].value !== null) {
          this.tabParamChart[nb].startRange = this.paramAllCharts.controls['startRange'].value;
        }
        if (this.paramAllCharts.controls['endRange'].value !== null) {
          this.tabParamChart[nb].endRange = this.paramAllCharts.controls['endRange'].value;
        }
        this.fillInFormFromTab(nb);
        this.buildChart(nb);
      }
    }
  }

  selectedChart: number = 0;
  SelChart(event: any) {
    this.timeOutactivity(5, true, false,"only");

    if (this.selectedChart !== 0) {

      this.selected_canvasColor = '';
      this.selected_legendColor = '';
      this.selected_boxColor = '';
      this.selected_chartTitleColor = '';
      this.selected_colorTitle = "";
      this.fillInTabOfCharts(this.selectedChart - 1);

    }
    if (event.target.id === 'Chart1') {
      this.selectedChart = 1;
    } else if (event.target.id === 'Chart2') {
      this.selectedChart = 2;
    } else if (event.target.id === 'Chart3') {
      this.selectedChart = 3;
    } else if (event.target.id === 'Chart4') {
      this.selectedChart = 4;
    } else if (event.target.id === 'Chart5') {
      this.selectedChart = 5;
    }
    this.fillInFormFromTab(this.selectedChart - 1);
    if (this.debugPhone === true) {
      this.posDivPosSlider = getPosDiv("posDivSlider");
      //this.getPosDivPosSlider();
    }
  }

  cancelChartParam(event: any) {
    this.timeOutactivity(5, true, false,"only");
    if (event.target.id === "allChartParam") {
      this.selectedChart = 0;
      this.isParamTitle = false;
      this.isParamLegend = false;
      this.isParamAxis = false;
      this.isParamTitle = false;
      this.isParamLegend = false;
      this.isParamAxis = false;
      this.resetBooleans();

    } else if (event.target.id === "chartTitle") {
      this.isParamTitle = false;
      this.isParamLegend = false;
    } else if (event.target.id === "axis") {
      this.isParamAxis = false;
    }
  }

  processAxis(event: any) {
    this.timeOutactivity(5, true, false,"only");
    this.isParamAxis = false;
    if (this.selectAxisX.controls['stacked'].value === 'false') {
      this.tabParamChart[this.selectedChart - 1].axisX.stacked = false;
    } else {
      this.tabParamChart[this.selectedChart - 1].axisX.stacked = true;
    }
    if (this.selectAxisY.controls['stacked'].value === 'false') {
      this.tabParamChart[this.selectedChart - 1].axisY.stacked = false;
    } else {
      this.tabParamChart[this.selectedChart - 1].axisY.stacked = true;
    }

    this.selectChart.controls['stackedX'].setValue(this.tabParamChart[this.selectedChart - 1].axisX.stacked);
    this.selectChart.controls['stackedY'].setValue(this.tabParamChart[this.selectedChart - 1].axisY.stacked);
  }


  initTabParamCanvas(i:number){
    const classParam = new classTabFormChart;
    this.tabParamChart.push(classParam);
    this.tabParamChart[this.tabParamChart.length - 1].chartType = 'line';

    this.tabParamChart[this.tabParamChart.length - 1].chartTitle.display = this.ConfigChartHealth.barDefault.options.plugins.title.display;
    this.tabParamChart[this.tabParamChart.length - 1].chartTitle.text = this.ConfigChartHealth.barDefault.options.plugins.title.text;
    this.tabParamChart[this.tabParamChart.length - 1].chartTitle.position = this.ConfigChartHealth.barDefault.options.plugins.title.position;
    this.tabParamChart[this.tabParamChart.length - 1].chartTitle.padding.top = this.ConfigChartHealth.barDefault.options.plugins.title.padding.top;
    this.tabParamChart[this.tabParamChart.length - 1].chartTitle.padding.bottom = this.ConfigChartHealth.barDefault.options.plugins.title.padding.bottom;
    this.tabParamChart[this.tabParamChart.length - 1].chartTitle.align = this.ConfigChartHealth.barDefault.options.plugins.title.align;
    this.tabParamChart[this.tabParamChart.length - 1].chartTitle.color = this.ConfigChartHealth.barDefault.options.plugins.title.color;
    this.tabParamChart[this.tabParamChart.length - 1].chartTitle.font.size = this.ConfigChartHealth.barDefault.options.plugins.title.font.size;
    this.tabParamChart[this.tabParamChart.length - 1].chartTitle.font.weight = this.ConfigChartHealth.barDefault.options.plugins.title.font.weight;
    this.tabParamChart[this.tabParamChart.length - 1].chartTitle.font.family = this.ConfigChartHealth.barDefault.options.plugins.title.font.family;

    this.tabParamChart[this.tabParamChart.length - 1].legendTitle.display = this.ConfigChartHealth.barDefault.options.plugins.legend.title.display;
    this.tabParamChart[this.tabParamChart.length - 1].legendTitle.text = this.ConfigChartHealth.barDefault.options.plugins.legend.title.text;
    this.tabParamChart[this.tabParamChart.length - 1].legendTitle.position = this.ConfigChartHealth.barDefault.options.plugins.legend.title.position;
    this.tabParamChart[this.tabParamChart.length - 1].legendTitle.padding.top = this.ConfigChartHealth.barDefault.options.plugins.legend.title.padding.top;
    this.tabParamChart[this.tabParamChart.length - 1].legendTitle.padding.bottom = this.ConfigChartHealth.barDefault.options.plugins.legend.title.padding.bottom;
    this.tabParamChart[this.tabParamChart.length - 1].legendTitle.padding.left = this.ConfigChartHealth.barDefault.options.plugins.legend.title.padding.left;
    this.tabParamChart[this.tabParamChart.length - 1].legendTitle.align = this.ConfigChartHealth.barDefault.options.plugins.legend.title.align;
    this.tabParamChart[this.tabParamChart.length - 1].legendTitle.color = this.ConfigChartHealth.barDefault.options.plugins.legend.title.color;
    this.tabParamChart[this.tabParamChart.length - 1].legendTitle.font.size = this.ConfigChartHealth.barDefault.options.plugins.legend.title.font.size;
    this.tabParamChart[this.tabParamChart.length - 1].legendTitle.font.weight = this.ConfigChartHealth.barDefault.options.plugins.legend.title.font.weight;
    this.tabParamChart[this.tabParamChart.length - 1].legendTitle.font.family = this.ConfigChartHealth.barDefault.options.plugins.legend.title.font.family;

    this.tabParamChart[this.tabParamChart.length - 1].legendBox.boxWidth = this.ConfigChartHealth.barDefault.options.plugins.legend.labels.boxWidth;
    this.tabParamChart[this.tabParamChart.length - 1].legendBox.boxHeight = this.ConfigChartHealth.barDefault.options.plugins.legend.labels.boxHeight;
    this.tabParamChart[this.tabParamChart.length - 1].legendBox.usePointStyle = this.ConfigChartHealth.barDefault.options.plugins.legend.labels.usePointStyle;
    this.tabParamChart[this.tabParamChart.length - 1].legendBox.pointStyle = this.ConfigChartHealth.barDefault.options.plugins.legend.labels.pointStyle;
    this.tabParamChart[this.tabParamChart.length - 1].legendBox.borderRadius = this.ConfigChartHealth.barDefault.options.plugins.legend.labels.borderRadius;
    this.tabParamChart[this.tabParamChart.length - 1].legendBox.color = this.ConfigChartHealth.barDefault.options.plugins.legend.labels.color;
    this.tabParamChart[this.tabParamChart.length - 1].legendBox.font.size = this.ConfigChartHealth.barDefault.options.plugins.legend.labels.font.size;
    this.tabParamChart[this.tabParamChart.length - 1].legendBox.font.weight = this.ConfigChartHealth.barDefault.options.plugins.legend.labels.font.weight;
    this.tabParamChart[this.tabParamChart.length - 1].legendBox.font.family = this.ConfigChartHealth.barDefault.options.plugins.legend.labels.font.family;

    this.tabParamChart[this.tabParamChart.length - 1].bar = this.ConfigChartHealth.barChart.datasets;
    this.tabParamChart[this.tabParamChart.length - 1].line = this.ConfigChartHealth.lineChart.datasetsDefault;

    this.tabParamChart[this.tabParamChart.length - 1].canvasBackground = this.ConfigChartHealth.barDefault.canvas.backgroundcolor;
    this.tabParamChart[this.tabParamChart.length - 1].canvasHeight = this.ConfigChartHealth.barDefault.canvas.height
    this.tabParamChart[this.tabParamChart.length - 1].canvasMarginLeft = this.ConfigChartHealth.barDefault.canvas.marginleft;
    this.tabParamChart[this.tabParamChart.length - 1].canvasWidth = this.ConfigChartHealth.barDefault.canvas.width;


    for (var l = 0; l < this.ConfigChartHealth.barDefault.datasets.labelsLimits.length; l++) {
      if (this.ConfigChartHealth.barDefault.datasets.fieldsLimitsToSelect[l] === true) {
        this.tabParamChart[this.tabParamChart.length - 1].limitLabels[l] = "Y";
        this.selectedLimitFields[l] = "Y";
      } else {
        this.tabParamChart[this.tabParamChart.length - 1].limitLabels[l] = "N";
        this.selectedLimitFields[l] = "N";
      }
      if (l > 0) {
        const myLimitRgba = { slider: new classReturnColor, palette: new classReturnColor }
        this.tabParamChart[this.tabParamChart.length - 1].limitRgbaLabels.push(myLimitRgba);
      }

      this.tabParamChart[this.tabParamChart.length - 1].limitRgbaLabels[l].palette.rgba = "";
      this.tabParamChart[this.tabParamChart.length - 1].limitRgbaLabels[l].palette.xPos = 0;
      this.tabParamChart[this.tabParamChart.length - 1].limitRgbaLabels[l].palette.yPos = 0;
      this.tabParamChart[this.tabParamChart.length - 1].limitRgbaLabels[l].slider.rgba = "";
      this.tabParamChart[this.tabParamChart.length - 1].limitRgbaLabels[l].slider.xPos = 0;
      this.tabParamChart[this.tabParamChart.length - 1].limitRgbaLabels[l].slider.yPos = 0;
      this.tabParamChart[this.tabParamChart.length - 1].limitLabelsColor[l] = this.ConfigChartHealth.barDefault.datasets.borderColorLimits[l];
    }

    for (var l = 0; l < this.ConfigChartHealth.barDefault.datasets.fieldsToSelect.length; l++) {
      if (this.ConfigChartHealth.barDefault.datasets.fieldsToSelect[l] === true) {
        this.tabParamChart[this.tabParamChart.length - 1].labels[l] = "Y";
        this.selectedFields[l] = "Y";

      } else {
        this.tabParamChart[this.tabParamChart.length - 1].labels[l] = "N";
        this.selectedFields[l] = "N";
      }

      this.tabParamChart[this.tabParamChart.length - 1].labelsColor[l] = this.ConfigChartHealth.barDefault.datasets.borderColor[l];
      if (l > 0) {
        const myRgba = { slider: new classReturnColor, palette: new classReturnColor }
        this.tabParamChart[this.tabParamChart.length - 1].rgbaLabels.push(myRgba);
      }
      this.tabParamChart[this.tabParamChart.length - 1].rgbaLabels[l].palette.rgba = "";
      this.tabParamChart[this.tabParamChart.length - 1].rgbaLabels[l].palette.xPos = 0;
      this.tabParamChart[this.tabParamChart.length - 1].rgbaLabels[l].palette.yPos = 0;
      this.tabParamChart[this.tabParamChart.length - 1].rgbaLabels[l].slider.rgba = "";
      this.tabParamChart[this.tabParamChart.length - 1].rgbaLabels[l].slider.xPos = 0;
      this.tabParamChart[this.tabParamChart.length - 1].rgbaLabels[l].slider.yPos = 0;
    }

    this.tabParamChart[this.tabParamChart.length - 1].period = 'daily';
    this.tabParamChart[this.tabParamChart.length - 1].nbWeeks = 0;
    this.tabParamChart[this.tabParamChart.length - 1].ratio = 2;

    this.tabParamChart[this.tabParamChart.length - 1].axisX.border.color = this.ConfigChartHealth.barDefault.options.scales.axisX.border.color;
    this.tabParamChart[this.tabParamChart.length - 1].axisX.border.width = this.ConfigChartHealth.barDefault.options.scales.axisX.border.width;
    this.tabParamChart[this.tabParamChart.length - 1].axisX.position = this.ConfigChartHealth.barDefault.options.scales.axisX.position;
    this.tabParamChart[this.tabParamChart.length - 1].axisX.stacked = this.ConfigChartHealth.barDefault.options.scales.axisX.stacked;
    this.tabParamChart[this.tabParamChart.length - 1].axisX.ticks = this.ConfigChartHealth.barDefault.options.scales.axisX.ticks;

    this.tabParamChart[this.tabParamChart.length - 1].axisY.border.color = this.ConfigChartHealth.barDefault.options.scales.axisY.border.color;
    this.tabParamChart[this.tabParamChart.length - 1].axisY.border.width = this.ConfigChartHealth.barDefault.options.scales.axisY.border.width;
    this.tabParamChart[this.tabParamChart.length - 1].axisY.position = this.ConfigChartHealth.barDefault.options.scales.axisY.position;
    this.tabParamChart[this.tabParamChart.length - 1].axisY.stacked = this.ConfigChartHealth.barDefault.options.scales.axisY.stacked;
    this.tabParamChart[this.tabParamChart.length - 1].axisY.ticks = this.ConfigChartHealth.barDefault.options.scales.axisY.ticks;


    this.tabParamChart[this.tabParamChart.length - 1].legendBoxRgba.palette.rgba = "";
    this.tabParamChart[this.tabParamChart.length - 1].legendBoxRgba.palette.xPos = 0;
    this.tabParamChart[this.tabParamChart.length - 1].legendBoxRgba.palette.yPos = 0;
    this.tabParamChart[this.tabParamChart.length - 1].legendBoxRgba.slider.rgba = "";
    this.tabParamChart[this.tabParamChart.length - 1].legendBoxRgba.slider.xPos = 0;
    this.tabParamChart[this.tabParamChart.length - 1].legendBoxRgba.slider.yPos = 0;

    this.canvas.push({ width: '', height: '', background: 0, marginLeft: '' });
    this.changeCanvas(i);
  }


  fillInTabOfCharts(nb: number) {

    this.tabParamChart[nb].chartType = this.selectChart.controls['chartType'].value.toLowerCase().trim();
    this.tabParamChart[nb].chartTitle.text = this.selectChart.controls['chartTitle'].value;

    this.tabParamChart[nb].legendTitle.text = this.selectChart.controls['legendTitle'].value;
    this.tabParamChart[nb].legendTitle.color = this.selectChart.controls['colorLegendTitle'].value;
    this.tabParamChart[nb].chartTitle.color = this.selectChart.controls['colorChartTitle'].value;
    this.fillRgba(this.returnTitleRgba, this.tabParamChart[nb].chartTitleRgba);
    this.fillRgba(this.returnLegendRgba, this.tabParamChart[nb].legendTitleRgba);
    this.tabParamChart[nb].ratio = this.selectChart.controls['ratio'].value;
    this.tabParamChart[nb].canvasWidth = this.selectChart.controls['canvasWidth'].value;
    this.tabParamChart[nb].canvasHeight = this.selectChart.controls['canvasHeight'].value;
    this.tabParamChart[nb].canvasBackground = this.selectChart.controls['canvasBackground'].value;
    this.tabParamChart[nb].canvasMarginLeft = this.selectChart.controls['canvasMarginLeft'].value;
    this.tabParamChart[nb].bar.barThickness = this.selectChart.controls['barThickness'].value;
    this.tabParamChart[nb].legendBox.boxWidth = this.selectChart.controls['boxwidth'].value;
    this.tabParamChart[nb].legendBox.boxHeight = this.selectChart.controls['boxheight'].value;
    this.tabParamChart[nb].legendBox.pointStyle = this.selectChart.controls['boxpointStyle'].value;
    this.tabParamChart[nb].legendBox.usePointStyle = this.selectChart.controls['boxusePointStyle'].value;
    this.tabParamChart[nb].legendBox.font.size = this.selectChart.controls['boxfontSize'].value;
    this.tabParamChart[nb].legendBox.font.weight = this.selectChart.controls['boxfontWeight'].value;
    this.tabParamChart[nb].legendBox.font.family = this.selectChart.controls['boxfontFamily'].value;
    this.tabParamChart[nb].legendBox.borderRadius = this.selectChart.controls['boxradius'].value;
    this.tabParamChart[nb].legendBox.color = this.selectChart.controls['boxcolor'].value;
    this.fillRgba(this.returnBoxRgba, this.tabParamChart[nb].legendBoxRgba);

    if ((typeof this.selectChart.controls['stackedX'].value === 'string' && this.selectChart.controls['stackedX'].value === 'false')
      || (typeof this.selectChart.controls['stackedX'].value === 'boolean' && this.selectChart.controls['stackedX'].value === false)) {
      this.tabParamChart[nb].axisX.stacked = false;
    } else {
      this.tabParamChart[nb].axisX.stacked = true;
    }
    if ((typeof this.selectChart.controls['stackedY'].value === 'string' && this.selectChart.controls['stackedY'].value === 'false')
      || (typeof this.selectChart.controls['stackedY'].value === 'boolean' && this.selectChart.controls['stackedY'].value === false)) {
      this.tabParamChart[nb].axisY.stacked = false;
    } else {
      this.tabParamChart[nb].axisY.stacked = true;
    }

    this.tabParamChart[nb].axisX.border.color = this.selectAxisX.controls['borderColor'].value;
    this.tabParamChart[nb].axisX.border.width = this.selectAxisX.controls['borderWidth'].value;
    this.tabParamChart[nb].axisX.position = this.selectAxisX.controls['position'].value;
    this.tabParamChart[nb].axisX.ticks.color = this.selectAxisX.controls['ticksColor'].value;

    this.tabParamChart[nb].axisY.border.color = this.selectAxisY.controls['borderColor'].value;
    this.tabParamChart[nb].axisY.border.width = this.selectAxisY.controls['borderWidth'].value;
    this.tabParamChart[nb].axisY.position = this.selectAxisY.controls['position'].value;
    this.tabParamChart[nb].axisY.ticks.color = this.selectAxisY.controls['ticksColor'].value;

    this.tabParamChart[nb].period = this.selectChart.controls['period'].value.toLowerCase().trim();
    this.tabParamChart[nb].nbWeeks = this.selectChart.controls['nbWeeks'].value;
    this.tabParamChart[nb].startRange = this.selectChart.controls['startRange'].value;
    this.tabParamChart[nb].endRange = this.selectChart.controls['endRange'].value;

    for (var i = 0; i < this.selectedFields.length; i++) {
      this.tabParamChart[nb].labels[i] = this.selectedFields[i];
      this.tabParamChart[nb].labelsColor[i] = this.tabOfLabelsColor[i];
      this.fillRgba(this.tabLabelRgba[i], this.tabParamChart[nb].rgbaLabels[i]);
    }

    for (var i = 0; i < this.selectedLimitFields.length; i++) {
      this. tabParamChart[nb].limitLabels[i] = this.selectedLimitFields[i];
      this.tabParamChart[nb].limitLabelsColor[i] = this.tabOfLimitLabelsColor[i];
      if (this.tabParamChart[nb].limitRgbaLabels[i] === undefined) {
        const myRgba = { slider: new classReturnColor, palette: new classReturnColor }
        this.tabParamChart[nb].limitRgbaLabels.push(myRgba);
      }
      this.fillRgba(this.tabLimitLabelRgba[i], this.tabParamChart[nb].limitRgbaLabels[i]);
    }

    this.fillRgba(this.returnCanvasRgba, this.tabParamChart[nb].rgbaCanvas);

  }

  fillInCharts(inFile: any, outFile: any) {

    outFile.chartType = inFile.chartType.toLowerCase().trim();
    outFile.chartTitle.display = inFile.chartTitle.display;
    outFile.chartTitle.text = inFile.chartTitle.text;
    outFile.chartTitle.position = inFile.chartTitle.position;
    outFile.chartTitle.padding.top = inFile.chartTitle.padding.top;
    outFile.chartTitle.padding.bottom = inFile.chartTitle.padding.bottom;
    outFile.chartTitle.align = inFile.chartTitle.align;
    outFile.chartTitle.color = inFile.chartTitle.color;
    outFile.chartTitle.font.size = inFile.chartTitle.font.size;
    outFile.chartTitle.font.weight = inFile.chartTitle.font.weight;
    outFile.chartTitle.font.family = inFile.chartTitle.font.family;

    outFile.legendTitle.display = inFile.legendTitle.display;
    outFile.legendTitle.text = inFile.legendTitle.text;
    outFile.legendTitle.position = inFile.legendTitle.position;
    outFile.legendTitle.padding.top = inFile.legendTitle.padding.top;
    outFile.legendTitle.padding.bottom = inFile.legendTitle.padding.bottom;
    outFile.legendTitle.padding.left = inFile.legendTitle.padding.left;
    outFile.legendTitle.align = inFile.legendTitle.align;
    outFile.legendTitle.color = inFile.legendTitle.color;
    outFile.legendTitle.font.size = inFile.legendTitle.font.size;
    outFile.legendTitle.font.weight = inFile.legendTitle.font.weight;
    outFile.legendTitle.font.family = inFile.legendTitle.font.family;

    this.fillRgba(inFile.chartTitleRgba, outFile.chartTitleRgba);
    this.fillRgba(inFile.legendTitleRgba, outFile.legendTitleRgba);

    outFile.bar = inFile.bar;
    outFile.line = inFile.line;

    outFile.ratio = inFile.ratio;
    outFile.canvasWidth = inFile.canvasWidth;
    outFile.canvasHeight = inFile.canvasHeight;
    outFile.canvasBackground = inFile.canvasBackground;
    outFile.canvasMarginLeft = inFile.canvasMarginLeft;
    this.fillRgba(inFile.rgbaCanvas, outFile.rgbaCanvas);

    outFile.axisX.stacked = inFile.axisX.stacked;
    outFile.axisX.border.color = inFile.axisX.border.color;
    outFile.axisX.border.width = inFile.axisX.border.width;
    outFile.axisX.position = inFile.axisX.position;
    outFile.axisX.ticks = inFile.axisX.ticks;

    outFile.axisY.stacked = inFile.axisY.stacked;
    outFile.axisY.border.color = inFile.axisY.border.color;
    outFile.axisY.border.width = inFile.axisY.border.width;
    outFile.axisY.position = inFile.axisY.position;
    outFile.axisY.ticks = inFile.axisY.ticks;

    outFile.period = inFile.period.toLowerCase().trim();
    if (inFile.nbWeeks!==undefined){
      outFile.nbWeeks = inFile.nbWeeks;
    } else {
      outFile.nbWeeks = 1;
    }
    
    outFile.startRange = inFile.startRange;
    outFile.endRange = inFile.endRange;

    outFile.legendBox.boxWidth = inFile.legendBox.boxWidth;
    outFile.legendBox.boxHeight = inFile.legendBox.boxHeight;
    outFile.legendBox.borderRadius = inFile.legendBox.borderRadius;
    outFile.legendBox.font.size = inFile.legendBox.font.size;
    outFile.legendBox.font.weight = inFile.legendBox.font.weight;
    outFile.legendBox.font.family = inFile.legendBox.font.family;
    outFile.legendBox.pointStyle = inFile.legendBox.pointStyle;
    outFile.legendBox.usePointStyle = inFile.legendBox.usePointStyle;
    outFile.legendBox.color = inFile.legendBox.color;
    outFile.legendBoxRgba.palette.rgba = inFile.legendBoxRgba.palette.rgba;
    this.fillRgba(inFile.legendBoxRgba, outFile.legendBoxRgba);

    for (var i = 0; i < inFile.labels.length; i++) {
      outFile.labels[i] = inFile.labels[i];
      outFile.labelsColor[i] = inFile.labelsColor[i];
      if (outFile.rgbaLabels[i] === undefined) {
        const myRgba = { slider: new classReturnColor, palette: new classReturnColor }
        outFile.rgbaLabels.push(myRgba);
      }
      this.fillRgba(inFile.rgbaLabels[i], outFile.rgbaLabels[i]);
    }
    for (var i = 0; i < inFile.limitLabels.length; i++) {
      outFile.limitLabels[i] = inFile.limitLabels[i];
      outFile.limitLabelsColor[i] = inFile.limitLabelsColor[i];
      if (outFile.limitRgbaLabels[i] === undefined) {
        const myRgba = { slider: new classReturnColor, palette: new classReturnColor }
        outFile.limitRgbaLabels.push(myRgba);
      }
      this.fillRgba(inFile.limitRgbaLabels[i], outFile.limitRgbaLabels[i]);
    }

  }

  fillRgba(inFile: any, outFile: any) {
    outFile.palette.rgba = inFile.palette.rgba;
    outFile.palette.xPos = inFile.palette.xPos;
    outFile.palette.yPos = inFile.palette.yPos;
    outFile.slider.rgba = inFile.slider.rgba;
    if (inFile.slider.xPos!==undefined){
      outFile.slider.xPos = inFile.slider.xPos;
    } else {
      outFile.slider.xPos = 0;
    }
    if (inFile.slider.yPos!==undefined){
      outFile.slider.yPos = inFile.slider.yPos;
    } else {
      outFile.slider.yPos = 0;
    }
  }


  fillInFormFromTab(nb: number) {
    this.selectChart.controls['chartType'].setValue(this.tabParamChart[nb].chartType.toLowerCase().trim());
    this.selectChart.controls['chartTitle'].setValue(this.tabParamChart[nb].chartTitle.text);
    this.selectChart.controls['colorChartTitle'].setValue(this.tabParamChart[nb].chartTitle.color);
    this.selectChart.controls['ratio'].setValue(this.tabParamChart[nb].ratio);
    this.selectChart.controls['canvasWidth'].setValue(this.tabParamChart[nb].canvasWidth);
    this.selectChart.controls['canvasHeight'].setValue(this.tabParamChart[nb].canvasHeight);
    this.selectChart.controls['canvasBackground'].setValue(this.tabParamChart[nb].canvasBackground);
    this.selectChart.controls['legendTitle'].setValue(this.tabParamChart[nb].legendTitle.text);
    this.selectChart.controls['colorLegendTitle'].setValue(this.tabParamChart[nb].legendTitle.color);

    this.selectChart.controls['stackedX'].setValue(this.tabParamChart[nb].axisX.stacked);
    this.selectChart.controls['stackedY'].setValue(this.tabParamChart[nb].axisY.stacked);

    this.selectAxisX.controls['borderWidth'].setValue(this.tabParamChart[nb].axisX.border.width);
    this.selectAxisX.controls['borderColor'].setValue(this.tabParamChart[nb].axisX.border.color);
    this.selectAxisX.controls['position'].setValue(this.tabParamChart[nb].axisX.position);
    this.selectAxisX.controls['ticksColor'].setValue(this.tabParamChart[nb].axisX.ticks.color);
    this.selectAxisX.controls['stacked'].setValue(this.tabParamChart[nb].axisX.stacked);

    this.selectAxisY.controls['borderWidth'].setValue(this.tabParamChart[nb].axisY.border.width);
    this.selectAxisY.controls['borderColor'].setValue(this.tabParamChart[nb].axisY.border.color);
    this.selectAxisY.controls['position'].setValue(this.tabParamChart[nb].axisY.position);
    this.selectAxisY.controls['ticksColor'].setValue(this.tabParamChart[nb].axisY.ticks.color);
    this.selectAxisY.controls['stacked'].setValue(this.tabParamChart[nb].axisY.stacked);
    this.selected_XTicksColor = this.tabParamChart[nb].axisX.ticks.color;
    this.selected_XBorderColor = this.tabParamChart[nb].axisX.border.color;
    this.selected_YTicksColor = this.tabParamChart[nb].axisY.ticks.color;
    this.selected_YBorderColor = this.tabParamChart[nb].axisY.border.color;


    this.selectChart.controls['period'].setValue(this.tabParamChart[nb].period.toLowerCase().trim());
    if (this.tabParamChart[nb].nbWeeks!==undefined){
      this.selectChart.controls['nbWeeks'].setValue(this.tabParamChart[nb].nbWeeks);
    } else {
      this.selectChart.controls['nbWeeks'].setValue(1);
    }
    this.selectChart.controls['startRange'].setValue(this.tabParamChart[nb].startRange);
    this.selectChart.controls['endRange'].setValue(this.tabParamChart[nb].endRange);
    this.selectChart.controls['canvasMarginLeft'].setValue(this.tabParamChart[nb].canvasMarginLeft);
    this.selectChart.controls['barThickness'].setValue(this.tabParamChart[nb].bar.barThickness);

    this.selectChart.controls['boxwidth'].setValue(this.tabParamChart[nb].legendBox.boxWidth);
    this.selectChart.controls['boxheight'].setValue(this.tabParamChart[nb].legendBox.boxHeight);
    this.selectChart.controls['boxpointStyle'].setValue(this.tabParamChart[nb].legendBox.pointStyle);
    this.selectChart.controls['boxusePointStyle'].setValue(this.tabParamChart[nb].legendBox.usePointStyle);
    this.selectChart.controls['boxfontSize'].setValue(this.tabParamChart[nb].legendBox.font.size);
    this.selectChart.controls['boxfontWeight'].setValue(this.tabParamChart[nb].legendBox.font.weight);
    this.selectChart.controls['boxfontFamily'].setValue(this.tabParamChart[nb].legendBox.font.family);
    this.selectChart.controls['boxradius'].setValue(this.tabParamChart[nb].legendBox.borderRadius);
    this.selectChart.controls['boxcolor'].setValue(this.tabParamChart[nb].legendBox.color);

    this.fillRgba(this.tabParamChart[nb].legendBoxRgba, this.returnBoxRgba);
    this.fillRgba(this.tabParamChart[nb].rgbaCanvas, this.returnCanvasRgba);
    this.fillRgba(this.tabParamChart[nb].chartTitleRgba, this.returnTitleRgba);
    this.fillRgba(this.tabParamChart[nb].legendTitleRgba, this.returnLegendRgba);
    this.selected_canvasColor = this.tabParamChart[nb].canvasBackground;
    this.selected_chartTitleColor = this.tabParamChart[nb].chartTitle.color;
    this.selected_legendColor = this.tabParamChart[nb].legendTitle.color;
    this.selected_boxColor = this.tabParamChart[nb].legendBox.color;
    if (this.isParamLegend === true) {
      this.selected_colorTitle = this.selected_legendColor;
    } else if (this.isParamTitle === true) {
      this.selected_colorTitle = this.selected_chartTitleColor;
    }


    for (var i = 0; i < this.tabParamChart[nb].labels.length; i++) {
      this.selectedFields[i] = this.tabParamChart[nb].labels[i];
      this.tabOfLabelsColor[i] = this.tabParamChart[nb].labelsColor[i];
      this.tabLabelRgba = this.tabParamChart[nb].rgbaLabels;
      this.fillRgba(this.tabParamChart[nb].rgbaLabels[i], this.tabLabelRgba[i]);
    }
    for (var i = 0; i < this.tabParamChart[nb].limitLabels.length; i++) {
      this.selectedLimitFields[i] = this.tabParamChart[nb].limitLabels[i];
      this.tabOfLimitLabelsColor[i] = this.tabParamChart[nb].limitLabelsColor[i];
      this.fillRgba(this.tabParamChart[nb].limitRgbaLabels[i], this.tabLimitLabelRgba[i]);
    }
  }

  transferTitle(id: string, outFile: any, outRgba: any) {
    this.resetBooleans();
    this.isParamTitle = false;
    this.isParamLegend = false;

    this.selectTitle.controls['fontWeight'].setValue(outFile.font.weight);
    this.selectTitle.controls['fontSize'].setValue(outFile.font.size);
    this.selectTitle.controls['family'].setValue(outFile.font.family);
    this.selectTitle.controls['align'].setValue(outFile.align);
    this.selectTitle.controls['position'].setValue(outFile.position);
    this.selectTitle.controls['display'].setValue(outFile.display);

    this.selectTitle.controls['paddingTop'].setValue(outFile.padding.top);
    this.selectTitle.controls['paddingBottom'].setValue(outFile.padding.bottom);

    this.selectTitle.controls['paletteRgba'].setValue(outRgba.palette.rgba);
    this.selectTitle.controls['paletteXpos'].setValue(outRgba.palette.xPos);
    this.selectTitle.controls['paletteYpos'].setValue(outRgba.palette.yPos);

    this.selectTitle.controls['sliderRgba'].setValue(outRgba.slider.rgba);
    this.selectTitle.controls['sliderXpos'].setValue(outRgba.slider.xPos);
    this.selectTitle.controls['sliderYpos'].setValue(outRgba.slider.yPos);

    if (id === 'viewChartTitle') {
      this.isParamTitle = true;
      this.selectTitle.controls['text'].setValue(this.selectChart.controls['chartTitle'].value);
      this.selectTitle.controls['color'].setValue(this.selectChart.controls['colorChartTitle'].value);
      this.selected_colorTitle = this.selectChart.controls['colorChartTitle'].value;
    } else if (id === 'viewLegendTitle') {
      this.selectTitle.controls['paddingLeft'].setValue(this.tabParamChart[this.selectedChart - 1].legendTitle.padding.left);
      this.selectTitle.controls['text'].setValue(this.selectChart.controls['legendTitle'].value);
      this.selectTitle.controls['color'].setValue(this.selectChart.controls['colorLegendTitle'].value);
      this.isParamLegend = true;
      this.selected_colorTitle = this.selectChart.controls['colorLegendTitle'].value;
    }
  }

  processTitle() {
    if (this.isParamTitle === true) {
      this.fillTabTitle(this.tabParamChart[this.selectedChart - 1].chartTitle, this.tabParamChart[this.selectedChart - 1].chartTitleRgba);
      this.fillInFormFromTab(this.selectedChart - 1);
      this.isParamTitle = false;
    } else if (this.isParamLegend === true) {
      this.fillTabTitle(this.tabParamChart[this.selectedChart - 1].legendTitle, this.tabParamChart[this.selectedChart - 1].legendTitleRgba);
      this.isParamLegend = false;
    }
    this.selected_colorTitle = "";
  }

  fillTabTitle(outFile: any, outRgba: any) {
    outFile.text = this.selectTitle.controls['text'].value;
    outFile.font.weight = this.selectTitle.controls['fontWeight'].value;
    outFile.font.size = this.selectTitle.controls['fontSize'].value;
    outFile.font.family = this.selectTitle.controls['family'].value;
    outFile.align = this.selectTitle.controls['align'].value;
    outFile.position = this.selectTitle.controls['position'].value;
    outFile.display = this.selectTitle.controls['display'].value;
    outFile.color = this.selectTitle.controls['color'].value;
    outFile.padding.top = this.selectTitle.controls['paddingTop'].value;
    outFile.padding.bottom = this.selectTitle.controls['paddingBottom'].value;

    outRgba.palette.rgba = this.selectTitle.controls['paletteRgba'].value;
    outRgba.palette.xPos = this.selectTitle.controls['paletteXpos'].value;
    outRgba.palette.yPos = this.selectTitle.controls['paletteYpos'].value;
    outRgba.slider.rgba = this.selectTitle.controls['sliderRgba'].value;
    outRgba.slider.xPos = this.selectTitle.controls['sliderXpos'].value;
    outRgba.slider.yPos = this.selectTitle.controls['sliderYpos'].value;

    if (this.isParamLegend === true) {
      outFile.padding.left = this.selectTitle.controls['paddingLeft'].value;

      this.selectChart.controls['legendTitle'].setValue(outFile.text);
      this.selectChart.controls['colorLegendTitle'].setValue(outFile.color);


    } else if (this.isParamTitle === true) {
      outFile.padding.left = this.selectTitle.controls['paddingLeft'].value;
      this.selectChart.controls['chartTitle'].setValue(outFile.text);
      this.selectChart.controls['colorChartTitle'].setValue(outFile.color);
    }
  }

  selectType(event: any) {
    this.timeOutactivity(5, true, false,"only");
    this.resetBooleans();
    if (event.target.id === 'selType') {
      this.isTypeSelected = true;
    } else if (event.target.id === 'selectedType') {
      this.isTypeSelected = false;
      this.selectChart.controls['chartType'].setValue(event.target.textContent.trim());
    } else if (event.target.textContent.trim() !== "cancel") {
      if (event.target.id === 'viewChartTitle') {
        this.transferTitle(event.target.id, this.tabParamChart[this.selectedChart - 1].chartTitle, this.tabParamChart[this.selectedChart - 1].chartTitleRgba);
      } else if (event.target.id === 'viewLegendTitle') {
        this.transferTitle(event.target.id, this.tabParamChart[this.selectedChart - 1].legendTitle, this.tabParamChart[this.selectedChart - 1].legendTitleRgba);
      } else if (event.target.id === 'viewAxis') {
        this.isParamAxis = true;
      } else
        if (event.target.id === 'selFontWeight') {
          this.isFontWeight = true;
        } else if (event.target.id === 'selectedFontWeight') {
          this.isFontWeight = false;
          this.selectTitle.controls['fontWeight'].setValue(event.target.textContent.trim());
        } else if (event.target.id === 'selTextAlign') {
          this.isTextAlign = true;
        } else if (event.target.id === 'selectedTextAlign') {
          this.isTextAlign = false;
          this.selectTitle.controls['align'].setValue(event.target.textContent.trim());
        } else if (event.target.id === 'selTitlePosition') {
          this.isTitlePosition = true;
        } else if (event.target.id === 'selectedTitlePosition') {
          this.isTitlePosition = false;
          this.selectTitle.controls['position'].setValue(event.target.textContent.trim());
        } else if (event.target.id === 'selTitleDisplay') {
          this.isTitleDisplay = true;
        } else if (event.target.id === 'selectedTitleDisplay') {
          this.isTitleDisplay = false;
          this.selectTitle.controls['display'].setValue(event.target.textContent.trim());
        }
    } else { this.resetBooleans(); }


  }

  selectPeriod(event: any) {
    this.timeOutactivity(5, true, false,"only");
    this.resetBooleans();
    if (event.target.id === 'selPeriod') {
      this.isPeriodSelected = true;
    } else if (event.target.id === 'selectedPeriod') {
      this.isPeriodSelected = false;
      this.selectChart.controls['period'].setValue(event.target.textContent.toLowerCase().trim());
    }
  }

  selectPeriodAll(event: any) {
    this.timeOutactivity(5, true, false,"only");
    this.resetBooleans();
    if (event.target.id === 'selPeriod') {
      this.isPeriodSelected = true;
    } else if (event.target.id === 'selectedPeriod') {
      this.isPeriodSelected = false;
      this.paramAllCharts.controls['period'].setValue(event.target.textContent.toLowerCase().trim());
    }
  }

  selectColorAxis(event: any) {
    if (this.tabLock[5].lock !== 2) {
      this.timeOutactivity(5, true, false,"only");
      this.resetBooleans();
      this.mainWindow.top = 120;
      this.posSlider.div.top = this.mainWindow.top + this.subWindow.top;
      if (event === "xBorderColor") {
        this.isSelectXBorderColor = true;
        this.my_input_child1 = this.selected_XBorderColor;
        this.my_input_child2 = this.selected_XBorderColor;
        this.returnSlider = this.returnXBorderColorRgba.slider;
        this.returnPalette = this.returnXBorderColorRgba.palette;

      } else if (event === "xTicksColor") {
        this.isSelectXTicksColor = true;
        this.my_input_child1 = this.selected_XTicksColor;
        this.my_input_child2 = this.selected_XTicksColor;
        this.returnSlider = this.returnXTicksRgba.slider;
        this.returnPalette = this.returnXTicksRgba.palette;

      } else if (event === "yBorderColor") {
        this.isSelectYBorderColor = true;
        this.my_input_child1 = this.selected_YBorderColor;
        this.my_input_child2 = this.selected_YBorderColor;
        this.returnSlider = this.returnYBorderColorRgba.slider;
        this.returnPalette = this.returnYBorderColorRgba.palette;

      } else if (event === "yTicksColor") {
        this.isSelectYTicksColor = true;
        this.my_input_child1 = this.selected_YTicksColor;
        this.my_input_child2 = this.selected_YTicksColor;
        this.returnSlider = this.returnYTicksRgba.slider;
        this.returnPalette = this.returnYTicksRgba.palette;

      }
      this.isSliderSelected = true;
    }
  }

  selectColor(event: any) {
    if (this.tabLock[5].lock !== 2) {
      this.resetBooleans();
      this.timeOutactivity(5, true, false,"only");
      this.mainWindow.top = 120;
      this.posSlider.div.top = this.mainWindow.top + this.subWindow.top;
      if (event === 'canvasColor') {
        this.isSelectCanvasColor = true;
        this.my_input_child1 = this.selected_canvasColor;
        this.my_input_child2 = this.selected_canvasColor;
        this.returnSlider = this.returnCanvasRgba.slider;
        this.returnPalette = this.returnCanvasRgba.palette;
        this.isSliderSelected = true;
      } else if (event === 'legendColor' || (event === 'colorTitle' && this.isParamLegend === true)) {
        this.my_input_child1 = this.selected_legendColor;
        this.my_input_child2 = this.selected_legendColor;
        this.returnSlider = this.returnLegendRgba.slider;
        this.returnPalette = this.returnLegendRgba.palette;
        if (this.isParamLegend === true) {
          this.isSelectLChartTitleColor = true;
        } else {
          this.isSelectLegendColor = true;
        }
        this.isSliderSelected = true;
      } else if (event === 'colorChartTitle' || (event === 'colorTitle' && this.isParamTitle === true)) {
        this.my_input_child1 = this.selected_chartTitleColor;
        this.my_input_child2 = this.selected_chartTitleColor;
        this.returnSlider = this.returnTitleRgba.slider;
        this.returnPalette = this.returnTitleRgba.palette;
        if (this.isParamTitle === true) {
          this.isSelectLChartTitleColor = true;
        } else {
          this.isSelectChartTitleColor = true;
        }
        this.isSliderSelected = true;
      } else if (event === "boxColor") {
        this.isSelectBoxColor = true;
        this.my_input_child1 = this.selected_boxColor;
        this.my_input_child2 = this.selected_boxColor;
        this.returnSlider = this.returnBoxRgba.slider;
        this.returnPalette = this.returnBoxRgba.palette;
        this.isSliderSelected = true;
      }

      else if (event === 'fieldCanvasColor') { //  
        this.selected_canvasColor = this.selectChart.controls["canvasBackground"].value;
        this.initRgba(this.returnCanvasRgba);
      } else if (event === 'fieldLegendColor' || (event === 'fieldColorTitle' && this.isParamLegend === true)) {
        this.selected_legendColor = this.selectChart.controls["colorLegendTitle"].value;
        this.initRgba(this.returnLegendRgba);
      } else if (event === 'fieldColorChartTitle' || (event === 'fieldColorTitle' && this.isParamTitle === true)) {
        this.selected_chartTitleColor = this.selectChart.controls["colorChartTitle"].value;
        this.initRgba(this.returnTitleRgba);
      } else if (event === 'fieldBoxColor') {
        this.selected_boxColor = this.selectChart.controls["boxcolor"].value;
        this.initRgba(this.returnBoxRgba);
      } else if (event === 'fieldBoxColor') {
        this.selected_boxColor = this.selectChart.controls["boxcolor"].value;
        this.initRgba(this.returnBoxRgba);
      } else if (event === 'fieldXColorBorder') {
        this.selected_XBorderColor = this.selectAxisX.controls["borderColor"].value;
        this.initRgba(this.returnBoxRgba);
      } else if (event === 'fieldXTicksColor') {
        this.selected_XTicksColor = this.selectAxisX.controls["ticksColor"].value;
        this.initRgba(this.returnBoxRgba);
      } else if (event === 'fieldYColorBorder') {
        this.selected_YBorderColor = this.selectAxisY.controls["borderColor"].value;
        this.initRgba(this.returnBoxRgba);
      } else if (event === 'fieldYTicksColor') {
        this.selected_YTicksColor = this.selectAxisY.controls["ticksColor"].value;
        this.initRgba(this.returnBoxRgba);
      }


      if (this.returnSlider.rgba !== '') {
        this.my_input_child2 = this.returnSlider.rgba;
      }
      if (this.returnPalette.rgba !== '') {
        this.my_input_child1 = this.returnPalette.rgba;
        this.temporaryColor = this.returnPalette.rgba;
      }
    }
  }

  initRgba(event: any) {
    event.slider.xPos = 0;
    event.slider.yPos = 0;
    event.slider.rgba = '';
    event.palette.xPos = 0;
    event.palette.yPos = 0;
    event.palette.rgba = '';
  }


  fnSlider(event: any) {
    this.my_input_child1 = event; //used by palette
    this.my_input_child2 = event; //used by slider
  }

  fnSliderBis(event: any) {
    this.returnSlider = event; // returned by slider
  }

  fnPaletteBis(event: any) {
    this.returnPalette = event;
  }

  temporaryColor: string = '';
  fnPalette(event: any) {
    if (this.debugPhone === true) {
      //this.getPosDivPosSliderTrue();
      this.posDivPosSliderTrue = getPosDiv("posDivSliderTrue");
    }
    this.temporaryColor = event;
  }


  fnExitPalette(event: any) {
   
    if (this.tabLock[5].lock !== 2) {
      this.timeOutactivity(5, true, false,"only");
      if (event === 'Cancel') {
        this.resetBooleans();
      } else if (event === 'Save') {
        if (this.isSelectCanvasColor === true) {
          this.selected_canvasColor = this.temporaryColor;
          this.returnCanvasRgba.palette = this.returnPalette;
          this.returnCanvasRgba.slider = this.returnSlider;
          this.isSelectCanvasColor = false;
          this.selectChart.controls['canvasBackground'].setValue(this.temporaryColor);
        } else if (this.isSelectLegendColor === true || (this.isParamLegend === true && this.isSelectLChartTitleColor === true)) {
          this.selected_legendColor = this.temporaryColor;
          this.isSelectLegendColor = false;
          this.returnLegendRgba.palette = this.returnPalette;
          this.returnLegendRgba.slider = this.returnSlider;
          this.selectChart.controls['colorLegendTitle'].setValue(this.temporaryColor);

        } else if (this.isSelectChartTitleColor === true || (this.isParamTitle === true && this.isSelectLChartTitleColor === true)) {
          this.selected_chartTitleColor = this.temporaryColor;
          this.isSelectChartTitleColor = false;
          this.returnTitleRgba.palette = this.returnPalette;
          this.returnTitleRgba.slider = this.returnSlider;

          this.selectChart.controls['colorChartTitle'].setValue(this.temporaryColor);

        } else if (this.isSelectLabColor === true) {
          if (this.dialogLabColor[this.currentLabColor] === true) {
            this.tabOfLabelsColor[this.currentLabColor] = this.temporaryColor;
            this.tabLabelRgba[this.currentLabColor].palette = this.returnPalette;
            this.tabLabelRgba[this.currentLabColor].slider = this.returnSlider;
            this.isSelectLabColor = false;
            this.dialogLabColor[this.currentLabColor] = false;
          } else if (this.dialogLimitLabColor[this.currentLabColor] === true) {
            this.tabOfLimitLabelsColor[this.currentLabColor] = this.temporaryColor;
            this.tabLimitLabelRgba[this.currentLabColor].palette = this.returnPalette;
            this.tabLimitLabelRgba[this.currentLabColor].slider = this.returnSlider;
            this.isSelectLabColor = false;
            this.dialogLimitLabColor[this.currentLabColor] = false;
          }

        } else if (this.isSelectBoxColor === true) {
          this.selected_boxColor = this.temporaryColor;
          this.selectChart.controls['boxcolor'].setValue(this.temporaryColor);
          this.returnBoxRgba.palette = this.returnPalette;
          this.returnBoxRgba.slider = this.returnSlider;
          this.isSelectBoxColor = false;
        } else if (this.isSelectXBorderColor === true) {
          this.selected_XBorderColor = this.temporaryColor;
          this.selectAxisX.controls['borderColor'].setValue(this.temporaryColor);
          this.returnXBorderColorRgba.palette = this.returnPalette;
          this.returnXBorderColorRgba.slider = this.returnSlider;
          this.isSelectXBorderColor = false;
        } else if (this.isSelectXTicksColor === true) {
          this.selected_XTicksColor = this.temporaryColor;
          this.selectAxisX.controls['ticksColor'].setValue(this.temporaryColor);
          this.returnXTicksRgba.palette = this.returnPalette;
          this.returnXTicksRgba.slider = this.returnSlider;
          this.isSelectXTicksColor = false;
        } else if (this.isSelectYBorderColor === true) {
          this.selected_YBorderColor = this.temporaryColor;
          this.selectAxisY.controls['borderColor'].setValue(this.temporaryColor);
          this.returnYBorderColorRgba.palette = this.returnPalette;
          this.returnYBorderColorRgba.slider = this.returnSlider;
          this.isSelectYBorderColor = false;
        } else if (this.isSelectYTicksColor === true) {
          this.selected_YTicksColor = this.temporaryColor;
          this.selectAxisY.controls['ticksColor'].setValue(this.temporaryColor);
          this.returnYTicksRgba.palette = this.returnPalette;
          this.returnYTicksRgba.slider = this.returnSlider;
          this.isSelectYTicksColor = false;
        }

        if (this.isSelectLChartTitleColor === true) {
          this.selected_colorTitle = this.temporaryColor;
          this.isSelectLChartTitleColor = false;
          this.selectTitle.controls['color'].setValue(this.temporaryColor);
          this.selectTitle.controls['paletteRgba'].setValue(this.returnPalette.rgba);
          this.selectTitle.controls['paletteXpos'].setValue(this.returnPalette.xPos);
          this.selectTitle.controls['paletteYpos'].setValue(this.returnPalette.yPos);
          this.selectTitle.controls['sliderRgba'].setValue(this.returnSlider.rgba);
          this.selectTitle.controls['sliderXpos'].setValue(this.returnSlider.xPos);
          this.selectTitle.controls['sliderYpos'].setValue(this.returnSlider.yPos);
        }

      }
      this.isSliderSelected = false;
    }
  }
  selectLabelColor(event: any) {
    if (this.isSelectLabColor === true){
      this.resetBooleans();
    }
    if (this.tabLock[5].lock !== 2) {
      this.timeOutactivity(5, true, false,"only");
      const i = event.target.id.indexOf('-');
      this.dialogLabColor[this.currentLabColor] = false;
      this.dialogLimitLabColor[this.currentLabColor] = false;
      this.currentLabColor = Number(event.target.id.substring(i + 1));
      if (event.target.id.substring(0, i) === "labelLimitColor") {
        this.dialogLimitLabColor[this.currentLabColor] = true;
        this.returnPalette = this.tabLimitLabelRgba[this.currentLabColor].palette;
        this.returnSlider = this.tabLimitLabelRgba[this.currentLabColor].slider;
      } else {
        this.dialogLabColor[this.currentLabColor] = true;
        this.returnPalette = this.tabLabelRgba[this.currentLabColor].palette;
        this.returnSlider = this.tabLabelRgba[this.currentLabColor].slider;
      }
      this.isSelectLabColor = true;

      if (this.returnSlider.rgba !== '') {
        this.my_input_child2 = this.returnSlider.rgba;
      }
      if (this.returnPalette.rgba !== '') {
        this.my_input_child1 = this.returnPalette.rgba;
        this.temporaryColor = this.returnPalette.rgba;
      }
      this.isSliderSelected = true;
      this.mainWindow.top = 370;
      this.posSlider.div.top = this.mainWindow.top + this.subWindow.top;
    }
  }

  SelRadio(event: any) {
    //console.log('event.target.id='+event.target.id+ "  event.currentTarget.id=" + event.currentTarget.id );
    if (this.tabLock[5].lock !== 2) {
      this.timeOutactivity(5, true, false,"only");
      const i = event.target.id.indexOf('-');
      const item = Number(event.target.id.substring(i + 1));
      if (event.target.id === 'submit') {

      } else if (event.target.id.substring(0, 1) === 'A') {
        if (this.selectedFields[item] === 'Y') {
          this.FillSelected.selected = 'N';
          this.ListChart.controls[item].setValue(this.FillSelected);
          this.selectedFields[item] = 'N';
        } else if (this.selectedFields[item] === 'N') {
          this.FillSelected.selected = 'Y';
          this.ListChart.controls[item].setValue(this.FillSelected);
          this.selectedFields[item] = 'Y';
        }
      } else if (event.target.id.substring(0, 1) === 'L') {
        if (this.selectedLimitFields[item] === 'Y') {
          this.FillSelected.selected = 'N';
          this.ListChart.controls[item + this.ConfigChartHealth.barDefault.datasets.labels.length - 1].setValue(this.FillSelected);
          this.selectedLimitFields[item] = 'N';
        } else if (this.selectedLimitFields[item] === 'N') {
          this.FillSelected.selected = 'Y';
          this.ListChart.controls[item + this.ConfigChartHealth.barDefault.datasets.labels.length - 1].setValue(this.FillSelected);
          this.selectedLimitFields[item] = 'Y';
        }
      }
    }
  }


  errorMsg: string = '';
  fnSelectChart() {
    this.errorMsg = '';
    this.timeOutactivity(5, true, false,"only");
    // check that all parameters are correct
    if (this.selectChart.controls['chartType'].value !== '') {
      for (var i = 0; i < this.lineChartType.length && this.selectChart.controls['chartType'].value.toLowerCase().trim() !== this.lineChartType[i].toLowerCase().trim(); i++) {
      }
      if (i === this.lineChartType.length) {
        this.errorMsg = 'Field TYPE is unknown; please update it';
      }
    }
    if (this.errorMsg === '' && this.selectChart.controls['period'].value !== '') {
      for (var i = 0; i < this.tabPeriod.length && this.selectChart.controls['period'].value.toLowerCase().trim() !== this.tabPeriod[i].toLowerCase().trim(); i++) {
      }
      if (i === this.tabPeriod.length) {
        this.errorMsg = 'Field PERIOD is unknown; please update it';
      }
    }
    if (this.errorMsg === '' && this.selectChart.controls['startRange'].value !== '' && this.selectChart.controls['endRange'].value !== '' && this.selectChart.controls['endRange'].value < this.selectChart.controls['startRange'].value) {
      this.errorMsg = 'end date cannot be before start date; please update';
    }

    if (this.errorMsg === '' && isNaN(this.selectChart.controls['canvasWidth'].value)) {
      this.errorMsg = 'Field CANVAS WIDTH is not a numeric';
    }
    if (this.errorMsg === '' && isNaN(this.selectChart.controls['canvasHeight'].value)) {
      this.errorMsg = 'Field CANVAS HEIGHT is not a numeric';
    }
    if (this.errorMsg === '' && isNaN(this.selectChart.controls['ratio'].value)) {
      this.errorMsg = 'Field RATIO is not a numeric';
    }
    if (this.errorMsg === '') {
      this.fillInTabOfCharts(this.selectedChart - 1);
      this.buildChart(this.selectedChart - 1);
    }

  }

  //nbPass:number=0;
  buildChart(nb: number) {
    this.changeCanvas(nb);
    if (this.tabChart[nb]){
      this.tabChart[nb].destroy();
    }
    this.collectSpecialData(nb, this.overallTab[nb].datasetBar, this.overallTab[nb].labelBar, this.overallTabLimit[nb].dataset, this.overallTabLimit[nb].label);
  }

 

  //********************** */
  collectSpecialData(nb: number, datasetsSpecialBar: Array<any>, dateLabelSpecial: Array<any>, datasetsLimit: Array<any>, dateLabelLimit: Array<any>) {
    var i = 0;
    var j = 0;
    var addWeekly: number = 0;
   
    const returnData = fillHealthDataSet(dateLabelSpecial, datasetsSpecialBar, this.HealthAllData,this.tabParamChart[nb], this.ConfigChartHealth, addWeekly, this.identification);
    var refDailySaturated: Array<number> = [];
    var refDailySugar: Array<number> = [];
    var refDailyCarbs: Array<number> = [];
    if (returnData!==undefined) {
        datasetsSpecialBar = returnData.datasets;
        refDailySaturated = returnData.refSaturated;
        refDailySugar = returnData.refSugar;
        refDailyCarbs = returnData.refCarbs;
    }
    
  
    // prepare the drawing of the horizontal bars

    var iMax: number = 0;
    var dataValue: number = 0;
    var datasetsLength: number = 0;
    iMax = datasetsSpecialBar.length;
    var labelName: string = '';
    var newRecords: number = 0;
    var tabNewItem = [];
    var labLimit: number = 0;
    var j = 0;
    for (var i = 0; i < iMax; i++) {
      dataValue = 0;
      if (datasetsSpecialBar[i].label === 'Cholesterol') {
        dataValue = Number(this.identification.health.Cholesterol.myLimit);
        labelName = 'Chol. limit';
        labLimit = 0;
      } else if (datasetsSpecialBar[i].label === 'Saturated Fat') {
        labelName = 'Sat. limit';
        labLimit = 1;
        dataValue = Number(this.identification.health.SaturatedFat);
      } else if (datasetsSpecialBar[i].label === 'Proteins') {
        dataValue = Number(this.identification.health.Protein);
        labelName = 'Prot. limit';
        labLimit = 2;
      } else if (datasetsSpecialBar[i].label === 'Carbs') {
        dataValue = Number(this.identification.health.Carbs);
        labelName = 'Carbs limit';
        labLimit = 3;
      } else if (datasetsSpecialBar[i].label === 'Sugar') {
        labelName = 'Sugar limit';
        labLimit = 4;
        dataValue = Number(this.identification.health.Sugar);
      }
      if (dataValue > 0) {
        datasetsSpecialBar.push({
          type: "line",
          label: "",
          backgroundColor: '',
          borderColor: [], //The line color.
          data: [],
          borderWidth: 3, //The line width (in pixels).
          showLine: true,
          fill: false, //true 
          pointBorderWidth: 0,
          pointBorderColor: '',
          pointBackgroundColor: '',
          //order:1,
          //tension:0.2,
          pointStyle: false,
        });
        if (datasetsSpecialBar[i].label === 'Sugar') {
          for (var j = 0; j < datasetsSpecialBar[i].data.length; j++) {
            datasetsSpecialBar[datasetsSpecialBar.length - 1].data[j] =refDailySugar[j];
          }
        } else if (datasetsSpecialBar[i].label === 'Carbs') {
          for (var j = 0; j < datasetsSpecialBar[i].data.length; j++) {
            datasetsSpecialBar[datasetsSpecialBar.length - 1].data[j] =refDailyCarbs[j];
          }
        } else
        if (datasetsSpecialBar[i].label === 'Saturated Fat') {
          for (var j = 0; j < datasetsSpecialBar[i].data.length; j++) {
            datasetsSpecialBar[datasetsSpecialBar.length - 1].data[j] =refDailySaturated[j];
          }
        } else {
          if (this.tabParamChart[nb].period === 'daily') {
            for (var j = 0; j < datasetsSpecialBar[i].data.length; j++) {
              datasetsSpecialBar[datasetsSpecialBar.length - 1].data[j] = dataValue;
            }
          } else if (this.tabParamChart[nb].period === 'weekly') {
            for (var j = 0; j < datasetsSpecialBar[i].data.length; j++) {
              datasetsSpecialBar[datasetsSpecialBar.length - 1].data[j] = dataValue * 7;
            }
          }
        }

        datasetsSpecialBar[datasetsSpecialBar.length - 1].borderColor[datasetsSpecialBar.length - 1] = this.tabParamChart[nb].limitLabelsColor[labLimit];

        datasetsSpecialBar[datasetsSpecialBar.length - 1].label = labelName;
        datasetsSpecialBar[datasetsSpecialBar.length - 1].pointBackgroundColor = this.tabParamChart[nb].limitLabelsColor[labLimit];
      }
    }

    const newChart=specialDraw(this.tabCtx[nb],this.tabParamChart[nb], this.ConfigChartHealth, dateLabelSpecial, datasetsSpecialBar);
    this.tabChart[nb]= newChart;
  }


  resetBooleans() {
    this.isTypeSelected = false;
    this.isPeriodSelected = false;
    this.isSelectLegendColor = false;
    this.isSelectBoxColor = false;
    this.isSelectCanvasColor = false;
    this.isSelectLChartTitleColor = false;
    this.isSelectChartTitleColor = false;
    this.isSelectLabColor = false;
    this.dialogLabColor[this.currentLabColor] = false;

    this.isSliderSelected = false;
    //this.selectedChart=0;

    this.isFontWeight = false;
    this.isTextAlign = false;
    this.isTitlePosition = false;
    this.isTitleDisplay = false;

    this.isSelectXBorderColor = false;
    this.isSelectXTicksColor = false;
    this.isSelectYBorderColor = false;
    this.isSelectYTicksColor = false;
    this.isPosDivSliderTrue = false;
  }


  ConfirmSave(event: any) {
    this.errorMsg = '';
    this.resetBooleans();
    this.theEvent.target.id = event.target.id;
    this.theEvent.target.value = event.target.value;
    this.theEvent.target.textContent = event.target.textContent;
    this.theEvent.checkLock.iWait=0;
    this.theEvent.checkLock.isDataModified=true;
    this.theEvent.checkLock.isSaveFile=false;
    this.theEvent.checkLock.lastInputAt=this.lastInputAt;
    this.theEvent.fileName=this.SpecificForm.controls['FileName'].value;
    this.onInputAction = "confirmSave";
    this.timeOutactivity(0, true, false,"only");
  }

  cancelTheSave(){
    this.IsSaveConfirmed = false;
    this.isMustSaveFile = false;
  }


  saveFn() {
    this.errorMsg = '';
    this.IsSaveConfirmed = false;
    this.fillInTabOfCharts(this.selectedChart - 1);
    if (this.errorMsg === '') {
      if (this.theEvent.target.id === 'save') {
          this.fillInCharts(this.tabParamChart[this.selectedChart - 1], this.inFileParamChart.data[this.selectedChart - 1]);
          this.buildChart(this.selectedChart - 1);
      } else {
          for (var i = 0; i < this.tabParamChart.length; i++) {
            this.fillInCharts(this.tabParamChart[i], this.inFileParamChart.data[i]);
            this.buildChart(this.selectedChart - 1);
          }
      }
    }
    //this.isSaveFile = true;
    this.theEvent.checkLock.iWait=5;
    this.theEvent.iWait=5;
    this.theEvent.checkLock.isDataModified=true;
    this.theEvent.checkLock.isSaveFile=true;
    this.theEvent.checkLock.iCheck=true;
    this.theEvent.checkLock.lastInputAt=this.lastInputAt;
    this.theEvent.checkLock.action="saveParamChart";
    this.theEvent.fileName = this.SpecificForm.controls['FileName'].value;
    this.onInputAction = "saveParamChart";
    this.timeOutactivity(5, true, true,"saveParamChart");
    this.processSave.emit(this.theEvent);
  }

  cancelFn(event: string) {
    this.resetBooleans();
    this.timeOutactivity(5, true, false,"only");
     if (event === 'cancelAll') {
      for (var i = 0; i < this.tabParamChart.length; i++) {
        this.fillInCharts(this.inFileParamChart.data[i], this.tabParamChart[i]);
        this.fillInFormFromTab(i);
        this.buildChart(i);
      }
    } else if (event === 'cancelOne') {
      this.fillInCharts(this.inFileParamChart.data[this.selectedChart - 1], this.tabParamChart[this.selectedChart - 1]);
      this.fillInFormFromTab(this.selectedChart - 1);
      this.buildChart(this.selectedChart - 1);
    }
  }


  resultAccessFile(theEvent:any){
    //this.openFileAccess=false;
    if (this.lockValueBeforeCheck!==this.tabLock[5].lock){
      if (this.tabLock[5].lock===1){
        this.enableForm();
        this.errorMsg = "You can now update the file";
      } else {
        this.errorMsg = "File is locked by another user";
        this.disableForm();
      }
    }
    if (this.onInputAction === "confirmSave"){
      this.SpecificForm.controls['FileName'].setValue(this.identification.fitness.files.myChartConfig);
      this.IsSaveConfirmed = true;
    }
    console.log(theEvent);
  }

  ngOnChanges(changes: SimpleChanges) {

    for (const propName in changes) {
      console.log('onChange report-Health propName='+propName);
      if (propName === 'tabLock'){
        if (this.tabLock[5].lock===1){
          if (changes[propName].previousValue !==undefined && changes[propName].previousValue.lock!==1){
            this.errorMsg = "You can now update the file";
          }
          this.enableForm();
        } else {
          if (changes[propName].previousValue !==undefined && changes[propName].previousValue.lock===1){
            this.errorMsg = "File is locked by another user";
          }
          this.disableForm();
        }
      } else if (propName === 'actionParamChart' && changes[propName].firstChange === false) {
          if ( this.onInputAction === "saveParamChart") {
            if (this.tabLock[5].lock === 1 && (this.tabLock[5].status === 0 || this.tabLock[5].status === 300)) {
              if (this.theEvent.target.id === 'save') {
                this.errorMsg = 'parameters for chart#' + this.selectedChart + ' have been saved';
              } else if (this.theEvent.target.id === 'saveAll') {
                this.errorMsg = 'for all charts, parameters have been saved';
              }
            } else {
              this.errorMsg = 'Parameters cannot be saved - error=' + this.tabLock[5].status;
            }
            this.onInputAction = "";
        } 
      } else if (propName==='returnDataFSParamChart' && changes[propName].firstChange === false) {
        // is it needed
        if (this.tabLock[5].lock !== 1 && this.onInputAction === "saveParamChart"){
          this.errorMsg = "file has been locked by another user; all your updates are lost (" +  this.returnDataFSParamChart.errorMsg + ")" + " status=" + this.tabLock[5].status;
        } 
        if (this.tabLock[5].lock === 1) {
            this.enableForm();
        } else {
            this.disableForm();
        }
        this.onInputAction = "";
      } else if ( propName==='statusSaveFn' && changes[propName].firstChange === false) {  //propName === 'callSaveFunction' ||
        this.onInputAction = "";
        this.theEvent.checkLock.action="";
        this.isMustSaveFile = false;
        this.isSaveParamChart = false;
        if (this.statusSaveFn.status===200 || this.statusSaveFn.status===0){
          this.errorMsg='File has been successfully saved';
          this.isDataModified = false;
        } else {
          this.errorMsg=this.statusSaveFn.err;
        }
      } 
    }
    // //this.LogMsgConsole('$$$$$ onChanges '+' to '+to+' from '+from + ' ---- JSON.stringify(j) '+ JSON.stringify(j)); 
  }


}