import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XMVCompanyOfferComponent } from './xmvcompany-offer.component';

describe('XMVCompanyOfferComponent', () => {
  let component: XMVCompanyOfferComponent;
  let fixture: ComponentFixture<XMVCompanyOfferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ XMVCompanyOfferComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(XMVCompanyOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
