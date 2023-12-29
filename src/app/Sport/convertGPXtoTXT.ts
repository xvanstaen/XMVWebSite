
import {classFileSport, classPointOfRef, classNewLoop, classCircuitRec, classFilePerf,classWorkCircuit, classTabPoR, classTotalLoop, classCountryPoR, classHeaderFileSport} from './classSport';
import { classGarminGoldenCheetah } from '../classGarminGoldenCheetah';
export function fromGPXtoTXT(event:any){


const trkpt ='<trkpt';
const lat='lat=\"';
const lon='lon="';
const ele='ele>';
const strTime='time>'
const heart='ns3:hr>';
var trouve=false;
var myGPXFile:Array<any>=[];
var myGPXtxt:string='';
myGPXFile.splice(0,myGPXFile.length);
var strGPX=event.text;
var strLen=strGPX.length;
var prevTime=0;
while (strLen>0){

  var sTrkpt=strGPX.indexOf(trkpt);
  if (sTrkpt!==-1){
    var eTrkpt=strGPX.indexOf('</trkpt>');
    var strSearch=strGPX.substring(sTrkpt,eTrkpt);
    myGPXFile.push({lat:0,lon:0,ele:0,heart:0,time:'',elapse:0, cumulElapse:0});
    var start=strSearch.indexOf(lat) + lat.length;
    var end=strSearch.indexOf('\" lon=\"');
    myGPXFile[myGPXFile.length-1].lat=strSearch.substring(start,end);
    myGPXtxt=myGPXtxt+strSearch.substring(start,end)+"\t";
  
    const strLon=strSearch.substring(end);
    start=strLon.indexOf(lon) + lon.length;
    end=strLon.indexOf('\">\n');
    myGPXFile[myGPXFile.length-1].lon=strLon.substring(start,end);
    myGPXtxt=myGPXtxt+strLon.substring(start,end)+"\t";

    start=strSearch.indexOf(ele) + ele.length;
    end=strSearch.indexOf('</'+ele);
    myGPXFile[myGPXFile.length-1].ele=strSearch.substring(start,end);
    myGPXtxt=myGPXtxt+strSearch.substring(start,end)+"\t";

    start=strSearch.indexOf(heart) + heart.length;
    end=strSearch.indexOf('</'+heart);
    myGPXFile[myGPXFile.length-1].heart=strSearch.substring(start,end);
    myGPXtxt=myGPXtxt+strSearch.substring(start,end)+"\t";
  
    start=strSearch.indexOf('<'+strTime) + strTime.length + 1;
    end=strSearch.indexOf('</'+strTime);
    myGPXFile[myGPXFile.length-1].time=strSearch.substring(start,end);
    myGPXtxt=myGPXtxt+strSearch.substring(start,end)+"\t";

    start=myGPXFile[myGPXFile.length-1].time.indexOf('T') +  1;
    end=myGPXFile[myGPXFile.length-1].time.indexOf('.000Z');

    const Thour=Number(myGPXFile[myGPXFile.length-1].time.substring(start,start+2));
    const Tmn=Number(myGPXFile[myGPXFile.length-1].time.substring(start+3,start+5));
    const Tsec=Number(myGPXFile[myGPXFile.length-1].time.substring(start+6,start+8));
    
    if (myGPXFile.length>1){
      myGPXFile[myGPXFile.length-1].elapse=(Thour)*3600+Tmn*60+Tsec - prevTime;
      myGPXFile[myGPXFile.length-1].cumulElapse=myGPXFile[myGPXFile.length-2].cumulElapse+myGPXFile[myGPXFile.length-1].elapse;
    } else {
      myGPXFile[myGPXFile.length-1].elapse=0;
      myGPXFile[myGPXFile.length-1].cumulElapse==0;
    }
    myGPXtxt=myGPXtxt+myGPXFile[myGPXFile.length-1].cumulElapse+"\r\n";
    prevTime = Thour*3600+Tmn*60+Tsec;


    strGPX=strGPX.substring(eTrkpt+8);
    strLen=strGPX.length;
  } else {
    strLen=0;
  }
}
    return ({theTXT:myGPXtxt,theFile:myGPXFile});
}