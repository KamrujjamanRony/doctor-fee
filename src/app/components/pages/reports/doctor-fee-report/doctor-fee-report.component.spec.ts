import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorFeeReportComponent } from './doctor-fee-report.component';

describe('DoctorFeeReportComponent', () => {
  let component: DoctorFeeReportComponent;
  let fixture: ComponentFixture<DoctorFeeReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorFeeReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorFeeReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
