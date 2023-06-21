import { Component, OnInit , Input, Output, HostListener,  HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
  
import { DatePipe, formatDate } from '@angular/common'; 

import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { Observable } from 'rxjs';

import { BucketList, Bucket_List_Info  } from '../../JsonServerClass';

// configServer is needed to use ManageGoogleService
// it is stored in MangoDB and accessed via ManageMangoDBService

import {msginLogConsole} from '../../consoleLog'
import { configServer, XMVConfig, LoginIdentif, msgConsole, classPosDiv } from '../../JsonServerClass';

import { environment } from 'src/environments/environment';
import {manage_input} from '../../manageinput';
import {eventoutput, thedateformat} from '../../apt_code_name';

import {  getStyleDropDownContent, getStyleDropDownBox, classDropDown } from '../../DropDownStyle'


import {ClassSubConv, ClassConv, mainClassConv, ClassUnit, ConvItem} from '../../ClassConverter'

import {ClassCaloriesFat, mainClassCaloriesFat} from '../ClassHealthCalories'
import {ClassItem, DailyReport, mainDailyReport, ClassMeal, ClassDish} from '../ClassHealthCalories'

import {classConfHTMLFitHealth, classConfTableAll} from '../classConfHTMLTableAll';

import {CalcFatCalories} from '../CalcFatCalories';
import { classConfigChart, classchartHealth } from '../classConfigChart';
import { classAxis,  classLegendChart, classPluginTitle , classTabFormChart, classFileParamChart} from '../classChart';


import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import {AccessConfigService} from 'src/app/CloudServices/access-config.service';


@Component({
  selector: 'app-health',
  templateUrl: './health.component.html',
  styleUrls: ['./health.component.css']
})
export class HealthComponent implements OnInit {

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageMangoDBService: ManageMangoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    @Inject(LOCALE_ID) private locale: string,
    ) { }

  @Output() returnFile= new EventEmitter<any>();

  @Input() XMVConfig=new XMVConfig;
  @Input() configServer = new configServer;
  @Input() identification= new LoginIdentif;
  @Input() InHealthAllData=new mainDailyReport;
  @Input() InConfigCaloriesFat=new mainClassCaloriesFat;
  @Input() InConvertUnit=new mainClassConv;
  @Input() InConfigHTMLFitHealth=new classConfHTMLFitHealth;
  @Input() InConfigChart=new classConfigChart;
  @Input() InFileParamChart=new classFileParamChart;
  @Input() triggerFunction:number=0;
  
  fileParamChart=new classFileParamChart;
  ConfigChart=new classConfigChart;
  ConvertUnit=new mainClassConv;
  HealthData=new mainDailyReport;;   // to create a new record
  HealthAllData=new mainDailyReport; // contain the full object
  SelectedRecord = new DailyReport; 
  ConfigCaloriesFat=new mainClassCaloriesFat;
  fileRecipe=new mainClassCaloriesFat;

  myLogConsole:boolean=false;
  myConsole:Array< msgConsole>=[];
  returnConsole:Array< msgConsole>=[];
  SaveConsoleFinished:boolean=false;
  type:string='';

  HTTP_Address:string='';
  HTTP_AddressPOST:string='';
  Google_Bucket_Access_Root:string='https://storage.googleapis.com/storage/v1/b/';
  Google_Bucket_Access_RootPOST:string='https://storage.googleapis.com/upload/storage/v1/b/';
 
  Google_Object_Health:string='HealthTracking';
  Google_Object_Console:string='LogConsole';
  Google_Object_Calories:string='ConfigCaloriesFat';
  bucket_data:string='';
  myListOfObjects=new Bucket_List_Info;
  DisplayListOfObjects:boolean=false;
  Error_Access_Server:string='';
  message:string='';
  error_msg: string='';

  EventHTTPReceived:Array<boolean>=[];
  id_Animation:Array<number>=[];
  TabLoop:Array<number>=[];
  NbWaitHTTP:number=0;


  SpecificForm=new FormGroup({
    FileName: new FormControl('', { nonNullable: true }),
  })

  IsSaveConfirmedCre:boolean=false;
  IsSaveConfirmedSel:boolean=false;
  isCreateNew:boolean=false;
  isDisplaySpecific:boolean=false;
  isDisplayAll:boolean=false;
  isCopyFile:boolean=false;
  isMgtCaloriesFat:boolean=false;
  isSelectedDateFound:boolean=false;
  isDeleteConfirmed:boolean=false;
  isAllDataModified:boolean=false;
  IsSaveConfirmedAll:boolean=false;
  IsCalculateCalories:boolean=false;
  isDisplayChart:boolean=false;

  errorFn:string='';
  SelectedRecordNb:number=-1;
  recordToDelete:number=0;

  TheSelectDisplays: FormGroup = new FormGroup({ 
    CreateNew: new FormControl('N', { nonNullable: true }),
    DisplaySpecific: new FormControl('N', { nonNullable: true }),
    DisplayAll: new FormControl('N', { nonNullable: true }),
    CopyFile:new FormControl('N', { nonNullable: true }),
    MgtCalories:new FormControl('N', { nonNullable: true }),
    CalculCalories:new FormControl('N', { nonNullable: true }),
    SelectedDate:new FormControl(Date(), { nonNullable: true }),
    theAction: new FormControl('Action', { nonNullable: true }),
    DisplayChart: new FormControl('N', { nonNullable: true }),
    ReloadHTML: new FormControl('N', { nonNullable: true }),
    ReloadChart: new FormControl('N', { nonNullable: true }),
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

  })


  TabAction:Array<any>=[{name:''}];
  NewTabAction:Array<any>=[{type:'', name:''}];

  // CONVERSION OF UNITS IF NEEDED
  
  ConvToDisplay:Array<ConvItem>=[]
  theTabOfUnits:Array<ClassUnit>=[];

  ValuesToConvert={
    valueFromTo:0,
    From:'',
    To:'',
    valueFrom:0,
    valueTo:0,
    type:'',
  }

  theEvent={
    target:{
      id:'',
      textContent:''
    }
  }

  TabOfId:Array<any>=[];

  dateRangeStart=new Date();
  dateRangeEnd=new Date();
  dateRangeStartHealth=new Date();
  dateRangeEndHealth=new Date();

  getScreenWidth: any;
  getScreenHeight: any;
  device_type:string='';

  /****  CONFIGURATION PARAMETERS FOR HTML *****/
 confTableAll= new classConfTableAll;

 ConfigHTMLFitHealth= new classConfHTMLFitHealth;
 

filterCalc:boolean=false;
filterHealth:boolean=false;
searchOneDate:number=0;
searchOneDateHealth:number=0;
isRangeDateError:boolean=false;

isDeleteItem:boolean=false;
prevDialogue:number=0;
dialogue:Array<boolean>=[false, false,false,false, false, false, false]; // CREdate=0; CREmeal=1; CREingr=2; SELdate=3; SELmeal=4; SELingr=5; allData=6

myAction:string='';
myType:string='';
tabNewRecordAll:Array<any>=[
  { nb:0,
    meal:[{ nb:0,
            food:[{nb:0,}]
          }]
  }
  ] ;
  
returnData={
  error:0,
  outHealthData: new DailyReport
}

tabMeal:Array<any>=[{name:''}];
tabFood:Array<any>=[{name:''}];
tabInputMeal:Array<any>=[];
tabInputFood:Array<any>=[];
//selType:string='';
//selFood:string='';



// Dropdown box dimension

sizeBox = new classDropDown;

styleBox:any;
styleBoxMeal:any;
styleBoxFood:any;
styleBoxOption:any;
styleBoxOptionMeal:any;
styleBoxOptionFood:any;

//

sizeBoxContentMeal:number=0;
sizeBoxMeal:number=0;
sizeBoxContentFood:number=0;
sizeBoxFood:number=0;

mousedown:boolean=false;
selectedPosition ={ 
  x: 0,
  y: 0} ;



  docDivCalFat:any;
  posDivCalFat= new classPosDiv;

  docDivReportHealth:any;
  posDivReportHealth= new classPosDiv;
  
  docDivAfterTitle:any;
  posDivAfterTitle= new classPosDiv;
  getPosDivAfterTitle(){
    if (document.getElementById("posAfterTitle")!==null){
        this.docDivAfterTitle = document.getElementById("posAfterTitle");
        this.posDivAfterTitle.Left = this.docDivAfterTitle.offsetLeft;
        this.posDivAfterTitle.Top = this.docDivAfterTitle.offsetTop;
        this.posDivAfterTitle.Client.Top=Math.round(this.docDivAfterTitle.getBoundingClientRect().top);
        this.posDivAfterTitle.Client.Left=Math.round(this.docDivAfterTitle.getBoundingClientRect().left);
    }
  }

  getPosDivOthers(){
    if (document.getElementById("posTopAppCalFat")!==null){
        this.docDivCalFat = document.getElementById("posTopAppCalFat");
        this.posDivCalFat.Left = this.docDivCalFat.offsetLeft;
        this.posDivCalFat.Top = this.docDivCalFat.offsetTop;
        this.posDivCalFat.Client.Top=Math.round(this.docDivCalFat.getBoundingClientRect().top);
        this.posDivCalFat.Client.Left=Math.round(this.docDivCalFat.getBoundingClientRect().left);
    }
    if (document.getElementById("posTopAppReportHealth")!==null){
      this.docDivReportHealth = document.getElementById("posTopAppReportHealth");
      this.posDivReportHealth.Left = this.docDivReportHealth.offsetLeft;
      this.posDivReportHealth.Top = this.docDivReportHealth.offsetTop;
      this.posDivReportHealth.Client.Top=Math.round(this.docDivReportHealth.getBoundingClientRect().top);
      this.posDivReportHealth.Client.Left=Math.round(this.docDivReportHealth.getBoundingClientRect().left);
    }
  }


titleHeight:number=0;
posItem:number=0;
eventClientY:number=0;
@HostListener('window:mouseup', ['$event'])
onMouseUp(event: MouseEvent) {
  //this.selectedPosition = { x: event.pageX, y: event.pageY };
  this.getPosDivAfterTitle();
  this.eventClientY=event.clientY;

}
findPosItem(sizeBox:any){
  //this.posItem=this.confTableAll.height - this.posDivAfterTitle.Client.Top - this.titleHeight;
  const thePos=Number(this.eventClientY)-Number(this.posDivAfterTitle.Client.Top)-Number(this.titleHeight);
  this.posItem= Math.trunc(thePos / 20) * 20;
  if (this.posItem===0) { this.posItem=1;}
  if (Number(sizeBox)+this.posItem > this.confTableAll.height){
    this.posItem=this.confTableAll.height - Number(sizeBox);
  }
}
/****
onMouseDown(evt: MouseEvent) {
  this.selectedPosition = { x: evt.pageX, y: evt.pageY };
}

onMouseMove(evt: MouseEvent) {
  this.selectedPosition = { x: evt.pageX, y: evt.pageY };
}
 */

  


@HostListener('window:resize', ['$event'])
onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;
  }

