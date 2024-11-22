

// =========== NEW CLASSES

export class classMainFile{
    Header={
        verXML:'<?xml version="1.0" encoding="utf-8" ?>',
        tagConfig:'<configuration>',
        tagConfSec:'<configSections>',
        section:{
            tag:'<section ',
            fields:[{name:"name",type:"ABDDomainCollection"},{name:"type",type:"ICM.ABD.Utils.ConfigFileMan.ABDDomainCollection,ConfigFileMan"}],
            endTag:'/>',
        },
        endTagConfSec:"</configSections>",
        comments:"<!-- Configurations for ABD Remote Deployment  -->",
        domCollect:"<ABDDomainCollection>",
		domConfigs:"<ABDDomainConfigs>"
    };
    Body={
        startTag:"<ABDDomainCollection>",
        level:new classTabLevel0,
        endTag:"</ABDDomainCollection>"
    }
    Trailer={
        domCollect:"</ABDDomainCollection>",
		domConfigs:"</ABDDomainConfigs>",
        tagConfig:'</configuration>',
    }
}

export class classStructure{
    name:string="";
    type:string="";
    details:Array<classDetails>=[];
}

export class classDetails{
    F:string="";
    V:string="";
    nl:boolean=false;
    nlBefore:boolean=false;
}

export class classTabLevel0{
    name:string="";
    type:string="";
    details:Array<classDetails>=[]
    tab:Array<classTabLevel1>=[];
}

export class classTabLevel1{
    name:string="";
    type:string="";
    details:Array<classDetails>=[]
    tab:Array<classTabLevel2>=[];
}

export class classTabLevel2{
    name:string="";
    type:string="";
    details:Array<classDetails>=[]
    tab:Array<classTabLevel3>=[];
}

export class classTabLevel3{
    name:string="";
    type:string="";
    details:Array<classDetails>=[]
    tab:Array<classTabLevel4>=[];
}

export class classTabLevel4{
    name:string="";
    type:string="";
    details:Array<classDetails>=[]
    tab:Array<classStructure>=[];
}


// ================= for mainOutFile ===> display


export class classMainOutFile{
    Header={
        verXML:'<?xml version="1.0" encoding="utf-8" ?>',
        tagConfig:'<configuration>',
        tagConfSec:'<configSections>',
        section:{
            tag:'<section ',
            fields:[{name:"name",type:"ABDDomainCollection"},{name:"type",type:"ICM.ABD.Utils.ConfigFileMan.ABDDomainCollection,ConfigFileMan"}],
            endTag:'/>',
        },
        endTagConfSec:"</configSections>",
        comments:"<!-- Configurations for ABD Remote Deployment  -->",
        domCollect:"<ABDDomainCollection>",
		domConfigs:"<ABDDomainConfigs>"
    };
    Body={
        startTag:"<ABDDomainCollection>",
        level:new classOutTabLevel0,
        endTag:"</ABDDomainCollection>"
    }
    Trailer={
        domCollect:"</ABDDomainCollection>",
		domConfigs:"</ABDDomainConfigs>",
        tagConfig:'</configuration>',
    }
}

export class classOutStructure{
    name:string="";
    type:string="";
    details:Array<classOutDetails>=[];
    display:boolean=true;
}

export class classOutDetails{
    F:string="";
    V:string="";
    display:boolean=true;
    nlBefore:boolean=false;
    nl:boolean=false; // nlAfter
    
}

export class classOutTabLevel0{
    name:string="";
    type:string="";
    details:Array<classOutDetails>=[]
    tab:Array<classOutTabLevel1>=[];
    display:boolean=true;
}

export class classOutTabLevel1{
    name:string="";
    type:string="";
    details:Array<classOutDetails>=[]
    tab:Array<classOutTabLevel2>=[];
    display:boolean=true;
}

export class classOutTabLevel2{
    name:string="";
    type:string="";
    details:Array<classOutDetails>=[]
    tab:Array<classOutTabLevel3>=[];
    display:boolean=true;
}

export class classOutTabLevel3{
    name:string="";
    type:string="";
    details:Array<classOutDetails>=[]
    tab:Array<classOutTabLevel4>=[];
    display:boolean=true;
}

export class classOutTabLevel4{
    name:string="";
    type:string="";
    details:Array<classOutDetails>=[]
    tab:Array<classOutStructure>=[];
    display:boolean=true;
}
