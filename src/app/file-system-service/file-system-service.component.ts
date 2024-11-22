import { Component, OnInit , Input, Output, HostListener,  OnDestroy, HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
  
import { DatePipe, formatDate } from '@angular/common'; 

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { Observable } from 'rxjs';

// configServer is needed to use ManageGoogleService
// it is stored in MongoDB and accessed via ManageMongoDBService

import {msginLogConsole} from '../consoleLog'
import { configServer, LoginIdentif, classCredentials, msgConsole } from '../JsonServerClass';
import {classPosDiv, getPosDiv} from '../getPosDiv';
import { ManageMongoDBService } from '../CloudServices/ManageMongoDB.service';
import { ManageGoogleService } from '../CloudServices/ManageGoogle.service';
import {AccessConfigService} from '../CloudServices/access-config.service';

import { classFileSystem, classAccessFile, classReturnDataFS, classHeaderReturnDataFS, classRetrieveFile }  from '../classFileSystem';

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
    private ManageMongoDBService: ManageMongoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    @Inject(LOCALE_ID) private locale: string,
    ) { }


  @Input() iWait:number=0;
  @Input() tabLock: Array<classAccessFile> = []; //0=unlocked; 1=locked by user; 2=locked by other user; 3=must be checked;
  @Input() configServer = new configServer;
  @Input() identification = new LoginIdentif;
  @Input() onInputAction:string="";
  @Input() credentialsFS = new classCredentials;
  @Input() nbCallFileSystem:number=0;

  @Input() iWaitToRetrieve:Array<classRetrieveFile>=[];

  @Output() resultFileSystem = new EventEmitter<any>();

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

  returnDataFS=new classHeaderReturnDataFS;

ngOnInit(){
       
}

