import { DatePipe } from '@angular/common'; 
import {eventoutput, thedateformat} from './apt_code_name';

export function manage_input(
    event_value:string,
    event_type:string,
    reference_format:thedateformat,
    maxDate_year:number,
    today_year:number,
    datePipe: DatePipe,
    datePipeMax: any,
    datePipeToday:any,
    datePipeMin:any,
    FormatValidationOnly:boolean

){
    var myObj:eventoutput = {
        error_msg:"",
        type_error:0,
        theInput:"",
        input_year:"",
        input_month:"",
        input_day:"",

    }
    var ref_format: thedateformat = {
      MyDateFormat:"",
      separator_char:"",
      separator_one_p:0,
      separator_two_p:0,
      day_position:0,
      year_position:0,
      month_position:0,
      length_year:0,
      length_month:0,
      length_day:0,
  }

    var k=0;
    var i=0;
    var j=0;
    
    var datePipeInput: any;
    var varDate=new Date;

    ref_format = reference_format;
    myObj.theInput = event_value;
     
    if (event_type === "deleteContentBackward"){
      // could also be tested as follows: if (event.data===null)
       k=0;
      for ( j=0; k!==-1;  j++){
           k=  myObj.theInput.search( ref_format.separator_char);
          if ( k > -1) {
            myObj.theInput=  myObj.theInput.substr(0,  k) +   myObj.theInput.substr( k+1);
          }
        }
       i=  myObj.theInput.length;
  
        // check the format of the input string
      if ( i >= ref_format.separator_one_p) {
          // search for the first separator character
          myObj.theInput=   myObj.theInput.substr(0, ref_format.separator_one_p-1) +  ref_format.separator_char +  myObj.theInput.substr( ref_format.separator_one_p-1);
                 i=  myObj.theInput.length;
             // }    
        }
      if ( i >= ref_format.separator_two_p) {
          // search for the second separator charater
          myObj.theInput=   myObj.theInput.substr(0, ref_format.separator_two_p-1) +  ref_format.separator_char +  myObj.theInput.substr( ref_format.separator_two_p-1);
        } 
    }
  
     //** TheCalendarform.controls['type_input'].setValue(  theInput);
     i=  myObj.theInput.length;
  
     myObj.error_msg = "";
     myObj.type_error=0;
  
    // test date according to the format
   
  if ( i!==0){
    if (ref_format.year_position<= i){
      if ( i <  ref_format.year_position +  ref_format.length_year-1){
        myObj.input_year =   myObj.theInput.substr( ref_format.year_position-1, i- ref_format.year_position+1);
      }
      else{
        myObj.input_year =   myObj.theInput.substr( ref_format.year_position-1, ref_format.length_year);
      }
    }
  
    if ( ref_format.month_position<= i){
      if ( i <  ref_format.month_position +  ref_format.length_month-1){
        myObj.input_month =   myObj.theInput.substr( ref_format.month_position-1, i- ref_format.month_position+1);
      }
      else{
        myObj.input_month =   myObj.theInput.substr( ref_format.month_position-1, ref_format.length_month);
      }
    }
  
    if ( ref_format.day_position<= i){
      if ( i <  ref_format.day_position +  ref_format.length_day-1 ){
        myObj.input_day =   myObj.theInput.substr( ref_format.day_position-1, i- ref_format.day_position+1);
      }
      else{
        myObj.input_day =   myObj.theInput.substr( ref_format.day_position-1, ref_format.length_day);
      }
    }
  
  
      if ( myObj.input_year !==""){
        if (isNaN(Number(myObj.input_year))==false){
            // OK - input is a numeric value
              // if year is on 4 digits check that entered year is equal to current year or to the year of maxDate 

              // 23FEB2023 - this test seems to be useless because the validity of the date compare to maxDate 
              //              is tested below - this section is transferred under comments
              /* */
             // if ( myObj.input_year.length=== ref_format.length_year && parseInt( myObj.input_year) !==  today_year && 
              //      parseInt( myObj.input_year) !==  maxDate_year){
              //         myObj.type_error=4;
              //      if ( today_year !== maxDate_year){
              //           myObj.error_msg = "year is invalid; must be either " +  today_year.toString()
              //              + " or " +  maxDate_year.toString();
              //      }
              //     else {
              //           myObj.error_msg = "year is invalid; must be " + today_year.toString();
              //      }
              //}
              //else{
                // year is correct
              //}
              
            // else year is not complete so return to HTML for user to complete his input
        }
        else{
            // input is non numeric then return an error message
             myObj.type_error=1;
        }
      }
  
  
      if (myObj.input_month !==""){
        if (isNaN(Number( myObj.input_month))==false){
          if ( myObj.input_month.length === 2){
            if (Number( myObj.input_month) <1 || Number( myObj.input_month) >12){
                 myObj.type_error=5;
                 myObj.error_msg = "invalid month"
            }
          }
        }
        else{
          // input is non numeric then return an error message
           myObj.type_error=1;
        }
      }
  
      if ( myObj.input_day !==""){
        if (isNaN(Number( myObj.input_day))==false){
          if ( myObj.input_day.length === 2){
              if (Number( myObj.input_day) <1 || Number( myObj.input_day) >31){
                 myObj.type_error=6;
                 myObj.error_msg = "invalid day"
              }
          } 
        }
        else{
          // input is non numeric then return an error message
           myObj.type_error=1;
        }
      }
   
    if ( myObj.type_error===1){
       myObj.error_msg = "enter a numeric value; date format is " +  ref_format.MyDateFormat;
      }
    if ( myObj.type_error===0){
  
      if( i=== ref_format.MyDateFormat.length){
        
         varDate.setDate(parseInt( myObj.input_day));
         varDate.setMonth(parseInt( myObj.input_month)-1);
         varDate.setFullYear(parseInt( myObj.input_year));
        
         datePipeInput =  datePipe.transform( varDate,"yyyy-MM-dd");

         /*
          Format is correct so now validate the value of the date
         */
          if (FormatValidationOnly===false){
            if ( datePipeInput< datePipeMin){ // check input date with Min date
                    // date is out of range
                    myObj.error_msg = "invalid date; cannot be before" + datePipeMin;
                    myObj.type_error=7;
            } else 
              {
                  if ( datePipeInput> datePipeMax){ // check input date with Max date
                // date is out of range
                    myObj.error_msg = "invalid date; cannot be over " + datePipeMax;
                    myObj.type_error=8;
                }
            }
          }
      }
      else if ( i=== ref_format.separator_one_p-1){
          // we generate the separator depending on the length of the input
          myObj.theInput =   myObj.theInput +  ref_format.separator_char;
      }
      else if ( i=== ref_format.separator_two_p-1){
        // we generate the separator depending on the length of the input
        myObj.theInput =   myObj.theInput +  ref_format.separator_char;
      }
    }
    }
      return (myObj);
  }

 