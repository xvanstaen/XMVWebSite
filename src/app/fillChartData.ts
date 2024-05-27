import { buildBarChartDataSet,buildLineChartDataSet, specialDraw } from './manageChartFn';
/*
export function healthToDatasetDaily(label:string, datasets:any, healthData:any, addWeekly:number, identification:any, refSaturated:any, iDataset:number){
    if (label === "Proteins") {
        datasets = addWeekly + healthData.total.Protein;
    } else if (label === "Carbs") {
        datasets = addWeekly + healthData.total.Carbs + healthData.total.Sugar;
    } else if (label === "Total Fat") {
        datasets = addWeekly + healthData.total.Fat.Total;
    } else if (label === "Cholesterol") {
        datasets = addWeekly + healthData.total.Cholesterol;
    } else if (label === "Saturated Fat") {
        datasets = addWeekly + healthData.total.Fat.Saturated;
        if (refSaturated[iDataset] === undefined) { refSaturated[iDataset] = 0; }
            refSaturated[iDataset] = refSaturated[iDataset] + (Number(healthData.burntCalories.burntCalories) + identification.health.Calories) * identification.health.SaturatedFat / 9;
    } else if (label === "Calories burnt") {
        datasets = addWeekly + Number(healthData.burntCalories) + identification.health.Calories;
    } else if (label === "Calories intake") {
        datasets = addWeekly + healthData.total.Calories;
    }
    return {datasets:datasets,refSaturated:refSaturated};
}
export function healthToDatasetWeekly(label:string, datasets:any,  healthData:any, addWeekly:number, identification:any, refSaturated:any, iDataset:number){
    if (label === "Proteins") {
        datasets == addWeekly + healthData.total.Protein;
    } else if (label === "Carbs") {
        datasets == addWeekly + healthData.total.Carbs + healthData.total.Sugar;
    } else if (label === "Total Fat") {
        datasets == addWeekly + healthData.total.Fat.Total;
    } else if (label === "Cholesterol") {
        datasets == addWeekly + healthData.total.Cholesterol;
    } else if (label === "Saturated Fat") {
        datasets == addWeekly + healthData.total.Fat.Saturated;
        if (refSaturated[iDataset] === undefined) { refSaturated[iDataset] = 0; }
                refSaturated[iDataset] = refSaturated[iDataset] + (Number(healthData.burntCalories) + identification.health.Calories) * identification.health.SaturatedFat / 9;
    } else if (label === "Calories burnt") {
        datasets == addWeekly + Number(healthData.burntCalories) + identification.health.Calories;
    } else if (label === "Calories intake") {
        datasets == addWeekly + healthData.total.Calories;
    }
  return {datasets:datasets,refSaturated:refSaturated};
}
*/

