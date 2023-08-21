import { Component, OnInit , Input, Output, ViewChild,  HostListener,  HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
  
import { DatePipe, formatDate,  ViewportScroller } from '@angular/common'; 

//import  { Color, Label } from 'ng2-charts';
import { Chart, ChartOptions, ChartType, ChartConfiguration, PluginChartOptions, ScaleChartOptions, ChartDataset,
  BarController, BarElement, CategoryScale, ChartData, LinearScale, LineController, LineElement, PointElement, } from 'chart.js/auto';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { FormGroup, FormControl, UntypedFormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { Observable } from 'rxjs';

import { BucketList, Bucket_List_Info } from '../../JsonServerClass';

// configServer is needed to use ManageGoogleService
// it is stored in MangoDB and accessed via ManageMangoDBService


import { environment } from 'src/environments/environment';

import {classPosDiv, getPosDiv} from '../../getPosDiv';
import { strDateTime } from '../../MyStdFunctions';

import {manage_input} from '../../manageinput';
import {eventoutput, thedateformat} from '../../apt_code_name';
import {msginLogConsole} from '../../consoleLog';

import { mainClassCaloriesFat, mainDailyReport} from '../ClassHealthCalories';
import {mainConvItem, mainRecordConvert, mainClassUnit, mainClassConv} from '../../ClassConverter';
import { classConfigChart, classchartHealth } from '../classConfigChart';
import {classPosSlider} from '../../JsonServerClass';

import { configServer,  LoginIdentif, msgConsole } from '../../JsonServerClass';
import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import {AccessConfigService} from 'src/app/CloudServices/access-config.service';
import { classAxis, classLegendChart, classPluginTitle , classTabFormChart, classFileParamChart, classReturnColor} from '../classChart';
import { classFileSystem, classAccessFile}  from '../../classFileSystem';


@Component({
  selector: 'app-report-health',
  templateUrl: './report-health.component.html',
  styleUrls: ['./report-health.component.css']
})

export class ReportHealthComponent implements OnInit {

  SelChartForm:FormGroup; 
  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageMangoDBService: ManageMangoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    @Inject(LOCALE_ID) private locale: string,
    ) { this.SelChartForm = this.fb.group({ 
      //title: new FormControl(''),
      selectedItems: this.fb.array([]),
          })}
  
  get ListChart(){
    return this.SelChartForm.controls["selectedItems"] as FormArray; 
  }
  
  FormChart():FormGroup {
    return this.fb.group ({
            selected: new FormControl('N', { nonNullable: true })
    })
  }
  FillSelected= {'selected':''};

  @Input() identification= new LoginIdentif;
  @Input() HealthAllData=new mainDailyReport;
  @Input() ConfigChartHealth=new classchartHealth;
  @Input() INFileParamChart=new classFileParamChart;
  @Input() configServer=new configServer;

  //inData=new classAccessFile;
  @Input()  tabLock= new classAccessFile; //.lock ++> 0=unlocked; 1=locked by user; 2=locked by other user; 3=must be checked;
  
  posSlider=new classPosSlider;
  posPalette=new classPosSlider;
  paramChange:number=0; // used to trigger the change on slider position
  @Output() returnFile= new EventEmitter<any>();
  @Output() reportCheckLockLimit= new EventEmitter<any>();
  @Output() cancelSaveOther= new EventEmitter<any>();

  @ViewChild('baseChart', { static: true })

  // DEBUG
  debugPhone:boolean=false;

  current_Chart:number=0;
  tabParamChart:Array<classTabFormChart>=[];
  initTabParamChart:Array<classTabFormChart>=[];

  tabCtx:Array<any>=[];
  tabChart:Array<any>=[];
  myTabChart:Array<Chart>=[];

  mainWindow={
    top:120,
    left:20,
  }
  subWindow={
    top:20,
    left:10,
  }
  
  tabCanvasId:Array<string>=['canvas1','canvas2','canvas3','canvas4'];

  //tabofLabels:Array<string>=['Calories burnt', 'Calories intake', 'Cholesterol', 'Saturated fat', 'Total fat', 'Proteins', 'Carbs','Sugar'];
  //tabofExistLabels:Array<boolean>=[true,true,true,true,true,true,true,false]
  tabOfLabelsColor:Array<string>=[];
  tabLabelRgba:Array<any>=[{
    slider: new classReturnColor,
    palette: new classReturnColor,
  }];

  tabOfLimitLabelsColor:Array<string>=[];
  tabLimitLabelRgba:Array<any>=[{
    slider: new classReturnColor,
    palette: new classReturnColor,
  }];
  
  returnTitleRgba={
    slider: new classReturnColor,
    palette: new classReturnColor,
  }

  returnLegendRgba={
    slider: new classReturnColor,
    palette: new classReturnColor,
  }
  returnCanvasRgba={
    slider: new classReturnColor,
    palette: new classReturnColor,
  }
  returnBoxRgba={
    slider: new classReturnColor,
    palette: new classReturnColor,
  }

  lineChartType:Array<string> = [];

  tabPeriod=['daily','weekly','monthly'];

  selectChart: FormGroup = new FormGroup({ 
    chartType: new FormControl({value:'line', disabled:true}, { nonNullable: true }),
    barThickness: new FormControl({value:'line', disabled:true}, { nonNullable: true }),
    chartTitle: new FormControl({value:'', disabled:true}, { nonNullable: true }),
    colorChartTitle:new FormControl({value:'', disabled:true}, { nonNullable: true }),
    ratio:new FormControl({value:0, disabled:true}, { nonNullable: true }),
    canvasWidth: new FormControl({value:0, disabled:true}, { nonNullable: true }),
    canvasHeight:new FormControl({value:0, disabled:true}, { nonNullable: true }),
    canvasMarginLeft:new FormControl({value:0, disabled:true}, { nonNullable: true }),
    stackedX:new FormControl({value:'', disabled:true}, { nonNullable: true }),
    stackedY:new FormControl({value:'', disabled:true}, { nonNullable: true }),
    canvasBackground: new FormControl({value:'', disabled:true}, { nonNullable: true }),
    legendTitle:new FormControl({value:'', disabled:true}, { nonNullable: true }),
    colorLegendTitle:new FormControl({value:'', disabled:true}, { nonNullable: true }),
    boxwidth:new FormControl({value:0, disabled:true}, { nonNullable: true }),
    boxheight:new FormControl({value:0, disabled:true}, { nonNullable: true }),
    boxpointStyle:new FormControl({value:'', disabled:true}, { nonNullable: true }),
    boxusePointStyle:new FormControl(false, { nonNullable: true }),
    boxcolor:new FormControl({value:'', disabled:true}, { nonNullable: true }),
    boxfontSize:new FormControl({value:0, disabled:true}, { nonNullable: true }),
    boxradius:new FormControl({value:0, disabled:true}, { nonNullable: true }),
    boxfontWeight:new FormControl({value:'', disabled:true}, { nonNullable: true }),
    boxfontFamily:new FormControl({value:'', disabled:true}, { nonNullable: true }),
    period:new FormControl({value:'', disabled:true}, { nonNullable: true }), //daily, weekly, monthly
    startRange: new FormControl({value:'', disabled:true},[
      Validators.required,
      // validates date format yyyy-mm-dd with regular expression
      Validators.pattern(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/)
      ]),
    endRange: new FormControl({value:'', disabled:true},[
      Validators.required,
      // validates date format yyyy-mm-dd with regular expression
      Validators.pattern(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/)
      ])
    });  
    


  selectTitle: FormGroup =new FormGroup({ 
    paddingTop:new FormControl({value:0, disabled:true}, { nonNullable: true }),
    paddingBottom:new FormControl({value:0, disabled:true}, { nonNullable: true }),
    paddingLeft:new FormControl({value:0, disabled:true}, { nonNullable: true }),
    position:new FormControl({value:'', disabled:true}, { nonNullable: true }),
    display:new FormControl(false, { nonNullable: true }),
    text:new FormControl({value:'', disabled:true}, { nonNullable: true }),
    align:new FormControl({value:'', disabled:true}, { nonNullable: true }),
    color:new FormControl({value:'', disabled:true}, { nonNullable: true }),
    paletteRgba:new FormControl({value:0, disabled:true}, { nonNullable: true }),
    paletteXpos:new FormControl({value:0, disabled:true}, { nonNullable: true }),
    paletteYpos:new FormControl({value:0, disabled:true}, { nonNullable: true }),
    sliderRgba:new FormControl({value:0, disabled:true}, { nonNullable: true }),
    sliderXpos:new FormControl({value:0, disabled:true}, { nonNullable: true }),
    sliderYpos:new FormControl({value:0, disabled:true}, { nonNullable: true }),
    fontSize:new FormControl({value:0, disabled:true}, { nonNullable: true }),
    fontWeight:new FormControl({value:'', disabled:true}, { nonNullable: true }),
    family:new FormControl({value:'', disabled:true}, { nonNullable: true })
  });



  selectAxisX: FormGroup =new FormGroup({ 
    borderColor:new FormControl({value:'', disabled:true}, { nonNullable: true }),
    borderWidth:new FormControl({value:0, disabled:true}, { nonNullable: true }),
    position:new FormControl({value:'', disabled:true}, { nonNullable: true }),
    stacked:new FormControl({value:'', disabled:true}, { nonNullable: true }),
    ticksColor:new FormControl({value:'', disabled:true}, { nonNullable: true }),
  });

  selectAxisY: FormGroup =new FormGroup({ 
    borderColor:new FormControl({value:'', disabled:true}, { nonNullable: true }),
    borderWidth:new FormControl({value:0, disabled:true}, { nonNullable: true }),
    position:new FormControl({value:'', disabled:true}, { nonNullable: true }),
    stacked:new FormControl({value:'', disabled:true}, { nonNullable: true }),
    ticksColor:new FormControl({value:'', disabled:true}, { nonNullable: true }),
  });


  canvas:Array<any>=[{
      width:'',
      height:'',
      background:'',
      marginLeft:'',
  }];

  overallTab:Array<any>=[
    {datasetBar:[],
    labelBar:[]}
  ]

  overallTabLimit:Array<any>=[
    {dataset:[],
    label:[]}
  ]


  // user by slider and palette
  my_input_child1:string='';
  my_input_child2:string='';
  my_output_child1:string='';
  my_output_child2:string='';

  selected_canvasColor:string='';
  selected_legendColor:string='';
  selected_boxColor:string='';
  selected_chartTitleColor:string='';
  selected_colorTitle:string="";
  selected_XBorderColor:string="";
  selected_YBorderColor:string="";
  selected_XTicksColor:string="";
  selected_YTicksColor:string="";

  selectedFields:Array<any>=[];
  selectedLimitFields:Array<any>=[];

  isSelectCanvasColor:boolean=false;
  isSelectLegendColor:boolean=false;
  isSelectLChartTitleColor:boolean=false;
  isSelectBoxColor:boolean=false;

  isSelectAxisXBorderColor:boolean=false;
  isSelectAxisXTicksColor:boolean=false;
  isSelectAxisYBorderColor:boolean=false;
  isSelectAxisYTicksColor:boolean=false;

  isTypeSelected:boolean=false;
  isPeriodSelected:boolean=false;
  isTestLineChart:boolean=false;

  isParamTitle:boolean=false;
  isParamLegend:boolean=false;
  isParamAxis:boolean=false;

  isFontWeight:boolean=false;
  isTextAlign:boolean=false;
  isTitlePosition:boolean=false;
  isTitleDisplay:boolean=false;

  isSelectChartTitleColor:boolean=false;

  isSelectXBorderColor:boolean=false;
  isSelectYBorderColor:boolean=false;
  isSelectXTicksColor:boolean=false;
  isSelectYTicksColor:boolean=false;
  isSliderSelected:boolean=false;
  

  returnXBorderColorRgba={
    slider:new classReturnColor,
    palette:new classReturnColor,
  
  };
  returnYBorderColorRgba={
    slider:new classReturnColor,
    palette:new classReturnColor,
  
  }
  returnXTicksRgba={
    slider:new classReturnColor,
    palette:new classReturnColor,
  
  };
  returnYTicksRgba={
    slider:new classReturnColor,
    palette:new classReturnColor,
  
  };
  dialogLabColor:Array<boolean>=[];
  dialogLimitLabColor:Array<boolean>=[];
  currentLabColor:number=0;
  isSelectLabColor:boolean=false;
  
  // from color-slider
  returnSlider={
    rgba:'',
    xPos:0,
    yPos:0
  }

  returnPalette={
    rgba:'',
    xPos:0,
    yPos:0
  }
  newtabChart:any;
  newtabCtx:any;

  isPosDivSlider:boolean=false;
  isPosDivSliderTrue:boolean=false;
  
  posDivPosSlider= new classPosDiv;
  posDivPosSliderTrue= new classPosDiv;

  tabFontWeight:Array<string>=["cancel","100","200","300","400","500","600","700","800","900","bold","bolder","lighter","normal"];
  tabTextAlign:Array<string>=["cancel","center","left","right","end","start","inherit","initial"];
  tabTitlePosition:Array<string>=["cancel","top","bottom"];
  tabDisplay:Array<boolean>=[false,true];

  eventClientY:number=0;
  eventPageY:number=0;
  @HostListener('window:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    //this.selectedPosition = { x: event.pageX, y: event.pageY };
    if (this.debugPhone===true){
        //this.getPosDivPosSliderTrue();
        this.posDivPosSliderTrue=getPosDiv("posDivSliderTrue");
        this.eventClientY=event.clientY;
        this.eventPageY=event.pageY;
    }
  
  }


  ngAfterViewInit(){ // this.ConfigChartHealth.barChart.length     
    for (var i=0; i<this.tabCanvasId.length; i++){
        this.tabChart[i]=document.getElementById(this.tabCanvasId[i]);
     
        this.tabCtx[i]=this.tabChart[i].getContext('2d');
        this.overallTab.push({datasetBar:[], labelBar:[]});
        this.overallTabLimit.push({dataset:[], label:[]});
        this.collectSpecialData(i, this.overallTab[i].datasetBar, this.overallTab[i].labelBar, this.overallTabLimit[i].dataset, this.overallTabLimit[i].label);        
    }
       //   TEST LINE CHART

    // this.isTestLineChart=true;
    // this.newtabChart=document.getElementById('myLineCanvas');
    // this.newtabCtx=this.newtabChart.getContext('2d');
    // this.testLineChart();
  }


ngOnInit() {
  console.log('===> ngOnInit report-health --- this.firstLoop=' + this.firstLoop);
  if (this.debugPhone===true){
      this.posDivPosSlider=getPosDiv("posDivSlider");
      //this.getPosDivPosSlider();
  }
  var i=0;
  this.posSlider.VerHor='H';
  this.posSlider.top=5;
  this.posSlider.left=60;
  this.posSlider.div.left=this.mainWindow.left + this.subWindow.left;
  this.posSlider.div.top=this.mainWindow.top + this.subWindow.top;
  this.posPalette.div.left=this.mainWindow.left + this.subWindow.left;
  this.posPalette.div.top=this.mainWindow.top + this.subWindow.top;
  this.posPalette.top=0;
  this.posPalette.left=60;
  for (i=0; i<this.ConfigChartHealth.barDefault.datasets.labels.length; i++){

      this.FillSelected.selected='N';
      this.ListChart.push(this.FormChart()); 
      this.ListChart.controls[i].setValue(this.FillSelected);
      this.selectedFields[i]='N';
      this.dialogLabColor[i]=false;
      if (i>0){
        const myRgba={slider: new classReturnColor, palette: new classReturnColor}
        this.tabLabelRgba.push(myRgba);
      }
  }

  for (i=0; i<this.ConfigChartHealth.barDefault.datasets.labelsLimits.length; i++){

    this.FillSelected.selected='N';
    this.ListChart.push(this.FormChart()); 
    this.ListChart.controls[i+this.ConfigChartHealth.barDefault.datasets.labels.length-1].setValue(this.FillSelected);

    this.selectedLimitFields[i]='N';
    this.dialogLimitLabColor[i]=false;
    if (i>0){
      const myRgba={slider: new classReturnColor, palette: new classReturnColor}
      this.tabLimitLabelRgba.push(myRgba);
    }
}

  // log which chart types are supported
  for (i=0; i<this.ConfigChartHealth.chartTypes.length; i++){
    this.lineChartType[i]=this.ConfigChartHealth.chartTypes[i];
  }

  this.tabParamChart.splice(0,this.tabParamChart.length);
  this.initTabParamChart.splice(0,this.initTabParamChart.length);
  if (this.INFileParamChart.fileType!==undefined && this.INFileParamChart.fileType!==''){
    for (i=0; i<4; i++){
      const classParam=new classTabFormChart;
      this.tabParamChart.push(classParam);
      this.fillInCharts(this.INFileParamChart.data[i],this.tabParamChart[i]);
      if (this.tabParamChart[i].labels.length===0){
        for (var k=0; k<this.ConfigChartHealth.barDefault.datasets.fieldsToSelect.length; k++){
          if (this.ConfigChartHealth.barDefault.datasets.fieldsToSelect[k]===false){
            this.tabParamChart[i].labels[k]='N';
          } else {
            this.tabParamChart[i].labels[k]='Y';
          }
        }
      }
      for (var j=0; j<this.tabParamChart[i].labelsColor.length; j++){
        if (this.tabParamChart[i].labelsColor[j]=== undefined || this.tabParamChart[i].labelsColor[j]===""){
          this.tabParamChart[i].labelsColor[j]=this.ConfigChartHealth.barDefault.datasets.borderColor[j];
        }
      }
      const initParam=new classTabFormChart;
      this.initTabParamChart.push(initParam);
      this.fillInCharts(this.INFileParamChart.data[i],this.initTabParamChart[i]);

      this.fillInFormFromTab(i);
      this.canvas.push({width:'',height:'',background:0, marginLeft:''});
      this.changeCanvas(i);
    } 
    } else {
      for (i=0; i<4; i++){
        const classParam=new classTabFormChart;
        this.tabParamChart.push(classParam);
        const initParam=new classTabFormChart;
        this.initTabParamChart.push(initParam);
        this.tabParamChart[this.tabParamChart.length-1].chartType='line';
        this.initTabParamChart[this.tabParamChart.length-1].chartType='line';

        this.tabParamChart[this.tabParamChart.length-1].chartTitle.display=this.ConfigChartHealth.barDefault.options.plugins.title.display;
        this.tabParamChart[this.tabParamChart.length-1].chartTitle.text=this.ConfigChartHealth.barDefault.options.plugins.title.text;
        this.tabParamChart[this.tabParamChart.length-1].chartTitle.position=this.ConfigChartHealth.barDefault.options.plugins.title.position;
        this.tabParamChart[this.tabParamChart.length-1].chartTitle.padding.top=this.ConfigChartHealth.barDefault.options.plugins.title.padding.top;
        this.tabParamChart[this.tabParamChart.length-1].chartTitle.padding.bottom=this.ConfigChartHealth.barDefault.options.plugins.title.padding.bottom;
        this.tabParamChart[this.tabParamChart.length-1].chartTitle.align=this.ConfigChartHealth.barDefault.options.plugins.title.align;
        this.tabParamChart[this.tabParamChart.length-1].chartTitle.color=this.ConfigChartHealth.barDefault.options.plugins.title.color;
        this.tabParamChart[this.tabParamChart.length-1].chartTitle.font.size=this.ConfigChartHealth.barDefault.options.plugins.title.font.size;
        this.tabParamChart[this.tabParamChart.length-1].chartTitle.font.weight=this.ConfigChartHealth.barDefault.options.plugins.title.font.weight;
        this.tabParamChart[this.tabParamChart.length-1].chartTitle.font.family=this.ConfigChartHealth.barDefault.options.plugins.title.font.family;

        this.tabParamChart[this.tabParamChart.length-1].legendTitle.display=this.ConfigChartHealth.barDefault.options.plugins.legend.title.display;
        this.tabParamChart[this.tabParamChart.length-1].legendTitle.text=this.ConfigChartHealth.barDefault.options.plugins.legend.title.text;
        this.tabParamChart[this.tabParamChart.length-1].legendTitle.position=this.ConfigChartHealth.barDefault.options.plugins.legend.title.position;
        this.tabParamChart[this.tabParamChart.length-1].legendTitle.padding.top=this.ConfigChartHealth.barDefault.options.plugins.legend.title.padding.top;
        this.tabParamChart[this.tabParamChart.length-1].legendTitle.padding.bottom=this.ConfigChartHealth.barDefault.options.plugins.legend.title.padding.bottom;
        this.tabParamChart[this.tabParamChart.length-1].legendTitle.padding.left=this.ConfigChartHealth.barDefault.options.plugins.legend.title.padding.left;
        this.tabParamChart[this.tabParamChart.length-1].legendTitle.align=this.ConfigChartHealth.barDefault.options.plugins.legend.title.align;
        this.tabParamChart[this.tabParamChart.length-1].legendTitle.color=this.ConfigChartHealth.barDefault.options.plugins.legend.title.color;
        this.tabParamChart[this.tabParamChart.length-1].legendTitle.font.size=this.ConfigChartHealth.barDefault.options.plugins.legend.title.font.size;
        this.tabParamChart[this.tabParamChart.length-1].legendTitle.font.weight=this.ConfigChartHealth.barDefault.options.plugins.legend.title.font.weight;
        this.tabParamChart[this.tabParamChart.length-1].legendTitle.font.family=this.ConfigChartHealth.barDefault.options.plugins.legend.title.font.family;

        this.tabParamChart[this.tabParamChart.length-1].legendBox.boxWidth=this.ConfigChartHealth.barDefault.options.plugins.legend.labels.boxWidth;
        this.tabParamChart[this.tabParamChart.length-1].legendBox.boxHeight=this.ConfigChartHealth.barDefault.options.plugins.legend.labels.boxHeight;
        this.tabParamChart[this.tabParamChart.length-1].legendBox.usePointStyle=this.ConfigChartHealth.barDefault.options.plugins.legend.labels.usePointStyle;
        this.tabParamChart[this.tabParamChart.length-1].legendBox.pointStyle=this.ConfigChartHealth.barDefault.options.plugins.legend.labels.pointStyle;
        this.tabParamChart[this.tabParamChart.length-1].legendBox.borderRadius=this.ConfigChartHealth.barDefault.options.plugins.legend.labels.borderRadius;
        this.tabParamChart[this.tabParamChart.length-1].legendBox.color=this.ConfigChartHealth.barDefault.options.plugins.legend.labels.color;
        this.tabParamChart[this.tabParamChart.length-1].legendBox.font.size=this.ConfigChartHealth.barDefault.options.plugins.legend.labels.font.size;
        this.tabParamChart[this.tabParamChart.length-1].legendBox.font.weight=this.ConfigChartHealth.barDefault.options.plugins.legend.labels.font.weight;
        this.tabParamChart[this.tabParamChart.length-1].legendBox.font.family=this.ConfigChartHealth.barDefault.options.plugins.legend.labels.font.family;
        
        this.tabParamChart[this.tabParamChart.length-1].bar=this.ConfigChartHealth.barChart.datasets;
        this.tabParamChart[this.tabParamChart.length-1].line=this.ConfigChartHealth.lineChart.datasetsDefault;

        this.tabParamChart[this.tabParamChart.length-1].canvasBackground=this.ConfigChartHealth.barDefault.canvas.backgroundcolor;
        this.tabParamChart[this.tabParamChart.length-1].canvasHeight=this.ConfigChartHealth.barDefault.canvas.height
        this.tabParamChart[this.tabParamChart.length-1].canvasMarginLeft=this.ConfigChartHealth.barDefault.canvas.marginleft;
        this.tabParamChart[this.tabParamChart.length-1].canvasWidth=this.ConfigChartHealth.barDefault.canvas.width;


        for (var l=0; l<this.ConfigChartHealth.barDefault.datasets.labelsLimits.length; l++){
          if (this.ConfigChartHealth.barDefault.datasets.fieldsLimitsToSelect[l]===true){
            this.tabParamChart[this.tabParamChart.length-1].limitLabels[l]="Y";
            this.selectedLimitFields[l]="Y";
          } else {
            this.tabParamChart[this.tabParamChart.length-1].limitLabels[l]="N";
            this.selectedLimitFields[l]="N";
          }
          if (l>0){
            const myLimitRgba={slider: new classReturnColor, palette: new classReturnColor}
            this.tabParamChart[this.tabParamChart.length-1].limitRgbaLabels.push(myLimitRgba);
          }
          
          this.tabParamChart[this.tabParamChart.length-1].limitRgbaLabels[l].palette.rgba="";
          this.tabParamChart[this.tabParamChart.length-1].limitRgbaLabels[l].palette.xPos=0;
          this.tabParamChart[this.tabParamChart.length-1].limitRgbaLabels[l].palette.yPos=0;
          this.tabParamChart[this.tabParamChart.length-1].limitRgbaLabels[l].slider.rgba="";
          this.tabParamChart[this.tabParamChart.length-1].limitRgbaLabels[l].slider.xPos=0;
          this.tabParamChart[this.tabParamChart.length-1].limitRgbaLabels[l].slider.yPos=0;
          this.tabParamChart[this.tabParamChart.length-1].limitLabelsColor[l]=this.ConfigChartHealth.barDefault.datasets.borderColorLimits[l];
        }

        for (var l=0; l<this.ConfigChartHealth.barDefault.datasets.fieldsToSelect.length; l++){
          if (this.ConfigChartHealth.barDefault.datasets.fieldsToSelect[l]===true){
              this.tabParamChart[this.tabParamChart.length-1].labels[l]="Y";
              this.selectedFields[l]="Y";

            } else {
              this.tabParamChart[this.tabParamChart.length-1].labels[l]="N";
              this.selectedFields[l]="N";
            }
            
            this.tabParamChart[this.tabParamChart.length-1].labelsColor[l]=this.ConfigChartHealth.barDefault.datasets.borderColor[l];
            if (l>0){
              const myRgba={slider: new classReturnColor, palette: new classReturnColor}
              this.tabParamChart[this.tabParamChart.length-1].rgbaLabels.push(myRgba);
            }
            this.tabParamChart[this.tabParamChart.length-1].rgbaLabels[l].palette.rgba="";
            this.tabParamChart[this.tabParamChart.length-1].rgbaLabels[l].palette.xPos=0;
            this.tabParamChart[this.tabParamChart.length-1].rgbaLabels[l].palette.yPos=0;
            this.tabParamChart[this.tabParamChart.length-1].rgbaLabels[l].slider.rgba="";
            this.tabParamChart[this.tabParamChart.length-1].rgbaLabels[l].slider.xPos=0;
            this.tabParamChart[this.tabParamChart.length-1].rgbaLabels[l].slider.yPos=0;
          }
       
        this.tabParamChart[this.tabParamChart.length-1].period='daily';
        this.tabParamChart[this.tabParamChart.length-1].ratio=2;

        this.tabParamChart[this.tabParamChart.length-1].axisX.border.color=this.ConfigChartHealth.barDefault.options.scales.axisX.border.color;
        this.tabParamChart[this.tabParamChart.length-1].axisX.border.width=this.ConfigChartHealth.barDefault.options.scales.axisX.border.width;
        this.tabParamChart[this.tabParamChart.length-1].axisX.position=this.ConfigChartHealth.barDefault.options.scales.axisX.position;
        this.tabParamChart[this.tabParamChart.length-1].axisX.stacked=this.ConfigChartHealth.barDefault.options.scales.axisX.stacked;
        this.tabParamChart[this.tabParamChart.length-1].axisX.ticks=this.ConfigChartHealth.barDefault.options.scales.axisX.ticks;

        this.tabParamChart[this.tabParamChart.length-1].axisY.border.color=this.ConfigChartHealth.barDefault.options.scales.axisY.border.color;
        this.tabParamChart[this.tabParamChart.length-1].axisY.border.width=this.ConfigChartHealth.barDefault.options.scales.axisY.border.width;
        this.tabParamChart[this.tabParamChart.length-1].axisY.position=this.ConfigChartHealth.barDefault.options.scales.axisY.position;
        this.tabParamChart[this.tabParamChart.length-1].axisY.stacked=this.ConfigChartHealth.barDefault.options.scales.axisY.stacked;
        this.tabParamChart[this.tabParamChart.length-1].axisY.ticks=this.ConfigChartHealth.barDefault.options.scales.axisY.ticks;


        this.tabParamChart[this.tabParamChart.length-1].legendBoxRgba.palette.rgba="";
        this.tabParamChart[this.tabParamChart.length-1].legendBoxRgba.palette.xPos=0;
        this.tabParamChart[this.tabParamChart.length-1].legendBoxRgba.palette.yPos=0;
        this.tabParamChart[this.tabParamChart.length-1].legendBoxRgba.slider.rgba="";
        this.tabParamChart[this.tabParamChart.length-1].legendBoxRgba.slider.xPos=0;
        this.tabParamChart[this.tabParamChart.length-1].legendBoxRgba.slider.yPos=0;
        this.fillInCharts(this.tabParamChart[this.tabParamChart.length-1], this.initTabParamChart[this.tabParamChart.length-1]);
        //this.fillInFormFromTab(i);
        this.canvas.push({width:'',height:'',background:0,marginLeft:''});
        this.changeCanvas(i);
      }
    }
  }
  
enableForm(){
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


disableForm(){
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

changeCanvas(i:number){
  if (this.tabParamChart[i].canvasHeight!==0){
    this.canvas[i].height=this.tabParamChart[i].canvasHeight;
  } else{
    this.canvas[i].height=this.ConfigChartHealth.barDefault.canvas.maxHeight;
  }
  if (this.tabParamChart[i].canvasWidth!==0){
    this.canvas[i].width=this.tabParamChart[i].canvasWidth;
  } else{
    this.canvas[i].width=this.ConfigChartHealth.barDefault.canvas.maxWidth;
  }
  if (this.tabParamChart[i].canvasBackground !==''){
    this.canvas[i].background=this.tabParamChart[i].canvasBackground;
  } else {
    this.canvas[i].background=this.ConfigChartHealth.barDefault.canvas.backgroundcolor;
  }
  if (this.tabParamChart[i].canvasMarginLeft !==0){
    this.canvas[i].marginLeft=this.tabParamChart[i].canvasMarginLeft;
  } else {
    this.canvas[i].marginLeft=this.ConfigChartHealth.barDefault.canvas.marginleft;
  }
  }


selectedChart:number=0;
SelChart(event:any){
  this.reportCheckLockLimit.emit({iWait:5,isDataModified:true,isSaveFile:false});

    if (this.selectedChart!==0){
    
      this.selected_canvasColor='';
      this.selected_legendColor='';
      this.selected_boxColor='';
      this.selected_chartTitleColor='';
      this.selected_colorTitle="";
      this.fillInTabOfCharts(this.selectedChart-1);

    }
    if (event.target.id==='Chart1'){
        this.selectedChart=1;
    } else if (event.target.id==='Chart2'){
        this.selectedChart=2;
    } else if (event.target.id==='Chart3'){
      this.selectedChart=3;
    } else if (event.target.id==='Chart4'){
      this.selectedChart=4;
    }
    this.fillInFormFromTab(this.selectedChart-1);
    if (this.debugPhone === true){
      this.posDivPosSlider=getPosDiv("posDivSlider");
      //this.getPosDivPosSlider();
    }
  
}

cancelChartParam(event:any){
  if (event.target.id==="allChartParam"){
    this.selectedChart=0;
    this.isParamTitle=false;
    this.isParamLegend=false;
    this.isParamAxis=false;
    this.isParamTitle=false;
    this.isParamLegend=false;
    this.isParamAxis=false;
    this.resetBooleans();

  } else   if (event.target.id==="chartTitle"){
    this.isParamTitle=false;
    this.isParamLegend=false;
  } else   if (event.target.id==="axis"){
    this.isParamAxis=false;
  } 
  
}

processAxis(event:any){
  this.isParamAxis=false;
  if (this.selectAxisX.controls['stacked'].value==='false'){
    this.tabParamChart[this.selectedChart-1].axisX.stacked=false;
  } else {
    this.tabParamChart[this.selectedChart-1].axisX.stacked=true;
  }
  if (this.selectAxisY.controls['stacked'].value==='false'){
    this.tabParamChart[this.selectedChart-1].axisY.stacked=false;
  } else {
    this.tabParamChart[this.selectedChart-1].axisY.stacked=true;
  }


  this.selectChart.controls['stackedX'].setValue(this.tabParamChart[this.selectedChart-1].axisX.stacked);
  this.selectChart.controls['stackedY'].setValue(this.tabParamChart[this.selectedChart-1].axisY.stacked);
}

fillInTabOfCharts(nb:number){

  this.tabParamChart[nb].chartType=this.selectChart.controls['chartType'].value.toLowerCase().trim();
  this.tabParamChart[nb].chartTitle.text=this.selectChart.controls['chartTitle'].value;
  
  this.tabParamChart[nb].legendTitle.text=this.selectChart.controls['legendTitle'].value;
  this.tabParamChart[nb].legendTitle.color=this.selectChart.controls['colorLegendTitle'].value;
  this.tabParamChart[nb].chartTitle.color=this.selectChart.controls['colorChartTitle'].value;
  this.fillRgba(this.returnTitleRgba,this.tabParamChart[nb].chartTitleRgba);
  this.fillRgba(this.returnLegendRgba,this.tabParamChart[nb].legendTitleRgba);
  this.tabParamChart[nb].ratio=this.selectChart.controls['ratio'].value;
  this.tabParamChart[nb].canvasWidth=this.selectChart.controls['canvasWidth'].value;
  this.tabParamChart[nb].canvasHeight=this.selectChart.controls['canvasHeight'].value;
  this.tabParamChart[nb].canvasBackground=this.selectChart.controls['canvasBackground'].value;
  this.tabParamChart[nb].canvasMarginLeft=this.selectChart.controls['canvasMarginLeft'].value;
  this.tabParamChart[nb].bar.barThickness=this.selectChart.controls['barThickness'].value;
  this.tabParamChart[nb].legendBox.boxWidth=this.selectChart.controls['boxwidth'].value;
  this.tabParamChart[nb].legendBox.boxHeight=this.selectChart.controls['boxheight'].value;
  this.tabParamChart[nb].legendBox.pointStyle=this.selectChart.controls['boxpointStyle'].value;
  this.tabParamChart[nb].legendBox.usePointStyle=this.selectChart.controls['boxusePointStyle'].value;
  this.tabParamChart[nb].legendBox.font.size=this.selectChart.controls['boxfontSize'].value;
  this.tabParamChart[nb].legendBox.font.weight=this.selectChart.controls['boxfontWeight'].value;
  this.tabParamChart[nb].legendBox.font.family=this.selectChart.controls['boxfontFamily'].value;
  this.tabParamChart[nb].legendBox.borderRadius=this.selectChart.controls['boxradius'].value;
  this.tabParamChart[nb].legendBox.color=this.selectChart.controls['boxcolor'].value;
  this.fillRgba(this.returnBoxRgba,this.tabParamChart[nb].legendBoxRgba);

  if ( (typeof this.selectChart.controls['stackedX'].value==='string' && this.selectChart.controls['stackedX'].value==='false')
        || (typeof this.selectChart.controls['stackedX'].value==='boolean' && this.selectChart.controls['stackedX'].value===false)){
    this.tabParamChart[nb].axisX.stacked=false;
  } else {
    this.tabParamChart[nb].axisX.stacked=true;
  }
  if ( (typeof this.selectChart.controls['stackedY'].value==='string' && this.selectChart.controls['stackedY'].value==='false')
  || (typeof this.selectChart.controls['stackedY'].value==='boolean' && this.selectChart.controls['stackedY'].value===false)){
    this.tabParamChart[nb].axisY.stacked=false;
  } else {
    this.tabParamChart[nb].axisY.stacked=true;
  }
  
  this.tabParamChart[nb].axisX.border.color=this.selectAxisX.controls['borderColor'].value;
  this.tabParamChart[nb].axisX.border.width=this.selectAxisX.controls['borderWidth'].value;
  this.tabParamChart[nb].axisX.position=this.selectAxisX.controls['position'].value;
  this.tabParamChart[nb].axisX.ticks.color=this.selectAxisX.controls['ticksColor'].value;

  this.tabParamChart[nb].axisY.border.color=this.selectAxisY.controls['borderColor'].value;
  this.tabParamChart[nb].axisY.border.width=this.selectAxisY.controls['borderWidth'].value;
  this.tabParamChart[nb].axisY.position=this.selectAxisY.controls['position'].value;
  this.tabParamChart[nb].axisY.ticks.color=this.selectAxisY.controls['ticksColor'].value;

  this.tabParamChart[nb].period=this.selectChart.controls['period'].value.toLowerCase().trim();
  this.tabParamChart[nb].startRange=this.selectChart.controls['startRange'].value;
  this.tabParamChart[nb].endRange=this.selectChart.controls['endRange'].value;

  for (var i=0; i<this.selectedFields.length; i++){
    this.tabParamChart[nb].labels[i]=this.selectedFields[i];
    this.tabParamChart[nb].labelsColor[i]= this.tabOfLabelsColor[i];
    this.fillRgba(this.tabLabelRgba[i],this.tabParamChart[nb].rgbaLabels[i]);
  }

  for (var i=0; i<this.selectedLimitFields.length; i++){
    this.tabParamChart[nb].limitLabels[i]=this.selectedLimitFields[i];
    this.tabParamChart[nb].limitLabelsColor[i]= this.tabOfLimitLabelsColor[i];
    this.fillRgba(this.tabLimitLabelRgba[i],this.tabParamChart[nb].limitRgbaLabels[i]);
  }

  this.fillRgba(this.returnCanvasRgba,this.tabParamChart[nb].rgbaCanvas);

}


fillInCharts(inFile:any,outFile:any){

  outFile.chartType=inFile.chartType.toLowerCase().trim();
  outFile.chartTitle.display=inFile.chartTitle.display;
  outFile.chartTitle.text=inFile.chartTitle.text;
  outFile.chartTitle.position=inFile.chartTitle.position;
  outFile.chartTitle.padding.top=inFile.chartTitle.padding.top;
  outFile.chartTitle.padding.bottom=inFile.chartTitle.padding.bottom;
  outFile.chartTitle.align=inFile.chartTitle.align;
  outFile.chartTitle.color=inFile.chartTitle.color;
  outFile.chartTitle.font.size=inFile.chartTitle.font.size;
  outFile.chartTitle.font.weight=inFile.chartTitle.font.weight;
  outFile.chartTitle.font.family=inFile.chartTitle.font.family;

  outFile.legendTitle.display=inFile.legendTitle.display;
  outFile.legendTitle.text=inFile.legendTitle.text;
  outFile.legendTitle.position=inFile.legendTitle.position;
  outFile.legendTitle.padding.top=inFile.legendTitle.padding.top;
  outFile.legendTitle.padding.bottom=inFile.legendTitle.padding.bottom;
  outFile.legendTitle.padding.left=inFile.legendTitle.padding.left;
  outFile.legendTitle.align=inFile.legendTitle.align;
  outFile.legendTitle.color=inFile.legendTitle.color;
  outFile.legendTitle.font.size=inFile.legendTitle.font.size;
  outFile.legendTitle.font.weight=inFile.legendTitle.font.weight;
  outFile.legendTitle.font.family=inFile.legendTitle.font.family;

  this.fillRgba(inFile.chartTitleRgba, outFile.chartTitleRgba);
  this.fillRgba(inFile.legendTitleRgba, outFile.legendTitleRgba);

  outFile.bar=inFile.bar;
  outFile.line=inFile.line;

  outFile.ratio=inFile.ratio;
  outFile.canvasWidth=inFile.canvasWidth;
  outFile.canvasHeight=inFile.canvasHeight;
  outFile.canvasBackground=inFile.canvasBackground;
  outFile.canvasMarginLeft=inFile.canvasMarginLeft;
  this.fillRgba(inFile.rgbaCanvas, outFile.rgbaCanvas);
  
  

  outFile.axisX.stacked=inFile.axisX.stacked;
  outFile.axisX.border.color=inFile.axisX.border.color;
  outFile.axisX.border.width=inFile.axisX.border.width;
  outFile.axisX.position =inFile.axisX.position ;
  outFile.axisX.ticks =inFile.axisX.ticks ;

  outFile.axisY.stacked=inFile.axisY.stacked;
  outFile.axisY.border.color=inFile.axisY.border.color;
  outFile.axisY.border.width=inFile.axisY.border.width;
  outFile.axisY.position =inFile.axisY.position ;
  outFile.axisY.ticks =inFile.axisY.ticks ;

  outFile.period=inFile.period.toLowerCase().trim();
  outFile.startRange=inFile.startRange;
  outFile.endRange=inFile.endRange;
 
  outFile.legendBox.boxWidth=inFile.legendBox.boxWidth;
  outFile.legendBox.boxHeight=inFile.legendBox.boxHeight;
  outFile.legendBox.borderRadius=inFile.legendBox.borderRadius;
  outFile.legendBox.font.size=inFile.legendBox.font.size;
  outFile.legendBox.font.weight=inFile.legendBox.font.weight;
  outFile.legendBox.font.family=inFile.legendBox.font.family;
  outFile.legendBox.pointStyle=inFile.legendBox.pointStyle;
  outFile.legendBox.usePointStyle=inFile.legendBox.usePointStyle;
  outFile.legendBox.color=inFile.legendBox.color;
  outFile.legendBoxRgba.palette.rgba=inFile.legendBoxRgba.palette.rgba;
  this.fillRgba(inFile.legendBoxRgba, outFile.legendBoxRgba);

  for (var i=0; i<inFile.labels.length; i++){
    outFile.labels[i]=inFile.labels[i];
    outFile.labelsColor[i]=inFile.labelsColor[i];
    if (outFile.rgbaLabels[i]===undefined){
        const myRgba={slider: new classReturnColor, palette: new classReturnColor}
        outFile.rgbaLabels.push(myRgba);
      }
    this.fillRgba(inFile.rgbaLabels[i], outFile.rgbaLabels[i]);
  }
  for (var i=0; i<inFile.limitLabels.length; i++){
    outFile.limitLabels[i]=inFile.limitLabels[i];
    outFile.limitLabelsColor[i]=inFile.limitLabelsColor[i];
    if (outFile.limitRgbaLabels[i]===undefined){
      const myRgba={slider: new classReturnColor, palette: new classReturnColor}
      outFile.limitRgbaLabels.push(myRgba);
    }
    this.fillRgba(inFile.limitRgbaLabels[i], outFile.limitRgbaLabels[i]);
  }
 
}

fillRgba(inFile:any,outFile:any){
  outFile.palette.rgba=inFile.palette.rgba;
  outFile.palette.xPos=inFile.palette.xPos;
  outFile.palette.yPos=inFile.palette.yPos;
  outFile.slider.rgba=inFile.slider.rgba;
  outFile.slider.xPosa=inFile.slider.xPos;
  outFile.slider.yPos=inFile.slider.xPoy;
}


fillInFormFromTab(nb:number){
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
  this.selected_XTicksColor=this.tabParamChart[nb].axisX.ticks.color;
  this.selected_XBorderColor=this.tabParamChart[nb].axisX.border.color;
  this.selected_YTicksColor=this.tabParamChart[nb].axisY.ticks.color;
  this.selected_YBorderColor=this.tabParamChart[nb].axisY.border.color;


  this.selectChart.controls['period'].setValue(this.tabParamChart[nb].period.toLowerCase().trim());
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
  this.selected_canvasColor=this.tabParamChart[nb].canvasBackground;
  this.selected_chartTitleColor=this.tabParamChart[nb].chartTitle.color;
  this.selected_legendColor=this.tabParamChart[nb].legendTitle.color;
  this.selected_boxColor=this.tabParamChart[nb].legendBox.color;
  if (this.isParamLegend===true){
    this.selected_colorTitle = this.selected_legendColor;
  } else if (this.isParamTitle===true){
    this.selected_colorTitle = this.selected_chartTitleColor;
  }


  for (var i=0; i<this.tabParamChart[nb].labels.length; i++){
    this.selectedFields[i]=this.tabParamChart[nb].labels[i];
    this.tabOfLabelsColor[i]=this.tabParamChart[nb].labelsColor[i]; 
    this.tabLabelRgba=this.tabParamChart[nb].rgbaLabels;
    this.fillRgba(this.tabParamChart[nb].rgbaLabels[i], this.tabLabelRgba[i]);
  }
  for (var i=0; i<this.tabParamChart[nb].limitLabels.length; i++){
    this.selectedLimitFields[i]=this.tabParamChart[nb].limitLabels[i];
    this.tabOfLimitLabelsColor[i]=this.tabParamChart[nb].limitLabelsColor[i]; 
    this.fillRgba(this.tabParamChart[nb].limitRgbaLabels[i], this.tabLimitLabelRgba[i]);
  }
}

transferTitle(id:string, outFile:any, outRgba:any){
this.resetBooleans();
this.isParamTitle=false;
this.isParamLegend=false;

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

  if (id==='viewChartTitle'){
      this.isParamTitle=true;
      this.selectTitle.controls['text'].setValue(this.selectChart.controls['chartTitle'].value);
      this.selectTitle.controls['color'].setValue(this.selectChart.controls['colorChartTitle'].value);
      this.selected_colorTitle=this.selectChart.controls['colorChartTitle'].value;
  } else if (id==='viewLegendTitle'){
    this.selectTitle.controls['paddingLeft'].setValue(this.tabParamChart[this.selectedChart-1].legendTitle.padding.left);
    this.selectTitle.controls['text'].setValue(this.selectChart.controls['legendTitle'].value);
    this.selectTitle.controls['color'].setValue(this.selectChart.controls['colorLegendTitle'].value);
    this.isParamLegend=true;
    this.selected_colorTitle=this.selectChart.controls['colorLegendTitle'].value;
  }
}

processTitle(){
  if (this.isParamTitle===true){
    this.fillTabTitle(this.tabParamChart[this.selectedChart-1].chartTitle, this.tabParamChart[this.selectedChart-1].chartTitleRgba);
    this.fillInFormFromTab(this.selectedChart-1);
    this.isParamTitle=false;
  } else if (this.isParamLegend===true){
    this.fillTabTitle(this.tabParamChart[this.selectedChart-1].legendTitle, this.tabParamChart[this.selectedChart-1].legendTitleRgba);
    this.isParamLegend=false;
  }
  this.selected_colorTitle="";
}

fillTabTitle(outFile:any,outRgba:any){
    outFile.text=this.selectTitle.controls['text'].value;
    outFile.font.weight=this.selectTitle.controls['fontWeight'].value;
    outFile.font.size=this.selectTitle.controls['fontSize'].value;
    outFile.font.family=this.selectTitle.controls['family'].value;
    outFile.align=this.selectTitle.controls['align'].value;
    outFile.position=this.selectTitle.controls['position'].value;
    outFile.display=this.selectTitle.controls['display'].value;
    outFile.color=this.selectTitle.controls['color'].value;
    outFile.padding.top=this.selectTitle.controls['paddingTop'].value;
    outFile.padding.bottom=this.selectTitle.controls['paddingBottom'].value;

    outRgba.palette.rgba=this.selectTitle.controls['paletteRgba'].value;
    outRgba.palette.xPos=this.selectTitle.controls['paletteXpos'].value;
    outRgba.palette.yPos=this.selectTitle.controls['paletteYpos'].value;
    outRgba.slider.rgba=this.selectTitle.controls['sliderRgba'].value;
    outRgba.slider.xPos=this.selectTitle.controls['sliderXpos'].value;
    outRgba.slider.yPos=this.selectTitle.controls['sliderYpos'].value;

    if (this.isParamLegend===true){
      outFile.padding.left=this.selectTitle.controls['paddingLeft'].value;

      this.selectChart.controls['legendTitle'].setValue(outFile.text);
      this.selectChart.controls['colorLegendTitle'].setValue(outFile.color);

      
    } else  if (this.isParamTitle===true){
      outFile.padding.left=this.selectTitle.controls['paddingLeft'].value;
      this.selectChart.controls['chartTitle'].setValue(outFile.text);
      this.selectChart.controls['colorChartTitle'].setValue(outFile.color);

      
    }
  
   
}

selectType(event:any){
  this.resetBooleans();
  if (event.target.id==='selType'){
    this.isTypeSelected=true;
  } else if (event.target.id==='selectedType'){
    this.isTypeSelected=false;
    this.selectChart.controls['chartType'].setValue(event.target.textContent.trim());
  } else if (event.target.textContent.trim()!=="cancel"){
    if (event.target.id==='viewChartTitle'){
      this.transferTitle(event.target.id, this.tabParamChart[this.selectedChart-1].chartTitle, this.tabParamChart[this.selectedChart-1].chartTitleRgba);
    } else if (event.target.id==='viewLegendTitle'){
      this.transferTitle(event.target.id, this.tabParamChart[this.selectedChart-1].legendTitle, this.tabParamChart[this.selectedChart-1].legendTitleRgba);
    } else if (event.target.id==='viewAxis'){
      this.isParamAxis=true;
    }else 
    if (event.target.id==='selFontWeight'){
      this.isFontWeight=true;
    } else if (event.target.id==='selectedFontWeight'){
      this.isFontWeight=false;
      this.selectTitle.controls['fontWeight'].setValue(event.target.textContent.trim());
    } else if (event.target.id==='selTextAlign'){
      this.isTextAlign=true;
    } else if (event.target.id==='selectedTextAlign'){
      this.isTextAlign=false;
      this.selectTitle.controls['align'].setValue(event.target.textContent.trim());
    } else if (event.target.id==='selTitlePosition'){
      this.isTitlePosition=true;
    } else if (event.target.id==='selectedTitlePosition'){
      this.isTitlePosition=false;
      this.selectTitle.controls['position'].setValue(event.target.textContent.trim());
    } else if (event.target.id==='selTitleDisplay'){
      this.isTitleDisplay=true;
    } else if (event.target.id==='selectedTitleDisplay'){
      this.isTitleDisplay=false;
      this.selectTitle.controls['display'].setValue(event.target.textContent.trim());
    }
  } else {this.resetBooleans();}
  
 
}

selectPeriod(event:any){
  this.resetBooleans();
  if (event.target.id==='selPeriod'){
    this.isPeriodSelected=true;
  } else if (event.target.id==='selectedPeriod'){
    this.isPeriodSelected=false;
    this.selectChart.controls['period'].setValue(event.target.textContent.toLowerCase().trim());
  }
}

resetBooleans(){
  this.isTypeSelected=false;
  this.isPeriodSelected=false;
  this.isSelectLegendColor=false;
  this.isSelectBoxColor=false;
  this.isSelectCanvasColor=false;
  this.isSelectLChartTitleColor=false;
  this.isSelectChartTitleColor=false;
  this.isSelectLabColor=false;
  this.dialogLabColor[this.currentLabColor]=false;

  this.isSliderSelected=false;
  //this.selectedChart=0;

  this.isFontWeight=false;
  this.isTextAlign=false;
  this.isTitlePosition=false;
  this.isTitleDisplay=false;

  this.isSelectXBorderColor=false;
  this.isSelectXTicksColor=false;
  this.isSelectYBorderColor=false;
  this.isSelectYTicksColor=false;
  this.isPosDivSliderTrue=false;
}


selectColorAxis(event:any){
  if (this.tabLock.lock!==2){
    this.resetBooleans();
    this.mainWindow.top=120;
    this.posSlider.div.top=this.mainWindow.top + this.subWindow.top;
    if (event==="xBorderColor"){
      this.isSelectXBorderColor=true;
      this.my_input_child1=this.selected_XBorderColor;
      this.my_input_child2=this.selected_XBorderColor;
      this.returnSlider=this.returnXBorderColorRgba.slider;
      this.returnPalette=this.returnXBorderColorRgba.palette;
      
    } else if (event==="xTicksColor"){
      this.isSelectXTicksColor=true;
      this.my_input_child1=this.selected_XTicksColor;
      this.my_input_child2=this.selected_XTicksColor;
      this.returnSlider=this.returnXTicksRgba.slider;
      this.returnPalette=this.returnXTicksRgba.palette;

    } else if (event==="yBorderColor"){
      this.isSelectYBorderColor=true;
      this.my_input_child1=this.selected_YBorderColor;
      this.my_input_child2=this.selected_YBorderColor;
      this.returnSlider=this.returnYBorderColorRgba.slider;
      this.returnPalette=this.returnYBorderColorRgba.palette;

    } else if (event==="yTicksColor"){
      this.isSelectYTicksColor=true;
      this.my_input_child1=this.selected_YTicksColor;
      this.my_input_child2=this.selected_YTicksColor;
      this.returnSlider=this.returnYTicksRgba.slider;
      this.returnPalette=this.returnYTicksRgba.palette;

    }
    this.isSliderSelected=true;
  }
}



selectColor(event:any){
  if (this.tabLock.lock!==2){
      this.resetBooleans();
      
      this.mainWindow.top=120;
      this.posSlider.div.top=this.mainWindow.top + this.subWindow.top;
      if (event==='canvasColor'){
        this.isSelectCanvasColor=true;
        this.my_input_child1=this.selected_canvasColor;
        this.my_input_child2=this.selected_canvasColor;
        this.returnSlider=this.returnCanvasRgba.slider;
        this.returnPalette=this.returnCanvasRgba.palette;
        this.isSliderSelected=true;
      } else if (event==='legendColor'  || (event==='colorTitle' && this.isParamLegend===true)){
        this.my_input_child1=this.selected_legendColor;
        this.my_input_child2=this.selected_legendColor;
        this.returnSlider=this.returnLegendRgba.slider;
        this.returnPalette=this.returnLegendRgba.palette;
        if (this.isParamLegend===true){
          this.isSelectLChartTitleColor=true;
        } else {
          this.isSelectLegendColor=true;
        }
        this.isSliderSelected=true;
      } else if (event==='colorChartTitle'  || (event==='colorTitle' && this.isParamTitle===true)){
        this.my_input_child1=this.selected_chartTitleColor;
        this.my_input_child2=this.selected_chartTitleColor;
        this.returnSlider=this.returnTitleRgba.slider;
        this.returnPalette=this.returnTitleRgba.palette;
        if (this.isParamTitle===true){
          this.isSelectLChartTitleColor=true;
        } else {
          this.isSelectChartTitleColor=true;
        }
        this.isSliderSelected=true;
      } else if (event==="boxColor"){
        this.isSelectBoxColor=true;
        this.my_input_child1=this.selected_boxColor;
        this.my_input_child2=this.selected_boxColor;
        this.returnSlider=this.returnBoxRgba.slider;
        this.returnPalette=this.returnBoxRgba.palette;
        this.isSliderSelected=true;
      }
      
      else if (event==='fieldCanvasColor'){ //  
        this.selected_canvasColor=this.selectChart.controls["canvasBackground"].value;
        this.initRgba(this.returnCanvasRgba);
      } else if (event==='fieldLegendColor' || (event==='fieldColorTitle' && this.isParamLegend===true) ){
        this.selected_legendColor=this.selectChart.controls["colorLegendTitle"].value;
        this.initRgba(this.returnLegendRgba);
      } else if (event==='fieldColorChartTitle'  || (event==='fieldColorTitle' && this.isParamTitle===true)){ 
        this.selected_chartTitleColor=this.selectChart.controls["colorChartTitle"].value;
        this.initRgba(this.returnTitleRgba);
      }  else if (event==='fieldBoxColor'){ 
        this.selected_boxColor=this.selectChart.controls["boxcolor"].value;
        this.initRgba(this.returnBoxRgba);
      } else if (event==='fieldBoxColor'){ 
        this.selected_boxColor=this.selectChart.controls["boxcolor"].value;
        this.initRgba(this.returnBoxRgba);
      } else if (event==='fieldXColorBorder'){ 
        this.selected_XBorderColor=this.selectAxisX.controls["borderColor"].value;
        this.initRgba(this.returnBoxRgba);
      } else if (event==='fieldXTicksColor'){ 
        this.selected_XTicksColor=this.selectAxisX.controls["ticksColor"].value;
        this.initRgba(this.returnBoxRgba);
      } else if (event==='fieldYColorBorder'){ 
        this.selected_YBorderColor=this.selectAxisY.controls["borderColor"].value;
        this.initRgba(this.returnBoxRgba);
      } else if (event==='fieldYTicksColor'){ 
        this.selected_YTicksColor=this.selectAxisY.controls["ticksColor"].value;
        this.initRgba(this.returnBoxRgba);
      }


      if (this.returnSlider.rgba!==''){
        this.my_input_child2=this.returnSlider.rgba;
      }
      if (this.returnPalette.rgba!==''){
        this.my_input_child1=this.returnPalette.rgba;
        this.temporaryColor=this.returnPalette.rgba;
      }
  }
}

initRgba(event:any){
  event.slider.xPos=0;
  event.slider.yPos=0;
  event.slider.rgba='';
  event.palette.xPos=0;
  event.palette.yPos=0;
  event.palette.rgba='';
}


fnSlider(event:any){ 
    this.my_input_child1=event; //used by palette
    this.my_input_child2=event; //used by slider
  }

fnSliderBis(event:any){ 
    this.returnSlider=event; // returned by slider
  }

fnPaletteBis(event:any){ 
  this.returnPalette=event;
  }

temporaryColor:string='';
fnPalette(event:any){ 
  if (this.debugPhone===true){
      //this.getPosDivPosSliderTrue();
      this.posDivPosSliderTrue=getPosDiv("posDivSliderTrue");
  }
  this.temporaryColor=event;
  }


fnExitPalette(event:any){
  if (this.tabLock.lock!==2){
      if (event==='Cancel'){
        this.resetBooleans();
      } else if (event==='Save'){
        if (this.isSelectCanvasColor===true){
          this.selected_canvasColor = this.temporaryColor;
          this.returnCanvasRgba.palette=this.returnPalette; 
          this.returnCanvasRgba.slider=this.returnSlider;
          this.isSelectCanvasColor=false;
          this.selectChart.controls['canvasBackground'].setValue(this.temporaryColor);
        } else if (this.isSelectLegendColor===true || (this.isParamLegend===true && this.isSelectLChartTitleColor===true)){
          this.selected_legendColor = this.temporaryColor;
          this.isSelectLegendColor=false;
          this.returnLegendRgba.palette=this.returnPalette;
          this.returnLegendRgba.slider=this.returnSlider;
          this.selectChart.controls['colorLegendTitle'].setValue(this.temporaryColor);
          
        } else if (this.isSelectChartTitleColor===true || (this.isParamTitle===true && this.isSelectLChartTitleColor===true)){
          this.selected_chartTitleColor = this.temporaryColor;
          this.isSelectChartTitleColor=false;
          this.returnTitleRgba.palette=this.returnPalette;
          this.returnTitleRgba.slider=this.returnSlider;
          
          this.selectChart.controls['colorChartTitle'].setValue(this.temporaryColor);

        } else if (this.isSelectLabColor===true) {
          if (this.dialogLabColor[this.currentLabColor]===true){
            this.tabOfLabelsColor[this.currentLabColor]= this.temporaryColor;
            this.tabLabelRgba[this.currentLabColor].palette=this.returnPalette;
            this.tabLabelRgba[this.currentLabColor].slider=this.returnSlider;
            this.isSelectLabColor=false;
            this.dialogLabColor[this.currentLabColor]=false;
          } else if (this.dialogLimitLabColor[this.currentLabColor]===true){
            this.tabOfLimitLabelsColor[this.currentLabColor]= this.temporaryColor;
            this.tabLimitLabelRgba[this.currentLabColor].palette=this.returnPalette;
            this.tabLimitLabelRgba[this.currentLabColor].slider=this.returnSlider;
            this.isSelectLabColor=false;
            this.dialogLimitLabColor[this.currentLabColor]=false;
          } 
          
        } else if (this.isSelectBoxColor===true){
          this.selected_boxColor = this.temporaryColor;
          this.selectChart.controls['boxcolor'].setValue(this.temporaryColor);
          this.returnBoxRgba.palette=this.returnPalette;
          this.returnBoxRgba.slider=this.returnSlider;
          this.isSelectBoxColor=false;
        } else if (this.isSelectXBorderColor===true){
          this.selected_XBorderColor = this.temporaryColor;
          this.selectAxisX.controls['borderColor'].setValue(this.temporaryColor);
          this.returnXBorderColorRgba.palette=this.returnPalette;
          this.returnXBorderColorRgba.slider=this.returnSlider;
          this.isSelectXBorderColor=false;
        } else if (this.isSelectXTicksColor===true){
          this.selected_XTicksColor = this.temporaryColor;
          this.selectAxisX.controls['ticksColor'].setValue(this.temporaryColor);
          this.returnXTicksRgba.palette=this.returnPalette;
          this.returnXTicksRgba.slider=this.returnSlider;
          this.isSelectXTicksColor=false;
        } else if (this.isSelectYBorderColor===true){
          this.selected_YBorderColor = this.temporaryColor;
          this.selectAxisY.controls['borderColor'].setValue(this.temporaryColor);
          this.returnYBorderColorRgba.palette=this.returnPalette;
          this.returnYBorderColorRgba.slider=this.returnSlider;
          this.isSelectYBorderColor=false;
        } else if (this.isSelectYTicksColor===true){
          this.selected_YTicksColor = this.temporaryColor;
          this.selectAxisY.controls['ticksColor'].setValue(this.temporaryColor);
          this.returnYTicksRgba.palette=this.returnPalette;
          this.returnYTicksRgba.slider=this.returnSlider;
          this.isSelectYTicksColor=false;
        }

        if (this.isSelectLChartTitleColor===true){
          this.selected_colorTitle=this.temporaryColor;
          this.isSelectLChartTitleColor=false;
          this.selectTitle.controls['color'].setValue(this.temporaryColor);
          this.selectTitle.controls['paletteRgba'].setValue(this.returnPalette.rgba);
          this.selectTitle.controls['paletteXpos'].setValue(this.returnPalette.xPos);
          this.selectTitle.controls['paletteYpos'].setValue(this.returnPalette.yPos);
          this.selectTitle.controls['sliderRgba'].setValue(this.returnSlider.rgba);
          this.selectTitle.controls['sliderXpos'].setValue(this.returnSlider.xPos);
          this.selectTitle.controls['sliderYpos'].setValue(this.returnSlider.yPos);
        }

        } 
        this.isSliderSelected=false;
    }
}



error_msg:string='';
fnSelectChart(){
  this.error_msg='';

      // check that all parameters are correct
      if (this.selectChart.controls['chartType'].value!==''){
        for ( var i=0; i< this.lineChartType.length && this.selectChart.controls['chartType'].value.toLowerCase().trim()!==this.lineChartType[i].toLowerCase().trim(); i++){
        }
        if (i === this.lineChartType.length){
          this.error_msg='Field TYPE is unknown; please update it';
        }
      } 
      if (this.error_msg==='' && this.selectChart.controls['period'].value!==''){
          for ( var i=0; i< this.tabPeriod.length && this.selectChart.controls['period'].value.toLowerCase().trim()!==this.tabPeriod[i].toLowerCase().trim(); i++){
          }
          if (i === this.tabPeriod.length){
            this.error_msg='Field PERIOD is unknown; please update it';
          }
      } 
      if (this.error_msg==='' && this.selectChart.controls['startRange'].value !=='' && this.selectChart.controls['endRange'].value !=='' && this.selectChart.controls['endRange'].value<this.selectChart.controls['startRange'].value){
            this.error_msg='end date cannot be before start date; please update';
      } 
      
      if (this.error_msg==='' && isNaN(this.selectChart.controls['canvasWidth'].value)){
        this.error_msg='Field CANVAS WIDTH is not a numeric';
      }  
      if (this.error_msg==='' && isNaN(this.selectChart.controls['canvasHeight'].value)){
        this.error_msg='Field CANVAS HEIGHT is not a numeric';
      } 
      if (this.error_msg==='' && isNaN(this.selectChart.controls['ratio'].value)){
        this.error_msg='Field RATIO is not a numeric';
      }
      if (this.error_msg ===''){
        this.fillInTabOfCharts(this.selectedChart-1);
        this.buildChart(this.selectedChart-1);
      }

}

returnEmit={
  saveAction:'',
  saveCode:''
}


SaveCancel(event:string){
    this.error_msg='';
    if (event==='save'){
      this.fillInTabOfCharts(this.selectedChart-1);
      if (this.error_msg===''){
        this.fillInCharts(this.tabParamChart[this.selectedChart-1],this.initTabParamChart[this.selectedChart-1]);
        this.returnEmit.saveAction='save';
        this.returnFile.emit(this.initTabParamChart);

      }

    } else if (event==='saveAll'){
      this.fillInTabOfCharts(this.selectedChart-1);
      if (this.error_msg===''){
          for (var i=0; i<this.tabParamChart.length; i++){
            this.fillInCharts(this.tabParamChart[i],this.initTabParamChart[i]);
          }
          this.returnEmit.saveAction='saveAll';
          this.returnFile.emit(this.tabParamChart);
          
      } 
    } else if (event==='cancelAll'){
      this.cancelSaveOther.emit(5);
      this.resetBooleans();
      for (var i=0; i<this.tabParamChart.length; i++){
        this.fillInCharts(this.initTabParamChart[i],this.tabParamChart[i]);
        this.fillInFormFromTab(i);
        this.buildChart(i);
      }
    } else if (event==='cancelOne'){
      this.cancelSaveOther.emit(5);
      this.resetBooleans();
      this.fillInCharts(this.initTabParamChart[this.selectedChart-1],this.tabParamChart[this.selectedChart-1]);
      this.fillInFormFromTab(this.selectedChart-1);
      this.buildChart(this.selectedChart-1);
    } 
}

buildChart(nb:number){
  
  this.changeCanvas(nb);
  //if (this.tabParamChart[nb].chartType==='bar'){
    this.myTabChart[nb].destroy();
    this.collectSpecialData(nb, this.overallTab[nb].datasetBar, this.overallTab[nb].labelBar, this.overallTabLimit[nb].dataset, this.overallTabLimit[nb].label);  
  //}
}


selectLabelColor(event:any){
  if (this.tabLock.lock!==2){
      const i=event.target.id.indexOf('-');
      this.dialogLabColor[this.currentLabColor]=false;
      this.dialogLimitLabColor[this.currentLabColor]=false;
      this.currentLabColor= Number(event.target.id.substring(i+1));
      if (event.target.id.substring(0,i)==="labelLimitColor"){
        this.dialogLimitLabColor[this.currentLabColor]=true;
      } else {
        this.dialogLabColor[this.currentLabColor]=true;
      }

      this.isSelectLabColor=true;


      this.returnPalette=this.tabLabelRgba[this.currentLabColor].palette;
      this.returnSlider=this.tabLabelRgba[this.currentLabColor].slider;

      if (this.returnSlider.rgba!==''){
        this.my_input_child2=this.returnSlider.rgba;
      }
      if (this.returnPalette.rgba!==''){
        this.my_input_child1=this.returnPalette.rgba;
        this.temporaryColor=this.returnPalette.rgba;
      }
      this.isSliderSelected=true;
      this.mainWindow.top=370;
      this.posSlider.div.top=this.mainWindow.top + this.subWindow.top;
  }
}


SelRadio(event:any){
    //console.log('event.target.id='+event.target.id+ "  event.currentTarget.id=" + event.currentTarget.id );
    const i=event.target.id.indexOf('-');
    const item= Number(event.target.id.substring(i+1));
    if (this.tabLock.lock!==2){


        if (event.target.id==='submit'){

        } else if (event.target.id.substring(0,1)==='A') {
          if (this.selectedFields[item]==='Y'){
            this.FillSelected.selected='N';
            this.ListChart.controls[item].setValue(this.FillSelected);
            this.selectedFields[item]='N';
          } else if (this.selectedFields[item]==='N'){
            this.FillSelected.selected='Y';
            this.ListChart.controls[item].setValue(this.FillSelected);
            this.selectedFields[item]='Y';
          } 
        } else if (event.target.id.substring(0,1)==='L') {
          if (this.selectedLimitFields[item]==='Y'){
            this.FillSelected.selected='N';
            this.ListChart.controls[item+this.ConfigChartHealth.barDefault.datasets.labels.length-1].setValue(this.FillSelected);
            this.selectedLimitFields[item]='N';
          } else if (this.selectedLimitFields[item]==='N'){
            this.FillSelected.selected='Y';
            this.ListChart.controls[item+this.ConfigChartHealth.barDefault.datasets.labels.length-1].setValue(this.FillSelected);
            this.selectedLimitFields[item]='Y';
          } 
        }
    }    
  }

//********************** */
collectSpecialData(nb:number,datasetsSpecialBar:Array<any>,  dateLabelSpecial:Array<any>, datasetsLimit:Array<any>,  dateLabelLimit:Array<any>){
  var i=0;
  var j=0;
  var theHealthDate=formatDate(this.HealthAllData.tabDailyReport[0].date,'yyyy-MM-dd',this.locale).toString();
  var iDataset=-1;
  var constLab:Array<string>=[];
  var colorLab=[];
  var iLabel=0;
  var k=-1;
  var nbLabel=0;
  var strStart='';
  var strEnd='';
  var cal=0;
  var addWeekly:number=0;
  var iSpecBorder:number=0; 
  var nbWeeks=0;
  var iWeekly=-1;

  this.refDailySaturated.splice(0,this.refDailySaturated.length);
  datasetsSpecialBar.splice(0,datasetsSpecialBar.length);
  dateLabelSpecial.splice(0,dateLabelSpecial.length);

  for (var i=0; i<this.tabParamChart[nb].labels.length ; i++){
      if (this.tabParamChart[nb].labels[i]==='Y'){
          constLab[iLabel]=this.ConfigChartHealth.barDefault.datasets.labels[i];
          colorLab[iLabel]=this.tabParamChart[nb].labelsColor[i];
          iLabel++;
        }
    };
     
    if (iLabel!==0){nbLabel=iLabel;}
    else {nbLabel=this.ConfigChartHealth.barDefault.datasets.labels.length;}
    for (i=0; i< nbLabel; i++){
        var order=i+1;
        if (this.tabParamChart[nb].chartType==='bar'){
            datasetsSpecialBar.push({
              label:"",
              backgroundColor:[], // The line fill color.
              data: [],
              datalabels:{
                align: 'center',
                anchor: 'center',
              },
              order:order,
              borderColor: [], 
              borderWidth: [],
              barThickness: '',
            });
        } else if (this.tabParamChart[nb].chartType==='line'){
            datasetsSpecialBar.push({
              label:"",
              backgroundColor:'',
              borderColor: [], //The line color.
              data: [],
              borderWidth: 3, //The line width (in pixels).
              showLine:true, 
              fill: false, //true 
              order:1,
              pointRadius:2, 
              pointBorderColor:'', 
              pointBackgroundColor:'', 
              pointBorderWidth:0,//2, 
              tension:0.2,
              pointStyle:"line",
              hoverBackgroundColor:"", 
              pointHoverBackgroundColor:''
            });
          }

        if (this.tabParamChart[nb].chartType==='bar'){
            if (this.tabParamChart[nb].bar.barThickness!==0){
              datasetsSpecialBar[i].barThickness=this.tabParamChart[nb].bar.barThickness;
            } else {
              datasetsSpecialBar[i].barThickness=this.ConfigChartHealth.barChart.datasets.barThickness;
            }
        } 

        if(this.tabParamChart[nb].chartType==='line'){
            if (i<this.ConfigChartHealth.lineChart.datasets.length && this.ConfigChartHealth.lineChart.datasets[i].borderColor!==undefined ){
              iSpecBorder=0;
              for (var iBorder=0; iBorder<this.ConfigChartHealth.lineChart.datasets[i].borderColor.length; iBorder++){
                if (this.tabParamChart[nb].labelsColor.length>0 && this.tabParamChart[nb].labels[iBorder]==='Y'){
                    datasetsSpecialBar[i].borderColor[iSpecBorder]=this.ConfigChartHealth.lineChart.datasets[i].borderColor[iBorder];
                    iSpecBorder++
                }
              }
            } else if (this.ConfigChartHealth.lineChart.datasetsDefault.borderColor!==undefined ){
              iSpecBorder=0;
              for (var iBorder=0; iBorder<this.ConfigChartHealth.lineChart.datasetsDefault.borderColor.length; iBorder++){
                if (this.tabParamChart[nb].labelsColor.length>0 && this.tabParamChart[nb].labels[iBorder]==='Y'){
                  datasetsSpecialBar[i].borderColor[iSpecBorder]=this.ConfigChartHealth.lineChart.datasetsDefault.borderColor[iBorder];
                  iSpecBorder++
                }
              }
            } else if (this.ConfigChartHealth.barDefault.datasets.borderColor.length>0  ){
              iSpecBorder=0;
              for (var iBorder=0; iBorder<this.ConfigChartHealth.barDefault.datasets.borderColor.length; iBorder++){
                if (this.tabParamChart[nb].labelsColor.length>0 && this.tabParamChart[nb].labels[iBorder]==='Y'){
                  datasetsSpecialBar[i].borderColor[iSpecBorder]=this.ConfigChartHealth.barDefault.datasets.borderColor[iBorder];
                  iSpecBorder++
                }
              }
            } 
            
            if (this.tabParamChart[nb].labelsColor.length>0){
              iSpecBorder=0;
              for (var iBorder=0; iBorder<this.tabParamChart[nb].labelsColor.length; iBorder++){
                
                if (this.tabParamChart[nb].labelsColor[iBorder]!==''  && this.tabParamChart[nb].labels[iBorder]==='Y'){
                    datasetsSpecialBar[i].borderColor[iSpecBorder]=this.tabParamChart[nb].labelsColor[iBorder];
                    iSpecBorder++
                  }
              }
            }
            if (i<this.ConfigChartHealth.lineChart.datasets.length){
              if (this.ConfigChartHealth.lineChart.datasets[i].borderWidth!==undefined){
                datasetsSpecialBar[i].borderWidth=this.ConfigChartHealth.lineChart.datasets[i].borderWidth;
              } else {
                datasetsSpecialBar[i].borderWidth=this.ConfigChartHealth.lineChart.datasetsDefault.borderWidth;
              }
              if (this.ConfigChartHealth.lineChart.datasets[i].pointRadius!==undefined){
                datasetsSpecialBar[i].pointRadius =this.ConfigChartHealth.lineChart.datasets[i].pointRadius ;
              } else {
                datasetsSpecialBar[i].pointRadius =this.ConfigChartHealth.lineChart.datasetsDefault.pointRadius ;
              }
              if (this.ConfigChartHealth.lineChart.datasets[i].pointBorderColor!==undefined){
                datasetsSpecialBar[i].pointBorderColor =this.ConfigChartHealth.lineChart.datasets[i].pointBorderColor ;
              }  else {
                datasetsSpecialBar[i].pointBorderColor =this.ConfigChartHealth.lineChart.datasetsDefault.pointBorderColor ;
              }
             
              if (datasetsSpecialBar[i].borderColor[i]!==undefined){
                  datasetsSpecialBar[i].pointBackgroundColor =datasetsSpecialBar[i].borderColor[i]; 
              } else {
                datasetsSpecialBar[i].pointBackgroundColor =datasetsSpecialBar[i].borderColor[i]; 
              }


              if (this.ConfigChartHealth.lineChart.datasets[i].pointBorderWidth!==undefined){
                datasetsSpecialBar[i].pointBorderWidth =this.ConfigChartHealth.lineChart.datasets[i].pointBorderWidth ;
              } else {
                datasetsSpecialBar[i].pointBorderWidth =this.ConfigChartHealth.lineChart.datasetsDefault.pointBorderWidth ;
              }
              if (this.ConfigChartHealth.lineChart.datasets[i].tension !==undefined){
                datasetsSpecialBar[i].tension =this.ConfigChartHealth.lineChart.datasets[i].tension ;
              } else {
                datasetsSpecialBar[i].tension =this.ConfigChartHealth.lineChart.datasetsDefault.tension ;
              }
              if (this.ConfigChartHealth.lineChart.datasets[i].pointStyle!==undefined){
                datasetsSpecialBar[i].pointStyle =this.ConfigChartHealth.lineChart.datasets[i].pointStyle ;
              } else {
                datasetsSpecialBar[i].pointStyle =this.ConfigChartHealth.lineChart.datasetsDefault.pointStyle ;
              }
              if (this.ConfigChartHealth.lineChart.datasets[i].fill!==undefined){
                datasetsSpecialBar[i].fill =this.ConfigChartHealth.lineChart.datasets[i].fill ;
              } else {
                datasetsSpecialBar[i].fill =this.ConfigChartHealth.lineChart.datasetsDefault.fill;
              }
                  
              //datasetsSpecialBar[i].hoverBackgroundColor =this.ConfigChartHealth.lineChart.datasets[i].hoverBackgroundColor ;
              //datasetsSpecialBar[i].pointHoverBackgroundColor =this.ConfigChartHealth.lineChart.datasets[i].pointHoverBackgroundColor ;
                  
              } else {
                  datasetsSpecialBar[i].borderWidth=this.ConfigChartHealth.lineChart.datasetsDefault.borderWidth;
                  datasetsSpecialBar[i].pointRadius =this.ConfigChartHealth.lineChart.datasetsDefault.pointRadius ;
                  datasetsSpecialBar[i].pointBorderColor =this.ConfigChartHealth.lineChart.datasetsDefault.pointBorderColor ;
                  datasetsSpecialBar[i].pointBackgroundColor =datasetsSpecialBar[i].borderColor[i]; //this.ConfigChartHealth.lineChart.datasetsDefault.pointBackgroundColor ;
                  datasetsSpecialBar[i].tension =this.ConfigChartHealth.lineChart.datasetsDefault.tension ;
                  datasetsSpecialBar[i].pointStyle =this.ConfigChartHealth.lineChart.datasetsDefault.pointStyle ;
                  datasetsSpecialBar[i].fill =this.ConfigChartHealth.lineChart.datasetsDefault.fill;
                  //datasetsSpecialBar[i].hoverBackgroundColor =this.ConfigChartHealth.lineChart.datasetsDefault.hoverBackgroundColor ;
                  //datasetsSpecialBar[i].pointHoverBackgroundColor =this.ConfigChartHealth.lineChart.datasetsDefault.pointHoverBackgroundColor ;
                  
              }
              datasetsSpecialBar[i].order=i;
          }
        



        if (iLabel!==0) {
            datasetsSpecialBar[i].label=constLab[i];
        } else {
            datasetsSpecialBar[i].label=this.ConfigChartHealth.barDefault.datasets.labels[i];
        }
        if (iLabel!==0 && colorLab[i]!==''){
          datasetsSpecialBar[i].backgroundColor=colorLab[i];
          
        }
        else if (this.ConfigChartHealth.barChart.datasets.backgroundColor===undefined ){
            datasetsSpecialBar[i].backgroundColor=this.ConfigChartHealth.barDefault.datasets.backgroundColor[i];
            
        } else {
            datasetsSpecialBar[i].backgroundColor=this.ConfigChartHealth.barChart.datasets.backgroundColor[i];
        }
        
        
    }
  

  
    var myDaily=-1;
    var myWeekly=-1;
    if (this.tabParamChart[nb].period==='' || this.tabParamChart[nb].period==='daily'){
      strStart=this.tabParamChart[nb].startRange;
      strEnd=this.tabParamChart[nb].endRange;
      myDaily=0;
    }

    if (this.tabParamChart[nb].period==='weekly'){
      myWeekly=0;
    }
    var myMonthly=-1;
    if (this.tabParamChart[nb].period==='monthly'){

    } 

  for (i=this.HealthAllData.tabDailyReport.length-1; i>=0; i--){
  // for (i=0; i<this.HealthAllData.tabDailyReport.length; i++){
    theHealthDate=formatDate(this.HealthAllData.tabDailyReport[i].date,'yyyy-MM-dd',this.locale).toString();
   
    if ((strStart==='' && strEnd==='') || (strStart!=='' && strEnd==='' && theHealthDate >= this.tabParamChart[nb].startRange)
   || (strStart==='' && strEnd!=='' && theHealthDate <= this.tabParamChart[nb].endRange)
   || (strStart!=='' && strEnd!=='' && theHealthDate >= this.tabParamChart[nb].startRange && theHealthDate <= this.tabParamChart[nb].endRange)
   ){

      if (myDaily===0 ){
        
        iDataset++;
        dateLabelSpecial[iDataset]=this.HealthAllData.tabDailyReport[i].date;
      } else if (myWeekly ===0 || myWeekly===7 ){
          myWeekly=0;
          iDataset++;
          iWeekly=0;
          nbWeeks++;
          dateLabelSpecial[iDataset]='#'+nbWeeks;
          addWeekly=0;
          cal=0;
        
      } else if ( myMonthly===0){
        // TO BE ANALYSED
          iDataset++;
          myMonthly=0;
      }
     
      myWeekly++
      
      if (iLabel!==0){
        // tackle the information from selection of params
            for (var j=0; j<constLab.length; j++){
              if (myDaily===0){ 
                  addWeekly=0 
              }
            
              else if (myWeekly>0) { 
                if (datasetsSpecialBar[j].data[iDataset]!==undefined){
                addWeekly=datasetsSpecialBar[j].data[iDataset] }
              }
            
              if (constLab[j]==="Proteins"){
                  datasetsSpecialBar[j].data[iDataset]=addWeekly + this.HealthAllData.tabDailyReport[i].total.Protein;
              } else if (constLab[j]==="Carbs"){
                datasetsSpecialBar[j].data[iDataset]=addWeekly + this.HealthAllData.tabDailyReport[i].total.Carbs + this.HealthAllData.tabDailyReport[i].total.Sugar;
              } else if (constLab[j]==="Total Fat"){
                datasetsSpecialBar[j].data[iDataset]=addWeekly + this.HealthAllData.tabDailyReport[i].total.Fat.Total;
              } else if (constLab[j]==="Cholesterol"){
                datasetsSpecialBar[j].data[iDataset]=addWeekly + this.HealthAllData.tabDailyReport[i].total.Cholesterol;
              } else if (constLab[j]==="Saturated Fat"){
                datasetsSpecialBar[j].data[iDataset]=addWeekly + this.HealthAllData.tabDailyReport[i].total.Fat.Saturated;
                if (this.refDailySaturated[iDataset]===undefined){this.refDailySaturated[iDataset]=0;}
                this.refDailySaturated[iDataset]=this.refDailySaturated[iDataset]+ (Number(this.HealthAllData.tabDailyReport[i].burntCalories)+ this.identification.health.Calories) * this.identification.health.SaturatedFat / 9;
              } else if (constLab[j]==="Calories burnt"){
                  datasetsSpecialBar[j].data[iDataset]=addWeekly + Number(this.HealthAllData.tabDailyReport[i].burntCalories) + this.identification.health.Calories;
                  
              } else if (constLab[j]==="Calories intake"){
                datasetsSpecialBar[j].data[iDataset]=addWeekly + this.HealthAllData.tabDailyReport[i].total.Calories;
              }
            }
      }
       else {
        for (var j=0; j<this.ConfigChartHealth.barDefault.datasets.labels.length; j++){
            if (myDaily===0){ addWeekly=0 }
            else if (myWeekly!==-1) { addWeekly=datasetsSpecialBar[j].data[iDataset] }

            if (this.ConfigChartHealth.barDefault.datasets.labels[j]==="Proteins"){
              datasetsSpecialBar[j].data[iDataset]==addWeekly + this.HealthAllData.tabDailyReport[i].total.Protein;
            } else if (this.ConfigChartHealth.barDefault.datasets.labels[j]==="Carbs"){
              datasetsSpecialBar[j].data[iDataset]==addWeekly + this.HealthAllData.tabDailyReport[i].total.Carbs  + this.HealthAllData.tabDailyReport[i].total.Sugar;
            } else if (this.ConfigChartHealth.barDefault.datasets.labels[j]==="Total Fat"){
              datasetsSpecialBar[j].data[iDataset]==addWeekly + this.HealthAllData.tabDailyReport[i].total.Fat.Total;
            } else if (this.ConfigChartHealth.barDefault.datasets.labels[j]==="Cholesterol"){
              datasetsSpecialBar[j].data[iDataset]==addWeekly + this.HealthAllData.tabDailyReport[i].total.Cholesterol;
            } else if (this.ConfigChartHealth.barDefault.datasets.labels[j]==="Saturated Fat"){
              datasetsSpecialBar[j].data[iDataset]==addWeekly + this.HealthAllData.tabDailyReport[i].total.Fat.Saturated;
              if (this.refDailySaturated[iDataset]===undefined){this.refDailySaturated[iDataset]=0;}
              this.refDailySaturated[iDataset]=this.refDailySaturated[iDataset]+ (Number(this.HealthAllData.tabDailyReport[i].burntCalories)  + this.identification.health.Calories) * this.identification.health.SaturatedFat / 9;
            } else if (this.ConfigChartHealth.barDefault.datasets.labels[j]==="Calories burnt"){
              datasetsSpecialBar[j].data[iDataset]==addWeekly + Number(this.HealthAllData.tabDailyReport[i].burntCalories) + this.identification.health.Calories;
            } else if (this.ConfigChartHealth.barDefault.datasets.labels[j]==="Calories intake"){
              datasetsSpecialBar[j].data[iDataset]==addWeekly + this.HealthAllData.tabDailyReport[i].total.Calories;
            }
          }
        }
      }    
    }

// prepare the drawing of the horizontal

  var iMax:number=0;
  var dataValue:number=0;
  var datasetsLength:number=0;
  iMax=datasetsSpecialBar.length;
  var labelName:string='';
  var newRecords:number=0;
  var tabNewItem=[];
  var labLimit:number=0;
  var j=0;
  for (var i=0; i<iMax; i++){
        dataValue=0;
        if (datasetsSpecialBar[i].label==='Cholesterol'){
          dataValue=Number(this.identification.health.Cholesterol.myLimit);
          labelName='Chol. limit';
          labLimit=0;// 2
        } else if (datasetsSpecialBar[i].label==='Proteins'){
          dataValue=Number(this.identification.health.Protein);
          labelName='Prot. limit';
          labLimit=2;//5
        } else if (datasetsSpecialBar[i].label==='Carbs'){
          dataValue=Number(this.identification.health.Carbs);
          labelName='Carbs limit';
          labLimit=3;//6
        } else if (datasetsSpecialBar[i].label==='Saturated Fat'){
          labelName='Sat. limit';
          labLimit=1;//3
          dataValue=Number(this.identification.health.SaturatedFat);
        }
       if (dataValue>0){
          datasetsSpecialBar.push({
            type:"line",
            label:"",
            backgroundColor:'',
            borderColor: [], //The line color.
            data: [],
            borderWidth: 3, //The line width (in pixels).
            showLine:true, 
            fill: false, //true 
            pointBorderWidth:0,
            pointBorderColor:'', 
            pointBackgroundColor:'', 
            //order:1,
            //tension:0.2,
            pointStyle:false,
          });
          if (datasetsSpecialBar[i].label==='Saturated Fat'){
            for (var j=0; j<datasetsSpecialBar[i].data.length; j++){
              datasetsSpecialBar[datasetsSpecialBar.length-1].data[j]=this.refDailySaturated[j];
            } 
          } else {
            if (this.tabParamChart[nb].period==='daily'){
              for (var j=0; j<datasetsSpecialBar[i].data.length; j++){
                datasetsSpecialBar[datasetsSpecialBar.length-1].data[j]=dataValue;
              }  
            } else if (this.tabParamChart[nb].period==='weekly'){
              for (var j=0; j<datasetsSpecialBar[i].data.length; j++){
                datasetsSpecialBar[datasetsSpecialBar.length-1].data[j]=dataValue*7;
              }  
            }
            
          }

          datasetsSpecialBar[datasetsSpecialBar.length-1].borderColor[datasetsSpecialBar.length-1]=this.tabParamChart[nb].limitLabelsColor[labLimit];

          datasetsSpecialBar[datasetsSpecialBar.length-1].label=labelName;
          datasetsSpecialBar[datasetsSpecialBar.length-1].pointBackgroundColor=this.tabParamChart[nb].limitLabelsColor[labLimit];
       } 
      }


    this.specialDraw(dateLabelSpecial,datasetsSpecialBar,nb);
  //} 
}

refDailySaturated:Array<number>=[];
specialDraw(dateLabel:Array<any>, theDatasets:Array<any>, nb:number){

  Chart.defaults.font.size = 14;
  
  var yStacked=false;
  var xStacked=false;
 
  if (this.tabParamChart[nb].axisY.stacked===true ){
    yStacked=true;
  }
  if (this.tabParamChart[nb].axisX.stacked===true ){
    xStacked=true;
  }

  
  var charTitle='';
  if (this.tabParamChart[nb].chartTitle.text !==''){
    charTitle=this.tabParamChart[nb].chartTitle.text;
  } else {charTitle=this.ConfigChartHealth.barChart.options.plugins.title.text};

  var TitleColor='';
  if (this.tabParamChart[nb].chartTitle.color !==''){
    TitleColor=this.tabParamChart[nb].chartTitle.color;
  } else {TitleColor=this.ConfigChartHealth.barChart.options.plugins.title.color};

  var mylegendTitle='';
  if (this.tabParamChart[nb].legendTitle.text !==''){
    mylegendTitle=this.tabParamChart[nb].legendTitle.text;
  } else {mylegendTitle=this.ConfigChartHealth.barChart.options.plugins.legend.title.text};

  var legendColor='';
  if (this.tabParamChart[nb].legendTitle.color !==''){
    legendColor=this.tabParamChart[nb].legendTitle.color;
  } else {legendColor='blue'};

  var theRatio=0;
  if (this.tabParamChart[nb].ratio!==0){
    theRatio=Number(this.tabParamChart[nb].ratio);
  } else {
    theRatio=Number(this.ConfigChartHealth.barChart.options.aspectRatio);
  }
  
  var theboxWidth=0;
  if (this.tabParamChart[nb].legendBox.boxWidth!==0){
    theboxWidth=Number(this.tabParamChart[nb].legendBox.boxWidth);
  } else  if (this.ConfigChartHealth.barChart.options.plugins.legend.labels.boxWidth!==undefined){
    theboxWidth=Number(this.ConfigChartHealth.barChart.options.plugins.legend.labels.boxWidth);
  } else  if (this.ConfigChartHealth.barDefault.options.plugins.legend.labels.boxWidth!==undefined){
    theboxWidth=Number(this.ConfigChartHealth.barDefault.options.plugins.legend.labels.boxWidth);
  }
    
  
  var theboxHeight=0;
  if (this.tabParamChart[nb].legendBox.boxHeight!==0){
    theboxHeight=Number(this.tabParamChart[nb].legendBox.boxHeight);
  } else  if (this.ConfigChartHealth.barChart.options.plugins.legend.labels.boxHeight!==undefined){
    theboxHeight=Number(this.ConfigChartHealth.barChart.options.plugins.legend.labels.boxHeight);
  } else  if (this.ConfigChartHealth.barDefault.options.plugins.legend.labels.boxHeight!==undefined){
    theboxHeight=Number(this.ConfigChartHealth.barDefault.options.plugins.legend.labels.boxHeight);
  }

  var theboxradius=0;
  if (this.tabParamChart[nb].legendBox.borderRadius!==0){
    theboxradius=Number(this.tabParamChart[nb].legendBox.borderRadius);
  } else  if (this.ConfigChartHealth.barChart.options.plugins.legend.labels.borderRadius!==undefined){
    theboxradius=Number(this.ConfigChartHealth.barChart.options.plugins.legend.labels.borderRadius);
  } else  if (this.ConfigChartHealth.barDefault.options.plugins.legend.labels.borderRadius!==undefined){
    theboxradius=Number(this.ConfigChartHealth.barDefault.options.plugins.legend.labels.borderRadius);
  }

  var theboxfontSize=0

  if (this.tabParamChart[nb].legendBox.font.size!==0){
    theboxfontSize=Number(this.tabParamChart[nb].legendBox.font.size);
  } else  if (this.ConfigChartHealth.barChart.options.plugins.legend.labels.font.size!==undefined){
    theboxfontSize=Number(this.ConfigChartHealth.barChart.options.plugins.legend.labels.font.size);
  } else  if (this.ConfigChartHealth.barDefault.options.plugins.legend.labels.font.size!==undefined){
    theboxfontSize=Number(this.ConfigChartHealth.barDefault.options.plugins.legend.labels.font.size);
  }


  var thepointStyle='';
  if (this.tabParamChart[nb].legendBox.pointStyle!==''){
    thepointStyle=this.tabParamChart[nb].legendBox.pointStyle;
  } else  if (this.ConfigChartHealth.barChart.options.plugins.legend.labels.pointStyle!==undefined){
    thepointStyle=this.ConfigChartHealth.barChart.options.plugins.legend.labels.pointStyle;
  } else  if (this.ConfigChartHealth.barDefault.options.plugins.legend.labels.pointStyle!==undefined){
    thepointStyle=this.ConfigChartHealth.barDefault.options.plugins.legend.labels.pointStyle;
  }

  var theColorBox='';
  if (this.tabParamChart[nb].legendBox.color!==''){
    theColorBox=this.tabParamChart[nb].legendBox.color;
  } else  if (this.ConfigChartHealth.barChart.options.plugins.legend.labels.color!==undefined){
    theColorBox=this.ConfigChartHealth.barChart.options.plugins.legend.labels.color;
  } else  if (this.ConfigChartHealth.barDefault.options.plugins.legend.labels.color!==undefined){
    theColorBox=this.ConfigChartHealth.barDefault.options.plugins.legend.labels.color;
  }

  if (this.ConfigChartHealth.barDefault.options.indexAxis==='x'){
    Chart.defaults.indexAxis='x';
  } else {
    Chart.defaults.indexAxis='y'
  }

  if (this.tabParamChart[nb].chartTitle.position==='bottom'){
    Chart.defaults.plugins.title.position='bottom';
  } else if (this.tabParamChart[nb].chartTitle.position==='top'){
    Chart.defaults.plugins.title.position='top'
  }

  if (this.tabParamChart[nb].legendTitle.position==='bottom'){
    Chart.defaults.plugins.legend.position ='bottom';
  } else if (this.tabParamChart[nb].legendTitle.position==='top'){
    Chart.defaults.plugins.legend.position='top'
  }

  Chart.defaults.plugins.title.align='center';
  if (this.tabParamChart[nb].chartTitle.align==='end'){
    Chart.defaults.plugins.title.align='end';
  } else if (this.tabParamChart[nb].chartTitle.align==='start'){
    Chart.defaults.plugins.title.align='start'
  }
  Chart.defaults.plugins.legend.align='center';
  if (this.tabParamChart[nb].legendTitle.align==='start'){
    Chart.defaults.plugins.legend.align ='end';
  } else if (this.tabParamChart[nb].legendTitle.align==='start'){
    Chart.defaults.plugins.legend.align='start';
  }
  if (this.tabParamChart[nb].axisY.position==='left'){
    Chart.defaults.scales.category.position='left';
  } else {
    Chart.defaults.scales.category.position='right';
  }
  var displayChartTitle=false;
  var displayLegendTitle=false;
  if ( this.tabParamChart[nb].chartTitle.display===true){
    displayChartTitle=true;
  }
  if ( this.tabParamChart[nb].legendTitle.display===true){
    displayLegendTitle=true;
  } 


// modify color of legend for line limit
  if (this.tabParamChart[nb].chartType==='bar'){
    this.myTabChart[nb]=new Chart(
      this.tabCtx[nb], {
        type: 'bar',
        
        data: {
          labels:dateLabel,
          datasets: theDatasets,
        },
        options: { 
          responsive: true,
          maintainAspectRatio: false,
          layout:{padding:{
            left: this.ConfigChartHealth.barDefault.options.layout.padding.left,
            top:this.ConfigChartHealth.barDefault.options.layout.padding.top}},
          plugins: {
            title:{
              padding: {
                top: this.tabParamChart[nb].chartTitle.padding.top, 
                bottom:this.tabParamChart[nb].chartTitle.padding.bottom,
              },
              //position: "bottom",
              display:true,
              text:charTitle,
              //align:'center',
              color:TitleColor,
              font:{
                  size:this.tabParamChart[nb].chartTitle.font.size,
                  weight:this.tabParamChart[nb].chartTitle.font.weight,
                  family:this.tabParamChart[nb].chartTitle.font.family,
                }
            },
          legend: {
            //align:'center',
            //position: 'top',   // label position left/right/top/bottom
            labels: {
                boxWidth: theboxWidth, 
                boxHeight: theboxHeight, 
                color:theColorBox,
                usePointStyle:true,
                pointStyle: thepointStyle,
                borderRadius:theboxradius,
               
                font:{
                  size:theboxfontSize,
                  weight:this.tabParamChart[nb].legendBox.font.weight,
                  family:this.tabParamChart[nb].legendBox.font.family,
                }
                
              },
            maxHeight:this.ConfigChartHealth.barDefault.options.plugins.legend.maxHeight,
            maxWidth:this.ConfigChartHealth.barDefault.options.plugins.legend.maxWidth,
            reverse:false,
            title:{
              display:displayLegendTitle,
              text:mylegendTitle,
              color:legendColor,
              padding:{
                    left:this.tabParamChart[nb].legendTitle.padding.left,
                    top:this.tabParamChart[nb].legendTitle.padding.top,
                    bottom:this.tabParamChart[nb].legendTitle.padding.bottom,
                  },  
              font:{
                  size:this.tabParamChart[nb].legendTitle.font.size,
                  weight:this.tabParamChart[nb].legendTitle.font.weight,
                  family:this.tabParamChart[nb].legendTitle.font.family,
                }
              },

            },
          },
          elements: {
            point: {
              radius: 0,
              borderWidth:0,
            }
          },
          //indexAxis: 'x',
          scales: {
            y: {
              beginAtZero: true,
              type:'linear',
              position:'right',
              stacked: yStacked ,
              border:{ color:this.tabParamChart[nb].axisY.border.color, 
                width:this.tabParamChart[nb].axisY.border.width },
              ticks:{
                // stepSize:0.7,
                color:this.tabParamChart[nb].axisY.ticks.color,
              }
            },
            x: {
              stacked: xStacked ,
              border:{ color:this.tabParamChart[nb].axisX.border.color, 
                width:this.tabParamChart[nb].axisX.border.width },
              ticks:{
                color:this.tabParamChart[nb].axisX.ticks.color,
              }
            },
          },
          aspectRatio:theRatio,
        },
    });
  }
  else if (this.tabParamChart[nb].chartType==='line'){
    this.myTabChart[nb]=new Chart(
      this.tabCtx[nb], {
        type: 'line',
        
        data: {
          labels:dateLabel,
          datasets: theDatasets,
        },
        
        options: { 
          responsive: true,
          maintainAspectRatio: false,
          elements:{
            line:{borderWidth: 7}
          },
          layout:{padding:{
            left: this.ConfigChartHealth.barDefault.options.layout.padding.left,
            top:this.ConfigChartHealth.barDefault.options.layout.padding.top}},
          plugins: {
            subtitle: {
              display: false,
              text: 'Custom Chart Subtitle'
          },
            title:{
              padding: {
                top: this.tabParamChart[nb].chartTitle.padding.top, 
                bottom:this.tabParamChart[nb].chartTitle.padding.bottom,
              },
              //position: 'bottom',
              fullSize:false,
              display:displayChartTitle,
              text:charTitle,
              //align:'center',
              color:TitleColor,
              font:{
                  size:this.tabParamChart[nb].chartTitle.font.size,
                  weight:this.tabParamChart[nb].chartTitle.font.weight,
                  family:this.tabParamChart[nb].chartTitle.font.family,
                }
            },
          legend: {
            //align:'center',
            //position: 'top',   // label position left/right/top/bottom
            labels: {
                boxWidth: theboxWidth, 
                boxHeight: theboxHeight, 
                usePointStyle:true,
                pointStyle:thepointStyle,
                borderRadius:theboxradius,
                color:theColorBox,    
                font:{
                  size:theboxfontSize,
                  weight:this.tabParamChart[nb].legendBox.font.weight,
                  family:this.tabParamChart[nb].legendBox.font.family,
                }
                
              },
            maxHeight:this.ConfigChartHealth.barDefault.options.plugins.legend.maxHeight,
            maxWidth:this.ConfigChartHealth.barDefault.options.plugins.legend.maxWidth,
            reverse:false,
            title:{
              display:displayLegendTitle,
              text:mylegendTitle,
              color:legendColor,
              padding:{
                    left:this.tabParamChart[nb].legendTitle.padding.left,
                    top:this.tabParamChart[nb].legendTitle.padding.top,
                    bottom:this.tabParamChart[nb].legendTitle.padding.bottom,
                  },  
              font:{
                  size:this.tabParamChart[nb].legendTitle.font.size,
                  weight:this.tabParamChart[nb].legendTitle.font.weight,
                  family:this.tabParamChart[nb].legendTitle.font.family,
                }
              },

            },
          },

          //indexAxis: 'x',
          scales: {
            y: {
              beginAtZero: true,
              type:'linear',
              position:'right',
              stacked: yStacked ,
              border:{ color:this.tabParamChart[nb].axisY.border.color, 
                width:this.tabParamChart[nb].axisY.border.width },
              ticks:{
                // stepSize:0.7,
                color:this.tabParamChart[nb].axisY.ticks.color,
              }
            },
            x: {

              stacked: xStacked ,
              border:{ color:this.tabParamChart[nb].axisX.border.color, 
                width:this.tabParamChart[nb].axisX.border.width },
              ticks:{
                color:this.tabParamChart[nb].axisX.ticks.color,
              }
            },
          },

          aspectRatio:theRatio,
        },
    });
  }
}

myNewTabChart:any;
testLineChart(){
  const myDataset={
    label:"",
    backgroundColor:[], // The line fill color.
    data: [],
    borderColor: [], 
    borderWidth: [],
  }

  this.myNewTabChart=new Chart(
    this.newtabCtx, {
      type: 'line',
      
      data: {
        labels:['lab1','lab2','lab3','lab4,','lab5','lab6','lab7','lab8','lab9'],
        datasets: [{label:'ll1',data:[2,3,4,5,6,2,3,4,15],borderColor:['blue','red','green','yellow','lightred','pink','orange','lightblue'], 
          borderWidth:3, showLine:true, fill: false, order:1,
          pointRadius:2, pointBorderColor:'pink', pointBackgroundColor:'blue', pointBorderWidth:2, tension:0.2,
          hoverBackgroundColor:"orange", pointHoverBackgroundColor:'lightblue'
        },
        {label:'object1',data:[13,13,13,13,13,13,13,13,13],borderColor:['blue','red','green','yellow','lightred','pink','orange','lightblue'], 
          borderWidth:4, showLine:true, fill: false, order:2, pointStyle:false,

        },
        {label:'ll2',data:[12,13,14,15,16,12,13,14,17],borderColor:['blue','red','green','yellow','lightred','pink','orange','lightblue'], 
          borderWidth:3, showLine:true, fill: false, order:3,
          pointRadius:8, pointBorderWidth:6, pointBorderColor:'orange', pointBackgroundColor:'red', pointStyle:'rect', 
          tension:0.5,
          hoverBackgroundColor:"cyan", pointHoverBackgroundColor:"grey"
        },
        {label:'object2',data:[6,6,6,6,6,6,6,6,6],borderColor:['blue','red','green','yellow','lightred','pink','orange','lightblue'], 
        borderWidth:4, showLine:true, fill: false, order:4,
         pointRadius:7, pointBorderColor:'cyan', pointBackgroundColor:'blue', pointBorderWidth:8, pointStyle:'false', tension:0,
         hoverBackgroundColor:"cyan", pointHoverBackgroundColor:"grey"
        }
      ],

      },
      options: { 
        responsive: true,
        /****
        plugins: {
          title:{
            padding: {
              top: 10,
              bottom:10,
            },
            position: 'bottom',
            display:true,
            text:'my title',
            align:'center',
            color:'blue',
            font:{
                size:20,
                weight:'bold',
                family:'Helvetica',
              }
          },
        legend: {
          align:'center',
          position: 'top',   // label position left/right/top/bottom
          labels: {
              boxWidth: 60, 
              boxHeight: 60, 
              usePointStyle:true,
              pointStyle:'rect',
              borderRadius:0,
              color:'darkblue',    
              font:{
                size:16,
                weight:'bold',
                family:'Helvetica',
              }
              
            },
          maxHeight:80,
          maxWidth:300,
          reverse:false,


          },
        },

        indexAxis: 'x',
        scales: {
          y: {
            beginAtZero: true,
            //type:'linear',
            position:'right',
            stacked:false ,
            ticks:{
              // stepSize:0.7,
              color:'darkred',
            }
          },
          x: {
            stacked:false ,
            ticks:{
              color:'darkblue',
            }
          },
        },
         */
        aspectRatio:1.5,
      },
  });

}

initTabLock5:number=0;
firstLoop:boolean=true;
ngOnChanges(changes: SimpleChanges) { 
 
  var i=0;
    for (const propName in changes){
        const j=changes[propName];
        if (propName==='INFileParamChart'){
            const b=this.INFileParamChart.data;
        } else if (propName==='tabLock'){
            if (this.firstLoop===true){
                console.log('report chart ==> ngOnChange this.firstLoop===true   current value of tabLock[5]=' + changes[propName].currentValue.lock +  
                '  & previous value initTabLock5 was=' + this.initTabLock5 + '  & input() TabLock[5]=' + this.tabLock.lock);
                this.firstLoop=false;
            } else {
                  console.log('report chart ==> ngOnChange this.firstLoop===false   current tabLock[5]=' + changes[propName].currentValue.lock + 
                      '  & previous value initTabLock5 was=' + this.initTabLock5 + '  & input() TabLock[5]=' + this.tabLock.lock);

                  if (this.returnEmit.saveAction.substring(0,4)==='save'){
                      if ( this.tabLock.lock===1 && (this.tabLock.status===0 || this.tabLock.status===300) ){
                          if (this.returnEmit.saveAction==='save'){
                            this.error_msg='parameters for chart#'+ this.selectedChart +' have been saved';
                          } else if (this.returnEmit.saveAction==='saveAll'){
                              this.error_msg='for all charts, parameters have been saved';
                              for (var i=0; i<this.tabParamChart.length; i++){
                                this.buildChart(i);
                              } 
                          }
                      } else {
                        this.error_msg='Parameters cannot be saved - error=' + this.tabLock.status;

                      }
                      this.returnEmit.saveAction='';
                  } else if (this.initTabLock5 !== changes[propName].currentValue.lock){
                    this.buildChart(this.selectedChart-1);
                  }
                }
            this.initTabLock5=changes[propName].currentValue.lock;
            if (this.initTabLock5===1){
              this.enableForm();
            } else {
              this.disableForm();
            }
            
          } 
        }
    // //this.LogMsgConsole('$$$$$ onChanges '+' to '+to+' from '+from + ' ---- JSON.stringify(j) '+ JSON.stringify(j)); 
}


}