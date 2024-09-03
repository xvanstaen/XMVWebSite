import { Component, OnInit , Input, Output, HostListener,  HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
  
import { DatePipe, formatDate } from '@angular/common'; 

import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { Observable } from 'rxjs';

import { BucketList, Bucket_List_Info} from '../../JsonServerClass';

// configServer is needed to use ManageGoogleService
// it is stored in MongoDB and accessed via ManageMongoDBService
import { configServer, LoginIdentif, classtheEvent} from '../../JsonServerClass';
import {classPosDiv, getPosDiv} from '../../getPosDiv';
import { environment } from 'src/environments/environment';
import {manage_input} from '../../manageinput';
import {eventoutput, thedateformat} from '../../apt_code_name';

import { msgConsole } from '../../JsonServerClass';
import {msginLogConsole} from '../../consoleLog'

import {mainClassCaloriesFat, ClassCaloriesFat, ClassItem} from '../ClassHealthCalories'

import {ClassSubConv, mainConvItem, mainRecordConvert, mainClassUnit} from '../../ClassConverter'
import {mainClassConv, ClassConv, ClassUnit, ConvItem, recordConvert} from '../../ClassConverter'
import { classFileSystem, classAccessFile , classReturnDataFS, classHeaderReturnDataFS} from '../../classFileSystem';
import {classConfCaloriesFat} from '../classConfHTMLTableAll';

import { ManageMongoDBService } from 'src/app/CloudServices/ManageMongoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import {AccessConfigService} from 'src/app/CloudServices/access-config.service';
import { fnAddTime, convertDate, strDateTime, fnCheckTimeOut, defineMyDate, formatDateInSeconds, formatDateInMilliSeconds, findIds } from '../../MyStdFunctions';
import { drawNumbers, drawHourHand, drawMinuteHand, drawSecondHand, classPosSizeClock} from '../../clockFunctions'


@Component({
  selector: 'app-calories-fat',
  templateUrl: './calories-fat.component.html',
  styleUrls: ['./calories-fat.component.css']
})
export class CaloriesFatComponent implements OnInit {

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageMongoDBService: ManageMongoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    @Inject(LOCALE_ID) private locale: string,
    ) { }

  @Input() configServer = new configServer;
  @Input() identification= new LoginIdentif;

  @Input() ConfigCaloriesFat=new mainClassCaloriesFat;
  @Input() inFileRecipe=new mainClassCaloriesFat;
  @Input() HTMLCaloriesFat=new classConfCaloriesFat;
  @Input() actionCalFat:number=0;
  @Input() actionRecipe:number=0;
  //@Input() tabLock= new classAccessFile; //.lock ++> 0=unlocked; 1=locked by user; 2=locked by other user; 3=must be checked;
  @Input() tabLock: Array<classAccessFile> = [];
  @Input() calFatFileRetrieved:number=0;
  @Input() recipeFileRetrieved:number=0;

  // @Input() saveCalFatMsg:string="";
  // @Input() posDivCalFat= new classPosDiv;

  @Input() convToDisplay=new mainConvItem;

  @Input() returnDataFSCalFat = new classHeaderReturnDataFS;
  @Input() returnDataFSRecipe = new classHeaderReturnDataFS;
  @Input() resultCheckLimitCalFat:number =0;
  @Input() statusSaveFn:any;
  @Input() callSaveFunctionCalFat:number=0;
  @Input() triggerCheckToLimit:number=7000;
          
  //@Output() myEmit= new EventEmitter<any>();
  //@Output() myEmitRecipe= new EventEmitter<any>();
  @Output() checkLockLimit= new EventEmitter<any>();
  @Output() processSave= new EventEmitter<any>();
  @Output() retrieveRecord = new EventEmitter<any>();
  @Output() unlockFile = new EventEmitter<any>();

  outConfigCaloriesFat=new mainClassCaloriesFat;
  outFileRecipe=new mainClassCaloriesFat;
  secondaryLevelFn:boolean=true;
  openFileAccess:boolean=false;

  //EventHTTPReceived:Array<boolean>=[];

  isSaveConfirmed:boolean=false;
  isSaveRecipeConfirmed:boolean=false;
  isCalFatModified:boolean=false;
  isRecipeModified:boolean=false;
  isSaveFileRecipe:boolean=false;
  isSaveFileCalFat:boolean=false;

  SpecificForm=new FormGroup({
        FileName: new FormControl('', { nonNullable: true }),
        FileNameRecipe: new FormControl('', { nonNullable: true }),
      })

  getScreenWidth: any;
  getScreenHeight: any;
  device_type:string='';

  errorMsg:string='';

  TabOfId:Array<number>=[];    

  filterType:boolean=false;
  filterFood:boolean=false;
  filterRecipe:boolean=false;
  filterRecipeFood:boolean=false;

  // Tables for DROPDOWN
  tabType:Array<any>=[{name:''}];
  tabFood:Array<any>=[{name:''}];
  tabInputType:Array<any>=[];
  //tabInputFood:Array<any>=[];

  tabRecipe:Array<any>=[];
  tabRecipeFood:Array<any>=[];
  tabInputRecipe:Array<any>=[];
  tabInputRecipeFood:Array<any>=[];
  typeAction:Array<string>=['add before', 'add after','delete'];
  TabAction:Array<any>=[{name:'',action:''}];
  TabActionRecipe:Array<any>=[{name:'',action:''}];

  // to open DROPDOWN box 
  dialogueCalFat:Array<boolean>=[false, false,false,false]; // first is for type and second one is for food/ingredient

  selType:string='';
  selFood:string='';
  RecipeSel:string='';
  RecipeSelFood:string='';

  // when value is one then item has been created in this session
  tabNewRecord:Array<any>=[
      { nb:0, // type     
        food:[{nb:0}]
      }
      ] ;

  isDeleteType:boolean=false;
  isDeleteFood:boolean=false;
  isDeleteRecipe:boolean=false;
  isDeleteRecipeFood:boolean=false;

  myAction:string='';
  myType:string='';
      
  onInputAction:string="";

  lastInputAt:string="";

  theEvent = new classtheEvent

  errorTimeOut:string="";
  userActivity:string= "";
  posDeletedItem:number=0;
  posType=585;
  posFood=660;
  nameDeletedItem:string='';

  theHeight:number=0;
 
  RecipetheHeight:number=0;
    
  // get position of pointer/cursor
  mousedown:boolean=false;
  selectedPosition ={ 
    x: 0,
    y: 0} ;

    
  titleHeight:number=0;

  returnEmit={
    saveAction:'',
    saveCode:''
  }

  inputReadOnly:boolean=true;

  conversion:number=0;

  offsetHeight:number=0;
  offsetLeft:number=0;
  offsetTop:number=0;
  offsetWidth:number=0;
  scrollHeight:number=0;
  scrollTop:number=0;
  sizeBoxRecipeFood:number=0;
  heightItemOptionBox:number=25;

  isRecipeFoodInput:boolean=false;
  checkText:string='';

  posSizeClock=new classPosSizeClock;

@HostListener('window:mouseup', ['$event'])
onMouseUp(event: MouseEvent) {
    this.selectedPosition = { x: event.pageX, y: event.pageY };
    
    //this.getPosDivTable();
    this.posDivTable=getPosDiv("posStartTable");

    // this allows to position the dropdown list where the click occured
    this.posItemAction=Number(event.clientY)-Number(this.posDivTable.ClientRect.Top)+Number(this.titleHeight);
    if (this.posItemAction>this.HTMLCaloriesFat.height/2 ){
      // this allows to position the dropdownlist at the middle of the window and then dropdownlist remains within the scrolling window
      this.posItemAction=this.HTMLCaloriesFat.height/2;
    }
 
  }

  posDivTable= new classPosDiv;
  posDivItem= new classPosDiv;


  getPosItem(item:string){
    var type:string='';
    if (item==='Action'){ type="posAction"} 
    else if (item==='Type'){type="posType" } 
    else if (item==='Food'){type="posFood"}
    this.posDivItem=getPosDiv(type);

  } 
  posItemAction:number=0;

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.getScreenWidth = window.innerWidth ;
    this.getScreenHeight = window.innerHeight;
    }

  ngOnInit(){
  
    if (this.tabLock[1].lock===1){
      this.inputReadOnly=false;
    } else {
      this.inputReadOnly=true;
    }

    this.posDivTable=getPosDiv("posStartTable");

    this.titleHeight=Number(this.HTMLCaloriesFat.title.height.substring(0,this.HTMLCaloriesFat.title.height.indexOf('px')));


    this.onWindowResize();
    this.device_type = navigator.userAgent;
    this.device_type = this.device_type.substring(10, 48);

    //this.EventHTTPReceived[0]=false;
    //this.getRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.convToDisplay,0);

    this.TabAction[0].name='Cancel';
    this.TabAction[0].action='';
    this.TabActionRecipe[0].name='Cancel';
    this.TabActionRecipe[0].action='';
    var itemName='Type';
    
    for (var i=0; i<this.typeAction.length; i++){
        const myAction={name:'',action:''};
        this.TabAction.push(myAction);
        this.TabAction[this.TabAction.length-1].name=itemName;
        this.TabAction[this.TabAction.length-1].action=this.typeAction[i];
        const myActionRec={name:'',action:''};
        this.TabActionRecipe.push(myActionRec);
        this.TabActionRecipe[this.TabActionRecipe.length-1].name='Recipe';
        this.TabActionRecipe[this.TabActionRecipe.length-1].action=this.typeAction[i];
    }

    itemName='Food';
    for (i=0; i<this.typeAction.length; i++){
        const myAction={name:'',action:''};
        this.TabAction.push(myAction);
        this.TabAction[this.TabAction.length-1].name=itemName;
        this.TabAction[this.TabAction.length-1].action=this.typeAction[i];
        const myActionRec={name:'',action:''};
        this.TabActionRecipe.push(myActionRec);
        this.TabActionRecipe[this.TabActionRecipe.length-1].name=itemName;
        this.TabActionRecipe[this.TabActionRecipe.length-1].action=this.typeAction[i];
    }
    
    const myActionRec={name:'Calculate',action:'Total'};
    this.TabActionRecipe.push(myActionRec);

    const myActionRec1={name:'Recipe',action:'Transfer'};
    this.TabActionRecipe.push(myActionRec1);

    const myActionRec2={name:'AllRecipe',action:'reCalculate'};
    this.TabActionRecipe.push(myActionRec2);
    
    this.initialiseFiles('calFat');
    this.initialiseFiles('recipe');
    this.SpecificForm.controls['FileName'].setValue(this.identification.configFitness.files.calories);

    this.posSizeClock.margLeft = 840;
    this.posSizeClock.margTop = -20;
    this.posSizeClock.width = 60;
    this.posSizeClock.height = 60;
    this.posSizeClock.displayAnalog = false;
    this.posSizeClock.displayDigital = true;

    this.lastInputAt = strDateTime();
    this.refDate=new Date();
    this.callTimeToGo();

  }

  isSaveFile:boolean=false;
  isDataModified:boolean=false;
  isUserTimeOut:boolean=false;
  refDate=new Date();
  displaySec:number=0;
  displayMin:number=0;
  displayHour:number=0;
  idAnimation:any;

  timeOutactivity(iWait: number, isDataModified: boolean, isSaveFile: boolean,theAction:string){

      window.cancelAnimationFrame(this.idAnimation);
      this.callTimeToGo();
      this.refDate=new Date();
      this.lastInputAt = strDateTime();

      if (theAction==="only"){
        this.openFileAccess=true;
        this.theEvent.checkLock.action='checkTO';
        this.theEvent.checkLock.iWait=iWait;
        this.theEvent.checkLock.isDataModified=isDataModified;
        this.theEvent.checkLock.isSaveFile=isSaveFile;
        this.theEvent.checkLock.iCheck=true;
        this.theEvent.checkLock.lastInputAt=this.lastInputAt;
        this.theEvent.checkLock.nbCalls++;
        this.triggerCheckToLimit++

        //this.checkLockLimit.emit({iWait:iWait,isDataModified:isDataModified,isSaveFile:isSaveFile, lastInputAt:this.lastInputAt, iCheck:true,nbCalls:0,action:theAction});
      }
      //this.checkLockLimit.emit({iWait:iWait,isDataModified:isDataModified,isSaveFile:isSaveFile, lastInputAt:this.lastInputAt, iCheck:true,nbCalls:0});
    
  }

  callTimeToGo(){
    const currSeconds=this.refDate.getSeconds() ;
    const currMinutes=this.refDate.getMinutes();
    const currHour=this.refDate.getHours();
    const currentDateSec = currHour*3600+currMinutes*60+currSeconds;
    this.timeToGo(currentDateSec,this.configServer.timeoutFileSystem.userTimeOut.hh * 3600 +this.configServer.timeoutFileSystem.userTimeOut.mn * 60 + this.configServer.timeoutFileSystem.userTimeOut.ss);
    
  }

  timeToGo(refDateSec:any, timeOutSec:any){
    // nb of seconds before timeout is reached
    const theDate=new Date();
    const currentDateSec = theDate.getHours()*3600+theDate.getMinutes()*60+theDate.getSeconds();
    const timeSpent = Number(currentDateSec) - Number(refDateSec);
    const timeLeft= timeOutSec - timeSpent;

    if (timeLeft <= 0 && (this.isRecipeModified===true || this.isCalFatModified===true) ){
        this.errorMsg = "your modifications are going to be lost if you don't save them";
        /*
        window.cancelAnimationFrame(this.idAnimation);
        this.isUserTimeOut=true;
        this.unlockFile.emit(1);
        this.isInitComplete = false;
        this.isRecipeModified = false;
        this.isCalFatModified = false;
        */
    } else {
        this.displayHour = Math.floor(timeLeft / 3600);
        const minSec = timeLeft % 3600 ;
        this.displayMin = Math.floor(minSec / 60);
        this.displaySec = minSec % 60 ;
        this.idAnimation=window.requestAnimationFrame(() => this.timeToGo(refDateSec,timeOutSec));
    }
  }

  isInitComplete:boolean=false;

  initialiseFiles(theFunction:string){
    if (theFunction==="calFat"){
      this.outConfigCaloriesFat.tabCaloriesFat.splice(0,this.outConfigCaloriesFat.tabCaloriesFat.length);
      this.outFileRecipe.tabCaloriesFat.splice(this.outFileRecipe.tabCaloriesFat.length);
      if (this.ConfigCaloriesFat.tabCaloriesFat.length>0){
        this.fillConfig(this.outConfigCaloriesFat, this.ConfigCaloriesFat,'Calories');
      } else { 
        this.initOutTab(this.ConfigCaloriesFat,'calories');
      }
      this.initTrackRecord();
    } else if (theFunction==="recipe"){
      if (this.inFileRecipe.tabCaloriesFat.length>0){
        this.fillConfig(this.outFileRecipe, this.inFileRecipe, 'Recipe');
      } else { 
        this.initOutTab(this.outFileRecipe,'Recipe');
      }
    }
    this.isInitComplete=true;
  }

