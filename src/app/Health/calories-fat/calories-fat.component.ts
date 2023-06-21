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
// it is stored in MangoDB and accessed via ManageMangoDBService
import { configServer, XMVConfig, LoginIdentif, classPosDiv } from '../../JsonServerClass';

import { environment } from 'src/environments/environment';
import {manage_input} from '../../manageinput';
import {eventoutput, thedateformat} from '../../apt_code_name';

import { msgConsole } from '../../JsonServerClass';
import {msginLogConsole} from '../../consoleLog'

import {mainClassCaloriesFat, ClassCaloriesFat, ClassItem} from '../ClassHealthCalories'

import {ClassSubConv, mainConvItem, mainRecordConvert, mainClassUnit} from '../../ClassConverter'
import {mainClassConv, ClassConv, ClassUnit, ConvItem, recordConvert} from '../../ClassConverter'

import {classConfCaloriesFat} from '../classConfHTMLTableAll';


import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import {AccessConfigService} from 'src/app/CloudServices/access-config.service';

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
    private ManageMangoDBService: ManageMangoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    @Inject(LOCALE_ID) private locale: string,
    ) { }

  @Input() XMVConfig=new XMVConfig;
  @Input() configServer = new configServer;
  @Input() identification= new LoginIdentif;
  @Input() ConfigCaloriesFat=new mainClassCaloriesFat;
  @Input() inFileRecipe=new mainClassCaloriesFat;
  @Input() HTMLCaloriesFat=new classConfCaloriesFat;

  ConvToDisplay=new mainConvItem;

  @Input() posDivCalFat= new classPosDiv;
          
  @Output() myEmit= new EventEmitter<any>();
  @Output() myEmitRecipe= new EventEmitter<any>();

  outConfigCaloriesFat=new mainClassCaloriesFat;
  outFileRecipe=new mainClassCaloriesFat;

  EventHTTPReceived:Array<boolean>=[];

  IsSaveConfirmed:boolean=false;
  IsSaveRecipeConfirmed:boolean=false;
  SpecificForm=new FormGroup({
        FileName: new FormControl(''),
        FileNameRecipe: new FormControl(''),
      })

  getScreenWidth: any;
  getScreenHeight: any;
  device_type:string='';

  error_msg:string='';

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
      
  theEvent={
    target:{
      id:'',
      textContent:''
    }
  }

  posDeletedItem:number=0;
  posType=585;
  posFood=660;
  nameDeletedItem:string='';
      
  tablePosTop:number=-1;
  tablePosLeft:number=0;
  theHeight:number=0;
  docHeaderAll:any;

  RecipetablePosTop:number=-1;
  RecipetablePosLeft:number=0;
  RecipetheHeight:number=0;
  RecipedocHeaderAll:any;
    
  // get position of pointer/cursor
  mousedown:boolean=false;
  selectedPosition ={ 
    x: 0,
    y: 0} ;
    

@HostListener('window:mouseup', ['$event'])
onMouseUp(event: MouseEvent) {
    this.selectedPosition = { x: event.pageX, y: event.pageY };
    const i=this.HTMLCaloriesFat.title.height.indexOf('px');
    const titleHeight=Number(this.HTMLCaloriesFat.title.height.substring(0,i));
    this.getPosDivTable();
    // this allows to position the dropdown list where the click occured
    this.posItemAction=Number(event.clientY)-Number(this.posDivTable.Client.Top)+Number(titleHeight);
    if (this.posItemAction>this.HTMLCaloriesFat.height/2 ){
      // this allows to position the dropdownlist at the middle of the window and then dropdownlist remains within the scrolling window
      this.posItemAction=this.HTMLCaloriesFat.height/2;
    }
 
  }

  docDivTable:any;
  posDivTable= new classPosDiv;

  docDivEndTable:any;
  posDivEndTable= new classPosDiv;

  docDivRecipeTable:any;
  posDivRecipeTable= new classPosDiv;

  docDivItem:any;
  posDivItem= new classPosDiv;


  getPosItem(item:string){
    var trouve=false;
    if (item==='Action'){
      if (document.getElementById("posAction")!==null){
        this.docDivItem = document.getElementById("posAction");
        trouve=true;
      }
    } else if (item==='Type'){
      if (document.getElementById("posType")!==null){
        this.docDivItem = document.getElementById("posType");
        trouve=true;
      }
    } else if (item==='Food'){
      if (document.getElementById("posFood")!==null){
        this.docDivItem = document.getElementById("posFood");
        trouve=true;
      }
    }
    if (trouve===true){
      this.posDivItem.Left = this.docDivItem.offsetLeft;
      this.posDivItem.Top = this.docDivItem.offsetTop;
      this.posDivItem.Client.Top=Math.round(this.docDivItem.getBoundingClientRect().top);
      this.posDivItem.Client.Left=Math.round(this.docDivItem.getBoundingClientRect().left);
    }
  } 
