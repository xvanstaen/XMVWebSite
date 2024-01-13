
import { Inject,Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

import { HttpClient, HttpRequest, HttpEvent,  HttpErrorResponse, HttpHeaders, HttpContext } from '@angular/common/http';
import { BioData } from '../JsonServerClass';
import { ThisReceiver } from '@angular/compiler';
import { configServer } from '../JsonServerClass';
import { classFileSystem, classAccessFile }  from 'src/app/classFileSystem';


@Injectable({
  providedIn: 'root',
})
export class ManageSecuredGoogleService {
    
    constructor(
        private   http: HttpClient,
       )
        {}
       
    myHeader=new HttpHeaders({'content-type': 'application/json',
    'cache-control': 'private, max-age=0',
    'Authorization': 'Bearer ya29.a0AbVbY6MILZfEfuz2p5TZVpC-H49MRTY1gpL6ooXilb3XX26y_DdKVfBxTNGBlosBpVclb_mfDubxk2vWMOUx3LBoG4SkZj1IXHwpgrU2nRNk3vQq1gsVXmcdaLGUXdPz9EicBXVvFS6F5SLtj8GA6E5KLmAMaCgYKAXYSARASFQFWKvPllv_18IAH9e7Y6c4HRJbQ8w0163'
    });


    resetFS(config:configServer, bucket:string, object:string, tabLock:Array<classAccessFile>, iWait:string): Observable<any> {
        const http_get=config.fileSystemServer+'/resetFS/'+config.GoogleProjectId+'/'+config.test_prod+'/'+object+'/'+JSON.stringify(tabLock)+'/'+iWait+'?bucket='+bucket;
        return this.http.get<any>(http_get);                       
    }

    getMemoryFS(config:configServer): Observable<any> {
        const http_get=config.fileSystemServer+'/memoryFS/'+config.GoogleProjectId+'/'+config.test_prod;
        return this.http.get<any>(http_get);                       
    }

    getTokenOAuth2(config:configServer): Observable<any> {
        const http_get=config.googleServer+'/requestTokenOAuth2/'+config.GoogleProjectId+'/'+config.test_prod;
        return this.http.get<any>(http_get);                      
    }   
    
    getRefreshToken(config:configServer): Observable<any> {
        const http_get=config.googleServer+'/refreshToken/'+config.GoogleProjectId+'/'+config.test_prod;
        return this.http.get<any>(http_get);                      
    }   
 
    revokeToken(config:configServer): Observable<any> {
        const http_get=config.googleServer+'/revokeToken/'+config.GoogleProjectId+'/'+config.test_prod;
        return this.http.get<any>(http_get);                      
    }  

    getInfoToken(config:configServer,accessToken:string): Observable<any> {
        const http_get=config.googleServer+'/checkAccessToken/'+config.GoogleProjectId+'/'+config.test_prod+'/'+accessToken;
        return this.http.get<any>(http_get);                      
    }  
    
    getCredentials(config:configServer,bucket:string,object:string): Observable<any> {
        const http_get=config.googleServer+'/getCredentials/'+config.GoogleProjectId+'/'+config.test_prod+'/'+object+'?bucket='+bucket;
        return this.http.get<any>(http_get);                      
    }  

    encryptFn(config:configServer,data:string,key:number,method:string,authoriz:string): Observable<any> {
        //const myArray=encodeURIComponent(JSON.stringify(TableCryptKey.tab));
        const http_get=config.googleServer+'/encryptFn/'+config.GoogleProjectId+'/'+config.test_prod+'/'+encodeURIComponent(data)+'/'+key.toString()+'/'+method+'/'+authoriz;
        return this.http.get<any>(http_get);                      
    }  

    decryptFn(config:configServer,data:string,key:number,method:string,authoriz:string): Observable<any> {
        const http_get=config.googleServer+'/decryptFn/'+config.GoogleProjectId+'/'+config.test_prod+'/'+encodeURIComponent(data)+'/'+key.toString()+'/'+method+'/'+authoriz;
      
        return this.http.get<any>(http_get);                      
    }  

    resetCacheFile(config:configServer,fileName:string): Observable<any> {
        const http_get=config.googleServer+'/resetCacheFile/'+config.GoogleProjectId+'/'+config.test_prod+'/'+fileName;
        return this.http.get<any>(http_get);                       
    }
    
    reloadCacheFile(config:configServer): Observable<any> {
        const http_get=config.googleServer+'/reloadCacheFile/'+config.GoogleProjectId+'/'+config.test_prod;
        return this.http.get<any>(http_get);                       
    }
    
    getCacheFile(config:configServer): Observable<any> {
        const http_get=config.googleServer+'/getCacheFile/'+config.GoogleProjectId+'/'+config.test_prod;
        return this.http.get<any>(http_get);                       
    }
        
    insertCacheFile(config:configServer,object:string): Observable<any> {
        const http_get=config.googleServer+'/insertCacheFile/'+config.GoogleProjectId+'/'+config.test_prod+'/'+object;
        return this.http.get<any>(http_get);                       
    }

    getCacheConsole(config:configServer): Observable<any> {
        const http_get=config.googleServer+'/getCacheConsole/'+config.GoogleProjectId+'/'+config.test_prod;
        return this.http.get<any>(http_get);                       
    }

    resetCacheConsole(config:configServer): Observable<any> {
        const http_get=config.googleServer+'/resetCacheConsole/'+config.GoogleProjectId+'/'+config.test_prod;
        return this.http.get<any>(http_get);                       
    }

    
}
