import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XMVCompanyContactComponent } from './xmvcompany-contact.component';

describe('XMVCompanyContactComponent', () => {
  let component: XMVCompanyContactComponent;
  let fixture: ComponentFixture<XMVCompanyContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ XMVCompanyContactComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(XMVCompanyContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
