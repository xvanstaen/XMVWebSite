import { Component, signal , Input, Output
  ,EventEmitter, ChangeDetectorRef} from '@angular/core';
import { CommonModule,  ViewportScroller } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormGroup, FormControl} from '@angular/forms';

import { configServer, LoginIdentif } from '../../JsonServerClass';
import { classPointOfRef, classCircuitRec, classCountryPoR,} from '../classSport';
import { findIds } from '../../MyStdFunctions';

import { ManageGoogleService } from '../../CloudServices/ManageGoogle.service';

import { timeout } from 'rxjs';
const GET_TIMEOUT_MS = 100_000;
const MAX_RECALL_FS = 4;

@Component({
  selector: 'app-manage-point-of-ref',
  templateUrl: './manage-point-of-ref.component.html',
  styleUrls: ['./manage-point-of-ref.component.css'],
  standalone:true,
  imports:[CommonModule, FormsModule, ReactiveFormsModule, ],
})
export class ManagePointOfRefComponent {


  constructor(
    private scroller: ViewportScroller,
    private ManageGoogleService: ManageGoogleService,
    private cdr: ChangeDetectorRef
    ) { }

    @Output() returnFile= new EventEmitter<any>();
    @Output() returnSelection= new EventEmitter<any>();
    @Output() returnSelCountry= new EventEmitter<any>();

    @Input() configServer = new configServer;
    @Input() identification= new LoginIdentif;
    @Input() isCircuitSelected:boolean=false;

    fileCountry:Array<any>=[];
    filePoR:Array<any>=[];
    iCountryPoR:number=-1;

    EventHTTPReceived:Array<boolean>=[];
    maxEventHTTPrequest:number=20;
    idAnimation:Array<number>=[];
    TabLoop:Array<number>=[];
    NbWaitHTTP:number=0;
  
    formOptions: FormGroup = new FormGroup({ 
      pointRef: new FormControl("", { nonNullable: true }),
      lat: new FormControl(0, { nonNullable: true }),
      lgt: new FormControl(0, { nonNullable: true }),
      fileName: new FormControl("", { nonNullable: true }),
      prio: new FormControl("", { nonNullable: true }),
      varLat: new FormControl(0, { nonNullable: true }),
      varLon: new FormControl(0, { nonNullable: true }),
    })

    istabPointOfRef=signal<boolean>(false);
    tabActionCountry=["Cancel","Add before","Add after","Delete","Zoom-in","Zoom-out"];
    tabAction=["Cancel","Add before","Add after","Modify","Delete"];
    tabDialog:Array<boolean>=[];  
    iDialog:number=-1;

    isDeleteRef=signal<boolean>(false);
    isUpdateRef=signal<boolean>(false);
    isAddRef=signal<boolean>(false);
    isFileModified=signal<boolean>(false);
    isDeleteCountry=signal<boolean>(false);
    errorMsg=signal<string>("");
    isPerfRetrieved=signal<boolean>(false);

    TabOfId:Array<any>=[];
    strFound:string="";

ngOnInit(){

  this.GetRecord(this.configServer.PointOfRef.bucket,this.configServer.PointOfRef.file,0);
  this.GetRecord(this.configServer.PointOfRef.bucket,"CountryISOPreferred.json",2);

}

resetBooleans(){
  this.tabDialog.length=0;
  this.iDialog=-1;
  this.errorMsg.set("");
  this.isDeleteRef.set(false);
  this.isUpdateRef.set(false);
  this.isAddRef.set(false);
  this.isDeleteCountry.set(false);
}

resetAllBooleans(){
  this.TabOfId.splice(0,this.TabOfId.length);
  this.isDeleteRef.set(false);
  this.isUpdateRef.set(false);
  this.isAddRef.set(false);
  this.errorMsg.set("");
  this.isDeleteCountry.set(false);
  this.tabDialog.splice(0,this.tabDialog.length);
  this.iDialog=-1;
  
 }

 saveAction:string="";
 saveRecord:number=0;

onSelectPoR(event:any){
  this.TabOfId.splice(0,this.TabOfId.length);
  const theValue= findIds(event.target.id,"-");
  for (var i=0; i<theValue.tabOfId.length; i++){
      this.TabOfId[i]=theValue.tabOfId[i];
  }
  if (theValue.strFound==="Selection"){

    this.returnSelection.emit(this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]]);

  }
}

