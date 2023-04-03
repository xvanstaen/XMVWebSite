import { Component, OnInit , Input, Output, HostListener, EventEmitter, SimpleChanges,} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { encrypt, decrypt} from '../EncryptDecryptServices';

import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';

import { OneBucketInfo } from '../JsonServerClass';
import { msgConsole } from '../JsonServerClass';
import { Return_Data } from '../JsonServerClass';
import { configServer } from '../JsonServerClass';

@Component({
    selector: 'app-ChangeSaveFileName',
    templateUrl: './ChangeSaveFileName.component.html',
    styleUrls: ['./ChangeSaveFileName.component.css']
  })
  
export class ChangeSaveFileNameComponent {

    constructor(
        private router:Router,
        private http: HttpClient,
        private scroller: ViewportScroller,
        private fb:FormBuilder,
        private ManageGoogleService: ManageGoogleService,
        private ManageMangoDBService: ManageMangoDBService,
        ) {}  
    
    @Input() DataToHttpPost:any;
    @Input() SelectedBucketInfo=new OneBucketInfo;
    @Output() SaveStatus=new EventEmitter<Return_Data>();
    @Input() configServer=new configServer;
    @Input() ContentObject:any;
    @Input() IsATable:boolean=false;

    FileName:string='';
    Google_Bucket_Access_RootPOST:string='https://storage.googleapis.com/upload/storage/v1/b/';
    isObjectToSave:boolean=false;
    ConfirmSave=true;
    Return_SaveStatus=new Return_Data;
    
    ngOnInit(){
        const myTime=new Date();
        const myDate= myTime.toString().substring(4,25);
        this.FileName=myDate + this.SelectedBucketInfo.name;
    }

    InputFile(event:any){
        this.FileName=event.target.value;
    }

    SaveModif(event:string){
        if (event==='YES'){
            this.isObjectToSave=true;
            this.ConfirmSave=false;
            this.Return_SaveStatus.SaveIsCancelled=false;
        }
        else {
            this.Return_SaveStatus.Message='File ' +  this.FileName +' was not saved as per your request';
            this.isObjectToSave=false;
            this.ConfirmSave=true;
            this.Return_SaveStatus.SaveIsCancelled=true;
        }
        this.SaveStatus.emit(this.Return_SaveStatus);
    }


  SaveFile(){
    let FileToSave:any;

    if (this.IsATable===true){
      FileToSave=this.ContentObject;
    } else {FileToSave=this.ContentObject[0];}

    if (this.Return_SaveStatus.Message===''){
        const HTTP_Address=this.Google_Bucket_Access_RootPOST + this.SelectedBucketInfo.bucket+ "/o?name=" + this.FileName   + "&uploadType=media" ;
        
        var file=new File ([JSON.stringify(FileToSave)],this.FileName,{type: 'application/json'});
        this.ManageGoogleService.uploadObject(this.configServer, this.SelectedBucketInfo.bucket, file )
          .subscribe(
            (res) => {
              if (res.type===4){
                  this.Return_SaveStatus.Message='File is saved';
                  this.Return_SaveStatus.Error_Access_Server='';
                  this.Return_SaveStatus.Error_code=0;
                  this.isObjectToSave=false;
                  this.Return_SaveStatus.SaveIsCancelled=true;
                  console.log(this.Return_SaveStatus.Message);
                  this.SaveStatus.emit(this.Return_SaveStatus);
              }
            },
            (error_handler) => {
                  this.Return_SaveStatus.Error_Access_Server=error_handler.status + ' url='+ error_handler.url;
                  this.Return_SaveStatus.Error_code=error_handler.status;
                  console.log(this.Return_SaveStatus.Error_Access_Server);
                  this.SaveStatus.emit(this.Return_SaveStatus);
                } 
              )
      } else 
          {this.Return_SaveStatus.Message='issue with variable "DataToHttpPost" which is undefined';}
    } 
  

  }



