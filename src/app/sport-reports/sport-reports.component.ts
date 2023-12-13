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


@Component({
  selector: 'app-sport-reports',
  templateUrl: './sport-reports.component.html',
  styleUrls: ['./sport-reports.component.css']
})



export class SportReportsComponent {

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
    //circuitPORNew:Array<any>=[];
    circuitPOR:Array<any>=[];
    tabCircuit:Array<any>=[];
    perfCircuit:Array<any>=[];
    savePerfCircuit:Array<any>=[];
    perfTotalCircuit:Array<any>=[];
    
    subTotalLoop:Array<any>=[];
    tabManageLoop:Array<string>=[];
    nbItemsLoop:number=-1;

    specificCircuit= new classCircuitRec;

    filePerf:Array<classFilePerf>=[];

    selectionCircuit:boolean=false;
    isPerfRetrieved:boolean=false;

    EventHTTPReceived:Array<boolean>=[];
    maxEventHTTPrequest:number=20;
    idAnimation:Array<number>=[];
    TabLoop:Array<number>=[];
    NbWaitHTTP:number=0;

    errorMessage:string="";
  
    formOptions: FormGroup = new FormGroup({ 
      fileName: new FormControl("", { nonNullable: true }),
      record: new FormControl("", { nonNullable: true }),


    })

    newLat:number=0;
    newLon:number=0;
    isFilePerfReceived:boolean=false;
    isSpecificCircuitReceived:boolean=false;
    isFilesToSave:boolean=false;

    TabOfId:Array<any>=[];
    strFound:string="";
   
    errorMsg:string="";
    isPerfCircuitRetrieved:number=0;

    maxWidthTable:number=0;
    widthTable:number=0;

