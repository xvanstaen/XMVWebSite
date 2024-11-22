import { removeSpecChar, removeChar } from "./commonFns";

export class classParamFiles{
    name:string="";
    bucket:string="";
    server:string="";
  }
  
  export class classFilterParam{
    tag:string="";
    field:string="";
  }

  export class classTabReplace{
    tag:string="";
    old:string="";
    new:string="";
  }

export function searchFn(str:string, scriptFn:any, refFn:number){
    for (var i=0; i<scriptFn.length && refFn===-1; i++){
        if (scriptFn[i]===str){
          return i;
          // find the next command
        }
    }
    return refFn;
}

export function fnExtractParam(str:string, tabFields:any, dom:string, specChar:string){
    var returnTab:Array<string>=[];
    var scriptError="";
    var eField=0;
    var sField=0;
    var iTab=-1;
    for (var i=0; i<tabFields.length; i++){
      sField=str.indexOf(tabFields[i]);
  
      if (sField===-1){
        return ({tab:returnTab,err:"parameters of " + dom + "  are incorrect - refer to " + str});
      } 
      eField=str.substring(sField+tabFields[i].length).indexOf(specChar);
  
      if (eField===-1 ){
          return({tab:returnTab,err:"parameters of " + dom + " are incorrect - refer to " + str});
      } 
      iTab++
      returnTab[iTab]=str.substring(sField+tabFields[i].length,sField+tabFields[i].length+eField);
      if (i===tabFields.length-1){
        str=str.substring(sField+tabFields[i].length+eField+1);
        sField=str.indexOf(tabFields[0]);
        if (sField!==-1){
          i=-1;
        }
      }
    }
    if (returnTab.length!==0){
        return {tab:returnTab,err:""};
    } else {
        return {tab:returnTab,err:"Something is wrong with process " + dom};
    }
  }

export function fnProcessScript(modifiedScriptContent:string, isMainJson:boolean, mainOutJSON:any, scriptFn:any, domainTabParam:any, selectTabParam:any, filterTabParam:any, replaceTabParam:any){
    var workStr= modifiedScriptContent+"        ";
    const startComment="<!--";
    const endComment="-->";
    const separa="<#";
    var status=0;
    var iDomain=-1;
    var iSpace=0;
    var endParam=0;
    var scriptError="";
    var selectTabData:Array<string>=[];
      // remove all comments and special character
    var sPos=workStr.indexOf(startComment);
    var ePos=workStr.indexOf(endComment);
    if (isMainJson===true){
      while (sPos>-1 && scriptError===""){
          if (ePos==-1 || ePos<sPos){
              scriptError="Error with your comments; must be <!-- .... --!>"
          } else {
            workStr=workStr.substr(0,sPos) + workStr.substring(ePos+endComment.length+1)
          }
          sPos=workStr.indexOf(startComment);
          ePos=workStr.indexOf(endComment);
      }
      // search all functions
      //workStr=removeSpecChar(workStr);
      //workStr=removeChar(workStr,"\n");
      sPos=workStr.indexOf(separa);
      while (sPos>-1 && scriptError===""){
        var refFn=-1;
        iSpace=workStr.substring(sPos).indexOf(" ");
        if (iSpace >-1 ) {
            refFn = searchFn(workStr.substring(sPos,sPos+iSpace+1).toLowerCase(), scriptFn, refFn);
            if (refFn!==-1){ // get the parameters of this functions
                endParam=workStr.substring(sPos+separa.length).indexOf(separa)+separa.length;
                if (endParam===separa.length-1){
                    endParam=workStr.substring(sPos+separa.length).length;
                }
                
                if (refFn===0){
                    const response=onDomainParam(workStr.substring(sPos+separa.length,endParam), domainTabParam, mainOutJSON);
                    if (typeof response === 'string'){
                       return ({record:mainOutJSON,errMsg:response, status:400}); 
                    } else {
                        if (response.status===0){
                          mainOutJSON=response.record;
                          iDomain=response.iDom;
                        } else {
                          return ({record:mainOutJSON,errMsg:response.errMsg, status:400});
                        }
                        
                    }
                } else if (refFn===1 && iDomain!==-1){
                    const response=onSelectParam(workStr.substring(sPos+separa.length,endParam), mainOutJSON, selectTabParam,iDomain)
                    if (typeof response === 'string'){
                      scriptError = scriptError +  response;
                    } else {
                      mainOutJSON=response;
                    }
                } else if (refFn===2 && iDomain!==-1){
                    const response=onReplaceParam(workStr.substring(sPos+separa.length,endParam), replaceTabParam, mainOutJSON,iDomain)
                    if (typeof response === 'string'){
                      scriptError = scriptError +  response;
                    } else {
                        mainOutJSON=response;
                    }
                } else if (refFn===3 && iDomain!==-1){
                    const response=onFilterParam(workStr.substring(sPos+separa.length,endParam),filterTabParam, mainOutJSON,iDomain)
                    if (response.status === 400){
                        scriptError = scriptError + response.errMsg
                    } else {
                        mainOutJSON=response.record;
                    }
                } 
                workStr=workStr.substring(endParam);
              } else {
                scriptError=scriptError + "Function does not exist " + workStr.substring(sPos,iSpace+2);
              }
        } else {
            scriptError=" start of function found but following space not found. Script is stopped";
            status=400;
        }
        sPos=workStr.indexOf(separa);
        }
    } else {
        scriptError="Retrieve a script file";
        status=400;
    }

    return ({record:mainOutJSON,errMsg:scriptError, status:status});

}

