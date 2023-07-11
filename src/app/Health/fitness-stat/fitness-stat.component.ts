import { Component, OnInit , Input, Output, HostListener,  HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
import { DatePipe, formatDate } from '@angular/common'; 

import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { Observable } from 'rxjs';

import { BucketList , Bucket_List_Info} from '../../JsonServerClass';


// configServer is needed to use ManageGoogleService
// it is stored in MangoDB and accessed via ManageMangoDBService
import { configServer, XMVConfig, LoginIdentif } from '../../JsonServerClass';

import { environment } from 'src/environments/environment';
import {manage_input} from '../../manageinput';
import {eventoutput, thedateformat} from '../../apt_code_name';

import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import {AccessConfigService} from 'src/app/CloudServices/access-config.service';

import {classPosDiv, getPosDiv} from '../../getPosDiv';

import {ConfigFitness, ConfigSport, PerformanceFitness, ClassSport, ClassResult, ClassActivity, ClassExercise} from '../ClassFitness';
import {BigData, CreturnedData, CmyEvent, Ctarget} from '../ClassFitness';


export class ClassFilesAlreadyMerged{
  name:string='A';
  refFileMerge:number=1;
  startTabBigData:number=1;
  endTabBigData:number=1;
}

@Component({
  selector: 'app-fitness-stat',
  templateUrl: './fitness-stat.component.html',
  styleUrls: ['./fitness-stat.component.css'],
})

export class FitnessStatComponent implements OnInit {
  ChartFileForm:FormGroup; 
  constructor(   
    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageMangoDBService: ManageMangoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    @Inject(LOCALE_ID) private locale: string,
    //private TheConfig: AccessConfigService,
   ) { this.ChartFileForm = this.fb.group({ 
    //title: new FormControl(''),
    select_file: this.fb.array([]),
        })}

get ChartFileList(){
  return this.ChartFileForm.controls["select_file"] as FormArray; 
}

FormChart():FormGroup {

  return this.fb.group ({
          selected: new FormControl('O', { nonNullable: true })
  })
}



FillFSelected= {'selected':''};


@Input() XMVConfig=new XMVConfig;
@Input() configServer = new configServer;
@Input() identification= new LoginIdentif;

//@Input() InNewPerformanceFitness=new PerformanceFitness;
//@Input() InMergeFilesFitness:Array<PerformanceFitness>=[];
@Input() InMyConfigFitness=new ConfigFitness;

@Output() returnFile= new EventEmitter<any>();

NewPerformanceFitness=new PerformanceFitness;
MergeFilesFitness:Array<PerformanceFitness>=[];

MyConfigFitness=new ConfigFitness;

TabBigData:Array<BigData>=[];

myListOfObjects=new Bucket_List_Info;

IsTestBoolean:boolean=true;

DisplayConfig:boolean=true;
DisplayPerfFigures:boolean=true;
DisplayPerfChart:boolean=true;
DisplayShortScreen:boolean=true;


DisplayMerge:boolean=false;
NbFilesMerged:number=0;
MergeFiles:boolean=false;

TotalMergeFiles:number=0;
NbWaitHTTP:number=0;
BufferDisplay:Array<string>=[]; // initialised in onInit
maxBuffer:number=5;

FilesAlreadyMerged:Array<any>=[];
ClassFilesAlreadyMerged={
  name:'A',
  refFileMerge:1,
  startTabBigData:1,
  endTabBigData:1
}


IsSaveConfirmed:boolean=false;
SpecificForm=new FormGroup({
  FileName: new FormControl('', { nonNullable: true }),
})



NewconfigServer=new configServer;
isConfigServerRetrieved:boolean=false;
NewXMVConfig=new XMVConfig;

HTTP_Address:string='';
HTTP_AddressPOST:string='';
Google_Bucket_Access_Root:string='https://storage.googleapis.com/storage/v1/b/';
Google_Bucket_Access_RootPOST:string='https://storage.googleapis.com/upload/storage/v1/b/';

Google_Bucket_Name:string='xav_fitness'; 
Google_Object_Name:any;
Google_Object_Fitness:string='';

bucket_data:string='';

DisplayListOfObjects:boolean=false;

// used to create object name in Google Storage
//myDate:string='';
//myTime=new Date();
//thetime:string='';

Error_Access_Server:string='';
message:string='';
error_msg: string='';

EventHTTPReceived:Array<boolean>=[];
id_Animation:Array<number>=[0,0,0,0,0];
TabLoop:Array<number>=[0,0,0,0,0];
  
minDate_year:number=0;
minDate_month:number=0;
minDate_day:number=0;

maxDate_year:number=0;
maxDate_month:number=0;
maxDate_day:number=0;

today_year:number=0;

datePipeMin:any;
datePipeMax:any;
datePipeToday:any;
datePipeSelected:any;

minDate=new Date(1900,0,1); // month is always -1 as start for occurrence 0
maxDate=new Date();
todayDate=new Date();
ref_format=new thedateformat;
myObj=new eventoutput;
Input_Travel_O_R:string='';


kg_lbs:number=2.20462;
lbs_kg:number=0.453592;


prev_Dialogue:number=0;
max_dialogue:number=30;
TabPerfConfig:Array<number>=[];

selectedIndex:number=0;

getScreenWidth: any;
getScreenHeight: any;
device_type:string='';

ClassActiv = new ClassSport;
ClassBod = new ClassActivity;
ClassExec = new ClassExercise;

DisplayCalendar:boolean=true;
ObjectIsRetrieved:boolean=false;

// config fitness for this individual exists or not
ConfigExist:boolean=false;
isConfigConfirmed:boolean=false;
OpenDialogue:Array<boolean>=[];

//Draw_Line:string='-';
TabDisplayCalendar:Array<boolean>=[];
TabDisplayId:Array<number>=[];
theID:number=0;
DisplayCalendarOnly:boolean=true;
TabOfId:Array<any>=[];
inputDate:string='';
TabinputDate:Array<any>=[];
ErrorinputDate:Array<any>=[];
TabIsDateWrong:Array<boolean>=[];

selected_date=new Date();
isSelectedDate:boolean=false;
selected_year:number=0;
selected_month:number=0;
selected_day:number=0;

posList:string='';
calcPos:number=0;

TriggerChartChange:number=0;


TabAction:Array<any>=[{name:'', type:''}];
ListType:Array<string>=['Sport','Date','Activity','Exercise','Unit','Perf Type'];
theActions:Array<any>=['Delete','Add']

Error_OpenCalendar:string='close the calendar which is already open for another sport';

@HostBinding("style.--posLeftDropdown")

refMedia:number=1010;

callingComponent:string='FitnessStat';

nbToDisplay:number=0;
nbSeanceDisplay:number=0;

mainTableHeight:number=130;
subTableHeight:number=100;

largeMainTableHeight:number=480;
largeSubTableHeight:number=450;


/************* START Select position of the table ***************/
selectedPosition ={ 
  x: 0,
  y: 0} ;

  
@HostListener('window:mouseup', ['$event'])
onMouseUp(event: MouseEvent) {
  this.selectedPosition = { x: event.pageX, y: event.pageY };
  //this.getPosTitle();
  this.posDivTable=getPosDiv("posTitle");
  //console.log('evt.pageX='+evt.pageX+' evt.pageY=' + evt.pageY );
}

onMouseDown(evt: MouseEvent) {
  this.selectedPosition = { x: evt.pageX, y: evt.pageY };
}

onMouseMove(evt: MouseEvent) {
  this.selectedPosition = { x: evt.pageX, y: evt.pageY };
}


posDivTable= new classPosDiv;
/**
getPosTitle(){
  if (document.getElementById("posTitle")!==null){
      this.docDivTable = document.getElementById("posTitle");
      this.posDivTable.Left = this.docDivTable.offsetLeft;
      this.posDivTable.Top = this.docDivTable.offsetTop;
      this.posDivTable.Client.Top=Math.round(this.docDivTable.getBoundingClientRect().top);
      this.posDivTable.Client.Left=Math.round(this.docDivTable.getBoundingClientRect().left);
      this.posDivTable.Client.Bottom=Math.round(this.docDivTable.getBoundingClientRect().bottom);
      this.posDivTable.Client.Height=Math.round(this.docDivTable.getBoundingClientRect().height);
  }

}
 */


@HostListener('window:resize', ['$event'])
onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;

    if (this.getScreenWidth<this.refMedia+1){ this.nbToDisplay=2; this.nbSeanceDisplay=3;} 
    else { this.nbToDisplay=4; this.nbSeanceDisplay=5;}
    /*
    this.calcPos=Math.round(0.40 * this.getScreenWidth);
    if (this.getScreenWidth>1010){this.calcPos=446;
    } else { this.calcPos=180; }
    */
  }

fieldHeight:number=26;
newTextWidth:number=130;
newSeanWidth:number=35;
boxActionWidth:number=36;
dateWidth:number=100;
calendarWidth:number=30;

posLeftSport:number=34;
posLeftActivity:number=0;
posLeftExercise:number=0;
posLeftSeance:number=0;
posLeftResult:number=0;


posLeftDropDown:number=0;

/*

*/

ngOnInit(){
  
  this.posLeftActivity=this.boxActionWidth+this.dateWidth+this.calendarWidth+this.newTextWidth + 34;
  this.posLeftExercise=this.posLeftActivity+this.newTextWidth+this.boxActionWidth + 8;
  this.posLeftSeance=this.posLeftExercise+this.newTextWidth - 18;
  this.posLeftResult=this.posLeftExercise+this.newTextWidth+this.boxActionWidth + 200;


  this.DisplayConfig=false;
  this.TheSelectDisplays.controls['Config'].setValue('N');
  this.DisplayPerfChart=false;
  this.TheSelectDisplays.controls['PerfChart'].setValue('N');
  this.DisplayPerfFigures=false;
  this.TheSelectDisplays.controls['PerfFigures'].setValue('N');
  this.DisplayShortScreen=true;
  this.TheSelectDisplays.controls['ShortScreen'].setValue('Y');

  this.getScreenWidth = window.innerWidth;
  this.getScreenHeight = window.innerHeight;
  if (this.getScreenWidth<620){ this.nbToDisplay=2; this.nbSeanceDisplay=3;} 
  else { this.nbToDisplay=4; this.nbSeanceDisplay=5;}

  for (var i=0; i<this.maxBuffer; i++){
      this.BufferDisplay[i]='';
  }

  this.DisplayCalendarOnly=true;
  this.DisplayCalendar=false;
  this.ref_format.length_day=2;
  this.ref_format.length_month=2;
  this.ref_format.length_year=4;
  this.ref_format.MyDateFormat="dd-MM-yyyy";
  this.ref_format.separator_char="-";
  
  // input will be tested against the date format
  this.ref_format.day_position = this.ref_format.MyDateFormat.indexOf("d")+1;
  if (this.ref_format.day_position===0) {this.ref_format.day_position = this.ref_format.MyDateFormat.indexOf("D")+1};
  this.ref_format.month_position = this.ref_format.MyDateFormat.indexOf("m")+1;
  if (this.ref_format.month_position===0) {this.ref_format.month_position = this.ref_format.MyDateFormat.indexOf("M")+1};
  this.ref_format.year_position = this.ref_format.MyDateFormat.indexOf("y")+1;
  if (this.ref_format.year_position===0) {this.ref_format.year_position = this.ref_format.MyDateFormat.indexOf("Y")+1};
  
  this.ref_format.separator_one_p=this.ref_format.MyDateFormat.indexOf(this.ref_format.separator_char)+1;
  this.ref_format.separator_two_p= this.ref_format.separator_one_p+this.ref_format.MyDateFormat.substr(this.ref_format.separator_one_p,this.ref_format.MyDateFormat.length-this.ref_format.separator_one_p).indexOf(this.ref_format.separator_char)+1;
  
  this.minDate_year=parseInt(formatDate(this.minDate,'yyyy',this.locale));
  this.minDate_month=parseInt(formatDate(this.minDate,'MM',this.locale));
  this.minDate_day=parseInt(formatDate(this.minDate,'dd',this.locale));
  this.datePipeMin = this.datePipe.transform(this.minDate,"YYYY-MM-dd");
  
  this.maxDate_year=parseInt(formatDate(this.maxDate,'yyyy',this.locale));
  this.maxDate_month=parseInt(formatDate(this.maxDate,'MM',this.locale));
  this.maxDate_day=parseInt(formatDate(this.maxDate,'dd',this.locale));
  this.datePipeMax = formatDate(this.maxDate,"yyyy-MM-dd",this.locale);
  
  this.today_year=parseInt(formatDate(Date.now(),'YYYY',this.locale));
  //this.today_month=parseInt(formatDate(Date.now(),'MM',this.locale));
  //this.today_day=parseInt(formatDate(Date.now(),'dd',this.locale));
  this.datePipeToday = this.datePipe.transform(this.todayDate,"yyyy-MM-dd");
  this.datePipeSelected = this.datePipe.transform(this.todayDate,"dd-MM-yyyy");

  this.NewPerformanceFitness.firstname=this.identification.firstname;
  this.NewPerformanceFitness.lastname=this.identification.surname;
  this.NewPerformanceFitness.user_id=this.identification.id;
  this.NewPerformanceFitness.Sport[0].Sport_name='';
  this.NewPerformanceFitness.Sport[0].Sport_date=this.datePipeSelected;
  this.NewPerformanceFitness.Sport[0].exercise[0].Activity_name='';
  this.NewPerformanceFitness.Sport[0].exercise[0].ActivityExercise[0].Exercise_name='';
  this.NewPerformanceFitness.Sport[0].exercise[0].ActivityExercise[0].Exercise_unit='';
  this.NewPerformanceFitness.Sport[0].exercise[0].ActivityExercise[0].seance[0].nb=0;
  this.NewPerformanceFitness.Sport[0].exercise[0].ActivityExercise[0].Result[0].perf_type='';
  this.NewPerformanceFitness.Sport[0].exercise[0].ActivityExercise[0].Result[0].perf='';
  this.NewPerformanceFitness.Sport[0].exercise[0].ActivityExercise[0].Result[0].unit='';

  this.TabinputDate[0]=this.datePipeSelected;
  this.ErrorinputDate[0]='';
  this.TabIsDateWrong[0]=true;
  this.initOpenDialogue();

  if (this.configServer.GoogleProjectId===undefined || this.configServer.GoogleProjectId===''){
    this.RetrieveConfig();
  } else{ 
    if (this.identification.fitness.bucket!== undefined && this.identification.fitness.bucket!==''){
      this.Google_Bucket_Name=this.identification.fitness.bucket;
    
      this.GetAllObjects();
      this.isConfigServerRetrieved=true;
    
      this.Google_Object_Fitness=this.identification.fitness.files.fileFitnessMyConfig;
      if (this.InMyConfigFitness.fileType!==''){
        this.MyConfigFitness=this.InMyConfigFitness;
        this.EventHTTPReceived[0]=true;
      } else {
        this.GetRecord('config',0,1);
      }
      
    } else {this.error_msg='identification record is missing fitness bucket reference ';}
  }
  
  this.scroller.scrollToAnchor('targetTop');
  }

  TheSelectDisplays: FormGroup = new FormGroup({ 
      PerfFigures: new FormControl('N', { nonNullable: true }),
      PerfChart: new FormControl('N', { nonNullable: true }),
      Config: new FormControl('N', { nonNullable: true }),
      ShortScreen: new FormControl('N', { nonNullable: true })
  })

newTabDialog:Array<boolean>=[];
newPrevDialog:number=0;
onAction(event:any){
  this.newTabDialog[this.newPrevDialog]=false;
  this.TabAction.splice(0,this.TabAction.length);
  this.findIds(event.target.id);
  this.TabAction.push({name:'',type:''});
    this.TabAction[this.TabAction.length-1].name='Cancel';
    this.TabAction[this.TabAction.length-1].type='';
  if (this.idText==='Sport'){
    this.TabAction.push({name:'',type:''});
    this.TabAction[this.TabAction.length-1].name='Delete';
    this.TabAction[this.TabAction.length-1].type='sport';
    this.TabAction.push({name:'',type:''});
    this.TabAction[this.TabAction.length-1].name='Add after';
    this.TabAction[this.TabAction.length-1].type='sport ';
    this.TabAction.push({name:'',type:''});
    this.TabAction[this.TabAction.length-1].name='Add before';
    this.TabAction[this.TabAction.length-1].type='sport';
    this.TabAction.push({name:'',type:''});
    this.TabAction[this.TabAction.length-1].name='Copy';
    this.TabAction[this.TabAction.length-1].type='sport (atfer)';
    this.newPrevDialog=0;
    this.posLeftDropDown=this.posLeftSport;
  } else if (this.idText==='Activity'){
    this.TabAction.push({name:'',type:''});
    this.TabAction[this.TabAction.length-1].name='Delete';
    this.TabAction[this.TabAction.length-1].type='activity';
    this.TabAction.push({name:'',type:''});
    this.TabAction[this.TabAction.length-1].name='Add before';
    this.TabAction[this.TabAction.length-1].type='activity';
    this.TabAction.push({name:'',type:''});
    this.TabAction[this.TabAction.length-1].name='Add after';
    this.TabAction[this.TabAction.length-1].type='activity';
    this.newPrevDialog=1;
    this.posLeftDropDown=this.posLeftActivity;
  } else if (this.idText==='Exercise'){
    this.TabAction.push({name:'',type:''});
    this.TabAction[this.TabAction.length-1].name='Delete';
    this.TabAction[this.TabAction.length-1].type='exercise';
    this.TabAction.push({name:'',type:''});
    this.TabAction[this.TabAction.length-1].name='Add before';
    this.TabAction[this.TabAction.length-1].type='exercise';
    this.TabAction.push({name:'',type:''});
    this.TabAction[this.TabAction.length-1].name='Add after';
    this.TabAction[this.TabAction.length-1].type='exercise';
    this.newPrevDialog=2;
    this.posLeftDropDown=this.posLeftExercise;
  } else if (this.idText==='Seance'){
    this.TabAction.push({name:'',type:''});
    this.TabAction[this.TabAction.length-1].name='Delete';
    this.TabAction[this.TabAction.length-1].type='last seance';
    this.TabAction.push({name:'',type:''});
    this.TabAction[this.TabAction.length-1].name='Add ';
    this.TabAction[this.TabAction.length-1].type='seance';
    this.newPrevDialog=3;
    this.posLeftDropDown=this.posLeftSeance;
  } else if (this.idText==='Result'){
    this.TabAction.push({name:'',type:''});
    this.TabAction[this.TabAction.length-1].name='Delete';
    this.TabAction[this.TabAction.length-1].type='last result';
    this.TabAction.push({name:'',type:''});
    this.TabAction[this.TabAction.length-1].name='Add before';
    this.TabAction[this.TabAction.length-1].type='result';
    this.TabAction.push({name:'',type:''});
    this.TabAction[this.TabAction.length-1].name='Add after';
    this.TabAction[this.TabAction.length-1].type='result';
    this.newPrevDialog=4;
    if (this.TabOfId[3] % 2 ===0 ){
      this.posLeftDropDown=this.posLeftSeance;
    } else {
      this.posLeftDropDown=this.posLeftResult;
    }
    
  }
  this.newTabDialog[this.newPrevDialog]=true;
  this.theHeight=this.TabAction.length*26;
}

afterDropDown(event:any){
var myConst:number=0;
if (event.target.value===0){ //cancel 
  // nothing to do
} else if (this.newPrevDialog===0 && this.newTabDialog[this.newPrevDialog]===true){ // Sport

  const theLength = this.NewPerformanceFitness.Sport.length - 1;

  if (event.target.value===1){
      if (theLength > 0) {  // delete the Sport item
        this.NewPerformanceFitness.Sport.splice(this.TabOfId[0],1); 
      } else { 
        // should display an error message that item cannot be 
      }
  }  else if (event.target.value===2 || event.target.value===3){
    // create after
    if (event.target.value===3){
      myConst=this.TabOfId[0];
     } else {
      myConst=this.TabOfId[0]+1;
     }
    const theClassSport = new ClassSport;
    this.NewPerformanceFitness.Sport.splice(myConst,0,theClassSport);
    this.NewPerformanceFitness.Sport[myConst].Sport_name='';
    this.datePipeSelected = this.datePipe.transform(this.todayDate,"dd-MM-yyyy");
    this.NewPerformanceFitness.Sport[myConst].Sport_date=this.datePipeSelected;
    this.TabinputDate[myConst]=this.datePipeSelected;
    this.TabIsDateWrong[myConst]=false;
    this.NewPerformanceFitness.Sport[myConst].exercise[0].Activity_name='';
    this.NewPerformanceFitness.Sport[myConst].exercise[0].ActivityExercise[0].Exercise_name='';
    this.NewPerformanceFitness.Sport[myConst].exercise[0].ActivityExercise[0].seance[0].nb=0;
  } else if (event.target.value===4 ) {
    // create a copy
    const theNewSport= new ClassSport;
    myConst=this.TabOfId[0];
    this.NewPerformanceFitness.Sport.splice(myConst+1,0,theNewSport);
    this.NewPerformanceFitness.Sport[myConst+1].Sport_name=this.NewPerformanceFitness.Sport[myConst].Sport_name;
    this.datePipeSelected = this.datePipe.transform(this.todayDate,"dd-MM-yyyy");
    this.NewPerformanceFitness.Sport[myConst+1].Sport_date=this.datePipeSelected;
    this.TabinputDate[myConst+1]=this.datePipeSelected;
    this.TabIsDateWrong[myConst+1]=false;
    for (var i=0; i<this.NewPerformanceFitness.Sport[myConst].exercise.length; i++){
      
      if (i>0){
        const theClassActivity = new ClassActivity;
        this.NewPerformanceFitness.Sport[myConst+1].exercise.push(theClassActivity); 
      }
      this.NewPerformanceFitness.Sport[myConst+1].exercise[i].Activity_name=this.NewPerformanceFitness.Sport[myConst].exercise[i].Activity_name;
      for (var j=0; j<this.NewPerformanceFitness.Sport[myConst].exercise[i].ActivityExercise.length; j++){
            if (j>0){
              const theClassExec = new ClassExercise;
              this.NewPerformanceFitness.Sport[myConst+1].exercise[i].ActivityExercise.push(theClassExec);
            }
            this.NewPerformanceFitness.Sport[myConst+1].exercise[i].ActivityExercise[j].Exercise_name = 
                          this.NewPerformanceFitness.Sport[myConst].exercise[i].ActivityExercise[j].Exercise_name;
              this.NewPerformanceFitness.Sport[myConst+1].exercise[i].ActivityExercise[j].Exercise_unit = 
                          this.NewPerformanceFitness.Sport[myConst].exercise[i].ActivityExercise[j].Exercise_unit;
              for (var k=0; k<this.NewPerformanceFitness.Sport[myConst].exercise[i].ActivityExercise[j].seance.length; k++){
                if (k>0){
                  this.NewPerformanceFitness.Sport[myConst+1].exercise[i].ActivityExercise[j].seance.push({nb:0});
                }
                this.NewPerformanceFitness.Sport[myConst+1].exercise[i].ActivityExercise[j].seance[k].nb=
                          this.NewPerformanceFitness.Sport[myConst].exercise[i].ActivityExercise[j].seance[k].nb;

              }
              for (var k=0; k<this.NewPerformanceFitness.Sport[myConst].exercise[i].ActivityExercise[j].Result.length; k++){
                if (k>0){
                  const cResult = new ClassResult;
                  this.NewPerformanceFitness.Sport[myConst+1].exercise[i].ActivityExercise[j].Result.push(cResult);
                }
                this.NewPerformanceFitness.Sport[myConst+1].exercise[i].ActivityExercise[j].Result[k].perf_type=
                          this.NewPerformanceFitness.Sport[myConst].exercise[i].ActivityExercise[j].Result[k].perf_type;
                this.NewPerformanceFitness.Sport[myConst+1].exercise[i].ActivityExercise[j].Result[k].perf=
                          this.NewPerformanceFitness.Sport[myConst].exercise[i].ActivityExercise[j].Result[k].perf;
                this.NewPerformanceFitness.Sport[myConst+1].exercise[i].ActivityExercise[j].Result[k].unit =
                          this.NewPerformanceFitness.Sport[myConst].exercise[i].ActivityExercise[j].Result[k].unit;

              }
      }

    }
    this.LinkPerfConfig();

  }

} else if (this.newPrevDialog===1 && this.newTabDialog[this.newPrevDialog]===true){
  const theLength = this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise.length - 1;

    if (event.target.value===1){
      if (theLength > 0) {  // delete the Activity item
        this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise.splice(this.TabOfId[1],1); 
      } else { 
        // should display an error message that item cannot be deleted
      }
    } else if (event.target.value===2 || event.target.value===3){
      if (event.target.value===2){
        myConst=this.TabOfId[1];
      } else {
        myConst=this.TabOfId[1]+1;
      }
      const theClassActivity = new ClassActivity;
      this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise.splice(myConst,0,theClassActivity); 
      this.mainTableHeight=this.largeMainTableHeight;
      this.subTableHeight=this.largeSubTableHeight;
    }

} else if (this.newPrevDialog===2 && this.newTabDialog[this.newPrevDialog]===true){
  const theLength = this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise.length - 1;


    if (event.target.value===1){
        if (theLength > 0) {  // delete the Activity item
          this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise.splice(this.TabOfId[2],1); 
        } else { 
          // should display an error message that item cannot be deleted
        }
    } else if (event.target.value===2 || event.target.value===3){
          if (event.target.value===2){
            myConst=this.TabOfId[2];
          } else {
            myConst=this.TabOfId[2]+1;
          }
          const theClassExec = new ClassExercise;
          this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise.splice(myConst,0,theClassExec); 
          this.mainTableHeight=this.largeMainTableHeight;
          this.subTableHeight=this.largeSubTableHeight;
      } 

} else if (this.newPrevDialog===3 && this.newTabDialog[this.newPrevDialog]===true){
  const theLength = this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].seance.length - 1;
  if (event.target.value===1){
    // delete last seance item if more than one exists 
      if (theLength > 0){
        this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].seance.splice(theLength,1);
      } else {
        this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].seance[theLength].nb=0;
      }
      
    } else if (event.target.value===2){
      this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].seance.splice(theLength+1,0,{nb:0});
    }

} else if (this.newPrevDialog===4 && this.newTabDialog[this.newPrevDialog]===true){
  const theLength = this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].Result.length - 1;

  if (event.target.value===1){
     // delete last result item if more than one exists 
     if (theLength > 0){
      this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].Result.splice(theLength,1);
    } else {
      this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].Result[theLength].perf_type='';
      this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].Result[theLength].unit='';
      this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].Result[theLength].perf=0;
    }
  } 
  else if (event.target.value===2 || event.target.value===3){
    // create Result at the end of the tab
    if (event.target.value===2){
      myConst=this.TabOfId[3];
    } else {
      myConst=this.TabOfId[3]+1;
    }

    const cResult = new ClassResult;
    this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].Result.splice(myConst,0,cResult);
  }

}

