import { removeSpecChar, removeChar } from "../kiosk-abd-config/commonFns";
import { classSubConf, classReplace, classFilterParam, classChangeField, classDataScript } from "./classScriptFns";

export class classFnParam{
  val:string="";
  cond:string="";
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

export function convertScriptToJson(modifiedScriptContent:string,  scriptFn:any){
  const domainTabParam:Array<classFnParam>=[{val:'field="',cond:'M'},{val:'value="',cond:'M'}];
  const selectTabParam:Array<classFnParam>=[{val:'tag="',cond:'M'},{val:'field="',cond:'M'}, {val:'fromValue="',cond:'M'}, {val:'toValue="',cond:'O'}];
  const filterTabParam:Array<classFnParam>=[{val:'tag="',cond:'M'},{val:'subTag="',cond:'O'},{val:'field="',cond:'O'} ];
  const replaceTabParam:Array<classFnParam>=[{val:'tag="',cond:'M'},{val:'refField="',cond:'M'},{val: 'withValue="',cond:'M'},{val:'changeField="',cond:'M'}];
  var dataScript=new classDataScript;
  var workStr= modifiedScriptContent+"        ";
  const startComment="<!--";
  const endComment="-->";
  const separa="<#";
  var iDomain=-1;
  var iSpace=0;
  var endParam=0;
  var scriptError="";

  var theStatus=200;

  var sPos=workStr.indexOf(startComment);
  var ePos=workStr.indexOf(endComment);
  while (sPos>-1 && scriptError===""){
      if (ePos==-1 || ePos<sPos){
          return({tab:dataScript,msg:"Error with your comments; must be <!-- .... --!>", status:400})
      } else {
          workStr=workStr.substr(0,sPos) + workStr.substring(ePos+endComment.length+1)
      }
      sPos=workStr.indexOf(startComment);
      ePos=workStr.indexOf(endComment);
  }
  // search all functions
  sPos=workStr.indexOf(separa);
   while (sPos>-1 ){
    var refFn=-1;
    iSpace=workStr.substring(sPos).indexOf(" ");
    if (iSpace >-1 ) {
        refFn = searchFn(workStr.substring(sPos,sPos+iSpace+1).toLowerCase(), scriptFn, refFn);
        if (refFn!==-1){ // get the parameters of this function
            endParam=workStr.substring(sPos+separa.length).indexOf(separa)+separa.length;
            if (endParam===separa.length-1){
                endParam=workStr.substring(sPos+separa.length).length;
            }
            if (refFn===0){
                const response = onDomainParam(workStr.substring(sPos+separa.length,endParam), domainTabParam);
                if (typeof response === 'string'){
                  theStatus=400;
                  return ({record:dataScript,errMsg:response, status:400}); 
                } else {
                  dataScript.dom.field=response[0];
                  dataScript.dom.value=response[1];
                }
                
            } else if (refFn===1 ){
                const specChar='"';
                var data = fnExtractParam(workStr.substring(sPos+separa.length,endParam),selectTabParam,"Select",specChar);
                if (data.err !== ""){
                  theStatus=400;
                  scriptError=scriptError+data.err + '--- '
                  //return({tab:dataScript,msg:data.err, status:400})

                } else {
                  dataScript.select.tag=data.tab[0];
                  dataScript.select.field=data.tab[1];
                  dataScript.select.fromValue=data.tab[2];
                  dataScript.select.toValue=data.tab[3];
                }
                if (data.tab[0]!=="<ABDConfig "){
                  theStatus=400;
                  scriptError=scriptError+' value of the tag must be "<ABDConfig " - update your script' + '--- '
                  //return({tab:dataScript,msg:' value of the tag must be "<ABDConfig " - update your script', status:400})
                } 
                
            } else if (refFn===2 ){
                const response=extractFilter(workStr.substring(sPos+separa.length,endParam), dataScript, filterTabParam);
                if (response.status !== 200){
                  theStatus=400;
                  scriptError=scriptError + response.msg + " --";
                  //return({tab:response.tab,msg:response.msg, status:400})
                } 
                //dataScript.filter=response.tab.filter;
            } else if (refFn===3 ){
              const response=fnExtractReplace(dataScript,workStr.substring(sPos+separa.length,endParam), replaceTabParam);
              if (response.status !== 200){
                  theStatus=400;
                  scriptError=scriptError + response.msg + " --";
                  //return({tab:response.tab,msg:response.msg, status:400})
                } 
              //dataScript.replace=response.tab.replace;
            } 
            workStr=workStr.substring(endParam);
        } else {
            scriptError=scriptError + "Function does not exist " + workStr.substring(sPos,iSpace+2);
            return({tab:dataScript,msg:scriptError, status:400})
        }
    } else {
        scriptError=" start of function found but following space not found. Script is stopped";
        return({tab:dataScript,msg:scriptError, status:400})
     }
     sPos=workStr.indexOf(separa);
  }

  return({tab:dataScript, msg:scriptError, status:theStatus})
}


function extractFilter(str:string, dataScript:classDataScript, filterTabParam:any){
  var scriptError='';
  const specChar='"';
  var workStr=str;
  const ABDConf="<ABDConfig ";
  while (workStr.trim()!==""){
    var startTab=workStr.indexOf("[");
    var endTab=workStr.indexOf("]");
    if (startTab===-1 || endTab===-1 || endTab<=startTab){
      if (workStr.length>25 && workStr.indexOf("#>")>25){
        scriptError=" pb with the format of the <filter function - string = " + workStr;
        return ({tab:dataScript,msg:scriptError,status:400})
      }
      workStr="";
    } else {
      // find the parameters
      var data = fnExtractParam(workStr.substring(startTab+1, endTab), filterTabParam,"Filter",specChar);
      if (data.err !== ""){
        scriptError=data.err;
        workStr="";
        return ({tab:dataScript,msg:data.err,status:400})
      } else {
          if (ABDConf===data.tab[0]){
            dataScript.filter.tagConf=data.tab[0];
            dataScript.filter.fieldConf=extractFields(data.tab[2],dataScript.filter.fieldConf);
          } else {
            const filterA=new classSubConf;
            dataScript.filter.subConf.push(filterA);
            dataScript.filter.subConf[dataScript.filter.subConf.length-1].tag=data.tab[0];
            dataScript.filter.subConf[dataScript.filter.subConf.length-1].subTag=data.tab[1];
            dataScript.filter.subConf[dataScript.filter.subConf.length-1].field=extractFields(data.tab[2],dataScript.filter.subConf[dataScript.filter.subConf.length-1].field);
          }
          workStr=workStr.substring(endTab+2);
      }
    }
  }
  return ({tab:dataScript,msg:"",status:200})
}

function fnExtractReplace(dataScript:classDataScript,str:string,selectTabReplace:any ){
  var specChar='"';
  var myValTab:Array<string>=[];
  var data = fnExtractParam(str,selectTabReplace,"Replace",specChar);
  var tabChangeParam=[{val:"tag:'",cond:'M'},{val:"old:'",cond:'M'},{val:"new:'",cond:'M'}];
  const totalFields=4;
  if (data.err !== ""){
    return ({tab:dataScript,msg:data.err,status:400});
  } 
  myValTab=data.tab;
  specChar="'";


  for (var iData=0; iData<data.tab.length; iData=iData+totalFields){
    var theValues = fnExtractParam(data.tab[iData+totalFields-1],tabChangeParam,"extract values for Replace", specChar);
    if (theValues.err !== ""){
      return ({tab:dataScript,msg:theValues.err,status:400});
    } 
    var j=-1;
    const replace=new classReplace;
    dataScript.replace.push(replace);
    dataScript.replace[dataScript.replace.length-1].tag=data.tab[iData];
    dataScript.replace[dataScript.replace.length-1].refField=data.tab[iData + 1];
    dataScript.replace[dataScript.replace.length-1].withValue=data.tab[iData + 2];
    for (var i=0; i<theValues.tab.length;i++){
      j++;
      const change=new classChangeField;
      dataScript.replace[dataScript.replace.length-1].changeField.push(change);
      dataScript.replace[dataScript.replace.length-1].changeField[j].tag=theValues.tab[i];
      i++;
      dataScript.replace[dataScript.replace.length-1].changeField[j].old=theValues.tab[i];
      i++;
      dataScript.replace[dataScript.replace.length-1].changeField[j].new=theValues.tab[i];
    }
  }
  return ({tab:dataScript,msg:"",status:200});
}

export function fnExtractParam(str:string, tabFields:any, fn:string, specChar:string){
  var returnTab:Array<string>=[];
  var eField=0;
  var sField=0;
  var iTab=-1;
  for (var i=0; i<tabFields.length; i++){
    sField=str.indexOf(tabFields[i].val);
  
    if (sField===-1 && tabFields[i].cond==="M"){
      return ({tab:returnTab,err:"parameter " + tabFields[i].val + " of '" + fn + "'  is missing - refer to " + str});
    } 
    if (sField!==-1){
      eField=str.substring(sField+tabFields[i].val.length).indexOf(specChar);
  
      if (eField===-1 ){
          return({tab:returnTab,err:"End tag missing for " + tabFields[i].val + " of " + fn + " - refer to " + str});
      } 
      iTab++
      returnTab[iTab]=str.substring(sField+tabFields[i].val.length,sField+tabFields[i].val.length+eField);
      if (i===tabFields.length-1){
        str=str.substring(sField+tabFields[i].val.length+eField+1);
        sField=str.indexOf(tabFields[0].val);
        if (sField!==-1){
          i=-1;
        }
      }
    } else if (sField===-1 && tabFields[i].cond==="O"){
      iTab++
      returnTab[iTab]="";
    }
  }
  if (returnTab.length!==0){
      return {tab:returnTab,err:""};
  } else {
       return {tab:returnTab,err:"Something is wrong with process related to " + fn};
  }
}

export function fnProcessScript(dataScript:classDataScript, mainOutJSON:any){
    var iDomain=0;
    var response=selectDomain(dataScript, mainOutJSON);
    if (response.status !== 200){
        return ({record:mainOutJSON,errMsg:response.errMsg, status:400}); 
    } 
    mainOutJSON=response.record;
    iDomain=response.iDom;
    if (dataScript.select.tag!==""){
      mainOutJSON=onProcessSelect(dataScript, mainOutJSON, iDomain);
    }
    if (dataScript.filter.tagConf !=="" && dataScript.filter.subConf.length>0){
      mainOutJSON=onProcessFilter(dataScript, mainOutJSON, iDomain);
    }
    if (dataScript.replace.length>0 && dataScript.replace[0].changeField.length>0 && 
      dataScript.replace[0].tag!=="" && dataScript.replace[0].changeField[0].tag!==""){
      mainOutJSON=onProcessReplace(dataScript, mainOutJSON,iDomain);
    }
    return ({record:mainOutJSON,errMsg:"", status:200});
}

export function onDomainParam(str:string, domainTabParam:any){
  const specChar='"';
  var data = fnExtractParam(str, domainTabParam, "Domain", specChar);
  if (data.err !== ""){
    return data.err;
  } 
  return data.tab;
}

export function selectDomain(dataScript:classDataScript, mainOutJSON:any){
  const tagDomain="<ABDDomainConfig ";
  var iDomain=-1;
  for (var i=0; i<mainOutJSON.Body.level.tab.length; i++){
      mainOutJSON.Body.level.tab[i].disp=false;
      for (var iDet=0; iDet<mainOutJSON.Body.level.tab[i].det.length; iDet++){
        if (mainOutJSON.Body.level.tab[i].det[iDet].F===dataScript.dom.field && 
            mainOutJSON.Body.level.tab[i].det[iDet].V===dataScript.dom.value){
            //mainOutJSON.Body.level.tab[i].det[iDet].disp=true;
            mainOutJSON.Body.level.tab[i].disp=true;
            iDomain=i;
        } 
      }
    }
  var status=200;
  var errMsg="";
  if (iDomain===-1){
    status=400;
    errMsg="Domain is not found";

  }
  return ({record:mainOutJSON, iDom:iDomain, status:status, errMsg:errMsg});
}



export function onProcessFilter(dataScript:classDataScript, mainOutJSON:any,  iDomain:number){
    const ABDConf="<ABDConfig ";
    var iFilter=-1;
    var found=false;

    var i = iDomain;
    for (var j=0; j<mainOutJSON.Body.level.tab[i].tab.length; j++){ // <ABDConfigs>
        for (var k=0; k<mainOutJSON.Body.level.tab[i].tab[j].tab.length; k++){ // <ABDConfig ...........>
            found=false;
            if (mainOutJSON.Body.level.tab[i].tab[j].tab[k].disp===true){
                // check if this tag must be kept as displayable
                //for (iFilter=0; iFilter<dataScript.filter.length && mainOutJSON.Body.level.tab[i].tab[j].tab[k].name.trim()!==dataScript.filter[iFilter].tag.trim(); iFilter++){};
                //if (iFilter===dataScript.filter.length){
                if (mainOutJSON.Body.level.tab[i].tab[j].tab[k].name.trim()!==dataScript.filter.tagConf.trim()){
                  mainOutJSON.Body.level.tab[i].tab[j].tab[k].disp=false; // remove from the display
                } else { // check with elements to keep for the display
                  for (var iDet=0; iDet<mainOutJSON.Body.level.tab[i].tab[j].tab[k].det.length; iDet++){ 
                    for (var iField=0; iField<dataScript.filter.fieldConf.length && mainOutJSON.Body.level.tab[i].tab[j].tab[k].det[iDet].F.trim()!==dataScript.filter.fieldConf[iField].trim(); iField++){}
                    if (iField===dataScript.filter.fieldConf.length){
                        mainOutJSON.Body.level.tab[i].tab[j].tab[k].det[iDet].disp=false;
                    } else {
                        mainOutJSON.Body.level.tab[i].tab[j].tab[k].det[iDet].disp=true;
                    }
                  }
                                // filter now levels 3 and 4
                  for (var l=0; l<mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab.length; l++){
                    for (iFilter=0; iFilter<dataScript.filter.subConf.length && mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].name.trim()!==dataScript.filter.subConf[iFilter].tag.trim(); iFilter++){};
                    if (iFilter===dataScript.filter.subConf.length){
                      mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].disp=false; // remove from the display
                    } else {
                      if (dataScript.filter.subConf[iFilter].subTag===""){
                        for (var iDet=0; iDet<mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].det.length; iDet++){ 
                          for (var iField=0; iField<dataScript.filter.subConf[iFilter].field.length && mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].det[iDet].F.trim()!==dataScript.filter.subConf[iFilter].field[iField].trim(); iField++){}
                          if (iField===dataScript.filter.subConf[iFilter].field.length){
                              mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].det[iDet].disp=false;
                          } else {
                              mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].det[iDet].disp=true;
                          }
                        }
                      }
                      else {
                        for (var m=0; m<mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab.length; m++){
                          for (iFilter=0; iFilter<dataScript.filter.subConf.length && mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].name.trim()!==dataScript.filter.subConf[iFilter].subTag.trim(); iFilter++){};
                          if (iFilter===dataScript.filter.subConf.length){
                            mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].disp=false; // remove from the display
                          } else {
                            for (var iDet=0; iDet<mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].det.length; iDet++){ 
                              for (var iField=0; iField<dataScript.filter.subConf[iFilter].field.length && mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].det[iDet].F.trim()!==dataScript.filter.subConf[iFilter].field[iField].trim(); iField++){}
                              if (iField===dataScript.filter.subConf[iFilter].field.length){
                                  mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].det[iDet].disp=false;
                              } else {
                                  mainOutJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].det[iDet].disp=true;
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
    }


    //return ({record:mainOutJSON,status:200,errMsg:""});
    return mainOutJSON;
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