export function selectDomain(field:string, value:string, mainOutJSON:any){
  const specChar='"';
  const tagDomain="<ABDDomainConfig ";
  var iDomain=-1;
  for (var i=0; i<mainOutJSON.Body.level.tab.length; i++){
      mainOutJSON.Body.level.tab[i].display=false;
      for (var iDet=0; iDet<mainOutJSON.Body.level.tab[i].details.length; iDet++){
        if (mainOutJSON.Body.level.tab[i].details[iDet].F===field && 
            mainOutJSON.Body.level.tab[i].details[iDet].V===value){
            //mainOutJSON.Body.level.tab[i].details[iDet].display=true;
            mainOutJSON.Body.level.tab[i].display=true;
            iDomain=i;
        } else {
            //mainOutJSON.Body.level.tab[i].details[iDet].display=false;
        }
      }
    }
  var status=0;
  var errMsg="";
  if (iDomain===-1){
    status=400;
    errMsg="DOmain is not found";

  }
  return ({record:mainOutJSON, iDom:iDomain, status:status, errMsg:errMsg});
}

export function onFilterParam(str:string, filterTabParam=Array, mainOutJSON:any, iDomain:number){
    var scriptError='';
    const specChar='"';
    var allLev2:boolean=true;
    var allLev3:boolean=true;
    var allLev4:boolean=true;
    var found:boolean=false;
    var workStr=str;
    var selectTabData:Array<string>=[];
    const ABDConf="<ABDConfig ";
    var tabFields:Array<string[]>=[];
    var filterTabTag=[];
    var iFilter=-1;
    while (workStr.trim()!==""){
        var startTab=workStr.indexOf("[");
        var endTab=workStr.indexOf("]");
        if (startTab===-1 || endTab===-1 || endTab<=startTab){
          if (workStr.length<10){

          } else {
            scriptError=" pb with the format of the <filter function - string = " + workStr;
          }
          workStr="";
        } else {
          // find the parameters
          var data = fnExtractParam(workStr.substring(startTab+1, endTab), filterTabParam,"Filter",specChar);
          if (data.err !== ""){
            scriptError=data.err;
            workStr="";
          } else {
              iFilter++
              filterTabTag[iFilter]=data.tab[0];
              var j=iFilter * 2 + 1;
              var theFields:Array<string>=[];
              theFields=extractFields(data.tab[1],theFields);
              tabFields[iFilter]=[];
              for (j=0; j<theFields.length; j++){
                tabFields[iFilter][j]=theFields[j];
              }
              workStr=workStr.substring(endTab+2);
          }
        }
    }

    var i = iDomain;
    for (var j=0; j<mainOutJSON.Body.level.tab[i].tab.length; j++){ // <ABDConfigs>
        for (var k=0; k<mainOutJSON.Body.level.tab[i].tab[j].tab.length; k++){ // <ABDConfig ...........>
            found=false;
            if (mainOutJSON.Body.level.tab[i].tab[j].tab[k].display===true){
                // check if this tag must be kept as displayable
                for (iFilter=0; iFilter<filterTabTag.length && mainOutJSON.Body.level.tab[i].tab[j].tab[k].name!==filterTabTag[iFilter]; iFilter++){};
                if (iFilter===filterTabTag.length){
                  mainOutJSON.Body.level.tab[i].tab[j].tab[k].display=false; // remove from the display
                } else { // check with elements to keep for the display
                  for (var iDet=0; iDet<mainOutJSON.Body.level.tab[i].tab[j].tab[k].details.length; iDet++){ 
                    for (var iField=0; iField<tabFields[iFilter].length && mainOutJSON.Body.level.tab[i].tab[j].tab[k].details[iDet].F!==tabFields[iFilter][iField]; iField++){}
                    if (iField===tabFields[iFilter].length){
                        mainOutJSON.Body.level.tab[i].tab[j].tab[k].details[iDet].display=false;
                    } else {
                        mainOutJSON.Body.level.tab[i].tab[j].tab[k].details[iDet].display=true;
                    }
                  }
                                // filter now levels 3 and 4
                  for (var l=0; l<mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab.length; l++){
                    for (iFilter=0; iFilter<filterTabTag.length && mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].name!==filterTabTag[iFilter]; iFilter++){};
                    if (iFilter===filterTabTag.length){
                      mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].display=false; // remove from the display
                    } else {
                      for (var iDet=0; iDet<mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].details.length; iDet++){ 
                        for (var iField=0; iField<tabFields[iFilter].length && mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].details[iDet].F!==tabFields[iFilter][iField]; iField++){}
                        if (iField===tabFields[iFilter].length){
                            mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].details[iDet].display=false;
                        } else {
                            mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].details[iDet].display=true;
                        }
                      }
                      for (var m=0; l<mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab.length; m++){
                        for (iFilter=0; iFilter<filterTabTag.length && mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].name!==filterTabTag[iFilter]; iFilter++){};
                        if (iFilter===filterTabTag.length){
                          mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].display=false; // remove from the display
                        } else {
                          for (var iDet=0; iDet<mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].details.length; iDet++){ 
                            for (var iField=0; iField<tabFields[iFilter].length && mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].details[iDet].F!==tabFields[iFilter][iField]; iField++){}
                            if (iField===tabFields[iFilter].length){
                                mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].details[iDet].display=false;
                            } else {
                                mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].details[iDet].display=true;
                            }
                          }
                        }
                      }
                    }
                  }
                }
            }
        }
    }

    if (filterTabTag.length>0){
        return ({record:mainOutJSON, status:0,errMsg:scriptError});
    } else {
        return ({record:mainOutJSON,status:400,errMsg:scriptError});
    }
  }

