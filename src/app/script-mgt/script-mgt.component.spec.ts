import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScriptMgtComponent } from './script-mgt.component';

describe('ScriptMgtComponent', () => {
  let component: ScriptMgtComponent;
  let fixture: ComponentFixture<ScriptMgtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScriptMgtComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScriptMgtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
