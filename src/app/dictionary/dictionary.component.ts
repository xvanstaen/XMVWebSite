import { Component, OnInit , Input, Output, HostListener,  HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
  
import { DatePipe, formatDate, ViewportScroller } from '@angular/common'; 

import { HttpClient , HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';

import { FormGroup, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { Observable } from 'rxjs';


import { BucketList } from '../JsonServerClass';
import { Bucket_List_Info } from '../JsonServerClass';

// configServer is needed to use ManageGoogleService
// it is stored in MangoDB and accessed via ManageMangoDBService
import { configServer, XMVConfig, LoginIdentif} from '../JsonServerClass';
import { msgConsole } from '../JsonServerClass';
import {msginLogConsole} from '../consoleLog'
import { environment } from 'src/environments/environment';

import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import {AccessConfigService} from 'src/app/CloudServices/access-config.service';
@Component({
  selector: 'app-dictionary',
  templateUrl: './dictionary.component.html',
  styleUrls: ['./dictionary.component.css']
})
export class DictionaryComponent {


    constructor(
      private http: HttpClient,
      private fb: FormBuilder,
      private scroller: ViewportScroller,
      private ManageMangoDBService: ManageMangoDBService,
      private ManageGoogleService: ManageGoogleService,
      private datePipe: DatePipe,
      @Inject(LOCALE_ID) private locale: string,
      ) { }

@Input() XMVConfig=new XMVConfig;
@Input() configServer = new configServer;
@Input() identification= new LoginIdentif;


EventHTTPReceived:Array<boolean>=[];
Error_Access_Server:string='';
id_Animation:Array<number>=[];
TabLoop:Array<number>=[];
NbWaitHTTP:number=0;



tabFreEng:Array<any>=[];
tabAction:Array<string>=['cancel','add','clear', 'delete','zoom in', 'zoom out','sort French','sort English'];
tabSearch:Array<any>=[];
heightTabAction:number=0;
heightItem:number=25;
inputHeight:number=30;
inputMinHeight:number=30;
tabFreEngHeight:number=0
circleWidth:number=22;
circleHeight:number=22;
tabMaxHeight=320;
circleMarginLeft:number=5;

isAction:boolean=false;
isFileRetrieved:boolean=false;

iRecord:number=-1;
styleBoxAction:any;
styleBoxOptionAction:any;
dicForm=new FormGroup({
  French: new FormControl('', { nonNullable: true }),
  English: new FormControl('', { nonNullable: true }),
})

SpecificForm=new FormGroup({
  FileName: new FormControl('', { nonNullable: true }),
})

ngOnInit(){

// file does not exist
this.getRecord(this.identification.dictionary.bucket,this.identification.dictionary.fileName,0);


this.heightTabAction=this.heightItem * this.tabAction.length ;
this.styleBoxAction = {
  'width': 150 + 'px',
  'height': this.heightTabAction + 'px',
  'position': 'absolute',
  'margin-left':'15%', 
  'margin-top':'5px',
  'z-index': '1'
}
this.styleBoxOptionAction = {
  'background-color':'lightgrey',
  'width': 150 + 'px',
  'height':this.heightTabAction + 'px',
  'margin-top' :  - this.heightItem  + 'px',
  'margin-left': 0 + 'px',
  'overflow-x': 'hidden',
  'overflow-y': 'hidden',
  'border':'1px blue solid'
  }

}


onInput(event:any){
this.msg="";
const i=event.target.id.indexOf('-');
const record=event.target.id.substring(i+1);
if (event.target.id.substring(0,i)==='French'){
  this.tabFreEng[record].French=event.target.value;
} else if (event.target.id.substring(0,i)==='English'){
  this.tabFreEng[record].English=event.target.value;
}
this.dicForm.controls['French'].setValue(this.tabFreEng[record].French);
this.dicForm.controls['English'].setValue(this.tabFreEng[record].English);
}

onAction(event:any){
  this.msg="";
  this.isAction=true;
  this.isModif=false;
  this.iRecord=Number(event.target.id);
}
isModif:boolean=false;
afterDropDown(event:any){
  this.isAction=false;
  if (this.tabAction[event.target.value]==="cancel"){ 

  } else if (this.tabAction[event.target.value]==="clear"){ 
    this.tabFreEng[this.iRecord].French="";
    this.tabFreEng[this.iRecord].English="";
    this.tabFreEng[this.iRecord].inputHeight=this.inputMinHeight;
  }  else if (this.tabAction[event.target.value]==="add"){ 
    this.tabFreEng.splice(this.iRecord,0,{French:"",English:"",inputHeight:0,nbWordsFr:1,nbWordsEn:1});
    this.tabFreEng[this.iRecord].inputHeight=this.inputMinHeight;
    this.tabFreEngHeight=this.tabFreEng.length * this.inputHeight;
    if (this.tabFreEngHeight>this.tabMaxHeight){
      this.tabFreEngHeight=this.tabMaxHeight;
    }
  }else if (this.tabAction[event.target.value]==="delete"){ 
    this.tabFreEng.splice(this.iRecord,1);
    this.iRecord=-1;

  } else  if (this.tabAction[event.target.value]==="modify"){ 
    this.dicForm.controls['French'].setValue(this.tabFreEng[this.iRecord].French);
    this.dicForm.controls['English'].setValue(this.tabFreEng[this.iRecord].English);
    this.isModif=true;
  } else if (this.tabAction[event.target.value]==="zoom out"){ 
    /*
      this.inputHeight = this.inputHeight * 1.2;
      */
      this.tabFreEng[this.iRecord].inputHeight = this.tabFreEng[this.iRecord].inputHeight * 1.3;
   
  } else if (this.tabAction[event.target.value]==="zoom in"){ 
    /*
      this.inputHeight = this.inputHeight * 0.8;
      if (this.inputHeight<this.inputMinHeight){
        this.inputHeight=this.inputMinHeight;
      */
        this.tabFreEng[this.iRecord].inputHeight = this.tabFreEng[this.iRecord].inputHeight * 0.7;
        if (this.tabFreEng[this.iRecord].inputHeight<this.inputMinHeight){
          this.tabFreEng[this.iRecord].inputHeight=this.inputMinHeight;
      
      }
  } else if (this.tabAction[event.target.value]==="sort French"){ 
    this.tabFreEng.sort((a, b) => (a.French < b.French) ? -1 : 1);
  } else if (this.tabAction[event.target.value]==="sort English"){ 
    this.tabFreEng.sort((a, b) => (a.English < b.English) ? -1 : 1);
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
var i=0;
  // calculate nb of words
  var tabChar=[{pos:0}];
  for (var i=1; i<3; i++){
    tabChar.push({pos:0});

  }
  for (i=0; i<this.tabFreEng.length;i++){
   
    
    var j=this.tabFreEng[i].French.trim().indexOf(" ");
 
    var l=this.tabFreEng[i].French.trim().indexOf("-");
   
    var m=this.tabFreEng[i].French.trim().indexOf("'");
    tabChar[0].pos=j;
    tabChar[1].pos=l;
    tabChar[2].pos=m;
    tabChar.sort((a, b) => (a.pos < b.pos) ? -1 : 1);

    for (i=0; i<tabChar.length && tabChar[i].pos===-1;i++){};
    if (i<tabChar.length) {j=tabChar[i-1].pos}
    else {j=-1;}


    
    
    if (j!==-1){
      
      this.tabFreEng[i].nbWordsFr=2;
        for (var k=j+1; k<this.tabFreEng[i].French.trim().length; k++){
            if (this.tabFreEng[i].French.trim().substring(k,k+1)===" " || this.tabFreEng[i].French.trim().substring(k,k+1)==="-"
                    || this.tabFreEng[i].French.trim().substring(k,k+1)==="'"){
              this.tabFreEng[i].nbWordsFr++
            }
        }
    }
    var j=this.tabFreEng[i].English.trim().indexOf(" ");
    if (j!==-1){
      this.tabFreEng[i].nbWordsEn=2;
        for (var k=j+1; k<this.tabFreEng[i].English.trim().length; k++){
            if (this.tabFreEng[i].English.trim().substring(k,k+1)===" " || this.tabFreEng[i].English.trim().substring(k,k+1)==="-"
                    || this.tabFreEng[i].English.trim().substring(k,k+1)==="'"){
              this.tabFreEng[i].nbWordsEn++
            }
        }
    }
  }

  this.putRecord(this.identification.dictionary.bucket, this.SpecificForm.controls['FileName'].value, this.tabFreEng);
  // reinitialise init
  this.tabInitFreEng.splice(0,this.tabInitFreEng.length);
  for (var i=0; i<this.tabFreEng.length;i++){
    this.tabInitFreEng.push({French:"",English:"",inputHeight:0, nbWordsFr:1,nbWordsEn:1});
    this.tabInitFreEng[i].French=this.tabFreEng[i].French;
    this.tabInitFreEng[i].English=this.tabFreEng[i].English;
    this.tabInitFreEng[i].inputHeight=this.tabFreEng[i].inputHeight;
    this.tabInitFreEng[i].nbWordsFr=this.tabFreEng[i].nbWordsFr;
    this.tabInitFreEng[i].nbWordsEn=this.tabFreEng[i].nbWordsEn;
  }

}
onCancel(){
  this.isAction=false;
  this.isModif=false;
  this.tabFreEng.splice(0,this.tabFreEng.length);
  for (var i=0; i<this.tabInitFreEng.length;i++){
    this.tabFreEng.push({French:"",English:"",inputHeight:0,nbWordsFr:1,nbWordsEn:1});
    this.tabFreEng[i].French=this.tabInitFreEng[i].French;
    this.tabFreEng[i].English=this.tabInitFreEng[i].English;
    this.tabFreEng[i].inputHeight=this.tabInitFreEng[i].inputHeight;
    this.tabFreEng[i].nbWordsFr=this.tabInitFreEng[i].nbWordsFr;
    this.tabFreEng[i].nbWordsEn=this.tabInitFreEng[i].nbWordsEn;
  }
}

tabInitFreEng:Array<any>=[];
msg:string="";
putRecord(GoogleBucket:string, GoogleObject:string, record:any){
    
  var file=new File ([JSON.stringify(record)],GoogleObject, {type: 'application/json'});
  this.ManageGoogleService.uploadObject(this.configServer, GoogleBucket, file )
    .subscribe(res => {
            if (res.type===4){
              this.msg='File "'+ GoogleObject +'" is successfully stored in the cloud';
              this.isConfirmedSave=false;
              //this.returnFile.emit(record);
            }
          },
          error_handler => {
            //**this.LogMsgConsole('Individual Record is not updated: '+ this.Table_User_Data[this.identification.id].UserId );
            this.Error_Access_Server='File' + GoogleObject +' *** Save action failed - status is '+error_handler.status;
          } 
        )
    }

getRecord(Bucket:string,GoogleObject:string, iWait:number){
  
  this.EventHTTPReceived[iWait]=false;
  this.NbWaitHTTP++;
  this.waitHTTP(this.TabLoop[iWait],30000,iWait);
  this.Error_Access_Server='';
  this.ManageGoogleService.getContentObject(this.configServer, Bucket, GoogleObject )
            .subscribe((data ) => {
              this.EventHTTPReceived[iWait]=true;
                if (iWait===0){
                  for (var i=0; i<data.length;i++){
                    this.tabFreEng.push({French:"",English:"",inputHeight:0,nbWordsFr:1,nbWordsEn:1});
                    this.tabFreEng[i].French=data[i].French;
                    this.tabFreEng[i].English=data[i].English;
                    this.tabFreEng[i].inputHeight=data[i].inputHeight;
                    if (data[i].nbWordsEn!==undefined){
                    this.tabFreEng[i].nbWordsFr=data[i].nbWordsFr;
                    this.tabFreEng[i].nbWordsEn=data[i].nbWordsEn;
                  } else {
                    this.tabFreEng[i].nbWordsFr=1;
                    this.tabFreEng[i].nbWordsEn=1;
                  }
                    this.tabInitFreEng.push({French:"",English:"",inputHeight:0,nbWordsFr:1,nbWordsEn:1});
                    this.tabInitFreEng[i].French=data[i].French;
                    this.tabInitFreEng[i].English=data[i].English;
                    this.tabInitFreEng[i].inputHeight=data[i].inputHeight;
                    if (data[i].nbWordsEn!==undefined){
                      this.tabInitFreEng[i].nbWordsEn=data[i].nbWordsEn;
                      this.tabInitFreEng[i].nbWordsFr=data[i].nbWordsFr;
                    } else {
                      this.tabInitFreEng[i].nbWordsEn=1;
                      this.tabInitFreEng[i].nbWordsFr=1;
                    }
                    
                  }
                  this.isFileRetrieved=true;
                }
                this.tabFreEngHeight=this.tabFreEng.length * this.inputHeight;
                if (this.tabFreEngHeight>this.tabMaxHeight){
                  this.tabFreEngHeight=this.tabMaxHeight;
                }
            },
            (error_handler) => {
              this.EventHTTPReceived[iWait]=true;
              this.tabFreEng.push({French:"",English:"",inputHeight:0,nbWordsFr:1,nbWordsEn:1});
              this.tabFreEng[0].inputHeight=this.inputMinHeight;    
              this.Error_Access_Server='Could not retrieve the file ' ;
              this.tabFreEngHeight=this.inputHeight;
            }

            
            )
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
