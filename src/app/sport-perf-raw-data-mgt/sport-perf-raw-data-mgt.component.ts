import { Component, OnInit , Input, Output, HostListener,  OnDestroy, HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject} from '@angular/core';
  
import { DatePipe, formatDate } from '@angular/common'; 

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, UntypedFormControl,FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { Observable } from 'rxjs';

import {msginLogConsole} from '../consoleLog'
import { configServer, LoginIdentif, classFileSport, OneBucketInfo, classPointOfRef, classNewLoop, classCircuitRec, classFilePerf, msgConsole, classCredentials, classWorkCircuit } from '../JsonServerClass';
import { findIds, formatHHMNSS } from '../MyStdFunctions';

import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';


export class classTabPoR{
  recNb:number=0;
  content=new classFilePerf;
}

@Component({
  selector: 'app-sport-perf-raw-data-mgt',
  templateUrl: './sport-perf-raw-data-mgt.component.html',
  styleUrls: ['./sport-perf-raw-data-mgt.component.css']
})
export class SportPerfRawDataMgtComponent {

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

  @Input() configServer = new configServer;
  @Input() identification= new LoginIdentif;
  @Input() credentials= new classCredentials;

  theFile= new classFileSport;
  nameFilePerf:string="";
  filePerf:Array<classFilePerf>=[];
  initFilePerf:Array<classFilePerf>=[];
  isPerfRetrieved:boolean=true;

  filePoR:Array<any>=[];

  EventHTTPReceived:Array<boolean>=[];
  maxEventHTTPrequest:number=20;
  idAnimation:Array<number>=[];
  TabLoop:Array<number>=[];
  NbWaitHTTP:number=0;

  NbRefresh_Bucket:number=0;
  bucketName:string="";

  errorMsg:string="";
  
  formOptions: FormGroup = new FormGroup({ 
    fileName: new FormControl("", { nonNullable: true }),
    PoR: new FormControl("", { nonNullable: true }),
  })

  isFilePerfReceived:boolean=false;

  isFilesToSave:boolean=false;
  saveMsg:string="";

  TabOfId:Array<any>=[];
  strFound:string="";
   
  maxWidthTable:number=0;
  widthTable:number=0;

  tabPerfPoR:Array<classTabPoR>=[];
  selItem:number=-1;
  selectedRecord=new classFilePerf;
  perfNb:number=0;
  isFileReceived:boolean=false;

  isCircuitSelected:boolean=true;

  newPoR:string="";
  tabInputPoR:Array<classPointOfRef>=[];
  listOfPoR:Array<classPointOfRef>=[];
  isPoRFileReturned:boolean=false;

  ngOnInit(){
    this.bucketName=this.identification.performanceSport.bucket;
  }

  resetTab(){
      
  }
  selBucket=new OneBucketInfo;
  BucketInfo(event:any){
      console.log("Bucket info=" + event.name);
      this.selBucket=event;
      this.isFileReceived=false;
  }

  ReceivedData(event:any){
    console.log("Received Data=" + JSON.stringify(event));
    this.isFileReceived=true;
    this.resetVar();
    this.resetTab();
    this.isPerfFileModified=false;
    this.filePerf.splice(0,this.filePerf.length);
    this.initFilePerf.splice(0,this.initFilePerf.length);
    if (event.fileType!==undefined && event.fileType==="perfRawData"){
      this.theFile=event;
      this.copyInOutFile(event.content,this.filePerf);
      this.copyInOutFile(event.content,this.initFilePerf);

      this.nameFilePerf=event.name;
      //this.isFilePerfReceived=true;
     
      console.log("file perf " + this.nameFilePerf + " has " + this.filePerf.length + " record(s)");
      this.updateTabPor();
      if (this.tabPerfPoR.length===0){
        console.log("no PoR records found for file " + this.nameFilePerf);
      }
    } else {

        this.errorMsg=this.selBucket.name + " is not a formatted performance sport file"
    }
    this.scroller.scrollToAnchor('bottomPage');
  }

  onResetFile(){
    this.filePerf.splice(0,this.filePerf.length);
    this.copyInOutFile(this.initFilePerf,this.filePerf);
    this.isPerfFileModified=false;
  }

  isPerfFileModified:boolean=false;
  onSavePerfFile(){
    // update the refPoints table
    this.listPoR();
    this.theFile.content=this.filePerf;
    this.isPerfFileModified=false;
    this.theFile.codeName = this.nameFilePerf;
    this.fnSave(this.identification.performanceSport.bucket, this.theFile.codeName);
  }

  fnSave(bucket:string, fileName:string){
    var file=new File ([JSON.stringify(this.theFile)], fileName, {type: 'application/json'});    
    this.ManageGoogleService.uploadObject(this.configServer, bucket, file ,  fileName)
          .subscribe(
              res => {
                  if (res.type===4){ 
                      this.saveMsg =  " filehas been updated and stored in the cloud ";
                  }
            })
  }

  listPoR(){
    for (var i=0; i<this.filePerf.length; i++){
      if (this.filePerf[i].refPoR!==""){
        this.theFile.refPoints[this.theFile.refPoints.length]=this.filePerf[i].refPoR;
      }      
    }
    this.theFile.refPoints.sort((a, b) => (a < b) ? -1 : 1);
    for (i=1; i<this.theFile.refPoints.length; i++){
      if (this.theFile.refPoints[i-1]===this.theFile.refPoints[i]){
        this.theFile.refPoints.splice(i,1);
        i--
      }
    }
  }

