import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'ModalWrapper',
  standalone: true,
  imports: [],
  templateUrl: './modal-wrapper.component.html',
  styleUrl: './modal-wrapper.component.css'
})
export class ModalWrapperComponent {
  @Input() title!: any;
  @Output() closeModal = new EventEmitter<void>();

  constructor(){}

  closeThisModal(): void {
    this.closeModal.emit();
  }

}
