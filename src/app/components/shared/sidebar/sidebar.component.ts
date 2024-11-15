import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AllSvgComponent } from "../svg/all-svg/all-svg.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, AllSvgComponent, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {



  sidebarData: any[] = [
    {
      id: 1, label: 'Registration', icon: 'users', route: '/registration'
    },
    {
      id: 2, label: 'Setup', icon: 'settings', menu: [
        {
          id: 21, label: 'Doctor Entry', route: '/setup/doctor/entry'
        },
        {
          id: 22, label: 'Doctor Fee', route: '/setup/doctor/fee'
        }
      ]
    },
    {
      id: 3, label: 'Reports', icon: 'reports', route: '/reports'
    }
  ]

}
