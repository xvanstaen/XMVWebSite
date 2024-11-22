import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageCircuitsComponent } from './manage-circuits.component';

describe('ManageCircuitsComponent', () => {
  let component: ManageCircuitsComponent;
  let fixture: ComponentFixture<ManageCircuitsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManageCircuitsComponent]
    });
    fixture = TestBed.createComponent(ManageCircuitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
