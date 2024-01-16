import { Component, OnInit , Input, Output, HostListener,  OnDestroy, HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject} from '@angular/core';
  
import { DatePipe, formatDate } from '@angular/common'; 

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, UntypedFormControl,FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { Observable } from 'rxjs';

import { msginLogConsole } from '../../consoleLog'
import { configServer, LoginIdentif,  OneBucketInfo, classTabMetaPerso, msgConsole, classCredentials, Bucket_List_Info } from '../../JsonServerClass';
import {classFileSport, classPointOfRef, classNewLoop, classCircuitRec, classFilePerf,classWorkCircuit, classTabPoR, classTotalLoop, classCountryPoR, classHeaderFileSport} from '../classSport';
import { fromGPXtoTXT } from '../convertGPXtoTXT';
import { fromTCXtoJSON } from '../convertTCXtoTXT';
import { findIds, formatHHMNSS } from '../../MyStdFunctions';

import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { ManageMongoDBService } from 'src/app/CloudServices/ManageMongoDB.service';
import { fillHeaderFile } from '../commonSportFunctions';



@Component({
  selector: 'app-sport-performance',
  templateUrl: './sport-performance.component.html',
  styleUrls: ['./sport-performance.component.css']
})
export class SportPerformanceComponent {


  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageMongoDBService: ManageMongoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    ) { }

    @Output() returnPerf= new EventEmitter<any>();

    @Input() configServer = new configServer;
    @Input() identification= new LoginIdentif;

    @Input() isPerfRetrieved : boolean = false; // create perf and return it to the calling component

    tabMetaPerso: Array<classTabMetaPerso> = [];

    tabPoR:Array<classPointOfRef>=[];
    perf:Array<any>=[];

    filePerf=new classFileSport;
    i : number = 0;
    lastOccurrence:number=0;
    headerPerf=new classHeaderFileSport;

    EventHTTPReceived:Array<boolean>=[];
    maxEventHTTPrequest:number=20;
    idAnimation:Array<number>=[];
    TabLoop:Array<number>=[];
    NbWaitHTTP:number=0;

    errorMessage:string="";
  
    NbRefreshBucket:number=0;
    bucketName:string="";
    retrieveListObject:boolean=false;

    SelectedBucketInfo=new OneBucketInfo;
    //theReceivedData:any;
    isDataReceived:boolean=false;

    TabBuckets=[{name:''}];

    formOptions: FormGroup = new FormGroup({ 
      seconds: new FormControl(800, { nonNullable: true }),
      meters: new FormControl(500, { nonNullable: true }),
      fileName: new FormControl("", { nonNullable: true }),
      sport: new FormControl("", { nonNullable: true }),
      theDate: new FormControl("", { nonNullable: true }),
      perfName: new FormControl("", { nonNullable: true }),
    })
    NbRefresh_Bucket=0;

    istabPointOfRef:boolean=false;
    isManagePointOfRef:boolean=false;
    isConfirmSave:boolean=false;

    tabSecond:Array<any>=[];
    tabMeter:Array<any>=[];
    alt={lowest:2000,lDist:0,highest:0,hDist:0};
    heart={lowest:200,lDist:0,highest:0,hDist:0};
    speed={highest:0,dist:0}
  
    isPerfProcessCompleted:boolean=false;

  isFileProcessed:boolean=false;

  errorMsg:string="";

ngOnInit(){
  this.bucketName=this.identification.performanceSport.bucket;
  
  const theClass=new classTabMetaPerso;
  this.tabMetaPerso.push(theClass);
  this.tabMetaPerso[0].key="fileType";
  this.tabMetaPerso[0].value="performance";
}
/***
specificGet(){ // may be rejected because no access to public in Google cloud
  this.http.get(this.SelectedBucketInfo.mediaLink).subscribe((res:any)=>{
    const theData=res;
  },
  theErr => {
    console.log(theErr);
  });
}
 */

