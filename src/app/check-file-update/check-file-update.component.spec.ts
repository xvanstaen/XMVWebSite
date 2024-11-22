import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckFileUpdateComponent } from './check-file-update.component';

describe('CheckFileUpdateComponent', () => {
  let component: CheckFileUpdateComponent;
  let fixture: ComponentFixture<CheckFileUpdateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CheckFileUpdateComponent]
    });
    fixture = TestBed.createComponent(CheckFileUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
