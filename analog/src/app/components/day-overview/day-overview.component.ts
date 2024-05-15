import {Component, OnInit, OnDestroy} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {EmployeeRef, APIService} from "../../services/api.service";
import {Employee, Day, JobType} from "../../objects";
import {Subscription} from 'rxjs';

@Component({
  selector: "day-overview",
  templateUrl: "./day-overview.component.html",
  styleUrls: [
    "./day-overview.component.scss",
    "../../../../node_modules/simple-keyboard/build/css/index.css"
  ]
})
export class DayOverviewComponent implements OnInit, OnDestroy {
  public jobType = JobType;

  private _empRef: EmployeeRef;
  get emp(): Employee {
    if (this._empRef) {
      return this._empRef.employee;
    }
    return undefined;
  }

  private _date: string;
  get day(): Day {
    const date = new Date(this._date + " 00:00:00");
    let day: Day = this.emp.positions[0].days.find(
      d =>
        d.time.getFullYear() === date.getFullYear() &&
        d.time.getMonth() === date.getMonth() &&
        d.time.getDate() === date.getDate()
    );
    
    return day;
  }

  private _subsToDestroy: Subscription[] = [];

  constructor(public api: APIService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {

    this._subsToDestroy.push(this.route.paramMap.subscribe(params => {
      if (params) {
        this._date = params.get("date");
      }
    }));

    this._subsToDestroy.push(this.route.data.subscribe(data => {
      if (data) {
        this._empRef = data.empRef;
      }
    }));

  }

  

  ngOnDestroy() {
    for (const s of this._subsToDestroy) {
      s.unsubscribe();
    }

    this._empRef = undefined;
    this._date = undefined;
  }

  goBack() {
    this.router.navigate(
      ["/employee/" + this.emp.id + "/date"],
      {
        preserveFragment: false,
        queryParamsHandling: "preserve"
      }
    );
  }

  public calculateTotalHours(day: Day): Day {
    let totalHours = 0;
    for (const pos of this.emp.positions) {
      for (const d of pos.days) {
        if (d.time.getFullYear() === day.time.getFullYear() &&
          d.time.getMonth() === day.time.getMonth() &&
          d.time.getDate() === day.time.getDate()) {
            for (const b of d.periodBlocks) {
              if (b.startDate !== undefined && b.endDate !== undefined) {
                var nextHours = (b.endDate.getHours() + (b.endDate.getMinutes() / 60)) - (b.startDate.getHours() + (b.startDate.getMinutes() / 60));
                if (nextHours < 0) {
                  nextHours += 24;
                }
                totalHours += nextHours;
              }
            }
        }
      }      
    }

    day.punchedHours = parseFloat(totalHours.toFixed(2)).toString();
    day.reportedHours = parseFloat(totalHours.toFixed(2)).toString();

    return day;
  }

  logout = () => {
    this._empRef.logout(false);
  };

}