BucketInfo(event:any){
  this.SelectedBucketInfo=event;
  this.formOptions.controls["fileName"].setValue(this.SelectedBucketInfo.name);
  console.log('Performance-sport - bucket name is '+this.SelectedBucketInfo.name);
  //this.specificGet();
  /*
  this.ManageGoogleService.getTextObject(this.configServer, this.bucketName, this.SelectedBucketInfo.name )
    .subscribe((data ) => {  
    const myData=data;
    console.log(myData.text);
  },
  err => {
    console.log('error');
  });
 */
}

actionPointOfRef(event:any){
  if (event==="managePoRef"){
    this.isManagePointOfRef=true;
  }  if (event==="cancelPoRef"){
    this.isManagePointOfRef=false;
  } 
}

confirmSave(event:any){
  if (event="confirmSave"){
    this.isConfirmSave=true;
  }
}

ReceivedData(event:any){

    // console.log('performance-sport event is:' + JSON.stringify(event));    
    //this.headerPerf=fillHeaderFile(event,this.headerPerf);
    var file=new File([JSON.stringify(event)], 'myGPXfile', {type: 'application/json'});
    const stringNumber="0123456789.";
    this.isPerfProcessCompleted=false;
    this.isDataReceived=true;
    var trouve=false;
    var lengthSec=0;
    var iPerf=0; 
    var j = 0;
    var k = 0;
    var maxFields=3;
    this.perf.splice(0,this.perf.length);
    this.scroller.scrollToAnchor('result');
    if (typeof event==="object" && event.text!==undefined){ // text file has been retrieved
        const lengthText=event.text.length;
        const isGPX = event.text.indexOf('<gpx creator=');
        if (isGPX === -1){
          var fileTCX = event.text.indexOf("<TotalTimeSeconds>"); // format of the file is TCX
          if (fileTCX!==-1){
            file =new File ([JSON.stringify(event)], 'myTCXfile', {type: 'application/json'});
          }
        } else {
            file=new File ([JSON.stringify(event)], 'myGPXfile', {type: 'application/json'});
 
        } 
        this.ManageGoogleService.uploadObject(this.configServer, 'xmv-tests', file ,  'myTCXfile')
          .subscribe(
            res => {
              if (res.type===4){ 

              }
            })
        // test if file contains all columns
        // Time	Distance	Heart rate	Speed	Altitude	Latitude	Longitude	Slope
        const fileType = event.text.indexOf("Altitude"); // if =-1 contains 3 columns only
        const fileRide = event.text.indexOf("RIDE"); // if =-1 contains 3 columns only
        var iLoop=0;
        if (isGPX !== -1){
            this.processGPXfile(event);
            console.log('end GTX');
            this.perf.splice(0,this.perf.length);
        } else if (fileTCX !== -1){
            this.processTCXfile(event);
            console.log('end TCX');
            this.perf.splice(0,this.perf.length);
        } else if (fileRide===-1){
          if (fileType!==-1 ){
            maxFields=8;
          }
        for ( this.i=0; this.i<lengthText && stringNumber.indexOf(event.text.substring(this.i,this.i+1))===-1 ; this.i++){}
          // "\t" refers to tabulation
        for (this.i=this.i; this.i<lengthText; this.i++){
            for (j=this.i; j<lengthText && event.text.substring(j,j+1)==="\t"; j++){
              // search first tabulation character
            }
            for (k=j+1; k<lengthText && stringNumber.indexOf(event.text.substring(k,k+1))>-1; k++){
              // search first non tabulation character
            }
            iPerf++
            if (iPerf===1){
              const thePerf=new classFilePerf;
              //this.perf.push({time:'',dist:0,speed:0,heart:0,alt:0,lat:0,lon:0,slope:0});
              this.perf.push(thePerf);
                
                this.perf[this.perf.length-1].time=Number(event.text.substring(j,k));
            } else if (iPerf===2){
                this.perf[this.perf.length-1].dist=Number(event.text.substring(j,k));
            } else if (iPerf===maxFields){
                    // there is no separation - tabulation - betweeen speed and next sec
                    // each row is +1 sec; start of sec is this.perf[0].time ; most of the time should be 0
                    // next sec = this.perf.length + this.perf[0].time
                    var processSec = true;
                    if ( event.text.substring(k+1,k+2)!=="\t" ){
                      // character is not a tabulation; not a standard text format
                      processSec = false;
                    } 
                    lengthSec=0;
                    if (k<lengthText && processSec === true){
                        trouve=false;
                        for (var z=10; trouve===false; z=z*10){
                          lengthSec++
                          if ((this.perf.length + Number(this.perf[0].time)) < z){
                            trouve=true;
                          } 
                        }
                    }
                    if (fileType===-1){
                      this.perf[this.perf.length-1].speed=Number(event.text.substring(j,k-lengthSec));
                    } else {
                      this.perf[this.perf.length-1].slope=Number(event.text.substring(j,k-lengthSec));
                    }
                    if (processSec === true){
                      if (k<lengthText){
                        const thePerf=new classFilePerf;
                        this.perf.push(thePerf);
                        this.perf[this.perf.length-1].time=this.perf.length - 1 + Number(this.perf[0].time);
                      }
                      iPerf=1;
                    } else {
                      iPerf=0;
                    }
            } else if (fileType!==-1) { // 
                if (iPerf===3){
                  this.perf[this.perf.length-1].heart=Number(event.text.substring(j,k));
                } else if (iPerf===4){
                  this.perf[this.perf.length-1].speed=Number(event.text.substring(j,k));
                } else if (iPerf===5){
                  this.perf[this.perf.length-1].alt=Number(event.text.substring(j,k));
                } else if (iPerf===6){
                  this.perf[this.perf.length-1].lat=Number(event.text.substring(j,k));
                } else if (iPerf===7){
                  this.perf[this.perf.length-1].lon=Number(event.text.substring(j,k));
                } 
              }
            this.i=k;
          }
        } else { // fileRide !== -1 which means it is a "RIDE" record
          this.myString = event.text.substring(fileRide);
          for (j=0; this.myString.length > 60; j++){
            const thePerf=new classFilePerf;
            //this.perf.push({time:'',dist:0,speed:0,heart:0,alt:0,lat:0,lon:0,slope:0});
            this.perf.push(thePerf);
            this.perf[this.perf.length-1].time=this.fillPerf(0,',');
            this.perf[this.perf.length-1].dist=this.fillPerf(1,',');
            this.perf[this.perf.length-1].speed=this.fillPerf(2,',');
            this.perf[this.perf.length-1].heart=this.fillPerf(3,',');
            this.perf[this.perf.length-1].alt=this.fillPerf(4,',');
            this.perf[this.perf.length-1].lat=this.fillPerf(5,',');
            this.perf[this.perf.length-1].lon=this.fillPerf(6,',');
            this.perf[this.perf.length-1].slope=this.fillPerf(7,'}');
          }
          console.log('length myString=' + this.myString.length +   'myStr='+this.myString);
          console.log('last record : j=' + j + "  data is " + JSON.stringify(this.perf[this.perf.length-1]));
        }
    } else if (Array.isArray(event) && event[0].speed!==undefined){
        for (j=0; j<event.length; j++){
          this.fillPerfRecord(event,j);
        }
    } else if (event.fileType!==undefined){
        for (j=0; j<event.content.length; j++){
          this.fillPerfRecord(event.content,j);
          const thePerf=new classFilePerf;
        }
        this.formOptions.controls['sport'].setValue(event.sport);
        this.formOptions.controls['theDate'].setValue(event.theDate);
      }
  
    var k=0;
    this.errorMessage="";
    for (var i=0; i<this.perf.length; i++){
        for (j=0; j<this.perf.length && this.perf[j].lon!==0; j++){}
        k=0;
        if (j<this.perf.length){
          for ( k=j+1; k<this.perf.length && this.perf[k].lon===0; k++){}
          if (k<this.perf.length){
              this.newFillLatLon(j,k-1);
          } else { 
            this.errorMessage = "LAT & LON are nil and cannot be updated";
          }
          
        }
        if (k===0){
          i=j;
        } else {
          i=k;
        }
      }
    this.lastOccurrence=this.perf.length-1;
    if ( this.perf.length===0){
      this.errorMsg = this.errorMsg + "  file perf is empty - check the problem";
    } else {
      this.isFileProcessed=true;
    }
    if (this.isPerfRetrieved===true ){
      this.createFilePerf();
      console.log('Performance-sport end process, SelectedBucketInfo.name' + this.SelectedBucketInfo.name + "  and length of perf file is " + this.filePerf.content.length);
      this.returnPerf.emit(this.filePerf);
    }
  }

  checkOptions(){
    this.errorMsg="";
    if (isNaN(this.formOptions.controls['seconds'].value)){
      this.errorMsg='enter a numeric value for seconds';
    } else if (isNaN(this.formOptions.controls['meters'].value)){
      this.errorMsg='enter a numeric value for meters';
    }
    if (this.errorMsg==='' && this.perf.length>0){
      this.performancePerSec();
    } else if ( this.perf.length===0){
      this.errorMsg = this.errorMsg + "  file perf is empty - check the problem";
    }

  }

