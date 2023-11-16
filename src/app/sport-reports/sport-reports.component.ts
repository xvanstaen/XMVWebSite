import { Component, OnInit , Input, Output, HostListener,  OnDestroy, HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject} from '@angular/core';
  
import { DatePipe, formatDate } from '@angular/common'; 

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, UntypedFormControl,FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { Observable } from 'rxjs';

import {msginLogConsole} from '../consoleLog'
import { configServer, LoginIdentif, OneBucketInfo, classPointOfRef, classCircuitRec, classFilePerf, msgConsole, classCredentials } from '../JsonServerClass';
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
    })


    isFilePerfReceived:boolean=false;
    isSpecificCircuitReceived:boolean=false;


    TabOfId:Array<any>=[];
    strFound:string="";
   
    errorMsg:string="";


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
nameFilePerf:string="";
onSelectPerf(event:any){
  this.filePerf.splice(0,this.filePerf.length);
  this.filePerf=event.content;
  this.nameFilePerf=event.name;
  this.isPerfRetrieved=false;
  this.isFilePerfReceived=true;
  this.scroller.scrollToAnchor('bottomPage');
}

onSelectCircuit(event:any){
  this.specificCircuit.points.splice(0,this.specificCircuit.points.length);
  this.specificCircuit=event;
  this.selectionCircuit=false;
  this.isSpecificCircuitReceived=true;
  this.scroller.scrollToAnchor('bottomPage');
}

onActionPerf(event:any){
  if (event.target.id==="PerfYes"){
    this.isPerfRetrieved=true;
  } else if (event.target.id==="PerfNo"){
    this.isPerfRetrieved=false;
  } else if (event.target.id==="CircuitYes"){
    this.selectionCircuit=true;
  } else if (event.target.id==="CircuitNo"){
    this.selectionCircuit=false;
  }
  this.scroller.scrollToAnchor('bottomPage');
}



