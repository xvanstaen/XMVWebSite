import { Component, Input,  signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";

import { configServer } from '../JsonServerClass';

import { ManageGoogleService } from '../CloudServices/ManageGoogle.service';

import { classConfHTMLFitHealth} from "../Health/classConfHTMLTableAll";

// Module-level constants, declared once above the class
const TABLE_KEYS = ['width', 'fontSize', 'fontWeight', 'height', 'background', 'color', 'overF'] as const;
const TITLE_KEYS = ['height', 'fontSize', 'fontWeight', 'color', 'background'] as const;
const COL_KEYS   = ['action', 'date', 'calBurnt', 'meal', 'ingr', 'other'] as const;
const ROW_KEYS   = ['color', 'height', 'fontSize', 'even', 'odd', 'background'] as const;
const COLOR_KEYS = ['background', 'color'] as const;   // rowHover, rowNew
const TOTAL_KEYS = ['color', 'fontWeight', 'height', 'fontSize'] as const;  // subTotal, Total


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
private debug:boolean=false;
newConfigHTMLFitHealth = new classConfHTMLFitHealth; // working file

isConfirmSave=signal<boolean>(false);
isMsg=signal<boolean>(false);

isModified:boolean=false;

newFileName:string="";
msg:string="";


constructor(
    private ManageGoogleService: ManageGoogleService,
    ) {}

ngOnInit(){
  this.newConfigHTMLFitHealth = new classConfHTMLFitHealth;
  this.fillData(this.ConfigHTMLFitHealth,this.newConfigHTMLFitHealth);
  this.newFileName = this.fileName;

}

private copyKeys<T, K extends keyof T>(src: T, dst: T, keys: readonly K[]): void {
  for (const k of keys) dst[k] = src[k];
}

fillData(infile: classConfHTMLFitHealth, outFile: classConfHTMLFitHealth): void {
  outFile.fileType = infile.fileType;
  outFile.debugPhone = infile.debugPhone;

  const src = infile.ConfigHealth;
  const dst = outFile.ConfigHealth;
  dst.fileType = src.fileType;
  dst.updatedAt = src.updatedAt;

  const s = src.confTableAll;
  const d = dst.confTableAll;
  /*
  this.copyKeys(s, d, TABLE_KEYS);
  this.copyKeys(s.title, d.title, TITLE_KEYS);
  this.copyKeys(s.colWidth, d.colWidth, COL_KEYS);
  this.copyKeys(s.row, d.row, ROW_KEYS);
  if (s.rowHover) this.copyKeys(s.rowHover, d.rowHover, COLOR_KEYS);
  this.copyKeys(s.rowNew, d.rowNew, COLOR_KEYS);
  this.copyKeys(s.subTotal, d.subTotal, TOTAL_KEYS);
  this.copyKeys(s.Total, d.Total, TOTAL_KEYS);
  */

  Object.assign(d.title, s.title);
  Object.assign(d.colWidth, s.colWidth);
  Object.assign(d.row, s.row);
  if (s.rowHover) Object.assign(d.rowHover, s.rowHover);
  Object.assign(d.rowNew, s.rowNew);
  Object.assign(d.subTotal, s.subTotal);
  Object.assign(d.Total, s.Total);

  outFile.ConfigCalFat = infile.ConfigCalFat;
}


inputData(event:any){
  this.isModified=true;
  this.isMsg.set(false);
  switch (event.target.id){
    case ("width"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.width=event.target.value; break;
    case("fontS"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.fontSize=event.target.value; break;
    case("fontW"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.fontWeight=event.target.value; break;
    case("height"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.height=event.target.value; break;
    case("overF"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.overF=event.target.value; break;
    case("color"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.color=event.target.value; break;
    case("background"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.background=event.target.value; break;
    case("titleHeight"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.title.height=event.target.value; break;
    case("titleFontS"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.title.fontSize=event.target.value; break;
    case("titleFontW"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.title.fontWeight=event.target.value; break;
    case("titleColor"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.title.color=event.target.value; break;
    case("titleBackground"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.title.background=event.target.value; break;
  }
}

inputRow(event:any){
  this.isModified=true;
  this.isMsg.set(false);
  switch (event.target.id){
    case("rowBack"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.row.background=event.target.value; break;
    case("rowColor"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.row.color=event.target.value; break;
    case("rowEven"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.row.even=event.target.value; break;
    case("rowOdd"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.row.odd=event.target.value; break;
    case("rowHeight"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.row.height=event.target.value; break;
    case("rowFontS"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.row.fontSize=event.target.value; break;
    case("rowHcolor"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.rowHover.color=event.target.value; break;
    case("rowHbackg"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.rowHover.background=event.target.value; break;
    case("newRowBack"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.rowNew.background=event.target.value; break;
    case("newRowColor"):
      this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.rowNew.color=event.target.value; break;
    } 
}

inputColWidth(event:any){
  this.isModified=true;
  this.isMsg.set(false);
  switch (event.target.id){
      case ("action"):
        this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.colWidth.action=event.target.value; break;
      case ("calBurnt"):
        this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.colWidth.calBurnt=event.target.value; break;
      case ("date"):
        this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.colWidth.date=event.target.value; break;
      case ("ingr"):
        this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.colWidth.ingr=event.target.value; break;
      case ("meal"):
        this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.colWidth.meal=event.target.value; break;
      case ("other"):
        this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.colWidth.other=event.target.value; break;
    } 
}

inputTotal(event:any){
  this.isModified=true;
  this.isMsg.set(false);
  switch (event.target.id){
      case ("subColor"):
        this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.subTotal.color=event.target.value; break;
      case ("subFontS"):
        this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.subTotal.fontSize=event.target.value; break;
      case ("subFontW"):
        this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.subTotal.fontWeight=event.target.value; break;
      case ("subHeight"):
        this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.subTotal.height=event.target.value; break;
      case ("totHeight"):
        this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.Total.height=event.target.value; break;
      case ("totFontS"):
        this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.Total.fontSize=event.target.value; break;
      case ("totFontW"):
        this.newConfigHTMLFitHealth.ConfigHealth.confTableAll.Total.fontWeight=event.target.value; break;
      case ("totColor"):
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
          this.log('Successful upload of updated file ' + newFileName);
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
        this.log("File " + newFileName + " has not been uploaded");
        this.msg="File " + this.newFileName + " has not been uploaded";
        this.isMsg.set(true);
        this.isConfirmSave.set(false);
      })
  
}
  private log(...args: unknown[]) {
    if (this.debug) console.log('[app.component:]', ...args);
  }

}
