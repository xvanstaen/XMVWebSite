
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
        return this.http.get<any>(config.baseUrl+'/lBucket/'+config.GoogleProjectId);                       
    }

    getListObjects(config:configServer, bucket:string): Observable<any> {
        //return this.http.get<any>(`${this.baseUrl}?bucket=${bucket}`);
        const http_get=config.baseUrl+'/files/'+config.GoogleProjectId+'?bucket='+bucket;
        return this.http.get<any>(http_get);
                                
    }

    getListMetaObjects(config:configServer, bucket:string): Observable<any> {
        //return this.http.get<any>(`${this.baseUrl}?bucket=${bucket}`);
        const http_get=config.baseUrl+'/filesmeta/'+config.GoogleProjectId+'?bucket='+bucket;
        return this.http.get<any>(http_get);
                                
    }

    getContentObject(config:configServer, bucket:string, object:string): Observable<any> {
        const http_get=config.baseUrl+'/files/'+config.GoogleProjectId+'/'+object+'?bucket='+bucket;
        return this.http.get<any>(http_get);                       
    }
    
    getMetaObject(config:configServer, bucket:string, object:string): Observable<any> {
        const http_get=config.baseUrl+'/meta/'+config.GoogleProjectId+'/'+object+'?bucket='+bucket;
        return this.http.get<any>(http_get);                      
    }


    uploadObject(config:configServer, bucket:string, file: File): Observable<HttpEvent<any>> {
        const newMetadata = {
            cacheControl: 'public,max-age=0,no-cache,no-store',
            contentType: 'application/json'
          };
        const cacheControl= 'public,max-age=0,no-cache,no-store';
        const contentType= 'json';
        var formData: FormData = new FormData();
        formData.append('metadata', JSON.stringify(newMetadata));
        formData.append('file', file);
        const http_post=config.baseUrl+'/upload/'+config.GoogleProjectId+'/'+cacheControl+'/'+contentType+'?bucket='+bucket;
        const req = new HttpRequest('POST', http_post, formData,  {
        // headers: this.myHeader,
        reportProgress: false,
        responseType: 'json'
        });
        return this.http.request(req);
    }


    updateMetadata(config:configServer, bucket:string, objectN:string, newMetaData:any): Observable<HttpEvent<any>> {

            const http_post=config.baseUrl+'/updateMeta/'+config.GoogleProjectId+'/'+objectN+'/'+newMetaData+'?bucket='+bucket;
            const req = new HttpRequest('POST', http_post, objectN);
            return this.http.request(req);
        }

    deleteObject(config:configServer, bucket:string, objectN:string): Observable<HttpEvent<any>> {

            const http_post=config.baseUrl+'/delete/'+config.GoogleProjectId+'/'+objectN+'?bucket='+bucket;
            //const req = new HttpRequest('GET', objectN);
            return this.http.get<any>(http_post);
        }
    
    renameObject(config:configServer, bucket:string, SRCobject:string, DESTobject:string): Observable<HttpEvent<any>> {
            const http_post=config.baseUrl+'/rename/'+config.GoogleProjectId+'/'+SRCobject+'/'+DESTobject+'?bucket='+bucket;
            //const req = new HttpRequest('GET', objectN);
            return this.http.get<any>(http_post);
        }
    
    moveObject(config:configServer, bucket:string, DESTbucket:string,  SRCobject:string, DESTobject:string): Observable<HttpEvent<any>> {
            const http_post=config.baseUrl+'/move/'+config.GoogleProjectId+'/'+DESTbucket+'/'+ SRCobject+'/'+ DESTobject+'?bucket='+bucket;
            //const req = new HttpRequest('GET', objectN);
            return this.http.get<any>(http_post);
        }
    copyObject(config:configServer, bucket:string, DESTbucket:string, SRCobject:string, DESTobject:string): Observable<HttpEvent<any>> {
            const http_post=config.baseUrl+'/copy/'+config.GoogleProjectId+'/'+DESTbucket+'/'+SRCobject+'/'+DESTobject+'?bucket='+bucket;
            //const req = new HttpRequest('GET', objectN);
            return this.http.get<any>(http_post);
        }

    updateFileSystem(config:configServer, bucket:string, object:string, inData:classAccessFile, tabLock:Array<classAccessFile>): Observable<any> {
        const http_get=config.baseUrl+'/updateFileSystem/'+config.GoogleProjectId+'/'+object+'/'+JSON.stringify(inData)+'/'+JSON.stringify(tabLock)+'?bucket='+bucket;
        return this.http.get<any>(http_get);                       
    }


        

}
