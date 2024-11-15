import { Component, ElementRef, inject, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PatientService } from '../../../../../services/patient.service';
import { DataFetchService } from '../../../../../services/useDataFetch';
import { InputComponent } from '../../../../shared/input/input.component';
import { CommonModule, DatePipe } from '@angular/common';
import { ToastSuccessComponent } from "../../../../shared/toast/toast-success/toast-success.component";
import { SearchComponent } from "../../../../shared/svg/search/search.component";
import { DoctorService } from '../../../../../services/doctor.service';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { DoctorFeeFeeService } from '../../../../../services/doctor-fee.service';

@Component({
  selector: 'app-doctor-fee',
  standalone: true,
  imports: [ReactiveFormsModule, ToastSuccessComponent, SearchComponent, InputComponent, CommonModule],
  templateUrl: './doctor-fee.component.html',
  styleUrl: './doctor-fee.component.css'
})
export class DoctorFeeComponent {
  fb = inject(NonNullableFormBuilder);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private doctorFeeService = inject(DoctorFeeFeeService);
  dataFetchService = inject(DataFetchService);
  filteredPatientList = signal<any[]>([]);
  filteredDoctorList = signal<any[]>([]);
  filteredDoctorFeeList = signal<any[]>([]);
  private searchQuery$ = new BehaviorSubject<string>('');
  options: any[] = [{ id: 'Outdoor', name: 'Outdoor' }, { id: 'Indoor', name: 'Indoor' }, { id: 'Emergency', name: 'Emergency' }];
  selectedDoctor: any;
  selectedPatient: any;
  selected: any;

  highlightedIndex: number = -1;
  highlightedTr: number = -1;

  success = signal<any>("");
  today = new Date();
  @ViewChildren(InputComponent) formInputs!: QueryList<InputComponent>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  isSubmitted = false;
  form = this.fb.group({
    doctor: ['', [Validators.required]],
    patient: ['', [Validators.required]],
    patientType: ['Outdoor'],
    amount: [''],
    discount: [''],
    Remarks: [''],
    PostedBy: [''],
    EntryDate: [this.today],
  });
isLoading$: Observable<any> | undefined;
hasError$: Observable<any> | undefined;

  transform(value: any, args: any = 'dd/MM/yyyy'): any {
    if (!value) return null;
    const datePipe = new DatePipe('en-US');
    return datePipe.transform(value, args);
  }

  ngOnInit() {
    this.onLoadDoctorFees();
    this.onLoadPatients();
    this.onLoadDoctors();

    // Focus on the search input when the component is initialized
    setTimeout(() => {
      this.searchInput.nativeElement.focus();
      console.log(this.filteredDoctorList())
      console.log(this.filteredDoctorFeeList())
      console.log(this.filteredPatientList())
    }, 500); // Use setTimeout to ensure the DOM is ready
  }

