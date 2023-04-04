
import { Component, OnInit, AfterViewInit, Inject,LOCALE_ID, EventEmitter, OnChanges, SimpleChanges} from '@angular/core';
import { DatePipe, formatDate } from '@angular/common'; 
import { Output, Input, Pipe, PipeTransform, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig, MatDialog} from '@angular/material/dialog';
// import {MatDatepicker, MatDateRangePicker, MatDatepickerToggle} from '@angular/material/datepicker';

//import * as moment from 'moment';
//import 'moment/locale/pt-br';
// import {MatRadioModule} from '@angular/material/radio';  
   


import {manage_input} from '../manageinput';
import{generate_calendar, selectDay} from '../generate_calendar';

import {WeekDays} from '../ArrayCityRegion';
import {eventoutput, fillcalendar, thedateformat, DaysOfMonths } from '../apt_code_name';

@Component({
  selector: 'app-one-calendar',
  templateUrl: './one-calendar.component.html',
  styleUrls: ['./one-calendar.component.css']
})

export class OneCalendarComponent implements OnInit {
  

  @Input() Input_MinDate=new Date();
  @Input() Input_MaxDate=new Date();
  @Input() Input_Travel_O_R:string='';
  @Input() Input_SelectedDate=new Date();
  @Input() Input_IsSelectedDate:boolean=false;
  @Input() DisplayCalendarOnly:boolean=false;
  @Output() my_SelectedDate= new EventEmitter<any>();

  myObj= new eventoutput;
  
  initObj:fillcalendar = {
    monthname_c:'',
    monthname_n:'',
    weekday_n:0,
    weekday_c:0,
    dayspermonth1:[],
    dayspermonth2:[],

    datePipe_OW:new Date("2000/01/01"),
    datePipe_RET:new Date("2000/01/01"),

    input_OW:"",
    input_RET:"",
    valid_input_OW:"",
    valid_input_RET:"",
    
    today_year:0,
    today_month:0,
    today_day:0,
  
    yearnb:0,
    monthnb:0,
    daynb:0,

    nyearnb:0,
    nmonthnb:0,
    ndaynb:0,

    display_yearnb:0,
    display_monthnb:0,
    display_daynb:0,

    display_nyearnb:0,
    display_nmonthnb:0,
    display_ndaynb:0,

    maxDate_day:0,
    maxDate_month:0,
    maxDate_year:0,

    minDate_day:1,
    minDate_month:12,
    minDate_year:2022,

    type_error:0,
    error_msg:'',
}
  FirstSelection=true;
  IsDateSelected:boolean=false;
  todayDate=new Date();

  oneway_date=new Date("2000/01/01");
  return_date=new Date("2000/01/01");
  refDate=new Date("2000/01/01");
  

  placeholderOW:string="dd-mm-yyyy";
  placeholderR:string="dd-mm-yyyy";
  
  Display_p_holder_ow:string='Y';
  Display_p_holder_r:string='Y';

  ref_format= new thedateformat;

  type_input:string='';
  type_arrow:string='';

  //inputDate=moment(); // to be tested
  varDate=new Date();

  work_string:string="";

  i:number=0;

  SelectedDay?:DaysOfMonths;

  // number of characters to display for the days
  nb_char: number=3;

  error_msg:string="";
  type_error:number=0;
  var_number:number=0;

  StringOfDays=WeekDays;

  travel_O_R: string='';

  datePipeToday?: any;
  datePipeMax?: any;

  DisplayCalendar:boolean=false; 
  
  maxDate=new Date();
  minDate=new Date();
 
  datePipeMin?: any;
  
  FormatValidationOnly:boolean=true;
  ToReturn={theID:0, theDate:new Date()};

  DaySelection={
    day:0,
    month:0,
    year:0
   }

  constructor(
    public matDialog: MatDialog,
    private datePipe: DatePipe,
    @Inject(LOCALE_ID) private locale: string,


    private fb: FormBuilder,
    //**private dialogRef: MatDialogRef<OneCalendarComponent>,
    //**@Inject(MAT_DIALOG_DATA)
    //**private data: {theorigin_date:string,thereturn_date:string,thetype_T:string},
){
    //**this.oneway_date = new Date(data.theorigin_date);
    //**this.return_date = new Date(data.thereturn_date);
    //**this.travel_O_R = data.thetype_T;
}


