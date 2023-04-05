import { Component, OnInit , Input, Output, HostListener,  HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
import { DatePipe, formatDate } from '@angular/common'; 

import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { Observable } from 'rxjs';

import { Fitness } from '../JsonServerClass';
import { FormatWeight } from '../JsonServerClass';
import { ArrayNewWeight } from '../JsonServerClass';
import { ArrayNewBody } from '../JsonServerClass';
import { BucketList } from '../JsonServerClass';
import { Bucket_List_Info } from '../JsonServerClass';

// configServer is needed to use ManageGoogleService
// it is stored in MangoDB and accessed via ManageMangoDBService
import { configServer } from '../JsonServerClass';
import { XMVConfig } from '../JsonServerClass';
import { environment } from 'src/environments/environment';
import { LoginIdentif } from '../JsonServerClass';
import {manage_input} from '../manageinput';
import {eventoutput, thedateformat} from '../apt_code_name';

import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import {AccessConfigService} from 'src/app/CloudServices/access-config.service';


export class ConfigFitness{
  user_id: string='';
  firstname:string='';
  lastname:string='';
  TabSport:Array<any>=[{name:''}];
  TabActivity:Array<any>=[{name:''}];
  TabExercise:Array<any>=[{name:''}];
  TabUnits:Array<any>=[{name:''}];
  TabPerfType:Array<any>=[{name:''}];
  TabPerfUnit:Array<any>=[{name:''}];
  ListSport:Array<any>=[
  {
      sportName:'',         // workout, running,cycling etc.
      activityName:[],  // shoulder, leg, intervals, abs, cardio, insanity
      activityExercise:[], //push up
      activityUnit:[],  // Weigtht (kg, lbs),  Time (sec, min, hr)
                        // Speed/Pace (km/h, min/km), Quantity 
      activityPerf:[],  // Avg Pace; Avg Moving Pace; Avg Speed; Avg Moving Speed; Total time; Total Moving time
      activityPerfUnit:[],// Time (sec, min, hr), Distance (m, km)
  }];  
}

export class ConfigSport{
  sportName:string='';         // workout, running,cycling etc.
  activityName:Array<string>=[];  // shoulder, leg, intervals, abs
  activityExercise:Array<string>=[]; //push up
  activityUnit:Array<string>=[];  // Weigtht (kg, lbs),  Time (sec, min, hr)
  activityPerf:Array<string>=[];  // avg space
  activityPerfUnit:Array<string>=[];  // Distance (m, km), Speed (km/h), Quantity                 
}

export class PerformanceFitness{
  user_id: number=0;
  firstname:string='';
  lastname:string='';
  Sport:Array<any>=[
      {
      Sport_name:'', // workout, running, etc.
      Sport_date: new Date(),
      exercise:[{
        Activity_name:'', // part of the body: shoulder, leg, type of running exercise such as intervals, tour
        ActivityExercise: //                                    Running
              [{
                Exercise_name:'', // 20, 50                     50
                Exercise_unit:'', // kg, sec, min, km           km
                seance:[{nb:0}], 
                Result:[{perf_type:'',perf:'',unit:''}],
              // perf_type = Avg Pace; Avg Moving Pace; Avg Speed; Avg Moving Speed; Total time; Total Moving time
              // {perf_type:'Total time',perf:'51:46',unit:''}
            }]
            }]
          }]
      }
    
export class ClassResult{
  perf_type:string='';
  perf:string='';
  unit:string='';
}

export class ClassSport{
  Sport_name:string=''; // workout, running, etc.
  Sport_date= new Date();
  exercise:Array<any>=[{
    Activity_name:'', // part of the body: shoulder, leg, type of running exercise such as fraction
    ActivityExercise:
          [{
            Exercise_name:'', // 20kg, 20s
            Exercise_unit:'', // kg, sec, m
            seance:[{nb:0}],
            Result:[{perf_type:'',perf:'',unit:''}],
          }]
        }]
      }

export class ClassActivity{
  Activity_name:string=''; // part of the body: shoulder, leg, type of running exercise such as fraction
  ActivityExercise:Array<any>=
        [{
          Exercise_name:'', // 20kg, 20s
          Exercise_unit:'', // kg, sec, m
          seance:[{nb:0}],
          Result:[{perf_type:'',perf:'',unit:''}],
        }]
}

export class ClassExercise{
        Exercise_name:string=''; // 20kg, 20s
        Exercise_unit:string=''; // kg, sec, m
        seance:Array<any>=[{nb:0}];
        Result:Array<any>=[{perf_type:'',perf:'',unit:''}];
}

@Component({
  selector: 'app-fitness-stat',
  templateUrl: './fitness-stat.component.html',
  styleUrls: ['./fitness-stat.component.css'],
})

export class FitnessStatComponent implements OnInit {

  constructor(   
    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageMangoDBService: ManageMangoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    @Inject(LOCALE_ID) private locale: string,
    //private TheConfig: AccessConfigService,
   ) { }

@Input() XMVConfig=new XMVConfig;
@Input() configServer = new configServer;
@Input() identification= new LoginIdentif;

IsTestBoolean:boolean=true;

IsSaveConfirmed:boolean=false;
SpecificForm=new FormGroup({
  FileName: new FormControl(''),
})

NewconfigServer=new configServer;
isConfigServerRetrieved:boolean=false;
NewXMVConfig=new XMVConfig;

NewPerformanceFitness=new PerformanceFitness;

MyConfigFitness=new ConfigFitness;

HTTP_Address:string='';
HTTP_AddressPOST:string='';
Google_Bucket_Access_Root:string='https://storage.googleapis.com/storage/v1/b/';
Google_Bucket_Access_RootPOST:string='https://storage.googleapis.com/upload/storage/v1/b/';

Google_Bucket_Name:string='xav_fitness'; 
Google_Object_Name:string='';
Google_Object_Fitness:string='';

bucket_data:string='';
myListOfObjects=new Bucket_List_Info;
DisplayListOfObjects:boolean=false;

// used to create object name in Google Storage
//myDate:string='';
//myTime=new Date();
//thetime:string='';

Error_Access_Server:string='';
message:string='';
error_msg: string='';

EventHTTPReceived:Array<boolean>=[false,false,false,false,false,false];
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

TheWeights:Array<FormatWeight>=[]; // can come from Google Storage
RefFormatWeight=new FormatWeight;

kg_lbs:number=2.20462;
lbs_kg:number=0.453592;


prev_Dialogue:number=0;
max_dialogue:number=20;
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

Error_OpenCalendar:string='close the calendar which is already open for another sport';

@HostBinding("style.--posList")

refMedia:number=1010;

nbToDisplay:number=0;
nbSeanceDisplay:number=0;
@HostListener('window:resize', ['$event'])
onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;

    if (this.getScreenWidth<this.refMedia+1){ this.nbToDisplay=2; this.nbSeanceDisplay=3;} 
    else { this.nbToDisplay=4; this.nbSeanceDisplay=5;}



    /*
    this.calcPos=Math.round(0.40 * this.getScreenWidth);
    if (this.getScreenWidth>1010){
      this.calcPos=446;
    } else {
      this.calcPos=180;
    }
    */
  }

ngOnInit(){
  this.getScreenWidth = window.innerWidth;
  this.getScreenHeight = window.innerHeight;
  if (this.getScreenWidth<620){ this.nbToDisplay=2; this.nbSeanceDisplay=3;} 
  else { this.nbToDisplay=4; this.nbSeanceDisplay=5;}

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

  if (this.configServer.GoogleProjectId===''){
    this.RetrieveConfig();
  } else{ // not in place yet *************
    if (this.identification.ownBuckets!== undefined && this.identification.ownBuckets.length>0){
      this.Google_Bucket_Name=this.identification.ownBuckets[0].name;
    }
    this.GetAllObjects();
    this.isConfigServerRetrieved=true;
  
    this.Google_Object_Fitness="Config"+this.identification.id+'-'+this.identification.UserId;
    this.GetRecord('config');
  }
  
  // weights to be selected by user when exercising
  this.FillTabWeight();
  this.scroller.scrollToAnchor('targetTop');
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



theArrow(event:any){
  this.OpenDialogue[this.prev_Dialogue]=false;

  this.findIds(event.target.id);

  if (  event.target.id.substring(0,5)==='Sport'){
    this.prev_Dialogue=0;
    this.OpenDialogue[this.prev_Dialogue]=true;
  } else if (  event.target.id.substring(0,8)==='Activity'){
    this.prev_Dialogue=1;
    this.OpenDialogue[this.prev_Dialogue]=true;
  } else if (  event.target.id.substring(0,12)==='ExerciseUnit'){
    this.prev_Dialogue=2;
    this.OpenDialogue[this.prev_Dialogue]=true;
  } else if (  event.target.id.substring(0,8)==='PerfType'){
    this.prev_Dialogue=3;
    this.OpenDialogue[this.prev_Dialogue]=true;
  } else if (  event.target.id.substring(0,8)==='PerfUnit'){
    this.prev_Dialogue=4;
    this.OpenDialogue[this.prev_Dialogue]=true;
  } else if (  event.target.id.substring(0,12)==='ExerciseName'){
    this.prev_Dialogue=5;
    this.OpenDialogue[this.prev_Dialogue]=true;
  } 
}


onArrow(event:string){
  this.OpenDialogue[this.prev_Dialogue]=false;
  if (  event.substring(0,6)==='lSport'){
    this.prev_Dialogue=6;
    this.OpenDialogue[this.prev_Dialogue]=true;
  } else if (  event.substring(0,9)==='lActivity'){
    this.prev_Dialogue=7;
    this.OpenDialogue[this.prev_Dialogue]=true;
  } else if (  event.substring(0,5)==='lUnit'){
    this.prev_Dialogue=8;
    this.OpenDialogue[this.prev_Dialogue]=true;
  } else if (  event.substring(0,9)==='lPerfType'){
    this.prev_Dialogue=9;
    this.OpenDialogue[this.prev_Dialogue]=true;
  } else if (  event.substring(0,9)==='lPerfUnit'){
    this.prev_Dialogue=10;
    this.OpenDialogue[this.prev_Dialogue]=true;
  } else if (  event.substring(0,9)==='lExercise'){
    this.prev_Dialogue=11;
    this.OpenDialogue[this.prev_Dialogue]=true;
  } 
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
        this.NewPerformanceFitness.Sport[this.TabOfId[0]].exercise[this.TabOfId[1]].ActivityExercise[this.TabOfId[2]].Result.push({cResult});
       
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
                for (i=this.myListOfObjects.items.length-1; i>-1; i--){
                      if (this.myListOfObjects.items[i].name.substring(0,6)==='Config'){
                        this.myListOfObjects.items.splice(i,1);
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
GetRecord(event:string){
  // get object in Google Storage
  this.scroller.scrollToAnchor('theTop');
  this.OpenDialogue[this.prev_Dialogue]=false;
  var i=0;
  var j=0;
  var k=0;
  var l=0;
 var ObjectName='';
  if (event==='data'){  
      i=0;  
      ObjectName=this.Google_Object_Name;
      this.error_msg='Access to file "' + this.Google_Object_Name +'" is on-going';
      this.ObjectIsRetrieved=false;
    } 
  else {
    ObjectName=this.Google_Object_Fitness;
        i=1;
      }
  this.EventHTTPReceived[i]=false;
  this.waitHTTP(this.TabLoop[i],30000,i);

  //this.Google_Object_Name='AFeb%2028%202023';

  this.ManageGoogleService.getContentObject(this.configServer, this.Google_Bucket_Name,ObjectName )
            .subscribe((data ) => {
                
               if (event==='data'){   
                  this.EventHTTPReceived[0]=true;            
                  var theFitness = new PerformanceFitness;
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
                  // this.NewPerformanceFitness=data;
                  this.LinkPerfConfig();
                  this.Input_Travel_O_R='O';
                  this.isSelectedDate=true;
                  this.ObjectIsRetrieved=true;
                  this.scroller.scrollToAnchor('theTop');
                  
                } else if (event==='config'){ 
                    this.EventHTTPReceived[1]=true;
                    this.theConfig=new ConfigFitness;
                    this.theConfig=data;
                    this.MyConfigFitness=new ConfigFitness;
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
                  }
                this.error_msg='';
                this.scroller.scrollToAnchor('AccessToListFiles');
              },
              error_handler => {
                if (event==='data'){
                      this.EventHTTPReceived[0]=true;
                      console.log('GetRecord() - error handler');
                      this.error_msg='INIT - error message==> ' + error_handler.message + ' error status==> '+ error_handler.statusText+'   name=> '+ error_handler.name + '   Error url==>  '+ error_handler.url;
                  } else if (event==='config'){
                      this.error_msg='';
                      this.ConfigExist=false;
                      this.EventHTTPReceived[1]=true;
                      this.MyConfigFitness=new ConfigFitness;
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
  
  for (i=0; i<this.ErrorinputDate.length && this.ErrorinputDate[i]===''; i++){
  }
  if (i===this.ErrorinputDate.length) {
    this.SpecificForm.controls['FileName'].setValue(this.Google_Object_Name);
    this.IsSaveConfirmed = true;
    this.error_msg='';
  } else {this.error_msg='correct your error';}
}


SaveNewRecord(){
  // create object in Google Storage

  this.IsSaveConfirmed = false;
  this.message='';
  this.Google_Object_Name = this.SpecificForm.controls['FileName'].value ;
  if (this.Google_Object_Name===''){
    this.Google_Object_Name = 'NoNameFile';
  }
  var file=new File ([JSON.stringify(this.NewPerformanceFitness)],this.Google_Object_Name, {type: 'application/json'});

  this.ManageGoogleService.uploadObject(this.configServer, this.Google_Bucket_Name, file )
  //this.http.post(this.HTTP_Address,  this.Table_User_Data[this.identification.id] , {'headers':this.myHeader} )
  .subscribe(res => {
    //**this.LogMsgConsole('Individual Record is updated: '+ this.Table_User_Data[this.identification.id].UserId );
            this.message='File "'+ this.Google_Object_Name +'" is successfully stored in the cloud';
            this.GetAllObjects();
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

SaveConfigFtiness(){
  this.isConfigConfirmed=false;

  var file=new File ([JSON.stringify(this.MyConfigFitness)],this.SpecificForm.controls['FileName'].value, {type: 'application/json'});
                    
  this.ManageGoogleService.uploadObject(this.configServer, this.Google_Bucket_Name, file )
  //this.http.post(this.HTTP_Address,  this.Table_User_Data[this.identification.id] , {'headers':this.myHeader} )
  .subscribe(res => {
    //**this.LogMsgConsole('Individual Record is updated: '+ this.Table_User_Data[this.identification.id].UserId );
            this.message='File "'+ this.SpecificForm.controls['FileName'].value +'" is successfully stored in the cloud';
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
  }

// this.scroller.scrollToAnchor('AccessToListFiles');
CancelSave(){
this.IsSaveConfirmed=false;
}

waitHTTP(loop:number, max_loop:number, eventNb:number){
  const pas=500;
  if (loop%pas === 0){
    console.log('waitHTTP ==> loop=', loop, ' max_loop=', max_loop);
  }
 loop++
  
  this.id_Animation[eventNb]=window.requestAnimationFrame(() => this.waitHTTP(loop, max_loop, eventNb));
  if (loop>max_loop || this.EventHTTPReceived[eventNb]===true ){
            console.log('exit waitHTTP ==> loop=', loop + ' max_loop=', max_loop + ' this.EventHTTPReceived=' + 
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
          this.GetRecord('data');
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

FillTabWeight(){ // **** NOT USED *****
  const max_lbs=140;
  var j=0;
  var i=0;
  this.RefFormatWeight.lbsnb=8;
  this.RefFormatWeight.kgnb=this.RefFormatWeight.lbsnb*this.lbs_kg;
  this.TheWeights[0]=this.RefFormatWeight;
  for (i=10 ; i<max_lbs; i=i+10){
      j=j+1;
      this.RefFormatWeight=new FormatWeight;
      this.TheWeights.push(this.RefFormatWeight);
      this.RefFormatWeight.lbsnb=i;
      this.RefFormatWeight.kgnb=this.RefFormatWeight.lbsnb*this.lbs_kg;
      this.TheWeights[j]=this.RefFormatWeight;
    }
  }
}

