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
import { ManageMongoDBService } from 'src/app/CloudServices/ManageMongoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import {AccessConfigService} from 'src/app/CloudServices/access-config.service';

import { classFileSystem, classAccessFile, classReturnDataFS }  from 'src/app/classFileSystem';

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

  iWaitSave: number = 0;

  returnDataFS=new classReturnDataFS;

ngOnInit(){

  for (var i = 0; i < 7; i++) {
    const thePush = new classAccessFile;
    this.returnDataFS.tabLock.push(thePush);
    this.returnDataFS.tabLock[i]=this.tabLock[i];
  }
  this.returnDataFS.onInputAction=this.onInputAction;
  this.onFileSystem(this.iWait);
           
}

onFileSystem(iWait: number) {
    var theAction = this.returnDataFS.tabLock[iWait].action;
    this.iWaitSave = iWait;
    this.returnDataFS.tabLock[iWait].status = 0;
    if (this.identification.triggerFileSystem === "No") {
      this.returnDataFS.tabLock[iWait].lock = 1;
      this.returnDataFS.tabLock[iWait].action = "";
    } else {

        this.ManageGoogleService.onFileSystem(this.configServer, this.configServer.bucketFileSystem, 'fileSystem', this.returnDataFS.tabLock, iWait.toString())
        .subscribe(
          data => {
            if (theAction === 'onDestroy') {
              this.returnDataFS.tabLock[iWait].status = 0;
            } else {
              this.returnOnFileSystem(data, iWait);
            }
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
              this.returnOnFileSystem(err, iWait);
            }
            this.resultFileSystem.emit(this.returnDataFS);
          })
    }
  }


  unlockFile(iWait: number) {
    this.returnDataFS.tabLock[iWait].action = 'unlock';
    this.onFileSystem(iWait);
  }

  lockFile(iWait: number) {
    this.returnDataFS.tabLock[iWait].action = 'lock';
    this.onFileSystem(iWait);
  }

  checkFile(iWait: number) {
    this.returnDataFS.tabLock[iWait].action = 'check';
    this.onFileSystem(iWait);
  }

  async checkUpdateFile(iWait: number) {
    this.returnDataFS.tabLock[iWait].action = 'check&update';
    this.onFileSystem(iWait);
  }

  updateLockFile(iWait: number) {
    this.returnDataFS.tabLock[iWait].action = 'updatedAt';
    this.onFileSystem(iWait);
  }

  

  returnOnFileSystem(data: any, iWait: number) {
    if (data.status !== undefined && data.status === 200 && data.tabLock !== undefined) { // tabLock is returned
      console.log('server response: ' + data.tabLock[iWait].object + ' createdAt=' + data.tabLock[iWait].createdAt + '  & updatedAt=' + data.tabLock[iWait].updatedAt + '  & lock value =' + data.tabLock[iWait].lock);
      if (data.tabLock[iWait].credentialDate !== this.credentialsFS.creationDate) { // server was reinitialised
        this.returnDataFS.tabLock[iWait] = data.tabLock[iWait];
      }
      // record is locked by another user; no actions can take place for this user so reset
      //this.nbCallCredentials = 0;
      if (data.tabLock[iWait].createdAt !== undefined) {
        this.returnDataFS.errorMsg = this.returnDataFS.errorMsg + " data returned on file " + data.tabLock[iWait].objectName + " ==> action = " + data.tabLock[iWait].action + '  lock = ' + data.tabLock[iWait].lock + "  & status = " + data.tabLock[iWait].status;
        console.log(this.returnDataFS.errorMsg);
        if (this.returnDataFS.tabLock[iWait].action === 'unlock') {
          this.returnDataFS.tabLock[iWait].lock = 3;
          this.returnDataFS.onInputAction = "";
          this.returnDataFS.tabLock[iWait].createdAt = "";
          this.returnDataFS.tabLock[iWait].updatedAt = "";

        }
        else if (data.tabLock[iWait].lock === 1 && this.returnDataFS.tabLock[iWait].lock === 2) {
          // file is now locked for this user; need to retrieve the file to ensure we have the latest version
          this.returnDataFS.tabLock[iWait] = data.tabLock[iWait];
          this.returnDataFS.onInputAction = "";
          this.returnDataFS.reAccessFile=true;
          if (iWait === 5) {
            this.returnDataFS.tabLock[iWait].status = data.status.tabLockItem;
          }


        } else if (data.tabLock[iWait].lock === 2 && this.returnDataFS.tabLock[iWait].lock === 1) {
          // file is now locked by another user, reaccess the file in locked mode
          this.returnDataFS.tabLock[iWait].lock = data.tabLock[iWait];
          this.returnDataFS.reAccessFile=true;
          if (iWait !== 0) {
            this.returnDataFS.tabLock[iWait].status = 300;
          }

        } else {
          this.returnDataFS.tabLock[iWait] = data.tabLock[iWait];
          /*
          if (data.tabLock[iWait].lock === 1 && this.returnDataFS.onInputAction === "onInputDailyAll") {
            this.onInputDailyAllA(this.theEvent);
          } else if (data.tabLock[iWait].lock === 1 && this.returnDataFS.onInputAction === "onAction") {
            this.returnDataFS.onInputAction = "";
            this.onActionA(this.theEvent);
          } else if (this.tabLock[iWait].action === 'check&update' && data.tabLock[iWait].status === 0 && this.isMustSaveFile === true) {
            this.ConfirmSave(this.theEvent);
          } else {
            console.log('File is locked; no specific action; process continues');
            this.returnDataFS.onInputAction = "";
          }
          */
        }
      }

    } else if (data.status !== undefined && data.status.tabLockItem !== undefined && (this.returnDataFS.tabLock[iWait].action === 'check' || this.returnDataFS.tabLock[iWait].action === 'check&update') && data.status.tabLockItem.createdAt !== undefined) { // tabLock[iWait] is returned

      if (data.status.tabLockItem.status === 810 || data.status.tabLockItem.status === 800) { // record found and belongs to same user or record not found or file empty
        //this.nbCallCredentials = 0;
        if (data.status.tabLockItem.status === 800) { // no file system or no record then lock this user
          this.lockFile(iWait); // ====> the process below has to be reviewed 
        }
        this.returnDataFS.tabLock[iWait].status = data.status.tabLockItem;
        /*
        if (this.returnDataFS.onInputAction === "onAction") {
          this.returnDataFS.onInputAction = "";
          this.onActionA(this.theEvent);
        } else if (this.returnDataFS.onInputAction === "onInputDailyAll") {
          this.returnDataFS.onInputAction = "";
          this.onInputDailyAllA(this.theEvent);
        } 
        if (this.isSaveConfirm===false && data.status === 810){
          this.updateLockFile(iWait);
        }
        */
        /*
        if (iWait === 0) {
          if (this.isSaveHealth === true) {
            this.ProcessSaveHealth(this.theEvent);
          } else if (this.isMustSaveFile === true) {
            this.ConfirmSave(this.theEvent);
          } else if (data.status === 810) {
            this.updateLockFile(iWait);
          }
        } else if (iWait === 1) {
          if (this.isSaveCaloriesFat === true) {
            this.processSaveCaloriesFat(this.saveEvent);
          } else if (data.status === 810) {
            this.updateLockFile(iWait);
          }
        } else if (iWait === 5) {
          if (this.isSaveParamChart === true) {
            this.processSaveParamChart();
          } else if (data.status === 810) {
            this.updateLockFile(iWait);
          }
        }
        */
      } else if (data.status.tabLockItem.status === 820) { // record found and belongs to other user
        //this.nbCallCredentials = 0;
        this.returnDataFS.tabLock[iWait].lock = 2;
        this.returnDataFS.onInputAction = "";
        this.returnDataFS.reAccessFile =  true;
          /**
        if (iWait === 0) {
          this.reAccessHealthFile();
        } else if (iWait === 1) {
          this.reAccessConfigCal();
        } else if (iWait === 5) {
          this.tabLock[iWait].status = data.status.tabLockItem;
          this.reAccessChartFile();
        }
        */
      }

    } else if (data.status !== undefined) {

      if (data.status === 300 || data.status === 720) { // 300 record already locked; 720 updatedAt on record locked by another user
        //this.nbCallCredentials = 0;
        this.returnDataFS.tabLock[iWait].lock = 2;
        this.returnDataFS.onInputAction = "";
        if (data.status === 720) {
          this.returnDataFS.tabLock[iWait].status = 720;
          this.returnDataFS.reAccessFile =  true;
          /**
          if (iWait === 0) {
            this.reAccessHealthFile();
          } else if (iWait === 1) {
            this.reAccessConfigCal();
          } else if (iWait === 5) {
            this.reAccessChartFile();
          }
           */
        } else {
          this.returnDataFS.tabLock[iWait].status = 300;
        }
      } else if (data.status === 700 || data.status === 712 || data.status === 710) { // requested to unlock record which does not exist or is locked by another user
        //this.nbCallCredentials = 0;
        this.returnDataFS.tabLock[iWait].lock = 0;
        this.returnDataFS.tabLock[iWait].status = data.status;
        this.returnDataFS.onInputAction = "";
        if (data.status === 712){
          this.returnDataFS.errorMsg="Access to get credentials is forbidden, updates are not possible";
        } else if (data.status === 700){
          this.returnDataFS.errorMsg="System failure, updates are not possible";
        } else {
          this.returnDataFS.errorMsg="Record cannot be unlocked, updates are not possible";
        }

      } else if (data.status === 666) {
        console.log("server cannot process file system because is processed by another user; try once more in 2 seconds");
        this.returnDataFS.nbRecall++;
        //this.nbCallCredentials = 0;
        var theDate = new Date();
        var seconds = theDate.getUTCSeconds();
        var myRefTime = seconds + 2; // wait 2 seconds
        if (myRefTime > 60) {
          myRefTime = myRefTime - 60;
        }
        while (seconds < myRefTime) {
          theDate = new Date();
          seconds = theDate.getUTCSeconds();
        }
        console.log('try again onFileSystem');
        if (this.returnDataFS.nbRecall < 5) {
          this.onFileSystem(iWait);
        } else {
          this.returnDataFS.nbRecall = 0;
          if (this.returnDataFS.tabLock[iWait].action === 'lock') {
            this.returnDataFS.tabLock[iWait].lock = 2;
          }
        }
      } else if (data.status === 955) {
        this.returnDataFS.errorMsg = this.returnDataFS.errorMsg + 'status error=' + data.status;
        this.returnDataFS.theResetServer = true;
        this.returnDataFS.tabLock[iWait].lock = 3;

      } else if (data.status === 956) {  // record is locked by another user
        this.returnDataFS.errorMsg = "status " + data.status + " " + data.msg;
        this.returnDataFS.theResetServer = true;
        this.returnDataFS.tabLock[iWait].lock = 3;
        this.returnDataFS.onInputAction = "";
        this.returnDataFS.tabLock[iWait].status = 720;

        this.returnDataFS.reAccessFile=true;
        /**
        if (iWait === 0) {
          this.reAccessHealthFile();
        } else if (iWait === 1) {
          this.reAccessConfigCal();
        } else if (iWait === 5) {
          this.reAccessChartFile();
        }
         */

      }  else if (data.status === 'err-0') {  
          // file system was empty and no action was taken
          console.log('data received:' + JSON.stringify(data) + '  on action ' + this.returnDataFS.tabLock[iWait].action);
      } else {

        //this.nbCallCredentials = 0;

        this.returnDataFS.onInputAction = "";

        if (this.returnDataFS.tabLock[iWait].action === 'lock' || this.returnDataFS.tabLock[iWait].action === "unlock") {

          this.returnDataFS.tabLock[iWait].status = 0;
          if (this.returnDataFS.tabLock[iWait].action === 'lock') {
            this.returnDataFS.tabLock[iWait].lock = 2;
            console.log('which type of data is it????' + JSON.stringify(data) + '  on action ' + this.returnDataFS.tabLock[iWait].action);
            this.returnDataFS.errorMsg= "status " + data.status + " - record is locked ";
          } else {
            this.returnDataFS.tabLock[iWait].lock = 3;
          }
        } else {
          this.returnDataFS.tabLock[iWait].status = 999;
          this.returnDataFS.errorMsg= "status " + data.status + " - unknown error "
          console.log('which type of data is it????' + JSON.stringify(data) + '  on action ' + this.returnDataFS.tabLock[iWait].action);
        }

      }

    } else {
      console.log('which type of data is it???? : ' + JSON.stringify(data));
      this.returnDataFS.tabLock[iWait].status = 999;
      if (this.returnDataFS.tabLock[iWait].action === 'lock') {
        this.returnDataFS.errorMsg= "status  999 - record is locked ";
        this.returnDataFS.tabLock[iWait].lock = 2;
      }
    }
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



ngOnChanges(changes: SimpleChanges) { // TO BE REVIEWED
  for (const propName in changes){
    const j=changes[propName];
    if (propName==='callUpdateSystemFile' && changes[propName].firstChange===false){
            this.onFileSystem(this.iWait);
      }
    }
  }

}
