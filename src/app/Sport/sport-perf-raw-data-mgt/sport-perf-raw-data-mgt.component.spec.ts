import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SportPerfRawDataMgtComponent } from './sport-perf-raw-data-mgt.component';

describe('SportPerfRawDataMgtComponent', () => {
  let component: SportPerfRawDataMgtComponent;
  let fixture: ComponentFixture<SportPerfRawDataMgtComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SportPerfRawDataMgtComponent]
    });
    fixture = TestBed.createComponent(SportPerfRawDataMgtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