  ngOnInit() {
    
   // this.IsDateSelected=false;
    this.maxDate=this.Input_MaxDate;
    this.minDate=this.Input_MinDate;

    //**** added on 23FEB2023 */
    this.initObj.valid_input_RET="";
    //

    this.ref_format.length_day=2;
    this.ref_format.length_month=2;
    this.ref_format.length_year=4;
    this.ref_format.MyDateFormat="dd-MM-yyyy";
    this.ref_format.separator_char="-";
   
    // input will be tested against the date format
    this.ref_format.day_position = this.ref_format.MyDateFormat.indexOf("d")+1;
    if (this.ref_format.day_position===0) {this.ref_format.day_position = this.ref_format.MyDateFormat.indexOf("D")+1};
    this.ref_format.month_position = this.ref_format.MyDateFormat.indexOf("m")+1;
    if (this.ref_format.month_position===0) {this.ref_format.month_position = this.ref_format.MyDateFormat.indexOf("M")+1};
    this.ref_format.year_position = this.ref_format.MyDateFormat.indexOf("y")+1;
    if (this.ref_format.year_position===0) {this.ref_format.year_position = this.ref_format.MyDateFormat.indexOf("Y")+1};

    this.ref_format.separator_one_p=this.ref_format.MyDateFormat.indexOf(this.ref_format.separator_char)+1;
    this.ref_format.separator_two_p= this.ref_format.separator_one_p+this.ref_format.MyDateFormat.substr(this.ref_format.separator_one_p,this.ref_format.MyDateFormat.length-this.ref_format.separator_one_p).indexOf(this.ref_format.separator_char)+1;

   // if not date has been input yet then display how the date should be entered e.g. "yyyy-mm-dd"
   if (formatDate(this.oneway_date,"yyyy-MM-dd",this.locale) === formatDate(this.refDate,"yyyy-MM-dd",this.locale))
    {
      this.Display_p_holder_ow='Y'

    } 
    else{this.Display_p_holder_ow='N'}
   
    // for stat fitness

    this.initObj.minDate_year=parseInt(formatDate(this.minDate,'yyyy',this.locale));
    this.initObj.minDate_month=parseInt(formatDate(this.minDate,'MM',this.locale));
    this.initObj.minDate_day=parseInt(formatDate(this.minDate,'dd',this.locale));
    //this.minDate=new Date(this.initObj.minDate_year,this.initObj.minDate_month,this.initObj.minDate_day);
    this.datePipeMin = this.datePipe.transform(this.minDate,"YYYY-MM-dd");

    
    this.initObj.maxDate_year=parseInt(formatDate(this.maxDate,'yyyy',this.locale));
    this.initObj.maxDate_month=parseInt(formatDate(this.maxDate,'MM',this.locale));
    this.initObj.maxDate_day=parseInt(formatDate(this.maxDate,'dd',this.locale));
    //this.maxDate=new Date(this.initObj.maxDate_year,this.initObj.maxDate_month-1,this.initObj.maxDate_day);

    
    // 2 methods to format a date
    this.datePipeToday = this.datePipe.transform(this.todayDate,"yyyy-MM-dd");
    this.datePipeMax = formatDate(this.maxDate,"yyyy-MM-dd",this.locale);
    this.datePipeMax = this.datePipe.transform(this.maxDate,"YYYY-MM-dd");
     

    this.initObj.today_year=parseInt(formatDate(Date.now(),'YYYY',this.locale));
    this.initObj.today_month=parseInt(formatDate(Date.now(),'MM',this.locale));
    this.initObj.today_day=parseInt(formatDate(Date.now(),'dd',this.locale));

  
    this.travel_O_R = this.Input_Travel_O_R;
    if (this.travel_O_R ==='' || this.Input_IsSelectedDate===false) {

        this.initObj.valid_input_OW="N";
        this.initObj.monthnb=parseInt(formatDate(Date.now(),'MM',this.locale));
        this.initObj.yearnb=parseInt(formatDate(Date.now(),'YYYY',this.locale));
        this.initObj.daynb=parseInt(formatDate(Date.now(),'dd',this.locale));
  
        this.initObj=generate_calendar("", "",this.initObj);


    } else if (this.travel_O_R ==='O') {
          this.initObj.valid_input_OW="Y";
          //this.initObj.datePipe_OW=this.TheCalendarform.controls['oneway_boarding_date'].value;
          this.initObj.monthnb=parseInt(formatDate(this.Input_SelectedDate,'MM',this.locale));
          this.initObj.yearnb=parseInt(formatDate(this.Input_SelectedDate,'YYYY',this.locale));
          this.initObj.daynb=parseInt(formatDate(this.Input_SelectedDate,'dd',this.locale)); 
          this.initObj.display_monthnb=this.initObj.monthnb;
          this.initObj.display_daynb=this.initObj.daynb;
          this.initObj.display_yearnb=this.initObj.yearnb;

          this.initObj.datePipe_OW.setDate(this.initObj.daynb);
          this.initObj.datePipe_OW.setMonth(this.initObj.monthnb-1);
          this.initObj.datePipe_OW.setFullYear(this.initObj.yearnb);
          this.initObj.input_OW = formatDate(this.initObj.datePipe_OW,this.ref_format.MyDateFormat,this.locale).toString();
          this.initObj=generate_calendar("NO", "",this.initObj);   
          this.DaySelection.day=this.initObj.daynb;
          this.DaySelection.month=this.initObj.monthnb;
          this.DaySelection.year=this.initObj.yearnb;
        }

    for (this.i=0; this.i<7; this.i++) {
      this.StringOfDays[this.i].DoW = WeekDays[this.i].DoW.substr(0,this.nb_char);
    }
  }
 
