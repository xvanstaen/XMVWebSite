import { Component, OnInit , Input, Output, HostListener,  OnDestroy, HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject} from '@angular/core';
  
import { DatePipe, formatDate } from '@angular/common'; 

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, UntypedFormControl,FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { Observable } from 'rxjs';

import {msginLogConsole} from '../../consoleLog'
import { configServer, LoginIdentif,  OneBucketInfo,  msgConsole, classCredentials, Bucket_List_Info } from '../../JsonServerClass';
import {classFileSport, classPointOfRef, classNewLoop, classCircuitRec, classFilePerf,classWorkCircuit, classTabPoR, classTotalLoop, classCountryPoR, classHeaderFileSport} from '../classSport';
import { findIds } from '../../MyStdFunctions';

import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { ManageMongoDBService } from 'src/app/CloudServices/ManageMongoDB.service';

@Component({
  selector: 'app-manage-point-of-ref',
  templateUrl: './manage-point-of-ref.component.html',
  styleUrls: ['./manage-point-of-ref.component.css']
})
export class ManagePointOfRefComponent {


  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageMongoDBService: ManageMongoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    ) { }

    @Output() newCredentials= new EventEmitter<any>();
    @Output() resetServer= new EventEmitter<any>();
    @Output() returnFile= new EventEmitter<any>();
    @Output() returnSelection= new EventEmitter<any>();
    @Output() returnSelCountry= new EventEmitter<any>();

    @Input() configServer = new configServer;
    @Input() identification= new LoginIdentif;
    @Input() isCircuitSelected:boolean=false;

    fileCountry:Array<any>=[];
    filePoR:Array<any>=[];
    iCountryPoR:number=-1;

    EventHTTPReceived:Array<boolean>=[];
    maxEventHTTPrequest:number=20;
    idAnimation:Array<number>=[];
    TabLoop:Array<number>=[];
    NbWaitHTTP:number=0;
  
    formOptions: FormGroup = new FormGroup({ 
      pointRef: new FormControl("", { nonNullable: true }),
      lat: new FormControl(0, { nonNullable: true }),
      lgt: new FormControl(0, { nonNullable: true }),
      fileName: new FormControl("", { nonNullable: true }),
      prio: new FormControl("", { nonNullable: true }),
      varLat: new FormControl(0, { nonNullable: true }),
      varLon: new FormControl(0, { nonNullable: true }),
    })

    istabPointOfRef:boolean=false;
    tabActionCountry=["Cancel","Add before","Add after","Delete","Zoom-in","Zoom-out"];
    tabAction=["Cancel","Add before","Add after","Modify","Delete"];
    tabDialog:Array<boolean>=[];  
    iDialog:number=-1;

    isDeleteRef:boolean=false;
    isUpdateRef:boolean=false;
    isAddRef:boolean=false;
    isFileModified:boolean=false;
    isDeleteCountry:boolean=false;

    TabOfId:Array<any>=[];
    strFound:string="";
   
    errorMsg:string="";


ngOnInit(){

  /*
  this.ManageGoogleService.insertCacheFile(this.configServer,this.configServer.PointOfRef.file)
  .subscribe((data ) => {  

    console.log('insertCacheFile ==> OK ' );
  },
  err => {
    console.log('error on insertCacheFile :'+ JSON.stringify(err));
  });
  */
  this.GetRecord(this.configServer.PointOfRef.bucket,this.configServer.PointOfRef.file,0);
  this.GetRecord(this.configServer.PointOfRef.bucket,"CountryISOPreferred.json",2);

}

resetBooleans(){
  this.tabDialog.splice(0,this.tabDialog.length);
  this.iDialog=-1;
  this.errorMsg="";
  this.isDeleteRef=false;
  this.isUpdateRef=false;
  this.isAddRef=false;
  this.isDeleteCountry=false;
}

