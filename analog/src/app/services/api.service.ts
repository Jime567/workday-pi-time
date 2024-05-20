import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Router, NavigationEnd } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { JsonConvert } from "json2typescript";
import { BehaviorSubject, Observable, throwError, Subscription } from "rxjs";

import { ErrorDialog } from "../dialogs/error/error.dialog";
import { ToastService } from "./toast.service";
import {
  Employee,
  Day,
  PunchRequest,
  ApiResponse,
  Punch,
  PeriodBlock
} from "../objects";
export class EmployeeRef {
  private _employee: BehaviorSubject<Employee>;
  private _logout: Function;
  private _subsToDestroy: Subscription[] = [];

  public selectedDate: Date;

  get employee() {
    if (this._employee) {
      return this._employee.value;
    }

    return undefined;
  }

  constructor(employee: BehaviorSubject<Employee>, logout: (Boolean) => void, router: Router) {
    this._employee = employee;
    this._logout = logout;

    this._subsToDestroy.push(router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (!event.url.startsWith("/employee")) {
          // this is only for a session time out
          this.logout(true);
        }
      }
    }));
  }

  logout = (timeout: Boolean) => {
    for (const s of this._subsToDestroy) {
      s.unsubscribe();
    }

    if (this._logout) {
      if (timeout) {
        return this._logout(true);
      }
      return this._logout(false);
    }
  };

  subject = (): BehaviorSubject<Employee> => {
    return this._employee;
  };
}

@Injectable({ providedIn: "root" })
export class APIService {
  public theme = "default";

  private jsonConvert: JsonConvert;
  private _hiddenDarkModeCount = 0;
  unsynced: boolean = false;
  employee_cache: boolean = true;
  timeevents_online: boolean = true;
  workdayAPI_online: boolean = true;
  unsyncedPunches: String = "0";
  showAlert: boolean = true;

