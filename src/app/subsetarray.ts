
import {ArrayCity, DaysByMonth} from './ArrayCityRegion'
import {citycodename} from './apt_code_name'
import {DaysOfMonths} from './apt_code_name'


export function subsetarray(sortedarray: Array<citycodename>, selstring: string) {
        var subsetarray: Array<citycodename> =[];
        var i: number=0;
        var j: number=-1;
        var k: number=-1;
        var l_string: number=selstring.length;
        var stringtotest: string=selstring.toUpperCase();
        var length_arrray: number=0;
        length_arrray = sortedarray.length-1;
        
        for ( i=0; i<length_arrray; i++) {
        
            if ((ArrayCity[i].citycode.substring(0,l_string).toUpperCase() === stringtotest) ||
                    (ArrayCity[i].cityname.substring(0,l_string).toUpperCase() === stringtotest))
                {
                j=j+1;
                subsetarray[j] = ArrayCity[i];
                }
           
        }



    return(subsetarray)
   
}

export function days_month_array(monthnb: number, yearnb:number, weekday:number) {
    var i: number=31;
    var objet: DaysOfMonths=({DoMonth:1});
    var thearray: Array<DaysOfMonths> =[];
    var k: number=0;
    var j: number=0;
    if (monthnb===2) {
      if (yearnb%4===0) {i=29}
      else {i=28}
    }
    else if (monthnb===4 || monthnb===6 || monthnb===9 || monthnb===11 ) {
        i=30
    }
    
    objet={DoMonth:yearnb};
    thearray[0] = objet;
    objet={DoMonth:monthnb};
    thearray[1] = objet;
    j=2;
    for (k=0; k<weekday; k++){
        objet={DoMonth:0};
        thearray[j] = objet;
        j++;
    }
    for (k=0; k<i; k++){
        objet={DoMonth:k+1};
        thearray[j] = objet;
        j++;
    }
    
    
    return(thearray)
 }