selCountry:Array<any>=[];
onActionCountry(event:any){

  this.resetBooleans();
  
  this.TabOfId.splice(0,this.TabOfId.length);
  const theValue= findIds(event.target.id,"-");
  
  for (var i=0; i<theValue.tabOfId.length; i++){
    this.TabOfId[i]=theValue.tabOfId[i];
  }

  //this.iDialog = 0;
  //this.tabDialog[this.iDialog]=true;
  if (!this.isCircuitSelected){
    if (theValue.strFound==="Country"){
      this.selCountry.splice(0,this.selCountry.length);
      for (var i=0; i<this.fileCountry.length; i++){
          if (this.fileCountry[i].country.toLowerCase().indexOf(event.target.value.toLowerCase())!==-1){
            this.selCountry.push({country:"",code:""});
            this.selCountry[this.selCountry.length-1].country=this.fileCountry[i].country;
            this.selCountry[this.selCountry.length-1].code=this.fileCountry[i].code;
          }
      }
      if (this.selCountry.length===0){
        this.filePoR[this.TabOfId[0]].country=event.target.value;
        this.isFileModified.set(true);
      }

    } else if (theValue.strFound==="Code"){
      this.selCountry.splice(0,this.selCountry.length);
      for (var i=0; i<this.fileCountry.length; i++){
        if (this.fileCountry[i].code.toLowerCase().indexOf(event.target.value.toLowerCase())!==-1){
          this.selCountry.push({country:"",code:""});
          this.selCountry[this.selCountry.length-1].country=this.fileCountry[i].country;
          this.selCountry[this.selCountry.length-1].code=this.fileCountry[i].code;
        }
      }
      if (this.selCountry.length===0){
        this.filePoR[this.TabOfId[0]].code=event.target.value;
        this.isFileModified.set(true);;
      }
    }  else if (theValue.strFound==="selCountry"){

      this.filePoR[this.TabOfId[0]].country=this.selCountry[this.TabOfId[1]].country;
      this.filePoR[this.TabOfId[0]].code=this.selCountry[this.TabOfId[1]].code;
      this.isFileModified.set(true);
      this.selCountry.splice(0,this.selCountry.length);
    } else if (theValue.strFound==="actionCountry"){
      this.iDialog = 1;
      this.tabDialog[this.iDialog]=true;
      this.tabDialog[0]=false;
    } else if (theValue.strFound==="selAction"){
      if (this.tabActionCountry[this.TabOfId[1]]==='Add after'){
          const mainR = new  classCountryPoR;
          this.filePoR.splice(this.TabOfId[0]+1,0,mainR);
          const recPoR = new classPointOfRef;
          this.filePoR[this.TabOfId[0]+1].PoR.push(recPoR);
          this.isFileModified.set(true);
      } else if (this.tabActionCountry[this.TabOfId[1]]==='Add before'){
        const mainR = new  classCountryPoR;
          this.filePoR.splice(this.TabOfId[0],0,mainR);
          const recPoR = new classPointOfRef;
          this.filePoR[this.TabOfId[0]+1].PoR.push(recPoR);
          this.isFileModified.set(true);
      } else if (this.tabActionCountry[this.TabOfId[1]]==='Delete'){
        this.isDeleteCountry.set(true);
        this.iCountryPoR=this.TabOfId[0];

      } else if (this.tabActionCountry[this.TabOfId[1]]==='Zoom-in'){
        this.iCountryPoR=this.TabOfId[0];

      } else if (this.tabActionCountry[this.TabOfId[1]]==='Zoom-out'){
        this.iCountryPoR=-1;
      } 
    }
    else if (theValue.strFound==="delCountryYES"){
      this.filePoR.splice(this.TabOfId[0],1);
      this.iCountryPoR=-1;
      this.isDeleteCountry.set(false);
      this.isFileModified.set(true);
    } else if (theValue.strFound==="delCountryNO"){
      this.iCountryPoR=-1;
      this.isDeleteCountry.set(false);
      
    } 
  } else if (theValue.strFound==="selectedCountry"){
    this.iCountryPoR=this.TabOfId[0];
  }
  this.scroller.scrollToAnchor('bottomPage');
  this.cdr.detectChanges();
}


onSelOrAction(event:any){
  this.resetBooleans();
  const theEvent={
    target:{
      id:""
    }
  }
  this.TabOfId.splice(0,this.TabOfId.length);
  const theValue= findIds(event.target.id,"-");
  for (var i=0; i<theValue.tabOfId.length; i++){
    this.TabOfId[i]=theValue.tabOfId[i];
  }

  if (!this.isCircuitSelected){
      theEvent.target.id="Action-"+this.TabOfId[0].toString();
      this.onActionPoR(theEvent);
  } else {
      theEvent.target.id="Selection-"+this.TabOfId[0].toString();
      this.onSelectPoR(theEvent);
  }
  this.cdr.detectChanges();
}