resetAllBooleans(){
  this.TabOfId.splice(0,this.TabOfId.length);
  this.isDeleteRef=false;
  this.isUpdateRef=false;
  this.isAddRef=false;
  this.errorMsg="";
  this.isDeleteCountry=false;
  this.tabDialog.splice(0,this.tabDialog.length);
  this.iDialog=-1;
  
 }

 saveAction:string="";
 saveRecord:number=0;

onSelectPoR(event:any){
  this.TabOfId.splice(0,this.TabOfId.length);
  const theValue= findIds(event.target.id,"-");
  for (var i=0; i<theValue.tabOfId.length; i++){
      this.TabOfId[i]=theValue.tabOfId[i];
  }
  if (theValue.strFound==="Selection"){

    this.returnSelection.emit(this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]]);

  }
}

selCountry:Array<any>=[];
onActionCountry(event:any){

  this.resetBooleans();
  
  this.TabOfId.splice(0,this.TabOfId.length);
  const theValue= findIds(event.target.id,"-");
  
  for (var i=0; i<theValue.tabOfId.length; i++){
    this.TabOfId[i]=theValue.tabOfId[i];
  }

  //this.iDialog = 0;
  //this.tabDialog[this.iDialog]=true;
  if (!this.isCircuitSelected){
    if (theValue.strFound==="Country"){
      this.selCountry.splice(0,this.selCountry.length);
      for (var i=0; i<this.fileCountry.length; i++){
          if (this.fileCountry[i].country.toLowerCase().indexOf(event.target.value.toLowerCase())!==-1){
            this.selCountry.push({country:"",code:""});
            this.selCountry[this.selCountry.length-1].country=this.fileCountry[i].country;
            this.selCountry[this.selCountry.length-1].code=this.fileCountry[i].code;
          }
      }
      if (this.selCountry.length===0){
        this.filePoR[this.TabOfId[0]].country=event.target.value;
        this.isFileModified=true;
      }

    } else if (theValue.strFound==="Code"){
      this.selCountry.splice(0,this.selCountry.length);
      for (var i=0; i<this.fileCountry.length; i++){
        if (this.fileCountry[i].code.toLowerCase().indexOf(event.target.value.toLowerCase())!==-1){
          this.selCountry.push({country:"",code:""});
          this.selCountry[this.selCountry.length-1].country=this.fileCountry[i].country;
          this.selCountry[this.selCountry.length-1].code=this.fileCountry[i].code;
        }
      }
      if (this.selCountry.length===0){
        this.filePoR[this.TabOfId[0]].code=event.target.value;
        this.isFileModified=true;
      }
    }  else if (theValue.strFound==="selCountry"){

      this.filePoR[this.TabOfId[0]].country=this.selCountry[this.TabOfId[1]].country;
      this.filePoR[this.TabOfId[0]].code=this.selCountry[this.TabOfId[1]].code;
      this.isFileModified=true;
      this.selCountry.splice(0,this.selCountry.length);
    } else if (theValue.strFound==="actionCountry"){
      this.iDialog = 1;
      this.tabDialog[this.iDialog]=true;
      this.tabDialog[0]=false;
    } else if (theValue.strFound==="selAction"){
      if (this.tabActionCountry[this.TabOfId[1]]==='Add after'){
          const mainR = new  classCountryPoR;
          this.filePoR.splice(this.TabOfId[0]+1,0,mainR);
          const recPoR = new classPointOfRef;
          this.filePoR[this.TabOfId[0]+1].PoR.push(recPoR);
          this.isFileModified=true;
      } else if (this.tabActionCountry[this.TabOfId[1]]==='Add before'){
        const mainR = new  classCountryPoR;
          this.filePoR.splice(this.TabOfId[0],0,mainR);
          const recPoR = new classPointOfRef;
          this.filePoR[this.TabOfId[0]+1].PoR.push(recPoR);
          this.isFileModified=true;
      } else if (this.tabActionCountry[this.TabOfId[1]]==='Delete'){
        this.isDeleteCountry=true;
        this.iCountryPoR=this.TabOfId[0];

      } else if (this.tabActionCountry[this.TabOfId[1]]==='Zoom-in'){
        this.iCountryPoR=this.TabOfId[0];

      } else if (this.tabActionCountry[this.TabOfId[1]]==='Zoom-out'){
        this.iCountryPoR=-1;
      } 
    }
    else if (theValue.strFound==="delCountryYES"){
      this.filePoR.splice(this.TabOfId[0],1);
      this.iCountryPoR=-1;
      this.isDeleteCountry=false;
      this.isFileModified=true;
    } else if (theValue.strFound==="delCountryNO"){
      this.iCountryPoR=-1;
      this.isDeleteCountry=false;
      
    } 
  } else if (theValue.strFound==="selectedCountry"){
    this.iCountryPoR=this.TabOfId[0];
  }
  this.scroller.scrollToAnchor('bottomPage');
}


