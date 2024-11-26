
import { Component, OnInit , Input, Output, EventEmitter,HostListener, OnChanges, SimpleChanges} from '@angular/core';

import { CommonModule,  DatePipe, formatDate, ViewportScroller } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { classTabMetaPerso , Bucket_List_Info, OneBucketInfo } from '../JsonServerClass';

import { msginLogConsole } from '../consoleLog';

import { msgConsole } from '../JsonServerClass';
import { configServer } from '../JsonServerClass';

import { ManageGoogleService } from '../CloudServices/ManageGoogle.service';

@Component({
  selector: 'app-ListBucketContent',
  templateUrl: './ListBucketContent.component.html',
  styleUrls: ['./ListBucketContent.component.css'],
  standalone:true,
  imports:[CommonModule, FormsModule, ReactiveFormsModule, ],
})

export class ListBucketContentComponent {

  constructor(
    private scroller: ViewportScroller,
    private ManageGoogleService: ManageGoogleService,
    ) {}
  
    @Input() configServer=new configServer;
    @Input() NbRefresh_Bucket=0;

    @Input() Bucket_Name:string='';
    @Input() tabMetaPerso: Array<classTabMetaPerso> = [];

    @Output() Return_SelectedBucketInfo=new EventEmitter<OneBucketInfo>();
    
    @Output() Return_Data= new EventEmitter<any>();

    SelectedBucketInfo=new OneBucketInfo;   
    getScreenWidth: any;
    getScreenHeight: any;
    device_type:string='';

    myLogConsole:boolean=false;
    myConsole:Array< msgConsole>=[];
    returnConsole:Array< msgConsole>=[];
    SaveConsoleFinished:boolean=true;
    type:string='';

    isObjectToSave:boolean=false;
    EventHTTPReceived:Array<boolean>=[false,false,false,false,false,false];
    id_Animation:Array<number>=[0,0,0,0,0];
    TabLoop:Array<number>=[0,0,0,0,0];

     // ACCESS TO GOOGLE STORAGE
    HTTP_AddressLog:string='';
    HTTP_Address:string='';

    bucket_data:string='';
    myListOfObjects=new Bucket_List_Info;
    

    Google_Bucket_Access_Root:string='https://storage.googleapis.com/storage/v1/b/';
    Google_Bucket_Access_RootPOST:string='https://storage.googleapis.com/upload/storage/v1/b/';
  
    Error_Access_Server:string='';

    fileRetrieved:boolean=false;
         // ACCESS TO GOOGLE STORAGE

    Message:string='';
     
    DisplayListOfObjects:boolean=false;
    SelectedFile:boolean=false;
  
    FileMedialink:string='';
    FileName:string='';
    ModifyText:boolean=false;

    IsngInitDone:boolean=false;
@HostListener('window:resize', ['$event'])
onWindowResize() {
      this.getScreenWidth = window.innerWidth;
      this.getScreenHeight = window.innerHeight;
    }

ngOnInit(){
      //this.LogMsgConsole('ngOnInit ManageJson ===== Device ' + navigator.userAgent + '======');
      this.getScreenWidth = window.innerWidth;
      this.getScreenHeight = window.innerHeight;
      this.HTTP_AddressLog=this.Google_Bucket_Access_RootPOST + 'logconsole' + "/o?name="  ;
      this.Error_Access_Server='';
      this.IsngInitDone=true;
      this.RetrieveAllObjects();
  }   

RetrieveAllObjects(){
  // bucket name is ListOfObject.config
  //this.HTTP_Address=this.Google_Bucket_Access_Root+ this.Bucket_Name + "/o"  ;
  var stringMetaPerso="";
  if (this.tabMetaPerso.length > 0){
    stringMetaPerso='{"' + this.tabMetaPerso[0].key + '":"' + this.tabMetaPerso[0].value +'"}';
  }
  var receivedMeta="";
  console.log('RetrieveAllObjects()'+this.Bucket_Name);
  this.ManageGoogleService.getListMetaObjects(this.configServer, this.Bucket_Name )
  //this.ManageGoogleService.getListObjects(this.configServer, this.Bucket_Name )
  //this.http.get<Bucket_List_Info>(this.HTTP_Address )
          .subscribe((data ) => {
            console.log('RetrieveAllObjects() - data received');
            for (var i=0; i<data.length; i++){
              if (stringMetaPerso==="" || (stringMetaPerso!=="" && data[i].items.metadata!==undefined &&
                JSON.stringify(data[i].items.metadata).indexOf(stringMetaPerso)!==-1)) {
                
              
                const theObject= new OneBucketInfo;
                this.myListOfObjects.items.push(theObject);
                
                this.myListOfObjects.items[i].name=data[i].items.name;
                this.myListOfObjects.items[i].mediaLink=data[i].items.url;
                this.myListOfObjects.items[i].bucket=this.Bucket_Name;
            }
            }
            
            this.DisplayListOfObjects=true;
            this.scroller.scrollToAnchor('targetTopObjects');
          },
          error_handler => {
            
            console.log('RetrieveAllObjects() - error handler; HTTP='+this.HTTP_Address);
            this.Message='HTTP_Address='+this.HTTP_Address;
            this.Error_Access_Server='RetrieveAllObjects()==> ' + error_handler.message + ' error status==> '+ error_handler.statusText+'   name=> '+ error_handler.name + '   Error url==>  '+ error_handler.url;
          } 
    )
  }
  
  
  RetrieveSelectedFile(event:any){
    this.Message='';
    const saveEvent=event;
    this.ManageGoogleService.getContentObject(this.configServer, event.bucket,event.name )
      .subscribe((data ) => {
        console.log('ListBucket - RetrieveSelectedFile= '+event.mediaLink);
        this.Return_SelectedBucketInfo.emit(saveEvent);
        if (typeof data==="object"){

        } else {
          
        }

        this.scroller.scrollToAnchor('SelectedObjectsFile');
        this.Return_Data.emit(data);
        //
      },
      error_handler => {
        this.Message='HTTP_Address='+event.mediaLink;
        this.Error_Access_Server='INIT - error message==> ' + error_handler.message + ' error status==> '+ error_handler.statusText+'   name=> '+ error_handler.name + '   Error url==>  '+ error_handler.url;
        console.log('RetrieveSelectedFile- error handler '+this.Error_Access_Server);
        this.Error_Access_Server='INIT - error status==> '+ error_handler.status+ '   Error url==>  '+ error_handler.url;
      } 
      )
  }


  ngOnChanges(changes: SimpleChanges) { 

  if (this.IsngInitDone===true){
      for (const propName in changes){
        const j=changes[propName];
        if (propName==='Bucket_Name' || this.NbRefresh_Bucket!==0){
         // const to=JSON.stringify(j.currentValue);
         // const from=JSON.stringify(j.previousValue);
         
         // if (to!==from ){
            this.RetrieveAllObjects();
            this.DisplayListOfObjects=true;
         // }
        }
      }
        // //this.LogMsgConsole('$$$$$ onChanges '+' to '+to+' from '+from + ' ---- JSON.stringify(j) '+ JSON.stringify(j));
      }
     
    }
  


LogMsgConsole(msg:string){

  msginLogConsole(msg, this.myConsole,this.myLogConsole, this.SaveConsoleFinished,this.HTTP_AddressLog, this.type);
  
}

}