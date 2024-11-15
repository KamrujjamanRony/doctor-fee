import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllSvgComponent } from './all-svg.component';

describe('AllSvgComponent', () => {
  let component: AllSvgComponent;
  let fixture: ComponentFixture<AllSvgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllSvgComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllSvgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
