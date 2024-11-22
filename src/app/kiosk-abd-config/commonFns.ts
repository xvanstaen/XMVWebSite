import { classMainFile , classStructure, classDetails, classTabLevel0, classTabLevel1, classTabLevel2, classTabLevel3, classTabLevel4} from "./exportClassMasterCONFIG";
import { classMainOutFile , classOutStructure, classOutDetails, classOutTabLevel0, classOutTabLevel1, classOutTabLevel2, classOutTabLevel3, classOutTabLevel4} from "./exportClassMasterCONFIG";


export function processDetails(workString:string, isNL:boolean, tabDetails:Array<classOutDetails> ){
    
    const sep='='       //'="';
    const endStr1='"';
    const endStr2="'";
    const endStr3='""';
    const endStr4='="="'
    var error="";
    var isStr3=0;
    var prevString="";
    var initialString=workString;
    var endValue='"';
    var startPos=0;
    var initStartPos=0;
    var endPos=0;
    var newEnd=0;
    //workString=removeSpecChar(workString);
    var iTab=-1;
    while (error==="" && workString!==""){
      startPos=workString.indexOf(sep);
      
      prevString=workString;
      if (startPos>-1){

        isStr3=workString.indexOf(endStr3);
        initStartPos=startPos;
        // search if next char. is ' or " there may be space betwen this char and =
        var found=false;
        for (var i=startPos+1; i<workString.substring(startPos+1).length+startPos+1 && found===false; i++ ){
            if (workString.substring(i,i+1) === endStr1 ){
              found=true;
              endValue=endStr1;
            } else if  (workString.substring(i,i+1) === endStr2){
              found=true;
              endValue=endStr2;
            }
        }
        startPos=i-1;

        endPos=workString.substring(startPos+1).indexOf(endValue)+startPos+1;
        if (startPos>-1 && endPos>-1 && startPos<= endPos ){
            const details=new classOutDetails;
            tabDetails.push(details);
            iTab++
            if (isNL===true){
              tabDetails[iTab].nlBefore=true;
              isNL=false;
            }
            tabDetails[iTab].F = workString.substring(0,initStartPos);
            if (isStr3>-1 && isStr3<=startPos){
              tabDetails[iTab].V ="";
              newEnd=isStr3+2+1;
            } else {
              tabDetails[iTab].V = workString.substring(startPos+1,endPos);
              newEnd=endPos+1;
            }
            if (workString.substring(newEnd,newEnd+10).indexOf("\r\n")===-1 && workString.substring(newEnd,newEnd+10).indexOf("\t")===-1){
              tabDetails[iTab].nl=false;
            } else {
              tabDetails[iTab].nl=true;
            }
            workString=workString.substring(newEnd).trimStart();
        } else if (startPos==-1 && endPos==-1){
            workString="";
        } else {
            console.log("processDetails - may be an issue with the string. Value is " + prevString);
            workString="";
        }
      } else {
        if (workString===">" || workString==="/>"){
          //console.log("processDetails - all fields processed. Last string was > or />");
          workString="";
        } else {
          console.log("processDetails - all fields processed. sign = not found in the remaining string " + initialString);
          workString="";
        }
      }
    }
    return tabDetails;
}

export function removeSpecChar(mainRecord:string){
    const tabSpecChar:Array<string>=["\n","\t","\r"];
    var found=true;;
    while (found===true){
        found=false;
        for (var j=0; j<tabSpecChar.length; j++){
            if (mainRecord.indexOf(tabSpecChar[j])>-1){
              const k=mainRecord.indexOf(tabSpecChar[j]);
              mainRecord=mainRecord.substring(0,k)+" "+mainRecord.substring(k+2);
              found=true
            }
        }
    }
    return mainRecord;
}

export function removeChar(mainRecord:string, specChar:string){
  
  var found=true;;
  while (found===true){
      found=false;
      if (mainRecord.indexOf(specChar)>-1){
          const k=mainRecord.indexOf(specChar);
          mainRecord=mainRecord.substring(0,k)+" "+mainRecord.substring(k+specChar.length);
          found=true
      }
  }
  return mainRecord;
}

export function copyData(inTab:any,outTab:any){
    outTab.display=true;
    outTab.name=inTab.name;
    outTab.type=inTab.type;
    outTab.details = copyDetails(inTab.details,outTab.details);
    return outTab;
    }

