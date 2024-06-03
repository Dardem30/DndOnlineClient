import {Component} from '@angular/core';
import {getAuth, GoogleAuthProvider, signInWithPopup, signOut} from "firebase/auth";
import {UserService} from "../services/UserService";
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  constructor(private router: Router,
              private userService: UserService) {
  }

  login() {
    const provider = new GoogleAuthProvider();
    const auth = getAuth();
    signInWithPopup(auth, provider)
      .then(result => {
        console.log(result);
        result.user.getIdToken().then(token => {
          console.log(token)
          this.userService.authenticate({
            token: token,
            name: result.user.displayName,
            photoUrl: result.user.photoURL
          }, response => {
            this.router.navigate(['main']);
            const sessionId = response.result;
            document.cookie = `JSESSIONID=${sessionId}; path=/; samesite=lax`;
            console.log(response)
          }, null);
        })
          .catch(test => {
            console.log(test)
          })
      })
      .catch(error => console.log(error));
  }

  logout() {
    const auth = getAuth();
    signOut(auth);
  }
}
