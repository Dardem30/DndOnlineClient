import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {Observable, take} from 'rxjs';
import {environment} from "../app.config";

@Injectable()
export class RoomService {
  constructor(private http: HttpClient) { }

  createRoom(room: any, success: ((value: any) => void), failure: ((value: any) => void)): void {
    this.http.post(`${environment.serverUrl}room/create`, room, { withCredentials: true }).pipe(take(1)).subscribe({
      next: success,
      error: failure
    });
  }
  listRoom(success: ((value: any) => void), failure: ((value: any) => void)): void {
    this.http.get(`${environment.serverUrl}room/list`, { withCredentials: true }).pipe(take(1)).subscribe({
      next: success,
      error: failure
    });
  }
  accessConversation(authForm: object, success: ((value: any) => void), failure: ((value: any) => void)): void {
    this.http.post(`${environment.serverUrl}room/accessConversation`,
      authForm, { withCredentials: true })
      .pipe(take(1)).subscribe({
      next: success,
      error: failure
    });
  }

  disconnect(localRoomId: number) {
    this.http.delete(`${environment.serverUrl}room/disconnect?roomId=${localRoomId}`, { withCredentials: true }).pipe(take(1)).subscribe();
  }
}