ngOnInit(): void {
  
  this.getPosDivOthers();
  this.getPosDivAfterTitle();
  this.sizeBox.widthContent=160;
  this.sizeBox.widthOptions=160;
  this.sizeBox.heightItem=25;
  this.sizeBox.maxHeightContent=275;
  this.sizeBox.maxHeightOptions=275;
  this.sizeBox.scrollY='hidden';

  this.SpecificForm.controls['FileName'].setValue('');
  this.tabMeal[0].name='Breakfast';
  this.tabMeal.push({name:''});
  this.tabMeal[1].name='Lunch';
  this.tabMeal.push({name:''});
  this.tabMeal[2].name='Dinner';
  this.tabMeal.push({name:''});
  this.tabMeal[3].name='Snack';
  var i=0;
  for (i=0; i<3; i++){
    this.TabOfId[i]=0;
  }
  this.TabAction[0].name='cancel';
  const A={name:'A'};
  this.TabAction.push(A);
  this.TabAction[1].name='insert before';
  const B={name:'A'};
  this.TabAction.push(B);
  this.TabAction[2].name='insert after';
  const C={name:'A'};
  this.TabAction.push(C);
  this.TabAction[3].name='delete';
  const tabItems=['date','meal','food'];
  
  this.NewTabAction[0].type='';
  this.NewTabAction[0].name='cancel';
  var k=0;
  for (i=0; i<tabItems.length; i++){
      for (var j=0; j<3; j++){
        k++;
        const D={type:'a',name:'A'};
        this.NewTabAction.push(D);
        this.NewTabAction[k].type=tabItems[i];
        this.NewTabAction[k].name=this.TabAction[j+1].name;
      }
  }

  for (var i=0; i<this.dialogue.length; i++){
    this.dialogue[i]=false;
  }
  this.searchOneDateHealth=0;
  this.theEvent.target.id='New';
  this.CreateDay(this.theEvent);
  //this.GetRecord(this.XMVConfig.BucketFitness,this.Google_Object_Health,0);
  //this.GetRecord(this.XMVConfig.BucketFitness,this.Google_Object_Calories,1);
  if (this.InHealthAllData.fileType!==''){
    this.FillHealthAllInOut(this.HealthAllData,this.InHealthAllData);
    this.initTrackRecord();
    this.EventHTTPReceived[0]=true;
    this.SpecificForm.controls['FileName'].setValue(this.identification.fitness.files.fileHealth);
  } else {
    this.GetRecord(this.identification.fitness.bucket,this.identification.fitness.files.fileHealth,0);
  }
  if (this.InConfigCaloriesFat.fileType!==''){
    this.ConfigCaloriesFat=this.InConfigCaloriesFat;
    this.EventHTTPReceived[1]=true;
    this.CreateDropDownCalFat();
  } else {
    this.GetRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.calories,1);
  }
  if (this.InConvertUnit.fileType===''){
    this.GetRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.convertUnit,2);
  } else {
    this.ConvertUnit=this.InConvertUnit;
    this.EventHTTPReceived[2]=true;
  }
  if (this.InConfigHTMLFitHealth.fileType===''){
    this.GetRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.confHTML,3);

  } else {
    this.ConfigHTMLFitHealth=this.InConfigHTMLFitHealth;
    this.confTableAll=this.InConfigHTMLFitHealth.ConfigHealth.confTableAll;
    this.EventHTTPReceived[3]=true;
    this.calculateHeight();
  }
  // TO BE REVIEWED IN ORDER TO READ, MODIFY ONLINE AND SAVE
  //this.ConfigHTMLFitness.tabConfig[0].confTableAll=this.confTableAll;
  //this.SaveNewRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.confHTML, this.ConfigHTMLFitness);

  if (this.InConfigChart.fileType===''){
    this.GetRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.confChart,4);
  } else {
    this.ConfigChart=this.InConfigChart;
    this.EventHTTPReceived[4]=true;
  }

  if (this.fileParamChart.fileType===''){
    this.GetRecord(this.identification.fitness.bucket,this.identification.fitness.files.myChartConfig,5);
  } else {
    this.fileParamChart=this.InFileParamChart;
    this.EventHTTPReceived[5]=true;
  }
  if (this.fileRecipe.fileType===''){
    this.GetRecord(this.identification.fitness.bucket,this.identification.fitness.files.recipe,6);
  } 
 
 
  this.getScreenWidth = window.innerWidth;
  this.getScreenHeight = window.innerHeight;
  this.device_type = navigator.userAgent;
  this.device_type = this.device_type.substring(10, 48);
  this.HTTP_Address=this.Google_Bucket_Access_RootPOST +  "logconsole/o?name="  ;
  this.SelectDisplay();
  const theDate=new Date;
  this.TheSelectDisplays.controls['startRange'].setValue('');
  this.TheSelectDisplays.controls['endRange'].setValue('');

  if (this.triggerFunction!==0){
    if (this.triggerFunction===3){
      this.TheSelectDisplays.controls['DisplayAll'].setValue('Y');
    } else if (this.triggerFunction===5){
      this.TheSelectDisplays.controls['MgtCalories'].setValue('Y');
    } else if (this.triggerFunction===7){
      this.TheSelectDisplays.controls['DisplayChart'].setValue('Y');
    } 

    const theSelection='Y-'+this.triggerFunction;
    this.SelRadio(theSelection.trim());
  }
}


calculateHeight(){
  var i=0;
  i=this.confTableAll.title.height.indexOf('px');
  this.titleHeight=Number(this.confTableAll.title.height.substring(0,i));
}

checkText:string='';
SearchText(event:any){
  if (event.currentTarget.id==='search' && event.currentTarget.value!==''){
    this.checkText=event.currentTarget.value.toLowerCase().trim();
  } else { 
    this.checkText=''; 
  }
}

dateRangeSelection(event:any){
  this.error_msg='';
  this.isRangeDateError=false;
  var startD=new Date();
  var endD=new Date();
  var search=0;
  
  if (this.TheSelectDisplays.controls['startRange'].value!==''){
    startD=this.TheSelectDisplays.controls['startRange'].value;
  } else {this.dateRangeStart=new Date()}
  if (this.TheSelectDisplays.controls['endRange'].value!==''){
    endD=this.TheSelectDisplays.controls['endRange'].value;
  } else {endD=new Date(); }

  if (this.TheSelectDisplays.controls['startRange'].value!=='' && this.TheSelectDisplays.controls['endRange'].value===''){
    search=1;
  } else
  if (this.TheSelectDisplays.controls['startRange'].value!=='' && this.TheSelectDisplays.controls['endRange'].value!==''){
    if ( startD > endD){
      this.isRangeDateError=true;
      this.error_msg='end date must be after startDate';
    } else { search=2;} // range date selected  
  } 

  if (this.error_msg===''){
      if (event.target.id==='selectCacCal'){
          this.dateRangeStart=startD;
          this.dateRangeEnd=endD;
          this.filterCalc=true;
          this.searchOneDate=search;

      } else if (event.target.id==='selectAllData'){
          this.filterHealth=true;
          this.dateRangeStartHealth=startD;
          this.dateRangeEndHealth=endD;
          this.searchOneDateHealth=search;
      }
        this.TheSelectDisplays.controls['startRange'].setValue('');
        this.TheSelectDisplays.controls['endRange'].setValue('');
    }

}

CreateDropDownCalFat(){

  //this.tabType.splice(0,this.tabType.length);
  this.tabFood.splice(0,this.tabFood.length);
  var i=0;
  var j=0;

  for (i=0; i<this.ConfigCaloriesFat.tabCaloriesFat.length; i++){
      //this.tabType.push({name:''});
      //this.tabType[this.tabType.length-1].name=this.ConfigCaloriesFat.tabCaloriesFat[i].Type.toLowerCase().trim();
      for (j=0; j<this.ConfigCaloriesFat.tabCaloriesFat[i].Content.length; j++){
        this.tabFood.push({name:''});
        this.tabFood[this.tabFood.length-1].name=this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j].Name.toLowerCase().trim();;
      }
   }
   //this.tabType.sort((a, b) => (a.name < b.name) ? -1 : 1);
   this.tabFood.sort((a, b) => (a.name < b.name) ? -1 : 1);

}

cancelRange(event:any){
  if (event.target.id==='selectCacCal'){
    this.filterCalc=false;

  } else  if (event.target.id==='selectAllData'){
      this.filterHealth=false;
}
}

SelectDisplay(){
  if (this.TheSelectDisplays.controls['CreateNew'].value==='Y'){
        this.isCreateNew=true;
    } else {
      this.isCreateNew=false;
    }
  if (this.TheSelectDisplays.controls['DisplaySpecific'].value==='Y'){
      this.isDisplaySpecific=true;
    } else {
      this.isDisplaySpecific=false;
    }  
  if (this.TheSelectDisplays.controls['DisplayAll'].value==='Y'){
      this.isDisplayAll=true;
    } else {
      this.isDisplayAll=false;
    }
}

