    import {citycodename, DaysOfWeek, TheMonths, DaysOfMonths } from './apt_code_name'
    import {AllRegions } from './apt_code_name'
    
    export const ArrayCity: citycodename[] = [
        {RegionId: 0, citycode: "SEL", cityname: "Seoul/All airports"},
        {RegionId: 0, citycode: "ICN", cityname: "Seoul/Incheon"},
        {RegionId: 0, citycode: "GMP", cityname: "Seoul/Gimpo"},
        {RegionId: 0, citycode: "PUS", cityname: "Busan/Gimhae"},
        {RegionId: 0, citycode: "CJU", cityname: "Jeju"},
        {RegionId: 0, citycode: "CJJ", cityname: "Cheongju"},
        {RegionId: 0, citycode: "TAE", cityname: "Daegu"},
        {RegionId: 0, citycode: "KWJ", cityname: "Gwangju"},
        {RegionId: 0, citycode: "USL", cityname: "Uslan"},
        {RegionId: 1, citycode: "AOJ", cityname: "Aomori"},
        {RegionId: 1, citycode: "PEK", cityname: "Beijing/Shoudu"},
        {RegionId: 1, citycode: "HKG", cityname: "HongKong"},
        {RegionId: 2, citycode: "FRA", cityname: "Frankfurt"},
        {RegionId: 2, citycode: "CDG", cityname: "Paris/Charles de Gaulle"},
        {RegionId: 2, citycode: "LHR", cityname: "London/Heathrow"},
        {RegionId: 3, citycode: "BKK", cityname: "Bangkok"},
        {RegionId: 3, citycode: "BWN", cityname: "Brunei"},
        {RegionId: 3, citycode: "CEB", cityname: "Cebu"},
        {RegionId: 3, citycode: "DEL", cityname: "Delhi"},
        {RegionId: 3, citycode: "KUL", cityname: "Kuala Lumpur"},
        {RegionId: 3, citycode: "HKT", cityname: "Phuket"},
        {RegionId: 3, citycode: "SIN", cityname: "Singapore/Changi"},
        {RegionId: 3, citycode: "RGN", cityname: "Yangon"}
    ];

    export const ArrayRegion: AllRegions[] = [
        {RegionName: "Republic of Korea", RegionId: 0},
        {RegionName: "NorthEast Asia", RegionId: 1},
        {RegionName: "Europe", RegionId: 2},
        {RegionName: "South East / South West Asia", RegionId: 3}
    ];

    export const WeekDays: DaysOfWeek[] = [
        {DoW: "Sunday"},{DoW: "Monday"},{DoW: "Tuesday"},{DoW: "Wednesday"},{DoW: "Thursday"},
        {DoW: "Friday"},{DoW: "Saturday"}
        
    ];

    export const MonthOfYear: TheMonths[] = [
        {TheMonth: "January"},{TheMonth: "February"},{TheMonth: "March"},{TheMonth: "April"},
        {TheMonth: "May"},{TheMonth: "June"},{TheMonth: "July"},{TheMonth: "August"},
        {TheMonth: "September"},
        {TheMonth: "October"},
        {TheMonth: "November"},{TheMonth: "December"}
    ];

    export const DaysByMonth: DaysOfMonths[] = [
        {DoMonth:1},{DoMonth:2}
    ];