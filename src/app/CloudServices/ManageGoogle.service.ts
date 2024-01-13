
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
export class ManageGoogleService {
    
    constructor(
        private   http: HttpClient,
       )
        {}
       

    myHeader=new HttpHeaders({'content-type': 'application/json',
    'cache-control': 'private, max-age=0',
    'Authorization': 'Bearer ya29.a0AbVbY6MILZfEfuz2p5TZVpC-H49MRTY1gpL6ooXilb3XX26y_DdKVfBxTNGBlosBpVclb_mfDubxk2vWMOUx3LBoG4SkZj1IXHwpgrU2nRNk3vQq1gsVXmcdaLGUXdPz9EicBXVvFS6F5SLtj8GA6E5KLmAMaCgYKAXYSARASFQFWKvPllv_18IAH9e7Y6c4HRJbQ8w0163'
    });

checkLogin(config:configServer,userId:string,psw:string): Observable<any> {
    const http_get=config.googleServer+'/checkLogin/'+config.GoogleProjectId+'/'+config.test_prod+'/'+userId+'/'+encodeURIComponent(psw); // "/"+myArray+"/"+encodeURIComponent(JSON.stringify(TableCryptKey.theFour))
    return this.http.get<any>(http_get);                      
}  

getListBuckets(config:configServer): Observable<any> {
    return this.http.get<any>(config.googleServer+'/lBucket/'+config.GoogleProjectId+'/'+config.test_prod);                       
}

getListObjects(config:configServer, bucket:string): Observable<any> {
    //return this.http.get<any>(`${this.googleServer}?bucket=${bucket}`);
    const http_get=config.googleServer+'/listFiles/'+config.GoogleProjectId+'/'+config.test_prod+'?bucket='+bucket;
    return this.http.get<any>(http_get);
                            
}

getListMetaObjects(config:configServer, bucket:string): Observable<any> {
    //return this.http.get<any>(`${this.googleServer}?bucket=${bucket}`);
    const http_get=config.googleServer+'/filesmeta/'+config.GoogleProjectId+'/'+config.test_prod+'?bucket='+bucket;
    return this.http.get<any>(http_get);
                            
}

getContentObject(config:configServer, bucket:string, object:string): Observable<any> {
    const http_get=config.googleServer+'/files/'+config.GoogleProjectId+'/'+config.test_prod+'/'+object+'?bucket='+bucket;
    return this.http.get<any>(http_get);                       
}

getTextObject(config:configServer, bucket:string, object:string): Observable<any> {
    const http_get=config.googleServer+'/textFile/'+config.GoogleProjectId+'/'+config.test_prod+'/'+object+'?bucket='+bucket;
    return this.http.get<any>(http_get);                       
}

getmediaLinkContent(config:configServer, bucket:string, object:string): Observable<any> {
    const http_get=config.googleServer+'/mediaLink/'+config.GoogleProjectId+'/'+config.test_prod+'/'+object+'?bucket='+bucket;
    return this.http.get<any>(http_get);                       
}

getMetaObject(config:configServer, bucket:string, object:string): Observable<any> {
    const http_get=config.googleServer+'/meta/'+config.GoogleProjectId+'/'+config.test_prod+'/'+object+'?bucket='+bucket;
    return this.http.get<any>(http_get);                      
}


uploadObject(config:configServer, bucket:string, file: File, object:string): Observable<HttpEvent<any>> {

    const cacheControl= 'public,max-age=0,no-cache,no-store';
    const contentType= 'application/json';
    var formData: FormData = new FormData();
    //formData.append('metadata', JSON.stringify(newMetadata));
    formData.append('file', file);
    const http_post=config.googleServer+'/upload/'+config.GoogleProjectId+'/'+object+'/'+config.test_prod+'/'+cacheControl+'/'+encodeURIComponent(contentType)+'?bucket='+bucket;
    const req = new HttpRequest('POST', http_post, formData,  {
            reportProgress: false,
            responseType: 'json'
            });
    return this.http.request(req);
}

uploadObjectMetaPerso(config:configServer, bucket:string, file: File, object:string, metaCache:string, metaType:string, metaPerso:any): Observable<HttpEvent<any>> {

    var contentType="";
    if (metaCache===""){
        metaCache='public,max-age=0,no-cache,no-store';
    }
    /*
    var i=metaType.indexOf('/');
    if (i!==-1){
        contentType= metaType.substring(i+1); // 'json' or 'text';
    }
    */

    var formData: FormData = new FormData();
    //formData.append('metadata', JSON.stringify(newMetadata));
    formData.append('file', file);

    var theMetaPerso = "";
    if (Array.isArray(metaPerso)===true){
        theMetaPerso=JSON.stringify(metaPerso);
    } else {
        theMetaPerso=metaPerso;
    }

    const http_post=config.googleServer+'/uploadMetaPerso/'+config.GoogleProjectId+'/'+object+'/'+config.test_prod+'/'+metaCache+'/'+encodeURIComponent(metaType)+'/'+theMetaPerso+'?bucket='+bucket;
    const req = new HttpRequest('POST', http_post, formData,  {
            reportProgress: false,
            responseType: 'json'
            });
    return this.http.request(req);
}

updateMetaData(config:configServer, bucket:string, objectN:string, metaCache:string, metaType:string, metaPerso:any): Observable<HttpEvent<any>> {
    /*
    var i=metaType.indexOf('/');
    metaType=metaType.substring(0,i)+'-'+metaType.substring(i+1);
    */
    var theMetaPerso = "";
    if (Array.isArray(metaPerso)===true){
        theMetaPerso=JSON.stringify(metaPerso);
    } else {
        theMetaPerso=metaPerso;
    }
    const http_post=config.googleServer+'/updateMeta/'+config.GoogleProjectId+'/'+config.test_prod+'/'+objectN+'/'+metaCache+'/'+encodeURIComponent(metaType)+'/'+theMetaPerso+'?bucket='+bucket;
    const req = new HttpRequest('POST', http_post, objectN);
    return this.http.request(req);
}

deleteObject(config:configServer, bucket:string, objectN:string): Observable<HttpEvent<any>> {
        const http_post=config.googleServer+'/delete/'+config.GoogleProjectId+'/'+config.test_prod+'/'+objectN+'?bucket='+bucket;
        //const req = new HttpRequest('GET', objectN);
        return this.http.get<any>(http_post);
    }

renameObject(config:configServer, bucket:string, SRCobject:string, DESTobject:string): Observable<HttpEvent<any>> {
        const http_post=config.googleServer+'/rename/'+config.GoogleProjectId+'/'+config.test_prod+'/'+SRCobject+'/'+DESTobject+'?bucket='+bucket;
        //const req = new HttpRequest('GET', objectN);
        return this.http.get<any>(http_post);
    }

moveObject(config:configServer, bucket:string, DESTbucket:string,  SRCobject:string, DESTobject:string): Observable<HttpEvent<any>> {
        const http_post=config.googleServer+'/move/'+config.GoogleProjectId+'/'+config.test_prod+'/'+DESTbucket+'/'+ SRCobject+'/'+ DESTobject+'?bucket='+bucket;
        //const req = new HttpRequest('GET', objectN);
        return this.http.get<any>(http_post);
    }
copyObject(config:configServer, bucket:string, DESTbucket:string, SRCobject:string, DESTobject:string): Observable<HttpEvent<any>> {
        const http_post=config.googleServer+'/copy/'+config.GoogleProjectId+'/'+config.test_prod+'/'+DESTbucket+'/'+SRCobject+'/'+DESTobject+'?bucket='+bucket;
        //const req = new HttpRequest('GET', objectN);
        return this.http.get<any>(http_post);
    }

getNewServerUsrId(config:configServer): Observable<any> {
    const http_get=config.googleServer+'/getNewServerUsrId/'+config.GoogleProjectId+'/'+config.test_prod;
    return this.http.get<any>(http_get);                      
}  

getDefaultCredentials(config:configServer): Observable<any> {
    const http_get=config.googleServer+'/requestDefaultCredentials/'+config.GoogleProjectId+'/'+config.test_prod;
    return this.http.get<any>(http_get);                      
}  

getServerVersion(config:configServer): Observable<any> {
    const http_get=config.googleServer+'/serverVersion/'+config.GoogleProjectId+'/'+config.test_prod;
    return this.http.get<any>(http_get);                      
}  


onFileSystem(config:configServer, bucket:string, object:string, tabLock:Array<classAccessFile>, iWait:string): Observable<any> {
    const http_get=config.fileSystemServer+'/onFileSystem/'+config.GoogleProjectId+'/'+config.test_prod+'/'+object+'/'+JSON.stringify(tabLock)+'/'+iWait+'?bucket='+bucket;
    return this.http.get<any>(http_get);                       
}


}