onSelectedDate(){
  this.error_msg='';
  this.errorFn='';
  const selected=this.TheSelectDisplays.controls['SelectedDate'].value;
  this.isSelectedDateFound=false;
  var i=0;
  for (i=0; i<this.HealthAllData.tabDailyReport.length && this.HealthAllData.tabDailyReport[i].date!==this.TheSelectDisplays.controls['SelectedDate'].value; i++){}
  if (i<this.HealthAllData.tabDailyReport.length){
    // date is found
    this.SelectedRecord = new DailyReport; 
    this.fillAllData(this.HealthAllData.tabDailyReport[i],this.SelectedRecord);
    
    //this.SelectedRecord=this.HealthAllData.tabDailyReport[i];
    this.isSelectedDateFound=true;
    this.SelectedRecordNb=i;
  } else {this.error_msg='no record found for this date';  this.errorFn='Sel';}
}

CheckDupeDate(theDate:Date){
var i=0;
if (this.HealthAllData.tabDailyReport.length>0){
  for (i=0; i<this.HealthAllData.tabDailyReport.length && this.HealthAllData.tabDailyReport[i].date!==theDate; i++){}
  if (i<this.HealthAllData.tabDailyReport.length){
    this.error_msg='This date already exists - please modify';
  }
}
}

CreateTabFood(item:any, value:any){
  this.tabInputMeal.splice(0,this.tabInputMeal.length);
  this.tabInputFood.splice(0,this.tabInputFood.length);
  var iTab:number=0;
  this.error_msg='';

  if (item==='Food'){
    iTab=-1;
    for (var i=0; i<this.tabFood.length; i++){
      if (this.tabFood[i].name.substr(0,value.trim().length).toLowerCase().trim()===value.toLowerCase().trim()){
        iTab++;
        this.tabInputFood[iTab]=this.tabFood[i].name.toLowerCase().trim();
      }
    }
    this.sizeBoxContentFood=this.sizeBox.heightItem  * this.tabInputFood.length;
    if (this.sizeBoxContentFood>this.sizeBox.maxHeightContent){
      this.sizeBoxContentFood=this.sizeBox.maxHeightContent;
      this.sizeBoxFood=this.sizeBox.maxHeightOptions;
      this.sizeBox.scrollY="scroll";
    } else {
      this.sizeBoxFood=this.sizeBoxContentFood;
      this.sizeBox.scrollY="hidden";
    }
    this.findPosItem(this.sizeBoxFood);

    this.styleBoxFood=getStyleDropDownContent(this.sizeBoxContentFood, this.sizeBox.widthContent );
    //this.styleBoxOptionFood=getStyleDropDownBox(this.sizeBoxFood, this.sizeBox.widthOptions, this.offsetLeft - 24, this.selectedPosition.y -this.posDivAfterTitle.Client.Top - 255, this.sizeBox.scrollY);
    this.styleBoxOptionFood=getStyleDropDownBox(this.sizeBoxFood, this.sizeBox.widthOptions, this.offsetLeft +100, this.posItem, this.sizeBox.scrollY);

  }
  else if (item==='Meal'){
      iTab=-1;
      for (var i=0; i<this.tabMeal.length; i++){
        if (this.tabMeal[i].name.substr(0,value.trim().length).toLowerCase().trim()===value.toLowerCase().trim()){
          iTab++;
          this.tabInputMeal[iTab]=this.tabMeal[i].name.toLowerCase().trim();
        }
      }
      this.sizeBoxContentMeal=this.sizeBox.heightItem  * this.tabInputMeal.length;
      if (this.sizeBoxContentMeal>this.sizeBox.maxHeightContent){
        this.sizeBoxContentMeal=this.sizeBox.maxHeightContent;
        this.sizeBoxMeal=this.sizeBox.maxHeightOptions;
      } else {
        this.sizeBoxMeal=this.sizeBoxContentMeal;
        this.sizeBox.scrollY="scroll";
      }
      this.findPosItem(this.sizeBoxMeal);
      this.sizeBox.scrollY="hidden";

      this.styleBoxMeal=getStyleDropDownContent(this.sizeBoxContentMeal, this.sizeBox.widthContent - 50);
      //this.styleBoxOptionMeal=getStyleDropDownBox(this.sizeBoxMeal, this.sizeBox.widthOptions - 50, this.offsetLeft - 20,  this.selectedPosition.y - this.posDivAfterTitle.Client.Top  - 255, this.sizeBox.scrollY);
      this.styleBoxOptionMeal=getStyleDropDownBox(this.sizeBoxMeal, this.sizeBox.widthOptions - 50, this.offsetLeft +70,  this.posItem, this.sizeBox.scrollY);
    }

}

onSelMealFood(event:any){
  this.error_msg='';
  this.findIds(event.target.id);
  if (event.currentTarget.id.substring(0,7)==='selFood'){
    this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].name =event.target.textContent.toLowerCase().trim();
    this.tabInputFood.splice(0,this.tabInputFood.length);
  } else if (event.currentTarget.id.substring(0,7)==='selMeal'){
    this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].name=event.target.textContent.toLowerCase().trim();
    this.tabInputMeal.splice(0,this.tabInputMeal.length);
  }
}

onInputDaily(event:any){
  this.error_msg='';
  var i=0;
  const fieldName=event.target.id.substring(0,4);
  this.findIds(event.target.id);
  if (event.target.id.substring(0,3)!=='Sel'){
    this.errorFn='Cre';
    if (fieldName==='date'){
      this.CheckDupeDate(event.target.value);
      this.HealthData.tabDailyReport[this.TabOfId[0]].date=event.target.value;
    } else   if (fieldName==='meal'){
      this.HealthData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].name=event.target.value;
      this.CreateTabFood('Meal',event.target.value);

    } else   if (fieldName==='ingr'){
      this.HealthData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].name=event.target.value;
      this.CreateTabFood('Food',event.target.value);

    }  else   if (fieldName==='quan'){
      this.HealthData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].quantity=event.target.value;
    } else   if (fieldName==='unit'){
      this.HealthData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].unit=event.target.value;
    } else   if (fieldName==='burn'){
      this.HealthData.tabDailyReport[this.TabOfId[0]].burntCalories=event.target.value;
    }
  } else  if (event.target.id.substring(0,7)==='Selmeal'){
    this.errorFn='Sel';
      this.SelectedRecord.meal[this.TabOfId[0]].name=event.target.value;
    } else   if (event.target.id.substring(0,7)==='Selingr'){
      this.SelectedRecord.meal[this.TabOfId[0]].dish[this.TabOfId[1]].name=event.target.value;
    }  else   if (event.target.id.substring(0,7)==='Selquan'){
      this.SelectedRecord.meal[this.TabOfId[0]].dish[this.TabOfId[1]].quantity=event.target.value;
    } else   if (event.target.id.substring(0,7)==='Selunit'){
      this.SelectedRecord.meal[this.TabOfId[0]].dish[this.TabOfId[1]].unit=event.target.value;
    } else   if (event.target.id.substring(0,7)==='Selburn'){
      this.SelectedRecord.burntCalories=event.target.value;
    } else   if (event.target.id.substring(0,7)==='Seldate'){
      if (event.target.value!==this.TheSelectDisplays.controls['SelectedDate'].value){
        this.CheckDupeDate(event.target.value);
      }
      this.SelectedRecord.date=event.target.value;
    }  
}

offsetHeight:number=0;
offsetLeft:number=0;
offsetTop:number=0;
offsetWidth:number=0;
scrollHeight:number=0;
scrollTop:number=0;

onInputDailyAll(event:any){
//this.offsetHeight= event.currentTarget.offsetHeight;
this.offsetLeft = event.currentTarget.offsetLeft;
//this.offsetTop = event.currentTarget.offsetTop;
this.offsetWidth = event.currentTarget.offsetWidth;
//this.scrollHeight = event.currentTarget.scrollHeight;
//this.scrollTop = event.currentTarget.scrollTop;
//console.log('offsetHeight='+this.offsetHeight +'  offsetLeft= '+this.offsetLeft + ' offsetTop=' + this.offsetTop 
//+ ' scrollHeight='+this.scrollHeight+ '  scrollTop=' +this.scrollTop);

  this.isAllDataModified=true;
  this.error_msg='';
  var i=0;
  const fieldName=event.target.id.substring(0,7);
  this.findIds(event.target.id);
    if (fieldName==='dateAll'){
      this.CheckDupeDate(event.target.value);
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].date=event.target.value;
      this.tabNewRecordAll[this.TabOfId[0]].nb=1;
    } else   if (fieldName==='mealAll'){
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].name=event.target.value;
      this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].nb=1;
      this.CreateTabFood('Meal',event.target.value);
    } else   if (fieldName==='ingrAll'){
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].name=event.target.value;
      this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb=1;
      this.CreateTabFood('Food',event.target.value);
    }  else   if (fieldName==='quanAll'){
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].quantity=event.target.value;
      this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb=1;
    } else   if (fieldName==='unitAll'){
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].unit=event.target.value;
      this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb=1;
    } else   if (fieldName==='burnAll'){
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].burntCalories=event.target.value;
      this.tabNewRecordAll[this.TabOfId[0]].nb=1;
    } 
}

findAction(idString:string){
  this.error_msg='';
  var j=-1;
  for (var i=1; i<idString.length && idString.substring(i,i+1)!==':'; i++){
  }
  this.myType=idString.substring(0,i).trim();
  this.myAction=idString.substring(i+1).trim();
}

onDropDownAll(event:any){
    this.theEvent.target.id='selAction-'+this.TabOfId[0]+'-'+this.TabOfId[1]+'-'+this.TabOfId[2];
    this.theEvent.target.textContent=event.target.textContent;
    this.onAction(this.theEvent);
}


