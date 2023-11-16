
import { Inject,Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

import { HttpClient, HttpRequest, HttpEvent,  HttpErrorResponse, HttpHeaders, HttpContext } from '@angular/common/http';
import { BioData } from '../JsonServerClass';
import { ThisReceiver } from '@angular/compiler';
import { configServer } from '../JsonServerClass';
import { classFileSystem, classAccessFile }  from 'src/app/classFileSystem';

// const baseUrl = 'http://localhost:8080/api/tutorials';
// const baseUrl = 'http://localhost:8080';
// const baseUrl ='https://test-server-359505.uc.r.appspot.com'; OKOK
// const baseUrl ='https://xmv-server.uc.r.appspot.com'; OKOK
// baseUrl:string ='https://xmv-it-consulting.uc.r.appspot.com'; OKOK


@Injectable({
  providedIn: 'root',
})
export class ManageGoogleService {
    
    constructor(
        private   http: HttpClient,
       )
        {}
       
    //    @Inject('baseUrl') private baseURL:string) {this.baseURL=baseURL}



    myHeader=new HttpHeaders({'content-type': 'application/json',
    'cache-control': 'private, max-age=0',
    'Authorization': 'Bearer ya29.a0AbVbY6MILZfEfuz2p5TZVpC-H49MRTY1gpL6ooXilb3XX26y_DdKVfBxTNGBlosBpVclb_mfDubxk2vWMOUx3LBoG4SkZj1IXHwpgrU2nRNk3vQq1gsVXmcdaLGUXdPz9EicBXVvFS6F5SLtj8GA6E5KLmAMaCgYKAXYSARASFQFWKvPllv_18IAH9e7Y6c4HRJbQ8w0163'
    });

// @Inject is not used

    getListBuckets(config:configServer): Observable<any> {
        return this.http.get<any>(config.baseUrl+'/lBucket/'+config.GoogleProjectId+'/'+config.test_prod);                       
    }

    getListObjects(config:configServer, bucket:string): Observable<any> {
        //return this.http.get<any>(`${this.baseUrl}?bucket=${bucket}`);
        const http_get=config.baseUrl+'/listFiles/'+config.GoogleProjectId+'/'+config.test_prod+'?bucket='+bucket;
        return this.http.get<any>(http_get);
                                
    }

    getListMetaObjects(config:configServer, bucket:string): Observable<any> {
        //return this.http.get<any>(`${this.baseUrl}?bucket=${bucket}`);
        const http_get=config.baseUrl+'/filesmeta/'+config.GoogleProjectId+'/'+config.test_prod+'?bucket='+bucket;
        return this.http.get<any>(http_get);
                                
    }

    getContentObject(config:configServer, bucket:string, object:string): Observable<any> {
        const http_get=config.baseUrl+'/files/'+config.GoogleProjectId+'/'+config.test_prod+'/'+object+'?bucket='+bucket;
        return this.http.get<any>(http_get);                       
    }
    
    getTextObject(config:configServer, bucket:string, object:string): Observable<any> {
        const http_get=config.baseUrl+'/textFile/'+config.GoogleProjectId+'/'+config.test_prod+'/'+object+'?bucket='+bucket;
        return this.http.get<any>(http_get);                       
    }
    
    getmediaLinkContent(config:configServer, bucket:string, object:string): Observable<any> {
        const http_get=config.baseUrl+'/mediaLink/'+config.GoogleProjectId+'/'+config.test_prod+'/'+object+'?bucket='+bucket;
        return this.http.get<any>(http_get);                       
    }

    getMetaObject(config:configServer, bucket:string, object:string): Observable<any> {
        const http_get=config.baseUrl+'/meta/'+config.GoogleProjectId+'/'+config.test_prod+'/'+object+'?bucket='+bucket;
        return this.http.get<any>(http_get);                      
    }


    uploadObject(config:configServer, bucket:string, file: File, object:string): Observable<HttpEvent<any>> {
        const newMetadata = {
            cacheControl: 'public,max-age=0,no-cache,no-store',
            contentType: 'application/json'
          };
        const cacheControl= 'public,max-age=0,no-cache,no-store';
        const contentType= 'json';
        var formData: FormData = new FormData();
        formData.append('metadata', JSON.stringify(newMetadata));
        formData.append('file', file);
        const http_post=config.baseUrl+'/upload/'+config.GoogleProjectId+'/'+object+'/'+config.test_prod+'/'+cacheControl+'/'+contentType+'?bucket='+bucket;
        const req = new HttpRequest('POST', http_post, formData,  {
        // headers: this.myHeader,
        reportProgress: false,
        responseType: 'json'
        });
        return this.http.request(req);
    }


    updateMetadata(config:configServer, bucket:string, objectN:string, newMetaData:any): Observable<HttpEvent<any>> {

            const http_post=config.baseUrl+'/updateMeta/'+config.GoogleProjectId+'/'+config.test_prod+'/'+objectN+'/'+newMetaData+'?bucket='+bucket;
            const req = new HttpRequest('POST', http_post, objectN);
            return this.http.request(req);
        }

    deleteObject(config:configServer, bucket:string, objectN:string): Observable<HttpEvent<any>> {

            const http_post=config.baseUrl+'/delete/'+config.GoogleProjectId+'/'+config.test_prod+'/'+objectN+'?bucket='+bucket;
            //const req = new HttpRequest('GET', objectN);
            return this.http.get<any>(http_post);
        }
    
    renameObject(config:configServer, bucket:string, SRCobject:string, DESTobject:string): Observable<HttpEvent<any>> {
            const http_post=config.baseUrl+'/rename/'+config.GoogleProjectId+'/'+config.test_prod+'/'+SRCobject+'/'+DESTobject+'?bucket='+bucket;
            //const req = new HttpRequest('GET', objectN);
            return this.http.get<any>(http_post);
        }
    
    moveObject(config:configServer, bucket:string, DESTbucket:string,  SRCobject:string, DESTobject:string): Observable<HttpEvent<any>> {
            const http_post=config.baseUrl+'/move/'+config.GoogleProjectId+'/'+config.test_prod+'/'+DESTbucket+'/'+ SRCobject+'/'+ DESTobject+'?bucket='+bucket;
            //const req = new HttpRequest('GET', objectN);
            return this.http.get<any>(http_post);
        }
    copyObject(config:configServer, bucket:string, DESTbucket:string, SRCobject:string, DESTobject:string): Observable<HttpEvent<any>> {
            const http_post=config.baseUrl+'/copy/'+config.GoogleProjectId+'/'+config.test_prod+'/'+DESTbucket+'/'+SRCobject+'/'+DESTobject+'?bucket='+bucket;
            //const req = new HttpRequest('GET', objectN);
            return this.http.get<any>(http_post);
        }

    onFileSystem(config:configServer, bucket:string, object:string, tabLock:Array<classAccessFile>, iWait:string): Observable<any> {
        const http_get=config.baseUrl+'/onFileSystem/'+config.GoogleProjectId+'/'+config.test_prod+'/'+object+'/'+JSON.stringify(tabLock)+'/'+iWait+'?bucket='+bucket;
        return this.http.get<any>(http_get);                       
    }

    resetFS(config:configServer, bucket:string, object:string, tabLock:Array<classAccessFile>, iWait:string): Observable<any> {
        const http_get=config.baseUrl+'/resetFS/'+config.GoogleProjectId+'/'+config.test_prod+'/'+object+'/'+JSON.stringify(tabLock)+'/'+iWait+'?bucket='+bucket;
        return this.http.get<any>(http_get);                       
    }

    getMemoryFS(config:configServer): Observable<any> {
        const http_get=config.baseUrl+'/memoryFS/'+config.GoogleProjectId+'/'+config.test_prod;
        return this.http.get<any>(http_get);                       
    }

    getTokenOAuth2(config:configServer): Observable<any> {
        const http_get=config.baseUrl+'/requestTokenOAuth2/'+config.GoogleProjectId+'/'+config.test_prod;
        return this.http.get<any>(http_get);                      
    }   
    
    getDefaultCredentials(config:configServer): Observable<any> {
        const http_get=config.baseUrl+'/requestDefaultCredentials/'+config.GoogleProjectId+'/'+config.test_prod;
        return this.http.get<any>(http_get);                      
    }  

    getRefreshToken(config:configServer): Observable<any> {
        const http_get=config.baseUrl+'/refreshToken/'+config.GoogleProjectId+'/'+config.test_prod;
        return this.http.get<any>(http_get);                      
    }   
 
    revokeToken(config:configServer): Observable<any> {
        const http_get=config.baseUrl+'/revokeToken/'+config.GoogleProjectId+'/'+config.test_prod;
        return this.http.get<any>(http_get);                      
    }  

    getInfoToken(config:configServer,accessToken:string): Observable<any> {
        const http_get=config.baseUrl+'/checkAccessToken/'+config.GoogleProjectId+'/'+config.test_prod+'/'+accessToken;
        return this.http.get<any>(http_get);                      
    }  
    
    getCredentials(config:configServer,bucket:string,object:string): Observable<any> {
        const http_get=config.baseUrl+'/getCredentials/'+config.GoogleProjectId+'/'+config.test_prod+'/'+object+'?bucket='+bucket;
        return this.http.get<any>(http_get);                      
    }  

    getNewServerUsrId(config:configServer): Observable<any> {
        const http_get=config.baseUrl+'/getNewServerUsrId/'+config.GoogleProjectId+'/'+config.test_prod;
        return this.http.get<any>(http_get);                      
    }  

    checkLogin(config:configServer,userId:string,psw:string): Observable<any> {
        const http_get=config.baseUrl+'/checkLogin/'+config.GoogleProjectId+'/'+config.test_prod+'/'+userId+'/'+psw; // "/"+myArray+"/"+encodeURIComponent(JSON.stringify(TableCryptKey.theFour))
        return this.http.get<any>(http_get);                      
    }  

    encryptFn(config:configServer,data:string,key:number,method:string,authoriz:string): Observable<any> {
        //const myArray=encodeURIComponent(JSON.stringify(TableCryptKey.tab));
        const http_get=config.baseUrl+'/encryptFn/'+config.GoogleProjectId+'/'+config.test_prod+'/'+encodeURIComponent(data)+'/'+key.toString()+'/'+method+'/'+authoriz;
        return this.http.get<any>(http_get);                      
    }  

    decryptFn(config:configServer,data:string,key:number,method:string,authoriz:string): Observable<any> {
        const http_get=config.baseUrl+'/decryptFn/'+config.GoogleProjectId+'/'+config.test_prod+'/'+encodeURIComponent(data)+'/'+key.toString()+'/'+method+'/'+authoriz;
      
        return this.http.get<any>(http_get);                      
    }  

    resetCacheFile(config:configServer,fileName:string): Observable<any> {
        const http_get=config.baseUrl+'/resetCacheFile/'+config.GoogleProjectId+'/'+config.test_prod+'/'+fileName;
        return this.http.get<any>(http_get);                       
    }
    
    reloadCacheFile(config:configServer): Observable<any> {
        const http_get=config.baseUrl+'/reloadCacheFile/'+config.GoogleProjectId+'/'+config.test_prod;
        return this.http.get<any>(http_get);                       
    }
    
    getCacheFile(config:configServer): Observable<any> {
        const http_get=config.baseUrl+'/getCacheFile/'+config.GoogleProjectId+'/'+config.test_prod;
        return this.http.get<any>(http_get);                       
    }
        
    insertCacheFile(config:configServer,object:string): Observable<any> {
        const http_get=config.baseUrl+'/insertCacheFile/'+config.GoogleProjectId+'/'+config.test_prod+'/'+object;
        return this.http.get<any>(http_get);                       
    }
}
