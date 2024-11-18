import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'confirm-modal',
  standalone: true,
  imports: [],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.css'
})
export class ConfirmModalComponent {
  @Input() title!: any;
  @Output() closeModal = new EventEmitter<void>();

  constructor(){}

  closeThisModal(): void {
    this.closeModal.emit();
  }
}
