import { Component,  SimpleChanges, ViewChild, AfterViewInit, OnInit,  OnChanges,
  Output, Input, HostListener, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
  // import {point_circle} from '.././MyStdFunctions'

import { drawNumbers, drawHourHand, drawMinuteHand, drawSecondHand, classPosSizeClock} from '../../clockFunctions'
@Component({
  selector: 'app-running-clock',
  templateUrl: './running-clock.component.html',
  styleUrls: ['./running-clock.component.css']
})
export class RunningClockComponent {
  
    constructor(
      private fb: FormBuilder,
    ) { }
    
    @Input() posSizeClock= new classPosSizeClock;

    @ViewChild('clockCanvas', { static: true })
  
    theCanvas:any;
    ctx:any;
    clock_loop:number=0;
    max_clock_loop:number=10000;
    idAnimation:any;

    lenRect:number=0;  // size of the rectangle
    wLine:number=4; // width of the line
    theSeconds:number=0;
    theMinutes:number=0;
    theHours:number=0;
    x:number=0;
    y:number=0;
    radius:number=0;
  
    background = new Image();   
  
 ngAfterViewInit() { 
      this.background.src = "../../../assets/clockImage.jpeg";
      this.x=this.posSizeClock.width/2; // x axis of the center
      this.y=this.posSizeClock.height/2; // x axis of the center
      this.radius = this.posSizeClock.height / 2; // diameter of the circle
      this.lenRect=this.posSizeClock.width;        
      this.clock_loop=0;
      if (this.posSizeClock.displayAnalog===true){
        this.theCanvas=document.getElementById('canvasElem');
        if (!this.ctx) { //true
            this.ctx=this.theCanvas.getContext('2d');
        } 
        this.theCanvas.width=this.posSizeClock.width;
        this.theCanvas.height=this.posSizeClock.height;
      } 
  }

  ngOnInit(){
    this.Clock();
  }
  
  Clock(){

    this.clock_loop++
    const theDate = new Date();
    if (this.posSizeClock.displayDigital===true){
      this.theSeconds=theDate.getSeconds() ;
      this.theMinutes=theDate.getMinutes();
      this.theHours=theDate.getHours();
    }

    //var degrees = (hours * 360 / 12) % 360; 
    //const innerRadius = radius * 0.89; 
    if (this.posSizeClock.displayAnalog===true){
      this.ctx.setTransform(1, 0, 0, 1, 0, 0); 
      this.ctx.translate(this.x, this.y); 

      this.ctx.clearRect(-this.x, -this.y, this.posSizeClock.width, this.posSizeClock.height);

      this.ctx.drawImage(this.background, -this.x, -this.y, this.posSizeClock.width, this.posSizeClock.height); 
      this.ctx.stroke();

      this.ctx = drawHourHand(this.ctx, theDate, this.radius * 0.6, this.radius * 0.05); 
      this.ctx = drawMinuteHand(this.ctx, theDate, this.radius * 0.8, this.radius * 0.04); 
      this.ctx = drawSecondHand(this.ctx, theDate, this.radius * 0.9, this.radius * 0.03); 
    }
    this.idAnimation=window.requestAnimationFrame(() => this.Clock());
    
    if (this.posSizeClock.stopClock===true){
      window.cancelAnimationFrame(this.idAnimation);
      this.ClearCanvas();
    } 
    
  }

  ClearCanvas(){
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); 
    this.ctx.beginPath();
    this.ctx.clearRect(0,0,this.theCanvas.width,this.theCanvas.height);
    this.ctx.closePath();
  }
  
}