  constructor(
    private http: HttpClient,
    private router: Router,
    private dialog: MatDialog,
    private toast: ToastService
  ) {
    this.jsonConvert = new JsonConvert();
    this.jsonConvert.ignorePrimitiveChecks = false;

    // watch for route changes to show popups, etc
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = new URL(window.location.protocol + window.location.host + event.url);

        if (url.searchParams.has("error")) {
          const err = url.searchParams.get("error");

          if (err.length > 0) {
            this.error(err);
          } else {
            // remove the error param
            this.router.navigate([], {
              queryParams: { error: null },
              queryParamsHandling: "merge",
              preserveFragment: true
            });
          }
        }

        if (url.searchParams.has("theme")) {
          document.body.classList.remove(this.theme + "-theme");
          this.theme = url.searchParams.get("theme");
          document.body.classList.add(this.theme + "-theme");
        } else {
          document.body.classList.remove(this.theme + "-theme");
          this.theme = "";
        }
      }
    });
  }

  public switchTheme(name: string) {
    this.router.navigate([], {
      queryParams: { theme: name },
      queryParamsHandling: "merge"
    });
  }

  hiddenDarkMode = () => {
    if (this.theme === "dark") {
      return;
    }

    this._hiddenDarkModeCount++;
    setTimeout(() => {
      this._hiddenDarkModeCount--;
    }, 3000);

    if (this._hiddenDarkModeCount > 4) {
      this.switchTheme("dark");
    }
  };

  getEmployee = (id: string | number): EmployeeRef => {
    const employee = new BehaviorSubject<Employee>(undefined);
    const endpoint = "http://localhost:8000/get_employee_data/" + id;
    this.http.get(endpoint).subscribe({
      next: (data: JSON) => {
        try {
          const response = this.jsonConvert.deserializeObject(data, ApiResponse);

          //check if database and workday are synced
          const statuses = Object.keys(response.statuses);
          this.unsynced = response.statuses["unprocessed_punches_in_tcd"];
          this.employee_cache = response.statuses["TCD_employee_cache_online"];
          this.timeevents_online = response.statuses["TCD_timeevents_online"];
          this.workdayAPI_online = response.statuses["workdayAPI_online"];
          this.unsyncedPunches = response.unprocessedPunches;
          const emp = response.employee;
          emp.id = String(id);
          emp.periodPunches = this.generatePeriodPunches(emp);
          emp.periodBlocks = this.generatePeriodBlocks(emp);
          this.loadDays(emp);

          console.log("updated employee", emp);
          employee.next(emp);
        } catch (e) {
          console.log("error deserializing employee", e);
          employee.error("Error Deserializing Employee");
        }

      },
      error: (err: any) => {
        console.warn("unable to deserialize employee", err);
        if (err.status === 0) {
          employee.error("Unable to Connect to API");
        }
        else if (err.status === 404) {
          employee.error("Error 404: API not Found")
        }
        else if (err.status === 503) {
          if (err.error.error.substring(0, 9) === "no worker") {
            employee.error("No Worker Matches ID");
          }
          else {
            employee.error(err.error.error)
          }
        }
        else {
          employee.error("Error " + err.status + ": " + err.statusText + "\r\n" + err.message);
        }

      }

    });

    const empRef = new EmployeeRef(employee, (timeout: Boolean) => {
      if (timeout) {
        console.log("session timed out for", employee.value.id)
      } else {
        console.log("logging out employee", employee.value.id);
      }

      //get current employee
      const currEmp = employee.value

      // no more employee values
      employee.complete();

      // reset theme
      this.switchTheme("");

      // route to login page
      this.router.navigate(["/login"], { replaceUrl: true });
      this.showAlert = true;
    }, this.router);

    return empRef;
  };

  error = (msg: string) => {
    const errorDialogs = this.dialog.openDialogs.filter(dialog => {
      return dialog.componentInstance instanceof ErrorDialog;
    });

    if (errorDialogs.length > 0) {
      // change the message in this one?
    } else {
      const ref = this.dialog.open(ErrorDialog, {
        width: "80vw",
        data: {
          msg: msg
        }
      });

      ref.afterClosed().subscribe(result => {
        this.router.navigate([], {
          queryParams: { error: null },
          queryParamsHandling: "merge",
          preserveFragment: true
        });
      });
    }
  };

  punch = (data: PunchRequest): Observable<any> => {
    try {
      const json = this.jsonConvert.serialize(data, PunchRequest);
      console.log(json);
      return this.http.post("http://" + window.location.host + "/punch/" + data.id, json, {
        responseType: "text",
        headers: new HttpHeaders({
          "content-type": "application/json"
        })
      });
    } catch (e) {
      console.log("error punching", e);
      return throwError(e);
    }
  };


  getOtherHours = (byuID: string, jobID: number, date: string) => {
    try {
      return this.http.get("/otherhours/" + byuID + "/" + jobID + "/" + date, {
        responseType: "text",
        headers: new HttpHeaders({
          "content-type": "application/json"
        })
      });
    } catch (e) {
      return throwError(e);
    }
  };

  loadDays(emp: Employee) {
    const today = Date.now();


    //for each position
    for (const pos of emp.positions) {

      //create an array of days for the last 62 days
      const days: Day[] = [];
      const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
      for (let i = 0; i < 62; i++) {
        const day = new Day();
        day.time = new Date(today - (i * oneDayInMilliseconds));
        days.push(day);
      }

      //add punches to the days
      if (emp.periodPunches !== undefined && emp.periodPunches !== null && emp.periodPunches[0] !== null) {
        for (const punch of emp.periodPunches) {
          if (String(pos.positionNumber) === String(punch.positionNumber)) {
            for (const day of days) {
              if (punch.time.getDate() === day.time.getDate()
                && punch.time.getMonth() === day.time.getMonth()
                && punch.time.getFullYear() === day.time.getFullYear()) {
                day.punches.push(punch);
              }
            }
          }
        }
      }

      // add time blocks to days
      if (emp.periodBlocks !== undefined && emp.periodBlocks !== null && emp.periodBlocks[0] !== null) {
        for (const block of emp.periodBlocks) {
          if (String(pos.positionNumber) === String(block.positionNumber)) {
            for (const day of days) {
              if (block.startDate === undefined && block.endDate === undefined) {
                continue;
              }
              else {
                if (block.startDate !== undefined) {
                  if (block.startDate.getDate() === day.time.getDate()
                    && block.startDate.getMonth() === day.time.getMonth()
                    && block.startDate.getFullYear() === day.time.getFullYear()) {
                    day.periodBlocks.push(block);
                  }
                }
                else {
                  if (block.endDate.getDate() === day.time.getDate()
                    && block.endDate.getMonth() === day.time.getMonth()
                    && block.endDate.getFullYear() === day.time.getFullYear()) {
                    day.periodBlocks.push(block);
                  }
                }
              }
            }
          }
        }
      }

      pos.days = days;
    }
  }

  // Generate Period Punches
  generatePeriodPunches = (emp: Employee) => {
    const punches: Punch[] = [];
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    let i: number;
    for (const pos of emp.positions) {
      for (i = 0; i < 2; i++) {
        const punch = new Punch();
        punch.positionNumber = parseInt(pos.positionNumber);
        punch.time = yesterday;
        if (i === 0) {
          punch.type = "IN";
        }
        else {
          punch.type = "OUT";
        }
        punches.push(punch);
      }
    }
    yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);
    for (const pos of emp.positions) {
      for (i = 0; i < 2; i++) {
        const punch = new Punch();
        punch.positionNumber = parseInt(pos.positionNumber);
        punch.time = yesterday;
        if (i === 0) {
          punch.type = "IN";
        }
        else {
          punch.type = "OUT";
        }
        punches.push(punch);
      }
    };
    return punches;
  }

  // Generate Period Blocks
  generatePeriodBlocks = (emp: Employee) => {
    const blocks: PeriodBlock[] = [];
    var today = new Date();
    today.setDate(today.getDate() - 1);
    for (const pos of emp.positions) {
      const block = new PeriodBlock();
      console.log("Position " + pos.businessTitle);
      block.positionNumber = pos.positionNumber;
      block.startDate = new Date(today);
      block.startDate.setHours(9, 0, 0, 0);
      today.setHours(17, 0, 0, 0);
      block.endDate = today;
      blocks.push(block);
    }
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);
    for (const pos of emp.positions) {
      const block = new PeriodBlock();
      console.log("Position " + pos.businessTitle);
      block.positionNumber = pos.positionNumber;
      block.startDate = new Date(yesterday);
      block.startDate.setHours(9, 0, 0, 0);
      yesterday.setHours(17, 0, 0, 0);
      block.endDate = yesterday;
      blocks.push(block);
    }
    yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 3);
    for (const pos of emp.positions) {
      const block = new PeriodBlock();
      console.log("Position " + pos.businessTitle);
      block.positionNumber = pos.positionNumber;
      block.startDate = new Date(yesterday);
      block.startDate.setHours(9, 0, 0, 0);
      yesterday.setHours(17, 0, 0, 0);
      block.endDate = yesterday;
      blocks.push(block);
    }
    yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 4);
    for (const pos of emp.positions) {
      const block = new PeriodBlock();
      console.log("Position " + pos.businessTitle);
      block.positionNumber = pos.positionNumber;
      block.startDate = new Date(yesterday);
      block.startDate.setHours(9, 0, 0, 0);
      yesterday.setHours(17, 0, 0, 0);
      block.endDate = yesterday;
      blocks.push(block);
    }
    yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 5);
    for (const pos of emp.positions) {
      const block = new PeriodBlock();
      console.log("Position " + pos.businessTitle);
      block.positionNumber = pos.positionNumber;
      block.startDate = new Date(yesterday);
      block.startDate.setHours(9, 0, 0, 0);
      yesterday.setHours(17, 0, 0, 0);
      block.endDate = yesterday;
      blocks.push(block);
    }
    return blocks;
  };

}
interface Message {
  value: object;
}



