import { Component, OnInit , Input, Output, HostListener,  HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, 
   AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID, ChangeDetectorRef} from '@angular/core';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatIconModule} from '@angular/material/icon';
import { MatDialogModule} from '@angular/material/dialog';
import { CommonModule,  DatePipe, formatDate, ViewportScroller } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormGroup,UntypedFormControl, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';

import { BucketList , Bucket_List_Info, OneBucketInfo} from '../../JsonServerClass';


// configServer is needed to use ManageGoogleService
// it is stored in MongoDB and accessed via ManageMongoDBService
import { configServer, LoginIdentif } from '../../JsonServerClass';

import { environment } from '../../../environments/environment';
import {manage_input} from '../../manageinput';
import {eventoutput, thedateformat} from '../../apt_code_name';

import { ManageMongoDBService } from '../../CloudServices/ManageMongoDB.service';
import { ManageGoogleService } from '../../CloudServices/ManageGoogle.service';

import {classPosDiv, getPosDiv} from '../../getPosDiv';

import {ConfigFitness, ConfigSport, PerformanceFitness, ClassSport, ClassResult, ClassActivity, ClassExercise} from '../ClassFitness';
import {BigData, CreturnedData, CmyEvent, Ctarget} from '../ClassFitness';
import { findIds } from '../../MyStdFunctions';

@Component({
  selector: "app-fitness-config",
  styleUrl: "./fitness-config.css",
  templateUrl: "./fitness-config.html",
  standalone:true,
  imports:[CommonModule, FormsModule, ReactiveFormsModule, MatIconModule ],
  providers:[DatePipe]
})

export class FitnessConfig {

constructor(   
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageMongoDBService: ManageMongoDBService,
    private ManageGoogleService: ManageGoogleService,
     private cdr: ChangeDetectorRef,
    private datePipe: DatePipe,
    @Inject(LOCALE_ID) private locale: string,
    //private TheConfig: AccessConfigService,
   ) {}

@Input() configServer = new configServer;
@Input() isConfigServerRetrieved:boolean=false;
@Input() MyConfigFitness = new ConfigFitness;
@Input() Google_Object_Fitness:string='';

@Output() returnFile= new EventEmitter<any>();

myEvent=new CmyEvent;
EventHTTPSave:boolean=false;

theConfig=new ConfigFitness;

isDisplayConfig=signal<boolean>(false);
NewconfigServer=new configServer;


Google_Bucket_Name:string='xav_fitness'; 


SpecificForm=new FormGroup({
  FileName: new FormControl('', { nonNullable: true }),
})

kg_lbs:number=2.20462;
lbs_kg:number=0.453592;

TabPerfConfig:Array<number>=[];

ConfigExist:boolean=false;
isConfigConfirmed:boolean=false;

prev_Dialogue:number=0;
OpenDialogue:Array<boolean>=[];
isOpenDialogue=signal<boolean>(false);

TabOfId:Array<any>=[];
nbToDisplay:number=0;

idText:string='';

getScreenWidth: any;
getScreenHeight: any;
device_type:string='';
refMedia:number=1010;

error_msg:string="";
message:string="";

ngOnInit(){
  if (this.isConfigServerRetrieved===true){
    this.isDisplayConfig.set(true);
  }
  this.SpecificForm.controls["FileName"].setValue(this.Google_Object_Fitness);
}

onInputList(event:any){
  // This is only used for myConfigFitness
  
  this.OpenDialogue[this.prev_Dialogue]=false;
  if (this.isOpenDialogue()){
    this.isOpenDialogue.set(false);
  }
  this.manageIds(event.target.id);
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
    if (this.isOpenDialogue()){
      this.isOpenDialogue.set(false);
    }
    this.manageIds(event.target.id);
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
  if (this.isOpenDialogue()){
    this.isOpenDialogue.set(false);
  }
  this.manageIds(event.target.id);
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
cancelDropDown(){
  this.OpenDialogue[this.prev_Dialogue]=false;
  if (this.isOpenDialogue()){
    this.isOpenDialogue.set(false);
  }
}

theArrow(event:any){
  this.OpenDialogue[this.prev_Dialogue]=false;
  if (this.isOpenDialogue()){
    this.isOpenDialogue.set(false);
  }
  this.manageIds(event.target.id);
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
  this.isOpenDialogue.set(true);
  this.myEvent.dialogueNb=this.prev_Dialogue;
  //this.cdr.detectChanges();
}


onArrow(event:any){
  this.OpenDialogue[this.prev_Dialogue]=false;
  if (this.isOpenDialogue()){
    this.isOpenDialogue.set(false);
  }
  this.manageIds(event.target.id);
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
  this.isOpenDialogue.set(true);
  //this.cdr.detectChanges();
}

// Add and Delete items related to ConfigFitness
addConfig(event:any){
  this.OpenDialogue[this.prev_Dialogue]=false;
  if (this.isOpenDialogue()){
    this.isOpenDialogue.set(false);
  }
  this.manageIds(event.target.id);
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
  if (this.isOpenDialogue()){
    this.isOpenDialogue.set(false);
  }
  this.manageIds(event.target.id);
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
  if (this.isOpenDialogue()){
    this.isOpenDialogue.set(false);
  }
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
  if (this.isOpenDialogue()){
    this.isOpenDialogue.set(false);
  }
  this.manageIds(event.target.id);
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

ConfirmConfig(){
this.isConfigConfirmed=true;
this.SpecificForm.controls['FileName'].setValue(this.Google_Object_Fitness);
}

CancelConfig(){
  this.isConfigConfirmed=false;
}

SaveConfigFtiness(){
  this.isConfigConfirmed=false;
  this.EventHTTPSave=false;
  var file=new File ([JSON.stringify(this.MyConfigFitness)],this.SpecificForm.controls['FileName'].value, {type: 'application/json'});
                    
  this.ManageGoogleService.uploadObject(this.configServer, this.Google_Bucket_Name, file , this.SpecificForm.controls['FileName'].value)
  //this.http.post(this.HTTP_Address,  this.Table_User_Data[this.identification.id] , {'headers':this.myHeader} )
  .subscribe(res => {
    //**this.LogMsgConsole('Individual Record is updated: '+ this.Table_User_Data[this.identification.id].UserId );
          if (res.type===4){
            this.message='File "'+ this.SpecificForm.controls['FileName'].value +'" is successfully stored in the cloud';
            /*
            if (this.EventHTTPSave===false){
              this.returnFile.emit(this.MyConfigFitness);
            } 
            this.EventHTTPSave=true;
            */
          }
        },
        error_handler => {
          //**this.LogMsgConsole('Individual Record is not updated: '+ this.Table_User_Data[this.identification.id].UserId );
          this.message='File' + this.SpecificForm.controls['FileName'].value +' *** Save action failed - status is '+error_handler.status;
        } 
      )
}


manageIds(theId:string){
  this.error_msg='';
  this.TabOfId.splice(0,this.TabOfId.length);
  const theValue= findIds(theId,"-");
  
  for (var i=0; i<theValue.tabOfId.length; i++){
    this.TabOfId[i]=theValue.tabOfId[i];
  }
  this.idText=theValue.strFound;
}
/*
 ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
            const j = changes[propName];
            if (propName === 'MyConfigFitness' && changes[propName].firstChange === false){
              if (this.isConfigServerRetrieved===true){
                    this.isDisplayConfig.set(true);
              }
            } else if (propName === 'MyConfigFitness' && changes[propName].firstChange === false){
              if (this.isConfigServerRetrieved===true){
                    this.isDisplayConfig.set(true);
              }
            }
    }
 }
*/
}