export function onProcessSelect(dataScript:classDataScript, mainOutJSON:any, iDomain:number){
    var found=false;
    for (var j=0; j<mainOutJSON.Body.level.tab[iDomain].tab.length; j++){ // <ABDConfigs>
      for (var k=0; k<mainOutJSON.Body.level.tab[iDomain].tab[j].tab.length; k++){ // <ABDConfig ...........>
        found=false;
        if (mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].name.trim()===dataScript.select.tag.trim()){
            for (var iDet=0; iDet<mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].det.length && 
                    mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].det[iDet].F.trim()!==dataScript.select.field.trim(); iDet++){}
            if (iDet<mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].det.length){
              // check if the value corresponds
              if (dataScript.select.toValue.trim()==="" && mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].det[iDet].V.indexOf(dataScript.select.fromValue)!==-1){
                mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].disp=true;
                displayTwoLowerLevels(mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k], true);
                found=true;
              } else if (dataScript.select.toValue.trim()!==""){
                 if (((mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].det[iDet].V.substring(0,dataScript.select.toValue.length)<=dataScript.select.toValue)) &&
                    (mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].det[iDet].V.substring(0,dataScript.select.fromValue.length)>=dataScript.select.fromValue)){
                      mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].disp=true;
                      displayTwoLowerLevels(mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k], true);
                      found=true;
                } 
              }
          }
        }
        if (found===true){
          mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].disp=true;
          for (var iDet=0; iDet<mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].det.length; iDet++){
            mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].det[iDet].disp=true;
          } 
        } else {
          mainOutJSON.Body.level.tab[iDomain].tab[j].tab[k].disp=false;
        }

      }
    }
    return mainOutJSON;
}

