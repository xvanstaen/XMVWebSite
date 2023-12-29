import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerformanceSportComponent } from './performance-sport.component';

describe('PerformanceSportComponent', () => {
  let component: PerformanceSportComponent;
  let fixture: ComponentFixture<PerformanceSportComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PerformanceSportComponent]
    });
    fixture = TestBed.createComponent(PerformanceSportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
