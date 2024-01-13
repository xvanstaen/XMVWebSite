import { Component, OnInit , Input, Output, EventEmitter, ViewChild, SimpleChanges, OnChanges, 
   HostListener, AfterViewInit} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router} from '@angular/router';
import { FormGroup, FormControl, Validators} from '@angular/forms';
import { ViewportScroller } from "@angular/common";
import { StructurePhotos, configPhoto } from '../JsonServerClass';

import { BucketExchange, configServer } from '../JsonServerClass';

import { msginLogConsole,  saveLogConsole } from '../consoleLog';
import { msgConsole } from '../JsonServerClass';

export class push_new_bucket{
  wait:boolean=false; // 'true' html will display the image
  photo_loaded:number=0; // indicate which image number is fully loaded in html
}
@Component({
  selector: 'app-WeddingPhotos',
  templateUrl: './WeddingPhotos.component.html',
  styleUrls: ['./WeddingPhotos.component.css']
})

export class WeddingPhotosComponent {

  constructor(
    private router:Router,
    private http: HttpClient,
    private scroller: ViewportScroller,
    ) {}
  
    @ViewChild('ImageCanvas', { static: true })

    myImage = new Image();

    theCanvas:any;
    theCanvasTwo:any;
    ctx:any;
    ctxTwo:any;

    PhotoNbForm: FormGroup = new FormGroup({ 
      SelectNb: new FormControl(),
      Width: new FormControl(),
      Height: new FormControl(),
      ForceSaveLog: new FormControl(),
      
    });

    DiapoForm: FormGroup = new FormGroup({ 
      StartDiapoNb: new FormControl(),
      EndDiapoNb: new FormControl(),
    });

    SelectedPhoto:number=0;
    SelectedPhotoW:number=0;
    SelectedPhotoH:number=0;
    maxWPhotoH=0;
    maxWPhotoV=0;
    maxHPhoto=0;
    nbPhotoPerRow=0;

    @Input() configServer = new configServer;
    @Input() configPhoto=new configPhoto;
    @Input() bucketMgt=new BucketExchange;
    @Input() WeddingPhotos:Array<StructurePhotos>=[];

    myConsole:Array<msgConsole>=[]; // store log before it is saved in appropriate bucket/object in Google cloud
    @Input() myLogConsole:boolean=false; // log messages from this module
    @Input() EventLogConsole:Array<msgConsole>=[]; // log coming from GetImages.component.ts
    SaveConsoleFinished:boolean=true;

    @Input()nextBucketOnChange:number=0; // each time a new bucket is 'http get' from Event-27AUG2020.component.ts
    PhotoToDisplay:Array<push_new_bucket>=[]; // if 'wait=true' then html will display this image
    emitBucketProcessed:boolean=false; // to ensure that the retrieved bucket has been fully processed before another bucket is required through 'http get'

    @Output() AddBucket= new EventEmitter<number>();

    prevCanvasPhoto:number=0;
    initialdrawCanvas:boolean=false;
    message_canvas:string='';
    error_canvas:string='';
    initialCanvasPhoto:number=1;
    error_Diapo:string='';
    message_Diapo:string='';
    first_onload:boolean=true;
    getScreenWidth: any;
    getScreenHeight: any;
    device_type:string='';
    yourLanguage:string='FR';
  
    callFromCanvas:boolean=true;

    slow_table:Array<string>=[]; // contain the src of the images to display
    PhotoNumber:Array<number>=[]; // contain the number of the photos displayed on the screen
    isWeddingPhotoEmpty:boolean=true;


    stop_waiting_photo:boolean=false;

    nb_total_page:number=0;
    nb_current_page:number=0;
    nb_current_photo:number=0;
    pages_to_display:Array<number>=[];
    DisplayPageRange:boolean=false;
    imagesToDisplay:number=0;
    TenPageRange:Array<number>=[1,2,3,4,5,6,7,8,9,10];
    MaxPageRange=10;  

    i:number=0;
    j:number=0;
    id_Animation:number=0;
    id_Animation_two:number=0;
    id_Animation_three:number=0;
    j_loop:number=0;
    i_loop:number=0;
    max_i_loop:number=30000;
    max_j_loop:number=30000;
   

    Google_Bucket_Access_Root:string='https://storage.googleapis.com/storage/v1/b/';
    Google_Bucket_Access_RootPOST:string='https://storage.googleapis.com/upload/storage/v1/b/';
    Google_Bucket_Name:string='logconsole'; 
    Google_Object_Name:string='WeddingPhotos';
    HTTP_Address:string='';
    HTTP_AddressLog:string='';
    type:string='WeddingPhotos';

