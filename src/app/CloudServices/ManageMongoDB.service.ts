import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { HttpClient,  HttpErrorResponse } from '@angular/common/http';
import { configServer } from '../JsonServerClass';

@Injectable({
  providedIn: 'root'
})


export class ManageMongoDBService {
   
  constructor(private   http: HttpClient) { }


  findConfig(configServer:configServer,collection:string ): Observable<any> {
    const http_get=configServer.mongoServer+'/findConfig/ConfigDB/'+configServer.test_prod+'/'+collection;
    return this.http.get<any>(http_get); 
  }

  findConfigByString(configServer:configServer,collection:string,searchBucket:string,searchString: any ): Observable<any> {
    return this.http.get<any>(`${configServer.mongoServer}/findConfigByString/ConfigDB/${configServer.test_prod}/${collection}/${searchBucket}?searchString=${searchString}`);
  } 

  findAllConfig(configServer:configServer,collection:string ): Observable<any> {
    const http_get=configServer.mongoServer+'/findAllConfig/ConfigDB/'+configServer.test_prod+'/'+collection;
    return this.http.get<any>(http_get);  // cache is not used
  }

  updateConfig(configServer:configServer,collection:string,id:string,record:any ): Observable<any> {
    const http_get=configServer.mongoServer+'/updateConfig/'+configServer.userLogin.id+'/ConfigDB/'+configServer.test_prod+'/'+collection+'/'+id;
    const params = new HttpParams()
            .set ('userPSW', configServer.userLogin.psw);
    return this.http.get<any>(http_get, {params}); 
  }
  uploadConfig(configServer:configServer,collection:string,record:any ): Observable<any> {
    const http_get=configServer.mongoServer+'/uploadConfig/'+configServer.userLogin.id+'/ConfigDB/'+configServer.test_prod+'/'+collection;
    const params = new HttpParams()
            .set ('userPSW', configServer.userLogin.psw);
    return this.http.get<any>(http_get, {params}); 
  }
  delConfigById(configServer:configServer, collection:string,id: any): Observable<any> {
    const http_get=configServer.mongoServer+'/delConfigById/'+configServer.userLogin.id+'/ConfigDB/'+configServer.test_prod+'/'+collection+'/'+id;
    const params = new HttpParams()
            .set ('userPSW', configServer.userLogin.psw);
    return this.http.get<any>(http_get, {params}); 
  }

  resetCacheConfig(configServer:configServer,collection:string ): Observable<any> {
    const http_get=configServer.mongoServer+'/resetConfig/'+configServer.userLogin.id+'/ConfigDB/'+configServer.test_prod+'/'+collection;
    const params = new HttpParams()
            .set ('userPSW', configServer.userLogin.psw);
    return this.http.get<any>(http_get, {params}); 
    //return this.http.get<any>(http_get); 
  }


}