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

import { ManageMangoDBService } from 'src/app/Services/ManageMangoDB.service';
import { ManageGoogleService } from 'src/app/Services/ManageGoogle.service';
import {AccessConfigService} from 'src/app/Services/access-config.service';

//import * as moment from 'moment';
//import 'moment/locale/pt-br';
// manage one Calendar

export class RefFormPerf{
  ref_body: number=1;
  weight_type:number=1; 
  select_session:Array<number>=[0,0,0,0,0,0,0,0,0,0]
};

@Component({
  selector: 'app-fitness-stat',
  templateUrl: './fitness-stat.component.html',
  styleUrls: ['./fitness-stat.component.css'],
})
export class FitnessStatComponent implements OnInit {
  TheExerciseform:FormGroup; 

  Performanceform:FormGroup; 
  constructor(   
    private fb: FormBuilder,
    private router:Router,
    private http: HttpClient,
    private scroller: ViewportScroller,
    private ManageMangoDBService: ManageMangoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    @Inject(LOCALE_ID) private locale: string,
    //private TheConfig: AccessConfigService,
   ) { this.Performanceform = this.fb.group({ 
              select_weight: this.fb.array([
              ]),
        })

        this.TheExerciseform = this.fb.group({ 
          date_exercise: new FormControl(),
          select_body: this.fb.array([
          ]),
        });
      }

get TypeExerciseData(){
      return this.TheExerciseform.controls["select_body"] as FormArray; 
  }

get PerformanceData(){
      return this.Performanceform.controls["select_weight"] as FormArray; 
  }

FormExercice():FormGroup {
    return this.fb.group ({
            body:'AZ', 
            ref_body: 1
    })
  }

FormPerformance():FormGroup {
    return this.fb.group ({
          ref_body: 1,
          weight_type:1, 
          select_session: this.fb.array([new FormControl(0), new FormControl(0), new FormControl(0), new FormControl(0),
            new FormControl(0), new FormControl(0), new FormControl(0), new FormControl(0), new FormControl(0),
            new FormControl(0)
          ])
    })
  }

@Input() XMVConfig=new XMVConfig;
@Input() configServer = new configServer;

IsTestBoolean:boolean=true;

FillFormBody={
    body:'',
    ref_body:1
   };

FillFormPerf=new RefFormPerf;

IsSaveConfirmed:boolean=false;
SpecificForm=new FormGroup({
  FileName: new FormControl(''),
})

NewconfigServer=new configServer;
isConfigServerRetrieved:boolean=false;
NewXMVConfig=new XMVConfig;

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
myDate:string='';
myTime=new Date();
thetime:string='';

Error_Access_Server:string='';
message:string='';
error_msg: string='';

EventHTTPReceived:Array<boolean>=[false,false,false,false,false,false];
id_Animation:Array<number>=[0,0,0,0,0];
TabLoop:Array<number>=[0,0,0,0,0];
  
selected_date=new Date();
isSelectedDate:boolean=false;
selected_year:number=0;
selected_month:number=0;
selected_day:number=0;

// PARAMETERS
Input_MinDate=new Date(1900,0,1); // month is always -1 as start for occurrence 0
Input_MaxDate=new Date();
Input_Travel_O_R:string='';

TheWeights:Array<FormatWeight>=[]; // can come from Google Storage
RefFormatWeight=new FormatWeight;

kg_lbs:number=2.20462;
lbs_kg:number=0.453592;

List_exercise:Array<string>=[
'legs', 'shoulders', 'chest', 'biceps', 'triceps (pull)', 'triceps (behind head)','push-up'
]

selectedIndex:number=0;

NewWeight=  new ArrayNewWeight;

NewBody= new ArrayNewBody;

ResultFitness=new Fitness;

i:number=0;
j:number=0;

getScreenWidth: any;
getScreenHeight: any;
device_type:string='';


DisplayCalendar:boolean=true;
ObjectIsRetrieved:boolean=false;
todayDate=new Date();

Draw_Line:string='-';


RemoveTypeExercise(event:any){
  var refer_body=parseInt(event.target.id.substring(1))+1;
  var iBody=1;
  for (iBody=this.PerformanceData.length; iBody>0; iBody--){
    if (this.PerformanceData.controls[iBody-1].value.ref_body===refer_body){

      this.PerformanceData.removeAt(iBody-1);
    } else if (this.PerformanceData.controls[iBody-1].value.ref_body>refer_body){

      this.FillFormPerf=new RefFormPerf;
      this.FillFormPerf=this.PerformanceData.controls[iBody-1].value;
      this.FillFormPerf.ref_body--;
      this.PerformanceData.controls[iBody-1].setValue(this.FillFormPerf);
    }
  }
  for (iBody=this.TypeExerciseData.length; iBody>0; iBody--){
    if (this.TypeExerciseData.controls[iBody-1].value.ref_body===refer_body){
      this.TypeExerciseData.removeAt(iBody-1);
    } else if (this.TypeExerciseData.controls[iBody-1].value.ref_body>refer_body){
      this.FillFormBody=this.TypeExerciseData.controls[iBody-1].value;
      this.FillFormBody.ref_body--;
      this.TypeExerciseData.controls[iBody-1].setValue(this.FillFormBody);
    }
  }
}

RemoveWeight(event:any){
  const RecordWeight=parseInt(event.target.id.substring(1));
  this.PerformanceData.removeAt(RecordWeight);
}

@HostListener('window:resize', ['$event'])
onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;
    this.Draw_Line='-'.repeat(this.getScreenWidth*0.8);
  }


