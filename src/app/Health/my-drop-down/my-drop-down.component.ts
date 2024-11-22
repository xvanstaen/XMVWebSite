import { Component, OnInit, Input, Output, EventEmitter,HostListener, } from '@angular/core';
import {ConfigFitness} from '../ClassFitness';
import {CreturnedData} from '../ClassFitness';
import {CmyEvent} from '../ClassFitness';
import {Ctarget} from '../ClassFitness';

@Component({
  selector: 'app-my-drop-down',
  templateUrl: './my-drop-down.component.html',
  styleUrls: ['./my-drop-down.component.css']
})
export class MyDropDownComponent implements OnInit {

  constructor() { }



  @Input() ListSortFields:Array<string>=[];
  @Input() ListFilter:Array<any>=[];
  @Input() OpenDialogue:Array<boolean>=[];
  @Input() MyConfigFitness=new ConfigFitness;
  @Input() TabOfId:Array<any>=[];
  @Input() TabPerfConfig:Array<number>=[];
  @Input() callingComponent:string='';
  @Input() myEvent=new CmyEvent;

  returnedData=new CreturnedData;
  @Output() selectedCriteria=new EventEmitter<CreturnedData>();

  selectedData:string='';

  isFilterNeeded:boolean=false;
  isSortNeeded:boolean=false;
  iDialogue:number=0;
 
  itemHeight:number=26;
  sizeBoxContent:number=0;
  sizeBox:number=0;

  maxSizeBoxContent:number=270;
  maxSizeBox:number=260;

  //margLeft:Array<number>=[];
  margTop:Array<number>=[0,-90,-120,-150,-150,-120];
  ngOnInit(): void {
    var i=0;
    var j=0;
    var lenTab:number=0;
    if (this.callingComponent==='FitnessStat'){
     
      //this.myEvent.dialogueNb
      this.returnedData.idString=this.myEvent.idString;
      this.returnedData.fieldNb=this.myEvent.dialogueNb;
      if (this.OpenDialogue[0]===true){
          lenTab=this.MyConfigFitness.TabSport.length;
      } else if (this.OpenDialogue[1]===true && this.TabPerfConfig[this.TabOfId[0]]!== undefined){
          lenTab=this.MyConfigFitness.ListSport[this.TabPerfConfig[this.TabOfId[0]]].activityName.length;
      } else if (this.OpenDialogue[1]===true && this.TabPerfConfig[this.TabOfId[0]]=== undefined){
          lenTab=this.MyConfigFitness.TabActivity.length;
      
      } else if (this.OpenDialogue[2]===true && this.TabPerfConfig[this.TabOfId[0]]!== undefined){
        lenTab=this.MyConfigFitness.ListSport[this.TabPerfConfig[this.TabOfId[0]]].activityUnit.length;
      } else if (this.OpenDialogue[2]===true && this.TabPerfConfig[this.TabOfId[0]]=== undefined){
        lenTab=this.MyConfigFitness.TabUnits.length;
      } else if (this.OpenDialogue[3]===true && this.TabPerfConfig[this.TabOfId[0]]!== undefined){
        lenTab= this.MyConfigFitness.ListSport[this.TabPerfConfig[this.TabOfId[0]]].activityPerfType.length;
      } else if (this.OpenDialogue[3]===true && this.TabPerfConfig[this.TabOfId[0]]=== undefined){
        lenTab=this.MyConfigFitness.TabPerfType.length;
      }else if (this.OpenDialogue[4]===true && this.TabPerfConfig[this.TabOfId[0]]!== undefined){
        lenTab=this.MyConfigFitness.ListSport[this.TabPerfConfig[this.TabOfId[0]]].activityPerfUnit.length;
      } else if (this.OpenDialogue[4]===true && this.TabPerfConfig[this.TabOfId[0]]=== undefined){
        lenTab=this.MyConfigFitness.TabPerfUnit.length;
      }else if (this.OpenDialogue[5]===true && this.TabPerfConfig[this.TabOfId[0]]!== undefined){
        lenTab=this.MyConfigFitness.ListSport[this.TabPerfConfig[this.TabOfId[0]]].activityExercise.length;
      } else if (this.OpenDialogue[5]===true && this.TabPerfConfig[this.TabOfId[0]]=== undefined){
        lenTab=this.MyConfigFitness.TabExercise.length;
      }
      this.sizeBox=this.itemHeight  * (lenTab + 1 );
      this.sizeBoxContent=this.sizeBox+10;
      
    } else if (this.callingComponent='FitnessChart'){
      for (i=3; i<6 && this.OpenDialogue[i]===false; i++){
      }
      if (this.ListFilter.length<this.ListSortFields.length){
        this.sizeBox=this.itemHeight  * (this.ListFilter.length+ 1 );
        this.sizeBoxContent=this.sizeBox+10;
      } else {
        this.sizeBox=this.itemHeight * (this.ListSortFields.length+ 1 );
        this.sizeBoxContent=this.sizeBox+10;
      }
     
      
      if (i<6) {
        this.isFilterNeeded=true;
        this.returnedData.fieldNb=i-3;
        this.returnedData.fieldType='Filter';
        
      }
  
      for (j=0; j<3 && this.OpenDialogue[j]===false; j++){
        }
      if (j<3) {
          this.isSortNeeded=true;
          this.returnedData.fieldNb=j;
          this.returnedData.fieldType='Sort';
          

        }
    }
    this.iDialogue=this.returnedData.fieldNb;
    if (this.sizeBoxContent>this.maxSizeBoxContent){
      this.sizeBoxContent=this.maxSizeBoxContent;
      this.sizeBox=this.maxSizeBox;
    }
  }


  Cancel(event:any){
   // triggger emit that will also close the window
   this.isSortNeeded=false;
   this.isFilterNeeded=false;
   this.returnedData.valueString='Cancel';
   this.selectedCriteria.emit(this.returnedData);

  }

  theCollection(event:any){
    console.log('event id='+ event.target.id+'eventvalue ='+ event.target.value+'eventvalue ='+ event.target.textContent);
    this.returnedData.valueString=event.target.textContent;
    this.returnedData.valueNb=event.target.id.substring(2);
    this.isSortNeeded=false;
    this.isFilterNeeded=false;
    this.selectedCriteria.emit(this.returnedData);
  }

}
