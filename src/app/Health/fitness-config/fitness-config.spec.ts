import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FitnessConfig } from "./fitness-config";

describe("FitnessConfig", () => {
  let component: FitnessConfig;
  let fixture: ComponentFixture<FitnessConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FitnessConfig],
    }).compileComponents();

    fixture = TestBed.createComponent(FitnessConfig);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
