import { Component, OnInit , Input, Output, ViewChild,  HostListener,  HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
  
import { DatePipe, formatDate } from '@angular/common'; 

//import  { Color, Label } from 'ng2-charts';
import { Chart, ChartOptions, ChartType, ChartConfiguration, PluginChartOptions, ScaleChartOptions, ChartDataset,
  BarController, BarElement, CategoryScale, ChartData, LinearScale, LineController, LineElement, PointElement, } from 'chart.js/auto';

import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, FormControl, UntypedFormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { Observable } from 'rxjs';

import { BucketList } from '../../JsonServerClass';
import { Bucket_List_Info } from '../../JsonServerClass';

// configServer is needed to use ManageGoogleService
// it is stored in MangoDB and accessed via ManageMangoDBService
import { configServer } from '../../JsonServerClass';
import { XMVConfig } from '../../JsonServerClass';
import { environment } from 'src/environments/environment';
import { LoginIdentif } from '../../JsonServerClass';
import {manage_input} from '../../manageinput';
import {eventoutput, thedateformat} from '../../apt_code_name';
import { msgConsole } from '../../JsonServerClass';
import {msginLogConsole} from '../../consoleLog'

import { mainClassCaloriesFat, mainDailyReport} from '../ClassHealthCalories'
import {mainConvItem, mainRecordConvert, mainClassUnit, mainClassConv} from '../../ClassConverter'
import { classConfigChart, classchartHealth } from '../classConfigChart';
import {classPosSlider} from '../../JsonServerClass';
import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import {AccessConfigService} from 'src/app/CloudServices/access-config.service';
import { classAxisX, classAxisY, classLegendChart, classPluginTitle , classTabFormChart, classFileParamChart, classReturnColor} from '../classChart';



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
  posSlider=new classPosSlider;
  paramChange:number=0; // used to trigger the change on slider position
  @Output() returnFile= new EventEmitter<any>();

  @ViewChild('baseChart', { static: true })

  FileParamChart=new classFileParamChart;
  current_Chart:number=0;
  tabParamChart:Array<classTabFormChart>=[];
  initTabParamChart:Array<classTabFormChart>=[];

  tabCtx:Array<any>=[];
  tabChart:Array<any>=[];
  myTabChart:Array<Chart>=[];
  
  tabCanvasId:Array<string>=['canvas1','canvas2','canvas3','canvas4'];

  tabofLabels:Array<string>=['Calories burnt', 'Calories intake', 'Cholesterol', 'Saturated fat', 'Total fat', 'Proteins', 'Carbs', 'Sugar'];

  tabOfLabelsColor:Array<string>=['','','','','','','',''];
  tabLabelRgba:Array<any>=[{
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
    chartType: new FormControl('line', { nonNullable: true }),
    barThickness: new FormControl('line', { nonNullable: true }),
    chartTitle: new FormControl('', { nonNullable: true }),
    colorChartTitle:new FormControl('', { nonNullable: true }),
    ratio:new FormControl(0, { nonNullable: true }),
    canvasWidth: new FormControl(0, { nonNullable: true }),
    canvasHeight:new FormControl(0, { nonNullable: true }),
    canvasMarginLeft:new FormControl(0, { nonNullable: true }),
    stackedX:new FormControl('', { nonNullable: true }),
    stackedY:new FormControl('', { nonNullable: true }),
    canvasBackground: new FormControl('', { nonNullable: true }),
    legendTitle:new FormControl('', { nonNullable: true }),
    colorLegendTitle:new FormControl('', { nonNullable: true }),
    boxwidth:new FormControl(0, { nonNullable: true }),
    boxheight:new FormControl(0, { nonNullable: true }),
    boxpointStyle:new FormControl('', { nonNullable: true }),
    boxcolor:new FormControl('', { nonNullable: true }),
    boxfontSize:new FormControl(0, { nonNullable: true }),
    boxradius:new FormControl(0, { nonNullable: true }),
    period:new FormControl('', { nonNullable: true }), //daily, weekly, monthly
    startRange: new FormControl('',[
      Validators.required,
      // validates date format yyyy-mm-dd with regular expression
      Validators.pattern(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/)
      ]),
    endRange: new FormControl('',[
      Validators.required,
      // validates date format yyyy-mm-dd with regular expression
      Validators.pattern(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/)
      ]),
    
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


  // user by slider and palette
  my_input_child1:string='';
  my_input_child2:string='';
  my_output_child1:string='';
  my_output_child2:string='';

  selected_canvasColor:string='';
  selected_legendColor:string='';
  selected_chartTitleColor:string='';
  tabSelect:Array<any>=[];

  selectedFields:Array<any>=[];

  isSelectCanvasColor:boolean=false;
  isSelectLegendColor:boolean=false;
  isSelectLChartTitleColor:boolean=false;
  isTypeSelected:boolean=false;
  isPeriodSelected:boolean=false;

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
  ngAfterViewInit(){ // this.ConfigChartHealth.barChart.length     
    for (var i=0; i<this.tabCanvasId.length; i++){
        this.tabChart[i]=document.getElementById(this.tabCanvasId[i]);
     
        this.tabCtx[i]=this.tabChart[i].getContext('2d');
        this.overallTab.push({datasetBar:[], labelBar:[]});
        this.collectSpecialData(i, this.overallTab[i].datasetBar, this.overallTab[i].labelBar);        
    }

    this.newtabChart=document.getElementById('myLineCanvas');
    this.newtabCtx=this.newtabChart.getContext('2d');
    this.testLineChart();
  }


ngOnInit() {
  this.posSlider.VerHor='H';
  this.posSlider.top=5;
  this.posSlider.left=20;
  for (var i=0; i<this.tabofLabels.length; i++){
      //const pos=this.ConfigChartHealth.barChart[i].canvas.id.indexOf('ChartId');
      //this.tabSelect[i]=this.ConfigChartHealth.barChart[i].canvas.id.substring(0, pos);
      this.FillSelected.selected='N';
      this.ListChart.push(this.FormChart()); 
      this.ListChart.controls[i].setValue(this.FillSelected);
      this.tabSelect[i]=this.tabofLabels[i];
      this.selectedFields[i]='N';
      this.dialogLabColor[i]=false;
      const myClass=new classReturnColor;
      this.tabLabelRgba.push(myClass);
  }

  // log which chart types are supported
  
  for (var i=0; i<this.ConfigChartHealth.chartTypes.length; i++){
    //this.lineChartType.push('');
    this.lineChartType[i]=this.ConfigChartHealth.chartTypes[i];
  }

  this.tabParamChart.splice(0,this.tabParamChart.length);
  this.initTabParamChart.splice(0,this.initTabParamChart.length);
  if (this.INFileParamChart.fileType!==undefined && this.INFileParamChart.fileType!==''){
    for (var i=0; i<4; i++){
      const classParam=new classTabFormChart;
      this.tabParamChart.push(classParam);
      this.fillInCharts(this.INFileParamChart.data[i],this.tabParamChart[i]);
      const initParam=new classTabFormChart;
      this.initTabParamChart.push(initParam);
      this.fillInCharts(this.INFileParamChart.data[i],this.initTabParamChart[i]);

      this.fillInFormFromTab(i);
      this.canvas.push({width:'',height:'',background:0,marginLeft:''});
      this.changeCanvas(i);
    }
  }

  
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
  if (this.selectedChart!==0){
    // save the data 
    this.fillInTabOfCharts(this.selectedChart-1);
    this.selected_canvasColor='';
    this.selected_legendColor='';
    this.selected_chartTitleColor='';
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
  
}

fillInTabOfCharts(nb:number){

  this.tabParamChart[nb].chartType=this.selectChart.controls['chartType'].value.toLowerCase().trim();
  this.tabParamChart[nb].chartTitle=this.selectChart.controls['chartTitle'].value;
  this.tabParamChart[nb].colorChartTitle=this.selectChart.controls['colorChartTitle'].value;
  this.tabParamChart[nb].ratio=this.selectChart.controls['ratio'].value;
  this.tabParamChart[nb].canvasWidth=this.selectChart.controls['canvasWidth'].value;
  this.tabParamChart[nb].canvasHeight=this.selectChart.controls['canvasHeight'].value;
  this.tabParamChart[nb].canvasBackground=this.selectChart.controls['canvasBackground'].value;
  this.tabParamChart[nb].canvasMarginLeft=this.selectChart.controls['canvasMarginLeft'].value;
  this.tabParamChart[nb].barThickness=this.selectChart.controls['barThickness'].value;
  this.tabParamChart[nb].colorLegendTitle=this.selectChart.controls['colorLegendTitle'].value;
  this.tabParamChart[nb].legendTitle=this.selectChart.controls['legendTitle'].value;

  this.tabParamChart[nb].legendBox.width=this.selectChart.controls['boxwidth'].value;
  this.tabParamChart[nb].legendBox.height=this.selectChart.controls['boxheight'].value;
  this.tabParamChart[nb].legendBox.pointStyle=this.selectChart.controls['boxpointStyle'].value;
  this.tabParamChart[nb].legendBox.fontSize=this.selectChart.controls['boxfontSize'].value;
  this.tabParamChart[nb].legendBox.radius=this.selectChart.controls['boxradius'].value;
  this.tabParamChart[nb].legendBox.color=this.selectChart.controls['boxcolor'].value;


  this.tabParamChart[nb].stackedX=this.selectChart.controls['stackedX'].value.toLowerCase().trim();
  this.tabParamChart[nb].stackedY=this.selectChart.controls['stackedY'].value.toLowerCase().trim();
  this.tabParamChart[nb].period=this.selectChart.controls['period'].value.toLowerCase().trim();
  this.tabParamChart[nb].startRange=this.selectChart.controls['startRange'].value;
  this.tabParamChart[nb].endRange=this.selectChart.controls['endRange'].value;
  for (var i=0; i<this.selectedFields.length; i++){
    this.tabParamChart[nb].labels[i]=this.selectedFields[i];
    this.tabParamChart[nb].labelsColor[i]= this.tabOfLabelsColor[i];
    this.tabParamChart[nb].rgbaLabels[i]=this.tabLabelRgba[i];
  }

  this.tabParamChart[nb].rgbaTitle=this.returnTitleRgba;
  this.tabParamChart[nb].rgbaLegend=this.returnLegendRgba;
  this.tabParamChart[nb].rgbaCanvas=this.returnCanvasRgba;

}


fillInCharts(inFile:any,outFile:any){

  outFile.chartType=inFile.chartType.toLowerCase().trim();
  outFile.chartTitle=inFile.chartTitle;
  outFile.colorChartTitle=inFile.colorChartTitle;
  outFile.ratio=inFile.ratio;
  outFile.canvasWidth=inFile.canvasWidth;
  outFile.canvasHeight=inFile.canvasHeight;
  outFile.canvasBackground=inFile.canvasBackground;
  outFile.colorLegendTitle=inFile.colorLegendTitle;
  outFile.legendTitle=inFile.legendTitle;
  outFile.stackedX=inFile.stackedX.toLowerCase().trim();
  outFile.stackedY=inFile.stackedY.toLowerCase().trim();
  outFile.period=inFile.period.toLowerCase().trim();
  outFile.startRange=inFile.startRange;
  outFile.endRange=inFile.endRange;

  outFile.legendBox.width=inFile.legendBox.width;
  outFile.legendBox.height=inFile.legendBox.height;
  outFile.legendBox.radius=inFile.legendBox.radius;
  outFile.legendBox.fontSize=inFile.legendBox.fontSize;
  outFile.legendBox.pointStyle=inFile.legendBox.pointStyle;
  outFile.legendBox.color=inFile.legendBox.color;

  if (inFile.barThickness===undefined){
    outFile.barThickness=0;
  } else {
    outFile.barThickness=inFile.barThickness;
  }
  if (inFile.canvasMarginLeft===undefined){
    outFile.canvasMarginLeft=0;
  } else {
    outFile.canvasMarginLeft=inFile.canvasMarginLeft;
  }
  if (inFile.labels===undefined){
    for (var i=0; i<this.selectedFields.length; i++){
      outFile.labels[i]='N';
    }
  } else {outFile.labels=inFile.labels}
  if (inFile.labelsColor===undefined){
    for (var i=0; i<this.selectedFields.length; i++){
      outFile.labelsColor[i]='';
    }
  } else {outFile.labelsColor=inFile.labelsColor};
  if (inFile.rgbaLabels===undefined){
    for (var i=0; i<this.selectedFields.length; i++){
      const mySlider=new classReturnColor;
      const myPalette=new classReturnColor;
      outFile.rgbaLabels.push({slider:mySlider,palette:myPalette});
    }
  } else {outFile.rgbaLabels=inFile.rgbaLabels}

  if (inFile.rgbaTitle===undefined){
    outFile.rgbaTitle.slider=new classReturnColor;
    outFile.rgbaTitle.palette=new classReturnColor;
  } else {
    outFile.rgbaTitle=inFile.rgbaTitle;
  }
  
  if (inFile.rgbaCanvas===undefined){
    outFile.rgbaCanvas.slider=new classReturnColor;
    outFile.rgbaCanvas.palette=new classReturnColor;
  } else {
    outFile.rgbaCanvas=inFile.rgbaCanvas;
  }

  if (inFile.rgbaLegend===undefined){
    outFile.rgbaLegend.slider=new classReturnColor;
    outFile.rgbaLegend.palette=new classReturnColor;
  } else {
    outFile.rgbaLegend=inFile.rgbaLegend;
  }
}

fillInFormFromTab(nb:number){
  this.selectChart.controls['chartType'].setValue(this.tabParamChart[nb].chartType.toLowerCase().trim());
  this.selectChart.controls['chartTitle'].setValue(this.tabParamChart[nb].chartTitle);
  this.selectChart.controls['colorChartTitle'].setValue(this.tabParamChart[nb].colorChartTitle);
  this.selectChart.controls['ratio'].setValue(this.tabParamChart[nb].ratio);
  this.selectChart.controls['canvasWidth'].setValue(this.tabParamChart[nb].canvasWidth);
  this.selectChart.controls['canvasHeight'].setValue(this.tabParamChart[nb].canvasHeight);
  this.selectChart.controls['canvasBackground'].setValue(this.tabParamChart[nb].canvasBackground);
  this.selectChart.controls['legendTitle'].setValue(this.tabParamChart[nb].legendTitle);
  this.selectChart.controls['colorLegendTitle'].setValue(this.tabParamChart[nb].colorLegendTitle);
  this.selectChart.controls['stackedX'].setValue(this.tabParamChart[nb].stackedX);
  this.selectChart.controls['stackedY'].setValue(this.tabParamChart[nb].stackedX);
  this.selectChart.controls['period'].setValue(this.tabParamChart[nb].period.toLowerCase().trim());
  this.selectChart.controls['startRange'].setValue(this.tabParamChart[nb].startRange);
  this.selectChart.controls['endRange'].setValue(this.tabParamChart[nb].endRange);
  this.selectChart.controls['canvasMarginLeft'].setValue(this.tabParamChart[nb].canvasMarginLeft);
  this.selectChart.controls['barThickness'].setValue(this.tabParamChart[nb].barThickness);

  this.selectChart.controls['boxwidth'].setValue(this.tabParamChart[nb].legendBox.width);
  this.selectChart.controls['boxheight'].setValue(this.tabParamChart[nb].legendBox.height);
  this.selectChart.controls['boxpointStyle'].setValue(this.tabParamChart[nb].legendBox.pointStyle);
  this.selectChart.controls['boxfontSize'].setValue(this.tabParamChart[nb].legendBox.fontSize);
  this.selectChart.controls['boxradius'].setValue(this.tabParamChart[nb].legendBox.radius);
  this.selectChart.controls['boxcolor'].setValue(this.tabParamChart[nb].legendBox.color);


  this.selected_canvasColor=this.tabParamChart[nb].canvasBackground;
  this.selected_legendColor=this.tabParamChart[nb].colorLegendTitle;
  this.selected_chartTitleColor=this.tabParamChart[nb].colorChartTitle;

  for (var i=0; i<this.tabParamChart[nb].labels.length; i++){
    this.selectedFields[i]=this.tabParamChart[nb].labels[i];
    this.tabOfLabelsColor[i]=this.tabParamChart[nb].labelsColor[i];
    this.tabLabelRgba=this.tabParamChart[nb].rgbaLabels;
  }

  this.returnTitleRgba=this.tabParamChart[nb].rgbaTitle;
  this.returnLegendRgba=this.tabParamChart[nb].rgbaLegend;
  this.returnCanvasRgba=this.tabParamChart[nb].rgbaCanvas;
}

selectType(event:any){
  this.resetBooleans();
  if (event.target.id==='selType'){
    this.isTypeSelected=true;
  } else if (event.target.id==='selectedType'){
    this.isTypeSelected=false;
    this.selectChart.controls['chartType'].setValue(event.target.textContent);
  }
}

selectPeriod(event:any){
  this.resetBooleans();
  this.isSelectLChartTitleColor=false;
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
  this.isSelectCanvasColor=false;
  this.isSelectLChartTitleColor=false;
  this.isSelectLabColor=false;
  this.dialogLabColor[this.currentLabColor]=false;
}

selectColor(event:any){
  this.resetBooleans();
  if (event==='canvasColor'){
    this.isSelectCanvasColor=true;
    this.my_input_child1=this.selected_canvasColor;
    this.my_input_child2=this.selected_canvasColor;
    this.returnSlider=this.returnCanvasRgba.slider;
    this.returnPalette=this.returnCanvasRgba.palette;
  } else if (event==='legendColor'){
    this.my_input_child1=this.selected_legendColor;
    this.my_input_child2=this.selected_legendColor;
    this.returnSlider=this.returnLegendRgba.slider;
    this.returnPalette=this.returnLegendRgba.palette;
    this.isSelectLegendColor=true;
  } else if (event==='colorChartTitle'){
    this.my_input_child1=this.selected_chartTitleColor;
    this.my_input_child2=this.selected_chartTitleColor;
    this.returnSlider=this.returnTitleRgba.slider;
    this.returnPalette=this.returnTitleRgba.palette;
    this.isSelectLChartTitleColor=true;
  } else if (event==='fieldCanvasColor'){ //  
    this.selected_canvasColor=this.selectChart.controls["canvasBackground"].value;
    this.initRgba(this.returnCanvasRgba);
  } else if (event==='fieldLegendColor'){
    this.selected_legendColor=this.selectChart.controls["colorLegendTitle"].value;
    this.initRgba(this.returnLegendRgba);
  } else if (event==='fieldColorChartTitle'){ 
    this.selected_chartTitleColor=this.selectChart.controls["colorChartTitle"].value;
    this.initRgba(this.returnTitleRgba);
  } 
  if (this.returnSlider.rgba!==''){
    this.my_input_child2=this.returnSlider.rgba;
  }
  if (this.returnPalette.rgba!==''){
    this.my_input_child1=this.returnPalette.rgba;
    this.temporaryColor=this.returnPalette.rgba;
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
  this.temporaryColor=event;
    
  }

/**
 * 
 *tabLabelRgba:Array<classReturnColor>=[];

  

  returnBoxRgba=new classReturnColor; 
 * 
 */

fnExitPalette(event:any){
if (event==='Cancel'){
  this.resetBooleans();
} else if (event==='Save'){
  if (this.isSelectCanvasColor===true){
    this.selected_canvasColor = this.temporaryColor;
    this.returnCanvasRgba.palette=this.returnPalette;
    this.returnCanvasRgba.slider=this.returnSlider;
    this.isSelectCanvasColor=false;
    this.selectChart.controls['canvasBackground'].setValue(this.temporaryColor);
  } else if (this.isSelectLegendColor===true){
    this.selected_legendColor = this.temporaryColor;
    this.isSelectLegendColor=false;
    this.returnLegendRgba.palette=this.returnPalette;
    this.returnLegendRgba.slider=this.returnSlider;
    this.selectChart.controls['colorLegendTitle'].setValue(this.temporaryColor);
  } else if (this.isSelectLChartTitleColor===true){
    this.selected_chartTitleColor = this.temporaryColor;
    this.isSelectLChartTitleColor=false;
    this.returnTitleRgba.palette=this.returnPalette;
    this.returnTitleRgba.slider=this.returnSlider;
    this.selectChart.controls['colorChartTitle'].setValue(this.temporaryColor);
  } else if (this.isSelectLabColor===true) {
    this.tabOfLabelsColor[this.currentLabColor]= this.temporaryColor;
    this.tabLabelRgba[this.currentLabColor].palette=this.returnPalette;
    this.tabLabelRgba[this.currentLabColor].slider=this.returnSlider;
    this.isSelectLabColor=false;
    this.dialogLabColor[this.currentLabColor]=false;
  }

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
  var theStackedX=this.selectChart.controls['stackedX'].value;
  if (this.error_msg==='' && theStackedX!=='' && (theStackedX.toLowerCase().trim()!=='true' && theStackedX.toLowerCase().trim()!=='false')){
    this.error_msg='Field STACKEDx is a boolean; can only be true or false';
  } 
  var theStackedY=this.selectChart.controls['stackedY'].value;
  if (this.error_msg==='' && theStackedY!=='' && (theStackedY.toLowerCase().trim()!=='true' && theStackedY.toLowerCase().trim()!=='false')){
    this.error_msg='Field STACKEDy is a boolean; can only be true or false';
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

SaveCancel(event:string){
    var error=0;
    var saveError='';
    this.error_msg='';
    if (event==='save'){
      this.fillInTabOfCharts(this.selectedChart-1);
      if (this.error_msg===''){
        this.fillInCharts(this.tabParamChart[this.selectedChart-1],this.initTabParamChart[this.selectedChart-1]);
        this.returnFile.emit(this.initTabParamChart);
        this.error_msg='parameters for chart#'+this.selectedChart+' have been saved';
        this.buildChart(this.selectedChart-1);
      }

    } else if (event==='saveAll'){
      this.fillInTabOfCharts(this.selectedChart-1);
      if (this.error_msg===''){
          for (var i=0; i<this.tabParamChart.length; i++){
            this.fillInCharts(this.tabParamChart[i],this.initTabParamChart[i]);
          }
          this.returnFile.emit(this.tabParamChart);
          this.error_msg='for all charts, parameters have been saved';
          for (var i=0; i<this.tabParamChart.length; i++){
            this.buildChart(i);
          } 
      } 
    } else if (event==='cancelAll'){
      for (var i=0; i<this.tabParamChart.length; i++){
        this.fillInCharts(this.initTabParamChart[i],this.tabParamChart[i]);
        this.fillInFormFromTab(i);
        this.buildChart(i);
      }
    } else if (event==='cancelOne'){
      this.fillInCharts(this.initTabParamChart[this.selectedChart-1],this.tabParamChart[this.selectedChart-1]);
      this.fillInFormFromTab(this.selectedChart-1);
      this.buildChart(this.selectedChart-1);
    } 
}

buildChart(nb:number){
  
  this.changeCanvas(nb);
  //if (this.tabParamChart[nb].chartType==='bar'){
    this.myTabChart[nb].destroy();
    this.collectSpecialData(nb, this.overallTab[nb].datasetBar, this.overallTab[nb].labelBar);  
  //}
}

dialogLabColor:Array<boolean>=[];
currentLabColor:number=0;
isSelectLabColor:boolean=false;

selectLabelColor(event:any){
  this.dialogLabColor[this.currentLabColor]=false;
  const i=event.target.id.indexOf('-');
  this.currentLabColor= Number(event.target.id.substring(i+1));
  this.dialogLabColor[this.currentLabColor]=true;
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

}


SelRadio(event:any){
    console.log('event.target.id='+event.target.id+ "  event.currentTarget.id=" + event.currentTarget.id );
    const i=event.target.id.indexOf('-');
    const item= Number(event.target.id.substring(i+1));
    if (event.target.id==='submit'){

    } else if (this.selectedFields[item]==='Y'){
      this.FillSelected.selected='N';
      this.ListChart.controls[item].setValue(this.FillSelected);
      this.selectedFields[item]='N';
    } else if (this.selectedFields[item]==='N'){
      this.FillSelected.selected='Y';
      this.ListChart.controls[item].setValue(this.FillSelected);
      this.selectedFields[item]='Y';
    } 
    
  }

//********************** */
collectSpecialData(nb:number,datasetsSpecialBar:Array<any>,  dateLabelSpecial:Array<any>){
  var i=0;
  var j=0;
  var theHealthDate=formatDate(this.HealthAllData.tabDailyReport[0].date,'yyyy-MM-dd',this.locale).toString();
  var iDataset=-1;
  var constLab=[];
  var colorLab=[];
  var iLabel=0;
  var k=-1;
  var nbLabel=0;
  var strStart='';
  var strEnd='';
  var cal=0;
  var addWeekly:number=0;


/*
var configRecord=0;
for (configRecord=0; configRecord<this.ConfigChartHealth.barChart.length && this.ConfigChartHealth.barChart.type!==this.tabParamChart[nb].chartType; configRecord++){

}
*/
 // if (this.tabParamChart[nb].chartType==='bar'){
      datasetsSpecialBar.splice(0,datasetsSpecialBar.length);
      dateLabelSpecial.splice(0,dateLabelSpecial.length);

      for (var i=0; i<this.tabParamChart[nb].labels.length ; i++){
        if (this.tabParamChart[nb].labels[i]==='Y'){
          constLab[iLabel]=this.tabofLabels[i];
          colorLab[iLabel]=this.tabParamChart[nb].labelsColor[i];
          iLabel++;
          
        }
      };
     
      if (iLabel!==0){nbLabel=iLabel;}
      else {nbLabel=this.ConfigChartHealth.barChart.labels.length;}
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
              backgroundColor:'green',
              borderColor: [], //The line color.
              data: [],
              borderWidth: 7, //The line width (in pixels).
              showLine:true, 
              fill: true, 
              order:1,
              pointRadius:2, 
              pointBorderColor:'', 
              pointBackgroundColor:'', 
              pointBorderWidth:2, 
              tension:0.2,
              pointStyle:"",
              hoverBackgroundColor:"", 
              pointHoverBackgroundColor:''
            });
          }

        if (this.tabParamChart[nb].chartType==='bar'){
          if (this.tabParamChart[nb].barThickness!==0){
            datasetsSpecialBar[i].barThickness=this.tabParamChart[nb].barThickness;
          } else {
            datasetsSpecialBar[i].barThickness=this.ConfigChartHealth.barChart.datasets.barThickness;
            
          }
        } 
        
        if(this.tabParamChart[nb].chartType==='line'){
            if (this.tabParamChart[nb].labelsColor.length>0){
              for (var iBorder=0; iBorder<this.tabParamChart[nb].labelsColor.length; iBorder++){
                datasetsSpecialBar[i].borderColor[iBorder]=this.tabParamChart[nb].labelsColor[iBorder];
              }
            } else {
              if (i<this.ConfigChartHealth.lineChart.datasets.length){
                for (var iBorder=0; iBorder<this.ConfigChartHealth.lineChart.datasets[i].borderColor.length; iBorder++){
                  datasetsSpecialBar[i].borderColor[iBorder]=this.ConfigChartHealth.lineChart.datasets[i].borderColor[iBorder];
                }
              }
            }
            if (i<this.ConfigChartHealth.lineChart.datasets.length){
                datasetsSpecialBar[i].borderWidth=this.ConfigChartHealth.lineChart.datasets[i].borderWidth;
                datasetsSpecialBar[i].pointRadius =this.ConfigChartHealth.lineChart.datasets[i].pointRadius ;
                datasetsSpecialBar[i].pointBorderColor =this.ConfigChartHealth.lineChart.datasets[i].pointBorderColor ;
                datasetsSpecialBar[i].pointBackgroundColor =this.ConfigChartHealth.lineChart.datasets[i].pointBackgroundColor ;
                datasetsSpecialBar[i].pointBorderWidth =this.ConfigChartHealth.lineChart.datasets[i].pointBorderWidth ;
                datasetsSpecialBar[i].tension =this.ConfigChartHealth.lineChart.datasets[i].tension ;
                datasetsSpecialBar[i].pointStyle =this.ConfigChartHealth.lineChart.datasets[i].pointStyle ;
                datasetsSpecialBar[i].hoverBackgroundColor =this.ConfigChartHealth.lineChart.datasets[i].hoverBackgroundColor ;
                datasetsSpecialBar[i].pointHoverBackgroundColor =this.ConfigChartHealth.lineChart.datasets[i].pointHoverBackgroundColor ;
                datasetsSpecialBar[i].fill =this.ConfigChartHealth.lineChart.datasets[i].fill ;
              } else {
                for (var iBorder=0; iBorder<this.ConfigChartHealth.lineChart.datasetsDefault.borderColor.length; iBorder++){
                  datasetsSpecialBar[i].borderColor[iBorder]=this.ConfigChartHealth.lineChart.datasetsDefault.borderColor[iBorder];
                }
                datasetsSpecialBar[i].borderWidth=this.ConfigChartHealth.lineChart.datasetsDefault.borderWidth;
                datasetsSpecialBar[i].pointRadius =this.ConfigChartHealth.lineChart.datasetsDefault.pointRadius ;
                datasetsSpecialBar[i].pointBorderColor =this.ConfigChartHealth.lineChart.datasetsDefault.pointBorderColor ;
                datasetsSpecialBar[i].pointBackgroundColor =this.ConfigChartHealth.lineChart.datasetsDefault.pointBackgroundColor ;
                datasetsSpecialBar[i].pointBorderWidth =this.ConfigChartHealth.lineChart.datasetsDefault.pointBorderWidth ;
                datasetsSpecialBar[i].tension =this.ConfigChartHealth.lineChart.datasetsDefault.tension ;
                datasetsSpecialBar[i].pointStyle =this.ConfigChartHealth.lineChart.datasetsDefault.pointStyle ;
                datasetsSpecialBar[i].hoverBackgroundColor =this.ConfigChartHealth.lineChart.datasetsDefault.hoverBackgroundColor ;
                datasetsSpecialBar[i].pointHoverBackgroundColor =this.ConfigChartHealth.lineChart.datasetsDefault.pointHoverBackgroundColor ;
                datasetsSpecialBar[i].fill =this.ConfigChartHealth.lineChart.datasetsDefault.fill;
              }
              datasetsSpecialBar[i].order=i;
            }
        



        if (iLabel!==0) {
            datasetsSpecialBar[i].label=constLab[i];
        } else {
            datasetsSpecialBar[i].label=this.ConfigChartHealth.barChart.labels[i];
        }
        if (iLabel!==0 && colorLab[i]!==''){
          datasetsSpecialBar[i].backgroundColor=colorLab[i];
          
        }
        else if (this.ConfigChartHealth.barChart.datasets.backgroundColor===undefined ){
            datasetsSpecialBar[i].backgroundColor=this.ConfigChartHealth.barDefault.datasets.backgroundColor[i];
            
        } else {
            datasetsSpecialBar[i].backgroundColor=this.ConfigChartHealth.barChart.datasets.backgroundColor[i];
        }
        
        datasetsSpecialBar[i].borderWidth=this.ConfigChartHealth.barDefault.datasets.borderWidth[i];
      }
  

    if (this.selectChart.controls['period'].value==='' || this.selectChart.controls['period'].value==='daily'){
      strStart=this.tabParamChart[nb].startRange;
      strEnd=this.tabParamChart[nb].endRange;
    }
    var myDaily=-1;
    var myWeekly=-1;
    if (this.selectChart.controls['period'].value==='daily'){
      myDaily=0;
    }
    if (this.selectChart.controls['period'].value==='weekly'){
      myWeekly=0;
    }
    var myMonthly=-1;
    if (this.selectChart.controls['period'].value==='monthly'){

    } 
    var nbWeeks=0;
    var iWeekly=-1;
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
              if (myDaily===0){ addWeekly=0 }
              else if (myWeekly!==-1) { 
                if (datasetsSpecialBar[j].data[iDataset]!==undefined){
                addWeekly=datasetsSpecialBar[j].data[iDataset] }
              }

              if (constLab[j]==="Proteins"){
                  datasetsSpecialBar[j].data[iDataset]=addWeekly + this.HealthAllData.tabDailyReport[i].total.Protein;
              } else if (constLab[j]==="Carbs"){
                datasetsSpecialBar[j].data[iDataset]=addWeekly + this.HealthAllData.tabDailyReport[i].total.Carbs;
              } else if (constLab[j]==="Sugar"){
                datasetsSpecialBar[j].data[iDataset]=addWeekly + this.HealthAllData.tabDailyReport[i].total.Sugar;
              } else if (constLab[j]==="Total fat"){
                datasetsSpecialBar[j].data[iDataset]=addWeekly + this.HealthAllData.tabDailyReport[i].total.Fat.Total;
              } else if (constLab[j]==="Cholesterol"){
                datasetsSpecialBar[j].data[iDataset]=addWeekly + this.HealthAllData.tabDailyReport[i].total.Cholesterol;
              } else if (constLab[j]==="Saturated fat"){
                datasetsSpecialBar[j].data[iDataset]=addWeekly + this.HealthAllData.tabDailyReport[i].total.Fat.Saturated;
              } else if (constLab[j]==="Calories burnt"){
                  datasetsSpecialBar[j].data[iDataset]=addWeekly + Number(this.HealthAllData.tabDailyReport[i].burntCalories) + this.identification.health.Calories;
              } else if (constLab[j]==="Calories intake"){
                datasetsSpecialBar[j].data[iDataset]=addWeekly + this.HealthAllData.tabDailyReport[i].total.Calories;
              }
            }
      }
       else {
        for (var j=0; j<this.ConfigChartHealth.barChart.fieldsToSelect.length; j++){
            if (myDaily===0){ addWeekly=0 }
            else if (myWeekly!==-1) { addWeekly=datasetsSpecialBar[j].data[iDataset] }

            if (this.ConfigChartHealth.barChart.fieldsToSelect[j]==="Proteins"){
              datasetsSpecialBar[j].data[iDataset]==addWeekly + this.HealthAllData.tabDailyReport[i].total.Protein;
            } else if (this.ConfigChartHealth.barChart.fieldsToSelect[j]==="Carbs"){
              datasetsSpecialBar[j].data[iDataset]==addWeekly + this.HealthAllData.tabDailyReport[i].total.Carbs;
            } else if (this.ConfigChartHealth.barChart.fieldsToSelect[j]==="Sugar"){
              datasetsSpecialBar[j].data[iDataset]==addWeekly + this.HealthAllData.tabDailyReport[i].total.Sugar;
            } else if (this.ConfigChartHealth.barChart.fieldsToSelect[j]==="TotFat"){
              datasetsSpecialBar[j].data[iDataset]==addWeekly + this.HealthAllData.tabDailyReport[i].total.Fat.Total;
            } else if (this.ConfigChartHealth.barChart.fieldsToSelect[j]==="Chol"){
              datasetsSpecialBar[j].data[iDataset]==addWeekly + this.HealthAllData.tabDailyReport[i].total.Cholesterol;
            } else if (this.ConfigChartHealth.barChart.fieldsToSelect[j]==="SatFat"){
              datasetsSpecialBar[j].data[iDataset]==addWeekly + this.HealthAllData.tabDailyReport[i].total.Fat.Saturated;
            } else if (this.ConfigChartHealth.barChart.fieldsToSelect[j]==="CalBurnt"){
              datasetsSpecialBar[j].data[iDataset]==addWeekly + Number(this.HealthAllData.tabDailyReport[i].total.Calories) + this.identification.health.Calories;
            } else if (this.ConfigChartHealth.barChart.fieldsToSelect[j]==="CalEaten"){
              datasetsSpecialBar[j].data[iDataset]==addWeekly + this.HealthAllData.tabDailyReport[i].burntCalories;
            }
          }
        }
      }    
    }
    this.specialDraw(dateLabelSpecial,datasetsSpecialBar,nb);
  //} 
}

