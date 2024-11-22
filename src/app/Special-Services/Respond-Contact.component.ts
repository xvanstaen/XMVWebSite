import { Component, Input, HostListener, } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { FormGroup, FormControl, Validators} from '@angular/forms';
import { configServer, OneBucketInfo } from '../JsonServerClass';
import { Bucket_List_Info } from '../JsonServerClass';

import { ManageMongoDBService } from '../CloudServices/ManageMongoDB.service';
import { ManageGoogleService } from '../CloudServices/ManageGoogle.service';
import { AccessConfigService } from '../CloudServices/access-config.service';

@Component({
  selector: 'app-Respond-Contact',
  templateUrl: './Respond-Contact.component.html',
  styleUrls: ['./Respond-Contact.component.css']
})

export class RespondContactComponent {

  constructor(
    private router:Router,
    private http: HttpClient,
    private ManageGoogleService: ManageGoogleService,
    private ManageMongoDBService: ManageMongoDBService,
    ) {}
  
    @Input() configServer=new configServer;
    getScreenWidth: any;
    getScreenHeight: any;
    device_type:string='';

    text_error:string=''

    myForm = new FormGroup({
      text: new FormControl('')
    });


    Server_Name:string='Google'; // "Google" or "MyJson"
    Google_Bucket_Access_Root:string='https://storage.googleapis.com/storage/v1/b/';
    Google_Bucket_Access_RootPOST:string='https://storage.googleapis.com/upload/storage/v1/b/';
    //Google_Bucket_Name:string='my-db-json';
    Google_Bucket_Name:string='xmv_messages'; 
    Google_Object_Name:string='';
    /**
    Bucket_Info_Array:any={
      kind:'',
      items:[
      {
          kind: "",
          id: "xmv_messages/Message1.json/1650521172960841", 
          selfLink: "", // link to the general info of the bucket/objectobject
          mediaLink: "", // link to get the content of the object
          name: "", // name of the object
          bucket: "", //name of the bucket
          generation: "", 
          metageneration: "",
          contentType: "", //application/json
          storageClass: "", //STANDARD
          size: "", // number of bytes
          md5Hash: "",
          crc32c: "",
          etag: "",
          timeCreated: "",
          updated: "",
          timeStorageClassUpdated: ""
      }
    ]
    
  }; 
  */

    Bucket_Info_Array:Array<any>=[];
    mySelection:number=0;
    HTTP_Address:string='';
    HTTP_AddressPOST:string='';

    //Error_Access_Server:string='';
    //Error_Access_Server_Post:string='';
    i:number=0;
    bucket_data:string='';
    //Contact_Message:any=
    //        {name:'Xavier', email:'xvanstaen@gmail.com ', mobile:'82680480', subject:'MyWebSite', text:'Google Cloud storage and HTTP GET'};

    message:string='';
    message_list:string='';
    //bucket_name_list:string='';
    Mydata:any= {
        name: '1A',
        email: '2A',
        mobile: '3',
        subject: '4',
        text: '5'    
      }
    myDate:string='';
    myTime=new Date();
    thetime:number=0;
    @Input() MyVar: string='';

    display_message:boolean=false;


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
     // ****** get bucket *******
     /***
      this.HTTP_Address=this.Google_Bucket_Access_Root + this.Google_Bucket_Name;
      this.http.get(this.HTTP_Address )
            .subscribe(data => {
                  this.bucket_data=JSON.stringify(data);
                },   
                error_handler => {
                     alert(' get bucket failed = ' + this.HTTP_Address);
                  } 
            )
       */
     // list of objects excluding {prefix} e.g. dbXMV-Messages (only db.json is then returned in the list)
     //`https://storage.googleapis.com/storage/v1/b/xmv_message/o`?delimiter=dbXMV-Messages