    myDate:string='';
    myTime=new Date();
    thetime:string='';;

    
    theWidthH:number=0;
    theWidthV:number=0;
    theHeightH:number=0;
    theHeightV:number=0;

    first_canvas_displayed:boolean=false;
    WentonNgInit:boolean=false;


@HostListener('window:resize', ['$event'])
onWindowResize() {
      //this.LogMsgConsole('onWindowResize()');
      this.getScreenWidth = window.innerWidth;
      this.getScreenHeight = window.innerHeight;
      this.SizeImage();
      if (this.first_canvas_displayed=true){
        if (this.configPhoto.process_display_canvas===true){
          this.change_canvas_size(this.initialCanvasPhoto);
        }
        
      }
      this.drawDiapoCanvas();
    }

SizeImage(){
  if (this.getScreenWidth<900){
    this.theWidthH=Math.floor(this.getScreenWidth*0.85);
    this.theHeightH=Math.floor(this.getScreenWidth*0.50);

    this.theWidthV=Math.floor(this.getScreenWidth*0.50);
    this.theHeightV=Math.floor(this.getScreenWidth*0.75);
    this.PhotoNbForm.controls['Width'].setValue(this.theWidthH);
    this.PhotoNbForm.controls['Height'].setValue(this.theHeightH);
  } else{
    this.theWidthH=900;
    this.theHeightH=600;

    this.theWidthV=400;
    this.theHeightV=600;
    this.PhotoNbForm.controls['Width'].setValue(this.theWidthH);
    this.PhotoNbForm.controls['Height'].setValue(this.theHeightH);
  }
}

  ngOnInit(){

    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;
    this.device_type = navigator.userAgent;
    this.HTTP_AddressLog=this.Google_Bucket_Access_RootPOST + 'logconsole'+ "/o?name="  ;
    if (this.EventLogConsole.length!==0){
      for (this.i=0; this.i<this.EventLogConsole.length-1; this.i++){
        let theMSG=new msgConsole;
        this.myConsole.push(theMSG)
        this.myConsole[this.myConsole.length-1].msg=this.EventLogConsole[this.i].msg;
        this.myConsole[this.myConsole.length-1].timestamp=this.EventLogConsole[this.i].timestamp;


        //this.myConsole.push('');
        //this.myConsole[this.myConsole.length-1]=this.EventLogConsole[this.i];
      }
      // delete EventLogConsole as it has been stored in myConsole
      this.EventLogConsole.splice(0,this.EventLogConsole.length);
      // other option wwas to save this log before starting process on WeddingPhotos
      //this.saveLogConsole(this.EventLogConsole,'Event27AUG');
    }
    //this.LogMsgConsole('Device '+navigator.userAgent);
    //this.LogMsgConsole('ngOnInit() WeddingPhotos; bucketMgt.bucket_is_processed is '+ this.bucketMgt.bucket_is_processed+ ' size file '+ this.WeddingPhotos.length);
   
    this.SizeImage();
    this.PhotoNbForm.controls['SelectNb'].setValue(null);
    this.DiapoForm.controls['StartDiapoNb'].setValue(1);
    if (this.WeddingPhotos.length!==0){
      this.DiapoForm.controls['EndDiapoNb'].setValue(this.WeddingPhotos.length);
    } else {
        this.DiapoForm.controls['EndDiapoNb'].setValue(2);
      }
    this.nb_current_page = 1;
    this.scroller.scrollToAnchor('targetTop');
    this.WentonNgInit=true;
    for (let i=0; i<this.configPhoto.nb_photo_per_page; i++){
      this.pages_to_display.push(0);
      this.pages_to_display[i]=i+1;
    }

  }    