fillConfig(outFile:any,inFile:any, type:string){
  if (type==='Calories'){
    this.tabType.splice(0,this.tabType.length);
    this.tabType.push({name:''});
    this.tabFood.splice(0,this.tabFood.length);
    this.tabFood.push({name:''});

    outFile.tabCaloriesFat.splice(0,outFile.tabCaloriesFat.length);
    outFile.fileType=inFile.fileType;
    for (var i=0; i<inFile.tabCaloriesFat.length; i++){
      const CalFatClass = new ClassCaloriesFat;
      outFile.tabCaloriesFat.push(CalFatClass);
      outFile.tabCaloriesFat[i].Type=inFile.tabCaloriesFat[i].Type;
      this.tabType.push({name:''});
      this.tabType[this.tabType.length-1].name=inFile.tabCaloriesFat[i].Type.toLowerCase().trim();
      for (var j=0; j<inFile.tabCaloriesFat[i].Content.length; j++){
        const itemClass= new ClassItem;
        outFile.tabCaloriesFat[i].Content.push(itemClass);
        this.copyContent(outFile.tabCaloriesFat[i].Content[j], inFile.tabCaloriesFat[i].Content[j]);
        
        this.tabFood.push({name:''});
        this.tabFood[this.tabFood.length-1].name=inFile.tabCaloriesFat[i].Content[j].Name.toLowerCase().trim();
       
        }
    }
    this.tabType.sort((a, b) => (a.name < b.name) ? -1 : 1);
    this.tabFood.sort((a, b) => (a.name < b.name) ? -1 : 1);
    this.tabType[0].name='cancel';
    this.tabFood[0].name='cancel';
   
    } else {
      this.tabRecipe.splice(0,this.tabRecipe.length);
      this.tabRecipe.push({name:''});
      this.tabInputRecipe.splice(0,this.tabRecipe.length);
      this.tabInputRecipe.push({name:''});
      this.tabRecipeFood.splice(0,this.tabFood.length);
      this.tabRecipeFood.push({name:''});
      this.tabInputRecipeFood.splice(0,this.tabFood.length);
      this.tabInputRecipeFood.push({name:''});

      outFile.tabCaloriesFat.splice(0,outFile.tabCaloriesFat.length);
      outFile.fileType=inFile.fileType;
      for (var i=0; i<inFile.tabCaloriesFat.length; i++){
        const CalFatClass = new ClassCaloriesFat;
        outFile.tabCaloriesFat.push(CalFatClass);
        outFile.tabCaloriesFat[i].Type=inFile.tabCaloriesFat[i].Type;
        outFile.tabCaloriesFat[i].Total=inFile.tabCaloriesFat[i].Total;
        this.tabRecipe.push({name:''});
        this.tabRecipe[this.tabRecipe.length-1].name=inFile.tabCaloriesFat[i].Type.toLowerCase().trim();
        this.tabInputRecipe.push({name:''});
        this.tabInputRecipe[this.tabInputRecipe.length-1].name=inFile.tabCaloriesFat[i].Type.toLowerCase().trim();
        for (var j=0; j<inFile.tabCaloriesFat[i].Content.length; j++){
          const itemClass= new ClassItem;
          outFile.tabCaloriesFat[i].Content.push(itemClass);
          this.copyContent(outFile.tabCaloriesFat[i].Content[j], inFile.tabCaloriesFat[i].Content[j]);
          this.tabRecipeFood.push({name:''});
          this.tabRecipeFood[this.tabRecipeFood.length-1].name=inFile.tabCaloriesFat[i].Content[j].Name.toLowerCase().trim();
          this.tabInputRecipeFood.push({name:''});
          this.tabInputRecipeFood[this.tabInputRecipeFood.length-1].name=inFile.tabCaloriesFat[i].Content[j].Name.toLowerCase().trim();
          }
      }
      this.tabRecipe.sort((a, b) => (a.name < b.name) ? -1 : 1);
      this.tabRecipe[0].name='cancel';
      this.tabInputRecipe.sort((a, b) => (a.name < b.name) ? -1 : 1);
      this.tabInputRecipe[0].name='cancel';

      this.tabInputRecipeFood.sort((a, b) => (a.name < b.name) ? -1 : 1);
      this.tabInputRecipeFood[0].name='cancel';
      this.tabRecipeFood.sort((a, b) => (a.name < b.name) ? -1 : 1);
      this.tabRecipeFood[0].name='cancel';
      this.sizeBoxRecipeFood=(this.tabInputRecipeFood.length +1)  * this.heightItemOptionBox;
    }
}

  initTrackRecord(){
  this.tabNewRecord.splice(0, this.tabNewRecord.length);
    for (var i=0; i<this.outConfigCaloriesFat.tabCaloriesFat.length; i++){
      if (this.tabNewRecord.length===0 || i!==0){
        const trackNew={nb:0,food:[{nb:0}]};
        this.tabNewRecord.push(trackNew);
      }
      
      for (var j=0; j<this.outConfigCaloriesFat.tabCaloriesFat[i].Content.length; j++){
          if (this.tabNewRecord[i].food.length ===0 || j!==0){
            const trackNew={nb:0};
            this.tabNewRecord[i].food.push(trackNew);
          }
      }
    }
  }

