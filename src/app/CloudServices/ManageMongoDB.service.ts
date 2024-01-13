import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
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
    const http_get=configServer.mongoServer+'/updateConfig/ConfigDB/'+configServer.test_prod+'/'+collection+'/'+id;
    return this.http.put<any>(http_get, record); 
  }
  uploadConfig(configServer:configServer,collection:string,record:any ): Observable<any> {
    const http_get=configServer.mongoServer+'/uploadConfig/ConfigDB/'+configServer.test_prod+'/'+collection;
    return this.http.put<any>(http_get,record); 
  }
  delConfigById(config:configServer, collection:string,id: any): Observable<any> {
    const http_get=config.mongoServer+'/delConfigById/ConfigDB/'+config.test_prod+'/'+collection+'/'+id;
    return this.http.get<any>(http_get); 
  }

  resetCacheConfig(configServer:configServer,collection:string ): Observable<any> {
    const http_get=configServer.mongoServer+'/resetConfig/ConfigDB/'+configServer.test_prod+'/'+collection;
    return this.http.get<any>(http_get); 
  }


}