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
import { findIds, formatHHMNSS } from '../../MyStdFunctions';
import { fillHeaderFile, updateTabPor } from '../commonSportFunctions';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { ManageMongoDBService } from 'src/app/CloudServices/ManageMongoDB.service';


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
    private ManageMongoDBService: ManageMongoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    ) { }

  @Output() newCredentials= new EventEmitter<any>();
  @Output() resetServer= new EventEmitter<any>();

  @Input() configServer = new configServer;
  @Input() identification= new LoginIdentif;
  @Input() credentials= new classCredentials;
  nbSave:number=0; // to trigger ngOnChanges when file 'theFile' is updated

  @Output() savePerf= new EventEmitter<any>();

  specificCircuit= new classCircuitRec;
  saveSpecificCircuit= new classCircuitRec;
  headerPerf=new classHeaderFileSport;
  theFile= new classFileSport;
  //nameFilePerf:string="";
  filePerf:Array<classFilePerf>=[];
  initFilePerf:Array<classFilePerf>=[];
  isPerfRetrieved:boolean=true;

  NbRefresh_Bucket:number=0;
  bucketName:string="";

  errorMsg:string="";

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

  newPoRmsg:string="";

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
    //console.log("Received Data=" + event);
    
    this.resetVar();
    this.resetTab();
    this.isPerfFileModified=false;
    this.filePerf.splice(0,this.filePerf.length);
    this.initFilePerf.splice(0,this.initFilePerf.length);
    if (event.fileType!==undefined && event.fileType==="perfRawData"){
      this.theFile=event;
      this.copyInOutFile(event.content,this.filePerf);
      this.copyInOutFile(event.content,this.initFilePerf);

      this.headerPerf=fillHeaderFile(this.theFile,this.headerPerf);
     
      console.log("file perf " + this.theFile.name + " has " + this.filePerf.length + " record(s)");
      //this.updateTabPor();
      this.tabPerfPoR= updateTabPor(this.filePerf);
      if (this.tabPerfPoR.length===0){
        console.log("no PoR records found for file " + this.theFile.name);
      }
    } else {

        this.errorMsg=this.selBucket.name + " is not a formatted performance sport file"
    }
    this.isFileReceived=true;
    if (this.isPoRFileReturned===true){
      this.listPoR();
    }
    this.scroller.scrollToAnchor('bottomPage');
  }

  
  manageFile(event:any){
    this.listOfPoR.splice(0,this.listOfPoR.length);
    for (var i=0; i<event.length && event.length>0; i++){
      for (var j=0; j<event[i].PoR.length && event[i].PoR.length>0; j++){
          const theClass=new classPointOfRef;
          this.listOfPoR.push(theClass);
          this.listOfPoR[this.listOfPoR.length-1]=event[i].PoR[j];
      }
    }
    this.listOfPoR.sort((a, b) => (a.ref < b.ref) ? -1 : 1);
    this.isPoRFileReturned=true;
    if (this.isFileReceived===true){
      this.listPoR();
    }
  }


  onResetFile(){
    this.filePerf.splice(0,this.filePerf.length);
    this.copyInOutFile(this.initFilePerf,this.filePerf);
    this.isPerfFileModified=false;
  }

  onSavePerfPoRFile(event:any){
    console.log(event);
    //this.theFile=event;
    //this.theFile.codeName = "1-"+this.theFile.name;

    // name of the file is managed by the calling component
    this.fnSave(this.identification.performanceSport.bucket, event, event.codeName);
  }

  isPerfFileModified:boolean=false;
  onSavePerfFile(){
    // update the refPoints table
    this.listPoR();
    this.theFile.content=this.filePerf;
    this.isPerfFileModified=false;
    this.theFile.codeName = this.theFile.name;
    this.fnSave(this.identification.performanceSport.bucket, this.theFile, this.theFile.codeName);
  }
  
  nbErrUpload:number=-1;
  nbSuccessUpload:number=0;
  fnSave(bucket:string, content:any, fileName:string){
    var file=new File ([JSON.stringify(content)], fileName, {type: 'application/json'});    
    this.ManageGoogleService.uploadObject(this.configServer, bucket, file ,  fileName)
          .subscribe(
              res => {
                  if (res.type===4){ 
                    this.nbSuccessUpload++;
                    this.nbSave=this.nbSuccessUpload;
                    this.saveMsg =  " file has been updated and stored in the cloud ";
                  }
              
            }, 
            err => {
              this.nbErrUpload--;
              this.nbSave=this.nbErrUpload;
              this.saveMsg =  " upload pb - file has not been updated";
            })
  }

  listPoR(){

    this.specificCircuit.points.splice(0,this.specificCircuit.points.length);
    for (var i=0; i<this.filePerf.length; i++){
      if (this.filePerf[i].refPoR!==""){
        this.theFile.refPoints[this.theFile.refPoints.length]=this.filePerf[i].refPoR;
        for (var j=0; j<this.specificCircuit.points.length && this.specificCircuit.points.length>0 && this.specificCircuit.points[j].ref!==this.filePerf[i].refPoR; j++){}
          for (var k=0; k<this.listOfPoR.length && this.filePerf[i].refPoR!==this.listOfPoR[k].ref; k++){}
          if (j===this.specificCircuit.points.length){
              const theClass=new classPointOfRef;
              this.specificCircuit.points.push(theClass);
              this.specificCircuit.points[this.specificCircuit.points.length-1]=this.listOfPoR[k];  
          }
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
          //this.updateTabPor();
          this.tabPerfPoR= updateTabPor(this.filePerf);
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
