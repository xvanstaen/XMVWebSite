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
  //margLeft:Array<number>=[];
  margTop:Array<number>=[0,-90,-120,-150,-150,-120];
  ngOnInit(): void {
    var i=0;
    var j=0;
    if (this.callingComponent==='FitnessStat'){
     
      //this.myEvent.dialogueNb
      this.returnedData.idString=this.myEvent.idString;
      this.returnedData.fieldNb=this.myEvent.dialogueNb;
      
    } else if (this.callingComponent='FitnessChart'){
      for (i=3; i<6 && this.OpenDialogue[i]===false; i++){
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