onCalculatePerf(){
    var iTab=-1; 
    var iFind =0;
    var posGap=0;
    const nbDec=10000;
    const initPosGap=2;
    var gapLon=0.00002
    const refGapLon=0.0001;
    const refGapLat=0.0002;
    var loopGap=1;
    const maxGap=8;

    this.circuitPOR.splice(0,this.circuitPOR.length);
    this.tabCircuit.splice(0,this.tabCircuit.length);
    this.perfTotalCircuit.splice(0,this.perfTotalCircuit.length);
    this.perfCircuit.splice(0,this.perfCircuit.length);

    //this.tabOfPerf.splice(0,this.tabOfPerf.length); // contains all lat & lon corresponding to the PoR of the selected circuit
    // find the circuit points in the Perf file
    for (var i=0; i<this.specificCircuit.points.length; i++){
        posGap=initPosGap/nbDec;
        loopGap=1;
        this.circuitPOR.push({name:"",spec:0,value:[],dist:[0]}); // value contains all the records foundin perfFile corresponding to the PoR
        this.circuitPOR[this.circuitPOR.length-1].name=this.specificCircuit.points[i].ref;
        this.circuitPOR[this.circuitPOR.length-1].spec=i;
        var iValue=-1;
        iFind = this.specificCircuit.points[i].lon.toString().indexOf('.');
        const specLon = Number(this.specificCircuit.points[i].lon.toString().substring(0,iFind+7));
        iFind = this.specificCircuit.points[i].lat.toString().indexOf('.');
        const specLat = Number(this.specificCircuit.points[i].lat.toString().substring(0,iFind+7));
        const specLat8 = Number(this.specificCircuit.points[i].lat.toString().substring(0,iFind+9));
        for (var j=1; j<this.filePerf.length  && loopGap < maxGap; j++){ 
if ( (j===522  && i===0) || (j===1561  && i===0) || (j===2086  && i===2)){
  console.log('j='+j+ "lat & lon=" + this.filePerf[j].lat+","+this.filePerf[j].lon)
}
          iFind = this.filePerf[j-1].lon.toString().indexOf('.');
          const perfLonMinus = Number(this.filePerf[j-1].lon.toString().substring(0,iFind+7));// check if it still works; was 5 before
          iFind = this.filePerf[j].lon.toString().indexOf('.');
          const perfLon = Number(this.filePerf[j].lon.toString().substring(0,iFind+7));// check if it still works; was 5 before
          if (Math.abs(perfLon-perfLonMinus)>refGapLon){
            gapLon=Math.abs(perfLon-perfLonMinus);
          }
          if (perfLonMinus === specLon || perfLon === specLon || 
              (perfLonMinus > specLon-gapLon && perfLonMinus < specLon + gapLon) ||
              (perfLon > specLon-gapLon && perfLon < specLon + gapLon )){
              iFind = this.filePerf[j-1].lon.toString().indexOf('.');
              const perfLatMinus = Number(this.filePerf[j-1].lat.toString().substring(0,iFind+7));
              iFind = this.filePerf[j].lon.toString().indexOf('.');
              const perfLat = Number(this.filePerf[j].lat.toString().substring(0,iFind+7));
              if (Math.abs(perfLat-perfLatMinus)>refGapLat){
                posGap=Math.abs(perfLat-perfLatMinus);
              }

                  if (perfLatMinus === specLat ||  perfLat === specLat ||
                     (perfLatMinus > specLat - posGap && perfLatMinus < specLat + posGap )
                     || (perfLat > specLat - posGap && perfLat < specLat + posGap )){
                    iFind = this.filePerf[j-1].lon.toString().indexOf('.');
                    const perfLonMinus8 = Number(this.filePerf[j-1].lon.toString().substring(0,iFind+9));
                    iFind = this.filePerf[j].lon.toString().indexOf('.');
                    const perfLon8 = Number(this.filePerf[j].lon.toString().substring(0,iFind+9));

                      if (perfLonMinus8 === specLat8 ||  perfLon8 === specLat8 || 
                          Math.abs(this.filePerf[j-1].lat - this.specificCircuit.points[i].lat) < Math.abs(this.filePerf[j].lat - this.specificCircuit.points[i].lat)){
                          j--

                      } 
                      iTab++
                      iValue++
                      this.circuitPOR[this.circuitPOR.length-1].value[iValue]=j;
                      var loopSec=0; // maxSec = 50
                      for (var j=j; j<this.filePerf.length  && loopSec < 50; j++){ 
                        loopSec = loopSec + (this.filePerf[j].time-this.filePerf[j-1].time);
                      }
                  }
              }
              if (j===this.filePerf.length - 1 && loopGap<maxGap && this.circuitPOR[i].value.length===0){ 
                console.log('for posGap=' + posGap + '  lat & lon are not found i=' + i + ' record = ' + JSON.stringify(this.specificCircuit.points[i]))
                loopGap++
                posGap= loopGap /nbDec;
                j=0;
              } 
        }
        if (loopGap===maxGap){
          console.log('LOOP IS REACHED ===> lat & lon are not found i=' + i + ' record = ' + JSON.stringify(this.specificCircuit.points[i]))
        }
    }
this.scroller.scrollToAnchor('bottomPage');
console.log('end of the loop i='+i);
this.sortCircuit();

}