onSelOrAction(event:any){
  this.resetBooleans();
  const theEvent={
    target:{
      id:""
    }
  }
  this.TabOfId.splice(0,this.TabOfId.length);
  const theValue= findIds(event.target.id,"-");
  for (var i=0; i<theValue.tabOfId.length; i++){
    this.TabOfId[i]=theValue.tabOfId[i];
  }

  if (this.isCircuitSelected===false){
      theEvent.target.id="Action-"+this.TabOfId[0].toString();
      this.onActionPoR(theEvent);
  } else {
      theEvent.target.id="Selection-"+this.TabOfId[0].toString();
      this.onSelectPoR(theEvent);
  }
}


onActionPoR(event:any){

    this.resetBooleans();
    
    this.TabOfId.splice(0,this.TabOfId.length);
    const theValue= findIds(event.target.id,"-");
    
    for (var i=0; i<theValue.tabOfId.length; i++){
      this.TabOfId[i]=theValue.tabOfId[i];
    }
    if (theValue.strFound==="Action"){
      
      this.tabDialog[0]=true;
      this.tabDialog[1]=false;
      // display the list of action in a dropdown list
    } else if (theValue.strFound==="Selection"){


    } else if (theValue.strFound==="selAction"){
      if (this.tabAction[this.TabOfId[1]]==="Cancel"){ 
        this.tabDialog[0]=false;
      } else  if (this.tabAction[this.TabOfId[1]]==='Add before' || this.tabAction[this.TabOfId[1]]==='Add after'){ // Add before
            this.saveAction = this.tabAction[this.TabOfId[1]];   
            this.saveRecord=this.TabOfId[0]; 
            this.formOptions.controls["pointRef"].setValue("");
            this.formOptions.controls["lat"].setValue(0);
            this.formOptions.controls["lgt"].setValue(0);
            this.formOptions.controls["varLat"].setValue(0);
            this.formOptions.controls["varLon"].setValue(0);
            this.formOptions.controls["prio"].setValue("lat");
            this.isAddRef=true;
        } else {
            this.formOptions.controls["pointRef"].setValue(this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].ref);
            this.formOptions.controls["lat"].setValue(this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].lat);
            this.formOptions.controls["lgt"].setValue(this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].lon);
            this.formOptions.controls["varLat"].setValue(this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].varLat);
            this.formOptions.controls["varLon"].setValue(this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].varLon);
            this.formOptions.controls["prio"].setValue(this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].prio);
            if (this.tabAction[this.TabOfId[1]]==="Modify"){ 
              this.isUpdateRef=true;
            } else if (this.tabAction[this.TabOfId[1]]==="Delete"){ 
              this.isDeleteRef=true;
            } 

          }
    } else if (theValue.strFound==="confirmAdd"){
        this.checkFormData();
        if (this.errorMsg===""){
            const theClass=new classPointOfRef;
            if (this.saveAction==="Add before"){
              this.filePoR[this.iCountryPoR].PoR.splice(this.saveRecord,0,theClass);
            } else {
              this.saveRecord++
              this.filePoR[this.iCountryPoR].PoR.splice(this.saveRecord,0,theClass);
            }
            
            this.filePoR[this.iCountryPoR].PoR[this.saveRecord].ref=this.formOptions.controls["pointRef"].value;
            this.filePoR[this.iCountryPoR].PoR[this.saveRecord].prio=this.formOptions.controls["prio"].value;
            this.filePoR[this.iCountryPoR].PoR[this.saveRecord].lat=Number(this.formOptions.controls["lat"].value);
            this.filePoR[this.iCountryPoR].PoR[this.saveRecord].lon=Number(this.formOptions.controls["lgt"].value);
            this.filePoR[this.iCountryPoR].PoR[this.saveRecord].varLat=Number(this.formOptions.controls["varLat"].value);
            this.filePoR[this.iCountryPoR].PoR[this.saveRecord].varLon=Number(this.formOptions.controls["varLon"].value);
            this.isFileModified=true;
            this.isAddRef=false;
            this.tabDialog[0]=false;
        }
    } else if (theValue.strFound==="confirmModify"){
        this.checkFormData();
        if (this.errorMsg===""){
          this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].ref=this.formOptions.controls["pointRef"].value;
          this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].prio=this.formOptions.controls["prio"].value;
          this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].lat=Number(this.formOptions.controls["lat"].value);
          this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].lon=Number(this.formOptions.controls["lgt"].value);
          this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].varLat=Number(this.formOptions.controls["varLat"].value);
          this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].varLon=Number(this.formOptions.controls["varLon"].value);
            this.isFileModified=true;
            this.isUpdateRef=false;
            this.tabDialog[0]=false;
        }
    } else if (theValue.strFound==="confirmDel"){
        this.filePoR[this.iCountryPoR].PoR.splice(this.TabOfId[0],1);
        this.isFileModified=true;
        this.isDeleteRef=false;
        this.tabDialog[0]=false;

    } else if (theValue.strFound==="cancelAction"){
      this.isAddRef=false;
      this.isDeleteRef=false;
      this.isUpdateRef=false;
      this.tabDialog[0]=false;
    } 
    console.log(event.target.id);
    this.scroller.scrollToAnchor('bottomPage');

}

