import {Component, OnInit, Input, Injector, OnDestroy} from "@angular/core";
import {Router, NavigationStart} from "@angular/router";
import {PortalInjector} from "@angular/cdk/portal";
import {MatDialog} from "@angular/material/dialog";
import {Overlay, OverlayRef} from "@angular/cdk/overlay";
import {Subscription} from "rxjs";

import {APIService} from "../../services/api.service";
import {
  Day,
  PunchType,
  Punch,
  PORTAL_DATA,
  PunchRequest,
  Position,
  Employee
} from "../../objects";
import {ToastService} from "src/app/services/toast.service";


@Component({
  selector: "punches",
  templateUrl: "./punches.component.html",
  styleUrls: ["./punches.component.scss"]
})
export class PunchesComponent implements OnInit, OnDestroy {
  public punchType = PunchType;

  @Input() byuID: string;
  @Input() day: Day;
  @Input() job: Position;
  @Input() emp: Employee;

  private _overlayRef: OverlayRef;
  private _subsToDestroy: Subscription[] = [];

  constructor(
    private api: APIService,
    private dialog: MatDialog,
    private router: Router,
    private _overlay: Overlay,
    private _injector: Injector,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this._subsToDestroy.push(this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        if (this._overlayRef) {
          this._overlayRef.detach();
          this._overlayRef.dispose();

          this._overlayRef = undefined;
        }
      }
    }));
  }

  ngOnDestroy() {
    for (const s of this._subsToDestroy) {
      s.unsubscribe();
    }
  }

  private createInjector = (
    overlayRef: OverlayRef,
    data: any
  ): PortalInjector => {
    const tokens = new WeakMap();

    tokens.set(OverlayRef, overlayRef);
    tokens.set(PORTAL_DATA, data);

    return new PortalInjector(this._injector, tokens);
  };
 
  public comparePunches(a: Punch, b: Punch): number {
    return a.time.getTime() - b.time.getTime();
  }

  public getAMPMTimeFromDate(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
  
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
  
    const formattedTime = `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    return formattedTime;
  }

  dayHasPunch(day: Date): boolean {
    for (const job of this.emp.positions) {
      if (job) {
        const empDay = job.days.find(
          d => d.time.toDateString() === day.toDateString()
        );

        if (empDay) {
          if (empDay.punches.length > 0) {
            return true
          };
        }
      }
    }
    return false;
  }

  dayHasPeriod(day: Date): boolean {
    for (const job of this.emp.positions) {
      if (job) {
        const empDay = job.days.find(
          d => d.time.toDateString() === day.toDateString()
        );

        if (empDay) {
          if (empDay.periodBlocks.length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  dayHasUndefinedPeriod(day: Date): boolean {
    for (const job of this.emp.positions) {
      if (job) {
        const empDay = job.days.find(
          d => d.time.toDateString() === day.toDateString()
        );

        if (empDay) {
          for (const period of empDay.periodBlocks) {
            if (period.startDate === undefined || period.endDate === undefined) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

}
