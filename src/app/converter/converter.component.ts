import { Component, OnInit , Input, Output, HostListener,  HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
  
import { DatePipe, formatDate } from '@angular/common'; 

import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { Observable } from 'rxjs';


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
import {ClassSubConv, mainConvItem, mainRecordConvert, mainClassUnit} from '../ClassConverter'
import {mainClassConv} from '../ClassConverter'
import {ClassConv} from '../ClassConverter'
import {ClassUnit} from '../ClassConverter'
import {ConvItem} from '../ClassConverter'
import {recordConvert} from '../ClassConverter'

import {  getStyleDropDownContent, getStyleDropDownBox, classDropDown } from '../DropDownStyle'

import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import {AccessConfigService} from 'src/app/CloudServices/access-config.service';



@Component({
  selector: 'app-converter',
  templateUrl: './converter.component.html',
  styleUrls: ['./converter.component.css']
})
export class ConverterComponent implements OnInit {

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
    @Input() convertOnly:boolean=false;
    @Input() InConvertUnit= new mainClassConv;

    @Input() InConvToDisplay=new mainConvItem;

    @Input() IntheTabOfUnits=new mainClassUnit;
    @Input() InWeightRefTable=new mainRecordConvert;

    @Output() returnFile= new EventEmitter<any>();

    PageToDisplay:Array<ConvItem>=[]
    ConvToDisplay=new mainConvItem;
    WeightRefTable=new mainRecordConvert;
    DistanceRefTable=new mainRecordConvert;
    theTabOfUnits=new mainClassUnit;

    DisplayTabOfUnitsFrom:Array<ClassUnit>=[];
    DisplayTabOfUnitsTo:Array<ClassUnit>=[];
    NewRowTabOfUnitsFrom:Array<ClassUnit>=[];
    NewRowTabOfUnitsTo:Array<ClassUnit>=[];
    FilterTabOfUnitsFrom:Array<ClassUnit>=[];
    FilterTabOfUnitsTo:Array<ClassUnit>=[];

    ConvertUnit= new mainClassConv;
  
    myLogConsole:boolean=false;
    myConsole:Array< msgConsole>=[];
    returnConsole:Array< msgConsole>=[];
    SaveConsoleFinished:boolean=false;
    type:string='';
  
    HTTP_Address:string='';
    HTTP_AddressPOST:string='';
    Google_Bucket_Access_Root:string='https://storage.googleapis.com/storage/v1/b/';
    Google_Bucket_Access_RootPOST:string='https://storage.googleapis.com/upload/storage/v1/b/';
   
    //Google_Bucket_Name:string='xav_fitness'; 
    //Google_Object_Name:string='HealthTracking';
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
  

    
    itemPerPage:number=10;
    currentPage:number=0;
    valueFrom:number=0;
    valueTo:number=0;
  
    inField:string='';
    TabFilter:Array<any>=[];
    TabFilterType:Array<any>=[];
    maxFilter:number=3;
  
    //currentOption:number=0;
    //SelectedOption:Array<any>=[];
    //TabOptions:Array<any>=['Calories & Fat', 'Converter','Meals','Weight'];
    trouve:boolean=true;
    TabDialogue:Array<any>=[];
    TabAction:Array<any>=['Cancel','Modify','Delete'];
    TabUnitType:Array<any>=['Cancel','W-Weight','D-Distance','L-Liquid'];
    PreviousDialogue:number=0;

  displayNewRow:boolean=false;
  newRecord=new recordConvert;
  
  ValuesToConvert={
    valueFromTo:0,
    From:'',
    To:'',
    valueFrom:0,
    valueTo:0,
    type:'',
  }
  currentDisplayType:string='';
  LastFieldInput:string='';
  theAction:string='';
  displayToDelete:boolean=false;
  displayUnitType:boolean=false;
  displayToModify:boolean=false;
  Page={
    fromRow:0,
    direction:+1 // +1 means towards the end; -1 means towards the start
  }
  messageConvert:string='';
  doFilter:boolean=false;
  getScreenWidth: any;
  getScreenHeight: any;
  device_type:string='';

  sizeBox = new classDropDown;
  dataList = new classDropDown;


  styleDataListFromContent:any;
  styleDataListToContent:any;
  styleDataListFromOptions:any;
  styleDataListToOptions:any;

  styleBoxOptions:any;
  styleBoxContent:any;

  myUnit:string='';
  myType:string='';

  dialogueFromTo:Array<boolean>=[false,false,false,false,false,false,false,false,false,false];

  theEvent={
    target:{
      id:"",
      value:"",
      textContent:""
    }
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
      this.getScreenWidth = window.innerWidth;
      this.getScreenHeight = window.innerHeight;
    }




  ngOnInit(): void {

    this.sizeBox.widthContent=100;
    this.sizeBox.widthOptions=100;
    this.sizeBox.heightItem=25;
    this.sizeBox.heightContent=110;
    this.sizeBox.heightOptions=110;
    this.sizeBox.maxHeightContent=150;
    this.sizeBox.maxHeightOptions=150;
    this.sizeBox.scrollY='hidden';

    this.dataList.heightItem=25;
    this.dataList.widthContent=100;
    this.dataList.widthOptions=100;
    this.dataList.maxHeightContent=150;
    this.dataList.maxHeightOptions=150;

    this.styleBoxContent=getStyleDropDownContent(this.sizeBox.heightContent, this.sizeBox.widthContent );
    this.styleBoxOptions=getStyleDropDownBox(this.sizeBox.heightOptions, this.sizeBox.widthOptions, 0, 0, this.sizeBox.scrollY);


    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;
    this.device_type = navigator.userAgent;
    this.device_type = this.device_type.substring(10, 48);
    this.HTTP_Address=this.Google_Bucket_Access_RootPOST +  "logconsole/o?name="  ;
    var i=0;
    for (i=0; i<this.maxFilter; i++){
      this.TabFilter[i]='';
      this.TabFilterType[i]='';

    }
    //for (i=0; i<this.TabOptions.length; i++){
    //  this.SelectedOption[i]=false;
    //}
    for (i=0; i<this.itemPerPage; i++){
      this.TabDialogue[i]=false;
    }
    if (this.InWeightRefTable.fileType!==''){
      this.EventHTTPReceived[2]=true;
      this.WeightRefTable=this.InWeightRefTable;
    } else {
      this.GetRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.weightReference,2);
    }
    if (this.convertOnly===false){
          if (this.InConvertUnit.fileType!==''){
            this.ConvertUnit=this.InConvertUnit;
            this.EventHTTPReceived[1]=true;
            if (this.InConvToDisplay.fileType!==''){
              this.ConvToDisplay=this.InConvToDisplay;
              this.EventHTTPReceived[3]=true;
            } else {this.sortTabUnits()}
            if (this.IntheTabOfUnits.fileType!==''){
              this.theTabOfUnits=this.IntheTabOfUnits;
              this.EventHTTPReceived[4]=true;

            } else {this.sortTabUnits()}

            if (this.InConvToDisplay.fileType==='' || this.IntheTabOfUnits.fileType===''){
              this.ManageConvert();

            } else {this.managePage();}
            
          } else {
          this.GetRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.convertUnit,1);
          }

      } else {

        if (this.InConvToDisplay.fileType!==''){
          this.ConvToDisplay=this.InConvToDisplay;
          this.EventHTTPReceived[3]=true;
        } else {
          this.GetRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.convToDisplay,3);
            
        }
        if (this.IntheTabOfUnits.fileType!==''){
          this.theTabOfUnits=this.IntheTabOfUnits;
          this.EventHTTPReceived[4]=true;
          
        } else {
          this.GetRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.tabOfUnits,4);
        }

      }
  }

  fillDisplayTabUnit(type:string, exclude:string, DisplayTab:any, FromTo:any){
    var i=0;
    DisplayTab.splice(0,DisplayTab.length);
    for (i=0; i<this.theTabOfUnits.tabClassUnit.length; i++){
      if ( type==='' || (this.theTabOfUnits.tabClassUnit[i].type===type && exclude!==this.theTabOfUnits.tabClassUnit[i].name)){
        const cUnit=new ClassUnit;
        DisplayTab.push(cUnit);
        DisplayTab[DisplayTab.length-1]=this.theTabOfUnits.tabClassUnit[i];
        }
    }
    this.dataList.heightContent=this.dataList.heightItem * DisplayTab.length;
    this.dataList.heightOptions=this.dataList.heightItem * DisplayTab.length;
    this.dataList.scrollY='hidden';
    if (this.dataList.heightContent > this.dataList.maxHeightContent) {
      this.dataList.heightContent=this.dataList.maxHeightContent;
    }
   
    if (this.dataList.heightOptions > this.dataList.maxHeightOptions) {
      this.dataList.heightOptions=this.dataList.maxHeightOptions;
      this.dataList.scrollY='scroll';
    }
    if (FromTo==='From'){
      this.styleDataListFromContent=getStyleDropDownContent(this.dataList.heightContent, this.dataList.widthContent);
      this.styleDataListFromOptions=getStyleDropDownBox(this.dataList.heightOptions, this.dataList.widthOptions, 10, 5, this.dataList.scrollY);
    } else if (FromTo==='To'){
      
      this.styleDataListToContent=getStyleDropDownContent(this.dataList.heightContent, this.dataList.widthContent);
      this.styleDataListToOptions=getStyleDropDownBox(this.dataList.heightOptions, this.dataList.widthOptions, 200, 5, this.dataList.scrollY);

    }
  }
