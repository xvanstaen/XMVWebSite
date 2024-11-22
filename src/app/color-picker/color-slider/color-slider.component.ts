import { Component, OnInit , Input, Output, EventEmitter, ViewChild, SimpleChanges, OnChanges, 
  AfterContentInit, HostListener, AfterViewInit} from '@angular/core';
  import {classPosSlider} from '../../JsonServerClass';

  import {MatSliderModule} from '@angular/material/slider';

@Component({
  selector: 'app-color-slider',
  templateUrl: './color-slider.component.html',
  styleUrls: ['./color-slider.component.css']
})
export class ColorSliderComponent implements OnInit, OnChanges, AfterViewInit {


  constructor() { }

 
  @Input() my_input2: string='';
  @Input() paramChange:number=0;
  @Input() posSlider=new classPosSlider; 
  @Input() INreturnField={
    rgba:'',
    xPos:0,
    yPos:0
  }
  @Output() my_output2= new EventEmitter<any>();
  @Output() my_output1= new EventEmitter<string>();

  @ViewChild('THECanvas', { static: true })


  i=0;
  mytext:string='';
  InputChange:boolean=false;


  mousedown:boolean=false;

  selectedPos={x:0,y:0}

  hexColor: string='';
  rgbaColor: any;
  theCanvas:any;
  ctx:any;

  returnField={
    rgba:'',
    xPos:0,
    yPos:0
  }

  canvas={
    width:0,
    height:0
  }
  selectNb:number=255;
  getScreenWidth:number=0;
  getScreenHeight:number=0;
  browserType:string="";
  @HostListener('window:resize', ['$event'])
  onWindowResize() {
      this.getScreenWidth = window.innerWidth;
      this.getScreenHeight = window.innerHeight;
    }

//@HostListener('touchstart', ['$event'])
//@HostListener('touchmove', ['$event'])
//@HostListener('touchend', ['$event'])

docDiv:any;
posDiv={
  Top:0,
  Left:0,
}

getPosDiv(){
  if (document.getElementById("posDivCanvas")!==null){
      this.docDiv = document.getElementById("posDivCanvas");
      this.posDiv.Left = this.docDiv.offsetLeft;
      this.posDiv.Top = this.docDiv.offsetTop;
  }
}

ngOnInit(): void {
  this.getScreenWidth = window.innerWidth;
  this.getScreenHeight = window.innerHeight;
  this.getPosDiv();
  
  if (navigator.userAgent.indexOf("Firefox")>0){
    this.browserType="Firefox";
  } else {this.browserType="Others"};

  if (this.posSlider.VerHor==='H'){
      this.canvas.width=255;
      this.canvas.height=50;
      this.selectNb=1;
  } else {
    this.canvas.width=50;
    this.canvas.height=255;
    this.selectNb=255;
  }
  if (this.INreturnField.rgba!==undefined && this.INreturnField.rgba!=='' ){
    this.selectedPos.x=this.INreturnField.xPos;
    this.selectedPos.y=this.INreturnField.yPos;
  } else {
    this.selectedPos.x=0;
    this.selectedPos.y=0;
    
  }
}

ngAfterViewInit() { 
  if (this.posSlider.VerHor==='H'){
      this.theCanvas=document.getElementById('canvasIDSliderH');
  } else if (this.posSlider.VerHor==='V'){
    this.theCanvas=document.getElementById('canvasIDSliderV');
  }
  /*
  if (this.posSlider.VerHor==='H'){
    this.theCanvas=document.getElementById('canvasIDSliderH');
  } else {
    this.theCanvas=document.getElementById('canvasIDSliderV');
  }
  */
  if (!this.ctx){
    this.ctx=this.theCanvas.getContext('2d');
  }
    
  this.draw();
  if (this.INreturnField.rgba!==undefined && this.INreturnField.rgba!=='' ){
    this.ctx.beginPath()
    this.ctx.strokeStyle = 'white'
    this.ctx.lineWidth = 2
    //this.ctx.rect(0, this.selectedHeight - 5, width, 10)


    if (this.posSlider.VerHor==='H'){
      this.ctx.rect( this.INreturnField.xPos - 1, 0, this.ctx.lineWidth, this.canvas.height);
    } else {
      this.ctx.rect(0, this.INreturnField.yPos - 1, this.canvas.width, this.ctx.lineWidth);
    }
    //this.ctx.rect( this.INreturnField.xPos - 5, 0, 10, 50)
    this.ctx.stroke()
    this.ctx.closePath()
  } 
}



draw() {

      var gradient:any;
      const width = this.theCanvas.width;
      const height = this.theCanvas.height;
      this.ctx.clearRect(0, 0, width , height);
      if (this.posSlider.VerHor==='H'){
      // x0=The x-coordinate of the start point of the gradient
      // y0=The y-coordinate of the start point of the gradient
      // x1=The x-coordinate of the end point of the gradient
      // y1=The y-coordinate of the end point of the gradient
      // this.ctx.createLinearGradient(x0, y0, x1 , y1);
          gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width , 0);
      } else {
          gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      }
      
      gradient.addColorStop(0, 'rgba(255, 0, 0, 1)');
      gradient.addColorStop(0.17, 'rgba(255, 255, 0, 1)');
      gradient.addColorStop(0.34, 'rgba(0, 255, 0, 1)');
      gradient.addColorStop(0.51, 'rgba(0, 255, 255, 1)');
      gradient.addColorStop(0.68, 'rgba(0, 0, 255, 1)');
      gradient.addColorStop(0.85, 'rgba(255, 0, 255, 1)');
      gradient.addColorStop(1, 'rgba(255, 0, 0, 1)');