this.newTabDialog[this.newPrevDialog]=false;
}
theHeight:number=160;
SelectDisplay(){
    if (this.TheSelectDisplays.controls['PerfFigures'].value==='Y'){
          this.DisplayPerfFigures=true;
      } else {
        this.DisplayPerfFigures=false;
      }
      if (this.TheSelectDisplays.controls['PerfChart'].value==='Y'){
        this.DisplayPerfChart=true;
      } else {
        this.DisplayPerfChart=false;
      }
      
      if (this.TheSelectDisplays.controls['Config'].value==='Y'){
        this.DisplayConfig=true;
      } else {
        this.DisplayConfig=false;
      }
}

fillFiles(inFile:PerformanceFitness, outFile:PerformanceFitness){
// const classOut=new PerformanceFitness;
outFile.user_id=inFile.user_id;
outFile.firstname=inFile.firstname;
outFile.lastname=inFile.lastname;
for (var i=0; i<inFile.Sport.length; i++){
  if (outFile.Sport.length===i){
    const classSport = new ClassSport;
    outFile.Sport.push(classSport);
  }
  outFile.Sport[i].Sport_name=inFile.Sport[i].Sport_name;
  outFile.Sport[i].Sport_date=inFile.Sport[i].Sport_date;
  for (var j=0; j<inFile.Sport[i]. exercise.length; j++){
      if (outFile.Sport[i].exercise.length===j){
        const classBod= new ClassActivity;
        outFile.Sport[i].exercise.push(classBod);
      }
      outFile.Sport[i]. exercise[j].Activity_name=inFile.Sport[i].exercise[j].Activity_name;
      for (var k=0; k<inFile.Sport[i]. exercise[j].ActivityExercise.length; k++){
        if (outFile.Sport[i].exercise[j].ActivityExercise.length==k){
          const classExec= new ClassExercise;
          outFile.Sport[i].exercise[j].ActivityExercise.push(classExec);
        }
        outFile.Sport[i]. exercise[j].ActivityExercise[k].Exercise_name=inFile.Sport[i].exercise[j].ActivityExercise[k].Exercise_name;
        outFile.Sport[i]. exercise[j].ActivityExercise[k].Exercise_unit=inFile.Sport[i].exercise[j].ActivityExercise[k].Exercise_unit;
        for (var l=0; l<inFile.Sport[i].exercise[j].ActivityExercise[k].seance.length; l++){
          if (outFile.Sport[i].exercise[j].ActivityExercise[k].seance.length===l){
            outFile.Sport[i].exercise[j].ActivityExercise[k].seance.push({nb:0});
          }
          outFile.Sport[i].exercise[j].ActivityExercise[k].seance[l]=inFile.Sport[i]. exercise[j].ActivityExercise[k].seance[l];
        }
        for (var l=0; l<inFile.Sport[i]. exercise[j].ActivityExercise[k].Result.length; l++){
          if (outFile.Sport[i].exercise[j].ActivityExercise[k].Result.length===l){
            const cResult = new ClassResult;
            outFile.Sport[i].exercise[j].ActivityExercise[k].Result.push(cResult);
          }
          outFile.Sport[i].exercise[j].ActivityExercise[k].Result[l]=inFile.Sport[i].exercise[j].ActivityExercise[k].Result[l];
        }
      }
    }
  }

}



