import { Component, OnInit , Input, Output, HostListener,  OnDestroy, HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject} from '@angular/core';
  
import { DatePipe, formatDate } from '@angular/common'; 

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, UntypedFormControl,FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { Observable } from 'rxjs';

import {msginLogConsole} from '../../consoleLog';
import { configServer, LoginIdentif,  OneBucketInfo,  msgConsole, classCredentials, Bucket_List_Info } from '../../JsonServerClass';
import {classFileSport, classPointOfRef, classNewLoop, classCircuitRec, classFilePerf,classWorkCircuit, classTabPoR, classTotalLoop, classCountryPoR, classHeaderFileSport} from '../classSport';
import { fillHeaderFile, updateTabPor, copyInitPerf, reinitTotal } from '../commonSportFunctions';

import { findIds, formatHHMNSS } from '../../MyStdFunctions';

import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { ManageMongoDBService } from 'src/app/CloudServices/ManageMongoDB.service';

@Component({
  selector: 'app-build-loop-from-perf',
  templateUrl: './build-loop-from-perf.component.html',
  styleUrls: ['./build-loop-from-perf.component.css']
})
export class BuildLoopFromPerfComponent {

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageMongoDBService: ManageMongoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    ) { }
    
  @Input() specificCircuit = new classCircuitRec;
  @Input() filePerf:Array<classFilePerf>=[];
  @Output() savePerf= new EventEmitter<any>();
  @Input() headerPerf= new classHeaderFileSport;
  @Input() nbSave:number=0;
  displayTab:number=1;

// to fwd the change to display-circuit
  loopNbSave:number=0;
  fwdFilePerf:Array<classFilePerf>=[];
  fwdHeaderPerf= new classHeaderFileSport;
