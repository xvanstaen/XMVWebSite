import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ManageCacheFiles } from "./manage-cache-files";

describe("ManageCacheFiles", () => {
  let component: ManageCacheFiles;
  let fixture: ComponentFixture<ManageCacheFiles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageCacheFiles],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageCacheFiles);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
