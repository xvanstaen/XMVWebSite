import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainHealthComponent } from './main-health.component';

describe('MainHealthComponent', () => {
  let component: MainHealthComponent;
  let fixture: ComponentFixture<MainHealthComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MainHealthComponent]
    });
    fixture = TestBed.createComponent(MainHealthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
