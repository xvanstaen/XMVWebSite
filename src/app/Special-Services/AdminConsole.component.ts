import { Component, OnInit , Input, HostListener} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { encrypt, decrypt} from '../EncryptDecryptServices';

import { XMVConfig } from '../JsonServerClass';
import { msginLogConsole } from '../consoleLog';
import { LoginIdentif } from '../JsonServerClass';

import { environment } from 'src/environments/environment';
import { EventAug } from '../JsonServerClass';
import { EventCommentStructure } from '../JsonServerClass';
import { TableOfEventLogin } from '../JsonServerClass';
import { BucketList } from '../JsonServerClass';
import { Bucket_List_Info } from '../JsonServerClass';
import { OneBucketInfo } from '../JsonServerClass';
import { msgConsole } from '../JsonServerClass';

@Component({
  selector: 'app-AdminConsole',
  templateUrl: './AdminConsole.component.html',
  styleUrls: ['./AdminConsole.component.css']
})

export class AdminConsoleComponent {

  
  constructor(
    private router:Router,
    private http: HttpClient,
    private scroller: ViewportScroller

    ) {}

    
    @Input() ConfigXMV=new XMVConfig;
    @Input() ListOfBucket=new BucketList;
    @Input() theReceivedData=new Array<msgConsole>();


    myConsole:Array<msgConsole>=[];
    ContentTodisplay:boolean=false;


ngOnInit(){
      //**this.LogMsgConsole('AdminLogin ===== Device ' + navigator.userAgent + '======');

      this.myConsole=this.theReceivedData;
      this.scroller.scrollToAnchor('targetTop');
      this.ContentTodisplay=true;

  }    


}