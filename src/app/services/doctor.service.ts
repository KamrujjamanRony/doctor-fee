import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {

  http = inject(HttpClient);
  rootUrl = 'http://192.168.0.85/hms/api/DoctorEntry'

  addDoctor(model: any | FormData): Observable<void> {
    return this.http.post<void>(this.rootUrl, model)
  }

  getAllDoctors(): Observable<any[]> {
    return this.http.post<any[]>(this.rootUrl + '/SearchDoctor', {});
  }

  getFilterDoctors(isChamberDoctor: any, takeCom: any): Observable<any[]> {
    return this.http.post<any[]>(this.rootUrl + `/SearchDoctor?isChamberDoctor=${isChamberDoctor !== undefined ? isChamberDoctor : ""}&takeCom=${takeCom !== undefined ? takeCom : ""}`, {});
  }

  getDoctor(id: any): Observable<any> {
    return this.http.get<any>(`${this.rootUrl}/${id}`);
  }

  updateDoctor(id: any, updateDoctorRequest: any | FormData): Observable<any> {
    return this.http.put<any>(`${this.rootUrl}/EditDoctorEntry/${id}`, updateDoctorRequest);
  }

  deleteDoctor(id: any): Observable<any> {
    return this.http.post<any>(`${this.rootUrl}/DeleteDoctorEntry?id=${id}`, '');
  }
}
