
import { Component, Inject, OnInit, Output, EventEmitter, Input, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA,MatDialogConfig, MatDialog} from '@angular/material/dialog';
import {ViewRegionsDialogComponent} from './booking-dialog-viewregions.component'
import {citycodename } from '../apt_code_name'
import {subsetarray } from '../subsetarray'
import {ArrayCity} from '../ArrayCityRegion';
import {MatAutocompleteModule, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';

@Component({
  selector: 'app-booking-dialog',
  templateUrl: './booking-dialog.component.html',
  styleUrls: ['./booking-dialog.component.css']
})

export class BookingDialogComponent implements OnInit {
  aptcode: string;
  aptname: string;
  origin_arrival: string;
  aptcodefound: boolean;
  MySelection?: citycodename;
  k: number=0;
  

  searchcitycodeform: FormGroup = new FormGroup({ 
    origin_arrival: new FormControl(),
    aptcode: new FormControl(),
    aptname: new FormControl(),
    aptcodefound: new FormControl()
  });

  getScreenWidth: any;
  getScreenHeight: any;
  device_type:string='';  

  values="";
  Myvalues="";
  SingleItem="";
  arraycity=ArrayCity;

  constructor(
    public matDialog: MatDialog,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<BookingDialogComponent>, 
    @Inject(MAT_DIALOG_DATA) 
    private data: {origin_dest: string, aptcode: string, aptname:string, aptcodefound:boolean},  
         )

    {
     this.origin_arrival = data.origin_dest;
     this.aptcode = data.aptcode;
     this.aptname = data.aptname;
     this.aptcodefound = data.aptcodefound;
    }
   
    ngOnInit() {


    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;
    this.device_type = navigator.userAgent;
    this.device_type = this.device_type.substring(10, 48);

      this.searchcitycodeform= this.fb.group({
        origin_arrival: this.origin_arrival, 
        aptcode: this.aptcode,
        aptname: this.aptname,
        aptcodefound: this.aptcodefound
      });
    }
    
    @HostListener('window:resize', ['$event'])
    onWindowResize() {
        this.getScreenWidth = window.innerWidth;
        this.getScreenHeight = window.innerHeight;
      }

    // (keyup) triggers event onKey
    onKey(event:any){
        if (this.k===1 && this.SingleItem===this.searchcitycodeform.controls['aptcode'].value){
          this.selectedcity(this.arraycity[this.k-1].citycode);
        } else {
            this.aptcode = this.searchcitycodeform.controls['aptcode'].value;
            if (this.aptcode!==''){
                this.arraycity=subsetarray(ArrayCity, this.aptcode);
                this.k = this.arraycity.length;
                this.SingleItem='';
                if (this.k===1){
                  this.SingleItem=this.arraycity[this.k-1].citycode + " " + this.arraycity[this.k-1].cityname;
                  this.searchcitycodeform.controls['aptcode'].setValue(this.SingleItem);
                }
            } else {this.k=0};
          }
    }
    
    //selection has been made in Autocomplete window
    // @Output() optionSelected= new EventEmitter();
    i: number=0;
    cityfound: Boolean=false;

    selectedcity(event:any) {
      this.values= event;
      this.k = this.arraycity.length;
      this.Myvalues = this.values.toUpperCase();
      for ( this.i=0; this.i<this.k; this.i++) {
            if ((this.arraycity[this.i].citycode.toUpperCase() == this.Myvalues)){
                  break; 
                // exit the "for" loop as condition is true; dialog will return data and will be closed
                }
        }

      this.searchcitycodeform.controls['origin_arrival'].setValue(this.origin_arrival);
      this.searchcitycodeform.controls['aptcode'].setValue(this.Myvalues);
      this.searchcitycodeform.controls['aptname'].setValue(this.arraycity[this.i].cityname.toUpperCase());
      this.searchcitycodeform.controls['aptcodefound'].setValue(true)
      
      this.dialogRef.close(this.searchcitycodeform.value);
    }

    onClear(){
      
      this.searchcitycodeform.controls['aptcode'].setValue('');
      this.k=-1;
    }

    OnCancel() {
      this.dialogRef.close("");
    }

    OpenViewRegionsDialog() {

      const RegiondialogConfig = new MatDialogConfig();
        
        RegiondialogConfig.disableClose = false;
        RegiondialogConfig.autoFocus = true;
        RegiondialogConfig.panelClass = 'MypanelClass';                                                                                                                                                                    
        RegiondialogConfig.backdropClass = 'MybackdropClass';
        RegiondialogConfig.width = '100%';
        RegiondialogConfig.height = '500px';
        RegiondialogConfig.maxWidth='95%';
        
      if (this.getScreenHeight<520){
        RegiondialogConfig.height = (window.innerHeight-40)+'px'; 
        RegiondialogConfig.position = {
          bottom:'10px',
          left: '4%',   
                  
        };
      }
      else {
        RegiondialogConfig.position = {
          bottom:'80px',
          left: '25px',           
        };
      }
        
        RegiondialogConfig.data = {
            origin_dest: this.origin_arrival,
            aptcode: "",
            aptname: "",
            aptcodefound: Boolean
        }
      
        const dialogRef = this.matDialog.open(ViewRegionsDialogComponent , RegiondialogConfig);
      
        dialogRef.afterClosed().subscribe((result: citycodename) => {
            this.MySelection = result;
            if (this.MySelection.citycode!=='') {
                this.searchcitycodeform.controls['origin_arrival'].setValue(this.origin_arrival);
                this.searchcitycodeform.controls['aptcode'].setValue(this.MySelection.citycode);
                this.searchcitycodeform.controls['aptname'].setValue(this.MySelection.cityname);
                this.searchcitycodeform.controls['aptcodefound'].setValue(true);
                this.dialogRef.close( this.searchcitycodeform.value);
            }
          })
      } // OpenViewRegionsDialog()

  }   


   