onActionPoR(event:any){

    this.resetBooleans();
    
    this.TabOfId.splice(0,this.TabOfId.length);
    const theValue= findIds(event.target.id,"-");
    
    for (var i=0; i<theValue.tabOfId.length; i++){
      this.TabOfId[i]=theValue.tabOfId[i];
    }
    if (theValue.strFound==="Action"){
      
      this.tabDialog[0]=true;
      this.tabDialog[1]=false;
      // display the list of action in a dropdown list
    } else if (theValue.strFound==="Selection"){


    } else if (theValue.strFound==="selAction"){
      if (this.tabAction[this.TabOfId[1]]==="Cancel"){ 
        this.tabDialog[0]=false;
      } else  if (this.tabAction[this.TabOfId[1]]==='Add before' || this.tabAction[this.TabOfId[1]]==='Add after'){ // Add before
            this.saveAction = this.tabAction[this.TabOfId[1]];   
            this.saveRecord=this.TabOfId[0]; 
            this.formOptions.controls["pointRef"].setValue("");
            this.formOptions.controls["lat"].setValue(0);
            this.formOptions.controls["lgt"].setValue(0);
            this.formOptions.controls["varLat"].setValue(0);
            this.formOptions.controls["varLon"].setValue(0);
            this.formOptions.controls["prio"].setValue("lat");
            this.isAddRef.set(true);
        } else {
            this.formOptions.controls["pointRef"].setValue(this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].ref);
            this.formOptions.controls["lat"].setValue(this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].lat);
            this.formOptions.controls["lgt"].setValue(this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].lon);
            this.formOptions.controls["varLat"].setValue(this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].varLat);
            this.formOptions.controls["varLon"].setValue(this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].varLon);
            this.formOptions.controls["prio"].setValue(this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].prio);
            if (this.tabAction[this.TabOfId[1]]==="Modify"){ 
              this.isUpdateRef.set(true);;
            } else if (this.tabAction[this.TabOfId[1]]==="Delete"){ 
              this.isDeleteRef.set(true);;
            } 

          }
    } else if (theValue.strFound==="confirmAdd"){
        this.checkFormData();
        if (this.errorMsg()){
            const theClass=new classPointOfRef;
            if (this.saveAction==="Add before"){
              this.filePoR[this.iCountryPoR].PoR.splice(this.saveRecord,0,theClass);
            } else {
              this.saveRecord++
              this.filePoR[this.iCountryPoR].PoR.splice(this.saveRecord,0,theClass);
            }
            
            this.filePoR[this.iCountryPoR].PoR[this.saveRecord].ref=this.formOptions.controls["pointRef"].value;
            this.filePoR[this.iCountryPoR].PoR[this.saveRecord].prio=this.formOptions.controls["prio"].value;
            this.filePoR[this.iCountryPoR].PoR[this.saveRecord].lat=Number(this.formOptions.controls["lat"].value);
            this.filePoR[this.iCountryPoR].PoR[this.saveRecord].lon=Number(this.formOptions.controls["lgt"].value);
            this.filePoR[this.iCountryPoR].PoR[this.saveRecord].varLat=Number(this.formOptions.controls["varLat"].value);
            this.filePoR[this.iCountryPoR].PoR[this.saveRecord].varLon=Number(this.formOptions.controls["varLon"].value);
            this.isFileModified.set(true);;
            this.isAddRef.set(false);;
            this.tabDialog[0]=false;
        }
    } else if (theValue.strFound==="confirmModify"){
        this.checkFormData();
        if (this.errorMsg()===""){
          this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].ref=this.formOptions.controls["pointRef"].value;
          this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].prio=this.formOptions.controls["prio"].value;
          this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].lat=Number(this.formOptions.controls["lat"].value);
          this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].lon=Number(this.formOptions.controls["lgt"].value);
          this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].varLat=Number(this.formOptions.controls["varLat"].value);
          this.filePoR[this.iCountryPoR].PoR[this.TabOfId[0]].varLon=Number(this.formOptions.controls["varLon"].value);
            this.isFileModified.set(true);
            this.isUpdateRef.set(true);
            this.tabDialog[0]=false;
        }
    } else if (theValue.strFound==="confirmDel"){
        this.filePoR[this.iCountryPoR].PoR.splice(this.TabOfId[0],1);
        this.isFileModified.set(true);
        this.isDeleteRef.set(true);
        this.tabDialog[0]=false;

    } else if (theValue.strFound==="cancelAction"){
      this.isAddRef.set(true);
      this.isDeleteRef.set(true);
      this.isUpdateRef.set(true);
      this.tabDialog[0]=false;
    } 
    console.log(event.target.id);
    this.scroller.scrollToAnchor('bottomPage');
    this.cdr.detectChanges();

}