specialDraw(dateLabel:Array<any>, theDatasets:Array<any>, nb:number){

  Chart.defaults.font.size = 14;
/*
  var configRecord=0;
  for (configRecord=0; configRecord<this.ConfigChartHealth.barChart.length && this.ConfigChartHealth.barChart.type!==this.tabParamChart[nb].chartType; configRecord++){
  
  }
  */
 var yStacked=false;
 var xStacked=false;
  if (this.tabParamChart[nb].stackedY==='true' ){
    yStacked=true;
  } else if (this.tabParamChart[nb].stackedY==='false' ){
    yStacked=false;
  } else if (this.ConfigChartHealth.barDefault.options.scales.axisY.stacked!==undefined){
    yStacked=this.ConfigChartHealth.barDefault.options.scales.axisY.stacked;
  } 

  if (this.tabParamChart[nb].stackedX==='true' ){
    xStacked=true;
  } else if (this.tabParamChart[nb].stackedX==='false' ){
    xStacked=false;
  } else 
  if (this.ConfigChartHealth.barDefault.options.scales.axisX.stacked!==undefined){
    var xStacked=this.ConfigChartHealth.barDefault.options.scales.axisX.stacked;
  } 
  var charTitle='';
  if (this.tabParamChart[nb].chartTitle !==''){
    charTitle=this.tabParamChart[nb].chartTitle;
  } else {charTitle=this.ConfigChartHealth.barChart.options.plugins.title.text};

  var TitleColor='';
  if (this.tabParamChart[nb].colorChartTitle !==''){
    TitleColor=this.tabParamChart[nb].colorChartTitle;
  } else {TitleColor='darkblue'};

  var mylegendTitle='';
  if (this.tabParamChart[nb].legendTitle !==''){
    mylegendTitle=this.tabParamChart[nb].legendTitle;
  } else {mylegendTitle=this.ConfigChartHealth.barChart.options.plugins.legend.title.text};

  var legendColor='';
  if (this.tabParamChart[nb].colorLegendTitle !==''){
    legendColor=this.tabParamChart[nb].colorLegendTitle;
  } else {legendColor='blue'};

  var theRatio=0;
  if (this.tabParamChart[nb].ratio!==0){
    theRatio=Number(this.tabParamChart[nb].ratio);
  } else {
    theRatio=Number(this.ConfigChartHealth.barChart.options.aspectRatio);
  }
  
  var theboxWidth=0;
  if (this.tabParamChart[nb].legendBox.width!==0){
    theboxWidth=Number(this.tabParamChart[nb].legendBox.width);
  } else  if (this.ConfigChartHealth.barChart.options.plugins.legend.labels.boxWidth!==undefined){
    theboxWidth=Number(this.ConfigChartHealth.barChart.options.plugins.legend.labels.boxWidth);
  } else  if (this.ConfigChartHealth.barDefault.options.plugins.legend.labels.boxWidth!==undefined){
    theboxWidth=Number(this.ConfigChartHealth.barDefault.options.plugins.legend.labels.boxWidth);
  }
    
  
  var theboxHeight=0;
  if (this.tabParamChart[nb].legendBox.height!==0){
    theboxHeight=Number(this.tabParamChart[nb].legendBox.height);
  } else  if (this.ConfigChartHealth.barChart.options.plugins.legend.labels.boxHeight!==undefined){
    theboxHeight=Number(this.ConfigChartHealth.barChart.options.plugins.legend.labels.boxHeight);
  } else  if (this.ConfigChartHealth.barDefault.options.plugins.legend.labels.boxHeight!==undefined){
    theboxHeight=Number(this.ConfigChartHealth.barDefault.options.plugins.legend.labels.boxHeight);
  }

  var theboxradius=0;
  if (this.tabParamChart[nb].legendBox.radius!==0){
    theboxradius=Number(this.tabParamChart[nb].legendBox.radius);
  } else  if (this.ConfigChartHealth.barChart.options.plugins.legend.labels.borderRadius!==undefined){
    theboxradius=Number(this.ConfigChartHealth.barChart.options.plugins.legend.labels.borderRadius);
  } else  if (this.ConfigChartHealth.barDefault.options.plugins.legend.labels.borderRadius!==undefined){
    theboxradius=Number(this.ConfigChartHealth.barDefault.options.plugins.legend.labels.borderRadius);
  }

  var theboxfontSize=0;

  if (this.tabParamChart[nb].legendBox.fontSize!==0){
    theboxfontSize=Number(this.tabParamChart[nb].legendBox.fontSize);
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
          
          plugins: {
            title:{
              padding: {
                top: 10,
                bottom:10,
              },
              position: 'bottom',
              display:true,
              text:charTitle,
              align:'center',
              color:TitleColor,
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
                boxWidth: theboxWidth, 
                boxHeight: theboxHeight, 
                color:theColorBox,
                usePointStyle:true,
                pointStyle:thepointStyle,
                borderRadius:theboxradius,
               
                font:{
                  size:theboxfontSize,
                  weight:'bold',
                  family:'Helvetica',
                }
                
              },
            maxHeight:60,
            maxWidth:300,
            reverse:false,
            title:{
              display:true,
              text:mylegendTitle,
              color:legendColor,
                  padding:{
                    left:0,
                  },  
              font:{
                  size:14,
                  weight:'bold',
                  family:'Helvetica',
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
          indexAxis: 'x',
          scales: {
            y: {
              beginAtZero: true,
              //type:'linear',
              position:'right',
              stacked: yStacked ,
              ticks:{
                // stepSize:0.7,
                color:'darblue',
              }
            },
            x: {
              stacked: xStacked ,
              ticks:{
                color:'darkblue',
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
          elements:{
            line:{borderWidth: 7}
          },
          plugins: {
            title:{
              padding: {
                top: 10,
                bottom:10,
              },
              position: 'bottom',
              display:true,
              text:charTitle,
              align:'center',
              color:TitleColor,
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
                boxWidth: theboxWidth, 
                boxHeight: theboxHeight, 
                usePointStyle:true,
                pointStyle:thepointStyle,
                borderRadius:theboxradius,
                color:theColorBox,    
                font:{
                  size:theboxfontSize,
                  weight:'bold',
                  family:'Helvetica',
                }
                
              },
            maxHeight:80,
            maxWidth:300,
            reverse:false,
            title:{
              display:true,
              text:mylegendTitle,
              color:legendColor,
                  padding:{
                    left:0,
                  },  
              font:{
                  size:14,
                  weight:'bold',
                  family:'Helvetica',
                }
              },

            },
          },

          indexAxis: 'x',
          scales: {
            y: {
              beginAtZero: true,
              //type:'linear',
              position:'right',
              stacked: yStacked ,
              ticks:{
                // stepSize:0.7,
                color:'darblue',
              }
            },
            x: {
              stacked: xStacked ,
              ticks:{
                color:'darkblue',
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
        borderWidth:0, showLine:true, fill: true, order:1,
         pointRadius:2, pointBorderColor:'pink', pointBackgroundColor:'blue', pointBorderWidth:2, tension:0.2,
         hoverBackgroundColor:"orange", pointHoverBackgroundColor:'lightblue'
        },
        {label:'ll2',data:[12,13,14,15,16,12,13,14,17],borderColor:['cyan','green','red','yellow','lightred','pink','orange','lightblue'], 
        borderWidth:1, showLine:true, fill: false, order:2,
         pointRadius:7, pointBorderColor:'cyan', pointBackgroundColor:'red', pointBorderWidth:0, pointStyle:'rect', tension:0.5,
         hoverBackgroundColor:"cyan", pointHoverBackgroundColor:"grey"
        }
      ],

      },
      options: { 
        responsive: true,
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
        aspectRatio:1.5,
      },
  });

}

ngOnChanges(changes: SimpleChanges) { 
 
  var i=0;
    for (const propName in changes){
        const j=changes[propName];
        if (propName==='INFileParamChart'){
            const b=this.INFileParamChart.data;
          } 
        }
    // //this.LogMsgConsole('$$$$$ onChanges '+' to '+to+' from '+from + ' ---- JSON.stringify(j) '+ JSON.stringify(j)); 
}


}