findAction(idString:string){
  this.errorMsg='';
  var j=-1;
  for (var i=1; i<idString.length && idString.substring(i,i+1)!=='-'; i++){
  }
  this.myType=idString.substring(0,i).trim();
  this.myAction=idString.substring(i+1).trim();
}

onAction(event:any){
  this.lastInputAt = strDateTime();
  
  this.dialogueCalFat[0]=false;
  this.dialogueCalFat[1]=false;
 
  this.errorMsg='';
  this.onInputAction="onAction";
  if (event.currentTarget.id !==''){
    this.theEvent.target.id=event.currentTarget.id;
    this.theEvent.target.value=event.currentTarget.value;
  } else if (event.target.id!==''){
    this.theEvent.target.id=event.target.id;
    this.theEvent.target.value=event.target.value;
  } else if (event.target.textContent!==''){
    this.theEvent.target.id="";
    this.theEvent.target.textContent = event.target.textContent;
  }
  this.timeOutactivity(1,this.isCalFatModified,false,"only");
  
}

onActionA(event:any){
  var iAction=0;
  var trouve=false;
  if (event.currentTarget.id !==''){
      this.theEvent.target.id=event.currentTarget.id;
      this.manageIds(event.currentTarget.id); 
      iAction=Number(event.currentTarget.value);
  } else if (event.target.id!==''){
      this.theEvent.target.id=event.target.id;
      this.manageIds(event.target.id); 
      iAction=Number(event.target.value); 
  } else if (event.target.textContent!==''){
      this.findAction(event.target.textContent);
      this.theEvent.target.id='selAction';
      for (var i=0; i<this.TabAction.length && trouve===false; i++){
          if (this.TabAction[i].name===this.myType && this.TabAction[i].action===this.myAction){
            trouve=true;
            iAction=i;
          }
      }
  } 
  if (this.theEvent.target.id.substring(0,16)==='RecipeOpenAction'){
    this.dialogueCalFat[1]=true;
  } else if (this.theEvent.target.id.substring(0,15)==='RecipeSelAction'){
      if (iAction===0){
        this.isDeleteRecipe=false;
        this.isDeleteRecipeFood=false;    
      } else {
        this.isRecipeModified = true;
        if (this.TabActionRecipe[iAction].name==='Recipe'){
          if (this.TabActionRecipe[iAction].action==='add before'){
              this.createAfterBefore(this.TabOfId[0],'Recipe');
          } else if (this.TabActionRecipe[iAction].action==='add after'){
              this.createAfterBefore(this.TabOfId[0]+1,'Recipe');
          }  else if (this.TabActionRecipe[iAction].action==='delete'){
          if (this.outFileRecipe.tabCaloriesFat.length==1 ){
              this.nameDeletedItem='';
              this.errorMsg='only one item - cannot be deleted';
          } else {
            this.nameDeletedItem='Type item: '+ this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Type;
            this.posDeletedItem=this.posType;
            this.isDeleteRecipe=true;
              }
            } else if (this.TabActionRecipe[iAction].action==='Transfer'){
              this.transferToCalFat(this.TabOfId[0]);
            }
      } else if (this.TabActionRecipe[iAction].name==='Calculate' && this.TabActionRecipe[iAction].action==='Total'){
        this.calculateTotal(this.TabOfId[0]);

      } else if (this.TabActionRecipe[iAction].name==='Food'){
        if (this.TabActionRecipe[iAction].action==='add before'){
          this.createAfterBefore(this.TabOfId[1],'RecipeFood');
        } else if (this.TabActionRecipe[iAction].action==='add after'){
          this.createAfterBefore(this.TabOfId[1]+1,'RecipeFood');
        } else if (this.TabActionRecipe[iAction].action==='delete'){
          if (this.outFileRecipe.tabCaloriesFat.length==1 && this.outFileRecipe.tabCaloriesFat[0].Content.length===1){
            this.nameDeletedItem='';  
            this.errorMsg='only one food item - cannot be deleted';
          } else {
            this.nameDeletedItem='food item: '+ this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Name;
            this.posDeletedItem=this.posFood;
            this.isDeleteRecipeFood=true;
          }
        }
      } else  if (this.TabActionRecipe[iAction].name==='AllRecipe' && this.TabActionRecipe[iAction].action==='reCalculate'){
          this.reCalculateValues();
      }
    }
  } // calFat
    
    else if (this.theEvent.target.id.substring(0,10)==='openAction'){
      this.dialogueCalFat[0]=true;
      this.getPosItem("Action");
    } else  if (this.theEvent.target.id.substring(0,9)==='selAction'){
      if (iAction===0){
        this.isDeleteType=false;
        this.isDeleteFood=false;    
      } else {
        this.isCalFatModified = true;
        if (this.TabAction[iAction].name==='Type'){
          if (this.TabAction[iAction].action==='add before'){
              this.createAfterBefore(this.TabOfId[0],'Type');
          } else if (this.TabAction[iAction].action==='add after'){
              this.createAfterBefore(this.TabOfId[0]+1,'Type');
          } else if (this.TabAction[iAction].action==='delete'){
            if (this.outConfigCaloriesFat.tabCaloriesFat.length==1 ){
              this.nameDeletedItem='';
              this.errorMsg='only one item - cannot be deleted';
          } else {
            this.nameDeletedItem='Type item: '+ this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Type;
            this.posDeletedItem=this.posType;
            this.isDeleteType=true;
              }
          } 
        } else if (this.TabAction[iAction].name==='Food'){
          if (this.TabAction[iAction].action==='add before'){
            this.createAfterBefore(this.TabOfId[1],'Food');
          } else if (this.TabAction[iAction].action==='add after'){
            this.createAfterBefore(this.TabOfId[1]+1,'Food');
          } else if (this.TabAction[iAction].action==='delete'){
            if (this.outConfigCaloriesFat.tabCaloriesFat.length==1 && this.outConfigCaloriesFat.tabCaloriesFat[0].Content.length===1){
              this.nameDeletedItem='';  
              this.errorMsg='only one item - cannot be deleted';
            } else {
              this.nameDeletedItem='food item: '+ this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Name;
              this.posDeletedItem=this.posFood;
              this.isDeleteFood=true;
            }
          } 
        }
      }
    } else if (this.theEvent.target.id.substring(0,6)==='YesDel'){
      if (this.isDeleteType===true){
        this.outConfigCaloriesFat.tabCaloriesFat.splice(this.TabOfId[0],1);
        this.tabNewRecord.splice(this.TabOfId[0],1);
      } if (this.isDeleteFood===true){
        this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Content.splice(this.TabOfId[1],1);
        this.tabNewRecord[this.TabOfId[0]].food.splice(this.TabOfId[1],1);
      }
      this.isDeleteType=false;
      this.isDeleteFood=false;
    } else  if (this.theEvent.target.id.substring(0,5)==='NoDel'){
      this.isDeleteType=false;
      this.isDeleteFood=false;    
    }  else if (this.theEvent.target.id.substring(0,12)==='RecipeYesDel'){
      if (this.isDeleteRecipe===true){
        this.outFileRecipe.tabCaloriesFat.splice(this.TabOfId[0],1);
        // this.tabNewRecord.splice(this.TabOfId[0],1);
      } if (this.isDeleteRecipeFood===true){
        this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content.splice(this.TabOfId[1],1);
        // this.tabNewRecord[this.TabOfId[0]].food.splice(this.TabOfId[1],1);
      }
      this.isDeleteRecipe=false;
      this.isDeleteRecipeFood=false;
    } else  if (this.theEvent.target.id.substring(0,11)==='RecipeNoDel'){
      this.isDeleteRecipe=false;
      this.isDeleteRecipeFood=false;    
    }  
}

