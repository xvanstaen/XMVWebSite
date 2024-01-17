  import { Component, OnInit, ViewChild, AfterViewInit,SimpleChanges,
              Output, Input, HostListener, EventEmitter } from '@angular/core';
  import { Injectable } from '@angular/core';
  import { HttpClient, HttpErrorResponse } from "@angular/common/http";
  import { Router, RouterModule } from '@angular/router';
  import { Subscription, Observable } from 'rxjs';
  import { FileSaverModule } from 'ngx-filesaver';
  import { FormGroup, FormControl, Validators } from '@angular/forms';
  import { TopicURL } from '../../JsonServerClass';

@Component({
  selector: 'app-manage-url-topic',
  templateUrl: './manage-url-topic.component.html',
  styleUrls: ['./manage-url-topic.component.css']
})
export class ManageUrlTopicComponent implements OnInit {

  constructor(private router:Router, private http: HttpClient) {}
  myForm = new FormGroup({
    delete:new FormControl('',{nonNullable: true}),
    id:new FormControl('',{nonNullable: true}),
    topic: new FormControl('',{nonNullable: true}),
    url: new FormControl('',{nonNullable: true})
  });

  AngularWebSite:Array<TopicURL>=[];
   
  DataServer=new TopicURL;
    
  Record_Created=false;
  InitialStatus:Array<any>=[];

  Create_Record:boolean=false;
  httpError:string='';
  
  UpdateTable:boolean=false;
  HTTPstring:string='';
  JsonServer:string='';
  i:number=0;

  Length_Array:number=0; // total number of records

  ngOnInit(): void {
    this.Record_Created=false;
    this.HTTPstring='http://localhost:3000/myTopicsURL/';
    
    // get the first item to know the size of the table which is stored in element '.topic'
    // first parameter is id to retrive in JsonServer and seecond parameter is occurence of array to fill-in 
    this.JsonServer=this.HTTPstring+1;
    this.http.get<any>(this.JsonServer)
      .subscribe(data => {
          this.AngularWebSite[0]=data;
          this.InitialStatus[0]='';
          this.Length_Array=Number(this.AngularWebSite[0].topic);

          // create right size of the array; [0] alreay exists
          for (this.i=0; this.i<this.Length_Array-1; this.i++){
                  this.AngularWebSite.push(this.AngularWebSite[0]);
                  this.InitialStatus.push('');
                }
          // retrieve the entire table
          this.httpError='';
          this.http.get<any>(this.HTTPstring)
              .subscribe(
                    data => {
                    this.AngularWebSite=data;
                  },
                    error=> { this.httpError='error:' + error + ' Server is down';
                    console.log(error);
                  }
                )
        })
    }

  onSave(event:any){
    if (this.UpdateTable===true){
          this.UpdateTable=false;
          if (this.Create_Record ===true){
            // do not consider last created record
            this.Length_Array--
          }
          for (this.i=0; this.i<this.Length_Array; this.i++){
            if (this.InitialStatus[this.i]==='C'){
                this.AngularWebSite[this.i].type='';
                this.Record_Created=true;
              }
          }
          
          for (this.i=0; this.i<this.Length_Array; this.i++){
              if (this.InitialStatus[this.i]!=='C' && this.AngularWebSite[this.i].type!==this.InitialStatus[this.i]){
                // update corresponding record 
                this.JsonServer=this.HTTPstring+this.AngularWebSite[this.i].id;
                this.DataServer=this.AngularWebSite[this.i];
                this.http.put(this.JsonServer,this.DataServer  )
                  .subscribe(res => {
                    console.log('put - update - =',res);
                  })
                  /*** 
                  if (this.AngularWebSite[this.i].id===12){
                    this.JsonServer=this.HTTPstring+'12';
                    this.http.delete(this.JsonServer )
                          .subscribe(res => {
                            console.log('delete - update - =',res);
                            }
                      }

                    // THen update first record
              */
              } else if (this.InitialStatus[this.i]==='C'){
                // create corresponding record
                this.InitialStatus[this.i]='';
                this.DataServer=this.AngularWebSite[this.i];
                this.http.post(this.HTTPstring,this.DataServer )
                  .subscribe(res => {
                    console.log('post - create - =',res);
                  })   
              } 

          }
          if (this.Record_Created===true){
                this.Record_Created=false;
                // update record 0 with total number of records
                this.JsonServer=this.HTTPstring+1;
                this.AngularWebSite[0].topic=this.Length_Array.toString();
                //this.AngularWebSite[0].url='';
                //this.AngularWebSite[0].type='';
                //this.AngularWebSite[0].id=1;
                this.DataServer=this.AngularWebSite[0];
                this.http.put(this.JsonServer,this.DataServer )
                      .subscribe(res => {
                            console.log('update record 0 =',res);
                    })
            }
    }
  }

  onInitialise(){
    for (this.i=0; this.i<this.Length_Array-1; this.i++){
      this.InitialStatus[this.i]=this.AngularWebSite[this.i].type;
    }
  }


  onDelete(event:any){
  
    if (this.UpdateTable===false){
      this.UpdateTable=true;
      this.onInitialise();
    }

    this.i=event-1;

    if (this.AngularWebSite[this.i].type==='D'){
      this.AngularWebSite[this.i].type='';
    } else {
      this.AngularWebSite[this.i].type='D';
      }
    }

    onClearAll(event:any){
      this.Create_Record=false;
      for (this.i=this.Length_Array-1; this.i>1; this.i--){
        if (this.InitialStatus[this.i] === 'C'){
            this.AngularWebSite.splice(this.Length_Array-1,1);
            this.Length_Array--
        } else {
            this.AngularWebSite[this.i].type=this.InitialStatus[this.i];
          }
      }
    }

    onClear(event:any){
      if (this.Create_Record===true){
        this.Create_Record=false;
        // delete this.AngularWebSite[this.Length_Array-1];
        this.AngularWebSite.splice(this.Length_Array-1,1);
        this.Length_Array--
      }
    }

  onCreate(event:any){
    // test if Create-Record is true; this means that creation of the record is not completed
    
    if (this.Create_Record ===false){
        if (this.UpdateTable===false){
          this.UpdateTable=true;
          this.onInitialise();
        }
        this.Create_Record=true;
        this.DataServer=new TopicURL;
        this.AngularWebSite.push(this.DataServer);
        this.InitialStatus.push('');
        
        this.Length_Array++ // does not consider occurence 0
        this.AngularWebSite[this.Length_Array-1].id=this.Length_Array;

        this.myForm.controls['id'].setValue(this.AngularWebSite[this.Length_Array-1].id.toString());
        this.myForm.controls['topic'].setValue('');
        this.myForm.controls['url'].setValue('');
        this.AngularWebSite[this.Length_Array-1].topic='';
        this.AngularWebSite[this.Length_Array-1].url='';
        this.InitialStatus[this.Length_Array-1]='';
        this.httpError='';
      } else {this.httpError='cannot create as new record has not been submitted'}
  }

onUpdate(event:any){
  if (this.Create_Record ===true && this.myForm.controls['topic'].value!=='' 
  && this.myForm.controls['url'].value!=='' ){

    this.AngularWebSite[this.Length_Array-1].topic=this.myForm.controls['topic'].value;
    this.AngularWebSite[this.Length_Array-1].url=this.myForm.controls['url'].value;
    this.AngularWebSite[this.Length_Array-1].type='C';
    this.InitialStatus[this.Length_Array-1]='C'
    this.Create_Record =false;
    this.httpError='';
  }
  else {this.httpError='cannot submit as no record has been created'}
  
}


}
