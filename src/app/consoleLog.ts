
import { msgConsole } from './JsonServerClass';
export function msginLogConsole(msg:string, myConsole:Array<msgConsole>, myLogConsole:boolean, SaveConsoleFinished:boolean, HTTP_Address:string,type:string){
    console.log(msg);
    let theMSG=new msgConsole;

    const myTime=new Date();
    const myDate= myTime.toString().substring(4,26);
    //const thetime=myDate+myTime.getTime().toString();
    if (myLogConsole===true){
            //myConsole.push('');
            //myConsole[myConsole.length-1]='<==> '+thetime.substr(0,20) + ' ' +msg;
            myConsole.push(theMSG)
            myConsole[myConsole.length-1].msg=msg;
            myConsole[myConsole.length-1].timestamp=myDate;
  
    }
    if (myConsole.length>500 || SaveConsoleFinished===true){
            saveLogConsole(myConsole, type, HTTP_Address);
    }
       
  }



export function saveLogConsole(LogConsole:Array<msgConsole>, type:string, HTTP_Address:string){
    const Http = new XMLHttpRequest();
    const myTime=new Date();
    var myDate= myTime.toString().substring(4,26);
    var thetime=myDate+myTime.getTime().toString();
    const consoleLength=LogConsole.length;
    var SaveConsoleFinished=false;

    // this.HTTP_Address=this.Google_Bucket_Access_RootPOST + this.Google_Bucket_Name + "/o?name=" + this.Google_Object_Name   + '&uploadType=media';
   
  
    Http.open('POST',HTTP_Address+thetime.substr(0,20)+  type + '.json&uploadType=media')
    Http.setRequestHeader("Content-Type", "application/json");
    Http.send(JSON.stringify(LogConsole));
    //Http.send(LogConsole);
    Http.onload = (e) => {
   // Http.onreadystatechange = (e) => {
        console.log('####POST result=',Http);
       if (Http.readyState===4 && Http.status===200){
            SaveConsoleFinished=true;
            if (LogConsole.length===consoleLength){
                LogConsole.splice(0,LogConsole.length);
            }
            else {
                for (let i=consoleLength; i>0; i--){
                    LogConsole.splice(i-1,1);
                }
            }
            let theMSG=new msgConsole;
            LogConsole.push(theMSG)
            LogConsole[LogConsole.length-1].msg='Log Console ' + type + ' has been deleted at '+myDate;
            LogConsole[LogConsole.length-1].timestamp=myDate;

            //LogConsole.push('');
            //LogConsole[LogConsole.length-1]='Log Console ' + type + ' has been deleted at '+myDate;
            //return(LogConsole);   
        }     
    } 
    //Http.onprogress=() =>{
    //    console.log('process is in progress ',Http);
    //}
        
  }