import { Routes } from '@angular/router';
import { MainComponent } from './components/layouts/main/main.component';
import { DoctorEntryComponent } from './components/pages/setup/doctor/doctor-entry/doctor-entry.component';
import { RegistrationComponent } from './components/pages/registration/registration.component';
import { DoctorFeeComponent } from './components/pages/setup/doctor/doctor-fee/doctor-fee.component';
import { DoctorFeeReportComponent } from './components/pages/reports/doctor-fee-report/doctor-fee-report.component';
import { DoctorsReportComponent } from './components/pages/reports/doctors-report/doctors-report.component';

export const routes: Routes = [
    {
        path: '',
        component: MainComponent,
        children: [
          { path: '', redirectTo: 'home', pathMatch: 'full' },
          {
            path: '',
            component: RegistrationComponent
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
            path: 'reports/doctor-fee-report',
            component: DoctorFeeReportComponent
          },
          {
            path: 'reports/doctors-report',
            component: DoctorsReportComponent
          },
        ],
      }
];
