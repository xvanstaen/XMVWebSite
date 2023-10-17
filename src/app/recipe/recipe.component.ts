import { Component, OnInit , Input, Output, HostListener,  HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
  
import { DatePipe, formatDate, ViewportScroller } from '@angular/common'; 

import { HttpClient , HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';

import { FormGroup, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { Observable } from 'rxjs';


import { BucketList ,Bucket_List_Info, OneBucketInfo } from '../JsonServerClass';

// configServer is needed to use ManageGoogleService
// it is stored in MangoDB and accessed via ManageMangoDBService
import { configServer, LoginIdentif} from '../JsonServerClass';
import { msgConsole } from '../JsonServerClass';
import {msginLogConsole} from '../consoleLog'
import { environment } from 'src/environments/environment';

import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import {AccessConfigService} from 'src/app/CloudServices/access-config.service';

import {  getStyleDropDownContent, getStyleDropDownBox, classDropDown } from '../DropDownStyle';
import {classPosDiv, getPosDiv} from '../getPosDiv';
import {CalcFatCalories} from '../Health/CalcFatCalories';
import {classConfHTMLFitHealth, classConfTableAll} from '../Health/classConfHTMLTableAll';
import { strDateTime } from '../MyStdFunctions';

import {ClassCaloriesFat, mainClassCaloriesFat} from '../Health/ClassHealthCalories';
import {ClassItem, DailyReport, mainDailyReport, ClassMeal, ClassDish} from '../Health/ClassHealthCalories';

import {ClassSubConv, mainConvItem, mainRecordConvert, mainClassUnit} from '../ClassConverter'
import {mainClassConv, ClassConv, ClassUnit, ConvItem, recordConvert} from '../ClassConverter'
import { BuiltinTypeName } from '@angular/compiler';

export class classRecipe{
  ingr:string='';
  quantity:number=0;
  unit:string='gram';
}

export class classRecordRecipe{
  typeFr:string='';
  typeEn:string='';
  name:string='';
  data:Array<any>=[];
  dataPerso:Array<any>=[];
  materiel:string='';
  materielBox:number=0;
  materielPerso:string='';
  materielPersoBox:number=0;
  nutrition=new classNutrition;
  nutritionPerso=new classNutrition;
  comments:string='';
  commentsBox:number=0;
  commentsEn:string='';
  commentsEnBox:number=0;
  commentsPerso:string='';
  commentsPersoBox:number=0;
}

export class classNutrition{
  calories:number=0;
  proteins:number=0;
  carbs:number=0;
  cholesterol:number=0;
  satFat:number=0;
  totalSat:number=0;
  totalWeight:number=0;
}

export class classFileRecipe{
  fileType:string='';
  updatedAt:string='';
  listTypeRecipe:Array<any>=[];
  recipe:Array<classRecordRecipe>=[];
}

@Component({
  selector: 'app-recipe',
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.css']
})

export class RecipeComponent {
  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageMangoDBService: ManageMangoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    @Inject(LOCALE_ID) private locale: string,
    ) { }


@Input() configServer = new configServer;
@Input() identification= new LoginIdentif;
@Input() InConvToDisplay=new mainConvItem;
@Input() dictionaryOnly:boolean=false;;

ConfigCaloriesFat=new mainClassCaloriesFat;
ConvertUnit=new mainClassConv;

returnData={
  error:0,
  outHealthData: new DailyReport
}

posDivAfterTitle= new classPosDiv;
posDivBeforeTitle= new classPosDiv;

masterFile=new classFileRecipe;
recipeFile=new classFileRecipe;
initialRecipeFile=new classFileRecipe;

Google_Bucket_Access_Root:string='https://storage.googleapis.com/storage/v1/b/';
Google_Bucket_Access_RootPOST:string='https://storage.googleapis.com/upload/storage/v1/b/';
googleBucketName:string='';
googleObjectName:string='';
myListOfObjects=new Bucket_List_Info;
theListOfObjects:Array<any>=[];
structureListOfObjects={header:'',name:'',json:''};

EventHTTPReceived:Array<boolean>=[];
Error_Access_Server:string='';
id_Animation:Array<number>=[];
TabLoop:Array<number>=[];
NbWaitHTTP:number=0;

nbCallGetRecord:number=0; 

recipe:string='';
recordRecipe:number=0;

listTypeRecipe:Array<any>=[
  {typeFr:"",
  typeEn:"",
  recipe:[]}
]

//tabButtons:Array<any>=[{En:"Save",Fr:"Sauver"},{En:"Cancel",Fr:"Annuler"},{En:"Confirm",Fr:"Confirmer"}
//          ,{En:"Submit",Fr:"Soumettre"}]

listActions:Array<string>=['Cancel','Delete','Add after', 'Add before', 'Copy','Copy ALL','Move after', 'Move before','Change value for all','Calculate nutrition facts'];
tabRecipe:Array<any>=[];
tabActionRecipe:Array<string>=['Cancel','Create','Rename','Duplicate','Delete','Reinitialise','Translate FR to UK', 'Translate UK to FR','Calculate nut. facts for all recipes','Transfer nut. facts to CalFat'];
recipeTable:Array<classFileRecipe>=[];
tabActionComments:Array<string>=['Cancel','Translate FR to UK', 'Translate UK to FR','Zoom in - Std box', 'Zoom out - Std box','Zoom in - English box', 'Zoom out - English box', 'Zoom in - Ustens. box', 'Zoom out - Ustens. box','Zoom in - Perso box', 'Zoom out - Perso box',
   'Zoom in - Ustens. Perso box', 'Zoom out - Ustens. Perso box'];

tabActionCommentsPerso:Array<string>=['Cancel','Translate FR to UK', 'Translate UK to FR','Zoom in - Perso box', 'Zoom out - Perso box', 'Zoom in - Ustens. Perso box', 'Zoom out - Ustens. Perso box','Zoom in - Std box', 'Zoom out - Std box','Zoom in - English box', 'Zoom out - English box', 
  'Zoom in - Ustens. box', 'Zoom out - Ustens. box'];


textToSearch:string='';
tabSearch:Array<any>=[];
tabListCalFat:Array<any>=[];
tabDropdownType:Array<any>=[];
tabDialog:Array<boolean>=[];
prevDialog:number=0;

fileNb:number=-1;

isDictionary:boolean=false; // @input to activate the management of the dictionary

isListOfObjectsRetrieved:boolean=false; // list of objects containing the name of the files 
isFileRetrieved:boolean=false;
isFileUpdated:boolean=false;
IsSaveConfirmed:boolean=false;

isActionComments:boolean=false; // used to trigger function dropdownComments()
isActionRecipe:boolean=false; // used to trigger function tabActionRecipe()
isListRecipe:boolean=false;

isCreateRecipeName:boolean=false; // used to provide name of recipe on Create and Duplicate
isChangeRecipeName:boolean=false; // used to trigger function onChangeName()
isDeleteRecipe:boolean=false; // used to trigger function delRecipe()
isDuplicate:boolean=false; // used to update listTypeRecipe[].recipe[] 

isChangeValueForAll:boolean=false; // used to trigger the function onChangeValues()
isChangeValueForAllPerso:boolean=false; // used to trigger the function onChangeValues()

isRecipeModified:boolean=false; 

isListTypeFr:boolean=false; //used to trigger function tabDropdownType()
isListTypeEn:boolean=false; //used to trigger function tabDropdownType()

isSearchText:boolean=false;  // used to trigger function searchText()

isIngrDropDown:boolean=false; // used to trigger function modifInput()

changeValue:number=0;
temporaryNameRecipe:string="";
posGramTabConvert:number=0;
ingrType:string="";
currentIngr:string="";
translateComment:string="";
margLeftChangeAll:number=0;
currentValue:number=0;

yourLanguage:string="FR"; // UK or FR
theStdPersoDisplay:Array<string>=['Y','N'];

eyeNutritionFact:Array<string>=['N','N'];

SpecificForm=new FormGroup({
  FileName: new FormControl('', { nonNullable: true }),
  changeValue: new FormControl('', { nonNullable: true }),
})

idText:string='';
idNb:number=0;
event={
  target:{
    value:"",
    id:"",
  }
}

radioSelect:number=-1;
selectedTypeFr:string="";
recordListType:number=-1;

delMsg:string=""; // usedd to dislay name of the recipe to delete

tabUpdateRef:Array<any>=[]; // to be used when user cancels all updates
message:string="";

searchScroll:string='hidden';
heightListType:number=0;
heightScroll:string='hidden';

// Zoom-in & out of comments boxes

heightMatCommBox:number=90;
maxHeightCommBox:number=300;
minHeightCommBox:number=40;
zoomInRate:number=0.8;
zoomOutRate:number=1.4;

// Dropdown boxes
heightActionRecipe:number=80;
heightSearchDropdown:number=0;
heightListRecipe:number=0;
theHeight:number=0;
posLeftDropDown:number=40;
posTopDropDown:number=-25;
heightDropDown:number=0;
scrollY:string='hidden';
maxHeightDropDown:number=200;
heightItemDropDown:number=25;
marginLeft:number=50;
marginTop:number=20;
styleBox:any;
styleBoxOption:any;
styleBoxAction:any;
styleBoxOptionAction:any;
styleBoxListRecipe:any;
styleBoxOptionListRecipe:any;
styleBoxListType:any;
styleBoxOptionListType:any;
styleBoxChangeAll:any;
styleBoxOptionChangeAll:any;
styleBoxChangeName:any;
styleBoxOptionChangeName:any;


// used by translate function
tabFreEng:Array<any>=[];
tabSpecChar:Array<any>=[];
specialChar:string=" ,.-'{}[]()/?*@!:;<>\|";
tabWordsFre:Array<any>=[];
tabWordsEng:Array<any>=[];
returnChar={type:"\n"};
strComments:string="";
degreC:string="°C";
wordsToConvert:Array<any>=[];
tabSubstitution:Array<any>=[];
tabWordsIn:Array<any>=[];
tabWordsOut:Array<any>=[];
dicEnFr:Array<any>=[];
dicFrEn:Array<any>=[];

ngOnInit(){
  this.googleBucketName=this.identification.recipe.bucket;
  this.listActions;
  // get list of objects
  this.GetAllObjects(0);
  this.theHeight=(this.listActions.length + 1)* 25;
  this.getRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.calories,2);
  this.getRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.convertUnit,3);
  this.getRecord(this.identification.dictionary.bucket,this.identification.dictionary.fileName,4);
  const HeightAction= 25 * this.tabActionRecipe.length + 40;
  this.styleBoxAction = {
    'width': 150 + 'px',
    'height': HeightAction + 'px',
    'position': 'absolute',
    'margin-left':'15%', 
    'margin-top':'5px',
    'z-index': '1'
  }
  this.styleBoxOptionAction = {
    'background-color':'lightgrey',
    'width': 150 + 'px',
    'height':HeightAction + 'px',
    'margin-top' :  0 + 'px',
    'margin-left': 0 + 'px',
    'overflow-x': 'hidden',
    'overflow-y': 'hidden',
    'border':'1px blue solid'
    }

    this.styleBoxListRecipe = {
      'width': 250 + 'px',
      'height': 80 + 'px',
      'position': 'absolute',
      'margin-left':'15%', 
      'margin-top':'5px',
      'display':'inline-block',
      'z-index': '1'
    }
    this.styleBoxOptionListRecipe = {
      'background-color':'lightgrey',
      'width': 250 + 'px',
      'height':80 + 'px',
      'margin-top' :  '0px',
      'margin-left':140 + 'px',
      'overflow-x': 'hidden',
      'overflow-y': 'hidden',
      'border':'1px blue solid',
      'display':'inline-block'
      }
      this.styleBoxChangeAll = {
        'width': 220 + 'px',
        'height': 150 + 'px',
        'position': 'absolute',
        'margin-left':'15%', 
        'margin-top':'0px',
        'display':'inline-block',
        'z-index': '1'
      }
      this.styleBoxOptionChangeAll = {
        'background-color':'lightgreen',
        'width': 220 + 'px',
        'height':150 + 'px',
        'margin-top' :  '0px',
        'margin-left': 20 + 'px',
        'overflow-x': 'hidden',
        'overflow-y': 'hidden',
        'border':'1px blue solid',
        'display':'inline-block'
        }

        this.styleBoxChangeName = {
          'width': 320 + 'px',
          'height': 150 + 'px',
          'position': 'absolute',
          'margin-left':'15%', 
          'margin-top':'0px',
          'display':'inline-block',
          'z-index': '1'
        }
        this.styleBoxOptionChangeName = {
          'background-color':'lightgreen',
          'width': 320 + 'px',
          'height':150 + 'px',
          'margin-top' :  '0px',
          'margin-left': 20 + 'px',
          'overflow-x': 'hidden',
          'overflow-y': 'hidden',
          'border':'1px blue solid',
          'display':'inline-block'
          }
}

selLanguage(event:string){
  if (event==='FR'){
    this.yourLanguage='FR';
  } if (event==='UK'){
    this.yourLanguage='UK';
  } 
}



RadioSelection(event:any){

this.findId(event.target.id);
// const i=parseInt(event.target.id.substring(2));
const val=this.idNb;
if (this.radioSelect!==this.idNb){
  this.resetBooleans();
  this.radioSelect=this.idNb;
  //this.tabSearch.splice(0,this.tabSearch.length);
  //this.textToSearch = "";
  if (this.idText.substring(0,4)==="List"){

  
    //const val=Number(event.target.id.substring(0,1));
    if (  this.fileNb !== Number(event.target.id)){
      this.recipeFile.recipe.splice(0,this.recipeFile.recipe.length);
      this.initialRecipeFile.recipe.splice(0,this.initialRecipeFile.recipe.length);
      this.fileNb = this.radioSelect;
      //this.getRecord(this.googleBucketName, this.myListOfObjects.items[this.fileNb].name,1);
      const nameOfFile=this.theListOfObjects[this.fileNb].header+this.theListOfObjects[this.fileNb].name+this.theListOfObjects[this.fileNb].json;
      this.getRecord(this.googleBucketName, nameOfFile,1);
      this.recordRecipe=0;
      
    } else {
        // keep the file
        this.recipeFile.recipe.splice(0,this.recipeFile.recipe.length);
        this.recipeFile.listTypeRecipe.splice(0,this.recipeFile.listTypeRecipe.length);
        this.fillFileRecord(this.initialRecipeFile,this.recipeFile);
        
    }
  } else if (this.idText.substring(0,4)==="Type"){

    if (this.idText==="TypeAll") {
      this.selectedTypeFr="ALL";
      this.recordListType=-1;
      this.radioSelect=-1;
    } else {
      this.selectedTypeFr=this.recipeFile.listTypeRecipe[this.idNb].Fr.trim();
  
      this.recordListType=this.idNb;
      // search the first record of the selected Type
      for (this.recordRecipe=0; this.recordRecipe<this.recipeFile.recipe.length && (this.recipeFile.recipe[this.recordRecipe].typeFr.trim()!==this.selectedTypeFr.trim()
        || this.recipeFile.recipe[this.recordRecipe].typeEn.trim()!==this.recipeFile.listTypeRecipe[this.idNb].En.trim()); this.recordRecipe++){}
      
    }
      if (this.isSearchText===true){
        this.event.target.id='search';
        this.event.target.value=this.textToSearch;
        this.searchText(this.event);
      };
  }
}
}

resetBooleans(){
  this.isListRecipe=false;
  this.isActionRecipe=false;
  this.isDeleteRecipe=false;
  this.isIngrDropDown=false;
  this.IsSaveConfirmed=false;
  this.isCreateRecipeName=false;
  this.tabDialog[this.prevDialog]=false;
  this.isChangeValueForAll=false;
  this.isChangeValueForAllPerso=false;
  this.isChangeRecipeName=false;
  this.isActionComments=false;
  this.isListTypeFr=false;
  this.isListTypeEn=false;
  this.isIngrDropDown=false;
}

onAction(event:any){
  
  this.resetBooleans();

  this.findId(event.target.id);
  if (this.idText==='Action'){
      this.prevDialog=this.idNb;
      this.tabDialog[this.prevDialog]=true;
      this.listActions[4]="Copy to perso";
      this.listActions[5]="Copy ALL to perso";
  } else  if (this.idText==='ActionPerso'){
      this.prevDialog=this.idNb;
      this.tabDialog[this.prevDialog]=true;
      this.listActions[4]="Copy to standard";
      this.listActions[5]="Copy ALL to standard";
  } else if (event.target.id==='listRecipe'){
      this.createDropDownRecipe();
  } else if(event.target.id==='ActionRecipe'){
    this.isActionRecipe=true;
  } else if(event.target.id==='ActionComments' || event.target.id==='ActionCommentsPerso'){
    this.isActionComments=true;
  }
}

createDropDownRecipe(){
  this.tabRecipe.splice(0,this.tabRecipe.length);

  var j = 0;
  for (var i=0; i<this .recipeFile.recipe.length; i++){
    if (this.textToSearch!==""){
      j=this.recipeFile.recipe[i].name.toLowerCase().normalize('NFD').indexOf(this.textToSearch.toLowerCase());
      if (j!==-1){
        if (this.selectedTypeFr.toLowerCase().normalize('NFD')===this.recipeFile.recipe[i].typeFr.toLowerCase().normalize('NFD') || this.selectedTypeFr==="ALL" || this.selectedTypeFr===""){
          this.tabRecipe.push({name:"",posRec:0});
          this.tabRecipe[this.tabRecipe.length-1].name = this.recipeFile.recipe[i].name.trim();
          this.tabRecipe[this.tabRecipe.length-1].posRec=i;
        }
      }
    } else { 
        if (this.selectedTypeFr.toLowerCase().normalize('NFD')===this.recipeFile.recipe[i].typeFr.toLowerCase().normalize('NFD') || this.selectedTypeFr==="ALL" || this.selectedTypeFr===""){
          this.tabRecipe.push({name:"",posRec:0});
          this.tabRecipe[this.tabRecipe.length-1].name = this.recipeFile.recipe[i].name.trim();
          this.tabRecipe[this.tabRecipe.length-1].posRec=i;
        }
    }
  }
  if (this.tabRecipe.length>1){
      this.tabRecipe.sort((a, b) => (a.name < b.name) ? -1 : 1);
      this.tabRecipe.splice(0,0,{name:"",posRec:0});
      this.tabRecipe[0].name='Cancel';
      var scrollY='hidden';
      if (this.tabRecipe.length>9){
        this.heightListRecipe=210;
        scrollY='scroll';

      } else { 
        this.heightListRecipe = this.tabRecipe.length * 25 + 15;
      }
      this.isListRecipe=true;

      this.styleBoxListRecipe = {
        'width': 205 + 'px',
        'height': this.heightListRecipe + 'px',
        'position': 'absolute',
        'margin-left':'15%', 
        'margin-top':'5px',
        'display':'inline-block',
        'z-index': '1'
      }
      this.styleBoxOptionListRecipe = {
        'background-color':'lightgrey',
        'width':205 + 'px',
        'height':this.heightListRecipe + 'px',
        'margin-top' :  '0px',
        'margin-left':140 + 'px',
        'overflow-x': 'hidden',
        'overflow-y': scrollY,
        'border':'1px blue solid',
        'display':'inline-block'
        }
      }
}


afterDropDown(event:any){
  this.tabDialog[this.prevDialog]=false;
  this.resetBooleans();
  var i=0;
  if (event.target.id==='Action'){
      if (event.target.textContent.trim()==="Cancel" ){

      } else if (event.target.textContent.trim()==="Delete" ){
        this.recipeFile.recipe[this.recordRecipe].data.splice(this.idNb,1);
        this.tabUpdateRef[this.recordRecipe].splice(this.idNb,1);
      } else if (event.target.textContent.trim()==="Add after" ){
        const pushData=new classRecipe;
        this.recipeFile.recipe[this.recordRecipe].data.splice(this.idNb+1,0,pushData);
        const pushDataPerso=new classRecipe;
        this.recipeFile.recipe[this.recordRecipe].dataPerso.push(pushDataPerso);
        this.tabUpdateRef[this.recordRecipe].splice(this.idNb+1,0,{init:0});
        this.tabUpdateRef[this.recordRecipe+1].init=-1;
      } else if (event.target.textContent.trim()==="Add before" ){
        const pushData=new classRecipe;
        this.recipeFile.recipe[this.recordRecipe].data.splice(this.idNb,0,pushData);
        const pushDataPerso=new classRecipe;
        this.recipeFile.recipe[this.recordRecipe].dataPerso.push(pushDataPerso);
        this.tabUpdateRef[this.recordRecipe].splice(this.idNb,0,{init:0});
        this.tabUpdateRef[this.recordRecipe].init=-1;
      } else if (event.target.textContent.trim().substring(0,8)==="Copy ALL" ){
        this.copyFromTo(this.recipeFile.recipe[this.recordRecipe].dataPerso,this.recipeFile.recipe[this.recordRecipe].data);
      } else if (event.target.textContent.trim().substring(0,4)==="Copy" ){
        for (i=0; i<this.recipeFile.recipe[this.recordRecipe].dataPerso.length && 
          this.recipeFile.recipe[this.recordRecipe].dataPerso[i].ingr!==""; i++){}
        if (i===this.recipeFile.recipe[this.recordRecipe].dataPerso.length){
          const pushData=new classRecipe;
          this.recipeFile.recipe[this.recordRecipe].data.push(pushData);
          const pushDataPerso=new classRecipe;
          this.recipeFile.recipe[this.recordRecipe].dataPerso.push(pushDataPerso);
          i=this.recipeFile.recipe[this.recordRecipe].dataPerso.length-1;
          
        }
        this.recipeFile.recipe[this.recordRecipe].dataPerso[i].ingr=this.recipeFile.recipe[this.recordRecipe].data[this.idNb].ingr;
        this.recipeFile.recipe[this.recordRecipe].dataPerso[i].quantity=this.recipeFile.recipe[this.recordRecipe].data[this.idNb].quantity;
        this.recipeFile.recipe[this.recordRecipe].dataPerso[i].unit=this.recipeFile.recipe[this.recordRecipe].data[this.idNb].unit;

      } else if (event.target.textContent.trim()==="Move after" ){
        if (this.idNb<this.recipeFile.recipe[this.recordRecipe].data.length-1){
          var saveData=new classRecipe;
          saveData=this.recipeFile.recipe[this.recordRecipe].data[this.idNb];
          this.recipeFile.recipe[this.recordRecipe].data[this.idNb]=this.recipeFile.recipe[this.recordRecipe].data[this.idNb+1];
          this.recipeFile.recipe[this.recordRecipe].data[this.idNb+1]=saveData;
        }
      } else if (event.target.textContent.trim()==="Move before" ){
        if (this.idNb>0){
          var saveData=new classRecipe;
          saveData=this.recipeFile.recipe[this.recordRecipe].data[this.idNb];
          this.recipeFile.recipe[this.recordRecipe].data[this.idNb]=this.recipeFile.recipe[this.recordRecipe].data[this.idNb-1];
          this.recipeFile.recipe[this.recordRecipe].data[this.idNb-1]=saveData;
        }
        
      } else if (event.target.textContent.trim()==="Change value for all" ){
        this.isChangeValueForAll=true;
        this.currentValue=this.recipeFile.recipe[this.recordRecipe].data[this.idNb].quantity;
        this.currentIngr=this.recipeFile.recipe[this.recordRecipe].data[this.idNb].ingr;
        this.margLeftChangeAll=30;
      } else if (event.target.textContent.trim()==="Calculate nutrition facts" ){
        this.calculateNutrition('std');
    }
  } 
}
afterDropDownSel(event:any){
  this.tabDialog[this.prevDialog]=false;
  this.resetBooleans();
  var i=0;
  if (event.target.id==='selRecipe'){
    if (event.target.textContent.trim()==="Cancel" ){

    } else {
        this.recordRecipe=this.tabRecipe[Number(event.target.value)].posRec ;
    }
  } else if (event.target.id.substring(0,7)==="selText"){
    this.findId(event.target.id);
    // search text is selected
    if (this.recordRecipe!==this.tabSearch[this.idNb].posRec){
        for (var i=0; i<this.recipeFile.recipe.length && this.recipeFile.recipe[i].name!==this.tabSearch[Number(this.idNb)].name; i++){};
        if (i<this.recipeFile.recipe.length){
          this.recordRecipe=this.tabSearch[Number(this.idNb)].posRec;
        };
    }
  
  } 
}


afterDropDownPerso(event:any){
  this.tabDialog[this.prevDialog]=false;
  this.resetBooleans();
  var i=0;
  if (event.target.textContent.trim()==="Cancel" ){

  } else if (event.target.textContent.trim()==="Delete" ){
      
  } else if (event.target.textContent.trim()==="Add after" ){
      const pushDataPerso=new classRecipe;
      this.recipeFile.recipe[this.recordRecipe].dataPerso.splice(this.idNb+1,0,pushDataPerso);
      const pushData=new classRecipe;
      this.recipeFile.recipe[this.recordRecipe].data.push(pushData);
  } else if (event.target.textContent.trim()==="Add before" ){
      const pushDataPerso=new classRecipe;
      this.recipeFile.recipe[this.recordRecipe].dataPerso.splice(this.idNb,0,pushDataPerso);
      const pushData=new classRecipe;
      this.recipeFile.recipe[this.recordRecipe].data.push(pushData);
  } else if (event.target.textContent.trim().substring(0,8)==="Copy ALL" ){
        this.copyFromTo(this.recipeFile.recipe[this.recordRecipe].data,this.recipeFile.recipe[this.recordRecipe].dataPerso);
  } else if (event.target.textContent.trim().substring(0,4)==="Copy" ){
      for (var i=0; i<this.recipeFile.recipe[this.recordRecipe].data.length && 
        this.recipeFile.recipe[this.recordRecipe].data[i].ingr!==""; i++){}
      if (i===this.recipeFile.recipe[this.recordRecipe].data.length){
        const pushDataPerso=new classRecipe;
        this.recipeFile.recipe[this.recordRecipe].dataPerso.push(pushDataPerso);
        const pushData=new classRecipe;
        this.recipeFile.recipe[this.recordRecipe].data.push(pushData);
        i=this.recipeFile.recipe[this.recordRecipe].data.length-1;
      }
      this.recipeFile.recipe[this.recordRecipe].data[i].ingr=this.recipeFile.recipe[this.recordRecipe].dataPerso[this.idNb].ingr;
      this.recipeFile.recipe[this.recordRecipe].data[i].quantity=this.recipeFile.recipe[this.recordRecipe].dataPerso[this.idNb].quantity;
      this.recipeFile.recipe[this.recordRecipe].data[i].unit=this.recipeFile.recipe[this.recordRecipe].dataPerso[this.idNb].unit;

  } else if (event.target.textContent.trim()==="Move after" ){
      if (this.idNb<this.recipeFile.recipe[this.recordRecipe].dataPerso.length-1){
        var saveData=new classRecipe;
        saveData=this.recipeFile.recipe[this.recordRecipe].dataPerso[this.idNb];
        this.recipeFile.recipe[this.recordRecipe].dataPerso[this.idNb]=this.recipeFile.recipe[this.recordRecipe].dataPerso[this.idNb+1];
        this.recipeFile.recipe[this.recordRecipe].dataPerso[this.idNb+1]=saveData;
      }
  } else if (event.target.textContent.trim()==="Move before" ){
      if (this.idNb>0){
        var saveData=new classRecipe;
        saveData=this.recipeFile.recipe[this.recordRecipe].dataPerso[this.idNb];
        this.recipeFile.recipe[this.recordRecipe].dataPerso[this.idNb]=this.recipeFile.recipe[this.recordRecipe].dataPerso[this.idNb-1];
        this.recipeFile.recipe[this.recordRecipe].dataPerso[this.idNb-1]=saveData;
      } 
  } else if (event.target.textContent.trim()==="Change value for all" ){
      this.isChangeValueForAllPerso=true;
      this.currentValue=this.recipeFile.recipe[this.recordRecipe].dataPerso[this.idNb].quantity;
      this.currentIngr=this.recipeFile.recipe[this.recordRecipe].dataPerso[this.idNb].ingr;
      this.margLeftChangeAll=30;
  } else if (event.target.textContent.trim()==="Calculate nutrition facts" ){
        this.calculateNutrition('perso');
    }
}

afterDropDownRecipe(event:any){
  this.tabDialog[this.prevDialog]=false;
  this.resetBooleans();
  this.isCreateRecipeName=false;
  this.isDuplicate=false;
  var i=0;
  this.isActionRecipe=false;
  if (this.tabActionRecipe[event.target.value]==="Cancel"){

  } else if (this.tabActionRecipe[event.target.value]==="Delete"){
      this.isDeleteRecipe=true;   
      this.delMsg=this.recipeFile.recipe[this.recordRecipe].name; 
      //this.styleBox=getStyleDropDownContent(90, 240);
      this.styleBox = {
        'width': 90 + 'px',
        'height': 240 + 'px',
        'position': 'absolute',
        'margin-left':'15%', 
        'margin-top':'5px',
        'z-index': '1'
      }
      //this.styleBoxOption=getStyleDropDownBox(90, 240,  0, 0, "hidden");
      this.styleBoxOption = {
        'background-color':'cyan',
        'width': 240 + 'px',
        'height':90 + 'px',
        'margin-top' :  0 + 'px',
        'margin-left': 0 + 'px',
        'overflow-x': 'hidden',
        'overflow-y': 'hidden',
        'border':'1px blue solid'
        }

  } else if (this.tabActionRecipe[event.target.value]==="Create" ){
      this.isRecipeModified=true;
      this.isCreateRecipeName=true;

  } else if (this.tabActionRecipe[event.target.value]==="Duplicate"){
      this.isRecipeModified=true;
      this.isCreateRecipeName=true;
      this.isDuplicate=true;

  } else if (this.tabActionRecipe[event.target.value]==="Rename"){
      this.isChangeRecipeName=true;
      this.temporaryNameRecipe="";
     } else  if (this.tabActionRecipe[event.target.value]==="Calculate nut. facts for all recipes"){
      this.calculateNutritionForAllRecipe();
     } else if (this.tabActionRecipe[event.target.value]==="Transfer nut. facts to CalFat"){
      this.transferToCalFat();
     } else  if (this.tabActionRecipe[event.target.value]==="Translate FR to UK"){
      this.translateComments('FrToUk');
     } else  if (this.tabActionRecipe[event.target.value]==="Translate UK to FR"){
      this.translateComments('UkToFr');
     } else  if (this.tabActionRecipe[event.target.value]==="Reinitialise"){
      this.reInitialieRecipe();
     }
}

copyFromTo(toRecord:any, fromRecord:any){
  for (var i=0; i<fromRecord.length ; i++){
    toRecord[i].ingr=fromRecord[i].ingr;
    toRecord[i].quantity=fromRecord[i].quantity;
    toRecord[i].unit=fromRecord[i].unit;
  }
}

onChangeName(event:any){
  if (event.target.id==='cancel'){
    this.isChangeRecipeName=false;
  } else if (event.target.id==='input'){
    this.temporaryNameRecipe=event.target.value.substring(0,1).toUpperCase()+event.target.value.substring(1).trim();
  } else if (event.target.id==='save'){
    this.recipeFile.recipe[this.recordRecipe].name=this.temporaryNameRecipe;
    this.updateInListType(this.temporaryNameRecipe,'FR','Rename');
    this.isRecipeModified=true;
    this.isChangeRecipeName=false;
  }
}

onChangeValues(event:any){
  var value = 0;
  if (event.target.id==="cancel"){this.resetBooleans();}
  else {
    this.changeValue=Number(this.SpecificForm.controls["changeValue"].value);
    if (this.changeValue !==0){
      
      if (this.isChangeValueForAll === true){
        value = this.changeValue / this.recipeFile.recipe[this.recordRecipe].data[this.idNb].quantity ;
        for (var i=0; i<this.recipeFile.recipe[this.recordRecipe].data.length; i++){
          this.recipeFile.recipe[this.recordRecipe].data[i].quantity = this.recipeFile.recipe[this.recordRecipe].data[i].quantity * value;
        }
        
    
      } else if (this.isChangeValueForAllPerso === true){
        value = this.changeValue / this.recipeFile.recipe[this.recordRecipe].dataPerso[this.idNb].quantity;
        for (var i=0; i<this.recipeFile.recipe[this.recordRecipe].dataPerso.length; i++){
          this.recipeFile.recipe[this.recordRecipe].dataPerso[i].quantity = this.recipeFile.recipe[this.recordRecipe].dataPerso[i].quantity * value;
        }
      }
    }
  }
  this.isChangeValueForAll=false;
  this.isChangeValueForAllPerso=false;
  this.currentIngr="";
  this.currentValue=0;

}



calculateNutrition(type:string){
  var theTotal=0;
  if (type==='std' || type==='all'){
    theTotal=0;
    this.processNutrition(this.recipeFile.recipe[this.recordRecipe].data);
    this.recipeFile.recipe[this.recordRecipe].nutrition.calories=this.returnData.outHealthData.total.Calories;
    this.recipeFile.recipe[this.recordRecipe].nutrition.carbs=this.returnData.outHealthData.total.Carbs + this.returnData.outHealthData.total.Sugar;
    this.recipeFile.recipe[this.recordRecipe].nutrition.proteins=this.returnData.outHealthData.total.Protein;
    this.recipeFile.recipe[this.recordRecipe].nutrition.cholesterol=this.returnData.outHealthData.total.Cholesterol;
    this.recipeFile.recipe[this.recordRecipe].nutrition.satFat=this.returnData.outHealthData.total.Fat.Saturated;
    this.recipeFile.recipe[this.recordRecipe].nutrition.totalSat=this.returnData.outHealthData.total.Fat.Total;
    for (var i=0; i<this.recipeFile.recipe[this.recordRecipe].data.length; i++){
      if (this.recipeFile.recipe[this.recordRecipe].data[i].unit==='gram'){
        theTotal=theTotal+Number(this.recipeFile.recipe[this.recordRecipe].data[i].quantity);
      } else {
        // convert unit
        for (var j=0; j<this.ConvertUnit.tabConv[this.posGramTabConvert].convert.length && 
          this.ConvertUnit.tabConv[this.posGramTabConvert].convert[j].toUnit!==this.recipeFile.recipe[this.recordRecipe].data[i].unit; j++ ){}
          if (j<this.ConvertUnit.tabConv[this.posGramTabConvert].convert.length){
            theTotal=theTotal+Number(this.recipeFile.recipe[this.recordRecipe].data[i].quantity) / Number(this.ConvertUnit.tabConv[this.posGramTabConvert].convert[j].value);
          } else { 
            // error 
          }
      }
    }
    this.recipeFile.recipe[this.recordRecipe].nutrition.totalWeight=theTotal;
  } 
  if (type==='perso' || type==='all'){
    this.processNutrition(this.recipeFile.recipe[this.recordRecipe].dataPerso);
    theTotal=0;
    this.recipeFile.recipe[this.recordRecipe].nutritionPerso.calories=this.returnData.outHealthData.total.Calories;
    this.recipeFile.recipe[this.recordRecipe].nutritionPerso.carbs=this.returnData.outHealthData.total.Carbs + this.returnData.outHealthData.total.Sugar;
    this.recipeFile.recipe[this.recordRecipe].nutritionPerso.proteins=this.returnData.outHealthData.total.Protein;
    this.recipeFile.recipe[this.recordRecipe].nutritionPerso.cholesterol=this.returnData.outHealthData.total.Cholesterol;
    this.recipeFile.recipe[this.recordRecipe].nutritionPerso.satFat=this.returnData.outHealthData.total.Fat.Saturated;
    this.recipeFile.recipe[this.recordRecipe].nutritionPerso.totalSat=this.returnData.outHealthData.total.Fat.Total;
    for (var i=0; i<this.recipeFile.recipe[this.recordRecipe].dataPerso.length; i++){
      if (this.recipeFile.recipe[this.recordRecipe].dataPerso[i].unit==='gram'){
        theTotal=theTotal+Number(this.recipeFile.recipe[this.recordRecipe].dataPerso[i].quantity);
      } else {
        // convert unit
        for (var j=0; j<this.ConvertUnit.tabConv[this.posGramTabConvert].convert.length && 
          this.ConvertUnit.tabConv[this.posGramTabConvert].convert[j].toUnit!==this.recipeFile.recipe[this.recordRecipe].dataPerso[i].unit; j++ ){}
          if (j<this.ConvertUnit.tabConv[this.posGramTabConvert].convert.length){
            theTotal=theTotal+Number(this.recipeFile.recipe[this.recordRecipe].dataPerso[i].quantity) / Number(this.ConvertUnit.tabConv[this.posGramTabConvert].convert[j].value);
          } else { 
            // error 
          }
      }
    }
    this.recipeFile.recipe[this.recordRecipe].nutritionPerso.totalWeight=theTotal;
  } 
  this.isRecipeModified=true;
}

processNutrition(infile:any){
var myHealth=new DailyReport;
myHealth.date=new Date();
var j=0;
const classMeal=new ClassMeal;
myHealth.meal.push(classMeal);
for (var i=0; i<infile.length; i++){
    const classDish=new ClassDish;
    myHealth.meal[0].dish.push(classDish);
    j=myHealth.meal[0].dish.length-1;
    myHealth.meal[0].dish[j].name=infile[i].ingr;
    myHealth.meal[0].dish[j].quantity=infile[i].quantity;
    myHealth.meal[0].dish[j].unit=infile[i].unit;
}
this.returnData = CalcFatCalories(this.ConfigCaloriesFat, myHealth, this.ConvertUnit);
}

/** 
selectedPosition ={ 
  x: 0,
  y: 0} ;
***/

// @HostListener('window:mouseup', ['$event'])
onMouseUp(evt: MouseEvent) {
    this.modifInput(evt);
    //this.selectedPosition = { x: evt.offsetX, y: evt.offsetY };
    //this.selectedPositionPage = { x: evt.pageX, y: evt.pageY };
    //this.selectedPositionClient = { x: evt.clientX, y: evt.clientY };
  }

filterCalFat(ingr:string){
  this.tabListCalFat.splice(0,this.tabListCalFat.length);
  var j=-1;
  for (var i=0; i<this.ConfigCaloriesFat.tabCaloriesFat.length; i++){
    for (var k=0; k<this.ConfigCaloriesFat.tabCaloriesFat[i].Content.length; k++){
      if (this.ConfigCaloriesFat.tabCaloriesFat[i].Content[k].Name.toLowerCase().indexOf(ingr.toLowerCase().trim()) !== -1){
        j++
        this.tabListCalFat.push({name:"",serving:"",unit:""})
        this.tabListCalFat[j].name=this.ConfigCaloriesFat.tabCaloriesFat[i].Content[k].Name;
        this.tabListCalFat[j].serving=this.ConfigCaloriesFat.tabCaloriesFat[i].Content[k].Serving;
        this.tabListCalFat[j].unit=this.ConfigCaloriesFat.tabCaloriesFat[i].Content[k].ServingUnit;
        this.tabListCalFat.sort((a, b) => (a.name < b.name) ? -1 : 1);
      }
    }
  }
  if (this.tabListCalFat.length!==0){
    this.isIngrDropDown=true;
    if (this.tabListCalFat.length *  this.heightItemDropDown > this.maxHeightDropDown){
      this.heightDropDown=this.maxHeightDropDown;
      this.scrollY='scroll';
    } else {
      this.heightDropDown=this.tabListCalFat.length *  this.heightItemDropDown;
      this.scrollY='hidden';
    }
    this.styleBox=getStyleDropDownContent(this.heightDropDown, 230 );
    this.styleBoxOption=getStyleDropDownBox(this.heightDropDown, 230, 0 , 0, this.scrollY);
  } else {
    this.isIngrDropDown=false;
  }
  
}

translateComments(lang:string){
  if (this.dicFrEn.length===0){ // French To English
    for (var i=0; i<this.tabFreEng.length; i++){
      this.dicFrEn.push({outLang:"",inLang:"",nbWordsOut:0,nbWordsIn:0});
      this.dicFrEn[i].outLang=this.tabFreEng[i].English;
      this.dicFrEn[i].inLang=this.tabFreEng[i].French;
      this.dicFrEn[i].nbWordsOut=this.tabFreEng[i].nbWordsEn;
      this.dicFrEn[i].nbWordsIn=this.tabFreEng[i].nbWordsFr;
    }
    this.dicFrEn.sort((a, b) => (a.nbWordsIn > b.nbWordsIn) ? -1 : 1);
  }  
  if (this.dicEnFr.length===0){ // English To French
    for (var i=0; i<this.tabFreEng.length; i++){
      this.dicEnFr.push({outLang:"",inLang:"",nbWordsOut:0,nbWordsIn:0});
      this.dicEnFr[i].outLang=this.tabFreEng[i].French;
      this.dicEnFr[i].inLang=this.tabFreEng[i].English;
      this.dicEnFr[i].nbWordsOut=this.tabFreEng[i].nbWordsFr;
      this.dicEnFr[i].nbWordsIn=this.tabFreEng[i].nbWordsEn;
    }
    this.dicEnFr.sort((a, b) => (a.nbWordsIn > b.nbWordsIn) ? -1 : 1);
  }
  if (lang==='FrToUk' && this.recipeFile.recipe[this.recordRecipe].comments!==''){
    this.recipeFile.recipe[this.recordRecipe].commentsEn=this.processTranslation(this.dicFrEn,lang,  this.recipeFile.recipe[this.recordRecipe].comments);
  } else if (lang==='UkToFr' && this.recipeFile.recipe[this.recordRecipe].commentsEn!==''){
    this.recipeFile.recipe[this.recordRecipe].comments=this.processTranslation(this.dicEnFr,lang,  this.recipeFile.recipe[this.recordRecipe].commentsEn);
  }
}

processTranslation(dico:any,lang:string,inComments:string){
var iSubstitution:number=-1;
var i=0;
var j=0;
const allZ:string='ZZZZZ';
var theComments:string="";
var trouve = false;
this.tabSpecChar.splice(0,this.tabSpecChar.length);
this.tabWordsFre.splice(0,this.tabWordsFre.length);
this.tabWordsEng.splice(0,this.tabWordsEng.length);
this.tabSubstitution.splice(0,this.tabSubstitution.length);


for (i=0; i<inComments.length && trouve===false; i++){
  j = inComments.substring(i).indexOf("0C");
  if (j!==-1){
    inComments=inComments.substring(0,i+j)+this.degreC+inComments.substring(i+j+2);
    i=i+j+2;
  } else {trouve=true;}
}
theComments=inComments;

for (var i=0; i<dico.length; i++){
    if (dico[i].nbWordsIn !== 1){ 
      j=theComments.toLowerCase().indexOf(dico[i].inLang.toLowerCase().trim());
      if (j!==-1){
          iSubstitution++;
          this.tabSubstitution.push({textIn:"", textOut:"",pos:0});
          this.tabSubstitution[iSubstitution].textEn=dico[i].outLang.trim();;
          this.tabSubstitution[iSubstitution].textFr=dico[i].inLang.trim();;
          this.tabSubstitution[iSubstitution].pos=j;
  
          if (theComments.substring(j,j+1)===theComments.substring(j,j+1).toUpperCase()){
            this.tabSubstitution[iSubstitution].textOut=dico[i].outLang.substring(0,1).toUpperCase() + dico[i].outLang.substring(1);
          }
          var text= theComments.substring(0,j) + allZ + theComments.substring(j+dico[i].inLang.trim().length);
          theComments=text;
      }
    }
  }


// first: convert long sentences
var strComments=JSON.stringify(theComments);
var lineBreak=JSON.stringify(this.returnChar);
this.tabSubstitution.sort((a, b) => (a.pos < b.pos) ? -1 : 1);

// search special characters
for (i=1; i<strComments.length; i++){
  if (strComments.substring(i,i+2)!==lineBreak.substring(9,11)){
    j=this.specialChar.indexOf(strComments.substring(i,i+1));
    if (j!== -1){
      if (this.tabSpecChar.length>1 && this.tabSpecChar[this.tabSpecChar.length-1].pos+this.tabSpecChar[this.tabSpecChar.length-1].char.length === i){
        this.tabSpecChar[this.tabSpecChar.length-1].char=this.tabSpecChar[this.tabSpecChar.length-1].char+strComments.substring(i,i+1);
      } else {
        this.tabSpecChar.push({pos:0,char:""}); 
        this.tabSpecChar[this.tabSpecChar.length-1].pos=i;
        this.tabSpecChar[this.tabSpecChar.length-1].char=strComments.substring(i,i+1);
      }
    }
  } else {
    if (this.tabSpecChar.length>1 && this.tabSpecChar[this.tabSpecChar.length-1].pos+this.tabSpecChar[this.tabSpecChar.length-1].char.length === i){
      this.tabSpecChar[this.tabSpecChar.length-1].char=this.tabSpecChar[this.tabSpecChar.length-1].char+lineBreak.substring(9,11);
    } else {
      this.tabSpecChar.push({pos:0,char:""});  
      this.tabSpecChar[this.tabSpecChar.length-1].pos=i;
      this.tabSpecChar[this.tabSpecChar.length-1].char=lineBreak.substring(9,11);
    }
    i++;
  }
}
if (this.tabSpecChar[this.tabSpecChar.length-1].pos < strComments.length-1){
      this.tabSpecChar.push({pos:0,char:""});  
      this.tabSpecChar[this.tabSpecChar.length-1].pos=strComments.length-1;
      this.tabSpecChar[this.tabSpecChar.length-1].char="";
}

var tabMajuscule=[];
j=-1;
for (i=0; i<this.tabSpecChar.length; i++){
  j++;
  if (i===0){
    this.tabWordsIn[j]=strComments.substring(1,this.tabSpecChar[i].pos);
  } else {
    this.tabWordsIn[j]=strComments.substring(this.tabSpecChar[i-1].pos+this.tabSpecChar[i-1].char.length,this.tabSpecChar[i].pos);
  }
  if (this.tabWordsIn[j].substring(0,1)===this.tabWordsIn[j].substring(0,1).toUpperCase()){
    tabMajuscule[j]=true;
  } else { tabMajuscule[j]=false;}
}
if (strComments.length > this.tabSpecChar[this.tabSpecChar.length-1].pos+2){
  j++;
  this.tabWordsIn[j]=strComments.substring(this.tabSpecChar[this.tabSpecChar.length-1].pos+2, strComments.length - 1);
}

iSubstitution=-1;
this.convertFrEng(dico);

var myText="";
iSubstitution=-1;
var InText="";
var InLengthText:number=0;
var newText=theComments;
var k = 0;
for (var i=0; i<this.tabWordsIn.length; i++){
  j= newText.substring(k).indexOf(this.tabWordsIn[i]);
  if (this.tabWordsOut[i]===allZ){
    iSubstitution++;
    InText=this.tabSubstitution[iSubstitution].textOut;
    InLengthText==this.tabSubstitution[iSubstitution].textIn.length;
  } else {
    
    if (tabMajuscule[i]===true){
      InText= this.tabWordsOut[i].substring(0,1).toUpperCase() + this.tabWordsOut[i].substring(1);
    } else {
      InText= this.tabWordsOut[i];
    }
    InLengthText=this.tabWordsIn[i].length;
  }
  if (j!==-1){
    if (i!==0){
      myText=newText.substring(0, j + k) + InText + 
      newText.substring(j+k+this.tabWordsIn[i].length);
    } else {
      myText=InText + 
              newText.substring(j + k +this.tabWordsIn[i].length);
    }
    newText=myText;
    k = k + j + this.tabWordsOut[i].length;
      
  }
}
return(newText);

}

convertFrEng(dico:any){
  var i = 0;
  var j = 0;
  for (j=0; j<this.tabWordsIn.length; j++){
    for (i=0; i<dico.length && dico[i].inLang.trim().toLowerCase()!==this.tabWordsIn[j].trim().toLowerCase(); i++){};
    if (i<dico.length){
      this.tabWordsOut[j]=dico[i].outLang;

    } else { // translation not found keep the word 
      this.tabWordsOut[j]=this.tabWordsIn[j];

    }
  }
}

nameRecipe(event:any){
  var trouve=false;
  if (event.target.id==='input'){
    this.temporaryNameRecipe=event.target.value.substring(0,1).toUpperCase()+event.target.value.substring(1).trim();
  } else if (event.target.id==='save'){
    
      const saveRecord=this.recordRecipe;
      const classRecord=new classRecordRecipe;
      this.recipeFile.recipe.push(classRecord);
      this.recordRecipe=this.recipeFile.recipe.length-1;
      const pushData=new classRecipe;
      this.recipeFile.recipe[this.recordRecipe].data.push(pushData);
      const pushDataPerso=new classRecipe;
      this.recipeFile.recipe[this.recordRecipe].dataPerso.push(pushDataPerso);
      
      if (this.isCreateRecipeName===true && this.isDuplicate===false){
          this.recipeFile.recipe[this.recordRecipe].name="";
          this.recipeFile.recipe[this.recordRecipe].commentsBox=this.minHeightCommBox;
          this.recipeFile.recipe[this.recordRecipe].commentsPersoBox=this.minHeightCommBox;
          this.recipeFile.recipe[this.recordRecipe].commentsEnBox=this.minHeightCommBox;
          this.recipeFile.recipe[this.recordRecipe].materielBox=this.minHeightCommBox;
          this.recipeFile.recipe[this.recordRecipe].materielPersoBox=this.minHeightCommBox;
      } else {
          this.fillInRecord(this.recipeFile.recipe[saveRecord],this.recipeFile.recipe[this.recordRecipe]);
        }
      this.tabUpdateRef.push({init:0});
      this.tabUpdateRef[this.tabUpdateRef.length-1].init=-1;
      this.recipeFile.recipe[this.recordRecipe].name=this.temporaryNameRecipe;
      if (this.isDuplicate===false){
        for (var i=0; i<this.recipeFile.listTypeRecipe.length && trouve===false; i++){
            if (this.recipeFile.listTypeRecipe[i].Fr===this.recipeFile.recipe[this.recordRecipe].typeFr && 
                  this.recipeFile.listTypeRecipe[i].En===this.recipeFile.recipe[this.recordRecipe].typeEn) {
                    this.recipeFile.listTypeRecipe[i].recipe.push(this.temporaryNameRecipe);
                    trouve=true;
              }
          }
      } else {
        this.updateTypeName(this.recipeFile,'','',"Fr",this.recipeFile.recipe[this.recordRecipe].name);
      }
      this.isDuplicate=false;
      this.isCreateRecipeName=false;
      this.isRecipeModified=true;
  } else if (event.target.id==='clear'){
      this.temporaryNameRecipe="";
  } else if (event.target.id==='cancel'){
      this.recipeFile.recipe.splice(this.recordRecipe,1);
      this.temporaryNameRecipe="";
      this.recordRecipe=0;
      this.resetBooleans();
  }
}

delRecipe(event:any){
  this.isDeleteRecipe=false;
  if (event.target.id==='YesDelConfirm'){
    this.isRecipeModified=true;
    this.updateInListType(this.recipeFile.recipe[this.recordRecipe].name,'FR','Delete');
/*
    for (var i=this.recordRecipe+1; i<this.tabUpdateRef.length; i++){
        if (this.tabUpdateRef[i].init!==-1){
          this.tabUpdateRef[i].init=this.tabUpdateRef[i].init-1;
        }
    }
*/
    this.tabUpdateRef.splice(this.recordRecipe,1);
    this.recipeFile.recipe.splice(this.recordRecipe,1); // delete the whole recipe 
    this.recordRecipe=0;
    if (this.isSearchText===true){
      this.event.target.id='search';
      this.event.target.value=this.textToSearch;
      this.searchText(this.event);
      if (this.tabSearch.length>0){
        this.recordRecipe=this.tabSearch[0].posRec;
      }
    } 

  }
}

findId(id:string){
  const i=id.indexOf('-');
  if (i===-1){
    this.idText=id;
    this.idNb=0;
  } else {
    this.idText=id.substring(0,i);
    this.idNb=Number(id.substring(i+1));
  }
}


searchText(event:any){
  this.resetBooleans();
  var j=-1;
  if (event.target.id==='search'){
    this.isSearchText=true;
    this.textToSearch = event.target.value.substring(0,1).toUpperCase() + event.target.value.substring(1).trim();
    var theText= event.target.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    this.tabSearch.splice(0,this.tabSearch.length);

    for (var i=0; i<this.recipeFile.recipe.length; i++){
      if (this.radioSelect===-1 || (this.radioSelect!==-1 && this.recipeFile.listTypeRecipe[this.radioSelect].En===this.recipeFile.recipe[i].typeEn && 
        this.recipeFile.listTypeRecipe[this.radioSelect].Fr===this.recipeFile.recipe[i].typeFr)){
        if (this.recipeFile.recipe[i].name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').indexOf(theText)!==-1 || theText===""){
       
       // if (this.selectedTypeFr.toLowerCase().normalize('NFD')===this.recipeFile.recipe[i].typeFr.toLowerCase().normalize('NFD') || this.selectedTypeFr==="ALL" || this.selectedTypeFr===""){
          this.tabSearch.push({name:"",posRec:0})
          j++
          this.tabSearch[j].name=this.recipeFile.recipe[i].name.trim();
          this.tabSearch[j].posRec=i;
        //}
        }
      }
    }
    this.tabSearch.sort((a, b) => (a.name < b.name) ? -1 : 1);
    if (this.tabSearch.length>9){
      this.heightSearchDropdown=200;
      this.searchScroll="scroll";

    } else {
      this.heightSearchDropdown=25*this.tabSearch.length;
      this.searchScroll="hidden";
    }
  } else if (event.target.id==='cancel'){
    this.isSearchText=false;
    this.textToSearch = "";
    this.heightSearchDropdown=0;
    this.searchScroll="hidden";
    this.tabSearch.splice(0,this.tabSearch.length);
    this.resetBooleans();
  }
}

modifInput(event:any){
  this.resetBooleans();
  this.findId(event.target.id);
  this.isIngrDropDown=false;
  this.isRecipeModified=true;
  if (this.idText==="ingr"){
      this.recipeFile.recipe[this.recordRecipe].data[this.idNb].ingr=event.target.value;
      this.ingrType=this.idText;
      this.filterCalFat(event.target.value);
  } else if (this.idText==="selingr"){
    this.recipeFile.recipe[this.recordRecipe].data[this.idNb].ingr=this.tabListCalFat[event.target.value].name.trim();
  } else if (this.idText==="quantity"){
    this.recipeFile.recipe[this.recordRecipe].data[this.idNb].quantity=event.target.value;
  } else if (this.idText==="unit"){
    this.recipeFile.recipe[this.recordRecipe].data[this.idNb].unit=event.target.value;
  } else if (this.idText==="ingrPerso"){
    this.recipeFile.recipe[this.recordRecipe].dataPerso[this.idNb].ingr=event.target.value;
    this.ingrType=this.idText;
    this.filterCalFat(event.target.value);
  } else if (this.idText==="selingrPerso"){
    this.recipeFile.recipe[this.recordRecipe].dataPerso[this.idNb].ingr=this.tabListCalFat[event.target.value].name.trim();
  } else if (this.idText==="quantityPerso"){
    this.recipeFile.recipe[this.recordRecipe].dataPerso[this.idNb].quantity=event.target.value;
  } else if (this.idText==="unitPerso"){
    this.recipeFile.recipe[this.recordRecipe].dataPerso[this.idNb].unit=event.target.value;
  } else if (this.idText==="comments"){
    this.recipeFile.recipe[this.recordRecipe].comments=event.target.value;
    //this.calculateHeight();
  } else if (this.idText==="commentsEn"){
    this.recipeFile.recipe[this.recordRecipe].commentsEn=event.target.value;
    //this.calculateHeight();
  } else if (this.idText==="commentsPerso"){
    this.recipeFile.recipe[this.recordRecipe].commentsPerso=event.target.value;
    //this.calculateHeight();
  } else if (this.idText==="materiel"){
    this.recipeFile.recipe[this.recordRecipe].materiel=event.target.value;
    //this.calculateHeight();
  } else if (this.idText==="materielPerso"){
    this.recipeFile.recipe[this.recordRecipe].materielPerso=event.target.value;
    //this.calculateHeight();
  }
  
}


dropdownComments(event:any){
  this.resetBooleans();
  this.isActionComments=false;
  if (this.tabActionComments[event.target.value]==="Translate FR to UK"){
    this.translateComments('FrToUk');
   } else if (this.tabActionComments[event.target.value]==="Translate UK to FR"){
    this.translateComments('UkToFr');
   } else if (this.tabActionComments[event.target.value]==="Zoom in - Std box"){
    this.recipeFile.recipe[this.recordRecipe].commentsBox= this.calculateZoom(this.recipeFile.recipe[this.recordRecipe].commentsBox, this.zoomInRate, "in");
   } else if (this.tabActionComments[event.target.value]==="Zoom out - Std box"){
    this.recipeFile.recipe[this.recordRecipe].commentsBox=this.calculateZoom(this.recipeFile.recipe[this.recordRecipe].commentsBox, this.zoomOutRate, "out");
   } else if (this.tabActionComments[event.target.value]==="Zoom in - English box"){
    this.recipeFile.recipe[this.recordRecipe].commentsEnBox= this.calculateZoom(this.recipeFile.recipe[this.recordRecipe].commentsEnBox, this.zoomInRate, "in");
   } else if (this.tabActionComments[event.target.value]==="Zoom out - English box"){
    this.recipeFile.recipe[this.recordRecipe].commentsEnBox= this.calculateZoom(this.recipeFile.recipe[this.recordRecipe].commentsEnBox, this.zoomOutRate, "out");
   } else if (this.tabActionComments[event.target.value]==="Zoom in - Perso box"){
    this.recipeFile.recipe[this.recordRecipe].commentsPersoBox= this.calculateZoom(this.recipeFile.recipe[this.recordRecipe].commentsPersoBox, this.zoomInRate, "in");
   } else if (this.tabActionComments[event.target.value]==="Zoom out - Perso box"){
    this.recipeFile.recipe[this.recordRecipe].commentsPersoBox= this.calculateZoom(this.recipeFile.recipe[this.recordRecipe].commentsPersoBox, this.zoomOutRate, "out");
   } else if (this.tabActionComments[event.target.value]==="Zoom in - Ustens. box"){
    this.recipeFile.recipe[this.recordRecipe].materielBox= this.calculateZoom(this.recipeFile.recipe[this.recordRecipe].materielBox, this.zoomInRate, "in")
   } else if (this.tabActionComments[event.target.value]==="Zoom out - Ustens. box"){
    this.recipeFile.recipe[this.recordRecipe].materielBox= this.calculateZoom(this.recipeFile.recipe[this.recordRecipe].materielBox, this.zoomOutRate, "out");
   } else if (this.tabActionComments[event.target.value]==="Zoom in - Ustens. Perso box"){
    this.recipeFile.recipe[this.recordRecipe].materielPersoBox= this.calculateZoom(this.recipeFile.recipe[this.recordRecipe].materielPersoBox, this.zoomInRate, "in");
   } else if (this.tabActionComments[event.target.value]==="Zoom out - Ustens. Perso box"){
    this.recipeFile.recipe[this.recordRecipe].materielPersoBox= this.calculateZoom(this.recipeFile.recipe[this.recordRecipe].materielPersoBox, this.zoomOutRate, "out");
   } 
}



calculateZoom(inRecord:any, rate:number, zoom:string){
  var theHeight=0;
  if (inRecord===0){
    theHeight = this.minHeightCommBox;
  } else
  if (zoom==="in"){
    theHeight=inRecord * rate;
    if (theHeight < this.minHeightCommBox){
      theHeight = this.minHeightCommBox;
    }
  } else if (zoom==="out"){
    if (inRecord<this.maxHeightCommBox/2.5){
      theHeight=inRecord * 1.8;
    } else {
      theHeight=inRecord * rate;
    }
    if (theHeight > this.maxHeightCommBox){
        theHeight = this.maxHeightCommBox;
    }
  }
  return(theHeight);
}

selStdPer(event:any){
  if (event.target.id==='eyeStd'){
    if (this.theStdPersoDisplay[0]==='Y'){
      this.theStdPersoDisplay[0]='N';
    } else {
      this.theStdPersoDisplay[0]='Y';
    }
  } else if (event.target.id==='eyePerso'){
    if (this.theStdPersoDisplay[1]==='Y'){
      this.theStdPersoDisplay[1]='N';
    } else {
      this.theStdPersoDisplay[1]='Y';
    }
  }
}

selEyeNutFact(event:any){
  if (event.target.id==='eyeStd'){
    if (this.eyeNutritionFact[0]==='Y'){
      this.eyeNutritionFact[0]='N';
    } else {
      this.eyeNutritionFact[0]='Y';
    }
  } else if (event.target.id==='eyePerso'){
    if (this.eyeNutritionFact[1]==='Y'){
      this.eyeNutritionFact[1]='N';
    } else {
      this.eyeNutritionFact[1]='Y';
    }
  }
}


fillFileRecord(inFile:any,outFile:any){
  outFile.fileType=inFile.fileType;
  for (var i=0; i<inFile.listTypeRecipe.length; i++){
      outFile.listTypeRecipe.push({Fr:'',En:'',recipe:[]});
      outFile.listTypeRecipe[i].Fr=inFile.listTypeRecipe[i].Fr;
      outFile.listTypeRecipe[i].En=inFile.listTypeRecipe[i].En;
      for (var j=0; j<inFile.listTypeRecipe[i].recipe.length; j++){
        outFile.listTypeRecipe[i].recipe[j]=inFile.listTypeRecipe[i].recipe[j];
      }
  }

  for (var i=0; i<inFile.recipe.length; i++){
      const classRecord=new classRecordRecipe;
      outFile.recipe.push(classRecord);
      this.fillInRecord(inFile.recipe[i],outFile.recipe[outFile.recipe.length-1]);
    }
  }

reInitialieRecipe(){
  if (this.tabUpdateRef[this.recordRecipe]!==-1){
    this.recipeFile.recipe[this.recordRecipe].data.splice(0,this.recipeFile.recipe[this.recordRecipe].data.length);
    this.recipeFile.recipe[this.recordRecipe].dataPerso.splice(0,this.recipeFile.recipe[this.recordRecipe].dataPerso.length);
    this.fillInRecord(this.initialRecipeFile.recipe[this.tabUpdateRef[this.recordRecipe].init],this.recipeFile.recipe[this.recordRecipe]);
  }
  
}

onInputType(event:any){
    this.resetBooleans();
    const theValue=event.target.value.substring(0,1).toUpperCase()+event.target.value.substring(1).trim();
    if (event.target.id==='Fr'){
      this.updateTypeName(this.recipeFile,theValue,this.recipeFile.recipe[this.recordRecipe].typeFr.trim(),"Fr",this.recipeFile.recipe[this.recordRecipe].name.trim());
      this.recipeFile.recipe[this.recordRecipe].typeFr=theValue;
      if (this.tabDropdownType.length>1){
        this.isListTypeFr=true;
      }
    } else if (event.target.id==='En'){
      this.updateTypeName(this.recipeFile,theValue,this.recipeFile.recipe[this.recordRecipe].typeEn.trim(),"En",this.recipeFile.recipe[this.recordRecipe].name.trim());
      this.recipeFile.recipe[this.recordRecipe].typeEn=theValue;
      if (this.tabDropdownType.length>1){
        this.isListTypeEn=true;
      }
    } 
    this.createTabDropdownType(this.recipeFile.listTypeRecipe,event.target.id.toUpperCase(),theValue);
    if (this.isSearchText===true){
      this.event.target.id='search';
      this.event.target.value=this.textToSearch;
      this.searchText(this.event);
    };
  }


updateInListType(recipeName:string,lang:string,action:string){
  var i=0;
  var theValue="ALL";
  if (lang==="FR"){
    for (i=0; i<this.recipeFile.listTypeRecipe.length && this.recipeFile.listTypeRecipe[i].Fr!==this.recipeFile.recipe[this.recordRecipe].typeFr; i++){}
  } else if (lang==="UK"){
    for (i=0; i<this.recipeFile.listTypeRecipe.length && this.recipeFile.listTypeRecipe[i].En!==this.recipeFile.recipe[this.recordRecipe].typeEn; i++){}
  }
  if (i<this.recipeFile.listTypeRecipe.length){ 
    if (action==="Delete"){
        if (this.recipeFile.listTypeRecipe[i].recipe.length===1){ // only one recipe exists so delete the type
            this.recipeFile.listTypeRecipe.splice(i,1);
        } else { // more than one recipe exists

            for (var k=0; k<this.recipeFile.listTypeRecipe[i].recipe.length && this.recipeFile.listTypeRecipe[i].recipe[k]!==recipeName; k++){};
            this.recipeFile.listTypeRecipe[i].recipe.splice(k,1); // remove the recipe only
            if (lang==="FR"){ theValue=this.recipeFile.listTypeRecipe[i].Fr}
            else if (lang==="UK") {this.recipeFile.listTypeRecipe[i].En};
        }
    } else if (action==="Rename"){
        for (var k=0; k<this.recipeFile.listTypeRecipe[i].recipe.length && this.recipeFile.listTypeRecipe[i].recipe[k]!==recipeName; k++){};
        this.recipeFile.listTypeRecipe[i].recipe[k-1]=recipeName;
        if (lang==="FR"){ theValue=this.recipeFile.listTypeRecipe[i].Fr}
        else if (lang==="UK") {this.recipeFile.listTypeRecipe[i].En};
    } 
    this.createTabDropdownType(this.recipeFile.listTypeRecipe,lang,theValue);
    if (this.isListRecipe===true){
      this.createDropDownRecipe();
    }
    if (this.isSearchText===true){
        this.event.target.id='search';
        this.event.target.value=this.textToSearch;
        this.searchText(this.event);
      };
  }
}


createTabDropdownType(record:any,lang:string,text:string){
  var j=0;
  this.tabDropdownType.splice(0, this.tabDropdownType.length);
  this.tabDropdownType.push({name:'Cancel'});
  var trouve=false;
  if (lang==='FR'){
    for (var i=0; i<record.length; i++){
      if (record[i].Fr.indexOf(text)!==-1){
        for (var j=0; j<this.tabDropdownType.length && trouve===false; j++){
          if (this.tabDropdownType[j].name.trim()===record[i].Fr.trim()){
            trouve=true;
          }
        }
        if (trouve===false){
          this.tabDropdownType.push({name:''});
          this.tabDropdownType[this.tabDropdownType.length-1].name=record[i].Fr.trim();
        }
      }
    }
  }
else {
    for (var i=0; i<record.length; i++){
      if (record[i].En.indexOf(text)!==-1){
        for (var j=0; j<this.tabDropdownType.length && trouve===false; j++){
          if (this.tabDropdownType[j].name.trim()===record[i].En.trim()){
            trouve=true;
          }
        }
        if (trouve===false){
          this.tabDropdownType.push({name:''});
          this.tabDropdownType[this.tabDropdownType.length-1].name=record[i].En.trim();
        }
      }
    }
  }
  var theHeight=0
  scrollY='hidden';
  if (this.tabDropdownType.length===2){
      this.tabDropdownType.splice(0, this.tabDropdownType.length);
      this.isListTypeFr=false;
      this.isListTypeEn=false;
  } else if (this.tabDropdownType.length>8){
    var theHeight=240;
    var scrollY='scroll';
  } else { 
    theHeight=this.tabDropdownType.length * 30;
  }

  this.styleBoxListType = {

    'position': 'absolute',
    'margin-left':'10px', 
    'margin-top':'5px',
    'display':'inline-block',
    'z-index': '1'
  }
  this.styleBoxOptionListType = {
    'background-color':'lightgrey',
    'width':150 + 'px',
    'height':theHeight + 'px',
    'margin-top' :  '0px',
    'margin-left':10 + 'px',
    'overflow-x': 'hidden',
    'overflow-y': scrollY,
    'border':'1px blue solid',
    'display':'inline-block'
    }

}

onDropdownListType(event:any){
  if (event.target.textContent.trim()==='Cancel'){

  } else if (this.isListTypeFr==true){
    this.updateTypeName(this.recipeFile,event.target.textContent.trim(),this.recipeFile.recipe[this.recordRecipe].typeFr,"Fr",this.recipeFile.recipe[this.recordRecipe].name);
    this.recipeFile.recipe[this.recordRecipe].typeFr=event.target.textContent.trim();
    
  } else {
    this.updateTypeName(this.recipeFile,event.target.textContent.trim(),this.recipeFile.recipe[this.recordRecipe].typeEn,"En",this.recipeFile.recipe[this.recordRecipe].name);
    this.recipeFile.recipe[this.recordRecipe].typeEn=event.target.textContent.trim();
    
    
  }
  this.resetBooleans();
}

updateTypeName(inFile:any,newType:string,oldType:string,lang:string,recipeName:string){
  var trouve=false;
  var iType=0;
  if (oldType===""){
    if (lang==='Fr'){
        // search if En type exists
        for (var i=0; i<inFile.listTypeRecipe.length && trouve===false; i++){
          if (inFile.listTypeRecipe[i].En===inFile.recipe[this.recordRecipe].typeEn && inFile.listTypeRecipe[i].Fr===''){
            trouve=true;
            iType=i;
          }
        };
        if (trouve===true){
          inFile.listTypeRecipe[iType].Fr=newType;
        } else {
          inFile.listTypeRecipe.push({Fr:'',En:'',recipe:[]});
          inFile.listTypeRecipe[inFile.listTypeRecipe.length-1].Fr=newType;
          inFile.listTypeRecipe[inFile.listTypeRecipe.length-1].En="";
        }
    } else {
      for (var i=0; i<inFile.listTypeRecipe.length && trouve===false; i++){
        if (inFile.listTypeRecipe[i].Fr===inFile.recipe[this.recordRecipe].typeFr && inFile.listTypeRecipe[i].En===''){
          trouve=true;
          iType=i;
        }
      };
      if (trouve===true){
        inFile.listTypeRecipe[iType].En=newType;
      } else {
          inFile.listTypeRecipe.push({Fr:'',En:'',recipe:[]});
          inFile.listTypeRecipe[inFile.listTypeRecipe.length-1].Fr="";
          inFile.listTypeRecipe[inFile.listTypeRecipe.length-1].En=newType;
      }
    }
    inFile.listTypeRecipe[inFile.listTypeRecipe.length-1].recipe[0]=recipeName;
  } else if (oldType!==""){ 
    if (newType !== oldType){
        if (lang==='Fr'){
          trouve=false;
          for (var i=0; i<inFile.listTypeRecipe.length && trouve===false; i++){
            if (inFile.listTypeRecipe[i].Fr===oldType
            && inFile.listTypeRecipe[i].En===inFile.recipe[this.recordRecipe].typeEn){
              trouve=true;
            }
          };
          if (trouve===true){i--;}
          trouve=false;
          for (var j=0; j<inFile.listTypeRecipe.length && trouve===false; j++){
              if (inFile.listTypeRecipe[j].Fr===newType 
                && inFile.listTypeRecipe[i].En===inFile.recipe[this.recordRecipe].typeEn){
                trouve=true;
              }
          };
          if (trouve===true){j--;}
        } else {
          trouve=false;
          for (var i=0; i<inFile.listTypeRecipe.length && trouve===false; i++){
            if (inFile.listTypeRecipe[i].En===oldType
            && inFile.listTypeRecipe[i].Fr===inFile.recipe[this.recordRecipe].typeFr){
              trouve=true;
            }
          };
          if (trouve===true){i--;}
          trouve=false;
          for (var j=0; j<inFile.listTypeRecipe.length && trouve===false; j++){
            if (inFile.listTypeRecipe[j].En===newType && inFile.listTypeRecipe[i].En===inFile.recipe[this.recordRecipe].typeEn){
              trouve=true;
            }
          };
          if (trouve===true){j--;}
        }
        
        if (j<inFile.listTypeRecipe.length){// new type exists; 
          if (inFile.recipe[this.recordRecipe].typeFr===""){
            inFile.recipe[this.recordRecipe].typeFr=inFile.listTypeRecipe[j].Fr;
          }
          if (inFile.recipe[this.recordRecipe].typeEn===""){
            inFile.recipe[this.recordRecipe].typeEn=inFile.listTypeRecipe[j].En;
          }
          for (var k=0; k<inFile.listTypeRecipe[j].recipe.length && inFile.listTypeRecipe[j].recipe[k]!==recipeName; k++){};
          if (k===inFile.listTypeRecipe[j].recipe.length){ // recipe does not exist
            inFile.listTypeRecipe[j].recipe[k]=recipeName; //add name of recipe 
          };
          
        } else {
          // create a new type
          if (i<inFile.listTypeRecipe.length){
            inFile.listTypeRecipe.push({Fr:'',En:'',recipe:[]});
            if (lang==='Fr'){
                inFile.listTypeRecipe[inFile.listTypeRecipe.length-1].Fr=newType;
                inFile.listTypeRecipe[inFile.listTypeRecipe.length-1].En=inFile.listTypeRecipe[i].En;
            } else {
                inFile.listTypeRecipe[inFile.listTypeRecipe.length-1].Fr=inFile.listTypeRecipe[i].Fr;
                inFile.listTypeRecipe[inFile.listTypeRecipe.length-1].En=newType;
            }
            inFile.listTypeRecipe[inFile.listTypeRecipe.length-1].recipe[0]=recipeName;
          }
            
        }
        // remove old info
        if (i<inFile.listTypeRecipe.length){
          if (inFile.listTypeRecipe[i].recipe.length===1){
            inFile.listTypeRecipe.splice(i,1);
          } else {
            for (var k=0; k<inFile.listTypeRecipe[i].recipe.length && inFile.listTypeRecipe[i].recipe[k]!==recipeName; k++){};
            inFile.listTypeRecipe[i].recipe.splice(k,1);
          }
        }
      }
  }
}

onRefresh(){
  this.refreshFileType(this.recipeFile)
}

refreshFileType(inFile:any){
  inFile.listTypeRecipe.splice(0,inFile.listTypeRecipe.length);
  this.updateFileType(inFile);
}

updateFileType(inFile:any){
    var iList=0;
    inFile.listTypeRecipe.push({Fr:'',En:'',recipe:[]});
    inFile.listTypeRecipe[iList].Fr=inFile.recipe[0].typeFr;
    inFile.listTypeRecipe[iList].En=inFile.recipe[0].typeEn;
    inFile.listTypeRecipe[iList].recipe[0]=inFile.recipe[0].name;
    for (var ll=1; ll<inFile.recipe.length; ll++){

        for (var mm=0; mm<inFile.listTypeRecipe.length && inFile.listTypeRecipe[mm].Fr!==inFile.recipe[ll].typeFr; mm++){};
        if (mm<inFile.listTypeRecipe.length){
          inFile.listTypeRecipe[mm].recipe[inFile.listTypeRecipe[mm].recipe.length]=inFile.recipe[ll].name;
        } else {
          inFile.listTypeRecipe.push({Fr:'',En:'',recipe:[]});
          iList=inFile.listTypeRecipe.length-1;
          inFile.listTypeRecipe[iList].Fr=inFile.recipe[ll].typeFr;
          inFile.listTypeRecipe[iList].En=inFile.recipe[ll].typeEn;
          inFile.listTypeRecipe[iList].recipe[0]=inFile.recipe[ll].name;
        }
    }
}



fillInRecord(inRecord:any,outRecord:any){
  outRecord.typeFr=inRecord.typeFr;
  outRecord.typeEn=inRecord.typeEn;
  outRecord.name=inRecord.name;
  outRecord.comments=inRecord.comments;
  outRecord.commentsPerso=inRecord.commentsPerso;
  outRecord.commentsEn=inRecord.commentsEn;
  outRecord.commentsBox=inRecord.commentsBox;
  outRecord.commentsPersoBox=inRecord.commentsPersoBox;
  outRecord.commentsEnBox=inRecord.commentsEnBox;
  outRecord.materiel=inRecord.materiel;
  outRecord.materielPerso=inRecord.materielPerso;
  outRecord.materielBox=inRecord.materielBox;
  outRecord.materielPersoBox=inRecord.materielPersoBox;
  outRecord.nutrition.calories=inRecord.nutrition.calories;
  outRecord.nutrition.proteins=inRecord.nutrition.proteins;
  outRecord.nutrition.carbs=inRecord.nutrition.carbs;
  outRecord.nutrition.cholesterol=inRecord.nutrition.cholesterol;
  outRecord.nutrition.satFat=inRecord.nutrition.satFat;
  outRecord.nutrition.totalSat=inRecord.nutrition.totalSat;
  outRecord.nutrition.totalWeight=inRecord.nutrition.totalWeight;
  outRecord.nutritionPerso.calories=inRecord.nutritionPerso.calories;
  outRecord.nutritionPerso.proteins=inRecord.nutritionPerso.proteins;
  outRecord.nutritionPerso.carbs=inRecord.nutritionPerso.carbs;
  outRecord.nutritionPerso.cholesterol=inRecord.nutritionPerso.cholesterol;
  outRecord.nutritionPerso.satFat=inRecord.nutritionPerso.satFat;
  outRecord.nutritionPerso.totalSat=inRecord.nutritionPerso.totalSat;
  outRecord.nutritionPerso.totalWeight=inRecord.nutritionPerso.totalWeight;

  for (var j=0; j<inRecord.data.length; j++){
      const pushData=new classRecipe;
      outRecord.data.push(pushData);
      outRecord.data[j].ingr=inRecord.data[j].ingr;
      outRecord.data[j].quantity=inRecord.data[j].quantity;
      outRecord.data[j].unit=inRecord.data[j].unit;      
      const pushDataPerso=new classRecipe;
      outRecord.dataPerso.push(pushDataPerso);
      outRecord.dataPerso[j].ingr=inRecord.dataPerso[j].ingr;
      outRecord.dataPerso[j].quantity=inRecord.dataPerso[j].quantity;
      outRecord.dataPerso[j].unit=inRecord.dataPerso[j].unit;   
    }    
} 

CancelRecord(){
    this.recipeFile.recipe.splice(0,this.recipeFile.recipe.length);
    this.recipeFile.listTypeRecipe.splice(0,this.recipeFile.listTypeRecipe.length);
    this.fillFileRecord(this.initialRecipeFile,this.recipeFile);
    this.recordRecipe=0;
    if (this.isSearchText===true){
      this.event.target.id='search';
      this.event.target.value=this.textToSearch;
      this.searchText(this.event);
      if (this.tabSearch.length>0){
        this.recordRecipe=this.tabSearch[0].posRec;
      }
    } 
    this.resetBooleans();
    this.isRecipeModified=false;
    this.isCreateRecipeName=false;
  }

CancelSave(){
    this.resetBooleans();
  }
 
ConfirmSave(){
    this.resetBooleans();
    this.tabDialog[this.prevDialog]=false;
    const nameOfFile=this.theListOfObjects[this.fileNb].header+this.theListOfObjects[this.fileNb].name+this.theListOfObjects[this.fileNb].json;
    //this.SpecificForm.controls['FileName'].setValue(this.myListOfObjects.items[this.fileNb].name);
    this.SpecificForm.controls['FileName'].setValue(nameOfFile);
    this.IsSaveConfirmed = true;
  }

calculateNutritionForAllRecipe(){
  const saveRecipeRecord=this.recordRecipe;
  for (this.recordRecipe=0; this.recordRecipe<this.recipeFile.recipe.length; this.recordRecipe++){
    this.calculateNutrition('all');

  }
  this.recipeFile.updatedAt=strDateTime();
  this.putRecord(this.googleBucketName, this.SpecificForm.controls['FileName'].value, this.recipeFile);
  this.recordRecipe=saveRecipeRecord;
  this.message='Nutrition facts calculated and saved for all recipes';
  this.isRecipeModified=false;
}

SaveRecord(){
    this.calculateNutrition('all');
    this.recipeFile.updatedAt=strDateTime();
    this.putRecord(this.googleBucketName, this.SpecificForm.controls['FileName'].value, this.recipeFile);
    this.resetBooleans();
    this.isRecipeModified=false;
    this.isCreateRecipeName=false;
  }

putRecord(GoogleBucket:string, GoogleObject:string, record:any){
    
    var file=new File ([JSON.stringify(record)],GoogleObject, {type: 'application/json'});
    this.ManageGoogleService.uploadObject(this.configServer, GoogleBucket, file ,GoogleObject)
      .subscribe(res => {
              if (res.type===4){
                this.message='File "'+ GoogleObject +'" is successfully stored in the cloud';
                this.isRecipeModified=false;
                this.IsSaveConfirmed=false;
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
                this.nbCallGetRecord=0;
                this.EventHTTPReceived[iWait]=true;
                if (iWait===1){
                  this.isFileRetrieved=true;
                  this.initialRecipeFile.recipe.splice(0,this.initialRecipeFile.recipe.length);
                  this.initialRecipeFile.fileType=data.fileType;
                  for (var i=0; i<data.listTypeRecipe.length; i++){
                    
                    this.initialRecipeFile.listTypeRecipe.push({Fr:"",En:"",recipe:[]});
                    this.initialRecipeFile.listTypeRecipe[i].Fr=data.listTypeRecipe[i].Fr.trim();
                    this.initialRecipeFile.listTypeRecipe[i].En=data.listTypeRecipe[i].En.trim();
                    var k=-1;
                    for (var j=0; j<data.listTypeRecipe[i].recipe.length; j++){
                      if (data.listTypeRecipe[i].recipe[j]!==""){
                        k++
                        this.initialRecipeFile.listTypeRecipe[i].recipe[k]=data.listTypeRecipe[i].recipe[j].trim();
                      }
                    }
                  }
                  
                  for (var i=0; i<data.recipe.length; i++){
                    this.tabUpdateRef.push({init:0});
                    this.tabUpdateRef[this.tabUpdateRef.length-1].init=i;
                    const classRecord=new classRecordRecipe;
                    this.initialRecipeFile.recipe.push(classRecord);
                    if (data.recipe[i].typeFr===undefined){
                      this.initialRecipeFile.recipe[i].typeFr="Creme";
                      this.initialRecipeFile.recipe[i].typeEn="Cream";
                    } else {
                      this.initialRecipeFile.recipe[i].typeFr=data.recipe[i].typeFr.trim();
                      this.initialRecipeFile.recipe[i].typeEn=data.recipe[i].typeEn.trim();
                    }
                    this.initialRecipeFile.recipe[i].name=data.recipe[i].name.trim();
                    this.initialRecipeFile.recipe[i].comments=data.recipe[i].comments;
                    this.initialRecipeFile.recipe[i].commentsPerso=data.recipe[i].commentsPerso;
                    if (data.recipe[i].commentsEn===undefined){
                      this.initialRecipeFile.recipe[i].commentsEn="";
                    } else {
                      this.initialRecipeFile.recipe[i].commentsEn=data.recipe[i].commentsEn;
                    }
                    if (data.recipe[i].commentsBox!==undefined){
                      this.initialRecipeFile.recipe[i].commentsBox=data.recipe[i].commentsBox;
                      this.initialRecipeFile.recipe[i].commentsPersoBox=data.recipe[i].commentsPersoBox;
                      this.initialRecipeFile.recipe[i].commentsEnBox=data.recipe[i].commentsEnBox;
                    } else {
                      this.initialRecipeFile.recipe[i].commentsBox=this.minHeightCommBox;
                      this.initialRecipeFile.recipe[i].commentsPersoBox=this.minHeightCommBox;
                      this.initialRecipeFile.recipe[i].commentsEnBox=this.minHeightCommBox;
                    }
                    if (data.recipe[i].materielBox!==undefined){
                      this.initialRecipeFile.recipe[i].materielBox=data.recipe[i].materielBox;
                      this.initialRecipeFile.recipe[i].materielPersoBox=data.recipe[i].materielPersoBox;
                    } else {
                      this.initialRecipeFile.recipe[i].materielBox=this.minHeightCommBox;
                      this.initialRecipeFile.recipe[i].materielPersoBox=this.minHeightCommBox;
                    }
                    this.initialRecipeFile.recipe[i].materiel=data.recipe[i].materiel;
                    this.initialRecipeFile.recipe[i].materielPerso=data.recipe[i].materielPerso;
                    this.initialRecipeFile.recipe[i].nutrition.calories=data.recipe[i].nutrition.calories;
                    this.initialRecipeFile.recipe[i].nutrition.proteins=data.recipe[i].nutrition.proteins;
                    this.initialRecipeFile.recipe[i].nutrition.carbs=data.recipe[i].nutrition.carbs;
                    this.initialRecipeFile.recipe[i].nutrition.cholesterol=data.recipe[i].nutrition.cholesterol;
                    this.initialRecipeFile.recipe[i].nutrition.satFat=data.recipe[i].nutrition.satFat;
                    this.initialRecipeFile.recipe[i].nutrition.totalSat=data.recipe[i].nutrition.totalSat;
                    this.initialRecipeFile.recipe[i].nutrition.totalWeight=data.recipe[i].nutrition.totalWeight;

                    this.initialRecipeFile.recipe[i].nutritionPerso.calories=data.recipe[i].nutritionPerso.calories;
                    this.initialRecipeFile.recipe[i].nutritionPerso.proteins=data.recipe[i].nutritionPerso.proteins;
                    this.initialRecipeFile.recipe[i].nutritionPerso.carbs=data.recipe[i].nutritionPerso.carbs;
                    this.initialRecipeFile.recipe[i].nutritionPerso.cholesterol=data.recipe[i].nutritionPerso.cholesterol;
                    this.initialRecipeFile.recipe[i].nutritionPerso.satFat=data.recipe[i].nutritionPerso.satFat;
                    this.initialRecipeFile.recipe[i].nutritionPerso.totalSat=data.recipe[i].nutritionPerso.totalSat;
                    this.initialRecipeFile.recipe[i].nutritionPerso.totalWeight=data.recipe[i].nutritionPerso.totalWeight;

                    for (var j=0; j<data.recipe[i].data.length; j++){
                      const pushData=new classRecipe;
                      this.initialRecipeFile.recipe[i].data.push(pushData);
                      this.initialRecipeFile.recipe[i].data[j].ingr=data.recipe[i].data[j].ingr;
                      this.initialRecipeFile.recipe[i].data[j].quantity=data.recipe[i].data[j].quantity;
                      this.initialRecipeFile.recipe[i].data[j].unit=data.recipe[i].data[j].unit;
                      const pushDataPerso=new classRecipe;
                      this.initialRecipeFile.recipe[i].dataPerso.push(pushDataPerso);
                      this.initialRecipeFile.recipe[i].dataPerso[j].ingr=data.recipe[i].dataPerso[j].ingr;
                      this.initialRecipeFile.recipe[i].dataPerso[j].quantity=data.recipe[i].dataPerso[j].quantity;
                      this.initialRecipeFile.recipe[i].dataPerso[j].unit=data.recipe[i].dataPerso[j].unit;
                    }
                    
                  }

                  if (this.initialRecipeFile.listTypeRecipe===undefined ||this.initialRecipeFile.listTypeRecipe.length===0 ){
                  //if (data.listTypeRecipe===undefined ||data.listTypeRecipe.length===0 ){
                    this.updateFileType(this.initialRecipeFile);
                  } else {

                  }
                
                  //this.refreshFileType(this.initialRecipeFile); 
                  this.fillFileRecord(this.initialRecipeFile,this.recipeFile);

                  
                } else if (iWait===2){
                  this.ConfigCaloriesFat=data;
                } else if (iWait===3){
                  this.ConvertUnit=data;
                  for (var i=0; i<this.ConvertUnit.tabConv.length && this.ConvertUnit.tabConv[i].fromUnit!=='gram';i++){};
                  if (i<this.ConvertUnit.tabConv.length){this.posGramTabConvert=i};
                } else  if (iWait===4){
                  for (var i=0; i<data.length;i++){
                    this.tabFreEng.push({French:"",English:"",inputHeight:0});
                    this.tabFreEng[i].French=data[i].French;
                    this.tabFreEng[i].English=data[i].English;
                    this.tabFreEng[i].inputHeight=data[i].inputHeight;
                    this.tabFreEng[i].nbWordsFr=data[i].nbWordsFr;
                    this.tabFreEng[i].nbWordsEn=data[i].nbWordsEn;
                  }
                }

            },
            (error_handler) => {
              this.nbCallGetRecord++
              this.Error_Access_Server='Could not retrieve the file - number of calls = ' + this.nbCallGetRecord ;
            }
            )
  }


  transferToCalFat(){
    // check if name of recipe already exists under Type='recipe'
    var j=0;
    for (var i=0; i< this.ConfigCaloriesFat.tabCaloriesFat.length && this.ConfigCaloriesFat.tabCaloriesFat[i].Type!=='Recipe'; i++){
    }
    if (i=== this.ConfigCaloriesFat.tabCaloriesFat.length){
      // Type='Recipe' has not been found; create it
      const CalFatClass = new ClassCaloriesFat;
      this.ConfigCaloriesFat.tabCaloriesFat.splice(i,0,CalFatClass);
      const itemClass= new ClassItem;
      this.ConfigCaloriesFat.tabCaloriesFat[i].Content.push(itemClass);
      i=this.ConfigCaloriesFat.tabCaloriesFat.length-1;
      this.ConfigCaloriesFat.tabCaloriesFat[i].Type='Recipe';
      j=0;
    } else {
      // check if item food already exists and if yes overide figures otherwise create new food item
      
      for (j=0; j<this.ConfigCaloriesFat.tabCaloriesFat[i].Content.length && 
        this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j].Name.toLowerCase().trim() !== this.recipeFile.recipe[this.recordRecipe].name.toLowerCase().trim();j++){
  
      }  
      if (j===this.ConfigCaloriesFat.tabCaloriesFat[i].Content.length){
        const itemClass= new ClassItem;
        this.ConfigCaloriesFat.tabCaloriesFat[i].Content.splice(this.ConfigCaloriesFat.tabCaloriesFat[i].Content.length,0,itemClass);
        j=this.ConfigCaloriesFat.tabCaloriesFat[i].Content.length-1;
      }
    }
    //this.copyContent(this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j],this.outFileRecipe.tabCaloriesFat[iRecipe].Total);
      this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j].Name=this.recipeFile.recipe[this.recordRecipe].name;
      this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j].Serving=this.recipeFile.recipe[this.recordRecipe].nutrition.totalWeight;
      this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j].ServingUnit='gram';
      this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j].Calories=this.recipeFile.recipe[this.recordRecipe].nutrition.calories ;
      this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j].Protein=this.recipeFile.recipe[this.recordRecipe].nutrition.proteins ;
      this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j].Carbs=this.recipeFile.recipe[this.recordRecipe].nutrition.carbs ;
      this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j].Cholesterol=this.recipeFile.recipe[this.recordRecipe].nutrition.cholesterol ;
      this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j].Sugar=0;
      this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j].GlyIndex=0;
      this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j].Fat.Saturated=this.recipeFile.recipe[this.recordRecipe].nutrition.satFat;
      this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j].Fat.Total=this.recipeFile.recipe[this.recordRecipe].nutrition.totalSat;
      this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j].Name=this.recipeFile.recipe[this.recordRecipe].name.toLowerCase().trim();
      this.ConfigCaloriesFat.updatedAt=strDateTime();
      this.putRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.calories,this.ConfigCaloriesFat);
    }
 
  GetAllObjects(iWait:number){

    this.scroller.scrollToAnchor('theTop');
    this.EventHTTPReceived[iWait]=false;
    this.NbWaitHTTP++;
    this.waitHTTP(this.TabLoop[iWait],30000,iWait);
    this.Error_Access_Server='';
    var i=0;
    const lengthFile=this.identification.recipe.fileStartName.length;
    const HTTP_Address=this.Google_Bucket_Access_Root+ this.googleBucketName + "/o"  ;
    console.log('RetrieveAllObjects()'+this.googleBucketName);
    this.ManageGoogleService.getListMetaObjects(this.configServer, this.googleBucketName )
    //this.http.get<Bucket_List_Info>(HTTP_Address )
            .subscribe((data ) => {
                  console.log('RetrieveAllObjects() - data received');
                  this.nbCallGetRecord=0;
                  
                  for (var i=0; i<data.length; i++){
                      const theBucketInfo = new OneBucketInfo;
                      this.myListOfObjects.items.push(theBucketInfo);
                      this.myListOfObjects.items[i]=data[i].items;
                  }
                  this.EventHTTPReceived[iWait]=true;

                 var iObjects=-1;
                  for (i=this.myListOfObjects.items.length-1; i>-1; i--){
                    if (this.myListOfObjects.items[i].name.substring(0,lengthFile)===this.identification.recipe.fileStartName){
                      
                      this.theListOfObjects.push({header:"",name:"",json:""});
                      iObjects++
                      this.theListOfObjects[iObjects].header=this.identification.recipe.fileStartName;
                      const j=this.myListOfObjects.items[i].name.indexOf('.');
                      this.theListOfObjects[iObjects].json=this.myListOfObjects.items[i].name.substring(j);
                      this.theListOfObjects[iObjects].name=this.myListOfObjects.items[i].name.substring(lengthFile, j);
                      // keep the files corresponding to the recipes of the user
                    } 
                }
                  this.isListOfObjectsRetrieved=true; 
                  if (this.theListOfObjects.length===1){
                  //if (this.myListOfObjects.items.length===1){
                    this.fileNb=0;
                    const nameOfFile=this.theListOfObjects[this.fileNb].header+this.theListOfObjects[this.fileNb].name+this.theListOfObjects[this.fileNb].json;
                    this.getRecord(this.googleBucketName, nameOfFile,1);
                    this.recordRecipe=0;
                  }
                  this.myListOfObjects=new Bucket_List_Info; 

            },
            error_handler => {
                  console.log('RECIPE RetrieveAllObjects() - error handler; HTTP='+HTTP_Address);
                  this.nbCallGetRecord++;
                  iWait=this.nbCallGetRecord+10;
                  if (this.nbCallGetRecord<4){
                    this.GetAllObjects(iWait);
                  } else { this.nbCallGetRecord=0;}
                  this.Error_Access_Server='RetrieveAllObjects()==> ' + error_handler.statusText+'   name=> '+ error_handler.name ;
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