  OnCancel() {
    // if any, date input by user is ignored
    
    // trigger the event through Output to reset this.DisplayCalendar to false so that the calendar will not be displayed in fitness-stat

    //this.dialogRef.close(this.TheCalendarform.value);

    
    this.DisplayCalendar=false;
    this.IsDateSelected=false;
    this.initObj.input_OW='';
    if (this.DisplayCalendarOnly===true){
      const datePipe_OW=new Date(1000,0,1);
      this.my_SelectedDate.emit(datePipe_OW);
      //this.my_SelectedDate.emit(this.ToReturn);
    }
   }

  OnInputOW(event:any){
    
    this.initObj.input_OW = event.target.value;
    this.work_string=event.inputType ;

    this.FormatValidationOnly=false;
    //this.datePipeMax=this.datePipeToday;

    this.myObj=manage_input(
      this.initObj.input_OW,
      this.work_string,
      this.ref_format,
      this.initObj.maxDate_year,
      this.initObj.today_year,
      this.datePipe,
      this.datePipeMax,
      this.datePipeToday,
      this.datePipeMin,
      this.FormatValidationOnly);

      this.initObj.input_OW=this.myObj.theInput;
      this.error_msg=this.myObj.error_msg;
      this.type_error=this.myObj.type_error;
      this.DaySelection.day=0;
      this.DaySelection.month=0;
      this.DaySelection.year=0;
      this.IsDateSelected=false;
    if (this.type_error===0){
      if (this.initObj.input_OW.length<this.ref_format.MyDateFormat.length && this.initObj.valid_input_OW==="Y") {
        // must reinitialise to the current month
       
        this.initObj=generate_calendar("","", this.initObj);
        
      }

      if (this.type_error===0 && this.initObj.input_OW.length===this.ref_format.MyDateFormat.length ){
          // full date is correct; display corresponding calendar
          this.initObj.daynb=Number(this.myObj.input_day);
          this.initObj.monthnb=Number(this.myObj.input_month);
          this.initObj.yearnb=Number(this.myObj.input_year);
          this.initObj.valid_input_OW="Y";
          
          this.initObj=generate_calendar("OW","", this.initObj); 
          
          this.initObj.datePipe_OW.setDate(this.initObj.daynb);
          this.initObj.datePipe_OW.setMonth(this.initObj.monthnb-1);
          this.initObj.datePipe_OW.setFullYear(this.initObj.yearnb);

          this.DaySelection.day=this.initObj.daynb;
          this.DaySelection.month=this.initObj.monthnb;
          this.DaySelection.year=this.initObj.yearnb;
          
          this.MinMaxTest('Min');
          if (this.error_msg===''){
            this.MinMaxTest('Min');
          }
          if (this.error_msg===''){
              this.DisplayCalendar=true;
              this.IsDateSelected=true;
         }

 
      } this.initObj.valid_input_OW="N";

      if (this.initObj.input_OW.length>0) {
        this.Display_p_holder_ow="N";
      } else {
        this.Display_p_holder_ow="Y";
      }
    }
  } // end of OnInputOW


  
  OnArrowLeft(the_arrow:string){
    
      this.initObj=generate_calendar("Force_Previous","", this.initObj);
      this.MinMaxTest('Min');
        
        
   }
  OnArrowRight(event:any){
      this.initObj=generate_calendar("Force_Next","", this.initObj);
      this.MinMaxTest('Max');
   }

