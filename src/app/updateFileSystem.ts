import { Inject,Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { configServer, XMVConfig, LoginIdentif, msgConsole } from 'src/app/JsonServerClass';
import { classFileSystem, classAccessFile }  from 'src/app/classFileSystem';
import { HttpClient, HttpErrorResponse,  HttpHeaders, HttpRequest, HttpEvent, HttpHandler } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { convertDate } from 'src/app/MyStdFunctions'


@Injectable({
  providedIn: 'root',
})

    
export class onUpdateFileSystem{
    constructor(
        private   http: HttpClient,
        private   handler: HttpHandler
        ){}
    myHeader=new HttpHeaders({'content-type': 'application/json',
    'cache-control': 'private, max-age=0, no-cache,no-store'
    });


    updateFileSystem(config:configServer, bucket:string, object:string, inData:classAccessFile,): Observable<any> {
        const http_get=config.baseUrl+'/files/'+config.GoogleProjectId+'/'+object+'?bucket='+bucket;
        return this.http.get<any>(http_get).pipe(
            map((data: any) => {
                const status=checkData(config, data, inData, object, bucket);
                if (status===0){
                    console.log('records retrieved object & from =', data[inData.iWait].object + '  at ' + data[inData.iWait].updatedAt);
                    return (data);
                }
                else {
                    console.log('record retrieved ; status is ' + status + '  and length is ' + data.length);
                    return status;
                }
            }), 
            catchError(error => {
                if (inData.action==="lock"){
                    var fileSystem:Array<classFileSystem>=[];
                    const status=checkData(config, fileSystem, inData, object, bucket);
                    if (typeof status === 'object'){
                        console.log('file not found & record created');
                    }
                    else {
                        console.log('file not found & record was not created');
                    }
                    return throwError(status);
                } else if (inData.action==="unlock"){
                    return throwError( 'Err555 - file not found' + error);
                } else {
                    return throwError( 'Err555 - file not found & action unkown = '+ inData.action );
                }
              })
        );                           
    }
    

    saveFileSystem(config:configServer, bucket:string, object:string, fileSystem:Array<classFileSystem>, inData:classAccessFile,tabLock:Array<classAccessFile>): Observable<any> {
        var file=new File ([JSON.stringify(fileSystem)],object, {type: 'application/json'});
        const newMetadata = {
            cacheControl: 'public,max-age=0',
            contentType: 'application/json'
          };
        const cacheControl= 'public,max-age=0';
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
        return this.http.request(req).pipe(
            map((data: any) => {
                if (data.type===4 && data.status===200){
                    if (inData.action==="unlock"){
                        tabLock[inData.iWait].lock=0;
                    } else if (inData.action==="lock"){
                        tabLock[inData.iWait].lock=1;
                    }
                   
                    console.log('record is saved - lock value is ' + tabLock[inData.iWait].object + '  iWait= ' + inData.iWait);
                    return tabLock;
                    } else { return data;}
            }), 
            catchError(error => {
                console.log('error - record could not be saved ' + error);
                return tabLock;
            })
            );
    }
}

export function checkData(config:configServer, fileSystem:Array<classFileSystem>, inData:classAccessFile, object:string, bucket:string){
    if (fileSystem.length > 0 ){
        for (var i=0; i<fileSystem.length && (fileSystem[i].object!==inData.object || fileSystem[i].bucket!==inData.bucket); i++){}
        if (inData.action==="lock"){
            if (i===fileSystem.length ){
                // record is not locked so create a new record and flag lock to true
                createRecord(fileSystem,inData);
                console.log('create record ' + inData.object );
                //const status=saveFile(config, fileSystem, object, bucket);
                return (fileSystem);
            } else { // record already exists and already locked
                console.log('record ' + inData.object + 'already exists and already locked - Error 300');
                // check wheter it has been locked form more than 1 hour
                // if yes then lock it for this user
                return(validateLock(fileSystem,inData,i));
            }
        } else if (inData.action==="unlock"){
            if (i===fileSystem.length ){
                // record is not found so cannot be unlocked
                console.log('record not found, so cannot be unlocked - Error 700');
                return(700);
            } else { // record is found; delete it
                fileSystem.splice(i,1);
                return (fileSystem);
            }
        } else if (inData.action==="updatedAt"){
            return(updatedAt(fileSystem,inData,i));
        } else {return(500);} // wrong action
    } else { 
        if (inData.action==="lock"){
            console.log('fileSystem is empty; createRecord');
            createRecord(fileSystem,inData);
            return (fileSystem);
        } else { 
            console.log('fileSystem is empty;');
            return(0); }
    }
}

export function createRecord(fileSystem:Array<classFileSystem>, inData:classAccessFile){
    const recordSystem=new classFileSystem;
    fileSystem.push(recordSystem);
    fileSystem[fileSystem.length-1].bucket=inData.bucket;
    fileSystem[fileSystem.length-1].object=inData.object;
    fileSystem[fileSystem.length-1].byUser=inData.user;
    fileSystem[fileSystem.length-1].lock=true;
    
    const theDate=new Date();
    const myTime=theDate.toString().substring(16,18)+theDate.toString().substring(19,21)+theDate.toString().substring(22,24);
    const myDate=convertDate(theDate,"YYYYMMDD") + myTime;
    fileSystem[fileSystem.length-1].createdAt=myDate;
    fileSystem[fileSystem.length-1].updatedAt=myDate;
  }

  export function validateLock(fileSystem:Array<classFileSystem>, inData:classAccessFile, record:number){
    var stringHour='';
    var stringMin='';
    
    const theHour=Number(fileSystem[record].updatedAt.substring(8,10)); // add xx hours;
    if (theHour<10){
        stringHour ='0'+ theHour.toString();
    } else { 
        stringHour = theHour.toString();
    }
    const theMin=Number(fileSystem[record].updatedAt.substring(10,12)) + 1; // add xx minutes
    if (theMin<10){
        stringMin ='0'+ theMin.toString();
    } else { 
        stringMin = theMin.toString();
    }
    const theTime = stringHour + stringMin + fileSystem[record].updatedAt.substring(12);
    const refDate=fileSystem[record].updatedAt.substring(0,8) + theTime;
    const theDate=new Date();
    const myTime=theDate.toString().substring(16,18)+theDate.toString().substring(19,21)+theDate.toString().substring(22,24);
    const myDate = convertDate(theDate,"YYYYMMDD") + myTime;
    if (myDate >refDate){
        fileSystem[record].createdAt=myDate;
        fileSystem[record].updatedAt=myDate;
        fileSystem[record].bucket=inData.bucket;
        fileSystem[record].object=inData.object;
        fileSystem[record].byUser=inData.user;
        return(fileSystem);
    } else {
        return(300);
    }
}

export function updatedAt(fileSystem:Array<classFileSystem>, inData:classAccessFile, record:number){
    const theDate=new Date();
    const myTime=theDate.toString().substring(16,18)+theDate.toString().substring(19,21)+theDate.toString().substring(22,24);
    const myDate=convertDate(theDate,"YYYYMMDD") + myTime;
    fileSystem[fileSystem.length-1].updatedAt=myDate;
    return(fileSystem);
}

  