      // ****** get list of objects  *******
      //this.http.get<any>(this.HTTP_Address )
      this.HTTP_Address=this.Google_Bucket_Access_Root + this.Google_Bucket_Name + "/o";
      this.ManageGoogleService.getListMetaObjects(this.configServer, this.Google_Bucket_Name)
            .subscribe(data => {
                
              this.Bucket_Info_Array=data;
                  
                  for (this.i=0; this.i<this.Bucket_Info_Array.length-1; this.i++ ){
                          this.message_list= this.message_list + ' ==== ' + this.Bucket_Info_Array[this.i].items.name ;
                          // this.bucket_name_list=this.bucket_name_list+this.Bucket_Info_Array.items[this.i].name;
                  }
                },   
                error_handler => {
                    this.message='error message==> ' + error_handler.message + ' error status==> '+ error_handler.statusText+'   name=> '+ error_handler.name + '   Error url==>  '+ error_handler.url;
                    // alert(this.message  + ' -- http get = ' + this.HTTP_Address);
                  } 
            )
      
      // ****** create an object *******          
      // this.HTTP_AddressPOST='https://storage.googleapis.com/upload/storage/v1/b/xmv_messages/o?name=Message2.json&uploadType=media'
      // https://storage.googleapis.com/storage/v1/b/xmv_messages/o?name=Message1650555790998.json&uploadType=media
      //this.myDate= this.myTime.toString().substring(8,24);
      //this.thetime=this.myTime.getTime();
      //this.HTTP_AddressPOST=this.Google_Bucket_Access_RootPOST + this.Google_Bucket_Name + "/o?name=Message" + this.thetime  + '.json&uploadType=media';
      /*
      this.http.post(this.HTTP_AddressPOST, this.Contact_Message )
            .subscribe(res => {
              this.Error_Access_Server_Post=JSON.stringify(this.Contact_Message) + " RETURN ==> " + JSON.stringify(res) + ' -- http post  has no errors = ' + this.HTTP_AddressPOST;
                  // alert('Created Successfully');  
                  },
                  error_handler => {
                    this.Error_Access_Server_Post= "  object ===>   " + JSON.stringify(this.Contact_Message)  + '   error message: ' + error_handler.message + ' error status: '+ error_handler.statusText+' name: '+ error_handler.name + ' url: '+ error_handler.url;
                    // alert(this.Error_Access_Server_Post + ' --- ' +  this.Sent_Message + ' -- http post = ' + this.HTTP_AddressPOST);
                  } 
             )
       */
    }

onSubmit(mySelection:any){
this.MyVar = mySelection.items.name;
this.Google_Object_Name = mySelection.items.name;
this.GetObject();
}

GetObject(){
// ****** get content of object *******
this.HTTP_Address=this.Google_Bucket_Access_Root + this.Google_Bucket_Name + "/o/" + this.Google_Object_Name   + "?alt=media"; 
//this.http.get(this.HTTP_Address )
this.ManageGoogleService.getContentObject(this.configServer, this.Google_Bucket_Name,this.Google_Object_Name )
      .subscribe(data => {
            this.Mydata = data;
            this.display_message=true;
            this.message="name: " + this.Mydata.name+ "  email: " + this.Mydata.email+"  mobile: " + this.Mydata.mobile+"  subject: " + this.Mydata.subject+"  text: " + this.Mydata.text;
            // alert('Uploaded Successfully' + this.Mydata.name + " -- " + this.Mydata.email);
            },
            error_handler => {
              this.message='error message==> ' + error_handler.message + ' error status==> '+ error_handler.statusText+'   name=> '+ error_handler.name + '   Error url==>  '+ error_handler.url;
              // alert(this.message  + ' -- http get = ' + this.HTTP_Address);
            } 
      )
}

onSendMsg(){
  const message = this.myForm.controls['text'].value;

  if (message==='')  {
    this.text_error="   ERROR ==>    enter a text";
  }
  else
  {
    this.text_error='';
    this.myForm.controls['text'].setValue('Name: ' + this.Mydata.name + '  email: ' + this.Mydata.email +
    '  Subject: ' + this.Mydata.subject + '   my response is  **** '  + message + '  ****  ');

  }

}

onClear(){
  this.myForm.reset({
   text: '',
  });
  
}

}