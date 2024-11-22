import { Component, OnInit , Input, Output, HostListener, OnChanges, HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
import { saveAs } from "file-saver";

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router} from '@angular/router';
import { FormGroup, FormControl, Validators} from '@angular/forms';

import { XMVTestProd, configServer, LoginIdentif , classUserLogin, classCredentials, EventAug, Bucket_List_Info } from '../JsonServerClass';
import { classMainFile , classStructure, classDetails, classTabLevel0, classTabLevel1, classTabLevel2, classTabLevel3, classTabLevel4} from "./exportClassMasterCONFIG";
import { classMainOutFile , classOutStructure, classOutDetails, classOutTabLevel0, classOutTabLevel1, classOutTabLevel2, classOutTabLevel3, classOutTabLevel4} from "./exportClassMasterCONFIG";

import { onXMLtoJSON } from "./convertXMLtoJSON";
import { onJSONtoXML } from "./convertJSONtoXML";
import { processDetails, copyDetails, removeSpecChar, copyData, copyMainOuttoMain, copyMainToMainOut } from "./commonFns"
import { fnExtractParam, fnProcessScript } from "./scriptFns"

import { ManageGoogleService } from '../CloudServices/ManageGoogle.service';
import { ManageMongoDBService } from '../CloudServices/ManageMongoDB.service';

export class classParamFiles{
  name:string="";
  bucket:string="";
  server:string="";
}

export class classFilterParam{
  tag:string="";
  field:string="";
}


@Component({
  selector: 'app-kiosk-abd-config',
  templateUrl: './kiosk-abd-config.component.html',
  styleUrl: './kiosk-abd-config.component.css'
})
export class KioskAbdConfigComponent {
  constructor(
    private router:Router,
    private http: HttpClient,
    private ManageGoogleService: ManageGoogleService,
    private ManageMongoDBService: ManageMongoDBService,
    ) {}
    @Input() identification=new LoginIdentif; 
    @Input() configServer=new configServer;
    @Input() devMode:string="";
    //@Input() credentials = new classCredentials;
    //@Input() credentialsMongo = new classCredentials;
    //@Input() credentialsFS = new classCredentials;

  
    myForm: FormGroup = new FormGroup({
      dataXML: new FormControl('', { nonNullable: true }),
      server: new FormControl('', { nonNullable: true }),
      fileName: new FormControl('', { nonNullable: true }),
      fileNameXML: new FormControl('', { nonNullable: true }),
      fileScriptName: new FormControl('sscript001', { nonNullable: true }),
      bucket: new FormControl('', { nonNullable: true }),
      object: new FormControl('', { nonNullable: true }),
      actionXML: new FormControl('NoAction', { nonNullable: true }),
      searchDomain: new FormControl('ComputerName=', { nonNullable: true }),
      searchField: new FormControl('ComputerName=', { nonNullable: true }),
      searchStartValue: new FormControl('LHR4KSKA01', { nonNullable: true }), // LHR4KSKA01
      searchEndValue: new FormControl('LHR5KSKB02', { nonNullable: true }), // TOAN-GROUPABD02PC

    })

    theId:string="";

    scriptFn:Array<any>=["<#domain ","<#select ","<#replace ","<#filter "];
    paramFiles:Array<classParamFiles>=[];

    scriptFileName:Array<string>=[];
    scriptFileContent:Array<string>=[];
    currentScript:number=-1;

    isScriptRetrieved:boolean=false;
    isConfirmSaveScript:boolean=false;
    modifiedScriptContent:string="";
    busckeScript:string="xml_configuration";
    scriptError:string='';

    selectOneServer:boolean=true;
    selectedServer:string="";
    isSelectServer:boolean=false;

    isConfirmSave:boolean=false;
    isConfirmSaveXML:boolean=false;
    afterSave:string="";
    noSubmit:boolean=false;

    theInputRecord:string="";
    theRecord:string="";
    isFileRead:boolean=false;
    isFileLocal:boolean=false;
    isFileServer:boolean=false;

    error:string="";
    GoogleBucket:string="xml_configuration"; 
    // Configuration file
    GoogleObject:string="ABDMasterConfig.cfg";
    GoogleObjectOut:string="ABDMasterConfigExtract00.cfg"
    iWait:number=0;

    //======
    mainJSON=new classMainFile;
    mainOutJSON=new classMainOutFile;

    iLevelJSON:Array<number>=[];

    isXMLRetrieved:boolean=false;
    isDisplayXML:boolean=true;
    isMainJson:boolean=false;

    // Tracking updates
    tempMainJson=new classMainFile;
    tempXML:string=""

    paramInputFile:Array<classParamFiles>=[]
    //nameRetrievedFile:string='';
    //fileType:string="";
  