ngOnInit(){
this.getScreenWidth = window.innerWidth;
this.getScreenHeight = window.innerHeight;
if (this.configServer.GoogleProjectId===''){
  this.RetrieveConfig();
} else{
  this.GetAllObjects();
  // this.GetRecord();
  this.isConfigServerRetrieved=true;
}

// weights to be selected by user when exercising
this.FillTabWeight();
this.scroller.scrollToAnchor('targetTop');
}

CreateRecord(){
  this.ObjectIsRetrieved=true; // also applies if no object file was retrieved. Creation from scratch
  this.message='';
  this.error_msg='';
  if (this.isSelectedDate===false){
    this.SelectedDate(this.todayDate);
  }
}

LogWeight(event:any){
  var iBody=0;
  this.message='';
  if (event.target.value!==''){
      const theBodyRef=parseInt(event.target.id.substring(1));
      this.FillFormPerf=new RefFormPerf;
      this.FillFormPerf.ref_body=parseInt(event.target.id.substring(1)); // lbs
      this.FillFormPerf.weight_type=event.target.value; // lbs
      for (this.i=0; this.i<10; this.i++){
        this.FillFormPerf.select_session[this.i]=0;
      }
      this.PerformanceData.push(this.FormPerformance());
      this.PerformanceData.controls[this.PerformanceData.length-1].setValue(this.FillFormPerf); 
  }  
}

LogExercise(event:any){

  this.message='';
  if (event.target.value!==''){
    this.selectedIndex=event.target.selectedIndex-1;
  }

  this.FillFormBody.ref_body=this.TypeExerciseData.length+1;
  this.FillFormBody.body=event.target.value;
  this.TypeExerciseData.push(this.FormExercice());
  this.TypeExerciseData.controls[this.TypeExerciseData.length-1].setValue(this.FillFormBody);
}

LogSession(event:any){ // NOT NEEDED ANYMORE
  // purpose is just to store what has been modified
  // format of id is RnSn
  // find position of S
  if (isNaN(event.target.value)){
    this.message='Please enter a numeric value';
  } else {
    this.message='';
    
    const S_Pos = event.target.id.indexOf('S');
    const Record=parseInt(event.target.id.substring(1,S_Pos));
    const Session=parseInt(event.target.id.substring(S_Pos+1));

   
    if ((event.target.value)!==''){
      //this.ArrayFillFormPerf[Record].select_session[Session]=parseInt(event.target.value);
    } else {
      
      //this.ArrayFillFormPerf[Record].select_session[Session]=0;
    }
  }
}

ConfirmSave(){
    this.IsSaveConfirmed = true;
}

