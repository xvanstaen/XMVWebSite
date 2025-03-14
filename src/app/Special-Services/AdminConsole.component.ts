import { Component, OnInit , Input, HostListener} from '@angular/core';
import { CommonModule,  DatePipe, formatDate, ViewportScroller } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { msgConsole } from '../JsonServerClass';

@Component({
  selector: 'app-AdminConsole',
  templateUrl: './AdminConsole.component.html',
  styleUrls: ['./AdminConsole.component.css'],
  standalone:true,
  imports:[CommonModule, FormsModule, ReactiveFormsModule, ],
})

export class AdminConsoleComponent {

  
  constructor(

    private scroller: ViewportScroller

    ) {}

    
    @Input() theReceivedData=new Array<msgConsole>();

    ContentTodisplay:boolean=false;


ngOnInit(){
  
  // the list of all objects from console is generated by module ListBucketContent
  // then all messages are displayed from table 'this.theReceivedData'
  ///////////////////////////////////////////////////////

  // use the service ManageMongoDB to get the list of the console message in ListBucketContent


      this.scroller.scrollToAnchor('targetTop');
      this.ContentTodisplay=true;

  }    


}