import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DoctorFeeFeeService {

  http = inject(HttpClient);
  rootUrl = 'http://localhost/hms/api/DoctorFee'

  addDoctorFee(model: any | FormData): Observable<void>{
    return this.http.post<void>(this.rootUrl, model)
  }

  getAllDoctorFees(): Observable<any[]> {
    return this.http.get<any[]>(this.rootUrl + '/SearchDoctorFee');
  }

  getDoctorFee(id: any): Observable<any> {
    return this.http.get<any>(`${this.rootUrl}/${id}`);
  }

  updateDoctorFee(id: any, updateDoctorFeeRequest: any | FormData): Observable<any>{
    return this.http.put<any>(`${this.rootUrl}/${id}`, updateDoctorFeeRequest);
  }

  deleteDoctorFee(id: any): Observable<any>{
    return this.http.delete<any>(`${this.rootUrl}/${id}`);
  }
}
