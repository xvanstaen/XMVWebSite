import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaloriesFatComponent } from './calories-fat.component';

describe('CaloriesFatComponent', () => {
  let component: CaloriesFatComponent;
  let fixture: ComponentFixture<CaloriesFatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CaloriesFatComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CaloriesFatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
