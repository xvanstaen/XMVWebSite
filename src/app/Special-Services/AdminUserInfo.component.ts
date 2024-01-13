import { Component, OnInit , Input, Output, HostListener, SimpleChanges,EventEmitter} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';

import { msginLogConsole } from '../consoleLog';
import { LoginIdentif } from '../JsonServerClass';

import { environment } from 'src/environments/environment';

import { BucketList } from '../JsonServerClass';
import { Bucket_List_Info } from '../JsonServerClass';
import { OneBucketInfo } from '../JsonServerClass';
import { msgConsole } from '../JsonServerClass';
import { Return_Data } from '../JsonServerClass';
import { configServer } from '../JsonServerClass';

import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { ManageMongoDBService } from 'src/app/CloudServices/ManageMongoDB.service';

@Component({
  selector: 'app-AdminUserInfo',
  templateUrl: './AdminUserInfo.component.html',
  styleUrls: ['./AdminUserInfo.component.css']
})

export class AdminUserInfoComponent {

  @Input() configServer=new configServer;
  @Output() process_login=new EventEmitter<any>();

  @Input() ListOfBucket=new BucketList;
  @Input() SelectedBucketInfo=new OneBucketInfo;
  @Input() theReceivedData:any;

  constructor(
    private router:Router,
    private http: HttpClient,
    private scroller: ViewportScroller,
    private fb:FormBuilder,
    private ManageGoogleService: ManageGoogleService,
    private ManageMongoDBService: ManageMongoDBService,
    ) {
    }

 
    FirstSelection=true;

    RecordToSave:any;

    i:number=0;

    EventHTTPReceived:Array<boolean>=[false,false,false,false,false,false];
    id_Animation:Array<number>=[0,0,0,0,0];
    TabLoop:Array<number>=[0,0,0,0,0];

    myHeader=new HttpHeaders();    
    getScreenWidth: any;
    getScreenHeight: any;
    device_type:string='';

    myLogConsole:boolean=false;
    myConsole:Array< msgConsole>=[];
    returnConsole:Array<msgConsole>=[];
    SaveConsoleFinished:boolean=true;
    type:string='';
    
     // ACCESS TO GOOGLE STORAGE
    HTTP_AddressLog:string='';
   
    Google_Bucket_Access_RootPOST:string='https://storage.googleapis.com/upload/storage/v1/b/';
  
    Google_Bucket_Name:string=''; 
    Google_Object_Name:string='';
    Error_Access_Server:string='';
    Message:string='';
    error_message:string='';
    General_Info:string='';
    TabContent:Array<any>=[];
    TabContentRef:Array<any>=[];
    TabModifiedContent:Array<any>=[];
    TabErrorContent:Array<string>=[];

    EventProdLength:number=0;
    EventTestLength:number=0;

    DataType:string='Test';
    ConfirmSaveTest:boolean=false;
    ConfirmSaveProd:boolean=false;

    ObjectTodisplay=false;
    ContentTodisplay=false;

    FileMedialink:string='';
    ContentObject:any;
    ContentObjectRef:any;
    ContentModified:boolean=false;

    Return_SaveStatus=new Return_Data;

