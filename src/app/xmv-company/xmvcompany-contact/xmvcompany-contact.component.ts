import { Component, OnInit, Input } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl, UntypedFormControl, Validators} from '@angular/forms';

import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { ManageMongoDBService } from 'src/app/CloudServices/ManageMongoDB.service';

import { configServer } from 'src/app/JsonServerClass';

// import { SearchCountryField, CountryISO, PhoneNumberFormat } from 'ngx-intl-tel-input';


//The Google Cloud Storage JSON API endpoint is located at 
// https://www.googleapis.com/storage/v1/[BUCKET] to access the bucket

// https://storage.googleapis.com/download/storage/v1/b/BUCKET_NAME/o/OBJECT_NAME?alt=media


@Component({
  selector: 'app-xmvcompany-contact',
  templateUrl: './xmvcompany-contact.component.html',
  styleUrls: ['./xmvcompany-contact.component.css']
})
export class XMVCompanyContactComponent implements OnInit {

  
  constructor(

    private http: HttpClient,
    private ManageGoogleService: ManageGoogleService,
    private ManageMongoDBService: ManageMongoDBService,
    ) {}

@Input() configServer=new configServer;

Server_Name:string='Google'; // "Google" or "MyJson"
Google_Bucket_Access_Root:string='https://storage.googleapis.com/storage/v1/b/';
Google_Bucket_Access_RootPOST:string='https://storage.googleapis.com/upload/storage/v1/b/';
Google_Bucket_Name:string='xmv_messages'; 
// projectId:string = 'xmv-web-site'
// keyFilename:string = '/Users/xaviervanstaen/GCloud-JsonServer-Key.json'

HTTP_Address:string='';


i_error:number=0;
name_error:string='';
mobile_error:string='';
subject_error:string='';
text_error:string='';
email_error:string='';
current_event:string='';

pos1_string:number=0;
pos2_string:number=0;

  // data that will be sent via http.post and received via http.get
Sent_Message:object=
    {Name:'', email:'', mobile:'', subject:'', text:''};

myDate:string='';
myTime=new Date();
thetime:number=0;

separateDialCode = true;
 // SearchCountryField = SearchCountryField;
  //CountryISO = CountryISO;
  //PhoneNumberFormat = PhoneNumberFormat;
  //preferredCountries: CountryISO[] = [CountryISO.Singapore, CountryISO.France, CountryISO.SouthKorea, CountryISO.HongKong];
   // phoneForm = new FormGroup({
   //   phone: new FormControl(undefined, [Validators.required])
   // });
phoneNumber:number=0;

myContactForm = new FormGroup({
    name: new UntypedFormControl('', [Validators.required, Validators.minLength(3)]),
    email: new UntypedFormControl('', [Validators.required, Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")]),
    phone: new UntypedFormControl(undefined, [Validators.required]),
    subject: new UntypedFormControl('', Validators.required),
    text: new UntypedFormControl('', [Validators.required, Validators.minLength(10)])
  });

ngOnInit(): void {
    
  }

BackTo(event:any){

  }

onSubmit(event:any){
  
    this.name_error='';
    this.email_error='';
    this.subject_error='';
    this.text_error='';
    this.mobile_error='';
    this.current_event=event;

    if (this.i_error===10){
      this.i_error=0
    }
    else {
          this.i_error=0;
          //if (event==='mobile' && isNaN(Number(this.myContactForm.controls['phone'].value))===true){
          //  this.mobile_error='phone number must be numeric';
          //} else 
          if (this.myContactForm.controls['name'].value===''){
            this.name_error='name is required';
            this.i_error=1;
          } else if ( this.myContactForm.controls['name'].value.length<3){
            this.name_error='name must have 3 characters at least';
            this.i_error=1;
          } else if ( this.myContactForm.controls['email'].value===''){
            this.email_error='email is required';
            this.i_error=1;
          } else if (this.myContactForm.controls['email'].value!==''){
              // validate structure of email address / should have a @ and at least a . after
              this.pos1_string=this.myContactForm.controls['email'].value.indexOf('@');
              if (this.pos1_string===-1){
                this.email_error= 'wrong email - does not contain special character @';
                this.i_error=1;
                } else if (this.myContactForm.controls['email'].value.substring(this.pos1_string).indexOf('.')===-1) {
                    this.email_error='wrong email - dot "." missing after special character @';
                    this.i_error=1;
                  } 
          } 
          if (this.i_error===0){
              if ( event!=='name' && event!=='email' && this.myContactForm.controls['subject'].value===''){
                this.subject_error='subject is required';
              } else if (this.myContactForm.controls['subject'].value!=='' && this.myContactForm.controls['text'].value===''){
                this.text_error='text is required';
              } else if (this.myContactForm.controls['text'].value!=='' && this.myContactForm.controls['text'].value.length<10){
                this.text_error='text must have 10 characters at least';
               // } else if (this.myContactForm.controls['phone'].invalid===true && this.myContactForm.controls['phone'].value!==null){
               //   this.mobile_error='phone number is invalid';
                      //***************************************************************************** */
                      // then start the server:  json-server --watch db.json or Google CLoud Storage  //
                      //***************************************************************************** */
                  } else if (event==='submit'){
                          if (this.Server_Name="Google"){
                            this.myDate= this.myTime.toString().substring(8,24);
                            this.thetime=this.myTime.getTime();
                            this.HTTP_Address=this.Google_Bucket_Access_RootPOST + this.Google_Bucket_Name + "/o?name=Message" + this.thetime  + '.json&uploadType=media';
                              } 
                          else {
                            this.HTTP_Address='http://localhost:3000/XMV_Messages';
                          }
                              
    var file=new File ([JSON.stringify(this.myContactForm.value)],  "Message" + this.myDate  + '.json' ,{type: 'application/json'});
    this.ManageGoogleService.uploadObject(this.configServer, this.Google_Bucket_Name, file ,  "Message" + this.myDate  + '.json')
    // this.http.post(this.HTTP_Address,this.myContactForm.value )
                                .subscribe(res => {
                                  if (res.type===4){
                                  alert('message sent successfully');
                                  this.Clear(1);
                                  }
                                  },
                                error_handler => {
                                  alert(error_handler.message + '  '+ error_handler.statusText)
                                  }
                                )
                    }
              }
        }
          
    }

Clear(event:any){
    this.name_error='';
    this.email_error='';
    this.subject_error='';
    this.text_error='';
    this.mobile_error='';
    this.myContactForm.setErrors(null);
    this.myContactForm.reset({
            name: '',
            email: '',
            phone: '',
            subject: '',
            text: ''
        });
      this.i_error=10;
  }

changePreferredCountries() {
		//this.preferredCountries = [CountryISO.Singapore];
	}

submitPhone(){
    if (this.myContactForm.controls['phone'].valid) {
           this.phoneNumber = this.myContactForm.controls['phone'].value;
      }
    }


}

