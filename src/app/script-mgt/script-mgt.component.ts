import { Component, OnInit , Input, Output, HostListener, OnChanges, HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
import { CommonModule,  DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormGroup,UntypedFormControl, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';

import { fnExtractParam, fnProcessScript } from "./scriptFns";
import { classMainFile , classStructure, classDetails, classTabLevel0, classTabLevel1, classTabLevel2, classTabLevel3, classTabLevel4} from "../kiosk-abd-config/exportClassMasterCONFIG";
import { classMainOutFile , classOutStructure, classOutDetails, classOutTabLevel0, classOutTabLevel1, classOutTabLevel2, classOutTabLevel3, classOutTabLevel4} from "../kiosk-abd-config/exportClassMasterCONFIG";

export class classParamFiles{
  name:string="";
  bucket:string="";
  server:string="";
}

export class classFilterParam{
  tag:string="";
  field:string="";
}

export  class classReplace{
  tag:string="";
  refField:string="";
  withValue:string="";
  changeField:Array<classChangeField>=[];
}

export class classChangeField{
  tag:string="";
  old:string="";
  new:string="";
}

@Component({
  selector: 'app-script-mgt',
  templateUrl: './script-mgt.component.html',
  styleUrl: './script-mgt.component.css',
  standalone: true, 
  imports: [CommonModule, FormsModule, ReactiveFormsModule], 
})
export class ScriptMgtComponent {

  @Input() processFile:boolean=false;
  @Input() mainOutJSON=new classMainOutFile;
  @Input() mainJSON=new classMainFile;
  @Input() afterSaveScript:any;

  @Output() saveScript= new EventEmitter<any>();
  @Output() processScript= new EventEmitter<any>();

  myForm: FormGroup = new FormGroup({
    fileScriptName: new FormControl('sscript001', { nonNullable: true }),
  })

  scriptFn:Array<any>=["<#domain ","<#select ","<#replace ","<#filter "];
  paramFiles:Array<classParamFiles>=[];

  scriptFileName:Array<string>=[];
  scriptFileContent:Array<string>=[];
  currentScript:number=-1;

  isScriptRetrieved:boolean=false;
  isConfirmSaveScript:boolean=false;
  modifiedScriptContent:string="";
  scriptError:string='';

  paramInputFile:Array<classParamFiles>=[]

  nameLocation:string="";

  domField:string="";
  domValue:string="";
  domRQ:string="";

  selectRQ:string="";
  selectTag:string="";
  selectField:string="";
  selectFromValue:string="";
  selectToValue:string="";

  tagFilter:Array<any>=[];
  tagFilterDisp:Array<any>=[];

  tabReplace:Array<classReplace>=[];

  ngOnInit(){
    this.tagFilter[0]=[];
    this.tagFilter[0][0]='<ABDConfig ';
    this.tagFilter[0][1]='ComputerName';
    this.tagFilter[0][2]='BagDropServer';
    this.tagFilterDisp[0]=[];
    this.tagFilterDisp[0][0]='<ABDConfig ';
    this.tagFilterDisp[0][1]='ComputerName';
    this.tagFilterDisp[0][2]='BagDropServer';

    const replace=new classReplace;
    this.tabReplace.push(replace);
    const change=new classChangeField;
    this.tabReplace[0].changeField.push(change);

  }

  onProcessScript(){
    this.processScript.emit(this.scriptFn);
  }

  onInputScript(event:any){
    this.modifiedScriptContent=event.target.value;
  }

  guidedMode(){

  }

  onDomainInput(event:any){
    if (event.target.id==="domField"){
      this.domField=event.target.value;
    } else if (event.target.id==="domValue"){
      this.domValue=event.target.value;
    }
    this.domRQ='<#domain field="'+this.domField+ '" value="' + this.domValue+'" #>'
  }

  onSelectInput(event:any){
    if (event.target.id==="selTag"){
      this.selectTag=event.target.value;
    } else if (event.target.id==="selField"){
      this.selectField=event.target.value;
    } else if (event.target.id==="selFromV"){
      this.selectFromValue=event.target.value;
    } if (event.target.id==="selToV"){
      this.selectToValue=event.target.value;
    }
    this.selectRQ='<#select tag="'+this.selectTag +'" field="' + this.selectField + '" fromValue="' +
    this.selectFromValue + '" toValue="' + this.selectToValue + '" #>';
  }

  onSelectedScript(event:any){
    //this.scriptFileContent
    this.currentScript=event;
    this.scriptError="";
    this.modifiedScriptContent=this.scriptFileContent[this.currentScript];
  }



  onFilterScript(event:any){
    var iTab=0;
    var jTab=0;
    
    if (event.target.id.substring(0,4)==="tag-"){
      iTab=Number(event.target.id.substring(4));
      this.tagFilter[iTab][0]=event.target.value;
    } else if (event.target.id.substring(0,6)==="field-"){
      const j=event.target.id.indexOf("*");
      if (j!==-1){
        jTab=Number(event.target.id.substring(j+1));
      }
      iTab=Number(event.target.id.substring(6,j));
      this.tagFilter[iTab][jTab]=event.target.value;
    }
  }

  addField(event:any){
    const iTab=Number(event.target.id.substring(4));
    const k=this.tagFilter[iTab].length;
    this.tagFilter[iTab][k]="";
    this.tagFilterDisp[iTab][k]="";
    
  }

  delField(event:any){
    var jTab=0;
    const j=event.target.id.indexOf("*");
    if (j!==-1){
      jTab=Number(event.target.id.substring(j+1));
      const iTab=Number(event.target.id.substring(4,j));
      if (this.tagFilter[iTab].length===1){
        this.tagFilter[iTab][0]="";
        this.tagFilterDisp[iTab][0]="";
      } else {
        this.tagFilter[iTab].splice(jTab,1);
        this.tagFilterDisp[iTab].splice(jTab,1);
      }
    }
  }

  addTag(event:any){
    const iTab=Number(event.target.id.substring(4));
    const k=this.tagFilter.length;
    this.tagFilter[k]=[];
    this.tagFilter[k][0]="";
    this.tagFilter[k][1]="";
    this.tagFilterDisp[k]=[];
    this.tagFilterDisp[k][0]="";
    this.tagFilterDisp[k][1]="";
  }

  delTag(event:any){
    const iTab=Number(event.target.id.substring(4));
    
    if (this.tagFilter.length===1){
      this.tagFilter[0]=[];
      this.tagFilter[0][0]="";
      this.tagFilter[0][1]="";
      this.tagFilterDisp[0]=[];
      this.tagFilterDisp[0][0]="";
      this.tagFilterDisp[0][1]="";
    } else {
      this.tagFilter.splice(iTab,1);
      this.tagFilterDisp.splice(iTab,1);
    }
    
  }

  confirmSaveScript(){
    this.scriptError="";
    this.isConfirmSaveScript=true;
    if (this.currentScript>-1){
      this.myForm.controls['fileScriptName'].setValue(this.scriptFileName[this.currentScript]);
    }
  }

  onSaveScript(event:any){
    this.scriptError="";
    if (event!=="cancel"){
      // check if the name already exists otherwise create one
      for (var i=0; i<this.scriptFileContent.length &&  this.scriptFileName[i]!==this.myForm.controls['fileScriptName'].value; i++){}
      if (i===this.scriptFileContent.length){
        this.currentScript=this.scriptFileContent.length;
      }
      this.scriptFileName[this.currentScript]=this.myForm.controls['fileScriptName'].value;
      this.scriptFileContent[this.currentScript]=this.modifiedScriptContent;
      const returnValue={
        action:event,
        file:this.myForm.controls['fileScriptName'].value,
        content:this.modifiedScriptContent
      }
      this.saveScript.emit(returnValue);
    } else {
      this.isConfirmSaveScript=false;
    }
  }

  onCancelScript(){
    this.modifiedScriptContent=this.scriptFileName[this.currentScript];
  }


  open(event: Event) { // used to upload file
    this.processFile=true;
    if (event.target instanceof HTMLInputElement && event.target.files!==undefined && event.target.files!==null && event.target.files.length > 0) {
          this.scriptFileName[this.scriptFileName.length]=event.target.files[0].name;
          this.myForm.controls['fileScriptName'].setValue(event.target.files[0].name);
          this.scriptFileContent[this.scriptFileContent.length]="";
      //this.fileType=event.target.files[0].type;
      //this.nameLocation="local";
        const reader = new FileReader();
        reader.onloadend = () => {
            this.isScriptRetrieved=true;
            this.scriptFileContent[this.scriptFileContent.length-1]=reader.result as string;
            this.currentScript=this.scriptFileContent.length-1;
            this.modifiedScriptContent=this.scriptFileContent[this.currentScript];
          }
        reader.readAsText(event.target.files[0]);
      }
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      const j = changes[propName];
      if (propName === 'afterSaveScript' && changes[propName].firstChange === false) {
        this.scriptError=this.afterSaveScript.msg;
        if (this.afterSaveScript.status==200){
            this.isConfirmSaveScript=false;
        } 
      }
    }
  }

}