    nameLocation:string="";
    domainTabParam=['field="','value="'];
    selectTabParam:Array<string>=['tag="','field="', 'fromValue="', 'toValue="'];
    filterTabParam=['tag="','field="'];
    replaceTabParam:Array<string>=['tag="','refField="', 'withValue="', 'changeField="'];

    processFile:boolean=false;
    specQuote='"';
    stdQuote="'"

  ngOnInit(): void {
      // this.getDefaultCredentials(); // needed if HTTP is used
      for (var i=0; i<6; i++){
        this.iLevelJSON[i]=-1;
      }
  }

  ngAfterViewInit(){
            // SHOULD COME FROM USER INFO FILE
      this.myForm.controls['fileName'].setValue(this.GoogleObjectOut); // output file
      this.myForm.controls['bucket'].setValue(this.GoogleBucket); 
      this.myForm.controls['object'].setValue(this.GoogleObject); // input file

      this.myForm.controls['fileNameXML'].setValue("XML"+this.GoogleObjectOut);
  }

  open(event: Event) { // used to upload file
    this.processFile=true;
    if (event.currentTarget instanceof HTMLInputElement && event.currentTarget.id!==undefined && event.currentTarget.id!==null){
      this.theId=event.currentTarget.id; 
    }
    if (event.target instanceof HTMLInputElement && event.target.files!==undefined && event.target.files!==null && event.target.files.length > 0) {
      if (this.theId==="mainFile"){
          this.myForm.controls["fileName"].setValue(event.target.files[0].name);


      } else if (this.theId==="retrieveScript"){
          this.scriptFileName[this.scriptFileName.length]=event.target.files[0].name;
          this.myForm.controls['fileScriptName'].setValue(event.target.files[0].name);
          this.scriptFileContent[this.scriptFileContent.length]="";
      }
      //this.fileType=event.target.files[0].type;
      //this.nameLocation="local";
      const reader = new FileReader();
        reader.onloadend = () => {
          if (this.theId==="mainFile"){
            this.onGetReturn(reader.result as string);
            this.isFileLocal=true;
            this.isFileServer=false;
          } else if (this.theId==="retrieveScript"){
              this.isScriptRetrieved=true;
              this.scriptFileContent[this.scriptFileContent.length-1]=reader.result as string;
              this.currentScript=this.scriptFileContent.length-1;
              this.modifiedScriptContent=this.scriptFileContent[this.currentScript];
          }
          
          // reader.onabort= () => {console.log("stop");}
        };
        reader.readAsText(event.target.files[0]);

      }
  }
  
  onInputScript(event:any){
        this.modifiedScriptContent=event.target.value;
  }

  onConvertJsonToXML(event:any){
      this.processFile = true;
      var partial=false;
      if (event==="Partial"){
        partial=true;
      }
      var theRecord=onJSONtoXML(this.mainOutJSON,partial);
      this.myForm.controls["dataXML"].setValue(theRecord);
      this.isDisplayXML=true;
      this.isXMLRetrieved=true;
      this.error="new XML content after JSON converion";
      this.processFile = false;
  }

  onProcessScript(){
    this.processFile = true;
    this.scriptError="";
    const response= fnProcessScript(this.modifiedScriptContent, this.isMainJson, this.mainOutJSON, this.scriptFn, this.domainTabParam, this.selectTabParam, this.filterTabParam, this.replaceTabParam);
    if (response.status===0){
      this.mainOutJSON=response.record;
    }
    this.scriptError=response.errMsg;
    this.mainOutJSON=response.record;
    this.processFile = false;
  }

  readFileServer(){
      this.getRecord(this.myForm.controls["bucket"].value, this.myForm.controls["object"].value,0);
  }

  getRecord(GoogleBucket: string, GoogleObject: string, iWait: number) {
      //console.log('getRecord - iWait='+iWait);
      this.noSubmit=true;
      this.error="";
      this.scriptError="";
      this.ManageGoogleService.getContentObject(this.configServer, GoogleBucket, GoogleObject)
        .subscribe((data) => {

            this.onGetReturn(data);
            
          },
          err => {
            this.onErrorGetReturn();
         }) 
    
  }

  onErrorGetReturn(){
    console.log("Error");
    this.error="file not found or server is down";
    this.noSubmit=false;
  }
      
  onSelectedScript(event:any){
    //this.scriptFileContent
    this.currentScript=event;
    this.scriptError="";
    this.error="";
    this.modifiedScriptContent=this.scriptFileContent[this.currentScript];
  }