//

  perfCircuitRef:Array<any>=[];
  initPerfPoR:Array<classTabPoR>=[];

  errMsg:string="";

  isInitFileEnded:boolean=false;

  ngOnInit(){
    console.log("ngOnInit(); specificCircuit.points.length="+this.specificCircuit.points.length);

    this.initPerfPoR= updateTabPor(this.filePerf);
    
    if (this.initPerfPoR.length>0){
      this.circuitPerfPoR();
      /*
      this.perfTotalCircuit.splice(0,this.perfTotalCircuit.length);
      this.perfTotalCircuit.push({newLoop:[]});
      for (var iLoop=0; iLoop<this.perfCircuitRef[0].newLoop.length; iLoop++){
          this.perfTotalCircuit[0].newLoop.push({dist:0, theTime:0, speed:0, strTime:"", from:"",to:""});
          this.perfTotalCircuit=reinitTotal(iLoop,this.perfCircuitRef, this.perfTotalCircuit);
      }
      */
      //this.savePerfCircuitRef=this.perfCircuitRef;
      this.isInitFileEnded=true;
      this.fwdFilePerf=this.filePerf;
      this.fwdHeaderPerf=this.headerPerf;
    } else {
        this.errMsg="No Point Of References found in the perf file " + this.headerPerf.name;
        console.log('this.errMsg=' + this.errMsg.length);
    }
    
  }

  circuitPerfPoR(){
    var iLeg=0;
    var i=0;
    var j=0;
    var k=0;
    this.perfCircuitRef.splice(0,this.perfCircuitRef.length);
    // build the circuit (loops) == perfCircuitRef ==from the PoR stored in perfFile without checkiing any distance
    // select only the legs which are in the circuit record (this.specificCircuit.points)
    for (j=0; j<this.specificCircuit.points.length; j++){
      this.perfCircuitRef.push({newLoop:[]});
      const classLoop=new classNewLoop;
      this.perfCircuitRef[j].newLoop.push(classLoop);
      this.perfCircuitRef[j].newLoop[0].from = this.specificCircuit.points[j].ref;
      if (j<this.specificCircuit.points.length-1){
        this.perfCircuitRef[j].newLoop[0].to = this.specificCircuit.points[j+1].ref;
      } else {
        this.perfCircuitRef[j].newLoop[0].to = this.specificCircuit.points[0].ref;
      }
      
    }
  
    j=0;
    for (i=0; i<this.initPerfPoR.length; i++){
      
      for (j=j; j< this.specificCircuit.points.length && this.specificCircuit.points[j].ref!==this.initPerfPoR[i].content.refPoR; j++){}
      if (j< this.specificCircuit.points.length){
        // PoR is found so update perfCircuitRef
        // check the first available loop
        //for (k=0; k<this.perfCircuitRef[j].newLoop.length && this.perfCircuitRef[j].newLoop[k].dist===0; k++){}
        if (this.perfCircuitRef[j].newLoop[this.perfCircuitRef[j].newLoop.length-1].dist!==0){      
          // create a new loop for each leg 
          for (iLeg=0; iLeg<this.specificCircuit.points.length; iLeg++){
            const classLoop=new classNewLoop;
            this.perfCircuitRef[iLeg].newLoop.push(classLoop);
          }
        }
        //this.copyInitPerf(j,this.perfCircuitRef[j].newLoop.length-1,i);
        copyInitPerf(j,this.perfCircuitRef[j].newLoop.length-1,i,this.perfCircuitRef,this.initPerfPoR);
      } else  if (i<this.initPerfPoR.length-1 && j===this.specificCircuit.points.length){
        for (iLeg=0; iLeg<this.specificCircuit.points.length; iLeg++){
          const classLoop=new classNewLoop;
          this.perfCircuitRef[iLeg].newLoop.push(classLoop);
        }
        for (j=0; j< this.specificCircuit.points.length && this.specificCircuit.points[j].ref!==this.initPerfPoR[i].content.refPoR; j++){}
        if (j< this.specificCircuit.points.length){
          copyInitPerf(j,this.perfCircuitRef[j].newLoop.length-1,i,this.perfCircuitRef,this.initPerfPoR);
          //this.copyInitPerf(j,this.perfCircuitRef[j].newLoop.length-1,i);
        }
      }
      if (j === this.specificCircuit.points.length-1 && i<this.initPerfPoR.length-1){
        for (iLeg=0; iLeg<this.specificCircuit.points.length; iLeg++){
          const classLoop=new classNewLoop;
          this.perfCircuitRef[iLeg].newLoop.push(classLoop);
        }
        j=0;
      }
  
    }

    for (i=0; i<this.perfCircuitRef.length; i++){
        for (j=0; j<this.perfCircuitRef[i].newLoop.length; j++){
          if (j===this.perfCircuitRef[i].newLoop.length-1 && i===this.perfCircuitRef.length-1){
  
          } else if (j<this.perfCircuitRef[i].newLoop.length-1 && i===this.perfCircuitRef.length-1){
            //this.perfCircuitRef[i].newLoop[j].to=this.perfCircuitRef[0].newLoop[j+1].from;
            this.perfCircuitRef[i].newLoop[j].perfRecordTo=this.perfCircuitRef[0].newLoop[j+1].perfRecordFrom;
          }  else  {
              //this.perfCircuitRef[i].newLoop[j].to=this.perfCircuitRef[i+1].newLoop[j].from;
              this.perfCircuitRef[i].newLoop[j].perfRecordTo=this.perfCircuitRef[i+1].newLoop[j].perfRecordFrom;
              
          } 
          if (this.perfCircuitRef[i].newLoop[j].perfRecordFrom !==0 && this.perfCircuitRef[i].newLoop[j].perfRecordTo !==0){
              this.perfCircuitRef[i].newLoop[j].dist = this.filePerf[this.perfCircuitRef[i].newLoop[j].perfRecordTo].dist -
                  this.filePerf[this.perfCircuitRef[i].newLoop[j].perfRecordFrom].dist;
              this.perfCircuitRef[i].newLoop[j].theTime = this.filePerf[this.perfCircuitRef[i].newLoop[j].perfRecordTo].time -
                  this.filePerf[this.perfCircuitRef[i].newLoop[j].perfRecordFrom].time; 
              this.perfCircuitRef[i].newLoop[j].strTime = formatHHMNSS(this.perfCircuitRef[i].newLoop[j].theTime);
              this.perfCircuitRef[i].newLoop[j].speed = this.perfCircuitRef[i].newLoop[j].dist * 1000 / this.perfCircuitRef[i].newLoop[j].theTime * 3.6;
            }
        }
    }

    var iLoop=this.perfCircuitRef[0].newLoop.length-1;
    for (i=1; i<this.perfCircuitRef.length && this.perfCircuitRef[i].newLoop[iLoop].perfRecordFrom===0 ; i++){}
    if (i===this.perfCircuitRef.length){
      // delete the last loop
      for (i=0; i<this.perfCircuitRef.length  ; i++){
        this.perfCircuitRef[i].newLoop.splice(iLoop,1);
      }
    }
  }

  fwdSavePerf(event:any){
    this.savePerf.emit(event);
  }


  ngOnChanges(changes: SimpleChanges) { 
    console.log("ngOnChanges build-loop, nbSave="+this.nbSave + " loopNbSave="+this.loopNbSave);
    
    for (const propName in changes){
      const j=changes[propName];
      if (propName==='nbSave'){
         if (changes[propName].firstChange===false){ 
                console.log("build-loop : perf file has been updated");   
                this.loopNbSave=this.nbSave;
            }
        } else if (propName==='filePerf' || propName==='specificCircuit'){
          if (changes[propName].firstChange===false){
              this.ngOnInit();
          }
                
        }
        
      }
  }
}
