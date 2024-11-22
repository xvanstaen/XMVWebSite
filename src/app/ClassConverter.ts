
export class mainClassUnit{
  fileType:string='';
  updatedAt:string='';
  tabClassUnit:Array<ClassUnit>=[];
}


export class ClassUnit{
  fileType:string='';
  updatedAt:string='';
  name:string='';
  startPosFrom:number=0;
  startPosTo:number=0;
  convert:number=0;
  from:string='';
  to:string='';
  type:string='';
}

export class mainClassConv{
  fileType:string='';
  updatedAt:string='';
  tabConv:Array<ClassConv>=[];
}

export class ClassConv{
  fromUnit:string='';
  type:string='';
  convert:Array<ClassSubConv>=[];
}

export class mainRecordConvert{
  fileType:string='';
  updatedAt:string='';
  tabRecordConvert:Array<recordConvert>=[];
}
  

export class recordConvert{
    fileType:string='';
    updatedAt:string='';
    valueFromTo:number=0;
    From:string='';
    To:string='';
    type:string='';
    valueFrom:number=0;
    valueTo:number=0;
    }
  
export class mainConvItem{
  fileType:string='';
  updatedAt:string='';
  tabConvItem:Array<ConvItem>=[];
}

export class ConvItem{
  
  from:string='';
  to:string='';
  valueFromTo:number=0;
  firstValue:number=0;
  secondValue:number=0;
  valueFromToDisplay:number=0;
  firstValueDisplay:number=0;
  secondValueDisplay:number=0;
  refMainTable:number=0;
  type:string='';
  }

  export class ClassSubConv{
    toUnit:string='';
    value:number=1;   
  }
    
  
    
  