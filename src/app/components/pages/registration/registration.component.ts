import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, inject, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SearchComponent } from '../../shared/svg/search/search.component';
import { ToastSuccessComponent } from '../../shared/toast/toast-success/toast-success.component';
import { PatientService } from '../../../services/patient.service';
import { DataFetchService } from '../../../services/useDataFetch';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { FieldComponent } from "../../shared/field/field.component";

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [ReactiveFormsModule, SearchComponent, ToastSuccessComponent, CommonModule, FieldComponent],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.css'
})
export class RegistrationComponent {
onPatientSearchChange($event: Event) {
throw new Error('Method not implemented.');
}
handlePatientKeyDown($event: KeyboardEvent) {
throw new Error('Method not implemented.');
}
  fb = inject(NonNullableFormBuilder);
  private patientService = inject(PatientService);
  dataFetchService = inject(DataFetchService);
  filteredPatientList = signal<any[]>([]);
  private searchQuery$ = new BehaviorSubject<string>('');
  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  options: any[] = [{ id: '', name: 'Select Sex' }, { id: 'Male', name: 'Male' }, { id: 'Female', name: 'Female' }, { id: 'Others', name: 'Others' }];
  selectedPatient: any;

  highlightedIndex: number = -1;
  highlightedTr: number = -1;

  success = signal<any>("");
  today = new Date();
  @ViewChildren('inputRef') inputRefs!: QueryList<ElementRef>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  isSubmitted = false;
  form = this.fb.group({
    regNo: [{ value: '', disabled: true }],
    name: ['', [Validators.required]],
    contactNo: ['', [Validators.required]],
    fatherName: [''],
    motherName: [''],
    sex: ['', [Validators.required]],
    dob: ['', [Validators.required]],
    nid: [''],
    address: ['', [Validators.required]],
    remarks: [''],
    postedBy: ['superSoft', [Validators.required]],
    entryDate: [this.today, [Validators.required]],
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
    data$.subscribe(data => {
      this.filteredPatientList.set(data.sort((a: any, b: any) => {
        const dateA = new Date(a.entryDate).getTime();
        const dateB = new Date(b.entryDate).getTime();
        return dateB - dateA;
      }))
    });
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


  handleEnterKey(event: Event, currentIndex: number) {
    const keyboardEvent = event as KeyboardEvent;
    event.preventDefault();
    const allInputs = this.inputRefs.toArray();
    const inputs = allInputs.filter((i: any) => !i.nativeElement.disabled);

    if (currentIndex + 1 < inputs.length) {
      inputs[currentIndex + 1].nativeElement.focus();
    } else {
      this.onSubmit(keyboardEvent);
    }
  }

  // Handle key navigation in the search input
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

  onSubmit(e: Event) {
    this.isSubmitted = true;
    this.form.get('regNo')?.enable();
    if (this.form.valid) {
      // console.log(this.form.value);
      if (this.selectedPatient) {
        this.patientService.updatePatient(this.selectedPatient.id, this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.success.set("Patient successfully updated!");
                const rest = this.filteredPatientList().filter(p => p.id !== response.id)
                this.filteredPatientList.set([response, ...rest])
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
                this.filteredPatientList.set([response, ...this.filteredPatientList()])
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
      alert('Form is invalid! Please Fill Contact No, Name, Sex, Date of Birth and Address.');
    }
    
    this.form.get('regNo')?.disable();
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
      const inputs = this.inputRefs.toArray();
      inputs[0].nativeElement.focus();
    }, 0); // Delay to ensure the DOM is updated

    // Reset the highlighted row
    this.highlightedIndex = -1;
  }

  onDelete(id: any) {
    if(confirm("Are you sure you want to delete?")) {
      this.patientService.deletePatient(id).subscribe(data => {
        if (data.id) {
          this.success.set("Doctor fee deleted successfully!");
          this.filteredPatientList.set(this.filteredPatientList().filter(d => d.id !== id));
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
    this.form.reset({
      regNo: '',
      name: '',
      contactNo: '',
      fatherName: '',
      motherName: '',
      sex: '',
      dob: '',
      nid: '',
      address: '',
      remarks: '',
      postedBy: 'superSoft',
      entryDate: this.today
    });
    this.isSubmitted = false;
    this.selectedPatient = null;
  }

}
