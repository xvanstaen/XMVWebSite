import { Component, OnInit , Input, Output, HostListener, OnChanges, HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
  
import { HttpClient,  HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { FormGroup, FormControl, Validators} from '@angular/forms';
import { encrypt, decrypt} from '../EncryptDecryptServices';
import { EventAug } from '../JsonServerClass';
import {Bucket_List_Info} from '../JsonServerClass';
import { XMVConfig } from '../JsonServerClass';
import { XMVTestProd } from '../JsonServerClass';
import { configServer } from '../JsonServerClass';
import { LoginIdentif } from '../JsonServerClass';
import { environment } from 'src/environments/environment';
import {mainClassConv,mainConvItem, mainRecordConvert, mainClassUnit} from '../ClassConverter';

import {classConfHTMLFitHealth} from '../Health/classConfHTMLTableAll';

import { classConfigChart, classchartHealth } from '../Health/classConfigChart';
import {mainClassCaloriesFat, mainDailyReport} from '../Health/ClassHealthCalories';
import {ConfigFitness} from '../Health/ClassFitness';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';

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
    private ManageMangoDBService: ManageMangoDBService,
    ) {}

    @Input() configServer=new configServer;
    @Input() XMVConfig=new XMVConfig;

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

    ConfigXMV=new XMVConfig;
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

      this.ConfigXMV=this.XMVConfig;

      this.myHeader=new HttpHeaders({
        'content-type': 'application/json',
        'cache-control': 'private, max-age=0'
      });
      for (let i=0; i<10; i++){
        this.EventHTTPReceived.push(false);
        this.id_Animation.push(0);
        this.j_loop.push(0);
      }
      this.EventHTTPReceived[3]=true; // inherited from old process; config is received
       this.routing_code=0;
      this.EventHTTPReceived[0]=false;
      this.getEventAug(0);
      // id_animation=0; EventHTTPReceived=0
      this.j_loop[0]=0;
      this.waitHTTP(30000,0,0);

      // ========== TO BE DELETED AFTER THE TESTS ==========
      
      //this.identification.UserId='XMVIT-Admin';
      //this.Crypto_Key=this.identification.key;
      //this.Crypto_Method=this.identification.method;
      //this.Decrypt='LIM!12monica#Chin';
      //this.onCrypt("Encrypt");
      //this.identification.psw=this.Encrypt;
      /*
      this.identification.UserId='Fitness';
      this.Crypto_Key=this.identification.key;
      this.Crypto_Method=this.identification.method;
      this.Decrypt='A';
      this.onCrypt("Encrypt");
      this.identification.psw=this.Encrypt;
      this.ValidateData();
      */
      // ===================================================


      if (this.identification.UserId!=='' && this.identification.psw!=='') {
       // go through login panel again to allow the change of user id if needed 
          this.myForm.controls['userId'].setValue(this.identification.UserId);
          this.Crypto_Key=this.identification.key;
          this.Crypto_Method=this.identification.method;
          this.Encrypt=this.identification.psw;
          this.onCrypt("Decrypt");
          this.myForm.controls['password'].setValue(this.Decrypt);
      } else {
          this.myForm.controls['action'].setValue("");
        }

  }

waitHTTP( max_loop:number, id:number,event:number){
    const pas=500;
    if (this.j_loop[event]%pas === 0){
      console.log('waitHTTP ==> loop=', this.j_loop[event], ' max_loop=', max_loop, ' [EventHTTP] ' +event+ '  this.EventHTTPReceived=', this.EventHTTPReceived[event]);
    }
    this.j_loop[event]++
    
    this.id_Animation[id]=window.requestAnimationFrame(() => this.waitHTTP(max_loop, id, event));
    if (this.j_loop[event]>max_loop || this.EventHTTPReceived[event]===true){
              console.log('exit waitHTTP ==> loop=', this.j_loop[event], ' max_loop=', max_loop + ' [EventHTTP]  = ' + event+ 'this.EventHTTPReceived=', this.EventHTTPReceived[event]);
              window.cancelAnimationFrame(this.id_Animation[id]);
        }  

    }