  ngAfterViewInit() { 
    //this.LogMsgConsole('ngAfterViewInit() - WeddingPhotos.length'+this.WeddingPhotos.length+' isWeddingPhotoEmpty'+this.isWeddingPhotoEmpty+'  ConfigXMV.process_display_canvas is '+this.configPhoto.process_display_canvas);
      
    if (this.configPhoto.process_display_canvas===true){
      this.theCanvas=document.getElementById('canvasElem');
      if (!this.ctx) { //true
          this.ctx=this.theCanvas.getContext('2d');
        }
      }

    this.theCanvasTwo=document.getElementById('canvasElemTwo');
    if (!this.ctxTwo) { //true
          this.ctxTwo=this.theCanvasTwo.getContext('2d');
      }

    if (this.WeddingPhotos.length!==0){
      this.calculate_pages(); 
      this.isWeddingPhotoEmpty=false;
      this.nb_current_page=1;
      this.displayPhotos();
      this.PhotoToDisplay[0].wait=true;
      this.imagesToDisplay=this.PhotoToDisplay.length;
      this.scroller.scrollToAnchor('targetTop');
    }
  }

displayPhotos(){
  //this.LogMsgConsole('DisplayPhotos buckets processed '+ this.bucketMgt.bucket_is_processed+ ' size file '+ this.WeddingPhotos.length);
  this.j=(this.nb_current_page-1)*this.configPhoto.nb_photo_per_page;
  if (this.bucketMgt.bucket_is_processed===true && this.WeddingPhotos.length!==0 && this.slow_table.length===0){
        this.isWeddingPhotoEmpty=false;
        // initialise the tables to display the images and the number of pages 
        this.initialiseTables(0);
        if (this.configPhoto.process_display_canvas===true){
              this.drawPhotoCanvas();
        }
  }
}
initialiseTables(i:number){
  for (this.i=i; this.i<this.configPhoto.nb_photo_per_page && this.j<this.WeddingPhotos.length; this.i++){

    this.slow_table.push('');
    this.slow_table[this.i]=this.WeddingPhotos[this.j].mediaLink;
    const pushPhoto=new push_new_bucket;
    this.PhotoToDisplay.push(pushPhoto);
    this.PhotoToDisplay[this.i].wait=false;
    this.PhotoToDisplay[this.i].photo_loaded=0;
    this.j++;
    this.PhotoNumber.push(0);
    this.PhotoNumber[this.i]=this.j;
  };
}

next_prev_page(event:any){
  // trigerred by html 
  //this.LogMsgConsole('next_prev_page(event) '+event);
  this.manage_page(event);
  if (this.callFromCanvas===true) {
    this.callFromCanvas=false;
    this.scroller.scrollToAnchor('TopSelectedPhoto');
  } else {
    this.scroller.scrollToAnchor('targetTop');
  }
}
// triggered by html component
display_page(page_nb:number){
  this.nb_current_page=page_nb-1;
  this.manage_page('next');
  if (this.callFromCanvas===true) {
    this.callFromCanvas=false;
    this.scroller.scrollToAnchor('TopSelectedPhoto');
  } else {
    this.scroller.scrollToAnchor('targetTop');
  }
}



DefinePageRange(){

  this.nb_current_photo=(this.nb_current_page-1)*this.configPhoto.nb_photo_per_page; // first photo for the next page -1
  
  // looking for the middle of the page
   // if number of pages to display is < 10 then nothing to change 
  if ( this.MaxPageRange>this.nb_total_page){
   this.j=1;
  } else {
      this.j = this.nb_current_page-Math.floor(this.MaxPageRange/2);
      if (this.MaxPageRange%2!==0){
            this.j ++;
        }
   }
  if ( this.j + this.MaxPageRange > this.nb_total_page){
      this.j=this.nb_total_page-this.MaxPageRange+1;
    }
  if ( this.j<1 ){this.j=1; } 

  for (this.i=0; this.i<this.MaxPageRange; this.i++){
    if (this.i+this.j<=this.nb_total_page){
        this.TenPageRange[this.i]=this.i+this.j;
      } 
    else {
        this.TenPageRange[this.i]=-1; // no more pages to display; '-1' is checked by html component
      }
 }
  
}

manage_page(event:any){ 
  //this.LogMsgConsole('manage_page(event)='+ event+' nb_current_page='+ this.nb_current_page+'  length table='+this.WeddingPhotos.length );
  let processOtherPage=true;
  if(event === 'prev' && this.nb_current_page > 1){
    this.nb_current_page--
  } else if (event === 'next' && this.nb_current_page < this.nb_total_page){
    this.nb_current_page++
  }else if ((this.bucketMgt.Nb_Buckets_processed>=this.bucketMgt.Max_Nb_Bucket_Wedding && this.nb_current_page === this.nb_total_page && event === 'next') || (event === 'prev' && this.nb_current_page === 1)){ // stay on the current page - either first one or last one
    processOtherPage=false;
    }
  if(processOtherPage===true){
    this.DefinePageRange();

    // reinitialise the tables; first delete all occurences of the different tables
    this.slow_table.splice(0,this.slow_table.length);
    this.PhotoNumber.splice(0,this.PhotoNumber.length);
    this.PhotoToDisplay.splice(0,this.PhotoToDisplay.length);
    
    this.j=(this.nb_current_page-1)*this.configPhoto.nb_photo_per_page;
    this.initialiseTables(0);
    
    this.DisplayPageRange=false;
    if (this.emitBucketProcessed===true){
        // a bucket was requested so it now needs to be processed ; next bucket will be requested after new display(s)
        this.emitBucketProcessed=false;

    } else {
        // check if the last bucket has not been returned; means that we need to get additional buckets
        if (event === 'next' && this.bucketMgt.bucket_list_returned[this.bucketMgt.Max_Nb_Bucket_Wedding-1]==='0'){
          //for (this.bucketMgt.Nb_Buckets_processed=0; this.bucketMgt.Nb_Buckets_processed<this.bucketMgt.Max_Nb_Bucket_Wedding && 
          //  this.bucketMgt.bucket_list_returned[this.bucketMgt.Nb_Buckets_processed]==='1'; this.bucketMgt.Nb_Buckets_processed++){
              // trigger event to get another bucket
                  
          //  }
          if (this.bucketMgt.Nb_Buckets_processed<this.bucketMgt.Max_Nb_Bucket_Wedding){
              if (this.nb_current_photo>this.WeddingPhotos.length-2*this.configPhoto.nb_photo_per_page){
                  this.emitBucketProcessed=true;
                  this.AddBucket.emit(this.bucketMgt.Nb_Buckets_processed); 
              }
          }
        }
      }
      this.PhotoNbForm.controls['SelectNb'].setValue(this.nb_current_photo+1);
      this.PhotoToDisplay[0].wait=true;
      this.WeddingPhotos[this.nb_current_photo].isdiplayed=true;
      this.imagesToDisplay=this.PhotoToDisplay.length;

      if (this.configPhoto.process_display_canvas===true){
        this.ManageCanvas();
      }
  }
}



onZoomPhoto(event:any){
// not used indeed
}

onDownloadFile(event:any): void { 
    // triggerred by html component
    const link = document.createElement("a");
    //link.href = URL.createObjectURL(file);
    link.href=this.WeddingPhotos[event].mediaLink;
    link.download = this.WeddingPhotos[event].name; // filename
    link.click();
    link.remove(); 
  }


NextImage(noPhoto:number){
  // triggerred by html component when the image is loaded
  //this.LogMsgConsole('NextImage - photo fully loaded is nb '+ noPhoto + 'and its number in WeddingPhotos is ' + this.PhotoNumber[noPhoto]);

  this.PhotoToDisplay[noPhoto].photo_loaded=1;

  noPhoto++
  if (noPhoto<this.PhotoToDisplay.length){
       this.PhotoToDisplay[noPhoto].wait=true;
   }
  let i=0;
  let msg='NextImage(); pages loaded are:';
  for (i=0; i<this.PhotoToDisplay.length; i++){
      if (this.PhotoToDisplay[i].photo_loaded===1){
            msg=msg+ ' '+ this.PhotoNumber[i]+'; ';
          }
  };
  this.imagesToDisplay=0;
  for (i=0; i<this.PhotoToDisplay.length; i++){
    if (this.PhotoToDisplay[i].photo_loaded===0){
      this.imagesToDisplay++;
    }
  }
  if (this.PhotoToDisplay[this.PhotoToDisplay.length-1].photo_loaded===1){
    this.DisplayPageRange=true;
    this.first_canvas_displayed=true;
    this.drawDiapoCanvas();
  }
  
  //this.LogMsgConsole(msg);
}

LoadImage(){
  // find the first photo that html should display
  //this.LogMsgConsole('LoadImage()');
  let i=0;
  for (i=0; i<this.PhotoToDisplay.length && this.PhotoToDisplay[i].wait===true && this.PhotoToDisplay[i].photo_loaded===1; i++){};
  if (i<this.PhotoToDisplay.length-1 && this.PhotoToDisplay[i].wait!==true){
    this.PhotoToDisplay[i].wait=true
  } else {
      this.first_canvas_displayed=true;
    }
  this.imagesToDisplay=this.PhotoToDisplay.length-(i+1);
  if (this.callFromCanvas===true) {
    this.callFromCanvas=false;
    this.scroller.scrollToAnchor('TopSelectedPhoto');
  } else {
    this.scroller.scrollToAnchor('targetTop');
  }
}



calculate_pages(){
  this.nb_total_page = Math.floor(this.WeddingPhotos.length / this.configPhoto.nb_photo_per_page);
  if (this.WeddingPhotos.length%this.configPhoto.nb_photo_per_page!==0){
    this.nb_total_page++
  }
  this.j=1;
  for (this.i=0; this.i<this.MaxPageRange; this.i++){
    if (this.i+this.j<=this.nb_total_page){
      this.TenPageRange[this.i]=this.i+this.j;
    } else {
         this.TenPageRange[this.i]=-1;
    }
  }
}


// not used == must check how to reload an image and which action can trigger it
Redisplay(event:string){
  //this.LogMsgConsole('Redisplay(event)='+event);
  this.message_canvas='Redisplay(event)='+event;
}

ngOnChanges(changes: SimpleChanges) {   
  //this.LogMsgConsole('$$$$$ onChanges ==> bucketMgt.bucket_is_processed='+ this.bucketMgt.bucket_is_processed+'  length weddingPhotos='+ this.WeddingPhotos.length+' isWeddingPhotoEmpty='+this.isWeddingPhotoEmpty+' nextBucketOnChange='+this.nextBucketOnChange);
  if (this.EventLogConsole.length!==0){
    for (this.i=0; this.i<this.EventLogConsole.length-1; this.i++){
      let theMSG=new msgConsole;
      this.myConsole.push(theMSG)
      this.myConsole[this.myConsole.length-1].msg=this.EventLogConsole[this.i].msg;
      this.myConsole[this.myConsole.length-1].timestamp=this.EventLogConsole[this.i].timestamp;
      //this.myConsole.push('');
      //this.myConsole[this.myConsole.length-1]=this.EventLogConsole[this.i];
    }
    // delete EventLogConsole as it has been stored in myConsole
    this.EventLogConsole.splice(0,this.EventLogConsole.length);
    // other option wwas to save this log before starting process on WeddingPhotos
    //this.saveLogConsole(this.EventLogConsole,'Event27AUG');
  }
  //console.log(changes);
  for (const propName in changes){
    const j=changes[propName];
    const to=JSON.stringify(j.currentValue);
    
    const from=JSON.stringify(j.previousValue);
    
    //this.LogMsgConsole('$$$$$ onChanges '+' to '+to+' from '+from + ' ---- JSON.stringify(j) '+ JSON.stringify(j));
  }

  if (this.WeddingPhotos.length!==0 && this.isWeddingPhotoEmpty===true && this.WentonNgInit===true){
      // ngOnInit has already been processed and at that time WeddingPhotos was empty 
      //this.LogMsgConsole('onChanges call this.displayPhotos()');
      this.isWeddingPhotoEmpty=false;
      this.displayPhotos();
  }

  if (this.nextBucketOnChange>1){
    for (this.bucketMgt.Nb_Buckets_processed=0; this.bucketMgt.Nb_Buckets_processed<this.bucketMgt.Max_Nb_Bucket_Wedding && 
      this.bucketMgt.bucket_list_returned[this.bucketMgt.Nb_Buckets_processed]==='1'; this.bucketMgt.Nb_Buckets_processed++){
      // trigger event to get another bucket      
    }
    this.calculate_pages(); 
    this.DefinePageRange();
    let flag=this.callFromCanvas;

    if (this.PhotoToDisplay.length<this.configPhoto.nb_photo_per_page
      // && this.nb_current_page*this.configPhoto.nb_photo_per_page+this.PhotoToDisplay.length-1<this.nb_total_page*this.configPhoto.nb_photo_per_page
      ){    
        this.i=this.PhotoToDisplay.length;
        this.j=this.PhotoNumber[this.i-1];
        this.initialiseTables(this.i);
    }
    this.LoadImage();
    const i=(this.nb_current_page+2)*this.configPhoto.nb_photo_per_page+1;
    if (this.emitBucketProcessed===true && i>this.nb_total_page){
      this.emitBucketProcessed=false;
    }
    if (flag===true) {
      this.DiapoForm.controls['EndDiapoNb'].setValue(this.WeddingPhotos.length);
      this.drawDiapoCanvas();
  }
  } 
}

ForceSaveLog(){
  if (this.PhotoNbForm.controls['ForceSaveLog'].value==='y'){
    this.PhotoNbForm.controls['ForceSaveLog'].setValue('n');
    //this.LogMsgConsole('ForceSaveLog()');
   saveLogConsole(this.myConsole, this.type, this.HTTP_AddressLog);
  }
  this.LoadImage();
}

LogMsgConsole(msg:string){
  msginLogConsole(msg, this.myConsole,this.myLogConsole, this.SaveConsoleFinished,this. HTTP_AddressLog, this.type);
  }



// ==================== BELOW ARE MODULES RELATED TO MANAGEMENT OF THE CANVAS


drawDiapoCanvas(){
  this.emitBucketProcessed=false;
  this.error_Diapo='';
  this.message_Diapo='';
  this.configPhoto.padding=10;
  this.ctxTwo.canvas.width=Math.floor(this.getScreenWidth*0.90);
  // this.ctxTwo.canvas.height=Math.floor(this.getScreenWidth*0.50)*21;
  
  if (this.DiapoForm.controls['StartDiapoNb'].value> this.WeddingPhotos.length || 
  this.DiapoForm.controls['EndDiapoNb'].value> this.WeddingPhotos.length){
    this.error_Diapo='Maximum number of photos is '+this.WeddingPhotos.length;
  } else if (this.DiapoForm.controls['StartDiapoNb'].value > this.DiapoForm.controls['EndDiapoNb'].value){
    this.error_Diapo='Range of values is invalid; your first number is greater than the second ';
  } else if (this.DiapoForm.controls['StartDiapoNb'].value<=0 || 
  this.DiapoForm.controls['EndDiapoNb'].value<=0){
    this.error_Diapo='Range of values is invalid; cannot have nil/negaiive value(s)';
  }
  const nbPhotos=this.DiapoForm.controls['EndDiapoNb'].value-this.DiapoForm.controls['StartDiapoNb'].value+1;
  let i=0;
  this.maxWPhotoH=0;
  this.maxWPhotoV=0;
  this.maxHPhoto=0;
  this.nbPhotoPerRow=0;
  // calculate size of the canvas considering 3 photos is width < 500; 6 photos if width<901 & 9 photos if >900
  if (this.getScreenWidth<this.configPhoto.width500){
    this.nbPhotoPerRow=this.configPhoto.maxPhotosWidth500;

  } else if (this.getScreenWidth<this.configPhoto.width900){
    this.nbPhotoPerRow=this.configPhoto.maxPhotosWidth900;
  } else {
        if(this.configPhoto.maxWidth<this.getScreenWidth){
          this.ctxTwo.canvas.width=Math.floor(this.configPhoto.maxWidth*0.90);
            }
            this.nbPhotoPerRow=this.configPhoto.maxPhotosmaxWidth;
  }
  this.maxHPhoto= Math.floor(this.ctxTwo.canvas.width*0.6/this.nbPhotoPerRow)-this.configPhoto.padding;
 
  this.maxWPhotoH=Math.floor(this.ctxTwo.canvas.width/this.nbPhotoPerRow)-this.configPhoto.padding;
  this.maxWPhotoV=Math.floor(Math.floor(this.getScreenWidth*0.50)/this.nbPhotoPerRow)-this.configPhoto.padding;
  
 

  this.ctxTwo.canvas.height=(this.maxHPhoto+this.configPhoto.padding)*(nbPhotos/this.nbPhotoPerRow+1);
  
  let nbRow=0;

  let j=0;
  for (i=this.DiapoForm.controls['StartDiapoNb'].value; i<=this.DiapoForm.controls['EndDiapoNb'].value; i=i+this.nbPhotoPerRow){
      for (j=0; j<this.nbPhotoPerRow && i-1+j<this.WeddingPhotos.length && i-1+j<this.DiapoForm.controls['EndDiapoNb'].value; j++){
        this.myImage=new Image();
        this.myImage.src=this.WeddingPhotos[i-1+j].mediaLink;
        const y = nbRow*(this.maxHPhoto+this.configPhoto.padding)+this.configPhoto.padding;
        //this.ctx.setTransform(1, 0, 0, 1, 0, 0); 
        //this.ctxTwo.beginPath();
        if (this.WeddingPhotos[i-1+j].vertical===true){
          this.ctxTwo.drawImage(this.myImage, j*this.maxWPhotoH+j*this.configPhoto.padding, y, this.maxWPhotoV,this.maxHPhoto);
        } else {
              this.ctxTwo.drawImage(this.myImage,j*this.maxWPhotoH+j*this.configPhoto.padding,y,this.maxWPhotoH,this.maxHPhoto);
          }
        //console.log('i= '+i+' nbRow='+nbRow+'  position of the photo is: x= '+j*this.maxWPhotoH+' y= '+y+ ' and size photo is w= '+this.maxWPhotoH+'  height= '+this.maxHPhoto)
    
      }
      //this.ctxTwo.closePath();
      //this.ctxTwo.stroke();
      nbRow++;
  }
 
}

NextDiapo(){
  if (this.SelectedPhoto===0){
      this.SelectedPhoto=this.DiapoForm.controls['StartDiapoNb'].value+1;
  } else if (this.SelectedPhoto< this.WeddingPhotos.length){
      this.SelectedPhoto++
      if (this.SelectedPhoto>this.DiapoForm.controls['EndDiapoNb'].value){
        this.DiapoForm.controls['EndDiapoNb'].setValue(this.SelectedPhoto);
        this.drawDiapoCanvas();
      }
  }
  this.formatSelectedPhoto();
}

PrevDiapo(){
  if (this.SelectedPhoto>1){
    this.SelectedPhoto--;
  }
  if (this.SelectedPhoto<this.DiapoForm.controls['StartDiapoNb'].value){
      this.DiapoForm.controls['StartDiapoNb'].setValue(this.SelectedPhoto);
      this.drawDiapoCanvas();
    }
    this.formatSelectedPhoto();
}

// @HostListener('window:mouseup', ['$event'])
OnClickCanvas(evt: MouseEvent){
    // check which photo is at x=evt.offsetX and y= evt.offsetY
    // nbPhoto per row
    this.callFromCanvas=false;
    //console.log('OnClickCanvas'+ evt+'  x='+evt.offsetX+'  y='+ evt.offsetY+'  photo w='+this.maxWPhotoH+'  photo H='+this.maxHPhoto);
    let x=0;
    let y=0;
    if (evt.offsetY%(this.maxHPhoto+this.configPhoto.padding)===0){
      x=Math.floor(evt.offsetY/(this.maxHPhoto+this.configPhoto.padding));
    } else {
      x=Math.floor(evt.offsetY/(this.maxHPhoto+this.configPhoto.padding))+1;
    }
    if (evt.offsetX/(this.maxWPhotoH+this.configPhoto.padding)===0){
      y=Math.floor(evt.offsetX/(this.maxWPhotoH+this.configPhoto.padding));
    } else {
      y=Math.floor(evt.offsetX/(this.maxWPhotoH+this.configPhoto.padding))+1;
    }

    //console.log('photo is on row '+ x + ' and on column '+ y);

    this.SelectedPhoto=(x-1)*this.nbPhotoPerRow+y+this.DiapoForm.controls['StartDiapoNb'].value-1;


    //console.log('selectd photo ='+this.SelectedPhoto);
    this.formatSelectedPhoto();

}
formatSelectedPhoto(){
  if (this.SelectedPhoto<=this.WeddingPhotos.length){
    if (this.WeddingPhotos[this.SelectedPhoto-1].vertical===true){
      this.SelectedPhotoW=this.theWidthV*1.1;
      this.SelectedPhotoH=this.theHeightV*1.1;
    } else{
      this.SelectedPhotoW=this.theWidthH*1.1;
      this.SelectedPhotoH=this.theHeightH*1.1;
    }
    //console.log('    image is '+this.WeddingPhotos[this.SelectedPhoto-1].name);
} else {
  this.error_Diapo='Please click on the image'
}
this.scroller.scrollToAnchor('TopSelectedPhoto');
this.MorePagesFromCanvas();
}

MorePagesFromCanvas(){
  this.scroller.scrollToAnchor('TopSelectedPhoto');
  if (this.bucketMgt.Nb_Buckets_processed<this.bucketMgt.Max_Nb_Bucket_Wedding){
      this.emitBucketProcessed=true;
      this.callFromCanvas=true;
      this.AddBucket.emit(this.bucketMgt.Nb_Buckets_processed);
  }
} 



drawPhotoCanvas(){
  this.initialdrawCanvas=true;
  //this.LogMsgConsole('drawPhotoCanvas() - WeddingPhotos.length=' + this.WeddingPhotos.length+' initialdrawCanvas ='+this.initialdrawCanvas);
  this.i_loop=0;
  this.j_loop=0;
  this.wait_WeddingPhotos();
}

ManageCanvas(){
  //this.LogMsgConsole('ManageCanvas & message is '+ this.message_canvas + ' length of table is ' + this.WeddingPhotos.length+'  this.PhotoNbForm.controls["SelectNb"].value='+this.PhotoNbForm.controls['SelectNb'].value+ ' first_canvas_displayed'+this.first_canvas_displayed);

 
  this.message_canvas='';
  this.prevCanvasPhoto=this.PhotoNbForm.controls['SelectNb'].value;
  this.ctx.canvas.width=this.PhotoNbForm.controls['Width'].value;
  this.ctx.canvas.height=this.PhotoNbForm.controls['Height'].value;

  if (this.PhotoNbForm.controls['SelectNb'].value!==null){ // a canvas has already been displayed
    if (this.first_canvas_displayed===true){ // the first canvas is loaded otherwise should wait for the first canvas to be loaded [part of the onload process under condition 'else']
        if (this.PhotoNbForm.controls['SelectNb'].value<1 || this.PhotoNbForm.controls['SelectNb'].value>this.WeddingPhotos.length){
            this.error_canvas='value must be between 1 and '+ this.WeddingPhotos.length;
            this.message_canvas='';
          }
        else {
            this.message_canvas= this.WeddingPhotos[this.PhotoNbForm.controls['SelectNb'].value-1].name;
            this.error_canvas='';

            this.myImage=new Image();         
            this.myImage.src=this.WeddingPhotos[this.PhotoNbForm.controls['SelectNb'].value-1].mediaLink;
            //this.LogMsgConsole(' img.src = '+this.WeddingPhotos[this.PhotoNbForm.controls['SelectNb'].value-1].mediaLink);

            this.myImage.onload = () => {
                this.initialCanvasPhoto=this.PhotoNbForm.controls['SelectNb'].value;
                //this.LogMsgConsole(' image ' + this.WeddingPhotos[this.PhotoNbForm.controls['SelectNb'].value-1].mediaLink + ' is loaded');
                this.change_canvas_size(this.initialCanvasPhoto);
                this.LoadImage();
              };
          }
      }  
    } else {
          this.myImage=new Image(); 
          if (this.initialCanvasPhoto>=this.WeddingPhotos.length){
              //this.LogMsgConsole('initialCanvasPhoto='+this.initialCanvasPhoto+'  WeddingPhotos.length = '+this.WeddingPhotos.length);
              if (this.WeddingPhotos.length>0) {
                  this.PhotoNbForm.controls['SelectNb'].setValue(this.WeddingPhotos.length);
                  this.initialCanvasPhoto=this.WeddingPhotos.length;
                  this.myImage.src=this.WeddingPhotos[this.PhotoNbForm.controls['SelectNb'].value-1].mediaLink;
              } else {
                  //this.LogMsgConsole('Big issue as WeddingPhotos.length = '+this.WeddingPhotos.length + '  ; access to ./assets library');
                  this.myImage.src='./assets/Photo3.PNG';
                  this.PhotoNbForm.controls['SelectNb'].setValue(1);
                  this.initialCanvasPhoto=1;
                }
              } else {
                  this.PhotoNbForm.controls['SelectNb'].setValue(this.initialCanvasPhoto);
                  this.myImage.src=this.WeddingPhotos[this.initialCanvasPhoto-1].mediaLink;
              }
          //console.log("draw first canvas image process but no display; this.PhotoNbForm.controls['SelectNb'].value="+this.PhotoNbForm.controls['SelectNb'].value)
          this.PhotoToDisplay[0].wait=true;
          this.nb_current_page=1;
     }
         
  }


wait_WeddingPhotos(){
  
  const pas=2000;
  if (this.max_i_loop%pas===0){
    //this.LogMsgConsole('start wait_WeddingPhotos'+this.WeddingPhotos.length+ '  j_loop '+ this.j_loop+ '  i_loop '+ this.i_loop);
  }
  
  this.i_loop++
  this.j_loop++
  if (this.WeddingPhotos.length===0){
          this.id_Animation=window.requestAnimationFrame(() => this.wait_WeddingPhotos());
  }
  if (this.i_loop > this.max_i_loop || this.WeddingPhotos.length!==0){

    this.calculate_pages();    
    //this.LogMsgConsole('end wait_WeddingPhotos; call ManageCanvas() and then  window.cancelAnimationFrame(this.id_Animation)');

    if (this.configPhoto.process_display_canvas===true){
        this.ManageCanvas();
      }
    window.cancelAnimationFrame(this.id_Animation);
      
  } 
}


change_canvas_size(nb_photo:number){
  ////this.LogMsgConsole('change_canvas_size & nb_photo is ' + nb_photo + '  WeddingPhotos[nb_photo].vertical' + this.WeddingPhotos[nb_photo-1].vertical+ ' image='+this.myImage.src);
  this.ctx.beginPath(); // critical
                  
  this.ctx.globalCompositeOperation = 'source-over';
  if (nb_photo<=this.WeddingPhotos.length && this.WeddingPhotos[nb_photo-1].vertical===true){
    this.ctx.canvas.width=this.theWidthV;
    this.ctx.canvas.height=this.theHeightV;
    this.ctx.canvas.width=this.theWidthV;
    this.ctx.canvas.height=this.theHeightV;
    this.ctx.drawImage(this.myImage,0,0,this.theWidthV,this.theHeightV);
  } else {
    this.ctx.canvas.width=this.theWidthH;
    this.ctx.canvas.height=this.theHeightH;
    this.ctx.canvas.width=this.theWidthH;
    this.ctx.canvas.height=this.theHeightH;
    this.ctx.drawImage(this.myImage,0,0,this.theWidthH,this.theHeightH);
  }
  this.ctx.stroke();
  this.ctx.closePath();
}


ClearCanvas(){
  this.ctx.setTransform(1, 0, 0, 1, 0, 0); 
  this.ctx.beginPath();
  this.ctx.clearRect(0,0,this.theCanvas.width,this.theCanvas.height);
  this.ctx.closePath();
}


}