    RefreshListObjects:boolean=false;
    WrongNbRecords:number=0;
    IsATable:boolean=false;
 
@HostListener('window:resize', ['$event'])
onWindowResize() {
      this.getScreenWidth = window.innerWidth;
      this.getScreenHeight = window.innerHeight;
    }

ngOnInit(){
      //**this.LogMsgConsole('AdminLogin ===== Device ' + navigator.userAgent + '======');

      this.getScreenWidth = window.innerWidth;
      this.getScreenHeight = window.innerHeight;

      this.HTTP_AddressLog=this.Google_Bucket_Access_RootPOST + 'logconsole'+ "/o?name="  ;
      this.myHeader=new HttpHeaders({
        'content-type': 'application/json',
        'cache-control': 'private, max-age=0'
      });

      this.DataType='Test';
      this.Initialize();
  }    

Initialize(){
  if (this.TabContent.length>0){this.Message=''; this.ClearVar();}
  this.ContentObject=JSON.stringify(this.theReceivedData);;
  this.ContentObjectRef=JSON.stringify(this.theReceivedData);

  if (Array.isArray(this.theReceivedData)===false){

    this.TabContent[0]=JSON.stringify(this.theReceivedData);
    this.TabContentRef[0]=JSON.stringify(this.theReceivedData);
    this.TabModifiedContent[0]=this.theReceivedData;
    this.TabErrorContent[0]='';
    this.IsATable=false;
    this.General_Info='';
    
  } else {
    for (let i=0; i<this.theReceivedData.length; i++){
        this.General_Info='This object contains '+ this.theReceivedData.length +' items';
        this.TabContent[i]=JSON.stringify(this.theReceivedData[i]);
        this.TabContentRef[i]=JSON.stringify(this.theReceivedData[i]);
        this.TabModifiedContent[i]=this.theReceivedData[i];
        this.TabErrorContent[i]='';
        this.IsATable=true;
    }
  }
  this.scroller.scrollToAnchor('targetLogTop');
  this.ContentTodisplay=true;
}


ModifContent(event:any){
  var record_nb=parseInt(event.target.id.substring(1));
  //this.ContentObject=event.target.value;
  
  //let theObject='';
  try {
    //theObject=JSON.parse(this.ContentObject);
    this.error_message='';
   
    this.TabModifiedContent[record_nb]=JSON.parse(event.target.value);
    if (this.TabErrorContent[record_nb]!==''){
      this.TabErrorContent[record_nb]='';
      this.WrongNbRecords--;
    }
    if (this.WrongNbRecords===0){
      this.ContentModified=true;
    }
  }
  catch (error_handler) {
    if (this.TabErrorContent[record_nb]===''){
      this.error_message='Wrong format';
      this.TabErrorContent[record_nb]=this.error_message;
      this.ContentModified=false;
      this.WrongNbRecords++
    }
    }
}

BackToSaveFile(event:any){
  this.Message=event.Message;
  this.Error_Access_Server=event.Error_Access_Server;
  if (event.SaveIsCancelled===true){
        // modifications are still there 
        if (this.Message='File is saved'){
            this.ClearVar();
            this. RefreshListObjects=true;
        } else {
            this.ContentModified=true;
            this.ObjectTodisplay=false;
            this.ContentTodisplay=true;
        }
  } else { 
        // nothing to do as modifications have been sent to be saved
        if (this.DataType==='Test'){
          this.i=3;
          this.ConfirmSaveTest=true;
        } else  if (this.DataType==='Prod'){
          this.i=2;
          this.ConfirmSaveProd=true;
        }
      }
  this.scroller.scrollToAnchor('targetLogTop');
}

ClearVar(){
  this.ContentModified=false;
  this.ContentTodisplay=false;
  this.ObjectTodisplay=false;
  this.error_message='';
  this.ContentObject='';
  this.ContentObjectRef='';

  this.TabErrorContent.splice(0,this.TabErrorContent.length);
  this.TabContent.splice(0,this.TabContent.length);
  this.TabContentRef.splice(0,this.TabContentRef.length);
  this.TabModifiedContent.splice(0,this.TabModifiedContent.length);
  this.WrongNbRecords=0;
 
  if (this.Message==='File is saved'){
    this.process_login.emit('Refresh_Login');
    if (Array.isArray(this.theReceivedData)===true){
      this.theReceivedData.splice(0,this.theReceivedData.length);
    } else {this.theReceivedData={}}  
  }
  this.scroller.scrollToAnchor('LogTop');
}

Process(event:string){
  this.Message='';
  if (event==='Test'){
        this.DataType='Test';
    } else {
      this.DataType='Prod';
    }
  }


CheckRecord(event:number){
    console.log('check record nb '+event);
  }
  
ConfirmSave(event:string){
    this.scroller.scrollToAnchor('targetLogTop');
    //this.ConfirmSaveTest=true;
  }


ngOnChanges(changes: SimpleChanges) { 
    if (this.FirstSelection===true){
      this.FirstSelection=false;
    } else {

      for (const propName in changes){
        const j=changes[propName];
        if (propName==='SelectedBucketInfo'){
          this.ContentTodisplay=false;
        } 
        if (propName==='theReceivedData'){
          this.ObjectTodisplay=false;
          this.ContentTodisplay=false;
          this.ContentModified=false;

          this.Message='';
          this.Initialize();
        }
       
      }
  
    
     
    }
  }

goUpandDown(event:string){
    if (event='NewFile'){
      this.scroller.scrollToAnchor('targetLogTop');
    } else  if (event='Selection'){
      this.scroller.scrollToAnchor('targetSelectedFile');
    }

  }

LogMsgConsole(msg:string){
    msginLogConsole(msg, this.myConsole,this.myLogConsole, this.SaveConsoleFinished,this.HTTP_AddressLog, this.type);
}

}