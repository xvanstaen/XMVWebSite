import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageUrlTopicComponent } from './manage-url-topic.component';

describe('ManageUrlTopicComponent', () => {
  let component: ManageUrlTopicComponent;
  let fixture: ComponentFixture<ManageUrlTopicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageUrlTopicComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageUrlTopicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
