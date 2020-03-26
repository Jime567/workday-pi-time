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
  DeleteWorkOrder,
  WorkOrderUpsertRequest
} from "../objects";
import {
  JsonObject,
  JsonProperty,
  Any,
  JsonCustomConvert,
  JsonConverter
} from "json2typescript";
import { ByuIDPipe } from '../pipes/byu-id.pipe';
import { stringify } from 'querystring';

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

  constructor(employee: BehaviorSubject<Employee>, logout: () => void, router: Router) {
    this._employee = employee;
    this._logout = logout;

    router.events.subscribe(event => {
      if (event instanceof ActivationEnd) {
        const snapshot = event.snapshot;
        
        console.log("URL", snapshot.url.length, snapshot.url[0].path)

        if (snapshot.url.length <= 2 || snapshot.url[0].path != "employee") {          
          this._logout()
        }
      }
    });
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

  private _hiddenDarkModeCount = 0;

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

        if (snapshot.queryParams && snapshot.queryParams.theme) {
          document.body.classList.remove(this.theme + "-theme");
          this.theme = snapshot.queryParams.theme;
          document.body.classList.add(this.theme + "-theme");
        } else if (snapshot.queryParams && !snapshot.queryParams.theme) {
          document.body.classList.remove(this.theme + "-theme");
          this.theme = "";
        }
      }
    });
  }

  public switchTheme(name: string) {
    console.log("switching theme to", name);

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

    let protocol = "ws:";
    if (window.location.protocol === "https:") {
      protocol = "wss:";
    }

    const endpoint = protocol + "//" + window.location.host + "/id/" + id;
    const ws = new WebSocket(endpoint);

    const empRef = new EmployeeRef(employee, () => {
      console.log("logging out employee", employee.value.id);

      // clean up the websocket
      ws.close();

      //get current employee
      const currEmp = employee.value

      // no more employee values
      employee.complete();

      //Send logout event
      if (currEmp) {
        const event = new Event();

        event.User = currEmp.id;
        event.EventTags = ["pitime-ui"];
        event.Key = "logout";
        event.Value = currEmp.id;
        event.Timestamp = new Date();

        this.sendEvent(event);
      }
      

      // reset theme
      this.switchTheme("");

      // route to login page
      this.router.navigate(["/login"], { replaceUrl: true });
    }, 
    this.router);

    ws.onmessage = event => {
      console.log("web socket data", event.data)
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
      employee.error("Error with employee - " + event.returnValue);
    };

    ws.onclose = event => {
      console.error("websocket close", event);
      employee.error(event.reason);
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
          queryParamsHandling: "merge",
          preserveFragment: true
        });
      });
    }
  };

  punch = (data: ClientPunchRequest): Observable<any> => {
    try {
      const json = this.jsonConvert.serialize(data);

      //Send logout event
      if (data) {
        const event = new Event();

        event.User = data.byuID;
        event.EventTags = ["pitime-ui"];
        event.Key = "time-punch";
        event.Value = data.byuID;
        event.Timestamp = new Date();

        this.sendEvent(event);
      }

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

  fixPunch = (req: ClientPunchRequest): Observable<any> => {
    try {
      const json = this.jsonConvert.serialize(req);

      if (req) {
        const event = new Event();

        event.User = req.byuID;
        event.EventTags = ["pitime-ui"];
        event.Key = "fix-punch";
        event.Value = req.byuID;
        event.Data = req.sequenceNumber;
        event.Timestamp = new Date();

        this.sendEvent(event);
      }

      return this.http.put(
        "/punch/" + req.byuID + "/" + req.sequenceNumber,
        json,
        {
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

  upsertWorkOrder = (byuID: string, data: WorkOrderUpsertRequest) => {
    try {
      const json = this.jsonConvert.serialize(data);

      if (data) {
        const event = new Event();

        event.User = byuID;
        event.EventTags = ["pitime-ui"];
        event.Key = "upsert-work-order";
        event.Value = byuID;
        event.Value = stringify(json);
        event.Timestamp = new Date();

        this.sendEvent(event);
      }

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

  lunchPunch = (byuID: string, data: LunchPunch) => {
    try {
      const json = this.jsonConvert.serialize(data);

      if (data) {
        const event = new Event();

        event.User = byuID;
        event.EventTags = ["pitime-ui"];
        event.Key = "lunch-punch";
        event.Value = byuID;
        event.Data = stringify(json);
        event.Timestamp = new Date();

        this.sendEvent(event);
      }

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

  deletePunch = (byuID: string, data: DeletePunch) => {
    try {
      const json = this.jsonConvert.serialize(data);

      if (data) {
        const event = new Event();

        event.User = byuID;
        event.EventTags = ["pitime-ui"];
        event.Key = "delete-punch";
        event.Value = byuID;
        event.Timestamp = new Date();
        event.Data = stringify(json);

        this.sendEvent(event);
      }

      return this.http.request("delete", "/punch/" + byuID, {
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

  deleteWorkOrder = (byuID: string, data: DeleteWorkOrder) => {
    try {
      const json = this.jsonConvert.serialize(data);

      if (data) {
        const event = new Event();

        event.User = byuID;
        event.EventTags = ["pitime-ui"];
        event.Key = "delete-workorder";
        event.Value = byuID;
        event.Timestamp = new Date();
        event.Data = stringify(json);

        this.sendEvent(event);
      }

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

      if (data) {
        const event = new Event();

        event.User = byuID;
        event.EventTags = ["pitime-ui"];
        event.Key = "submit-otherhour";
        event.Value = byuID;
        event.Timestamp = new Date();
        event.Data = stringify(json);

        this.sendEvent(event);
      }

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

  sendEvent = (event: Event) => {
    const data = this.jsonConvert.serializeObject(event);
    console.log("sending event", data);

    this.http
      .post("/event", data)
      .subscribe();
  }
}

@JsonConverter
class DateConverter implements JsonCustomConvert<Date> {
  serialize(date: Date): any {
    function pad(n) {
      return n < 10 ? "0" + n : n;
    }

    return (
      date.getUTCFullYear() +
      "-" +
      pad(date.getUTCMonth() + 1) +
      "-" +
      pad(date.getUTCDate()) +
      "T" +
      pad(date.getUTCHours()) +
      ":" +
      pad(date.getUTCMinutes()) +
      ":" +
      pad(date.getUTCSeconds()) +
      "Z"
    );
  }

  deserialize(date: any): Date {
    return new Date(date);
  }
}

@JsonObject("Event")
export class Event {
  @JsonProperty("generating-system", String, true)
  GeneratingSystem: String = undefined;

  @JsonProperty("timestamp", DateConverter, true)
  Timestamp: Date = undefined;

  @JsonProperty("event-tags", [String], true)
  EventTags: String[] = new Array<String>();

  @JsonProperty("key", String, true)
  Key: String = undefined;

  @JsonProperty("value", String, true)
  Value: String = undefined;

  @JsonProperty("user", String, true)
  User: String = undefined;

  @JsonProperty("data", Any, true)
  Data: any = undefined;

  public hasTag(tag: String): boolean {
    return this.EventTags.includes(tag);
  }
}

interface Message {
  key: string;
  value: object;
}


