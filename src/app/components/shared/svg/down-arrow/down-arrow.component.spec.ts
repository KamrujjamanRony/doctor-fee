import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownArrowComponent } from './down-arrow.component';

describe('DownArrowComponent', () => {
  let component: DownArrowComponent;
  let fixture: ComponentFixture<DownArrowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownArrowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DownArrowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
