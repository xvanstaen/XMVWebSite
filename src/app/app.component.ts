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

  isRetrievedConfig:boolean=false;

  ngOnInit(){
    this.http.get("http://api.ipify.org/?format=json").subscribe((res:any)=>{
      this.IpAddress = res.ip;
    });
    this.initConfigServer.googleServer=this.tabServers[2];
    this.initConfigServer.mongoServer=this.tabServers[2];
    this.initConfigServer.fileSystemServer=this.tabServers[1];
    this.RetrieveConfig();
  }
  
  RetrieveConfig(){
    

    if (environment.production === false){
        this.initConfigServer.test_prod='test';
    } else {
      this.initConfigServer.test_prod='prod';
    }
    this.TabLoop[0]=0;
    this.EventHTTPReceived[0]=false;
    this.waitHTTP(this.TabLoop[0],2000,0);
    this.error="";
      //InitconfigServer.GoogleProjectId='ConfigDB';
    this.ManageMongoDB.findConfig(this.initConfigServer, 'configServer')
      .subscribe(
        data => {
          this.EventHTTPReceived[0]=true;
          this.isRetrievedConfig=true;
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
          this.EventHTTPReceived[0]=true;
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
          } else if (serverType==='FS'){
              this.credentialsFS = fillCredentials(data);
          }
          this.isCredentials=true;

        },
        err => {
          console.log('return from requestToken() with error = '+ JSON.stringify(err));
          });
  }
  error:string="";
  EventHTTPReceived:Array<boolean>=[];
  TabLoop:Array<number>=[];
  id_Animation:Array<any>=[];
  waitHTTP(loop: number, max_loop: number, eventNb: number) {
    const pas = 500;
    if (loop % pas === 0) {
      console.log(eventNb + ' waitHTTP fn  ==> loop=' + loop + ' max_loop=' + max_loop);
    }
    loop++
    this.TabLoop[eventNb]++

    this.id_Animation[eventNb] = window.requestAnimationFrame(() => this.waitHTTP(loop, max_loop, eventNb));
    if (loop > max_loop || this.EventHTTPReceived[eventNb] === true) {
      
      console.log(eventNb + ' exit waitHTTP ==> TabLoop[eventNb]=' + this.TabLoop[eventNb] + ' eventNb=' + eventNb + ' this.EventHTTPReceived=' +
        this.EventHTTPReceived[eventNb]);
      window.cancelAnimationFrame(this.id_Animation[eventNb]);
      if (loop > max_loop && this.EventHTTPReceived[eventNb] === false){
        this.error="MongoDB cannot be accessed"
      }
      //if (this.EventHTTPReceived[eventNb] === true) {
      //    window.cancelAnimationFrame(this.id_Animation[eventNb]);
      //}
    }
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

