export class classHealthHistoryIndex{
  fileType:string='';
  updatedAt:string='';
  indexRecord:Array<classIndexRecord>=[];
}

export class classIndexRecord{
  fileName={
    root:"",
    indexNb:0
  };
  tabYYMM:Array<string>=[]; // YYYY-MM
}



export class mainClassCaloriesFat{
  fileType:string='';
  updatedAt:string='';
  tabCaloriesFat:Array<ClassCaloriesFat>=[];
}

export class ClassCaloriesFat{
    Type:string="";
    Content:Array<ClassItem>=[];
    Total=new ClassItem;
  }
  
  export class ClassItem{
    Name:string="";
    Serving:number=0;
    ServingUnit: string="gram";
    Calories:number=0;
    GlyIndex:number=0;
    Sugar:number=0;
    naturalSugar:number=0;
    addedSugar:number=0;
    Cholesterol:number=0;
    Fat={
        Saturated:0,
        Total:0,
    };
    Protein:number=0;
    Carbs:number=0;
    lockData:string="N";
  }

  //
  // Health 
  //

  export class mainDailyReport{
    fileType:string='';
    updatedAt:string='';
    tabDailyReport:Array<DailyReport>=[];
  } 
  export class DailyReport{
    date=new Date();
    burntCalories:number=0;
    meal:Array<ClassMeal>=[];
    total= new ClassItem;
  } 
 
  export class ClassMeal{
    name:string=''; // breakfast, lunch, dinner
    dish:Array<ClassDish>=[];
    total= new ClassItem;
  }
  
  export class ClassDish{
    name:string='';
    quantity:number=0;
    unit:string='gram';
    calFat=new ClassItem;
  
  }