SelRadio(event:any){
  const i = event.substring(2);
  const NoYes=event.substring(0,1);
  if (i==='1'){
    if (NoYes==='Y'){
        this.DisplayPerfFigures=true;
    } else {
        this.DisplayPerfFigures=false;
    }
  } else if (i==='2'){
      if (NoYes==='Y'){
        this.DisplayPerfChart=true;
      } else {
        this.DisplayPerfChart=false;
      }
  } else if (i==='3'){
      if (NoYes==='Y'){
        this.DisplayConfig=true;
      } else {
        this.DisplayConfig=false;
      }
    } else if (i==='4'){
      if (NoYes==='Y'){
        this.DisplayShortScreen=true;
      } else {
        this.DisplayShortScreen=false;
      }
    }
}

SelectAll(){
  var i=0;
  for (i=0; i<this.ChartFileList.length; i++){
    this.FillFSelected.selected='Y';
    this.ChartFileList.controls[i].setValue(this.FillFSelected);
  }
  this.ChartFileSelection();
}

CancelAll(){
  var i=0;
  for (i=0; i<this.ChartFileList.length; i++){
    this.FillFSelected.selected='N';
    this.ChartFileList.controls[i].setValue(this.FillFSelected);
  }
  this.TabBigData.splice(0,this.TabBigData.length);
  this.DisplayMerge=false;
  this.TriggerChartChange++;

  this.newTabDialog[this.newPrevDialog]=false;
  this.OpenDialogue[this.prev_Dialogue]=false;
}

