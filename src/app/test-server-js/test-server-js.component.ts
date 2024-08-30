import {
  Component, OnInit, Input, Output, HostListener, OnDestroy, HostBinding, ChangeDetectionStrategy,
  SimpleChanges, EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID
} from '@angular/core';

// angular-google-auth2
//import {AuthService} from 'angular-google-auth2';

import { Buffer } from 'buffer';

import { DatePipe, formatDate } from '@angular/common';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { Observable } from 'rxjs';

import { BucketList, Bucket_List_Info, OneBucketInfo, classCredentials, classTabMetaPerso } from '../JsonServerClass';

// retrievedConfigServer is needed to use ManageGoogleService
// it is stored in MongoDB and accessed via ManageMongoDBService

import { msginLogConsole } from '../consoleLog';
import { configServer, classFilesToCache,  UserParam, LoginIdentif, msgConsole } from '../JsonServerClass';

import { classAccessFile, classFileSystem } from '../classFileSystem';
import { ManageSecuredGoogleService } from 'src/app/CloudServices/ManageSecuredGoogle.service';
import { ManageMongoDBService } from 'src/app/CloudServices/ManageMongoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { TutorialService } from 'src/app/CloudServices/tutorial.service';
import { fillConfig } from '../copyFilesFunction';
@Component({
  selector: 'app-test-server-js',
  templateUrl: './test-server-js.component.html',
  styleUrls: ['./test-server-js.component.css']
})
export class TestServerJSComponent {

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageSecuredGoogleService: ManageSecuredGoogleService,
    private ManageMongoDBService: ManageMongoDBService,
    private ManageGoogleService: ManageGoogleService,
    private ManageTutorialService: TutorialService,
    //public auth: AuthService,

    @Inject(LOCALE_ID) private locale: string,
  ) { }

  @Input() configServer = new configServer;
  @Input() credentials = new classCredentials;
  @Input() credentialsMongo = new classCredentials;
  @Input() credentialsFS = new classCredentials;
  @Input() configServerChanges:number=0;

  @Input() serverTest:string=""; // server or tutorials

  @Output() serverChange=  new EventEmitter<any>();

  initData={
    getRecord:false,
    record:[],
    app:"",
    nbCalls:0,
    }

  newConfigServer = new configServer;

  retrievedConfigServer= new configServer;

  HTTP_Address: string = 'https://storage.googleapis.com/upload/storage/v1/b/config-xmvit/o?uploadType=media&name=unloadfileSystem&metadata={cache-control:no-cache,no-store,max-age=0}';
  HTTP_AddressPOST: string = '';
  Google_Bucket_Access_Root: string = 'https://storage.googleapis.com/storage/v1/b/';
  Google_Bucket_Access_RootPOST: string = 'https://storage.googleapis.com/upload/storage/v1/b/';

  GoogleObject_Option: string = '/o?uploadType=media&name='
  GoogleObject_MetadataStart: string = '&metadata={'
  GoogleObject_MetadataEnd: string = '&metadata={'

  cacheControl: string = 'cache-control:no-cache,no-store,max-age=0';
  authorization: string = 'Bearer';
  contentTypeJson: string = 'application/json';
  contentTypeurlencoded: string = 'application/x-www-form-urlencoded';
  accept: string = 'application/json';

  theHeadersAll = new HttpHeaders({
    "Authorization": "",
    "Content-Type": "",
    "Accept": "",
  });

  copyData:string="";

  TabBuckets = [{ name: '' }];
  myListOfObjects = new Bucket_List_Info;
  oneMetadata = new OneBucketInfo;

  bucket_data: string = '';

  DisplayListOfObjects: boolean = false;
  Error_Access_Server: string = '';

  fileRecord: any;
  isConfirmedSave: boolean = false;
  isGetMetadata: boolean = false;
  isGetAllMetadata: boolean = false;
  isConfirmedDelete:boolean=false;

  EventStopWaitHTTP: Array<boolean> = [];
  EventHTTPReceived: Array<boolean> = [];
  maxEventHTTPrequest: number = 20;
  id_Animation: Array<number> = [];
  TabLoop: Array<number> = [];
  maxLoop: number = 4000;
  tabLock:Array<classAccessFile>=[]; 
  iWait:string="";

  theForm: FormGroup = new FormGroup({
    testProd: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    googleServer: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    fileSystemServer: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    mongoServer: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    server: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    dataBase: new FormControl({ value: 'Google', disabled: false }, { nonNullable: true }),
    srcBucket: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    srcObject: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    destBucket: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    destObject: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    action: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    fileContent: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    metaControl: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    metaType: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    searchField: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    searchCriteria: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    idRecord: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    serverForAction: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    userId: new FormControl({ value: '', disabled: false }, { nonNullable: true }),
    iWait: new FormControl({ value: '', disabled: false }, { nonNullable: true }),

  });

  tabAction: Array<string> = ['cancel', 'list all buckets', 'list all objects', 'get file content', 'get list metadata for all objects', 'get metadata for one object', 'create & save metadata' , 'update metadata for one object',  'save object', 'save object with meta perso' , 'rename object', 
  'copy object', 'move object', 'delete object','get server version', 'get cache console', 'get memory File System', 'get credentials','get cache file', 'manage config','reset memory File System','reset memory all FS', 'reset cache console','enable cache console', 'disable cache console', 'reset cache file', 'reload cache file'];
  
  tabConfig:Array<string>=['find cache config', 'reset cache config','find config by criteria', 'find all config', "update config by id", "upload config", "delete config by Id", "create config"];

  tabActionMongo: Array<string> = ['cancel', 'list config', 'update config', 'upload config', 'delete config'];

  tabServers: Array<string> = [
    'http://localhost:8080', 'https://test-server-359505.uc.r.appspot.com','https://xmv-it-consulting.uc.r.appspot.com',  'https://serverfs.ue.r.appspot.com'
  ]
  //   'delBucket'
  actionDropdown: boolean = false;
  returnFileContent: any;
  error: any;
  currentAction: string = "";
  tabMetaPerso: Array<classTabMetaPerso> = [];
  strMetaDataPerso:string="";

  memoryFS:Array<any>=[{
    fileName:"",
    record:[]
  }]

  memoryCacheConsole:Array<any>=[];

  isSelectServer:boolean=false;
  isInitDone:boolean=false;

  msgCacheFile={
    status:0,
    msg:"",
    content:[{file:"",bucket:"",updated:true}]
  };


  titleConfig:string="";
  tabOfConfig:Array<configServer>=[]; 
  tabOfId:Array<string>=[]; 
  idMongo:string="";
  isInputMetadata:boolean=false;
  metaDataMsg:string="";
  tabListMetaPerso:Array<string>=[];
  tabNameFS:Array<string>=[];

  stringCredentials:string='';
  serverVersion:string="";

  isDisplayAction:boolean=false;

  selectOneServer:boolean=false;

  ngOnInit() {
    
    this.reinitialise();
    
    console.log('ngOnInit');
    for (var i = 0; i < this.maxEventHTTPrequest; i++) {
      this.TabLoop[i] = 0;
      this.EventHTTPReceived[i] = false;
    }
    this.currentAction='list all buckets';
    this.theForm.controls['serverForAction'].setValue(this.configServer.googleServer);
    this.newConfigServer=fillConfig(this.configServer);
    if (this.theForm.controls['dataBase'].value.toLowerCase()==="google"){
      this.getListBuckets();
    }
    for (var i = 0; i < 5; i++) {
      const classMeta=new classTabMetaPerso;
      this.tabMetaPerso.push(classMeta);
      this.tabMetaPerso[i].key="";
      this.tabMetaPerso[i].value="";
    }

    if (this.credentials.access_token !== undefined || this.credentials.access_token !== "") {
      this.authorization = 'Bearer ' + this.credentials.access_token;
      this.theHeadersAll = new HttpHeaders({
        "Authorization": this.authorization,
        "Content-Type": this.contentTypeJson,
        "Accept": this.accept,
      });
    }
    
    this.isInitDone=true;
  }

  searchServer(){
    this.selectOneServer=true;
  }
  
  getOneServer(event:any){
    this.selectOneServer=false;
    if (event.server.trim()!=="cancel"){
      this.theForm.controls['serverForAction'].setValue(event.server);
    }
  }

  inputMetaPerso(event: any) {
    if (event.target.id.substring(0, 2) === "K-") {
      this.tabMetaPerso[Number(event.target.id.substring(2))].key = event.target.value;
    } else if (event.target.id.substring(0, 2) === "V-") {
      this.tabMetaPerso[Number(event.target.id.substring(2))].value = event.target.value;
    }
  }

  reinitialise() {

    this.titleConfig = "";
    this.theForm.controls['server'].setValue('server');
    this.theForm.controls['testProd'].setValue('test');
    this.theForm.controls['dataBase'].setValue('Google');
    this.theForm.controls['srcBucket'].setValue('');
    this.theForm.controls['srcObject'].setValue('');
    this.theForm.controls['destBucket'].setValue('');
    this.theForm.controls['destObject'].setValue('');
    this.theForm.controls['fileContent'].setValue('');
    this.theForm.controls['action'].setValue('');
    this.theForm.controls['metaControl'].setValue(this.cacheControl);
    this.theForm.controls['metaType'].setValue(this.contentTypeJson);
    this.error = "";
    this.returnFileContent = "";
    this.currentAction = "";
    this.isConfirmedDelete= false;
    this.isConfirmedSave= false;
  }

