import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DataFetchService {
  fetchData<T>(apiCall$: Observable<T[]>): { data$: Observable<T[]>, isLoading$: Observable<boolean>, hasError$: Observable<boolean> } {
    const dataSubject = new BehaviorSubject<T[]>([]);
    const isLoadingSubject = new BehaviorSubject<boolean>(false);
    const hasErrorSubject = new BehaviorSubject<boolean>(false);

    const data$ = dataSubject.asObservable();
    const isLoading$ = isLoadingSubject.asObservable();
    const hasError$ = hasErrorSubject.asObservable();

    isLoadingSubject.next(true);
    hasErrorSubject.next(false);

    apiCall$.pipe(
      catchError(() => {
        hasErrorSubject.next(true);
        return of([]);
      }),
      finalize(() => isLoadingSubject.next(false))
    ).subscribe(data => dataSubject.next(data || []));

    return { data$, isLoading$, hasError$ };
  }
}