posDelConfirm:number=0;
posDelDate=330;
posDelMeal=410;
posDelIngr=480;
delMsg:string='';

DelAfterConfirm(event:any){
  this.isDeleteItem=false;
  if (  event.currentTarget.id.substring(0,13)==='YesDelConfirm'){
    if (this.theEvent.target.id.substring(0,10)==='DelAllDate'){
        this.theEvent.target.id='DelAllDate-'+this.TabOfId[0];

        this.DeleteDay(this.theEvent);
       
        }
    else 
      if (this.theEvent.target.id.substring(0,10)==='DelAllMeal'){
        this.theEvent.target.id='DelAllMeal-'+this.TabOfId[0]+'-'+this.TabOfId[1];
        
        this.DeleteMeal(this.theEvent);
        
      }
    else 
      if (this.theEvent.target.id.substring(0,7)==='DelAll-'){
        this.theEvent.target.id='DelAll-'+this.TabOfId[0]+'-'+this.TabOfId[1]+'-'+this.TabOfId[2];
        
        this.DeleteIngredient(this.theEvent);
        
      }
    } 
}



onAction(event:any){
  this.findIds(event.target.id);
  this.dialogue[this.prevDialogue]=false;
  if (event.target.id.substring(0,10)==='openAction'){
    this.prevDialogue=6;
    this.dialogue[this.prevDialogue]=true;
    this.sizeBox.heightOptions=this.sizeBox.heightItem  * (this.NewTabAction.length) + 10;
    this.sizeBox.heightContent=this.sizeBox.heightOptions;
    this.findPosItem(this.sizeBox.heightOptions);

    this.styleBox=getStyleDropDownContent(this.sizeBox.heightContent, this.sizeBox.widthContent);
    // this.styleBoxOption=getStyleDropDownBox(this.sizeBox.heightOptions, this.sizeBox.widthOptions,  60, this.selectedPosition.y - this.posDivAfterTitle.Client.Top - 279, this.sizeBox.scrollY);
    this.styleBoxOption=getStyleDropDownBox(this.sizeBox.heightOptions, this.sizeBox.widthOptions,  60, this.posItem, this.sizeBox.scrollY);

  } else  if (event.target.id.substring(0,9)==='selAction'){
      if (event.target.textContent.indexOf('cancel')!==-1){
      } else {
        this.isAllDataModified=true;
        this.findAction(event.target.textContent);
        if (this.myType.trim()==="date" ){
          if (this.myAction==="insert after"){
            this.theEvent.target.id='AllDateA-'+this.TabOfId[0];
            this.CreateDay(this.theEvent);
          } else if (this.myAction==="insert before"){
            this.theEvent.target.id='AllDateB-'+this.TabOfId[0];
            this.CreateDay(this.theEvent);
          } else if (this.myAction==="delete"){
            this.theEvent.target.id='DelAllDate-'+this.TabOfId[0];
            this.delMsg=' date=' + this.HealthAllData.tabDailyReport[this.TabOfId[0]].date;
            this.posDelConfirm=this.posDelDate;
            this.isDeleteItem=true;
            
          } 

        } else if (this.myType.trim()==="meal" ){
          if (this.myAction==="insert after"){
            this.theEvent.target.id='AllMealA-'+this.TabOfId[0]+'-'+this.TabOfId[1];
            this.CreateMeal(this.theEvent);

          } else if (this.myAction==="insert before"){
            this.theEvent.target.id='AllMealB-'+this.TabOfId[0]+'-'+this.TabOfId[1];
            this.CreateMeal(this.theEvent);

          } else if (this.myAction==="delete"){
            this.theEvent.target.id='DelAllMeal-'+this.TabOfId[0]+'-'+this.TabOfId[1];
            this.delMsg=' meal=' + this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].name;
            this.posDelConfirm=this.posDelMeal;
            this.isDeleteItem=true;
            
          } 

        } else if (this.myType.trim()==="food" ){
          if (this.myAction==="insert before"){
            this.theEvent.target.id='AllIngrB-'+this.TabOfId[0]+'-'+this.TabOfId[1]+'-'+this.TabOfId[2];
            this.CreateIngredient(this.theEvent);

          } else if (this.myAction==="insert after"){
            this.theEvent.target.id='AllIngrA-'+this.TabOfId[0]+'-'+this.TabOfId[1]+'-'+this.TabOfId[2];
            this.CreateIngredient(this.theEvent);

          } else if (this.myAction==="delete"){
            this.theEvent.target.id='DelAll-'+this.TabOfId[0]+'-'+this.TabOfId[1]+'-'+this.TabOfId[2];
            this.isDeleteItem=true;
            this.delMsg=
            ' ingredient ' + this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].name
            + ' of meal ' + this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].name;;
            this.posDelConfirm=this.posDelIngr;
          } 
        }
      }
  }
  else if (event.target.id.substring(0,15)==='CreDialogueDate'){
    this.prevDialogue=0;
    this.dialogue[this.prevDialogue]=true;
  } else if (event.target.id.substring(0,15)==='CreDialogueMeal'){
    this.prevDialogue=1;
    this.dialogue[this.prevDialogue]=true;
  } else if (event.target.id.substring(0,15)==='CreDialogueIngr'){
    this.prevDialogue=2;
    this.dialogue[this.prevDialogue]=true;
  } else if (event.target.id.substring(0,15)==='SelDialogueDate'){
    this.prevDialogue=3;
    this.dialogue[this.prevDialogue]=true;
  } else if (event.target.id.substring(0,15)==='SelDialogueMeal'){
    this.prevDialogue=4;
    this.dialogue[this.prevDialogue]=true;
  } else if (event.target.id.substring(0,15)==='SelDialogueIngr'){
    this.prevDialogue=5;
    this.dialogue[this.prevDialogue]=true;
  } else if (event.target.id.substring(0,7)==='SelMeal'){
    if (event.target.textContent==='insert after'){
      this.theEvent.target.id='SelMealA-'+this.TabOfId[0];
      this.CreateMeal(this.theEvent);

    } else if (event.target.textContent==='insert before'){
      this.theEvent.target.id='SelMealB-'+this.TabOfId[0];
      this.CreateMeal(this.theEvent);
      
    } else if (event.target.textContent==='delete'){
      this.theEvent.target.id='DelSelMeal-'+this.TabOfId[0];
      this.DeleteMeal(this.theEvent);
      
    }
  } else if (event.target.id.substring(0,7)==='SelIngr'){
    if (event.target.textContent==='insert after'){
      this.theEvent.target.id='SelIngrA-'+this.TabOfId[0]+'-'+this.TabOfId[1];
      this.CreateIngredient(this.theEvent);

    } else if (event.target.textContent==='insert before'){
      this.theEvent.target.id='SelIngrB-'+this.TabOfId[0]+'-'+this.TabOfId[1];
      this.CreateIngredient(this.theEvent);
      
    } else if (event.target.textContent==='delete'){
      this.theEvent.target.id='DelSelIngr-'+this.TabOfId[0]+'-'+this.TabOfId[1];
      this.DeleteIngredient(this.theEvent);
      
    }
  }   else if (event.target.id.substring(0,7)==='CreMeal'){
    if (event.target.textContent==='insert after'){
      this.theEvent.target.id='CreMealA-'+this.TabOfId[0]+'-'+this.TabOfId[1];
      this.CreateMeal(this.theEvent);

    } else if (event.target.textContent==='insert before'){
      this.theEvent.target.id='CreMealB-'+this.TabOfId[0]+'-'+this.TabOfId[1];
      this.CreateMeal(this.theEvent);
      
    } else if (event.target.textContent==='delete'){
      this.theEvent.target.id='DelCreMeal-'+this.TabOfId[0]+'-'+this.TabOfId[1];
      this.DeleteMeal(this.theEvent);
      
    }
  } else if (event.target.id.substring(0,7)==='CreIngr'){
    if (event.target.textContent==='insert after'){
      this.theEvent.target.id='CreIngrA-'+this.TabOfId[0]+'-'+this.TabOfId[1]+'-'+this.TabOfId[2];
      this.CreateIngredient(this.theEvent);

    } else if (event.target.textContent==='insert before'){
      this.theEvent.target.id='CreIngrB-'+this.TabOfId[0]+'-'+this.TabOfId[1]+'-'+this.TabOfId[2];
      this.CreateIngredient(this.theEvent);
      
    } else if (event.target.textContent==='delete'){
      this.theEvent.target.id='DelCreIngr-'+this.TabOfId[0]+'-'+this.TabOfId[1]+'-'+this.TabOfId[2];
      this.DeleteIngredient(this.theEvent);
      
    }
  } else if (event.target.id.substring(0,10)==='ActionDate'){
    if (event.target.textContent==='insert after'){
      this.theEvent.target.id='DateA-'+this.TabOfId[0];
      this.CreateDay(this.theEvent);

    } else if (event.target.textContent==='insert before'){
      this.theEvent.target.id='DateB-'+this.TabOfId[0];
      this.CreateDay(this.theEvent);
      
    } else if (event.target.textContent==='delete'){
      this.theEvent.target.id='DelDate-'+this.TabOfId[0];
      this.DeleteDay(this.theEvent);
      
    }
  }


  if (this.prevDialogue < 6){
    this.sizeBox.heightOptions=this.sizeBox.heightItem  * (this.TabAction.length + 1) ;
    this.sizeBox.heightContent=this.sizeBox.heightOptions;

    this.styleBox=getStyleDropDownContent(this.sizeBox.heightContent, this.sizeBox.widthContent);
    this.styleBoxOption=getStyleDropDownBox(this.sizeBox.heightOptions, this.sizeBox.widthOptions,  30, 0,this.sizeBox.scrollY);


  } else if (this.isDeleteItem===true){
    this.sizeBox.heightOptions=90 ;
    this.sizeBox.heightContent=90;

    this.styleBox=getStyleDropDownContent(this.sizeBox.heightContent, 240);
    //this.styleBoxOption=getStyleDropDownBox(this.sizeBox.heightOptions, 240,  60, this.selectedPosition.y - this.posDivAfterTitle.Client.Top - this.posDelConfirm, this.sizeBox.scrollY);
    this.styleBoxOption=getStyleDropDownBox(this.sizeBox.heightOptions, 240,  60, this.posItem, this.sizeBox.scrollY);

  }
}

