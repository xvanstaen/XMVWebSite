import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TutorialsComponent } from './tutorials.component';

describe('TutorialsComponent', () => {
  let component: TutorialsComponent;
  let fixture: ComponentFixture<TutorialsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TutorialsComponent]
    });
    fixture = TestBed.createComponent(TutorialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
