import { Component, Input, signal} from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormGroup, FormControl,} from '@angular/forms';
import { HttpClient,  HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from "@angular/router";

import { UserFunctionsComponent } from './user-functions/user-functions.component';
import { XmvCompanyComponent } from './xmv-company/xmv-company.component';

import { ManageGoogleService } from './CloudServices/ManageGoogle.service';
import { ManageMongoDBService } from './CloudServices/ManageMongoDB.service';

import { LoginIdentif , configServer } from './JsonServerClass';
import { EventAug } from './JsonServerClass';
import { classCredentials} from './JsonServerClass';
import { mainClassConv,mainConvItem, mainRecordConvert, mainClassUnit} from './ClassConverter';
import { classAccessFile } from './classFileSystem';
import { fillConfig } from './copyFilesFunction';
import { fillCredentials } from './copyFilesFunction';

//import { NutritionComponent } from './nutrition/nutrition.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true, 
  imports:[RouterOutlet, CommonModule, FormsModule, ReactiveFormsModule,XmvCompanyComponent, UserFunctionsComponent,
   
  ],
})

export class AppComponent {
  constructor(
    private ManageGoogleService: ManageGoogleService,
    private ManageMongoDB: ManageMongoDBService,
    private http: HttpClient,
    private route: ActivatedRoute,
    ) {}
 /** Set to true to enable verbose tracing. */
  private debug = false;

  configServer=new configServer;
  initConfigServer=new configServer;
  configServerChanges:number=0;
  isConfigServerRetrieved=signal<boolean>(false);
  identification=new LoginIdentif;
  ConvertUnit=new mainClassConv;
  ConvToDisplay=new mainConvItem;
  theTabOfUnits=new mainClassUnit;
  WeightRefTable=new mainRecordConvert;
  convertOnly:boolean=true;
  selHealthFunction:number=0;
  credentials = new classCredentials;
  credentialsFS = new classCredentials;
  credentialsMongo = new classCredentials;
  isCredentials:boolean=false;
  myParams={server:"", scope:"test", devMode:"", auth2Code:""};
  mainFunction:string="XMVWebSite";

  theForm: FormGroup = new FormGroup({ 
    userId: new FormControl({value:'', disabled:false}, { nonNullable: true }),
    psw: new FormControl({value:'', disabled:false}, { nonNullable: true }),
  });

  isNewUser:boolean=true;
  selectApps:number=0;
  dictionaryOnly:boolean=false;
  IpAddress:string="";
  bearerAuthorisation:string="";
  theNumber:string="";
  isIdRetrieved=signal<boolean>(false);
  saveServerUsrId:number=0;
  inputSelect:number=0;
  isAppsSelected:boolean=false;
  errorMsg=signal<string>("");
  isResetServer:boolean=false;
  keys: Array<string>=[];
  @Input() LoginTable_User_Data:Array<EventAug>=[];
  @Input() LoginTable_DecryptPSW:Array<string>=[];
  @Input() id!:string;

  inData=new classAccessFile;
  tabServers: Array<string> = [
    'http://localhost:8080', 'https://xmv-it-consulting.uc.r.appspot.com','https://test-server-359505.uc.r.appspot.com',
     'https://serverfs.ue.r.appspot.com', "http://localhost:3000"
  ]
  passInit:number=0;
  saveGoogleServer:string="";

  nameRetrievedFile:string="";

  // development Mode
  devMode:string="";
  currentFunction:string="";
  theFn:string="Config";
  errConfig=signal<string>("");

  isValidateId:boolean=false;
  isCallUserFunction:boolean=false;