onFileSystem(iWait: number) {
  console.log('start of onFileSystem iWait=' + iWait) ;
  var theAction = this.tabLock[iWait].action;
  const iWaitSave = iWait;
  const dataFromFS = this.returnDataFS;
  this.tabLock[iWait].status = 0;
  this.returnDataFS.errorMsg = "";
  if (this.identification.triggerFileSystem === "No") {
    this.tabLock[iWait].lock = 1;
    this.tabLock[iWait].action = "";
    this.resultFileSystem.emit(this.returnDataFS);
    
  } else {
      this.ManageGoogleService.onFileSystem(this.configServer, this.configServer.bucketFileSystem, 'fileSystem', this.tabLock, iWait.toString())
        .subscribe(
          data => {
            this.returnDataFS = dataFromFS;
            this.returnDataFS.iWait=iWaitSave;
            console.log('return from Server; process data in onFileSystem for iWaitSave=' + iWaitSave + ' dataFromFS.iWait=' + dataFromFS.iWait);
            if (theAction === 'onDestroy') {
              this.tabLock[iWaitSave].status = 0;
            } else {
              this.returnDataFS = this.returnOnFileSystem(data, iWaitSave, this.returnDataFS);
            }
            console.log('end of onFileSystem iWait=' +  + iWaitSave + ' dataFromFS.iWait=' + this.returnDataFS.iWait);
            this.resultFileSystem.emit(this.returnDataFS);
          },
          err => {
            if (theAction === 'onDestroy') {
              if (err.status === 900) {
                // destroy is fine
              } else {
                console.log('Google updateFileSystem general error=' + err.status + '  specific error= ' + err.error.error + ' & message= ' + err.error.message);
                this.returnDataFS.errorMsg = this.returnDataFS.errorMsg + '   update FileSystem =' + err.status ;
              }
            } else {
              console.log('in err');
              this.returnDataFS = this.returnOnFileSystem(err, iWaitSave, this.returnDataFS);
            }
            console.log('end of onFileSystem iWait=' +  + iWaitSave + ' dataFromFS.iWait=' + this.returnDataFS.iWait);
            this.resultFileSystem.emit(this.returnDataFS);
        })

    }
    
  }


  unlockFile(iWait: number) {
    this.tabLock[iWait].action = 'unlock';
    this.onFileSystem(iWait);
  }

  lockFile(iWait: number) {
    this.tabLock[iWait].action = 'lock';
    this.onFileSystem(iWait);
  }

  checkFile(iWait: number) {
    this.tabLock[iWait].action = 'check';
    this.onFileSystem(iWait);
  }

  async checkUpdateFile(iWait: number) {
    this.tabLock[iWait].action = 'check&update';
    this.onFileSystem(iWait);
  }

  updateLockFile(iWait: number) {
    this.tabLock[iWait].action = 'updatedAt';
    this.onFileSystem(iWait);
  }

  
  returnOnFileSystem(data: any, iWait: number, dataFromFS:any) {
    console.log('start returnOnFileSystem iWait=' + iWait);
    dataFromFS.reAccessFile=false;
    if (data.status !== undefined && data.status === 200 && data.tabLock !== undefined) { // tabLock is returned
      console.log('server response: ' + data.tabLock[iWait].object + ' createdAt=' + data.tabLock[iWait].createdAt + '  & updatedAt=' + data.tabLock[iWait].updatedAt + '  & lock value =' + data.tabLock[iWait].lock);
      if (data.tabLock[iWait].credentialDate !== this.credentialsFS.creationDate) { // server was reinitialised
        this.tabLock[iWait] = data.tabLock[iWait];
      }
      // record is locked by another user; no actions can take place for this user so reset
      if (data.tabLock[iWait].createdAt !== undefined) {
        dataFromFS.errorMsg = " data returned on file " + data.tabLock[iWait].objectName + " ==> action = " + data.tabLock[iWait].action + '  lock = ' + data.tabLock[iWait].lock + "  & status = " + data.tabLock[iWait].status;
        console.log(dataFromFS.errorMsg);
        if (this.tabLock[iWait].action === 'unlock') {
          this.tabLock[iWait].lock = 3;
          dataFromFS.onInputAction = "";
          this.tabLock[iWait].createdAt = "";
          this.tabLock[iWait].updatedAt = "";
        }
        else if (data.tabLock[iWait].lock === 1 && this.tabLock[iWait].lock === 2) {
          // file is now locked for this user; need to retrieve the file to ensure we have the latest version
          this.tabLock[iWait] = data.tabLock[iWait];
          this.tabLock[iWait].status=220;
          dataFromFS.onInputAction = "";
          dataFromFS.reAccessFile=true;
          if (iWait === 5) {
            this.tabLock[iWait].status = data.status.tabLockItem;
          }
        } else if (data.tabLock[iWait].lock === 2 && this.tabLock[iWait].lock === 1) {
          // file is now locked by another user, reaccess the file in locked mode
          this.tabLock[iWait].status=230;
          this.tabLock[iWait].lock = data.tabLock[iWait];
          dataFromFS.reAccessFile=true;
          if (iWait !== 0) {
            this.tabLock[iWait].status = 300;
          } else { this.tabLock[iWait].status=230; }
        } else {
          this.tabLock[iWait] = data.tabLock[iWait];
        }
      }

    } else if (data.status !== undefined && data.status.tabLockItem !== undefined && (this.tabLock[iWait].action === 'check' || this.tabLock[iWait].action === 'check&update') && data.status.tabLockItem.createdAt !== undefined) { // tabLock[iWait] is returned
      if (data.status.tabLockItem.status === 810 || data.status.tabLockItem.status === 800) { // record found and belongs to same user or record not found or file empty
        //this.nbCallCredentials = 0;
        if (data.status.tabLockItem.status === 800) { // no file system or no record then lock this user
          this.lockFile(iWait); // ====> the process below has to be reviewed 
        }
        this.tabLock[iWait].status = data.status.tabLockItem;

      } else if (data.status.tabLockItem.status === 820) { // record found and belongs to other user
        //this.nbCallCredentials = 0;
        console.log('error = 820 ; data returned=' + JSON.stringify(data));
        this.tabLock[iWait].lock = 2;
        dataFromFS.onInputAction = "";
        dataFromFS.reAccessFile =  true;
      
      }
    } else if (data.status !== undefined) {
      if (data.status === 300 || data.status === 720) { // 300 record already locked; 720 updatedAt on record locked by another user
        console.log('error = ' + data.status + '  ; data returned =' + JSON.stringify(data));
        //this.nbCallCredentials = 0;
        this.tabLock[iWait].lock = 2;
        dataFromFS.onInputAction = "";
        if (data.status === 720) {
          this.tabLock[iWait].status = 720;
          dataFromFS.reAccessFile =  true;
        } else {
          this.tabLock[iWait].status = 300;
          dataFromFS.errorCode=300;
        }
      } else if (data.status === 700 || data.status === 712 || data.status === 710) { // requested to unlock record which does not exist or is locked by another user
        //this.nbCallCredentials = 0;
        this.tabLock[iWait].lock = 0;
        this.tabLock[iWait].status = data.status;
        dataFromFS.onInputAction = "";
        if (data.status === 712){
          dataFromFS.errorMsg="Access to get credentials is forbidden, updates are not possible";
        } else if (data.status === 700){
          dataFromFS.errorMsg="System failure, updates are not possible";
        } else {
          dataFromFS.errorMsg="Record cannot be unlocked, updates are not possible";
        }
        dataFromFS.errorCode=data.status;
      } else if (data.status === 666) {
        dataFromFS.errorMsg="server cannot process file system because is processed by another user; apps retries once more after 2 seconds";
        console.log(dataFromFS.errorMsg);
        dataFromFS.nbRecall++;
        dataFromFS.status=666;
        var theDate = new Date();
        var iLoop=0;
        var seconds = theDate.getUTCSeconds();
        var myRefTime = seconds + 2; // wait 2 seconds
        if (myRefTime > 59) {
          myRefTime = myRefTime - 59;
        }
        console.log('seconds = '+ seconds+'; try again onFileSystem at seconds = ' + myRefTime);

        while (seconds < myRefTime && iLoop<3000) {
          iLoop++ // this is just a security
          theDate = new Date();
          seconds = theDate.getUTCSeconds();
        }
        console.log('2 seconds are over; iLoop='+iLoop + '  max iLoop=3000');
        
        // let the appropaite feature to call back onFileSystem(iWait)
        /**
        if (dataFromFS.nbRecall < 5) {
          this.onFileSystem(iWait);
        } else {
          dataFromFS.nbRecall = 0;
          if (this.tabLock[iWait].action === 'lock') {
            this.tabLock[iWait].lock = 2;
          }
        }
        **/
      } else if (data.status === 955) {
        dataFromFS.errorMsg = dataFromFS.errorMsg + 'status error=' + data.status;
        dataFromFS.theResetServer = true;
        dataFromFS.errorCode=955;
        this.tabLock[iWait].lock = 3;

      } else if (data.status === 956) {  // record is locked by another user
        dataFromFS.errorMsg = "status " + data.status + " " + data.msg;
        dataFromFS.theResetServer = true;
        this.tabLock[iWait].lock = 3;
        dataFromFS.onInputAction = "";
        this.tabLock[iWait].status = 720;
        dataFromFS.errorCode=720;

        dataFromFS.reAccessFile=true;
      }  else if (data.status === 'err-0') {  
          // file system was empty and no action was taken
          console.log('data received:' + JSON.stringify(data) + '  on action ' + this.tabLock[iWait].action);
      } else {
        dataFromFS.onInputAction = "";
        if (this.tabLock[iWait].action === 'lock' || this.tabLock[iWait].action === "unlock") {
          this.tabLock[iWait].status = 0;
          if (this.tabLock[iWait].action === 'lock') {
            this.tabLock[iWait].lock = 2;
            console.log('which type of data is it????' + JSON.stringify(data) + '  on action ' + this.tabLock[iWait].action);
            dataFromFS.errorMsg= "status " + data.status + " - record is locked ";
          } else {
            this.tabLock[iWait].lock = 3;
          }
         
        } else {
          this.tabLock[iWait].status = 999;
          dataFromFS.errorMsg= "status " + data.status + " - unknown error "
          console.log('which type of data is it????' + JSON.stringify(data) + '  on action ' + this.tabLock[iWait].action);
        }
        dataFromFS.errorCode=999;
      }
    } else {
      console.log('which type of data is it???? : ' + JSON.stringify(data));
      this.tabLock[iWait].status = 999;
      dataFromFS.errorCode=999;
      if (this.tabLock[iWait].action === 'lock') {
        dataFromFS.errorMsg= "status  999 - record is locked ";
        this.tabLock[iWait].lock = 2;
      }
    }
    return (dataFromFS);
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
         window.cancelAnimationFrame(this.id_Animation[eventNb]); 
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

idAnimation:any;
checkClock(refSecond:number){
  const theDate = new Date();
  const theSeconds=theDate.getSeconds() ;
  if (refSecond < theSeconds) {
    this.idAnimation=window.requestAnimationFrame(() => this.checkClock(refSecond));
  } else {
    window.cancelAnimationFrame(this.idAnimation);
  }
}


ngOnChanges(changes: SimpleChanges) { // TO BE REVIEWED 
  // var nbCall=0;
  for (const  propName in changes){
    const j=changes[propName];
    if ((propName==='callUpdateSystemFile')  && changes[propName].firstChange===false){
        console.log('ngOnChanges callUpdateSystemFile iWait=' + this.iWait);
        this.returnDataFS.onInputAction=this.onInputAction;
        this.returnDataFS.iWait = this.iWait;
        //nbCall++;
        this.onFileSystem(this.iWait);
      }
      else if (propName==='nbCallFileSystem'){
          this.returnDataFS.onInputAction=this.onInputAction; 
            for (var i=0; i< this.iWaitToRetrieve.length; i++){
              if (this.iWaitToRetrieve[i].accessFS===true){
                console.log('ngOnChanges nbCallFileSystem iWait=' + this.iWaitToRetrieve[i].iWait);
                this.returnDataFS.iWait = this.iWaitToRetrieve[i].iWait;
                this.iWait=this.iWaitToRetrieve[i].iWait;;
                this.onFileSystem(this.iWaitToRetrieve[i].iWait);
              }
            }
      }
    }
    
  }

}
