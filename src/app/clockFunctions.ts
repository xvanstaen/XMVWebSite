export class classPosSizeClock{
    margLeft:number=0;
    margTop:number=0;
    width:number=0;
    height:number=0;
    stopClock:boolean=false;
    displayDigital:boolean=false;
    displayAnalog:boolean=false;

}

export function drawTime(ctx:any, radius:any){
    var now = new Date();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var second = now.getSeconds();
    //hour
    hour=hour%12;
    hour=(hour*Math.PI/6)+
    (minute*Math.PI/(6*60))+
    (second*Math.PI/(360*60));
    ctx = drawHand(ctx, hour, radius*0.5, radius*0.07);
    //minute
    minute=(minute*Math.PI/30)+(second*Math.PI/(30*60));
    ctx = drawHand(ctx, minute, radius*0.8, radius*0.07);
    // second
    second=(second*Math.PI/30);
    ctx = drawHand(ctx, second, radius*0.9, radius*0.02);
    return ctx;
}


export function drawNumbers(ctx:any, radius:any) { 
  var ang=0; 
  var num=0;
  var dot = '.'; // ?
  ctx.font = radius * 0.1 + 'px arial'; 
  ctx.font = "10pt Courier"; 
  ctx.textBaseline = 'middle'; 
  ctx.textAlign = 'center'; 
  for (num = 1; num < 13; num++) { 
    ang = num * Math.PI / 6; 
    ctx.rotate(ang); 
    ctx.translate(0, -radius * 0.85); 
    ctx.rotate(-ang); 
    ctx.fillText(dot, 0, 0); //?
    ctx.rotate(ang); 
    ctx.translate(0, radius * 0.85); 
    ctx.rotate(-ang); 
  }  
  return ctx;
}  

export function degreesToRadians(degrees:any) { 
    return ((Math.PI / 180) * degrees )
  }   

export function  drawHourHand(ctx:any, theDate:any, length:any, width:any) { 
    var hours = theDate.getHours() + theDate.getMinutes() / 60;
    var degrees = (hours * 360 / 12) % 360; 
    ctx.save(); 
    ctx.fillStyle = 'black'; 
    ctx.strokeStyle = '#555'; 
    ctx.rotate(degreesToRadians(degrees)); 
    ctx =  drawHand(ctx, length, width, 3); 
    ctx.restore(); 
    return ctx;
  }  
  
export function  drawMinuteHand(ctx:any, theDate:any, length:any, width:any) { 
    var minutes = theDate.getMinutes() + theDate.getSeconds() / 60; 
    ctx.save(); 
    ctx.fillStyle = 'red'; 
    ctx.strokeStyle = '#555'; 
    const theDegrees = degreesToRadians(minutes * 6)
    ctx.rotate(theDegrees); 
    ctx = drawHand(ctx, length, width, 5); 
    ctx.restore(); 
    return ctx;
  }  
  
export function drawHand(ctx:any, size:any, thickness:any, shadowOffset:any) { 
    thickness = thickness || 4; 
    ctx.beginPath(); 
    ctx.moveTo(0, 0); // center 
    ctx.lineTo(thickness * -1, -10); 
    ctx.lineTo(0, size * -1); 
    ctx.lineTo(thickness, -10); 
    ctx.lineTo(0, 0); 
    ctx.fill(); 
    ctx.stroke(); 
    return ctx;
  }  
  
export function drawSecondHand(ctx:any, theDate:any, length:any, width:any) { 
    var seconds = theDate.getSeconds(); 
    ctx.save(); 
    ctx.fillStyle = '#1ABB9C'; 
    ctx.strokeStyle = "#1ABB9C"; 
    ctx.globalAlpha = 0.8; 
    ctx.rotate(degreesToRadians(seconds * 6)); 
    ctx = drawHand(ctx, length, width, 0); 
    ctx.restore(); 
    return ctx;
  }  

  
export function  drawFace(ctx:any, radius:any) { 
    ctx.beginPath(); 
    ctx.arc(0, 0, radius, 0, 2 * Math.PI); 
    ctx.fillStyle = 'white'; 
    ctx.fill(); 
    const grad = ctx.createRadialGradient(0, 0, radius, 0.95, 0, 0, radius, 1.05); 
    grad.addColorStop(0.5, '#333'); 
    grad.addColorStop(0, '#1ABB9C'); 
    ctx.strokeStyle = grad; 
    ctx.lineWidth = radius * 0.050; 
    ctx.stroke(); 
    ctx.beginPath(); 
    ctx.arc(0, 0, radius, 0.1, 0, 2, Math.PI); 
    ctx.fillStyle = '#333'; 
    ctx.fill(); 
    return ctx;
  }  