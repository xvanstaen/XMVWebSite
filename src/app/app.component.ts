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

  configServer=new configServer;
  IpAddress:string="";
  isConfigServerRetrieved:boolean=false;
  credentials = new classCredentials;
  credentialsFS = new classCredentials;
  credentialsMongo = new classCredentials;
  isCredentials:boolean=false;

  ngOnInit(){
    this.http.get("http://api.ipify.org/?format=json").subscribe((res:any)=>{
      this.IpAddress = res.ip;
    });
      this.RetrieveConfig();
  }
  
  RetrieveConfig(){
      var test_prod='prod';
      if (environment.production === false){
        test_prod='test';
     }
      const InitconfigServer=new configServer;
      
      InitconfigServer.googleServer='https://xmv-it-consulting.uc.r.appspot.com';
      InitconfigServer.mongoServer='https://test-server-359505.uc.r.appspot.com';
      InitconfigServer.fileSystemServer=='https://serverfs.ue.r.appspot.com/'
      // "https://xmv-it-consulting.uc.r.appspot.com"
      // 'https://test-server-359505.uc.r.appspot.com'
      // 'http://localhost:8080'

      InitconfigServer.test_prod=test_prod;
      //InitconfigServer.GoogleProjectId='ConfigDB';
      this.ManageMongoDB.findConfig(InitconfigServer, 'configServer')
      .subscribe(
        data => {
         // test if data is an array if (Array.isArray(data)===true){}
         //     this.configServer=data[0];
       

        
          if (Array.isArray(data) === false){
            this.configServer = fillConfig(data);
            //this.configServer = data;
          } else {
            for (let i=0; i<data.length; i++){
                if (data[i].title==="configServer" && data[i].test_prod===test_prod){
                  this.configServer = fillConfig(data[i]);
                  // this.configServer = data[i];
                } 
              }
          }
          this.configServer.IpAddress=this.IpAddress;
          this.configServer.project="XMVWebSite";
//  this.configServer.baseUrl='http://localhost:8080';  // TO BE DELETED
          console.log('configServer is retrieved');
              //this.getTokenOAuth2();
          if (this.credentials.access_token===""){
              this.getDefaultCredentials('Google');
          }  if (this.credentials.access_token===""){
              this.getDefaultCredentials('Mongo');
          }  if (this.credentials.access_token===""){
              this.getDefaultCredentials('FS');
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

    //this.isResetServer=true;
    //this.isIdRetrieved=false;

    this.getDefaultCredentials(event);
  }

  fnNewCredentials(credentials:any){
    //this.isCredentials=false;
    //this.isResetServer=true;
    //this.isIdRetrieved=false;

    this.credentials=credentials;
  }


}

