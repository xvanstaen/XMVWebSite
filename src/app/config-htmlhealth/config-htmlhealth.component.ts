import { Component, OnInit , Input, Output, HostListener, OnChanges, HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,  signal, input, EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { FormGroup, FormControl, Validators} from '@angular/forms';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";

import { configServer, LoginIdentif, msgConsole, classCredentials, classtheEvent } from '../JsonServerClass';

import { ManageGoogleService } from '../CloudServices/ManageGoogle.service';
import { ManageMongoDBService } from '../CloudServices/ManageMongoDB.service';

import { classConfHTMLFitHealth, classConfTableAll } from "../Health/classConfHTMLTableAll"


@Component({
  selector: 'app-config-htmlhealth',
  templateUrl: './config-htmlhealth.component.html',
  styleUrls: ['./config-htmlhealth.component.css']
})
export class ConfigHTMLHealthComponent {

@Input() ConfigHTMLFitHealth = new classConfHTMLFitHealth; // initial file
@Input() configServer = new configServer;
@Input() bucketName = "";
@Input() fileName="";

newConfigHTMLFitHealth = new classConfHTMLFitHealth; // working file

isConfirmSave=signal<boolean>(false);
isMsg=signal<boolean>(false);

isModified:boolean=false;

newFileName:string="";
msg:string="";


constructor(
    private router:Router,
    private http: HttpClient,
    private scroller: ViewportScroller,
    private ManageGoogleService: ManageGoogleService,
    private ManageMongoDBService: ManageMongoDBService,
    ) {}

ngOnInit(){
  this.newConfigHTMLFitHealth = new classConfHTMLFitHealth;
  this.fillData(this.ConfigHTMLFitHealth,this.newConfigHTMLFitHealth);
  this.newFileName = this.fileName;

}

fillData(infile:classConfHTMLFitHealth, outFile:classConfHTMLFitHealth){
    outFile.fileType = infile.fileType;
    outFile.debugPhone = infile.debugPhone;
    outFile.ConfigHealth.fileType = infile.ConfigHealth.fileType;
    outFile.ConfigHealth.updatedAt = infile.ConfigHealth.updatedAt;
    outFile.ConfigHealth.confTableAll.width=infile.ConfigHealth.confTableAll.width;
    outFile.ConfigHealth.confTableAll.fontSize=infile.ConfigHealth.confTableAll.fontSize;
    outFile.ConfigHealth.confTableAll.fontWeight=infile.ConfigHealth.confTableAll.fontWeight;
    outFile.ConfigHealth.confTableAll.height=infile.ConfigHealth.confTableAll.height;
    outFile.ConfigHealth.confTableAll.background=infile.ConfigHealth.confTableAll.background;
    outFile.ConfigHealth.confTableAll.color=infile.ConfigHealth.confTableAll.color;
    outFile.ConfigHealth.confTableAll.overF=infile.ConfigHealth.confTableAll.overF;
    outFile.ConfigHealth.confTableAll.title.height=infile.ConfigHealth.confTableAll.title.height;
    outFile.ConfigHealth.confTableAll.title.fontSize=infile.ConfigHealth.confTableAll.title.fontSize;
    outFile.ConfigHealth.confTableAll.title.fontWeight=infile.ConfigHealth.confTableAll.title.fontWeight;
    outFile.ConfigHealth.confTableAll.title.color=infile.ConfigHealth.confTableAll.title.color;
    outFile.ConfigHealth.confTableAll.title.background=infile.ConfigHealth.confTableAll.title.background;
    outFile.ConfigHealth.confTableAll.colWidth.action=infile.ConfigHealth.confTableAll.colWidth.action;
    outFile.ConfigHealth.confTableAll.colWidth.date=infile.ConfigHealth.confTableAll.colWidth.date;
    outFile.ConfigHealth.confTableAll.colWidth.calBurnt=infile.ConfigHealth.confTableAll.colWidth.calBurnt;
    outFile.ConfigHealth.confTableAll.colWidth.meal=infile.ConfigHealth.confTableAll.colWidth.meal;
    outFile.ConfigHealth.confTableAll.colWidth.ingr=infile.ConfigHealth.confTableAll.colWidth.ingr;
    outFile.ConfigHealth.confTableAll.colWidth.other=infile.ConfigHealth.confTableAll.colWidth.other;
    outFile.ConfigHealth.confTableAll.row.color=infile.ConfigHealth.confTableAll.row.color;
    outFile.ConfigHealth.confTableAll.row.height=infile.ConfigHealth.confTableAll.row.height;
    outFile.ConfigHealth.confTableAll.row.fontSize=infile.ConfigHealth.confTableAll.row.fontSize;
    outFile.ConfigHealth.confTableAll.row.even=infile.ConfigHealth.confTableAll.row.even;
    outFile.ConfigHealth.confTableAll.row.odd=infile.ConfigHealth.confTableAll.row.odd;
    outFile.ConfigHealth.confTableAll.row.background=infile.ConfigHealth.confTableAll.row.background;
    if (infile.ConfigHealth.confTableAll.rowHover!==undefined){
      outFile.ConfigHealth.confTableAll.rowHover.background=infile.ConfigHealth.confTableAll.rowHover.background;
      outFile.ConfigHealth.confTableAll.rowHover.color=infile.ConfigHealth.confTableAll.rowHover.color;
    } 
    outFile.ConfigHealth.confTableAll.rowNew.background=infile.ConfigHealth.confTableAll.rowNew.background;
    outFile.ConfigHealth.confTableAll.rowNew.color=infile.ConfigHealth.confTableAll.rowNew.color;
    outFile.ConfigHealth.confTableAll.subTotal.color=infile.ConfigHealth.confTableAll.subTotal.color;
    outFile.ConfigHealth.confTableAll.subTotal.fontWeight=infile.ConfigHealth.confTableAll.subTotal.fontWeight;
    outFile.ConfigHealth.confTableAll.subTotal.height=infile.ConfigHealth.confTableAll.subTotal.height;
    outFile.ConfigHealth.confTableAll.subTotal.fontSize=infile.ConfigHealth.confTableAll.subTotal.fontSize;
    outFile.ConfigHealth.confTableAll.Total.color=infile.ConfigHealth.confTableAll.Total.color;
    outFile.ConfigHealth.confTableAll.Total.fontWeight=infile.ConfigHealth.confTableAll.Total.fontWeight;
    outFile.ConfigHealth.confTableAll.Total.height=infile.ConfigHealth.confTableAll.Total.height;
    outFile.ConfigHealth.confTableAll.Total.fontSize=infile.ConfigHealth.confTableAll.Total.fontSize;

    outFile.ConfigCalFat = infile.ConfigCalFat;
}


inputData(event:any){
  this.isModified=true;
  this.isMsg.set(false);
  if (event.target.id==="width"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.width=event.target.value;
  } else if (event.target.id==="fontS"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.fontSize=event.target.value;
    } else if (event.target.id==="fontW"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.fontWeight=event.target.value;
  } else if (event.target.id==="height"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.height=event.target.value;
  } else if (event.target.id==="overF"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.overF=event.target.value;
  } else if (event.target.id==="color"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.color=event.target.value;
  } else if (event.target.id==="background"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.background=event.target.value;
  } else if (event.target.id==="titleHeight"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.title.height=event.target.value;
  } else if (event.target.id==="titleFontS"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.title.fontSize=event.target.value;
  } else if (event.target.id==="titleFontW"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.title.fontWeight=event.target.value;
  } else if (event.target.id==="titleColor"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.title.color=event.target.value;
  } else if (event.target.id==="titleBackground"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.title.background=event.target.value;
  }
}

inputRow(event:any){
  this.isModified=true;
  this.isMsg.set(false);
  if (event.target.id==="rowBack"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.row.background=event.target.value;
  } else if (event.target.id==="rowColor"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.row.color=event.target.value;
    } else if (event.target.id==="rowEven"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.row.even=event.target.value;
    } else if (event.target.id==="rowOdd"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.row.odd=event.target.value;
    } else if (event.target.id==="rowHeight"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.row.height=event.target.value;
    } else if (event.target.id==="rowFontS"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.row.fontSize=event.target.value;
    } else if (event.target.id==="rowHcolor"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.rowHover.color=event.target.value;
    } else if (event.target.id==="rowHbackg"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.rowHover.background=event.target.value;
    } else if (event.target.id==="newRowBack"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.rowNew.background=event.target.value;
    } else if (event.target.id==="newRowColor"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.rowNew.color=event.target.value;
    } 
}

inputColWidth(event:any){
  this.isModified=true;
  this.isMsg.set(false);
  if (event.target.id==="action"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.colWidth.action=event.target.value;
  } else if (event.target.id==="calBurnt"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.colWidth.calBurnt=event.target.value;
    } else if (event.target.id==="date"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.colWidth.date=event.target.value;
    } else if (event.target.id==="ingr"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.colWidth.ingr=event.target.value;
    } else if (event.target.id==="meal"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.colWidth.meal=event.target.value;
    } else if (event.target.id==="other"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.colWidth.other=event.target.value;
    } 
}

inputTotal(event:any){
  this.isModified=true;
  this.isMsg.set(false);
  if (event.target.id==="subColor"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.subTotal.color=event.target.value;
  } else if (event.target.id==="subFontS"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.subTotal.fontSize=event.target.value;
    } else if (event.target.id==="subFontW"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.subTotal.fontWeight=event.target.value;
    } else if (event.target.id==="subHeight"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.subTotal.height=event.target.value;
    } else if (event.target.id==="totHeight"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.Total.height=event.target.value;
    } else if (event.target.id==="totFontS"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.Total.fontSize=event.target.value;
    } else if (event.target.id==="totFontW"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.Total.fontWeight=event.target.value;
    } else if (event.target.id==="totColor"){
    this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.Total.color=event.target.value;
    } 
}

cancelUpdates(){
  this.isModified=false;
  this.isConfirmSave.set(false);
  this.newConfigHTMLFitHealth = new classConfHTMLFitHealth;
  this.fillData(this.ConfigHTMLFitHealth, this.newConfigHTMLFitHealth);
  this.isMsg.set(true);
  this.msg="All updates have been cancelled";
}

confirmSave(){
  this.isConfirmSave.set(true);
}
onInput(event:any){
  this.newFileName = event.target.value;
}

saveConfirmed(){
  const date = new Date();
  this.newConfigHTMLFitHealth.ConfigHealth.updatedAt=date.toLocaleDateString('en-US');
  this.saveFile(this.newFileName);
}

cancelSave(){
  this.isConfirmSave.set(false);
}

saveFile(fileName:string){
  const newFileName=fileName;
  var file = new File([JSON.stringify(this.newConfigHTMLFitHealth)], newFileName, { type: 'application/json' });
  this.ManageGoogleService.uploadObject(this.configServer, this.bucketName, file, newFileName)
      .subscribe(res => {
        if (res.type === 4 ) {
          console.log('Successful upload of updated file ' + newFileName);
          this.ConfigHTMLFitHealth=new classConfHTMLFitHealth;
          this.fillData(this.newConfigHTMLFitHealth, this.ConfigHTMLFitHealth);
          this.isConfirmSave.set(false);
          this.isModified=false;
          this.fileName = this.newFileName;
          this.msg="File " + this.newFileName + " successsfully saved";
          this.isMsg.set(true);
        }
      },
      err => {
        console.log("File " + newFileName + " has not been uploaded");
        this.msg="File " + this.newFileName + " has not been uploaded";
        this.isMsg.set(true);
        this.isConfirmSave.set(false);
      })
  
}


}
