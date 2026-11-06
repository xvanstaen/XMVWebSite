import { Component, Input, Output,signal, EventEmitter} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormGroup,FormControl} from '@angular/forms';

// configServer is needed to use ManageGoogleService
// it is stored in MongoDB and accessed via ManageMongoDBService
import { configServer, LoginIdentif} from '../JsonServerClass';

import { ManageGoogleService } from '../CloudServices/ManageGoogle.service';
import { classDicoRecord } from '../JsonServerClass';

import { timeout } from 'rxjs';
const GET_TIMEOUT_MS = 100_000;
const MAX_RECALL_FS = 4;

interface MyDictionary {
  [key: string]: number; // or replace 'any' with your specific array/value type
}

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

EventHTTPReceived:Array<boolean>=[];

tabFreEng:Array<any>=[]; // used for display 
tabWorkFreEng:Array<any>=[]; // includes all updates
tabInitFreEng:Array<any>=[]; // data from file 
msg=signal<string>("");
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

onInputOLD(event:any){
  this.msg.set("");
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

onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target) return;

  this.msg.set("");

  const [lang, record] = target.id.split('-');
  if (!record || (lang !== 'French' && lang !== 'English')) return;
  
  // Dynamically update the correct language property
  this.tabWorkFreEng[record as any][lang] = target.value;
  this.tabFreEng[record as any][lang] = target.value;

  this.isModified = true;
}


onAction(event:any){
  this.msg.set("");
  this.isAction.set(true);
  this.isModified=false;
  this.iRecord=Number(event.target.id);
}

afterDropDown(event:any){
  this.isAction.set(false);
  const theAction=this.tabAction[event.target.value];
  switch (theAction){
    case("cancel"): return;
    case ("add"):
      const record = new classDicoRecord;
      this.tabWorkFreEng.length=0;
      if (this.language==="Fr"){
          this.tabWorkFreEng[this.iRecord].French=this.textToSearch;
      } else if (this.language==="En"){
          this.tabWorkFreEng[this.iRecord].English=this.textToSearch;
      }
      this.tabWorkFreEng[this.iRecord].inputHeight=this.inputMinHeight;
      this.tabFreEng.length=0;
      this.copyFiles(this.tabWorkFreEng, this.tabFreEng,this.textToSearch, this.language);
      this.isModified=true;
      break;
    case ("delete"):
      const i=this.tabDelete.length;
      this.tabDelete[i]=this.tabFreEng[this.iRecord].posInitFile;
      this.tabWorkFreEng[this.tabFreEng[this.iRecord].posInitFile].active=false;
      this.tabFreEng.splice(this.iRecord,1);
      this.iRecord=-1;
      this.isModified=true;
      break;
    case("zoom out"):
      this.tabFreEng[this.iRecord].inputHeight = this.tabFreEng[this.iRecord].inputHeight * 1.3;
      this.tabWorkFreEng[this.iRecord].inputHeight = this.tabFreEng[this.iRecord].inputHeight;
      this.isModified=true;
      break;
    case("zoom in"):
      this.tabFreEng[this.iRecord].inputHeight = this.tabFreEng[this.iRecord].inputHeight * 0.7;
      this.tabWorkFreEng[this.iRecord].inputHeight = this.tabFreEng[this.iRecord].inputHeight;
      if (this.tabFreEng[this.iRecord].inputHeight<this.inputMinHeight){
        this.tabFreEng[this.iRecord].inputHeight=this.inputMinHeight;
        }
      this.isModified=true;
      break;
    case("sort French"):
      this.language="Fr";
      this.actionSort();
      break;
    case("sort English"): 
      this.language="En";
      this.actionSort();
      break;
  }

}

actionSort(){
  this.sortFile();
  this.tabFreEng.length=0;
  this.copyFiles(this.tabWorkFreEng,this.tabFreEng,this.textToSearch,this.language);

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
  this.msg.set("");
  const lan = event.target.value.toUpperCase().trim();
  if (lan!=="FR" && lan!=="EN"){
    this.msg.set("Enter 'Fr' or 'En'");
    return;
  }
  this.language = lan === "FR" ? "Fr" : lan === "EN" ? "En" : this.language;
  this.sortFile();
  if (this.textToSearch!==""){
      this.updateTable();
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
    for (var i=this.tabDelete.length-1; i>-1; i--){
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
  this.msg.set("");
  var file=new File ([JSON.stringify(record)],GoogleObject, {type: 'application/json'});
  this.ManageGoogleService.uploadObject(this.configServer, GoogleBucket, file , GoogleObject)
    .subscribe(res => {
            if (res.type===4){
              this.msg.set('File "'+ GoogleObject +'" is successfully stored in the cloud');
              this.tabInitFreEng.splice(0, this.tabInitFreEng.length);
              this.tabFreEng.splice(0, this.tabFreEng.length);
              this.sortFile();
              this.copyFiles(this.tabWorkFreEng, this.tabInitFreEng,"","");
              this.copyFiles(this.tabInitFreEng,this.tabFreEng,"","");
              this.isConfirmedSave=false;
              this.isModified=false;
              this.returnDicoFile.emit(this.tabWorkFreEng);
            }
          },
          error_handler => {
            //**this.LogMsgConsole('Individual Record is not updated: '+ this.Table_User_Data[this.identification.id].UserId );
            this.msg.set("File' + GoogleObject +' *** Save action failed - status is " + error_handler.status);
          } 
        )
    }

getRecord(Bucket:string,GoogleObject:string, iWait:number){
  this.msg.set("");
  this.ManageGoogleService.getContentObject(this.configServer, Bucket, GoogleObject )
      .pipe(timeout(GET_TIMEOUT_MS))
      .subscribe((data ) => {
            if (iWait===0){
                this.receivedFile(data);
                this.returnDicoFile.emit(this.tabWorkFreEng);
              }
            },
            (error_handler) => {   
              this.msg.set("Could not retrieve the file - relaunch the application") ;
            } )
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

copyFiles(inFile: classDicoRecord[], outFile: classDicoRecord[], searchText: string, lang: string): void {
  const field = lang === 'Fr' ? 'French' : lang === 'En' ? 'English' : null;
  const needle = searchText.toUpperCase();      // computed once, not on every row
  const matchAll = searchText === '';
  const includeInactive = this.fileInitial === true;
  const minHeight = this.inputMinHeight;

  for (let i = 0; i < inFile.length; i++) {
    const src = inFile[i];

    if (!includeInactive && src.active !== true) continue;
    if (!matchAll && (field === null || !src[field].toUpperCase().startsWith(needle))) continue;

    const record = new classDicoRecord();
    record.French = src.French;
    record.English = src.English;
    record.inputHeight = src.inputHeight;
    record.posInitFileNumber = i;
    record.margTopCircleNumber = 4 + (src.inputHeight - minHeight) / 2;
    outFile.push(record);
  }
}

}
