import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

import { APIService } from "../../services/api.service";
import { Employee } from "../../objects";

@Component({
  selector: "login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"]
})
export class LoginComponent implements OnInit {
  id = "666567890";
  ssCounter = 0;
  ssTimeoutMax = 30;
  ssTimer: any;

  constructor(public api: APIService, private router: Router) {
    this.ssTimer = setInterval(() => {
      this.ssCounter++;
      console.log("counter", this.ssCounter);

      if (this.ssCounter >= this.ssTimeoutMax) {
        this.ssCounter = 0;
        clearInterval(this.ssTimer);
        this.router.navigate(["/screensaver"]);
      }
    }, 1000);
  }

  ngOnInit() {}

  addToID(num: string) {
    if (this.id.length < 9) {
      this.id += num;
    }
  }

  delFromID() {
    if (this.id.length > 0) {
      this.id = this.id.slice(0, -1);
    }
  }

  login = async (id: string) => {
    console.log("navigating to jobs with id", this.id);
    this.ssCounter = 0;
    const success = await this.router.navigate(["/employee/" + this.id]);
    if (success) {
      clearInterval(this.ssTimer);
    }

    this.id = ""; // reset the id
  };
}