export function extractFields(subStr:any, tabFields:any){
    var j=-1;
    while(subStr!==""){
      var jPos=subStr.substring(0).indexOf(",");
      j=j+1;
      if (jPos>-1){
        tabFields[j]=subStr.substring(0,jPos).trim();;
        subStr=subStr.substring(jPos+1);
      } else {
        tabFields[j]=subStr.substring(0).trim();
        subStr="";
      }
    }
    return tabFields;
}

export function onSelectParam(str:string, mainOutJSON:any, selectTabParam:any, iDomain:number){
    var scriptError="";
    const specChar='"';
    var data = fnExtractParam(str,selectTabParam,"Select",specChar);
    if (data.err !== ""){
      return data.err;
    } 
    if (data.tab[0]!=="<ABDConfig "){
      return ' value of the tag must be "<ABDConfig " - update your script'
    }
    // iDomain is the selected domain
    // find the selected tag
    var found=false;
    for (var j=0; j<mainOutJSON.Body.level.tab[iDomain].tab.length; j++){ // <ABDConfigs>
      for (var k=0; k<mainOutJSON.Body.level.tab[iDomain].tab[j].tab.length; k++){ // <ABDConfig ...........>
        found=false;
        if (mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].name===data.tab[0]){
            for (var iDet=0; iDet<mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].details.length && 
                    mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].details[iDet].F!==data.tab[1]; iDet++){}
            if (iDet<mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].details.length){
              // check if the value corresponds
              if (data.tab[3].trim()==="" && mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].details[iDet].V.indexOf(data.tab[2])!==-1){
                mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].display=true;
                displayTwoLowerLevels(mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k], true);
                found=true;
              } else if (data.tab[3].trim()!==""){
                 if (((mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].details[iDet].V.substring(0,data.tab[3].length)<=data.tab[3])) &&
                    (mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].details[iDet].V.substring(0,data.tab[2].length)>=data.tab[2])){
                      mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].display=true;
                      displayTwoLowerLevels(mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k], true);
                      found=true;
                } 
              }
          }
        }
        if (found===true){
          mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].display=true;
          for (var iDet=0; iDet<mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].details.length; iDet++){
            mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].details[iDet].display=true;
          } 
        } else {
          mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].display=false;
        }

      }
    }
    return mainOutJSON;
}