SaveRecord(){
// create object in Google Storage
this.IsSaveConfirmed = false;
const FileToSave=this.SpecificForm.controls['FileName'].value ;
this.message='';

// transfer from FormGroup to record to save
this.FormToRecord();

this.myTime=new Date();
this.myDate= this.myTime.toString().substring(4,15);
this.thetime=this.myDate+this.myTime.getTime();

this.Google_Object_Name = FileToSave;

var file=new File ([JSON.stringify(this.ResultFitness)],this.Google_Object_Name, {type: 'application/json'});

this.ManageGoogleService.uploadObject(this.configServer, this.Google_Bucket_Name, file )
//this.http.post(this.HTTP_Address,  this.Table_User_Data[this.identification.id] , {'headers':this.myHeader} )
.subscribe(res => {
  //**this.LogMsgConsole('Individual Record is updated: '+ this.Table_User_Data[this.identification.id].UserId );
          this.message='File "'+ FileToSave +'" is successfully stored in the cloud';
      },
      error_handler => {
        //**this.LogMsgConsole('Individual Record is not updated: '+ this.Table_User_Data[this.identification.id].UserId );
        this.message='Save action failed - status is '+error_handler.status;
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

GetRecord(){
  // get object in Google Storage
  this.error_msg='Access to file "' + this.Google_Object_Name +'" is on-going';
  this.EventHTTPReceived[0]=false;
  this.waitHTTP(this.TabLoop[0],30000,0);
  this.ObjectIsRetrieved=false;
  var jWeight=0;
  //this.Google_Object_Name='AFeb%2028%202023';

  this.ManageGoogleService.getContentObject(this.configServer, this.Google_Bucket_Name,this.Google_Object_Name )
            .subscribe((data ) => {
                this.EventHTTPReceived[0]=true;
               
                this.ResultFitness.body.splice(0,this.ResultFitness.body.length);
                for (jWeight=this.PerformanceData.length; this.PerformanceData.length>0; jWeight--){
                    this.PerformanceData.removeAt(jWeight-1);
                }
                for (jWeight=this.TypeExerciseData.length; this.TypeExerciseData.length>0; jWeight--){
                  this.TypeExerciseData.removeAt(jWeight-1);
              }
                this.ResultFitness=data;
                this.selected_date=this.ResultFitness.date_exercise;
                this.Input_Travel_O_R='O';
                this.isSelectedDate=true;
                this.RecordToForm();
                this.ObjectIsRetrieved=true;
                this.error_msg='';
            },
            error_handler => {
              this.EventHTTPReceived[0]=true;
              console.log('GetRecord() - error handler');
              this.error_msg='INIT - error message==> ' + error_handler.message + ' error status==> '+ error_handler.statusText+'   name=> '+ error_handler.name + '   Error url==>  '+ error_handler.url;
            } 
      )
  }

CancelRecord(){
  var jWeight=0;
  this.error_msg='';
  this.message='';
  //this.IsSaveConfirmed = false;
  this.selected_date=new Date("2000/01/01");
  this.ObjectIsRetrieved= false;
  this.DisplayListOfObjects=false;
  this.isSelectedDate=false;

  this.ResultFitness.body.splice(0,this.ResultFitness.body.length);
  for (jWeight=this.PerformanceData.length; this.PerformanceData.length>0; jWeight--){
      this.PerformanceData.removeAt(jWeight-1);
  }
  for (jWeight=this.TypeExerciseData.length; this.TypeExerciseData.length>0; jWeight--){
      this.TypeExerciseData.removeAt(jWeight-1);
 }
 this.GetAllObjects();
 this.scroller.scrollToAnchor('AccessToListFiles');
 this.Google_Object_Name='';
 this.SpecificForm.controls['FileName'].setValue('');
}

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
      // this.GetRecord();
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

      this.GetRecord();
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

  this.selected_year=parseInt(formatDate(event,'yyyy',this.locale));
  this.selected_month=parseInt(formatDate(event,'MM',this.locale));
  this.selected_day=parseInt(formatDate(event,'dd',this.locale));
  this.selected_date=event;
  this.Input_Travel_O_R='O';
  this.ResultFitness.date_exercise=this.selected_date;
  this.TheExerciseform.controls['date_exercise'].setValue(this.selected_date);
  this.isSelectedDate=true;
}


ActionCalendar(){
  this.DisplayCalendar=true;

}

FillTabWeight(){
  const max_lbs=140;
  this.j=0;
  this.RefFormatWeight.lbsnb=8;
  this.RefFormatWeight.kgnb=this.RefFormatWeight.lbsnb*this.lbs_kg;
  this.TheWeights[0]=this.RefFormatWeight;
  for (this.i=10 ; this.i<max_lbs; this.i=this.i+10){
    this.j=this.j+1;
    this.RefFormatWeight=new FormatWeight;
    this.TheWeights.push(this.RefFormatWeight);
    this.RefFormatWeight.lbsnb=this.i;
    this.RefFormatWeight.kgnb=this.RefFormatWeight.lbsnb*this.lbs_kg;
    this.TheWeights[this.j]=this.RefFormatWeight;
    }
  }

FormToRecord(){
  
  var k=0;
  var jRecord=0;
  var refer_body=0;
  var iBody=0;
  var jWeight=0;
  this.ResultFitness.body.splice(0,this.ResultFitness.body.length);
  this.ResultFitness.date_exercise=this.TheExerciseform.controls['date_exercise'].value

  for (iBody=0; iBody<this.TypeExerciseData.length; iBody++ ){
        this.FillFormBody=this.TypeExerciseData.controls[iBody].value;
        if (this.ResultFitness.body.length<iBody+1){
          this.NewBody= new ArrayNewBody;
          this.ResultFitness.body.push(this.NewBody);
        }
        this.ResultFitness.body[iBody].name = this.FillFormBody.body;
        refer_body= this.FillFormBody.ref_body;
        jRecord=0;
        for (jWeight=0; jWeight<this.PerformanceData.length; jWeight++){
         
          this.FillFormPerf=new RefFormPerf;
          this.FillFormPerf=this.PerformanceData.controls[jWeight].value;
          
          if (this.FillFormPerf.ref_body===refer_body){
              if (this.ResultFitness.body[iBody].exercise.length<jRecord+1){
                this.NewWeight=  new ArrayNewWeight;
                this.ResultFitness.body[iBody].exercise.push(this.NewWeight);
              }
              
              this.ResultFitness.body[iBody].exercise[jRecord].weight=this.FillFormPerf.weight_type;
                for (k=0; k<10; k++){
                  this.ResultFitness.body[iBody].exercise[jRecord].seances[k]=this.FillFormPerf.select_session[k];
                }
                jRecord++
            }

        }
        
  }
  

}

RecordToForm(){
 
  var k=0;
  var jRecord=0;
  var refer_body='';
  var iBody=0;
  var jWeight=0;


  this.TheExerciseform.controls['date_exercise'].setValue(this.ResultFitness.date_exercise);
  
  for (iBody=0; iBody<this.ResultFitness.body.length; iBody++ ){
       
        this.FillFormBody.ref_body=iBody+1;
        this.FillFormBody.body=this.ResultFitness.body[iBody].name;
        if (this.TypeExerciseData.length<iBody+1){
          this.TypeExerciseData.push(this.FormExercice());
        }
        this.TypeExerciseData.controls[this.TypeExerciseData.length-1].setValue(this.FillFormBody);
        refer_body= this.ResultFitness.body[iBody].name;
        jRecord=0;
        for (jWeight=0; jWeight<this.ResultFitness.body[iBody].exercise.length; jWeight++){
         // if (this.ResultFitness.body[iBody].name===refer_body){    
              this.FillFormPerf=new RefFormPerf;
              this.FillFormPerf.ref_body=iBody+1;    
              this.FillFormPerf.weight_type=this.ResultFitness.body[iBody].exercise[jWeight].weight;
              this.FillFormPerf.select_session=this.ResultFitness.body[iBody].exercise[jWeight].seances;
            
              this.PerformanceData.push(this.FormPerformance());
              this.PerformanceData.controls[this.PerformanceData.length-1].setValue(this.FillFormPerf);

              // }
       
          //  }
                jRecord++
            }

        }
        
  }

  
}

