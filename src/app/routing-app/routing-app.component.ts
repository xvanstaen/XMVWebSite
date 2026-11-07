import { Component, OnInit, signal, SimpleChanges,
   Input } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule} from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormGroup, FormControl, Validators,} from '@angular/forms';

import { ColorPickerComponent } from '../color-picker/color-picker.component';
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { configServer } from '../JsonServerClass';

import { ManageGoogleService } from '../CloudServices/ManageGoogle.service';


@Injectable({
    providedIn: 'root'
})

@Component({
  selector: 'app-routing-app',
  templateUrl: './routing-app.component.html',
  styleUrls: ['./routing-app.component.css'],
  standalone:true,
  imports:[CommonModule, FormsModule, ReactiveFormsModule, MatIconModule, ColorPickerComponent],
})
export class RoutingAppComponent implements OnInit {

  @Input() selectApps:number=0;
  @Input() configServer=new configServer;
  
  debug:boolean=false;

  Error_Access_Server=signal<string>("");

  UserId_Data:any={
    id: 0,
    key:0,
    method:'',
    UserId:'',
    psw:'',
    phone:''
  }
  
  mystring: string='';
  myDiv:any;  
  mySlider:any;
  myOutput:any;
  myValue:number=0;
  otherValue:number=0;
  
  my_input_child1:string='';
  my_input_child2:string='';
  my_output_child1:string='';
  my_output_child2:string='';

  selected_color:string='';

  AngularWebSite:Array<any>=[
    {id:0,
    topic:'',
    url:'',
    }
  ];

  HTTPstring:string='';
  JsonServer:string='';

  Length_Array:number=0;

  uploadFileName: string='';
  uploadFileContent:string='';
  readFileContent:string=''

  myreader = new FileReader() ;
  i:number=0;
  myMSG:string='';

  data= {
    title: '',
    file: '',
    myfile: '',
    other: '',
    desc: ''    
  }

  
  /* to be used by openFile() */ 
  // TO BE CHANGED
  myForm = new FormGroup({
    name: new FormControl('', {validators:[Validators.required, Validators.minLength(3)], nonNullable: true}),
    file: new FormControl('',{validators:[ Validators.required], nonNullable: true}),
    fileSource: new FormControl('', {validators:[Validators.required], nonNullable: true}),
  });

  

  // Boolean to display the features 
  isDisplayLogos=signal<boolean>(false);
  isDisplayTelephone=signal<boolean>(false);
  isDisplaySlider=signal<boolean>(false);
  isDisplayColorPicker=signal<boolean>(false);
  isDisplayCSSTable=signal<boolean>(false);
  isDisplayUploadFile=signal<boolean>(false);
  isDisplaySaveDownload=signal<boolean>(false);

  isDisplayEncrypt=signal<boolean>(false);

  TheSelectDisplays: FormGroup = new FormGroup({ 
    Logos: new FormControl('N', { nonNullable: true }),
    Telephone: new FormControl('N', { nonNullable: true }),
    Slider: new FormControl('N', { nonNullable: true }),
    ColorPicker: new FormControl('N', { nonNullable: true }),
    CSSTable: new FormControl('N', { nonNullable: true }),
    UploadFile: new FormControl('N', { nonNullable: true }),
    SaveDownload: new FormControl('N', { nonNullable: true }),
    KEHP: new FormControl('N', { nonNullable: true }),
})

Encrypt=signal<string>("");
Decrypt=signal<string>("LIM!12monica#Chin");
Crypto_Method:string='AES';
Crypto_Error=signal<string>("");
Crypto_Key:number=2;
Crypto_iFour:number=0;
Server_Type:string='Google';
Bucket_Name:string='manage-login';
Object_Name:string='XMVIT-Admin';
Encrypt_Data={
  id: 3,
  encrypted:'',
  decrypted:'',
  key:0,
  method:''
}

  constructor(
    private router:Router, 
    private http: HttpClient,
    private ManageGoogleService: ManageGoogleService,
    ) {}

