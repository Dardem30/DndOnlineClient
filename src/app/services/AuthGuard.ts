import {Injectable} from '@angular/core';
import {CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router} from '@angular/router';
import {of, Observable} from 'rxjs';
import {UserService} from "./UserService";
import {environment} from "../app.config";
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private userService: UserService, private router: Router) {
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    return this.userService.home().pipe(
      map(response => {
        environment.loggedInUser = response.result;
        return true;
      }),
      catchError(response => {
        this.router.navigate(['/']);
        return of(false);
      })
    );
  }
}
