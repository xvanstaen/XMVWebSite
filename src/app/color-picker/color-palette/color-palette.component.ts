import { Component,  SimpleChanges, ViewChild, AfterViewInit, OnInit,  OnChanges,
  Output, Input, HostListener, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-color-palette',
  templateUrl: './color-palette.component.html',
  styleUrls: ['./color-palette.component.css']
})
export class ColorPaletteComponent implements OnInit, OnChanges, AfterViewInit {

  constructor() { }

  @Input() my_input1: string='';
  @Input() INreturnField={
    rgba:'',
    xPos:0,
    yPos:0
  }
  @Output() my_output1= new EventEmitter<string>();
  @Output() my_output2= new EventEmitter<any>();

  @ViewChild('myCanvas', { static: true })

  i=0;
  mytext:string='';
  InputChange:boolean=false;
  previous_my_input1:string='';

  rgbaColor:string='';
  mousedown: boolean = false;
  selectedPosition ={ 
          x: 0,
          y: 0} ;

  theCanvas:any;
  ctx:any;

  returnField={
    rgba:'',
    xPos:0,
    yPos:0
  }

  ngOnInit(): void {
    //console.log('first child init - no emit');
    
  }
   
  

  ngAfterViewInit() { 
    //console.log('Color Palette AfterView in Palette  : ', this.my_input1);
      this.theCanvas=document.getElementById('canvasElPalette');
      if (!this.ctx) { //true
          this.ctx=this.theCanvas.getContext('2d');
      }
      this.draw();
      if (this.INreturnField.rgba!==undefined && this.INreturnField.rgba!=='' ){
        this.ctx.strokeStyle = this.INreturnField.rgba;
        this.ctx.fillStyle = this.INreturnField.rgba;
        this.ctx.beginPath();
        this.ctx.arc(this.INreturnField.xPos, this.INreturnField.yPos, 10, 0, 2 * Math.PI);
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
      }
  
    }
  
    
  draw() {
    
      const width = this.theCanvas.width;
      const height = this.theCanvas.height;
      this.ctx.fillStyle = this.my_input1 || 'rgba(255,255,255,1)';
      this.ctx.fillRect(0, 0, width, height);
    
      const whiteGrad = this.ctx.createLinearGradient(0, 0, width, 0);
      whiteGrad.addColorStop(0, 'rgba(255,255,255,1)');
      whiteGrad.addColorStop(1, 'rgba(255,255,255,0)');
  
      this.ctx.fillStyle = whiteGrad;
      this.ctx.fillRect(0, 0, width, height);
  
      const blackGrad = this.ctx.createLinearGradient(0, 0, 0, height);
      blackGrad.addColorStop(0, 'rgba(0,0,0,0)');
      blackGrad.addColorStop(1, 'rgba(0,0,0,1)');
  
      this.ctx.fillStyle = blackGrad;
      this.ctx.fillRect(0, 0, width, height);

      if (this.selectedPosition) {
        this.ctx.strokeStyle = this.my_input1;
        this.ctx.fillStyle = this.my_input1;
        this.ctx.beginPath();
        this.ctx.arc(this.selectedPosition.x, this.selectedPosition.y, 10, 0, 2 * Math.PI);
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
      }
    }
  
    ngOnChanges(changes: SimpleChanges) {   
      

      var i=0;
      for (const propName in changes){
          const j=changes[propName];
          if (propName==='my_input1'){
            if (changes['my_input1'].firstChange===true){
              this.previous_my_input1 = changes['my_input1'].currentValue; // data is not used indeed
            }
            else {
                  this.draw();
                  const pos = this.selectedPosition;
                  if (pos) {
                    this.rgbaColor=this.getColorAtPosition(pos.x, pos.y);
                  
                  }
                  
                }
              
          }
      }


  
        
          
    }


    @HostListener('window:mouseup', ['$event'])
    onMouseUp(evt: MouseEvent) {
      this.mousedown = false;
    }
  
    onMouseDown(evt: MouseEvent) {
      //console.log("mouse down in Palette");
      this.mousedown = true;
      
      this.selectedPosition = { x: evt.offsetX, y: evt.offsetY };
      this.draw();
      this.emitColor(evt.offsetX, evt.offsetY);
      /*
      this.rgbaColor=this.getColorAtPosition(evt.offsetX, evt.offsetY);
      this.my_output1.emit(this.rgbaColor);
      this.returnField.rgba=this.rgbaColor;
      this.returnField.xPos=evt.offsetX;
      this.returnField.yPos=evt.offsetY;
      this.my_output2.emit(this.returnField);
      */
 
    }
  
    onMouseMove(evt: MouseEvent) {
      if (this.mousedown) {
        this.selectedPosition = { x: evt.offsetX, y: evt.offsetY };
        this.draw();
        this.emitColor(evt.offsetX, evt.offsetY);
      }
    }
  
    emitColor(x: number, y: number) {
      this.rgbaColor = this.getColorAtPosition(x, y);
      this.my_output1.emit(this.rgbaColor);
      this.returnField.rgba=this.rgbaColor;
      this.returnField.xPos=x;
      this.returnField.yPos=y;
      this.my_output2.emit(this.returnField);
    }
  
  
  
    getColorAtPosition(x: number, y: number) {
      const imageData = this.ctx.getImageData(x, y, 1, 1).data;
      //console.log('getColor', this.ctx.getImageData(x, y, 1, 1).data);
      return 'rgba(' + imageData[0] + ',' + imageData[1] + ',' + imageData[2] + ',1)';
    }
  



}