posItemAction:number=0;
// position of the table referenced by the <div id="posTable"> 
getPosDivTable(){
    if (document.getElementById("posStartTable")!==null){
      this.docDivTable = document.getElementById("posStartTable");
      this.posDivTable.Left = this.docDivTable.offsetLeft;
      this.posDivTable.Top = this.docDivTable.offsetTop;
      this.theHeight=Number(this.HTMLCaloriesFat.title.height.substring(0,this.HTMLCaloriesFat.title.height.indexOf('px')));
      this.posDivTable.Client.Top=Math.round(this.docDivTable.getBoundingClientRect().top);
      this.posDivTable.Client.Left=Math.round(this.docDivTable.getBoundingClientRect().left);
    }
}
getPosDivOthers(){
    if (document.getElementById("posEndTable")!==null){
      this.docDivEndTable = document.getElementById("posEndTable");
      this.posDivEndTable.Left = this.docDivEndTable.offsetLeft;
      this.posDivEndTable.Top = this.docDivEndTable.offsetTop;
      this.posDivEndTable.Client.Top=Math.round(this.docDivEndTable.getBoundingClientRect().top);
      this.posDivEndTable.Client.Left=Math.round(this.docDivEndTable.getBoundingClientRect().left);
    }
    if (document.getElementById("posRecipeTable")!==null){
      this.docDivRecipeTable = document.getElementById("posRecipeTable");
      this.posDivRecipeTable.Left = this.docDivRecipeTable.offsetLeft;
      this.posDivRecipeTable.Top = this.docDivRecipeTable.offsetTop;
      this.RecipetheHeight=Number(this.HTMLCaloriesFat.title.height.substring(0,this.HTMLCaloriesFat.title.height.indexOf('px')));
      this.posDivRecipeTable.Client.Top=Math.round(this.docDivRecipeTable.getBoundingClientRect().top);
      this.posDivRecipeTable.Client.Left=Math.round(this.docDivRecipeTable.getBoundingClientRect().left);
    }
  } 


@HostListener('window:resize', ['$event'])
onWindowResize() {
  this.getScreenWidth = window.innerWidth ;
  this.getScreenHeight = window.innerHeight;
  }

ngOnInit(): void {
  this.getPosDivTable();
  this.getPosDivOthers();
  this.onWindowResize();
  this.device_type = navigator.userAgent;
  this.device_type = this.device_type.substring(10, 48);

  this.EventHTTPReceived[0]=false;
  this.getRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.convToDisplay,0);

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
  //this.TabActionRecipe[this.TabActionRecipe.length-1].name='Calculate';
  //this.TabActionRecipe[this.TabActionRecipe.length-1].action='Total';
  const myActionRec1={name:'Recipe',action:'Transfer'};
  this.TabActionRecipe.push(myActionRec1);
  //this.TabActionRecipe[this.TabActionRecipe.length-1].name='Recipe';
  //this.TabActionRecipe[this.TabActionRecipe.length-1].action='Transfer';

  if (this.ConfigCaloriesFat.tabCaloriesFat.length===0){
    this.initOutTab(this.ConfigCaloriesFat,'calories');
  } else { 
    this.fillConfig(this.outConfigCaloriesFat, this.ConfigCaloriesFat,'Calories');
  }
  this.initTrackRecord();
  this.SpecificForm.controls['FileName'].setValue(this.identification.configFitness.files.calories);
 
  if (this.inFileRecipe.tabCaloriesFat.length===0){
    this.initOutTab(this.outFileRecipe,'Recipe');
  } else { 
    this.fillConfig(this.outFileRecipe, this.inFileRecipe, 'Recipe');
  }

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
      this.sizeBoxRecipeFood=this.tabInputRecipeFood.length * this.heightItemOptionBox;
    }
}

