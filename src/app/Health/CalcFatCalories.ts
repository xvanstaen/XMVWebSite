
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

var iFood=0;
var iType=0;
var error=0;
var trouve=false;
var noGram=false;
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

// get recordNb of 'gram ' in ConvertUnit
for (i=0; i<tabConvert.tabConv.length &&  tabConvert.tabConv[i].fromUnit !== 'gram'; i++){}
if (i===tabConvert.tabConv.length) {
    // error; don't process as the conversion table does not exist
    error=-1;
    returnData.error=-1;
}

for (j=0; j< dayHealth.meal.length && error===0; j++){
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
        if (dayHealth.meal[j].dish[k].unit.toLowerCase().trim() !== 'gram') {
                    // convert the unit in grams
                    for  (l=0; l<tabConvert.tabConv[i].convert.length  && tabConvert.tabConv[i].convert[l].toUnit.toLowerCase()!== dayHealth.meal[j].dish[k].unit.toLowerCase(); l++) {
                        }
                    if (l<tabConvert.tabConv[i].convert.length){
                        dayHealth.meal[j].dish[k].unit='gram';
                        dayHealth.meal[j].dish[k].quantity=1/Number(tabConvert.tabConv[i].convert[l].value) * Number(dayHealth.meal[j].dish[k].quantity);
                        returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].dish[k].unit ='gram';;
                        returnData.outHealthData.meal[ returnData.outHealthData.meal.length-1].dish[k].quantity =dayHealth.meal[j].dish[k].quantity;
                        noGram=false;
                    } else {// problem with the conversion file; error to return

                        // not an error if can find the same unit
                        noGram=true;
                        //error=1;
                        //returnData.error++
                        //console.log('CalcFatCalories fn:   i='+i+' j='+j+' k='+k+ '   dayHealth.meal[j].dish[k].unit.toLowerCase().trim()='+dayHealth.meal[j].dish[k].unit.toLowerCase().trim());
                        
                        }

        }
        if (error===0){
            // unit is gram so calculate
            // retrieve now the nutrition facts for each food
            trouve=false;
// reduce the loop        
            for (iType=0; iType<tabCalFat.tabCaloriesFat.length && trouve===false; iType++){
               
                for (iFood=0; iFood<tabCalFat.tabCaloriesFat[iType].Content.length && trouve===false ; iFood++){
                    if (tabCalFat.tabCaloriesFat[iType].Content[iFood].Name.toLowerCase().trim()=== dayHealth.meal[j].dish[k].name.toLowerCase().trim()){trouve=true};
                }
                if (trouve===true){
                        iFood--
                        // serach the units and perform the conversion
                        //if (noGram===true && tabCalFat.tabCaloriesFat[iType].Content[iFood].ServingUnit.toLowerCase().trim() !== tabConvert.tabConv[i].convert[l].toUnit.toLowerCase().trim()){
                        //    trouve=false;
                        //}
                        if (tabCalFat.tabCaloriesFat[iType].Content[iFood].ServingUnit.toLowerCase().trim()!=='gram') {
                            for  (l=0; l<tabConvert.tabConv[i].convert.length  && tabConvert.tabConv[i].convert[l].toUnit.toLowerCase().trim()!== tabCalFat.tabCaloriesFat[iType].Content[iFood].ServingUnit.toLowerCase().trim(); l++) {
                            }
                            if (l<tabConvert.tabConv[i].convert.length){
                                    theServing=1/Number(tabConvert.tabConv[i].convert[l].value) * Number(dayHealth.meal[j].dish[k].quantity);
                            }
                        } else {
                                    theServing=Number(tabCalFat.tabCaloriesFat[iType].Content[iFood].Serving);
                        }
                        if (theServing!==0){
                            const quantity=Number(dayHealth.meal[j].dish[k].quantity)/theServing;
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
                } 
                if ( iType===tabCalFat.tabCaloriesFat.length){
                    console.log('CalcFatCalories:   i='+i+' j='+j+' k='+k+ '  dayHealth.meal[j].dish[k].name.toLowerCase().trim()' +dayHealth.meal[j].dish[k].name.toLowerCase().trim()) ;

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