import { Component, ElementRef, inject, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import { FormControl, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { SearchComponent } from '../../../../shared/svg/search/search.component';
import { ToastSuccessComponent } from '../../../../shared/toast/toast-success/toast-success.component';
import { DoctorService } from '../../../../../services/doctor.service';
import { DataFetchService } from '../../../../../services/useDataFetch';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { FieldComponent } from "../../../../shared/field/field.component";

@Component({
  selector: 'app-doctor-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SearchComponent, ToastSuccessComponent, FieldComponent],
  templateUrl: './doctor-entry.component.html',
  styleUrl: './doctor-entry.component.css'
})
export class DoctorEntryComponent {
  fb = inject(NonNullableFormBuilder);
  private doctorService = inject(DoctorService);
  dataFetchService = inject(DataFetchService);
  filteredDoctorList = signal<any[]>([]);

  isChamberOptions: any[] = [{ id: "", name: 'Select' },{ id: -1, name: 'No' }, { id: 1, name: 'Yes' }];
  takeComOptions: any[] = [{ id: "", name: 'Select' },{ id: 0, name: 'No' }, { id: 1, name: 'Yes' }];
  selectedDoctor: any;
  newMpo: string = '';
  highlightedTr: number = -1;
  success = signal<any>("");

  isChamber: any = "";
  takeCom: any = "";

  private searchQuery$ = new BehaviorSubject<string>('');
  today = new Date();
  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  @ViewChildren('inputRef') inputRefs!: QueryList<ElementRef>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  isSubmitted = false;
  form = this.fb.group({
    name: ['', [Validators.required]],
    address: [''],
    contactNo: [''],
    takeCom: [0],
    isChamberDoctor: [-1],
    mpoId: [0],
    userName: ['superSoft', [Validators.required]],
    valid: [0],
    entryDate: [this.today],
    reportUserName: ['superSoft', [Validators.required]],
    drFee: [0],
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
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.doctorService.getFilterDoctors(this.isChamber, this.takeCom));
    data$.subscribe(data => {
      this.filteredDoctorList.set(data.sort((a: any, b: any) => {
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
  
  handleSearchKeyDown(event: KeyboardEvent) {
    if (this.filteredDoctorList().length === 0) {
      return; // Exit if there are no items to navigate
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const inputs = this.inputRefs.toArray();
      inputs[0].nativeElement.focus();
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
        this.onUpdate(selectedItem);
        this.highlightedTr = -1;
      }
    }
  }

  onSelectInputChange(): void {
    console.log(this.isChamber)
  }

  onSubmit(e: Event) {
    this.isSubmitted = true;
    if (this.form.valid) {
      this.form.value.drFee ?? this.form.patchValue({drFee: 0});
      // console.log(this.form.value);
      if (this.selectedDoctor) {
        this.doctorService.updateDoctor(this.selectedDoctor.id, this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.success.set("Doctor successfully updated!");
                const rest = this.filteredDoctorList().filter(d => d.id !== response.id);
                this.filteredDoctorList.set([response, ...rest]);
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
                this.filteredDoctorList.set([response, ...this.filteredDoctorList()])
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
      alert('Form is invalid! Please Fill Name Field.');
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
      drFee: data?.drFee || 0,
    });

    // Focus the 'Name' input field after patching the value
    setTimeout(() => {
      const inputs = this.inputRefs.toArray();
      inputs[0].nativeElement.focus();
    }, 0); // Delay to ensure the DOM is updated
  }

  onDelete(id: any) {
    if(confirm("Are you sure you want to delete?")) {
      this.doctorService.deleteDoctor(id).subscribe(data => {
        if (data.id) {
          this.success.set("Doctor deleted successfully!");
          this.filteredDoctorList.set(this.filteredDoctorList().filter(d => d.id !== id));
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
      name: '',
      address: '',
      contactNo: '',
      takeCom: 0,
      isChamberDoctor: -1,
      mpoId: 0,
      userName: 'superSoft',
      valid: 0,
      entryDate: this.today,
      reportUserName: 'superSoft',
      drFee: 0,
    });
    this.isSubmitted = false;
    this.selectedDoctor = null;
  }

  // ----------Mpo---------------------------------------------------------------------------------
  // mpoOptions: string[] = [];
  // isDropdownOpen: boolean = false;
  // highlightedIndex: number = -1;
  
  // addMpo(e: Event) {
  //   e.preventDefault();
  //   const currentValue = this.getControl('mpoId').value;
  //   if (currentValue && !this.mpoOptions.includes(currentValue)) {
  //     this.mpoOptions.push(currentValue);
  //     this.getControl('mpoId').setValue('');
  //     this.isDropdownOpen = false;
  //   }
  // }
  
  // toggleDropdown(e: any) {
  //   e.preventDefault();
  //   this.isDropdownOpen = !this.isDropdownOpen;
  //   this.highlightedIndex = -1;
  // }
  
  // selectMpo(option: string) {
  //   this.getControl('mpoId').setValue(option);
  //   this.isDropdownOpen = false;
  //   this.highlightedIndex = -1;
  // }
  
  // handleMpoKeyDown(event: KeyboardEvent) {
  //   if (event.key === 'ArrowDown') {
  //     this.isDropdownOpen = true;
  //     event.preventDefault();
  //   }
    
  //   if (this.isDropdownOpen && this.mpoOptions.length > 0) {
  //     if (event.key === 'ArrowDown') {
  //       this.highlightedIndex =
  //         (this.highlightedIndex + 1) % this.mpoOptions.length;
  //       event.preventDefault();
  //     } else if (event.key === 'ArrowUp') {
  //       this.highlightedIndex =
  //         (this.highlightedIndex - 1 + this.mpoOptions.length) %
  //         this.mpoOptions.length;
  //       event.preventDefault();
  //     } else if (event.key === 'Enter') {
  //       if (this.highlightedIndex !== -1) {
  //         this.selectMpo(this.mpoOptions[this.highlightedIndex]);
  //         this.isDropdownOpen = false;
  //       }
  //     }
  //   }
  // }
  // ----------Mpo End---------------------------------------------------------------------------------

}