circuitPOR:Array<any>=[];
tabCircuit:Array<any>=[];
perfCircuit:Array<any>=[];
perfTotalCircuit:Array<any>=[];

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

  for (i=1; i<this.circuitPOR.length; i++){
    for (j=0; j<this.circuitPOR[i].value.length;j++){
      for (l=i-1; l>-1 && this.circuitPOR[l].value[j]===0; l--){}
      if (l<0){l=0};
      if (this.circuitPOR[i].value[j]<this.circuitPOR[l].value[j]){
        for (k=j; k<this.circuitPOR[i].value.length-1;k++){
          this.circuitPOR[i].value[k]=this.circuitPOR[i].value[k+1];
        }
        //this.circuitPOR[i].value.splice(this.circuitPOR[i].value.length-1,1);
        this.circuitPOR[i].value[this.circuitPOR[i].value.length-1]=0;
      }
    }
  }
  for (i=0; i<this.circuitPOR.length; i++){
    for (j=0; j<this.circuitPOR[i].value.length;j++){
      if (this.circuitPOR[i].value[j]===0){
        this.circuitPOR[i].value.splice(j,1);
        j--
      }
    }
  }
  for (i=1; i<this.circuitPOR.length && this.circuitPOR[i].value.length<this.circuitPOR[0].value.length; i++){}
  if (i===this.circuitPOR.length){
    saveValue=this.circuitPOR[0].value[this.circuitPOR[0].value.length-1];
    this.circuitPOR[0].value.splice(this.circuitPOR[0].value.length-1,1);
  }
  
  for (i=0; i<this.circuitPOR.length; i++){
      if (highValue < this.circuitPOR[i].value[this.circuitPOR[i].value.length-1]){
        highValue=this.circuitPOR[i].value[this.circuitPOR[i].value.length-1];
        iHighValue=i;
        jHighValue=j;
      }
  }
  i=0;
  j=0;

  this.circuitPORNew.splice(0,this.circuitPORNew.length);
  this.circuitPORNew.push({name:"",spec:0,value:[],dist:[]});

  // fill in all values of start of the circuit this.circuitPOR[0]
  this.circuitPORNew[i].name=this.circuitPOR[i].name;
  this.circuitPORNew[i].spec=this.circuitPOR[i].spec;
  for (j=0; j<this.circuitPOR[i].value.length-1; j++){  
      this.circuitPORNew[i].value[j]=this.circuitPOR[i].value[j];
      this.circuitPORNew[i].dist[j]=0;
  }

  j=this.circuitPOR[i].value.length-1;
  if (this.circuitPOR[this.circuitPOR.length-1].value.length<this.circuitPOR[i].value.length){
      this.circuitPORNew[i].value[j]=this.circuitPOR[i].value[j];
  }
 
    // this.circuitPOR[0].value[this.circuitPOR[0].value.length-1] last point
  this.circuitPORNew[i].dist[0]=0;
  for (i=1; i<this.circuitPOR.length; i++){
      this.circuitPORNew.push({name:"",spec:0,value:[],dist:[]});
      this.circuitPORNew[i].name=this.circuitPOR[i].name;
      this.circuitPORNew[i].spec=this.circuitPOR[i].spec;
      this.circuitPORNew[i].value[0]=this.circuitPOR[i].value[0];
      this.circuitPORNew[i].dist[0]=this.filePerf[Number(this.circuitPOR[i].value[0])].dist -this.filePerf[ Number(this.circuitPOR[i-1].value[0])].dist;
  }
  // create last record
  this.circuitPORNew.push({name:"",spec:0,value:[],dist:[]});
  this.circuitPORNew[i].name="end loop";
    
  for (i=1; i<this.circuitPORNew[0].value.length ; i++){ 
    for (j=1; j<this.circuitPORNew.length; j++){
      
          var stopLoop=false;
          k=0;
          var theDist=0;
          while (theDist <= this.circuitPORNew[j].dist[0] && stopLoop===false){
            k++
            if (this.circuitPORNew[j-1].value[i] + k<this.filePerf.length){
              theDist= this.filePerf[this.circuitPORNew[j-1].value[i] + k].dist - this.filePerf[this.circuitPORNew[j-1].value[i]].dist;
            } else {
                console.log('PB: this.filePerf[this.circuitPORNew[j-1].value[i] + k].dist - this.filePerf[this.circuitPORNew[j-1].value[i]].dist in undefined - i=' + i + ' j='+j+ ' k='+k);
                stopLoop=true;
              }
          }
          if (stopLoop===false && this.circuitPORNew[j-1].value[i] + k < highValue + 20){
            this.circuitPORNew[j].dist[i]=theDist;
            this.circuitPORNew[j].value[i]=this.circuitPORNew[j-1].value[i] + k;
          }  

    }
  }
  // process the 'end loop' record
  
  i=this.circuitPORNew.length-1;

  for ( j=1; j<this.circuitPORNew[0].value.length  ; j++){ //&& this.circuitPORNew[i].value[j-1]<this.filePerf.length
    this.circuitPORNew[i].spec=i;
    this.circuitPORNew[i].value[j-1]=this.circuitPOR[0].value[j];
    this.circuitPORNew[i].dist[j-1]=this.filePerf[Number(this.circuitPORNew[i].value[j-1])].dist -this.filePerf[ Number(this.circuitPORNew[i-1].value[j-1])].dist;
  }
  if (this.circuitPORNew[i].value.length===0){
    this.circuitPORNew[i].value[0]=this.circuitPORNew[0].value[1];
  }
  if (saveValue!==-1 && this.circuitPORNew[i].value.length<this.circuitPORNew[0].value.length){
    this.circuitPORNew[i].value[this.circuitPORNew[i].value.length]=saveValue;
  } else if (saveValue!==-1){
    this.circuitPORNew[i].value[this.circuitPORNew[i].value.length-1]=saveValue;
  }

  // createtabCircuit
  for ( i=0; i<this.circuitPORNew.length; i++){
    for ( j=0; j<this.circuitPORNew[i].value.length; j++){
      for ( k=0; k<this.tabCircuit.length && (this.tabCircuit[k].name !== this.circuitPORNew[i].name || 
        this.tabCircuit[k].record !== this.circuitPORNew[i].value[j]); k++){
      }
      if (k===this.tabCircuit.length ){
        // circuit not found; create it
        this.tabCircuit.push({name:"", spec:0, record:0});
        this.tabCircuit[this.tabCircuit.length-1].name=this.circuitPORNew[i].name;
        this.tabCircuit[this.tabCircuit.length-1].spec=this.circuitPORNew[i].spec;
        this.tabCircuit[this.tabCircuit.length-1].record = this.circuitPORNew[i].value[j];
      }
    }
  }
  
  

  // sort the PoR based on the record numbers found in filePerf
  this.tabCircuit.sort((a, b) => (a.record < b.record) ? -1 : 1);
  console.log('the end');


  this.nbItemsLoop=-1;
  for (i=1; i<this.tabCircuit.length; i++){
    if (i===70){
      console.log('halt');
    }
    if (this.tabCircuit[i-1].name!=="end loop"){

          var trouve=false;
          if (this.perfCircuit.length>0){
            
            for (l=this.perfCircuit.length-1;  l>=0 && trouve===false; l--){
              for (var k=0; k < this.perfCircuit[l].newLoop.length &&  this.perfCircuit[l].newLoop[k].fromTo !== (this.tabCircuit[i-1].name+'-'+this.tabCircuit[i].name); k++){
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
                this.perfCircuit[iCheck].newLoop.push({dist:0, theTime:0, speed:0, strTime:"", fromTo:"", loop:0, perfRecordFrom:0, perfRecordTo:0});
              }

              this.perfCircuit[iCheck].newLoop[0].fromTo=this.tabCircuit[i-1].name+'-'+this.tabCircuit[i].name;
              
              trouve=true;
              l=iCheck;
              k=this.nbItemsLoop-1;
          }

          if (trouve===true ){
            
            for (var iCheck=this.perfCircuit[l].newLoop.length-1; this.perfCircuit[l].newLoop.length<this.nbItemsLoop && iCheck>0 ; iCheck--){
              this.perfCircuit[l].newLoop.push({dist:0, theTime:0, speed:0, strTime:"", fromTo:"", loop:0, perfRecordFrom:0, perfRecordTo:0});
            }
            this.perfCircuit[l].newLoop.push({dist:0, theTime:0, speed:0, strTime:"", fromTo:"", loop:0, perfRecordFrom:0, perfRecordTo:0});
            tabLen=l;
            
            loopLen=this.perfCircuit[l].newLoop.length-1;
            var theLoop=loopLen;


            this.perfCircuit[tabLen].newLoop[loopLen].loop=theLoop;
            
            this.perfCircuit[tabLen].newLoop[loopLen].dist = this.filePerf[this.tabCircuit[i].record].dist - this.filePerf[this.tabCircuit[i-1].record].dist;
            this.perfCircuit[tabLen].newLoop[loopLen].theTime = this.filePerf[this.tabCircuit[i].record].time - this.filePerf[this.tabCircuit[i-1].record].time;
            this.perfCircuit[tabLen].newLoop[loopLen].speed = this.perfCircuit[tabLen].newLoop[loopLen].dist * 1000 / this.perfCircuit[tabLen].newLoop[loopLen].theTime * 3.6; 
            this.perfCircuit[tabLen].newLoop[loopLen].strTime=formatHHMNSS(this.perfCircuit[tabLen].newLoop[loopLen].theTime);
            this.perfCircuit[tabLen].newLoop[loopLen].fromTo=this.tabCircuit[i-1].name+'-'+this.tabCircuit[i].name;
            this.perfCircuit[tabLen].newLoop[loopLen].perfRecordFrom = this.tabCircuit[i-1].record;
            this.perfCircuit[tabLen].newLoop[loopLen].perfRecordTo = this.tabCircuit[i].record;
            
      
            //var iNew=this.perfTotalCircuit[0].newLoop.length-1;
          
            if (this.perfTotalCircuit[0].newLoop.length-1<theLoop){
              //this.perfTotalCircuit.push({newLoop:[]});
              this.perfTotalCircuit[0].newLoop.push({dist:0, theTime:0, speed:0, strTime:"", from:"",to:""});
              this.nbItemsLoop++
            }

            this.perfTotalCircuit[0].newLoop[this.nbItemsLoop].dist=this.perfTotalCircuit[0].newLoop[this.nbItemsLoop].dist+this.perfCircuit[l].newLoop[loopLen].dist;
            this.perfTotalCircuit[0].newLoop[this.nbItemsLoop].theTime=this.perfTotalCircuit[0].newLoop[this.nbItemsLoop].theTime+this.perfCircuit[l].newLoop[loopLen].theTime;
            this.perfTotalCircuit[0].newLoop[this.nbItemsLoop].loop=theLoop;
            if (this.perfTotalCircuit[0].newLoop[this.nbItemsLoop].from===""){
              this.perfTotalCircuit[0].newLoop[this.nbItemsLoop].from=this.tabCircuit[i-1].name;
            }
            this.perfTotalCircuit[0].newLoop[this.nbItemsLoop].to=this.tabCircuit[i].name;
          } else {

            this.perfCircuit.push({newLoop:[]});
            tabLen=this.perfCircuit.length-1;
            this.perfCircuit[tabLen].newLoop.push({dist:0, theTime:0, speed:0, strTime:"", fromTo:"", loop:0, perfRecordFrom:0, perfRecordTo:0});
            const loopLen=this.perfCircuit[tabLen].newLoop.length-1;
            this.perfCircuit[tabLen].newLoop[loopLen].dist = this.filePerf[this.tabCircuit[i].record].dist - this.filePerf[this.tabCircuit[i-1].record].dist;
            this.perfCircuit[tabLen].newLoop[loopLen].theTime = this.filePerf[this.tabCircuit[i].record].time - this.filePerf[this.tabCircuit[i-1].record].time;
            this.perfCircuit[tabLen].newLoop[loopLen].speed = this.perfCircuit[tabLen].newLoop[loopLen].dist * 1000 / this.perfCircuit[tabLen].newLoop[loopLen].theTime * 3.6; 
            this.perfCircuit[tabLen].newLoop[loopLen].strTime=formatHHMNSS(this.perfCircuit[tabLen].newLoop[loopLen].theTime);
            this.perfCircuit[tabLen].newLoop[loopLen].fromTo=this.tabCircuit[i-1].name+'-'+this.tabCircuit[i].name;
            this.perfCircuit[tabLen].newLoop[loopLen].perfRecord = this.tabCircuit[i].record;
            this.perfCircuit[tabLen].newLoop[loopLen].perfRecordFrom = this.tabCircuit[i-1].record;
            this.perfCircuit[tabLen].newLoop[loopLen].perfRecordTo = this.tabCircuit[i].record;
            this.perfCircuit[tabLen].newLoop[loopLen].loop = loopLen;
            if (this.perfTotalCircuit.length===0){
              this.perfTotalCircuit.push({newLoop:[]});
              this.perfTotalCircuit[0].newLoop.push({dist:0, theTime:0, speed:0, strTime:"", from:"",to:""});
              this.nbItemsLoop++
            }
            
            this.perfTotalCircuit[0].newLoop[this.perfTotalCircuit[0].newLoop.length-1].dist=this.perfTotalCircuit[0].newLoop[this.perfTotalCircuit[0].newLoop.length-1].dist+this.perfCircuit[tabLen].newLoop[loopLen].dist;
            this.perfTotalCircuit[0].newLoop[this.perfTotalCircuit[0].newLoop.length-1].theTime=this.perfTotalCircuit[0].newLoop[this.perfTotalCircuit[0].newLoop.length-1].theTime+this.perfCircuit[tabLen].newLoop[loopLen].theTime;
            if (this.perfTotalCircuit[0].newLoop[this.perfTotalCircuit[0].newLoop.length-1].from===""){
                this.perfTotalCircuit[0].newLoop[this.perfTotalCircuit[0].newLoop.length-1].from=this.tabCircuit[i-1].name;
            }
            this.perfTotalCircuit[0].newLoop[this.perfTotalCircuit[0].newLoop.length-1].to=this.tabCircuit[i].name;
          }
      }
              
    }
  for (i=0; i<this.perfTotalCircuit[0].newLoop.length; i++){
      if (this.perfTotalCircuit[0].newLoop[i].dist!==0){
        this.perfTotalCircuit[0].newLoop[i].strTime=formatHHMNSS(this.perfTotalCircuit[0].newLoop[i].theTime);
        this.perfTotalCircuit[0].newLoop[i].speed=this.perfTotalCircuit[0].newLoop[i].dist * 1000 / this.perfTotalCircuit[0].newLoop[i].theTime * 3.6;  
      } else {
        this.perfTotalCircuit[0].newLoop.splice(i,1);
        i--
      }
  }

  if (this.perfTotalCircuit[0].newLoop.length>0){
    
    for ( j=1; j<this.perfCircuit.length && this.perfCircuit[j].newLoop.length===this.perfCircuit[j-1].newLoop.length; j++){
      totalLoop++
    }
   
    if (j>1 && totalLoop<this.nbItemsLoop-1){
      this.perfTotalCircuit.push({newLoop:[]});
      for (var i=0; i<this.perfCircuit[0].newLoop.length; i++){
        this.perfTotalCircuit[1].newLoop.push({dist:0, theTime:0, speed:0, strTime:"", from:"",to:""});
      }
    

      for ( i=1; i<this.perfCircuit.length-1 && iTotal<totalLoop-1; i++){
         
        if (this.perfCircuit[i].newLoop.length-1===this.perfCircuit[i-1].newLoop.length-1){
          // item is part of a loop
          if (i===1){
            iTotal++
            for ( j=0; j<this.perfCircuit[i].newLoop.length; j++){
              this.perfTotalCircuit[1].newLoop[j].dist=Number(this.perfTotalCircuit[1].newLoop[j].dist)+Number(this.perfCircuit[0].newLoop[j].dist);
              this.perfTotalCircuit[1].newLoop[j].theTime=Number(this.perfTotalCircuit[1].newLoop[j].theTime)+Number(this.perfCircuit[0].newLoop[j].theTime);
            }
          }
          iTotal++
          for ( j=0; j<this.perfCircuit[i].newLoop.length; j++){
            this.perfTotalCircuit[1].newLoop[j].dist=Number(this.perfTotalCircuit[1].newLoop[j].dist)+Number(this.perfCircuit[i].newLoop[j].dist);
            this.perfTotalCircuit[1].newLoop[j].theTime=Number(this.perfTotalCircuit[1].newLoop[j].theTime)+Number(this.perfCircuit[i].newLoop[j].theTime);
          }
          
          
        }
      }
      
      
    }

  

  console.log('totalLoop for subTotal='+totalLoop+' max loop='+this.nbItemsLoop )
  if (this.perfTotalCircuit.length===2){
    this.perfCircuit.splice(totalLoop,0,{newLoop:[]});

    for ( i=0; i<this.perfTotalCircuit[1].newLoop.length; i++){
        this.perfTotalCircuit[1].newLoop[i].strTime=formatHHMNSS(this.perfTotalCircuit[1].newLoop[i].theTime);
        this.perfTotalCircuit[1].newLoop[i].speed=this.perfTotalCircuit[1].newLoop[i].dist * 1000 / this.perfTotalCircuit[1].newLoop[i].theTime * 3.6;
    
        this.perfCircuit[totalLoop].newLoop.push({dist:0, theTime:0, speed:0, strTime:"", fromTo:"", loop:0, perfRecordFrom:0, perfRecordTo:0});
        this.perfCircuit[totalLoop].newLoop[i].dist=this.perfTotalCircuit[1].newLoop[i].dist;
        this.perfCircuit[totalLoop].newLoop[i].theTime=this.perfTotalCircuit[1].newLoop[i].theTime;
        this.perfCircuit[totalLoop].newLoop[i].strTime=this.perfTotalCircuit[1].newLoop[i].strTime;
        this.perfCircuit[totalLoop].newLoop[i].speed=this.perfTotalCircuit[1].newLoop[i].speed;
        this.perfCircuit[totalLoop].newLoop[i].fromTo="SUB TOTAL LOOP";
      }

      this.nbItemsLoop=totalLoop;
    }

  }
  
 
  

  var file=new File ([JSON.stringify(this.perfTotalCircuit)], 'perfTotalCircuit', {type: 'application/json'});
      
    this.ManageGoogleService.uploadObject(this.configServer, 'xmv-tests', file ,  'perfTotalCircuit')
        .subscribe(
            res => {
                if (res.type===4){ 

                }
          })
  var file=new File ([JSON.stringify(this.perfCircuit)], 'perfCircuit', {type: 'application/json'});    
  this.ManageGoogleService.uploadObject(this.configServer, 'xmv-tests', file ,  'perfCircuit')
        .subscribe(
            res => {
                if (res.type===4){ 

                }
          })

  var file=new File ([JSON.stringify(this.tabCircuit)], 'tabCircuit', {type: 'application/json'}); 
  this.ManageGoogleService.uploadObject(this.configServer, 'xmv-tests', file ,  'tabCircuit')
        .subscribe(
            res => {
                if (res.type===4){ 

                }
          })
  
  var file=new File ([JSON.stringify(this.circuitPOR)], 'circuitPOR', {type: 'application/json'});    
  this.ManageGoogleService.uploadObject(this.configServer, 'xmv-tests', file ,  'circuitPOR')
        .subscribe(
            res => {
                if (res.type===4){ 

                }
          })
  var file=new File ([JSON.stringify(this.circuitPORNew)], 'circuitPORNew', {type: 'application/json'});    
  this.ManageGoogleService.uploadObject(this.configServer, 'xmv-tests', file ,  'circuitPORNew')
        .subscribe(
            res => {
                if (res.type===4){ 

                }
          })
}
circuitPORNew:Array<any>=[]
subTotalLoop:Array<any>=[];
nbItemsLoop:number=-1;
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