RadioSelection(event:any){
    const i=parseInt(event.target.id.substring(2));
    const val=event.target.id.substring(0,1);
    this.FillFSelected.selected=val;
    this.ChartFileList.controls[i].setValue(this.FillFSelected);
}



ChartFileSelection(){
  // Files have been selected by the end user
  // time to consolidate all of them
  var i=0;
  var j=1;
  var k=0;
  var fileFound=false;
  this.DisplayMerge=false;
  this.NbFilesMerged=0;
  //this.MergeFilesFitness.splice(0,this.MergeFilesFitness.length);
  this.TabBigData.splice(0,this.TabBigData.length);
  this.TotalMergeFiles=0;
  this.TriggerChartChange++;
  this.MergeFiles=true;
 
  for (i=0; i<this.ChartFileList.length; i++){
         // if field is set to true then file is to be retrieved
      if (this.ChartFileList.controls[i].value.selected==='Y'){
          this.TotalMergeFiles++;
          this.Google_Object_Name=this.myListOfObjects.items[i].name;
          fileFound=false;
          for (k=0; k<this.FilesAlreadyMerged.length && fileFound===false; k++){
              if (this.FilesAlreadyMerged[k].name===this.myListOfObjects.items[i].name){
                fileFound=true;
              }
          }
          if (fileFound===false){
            const myClass=new ClassFilesAlreadyMerged;
            this.FilesAlreadyMerged.push(myClass);
            this.FilesAlreadyMerged[this.FilesAlreadyMerged.length-1].name=this.myListOfObjects.items[i].name;
            this.FilesAlreadyMerged[this.FilesAlreadyMerged.length-1].refFileMerge=-1;
            this.FilesAlreadyMerged[this.FilesAlreadyMerged.length-1].startTabBigData=0;
            this.FilesAlreadyMerged[this.FilesAlreadyMerged.length-1].endTabBigData=0;
            j++
            this.GetRecord('data',j,this.FilesAlreadyMerged.length-1);
          } else {
            this.fillFiles(this.MergeFilesFitness[this.FilesAlreadyMerged[k-1].refFileMerge], this.NewPerformanceFitness);
            // this.NewPerformanceFitness=this.MergeFilesFitness[this.FilesAlreadyMerged[k-1].refFileMerge];
            console.log('ChartFileSelection() ===> File ' + this.myListOfObjects.items[i].name + " was already retrieved");
            this.MergeAllFiles(k-1);
            this.mainTableHeight=this.largeMainTableHeight;
            this.subTableHeight=this.largeSubTableHeight;
          }
        }
    }
   
}




UpdateMergeFiles(fileName:string){
  // find the file
  var i=0;
  var j=0;

  for (i=0; i<this.FilesAlreadyMerged.length && this.FilesAlreadyMerged[i].name!==fileName; i++){
  }
  if (i===this.FilesAlreadyMerged.length){
    console.log('File ' + fileName + 'not found in this.FilesAlreadyMerged')
  } else {
    // update MergeFilesFitness  
    this.fillFiles(this.NewPerformanceFitness, this.MergeFilesFitness[ this.FilesAlreadyMerged[i].refFileMerge]);
    //this.MergeFilesFitness[ this.FilesAlreadyMerged[i].refFileMerge]=this.NewPerformanceFitness;
    this.TabBigData.splice(this.FilesAlreadyMerged[i].startTabBigData,this.FilesAlreadyMerged[i].endTabBigData-this.FilesAlreadyMerged[i].startTabBigData+1);
    this.TriggerChartChange++
    this.MergeAllFiles(i);
  }


}

theDatePipe:any;
MergeAllFiles(fileNb:number){
  var i=0;
  var j=0;
  var k=0;
  var l=0;
  var m=0;
  var dateYear:number=0;
  var dateMonth:number=0;
  var dateDay:number=0;
  var theDate=new Date();

  this.NbFilesMerged++;
  const PerfFit=new PerformanceFitness;
  if (this.FilesAlreadyMerged[fileNb].refFileMerge===-1){
    this.MergeFilesFitness.push(PerfFit);
    this.fillFiles(this.NewPerformanceFitness, this.MergeFilesFitness[this.MergeFilesFitness.length-1])
    // this.MergeFilesFitness[this.MergeFilesFitness.length-1]=this.NewPerformanceFitness;
    this.FilesAlreadyMerged[fileNb].refFileMerge=this.MergeFilesFitness.length-1;
  }
  this.FilesAlreadyMerged[fileNb].startTabBigData=this.TabBigData.length;

  for (i=0; i<this.NewPerformanceFitness.Sport.length; i++){
    for (j=0; j<this.NewPerformanceFitness.Sport[i].exercise.length; j++){
      for (k=0; k<this.NewPerformanceFitness.Sport[i].exercise[j].ActivityExercise.length; k++){
        for (m=0; m<this.NewPerformanceFitness.Sport[i].exercise[j].ActivityExercise[k].Result.length; m++){
            var formatData=new BigData;
            this.TabBigData.push(formatData);
            this.TabBigData[this.TabBigData.length-1].id=this.TabBigData.length-1;

            var timestamp = Date.parse(this.NewPerformanceFitness.Sport[i].Sport_date);
            if (isNaN(timestamp)) {
                console.log("Date is string format = "+this.NewPerformanceFitness.Sport[i].Sport_date);
                dateYear=this.NewPerformanceFitness.Sport[i].Sport_date.substring(6);
                dateMonth=this.NewPerformanceFitness.Sport[i].Sport_date.substring(3,5);
                dateDay=this.NewPerformanceFitness.Sport[i].Sport_date.substring(0,2);
            } else {
                dateYear=parseInt(formatDate(this.NewPerformanceFitness.Sport[i].Sport_date,'yyyy',this.locale));
                dateMonth=parseInt(formatDate(this.NewPerformanceFitness.Sport[i].Sport_date,'MM',this.locale));
                dateDay=parseInt(formatDate(this.NewPerformanceFitness.Sport[i].Sport_date,'dd',this.locale));
            }
              theDate.setDate(dateDay);
              theDate.setMonth(dateMonth);
              theDate.setFullYear(dateYear);
              this.theDatePipe = formatDate(theDate,"yyyy-MM-dd",this.locale);
              this.TabBigData[this.TabBigData.length-1].thedate=this.theDatePipe;

            this.TabBigData[this.TabBigData.length-1].sport=this.NewPerformanceFitness.Sport[i].Sport_name;
            this.TabBigData[this.TabBigData.length-1].activity=this.NewPerformanceFitness.Sport[i].exercise[j].Activity_name;
            if (m===0){
              this.TabBigData[this.TabBigData.length-1].exercise=this.NewPerformanceFitness.Sport[i].exercise[j].ActivityExercise[k].Exercise_name;
              this.TabBigData[this.TabBigData.length-1].unit=this.NewPerformanceFitness.Sport[i].exercise[j].ActivityExercise[k].Exercise_unit;
              this.TabBigData[this.TabBigData.length-1].seance=this.NewPerformanceFitness.Sport[i].exercise[j].ActivityExercise[k].seance;
            }
          
            if (this.NewPerformanceFitness.Sport[i].exercise[j].ActivityExercise[k].Result.length>0 && 
                  this.NewPerformanceFitness.Sport[i].exercise[j].ActivityExercise[k].Result[m].perf_type!==undefined ){
                      this.TabBigData[this.TabBigData.length-1].result.perf_type=this.NewPerformanceFitness.Sport[i].exercise[j].ActivityExercise[k].Result[m].perf_type;
                      this.TabBigData[this.TabBigData.length-1].result.perf=this.NewPerformanceFitness.Sport[i].exercise[j].ActivityExercise[k].Result[m].perf;
                      this.TabBigData[this.TabBigData.length-1].result.unit=this.NewPerformanceFitness.Sport[i].exercise[j].ActivityExercise[k].Result[m].unit;
            }
        }
      }

    }
    
  }

    this.FilesAlreadyMerged[fileNb].endTabBigData=this.TabBigData.length-1;

  if (this.NbFilesMerged===this.TotalMergeFiles){
    // process to merge is over
    // display the chart
    this.DisplayMerge=true;

  }

}


LinkPerfConfig(){
  var i=0;
  var j=0;
 
  this.TabPerfConfig.splice(0,this.TabPerfConfig.length);
  
  for (i=0; i<this.NewPerformanceFitness.Sport.length; i++){
      for (j=0; (j<this.MyConfigFitness.ListSport.length && this.NewPerformanceFitness.Sport[i].Sport_name !== this.MyConfigFitness.ListSport[j].sportName); j++){
      }
      if (j<this.MyConfigFitness.ListSport.length && this.NewPerformanceFitness.Sport[i].Sport_name === this.MyConfigFitness.ListSport[j].sportName){
        this.TabPerfConfig[i]=j;
        
      }
  }
}

initOpenDialogue(){
  var i=0;
  for (i=0; i<this.max_dialogue; i++){
    this.OpenDialogue[i]=false;
  }
}


myEvent=new CmyEvent;

returnedData=new CreturnedData;

DropDownData(event:any){
  this.OpenDialogue[this.prev_Dialogue]=false;
  this.returnedData=event;
  if (this.returnedData.valueString!=='Cancel'){
      this.myEvent.target.id=this.returnedData.idString;
      this.myEvent.target.value=this.returnedData.valueString;
      this.myEvent.target.textContent=this.returnedData.valueString;
      if (this.returnedData.fieldNb===3 || this.returnedData.fieldNb===4){
          this.onInputPerf(this.myEvent);
      } else{
          this.onInput(this.myEvent);
      }
  } // otherwise don't do anything as no data was selected
}
theArrow(event:any){
  this.OpenDialogue[this.prev_Dialogue]=false;
  this.findIds(event.target.id);
  if (  event.target.id.substring(0,5)==='Sport'){
    this.myEvent.idString='lSpo-'+this.TabOfId[0];
    this.prev_Dialogue=0;
  } else if (  event.target.id.substring(0,8)==='Activity'){
    this.myEvent.idString='lAct-'+this.TabOfId[0]+'-'+this.TabOfId[1];
    this.prev_Dialogue=1;
  } else if (  event.target.id.substring(0,12)==='ExerciseUnit'){
    this.myEvent.idString='lExeUnit-'+this.TabOfId[0]+'-'+this.TabOfId[1]+'-'+this.TabOfId[2];
    this.prev_Dialogue=2;
  } else if (  event.target.id.substring(0,8)==='PerfType'){
    this.myEvent.idString='ltPerf-'+this.TabOfId[0]+'-'+this.TabOfId[1]+'-'+this.TabOfId[2]+'-'+this.TabOfId[3];
    this.prev_Dialogue=3;
  } else if (  event.target.id.substring(0,8)==='PerfUnit'){
    this.myEvent.idString='luPerf-'+this.TabOfId[0]+'-'+this.TabOfId[1]+'-'+this.TabOfId[2]+'-'+this.TabOfId[3];
    this.prev_Dialogue=4;
  } else if (  event.target.id.substring(0,12)==='ExerciseName'){
    this.myEvent.idString='lExeName-'+this.TabOfId[0]+'-'+this.TabOfId[1]+'-'+this.TabOfId[2];
    this.prev_Dialogue=5;
  } 
  this.OpenDialogue[this.prev_Dialogue]=true;
  this.myEvent.dialogueNb=this.prev_Dialogue;
}