createAfterBefore(increment:number, item:string){
  if (item==='Type'){
    const CalFatClass = new ClassCaloriesFat;
    this.outConfigCaloriesFat.tabCaloriesFat.splice(increment,0,CalFatClass);
    const itemClass= new ClassItem;
    this.outConfigCaloriesFat.tabCaloriesFat[increment].Content.push(itemClass);
    const trackNew={nb:1,food:[{nb:1}]};
    this.tabNewRecord.splice(increment,0,trackNew);
  } else if (item==='Food'){
    const itemClass= new ClassItem;
    this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Content.splice(increment,0,itemClass);
    const trackNew={nb:1};
    this.tabNewRecord[this.TabOfId[0]].food.splice(increment,0,trackNew);
  } else if (item==='Recipe'){
    const CalFatClass = new ClassCaloriesFat;
    this.outFileRecipe.tabCaloriesFat.splice(increment,0,CalFatClass);
    const itemClass= new ClassItem;
    this.outFileRecipe.tabCaloriesFat[increment].Content.push(itemClass);

  } else if (item==='RecipeFood'){
    const itemClass= new ClassItem;
    this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content.splice(increment,0,itemClass);
 
  } 
}

initOutTab(inFile:any,type:string){
  const CalFatClass = new ClassCaloriesFat;
  inFile.tabCaloriesFat.push(CalFatClass);
  if (type='calories'){
    inFile.fileType=this.identification.configFitness.fileType.calories;
  } else {
    inFile.fileType=this.identification.fitness.fileType.recipe;
  }
  
  const itemClass= new ClassItem;
  inFile.tabCaloriesFat[inFile.tabCaloriesFat.length-1].Content.push(itemClass);
}

onInput(event:any){
  this.returnEmit.saveAction="";
  if (this.identification.triggerFileSystem==="Yes"){
    this.isCalFatModified = true;
    this.theEvent.target.id=event.target.id;
    this.theEvent.target.value=event.target.value;
    this.onInputAction="onInput";
    this.timeOutactivity(1,true,false,"only");
  } else { this.onInputA(event)}
}

onInputA(event:any){
  this.offsetLeft = event.currentTarget.offsetLeft;
  this.offsetWidth = event.currentTarget.offsetWidth;
  this.tabInputType.splice(0,this.tabInputType.length);
  var iTab:number=0;
  this.errorMsg='';

  this.manageIds(event.target.id);
  if (event.target.id.substring(0,4)==='type'){
    this.getPosItem("Type");
    this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Type=event.target.value.toLowerCase().trim();
    // check if first letters already exists
    iTab=-1;
    for (var i=0; i<this.tabType.length; i++){
      if (this.tabType[i].name.substr(0,event.target.value.trim().length)===event.target.value.toLowerCase().trim()){
        iTab++;
        this.tabInputType[iTab]=this.tabType[i].name.toLowerCase().trim();
      }
    }
  } else if (event.target.id.substring(0,4)==='name'){
    this.getPosItem("Food");
    this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Name=event.target.value.toLowerCase().trim();
  } else if (event.target.id.substring(0,4)==='serv'){
    this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Serving=Number(event.target.value);
  } else if (event.target.id.substring(0,4)==='unit'){
    this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].ServingUnit=event.target.value.toLowerCase().trim();
  } else if (event.target.id.substring(0,4)==='calo'){
    this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Calories=Number(event.target.value);
  } else if (event.target.id.substring(0,4)==='prot'){
    this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Protein=Number(event.target.value);
  } else if (event.target.id.substring(0,4)==='carb'){
    this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Carbs=Number(event.target.value);
  } else if (event.target.id.substring(0,4)==='glyi'){
    this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].GlyIndex=Number(event.target.value);
  } else if (event.target.id.substring(0,4)==='suga'){
    this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Sugar=Number(event.target.value);
  } else if (event.target.id.substring(0,11)==='naturalSuga'){
    this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].naturalSugar=Number(event.target.value);
  } else if (event.target.id.substring(0,9)==='addedSuga'){
    this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].addedSugar=Number(event.target.value);
  } else if (event.target.id.substring(0,4)==='chol'){
    this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Cholesterol=Number(event.target.value);
  } else if (event.target.id.substring(0,4)==='satu'){
    this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Fat.Saturated=Number(event.target.value);
  } else if (event.target.id.substring(0,4)==='tota'){
    this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Fat.Total=Number(event.target.value);
  }
}

