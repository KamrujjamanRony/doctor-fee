import { Routes } from '@angular/router';
import { MainComponent } from './components/layouts/main/main.component';
import { HomeComponent } from './components/pages/home/home.component';
import { DoctorEntryComponent } from './components/pages/setup/doctor/doctor-entry/doctor-entry.component';
import { RegistrationComponent } from './components/pages/registration/registration.component';
import { DoctorFeeComponent } from './components/pages/setup/doctor/doctor-fee/doctor-fee.component';
import { ReportsComponent } from './components/pages/reports/reports.component';

export const routes: Routes = [
    {
        path: '',
        component: MainComponent,
        children: [
          { path: '', redirectTo: 'home', pathMatch: 'full' },
          {
            path: '',
            component: HomeComponent
          },
          {
            path: 'registration',
            component: RegistrationComponent
          },
          {
            path: 'setup/doctor/entry',
            component: DoctorEntryComponent
          },
          {
            path: 'setup/doctor/fee',
            component: DoctorFeeComponent
          },
          {
            path: 'reports',
            component: ReportsComponent
          },
        ],
      }
];
