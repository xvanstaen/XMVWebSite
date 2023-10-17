import { Component } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';
import { configServer, classCredentials } from './JsonServerClass';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(
    private ManageGoogleService: ManageGoogleService,
    private ManageMangoDB: ManageMangoDBService,
    private http: HttpClient,
    ) {}
      // import configuration files
      // access MongoDB

  configServer=new configServer;
  IpAddress:string="";
  isConfigServerRetrieved:boolean=false;
  credentials = new classCredentials;
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
      
      InitconfigServer.baseUrl='https://test-server-359505.uc.r.appspot.com';

// InitconfigServer.baseUrl='http://localhost:8080'; // TO BE DELETED

      InitconfigServer.test_prod=test_prod;
      InitconfigServer.GoogleProjectId='ConfigDB';
      this.ManageMangoDB.findConfig(InitconfigServer, 'configServer')
      .subscribe(
        data => {
         // test if data is an array if (Array.isArray(data)===true){}
         //     this.configServer=data[0];
       

        
          if (Array.isArray(data) === false){
            this.configServer = data;
          } else {

  
            for (let i=0; i<data.length; i++){
                if (data[i].title==="configServer" && data[i].test_prod===test_prod){
                    this.configServer = data[i];
                } }
              }
          this.configServer.IpAddress=this.IpAddress;
  // this.configServer.baseUrl='http://localhost:8080';  // TO BE DELETED
          console.log('configServer is retrieved');
              //this.getTokenOAuth2();
          if (this.credentials.access_token===""){
              this.getDefaultCredentials();
              } 
        this.isConfigServerRetrieved=true;
        },
        error => {
          console.log('error to retrieve the configuration file ;  error = ', error.status);
         
        });
  }

  getDefaultCredentials(){
    console.log('getDefaultCredentials()');
    this.ManageGoogleService.getDefaultCredentials(this.configServer  )
    .subscribe(
        (data ) => {
          this.credentials.access_token=data.credentials.access_token;
          this.credentials.id_token=data.credentials.id_token
          this.credentials.refresh_token=data.credentials.refresh_token
          this.credentials.token_type=data.credentials.token_type;
          this.credentials.userServerId=data.credentials.userServerId;
          this.credentials.creationDate=data.credentials.creationDate;
          // this.getInfoToken(); // this is a test
          this.isCredentials=true;

        },
        err => {
          console.log('return from requestToken() with error = '+ JSON.stringify(err));
          });
  }

  fnResetServer(){
    this.isCredentials=false;

    //this.isResetServer=true;
    //this.isIdRetrieved=false;

    this.getDefaultCredentials();
  }

  fnNewCredentials(credentials:any){
    //this.isCredentials=false;
    //this.isResetServer=true;
    //this.isIdRetrieved=false;

    this.credentials=credentials;
  }


}