saveConfirmed:boolean=false;


checkFormData(){
  this.errorMsg.set("");
  if (this.formOptions.controls["pointRef"].value==="" || this.formOptions.controls["lat"].value===""
      || this.formOptions.controls["lgt"].value ==="" || this.formOptions.controls["prio"].value ===""
      || this.formOptions.controls["varLat"].value ==="" || this.formOptions.controls["varLon"].value ===""
      ){
        this.errorMsg.set("All fields are mandatory");
  } else if (isNaN(this.formOptions.controls["lat"].value) 
  || isNaN(this.formOptions.controls["lgt"].value)){
    this.errorMsg.set("Latitude and Loongitude must be numeric values");
  }
}


manageUpdates(event:any){
  if (event.target.id==="confirmSave"){
      this.saveConfirmed=true;
      this.formOptions.controls["fileName"].setValue(this.configServer.PointOfRef.file);
  }  else if (event.target.id==="reinitialize"){
    this.GetRecord(this.configServer.PointOfRef.bucket,this.configServer.PointOfRef.file,0);
      this.saveConfirmed=false;
      this.isFileModified.set(true);
  } else if (event.target.id==="noReinit"){
    
  } else if (event.target.id==="saveFile"){
    
      this.saveFile(this.configServer.PointOfRef.bucket, this.formOptions.controls["fileName"].value, this.filePoR);
  } else if (event.target.id==="cancelSave"){
      this.saveConfirmed=false;
  }
  this.cdr.detectChanges();
}

saveFile(bucket:string, object:string,record:any){
  this.errorMsg.set("");
  // const fileName =this.formOptions.controls["fileName"].value;
  var file=new File ([JSON.stringify(record)],object, {type: 'application/json'});
 
  this.ManageGoogleService.uploadObject(this.configServer, bucket, file , object)
    .subscribe(
      res => {
        if (res.type===4){ 
          this.errorMsg.set("file " + object + " has been successfully saved");
          console.log(this.errorMsg);
          this.isFileModified.set(false);
          this.resetAllBooleans;
          if (this.isCircuitSelected){
            this.returnFile.emit(this.filePoR);
          }
          this.scroller.scrollToAnchor('bottomPage');
        }
      }, 
      err => {
        this.errorMsg.set('failure to get record ' + object + ' ;  error = '+ JSON.stringify(err));
        console.log(this.errorMsg);
        this.scroller.scrollToAnchor('bottomPage');
      })
}

getFileCircuit(){
  this.GetRecord(this.identification.circuits.bucket, this.identification.circuits.file,1);
}

fileCircuit:Array<classCircuitRec>=[];

saveFileCircuit(){
  this.saveFile(this.identification.circuits.bucket, this.identification.circuits.file, this.fileCircuit);
}

GetRecord(bucketName:string,objectName:string, iWait:number){
  this.errorMsg.set("");
  this.ManageGoogleService.getContentObject(this.configServer, bucketName, objectName )
    .pipe(timeout(GET_TIMEOUT_MS))
      .subscribe((data ) => {  
          if (iWait===0){ 
            this.filePoR.length=0;
            this.filePoR = data.map((c : classCountryPoR)=> {
                const rec = new classCountryPoR();
                rec.country = c.country;
                rec.code = c.code;

                rec.PoR = c.PoR.map(p => {
                  const por = new classPointOfRef();
                  por.ref    = p.ref;
                  por.lat    = p.lat;
                  por.lon    = p.lon;
                  por.alt    = p.alt    ?? 0;
                  por.prio   = p.prio   ?? 'lat';
                  por.varLat = p.varLat ?? 0.0002;
                  por.varLon = p.varLon ?? 0.00002;
                  return por;
                });

                return rec;
            });
                // this.filePoR[j].PoR[i] = data[j].PoR[i];
            if (this.isCircuitSelected){
              this.returnFile.emit(this.filePoR);
            }
            this.istabPointOfRef.set(true);
          } else if (iWait===1){ // Circuits
              this.fileCircuit=data;
          } else if (iWait===2){ // Preferred countries
            this.fileCountry=data;
        }
        this.scroller.scrollToAnchor('bottomPage');
      },
      error => {
        this.errorMsg.set('failure to get record ' + objectName +' ;  error = '+ JSON.stringify(error));
        console.log(this.errorMsg());
        this.scroller.scrollToAnchor('bottomPage');
      })
}

}