myString:string="";
fillPerf(iRecord:number, specChar:string){
  const tabRecord=['"SECS":','"KM":','"KPH":','"HR":','"ALT":','"LAT":','"LON":','"SLOPE":'];
  var myNb=0;
  const iFind = this.myString.indexOf((tabRecord[iRecord]));
  this.myString = this.myString.substring( iFind + tabRecord[iRecord].length);
  var theComa=this.myString.indexOf(specChar);
  if (theComa!==-1){
    myNb=Number(this.myString.substring(0,theComa));
  } else if (theComa===-1 && tabRecord[iRecord]==='"SECS":'){
    myNb=-1;
  } 
  return (myNb);
}

fillPerfRecord(event:any,j:number){
  const thePerf=new classFilePerf;
  //this.perf.push({time:'',dist:0,speed:0,heart:0,alt:0,lat:0,lon:0,slope:0});
  this.perf.push(thePerf);
  if (event[j].sec!==undefined){
    this.perf[j].time=event[j].sec;
  } else if (event[j].time!==undefined){
    this.perf[j].time=event[j].time;
  }
  this.perf[j].dist=event[j].dist;
  this.perf[j].speed=event[j].speed;
  if (event[j].heart!==undefined) {
    this.perf[j].heart=event[j].heart;
  }
  if (event[j].heart!==undefined) {
    this.perf[j].speed=event[j].speed;
  }
  if (event[j].alt!==undefined) {
    this.perf[j].alt=event[j].alt;
  }
  if (event[j].lat!==undefined) {
    this.perf[j].lat=event[j].lat;
  }
  if (event[j].lon!==undefined) {
    this.perf[j].lon=event[j].lon;
  }
  if (event[j].slope!==undefined) {
    this.perf[j].slope=event[j].slope;
  }
  if (event[j].refPoR!==undefined) {
    this.perf[j].refPoR=event[j].refPoR;
  }
  if (event[j].exclude!==undefined) {
    this.perf[j].exclude=event[j].exclude;
  }
}


