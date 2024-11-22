import { classMainFile , classTabLevel0, classTabLevel1, classTabLevel2, classTabLevel3, classTabLevel4} from "./exportClassMasterCONFIG";
import { classMainOutFile , classOutTabLevel0, classOutTabLevel1, classOutTabLevel2, classOutTabLevel3, classOutTabLevel4} from "./exportClassMasterCONFIG";
import { processDetails, copyDetails, removeSpecChar } from "./commonFns"


export function onXMLtoJSON(theRecord:any){

    var mainOutJSON=new classMainOutFile;
    var iLevelJSON:Array<number>=[];

    for (var i=0; i<6; i++){
        iLevelJSON[i]=-1;
    }
    var iTabJSON=[];
    for (var i=0; i<6; i++){
      iTabJSON[i]=-1;
    }
    var startPos=0;
    var endPos=0;
    var startPosDom =0;
    var endPosDom =0;
    var startPosSec=0;
    var endPosSec=0;
    var startPosSubSec=0;
    var endPosSubSec=0;
  
    var mainRecord="";
    var subRecord="";
    var workStr="";
  
    var error="";
    var scriptError="";
  
    const tagMainDomain="<ABDDomainConfigs>";
  
    const tagDomain="<ABDDomainConfig ";
    const endTagDomainD=">";
    const endTagDomain="</ABDDomainConfig>";
    const tagConfigs="<ABDConfigs>";
    const endtagConfigs="</ABDConfigs>";
  
    const startABDConf = "<ABDConfig ";
    const endABDConf = "</ABDConfig>";
  
    const comment="<!--";
    const endComment="-->";
    var startPosCom=0;
    var endPosCom=0;

    var currentLevel = 2;
    
  
  
    startPos=theRecord.indexOf(tagMainDomain);
    if (startPos>-1){
        mainRecord=theRecord.substring(startPos+tagMainDomain.length);
        mainOutJSON.Body.level.name=tagMainDomain;
        mainOutJSON.Body.level.type="T";
    } else {
        error="string "+ tagMainDomain + " not found; check you are processing the right file";
    }

    while (error==="" && mainRecord!==""){ // process all domains
          // search string "<ABDDomainConfig "
          startPosDom=mainRecord. indexOf(tagDomain);
          // search end of the string ">"
          endPos=mainRecord.indexOf(endTagDomainD);
          if (startPosDom > -1 && endPos>startPosDom){
              // =========== LEVEL 0
              
              const class1=new classOutTabLevel0;
              mainOutJSON.Body.level.tab.push(class1);
              iTabJSON[0]=mainOutJSON.Body.level.tab.length-1;
              mainOutJSON.Body.level.tab[iTabJSON[0]].name=tagDomain;
              mainOutJSON.Body.level.tab[iTabJSON[0]].type="F";

              workStr=mainRecord.substring(startPosDom+tagDomain.length,endPos);
              // process the list of fields contained in ABDDomain
              mainOutJSON.Body.level.tab[iTabJSON[0]].details=processDetails(workStr, false, mainOutJSON.Body.level.tab[iTabJSON[0]].details);
              //mainRecord=mainRecord.substring(endPos);
              
              // search </ABDDomainConfig> to ensure there is a closure section. Can then process all the fields
              endPosDom=mainRecord.indexOf(endTagDomain);
              if (endPosDom>-1 && endPosDom>endPos){
                  // select the section to process
                  subRecord = mainRecord.substring(endPos+1, endPosDom+endTagDomain.length);
                  mainRecord=mainRecord.substring(endPosDom+endTagDomain.length+1);
                  // =========== LEVEL 1
                  iTabJSON[1]=-1;
                  iTabJSON[2]=-1;
                  iTabJSON[3]=-1;
                  iTabJSON[4]=-1;
                  currentLevel=0
                  while (subRecord!=="" && error===""){
                        // search <ABDConfigs>
                        startPosCom=subRecord.indexOf(comment);
                        endPosCom=subRecord.indexOf(endComment);
                        startPosSec=subRecord.indexOf(tagConfigs);
                        endPosSec=subRecord.indexOf(endtagConfigs);

                        startPosSubSec=subRecord.indexOf(startABDConf);
                        endPosSubSec=subRecord.indexOf(endABDConf);

                        if ((startPosSec>-1 && endPosSec > startPosSec) && (startPosSubSec==-1 || (startPosSubSec>-1 && startPosSubSec > startPosSec))
                              && ((startPosCom===-1 || startPosCom>startPosSec))  ){
                            // <ABDConfigs> found and at the beginning of the string of char.

                            const classB=new classOutTabLevel1;
                            mainOutJSON.Body.level.tab[iTabJSON[0]].tab.push(classB);

                            iTabJSON[1]=mainOutJSON.Body.level.tab[iTabJSON[0]].tab.length-1;
                            currentLevel=1;
      
                            mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].name=tagConfigs;
                            mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].type="T";

                            subRecord=subRecord.substring(startPosSec+tagConfigs.length+1);
                            iTabJSON[2]=-1;
                        } else if ((startPosCom>-1 && endPosCom > startPosCom) && (startPosSubSec==-1 || (startPosSubSec>-1 && startPosSubSec > startPosCom)) ){
                          // comment is found
                            if (currentLevel===1){
                              const classB=new classOutTabLevel1;
                              mainOutJSON.Body.level.tab[iTabJSON[0]].tab.push(classB);

                              iTabJSON[1]=mainOutJSON.Body.level.tab[iTabJSON[0]].tab.length-1;
                              mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].name=subRecord.substring(startPosCom,endPosCom+endComment.length);
                              //mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].name=removeSpecChar(mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].name);
                              mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].type="C";
                            } else {
                              const classD= new classOutTabLevel2;
                              mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab.push(classD);

                              iTabJSON[2]=mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab.length-1;
                              mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].name=subRecord.substring(startPosCom,endPosCom+endComment.length);
                              //mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].name=removeSpecChar(mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].name);
                              mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].type="C";
                            }
                            
                            subRecord=subRecord.substring(endPosCom+endComment.length+2);
                        } else if (startPosSubSec>-1 && endPosSubSec>startPosSubSec){
                                // =========== LEVEL 2
                                while (subRecord!=="" && error===""){
                                    // search </ABDConfigs>
                                      startPosSubSec=subRecord.indexOf(startABDConf);
                                      endPosSubSec=subRecord.indexOf(endABDConf);
                                      
                                      if (startPosSubSec>-1 && endPosSubSec>startPosSubSec){

                                          currentLevel=2;

                                          const classB=new classOutTabLevel2;
                                          mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab.push(classB);

                                          // =========== LEVEL 2
                                          iTabJSON[2]=mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab.length-1;
                                          endPos=subRecord.substring(startPosSubSec+startABDConf.length).indexOf(">");
                                          workStr=subRecord.substring(startPosSubSec+startABDConf.length,endPos+startPosSubSec+startABDConf.length+1);
                                          // process the list of fields contained in ABDConfig
                                          mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].details=processDetails(workStr,false, mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].details);
                                          
                                          mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].name=startABDConf;
                                          mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].type="F";

                                          var configString=subRecord.substring(endPos+startPosSubSec+startABDConf.length+1,endPosSubSec+endABDConf.length);
                                          subRecord = subRecord.substring(endPosSubSec+endABDConf.length);  
                                          // =========== LEVEL 3
                                          iTabJSON[3]=-1; 
                                          iTabJSON[4]=-1; 
                                          currentLevel=3;
                                          while (configString!=="" && error===""){

                                              // search "<" start tag and ">" or "/>"
                                              // if not "/>" it means that details are provided
                                              const startPosTag=configString.indexOf("<");
                                              var endPosTag=configString.indexOf(">");
                                              const endPosDetail1=configString.indexOf("/>");
                                              var endPosDetail=configString.indexOf(" />");
                                              const endPosDetail2=configString.indexOf('"/>');
                                              const endPosDetail3=configString.indexOf("'/>");

                                              if (endPosDetail===-1 || (endPosDetail!==-1 && endPosDetail1!==-1 && endPosDetail1<endPosDetail)){
                                                  endPosDetail=endPosDetail1;
                                              } 
                                              if (endPosDetail===-1 || (endPosDetail!==-1 && endPosDetail2!==-1 && endPosDetail2<endPosDetail)){
                                                  endPosDetail=endPosDetail2;
                                              } 
                                              if (endPosDetail===-1 || (endPosDetail!==-1 && endPosDetail3!==-1 && endPosDetail3<endPosDetail)){
                                                  endPosDetail=endPosDetail3;
                                              }
                                              
                                              startPosCom=configString.indexOf(comment);
                                              endPosCom=configString.indexOf(endComment);

                                              if (startPosTag>-1 && configString.substring(startPosTag,startPosTag+endABDConf.length)===endABDConf){
                                                  configString="";
                                                  const classA=new classOutTabLevel3;
                                                  
                                                  mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab.push(classA);
                                                  iTabJSON[2]=mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab.length-1;
                                                  mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].name=endABDConf;
                                                  mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].type="T";
                                              } else if (startPosCom>-1 && startPosCom <= startPosTag && endPosCom>startPosCom){
                                                  if (currentLevel===3){

                                                    const classB=new classOutTabLevel3;
                                                    mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab.push(classB);

                                                    iTabJSON[3]=mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab.length-1;
                                                    mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].name=configString.substring(startPosCom,endPosCom+endComment.length+1);                 
                                                    mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].name=removeSpecChar(mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].name);
          
                                                    mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].type="C";  

                                                  } else if (currentLevel===4){

                                                    const classD=new classOutTabLevel4;
                                                    mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].tab.push(classD);

                                                    iTabJSON[4]=mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].tab.length-1;
                                                    mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].tab[iTabJSON[4]].name=configString.substring(startPosCom,endPosCom+endComment.length+1);                 
                                                    mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].tab[iTabJSON[4]].type="C";      
                                                    mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].tab[iTabJSON[4]].name=removeSpecChar(mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].tab[iTabJSON[4]].name);              

                                                  }
                                                  configString = configString.substring(endPosCom+endComment.length+1);

                                              } else if (startPosTag>-1  && endPosTag>startPosTag && (endPosDetail==-1 || endPosTag<endPosDetail)){
                                                  // this is a list of fields attached to the tag
                                                  if (configString.substring(startPosTag,startPosTag+2)==="</"){ // end of a tag
                                                          currentLevel=3;

                                                    } 
                                                    if (currentLevel===3){
                                                      // =========== LEVEL 3
                                                       const classB=new classOutTabLevel3;
                                                        mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab.push(classB);

                                                        iTabJSON[3]=mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab.length-1;
                                                        iTabJSON[4]=-1;
                                                        mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].name=configString.substring(startPosTag,endPosTag+1);
                                                        mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].type="T";
                                                        mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].name=removeSpecChar(mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].name);

                                                        if (configString.substring(startPosTag,startPosTag+2)!=="</"){currentLevel=4;};

                                                        //if (configString.substring(startPosTag,startPosTag+2)==="</"){
                                                        //    currentLevel=2;
                                                        //} // else { currentLevel=2; 

                                                    } else if (currentLevel===4){
                                                      // =========== LEVEL 4 === THIS SHOUD NOT HAPPEN
                                                       const classD=new classOutTabLevel4;
                                                        mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].tab.push(classD);

                                                        iTabJSON[4]=mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].tab.length-1;
                                                        mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].tab[iTabJSON[4]].name=configString.substring(startPosTag,endPosTag+1);
                                                        mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].tab[iTabJSON[4]].type="/>";
                                                        mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].tab[iTabJSON[4]].name=removeSpecChar(mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].tab[iTabJSON[4]].name);
                                                      } else {
                                                      console.log("level seems to be wrong - level=" + currentLevel);
                                                    }
                                                    configString = configString.substring(endPosTag+2);
                                                //    console.log(configString.substring(0,50));  
                                                    
                                              } else if (startPosTag>-1 && endPosDetail>startPosTag){
                                                    workStr=configString.substring(startPosTag,endPosTag+1);
                                                    var found=false;
                                                    var constName='';
                                                    for (var i=startPosTag; i<endPosTag && found===false; i++){
                                                        if (configString.substring(i,i+1)===" "){
                                                          found=true;
                                                          constName=configString.substring(startPosTag,i);
                                                          workStr=configString.substring(i+1,endPosTag-1) + "   ";
                                                        }
                                                    }
                                                    var isNL=false;
                                                    if (constName.indexOf("\r")!==-1 || constName.indexOf("\n")!==-1 || constName.indexOf("\t")!==-1){
                                                        isNL = true;
                                                      constName=removeSpecChar(constName);    
                                                    }
                                                    if (currentLevel<4){
                                                        currentLevel=3;                                                       
                                                        const classB=new classOutTabLevel3;
                                                        mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab.push(classB);

                                                        iTabJSON[3]=mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab.length-1;
                                                        mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].details=processDetails(workStr, isNL, mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].details);
                                                        mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].type="/>";
                                                        mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].name=constName;


                                                    } else if (currentLevel===4){
                                                       const classC=new classOutTabLevel4;
                                                        mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].tab.push(classC);

                                                        iTabJSON[4]=mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].tab.length-1;
                                                        
                                                        mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].tab[iTabJSON[4]].details=processDetails(workStr, isNL, mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].tab[iTabJSON[4]].details);
   
                                                        mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].tab[iTabJSON[4]].name=constName;
                                                        mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].tab[iTabJSON[2]].tab[iTabJSON[3]].tab[iTabJSON[4]].type="/>"

                                                    }
                                                    //console.log(configString.substring(0,50));  
                                                    configString = configString.substring(endPosDetail+3);    
                                                      
                                              } else {
                                                    
                                                    if (configString.substring(0,10).indexOf(">")>-1){
                                                      console.log("first chatacters contain '>'; there's a problem. This character is removed so that process can continue ");
                                                      configString=configString.substring(configString.substring(0,10).indexOf(">")+1);
                                                    } else {
                                                        console.log("CHECK if no more to manage for this " + startABDConf + "  string being analysed is ==> " + configString);
                                                        configString="";
                                                    }
                                              }
                                          } // end of while configString!==""
                                      } else {
                                                                      // check if it's the end of the process endtagConfigs endABDConf
                                            var i=subRecord.indexOf("<");
                                            if (i>-1 && subRecord.substring(i,i+endTagDomain.length)===endTagDomain){
                                              subRecord = subRecord.substring(i+endTagDomain.length+1);
                                              
                                              const classB=new classOutTabLevel1;
                                              mainOutJSON.Body.level.tab.push(classB);
                                              iTabJSON[0]=mainOutJSON.Body.level.tab.length-1;
                                              mainOutJSON.Body.level.tab[iTabJSON[0]].name=endTagDomain;
                                              mainOutJSON.Body.level.tab[iTabJSON[0]].type="T";
                                              currentLevel=-1
                                              
                                            } else if (i>-1 && subRecord.substring(i,i+endtagConfigs.length)===endtagConfigs){
                                              subRecord = subRecord.substring(i+endtagConfigs.length+1);
                                              const classC=new classOutTabLevel2;
                                              mainOutJSON.Body.level.tab[iTabJSON[0]].tab.push(classC);
                                              iTabJSON[1]=mainOutJSON.Body.level.tab[iTabJSON[0]].tab.length-1;
                                              mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].name=endtagConfigs;
                                              mainOutJSON.Body.level.tab[iTabJSON[0]].tab[iTabJSON[1]].type="T";
                                              currentLevel=0
                                            } else {
                                                // check if there is a problem
                                                console.log("check if end of the process is correct - remaining bytes are => " + subRecord);
                                                subRecord="";
                                            }
                                          
                                      }
                                  } // while  

                        } else {

                          console.log("may be an issue to find start or end of tag")
                        }
                  } // wend
              } else {
                console.log('Problem finding </ABDDomainConfig> ');
                console.log('subRecord ==> ' + mainRecord.substring(1,100));
                mainRecord='';
              }

          } else {
           //String RECEIVED  \r\n\t</ABDDomainCollection>\r\n</configuration>"
              if (mainRecord.indexOf("</ABDDomainConfigs")>-1 && mainRecord.indexOf("</ABDDomainCollection")>-1){
                  console.log("Process completed");
              } else {
                  console.log('Pb finding <ABDDomainConfigs>');
                  console.log('subRecord ==> ' + mainRecord.substring(1,100));
                }
                mainRecord='';
          } 

      } // main while
      if (error!==''){
        return error;
      } else if (scriptError!==''){
        return scriptError;
      } else  {
        return mainOutJSON;
      }
  }