export function copyDetails(inTab:any, outTab:any){
    for (var i=0; i<inTab.length; i++){
      const details=new classOutDetails;
      outTab.push(details);
      outTab[i].V=inTab[i].V;
      outTab[i].F=inTab[i].F;
      outTab[i].nl=inTab[i].nl;
      outTab[i].nlBefore=inTab[i].nlBefore;
    }
    return outTab;
}

export function copyMainOuttoMain(inFile:classMainOutFile, outFile:classMainFile){
    outFile.Body.level=copyData(inFile.Body.level,outFile.Body.level);
    for (var i=0; i<inFile.Body.level.tab.length; i++){
      const Level0=new classTabLevel0;
      outFile.Body.level.tab.push(Level0);
      outFile.Body.level.tab[i].details=copyData(inFile.Body.level.tab[i],outFile.Body.level.tab[i]);
      for (var j=0; j<inFile.Body.level.tab[i].tab.length; j++){
        const Level1=new classTabLevel1;
        outFile.Body.level.tab[i].tab.push(Level1);
        outFile.Body.level.tab[i].tab[j]=copyData(inFile.Body.level.tab[i].tab[j],outFile.Body.level.tab[i].tab[j]);
        for (var k=0; k<inFile.Body.level.tab[i].tab[j].tab.length; k++){
          const Level2=new classTabLevel2;
          outFile.Body.level.tab[i].tab[j].tab.push(Level2);
          outFile.Body.level.tab[i].tab[j].tab[k]=copyData(inFile.Body.level.tab[i].tab[j].tab[k],outFile.Body.level.tab[i].tab[j].tab[k]);
          for (var l=0; l<inFile.Body.level.tab[i].tab[j].tab[k].tab.length; l++){
            const Level3=new classTabLevel3;
            outFile.Body.level.tab[i].tab[j].tab[k].tab.push(Level3);
            outFile.Body.level.tab[i].tab[j].tab[k].tab[l]=copyData(inFile.Body.level.tab[i].tab[j].tab[k].tab[l],outFile.Body.level.tab[i].tab[j].tab[k].tab[l]);
            for (var m=0; m<inFile.Body.level.tab[i].tab[j].tab[k].tab[l].tab.length; m++){
              const Level4=new classTabLevel4;
              outFile.Body.level.tab[i].tab[j].tab[k].tab[l].tab.push(Level4);
              outFile.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m]=copyData(inFile.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m],outFile.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m]);
            }
          }
        }
      }
    }
    return outFile;
}


export function copyMainToMainOut(inFile:classMainFile, outFile:classMainOutFile){
    
    outFile.Body.startTag=inFile.Body.startTag;
    outFile.Body.endTag=inFile.Body.endTag;
    outFile.Body.level=copyData(inFile.Body.level,outFile.Body.level);
    for (var i=0; i<inFile.Body.level.tab.length; i++){
      const Level0=new classOutTabLevel0;
      outFile.Body.level.tab.push(Level0);
      outFile.Body.level.tab[i]=copyData(inFile.Body.level.tab[i],outFile.Body.level.tab[i]);
      for (var j=0; j<inFile.Body.level.tab[i].tab.length; j++){
        const Level1=new classOutTabLevel1;
        outFile.Body.level.tab[i].tab.push(Level1);
        outFile.Body.level.tab[i].tab[j]=copyData(inFile.Body.level.tab[i].tab[j],outFile.Body.level.tab[i].tab[j]);
        for (var k=0; k<inFile.Body.level.tab[i].tab[j].tab.length; k++){
          const Level2=new classOutTabLevel2;
          outFile.Body.level.tab[i].tab[j].tab.push(Level2);
          outFile.Body.level.tab[i].tab[j].tab[k]=copyData(inFile.Body.level.tab[i].tab[j].tab[k],outFile.Body.level.tab[i].tab[j].tab[k]);
          for (var l=0; l<inFile.Body.level.tab[i].tab[j].tab[k].tab.length; l++){
            const Level3=new classOutTabLevel3;
            outFile.Body.level.tab[i].tab[j].tab[k].tab.push(Level3);
            outFile.Body.level.tab[i].tab[j].tab[k].tab[l]=copyData(inFile.Body.level.tab[i].tab[j].tab[k].tab[l],outFile.Body.level.tab[i].tab[j].tab[k].tab[l]);
            for (var m=0; m<inFile.Body.level.tab[i].tab[j].tab[k].tab[l].tab.length; m++){
              const Level4=new classOutTabLevel4;
              outFile.Body.level.tab[i].tab[j].tab[k].tab[l].tab.push(Level4);
              outFile.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m]=copyData(inFile.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m],outFile.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m]);
            }
          }
        }
      }
    }
    return outFile;
}