      /*
      const grd = this.ctx.createLinearGradient(0, 0, 250, 0);
      grd.addColorStop(0, "black");
      grd.addColorStop("0.3", "magenta");
      grd.addColorStop("0.5", "blue");
      grd.addColorStop("0.6", "green");
      grd.addColorStop("0.8", "yellow");
      grd.addColorStop(1, "red");
      */

      this.ctx.beginPath();
      this.ctx.fillStyle = gradient;
      //this.ctx.fillStyle = grd;
      this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fill();
      this.ctx.closePath();



}

myMouse:number=0;
onMouseDown(evt: MouseEvent) {
    //this.msg="onMouseDown";
    this.mousedown = true;
    this.myMouse++
    this.selectedPos = { x: evt.offsetX, y: evt.offsetY };
    this.selectNb=256-this.selectedPos.y;
    this.draw();
    this.emitColor();
    this.colorSelected();
  }
  
colorSelected(){
  if (this.selectedPos.x!==0 || this.selectedPos.y!==0){
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = 'white'
    this.ctx.lineWidth = 2;
    if (this.posSlider.VerHor==='H'){
      this.ctx.rect( this.selectedPos.x - 1, 0, this.ctx.lineWidth, this.canvas.height);
    } else {
      this.ctx.rect(0, this.selectedPos.y - 1, this.canvas.width, this.ctx.lineWidth);
    }
    this.ctx.stroke();
    this.ctx.closePath();
  }
}


//myTouch:any;
//msg:string="";
//myElement:any;
onTouchStart(event:any){
  //this.getPosDiv();
  //this.msg="Touch ";
  event.preventDefault(); // this si to stop scrolling when touch screen on the slider is performed
  var touch = event.touches[0] || event.changedTouches[0];
  //this.myTouch=touch;
  //this.myElement=touch.target;
  //this.msg=this.msg+'onTouchStart==> pageX='+touch.pageX + '   screenX='+ touch.screenX + 'client.X=' + touch.clientX +  
  //+ '  clientLeft='+this.myElement.clientLeft + '  clientTop='+this.myElement.clientTop + '  clientWidth='+this.myElement.clientWidth;
  if (this.posSlider.VerHor==='H'){
    this.selectedPos.x=touch.pageX-this.posDiv.Left-this.posSlider.left-this.posSlider.div.left;
    if (this.selectedPos.x<1){this.selectedPos.x=1} else if (this.selectedPos.x>254){this.selectedPos.x=254};
    this.selectNb=this.selectedPos.x;
  } else {
    this.selectedPos.y=touch.clientY-this.posDiv.Top-this.posSlider.top-this.posSlider.div.top;
    if (this.selectedPos.y<1){this.selectedPos.y=1} else if (this.selectedPos.y>254){this.selectedPos.y=254};
    this.selectNb=this.selectedPos.y;
  }
  this.draw();
  this.emitColor();
  this.colorSelected();

  //this.returnValue(event);
}



onMouseMove(evt: MouseEvent) {
    if (this.mousedown) {
      this.selectedPos = { x: evt.offsetX, y: evt.offsetY };
      this.selectNb=256-this.selectedPos.y;
      this.draw();
      this.emitColor();
      this.colorSelected();
    } 
  }

@HostListener('window:mouseup', ['$event'])
onMouseUp(evt: MouseEvent) { 
    this.mousedown = false;
  }
 

emitColor() {
      this.rgbaColor = this.getColorAtPosition();
      this.returnField.rgba=this.rgbaColor;
      this.returnField.xPos=this.selectedPos.x;
      this.returnField.yPos=this.selectedPos.y;
      this.my_output1.emit(this.rgbaColor);
      this.my_output2.emit(this.returnField);
     }
     
getColorAtPosition() {

  if (this.posSlider.VerHor==='H'){
      var imageData = this.ctx.getImageData(this.selectedPos.x, 1, 1, 1);
  } else {
    var imageData = this.ctx.getImageData(3, this.selectedPos.y, 1, 1);
  }

 // for (var i=0; i<255; i++){
 //   var imageDataB = this.ctx.getImageData(i , 3, 1, 1);
 // }

  return 'rgba(' + imageData.data[0] + ',' + imageData.data[1] + ',' + imageData.data[2] + ',1)';


     }
     
ngOnChanges(changes: SimpleChanges) { 
  var i=0;
  for (const propName in changes){
      const j=changes[propName];
      if (propName==='paramChange' && changes['paramChange'].firstChange===false){
        this.ngOnInit();
        this.draw();
        if (this.INreturnField.rgba!==undefined && this.INreturnField.rgba!=='' ){
          this.ctx.beginPath()
          this.ctx.strokeStyle = 'white'
          this.ctx.lineWidth = 2
          //this.ctx.rect(0, this.selectedHeight - 5, width, 10)
      
      
          if (this.posSlider.VerHor==='H'){
            this.ctx.rect( this.INreturnField.xPos - 1, 0, this.ctx.lineWidth, this.canvas.height);
          } else {
            this.ctx.rect(0, this.INreturnField.yPos - 1, this.canvas.width, this.ctx.lineWidth);
          }
          //this.ctx.rect( this.INreturnField.xPos - 5, 0, 10, 50)
          this.ctx.stroke()
          this.ctx.closePath()
        } 
      }
     }
    }



}
