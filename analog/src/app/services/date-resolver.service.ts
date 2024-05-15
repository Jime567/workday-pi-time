import { Injectable } from "@angular/core";
import { RouterStateSnapshot, ActivatedRouteSnapshot } from "@angular/router";
import { Observable } from "rxjs";
import { APIService } from "./api.service";
@Injectable({
  providedIn: "root"
})
export class DateResolverService  {
  constructor(
    private api: APIService
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> | Observable<never> {
    const id = route.paramMap.get("id");
    const jobID = +route.paramMap.get("jobid");
    const date = route.paramMap.get("date");

    return this.api.getOtherHours(id, jobID, date);
  }
}
