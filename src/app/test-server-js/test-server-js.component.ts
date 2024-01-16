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

  newConfigServer = new configServer;

  retrievedConfigServer= new configServer;
  updatedConfigServer= new configServer;

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

  EventHTTPReceived: Array<boolean> = [];
  maxEventHTTPrequest: number = 20;
  id_Animation: Array<number> = [];
  TabLoop: Array<number> = [];
  maxLoop: number = 5000;
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
  });

  tabAction: Array<string> = ['cancel', 'list all buckets', 'list all objects', 'get file content', 'get list metadata for all objects', 'get metadata for one object', 'create & save metadata' , 'update metadata for one object',  'save object', 'save object with meta perso' , 'rename object', 
  'copy object', 'move object', 'delete object', 'get cache console', 'reset cache console', 'get memory File System','reset memory File System','get cache file', 'reset cache file', 'reload cache file', 'get credentials', 'manage config','get server version'];
  
  tabConfig:Array<string>=['find cache config', 'reset cache config','find config by criteria', 'find all config', "update config by id", "upload config", "delete config by Id", "create config"]
  /*
  router.get("/config/:db/:testProd/:collection", config.findConfig);
  router.get("/configByString/:db/:testProd/:collection/:searchField", config.findConfig); // contains the searchString query
  router.get("/resetConfig/:db/:testProd/:collection", config.resetConfig);
  router.get("/allConfig/:db/:testProd/:collection", config.getAllConfig);
  router.put("/updateConfig/:db/:testProd/:collection/:id", config.updateConfig);
  router.put("/uploadConfig/:db/:testProd/:collection", config.uploadConfig);
  router.get("/delConfigById/:db/:testProd/:collection/:id", config.delConfigById);
  */

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

  ngOnInit() {
    
    this.reinitialise();
    
    console.log('ngOnInit');
    for (var i = 0; i < this.maxEventHTTPrequest; i++) {
      this.TabLoop[i] = 0;
      this.EventHTTPReceived[i] = false;
    }
    this.currentAction='list all buckets';
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
    //this.newConfigServer=this.configServer;
    this.newConfigServer=fillConfig(this.configServer);

    /*
    this.newConfigServer.googleServer = this.theForm.controls['googleServer'].value;
    this.newConfigServer.mongoServer = this.theForm.controls['mongoServer'].value;
    this.newConfigServer.fileSystemServer = this.theForm.controls['fileSystemServer'].value;
    this.newConfigServer.test_prod=this.theForm.controls['testProd'].value;
    */
    this.isInitDone=true;
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
    //this.theForm.controls['nameServer'].setValue(this.tabServers[1]);
    this.theForm.controls['testProd'].setValue('test');
    this.theForm.controls['dataBase'].setValue('Google');
    this.theForm.controls['srcBucket'].setValue('xav_fitness');
    this.theForm.controls['srcObject'].setValue('Copie de HealthTracking');
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

  tabVersionServer:Array<string>=['','','','',''];
  isGetServerFunction:boolean=false;
  getServerVersion(i:number){
    this.EventHTTPReceived[15] = false;
    const saveGoogleServer=this.configServer.googleServer;
    this.configServer.googleServer=this.tabServers[i];
    this.ManageGoogleService.getServerVersion(this.configServer)
        .subscribe(
          (data) => {
          this.isGetServerFunction=true;
          this.tabVersionServer[i]=data.version;
          this.serverVersion=data.version;
          this.configServer.googleServer=saveGoogleServer;
          this.EventHTTPReceived[15] = true;
        }, 
        err =>{
          this.serverVersion="";
          this.configServer.googleServer=saveGoogleServer;
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

      }  else if (event.target.textContent.trim() === 'get memory File System') {
        this.isDisplayAction=false;
        this.getMemoryFS();

      } else if (event.target.textContent.trim() === 'reset memory File System') {
        this.isDisplayAction=false;
        this.resetMemoryFS(this.theForm.controls['srcBucket'].value, this.theForm.controls['srcObject'].value);
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
        this.getDefaultCredentials();
        this.getCredentials();

      }  else if (event.target.textContent.trim() === 'get server version') {
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
    this.ManageSecuredGoogleService.resetCacheFile(this.configServer, "All" )
      .subscribe((data ) => {  
        if (data.status===undefined || data.status===200){
        this.EventHTTPReceived[16]=true;
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
        this.error="Cache file could not be reset, error:" + err;
        this.EventHTTPReceived[16]=false;
      });
  }

  getCacheFile(){
    this.resetObjectCacheFile();
    this.ManageSecuredGoogleService.getCacheFile(this.configServer )
    .subscribe((data ) => {  
      if (data.status===undefined || data.status===200){
      this.EventHTTPReceived[16]=true;
      this.msgCacheFile.status=data.status;
      this.msgCacheFile.msg=data.msg;
      this.msgCacheFile.content=data.cacheFiles;
    } else {
      this.error=data.msg;
    }
    }, 
    err => {
      this.error="Cache file could not be retrieved, error:" + err;
      this.EventHTTPReceived[16]=false;
    });
  }

  resetObjectCacheFile(){
    this.msgCacheFile.status=0;
    this.msgCacheFile.msg="";
    this.msgCacheFile.content.splice(0,this.msgCacheFile.content.length);
  }

  reloadCacheFile(){
    this.resetObjectCacheFile();
    this.ManageSecuredGoogleService.reloadCacheFile(this.configServer )
    .subscribe((data ) => {  
      if (data.status===undefined || data.status===200){
      this.EventHTTPReceived[16]=true;
      this.msgCacheFile.status=data.status;
      this.msgCacheFile.msg=data.msg;
      this.msgCacheFile.content=data.cacheFiles;
    } else {
      this.error=data.msg;
    }
    }, 
    err => {
      this.error="Cache file has not been reloaded, error:" + err;
      this.EventHTTPReceived[16]=false;
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
  this.ManageMongoDBService.findConfig(this.configServer,'configServer' )
  .subscribe((data ) => { 
    if (data.status ===200){
      this.error="Cache config has been successfully reset" ; 
      console.log(data);
      this.dataConfigServer = new configServer;
      this.dataConfigServer = this.responseConfig(data, this.dataConfigServer);
      this.EventHTTPReceived[18]=true;
    } else {
      this.errorConfig=data.msg;
    }
  }, 
  err => {
    this.errorConfig="Cache config has not been reset, error:" + err
  });
}

findAllConfig(){
  this.ManageMongoDBService.findAllConfig(this.configServer,'configServer' )
  .subscribe((data ) => { 
    this.dataConfigServer = new configServer;
    this.dataConfigServer = this.responseConfig(data, this.dataConfigServer);
    console.log(data);
    this.EventHTTPReceived[18]=true;
  }, 
  err => {
    this.errorConfig="Find all config, error:" + err
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
    this.ManageMongoDBService.findConfigByString(this.configServer, 'configServer', this.theForm.controls['searchField'].value, this.theForm.controls['searchCriteria'].value )
    .subscribe((data ) => { 
      this.dataConfigServer = new configServer;
      this.dataConfigServer= this.responseConfig(data, this.dataConfigServer);
      console.log(data);
      this.EventHTTPReceived[18]=true;
    }, 
    err => {
      this.errorConfig="Find config by string, error:" + err;
      this.EventHTTPReceived[18]=false;
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
  this.ManageMongoDBService.updateConfig(this.configServer,  'configServer', this.theForm.controls['idRecord'].value, this.dataConfigServer)
  .subscribe((data ) => { 
    if (data.status===200){
      this.errorConfig="Config has been successfully updated" ; 
      console.log(data.data);
    } else {
      this.errorConfig=data.msg;
    }
  }, 
  err => {
    this.errorConfig="Config has not been updated, error:" + err
  });
}

deleteConfigById(){
  this.ManageMongoDBService.delConfigById(this.configServer,  'configServer', this.theForm.controls['idRecord'].value)
  .subscribe((data ) => { 
    if (data.status===200){
      this.errorConfig="Config has been successfully deleted" ; 
      this.findAllConfig();
      console.log(data.data);
    } else {
      this.errorConfig=data.msg;
    }
  }, 
  err => {
    this.errorConfig="Config has not been deleted, error:" + err
  });
}

uploadConfig(){
  this.ManageMongoDBService.uploadConfig(this.configServer, 'configServer', this.dataConfigServer)
  .subscribe((data ) => { 
    if (data.status===200){
      this.errorConfig="Config has been successfully uploaded" ; 
      this.findAllConfig();
      console.log(data.data);
    } else {
      this.errorConfig=data.msg;
    }
  }, 
  err => {
    this.errorConfig="Config has not been uploaded, error:" + err
  });
}

resetCacheConfig(){
  this.ManageMongoDBService.resetCacheConfig(this.configServer,'configServer')
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
    var test_prod='';
        
    // this is for allFunctions only so that test BackendServer is used
    this.EventHTTPReceived[13] = false;
    this.configServer=new configServer;
    this.configServer.googleServer=this.theForm.controls['googleServer'].value;
    this.configServer.mongoServer=this.theForm.controls['mongoServer'].value;
    this.configServer.fileSystemServer=this.theForm.controls['fileSystemServer'].value;
    this.configServer.test_prod=this.theForm.controls['testProd'].value; // retrieve the corresponding record test or production
    this.configServer.GoogleProjectId='ConfigDB';
    this.ManageMongoDBService.findAllConfig(this.configServer, 'configServer')
  // this.ManageMongoDB.findConfigbyURL(this.configServer, 'retrievedConfigServer', '')
        .subscribe(
          (data) => {
            this.dataConfigServer = new configServer;
            this.dataConfigServer= this.responseConfig(data, this.dataConfigServer);
            this.EventHTTPReceived[13] = true;
        }, 
        err =>{
          console.log('List config error: ' + JSON.stringify(err));
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
    this.configServer.googleServer=event.google;;
    this.configServer.mongoServer=event.mongo;
    this.configServer.fileSystemServer=event.fileSystem;
    this.newConfigServer.googleServer=event.google;;
    this.newConfigServer.mongoServer=event.mongo;
    this.newConfigServer.fileSystemServer=event.fileSystem;
    this.configServerChanges++;
  }

  fillConfig(inFile:any,outFile:any){
    outFile.title = inFile.title;
    outFile.SourceJson_Google_Mongo = inFile.SourceJson_Google_Mongo;
    outFile.test_prod = inFile.test_prod;
    outFile.GoogleProjectId = inFile.GoogleProjectId;
    outFile.googleServer = inFile.googleServer;
    outFile.mongoServer = inFile.mongoServer;
    outFile.fileSystemServer = inFile.mongoServer;
    outFile.consoleBucket = inFile.consoleBucket;
    outFile.IpAddress = inFile.IpAddress;
    if (inFile.credentialDate!==undefined){
      outFile.credentialDate = inFile.credentialDate;
    } else {outFile.credentialDate = ""};
    outFile.bucketFileSystem = inFile.bucketFileSystem;
    outFile.objectFileSystem = inFile.objectFileSystem;
    outFile.timeoutFileSystem.hh= inFile.timeoutFileSystem.hh;
    outFile.timeoutFileSystem.mn = inFile.timeoutFileSystem.mn;
    outFile.timeoutFileSystem.bufferTO.hh= inFile.timeoutFileSystem.bufferTO.hh;
    outFile.timeoutFileSystem.bufferTO.mn = inFile.timeoutFileSystem.bufferTO.mn;
    outFile.timeoutFileSystem.bufferInput.hh = inFile.timeoutFileSystem.bufferInput.hh;
    outFile.timeoutFileSystem.bufferInput.mn = inFile.timeoutFileSystem.bufferInput.mn;
    outFile.PointOfRef.bucket = inFile.PointOfRef.bucket;
    outFile.PointOfRef.file = inFile.PointOfRef.file;
    for (var i=0; i<inFile.filesToCache.length; i++){
      const theClass=new classFilesToCache
      outFile.filesToCache.push(theClass);
      outFile.filesToCache[i].bucket = inFile.filesToCache[i].bucket;
      outFile.filesToCache[i].object = inFile.filesToCache[i].object;
    }
    
    if (inFile.UserSpecific!==undefined){
      outFile.UserSpecific=inFile.UserSpecific;
    } else {
      const theClass=new UserParam;
      this.dataConfigServer.UserSpecific.push(theClass);
    }
  }

  /* =================== MANAGE OBJECTS  =============*/

  getListBuckets() {
    this.EventHTTPReceived[0] = false;
    this.waitHTTP(this.TabLoop[0], this.maxLoop, 0);
    this.ManageGoogleService.getListBuckets(this.configServer)
      .subscribe((data) => {
        //console.log(JSON.stringify(data));
        if (data.status===undefined || data.status===200){
          this.returnFileContent = JSON.stringify(data);
        this.TabBuckets = data;
        this.EventHTTPReceived[0] = true;
        } else { 
          this.error=data.msg;
        }
        
      },
        err => {
          //console.log('Metaobject not retrieved ' + err.status);
          this.error = JSON.stringify(err);
        });
  }

  getListObjects(bucket: any) {
    this.EventHTTPReceived[1] = false;
    this.waitHTTP(this.TabLoop[1], this.maxLoop, 1);
    this.ManageGoogleService.getListObjects(this.configServer, bucket)
      .subscribe((data) => {
        //console.log(JSON.stringify(data));
        this.myListOfObjects.items = data;
        this.returnFileContent = JSON.stringify(data);
        this.EventHTTPReceived[1] = true;
      },
        err => {
          //console.log('Metaobject not retrieved ' + err.status);
          this.error = JSON.stringify(err);
          this.EventHTTPReceived[1] = true;
        });
  }

  getFileContent(bucket: any, object: any) {
    this.EventHTTPReceived[2] = false;
    this.waitHTTP(this.TabLoop[2], this.maxLoop, 2);
    this.ManageGoogleService.getContentObject(this.configServer, bucket, object)
      .subscribe((data) => {
        //console.log(JSON.stringify(data)); 
        this.returnFileContent = JSON.stringify(data);
        this.EventHTTPReceived[2] = true;
      },
        err => {
          //console.log('Metaobject not retrieved ' + err.status);
          this.error = "cannot retrieve file " + object + "   error==> " + JSON.stringify(err);
          this.EventHTTPReceived[2] = true;
        });
  }

  getFileContentHTTP(bucket: any, object: any) {
    this.EventHTTPReceived[2] = false;
    this.waitHTTP(this.TabLoop[2], this.maxLoop, 2);
    this.HTTP_Address = 'https://storage.googleapis.com/download/storage/v1/b/' + bucket + '/o/' + object + '?alt=media';
    //this.HTTP_Address=this.Google_Bucket_Access_Root+bucket+this.GoogleObject_Option+object;
    this.http.get(this.HTTP_Address, { headers: this.theHeadersAll })
      .subscribe((data) => {
        //console.log(JSON.stringify(data)); 
        this.returnFileContent = JSON.stringify(data);
        this.EventHTTPReceived[2] = true;
      },
        err => {
          //console.log('Metaobject not retrieved ' + err.status);
          this.error = JSON.stringify(err);
          this.EventHTTPReceived[2] = true;
        });
  }

  deleteObject(srcbucket: any, srcobject: any) {
    this.EventHTTPReceived[7] = false;
    this.waitHTTP(this.TabLoop[7], this.maxLoop, 7);
    this.ManageGoogleService.deleteObject(this.configServer, srcbucket, srcobject)
      .subscribe(
        (data) => {
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
          //console.log('Error to copy ' + err.status);
          this.error = JSON.stringify(err);
          this.EventHTTPReceived[7] = true;
        });
  }


  renameObject(srcbucket: any, srcobject: any, destobject: any) {
    this.EventHTTPReceived[7] = false;
    this.waitHTTP(this.TabLoop[7], this.maxLoop, 7);
    this.ManageGoogleService.renameObject(this.configServer, srcbucket, srcobject, destobject)
      .subscribe(
        data => {
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
          //console.log('Error to copy ' + err.status);
          this.error = JSON.stringify(err);
          this.EventHTTPReceived[7] = true;
        });
  }

  moveObject(srcbucket: any, srcobject: any, destbucket: any, destobject: any) {
    this.EventHTTPReceived[7] = false;
    this.waitHTTP(this.TabLoop[7], this.maxLoop, 7);
    this.ManageGoogleService.moveObject(this.configServer,srcbucket, destbucket, srcobject, destobject)
      .subscribe(
        (data) => {
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
          //console.log('Error to copy ' + err.status);
          this.error = JSON.stringify(err);
          this.EventHTTPReceived[7] = true;
        });
  }

  copyObject(srcbucket: any, srcobject: any, destbucket: any, destobject: any) {
    this.EventHTTPReceived[6] = false;
    this.waitHTTP(this.TabLoop[6], this.maxLoop, 6);
    this.ManageGoogleService.copyObject(this.configServer, srcbucket, destbucket, srcobject, destobject)
      .subscribe(
        (data) => {
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
          //console.log('Error to move ' + err.status);
          this.error = JSON.stringify(err);
          this.EventHTTPReceived[6] = true;
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
    this.EventHTTPReceived[5] = false;
    this.waitHTTP(this.TabLoop[5], this.maxLoop, 5);
    this.strMetaDataPerso = "";
    this.ManageGoogleService.updateMetaData(this.configServer, bucket, object, this.theForm.controls['metaControl'].value, this.theForm.controls['metaType'].value, this.tabMetaPerso)
      .subscribe(
        (data) => {
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
          //console.log('Metadata not updated for unloadfileSystem');
          this.error = JSON.stringify(err);
          this.EventHTTPReceived[5] = true;
        });
  }


  listMetaDataObject(bucket: any) {
    this.EventHTTPReceived[3] = false;
    this.waitHTTP(this.TabLoop[3], this.maxLoop, 3);
    this.ManageGoogleService.getListMetaObjects(this.configServer, bucket)
      .subscribe((data) => {
        //console.log(JSON.stringify(data));
        this.myListOfObjects.items.splice(0, this.myListOfObjects.items.length);
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
          //console.log('Metaobject not retrieved ' + err.status);
          this.error = JSON.stringify(err);
          this.EventHTTPReceived[3] = true;
        });
  }

  fullSizeTabMeta(){
    for (var i = this.tabMetaPerso.length; i<5; i++) {
      const classMeta=new classTabMetaPerso;
      this.tabMetaPerso.push(classMeta);
    }
  }


  getMetaData(bucket: any, object: any) {
    this.EventHTTPReceived[4] = false;
    this.waitHTTP(this.TabLoop[4], this.maxLoop, 4);
    this.strMetaDataPerso = "";
    this.ManageGoogleService.getMetaObject(this.configServer, bucket, object)
      .subscribe(
        (data) => {
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
          //console.log('Metaobject not retrieved ' + err.status);
          this.error = JSON.stringify(err);
          this.EventHTTPReceived[4] = false;
        });
  }

  uploadMetaPerso(srcbucket: any, srcobject: any, record: any) {

    var myObject: any;
    if (record.substring(0, 1) === "{") {
      myObject = JSON.parse(record);
    } else {
      myObject = record;
    }

    var file = new File([JSON.stringify(myObject)], srcobject, { type: 'application/json' });
    this.EventHTTPReceived[8] = false;
    this.waitHTTP(this.TabLoop[8], this.maxLoop, 8);
    this.ManageGoogleService.uploadObjectMetaPerso(this.configServer, srcbucket, file, srcobject, this.theForm.controls['metaControl'].value, this.theForm.controls['metaType'].value, this.tabMetaPerso)
      .subscribe(data => {
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
          console.log('Upload of object and meaPerso failed ' + err.status);
          this.error = JSON.stringify(err);
          this.EventHTTPReceived[8] = true;
        });
  }

  /* =================== CACHE CONSOLE  =============*/

  getCacheConsole() {
    this.EventHTTPReceived[10] = false;
    this.waitHTTP(this.TabLoop[10], this.maxLoop, 10);
    this.ManageSecuredGoogleService.getCacheConsole(this.configServer)
      .subscribe(
        (data) => {
          if (Array.isArray(data.msg)=== true){
            this. memoryCacheConsole.splice(0,this. memoryCacheConsole.length);
            for (var i=0; i<data.msg.length; i++){
              const theClass={theDate:'',msg:"",content:""};
              this. memoryCacheConsole.push(theClass);
              this. memoryCacheConsole[i].theDate=data.msg[i].theDate;
              this. memoryCacheConsole[i].msg=data.msg[i].msg;
              //if (typeof data.msg[i].content === 'object'){
              this. memoryCacheConsole[i].content=JSON.stringify(data.msg[i].content);
              //}
            }
          } else {
            this.error=data.msg;
          }

          this.EventHTTPReceived[10] = true;
        },
        err => {
          //console.log('Error to move ' + err.status);
          this.error = JSON.stringify(err);
          this.EventHTTPReceived[10] = true;
        });
  }

  resetCacheConsole() {
    this.EventHTTPReceived[10] = false;
    this.waitHTTP(this.TabLoop[10], this.maxLoop, 10);
    this.ManageSecuredGoogleService.resetCacheConsole(this.configServer)
      .subscribe(
        (data) => {
          this.error=data.msg;
        },
        err => {
          this.error= err;
        })
  }
  /* =================== FILE SYSTEM & MEMORY FS  =============*/

  getMemoryFS() {
    this.error="";
    this.EventHTTPReceived[11] = false;
    this.waitHTTP(this.TabLoop[11], this.maxLoop, 11);
    this.ManageSecuredGoogleService.getMemoryFS(this.configServer)
      .subscribe(
        (data) => {
          if (data.status===undefined || data.status===200){
            this.memoryFS.splice(0,this.memoryFS.length);
            for (var i=0; i<data.data.length; i++){
              this.memoryFS.push({fileName:"",record:[]});
              this.memoryFS[i].fileName=data.data[i].fileName;
              if (data.data[i].content.length===0){
                this.error=this.error + " --- " + "File System " + this.memoryFS[i].fileName+ " memory is empty";
              } else {
                for (var j=0; j<data.data[i].content.length; j++){
                  const theClass=new classFileSystem;
                  this.memoryFS[i].record.push(theClass);
                  this.memoryFS[i].record[this.memoryFS[i].record.length-1]=data.data[i].content[j];
                  
                }
              }
            }
          } else { 
            this.error=data.msg;
          }
          this.EventHTTPReceived[11] = true;
        },
        err => {
          //console.log('Error to move ' + err.status);
          this.error = JSON.stringify(err);
          this.EventHTTPReceived[11] = true;
        });
  }

  resetMemoryFS(srcBucket:string, srcObject:string) {
    
    this.EventHTTPReceived[12] = false;
    this.waitHTTP(this.TabLoop[12], this.maxLoop, 12);
    this.ManageSecuredGoogleService.resetFS(this.configServer, srcBucket, srcObject,this.tabLock,0)
      .subscribe(
        (data) => {

            this.error=data.msg;
            this.EventHTTPReceived[12] = true;
        },
        err => {
          //console.log('Error to move ' + err.status);
          this.error = JSON.stringify(err);
          this.EventHTTPReceived[12] = true;
        });
  }


  onResetFS(){
    const iWait=this.theForm.controls['iWait'].value;
    this.tabLock[iWait].object=this.theForm.controls['dataFile'].value;
    this.tabLock[iWait].objectName=this.theForm.controls['fileSystem'].value;
    this.tabLock[iWait].bucket=this.theForm.controls['bucket'].value;
    this.tabLock[iWait].user=this.theForm.controls['userId'].value;
    if (this.theForm.controls['action'].value==='resetAll'){
      this.tabLock[iWait].action='resetAll';
    } else {
      this.tabLock[iWait].action='resetFS';
    }
    
    this.ManageSecuredGoogleService.resetFS(this.configServer, this.configServer.bucketFileSystem, 'fileSystem', this.tabLock, iWait.toString() )
    .subscribe(
      (data ) => {   
        if (data.status===undefined || data.status===200){
          console.log('resetFS reponse is : ' + JSON.stringify(data));
          this.error="FS has been reset";
        } else {
          this.error=data.msg;
        }
      },
      err => {
        console.log('error from resetFS : ' + JSON.stringify(err));
      }
      )
      }

  /* =================== CREDENTIALS  =============*/

  getDefaultCredentials(){
    this.stringCredentials="";
    this.ManageGoogleService.getDefaultCredentials(this.configServer)
          .subscribe(
        (data ) => {
            this.stringCredentials=JSON.stringify(data);
            this.credentials.access_token=data.credentials.access_token;
            this.credentials.id_token=data.credentials.id_token
            this.credentials.refresh_token=data.credentials.refresh_token
            this.credentials.token_type=data.credentials.token_type;
            this.credentials.userServerId=data.credentials.userServerId;
            this.credentials.creationDate=data.credentials.creationDate;
            this.EventHTTPReceived[17]=true;
        },
        err => {
          console.log(' error request credentials = '+ JSON.stringify(err));
          this.EventHTTPReceived[17]=false;
        });
  }

  getCredentials(){
    console.log('getDefaultCredentials()');
    this.ManageGoogleService.getCredentials(this.configServer )
    .subscribe(
        (data ) => {
          this.credentials.access_token=data.credentials.access_token;
          this.credentials.id_token=data.credentials.id_token
          this.credentials.refresh_token=data.credentials.refresh_token
          this.credentials.token_type=data.credentials.token_type;
          this.credentials.userServerId=data.credentials.userServerId;
          this.credentials.creationDate=data.credentials.creationDate;
         this.returnFileContent=JSON.stringify(data);
         this.isDisplayAction=true;
        },
        err => {
          console.log('return from requestToken() with error = '+ JSON.stringify(err));
          });
  }



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
    this.EventHTTPReceived[8] = false;
    this.waitHTTP(this.TabLoop[8], this.maxLoop, 8);
    this.ManageGoogleService.uploadObject(this.configServer, srcbucket, file, srcobject)
      .subscribe(data => {
        if (data.type === 4 && data.status === 200) {
          console.log(JSON.stringify(data));
          this.returnFileContent = JSON.stringify(data);
          this.EventHTTPReceived[8] = true;
        }
      },
        err => {
          console.log('Metaobject not retrieved ' + err.status);
          this.error = JSON.stringify(err);
          this.EventHTTPReceived[8] = true;
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
        })
  }

  waitHTTP(loop: number, max_loop: number, eventNb: number) {
    const pas = 500;
    if (loop % pas === 0) {
      console.log('waitHTTP ==> loop=' + loop + ' max_loop=' + max_loop + '  eventNb=' + eventNb);
    }
    loop++

    this.id_Animation[eventNb] = window.requestAnimationFrame(() => this.waitHTTP(loop, max_loop, eventNb));
    if (loop > max_loop || this.EventHTTPReceived[eventNb] === true) {
      console.log('exit waitHTTP ==> loop=' + loop + ' max_loop=' + max_loop + ' this.EventHTTPReceived=' +
        this.EventHTTPReceived[eventNb]);
      //if (this.EventHTTPReceived[eventNb]===true ){
      window.cancelAnimationFrame(this.id_Animation[eventNb]);
      //}    
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
