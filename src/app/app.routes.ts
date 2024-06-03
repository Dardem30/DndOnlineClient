import { Routes } from '@angular/router';
import {LoginComponent} from "./login/login.component";
import {MainComponent} from "./main/main.component";
import {RoomComponent} from "./room/room.component";
import {AuthGuard} from "./services/AuthGuard";

export const routes: Routes = [
  {path: '', component: LoginComponent},
  {path: 'main', canActivate: [AuthGuard], component: MainComponent},
  {path: 'room/:id', canActivate: [AuthGuard], component: RoomComponent}
];
