import { Component, OnInit,Inject, LOCALE_ID, HostListener} from '@angular/core';
import { formatDate } from '@angular/common'; 
import { MatDialogConfig, MatDialog} from '@angular/material/dialog';

//import { DateTime } from "luxon";
//import 'moment/locale/pt-br';

import { TheCalendarComponent } from '../the-calendar/the-calendar.component'
import { GlobalVariables } from '../Global_Variables';

// function that adds numbers - used just for testing purpose
//import {addNumbers} from '../add-number.component';

import { MyDatePickerComponent } from '../my-date-picker/my-date-picker.component'

import { BookingDialogComponent } from '../booking-dialog/booking-dialog.component'; 

import {TravelDates } from '../apt_code_name';

@Component({
  selector: 'BookingFormComponent',
  templateUrl: './Booking-form.component.html',
  styleUrls: ['./Booking-form.component.css']

})
export class BookingFormComponent { 

//OurDate = new DateTime;
//tomorrow = new DateTime;

getScreenWidth: any;
getScreenHeight: any;
device_type:string='';

Thebottom:number=0;
TheHeight:number=0;
Max_Width:string='';

origin_arrival: string = "";

departure_city_code: string = GlobalVariables.departure_apt_code;
departure_city_name: string = GlobalVariables.departure_apt_name;
arrival_city_code: string = GlobalVariables.arrival_apt_code;
arrival_city_name: string = GlobalVariables.arrival_apt_name;
date_O=new Date("2000-01-01");
date_R=new Date("2000-01-01");
type_T: string="";
sdate_O: string="";
sdate_R: string="";
MyBoardingDate: string="Boarding date"; 
vyear: number=0;
vmonth: number=0;
vday: number=0;

return_calendar:any={
  oneway_boarding_date:'',
  return_boarding_date:'',
  travel_type:''
}


searchstring: string="";
MyAptCode: string="";
k:number=0;
 // result = '{"origin_arrival":"A","aptcode":"A","aptname":"A","aptcodefound":true}';

 // this is an example - html can then use {{MyNumbers}} 
MyNumbers:number=0;

constructor(
  //public datepipe: DatePipe,
  @Inject(LOCALE_ID) private locale: string,
  private matDialog: MatDialog
  ) {}  
    
ngOnInit(){
   //  this.OurDate = DateTime.local();
   //  this.tomorrow = this.OurDate.plus({ days: 1 });

   this.getScreenWidth = window.innerWidth;
   this.getScreenHeight = window.innerHeight;
   this.device_type = navigator.userAgent;
   this.device_type = this.device_type.substring(10, 48);
  }


@HostListener('window:resize', ['$event'])
onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;
  }

OnAction(event:number){
  // triger the calendar component that will return type of trip [one-way or return]
  // and departure date(s) [one or two)]
  // 


  const dialogConfig = new MatDialogConfig();
  
  if (event === 1){
    this.TheHeight=550;
    this.Max_Width='600px'
      }
  else if (event === 2){
    this.TheHeight=500;
    this.Max_Width='1000px'
    }
  this.Thebottom = 700-this.TheHeight;

  dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.panelClass = 'MypanelClass';                                                                                                                                                                      
      dialogConfig.backdropClass = 'MybackdropClass';
      dialogConfig.width = '100%';
      dialogConfig.height = this.TheHeight.toString() + 'px';
      dialogConfig.maxWidth = this.Max_Width;
      if (this.getScreenHeight<630){
        dialogConfig.height = (window.innerHeight-40)+'px'; 
        dialogConfig.position = {
          bottom:'10px',
          left: '4%',   
                  
        };
      }
      else {
        dialogConfig.position = {
          bottom: this.Thebottom.toString() + 'px',
          left: '15px',           
        };
      }

    dialogConfig.data={
          theorigin_date: this.date_O,
          thereturn_date: this.date_R,
          thetype_T: this.type_T
      };
      
      if (event === 1){
        const dialogRef = this.matDialog.open(TheCalendarComponent , dialogConfig);
        dialogRef.afterClosed().subscribe((result: TravelDates) => {
            this.return_calendar=result;
            this.Process_dates();
        });
      }
      else if (event === 2){
        const dialogRef = this.matDialog.open(MyDatePickerComponent , dialogConfig);
        dialogRef.afterClosed().subscribe((result: TravelDates) => {
            this.return_calendar=result;
            this.Process_dates();
        });
      }
     
}

Process_dates(){
  this.date_O= this.return_calendar.oneway_boarding_date; 
  this.date_R= this.return_calendar.return_boarding_date;
  this.type_T= this.return_calendar.travel_type;

  if (this.type_T==="R") {
    this.MyBoardingDate = formatDate(this.date_O,"dd-MM-yyyy",this.locale).toString() + " - " + formatDate(this.date_R,"dd-MM-yyyy",this.locale).toString();
  }
  else if(this.type_T==="O") {
     this.MyBoardingDate = formatDate(this.date_O,"dd-MM-yyyy",this.locale).toString();
  }
  else{
    this.MyBoardingDate = "Boarding date";
  }
}


OnAction3(){
  //this.MyNumbers=addNumbers(6,3,4);
}
OnAction4(){
  //this.MyNumbers=addNumbers(8,3,4);
}
                  

OpenSearchAptDialog(typebox: string) {
      this.origin_arrival = typebox;
     
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.panelClass = 'MypanelClass';                                                                                                                                                                      
      dialogConfig.backdropClass = 'MybackdropClass';
      dialogConfig.width = '92%';
      dialogConfig.height = '350px';
      dialogConfig.maxWidth = '800px';

      if (this.getScreenHeight<420){
        // dialogConfig.height = (window.innerHeight-40)+'px'; 
        dialogConfig.position = {
          bottom:'10px',
          left: '4%',          
        };
      }
      else {
        dialogConfig.position = {
          left: '4%',           
        };
      }

    dialogConfig.data={
      origin_dest: this.origin_arrival,
      aptcode: "",
      aptname: "",
      aptcodefound: false
    }

    const dialogRef = this.matDialog.open(BookingDialogComponent , dialogConfig);

    dialogRef.afterClosed().subscribe((result: string) => {
      if (result.length !== 0) {
        
        this.searchstring = JSON.stringify(result);
        const obj = JSON.parse(this.searchstring);
        this.MyAptCode = obj.aptname;
        // if length city name is too long then only display what is before the "/"
        this.k=this.MyAptCode.search("/");
        
        if ( this.k > 0 ) {
            this.MyAptCode = this.MyAptCode.substring(0,this.k);
        }
        
        if (typebox == "Origin") {
          GlobalVariables.departure_apt_code = obj.aptcode;
          GlobalVariables.departure_apt_name = this.MyAptCode;
          this.departure_city_code = obj.aptcode;
          this.departure_city_name = this.MyAptCode;
        }
        else {
          GlobalVariables.arrival_apt_code = obj.aptcode;
          GlobalVariables.arrival_apt_name = this.MyAptCode;
          this.arrival_city_code = obj.aptcode;
          this.arrival_city_name = this.MyAptCode;
        }
      }

    })  

  }
}
