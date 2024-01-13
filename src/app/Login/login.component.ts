import { Component, OnInit , Input, Output, HostListener, OnChanges, HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
  
import { HttpClient,  HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { FormGroup, FormControl, Validators} from '@angular/forms';

import { XMVTestProd, configServer, LoginIdentif , classCredentials, EventAug, Bucket_List_Info } from '../JsonServerClass';


import { environment } from 'src/environments/environment';
import {mainClassConv,mainConvItem, mainRecordConvert, mainClassUnit} from '../ClassConverter';

import {classConfHTMLFitHealth} from '../Health/classConfHTMLTableAll';

import { classConfigChart, classchartHealth } from '../Health/classConfigChart';
import {mainClassCaloriesFat, mainDailyReport} from '../Health/ClassHealthCalories';
import {ConfigFitness} from '../Health/ClassFitness';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { ManageMongoDBService } from 'src/app/CloudServices/ManageMongoDB.service';

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

    @Input() identification=new LoginIdentif; 

    @Input() ConfigChart=new classConfigChart;
    
    @Input() ConfigCaloriesFat=new mainClassCaloriesFat;

    @Input() ConvertUnit=new mainClassConv;
    @Input() ConvToDisplay=new mainConvItem;
    @Input() theTabOfUnits=new mainClassUnit;
    @Input() WeightRefTable=new mainRecordConvert;
    @Input() ConfigHTMLFitHealth=new classConfHTMLFitHealth;
  
    @Input() MyConfigFitness=new ConfigFitness;
  
    @Input() HealthAllData=new mainDailyReport; 
    @Input() credentials = new classCredentials;

    ConfigTestProd=new XMVTestProd;

    id_Animation:Array<number>=[];

    j_loop:Array<number>=[];
    max_j_loop:number=20000;

    @Output() my_output1= new EventEmitter<any>();
    @Output() my_output2= new EventEmitter<string>();
    @Output() returnFile= new EventEmitter<any>();
    
    
    myHeader= new  HttpHeaders();
    getScreenWidth: any;
    getScreenHeight: any;
    device_type:string='';
    routing_code:number=0;
    text_error:string='';
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
    Encrypt_Data=new LoginIdentif;

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
  
  @HostListener('window:resize', ['$event'])
  onWindowResize() {
      this.getScreenWidth = window.innerWidth;
      this.getScreenHeight = window.innerHeight;
    }

  ngOnInit(){
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

      if (this.identification.UserId!=='') {
          this.myForm.controls['userId'].setValue(this.identification.UserId);

      } else {
          this.myForm.controls['action'].setValue("");
        }

  }



getLogin(object:string,psw:string){
    // this.ManageGoogleService.getContentObject(this.configServer, Bucket, GoogleObject )
    this.ManageGoogleService.checkLogin(this.configServer, object, psw )
        .subscribe((data ) => {    
            this.Encrypt_Data=data;
            this.routing_code=1;
            this.Encrypt_Data.userServerId=this.credentials.userServerId;
            this.Encrypt_Data.credentialDate=this.credentials.creationDate;
            this.Encrypt_Data.IpAddress=this.configServer.IpAddress;
            this.my_output2.emit(this.routing_code.toString());
      },
        err=> {
          console.log('error to checkLogin - error status=' + err.status + ' '+ err.message );
        })
  }




ValidateData(){

  
  console.log('validateData()');
  if (this.myForm.controls['userId'].value==='')  {
    this.text_error=" provide your user id";
  }
  else
  if (this.myForm.controls['password'].value==='')  {
    this.text_error=" provide your password";
  }
  else
  {
    this.text_error='';
    this.getLogin( this.myForm.controls['userId'].value, this.myForm.controls['password'].value);
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
  this.text_error='';
}


ReceiveFiles(event:any){

  if (event.fileType!=='' && 
          event.fileType===this.identification.configFitness.fileType.convertUnit){ 
      this.ConvertUnit=event;

  } else if (event.fileType!=='' && 
          event.fileType===this.identification.configFitness.fileType.convToDisplay){ 
       this.ConvToDisplay=event;

  } else if (event.fileType!=='' && 
          event.fileType===this.identification.configFitness.fileType.tabOfUnits){ 
      this.theTabOfUnits=event;

  } else if (event.fileType!=='' && 
        event.fileType===this.identification.configFitness.fileType.weightReference){ 
      this.WeightRefTable=event;

  } else if (event.fileType!=='' && 
        event.fileType===this.identification.fitness.fileType.FitnessMyConfig){ 
      this.MyConfigFitness=event;
  }

  else if (event.fileType!=='' && 
        event.fileType===this.identification.fitness.fileType.Health){
      this.HealthAllData=event;
  }

  else if (event.fileType!=='' && 
        event.fileType===this.identification.configFitness.fileType.calories){ 
      this.ConfigCaloriesFat=event;
  }   
  else if (event.fileType!=='' && 
        event.fileType===this.identification.configFitness.fileType.confHTML){ 
      this.ConfigHTMLFitHealth=event;
    } else if (event.fileType!=='' && 
        event.fileType===this.identification.configFitness.fileType.confChart){ 
      this.ConfigChart=event;
    }
  this.returnFile.emit(event);
}
//ngOnChanges(changes: SimpleChanges) {   
      //console.log('onChanges login.ts');
//  }


firstLoop:boolean=true;
ngOnChanges(changes: SimpleChanges) { 
    if (this.firstLoop===true){
      this.firstLoop=false;
    } else {
      for (const propName in changes){
        const j=changes[propName];
        if (propName==='credentials'){
            this.Encrypt_Data.userServerId=this.credentials.userServerId;
            this.Encrypt_Data.credentialDate=this.credentials.creationDate;
        }
      }
    }
}


@Output() resetServer= new EventEmitter<any>();
@Output() newCredentials= new EventEmitter<any>();

fnResetServer(){
      this.resetServer.emit();
  }

fnNewCredentials(credentials:any){
  this.Encrypt_Data.userServerId=credentials.userServerId;
  this.Encrypt_Data.credentialDate=credentials.creationDate;
  this.newCredentials.emit(credentials);
}


}