    //****************************** */
   

ngOnInit(){
/****
  this.ManageGoogleService.insertCacheFile(this.configServer,this.identification.circuits.file)
    .subscribe((data ) => {  
          console.log('insertCacheFile ==> OK');
      },
      err => {
          console.log('error on insertCacheFile :'+ JSON.stringify(err));
      });

  //this.GetRecord(this.identification.circuits.bucket, this.identification.circuits.file,1);

  */ 
  
}

resetTab(){
  this.circuitPOR.splice(0,this.circuitPOR.length);
  this.tabCircuit.splice(0,this.tabCircuit.length);
  this.perfTotalCircuit.splice(0,this.perfTotalCircuit.length);
  this.perfCircuit.splice(0,this.perfCircuit.length);
  this.tabManageLoop.splice(this.tabManageLoop.length);
  this.tabExclDel.splice(this.tabExclDel.length);
}
resetVar(){
  this.saveMsg="";
  this.isFilesToSave=false;
  this.errorMessage="";
  this.errorMsg="";
}

onSelectPerf(event:any){
  // console.log('sport-reports; name of the perfFile is '+event.name + '  and length of the file is ' +  this.filePerf.length)
  
  this.isPerfCircuitRetrieved=0;
  this.resetVar();
  this.resetTab();
  this.theFile=event.file;
  this.filePerf.splice(0,this.filePerf.length);
  this.filePerf=event.file.content;
  this.nameFilePerf=event.name;
  this.isPerfRetrieved=false;
  this.isFilePerfReceived=true;
  this.scroller.scrollToAnchor('bottomPage');
}

onSelectCircuit(event:any){
  
  this.isPerfCircuitRetrieved=0;
  this.resetVar();
  this.resetTab();
  this.specificCircuit.points.splice(0,this.specificCircuit.points.length);
  this.specificCircuit=event;
  this.selectionCircuit=false;
  this.isSpecificCircuitReceived=true;
  this.scroller.scrollToAnchor('bottomPage');
}

onActionPerf(event:any){
  if (event.target.id==="PerfYes"){
    this.isPerfRetrieved=true;
    this.resetVar();
  } else if (event.target.id==="PerfNo"){
    this.isPerfRetrieved=false;
  } else if (event.target.id==="CircuitYes"){
    this.resetVar();
    this.selectionCircuit=true;
  } else if (event.target.id==="CircuitNo"){
    this.selectionCircuit=false;
  }
  this.scroller.scrollToAnchor('bottomPage');
}


retrievePerfCircuit(resp:string){
  this.resetVar();
  if (resp==="Yes"){
    this.isFilesToSave=false;
    this.saveMsg="";
    this.errorMsg="";
    var j=1;
    j=this.theFile.theDate.indexOf('/');
    if (j!==-1){
      this.theFile.theDate=this.theFile.theDate.substring(0,j)+this.theFile.theDate.substring(j+1);
    }
    const fileName = this.theFile.sport.substring(0,1).toUpperCase() +'-' +this.specificCircuit.code +'-'+ 'perf-' + this.theFile.theDate + this.nameFilePerf.substring(0,35);
    this.ManageGoogleService.getContentObject(this.configServer, 'xmv-sport-analysis',  fileName)
        .subscribe(
            data => {
              this.isPerfCircuitRetrieved=1;
              this.theFile=data;
              this.perfCircuit.splice(0,this.perfCircuit.length);
              this.perfCircuit=this.theFile.content;
              this.perfTotalCircuit.splice(0,this.perfTotalCircuit.length);
              this.perfTotalCircuit.push({newLoop:[]});
              for (var i=0; i<this.perfCircuit[0].newLoop.length; i++){
                this.perfTotalCircuit[0].newLoop.push({dist:0, theTime:0, speed:0, strTime:"", from:"",to:""});
                this.reinitTotal(i);
                this.tabManageLoop[i]=this.perfCircuit[0].newLoop[i].loopDel;
                if (this.tabManageLoop[i]==="D" || this.tabManageLoop[i]==="E"){
                  this.tabExclDel[i]="D";
                }
              }
              this.savePerfCircuit.splice(0,this.savePerfCircuit.length);
              this.copyInOut(this.perfCircuit,this.savePerfCircuit);
              this.fnSizeTable();
            },
            err=>{
              this.isPerfCircuitRetrieved=2;
              this.errorMsg=" PerfCircuit file " + fileName + " not found";
            })
  } else {
    this.isPerfCircuitRetrieved=3;
  }
}

onCalculatePerf(){
    var theRef=0;
    var newDist=0;
    var iTab=-1; 
    var iFind =0;
    var posGap=0;
    var j=0;
    var i=0;
    const nbDec=10000;
    const initPosGap=2;
    var gapLon=0.00002
    const refGapLon=0.0001;
    const refGapLat=0.0002;
    var loopGap=1;
    const maxGap=8;
    var bestRow=0;
    this.resetTab();
    this.circuitPOR.splice(0,this.circuitPOR.length);
    var refStartPoint = 0;
    this.isFilesToSave=false;
    // search the first point of reference
    for (j=0; j<this.filePerf.length && refStartPoint===0; j++){
        i=0;
        var iValue=-1;
        iFind = this.specificCircuit.points[i].lon.toString().indexOf('.');
        const specLon = Number(this.specificCircuit.points[i].lon.toString().substring(0,iFind+7));
        iFind = this.specificCircuit.points[i].lat.toString().indexOf('.');
        const specLat = Number(this.specificCircuit.points[i].lat.toString().substring(0,iFind+7));

        if ((this.specificCircuit.points[i].prio === "lat" && 
          specLat - this.specificCircuit.points[i].varLat <= this.filePerf[j].lat &&
          specLat + this.specificCircuit.points[i].varLat >= this.filePerf[j].lat) ||
          (this.specificCircuit.points[i].prio === "lon" && 
          specLon - this.specificCircuit.points[i].varLon <= this.filePerf[j].lon &&
          specLon + this.specificCircuit.points[i].varLon >= this.filePerf[j].lon)){
            if ((this.specificCircuit.points[i].prio === "lat" && 
              specLon - this.specificCircuit.points[i].varLon <= this.filePerf[j].lon &&
              specLon + this.specificCircuit.points[i].varLon >= this.filePerf[j].lon) ||
              (this.specificCircuit.points[i].prio === "lon" && 
              specLat - this.specificCircuit.points[i].varLat <= this.filePerf[j].lat &&
              specLat + this.specificCircuit.points[i].varLat >= this.filePerf[j].lat)){
                
                  refStartPoint = j;
                  const classWork=new classWorkCircuit;
                  this.circuitPOR.push(classWork); // value contains all the records foundin perfFile corresponding to the PoR
                  this.circuitPOR[this.circuitPOR.length-1].name=this.specificCircuit.points[i].ref;
                  this.circuitPOR[this.circuitPOR.length-1].spec=i;
                  this.circuitPOR[this.circuitPOR.length-1].value[0]=j;
                  this.circuitPOR[this.circuitPOR.length-1].dist[0]=this.specificCircuit.dist[0];
                  this.circuitPOR[this.circuitPOR.length-1].exclude[0]="";
  
            }
        }
    }
    // *** IF NOT FOUND STOP THE PROCESS AND DISPLAY ERROR MESSAGE

    // find eachPoR based on distance
  if (j<this.filePerf.length){
        var iLoop=-1;
        for (var jRow=0; jRow<this.filePerf.length; jRow++){
          iLoop++
          
          for ( var iRef=0; iRef<this.specificCircuit.points.length && jRow<this.filePerf.length; iRef++){
            
            this.circuitPOR[iRef].dist[iLoop]=this.specificCircuit.dist[iRef];
            // find the next item as per the distance
          
            newDist = 0
            for (theRef=0; theRef < iRef; theRef++){
                newDist = newDist + this.circuitPOR[theRef].dist[this.circuitPOR[theRef].dist.length-1] - this.specificCircuit.dist[theRef];
                theRef = theRef + 1
              }
            if (newDist > 0){
                newDist = newDist + this.specificCircuit.dist[theRef];
            } else {
                newDist = this.specificCircuit.dist[theRef];
            }


            if (iRef < this.specificCircuit.points.length-1) {
              theRef=iRef+1
            } else { 
              theRef=0;
            }
            bestRow=0;
            for (var k=jRow; k<this.filePerf.length && this.filePerf[k].dist - this.filePerf[this.circuitPOR[iRef].value[iLoop]].dist <= this.specificCircuit.dist[iRef]; k++){

              if ((Math.abs(this.filePerf[k].lat - this.specificCircuit.points[theRef].lat) <= this.specificCircuit.points[theRef].varLat)
                      && (Math.abs(this.filePerf[k].lon - this.specificCircuit.points[theRef].lon) <= this.specificCircuit.points[theRef].varLon)){
                  if (bestRow = 0) {
                      bestRow = k;
                  } else {
              
                        if ((Math.abs(this.filePerf[k].lat - this.specificCircuit.points[theRef].lat) <= Math.abs(this.filePerf[bestRow].lat - this.specificCircuit.points[theRef].lat)) 
                                  && (Math.abs(this.filePerf[k].lon - this.specificCircuit.points[theRef].lon) <= Math.abs(this.filePerf[bestRow].lon - this.specificCircuit.points[theRef].lon))) {
                                  bestRow = k;
                        }
                  }
              }

            }

            if (bestRow !==0){
              k = bestRow;
            }

            // check then which piont is the closest from a lat-lon point of view
            const interval = 10;
            jRow = k - interval;
            var selRow = k - interval + 1;
            for (var jInt=0; jInt<interval * 3 && jRow<this.filePerf.length; jInt++){

                if (iRef<this.specificCircuit.points.length-1){
                  var valRef=iRef+1;
                } else {
                  valRef=0;
                }
                if (this.specificCircuit.points[valRef].prio === "lat"){
                  if (Math.abs(this.filePerf[jRow].lat - this.specificCircuit.points[valRef].lat) < 
                      Math.abs(this.filePerf[selRow].lat - this.specificCircuit.points[valRef].lat)) {
                        selRow = jRow;
                      }
                                    
                } else if (this.specificCircuit.points[valRef].prio === "lon"){
                  if (Math.abs(this.filePerf[jRow].lon - this.specificCircuit.points[valRef].lon) < 
                      Math.abs(this.filePerf[selRow].lon - this.specificCircuit.points[valRef].lon)) {
                        selRow = jRow;
                      }
                                    
                }
                jRow++
            }

              if (selRow<this.filePerf.length){
                var exclude=false;
                if (iLoop===0 && iRef!==this.specificCircuit.points.length-1){
                  const classWork=new classWorkCircuit;
                  this.circuitPOR.push(classWork); // value contains all the records foundin perfFile corresponding to the PoR
                  this.circuitPOR[this.circuitPOR.length-1].name=this.specificCircuit.points[this.circuitPOR.length-1].ref;
                  this.circuitPOR[this.circuitPOR.length-1].spec=this.circuitPOR.length-1;
                  this.circuitPOR[this.circuitPOR.length-1].dist[0]=this.specificCircuit.dist[this.circuitPOR.length-1];
                  this.circuitPOR[this.circuitPOR.length-1].exclude[0]="";
                }
                //if (exclude===false){
                if ( iRef===this.specificCircuit.points.length-1){
                    this.circuitPOR[0].value[iLoop+1]=selRow;
                    theRef=0;
                } else {
                    this.circuitPOR[iRef+1].value[iLoop]=selRow;
                    theRef=iRef+1;
                }
                this.circuitPOR[iRef].dist[iLoop]=this.filePerf[selRow].dist  - this.filePerf[this.circuitPOR[iRef].value[iLoop]].dist;
                //}   

                if (this.specificCircuit.points[theRef].prio === "lat" && this.filePerf[selRow].lat!==0){
                  if (Math.abs(this.filePerf[selRow].lat - this.specificCircuit.points[theRef].lat) > 0.00035){
                    // this.circuitPOR[i].value.splice(iLoop,1);
                    this.circuitPOR[theRef].exclude[iLoop]="E";
                    exclude=true;
                  }
                } else if (this.specificCircuit.points[theRef].prio === "lon" && this.filePerf[selRow].lon!==0){
                  if (Math.abs(this.filePerf[selRow].lon - this.specificCircuit.points[theRef].lon) > 0.00035){
                    //this.circuitPOR[i].value.splice(iLoop,1);
                    this.circuitPOR[theRef].exclude[iLoop]="E";
                    exclude=true;
                  }
                }
                if (exclude===false){
                  this.circuitPOR[theRef].exclude[iLoop]="";
                }
              }
          }
        }
        this.sortCircuit();
        //this.onSaveFile();
  } else {
    this.errorMessage="start point not found; restart your selection";
    this.isPerfRetrieved=false;
    this.selectionCircuit=false;
    this.isSpecificCircuitReceived=false;
    this.filePerf.splice(0, this.filePerf.length);
  }
  console.log('halt');
  /*
  var trouve = false;
  j=this.circuitPOR[0].value.length-1;
  for (var i=this.circuitPOR.length-1; i>-1 && trouve === false; i--){

      //for (j=this.circuitPOR[i].value.length-1 ; j>-1 ; j--){
      if (j===this.circuitPOR[i].value.length-1){
        if (this.specificCircuit.points[i].prio === "lat" && this.filePerf[this.circuitPOR[i].value[j]].lat!==0){
            if (Math.abs(this.filePerf[this.circuitPOR[i].value[j]].lat - this.specificCircuit.points[i].lat) > 0.00035){ // 0.00035
              //this.circuitPOR[i].value.splice(j,1);
              trouve = true;  
            }
        } else if (this.specificCircuit.points[i].prio === "lon" && this.filePerf[this.circuitPOR[i].value[j]].lon!==0){
            if (Math.abs(this.filePerf[this.circuitPOR[i].value[j]].lon - this.specificCircuit.points[i].lon) > 0.00035){ // 0.00035
              //this.circuitPOR[i].value.splice(j,1);
              trouve = true;
          }
        }
      }
      //}
  }

  if (trouve===true){
    j=this.circuitPOR[0].value.length-1;
    for (var i=this.circuitPOR.length-1; i>0; i--){
      if (j===this.circuitPOR[i].value.length-1){
        this.circuitPOR[i].value.splice(j,1);
      }
    }
  }
  */

this.scroller.scrollToAnchor('bottomPage');



}



sortCircuit(){
  var i=0;
  var j=0;
  var k=0;
  var l=0; 
  var loopLen=0;
  var tabLen=0;
  var totalLoop=1;
  var iTotal=-1;
  var saveValue=-1;
  var highValue=0;
  var iHighValue=0;
  var jHighValue=0;

  // create last record
  const classWork=new classWorkCircuit;
  this.circuitPOR.push(classWork);
  i=this.circuitPOR.length-1;
  this.circuitPOR[i].name="end loop";

  // create tabCircuit
  for ( i=0; i<this.circuitPOR.length; i++){
    for ( j=0; j<this.circuitPOR[i].value.length; j++){
      if (this.circuitPOR[i].exclude.length>j && 
        this.circuitPOR[i].dist.length>j){
        for ( k=0; k<this.tabCircuit.length && (this.tabCircuit[k].name !== this.circuitPOR[i].name || 
          this.tabCircuit[k].record !== this.circuitPOR[i].value[j]); k++){
        }
        if (k===this.tabCircuit.length ){
          // circuit not found; create it
          this.tabCircuit.push({name:"", spec:0, record:0, exclude:""});
          this.tabCircuit[this.tabCircuit.length-1].name=this.circuitPOR[i].name;
          this.tabCircuit[this.tabCircuit.length-1].spec=this.circuitPOR[i].spec;
          this.tabCircuit[this.tabCircuit.length-1].record = this.circuitPOR[i].value[j];
          this.tabCircuit[this.tabCircuit.length-1].exclude = this.circuitPOR[i].exclude[j];
        }
      }
    }
  }
  // sort the PoR based on the record numbers found in filePerf
  this.tabCircuit.sort((a, b) => (a.record < b.record) ? -1 : 1);
  //console.log('the end');
  this.nbItemsLoop=-1;
  for (i=1; i<this.tabCircuit.length; i++){

    if (this.tabCircuit[i-1].name!=="end loop"){

          var trouve=false;
          if (this.perfCircuit.length>0){
            
            for (l=this.perfCircuit.length-1;  l>=0 && trouve===false; l--){
              for (var k=0; k < this.perfCircuit[l].newLoop.length &&  this.perfCircuit[l].newLoop[k].from !== this.tabCircuit[i-1].name &&  this.perfCircuit[l].newLoop[k].to!==this.tabCircuit[i].name; k++){
              }
              if (k < this.perfCircuit[l].newLoop.length){
                trouve=true;
                l++
              }
            }
          }
          if (trouve===false && this.nbItemsLoop>1){
              this.perfCircuit.push({newLoop:[]});
              const iCheck=this.perfCircuit.length-1;
              for (var j=0; j<this.nbItemsLoop; j++){
                const classLoop=new classNewLoop;
                this.perfCircuit[iCheck].newLoop.push(classLoop);
              }
              this.perfCircuit[iCheck].newLoop[0].from=this.tabCircuit[i-1].name;
              this.perfCircuit[iCheck].newLoop[0].to=this.tabCircuit[i].name;
              trouve=true;
              l=iCheck;
              k=this.nbItemsLoop-1;
          }

          if (trouve===true ){
            const classLoop=new classNewLoop;
            for (var iCheck=this.perfCircuit[l].newLoop.length-1; this.perfCircuit[l].newLoop.length<this.nbItemsLoop && iCheck>0 ; iCheck--){
              this.perfCircuit[l].newLoop.push(classLoop);
            }
            this.perfCircuit[l].newLoop.push(classLoop);
            tabLen=l;
            loopLen=this.perfCircuit[l].newLoop.length-1;
            var theLoop=loopLen;
            this.perfCircuit[tabLen].newLoop[loopLen].loop=theLoop;
            this.perfCircuit[tabLen].newLoop[loopLen].dist = this.filePerf[this.tabCircuit[i].record].dist - this.filePerf[this.tabCircuit[i-1].record].dist;
            this.perfCircuit[tabLen].newLoop[loopLen].theTime = this.filePerf[this.tabCircuit[i].record].time - this.filePerf[this.tabCircuit[i-1].record].time;
            this.perfCircuit[tabLen].newLoop[loopLen].speed = this.perfCircuit[tabLen].newLoop[loopLen].dist * 1000 / this.perfCircuit[tabLen].newLoop[loopLen].theTime * 3.6; 
            this.perfCircuit[tabLen].newLoop[loopLen].strTime=formatHHMNSS(this.perfCircuit[tabLen].newLoop[loopLen].theTime);
            this.perfCircuit[tabLen].newLoop[loopLen].from=this.tabCircuit[i-1].name;
            this.perfCircuit[tabLen].newLoop[loopLen].to=this.tabCircuit[i].name;
            this.perfCircuit[tabLen].newLoop[loopLen].perfRecordFrom = this.tabCircuit[i-1].record;
            this.perfCircuit[tabLen].newLoop[loopLen].perfRecordTo = this.tabCircuit[i].record;
            this.perfCircuit[tabLen].newLoop[loopLen].exclude = this.tabCircuit[i].exclude;
          } else {
            this.perfCircuit.push({newLoop:[]});
            tabLen=this.perfCircuit.length-1;
            const classLoop=new classNewLoop;
            this.perfCircuit[tabLen].newLoop.push(classLoop);
            const loopLen=this.perfCircuit[tabLen].newLoop.length-1;
            this.perfCircuit[tabLen].newLoop[loopLen].dist = this.filePerf[this.tabCircuit[i].record].dist - this.filePerf[this.tabCircuit[i-1].record].dist;
            this.perfCircuit[tabLen].newLoop[loopLen].theTime = this.filePerf[this.tabCircuit[i].record].time - this.filePerf[this.tabCircuit[i-1].record].time;
            this.perfCircuit[tabLen].newLoop[loopLen].speed = this.perfCircuit[tabLen].newLoop[loopLen].dist * 1000 / this.perfCircuit[tabLen].newLoop[loopLen].theTime * 3.6; 
            this.perfCircuit[tabLen].newLoop[loopLen].strTime=formatHHMNSS(this.perfCircuit[tabLen].newLoop[loopLen].theTime);
            this.perfCircuit[tabLen].newLoop[loopLen].from=this.tabCircuit[i-1].name;
            this.perfCircuit[tabLen].newLoop[loopLen].to=this.tabCircuit[i].name;
            this.perfCircuit[tabLen].newLoop[loopLen].perfRecordFrom = this.tabCircuit[i-1].record;
            this.perfCircuit[tabLen].newLoop[loopLen].perfRecordTo = this.tabCircuit[i].record;
            this.perfCircuit[tabLen].newLoop[loopLen].exclude = this.tabCircuit[i].exclude;
            this.perfCircuit[tabLen].newLoop[loopLen].loop = loopLen;

          }
      }
              
    }


  for (i=1; i<this.perfCircuit.length; i++){
    for (j=this.perfCircuit[i].newLoop.length; j<this.perfCircuit[0].newLoop.length; j++){
        const classLoop=new classNewLoop;
        this.perfCircuit[i].newLoop.push(classLoop);
    }
  }

  this.perfTotalCircuit.push({newLoop:[]});
  for (i=0; i<this.perfCircuit[0].newLoop.length; i++){
    this.perfTotalCircuit[0].newLoop.push({dist:0, theTime:0, speed:0, strTime:"", from:"",to:""});
    this.reinitTotal(i);
    this.tabManageLoop[i]="";
    this.tabExclDel[i]==="";
  }
  

  this.savePerfCircuit.splice(0,this.savePerfCircuit.length);
  this.copyInOut(this.perfCircuit,this.savePerfCircuit);
  this.fnSizeTable();

}

fnSizeTable(){
  this.widthTable=this.perfTotalCircuit[0].newLoop.length * 80 + 200;
  if (this.widthTable<700){
    this.maxWidthTable=this.widthTable;
  }
  else {
    this.maxWidthTable=700;
  }
}

reInitialisePerf(){
  this.perfCircuit.splice(0,this.perfCircuit.length);
  this.copyInOut(this.savePerfCircuit,this.perfCircuit);
  for (var i=0; i<this.perfCircuit[0].newLoop.length; i++){
    this.reinitTotal(i);
  }
}

copyInOut(inFile:any, outFile:any){

  for (var i=0; i<inFile.length; i++){
    const theClass = {newLoop:[]};
    outFile.push(theClass);
    for (var j=0; j<inFile[i].newLoop.length; j++){
      const classLoop=new classNewLoop;
      outFile[i].newLoop.push(classLoop);
      this.copyLegInOut(inFile,outFile,i,j);
    }
  }
}

copyLoopInOut(inFile:any, outFile:any, jLoop:number){
  for (var i=0; i<inFile.length; i++){
      this.copyLegInOut(inFile,outFile,i,jLoop);
  }
}

copyLegInOut(inFile:any, outFile:any, iLeg:number,jLoop:number){

    outFile[iLeg].newLoop[jLoop].dist=inFile[iLeg].newLoop[jLoop].dist;
    outFile[iLeg].newLoop[jLoop].exclude=inFile[iLeg].newLoop[jLoop].exclude;
    outFile[iLeg].newLoop[jLoop].from=inFile[iLeg].newLoop[jLoop].from;
    outFile[iLeg].newLoop[jLoop].to=inFile[iLeg].newLoop[jLoop].to;
    outFile[iLeg].newLoop[jLoop].oop=inFile[iLeg].newLoop[jLoop].loop;
    outFile[iLeg].newLoop[jLoop].loopDel=inFile[iLeg].newLoop[jLoop].loopDel;
    outFile[iLeg].newLoop[jLoop].perfRecordFrom=inFile[iLeg].newLoop[jLoop].perfRecordFrom;
    outFile[iLeg].newLoop[jLoop].perfRecordTo=inFile[iLeg].newLoop[jLoop].perfRecordTo;
    outFile[iLeg].newLoop[jLoop].speed=inFile[iLeg].newLoop[jLoop].speed;
    outFile[iLeg].newLoop[jLoop].strTime=inFile[iLeg].newLoop[jLoop].strTime;
    outFile[iLeg].newLoop[jLoop].theTime=inFile[iLeg].newLoop[jLoop].theTime;


}


syncScrollBar(event:any){
  if (event.srcElement.scrollLeft!==undefined){
    var elem1=document.getElementById("scroll-1");
    var elem3=document.getElementById("scroll-3");
    if (elem1!==null){
      elem1.scrollLeft=event.srcElement.scrollLeft;
    }
    if (elem3!==null){
      elem3.scrollLeft=event.srcElement.scrollLeft;

    }
  }
}

isManageExclude:boolean=false;
excludeItem:number=0;
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

isModifOk:boolean=false;
isNewRecordValid:boolean=false;
actionExclude(event:any){
  this.resetVar();
  this.isManageExclude=false;
  var prevRecord=0;
  var nextRecord=0;

  var newFrom=0;
  var newTo=0;

  var iPerf=0;
  var jLoop=0;
  this.isModifOk=false;
  if (event.target.id==="accept"){
        this.perfCircuit[this.TabOfId[0]].newLoop[this.TabOfId[1]].exclude="";
        this.reinitTotal(this.TabOfId[1]);
  } else if (event.target.id==="delete"){
        this.resetLeg(this.TabOfId[0],this.TabOfId[1]);
        this.reinitTotal(this.TabOfId[1]);
  } else if (event.target.id==="exclude"){
      this.perfCircuit[this.TabOfId[0]].newLoop[this.TabOfId[1]].exclude="E";
      this.reinitTotal(this.TabOfId[1]);
  } else if (event.target.id==="restore"){
      this.copyLegInOut(this.savePerfCircuit,this.perfCircuit,this.TabOfId[0], this.TabOfId[1]);
      this.reinitTotal(this.TabOfId[1]);
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
          this.reinitTotal(jLoop);
        }
      jLoop=this.TabOfId[1];
      this.reinitTotal(jLoop);
    }
  } 
}