  updateTabPor(){
    this.tabPerfPoR.splice(0,this.tabPerfPoR.length);
      for (var i=0; i<this.filePerf.length; i++){
        if (this.filePerf[i].refPoR!==""){
          const theClass=new classTabPoR;
          this.tabPerfPoR.push(theClass);
          this.tabPerfPoR[this.tabPerfPoR.length-1].recNb=i;
          this.tabPerfPoR[this.tabPerfPoR.length-1].content=this.filePerf[i];
        }      
      }
  }

  copyInOutFile(inFile:any,outFile:any){
    for (var i=0; i<inFile.length; i++){
      const theClassA=new classFilePerf;
      outFile.push(theClassA);
      outFile[i].alt=inFile[i].alt;
      outFile[i].dist=inFile[i].dist;
      outFile[i].exclude=inFile[i].exclude;
      outFile[i].heart=inFile[i].heart;
      outFile[i].lat=inFile[i].lat;
      outFile[i].lon=inFile[i].lon;
      outFile[i].refPoR=inFile[i].refPoR;
      outFile[i].slope=inFile[i].slope;
      outFile[i].speed=inFile[i].speed;
      outFile[i].time=inFile[i].time;
    }
  }

  manageFile(event:any){
    this.isPoRFileReturned=true;
    for (var i=0; i<event.length && event.length>0; i++){
      for (var j=0; j<event[i].PoR.length && event[i].PoR.length>0; j++){
          const theClass=new classPointOfRef;
          this.listOfPoR.push(theClass);
          this.listOfPoR[this.listOfPoR.length-1]=event[i].PoR[j];
      }
    }
    this.listOfPoR.sort((a, b) => (a.ref < b.ref) ? -1 : 1);
  }
  newPoRmsg:string="";
  onInputPoR(event:any){
    var i=0
    this.newPoRmsg="";
    if (event.target.id==="newPoR"){
       this.tabInputPoR.splice(0,this.tabInputPoR.length);
        if (event.target.value.toLowerCase().trim().length!==0){
          for (i=0; i<this.listOfPoR.length && this.listOfPoR[i].ref.substring(0,event.target.value.toLowerCase().trim().length).toLowerCase()!==event.target.value.toLowerCase().trim(); i++){}
        } 
        for (i=i; i<this.listOfPoR.length && this.listOfPoR[i].ref.substring(0,event.target.value.toLowerCase().trim().length).toLowerCase()===event.target.value.toLowerCase().trim(); i++){
            const theClass=new classPointOfRef;
            this.tabInputPoR.push(theClass);
            this.tabInputPoR[this.tabInputPoR.length-1]=this.listOfPoR[i];
        }
        if (this.tabInputPoR.length===1){
          this.newPoR=this.tabInputPoR[this.tabInputPoR.length-1].ref;
        } else  if (this.tabInputPoR.length===0){
          this.newPoR=event.target.value;
          this.newPoRmsg="new PoR not found";
        }
      } else if (event.target.id==="confirm"){
        for (i=0; i<this.listOfPoR.length && this.listOfPoR[i].ref!==this.newPoR; i++){}
        if (i===this.listOfPoR.length){
          this.newPoRmsg="update not done because new PoR does not exist";
        } else {
          this.filePerf[this.perfNb].refPoR=this.newPoR;
          this.newPoR="";
          this.tabInputPoR.splice(0,this.tabInputPoR.length);
          this.selItem=-1;
          this.isPerfFileModified=true;
          this.updateTabPor();
        }
        
        
      }  else if (event.target.id.substring(0,7)==="selPoR-"){
            var theClass=new classPointOfRef;
            theClass=this.tabInputPoR[Number(event.target.id.substring(7))];
            this.newPoR=this.tabInputPoR[Number(event.target.id.substring(7))].ref;
            this.tabInputPoR.splice(0,this.tabInputPoR.length);
            this.tabInputPoR.push(theClass);
        } 
  }



  onSelectPoR(event:any){
      console.log(event);
  }


  resetVar(){
    this.saveMsg="";
    this.isFilesToSave=false;
    this.errorMsg="";
    this.selItem=-1;
    this.newPoRmsg="";
  }
    
  onSelectPerf(event:any){

  }

  isDisplayPerf:boolean=false;
  onDisplayPerf(event:string){
    if (event==="Yes"){
        this.isDisplayPerf=true;
    } else {
      this.isDisplayPerf=false;
    }
  }
  
  onDownloadFile(event:any): void { 
    // triggerred by html component
    const link = document.createElement("a");
    //link.href = URL.createObjectURL(file);
    link.href=this.selBucket.mediaLink;
    link.download = this.selBucket.name; // filename
    link.click();
    link.remove(); 
  }

  onSelectPerfRow(event:any){   
    this.newPoRmsg="";   
    if (event.target.id.substring(0,4)==='sel-'){
        this.selItem=Number(event.target.id.substring(4));
        this.perfNb=this.tabPerfPoR[this.selItem].recNb;
        //this.selectedRecord=this.tabPerfPoR[this.selItem].content;
    } else if (event.target.id.substring(0,8)==='perfSel-'){
      this.selItem=Number(event.target.id.substring(8));
      this.perfNb=this.selItem;
      //this.selectedRecord=this.filePerf[this.selItem];
    } 
    this.newPoR=this.filePerf[this.perfNb].refPoR;
    console.log('row selection = ' + this.selItem);
  }

  syncScrollBar(event:any){
    if (event.srcElement.scrollLeft!==undefined){
      var elem1=document.getElementById("scroll-1");
      if (elem1!==null){
        elem1.scrollLeft=event.srcElement.scrollLeft;
      }
    }
  }



}
