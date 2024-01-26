import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CacheConsoleComponent } from './cache-console.component';

describe('CacheConsoleComponent', () => {
  let component: CacheConsoleComponent;
  let fixture: ComponentFixture<CacheConsoleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CacheConsoleComponent]
    });
    fixture = TestBed.createComponent(CacheConsoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
