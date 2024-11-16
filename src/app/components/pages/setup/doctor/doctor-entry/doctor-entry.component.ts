import { Component, ElementRef, inject, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputComponent } from '../../../../shared/input/input.component';
import { CommonModule, DatePipe, JsonPipe } from '@angular/common';
import { SearchComponent } from '../../../../shared/svg/search/search.component';
import { DownArrowComponent } from '../../../../shared/svg/down-arrow/down-arrow.component';
import { ToastSuccessComponent } from '../../../../shared/toast/toast-success/toast-success.component';
import { DoctorService } from '../../../../../services/doctor.service';
import { DataFetchService } from '../../../../../services/useDataFetch';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';

@Component({
  selector: 'app-doctor-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputComponent, SearchComponent, DownArrowComponent, ToastSuccessComponent],
  templateUrl: './doctor-entry.component.html',
  styleUrl: './doctor-entry.component.css'
})
export class DoctorEntryComponent {
  fb = inject(NonNullableFormBuilder);
  private doctorService = inject(DoctorService);
  dataFetchService = inject(DataFetchService);
  filteredDoctorList = signal<any[]>([]);

  options: any[] = [{ id: 1, name: 'Yes' }, { id: 0, name: 'No' }];
  optionsD: any[] = [{ id: 0, name: 'No' }, { id: 1, name: 'Yes' }];
  mpoOptions: string[] = [];
  isDropdownOpen: boolean = false;
  selectedDoctor: any;
  newMpo: string = '';
  highlightedIndex: number = -1;
  highlightedTr: number = -1;
  success = signal<any>("");

  private searchQuery$ = new BehaviorSubject<string>('');
  today = new Date();
  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  @ViewChildren(InputComponent) formInputs!: QueryList<InputComponent>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  isSubmitted = false;
  form = this.fb.group({
    name: ['', [Validators.required]],
    address: [''],
    contactNo: [''],
    takeCom: [0],
    isChamberDoctor: [0],
    mpoId: [''],
    userName: [''],
    valid: [0],
    entryDate: [this.today],
    reportUserName: [''],
    drFee: [null],
  });

  transform(value: any, args?: any): any {
    if (!value) return null;
    const datePipe = new DatePipe('en-US');
    return datePipe.transform(value, 'dd/MM/yyyy');
  }

  is(value: any) {
    return value == 1 ? "Yes" : "No";
  }

  ngOnInit() {
    this.onLoadDoctors();

    // Focus on the search input when the component is initialized
    setTimeout(() => {
      this.searchInput.nativeElement.focus();
    }, 0); // Use setTimeout to ensure the DOM is ready
  }

  onLoadDoctors() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.doctorService.getAllDoctors());
    data$.subscribe(data => this.filteredDoctorList.set(data));
    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
    // Combine the original data stream with the search query to create a filtered list
    combineLatest([
      data$,
      this.searchQuery$
    ]).pipe(
      map(([data, query]) =>
        data.filter((doctorData: any) =>
          doctorData.name?.toLowerCase().includes(query) ||
          doctorData.contactNo?.includes(query) ||
          doctorData.regNo?.includes(query)
        )
      )
    ).subscribe(filteredData => this.filteredDoctorList.set(filteredData));
  }

  // Method to filter Doctor list based on search query
  onSearchDoctor(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery$.next(query);
  }

  // Simplified method to get form controls
  getControl(controlName: string): FormControl {
    return this.form.get(controlName) as FormControl;
  }

  // Function to add a new sticker name
  addMpo(e: Event) {
    e.preventDefault();
    const currentValue = this.getControl('mpoId').value;
    if (currentValue && !this.mpoOptions.includes(currentValue)) {
      this.mpoOptions.push(currentValue);
      this.getControl('mpoId').setValue('');
      this.isDropdownOpen = false; // Close the dropdown after adding
    }
  }

  // Toggle dropdown visibility
  toggleDropdown(e: any) {
    e.preventDefault();
    this.isDropdownOpen = !this.isDropdownOpen;
    this.highlightedIndex = -1; // Reset the highlighted index
  }

  // Set the sticker name from the dropdown
  selectMpo(option: string) {
    this.getControl('mpoId').setValue(option);
    this.isDropdownOpen = false; // Close the dropdown
    this.highlightedIndex = -1; // Reset the highlighted index
  }

  // Handle the Down arrow key to open the dropdown
  handleMpoKeyDown(event: KeyboardEvent) {
    // If the down arrow key is pressed
    if (event.key === 'ArrowDown') {
      this.isDropdownOpen = true; // Open the dropdown
      event.preventDefault(); // Prevent default behavior (e.g., scrolling)
    }
    // If the dropdown is open, handle arrow keys and Enter
    if (this.isDropdownOpen && this.mpoOptions.length > 0) {
      if (event.key === 'ArrowDown') {
        // Move down in the list
        this.highlightedIndex =
          (this.highlightedIndex + 1) % this.mpoOptions.length;
        event.preventDefault(); // Prevent scrolling
      } else if (event.key === 'ArrowUp') {
        // Move up in the list
        this.highlightedIndex =
          (this.highlightedIndex - 1 + this.mpoOptions.length) %
          this.mpoOptions.length;
        event.preventDefault(); // Prevent scrolling
      } else if (event.key === 'Enter') {
        // Select the highlighted option on Enter
        if (this.highlightedIndex !== -1) {
          this.selectMpo(this.mpoOptions[this.highlightedIndex]);
          this.isDropdownOpen = false; // Close the dropdown after selection
        }
      }
    }
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
    if (this.filteredDoctorList().length === 0) {
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
      this.highlightedTr = (this.highlightedTr + 1) % this.filteredDoctorList().length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr =
        (this.highlightedTr - 1 + this.filteredDoctorList().length) % this.filteredDoctorList().length;
    } else if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission

      // Call onUpdate for the currently highlighted item
      if (this.highlightedTr !== -1) {
        const selectedItem = this.filteredDoctorList()[this.highlightedTr];
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
      if (this.selectedDoctor) {
        this.doctorService.updateDoctor(this.selectedDoctor.id, this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.success.set("Doctor successfully updated!");
                this.filteredDoctorList.set([...this.filteredDoctorList(), this.form.value])
                this.isSubmitted = false;
                this.selectedDoctor = null;
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
      } else {
        this.doctorService.addDoctor(this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.success.set("Doctor successfully added!");
                this.filteredDoctorList.set([...this.filteredDoctorList(), this.form.value])
                this.isSubmitted = false;
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
    } else {
      console.log('Form is invalid');
    }
  }

  onUpdate(data: any) {
    this.selectedDoctor = data;
    this.form.patchValue({
      name: data?.name,
      address: data?.address,
      contactNo: data?.contactNo,
      takeCom: data?.takeCom,
      isChamberDoctor: data?.isChamberDoctor,
      mpoId: data?.mpoId,
      userName: data?.userName,
      valid: data?.valid,
      entryDate: data?.entryDate,
      reportUserName: data?.reportUserName,
      drFee: data?.drFee,
    });

    // Focus the 'Name' input field after patching the value
    setTimeout(() => {
      const NameInput = this.formInputs.find(input => input.label === 'Doctor Name');
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
      name: '',
      address: '',
      contactNo: '',
      takeCom: 0,
      isChamberDoctor: 0,
      mpoId: '',
      userName: '',
      valid: 0,
      entryDate: this.today,
      reportUserName: '',
      drFee: null,
    });
    this.selectedDoctor = null;
  }

}
