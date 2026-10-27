import { Component, OnInit , Input, Output, HostListener,  HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,signal, EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';

import { CommonModule,  DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormGroup,UntypedFormControl, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';


// configServer is needed to use ManageGoogleService
// it is stored in MongoDB and accessed via ManageMongoDBService
import { configServer, LoginIdentif} from '../JsonServerClass';

import { ManageGoogleService } from '../CloudServices/ManageGoogle.service';
import { classDicoRecord } from '../JsonServerClass';

@Component({
  selector: 'app-dictionary',
  templateUrl: './dictionary.component.html',
  styleUrls: ['./dictionary.component.css'],
  standalone:true,
  imports:[CommonModule, FormsModule, ReactiveFormsModule,],

})
export class DictionaryComponent {

    constructor(
      private ManageGoogleService: ManageGoogleService,) { }


@Input() configServer = new configServer;
@Input() identification = new LoginIdentif;
@Input() inputFile:Array<classDicoRecord>= [];

@Output() returnDicoFile = new EventEmitter<any>();

isDicoReceived=signal<boolean>(false);
isAction=signal<boolean>(false);
isMsg=signal<boolean>(false);

EventHTTPReceived:Array<boolean>=[];
id_Animation:Array<number>=[];
TabLoop:Array<number>=[];
NbWaitHTTP:number=0;

tabFreEng:Array<any>=[]; // used for display 
tabWorkFreEng:Array<any>=[]; // includes all updates
tabInitFreEng:Array<any>=[]; // data from file 
msg:string="";
isModified:boolean=false;

tabAction:Array<string>=['cancel','add', 'delete','zoom in', 'zoom out','sort French','sort English'];
tabSearch:Array<any>=[];
heightTabAction:number=0;
heightItem:number=25;
inputHeight:number=22;
inputMinHeight:number=22;
tabFreEngHeight:number=0
tabMaxHeight=320;

iRecord:number=-1;
tabDelete:Array<number>=[]
textToSearch:string="";
language:string="Fr";
fileInitial:boolean=true;

SpecificForm=new FormGroup({
  FileName: new FormControl('', { nonNullable: true }),
})

ngOnInit(){

  // file does not exist
  if (this.inputFile.length!==0){
    this.receivedFile(this.inputFile);
  } else {
    this.getRecord(this.identification.dictionary.bucket,this.identification.dictionary.fileName,0);
  }
  this.heightTabAction=this.heightItem * this.tabAction.length ;
}

onInput(event:any){
  this.msg="";
  this.isMsg.set(false);
  const i=event.target.id.indexOf('-');
  const record=event.target.id.substring(i+1);
  if (event.target.id.substring(0,i)==='French'){
    this.tabWorkFreEng[record].French=event.target.value;
    this.tabFreEng[record].French=event.target.value;
  } else if (event.target.id.substring(0,i)==='English'){
    this.tabWorkFreEng[record].English=event.target.value;
    this.tabFreEng[record].English=event.target.value;
  }
  this.isModified=true;
}

onAction(event:any){
  this.msg="";
  this.isMsg.set(false);
  this.isAction.set(true);
  this.isModified=false;
  this.iRecord=Number(event.target.id);
}

afterDropDown(event:any){
  this.isAction.set(false);
  if (this.tabAction[event.target.value]==="cancel"){ 

  }  else if (this.tabAction[event.target.value]==="add"){ 
    const record = new classDicoRecord;
    this.tabWorkFreEng.splice(this.iRecord,0,record);
    if (this.language==="Fr"){
        this.tabWorkFreEng[this.iRecord].French=this.textToSearch;
    } else if (this.language==="En"){
        this.tabWorkFreEng[this.iRecord].English=this.textToSearch;
    }
    
    this.tabWorkFreEng[this.iRecord].inputHeight=this.inputMinHeight;
    this.tabFreEng.splice(0,this.tabFreEng.length);
    this.copyFiles(this.tabWorkFreEng, this.tabFreEng,this.textToSearch, this.language);
    this.isModified=true;
  } else if (this.tabAction[event.target.value]==="delete"){ 
    //
    const i=this.tabDelete.length;
    this.tabDelete[i]=this.tabFreEng[this.iRecord].posInitFile;
    this.tabWorkFreEng[this.tabFreEng[this.iRecord].posInitFile].active=false;
    this.tabFreEng.splice(this.iRecord,1);
    this.iRecord=-1;
    this.isModified=true;

  } else if (this.tabAction[event.target.value]==="zoom out"){ 
    /*
      this.inputHeight = this.inputHeight * 1.2;
      */
      this.tabFreEng[this.iRecord].inputHeight = this.tabFreEng[this.iRecord].inputHeight * 1.3;
      this.tabWorkFreEng[this.iRecord].inputHeight = this.tabFreEng[this.iRecord].inputHeight;
      this.isModified=true;
  } else if (this.tabAction[event.target.value]==="zoom in"){ 
    /*
      this.inputHeight = this.inputHeight * 0.8;
      if (this.inputHeight<this.inputMinHeight){
        this.inputHeight=this.inputMinHeight;
      */
        this.tabFreEng[this.iRecord].inputHeight = this.tabFreEng[this.iRecord].inputHeight * 0.7;
        this.tabWorkFreEng[this.iRecord].inputHeight = this.tabFreEng[this.iRecord].inputHeight;
        if (this.tabFreEng[this.iRecord].inputHeight<this.inputMinHeight){
          this.tabFreEng[this.iRecord].inputHeight=this.inputMinHeight;
      
      }
      this.isModified=true;
  } else if (this.tabAction[event.target.value]==="sort French"){ 
    this.language="Fr";
    this.sortFile();
    this.tabFreEng.splice(0,this.tabFreEng.length);
    this.copyFiles(this.tabWorkFreEng,this.tabFreEng,this.textToSearch,this.language);

  } else if (this.tabAction[event.target.value]==="sort English"){ 
    this.language="En";
    this.sortFile();
    this.tabFreEng.splice(0,this.tabFreEng.length);
    this.copyFiles(this.tabWorkFreEng,this.tabFreEng,this.textToSearch,this.language);
  }
}

searchText(event:any){
  this.textToSearch=event.target.value;
  this.updateTable();
}

sortFile(){
  if (this.language==="Fr"){
    this.tabWorkFreEng.sort((a, b) => a.French.localeCompare(b.French, undefined, { sensitivity: 'base' }));
  } else if (this.language==="En"){
    this.tabWorkFreEng.sort((a, b) => a.English.localeCompare(b.English, undefined, { sensitivity: 'base' }));
  }
}

updateTable(){
  this. tabFreEng.splice(0, this.tabFreEng.length);
  this.sortFile();
  this.copyFiles(this.tabWorkFreEng,this.tabFreEng,this.textToSearch,this.language);
  this.tabFreEngHeight=this.tabFreEng.length * this.inputHeight;
  if (this.tabFreEngHeight>this.tabMaxHeight){
    this.tabFreEngHeight=this.tabMaxHeight;
  }
}

selLanguage(event:any){
  this.isMsg.set(false);
  this.msg="";
  if (event.target.value.toUpperCase().trim()==="FR"){
      this.language="Fr";
      this.sortFile();
      if (this.textToSearch!==""){
        this.updateTable();
      }
  } else if (event.target.value.toUpperCase().trim()==="EN"){
      this.language="En";
      this.sortFile();
      if (this.textToSearch!==""){
        this.updateTable();
      }
  } else {
    this.msg="Enter 'Fr' or 'En'";
    this.isMsg.set(true);
  }
}

cancelSearch(){
  this.textToSearch="";
  this.tabFreEng.splice(0, this.tabFreEng.length);
  this.language="Fr";
  this.sortFile();
  this.copyFiles(this.tabWorkFreEng,this.tabFreEng,this.textToSearch,"Fr");
  this.tabFreEngHeight=this.tabFreEng.length * this.inputHeight;
  if (this.tabFreEngHeight>this.tabMaxHeight){
    this.tabFreEngHeight=this.tabMaxHeight;
  }
}

isConfirmedSave:boolean=false;
onSave(){
    this.isConfirmedSave=true;  
    this.SpecificForm.controls['FileName'].setValue(this.identification.dictionary.fileName);
}

CancelSave(){
  this.isConfirmedSave=false;
}
SaveRecord(){
    for (var i=0; i<this.tabDelete.length; i++){
      this.tabWorkFreEng.splice(this.tabDelete[0],1);
    }
    this.tabDelete=[];
    this.putRecord(this.identification.dictionary.bucket, this.SpecificForm.controls['FileName'].value, this.tabWorkFreEng);
}

onCancel(){
  this.isAction.set(false);
  this.isModified=false;
  this.tabDelete=[];
  this.tabFreEng.splice(0,this.tabFreEng.length);
  this.tabWorkFreEng.splice(0,this.tabWorkFreEng.length);
  this.copyFiles(this.tabInitFreEng,this.tabWorkFreEng,"","");
  this.sortFile();
  this.copyFiles(this.tabInitFreEng,this.tabFreEng,"","");
  this.textToSearch="";
  this.tabFreEngHeight=this.tabFreEng.length * this.inputHeight;
  if (this.tabFreEngHeight>this.tabMaxHeight){
    this.tabFreEngHeight=this.tabMaxHeight;
  }
}

putRecord(GoogleBucket:string, GoogleObject:string, record:any){
  this.isMsg.set(false);
  var file=new File ([JSON.stringify(record)],GoogleObject, {type: 'application/json'});
  this.ManageGoogleService.uploadObject(this.configServer, GoogleBucket, file , GoogleObject)
    .subscribe(res => {
            if (res.type===4){
              this.msg='File "'+ GoogleObject +'" is successfully stored in the cloud';
              this.tabInitFreEng.splice(0, this.tabInitFreEng.length);
              this.tabFreEng.splice(0, this.tabFreEng.length);
              this.sortFile();
              this.copyFiles(this.tabWorkFreEng, this.tabInitFreEng,"","");
              this.copyFiles(this.tabInitFreEng,this.tabFreEng,"","");
              this.isConfirmedSave=false;
              this.isMsg.set(true);
              this.isModified=false;
              this.returnDicoFile.emit(this.tabWorkFreEng);
            }
          },
          error_handler => {
            //**this.LogMsgConsole('Individual Record is not updated: '+ this.Table_User_Data[this.identification.id].UserId );
            this.msg='File' + GoogleObject +' *** Save action failed - status is '+error_handler.status;
            this.isMsg.set(true);
          } 
        )
    }

getRecord(Bucket:string,GoogleObject:string, iWait:number){
  
  this.EventHTTPReceived[iWait]=false;
  this.NbWaitHTTP++;
  this.waitHTTP(this.TabLoop[iWait],30000,iWait);
  this.msg="";
  this.isMsg.set(false);
  this.ManageGoogleService.getContentObject(this.configServer, Bucket, GoogleObject )
        .subscribe((data ) => {
              this.EventHTTPReceived[iWait]=true;
                if (iWait===0){
                  this.receivedFile(data);
                  this.returnDicoFile.emit(this.tabWorkFreEng);
                }
            },
            (error_handler) => {   
              this.msg='Could not retrieve the file - relaunch the application' ;
              this.isMsg.set(true);
            }

            
            )
  }

receivedFile(data:any){
  this.copyFiles(data,this.tabWorkFreEng,"","");
  this.language="Fr";
  this.sortFile();
  this.copyFiles(this.tabWorkFreEng,this.tabFreEng,"","");
  this.copyFiles(this.tabWorkFreEng,this.tabInitFreEng,"","");

  this.fileInitial=false;
  this.tabFreEngHeight=this.tabFreEng.length * this.inputHeight;
  if (this.tabFreEngHeight>this.tabMaxHeight){
    this.tabFreEngHeight=this.tabMaxHeight;
  }
  this.isDicoReceived.set(true);
}

copyFiles(inFile:any,outFile:any, searchText:string, lang:string){
  var j=-1;
  for (var i=0; i<inFile.length;i++){
      if ((searchText==="" || (lang==="Fr" && inFile[i].French.substring(0,searchText.length).toUpperCase()===searchText.toUpperCase()) ||
            (lang==="En" && inFile[i].English.substring(0,searchText.length).toUpperCase()===searchText.toUpperCase()))
            && (inFile[i].active===true || this.fileInitial===true)){
        const record = new classDicoRecord;
        outFile.push(record);
        //outFile.push({French:inFile[i].French,English:inFile[i].English,inputHeight:inFile[i].inputHeight,margTopCircle:0,posInitFile:i,active:true});
        j++
        outFile[j].French=inFile[i].French;
        outFile[j].English=inFile[i].English;
        outFile[j].inputHeight=inFile[i].inputHeight;
        outFile[j].posInitFile=i;
        outFile[j].margTopCircleNumber=  4 + (inFile[i].inputHeight - this.inputMinHeight) / 2;
    }         
  }
}

waitHTTP(loop:number, max_loop:number, eventNb:number){
    const pas=500;
    if (loop%pas === 0){
      console.log('waitHTTP ==> loop=' + loop + ' max_loop=' + max_loop);
    }
   loop++
    
    this.id_Animation[eventNb]=window.requestAnimationFrame(() => this.waitHTTP(loop, max_loop, eventNb));
    if (loop>max_loop || this.EventHTTPReceived[eventNb]===true ){
              console.log('exit waitHTTP ==> loop=' + loop + ' max_loop=' + max_loop + ' this.EventHTTPReceived=' + 
                      this.EventHTTPReceived[eventNb] );
              if (this.EventHTTPReceived[eventNb]===true ){
                      window.cancelAnimationFrame(this.id_Animation[eventNb]);
              }    
              //if (this.EventHTTPReceived[1]===true && this.EventHTTPReceived[2]===true && this.EventHTTPReceived[3]===true){
              //  this.calculateNutrition('all');
              //}
        }  
    }
  

}
