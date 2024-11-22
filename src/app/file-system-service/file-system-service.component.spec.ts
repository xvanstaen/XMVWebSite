import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileSystemServiceComponent } from './file-system-service.component';

describe('FileSystemServiceComponent', () => {
  let component: FileSystemServiceComponent;
  let fixture: ComponentFixture<FileSystemServiceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FileSystemServiceComponent]
    });
    fixture = TestBed.createComponent(FileSystemServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
