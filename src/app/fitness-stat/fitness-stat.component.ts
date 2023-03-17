import { Component, OnInit , Input, Output, HostListener,  ChangeDetectionStrategy, 
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

import { ManageMangoDBService } from 'src/app/Services/ManageMangoDB.service';
import { ManageGoogleService } from 'src/app/Services/ManageGoogle.service';
import {AccessConfigService} from 'src/app/Services/access-config.service';

export class RefFormPerf{
  ref_body: number=1;
  weight_type:number=1; 
  select_session:Array<number>=[0,0,0,0,0,0,0,0,0,0]
};

export class ConfigFitness{
  user_id: number=0;
  firstname:string='';
  lastname:string='';
  Activity:Array<any>=[
      {
      Activity_name:'', // workout, running, etc.
      Activity_date: new Date(),
      exercise:[{
        Body_name:'', // part of the body: shoulder, leg, type of running exercise such as fraction
        BodyExercise:
              [{
                Exercise_name:'', // 20kg, 20s
                      seance:[{nb:0}]
              }]
            }]
          }]
      }
    

export class ClassActivity{
  Activity_name:string=''; // workout, running, etc.
  Activity_date= new Date();
  exercise:Array<any>=[{
    Body_name:'', // part of the body: shoulder, leg, type of running exercise such as fraction
    BodyExercise:
          [{
            Exercise_name:'', // 20kg, 20s
                  seance:[{nb:0}]
          }]
        }]
      
      }

export class ClassBody{
  Body_name:string=''; // part of the body: shoulder, leg, type of running exercise such as fraction
  BodyExercise:Array<any>=
        [{
          Exercise_name:'', // 20kg, 20s
                seance:[{nb:0}]
        }]
}

export class ClassExercise{
        Exercise_name:string=''; // 20kg, 20s
        seance:Array<any>=[{nb:0}]
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

NewConfigFitness=new ConfigFitness;

HTTP_Address:string='';
HTTP_AddressPOST:string='';
Google_Bucket_Access_Root:string='https://storage.googleapis.com/storage/v1/b/';
Google_Bucket_Access_RootPOST:string='https://storage.googleapis.com/upload/storage/v1/b/';

Google_Bucket_Name:string='xav_fitness'; 
Google_Object_Name:string='';

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

List_exercise:Array<string>=[
'legs', 'shoulders', 'chest', 'biceps', 'triceps (pull)', 'triceps (behind head)','push-up'
]

selectedIndex:number=0;

getScreenWidth: any;
getScreenHeight: any;
device_type:string='';

ClassActiv = new ClassActivity;
ClassBod= new ClassBody;
ClassExec= new ClassExercise;

DisplayCalendar:boolean=true;
ObjectIsRetrieved:boolean=false;
ConfigExist:boolean=false;
Draw_Line:string='-';
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

@HostListener('window:resize', ['$event'])
onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;
    this.Draw_Line='-'.repeat(this.getScreenWidth*0.8);
  }


ngOnInit(){
  this.getScreenWidth = window.innerWidth;
  this.getScreenHeight = window.innerHeight;
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
  
  this.NewConfigFitness.firstname=this.identification.firstname;
  this.NewConfigFitness.lastname=this.identification.surname;
  this.NewConfigFitness.user_id=this.identification.id;
  this.NewConfigFitness.Activity[0].Activity_name='';
  this.datePipeSelected = this.datePipe.transform(this.todayDate,"dd-MM-yyyy");
  this.NewConfigFitness.Activity[0].Activity_date=this.datePipeSelected;
  this.NewConfigFitness.Activity[0].exercise[0].Body_name='';
  this.NewConfigFitness.Activity[0].exercise[0].BodyExercise[0].Exercise_name='';
  this.NewConfigFitness.Activity[0].exercise[0].BodyExercise[0].seance[0].nb=0;
  this.TabinputDate[0]=this.datePipeSelected;
  this.ErrorinputDate[0]='';
  this.TabIsDateWrong[0]=true;

  
  if (this.configServer.GoogleProjectId===''){
    this.RetrieveConfig();
  } else{
    if (this.identification.ownBuckets!== undefined && this.identification.ownBuckets.length>0){
      this.Google_Bucket_Name=this.identification.ownBuckets[0].name;
  
    }
    this.GetAllObjects();
    this.isConfigServerRetrieved=true;
  
    this.Google_Bucket_Name="Config"+this.identification.id+'-'+this.identification.UserId;
    this.GetRecord('config');
  }
  
  // weights to be selected by user when exercising
  this.FillTabWeight();
  this.scroller.scrollToAnchor('targetTop');
  }


onInput(event:any){
    
    this.findIds(event.target.id);
    //event.target.value;
    if (event.target.id.substring(0,4)==='Acti'){
      this.NewConfigFitness.Activity[this.TabOfId[0]].Activity_name=event.target.value;
    } else  if (event.target.id.substring(0,4)==='Body'){
      this.NewConfigFitness.Activity[this.TabOfId[0]].exercise[this.TabOfId[1]].Body_name=event.target.value;
    } else if (event.target.id.substring(0,4)==='Exec'){
      this.NewConfigFitness.Activity[this.TabOfId[0]].exercise[this.TabOfId[1]].BodyExercise[this.TabOfId[2]].Exercise_name=event.target.value;
    } else  if (event.target.id.substring(0,4)==='Sean'){
      this.NewConfigFitness.Activity[this.TabOfId[0]].exercise[this.TabOfId[1]].BodyExercise[this.TabOfId[2]].seance[this.TabOfId[3]].nb=event.target.value;
    }

  }

CheckDate(event:any){
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
      this.NewConfigFitness.Activity[id].Activity_date=this.datePipeSelected;
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

addItem(event:any){

  this.findIds(event.target.id);

  if (event.target.id.substring(0,4)==='Acti'){
    this.ClassActiv = new ClassActivity;
    this.NewConfigFitness.Activity.push(this.ClassActiv);
    this.NewConfigFitness.Activity[this.NewConfigFitness.Activity.length-1].Activity_name='';
    this.datePipeSelected = this.datePipe.transform(this.todayDate,"dd-MM-yyyy");
    this.NewConfigFitness.Activity[this.NewConfigFitness.Activity.length-1].Activity_date=this.datePipeSelected;
    this.TabinputDate[this.NewConfigFitness.Activity.length-1]=this.datePipeSelected;
    this.TabIsDateWrong[this.NewConfigFitness.Activity.length-1]=false;

    this.NewConfigFitness.Activity[this.NewConfigFitness.Activity.length-1].exercise[0].Body_name='';
    this.NewConfigFitness.Activity[this.NewConfigFitness.Activity.length-1].exercise[0].BodyExercise[0].Exercise_name='';
    this.NewConfigFitness.Activity[this.NewConfigFitness.Activity.length-1].exercise[0].BodyExercise[0].seance[0].nb=0;




  } else  if (event.target.id.substring(0,4)==='Body'){
        this.ClassBod= new ClassBody;
        this.NewConfigFitness.Activity[this.TabOfId[0]].exercise.push(this.ClassBod);
        const j=this.NewConfigFitness.Activity[this.TabOfId[0]].exercise.length;
        this.NewConfigFitness.Activity[this.TabOfId[0]].exercise[j-1].Body_name='';
  }  else  if (event.target.id.substring(0,4)==='Exec'){
    this.ClassExec= new ClassExercise;
    this.NewConfigFitness.Activity[this.TabOfId[0]].exercise[this.TabOfId[1]].BodyExercise.push(this.ClassExec);
    const k=this.NewConfigFitness.Activity[this.TabOfId[0]].exercise[this.TabOfId[1]].BodyExercise.length;
    this.NewConfigFitness.Activity[this.TabOfId[0]].exercise[this.TabOfId[1]].BodyExercise[k-1].Exercise_name='';
  } else  if (event.target.id.substring(0,4)==='Sean'){
        this.NewConfigFitness.Activity[this.TabOfId[0]].exercise[this.TabOfId[1]].BodyExercise[this.TabOfId[2]].seance.push({nb:0});
        const l=this.NewConfigFitness.Activity[this.TabOfId[0]].exercise[this.TabOfId[1]].BodyExercise[this.TabOfId[2]].seance.length;
        this.NewConfigFitness.Activity[this.TabOfId[0]].exercise[this.TabOfId[1]].BodyExercise[this.TabOfId[2]].seance[l-1].nb=0;
      }
}

delItem(event:any){
  this.findIds(event.target.id);

  if (event.target.id.substring(0,4)==='Acti'){
    this.NewConfigFitness.Activity.splice(this.TabOfId[0],1);
  } else  if (event.target.id.substring(0,4)==='Body'){
        this.NewConfigFitness.Activity[this.TabOfId[0]].exercise.splice(this.TabOfId[1],1);
  }  else  if (event.target.id.substring(0,4)==='Exec'){
      this.NewConfigFitness.Activity[this.TabOfId[0]].exercise[this.TabOfId[1]].BodyExercise.splice(this.TabOfId[2],1);
  } else  if (event.target.id.substring(0,4)==='Sean'){
        this.NewConfigFitness.Activity[this.TabOfId[0]].exercise[this.TabOfId[1]].BodyExercise[this.TabOfId[2]].seance.splice(this.TabOfId[3],1);
      }

}


findIds(theId:string){
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
  this.TabOfId.push(0);
  i++;
}
}

CreateRecord(){
  this.ObjectIsRetrieved=true; // also applies if no object file was retrieved. Creation from scratch
  this.message='';
  this.error_msg='';
  if (this.isSelectedDate===false){
    this.SelectedDate(this.todayDate);
  }
}

ConfirmSave(){
  var i=0;
  
  for (i=0; i<this.ErrorinputDate.length && this.ErrorinputDate[i]===''; i++){
  }
  if (i===this.ErrorinputDate.length) {
    this.IsSaveConfirmed = true;
    this.error_msg='';
  } else {this.error_msg='correct your error';}
}


SaveNewRecord(){
  // create object in Google Storage
  this.IsSaveConfirmed = false;

  this.message='';
  
  this.Google_Object_Name = this.SpecificForm.controls['FileName'].value ;
  
  var file=new File ([JSON.stringify(this.NewConfigFitness)],this.Google_Object_Name, {type: 'application/json'});
  
  this.ManageGoogleService.uploadObject(this.configServer, this.Google_Bucket_Name, file )
  //this.http.post(this.HTTP_Address,  this.Table_User_Data[this.identification.id] , {'headers':this.myHeader} )
  .subscribe(res => {
    //**this.LogMsgConsole('Individual Record is updated: '+ this.Table_User_Data[this.identification.id].UserId );
            this.message='File "'+ this.Google_Object_Name +'" is successfully stored in the cloud';
        },
        error_handler => {
          //**this.LogMsgConsole('Individual Record is not updated: '+ this.Table_User_Data[this.identification.id].UserId );
          this.message='File' + this.Google_Object_Name +' *** Save action failed - status is '+error_handler.status;
        } 
      )
  
  }

GetAllObjects(){
  // bucket name is ListOfObject.config
  this.error_msg='';
  this.HTTP_Address=this.Google_Bucket_Access_Root+ this.Google_Bucket_Name + "/o"  ;
  console.log('RetrieveAllObjects()'+this.Google_Bucket_Name);
  this.http.get<Bucket_List_Info>(this.HTTP_Address )
          .subscribe((data ) => {
            console.log('RetrieveAllObjects() - data received');
            this.myListOfObjects=data;
            this.DisplayListOfObjects=true;
            this.scroller.scrollToAnchor('targetTopObjects');
          },
          error_handler => {
            
            console.log('RetrieveAllObjects() - error handler; HTTP='+this.HTTP_Address);
            this.error_msg='HTTP_Address='+this.HTTP_Address;
            this.Error_Access_Server='RetrieveAllObjects()==> ' + error_handler.message + ' error status==> '+ error_handler.statusText+'   name=> '+ error_handler.name + '   Error url==>  '+ error_handler.url;
          } 
    )
}

GetRecord(event:string){
  // get object in Google Storage
  var i=0;
 
  if (event==='data'){  
      i=0;  
      this.error_msg='Access to file "' + this.Google_Object_Name +'" is on-going';
      this.ObjectIsRetrieved=false;
    } 
  else {
        i=1;
      }
  this.EventHTTPReceived[i]=false;
  this.waitHTTP(this.TabLoop[i],30000,i);

  var jWeight=0;
  //this.Google_Object_Name='AFeb%2028%202023';

  this.ManageGoogleService.getContentObject(this.configServer, this.Google_Bucket_Name,this.Google_Object_Name )
            .subscribe((data ) => {
                
               if (event==='data'){   
                this.EventHTTPReceived[0]=true;            
                  this.NewConfigFitness= new ConfigFitness;
                  this.NewConfigFitness=data;

                  this.Input_Travel_O_R='O';
                  this.isSelectedDate=true;
                  this.ObjectIsRetrieved=true;
                  
                } else if (event==='config'){ 
                    this.EventHTTPReceived[1]=true;
                    this.ConfigExist=true;
                  }
                this.error_msg='';
              },
              error_handler => {
                if (event==='data'){
                  this.EventHTTPReceived[0]=true;
                  this.EventHTTPReceived[i]=true;
                  console.log('GetRecord() - error handler');
                  this.error_msg='INIT - error message==> ' + error_handler.message + ' error status==> '+ error_handler.statusText+'   name=> '+ error_handler.name + '   Error url==>  '+ error_handler.url;
                } else if (event==='config'){
                  this.error_msg=''
                  this.ConfigExist=false;
                  this.EventHTTPReceived[1]=true;
                }   
            
            } 
            
      )
  }

CancelRecord(){
    this.NewConfigFitness.Activity.splice(1,this.NewConfigFitness.Activity.length);
    this.NewConfigFitness.Activity[0].exercise.splice(1,this.NewConfigFitness.Activity[0].exercise.length);
    this.NewConfigFitness.Activity[0].exercise[0].BodyExercise.splice(1,this.NewConfigFitness.Activity[0].exercise[0].BodyExercise.length);
    this.NewConfigFitness.Activity[0].exercise[0].BodyExercise[0].seance.splice(1,this.NewConfigFitness.Activity[0].exercise[0].BodyExercise[0].seance.length)
  
    this.NewConfigFitness.Activity[0].Activity_name='';
    this.NewConfigFitness.Activity[0].Activity_date='';
    this.NewConfigFitness.Activity[0].exercise[0].Body_name='';
    this.NewConfigFitness.Activity[0].exercise[0].BodyExercise[0].Exercise_name='';
    this.NewConfigFitness.Activity[0].exercise[0].BodyExercise[0].seance[0].nb=0;
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
       // test if data is an array if (Array.isArray(data)===true){}
       //     this.configServer=data[0];
     
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
      //
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
      this.NewConfigFitness.Activity[theID].Activity_date=this.datePipeSelected;
      this.TabinputDate[theID]=this.datePipeSelected;
      this.ErrorinputDate[theID]='';
      this.TabIsDateWrong[theID]=false;
      this.isSelectedDate=true;
  } else {
      for (i=0; i<this.ErrorinputDate.length; i++){
        if (this.Error_OpenCalendar===this.ErrorinputDate[i]){
          this.ErrorinputDate[i]='';
        }
      }
  }
  this.TabDisplayCalendar[theID]=false; 
}


Error_OpenCalendar:string='close the calendar which is already open for another activity';
ActionCalendar(event:any){
  var i=0;
  var SaveTabOfId:Array<number>=[];

  for (i=0; (this.TabDisplayCalendar[i]===false || this.TabDisplayCalendar[i]=== undefined) && i<this.TabDisplayCalendar.length; i++){};
  if (this.TabDisplayCalendar.length===0 || i>this.TabDisplayCalendar.length-1 || this.TabDisplayCalendar[i]===false){
      this.findIds(event.target.id);
      this.TabDisplayCalendar[this.TabOfId[0]]=true;
      this.TabDisplayId[this.TabOfId[0]]=this.TabOfId[0];
      this.DisplayCalendar=true;
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

FillTabWeight(){
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