  ngOnInit(){
   // const snapshotParam = this.route.snapshot.paramMap.get("server");
   // this.log('snapshotParam=' + JSON.stringify(snapshotParam))

  // http://localhost:4200/?server=8080&scope=test 
   // http://localhost:4200/?server=XMV&scope=prod 
   // devMode=local

  this.initConfigServer.googleServer=this.tabServers[2];     //this.tabServers[1]; 
  this.initConfigServer.mongoServer=this.tabServers[2];      //this.tabServers[1];
  this.initConfigServer.fileSystemServer=this.tabServers[2]; // this.tabServers[2];


  this.route.queryParams.subscribe(params => {
    this.log(JSON.stringify(params));
    if (params['server']!==undefined ){
          this.myParams.server = params['server'];
          var i= 0;
          switch (this.myParams.server){
            case ("8080"): i=0; break;
            case ("google"): i=1; break;
            case ("test"): i=2; break;
            case ("fsys"): i=3; break;
          }
          this.initConfigServer.googleServer=this.tabServers[i];
          this.initConfigServer.mongoServer=this.tabServers[i];
          this.initConfigServer.fileSystemServer=this.tabServers[i];
    }
    if (params['devMode']!==undefined ){
      this.myParams.devMode = params['devMode'];
      this.devMode = this.myParams.devMode;
    }
    if (params['scope']!==undefined){
      this.myParams.scope = params['scope'];
    }
  })
  this.currentFunction="retrieveConfig";
  if (this.passInit===0 && this.devMode!=="local"){ 
      this.http.get<any>('https://jsonip.com').subscribe( 
          (data) => {
            this.log('ip address (jsonip) = ', data.ip);
            this.IpAddress = data.ip
          }, 
          (err) => {
              this.findIpAddress();
          });
          
      this.RetrieveConfig();
      this.log('isIdRetrieved='+this.isIdRetrieved());   
      this.log('isCallUserFunction='+this.isCallUserFunction);  
      this.log('devMode='+this.devMode);     
      this.passInit++
    }
  }

      // this is for allFunctions only so that test BackendServer is used
  findIpAddress(){
    this.http.get("http://api.ipify.org/?format=json").subscribe(
      res=>{
          this.IpAddress = JSON.stringify(res);
          this.log('ip address (pi.ipify.org)'+ this.IpAddress);
      }, 
      err=> {this.log("issue to retrieve ipAddress" + err)}
    )
  }

  getServerNames(event:any){
    this.initConfigServer.googleServer=event.google;;
    this.initConfigServer.mongoServer=event.mongo;
    this.initConfigServer.fileSystemServer=event.fileSystem;
    this.configServer.googleServer = this.initConfigServer.googleServer;
    this.configServer.mongoServer = this.initConfigServer.mongoServer;
    this.configServer.fileSystemServer = this.initConfigServer.fileSystemServer;
    this.configServerChanges++;
  } 
  
  RetrieveConfig(){
    this.log('RetrieveConfig()');
    var test_prod='';
    this.errConfig.set("");

    if (this.myParams.scope==="prod"){
        test_prod='prod';
    } else {
        test_prod='test';
    }
      
    this.initConfigServer.test_prod=test_prod; // retrieve the corresponding record test or production
    this.initConfigServer.GoogleProjectId='ConfigDB';
    this.currentFunction="retrieveConfig";
    
    this.ManageMongoDB.findConfig(this.initConfigServer, 'configServer')
     // this.ManageMongoDB.findConfigbyURL(this.initConfigServer, 'configServer', '')
      .subscribe(
        data => {
         // test if data is an array if (Array.isArray(data)===true){}
         //     this.configServer=data[0];
  
          this.onReturnConfig(data,test_prod);
        //this.configServer.project=this.initConfigServer.project;
          //this.getTokenOAuth2();
          if (this.credentials.access_token===""){
            this.getServerUsrId('Google');
            this.log('retrieve config Google');
        }  
        if (this.credentialsMongo.access_token===""){
            this.getServerUsrId('Mongo');
            this.log('retrieve config Mongo');
        }  
        if (this.credentialsFS.access_token===""){
            this.getServerUsrId('FS');
            this.log('retrieve config FS');
        } 
        
        
        },
        error => {
          this.log('error to retrieve the configuration file ;  error = ', error);
        });
  }

  callUserFunction(event:any){
    if (this.configServer.userLogin.id!==''){
      this.isIdRetrieved.set(true);
    }
      this.isCallUserFunction=event;
    this.log('this.isIdRetrieved()='+this.isIdRetrieved());
    this.log('this.isCallUserFunction'+this.isCallUserFunction);
  }

  TheIdentifObject(event:any){
    this.identification=event;
    // this.log(this.identif);
  }

