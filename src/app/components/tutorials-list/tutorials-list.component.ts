import { Component, OnInit } from '@angular/core';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatIconModule} from '@angular/material/icon';
import { MatDialogModule} from '@angular/material/dialog';
import { CommonModule,  DatePipe, formatDate, ViewportScroller } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormGroup,UntypedFormControl, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Tutorial } from '../../components/TutorialClass';
import { Observable } from 'rxjs';
import { TutorialService } from '../../CloudServices/tutorial.service';

@Component({
  selector: 'app-tutorials-list',
  templateUrl: './tutorials-list.component.html',
  styleUrls: ['./tutorials-list.component.css'],
  standalone:true,
  imports:[CommonModule, FormsModule, ReactiveFormsModule,],
 
})
export class TutorialsListComponent implements OnInit {
  tutorials :any;
  currentTutorial = new Tutorial;
  modifiedTutorial = new Tutorial;
  currentIndex = -1;
  title = '';
  msg_edit:string='';
  constructor(
    private tutorialService: TutorialService,
    ) { }

  ngOnInit(): void {
   // this.retrieveTutorials();
  }
  retrieveTutorials(): void {
       /* TO BE REVIEWED
    this.tutorialService.getAll()
      .subscribe(
        data => {
          this.tutorials = data;
          console.log('get list ', data);
        },
        error => {
          console.log('get list ', error);
        });
        */
  }
  refreshList(): void {
    this.retrieveTutorials();
    this.currentTutorial={
      id:'',
      title: '',
      description: '',
      published: false
    };
    this.modifiedTutorial={
      id:'',
      title: '',
      description: '',
      published: false
    };
    this.currentIndex = -1;
  }
  setActiveTutorial(tutorial:any, index:any): void {
    this.currentTutorial = tutorial;
    this.currentIndex = index;
  }
  removeAllTutorials(): void {
       /* TO BE REVIEWED
    this.tutorialService.deleteAll()
      .subscribe(
        response => {
          console.log(response);
          this.retrieveTutorials();
        },
        error => {
          console.log(error);
        });
      */
  }
  searchTitle(): void {
       /* TO BE REVIEWED
    this.tutorialService.findByTitle(this.title)
    
      .subscribe(
        data => {
          this.tutorials = data;
          console.log(data);
        },
        error => {
          console.log('searchTitle ', this.title, '  error = ', error);
        });
        */
  }
  editTutorial(){
   
      this.msg_edit=' edit tutorial Title = ' + this.currentTutorial.title + '   & id is ' +  this.currentTutorial.id;
      this.modifiedTutorial = this.currentTutorial;
    }

    UpdateTutorial(){
         /* TO BE REVIEWED
      this.tutorialService.update(this.modifiedTutorial.id, this.modifiedTutorial)
      .subscribe(
        data => {
          console.log('update of id ', data);
          this.msg_edit='';
          this.refreshList();
        },
        error => {
          console.log('failure to update id ', this.modifiedTutorial.id, '  error = ', error);
          this.msg_edit = 'failure to update id ' + this.modifiedTutorial.id + '  error = ' + error.status;
        });
        */
    }
}
