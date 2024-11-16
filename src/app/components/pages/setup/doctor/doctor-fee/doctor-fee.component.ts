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
import { DownArrowComponent } from "../../../../shared/svg/down-arrow/down-arrow.component";

@Component({
  selector: 'app-doctor-fee',
  standalone: true,
  imports: [ReactiveFormsModule, ToastSuccessComponent, SearchComponent, InputComponent, CommonModule, DownArrowComponent],
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

  highlightedTr: number = -1;

  success = signal<any>("");
  today = new Date();
  @ViewChildren(InputComponent) formInputs!: QueryList<InputComponent>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  isSubmitted = false;
  form = this.fb.group({
    doctorId: ['', [Validators.required]],
    patientRegId: ['', [Validators.required]],
    patientType: ['Outdoor'],
    amount: [''],
    discount: [''],
    remarks: [''],
    postBy: [''],
    entryDate: [this.today],
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
    }, 10);
  }

  onLoadPatients() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.patientService.getAllPatients());
    data$.subscribe(data => {
      this.filteredPatientList.set(data);
      this.patientOptions = this.filteredPatientList().map(p => ({ id: p.id, name: p.name }));
    });
    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
  }

  onLoadDoctors() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.doctorService.getAllDoctors());
    data$.subscribe(data => {
      this.filteredDoctorList.set(data);
      this.doctorOptions = this.filteredDoctorList().map(d => ({ id: d.id, name: d.name, drFee: d.drFee }));
    });
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
          doctorFeeData.doctorId?.toString()?.includes(query) ||
          doctorFeeData.patientRegId?.toString()?.includes(query)
        )
      )
    ).subscribe(filteredData => this.filteredDoctorFeeList.set(filteredData));
  }

  // Method to filter DoctorFee list based on search query
  onSearchDoctorFee(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery$.next(query);
  }

  onDoctorChange(data: any) {
    this.selectedDoctor = data;
    this.form.patchValue({
      doctorId: this.selectedDoctor.id,
    });
  }

  onPatientChange(data: any) {
    this.selectedPatient = data;
    this.form.patchValue({
      patientRegId: this.selectedPatient.id,
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

    if (event.key === 'Tab') {
      event.preventDefault();
      const inputsArray = this.formInputs.toArray();
      if (inputsArray.length > 0) {
        const firstInput = inputsArray[0];
        firstInput.inputRef.nativeElement.focus();
        this.highlightedTr = -1;
      }
    } else if (event.key === 'ArrowDown') {
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
      if (this.selected) {
        this.doctorFeeService.updateDoctorFee(this.selected.gid, this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.success.set("Patient successfully updated!");
                this.filteredDoctorFeeList.set([...this.filteredDoctorFeeList(), this.form.value])
                this.formReset(e);
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
                this.filteredDoctorFeeList.set([...this.filteredDoctorFeeList(), this.form.value])
                this.formReset(e);
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
    this.form.patchValue({
      doctorId: data?.doctorId,
      patientRegId: data?.patientRegId,
      patientType: data?.patientType,
      amount: data?.amount,
      discount: data?.discount,
      remarks: data?.remarks,
      postBy: data?.postBy,
      entryDate: data?.entryDate,
    });

    // Focus the 'Name' input field after patching the value
    setTimeout(() => {
      const NameInput = this.formInputs.find(input => input.label === 'Contact No');
      if (NameInput && NameInput.inputRef) {
        NameInput.inputRef.nativeElement.focus(); // Programmatically focus the Name input
      }
    }, 0); // Delay to ensure the DOM is updated

    // Reset the highlighted row
    this.highlightedIndexPatient = -1;
  }

  formReset(e: Event): void {
    e.preventDefault();
    this.form.reset({
      doctorId: '',
      patientRegId: '',
      patientType: 'Outdoor',
      amount: '',
      discount: '',
      remarks: '',
      postBy: '',
      entryDate: this.today
    });
    this.selected = null;
  }

  // ----------patientRegId---------------------------------------------------------------------------------
  isPatientDropdownOpen: boolean = false;
  patientOptions: any[] = [];
  highlightedIndexPatient: number = -1;

  handlePatientKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      this.isPatientDropdownOpen = true;
      event.preventDefault();
    }
    if (this.isPatientDropdownOpen && this.patientOptions.length > 0) {
      if (event.key === 'ArrowDown') {
        this.highlightedIndexPatient = (this.highlightedIndexPatient + 1) % this.patientOptions.length;
        event.preventDefault();
      } else if (event.key === 'ArrowUp') {
        this.highlightedIndexPatient = (this.highlightedIndexPatient - 1 + this.patientOptions.length) % this.patientOptions.length;
        event.preventDefault();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (this.highlightedIndexPatient !== -1) {
          this.selectPatient(this.patientOptions[this.highlightedIndexPatient]?.id);
          this.isPatientDropdownOpen = false;
        }
      }
    }
  }

  togglePatientDropdown(e: any) {
    e.preventDefault();
    this.isPatientDropdownOpen = !this.isPatientDropdownOpen;
    this.highlightedIndexPatient = -1;
  }

  selectPatient(option: string) {
    this.getControl('patientRegId').setValue(option);
    this.isPatientDropdownOpen = false;
    this.highlightedIndexPatient = -1;
  }

  onPatientSearchChange(event: Event) {
    const searchValue = (event.target as HTMLInputElement).value?.toLowerCase();
    this.patientOptions = this.filteredPatientList().filter(option =>
      option.name.toLowerCase().includes(searchValue) ||
      option.id.toString().includes(searchValue)
    ).map(p => ({ id: p.id, name: p.name }));
    this.highlightedIndexPatient = -1;
    if (searchValue === '') {
      this.isPatientDropdownOpen = false;
    } else {
      this.isPatientDropdownOpen = true;
    }
  }

  getPatientName(id: any){
    const patient = this.patientOptions.find(p => p.id == id);
    return patient?.name?? '';
  }
  //---------------------------------------------------------------------------------

  // ----------doctorId---------------------------------------------------------------------------------
  isDoctorDropdownOpen: boolean = false;
  doctorOptions: any[] = [];
  highlightedIndexDoctor: number = -1;

  handleDoctorKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      this.isDoctorDropdownOpen = true;
      event.preventDefault();
    }
    if (this.isDoctorDropdownOpen && this.doctorOptions.length > 0) {
      if (event.key === 'ArrowDown') {
        this.highlightedIndexDoctor = (this.highlightedIndexDoctor + 1) % this.doctorOptions.length;
        event.preventDefault();
      } else if (event.key === 'ArrowUp') {
        this.highlightedIndexDoctor = (this.highlightedIndexDoctor - 1 + this.doctorOptions.length) % this.doctorOptions.length;
        event.preventDefault();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (this.highlightedIndexDoctor !== -1) {
          this.selectDoctor(this.doctorOptions[this.highlightedIndexDoctor]?.id);
          this.isDoctorDropdownOpen = false;
        }
      }
    }
  }

  toggleDoctorDropdown(e: any) {
    e.preventDefault();
    this.isDoctorDropdownOpen = !this.isDoctorDropdownOpen;
    this.highlightedIndexDoctor = -1;
  }

  selectDoctor(option: any) {
    this.getControl('doctorId').setValue(option?.id ?? this.doctorOptions[this.highlightedIndexDoctor]?.id);
    this.getControl('amount').setValue(option?.DrFee ?? this.doctorOptions[this.highlightedIndexDoctor]?.DrFee ?? 0);
    this.isDoctorDropdownOpen = false;
    this.highlightedIndexDoctor = -1;
  }

  onDoctorSearchChange(event: Event) {
    const searchValue = (event.target as HTMLInputElement).value?.toLowerCase();
    this.doctorOptions = this.filteredDoctorList().filter(option =>
      option.name.toLowerCase().includes(searchValue) ||
      option.id.toString().includes(searchValue)
    ).map(p => ({ id: p.id, name: p.name }));
    this.highlightedIndexDoctor = -1;
    if (searchValue === '') {
      this.isDoctorDropdownOpen = false;
    } else {
      this.isDoctorDropdownOpen = true;
    }
  }

  getDoctorName(id: any){
    const doctor = this.doctorOptions.find(p => p.id == id);
    return doctor?.name?? '';
  }
  //---------------------------------------------------------------------------------


}