reCalculateValues(){
  for (var iRecipe=0; iRecipe<this.outFileRecipe.tabCaloriesFat.length; iRecipe++){
    for (var jRecipe=0; jRecipe<this.outFileRecipe.tabCaloriesFat[iRecipe].Content.length; jRecipe++){
      this.searchFoodCalories(this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Name,iRecipe,jRecipe);
    }
    this.calculateTotal(iRecipe);
    this.iRecipeSave=iRecipe;
    this.transferToCalFatA();
  }
}

searchFoodCalories(foodName:string, iRecipe:number, jRecipe:number){
  var trouve=false;
  if (this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Serving!==0 && 
    this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Name!=='' ){ // && this.EventHTTPReceived[0]===true
      for (var i=0; i<this.outConfigCaloriesFat.tabCaloriesFat.length && trouve===false; i++){
          for (var j=0; j<this.outConfigCaloriesFat.tabCaloriesFat[i].Content.length && trouve===false; j++){
            if (this.outConfigCaloriesFat.tabCaloriesFat[i].Content[j].Name.toLowerCase().trim()===foodName.toLowerCase().trim() ){
              trouve=true;
              const quantity=this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Serving / this.outConfigCaloriesFat.tabCaloriesFat[i].Content[j].Serving;

              this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].ServingUnit=this.outConfigCaloriesFat.tabCaloriesFat[i].Content[j].ServingUnit;
              this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Calories=this.outConfigCaloriesFat.tabCaloriesFat[i].Content[j].Calories * quantity;
              this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Protein=this.outConfigCaloriesFat.tabCaloriesFat[i].Content[j].Protein * quantity;
              this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Carbs=this.outConfigCaloriesFat.tabCaloriesFat[i].Content[j].Carbs * quantity;
              this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Cholesterol=this.outConfigCaloriesFat.tabCaloriesFat[i].Content[j].Cholesterol * quantity;
              this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Sugar=this.outConfigCaloriesFat.tabCaloriesFat[i].Content[j].Sugar * quantity;
              this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].naturalSugar=this.outConfigCaloriesFat.tabCaloriesFat[i].Content[j].naturalSugar * quantity;
              this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].addedSugar=this.outConfigCaloriesFat.tabCaloriesFat[i].Content[j].addedSugar * quantity;
              this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].GlyIndex=this.outConfigCaloriesFat.tabCaloriesFat[i].Content[j].GlyIndex * quantity;
              this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Fat.Saturated=this.outConfigCaloriesFat.tabCaloriesFat[i].Content[j].Fat.Saturated * quantity;
              this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Fat.Total=this.outConfigCaloriesFat.tabCaloriesFat[i].Content[j].Fat.Total * quantity;
            }
          }
      }
  }
}

copyContent(outRecord:any,inRecord:any){
  outRecord.Name=inRecord.Name;
  outRecord.Serving=inRecord.Serving;
  outRecord.ServingUnit=inRecord.ServingUnit;
  outRecord.Calories=inRecord.Calories ;
  outRecord.Protein=inRecord.Protein ;
  outRecord.Carbs=inRecord.Carbs ;
  outRecord.Cholesterol=inRecord.Cholesterol ;
  outRecord.Sugar=inRecord.Sugar ;
  if (inRecord.naturalSugar!==undefined){
    outRecord.naturalSugar=inRecord.naturalSugar ;
    outRecord.addedSugar=inRecord.addedSugar ;
  } else {
    outRecord.naturalSugar=0 ;
    outRecord.addedSugar=0 ;
  }
  outRecord.GlyIndex=inRecord.GlyIndex ;
  outRecord.Fat.Saturated=inRecord.Fat.Saturated;
  outRecord.Fat.Total=inRecord.Fat.Total;
}

