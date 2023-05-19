
import {  ChangeDetectorRef } from '@angular/core';
import { Component, OnInit , Input, Output, HostListener, OnChanges, HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
  
import { Router, RouterModule } from '@angular/router';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { LoginIdentif } from '../JsonServerClass';
import { configServer } from '../JsonServerClass';
import { XMVConfig } from '../JsonServerClass';
import {mainClassConv,mainConvItem, mainRecordConvert, mainClassUnit} from '../ClassConverter';
import {mainClassCaloriesFat, mainDailyReport} from '../Health/ClassHealthCalories';
import {ConfigFitness} from '../Health/ClassFitness';
import { classConfigChart, classchartHealth } from '../Health/classConfigChart';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';
import {classConfHTMLFitHealth} from '../Health/classConfHTMLTableAll';

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
  @Output() returnFile= new EventEmitter<any>();

  redisplay_profile:number=0;

  ConfigCaloriesFat=new mainClassCaloriesFat;
  ConfigChart=new classConfigChart;
  ConvertUnit=new mainClassConv;
  ConvToDisplay=new mainConvItem;
  theTabOfUnits=new mainClassUnit;
  WeightRefTable=new mainRecordConvert;

  MyConfigFitness=new ConfigFitness;

  HealthAllData=new mainDailyReport; 
  ConfigHTMLFitHealth=new classConfHTMLFitHealth;

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
 
  identification=new LoginIdentif;

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

    this.identification.id=0;
    this.identification.key=2;
    this.identification.method="AES";
    this.identification.UserId="";
    this.identification.psw="";
    this.identification.phone="";
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
    this.identification=event;
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

  
  }
}