onArrow(event:any){
  this.OpenDialogue[this.prev_Dialogue]=false;
  this.findIds(event.target.id);
  if (  event.target.id.substring(0,6)==='lSport'){
    this.prev_Dialogue=6;
  } else if (  event.target.id.substring(0,9)==='lActivity'){
    this.prev_Dialogue=7;
  } else if (  event.target.id.substring(0,5)==='lUnit'){
    this.prev_Dialogue=8;
  } else if (  event.target.id.substring(0,9)==='lPerfType'){
    this.prev_Dialogue=9;
  } else if (  event.target.id.substring(0,9)==='lPerfUnit'){
    this.prev_Dialogue=10;
  } else if (  event.target.id.substring(0,9)==='lExercise'){
    this.prev_Dialogue=11;
  } 
  this.OpenDialogue[this.prev_Dialogue]=true;
}

cancelDropDown(){
  this.OpenDialogue[this.prev_Dialogue]=false;
}

onInput(event:any){
  // This is only used for NewPerformanceFitness
    
    this.OpenDialogue[this.prev_Dialogue]=false;
    this.findIds(event.target.id);
    //event.target.value;
    if (  event.target.id.substring(0,4)==='Spor'){
      this.NewPerformanceFitness.Sport[this.TabOfId[0]].Sport_name=event.target.value;
      this.LinkPerfConfig();
    } else if (event.target.id.substring(0,4)==='lSpo'){
      this.NewPerformanceFitness.Sport[this.TabOfId[0]].Sport_name=event.target.textContent;
      this.LinkPerfConfig();
    } else  if (event.target.id.substring(0,4)==='Acti'){
      this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].Activity_name=event.target.value;
    } else  if (event.target.id.substring(0,4)==='lAct'){
      this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].Activity_name=event.target.textContent;
    
      // value of the exercise
    } else if (event.target.id.substring(0,4)==='nExe'){
      this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].Exercise_name=event.target.value;
    
      // unit of the value of the exercise
    }  else  if (event.target.id.substring(0,4)==='uExe'){
        this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].Exercise_unit=event.target.value;
    
      // unit of the value of the exercise from the list
    } else if (event.target.id.substring(0,8)==='lExeName'){
      this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].Exercise_name=event.target.textContent;
      
      // unit of the value of the exercise from the list
    } else if (event.target.id.substring(0,8)==='lExeUnit'){
      this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].Exercise_unit=event.target.textContent;
      
      // number of sessions (seances)
    } else  if (event.target.id.substring(0,4)==='Sean'){
      this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].seance[this.TabOfId[3]].nb=event.target.value;
    }
}

  onInputPerf(event:any){
     // This is only used for NewPerformanceFitness
    
     this.OpenDialogue[this.prev_Dialogue]=false;
     this.findIds(event.target.id);
      // for sports such as runnning/cycling, result of the performance with type of perf (e.g. avd speed), the value of the perforamnce and the unit of that value (e.g. km/h) 
    if (event.target.id.substring(0,5)==='tPerf'){
      this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].Result[this.TabOfId[3]].perf_type=event.target.value;
      // type of perf obtained from the list
    }  else  if (event.target.id.substring(0,6)==='ltPerf'){
      this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].Result[this.TabOfId[3]].perf_type=event.target.textContent;

      //the value of the perforamnce  
    } else  if (event.target.id.substring(0,5)==='vPerf'){
      this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].Result[this.TabOfId[3]].perf=event.target.value;
     
      //  unit of that value (e.g. km/h)
    }  else  if (event.target.id.substring(0,5)==='uPerf'){
      this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].Result[this.TabOfId[3]].unit=event.target.value;
      //  unit of that value (e.g. km/h) from the list
    }  else  if (event.target.id.substring(0,6)==='luPerf'){
      this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].Result[this.TabOfId[3]].unit=event.target.textContent;
    } 

  }

onInputList(event:any){
  // This is only used for myConfigFitness
  
  this.OpenDialogue[this.prev_Dialogue]=false;
  this.findIds(event.target.id);
  // configuration
  if (event.target.id.substring(0,4)==='cSpo'){ // input sport (e.g. running)
    this.MyConfigFitness.ListSport[this.TabOfId[0]].sportName=event.target.value;
  } else if (event.target.id.substring(0,4)==='cAct'){ // input activity (e.g intervals)
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityName[this.TabOfId[1]]=event.target.value;
  } else if (event.target.id.substring(0,4)==='cExe'){ // input activity (e.g intervals)
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityExercise[this.TabOfId[1]]=event.target.value;
  } else if (event.target.id.substring(0,4)==='cUni'){ // input unit (e.g. kg, km/h)
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityUnit[this.TabOfId[1]]=event.target.value;
  } else if (event.target.id.substring(0,8)==='cPerType'){ // input type of performance (e.g avg speed)
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityPerf[this.TabOfId[1]]=event.target.value;
  } else if (event.target.id.substring(0,8)==='cPerUnit'){ // input unit of type of performance (e.g km/h)
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityPerfUnit[this.TabOfId[1]]=event.target.value;
  }
}

onInputTab(event:any){
    // This is only used for myConfigFitness
   
    this.OpenDialogue[this.prev_Dialogue]=false;
    this.findIds(event.target.id);
    // ==== management of the tables
    // data coming from user input
  if (event.target.id.substring(0,7)==='inSport'){
    this.MyConfigFitness.TabSport[this.TabOfId[0]].name=event.target.value;
  } else if (event.target.id.substring(0,5)==='inAct'){
    this.MyConfigFitness.TabActivity[this.TabOfId[0]].name=event.target.value;
  } else if (event.target.id.substring(0,5)==='inExe'){
    this.MyConfigFitness.TabExercise[this.TabOfId[0]].name=event.target.value;
  }else if (event.target.id.substring(0,10)==='inUnitPerf'){
    this.MyConfigFitness.TabPerfUnit[this.TabOfId[0]].name=event.target.value;
  } else if (event.target.id.substring(0,6)==='inUnit'){
    this.MyConfigFitness.TabUnits[this.TabOfId[0]].name=event.target.value;
  } else if (event.target.id.substring(0,6)==='inPerf'){
    this.MyConfigFitness.TabPerfType[this.TabOfId[0]].name=event.target.value;
  } 
}

onClickList(event:any){
 
  this.OpenDialogue[this.prev_Dialogue]=false;
  this.findIds(event.target.id);
    // ==== management of the tables
    // data coming from dropdown list
  if (event.target.id.substring(0,6)==='lSport'){ 
    this.MyConfigFitness.ListSport[this.TabOfId[0]].sportName=event.target.textContent;
  } else if (event.target.id.substring(0,9)==='lActivity'){
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityName[this.TabOfId[1]]=event.target.textContent;
  }  else if (event.target.id.substring(0,9)==='lExercise'){
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityExercise[this.TabOfId[1]]=event.target.textContent;
  } else if (event.target.id.substring(0,9)==='lPerfType'){
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityPerf[this.TabOfId[1]]=event.target.textContent;
  } else if (event.target.id.substring(0,9)==='lUnitPerf'){
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityPerfUnit[this.TabOfId[1]]=event.target.textContent;
  } else if (event.target.id.substring(0,5)==='lUnit'){
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityUnit[this.TabOfId[1]]=event.target.textContent;
  }
}

// date entered manually
CheckDate(event:any){
  this.OpenDialogue[this.prev_Dialogue]=false;
  const id =parseInt(event.target.id.substring(5)); 

  this.inputDate = event.target.value;
  const work_string=event.inputType ;

  const FormatValidationOnly=false;

  this.myObj=manage_input(
    this.inputDate,
    work_string,
    this.ref_format,
    this.maxDate_year,
    this.today_year,
    this.datePipe,
    this.datePipeMax,
    this.datePipeToday,
    this.datePipeMin,
    FormatValidationOnly);

    this.inputDate=this.myObj.theInput;
    this.error_msg=this.myObj.error_msg;
    this.TabIsDateWrong[id]=true;
    if (this.myObj.type_error===0 && this.inputDate.length===this.ref_format.MyDateFormat.length){
      this.selected_date.setDate(parseInt( this.myObj.input_day));
      this.selected_date.setMonth(parseInt(this. myObj.input_month)-1);
      this.selected_date.setFullYear(parseInt( this.myObj.input_year));
      
      this.datePipeSelected = this.datePipe.transform(this.selected_date,"dd-MM-yyyy");
      this.NewPerformanceFitness.Sport[id].Sport_date=this.datePipeSelected;
      this.TabinputDate[id]=this.inputDate;
      this.ErrorinputDate[id]='';
      this.TabIsDateWrong[id]=false;
    } 
    else if (this.myObj.type_error===0 && this.inputDate.length!==this.ref_format.MyDateFormat.length){
      this.TabinputDate[id]=this.inputDate;
      this.ErrorinputDate[id]='Date not complete yet';
    } else {
      this.ErrorinputDate[id]=this.error_msg;
    }
}

