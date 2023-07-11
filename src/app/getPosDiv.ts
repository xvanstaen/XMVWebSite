

export class classPosDiv{
    Top:number=-1; // offsetTop
    Left:number=0; // offsetLeft
    Height:number=0;
    Width:number=0;
    ClientRect={ // getBoundingClientRect() - provides information about the size of an element and its position relative to the viewport
      Top:0,
      Left:0,
      Height:0,
      Bottom:0,
      X:0,
      Y:0,
    };
    parentElement={
      offsetHeight:0,
      offsetWidth:0,
      offsetTop:0,
      offsetLeft:0,
    };
    offsetParent={
      offsetHeight:0,
      offsetWidth:0,
      offsetTop:0,
      offsetLeft:0,
    }
  }

export  function getPosDiv(divId:string){
    var docDiv:any;
    var posDiv = new classPosDiv;
    if (document.getElementById(divId)!==null){
        docDiv = document.getElementById(divId);
        posDiv.Left = docDiv.offsetLeft;
        posDiv.Top = docDiv.offsetTop;
        posDiv.Height = docDiv.offsetHeight;
        posDiv.Width = docDiv.offsetWidth;
        
        posDiv.ClientRect.Top=Math.round(docDiv.getBoundingClientRect().top);
        posDiv.ClientRect.Left=Math.round(docDiv.getBoundingClientRect().left);
        posDiv.ClientRect.Height=Math.round(docDiv.getBoundingClientRect().height);
        posDiv.ClientRect.Bottom=Math.round(docDiv.getBoundingClientRect().bottom);
        posDiv.ClientRect.X=Math.round(docDiv.getBoundingClientRect().x);
        posDiv.ClientRect.Y=Math.round(docDiv.getBoundingClientRect().y);

        posDiv.parentElement.offsetHeight=docDiv.parentElement.offsetHeight;
        posDiv.parentElement.offsetTop=docDiv.parentElement.offsetTop;
        posDiv.parentElement.offsetLeft=docDiv.parentElement.offsetLeft;
        posDiv.parentElement.offsetWidth=docDiv.parentElement.offsetWidth;

        posDiv.offsetParent.offsetHeight=docDiv.offsetParent.offsetHeight;
        posDiv.offsetParent.offsetTop=docDiv.offsetParent.offsetTop;
        posDiv.offsetParent.offsetLeft=docDiv.offsetParent.offsetLeft;
        posDiv.offsetParent.offsetWidth=docDiv.offsetParent.offsetWidth;
      }
      return (posDiv);
}