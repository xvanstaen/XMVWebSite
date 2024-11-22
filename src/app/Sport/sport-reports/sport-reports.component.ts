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
import { fillHeaderFile , reinitTotal, copyInitPerf, copyLegInOut, copyInOut, copyLoopInOut, updateTabPor} from '../commonSportFunctions';
import { findIds, formatHHMNSS } from '../../MyStdFunctions';


import { ManageMongoDBService } from '../../CloudServices/ManageMongoDB.service';
import { ManageGoogleService } from '../../CloudServices/ManageGoogle.service';
import { AccessConfigService } from '../../CloudServices/access-config.service';


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
    private ManageMongoDBService: ManageMongoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    ) { }

    @Input() configServer = new configServer;
    @Input() identification= new LoginIdentif;

    firstPoR:string="";
    firstPoRNb:number=0;
    displayTabTwo:number=2;
    headerPerf= new classHeaderFileSport;
    nbSave:number=0;

    initPerfPoR:Array<classTabPoR>=[];
    theFile= new classFileSport;
    nameFilePerf:string="";

    circuitPOR:Array<any>=[];
    tabCircuit:Array<any>=[];
    
    perfCircuit:Array<any>=[];
    savePerfCircuit:Array<any>=[];

    perfCircuitRef:Array<any>=[];

    nbItemsLoop:number=-1;

    specificCircuit= new classCircuitRec;

    filePerf:Array<classFilePerf>=[];

    selectionCircuit:boolean=false;
    isPerfRetrieved:boolean=false;

    formOptions: FormGroup = new FormGroup({ 
      fileName: new FormControl("", { nonNullable: true }),
    })

    isFilePerfReceived:boolean=false;
    isSpecificCircuitReceived:boolean=false;
    isFilesToSave:boolean=false;

    //TabOfId:Array<any>=[];
    //strFound:string="";
    errorMessage:string="";
    errorMsg:string="";
    isPerfCircuitRetrieved:number=0;

    saveMsg:string="";

    isBuildFromPerf:boolean=false;

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
  //this.tabCircuit.splice(0,this.tabCircuit.length);
  this.perfCircuit.splice(0,this.perfCircuit.length);
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
  this.isBuildFromPerf=false;
  this.resetVar();
  this.resetTab();
  this.theFile=event;
  this.filePerf.splice(0,this.filePerf.length);
  this.filePerf=event.content;
  this.headerPerf=fillHeaderFile(this.theFile, this.headerPerf);
  if (this.headerPerf.name===""){
    this.headerPerf.name=event.name;
  }
  this.nameFilePerf=event.name;
  this.isPerfRetrieved=false;
  this.isFilePerfReceived=true;
  this.initPerfPoR= updateTabPor(this.filePerf);
  //this.updateTabPor();

  this.scroller.scrollToAnchor('bottomPage');
  if (this.isSpecificCircuitReceived===true && this.initPerfPoR.length>0){
    //this.circuitPerfPoR();
    this.isBuildFromPerf=true;
  }
}

onSelectCircuit(event:any){ 
  this.isPerfCircuitRetrieved=0;
  this.isBuildFromPerf=false;
  this.resetVar();
  this.resetTab();
  this.specificCircuit.points.splice(0,this.specificCircuit.points.length);
  this.specificCircuit=event;
  this.selectionCircuit=false;
  this.isSpecificCircuitReceived=true;
  if (this.isFilePerfReceived===true && this.specificCircuit.points.length>0){
    //this.circuitPerfPoR();
    this.isBuildFromPerf=true;
  }
  this.firstPoR=this.specificCircuit.points[0].ref;
  this.firstPoRNb=0;
  this.scroller.scrollToAnchor('bottomPage');
}

selFirstPoR(event:any){
  if (event.target.id.substring(0,4)==="PoR-"){
    this.firstPoR=this.specificCircuit.points[event.target.id.substring(4)].ref;
    this.firstPoRNb=Number(event.target.id.substring(4));
  } 
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
              this.savePerfCircuit.splice(0,this.savePerfCircuit.length);
              this.savePerfCircuit=copyInOut(this.perfCircuit,this.savePerfCircuit);
            },
            err=>{
              this.isPerfCircuitRetrieved=2;
              this.errorMessage=fileName;
            })
  } else {
    this.isPerfCircuitRetrieved=3;
  }
}