// Add and Delete items related to NewPerformanceFitness
addItem(event:any){
  this.OpenDialogue[this.prev_Dialogue]=false;
  this.findIds(event.target.id);

  if (event.target.id.substring(0,4)==='Spor'){
    this.ClassActiv = new ClassSport;
    this.NewPerformanceFitness.Sport.push(this.ClassActiv);
    this.NewPerformanceFitness.Sport[this.NewPerformanceFitness.Sport.length-1].Sport_name='';
    this.datePipeSelected = this.datePipe.transform(this.todayDate,"dd-MM-yyyy");
    this.NewPerformanceFitness.Sport[this.NewPerformanceFitness.Sport.length-1].Sport_date=this.datePipeSelected;
    this.TabinputDate[this.NewPerformanceFitness.Sport.length-1]=this.datePipeSelected;
    this.TabIsDateWrong[this.NewPerformanceFitness.Sport.length-1]=false;

    this.NewPerformanceFitness.Sport[this.NewPerformanceFitness.Sport.length-1].exercise[0].Activity_name='';
    this.NewPerformanceFitness.Sport[this.NewPerformanceFitness.Sport.length-1].exercise[0].ActivityExercise[0].Exercise_name='';
    this.NewPerformanceFitness.Sport[this.NewPerformanceFitness.Sport.length-1].exercise[0].ActivityExercise[0].seance[0].nb=0;

  } else  if (event.target.id.substring(0,4)==='Acti'){
        this.ClassBod= new ClassActivity;
        this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise.push(this.ClassBod);
        const j=this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise.length;
        this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[j-1].Activity_name='';
  }  else  if (event.target.id.substring(0,4)==='Exec'){
        this.ClassExec= new ClassExercise;
        this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise.push(this.ClassExec);
        const k=this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise.length;
        this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[k-1].Exercise_name='';
  } else  if (event.target.id.substring(0,4)==='Sean'){
        this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].seance.push({nb:0});
        const l=this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].seance.length;
        this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].seance[l-1].nb=0;
   } else  if (event.target.id.substring(0,4)==='Resu'){
        const cResult = new ClassResult;
        this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].Result.push(cResult);
      }
}



delItem(event:any){
  this.findIds(event.target.id);
  this.OpenDialogue[this.prev_Dialogue]=false;
  if (event.target.id.substring(0,4)==='Spor'){
    this.NewPerformanceFitness.Sport.splice(this.TabOfId[0],1);
  } else  if (event.target.id.substring(0,4)==='Acti'){
        this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise.splice(this.TabOfId[1],1);
  }  else  if (event.target.id.substring(0,4)==='Exec'){
      this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise.splice(this.TabOfId[2],1);
  } else  if (event.target.id.substring(0,4)==='Sean'){
        this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].seance.splice(this.TabOfId[3],1);
    } else  if (event.target.id.substring(0,4)==='Resu'){
        this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].Result.splice(this.TabOfId[3],1);
      }
}


// Add and Delete items related to ConfigFitness
addConfig(event:any){
  this.OpenDialogue[this.prev_Dialogue]=false;
  this.findIds(event.target.id);
  if (event.target.id.substring(0,4)==='aSpo'){
    const TheSport=new ConfigSport;
    this.MyConfigFitness.ListSport.push(TheSport);
    const l=this.MyConfigFitness.ListSport.length-1;
    this.MyConfigFitness.ListSport[l].sportName='';
    this.MyConfigFitness.ListSport[l].activityName.push('');
    this.MyConfigFitness.ListSport[l].activityExercise.push('');
    this.MyConfigFitness.ListSport[l].activityUnit.push('');
    this.MyConfigFitness.ListSport[l].activityPerf.push('');
    this.MyConfigFitness.ListSport[l].activityPerfUnit.push('');
  } else if (event.target.id.substring(0,4)==='aAct'){
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityName.push('');
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityName[this.MyConfigFitness.ListSport[this.TabOfId[0]].activityName.length-1]='';
  } else if (event.target.id.substring(0,4)==='aExe'){
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityExercise.push('');
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityExercise[this.MyConfigFitness.ListSport[this.TabOfId[0]].activityExercise.length-1]='';
  }else if (event.target.id.substring(0,4)==='aUni'){
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityUnit.push('');
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityUnit[this.MyConfigFitness.ListSport[this.TabOfId[0]].activityUnit.length-1]='';
  }  else if (event.target.id.substring(0,8)==='aPerType'){
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityPerf.push('');
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityPerf[this.MyConfigFitness.ListSport[this.TabOfId[0]].activityPerf.length-1]='';
  }  else if (event.target.id.substring(0,8)==='aPerUnit'){
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityPerfUnit.push('');
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityPerfUnit[this.MyConfigFitness.ListSport[this.TabOfId[0]].activityPerfUnit.length-1]='';
  }
}

delConfig(event:any){
  this.OpenDialogue[this.prev_Dialogue]=false;
  this.findIds(event.target.id);
  if (event.target.id.substring(0,4)==='dSpo'){
    this.MyConfigFitness.ListSport.splice(this.TabOfId[0],1);
  } else  if (event.target.id.substring(0,4)==='dAct'){
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityName.splice(this.TabOfId[1],1);
  } else  if (event.target.id.substring(0,4)==='dExe'){
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityExercise.splice(this.TabOfId[1],1);
  }else  if (event.target.id.substring(0,8)==='dUniExer'){
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityUnit.splice(this.TabOfId[1],1);
  } else  if (event.target.id.substring(0,8)==='dPerType'){
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityPerf.splice(this.TabOfId[1],1);
  }  else  if (event.target.id.substring(0,8)==='dPerUnit'){
    this.MyConfigFitness.ListSport[this.TabOfId[0]].activityPerfUnit.splice(this.TabOfId[1],1);
  } 
}

addList(event:any){
  this.OpenDialogue[this.prev_Dialogue]=false;
  if (event.target.id.substring(0,4)==='aSpo'){
    this.MyConfigFitness.TabSport.push({name:''});

  } else if (event.target.id.substring(0,4)==='aAct'){
    this.MyConfigFitness.TabActivity.push({name:''});

  } else if (event.target.id.substring(0,4)==='aExe'){
    this.MyConfigFitness.TabExercise.push({name:''});

  }else if (event.target.id.substring(0,4)==='aPer'){
    this.MyConfigFitness.TabPerfType.push({name:''});

  } else if (event.target.id.substring(0,9)==='aUnitPerf'){
    this.MyConfigFitness.TabPerfUnit.push({name:''});

  } else if (event.target.id.substring(0,4)==='aUni'){
    this.MyConfigFitness.TabUnits.push({name:''});
  } 
}

delList(event:any){
  this.OpenDialogue[this.prev_Dialogue]=false;
  this.findIds(event.target.id);
  if (event.target.id.substring(0,4)==='dSpo'){
    this.MyConfigFitness.TabSport.splice(this.TabOfId[0],1);

  } else if (event.target.id.substring(0,4)==='dAct'){
    this.MyConfigFitness.TabActivity.splice(this.TabOfId[0],1);

  } else if (event.target.id.substring(0,4)==='dExe'){
    this.MyConfigFitness.TabExercise.splice(this.TabOfId[0],1);

  }else if (event.target.id.substring(0,4)==='dPer'){
    this.MyConfigFitness.TabPerfType.splice(this.TabOfId[0],1);

  } else if (event.target.id.substring(0,8)==='dUniExer'){
    this.MyConfigFitness.TabUnits.splice(this.TabOfId[0],1);

  } else if (event.target.id.substring(0,9)==='dUnitPerf'){
    this.MyConfigFitness.TabPerfUnit.splice(this.TabOfId[0],1);
  } 
}

idText:string='';
findIds(theId:string){
  this.error_msg='';
  this.message='';
  
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
    //this.TabOfId.push(0);
    i++;
  }
  this.idText=theId.substring(0,TabDash[0]-1);
}

GetAllObjects(){
  // bucket name is ListOfObject.config
  // this.scroller.scrollToAnchor('targetTopObjects');
  this.scroller.scrollToAnchor('theTop');
  var i=0;
  this.error_msg='';
  this.HTTP_Address=this.Google_Bucket_Access_Root+ this.Google_Bucket_Name + "/o"  ;
  console.log('RetrieveAllObjects()'+this.Google_Bucket_Name);
  this.http.get<Bucket_List_Info>(this.HTTP_Address )
          .subscribe((data ) => {
                console.log('RetrieveAllObjects() - data received');
                this.myListOfObjects=data;
                if (this.ChartFileList.length!==0){
                  this.ChartFileList.clear();
                }
                for (i=this.myListOfObjects.items.length-1; i>-1; i--){
                      if (this.myListOfObjects.items[i].name.substring(0,this.identification.fitness.files.fileStartLength)!==this.identification.fitness.files.fileStartName){
                        this.myListOfObjects.items.splice(i,1);
                      } else {
                        this.FillFSelected.selected='N';
                        this.ChartFileList.push(this.FormChart()); 
                        // this.ChartFileList.push(this.FormChart);              
                        this.ChartFileList.controls[this.ChartFileList.length-1].setValue(this.FillFSelected);
                      }
                }
                this.DisplayListOfObjects=true; 
          },
          error_handler => {
                console.log('RetrieveAllObjects() - error handler; HTTP='+this.HTTP_Address);
                this.error_msg='HTTP_Address='+this.HTTP_Address;
                this.Error_Access_Server='RetrieveAllObjects()==> ' + error_handler.message + ' error status==> '+ error_handler.statusText+'   name=> '+ error_handler.name + '   Error url==>  '+ error_handler.url;
          } 
    )
}

