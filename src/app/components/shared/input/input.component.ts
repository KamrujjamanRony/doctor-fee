import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() cType: any;
  @Input() isSubmitted: boolean = false;
  @Input() options: any[] = [];
  @Output() onSelectSearchInputChange = new EventEmitter<void>();
  @ViewChild('inputRef', { static: false  }) inputRef!: ElementRef<HTMLInputElement>;  // ViewChild to get native input element

  value: any = '';                         // Store the value for the input field
  isDisabled: boolean = false;                // Store whether the input is disabled

  filteredOptions = [...this.options];
  selectedOption: any = null;
  dropdownOpen = false;
  highlightedIndex: number = -1;

  // Implement ControlValueAccessor interface
  onChange = (_: any) => {};
  onTouch = () => {};

  toggleDropdown(open: boolean) {
    this.filteredOptions = [...this.options];
    this.dropdownOpen = open;
    if (open) this.highlightedIndex = -1;
  }

  onSearchChange(event: Event) {
    const searchValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredOptions = this.options.filter(option =>
      option.Name.toLowerCase().includes(searchValue)
    );
    this.highlightedIndex = -1;
  }

  selectOption(option: any) {
    this.onSelectSearchInputChange.emit(option);
    this.value = option.Name;
    this.selectedOption = option;
    this.dropdownOpen = false;
    this.highlightedIndex = -1;
  }

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  // Handle input change
  onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (this.cType) {
      this.value = input.value;
    } else {
      // Use regular expression to prevent non-numeric and negative signs
    if (input.value.includes('-')) {
      this.value = Math.abs(parseFloat(input.value)); // Get absolute value to ensure it's positive
      (event.target as HTMLInputElement).value = this.value?.toString() || '';
    } else {
      this.value = parseFloat(input.value);
    }

    // If user inputs an invalid number (NaN), reset to null
    if (isNaN(this.value)) {
      this.value = null;
    }
    }

    this.onChange(this.value);
    this.onTouch();
  }

  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      // Move highlight down
      this.highlightedIndex =
        (this.highlightedIndex + 1) % this.filteredOptions.length;
      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      // Move highlight up
      this.highlightedIndex =
        (this.highlightedIndex - 1 + this.filteredOptions.length) %
        this.filteredOptions.length;
      event.preventDefault();
    } else if (event.key === 'Enter' && this.highlightedIndex >= 0) {
      // Select highlighted item on Enter key
      this.selectOption(this.filteredOptions[this.highlightedIndex]);
      event.preventDefault();
    } else if (event.key === 'Escape') {
      // Close dropdown on Escape key
      this.dropdownOpen = false;
    }
  }



  get isInvalid(): boolean {
    return this.isSubmitted && !this.value;
  }
}
