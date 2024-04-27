import { Component, OnInit , Input, Output, HostListener, OnChanges, HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
  
import { HttpClient,  HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { FormGroup, FormControl, Validators} from '@angular/forms';

import { XMVTestProd, configServer, LoginIdentif , classUserLogin, classCredentials, EventAug, Bucket_List_Info } from '../JsonServerClass';


import { environment } from 'src/environments/environment';
import {mainClassConv,mainConvItem, mainRecordConvert, mainClassUnit} from '../ClassConverter';

import {classConfHTMLFitHealth} from '../Health/classConfHTMLTableAll';

import { classConfigChart, classchartHealth } from '../Health/classConfigChart';
import {mainClassCaloriesFat, mainDailyReport} from '../Health/ClassHealthCalories';
import {ConfigFitness} from '../Health/ClassFitness';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { ManageMongoDBService } from 'src/app/CloudServices/ManageMongoDB.service';

import { fillCredentials , fillConfig} from '../copyFilesFunction';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent {

  constructor(
    private router:Router,
    private http: HttpClient,
    private ManageGoogleService: ManageGoogleService,
    private ManageMongoDBService: ManageMongoDBService,
    ) {}

    @Input() configServer=new configServer;
    @Input() credentials = new classCredentials;
    @Input() credentialsMongo = new classCredentials;
    @Input() credentialsFS = new classCredentials;
    @Input() configServerChanges:number=0;

    @Input() identification=new LoginIdentif; 


    ConfigTestProd=new XMVTestProd;

    userLogin=new classUserLogin;

    id_Animation:Array<number>=[];

    j_loop:Array<number>=[];
    max_j_loop:number=20000;

  
    @Output() my_output2= new EventEmitter<string>();

    @Output() resetServer= new EventEmitter<any>();
    @Output() newCredentials= new EventEmitter<any>();
    
    
    myHeader= new  HttpHeaders();
    getScreenWidth: any;
    getScreenHeight: any;
    device_type:string='';
    routing_code:number=0;
    error:string='';
    i:number=0;

    myForm = new FormGroup({
      userId: new FormControl('', { nonNullable: true }),
      password: new FormControl('', { nonNullable: true }),
      action: new  FormControl('', { nonNullable: true }),
    });

    Encrypt:string='';
    Decrypt:string='';
    Crypto_Method:string='';
    Crypto_Error:string='';
    Crypto_Key:number=0;

    Table_User_Data:Array<EventAug>=[];
    Table_DecryptPSW:Array<string>=[];
    Individual_User_Data= new EventAug;
    bucket_data:string='';

    HTTP_Address:string='';
    HTTP_AddressMetaData:string='';
    Server_Name:string='Google'; // "Google" or "MyJson"
    Google_Bucket_Access_Root:string='https://storage.googleapis.com/storage/v1/b/';
    Google_Bucket_Access_RootPOST:string='https://storage.googleapis.com/upload/storage/v1/b/';
    //Google_Bucket_Name:string='my-db-json';
    Google_Bucket_Name:string='manage-login'; 
    Google_Object_Name:string='';
    Google_Object_Name_Extension:string='.json';
    Bucket_Info_Array=new Bucket_List_Info;

    EventHTTPReceived:Array<boolean>=[];
    FileType={TestProd:''};

    tabServers: Array<string> = [
      'http://localhost:8080', 'https://test-server-359505.uc.r.appspot.com',
      'https://xmv-it-consulting.uc.r.appspot.com', 'https://serverfs.ue.r.appspot.com'
      ]
  
  @HostListener('window:resize', ['$event'])
  onWindowResize() {
      this.getScreenWidth = window.innerWidth;
      this.getScreenHeight = window.innerHeight;
    }

  ngOnInit(){
      //console.log('Login init --- configServer.google='+this.configServer.googleServer);
      this.getScreenWidth = window.innerWidth;
      this.getScreenHeight = window.innerHeight;
      this.device_type = navigator.userAgent;
      this.device_type = this.device_type.substring(10, 48);

      this.myHeader=new HttpHeaders({
        'content-type': 'application/json',
        'cache-control': 'private, max-age=0'
      });
      for (let i=0; i<10; i++){
        this.EventHTTPReceived.push(false);
        this.id_Animation.push(0);
        this.j_loop.push(0);
      }

      this.routing_code=0;
      this.EventHTTPReceived[0]=false;
console.log('Init login ID & PSW ' + this.configServer.userLogin.id + ' ' + this.configServer.userLogin.psw);
console.log('this.identification.userId ' + this.identification.UserId );
      if (this.configServer.userLogin.id!=='') {
          this.myForm.controls['userId'].setValue(this.configServer.userLogin.id);

      } 
      if (this.configServer.userLogin.psw!=='') {
        if (this.identification.UserId!==""){
          this.decryptAllPSW();
        }
      } 

  }
savePsw:string="";
decryptAllPSW(){
  this.ManageGoogleService.decryptAllFn(this.configServer,this.configServer.userLogin.psw, 1, 'AES', "Yes")
      .subscribe((data ) => { 
        if (data.status===undefined){
          this.savePsw = data;
          this.myForm.controls['password'].setValue(data);

        } else {
          this.error = data.msg;
          this.myForm.controls['password'].setValue("");
        }
    },
    err => {
      this.error = err.msg;
      this.myForm.controls['password'].setValue("");
    })
}

getLogin(){
 // this.configServer.googleServer=this.tabServers[0];
 if (this.myForm.controls['userId'].value!==this.configServer.userLogin.id || this.myForm.controls['password'].value !== this.savePsw){
    this.ManageGoogleService.encryptAllFn(this.configServer,this.myForm.controls['password'].value, 1, 'AES', 'Yes')
    .subscribe((data ) => { 
        if (data.status===undefined){
          this.configServer.userLogin.id=this.myForm.controls['userId'].value;
          this.configServer.userLogin.psw=data.response;
          this.configServer.userLogin.accessLevel="";
          this.checkLogin();
        } else {
          this.error = data.msg;
        }
      },
      err => {
        this.error = err.msg;
      })
  } else {
    this.routing_code=1;
    this.identification.userServerId=this.credentialsFS.userServerId;
    this.identification.credentialDate=this.credentialsFS.creationDate;
    this.identification.IpAddress=this.configServer.IpAddress;
  }
}

checkLogin(){
    // this.ManageGoogleService.getContentObject(this.configServer, Bucket, GoogleObject )
    this.ManageGoogleService.checkLogin(this.configServer )
        .subscribe((data ) => {    
            if (data.status===undefined){              
              this.getUserAccessLevel();
              this.identification=data;
              this.routing_code=1;
              this.identification.userServerId=this.credentialsFS.userServerId;
              this.identification.credentialDate=this.credentialsFS.creationDate;
              this.identification.IpAddress=this.configServer.IpAddress;
              this.my_output2.emit(this.routing_code.toString());
            } else {
              this.error='invalid user-id/password';
            }
      },
        err=> {
          if (err.error.status!==undefined && err.error.status==520){
            this.error='invalid user-id/password';
          } else {
            this.error=err.msg;
            console.log('error to checkLogin - error status=' + err.status + ' '+ err.message );
          }
        })
  }

  getUserAccessLevel(){
    this.ManageGoogleService.getSecurityAccess(this.configServer )
      .subscribe((data ) => {  
          if (data.status===200){
            this.configServer.userLogin.accessLevel = data.accessLevel;
            this.configServerChanges++
          } else {
            // this.error=data.msg
          }
      },
      err =>{
          console.log('getSecurityAccess  error ' + err);
          this.error="Server problem. Lower level of access has been assigned"
      });
  }

ValidateData(){
  //console.log('validateData()');
  if (this.myForm.controls['userId'].value==='')  {
    this.error=" provide your user id";
  }
  else
  if (this.myForm.controls['password'].value==='')  {
    this.error=" provide your password";
  }
  else
  {
    this.error='';
    this.getLogin();
  }
}

GetUpdatedTable(event:any){
  this.Table_User_Data=event;
}

onClear(){
  this.myForm.reset({
    userId: '',
    password:''
  });
  this.error='';
}


fnResetServer(){
  this.resetServer.emit();
}

fnNewCredentials(credentials:any){
  this.identification.userServerId=credentials.userServerId;
  this.identification.credentialDate=credentials.creationDate;
  this.newCredentials.emit(credentials);
}

@Output() serverChange=  new EventEmitter<any>();
changeServerName(event:any){
  if (event==='FS'){
    this.serverChange.emit('FS');
  } else  if (event==='Google'){
    //console.log('Login - ChangeServerName fn --- configServer.google='+this.configServer.googleServer);
    this.serverChange.emit('Google');
  } else  if (event==='Mongo'){
    this.serverChange.emit('Mongo');
  }

}

/*
ngOnChanges(changes: SimpleChanges) { 
  for (const propName in changes){
    const j=changes[propName];
    if (propName==='credentialsFS'){
      if (changes[propName].firstChange === false) {
        this.identification.userServerId=this.credentialsFS.userServerId;
        this.identification.credentialDate=this.credentialsFS.creationDate;
      }
    }
  }
}
*/

/*
getCredentials(){
  const theServer='fileSystem';
  this.ManageGoogleService.getCredentials(this.configServer)
      .subscribe(
          (data ) => {
            this.credentialsFS.creationDate = data.credentials.creationDate;
            this.credentialsFS.userServerId = data.credentials.userServerId
            console.log('getCredentials server='+theServer +' '+JSON.stringify(data));
          },
          err => {
            console.log("return from getCredentials() for server '" + theServer + "' with error = "+ err.status);
          });
  }
*/

}