newFillLatLon(startR:number,endR:number){
var primeTabDic=[];

var firstRowRef=startR-1;
var lastRowRef=endR+1;
// This 4 loops should not be executed; it's just in case something goes wrong
while(this.perf[lastRowRef].lat===0 && lastRowRef>firstRowRef+1){
  lastRowRef--
}
while(this.perf[lastRowRef].lat===0 ){
  lastRowRef++
}
while(this.perf[firstRowRef].lat===0  && firstRowRef<lastRowRef-1){
  firstRowRef++
}
while(this.perf[firstRowRef].lat===0 ){
  firstRowRef--
}


var tabTest:Array<any>=[]
  
var iPrimeDic=-1;


var midRowRef=0;
const  refValue=(lastRowRef - firstRowRef + 1) + 20; // buffer - used to avoid any loop
var secureValue = 0;
var trouve =false;


iPrimeDic=0;
primeTabDic[iPrimeDic]=lastRowRef;
iPrimeDic++;
primeTabDic[iPrimeDic]=firstRowRef;


    trouve=false;
    firstRowRef=primeTabDic[iPrimeDic];
    lastRowRef=primeTabDic[iPrimeDic-1];
    while (trouve === false && secureValue < refValue && iPrimeDic>-1){
          secureValue++

          if (iPrimeDic<1){ /**/
            trouve=true; 
            primeTabDic.splice(0,primeTabDic.length);
            iPrimeDic=-1;
            
          } else {
            if (iPrimeDic>1 && midRowRef === firstRowRef){/**/
              primeTabDic.splice(iPrimeDic,1);
              iPrimeDic--
              if (iPrimeDic>0){
                firstRowRef=primeTabDic[iPrimeDic];
                lastRowRef=primeTabDic[iPrimeDic-1];
                midRowRef=Math.trunc((lastRowRef + firstRowRef)/2) ;
              } else  {
                primeTabDic.splice(0,primeTabDic.length);
                iPrimeDic=-1;
                midRowRef=0;
                trouve=true;
              }
            } else {
              firstRowRef=primeTabDic[iPrimeDic];
              lastRowRef=primeTabDic[iPrimeDic-1];
              midRowRef=Math.trunc((lastRowRef + firstRowRef)/2) ;
            }
            if (this.perf[midRowRef].lat===0 && iPrimeDic!==-1 && this.perf[lastRowRef].lat!==0 && this.perf[lastRowRef].lon!==0 && this.perf[firstRowRef].lat!==0 && this.perf[firstRowRef].lon!==0){
                
              this.perf[midRowRef].lat = (this.perf[lastRowRef].lat + this.perf[firstRowRef].lat)/2;
              this.perf[midRowRef].lon = (this.perf[lastRowRef].lon + this.perf[firstRowRef].lon)/2;
        
              /** to be deleted after testing  */
              tabTest.push({"row":0,"lat":0,"lon":0});
              tabTest[tabTest.length-1].row=midRowRef;
              tabTest[tabTest.length-1].lat=this.perf[midRowRef].lat;
              tabTest[tabTest.length-1].lon=this.perf[midRowRef].lon;
              // lastRowRef=midRowRef;
              if (midRowRef === primeTabDic[iPrimeDic] + 1 && midRowRef === primeTabDic[iPrimeDic-1] - 1){
                  primeTabDic.splice(iPrimeDic,1);
                  iPrimeDic--
              } else

              if (midRowRef > firstRowRef - 1){
                  iPrimeDic++
                  if (midRowRef>primeTabDic[iPrimeDic-1]){
                    primeTabDic[iPrimeDic]=primeTabDic[iPrimeDic-1];
                    primeTabDic[iPrimeDic-1]=midRowRef;
                  } else {
                    primeTabDic[iPrimeDic]=midRowRef;
                  }
                  
              } else if (midRowRef > primeTabDic[iPrimeDic - 1] + 1){
                  primeTabDic[iPrimeDic]=midRowRef;
                  midRowRef=0;
              } else {
                  primeTabDic.splice(iPrimeDic,1);
                  iPrimeDic--
              }
              
              /**************** */
            } else {
               if (iPrimeDic!==-1){

                primeTabDic.splice(iPrimeDic,1);
                iPrimeDic--
                midRowRef=0;
                if (this.perf[lastRowRef].lat===0 || this.perf[lastRowRef].lon0==0 || this.perf[firstRowRef].lat===0 || this.perf[firstRowRef].lon===0){
                  console.log(' lat & lon of record ' + lastRowRef + ' =0');
              } else {
                  console.log(' midRow ' + midRowRef + ' was already processed');
              }
            }}
            
          }

    }
    
}


  performancePerSec(){

  this.tabMeter.splice(0,this.tabMeter.length);
  this.tabSecond.splice(0,this.tabSecond.length);

  var distanceK = 0;
  var nbItemsMeter =0;
  var nbItemsSecond =0;
  this.alt.lowest=2000;
  this.alt.lDist=0;
  this.alt.highest=0;
  this.alt.hDist=0;
  this.heart.lowest=2000;
  this.heart.lDist=0;
  this.heart.highest=0;
  this.heart.hDist=0;
  this.speed.highest=0;
  this.speed.dist=0;

  const intervalSec = this.formOptions.controls['seconds'].value
  const intervalDistance = this.formOptions.controls['meters'].value / 1000;
  var iSec = 0;
  var jSec = 0;
  var kSec = 0;
  var kMeter = 0;
  var cumulSec = 0;
  var meterNotManaged = false;

  for (var i=1; i<this.perf.length; i++){

    if (this.perf[i].alt<this.alt.lowest){
      this.alt.lowest=this.perf[i].alt;
      this.alt.lDist=this.perf[i].dist;
    }
    if (this.perf[i].alt>this.alt.highest){
      this.alt.highest=this.perf[i].alt;
      this.alt.hDist=this.perf[i].dist;
    }
    if (this.perf[i].heart<this.heart.lowest){
      this.heart.lowest=this.perf[i].heart;
      this.heart.lDist=this.perf[i].dist;
    }
    if (this.perf[i].heart>this.heart.highest){
      this.heart.highest=this.perf[i].heart;
      this.heart.hDist=this.perf[i].dist;
    }
    if (this.perf[i].speed>this.speed.highest){
      this.speed.highest=this.perf[i].speed;
      this.speed.dist=this.perf[i].dist;
    }


    jSec=jSec+this.perf[i].time - this.perf[i-1].time;
    kMeter++
    meterNotManaged = false;

    if (this.perf[i].dist > intervalDistance * (nbItemsMeter + 1)){
      nbItemsMeter++
      this.tabMeter.push({dist:0,time:0,speed:0,strTime:"",cumulDist:0,cumulTime:"",cumulSpeed:0,cumulStrTime:""});
      this.tabMeter[this.tabMeter.length-1].cumulDist=this.perf[i-1].dist;
      this.tabMeter[this.tabMeter.length-1].cumulTime=this.perf[i-1].time;
      meterNotManaged = true;
    }
    if (jSec === intervalSec){
      nbItemsSecond++
      this.tabSecond.push({dist:0,interval:0,speed:0,cumulDist:0,cumulInterval:0,cumulTime:"",cumulSpeed:0});
      this.tabSecond[this.tabSecond.length-1].cumulDist = this.perf[i].dist;
      this.tabSecond[this.tabSecond.length-1].interval = intervalSec;
      cumulSec = cumulSec + intervalSec;
      jSec = 0;
    } else {
      if (jSec > intervalSec){
 
            kSec = this.perf[i].time - this.perf[i-1].time;
            // Distance during kSec
            distanceK = this.perf[i].dist - this.perf[i-1].dist;
            // Distance per second
            distanceK = distanceK / kSec
            
            
            nbItemsSecond = nbItemsSecond + 1
            this.tabSecond.push({dist:0,interval:0,speed:0,cumulDist:0,cumulInterval:0,cumulTime:"",cumulSpeed:0});
            this.tabSecond[this.tabSecond.length-1].cumulDist = this.perf[i-1].dist + ((intervalSec - (jSec - kSec)) * distanceK);
            this.tabSecond[this.tabSecond.length-1].interval = intervalSec;
            cumulSec = cumulSec + intervalSec;
            jSec = jSec - intervalSec
                const ModK = jSec % intervalSec;
                const RoundK = (iSec - ModK) / intervalSec;
                var IK = 0;
                while (IK < RoundK){
                    IK = IK + 1;
                    nbItemsSecond = nbItemsSecond + 1;
                    this.tabSecond.push({dist:0,interval:0,speed:0,cumulDist:0,cumulInterval:0,cumulTime:"",cumulSpeed:0});
                    this.tabSecond[this.tabSecond.length-1].interval = intervalSec;
                    this.tabSecond[this.tabSecond.length-1].cumulDist = this.tabSecond[this.tabSecond.length-2].cumulDist + distanceK * intervalSec;
                    cumulSec = cumulSec + intervalSec;
                  }
 
                jSec = ModK
                cumulSec = cumulSec + ModK
        }
    }
  }
  if (meterNotManaged === false){
      nbItemsMeter++
      this.tabMeter.push({dist:0,time:0,speed:0,strTime:"",cumulDist:0,cumulTime:0,cumulSpeed:0,cumulStrTime:""});
      this.tabMeter[this.tabMeter.length-1].cumulDist=this.perf[i-1].dist;
      this.tabMeter[this.tabMeter.length-1].cumulTime=this.perf[i-1].time;
  }

  if (jSec > 0){
      nbItemsSecond++
      this.tabSecond.push({dist:0,interval:0,speed:0,cumulDist:0,cumulInterval:0,cumulTime:"",cumulSpeed:0});
      this.tabSecond[this.tabSecond.length-1].cumulDist = this.perf[i-1].dist;
      this.tabSecond[this.tabSecond.length-1].interval = jSec;
  }
    //****************************/
    // complete the process for the display of all data


  //****************************/
  this.tabSecond[0].dist=this.tabSecond[0].cumulDist;
  this.tabSecond[0].speed=this.tabSecond[0].dist * 1000 / this.tabSecond[0].interval * 3.6;
  this.tabSecond[0].cumulInterval=Number(this.tabSecond[0].interval);
  this.tabSecond[0].cumulTime=formatHHMNSS(this.tabSecond[0].cumulInterval) ;
  this.tabSecond[0].cumulSpeed=Number(this.tabSecond[0].speed);
  for (var i=1; i<this.tabSecond.length; i++){
    
    this.tabSecond[i].dist=Number(this.tabSecond[i].cumulDist) - Number(this.tabSecond[i-1].cumulDist);
    this.tabSecond[i].speed=Number(this.tabSecond[i].dist) * 1000 / Number(this.tabSecond[i].interval) * 3.6;

    this.tabSecond[i].cumulInterval=Number(this.tabSecond[i].interval) + Number(this.tabSecond[i-1].cumulInterval);

    this.tabSecond[i].cumulTime=formatHHMNSS(this.tabSecond[i].cumulInterval) ;
    this.tabSecond[i].cumulSpeed=Number(this.tabSecond[i].cumulDist) * 1000 / Number(this.tabSecond[i].cumulInterval) * 3.6;;

  }
 //****************************/
    this.tabMeter[0].dist=this.tabMeter[0].cumulDist;
    this.tabMeter[0].time=this.tabMeter[0].cumulTime;
    this.tabMeter[0].strTime=formatHHMNSS(this.tabMeter[0].time) ;
   
    this.tabMeter[0].speed=Number(this.tabMeter[0].dist)  * 1000 / Number(this.tabMeter[0].time) * 3.6;
    this.tabMeter[0].cumulStrTime=this.tabMeter[0].strTime;
    this.tabMeter[0].cumulSpeed=this.tabMeter[0].speed;
    for (var i=1; i<this.tabMeter.length; i++){
      this.tabMeter[i].dist=this.tabMeter[i].cumulDist - this.tabMeter[i-1].cumulDist;
      this.tabMeter[i].time=this.tabMeter[i].cumulTime - this.tabMeter[i-1].cumulTime;

      this.tabMeter[i].strTime=formatHHMNSS(this.tabMeter[i].time) ;
      this.tabMeter[i].speed=Number(this.tabMeter[i].dist)  * 1000 / Number(this.tabMeter[i].time) * 3.6;

      this.tabMeter[i].cumulStrTime=formatHHMNSS(this.tabMeter[i].cumulTime) ;
      this.tabMeter[i].cumulSpeed=Number(this.tabMeter[i].cumulDist)  * 1000 / Number(this.tabMeter[i].cumulTime) * 3.6;
    }

    this.scroller.scrollToAnchor('bottomPage');
    this.isPerfProcessCompleted=true;
}

