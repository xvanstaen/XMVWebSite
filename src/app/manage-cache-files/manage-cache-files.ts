import {
  Component, OnInit, Input, signal, Output, HostListener, OnDestroy, HostBinding, ChangeDetectionStrategy,
  input, effect, SimpleChanges, EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID
} from '@angular/core';
import { CommonModule, DatePipe, formatDate } from '@angular/common';

import { ManageSecuredGoogleService } from '../CloudServices/ManageSecuredGoogle.service';
import { ManageMongoDBService } from '../CloudServices/ManageMongoDB.service';
import { ManageGoogleService } from '../CloudServices/ManageGoogle.service';

import { configServer, classFilesToCache,  UserParam, LoginIdentif, msgConsole } from '../JsonServerClass';
import { fillConfig } from '../copyFilesFunction';

@Component({
  imports: [],
  selector: "app-manage-cache-files",
  styleUrl: "./manage-cache-files.css",
  templateUrl: "./manage-cache-files.html",
  standalone: true, 
})
export class ManageCacheFiles {


  @Input() configServer = new configServer; 
  newConfigServer = new configServer;

  isManageCacheFile=signal<boolean>(false);
  isError=signal<boolean>(false);
  error:string="";

  msgCacheFile={
    status:0,
    msg:"",
    content:[{file:"",bucket:"",updated:true}]
  };

  EventStopWaitHTTP: Array<boolean> = [];
  EventHTTPReceived: Array<boolean> = [];
  maxEventHTTPrequest: number = 20;
  id_Animation: Array<number> = [];
  TabLoop: Array<number> = [];
  maxLoop: number = 4000;


  constructor(
    private ManageSecuredGoogleService: ManageSecuredGoogleService,
    private ManageMongoDBService: ManageMongoDBService,
    private ManageGoogleService: ManageGoogleService,

    ) {effect (() => {
          }
     )}

  ngOnInit() {
    this.newConfigServer=fillConfig(this.configServer);
  }
  
  
  getCacheFile(){
    this.resetObjectCacheFile();
    this.isError.set(false);
    this.isManageCacheFile.set(false);
    this.ManageSecuredGoogleService.getCacheFile(this.newConfigServer )
    .subscribe((data ) => {  
      if (data.status===undefined || data.status===200){
      this.EventHTTPReceived[16]=true;
      this.EventStopWaitHTTP[16]=true;
      this.msgCacheFile.status=data.status;
      this.msgCacheFile.msg=data.msg;
      this.msgCacheFile.content=data.cacheFiles;
      this.isManageCacheFile.set(true);
    } else {
      this.error=data.msg;
      this.isError.set(true);
    }
    }, 
    err => {
      this.error="Cache file could not be retrieved" ;
      this.manageErrorMsg(err);
      this.EventStopWaitHTTP[16]=true;
      this.isError.set(true);
      
    });
  }

  resetObjectCacheFile(){
    this.msgCacheFile.status=0;
    this.msgCacheFile.msg="";
    this.msgCacheFile.content.splice(0,this.msgCacheFile.content.length);
    this.initBeforeCallAPI(16);

  }

  reloadCacheFile(){
    this.resetObjectCacheFile();
    this.isError.set(false);
    this.isManageCacheFile.set(false);
    this.ManageSecuredGoogleService.reloadCacheFile(this.newConfigServer )
    .subscribe((data ) => {  
      if (data.status===undefined || data.status===200){
      this.EventHTTPReceived[16]=true;
      this.EventStopWaitHTTP[16]=true;
      this.msgCacheFile.status=data.status;
      this.msgCacheFile.msg=data.msg;
      this.msgCacheFile.content=data.cacheFiles;
      this.isManageCacheFile.set(true);
    } else {
      this.error=data.msg;
      this.isError.set(true);
    }
    }, 
    err => {
      this.error="Cache file has not been reloaded";
      this.manageErrorMsg(err);
      this.EventStopWaitHTTP[16]=true;
      this.isError.set(true);

    });
  }

resetCacheFile(){
    this.resetObjectCacheFile();
    this.isError.set(false);
    this.isManageCacheFile.set(false);
    this.ManageSecuredGoogleService.resetCacheFile(this.newConfigServer, "All" )
      .subscribe((data ) => {  
        if (data.status===undefined || data.status===200){
        this.EventHTTPReceived[16]=true;
        this.EventStopWaitHTTP[16]=true;
        this.msgCacheFile.status=data.status;
        this.msgCacheFile.msg=data.msg;
        if (data.content!==undefined){
          this.msgCacheFile.content=data.content;
        }
        this.isManageCacheFile.set(true);
      } else {
        this.error=data.msg;
        this.isError.set(true);
      }
      }, 
      err => {
        this.error="Cache file could not be reset";
        this.manageErrorMsg(err);
        this.EventStopWaitHTTP[16]=true;
        this.isError.set(true);
      });
}

manageErrorMsg(err:any){
    if (err.message!==undefined){
      this.error = 'Server may be down  '; // + + err.message;
      this.isError.set(true);
    } else if (err.err.msg!==undefined){
      this.error = err.msg;
      this.isError.set(true);
    }
}

initBeforeCallAPI(numEvent:number){
    this.EventHTTPReceived[numEvent] = false;
    this.EventStopWaitHTTP[numEvent]=false;    
    this.waitHTTP(this.TabLoop[numEvent], this.maxLoop, numEvent);
    this.error="";
    this.isError.set(false);
}

  errorAccessFile:string="";
  waitHTTP(loop: number, max_loop: number, eventNb: number) {
    const pas = 500;
    if (loop % pas === 0) {
      console.log('waitHTTP ==> loop=' + loop + ' max_loop=' + max_loop + '  eventNb=' + eventNb);
    }
    loop++

    this.id_Animation[eventNb] = window.requestAnimationFrame(() => this.waitHTTP(loop, max_loop, eventNb));
    if (loop > max_loop || this.EventHTTPReceived[eventNb] === true || this.EventStopWaitHTTP[eventNb] === true) {
      console.log('exit waitHTTP ==> loop=' + loop + ' max_loop=' + max_loop + ' this.EventHTTPReceived=' +
        this.EventHTTPReceived[eventNb]);
      if (loop > max_loop ){
        this.errorAccessFile=" server problem; timeout reached";
        this.isError.set(true);
      };
      window.cancelAnimationFrame(this.id_Animation[eventNb]);
 
    }
  }


}