DeleteIngredient(event:any){
  this.findIds(event.target.id);
  if (event.target.id.substring(0,6)==='DelCre'){
    this.HealthData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish.splice(this.TabOfId[2],1);
    if (this.HealthData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish.length===0){
      this.theEvent.target.id='CreIngrA-'+this.TabOfId[0];
      this.CreateIngredient(this.theEvent);
    } else {
        this.tabNewRecordAll.splice(this.TabOfId[0].meal[this.TabOfId[1]].dish.splice(this.TabOfId[2],1));
    }
  } else  if(event.target.id.substring(0,6)==='DelSel'){
    this.SelectedRecord.meal[this.TabOfId[0]].dish.splice(this.TabOfId[1],1);
    if (this.SelectedRecord.meal[this.TabOfId[1]].dish.length===0){
      this.theEvent.target.id='SelIngrA-'+this.TabOfId[0];
      this.CreateIngredient(this.theEvent);
    }
  } else  if(event.target.id.substring(0,6)==='DelAll'){
    this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish.splice(this.TabOfId[2],1);
    this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food.splice(this.TabOfId[2],1);
    if (this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish.length===0){
      this.theEvent.target.id='AllIngrA-'+this.TabOfId[0]+'-'+this.TabOfId[1]+'-'+this.TabOfId[2];
      this.CreateIngredient(this.theEvent);

    } 
  }
}

DeleteMeal(event:any){
  this.findIds(event.target.id);
  if (event.target.id.substring(0,6)==='DelCre'){
    this.HealthData.tabDailyReport[this.TabOfId[0]].meal.splice(this.TabOfId[1],1);
    if (this.HealthData.tabDailyReport[this.TabOfId[0]].meal.length===0){
      this.theEvent.target.id='CreMealA-'+this.TabOfId[0];
      this.CreateMeal(this.theEvent);
      }
  } else if (event.target.id.substring(0,6)==='DelSel'){
    this.SelectedRecord.meal.splice(this.TabOfId[0],1);
    if (this.SelectedRecord.meal.length===0){
      this.theEvent.target.id='SellMealA-'+this.TabOfId[0];
      this.CreateMeal(this.theEvent);
    }
  } else if (event.target.id.substring(0,6)==='DelAll'){
    this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal.splice(this.TabOfId[1],1);
    this.tabNewRecordAll[this.TabOfId[0]].meal.splice(this.TabOfId[1],1);
    if (this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal.length===0){
      this.theEvent.target.id='AllMealA-'+this.TabOfId[0]+'-'+this.TabOfId[1];
      this.CreateMeal(this.theEvent);
    } 
  }
}

DeleteDay(event:any){
  this.findIds(event.target.id);
  if (event.target.id.substring(0,10)==='DelAllDate'){
    this.HealthAllData.tabDailyReport.splice(this.TabOfId[0],1);
    this.tabNewRecordAll.splice(this.TabOfId[0],1);
  } else if (event.target.id.substring(0,7)==='DelDate'){
    this.HealthData.tabDailyReport.splice(this.TabOfId[0],1);
    if (this.HealthData.tabDailyReport.length===0){
      this.theEvent.target.id='New';
      this.CreateDay(this.theEvent);
    }
  }
}

CreateIngredient(event:any){
  this.findIds(event.target.id);
  const theIngredient=new ClassDish;
  if (event.target.id.substring(0,8)==='CreIngrA'){
    this.HealthData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish.splice(this.TabOfId[2]+1,0,theIngredient);
  } if (event.target.id.substring(0,8)==='CreIngrB'){
    this.HealthData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish.splice(this.TabOfId[2],0,theIngredient);
  } else  if (event.target.id.substring(0,8)==='SelIngrA'){ // create after current ingredient
      this.SelectedRecord.meal[this.TabOfId[0]].dish.splice(this.TabOfId[1]+1,0,theIngredient);
  } else if (event.target.id.substring(0,8)==='SelIngrB'){ // create before current ingredient
      this.SelectedRecord.meal[this.TabOfId[0]].dish.splice(this.TabOfId[1],0,theIngredient);
  } if (event.target.id.substring(0,8)==='AllIngrA'){
    this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish.splice(this.TabOfId[2]+1,0,theIngredient);
    this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food.splice(this.TabOfId[2]+1,0,{nb:1});
  } if (event.target.id.substring(0,8)==='AllIngrB'){
    this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish.splice(this.TabOfId[2],0,theIngredient);
    this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food.splice(this.TabOfId[2],0,{nb:1});
  }
    
}

CreateMeal(event:any){
  this.findIds(event.target.id);
  const theMeal=new ClassMeal;
  if (event.target.id.substring(0,8)==='CreMealA'){
      this.HealthData.tabDailyReport[this.TabOfId[0]].meal.splice(this.TabOfId[1]+1,0,theMeal);
      const theIngredient=new ClassDish;
      this.HealthData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]+1].dish.push(theIngredient);
  } else if (event.target.id.substring(0,8)==='CreMealB') { // create before current  meal
      this.HealthData.tabDailyReport[this.TabOfId[0]].meal.splice(this.TabOfId[1],0,theMeal);
      const theIngredient=new ClassDish;
      this.HealthData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish.push(theIngredient);
  } else if (event.target.id.substring(0,8)==='SelMealA'){ // create after current  meal
      this.SelectedRecord.meal.splice(this.TabOfId[0]+1,0,theMeal);
      const theIngredient=new ClassDish;
      this.SelectedRecord.meal[this.TabOfId[0]+1].dish.push(theIngredient);
  } else if (event.target.id.substring(0,8)==='SelMealB') { // create before current  meal
      this.SelectedRecord.meal.splice(this.TabOfId[0],0,theMeal);
      const theIngredient=new ClassDish;
      this.SelectedRecord.meal[this.TabOfId[0]].dish.push(theIngredient);
  } else   if (event.target.id.substring(0,8)==='AllMealA'){
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal.splice(this.TabOfId[1]+1,0,theMeal);
      const theIngredient=new ClassDish;
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]+1].dish.push(theIngredient);
      const trackNew={nb:1,food:[{nb:1}]};
      this.tabNewRecordAll[this.TabOfId[0]].meal.splice(this.TabOfId[1]+1,0,trackNew);
  } else if (event.target.id.substring(0,8)==='AllMealB') { // create before current  meal
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal.splice(this.TabOfId[1],0,theMeal);
      const theIngredient=new ClassDish;
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish.push(theIngredient);
      const trackNew={nb:1,food:[{nb:1}]};
      this.tabNewRecordAll[this.TabOfId[0]].meal.splice(this.TabOfId[1],0,trackNew);
  }

}

CreateDay(event:any){
  this.findIds(event.target.id);
  const theDaily=new DailyReport;
  var iDate=0;
  if (event.target.id.substring(0,8)==='AllDateA'){
      this.HealthAllData.tabDailyReport.splice(this.TabOfId[0]+1,0,theDaily);
      iDate=this.TabOfId[0]+1;
      const trackNew={nb:1,meal:[{nb:1,food:[{nb:1}]}]};
      this.tabNewRecordAll.splice(this.TabOfId[0]+1,0,trackNew);
    } else if (event.target.id.substring(0,8)==='AllDateB'){
        this.HealthAllData.tabDailyReport.splice(this.TabOfId[0],0,theDaily)
        iDate=this.TabOfId[0]; 
        const trackNew={nb:1,meal:[{nb:1,food:[{nb:1}]}]};
        this.tabNewRecordAll.splice(this.TabOfId[0],0,trackNew);
    } if (event.target.id.substring(0,5)==='DateA'){
      this.HealthData.tabDailyReport.splice(this.TabOfId[0]+1,0,theDaily);
      iDate=this.TabOfId[0]+1;
    } else if (event.target.id.substring(0,5)==='DateB'){
      this.HealthData.tabDailyReport.splice(this.TabOfId[0],0,theDaily)
      iDate=this.TabOfId[0];
    } else if (event.target.id==='New'){
        this.HealthData.tabDailyReport.push(theDaily);
        iDate=this.HealthData.tabDailyReport.length-1;
    }
  if (event.target.id.substring(0,7)==='AllDate' ){
    const theMeal=new ClassMeal;
    this.HealthAllData.tabDailyReport[iDate].meal.push(theMeal);
    const theIngredient=new ClassDish;
    this.HealthAllData.tabDailyReport[iDate].meal[0].dish.push(theIngredient);
  } else  if (event.target.id.substring(0,4)==='Date' || event.target.id.substring(0,3)==='New'){
    const theMeal=new ClassMeal;
    this.HealthData.tabDailyReport[iDate].meal.push(theMeal);
    const theIngredient=new ClassDish;
    this.HealthData.tabDailyReport[iDate].meal[0].dish.push(theIngredient);
  }
}

