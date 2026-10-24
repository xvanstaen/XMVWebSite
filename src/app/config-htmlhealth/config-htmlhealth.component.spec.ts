import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigHTMLHealthComponent } from './config-htmlhealth.component';

describe('ConfigHTMLHealthComponent', () => {
  let component: ConfigHTMLHealthComponent;
  let fixture: ComponentFixture<ConfigHTMLHealthComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConfigHTMLHealthComponent]
    });
    fixture = TestBed.createComponent(ConfigHTMLHealthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