calculateTotal( iRecipe:number){
  // eveything is to be converted in grams
  var servingTotal:number=0;
  var jRecipe=0;
  this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Calories=0;
  this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Protein=0;
  this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Carbs=0;
  this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Cholesterol=0;
  this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Sugar=0;
  this.outFileRecipe.tabCaloriesFat[iRecipe].Total.naturalSugar=0;
  this.outFileRecipe.tabCaloriesFat[iRecipe].Total.addedSugar=0;
  this.outFileRecipe.tabCaloriesFat[iRecipe].Total.GlyIndex=0;
  this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Fat.Saturated=0;
  this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Fat.Total=0;
  this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Serving=0;
  this.outFileRecipe.tabCaloriesFat[iRecipe].Total.ServingUnit='gram';
  for (var jRecipe=0; jRecipe<this.outFileRecipe.tabCaloriesFat[iRecipe].Content.length; jRecipe++){
      this.conversion=0;
      if (this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].ServingUnit.toLowerCase().trim()!=='gram'){
        this.convertUnits(this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].ServingUnit.toLowerCase().trim(),'gram');
      }
      if (this.conversion!==0){
        this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Serving=this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Serving + this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Serving * this.conversion;
      } else {
        this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Serving=this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Serving + this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Serving;
      }
      this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Calories=this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Calories +
      this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Calories;
      this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Protein=this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Protein +
      this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Protein;
      this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Carbs=this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Carbs +
      this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Carbs;
      this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Cholesterol=this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Cholesterol +
      this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Cholesterol;
      this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Sugar=this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Sugar +
      this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Sugar;
      this.outFileRecipe.tabCaloriesFat[iRecipe].Total.naturalSugar=this.outFileRecipe.tabCaloriesFat[iRecipe].Total.naturalSugar +
      this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].naturalSugar;
      this.outFileRecipe.tabCaloriesFat[iRecipe].Total.addedSugar=this.outFileRecipe.tabCaloriesFat[iRecipe].Total.addedSugar +
      this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].addedSugar;
      this.outFileRecipe.tabCaloriesFat[iRecipe].Total.GlyIndex=this.outFileRecipe.tabCaloriesFat[iRecipe].Total.GlyIndex +
      this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].GlyIndex;
      this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Fat.Saturated=this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Fat.Saturated +
      this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Fat.Saturated;
      this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Fat.Total=this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Fat.Total +
      this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Fat.Total;
  }
}

  convertUnits(from:string,to:string){
    for (var i=0; i<this.convToDisplay.tabConvItem.length && ( 
              this.convToDisplay.tabConvItem[i].from!==from || this.convToDisplay.tabConvItem[i].to!==to ); i++){
    }
    if (i<this.convToDisplay.tabConvItem.length){
        this.conversion=this.convToDisplay.tabConvItem[i].valueFromTo;
    } else { // from-to not found; try to ind to-from
      for (var i=0; i<this.convToDisplay.tabConvItem.length && ( 
        this.convToDisplay.tabConvItem[i].from!==to || this.convToDisplay.tabConvItem[i].to!==from ); i++){
        }
        if (i<this.convToDisplay.tabConvItem.length){
          this.conversion=1/this.convToDisplay.tabConvItem[i].valueFromTo;
        }
    }
  }

  onSelRecipeFood(event:any){ 
    this.errorMsg=''; 
    this.theEvent.target.id=event.target.id;
    this.theEvent.target.textContent= event.target.textContent.toLowerCase().trim()
    this.onInputAction="onSelRecipeFood";
    this.timeOutactivity(1,true,false,"only");
  }
  onSelRecipeFoodA(event:any){ 
    this.manageIds(event.target.id);
    if (event.target.id.substring(0,13)==='selRecipeFood'){
      if (event.target.textContent.trim()!=='cancel')
      this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Name =event.target.textContent;
      this.tabInputRecipeFood.splice(0,this.tabInputRecipeFood.length);
      for (var i=0; i<this.tabRecipeFood.length; i++){
        this.tabInputRecipeFood.push({name:''});
        this.tabInputRecipeFood[this.tabInputRecipeFood.length-1].name=this.tabRecipeFood[i].name;
      }
      if (this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].lockData!=='Y'){
        this.searchFoodCalories(event.target.textContent, this.TabOfId[0], this.TabOfId[1]);
      }
      this.isRecipeFoodInput=false;
    } 
  }

  onInputRecipe(event:any){ 
    if (this.identification.triggerFileSystem==="Yes"){
      this.isRecipeModified = true;
      this.theEvent.target.id=event.target.id;
      this.theEvent.target.value=event.target.value;
      this.onInputAction="onInputRecipe";
      //this.timeOutactivity(1,true,false);
      this.timeOutactivity(6,true,false,"only");
    } else { this.onInputRecipeA(event)}
  }

  onInputRecipeA(event:any){ 
    this.returnEmit.saveAction="";
    //this.offsetHeight= event.currentTarget.offsetHeight;
    this.offsetLeft = event.currentTarget.offsetLeft;
    //this.offsetTop = event.currentTarget.offsetTop;
    this.offsetWidth = event.currentTarget.offsetWidth;
    this.isRecipeFoodInput=false;

    var iTab:number=0;
    this.errorMsg='';

    this.manageIds(event.target.id);
    if (event.target.id.substring(0,6)==='Recipe'){
      this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Type=event.target.value.toLowerCase().trim();

      this.tabInputRecipe.splice(0,this.tabInputType.length);
      // check if recipe already exists
      iTab=-1;
      for (var i=0; i<this.tabRecipe.length && this.tabRecipe[i].name.toLowerCase().trim()!==event.target.value.toLowerCase().trim(); i++){};
      if (i<this.tabRecipe.length){
          this.errorMsg='recipe ' + event.target.value + ' already exists';
      }
    } else if (event.target.id.substring(0,4)==='name'){
      this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Name=event.target.value.toLowerCase().trim();
      // check if first letters already exists
        this.tabInputRecipeFood.splice(0,this.tabInputRecipeFood.length);
        this.isRecipeFoodInput=true;
        iTab=-1;
        for (var i=0; i<this.tabFood.length; i++){
          if (this.tabFood[i].name.indexOf(event.target.value.toLowerCase().trim())!==-1){
            iTab++;
            this.tabInputRecipeFood.push({name:''});
            this.tabInputRecipeFood[iTab].name=this.tabFood[i].name.toLowerCase().trim();
          }

        }
        if (this.tabInputRecipeFood.length===1 && this.tabInputRecipeFood[0].name.toLowerCase().trim()=== event.target.value.toLowerCase().trim() && this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].lockData!=='Y'){
            this.searchFoodCalories(event.target.value.toLowerCase().trim(), this.TabOfId[0], this.TabOfId[1]);
            this.isRecipeFoodInput=false;
        }
        if (this.tabInputRecipeFood.length>9){
          this.sizeBoxRecipeFood= 9 * this.heightItemOptionBox; 
        } else {
          this.sizeBoxRecipeFood=(this.tabInputRecipeFood.length + 1) * this.heightItemOptionBox; 
        }
            

    } else if (event.target.id.substring(0,4)==='serv'){
      this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Serving=Number(event.target.value);
      this.searchFoodCalories(this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Name, this.TabOfId[0], this.TabOfId[1]);
    } else if (event.target.id.substring(0,4)==='unit'){
      this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].ServingUnit=event.target.value.toLowerCase().trim();
    } else if (event.target.id.substring(0,4)==='calo'){
      this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Calories=Number(event.target.value);
    } else if (event.target.id.substring(0,4)==='prot'){
      this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Protein=Number(event.target.value);
    } else if (event.target.id.substring(0,4)==='carb'){
      this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Carbs=Number(event.target.value);
    } else if (event.target.id.substring(0,4)==='glyi'){
      this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].GlyIndex=Number(event.target.value);
    } else if (event.target.id.substring(0,4)==='suga'){
      this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Sugar=Number(event.target.value);
    } else if (event.target.id.substring(0,11)==='naturalSuga'){
      this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].naturalSugar=Number(event.target.value);
    } else if (event.target.id.substring(0,9)==='addedSuga'){
      this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].addedSugar=Number(event.target.value);
    } else if (event.target.id.substring(0,4)==='chol'){
      this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Cholesterol=Number(event.target.value);
    } else if (event.target.id.substring(0,4)==='satu'){
      this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Fat.Saturated=Number(event.target.value);
    } else if (event.target.id.substring(0,4)==='tota'){
      this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Fat.Total=Number(event.target.value);
    } else if (event.target.id.substring(0,4)==='lock'){
      if (event.target.value.toUpperCase().trim()==='Y' || event.target.value.toUpperCase().trim()==="N"){
        this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].lockData=event.target.value.toUpperCase().trim();
        if (this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].lockData==='N'){
          this.searchFoodCalories(this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Name.toLowerCase().trim(), this.TabOfId[0], this.TabOfId[1]);
      }
      }
      else {
        this.errorMsg="Lock value must be 'Y' or 'N'";
      }  
    }
  }

  SearchText(event:any){
    this.returnEmit.saveAction="";
    if (event.currentTarget.id==='search' && event.currentTarget.value!==''){
      this.checkText=event.currentTarget.value.toLowerCase().trim();
    } else { 
      this.checkText=''; 
    }
  }
  onFilter(event:any){
    this.returnEmit.saveAction="";
    this.filterType=false;
    this.filterFood=false;
    this.filterRecipe=false;
    this.filterRecipeFood=false;
    this.selType='';
    this.selFood='';
    this.RecipeSel='';
    this.RecipeSelFood='';

    if (event.target.id==='Recipe'){
      this.filterRecipe=true;
    } else if (event.target.id==='RecipeFood'){
      this.filterRecipeFood=true;
    } else if (event.target.id.substring(0,6)==='Recipe'){
      if (event.target.textContent.indexOf('cancel')===-1){
        if (event.target.id==='RecipeSel'){
          this.RecipeSel=event.target.textContent.trim();
        } else if (event.target.id==='RecipeSelFood'){
          this.RecipeSelFood=event.target.textContent.trim();
        }   
      } 
    }
  else if (event.target.id==='Type'){
      this.filterType=true;
    } else if (event.target.id==='Food'){
      this.filterFood=true;
    } else if (event.target.textContent.indexOf('cancel')===-1){
      if (event.target.id==='selType'){
        this.selType=event.target.textContent.trim();
      } else if (event.target.id==='selFood'){
        this.selFood=event.target.textContent.trim();
      }   
    }
  }
