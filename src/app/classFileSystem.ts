// content of file system
export class classFileSystem{
    bucket:string="";
    object:string="";
    byUser:string="";
    lock:boolean=false;
    createdAt:string="";
    updatedAt:string=""; 
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
    iWait:number=0;
    status:number=0;
    lock:number=0;
    createdAt:string="";
    updatedAt:string=""; 
  }