GetObject(event:number){
// ****** get content of object *******
      this.HTTP_Address=this.Google_Bucket_Access_Root + this.Google_Bucket_Name + "/o/" + this.Google_Object_Name   + "?alt=media"; 
      // this.HTTP_AddressMetaData=this.Google_Bucket_Access_Root + this.Google_Bucket_Name + "/o/" + this.Google_Object_Name ; 
      console.log('GetObject() - object:', this.Google_Object_Name);
      this.text_error='';
      this.EventHTTPReceived[event]=false;

      this.ManageGoogleService.getContentObject(this.configServer, this.Google_Bucket_Name,this.Google_Object_Name )
      //this.http.get<LoginIdentif>(this.HTTP_Address, {'headers':this.myHeader} )
            .subscribe(data => {
            //console.log(data);
            this.Encrypt_Data = data;
            this.EventHTTPReceived[event]=true;
            console.log('GetObject(); data received from '+ ' [event]' + event + ' '+this.EventHTTPReceived[event]);
            this.Crypto_Key=this.Encrypt_Data.key;
            this.Crypto_Method=this.Encrypt_Data.method;
            this.Encrypt=this.Encrypt_Data.psw;
            
            this.onCrypt("Decrypt");
            let i=0;
            if (this.Encrypt_Data.UserId===this.myForm.controls['userId'].value && this.Decrypt===this.myForm.controls['password'].value){
              // identification is correct
              // send information to XMV Company so that user does not need to re-enter when back on Login page
                this.my_output1.emit(this.Encrypt_Data);
                
               for (this.i=0; this.i<this.ConfigXMV.UserSpecific.length && this.Encrypt_Data.UserId!==this.ConfigXMV.UserSpecific[this.i].id; this.i++){}
                if (this.i<this.ConfigXMV.UserSpecific.length && this.Encrypt_Data.UserId===this.ConfigXMV.UserSpecific[this.i].id && this.ConfigXMV.UserSpecific[this.i].type==='ADMIN') {
                  this.routing_code=1;

                } 
                else if (this.Encrypt_Data.apps!== undefined && this.Encrypt_Data.apps.length>0){

                  this.routing_code=1;// IF IT WORKS THEN ALL THE BELOW WILL BE DELETED
              } else
         
                if (this.Encrypt_Data.UserId==='Event-02JUL2022' || this.Encrypt_Data.UserId==='HO'){
                    this.routing_code=2;
                    window.location.href = "https://xvanstaen.github.io/WeddingPhoto";
                  }
                else if (this.Encrypt_Data.UserId==='Event-27AUG2022'){
                    this.routing_code=3;
                  }
        // don't use routing_code===4
                else if (this.i<this.ConfigXMV.UserSpecific.length && this.Encrypt_Data.UserId===this.ConfigXMV.UserSpecific[this.i].id && this.ConfigXMV.UserSpecific[this.i].type==='ADMIN') {
                    this.routing_code=1;

                  } 
                  else {
                    this.ValidateEventAug();
                    if (this.text_error!==''){
                      this.text_error= this.text_error+" within getObject() after ValidateEventAug() id's are "+ this.Encrypt_Data.UserId + ' ' + this.ConfigXMV.UserSpecific[this.i].id + 'i='+i;
                    }
                  }
                  this.my_output2.emit(this.routing_code.toString());
                  }
              else{
                this.text_error="identification failed - retry";
              }
            },
            error_handler => {
                  // user id not found
                  this.EventHTTPReceived[event]=true;
                  console.log('INIT - error message==> ' + error_handler.message + ' error status==> '+ error_handler.statusText+'   name=> '+ error_handler.name + '   Error url==>  '+ error_handler.url);
                  this.text_error='identification failed on error_handler; retry ';
                  this.routing_code=0;
            } 
        )
    }

ValidateEventAug(){
  this.text_error='';
  for (this.i=0; this.i<this.Table_User_Data.length && (this.Table_User_Data[this.i].UserId!=this.myForm.controls['userId'].value || 
    this.Table_DecryptPSW[this.i]!=this.myForm.controls['password'].value ); this.i++ ){
    }

  if (this.i>=this.Table_User_Data.length){
    // user id not found
    this.text_error='identification failed in validate event Aug; retry - length table is '+this.Table_User_Data.length;
    this.routing_code=0;
  } 
}


ValidateData(){
  this.j_loop[0]=0;
    this.max_j_loop=20000;
    // check that getEventAug() has been received as well as Config
    // id_animation=4; EventHTTPReceived=0
    this.ValidateDataTer(4,0,3);
}

