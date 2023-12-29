import { Component, OnInit , Input, Output, HostListener,  OnDestroy, HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject} from '@angular/core';
  
import { DatePipe, formatDate } from '@angular/common'; 

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, UntypedFormControl,FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { Observable } from 'rxjs';

import {msginLogConsole} from '../../consoleLog'
import { configServer, LoginIdentif,  classTabMetaPerso, OneBucketInfo,  msgConsole, classCredentials, Bucket_List_Info } from '../../JsonServerClass';
import {classFileSport, classPointOfRef, classNewLoop, classCircuitRec, classFilePerf,classWorkCircuit, classTabPoR, classTotalLoop, classCountryPoR, classHeaderFileSport} from '../classSport';
import { findIds, formatHHMNSS } from '../../MyStdFunctions';

import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';

@Component({
  selector: 'app-manage-circuits',
  templateUrl: './manage-circuits.component.html',
  styleUrls: ['./manage-circuits.component.css']
})
export class ManageCircuitsComponent {


  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageMangoDBService: ManageMangoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    ) { }

    @Output() newCredentials= new EventEmitter<any>();
    @Output() resetServer= new EventEmitter<any>();
    @Output() returnCircuit= new EventEmitter<any>();
    @Input() configServer = new configServer;
    @Input() identification= new LoginIdentif;
    @Input() selectionCircuit:boolean=false;

    tabPoR:Array<classCountryPoR>=[];
    selectedPoint= new classPointOfRef;

    isCircuitSelected:boolean=true;
    listCountry:Array<any>=[];

    tabCircuit:Array<any>=[];
    
    fileCircuit:Array<classCircuitRec>=[];

    EventHTTPReceived:Array<boolean>=[];
    maxEventHTTPrequest:number=20;
    idAnimation:Array<number>=[];
    TabLoop:Array<number>=[];
    NbWaitHTTP:number=0;

    errorMessage:string="";
  
    formOptions: FormGroup = new FormGroup({ 
      pointRef: new FormControl("", { nonNullable: true }),
      lat: new FormControl(0, { nonNullable: true }),
      lgt: new FormControl(0, { nonNullable: true }),
      dist: new FormControl(0, { nonNullable: true }),
      fileName: new FormControl("", { nonNullable: true }),
    })

   
    tabAction=["Cancel","Add before","Add after","Delete"];
    tabActionH=["Cancel","Add before","Add after","Delete","Zoom-in","Zoom-out"];
    tabRef:Array<any>=[];
    tabDist:Array<number>=[];
    tabDialog:Array<boolean>=[]; 
    iDialog:number=0;
    expandCircuit:number=-1;

    istabPointOfRef:boolean=false;
    isFileModified:boolean=false;
    isTabOfRefReceived:boolean=false;
    isFileCircuitReceived:boolean=false;
    isListCountries:boolean=false;
    isDeleteCircuit:boolean=false;
    isDeletePoR:boolean=false;

    saveConfirmed:boolean=false;

    TabOfId:Array<any>=[];
    strFound:string="";
   
    errorMsg:string="";
    sizeBox:number=0;

ngOnInit(){
/***
  this.ManageGoogleService.insertCacheFile(this.configServer,this.identification.circuits.file)
    .subscribe((data ) => {  
          console.log('insertCacheFile ==> ' + JSON.stringify(data));
      },
      err => {
          console.log('error on insertCacheFile :'+ JSON.stringify(err));
      });
  */
  this.GetRecord(this.identification.circuits.bucket, this.identification.circuits.file,1);
  //this.GetRecord("config-xmvit", "CountryISO.json",2);
  this.GetRecord("config-xmvit", "CountryISOPreferred.json",2);
  this.selectionCircuit
}

resetBooleans(){
  this.tabDialog[this.iDialog]=false;
  this.errorMessage="";
  this.errorMsg="";
}

manageFile(event:any){
  this.tabPoR=event;
  this.isTabOfRefReceived=true;
}