testValueModif(event:any){
  // should be warning
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

reinitTotal(jLoop:number){

  var theLoop=0;
  this.perfTotalCircuit[0].newLoop[jLoop].dist=0;
  this.perfTotalCircuit[0].newLoop[jLoop].theTime=0;
  for (theLoop=0; theLoop<this.perfCircuit.length; theLoop++){
    if (jLoop<this.perfCircuit[theLoop].newLoop.length){
        if (this.perfCircuit[theLoop].newLoop[jLoop].exclude===""){
          this.perfTotalCircuit[0].newLoop[jLoop].dist= this.perfTotalCircuit[0].newLoop[jLoop].dist + this.perfCircuit[theLoop].newLoop[jLoop].dist;
          this.perfTotalCircuit[0].newLoop[jLoop].theTime= this.perfTotalCircuit[0].newLoop[jLoop].theTime + this.perfCircuit[theLoop].newLoop[jLoop].theTime;
        }
    }
  }
  this.perfTotalCircuit[0].newLoop[jLoop].strTime=formatHHMNSS(this.perfTotalCircuit[0].newLoop[jLoop].theTime);
  this.perfTotalCircuit[0].newLoop[jLoop].speed=this.perfTotalCircuit[0].newLoop[jLoop].dist * 1000 / this.perfTotalCircuit[0].newLoop[jLoop].theTime * 3.6;

}
  

isActionDisplay:boolean=false;
selectedLoop:number=0;
actionDisplay:Array<string>=["Cancel","Exclude","Delete","Restore"]
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
          this.tabExclDel[this.selectedLoop]="D";
        };
      } else  if (Number(event.target.id.substring(7))===2){ // Delete
            for (var i=0; i<this.perfCircuit.length; i++){
              this.resetLeg(i,this.selectedLoop);
            }
            this.reinitTotal(this.selectedLoop);
            this.tabManageLoop[this.selectedLoop]="D";
            this.tabExclDel[this.selectedLoop]="D";
      } else  if (Number(event.target.id.substring(7))===3){ // Restore
            for (var i=0; i<this.perfCircuit.length; i++){
              this.copyLoopInOut(this.savePerfCircuit,this.perfCircuit,this.selectedLoop);  
            }
            this.reinitTotal(this.selectedLoop);
            this.tabManageLoop[this.selectedLoop]="";
            this.tabExclDel[this.selectedLoop]="";
      } else {
            this.tabManageLoop[this.selectedLoop]="";
            this.tabExclDel[this.selectedLoop]="";
      }
        
  }
  
  
}
tabExclDel:Array<string>=[];

