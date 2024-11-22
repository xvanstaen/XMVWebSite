

export class classDropDown{
    heightItem:number=25;
    heightContent:number=0;
    widthContent:number=0;
    heightOptions:number=0;
    widthOptions:number=0;
    maxHeightContent:number=275;
    maxHeightOptions:number=275; 
    scrollY:string='hidden';
  }

export function getStyleDropDownContent(height:number, width:number){
    var style:any;
    return style = {
      'width': width + 'px',
      'height': height + 'px',
      'position': 'absolute',
      'z-index': '1'
    }
  };

export  function getStyleDropDownBox(height:number, width:number, marginL:number, marginT:number,scrollY:string){
    var style:any;
    return style = {
        'background-color':'lightgrey',
        'width': width + 'px',
        'height': height + 'px',
        'margin-top' :  marginT + 'px',
        'margin-left': marginL + 'px',
        'overflow-x': 'hidden',
        'overflow-y': scrollY,
        'border':'1px lightgrey solid'
        }
  }