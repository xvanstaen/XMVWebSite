
import {days_month_array} from './subsetarray';
import {DaysOfMonths, fillcalendar} from './apt_code_name';
import {MonthOfYear} from './ArrayCityRegion';
import { DatePipe, formatDate} from '@angular/common';
import { LOCALE_ID } from '@angular/core';
// import{objtoreturn} from './Calendar_Var_Declare';

//import * as objtoreturn from './Calendar_Var_Declare';

export function generate_calendar(ref_OW:string, ref_RET:string, initobj:fillcalendar){

var StringOfMonths=MonthOfYear;
var work_date=new Date();
var objtoreturn=initobj;
if (ref_OW==='NO'){
// do nothing
}
else if (ref_OW==='Force_Next' && ref_RET===''){
    if ( objtoreturn.display_monthnb===12){
        objtoreturn.display_yearnb= objtoreturn.display_yearnb+1;
        objtoreturn.display_monthnb=1;
    }
    else { 
        objtoreturn.display_monthnb= objtoreturn.display_monthnb+1;
        objtoreturn.display_yearnb= objtoreturn.display_yearnb;
    }
}
else   
if (ref_OW==='Force_Previous' && ref_RET===''){
    if ( objtoreturn.monthnb===1){
        objtoreturn.display_yearnb= objtoreturn.yearnb-1;
        objtoreturn.display_monthnb=12;
    }
    else { 
        objtoreturn.display_monthnb= objtoreturn.monthnb-1;
        objtoreturn.display_yearnb= objtoreturn.yearnb;
    }
}
else   
 
if (ref_OW==='' && ref_RET===''){
    objtoreturn.display_monthnb=objtoreturn.today_month;
    objtoreturn.display_yearnb=objtoreturn.today_year;
    objtoreturn.display_daynb=objtoreturn.today_day;
    if ( objtoreturn.display_monthnb===12){
        objtoreturn.display_nyearnb= objtoreturn.display_yearnb+1;
        objtoreturn.display_nmonthnb=1;
    }
    else { 
        objtoreturn.display_nmonthnb= objtoreturn.display_monthnb+1;
        objtoreturn.display_nyearnb= objtoreturn.display_yearnb;
    }
    
} else if (ref_RET==="RET"  && ref_OW==='') {
         if(objtoreturn.nmonthnb===objtoreturn.today_month &&
            objtoreturn.nyearnb===objtoreturn.today_year){
                objtoreturn.display_monthnb= objtoreturn.today_month;
                objtoreturn.display_yearnb= objtoreturn.today_year;
                objtoreturn.display_daynb=objtoreturn.today_day;
                if ( objtoreturn.display_monthnb===12){
                    objtoreturn.display_nyearnb= objtoreturn.display_yearnb+1;
                    objtoreturn.display_nmonthnb=1;
                }
                else { 
                    objtoreturn.display_nmonthnb= objtoreturn.display_monthnb+1;
                    objtoreturn.display_nyearnb= objtoreturn.display_yearnb;
                }
            
        } else{
                objtoreturn.display_nmonthnb= objtoreturn.nmonthnb;
                objtoreturn.display_nyearnb= objtoreturn.nyearnb;
                if ( objtoreturn.nmonthnb===1){
                    objtoreturn.display_yearnb= objtoreturn.nyearnb-1;
                    objtoreturn.display_monthnb=12;
                }
                else { 
                    objtoreturn.display_monthnb= objtoreturn.nmonthnb-1;
                    objtoreturn.display_yearnb= objtoreturn.nyearnb;
                }
            }   

    } else if (ref_RET==='' && ref_OW==='OW'){
        if(objtoreturn.monthnb===objtoreturn.maxDate_month &&
            objtoreturn.yearnb===objtoreturn.maxDate_year){
                objtoreturn.display_nmonthnb= objtoreturn.monthnb;
                objtoreturn.display_nyearnb= objtoreturn.yearnb;
                if ( objtoreturn.display_nmonthnb===1){
                    objtoreturn.display_yearnb= objtoreturn.display_nyearnb-1;
                    objtoreturn.display_monthnb=12;
                }
                else { 
                    objtoreturn.display_monthnb= objtoreturn.display_nmonthnb-1;
                    objtoreturn.display_yearnb= objtoreturn.display_yearnb;
                }
        } else{
                objtoreturn.display_monthnb= objtoreturn.monthnb;
                objtoreturn.display_yearnb= objtoreturn.yearnb;
                if ( objtoreturn.monthnb===12){
                    objtoreturn.display_nyearnb= objtoreturn.yearnb+1;
                    objtoreturn.display_nmonthnb=1;
                }
                else { 
                    objtoreturn.display_nmonthnb= objtoreturn.monthnb+1;
                    objtoreturn.display_nyearnb= objtoreturn.yearnb;
                }
            }
        
        
    } else  if (ref_RET==='RET' && ref_OW==='OW'){
    // this can occur on ngInit() only  
            objtoreturn.display_monthnb= objtoreturn.monthnb;
            objtoreturn.display_yearnb= objtoreturn.yearnb;
            objtoreturn.display_nmonthnb= objtoreturn.nmonthnb;
            objtoreturn.display_nyearnb= objtoreturn.nyearnb;
            if(objtoreturn.display_nmonthnb===objtoreturn.today_month &&
                objtoreturn.display_nyearnb===objtoreturn.today_year){
                    objtoreturn.display_monthnb= objtoreturn.display_nmonthnb;
                    objtoreturn.display_yearnb= objtoreturn.display_nyearnb;
                    objtoreturn.display_daynb=objtoreturn.today_day;
                    if ( objtoreturn.display_monthnb===12){
                        objtoreturn.display_nyearnb= objtoreturn.display_yearnb+1;
                        objtoreturn.display_nmonthnb=1;
                    }
                    else { 
                        objtoreturn.display_nmonthnb= objtoreturn.display_monthnb+1;
                        objtoreturn.display_nyearnb= objtoreturn.display_yearnb;
                    }
            }
    
    } else if(ref_OW==='P_OW' ){
            if(objtoreturn.display_monthnb===objtoreturn.today_month &&
            objtoreturn.display_yearnb===objtoreturn.today_year){
                objtoreturn.display_daynb=objtoreturn.today_day;
                }
            else{
                objtoreturn.display_nyearnb= objtoreturn.display_yearnb;
                objtoreturn.display_nmonthnb= objtoreturn.display_monthnb;
                if ( objtoreturn.display_monthnb===1){
                    objtoreturn.display_yearnb= objtoreturn.display_yearnb-1;
                    objtoreturn.display_monthnb=12;
                    
                }
                else { 
                    objtoreturn.display_monthnb= objtoreturn.display_monthnb-1;
                }
            }

        }  else if(ref_RET==='N_RET' ){
                if(objtoreturn.display_nmonthnb===objtoreturn.maxDate_month &&
                        objtoreturn.display_nyearnb===objtoreturn.maxDate_year){
                                objtoreturn.display_ndaynb===objtoreturn.maxDate_day;
            
                } else{
                    objtoreturn.display_yearnb= objtoreturn.display_nyearnb;
                    objtoreturn.display_monthnb= objtoreturn.display_nmonthnb;
                    if ( objtoreturn.display_nmonthnb===12){
                        objtoreturn.display_nyearnb= objtoreturn.display_nyearnb+1;
                        objtoreturn.display_nmonthnb=1;
                    }
                    else { 
                        objtoreturn.display_nmonthnb= objtoreturn.display_nmonthnb+1;
                    }
                }
            }


        work_date.setDate(1);
        work_date.setMonth(objtoreturn.display_monthnb-1);
        work_date.setFullYear(objtoreturn.display_yearnb);
        objtoreturn.weekday_c=work_date.getDay();
 
        objtoreturn.dayspermonth1= days_month_array(objtoreturn.display_monthnb, objtoreturn.display_yearnb,objtoreturn.weekday_c);
        objtoreturn.monthname_c =  StringOfMonths[ objtoreturn.display_monthnb-1].TheMonth;

        if (objtoreturn.display_nmonthnb!==0 && objtoreturn.display_nyearnb!==0 ){
                work_date.setDate(1);
                work_date.setMonth( objtoreturn.display_nmonthnb-1);
                work_date.setFullYear( objtoreturn.display_nyearnb);
                objtoreturn.weekday_n= work_date.getDay();
        
                objtoreturn.dayspermonth2= days_month_array( objtoreturn.display_nmonthnb,  objtoreturn.display_nyearnb, objtoreturn.weekday_n);
                objtoreturn.monthname_n=  StringOfMonths[ objtoreturn.display_nmonthnb-1].TheMonth;
        }
    
   return(objtoreturn);

}