  onReturnConfig(data:any,test_prod:string){
    this.errConfig.set("");
    if (Array.isArray(data) === false){
     // if (this.devMode==="local"){
        if (typeof data === "string") {
          if (data.indexOf('\n')>-1){
            while (data.indexOf('\n')>-1){
              var i=data.indexOf('\n');
              data=data.substring(0,i) + data.substring(i+1);
          }
          var myData=JSON.parse(data);
          }
        } else { myData=data;}
     // }
    }       
    if (Array.isArray(myData) === true){
      if (myData[0].project!==undefined){
          for (let i=0; i<myData.length; i++){
            if (myData[i].title==="configServer" && myData[i].test_prod===test_prod){
                this.configServer = fillConfig(myData[i]);
                this.credentials.userServerId=1;
            } 
          } 
      } else {
          this.errConfig.set(this.nameRetrievedFile + " = wrong file retrieved; retry");
      }
    } else   if (typeof data === "object" && data.title!==undefined){ //it's an object
        this.configServer = fillConfig(data);
        this.credentials.userServerId=1;
    } else {
        this.errConfig.set(this.nameRetrievedFile + " = wrong file retrieved; retry");
    }

    if (this.errConfig()===""){
      this.configServer.googleServer = this.initConfigServer.googleServer;
      this.configServer.mongoServer = this.initConfigServer.mongoServer;
      this.configServer.fileSystemServer = this.initConfigServer.fileSystemServer;
      this.configServer.IpAddress=this.IpAddress;
      this.configServer.test_prod= this.initConfigServer.test_prod;
      
      this.configServer.devMode=this.devMode;
      this.saveGoogleServer = this.configServer.googleServer;
     
      this.isConfigServerRetrieved.set(true); // UI updates correctly now
      this.configServer.project=this.mainFunction;
     
      this.currentFunction="getLogin";
      this.theFn="Login";
      //=============
      //this.configServer.timeoutFileSystem.userTimeOut.mn=10;
      //this.configServer.timeoutFileSystem.userTimeOut.ss=20;
    }

  }

  open(event: Event) { // used to upload file

    if (event.target instanceof HTMLInputElement && event.target.files!==undefined && event.target.files!==null && event.target.files.length > 0) {
      const reader = new FileReader();
      this.nameRetrievedFile=event.target.files[0].name;
      reader.onloadend = () => {
          switch (this.currentFunction){
              case ("retrieveConfig"): this.onReturnConfig(reader.result as string,"test"); break;
              case ("getLogin"): this.onLocalGetLogin(reader.result as string); break;
          }
        };
        reader.readAsText(event.target.files[0]);
      }
    }


  getCredentialsFS(){
    const theServer='fileSystem';
    this.ManageGoogleService.getFSCredentials(this.configServer)
        .subscribe(
            (data ) => {
              this.credentialsFS.creationDate = data.credentials.creationDate;
              this.credentialsFS.userServerId = data.credentials.userServerId
              this.log('getCredentials server='+theServer +' '+JSON.stringify(data));
            },
            err => {
              this.log("return from getCredentials() for server '" + theServer + "' with error = "+ err.status);
            });
    }
  

  getServerUsrId(serverType:any){
    this.log('getServerUsrId()');
    
    switch (serverType){
      case ('Google'): this.saveGoogleServer=this.configServer.googleServer; break;
      case ('Mongo'): this.configServer.googleServer = this.configServer.mongoServer; break;
      case('FS'): this.configServer.googleServer = this.configServer.fileSystemServer; break;
    }

    this.ManageGoogleService.getNewServerUsrId (this.configServer )
      .subscribe(
          (data ) => {
            switch (data){
              case ('Google'): this.credentials = fillCredentials(data.credentials); break;
              case ('Mongo'): this.credentialsMongo = fillCredentials(data.credentials); break;
              case ('FS'): this.credentialsFS = fillCredentials(data.credentials); break;
            }
            this.configServer.googleServer = this.saveGoogleServer;
            this.isCredentials=true;
          },
          err => {
            this.log('return from requestToken() with error = '+ JSON.stringify(err));
            this.errorMsg.set("error with getNewServerUsrId");
          });
    }
  
  assignNewServerUsrId(){
    this.ManageGoogleService.getNewServerUsrId(this.configServer)
    .subscribe(
        (data ) => {
            this.credentials.userServerId=data.credentials.userServerId;
            this.saveServerUsrId=data.credentials.userServerId;
          },
          err => {

          }
    )
  }

  onInput(event:any){
      this.inputSelect=Number(event.target.value);
      this.selectApps=0;
      this.selHealthFunction=0;
      this.dictionaryOnly=false;
      this.isAppsSelected=false;
  }

  onSelectApps(){
    this.isAppsSelected=true;
    this.selectApps=this.inputSelect;
    switch (this.selectApps){
      case 11:this.selHealthFunction=5; break;
      case 12:this.selHealthFunction=3; break;
      case 13:this.selHealthFunction=5; break;
      case 15:this.dictionaryOnly=true; break;
      default: {this.selHealthFunction=0;}
    }
  }

  changeServerName(event:any){
    this.getServerUsrId(event);
  }
    

  fnResetServer(){
  }