sizeBoxRecipeFood:number=0;
heightItemOptionBox:number=25;
initTrackRecord(){
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
  this.error_msg='';
  var j=-1;
  for (var i=1; i<idString.length && idString.substring(i,i+1)!=='-'; i++){
  }
  this.myType=idString.substring(0,i).trim();
  this.myAction=idString.substring(i+1).trim();
}

onAction(event:any){
  
  var iAction=0;
  this.dialogueCalFat[0]=false;
  this.dialogueCalFat[1]=false;
  var trouve=false;
  this.error_msg='';
  
  if (event.currentTarget.id !==''){
      this.theEvent.target.id=event.currentTarget.id;
      this.findIds(event.currentTarget.id); 
      iAction=Number(event.currentTarget.value);
  } else if (event.target.id!==''){
      this.theEvent.target.id=event.target.id;
      this.findIds(event.target.id); 
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
      } else if (this.TabActionRecipe[iAction].name==='Recipe'){
          if (this.TabActionRecipe[iAction].action==='add before'){
              this.createAfterBefore(this.TabOfId[0],'Recipe');
          } else if (this.TabActionRecipe[iAction].action==='add after'){
              this.createAfterBefore(this.TabOfId[0]+1,'Recipe');
          }  else if (this.TabActionRecipe[iAction].action==='delete'){
          if (this.outFileRecipe.tabCaloriesFat.length==1 ){
              this.nameDeletedItem='';
              this.error_msg='only one item - cannot be deleted';
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
            this.error_msg='only one food item - cannot be deleted';
          } else {
            this.nameDeletedItem='food item: '+ this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Name;
            this.posDeletedItem=this.posFood;
            this.isDeleteRecipeFood=true;
          }
        } 
      }
    } else if (this.theEvent.target.id.substring(0,10)==='openAction'){
      this.dialogueCalFat[0]=true;
      this.getPosItem("Action");
    } else  if (this.theEvent.target.id.substring(0,9)==='selAction'){
      if (iAction===0){
        this.isDeleteType=false;
        this.isDeleteFood=false;    
      } else 
      if (this.TabAction[iAction].name==='Type'){
        if (this.TabAction[iAction].action==='add before'){
            this.createAfterBefore(this.TabOfId[0],'Type');
        } else if (this.TabAction[iAction].action==='add after'){
            this.createAfterBefore(this.TabOfId[0]+1,'Type');
        } else if (this.TabAction[iAction].action==='delete'){
          if (this.outConfigCaloriesFat.tabCaloriesFat.length==1 ){
            this.nameDeletedItem='';
            this.error_msg='only one item - cannot be deleted';
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
            this.error_msg='only one item - cannot be deleted';
          } else {
            this.nameDeletedItem='food item: '+ this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Name;
            this.posDeletedItem=this.posFood;
            this.isDeleteFood=true;
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

offsetHeight:number=0;
offsetLeft:number=0;
offsetTop:number=0;
offsetWidth:number=0;
scrollHeight:number=0;
scrollTop:number=0;


onInput(event:any){

  //this.getPosAfterTitle();
  //this.offsetHeight= event.currentTarget.offsetHeight;
  this.offsetLeft = event.currentTarget.offsetLeft;
  //this.offsetTop = event.currentTarget.offsetTop;
  this.offsetWidth = event.currentTarget.offsetWidth;
  //this.scrollHeight = event.currentTarget.scrollHeight;
  //this.scrollTop = event.currentTarget.scrollTop;
  //console.log('offsetHeight='+this.offsetHeight +'  offsetLeft= '+this.offsetLeft + ' offsetTop=' + this.offsetTop 
  //+ ' scrollHeight='+this.scrollHeight+ '  scrollTop=' +this.scrollTop);
  this.tabInputType.splice(0,this.tabInputType.length);
  //this.tabInputFood.splice(0,this.tabInputFood.length);
  var iTab:number=0;
  this.error_msg='';

  this.findIds(event.target.id);
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
  // check if first letters already exists
  /*
    iTab=-1;
    for (var i=0; i<this.tabType.length; i++){
      if (this.tabFood[i].name.substr(0,event.target.value.trim().length)===event.target.value.toLowerCase().trim()){
        iTab++;
        this.tabInputFood[iTab]=this.tabFood[i].name.toLowerCase().trim();
      }
    }
    */
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
  } else if (event.target.id.substring(0,4)==='chol'){
    this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Cholesterol=Number(event.target.value);
  } else if (event.target.id.substring(0,4)==='satu'){
    this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Fat.Saturated=Number(event.target.value);
  } else if (event.target.id.substring(0,4)==='tota'){
    this.outConfigCaloriesFat.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Fat.Total=Number(event.target.value);
  }
}

searchFoodCalories(foodName:string, iRecipe:number, jRecipe:number){
  var trouve=false;
  if (this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Serving!==0 && 
    this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Name!=='' && this.EventHTTPReceived[0]===true){
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
      this.outFileRecipe.tabCaloriesFat[iRecipe].Total.GlyIndex=this.outFileRecipe.tabCaloriesFat[iRecipe].Total.GlyIndex +
      this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].GlyIndex;
      this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Fat.Saturated=this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Fat.Saturated +
      this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Fat.Saturated;
      this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Fat.Total=this.outFileRecipe.tabCaloriesFat[iRecipe].Total.Fat.Total +
      this.outFileRecipe.tabCaloriesFat[iRecipe].Content[jRecipe].Fat.Total;
    
      
  }

}

conversion:number=0;
convertUnits(from:string,to:string){
  
  for (var i=0; i<this.ConvToDisplay.tabConvItem.length && ( 
            this.ConvToDisplay.tabConvItem[i].from!==from || this.ConvToDisplay.tabConvItem[i].to!==to ); i++){
  }
  if (i<this.ConvToDisplay.tabConvItem.length){
      this.conversion=this.ConvToDisplay.tabConvItem[i].valueFromTo;
  } else { // from-to not found; try to ind to-from
    for (var i=0; i<this.ConvToDisplay.tabConvItem.length && ( 
      this.ConvToDisplay.tabConvItem[i].from!==to || this.ConvToDisplay.tabConvItem[i].to!==from ); i++){
      }
      if (i<this.ConvToDisplay.tabConvItem.length){
        this.conversion=1/this.ConvToDisplay.tabConvItem[i].valueFromTo;
      }
  }

}

onSelRecipeFood(event:any){ 
  this.error_msg=''; 
  this.findIds(event.target.id);
  if (event.target.id.substring(0,13)==='selRecipeFood'){
    if (event.target.textContent.trim()!=='cancel')
    this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Name =event.target.textContent.toLowerCase().trim();
    this.tabInputRecipeFood.splice(0,this.tabInputRecipeFood.length);
    for (var i=0; i<this.tabRecipeFood.length; i++){
      this.tabInputRecipeFood.push({name:''});
      this.tabInputRecipeFood[this.tabInputRecipeFood.length-1].name=this.tabRecipeFood[i].name;
    }
    if (this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].lockData!=='Y'){
      this.searchFoodCalories(event.target.textContent.toLowerCase().trim(), this.TabOfId[0], this.TabOfId[1]);
    }
    this.isRecipeFoodInput=false;
  } 
}

isRecipeFoodInput:boolean=false;
onInputRecipe(event:any){ 
  //this.offsetHeight= event.currentTarget.offsetHeight;
  this.offsetLeft = event.currentTarget.offsetLeft;
  //this.offsetTop = event.currentTarget.offsetTop;
  this.offsetWidth = event.currentTarget.offsetWidth;
  this.isRecipeFoodInput=false;

  var iTab:number=0;
  this.error_msg='';

  this.findIds(event.target.id);
  if (event.target.id.substring(0,6)==='Recipe'){
    this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Type=event.target.value.toLowerCase().trim();

    this.tabInputRecipe.splice(0,this.tabInputType.length);
    // check if recipe already exists
    iTab=-1;
    for (var i=0; i<this.tabRecipe.length && this.tabRecipe[i].name.toLowerCase().trim()!==event.target.value.toLowerCase().trim(); i++){};
    if (i<this.tabRecipe.length){
        this.error_msg='recipe ' + event.target.value + ' already exists';
    }
  } else if (event.target.id.substring(0,4)==='name'){
    this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].Name=event.target.value.toLowerCase().trim();
    // check if first letters already exists
      this.tabInputRecipeFood.splice(0,this.tabInputRecipeFood.length);
      this.isRecipeFoodInput=true;
      iTab=-1;
      for (var i=0; i<this.tabFood.length; i++){
        if (this.tabFood[i].name.substring(0,event.target.value.trim().length)===event.target.value.toLowerCase().trim()){
          iTab++;
          this.tabInputRecipeFood.push({name:''});
          this.tabInputRecipeFood[iTab].name=this.tabFood[i].name.toLowerCase().trim();
        }
      }
      if (this.tabInputRecipeFood.length===1 && this.tabInputRecipeFood[0]=== event.target.value.toLowerCase().trim() && this.outFileRecipe.tabCaloriesFat[this.TabOfId[0]].Content[this.TabOfId[1]].lockData!=='Y'){
          this.searchFoodCalories(event.target.value.toLowerCase().trim(), this.TabOfId[0], this.TabOfId[1]);
          this.isRecipeFoodInput=false;
      }
      this.sizeBoxRecipeFood=this.tabInputRecipeFood.length * this.heightItemOptionBox;      

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
      this.error_msg="Lock value must be 'Y' or 'N'";
    }  
  }
}