onInput(event:any){
  this.resetBooleans();

  this.TabOfId.splice(0,this.TabOfId.length);
  const theValue= findIds(event.target.id,"-");
  
  for (var i=0; i<theValue.tabOfId.length; i++){
    this.TabOfId[i]=theValue.tabOfId[i];
  }
  if (theValue.strFound==="actionH"){
    this.iDialog=1;
    this.tabDialog[this.iDialog]=true;
    this.tabDialog[0]=false;
  }  else if (theValue.strFound==="selActionH"){
    this.iDialog=1;
    this.tabDialog[this.iDialog]=false;
    if (this.tabActionH[this.TabOfId[1]]==="Add after"){
        const record = new classCircuitRec;
        this.fileCircuit.splice(this.TabOfId[0]+1,0,record);
        const recordPoR= new classPointOfRef;
        this.fileCircuit[this.fileCircuit.length-1].points.push(recordPoR);
        this.isFileModified=true;
    } else if (this.tabActionH[this.TabOfId[1]]==="Add before"){
        const record = new classCircuitRec;
        this.fileCircuit.splice(this.TabOfId[0],0,record);
        const recordPoR= new classPointOfRef;
        this.fileCircuit[this.fileCircuit.length-1].points.push(recordPoR);
        this.isFileModified=true;
    } else if (this.tabActionH[this.TabOfId[1]]==="Delete"){
      this.isFileModified=true;
      this.isDeleteCircuit=true;
    } else if (this.tabActionH[this.TabOfId[1]]==="Zoom-in"){
        this.expandCircuit=this.TabOfId[0];
        this.sizeTheBox();
    } else if (this.tabActionH[this.TabOfId[1]]==="Zoom-out"){
        this.expandCircuit=-1;
  } 
  } else if (theValue.strFound==="name"){
      this.isFileModified=true;
      this.fileCircuit[this.TabOfId[0]].name=event.target.value;
  } else if (theValue.strFound==="dist"){
    this.isFileModified=true;
    this.fileCircuit[this.TabOfId[0]].dist[this.TabOfId[1]]=Number(event.target.value);
  } else if (theValue.strFound==="country"){
      this.isFileModified=true;
      this.fileCircuit[this.TabOfId[0]].country=event.target.value;
  } else if (theValue.strFound==="city"){
      this.isFileModified=true;
      this.fileCircuit[this.TabOfId[0]].city=event.target.value;
  } else if (theValue.strFound==="PoRef"){ // first letters of PoR are input by user
    this.iDialog=0;
    this.tabDialog[this.iDialog]=true;
    this.tabDialog[1]=false;  
    for (var i=0; i<this.tabPoR.length && this.tabPoR[i].country!== this.fileCircuit[this.TabOfId[0]].country; i++){
    }
    if (i<this.tabPoR.length){
        for (var j=0; j<this.tabPoR[i].PoR.length; j++){
          if (this.tabPoR[i].PoR[j].ref.toLowerCase().indexOf(event.target.value.toLowerCase().trim())!==-1){
            const thePush=new classPointOfRef;
            this.tabRef.push(thePush);
            this.tabRef[this.tabRef.length-1]=this.tabPoR[i].PoR[j];
          }
        }
      }    
    if (  this.tabRef.length===1){
      this.isFileModified=true;
      this.fileCircuit[this.TabOfId[0]].points[this.TabOfId[1]].ref=this.tabRef[0].ref;
      this.fileCircuit[this.TabOfId[0]].points[this.TabOfId[1]].alt=this.tabRef[0].alt;
      this.fileCircuit[this.TabOfId[0]].points[this.TabOfId[1]].lat=this.tabRef[0].lat;
      this.fileCircuit[this.TabOfId[0]].points[this.TabOfId[1]].lon=this.tabRef[0].lon;
      this.fileCircuit[this.TabOfId[0]].points[this.TabOfId[1]].varLat=this.tabRef[0].varLat;
      this.fileCircuit[this.TabOfId[0]].points[this.TabOfId[1]].varLon=this.tabRef[0].varLon;
      this.fileCircuit[this.TabOfId[0]].points[this.TabOfId[1]].prio=this.tabRef[0].prio;
      //this.fileCircuit[this.TabOfId[0]].dist[this.TabOfId[1]]=this.tabRef[0].dist;
      this.isFileModified=true;
      this.tabRef.splice(0, this.tabRef.length);
    } else{
      this.iDialog=0;
      this.tabDialog[this.iDialog]=true;
    }

  } else if (theValue.strFound==="selPoR"){ // PoR has been selected by the customer
      this.isFileModified=true;
      this.fileCircuit[this.TabOfId[0]].points[this.TabOfId[1]].ref=this.tabRef[this.TabOfId[2]].ref;
      this.fileCircuit[this.TabOfId[0]].points[this.TabOfId[1]].alt=this.tabRef[this.TabOfId[2]].alt;
      this.fileCircuit[this.TabOfId[0]].points[this.TabOfId[1]].lat=this.tabRef[this.TabOfId[2]].lat;
      this.fileCircuit[this.TabOfId[0]].points[this.TabOfId[1]].lon=this.tabRef[this.TabOfId[2]].lon;
      //this.fileCircuit[this.TabOfId[0]].dist[this.TabOfId[1]]=this.tabRef[this.TabOfId[2]].dist;
      this.isFileModified=true;
      this.tabRef.splice(0, this.tabRef.length);
  } else  if (theValue.strFound==="actionPoR"){ // display tabAction
    this.iDialog=2;
    this.tabDialog[this.iDialog]=true;
    this.tabDialog[1]=false;
    this.tabDialog[0]=false;
    
  } else  if (theValue.strFound==="selAction"){ // action on PoR selected by user
    this.iDialog=2;
    this.tabDialog[this.iDialog]=false;
    if (this.tabActionH[this.TabOfId[2]]==="Add after"){
     
      const recordPoR= new classPointOfRef;
      this.fileCircuit[this.TabOfId[0]].points.splice(this.TabOfId[1]+1,0,recordPoR);
      this.isFileModified=true;
    } else if (this.tabActionH[this.TabOfId[2]]==="Add before"){
        const recordPoR= new classPointOfRef;
        this.fileCircuit[this.TabOfId[0]].points.splice(this.TabOfId[1],0,recordPoR);
        this.isFileModified=true;
    } else if (this.tabActionH[this.TabOfId[2]]==="Delete"){
      this.isFileModified=true;
      this.isDeletePoR=true;
    } 
  } else if (theValue.strFound==="delPoRYES"){
    this.isDeletePoR=false;
    this.fileCircuit[this.TabOfId[0]].points.splice(this.TabOfId[1],1);
  } else if (theValue.strFound==="delPoRNO"){
    this.isDeletePoR=false;
  } else if (theValue.strFound==="delCircuitYES"){
    this.isDeleteCircuit=false;
    this.fileCircuit.splice(this.TabOfId[0],1);
  } else if (theValue.strFound==="delCircuitNO"){
    this.isDeleteCircuit=false;
  } else if (theValue.strFound==="returnCircuit"){
    this.returnCircuit.emit(this.fileCircuit[this.TabOfId[0]]);
  }
  this.scroller.scrollToAnchor('bottomCircuit');
}