  docDiv:any;
  posDiv={
    Top:0,
    Left:0,
  }
  myPosPalette:number=0;
  getPosDiv(){
    if (document.getElementById("posBeforeColorPicker")!==null){
        this.docDiv = document.getElementById("posBeforeColorPicker");
        this.posDiv.Left = this.docDiv.offsetLeft;
        this.posDiv.Top = this.docDiv.offsetTop;
        this.myPosPalette=this.docDiv.offsetParent.offsetTop;
        
    }
    }

ngOnInit() {
   this.getPosDiv();
   //this.log('routing-app - init --- configServer.google='+this.configServer.googleServer);

    // this.log('ngOnInit of routing-test.ts')
    this.my_input_child1='red';
    this.my_input_child2='red';
    this.selected_color =this.my_input_child1;
    this.Error_Access_Server.set("");
    this.HTTPstring='http://localhost:3000/myTopicsURL/';
    
    // get the first item to know the size of the table which is stored in element '.topic'
    // first parameter is id to retrive in JsonServer and seecond parameter is occurence of array to fill-in 
    this.JsonServer=this.HTTPstring+1;
    
      const item=this.selectApps-1; 
      const event='Y-'+ item.toString();
      this.SelRadio(event);
  this.auth.userId=this.configServer.userLogin.id;
  this.auth.psw=this.configServer.userLogin.psw;
  }


displayCSSTable(){
  this.http.get<any>(this.JsonServer)
  .subscribe(data => {
      this.AngularWebSite[0]=data;
      this.Length_Array=Number(this.AngularWebSite[0].topic);

      // create right size of the array; [0] alreay exists
      for (this.i=0; this.i<this.Length_Array; this.i++){
              this.AngularWebSite.push(this.AngularWebSite[0]);
            }

      // retrieve the entire table
      this.http.get<any>(this.HTTPstring)
          .subscribe(data => {
                //this.log('data = ', data);
                this.AngularWebSite=data;
            }
            )
    },
      error_handler => {
            //this.handleError('routing-app', '');
            this.Server_Error(error_handler);
      
    }  
      )
    ;
}

