import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.css']
})


export class ColorPickerComponent {
  
  my_input_child1:string='';
  my_input_child2:string='';
  my_output_child1:string='';
  my_output_child2:string='';

  selected_color:string='';


  ngOnInit(){
    //console.log('=====>init  color-picker');
    this.my_input_child1='white';
    this.my_input_child2='white';
    this.selected_color=this.my_input_child1;
  }

  Testdata2(event:any){ 
    //console.log('TestData2 1 & 2 are changed with', event);
    this.my_input_child2=event;
    this.my_input_child1=event;
  }

  Testdata1(event:any){ 
    this.selected_color = event;
   // console.log('TestData1 - selected color = ',this.selected_color);
  }

}
