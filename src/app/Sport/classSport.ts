export class classCountryPoR{
    country:string="";code:string=""; PoR:Array<classPointOfRef>=[]
  }
  
  export class classPointOfRef 
    {
      ref:string=""; alt:number=0; lat:number=0; lon:number=0; prio:string=""; varLat:number=0;
      varLon:number=0;  
    }
  
  export class classTabPoR{
      recNb:number=0;
      content=new classFilePerf;
    }
  
  export class classCircuitRec
      { 
        code:string=""; name:string=""; country:string=""; city:string="";
        points:Array<classPointOfRef>=[]; dist:Array<number>=[];
      }
  
  export class classFilePerf{
      time:number=0;dist:number=0;speed:number=0;heart:number=0;alt:number=0;lat:number=0;lon:number=0;slope=0;refPoR:string="";exclude:string="";
  }
  
  export class classHeaderFileSport{ 
    fileType:string=""; // circuit, perf
    name:string="";
    circuit:string="";
    sport:string="";
    theDate:string="";
    content:Array<any>=[];
    codeName:string="";
    refPoints:Array<any>=[]; 
  }
  
  export class classFileSport
      { 
        fileType:string=""; // circuit, perf
        name:string="";
        circuit:string="";
        sport:string="";
        theDate:string="";
        content:Array<any>=[];
        codeName:string="";
        refPoints:Array<any>=[]; // contains the list of PoR already found
      }
  
  export class classTotalLoop{
        dist:number=0; theTime:number=0; speed:number=0; strTime:string=""; from:string="";to:string="";
      }
  
    export class classNewLoop {
        dist:number=0;theTime:number=0;speed:number=0;strTime:string="";from:string="";to:string="";
        loop:number=0;perfRecordFrom:number=0;perfRecordTo:number=0;exclude:string="";loopDel:string="" }
  
   export class classWorkCircuit{name:string="";spec:number=0;value=[];dist=[];exclude=[]}   