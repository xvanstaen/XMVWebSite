import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagePointOfRefComponent } from './manage-point-of-ref.component';

describe('ManagePointOfRefComponent', () => {
  let component: ManagePointOfRefComponent;
  let fixture: ComponentFixture<ManagePointOfRefComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManagePointOfRefComponent]
    });
    fixture = TestBed.createComponent(ManagePointOfRefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