FillHealthAllInOut(outFile:any, inFile:any){
  for (var i=0; i<inFile.tabDailyReport.length; i++){
    const theDaily=new DailyReport;
    outFile.tabDailyReport.push(theDaily);
    outFile.tabDailyReport[i].burntCalories=inFile.tabDailyReport[i].burntCalories;
    outFile.tabDailyReport[i].date =inFile.tabDailyReport[i].date;
    outFile.tabDailyReport[i].total =inFile.tabDailyReport[i].total;
    for (var j=0; j<inFile.tabDailyReport[i].meal.length; j++){
      
        const theMeal=new ClassMeal;
        outFile.tabDailyReport[i].meal.push(theMeal);
    
      outFile.tabDailyReport[i].meal[j].name=inFile.tabDailyReport[i].meal[j].name;
      outFile.tabDailyReport[i].meal[j].total=inFile.tabDailyReport[i].meal[j].total;
      for (var k=0; k<inFile.tabDailyReport[i].meal[j].dish.length; k++){
          
            const theIngr=new ClassDish;
            outFile.tabDailyReport[i].meal[j].dish.push(theIngr);
            outFile.tabDailyReport[i].meal[j].dish[k].name=inFile.tabDailyReport[i].meal[j].dish[k].name;
            outFile.tabDailyReport[i].meal[j].dish[k].quantity=inFile.tabDailyReport[i].meal[j].dish[k].quantity;
            outFile.tabDailyReport[i].meal[j].dish[k].unit=inFile.tabDailyReport[i].meal[j].dish[k].unit;
            outFile.tabDailyReport[i].meal[j].dish[k].calFat=inFile.tabDailyReport[i].meal[j].dish[k].calFat;
        
      }
    }
    
  }

}

findIds(theId:string){
  this.error_msg='';
  
  var TabDash=[];
  this.TabOfId.splice(0,this.TabOfId.length);
  var j=-1;
  for (var i=4; i<theId.length; i++){
    if (theId.substring(i,i+1)==='-'){
        j++;
        TabDash[j]=i+1;
        TabDash.push(0);
    }
  }
  TabDash[j+1]=theId.length+1;

  i=0;
  for (j=0; j<TabDash.length-1; j++){
    this.TabOfId[i]=parseInt(theId.substring(TabDash[j],TabDash[j+1]-1));
    i++;
  }
}

initTrackRecord(){
  for (var i=0; i<this.HealthAllData.tabDailyReport.length; i++){
    if (this.tabNewRecordAll.length===0 || i!==0){
      const trackNew={nb:0,meal:[{nb:0,food:[{nb:0}]}]};
      this.tabNewRecordAll.push(trackNew);
    }
    
    for (var j= 0; j<this.HealthAllData.tabDailyReport[i].meal.length; j++){
        if (this.tabNewRecordAll[i].meal.length ===0 || j!==0){
          const trackNew={nb:0,food:[{nb:0}]};
          this.tabNewRecordAll[i].meal.push(trackNew);
        }
        for (var k=0;  k<this.HealthAllData.tabDailyReport[i].meal[j].dish.length; k++){
          if (this.tabNewRecordAll[i].meal[j].food.length ===0 || k!==0){
            const trackNew={nb:0};
            this.tabNewRecordAll[i].meal[j].food.push(trackNew);
          }
        }
    }
  }
  // this.alignRecord();
}

alignRecord(){
  for (var i=0; i<this.HealthAllData.tabDailyReport.length; i++){
    if (this.HealthAllData.tabDailyReport[i].total.Carbs===undefined){
      this.theEvent.target.id='AllDateA-'+i;
      this.CreateDay(this.theEvent);
      this.HealthAllData.tabDailyReport[i+1].date=this.HealthAllData.tabDailyReport[i].date;
      this.HealthAllData.tabDailyReport[i+1].burntCalories=this.HealthAllData.tabDailyReport[i].burntCalories;
      this.HealthAllData.tabDailyReport[i+1].total.Calories=this.HealthAllData.tabDailyReport[i].total.Calories;
      this.HealthAllData.tabDailyReport[i+1].total.Cholesterol=this.HealthAllData.tabDailyReport[i].total.Cholesterol;
      this.HealthAllData.tabDailyReport[i+1].total.Name=this.HealthAllData.tabDailyReport[i].total.Name;
      this.HealthAllData.tabDailyReport[i+1].total.GlyIndex=this.HealthAllData.tabDailyReport[i].total.GlyIndex;
      this.HealthAllData.tabDailyReport[i+1].total.Serving=this.HealthAllData.tabDailyReport[i].total.Serving;
      this.HealthAllData.tabDailyReport[i+1].total.ServingUnit=this.HealthAllData.tabDailyReport[i].total.ServingUnit;
      this.HealthAllData.tabDailyReport[i+1].total.Sugar=this.HealthAllData.tabDailyReport[i].total.Sugar;
      this.HealthAllData.tabDailyReport[i+1].total.Fat.Saturated=this.HealthAllData.tabDailyReport[i].total.Fat.Saturated;
      this.HealthAllData.tabDailyReport[i+1].total.Fat.Total=this.HealthAllData.tabDailyReport[i].total.Fat.Total;
      this.HealthAllData.tabDailyReport[i+1].total.Carbs=this.HealthAllData.tabDailyReport[i].total.Carbs;
      this.HealthAllData.tabDailyReport[i+1].total.Protein=this.HealthAllData.tabDailyReport[i].total.Protein;

      for (var j=0; j<this.HealthAllData.tabDailyReport[i].meal.length; j++){
        if (j>0){
          const nb1=i+1;
          const nb2=j-1;
          this.theEvent.target.id='AllMealA-'+nb1+'-'+nb2;
          this.CreateMeal(this.theEvent);
        }
        this.HealthAllData.tabDailyReport[i+1].meal[j].total.Calories=this.HealthAllData.tabDailyReport[i].meal[j].total.Calories;
        this.HealthAllData.tabDailyReport[i+1].meal[j].total.Cholesterol=this.HealthAllData.tabDailyReport[i].meal[j].total.Cholesterol;
        this.HealthAllData.tabDailyReport[i+1].meal[j].total.Name=this.HealthAllData.tabDailyReport[i].meal[j].total.Name;
        this.HealthAllData.tabDailyReport[i+1].meal[j].total.GlyIndex=this.HealthAllData.tabDailyReport[i].meal[j].total.GlyIndex;
        this.HealthAllData.tabDailyReport[i+1].meal[j].total.Serving=this.HealthAllData.tabDailyReport[i].meal[j].total.Serving;
        this.HealthAllData.tabDailyReport[i+1].meal[j].total.ServingUnit=this.HealthAllData.tabDailyReport[i].meal[j].total.ServingUnit;
        this.HealthAllData.tabDailyReport[i+1].meal[j].total.Sugar=this.HealthAllData.tabDailyReport[i].meal[j].total.Sugar;
        this.HealthAllData.tabDailyReport[i+1].meal[j].total.Fat.Saturated=this.HealthAllData.tabDailyReport[i].meal[j].total.Fat.Saturated;
        this.HealthAllData.tabDailyReport[i+1].meal[j].total.Fat.Total=this.HealthAllData.tabDailyReport[i].meal[j].total.Fat.Total;
        this.HealthAllData.tabDailyReport[i+1].meal[j].total.Carbs=this.HealthAllData.tabDailyReport[i].meal[j].total.Carbs;
        this.HealthAllData.tabDailyReport[i+1].meal[j].total.Protein=this.HealthAllData.tabDailyReport[i].meal[j].total.Protein;
        this.HealthAllData.tabDailyReport[i+1].meal[j].name=this.HealthAllData.tabDailyReport[i].meal[j].name;
        for (var k=0; k<this.HealthAllData.tabDailyReport[i].meal[j].dish.length; k++){
          if (k>0){
            const nb1=i+1;
            const nb2=j;
            const nb3=k-1;
            this.theEvent.target.id='AllIngrA-'+nb1+'-'+nb2+'-'+nb3;
            this.CreateIngredient(this.theEvent);
          }
          
          this.HealthAllData.tabDailyReport[i+1].meal[j].dish[k].name=this.HealthAllData.tabDailyReport[i].meal[j].dish[k].name;
          this.HealthAllData.tabDailyReport[i+1].meal[j].dish[k].quantity=this.HealthAllData.tabDailyReport[i].meal[j].dish[k].quantity;
          this.HealthAllData.tabDailyReport[i+1].meal[j].dish[k].unit=this.HealthAllData.tabDailyReport[i].meal[j].dish[k].unit;
          this.HealthAllData.tabDailyReport[i+1].meal[j].dish[k].calFat.Calories=this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.Calories;
          this.HealthAllData.tabDailyReport[i+1].meal[j].dish[k].calFat.Cholesterol=this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.Cholesterol;
          this.HealthAllData.tabDailyReport[i+1].meal[j].dish[k].calFat.Name=this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.Name;
          this.HealthAllData.tabDailyReport[i+1].meal[j].dish[k].calFat.GlyIndex=this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.GlyIndex;
          this.HealthAllData.tabDailyReport[i+1].meal[j].dish[k].calFat.Serving=this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.Serving;
          this.HealthAllData.tabDailyReport[i+1].meal[j].dish[k].calFat.ServingUnit=this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.ServingUnit;
          this.HealthAllData.tabDailyReport[i+1].meal[j].dish[k].calFat.Sugar=this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.Sugar;
          this.HealthAllData.tabDailyReport[i+1].meal[j].dish[k].calFat.Fat.Saturated=this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.Fat.Saturated;
          this.HealthAllData.tabDailyReport[i+1].meal[j].dish[k].calFat.Fat.Total=this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.Fat.Total;
          this.HealthAllData.tabDailyReport[i+1].meal[j].dish[k].calFat.Carbs=this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.Carbs;
          this.HealthAllData.tabDailyReport[i+1].meal[j].dish[k].calFat.Protein= this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.Protein;
        }
      }
      this.theEvent.target.id='DelAllDate-'+i;
      this.DeleteDay(this.theEvent);
    }
  }
  this.isAllDataModified=true;
}

