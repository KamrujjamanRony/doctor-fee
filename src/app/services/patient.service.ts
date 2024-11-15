import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PatientService {

  http = inject(HttpClient);
  rootUrl = 'http://localhost:3000/patientReg'

  addPatient(model: any | FormData): Observable<void>{
    return this.http.post<void>(this.rootUrl, model)
  }

  getAllPatients(): Observable<any[]> {
    return this.http.get<any[]>(this.rootUrl);
  }

  getPatient(id: any): Observable<any> {
    return this.http.get<any>(`${this.rootUrl}/${id}`);
  }

  updatePatient(id: any, updatePatientRequest: any | FormData): Observable<any>{
    return this.http.put<any>(`${this.rootUrl}/${id}`, updatePatientRequest);
  }

  deletePatient(id: any): Observable<any>{
    return this.http.delete<any>(`${this.rootUrl}/${id}`);
  }
}
