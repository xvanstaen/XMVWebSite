
export class classPlugin{
    title= new classPluginTitle;
    legend= new classLegendChart;
    elements= {
        point: {
          radius: 5
        }
    }
}

export class classPluginTitle{
    padding= {
        top: 2,
        bottom:10,
    }
    position: string='bottom';
    display:boolean=true;
    text:string='Title chart: CALORIES';
    align:string='center';
    color:string='blue';
    font={
        size:14,
        weight:'bold',
        family:'Helvetica',
    }
}

export class classLegendChart{
    align:string='center';
    position:string='top';   // label position left/right/top/bottom
    labels= {
        boxWidth: 10,     // label box size in px
        boxHeight: 20, 
        usePointStyle:true,
        pointStyle:'triangle',
        borderRadius:4,
        color:'red', 
        font:{
            size:12,
            weight:'bold',
            family:'Helvetica',
        }
      };
    maxHeight:number=60;
    maxWidth:number=300;
    title=new classTitleLegend;
}

export class classTitleLegend{
    display:boolean=true;
    align:string='';
    position:string='';
    text:string='Title legend';       
    color:string='blue';
    padding={
        left:0,
        top:0,
        bottom:0,
    };  
    font={
        size:14,
        weight:'bold',
        family:'Helvetica',
    }
}



export class classAxis{    
    position='left';   
    border={
        color:'red',
        width:2,
    };
    stacked:boolean=false;
    ticks={
        color:'blue',
    }
}

export class classFileParamChart{
    fileType:string='';
    updatedAt:string='';
    data:Array<classTabFormChart>=[];
}

export class classTabFormChart{
        chartType: string='';
        chartTitle={
            display:true,
            text:"",
            position:"",
            padding:{
                top:0,
                bottom:0,
            },
            align:"",
            color:'',
            font:{
                size:0,
                weight:"",
                family:""
            }
        };
        chartTitleRgba={
            slider: new classReturnColor,
            palette: new classReturnColor,
        };
        bar={
            barThickness:0,
            borderWidth:[],
        };
        line={
            borderWidth:0,
            showLine:true,
            fill:false,
            order:0,
            pointRadius:0,
            pointBorderWidth:0,
            pointStyle:"",
            pointBorderColor:"",
            pointBackgroundColor:"",
            pointHoverBackgroundColor:"",
            tension:0,
        };
        ratio:number=0;
        canvasWidth:number=0;
        canvasHeight:number=0;
        canvasBackground:string='';
        canvasMarginLeft:number=0;
        rgbaCanvas={
            slider: new classReturnColor,
            palette: new classReturnColor,
        }
        
        legendTitle={
            display:true,
            text:"",
            position:"",
            padding:{
                left:0,
                top:0,
                bottom:0,
            },
            align:"",
            color:'',

            font:{
                size:0,
                weight:"",
                family:""
            }
        };
        legendTitleRgba={
            slider: new classReturnColor,
            palette: new classReturnColor,
        };
        legendBox={
            boxWidth:0,
            boxHeight:0,
            usePointStyle:true,
            pointStyle:'',
            color:'',
            borderRadius:0,
            font:{
                size:0,
                weight:"",
                family:""
            }
        };
        legendBoxRgba={
            slider: new classReturnColor,
            palette: new classReturnColor,
        };

        period:string='';
         nbWeeks:number=0; // if 'weekly' is selected then define number of weeks
        startRange:string='';
        endRange:string='';
        labels:Array<any>=[];
        labelsColor:Array<any>=[];
        rgbaLabels:Array<any>=[{
            slider: new classReturnColor,
            palette: new classReturnColor,
        }];
        limitLabels:Array<any>=[];
        limitLabelsColor:Array<any>=[];
        limitRgbaLabels:Array<any>=[{
            slider: new classReturnColor,
            palette: new classReturnColor,
        }];
        axisX=new classAxis;
        axisY=new classAxis;
      }

      export class classReturnColor{
        rgba:string='';
        xPos:number=0;
        yPos:number=0;
        
      }
