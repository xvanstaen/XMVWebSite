import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XmvCompanyComponent } from './xmv-company.component';

describe('XmvCompanyComponent', () => {
  let component: XmvCompanyComponent;
  let fixture: ComponentFixture<XmvCompanyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ XmvCompanyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(XmvCompanyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
