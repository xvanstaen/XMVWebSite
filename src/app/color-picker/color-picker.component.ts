import { Component, OnInit , Input, Output, ViewChild,  HostListener,  HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID, ElementRef} from '@angular/core';
import { FormGroup,UntypedFormControl, FormControl, Validators} from '@angular/forms';
import {classPosSlider} from '../JsonServerClass';
@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.css']
})



export class ColorPickerComponent {
  @Output() returnFile= new EventEmitter<any>(); // not used

  constructor(

    
    ) {}

    
  my_input_child1:string='';
  my_input_child2:string='';
  my_output_child1:string='';
  my_output_child2:string='';

  posSlider=new classPosSlider;
  posPalette=new classPosSlider;
  paramChange:number=0; // used to trigger the change on slider position

  returnSlider={
    rgba:'',
    xPos:0,
    yPos:0
  }

  returnPalette={
    rgba:'',
    xPos:0,
    yPos:0
  }

  myForm = new FormGroup({
    VerHor: new FormControl('', {validators:[Validators.required, Validators.minLength(3)], nonNullable: true}),
    top: new FormControl('',{validators:[ Validators.required], nonNullable: true}),
    left: new FormControl('',{validators:[ Validators.required], nonNullable: true}),
    rgba1: new FormControl('',{validators:[ Validators.required], nonNullable: true}),
    rgba2: new FormControl('',{validators:[ Validators.required], nonNullable: true}),
    rgba3: new FormControl('',{validators:[ Validators.required], nonNullable: true}),
    rgba4: new FormControl('',{validators:[ Validators.required], nonNullable: true}),
    palTop: new FormControl('',{validators:[ Validators.required], nonNullable: true}),
    palLeft: new FormControl('',{validators:[ Validators.required], nonNullable: true}),
  });


  ngOnInit(){
    //console.log('=====>init  color-picker');

 

    this.my_input_child1='white';
    this.my_input_child2='white';

    this.myForm.controls['VerHor'].setValue('V');
    this.myForm.controls['top'].setValue('3');
    this.myForm.controls['left'].setValue('20');

    this.myForm.controls['palTop'].setValue('0');
    this.myForm.controls['palLeft'].setValue('20');

  }

isDisplaySlider:boolean=false;
onSubmit(){
    this.posSlider.VerHor=this.myForm.controls['VerHor'].value.toUpperCase().trim();;
    this.posSlider.top=Number(this.myForm.controls['top'].value);
    this.posSlider.left=Number(this.myForm.controls['left'].value);
    this.posPalette.top=Number(this.myForm.controls['palTop'].value);
    this.posPalette.left=Number(this.myForm.controls['palLeft'].value);

    this.my_input_child2='rgba('+this.myForm.controls['rgba1'].value+","+this.myForm.controls['rgba2'].value
                      +","+this.myForm.controls['rgba3'].value+","+this.myForm.controls['rgba4'].value+")";
    this.my_input_child1=this.my_input_child2;
    this.isDisplaySlider=true;
    this.paramChange++;
    
}

fnSlider(event:any){ 
    this.my_input_child1=event; //used by palette
    this.my_input_child2=event; //used by slider
  }
  
fnSliderBis(event:any){ 
    this.returnSlider=event; // returned by slider
  }

fnPaletteBis(event:any){ 
  this.returnPalette=event;
  }

temporaryColor:string='white';
fnPalette(event:any){ 
  this.temporaryColor=event;
    
  }
}
