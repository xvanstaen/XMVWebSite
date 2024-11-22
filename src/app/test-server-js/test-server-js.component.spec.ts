import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestServerJSComponent } from './test-server-js.component';

describe('TestServerJSComponent', () => {
  let component: TestServerJSComponent;
  let fixture: ComponentFixture<TestServerJSComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TestServerJSComponent]
    });
    fixture = TestBed.createComponent(TestServerJSComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
