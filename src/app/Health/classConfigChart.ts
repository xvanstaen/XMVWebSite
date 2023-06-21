import { classPlugin, classAxis, classLegendChart, classPluginTitle } from '../Health/classChart';


export class classConfigChart{
    fileType:string='';
    chartHealth=new classchartHealth;
}

export class  classchartHealth{
    chartTypes:Array<any>=[];
    barDefault={
        canvas:{
            id:"",
            marginleft:20,
            maxWidth:900,
            maxHeight:900,
            width:500,
            height:500,
            backgroundcolor:'',
            color:'',
        },
        datasets:{
            backgroundColor:[],
            borderColor: [],
            borderWidth: [],
            fieldsToSelect: [],
            labels: [],
            borderColorLimits: [],
            labelsLimits: [],
            fieldsLimitsToSelect: [], 
        },
        
        options: {
            layout:{padding:{
                top: 2,
                left:10}},
            plugins:new classPlugin,
            indexAxis:"",
            scales:{
                axisX: new classAxis,
                axisY: new classAxis,
            },
            aspectRatio:1
        },
        

    };
    barChart={
        name:'',
        fieldsToSelect:[],
        labels:[],
        labelsLimits: [],
        fieldsLimitsToSelect: [], 
        canvas:{
            id:"",
            marginleft:20,
            maxWidth:900,
            maxHeight:900,
            width:500,
            height:500,
            backgroundcolor:'',
            color:'',
        },
        datasets:{
            label:"",
            backgroundColor:[],
            borderColor: [],
            borderWidth: [],
            barThickness: 16,
        },
        options: {
            plugins:new classPlugin,
            scales:{
                axisX: new classAxis,
                axisY: new classAxis,
            },
            aspectRatio:1
        },
        };
    lineChart={
        datasetsDefault:{
            borderColor: [],
            borderWidth:1, "showLine":true, fill: false, order:2,
            pointRadius:7, "pointBorderColor":"green", pointBackgroundColor:"blue", 
            pointBorderWidth:2, tension:0.5, pointStyle:"rect",
            hoverBackgroundColor:"cyan", pointHoverBackgroundColor:"grey"
        },
        datasets:[{
            borderColor: [],
            borderWidth:1, "showLine":true, fill: false, order:2,
            pointRadius:7, "pointBorderColor":"green", pointBackgroundColor:"blue", 
            pointBorderWidth:2, tension:0.5, pointStyle:"rect",
            hoverBackgroundColor:"cyan", pointHoverBackgroundColor:"grey"
        },
    ],
    };
    
  
}