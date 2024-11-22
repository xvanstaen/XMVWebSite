import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SportReportsComponent } from './sport-reports.component';

describe('SportReportsComponent', () => {
  let component: SportReportsComponent;
  let fixture: ComponentFixture<SportReportsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SportReportsComponent]
    });
    fixture = TestBed.createComponent(SportReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
