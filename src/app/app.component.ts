import { Component } from '@angular/core';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';
import { configServer } from './JsonServerClass';
import { XMVConfig } from './JsonServerClass';
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
    ) {}
      // import configuration files
      // access MongoDB

  configServer=new configServer;
  XMVConfig=new XMVConfig;
  isConfigServerRetrieved:boolean=false;

  ngOnInit(){
      this.RetrieveConfig();
  }
  
  RetrieveConfig(){
      var test_prod='prod';
      const InitconfigServer=new configServer;
      InitconfigServer.baseUrl='https://localhost:8080';
      InitconfigServer.baseUrl='https://test-server-359505.uc.r.appspot.com';
      
      InitconfigServer.GoogleProjectId='ConfigDB';
      this.ManageMangoDB.findConfigbyURL(InitconfigServer, 'configServer', '')
      .subscribe(
        data => {
         // test if data is an array if (Array.isArray(data)===true){}
         //     this.configServer=data[0];
       
         if (environment.production === false){
            test_prod='test';
         }
        
        for (let i=0; i<data.length; i++){
            if (data[i].title==="configServer" && data[i].test_prod===test_prod){
                this.configServer = data[i];
            
            } else if (data[i].title==="configPhoto" && data[i].test_prod===test_prod){
                this.XMVConfig = data[i];
            }

        }
        this.isConfigServerRetrieved=true;
        },
        error => {
          console.log('error to retrieve the configuration file ;  error = ', error.status);
         
        });
  }
}

