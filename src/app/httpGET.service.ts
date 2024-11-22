import { Inject,Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpRequest, HttpEvent,  HttpErrorResponse, HttpHeaders, HttpContext } from '@angular/common/http';



export function HTTPget(BooleanTab:Array<number>, i:number, url:string): Observable<any>{
    const Http = new XMLHttpRequest();
    var theData:any;
    Http.open("GET", url);
    Http.send();
    Http.onload = (e) => {
            console.log('myHTTPget: status=',  Http.status, ' readyState=', Http.readyState)
            if (Http.readyState===4 && Http.status===200){
                BooleanTab[i]=1;
                theData=JSON.parse(Http.responseText);
                console.log('data = ',theData, '  BooleanTab[i] = ', BooleanTab[i]);
                return (theData);
            } else
            if (Http.status!==200){
                console.log('error = ',Http.status);
                BooleanTab[i]=1;
                return (theData);
            }
            console.log('return event = ',BooleanTab[i]);
        }

/*
    Http.onerror=() =>{
        console.log('server error', Http.status);

    }
    Http.onprogress=() =>{
        console.log('process is in progress');

    }
    */
    return (theData);
}


export function theHTTPget(BooleanTab:Array<number>, i:number, dataToReturn:any,i_array:number,url:string): Observable<any>{
    var iLoop=0;
    const maxLoop=30000;
    var theData:any;
    fnHTTPget(BooleanTab, i, dataToReturn,i_array,url)
    .subscribe((data:any ) => {   
        theData=data;
        
    })
    return (theData);

}

export function fnHTTPget(BooleanTab:Array<number>, i:number, dataToReturn:any,i_array:number,url:string){
    const Http = new XMLHttpRequest();
    var eventreceived:any;

        Http.open("GET", url);
        Http.send();
       
        Http.onreadystatechange = (e) => {
            if (Http.readyState===4 && Http.status===200){
                var data=JSON.parse(Http.responseText);
                dataToReturn=data;
                console.log('data = ',data);
                BooleanTab[i]=1;
                eventreceived=data;
            }
            else
            if (Http.readyState===4){
                BooleanTab[i]=1;
            }
   
    }
    return(eventreceived);
}
