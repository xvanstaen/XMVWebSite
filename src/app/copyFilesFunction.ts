import { configServer, UserParam, classFilesToCache  } from './JsonServerClass';
import { classCredentials} from './JsonServerClass';

export function fillConfig(inFile:configServer){
    var outFile=new configServer;
    outFile.title = inFile.title;
    outFile.test_prod = inFile.test_prod;
    outFile.GoogleProjectId = inFile.GoogleProjectId;
    outFile.consoleBucket = inFile.consoleBucket;
    
    outFile.googleServer = inFile.googleServer;
    outFile.mongoServer = inFile.mongoServer;
    outFile.fileSystemServer = inFile.fileSystemServer;
    outFile.project = inFile.project;
    outFile.IpAddress = inFile.IpAddress;
    if (inFile.credentialDate!==undefined){
      outFile.credentialDate = inFile.credentialDate;
    } else {outFile.credentialDate = ""};
    
    outFile.bucketFileSystem = inFile.bucketFileSystem;
    outFile.objectFileSystem = inFile.objectFileSystem;

    outFile.timeoutFileSystem.hh= inFile.timeoutFileSystem.hh;
    outFile.timeoutFileSystem.mn = inFile.timeoutFileSystem.mn;
    outFile.timeoutFileSystem.bufferTO.hh= inFile.timeoutFileSystem.bufferTO.hh;
    outFile.timeoutFileSystem.bufferTO.mn = inFile.timeoutFileSystem.bufferTO.mn;
    outFile.timeoutFileSystem.bufferInput.hh = inFile.timeoutFileSystem.bufferInput.hh;
    outFile.timeoutFileSystem.bufferInput.mn = inFile.timeoutFileSystem.bufferInput.mn;
    
    outFile.PointOfRef.bucket = inFile.PointOfRef.bucket;
    outFile.PointOfRef.file = inFile.PointOfRef.file;
    if (inFile.userLogin!==undefined){
      outFile.userLogin.id=inFile.userLogin.id;
      outFile.userLogin.psw=inFile.userLogin.psw;
      outFile.userLogin.accessLevel=inFile.userLogin.accessLevel;
    } else {
      outFile.userLogin.id="";
      outFile.userLogin.psw="";
      outFile.userLogin.accessLevel="";
    }
    
    
    for (var i=0; i<inFile.filesToCache.length; i++){
      const theClass=new classFilesToCache;
      outFile.filesToCache.push(theClass);
      outFile.filesToCache[i].bucket = inFile.filesToCache[i].bucket;
      outFile.filesToCache[i].object = inFile.filesToCache[i].object;
    }
    
    if (inFile.UserSpecific!==undefined && inFile.UserSpecific.length!==0) {
        for (var i=0; i<inFile.UserSpecific.length; i++){
            const usrClass=new UserParam;
            outFile.UserSpecific.push(usrClass);
            outFile.UserSpecific[i].log = inFile.UserSpecific[i].log;
            outFile.UserSpecific[i].theId = inFile.UserSpecific[i].theId;
            outFile.UserSpecific[i].theType = inFile.UserSpecific[i].theType;
        }
    } else {
        const usrClass=new UserParam;
        outFile.UserSpecific.push(usrClass);
        outFile.UserSpecific[0].log = false;
        outFile.UserSpecific[0].theId = "";
        outFile.UserSpecific[0].theType = "";
    }
    return outFile;
  }

  export function fillCredentials(inRecord:any){
    var outRecord=new classCredentials;
    outRecord.access_token=inRecord.access_token;
    outRecord.id_token=inRecord.id_token
    outRecord.refresh_token=inRecord.refresh_token
    outRecord.token_type=inRecord.token_type;
    outRecord.creationDate=inRecord.creationDate;
    return (outRecord);
  }