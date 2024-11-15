import { TestBed } from '@angular/core/testing';

import { DoctorFeeService } from './doctor-fee.service';

describe('DoctorFeeService', () => {
  let service: DoctorFeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DoctorFeeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
