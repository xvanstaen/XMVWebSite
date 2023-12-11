import { Component, OnInit , Input, Output, HostListener,  OnDestroy, HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject} from '@angular/core';
  
import { DatePipe, formatDate } from '@angular/common'; 

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, UntypedFormControl,FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { Observable } from 'rxjs';

import { findIds, formatHHMNSS } from '../MyStdFunctions';

import {msginLogConsole} from '../consoleLog'
import { configServer, LoginIdentif, OneBucketInfo, classFilePerf, classFileSport, classPointOfRef, msgConsole, classCredentials } from '../JsonServerClass';
import { classGarminGoldenCheetah } from '../classGarminGoldenCheetah';

import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';



@Component({
  selector: 'app-performance-sport',
  templateUrl: './performance-sport.component.html',
  styleUrls: ['./performance-sport.component.css']
})
export class PerformanceSportComponent {


  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageMangoDBService: ManageMangoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    ) { }

    @Output() newCredentials= new EventEmitter<any>();
    @Output() returnFile= new EventEmitter<any>();
    @Output() resetServer= new EventEmitter<any>();
    @Output() returnPerf= new EventEmitter<any>();

    @Input() configServer = new configServer;
    @Input() identification= new LoginIdentif;

    @Input() isPerfRetrieved : boolean = false;
    tabPoR:Array<classPointOfRef>=[];
    perf:Array<any>=[];
    filePerf=new classFileSport;
    perfLaps:Array<any>=[];
    i : number = 0;
    lastOccurrence:number=0;
    cheetahRecord = new classGarminGoldenCheetah;

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

