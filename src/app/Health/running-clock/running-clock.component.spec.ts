import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RunningClockComponent } from './running-clock.component';

describe('RunningClockComponent', () => {
  let component: RunningClockComponent;
  let fixture: ComponentFixture<RunningClockComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RunningClockComponent]
    });
    fixture = TestBed.createComponent(RunningClockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
