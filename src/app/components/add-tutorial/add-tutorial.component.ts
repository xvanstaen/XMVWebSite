import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Tutorial } from 'src/app/components/TutorialClass';
import { Observable } from 'rxjs';
import { TutorialService } from 'src/app/CloudServices/tutorial.service';
@Component({
  selector: 'app-add-tutorial',
  templateUrl: './add-tutorial.component.html',
  styleUrls: ['./add-tutorial.component.css']
})
export class AddTutorialComponent implements OnInit {
  
  tutorial = new Tutorial;
  submitted = false;

  constructor(
    private tutorialService: TutorialService,
    private http: HttpClient,
    ) {}

  Google_Bucket_Name:string='xmv_messages'; 
  HTTP_Address:string='';
  Google_Bucket_Access_RootPOST:string='https://storage.googleapis.com/upload/storage/v1/b/';

  ngOnInit(): void {
    this.HTTP_Address=this.Google_Bucket_Access_RootPOST + this.Google_Bucket_Name + "/o?name=Message"  + '.json&uploadType=media';
  }


  saveTutorialB(){
  this.HTTP_Address='http://localhost:8080/api/tutorials';
  this.http.post(this.HTTP_Address, this.tutorial).subscribe(
          res => {
            console.log('add tutorial is successful');
            console.log(res);
            this.submitted = true;
          },
          error_handler => {

            console.log('add tutorial failed  ', error_handler);
          }
        );
  }
 
  saveTutorial(): void {
    const data = {
      title: this.tutorial.title,
      description: this.tutorial.description
    };
    this.tutorialService.create(this.tutorial)
        .subscribe(
          res => {
            console.log('add tutorial is successful');
            console.log(res);
            this.submitted = true;
          },
          error => {

            console.log('add tutorial failed  ', error);
          }
          );
     

  }



  newTutorial(): void {
    console.log('add tutorial: new Tutorial function')
    this.submitted = false;
    this.tutorial = {
      id:'',
      title: '',
      description: '',
      published: false
    };
  }

   /** 
         *   .subscribe({
        next: (res) => {
          console.log('add tutorial is successful');
          console.log(res);
          this.submitted = true;
          },
        error: (e) => {
          console.log('add tutorial failed ');
          console.error(e);
          }
        }); 
        **/
}