import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorEntryComponent } from './doctor-entry.component';

describe('DoctorEntryComponent', () => {
  let component: DoctorEntryComponent;
  let fixture: ComponentFixture<DoctorEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorEntryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
