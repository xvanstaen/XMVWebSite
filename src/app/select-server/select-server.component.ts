import {
  Component, OnInit, Input, Output, HostListener, OnDestroy, HostBinding, ChangeDetectionStrategy,
  SimpleChanges, EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID
} from '@angular/core';

import { FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { configServer, classFilesToCache,  LoginIdentif, msgConsole } from '../JsonServerClass';


@Component({
  selector: 'app-select-server',
  templateUrl: './select-server.component.html',
  styleUrls: ['./select-server.component.css']
})
export class SelectServerComponent {


  theForm: FormGroup = new FormGroup({
    testProd: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    googleServer: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    fileSystemServer: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    mongoServer: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    jsonServer: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    localServer: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
  });

  @Input() initConfigServer = new configServer;
  @Output() returnServer = new EventEmitter<any>();

  @Input() selectOneServer :boolean = false;
  @Output() returnOneServer = new EventEmitter<any>();

  tabServers: Array<string> = [
    'cancel','http://localhost:8080', 'https://test-server-359505.uc.r.appspot.com',
    'https://xmv-it-consulting.uc.r.appspot.com', 'https://serverfs.ue.r.appspot.com','localhost:3000'
    ]
  
  isSelectServer:boolean=false;
  saveSelectedServer:string="";

  ngOnInit(){
    if (this.selectOneServer===false){
      this.theForm.controls['googleServer'].setValue(this.initConfigServer.googleServer);
      this.theForm.controls['mongoServer'].setValue(this.initConfigServer.mongoServer);
      this.theForm.controls['fileSystemServer'].setValue(this.initConfigServer.fileSystemServer);
      this.theForm.controls['jsonServer'].setValue(this.tabServers[4]);
    } else {
      this.isSelectServer=true;
    }
    
  }


  onActionServer(event:any){
    this.saveSelectedServer=event.target.id;
    this.isSelectServer=true;
  }

  selectServer(event: any) {
    this.isSelectServer=false;
    if (this.selectOneServer===true){
      this.returnOneServer.emit({'server':event.target.textContent.trim()});
    } else if (event.target.textContent.trim()!=='cancel'){
      if (this.saveSelectedServer==='google'){
        this.theForm.controls['googleServer'].setValue(event.target.textContent.trim());
      } else if (this.saveSelectedServer==='mongo'){
        this.theForm.controls['mongoServer'].setValue(event.target.textContent.trim());
      } else if (this.saveSelectedServer==='fileSystem'){
        this.theForm.controls['fileSystemServer'].setValue(event.target.textContent.trim());
      } else if (this.saveSelectedServer==='localServer'){
        this.theForm.controls['flocalServer'].setValue(event.target.textContent.trim());
       } else if (this.saveSelectedServer==='jsonServer'){
          this.theForm.controls['jsonServer'].setValue(event.target.textContent.trim());
        }
      this.submitValues();
    }
  }

  submitValues(){

      this.returnServer.emit({'google':this.theForm.controls['googleServer'].value,
                              'mongo':this.theForm.controls['mongoServer'].value,
                              'fileSystem':this.theForm.controls['fileSystemServer'].value,
                              'jsonServer':this.theForm.controls['jsonServer'].value,
                              'localServer':this.theForm.controls['localServer'].value,
                            });

  }

}
