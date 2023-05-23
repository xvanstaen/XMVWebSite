
import { mainClassCaloriesFat, DailyReport, ClassMeal, ClassDish, ClassItem} from './ClassHealthCalories'
import {mainConvItem, mainRecordConvert, mainClassUnit, mainClassConv} from './../ClassConverter'

export function CalcFatCalories(tabCalFat:mainClassCaloriesFat, dayHealth:DailyReport, tabConvert:mainClassConv){

var returnData={
    error:0,
    outHealthData: new DailyReport
}
var theServing=0;
var i=0;
var j=0;
var k=0;
var l=0;
var theQuantity:number=0;
var kLoop=0
var iLoop=false;
var iFood=0;
var iType=0;
var error=0;
var trouve=false;

returnData.outHealthData.date=dayHealth.date;
returnData.outHealthData.burntCalories=dayHealth.burntCalories;
returnData.outHealthData.total.Calories = 0;
returnData.outHealthData.total.Sugar = 0;
returnData.outHealthData.total.Cholesterol = 0;
returnData.outHealthData.total.Fat.Saturated = 0;
returnData.outHealthData.total.Fat.Total = 0;
returnData.outHealthData.total.Protein = 0;
returnData.outHealthData.total.Carbs = 0;
returnData.error=0;


for (j=0; j< dayHealth.meal.length ; j++){
    error=0;
    const meal=new ClassMeal;
    returnData.outHealthData.meal.push(meal);
    returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Calories = 0;
    returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Sugar = 0;
    returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Cholesterol = 0;
    returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Fat.Saturated = 0;
    returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Fat.Total = 0;
    returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Protein = 0;
    returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Carbs = 0;

    returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].name=dayHealth.meal[j].name.toLowerCase().trim();

    for (k=0; k< dayHealth.meal[j].dish.length && error===0; k++){
        const dish=new ClassDish;
        returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].dish.push(dish);
        returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].dish[k].unit =dayHealth.meal[j].dish[k].unit.toLowerCase().trim();
        returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].dish[k].quantity =Number(dayHealth.meal[j].dish[k].quantity);
        returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].dish[k].name =dayHealth.meal[j].dish[k].name.toLowerCase().trim();
        trouve=false;
        iLoop=false;
        for (iType=0; iType<tabCalFat.tabCaloriesFat.length && trouve===false && iLoop===false; iType++){
            for (iFood=0; iFood<tabCalFat.tabCaloriesFat[iType].Content.length && trouve===false && iLoop===false; iFood++){
                if (dayHealth.meal[j].dish[k].name.toLowerCase().trim()=== tabCalFat.tabCaloriesFat[iType].Content[iFood].Name.toLowerCase().trim()){
                    iLoop=true;
                    if (dayHealth.meal[j].dish[k].unit.toLowerCase().trim()=== tabCalFat.tabCaloriesFat[iType].Content[iFood].ServingUnit.toLowerCase().trim()){
                        trouve=true;
                        theQuantity=dayHealth.meal[j].dish[k].quantity;
                       
                    }
                }
            }
        };
        if (iLoop===true){iFood--; iType--}; // unit in Health corresponds to unit in tabCalFat
        
        if (iLoop===true && trouve===false) { // unit in Health does not correspond to unit in tabCalFat; then conversion is needed
                    //      Find converion as follows
                    // FROM dayHealth.meal[j].dish[k].unit.toLowerCase().trim()
                    // TO tabCalFat.tabCaloriesFat[iType].Content[iFood].ServingUnit.toLowerCase().trim()
                    //
                    // Find the From Unit
                for  ( l=0; l<tabConvert.tabConv.length  && trouve===false; l++) { // tabConvert.tabConv[l].fromUnit.toLowerCase()!== dayHealth.meal[j].dish[k].unit.toLowerCase()
                    if ( tabConvert.tabConv[l].fromUnit.toLowerCase()=== dayHealth.meal[j].dish[k].unit.toLowerCase() ) {
                        for (kLoop=0; kLoop<tabConvert.tabConv[l].convert.length && tabConvert.tabConv[l].convert[kLoop].toUnit.toLowerCase() !== tabCalFat.tabCaloriesFat[iType].Content[iFood].ServingUnit.toLowerCase().trim(); kLoop++){};
                        if (kLoop<tabConvert.tabConv[l].convert.length){
                            trouve=true;
                            theQuantity=dayHealth.meal[j].dish[k].quantity*tabConvert.tabConv[l].convert[kLoop].value;
                        }
                    }
                    
                }    
                   
                if (trouve===false){
                    error=1;
                    if (dayHealth.meal[j].dish[k].unit.toLowerCase().trim()!==''){
                        returnData.error++
                    console.log('CalcFatCalories - conversion From-To not found for '+ dayHealth.meal[j].dish[k].unit.toLowerCase().trim());
                    }
                    
                }
            }
        if (iLoop===true && error===0){
            theServing=Number(tabCalFat.tabCaloriesFat[iType].Content[iFood].Serving);
            if (theServing!==0){
                const quantity=theQuantity/theServing;
                returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Calories =  returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Calories+quantity * Number(tabCalFat.tabCaloriesFat[iType].Content[iFood].Calories);
                returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Sugar =  returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Sugar+quantity * Number(tabCalFat.tabCaloriesFat[iType].Content[iFood].Sugar);
                returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Cholesterol = returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Cholesterol+quantity * Number(tabCalFat.tabCaloriesFat[iType].Content[iFood].Cholesterol);
                returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Fat.Saturated = returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Fat.Saturated + quantity * Number(tabCalFat.tabCaloriesFat[iType].Content[iFood].Fat.Saturated);
                returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Fat.Total = returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Fat.Total + quantity * Number(tabCalFat.tabCaloriesFat[iType].Content[iFood].Fat.Total);
                returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Protein = returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Protein + quantity * Number(tabCalFat.tabCaloriesFat[iType].Content[iFood].Protein);
                returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Carbs = returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Carbs + quantity * Number(tabCalFat.tabCaloriesFat[iType].Content[iFood].Carbs);
                returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].dish[k].calFat.Calories =  quantity * Number(tabCalFat.tabCaloriesFat[iType].Content[iFood].Calories);
                returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].dish[k].calFat.Sugar =  quantity * Number(tabCalFat.tabCaloriesFat[iType].Content[iFood].Sugar);
                returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].dish[k].calFat.Cholesterol = quantity * Number(tabCalFat.tabCaloriesFat[iType].Content[iFood].Cholesterol);
                returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].dish[k].calFat.Fat.Saturated =  quantity * Number(tabCalFat.tabCaloriesFat[iType].Content[iFood].Fat.Saturated);
                returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].dish[k].calFat.Fat.Total = quantity * Number(tabCalFat.tabCaloriesFat[iType].Content[iFood].Fat.Total);
                returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].dish[k].calFat.Protein = quantity * Number(tabCalFat.tabCaloriesFat[iType].Content[iFood].Protein);
                returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].dish[k].calFat.Carbs = quantity * Number(tabCalFat.tabCaloriesFat[iType].Content[iFood].Carbs);
             }
        } 
        if (iLoop===false){
            if (dayHealth.meal[j].dish[k].name.toLowerCase().trim()){
                returnData.error++
                console.log('CalcFatCalories: no information found for '+ dayHealth.meal[j].dish[k].name.toLowerCase().trim()) ;
            }
        }
              
    }
    returnData.outHealthData.total.Calories = returnData.outHealthData.total.Calories + returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Calories;
    returnData.outHealthData.total.Sugar = returnData.outHealthData.total.Sugar + returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Sugar;
    returnData.outHealthData.total.Cholesterol = returnData.outHealthData.total.Cholesterol + returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Cholesterol;
    returnData.outHealthData.total.Fat.Saturated = returnData.outHealthData.total.Fat.Saturated + returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Fat.Saturated ;
    returnData.outHealthData.total.Fat.Total = returnData.outHealthData.total.Fat.Total + returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Fat.Total;
    returnData.outHealthData.total.Carbs = returnData.outHealthData.total.Carbs + returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Carbs;
    returnData.outHealthData.total.Protein = returnData.outHealthData.total.Protein + returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].total.Protein;

}

return(returnData);
  
}