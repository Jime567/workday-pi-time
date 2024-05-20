import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";

import { BehaviorSubject } from "rxjs";
import { share } from "rxjs/operators";

import { APIService, EmployeeRef } from "../../services/api.service";
import {
  Employee,
  PunchType,
  TEC,
  Position,
  PunchRequest
} from "../../objects";
import { ToastService } from "src/app/services/toast.service";
import { ConfirmDialog } from "src/app/dialogs/confirm/confirm.dialog";
import {ErrorDialog} from "src/app/dialogs/error/error.dialog";
import { InternationalDialog } from "src/app/dialogs/international/international.dialog";
import { DoubleDialog } from "src/app/dialogs/double/double.dialog";
import { SvgPreloadService } from "src/app/services/svg-preload.service";

@Component({
  selector: "clock",
  templateUrl: "./clock.component.html",
  styleUrls: ["./clock.component.scss"]
})
export class ClockComponent implements OnInit {
  public punchType = PunchType;

  private _empRef: EmployeeRef;
  get emp(): Employee {
    if (this._empRef) {
      return this._empRef.employee;
    }

    return undefined;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public api: APIService,
    public dialog: MatDialog,
    private toast: ToastService,
    public svgPreloadService: SvgPreloadService
  ) {}

  ngOnInit() {
    this.route.data.subscribe(data => {
      this._empRef = data.empRef;
    });

    console.log(this.svgPreloadService.byuLogo);

    if (!this.api.employee_cache || !this.api.timeevents_online || !this.api.workdayAPI_online) {
      this.toast.show(
        "Offline Mode.",
        "DISMISS",
        6000
      );
    }

    //greys out the "to time sheet" button
    if (this.emp?.positions.length <= 0 || this.api.workdayAPI_online === false || this.emp.timeEntryCodes == null) {
      const rvwTimesheet = document.getElementById("rvwTimesheet") as HTMLButtonElement;
      rvwTimesheet.className = "hidden";
    }

    const weekHours = this.emp?.totalWeekHours.length === 5 ? Number((this.emp?.totalWeekHours).substring(0, 2)) : Number((this.emp?.totalWeekHours).substring(0, 1));
    if (this.emp?.internationalStatus && weekHours >= 15 && this.api.showAlert) {
      this.api.showAlert = false;
      this.dialog.open(InternationalDialog, {
        data: {
          msg: "You have worked more than 15 hours this week."
        }
      })
    }   
  }

  jobRef(jobID: string): BehaviorSubject<Position> {
    const position = this.emp.positions.find(j => String(j.positionNumber) === String(jobID));
    const ref = new BehaviorSubject(position);

    this._empRef.subject().subscribe(emp => {
      const position = this.emp.positions.find(j => String(j.positionNumber) === String(jobID));
      if (position) {
        ref.next(position);
      }
    });

    return ref;
  }

  trimTitle = (title: string) => {
    if (title.length > 23) {
      const first = title.substring(0, 23);
        return `${first}...`;
    } 
    return title;
  }

  clockInOut = (jobRef: BehaviorSubject<Position>, state: PunchType) => {
    console.log("clocking job", jobRef.value.businessTitle, "to state", state);
  
    //Get the Time Entry Code
    var tec: string = null;
    if (this.emp.timeEntryCodes !== null) {
      const timeEntryCodesKeys = Object.keys(this.emp.timeEntryCodes);
      tec = this.emp.timeEntryCodes[timeEntryCodesKeys[0]].id;
      if (this.emp.showTEC()) {
        const tecList = document.getElementById(String(jobRef.value.positionNumber)) as HTMLSelectElement;
        tec = tecList.options[tecList.selectedIndex].value;
        for (const key in this.emp.timeEntryCodes) {
          if (this.emp.timeEntryCodes[0].frontendName === tec) {
            tec = key;
            break;
          }
        }
      }
    }

    //If this.emp.timeEntryCodes is null, then the employee is not eligible to track time
    else {
      this.dialog.open(ErrorDialog, {
        data: {
          msg: "Employee Not Eligible for Time Tracking"
        }
      })
      return
    }

    //Check that other jobs are not already clocked in
    for (var i = 0; i < this.emp.positions.length; i++) {
      if (this.emp.positions[i].inStatus && this.emp.positions[i].positionNumber !== jobRef.value.positionNumber) {
        this.dialog.open(ErrorDialog, {
          data: {
            msg: "A Different Job is Already Clocked In"
          }
        })
        this.refreshPage();
        return
      }
    }


    //Check to see if they are double clocking
    if (state === "I" && jobRef.value.inStatus) {
      this.dialog.open(DoubleDialog, {
        data: {
          msg: "Are you sure you want to clock in again?"
        }
      }).afterClosed()
      .subscribe(confirmed => {
        if (confirmed === "cancel") {
          return
        }
        else if (confirmed === "continue") {
          this.sendPunch(jobRef, state, tec)
        }
      })
    } else if (state === "O" && !jobRef.value.inStatus) {
      this.dialog.open(DoubleDialog, {
        data: {
          msg: "Are you sure you want to clock out again?"
        }
      }).afterClosed()
      .subscribe(confirmed => {
        if (confirmed === "cancel") {
          return
        }
        else if (confirmed === "continue") {
          this.sendPunch(jobRef, state, tec)
        }
      })
    } 
    // If it is a normal punch, send it
    else {
      this.sendPunch(jobRef, state, tec)
    }
  };

  
sendPunch = (jobRef: BehaviorSubject<Position>, state: PunchType, tec: String) => {
  //Construct and Send Punch Request
  const data = new PunchRequest();
  data.id = this.emp.id;
  data.positionNumber = String(jobRef.value.positionNumber);
  data.clockEventType = state === "I" ? "IN" : "OUT";
  data.timeEntryCode = tec;

  const obs = this.api.punch(data).pipe(share());
  obs.subscribe({
    next: (resp) => {
      const response = JSON.parse(resp);
      if (response.written_to_tcd === 'true') {
        this.dialog.open(ConfirmDialog, {
          data: {state: data.clockEventType}
        })
        .afterClosed()
        .subscribe(confirmed => {
          if (confirmed === "logout") {
            this.logout();
          }
          else if (confirmed === "confirmed") {
            this.refreshPage();
          }
        })
      } else {
        console.log(resp.written_to_tcd)
        this.refreshPage();
        this.dialog.open(ErrorDialog, {
          data: {
            msg: "The Punch was not Submitted Successfully"
          }
        })
      }
      
    },
    error: (err) => {
      this.refreshPage();
      console.warn("response ERROR", err);
      this.dialog.open(ErrorDialog, {
        data: {
          msg: "The Punch was not Submitted Successfully"
        }
      })
      
    }
  });
};

  toTimesheet = () => {
    this._empRef.selectedDate = new Date();
    this.router.navigate(["./date/"], { 
      relativeTo: this.route,
      queryParamsHandling: "preserve" });
  };

  logout = () => {
    this._empRef.logout(false);
  };

  refreshPage = () => {
    this.router.navigate([], {
      queryParams: {theme: this.api.theme == "dark" ? "dark" : 
      this.api.theme == "default" ? "light" : "default"},
      queryParamsHandling: "merge"
    });
  }

}