saveConfirmed:boolean=false;


checkFormData(){
  this.errorMsg="";
  if (this.formOptions.controls["pointRef"].value==="" || this.formOptions.controls["lat"].value===""
      || this.formOptions.controls["lgt"].value ==="" || this.formOptions.controls["prio"].value ===""
      || this.formOptions.controls["varLat"].value ==="" || this.formOptions.controls["varLon"].value ===""
      ){
        this.errorMsg="All fields are mandatory";
  } else if (isNaN(this.formOptions.controls["lat"].value) 
  || isNaN(this.formOptions.controls["lgt"].value)){
    this.errorMsg="Latitude and Loongitude must be numeric values";
  }


}


manageUpdates(event:any){
  if (event.target.id==="confirmSave"){
      this.saveConfirmed=true;
      this.formOptions.controls["fileName"].setValue(this.configServer.PointOfRef.file);
  }  else if (event.target.id==="reinitialize"){
    this.GetRecord(this.configServer.PointOfRef.bucket,this.configServer.PointOfRef.file,0);
      this.saveConfirmed=false;
      this.isFileModified=false;
  } else if (event.target.id==="noReinit"){
    
  } else if (event.target.id==="saveFile"){
    
      this.saveFile(this.configServer.PointOfRef.bucket, this.formOptions.controls["fileName"].value, this.filePoR);
  } else if (event.target.id==="cancelSave"){
      this.saveConfirmed=false;
  }
}

saveFile(bucket:string, object:string,record:any){
  this.errorMsg='';
  // const fileName =this.formOptions.controls["fileName"].value;
  var file=new File ([JSON.stringify(record)],object, {type: 'application/json'});
 
  this.ManageGoogleService.uploadObject(this.configServer, bucket, file , object)
    .subscribe(
      res => {
        if (res.type===4){ 
          this.errorMsg="file " + object + " has been successfully saved"
          console.log(this.errorMsg);
          this.isFileModified=false;
          this.resetAllBooleans;
          if (this.isCircuitSelected){
            this.returnFile.emit(this.filePoR);
          }
          this.scroller.scrollToAnchor('bottomPage');
        }
      }, 
      err => {
        this.errorMsg='failure to get record ' + object + ' ;  error = '+ JSON.stringify(err);
        console.log(this.errorMsg);
        this.scroller.scrollToAnchor('bottomPage');
      })
}

