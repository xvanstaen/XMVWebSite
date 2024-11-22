
import {Bucket_List_Info} from './JsonServerClass';
export function HTTPget(BooleanTab:Array<number>, i:number){
    const Http = new XMLHttpRequest();
    const url='https://storage.googleapis.com/storage/v1/b/xavier-monica-mariage-00/o';
    
    
    Http.open("GET", url);
    Http.send();
 
    Http.onload = (e) => {
            console.log('myHTTPget: status=',  Http.status, ' readyState=', Http.readyState)
            if (Http.readyState===4 && Http.status===200){
                BooleanTab[i]=1;
                var data=JSON.parse(Http.responseText);
                console.log('data = ',data, '  event1=',BooleanTab[0], '  event1=',BooleanTab[1], '  event1=',BooleanTab[2]);
            }
            if (Http.status!==200){
                console.log('error = ',Http.status);
                BooleanTab[i]=1;
                
            }
            console.log('return event = ',BooleanTab[i]);
            
        }


    Http.onerror=() =>{
        console.log('server error', Http.status);

    }
    Http.onprogress=() =>{
        console.log('process is in progress');

    }
    
 
}



export function theHTTPGet(BooleanTab:Array<number>, i:number, Bucket_Info_Array:Array<Bucket_List_Info>,i_array:number){
    const Http = new XMLHttpRequest();
    const url='https://storage.googleapis.com/storage/v1/b/xavier-monica-mariage-00/o';
    Http.open("GET", url);
    Http.send();
    var eventreceived=false;
    Http.onreadystatechange = (e) => {
        if (Http.readyState===4 && Http.status===200){
            var data=JSON.parse(Http.responseText);
            Bucket_Info_Array[i_array]=data;
            console.log('data = ',data);
            BooleanTab[i]=1;
        }

        if (Http.readyState===4){
            BooleanTab[i]=1;
        }
    }
    
    return(eventreceived);
}
