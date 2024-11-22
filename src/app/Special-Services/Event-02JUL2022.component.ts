import { Component, Input, HostListener, } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { FormGroup, FormControl, Validators} from '@angular/forms';
import { ViewportScroller } from "@angular/common";

import {Bucket_List_Info, configServer} from '../JsonServerClass';
import { StructurePhotos } from '../JsonServerClass';
import { BucketExchange } from '../JsonServerClass';
import { UserParam } from '../JsonServerClass';
import { EventAug } from '../JsonServerClass';
import { LoginIdentif } from '../JsonServerClass';

@Component({
  selector: 'app-Event-02JUL2022',
  templateUrl: './Event-02JUL2022.component.html',
  styleUrls: ['./Event-02JUL2022.component.css']
})

export class Event02JULComponent {

  constructor(
    private router:Router,
    private http: HttpClient,
    private scroller: ViewportScroller,
    ) {}
    
    @Input() LoginTable_User_Data:Array<EventAug>=[];
    @Input() LoginTable_DecryptPSW:Array<string>=[];
    @Input() ConfigXMV=new configServer;
    @Input() identification= new LoginIdentif;

    getScreenWidth: any;
    getScreenHeight: any;
    device_type:string='';

    text_error:string=''
 
    pagePhotos:boolean=true;
    nextBucketOnChange:number=0;
    bucketMgt=new BucketExchange;
    Bucket_Info_Array:Array<Bucket_List_Info>=[];
    ref_Bucket_List_Info=new Bucket_List_Info;
    WeddingPhotos:Array<StructurePhotos>=[];
    myLogConsole:boolean=false;
    myConsole:Array<string>=[];
    SaveConsoleFinished:boolean=true;

@HostListener('window:resize', ['$event'])
onWindowResize() {
      this.getScreenWidth = window.innerWidth;
      this.getScreenHeight = window.innerHeight;
      console.log('ConfigXMV',this.ConfigXMV);
    }


  ngOnInit(){
      this.getScreenWidth = window.innerWidth;
      this.getScreenHeight = window.innerHeight;
  }

  goDown(event:string){
    this.pagePhotos=false;
    this.scroller.scrollToAnchor(event);
  }
  displayWedPhotos(){
    //**console.log('displayWedPhotos() in Event-02JUL');
    const pas=20;
    this.pagePhotos=true;
 
  }
}