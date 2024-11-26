import { Component, OnInit } from '@angular/core';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatIconModule} from '@angular/material/icon';
import { MatDialogModule} from '@angular/material/dialog';
import { CommonModule,  DatePipe, formatDate, ViewportScroller } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormGroup,UntypedFormControl, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';

import { TutorialService } from '../../CloudServices/tutorial.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Tutorial } from '../../components/TutorialClass';

@Component({
  selector: 'app-tutorial-details',
  templateUrl: './tutorial-details.component.html',
  styleUrls: ['./tutorial-details.component.css'],
  standalone:true,
  imports:[CommonModule, FormsModule, ReactiveFormsModule,],

})
export class TutorialDetailsComponent implements OnInit {

  currentTutorial = new Tutorial;
  message = '';
  constructor(
    private tutorialService: TutorialService,
    private route: ActivatedRoute,
    private router: Router) { }

  ngOnInit(): void {
    this.message = '';
    this.getTutorial(this.route.snapshot.paramMap.get('id'));
  }
  getTutorial(id:any): void {
  /* TO BE REVIEWED 
    this.tutorialService.get(id)
      .subscribe(
        data => {
          this.currentTutorial = data;
          console.log('get details ', data);
        },
        error => {
          console.log('get details ', error);
        });
  */
  }
  updatePublished(status:any): void {
    const data = {
      title: this.currentTutorial.title,
      description: this.currentTutorial.description,
      published: status
    };
  /* TO BE REVIEWED
    this.tutorialService.update(this.currentTutorial.id, data)
      .subscribe(
        response => {
          this.currentTutorial.published = status;
          console.log(response);
        },
        error => {
          console.log(error);
        });
  */
  }
  updateTutorial(): void {
    /* TO BE REVIEWED
    this.tutorialService.update(this.currentTutorial.id, this.currentTutorial)
      .subscribe(
        response => {
          console.log(response);
          this.message = 'The tutorial was updated successfully!';
        },
        error => {
          console.log(error);
        });
  */
  }
  deleteTutorial(): void {
    /* TO BE REVIEWED
    this.tutorialService.delete(this.currentTutorial.id)
      .subscribe(
        response => {
          console.log(response);
          this.router.navigate(['/tutorials']);
        },
        error => {
          console.log(error);
        });
   */
  }
}