updateAllCircuits(event:any){
  if (event.target.id==="updatePoRYES"){
    for (var i=0; i<this.fileCircuit.length; i++){

      for (var k=0; k<this.tabPoR.length && this.tabPoR[k].country !==this.fileCircuit[i].country; k++){}
      if (k<this.tabPoR.length){
        for (var j=0; j<this.fileCircuit[i].points.length; j++){
            for (var l=0; l<this.tabPoR[k].PoR.length; l++){
              if (this.tabPoR[k].PoR[l].ref === this.fileCircuit[i].points[j].ref){
                this.fileCircuit[i].points[j].lat=this.tabPoR[k].PoR[l].lat;
                this.fileCircuit[i].points[j].lon=this.tabPoR[k].PoR[l].lon;
                this.fileCircuit[i].points[j].varLat=this.tabPoR[k].PoR[l].varLat;
                this.fileCircuit[i].points[j].varLon=this.tabPoR[k].PoR[l].varLon;
                this.fileCircuit[i].points[j].prio=this.tabPoR[k].PoR[l].prio;
                l=this.tabPoR[k].PoR.length;
              }
            }
        }
      }
      this.isFileModified=true;
  }

  }

}

onSelectPoR(event:any){
  this.selectedPoint=event;
}

manageUpdates(event:any){
  if (event.target.id==="confirmSave"){
      this.saveConfirmed=true;
      this.formOptions.controls["fileName"].setValue(this.identification.circuits.file);
  }  else if (event.target.id==="reinitialize"){
    this.GetRecord(this.identification.circuits.bucket,this.identification.circuits.file,1);
      this.saveConfirmed=false;
      this.isFileModified=false;
  } else if (event.target.id==="noReinit"){
    
  } else if (event.target.id==="saveFile"){
    this.checkCodeCircuit();
    this.saveFile(this.identification.circuits.bucket, this.formOptions.controls["fileName"].value, this.fileCircuit);
  } else if (event.target.id==="cancelSave"){
      this.saveConfirmed=false;
  }
}

checkCodeCircuit(){
  for (var i=0; i<this.fileCircuit.length; i++){
    if (this.fileCircuit[i].code===undefined || this.fileCircuit[i].code===""){
      for (var j=0; j<this.listCountry.length && this.listCountry[j].country!==this.fileCircuit[i].country; j++){}
      this.fileCircuit[i].code=this.listCountry[j].code + '-' + i.toString();
    }
  }
}