ValidateDataTer(id_anim:number,event:number, eventtwo:number){
  const pas=1000;
  if (this.j_loop[event]%pas === 0){
    console.log('ValidateDataTer ==> loop=', this.j_loop[event], ' max_loop=', this.max_j_loop, '  [EventHTTP0]  = ' + event+' [EventHTTP3]  = ' + eventtwo+  ' this.EventHTTPReceived=', this.EventHTTPReceived[event]);
  }
  this.j_loop[event]++
  
  this.id_Animation[id_anim]=window.requestAnimationFrame(() => this.ValidateDataTer(id_anim,event, eventtwo));
  if (this.j_loop[event]>this.max_j_loop || (this.EventHTTPReceived[event]===true && this.EventHTTPReceived[eventtwo]===true)){
            console.log('exit ValidateDataTer ==> loop=', this.j_loop[event], ' max_loop=', this.max_j_loop+' [EventHTTP0]  = ' + event+' [EventHTTP3]  = ' + eventtwo+  ' this.EventHTTPReceived=', this.EventHTTPReceived[event]);
            window.cancelAnimationFrame(this.id_Animation[id_anim]);
            this.ValidateDataBis();
      }  
}

ValidateDataBis(){

  this.Google_Object_Name = this.myForm.controls['userId'].value;
  console.log('validateData()');
  if (this.Google_Object_Name==='')  {
    this.text_error=" provide your user id";
  }
  else
  if (this.myForm.controls['password'].value==='')  {
    this.text_error=" provide your password";
  }
  else
  {
    // check first if data has been received and if it's related to Event of 27Aug2022

    this.ValidateEventAug();
    console.log('after ValidateEventAug()');
    
    if (this.text_error!== ''){
        // user id not found in EventAug so go through through next validation step which is to check if other objects in the bucket (e.g. EventJuly)
        this.Google_Object_Name=this.Google_Object_Name+this.Google_Object_Name_Extension;
        this.text_error='';

        this.EventHTTPReceived[2]=false;
        // once data is received all validation checks are performed in GetObject() and routing_code is assigned
        this.GetObject(2); 
        // wait for the data from GetObject()
        // id_animation=2; EventHTTPReceived=2
        this.j_loop[2]=0;
        this.waitHTTP(40000,2,2); 
        console.log('after call of getObject()');
    } else {
        this.routing_code=3;
        this.Encrypt_Data.UserId=this.Table_User_Data[this.i].UserId;
        this.Encrypt_Data.id=this.Table_User_Data[this.i].id;
    }
  }
}

getEventAug(event:number){
  console.log('getEventAug(); this.Table_User_Data = ', this.Table_User_Data.length + ' [event]' + event + ' '+this.EventHTTPReceived[event]);
  this.Google_Object_Name="Event-27AUG2022.json";
   
  this.HTTP_Address=this.Google_Bucket_Access_Root + this.Google_Bucket_Name + "/o/" + this.Google_Object_Name   + "?alt=media" ;

  this.HTTP_AddressMetaData=this.Google_Bucket_Access_Root + this.Google_Bucket_Name + "/o/" + this.Google_Object_Name  + "?cacheContro=max-age=0, no-store, private"; 
  this.EventHTTPReceived[event]=false;
  
  this.ManageGoogleService.getContentObject(this.configServer, this.Google_Bucket_Name,this.Google_Object_Name )
  //        this.http.get(this.HTTP_Address, {'headers':this.myHeader} )
            .subscribe((data ) => {
              this.EventHTTPReceived[event]=true;
              console.log('getEventAug() - data received'+ ' [event]' + event + ' '+this.EventHTTPReceived[event]);
              
              this.bucket_data=JSON.stringify(data);
              var obj = JSON.parse(this.bucket_data);
        
              for (this.i=0; this.i<obj.length; this.i++){
                  this.Individual_User_Data= new EventAug;
                  this.Table_User_Data.push(this.Individual_User_Data);
                  this.Table_User_Data[this.i] =obj[this.i];

                  this.Table_DecryptPSW.push(' ');

                  this.Crypto_Key=this.Table_User_Data[this.i].key;
                  this.Crypto_Method=this.Table_User_Data[this.i].method;
                  this.Encrypt=this.Table_User_Data[this.i].psw;
                  this.onCrypt("Decrypt");
                  this.Table_DecryptPSW[this.i]= this.Decrypt;
              }

              },
              error_handler => {
                this.EventHTTPReceived[event]=true;
                console.log('getEventAug() - error handler');
                this.text_error='INIT - error message==> ' + error_handler.message + ' error status==> '+ error_handler.statusText+'   name=> '+ error_handler.name + '   Error url==>  '+ error_handler.url;
              } 

        )
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

onCrypt(type_crypto:string){
    if (type_crypto==='Encrypt'){
            this.Encrypt=encrypt(this.Decrypt,this.Crypto_Key,this.Crypto_Method);
      } else { // event=Decrypt
            this.Decrypt=decrypt(this.Encrypt,this.Crypto_Key,this.Crypto_Method);
          } 
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


}