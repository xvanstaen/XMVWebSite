export class classConfHTMLFitHealth{

  fileType:string="";
  debugPhone:boolean=false;
  ConfigHealth={
      fileType:"HTMLHealthAllData",
      updatedAt:'',
      confTableAll: new classConfTableAll,
    };
  ConfigCalFat={
      fileType:"HTMLCaloriesFat",
      updatedAt:'',
      confCaloriesFat: new classConfCaloriesFat,
    }
  }

export class classConfTableAll{
    width:number=980;
    minwidth:number=980;
    height:number=600;
    background:string='rgb(43, 34, 34)';
    color:string='white';
    overF:string="scroll";
    title={
        height:'40',
        color:'white',
        background:'blue'
    }
    colWidth={
        action:'60',
        date:'135',
        calBurnt:'60',
        meal:'90',
        ingr:'124',
        other:'50',
    };
    row={
        height:'22',
        color:'white',
        even:'black',
        odd:'rgb(43, 34, 34)',
        background:'blue',
    };
    rowNew={
        color:'black',
        background:'rgb(75, 159, 103)',
    };
    subTotal={
        height:'25',
        color:'green',
        fontWeight:'bolder',
        fontSize:'16',
    };
    Total={
        height:'25',
        color:'red',
        fontWeight:'bolder',
        fontSize:'16',
    };
  }

  export class classConfCaloriesFat{
    width:number=980;
    minwidth:number=980;
    height:number=600;
    background:string='rgb(43, 34, 34)';
    color:string='white';
    overF:string="scroll";
    title={
        height:'34px',
        color:'white',
        background:'blue'
    }
    colWidth={
        action:'60px',
        type:'135px',
        meal:'90px',
        ingr:'124px',
        other:'50px',
    };
    row={
        height:'22px',
        color:'white',
        even:'black',
        odd:'rgb(43, 34, 34)',
        background:'blue',
    };
    rowNew={
        color:'black',
        background:'rgb(75, 159, 103)',
    };
  }

  export class classTitle{
    height:string='40px';
    color:string='white';
    background:string='blue';
  }

  export class classColWidth{
    action:string='60px';
      date:string='135px';
      calBurnt:string='60px';
      meal:string='90px';
      ingr:string='124px';
      other:string='50px';
  }

  export class classRowNew{
    color:string='black';
    background:string='rgb(75, 159, 103)';
  }


  export class classRow{
    height:string='22px';
    color:string='white';
    even:string='black';
    odd:string=' rgb(43, 34, 34)';
    background:string='blue';
  }

  export class classTotal{
    height:string='25px;';
    color:string='green';
    fontWeight:string='13px';
    }