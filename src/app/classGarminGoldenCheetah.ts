export class classIntervals{
    NAME:string="Lap 1 "; START:number= 0; "STOP":number= 96.507; COLOR:string="#000000"; PTEST:string="false";
}

export class classSamples
{ SECS:number= 0; KM:number= 0; KPH:number= 0; HR:number= 0; ALT:number= 0; LAT:number= 0; LON:number= 0; SLOPE:number= 0; }

export class classGarminGoldenCheetah {
	RIDE={
		STARTTIME:"2023\/10\/25 08:27:34 UTC ",
		RECINTSECS:1,
		DEVICETYPE:"Forerunner 235 ",
		IDENTIFIER:" ",
		TAGS:{
			Athlete:"Xavier ",
			Data:"TDS-H--AGL----- ",
			Device:"Forerunner 235 ",
			"File Format":" ",
			Filename:" ",
			Month:"October ",
			"Source Filename":" ",
			Sport:"Bike ",
			Weekday:"Wed ",
			Year:"2023 "
		},
        INTERVALS:Array<classIntervals>,
        SAMPLES:Array<classSamples>,
    }
}		