import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, inject, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputComponent } from '../../shared/input/input.component';
import { SearchComponent } from '../../shared/svg/search/search.component';
import { ToastSuccessComponent } from '../../shared/toast/toast-success/toast-success.component';
import { PatientService } from '../../../services/patient.service';
import { DataFetchService } from '../../../services/useDataFetch';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [ReactiveFormsModule, InputComponent, SearchComponent, ToastSuccessComponent, CommonModule],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.css'
})
export class RegistrationComponent {
  fb = inject(NonNullableFormBuilder);
  private patientService = inject(PatientService);
  dataFetchService = inject(DataFetchService);
  filteredPatientList = signal<any[]>([]);
  private searchQuery$ = new BehaviorSubject<string>('');
  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  options: any[] = [{ id: 'Male', name: 'Male' }, { id: 'Female', name: 'Female' }, { id: 'Others', name: 'Others' }];
  selectedPatient: any;

  highlightedIndex: number = -1;
  highlightedTr: number = -1;

  success = signal<any>("");
  today = new Date();
  @ViewChildren(InputComponent) formInputs!: QueryList<InputComponent>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  isSubmitted = false;
  form = this.fb.group({
    regNo: [''],
    name: ['', [Validators.required]],
    contactNo: ['', [Validators.required]],
    fatherName: [''],
    motherName: [''],
    sex: ['Male'],
    dob: [''],
    nid: [''],
    address: [''],
    remarks: [''],
    postedBy: [''],
    entryDate: [this.today],
  });

  transform(value: any, args: any = 'dd/MM/yyyy'): any {
    if (!value) return null;
    const datePipe = new DatePipe('en-US');
    return datePipe.transform(value, args);
  }

  ngOnInit() {
    this.onLoadPatients();

    // Focus on the search input when the component is initialized
    setTimeout(() => {
      this.searchInput.nativeElement.focus();
    }, 0); // Use setTimeout to ensure the DOM is ready
  }

  onLoadPatients() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.patientService.getAllPatients());
    data$.subscribe(data => this.filteredPatientList.set(data));
    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
    // Combine the original data stream with the search query to create a filtered list
    combineLatest([
      data$,
      this.searchQuery$
    ]).pipe(
      map(([data, query]) =>
        data.filter((patientData: any) =>
          patientData.name?.toLowerCase().includes(query) ||
          patientData.contactNo?.includes(query) ||
          patientData.regNo?.includes(query)
        )
      )
    ).subscribe(filteredData => this.filteredPatientList.set(filteredData));
  }

  // Method to filter Patient list based on search query
  onSearchPatient(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery$.next(query);
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
        const selectedItem = this.filteredPatientList()[this.highlightedTr];
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
      if (this.selectedPatient) {
        this.patientService.updatePatient(this.selectedPatient.id, this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.success.set("Patient successfully updated!");
                this.filteredPatientList.set([...this.filteredPatientList(), this.form.value])
                this.formReset(e);
                this.isSubmitted = false;
                this.selectedPatient = null;
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
        this.patientService.addPatient(this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.success.set("Patient successfully added!");
                this.filteredPatientList.set([...this.filteredPatientList(), this.form.value])
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
    this.selectedPatient = data;
    this.form.patchValue({
      regNo: data?.regNo,
      name: data?.name,
      contactNo: data?.contactNo,
      fatherName: data?.fatherName,
      motherName: data?.motherName,
      sex: data?.sex,
      dob: this.transform(data?.dob, 'yyyy-MM-dd'),
      nid: data?.nid,
      address: data?.address,
      remarks: data?.remarks,
      postedBy: data?.postedBy,
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
    this.highlightedIndex = -1;
  }

  formReset(e: Event): void {
    e.preventDefault();
    this.form.reset({
      regNo: '',
      name: '',
      contactNo: '',
      fatherName: '',
      motherName: '',
      sex: 'Male',
      dob: '',
      nid: '',
      address: '',
      remarks: '',
      postedBy: '',
      entryDate: this.today
    });
    this.selectedPatient = null;
  }

}