GetRecord(Bucket:string,GoogleObject:string, iWait:number){

    this.EventHTTPReceived[iWait]=false;
    this.NbWaitHTTP++;
    this.waitHTTP(this.TabLoop[iWait],30000,iWait);
    this.ManageGoogleService.getContentObject(this.configServer, Bucket, GoogleObject )
        .subscribe((data ) => {        
           
            if (iWait===0){
                this.FillHealthAllInOut(this.HealthAllData, data);
               
                //this.HealthAllData=data;
                this.HealthAllData.tabDailyReport.sort((a, b) => (a.date > b.date) ? -1 : 1);
                if (this.HealthAllData.fileType===''){
                  this.HealthAllData.fileType=this.identification.fitness.fileType.Health;
                }
                if (this.InHealthAllData.fileType===''){
                  this.FillHealthAllInOut(this.InHealthAllData, this.HealthAllData);
                }
                this.initTrackRecord();
                this.SpecificForm.controls['FileName'].setValue(this.identification.fitness.files.fileHealth);
              } else if (iWait===1){
                this.ConfigCaloriesFat=data;
                if (this.ConfigCaloriesFat.fileType===''){
                  this.ConfigCaloriesFat.fileType=this.identification.fitness.fileType.FitnessMyConfig;
                } 
                this.CreateDropDownCalFat();
              } else if (iWait===2){

                this.ConvertUnit=data;
                if (this.ConvertUnit.fileType===''){
                  this.ConvertUnit.fileType=this.identification.configFitness.fileType.convertUnit;
                } 
              } 
              else if (iWait===3){
                  this.ConfigHTMLFitHealth=data;
                  this.confTableAll=this.ConfigHTMLFitHealth.ConfigHealth.confTableAll;
                  this.calculateHeight();
              }
              else if (iWait===4){
                this.ConfigChart=data;
              } 
              else if (iWait===5){
                this.fileParamChart=data;
              } else if (iWait===6){
                this.fileRecipe=data;
              } 

              this.returnFile.emit(data);
              this.EventHTTPReceived[iWait]=true;
            },
            error_handler => {
                this.EventHTTPReceived[iWait]=true;
                if (iWait===0){
                    this.error_msg='File ' + this.identification.fitness.files.fileHealth + ' does not exist. Create it'; 
                          
                  } else if (iWait===1){
                    this.error_msg='File ' + this.identification.configFitness.files.calories + ' does not exist. Create it'; 
                                        
                  }
            } 
        )
    }


calculateHealth(selRecord:DailyReport){
  this.returnData = CalcFatCalories(this.ConfigCaloriesFat, selRecord, this.ConvertUnit);
  if (this.returnData.error>0){
    this.error_msg= this.returnData.error + ' nb of errors detected';
  }
}


fillAllData(inRecord:any, outRecord:any){
    var i=0;
    var j=0;

    outRecord.date=inRecord.date;
    outRecord.burntCalories=inRecord.burntCalories;
    outRecord.total=inRecord.total;
    for (i=0; i<inRecord.meal.length; i++){
      const theMeal=new ClassMeal;
      outRecord.meal.push(theMeal);
      outRecord.meal[outRecord.meal.length-1].name=inRecord.meal[i].name;
      outRecord.meal[outRecord.meal.length-1].total=inRecord.meal[i].total;
      for (j=0; j<inRecord.meal[i].dish.length; j++){
        const theIngredient=new ClassDish;
        outRecord.meal[outRecord.meal.length-1].dish.push(theIngredient);

        const iMeal=outRecord.meal.length-1;
        outRecord.meal[iMeal].dish[ outRecord.meal[iMeal].dish.length-1]=inRecord.meal[i].dish[j];

        }
      }
  }

delDate(event:any){
  this.isDeleteConfirmed=true;
  this.findIds(event.target.id);
  this.recordToDelete=this.TabOfId[0];
  const theDate=this.HealthAllData.tabDailyReport[this.recordToDelete].date;
  this.error_msg='confirm record#' + this.recordToDelete + ' with date=' + theDate + 'to be deleted';
  this.scroller.scrollToAnchor('ListAll');
}

ConfirmDelDate(){
  const theDate=this.HealthAllData.tabDailyReport[this.recordToDelete].date;
  this.HealthAllData.tabDailyReport.splice(this.recordToDelete,1);
  this.error_msg='record#' + this.recordToDelete + ' with date=' + theDate + 'is deleted but file is not saved';
  this.errorFn='delDate';
  this.isDeleteConfirmed=false;
  this.isAllDataModified=true;

}

cancelDelDate(){
  this.isDeleteConfirmed=false;
}

CancelUpdateAll(event:any){
  this.CancelSave()

}


saveParamChart(event:any){
  this.fileParamChart.fileType=this.identification.fitness.fileType.myChart;
  this.fileParamChart.data=event;
  this.SaveNewRecord(this.identification.fitness.bucket, this.identification.fitness.files.myChartConfig, this.fileParamChart);
}

SaveCaloriesFat(event:any){
  // save this file
 // if (Array.isArray(event)===false){
  if (event.fileType===undefined){
    this.SpecificForm.controls['FileName'].setValue(event);
  } else if (event.tabCaloriesFat.length!==0) {
      this.ConfigCaloriesFat.tabCaloriesFat.splice(0, this.ConfigCaloriesFat.tabCaloriesFat.length);
      for (var i=0; i<event.tabCaloriesFat.length; i++){
        const CalFatClass = new ClassCaloriesFat;
        this.ConfigCaloriesFat.tabCaloriesFat.push(CalFatClass);
        this.ConfigCaloriesFat.tabCaloriesFat[i].Type=event.tabCaloriesFat[i].Type;
                for (var j=0; j<event.tabCaloriesFat[i].Content.length; j++){
          const itemClass= new ClassItem;
          this.ConfigCaloriesFat.tabCaloriesFat[this.ConfigCaloriesFat.tabCaloriesFat.length-1].Content.push(itemClass);
          this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j]=event.tabCaloriesFat[i].Content[j];
      }
      }
  


   // this.ConfigCaloriesFat=event;
    if (this.ConfigCaloriesFat.fileType===''){
      this.ConfigCaloriesFat.fileType=this.identification.configFitness.fileType.calories;
    }
    this.SaveNewRecord(this.identification.configFitness.bucket, this.SpecificForm.controls['FileName'].value, this.ConfigCaloriesFat);
    this.CreateDropDownCalFat();

  }
}

SaveRecipeFile(event:any){
  // save this file
 // if (Array.isArray(event)===false){
  if (event.fileType===undefined){
    this.SpecificForm.controls['FileName'].setValue(event);
  } else if (event.tabCaloriesFat.length!==0) {
      this.fileRecipe.tabCaloriesFat.splice(0, this.fileRecipe.tabCaloriesFat.length);
      for (var i=0; i<event.tabCaloriesFat.length; i++){
        const CalFatClass = new ClassCaloriesFat;
        this.fileRecipe.tabCaloriesFat.push(CalFatClass);
        this.fileRecipe.tabCaloriesFat[i].Type=event.tabCaloriesFat[i].Type;
        this.fileRecipe.tabCaloriesFat[i].Total=event.tabCaloriesFat[i].Total;
        for (var j=0; j<event.tabCaloriesFat[i].Content.length; j++){
              const itemClass= new ClassItem;
              this.fileRecipe.tabCaloriesFat[this.fileRecipe.tabCaloriesFat.length-1].Content.push(itemClass);
              this.fileRecipe.tabCaloriesFat[i].Content[j]=event.tabCaloriesFat[i].Content[j];
          }
      }
  
    if (this.fileRecipe.fileType===''){
      this.fileRecipe.fileType=this.identification.fitness.fileType.recipe;
    }
    this.SaveNewRecord(this.identification.fitness.bucket, this.SpecificForm.controls['FileName'].value, this.fileRecipe);


  }
}
ConfirmSave(event:any){
  this.SpecificForm.controls['FileName'].setValue(this.identification.fitness.files.fileHealth);
  this.error_msg='';
  if (event.target.id.substring(0,3)==='Cre'){
    // CHECK THAT THERE IS NO DUPE FOR THE DATE 
    var i=0;
    for (i=0; i<this.HealthData.tabDailyReport.length && this.error_msg===''; i++){
      this.CheckDupeDate(this.HealthData.tabDailyReport[i].date);
    }
    if (this.error_msg===''){
      this.IsSaveConfirmedCre = true;
      this.IsSaveConfirmedSel = false;
    } else {
      this.errorFn='Cre';
      this.IsSaveConfirmedCre = false;
      this.IsSaveConfirmedSel = false;
    }
  } else if (event.target.id.substring(0,3)==='Sel'){
    // CHECK THAT THERE IS NO DUPE FOR THE DATE 
    if (this.SelectedRecord.date!==this.TheSelectDisplays.controls['SelectedDate'].value){
        this.CheckDupeDate(this.SelectedRecord.date);
    }
    if (this.error_msg===''){
      this.IsSaveConfirmedCre = false;
      this.IsSaveConfirmedSel = true;
    } else {
      this.errorFn='Sel';
      this.IsSaveConfirmedCre = false;
      this.IsSaveConfirmedSel = false;
    }
  }  else if (event.target.id.substring(0,3)==='All'){
      this.IsSaveConfirmedAll = true;
      this.errorFn='All';
  }
} 

SaveCopy(){
this.HealthAllData.tabDailyReport.sort((a, b) => (a.date > b.date) ? -1 : 1);
if (this.HealthAllData.fileType!==''){
  this.HealthAllData.fileType=this.identification.fitness.fileType.Health;
}
this.SaveNewRecord(this.identification.fitness.bucket, this.SpecificForm.controls['FileName'].value, this.HealthAllData);
this.returnFile.emit(this.HealthAllData);
this.isCopyFile=false;
this.TheSelectDisplays.controls['CopyFile'].setValue('N');
this.errorFn='Copy';
}

CancelCopy(){
this.isCopyFile=false;
this.TheSelectDisplays.controls['CopyFile'].setValue('N');
this.errorFn='';
}