ngOnInit(){

  this.bucketName=this.identification.performanceSport.bucket;


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

processGPXfile(event:any){
const trkpt ='<trkpt';
const lat='lat=\"';
const lon='lon="';
const ele='ele>';
const strTime='time>'
const heart='ns3:hr>';
var trouve=false;
var myGPXFile:Array<any>=[];
var myGPXtxt:string='';
myGPXFile.splice(0,myGPXFile.length);
var strGPX=event.text;
var strLen=strGPX.length;
var prevTime=0;
while (strLen>0){

  var sTrkpt=strGPX.indexOf(trkpt);
  if (sTrkpt!==-1){
    var eTrkpt=strGPX.indexOf('</trkpt>');
    var strSearch=strGPX.substring(sTrkpt,eTrkpt);
    myGPXFile.push({lat:0,lon:0,ele:0,heart:0,time:'',elapse:0, cumulElapse:0});
    var start=strSearch.indexOf(lat) + lat.length;
    var end=strSearch.indexOf('\" lon=\"');
    myGPXFile[myGPXFile.length-1].lat=strSearch.substring(start,end);
    myGPXtxt=myGPXtxt+strSearch.substring(start,end)+"\t";
  
    const strLon=strSearch.substring(end);
    start=strLon.indexOf(lon) + lon.length;
    end=strLon.indexOf('\">\n');
    myGPXFile[myGPXFile.length-1].lon=strLon.substring(start,end);
    myGPXtxt=myGPXtxt+strLon.substring(start,end)+"\t";

    start=strSearch.indexOf(ele) + ele.length;
    end=strSearch.indexOf('</'+ele);
    myGPXFile[myGPXFile.length-1].ele=strSearch.substring(start,end);
    myGPXtxt=myGPXtxt+strSearch.substring(start,end)+"\t";

    start=strSearch.indexOf(heart) + heart.length;
    end=strSearch.indexOf('</'+heart);
    myGPXFile[myGPXFile.length-1].heart=strSearch.substring(start,end);
    myGPXtxt=myGPXtxt+strSearch.substring(start,end)+"\t";
  
    start=strSearch.indexOf('<'+strTime) + strTime.length + 1;
    end=strSearch.indexOf('</'+strTime);
    myGPXFile[myGPXFile.length-1].time=strSearch.substring(start,end);
    myGPXtxt=myGPXtxt+strSearch.substring(start,end)+"\t";

    start=myGPXFile[myGPXFile.length-1].time.indexOf('T') +  1;
    end=myGPXFile[myGPXFile.length-1].time.indexOf('.000Z');

    const Thour=Number(myGPXFile[myGPXFile.length-1].time.substring(start,start+2));
    const Tmn=Number(myGPXFile[myGPXFile.length-1].time.substring(start+3,start+5));
    const Tsec=Number(myGPXFile[myGPXFile.length-1].time.substring(start+6,start+8));
    
    if (myGPXFile.length>1){
      myGPXFile[myGPXFile.length-1].elapse=(Thour)*3600+Tmn*60+Tsec - prevTime;
      myGPXFile[myGPXFile.length-1].cumulElapse=myGPXFile[myGPXFile.length-2].cumulElapse+myGPXFile[myGPXFile.length-1].elapse;
    } else {
      myGPXFile[myGPXFile.length-1].elapse=0;
      myGPXFile[myGPXFile.length-1].cumulElapse==0;
    }
    myGPXtxt=myGPXtxt+myGPXFile[myGPXFile.length-1].cumulElapse+"\r\n";
    prevTime = Thour*3600+Tmn*60+Tsec;


    strGPX=strGPX.substring(eTrkpt+8);
    strLen=strGPX.length;
  } else {
    strLen=0;
  }
}

    var file=new File ([JSON.stringify(myGPXFile)], 'myJSON-GPXfile', {type: 'application/json'});
      
    this.ManageGoogleService.uploadObject(this.configServer, 'xmv-tests', file ,  'myJSON-GPXfile')
        .subscribe(
            res => {
                if (res.type===4){ 

                }
          })
      var file=new File ([JSON.stringify(myGPXtxt)], 'myTEXT-GPXfile', {type: 'application/json'}); 
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

  const lap='Lap StartTime=\"';
  const timeSec='TotalTimeSeconds>';
  const distMeters='DistanceMeters>';
  const calories='Calories>';
  const maxSpeed='MaximumSpeed>';
  const maxHeartRate='MaximumHeartRateBpm>';
  const avgHeartRate='AverageHeartRateBpm>';
  const heartValue='Value>'
  const track="Trackpoint>";
  const lengthText=event.text.length;
  const zoulou='000Z';

  var theStr=event.text;
  var trouve=false;
  var nbLaps=0;
  var iLoop=0;
  var maxLoop=100;
  this.perfLaps.splice(0,this.perfLaps.length);
  while (trouve===false && iLoop<maxLoop){
    iLoop++
    const startLap = theStr.indexOf('<'+lap);
    const endLap = theStr.indexOf('</Lap>');
    if (startLap!==-1 && endLap!==-1){
        var strLap = theStr.substring(startLap,endLap);
        this.perfLaps.push({lap:0,date:"",dist:0,maxSpeed:0,maxHeart:0,avgHeart:0,cal:0});
        nbLaps++
        this.perfLaps[this.perfLaps.length-1].lap=nbLaps;
        var sLength=strLap.indexOf(lap)+lap.length;
        var eLength=strLap.indexOf(zoulou)+4;
        this.perfLaps[this.perfLaps.length-1].date=strLap.substring(sLength,eLength);

        sLength=strLap.indexOf(timeSec)+timeSec.length;
        eLength=strLap.indexOf('</'+timeSec);
        this.perfLaps[this.perfLaps.length-1].time=strLap.substring(sLength,eLength);

        sLength=strLap.indexOf(calories)+calories.length;
        eLength=strLap.indexOf('</'+calories);
        this.perfLaps[this.perfLaps.length-1].cal=strLap.substring(sLength,eLength);

        sLength=strLap.indexOf(distMeters)+distMeters.length;
        eLength=strLap.indexOf('</'+distMeters);
        this.perfLaps[this.perfLaps.length-1].dist=strLap.substring(sLength,eLength);

        sLength=strLap.indexOf(maxSpeed)+maxSpeed.length;
        eLength=strLap.indexOf('</'+maxSpeed);
        this.perfLaps[this.perfLaps.length-1].maxSpeed=Number(strLap.substring(sLength,eLength))*3.6;

        sLength=strLap.indexOf(avgHeartRate);
        eLength=strLap.indexOf('</'+avgHeartRate);
        var strB=strLap.substring(sLength,eLength);
        sLength=strB.indexOf(heartValue)+heartValue.length;
        eLength=strB.indexOf('</'+heartValue);
        this.perfLaps[this.perfLaps.length-1].avgHeart=strB.substring(sLength,eLength);

        sLength=strLap.indexOf(maxHeartRate);
        eLength=strLap.indexOf('</'+maxHeartRate);
        strB=strLap.substring(sLength,eLength);
        sLength=strB.indexOf(heartValue)+heartValue.length;
        eLength=strB.indexOf('</'+heartValue);
        this.perfLaps[this.perfLaps.length-1].maxHeart=strB.substring(sLength,eLength);
       

        for (var i=strLap.length; i>0; i--){
            const startTrack=strLap.indexOf('<'+track);
            const endTrack=strLap.indexOf('</'+track);
            if (startTrack!==-1 && endTrack !==-1){
                const strTrack=strLap.substring(startTrack,endTrack);
                this.processTrackPoint(strTrack);
                strLap=strLap.substring(endTrack+track.length);
            } else i=0;

        }

        theStr=theStr.substring(endLap+6);

    } else {
      trouve=true;

      var file=new File ([JSON.stringify(this.perfLaps)], 'myJSON-CSVfile', {type: 'application/json'});
 
      this.ManageGoogleService.uploadObject(this.configServer, 'xmv-tests', file ,  'myJSON-CSVfile')
        .subscribe(
          res => {
            if (res.type===4){ 

            }
          })
      file=new File ([JSON.stringify(this.perf)], 'myJSON-TCXfile', {type: 'application/json'});
      
            this.ManageGoogleService.uploadObject(this.configServer, 'xmv-tests', file ,  'myJSON-TCXfile')
              .subscribe(
                res => {
                  if (res.type===4){ 

                  }
          })
    }
  }
  console.log('end');
}

processTrackPoint(theString:string){
  var tabLabels=['Time>','LatitudeDegrees>','LongitudeDegrees>','AltitudeMeters>','DistanceMeters>','Value>','ns3:Speed>']
  var tabResults=[];
  // const heart='HeartRateBpm>';
  
  for (var i=0; i<tabLabels.length; i++){
    const start=theString.indexOf('<'+tabLabels[i]) + tabLabels[i].length;
    const end=theString.indexOf('</'+tabLabels[i]);
    tabResults[i]=theString.substring(start+1,end);
  }
  const thePerf=new classFilePerf;
  //this.perf.push({time:'',dist:0,speed:0,heart:0,alt:0,lat:0,lon:0,slope:0});
  this.perf.push(thePerf);
  this.perf[this.perf.length-1].time=tabResults[0];
  this.perf[this.perf.length-1].lat=Number(tabResults[1]);
  this.perf[this.perf.length-1].lon=Number(tabResults[2]);
  this.perf[this.perf.length-1].alt=Number(tabResults[3]);
  this.perf[this.perf.length-1].dist=Number(tabResults[4]);
  this.perf[this.perf.length-1].heart=Number(tabResults[5]);
  if (Number(tabResults[6])*3.6===0 && this.perf.length>1){
      this.perf[this.perf.length-1].speed=(this.perf[this.perf.length-1].dist-this.perf[this.perf.length-2].dist)*100*3.6;
  } else {
      this.perf[this.perf.length-1].speed=Number(tabResults[6])*3.6;
  }
  

  if (this.perf.length>1){
      this.perf[this.perf.length-1].slope=(this.perf[this.perf.length-2].alt-this.perf[this.perf.length-1].alt)/(this.perf[this.perf.length-2].dist-this.perf[this.perf.length-1].dist)*100;
  }

}


file=new File([JSON.stringify(event)], 'myGPXfile', {type: 'application/json'});
ReceivedData(event:any){
    //this.theReceivedData=event;
    // console.log('performance-sport event is:' + JSON.stringify(event));
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
    if (typeof event==="object" && event.text!==undefined){
        const lengthText=event.text.length;
        const isGPX = event.text.indexOf('<gpx creator=');
        if (isGPX === -1){
          var fileTCX = event.text.indexOf("<TotalTimeSeconds>"); // format of the file is TCX
          if (fileTCX!==-1){
            this.file=new File ([JSON.stringify(event)], 'myTCXfile', {type: 'application/json'});
          }
        } else {
            this.file=new File ([JSON.stringify(event)], 'myGPXfile', {type: 'application/json'});
 
        } 

        
        this.ManageGoogleService.uploadObject(this.configServer, 'xmv-tests', this.file ,  'myTCXfile')
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
          
          for ( this.i=0; this.i<lengthText && stringNumber.indexOf(event.text.substring(this.i,this.i+1))===-1 ; this.i++){
          }
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
                        //this.perf.push({time:'',dist:0,speed:0,heart:0,alt:0,lat:0,lon:0,slope:0});
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
        }
    } else if (event.fileType!==undefined){
        for (j=0; j<event.content.length; j++){
          const thePerf=new classFilePerf;
          //this.perf.push({time:'',dist:0,speed:0,heart:0,alt:0,lat:0,lon:0,slope:0});
          this.perf.push(thePerf);
          if (event.content[j].sec!==undefined){
            this.perf[j].time=event.content[j].sec;
          } else if (event.content[j].time!==undefined){
            this.perf[j].time=event.content[j].time;
          }
          this.perf[j].dist=event.content[j].dist;
          this.perf[j].speed=event.content[j].speed;
          if (event.content[j].heart!==undefined) {
            this.perf[j].heart=event.content[j].heart;
          }
          if (event.content[j].heart!==undefined) {
            this.perf[j].speed=event.content[j].speed;
          }
          if (event.content[j].alt!==undefined) {
            this.perf[j].alt=event.content[j].alt;
          }
          if (event.content[j].lat!==undefined) {
            this.perf[j].lat=event.content[j].lat;
          }
          if (event.content[j].lon!==undefined) {
            this.perf[j].lon=event.content[j].lon;
          }
          if (event.content[j].slope!==undefined) {
            this.perf[j].slope=event.content[j].slope;
          }

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
    

    if (this.isPerfRetrieved===true){
      this.createFilePerf();
      console.log('Performance-sport end process, SelectedBucketInfo.name' + this.SelectedBucketInfo.name + '  name of the file=' + this.filePerf.name + "  and length of perf file is " + this.filePerf.content.length);
      this.returnPerf.emit({name:this.SelectedBucketInfo.name,file:this.filePerf});
    }

  }

  isFileProcessed:boolean=false;

  errorMsg:string="";
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
    console.log('end of the loop');

    
}

  tabSecond:Array<any>=[];
  tabMeter:Array<any>=[];
  alt={lowest:2000,lDist:0,highest:0,hDist:0};
  heart={lowest:200,lDist:0,highest:0,hDist:0};
  speed={highest:0,dist:0}

  isPerfProcessCompleted:boolean=false;
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
        console.log('successful retrieval of list of buckets ');
        this.TabBuckets =data;
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
  this.filePerf.name='';
  this.filePerf.sport=this.formOptions.controls['sport'].value;
  this.filePerf.theDate=this.formOptions.controls['theDate'].value;
  this.filePerf.content=this.perf;
}