function displayTwoLowerLevels(level2Tab:any, value:boolean){
  for (var l=0; l<level2Tab.tab.length; l++){
    level2Tab.tab[l].display=value;
    for (var iDet=0; iDet<level2Tab.tab[l].details.length; iDet++){
      level2Tab.tab[l].details[iDet].display=value;
    } 
    for (var m=0; m<level2Tab.tab[l].tab.length; m++){
      level2Tab.tab[l].tab[m].display=value;
      for (var iDet=0; iDet<level2Tab.tab[l].tab[m].details.length; iDet++){
        level2Tab.tab[l].tab[m].details[iDet].display=value;
      } 
    }
  }
  return level2Tab;
}

export function onReplaceParam(str:string, selectTabReplace:any, mainOutJSON:any, iDomain:number){
    var specChar='"';
    var myValTab:Array<string>=[];
    var found=false;
    var data = fnExtractParam(str,selectTabReplace,"Replace",specChar);
    var tabValue:Array<classTabReplace>=[];
    var tabChangeParam=["tag:'","old:'","new:'"];
    const totalFields=4;
    if (data.err !== ""){
      return data.err;
    } 
    myValTab=data.tab;
    specChar="'";


    for (var iData=0; iData<data.tab.length; iData=iData+totalFields){
      var theValues = fnExtractParam(data.tab[iData+totalFields-1],tabChangeParam,"extract values for Replace", specChar);
      if (theValues.err !== ""){
        return theValues.err;
      } 
      var j=-1;
      tabValue=[];
      for (var i=0; i<theValues.tab.length;i++){
        j++;
        const theClass=new classTabReplace;
        tabValue.push(theClass)
        tabValue[j].tag=theValues.tab[i];
        i++;
        tabValue[j].old=theValues.tab[i];
        i++;
        tabValue[j].new=theValues.tab[i];
      }
        // find the appropriate tag and items
        var iTag=iDomain;        
              for (var jTag=0; jTag<mainOutJSON.Body.level.tab[iTag].tab.length; jTag++){
                if (mainOutJSON.Body.level.tab[iTag].tab[jTag].type!=="C" && mainOutJSON.Body.level.tab[iTag].tab[jTag].name.indexOf(data.tab[iData])!==-1){
                  found=findTag(mainOutJSON.Body.level.tab[iTag].tab[jTag].details,data.tab,iData);
                  if (found===true){
                    var result=changeValues(mainOutJSON.Body.level.tab[iTag].tab[jTag].details ,tabValue);
                    mainOutJSON.Body.level.tab[iTag].tab[jTag].details=result.record;
                  }

                } else {
                  for (var kTag=0; kTag<mainOutJSON.Body.level.tab[iTag].tab[jTag].tab.length; kTag++){
                    if (mainOutJSON.Body.level.tab[iTag].tab[jTag].tab[kTag].type!=="C" && mainOutJSON.Body.level.tab[iTag].tab[jTag].tab[kTag].name.indexOf(data.tab[iData])!==-1){
                      found=findTag(mainOutJSON.Body.level.tab[iTag].tab[jTag].tab[kTag].details,data.tab,iData);
                      if (found===true){
                        var result=changeValues(mainOutJSON.Body.level.tab[iTag].tab[jTag].tab[kTag].details ,tabValue);
                        mainOutJSON.Body.level.tab[iTag].tab[jTag].tab[kTag].details=result.record;
                      }
    
                    } else {
                      for (var lTag=0; lTag<mainOutJSON.Body.level.tab[iTag].tab[jTag].tab[kTag].tab.length; lTag++){
                        if (mainOutJSON.Body.level.tab[iTag].tab[jTag].tab[kTag].tab[lTag].type!=="C" && mainOutJSON.Body.level.tab[iTag].tab[jTag].tab[kTag].tab[lTag].name.indexOf(data.tab[iData])!==-1){
                          found=findTag(mainOutJSON.Body.level.tab[iTag].tab[jTag].tab[kTag].tab[lTag].details,data.tab,iData);
                          if (found===true){
                            var result=changeValues(mainOutJSON.Body.level.tab[iTag].tab[jTag].tab[kTag].tab[lTag].details ,tabValue);
                            mainOutJSON.Body.level.tab[iTag].tab[jTag].tab[kTag].tab[lTag].details=result.record;
                          }
        
                        } else {
                          for (var mTag=0; mTag<mainOutJSON.Body.level.tab[iTag].tab[jTag].tab[kTag].tab[lTag].tab.length; mTag++){
                            if (mainOutJSON.Body.level.tab[iTag].tab[jTag].tab[kTag].tab[lTag].tab[mTag].type!=="C" && mainOutJSON.Body.level.tab[iTag].tab[jTag].tab[kTag].tab[lTag].tab[mTag].name.indexOf(data.tab[iData])!==-1){
                              found=findTag(mainOutJSON.Body.level.tab[iTag].tab[jTag].tab[kTag].tab[lTag].tab[mTag].details,data.tab,iData);
                              if (found===true){
                                var result=changeValues(mainOutJSON.Body.level.tab[iTag].tab[jTag].tab[kTag].tab[lTag].tab[mTag].details ,tabValue);
                                mainOutJSON.Body.level.tab[iTag].tab[jTag].tab[kTag].tab[lTag].tab[mTag].details=result.record;
                              }
                            } 
                          }
                        }
                      }                      
                    }
                  }
                }
              }

        // change the value(s)
      //}
    }
    return mainOutJSON;
}


