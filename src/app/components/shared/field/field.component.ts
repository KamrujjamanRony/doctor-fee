import { Component, Input } from '@angular/core';

@Component({
  selector: 'Field',
  standalone: true,
  imports: [],
  templateUrl: './field.component.html',
  styleUrl: './field.component.css'
})
export class FieldComponent {
  @Input() label: string = '';
  @Input() isInvalid: boolean = false;

}
