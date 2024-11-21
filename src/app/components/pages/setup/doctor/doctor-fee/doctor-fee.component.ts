import { Component, ElementRef, inject, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import { FormControl, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PatientService } from '../../../../../services/patient.service';
import { DataFetchService } from '../../../../../services/useDataFetch';
import { CommonModule, DatePipe } from '@angular/common';
import { ToastSuccessComponent } from "../../../../shared/toast/toast-success/toast-success.component";
import { SearchComponent } from "../../../../shared/svg/search/search.component";
import { DoctorService } from '../../../../../services/doctor.service';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { DoctorFeeFeeService } from '../../../../../services/doctor-fee.service';
import { FieldComponent } from "../../../../shared/field/field.component";
import { ModalWrapperComponent } from "../../../../shared/modal-wrapper/modal-wrapper.component";


@Component({
  selector: 'app-doctor-fee',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, ToastSuccessComponent, SearchComponent, CommonModule, FieldComponent, ModalWrapperComponent],
  templateUrl: './doctor-fee.component.html',
  styleUrl: './doctor-fee.component.css'
})
export class DoctorFeeComponent {
  fb = inject(NonNullableFormBuilder);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private doctorFeeService = inject(DoctorFeeFeeService);
  dataFetchService = inject(DataFetchService);
  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  filteredPatientList = signal<any[]>([]);
  filteredDoctorList = signal<any[]>([]);
  filteredDoctorFeeList = signal<any[]>([]);
  success = signal<any>("");
  private searchQuery$ = new BehaviorSubject<string>('');
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChildren('inputRef') inputRefs!: QueryList<ElementRef>;
  options: any[] = ['New', 'Old', 'Others'];
  selectedDoctor: any;
  selectedPatient: any;
  selected: any;
  fromDate: any;
  toDate: any;
  nextFollowDate: any;
  highlightedTr: number = -1;
  today = new Date();
  isSubmitted = false;

  form = this.fb.group<any>({
    doctorId: [{ value: '', disabled: false }, [Validators.required]],
    patientRegId: [{ value: '', disabled: false }, [Validators.required]],
    patientType: ['New', [Validators.required]],
    amount: [''],
    discount: [''],
    remarks: [''],
    postBy: [''],
    nextFlowDate: [null],
    entryDate: [this.today, [Validators.required]],
  });