  onGetReturn(data:any){
      if (data.status!==undefined){
        this.error="File not found or server is down "
      } if (typeof data === "string"){
            if (data.substring(2,8)==="Header"){
              this.mainJSON=JSON.parse(data);
              this.mainOutJSON = new classMainOutFile;
              this.mainOutJSON.Body.level=new classOutTabLevel0;
              this.mainOutJSON=copyMainToMainOut(this.mainJSON, this.mainOutJSON);
              this.isMainJson=true;
            } else {
                this.theRecord=data;
                this.myForm.controls["dataXML"].setValue(data);
                this.isXMLRetrieved=true;
                const result = onXMLtoJSON(this.theRecord);
                if (typeof result === "string"){
                  this.error=result;
                } else {
                  this.mainOutJSON = result;
                  this.mainJSON = new classMainFile;
                  this.mainJSON.Body.level=new classTabLevel0;
                  this.mainJSON=copyMainOuttoMain(this.mainOutJSON, this.mainJSON);
                  this.isMainJson=true;
                }
            }
          
      } else if (data.Header!==undefined){
          this.mainJSON=data;
          this.mainOutJSON=copyMainToMainOut(this.mainJSON, this.mainOutJSON);
          this.isMainJson=true;
      }else if (data.text!==undefined){
        this.theRecord=data.text;
        this.isXMLRetrieved=true;
    }
      this.isFileRead=true;
      this.processFile=false;
  }

  onDisplayXML(event:any){
    if (event.toUpperCase()==="YES" || event.toUpperCase()==="Y"){
      this.isDisplayXML=true;
    } else {
      this.isDisplayXML=false;
    }
  }

  reinitOutFile(){
    this.mainOutJSON = new classMainOutFile;
    copyMainToMainOut(this.mainJSON,this.mainOutJSON);
  }

  processFilters(){ // TO BE CODED ACCORDING TO JSON format
      var outRecord="";
      var subString=""
      var endLoop=false;
      var i=0;
      var firstPos=0;
      var lastPos=0;
      const startDomain='<ABDDomainConfig "';
      const valueDomain='Location="' + this.myForm.controls['searchDomain'].value ;
      const endDomain="</ABDDomainConfig>"
      const startSection="<ABDConfig ";
      const endSection="</ABDConfig>"
      // ONLY CONSECUTIVE ABDConfigs are selected
      var posStartValue=0;
      var posEndValue=-1;
      var startFieldValue="";
      var endFieldValue="";
      this.error="";
      this.scriptError="";
      this.afterSave="";
      if (this.myForm.controls['searchField'].value ==="" &&
        this.myForm.controls['searchStartValue'].value ==="" && this.myForm.controls['searchEndValue'].value==="" 
      ){
        this.error="All fields are empty; file cannot be processed"
      } else if ((this.myForm.controls['searchField'].value ==="" && this.myForm.controls['searchStartValue'].value !=="") || 
                (this.myForm.controls['searchField'].value !=="" && this.myForm.controls['searchStartValue'].value ==="")
      ){
        this.error="Items Fields and Start Value must be filled in"
      }
      if (this.error!==''){
        firstPos=this.theRecord.indexOf(startDomain);
        lastPos=this.theRecord.substring(firstPos).indexOf(endDomain);
        if (firstPos>-1 && lastPos>firstPos){
          this.theInputRecord=this.theRecord.substring(firstPos,firstPos+lastPos+endDomain.length); 
          this.myForm.controls['dataXML'].setValue(this.theInputRecord);
        } else {
          this.error=" problem to find the appropriate Domain";
        }
      }

      this.noSubmit=false;
  }

  onSelectServer(){
    this.isSelectServer=true;
  }
  getOneServerName(event:any){
      this.selectedServer=event.server;
      if (this.selectedServer!=="localhost:3000"){
        this.configServer.googleServer=event.server;
      } else {
        this.selectedServer="jsonServer";
      }
      this.isSelectServer=false;
      this.isFileLocal=false;
      this.isFileServer=true;
  }
  
  confirmSaveFile(){
    this.isConfirmSave=true;
  }
  confirmSaveFileXML(){
    this.isConfirmSaveXML=true;
  }

  confirmSaveScript(){
    this.scriptError="";
    this.isConfirmSaveScript=true;
    if (this.currentScript>-1){
      this.myForm.controls['fileScriptName'].setValue(this.scriptFileName[this.currentScript]);
    }
  }

  onSaveScript(event:any){
    this.isConfirmSaveScript=false;
    this.scriptError="";
    if (event!=="cancel"){
      // check if the name already exists otherwise create one
      for (var i=0; i<this.scriptFileContent.length &&  this.scriptFileName[i]!==this.myForm.controls['fileScriptName'].value; i++){}
      if (i===this.scriptFileContent.length){
        this.currentScript=this.scriptFileContent.length;
      }
      this.scriptFileName[this.currentScript]=this.myForm.controls['fileScriptName'].value;
      this.scriptFileContent[this.currentScript]=this.modifiedScriptContent;
      if (event==="server"){
        this.saveJSONFile(this.modifiedScriptContent, this.GoogleBucket,this.myForm.controls['fileScriptName'].value)
      } else if (event==="local"){
        this.postFileHTTP("localText",this.modifiedScriptContent,this.myForm.controls['fileScriptName'].value)
      } 
    }
  }

