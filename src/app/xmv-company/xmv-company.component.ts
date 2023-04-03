
import { Component, HostListener, OnInit, OnChanges, Input, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { LoginIdentif } from '../JsonServerClass';
import { configServer } from '../JsonServerClass';
import { XMVConfig } from '../JsonServerClass';

import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';


@Component({
  selector: 'app-xmv-company',
  templateUrl: './xmv-company.component.html',
  styleUrls: ['./xmv-company.component.css']
})
export class XmvCompanyComponent implements OnInit, OnChanges, AfterViewChecked {

  constructor(

    private http: HttpClient, 
    private router:Router,
    private cdref: ChangeDetectorRef,
    private ManageGoogleService: ManageGoogleService,
    private ManageMangoDBService: ManageMangoDBService,
    ) {}
  
  @Input() configServer=new configServer;
  @Input() XMVConfig=new XMVConfig;
  @Input() isConfigServerRetrieved:boolean=false;
  redisplay_profile:number=0;

  display_GoToContact:number=0;
  display_GoToOffer:number=0;
  getScreenWidth: any;
  getScreenHeight: any;
  device_type:string='';

  selected_offer:string='';

  /***  
   to keep identification and psw of the user ; information 
   is passed by login.component.ts through [identification]="identif" 
  */
 
  identif=new LoginIdentif;

  Events_nb:string='';

  i_Profile:number=0;
  i_Offer:number=1;
  i_Contact:number=2;
  i_HomePage:number=3;
  i_Login:number=4;
  i_Event:number=5;
  Profile:string="Profile";
  Offer:string="Offer";
  Contact:string="Contact";
  HomePage:string="HomePage";
  AdmLogin:string="Login";
  MyEvents:string="Events";
  i_table:number=0;
  Display_Table:Array<any>=[
    {type:'', display:false}, 
    {type:'', display:false}, 
    {type:'', display:false}, 
    {type:'', display:false},
    {type:'', display:false}, 
    {type:'', display:false}, 
    {type:'', display:false}, 

  ];

  ngOnInit(): void {
    this.i_table=this.i_HomePage;
    this.Display_Table[this.i_table].display=true;
    this.Display_Table[this.i_Profile].type=this.Profile;
    this.Display_Table[this.i_Offer].type=this.Offer;
    this.Display_Table[this.i_Contact].type=this.Contact;
    this.Display_Table[this.i_HomePage].type=this.HomePage;
    this.Display_Table[this.i_Login].type=this.AdmLogin;
    this.Display_Table[this.i_Event].type=this.MyEvents;
    
    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;
    this.device_type = navigator.userAgent;
    this.device_type = this.device_type.substring(10, 48);

    this.identif.id=0;
    this.identif.key=2;
    this.identif.method="AES";
    this.identif.UserId="";
    this.identif.psw="";
    this.identif.phone="";
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;
  }

  Display_Profile(){
    this.redisplay_profile++;
    this.Display_Table[this.i_table].display=false;
    this.i_table=this.i_Profile;
    this.Display_Table[this.i_table].display=true;
  }

  Reset(event:number){
    this.redisplay_profile=1;
  }

  Display_Contact(){
    this.Display_Table[this.i_table].display=false;
    this.i_table=this.i_Contact;
    this.Display_Table[this.i_table].display=true;
  }

  Display_Offer(){
    this.Display_Table[this.i_table].display=false;
    this.i_table=this.i_Offer;
    this.Display_Table[this.i_table].display=true;
    this.selected_offer='';
  }

  Display_HomePage(){
    this.Display_Table[this.i_table].display=false;
    this.i_table=this.i_HomePage;
    this.Display_Table[this.i_table].display=true;
  }


  Display_Events(){
    this.Display_Table[this.i_table].display=false;
    this.i_table=this.i_Event;
    this.Display_Table[this.i_table].display=true;
 }
  RouteTo(theAction:string){
    if (theAction==='login'){
      this.Display_Table[this.i_table].display=false;
      this.i_table=this.i_Login;
      this.Display_Table[this.i_table].display=true;
       //this.router.navigateByUrl('TheLogin');
    }
  }
  
  goDown1(action:string){
    this.Display_Table[this.i_table].display=false;
    this.i_table=this.i_Offer;
    this.Display_Table[this.i_table].display=true;
    this.selected_offer = action;
  }

  TheIdentifObject(event:any){
    this.identif=event;
    // console.log(this.identif);
  }

  TheLoginRoute(event:any){
    this.Events_nb = event;
  }

  BackTo(event:any){
   
  }

  TopicURL(){

  }
  ngOnChanges(){
   // console.log('on changes');
  }

  ngAfterViewChecked(){
    this.cdref.detectChanges();
    // console.log('cdref',this.cdref.detectChanges());
  }

}

