import { Component,  signal, Input, Output, EventEmitter} from '@angular/core';
  
import { CommonModule, ViewportScroller } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
  
import { configServer, LoginIdentif,  OneBucketInfo,  } from '../../JsonServerClass';
import {classFileSport, classPointOfRef, classCircuitRec, classFilePerf, 
    classHeaderFileSport, classTabPoR, classCountryPoR, PerfLeg } from "../classSport"

import { fillHeaderFile, updateTabPor, buildPerfCircuitRef  } from '../commonSportFunctions';

import { ManageGoogleService } from '../../CloudServices/ManageGoogle.service';
import { ListBucketContentComponent }  from '../../Special-Services/ListBucketContent.component';
import { ManagePointOfRefComponent } from '../../Sport/manage-point-of-ref/manage-point-of-ref.component';
import { DisplayCircuitLoopComponent } from '../display-circuit-loop/display-circuit-loop.component';
/** Copies only the listed properties. */
const pick = <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> =>
  Object.fromEntries(keys.map(k => [k, obj[k]])) as Pick<T, K>;
const GET_TIMEOUT_MS = 100_000;
const MAX_RECALL_FS = 4;
 
@Component({
  selector: 'app-sport-perf-raw-data-mgt',
  templateUrl: './sport-perf-raw-data-mgt.component.html',
  styleUrls: ['./sport-perf-raw-data-mgt.component.css'],
  standalone:true,
  imports:[CommonModule, FormsModule, ReactiveFormsModule, ManagePointOfRefComponent, 
    ListBucketContentComponent, DisplayCircuitLoopComponent, 
  ],

})
export class SportPerfRawDataMgtComponent {

  constructor(
    private scroller: ViewportScroller,
    private ManageGoogleService: ManageGoogleService,
    ) { }
  /** Set to true to enable verbose tracing. */
  private debug = false;

  @Input() configServer = new configServer;
  @Input() identification= new LoginIdentif;

  @Output() savePerf= new EventEmitter<any>();

  perfCircuitRef: Array<PerfLeg> = [];

  displayTabOne:number=1;
  specificCircuit= new classCircuitRec;
  saveSpecificCircuit= new classCircuitRec;
  headerPerf=new classHeaderFileSport;

  filePerf:Array<classFilePerf>=[];
  initFilePerf = new classFileSport; // used in cae of cancel updates
  isPerfRetrieved:boolean=true;

  NbRefresh_Bucket:number=0;

  errorMsg=signal<string>("");
  isBuildFromPerf=signal<boolean>(false);
  isDisplayPerf=signal<boolean>(false);
  isPerfFileModified=signal<boolean>(false);
  isFilePerfReceived=signal<boolean>(false);
  isFilesToSave=signal<boolean>(false);
  isCircuitSelected=signal<boolean>(true); // want to retrieve the different circuits
  isPoRFileReturned=signal<boolean>(false);
  saveMsg=signal<string>("");

  TabOfId:Array<any>=[];
  strFound:string="";
   
  maxWidthTable:number=0;
  widthTable:number=0;

  tabPerfPoR:Array<classTabPoR>=[];
  selItem:number=-1;
  selectedRecord=new classFilePerf;
  perfNb:number=0;
  newPoR:string="";
  tabInputPoR:Array<classPointOfRef>=[];
  listOfPoR:Array<classPointOfRef>=[];
  newPoRmsg:string="";


  resetTab(){
      
  }
  selBucket=new OneBucketInfo;

  // .emit from app-ListBucketContent
  BucketInfo(event:any){
    this.log("Bucket info=" + event.name);
    this.selBucket=event;
    this.isFilePerfReceived.set(false);
  }

  ReceivedData(event:any){
    //this.log("Received Data=" + event);
    this.errorMsg.set("");
    this.resetVar();
    this.resetTab();
    this.isPerfFileModified.set(false);
    this.filePerf.length=0;
    this.initFilePerf = new classFileSport;
    if (event.fileType!==undefined && event.fileType==="perfRawData" && event.content!==undefined){
      if (event.content.length===0) {
        this.errorMsg.set("Performance file '" + event.name + "'is empty");
        return;
      }
      this.filePerf=this.copyInOutFile(event.content);
      this.initFilePerf=event;

      this.headerPerf=fillHeaderFile(event,this.headerPerf);
     
      this.log("file perf " + this.headerPerf.name + " has " + this.filePerf.length + " record(s)");
      this.isFilePerfReceived.set(true);
      this.tabPerfPoR= updateTabPor(this.filePerf);
      if (this.tabPerfPoR.length===0){
        this.log("no PoR records found for file " + this.headerPerf.name);
        this.errorMsg.set("no PoR records found for file " + this.headerPerf.name);
        return;
      }
      if (this.isPoRFileReturned()){
        this.listPoR();
      }
    } else {
        this.errorMsg.set(this.selBucket.name + " is not a formatted performance sport file");
    }
    this.scroller.scrollToAnchor('bottomPage');
  }