function findTag(tabDetails:any, tabTag:any, iData:number){
  var found=false;
  for (var iDet=0; iDet<tabDetails.length && found===false; iDet++){
      if (tabDetails[iDet].F===tabTag[iData+1] && 
        tabDetails[iDet].V.indexOf(tabTag[iData+2])!==-1){
            found=true;
      } 
  }
  return (found);
}
function changeValues(tabDetails:any, tabValue:any){
  var found=false;
  for (var iDet=0; iDet<tabDetails.length; iDet++){
    for (var iValue=0; iValue<tabValue.length && (tabDetails[iDet].F!==tabValue[iValue].tag || tabValue[iValue].old!==tabDetails[iDet].V); iValue++){}
    if (iValue<tabValue.length){
      tabDetails[iDet].V=tabValue[iValue].new;
      found=true;
    }
  }
  return ({record:tabDetails,found:found})
}

export function onDomainParam(str:string, domainTabParam:any, mainOutJSON:any){
    var scriptError="";
    const specChar='"';
    var domainTabData:Array<string>=[];
    var data = fnExtractParam(str, domainTabParam, "Domain", specChar);
    if (data.err !== ""){
      //scriptError=data;
      return data.err;
    } 
    domainTabData=data.tab;
    const result=selectDomain(domainTabData[0], domainTabData[1], mainOutJSON);
    return result;
}

