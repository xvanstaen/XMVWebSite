import {DatePipe, formatDate } from '@angular/common'; 
import {eventoutput, thedateformat} from './apt_code_name';
import {manage_input} from './manageinput';




export function ValiDate(minDate:Date, maxDate:Date, InputDate:string, event_type:string, ref_format:thedateformat, FormatValidationOnly:boolean,
    datePipe: DatePipe,locale:string){
   
var datePipeMax: any;
var datePipeMin: any;
var myObj= new eventoutput;
var maxDate_Year: number;
var today_Year: number;
var datePipeToday: any;

// input will be tested against the date format
ref_format.day_position = ref_format.MyDateFormat.indexOf("d")+1;
if (ref_format.day_position===0) {ref_format.day_position = ref_format.MyDateFormat.indexOf("D")+1};
ref_format.month_position = ref_format.MyDateFormat.indexOf("m")+1;
if (ref_format.month_position===0) {ref_format.month_position = ref_format.MyDateFormat.indexOf("M")+1};
ref_format.year_position = ref_format.MyDateFormat.indexOf("y")+1;
if (ref_format.year_position===0) {ref_format.year_position = ref_format.MyDateFormat.indexOf("Y")+1};

ref_format.separator_one_p=ref_format.MyDateFormat.indexOf(ref_format.separator_char)+1;
ref_format.separator_two_p= ref_format.separator_one_p+ref_format.MyDateFormat.substr(ref_format.separator_one_p,ref_format.MyDateFormat.length-ref_format.separator_one_p).indexOf(ref_format.separator_char)+1;

datePipeMax = formatDate(maxDate,"yyyy-MM-dd",locale);
datePipeMin = formatDate(minDate,"yyyy-MM-dd",locale);
maxDate_Year=parseInt(formatDate(maxDate,'yyyy',locale));
today_Year=parseInt(formatDate(Date(),'yyyy',locale));


myObj=manage_input(
    InputDate,
    event_type,
    ref_format,
    maxDate_Year,
    today_Year,
    datePipe,
    datePipeMax,
    datePipeToday,
    datePipeMin,
    FormatValidationOnly);

return (myObj);
}