  onCancelScript(){
    this.modifiedScriptContent=this.scriptFileName[this.currentScript];
  }

  saveFile(event:any){   
      this.isConfirmSave=false;
      this.isConfirmSaveXML=false;
      if (event==="serverJSON"){
        this.saveJSONFile(JSON.stringify(this.mainOutJSON), this.GoogleBucket,this.myForm.controls['fileName'].value)
      } else if (event==="localJSON"){
        this.saveJSONFile(this.myForm.controls['dataXML'].value, this.GoogleBucket,this.myForm.controls['fileNameXML'].value)
      }
      
  }

  saveJSONFile(record:any,bucket:string,object:string){ // NOT TO BE USED FOR FILE TOO LARGE
  
    //this.configServer.googleServer="http://localhost:8080";
    var file = new File([record], object, { type: 'application/octet-stream' });
    // var file = new File([JSON.stringify(this.myForm.controls['dataXML'].value)], this.myForm.controls['fileName'].value, { type: 'application/octet-stream' });

    this.ManageGoogleService.uploadObject(this.configServer, bucket, file, object)
      .subscribe(res => {
        console.log('Return of SaveNewRecord of object=' + object + '  res.type='+res.type);
        if (res.type === 4 ) {
          if (res.body.status===700){
              this.afterSave=JSON.stringify(res.body.msg);
          } else {
            this.afterSave='Successful Save of file ' + object;
          }
          console.log(this.afterSave);
        }
      },
        err => {
          console.log(JSON.stringify(err));
          this.afterSave='Problem with Save of file ' + object;       }
      )
    }

    credentials = new classCredentials;
  getDefaultCredentials(){
      this.ManageGoogleService.getDefaultCredentials(this.configServer,true)
            .subscribe(
          (data ) => {
              //this.configServer.googleServer=saveGoogleServer;
              this.credentials.access_token=data.credentials.access_token;
              this.credentials.id_token=data.credentials.id_token
              this.credentials.refresh_token=data.credentials.refresh_token
              this.credentials.token_type=data.credentials.token_type;
              this.credentials.userServerId=data.credentials.userServerId;
              this.credentials.creationDate=data.credentials.creationDate;

          },
          err => {
            //this.configServer.googleServer=saveGoogleServer;
            console.log(' error request credentials = '+ JSON.stringify(err));
          });
  }

  saveFileHTTP(event:string){
      this.isConfirmSave=false;
      this.isConfirmSaveXML=false;
      if (event==="localJSON"  ){
        this.postFileHTTP("localJSON",JSON.stringify(this.mainOutJSON),this.myForm.controls["fileName"].value);
      } else if (event==="serverJSON"){
        this.postFileHTTP("server",this.mainOutJSON,this.myForm.controls["fileName"].value);
      } else if (event==="localXML"  ){
        this.postFileHTTP("localText",this.myForm.controls["dataXML"].value,this.myForm.controls["fileNameXML"].value);
      } else if (event==="serverXML"){
        this.postFileHTTP("server",this.myForm.controls["dataXML"].value,this.myForm.controls["fileNameXML"].value);
      }
  }

  postFileHTTP(server:string,record:any,fileName:string) {
      const Google_Bucket_Access_RootPOST: string = 'https://storage.googleapis.com/upload/storage/v1/b/';
      const GoogleObject_Option: string = '/o?uploadType=media&name='
      const theHeadersAll = new HttpHeaders({
        "Authorization": "Bearer " + this.credentials.access_token,
      });
      if (server==="localJSON"){

        var blob=new Blob([record], {type:"application/json"})
        saveAs(blob, fileName);


      } else if (server==="localText"){

        var blob=new Blob([record])
        saveAs(blob, fileName);


      } else {
        const HTTP_Address = Google_Bucket_Access_RootPOST + this.GoogleBucket + GoogleObject_Option + fileName;
      
      
      this.http.post(HTTP_Address, this.mainJSON)
        .subscribe(
          data => {
            this.afterSave=JSON.stringify(data);
            console.log(JSON.stringify(data));
          },
          err => {
            this.afterSave=JSON.stringify(err);
            console.log(JSON.stringify(err));       
          })
        }
  }

    /****   CODE VALIDATED BUT NOT NEEDED
    getFileAssetsHTTP() {

      const  HTTP_Address: string = 'assets/ABDMasterConfig.cfg'    
      var myData:any;
      
      this.http.get(HTTP_Address, { responseType: 'text' })
        .subscribe(
          data => {
          this.onGetReturn(data);
        },
          err => {
            this.onErrorGetReturn();
          });
    }
    */

 

}


