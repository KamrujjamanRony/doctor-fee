import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {

  http = inject(HttpClient);
  rootUrl = 'http://localhost:3000/doctorEntry'

  addDoctor(model: any | FormData): Observable<void>{
    return this.http.post<void>(this.rootUrl, model)
  }

  getAllDoctors(): Observable<any[]> {
    return this.http.get<any[]>(this.rootUrl);
  }

  getDoctor(id: any): Observable<any> {
    return this.http.get<any>(`${this.rootUrl}/${id}`);
  }

  updateDoctor(id: any, updateDoctorRequest: any | FormData): Observable<any>{
    return this.http.put<any>(`${this.rootUrl}/${id}`, updateDoctorRequest);
  }

  deleteDoctor(id: any): Observable<any>{
    return this.http.delete<any>(`${this.rootUrl}/${id}`);
  }
}
