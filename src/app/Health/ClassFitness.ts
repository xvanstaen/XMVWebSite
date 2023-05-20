
export class ConfigFitness{
    fileType:string='';
    user_id: string='';
    firstname:string='';
    lastname:string='';
    TabSport:Array<any>=[{name:''}];
    TabActivity:Array<any>=[{name:''}];
    TabExercise:Array<any>=[{name:''}];
    TabUnits:Array<any>=[{name:''}];
    TabPerfType:Array<any>=[{name:''}];
    TabPerfUnit:Array<any>=[{name:''}];
    ListSport:Array<any>=[
    {
        sportName:'',         // workout, running,cycling etc.
        activityName:[],  // shoulder, leg, intervals, abs, cardio, insanity
        activityExercise:[], //push up
        activityUnit:[],  // Weigtht (kg, lbs),  Time (sec, min, hr)
                          // Speed/Pace (km/h, min/km), Quantity 
        activityPerf:[],  // Avg Pace; Avg Moving Pace; Avg Speed; Avg Moving Speed; Total time; Total Moving time
        activityPerfUnit:[],// Time (sec, min, hr), Distance (m, km)
    }];  
  }
  
  
  export class ConfigSport{
    sportName:string='';         // workout, running,cycling etc.
    activityName:Array<string>=[];  // shoulder, leg, intervals, abs
    activityExercise:Array<string>=[]; //push up
    activityUnit:Array<string>=[];  // Weigtht (kg, lbs),  Time (sec, min, hr)
    activityPerf:Array<string>=[];  // avg space
    activityPerfUnit:Array<string>=[];  // Distance (m, km), Speed (km/h), Quantity                 
  }
  
  export class PerformanceFitness{
    user_id: number=0;
    firstname:string='';
    lastname:string='';
    Sport:Array<any>=[
        {
        Sport_name:'', // workout, running, etc.
        Sport_date: new Date(),
        exercise:[{
          Activity_name:'', // part of the body: shoulder, leg, type of running exercise such as intervals, tour
          ActivityExercise: //                                    Running
                [{
                  Exercise_name:'', // 20, 50                     50
                  Exercise_unit:'', // kg, sec, min, km           km
                  seance:[{nb:0}], 
                  Result:[{perf_type:'',perf:'',unit:''}],
                // perf_type = Avg Pace; Avg Moving Pace; Avg Speed; Avg Moving Speed; Total time; Total Moving time
                // {perf_type:'Total time',perf:'51:46',unit:''}
              }]
              }]
            }]
        }


  export class ClassResult{
    perf_type:string='';
    perf:string='';
    unit:string='';
  }
  
  export class ClassSport{
    Sport_name:string=''; // workout, running, etc.
    Sport_date= new Date();
    exercise:Array<any>=[{
      Activity_name:'', // part of the body: shoulder, leg, type of running exercise such as fraction
      ActivityExercise:
            [{
              Exercise_name:'', // 20kg, 20s
              Exercise_unit:'', // kg, sec, m
              seance:[{nb:0}],
              Result:[{perf_type:'',perf:'',unit:''}],
            }]
          }]
        }
  
  export class ClassActivity{
    Activity_name:string=''; // part of the body: shoulder, leg, type of running exercise such as fraction
    ActivityExercise:Array<any>=
          [{
            Exercise_name:'', // 20kg, 20s
            Exercise_unit:'', // kg, sec, m
            seance:[{nb:0}],
            Result:[{perf_type:'',perf:'',unit:''}],
          }]
  }
  
  export class ClassExercise{
          Exercise_name:string=''; // 20kg, 20s
          Exercise_unit:string=''; // kg, sec, m
          seance:Array<any>=[{nb:0}];
          Result:Array<any>=[{perf_type:'',perf:'',unit:''}];
  }
  
  export class BigData{
    sport:string='';
    thedate=new Date();
    activity:string='';
    exercise:string='';
    unit:string='';
    seance:Array<any>=[{nb:0}];
    result=new ClassResult;
    id:number=0;
  } 


  export class CmyEvent{
  idString:string=''; // format e.g lspo-1
  dialogueNb:number=0; // value of current Dialogue
  target=new Ctarget;
  }

  export class Ctarget{
    id:string='';
    value:string='';
    textContent:string='';
  }

export class CreturnedData{
  valueNb:number=0;
  valueString:string='';  // value returned by DropDown
  fieldNb:number=0;      // in reference to dialogue[]
  fieldType:string='';
  idString:string='';  // sort or filter
}


  