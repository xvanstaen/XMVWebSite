
import {classFileSport, classPointOfRef, classNewLoop, classCircuitRec, classFilePerf,classWorkCircuit, classTabPoR, classTotalLoop, classCountryPoR, classHeaderFileSport} from './classSport';
import { formatHHMNSS } from './../MyStdFunctions';

export function fillHeaderFile(inHeader:any,outHeader:any){
    outHeader.circuit=inHeader.circuit;
    outHeader.codeName =inHeader.codeName;
    outHeader.fileType=inHeader.fileType;
    outHeader.name=inHeader.name;
    outHeader.sport=inHeader.sport;
    outHeader.theDate=inHeader.theDate;
    if (inHeader.refPoints!==undefined){
      outHeader.refPoints=inHeader.refPoints;
    } else {
      outHeader.refPoints=[];
    }
    return(outHeader);
  }

  export function   updateTabPor(filePerf:any){
    var tabPerfPoR:Array<classTabPoR>=[]
    //tabPerfPoR.splice(0,tabPerfPoR.length);
      for (var i=0; i<filePerf.length; i++){
        if (filePerf[i].refPoR!==""){
          const theClass=new classTabPoR;
          tabPerfPoR.push(theClass);
          tabPerfPoR[tabPerfPoR.length-1].recNb=i;
          tabPerfPoR[tabPerfPoR.length-1].content=filePerf[i];
        }      
      }
    return (tabPerfPoR);
  }

  export function copyInitPerf(j:number,k:number,i:number,perfCircuit:any,perfPoR:any){
    perfCircuit[j].newLoop[k].dist=perfPoR[i].content.dist;
    perfCircuit[j].newLoop[k].perfRecordFrom=perfPoR[i].recNb;
    perfCircuit[j].newLoop[k].time=perfPoR[i].content.time;
    perfCircuit[j].newLoop[k].lon=perfPoR[i].content.lon;
    perfCircuit[j].newLoop[k].lat=perfPoR[i].content.lat;
    perfCircuit[j].newLoop[k].exclude=perfPoR[i].content.exclude;
    return (perfCircuit);
  }

  export function createPerfTotal(perfCircuit:any, perfTotalCircuit:any){
    perfTotalCircuit.splice(0,perfTotalCircuit.length);
    perfTotalCircuit.push({newLoop:[]});
    for (var iLoop=0; iLoop<perfCircuit[0].newLoop.length; iLoop++){
      perfTotalCircuit[0].newLoop.push({dist:0, theTime:0, speed:0, strTime:"", from:"",to:""});
      perfTotalCircuit=reinitTotal(iLoop, perfCircuit, perfTotalCircuit);
    }
    return (perfTotalCircuit);
  }

  export function reinitTotal(jLoop:number, perfCircuit:any, perfTotalCircuit:any){
    var theLoop=0;
    perfTotalCircuit[0].newLoop[jLoop].dist=0;
    perfTotalCircuit[0].newLoop[jLoop].theTime=0;
    for (theLoop=0; theLoop<perfCircuit.length; theLoop++){
      if (jLoop<perfCircuit[theLoop].newLoop.length){
          if (perfCircuit[theLoop].newLoop[jLoop].exclude ==="" && perfCircuit[theLoop].newLoop[jLoop].dist!==0){
            perfTotalCircuit[0].newLoop[jLoop].dist = perfTotalCircuit[0].newLoop[jLoop].dist + perfCircuit[theLoop].newLoop[jLoop].dist;
            perfTotalCircuit[0].newLoop[jLoop].theTime = perfTotalCircuit[0].newLoop[jLoop].theTime + perfCircuit[theLoop].newLoop[jLoop].theTime;
          }
      }
    }
    perfTotalCircuit[0].newLoop[jLoop].strTime = formatHHMNSS(perfTotalCircuit[0].newLoop[jLoop].theTime);
    perfTotalCircuit[0].newLoop[jLoop].speed = perfTotalCircuit[0].newLoop[jLoop].dist * 1000 / perfTotalCircuit[0].newLoop[jLoop].theTime * 3.6;
    return (perfTotalCircuit);
}
  

export function   copyInOut(inFile:any, outFile:any){
    for (var i=0; i<inFile.length; i++){
      const theClass = {newLoop:[]};
      outFile.push(theClass);
      for (var j=0; j<inFile[i].newLoop.length; j++){
        const classLoop=new classNewLoop;
        outFile[i].newLoop.push(classLoop);
        outFile=copyLegInOut(inFile,outFile,i,j);
      }
    }
    return (outFile);
  }

export function copyLegInOut(inFile:any, outFile:any, iLeg:number,jLoop:number){
    outFile[iLeg].newLoop[jLoop].dist=inFile[iLeg].newLoop[jLoop].dist;
    outFile[iLeg].newLoop[jLoop].exclude=inFile[iLeg].newLoop[jLoop].exclude;
    outFile[iLeg].newLoop[jLoop].from=inFile[iLeg].newLoop[jLoop].from;
    outFile[iLeg].newLoop[jLoop].to=inFile[iLeg].newLoop[jLoop].to;
    outFile[iLeg].newLoop[jLoop].loop=inFile[iLeg].newLoop[jLoop].loop;
    outFile[iLeg].newLoop[jLoop].loopDel=inFile[iLeg].newLoop[jLoop].loopDel;
    outFile[iLeg].newLoop[jLoop].perfRecordFrom=inFile[iLeg].newLoop[jLoop].perfRecordFrom;
    outFile[iLeg].newLoop[jLoop].perfRecordTo=inFile[iLeg].newLoop[jLoop].perfRecordTo;
    outFile[iLeg].newLoop[jLoop].speed=inFile[iLeg].newLoop[jLoop].speed;
    outFile[iLeg].newLoop[jLoop].strTime=inFile[iLeg].newLoop[jLoop].strTime;
    outFile[iLeg].newLoop[jLoop].theTime=inFile[iLeg].newLoop[jLoop].theTime;
    outFile[iLeg].newLoop[jLoop].loopDel=inFile[iLeg].newLoop[jLoop].loopDel;
    return (outFile);
  }

export function copyLoopInOut(inFile:any, outFile:any, jLoop:number){
    for (var i=0; i<inFile.length; i++){
      outFile=copyLegInOut(inFile,outFile,i,jLoop);
    }
    return (outFile);
  }