/*
  requestToken() {
    this.EventHTTPReceived[9] = false;
    this.waitHTTP(this.TabLoop[9], this.maxLoop, 9);
    this.ManageGoogleService.getTokenOAuth2(this.configServer)
      .subscribe((data) => {
        console.log(JSON.stringify(data));
        this.EventHTTPReceived[9] = true;
      },
        err => {
          console.log(JSON.stringify(err))
          this.EventHTTPReceived[9] = true;
        });
  }
*/

  
  /* =================== COPY/PASTE/CLEAR FIELD =============*/
  copySelection(event:any){
    if (event.target.id.indexOf('-')!==-1){
      this.copyData=event.target.id.substring(event.target.id.indexOf('-')+1);
    } else if (event.target.id==='comment'){
      this.copyData=this.returnFileContent;
    }
  }
  
  pasteAction(event:any){
    if (event.target.id==="srcBucket"){
      this.theForm.controls['srcBucket'].setValue(this.copyData);
    } else if (event.target.id==="destBucket"){
      this.theForm.controls['destBucket'].setValue(this.copyData);
    } else if (event.target.id==="srcObject"){
      this.theForm.controls['srcObject'].setValue(this.copyData);
    } else if (event.target.id==="destObject"){
      this.theForm.controls['destObject'].setValue(this.copyData);
    } else if (event.target.id==="comment"){
      this.theForm.controls['fileContent'].setValue(this.copyData);
    }

  }
  clearField(event:any){
    if (event.target.id==="srcBucket"){
      this.theForm.controls['srcBucket'].setValue("");
    } else if (event.target.id==="destBucket"){
      this.theForm.controls['destBucket'].setValue("");
    } else if (event.target.id==="srcObject"){
      this.theForm.controls['srcObject'].setValue("");
    } else if (event.target.id==="destObject"){
      this.theForm.controls['destObject'].setValue("");
    } else if (event.target.id==="comment"){
      this.theForm.controls['fileContent'].setValue("");
    }
  }
/* =================== SERVER =============*/
  saveSelectedServer:string="";
  onActionServer(event:any){
    this.saveSelectedServer=event.target.id;
    this.isSelectServer=true;
  }

  selectServer(event: any) {
    this.isSelectServer=false;
    if (this.saveSelectedServer==='google'){
      this.configServer.googleServer = event.target.textContent.trim();
      this.newConfigServer.googleServer = event.target.textContent.trim();
      this.theForm.controls['googleServer'].setValue(event.target.textContent.trim());
    } else if (this.saveSelectedServer==='mongo'){
      this.configServer.mongoServer = event.target.textContent.trim();
      this.newConfigServer.mongoServer = event.target.textContent.trim();
      this.theForm.controls['mongoServer'].setValue(event.target.textContent.trim());
    } else if (this.saveSelectedServer==='fileSystem'){
      this.configServer.fileSystemServer = event.target.textContent.trim();
      this.newConfigServer.fileSystemServer = event.target.textContent.trim();
      this.theForm.controls['fileSystemServer'].setValue(event.target.textContent.trim());
    } 
    
  }

initBeforeCallAPI(numEvent:number){
    this.EventHTTPReceived[numEvent] = false;
    this.EventStopWaitHTTP[numEvent]=false;    
    this.waitHTTP(this.TabLoop[numEvent], this.maxLoop, numEvent);
    this.error="";
}

  tabVersionServer:Array<string>=['','','','',''];
  isGetServerFunction:boolean=false;
  getServerVersion(i:number){
    this.initBeforeCallAPI(15);
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.ManageGoogleService.getServerVersion(this.newConfigServer)
        .subscribe(
          (data) => {
          this.isGetServerFunction=true;
          this.tabVersionServer[i]=data.version;
          this.serverVersion=data.version;
          this.EventHTTPReceived[15] = true;
          this.EventStopWaitHTTP[15]=true;
        }, 
        err =>{
          this.EventStopWaitHTTP[15]=true;
          this.serverVersion="";
          this.error = "status:" +err.err.status + " - " + err.err.message;
          console.log('error');
        })
  }


