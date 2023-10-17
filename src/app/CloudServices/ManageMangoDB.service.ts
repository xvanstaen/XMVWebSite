import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient,  HttpErrorResponse } from '@angular/common/http';
import { configServer } from '../JsonServerClass';

@Injectable({
  providedIn: 'root'
})
export class ManageMangoDBService {
   
  constructor(private   http: HttpClient) { }

  
  findConfig(configServer:configServer,Collection:string ): Observable<any> {
    const http_get=configServer.baseUrl+'/config/'+configServer.GoogleProjectId+'/'+configServer.test_prod+'/'+Collection;
    return this.http.get<any>(http_get); 
  }

  findConfigbyString(configServer:configServer,Collection:string,searchString: any ): Observable<any> {
    return this.http.get<any>(`${configServer.baseUrl}/config/${configServer.GoogleProjectId}/${configServer.test_prod}/${Collection}?searchString=${searchString}`);
  }

  resetConfig(configServer:configServer,Collection:string ): Observable<any> {
    const http_get=configServer.baseUrl+'/resetConfig/'+configServer.GoogleProjectId+'/'+configServer.test_prod+'/'+Collection;
    return this.http.get<any>(http_get); 
  }


}