circuitPerfPoR(){
  var iLeg=0;
  var i=0;
  var j=0;
  var k=0;
  this.perfCircuitRef.splice(0,this.perfCircuitRef.length);

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


  for (i=0; i<this.initPerfPoR.length; i++){
    for (j=0; j< this.specificCircuit.points.length && this.specificCircuit.points[j].ref!==this.initPerfPoR[i].content.refPoR; j++){}
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

    }

  }
  for (i=0; i<this.perfCircuitRef.length; i++){
      for (j=0; j<this.perfCircuitRef[i].newLoop.length; j++){
        if (j===this.perfCircuitRef[j].newLoop.length-1 && i===this.perfCircuitRef.length-1){

        } else if (j<this.perfCircuitRef[j].newLoop.length-1 && i===this.perfCircuitRef.length-1){
          this.perfCircuitRef[i].newLoop[j].to=this.perfCircuitRef[0].newLoop[j+1].from;
          this.perfCircuitRef[i].newLoop[j].perfRecordTo=this.perfCircuitRef[0].newLoop[j+1].perfRecordFrom;
        }  else  {
            this.perfCircuitRef[i].newLoop[j].to=this.perfCircuitRef[i+1].newLoop[j].from;
            this.perfCircuitRef[i].newLoop[j].perfRecordTo=this.perfCircuitRef[i+1].newLoop[j].perfRecordFrom;
            
        } 
        this.perfCircuitRef[i].newLoop[j].dist = this.filePerf[this.perfCircuitRef[i].newLoop[j].perfRecordTo].dist -
            this.filePerf[this.perfCircuitRef[i].newLoop[j].perfRecordFrom].dist;
        this.perfCircuitRef[i].newLoop[j].time = this.filePerf[this.perfCircuitRef[i].newLoop[j].perfRecordTo].time -
            this.filePerf[this.perfCircuitRef[i].newLoop[j].perfRecordFrom].time; 
        this.perfCircuitRef[i].newLoop[j].strTime = formatHHMNSS(this.perfCircuitRef[i].newLoop[j].time);
        this.perfCircuitRef[i].newLoop[j].speed = this.perfCircuitRef[i].newLoop[j].dist * 1000 / this.perfCircuitRef[i].newLoop[j].time * 3.6;
      }

  }

}