CancelRecord(event:any){
this.findIds(event.target.id);
if (event.target.id.substring(0,3)==='Cre'){
  this.HealthData.tabDailyReport.splice(0,this.HealthData.tabDailyReport.length);
  this.theEvent.target.id='New';
  this.CreateDay(this.theEvent);
} else if (event.target.id.substring(0,3)==='Sel'){
    this.SelectedRecord = new DailyReport; 
    this.isSelectedDateFound=false;
    this.TheSelectDisplays.controls['SelectedDate'].setValue('');
    // this.fillAllData(this.HealthAllData.tabDailyReport[this.SelectedRecordNb], this.SelectedRecord);
}
}
  
CancelSave(){
  this.tabInputMeal.splice(0,this.tabInputMeal.length);
  this.tabInputFood.splice(0,this.tabInputFood.length)
  this.HealthAllData.tabDailyReport.splice(0,this.HealthAllData.tabDailyReport.length)
  this.FillHealthAllInOut(this.HealthAllData,this.InHealthAllData);
  this.tabNewRecordAll.splice(0,this.tabNewRecordAll.length);
  this.initTrackRecord();
  this.IsSaveConfirmedCre = false;
  this.IsSaveConfirmedSel = false;
  this.IsSaveConfirmedAll = false;
  this.isAllDataModified=false;
  this.error_msg='';
  this.errorFn='';
  }

errCalcCalFat:string='';
SaveHealth(event:any){
    this.errCalcCalFat='';
    var trouve=false;
    var i=0
    this.IsSaveConfirmedCre = false;
    this.IsSaveConfirmedSel = false;
    if (event.target.id.substring(0,3)==='Sel') {
      this.calculateHealth(this.SelectedRecord);
      if (this.error_msg!==''){
        this.errCalcCalFat='errors found while caculating calories and fat';
      }
      this.SelectedRecord.total=this.returnData.outHealthData.total;
      this.SelectedRecord.meal=this.returnData.outHealthData.meal;
      this.SelectedRecord.burntCalories=this.returnData.outHealthData.burntCalories;
      if (this.SelectedRecord.date===this.TheSelectDisplays.controls['SelectedDate'].value){
        this.HealthAllData.tabDailyReport.splice(this.SelectedRecordNb,1);
          }
      this.errorFn='Sel';
      const theDaily=new DailyReport;
      this.HealthAllData.tabDailyReport.splice(this.SelectedRecordNb,0,theDaily);
      this.fillAllData(this.SelectedRecord,this.HealthAllData.tabDailyReport[this.SelectedRecordNb]);
      this.SelectedRecord = new DailyReport; 
      this.isSelectedDateFound=false;
      this.TheSelectDisplays.controls['SelectedDate'].setValue('');
      // insert the updated record of SelectedData
     
    } else if (event.target.id.substring(0,3)==='Cre') {
      this.errorFn='Cre';
      // insert the record at the end of HealthData
      for (i=0; i<this.HealthData.tabDailyReport.length; i++){
        const theDaily=new DailyReport;
        this.HealthAllData.tabDailyReport.push(theDaily);
        this.fillAllData(this.HealthData.tabDailyReport[i],this.HealthAllData.tabDailyReport[this.HealthAllData.tabDailyReport.length-1]);
        this.calculateHealth(this.HealthData.tabDailyReport[i]);
        if (this.error_msg!==''){
          this.errCalcCalFat='errors found while caculating calories and fat';
        }
        this.HealthData.tabDailyReport[i].total=this.returnData.outHealthData.total;
        this.HealthData.tabDailyReport[i].meal=this.returnData.outHealthData.meal;
      }
    } else if (event.target.id.substring(0,3)==='All') {
        this.IsSaveConfirmedAll=false;
        for (var i=0; i<this.HealthAllData.tabDailyReport.length; i++){
            trouve=false;
            if (this.tabNewRecordAll[i].nb===1){
              trouve=true;
            } else {
              for (var j=0; j<this.HealthAllData.tabDailyReport[i].meal.length && trouve===false; j++){
                if (this.tabNewRecordAll[i].meal[j].nb===1){
                  trouve=true;
                } 
                  for (var k=0; k<this.HealthAllData.tabDailyReport[i].meal[j].dish.length && trouve===false; k++){
                    if (this.tabNewRecordAll[i].meal[j].food[k].nb===1){
                      trouve=true;
                    } 
                  }

              }
            }
            if (trouve===true){
              this.calculateHealth(this.HealthAllData.tabDailyReport[i]);
              if (this.error_msg!==''){
                this.errCalcCalFat='errors found while caculating calories and fat';
              }
              this.HealthAllData.tabDailyReport[i].total=this.returnData.outHealthData.total;
              this.HealthAllData.tabDailyReport[i].meal=this.returnData.outHealthData.meal;
            }
        }
    }

    this.HealthAllData.tabDailyReport.sort((a, b) => (a.date > b.date) ? -1 : 1);
    if (this.HealthAllData.fileType!==''){
      this.HealthAllData.fileType=this.identification.fitness.fileType.Health;
    }
   // if (event.target.id.substring(0,3)==='All'){
    this.tabNewRecordAll.splice(0,this.tabNewRecordAll.length);
    this.initTrackRecord();
    //}
    this.SaveNewRecord(this.identification.fitness.bucket, this.SpecificForm.controls['FileName'].value, this.HealthAllData);
  }


SaveNewRecord(GoogleBucket:string, GoogleObject:string, record:any){
    //var file=new File ([JSON.stringify(this.HealthAllData)],GoogleObject, {type: 'application/json'});
    var file=new File ([JSON.stringify(record)],GoogleObject, {type: 'application/json'});
    if (GoogleObject==='ConsoleLog.json'){
      const myTime=new Date();
      GoogleObject='ConsoleLog.json-'+ myTime.toString().substring(4,21);
      file=new File ([JSON.stringify(this.myConsole)],GoogleObject, {type: 'application/json'});
      }  
    this.ManageGoogleService.uploadObject(this.configServer, GoogleBucket, file )
      .subscribe(res => {
              if (res.type===4){
                this.error_msg='File "'+ GoogleObject +'" is successfully stored in the cloud';
                this.isAllDataModified=false;
                this.returnFile.emit(record);
              }
            },
            error_handler => {
              //**this.LogMsgConsole('Individual Record is not updated: '+ this.Table_User_Data[this.identification.id].UserId );
              this.error_msg='File' + GoogleObject +' *** Save action failed - status is '+error_handler.status;
            } 
          )
      }



waitHTTP(loop:number, max_loop:number, eventNb:number){
  const pas=500;
  if (loop%pas === 0){
    console.log('waitHTTP ==> loop=' + loop + ' max_loop=' + max_loop);
  }
 loop++
  
  this.id_Animation[eventNb]=window.requestAnimationFrame(() => this.waitHTTP(loop, max_loop, eventNb));
  if (loop>max_loop || this.EventHTTPReceived[eventNb]===true ){
            console.log('exit waitHTTP ==> loop=' + loop + ' max_loop=' + max_loop + ' this.EventHTTPReceived=' + 
                    this.EventHTTPReceived[eventNb] );
            if (this.EventHTTPReceived[eventNb]===true ){
                    window.cancelAnimationFrame(this.id_Animation[eventNb]);
            }    
      }  
  }

LogMsgConsole(msg:string){
  if (this.myConsole.length>40){
    this.SaveNewRecord('logconsole','ConsoleLog.json',this.myLogConsole);
    this.message='Saving of LogConsole';
  }
  this.SaveConsoleFinished=false;

  this.myLogConsole=true;
  msginLogConsole(msg, this.myConsole,this.myLogConsole, this.SaveConsoleFinished,this.HTTP_Address, this.type);
  
  }


  SelRadio(event:any){

    const i = event.substring(2);
    this.error_msg='';
    const NoYes=event.substring(0,1);
    if (i==='1'){
      if (NoYes==='Y'){
          this.isCreateNew=true;
      } else {
          this.isCreateNew=false;
      }
    } else if (i==='2'){
        if (NoYes==='Y'){
          this.isDisplaySpecific=true;
        } else {
          this.isDisplaySpecific=false;
        }
    } else if (i==='3'){
        if (NoYes==='Y'){
          this.dialogue[this.prevDialogue]=false;
          this.isDisplayAll=true;
        } else {
          this.isDisplayAll=false;
        }
      } else if (i==='4'){
        if (NoYes==='Y'){
          this.isCopyFile=true;
          const fileName = 'COPY'+this.SpecificForm.controls['FileName'].value ;
          this.SpecificForm.controls['FileName'].setValue(fileName);
        } else {
          this.isCopyFile=false;
        }
      } else if (i==='5'){
        if (NoYes==='Y'){
          this.isMgtCaloriesFat=true;
        } else {
          this.isMgtCaloriesFat=false;
  
        }
      } else if (i==='6'){
        if (NoYes==='Y'){
          this.errCalcCalFat='';
          for (var j=0; j<this.HealthAllData.tabDailyReport.length; j++){
            this.calculateHealth(this.HealthAllData.tabDailyReport[j]);
            if (this.error_msg!==''){
              this.errCalcCalFat='errors found while caculating calories and fat';
            }
            this.HealthAllData.tabDailyReport[j].total=this.returnData.outHealthData.total;
            this.HealthAllData.tabDailyReport[j].meal=this.returnData.outHealthData.meal;
          }
          this.IsCalculateCalories=true;
          this.isAllDataModified=true;
          //this.tabNewRecordAll.splice(0,this.tabNewRecordAll.length);
          //this.initTrackRecord();
        }
        } else if (i==='8'){
          if (NoYes==='Y'){
            this.GetRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.confHTML,3);
          } 
        }  else if (i==='7'){
          if (NoYes==='Y'){
            this.isDisplayChart=true;
          } 
          else {
            this.isDisplayChart=false; //
            }
        }  else if (i==='9'){
          if (NoYes==='Y'){
              this.GetRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.confChart,4);
          }
        }
    }
  


}
