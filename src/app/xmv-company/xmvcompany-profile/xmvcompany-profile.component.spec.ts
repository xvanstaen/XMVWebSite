import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XMVCompanyProfileComponent } from './xmvcompany-profile.component';

describe('XMVCompanyProfileComponent', () => {
  let component: XMVCompanyProfileComponent;
  let fixture: ComponentFixture<XMVCompanyProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ XMVCompanyProfileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(XMVCompanyProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