  SelRadio(event:any){
    const i = event.substring(2);
    const NoYes=event.substring(0,1);
    if (i==='1'){
      if (NoYes==='Y'){
          this.isDisplayLogos.set(true);
      } else {
          this.isDisplayLogos.set(false);
      }
    } else if (i==='2'){
        if (NoYes==='Y'){
          this.isDisplayTelephone.set(true);
        } else {
          this.isDisplayTelephone.set(false);
        }
    } else if (i==='3'){
        if (NoYes==='Y'){
          this.isDisplaySlider.set(true);
        } else {
          this.isDisplaySlider.set(false);
        }
      } else if (i==='4'){
        if (NoYes==='Y'){
          this.isDisplayColorPicker.set(true);
        } else {
          this.isDisplayColorPicker.set(false);
        }
      } else if (i==='5'){
        if (NoYes==='Y'){
          this.isDisplayEncrypt.set(true);
        } else {
          this.isDisplayEncrypt.set(false);
        }
      } 
      else if (i==='6'){
        if (NoYes==='Y'){
          this.displayCSSTable();
          this.isDisplayCSSTable.set(true);
        } else {
          this.isDisplayCSSTable.set(false);
        }
      } else if (i==='7'){
        if (NoYes==='Y'){
          this.isDisplayUploadFile.set(true);
        } else {
          this.isDisplayUploadFile.set(false);
        }
      } else if (i==='8'){
        if (NoYes==='Y'){
          this.isDisplaySaveDownload.set(true);
        } else {
          this.isDisplaySaveDownload.set(false);
        }
      }
  }




Server_Error(error:HttpErrorResponse){
  this.Error_Access_Server.set('Cannot access server for '+ error.url);
  // this.log('error',error);
}


//@HostListener('window:touchstart', ['$event'])
//@HostListener('window:touchmove', ['$event'])
//@HostListener('window:touchend', ['$event'])
isTouch=signal<boolean>(false);
touchValue:number=0;
selectedPos={x:0,y:0};
msg:string='';
nbMoves:number=0;
nbTouchStart:number=0;
myEvent={
  currentTargetV:"",
  targetV:"",
  id:""
}
onTouchStart(event:any){
  this.isTouch.set(true);
  this.myEvent.currentTargetV=event.currentTarget.value;
  this.myEvent.targetV=event.target.value;
  this.myEvent.id=event.target.id;
  if (event.currentTarget.value!==undefined){
    this.myValue=Number(event.currentTarget.value);
  }
  this.nbTouchStart++;

  if (event.type==='touchstart'){
      this.msg='touchstart ok; nb of touch start=' + this.nbTouchStart;
      var touch = event.touches[0] || event.changedTouches[0];
  this.msg=this.msg+' touch.pageX='+touch.pageX+'  touch.pageY=' + touch.pageY + '   touch.screenX='+ touch.screenX+
  '   touch.screenY='+ touch.screenY ;
  }  if (event.type==='touchmove'){
    this.msg='touchmove ok; nb of touch start=' + this.nbTouchStart;
    var touch = event.touches[0] || event.changedTouches[0];
this.msg=this.msg+' touch.pageX='+touch.pageX+'  touch.pageY=' + touch.pageY + '   touch.screenX='+ touch.screenX+
'   touch.screenY='+ touch.screenY ; 
    }  else {this.msg='event.type = '+event.type};
  
  

}

msgMove:string='';
onTouchEnd(event:TouchEvent){
  this.msg='event.type = '+event.type;
  this.isTouch.set(false);
  this.msgMove='';
  this.nbMoves=0;

}
onTouchMove(event:TouchEvent){
  if (this.isTouch()){
    this.nbMoves++;
    this.msgMove='nbMoves='+this.nbMoves;
    this.onTouchStart(event);
  }
}

msgReturnValue:string="";
returnValue(event:any){
  this.msgReturnValue="";
  if (event.type==='touchstart'){
      this.msgReturnValue="goto onTouchStart from returnValue";
      this.onTouchStart(event);
  }
  this.otherValue = event.currentTarget.valueAsNumber;
  this.myValue=Number(event.currentTarget.value);
  // this.log('event',this.mystring,  event );
  //this.mySlider = document.getElementById("myRange");
  //this.myValue =this.mySlider.value;
  // this.log('values: myOutput', this.otherValue, 'myValue=', this.myValue);
  }

ClearDiv(){
  this.TheSelectDisplays.controls['KEHP'].setValue('N');
  this.router.navigateByUrl('myKEHP');
  }

  ToColorPicker(){

    this.router.navigateByUrl('myColorPicker');
  }

  MyFitnessStat(){
    this.router.navigateByUrl('myFitnessStat');
  }


  /******  How to highlight PROGRESS of UPLOAD  ======= */

  /* === 1st method to upload file (no http invoked) ====== */


  public async onFileSelected(event:any) {
    /*
        When the change event gets triggered, the file is not automatically uploaded to the backend by the browser. 
        Instead, we will need to trigger an HTTP request ourselves, in response to the change event.
      */
     // this.log('event file ', event);
    const file:File = event.target.files[0];
    this.uploadFileName = file.name;
    this.uploadFileContent = await file.text(); 
    this.data.title=this.myForm.controls['name'].value;
    this.data.file=this.uploadFileContent;
    this.data.myfile='';
    this.data.other='$$$$$$$$$';
    this.data.desc='===========';
    // if needs to be sent to JSONserver then needs to trigger process related to HTTP  
    this.http.post('http://localhost:3000/posts',this.data )
        .subscribe(res => {
              this.log('content =', this.data);
              alert('Uploaded Successfully');
    })
    this.data.file='QWERTYIASDFGUXCBV';
    this.http.put('http://localhost:3000/posts/4',this.data )
        .subscribe(res => {
              this.log('content =', this.data);
              alert('Uploaded Successfully');
    })

  }
  
  public async getTextFile(file:any) {
        this.uploadFileContent = await file.text(); 
        this.log('in getTextFile = ', this.uploadFileContent);
    return(this.uploadFileContent);
  }
  
  
  
  public saveFileName = "test";
  public saveFileContent = '{ "name": "test"}';
  public saveFileExtension = 'json';
  public myFile:any;
  /* =========== DOWNLOAD file in Download folder ========== */

