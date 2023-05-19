
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
    text:string='Title legend';       
    color:string='blue';
    padding={
        left:0,
    };  
    font={
        size:14,
        weight:'bold',
        family:'Helvetica',
    }
}

export class classAxisX{
    border={
        color:'blue',
        width:2,
      };
    position:string='bottom';
    stacked:boolean=false;
    ticks={
        color:'blue',
      }
}

export class classAxisY{    
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
    data:Array<classTabFormChart>=[];
}

export class classTabFormChart{
        chartType: string='';
        chartTitle: string='';
        colorChartTitle:string='';
        rgbaTitle={
            slider: new classReturnColor,
            palette: new classReturnColor,
        };
        barThickness:number=0;
        ratio:number=0;
        canvasWidth:number=0;
        canvasHeight:number=0;
        canvasBackground:string='';
        rgbaCanvas={
            slider: new classReturnColor,
            palette: new classReturnColor,
        }
        canvasMarginLeft:number=0;
        stackedX:string='';
        stackedY:string='';
        legendTitle:string='';
        colorLegendTitle:string='';
        rgbaLegend={
            slider: new classReturnColor,
            palette: new classReturnColor,
        }
        legendBox={
            width:0,
            height:0,
            pointStyle:'',
            color:'',
            fontSize:0,
            radius:0,
        }
        rgbaLegendBox={
            slider: new classReturnColor,
            palette: new classReturnColor,
        }
        period:string='';
        startRange:string='';
        endRange:string='';
        labels:Array<any>=[];
        labelsColor:Array<any>=[];
        rgbaLabels:Array<any>=[{
            slider: new classReturnColor,
            palette: new classReturnColor,
        }];

      }

      export class classReturnColor{
        rgba:string='';
        xPos:number=0;
        yPos:number=0;
        
      }
