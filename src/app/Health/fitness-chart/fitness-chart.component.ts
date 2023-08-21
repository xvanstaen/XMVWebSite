import { Component, OnInit , Input, Output, HostListener,  HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
import { DatePipe, formatDate } from '@angular/common'; 

import { HttpClient } from '@angular/common/http';

import { ViewportScroller } from "@angular/common";
import { FormGroup, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';


// configServer is needed to use ManageGoogleService
// it is stored in MangoDB and accessed via ManageMangoDBService
import { configServer } from '../../JsonServerClass';
import { environment } from 'src/environments/environment';
import { LoginIdentif } from '../../JsonServerClass';

import {eventoutput, thedateformat} from '../../apt_code_name';

import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';

import {ConfigFitness} from '../ClassFitness';
import {ConfigSport} from '../ClassFitness';
import {PerformanceFitness} from '../ClassFitness';
import {ClassSport} from '../ClassFitness';
import {ClassResult} from '../ClassFitness';
import {ClassActivity} from '../ClassFitness';
import {ClassExercise} from '../ClassFitness';
import {BigData} from '../ClassFitness';
import {CreturnedData} from '../ClassFitness';
import {CmyEvent} from '../ClassFitness';
import {Ctarget} from '../ClassFitness';

@Component({
  selector: 'app-fitness-chart',
  templateUrl: './fitness-chart.component.html',
  styleUrls: ['./fitness-chart.component.css']
})
export class FitnessChartComponent implements OnInit {

  constructor(    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageMangoDBService: ManageMangoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    @Inject(LOCALE_ID) private locale: string,) {

   }

  FieldSelForm=new FormGroup({
    SortOne: new FormControl(''),
    SortTwo: new FormControl(''),
    SortThree: new FormControl(''),
    FilterOne: new FormControl(''),
    FilterTwo: new FormControl(''),
    FilterThree: new FormControl(''),
  })

  @Input() TabBigData:Array<BigData>=[];
  @Input() MyConfigFitness=new ConfigFitness;
  @Input() TriggerChartChange:number=0;
  //myEvent=new CmyEvent;
  returnedData=new CreturnedData;

  callingComponent:string='FitnessChart';

  TabToDisplay:Array<BigData>=[];
  DisplayBigData:any [][]=[];
  
  SortFields:Array<number>=[0,0,0];
  MaxSortFields:number=3;
  FilterFields:Array<number>=[0,0,0];
  ListSortFields:Array<string>=['Sport','Date','Activity','Exercise','Unit','Perf Type'];
  ListFilter:Array<any>=[];


  OpenDialogue:Array<boolean>=[];
  maxDialogue:number=10;
  prev_Dialogue:number=0;

  nbSeanceDisplay:number=0;
  nbToDisplay:number=0;

  getScreenWidth: any;
  getScreenHeight: any;
  device_type:string='';

  refMedia:number=1010;

  isSortedFiltered:boolean=false;

  @HostListener('window:resize', ['$event'])

onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;

    if (this.getScreenWidth<this.refMedia+1){ this.nbToDisplay=2; this.nbSeanceDisplay=3;} 
    else { this.nbToDisplay=4; this.nbSeanceDisplay=5;}

  }

ngOnInit(): void {
    var i=0;
    for (i=0; i<this.maxDialogue; i++){
      this.OpenDialogue[i]=false;
    }

    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;
    if (this.getScreenWidth<620){ this.nbToDisplay=2; this.nbSeanceDisplay=3;} 
    else { this.nbToDisplay=4; this.nbSeanceDisplay=5;}
}

Confirm(){
  // Apply filters first
  var j=0;
  var i=0;
  var k=0;
  var isFilterEmpty=true;
  var isSortEmpty=true;
  var nbItemTab:number=-1;
  var WorkingTabFilt:Array<BigData>=[];
  var WorkingTabSort:Array<BigData>=[];
  
  var trouve=false;
  for (i=0; i<this.FilterFields.length && this.FilterFields[i]===0 ; i++){
  }
  if (i<this.FilterFields.length){ isFilterEmpty=false;}

  for (i=0; i<this.SortFields.length && this.SortFields[i]===0 ; i++){
  }
  if (i<this.SortFields.length){ isSortEmpty=false;}


  if (isFilterEmpty===false || isSortEmpty===false ){
    this.TabToDisplay.splice(0,this.TabToDisplay.length);
    if (isFilterEmpty===false){
      for (j=0; j<this.TabBigData.length; j++){
          trouve=false;
          for (k=0; k<this.MaxSortFields && trouve===false; k++){ // same number of filter and sort fields
            if (this.FilterFields[k]>0 ) {
              if (
                this.ListFilter[this.FilterFields[k]]===this.TabBigData[j].sport || 
                this.ListFilter[this.FilterFields[k]]===this.TabBigData[j].activity || 
                this.ListFilter[this.FilterFields[k]]===this.TabBigData[j].result.perf ||
                this.ListFilter[this.FilterFields[k]]===this.TabBigData[j].unit)
                { trouve=true 
                } else { trouve=false} 
            }
          }
          if (trouve===true){
            nbItemTab++
            WorkingTabFilt[nbItemTab]=this.TabBigData[j];
            WorkingTabFilt[nbItemTab].id=nbItemTab;
          }
        
      }
    } else {
      WorkingTabFilt=this.TabBigData;
    } // end if (nb_filter!==0)
    if (isSortEmpty===false){
      if (WorkingTabFilt.length===0){ WorkingTabFilt=this.TabBigData;}
      /*
      if (this.ListSortFields[this.SortFields[0]] === 'Sport'){
        WorkingTabFilt.sort((a, b) => (a.sport > b.sport) ? 1 : -1);
      } else  if (this.ListSortFields[this.SortFields[0]] === 'Activity'){
        WorkingTabFilt.sort((a, b) => (a.activity > b.activity) ? 1 : -1);
      } else  if (this.ListSortFields[this.SortFields[0]] === 'Date'){
        WorkingTabFilt.sort((a, b) => (a.thedate > b.thedate) ? 1 : -1);
      } else  if (this.ListSortFields[this.SortFields[0]] === 'Exercise'){
        WorkingTabFilt.sort((a, b) => (a.exercise > b.exercise) ? 1 : -1);
      } else  if (this.ListSortFields[this.SortFields[0]] === 'Unit'){
        WorkingTabFilt.sort((a, b) => (a.unit > b.unit) ? 1 : -1);
      } else  if (this.ListSortFields[this.SortFields[0]] === 'Perf Type'){
        WorkingTabFilt.sort((a, b) => (a.result.perf_type > b.result.perf_type) ? 1 : -1);
      }
      */

      WorkingTabSort=SortMyTable(WorkingTabFilt.length,WorkingTabFilt,this.SortFields);

      WorkingTabFilt=WorkingTabSort;
    }   
           
      // table is filtered and sorted
      // const theBigData=new BigData;
      this.TabToDisplay=WorkingTabFilt;
      this.isSortedFiltered=true;
   
  } // else there is nothing to do

}

CancelCriteria(){
    var i=0;
    const theBigData=new BigData;
    this.FieldSelForm.controls['SortOne'].setValue('');
    this.SortFields[0]=0;

    this.FieldSelForm.controls['SortTwo'].setValue('');
    this.SortFields[1]=0;

    this.FieldSelForm.controls['SortThree'].setValue('');
    this.SortFields[2]=0;

    this.FieldSelForm.controls['FilterOne'].setValue('');
    this.FilterFields[0]=0;
    this.FieldSelForm.controls['FilterTwo'].setValue('');
    this.FilterFields[1]=0;

    this.FieldSelForm.controls['FilterThree'].setValue('');
    this.FilterFields[2]=0;

    if (this.isSortedFiltered===true){
      this.TabToDisplay.splice(0,this.TabToDisplay.length);
      for (i=0; i<this.TabBigData.length; i++){
        this.TabToDisplay.push(theBigData);
        this.TabToDisplay[i]=this.TabBigData[i];
      }
    }
}

ArrowSort(event:any){
  this.OpenDialogue[this.prev_Dialogue]=false;
  if (event.target.id==='SortOne'){
    this.prev_Dialogue=0;
  } else   if (event.target.id==='SortTwo'){
    this.prev_Dialogue=1;
  } else   if (event.target.id==='SortThree'){
    this.prev_Dialogue=2;
  } else   if (event.target.id==='FilterOne'){
    this.prev_Dialogue=3;
  } else   if (event.target.id==='FilterTwo'){
    this.prev_Dialogue=4;
  } else   if (event.target.id==='FilterThree'){
    this.prev_Dialogue=5;
  }
  this.OpenDialogue[this.prev_Dialogue]=true;
}

DropDownData(event:any){
  this.OpenDialogue[this.prev_Dialogue]=false;
  this.returnedData=event;
  if (this.returnedData.valueString!=='Cancel'){
    if (this.returnedData.fieldType==='Sort'){
      
      if (this.returnedData.fieldNb===0){
        this.FieldSelForm.controls['SortOne'].setValue(this.returnedData.valueString);
        this.SortFields[0]=this.returnedData.valueNb;
      }
      if (this.returnedData.fieldNb===1){
        this.FieldSelForm.controls['SortTwo'].setValue(this.returnedData.valueString);
        this.SortFields[1]=this.returnedData.valueNb;
      }
      if (this.returnedData.fieldNb===2){
        this.FieldSelForm.controls['SortThree'].setValue(this.returnedData.valueString);
        this.SortFields[2]=this.returnedData.valueNb;
      }
    } else if (this.returnedData.fieldType==='Filter'){
      
      if (this.returnedData.fieldNb===0){
        this.FieldSelForm.controls['FilterOne'].setValue(this.returnedData.valueString);
        this.FilterFields[0]=this.returnedData.valueNb;
      }
      if (this.returnedData.fieldNb===1){
        this.FieldSelForm.controls['FilterTwo'].setValue(this.returnedData.valueString);
        this.FilterFields[1]=this.returnedData.valueNb;
      }
      if (this.returnedData.fieldNb===2){
        this.FieldSelForm.controls['FilterThree'].setValue(this.returnedData.valueString);
        this.FilterFields[2]=this.returnedData.valueNb;
      }
    }
  }
}


FillFilter(){
  var i=0;
  var j=0;
  var iFilter=0;
  this.ListFilter[iFilter]=this.TabBigData[0].sport;
  iFilter++ 
  this.ListFilter[iFilter]=this.TabBigData[0].activity;
  if (this.TabBigData[0].result.perf_type!==undefined && this.TabBigData[0].result.perf_type!==''){
    iFilter++ 
    this.ListFilter[iFilter]=this.TabBigData[0].result.perf_type;
  }
 
  
  for (i=1; i<this.TabBigData.length; i++){

    // check if previous element was the same
    if (this.TabBigData[i-1].sport!==this.TabBigData[i].sport){
        // check if element is already stored in ListFilter
        for (j=0; j<this.ListFilter.length && this.ListFilter[j]!==this.TabBigData[i].sport; j++){
        }
        if (j===this.ListFilter.length){
          // item not stored yet
          iFilter++ 
          this.ListFilter[iFilter]=this.TabBigData[i].sport;
        }
    }

    if (this.TabBigData[i-1].activity!==this.TabBigData[i].activity){
      // check if element is already stored in ListFilter
      for (j=0; j<this.ListFilter.length && this.ListFilter[j]!==this.TabBigData[i].activity; j++){
      }
      if (j===this.ListFilter.length){
        // item not stored yet
        iFilter++ 
        this.ListFilter[iFilter]=this.TabBigData[i].activity;
      }
    }

    if (this.TabBigData[i].unit!== '' && this.TabBigData[i-1].unit!==this.TabBigData[i].unit){
      // check if element is already stored in ListFilter
      for (j=0; j<this.ListFilter.length && this.ListFilter[j]!==this.TabBigData[i].unit; j++){
      }
      if (j===this.ListFilter.length){
        // item not stored yet
        iFilter++ 
        this.ListFilter[iFilter]=this.TabBigData[i].unit;
      }
    }

    if (this.TabBigData[i].result.perf_type!==undefined &&
      this.TabBigData[i].result.perf_type !=='' &&
      this.TabBigData[i-1].result.perf_type!==this.TabBigData[i].result.perf_type){
      // check if element is already stored in ListFilter
      for (j=0; j<this.ListFilter.length && this.ListFilter[j]!==this.TabBigData[i].result.perf_type; j++){
      }
      if (j===this.ListFilter.length){
        // item not sorted yet
        iFilter++ 
        this.ListFilter[iFilter]=this.TabBigData[i].result.perf_type;
      }
    }

  }
  for (i=0; i<this.ListFilter.length && this.ListFilter[i]!==''; i++){
  }
  if (i<this.ListFilter.length){
    this.ListFilter.splice(i,1);
  }
}

ngOnChanges(changes: SimpleChanges) { 
  const theBigData=new BigData;
  var i=0;
    for (const propName in changes){
        const j=changes[propName];
        if (propName==='TabBigData' || propName==='NewConfigFitness' || propName==='TriggerChartChange'){
          this.FillFilter();
          this.TabToDisplay.splice(0,this.TabToDisplay.length);
          for (i=0; i<this.TabBigData.length; i++){
            this.TabToDisplay.push(theBigData);
            this.TabToDisplay[i]=this.TabBigData[i];
          }
          
        }
    }
    // //this.LogMsgConsole('$$$$$ onChanges '+' to '+to+' from '+from + ' ---- JSON.stringify(j) '+ JSON.stringify(j)); 
}

}

export function SortMyTable(x:number,inTable:Array<BigData>,sort:Array<any>=[]) {

  // var myTable: any [][]=[];
  var myNewTable: any [][]=[];
  var Row:Array<any>=[];
  var i: number=0;
  var j: number=0;
  var k: number=0;
  var outTable:Array<BigData>=[];

  var y:number=7;
  var  myTable=Array(x);
  var i: number=0;
  for ( i=0; i<y; i++) {
    myTable[i] = Array(y);
  }

  for (j=0; j<inTable.length; j++){
    myTable[0][j]=inTable[j].sport;
    myTable[1][j]=inTable[j].thedate;
    myTable[2][j]=inTable[j].activity;
    myTable[3][j]=inTable[j].exercise;
    myTable[4][j]=inTable[j].unit;
    myTable[5][j]=inTable[j].result.perf_type;
    myTable[6][j]=j;
  }
var k=0;
var l=0;
var m=0;
var trouve:boolean=false;
var CriteriaOne:Array<number>=[];
  for (i=0; i<3; i++){
    CriteriaOne[i]=0;
  }

for (i=0; i<3; i++){ // 3 sorting criteria
    if (sort[i]!==0){
      for (j=1; j<myTable.length; j++){
          if  (i===0 || (i>0 && myTable[sort[i-1]][j]===myTable[sort[i-1]][j-1])){
            // same first criteria so test and sort on second criteria
            for (m=j; m>CriteriaOne[i]; m--){
              if (myTable[sort[i]][m]>myTable[sort[i]][m-1]){
                // same first criteria so test on second criteria
                  for (l=0; l<7; l++){
                    Row[l]=myTable[l][m];
                    myTable[l][m]=myTable[l][m-1];
                    myTable[l][m-1]=Row[l];
                  }
              }

            }          

        } else {CriteriaOne[i]=j;}
      }
    }
  }
for (i=0; i<inTable.length; i++){
  outTable[i]=inTable[myTable[6][i]];
}

  return(outTable);
}