/*
  ManageOptions(event:any){
    this.SelectedOption[this.currentOption]=false;
    this.currentOption=event.target.id.substring(7);
    this.SelectedOption[this.currentOption]=true;
    }
*/  
  WeightQualityCheck(){
    // check that ConvertUnit contains the right reference values
    var i=0;
    var j=0;
    var k=0;
    const type='W';
    var nbPasses=0;
    for (j=0; j<this.ConvertUnit.tabConv.length; j++){
      if (this.ConvertUnit.tabConv[j].type===type){
        for (i=0; i<this.WeightRefTable.tabRecordConvert.length; i++){
         
          if ( this.ConvertUnit.tabConv[j].fromUnit===this.WeightRefTable.tabRecordConvert[i].From){
            // unit From is found
            // look now for unit To
            for (k=0; k<this.ConvertUnit.tabConv[j].convert.length && this.ConvertUnit.tabConv[j].convert[k].toUnit!==this.WeightRefTable.tabRecordConvert[i].To; k++){}       
            if (k<this.ConvertUnit.tabConv[j].convert.length){
                //nbPasses++
                console.log('nbPasses = '+nbPasses);
                  // unit To is found 
                  // update the value
                if ( this.ConvertUnit.tabConv[j].convert[k].value!==this.WeightRefTable.tabRecordConvert[i].valueFromTo){
                  //    console.log(' different values Convert ' + this.ConvertUnit.tabConv[j].fromUnit + ' - '+ this.ConvertUnit.tabConv[j].convert[k].toUnit + ' - ' + this.ConvertUnit.tabConv[j].convert[k].value + ' referenced value is ' +
                  //    this.WeightRefTable.tabRecordConvert[i].valueFromTo);
                      this.ConvertUnit.tabConv[j].convert[k].value=this.WeightRefTable.tabRecordConvert[i].valueFromTo;
                  } else {//console.log(' same values Convert ' + this.ConvertUnit.tabConv[j].fromUnit + ' - '+ this.ConvertUnit.tabConv[j].convert[k].toUnit + ' - ' + this.ConvertUnit.tabConv[j].convert[k].value + ' referenced value is ' +
                      // this.WeightRefTable.tabRecordConvert[i].valueFromTo);
                      }
              }
            }
          } 
      }
    }
    this.OtherWeightQualityCheck();
  }
  

  OtherWeightQualityCheck(){
    // check that ConvertUnit contains the right reference values
    var iFrom=0;
    var i=0;
    var j=0;
    var k=0;
    var iTo=0;
    var newValue:number=0;
    const type='W';
    var nbPasses=0;
    var trouve:boolean=false;
    // check the non-referenced values 
    for (j=0; j<this.ConvertUnit.tabConv.length; j++){
      if (this.ConvertUnit.tabConv[j].type===type){
          for (k=0; k<this.ConvertUnit.tabConv[j].convert.length; k++){
            // ensure this combination is not the reference
            for (i=0; i<this.WeightRefTable.tabRecordConvert.length && (this.ConvertUnit.tabConv[j].fromUnit!==this.WeightRefTable.tabRecordConvert[i].From || 
                    this.ConvertUnit.tabConv[j].convert[k].toUnit!==this.WeightRefTable.tabRecordConvert[i].To); i++){
            }
            if (i===this.WeightRefTable.tabRecordConvert.length){ // combination not found in reference
                for (iFrom=0; iFrom<this.WeightRefTable.tabRecordConvert.length && this.ConvertUnit.tabConv[j].fromUnit!==this.WeightRefTable.tabRecordConvert[iFrom].From; iFrom++){
                }
                trouve=false;
                if (iFrom<this.WeightRefTable.tabRecordConvert.length){
                    for (iTo=0; iTo<this.WeightRefTable.tabRecordConvert.length && trouve===false; iTo++){
                        if (this.WeightRefTable.tabRecordConvert[iFrom].To===this.WeightRefTable.tabRecordConvert[iTo].From &&
                        this.ConvertUnit.tabConv[j].convert[k].toUnit===this.WeightRefTable.tabRecordConvert[iTo].To){
                            trouve=true;
                        }
                    }
                    // 
                    if (iFrom<this.WeightRefTable.tabRecordConvert.length && trouve===true){
                      iTo--
                      nbPasses++
                      //console.log('============================================= nbPasses = '+ nbPasses);
                      // calculate the value
                      newValue=this.WeightRefTable.tabRecordConvert[iFrom].valueFromTo * this.WeightRefTable.tabRecordConvert[iTo].valueFromTo
                      if (newValue !== this.ConvertUnit.tabConv[j].convert[k].value){
                        console.log('different values ' + this.ConvertUnit.tabConv[j].fromUnit+' - '+this.ConvertUnit.tabConv[j].convert[k].toUnit +
                        ' with ReferenceWeight : iFrom=' + iFrom + ' and iTo=' + iTo + " new value =" + newValue + '   former value = '
                        + this.ConvertUnit.tabConv[j].convert[k].value);

                        this.ConvertUnit.tabConv[j].convert[k].value=newValue;

                      } else {
                        
                      }
                    } else {
                      console.log("WeightReference: didn't find in reference combination " +  this.ConvertUnit.tabConv[j].fromUnit + ' - ' + this.ConvertUnit.tabConv[j].convert[k].toUnit );
                    }
            }
            }
          }
      }
    }

  }

  ManageConvert(){
      this.message='';
      var i=0;
      var j=0;
      var iOut=-1;
      var trouve=false;

      this.WeightQualityCheck();

      if (this.ConvToDisplay.fileType===''){
        this.ConvToDisplay.fileType=this.identification.configFitness.fileType.convToDisplay;
      }
      
      for (i=0; i<this.ConvertUnit.tabConv.length; i++){
        for (j=0; j<this.ConvertUnit.tabConv[i].convert.length; j++){
          iOut++
          const thePush=new ConvItem;
          this.ConvToDisplay.tabConvItem.push(thePush);
          
          this.ConvToDisplay.tabConvItem[iOut].from=this.ConvertUnit.tabConv[i].fromUnit;
          this.ConvToDisplay.tabConvItem[iOut].type=this.ConvertUnit.tabConv[i].type;
          this.ConvToDisplay.tabConvItem[iOut].to=this.ConvertUnit.tabConv[i].convert[j].toUnit;
          if (this.ConvertUnit.tabConv[i].convert[j].value!==0){
              this.ConvToDisplay.tabConvItem[iOut].valueFromTo=this.ConvertUnit.tabConv[i].convert[j].value;
          } else this.ConvToDisplay.tabConvItem[iOut].valueFromTo=1;
          this.ConvToDisplay.tabConvItem[iOut].valueFromToDisplay=Number(Number(this.ConvToDisplay.tabConvItem[iOut].valueFromTo).toFixed(5));
          this.ConvToDisplay.tabConvItem[iOut].firstValue=Number(Number(this.ConvToDisplay.tabConvItem[iOut].firstValue).toFixed(5));
          this.ConvToDisplay.tabConvItem[iOut].secondValue=Number(Number(this.ConvToDisplay.tabConvItem[iOut].secondValue).toFixed(5));
          
        }
      }
      // look for all possible conversions
      for (i=this.ConvToDisplay.tabConvItem.length-1; i>0; i--){
        trouve=false;
        for (j=0; j<this.ConvToDisplay.tabConvItem.length && trouve===false; j++){
          if (this.ConvToDisplay.tabConvItem[i].to===this.ConvToDisplay.tabConvItem[j].from
            && this.ConvToDisplay.tabConvItem[i].from===this.ConvToDisplay.tabConvItem[j].to){
              trouve=true;
            }
        }
        if (trouve===false){ 
          iOut++
          const thePush=new ConvItem;
          this.ConvToDisplay.tabConvItem.push(thePush);
          
          // create new item with swapping
          this.ConvToDisplay.tabConvItem[iOut].from=this.ConvToDisplay.tabConvItem[i].to;
          this.ConvToDisplay.tabConvItem[iOut].to=this.ConvToDisplay.tabConvItem[i].from;
          this.ConvToDisplay.tabConvItem[iOut].type=this.ConvToDisplay.tabConvItem[i].type;
          this.ConvToDisplay.tabConvItem[iOut].valueFromTo=1/this.ConvToDisplay.tabConvItem[i].valueFromTo;
          this.ConvToDisplay.tabConvItem[iOut].valueFromToDisplay=Number(Number(this.ConvToDisplay.tabConvItem[iOut].valueFromTo).toFixed(5));
          this.ConvToDisplay.tabConvItem[iOut].firstValue=Number(Number(this.ConvToDisplay.tabConvItem[iOut].firstValue).toFixed(5));
          this.ConvToDisplay.tabConvItem[iOut].secondValue=Number(Number(this.ConvToDisplay.tabConvItem[iOut].secondValue).toFixed(5));
        }
      }
      

      if (this.InConvToDisplay.tabConvItem.length===0){
        this.returnFile.emit(this.ConvToDisplay);
      }
      if (this.IntheTabOfUnits.tabClassUnit.length===0){
        this.returnFile.emit(this.theTabOfUnits);
      }
      this.sortTabUnits();

      this.managePage();
    }
    
  
  sortTabUnits(){
    var j=0;
    var i=0;
    var k=0;
    var trouve =false;
    this.theTabOfUnits.tabClassUnit.splice(0,this.theTabOfUnits.tabClassUnit.length);
    this.DisplayTabOfUnitsFrom.splice(0,this.DisplayTabOfUnitsFrom.length);
    this.DisplayTabOfUnitsTo.splice(0,this.DisplayTabOfUnitsTo.length);
    // sort A to Z ConvToDisplay
    this.ConvToDisplay.tabConvItem.sort((a, b) => (a.from > b.from) ? 1 : -1);
    //
  
    j=-1;
    for (i=0; i<this.ConvToDisplay.tabConvItem.length; i++){
      // check if unit and type already exist
      trouve=false;
      for (var l=0; l<this.theTabOfUnits.tabClassUnit.length && trouve===false; l++){
          if (this.ConvToDisplay.tabConvItem[i].from==this.theTabOfUnits.tabClassUnit[l].name
            && this.ConvToDisplay.tabConvItem[i].type===this.theTabOfUnits.tabClassUnit[l].type){
              trouve=true; // item already exists in TabOfUnits move to next item
          }
      }
      if (j<0 || trouve===false){
        j++;
        const cUnit=new ClassUnit;
        this.theTabOfUnits.tabClassUnit.push(cUnit);
        this.theTabOfUnits.tabClassUnit[j].name=this.ConvToDisplay.tabConvItem[i].from;
        this.theTabOfUnits.tabClassUnit[j].type=this.ConvToDisplay.tabConvItem[i].type;
        this.theTabOfUnits.tabClassUnit[j].startPosFrom=i;
        this.DisplayTabOfUnitsFrom.push(cUnit);
        this.DisplayTabOfUnitsTo.push(cUnit);
        this.DisplayTabOfUnitsFrom[j]=this.theTabOfUnits.tabClassUnit[j];
        this.DisplayTabOfUnitsTo[j]=this.theTabOfUnits.tabClassUnit[j];
        trouve=false;
        for (k=0; k<this.ConvToDisplay.tabConvItem.length && trouve===false; k++){
              if (this.theTabOfUnits.tabClassUnit[j].name===this.ConvToDisplay.tabConvItem[k].to 
                && this.theTabOfUnits.tabClassUnit[j].type===this.ConvToDisplay.tabConvItem[k].type){
                this.theTabOfUnits.tabClassUnit[j].startPosTo=k;
                trouve=true;
              }
        }
      }
    }
    if (this.theTabOfUnits.fileType===''){
      this.theTabOfUnits.fileType=this.identification.configFitness.fileType.tabOfUnits;
    }
    this.fillDisplayTabUnit('', '', this.FilterTabOfUnitsFrom,'From');
    this.fillDisplayTabUnit('', '', this.FilterTabOfUnitsTo,'To');

  }

  createUnits(){
      var i=0;
      var j=0;
      var k=0;
      var iNew=-1;
      var l=0;
      var NewUnitTab:Array<ClassUnit>=[];
      var trouve = false;
      // find the missing unit couples
      for (i=0; i<this.theTabOfUnits.tabClassUnit.length; i++){
        for (j=0; j<this.theTabOfUnits.tabClassUnit.length; j++){
          if (this.theTabOfUnits.tabClassUnit[i].name!==this.theTabOfUnits.tabClassUnit[j].name && this.theTabOfUnits.tabClassUnit[i].type===this.theTabOfUnits.tabClassUnit[j].type){ // e.g cup-cup to ignore; distance-weight is not accepted
            // search if this combination exists in convToDisplay
            trouve=false;
            for (k=this.theTabOfUnits.tabClassUnit[i].startPosFrom; k<this.ConvToDisplay.tabConvItem.length && trouve===false 
                  && this.theTabOfUnits.tabClassUnit[i].name===this.ConvToDisplay.tabConvItem[k].from; k++){
                    if (this.theTabOfUnits.tabClassUnit[j].name===this.ConvToDisplay.tabConvItem[k].to){
                      trouve=true;
                    }
            }
            if (trouve===false){
              // this couple of units does not exist
              iNew++;
              const cUnit=new ClassUnit;
              NewUnitTab.push(cUnit);
              NewUnitTab[iNew].type=this.theTabOfUnits.tabClassUnit[i].type;
              NewUnitTab[iNew].from=this.theTabOfUnits.tabClassUnit[i].name;
              NewUnitTab[iNew].to=this.theTabOfUnits.tabClassUnit[j].name;
              NewUnitTab[iNew].startPosFrom=this.theTabOfUnits.tabClassUnit[i].startPosFrom;
              for (l=0; l<this.theTabOfUnits.tabClassUnit.length && this.theTabOfUnits.tabClassUnit[l].name!==NewUnitTab[iNew].to; l++ ){}
              if (l<this.theTabOfUnits.tabClassUnit.length){
                    NewUnitTab[iNew].startPosTo=this.theTabOfUnits.tabClassUnit[l].startPosFrom;
              } else {console.log('error : this.theTabOfUnits.tabClassUnit[l].name = ' + this.theTabOfUnits.tabClassUnit[l].name + ' not found in table NewUnitTab[].to')}
            }
          }
        }
      }
    // the new table is filled-in
    // needs now to calculate the conversion
  

    for (i=0; i<NewUnitTab.length; i++  ){
  
        trouve=false;
        for (k=NewUnitTab[i].startPosFrom; k<this.ConvToDisplay.tabConvItem.length && trouve===false 
                  && NewUnitTab[i].from===this.ConvToDisplay.tabConvItem[k].from; k++)
            {
            for (j=NewUnitTab[i].startPosTo; j<this.ConvToDisplay.tabConvItem.length && trouve===false 
                      && NewUnitTab[i].to===this.ConvToDisplay.tabConvItem[j].from; j++)
              {
  
                        if (this.ConvToDisplay.tabConvItem[k].to===this.ConvToDisplay.tabConvItem[j].to){
                          trouve=true;
                          NewUnitTab[i].convert=this.ConvToDisplay.tabConvItem[k].valueFromTo*this.ConvToDisplay.tabConvItem[j].valueFromTo;
                        }     
              }      
                    
            }
        if (trouve===false){
          NewUnitTab[i].convert=-1; // this combination seems to be impossible
          console.log ('N/A combination of '+ NewUnitTab[i].from + ' - ' + NewUnitTab[i].to);
        }
  
    }
  // update ConvertUnit and ConvToDisplay
    for (i=0; i<NewUnitTab.length ; i++){
      if (NewUnitTab[i].convert!==-1){
          trouve=false;
          for (j=0; j<this.ConvertUnit.tabConv.length && this.ConvertUnit.tabConv[j].fromUnit!==NewUnitTab[i].from; j++ ){
          }
          if (j<this.ConvertUnit.tabConv.length && this.ConvertUnit.tabConv[j].fromUnit===NewUnitTab[i].from){
              // create a new element
              var SubConv=new ClassSubConv;
              SubConv.toUnit= NewUnitTab[i].to;
              SubConv.value= NewUnitTab[i].convert;
              this.ConvertUnit.tabConv[j].convert.push(SubConv);  
          } else {// create a new ConvertUnit record 
            console.log('develop code to create a new ConvertUnit record')
          }
  
          // create the record of ConvToDisplay
          const thePush=new ConvItem;
          this.ConvToDisplay.tabConvItem.push(thePush);
          this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].from=NewUnitTab[i].from;
          this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].to=NewUnitTab[i].to;
          this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].type=NewUnitTab[i].type;
          this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].valueFromTo=NewUnitTab[i].convert;
          this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].valueFromToDisplay=Number(Number(this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].valueFromTo).toFixed(5));
          this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].firstValue=Number(Number(this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].firstValue).toFixed(5));
          this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].secondValue=Number(Number(this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].secondValue).toFixed(5));
  
        }
      }
    this.ConvToDisplay.tabConvItem.sort((a, b) => (a.from > b.from) ? 1 : -1);
  }
  
  nextPage(){
    this.message='';
    if (this.PageToDisplay[this.PageToDisplay.length-1].refMainTable+this.itemPerPage<=this.ConvToDisplay.tabConvItem.length-1){
      this.Page.fromRow=this.PageToDisplay[this.PageToDisplay.length-1].refMainTable+1; // process to the end of the file
      this.Page.direction=1;
    } else {
      this.Page.fromRow=this.ConvToDisplay.tabConvItem.length-1; // process from the end of the file
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
  
  managePage(){
      this.message='';
      this.PageToDisplay.splice(0,this.PageToDisplay.length);
      var i=this.Page.fromRow;
      var j=0;
      var k=0;
      for (j=0; j<this.itemPerPage && ((this.Page.direction===1 && i<this.ConvToDisplay.tabConvItem.length) || 
                                        (this.Page.direction===-1 && i>0)); j++){
        
        this.trouve=false;
        if (this.doFilter===true ){
          this.trouve=true
          if ( (this.TabFilterType[0]==='' || ( this.TabFilterType[0]!=='' && this.ConvToDisplay.tabConvItem[i].type===this.TabFilterType[0])) && (
            (this.TabFilter[0]!=='' && this.TabFilter[1]!=='' && this.ConvToDisplay.tabConvItem[i].from===this.TabFilter[0] && this.ConvToDisplay.tabConvItem[i].to===this.TabFilter[1]) ||
              (this.TabFilter[0]!=='' && this.TabFilter[1]==='' && this.ConvToDisplay.tabConvItem[i].from===this.TabFilter[0]) || (this.TabFilter[0]==='' && this.TabFilter[1]!=='' && this.ConvToDisplay.tabConvItem[i].to===this.TabFilter[1]))){
            
                  this.trouve=false;
                }
        }
        if (this.trouve===false){
          const thePush=new ConvItem;
          this.PageToDisplay.push(thePush);
          this.PageToDisplay[this.PageToDisplay.length-1]=this.ConvToDisplay.tabConvItem[i];
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
  
  findIds(idString:string){
      this.error_msg='';
      var j=-1;
      for (var i=1; i<idString.length && idString.substring(i,i+1)!=='-'; i++){
      }
      this.myUnit=idString.substring(0,i).trim();
      this.myType=idString.substring(i+1).trim();

    }


  onAction(event:any){ //Filter-{{0}}
    this.findIds(event.target.textContent);
    if (event.target.id.substring(0,10)==='FromNewRow'){
        this.theEvent.target.id='From'; 
        this.theEvent.target.value=this.myUnit;
        this.newRecord.type=this.myType;
        this.inputNewRow(this.theEvent);

    } else if (event.target.id.substring(0,8)==='ToNewRow'){
        this.theEvent.target.id='To'; 
        this.theEvent.target.value=this.myUnit;
        this.newRecord.type=this.myType;
        this.inputNewRow(this.theEvent);
    }  if (event.target.id.substring(0,10)==='FilterFrom'){
        this.theEvent.target.id="FilterFrom";
        this.theEvent.target.value=event.target.textContent;
        this.onFilter(this.theEvent);
    } else if (event.target.id.substring(0,8)==='FilterTo'){
        this.theEvent.target.id="FilterTo";
        this.theEvent.target.value=event.target.textContent;
        this.onFilter(this.theEvent);
    } else {
        this.theEvent.target.value=event.target.textContent.trim();
        this.theEvent.target.id=event.target.id;
        this.ConvertValues(this.theEvent);
    }
    this.closeDialogues();
  }

  ConvertValues(event:any){
    this.messageConvert='';
    var i=0;
    var j=0;
    this.closeDialogues();
    //this.message='ConvertValues() - id = ' + event.target.id + 'target.value = ' + event.target.value;
    if (event.target.id.substring(0,4)==='From'){
      this.findIds(event.target.value);
      this.ValuesToConvert.From=this.myUnit;
      if (this.ValuesToConvert.From!=='' && this.ValuesToConvert.To===''){
        /*
        for (i=0; i<this.theTabOfUnits.tabClassUnit.length && ((this.myType==='' && this.theTabOfUnits.tabClassUnit[i].name.trim()!==this.ValuesToConvert.From.trim() ) ||
               (this.myType!=='' && this.theTabOfUnits.tabClassUnit[i].type.trim()!==this.myType && this.theTabOfUnits.tabClassUnit[i].name.trim()!==this.ValuesToConvert.From.trim())); i++){}
        if (i<this.theTabOfUnits.tabClassUnit.length){
          this.fillDisplayTabUnit(this.theTabOfUnits.tabClassUnit[i].type, '', this.DisplayTabOfUnitsFrom);
          this.fillDisplayTabUnit(this.theTabOfUnits.tabClassUnit[i].type, '', this.DisplayTabOfUnitsTo);
        }
        */
        this.fillDisplayTabUnit(this.myType, '', this.DisplayTabOfUnitsFrom,'From');
        this.fillDisplayTabUnit(this.myType, '', this.DisplayTabOfUnitsTo,'To');

      } else if (this.ValuesToConvert.From==='' && this.ValuesToConvert.To===''){
        this.myType='';
        this.fillDisplayTabUnit(this.myType, '', this.DisplayTabOfUnitsFrom,'From');
        this.fillDisplayTabUnit(this.myType, '', this.DisplayTabOfUnitsTo,'To');

      }
      this.dialogueFromTo[0]=true;
    } else if (event.target.id.substring(0,2)==='To'){
     
      this.findIds(event.target.value);
      this.ValuesToConvert.To=this.myUnit;
      if (this.ValuesToConvert.To!=='' && this.ValuesToConvert.From===''){
        /*
        for (i=0; i<this.theTabOfUnits.tabClassUnit.length && ((this.myType==='' && this.theTabOfUnits.tabClassUnit[i].name!==this.ValuesToConvert.To ) ||
        (this.myType!=='' && this.theTabOfUnits.tabClassUnit[i].type!==this.myType && this.theTabOfUnits.tabClassUnit[i].name!==this.ValuesToConvert.To)); i++){}

        if (i<this.theTabOfUnits.tabClassUnit.length){
          this.fillDisplayTabUnit(this.theTabOfUnits.tabClassUnit[i].type, '', this.DisplayTabOfUnitsFrom);
          this.fillDisplayTabUnit(this.theTabOfUnits.tabClassUnit[i].type, '', this.DisplayTabOfUnitsTo);
        }
        */
        this.fillDisplayTabUnit(this.myType, '', this.DisplayTabOfUnitsFrom,'From');
        this.fillDisplayTabUnit(this.myType, '', this.DisplayTabOfUnitsTo,'To'); 
      } else if (this.ValuesToConvert.From==='' && this.ValuesToConvert.To===''){
        this.myType='';
        this.fillDisplayTabUnit(this.myType, '', this.DisplayTabOfUnitsFrom,'From');
        this.fillDisplayTabUnit(this.myType, '', this.DisplayTabOfUnitsTo,'To');
      }
      this.dialogueFromTo[1]=true;
    } else if (event.target.id.substring(0,9)==='ValueFrom'){
      if (isNaN(event.target.value)===false){
        this.ValuesToConvert.valueFrom=Number(event.target.value);
        this.LastFieldInput="FROM";
      } else { this.messageConvert='Please enter a numeric value'}
    } else if (event.target.id.substring(0,7)==='ValueTo'){
      if (isNaN(event.target.value)===false){
        this.ValuesToConvert.valueTo=Number(event.target.value);
        this.LastFieldInput="TO";
      } else { this.messageConvert='Please enter a numeric value'}
    }else if (event.target.id.substring(0,7)==='Convert'){
      if (this.ValuesToConvert.From==='' && this.ValuesToConvert.From===this.ValuesToConvert.To){
        this.messageConvert='No conversion - units are the same '
      } else {
      //this.message=this.message + ' From ' + this.ValuesToConvert.From + 'valueFrom = ' + this.ValuesToConvert.valueFrom + 
      //  ' To ' + this.ValuesToConvert.To + 'valueTo = ' + this.ValuesToConvert.valueTo + " last field = " +  this.LastFieldInput;
          this.trouve=false;
          for (i=0; i<this.ConvToDisplay.tabConvItem.length && this.trouve===false; i++){
            if (this.ConvToDisplay.tabConvItem[i].from===this.ValuesToConvert.From && this.ConvToDisplay.tabConvItem[i].to===this.ValuesToConvert.To){
              this.trouve=true;  
              if (this.LastFieldInput==='FROM'){
                  this.ValuesToConvert.valueTo=this.ValuesToConvert.valueFrom*this.ConvToDisplay.tabConvItem[i].valueFromTo
                } else {
                  this.ValuesToConvert.valueFrom=this.ValuesToConvert.valueTo*(1/this.ConvToDisplay.tabConvItem[i].valueFromTo);
                }
            }
          }
          if (this.trouve===false){
            this.messageConvert='No conversion found for this combination of units';
          } 
           //this.message=this.message+ ' boolean trouve = ' + this.trouve + ' ## i = ' + i;
           
      }
    }
    if (this.message==='' && this.ValuesToConvert.From!='' && this.ValuesToConvert.From===this.ValuesToConvert.To){
      this.message='No conversion - units are the same '
    } 



  }
  
  CancelConvertValues(){
    this.ValuesToConvert.valueFromTo=0;
    this.ValuesToConvert.From='';
    this.ValuesToConvert.To='';
    this.ValuesToConvert.valueFrom=0;
    this.ValuesToConvert.valueTo=0;
    this.LastFieldInput='';
    this.messageConvert='';
    this.closeDialogues();

    var i=0;
    for (i=0; i<this.maxFilter; i++){
      this.TabFilter[i]='';
    }
    this.fillDisplayTabUnit('','',this.DisplayTabOfUnitsFrom,'From');
    this.fillDisplayTabUnit('','',this.DisplayTabOfUnitsTo,'To');
  }

   arrowAction(event:any){
      if (event.target.id==='UnitType'){
          this.displayUnitType=true;
      } else {
    
        this.TabDialogue[this.PreviousDialogue]=false;
        this.PreviousDialogue=event.target.id.substring(5);
        this.TabDialogue[this.PreviousDialogue]=true;
        this.displayToModify=false;
        this.displayToDelete=false;
        this.displayNewRow=false;
  
      }
      
    
    }
   
    DelModAction(event:any){
      this.LogMsgConsole('onDelModAction - event id='+event.target.id+' event value='+event.target.value);
      this.message='';
      this.displayNewRow=false;
      this.displayUnitType=false;
      var i=0;
      var j=0;
      if (event.target.value==='M'){
        this.displayToModify=false;
        this.TabDialogue[this.PreviousDialogue]=false;
        this.PreviousDialogue=event.target.id.substring(5);
        this.TabDialogue[this.PreviousDialogue]=true;
      } else if (event.target.textContent===' Modify ' || event.target.textContent===' Delete '){
        this.TabDialogue[this.PreviousDialogue]=false;
        this.PreviousDialogue=event.target.id.substring(5);
        this.TabDialogue[this.PreviousDialogue]=true;
        this.newRecord.valueFromTo=this.PageToDisplay[this.PreviousDialogue].valueFromTo;
        this.newRecord.From=this.PageToDisplay[this.PreviousDialogue].from;
        this.newRecord.To=this.PageToDisplay[this.PreviousDialogue].to;
        this.newRecord.type=this.PageToDisplay[this.PreviousDialogue].type;
  
        this.fillDisplayTabUnit(this.newRecord.type,'',this.NewRowTabOfUnitsFrom,'From');
        this.fillDisplayTabUnit(this.newRecord.type,'',this.NewRowTabOfUnitsTo,'To');
  
        if (event.target.textContent===' Modify '){this.displayToModify=true; this.tableTitle='Item to modify';}
        else {this.displayToDelete=true;    this.tableTitle='Item to delete';}
        this.scroller.scrollToAnchor('ChangeNewRow');
    
      } else if (event.target.id==='YesDelete'){
        // pop up window to ask for confirmation of deletion 
          this.TabDialogue[this.PreviousDialogue]=false;
          //this.PreviousDialogue=event.target.id.substring(5);
          this.newRecord.valueFromTo=this.PageToDisplay[this.PreviousDialogue].valueFromTo;
          this.newRecord.From=this.PageToDisplay[this.PreviousDialogue].from;
          this.newRecord.To=this.PageToDisplay[this.PreviousDialogue].to;
          this.ConvToDisplay.tabConvItem.splice(this.PageToDisplay[this.PreviousDialogue].refMainTable,1);
          this.newRecord.type=this.PageToDisplay[this.PreviousDialogue].type;
    
          // need to delete the To-From as well
          for (i=0; i<this.ConvToDisplay.tabConvItem.length && this.ConvToDisplay.tabConvItem[i].from!==this.newRecord.To; i++){
          }
          if (i<this.ConvToDisplay.tabConvItem.length){
            for (j=i; j<this.ConvToDisplay.tabConvItem.length &&  this.ConvToDisplay.tabConvItem[j].from===this.newRecord.To && this.ConvToDisplay.tabConvItem[j].to!==this.newRecord.From; j++){
            }
            
            if (this.ConvToDisplay.tabConvItem[j].from===this.newRecord.To && this.ConvToDisplay.tabConvItem[j].to===this.newRecord.From){
              this.ConvToDisplay.tabConvItem.splice(j,1);
            }
          }
          this.sortTabUnits(); // need to rebuild TabOfUnits

          this.Page.direction=1;
          this.Page.fromRow=0;
          this.managePage();
          this.CancelNewRow();
        
      } else if (event.target.textContent===' Cancel '){
        this.displayToModify=false;
        this.TabDialogue[this.PreviousDialogue]=false;
    
      } else if (event.target.id==='UpdateChanges'){
        this.PageToDisplay[this.PreviousDialogue].valueFromTo=this.newRecord.valueFromTo;
        this.PageToDisplay[this.PreviousDialogue].valueFromToDisplay=Number(this.newRecord.valueFromTo.toFixed(5));
        this.PageToDisplay[this.PreviousDialogue].from=this.newRecord.From;
        this.PageToDisplay[this.PreviousDialogue].to=this.newRecord.To;
        this.PageToDisplay[this.PreviousDialogue].type=this.newRecord.type;
        this.ConvToDisplay.tabConvItem[this.PageToDisplay[this.PreviousDialogue].refMainTable].valueFromTo=Number(this.newRecord.valueFromTo.toFixed(5));
        this.ConvToDisplay.tabConvItem[this.PageToDisplay[this.PreviousDialogue].refMainTable].valueFromTo=this.newRecord.valueFromTo;
        this.ConvToDisplay.tabConvItem[this.PageToDisplay[this.PreviousDialogue].refMainTable].from=this.newRecord.From;
        this.ConvToDisplay.tabConvItem[this.PageToDisplay[this.PreviousDialogue].refMainTable].to=this.newRecord.To;
        this.ConvToDisplay.tabConvItem[this.PageToDisplay[this.PreviousDialogue].refMainTable].type=this.newRecord.type;
        this.ConvToDisplay.tabConvItem[this.PageToDisplay[this.PreviousDialogue].refMainTable].firstValue=1;
        this.ConvToDisplay.tabConvItem[this.PageToDisplay[this.PreviousDialogue].refMainTable].firstValueDisplay=1;
        this.ConvToDisplay.tabConvItem[this.PageToDisplay[this.PreviousDialogue].refMainTable].secondValue=this.newRecord.valueFromTo;
        this.ConvToDisplay.tabConvItem[this.PageToDisplay[this.PreviousDialogue].refMainTable].secondValueDisplay=Number(this.newRecord.valueFromTo.toFixed(5));
        this.PageToDisplay[this.PreviousDialogue].firstValue=1;
        this.PageToDisplay[this.PreviousDialogue].firstValueDisplay=1;
        this.PageToDisplay[this.PreviousDialogue].secondValue=this.newRecord.valueFromTo;
        this.PageToDisplay[this.PreviousDialogue].secondValueDisplay=Number(this.newRecord.valueFromTo.toFixed(5));
        for (i=0; i<this.ConvToDisplay.tabConvItem.length && this.ConvToDisplay.tabConvItem[i].from!==this.newRecord.To; i++){
        }
        if (i<this.ConvToDisplay.tabConvItem.length){
          for (j=i; j<this.ConvToDisplay.tabConvItem.length &&  this.ConvToDisplay.tabConvItem[j].from===this.newRecord.To && this.ConvToDisplay.tabConvItem[j].to!==this.newRecord.From; j++){
          }
          
          if (this.ConvToDisplay.tabConvItem[j].from===this.newRecord.To && this.ConvToDisplay.tabConvItem[j].to===this.newRecord.From){
            this.ConvToDisplay.tabConvItem[j].valueFromTo=Number(Number(1/this.newRecord.valueFromTo).toFixed(10));
            this.ConvToDisplay.tabConvItem[j].valueFromToDisplay=Number(this.ConvToDisplay.tabConvItem[j].valueFromTo.toFixed(5));
            this.ConvToDisplay.tabConvItem[j].from=this.newRecord.To;
            this.ConvToDisplay.tabConvItem[j].to=this.newRecord.From;
            this.ConvToDisplay.tabConvItem[j].type=this.newRecord.type;
            this.ConvToDisplay.tabConvItem[j].firstValue=1;
            this.ConvToDisplay.tabConvItem[j].firstValueDisplay=1;
            this.ConvToDisplay.tabConvItem[j].secondValue=Number(Number(1/this.newRecord.valueFromTo).toFixed(10));
            this.ConvToDisplay.tabConvItem[j].secondValueDisplay=Number(this.ConvToDisplay.tabConvItem[j].secondValue.toFixed(5));
          }
        }
        for (i=0; i<this.PageToDisplay.length && this.PageToDisplay[i].from!==this.newRecord.To; i++){
          }
        if (i<this.PageToDisplay.length){
            for (j=i; j<this.PageToDisplay.length &&  this.PageToDisplay[j].from===this.newRecord.To && this.PageToDisplay[j].to!==this.newRecord.From; j++){
            }
            
            if (this.PageToDisplay[j].from===this.newRecord.To && this.PageToDisplay[j].to===this.newRecord.From){
                
                this.PageToDisplay[j].valueFromTo=1/this.newRecord.valueFromTo;
                this.PageToDisplay[j].valueFromToDisplay=Number(Number(1/this.newRecord.valueFromTo).toFixed(10));
                this.PageToDisplay[j].from=this.newRecord.To;
                this.PageToDisplay[j].to=this.newRecord.From;
                this.PageToDisplay[j].type=this.newRecord.type;
                this.PageToDisplay[j].firstValue=1;
                this.PageToDisplay[i].firstValueDisplay=1;
                this.PageToDisplay[j].secondValue=Number(Number(1/this.newRecord.valueFromTo).toFixed(10));
                this.PageToDisplay[j].secondValueDisplay=Number(this.PageToDisplay[j].secondValue.toFixed(5));
            }
        }
        this.TabDialogue[this.PreviousDialogue]=false;
        this.displayToModify=false;
      }
    }
    
  CancelAction(){
      this.TabDialogue[this.PreviousDialogue]=false;
      this.closeDialogues();
      this.message='';
      this.CancelNewRow();
    }
  inputValue(event:any){
      this.message='';
      var i=0;
      var idRecord=0;
        if (event.target.id.substring(0,11)==='valueFromTo'){
          if (isNaN(event.target.value)===false){
            idRecord=event.target.id.substring(12);
            this.PageToDisplay[idRecord].valueFromTo=Number(event.target.value);
             this.ConvToDisplay.tabConvItem[this.PageToDisplay[idRecord].refMainTable].valueFromTo=Number(event.target.value);
          }
        } else if (event.target.id.substring(0,9)==='valueFrom'){
            if (isNaN(event.target.value)===false){
              idRecord=event.target.id.substring(10);
              this.PageToDisplay[idRecord].firstValue=Number(event.target.value);
              this.ConvToDisplay.tabConvItem[this.PageToDisplay[idRecord].refMainTable].firstValue=Number(event.target.value);
              this.PageToDisplay[idRecord].secondValue=this.ConvToDisplay.tabConvItem[idRecord].firstValue*this.ConvToDisplay.tabConvItem[idRecord].valueFromTo;    
              this.ConvToDisplay.tabConvItem[this.PageToDisplay[idRecord].refMainTable].secondValue=this.PageToDisplay[idRecord].firstValue*this.PageToDisplay[idRecord].valueFromTo;    
              }
          } else if (event.target.id.substring(0,7)==='valueTo'){
            if (isNaN(event.target.value)===false){
              idRecord=event.target.id.substring(8);
              this.PageToDisplay[event.target.id.substring(8)].secondValue=Number(event.target.value);
              this.ConvToDisplay.tabConvItem[this.PageToDisplay[idRecord].refMainTable].secondValue=Number(event.target.value);
              if (this.PageToDisplay[idRecord].valueFromTo!==0){
                this.PageToDisplay[idRecord].firstValue=this.PageToDisplay[idRecord].secondValue/this.PageToDisplay[idRecord].valueFromTo;
                this.ConvToDisplay.tabConvItem[this.PageToDisplay[idRecord].refMainTable].firstValue=this.PageToDisplay[idRecord].secondValue/this.PageToDisplay[idRecord].valueFromTo;
              }
           }
        }
        this.PageToDisplay[idRecord].firstValueDisplay=Number(this.PageToDisplay[idRecord].firstValue.toFixed(5));
        this.PageToDisplay[idRecord].secondValueDisplay=Number(this.PageToDisplay[idRecord].secondValue.toFixed(5));
        this.PageToDisplay[idRecord].valueFromTo=Number(this.PageToDisplay[idRecord].valueFromTo.toFixed(5));
        this.ConvToDisplay.tabConvItem[this.PageToDisplay[idRecord].refMainTable].firstValue=this.PageToDisplay[idRecord].firstValueDisplay;
        this.ConvToDisplay.tabConvItem[this.PageToDisplay[idRecord].refMainTable].secondValue=this.PageToDisplay[idRecord].secondValueDisplay;
        this.ConvToDisplay.tabConvItem[this.PageToDisplay[idRecord].refMainTable].valueFromTo=this.PageToDisplay[idRecord].valueFromTo;
      }
  
    onFilter(event:any){
       var i= 0;
       var field='';
       this.closeDialogues();
      //this.LogMsgConsole('onFilter HEALTH.TS Converter ===== Device ' + navigator.userAgent + '======');
      this.message='';
      if (event.target.id!==""){
        this.findIds(event.target.value);
        if (event.target.id.substring(0,10)==='FilterFrom' ){
          this.dialogueFromTo[4]=true;
          if (event.target.value!==""){ // data has been input

         
          this.TabFilter[0]=this.myUnit;
          this.doFilter=true;
          //for (i=0; i<this.theTabOfUnits.tabClassUnit.length && event.target.value.toLowerCase()!==this.theTabOfUnits.tabClassUnit[i].name; i++){}
          for (i=0; i<this.theTabOfUnits.tabClassUnit.length && ((this.myType==='' && this.theTabOfUnits.tabClassUnit[i].name!==this.myUnit ) ||
          (this.myType!=='' && (this.theTabOfUnits.tabClassUnit[i].type!==this.myType || this.theTabOfUnits.tabClassUnit[i].name!==this.myUnit))); i++){}

          if (i<this.theTabOfUnits.tabClassUnit.length){
            if ((this.TabFilter[0]!=='' && this.TabFilter[1]==='') || (this.TabFilter[0]==='' && this.TabFilter[1]!=='')){

              this.fillDisplayTabUnit(this.theTabOfUnits.tabClassUnit[i].type, '', this.FilterTabOfUnitsFrom,'From');
              this.fillDisplayTabUnit(this.theTabOfUnits.tabClassUnit[i].type, '', this.FilterTabOfUnitsTo,'To');
    
            }
            this.TabFilterType[0]=this.theTabOfUnits.tabClassUnit[i].type;
            // unit exists; trigger the filtering
            this.Page.fromRow=0; // process from the beginning of the file
            this.Page.direction=1;
            this.managePage();
          }

        }
        this.styleDataListFromOptions=getStyleDropDownBox(this.dataList.heightOptions, this.dataList.widthOptions, 100, 6, this.dataList.scrollY);
  
        } else if (event.target.id.substring(0,8)==='FilterTo'){
          this.dialogueFromTo[5]=true;
          if (event.target.value!==""){

          
            this.TabFilter[1]=this.myUnit;;
            if (this.TabFilter[0]!=='' || this.TabFilter[1]!==''){
              this.doFilter=true;
              if (this.TabFilter[0]!==''){field=this.TabFilter[0]}
              else {field=this.TabFilter[1]}
              for (i=0; i<this.theTabOfUnits.tabClassUnit.length && field!==this.theTabOfUnits.tabClassUnit[i].name; i++){
              }
              if (i<this.theTabOfUnits.tabClassUnit.length){
                // unit exists; trigger the filtering
                this.Page.fromRow=0; // process from the beginning of the file
                if ((this.TabFilter[0]!=='' && this.TabFilter[1]==='') || (this.TabFilter[0]==='' && this.TabFilter[1]!=='')){

                  this.fillDisplayTabUnit(this.theTabOfUnits.tabClassUnit[i].type, '', this.FilterTabOfUnitsFrom,'From');
                  this.fillDisplayTabUnit(this.theTabOfUnits.tabClassUnit[i].type, '', this.FilterTabOfUnitsTo,'To');
                  
                }
                this.Page.direction=1;
                this.managePage();
              }
              }
            else { 
              this.fillDisplayTabUnit('', '', this.FilterTabOfUnitsFrom,'From');
              this.fillDisplayTabUnit('', '', this.FilterTabOfUnitsTo,'To');
              this.doFilter=false;
              this.Page.fromRow=0; // process from the beginning of the file
              this.Page.direction=1;
              this.managePage();
             
            }
          } 
          this.styleDataListToOptions=getStyleDropDownBox(this.dataList.heightOptions, this.dataList.widthOptions, 90, 5, this.dataList.scrollY);
        }
      }
    }
  
  cancelFilter(){
      var i=0;
      this.closeDialogues();
      for (i=0; i<this.TabFilter.length; i++){
          this.TabFilter[i]='';
        }
        this.fillDisplayTabUnit('', '', this.FilterTabOfUnitsFrom,'From');
        this.fillDisplayTabUnit('', '', this.FilterTabOfUnitsTo,'To');
        this.doFilter=false;
        this.Page.fromRow=0; // process from the beginning of the file
        this.Page.direction=1;
        this.managePage();
    }
  tableTitle:string='';

  addRow(){
    this.error_msg='';
    this.displayNewRow=true;
    this.displayToModify=false;
    this.displayUnitType=false;
    this.message='';
    this.error_msg='';
    this.tableTitle='New Row';
    this.fillDisplayTabUnit('','',this.NewRowTabOfUnitsFrom,'From');
    this.fillDisplayTabUnit('','',this.NewRowTabOfUnitsTo,'To');
    this.scroller.scrollToAnchor('ChangeNewRow');
  }
  
  closeDialogues(){
    for (var i=0; i< this.dialogueFromTo.length; i++){
      this.dialogueFromTo[i]=false;
    }
  }

  inputNewRow(event:any){
    var i=0; 
    var j=0;
    this.message='';
    this.error_msg='';
    this.closeDialogues();
    if (event.target.id==='FromTo'){
      if (isNaN(event.target.value)===false){
          this.newRecord.valueFromTo=Number(event.target.value);
        } else {this.error_msg='Enter a numeric value';}
    } else   if (event.target.id==='From'){
      this.newRecord.From=event.target.value.toLowerCase();
      this.dialogueFromTo[2]=true;
      if (this.newRecord.From!=='' && this.newRecord.From===this.newRecord.To){
        this.message=' Cannot be created as units are the same';
      } else 
      if (this.newRecord.From!=='' && this.newRecord.To==='' ){
          if (this.newRecord.type===''){
            for (i=0; i<this.theTabOfUnits.tabClassUnit.length && this.theTabOfUnits.tabClassUnit[i].name!==this.newRecord.From; i++){}
            if (i<this.theTabOfUnits.tabClassUnit.length){
              this.newRecord.type=this.theTabOfUnits.tabClassUnit[i].type;
            }
          }
          this.fillDisplayTabUnit(this.newRecord.type, '', this.NewRowTabOfUnitsFrom,'From');
          this.fillDisplayTabUnit(this.newRecord.type, '', this.NewRowTabOfUnitsTo,'To');
        
      } 
      this.styleDataListFromOptions=getStyleDropDownBox(this.dataList.heightOptions, this.dataList.widthOptions, 0, 0, this.dataList.scrollY);


    } else   if (event.target.id==='To'){
      this.dialogueFromTo[3]=true;
      this.newRecord.To=event.target.value.toLowerCase();
      if (this.newRecord.From!=='' && this.newRecord.From===this.newRecord.To){
        this.message=' Cannot be created as units are the same';
      } else 
      if (this.newRecord.From==='' && this.newRecord.To!==''  ){
        if (this.newRecord.type===''){
          for (i=0; i<this.theTabOfUnits.tabClassUnit.length && this.theTabOfUnits.tabClassUnit[i].name!==this.newRecord.To; i++){}
          if (i<this.theTabOfUnits.tabClassUnit.length){
            this.newRecord.type=this.theTabOfUnits.tabClassUnit[i].type;
          }
        }
        
          this.fillDisplayTabUnit(this.newRecord.type, '', this.NewRowTabOfUnitsFrom,'From');
          this.fillDisplayTabUnit(this.newRecord.type, '', this.NewRowTabOfUnitsTo,'To');
        
      } 
      this.styleDataListToOptions=getStyleDropDownBox(this.dataList.heightOptions, this.dataList.widthOptions, 0, 0, this.dataList.scrollY);

    } else   if (event.target.id.substring(0,8)==='UnitType'){
          if (event.target.textContent!==' Cancel '){
            this.newRecord.type=event.target.textContent.substring(1,2); 
            if (this.newRecord.To==='' && this.newRecord.From===''){
              this.fillDisplayTabUnit(this.newRecord.type, '', this.NewRowTabOfUnitsFrom,'From');
              this.fillDisplayTabUnit(this.newRecord.type, '', this.NewRowTabOfUnitsTo,'To');
            }
          }
      this.displayUnitType=false;
    } else   if (event.target.id==='SaveNewRow'){
      if (this.newRecord.From==='' || this.newRecord.To==='' || this.newRecord.type===''|| this.newRecord.valueFromTo===0){
        this.error_msg="all fields are mandatory";
      } else {
        // search if this combination already exist
          for (i=0; i<this.ConvToDisplay.tabConvItem.length && (this.ConvToDisplay.tabConvItem[i].from!==this.newRecord.From || this.ConvToDisplay.tabConvItem[i].type!==this.newRecord.type); i++){
          }
          if (i<this.ConvToDisplay.tabConvItem.length){
            for (j=i; j<this.ConvToDisplay.tabConvItem.length && this.ConvToDisplay.tabConvItem[i].from===this.newRecord.From && (this.ConvToDisplay.tabConvItem[j].to!==this.newRecord.To || this.ConvToDisplay.tabConvItem[j].type!==this.newRecord.type); j++){
            } 
          }
          if (i<this.ConvToDisplay.tabConvItem.length && j<this.ConvToDisplay.tabConvItem.length){
              this.error_msg='This combination already exists';
          } else {
              const thePush=new ConvItem;
              this.ConvToDisplay.tabConvItem.push(thePush);
              this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].valueFromTo=Number(this.newRecord.valueFromTo);
              this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].from=this.newRecord.From;
              this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].to=this.newRecord.To;
              this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].type=this.newRecord.type;
              this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].firstValue=1;
              this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].secondValue=Number(this.newRecord.valueFromTo);
      
              this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].valueFromToDisplay=Number(Number(this.newRecord.valueFromTo).toFixed(5));
              this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].firstValueDisplay=1;
              this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].secondValueDisplay=Number(Number(this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].secondValue).toFixed(5));
            
              const newPush=new ConvItem;
              this.ConvToDisplay.tabConvItem.push(newPush);
              this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].valueFromTo=1/this.newRecord.valueFromTo;
              this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].from=this.newRecord.To;
              this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].to=this.newRecord.From;
              this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].type=this.newRecord.type;
              this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].firstValue=1;
              this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].secondValue=1/this.newRecord.valueFromTo;
      
              this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].valueFromToDisplay=Number(Number(1/this.newRecord.valueFromTo).toFixed(5));
              this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].firstValueDisplay=1;
              this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].secondValueDisplay=Number(Number(this.ConvToDisplay.tabConvItem[this.ConvToDisplay.tabConvItem.length-1].secondValue).toFixed(5));
            
            
              this.sortTabUnits();
              this.Page.direction=1;
              this.Page.fromRow=0;
              this.managePage();
              this.CancelNewRow();
          }
      }
    }
  }
  
  CancelNewRow(){
    this.closeDialogues();
    this.newRecord.valueFromTo=0;
    this.newRecord.From='';
    this.newRecord.To='';
    this.newRecord.type='';
    this.displayNewRow=false;
    this.displayUnitType=false;
    this.displayToModify=false;
    this.displayToDelete=false;
    this.fillDisplayTabUnit('', '', this.FilterTabOfUnitsFrom,'From');
    this.fillDisplayTabUnit('', '', this.FilterTabOfUnitsTo,'To');
  }
  
  
  SaveConvert(){
    // update the confirguration file with all the data
    var i=0;
    var j=0;
    var k=0;
    var iLast=0;
    var ofUnit=0;
      
    this.ConvertUnit.tabConv.splice(0,this.ConvertUnit.tabConv.length);
    this.ConvToDisplay.tabConvItem.sort((a, b) => (a.type > b.type) ? 1 : -1);
    //for (ofUnit=0; ofUnit<this.TabUnitType.length-1; ofUnit++){
      for (k=0; k<this.theTabOfUnits.tabClassUnit.length; k++){
        const Conv=new ClassConv;
        this.ConvertUnit.tabConv.push(Conv);
        this.ConvertUnit.tabConv[this.ConvertUnit.tabConv.length-1].fromUnit=this.theTabOfUnits.tabClassUnit[k].name;
        this.ConvertUnit.tabConv[this.ConvertUnit.tabConv.length-1].type=this.theTabOfUnits.tabClassUnit[k].type;
        for (i=0; i<this.ConvToDisplay.tabConvItem.length; i++){
            if (this.ConvToDisplay.tabConvItem[i].from===this.theTabOfUnits.tabClassUnit[k].name
              && this.ConvToDisplay.tabConvItem[i].type===this.theTabOfUnits.tabClassUnit[k].type){
                var SubConv=new ClassSubConv;
                SubConv.toUnit= this.ConvToDisplay.tabConvItem[i].to;
                SubConv.value= this.ConvToDisplay.tabConvItem[i].valueFromTo;
                this.ConvertUnit.tabConv[this.ConvertUnit.tabConv.length-1].convert.push(SubConv);   
            }
            
        }
      }
   // }
    if (this.ConvToDisplay.fileType===''){
        this.ConvToDisplay.fileType=this.identification.configFitness.fileType.convToDisplay;
      }
    if (this.WeightRefTable.fileType===''){
        this.WeightRefTable.fileType=this.identification.configFitness.fileType.weightReference;
      }
    if (this.ConvertUnit.fileType===''){
        this.ConvertUnit.fileType=this.identification.configFitness.fileType.convertUnit;
      }
    if (this.theTabOfUnits.fileType===''){
        this.theTabOfUnits.fileType=this.identification.configFitness.fileType.tabOfUnits;
      }
    this.SaveNewRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.convertUnit, this.ConvertUnit,0);
    this.SaveNewRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.convToDisplay, this.ConvToDisplay,1);
    this.SaveNewRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.tabOfUnits, this.theTabOfUnits,2);
    this.SaveNewRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.weightReference, this.WeightRefTable,3);
   
  }
  
  CancelConvert(){
      this.ConvToDisplay.tabConvItem.splice(0,this.ConvToDisplay.tabConvItem.length);
      var i=0;
      for (i=0; i<this.maxFilter; i++){
        this.TabFilter[i]='';
      }
      this.doFilter=false;
      this.Page.fromRow=0; // process from the beginning of the file
      this.Page.direction=1;

      this.ManageConvert();
      this.fillDisplayTabUnit('', '', this.FilterTabOfUnitsFrom,'From');
      this.fillDisplayTabUnit('', '', this.FilterTabOfUnitsTo,'To');
    }
  
    GetRecord(Bucket:string,GoogleObject:string, iWait:number){
  
      this.EventHTTPReceived[iWait]=false;
      this.NbWaitHTTP++;
      this.waitHTTP(this.TabLoop[iWait],30000,iWait);
    
      this.ManageGoogleService.getContentObject(this.configServer, Bucket, GoogleObject )
                .subscribe((data ) => {
                    this.EventHTTPReceived[iWait]=true;
                    if (GoogleObject=== this.identification.configFitness.files.tabOfUnits){ // 'ConvertTabOfUnits.json'){
                      this.theTabOfUnits=data;

                      this.returnFile.emit(this.theTabOfUnits);
                      if (this.ConvToDisplay.tabConvItem.length!==0){this.sortTabUnits()}

                    } else if (GoogleObject===this.identification.configFitness.files.convToDisplay) {//'ConvToDisplay.json'){
                      this.ConvToDisplay=data;
                      if (this.ConvToDisplay.fileType===''){
                        this.ConvToDisplay.fileType=this.identification.configFitness.fileType.convToDisplay;
                      }
                      this.returnFile.emit(this.ConvToDisplay);
                      if (this.theTabOfUnits.tabClassUnit.length!==0){this.sortTabUnits(); }
                    } else if (GoogleObject===this.identification.configFitness.files.convertUnit) {//'ConvertUnit.json'){
                      this.ConvertUnit=data;
                      if (this.ConvertUnit.fileType===''){
                        this.ConvertUnit.fileType=this.identification.configFitness.fileType.convertUnit;
                      }
                      this.returnFile.emit(this.ConvertUnit);
                      this.ManageConvert();

                    } else if (GoogleObject===this.identification.configFitness.files.weightReference ){
                      this.WeightRefTable=data;
                      if (this.WeightRefTable.fileType===''){
                        this.WeightRefTable.fileType=this.identification.configFitness.fileType.weightReference;
                      }
                      this.returnFile.emit(this.WeightRefTable);
                    }

                  },
                  error_handler => {
                    this.EventHTTPReceived[iWait]=true;
                    if (GoogleObject===this.identification.configFitness.files.convToDisplay){
                      
  
                    } else if (GoogleObject===this.identification.configFitness.files.tabOfUnits){
                      
                    } else if (GoogleObject===this.identification.configFitness.files.convertUnit){
                      
                      
                    } 
                } 
          )
      }
  

    HealthData:string='';
    SaveNewRecord(GoogleBucket:string, GoogleObject:string, TabToSave:any,iWait:number){
      var file= new File([JSON.stringify(TabToSave)],GoogleObject, {type: 'application/json'});

      if (GoogleObject==='ConsoleLog.json'){
        const myTime=new Date();
        GoogleObject='ConsoleLog.json-'+ myTime.toString().substring(4,21);
        file=new File ([JSON.stringify(this.myConsole)],GoogleObject, {type: 'application/json'});
      } 
      this.ManageGoogleService.uploadObject(this.configServer, GoogleBucket, file )
        .subscribe(res => {
              if (res.type===4){
                this.message='File "'+ GoogleObject +'" is successfully stored in the cloud';
                this.returnFile.emit(TabToSave);
              }
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
      this.SaveNewRecord('logconsole','ConsoleLog.json', this.myLogConsole,4);
      this.message='Saving of LogConsole';
    }
    this.SaveConsoleFinished=false;
  
    this.myLogConsole=true;
    msginLogConsole(msg, this.myConsole,this.myLogConsole, this.SaveConsoleFinished,this.HTTP_Address, this.type);
    
    }
  
  }
