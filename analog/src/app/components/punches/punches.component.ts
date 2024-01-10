import {Component, OnInit, Input, Inject, Injector, OnDestroy} from "@angular/core";
import {Router, NavigationStart} from "@angular/router";
import {ComponentPortal, PortalInjector} from "@angular/cdk/portal";
import {MatDialog} from "@angular/material/dialog";
import {Overlay, OverlayRef} from "@angular/cdk/overlay";
import {Observable, Subscription} from "rxjs";
import {share} from "rxjs/operators";

import {APIService} from "../../services/api.service";
import {
  Day,
  PunchType,
  Punch,
  PORTAL_DATA,
  PunchRequest,
  Position
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
  @Input() jobID: number;
  @Input() day: Day;
  @Input() job: Position;

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

  public calculateTotalHours(day: Day): Day {
    if (day.periodBlocks.length === 0) {
      day.punchedHours = "0.0";
      day.reportedHours = "0.0";
      return day;
    }
    if (day.punchedHours !== undefined) {
      return day;
    }


    let totalHours: number = 0.0;

    for (let i = 0; i < day.periodBlocks.length; i++) {
      if (day.periodBlocks[i].startDate === undefined || day.periodBlocks[i].endDate === undefined) {
        continue;
      } else {
        let timeDiff = day.periodBlocks[i].endDate.getTime() - day.periodBlocks[i].startDate.getTime();
        let hours = timeDiff / (1000 * 3600);
        totalHours += hours;
      }
      
    }

    day.punchedHours = parseFloat(totalHours.toFixed(2)).toString();
    day.reportedHours = parseFloat(totalHours.toFixed(2)).toString();

    return day;
  }
  
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

}