GetRecord(bucketName:string,objectName:string, iWait:number){
  this.errorMessage="";
  this.EventHTTPReceived[iWait]=false;
  this.NbWaitHTTP++;
  this.waitHTTP(this.TabLoop[iWait],30000,iWait);
  this.ManageGoogleService.getContentObject(this.configServer, bucketName, objectName )
      .subscribe((data ) => {  
          if (iWait===0){
          }
      },
      error => {
        this.errorMessage='failure to get record ' + objectName +' ;  error = '+ JSON.stringify(error);
        console.log(this.errorMessage);
      })
}


getBucket(){
  this.errorMessage="";

  this.ManageGoogleService.getListBuckets(this.configServer)
    .subscribe(
      data => {
        if (data.status===undefined ){
          console.log('successful retrieval of list of buckets ');
          this.TabBuckets =data;
        } else {
          this.errorMessage=data.msg;
        }
      },
      error => {
        this.errorMessage='failure to get list of buckets ;  error = '+ error;
        console.log(this.errorMessage);
       
      });
}

cancelFile(){
  this.isConfirmSave=false;
}

createFilePerf(){
  this.filePerf.fileType='perfRawData';
  this.filePerf.circuit='';
  this.filePerf.name=this.SelectedBucketInfo.name;
  this.filePerf.sport=this.formOptions.controls['sport'].value;
  this.filePerf.theDate=this.formOptions.controls['theDate'].value;
  this.filePerf.content=this.perf;
}

