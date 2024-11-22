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
    if (inFile.timeoutFileSystem.userTimeOut!==undefined){
      outFile.timeoutFileSystem.userTimeOut.hh = inFile.timeoutFileSystem.userTimeOut.hh;
      outFile.timeoutFileSystem.userTimeOut.mn = inFile.timeoutFileSystem.userTimeOut.mn;
      outFile.timeoutFileSystem.userTimeOut.ss = inFile.timeoutFileSystem.userTimeOut.ss;
    } else {
      outFile.timeoutFileSystem.userTimeOut.hh = 0;
      outFile.timeoutFileSystem.userTimeOut.mn = 8;
      outFile.timeoutFileSystem.userTimeOut.ss = 45;
    }
    
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
    outRecord.userServerId=inRecord.userServerId;
    return (outRecord);
  }

  export function FillHealthAllInOut(outFile:any, inFile: any) {
    var iOut = -1;
    if (inFile.updatedAt !== undefined) {
      outFile.updatedAt = inFile.updatedAt;
    } else { outFile.updatedAt = ''; }
    for (var i = 0; i < inFile.tabDailyReport.length; i++) {
      iOut++
      outFile = fillHealthOneDay(outFile, inFile, i, iOut);
    }
    return outFile;
  }
  import { ClassItem, DailyReport, ClassMeal, ClassDish } from './Health/ClassHealthCalories';
  
  export function fillHealthOneDay(outFile:any, inFile: any, i:number, iOut:number) {
    const theDaily = new DailyReport;
    outFile.tabDailyReport.push(theDaily);
    outFile.tabDailyReport[iOut].burntCalories = inFile.tabDailyReport[i].burntCalories;
    outFile.tabDailyReport[iOut].date = inFile.tabDailyReport[i].date;
    if (inFile.tabDailyReport[i].total.naturalSugar===undefined){
      fillTotal(outFile.tabDailyReport[iOut].total, inFile.tabDailyReport[iOut].total);
    } else {
      outFile.tabDailyReport[iOut].total = inFile.tabDailyReport[i].total;
    }
    
    var jOut = -1;
    for (var j = 0; j < inFile.tabDailyReport[i].meal.length; j++) {
      if (inFile.tabDailyReport[i].meal[j].dish.length > 0) {
        const theMeal = new ClassMeal;
        outFile.tabDailyReport[iOut].meal.push(theMeal);
        jOut++
        outFile.tabDailyReport[iOut].meal[jOut].name = inFile.tabDailyReport[i].meal[j].name;
        if (inFile.tabDailyReport[i].meal[j].total.naturalSugar===undefined){
          fillTotal(outFile.tabDailyReport[iOut].total, inFile.tabDailyReport[i].meal[j].total);
        } else {
          outFile.tabDailyReport[iOut].meal[jOut].total = inFile.tabDailyReport[i].meal[j].total;
        }
        
        var lOut = -1;
        for (var k = 0; k < inFile.tabDailyReport[i].meal[j].dish.length; k++) {
          if (inFile.tabDailyReport[i].meal[j].dish[k].name !== '') {
            const theIngr = new ClassDish;
            outFile.tabDailyReport[iOut].meal[jOut].dish.push(theIngr);
            lOut++
            outFile.tabDailyReport[iOut].meal[jOut].dish[lOut].name = inFile.tabDailyReport[i].meal[j].dish[k].name;
            outFile.tabDailyReport[iOut].meal[jOut].dish[lOut].quantity = inFile.tabDailyReport[i].meal[j].dish[k].quantity;
            outFile.tabDailyReport[iOut].meal[jOut].dish[lOut].unit = inFile.tabDailyReport[i].meal[j].dish[k].unit;
            outFile.tabDailyReport[iOut].meal[jOut].dish[lOut].calFat = inFile.tabDailyReport[i].meal[j].dish[k].calFat;
          } else {
            const theIngr = new ClassDish;
            outFile.tabDailyReport[iOut].meal[jOut].dish.push(theIngr);
            lOut++
          }
        }
      } else {
        const theMeal = new ClassMeal;
        outFile.tabDailyReport[iOut].meal.push(theMeal);
        jOut++
        const theIngr = new ClassDish;
        outFile.tabDailyReport[iOut].meal[jOut].dish.push(theIngr);
      }
    }
    return outFile;
  }

  function fillTotal(outReport:any,inReport:any){
    outReport.Sugar = inReport.Sugar;
    if (inReport.naturalSugar===undefined){
      outReport.naturalSugar = 0;
    } else {
      outReport.naturalSugar = inReport.naturalSugar;
    }
    if (inReport.addedSugar===undefined){
      outReport.addedSugar = 0;
    } else {
      outReport.addedSugar = inReport.addedSugar;
    }
    outReport.Calories = inReport.Calories;
    outReport.Protein = inReport.Protein;
    outReport.Carbs = inReport.Carbs;
    outReport.Fat.Saturated = inReport.Fat.Saturated;
    outReport.Fat.Total = inReport.Fat.Total;

  }