import { Component, OnInit , Input, Output, OnChanges, HostListener,  OnDestroy, HostBinding, ChangeDetectionStrategy, 
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
import { fillHeaderFile , reinitTotal, copyInitPerf, copyLegInOut, copyInOut, copyLoopInOut, updateTabPor, createPerfTotal} from '../commonSportFunctions';

import { ManageMongoDBService } from '../../CloudServices/ManageMongoDB.service';
import { ManageGoogleService } from '../../CloudServices/ManageGoogle.service';
import { AccessConfigService } from '../../CloudServices/access-config.service';

@Component({
  selector: 'app-display-circuit-loop',
  templateUrl: './display-circuit-loop.component.html',
  styleUrls: ['./display-circuit-loop.component.css']
})
export class DisplayCircuitLoopComponent {

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageMongoDBService: ManageMongoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    ) { }
    
  @Input() perfCircuit:Array<any>=[];
  @Input() filePerf:Array<any>=[];
  @Input() headerPerf= new classHeaderFileSport;
  @Input() nbSave:number=0;
  @Input() displayTab:number=0;

  @Output() savePerf= new EventEmitter<any>();
  @Output() uploadPerfCircuit= new EventEmitter<any>();

  @Output() displaySportChart = new EventEmitter<any>();


  tabIdScroll:Array<string>=[];

  theFile= new classFileSport;
  savePerfCircuit:Array<any>=[];

  selectedLoop:number=0;
  isActionDisplay:boolean=false;
  actionDisplay:Array<string>=["Cancel","Exclude","Delete","Restore"]
  perfTotalCircuit:Array<any>=[];
  maxWidthTable:number=0;
  widthTable:number=0;
  tabManageLoop:Array<string>=[];
  nbItemsLoop:number=-1;
  isManageExclude:boolean=false;
  excludeItem:number=0;
  tabExclDel:Array<string>=[];
  formOptions: FormGroup = new FormGroup({ 
    fileName: new FormControl("", { nonNullable: true }),
    record: new FormControl("", { nonNullable: true }),
  })
  newLat:number=0;
  newLon:number=0;
  TabOfId:Array<any>=[];
  strFound:string="";

  isPerfCircuitRetrieved:number=0;

  isModifOk:boolean=false;
  isFilesToSave:boolean=false;
  isNewRecordValid:boolean=false;
  errorMessage:string="";
  errorMsg:string="";
  
  nbSavedFiles:number=0;
  saveMsg:string="";
  maxFiles:number=0;

  colOne:number=240;

  isPbDetected:boolean=false;
  stringPerfCircuit:string="";
  ngOnInit(){
    if (this.displayTab===1){
      this.tabIdScroll[0]="scroll-3";
      this.tabIdScroll[1]="scroll-4";
    } else {
      this.tabIdScroll[0]="scroll-5";
      this.tabIdScroll[1]="scroll-6";
    }
    
    
    for (var i=0; i<this.perfCircuit.length && this.isPbDetected===false; i++){
        if (this.perfCircuit[0]===undefined){
          this.isPbDetected=true;
          this.stringPerfCircuit=JSON.stringify(this.perfCircuit);
        }
    }
    if (this.isPbDetected===false){
      for (var iLoop=0; iLoop<this.perfCircuit[0].newLoop.length; iLoop++){
        this.tabManageLoop[iLoop]="";
      }
      this.perfTotalCircuit=createPerfTotal(this.perfCircuit, this.perfTotalCircuit);
      this.fnSizeTable();
      this.copyToSavePerfCirc();
    }

  }

  fnSizeTable(){
    this.widthTable=this.perfTotalCircuit[0].newLoop.length * 80 + this.colOne;
    if (this.widthTable<550){
      this.maxWidthTable=this.widthTable;
    }
    else {
      this.maxWidthTable=550;
    }
  }

  manageExclude(event:any){
    const theValue=findIds(event.target.id,"-");
    for (var i=0; i<theValue.tabOfId.length; i++){
      this.TabOfId[i]=theValue.tabOfId[i];
    }
    this.isManageExclude=true;
    this.newLat=0;
    this.newLon=0;
    this.formOptions.controls["record"].setValue("");
  }

  manageDisplayLoop(event:any){
    this.isActionDisplay=false;
    if (event.target.id.substring(0,4)==="loop"){
      this.selectedLoop=Number(event.target.id.substring(5));
      if (this.tabManageLoop[this.selectedLoop]==="E"){
          this.actionDisplay[1]="Include";
      } else {
        this.actionDisplay[1]="Exclude";
      }
      this.isActionDisplay=true;
    } else if (event.target.id.substring(0,6)==="action"){
        if (Number(event.target.id.substring(7))===1){ // Exclude
          if (this.tabManageLoop[this.selectedLoop]==="E"){
            this.tabManageLoop[this.selectedLoop]="";
            this.tabExclDel[this.selectedLoop]="";
          } else {
            this.tabManageLoop[this.selectedLoop]="E";
            this.tabExclDel[this.selectedLoop]="E";
          };
        } else  if (Number(event.target.id.substring(7))===2){ // Delete
              for (var i=0; i<this.perfCircuit.length; i++){
                this.resetLeg(i,this.selectedLoop);
              }
              this.perfTotalCircuit=reinitTotal(this.selectedLoop,this.perfCircuit, this.perfTotalCircuit);
              this.tabManageLoop[this.selectedLoop]="D";
              this.tabExclDel[this.selectedLoop]="D";
        } else  if (Number(event.target.id.substring(7))===3){ // Restore
              for (var i=0; i<this.perfCircuit.length; i++){
                this.perfCircuit=copyLoopInOut(this.savePerfCircuit,this.perfCircuit,this.selectedLoop);  
              }
              this.perfTotalCircuit=reinitTotal(this.selectedLoop, this.perfCircuit, this.perfTotalCircuit);
              this.tabManageLoop[this.selectedLoop]="";
              this.tabExclDel[this.selectedLoop]="";
        } else {
              this.tabManageLoop[this.selectedLoop]="";
              this.tabExclDel[this.selectedLoop]="";
        }
    }
  }


  resetLeg(iLeg:number,iLoop:number){
    this.perfCircuit[iLeg].newLoop[iLoop].exclude="";
    this.perfCircuit[iLeg].newLoop[iLoop].dist=0;
    this.perfCircuit[iLeg].newLoop[iLoop].speed=0;
    this.perfCircuit[iLeg].newLoop[iLoop].theTime="";
    this.perfCircuit[iLeg].newLoop[iLoop].strTime="";
    this.perfCircuit[iLeg].newLoop[iLoop].from="";
    this.perfCircuit[iLeg].newLoop[iLoop].to="";
    this.perfCircuit[iLeg].newLoop[iLoop].perfRecordFrom=0;
    this.perfCircuit[iLeg].newLoop[iLoop].perfRecordTo=0;
  }


  syncScrollBar(event:any){
    if (event.srcElement.scrollLeft!==undefined){
      var elem1=document.getElementById(this.tabIdScroll[0]);
      var elem3=document.getElementById(this.tabIdScroll[1]);
      if (elem1!==null){
        elem1.scrollLeft=event.srcElement.scrollLeft;
      }
      if (elem3!==null){
        elem3.scrollLeft=event.srcElement.scrollLeft;
  
      }
    }
  }

  isSaveFileRequested:boolean=false;
  onRequestSaveFile(){
    this.resetVar();
    this.formOptions.controls['fileName'].setValue(this.headerPerf.name);
    this.isSaveFileRequested=true;
    this.isFilesToSave=false;
    // request to confirm the upload of the file in the cloud as well as the name of the file
  }

  onUploadCircuit(){
    if (this.displayTab===2){
      this.uploadPerfCircuit.emit(this.perfCircuit);
    }
  }

  displayCharts(){
    this.displaySportChart.emit({filePerf:this.perfCircuit,fileTotal:this.perfTotalCircuit, display:true});
  }
  noDisplayCharts(){
    this.displaySportChart.emit({filePerf:this.perfCircuit,fileTotal:this.perfTotalCircuit, display:false});
  }

  onSaveFile(event:any){
    if (event==="Confirm" && this.formOptions.controls["fileName"].value !==""){
      this.isSaveFileRequested=false;
      this.isFilesToSave=true;
      // update all filePerf records according to initial (savePerfCircuit) and updated (perfCircuit) circuits 
      for (var iLoop=0; iLoop<this.tabManageLoop.length; iLoop++){
          if (this.tabManageLoop[iLoop]==="D"){
            for (i=0; i<this.savePerfCircuit.length; i++){
                this.filePerf[this.savePerfCircuit[i].newLoop[iLoop].perfRecordFrom].refPoR="";
                this.filePerf[this.savePerfCircuit[i].newLoop[iLoop].perfRecordFrom].exclude="";
            }
          }
      }

      for (var i=0; i<this.perfCircuit.length; i++){
          for (var iLoop=0; iLoop<this.perfCircuit[i].newLoop.length && i<this.perfCircuit.length; iLoop++){
            if (this.perfCircuit[i].newLoop[iLoop].exclude==="D"){
                  this.filePerf[this.savePerfCircuit[i].newLoop[iLoop].perfRecordFrom].refPoR="";
                  this.filePerf[this.savePerfCircuit[i].newLoop[iLoop].perfRecordFrom].exclude="";
              } else {
                if (this.perfCircuit[i].newLoop[iLoop].exclude==="E"){
                  this.filePerf[this.perfCircuit[i].newLoop[iLoop].perfRecordFrom].exclude="E";
                } else if (this.perfCircuit[i].newLoop[iLoop].exclude==="" && this.savePerfCircuit[i].newLoop[iLoop].exclude==="E"){
                    this.filePerf[this.savePerfCircuit[i].newLoop[iLoop].perfRecordFrom].exclude="";
                } else if (this.perfCircuit[i].newLoop[iLoop].exclude==="D"){
                    this.filePerf[this.savePerfCircuit[i].newLoop[iLoop].perfRecordFrom].exclude="";
                }
                if (this.savePerfCircuit[i].newLoop[iLoop].perfRecordFrom!==this.perfCircuit[i].newLoop[iLoop].perfRecordFrom ){
                  this.filePerf[this.perfCircuit[i].newLoop[iLoop].perfRecordFrom].refPoR=this.perfCircuit[i].newLoop[0].from;
                  this.filePerf[this.perfCircuit[i].newLoop[iLoop].perfRecordFrom].exclude=this.perfCircuit[i].newLoop[iLoop].exclude;
                  this.filePerf[this.savePerfCircuit[i].newLoop[iLoop].perfRecordFrom].refPoR="";
                  this.filePerf[this.savePerfCircuit[i].newLoop[iLoop].perfRecordFrom].exclude="";
                }            
            }
          }             
        }

        // the last perfRecordTo refers to the last PoR and the ref must then be stoed in filePerf
        var trouve=false;
        for (var iLoop=this.perfCircuit[0].newLoop.length-1; iLoop>-1 && trouve===false; iLoop--){
            for (i=this.perfCircuit.length-1; i>-1 && trouve===false; i--){
              if (this.perfCircuit[i].newLoop[iLoop].perfRecordFrom!==0 && this.perfCircuit[i].newLoop[iLoop].perfRecordTo!==0){
                  // last item is found
                  this.filePerf[this.perfCircuit[i].newLoop[iLoop].perfRecordTo].refPoR=this.perfCircuit[i].newLoop[0].to;
                  this.filePerf[this.perfCircuit[i].newLoop[iLoop].perfRecordTo].exclude=this.perfCircuit[i].newLoop[iLoop].exclude;
                  trouve=true;
                }
            }
        }
        this.headerPerf.name = this.formOptions.controls["fileName"].value;
        this.headerPerf.codeName = this.formOptions.controls["fileName"].value;
        this.theFile=fillHeaderFile(this.headerPerf, this.theFile);

        // all PoR in filePerf are to be stored in table refPoints
        this.theFile.refPoints.splice(0,this.theFile.refPoints.length);
        this.theFile.content=this.filePerf;
        for (var i=0; i<this.filePerf.length; i++){
          if (this.filePerf[i].refPoR!==""){
            this.theFile.refPoints[this.theFile.refPoints.length]=this.filePerf[i].refPoR;
          }
        }
        this.theFile.refPoints.sort((a, b) => (a < b) ? -1 : 1);
        // remove all duplicates
        for (i=1; i<this.theFile.refPoints.length; i++){
          if (this.theFile.refPoints[i-1]===this.theFile.refPoints[i]){
            this.theFile.refPoints.splice(i,1);
            i--
          } 
        }
        this.savePerf.emit(this.theFile);

        for (var iLoop=0; iLoop<this.tabManageLoop.length; iLoop++){
          if (this.tabManageLoop[iLoop]==="D"){
            for (i=0; i<this.savePerfCircuit.length; i++){
                this.perfCircuit[i].newLoop.splice(iLoop,1);
            }
          }
      }
    } else if (event==="Cancel"){
        this.isSaveFileRequested=false;
        this.isFilesToSave=false;
    } // otherwise mean confirm but with empty file name
  }

  reInitialisePerf(){
    this.resetVar();
    this.perfCircuit.splice(0,this.perfCircuit.length);
    this.perfCircuit=copyInOut(this.savePerfCircuit,this.perfCircuit);
    for (var i=0; i<this.perfCircuit[0].newLoop.length; i++){
      this.perfTotalCircuit=reinitTotal(i, this.perfCircuit, this.perfTotalCircuit);
    }
  }

  copyToSavePerfCirc(){
    this.savePerfCircuit.splice(0,this.perfCircuit.length);
    this.savePerfCircuit=copyInOut(this.perfCircuit,this.savePerfCircuit);

  }
  
  resetVar(){
    this.saveMsg="";
    this.isFilesToSave=false;
    this.errorMessage="";
    this.errorMsg="";

  }

  actionExclude(event:any){
    this.resetVar();
    this.isManageExclude=false;
    var prevRecord=0;

    var iPerf=0;
    var jLoop=0;
    this.isModifOk=false;
    if (event.target.id==="accept"){
          this.perfCircuit[this.TabOfId[0]].newLoop[this.TabOfId[1]].exclude="";
          this.perfTotalCircuit=reinitTotal(this.TabOfId[1], this.perfCircuit, this.perfTotalCircuit);
    } else if (event.target.id==="delete"){
          this.resetLeg(this.TabOfId[0],this.TabOfId[1]);
          this.perfCircuit[this.TabOfId[0]].newLoop[this.TabOfId[1]].exclude="D";
          this.perfTotalCircuit=reinitTotal(this.TabOfId[1], this.perfCircuit, this.perfTotalCircuit);
    } else if (event.target.id==="exclude"){
        this.perfCircuit[this.TabOfId[0]].newLoop[this.TabOfId[1]].exclude="E";
        this.perfTotalCircuit=reinitTotal(this.TabOfId[1], this.perfCircuit, this.perfTotalCircuit);
    } else if (event.target.id==="restore"){
      this.perfCircuit=copyLegInOut(this.savePerfCircuit,this.perfCircuit,this.TabOfId[0], this.TabOfId[1]);
      this.perfTotalCircuit=reinitTotal(this.TabOfId[1], this.perfCircuit, this.perfTotalCircuit);
    } else if (event.target.id==="search"){
      this.isManageExclude=true;
      this.isNewRecordValid=false;
      if (isNaN(this.formOptions.controls["record"].value)){
          this.errorMsg='record must be a numeric value'
      } else {
        if (this.formOptions.controls["record"].value<this.filePerf.length-1 || this.formOptions.controls["record"].value>-1){
          this.isNewRecordValid=true;
          this.newLat=this.filePerf[this.formOptions.controls["record"].value].lat;
          this.newLon=this.filePerf[this.formOptions.controls["record"].value].lon;
          this.isModifOk=true; 
        } else {
          this.errorMsg="record does not exist"
        }
      }
    } else if (event.target.id==="modFrom" || event.target.id==="modTo"){
      this.isNewRecordValid=false;
      // new lat and lon 
      // dist must be updated for all following milestones
      if (event.target.id==="modFrom"){
          if (this.TabOfId[0]===0 && this.TabOfId[1]===0){
            // first item is updated so no update of previous "to" field

            prevRecord=-1;
          } else if (this.TabOfId[0]===0 && this.TabOfId[1]>0){
            // "to" field is from lat milestone of previous loop
            prevRecord=1;
            iPerf=this.perfCircuit.length-1;
            jLoop=this.TabOfId[1]-1;
            this.perfCircuit[iPerf].newLoop[jLoop].perfRecordTo=Number(this.formOptions.controls["record"].value);
          } else {
            prevRecord=1;
            iPerf=this.TabOfId[0]-1;
            jLoop=this.TabOfId[1];
            this.perfCircuit[iPerf].newLoop[jLoop].perfRecordTo=Number(this.formOptions.controls["record"].value);
          }
          
          this.perfCircuit[this.TabOfId[0]].newLoop[this.TabOfId[1]].perfRecordFrom=Number(this.formOptions.controls["record"].value);
      } else if (event.target.id==="modTo"){
        if (this.TabOfId[0]===this.perfCircuit.length-1 && this.TabOfId[1]===this.perfCircuit[this.TabOfId[0]].newLoop.length-1){
          // last PoR of the table so only field "to" is to be updated
          prevRecord=-1;
        } else  if (this.TabOfId[0]===this.perfCircuit.length-1 && this.TabOfId[1]<this.perfCircuit[this.TabOfId[0]].newLoop.length-1){
          // from field of next leg is on the next loop
          iPerf=0;
          jLoop=this.TabOfId[1]+1;
          prevRecord=1;
          this.perfCircuit[iPerf].newLoop[jLoop].perfRecordFrom=Number(this.formOptions.controls["record"].value);
        } else { // from field of next leg is on the same loop
          iPerf=this.TabOfId[0]+1;
          jLoop=this.TabOfId[1];
          this.perfCircuit[iPerf].newLoop[jLoop].perfRecordFrom=Number(this.formOptions.controls["record"].value);
          prevRecord=1;
        }
        this.perfCircuit[this.TabOfId[0]].newLoop[this.TabOfId[1]].perfRecordTo=Number(this.formOptions.controls["record"].value);
      }
      // modify current fields
      this.perfCircuit[this.TabOfId[0]].newLoop[this.TabOfId[1]].dist=this.filePerf[this.perfCircuit[this.TabOfId[0]].newLoop[this.TabOfId[1]].perfRecordTo].dist -
      this.filePerf[this.perfCircuit[this.TabOfId[0]].newLoop[this.TabOfId[1]].perfRecordFrom].dist;
      this.perfCircuit[this.TabOfId[0]].newLoop[this.TabOfId[1]].theTime=this.filePerf[this.perfCircuit[this.TabOfId[0]].newLoop[this.TabOfId[1]].perfRecordTo].time -
      this.filePerf[this.perfCircuit[this.TabOfId[0]].newLoop[this.TabOfId[1]].perfRecordFrom].time;
      this.perfCircuit[this.TabOfId[0]].newLoop[this.TabOfId[1]].strTime=formatHHMNSS(this.perfCircuit[this.TabOfId[0]].newLoop[this.TabOfId[1]].theTime);
      this.perfCircuit[this.TabOfId[0]].newLoop[this.TabOfId[1]].speed=
              Number(this.perfCircuit[this.TabOfId[0]].newLoop[this.TabOfId[1]].dist)  * 1000 / Number(this.perfCircuit[this.TabOfId[0]].newLoop[this.TabOfId[1]].theTime) * 3.6;
      
      // need to change distance of previous or next item
      if (prevRecord!==-1){
        this.perfCircuit[iPerf].newLoop[jLoop].dist=this.filePerf[this.perfCircuit[iPerf].newLoop[jLoop].perfRecordTo].dist-
        this.filePerf[this.perfCircuit[iPerf].newLoop[jLoop].perfRecordFrom].dist;
        this.perfCircuit[iPerf].newLoop[jLoop].theTime=this.filePerf[this.perfCircuit[iPerf].newLoop[jLoop].perfRecordTo].time-
        this.filePerf[this.perfCircuit[iPerf].newLoop[jLoop].perfRecordFrom].time;
        this.perfCircuit[iPerf].newLoop[jLoop].strTime=formatHHMNSS(this.perfCircuit[iPerf].newLoop[jLoop].theTime);
        this.perfCircuit[iPerf].newLoop[jLoop].speed=Number(this.perfCircuit[iPerf].newLoop[jLoop].dist)  * 1000 / Number(this.perfCircuit[iPerf].newLoop[jLoop].theTime) * 3.6;
      }
      if ((this.TabOfId[0]===0 && this.TabOfId[1]>0) || (this.TabOfId[0]===0 && this.TabOfId[1]===0)){
        // total must be updated for the 2 loops
        if (this.TabOfId[1]>0){
          this.perfTotalCircuit=reinitTotal(jLoop, this.perfCircuit, this.perfTotalCircuit);
          }
        jLoop=this.TabOfId[1];
        this.perfTotalCircuit=reinitTotal(jLoop, this.perfCircuit, this.perfTotalCircuit);
      }
    } 
  }

  testValueModif(event:any){
    // should be a warning ===> CODE NOT COMPLETED
    // verification to be made at time of file saving
    if (event==="modFrom"){
      if (this.TabOfId[0]>0 && this.TabOfId[1]>0 && this.perfCircuit[this.TabOfId[0]-1].newLoop[this.TabOfId[1]].perfRecordFrom>=this.formOptions.controls["record"].value){
        this.errorMsg="Cannot be modified - value entered " + this.formOptions.controls["record"].value + " cannot be smaller than start of previous PoR = " + this.perfCircuit[this.TabOfId[0]-1].newLoop[this.TabOfId[1]].perfRecordFrom;
      } else if (this.TabOfId[0]>0  && this.TabOfId[0]<this.perfCircuit.length-1 && this.perfCircuit[this.TabOfId[0]+1].newLoop[this.TabOfId[1]].perfRecordTo<this.formOptions.controls["record"].value){
        this.errorMsg="Cannot be modified - value entered " + this.formOptions.controls["record"].value + " cannot be greater than end of next PoR = " + this.perfCircuit[this.TabOfId[0]+1].newLoop[this.TabOfId[1]].perfRecordTo;
      } else if (this.perfCircuit[this.TabOfId[0]].newLoop[this.TabOfId[1]].perfRecordTo<this.formOptions.controls["record"].value){
        this.errorMsg="Cannot be modified - value entered " + this.formOptions.controls["record"].value + " cannot be greater than end of current PoR = " + this.perfCircuit[this.TabOfId[0]].newLoop[this.TabOfId[1]].perfRecordTo;
      } else if (this.TabOfId[0]===0 &&this.TabOfId[1]>0 && this.perfCircuit[this.perfCircuit.length-1].newLoop[this.TabOfId[1]-1].perfRecordFrom>=this.formOptions.controls["record"].value){
        this.errorMsg="Cannot be modified - value entered " + this.formOptions.controls["record"].value + " cannot be smaller than start of previous PoR = " + this.perfCircuit[this.perfCircuit.length-1].newLoop[this.TabOfId[1]-1].perfRecordFrom;
      }
    } else if (event==="modTo"){
  
    }
    
  }

  ngOnChanges(changes: SimpleChanges) { 
    console.log("ngOnChanges display-circuit, nbSave="+this.nbSave);
    var callInit=false;
    for (const propName in changes){
      const j=changes[propName];
      if (propName==='nbSave'){
        if (changes[propName].firstChange===false){ 
            if (this.nbSave>=0){
              //this.saveMsg="perf file has been updated";   
              console.log("display-circuit : perf file has been updated"); 
              this.copyToSavePerfCirc(); 
            } else {
              //this.saveMsg="pb with upload - perf file has not been updated";   
              console.log("pb with upload - display-circuit : perf file has not been updated");  
            }
        }
      } else if (propName==='filePerf' || propName==='headerPerf' || propName==='perfCircuit'){
          if (changes[propName].firstChange===false){
              callInit=true;
          }
      }
    }
    if (callInit===true){
      this.ngOnInit();
    }
  }

}