storeTitle(event:any){
    this.titleConfig=event.target.value;;
}
  /* =================== ACTION TO PERFORM  =============*/

  onAction() {
    console.log('onAction');
    this.metaDataMsg='';
    this.actionDropdown = true;
  }

  selectAction(event: any) {
    var testProd = this.theForm.controls['testProd'].value;
    this.configServer.test_prod = testProd.toLowerCase().trim();
    this.newConfigServer.test_prod = testProd.toLowerCase().trim();

    this.isConfirmedDelete= false;
    this.isConfirmedSave= false;
    this.actionDropdown = false;
    this.error = "";
    this.metaDataMsg="";
    this.returnFileContent = "";
    this.currentAction = event.target.textContent.trim();

    if (event.target.textContent.trim() !== "cancel") {
      this.theForm.controls['action'].setValue(event.target.textContent.trim());
      if (event.target.textContent.trim() === 'list all buckets') {
        this.isDisplayAction=false;
        this.getListBuckets();

      } else if (event.target.textContent.trim() === 'list all objects') {
        if (this.theForm.controls['srcBucket'].value==="" ){
          this.error="Field srcBucket is empty";
        } else {
          this.isDisplayAction=false;
          this.getListObjects(this.theForm.controls['srcBucket'].value);
        }

      } else if (event.target.textContent.trim() === 'get file content') {
        if (this.theForm.controls['srcBucket'].value==="" || this.theForm.controls['srcObject'].value===""){
          this.error="At least one field (srcBucket/srcObject) is empty";
        } else {
          this.isDisplayAction=true;
          if (this.theForm.controls['server'].value === 'HTTP') {
            this.getFileContentHTTP(this.theForm.controls['srcBucket'].value, this.theForm.controls['srcObject'].value);
          } else {
            this.getFileContent(this.theForm.controls['srcBucket'].value, this.theForm.controls['srcObject'].value);
          }
        }
        
      } else if (event.target.textContent.trim() === 'get list metadata for all objects') {
        if (this.theForm.controls['srcBucket'].value==="" ){
          this.error="Field srcBucket is empty";
        } else {
          this.isDisplayAction=true;
          this.listMetaDataObject(this.theForm.controls['srcBucket'].value);
        }
        
      } else if (event.target.textContent.trim() === 'get metadata for one object') {
        if (this.theForm.controls['srcBucket'].value==="" || this.theForm.controls['srcObject'].value===""){
          this.error="At least one field (srcBucket/srcObject) is empty";
        } else {
          this.isDisplayAction=true;
          this.getMetaData(this.theForm.controls['srcBucket'].value, this.theForm.controls['srcObject'].value);
        }
        
      } else if (event.target.textContent.trim() === 'create & save metadata') {
        if (this.theForm.controls['srcBucket'].value==="" || this.theForm.controls['srcObject'].value===""){
          this.error="At least one field (srcBucket/srcObject) is empty";
        } else {
          this.inputMetaData();     
        }
           
      } else if (event.target.textContent.trim() === 'update metadata for one object') {
        if (this.theForm.controls['srcBucket'].value==="" || this.theForm.controls['srcObject'].value===""){
          this.error="At least one field (srcBucket/srcObject) is empty";
        } else {
          this.modifyMetaData();     
        }
              
      } else if (event.target.textContent.trim() === 'copy object') {
        if (this.theForm.controls['srcBucket'].value==="" || this.theForm.controls['srcObject'].value==="" || this.theForm.controls['destBucket'].value==="" || this.theForm.controls['destObject'].value===""){
          this.error="At least one field (srcBucket/srcObject/destBucket/destObject) is empty";
        } else {
          this.isDisplayAction=false;
          this.copyObject(this.theForm.controls['srcBucket'].value, this.theForm.controls['srcObject'].value, this.theForm.controls['destBucket'].value, this.theForm.controls['destObject'].value);
        }
        
      } else if (event.target.textContent.trim() === 'move object') {
        if (this.theForm.controls['srcBucket'].value==="" || this.theForm.controls['srcObject'].value==="" || this.theForm.controls['destBucket'].value==="" || this.theForm.controls['destObject'].value===""){
          this.error="At least one field (srcBucket/srcObject/destBucket/destObject) is empty";
        } else {
          this.isDisplayAction=false;
          this.moveObject(this.theForm.controls['srcBucket'].value, this.theForm.controls['srcObject'].value, this.theForm.controls['destBucket'].value, this.theForm.controls['destObject'].value);
        }
        
      } else if (event.target.textContent.trim() === 'rename object') {
        if (this.theForm.controls['srcBucket'].value==="" || this.theForm.controls['srcObject'].value==="" || this.theForm.controls['destObject'].value===""){
          this.error="At least one field (srcBucket/srcObject/destObject) is empty";
        } else {
          this.isDisplayAction=false;
          this.renameObject(this.theForm.controls['srcBucket'].value, this.theForm.controls['srcObject'].value, this.theForm.controls['destObject'].value);
        }
        
      }  else if (event.target.textContent.trim() === 'delete object'  ) {
        if (this.theForm.controls['srcBucket'].value==="" || this.theForm.controls['srcObject'].value===""){
          this.error="At least one field (srcBucket/srcObject) is empty";
        } else {
          this.isConfirmedDelete = true;
        }
        
      } else if (event.target.textContent.trim() === 'save object' ) {
        if (this.theForm.controls['srcBucket'].value==="" || this.theForm.controls['srcObject'].value==="" || this.theForm.controls['fileContent'].value===""){
          this.error="At least one field (srcBucket/srcObject/Content) is empty";
        } else {
          this.isConfirmedSave = true;
        }

      } else if (event.target.textContent.trim() === 'save object with meta perso' ) {
        if (this.theForm.controls['srcBucket'].value==="" || this.theForm.controls['srcObject'].value==="" || this.theForm.controls['fileContent'].value===""){
          this.error="At least one field (srcBucket/srcObject/Content) is empty";
        } else {
          this.isConfirmedSave = true;
        }
       
      } else if (event.target.textContent.trim() === 'get cache console') {
        this.isDisplayAction=false;
        this.getCacheConsole(); 

      } else if (event.target.textContent.trim() === 'reset cache console') {
        this.isDisplayAction=false;
        this.resetCacheConsole();

      } else if (event.target.textContent.trim() === 'enable cache console') {
        this.isDisplayAction=false;
        this.enableCacheConsole();

      } else if (event.target.textContent.trim() === 'disable cache console') {
        this.isDisplayAction=false;
        this.disableCacheConsole();

      }  else if (event.target.textContent.trim() === 'get memory File System') {
        this.isDisplayAction=false;
        this.getMemoryFS();

      } else if (event.target.textContent.trim() === 'reset memory File System') {
        this.isDisplayAction=false;
        this.saveActionResetFS='reset memory File System';
        this.isUserIdForFS=true;
        //this.resetMemoryFS(this.theForm.controls['srcBucket'].value, this.theForm.controls['srcObject'].value);
      } else if (event.target.textContent.trim() === 'reset memory all FS') {
        this.isDisplayAction=false;
        this.saveActionResetFS='reset memory all FS';
        this.isUserIdForFS=true;
        //this.onResetFS();
      }  else if (event.target.textContent.trim() === 'reset cache file') {
        this.isDisplayAction=false;
        this.resetCacheFile();

      } else if (event.target.textContent.trim() === 'get cache file') {
        this.isDisplayAction=false;
        this.getCacheFile();

      }else if (event.target.textContent.trim() === 'reload cache file') {
        this.isDisplayAction=false;
        this.reloadCacheFile();

      } else if (event.target.textContent.trim() === 'manage config') {
        this.isDisplayAction=false;
        this.manageConfig();

      } else if (event.target.textContent.trim() === 'get credentials') {
        this.isDisplayAction=false;
        //this.getDefaultCredentials();
        this.getCredentials();

      } else if (event.target.textContent.trim() === 'get FS credentials') {
        this.isDisplayAction=false;
        //this.getFSCredentials();

      }else if (event.target.textContent.trim() === 'get server version') {
        for (var i=0; i<this.tabServers.length;i++){
          this.getServerVersion(i);
        }
        

      } else {
        this.error = 'ACTION UNKNOWN';
      }
    }
  }
  
  /* =================== CACHE FILE =============*/

  onInputFileToCache(event:any){
    const i=Number(event.target.id.substring(4))
    if (event.target.id.substring(0,4)==='idxx-'){
      this.dataConfigServer.UserSpecific[i].theId=event.target.value;
    } else if (event.target.id.substring(0,4)==='type'){
      this.dataConfigServer.UserSpecific[i].theType=event.target.value;
    } else if (event.target.id.substring(0,4)==='logx-'){
      this.dataConfigServer.UserSpecific[i].log=event.target.value;
    } else if (event.target.id.substring(0,4)==='buck'){
      this.dataConfigServer.filesToCache[i].bucket=event.target.value;
    } else if (event.target.id.substring(0,4)==='obje'){
      this.dataConfigServer.filesToCache[i].object=event.target.value;
    } 
  }

  resetCacheFile(){
    this.resetObjectCacheFile();
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
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
      } else {
        this.error=data.msg;
      }
      }, 
      err => {
        this.error="Cache file could not be reset";
        this.manageErrorMsg(err);
        this.EventStopWaitHTTP[16]=true;
      });
  }

  getCacheFile(){
    this.resetObjectCacheFile();
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.ManageSecuredGoogleService.getCacheFile(this.newConfigServer )
    .subscribe((data ) => {  
      if (data.status===undefined || data.status===200){
      this.EventHTTPReceived[16]=true;
      this.EventStopWaitHTTP[16]=true;
      this.msgCacheFile.status=data.status;
      this.msgCacheFile.msg=data.msg;
      this.msgCacheFile.content=data.cacheFiles;
    } else {
      this.error=data.msg;
    }
    }, 
    err => {
      this.error="Cache file could not be retrieved" ;
      this.manageErrorMsg(err);
      this.EventStopWaitHTTP[16]=true;
      
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
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.ManageSecuredGoogleService.reloadCacheFile(this.newConfigServer )
    .subscribe((data ) => {  
      if (data.status===undefined || data.status===200){
      this.EventHTTPReceived[16]=true;
      this.EventStopWaitHTTP[16]=true;
      this.msgCacheFile.status=data.status;
      this.msgCacheFile.msg=data.msg;
      this.msgCacheFile.content=data.cacheFiles;
    } else {
      this.error=data.msg;
    }
    }, 
    err => {
      this.error="Cache file has not been reloaded";
      this.manageErrorMsg(err);
      this.EventStopWaitHTTP[16]=true;

    });
  }

/* =================== MANAGE CONFIG =============*/

isManageConfig:boolean=false;
manageConfig(){
  this.isManageConfig=true;
}

copyDataConfig=new configServer;
copyConfig(){
  //this.fillConfig(this.dataConfigServer,this.copyDataConfig);
  this.copyDataConfig=fillConfig(this.dataConfigServer);

}

pasteConfig(){
  //this.fillConfig(this.copyDataConfig, this.dataConfigServer);
  this.dataConfigServer=fillConfig(this.copyDataConfig);
}

selectActionConfig(event:any){
  
 if (event.target.textContent.trim()==="find cache config"){
    this.findCacheConfig();
 } else if (event.target.textContent.trim()==="reset cache config"){
    this.resetCacheConfig();

 } else if (event.target.textContent.trim()==="find config by criteria"){
  this.findConfigByString();

 } else if (event.target.textContent.trim()==="find all config"){
  this.findAllConfig();

 } else if (event.target.textContent.trim()==="update config by id"){
  
  if (this.theForm.controls['idRecord'].value !==''){
    this.isConfConfigUpdate=true;
  } else {
    this.errorConfig="update failed; id field is empty"
  }
  

 } else if (event.target.textContent.trim()==="upload config"){
  this.isConfConfigSave=true;
 } else if (event.target.textContent.trim()==="delete config by Id"){
  if (this.theForm.controls['idRecord'].value !==''){
    this.isConfConfigDelete=true;
  } else {
    this.errorConfig="Delte failed; id field is empty"
  }
  
  
 } else if (event.target.textContent.trim()==="create config"){
  this.createConfig();
 }

}

createConfig(){
this.dataConfigServer = new configServer;
const myClass=new classFilesToCache;
this.dataConfigServer.filesToCache.push(myClass);
const theClassUsr=new UserParam;
this.dataConfigServer.UserSpecific.push(theClassUsr);
this.EventHTTPReceived[18]=true;
this.idRecordConfig="";
this.theForm.controls['idRecord'].setValue("");
}


dataConfigServer = new configServer;
findCacheConfig(){
  this.initBeforeCallAPI(18);
  this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
  this.ManageMongoDBService.findConfig(this.newConfigServer,'configServer' )
  .subscribe((data ) => { 
    if (data.status ===200){
      this.error="Cache config has been successfully reset" ; 
      console.log(data);
      this.dataConfigServer = new configServer;
      this.dataConfigServer = this.responseConfig(data, this.dataConfigServer);
      this.EventHTTPReceived[18]=true;
      this.EventStopWaitHTTP[18]=true;
    } else {
      this.errorConfig=data.msg;
    }
  }, 
  err => {
    this.errorConfig="Cache config has not been reset, error:" + err;
    this.EventStopWaitHTTP[18]=true;
  });
}

findAllConfig(){
  this.initBeforeCallAPI(18);
  this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
  this.ManageMongoDBService.findAllConfig(this.newConfigServer,'configServer' )
  .subscribe((data ) => { 
    this.dataConfigServer = new configServer;
    this.dataConfigServer = this.responseConfig(data, this.dataConfigServer);
    console.log(data);
    this.EventHTTPReceived[18]=true;
    this.EventStopWaitHTTP[18]=true;
  }, 
  err => {
    this.errorConfig="Find all config, error:" + err;
    this.EventStopWaitHTTP[18]=true;
  });
}

errorConfig:string="";
itemFileToCache:number=-1;
itemUsrSpec:number=-1;
tabActionField:Array<string>=["cancel","add","delete"];
isDisplayTabActionField:boolean=false;
isConfConfigSave:boolean=false;
isConfConfigDelete:boolean=false;
isConfConfigUpdate:boolean=false;

onActionConfig(event:any){
  this.isDisplayTabActionField=false;
  if (event.target.id.substring(0,12)==="fileToCache-"){
    this.itemFileToCache=Number(event.target.id.substring(12));
    this.itemUsrSpec=-1;
    this.isDisplayTabActionField=true;
  } else if (event.target.id.substring(0,8)==="usrSpec-"){
    this.itemUsrSpec=Number(event.target.id.substring(8));
    this.itemFileToCache=-1;
    this.isDisplayTabActionField=true;
  } else if (event.target.textContent.trim()==="add"){
      
      if (this.itemFileToCache!==-1){
        const myClass=new classFilesToCache;
        this.dataConfigServer.filesToCache.splice(this.itemFileToCache,0,myClass);
        
      } else if (this.itemUsrSpec !==-1){
        const theClassUsr= new UserParam;
        this.dataConfigServer.UserSpecific.splice(this.itemUsrSpec,0, theClassUsr);
      }

  } else if (event.target.textContent.trim()==="delete"){
      if (this.itemFileToCache!==-1 && this.dataConfigServer.filesToCache.length>1){
        this.dataConfigServer.filesToCache.splice(this.itemFileToCache,1);
      } else if (this.itemUsrSpec !==-1 && this.dataConfigServer.UserSpecific.length>1){
        this.dataConfigServer.UserSpecific.splice(this.itemUsrSpec,1);
      }
  } 
}

confActionConfig(event:any){
  if (this.isConfConfigSave===true){
    this.uploadConfig();
  } if (this.isConfConfigUpdate===true){
    this.updateConfigById();
  } if (this.isConfConfigDelete===true){
    this.deleteConfigById();
  }
  this.confActionCancel("");
}

confActionCancel(event:any){
  this.isConfConfigSave=false;
  this.isConfConfigUpdate=false;
  this.isConfConfigDelete=false;
}


findConfigByString(){
  if (this.theForm.controls['searchField'].value!=="" && this.theForm.controls['searchCriteria'].value!==""){
    this.initBeforeCallAPI(18);
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.ManageMongoDBService.findConfigByString(this.newConfigServer, 'configServer', this.theForm.controls['searchField'].value, this.theForm.controls['searchCriteria'].value )
    .subscribe((data ) => { 
      this.dataConfigServer = new configServer;
      this.dataConfigServer= this.responseConfig(data, this.dataConfigServer);
      console.log(data);
      this.EventHTTPReceived[18]=true;
      this.EventStopWaitHTTP[18]=true;
    }, 
    err => {
      this.errorConfig="Find config by string, error:" + err;
      this.EventStopWaitHTTP[18]=true;
    });
  } else {
    this.errorConfig="search field & criteria are mandatory";
  }
  
}

updateConfigById(){
  for (var i=0; i<this.tabOfId.length && this.tabOfId[i]!==this.theForm.controls['idRecord'].value; i++){}
  if (i<this.tabOfId.length){
    this.tabOfConfig[i]=fillConfig(this.dataConfigServer);
  }
  this.initBeforeCallAPI(18);
  this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
  this.ManageMongoDBService.updateConfig(this.newConfigServer,  'configServer', this.theForm.controls['idRecord'].value, this.dataConfigServer)
  .subscribe((data ) => { 
    if (data.status===200){
      this.errorConfig="Config has been successfully updated" ; 
      console.log(data.data);
    } else {
      this.errorConfig=data.msg;
    }
    this.EventStopWaitHTTP[18]=true;
  }, 
  err => {
    this.errorConfig="Config has not been updated, error:" + err;
    this.EventStopWaitHTTP[18]=true;
  });
}

deleteConfigById(){
  this.initBeforeCallAPI(18);
  this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
  this.ManageMongoDBService.delConfigById(this.newConfigServer,  'configServer', this.theForm.controls['idRecord'].value)
  .subscribe((data ) => { 
    if (data.status===200){
      this.errorConfig="Config has been successfully deleted" ; 
      this.findAllConfig();
      console.log(data.data);
      this.EventHTTPReceived[18]=true;
    } else {
      this.errorConfig=data.msg;
    }
    this.EventStopWaitHTTP[18]=true;
  }, 
  err => {
    this.errorConfig="Config has not been deleted, error:" + err;
    this.EventStopWaitHTTP[18]=true;
  });
}

uploadConfig(){
  this.initBeforeCallAPI(18);
  this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
  this.ManageMongoDBService.uploadConfig(this.newConfigServer, 'configServer', this.dataConfigServer)
  .subscribe((data ) => { 
    this.EventStopWaitHTTP[18]=true;
    if (data.status===200){
      this.errorConfig="Config has been successfully uploaded" ; 
      this.findAllConfig();
      this.EventHTTPReceived[18]=true;
      console.log(data.data);
    } else {
      this.errorConfig=data.msg;
    }
  }, 
  err => {
    this.EventStopWaitHTTP[18]=true;
    this.errorConfig="Config has not been uploaded, error:" + err;
  });
}

resetCacheConfig(){
  this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
  this.ManageMongoDBService.resetCacheConfig(this.newConfigServer,'configServer')
  .subscribe((data ) => { 
    this.errorConfig=data.msg; 
    console.log(data);
  }, 
  err => {
    this.errorConfig=err.msg; 
  });
}
onInputTabConfig(event:any){
  const i=Number(event.target.id.substring(4))
  if (event.target.id.substring(0,4)==='idxx'){
    this.dataConfigServer.UserSpecific[i].theId=event.target.value;
  } else if (event.target.id.substring(0,4)==='type'){
    this.dataConfigServer.UserSpecific[i].theType=event.target.value;
  } else if (event.target.id.substring(0,4)==='logx'){
    this.dataConfigServer.UserSpecific[i].log=event.target.value;

  } else if (event.target.id.substring(0,4)==='buck'){
    this.dataConfigServer.filesToCache[i].bucket=event.target.value;
  } else if (event.target.id.substring(0,4)==='obje'){
    this.dataConfigServer.filesToCache[i].object=event.target.value;
  } 
}

listConfig(){
    this.initBeforeCallAPI(13);
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.ManageMongoDBService.findAllConfig(this.newConfigServer, 'configServer')
  // this.ManageMongoDB.findConfigbyURL(this.configServer, 'retrievedConfigServer', '')
        .subscribe(
          (data) => {
            this.EventStopWaitHTTP[13]=true;
            this.dataConfigServer = new configServer;
            this.dataConfigServer= this.responseConfig(data, this.dataConfigServer);
            this.EventHTTPReceived[13] = true;
        }, 
        err =>{
          console.log('List config error: ' + JSON.stringify(err));
          this.EventStopWaitHTTP[13]=true;
        })
      }

  responseConfig(data:any, retrievedConfigServer:any){
        
        if (Array.isArray(data) === false){
          retrievedConfigServer== new configServer;
          retrievedConfigServer=fillConfig(data);
          this.idRecordConfig=data.id;
          this.theForm.controls['idRecord'].setValue(this.idRecordConfig);
        } else {
          this.tabOfConfig.splice(0,this.tabOfConfig.length);
          this.tabOfId.splice(0,this.tabOfId.length);
          if (data.length>0){
            for (let i=0; i<data.length; i++){
                this.tabOfConfig[i]=fillConfig(data[i]);
                this.tabOfId[i]=data[i].id;
                //if (data[i].title===this.titleConfig ){
                //  this.idMongo=data[i].id;
                //  retrievedConfigServer = new configServer;
                //  retrievedConfigServer= fillConfig(data[i]);
                //} 
            }
            this.idRecordConfig=this.tabOfId[0];
            this.theForm.controls['idRecord'].setValue(this.idRecordConfig);
            retrievedConfigServer== new configServer;
            retrievedConfigServer= fillConfig(this.tabOfConfig[0]);
          }
        }
        return (retrievedConfigServer);
      }


  onSelConfig(event:any){
    if (event.target.id.substring(0,4)==="sel-"){
      const i=Number(event.target.id.substring(4));
      this.idMongo=this.tabOfId[i];
      this.dataConfigServer = new configServer;
      this.dataConfigServer=fillConfig(this.tabOfConfig[i]);
    }
  }

  isSelectedIdConfig:number=0;
  idRecordConfig:string="";

  selectId(event:any){
    if (event.target.id.substring(0,4)==="CON-"){
      this.isSelectedIdConfig=Number(event.target.id.substring(4));
      this.dataConfigServer=this.tabOfConfig[this.isSelectedIdConfig];
      this.idRecordConfig=this.tabOfId[this.isSelectedIdConfig];
      this.theForm.controls['idRecord'].setValue(this.idRecordConfig);
    }
  }

  onInputConfig(event:any){
    if (event.target.id==='title'){
      this.dataConfigServer.title=event.target.value;
    } else if (event.target.id==='test_prod'){
      this.dataConfigServer.test_prod=event.target.value;
    } else if (event.target.id==='googleUrl'){
      this.dataConfigServer.googleServer=event.target.value;
    } else if (event.target.id==='mongoUrl'){
      this.dataConfigServer.mongoServer=event.target.value;
    } else if (event.target.id==='fileSystemUrl'){
      this.dataConfigServer.fileSystemServer=event.target.value;
    } else if (event.target.id==='TOhh'){
      this.dataConfigServer.timeoutFileSystem.hh=Number(event.target.value);
    } else if (event.target.id==='TOmn'){
      this.dataConfigServer.timeoutFileSystem.mn=Number(event.target.value);
    } else if (event.target.id==='bufferTOhh'){
      this.dataConfigServer.timeoutFileSystem.bufferTO.hh=Number(event.target.value);
    } else if (event.target.id==='bufferTOmn'){
      this.dataConfigServer.timeoutFileSystem.bufferTO.mn=Number(event.target.value);
    } else if (event.target.id==='bufferInputhh'){
      this.dataConfigServer.timeoutFileSystem.bufferInput.hh=Number(event.target.value);
    } else if (event.target.id==='bufferInputmn'){
      this.dataConfigServer.timeoutFileSystem.bufferInput.mn=Number(event.target.value);
    } else if (event.target.id==='PoRBucket'){
      this.dataConfigServer.PointOfRef.bucket=event.target.value;
    } else if (event.target.id==='PoRBObject'){
      this.dataConfigServer.PointOfRef.file=event.target.value;
    } else if (event.target.id==='console'){
      this.dataConfigServer.consoleBucket=event.target.value;
    } else if (event.target.id==='bucketFS'){
      this.dataConfigServer.bucketFileSystem=event.target.value;
    } else if (event.target.id==='objectFS'){
      this.dataConfigServer.objectFileSystem=event.target.value;
    } else if (event.target.id==='ipAddress'){
      this.dataConfigServer.IpAddress=event.target.value;
    } else if (event.target.id==='project'){
      this.dataConfigServer.project=event.target.value;
    } else if (event.target.id==='credential'){
      this.dataConfigServer.credentialDate=event.target.value;
    } 
  }

  getServerNames(event:any){
    if (this.configServer.googleServer!==event.google){
      this.configServer.googleServer=event.google;
      this.newConfigServer.googleServer=event.google;
      this.serverChange.emit('Google');
    }
    
    if (this.configServer.mongoServer!==event.mongo){
      this.configServer.mongoServer=event.mongo;
      this.newConfigServer.mongoServer=event.mongo;
      this.serverChange.emit('Mongo');
    }

    if (this.configServer.fileSystemServer!==event.fileSystem){
      this.configServer.fileSystemServer=event.fileSystem;
      this.newConfigServer.fileSystemServer=event.fileSystem;
      this.serverChange.emit('FS');
    }

    this.configServerChanges++;
  }


  /* =================== MANAGE OBJECTS  =============*/

  getListBuckets() {
    this.initBeforeCallAPI(0);
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.ManageGoogleService.getListBuckets(this.newConfigServer)
      .subscribe((data) => {
        this.EventStopWaitHTTP[0]=true;
        if (data.status===undefined || data.status===200){
          this.returnFileContent = JSON.stringify(data);
          this.TabBuckets = data;
          this.EventHTTPReceived[0] = true;
        } else { 
          this.error=data.msg;
        }
      },
        err => {
          this.EventStopWaitHTTP[0]=true;
          this.manageErrorMsg(err);
        });
  }

  getListObjects(bucket: any) {
    this.initBeforeCallAPI(1);
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.ManageGoogleService.getListObjects(this.newConfigServer, bucket)
      .subscribe((data) => {
        this.myListOfObjects.items = data;
        this.returnFileContent = JSON.stringify(data);
        this.EventHTTPReceived[1] = true;
        this.EventStopWaitHTTP[1]=true;
      },
        err => {
          this.EventStopWaitHTTP[1]=true;
          this.manageErrorMsg(err);
        });
  }

  getFileContent(bucket: any, object: any) {
    this.initBeforeCallAPI(1);
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.ManageGoogleService.getContentObject(this.newConfigServer, bucket, object)
      .subscribe((data) => {
        this.returnFileContent = JSON.stringify(data);
        this.EventHTTPReceived[2] = true;
        this.EventStopWaitHTTP[2]=true;
      },
        err => {
          this.error = "cannot retrieve file " + object + "   error==> " + JSON.stringify(err);
          this.EventStopWaitHTTP[2]=true;
        });
  }

  getFileContentHTTP(bucket: any, object: any) {
    this.initBeforeCallAPI(2);
    this.HTTP_Address = 'https://storage.googleapis.com/download/storage/v1/b/' + bucket + '/o/' + object + '?alt=media';
    //this.HTTP_Address=this.Google_Bucket_Access_Root+bucket+this.GoogleObject_Option+object;
    this.http.get(this.HTTP_Address, { headers: this.theHeadersAll })
      .subscribe((data) => {
        //console.log(JSON.stringify(data)); 
        this.returnFileContent = JSON.stringify(data);
        this.EventHTTPReceived[2] = true;
        this.EventStopWaitHTTP[2]=true;
      },
        err => {
          //console.log('Metaobject not retrieved ' + err.status);
          this.manageErrorMsg(err);
          this.EventStopWaitHTTP[2]=true;
        });
  }

  deleteObject(srcbucket: any, srcobject: any) {
    this.returnFileContent="";
    this.initBeforeCallAPI(7);
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.ManageGoogleService.deleteObject(this.newConfigServer, srcbucket, srcobject)
      .subscribe(
        (data) => {
          this.EventStopWaitHTTP[7]=true;
          var theResp:any;
          theResp=data;
          if (theResp.status===undefined || theResp.status===200){
            this.returnFileContent = JSON.stringify(data);
            this.EventHTTPReceived[7] = true;
          } else {
            this.error=theResp.msg;
          }
        },
        err => {
          this.manageErrorMsg(err);
          this.EventStopWaitHTTP[7]=true;
        });
  }


  renameObject(srcbucket: any, srcobject: any, destobject: any) {
    this.returnFileContent="";
    this.initBeforeCallAPI(7);
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.ManageGoogleService.renameObject(this.newConfigServer, srcbucket, srcobject, destobject)
      .subscribe(
        data => {
          this.EventStopWaitHTTP[7]=true;
          var theResp:any;
          theResp=data;
          if (theResp.status===undefined || theResp.status===200){
            this.returnFileContent = JSON.stringify(data);
            this.EventHTTPReceived[7] = true;
          } else {
            this.error=theResp.msg;
          } 
        },
        err => {
          this.manageErrorMsg(err);
          this.EventStopWaitHTTP[7]=true;
        });
  }

  moveObject(srcbucket: any, srcobject: any, destbucket: any, destobject: any) {
    this.returnFileContent="";
    this.initBeforeCallAPI(7);
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;    
    this.ManageGoogleService.moveObject(this.newConfigServer,srcbucket, destbucket, srcobject, destobject)
      .subscribe(
        (data) => {
          //this.configServer.googleServer=saveGoogleServer;
          this.EventStopWaitHTTP[7]=true;
          var theResp:any;
          theResp=data;
          if (theResp.status===undefined || theResp.status===200){
            this.returnFileContent = JSON.stringify(data);
            this.EventHTTPReceived[7] = true;
          } else {
            this.error=theResp.msg;
          }
        },
        err => {
          this.EventStopWaitHTTP[7]=true;
          this.manageErrorMsg(err);
        });
  }

  copyObject(srcbucket: any, srcobject: any, destbucket: any, destobject: any) {
    this.initBeforeCallAPI(6);
    this.returnFileContent="";
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.ManageGoogleService.copyObject(this.newConfigServer, srcbucket, destbucket, srcobject, destobject)
      .subscribe(
        (data) => {
          this.EventStopWaitHTTP[6]=true;
          var theResp:any;
          theResp=data;
          if (theResp.status===undefined || theResp.status===200){
            this.returnFileContent = JSON.stringify(data);
            this.EventHTTPReceived[6] = true;
          } else {
            this.error=theResp.msg;
          }
        },
        err => {
          this.EventStopWaitHTTP[6]=true;
          this.manageErrorMsg(err);
        });
  }

  /* =================== METADATA  =============*/

  inputMetaData(){ // to input meta data before it s saved
    this.isInputMetadata=true;
  }

  modifyMetaData(){ 
    if (this.EventHTTPReceived[4] === true){ // metadata was retrieved
      this.isInputMetadata=true;
    } else if (this.theForm.controls['srcBucket'].value!=="" && this.theForm.controls['srcObject'].value){
        this.isInputMetadata=true;
        this.getMetaData(this.theForm.controls['srcBucket'].value, this.theForm.controls['srcObject'].value);
    } else {
      this.error="enter SrcBucket/srcObject"
    }
  }

  actionUpdateMeta(event:any) {
    this.currentAction = "";
    if (event.target.id==="submit"){
      this.isInputMetadata=false;
      for (var i = this.tabMetaPerso.length-1; i > 0; i--) {
        if (this.tabMetaPerso[i].key === "") {
          this.tabMetaPerso.splice(i, 1);
        }
      }
      this.updateMetaData(this.theForm.controls['srcBucket'].value, this.theForm.controls['srcObject'].value);
    } else if (event.target.id==="cancelUpdates"){
        this.getMetaData(this.theForm.controls['srcBucket'].value, this.theForm.controls['srcObject'].value);
    }
  }

  updateMetaData(bucket: any, object: any) {
    this.metaDataMsg="";
    this.initBeforeCallAPI(5);
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.strMetaDataPerso = "";
    this.ManageGoogleService.updateMetaData(this.newConfigServer, bucket, object, this.theForm.controls['metaControl'].value, this.theForm.controls['metaType'].value, this.tabMetaPerso)
      .subscribe(
        (data) => {
          this.EventStopWaitHTTP[5]=true;
          //this.configServer.googleServer=saveGoogleServer;
          if (data.type === 4 && data.status === 200) {
            this.returnFileContent = JSON.stringify(data);
            this.metaDataMsg=data.body.message;
            this.strMetaDataPerso = JSON.stringify(data.body.metaData.metadata);
            this.fullSizeTabMeta();
            this.EventHTTPReceived[5] = true;
          } else if (data.type===undefined){
            var response:any;
            response=data;
            this.error=response.msg;
        }
        },
        err => {
          this.EventStopWaitHTTP[5]=true;
          this.manageErrorMsg(err);
        });
  }


  listMetaDataObject(bucket: any) {
    this.initBeforeCallAPI(3);
    this.myListOfObjects.items.splice(0, this.myListOfObjects.items.length);
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.ManageGoogleService.getListMetaObjects(this.newConfigServer, bucket)
      .subscribe((data) => {
        this.EventStopWaitHTTP[3]=true;
        this.tabListMetaPerso.splice(0,this.tabListMetaPerso.length);
        for (var i = 0; i < data.length; i++) {
          const metadata = new OneBucketInfo;
          this.myListOfObjects.items.push(metadata);
          this.myListOfObjects.items[i] = data[i].items;
          if (data[i].items.metadata!==undefined){
            this.tabListMetaPerso[i]=JSON.stringify(data[i].items.metadata);
          } else {
            this.tabListMetaPerso[i]="";
          }
        }
        this.returnFileContent = JSON.stringify(data);
        this.EventHTTPReceived[3] = true;
      },
        err => {
          this.EventStopWaitHTTP[3]=true;
          this.manageErrorMsg(err);
        });
  }

  fullSizeTabMeta(){
    for (var i = this.tabMetaPerso.length; i<5; i++) {
      const classMeta=new classTabMetaPerso;
      this.tabMetaPerso.push(classMeta);
    }
  }


  getMetaData(bucket: any, object: any) {
    this.returnFileContent="";
    this.initBeforeCallAPI(4);
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.strMetaDataPerso = "";
    this.ManageGoogleService.getMetaObject(this.newConfigServer, bucket, object)
      .subscribe(
        (data) => {
          this.EventStopWaitHTTP[4]=true;
          //this.configServer.googleServer=saveGoogleServer;
          var k=0;
          this.returnFileContent = JSON.stringify(data);
          this.theForm.controls['metaControl'].setValue(data.cacheControl);
          this.theForm.controls['metaType'].setValue(data.contentType);
          this.strMetaDataPerso = JSON.stringify(data.metadata);
          var iTab=-1;
          this.fullSizeTabMeta();
          if (this.strMetaDataPerso!==undefined ){
            for (var iPos=2; iPos<this.strMetaDataPerso.length; iPos++){
                
                var jPos=this.strMetaDataPerso.substring(iPos).indexOf('":"');
                iTab++
                this.tabMetaPerso[iTab].key=this.strMetaDataPerso.substring(iPos,jPos+iPos);
                
                iPos=iPos+jPos+3;
                jPos=this.strMetaDataPerso.substring(iPos).indexOf('","');
                k=2;
                if (jPos===-1){
                  jPos=this.strMetaDataPerso.substring(iPos).indexOf('"}');
                  k=1;
                }
                this.tabMetaPerso[iTab].value=this.strMetaDataPerso.substring(iPos,jPos+iPos);
                iPos=iPos+jPos+k;
            }
          }
          iTab++
          for (var i=iTab; i<5; i++) {
            this.tabMetaPerso[i].key="";
            this.tabMetaPerso[i].value="";
          }
          this.oneMetadata = data;
          this.EventHTTPReceived[4] = true;
        },
        err => {
          this.EventStopWaitHTTP[3]=true;
          this.manageErrorMsg(err);
        });
  }

  uploadMetaPerso(srcbucket: any, srcobject: any, record: any) {
    this.returnFileContent="";
    var myObject: any;
    if (record.substring(0, 1) === "{") {
      myObject = JSON.parse(record);
    } else {
      myObject = record;
    }
    var file = new File([JSON.stringify(myObject)], srcobject, { type: 'application/json' });
    this.initBeforeCallAPI(8);
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.ManageGoogleService.uploadObjectMetaPerso(this.newConfigServer, srcbucket, file, srcobject, this.theForm.controls['metaControl'].value, this.theForm.controls['metaType'].value, this.tabMetaPerso)
      .subscribe(data => {
        this.EventStopWaitHTTP[8]=true;
        if (data.type === 4 && data.status === 200) {
          console.log(JSON.stringify(data));
          this.returnFileContent = JSON.stringify(data);
          this.EventHTTPReceived[8] = true;
        } else if (data.type===undefined){
            var response:any;
            response=data;
            this.error=response.msg;
        }
      },
        err => {
          this.EventStopWaitHTTP[8]=true;
          console.log('Upload of object and meaPerso failed ' + err.status);
          this.manageErrorMsg(err);
        });
  }

  /* =================== CACHE CONSOLE  =============*/
  gotoGetCacheConsole:boolean=false;
  reTriggerFn:number=0;
  getCacheConsole() {
    this.initData.getRecord=true;
    this.initData.record=[];
    this.initData.app="getCacheConsole";
    this.initData.nbCalls++
    this.reTriggerFn++
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.gotoGetCacheConsole=true;
  }

  appReturnError(event:any){
    if (event.app==="getCacheConsole"){
      this.error=event.error;
      //this.gotoGetCacheConsole=false;;
    }
    
  }

  getCacheConsoleBis() {
    this.initBeforeCallAPI(10);
    this.memoryCacheConsole.splice(0,this.memoryCacheConsole.length);
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.ManageSecuredGoogleService.getCacheConsole(this.newConfigServer)
      .subscribe(
        (data) => {
          this.EventStopWaitHTTP[10]=true;
          if (Array.isArray(data.msg)=== true){
            for (var i=0; i<data.msg.length; i++){
              const theClass={theDate:'',msg:"",content:"",credentials:"",tabLock:"",otherUser:""};
              this.memoryCacheConsole.push(theClass);
              this.memoryCacheConsole[i].theDate=data.msg[i].theDate;
              this.memoryCacheConsole[i].msg=data.msg[i].msg;
              if (data.msg[i].content!==undefined){
                if (data.msg[i].content.credentials!==undefined){
                  this.memoryCacheConsole[i].credentials=data.msg[i].content.credentials;
  
                } else if (data.msg[i].content.tabLock!==undefined){
                  this.memoryCacheConsole[i].tabLock=data.msg[i].content.tabLock;
  
                } else {
                  if (data.msg[i].updatedAt!==undefined){
                    this.memoryCacheConsole[i].otherUser=data.msg[i].content;
                  } else {
                    this.memoryCacheConsole[i].content=JSON.stringify(data.msg[i].content);
                  }
                }
              }
            }
            this.EventHTTPReceived[10] = true;
          } else {
            this.error=data.msg;
          }
        },
        err => {
          this.EventStopWaitHTTP[10]=true;
          this.error = JSON.stringify(err);
        });
  }

  resetCacheConsole() {
    this.initBeforeCallAPI(10);
    this.memoryCacheConsole.splice(0,this.memoryCacheConsole.length);
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.ManageSecuredGoogleService.resetCacheConsole(this.newConfigServer)
      .subscribe(
        (data) => {
          this.EventStopWaitHTTP[10]=true;
          this.error=data.msg;
        },
        err => {
          this.EventStopWaitHTTP[10]=true;
          this.manageErrorMsg(err);
        })
  }

  enableCacheConsole() {
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.ManageSecuredGoogleService.enableCacheConsole(this.newConfigServer)
      .subscribe(
        (data) => {
          this.error="cache control is enabled";
        },
        err => {
          this.error="could not enable cache control";
        })
      }
    
  disableCacheConsole() {
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.ManageSecuredGoogleService.disableCacheConsole(this.newConfigServer)
      .subscribe(
        (data) => {
          this.error="cache control is enabled";
        },
        err => {
          this.error="could not enable cache control";
        })
  }

  /* =================== FILE SYSTEM & MEMORY FS  =============*/

  manageErrorMsg(err:any){
    if (err.message!==undefined){
      this.error = 'Server may be down  '; // + + err.message;
    } else if (err.err.msg!==undefined){
      this.error = err.msg;
    }
  }

  getMemoryFS() {
    this.error="";
    this.isUserIdForFS=false;  
    this.initBeforeCallAPI(11);
    this.memoryFS.splice(0,this.memoryFS.length);
    this.newConfigServer.fileSystemServer=this.theForm.controls['serverForAction'].value;
    this.ManageSecuredGoogleService.getMemoryFS(this.newConfigServer)
      .subscribe(
        (data) => {
          this.EventStopWaitHTTP[11]=true;
          if (data.status===undefined || data.status===200){
            if (data.data.length===0){
              this.error='Memory file system is empty on server ' + this.newConfigServer.fileSystemServer;
            } else {
              for (var i=0; i<data.data.length; i++){
                this.memoryFS.push({fileName:"",record:[]});
                this.memoryFS[i].fileName=data.data[i].fileName;
                if (data.data[i].content.length===0){
                  if (this.error!==""){
                    this.error=this.error + " --- " + "File System " + this.memoryFS[i].fileName+ " memory is empty";
                  } else {
                    this.error='server ' + this.newConfigServer.fileSystemServer + " ==> File System " + this.memoryFS[i].fileName+ " memory is empty";
                  }
                  
                } else {
                  for (var j=0; j<data.data[i].content.length; j++){
                    const theClass=new classFileSystem;
                    this.memoryFS[i].record.push(theClass);
                    this.memoryFS[i].record[this.memoryFS[i].record.length-1]=data.data[i].content[j];                   
                  }
                }
              }
              if (this.memoryFS.length!==0){
                this.EventHTTPReceived[11]=true;
              }
            }
          } else { 
            this.error=data.msg + ' on server ' + this.newConfigServer.fileSystemServer;
          }
        },
        err => {
          this.EventStopWaitHTTP[11]=true;
          this.manageErrorMsg(err);
        });
  }

  isUserIdForFS:boolean=false;
  saveActionResetFS:string="";
  manageResetFS(){
    this.tabLock.splice(0,this.tabLock.length);
    for (var i = 0; i < 7; i++) {
      const thePush = new classAccessFile;
      this.tabLock.push(thePush);
    }
    this.error="";
    this.isUserIdForFS=false;   
    if (this.theForm.controls['iWait'].value ==="") {
      this.theForm.controls['iWait'].setValue(0);
    }
    this.tabLock[this.theForm.controls['iWait'].value].objectName= this.theForm.controls['srcObject'].value ;//+ this.theForm.controls['userId'].value;
    this.memoryFS.splice(0,this.memoryFS.length);
    this.initBeforeCallAPI(12);
    if (this.saveActionResetFS==='reset memory File System'){
      this.resetMemoryFS();
    } else if (this.saveActionResetFS==='reset memory all FS'){
      this.onResetFS()
    }
  }

  resetMemoryFS() {
   // const saveGoogleServer=this.configServer.fileSystemServer;
    this.newConfigServer.fileSystemServer=this.theForm.controls['serverForAction'].value;
    this.ManageSecuredGoogleService.resetFS(this.newConfigServer, this.theForm.controls['srcBucket'].value,this.theForm.controls['srcObject'].value,this.tabLock,this.theForm.controls['iWait'].value)
      .subscribe(
        (data) => {
          this.EventStopWaitHTTP[12]=true;
          this.error=data.msg + ' on server ' + this.newConfigServer.fileSystemServer;
        },
        err => {
          this.EventStopWaitHTTP[12]=true;
          this.manageErrorMsg(err);
        });
  }


  onResetFS(){ // this is to reset file system memory either all or only one FS
    // THIS NEEDS TO BE CODED
    const iWait=this.theForm.controls['iWait'].value;
    this.newConfigServer.fileSystemServer=this.theForm.controls['serverForAction'].value;
    if (this.theForm.controls['action'].value==='reset memory all FS'){
      this.tabLock[iWait].action='resetAll';
    } else {
      this.tabLock[iWait].action='resetFS';
    }
    this.ManageSecuredGoogleService.resetFS(this.newConfigServer, this.configServer.bucketFileSystem, 'fileSystem', this.tabLock, this.theForm.controls['iWait'].value)
    .subscribe(
      (data ) => {   
        this.EventStopWaitHTTP[12]=true;
        if (data.status===undefined ){
          console.log('resetFS reponse is : ' + JSON.stringify(data));
          this.error="FS has been reset" + ' on server ' + this.newConfigServer.fileSystemServer;
        } else {
          this.error=data.msg + ' on server ' + this.newConfigServer.fileSystemServer;
        }
      },
      err => {
        this.EventStopWaitHTTP[12]=true;
        console.log('error from resetFS : ' + JSON.stringify(err));
        this.manageErrorMsg(err);
      }
      )
      }

  /* =================== CREDENTIALS  =============*/

  getDefaultCredentials(){
    this.stringCredentials="";
    this.credentials = new classCredentials;
    this.initBeforeCallAPI(17);
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.ManageGoogleService.getDefaultCredentials(this.newConfigServer)
          .subscribe(
        (data ) => {
            //this.configServer.googleServer=saveGoogleServer;
            this.stringCredentials=JSON.stringify(data);
            this.credentials.access_token=data.credentials.access_token;
            this.credentials.id_token=data.credentials.id_token
            this.credentials.refresh_token=data.credentials.refresh_token
            this.credentials.token_type=data.credentials.token_type;
            this.credentials.userServerId=data.credentials.userServerId;
            this.credentials.creationDate=data.credentials.creationDate;
            this.EventHTTPReceived[17]=true;
            this.EventStopWaitHTTP[17]=true;
        },
        err => {
          //this.configServer.googleServer=saveGoogleServer;
          console.log(' error request credentials = '+ JSON.stringify(err));
          this.EventStopWaitHTTP[17]=true;
          this.manageErrorMsg(err);
        });
  }

  getCredentials(){
    console.log('getCredentials()');
    this.credentials = new classCredentials;
    this.initBeforeCallAPI(17);
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.ManageGoogleService.getCredentials(this.newConfigServer )
    .subscribe(
        (data ) => {
          this.EventStopWaitHTTP[17]=true;
          this.credentials.access_token=data.credentials.access_token;
          this.credentials.id_token=data.credentials.id_token
          this.credentials.refresh_token=data.credentials.refresh_token
          this.credentials.token_type=data.credentials.token_type;
          this.credentials.userServerId=data.credentials.userServerId;
          this.credentials.creationDate=data.credentials.creationDate.substring(0,4)+'/'+data.credentials.creationDate.substring(4,6)+'/'+data.credentials.creationDate.substring(6,8)+' '+data.credentials.creationDate.substring(8,10)+':'+data.credentials.creationDate.substring(10,12)+':'+data.credentials.creationDate.substring(12,14)+' '+data.credentials.creationDate.substring(14);
          this.returnFileContent=JSON.stringify(data);
          this.EventHTTPReceived[17]=true;
        },
        err => {
            this.EventStopWaitHTTP[17]=true;
          this.manageErrorMsg(err);
          console.log('return from requestToken() with error = '+ JSON.stringify(err));
          });
  }

/*
  getFSCredentials(){
    console.log('get File System Credentials()');
    this.credentials = new classCredentials;
    this.initBeforeCallAPI(17);
    this.newConfigServer.fileSystemServer=this.theForm.controls['serverForAction'].value;
    this.ManageGoogleService.getFSCredentials(this.newConfigServer )
    .subscribe(
        (data ) => {
          this.EventStopWaitHTTP[17]=true;
          this.credentials.access_token=data.credentials.access_token;
          this.credentials.id_token=data.credentials.id_token
          this.credentials.refresh_token=data.credentials.refresh_token
          this.credentials.token_type=data.credentials.token_type;
          this.credentials.userServerId=data.credentials.userServerId;
          this.credentials.creationDate=data.credentials.creationDate.substring(0,4)+'/'+data.credentials.creationDate.substring(4,6)+'/'+data.credentials.creationDate.substring(6,8)+' '+data.credentials.creationDate.substring(8,10)+':'+data.credentials.creationDate.substring(10,12)+':'+data.credentials.creationDate.substring(12,14)+' '+data.credentials.creationDate.substring(14);
          this.returnFileContent=JSON.stringify(data);
          this.EventHTTPReceived[17]=true;
        },
        err => {
          this.EventStopWaitHTTP[17]=true;
          this.manageErrorMsg(err);
          console.log('return from requestToken() with error = '+ JSON.stringify(err));
          });
  }
*/


  /* =================== CONFIRM SAVE/DELETE  =============*/

  confirmDelete(event: any) {
    this.isConfirmedDelete= false;
    if (event.target.id === "Save") {
      this.deleteObject(this.theForm.controls['srcBucket'].value, this.theForm.controls['srcObject'].value);
    }
  }

  confirmSave(event: any) {
    this.isConfirmedSave = false;
    if (event.target.id === "Save") {
      if (this.currentAction==='save object with meta perso'){
        this.uploadMetaPerso(this.theForm.controls['srcBucket'].value, this.theForm.controls['srcObject'].value, this.theForm.controls['fileContent'].value)
      } else  if (this.currentAction==='save object'){

        if (this.theForm.controls['server'].value === 'HTTP') {
          this.saveObjectHTTP(this.theForm.controls['srcBucket'].value, this.theForm.controls['srcObject'].value, this.theForm.controls['fileContent'].value);
        } else {
          this.saveObject(this.theForm.controls['srcBucket'].value, this.theForm.controls['srcObject'].value, this.theForm.controls['fileContent'].value);
        }
      }
    } else { 
      this.currentAction = ""; 
    }
  }

  saveObject(srcbucket: any, srcobject: any, record: any) {

    var myObject: any;
    if (record.substring(0, 1) === "{") {
      myObject = JSON.parse(record);
    } else {
      myObject = record;
    }
    var file = new File([JSON.stringify(myObject)], srcobject, { type: 'application/json' });
    this.initBeforeCallAPI(8);
    this.newConfigServer.googleServer=this.theForm.controls['serverForAction'].value;
    this.ManageGoogleService.uploadObject(this.newConfigServer, srcbucket, file, srcobject)
      .subscribe(data => {
        this.EventStopWaitHTTP[8]=true;
        //this.configServer.googleServer=saveGoogleServer;
        if (data.type === 4 && data.status === 200) {
          console.log(JSON.stringify(data));
          this.returnFileContent = JSON.stringify(data);
          this.EventHTTPReceived[8] = true;
        }
      },
        err => {
          this.EventStopWaitHTTP[8]=true;
          console.log('Metaobject not retrieved ' + err.status);
          this.manageErrorMsg(err);
        });
  }

  saveObjectHTTP(srcbucket: any, srcobject: any, record: any) {
    var myObject: any;
    // check if must be used or not
    if (record.substring(0, 1) === "{") {
      myObject = JSON.parse(record);
    } else {
      myObject = record;
    }

    this.HTTP_Address = this.Google_Bucket_Access_RootPOST + srcbucket + this.GoogleObject_Option + srcobject;
    this.http.post(this.HTTP_Address, record, { headers: this.theHeadersAll })
      .subscribe(
        data => {
          console.log(JSON.stringify(data));
        },
        err => {
          console.log(JSON.stringify(err));
          this.manageErrorMsg(err);
        })
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
        this.errorAccessFile="Action: " + this.currentAction + " - server problem; timeout reached";
      };
      window.cancelAnimationFrame(this.id_Animation[eventNb]);
 
    }
  }


  manageAuth() {
    const OAUTH_CLIENT = '699868766266-iimi67j8gvpnogsq45jul0fbuelecp4i.apps.googleusercontent.com';
    const OAUTH_SECRET = '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';
    const API_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    const HTTP_OPTIONSA = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
        , 'Authorization': 'Basic ' + btoa(OAUTH_CLIENT + ":" + OAUTH_SECRET)
      })
    };
    const HTTP_OPTIONSB = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'

      })
    };
    const theScope = "&scope=https://www.googleapis.com/auth/devstorage.read_write" // Manage your data in Google Cloud Storage
    //const theScope="https://www.googleapis.com/auth/devstorage.full_control"    // Manage your data and permissions in Google Cloud Storage
    //const theScope="&scope=https://storage.googleapis.com/storage/v1/b/config-xmvit"
    //const theScope="https://www.googleapis.com/auth/cloud-platform.read-only" // View your data across Google Cloud Platform services
    //const theScope="https://www.googleapis.com/auth/cloud-platform" // View and manage your data across Google Cloud Platform services

    const reDirect = "http://localhost:4200"
    const body = new HttpParams()
      .set('grant_type', 'client_credentials');

    //     &redirect_uri=http://localhost:4200

    this.http.post(API_URL + "?include_granted_scopes=true&response_type=code&access_type=offline" + theScope + "&client_id=" + OAUTH_CLIENT, HTTP_OPTIONSB)
      .subscribe(
        data => {
          console.log(JSON.stringify(data));
        },
        err => {
          console.log(JSON.stringify(err));
        });



    this.http.post(API_URL, body, HTTP_OPTIONSA)
      .subscribe(
        data => {
          console.log("========================");
          console.log(JSON.stringify(data));
        },
        err => {
          console.log("========================");
          console.log(JSON.stringify(err));
        })
  }

  ngOnChanges(changes: SimpleChanges){
    console.log('test-server ngOnChanges()');
    for (const propName in changes) {
      const j = changes[propName];
      console.log('test-server ngOnChanges() - item ' + propName);
      if (propName === 'configServerChanges') {
        if (changes['configServerChanges'].firstChange === false) {
          console.log('configServer has been updated');
          this.newConfigServer=fillConfig(this.configServer);
        }
      }
    }
  }


}
