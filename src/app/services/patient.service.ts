import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PatientService {

  http = inject(HttpClient);
  rootUrl = 'http://192.168.0.85/hms/api/PatientReg'

  addPatient(model: any | FormData): Observable<void> {
    return this.http.post<void>(this.rootUrl, model)
  }

  getAllPatients(): Observable<any[]> {
    return this.http.post<any[]>(this.rootUrl + '/SearchPatient', '');
  }

  getPatient(id: any): Observable<any> {
    return this.http.get<any>(`${this.rootUrl}/${id}`);
  }

  updatePatient(id: any, updatePatientRequest: any | FormData): Observable<any> {
    return this.http.put<any>(`${this.rootUrl}/EditPatientReg/${id}`, updatePatientRequest);
  }

  deletePatient(id: any): Observable<any> {
    return this.http.post<any>(`${this.rootUrl}/DeletePatientReg?id=${id}`, '');
  }
}