checkText:string='';
SearchText(event:any){
  if (event.currentTarget.id==='search' && event.currentTarget.value!==''){
    this.checkText=event.currentTarget.value.toLowerCase().trim();
  } else { 
    this.checkText=''; 
  }
}
onFilter(event:any){
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

transferToCalFat(iRecipe:number){
  // check if name of recipe already exists under Type='recipe'
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


findIds(theId:string){
  this.error_msg='';
  var TabDash=[];
  this.TabOfId.splice(0,this.TabOfId.length);
  var j=-1;
  for (var i=4; i<theId.length; i++){
    if (theId.substring(i,i+1)==='-'){
        j++;
        TabDash[j]=i+1;
        TabDash.push(0);
    }
  }
  TabDash[j+1]=theId.length+1;

  i=0;
  for (j=0; j<TabDash.length-1; j++){
    this.TabOfId[i]=parseInt(theId.substring(TabDash[j],TabDash[j+1]-1));
    //this.TabOfId.push(0);
    i++;
  }
}

ConfirmSave(event:any){
  // check if there is no dupes of FOOD
  if (event.target.id==='RecipeSave'){
    this.IsSaveRecipeConfirmed=true;
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
      this.IsSaveConfirmed=true;
    } else {
      if (i<this.tabType.length){
        this.error_msg='you have created dupe type-element   ' + this.tabType[i-1].name;
      } else if (j<this.tabFood.length){
        this.error_msg='you have created dupe food-element   ' + this.tabFood[j-1].name;
      }
    }
  }
}

CancelSave(event:any){
  
  if (event.target.id==='RecipeCancel'){
    this.IsSaveRecipeConfirmed=false;
  } else {
    this.IsSaveConfirmed=false;
  }
  
}

CancelUpdates(event:any){
  if (event.target.id==='RecipeCancel'){
    this.IsSaveRecipeConfirmed=false;
  } else {
    this.IsSaveConfirmed=false;
    this.outConfigCaloriesFat.tabCaloriesFat.splice(0, this.outConfigCaloriesFat.tabCaloriesFat.length);
    this.tabNewRecord.splice(0, this.tabNewRecord.length);
    if (this.ConfigCaloriesFat.tabCaloriesFat.length===0){
      this.initOutTab(this.ConfigCaloriesFat,'calories');
    } else {
      this.fillConfig(this.outConfigCaloriesFat, this.ConfigCaloriesFat.fileType,'Calories');
      this.initTrackRecord();
    }
  }
}


SaveFile(event:any){
  if (event.target.id==='RecipeSave'){
    this.IsSaveRecipeConfirmed=false;
    this.myEmitRecipe.emit(this.SpecificForm.controls['FileNameRecipe'].value);
    this.myEmitRecipe.emit(this.outFileRecipe);
  } else {
    this.IsSaveConfirmed=false;
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
    this.tabNewRecord.splice(0, this.tabNewRecord.length);
    this.initTrackRecord();
    this.myEmit.emit(this.SpecificForm.controls['FileName'].value);
    this.myEmit.emit(this.outConfigCaloriesFat);
  }
}

getRecord(Bucket:string,GoogleObject:string, iWait:number){
  
  this.ManageGoogleService.getContentObject(this.configServer, Bucket, GoogleObject )
      .subscribe((data ) => {    
        this.ConvToDisplay=data;
        this.EventHTTPReceived[iWait]=true;
    },
    error_handler => {

    })
}

/**
ngOnChanges(changes: SimpleChanges) { 

  var i=0;
    for (const propName in changes){
        const j=changes[propName];
        if (propName==='ConfigCaloriesFat'){

            
        }
    }

}
 */
}