  // ------ Fetch Methods -------------------------------------------------------------
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
      this.patientOptions = this.filteredPatientList().map(p => ({ id: p.id, name: `${p.regNo} - ${p.name} - ${p.contactNo}` }));
    });
  }

  onLoadDoctors() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.doctorService.getAllDoctors());
    data$.subscribe(data => {
      this.filteredDoctorList.set(data);
      this.doctorOptions = this.filteredDoctorList().map(d => ({ id: d.id, name: d.name, drFee: d.drFee }));
    });
  }

  onLoadDoctorFees() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.doctorFeeService.getAllDoctorFees());
    data$.subscribe((data: any[]) => {
      this.filteredDoctorFeeList.set(data.sort((a: any, b: any) => {
        const dateA = new Date(a.entryDate).getTime();
        const dateB = new Date(b.entryDate).getTime();
        return dateB - dateA;
      }));
    });
    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
    // Combine the original data stream with the search query to create a filtered list
    combineLatest([
      data$,
      this.searchQuery$
    ]).pipe(
      map(([data, query]) =>
        data.filter((filterData: any) =>
          filterData.regNo?.toString()?.toLowerCase()?.includes(query) ||
          filterData.doctorName?.toString()?.toLowerCase()?.includes(query) ||
          filterData.patientName?.toString()?.toLowerCase()?.includes(query) ||
          filterData.contactNo?.toString()?.toLowerCase()?.includes(query) ||
          filterData.patientType?.toString()?.toLowerCase()?.includes(query) ||
          filterData.remarks?.toString()?.toLowerCase()?.includes(query) ||
          filterData.postBy?.toString()?.toLowerCase()?.includes(query)
        )
      )
    ).subscribe(filteredData => this.filteredDoctorFeeList.set(filteredData));
  }

  onFilterData() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.doctorFeeService.getFilteredDoctorFee(this.fromDate, this.toDate, this.nextFollowDate));
    data$.subscribe(data => {
      this.filteredDoctorFeeList.set(data);
    });
    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
  }

  onSearchDoctorFee(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery$.next(query);
  }
  // ------ Fetch Methods End -------------------------------------------------------------

  // All Form methods ----------------------------------------------------------------
  getControl(controlName: string): FormControl {
    return this.form.get(controlName) as FormControl;
  }

  onSubmit(e: Event) {
    this.isSubmitted = true;
    this.form.get('doctorId')?.enable();
    this.isDoctorEnable = true;
    this.form.get('patientRegId')?.enable();
    this.isPatientEnable = true;
    console.log(this.form.value)
    if (this.form.valid) {
      console.log(this.form.get('nextFlowDate')?.value === "" ? "get the value" : "not found")
      this.form.get('nextFlowDate')?.value === "" ? this.form.patchValue({nextFlowDate: null}) : "ami pari na ar";
      if (!this.selected) {
        this.doctorFeeService.addDoctorFee(this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.success.set("Patient successfully added!");
                this.filteredDoctorFeeList.set([response, ...this.filteredDoctorFeeList()])
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
      } else {
        this.doctorFeeService.updateDoctorFee(this.selected, this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.success.set("Patient successfully updated!");
                console.log(response)
                const rest = this.filteredDoctorFeeList().filter(d => d.gid !== response.gid);
                this.filteredDoctorFeeList.set([response, ...rest]);
                this.isSubmitted = false;
                this.selected = null;
                this.formReset(e);
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

      this.followupModal = false;

    } else {
      console.log('Form is invalid');
    }
  }

  onUpdate(data: any) {
    this.selected = data.gid;
    console.log(data)

    // Format the nextFlowDate to YYYY-MM-DD
    const formattedDate = data?.nextFlowDate
  ? (() => {
      const date = new Date(data.nextFlowDate);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    })()
  : '';

    console.log(formattedDate)

    this.form.patchValue({
      patientRegId: data?.patientRegId,
      doctorId: data?.doctorId,
      patientType: data?.patientType,
      amount: data?.amount,
      discount: data?.discount,
      remarks: data?.remarks,
      postBy: data?.postBy,
      nextFlowDate: formattedDate,
      entryDate: data?.entryDate,
    });

    // Focus the 'Name' input field after patching the value
    setTimeout(() => {
      const inputs = this.inputRefs.toArray();
      inputs[0].nativeElement.focus();
    }, 10); // Delay to ensure the DOM is updated

    // Reset the highlighted row
    this.highlightedIndexPatient = -1;
  }

  onDelete(id: any) {
    if (confirm("Are you sure you want to delete?")) {
      this.doctorFeeService.deleteDoctorFee(id).subscribe(data => {
        if (data.gid) {
          this.success.set("Doctor fee deleted successfully!");
          this.filteredDoctorFeeList.set(this.filteredDoctorFeeList().filter(d => d.gid !== id));
          setTimeout(() => {
            this.success.set("");
          }, 3000);
        } else {
          console.error('Error deleting doctor fee:', data);
        }
      });
    }
  }

  formReset(e: Event): void {
    e.preventDefault();
    this.form.get('doctorId')?.enable();
    this.isDoctorEnable = true;
    this.form.get('patientRegId')?.enable();
    this.isPatientEnable = true;
    this.form.reset({
      doctorId: '',
      patientRegId: '',
      patientType: 'New',
      amount: '',
      discount: '',
      remarks: '',
      postBy: '',
      nextFlowDate: null,
      entryDate: this.today
    });
    this.selected = null;
  }

  handleClearFilter() {
    this.searchQuery$.next("");
    this.searchInput.nativeElement.value = "";
    this.fromDate = '';
    this.toDate = '';
    this.nextFollowDate = '';
  }
   // All Form methods End ----------------------------------------------------------------

   // All Utilities ----------------------------------------------------------------
  transform(value: any, args: any = 'dd/MM/yyyy'): any {
    if (!value) return null;
    const datePipe = new DatePipe('en-US');
    return datePipe.transform(value, args);
  }

  handleEnterKey(event: Event, currentIndex: number) {
    const keyboardEvent = event as KeyboardEvent;
    event.preventDefault();
    const inputs = this.inputRefs.toArray();

    if (currentIndex + 1 < inputs.length) {
      // If the next input exists, focus it
      inputs[currentIndex + 1].nativeElement.focus();
    } else {
      // Optionally, submit the form if it's the last input
      this.onSubmit(keyboardEvent);
    }
  }
  
  handleSearchKeyDown(event: KeyboardEvent) {
    if (this.filteredPatientList().length === 0) {
      return; // Exit if there are no items to navigate
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const inputs = this.inputRefs.toArray();
      inputs[0].nativeElement.focus();
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
        const selectedItem = this.filteredPatientList()[this.highlightedTr];
        this.onUpdate(selectedItem);
        this.highlightedTr = -1;
      }
    }
  }
   // All Utilities End ----------------------------------------------------------------

  // ----------patientRegId---------------------------------------------------------------------------------
  isPatientDropdownOpen: boolean = false;
  patientOptions: any[] = [];
  highlightedIndexPatient: number = -1;
  isPatientEnable: boolean = true;

  displayPatient(id: any) {
    const find = this.patientOptions.find(p => p.id === id);
    return find?.name ?? '';
  }

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
          this.onSelectPatient(this.patientOptions[this.highlightedIndexPatient]);
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

  onSelectPatient(option: any) {
    this.getControl('patientRegId').setValue(option?.id ?? this.patientOptions[this.highlightedIndexPatient]?.id);
    this.isPatientDropdownOpen = false;
    this.form.get('patientRegId')?.disable();
    this.isPatientEnable = false;
    this.highlightedIndexPatient = -1;
  }

  onPatientChange(data: any) {
    this.selectedPatient = data;
    this.form.patchValue({
      patientRegId: this.selectedPatient.id,
    });
  }

  onPatientSearchChange(event: Event) {
    const searchValue = (event.target as HTMLInputElement).value?.toLowerCase();
    this.patientOptions = this.filteredPatientList().filter(option =>
      option.name.toLowerCase().includes(searchValue) ||
      option.regNo.toString().toLowerCase().includes(searchValue) ||
      option.contactNo.toString().toLowerCase().includes(searchValue)
    ).map(p => ({ id: p.id, name: `${p.regNo} - ${p.name} - ${p.contactNo}` }));
    this.highlightedIndexPatient = -1;
    if (searchValue === '') {
      this.isPatientDropdownOpen = false;
    } else {
      this.isPatientDropdownOpen = true;
    }
  }

  getPatientName(id: any) {
    const patient = this.filteredPatientList().find(p => p.id == id);
    return patient?.name ?? '';
  }
  
  onClearPatient(event: Event){
    event.preventDefault();
    this.form.get('patientRegId')?.enable();
    this.form.patchValue({
      patientRegId: ''
    });
    this.isPatientEnable = true;
  }
  //----------patientRegId End-------------------------------------------------------------------------

  // ----------doctorId---------------------------------------------------------------------------------
  isDoctorDropdownOpen: boolean = false;
  doctorOptions: any[] = [];
  highlightedIndexDoctor: number = -1;
  isDoctorEnable: boolean = true;

  displayDoctor(id: any) {
    const find = this.doctorOptions.find(p => p.id === id);
    return find?.name ?? '';
  }

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
          this.selectDoctor(this.doctorOptions[this.highlightedIndexDoctor]);
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
    this.getControl('discount').setValue(0);
    this.isDoctorDropdownOpen = false;
    this.form.get('doctorId')?.disable();
    this.isDoctorEnable = false;
    this.highlightedIndexDoctor = -1;
  }

  onDoctorChange(data: any) {
    this.selectedDoctor = data;
    this.form.patchValue({
      doctorId: this.selectedDoctor.id,
    });
  }

  onDoctorSearchChange(event: Event) {
    const searchValue = (event.target as HTMLInputElement).value?.toLowerCase();
    this.doctorOptions = this.filteredDoctorList().filter(option =>
      option.name.toLowerCase().includes(searchValue)
    ).map(p => ({ id: p.id, name: p.name }));
    this.highlightedIndexDoctor = -1;
    if (searchValue === '') {
      this.isDoctorDropdownOpen = false;
    } else {
      this.isDoctorDropdownOpen = true;
    }
  }

  getDoctorName(id: any) {
    const doctor = this.filteredDoctorList().find(p => p.id == id);
    return doctor?.name ?? '';
  }
  

  onClearDoctor(event: Event){
    event.preventDefault();
    this.form.get('doctorId')?.enable();
    this.form.patchValue({
      doctorId: '',
      amount: 0
    });
    this.isDoctorEnable = true;
  }
  //----------doctorId End----------------------------------------------------------------------

  // Modals --------------------------------------------------------------------------
  followupModal = false;
  followupModalData: any;

  onFollowUpUpdate(item: any) {
    this.followupModalData = item;
    this.followupModal = true;
    this.onUpdate(item);
  }

  closeFollowupModal() {
    this.followupModal = false;
    this.form.reset({
      doctorId: '',
      patientRegId: '',
      patientType: 'New',
      amount: '',
      discount: '',
      remarks: '',
      postBy: '',
      nextFlowDate: null,
      entryDate: this.today
    });
    this.selected = null;
    this.isSubmitted = false;
    this.highlightedTr = -1;
  }
  // Modals End --------------------------------------------------------------------------
}
