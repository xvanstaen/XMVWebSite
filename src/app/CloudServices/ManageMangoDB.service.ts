import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient,  HttpErrorResponse } from '@angular/common/http';
import { configServer } from '../JsonServerClass';

@Injectable({
  providedIn: 'root'
})
export class ManageMangoDBService {
   
  constructor(private   http: HttpClient) { }

  
  findConfig(configServer:configServer,Collection:string,title: any ): Observable<any> {
    return this.http.get<any>(`${configServer.baseUrl}/config/${configServer.GoogleProjectId}/${Collection}`);
  }

  findConfigbyURL(configServer:configServer,Collection:string,searchString: any ): Observable<any> {
    return this.http.get<any>(`${configServer.baseUrl}/config/${configServer.GoogleProjectId}/${Collection}?baseUrl=${searchString}`);
  }


}