saveFile(){
  this.errorMessage='';
  this.createFilePerf();
  // const fileName =this.formOptions.controls["fileName"].value;
  var file=new File ([JSON.stringify(this.filePerf)], this.formOptions.controls["fileName"].value, {type: 'application/json'});
 
  this.ManageGoogleService.uploadObject(this.configServer, this.identification.performanceSport.bucket, file , this.formOptions.controls["fileName"].value)
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


}

/**
 fillLatLon(startR:number,endR:number ){
  var tabDic:Array<any>=[];

  var totalRow=endR - startR +1;
  var k=1;

  tabDic[k]=Math.trunc(totalRow/2);
  this.perf[startR+tabDic[k]].lat = (this.perf[endR+1].lat + this.perf[startR-1].lat)/2;
  this.perf[startR+tabDic[k]].lon = (this.perf[endR+1].lon + this.perf[startR-1].lon)/2;

  var refRow=tabDic[k];
  for (var i=0; i<totalRow; i++){
    refRow=Math.trunc(refRow/2);
    var endLoop=false;
    k++;
    tabDic[k]=refRow;
    if (this.perf[startR+tabDic[k]].lat===0){
      for (var l=startR+tabDic[k]-1; l>startR-2 && this.perf[l].lat===0; l--){};
      for (var m=startR+tabDic[k]+1; m<endR+2 && this.perf[m].lat===0; m++){};
      this.perf[startR+tabDic[k]].lat = (this.perf[m].lat + this.perf[l].lat)/2;
      this.perf[startR+tabDic[k]].lon = (this.perf[m].lon + this.perf[l].lon)/2;
    }
    

    
    for (var j= 3; endLoop===false; j++){
      if (refRow * j<totalRow){
        k++;
        tabDic[k]=refRow * j;
        if (this.perf[startR+tabDic[k]].lat===0){
          for (var l=startR+tabDic[k]-1; l>startR-2 && this.perf[l].lat===0; l--){};
          for (var m=startR+tabDic[k]+1; m<endR+2 && this.perf[m].lat===0; m++){};
          this.perf[startR+tabDic[k]].lat = (this.perf[m].lat + this.perf[l].lat)/2;
          this.perf[startR+tabDic[k]].lon = (this.perf[m].lon + this.perf[l].lon)/2;
        }
      } else {endLoop=true}
    }
    if (refRow===2){
      i=totalRow+1;
    }
     console.log('end dichotomie');
  }

  for (var i=startR; i<endR+1; i++){
      if (this.perf[i].lat === 0){
          for (var l=i-1; l>startR-2 && this.perf[l].lat===0; l--){};
          for (var n=i+1; n<endR+2 && this.perf[n].lat===0; n++){};
          this.perf[i].lat = (this.perf[n].lat + this.perf[l].lat)/2;
          this.perf[i].lon = (this.perf[n].lon + this.perf[l].lon)/2;
      }
  }
}
 */
