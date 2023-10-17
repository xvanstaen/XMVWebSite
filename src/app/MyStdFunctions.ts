    import { classFileSystem, classAccessFile }  from 'src/app/classFileSystem';

    export function convertDate(theDate:Date, theFormat:string) {
        var formattedDate:string=theFormat;
        var YY:number= theDate.getFullYear();
        var MM:number = theDate.getMonth()+1;
        var DD:number = theDate.getDate();
        var iYear:number=0;
        var iMonth:number=0;
        var iDay:number=0;
        var MM_String="";
        var DD_String="";
        
        const sep1Pos0=theFormat.indexOf('/');
        const sep2Pos0=theFormat.indexOf('-');
        const sep1Pos1=theFormat.substring(sep1Pos0+1).indexOf('/');
        const sep2Pos1=theFormat.substring(sep2Pos0+1).indexOf('-');

        if (MM<10){
            MM_String="0" + MM.toString();
        }
        else{
            MM_String=MM.toString();
        }
        if (DD<10){
            DD_String="0" + DD.toString();
        }
        else{
           DD_String=DD.toString();
        }


        iYear=theFormat.indexOf("y")+1;
        if (iYear===0) {iYear=theFormat.indexOf("Y")+1};
        if (iYear===0) {formattedDate= ""} 
        else{
            iMonth=theFormat.indexOf("m")+1;
            if (iMonth===0) {iMonth=theFormat.indexOf("M")+1};
            if (iMonth===0) {formattedDate= ""} 
            else{
                iDay=theFormat.indexOf("d")+1;
                if (iDay===0) {iDay=theFormat.indexOf("D")+1};
                if (iDay===0) {formattedDate= ""} 
                else{
                    formattedDate=formattedDate.replace(formattedDate.substring(iYear-1,iYear+3),YY.toString());
                    formattedDate=formattedDate.replace(formattedDate.substring(iMonth-1,iMonth+1),MM_String);
                    formattedDate=formattedDate.replace(formattedDate.substring(iDay-1,iDay+1),DD_String);
                    /*if (iYear===1) { //format is YYYY-MM-DD

                        formattedDate = YY + theFormat.substring(iYear+4,iYear+3)+ MM_String + theFormat.substring(iMonth+2,iMonth+1)+DD_String;
                    }
                    else{ //format is DD-MM-YYYY
                        formattedDate = DD_String + theFormat.substring(iDay+2,iDay+1)+ MM_String + theFormat.substring(iMonth+2,iMonth+1)+YY
                    }*/
                }
            }
        }    
        return(formattedDate);
    }


    export function fnAddTime(theDate:string, addHour:number, addMin:number){
        // format of theDate is YYYMMDDHHMNSS
        var stringHour='';
        var stringMin='';
        var plusDay=0;
        var plusHour=0;
        var theDateHour=Number(theDate.substring(8,10)) + Number(addHour);
        var theDateMin=Number(theDate.substring(10,12)) + Number(addMin);
        
        if (Math.trunc(theDateMin / 60) > 0){
          plusHour =  Math.trunc(theDateMin / 60);
          theDateMin= theDateMin % 60;
        }
        if (theDateMin<10){
            stringMin ='0'+ theDateMin.toString();
        } else { 
            stringMin = theDateMin.toString();
        }
        theDateHour=theDateHour+plusHour;
        if (Math.trunc(theDateHour / 24) > 0){
          plusDay =  Math.trunc(theDateHour / 24);
          theDateHour= theDateHour % 24;
        }
        if (theDateHour<10){
            stringHour ='0'+ theDateHour.toString();
        } else { 
            stringHour = theDateHour.toString();
        }
        var theDay=Number(theDate.substring(6,8));
        var theMonth=Number(theDate.substring(4,6));
        var theYear=Number(theDate.substring(0,4));
        const tabDays=[31,28,31,30,31,30,31,31,30,31,30,31];
        if (plusDay>0){
            theDay=theDay+plusDay;
            if (theDay>tabDays[theMonth-1]){
                theDay=theDay-tabDays[theMonth-1];
                theMonth++
                if (theMonth>12){
                    theMonth=theMonth-12;
                    theYear=theYear+1;
                }
            }
        }
        var stringMonth="";
        var stringDay="";
        if (theMonth<10){
            stringMonth="0" + theMonth;
        } else {
            stringMonth=theMonth.toString();;
        }
        if (theDay<10){
            stringDay="0" + theDay;
        } else {
            stringDay=theDay.toString();;
        }

        return(theYear.toString()+stringMonth+stringDay+stringHour+stringMin+theDate.substring(12));
    
      }

      export function strDateTime(){
        const theDate=new Date();
        //const myDate=new Date(theDate).toUTCString();
        const year=theDate.getUTCFullYear();
        const month=theDate.getUTCMonth()+1;
        const day=theDate.getUTCDate();
        const seconds= theDate.getUTCSeconds();
        const minutes= theDate.getUTCMinutes();
        const hour= theDate.getUTCHours();
        if (month<10){
          var theMonth='0'+month.toString();;
        } else {
          theMonth=month.toString();
        } 
        if (day<10){
          var theDay='0'+day.toString();;
        } else {
          theDay=day.toString();;
        } 
        if (hour<10){
          var theHour='0'+hour.toString();;
        } else {
          theHour=hour.toString();;
        } 
        if (minutes<10){
          var theMinutes='0'+minutes.toString();;
        } else {
          theMinutes=minutes.toString();;
        } 
        if (seconds<10){
          var theSeconds='0'+seconds.toString();;
        } else {
          theSeconds=seconds.toString();;
        } 
      
        return (year.toString()+theMonth+theDay+theHour+theMinutes+theSeconds);
      }
      
      export function defineMyDate(){
        const theDate=new Date();
        //const myDate=new Date(theDate).toUTCString();
        const year=theDate.getUTCFullYear();
        const month=theDate.getUTCMonth()+1;
        const day=theDate.getUTCDate();
        const milliseconds= theDate.getUTCMilliseconds();
        const seconds= theDate.getUTCSeconds();
        const minutes= theDate.getUTCMinutes();
        const hour= theDate.getUTCHours();
        if (month<10){
          var theMonth='0'+month.toString();;
        } else {
          theMonth=month.toString();
        } 
        if (day<10){
          var theDay='0'+day.toString();;
        } else {
          theDay=day.toString();;
        } 
        if (hour<10){
          var theHour='0'+hour.toString();;
        } else {
          theHour=hour.toString();;
        } 
        if (minutes<10){
          var theMinutes='0'+minutes.toString();;
        } else {
          theMinutes=minutes.toString();;
        } 
        if (seconds<10){
          var theSeconds='0'+seconds.toString();;
        } else {
          theSeconds=seconds.toString();;
        } 
        if (milliseconds<10){
          var theMilliseconds='00'+milliseconds.toString();;
        } else if (milliseconds<100) {
          theMilliseconds='0'+milliseconds.toString();;
        } else {
          theMilliseconds=milliseconds.toString();;
        }
      
      
        return (year.toString()+theMonth+theDay+theHour+theMinutes+theSeconds+theMilliseconds);
      
      
      }

      export function fnCheckLockLimit(configServer:any,tabLock:any,iWait:any, lastInputAt:string, isRecordModified:boolean, isSaveFile:boolean){ 
        var returnValue={
            action:"noAction",
            lockValue:0,
            lockAction:''
        }
    
        if (tabLock[iWait].lock!==3){

            const currentTime=defineMyDate();
    
            const timeOutValue=fnAddTime(tabLock[iWait].updatedAt,configServer.timeoutFileSystem.hh,configServer.timeoutFileSystem.mn);
            const bufferTimeOutValue=fnAddTime(tabLock[iWait].updatedAt,configServer.timeoutFileSystem.bufferTO.hh,configServer.timeoutFileSystem.bufferTO.mn);
            const bufferLastInput=fnAddTime(tabLock[iWait].updatedAt,configServer.timeoutFileSystem.bufferInput.hh,configServer.timeoutFileSystem.bufferInput.mn);
            
           // if (tabLock[iWait].lock===2){
           //   isAllDataModified = false;
           // }
           
            //console.log('===> checkLockLimit():  timeOutValue= ' + timeOutValue, '  currentTime= ' + currentTime + '  bufferLastInput=' + bufferLastInput );
            
            if (Number(currentTime) <= Number(timeOutValue) && Number(lastInputAt) >=Number(bufferTimeOutValue) 
                                    && tabLock[iWait].lock === 1 && isRecordModified === true){
              // isMustSaveFile=true;
              // theEvent.target.id='All'; 
              // ConfirmSave(theEvent);
              if (isSaveFile===true){
                //ProcessSaveHealth(theEvent);
                returnValue.action="ProcessSave";
              } else {
                returnValue.action="ConfirmSave";
              }
              
    
            } else if (Number(currentTime) <= Number(timeOutValue) && Number(lastInputAt) >= Number(bufferLastInput)
                                    && tabLock[iWait].lock === 1 && isRecordModified === true){
              //updateLockFile(iWait);
              returnValue.action="updateSystemFile";
              returnValue.lockAction="updatedAt";

            } else  if (Number(currentTime) > Number(timeOutValue) ){ // timeout is reached
                
                if (tabLock[iWait].lock === 1 && isRecordModified === true){
                    //checkFile(iWait); // check if it is possible to still trigger the changes 
                    returnValue.action="checkFile";
                    
                } else if (tabLock[iWait].lock === 1){
                    //tabLock[iWait].lock = 0; // user has not done anything until timeout;  
                    // returnValue.action="changeTabLock"; // WHY DOING THAT?
                    returnValue.action="checkFile";
                } else if (tabLock[iWait].lock===0 && isRecordModified === true) {
                    //lockFile(iWait); // user is trying to do something but file was not locked
                    returnValue.action="updateSystemFile";
                    returnValue.lockAction="lock";
                } else if (tabLock[iWait].lock===2) {
                    //lockFile(iWait); // check if file can now be locked by this user - may have been unlocked in the meantime by other user
                    returnValue.action="updateSystemFile";
                    returnValue.lockAction="lock";
                } 
            } else  if (isSaveFile===true){
                //ProcessSaveHealth(theEvent);
                returnValue.action="ProcessSave";
            } 
          
        
    } else {
      returnValue.action="updateSystemFile";
      returnValue.lockAction="lock";
    }
 
    return(returnValue);
}


