import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DoctorFeeFeeService {

  http = inject(HttpClient);
  rootUrl = 'http://192.168.0.85/hms/api/DoctorFee'

  addDoctorFee(model: any | FormData): Observable<void> {
    return this.http.post<void>(this.rootUrl, model)
  }

  getAllDoctorFees(): Observable<any[]> {
    return this.http.post<any[]>(this.rootUrl + '/SearchDoctorFee', {});
  }

  getFilteredDoctorFee(fromDate: any, toDate: any, nextFlowDate: any): Observable<any> {
    console.log(fromDate, toDate, nextFlowDate)
    const endPoint = nextFlowDate ? `nextFlowDate=${nextFlowDate}` : `fromDate=${fromDate}&toDate=${toDate ? toDate : fromDate}`;
    return this.http.post<any>(`${this.rootUrl}/GetDoctorNextFlowDateSearch?${endPoint}`, {});
  }

  getDoctorFee(id: any): Observable<any> {
    return this.http.get<any>(`${this.rootUrl}/GetDoctorNextFlowDateSearch?doctorId=${id}`);
  }

  updateDoctorFee(id: any, updateDoctorFeeRequest: any | FormData): Observable<any> {
    return this.http.put<any>(`${this.rootUrl}/EditDoctorFee/${id}`, updateDoctorFeeRequest);
  }

  deleteDoctorFee(id: any): Observable<any> {
    return this.http.post<any>(`${this.rootUrl}/DeleteDoctorFee?id=${id}`, {});
  }
}
