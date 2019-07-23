import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Router, ActivationEnd } from "@angular/router";
import { MatDialog } from "@angular/material";
import { JsonConvert, OperationMode, ValueCheckingMode } from "json2typescript";
import { BehaviorSubject, Observable, throwError } from "rxjs";

import { ErrorDialog } from "../dialogs/error/error.dialog";
import { ToastService } from "./toast.service";
import {
  Employee,
  Job,
  TotalTime,
  WorkOrder,
  Day,
  WorkOrderEntry,
  PunchType,
  TRC,
  JobType,
  ClientPunchRequest,
  LunchPunch,
  DeletePunch,
  OtherHour,
  OtherHourRequest,
  DeleteWorkOrder
} from "../objects";

export class EmployeeRef {
  private _employee: BehaviorSubject<Employee>;
  private _logout;

  public offline: boolean;

  get employee() {
    if (this._employee) {
      return this._employee.value;
    }

    return undefined;
  }

  constructor(employee: BehaviorSubject<Employee>, logout: () => void) {
    this._employee = employee;
    this._logout = logout;
  }

  logout = () => {
    if (this._logout) {
      return this._logout();
    }

    return undefined;
  };

  subject = (): BehaviorSubject<Employee> => {
    return this._employee;
  };
}

@Injectable({ providedIn: "root" })
export class APIService {
  public theme = "default";

  private jsonConvert: JsonConvert;
  private urlParams: URLSearchParams;

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
      if (event instanceof ActivationEnd) {
        const snapshot = event.snapshot;

        if (snapshot && snapshot.queryParams && snapshot.queryParams.error) {
          this.error(snapshot.queryParams.error);
        }
      }
    });

    this.urlParams = new URLSearchParams(window.location.search);
    if (this.urlParams.has("theme")) {
      this.theme = this.urlParams.get("theme");
    }
  }

  public switchTheme(name: string) {
    console.log("switching theme to", name);

    this.theme = name;
    this.urlParams.set("theme", name);
    window.history.replaceState(
      null,
      "BYU Time Clock",
      window.location.pathname + "?" + this.urlParams.toString()
    );
  }

  getEmployee = (id: string | number): EmployeeRef => {
    const employee = new BehaviorSubject<Employee>(undefined);

    const endpoint = "ws://" + window.location.host + "/id/" + id;
    const ws = new WebSocket(endpoint);

    const empRef = new EmployeeRef(employee, () => {
      console.log("logging out employee", employee.value.id);

      // clean up the websocket
      ws.close();

      // no more employee values
      employee.complete();

      // route to login page
      this.router.navigate(["/login"], { replaceUrl: true });
    });

    ws.onmessage = event => {
      const data: Message = JSON.parse(event.data);

      console.debug("key: '" + data.key + "', value:", data.value);
      switch (data.key) {
        case "employee":
          try {
            const emp = this.jsonConvert.deserializeObject(
              data.value,
              Employee
            );

            console.log("updated employee", emp);
            employee.next(emp);
          } catch (e) {
            console.warn("unable to deserialize employee", e);
            employee.error("invalid response from api");
          }

          break;
        case "offline-mode":
          empRef.offline = Boolean(data.value);

          if (empRef.offline) {
            this.router
              .navigate(["/employee/" + empRef.employee.id], {
                queryParams: {},
                fragment: null
              })
              .finally(() => {
                this.toast.showIndefinitely("Offline Mode", "");
              });
          }

          break;
      }
    };

    ws.onerror = event => {
      console.error("websocket error", event);
      employee.error("No employee found with the given ID.");
    };

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
          queryParamsHandling: "merge"
        });
      });
    }
  };

  punch = (data: ClientPunchRequest): Observable<any> => {
    try {
      const json = this.jsonConvert.serialize(data);

      return this.http.post("/punch/" + data.byuID, json, {
        responseType: "text",
        headers: new HttpHeaders({
          "content-type": "application/json"
        })
      });
    } catch (e) {
      return throwError(e);
    }
  };

  newWorkOrderEntry = (byuID: string, data: WorkOrderEntry) => {
    try {
      const json = this.jsonConvert.serialize(data);
      return this.http.post("/workorderentry/" + byuID, json, {
        responseType: "text",
        headers: new HttpHeaders({
          "content-type": "application/json"
        })
      });
    } catch (e) {
      return throwError(e);
    }
  };

  updateWorkOrderEntry = (byuID: string, data: WorkOrderEntry) => {
    try {
      const json = this.jsonConvert.serialize(data);
      return this.http.put("/workorderentry/" + byuID, json, {
        responseType: "text",
        headers: new HttpHeaders({
          "content-type": "application/json"
        })
      });
    } catch (e) {
      return throwError(e);
    }
  };

  lunchPunch = (byuID: string, data: LunchPunch) => {
    try {
      const json = this.jsonConvert.serialize(data);
      return this.http.post("/lunchpunch/" + byuID, json, {
        responseType: "text",
        headers: new HttpHeaders({
          "content-type": "application/json"
        })
      });
    } catch (e) {
      return throwError(e);
    }
  };

  deletePunch = (byuID: string, jobID: number, data: DeletePunch) => {
    try {
      const json = this.jsonConvert.serialize(data);
      return this.http.request(
        "delete",
        "/punch/" + byuID + "/" + jobID + "/" + data.sequenceNumber,
        {
          body: json,
          responseType: "text",
          headers: new HttpHeaders({
            "content-type": "application/json"
          })
        }
      );
    } catch (e) {
      return throwError(e);
    }
  };

  deleteWorkOrder = (byuID: string, data: DeleteWorkOrder) => {
    try {
      const json = this.jsonConvert.serialize(data);

      return this.http.request("delete", "/workorderentry/" + byuID, {
        body: json,
        responseType: "text",
        headers: new HttpHeaders({
          "content-type": "application/json"
        })
      });
    } catch (e) {
      return throwError(e);
    }
  };

  submitOtherHour = (byuID: string, data: OtherHourRequest) => {
    try {
      const json = this.jsonConvert.serialize(data);
      return this.http.put("/otherhours/" + byuID, json, {
        responseType: "text",
        headers: new HttpHeaders({
          "content-type": "application/json"
        })
      });
    } catch (e) {
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
}

interface Message {
  key: string;
  value: object;
}
