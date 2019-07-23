import { Component, OnInit, Input, Inject, Injector } from "@angular/core";
import { Router } from "@angular/router";
import { ComponentPortal, PortalInjector } from "@angular/cdk/portal";
import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { Observable } from "rxjs";
import { share } from "rxjs/operators";

import { APIService } from "../../services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { TimeEntryComponent } from "../time-entry/time-entry.component";
import { Day, OtherHour, OtherHourRequest, PORTAL_DATA } from "../../objects";

@Component({
  selector: "sick-vacation",
  templateUrl: "./sick-vacation.component.html",
  styleUrls: ["./sick-vacation.component.scss"]
})
export class SickVacationComponent implements OnInit {
  @Input() byuID: string;
  @Input() jobID: number;
  @Input() day: Day;

  constructor(
    private api: APIService,
    private _overlay: Overlay,
    private _injector: Injector,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit() {}

  openTimeEdit = (other: OtherHour) => {
    if (!other.editable) {
      return;
    }

    const overlayRef = this._overlay.create({
      height: "100vh",
      width: "100vw",
      disposeOnNavigation: true,
      hasBackdrop: false,
      panelClass: ["overlay", "time-entry-overlay"]
    });

    const injector = this.createInjector(overlayRef, {
      title: "Enter time for " + other.trc.description + " hours.",
      duration: true,
      ref: other,
      save: this.submitOtherHours,
      error: () => {
        this.router.navigate([], {
          queryParams: {
            error:
              "Unable to update " +
              other.trc.description +
              " hours. Please try again."
          },
          queryParamsHandling: "merge"
        });
      }
    });

    const portal = new ComponentPortal(TimeEntryComponent, null, injector);
    const containerRef = overlayRef.attach(portal);
    return overlayRef;
  };

  private createInjector = (
    overlayRef: OverlayRef,
    data: any
  ): PortalInjector => {
    const tokens = new WeakMap();

    tokens.set(OverlayRef, overlayRef);
    tokens.set(PORTAL_DATA, data);

    return new PortalInjector(this._injector, tokens);
  };

  submitOtherHours = (
    other: any,
    hour: string,
    min: string
  ): Observable<any> => {
    if (other instanceof OtherHour) {
      const req = new OtherHourRequest();
      req.jobID = this.jobID;
      req.timeReportingCodeHours = hour + ":" + min;
      req.trcID = other.trc.id;

      const obs = this.api.submitOtherHour(this.byuID, req);
      obs.subscribe(
        resp => {
          console.log("response data", resp);
          const msg = other.trc.description + "Hours Recorded";
          this.toast.show(msg, "DISMISS", 2000);
        },
        err => {
          console.warn("response ERROR", err);
        }
      );

      return obs;
    }

    // TODO return something that fails
  };
}
