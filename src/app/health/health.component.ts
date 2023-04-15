import { Component, OnInit , Input, Output, HostListener,  HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
  
import { DatePipe, formatDate } from '@angular/common'; 

import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { Observable } from 'rxjs';

import { Fitness } from '../JsonServerClass';
import { FormatWeight } from '../JsonServerClass';
import { ArrayNewWeight } from '../JsonServerClass';
import { ArrayNewBody } from '../JsonServerClass';
import { BucketList } from '../JsonServerClass';
import { Bucket_List_Info } from '../JsonServerClass';

// configServer is needed to use ManageGoogleService
// it is stored in MangoDB and accessed via ManageMangoDBService
import { configServer } from '../JsonServerClass';
import { XMVConfig } from '../JsonServerClass';
import { environment } from 'src/environments/environment';
import { LoginIdentif } from '../JsonServerClass';
import {manage_input} from '../manageinput';
import {eventoutput, thedateformat} from '../apt_code_name';
import { msgConsole } from '../JsonServerClass';
import {msginLogConsole} from '../consoleLog'

import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import {AccessConfigService} from 'src/app/CloudServices/access-config.service';


export class ClassSubConv{
  toUnit:string='';
  value:number=1;
}

export class ClassConv{
  fromUnit:string='';
  convert:Array<ClassSubConv>=[];
}

export class ConvItem{
  from:string='';
  to:string='';
  valueFromTo:number=0;
  firstValue:number=0;
  secondValue:number=0;
  valueFromToDisplay:number=0;
  firstValueDisplay:number=0;
  secondValueDisplay:number=0;
  refMainTable:number=0;
}

@Component({
  selector: 'app-health',
  templateUrl: './health.component.html',
  styleUrls: ['./health.component.css']
})
export class HealthComponent implements OnInit {

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


  myLogConsole:boolean=false;
  myConsole:Array< msgConsole>=[];
  returnConsole:Array< msgConsole>=[];
  SaveConsoleFinished:boolean=false;
  type:string='';

  HTTP_Address:string='';
  HTTP_AddressPOST:string='';
  Google_Bucket_Access_Root:string='https://storage.googleapis.com/storage/v1/b/';
  Google_Bucket_Access_RootPOST:string='https://storage.googleapis.com/upload/storage/v1/b/';
 
  Google_Bucket_Name:string='xav_fitness'; 
  Google_Object_Name:string='HealthTracking';
  Google_Object_Console:string='LogConsole';

  bucket_data:string='';
  myListOfObjects=new Bucket_List_Info;
  DisplayListOfObjects:boolean=false;
  Error_Access_Server:string='';
  message:string='';
  error_msg: string='';

  EventHTTPReceived:Array<boolean>=[];
  id_Animation:Array<number>=[];
  TabLoop:Array<number>=[];
  NbWaitHTTP:number=0;

  IsSaveConfirmed:boolean=false;
  SpecificForm=new FormGroup({
    FileName: new FormControl(''),
  })

  PageToDisplay:Array<ConvItem>=[]
  ConvToDisplay:Array<ConvItem>=[]
  
  itemPerPage:number=10;
  currentPage:number=0;
  valueFrom:number=0;
  valueTo:number=0;

  inField:string='';
  TabFilter:Array<any>=[];
  maxFilter:number=3;

  currentOption:number=0;
  SelectedOption:Array<any>=[];
  TabOptions:Array<any>=['Calories & Fat', 'Converter','Meals','Weight'];
  trouve:boolean=true;
  TabDialogue:Array<any>=[];
  TabAction:Array<any>=['Modify','Delete',''];
  PreviousDialogue:number=0;

  CaloriesFat:Array<any>=[
    {"Type":"",
    "Content":[
      {
          "Name": "",
          "Serving":2,
          "ServingUnit":"oz",
          "Calories":142,
          "GI":0,
          "Fat":{
              "Saturated":0,
              "non-Saturated":0
          }
      }],
    }
    ]

ConvertUnit:Array<ClassConv>=[];

displayNewRow:boolean=false;
newRecord={

  valueFromTo:0,
  From:'',
  To:'',
}

ValuesToConvert={
  valueFromTo:0,
  From:'',
  To:'',
  valueFrom:0,
  valueTo:0,
}

ngOnInit(): void {
    this.GetRecord('config-xmvit','CaloriesFat.json',0);
    this.GetRecord('config-xmvit','ConvertUnit.json',1);

    this.GetRecord('Google_Bucket_Name','Google_Object_Name',2);
    this.HTTP_Address=this.Google_Bucket_Access_RootPOST +  "logconsole/o?name="  ;
    var i=0;
    for (i=0; i<this.maxFilter; i++){
      this.TabFilter[i]='';
    }
    for (i=0; i<this.TabOptions.length; i++){
      this.SelectedOption[i]=false;
    }
    for (i=0; i<this.itemPerPage; i++){
      this.TabDialogue[i]=false;
    }
}
LastFieldInput:string='';
ConvertValues(event:any){
  this.message='';
  var i=0;
  var j=0;
  if (event.target.id.substring(0,4)==='From'){
    this.ValuesToConvert.From=event.target.value;
  } else if (event.target.id.substring(0,2)==='To'){
    this.ValuesToConvert.To=event.target.value;
  } else if (event.target.id.substring(0,9)==='ValueFrom'){
    if (isNaN(event.target.value)===false){
      this.ValuesToConvert.valueFrom=Number(event.target.value);
      this.LastFieldInput="FROM";
    } else { this.error_msg='Please enter a numeric value'}
  } else if (event.target.id.substring(0,7)==='ValueTo'){
    if (isNaN(event.target.value)===false){
      this.ValuesToConvert.valueTo=Number(event.target.value);
      this.LastFieldInput="TO";
    } else { this.error_msg='Please enter a numeric value'}
  }else if (event.target.id.substring(0,7)==='Convert'){
    this.trouve=false;
    for (i=0; i<this.ConvToDisplay.length && this.trouve===false; i++){
      if (this.ConvToDisplay[i].from===this.ValuesToConvert.From && this.ConvToDisplay[i].to===this.ValuesToConvert.To){
        this.trouve=true;  
        if (this.LastFieldInput==='FROM'){
            this.ValuesToConvert.valueTo=this.ValuesToConvert.valueFrom*this.ConvToDisplay[i].valueFromTo
          } else {
            this.ValuesToConvert.valueFrom=this.ValuesToConvert.valueTo*(1/this.ConvToDisplay[i].valueFromTo);
          }
      }
    }
  }

  
}

CancelConvertValues(){
  this.ValuesToConvert.valueFromTo=0;
  this.ValuesToConvert.From='';
  this.ValuesToConvert.To='';
  this.ValuesToConvert.valueFrom=0;
  this.ValuesToConvert.valueTo=0;
  this.LastFieldInput='';
}

ManageOptions(event:any){
  this.SelectedOption[this.currentOption]=false;
  this.currentOption=event.target.id.substring(7);
  this.SelectedOption[this.currentOption]=true;
  }

ManageCalories(){

  }
DelModAction(event:any){
  this.LogMsgConsole('onDelModAction - event id='+event.target.id+' event value='+event.target.value);
  this.message='';
  var i=0;
  var j=0;
  if (event.target.value==='Modify'){
    this.TabDialogue[this.PreviousDialogue]=false;
    this.PreviousDialogue=event.target.id.substring(7);
    this.TabDialogue[this.PreviousDialogue]=true;
    this.newRecord.valueFromTo=this.PageToDisplay[this.PreviousDialogue].valueFromTo;
    this.newRecord.From=this.PageToDisplay[this.PreviousDialogue].from;
    this.newRecord.To=this.PageToDisplay[this.PreviousDialogue].to;
    this.LogMsgConsole('onDelModAction - MODIFYdata is  ='+this.newRecord.valueFromTo+' - '+this.newRecord.From + ' - ' + this.newRecord.To);
    // pop up window to modify fieldsn
  } else if (event.target.value==='Delete'){
    // pop up window to ask for confirmation of deletion 
    this.TabDialogue[this.PreviousDialogue]=false;
    this.PreviousDialogue=event.target.id.substring(7);
    this.newRecord.valueFromTo=this.PageToDisplay[this.PreviousDialogue].valueFromTo;
    this.newRecord.From=this.PageToDisplay[this.PreviousDialogue].from;
    this.newRecord.To=this.PageToDisplay[this.PreviousDialogue].to;
    this.ConvToDisplay.splice(this.PageToDisplay[this.PreviousDialogue].refMainTable,1);

    //this.PageToDisplay.splice(this.PreviousDialogue,1);
    this.sortTabUnits();
    for (i=0; i<this.ConvToDisplay.length && this.ConvToDisplay[i].from!==this.newRecord.To; i++){
    }
    if (i<this.ConvToDisplay.length){
      for (j=i; j<this.ConvToDisplay.length &&  this.ConvToDisplay[j].from===this.newRecord.To && this.ConvToDisplay[j].to===this.newRecord.From; j++){
      }
      j--;
      if (this.ConvToDisplay[j].from===this.newRecord.To && this.ConvToDisplay[j].to===this.newRecord.From){
        this.ConvToDisplay.splice(j,1);
      }
    }
    this.Page.direction=1;
    this.Page.fromRow=0;
    this.managePage();
    this.CancelNewRow();
    
   

  } else if (event.target.id==='UpdateChanges'){
    this.PageToDisplay[this.PreviousDialogue].valueFromTo=this.newRecord.valueFromTo;
    this.PageToDisplay[this.PreviousDialogue].from=this.newRecord.From;
    this.PageToDisplay[this.PreviousDialogue].to=this.newRecord.To;
    this.ConvToDisplay[this.PageToDisplay[this.PreviousDialogue].refMainTable].valueFromTo=this.newRecord.valueFromTo;
    this.ConvToDisplay[this.PageToDisplay[this.PreviousDialogue].refMainTable].from=this.newRecord.From;
    this.ConvToDisplay[this.PageToDisplay[this.PreviousDialogue].refMainTable].to=this.newRecord.To;
    this.ConvToDisplay[this.PageToDisplay[this.PreviousDialogue].refMainTable].firstValue=1;
    this.ConvToDisplay[this.PageToDisplay[this.PreviousDialogue].refMainTable].secondValue=1*this.newRecord.valueFromTo;
    this.PageToDisplay[this.PreviousDialogue].firstValue=1;
    this.PageToDisplay[this.PreviousDialogue].secondValue=1*this.newRecord.valueFromTo;
    this.TabDialogue[this.PreviousDialogue]=false;
  }
 
}

CancelAction(){
  this.TabDialogue[this.PreviousDialogue]=false;
  this.message='';
}

ManageConvert(){
    this.message='';
    var i=0;
    var j=0;
    var iOut=-1;
    var trouve=false;
    for (i=0; i<this.ConvertUnit.length; i++){
      for (j=0; j<this.ConvertUnit[i].convert.length; j++){
        iOut++
        const thePush=new ConvItem;
        this.ConvToDisplay.push(thePush);
        
        this.ConvToDisplay[iOut].from=this.ConvertUnit[i].fromUnit;
        this.ConvToDisplay[iOut].to=this.ConvertUnit[i].convert[j].toUnit;
        if (this.ConvertUnit[i].convert[j].value!==0){
            this.ConvToDisplay[iOut].valueFromTo=this.ConvertUnit[i].convert[j].value;
        } else this.ConvToDisplay[iOut].valueFromTo=1;
        this.ConvToDisplay[iOut].valueFromToDisplay=Number(Number(this.ConvToDisplay[iOut].valueFromTo).toFixed(5));
        this.ConvToDisplay[iOut].firstValue=Number(Number(this.ConvToDisplay[iOut].firstValue).toFixed(5));
        this.ConvToDisplay[iOut].secondValue=Number(Number(this.ConvToDisplay[iOut].secondValue).toFixed(5));
        
      }
    }
    // look for all possible conversions
    for (i=this.ConvToDisplay.length-1; i>0; i--){
      trouve=false;
      for (j=0; j<this.ConvToDisplay.length && trouve===false; j++){
        if (this.ConvToDisplay[i].to===this.ConvToDisplay[j].from
          && this.ConvToDisplay[i].from===this.ConvToDisplay[j].to){
            trouve=true;
          }
      }
      if (trouve===false){ 
        iOut++
        const thePush=new ConvItem;
        this.ConvToDisplay.push(thePush);
        
        // create new item with swapping
        this.ConvToDisplay[iOut].from=this.ConvToDisplay[i].to;
        this.ConvToDisplay[iOut].to=this.ConvToDisplay[i].from;
        this.ConvToDisplay[iOut].valueFromTo=1/this.ConvToDisplay[i].valueFromTo;
        this.ConvToDisplay[iOut].valueFromToDisplay=Number(Number(this.ConvToDisplay[iOut].valueFromTo).toFixed(5));
        this.ConvToDisplay[iOut].firstValue=Number(Number(this.ConvToDisplay[iOut].firstValue).toFixed(5));
        this.ConvToDisplay[iOut].secondValue=Number(Number(this.ConvToDisplay[iOut].secondValue).toFixed(5));
      }
    }
    this.sortTabUnits();
    this.managePage();
  }
  
TabOfUnits:Array<any>=[];
sortTabUnits(){
  this.TabOfUnits.splice(0,this.TabOfUnits.length);
  var i=0;
  this.ConvToDisplay.sort((a, b) => (a.from > b.from) ? 1 : -1);
  this.TabOfUnits[0]=this.ConvToDisplay[0].from;
  var j=0;
  for (i=1; i<this.ConvToDisplay.length; i++){
    if (this.ConvToDisplay[i].from!==this.TabOfUnits[j]){
      j++;
      this.TabOfUnits[j]=this.ConvToDisplay[i].from;
    }

  }


}

nextPage(){
  this.message='';
  if (this.PageToDisplay[this.PageToDisplay.length-1].refMainTable+this.itemPerPage<=this.ConvToDisplay.length-1){
    this.Page.fromRow=this.PageToDisplay[this.PageToDisplay.length-1].refMainTable+1; // process to the end of the file
    this.Page.direction=1;
  } else {
    this.Page.fromRow=this.ConvToDisplay.length-1; // process from the end of the file
    this.Page.direction=-1;
  }
  this.managePage();
}

prevPage(){
  this.message='';
  if (this.PageToDisplay[0].refMainTable-this.itemPerPage>0){
    this.Page.fromRow=this.PageToDisplay[0].refMainTable-1; // process to the beginning of the file
    this.Page.direction=-1;
  } else {
    this.Page.fromRow=0; // process from the beginning of the file
    this.Page.direction=1;
  }
  this.managePage();
}

Page={
  fromRow:0,
  direction:+1 // +1 means towards the end; -1 means towards the start
}

managePage(){
    this.message='';
    this.PageToDisplay.splice(0,this.PageToDisplay.length);
    var i=this.Page.fromRow;
    var j=0;
    var k=0;
    for (j=0; j<this.itemPerPage && ((this.Page.direction===1 && i<this.ConvToDisplay.length) || 
                                      (this.Page.direction===-1 && i>0)); j++){
      
      this.trouve=false;
      if (this.doFilter===true ){
        this.trouve=true
        if ((this.TabFilter[0]!=='' && this.TabFilter[1]!=='' && this.ConvToDisplay[i].from===this.TabFilter[0] && this.ConvToDisplay[i].to===this.TabFilter[1]) ||
            (this.TabFilter[0]!=='' && this.TabFilter[1]==='' && this.ConvToDisplay[i].from===this.TabFilter[0]) || (this.TabFilter[0]==='' && this.TabFilter[1]!=='' && this.ConvToDisplay[i].to===this.TabFilter[1])){
          
                this.trouve=false;
              }
      
      }
      if (this.trouve===false){
        const thePush=new ConvItem;
        this.PageToDisplay.push(thePush);
        this.PageToDisplay[this.PageToDisplay.length-1]=this.ConvToDisplay[i];
        this.PageToDisplay[this.PageToDisplay.length-1].refMainTable=i;
      } else {j--}
      if (this.Page.direction===1){
        i++;
      } else {i--;}
      
    }

    if (this.Page.direction===-1){
      const thePush=new ConvItem;
      j=this.PageToDisplay.length-1;
      k=this.PageToDisplay.length;
      this.PageToDisplay.push(thePush);
      for (i=0; i<j; i++){
        this.PageToDisplay[k]=this.PageToDisplay[i];
        this.PageToDisplay[i]=this.PageToDisplay[j];
        this.PageToDisplay[j]=this.PageToDisplay[k];
        j--;
      }
      this.PageToDisplay.splice(k,1);
    }
  }


  inputValue(event:any){
    this.message='';
    var i=0;
    var idRecord=0;
      if (event.target.id.substring(0,11)==='valueFromTo'){
        if (isNaN(event.target.value)===false){
          idRecord=event.target.id.substring(12);
          this.PageToDisplay[idRecord].valueFromTo=Number(event.target.value);
           this.ConvToDisplay[this.PageToDisplay[idRecord].refMainTable].valueFromTo=Number(event.target.value);
        }
      } else if (event.target.id.substring(0,9)==='valueFrom'){
          if (isNaN(event.target.value)===false){
            idRecord=event.target.id.substring(10);
            this.PageToDisplay[idRecord].firstValue=Number(event.target.value);
            this.ConvToDisplay[this.PageToDisplay[idRecord].refMainTable].firstValue=Number(event.target.value);
            this.PageToDisplay[idRecord].secondValue=this.ConvToDisplay[idRecord].firstValue*this.ConvToDisplay[idRecord].valueFromTo;    
            this.ConvToDisplay[this.PageToDisplay[idRecord].refMainTable].secondValue=this.PageToDisplay[idRecord].firstValue*this.PageToDisplay[idRecord].valueFromTo;    
            }
        } else if (event.target.id.substring(0,7)==='valueTo'){
          if (isNaN(event.target.value)===false){
            idRecord=event.target.id.substring(8);
            this.PageToDisplay[event.target.id.substring(8)].secondValue=Number(event.target.value);
            this.ConvToDisplay[this.PageToDisplay[idRecord].refMainTable].secondValue=Number(event.target.value);
            if (this.PageToDisplay[idRecord].valueFromTo!==0){
              this.PageToDisplay[idRecord].firstValue=this.PageToDisplay[idRecord].secondValue/this.PageToDisplay[idRecord].valueFromTo;
              this.ConvToDisplay[this.PageToDisplay[idRecord].refMainTable].firstValue=this.PageToDisplay[idRecord].secondValue/this.PageToDisplay[idRecord].valueFromTo;
            }
         }
      }
      this.PageToDisplay[idRecord].firstValueDisplay=Number(this.PageToDisplay[idRecord].firstValue.toFixed(5));
      this.PageToDisplay[idRecord].secondValueDisplay=Number(this.PageToDisplay[idRecord].secondValue.toFixed(5));
      this.PageToDisplay[idRecord].valueFromTo=Number(this.PageToDisplay[idRecord].valueFromTo.toFixed(5));
      this.ConvToDisplay[this.PageToDisplay[idRecord].refMainTable].firstValue=this.PageToDisplay[idRecord].firstValueDisplay;
      this.ConvToDisplay[this.PageToDisplay[idRecord].refMainTable].secondValue=this.PageToDisplay[idRecord].secondValueDisplay;
      this.ConvToDisplay[this.PageToDisplay[idRecord].refMainTable].valueFromTo=this.PageToDisplay[idRecord].valueFromTo;
    }

  doFilter:boolean=false;
  onFilter(event:any){
     var i=0;
     var field='';
    //this.LogMsgConsole('onFilter HEALTH.TS Converter ===== Device ' + navigator.userAgent + '======');
    this.message='';
    if (event.target.id!==""){
      if (event.target.id.substring(0,6)==='Filter' && event.target.value!==""){
        this.TabFilter[event.target.id.substring(7)]=event.target.value;
        this.doFilter=true;
        for (i=0; i<this.TabOfUnits.length && event.target.value!==this.TabOfUnits[i]; i++){
        }
        if (i<this.TabOfUnits.length){
          // unit exists; trigger the filtering
          this.Page.fromRow=0; // process from the beginning of the file
          this.Page.direction=1;
          this.managePage();
        }
        this.TabOfUnits
      } else if (event.target.id.substring(0,6)==='Filter'  && event.target.value===""){
          this.TabFilter[event.target.id.substring(7)]="";
          if (this.TabFilter[0]!=='' || this.TabFilter[1]!==''){
            this.doFilter=true;
            if (this.TabFilter[0]!==''){field=this.TabFilter[0]}
            else {field=this.TabFilter[1]}
            for (i=0; i<this.TabOfUnits.length && field!==this.TabOfUnits[i]; i++){
            }
            if (i<this.TabOfUnits.length){
              // unit exists; trigger the filtering
              this.Page.fromRow=0; // process from the beginning of the file
              this.Page.direction=1;
              this.managePage();
            }
          } else { 
            this.doFilter=false;
            this.Page.fromRow=0; // process from the beginning of the file
            this.Page.direction=1;
            this.managePage();
          }
          
      }
      //this.LogMsgConsole('onFilter page before [0] ' + this.PageToDisplay[0].from + ' - '+ this.PageToDisplay[0].to);
      //this.LogMsgConsole('onFilter page before [<9] ' + this.PageToDisplay[this.PageToDisplay.length-1].from + ' - '+ this.PageToDisplay[this.PageToDisplay.length-1].to);


    }
    //this.LogMsgConsole('onFilter page after [0] ' + this.PageToDisplay[0].from + ' - '+ this.PageToDisplay[0].to);
    //this.LogMsgConsole('onFilter page after [9] ' + this.PageToDisplay[this.PageToDisplay.length-1].from + ' - '+ this.PageToDisplay[this.PageToDisplay.length-1].to);
    //this.LogMsgConsole('onFilter target id & value ' + event.target.id + ' - '+ event.target.value);
    //this.LogMsgConsole('onFilter filters [0]=' + this.TabFilter[0] + ' - [1]='+ this.TabFilter[1]);
    //this.LogMsgConsole('onFilter Page.fromRow=' + this.Page.fromRow + ' - Page.direction='+ this.Page.direction)+'  == EXIT FILTER';

  }


  cancelFilter(){
    var i=0;
    for (i=0; i<this.TabFilter.length; i++){
        this.TabFilter[i]='';
      }
      this.doFilter=false;
      this.Page.fromRow=0; // process from the beginning of the file
      this.Page.direction=1;
      this.managePage();
  }


addRow(){
  this.displayNewRow=true;
  this.message='';
  this.error_msg='';
}

inputNewRow(event:any){
  this.error_msg='';
  if (event.target.id==='FromTo'){
    if (isNaN(event.target.value)===false){
        this.newRecord.valueFromTo=Number(event.target.value);
      } else {this.error_msg='Enter a numeric value';}
  } else   if (event.target.id==='From'){
    this.newRecord.From=event.target.value;
  } else   if (event.target.id==='To'){
    this.newRecord.To=event.target.value;
  } else   if (event.target.id==='SaveNewRow'){
    const thePush=new ConvItem;
    this.ConvToDisplay.push(thePush);
    this.ConvToDisplay[this.ConvToDisplay.length-1].valueFromTo=Number(this.newRecord.valueFromTo);
    this.ConvToDisplay[this.ConvToDisplay.length-1].from=this.newRecord.From;
    this.ConvToDisplay[this.ConvToDisplay.length-1].to=this.newRecord.To;
    this.ConvToDisplay[this.ConvToDisplay.length-1].firstValue=1;
    this.ConvToDisplay[this.ConvToDisplay.length-1].secondValue=Number(this.newRecord.valueFromTo);

    this.ConvToDisplay[this.ConvToDisplay.length-1].valueFromToDisplay=Number(Number(this.newRecord.valueFromTo).toFixed(5));
    this.ConvToDisplay[this.ConvToDisplay.length-1].firstValueDisplay=1;
    this.ConvToDisplay[this.ConvToDisplay.length-1].secondValueDisplay=Number(Number(this.ConvToDisplay[this.ConvToDisplay.length-1].secondValue).toFixed(5));
   
    const newPush=new ConvItem;
    this.ConvToDisplay.push(newPush);
    this.ConvToDisplay[this.ConvToDisplay.length-1].valueFromTo=1/this.newRecord.valueFromTo;
    this.ConvToDisplay[this.ConvToDisplay.length-1].from=this.newRecord.To;
    this.ConvToDisplay[this.ConvToDisplay.length-1].to=this.newRecord.From;
    this.ConvToDisplay[this.ConvToDisplay.length-1].firstValue=1;
    this.ConvToDisplay[this.ConvToDisplay.length-1].secondValue=1/this.newRecord.valueFromTo;

    this.ConvToDisplay[this.ConvToDisplay.length-1].valueFromToDisplay=Number(Number(1/this.newRecord.valueFromTo).toFixed(5));
    this.ConvToDisplay[this.ConvToDisplay.length-1].firstValueDisplay=1;
    this.ConvToDisplay[this.ConvToDisplay.length-1].secondValueDisplay=Number(Number(this.ConvToDisplay[this.ConvToDisplay.length-1].secondValue).toFixed(5));
   
   
    this.sortTabUnits();
    this.Page.direction=1;
    this.Page.fromRow=0;
    this.managePage();
    this.CancelNewRow();
  }
}

CancelNewRow(){
  this.newRecord.valueFromTo=0;
  this.newRecord.From='';
  this.newRecord.To='';
  this.displayNewRow=false;
}

CreateCalDisplay(){

  }

SaveConvert(){
    // update the confirguration file with all the data
    var i=0;
    var j=0;
    var k=0;
    var iLast=0;
    this.ConvertUnit.splice(0,this.ConvertUnit.length);
    for (k=0; k<this.TabOfUnits.length; k++){
      const Conv=new ClassConv;
      this.ConvertUnit.push(Conv);
      this.ConvertUnit[this.ConvertUnit.length-1].fromUnit=this.TabOfUnits[k];
      for (i=i; i<this.ConvToDisplay.length && this.ConvToDisplay[i].from===this.TabOfUnits[k]; i++){
          var SubConv=new ClassSubConv;
          SubConv.toUnit= this.ConvToDisplay[i].to;
          SubConv.value= this.ConvToDisplay[i].valueFromTo;
          this.ConvertUnit[this.ConvertUnit.length-1].convert.push(SubConv);   
      }
    }
    this.SaveNewRecord('config-xmvit','ConvertUnit.json');
  }

  CancelConvert(){
    this.ConvToDisplay.splice(0,this.ConvToDisplay.length);
    this.ManageConvert();
  }

  GetRecord(Bucket:string,GoogleObject:string, iWait:number){

    this.EventHTTPReceived[iWait]=false;
    this.NbWaitHTTP++;
    this.waitHTTP(this.TabLoop[iWait],30000,iWait);
  
    //this.Google_Object_Name='AFeb%2028%202023';
  
    this.ManageGoogleService.getContentObject(this.configServer, Bucket, GoogleObject )
              .subscribe((data ) => {
                  this.EventHTTPReceived[iWait]=true;
                  if (GoogleObject==='CaloriesFat.json'){
                    this.CaloriesFat=data;
                    this.CreateCalDisplay();
                  } else if (GoogleObject==='ConvertUnit.json'){
                    this.ConvertUnit=data;
                    this.ManageConvert();
                  } else if (GoogleObject===this.Google_Object_Name){
                    
                  }
                
                },
                error_handler => {
                  this.EventHTTPReceived[iWait]=true;
                  if (GoogleObject==='CaloriesFat.json'){
                    

                  } else if (GoogleObject==='ConvertUnit.json'){
                    
                    
                  } else if (GoogleObject===this.Google_Object_Name){
                    
                  }
                  
              } 
        )
    }

    ConfirmSave(){
        this.SpecificForm.controls['FileName'].setValue(this.Google_Object_Name);
        this.IsSaveConfirmed = true;
        this.error_msg='';
    }
    
  HealthData:string='';
  SaveNewRecord(GoogleBucket:string, GoogleObject:string){
    var file= new File([JSON.stringify(this.ConvertUnit)],GoogleObject, {type: 'application/json'});
    if (GoogleObject==='ConsoleLog.json'){
      const myTime=new Date();
      GoogleObject='ConsoleLog.json-'+ myTime.toString().substring(4,21);
      //'-'+myTime.getTime().toString().substring(0,4);
      file=new File ([JSON.stringify(this.myConsole)],GoogleObject, {type: 'application/json'});
    } else
    if (GoogleObject==='CaloriesFat.json'){
        file=new File ([JSON.stringify(this.CaloriesFat)],GoogleObject, {type: 'application/json'});
        
      } else if (GoogleObject==='ConvertUnit.json'){
        file=new File ([JSON.stringify(this.ConvertUnit)],GoogleObject, {type: 'application/json'});
        
      } else if (GoogleObject===this.Google_Object_Name){
        var file=new File ([JSON.stringify(this.HealthData)],GoogleObject, {type: 'application/json'});
      }
    this.ManageGoogleService.uploadObject(this.configServer, GoogleBucket, file )
      .subscribe(res => {
              this.message='File "'+ GoogleObject +'" is successfully stored in the cloud';
            },
            error_handler => {
              //**this.LogMsgConsole('Individual Record is not updated: '+ this.Table_User_Data[this.identification.id].UserId );
              this.message='File' + GoogleObject +' *** Save action failed - status is '+error_handler.status;
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
      }  
  }

LogMsgConsole(msg:string){
  if (this.myConsole.length>40){
    this.SaveNewRecord('logconsole','ConsoleLog.json');
    this.message='Saving of LogConsole';
  }
  this.SaveConsoleFinished=false;

  this.myLogConsole=true;
  msginLogConsole(msg, this.myConsole,this.myLogConsole, this.SaveConsoleFinished,this.HTTP_Address, this.type);
  
  }

}