  onLoadPatients() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.patientService.getAllPatients());
    data$.subscribe(data => this.filteredPatientList.set(data));
    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
  }

  onLoadDoctors() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.doctorService.getAllDoctors());
    data$.subscribe(data => this.filteredDoctorList.set(data));
    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
  }

  onLoadDoctorFees() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.doctorFeeService.getAllDoctorFees());
    data$.subscribe(data => this.filteredDoctorFeeList.set(data));
    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
    // Combine the original data stream with the search query to create a filtered list
    combineLatest([
      data$,
      this.searchQuery$
    ]).pipe(
      map(([data, query]) =>
        data.filter((doctorFeeData: any) =>
          doctorFeeData.doctor?.toLowerCase().includes(query) ||
          doctorFeeData.patient?.includes(query)
        )
      )
    ).subscribe(filteredData => this.filteredDoctorFeeList.set(filteredData));
  }

  // Method to filter DoctorFee list based on search query
  onSearchDoctorFee(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery$.next(query);
  }

  onDoctorChange(data: any){
    this.selectedDoctor = data;
    this.form.patchValue({
      doctor: this.selectedDoctor.id,
    });
  }

  onPatientChange(data: any){
    this.selectedPatient = data;
    this.form.patchValue({
      patient: this.selectedPatient.id,
    });
  }

  // Simplified method to get form controls
  getControl(controlName: string): FormControl {
    return this.form.get(controlName) as FormControl;
  }

  // Handle the Enter key to focus the next input field
  handleEnterKey(event: Event, index: number) {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter') {
      event.preventDefault(); // Prevent form submission
      const inputsArray = this.formInputs.toArray();

      if (index < inputsArray.length) {
        const nextInput = inputsArray[index + 1];

        if (nextInput && nextInput.inputRef) {
          // If the next input is a submit button
          if (nextInput.cType === 'submit') {
            // Check if it's already focused; if not, focus it first
            (document.activeElement !== nextInput.inputRef.nativeElement) && nextInput.inputRef.nativeElement.focus();
          } else {
            // Focus on the next input if it's not a submit button
            nextInput.inputRef.nativeElement.focus();
          }
        } else {
          // Submit the form if it's already focused and Enter is pressed
          this.onSubmit(event);
        }
      }
    }
  }

  // Handle key navigation in the search input
  handleSearchKeyDown(event: KeyboardEvent) {
    if (this.filteredPatientList().length === 0) {
      return; // Exit if there are no items to navigate
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr = (this.highlightedTr + 1) % this.filteredPatientList().length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr =
        (this.highlightedTr - 1 + this.filteredPatientList().length) % this.filteredPatientList().length;
    } else if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission

      // Call onUpdate for the currently highlighted item
      if (this.highlightedTr !== -1) {
        const selectedItem = this.filteredDoctorFeeList()[this.highlightedTr];
        this.onUpdate(selectedItem); // Execute onUpdate for the selected row
        this.highlightedTr = -1;
      }
    }
  }

  onSubmit(e: Event) {
    this.isSubmitted = true;
    console.log(this.form.value);
    if (this.form.valid) {
      // console.log(this.form.value);
      if (this.selected) {
        this.doctorFeeService.updateDoctorFee(this.selected.id, this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.success.set("Patient successfully updated!");
                this.formReset(e);
                this.onLoadDoctorFees();
                this.isSubmitted = false;
                this.selected = null;
                setTimeout(() => {
                  this.success.set("");
                }, 3000);
              }

            },
            error: (error) => {
              console.error('Error register:', error);
            }
          });
      } else {
        this.doctorFeeService.addDoctorFee(this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.success.set("Patient successfully added!");
                this.formReset(e);
                this.onLoadDoctorFees();
                this.isSubmitted = false;
                setTimeout(() => {
                  this.success.set("");
                }, 3000);
              }

            },
            error: (error) => {
              console.error('Error register:', error);
            }
          });
      }
    } else {
      console.log('Form is invalid');
    }
  }

  onUpdate(data: any) {
    this.selected = data;
    console.log(data)
    this.form.patchValue({
      doctor: data?.doctor,
      patient: data?.patient,
      patientType: data?.patientType,
      amount: data?.amount,
      discount: data?.discount,
      Remarks: data?.Remarks,
      PostedBy: data?.PostedBy,
      EntryDate: data?.EntryDate,
    });

    // Focus the 'Name' input field after patching the value
    setTimeout(() => {
      const NameInput = this.formInputs.find(input => input.label === 'Contact No');
      if (NameInput && NameInput.inputRef) {
        NameInput.inputRef.nativeElement.focus(); // Programmatically focus the Name input
      }
    }, 0); // Delay to ensure the DOM is updated

    // Reset the highlighted row
    this.highlightedIndex = -1;
  }

  formReset(e: Event): void {
    e.preventDefault();
    this.form.reset({
      doctor: '',
      patient: '',
      patientType: 'Outdoor',
      amount: '',
      discount: '',
      Remarks: '',
      PostedBy: '',
      EntryDate: this.today
    });
  }


}
