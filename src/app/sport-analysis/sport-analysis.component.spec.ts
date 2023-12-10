import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SportAnalysisComponent } from './sport-analysis.component';

describe('SportAnalysisComponent', () => {
  let component: SportAnalysisComponent;
  let fixture: ComponentFixture<SportAnalysisComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SportAnalysisComponent]
    });
    fixture = TestBed.createComponent(SportAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