saveFile(){
  this.errorMessage='';
  this.createFilePerf();

  const theType='application/json';
  // const fileName =this.formOptions.controls["fileName"].value;
  var file=new File ([JSON.stringify(this.filePerf)], this.formOptions.controls["fileName"].value, {type: theType});
 
  this.ManageGoogleService.uploadObjectMetaPerso(this.configServer, this.identification.performanceSport.bucket, file , this.formOptions.controls["fileName"].value, "", theType, this.tabMetaPerso)
    .subscribe(
      res => {
        if (res.type===4){ 
          this.errorMessage="file " + this.formOptions.controls["fileName"].value + " has been successfully saved"
          this.isConfirmSave=false;
        }
      }, 
      err => {
        this.errorMessage='failure to get record ' + this.formOptions.controls["fileName"].value + ' ;  error = '+ JSON.stringify(err);
        console.log(this.errorMessage);
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


processGPXfile(event:any){
  var fnConvert=fromGPXtoTXT(event);
  var file=new File ([JSON.stringify(fnConvert.theFile)], 'myJSON-GPXfile', {type: 'application/json'});
  this.ManageGoogleService.uploadObject(this.configServer, 'xmv-tests', file ,  'myJSON-GPXfile')
              .subscribe(
        res => {
            if (res.type===4){ 

            }
        })
  var file=new File ([JSON.stringify(fnConvert.theTXT)], 'myTEXT-GPXfile', {type: 'application/json'}); 
  this.ManageGoogleService.uploadObject(this.configServer, 'xmv-tests', file ,  'myTEXT-GPXfile')
                .subscribe(
        res => {
            if (res.type===4){ 
                  console.log('GPX text file is saved');
            }
        },
        err => {
            console.log(err);
        })

}

processTCXfile(event:any){
  var fnConvert=fromTCXtoJSON(event);
  var file=new File ([JSON.stringify(fnConvert.theLaps)], 'myJSON-CSVfile', {type: 'application/json'});
  this.ManageGoogleService.uploadObject(this.configServer, 'xmv-tests', file ,  'myJSON-CSVfile')
              .subscribe(
      res => {
        if (res.type===4){ 

          }
      })

  var file=new File ([JSON.stringify(fnConvert.thePerf)], 'myJSON-TCXfile', {type: 'application/json'});
  this.ManageGoogleService.uploadObject(this.configServer, 'xmv-tests', file ,  'myJSON-TCXfile')
              .subscribe(
      res => {
        if (res.type===4){ 

          }
      })

}

}

