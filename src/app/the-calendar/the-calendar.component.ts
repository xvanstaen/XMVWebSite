import { Component,  OnInit, AfterViewChecked, AfterViewInit } from '@angular/core';
import { Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig, MatDialog} from '@angular/material/dialog';

import {convertDate} from '../MyStdFunctions'

@Component({
  selector: 'app-the-calendar',
  templateUrl: './the-calendar.component.html',
  styleUrls: ['./the-calendar.component.css']
})
export class TheCalendarComponent implements OnInit {
  
  error_msg: string='';

  oneway_date=new Date(2000/12/31);
  return_date=new Date(2000/12/31);
  theplaceholderO:string="dd-mm-yyyy";
  theplaceholderR:string="dd-mm-yyyy";
  StringtodayDate:string="";
  todayDate=new Date();
  max_date:string='';
  travel_O_R: string='';
  type_error:number=0; 
  oneway_date_string:string='';
  return_date_string:string='';
  test_date_string:string='2000-01-01';
  YY:number=0;
  MM:number=0;
  DD:number=0;

  X:any;


  TheCalendarform: FormGroup = new FormGroup({ 
    oneway_boarding_date: new FormControl('',{nonNullable: true}),
    return_boarding_date: new FormControl('',{nonNullable: true}),
    travel_type: new FormControl('',{nonNullable: true}) //one way or return flight
  })
  
  constructor(
      public matDialog: MatDialog,
      // private datePipe: DatePipe,
      private fb: FormBuilder,
      private dialogRef: MatDialogRef<TheCalendarComponent>,
      @Inject(MAT_DIALOG_DATA) 
      private data: {theorigin_date:string,thereturn_date:string,thetype_T:string},

  ){
      this.oneway_date = new Date(data.theorigin_date);
      this.return_date = new Date(data.thereturn_date);
      this.travel_O_R = data.thetype_T;
  }

  ngOnInit() {
    this.TheCalendarform=this.fb.group({
      oneway_boarding_date: this.oneway_date,
      return_boarding_date: this.return_date,
      travel_type: this.travel_O_R
    });

    this.oneway_date_string=convertDate(this.oneway_date,"yyyy-mm-dd");
    this.return_date_string=convertDate(this.return_date,"yyyy-mm-dd");
    this.StringtodayDate=convertDate(this.todayDate,"yyyy-mm-dd");
    
     this.YY= this.todayDate.getFullYear()+1;
     this.MM = this.todayDate.getMonth()+1;
     this.DD = this.todayDate.getDate()-1;
     if (this.MM< 10) {
        this.max_date=this.YY+"-0"+this.MM+"-"+this.DD;
     }
     else{
          this.max_date=this.YY+"-"+this.MM+"-"+this.DD;
      }

     
     

    if (this.travel_O_R === "") {
      this.theplaceholderO="dd/mm/yyyy";
      this.theplaceholderR="dd/mm/yyyy";
      } 
    else {
      
          this.theplaceholderO=convertDate(this.oneway_date,"dd/mm/yyyy");
          this.TheCalendarform.controls['oneway_boarding_date'].setValue(this.oneway_date);
          //(document.getElementById("oneway") as HTMLInputElement).value=this.oneway_date_string;
          //console.log('Init', document.getElementById("oneway"));
         

          if (this.travel_O_R === "R"){
              this.theplaceholderR=convertDate(this.return_date,"dd/mm/yyyy");
              this.TheCalendarform.controls['return_boarding_date'].setValue(this.return_date);
              //(document.getElementById("return") as HTMLInputElement).value=this.return_date_string;
              
          }
          else{
            this.theplaceholderR="dd/mm/yyyy";
          }

     }
   
  }
  
  OnCancel() {
    this.TheCalendarform.controls['oneway_boarding_date'].setValue(this.oneway_date);
    this.TheCalendarform.controls['return_boarding_date'].setValue(this.return_date);
   this.dialogRef.close(this.TheCalendarform.value);
  }

  OnSubmit() {
    // return the date(s) and type of trip
    this.type_error=0;
    this.error_msg="";
    this.oneway_date = this.TheCalendarform.controls['oneway_boarding_date'].value;
    this.return_date = this.TheCalendarform.controls['return_boarding_date'].value;
    this.travel_O_R = this.TheCalendarform.controls['travel_type'].value;

    
    if (this.return_date.toString().length>10){
      this.return_date_string=convertDate(this.return_date,"yyyy-mm-dd");
    }
    else {this.return_date_string=this.return_date.toString();}


    if (this.oneway_date.toString().length>10){
      this.oneway_date_string=convertDate(this.oneway_date,"yyyy-mm-dd");
    }
    else { this.oneway_date_string=this.oneway_date.toString();}
   

    if (this.travel_O_R ===''){
      this.type_error = 3;
          this.error_msg = "select type of trip";
    }
     else if (this.travel_O_R ==='R' && this.return_date_string === this.test_date_string) {
              this.type_error = 2;
              this.error_msg = " *** select a date ***";
      }
        else if ((this.travel_O_R ==='O' || this.travel_O_R ==='R') &&
              this.oneway_date_string === this.test_date_string){
              this.type_error = 1;
              this.error_msg = " *** select a date ***";
        }
          else if (this.oneway_date_string < this.StringtodayDate){
              this.type_error = 4;
              this.error_msg = " *** date must be equal or later than today ***";
          }
              else if (this.return_date_string < this.StringtodayDate){
                this.type_error = 5;
                this.error_msg = " *** date must be greater than today ***";
              }
                  else if (this.return_date_string < this.oneway_date_string){
                      this.type_error = 6;
                      this.error_msg = " *** return date must be after first date ***";
                  }
                    else{
                        this.dialogRef.close(this.TheCalendarform.value); 
                    }
  }

  clear(){

  }

  
  ngAfterViewInit(){
    // **** Two mwthods to initialise the date fields
    if (this.oneway_date_string !== this.test_date_string){
        this.X=document.getElementById("oneway");
        this.X.value=this.oneway_date_string;
      }
    if (this.return_date_string !== this.test_date_string){
       (document.getElementById("return") as HTMLInputElement).value=this.return_date_string;
      }


  }


}


