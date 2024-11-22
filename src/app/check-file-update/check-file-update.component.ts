import { Component, OnInit , Input, Output, HostListener,  HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
  
import { DatePipe, formatDate } from '@angular/common'; 

import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { Observable } from 'rxjs';
import { ManageMongoDBService } from '../CloudServices/ManageMongoDB.service';
import { ManageGoogleService } from '../CloudServices/ManageGoogle.service';
import { configServer, LoginIdentif, msgConsole } from '../JsonServerClass';
import { classFileSystem, classAccessFile }  from '../classFileSystem';
import { convertDate } from '../MyStdFunctions'

@Component({
  selector: 'app-check-file-update',
  templateUrl: './check-file-update.component.html',
  styleUrls: ['./check-file-update.component.css']
})
export class CheckFileUpdateComponent {
  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageMongoDBService: ManageMongoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    @Inject(LOCALE_ID) private locale: string,
    ) { }

  @Input() inData=new classAccessFile;
  @Input() configServer=new configServer;

  @Output() returnValue= new EventEmitter<classAccessFile>();

  status=new classAccessFile;
  fileSystem:Array<classFileSystem>=[];

  ngOnInit(){
    this.status.action=this.inData.action;
    this.status.bucket=this.inData.bucket;
    this.status.object=this.inData.object;
    this.status.iWait=this.inData.iWait;
    this.status.user=this.inData.user;
    this.status.status=0;

    this.ManageGoogleService.getContentObject(this.configServer, this.configServer.bucketFileSystem, this.configServer.objectFileSystem)
    .subscribe((data ) => {   
      
      for (var i=0; i<data.length && (data[i].object!==this.inData.object || data[i].bucket!==this.inData.bucket); i++){}
      if (this.inData.action==="lock"){
          if (i===data.length ){
            // record is not locked so create a new record and flag lock to true
            this.createRecord();
            this.saveFile();
          } else { // record already exists and already locked
            this.status.status=300;
            this.status.lock=2;
            this.returnValue.emit(this.status);
          }
        } else if (this.inData.action==="unlock"){
          if (i===data.length ){
            // record is not found so cannot be unlocked
            // should log an error
            this.status.status=400;
            this.status.lock=0;
            this.returnValue.emit(this.status);
          } else { // record is found; delete it
            this.fileSystem.splice(i,1);
            this.status.lock=0;
            this.saveFile();
          }
        }
    
    },
    error_handler => {
      this.createRecord();
      this.saveFile();
      //this.status.error=500; // record not found 
      //this.returnValue.emit(this.status);
    }
    )
  }

  createRecord(){
    const recordSystem=new classFileSystem;
    this.fileSystem.push(recordSystem);
    this.fileSystem[this.fileSystem.length-1].bucket=this.inData.bucket;
    this.fileSystem[this.fileSystem.length-1].object=this.inData.object;
    this.fileSystem[this.fileSystem.length-1].byUser=this.inData.user;
    this.fileSystem[this.fileSystem.length-1].lock=true;
    const theDate=new Date();
    const myTime=theDate.toString().substring(16,23);
    const myDate=convertDate(theDate,"YYYYMMDD") + myTime;
    this.fileSystem[this.fileSystem.length-1].createdAt=myDate;
    this.fileSystem[this.fileSystem.length-1].updatedAt=myDate;
  }


  saveFile(){
    var file=new File ([JSON.stringify(this.fileSystem)],this.configServer.objectFileSystem, {type: 'application/json'});
    
    this.ManageGoogleService.uploadObject(this.configServer, this.configServer.bucketFileSystem, file , this.configServer.objectFileSystem)
      .subscribe(res => {
              if (res.type===4){
                this.status.status=0;
                if (this.inData.action==="unlock"){
                  this.status.lock=0;
                } else {
                  this.status.lock=1;
                }
                this.returnValue.emit(this.status);
              }
            },
            error_handler => {
              this.status.status=404;
              if (this.inData.action==="unlock"){
                this.status.lock=1;
              } else {
                this.status.lock=0;
              }
              this.returnValue.emit(this.status);
            } 
          )
      }
  

  
}