  fnNewCredentials(credentials:any){
    this.isResetServer=true;
    this.credentials=credentials;
  }

  validateIdentification(){
    this.isValidateId=true;
    this.errorMsg.set("");
    if (this.theForm.controls['userId'].value !== '' && this.theForm.controls['psw'].value !== '' ){
      if (this.isCredentials===true){
        this.checkLogin(this.theForm.controls['userId'].value,this.theForm.controls['psw'].value);
      }
      else {
          this.errorMsg.set("Configuration file not completely processed yet; submit again");
      }
    } else {
      this.errorMsg.set("Fill-in both fields");
    }
  }

  clearForm(){
    this.theForm.controls['userId'].setValue('');
    this.theForm.controls['psw'].setValue('');
  }

  ReceiveFiles(event:any){
    this.log('receive file ' + event.fileType);
    if (event.fileType===''){return;}
    switch (event.fileType){
      case this.identification.configFitness.fileType.convertUnit: this.ConvertUnit=event; break;
      case this.identification.configFitness.fileType.convToDisplay: this.ConvToDisplay=event; break;
      case this.identification.configFitness.fileType.tabOfUnits:this.theTabOfUnits=event; break;
      case this.identification.configFitness.fileType.weightReference:this.WeightRefTable=event; break;
    }

  }

  onLocalGetLogin(data:any){
    this.currentFunction="";
    this .errConfig.set("");
    var myData=JSON.parse(data);
    if (myData.UserId!==undefined){
      this.identification=myData;
      this.configServer.userLogin.id=this.identification.UserId;
      this.configServer.userLogin.psw="";
      if (this.identification.UserId==="XMV-IT Admin"){
        this.configServer.userLogin.accessLevel="Very High";
      } else {
        this.configServer.userLogin.accessLevel="Low";
      }
      this.isIdRetrieved.set(true);
      this.log('isIdRetrieved='+this.isIdRetrieved());
      this.currentFunction="";
    } else {
      this .errConfig.set(this.nameRetrievedFile + " does not correspond to a login file; retry");
    }
  }

  checkLogin(userId:string,psw:string){
    this.currentFunction="";
    this.theFn="";
    this.errorMsg.set("retrieving your information .... is in progress");
    this.configServer.userLogin.id=userId;
    this.configServer.userLogin.psw=psw;
    this.configServer.userLogin.accessLevel="";
    this.ManageGoogleService.checkLogin(this.configServer)
        .subscribe((data ) => {    
            if (data.status===undefined){ 
              //this.getUserAccessLevel();
              this.identification=data;
              this.configServer.userLogin.accessLevel=this.identification.secLevel;
              this.identification.secLevel="";
              this.isIdRetrieved.set(true);
              this.isValidateId=false;
              this.identification.userServerId=this.credentialsFS.userServerId;
              this.identification.credentialDate=this.credentialsFS.creationDate;
              this.identification.IpAddress=this.configServer.IpAddress;
              this.errorMsg.set("");
              this.log("isResetServer= "+this.isResetServer + "  isIdRetrieved=" + this.isIdRetrieved() )
            } else {
              this.errorMsg.set(data.msg);
              this.isValidateId=false;
            }
        //
      },
        err=> {
          this.log('error to checkLogin - error status=' + err.status + ' '+ err.message );
          this.errorMsg.set("Identification failed; update the fields");
          this.isValidateId=false;
        })
  }

  getFileContentHTTP(bucket:any, object:any){
    const theBearer = 'Bearer ' +    this.credentials.access_token;
    const theHeaders = new HttpHeaders( { 'Authorization': theBearer,
              'Content-Type' : 'application/json', "Accept": "application/json",  }  );
    const HTTP_Address='https://storage.googleapis.com/download/storage/v1/b/' + bucket + '/o/' + object +'?alt=media' ;
    //const HTTP_Address='https://storage.googleapis.com/storage/v1/b/' + bucket + '/o' + object +'?alt=media&name=' ;
    this.http.get(HTTP_Address,  {headers: theHeaders})
          .subscribe((data ) => {  
            this.log(JSON.stringify(data)); 
          },
            err => {
                this.log('File not retrieved ' + err.status  );
                if ( err.error!==undefined ){
                    this.log('Error = ' + ' ' + err.error.error.code  + ' ' + err.error.error.message)
                }
                this.errorMsg.set('File not retrieved ' + err.status );
              });
  }  

  private log(...args: unknown[]) {
    if (this.debug) console.log('[app.component:]', ...args);
  }
}