iRecipeSave:number=0;
  transferToCalFat(iRecipe:number){
    // check if name of recipe already exists under Type='recipe'
    this.iRecipeSave = iRecipe;
    this.isCalFatModified = true;
    this.onInputAction="transferToCalFat";
    this.timeOutactivity(1,true,false,"only");
  }

  transferToCalFatA(){
    const iRecipe = this.iRecipeSave;
    var j=0;
    for (var i=0; i< this.outConfigCaloriesFat.tabCaloriesFat.length && this.outConfigCaloriesFat.tabCaloriesFat[i].Type!=='Recipe'; i++){
    }
    if (i=== this.outConfigCaloriesFat.tabCaloriesFat.length){
      // Type='Recipe' has not been found; create it
      this.createAfterBefore(this.outConfigCaloriesFat.tabCaloriesFat.length,'Type');
      i=this.outConfigCaloriesFat.tabCaloriesFat.length-1;
      this.outConfigCaloriesFat.tabCaloriesFat[i].Type='Recipe';
      j=0;
    } else {
      // check if item food already exists and if yes overide figures otherwise create new food item
      this.TabOfId[0]=i;
      for (j=0; j<this.outConfigCaloriesFat.tabCaloriesFat[i].Content.length && 
        this.outConfigCaloriesFat.tabCaloriesFat[i].Content[j].Name.toLowerCase().trim() !== this.outFileRecipe.tabCaloriesFat[iRecipe].Type.toLowerCase().trim();j++){

      }  
      if (j===this.outConfigCaloriesFat.tabCaloriesFat[i].Content.length){
        this.TabOfId[1]=this.outConfigCaloriesFat.tabCaloriesFat[i].Content.length;
        this.createAfterBefore(this.TabOfId[1],'Food');
        j=this.outConfigCaloriesFat.tabCaloriesFat[i].Content.length-1;
      }
    }
    this.copyContent(this.outConfigCaloriesFat.tabCaloriesFat[i].Content[j],this.outFileRecipe.tabCaloriesFat[iRecipe].Total);
  // name of the recipe
    this.outConfigCaloriesFat.tabCaloriesFat[i].Content[j].Name=this.outFileRecipe.tabCaloriesFat[iRecipe].Type;
  }


  manageIds(theId: string) {
    this.errorMsg = '';
    this.TabOfId.splice(0, this.TabOfId.length);
    const theValue = findIds(theId, "-");
    this.TabOfId = theValue.tabOfId;
    /*
    for (var i = 0; i < theValue.tabOfId.length; i++) {
      this.TabOfId[i] = theValue.tabOfId[i];
    }
    */
  }

  ConfirmSave(event:any){
    // check if there is no dupes of FOOD
    if (event.target.id==='RecipeSave'){
      this.isSaveRecipeConfirmed=true;
      this.SpecificForm.controls['FileNameRecipe'].setValue(this.identification.fitness.files.recipe);
    } else {

  
      this.tabType.splice(0,this.tabType.length);
      this.tabFood.splice(0,this.tabFood.length);
      var i=0;
      var j=0;

      for (i=0; i<this.outConfigCaloriesFat.tabCaloriesFat.length; i++){
          this.tabType.push({name:''});
          this.tabType[this.tabType.length-1].name=this.outConfigCaloriesFat.tabCaloriesFat[i].Type.toLowerCase().trim();
          for (j=0; j<this.outConfigCaloriesFat.tabCaloriesFat[i].Content.length; j++){
            this.tabFood.push({name:''});
            this.tabFood[this.tabFood.length-1].name=this.outConfigCaloriesFat.tabCaloriesFat[i].Content[j].Name.toLowerCase().trim();;
          }
      }
      this.tabType.sort((a, b) => (a.name < b.name) ? -1 : 1);
      this.tabFood.sort((a, b) => (a.name < b.name) ? -1 : 1);

      var trouve=false;
      for (i=1; i<this.tabType.length && trouve===false; i++){
          if (this.tabType[i].name===this.tabType[i-1].name){
            trouve=true;
          }
      }
      if (trouve!== true){
        for (j=1; j<this.tabFood.length && trouve===false; j++){
          if (this.tabFood[j].name===this.tabFood[j-1].name){
            trouve=true;
          }
      }
      }
      if (trouve!== true){
        this.isSaveConfirmed=true;
      } else {
        if (i<this.tabType.length){
          this.errorMsg='you have created dupe type-element   ' + this.tabType[i-1].name;
        } else if (j<this.tabFood.length){
          this.errorMsg='you have created dupe food-element   ' + this.tabFood[j-1].name;
        }
      }
    }
  }

  CancelTheSave(event:any){
    if (event.target.id==='RecipeCancel'){
      this.isSaveRecipeConfirmed=false;
    // this.cancelSave.emit(6);
    } else {
      this.isSaveConfirmed=false;
      //this.cancelSave.emit(1);
    }
    
  }

  CancelUpdates(event:any){
    if (this.isRecipeModified===true || this.isCalFatModified===true){
      this.timeOutactivity(1,false,false,"only");
      if (event.target.id==='RecipeCancel'){
        this.isSaveRecipeConfirmed=false;
        this.isRecipeModified = false;
        this.initialiseFiles('recipe');
        //===== file should be reset
      } else {
        this.isSaveConfirmed=false;
        this.isCalFatModified = false;
        this.initialiseFiles('calFat');
      }
    }
  }


  SaveFile(event: any) {
    this.errorMsg = '';
    this.returnEmit.saveAction=event.target.id;
    this.theEvent.target.id = event.target.id;
    this.theEvent.checkLock.isDataModified=true;
    this.theEvent.checkLock.isSaveFile=true;
    this.theEvent.checkLock.lastInputAt=this.lastInputAt;
    this.theEvent.checkLock.iCheck=true;
    //this.theEvent.fileName = this.SpecificForm.controls['FileName'].value;
    if (event.target.id==='RecipeSave'){
      this.isSaveRecipeConfirmed=false;
      this.fillConfig(this.inFileRecipe, this.outFileRecipe, 'Recipe');
      this.outFileRecipe.updatedAt=strDateTime();
      this.theEvent.checkLock.iWait=6;
      this.onInputAction = "saveRecipe";
      this.theEvent.checkLock.action="saveRecipe";
      this.theEvent.fileName = this.SpecificForm.controls['FileNameRecipe'].value
    } else {
      this.isSaveConfirmed=false;
      this.fillConfig(this.ConfigCaloriesFat,this.outConfigCaloriesFat, 'Calories');
      this.outConfigCaloriesFat.updatedAt=strDateTime();
      this.theEvent.checkLock.iWait=1;
      this.onInputAction = "saveCalFat";
      this.theEvent.checkLock.action="saveCalFat";
      this.theEvent.fileName = this.SpecificForm.controls['FileName'].value;
    }
    this.timeOutactivity(5, true, true,this.onInputAction);
    this.processSave.emit(this.theEvent);
  }

  saveCalFatRecipeAfterCheckToLimit(){
   // this.theEvent.checkLock.isSaveFile=false;
   // this.theEvent.checkLock.isDataModified=false;
  //this.processSaveCalFatRecipe.emit(this.theEvent);    
  }

  SaveFileOld(event:any){
    this.returnEmit.saveAction=event.target.id;
    this.theEvent.target.id = event.target.id;
    this.theEvent.checkLock.isDataModified=true;
    this.theEvent.checkLock.isSaveFile=true;
    this.theEvent.checkLock.lastInputAt=this.lastInputAt;
  
    if (event.target.id==='RecipeSave'){
      this.fillConfig(this.inFileRecipe, this.outFileRecipe, 'Recipe');
      this.theEvent.checkLock.iWait=6;
      this.onInputAction = "saveRecipe";
      this.theEvent.fileName = this.SpecificForm.controls['FileNameRecipe'].value
      this.processSave.emit(this.theEvent);
      this.isSaveRecipeConfirmed=false;

    } else {
      this.fillConfig(this.ConfigCaloriesFat,this.outConfigCaloriesFat, 'Calories');
      this.theEvent.fileName = this.SpecificForm.controls['FileName'].value;
      this.outConfigCaloriesFat.updatedAt=strDateTime();
      this.theEvent.checkLock.iWait=1;
      this.onInputAction = "saveCalFat";
      this.processSave.emit(this.theEvent);
      this.initTrackRecord();
      this.isSaveConfirmed=false;
      // rebuild the filter tabs
      this.tabType.splice(0,this.tabType.length);
      this.tabFood.splice(0,this.tabFood.length);
      //var iFood=0;

      for (var i=0; i<this.outConfigCaloriesFat.tabCaloriesFat.length; i++){
        this.tabType.push({name:''});
        this.tabType[this.tabType.length-1].name=this.outConfigCaloriesFat.tabCaloriesFat[i].Type.toLowerCase().trim();
        for (var j=0; j<this.outConfigCaloriesFat.tabCaloriesFat[i].Content.length; j++){
          //iFood++
          this.tabFood.push({name:''});
          this.tabFood[this.tabFood.length-1].name=this.outConfigCaloriesFat.tabCaloriesFat[i].Content[j].Name.toLowerCase().trim();;
          }
      }
      this.tabType.sort((a, b) => (a.name < b.name) ? -1 : 1);
      this.tabFood.sort((a, b) => (a.name < b.name) ? -1 : 1);
      this.tabType.splice(0,0,{name:'cancel'});
      this.tabFood.splice(0,0,{name:'cancel'});
      //this.tabType[0].name='cancel';
      //this.tabFood[0].name='cancel';
      //this.tabNewRecord.splice(0, this.tabNewRecord.length);
      //this.initTrackRecord();
      //this.myEmit.emit(this.SpecificForm.controls['FileName'].value);
      //this.myEmit.emit(this.outConfigCaloriesFat);
    }
  }


  resultAccessFile(theEvent:any){
    if (this.returnDataFSCalFat.errorCode!==0 && this.returnDataFSCalFat.errorCode!==200){
      this.errorMsg = this.returnDataFSCalFat.errorMsg;
    } else if (this.returnDataFSRecipe.errorCode!==0 && this.returnDataFSRecipe.errorCode!==200){ //  
      this.errorMsg = this.returnDataFSRecipe.errorMsg;
    } else  if (this.tabLock[1].lock === 1 && this.onInputAction === "onAction") {
      this.onInputAction="";
      this.onActionA(this.theEvent);
      
    } else  if (this.tabLock[1].lock === 1 && this.onInputAction === "onInput") {
      this.onInputA(this.theEvent);
      this.onInputAction="";
    } else  if (this.tabLock[1].lock === 1 && this.onInputAction === "transferToCalFat") {
      this.transferToCalFatA();
      this.onInputAction="";
    } else  if (this.tabLock[1].lock === 1 && this.onInputAction === "onInputRecipe") {
      this.onInputRecipeA(this.theEvent);
      this.onInputAction="";
    } else  if (this.tabLock[1].lock === 1 && this.onInputAction === "onSelRecipeFood") {
      this.onSelRecipeFoodA(this.theEvent);
      this.onInputAction="";
    }  else  if (this.tabLock[1].lock === 1 && this.onInputAction === "saveCalFat") {
      this.onInputAction="";
      this.saveCalFatRecipeAfterCheckToLimit();
    }  else  if (this.tabLock[1].lock === 1 && this.onInputAction === "saveRecipe") {
      this.onInputAction="";
      this.saveCalFatRecipeAfterCheckToLimit();
    }


    console.log(theEvent);
  }

  firstLoop:boolean=true;
  ngOnChanges(changes: SimpleChanges) {
    var saveLoop=0;
    if (this.tabLock[1].lock===1){
      this.inputReadOnly=false;
    } else {
      this.inputReadOnly=true;
    }
    if (this.firstLoop===true){
      this.firstLoop=false;
    } else {
   
      var i = 0;
      for (const propName in changes) {
        const j = changes[propName];
        if (propName === 'resultCheckLimitCalFat' ) {
          if (this.returnDataFSCalFat.errorCode!==0 && this.returnDataFSCalFat.errorCode!==200){
            this.errorMsg = this.returnDataFSCalFat.errorMsg;
          } else if (this.returnDataFSRecipe.errorCode!==0 && this.returnDataFSRecipe.errorCode!==200){ //  
            this.errorMsg = this.returnDataFSRecipe.errorMsg;
          } else  if (this.tabLock[1].lock === 1 && this.onInputAction === "onAction") {
            this.onInputAction="";
            this.onActionA(this.theEvent);
            
          } else  if (this.tabLock[1].lock === 1 && this.onInputAction === "onInput") {
            this.onInputA(this.theEvent);
            this.onInputAction="";
          } else  if (this.tabLock[1].lock === 1 && this.onInputAction === "transferToCalFat") {
            this.transferToCalFatA();
            this.onInputAction="";
          } else  if (this.tabLock[1].lock === 1 && this.onInputAction === "onInputRecipe") {
            this.onInputRecipeA(this.theEvent);
            this.onInputAction="";
          } else  if (this.tabLock[1].lock === 1 && this.onInputAction === "onSelRecipeFood") {
            this.onSelRecipeFoodA(this.theEvent);
            this.onInputAction="";
          }  else  if (this.tabLock[1].lock === 1 && this.onInputAction === "saveCalFat") {
            this.onInputAction="";
            this.saveCalFatRecipeAfterCheckToLimit();
          }  else  if (this.tabLock[1].lock === 1 && this.onInputAction === "saveRecipe") {
            this.onInputAction="";
            this.saveCalFatRecipeAfterCheckToLimit();
          }
        } else if (propName === 'actionCalFat'  ) {
            if (this.onInputAction==='saveCalFat'){
              if ( this.actionCalFat > 0) {
                  this.errorMsg = 'File '+ this.SpecificForm.controls['FileName'].value + ' is saved';
                  this.isCalFatModified=false;
              } else {
                  this.errorMsg = 'Error when trying to save file '+ this.SpecificForm.controls['FileName'].value + ', try again';
              }
              this.onInputAction = "";
            }
        } else if (propName === 'actionRecipe' && changes[propName].firstChange === false) {
            if (this.onInputAction==='saveRecipe'){
              if ( this.actionRecipe > 0) {
                  this.errorMsg = 'File '+ this.SpecificForm.controls['FileNameRecipe'].value + ' is saved';
                  this.isRecipeModified=false;
              } else {
                  this.errorMsg = 'Error when trying to save file '+ this.SpecificForm.controls['FileNameRecipe'].value + ', try again';
              }
              this.onInputAction = "";
            }
        } else if (propName==='returnDataFSCalFat' && changes[propName].firstChange === false) {
          var cancelUpdate=false;
          if (this.tabLock[1].lock !== 1 && (this.onInputAction === "saveRecipe" || this.onInputAction === "saveCalFat")){
              this.errorMsg = "file has been locked by another user; all your updates are lost (" +  this.returnDataFSCalFat.errorMsg + ")" + " status=" + this.tabLock[1].status;
              this.onInputAction = "";
              // reinitialise the two tables
              cancelUpdate=true;
              console.log(this.errorMsg);
    
          } else if (this.tabLock[1].lock === 2) {
              cancelUpdate=true;
          } else {
              console.log('File is locked; no specific action; process continues');
          }
          if (cancelUpdate===true){
            if (this.isCalFatModified===true){
              this.theEvent.target.id='calFatCancel'
              this.CancelUpdates(this.theEvent);
            }
            if (this.isRecipeModified===true){
              this.theEvent.target.id='RecipeCancel'
              this.CancelUpdates(this.theEvent);
            }
          }
        } else if (propName==='calFatFileRetrieved' &&  changes[propName].firstChange === false){
            this.theEvent.target.id='RecipeCancel'
            this.CancelUpdates(this.theEvent);
        }  else if (propName==='recipeFileRetrieved' &&  changes[propName].firstChange === false){
            this.theEvent.target.id='calFatCancel'
            this.CancelUpdates(this.theEvent);
        } else if (propName === 'callSaveFunction' || propName === 'callSaveFunctionCalFat' && saveLoop===0) {
          saveLoop++
          if (this.statusSaveFn.status===200 || this.statusSaveFn.status===0){
            this.errorMsg='File has been successfully saved';
          } else {
            this.errorMsg=this.statusSaveFn.err;
          }
          if (this.theEvent.target.id==='RecipeSave'){
            this.isSaveRecipeConfirmed=false;
            this.isRecipeModified = false;

          } else {
            this.initTrackRecord();
            this.isSaveConfirmed=false;
            this.isCalFatModified = false;
            // rebuild the filter tabs
            this.tabType.splice(0,this.tabType.length);
            this.tabFood.splice(0,this.tabFood.length);
            for (var i=0; i<this.outConfigCaloriesFat.tabCaloriesFat.length; i++){
              this.tabType.push({name:''});
              this.tabType[this.tabType.length-1].name=this.outConfigCaloriesFat.tabCaloriesFat[i].Type.toLowerCase().trim();
              for (var jK=0; jK<this.outConfigCaloriesFat.tabCaloriesFat[i].Content.length; jK++){
                this.tabFood.push({name:''});
                this.tabFood[this.tabFood.length-1].name=this.outConfigCaloriesFat.tabCaloriesFat[i].Content[jK].Name.toLowerCase().trim();;
                }
            }
            this.tabType.sort((a, b) => (a.name < b.name) ? -1 : 1);
            this.tabFood.sort((a, b) => (a.name < b.name) ? -1 : 1);
            this.tabType.splice(0,0,{name:'cancel'});
            this.tabFood.splice(0,0,{name:'cancel'});
          }
        } 
      }
    }
  }
}
