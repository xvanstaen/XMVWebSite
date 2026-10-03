import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { Inject,Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { HttpClient, provideHttpClient, HttpRequest, HttpEvent,  HttpErrorResponse, HttpHeaders, HttpContext } from '@angular/common/http';
import { configServer, LoginIdentif, classUserLogin } from '../JsonServerClass';
import { classFileSystem, classAccessFile }  from '../classFileSystem';

@Injectable({
  providedIn: 'root',
})


export class ManageSecuredGoogleService {
    
    constructor(
        private   http: HttpClient,
       ) {}
       
    resetFS(config:configServer, bucket:string, object:string, tabLock:Array<classAccessFile>, iWait:number): Observable<any> {
        const http_get=config.fileSystemServer+'/resetFS/'+config.userLogin.id+'/'+config.GoogleProjectId+'/'+config.test_prod+'/'+object+'/'+iWait;
        const params = new HttpParams()
            .set ('userPSW', config.userLogin.psw)
            .set ('bucket', bucket)
            .set ('tablock', JSON.stringify(tabLock))
            .set('server', config.fileSystemServer);
        return this.http.get<any>(http_get, {params}); 
        // return this.http.get<any>(http_get);                       
    }

    getMemoryFS(config:configServer): Observable<any> {
        const http_get=config.fileSystemServer+'/memoryFS/'+config.userLogin.id+'/'+config.GoogleProjectId+'/'+config.test_prod;
        const params = new HttpParams()
            .set ('userPSW', config.userLogin.psw)
            .set('server', config.fileSystemServer);
        return this.http.get<any>(http_get, {params}); 
        //return this.http.get<any>(http_get);                       
    }

    getTokenOAuth2(config:configServer,reDirect:any): Observable<any> {
        const http_get=config.googleServer+'/requestTokenOAuth2/' + config.GoogleProjectId+'/'+config.test_prod;
        const params = new HttpParams()
            .set('reDirect', reDirect);
        return this.http.get<any>(http_get, {params});   
        //return this.http.get<any>(http_get);                       
    }   
    getRefreshToken(config:configServer,reDirect:any): Observable<any> {
        const http_get=config.googleServer+'/refreshToken/'+config.userLogin.id+'/'+config.test_prod;
        const params = new HttpParams()
            .set('reDirect', reDirect);
        return this.http.get<any>(http_get, {params});   
        //return this.http.get<any>(http_get);                       
    }   
    getTokenOAuth2OLD(config:configServer): Observable<any> {
        const http_get=config.googleServer+'/requestTokenOAuth2/'+config.userLogin.id+'/'+config.GoogleProjectId+'/'+config.test_prod;
        const params = new HttpParams()
            .set('userPSW', config.userLogin.psw);
        return this.http.get<any>(http_get, {params});   
        //return this.http.get<any>(http_get);                       
    } 
    
    getRefreshTokenOLD(config:configServer): Observable<any> {
        const http_get=config.googleServer+'/refreshToken/'+config.userLogin.id+'/'+config.GoogleProjectId+'/'+config.test_prod;
        const params = new HttpParams()
            .set('userPSW', config.userLogin.psw);
        return this.http.get<any>(http_get, {params});   
        //return this.http.get<any>(http_get);                      
    }   
 
    revokeToken(config:configServer): Observable<any> {
        const http_get=config.googleServer+'/revokeToken/'+config.userLogin.id+'/'+config.GoogleProjectId+'/'+config.test_prod;
        const params = new HttpParams()
            .set('userPSW', config.userLogin.psw);
        return this.http.get<any>(http_get, {params});   
        //return this.http.get<any>(http_get);                       
    }  

    getInfoToken(config:configServer,accessToken:string): Observable<any> {
        const http_get=config.googleServer+'/checkAccessToken/'+config.userLogin.id+'/'+config.GoogleProjectId+'/'+config.test_prod+'/'+accessToken;
        const params = new HttpParams()
            .set('userPSW', config.userLogin.psw);
        return this.http.get<any>(http_get, {params});   
        //return this.http.get<any>(http_get);                    
    }  

    encryptFn(config:configServer,data:string,key:number,method:string,iFour:number,authoriz:string): Observable<any> {
        //const myArray=encodeURIComponent(JSON.stringify(TableCryptKey.tab));
        const http_get=config.googleServer+'/encryptFn/'+config.userLogin.id+'/'+config.GoogleProjectId+'/'+config.test_prod+'/'+key.toString()+'/'+method+'/'+iFour+'/'+authoriz;
        const params = new HttpParams()
            .set('userPSW', config.userLogin.psw)
            .set('inData', data);
        return this.http.get<any>(http_get, {params});   
        //return this.http.get<any>(http_get);                      
    }  

    decryptFn(config:configServer,data:string,key:number,method:string,iFour:number,authoriz:string): Observable<any> {
        const http_get=config.googleServer+'/decryptFn/'+config.userLogin.id+'/'+config.GoogleProjectId+'/'+config.test_prod+'/'+key.toString()+'/'+method+'/'+iFour+'/'+authoriz;
        const params = new HttpParams()
            .set('userPSW', config.userLogin.psw)
            .set('inData', data);
        return this.http.get<any>(http_get, {params});   
        //return this.http.get<any>(http_get);                 
    }  

    resetCacheFile(config:configServer,fileName:string): Observable<any> {
        const http_get=config.googleServer+'/resetCacheFile/'+config.userLogin.id+'/'+config.GoogleProjectId+'/'+config.test_prod+'/'+fileName;
        const params = new HttpParams()
            .set('userPSW', config.userLogin.psw);
        return this.http.get<any>(http_get, {params});   
        //return this.http.get<any>(http_get);                     
    }
    
    reloadCacheFile(config:configServer): Observable<any> {
        const http_get=config.googleServer+'/reloadCacheFile/'+config.userLogin.id+'/'+config.GoogleProjectId+'/'+config.test_prod;
        const params = new HttpParams()
            .set('userPSW', config.userLogin.psw);
        return this.http.get<any>(http_get, {params});   
        //return this.http.get<any>(http_get);                     
    }
    
    getCacheFile(config:configServer): Observable<any> {
        const http_get=config.googleServer+'/getCacheFile/'+config.userLogin.id+'/'+config.GoogleProjectId+'/'+config.test_prod;
        const params = new HttpParams()
            .set('userPSW', config.userLogin.psw);
        return this.http.get<any>(http_get, {params});   
        //return this.http.get<any>(http_get);                         
    }
        
    insertCacheFile(config:configServer,object:string): Observable<any> {
        const http_get=config.googleServer+'/insertCacheFile/'+config.userLogin.id+'/'+config.GoogleProjectId+'/'+config.test_prod+'/'+object;
        const params = new HttpParams()
            .set('userPSW', config.userLogin.psw);
        return this.http.get<any>(http_get, {params});   
        //return this.http.get<any>(http_get);                        
    }

    getCacheConsole(config:configServer): Observable<any> {
        const http_get=config.googleServer+'/getCacheConsole/'+config.userLogin.id+'/'+config.GoogleProjectId+'/'+config.test_prod;
        const params = new HttpParams()
            .set('userPSW', config.userLogin.psw);
        return this.http.get<any>(http_get, {params});   
        //return this.http.get<any>(http_get);                       
    }

    resetCacheConsole(config:configServer): Observable<any> {
        const http_get=config.googleServer+'/resetCacheConsole/'+config.userLogin.id+'/'+config.GoogleProjectId+'/'+config.test_prod;
        const params = new HttpParams()
            .set('userPSW', config.userLogin.psw);
        return this.http.get<any>(http_get, {params});   
        //return this.http.get<any>(http_get);                         
    }

    enableCacheConsole(config:configServer): Observable<any> {
        const http_get=config.googleServer+'/enableCacheConsole/'+config.userLogin.id+'/'+config.GoogleProjectId+'/'+config.test_prod;
        const params = new HttpParams()
            .set('userPSW', config.userLogin.psw);
        return this.http.get<any>(http_get, {params});   
        //return this.http.get<any>(http_get);                      
    }
    disableCacheConsole(config:configServer): Observable<any> {
        const http_get=config.googleServer+'/disableCacheConsole/'+config.userLogin.id+'/'+config.GoogleProjectId+'/'+config.test_prod;
        const params = new HttpParams()
            .set('userPSW', config.userLogin.psw);
        return this.http.get<any>(http_get, {params});   
        //return this.http.get<any>(http_get);                         
    }

}
