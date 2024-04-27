// content of file system
export class classFileSystem{
    bucket:string="";
    object:string="";
    byUser:string="";
    IpAddress:string="";
    lock:boolean=false;
    createdAt:string="";
    updatedAt:string=""; 
    userServerId:number=0;
    credentialDate:string="";
    timeoutFileSystem={
        hh:0,
        mn:0,
    }
}

export class classUpdate{
    byUser:string="";
    createdAt:string="";
    updatedAt:string=""; 
}

// input data to componenet check-file-update
export class classAccessFile{
    action:string=""; // 'lock' or 'unlock'
    bucket:string=''; 
    object:string='';
    user:string="";
    IpAddress:string="";
    iWait:number=0;
    status:number=0;
    lock:number=0;
    objectName:string='';
    createdAt:string="";
    updatedAt:string=""; 
    timeoutFileSystem={
        hh:0,
        mn:0,
        bufferTO:{
            hh:0,
            mn:0
        },
        bufferInput:{
            hh:0,
            mn:0
        }
      };
      userServerId:number=0;
      credentialDate:string="";
  }

  export class classReturnDataFS{
    onInputAction:string="";
    reAccessFile:boolean=false;
    tabLock:Array<classAccessFile>=[];
    iWait:number=0;
    checkToLimit:number=0;
    theResetServer:boolean=false;
    nbRecall:number=0;
    errorCode:number=0;
    errorMsg:string="";
    processSave:boolean=false;
  }  
  export class classHeaderReturnDataFS{
    onInputAction:string="";
    reAccessFile:boolean=false;
    iWait:number=0;
    checkToLimit:number=0;
    theResetServer:boolean=false;
    nbRecall:number=0;
    errorCode:number=0;
    errorMsg:string="";
    processSave:boolean=false;
  }  

  export class classRetrieveFile{
    iWait:number=0;
    accessFS:boolean=false;
  }
