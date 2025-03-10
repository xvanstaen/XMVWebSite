
import {  ChangeDetectorRef } from '@angular/core';
import { Component, OnInit , Input, Output, HostListener, OnChanges, HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';


import { MatIconModule} from '@angular/material/icon';
import { CommonModule,  DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { XMVCompanyContactComponent } from '../xmv-company/xmvcompany-contact/xmvcompany-contact.component';
import { XMVCompanyOfferComponent } from '../xmv-company/xmvcompany-offer/xmvcompany-offer.component';
import { XMVCompanyProfileComponent } from '../xmv-company/xmvcompany-profile/xmvcompany-profile.component';
import { LoginComponent } from '../Login/login.component';

import { configServer, LoginIdentif, classCredentials } from '../JsonServerClass';

import {mainClassConv,mainConvItem, mainRecordConvert, mainClassUnit} from '../ClassConverter';
import {mainClassCaloriesFat, mainDailyReport} from '../Health/ClassHealthCalories';
import {ConfigFitness} from '../Health/ClassFitness';
import { classConfigChart, classchartHealth } from '../Health/classConfigChart';

import {classConfHTMLFitHealth} from '../Health/classConfHTMLTableAll';

@Component({
  selector: 'app-xmv-company',
  templateUrl: './xmv-company.component.html',
  styleUrls: ['./xmv-company.component.css'],
  standalone: true, 
  imports:[CommonModule, FormsModule, ReactiveFormsModule, MatIconModule , XMVCompanyContactComponent, XMVCompanyOfferComponent, XMVCompanyProfileComponent
    , LoginComponent ],

})
export class XmvCompanyComponent implements OnInit, OnChanges, AfterViewChecked {

  constructor(
    private cdref: ChangeDetectorRef,
    ) {}
  
  @Input() configServer=new configServer;
  @Input() isConfigServerRetrieved:boolean=false;
  @Input() identification=new LoginIdentif;
  @Input() credentials = new classCredentials;
  @Input() credentialsMongo = new classCredentials;
  @Input() credentialsFS = new classCredentials;
  @Input() configServerChanges:number=0;

  @Output() resetServer= new EventEmitter<any>();
  @Output() newCredentials= new EventEmitter<any>();
  @Output() returnFile= new EventEmitter<any>();
  @Output() callUserFunction= new EventEmitter<any>();
  @Output() triggerUserFunction= new EventEmitter<any>();
  @Output() triggerIdentification = new EventEmitter<any>();
  
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
 
  //identification=new LoginIdentif;

  Events_nb:string='';

  emailXMV:string="xvanstaen@xmv-it.com";

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
  isDropDown:boolean=false;

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
    /*
    if (this.INidentification.UserId!==''){
        this.identification=this.INidentification;
    } else {
        this.identification.id=0;
        this.identification.UserId="";
        this.identification.phone="";
    }
    */
    //console.log('xmv-company - init --- configServer.google='+this.configServer.googleServer);
  }
  dropDown(event:any){
    this.isDropDown=true;
    this.i_table=this.i_Offer;
    this.Display_Table[this.i_table].display=true;
  }
  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;
  }

  Display_Profile(){
    this.isDropDown=false;
    this.redisplay_profile++;
    this.Display_Table[this.i_table].display=false;
    this.i_table=this.i_Profile;
    this.Display_Table[this.i_table].display=true;
  }

  Reset(event:number){
    this.redisplay_profile=1;
    this.isDropDown=false;
  }

  Display_Contact(){
    this.isDropDown=false;
    this.Display_Table[this.i_table].display=false;
    this.i_table=this.i_Contact;
    this.Display_Table[this.i_table].display=true;
  }

  Display_Offer(){
    this.isDropDown=false;
    this.Display_Table[this.i_table].display=false;
    this.i_table=this.i_Offer;
    this.Display_Table[this.i_table].display=true;
    this.selected_offer='';
  }

  Display_HomePage(){
    this.isDropDown=false;
    this.Display_Table[this.i_table].display=false;
    this.i_table=this.i_HomePage;
    this.Display_Table[this.i_table].display=true;
  }


  Display_Events(){
    this.isDropDown=false;
    if (this.configServer.devMode==='local'){
        this.callUserFunction.emit(true);
    } else {
      this.Display_Table[this.i_table].display=false;
      this.i_table=this.i_Event;
      this.Display_Table[this.i_table].display=true;
    }   
 }
  triggerUserFn(event:any){
    this.callUserFunction.emit(true);
  }

  RouteTo(theAction:string){
    this.isDropDown=false;
    if (theAction==='login'){
      this.Display_Table[this.i_table].display=false;
      this.i_table=this.i_Login;
      this.Display_Table[this.i_table].display=true;
       //this.router.navigateByUrl('TheLogin');
    }
  }
  
  goDown1(action:string){
    this.isDropDown=false;
    this.Display_Table[this.i_table].display=false;
    this.i_table=this.i_Offer;
    this.Display_Table[this.i_table].display=true;
    this.selected_offer = action;
  }

  TheIdentifObject(event:any){
    this.identification=event;
    this.triggerIdentification.emit(this.identification);
    // console.log(this.identif);
  }

  TheLoginRoute(event:any){
    this.Events_nb = event;
  }


  ngOnChanges(){
   // console.log('on changes');
   //console.log('xmv-company - ngOnChanges --- configServer.google='+this.configServer.googleServer);

  }

  ngAfterViewChecked(){
    this.cdref.detectChanges();
    // console.log('cdref',this.cdref.detectChanges());
  }
/*
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
*/
  fnResetServer(){
          this.resetServer.emit();
    }
  
  fnNewCredentials(credentials:any){
      this.identification.userServerId=credentials.userServerId;
      this.identification.credentialDate=credentials.creationDate;
      this.newCredentials.emit(credentials);
  }

  @Output() serverChange=  new EventEmitter<any>();
  changeServerName(event:any){
    if (event==='FS'){
      this.serverChange.emit('FS');
    } else  if (event==='Google'){
      //console.log('xmv-company - getServerName --- configServer.google='+this.configServer.googleServer);

      this.serverChange.emit('Google');
    } else  if (event==='Mongo'){
      this.serverChange.emit('Mongo');
    }

  }

}

