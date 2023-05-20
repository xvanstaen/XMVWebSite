import { classPlugin, classAxisX, classAxisY, classLegendChart, classPluginTitle } from '../Health/classChart';


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
            backgroundColor:["#2ecc71","#3498db","#95a5a6","#9b59b6","#f1c40f","#e74c3c","cyan","red"],
            borderColor: ["rgba(255,99,132,1)", "rgba(54, 162, 235, 1)","rgba(255, 206, 86, 1)","rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)","rgba(255, 159, 64, 1)"],
            borderWidth: [],
            barThickness: 12,
        },
        options: {
            plugins:new classPlugin,
            scales:{
                axisX: new classAxisX,
                axisY: new classAxisY,
            },
            aspectRatio:1
        },
        

    };
    barChart={
        name:'',
        fieldsToSelect:[],
        labels:[],
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
                axisX: new classAxisX,
                axisY: new classAxisY,
            },
            aspectRatio:1
        },
        };
    lineChart={
        datasetsDefault:{
            borderColor: ["rgba(227,232,40,1)","rgba(28,234,25,1)","rgba(217,19,37,1)","rgba(232,90,55,1)","rgba(240,152,129,1)","rgba(44,206,206,1)","rgba(145,51,215,1)","rgba(48,103,85,1)"],
            borderWidth:1, "showLine":true, fill: false, order:2,
            pointRadius:7, "pointBorderColor":"green", pointBackgroundColor:"blue", 
            pointBorderWidth:2, tension:0.5, pointStyle:"rect",
            hoverBackgroundColor:"cyan", pointHoverBackgroundColor:"grey"
        },
        datasets:[{
            borderColor: ["rgba(227,232,40,1)","rgba(28,234,25,1)","rgba(217,19,37,1)","rgba(232,90,55,1)","rgba(240,152,129,1)","rgba(44,206,206,1)","rgba(145,51,215,1)","rgba(48,103,85,1)"],
            borderWidth:1, "showLine":true, fill: false, order:2,
            pointRadius:7, "pointBorderColor":"green", pointBackgroundColor:"blue", 
            pointBorderWidth:2, tension:0.5, pointStyle:"rect",
            hoverBackgroundColor:"cyan", pointHoverBackgroundColor:"grey"
        },
    ],
    };
    
  
}