saveFile(bucket:string, object:string,record:any){
  this.errorMessage='';
  var tabMetaPerso: Array<classTabMetaPerso> = [];
  const theClass=new classTabMetaPerso;
  tabMetaPerso.push(theClass);
  tabMetaPerso[0].key="fileType";
  tabMetaPerso[0].value="circuit";
  const theType='application/json';
  // const fileName =this.formOptions.controls["fileName"].value;
  var file=new File ([JSON.stringify(record)],object, {type: theType});
  //this.ManageGoogleService.uploadObject(this.configServer, bucket, file , object)
  this.ManageGoogleService.uploadObjectMetaPerso(this.configServer, bucket, file , object,"",theType, tabMetaPerso)
    .subscribe(
      res => {
        if (res.type===4){ 
          this.errorMessage="file " + object + " has been successfully saved"
          console.log(this.errorMessage);
          this.isFileModified=false;
          this.saveConfirmed=false;
          this.scroller.scrollToAnchor('bottomCircuit');
        }
      }, 
      err => {
        this.errorMessage='failure to get record ' + object+ ' ;  error = '+ JSON.stringify(err);
        console.log(this.errorMessage);
        this.scroller.scrollToAnchor('bottomCircuit');
      })
}
sizeTheBox(){
  const maxSizeBox=400;
  const marginSizeBox=60;
  if (this.expandCircuit!==-1){
    this.sizeBox= (this.fileCircuit[this.expandCircuit].points.length + this.fileCircuit.length) * this.sizeRow + marginSizeBox + 80;
  } else {
    this.sizeBox= this.fileCircuit.length * this.sizeRow + marginSizeBox;
  }
  if (this.sizeBox > maxSizeBox){
    this.sizeBox=maxSizeBox;
  }
}
sizeRow:number=30;

GetRecord(bucketName:string,objectName:string, iWait:number){
  this.errorMessage="";
  this.EventHTTPReceived[iWait]=false;
  this.NbWaitHTTP++;
  var i=0;
  this.waitHTTP(this.TabLoop[iWait],30000,iWait);
  this.ManageGoogleService.getContentObject(this.configServer, bucketName, objectName )
      .subscribe((data ) => {  
        if (iWait===1){ // Circuits
          this.fileCircuit.splice(0,this.fileCircuit.length);
          //this.fileCircuit=data;
          
         
          for  (i=0; i<data.length; i++){
            const classCirc=new classCircuitRec;
            this.fileCircuit.push(classCirc);
            this.fileCircuit[i].city=data[i].city;
            this.fileCircuit[i].code=data[i].code;
            this.fileCircuit[i].name=data[i].name;
            this.fileCircuit[i].country=data[i].country;
            for (var j=0; j<data[i].points.length; j++){
              const classPoint=new classPointOfRef;
              this.fileCircuit[i].points.push(classPoint);
              this.fileCircuit[i].points[j]=data[i].points[j];
            }
            
            if (data[i].dist===undefined){
              for (var j=0; j<data[i].points.length; j++){
                this.fileCircuit[i].dist[j]=0;
              }
            } else {
              this.fileCircuit[i].dist=data[i].dist;
            }
          }

          this.isFileCircuitReceived=true;
          this.sizeTheBox();
          
        } else if (iWait===2){ // Circuits
          if (data.text === undefined){
            this.listCountry=data;
          } else {

          
            this.listCountry.splice(0,this.listCountry.length);
            var myStr=data.text;
            const theChar=" = '";
            var lenStr=myStr.length;
            while (lenStr>5){
              i = myStr.indexOf(theChar);
              this.listCountry.push({country:"",code:""});
              this.listCountry[this.listCountry.length-1].code=myStr.substring(i+4,i+6).toUpperCase();

              this.listCountry[this.listCountry.length-1].country=myStr.substring(1,i);
              myStr=myStr.substring(i+11);
              lenStr=myStr.length;
            }
            
            this.saveFile("config-xmvit","CountryISO.json",this.listCountry);
            }
          }
          this.scroller.scrollToAnchor('bottomCircuit');
      },
      error => {
        this.errorMessage='failure to get record ' + objectName +' ;  error = '+ JSON.stringify(error);
        console.log(this.errorMessage);
        if (iWait===1){ // Circuits
          const record = new classCircuitRec;
          this.fileCircuit.push(record);
          this.fileCircuit[0].name="";
          this.fileCircuit[0].country="Singapore";
          this.fileCircuit[0].city="";
          this.fileCircuit[0].code="SI-"+this.fileCircuit.length.toString();
          const recordPoR= new classPointOfRef;
          this.fileCircuit[0].points.push(recordPoR);
          this.isFileCircuitReceived=true;
          this.sizeTheBox();
          }
        this.scroller.scrollToAnchor('bottomCircuit');
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