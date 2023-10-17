import { Injectable } from '@angular/core';
import { HttpClient,  HttpErrorResponse } from '@angular/common/http';
// configServer is needed to use ManageGoogleService
// it is stored in MangoDB and accessed via ManageMangoDBService
import { configServer } from '../JsonServerClass';
import { environment } from 'src/environments/environment';

import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

// ******* UNABLE TO RETURN THE DATA - THIS SERVICE SHOULD BE AN OBSERVABLE ********

export class AccessConfigService {

  constructor(  private ManageMangoDBService: ManageMangoDBService,
                private   http: HttpClient,
              ) { }
  configServer=new configServer;

//getConfig():Observable<configServer>{
  getConfig(){
  var test_prod='prod';
  //this.configServer.baseUrl='https://localhost:8080';
  this.configServer.baseUrl='https://test-server-359505.uc.r.appspot.com';
  
  this.configServer.GoogleProjectId='ConfigDB';
  this.ManageMangoDBService.findConfigbyString(this.configServer, 'configServer', '')
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
            
        } 

    }
    // return this.http.get<any>(`${this.configServer}`);
    return this.configServer;

    },
    error => {
      console.log('error to retrieve the configuration file ;  error = ', error.status);
      this.configServer.title='ERROR SERVER, status='+error.status;
      //return this.http.get<any>(`${this.configServer}`);
      return this.configServer;
    });

  }

}


