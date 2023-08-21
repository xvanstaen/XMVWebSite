import { Component, OnInit , Input, Output, HostListener,  OnDestroy, HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
  
import { DatePipe, formatDate } from '@angular/common'; 

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { Observable } from 'rxjs';

import { BucketList, Bucket_List_Info  } from '../JsonServerClass';

// configServer is needed to use ManageGoogleService
// it is stored in MangoDB and accessed via ManageMangoDBService

import {msginLogConsole} from '../consoleLog'
import { configServer, LoginIdentif, msgConsole } from '../JsonServerClass';
import {classPosDiv, getPosDiv} from '../getPosDiv';
import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import {AccessConfigService} from 'src/app/CloudServices/access-config.service';

import { classFileSystem, classAccessFile }  from 'src/app/classFileSystem';

import { fnAddTime, convertDate, strDateTime, fnCheckLockLimit, checkData, validateLock, createRecord, updatedAt  } from '../MyStdFunctions';

@Component({
  selector: 'app-file-system-service',
  templateUrl: './file-system-service.component.html',
  styleUrls: ['./file-system-service.component.css']
})
export class FileSystemServiceComponent {
  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageMangoDBService: ManageMangoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    @Inject(LOCALE_ID) private locale: string,
    ) { }

  @Output() returnStatus= new EventEmitter<any>();

  @Input() configServer = new configServer;
  @Input() identification= new LoginIdentif;
  @Input() iWait:number=0;
  @Input() tabLock:Array<classAccessFile>=[]; //0=unlocked; 1=locked by user; 2=locked by other user; 3=must be checked;
  @Input()callUpdateSystemFile:number=0;

  myLogConsole:boolean=false;
  myConsole:Array< msgConsole>=[];
  returnConsole:Array< msgConsole>=[];
  SaveConsoleFinished:boolean=false;
  HTTP_Address:string='';
  type:string='';

  EventHTTPReceived:Array<boolean>=[];
  maxEventHTTPrequest:number=1;
  id_Animation:Array<number>=[];
  TabLoop:Array<number>=[];
  NbWaitHTTP:number=0;

  

ngOnInit(){
  this.processFileSystem(this.iWait);
           
}

processFileSystem(iWait:number){
  var theStatus:any;
  //this.EventHTTPReceived[iWait]=false;
  //this.NbWaitHTTP++;
  //this.waitHTTP(this.TabLoop[iWait],30000,iWait);
  console.log('process fileSystem ' + this.tabLock[iWait].objectName);
  this.ManageGoogleService.getContentObject(this.configServer, this.configServer.bucketFileSystem, this.tabLock[iWait].objectName)
      .subscribe((data ) => {
        // record is found   

        theStatus=checkData( data, iWait, this.tabLock);     
        if (Array.isArray(theStatus)===false){
          
          if (typeof theStatus !== 'object'){
              if (theStatus===300){
                console.log( this.tabLock[iWait].objectName + ' ==> already locked ; status= ' + theStatus);
                this.returnStatus.emit ({iWait: iWait,
                  message: "already locked detected after checkData ", error:theStatus
                });
              } else {
                console.log(this.tabLock[iWait].objectName +' error on Lock after checkData ' + theStatus);
                this.returnStatus.emit ({iWait: iWait,
                  message: "error on Lock after checkData ", error: theStatus
                });
              }
          } else {
            this.returnStatus.emit({iWait: iWait, status:theStatus});
          }

        } 
        else if (typeof theStatus === 'object'  ){
          for (var i=0; i<theStatus.length && (theStatus[i].object!==this.tabLock[iWait].object || theStatus[i].bucket!==this.tabLock[iWait].bucket); i++){}
          if (this.tabLock[iWait].action==="lock" && i<theStatus.length){
            this.tabLock[iWait].createdAt = theStatus[i].createdAt;
            this.tabLock[iWait].updatedAt = theStatus[i].updatedAt;
            this.tabLock[iWait].lock = 1;
            console.log('record ' + this.tabLock[iWait].objectName + ' locked - createdAT' +  this.tabLock[iWait].createdAt + '  updatedAt' + this.tabLock[iWait].updatedAt);

          } else if (this.tabLock[iWait].action==="unlock" && i===theStatus.length){
            this.tabLock[iWait].lock = 0;
            console.log('record ' + this.tabLock[iWait].objectName + ' unlocked  - tabLock[iWait].lock=0' );
          } else if ((this.tabLock[iWait].action==="updatedAt" || this.tabLock[iWait].action==="check&update") && i<theStatus.length){
            this.tabLock[iWait].updatedAt = theStatus[i].updatedAt;
            this.tabLock[iWait].createdAt = theStatus[i].createdAt;
            console.log('record ' + this.tabLock[iWait].object + ' updated - createdAT' +  this.tabLock[iWait].createdAt + '  updatedAt' + this.tabLock[iWait].updatedAt);
          }  

          // write in FileSystem
          const file=new File ([JSON.stringify(theStatus)], this.tabLock[iWait].objectName, {type: 'application/json'});
          this.ManageGoogleService.uploadObject(this.configServer, this.configServer.bucketFileSystem, file )
            .subscribe(res => {
              if (res.type===4){
                console.log(' file system ' + this.tabLock[iWait].objectName + ' saved ');
                this.returnStatus.emit ({iWait: iWait, status: this.tabLock});
              }
              },
              err => {
                  console.log('on Lock ' + this.tabLock[iWait].objectName + ' - after save is a failure ' + err);
                  this.returnStatus.emit ({iWait: iWait, error: err, fileSystem: theStatus});;
              })
        } else {
          console.log(this.tabLock[iWait].objectName + '===> after updateFileSystemt() - ERROR 808 -->  '+ theStatus);
          //console.log('Should process empty file'); 
          this.returnStatus.emit ({iWait: iWait,  message: "could not process updateFileSystem " , error: theStatus });
        }
      },
      (err) => {  
        // file is not found
        if (this.tabLock[iWait].action==="lock"  || this.tabLock[iWait].action==="check&update"){
          theStatus=checkData( [], iWait, this.tabLock); 
          if (typeof theStatus === 'object'){
                //console.log('file not found & record created');
                
                this.tabLock[iWait].createdAt = theStatus[theStatus.length-1].createdAt;
                this.tabLock[iWait].updatedAt = theStatus[theStatus.length-1].updatedAt;
                this.tabLock[iWait].lock = 1;
                console.log('record ' + this.tabLock[iWait].objectName + ' locked - createdAT' +  this.tabLock[iWait].createdAt + '  updatedAt' + this.tabLock[iWait].updatedAt);
    
                const file=new File ([JSON.stringify(theStatus)], this.tabLock[iWait].objectName, {type: 'application/json'});
                this.ManageGoogleService.uploadObject(this.configServer, this.configServer.bucketFileSystem, file )
                  .subscribe(res => {
                      if (res.type===4){
                        console.log(' file system ' + this.tabLock[iWait].objectName + ' saved ');
                        this.returnStatus.emit ({iWait: iWait, status:this.tabLock});
                      }
                      },
                      err => {
                          console.log('on Lock ' + this.tabLock[iWait].objectName + ' - after save is a failure ' + err);
                          this.returnStatus.emit ({iWait: iWait,  message: "on Lock - after save is a failure ", error:err.status });
                      })
          }
          else {
              if (theStatus===300){
                console.log(' file ' + this.tabLock[iWait].objectName + 'empty however already locked detected after checkData ?? status=' + theStatus);
                this.returnStatus.emit ({iWait: iWait, message: " file empty however already locked detected after checkData " , error: theStatus });
              } else {
                console.log(this.tabLock[iWait].object + 'file empty however  error on Lock after checkData?? status= ' + theStatus);
                this.returnStatus.emit ({iWait: iWait,  message: " file empty however error on Lock after checkData " , error: theStatus });
              }
          }
        } else if (this.tabLock[iWait].action==="unlock"){
          this.returnStatus.emit ({iWait: iWait, message: "on Unlock Err809 - file not found "});                  
        } else if (this.tabLock[iWait].action==="check" || this.tabLock[iWait].action==="updatedAt" ){
            console.log('check file ' + this.tabLock[iWait].objectName +  ' does not exist; return inData.status 800');
            //this.tabLock[iWait].createdAt='';
            //this.tabLock[iWait].updatedAt='';
            //this.tabLock[iWait].status=800;
            this.returnStatus.emit ({iWait: iWait, status:this.tabLock[iWait]});
        } else {
          this.returnStatus.emit ({iWait: iWait, message: "on Unlock Err819 - file not found & action unkown = " + this.tabLock[iWait].action });
        }
    })
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
      }  
  }

