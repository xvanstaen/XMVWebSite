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

import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { ManageMongoDBService } from 'src/app/CloudServices/ManageMongoDB.service';


@Component({
  selector: 'app-sport-analysis',
  templateUrl: './sport-analysis.component.html',
  styleUrls: ['./sport-analysis.component.css']
})
export class SportAnalysisComponent {

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

  allFilesPerf:Array<any>=[];
  allFilesTotal:Array<any>=[];
    
  displayPerf=new classFileSport;;
  //displayTotal:Array<any>=[];
  displayTotal:Array<classTotalLoop>=[];
  myListOfObjects=new Bucket_List_Info;
  specificCircuit= new classCircuitRec;
  selectionCircuit:boolean=true;
  isSpecificCircuitReceived:boolean=false;
  bucketName:string="xmv-sport-analysis";
  SelectedBucketInfo=new OneBucketInfo;
  NbRefresh_Bucket=0;
  displayListOfObjects:boolean=false;
  tabDelFile:Array<string>=[];
  nbFilesToRead:number=0;
  nbFilesRead:number=0;
  userSelection:Array<any>=[];
  boxWidth:number=0;

  formOptions: FormGroup = new FormGroup({ 
    seconds: new FormControl(800, { nonNullable: true }),
    meters: new FormControl(500, { nonNullable: true }),
    fileName: new FormControl("", { nonNullable: true }),
  })
  message:string="";

ngOnInit(){
  this.scroller.scrollToAnchor('bottomPage');
}

onSelectCircuit(event:any){
  this.specificCircuit.points.splice(0,this.specificCircuit.points.length);
  this.specificCircuit=event;
  //this.selectionCircuit=false;
  this.isSpecificCircuitReceived=true;
  this.scroller.scrollToAnchor('bottomPage');
  this.RetrieveAllObjects();
// retrieve and display all 'perFile' related to the selected circuit

}

BucketInfo(event:any){
  this.SelectedBucketInfo=event;
  this.formOptions.controls["fileName"].setValue(this.SelectedBucketInfo.name);
 
}
selFile:string="";
isSelectedFile:boolean=false;
retrieveSelectedFiles(event:any){

    // name of the file is : event.target.textContent

    const iSel=event.target.id.substring(4).trim();
    if (this.userSelection[iSel].sel==='N'){
      this.userSelection[iSel].sel='Y';
      this.isSelectedFile=true;
      if (this.userSelection[iSel].iFileNb ===-1){
        this.userSelection[iSel].iFileNb = -2;
        this.getContentFile(this.bucketName,this.userSelection[iSel].codeName,iSel);
    } 
    } else {
      this.userSelection[iSel].sel='N';
      this.checkSelection();
  }
   
}

selectAll(){
  for (var iSel=0; iSel<this.userSelection.length ; iSel++){
    this.userSelection[iSel].sel="Y";
    if (this.userSelection[iSel].iFileNb ===-1){
        this.userSelection[iSel].iFileNb = -2;
        this.getContentFile(this.bucketName,this.userSelection[iSel].codeName,iSel);
    } 
  }
  this.isSelectedFile=true;
}

deSelectAll(){
  for (var i=0; i<this.userSelection.length ; i++){
    this.userSelection[i].sel="N"
  }
  this.isSelectedFile=false;
}

checkSelection(){
  this.isSelectedFile=false;
  for (var i=0; i<this.userSelection.length && this.isSelectedFile===false; i++){
    if (this.userSelection[i].sel==="Y"){
      this.isSelectedFile=true;
      if (this.userSelection[i].iFileNb ===-1){
          this.userSelection[i].iFileNb = -2;
          this.getContentFile(this.bucketName,this.userSelection[i].name,i);
      } 
    }
  }
}


RetrieveAllObjects(){
  this.nbLoop=0;
  this.message="";
  this.nbFilesToRead=0;
  this.nbFilesRead=0;
  this.myListOfObjects.items.splice(0, this.myListOfObjects.items.length);
  this.tabDelFile.splice(0, this.tabDelFile.length);
  this.displayListOfObjects=false;
  this.userSelection.splice(0,this.userSelection.length);
  this.ManageGoogleService.getListObjects(this.configServer, this.bucketName )
          .subscribe((data ) => {
            this.myListOfObjects.items.splice(0,this.myListOfObjects.items.length);
            for (var i=0; i<data.length; i++){
              if (data[i].name.indexOf('-perf-')!==-1 && data[i].name.indexOf(this.specificCircuit.code)!==-1){
                const theObject= new OneBucketInfo;
                this.myListOfObjects.items.push(theObject);
                this.myListOfObjects.items[this.myListOfObjects.items.length-1].name=data[i].name;

                this.userSelection.push({sel:"", type:"",object:"", codeName:"", iFileNb:-1});
                this.userSelection[this.userSelection.length-1].sel='N';
                this.userSelection[this.userSelection.length-1].type='perf';
                this.userSelection[this.userSelection.length-1].object="";
                this.userSelection[this.userSelection.length-1].codeName=data[i].name;
                this.userSelection[this.userSelection.length-1].iFileNb=-1;
                
              }

            }
            this.displayListOfObjects=true;
            
          },
          error_handler => {
            this.message='RetrieveAllObjects() - error handler= '+ error_handler;
            console.log(this.message);          } 
    )
  }


deleteFileItems(){
  for (var i=this.tabDelFile.length-1; i>-1; i--){
    if (this.tabDelFile[i]==="D"){
      this.myListOfObjects.items.splice(i,1);
      this.tabDelFile.splice(i,1);
    }
  }
  this.displayListOfObjects=true;
}

getContentFile(bucket:string, object:string, iList:number){
  this.message='';
  this.ManageGoogleService.getContentObject(this.configServer, bucket, object )
    .subscribe((data ) => {
            const onePerf= new classFileSport;
            this.allFilesPerf.push(onePerf);
            this.allFilesPerf[this.allFilesPerf.length-1]=data;
            this.allFilesPerf[this.allFilesPerf.length-1].codeName=object;
            this.userSelection[iList].iFileNb =this.allFilesPerf.length-1;
            if (this.callCreateDisplay===true){
              this.nbFilesRead--
              if (this.nbFilesRead===0){
                this.createDisplay();
              }
            }
    },
    err => {
      this.userSelection[iList].iFileNb=-1;
      if (this.callCreateDisplay===true){
        this.nbFilesRead--
      }
    })
}

iFileCol:Array<number>=[];
theWidth:number=0;
selectedFilesRetrieved:boolean=false;
nbFilesToDisplay:number=0;
callCreateDisplay:boolean=false;
AnalyzeFiles(){
  
  var fileToRetrieve = false;
  this.displayTotal.splice(0,this.displayTotal.length);
  
  this.displayPerf.content.splice(0,this.displayPerf.content.length);
  this.nbFilesToDisplay=0;
  this.selectedFilesRetrieved=false;
  this.callCreateDisplay=true;
  for (var i=0; i<this.userSelection.length; i++){
    
    if (this.userSelection[i].sel==='Y'){
      //for (iFile=0; iFile<this.allFilesPerf.length && this.userSelection[i].codeName!==this.allFilesPerf[iFile].codeName; iFile++){}
      //if (iFile===this.allFilesPerf.length){
        // file not found, retrieve it
        
        if (this.userSelection[i].iFileNb === -1){
          fileToRetrieve=true;
          this.userSelection[i].iFileNb = -2;
          this.nbFilesToDisplay++
          this.getContentFile(this.bucketName,this.userSelection[i].codeName,i);
        }
        // if (this.userSelection[i].iFileNb === -2) this means4567890 that the file is being retrieved
      //}
    } 

    }
    if (fileToRetrieve===false){
      this.createDisplay();
    }
  
  }

createDisplay(){
  var iFile=0;
  var nbiFile=0;
  var i=0;
  var j=0;
  var k=0;
  // create the reference circuit to ensure that all files are processed accordingly
  // delete these records once the display file is built
  for (i=0; i<this.specificCircuit.points.length; i++){ 
    this.displayPerf.content.push({newLoop:[]})
    const theLoop=new classNewLoop;
    this.displayPerf.content[i].newLoop.push(theLoop);
    
    if (i!==this.specificCircuit.points.length-1){
      this.displayPerf.content[i].newLoop[0].from=this.specificCircuit.points[i].ref;
      this.displayPerf.content[i].newLoop[0].to=this.specificCircuit.points[i+1].ref;
    } else {
      this.displayPerf.content[i].newLoop[0].from=this.specificCircuit.points[i].ref;
      this.displayPerf.content[i].newLoop[0].to= 'end loop';
    }
  }

  var firstPass=-1;
  for (var iSel=0; iSel<this.userSelection.length; iSel++){
    if (this.userSelection[iSel].sel==='Y'){
        firstPass++
        iFile=this.userSelection[iSel].iFileNb;
        nbiFile++
        var l=0;
        for (i=0; i<this.allFilesPerf[iFile].content.length; i++){
          
          if (this.displayPerf.content.length===i){ // should not happen has the file was initialised with the circuit data
            this.displayPerf.content.push({newLoop:[]})
            l=this.displayPerf.content.length-1;
          } else {l=i}
          var trouve=false;
          if (this.displayPerf.content[l].newLoop[0].to ==='end loop') {
            this.displayPerf.content[l].newLoop[0].to =this.allFilesPerf[iFile].content[l].newLoop[0].to;
          }
          if (this.allFilesPerf[iFile].content[l].newLoop[0].from!==this.displayPerf.content[l].newLoop[0].from ||
                this.allFilesPerf[iFile].content[l].newLoop[0].to!==this.displayPerf.content[l].newLoop[0].to){
                  // the from-to does not macth
                for ( k=0; k<this.allFilesPerf[iFile].content.length  && 
                      this.allFilesPerf[iFile].content[l].newLoop[0].from!==this.displayPerf.content[k].newLoop[0].from; k++){} // searching for exact from-to match
                if (this.allFilesPerf[iFile].content[l].newLoop[0].from!==this.displayPerf.content[k-1].newLoop[0].from){
                      for ( k=0; k<this.allFilesPerf[iFile].content.length  && 
                          this.allFilesPerf[iFile].content[l].newLoop[0].to!==this.displayPerf.content[k].newLoop[0].to; k++){} 
                      if (this.allFilesPerf[iFile].content[l].newLoop[0].to!==this.displayPerf.content[k-1].newLoop[0].to){
                          console.log('there is a problem with the creation of the file "filePerf"')
                          
                          } else { // true was found
                            
                            l=k-1;
                          }
                  } else { // from was found
                  
                    l=k-1;
                  }
              }
             
              for (j=0; i<this.allFilesPerf[iFile].content.length && j<this.allFilesPerf[iFile].content[l].newLoop.length ; j++){
                if (this.allFilesPerf[iFile].content[0].newLoop[j].loopDel!=='D'){
                    if (j===0 && firstPass===0){

                    } else {
                        const theLoop=new classNewLoop;
                        this.displayPerf.content[l].newLoop.push(theLoop);
                    }
                    const iLoop = this.displayPerf.content[l].newLoop.length-1;
                    if (this.displayPerf.content[l].newLoop[iLoop].exclude!=='E'){
                        this.displayPerf.content[l].newLoop[iLoop]=this.allFilesPerf[iFile].content[i].newLoop[j];
                    }                      
                    this.iFileCol[iLoop]=nbiFile;
                  }  
                }
              
              if (i===this.allFilesPerf[iFile].content.length-1){ // sanity check; must ensure there is same number of "new loop" for each leg of the circuit
                  for ( i=1; i<this.displayPerf.content.length; i++){
                      if (this.displayPerf.content[i].newLoop.length<this.displayPerf.content[0].newLoop.length){
                        for (j=this.displayPerf.content[i].newLoop.length; j<this.displayPerf.content[0].newLoop.length; j++){
                          const theLoop=new classNewLoop;
                          this.displayPerf.content[i].newLoop.push(theLoop);
                        }
                      }
                    }
                  }
              }
            }
          } 
        

    this.boxWidth=this.displayPerf.content[0].newLoop.length*70+240;
    if (this.boxWidth<680){
      this.theWidth=this.boxWidth;
    } else {
      this.theWidth=680;
    }

      for (j=0; j<this.displayPerf.content[0].newLoop.length; j++){
       
          const classTot=new classTotalLoop;
          this.displayTotal.push(classTot);
          this.displayTotal[j].from=this.displayPerf.content[0].newLoop[0].from;
          this.displayTotal[j].to=this.displayPerf.content[this.displayPerf.content.length-1].newLoop[0].to;

          for ( i=0; i<this.displayPerf.content.length; i++){
            
            if (j<this.displayPerf.content[i].newLoop.length){
              if (this.displayPerf.content[i].newLoop[j]!==undefined){
                  this.displayTotal[j].dist=this.displayTotal[j].dist+this.displayPerf.content[i].newLoop[j].dist;
                  this.displayTotal[j].theTime=this.displayTotal[j].theTime+this.displayPerf.content[i].newLoop[j].theTime;
                  if (i===this.displayPerf.content.length-1){
                      this.displayTotal[j].strTime=formatHHMNSS(this.displayTotal[j].theTime);
                      this.displayTotal[j].speed= this.displayTotal[j].dist * 1000 / this.displayTotal[j].theTime * 3.6;
                  }
              
              } else {
                  this.displayPerf.content[i].newLoop.splice(j,1);
                  j--
              }
            } 
          } 
    }
}


nbLoop:number=0;
getFile(bucket:string, object:string, iList:number){
  this.message='';
  this.ManageGoogleService.getContentObject(this.configServer, bucket, object )
    .subscribe((data ) => {
      console.log('RetrieveSelectedFile='+object);
      this.nbFilesRead++
      if (data.circuit!==this.specificCircuit.name){
          // remove the item from the list
          this.tabDelFile[iList]="D";
      } else {
        
        if (data.fileType==="perfCircuit"){
          
          const onePerf= new classFileSport;
          this.allFilesPerf.push(onePerf);
          this.allFilesPerf[this.allFilesPerf.length-1]=data;
          this.allFilesPerf[this.allFilesPerf.length-1].codeName=object;
          
        
        } else if (data.fileType==="perfTotalCircuit"){
          const oneTotal= new classTotalLoop;
          this.allFilesTotal.push(oneTotal);
          this.allFilesTotal[this.allFilesTotal.length-1]=data;
          this.allFilesTotal[this.allFilesTotal.length-1].codeName=object;

        }
        
      }
      if (this.nbFilesRead===this.myListOfObjects.items.length){ // all files have been read; delete those selected as such
        this.deleteFileItems();
        this.displayListOfObjects=true;
        // rebuil listItems according to sorting of main data files
        this.myListOfObjects.items.splice(0,this.myListOfObjects.items.length);
        for (var i=0; i<this.allFilesPerf.length; i++){
          const theObject= new OneBucketInfo;
          this.myListOfObjects.items.push(theObject);
          this.myListOfObjects.items[i].name=this.allFilesPerf[i].codeName;
          this.userSelection.push({sel:"", type:"",object:""});
          this.userSelection[this.userSelection.length-1].sel='N';
          this.userSelection[this.userSelection.length-1].type='perf';
          this.userSelection[this.userSelection.length-1].object=object;

        }
        for (var i=0; i<this.allFilesTotal.length; i++){
          const theObject= new OneBucketInfo;
          this.myListOfObjects.items.push(theObject);
          this.myListOfObjects.items[this.myListOfObjects.items.length-1].name=this.allFilesTotal[i].codeName;
          this.userSelection.push({sel:"", type:"",object:""});
          this.userSelection[this.userSelection.length-1].sel='N';
          this.userSelection[this.userSelection.length-1].type='total';
          this.userSelection[this.userSelection.length-1].object=object;
        }
        this.scroller.scrollToAnchor('SelectedObjectsFile');
      }

    },
    error_handler => {
      // even though it is a filure consider the file as 'read' and to be deleted
      this.nbFilesRead++
      this.tabDelFile[iList]="D";
      if (this.nbFilesRead===this.myListOfObjects.items.length-1){ // all files have been read; delete those selected as such
          this.deleteFileItems();
          this.displayListOfObjects=true;
          this.scroller.scrollToAnchor('SelectedObjectsFile');
      }
      this.message='failure to access '+object;
      
      console.log(this.message);
      } 
    )
}

syncScrollBar(event:any){
  if (event.srcElement.scrollLeft!==undefined){

    var elem1=document.getElementById("scroll-1");
    var elem2=document.getElementById("scroll-2");
    var elem3=document.getElementById("scroll-3");
    if (elem1!==null){
      elem1.scrollLeft=event.srcElement.scrollLeft;
    }
    if (elem3!==null){
      elem3.scrollLeft=event.srcElement.scrollLeft;
    }
    if (elem2!==null){
      elem2.scrollLeft=event.srcElement.scrollLeft;
    }
  }
}

}
