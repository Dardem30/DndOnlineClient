import {ApplicationConfig, NgModule} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {initializeApp} from "firebase/app";
import {getAnalytics} from "firebase/analytics";
import {provideHttpClient} from '@angular/common/http';
import {AngularFireModule} from "@angular/fire/compat";
import {AngularFireAuthModule} from "@angular/fire/compat/auth";
import {UserService} from "./services/UserService";
import {LoginComponent} from "./login/login.component";
import {AddTagDialog, MainComponent, RoomCreationDialog, UpdateProfileDialog} from "./main/main.component";
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {MatDialogModule} from "@angular/material/dialog";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import {MatRippleModule} from '@angular/material/core';
import {MatTableModule} from '@angular/material/table';
import {RoomService} from "./services/RoomService";
import {RoomComponent} from "./room/room.component";
import {WebcamService} from "./services/WebcamService";
import {AuthGuard} from "./services/AuthGuard";
import {ConfirmDialog} from "./util/confirmDialog/ConfirmDialog";
import {InputDialog} from "./util/inputDialog/InputDialog";

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideRouter(routes),
    UserService,
    RoomService,
    AuthGuard,
    WebcamService,
    provideAnimationsAsync(),
    provideAnimationsAsync()
  ]
};

export const environment = {
  loggedInUser: {
    id: null,
    name: null,
    photoUrl: null,
    tags: [],
    contacts: [],
    nickname: 'Man of Honor',
  },
  production: false,
  //serverUrl: 'http://localhost:8081/',
  serverUrl: 'https://rlukashenko-dnd.online/api/',
  firebase: {
    apiKey: "AIzaSyCT1wgIvWkv19ZDX_QIZN91An7xOISqk3M",
    authDomain: "dndonline-34669.firebaseapp.com",
    projectId: "dndonline-34669",
    storageBucket: "dndonline-34669.appspot.com",
    messagingSenderId: "365047106032",
    appId: "1:365047106032:web:beece09b5d05879ab43535",
    measurementId: "G-NVP7YKY415"
  },
  messageTypes: {
    MESSAGE: 'MESSAGE',
    NOTIFICATION: 'NOTIFICATION',
    INVITATION: 'INVITATION'
  }
};
export const utils = {
  findElement: function (node: any, attribute: string, value: string): any {
    if (node.attributes && node.attributes[attribute] && node.attributes[attribute].value === value) {
      return node;
    }

    for(let i = 0; i < node.children.length; i++) {
      const found = utils.findElement(node.children[i], attribute, value);
      if (found) return found;
    }

    return null;
  }
}
const firebaseApp = initializeApp(environment.firebase);
const analytics = getAnalytics(firebaseApp);
@NgModule({
  declarations: [
    LoginComponent,
    MainComponent,
    RoomComponent,
    RoomCreationDialog,
    AddTagDialog,
    ConfirmDialog,
    InputDialog,
    UpdateProfileDialog
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatRippleModule
  ]
})
export class AppModule { }