LogMsgConsole(msg:string){
  if (this.myConsole.length>40){
    //this.SaveNewRecord('logconsole','ConsoleLog.json',this.myLogConsole, -1);
    //this.message='Saving of LogConsole';
  }
  this.SaveConsoleFinished=false;

  this.myLogConsole=true;

  msginLogConsole(msg, this.myConsole,this.myLogConsole, this.SaveConsoleFinished,this.HTTP_Address, this.type);
  
  }



firstLoop:boolean=true;
ngOnChanges(changes: SimpleChanges) { 
  for (const propName in changes){
    const j=changes[propName];

    if (propName==='callUpdateSystemFile'){
      console.log('*******');
      if (this.firstLoop===true){
          console.log('******* file-system-service.component ===> ngOnChange this.firstLoop===true   current value of callUpdateSystemFile=' + changes[propName].currentValue 
          + 'callUpdateSystemFile = ' + this.callUpdateSystemFile);
          this.firstLoop=false;
      } else {

            console.log('******* file-system-service.component ===> ngOnChange this.firstLoop===false   current callUpdateSystemFile=' + changes[propName].currentValue 
            + 'callUpdateSystemFile = ' + this.callUpdateSystemFile  );
            this.processFileSystem(this.iWait);
      }
    }
  }
}

}