export function fillHealthDataSet(dateLabelSpecial:any, datasetsSpecialBar:any, healthData:any,tabParamChart:any, configChart:any, addWeekly:number, identification:any){
    var constLab: Array<string> = [];
    var colorLab = [];
    var iLabel = 0;
    var i=0;
    var j=0;
    var cal= 0;
    var refDailySaturated: Array<number> = [];
    var refDailySugar: Array<number> = [];
    var refDailyCarbs: Array<number> = [];

    var iDataset = -1;
    var nbLabel = 0;
    var strStart = '';
    var strEnd = '';
    var addWeekly: number = 0;
    var nbWeeks = 0;
    var cal = 0;
    var nbOfWeeks = 0;
    var myDaily = -1;
    var myWeekly = -1;
    var theHealthDate ="";

    var strMonth = "";
    

    //refDailySaturated.splice(0, refDailySaturated.length);
    //refDailySugar.splice(0, refDailySugar.length);
    //refDailyCarbs.splice(0, refDailyCarbs.length);
    datasetsSpecialBar.splice(0, datasetsSpecialBar.length);
    dateLabelSpecial.splice(0, dateLabelSpecial.length);

    for (var i = 0; i < tabParamChart.labels.length; i++) {
      if (tabParamChart.labels[i] === 'Y') {
        constLab[iLabel] = configChart.barDefault.datasets.labels[i];
        colorLab[iLabel] = tabParamChart.labelsColor[i];
        iLabel++;
      }
    };

    if (iLabel !== 0) { nbLabel = iLabel; }
    else { nbLabel = configChart.barDefault.datasets.labels.length; }

    for (i = 0; i < nbLabel; i++) {
      var order = i + 1;
      if (tabParamChart.chartType === 'bar') {
          datasetsSpecialBar = buildBarChartDataSet(datasetsSpecialBar, nbLabel, iLabel, tabParamChart, configChart, constLab, colorLab);
      } else if (tabParamChart.chartType === 'line') {
          datasetsSpecialBar=buildLineChartDataSet(datasetsSpecialBar, nbLabel, iLabel, tabParamChart, configChart, constLab, colorLab);
          
      }
      datasetsSpecialBar[i].order = i;
    }

    var myDaily = -1;
    var myWeekly = -1;
    if (tabParamChart.period === '' || tabParamChart.period === 'daily') {
      strStart = tabParamChart.startRange;
      strEnd = tabParamChart.endRange;
      myDaily = 0;
    }

    var nbOfWeeks = 0;
    if (tabParamChart.period === 'weekly') {
      myWeekly = 0;
      if (tabParamChart.nbWeeks === 0){
        nbOfWeeks = 7;
      } else {
        nbOfWeeks = tabParamChart.nbWeeks * 7;
      }
    }

    for (i = healthData.tabDailyReport.length - 1; i >= 0; i--) {
        // for (i=0; i<healthData.length; i++){
        // theHealthDate = formatDate(healthData.tabDailyReport[i].date, 'yyyy-MM-dd', locale).toString();
    
        if (healthData.tabDailyReport[i].date.length==10){
            theHealthDate = healthData.tabDailyReport[i].date;
        } else {
            
            const theMonth = healthData.tabDailyReport[i].date.getMonth() + 1;
            if (theMonth<10){
                strMonth = '0'+theMonth.toString();
            } else {
                strMonth = theMonth;
            }

            const theDay = healthData.tabDailyReport[i].date.getDay();
            if (theDay()<10){
                strMonth = '0'+theDay;
            } else {
                strMonth = theDay;
            }
            theHealthDate = healthData.tabDailyReport[i].date.getYear() + theMonth + theDay;
        } 

        if ((strStart === '' && strEnd === '') || (strStart !== '' && strEnd === '' && theHealthDate >= tabParamChart.startRange)
          || (strStart === '' && strEnd !== '' && theHealthDate <= tabParamChart.endRange)
          || (strStart !== '' && strEnd !== '' && theHealthDate >= tabParamChart.startRange && theHealthDate <= tabParamChart.endRange)
        ) {
    
          if (myDaily === 0) {
            iDataset++;
            dateLabelSpecial[iDataset] = healthData.tabDailyReport[i].date;
          } else if (myWeekly === 0 || myWeekly === nbOfWeeks) {
            myWeekly = 0;
            iDataset++;
            nbWeeks++;
            dateLabelSpecial[iDataset] = '#' + nbWeeks;
            addWeekly = 0;
            cal = 0;
          } 
          myWeekly++
          if (iLabel !== 0) {
            // tackle the information from selection of params
            for (var j = 0; j < constLab.length; j++) {
              if (myDaily === 0) {
                addWeekly = 0
              }
    
              else if (myWeekly > 0) {
                if (datasetsSpecialBar[j].data[iDataset] !== undefined) {
                    addWeekly = datasetsSpecialBar[j].data[iDataset]
                }
              }
              
              if (constLab[j] === "Proteins") {
                datasetsSpecialBar[j].data[iDataset] = addWeekly + healthData.tabDailyReport[i].total.Protein;
              } else if (constLab[j] === "Carbs") {
                datasetsSpecialBar[j].data[iDataset] = addWeekly + healthData.tabDailyReport[i].total.Carbs;
                if (refDailyCarbs[iDataset] === undefined) { refDailyCarbs[iDataset] = 0; }
                  refDailyCarbs[iDataset] = refDailyCarbs[iDataset] + (Number(healthData.tabDailyReport[i].burntCalories) + identification.health.Calories) * 0.125;
              } else if (constLab[j] === "Sugar") {
                datasetsSpecialBar[j].data[iDataset] = addWeekly + healthData.tabDailyReport[i].total.Sugar;
                if (refDailySugar[iDataset] === undefined) { refDailySugar[iDataset] = 0; }
                  refDailySugar[iDataset] = refDailySugar[iDataset] + (Number(healthData.tabDailyReport[i].burntCalories) + identification.health.Calories) * 0.025;
              } else if (constLab[j] === "Total Fat") {
                datasetsSpecialBar[j].data[iDataset] = addWeekly + healthData.tabDailyReport[i].total.Fat.Total;
              } else if (constLab[j] === "Cholesterol") {
                datasetsSpecialBar[j].data[iDataset] = addWeekly + healthData.tabDailyReport[i].total.Cholesterol;
              } else if (constLab[j] === "Saturated Fat") {
                datasetsSpecialBar[j].data[iDataset] = addWeekly + healthData.tabDailyReport[i].total.Fat.Saturated;
                if (refDailySaturated[iDataset] === undefined) { refDailySaturated[iDataset] = 0; }
                  refDailySaturated[iDataset] = refDailySaturated[iDataset] + (Number(healthData.tabDailyReport[i].burntCalories) + identification.health.Calories) * identification.health.SaturatedFat / 9;
              } else if (constLab[j] === "Calories burnt") {
                datasetsSpecialBar[j].data[iDataset] = addWeekly + Number(healthData.tabDailyReport[i].burntCalories) + identification.health.Calories;
    
              } else if (constLab[j] === "Calories intake") {
                datasetsSpecialBar[j].data[iDataset] = addWeekly + healthData.tabDailyReport[i].total.Calories;
              }
              
              //const returnData = healthToDatasetDaily (constLab[j], datasetsSpecialBar[j].data[iDataset], healthData.tabDailyReport[i], addWeekly, identification, refDailySaturated, iDataset);
              //datasetsSpecialBar[j].data[iDataset] = returnData.datasets;
              //refDailySaturated[iDataset] = returnData.refSaturated;
            }
          }
          else {
            for (var j = 0; j < configChart.length; j++) {
              if (myDaily === 0) { addWeekly = 0 }
              else if (myWeekly !== -1) { addWeekly = datasetsSpecialBar[j].data[iDataset] }
              //const returnData = healthToDatasetWeekly(configChart[j], datasetsSpecialBar[j].data[iDataset], healthData.tabDailyReport[i], addWeekly, identification, refDailySaturated, iDataset);
              //datasetsSpecialBar[j].data[iDataset] = returnData.datasets;
              //refDailySaturated[iDataset] = returnData.refSaturated;
    
              if (configChart[j] === "Proteins") {
                datasetsSpecialBar[j].data[iDataset] = addWeekly + healthData.tabDailyReport[i].total.Protein;
              } else if (configChart[j] === "Carbs") {
                datasetsSpecialBar[j].data[iDataset] = addWeekly + healthData.tabDailyReport[i].total.Carbs;
                if (refDailyCarbs[iDataset] === undefined) { refDailyCarbs[iDataset] = 0; }
                  refDailyCarbs[iDataset] = refDailyCarbs[iDataset] + (Number(healthData.tabDailyReport[i].burntCalories) + identification.health.Calories) * 0.125;
              } else if (configChart[j] === "Sugar") {
                datasetsSpecialBar[j].data[iDataset] = addWeekly + healthData.tabDailyReport[i].total.Sugar;
                if (refDailySugar[iDataset] === undefined) { refDailySugar[iDataset] = 0; }
                  refDailySugar[iDataset] =  refDailySugar[iDataset] + (Number(healthData.tabDailyReport[i].burntCalories) + identification.health.Calories) * 0.025;
              } else if (configChart[j] === "Total Fat") {
                datasetsSpecialBar[j].data[iDataset] = addWeekly + healthData.tabDailyReport[i].total.Fat.Total;
              } else if (configChart[j] === "Cholesterol") {
                datasetsSpecialBar[j].data[iDataset] = addWeekly + healthData.tabDailyReport[i].total.Cholesterol;
              } else if (configChart[j] === "Saturated Fat") {
                datasetsSpecialBar[j].data[iDataset] = addWeekly + healthData.tabDailyReport[i].total.Fat.Saturated;
                if (refDailySaturated[iDataset] === undefined) { refDailySaturated[iDataset] = 0; }
                  refDailySaturated[iDataset] = refDailySaturated[iDataset] + (Number(healthData.tabDailyReport[i].burntCalories) + identification.health.Calories) * identification.health.SaturatedFat / 9;
              } else if (configChart[j] === "Calories burnt") {
                datasetsSpecialBar[j].data[iDataset] = addWeekly + Number(healthData.tabDailyReport[i].burntCalories) + identification.health.Calories;
              } else if (configChart[j] === "Calories intake") {
                datasetsSpecialBar[j].data[iDataset] = addWeekly + healthData.tabDailyReport[i].total.Calories;
              }
            }
          }
        }
      }
      return ({datasets:datasetsSpecialBar, refSaturated:refDailySaturated, refSugar:refDailySugar, refCarbs:refDailyCarbs})
}