  buildFormPerf(){
    this.errorMsg.set("");
    this.perfCircuitRef = [];
    this.isBuildFromPerf.set(false);
    const initPerfPoR = updateTabPor(this.filePerf);
    if (initPerfPoR.length === 0) {
      this.errorMsg.set("No Point Of References found in the perf file " + this.headerPerf.name);
      return;
    }
    this.perfCircuitRef = buildPerfCircuitRef(this.specificCircuit.points as Array<classPointOfRef>, initPerfPoR, this.filePerf);
    const nbLoop=this.perfCircuitRef[0].newLoop.length - 1;
    for (var i=nbLoop; i>-1; i--){
      var trouve=false;
      for (var j=0; j<this.perfCircuitRef.length && !trouve; j++){
        if (this.perfCircuitRef[j].newLoop[i].speed!==0){ trouve=true; }
      }
      if (!trouve){
        for (var j=0; j<this.perfCircuitRef.length; j++){
        this.perfCircuitRef[j].newLoop.splice(i,1);
        }
      }
    }
    this.isBuildFromPerf.set(true);
  }

  // called by .emit from component app-manage-point-of-ref
  manageFile(event: classCountryPoR[]) {
  const items = event.flatMap(c => c.PoR);
  items.sort((a, b) => a.ref < b.ref ? -1 : a.ref > b.ref ? 1 : 0);

  // keep the same array reference (it may be bound in the template)
  this.listOfPoR.splice(0, this.listOfPoR.length, ...items);

  this.isPoRFileReturned.set(true);
  if (this.isFilePerfReceived()) {
    this.listPoR();
  }
}
  manageFileOLD(event:any){
    this.listOfPoR.splice(0,this.listOfPoR.length);
    for (var i=0; i<event.length && event.length>0; i++){
      for (var j=0; j<event[i].PoR.length && event[i].PoR.length>0; j++){
          const theClass=new classPointOfRef;
          this.listOfPoR.push(theClass);
          this.listOfPoR[this.listOfPoR.length-1]=event[i].PoR[j];
      }
    }
    this.listOfPoR.sort((a, b) => (a.ref < b.ref) ? -1 : 1);
    this.isPoRFileReturned.set(true);
    if (this.isFilePerfReceived()){
      this.listPoR();
    }
  }
  // called by .emit from component app-manage-point-of-ref
  onSelectPoR(event:any){
      this.log(event);
  }

  onResetFile(){
    this.filePerf.length=0;
    this.filePerf=this.copyInOutFile(this.initFilePerf.content);
    this.headerPerf=fillHeaderFile(this.initFilePerf, new classHeaderFileSport);
    this.isPerfFileModified.set(false);
  }

  onSavePerfPoRFile(event:any){
    this.log(event);
    this.fnSave(this.identification.performanceSport.bucket, event, event.codeName);
  }

  savePerfFromCircuit(event:any){
    // TO BE VALIDATED
    this.fnSave(this.identification.performanceSport.bucket, event, event.name);
  }

  onSavePerfFile(){
    // update the refPoints table
    this.listPoR();
    this.initFilePerf== new classFileSport;
    this.initFilePerf.content=this.copyInOutFile(this.filePerf);;
    this.initFilePerf=fillHeaderFile(this.headerPerf, this.initFilePerf); //TO BE VALIDATED
    this.isPerfFileModified.set(false);
    this.fnSave(this.identification.performanceSport.bucket, this.initFilePerf, this.initFilePerf.name);
  }
  
  fnSave(bucket:string, content:any, fileName:string){
    var file=new File ([JSON.stringify(content)], fileName, {type: 'application/json'});   
    const nameFile = fileName; 
    this.ManageGoogleService.uploadObject(this.configServer, bucket, file ,  fileName)
          .subscribe(
              res => {
                  if (res.type===4){ 
                    this.saveMsg.set(" file '" + nameFile + "' has been updated and stored in the cloud ");
                  }
              
            }, 
            err => {
              this.saveMsg.set(" upload pb - file '" + nameFile + "' has not been updated");
            })
  }

  listPoR(){
    // Index listOfPoR once (first occurrence wins, like the original search)
    const porByRef = new Map<string, classPointOfRef>();
    for (const por of this.listOfPoR) {
      if (!porByRef.has(por.ref)) porByRef.set(por.ref, por);
    }

    const points = this.specificCircuit.points;
    points.length = 0;                                   // clear in place

    const refs = new Set<string>(this.headerPerf.refPoints); // Set dedups automatically
    const seen = new Set<string>();

    for (const perf of this.filePerf) {
      const ref = perf.refPoR;
      if (ref === "") continue;

      refs.add(ref);
      if (seen.has(ref)) continue;                       // already added to circuit
      seen.add(ref);

      const por = porByRef.get(ref);
      if (por) points.push(por);
    }

    this.headerPerf.refPoints = [...refs].sort();           // default sort = same order as a < b on strings

  }


  copyInOutFile(inFile:any){
    const outF = inFile.map((item: classFilePerf) => Object.assign(new classFilePerf(), item));
    return(outF);

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
          this.isPerfFileModified.set(true);
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

  resetVar(){
    this.saveMsg.set("");
    this.isFilesToSave.set(false);
    this.errorMsg.set("");
    this.selItem=-1;
    this.newPoRmsg="";
  }
    
  onSelectPerf(event:any){

  }

  onDisplayPerf(event:string){
    if (event==="Yes"){
        this.isDisplayPerf.set(true);
    } else {
      this.isDisplayPerf.set(false);
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
    } 
    this.newPoR=this.filePerf[this.perfNb].refPoR;
    this.log('row selection = ' + this.selItem);
  }

  syncScrollBar(event:any){
    if (event.srcElement.scrollLeft!==undefined){
      var elem1=document.getElementById("scroll-1");
      if (elem1!==null){
        elem1.scrollLeft=event.srcElement.scrollLeft;
      }
    }
  }
  private log(...args: unknown[]) {
    if (this.debug) console.log('[sport-perf-raw-data]', ...args);
  }


}