theConfig=new ConfigFitness;
GetRecord(event:string, iWait:number, ref:number){
  // get object in Google Storage
  this.scroller.scrollToAnchor('theTop');
  this.OpenDialogue[this.prev_Dialogue]=false;
  var i=0;
  var j=0;
  var k=0;
  var l=0;
 var ObjectName='';
  if (event==='data'){  
  
      ObjectName=this.Google_Object_Name;
      this.error_msg='Access to file "' + this.Google_Object_Name +'" is on-going';
      console.log('message ' + this.error_msg);
      this.ObjectIsRetrieved=false;
    } 
  else {
    ObjectName=this.Google_Object_Fitness;
      }
  this.EventHTTPReceived[iWait]=false;
  this.NbWaitHTTP++;
  this.waitHTTP(this.TabLoop[iWait],30000,iWait);

  //this.Google_Object_Name='AFeb%2028%202023';

  this.ManageGoogleService.getContentObject(this.configServer, this.Google_Bucket_Name,ObjectName )
            .subscribe((data ) => {
                
               if (event==='data'){   
                  this.EventHTTPReceived[iWait]=true;  
                  if (this.NbWaitHTTP>0){this.NbWaitHTTP--;}   
                  console.log('data received - NbWaitHTTP=' + this.NbWaitHTTP + ' EventHTTPReceived = ' + this.EventHTTPReceived[iWait] + ' iWait = ' + iWait);                   
                  this.NewPerformanceFitness=data;
                  for (i=0; i<this.NewPerformanceFitness.Sport.length; i++){
                    this.TabinputDate[i]=this.NewPerformanceFitness.Sport[i].Sport_date;
                    for (j=0; j<this.NewPerformanceFitness.Sport[i].exercise.length; j++){
                        for (k=0; k<this.NewPerformanceFitness.Sport[i].exercise[j].ActivityExercise.length; k++){
                          if (this.NewPerformanceFitness.Sport[i].exercise[j].ActivityExercise[k].Result===undefined){
                              this.ClassExec = new ClassExercise;
                              this.NewPerformanceFitness.Sport[i].exercise[j].ActivityExercise[k]=this.ClassExec;
                              this.NewPerformanceFitness.Sport[i].exercise[j].ActivityExercise[k].Exercise_name=data.Sport[i].exercise[j].ActivityExercise[k].Exercise_name;
                              this.NewPerformanceFitness.Sport[i].exercise[j].ActivityExercise[k].Exercise_unit=data.Sport[i].exercise[j].ActivityExercise[k].Exercise_unit;
                              this.NewPerformanceFitness.Sport[i].exercise[j].ActivityExercise[k].seance=data.Sport[i].exercise[j].ActivityExercise[k].seance;
                          }
                        }
                    }

                  }
                  this.mainTableHeight=this.largeMainTableHeight;
                  this.subTableHeight=this.largeSubTableHeight;
                  if (this.MergeFiles===false){
                    this.LinkPerfConfig();
                    this.Input_Travel_O_R='O';
                    this.isSelectedDate=true;
                    this.ObjectIsRetrieved=true;
                    this.scroller.scrollToAnchor('theTop');
                  } else {
                    this.Google_Object_Name=this.FilesAlreadyMerged[ref].name;
                    this.MergeAllFiles(ref);
                  }

                  this.LinkPerfConfig();
                  
                } else if (event==='config'){ 
                    if (this.NbWaitHTTP>0){this.NbWaitHTTP--;} 
                    this.EventHTTPReceived[iWait]=true;
                    this.theConfig=new ConfigFitness;
                    this.theConfig=data;
                    this.MyConfigFitness=new ConfigFitness;
                    this.MyConfigFitness.fileType=this.identification.fitness.fileType.FitnessMyConfig;
                    this.MyConfigFitness.user_id=this.theConfig.user_id;
                    this.MyConfigFitness.firstname=this.theConfig.firstname;
                    this.MyConfigFitness.lastname=this.theConfig.lastname;
                    if (this.theConfig.TabSport[0].name!==undefined){
                      this.MyConfigFitness.TabSport=this.theConfig.TabSport;
                    } else {this.MyConfigFitness.TabSport[0].name=''};

                    if (this.theConfig.TabActivity[0].name!==undefined){
                      this.MyConfigFitness.TabActivity=this.theConfig.TabActivity;
                    } else {this.MyConfigFitness.TabActivity[0].name=''};

                    if (this.theConfig.TabExercise!==undefined){
                      this.MyConfigFitness.TabExercise=this.theConfig.TabExercise;
                    } else {this.MyConfigFitness.TabExercise[0].name=''};

                    if (this.theConfig.TabPerfType[0].name!==undefined){
                      this.MyConfigFitness.TabPerfType=this.theConfig.TabPerfType;
                    } else {this.MyConfigFitness.TabPerfType[0].name=''};

                    if (this.theConfig.TabUnits[0].name!==undefined){
                      this.MyConfigFitness.TabUnits=this.theConfig.TabUnits;
                    } else {this.MyConfigFitness.TabUnits[0].name=''};

                    if (this.theConfig.TabPerfUnit[0].name!==undefined){
                      this.MyConfigFitness.TabPerfUnit=this.theConfig.TabPerfUnit;
                    } else {this.MyConfigFitness.TabPerfUnit[0].name=''};
                    
                    for (i=0; i<this.theConfig.ListSport.length; i++){
                            if (i>0){
                              const TheSport=new ConfigSport;
                              this.MyConfigFitness.ListSport.push(TheSport);
                              const l=this.MyConfigFitness.ListSport.length-1;
                            }

                            this.MyConfigFitness.ListSport[i].activityName=this.theConfig.ListSport[i].activityName;
                            
                            if (this.theConfig.ListSport[i].activityExercise!==undefined){
                              if (this.theConfig.ListSport[i].activityExercise.length===0){
                                this.MyConfigFitness.ListSport[i].activityExercise[0]='';
                              } else {
                                this.MyConfigFitness.ListSport[i].activityExercise=this.theConfig.ListSport[i].activityExercise;
                              }
                            } 
                            if (this.theConfig.ListSport[i].activityPerf!==undefined){
                                  if (this.theConfig.ListSport[i].activityPerf.length===0){
                                    this.MyConfigFitness.ListSport[i].activityPerf[0]='';
                                  } else {
                                    this.MyConfigFitness.ListSport[i].activityPerf=this.theConfig.ListSport[i].activityPerf;
                                  }
                            } else {this.MyConfigFitness.ListSport[i].activityPerf[0]=''};
                            
                            if (this.theConfig.ListSport[i].activityPerfUnit!==undefined){
                                  if (this.theConfig.ListSport[i].activityPerfUnit.length===0){
                                    this.MyConfigFitness.ListSport[i].activityPerfUnit[0]='';
                                  } else {
                                    this.MyConfigFitness.ListSport[i].activityPerfUnit=this.theConfig.ListSport[i].activityPerfUnit;
                                  }
                            } else {this.MyConfigFitness.ListSport[i].activityPerfUnit[0]=''};

                            this.MyConfigFitness.ListSport[i].activityUnit=this.theConfig.ListSport[i].activityUnit;
                            this.MyConfigFitness.ListSport[i].sportName=this.theConfig.ListSport[i].sportName;
                    }

                    this.ConfigExist=true;
                    
                    if (this.MyConfigFitness.TabSport[0].name===undefined || this.MyConfigFitness.TabSport.length===0){ 
                        this.InitTabConfig();
                      }
                    this.LinkPerfConfig();
                    this.returnFile.emit(this.MyConfigFitness);
                  }
                this.error_msg='';
                this.scroller.scrollToAnchor('AccessToListFiles');
              },
              error_handler => {
                if (event==='data'){
                      this.EventHTTPReceived[iWait]=true;
                      if (this.NbWaitHTTP>0){this.NbWaitHTTP--;} 
                      console.log('GetRecord() - error handler');
                      this.error_msg='INIT - error message==> ' + error_handler.message + ' error status==> '+ error_handler.statusText+'   name=> '+ error_handler.name + '   Error url==>  '+ error_handler.url;
                  } else if (event==='config'){
                      this.error_msg='';
                      this.ConfigExist=false;
                      this.EventHTTPReceived[iWait]=true;
                      if (this.NbWaitHTTP>0){this.NbWaitHTTP--;} 
                      this.MyConfigFitness=new ConfigFitness;
                      this.MyConfigFitness.fileType=this.identification.fitness.files.fileFitnessMyConfig;
                      this.MyConfigFitness.user_id=this.identification.UserId;
                      this.MyConfigFitness.firstname=this.identification.firstname;
                      this.MyConfigFitness.lastname=this.identification.surname;
                      this.MyConfigFitness.ListSport[0].sportName='';
                      this.MyConfigFitness.ListSport[0].activityName[0]='';
                      this.MyConfigFitness.ListSport[0].activityExercise[0]='';
                      this.MyConfigFitness.ListSport[0].activityUnit[0]='';
                      this.MyConfigFitness.ListSport[0].activityPerf[0]='';
                      this.MyConfigFitness.ListSport[0].activityPerfUnit[0]='';
                      this.InitTabConfig();
                  }   
            } 
      )
  }

ConfirmSave(){
  this.OpenDialogue[this.prev_Dialogue]=false;
  var i=0;
  
  for (i=0; i<this.ErrorinputDate.length && ( this.ErrorinputDate[i]==='' || this.ErrorinputDate[i]===undefined ); i++){
  }
  if (i===this.ErrorinputDate.length) {
    this.SpecificForm.controls['FileName'].setValue(this.Google_Object_Name);
    this.IsSaveConfirmed = true;
    this.error_msg='';
  } else {this.error_msg='correct your error';}
}


SaveNewRecord(){
  var i=0;

  this.IsSaveConfirmed = false;
  this.message='';
  this.Google_Object_Name = this.SpecificForm.controls['FileName'].value ;
  if (this.Google_Object_Name.substring(0,this.identification.fitness.files.fileStartLength)!==this.identification.fitness.files.fileStartName){
    this.Google_Object_Name=this.identification.fitness.files.fileStartName+this.SpecificForm.controls['FileName'].value;
  }
  if (this.Google_Object_Name===''){
    this.Google_Object_Name = 'NoNameFile';
  }
  this.NewPerformanceFitness.firstname=this.identification.firstname;
  this.NewPerformanceFitness.lastname=this.identification.surname;
  this.NewPerformanceFitness.user_id=this.identification.id;
  var file=new File ([JSON.stringify(this.NewPerformanceFitness)],this.Google_Object_Name, {type: 'application/json'});

  this.ManageGoogleService.uploadObject(this.configServer, this.Google_Bucket_Name, file )
  //this.http.post(this.HTTP_Address,  this.Table_User_Data[this.identification.id] , {'headers':this.myHeader} )
  .subscribe(res => {
    //**this.LogMsgConsole('Individual Record is updated: '+ this.Table_User_Data[this.identification.id].UserId );
      if (res.type===4){
            this.message='File "'+ this.Google_Object_Name +'" is successfully stored in the cloud';
          
            // check if this is a new file and if yes create at the end of the list of objects
            // only name is needed
            for (i=0; i<this.myListOfObjects.items.length && this.myListOfObjects.items[i].name !== this.Google_Object_Name; i++ ){
            }
            if (i===this.myListOfObjects.items.length){
                  const KindAllObj=new Bucket_List_Info;
                  this.myListOfObjects.items.push(KindAllObj);
                  this.myListOfObjects.items[this.myListOfObjects.items.length-1].name=this.Google_Object_Name;
                  this.FillFSelected.selected='N';
                  this.ChartFileList.push(this.FormChart()); 
                  // this.ChartFileList.push(this.FormChart);              
                  this.ChartFileList.controls[this.ChartFileList.length-1].setValue(this.FillFSelected);
            }
            this.UpdateMergeFiles(this.Google_Object_Name);
          }
        },
        error_handler => {
          //**this.LogMsgConsole('Individual Record is not updated: '+ this.Table_User_Data[this.identification.id].UserId );
          this.message='File' + this.Google_Object_Name +' *** Save action failed - status is '+error_handler.status;
        } 
      )
  }

ConfirmConfig(){
this.isConfigConfirmed=true;
this.SpecificForm.controls['FileName'].setValue(this.Google_Object_Fitness);
}

CancelConfig(){
  this.isConfigConfirmed=false;
}