export function selectDay(CalendarMonthRef:number, selectedDay:DaysOfMonths, datePipe: DatePipe, 
    MyDateFormat:string,locale:any,initobj:fillcalendar,datePipeMax:any, datePipeToday:any, noCheck:boolean){
var StringOfMonths=MonthOfYear;
var work_var='';
var objtoreturn=initobj;
objtoreturn.type_error=0;
objtoreturn.error_msg='';
if (objtoreturn.valid_input_OW==="N" || (objtoreturn.valid_input_OW==="Y" && objtoreturn.valid_input_RET==="Y")){
    objtoreturn.daynb = selectedDay.DoMonth;
    if (CalendarMonthRef===1){
        objtoreturn.monthnb=objtoreturn.dayspermonth1[1].DoMonth;
        objtoreturn.yearnb=objtoreturn.dayspermonth1[0].DoMonth;
    } else{
        objtoreturn.monthnb=objtoreturn.dayspermonth2[1].DoMonth;
        objtoreturn.yearnb=objtoreturn.dayspermonth2[0].DoMonth;
    }

    objtoreturn.datePipe_OW.setDate(objtoreturn.daynb);
    objtoreturn.datePipe_OW.setMonth(objtoreturn.monthnb-1);
    objtoreturn.datePipe_OW.setFullYear(objtoreturn.yearnb);
    objtoreturn.input_OW = formatDate(objtoreturn.datePipe_OW,MyDateFormat,locale).toString();
    work_var=formatDate(objtoreturn.datePipe_OW,'yyyy-MM-dd',locale).toString();
    if (noCheck===false){
        if(work_var>datePipeMax){
            objtoreturn.type_error=13;
            objtoreturn.error_msg="departure date " +work_var+ " is beyond bookable date " + datePipeMax;
            objtoreturn.input_OW="";
        } else if(work_var<datePipeToday){ // cannot be selected
                objtoreturn.type_error=12;
                objtoreturn.error_msg="departure date " +objtoreturn.input_OW+ " cannot be before today " + datePipeToday; 
                objtoreturn.input_OW="";
        } else if(objtoreturn.datePipe_RET<objtoreturn.datePipe_OW){
            objtoreturn.type_error=11;
            objtoreturn.error_msg="departure date " +objtoreturn.input_OW+ " must be before return date " + objtoreturn.input_RET;
            objtoreturn.input_OW="";
        } else{
                objtoreturn.valid_input_OW="Y";
                if (objtoreturn.valid_input_RET==="Y"){
                    objtoreturn.valid_input_RET="N";
                    objtoreturn.input_RET = '';
                } 
            }
    } else {
        objtoreturn.valid_input_OW="Y";
        if (objtoreturn.valid_input_RET==="Y"){
            objtoreturn.valid_input_RET="N";
            objtoreturn.input_RET = '';
        } 
    }
    
  }
 else if (objtoreturn.valid_input_RET==="N"){
    if (CalendarMonthRef===1){
        objtoreturn.nmonthnb=objtoreturn.dayspermonth1[1].DoMonth;
        objtoreturn.nyearnb=objtoreturn.dayspermonth1[0].DoMonth;
    } else{
        objtoreturn.nmonthnb=objtoreturn.dayspermonth2[1].DoMonth;
        objtoreturn.nyearnb=objtoreturn.dayspermonth2[0].DoMonth;
    }
      objtoreturn.ndaynb = selectedDay.DoMonth;
      objtoreturn.datePipe_RET.setDate(objtoreturn.ndaynb);
      objtoreturn.datePipe_RET.setMonth(objtoreturn.nmonthnb-1);
      objtoreturn.datePipe_RET.setFullYear(objtoreturn.nyearnb);
      objtoreturn.input_RET =  formatDate(objtoreturn.datePipe_RET,MyDateFormat,locale).toString();
      work_var=formatDate(objtoreturn.datePipe_RET,'yyyy-MM-dd',locale).toString();
  
      if(work_var>datePipeMax){
                objtoreturn.type_error=23;
                objtoreturn.error_msg="return date " +objtoreturn.input_RET+ " is beyond bookable date " + datePipeMax;
                objtoreturn.input_RET="";
      } else if(work_var<datePipeToday){ // cannot be selected
            objtoreturn.type_error=22;
            objtoreturn.error_msg="return date " +objtoreturn.input_RET+ " cannot be before today " + datePipeToday;  
            objtoreturn.input_RET="";  
            } else if(objtoreturn.datePipe_RET<objtoreturn.datePipe_OW){
                objtoreturn.type_error=21;
                objtoreturn.error_msg="return date " +objtoreturn.input_RET+ " must be after departure date " + objtoreturn.input_OW;
                objtoreturn.input_RET="";
              } else  {
                objtoreturn.valid_input_RET="Y";
            }
 }
 
return(objtoreturn);
}