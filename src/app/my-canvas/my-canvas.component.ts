//import { ValueConverter } from '@angular/compiler/src/render3/view/template';
import { Component,  SimpleChanges, ViewChild, AfterViewInit, OnInit,  OnChanges,
        Output, Input, HostListener, EventEmitter } from '@angular/core';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatIconModule} from '@angular/material/icon';
import { MatDialogModule} from '@angular/material/dialog';
import { CommonModule,  DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormGroup,UntypedFormControl, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
        
  // import {point_circle} from '.././MyStdFunctions'
import { drawNumbers, drawHourHand, drawMinuteHand, drawSecondHand, classPosSizeClock} from '../clockFunctions'


@Component({
  selector: 'app-my-canvas',
  templateUrl: './my-canvas.component.html',
  styleUrls: ['./my-canvas.component.css'],
  standalone:true,
  imports:[CommonModule, FormsModule, ReactiveFormsModule,],
})
export class MyCanvasComponent implements OnInit {
  

  constructor(      private fb: FormBuilder,) { }
  
  @ViewChild('baseCanvas', { static: true })

  champagne:string='🍾';
  //=============== DATA FOR CLOCK
  posSizeClock= new classPosSizeClock;

  loopClock:number=0;
  maxLoopClock:number=10000;

  
  theSeconds:number=0;
  theMinutes:number=0;
  theHours:number=0;

  lenRectClock:number=0;  // size of the rectangle
  wLineClock:number=4; // width of the line
  xClock:number=0;
  yClock:number=0;
  radiusClock:number=0;
  background = new Image();  
  idAnimationClock:number=0;
  
  clockCanvas:any;
  ctxClock:any;

  //=========================

  posSizeSunEarth= new classPosSizeClock;
  idAnimationSunEarth:number=0;
  
  SunEarthCanvas:any;
  ctxSunEarth:any;

  loopSunEarth:number=0;
  maxLoopSunEarth:number=10000;
  lenRectSunEarth:number=0;  // size of the rectangle
  wLineSunEarth:number=4; // width of the line
  xSunEarth:number=0;
  ySunEarth:number=0;
  radiusSunEarth:number=0;

  moon = new Image();
  earth = new Image();
  sun = new Image();

  //=========================

  posSizeCircleRotation= new classPosSizeClock;
  idAnimationCircleRotation:number=0;
  
  CircleRotationCanvas:any;
  ctxCircleRotation:any;

  loopCircleRotation:number=0;
  maxLoopCircleRotation:number=10000;
  lenRectCircleRotation:number=0;  // size of the rectangle
  wLineCircleRotation:number=4; // width of the line
  xCircleRotation:number=0;
  yCircleRotation:number=0;
  radiusCircleRotation:number=0;
  //=========================

  var_i:number=0;
  var_j:number=0;
  var_k:number=0;

  posSize= new classPosSizeClock;
  theCanvas:any;
  ctx:any;

  startangle:number=0;
  endangle:number=0;
  x_coordinate:number=0;
  y_coordinate:number=0;
  theRadius:number=0;
  theRadiusBis:number=0;
  DirectionClock:boolean=true;

  radioValue:string='';

  x_From:number=0;
  y_From:number=0;
  x_To:number=0;
  y_To:number=0;
  x_Pas:number=0;
  y_Pas:number=0;
  i_loop:number=0;

  max_loop:number=10000; // just for security

  theta_v:number=0;
  theta_pas_v:number=0;

  angle_moon:number=0;
  angle_moonBis:number=0;
  moon_x_prev:number=0;
  moon_y_prev:number=0;

  // used to stop the animation
  id_Animation:number=0;
  id_Animation_two:number=0;
  id_Animation_three:number=0;

  new_x:number=0;
  new_y:number=0;
  prev_x:number=0;
  prev_y:number=0;

  app_to_display:string='';

  TheCanvasForm = new FormGroup({ 
    ReturnToPage: new FormControl("",{ nonNullable: true }),
    xPos: new FormControl(120,{ nonNullable: true }),
    yPos: new FormControl(75,{ nonNullable: true }),
    radius: new FormControl(20,{ nonNullable: true }),
    sAngle: new FormControl(0,{ nonNullable: true }),
    eAngle: new FormControl(2,{ nonNullable: true }),
    Clockwise: new FormControl(true,{ nonNullable: true }),
    theta: new FormControl(0,{ nonNullable: true }),
    theta_pas: new FormControl(15,{ nonNullable: true }),
  });

  MoveCanvasForm = new FormGroup({ 
    xFrom: new FormControl(55,{ nonNullable: true }),
    yFrom: new FormControl(70,{ nonNullable: true }),
    xTo: new FormControl(80,{ nonNullable: true }),
    yTo: new FormControl(85,{ nonNullable: true }),
    radius: new FormControl(5,{ nonNullable: true }),
    xPas: new FormControl(12,{ nonNullable: true }),
    yPas: new FormControl(12,{ nonNullable: true }),
  });

  clockCanvasForm = new FormGroup({ 
    width: new FormControl(250,{ nonNullable: true }),
    height: new FormControl(250,{ nonNullable: true }),
    margLeft: new FormControl(30,{ nonNullable: true }),
    margTop: new FormControl(30,{ nonNullable: true }),
    stopClock: new FormControl(false,{ nonNullable: true }),
    displayDigital: new FormControl(true,{ nonNullable: true }),
    displayAnalog: new FormControl(true,{ nonNullable: true }),
  });

  sunEarthCanvasForm = new FormGroup({ 
    width: new FormControl(350,{ nonNullable: true }),
    height: new FormControl(350,{ nonNullable: true }),
    margLeft: new FormControl(30,{ nonNullable: true }),
    margTop: new FormControl(30,{ nonNullable: true }),
    stopClock: new FormControl(false,{ nonNullable: true }),
    wwSizeSun: new FormControl(60,{ nonNullable: true }),
    hwSizeSun: new FormControl(60,{ nonNullable: true }),
    wwSizeEarth: new FormControl(20,{ nonNullable: true }),
    hwSizeEarth: new FormControl(20,{ nonNullable: true }),
    distEarthMoon: new FormControl(29,{ nonNullable: true }),
    distEarthSun: new FormControl(111,{ nonNullable: true }),
    radiusMoon: new FormControl(4,{ nonNullable: true }),
    radiusEarth: new FormControl(12,{ nonNullable: true }),
  });

  circleRotationCanvasForm = new FormGroup({ 
    width: new FormControl(450,{ nonNullable: true }),
    height: new FormControl(450,{ nonNullable: true }),
    margLeft: new FormControl(30,{ nonNullable: true }),
    margTop: new FormControl(30,{ nonNullable: true }),
    stopClock: new FormControl(false,{ nonNullable: true }),
    radiusCircle: new FormControl(30,{ nonNullable: true }), // to be used
  });

  CanvasForm = new FormGroup({ 
    width: new FormControl(350,{ nonNullable: true }),
    height: new FormControl(350,{ nonNullable: true }),
    margLeft: new FormControl(30,{ nonNullable: true }),
    margTop: new FormControl(30,{ nonNullable: true }),
    stopClock: new FormControl(false,{ nonNullable: true }),
  });

  max_i_loop:number=10000;

  ngOnInit() {
    this.radioValue='';
    this.app_to_display='';
   
   this.sun.src ='../../assets/sun.png';
   this.moon.src ='../../assets/moon.png';
   this.earth.src ='../../assets/earth.png';
   this.earth.style.borderRadius='50%';
   this.earth.style.width='30px';
   this.earth.style.height='30px';
   this.sun.style.borderRadius='50%';
   this.sun.style.width='50px';
   this.sun.style.height='50px';

    this.var_j=45 * Math.PI / 180 / 10;

    this.background.src = "../../assets/clockImage.jpeg";
    this.posSizeClock.displayAnalog=this.clockCanvasForm.controls['displayAnalog'].value;
    this.posSizeClock.displayDigital=this.clockCanvasForm.controls['displayDigital'].value;
    this.clockPos();
    this.radiusClock = this.posSizeClock.height / 2; // diameter of the circle
    this.lenRectClock=this.posSizeClock.width;        
    this.loopClock=0;

    this.background.src = "../../../assets/clockImage.jpeg";
    this.sunEarthPos();
    this.radiusSunEarth = this.posSizeClock.height / 2; // diameter of the circle
    this.lenRectSunEarth=this.posSizeClock.width;        
    this.loopSunEarth=0;

    this.circleRotationPos();
    this.radiusCircleRotation = 30; // diameter of the circle
    this.lenRectCircleRotation=this.posSizeCircleRotation.width /2 ;        
    this.loopCircleRotation=0;

    this.posSize=this.fillPosSize(this.posSize, this.CanvasForm);

  }

  sunEarthPos(){
    this.posSizeSunEarth=this.fillPosSize(this.posSizeSunEarth, this.sunEarthCanvasForm);
    this.xSunEarth=this.posSizeSunEarth.width/2; // x axis of the center
    this.ySunEarth=this.posSizeSunEarth.height/2; // x axis of the center
    if (this.SunEarthCanvas!==undefined){
      this.SunEarthCanvas.width=this.posSizeSunEarth.width;
      this.SunEarthCanvas.height=this.posSizeSunEarth.height;
    }
    
  }

  clockPos(){
    this.posSizeClock=this.fillPosSize(this.posSizeClock, this.clockCanvasForm);
    this.xClock=this.posSizeClock.width/2; // x axis of the center
    this.yClock=this.posSizeClock.height/2; // x axis of the center
    if (this.clockCanvas!==undefined){
      this.clockCanvas.width=this.posSizeClock.width;
      this.clockCanvas.height=this.posSizeClock.height;
    }
  }

  circleRotationPos(){
    this.posSizeCircleRotation=this.fillPosSize(this.posSizeCircleRotation, this.circleRotationCanvasForm);
    this.xCircleRotation=this.posSizeCircleRotation.width/2; // x axis of the center
    this.yCircleRotation=this.posSizeCircleRotation.height/2; // x axis of the center
    if (this.CircleRotationCanvas!==undefined){
      this.CircleRotationCanvas.width=this.posSizeCircleRotation.width;
      this.CircleRotationCanvas.height=this.posSizeCircleRotation.height;
    }
  }

  fillPosSize(posSize:any,formCtrl:any){
    posSize.width=formCtrl.controls['width'].value;
    posSize.height=formCtrl.controls['height'].value;
    posSize.margLeft=formCtrl.controls['margLeft'].value;
    posSize.margTop=formCtrl.controls['margTop'].value;
    return posSize;
  }

  updatePos(event:any){
    if (event==="clock"){
      this.clockPos();
      this.loopClock=0;
      this.Clock();
    } else if (event==="sunEarth"){
      this.sunEarthPos();
      this.loopSunEarth=0;
      this.Sun_Earth();
    } else if (event==="circleRotation"){
      this.circleRotationPos();
      this.loopCircleRotation=0;
      this.circleRotation();
    } else if (event==="canvas"){
      this.posSize=this.fillPosSize(this.posSize, this.CanvasForm);
    }
  }

  ngAfterViewInit() { 
    this.initCanvas();
  }

  initCanvas(){

    if (this.posSizeClock.displayAnalog===true){
      this.clockCanvas=document.getElementById('clockCanvas');
      if (!this.ctxClock) { //true
          this.ctxClock=this.clockCanvas.getContext('2d');
      } 
      this.clockCanvas.width=this.posSizeClock.width;
      this.clockCanvas.height=this.posSizeClock.height;
    }



    this.SunEarthCanvas=document.getElementById('SunEarthCanvas');
    if (!this.ctxSunEarth) { //true
        this.ctxSunEarth=this.SunEarthCanvas.getContext('2d');
        
    } 
    this.SunEarthCanvas.width=this.posSizeSunEarth.width;
    this.SunEarthCanvas.height=this.posSizeSunEarth.height;

    this.CircleRotationCanvas=document.getElementById('circleRotationCanvas');
    if (!this.ctxCircleRotation) { //true
        this.ctxCircleRotation=this.CircleRotationCanvas.getContext('2d');
    } 

    this.CircleRotationCanvas.width=this.posSizeCircleRotation.width;
    this.CircleRotationCanvas.height=this.posSizeCircleRotation.height;


    this.theCanvas=document.getElementById('canvasElem');      
    if (!this.ctx) { //true
        this.ctx=this.theCanvas.getContext('2d');
    }
}

  drawCircle(){
      // DRAW a circle
      this.ctx.beginPath(); //	Begins a path, or resets the current path
      this.ctx.arc(this.x_coordinate, this.y_coordinate, this.theRadius, this.startangle, this.endangle * Math.PI,this.DirectionClock); //Creates an arc/curve (used to create circles, or parts of circles)
      this.ctx.stroke(); // Actually draws the path you have defined
    
    }

  GetParam(){
      this.x_coordinate=this.TheCanvasForm.controls['xPos'].value;
      this.y_coordinate=this.TheCanvasForm.controls['yPos'].value;
      this.theRadius= this.TheCanvasForm.controls['radius'].value;
      this.startangle= this.TheCanvasForm.controls['sAngle'].value;
      this.endangle=this.TheCanvasForm.controls['eAngle'].value;
      this.DirectionClock=this.TheCanvasForm.controls['Clockwise'].value;
      this.x_To=this.MoveCanvasForm.controls['xTo'].value;
      this.y_To=this.MoveCanvasForm.controls['yTo'].value;
      this.x_Pas=this.MoveCanvasForm.controls['xPas'].value;
      this.y_Pas=this.MoveCanvasForm.controls['yPas'].value;
      this.theRadiusBis=this.MoveCanvasForm.controls['radius'].value;   
      this.theta_v=this.TheCanvasForm.controls['theta'].value;
      this.theta_pas_v=this.TheCanvasForm.controls['theta_pas'].value;
    }


    RadioActions(event:any){
      this.app_to_display='';
      if (event!==''){
        this.radioValue=event;
      } else  {this.radioValue= this.TheCanvasForm.controls['ReturnToPage'].value};
      if (this.radioValue==='Circle') {
        this.GetParam();
        this.drawCircle();
        // at the center of the circle insert character 'A' and also draw a line 
        this.ctx.beginPath();
        this.ctx.font = 'bold 18px serif';
        this.ctx.strokeText('A', this.x_coordinate, this.y_coordinate);
        this.ctx.beginPath();
        this.ctx.moveTo(this.x_coordinate, this.y_coordinate);
        this.ctx.lineTo(this.x_coordinate, this.y_coordinate+this.theRadius);
        this.ctx.stroke();  
      }
      else if (this.radioValue==='MoveCircle') {
        this.MoveCanvas('Create');
      }
      else if (this.radioValue==='DrawAnimation') {
          this.i_loop=0;
          this.draw_animation();
      }
      else if (this.radioValue==='Clear') {
        this.ClearCanvas();
        //this.TheCanvasForm.controls['ReturnToPage'].setValue('');
        //this.ngOnInit();
      }
      else if (this.radioValue==='Sun_Earth') {
          this.loopSunEarth=0;
          this.Sun_Earth();
      }  
      else if (this.radioValue==='CircleRotate') {
        this.loopCircleRotation=0;
        this.circleRotation();
    }  
      else if (this.radioValue==='StopAnim') {
        this.stopAnimation();
    }   
      else if (this.radioValue==='Clock') {
        this.loopClock=0;
        this.Clock();
    } 
      else {    this.app_to_display='other'};
    }


    AllAnimationsn(){

      this.loopCircleRotation=0;
      this.i_loop=0;
      this.loopClock=0;
      this.loopSunEarth=0;
      this.draw_animation();
      this.Sun_Earth();
      this.circleRotation();
      this.Clock();

    }

    ClearCanvas(){
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); 
        this.ctx.beginPath();
        //this.ctx.clearRect(this.x_coordinate - this.theRadius - 1, this.y_coordinate - this.theRadius - 1, this.theRadius * 2 + 2, this.theRadius * 2 + 2);
        this.ctx.clearRect(0,0,this.theCanvas.width,this.theCanvas.height);
        this.ctx.closePath();
    }


    MoveCanvas(type_action:string){

      this.GetParam();
      this.theRadius=this.MoveCanvasForm.controls['radius'].value; 
      for (this.x_From=this.MoveCanvasForm.controls['xFrom'].value;  this.x_From<this.MoveCanvasForm.controls['xTo'].value && this.i_loop<this.max_loop; this.x_From++ )
      {
        for (this.y_From=this.MoveCanvasForm.controls['yFrom'].value; this.y_From<=this.MoveCanvasForm.controls['yTo'].value && this.i_loop<this.max_loop; this.y_From++)
        {
          this.x_coordinate=this.x_From;
          this.y_coordinate=this.y_From;
          this.i_loop=this.i_loop+1;
          if (type_action==='Create' ){
            this.drawCircle();
          }
          this.y_From=this.y_From+this.y_Pas;
        }
        this.x_From=this.x_From+this.x_Pas;
        this.i_loop=this.i_loop+1;
      }
    }
    

    draw_animation(){
      this.GetParam();      
      const pas= 2 * Math.PI / this.theta_pas_v;
      const wwSizeSun=300;
      const hwSizeSun=300;
      const distEarthMoon=35;
      const radiusMoon=5;

      this.prev_x= this.x_coordinate;
      this.prev_y= this.y_coordinate;
      
      this.ctx.globalCompositeOperation = 'source-over';

      //To be analyzed https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
    
      this.ctx.setTransform(1, 0, 0, 1, 0, 0); 
      // delete the max size of the rectangle which is the image 'sun'
      this.ctx.beginPath();
      this.ctx.clearRect(this.x_coordinate-wwSizeSun/2,this.y_coordinate-hwSizeSun/2, wwSizeSun, hwSizeSun);  
      this.ctx.stroke();

      this.i_loop++;   

      //
      // This is equivalent to earth moving around the sun
      //
      this.ctx.beginPath(); // critical
      this.ctx.drawImage(this.sun,this.x_coordinate-wwSizeSun/2,this.y_coordinate-hwSizeSun/2, wwSizeSun, hwSizeSun);               
      this.ctx.arc( this.x_coordinate, this.y_coordinate, this.theRadius, 0, 2 * Math.PI);
      this.ctx.strokeStyle= 'lightblue'; // color line cycle
      this.ctx.lineWidth = 3; // weight of the line
      this.ctx.closePath();
      this.ctx.stroke();  // MAY NOT BE NEEDED AS PATH HAS BEEN CLOSED

      const time = new Date();
      this.ctx.translate( this.x_coordinate, this.y_coordinate);
      this.ctx.rotate(((2 * Math.PI) / 60) * time.getSeconds() + ((2 * Math.PI) / 60000) * time.getMilliseconds());
                
      this.ctx.beginPath(); // if omitted then circle crosses the moon 
      this.ctx.translate( this.theRadius-this.theRadiusBis*2-20, this.theRadius-this.theRadiusBis*2-20);
      this.ctx.drawImage(this.earth,-11.5,-11.5);

      // draw a small circle at the center of the earth - FOR THE FUN
      this.ctx.translate( 0,0);
      this.ctx.beginPath();
                
      // this.ctx.arc(this.new_x, this.new_y, 3, 0, 2 * Math.PI); 
      this.ctx.arc(0.2, 0.2, 0, 0, 2 * Math.PI); // if radius is 0 then nothing is drawn
      this.ctx.strokeStyle= 'white'; // color line cycle
      this.ctx.lineWidth = 1; // weight of the line
      this.ctx.fillStyle = "green";
      this.ctx.fill();

      this.ctx.beginPath(); 
      this.ctx.rotate(((2 * Math.PI) / 6) * time.getSeconds() + ((2 * Math.PI) / 6000) * time.getMilliseconds());

      this.ctx.arc(0, distEarthMoon, radiusMoon, 0, 2 * Math.PI); 
      this.ctx.strokeStyle= 'black'; // color line cycle
      this.ctx.lineWidth = 1; // weight of the line
      this.ctx.fillStyle = "red";
      this.ctx.fill();
      this.ctx.font = '30px FontAwesome'; 
      this.ctx.fillText(this.champagne,0,0);
      this.ctx.stroke();

      this.ctx.setTransform(1, 0, 0, 1, 0, 0); 
          
      this.id_Animation_three=window.requestAnimationFrame(() => this.draw_animation());
        if (this.i_loop>this.max_i_loop){
           window.cancelAnimationFrame(this.id_Animation_three);
            this.ClearCanvas();
      } 
    } // draw_animation()



   draw_with_interval(){

    const i= setInterval(() => {
      if (this.i_loop===1500){
            clearInterval(i); 
      }}, 80); // setInterval(()


//======= OTHER SOLUTION
    const j= () => {
      this.id_Animation_two=window.requestAnimationFrame(j) ;
      if (this.loopSunEarth>30000){
          window.cancelAnimationFrame(this.id_Animation_two);
      } 
    } 
    j();

   }

  Sun_Earth(){
    const wwSizeSun=this.sunEarthCanvasForm.controls['wwSizeSun'].value; //90
    const hwSizeSun=this.sunEarthCanvasForm.controls['hwSizeSun'].value; //90;
    const wwSizeEarth=this.sunEarthCanvasForm.controls['wwSizeEarth'].value; //90
    const hwSizeEarth=this.sunEarthCanvasForm.controls['hwSizeEarth'].value; //90;
    const distEarthMoon=this.sunEarthCanvasForm.controls['distEarthMoon'].value; //29;
    const distEarthSun=this.sunEarthCanvasForm.controls['distEarthSun'].value; //105;
    const radiusMoon=this.sunEarthCanvasForm.controls['radiusMoon'].value; //5;
    const radiusEarth=this.sunEarthCanvasForm.controls['radiusEarth'].value; //12;

    this.ctxSunEarth.setTransform(1, 0, 0, 1, 0, 0); 
    this.loopSunEarth++;   
    this.ctxSunEarth.globalCompositeOperation = 'destination-over';
    // this.ctxSunEarth.clearRect(this.xSunEarth-wwSizeSun/2, this.ySunEarth-hwSizeSun/2, wwSizeSun, hwSizeSun);
    this.ctxSunEarth.clearRect(0, 0, this.xSunEarth*2, this.ySunEarth*2);
    this.ctxSunEarth.fillStyle = 'rgba(0, 0, 0, 0.4)'; // grey
    this.ctxSunEarth.strokeStyle = 'rgba(0, 153, 255, 0.4)'; // light blue
    this.ctxSunEarth.save();
    this.ctxSunEarth.translate(this.xSunEarth,this.ySunEarth);

    // Earth
    const time = new Date();
      
    const angle=((2 * Math.PI) / 60) * time.getSeconds() + ((2 * Math.PI) / 60000) * time.getMilliseconds();
    this.ctxSunEarth.rotate(angle);
    this.ctxSunEarth.translate(distEarthSun, 0);

    //this.ctxSunEarth.fillRect(0, -radiusEarth, distEarthMoon, 2*radiusEarth); // Shadow)
    this.ctxSunEarth.drawImage(this.earth, -radiusEarth, -radiusEarth,wwSizeEarth,hwSizeEarth);
        
    // Moon
    //this.ctxSunEarth.save();
    this.ctxSunEarth.rotate(angle*10);
    this.ctxSunEarth.translate(0, distEarthMoon);
    this.ctxSunEarth.drawImage(this.moon,-radiusMoon, -radiusMoon, 15, 15);
    //this.ctxSunEarth.restore();
        
    this.ctxSunEarth.restore();
          
    this.ctxSunEarth.beginPath();
    this.ctxSunEarth.arc(this.xSunEarth,this.ySunEarth, distEarthSun, 0, Math.PI * 2, false); // Earth orbit
    this.ctxSunEarth.stroke();

    // Sun
    //this.ctxSunEarth.drawImage(this.sun,this.xSunEarth-wwSizeSun/2, this.ySunEarth-hwSizeSun/2, wwSizeSun,hwSizeSun);
    this.ctxSunEarth.drawImage(this.sun,this.xSunEarth-wwSizeSun/2, this.ySunEarth-hwSizeSun/2, wwSizeSun,hwSizeSun);

    this.idAnimationSunEarth=window.requestAnimationFrame(() => this.Sun_Earth());
    if (this.loopSunEarth>this.maxLoopSunEarth){
      window.cancelAnimationFrame(this.idAnimationSunEarth);
      this.ClearSunEarthCanvas();
    } 

  }
  restartSunEarth(){
    this.loopSunEarth=0;
  }

  stopSunEarth(){
    this.loopSunEarth=this.maxLoopSunEarth;
    this.ctxSunEarth.setTransform(1, 0, 0, 1, 0, 0); 
    this.ctxSunEarth.beginPath();
    this.ctxSunEarth.clearRect(0,0,this.SunEarthCanvas.width,this.SunEarthCanvas.height);
    this.ctxSunEarth.closePath();
  }

  ClearSunEarthCanvas(){
    this.ctxSunEarth.setTransform(1, 0, 0, 1, 0, 0); 
    this.ctxSunEarth.beginPath();
    this.ctxSunEarth.clearRect(0,0,this.SunEarthCanvas.width,this.SunEarthCanvas.height);
    this.ctxSunEarth.closePath();
  }
    
  stopAnimation(){
    this.i_loop=this.max_i_loop+1;
    this.stopSunEarth();
    this.stopCanvasCircleRotation();
    this.stopClock();
    this.ClearCanvas();
  }

  circleRotation(){

    const time = new Date();
    this.loopCircleRotation++
    // Scales the drawings horizontally
    // Skews the drawings horizontally
    // Skews the drawings vertically
    // Scales the drawings vertically
    // Moves the the drawings horizontally
    // Moves the the drawings vertically
    this.ctxCircleRotation.setTransform(1, 0, 0, 1, 0, 0); 
   
    this.ctxCircleRotation.translate(this.xCircleRotation, this.yCircleRotation); 
    // clear previous picture
    this.ctxCircleRotation.beginPath();
    // clear the drawing area
    this.ctxCircleRotation.clearRect(-(this.lenRectCircleRotation + this.radiusCircleRotation+this.wLineCircleRotation), -(this.lenRectCircleRotation + this.radiusCircleRotation + this.wLineCircleRotation), 
        (this.lenRectCircleRotation + this.radiusCircleRotation+ this.wLineCircleRotation)*2,(this.lenRectCircleRotation + this.radiusCircleRotation+this.wLineCircleRotation)*2);
  
    this.ctxCircleRotation.rotate(((2 * Math.PI) / 6) * time.getSeconds() + ((2 * Math.PI) / 6000) * time.getMilliseconds());

    // draw a rectangle from the centre ==> this corresponds to the line from the center of the canvas to the circle
    this.ctxCircleRotation.fillStyle = "lightblue";
    this.ctxCircleRotation.fillRect(0, 0, 4, this.lenRectCircleRotation); // Shadow
    //this.ctx.stroke();

    // draw a circle at the top of the small rectangle which length is lenRect
    this.ctxCircleRotation.arc(0, this.lenRectCircleRotation, this.radiusCircleRotation, 0, 2 * Math.PI); 
    this.ctxCircleRotation.strokeStyle= 'dark'; // color line cycle
    this.ctxCircleRotation.lineWidth = this.wLineCircleRotation; // weight of the line
    this.ctxCircleRotation.fillStyle = "pink";
    this.ctxCircleRotation.fill();
    this.ctxCircleRotation.stroke();

   
    this.idAnimationCircleRotation=window.requestAnimationFrame(() => this.circleRotation());
    if (this.loopCircleRotation>this.maxLoopCircleRotation){
      window.cancelAnimationFrame(this.idAnimationCircleRotation);
      this.ClearCanvasCircleRotation();
      } 
  }

  stopCanvasCircleRotation(){
    window.cancelAnimationFrame(this.idAnimationCircleRotation);
    this.ClearCanvasCircleRotation();
  } 

  ClearCanvasCircleRotation(){
    this.ctxCircleRotation.setTransform(1, 0, 0, 1, 0, 0); 
    this.ctxCircleRotation.beginPath();
    this.ctxCircleRotation.clearRect(0,0,this.CircleRotationCanvas.width,this.CircleRotationCanvas.height);
    this.ctxCircleRotation.closePath();
  }
  Clock(){
    const reduceSize=0.5;
    this.loopClock++
    const theDate = new Date();
    if (this.posSizeClock.displayDigital===true){
      this.theSeconds=theDate.getSeconds() ;
      this.theMinutes=theDate.getMinutes();
      this.theHours=theDate.getHours();
    }

    //var degrees = (hours * 360 / 12) % 360; 
    //const innerRadius = radius * 0.89; 
    if (this.posSizeClock.displayAnalog===true){
      this.ctxClock.setTransform(1, 0, 0, 1, 0, 0); 
      this.ctxClock.translate(this.xClock, this.yClock); 

      //this.ctxClock.clearRect(-this.xClock, -this.yClock, this.posSizeClock.width, this.posSizeClock.height);
      this.ctxClock.clearRect(0, 0, this.posSizeClock.width, this.posSizeClock.height);

      this.ctxClock.drawImage(this.background, -this.xClock * reduceSize, -this.yClock * reduceSize, this.posSizeClock.width/2, this.posSizeClock.height/2); 
      this.ctxClock.stroke();

      this.ctxClock = drawHourHand(this.ctxClock, theDate, this.radiusClock * 0.6 * reduceSize, this.radiusClock * 0.05 * reduceSize); 
      this.ctxClock = drawMinuteHand(this.ctxClock, theDate, this.radiusClock * 0.8 * reduceSize, this.radiusClock * 0.04 * reduceSize); 
      this.ctxClock = drawSecondHand(this.ctxClock, theDate, this.radiusClock * 0.9 * reduceSize, this.radiusClock * 0.03 * reduceSize); 
    }
    this.idAnimationClock=window.requestAnimationFrame(() => this.Clock());
    
    if (this.posSizeClock.stopClock===true){
      window.cancelAnimationFrame(this.idAnimationClock);
      this.ClearClockCanvas();
    } 
    
  }

  stopClock(){
    window.cancelAnimationFrame(this.idAnimationClock);
    this.ClearClockCanvas();
  }

  ClearClockCanvas(){
    this.ctxClock.setTransform(1, 0, 0, 1, 0, 0); 
    this.ctxClock.beginPath();
    this.ctxClock.clearRect(0,0,this.clockCanvas.width,this.clockCanvas.height);
    this.ctxClock.closePath();
  }

  }


