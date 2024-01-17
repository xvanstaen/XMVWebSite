import { Component } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { ManageMongoDBService } from 'src/app/CloudServices/ManageMongoDB.service';
import { configServer, classCredentials } from './JsonServerClass';
import { environment } from 'src/environments/environment';
import { fillConfig, fillCredentials } from './copyFilesFunction';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(
    private ManageGoogleService: ManageGoogleService,
    private ManageMongoDB: ManageMongoDBService,
    private http: HttpClient,
    ) {}
      // import configuration files
      // access MongoDB

  tabServers: Array<string> = [
    'http://localhost:8080', 'https://test-server-359505.uc.r.appspot.com',
    'https://xmv-it-consulting.uc.r.appspot.com', 'https://serverfs.ue.r.appspot.com'
  ]

  configServer=new configServer;
  initConfigServer=new configServer;
  configServerChanges:number=0;

  IpAddress:string="";
  isConfigServerRetrieved:boolean=false;
  credentials = new classCredentials;
  credentialsFS = new classCredentials;
  credentialsMongo = new classCredentials;
  isCredentials:boolean=false;

  isNewUser:boolean=true;
  isResetServer:boolean=false;
  isIdRetrieved:boolean=false;
  saveServerUsrId:number=0;

  ngOnInit(){
    this.http.get("http://api.ipify.org/?format=json").subscribe((res:any)=>{
      this.IpAddress = res.ip;
    });
    this.initConfigServer.googleServer=this.tabServers[2];
    this.initConfigServer.mongoServer=this.tabServers[3];
    this.initConfigServer.fileSystemServer=this.tabServers[1];
    this.RetrieveConfig();
  }
  
  RetrieveConfig(){
    
      if (environment.production === false){
        this.initConfigServer.test_prod='test';
     } else {
      this.initConfigServer.test_prod='prod';
     }
      
      //InitconfigServer.GoogleProjectId='ConfigDB';
      this.ManageMongoDB.findConfig(this.initConfigServer, 'configServer')
      .subscribe(
        data => {

          if (Array.isArray(data) === false){
            this.configServer = fillConfig(data);
            //this.configServer = data;
          } else {
            for (let i=0; i<data.length; i++){
                if (data[i].title==="configServer" && data[i].test_prod===this.initConfigServer.test_prod){
                  this.configServer = fillConfig(data[i]);
                  // this.configServer = data[i];
                } 
              }
          }
          this.configServer.IpAddress=this.IpAddress;
          this.configServer.project="XMVWebSite";

          console.log('configServer is retrieved');
              //this.getTokenOAuth2();
          if (this.credentials.access_token===""){
              this.getDefaultCredentials('Google');
          }  if (this.credentials.access_token===""){
              this.getDefaultCredentials('Mongo');
          }  if (this.credentials.access_token===""){
              this.getDefaultCredentials('FS');
          } 
        if (this.isNewUser===true){
            this.assignNewServerUsrId();
            this.isNewUser=false;
          }
        this.isConfigServerRetrieved=true;
        },
        error => {
          console.log('error to retrieve the configuration file ;  error = ', error.status);
         
        });
  }

  getDefaultCredentials(serverType:any){
    console.log('getDefaultCredentials()');
    this.ManageGoogleService.getDefaultCredentials(this.configServer  )
    .subscribe(
        (data ) => {
          if (serverType==='Google'){
            this.credentials = fillCredentials(data);
          } else if (serverType==='Mongo'){
              this.credentialsMongo = fillCredentials(data);
          } else if (serverType==='mongo'){
              this.credentialsFS = fillCredentials(data);
          }
          this.isCredentials=true;

        },
        err => {
          console.log('return from requestToken() with error = '+ JSON.stringify(err));
          });
  }

  fnResetServer(event:any){
    this.isCredentials=false;
    this.isResetServer=true;
    this.isIdRetrieved=false;
    this.getDefaultCredentials(event);
    this.assignNewServerUsrId();
  }

  fnNewCredentials(credentials:any){
    this.isResetServer=true;
    this.credentials=credentials;
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


}

