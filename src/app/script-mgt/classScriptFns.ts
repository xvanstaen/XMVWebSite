export class classFilterParam{
    tagConf:string="<ABDConfig ";
    fieldConf:Array<string>=[];
    subConf:Array<classSubConf>=[];
  }

  export class classSubConf{
    tag:string="";
    subTag:string="";
    field:Array<string>=[];
  }
  
  export  class classReplace{
    tag:string="";
    refField:string="";
    withValue:string="";
    changeField:Array<classChangeField>=[];
  }
  
  export class classChangeField{
    tag:string="";
    old:string="";
    new:string="";
  }
  
  export class   classDataScript{
    dom={
      field:"Location",
      value:""
    };
    select={
      tag:"",
      field:"",
      fromValue:"",
      toValue:""
    };
    filter=new classFilterParam;
    replace:Array<classReplace>=[];
  
  }