onCalculatePerf(){

    var theRef=0;
    var newDist=0;
    var iFind =0;
    var iRef=0;
    var j=0;
    var bestRow=0;
    var valRef=0;

    this.resetTab();
    this.circuitPOR.splice(0,this.circuitPOR.length);
    var refStartPoint = 0;
    this.isFilesToSave=false;
    // search the first point of reference
    var i=this.firstPoRNb;
    for (var j=0; j<this.firstPoRNb; j++){
      const classWork=new classWorkCircuit;
      this.circuitPOR.push(classWork);
      this.circuitPOR[this.circuitPOR.length-1].name=this.specificCircuit.points[j].ref;
      this.circuitPOR[this.circuitPOR.length-1].dist[0]=0//this.specificCircuit.dist[j];
      this.circuitPOR[this.circuitPOR.length-1].value[0]=0;
      this.circuitPOR[this.circuitPOR.length-1].exclude[0]="";
      this.circuitPOR[this.circuitPOR.length-1].spec=j;
    }
    for (j=0; j<this.filePerf.length && refStartPoint===0; j++){
        //i=0;
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
    // *** IF START POINT NOT FOUND STOP THE PROCESS AND DISPLAY ERROR MESSAGE

    // find eachPoR based on distance
  if (j<this.filePerf.length){
        var iLoop=-1;
        for (var jRow=0; jRow<this.filePerf.length; jRow++){
          iLoop++
          // the first time iRef get the value of 'i' which corresponds to the selection of the first PoR
          // for the next loop iRef will start from 0 
          for ( var iRef=i; iRef<this.specificCircuit.points.length && jRow<this.filePerf.length; iRef++){
            
            this.circuitPOR[iRef].dist[iLoop]=this.specificCircuit.dist[iRef];
            // find the next item as per the distance
            newDist = 0
            for (theRef=0; theRef < iRef; theRef++){
                newDist = newDist + this.circuitPOR[theRef].dist[this.circuitPOR[theRef].dist.length-1] - this.specificCircuit.dist[theRef];
                theRef = theRef + 1
              }
            if (newDist > 0){
                newDist = newDist + Number(this.specificCircuit.dist[theRef]);
            } else {
                newDist = Number(this.specificCircuit.dist[theRef]);
            }
            if (Number(iRef) < this.specificCircuit.points.length-1) {
              theRef=Number(iRef)+1
            } else { 
              theRef=0;
            }
            bestRow=0;
            for (var k=jRow; k<this.filePerf.length && this.filePerf[k].dist - this.filePerf[this.circuitPOR[iRef].value[iLoop]].dist <= this.specificCircuit.dist[iRef]; k++){
              if ((Math.abs(this.filePerf[k].lat - this.specificCircuit.points[theRef].lat) <= this.specificCircuit.points[theRef].varLat)
                      && (Math.abs(this.filePerf[k].lon - this.specificCircuit.points[theRef].lon) <= this.specificCircuit.points[theRef].varLon)){
                  if (bestRow = 0) {
                      bestRow = k;
                  } else {if ((Math.abs(this.filePerf[k].lat - this.specificCircuit.points[theRef].lat) <= Math.abs(this.filePerf[bestRow].lat - this.specificCircuit.points[theRef].lat)) 
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
            if (iRef<this.specificCircuit.points.length-1){
              valRef=iRef+1;
            } else {
              valRef=0;
            }
            for (var jInt=0; jInt<interval * 3 && jRow<this.filePerf.length; jInt++){
  
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
                  this.circuitPOR.push(classWork); // value contains all the records found in perfFile corresponding to the PoR
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
          i=0;
        }
       
        this.createPerfCircuit();
        
  } else {
    this.errorMessage="start point not found; restart your selection";
    this.isPerfRetrieved=false;
    this.selectionCircuit=false;
    this.isSpecificCircuitReceived=false;
    this.filePerf.splice(0, this.filePerf.length);
  }
this.scroller.scrollToAnchor('bottomPage');
}

createPerfCircuit(){
  for (var i=0; i<this.circuitPOR.length; i++){
    this.perfCircuit.push({newLoop:[]});
  }

  for (var iLoop=0; iLoop<this.circuitPOR[0].dist.length; iLoop++){
    for (var i=0; i<this.circuitPOR.length; i++){
      if (iLoop<this.circuitPOR[i].dist.length){ // must ensure that the loop#j exists for this leg
        const classLoop=new classNewLoop;
        this.perfCircuit[i].newLoop.push(classLoop);
        this.perfCircuit[i].newLoop[iLoop].from=this.circuitPOR[i].name;
        this.perfCircuit[i].newLoop[iLoop].dist=this.circuitPOR[i].dist[iLoop];
        this.perfCircuit[i].newLoop[iLoop].perfRecordFrom=this.circuitPOR[i].value[iLoop];
        this.perfCircuit[i].newLoop[iLoop].exclude=this.circuitPOR[i].exclude[iLoop];
        this.perfCircuit[i].newLoop[iLoop].spec=i;
        if (i<this.circuitPOR.length-1){
          this.perfCircuit[i].newLoop[iLoop].to=this.circuitPOR[i+1].name;
          this.perfCircuit[i].newLoop[iLoop].perfRecordTo=this.circuitPOR[i+1].value[iLoop];
        } else { // process the last leg of the loop
          this.perfCircuit[i].newLoop[iLoop].to=this.circuitPOR[0].name;
          if (iLoop<this.circuitPOR[0].value.length-1){
            this.perfCircuit[i].newLoop[iLoop].perfRecordTo=this.circuitPOR[0].value[iLoop+1];
            // next loop exists
          }
        }
        if (this.perfCircuit[i].newLoop[iLoop].perfRecordFrom!==0 && this.perfCircuit[i].newLoop[iLoop].perfRecordTp!==0){
            this.perfCircuit[i].newLoop[iLoop].theTime = this.filePerf[this.perfCircuit[i].newLoop[iLoop].perfRecordTo].time - this.filePerf[this.perfCircuit[i].newLoop[iLoop].perfRecordFrom].time;
            this.perfCircuit[i].newLoop[iLoop].dist = this.filePerf[this.perfCircuit[i].newLoop[iLoop].perfRecordTo].dist - this.filePerf[this.perfCircuit[i].newLoop[iLoop].perfRecordFrom].dist;
            this.perfCircuit[i].newLoop[iLoop].speed = this.perfCircuit[i].newLoop[iLoop].dist * 1000 / this.perfCircuit[i].newLoop[iLoop].theTime * 3.6; 
            this.perfCircuit[i].newLoop[iLoop].strTime=formatHHMNSS(this.perfCircuit[i].newLoop[iLoop].theTime);      
        }

      }
    }

  }
  // each leg must have same number of loops
  // add if needed
  for (i=1; i<this.perfCircuit.length; i++){
    for (iLoop=this.perfCircuit[i].newLoop.length; iLoop<this.perfCircuit[0].newLoop.length; iLoop++){
        const classLoop=new classNewLoop;
        this.perfCircuit[i].newLoop.push(classLoop);
    }
  }
  // delete if needed
  for (i=1; i<this.perfCircuit.length; i++){
    if (this.perfCircuit[0].newLoop.length<this.perfCircuit[i].newLoop.length){
        this.perfCircuit[i].newLoop.splice(this.perfCircuit[i].newLoop.length-1,1);
    }
  }
}



isSavePerf:boolean=false;
savePerf(event:any){
  console.log('savePerf length=' + event.length)

  // name of the file is managed by the calling component
  this.saveMsg="";
  this.isSavePerf=true;
  this.fnSavePerf( this.identification.performanceSport.bucket, event.codeName, event);
}

uploadPerfCircuit(event:any){
  console.log('uploadPerfCircuit' + event.length);
  var j=1;
  for (var i=0; j!==-1; i++){
    j=this.theFile.theDate.indexOf('/');
    if (j!==-1){
      this.theFile.theDate=this.theFile.theDate.substring(0,j)+this.theFile.theDate.substring(j+1);
    }
  }
  const nameFile = this.theFile.sport.substring(0,1).toUpperCase() + '-' + this.specificCircuit.code + '-';
  const partwo = this.theFile.theDate + this.theFile.name.substring(0,35);
  this.theFile.codeName = nameFile + 'perf-' + partwo;
  // name of the file is managed by the calling component
  this.fnSave('perfCircuit', event, this.theFile.codeName,'xmv-sport-analysis');

  if (this.circuitPOR.length>0){
    this.theFile.codeName = nameFile + 'cPOR-' + partwo;
    this.fnSave('circuitPOR', this.circuitPOR, this.theFile.codeName,'xmv-tests');
  }

}


nbErrUpload:number=-1;
nbSuccessUpload:number=0;
fnSavePerf(bucket:string, fileName:string,aFile:any){
  var file=new File ([JSON.stringify(aFile)], fileName, {type: 'application/json'});    
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

fnSave(type:string, content:any, fileName:string, bucket:string){
  this.theFile.fileType=type;
  this.theFile.content=content; 
  var file=new File ([JSON.stringify(this.theFile)], fileName, {type: 'application/json'});    
  this.ManageGoogleService.uploadObject(this.configServer, bucket, file ,  fileName)
        .subscribe(
            res => {
                if (res.type===4){ 
                  console.log("file is save - " + fileName);
                }
            },
            err => {
              console.log("file is not saved - " + fileName);
            });
}





}