  public onSaveFile(): void {
    let fileName = this.saveFileName + '.' + this.saveFileExtension;
    let fileContent = this.saveFileContent;
  
    const file = new Blob([fileContent], { type: "text/plain" });
  
    const link = document.createElement("a");
    this.log('Link ',link);
    link.href = URL.createObjectURL(file);
    this.log('link.href', link.href);
    link.download = fileName;
    link.click();
    link.remove(); 
  }

  // ======= upload file via http method / usage of a fake JSON server or file.io ======
     
  onFileChange(event:any) {
    if (event.target.files.length > 0) {
      const file:File = event.target.files[0];
      this.myFile = event.target.files[0];
      // PatchValue is used to update only a subset of the elements of the FormGroup or FormArray . 
      // It only updates the matching objects and ignores the rest.
      
// COMPILATION ERROR - CHECK HOW TO CORRECT IT
      // this.myForm.patchValue({ fileSource: file});
    }
  }

  auth={
    userId:"",
    psw:"",
    crypto:true
  };
  

  
  onCrypt(event:any){
  
    this.Crypto_Error.set("");
   
    if (event==='Encrypt'){
  
        if (this.Decrypt()===''){
          this.Crypto_Error.set("Decrypt field is empty");
        } else if (this.Crypto_Method==='AES' || this.Crypto_Method==='DES'){
          this.Encrypt.set("");
          this.ManageGoogleService.encryptAllFn(this.configServer,this.Decrypt(),this.Crypto_Key,this.Crypto_Method, this.Crypto_iFour, JSON.stringify(this.auth) )
          .subscribe((data ) => {
    
              if (data.response !== 'Key invalid'){
                this.Encrypt.set(data.response);
                this.log(this.Decrypt(), " , ", this.Encrypt());
              } else {
                this.Crypto_Error.set('encrypt request failed; invalid key');
              }
            }, 
            err => {
              this.log(JSON.stringify(err));
              this.Crypto_Error.set('encrypt request failed; error code=' + err.status); 
            })
        }
  
     
          else { 
            this.Crypto_Error.set("Wrong method for crypto. Must be either 'AES' or 'DES'");
        } 
  
    } else { // event = Decrypt
      
        if (this.Encrypt()===""){
          this.Crypto_Error.set("Encrypt field is empty");
        } else
        if (this.Crypto_Method==='AES' || this.Crypto_Method==='DES'){
          this.Decrypt.set("");
          this.ManageGoogleService.decryptAllFn(this.configServer,this.Encrypt(),this.Crypto_Key,this.Crypto_Method,  this.Crypto_iFour, JSON.stringify(this.auth))
          .subscribe((data ) => {
            this.log(data);
            if (data.response !== 'Key invalid' && data.response !== ''){
              this.Decrypt.set(data.response);
              this.log(this.Decrypt(), " , ", this.Encrypt());
            } else  {
              if (data.response === 'Key invalid'){
                this.Crypto_Error.set('decrypt request failed; invalid key');
              } else {
                this.Crypto_Error.set('encrypted data could not be decrypted');
              }
            }
          }, 
          err => {
              this.log(JSON.stringify(err));
              this.Crypto_Error.set('decrypt request failed; error code=' + err.status); 
          } )
        
        
        } else { 
          this.Crypto_Error.set("Wrong method for crypto. Must be either 'AES' or 'DES'");
        } 
        
      }
  
  
  }
  onClear(){
    this.Decrypt.set("");
    this.Encrypt.set("")
  }
  
     
  

requestPromise() {
  return new Promise((resolve, reject) => {
    const reader = new FileReader() ;
   
    
    //reader.onload = () => {
    //  resolve(reader.result);
    //};
    
    reader.onload = function () {
      resolve(JSON.stringify(reader.result));
      console.log('async: ', reader.result);
    
    };
    reader.onerror = function (error) {
      reject(error);
      console.log('Error: ', error);
    };
     /*
    The main methods:
        readAsArrayBuffer(blob) – read the data in binary format ArrayBuffer.
        readAsText(blob, [encoding]) – read the data as a text string with the given encoding (utf-8 by default).
        readAsDataURL(blob) – read the binary data and encode it as base64 data url.
        abort() – cancel the operation.
    */
        reader.readAsDataURL(this.myFile) ;
        //reader.readAsText(this.myFile);
    
  }) 
}


submit(event:any){
    const formData = new FormData();
// 16MAY2023 Error at compilation - string vs file
    // const file:File = this.myForm.controls['fileSource'].value;
    const fileName=this.myForm.controls['name'].value;

    if (this.myForm.controls['name'].value!=='' && this.myForm.controls['file'].value!==''){
      const myText=this.getTextFile(this.myFile); // FOR TEST PURPOSE to get content of file with await function

    // 16MAY2023 Error at compilation - string vs blob
      //formData.append('file', this.myForm.controls['fileSource'].value);
        
        //***************************************************** */
        // then start the server:  json-server --watch db.json
        //***************************************************** */
        
      /*
      const upload$ = this.http.post("http://localhost:3000/posts", formData);

      upload$.subscribe(res => {
        this.log(res);
        this.myMSG='Uploaded Successfully.' + JSON.stringify(res);
        alert(this.myMSG);
      });
      
      //  this.http.post("http://localhost:3000/posts", formData)
      //  this.http.post('https://jsonplaceholder.typicode.com/posts',formData)
      //  this.http.post('http://file.io', formData) // this one works

      /*=============================*/


    // == Convert file content to Base64 ==
      /*
            const reader = new FileReader() ;
            // reader.readAsDataURL(this.myForm.controls['fileSource'].value);
            reader.readAsDataURL(this.myFile) 
            //reader.readAsText(this.myFile);

            reader.onload = function () {
      
              this.log('reader.result = ', reader.result);
            };
            reader.onerror = function (error) {
              this.log('Error: ', error);
            };
            this.myMSG = reader.result as string;
     
       */     
      
      // myText contains data returned by getTextFile and is equivalent to this.uploadFileContent
      //function(value) {this.log('the value ', value)}
      
      const myReader=this.requestPromise().then((result) => {
        this.mystring=JSON.stringify(result);
        // 16MAY2023 Error at compilation - string vs nb
        //this.data.title=this.myForm.controls['name'].value;
        this.data.file=this.uploadFileContent;
        this.data.myfile=this.mystring;
        this.data.other='$$$$$$$$$';
        this.data.desc='===========';
     
        //this.log ('== data = ', this.data);
        this.http.post('http://localhost:3000/myfile',this.data )
            .subscribe(res => {
              alert('Uploaded Successfully.');
            })
        return result});


      /*-------
      this.http.post('http://localhost:3000/posts',formData)
        .subscribe(res => {
          this.log(res);
          this.myMSG='Uploaded Successfully.' + JSON.stringify(res);
          alert(this.myMSG);
        })
      ------*/
        
    }
      else if (this.myForm.controls['name'].value===''){
        this.myForm.controls['name'].setErrors({'invalid': true, 'required': true});
        this.myForm.controls['name'].markAsTouched();
      } 
      /** 
        else if (this.myForm.controls['file'].value===''){
          this.myForm.controls['file'].setErrors({'invalid': true, 'required': true});
          this.myForm.controls['file'].markAsTouched();
        }
      */
  }

  /* ------ Code on HttpRequest(), POST method ==== NOT ADAPTED & TESTED

    var xhr = new XMLHttpRequest();
    xhr.open("POST", yourUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        value: value
    }));

    function makeRequest (method, url, data) {
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.onload = function () {
          if (this.status >= 200 && this.status < 300) {
            resolve(xhr.response);
          } else {
            reject({
              status: this.status,
              statusText: xhr.statusText
            });
          }
        };
        xhr.onerror = function () {
          reject({
            status: this.status,
            statusText: xhr.statusText
          });
        };
        if(method=="POST" && data){
            xhr.send(data);
        }else{
            xhr.send();
        }
      });
    }


  */

  private log(...args: unknown[]) {
    if (this.debug) console.log('[Routing-app:]', ...args);
  }

}