EventHTTPSave:boolean=false;
SaveConfigFtiness(){
  this.isConfigConfirmed=false;
  this.EventHTTPSave=false;
  var file=new File ([JSON.stringify(this.MyConfigFitness)],this.SpecificForm.controls['FileName'].value, {type: 'application/json'});
                    
  this.ManageGoogleService.uploadObject(this.configServer, this.Google_Bucket_Name, file )
  //this.http.post(this.HTTP_Address,  this.Table_User_Data[this.identification.id] , {'headers':this.myHeader} )
  .subscribe(res => {
    //**this.LogMsgConsole('Individual Record is updated: '+ this.Table_User_Data[this.identification.id].UserId );
          this.message='File "'+ this.SpecificForm.controls['FileName'].value +'" is successfully stored in the cloud';
            
          if (this.EventHTTPSave===false){
            this.returnFile.emit(this.MyConfigFitness);
          } 
          this.EventHTTPSave=true;
          },
        error_handler => {
          //**this.LogMsgConsole('Individual Record is not updated: '+ this.Table_User_Data[this.identification.id].UserId );
          this.message='File' + this.SpecificForm.controls['FileName'].value +' *** Save action failed - status is '+error_handler.status;
        } 
      )
}


CancelRecord(){
    this.error_msg='';
    this.NewPerformanceFitness.Sport.splice(1,this.NewPerformanceFitness.Sport.length);
    this.NewPerformanceFitness.Sport[0].exercise.splice(1,this.NewPerformanceFitness.Sport[0].exercise.length);
    this.NewPerformanceFitness.Sport[0].exercise[0].ActivityExercise.splice(1,this.NewPerformanceFitness.Sport[0].exercise[0].ActivityExercise.length);
    this.NewPerformanceFitness.Sport[0].exercise[0].ActivityExercise[0].seance.splice(1,this.NewPerformanceFitness.Sport[0].exercise[0].ActivityExercise[0].seance.length)
    this.NewPerformanceFitness.Sport[0].exercise[0].ActivityExercise[0].Result.splice(1,this.NewPerformanceFitness.Sport[0].exercise[0].ActivityExercise[0].Result.length)
  
    this.NewPerformanceFitness.Sport[0].Sport_name='';
    this.NewPerformanceFitness.Sport[0].Sport_date='';
    this.NewPerformanceFitness.Sport[0].exercise[0].Activity_name='';
    this.NewPerformanceFitness.Sport[0].exercise[0].ActivityExercise[0].Exercise_name='';
    this.NewPerformanceFitness.Sport[0].exercise[0].ActivityExercise[0].seance[0].nb=0;
    this.NewPerformanceFitness.Sport[0].exercise[0].ActivityExercise[0].Result[0].perf_type='';
    this.NewPerformanceFitness.Sport[0].exercise[0].ActivityExercise[0].Result[0].perf='';
    this.NewPerformanceFitness.Sport[0].exercise[0].ActivityExercise[0].Result[0].unit='';
    this.TabinputDate.splice(1, this.TabinputDate.length);
    this.CancelAll();
    this.TabPerfConfig.splice(0,this.TabPerfConfig.length);
    this.mainTableHeight=130;
    this.subTableHeight=100;
  }

// this.scroller.scrollToAnchor('AccessToListFiles');
CancelSave(){
this.IsSaveConfirmed=false;
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


RetrieveConfig(){
    var test_prod='prod';
 
    //this.configServer.baseUrl='https://localhost:8080';
    this.configServer.baseUrl='https://test-server-359505.uc.r.appspot.com';
    
    this.configServer.GoogleProjectId='ConfigDB';
    this.ManageMangoDBService.findConfigbyURL(this.configServer, 'configServer', '')
    .subscribe(
      data => {
     
       if (environment.production === false){
          test_prod='test';
       }
      
      for (let i=0; i<data.length; i++){
          if (data[i].title==="configServer" && data[i].test_prod===test_prod){
              this.configServer = data[i];
          } 
      }
      this.GetAllObjects();
      this.isConfigServerRetrieved=true;
      this.scroller.scrollToAnchor('AccessToListFiles');
      },
      error => {
        console.log('error to retrieve the configuration file ;  error = ', error.status);
        this.error_msg='Problem to access MONGODB - configuration server data not retrieved';
      });
  }


RetrieveSelectedFile(event:any){
    this.error_msg='';
    this.message='';
    this.ManageGoogleService.getContentObject(this.configServer, event.bucket,event.name )
    .subscribe((data ) => {
          console.log('RetrieveSelectedFile='+event.mediaLink);
          this.Google_Object_Name=event.name;
          this.SpecificForm.controls['FileName'].setValue(event.name);
          this.GetRecord('data',1,0);
        },
    error_handler => {
          this.error_msg='HTTP_Address='+event.mediaLink;
          this.Error_Access_Server='INIT - error message==> ' + error_handler.message + ' error status==> '+ error_handler.statusText+'   name=> '+ error_handler.name + '   Error url==>  '+ error_handler.url;
          console.log('RetrieveSelectedFile- error handler '+this.Error_Access_Server);
          this.error_msg=this.error_msg+'INIT - error status==> '+ error_handler.status+ '   Error url==>  '+ error_handler.url;
        } 
    )
}


SelectedDate(event:any){
  this.error_msg='';
  this.DisplayCalendar=false;
  var theID=0;
  var i=0;
  for (theID=0; this.TabDisplayCalendar[theID]===false || this.TabDisplayCalendar[theID]===undefined; theID++){};
  this.selected_year=parseInt(formatDate(event,'yyyy',this.locale));
  this.selected_month=parseInt(formatDate(event,'MM',this.locale));
  this.selected_day=parseInt(formatDate(event,'dd',this.locale));
  this.selected_date=event;
  const theDatePipe = this.datePipe.transform(this.selected_date,"dd-MM-yyyy");
  if (theDatePipe!=="01-01-1000"){
      this.Input_Travel_O_R='O';
      this.datePipeSelected = this.datePipe.transform(this.selected_date,"dd-MM-yyyy");
      this.NewPerformanceFitness.Sport[theID].Sport_date=this.datePipeSelected;
      this.TabinputDate[theID]=this.datePipeSelected;
      this.ErrorinputDate[theID]='';
      this.TabIsDateWrong[theID]=false;
      this.isSelectedDate=true;
  } else {
    // this was a cancel so no process on the date
      for (i=0; i<this.ErrorinputDate.length; i++){
        if (this.Error_OpenCalendar===this.ErrorinputDate[i]){
          this.ErrorinputDate[i]='';
        }
      }
  }
  this.TabDisplayCalendar[theID]=false; 
}


ActionCalendar(event:any){
  var i=0;
  var SaveTabOfId:Array<number>=[];

  for (i=0; (this.TabDisplayCalendar[i]===false || this.TabDisplayCalendar[i]=== undefined) && i<this.TabDisplayCalendar.length; i++){};
  if (this.TabDisplayCalendar.length===0 || i>this.TabDisplayCalendar.length-1 || this.TabDisplayCalendar[i]===false){
      this.findIds(event.target.id);
      this.TabDisplayCalendar[this.TabOfId[0]]=true;
      this.TabDisplayId[this.TabOfId[0]]=this.TabOfId[0];
      this.DisplayCalendar=true;
      
      const selYear=parseInt(this.NewPerformanceFitness.Sport[this.TabOfId[0]].Sport_date.substring(6,10));
      const selMonth=parseInt(this.NewPerformanceFitness.Sport[this.TabOfId[0]].Sport_date.substring(3,6));
      const selDay=parseInt(this.NewPerformanceFitness.Sport[this.TabOfId[0]].Sport_date.substring(0,3));
      this.selected_date.setDate(selDay);
      this.selected_date.setMonth(selMonth-1);
      this.selected_date.setFullYear(selYear);


  } else {
      SaveTabOfId[0]=this.TabOfId[0];
      for (i=1; i<this.TabOfId.length; i++){
          SaveTabOfId.push(0);
          SaveTabOfId[i]=this.TabOfId[i];
      }
      this.findIds(event.target.id);
      this.ErrorinputDate[this.TabOfId[0]] = this.Error_OpenCalendar;
      for (i=0; i<SaveTabOfId.length-1; i++){
        this.TabOfId[i]=SaveTabOfId[i];
      }
  }
}

InitTabConfig(){
  const List_Activity:Array<string>=[
  'Legs', 'Shoulders', 'Chest', 'Biceps', 'Triceps (pull)', 'Triceps (behind head)','Push-up'
  ];
  const List_Sport:Array<string>=[
    'Workouts', 'Running', 'Cycling', 'Insanity', 'Cardio-ABS'
  ];
  const List_Exercise:Array<string>=[
    'Suicide Jumps', 'Jump Squat', 'Squat Lunge', 'Push-up', 'Oblique Rotation', 'High Plank', 
    'Low Plank Knee to Elbow', 'Low Plank Knee to Elbow'
  ];
  const List_Units:Array<string>=[
    'kg', 'lbs', 
  ];
  const List_Perf:Array<string>=[
    'Avg Pace', 'Avg Speed', 'Avg Moving Speed', 'Total Time', 'Moving Time', 'Distance'
  ];
  const List_PerfUnits:Array<string>=[
    'km/h', 'min/km', 'hh:mn:ss', 'hh:mn', "mn:sec" 
  ];

  var i=0;
  for (i=0; i<List_Sport.length-1; i++){
    this.MyConfigFitness.TabSport.push({name:''}); 
    this.MyConfigFitness.TabSport[i].name=List_Sport[i];
  }
  for (i=0; i<List_Activity.length-1; i++){
    this.MyConfigFitness.TabActivity.push({name:''}); 
    this.MyConfigFitness.TabActivity[i].name=List_Activity[i];
  }
  for (i=0; i<List_Exercise.length-1; i++){
    this.MyConfigFitness.TabExercise.push({name:''}); 
    this.MyConfigFitness.TabExercise[i].name=List_Exercise[i];
  }
  for (i=0; i<List_Units.length-1; i++){
    this.MyConfigFitness.TabUnits.push({name:''}); 
    this.MyConfigFitness.TabUnits[i].name=List_Units[i];
  }
  for (i=0; i<List_Perf.length-1; i++){
    this.MyConfigFitness.TabPerfType.push({name:''}); 
    this.MyConfigFitness.TabPerfType[i].name=List_Perf[i];
  }
  for (i=0; i<List_PerfUnits.length-1; i++){
    this.MyConfigFitness.TabPerfUnit.push({name:''}); 
    this.MyConfigFitness.TabPerfUnit[i].name=List_PerfUnits[i];
  }
}

}