export function checkData(fileSystem:Array<classFileSystem>, iWait:number, tabLock:Array<classAccessFile>){
    //console.log('start checkData');
    if (fileSystem.length > 0 ){
        for (var i=0; i<fileSystem.length && (fileSystem[i].object!==tabLock[iWait].object || fileSystem[i].bucket!==tabLock[iWait].bucket); i++){}
        if (tabLock[iWait].action==="lock"){
            if (i===fileSystem. length ){
                // record is not locked so create a new record and flag lock to true
                createRecord(fileSystem,tabLock[iWait]);
  
                //console.log('file=' +tabLock[iWait].objectName + ' ==> create record & tabLock ' + JSON.stringify(tabLock[iWait]) );
                //const status=saveFile(config, fileSystem, object, bucket);
                return (fileSystem);
            } else { // record already exists and already locked
                console.log('record in file system ' + JSON.stringify(fileSystem[i]) + ' already exists and is locked - Error 300');
                // check wheter it has been locked form more than 1 hour
                // if yes then lock it for this user
                return(validateLock(fileSystem,tabLock[iWait],i));
            }
        } else if (tabLock[iWait].action==="unlock"){
            if (i===fileSystem.length ){
                // record is not found so cannot be unlocked
                console.log('record not found, so cannot be unlocked - Error 700');
                return(700);
            } else { // record is found; delete it
              if (tabLock[iWait].createdAt === fileSystem[i].createdAt) {
                fileSystem.splice(i,1);
                return (fileSystem);
              } else {
                console.log('record found but createdAt is different ,  so cannot be unlocked - Error 710');
                return(710);
              }
            }
        } else if (tabLock[iWait].action==="updatedAt"){
          if (tabLock[iWait].createdAt === fileSystem[i].createdAt) {
                return(updatedAt(fileSystem,iWait,i));
          } else {
            console.log('record found but createdAt is different ,  so cannot be updated - Error 720');
                return(720);
          }
        } else if (tabLock[iWait].action==="check" || tabLock[iWait].action==="check&update"){
          if (i===fileSystem.length ){ // no record found
              if (tabLock[iWait].action==="check"){
                console.log('check file = no record found on file ' +tabLock[iWait].objectName + '; return inData.status 800');
                tabLock[iWait].createdAt='';
                tabLock[iWait].updatedAt='';
                tabLock[iWait].status=800;
              } else {
                createRecord(fileSystem,tabLock[iWait]);
                //console.log('create record & tabLock = ' + JSON.stringify(tabLock[iWait]) );
                return (fileSystem);
              }
              
          } else {
            if (tabLock[iWait].createdAt === fileSystem[i].createdAt && tabLock[iWait].updatedAt === fileSystem[i].updatedAt){
              if (tabLock[iWait].action==="check"){  
                tabLock[iWait].status=810; 
                    console.log('check file = record found and locked by same user; return inData.status 810');
                // same user is locking the file
              } else {
                return(updatedAt(fileSystem,iWait,i));
              }
            } else { 
                tabLock[iWait].status=820; 
                console.log('check file = record found and locked by another user; return inData.status 820');
            }
          } 
          return(tabLock[iWait]);
        } else {
          console.log('wrong inData.action ==> return err-730');
          return(730);} // wrong action
    } else { 
        if (tabLock[iWait].action==="lock"){
            console.log('fileSystem' +tabLock[iWait].objectName + ' is empty; createRecord');
            createRecord(fileSystem,tabLock[iWait]);
            //console.log('create record & tabLock = ' + JSON.stringify(tabLock[iWait]) );
            return (fileSystem);
        } else if (tabLock[iWait].action==="check"  || tabLock[iWait].action==="check&update"){
            if (tabLock[iWait].action==="check"){
              console.log('check file = fileSystem ' +tabLock[iWait].objectName + 'is empty; return inData.status 800');
              tabLock[iWait].createdAt='';
              tabLock[iWait].updatedAt='';
              tabLock[iWait].status=800;
              return(tabLock[iWait]);
            } else {
              createRecord(fileSystem,tabLock[iWait]);
              //console.log('create record & tabLock = ' + JSON.stringify(tabLock[iWait]) );
              return (fileSystem);
            }
        } else {
          console.log('fileSystem ' +tabLock[iWait].objectName + 'is empty;');
          return('err-0'); 
        }
        
    }
  }
  
  export  function createRecord(fileSystem:Array<classFileSystem>, inData:classAccessFile){
  
    const recordSystem=new classFileSystem;
  
    fileSystem.push(recordSystem);
    fileSystem[fileSystem.length-1].bucket=inData.bucket;
    fileSystem[fileSystem.length-1].object=inData.object;
    fileSystem[fileSystem.length-1].byUser=inData.user;
    fileSystem[fileSystem.length-1].IpAddress=inData.IpAddress;
    fileSystem[fileSystem.length-1].lock=true;
    const aDate=new Date();
    const theDate=aDate.toUTCString();
    //console.log('theDate=',theDate);
    const myTime=theDate.substring(17,19)+theDate.substring(20,22)+theDate.substring(23,25);
    const myDate=convertDate(aDate,"YYYYMMDD") + myTime;
    //console.log('created & updatedAt=' +myDate);
    fileSystem[fileSystem.length-1].createdAt=myDate;
    fileSystem[fileSystem.length-1].updatedAt=myDate;
  }
  
