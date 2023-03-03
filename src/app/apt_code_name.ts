


export class citycodename {
        RegionId: number=0;
        citycode: string='';
        cityname: string='';
        
}

export class AllRegions {
        RegionName: string='';
        RegionId: number=0;
}

export class TravelDates {
        oneway_boarding_date: Date=new Date();
        return_boarding_date: Date=new Date();
        travel_type: string='';

}
export class DaysOfWeek { DoW: string=''}

export class TheMonths { TheMonth: string=''}

export class DaysOfMonths { 
        DoMonth: number=0}


        // ======= NOT USED 
export class DaysOfMonthsBis { 
                DoMonth: number=0;
                type_data:string=''}    // T for Today date; O for origin selected date; R for selected return date; 
                                        // I for in-range selection; B for Before today

export class eventoutput {
                error_msg:string='';
                type_error:number=0;
                theInput:string='';
                input_year:string='';
                input_month:string='';
                input_day:string='';
            }

export class fillcalendar {
        monthname_c:string='';
        monthname_n:string='';
        weekday_n:number=0;
        weekday_c:number=0;
        dayspermonth1:Array<DaysOfMonths>=[];
        dayspermonth2:Array<DaysOfMonths>=[];

        datePipe_OW:Date=new Date();
        datePipe_RET:Date=new Date();

        input_OW:string='';
        input_RET:string='';
        valid_input_OW:string='';
        valid_input_RET:string='';
    
        today_year:number=0;
        today_month:number=0;
        today_day:number=0;
  
        yearnb:number=0;
        monthnb:number=0;
        daynb:number=0;

        nyearnb:number=0;
        nmonthnb:number=0;
        ndaynb:number=0;
        
        display_yearnb:number=0;
        display_monthnb:number=0;
        display_daynb:number=0;

        display_nyearnb:number=0;
        display_nmonthnb:number=0;
        display_ndaynb:number=0;

        maxDate_day:number=0;
        maxDate_month:number=0; 
        maxDate_year:number=0;

        minDate_day:number=1;
        minDate_month:number=1;
        minDate_year:number=1900;
        
        type_error:number=0;
        error_msg:string='';
                

}

export class  thedateformat {
        MyDateFormat: string="dd-MM-yyyy";
        separator_char:string="-";
        separator_one_p:number=0;
        separator_two_p:number=0;
        day_position:number=0;
        year_position:number=0;
        month_position:number=0;
  
        length_year:number=4;
        length_month:number=2;
        length_day:number=2;
    }


    // ========================== BELOW IS NOT USED - WAS RELATED TO AN EXAMPLE OF COLOR PICKER

    export class ActionConfig {
        format?: ActionFormat;
        actions: Array<ActionButton>=[];
        size?: ActionSize; // Small by default, setting this will overwrite the button sizes
        type: string='';
        grouping?: {
            enableGrouping: boolean,
            multiActive?: boolean,
            active: ActionButton[]
        };
        alternativeKeys?: any;
      }

      export enum ActionFormat {
        Default,
        List,
        CheckBox
    }
    
    export enum ActionSize {
        Small = 1,
        Medium,
        Large
    }
    
    export interface ActionButton {
        
        label: string;  // Simple Label for the button ie 'Edit' or 'Delete'    
        format?: ButtonFormat; // Simple Look fo the button
        // Set a Primary and Alternative Icon. If you wish for the action to switch between them, specifiy either explicitly to UseAlt
        // or a Property for the action to check.
        // Based on the comparison between the subject's chosen Property and the Trigger, this will flip the Icon used to the Alternative
        icon?: {
            primary?: string;
            alternative?: string;
            toggle?: {
                useAlt?: boolean;
                property?: string;
                trigger?: any;
            };
            color?: string;
            iconOnly?: boolean;
            active?: string; // after logic dictates which icon is active, this property will contain which is currently displayed
        };
    
        tooltip?: string;  // if passed, on hover over this button, the tooltip will be displayed
        // Property: A property for the action button to look for in its subject for disabling.
        // Trigger: Based on the comparison between the subject's chosen Property and the Trigger, this will disabled the button
        // Override: if passed will be the only evaluated property
    
        disabled?: {
            property?: string;
            trigger?: any;
            triggerMethodParameters?: any;
            triggerMethodProperty?: string;
            triggerOperator?: ComparisonOperator;
            externalConditions?: any;
            multiConditions?: any; // for scenarios where multiple conditions all need to resolve true for disable to be applied
            override?: boolean;
        };
    
        classes?: string[]; // after being processed, any addtional classes will held here
    
        // binding a method to the OnClick will execute that method. the 'bind.(this)' is key for reference  eg. OnClick: this.myAwesomeMethod.bind(this)
        onClick?($event: any): void;
    }
    
    export enum ButtonFormat {
        default,
        primary,
        success,
        cancel,
        info,
        warning,
        danger,
    }
    
    // operator will be used during comparison when external value is passed
    export enum ComparisonOperator {
        Equal,
        NotEqual,
        GreaterThan,
        LessThan,
        GreaterOrEqual,
        LesserOrEqual,
        Contains, // This applies only in cases of an Array being passed. given the property, this will evaluate if the TriggerArray Contains the property
        NotContain // see above but obvious difference
    }
    