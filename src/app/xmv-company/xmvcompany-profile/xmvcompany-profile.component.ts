import { Component,  Input, Output,  EventEmitter, ViewChild } from '@angular/core';
import {  ElementRef } from '@angular/core';

@Component({
  selector: 'app-xmvcompany-profile',
  templateUrl: './xmvcompany-profile.component.html',
  styleUrls: ['./xmvcompany-profile.component.css']
})



export class XMVCompanyProfileComponent  {


  constructor( ) {}

  @ViewChild('divprofile', { static: false }) profile={} as ElementRef; // It means that angular is going to look for our target element only after the view has been created

  @Input() redisplay_child: number=0;
  @Output() my_output1= new EventEmitter<number>();

  @Input() GoToContact: number=0;
  @Output() my_outputC= new EventEmitter<number>();

  @Input() GoToOffer: number=0;
  @Output() my_outputO= new EventEmitter<number>();


  
Display_Contact(){
    this.my_outputC.emit(1);
 }

Display_Offer(){
  this.my_outputO.emit(1);
}

}