export function validateLock(fileSystem:Array<classFileSystem>, inData:classAccessFile, record:number){
    var stringHour='';
    var stringMin='';
    var stringDay='';
    var stringMonth='';
    var addDay=0;
    var addHour=0;
    
    
    var theMin=Number(fileSystem[record].updatedAt.substring(10,12)) + Number(inData.timeoutFileSystem.mn); // add xx minutes
    if (Math.trunc(theMin / 60) > 0){
      addHour =  Math.trunc(theMin / 60);
      theMin= theMin % 60;
    }
    if (theMin<10){
        stringMin ='0'+ theMin.toString();
    } else { 
        stringMin = theMin.toString();
    }
    var theHour=Number(fileSystem[record].updatedAt.substring(8,10)) + Number(inData.timeoutFileSystem.hh) + addHour; // add xx hours;
    if (Math.trunc(theHour / 24) > 0){
      addDay =  Math.trunc(theHour / 24);
      theHour= theHour % 24;
    }
    if (theHour<10){
        stringHour ='0'+ theHour.toString();
    } else { 
        stringHour = theHour.toString();
    }
  
    const theTime = stringHour + stringMin + fileSystem[record].updatedAt.substring(12);
    const theDay = Number(fileSystem[record].updatedAt.substring(6,8)) + addDay;
    if (theDay < 10){
      stringDay = "0" + theDay;
    } else {
      stringDay = theDay.toString();
    }
    const refDate=fileSystem[record].updatedAt.substring(0,6) + stringDay + theTime;
    

    const refDateB = fnAddTime(fileSystem[record].updatedAt, inData.timeoutFileSystem.hh, inData.timeoutFileSystem.mn);
    console.log('refDate=' + refDate + ' =?' + refDateB);

    
    const aDate = new Date();
    const theDate = aDate.toUTCString();
    const myTime = theDate.substring(17,19)+theDate.substring(20,22)+theDate.substring(23,25);
    const myDate = convertDate(aDate,"YYYYMMDD") + myTime;

    if (Number(myDate) > Number(refDate)){
        fileSystem[record].createdAt=myDate;
        fileSystem[record].updatedAt=myDate;
        fileSystem[record].bucket=inData.bucket;
        fileSystem[record].object=inData.object;
        fileSystem[record].byUser=inData.user;
        fileSystem[fileSystem.length-1].IpAddress=inData.IpAddress;
        return(fileSystem);
    } else {
        return(300);
    }
  }
  
  export  function updatedAt(fileSystem:Array<classFileSystem>, iWait:number,iRecord:number){
    const aDate=new Date();
    const theDate=aDate.toUTCString();
    const myTime=theDate.substring(17,19)+theDate.substring(20,22)+theDate.substring(23,25);
    const myDate=convertDate(aDate,"YYYYMMDD") + myTime;
    fileSystem[iRecord].updatedAt=myDate;
    return(fileSystem);
  }