nbSavedFiles:number=0;
saveMsg:string="";
onSaveFile(){
  this.saveMsg="";
  this.nbSavedFiles=0;
  this.theFile.name=this.nameFilePerf;
  this.theFile.circuit=this.specificCircuit.name;
  this.theFile.content=this.perfTotalCircuit;
  var j=1;
  for (var i=0; j!==-1; i++){
    j=this.theFile.theDate.indexOf('/');
    if (j!==-1){
      this.theFile.theDate=this.theFile.theDate.substring(0,j)+this.theFile.theDate.substring(j+1);
    }

  }
  for (i=0; i<this.tabManageLoop.length; i++){
    if (this.tabManageLoop[i]==="D"){
        this.perfCircuit[0].newLoop[i].loopDel="D";
        this.tabExclDel[i]="D";
    } else if (this.tabManageLoop[i]==="E"){
      this.perfCircuit[0].newLoop[i].loopDel="E";
      this.tabExclDel[i]="D";
    } else {
      this.perfCircuit[0].newLoop[i].loopDel="";
      this.tabExclDel[i]="";
    }
  }
  const nameFile = this.theFile.sport.substring(0,1).toUpperCase() +'-' +this.specificCircuit.code +'-';
  const partwo =this.theFile.theDate + this.nameFilePerf.substring(0,35);

  // update filePerf by including the reference of each PoR selected 
  for (i=0; i<this.perfCircuit.length; i++){
    for (j=0; j<this.perfCircuit[i].newLoop.length; j++){
        if (this.perfCircuit[i].newLoop[j].from!==""){
          this.filePerf[this.perfCircuit[i].newLoop[j].perfRecordFrom].refPoR=this.perfCircuit[i].newLoop[j].from;
          this.filePerf[this.perfCircuit[i].newLoop[j].perfRecordFrom].exclude=this.perfCircuit[i].newLoop[j].exclude;
        }
    }
    for (j=0; j<this.theFile.refPoints.length && this.theFile.refPoints[j]!==this.perfCircuit[i].newLoop[0].from; j++){}
    if (j===this.theFile.refPoints.length){
      this.theFile.refPoints[this.theFile.refPoints.length]=this.perfCircuit[i].newLoop[0].from;
    }
  }
  this.theFile.codeName = this.nameFilePerf;
  this.fnSave('perfRawData', this.filePerf, this.theFile.codeName,this.identification.performanceSport.bucket);
  //this.theFile.codeName = nameFile + 'total-' + partwo;
  //maxFiles++
  //this.fnSave('perfTotalCircuit', this.perfTotalCircuit, this.theFile.codeName,'xmv-sport-analysis', maxFiles);
  this.theFile.codeName = nameFile + 'perf-' + partwo;
  this.fnSave('perfCircuit', this.perfCircuit, this.theFile.codeName,'xmv-sport-analysis');
  if (this.tabCircuit.length>0){
    this.theFile.codeName = nameFile + 'tabC-' + partwo;
    this.fnSave('tabCircuit', this.tabCircuit,  this.theFile.codeName,'xmv-tests');
  }
  if (this.circuitPOR.length>0){
    this.theFile.codeName = nameFile + 'cPOR-' + partwo;
    
    this.fnSave('circuitPOR', this.circuitPOR, this.theFile.codeName,'xmv-tests');
  }
  //this.theFile.codeName = nameFile + 'cPORNew' + partwo;
  //this.fnSave('circuitPORNew', this.circuitPORNew,  this.theFile.codeName,'xmv-tests', maxFiles);

}
maxFiles:number=0;
fnSave(type:string, content:any, fileName:string, bucket:string){
  var theName=fileName;
  this.theFile.fileType=type;
  this.theFile.content=content; 
  this.maxFiles++
  var file=new File ([JSON.stringify(this.theFile)], fileName, {type: 'application/json'});    
  this.ManageGoogleService.uploadObject(this.configServer, bucket, file ,  fileName)
        .subscribe(
            res => {
                if (res.type===4){ 
                  this.nbSavedFiles++
                  if (this.nbSavedFiles===1){
                    this.saveMsg =  " file(s)  out of "+ this.maxFiles + " have been updated and stored in the cloud -- " + theName;

                  } else {
                    this.saveMsg = this.saveMsg + ' -- ' + theName;
                  }
                  this.isFilesToSave=true;
                }
          })
}


onInput(event:any){
  // this.resetBooleans();

  this.TabOfId.splice(0,this.TabOfId.length);
  const theValue= findIds(event.target.id,"-");
  
  for (var i=0; i<theValue.tabOfId.length; i++){
    this.TabOfId[i]=theValue.tabOfId[i];
  }
 
  this.scroller.scrollToAnchor('bottomPage');
}


}

