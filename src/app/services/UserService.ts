import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {Observable, take} from 'rxjs';
import {environment} from "../app.config";

@Injectable()
export class UserService {
  constructor(private http: HttpClient) { }

  authenticate(authForm: object, success: ((value: any) => void), failure: ((value: any) => void)): void {
    this.http.post(`${environment.serverUrl}authenticate`, authForm).pipe(take(1)).subscribe({
      next: success,
      error: failure
    });
  }
  home(): Observable<any> {
    return this.http.get(`${environment.serverUrl}user/home`, { withCredentials: true }).pipe(take(1));
  }
  searchContacts(listFilter: any): Observable<any> {
    return this.http.post(`${environment.serverUrl}user/searchFriends`, listFilter, { withCredentials: true }).pipe(take(1));
  }
  updateProfile(form: object, success: ((value: any) => void), failure: ((value: any) => void)): void {
    this.http.post(`${environment.serverUrl}user/updateProfile`, form, { withCredentials: true }).pipe(take(1)).subscribe({
      next: success,
      error: failure
    });
  }

  addContact(id: any) {
    return this.http.post(`${environment.serverUrl}user/addContact?userId=` + id, null, { withCredentials: true }).pipe(take(1));

  }
  removeContact(id: any) {
    return this.http.post(`${environment.serverUrl}user/removeContact?userId=` + id, null, { withCredentials: true }).pipe(take(1));

  }
}
