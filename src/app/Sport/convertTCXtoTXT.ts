

import {classFileSport, classPointOfRef, classNewLoop, classCircuitRec, classFilePerf,classWorkCircuit, classTabPoR, classTotalLoop, classCountryPoR, classHeaderFileSport} from './classSport';
export function fromTCXtoJSON(event:any){
    var perfLaps:Array<any>=[];
    var perf:Array<any>=[];
    const lap='Lap StartTime=\"';
    const timeSec='TotalTimeSeconds>';
    const distMeters='DistanceMeters>';
    const calories='Calories>';
    const maxSpeed='MaximumSpeed>';
    const maxHeartRate='MaximumHeartRateBpm>';
    const avgHeartRate='AverageHeartRateBpm>';
    const heartValue='Value>'
    const track="Trackpoint>";
    const lengthText=event.text.length;
    const zoulou='000Z';
  
    var theStr=event.text;
    var trouve=false;
    var nbLaps=0;
    var iLoop=0;
    var maxLoop=100;
    perfLaps.splice(0,perfLaps.length);
    while (trouve===false && iLoop<maxLoop){
      iLoop++
      const startLap = theStr.indexOf('<'+lap);
      const endLap = theStr.indexOf('</Lap>');
      if (startLap!==-1 && endLap!==-1){
          var strLap = theStr.substring(startLap,endLap);
          perfLaps.push({lap:0,date:"",dist:0,maxSpeed:0,maxHeart:0,avgHeart:0,cal:0});
          nbLaps++
          perfLaps[perfLaps.length-1].lap=nbLaps;
          var sLength=strLap.indexOf(lap)+lap.length;
          var eLength=strLap.indexOf(zoulou)+4;
          perfLaps[perfLaps.length-1].date=strLap.substring(sLength,eLength);
  
          sLength=strLap.indexOf(timeSec)+timeSec.length;
          eLength=strLap.indexOf('</'+timeSec);
          perfLaps[perfLaps.length-1].time=strLap.substring(sLength,eLength);
  
          sLength=strLap.indexOf(calories)+calories.length;
          eLength=strLap.indexOf('</'+calories);
          perfLaps[perfLaps.length-1].cal=strLap.substring(sLength,eLength);
  
          sLength=strLap.indexOf(distMeters)+distMeters.length;
          eLength=strLap.indexOf('</'+distMeters);
          perfLaps[perfLaps.length-1].dist=strLap.substring(sLength,eLength);
  
          sLength=strLap.indexOf(maxSpeed)+maxSpeed.length;
          eLength=strLap.indexOf('</'+maxSpeed);
          perfLaps[perfLaps.length-1].maxSpeed=Number(strLap.substring(sLength,eLength))*3.6;
  
          sLength=strLap.indexOf(avgHeartRate);
          eLength=strLap.indexOf('</'+avgHeartRate);
          var strB=strLap.substring(sLength,eLength);
          sLength=strB.indexOf(heartValue)+heartValue.length;
          eLength=strB.indexOf('</'+heartValue);
          perfLaps[perfLaps.length-1].avgHeart=strB.substring(sLength,eLength);
  
          sLength=strLap.indexOf(maxHeartRate);
          eLength=strLap.indexOf('</'+maxHeartRate);
          strB=strLap.substring(sLength,eLength);
          sLength=strB.indexOf(heartValue)+heartValue.length;
          eLength=strB.indexOf('</'+heartValue);
          perfLaps[perfLaps.length-1].maxHeart=strB.substring(sLength,eLength);
         
  
          for (var i=strLap.length; i>0; i--){
              const startTrack=strLap.indexOf('<'+track);
              const endTrack=strLap.indexOf('</'+track);
              if (startTrack!==-1 && endTrack !==-1){
                  const strTrack=strLap.substring(startTrack,endTrack);
                  perf=processTrackPoint(strTrack,perf);
                  strLap=strLap.substring(endTrack+track.length);
              } else i=0;
  
          }
  
          theStr=theStr.substring(endLap+6);
  
      } else {
        trouve=true;
  
        
      }
    }
return({theLaps:perfLaps,thePerf:perf })

}

export function processTrackPoint(theString:string, perf:any){
    var tabLabels=['Time>','LatitudeDegrees>','LongitudeDegrees>','AltitudeMeters>','DistanceMeters>','Value>','ns3:Speed>']
    var tabResults=[];
    // const heart='HeartRateBpm>';
    
    for (var i=0; i<tabLabels.length; i++){
      const start=theString.indexOf('<'+tabLabels[i]) + tabLabels[i].length;
      const end=theString.indexOf('</'+tabLabels[i]);
      tabResults[i]=theString.substring(start+1,end);
    }
    const thePerf=new classFilePerf;
    //perf.push({time:'',dist:0,speed:0,heart:0,alt:0,lat:0,lon:0,slope:0});
    perf.push(thePerf);
    perf[perf.length-1].time=tabResults[0];
    perf[perf.length-1].lat=Number(tabResults[1]);
    perf[perf.length-1].lon=Number(tabResults[2]);
    perf[perf.length-1].alt=Number(tabResults[3]);
    perf[perf.length-1].dist=Number(tabResults[4]);
    perf[perf.length-1].heart=Number(tabResults[5]);
    if (Number(tabResults[6])*3.6===0 && perf.length>1){
        perf[perf.length-1].speed=(perf[perf.length-1].dist-perf[perf.length-2].dist)*100*3.6;
    } else {
        perf[perf.length-1].speed=Number(tabResults[6])*3.6;
    }
    
  
    if (perf.length>1){
        perf[perf.length-1].slope=(perf[perf.length-2].alt-perf[perf.length-1].alt)/(perf[perf.length-2].dist-perf[perf.length-1].dist)*100;
    }
  
    return (perf);
  }