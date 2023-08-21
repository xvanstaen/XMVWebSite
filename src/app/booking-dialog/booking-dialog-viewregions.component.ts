

import { Component, Inject, OnInit, Input, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig, MatDialog} from '@angular/material/dialog';

import {CreateArray2D} from '../CreateArray2D';
import {ArrayCity} from '../ArrayCityRegion';
import {ArrayRegion} from '../ArrayCityRegion';

import {citycodename } from '../apt_code_name'
import {AllRegions } from '../apt_code_name'

@Component({
  selector: 'app-booking-dialog-viewregions',
  templateUrl: './booking-dialog-viewregions.component.html',
  styleUrls: ['./booking-dialog-viewregions.component.css']
})


export class ViewRegionsDialogComponent  {
    aptcode: string;
    aptname: string;
    origin_arrival: string;
    MySelection: string="";
    returnstring: String="";
    /* the below 2 variables are not used*/
    MyTable = CreateArray2D(10,10);
    NewTable = this.MyTable[0];

    arrayregion = ArrayRegion;
    arraycity = ArrayCity;

    getScreenWidth: any;
    getScreenHeight: any;
    device_type:string='';  

    viewregionsform: FormGroup = new FormGroup({ 
      origin_arrival: new FormControl(),
      aptcode: new FormControl(),
      aptname: new FormControl()
    })

    constructor(
        public matDialog: MatDialog,
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<ViewRegionsDialogComponent>, 
        @Inject(MAT_DIALOG_DATA) 
        private data: {origin_dest: string, aptcode: string, aptname:string, aptcodefound: Boolean},  
             )
        {
         this.origin_arrival = data.origin_dest;
         this.aptcode = data.aptcode;
         this.aptname = data.aptname;
        }

        // this MyVar will be updated when new region is selected 
        // initial value is 0 which corresponds to region Korea 
        @Input() MyVar: number = 0;
        selectedCity: citycodename={
          RegionId:0,
          citycode:'',
          cityname:''

        };

        selectedRegion?: AllRegions;
        
        ngOnInit() {
          this.getScreenWidth = window.innerWidth;
          this.getScreenHeight = window.innerHeight;
          this.device_type = navigator.userAgent;
          this.device_type = this.device_type.substring(10, 48);
          }
          
        @HostListener('window:resize', ['$event'])
        onWindowResize() {
              this.getScreenWidth = window.innerWidth;
              this.getScreenHeight = window.innerHeight;
            }
      

        OnCancel() {
            this.selectedCity.citycode = "";
            this.selectedCity.cityname = "";
            this.dialogRef.close(this.selectedCity);
            }
        
        onSelect(arraycity: citycodename) {
            this.selectedCity = arraycity;
            this.returnstring=this.selectedCity.citycode +";" + this.selectedCity.cityname;
            this.dialogRef.close(this.selectedCity);
    }

        onSelectRegion(arrayregion: AllRegions) {
            this.selectedRegion = arrayregion;
            this.MyVar = this.selectedRegion.RegionId; 
    }
        onConfirmClick(){
          // must check how to get the name and pass it to the parent-dialog
            this.dialogRef.close(this.viewregionsform.controls['aptcode'].value);
    }
}