   MinMaxTest(test:string){
    if (test==='Min') {
      if(this.initObj.display_yearnb< this.initObj.minDate_year || ( this.initObj.display_yearnb=== this.initObj.minDate_year &&  this.initObj.display_monthnb< this.initObj.minDate_month)
      || ( this.initObj.display_yearnb=== this.initObj.minDate_year 
        && this.initObj.display_monthnb===this.initObj.maxDate_month
        &&  this.initObj.display_daynb< this.initObj.minDate_day))
      {
        this.error_msg='date cannot be before ' + this.datePipeMin;
      } else {
              this.error_msg='';
              this.initObj.yearnb=this.initObj.display_yearnb;
              this.initObj.monthnb=this.initObj.display_monthnb;
              this.initObj.daynb=this.initObj.display_daynb;
              }
    } else if (test==='Max') {
          if(this.initObj.display_yearnb>this.initObj.maxDate_year || ( this.initObj.display_yearnb=== this.initObj.maxDate_year &&  this.initObj.display_monthnb>this.initObj.maxDate_month)
          || ( this.initObj.display_yearnb=== this.initObj.maxDate_year  && 
            this.initObj.display_monthnb===this.initObj.maxDate_month
            &&  this.initObj.display_daynb>this.initObj.maxDate_day))
          {
            this.error_msg='date cannot be beyond ' + this.datePipeMax;
          } else {
               this.error_msg='';
               this.initObj.yearnb=this.initObj.display_yearnb;
               this.initObj.monthnb=this.initObj.display_monthnb;
               this.initObj.daynb=this.initObj.display_daynb;
            }
    } 
   }

  OnSubmit() {
    this.my_SelectedDate.emit(this.initObj.datePipe_OW);
    this.DisplayCalendar=false;
   }


  onSelectCalendOne(array_month:DaysOfMonths){
    if (array_month.DoMonth===0){
        this.error_msg='please select a date';
    } else {
        this.type_error=0; 
        this.error_msg='';
        this.initObj.valid_input_OW="N";
        this.SelectedDay=array_month;
        const noCheck=true;
        this.IsDateSelected=false;
        this.initObj=selectDay(1, this.SelectedDay, this.datePipe, this.ref_format.MyDateFormat,this.locale,this.initObj, this.datePipeMax, this.datePipeToday, noCheck);
        this.DaySelection.day=this.initObj.daynb;
        this.DaySelection.month=this.initObj.monthnb;
        this.DaySelection.year=this.initObj.yearnb;
        this.type_error=this.initObj.type_error;
        this.error_msg=this.initObj.error_msg;
        this.initObj.display_daynb=this.initObj.daynb;
        this.initObj.display_monthnb=this.initObj.monthnb;
        this.initObj.display_yearnb=this.initObj.yearnb;
        if (this.error_msg===''){
          this.MinMaxTest('Min');
          if (this.error_msg===''){
            this.MinMaxTest('Max');
          }
          if (this.error_msg===''){
              this.IsDateSelected=true;
        }
        }
   }
  } // end on SelectCalendOne()

  
  ActionCalendar(){
    this.DisplayCalendar=true;
  
  }

  ngOnChanges(changes: SimpleChanges) { 
    var test_date=false;
    var theDate=false;
    if (this.FirstSelection===true){
      this.FirstSelection=false;
    } else {

      for (const propName in changes){
        const j=changes[propName];
        if (propName==='Input_IsSelectedDate'){
            test_date=true;
        }
        if (propName==='Input_SelectedDate'){
          theDate=true;
        } 
        // const to=JSON.stringify(j.currentValue);
        // const from=JSON.stringify(j.previousValue);
        // this.LogMsgConsole('$$$$$ onChanges '+' to '+to+' from '+from + ' ---- JSON.stringify(j) '+ JSON.stringify(j));
      }
      if (this.Input_IsSelectedDate===true && theDate===true){
          this.ngOnInit();
      }
      if (this.Input_IsSelectedDate===false && theDate===true){
          this.initObj=new fillcalendar;
          this.ngOnInit();
    }
  
    
     
    }

  }

}

