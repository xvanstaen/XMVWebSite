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

