import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TestService {

  http = inject(HttpClient);

  addTest(model: any | FormData): Observable<void> {
    return this.http.post<void>('http://192.168.0.138:3000/test', model)
  }

  getAllTests(): Observable<any[]> {
    return this.http.get<any[]>('http://192.168.0.138:3000/test');
  }

  getTest(id: any): Observable<any> {
    return this.http.get<any>(`http://192.168.0.138:3000/test/${id}`);
  }

  updateTest(id: any, updateTestRequest: any | FormData): Observable<any> {
    return this.http.put<any>(`http://192.168.0.138:3000/test/${id}`, updateTestRequest);
  }

  deleteTest(id: any): Observable<any> {
    return this.http.delete<any>(`http://192.168.0.138:3000/test/${id}`);
  }
}
