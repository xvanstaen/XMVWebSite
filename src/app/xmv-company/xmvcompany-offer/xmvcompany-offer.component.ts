import { Component, OnInit,  Input, Output,EventEmitter, AfterViewChecked, OnChanges, SimpleChanges} from '@angular/core';

import { Directive, ElementRef, Renderer2 } from '@angular/core';
import { ViewportScroller } from "@angular/common";

@Component({
  selector: 'app-xmvcompany-offer',
  templateUrl: './xmvcompany-offer.component.html',
  styleUrls: ['./xmvcompany-offer.component.css']
})
export class XMVCompanyOfferComponent implements OnInit {

 
  @Input() redisplay_child: number=0;
  @Output() my_output1= new EventEmitter<number>();
  @Input() selectedoffer: string='';
  
  constructor(

    private elementRef: ElementRef, 
    private scroller: ViewportScroller,
    ) {}
    skip_to:string='';
    i_pass:number=0;

    getScreenWidth: any;
    getScreenHeight: any;
    device_type:string='';
    android_type=0;
  


ngOnInit() {
  this.device_type = navigator.userAgent.toLowerCase();;
  
  this.android_type = this.device_type.indexOf('android');
  this.skip_to=this.selectedoffer;

  }

goDown1(event:string){
  this.scroller.scrollToAnchor(event);
}
  
/****
 * Other Methods to scroll in HTML page
 * 
 * 
  goDown2() {
    //this.scroller.scrollToAnchor("targetGreen");
    document.getElementById("targetGreen").scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest"
    });
  }

  goDown3() {
    this.router.navigate([], { fragment: "targetBlue" });
  }
 * 
 * 
 */


  Display_Contact(){
    // this.router.navigateByUrl('Contact');
    this.my_output1.emit(1);
 }

ngAfterViewChecked(){
  if (this.i_pass===0 ){
    this.scroller.scrollToAnchor(this.selectedoffer);
    this.i_pass=1;
  } 
}

ngOnChanges(changes: SimpleChanges) { 
  //nothing to process   
  // console.log('mgOnCHanges 2nd child');
  this.scroller.scrollToAnchor(this.selectedoffer);
   }

}