function displayTwoLowerLevels(level2Tab:any, value:boolean){
  for (var l=0; l<level2Tab.tab.length; l++){
    level2Tab.tab[l].disp=value;
    for (var iDet=0; iDet<level2Tab.tab[l].det.length; iDet++){
      level2Tab.tab[l].det[iDet].disp=value;
    } 
    for (var m=0; m<level2Tab.tab[l].tab.length; m++){
      level2Tab.tab[l].tab[m].disp=value;
      for (var iDet=0; iDet<level2Tab.tab[l].tab[m].det.length; iDet++){
        level2Tab.tab[l].tab[m].det[iDet].disp=value;
      } 
    }
  }
  return level2Tab;
}

export function onProcessReplace(dataScript:classDataScript, mainOutJSON:any, iDomain:number){

    var found=false;

    for (var iData=0; iData<dataScript.replace.length; iData++){

        // find the appropriate tag and items
        // ckeck if values in iDomain must be changed
        if (dataScript.replace[iData].tag==="Domain" ){ // this is just to be sure that the same domain has been selected
            var result=changeValues(mainOutJSON.Body.level.tab[iDomain].det ,dataScript.replace[iData].changeField);
            mainOutJSON.Body.level.tab[iDomain].det=result.record;
          // }
        }
        else {
        
              for (var jTag=0; jTag<mainOutJSON.Body.level.tab[iDomain].tab.length; jTag++){
                if (mainOutJSON.Body.level.tab[iDomain].tab[jTag].type!=="C" && mainOutJSON.Body.level.tab[iDomain].tab[jTag].name.indexOf(dataScript.replace[iData].tag)!==-1){
                  found=findTag(mainOutJSON.Body.level.tab[iDomain].tab[jTag].det, dataScript.replace[iData]);
                  if (found===true){
                    var result=changeValues(mainOutJSON.Body.level.tab[iDomain].tab[jTag].det ,dataScript.replace[iData].changeField);
                    mainOutJSON.Body.level.tab[iDomain].tab[jTag].det=result.record;
                  }

                } else {
                  for (var kTag=0; kTag<mainOutJSON.Body.level.tab[iDomain].tab[jTag].tab.length; kTag++){
                    if (mainOutJSON.Body.level.tab[iDomain].tab[jTag].tab[kTag].type!=="C" && mainOutJSON.Body.level.tab[iDomain].tab[jTag].tab[kTag].name.indexOf(dataScript.replace[iData].tag)!==-1){
                      found=findTag(mainOutJSON.Body.level.tab[iDomain].tab[jTag].tab[kTag].det,dataScript.replace[iData]);
                      if (found===true){
                        var result=changeValues(mainOutJSON.Body.level.tab[iDomain].tab[jTag].tab[kTag].det ,dataScript.replace[iData].changeField);
                        mainOutJSON.Body.level.tab[iDomain].tab[jTag].tab[kTag].det=result.record;
                      }
    
                    } else {
                      for (var lTag=0; lTag<mainOutJSON.Body.level.tab[iDomain].tab[jTag].tab[kTag].tab.length; lTag++){
                        if (mainOutJSON.Body.level.tab[iDomain].tab[jTag].tab[kTag].tab[lTag].type!=="C" && mainOutJSON.Body.level.tab[iDomain].tab[jTag].tab[kTag].tab[lTag].name.indexOf(dataScript.replace[iData].tag)!==-1){
                          found=findTag(mainOutJSON.Body.level.tab[iDomain].tab[jTag].tab[kTag].tab[lTag].det,dataScript.replace[iData]);
                          if (found===true){
                            var result=changeValues(mainOutJSON.Body.level.tab[iDomain].tab[jTag].tab[kTag].tab[lTag].det ,dataScript.replace[iData].changeField);
                            mainOutJSON.Body.level.tab[iDomain].tab[jTag].tab[kTag].tab[lTag].det=result.record;
                          }
        
                        } else {
                          for (var mTag=0; mTag<mainOutJSON.Body.level.tab[iDomain].tab[jTag].tab[kTag].tab[lTag].tab.length; mTag++){
                            if (mainOutJSON.Body.level.tab[iDomain].tab[jTag].tab[kTag].tab[lTag].tab[mTag].type!=="C" && mainOutJSON.Body.level.tab[iDomain].tab[jTag].tab[kTag].tab[lTag].tab[mTag].name.indexOf(dataScript.replace[iData].tag)!==-1){
                              found=findTag(mainOutJSON.Body.level.tab[iDomain].tab[jTag].tab[kTag].tab[lTag].tab[mTag].det,dataScript.replace[iData]);
                              if (found===true){
                                var result=changeValues(mainOutJSON.Body.level.tab[iDomain].tab[jTag].tab[kTag].tab[lTag].tab[mTag].det ,dataScript.replace[iData].changeField);
                                mainOutJSON.Body.level.tab[iDomain].tab[jTag].tab[kTag].tab[lTag].tab[mTag].det=result.record;
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
        // change the value(s)
      //}
    }
    return mainOutJSON;
}


function findTag(tabDetails:any, tab:any){
  var found=false;
  for (var iDet=0; iDet<tabDetails.length && found===false; iDet++){
      if (tabDetails[iDet].F===tab.refField && 
        tabDetails[iDet].V.indexOf(tab.withValue)!==-1){
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



