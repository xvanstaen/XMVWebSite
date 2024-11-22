import { classMainFile , classTabLevel0, classTabLevel1, classTabLevel2, classTabLevel3, classTabLevel4} from "./exportClassMasterCONFIG";
import { classMainOutFile , classOutTabLevel0, classOutTabLevel1, classOutTabLevel2, classOutTabLevel3, classOutTabLevel4} from "./exportClassMasterCONFIG";
import { processDetails, copyDetails, removeSpecChar } from "./commonFns"


export function onJSONtoXML(mainJSON:classMainOutFile, partial:boolean){
  var iDet=0;
  const maxChar = 22;
  const minChar = "      ";
  const spaceChar=" ";
  const quote = '"';
  const stdStartQuote='=\"';
  const stdEndQuote='\"';
  const newStartQuote="=\'";
  const newEndQuote="\'";
  var startQuote=stdStartQuote;
  var endQuote=stdEndQuote;

  var theRecord="\r\n" + mainJSON.Header.verXML+"\r\n"+mainJSON.Header.tagConfig+
    "\r\n\t" + mainJSON.Header.tagConfSec + 
    "\r\n\t\t" + mainJSON.Header.section.tag ;
    
    for (var iField=0; iField<mainJSON.Header.section.fields.length; iField++){
      theRecord=theRecord+mainJSON.Header.section.fields[iField].name + '=\"' +
      mainJSON.Header.section.fields[iField].type + '\" ';
    }

    theRecord=theRecord + mainJSON.Header.section.endTag +
    "\r\n\t" + mainJSON.Header.endTagConfSec +
    "\r\n\t" + mainJSON.Header.comments +
    "\r\n\t" + mainJSON.Header.domCollect+
    "\r\n\t\t" + mainJSON.Header.domConfigs;
  var levelStr=["\r\n\t\t\t","\r\n\t\t\t\t","\r\n\t\t\t\t\t","\r\n\t\t\t\t\t\t","\r\n\t\t\t\t\t\t\t"] ;
  var theSpace="";

  for (var i=0; i<mainJSON.Body.level.tab.length; i++){
    if (partial===false || (partial===true && (mainJSON.Body.level.tab[i].display===true || 
      (i>0 && mainJSON.Body.level.tab[i-1].display===true && mainJSON.Body.level.tab[i].type==="T")))){
      theRecord = theRecord + levelStr[0] + mainJSON.Body.level.tab[i].name;
      for (iDet=0; iDet<mainJSON.Body.level.tab[i].details.length; iDet++){
        if (mainJSON.Body.level.tab[i].details[iDet].V.indexOf(quote)!==-1){
            startQuote=newStartQuote;
            endQuote=newEndQuote;
        }
        theRecord = theRecord + " " + mainJSON.Body.level.tab[i].details[iDet].F + startQuote +
        mainJSON.Body.level.tab[i].details[iDet].V + endQuote;
        if (startQuote===newStartQuote){
            startQuote=stdStartQuote;
            endQuote=stdEndQuote;
        }
        if (mainJSON.Body.level.tab[i].details[iDet].nl===true){
          theRecord = theRecord + levelStr[0];
        }
      }
      if (mainJSON.Body.level.tab[i].details.length===iDet  && iDet>0){
        theRecord = theRecord+'>'
      }
      for (var j=0; j<mainJSON.Body.level.tab[i].tab.length; j++){
        theRecord = theRecord + levelStr[1] + mainJSON.Body.level.tab[i].tab[j].name;
        
        if (mainJSON.Body.level.tab[i].tab[j].name.length>maxChar){
          theSpace=minChar;
        } else {
          theSpace="";
          for (var iPas=0; iPas < mainJSON.Body.level.tab[i].tab[j].name.length && iPas < maxChar; iPas++){
            theSpace = theSpace + spaceChar;
          }
        }
        
        for (iDet=0; iDet<mainJSON.Body.level.tab[i].tab[j].details.length; iDet++){  
          if (mainJSON.Body.level.tab[i].tab[j].details[iDet].V.indexOf(quote)!==-1){
            startQuote=newStartQuote;
            endQuote=newEndQuote;
          }
          theRecord = theRecord + " " + mainJSON.Body.level.tab[i].tab[j].details[iDet].F + startQuote +
          mainJSON.Body.level.tab[i].tab[j].details[iDet].V + endQuote;
          if (startQuote===newStartQuote){
            startQuote=stdStartQuote;
            endQuote=stdEndQuote;
          }
          if (mainJSON.Body.level.tab[i].tab[j].details[iDet].nl===true){
            theRecord = theRecord + levelStr[1] + theSpace;
          }
        }
        if (mainJSON.Body.level.tab[i].tab[j].details.length===iDet  && iDet>0 && mainJSON.Body.level.tab[i].tab[j].type!=="T"){
          theRecord = theRecord+'>'
        }
        for (var k=0; k<mainJSON.Body.level.tab[i].tab[j].tab.length; k++){
          theRecord = theRecord + levelStr[2] + mainJSON.Body.level.tab[i].tab[j].tab[k].name;
          if (mainJSON.Body.level.tab[i].tab[j].tab[k].name.length>maxChar){
            theSpace=minChar;
          } else {
            theSpace="";
            for (var iPas=0; iPas < mainJSON.Body.level.tab[i].tab[j].tab[k].name.length && iPas < maxChar; iPas++){
              theSpace = theSpace + spaceChar;
            }
          }
          for (iDet=0; iDet<mainJSON.Body.level.tab[i].tab[j].tab[k].details.length; iDet++){
            if (mainJSON.Body.level.tab[i].tab[j].tab[k].details[iDet].V.indexOf(quote)!==-1){
              startQuote=newStartQuote;
              endQuote=newEndQuote;
            }
            theRecord = theRecord + " " + mainJSON.Body.level.tab[i].tab[j].tab[k].details[iDet].F + startQuote +
            mainJSON.Body.level.tab[i].tab[j].tab[k].details[iDet].V + endQuote;
            if (startQuote===newStartQuote){
              startQuote=stdStartQuote;
              endQuote=stdEndQuote;
            }
            if (mainJSON.Body.level.tab[i].tab[j].tab[k].details[iDet].nl===true){
              theRecord = theRecord + levelStr[2] + theSpace;
            }
          }
          if (mainJSON.Body.level.tab[i].tab[j].tab[k].details.length===iDet  && iDet>0  && mainJSON.Body.level.tab[i].tab[j].tab[k].type!=="T"){
            theRecord = theRecord+'>'
          }
          for (var l=0; l<mainJSON.Body.level.tab[i].tab[j].tab[k].tab.length; l++){
            theRecord = theRecord + levelStr[3] + mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].name;
            if (mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].name.length>maxChar){
              theSpace=minChar;
            } else {
              theSpace="";
              for (var iPas=0; iPas < mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].name.length && iPas < maxChar; iPas++){
                theSpace = theSpace + spaceChar;
              }
            }
            for (iDet=0; iDet<mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].details.length; iDet++){
              if (mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].details[iDet].V.indexOf(quote)!==-1){
                startQuote=newStartQuote;
                endQuote=newEndQuote;
              }
              theRecord = theRecord + " " + mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].details[iDet].F + startQuote +
              mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].details[iDet].V + endQuote;
              if (startQuote===newStartQuote){
                startQuote=stdStartQuote;
                endQuote=stdEndQuote;
              }
              if (mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].details[iDet].nl===true){
                theRecord = theRecord + levelStr[3] + theSpace;
              }
            }
            if (mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].details.length===iDet && iDet>0){
              theRecord = theRecord+mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].type;
            }

            for (var m=0; m<mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab.length; m++){
              theRecord = theRecord + levelStr[4] + mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].name;
              if (mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].name.length>maxChar){
                theSpace=minChar;
              } else {
                theSpace="";
                for (var iPas=0; iPas < mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].name.length && iPas < maxChar; iPas++){
                  theSpace = theSpace + spaceChar;
                }
              }
              for (iDet=0; iDet<mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].details.length; iDet++){
                if (mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].details[iDet].nlBefore===false){
                  if (mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].details[iDet].V.indexOf(quote)!==-1){
                    theRecord = theRecord + " " + mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].details[iDet].F + "=\'" +
                    mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].details[iDet].V + "\'";
                  } else {
                    theRecord = theRecord + " " + mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].details[iDet].F + '=\"' +
                      mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].details[iDet].V + '\"';
                  }
                } else {
                  if (mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].details[iDet].V.indexOf(quote)!==-1){
                    theRecord = theRecord + levelStr[4] + theSpace + mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].details[iDet].F + "=\'" +
                      mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].details[iDet].V + "\'";
                  } else {
                    theRecord = theRecord + levelStr[4] + theSpace + mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].details[iDet].F + '=\"' +
                      mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].details[iDet].V +  '\"';
                  }
                }
                if (mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].details[iDet].nl===true){
                  theRecord = theRecord + levelStr[4] + theSpace;
                }
              }
              if (mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].details.length===iDet  && iDet>0){
                theRecord = theRecord+mainJSON.Body.level.tab[i].tab[j].tab[k].tab[l].tab[m].type;
              }
            }
          }    
        }
      }
    }
  }

  // finalise the trailer
theRecord=theRecord +  "\r\n\t\t"+ mainJSON.Trailer.domConfigs +
    "\r\n\t" + mainJSON.Trailer.domCollect + 
    "\r\n" + mainJSON.Trailer.tagConfig ;


  console.log('process JSON to XML completed');
  return theRecord;
}