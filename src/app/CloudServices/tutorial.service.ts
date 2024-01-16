import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient,  HttpErrorResponse } from '@angular/common/http';
import { configServer } from '../JsonServerClass';

@Injectable({
  providedIn: 'root'
})
export class TutorialService {
   
  constructor(private   http: HttpClient) { }

  getAll(config:configServer, db:string,collection:string): Observable<any> {
    const http_get=config.mongoServer+'/findTutAll/'+config.userLogin.id+'/'+encodeURIComponent(config.userLogin.psw)+'/'+db+'/'+config.test_prod+'/'+collection;
    return this.http.get<any>(http_get); 
  }
  getById(config:configServer, db:string,collection:string,id: any): Observable<any> {
    const http_get=config.mongoServer+'/findTutById/'+config.userLogin.id+'/'+encodeURIComponent(config.userLogin.psw)+'/'+db+'/'+config.test_prod+'/'+collection+'/'+id;
    return this.http.get<any>(http_get); 
  }
  getByCriteria(config:configServer, db:string,collection:string,criteria: any, field:any): Observable<any> {
    const http_get=config.mongoServer+'/findTutByString/'+config.userLogin.id+'/'+encodeURIComponent(config.userLogin.psw)+'/'+db+'/'+config.test_prod+'/'+collection+'/'+field+'?searchString='+criteria;
    return this.http.get<any>(http_get); 
  }
  upload(config:configServer, db:string,collection:string,record: any): Observable<any> {
    const http_get=config.mongoServer+'/uploadTut/'+config.userLogin.id+'/'+encodeURIComponent(config.userLogin.psw)+'/'+db+'/'+config.test_prod+'/'+collection;
    return this.http.put<any>(http_get,record); 
  }
  update(config:configServer, db:string,collection:string,id: any, record: any): Observable<any> {
    const http_get=config.mongoServer+'/updateTut/'+config.userLogin.id+'/'+encodeURIComponent(config.userLogin.psw)+'/'+db+'/'+config.test_prod+'/'+collection+'/'+id;
    return this.http.put<any>(http_get,record); 
  }
  deleteById(config:configServer, db:string,collection:string,id: any): Observable<any> {
    const http_get=config.mongoServer+'/deleteTut/'+config.userLogin.id+'/'+encodeURIComponent(config.userLogin.psw)+'/'+db+'/'+config.test_prod+'/'+collection+'/'+id;
    return this.http.get<any>(http_get); 
  }
  deleteByCriteria(config:configServer, db:string,collection:string,criteria: any, field:any): Observable<any> {
    const http_get=config.mongoServer+'/deleteTutByString/'+config.userLogin.id+'/'+encodeURIComponent(config.userLogin.psw)+'/'+db+'/'+config.test_prod+'/'+collection+'/'+field+'?searchString='+criteria;
    return this.http.get<any>(http_get); 
  }
  deleteAll(config:configServer, db:string,collection:string): Observable<any> {
    const http_get=config.mongoServer+'/deleteAllTut/'+config.userLogin.id+'/'+encodeURIComponent(config.userLogin.psw)+'/'+db+'/'+config.test_prod+'/'+collection;
    return this.http.get<any>(http_get); 
  }


  // Error 
  handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Handle client error
      errorMessage = error.error.message;
    } else {
      // Handle server error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.log(errorMessage);
    return throwError(errorMessage);
  }
}