getFileCircuit(){
  this.GetRecord(this.identification.circuits.bucket, this.identification.circuits.file,1);
}

fileCircuit:Array<classCircuitRec>=[];

saveFileCircuit(){
  this.saveFile(this.identification.circuits.bucket, this.identification.circuits.file, this.fileCircuit);
}

GetRecord(bucketName:string,objectName:string, iWait:number){
  this.errorMsg="";
  this.EventHTTPReceived[iWait]=false;
  this.NbWaitHTTP++;
  this.waitHTTP(this.TabLoop[iWait],30000,iWait);
  this.ManageGoogleService.getContentObject(this.configServer, bucketName, objectName )
      .subscribe((data ) => {  
          if (iWait===0){ 
            this.filePoR.splice(0,this.filePoR.length);
            for (var i=0; i<data.length; i++){
             const mainRec = new classCountryPoR;
             this.filePoR.push(mainRec);
              this.filePoR[i].country=data[i].country;
              this.filePoR[i].code=data[i].code;
              for (var j=0; j<data[i].PoR.length; j++){
                const theClass=new classPointOfRef;
                this.filePoR[i].PoR.push(theClass);

                this.filePoR[i].PoR[j].ref=data[i].PoR[j].ref;
                this.filePoR[i].PoR[j].lat=data[i].PoR[j].lat;
                this.filePoR[i].PoR[j].lon=data[i].PoR[j].lon;   
                if (data[i].PoR[j].alt === undefined){  
                  this.filePoR[i].PoR[j].alt=0;
                } else {
                  this.filePoR[i].PoR[j].alt=data[i].PoR[j].alt;  
                }

                if (data[i].PoR[j].prio === undefined){
                      this.filePoR[i].PoR[j].prio="lat";
                } else {
                      this.filePoR[i].PoR[j].prio=data[i].PoR[j].prio;
                }
                if (data[i].PoR[j].varLat === undefined){
                      this.filePoR[i].PoR[j].varLat=0.0002;
                } else {
                      this.filePoR[i].PoR[j].varLat=data[i].PoR[j].varLat;
                }
                if (data[i].PoR[j].varLon === undefined){
                      this.filePoR[i].PoR[j].varLon=0.00002;
                } else {
                      this.filePoR[i].PoR[j].varLon=data[i].PoR[j].varLon;
                }
               
              }
            }
                // this.filePoR[j].PoR[i] = data[j].PoR[i];
            if (this.isCircuitSelected){
              this.returnFile.emit(this.filePoR);
            }
            this.istabPointOfRef=true;
          } else if (iWait===1){ // Circuits
              this.fileCircuit=data;
          } else if (iWait===2){ // Preferred countries
            this.fileCountry=data;
        }
        this.scroller.scrollToAnchor('bottomPage');
      },
      error => {
        this.errorMsg='failure to get record ' + objectName +' ;  error = '+ JSON.stringify(error);
        console.log(this.errorMsg);
        this.scroller.scrollToAnchor('bottomPage');
      })
}


waitHTTP(loop:number, maxloop:number, eventNb:number){
  const pas=500;
  if (loop%pas === 0){
    console.log('waitHTTP ==> loop=' + loop + ' maxloop=' + maxloop);
  }
 loop++
  
  this.idAnimation[eventNb]=window.requestAnimationFrame(() => this.waitHTTP(loop, maxloop, eventNb));
  if (loop>maxloop || this.EventHTTPReceived[eventNb]===true ){
            console.log('exit waitHTTP ==> loop=' + loop + ' maxloop=' + maxloop + ' this.EventHTTPReceived=' + 
                    this.EventHTTPReceived[eventNb] );
            if (this.EventHTTPReceived[eventNb]===true ){
                    window.cancelAnimationFrame(this.idAnimation[eventNb]);
            }    
      }  
  }

}
