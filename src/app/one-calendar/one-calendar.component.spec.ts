import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OneCalendarComponent } from './one-calendar.component';

describe('OneCalendarComponent', () => {
  let component: OneCalendarComponent;
  let fixture: ComponentFixture<OneCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OneCalendarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OneCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
