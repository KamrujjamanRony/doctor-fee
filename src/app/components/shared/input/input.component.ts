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

  value: any = '';                       
  customValue: any = '';                       
  isDisabled: boolean = false;
  selectedOption: any = null;
  dropdownOpen = false;
  highlightedIndex: number = -1;

  // Implement ControlValueAccessor interface
  onChange = (_: any) => {};
  onTouch = () => {};

  onOptionSelected() {
    return this.options.find(option =>
      option.id.includes(this.value)
    )?.name;
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



  get isInvalid(): boolean {
    return this.isSubmitted && !this.value;
  }
}
