import {Component, OnInit} from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import {Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";
import {SvgPreloadService} from "../services/svg-preload.service";
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';


@Component({
  selector: "analog",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit {


  constructor(
    private router: Router, 
    private dialog: MatDialog, 
    private snackbar: MatSnackBar,
    public svgPreloadService: SvgPreloadService,
    private sanitizer: DomSanitizer ,
    private http: HttpClient
  ) {}

  ngOnInit() {
    let count = 0;

    // Preload SVG logos
    this.loadImages("assets/byu_logo.svg").subscribe(
      (result) => {
        this.svgPreloadService.byuLogo = this.sanitizer.bypassSecurityTrustHtml(result);
      },
      (error) => {
        console.log(error);
      }
    );

    this.loadImages("assets/byu_medallion.svg").subscribe(
      (result) => {
        this.svgPreloadService.byuMedallion = this.sanitizer.bypassSecurityTrustHtml(result);
      },
      (error) => {
        console.log(error);
      }
    );



    window.addEventListener("click", () => {
      count = 0;
    }, true);

    window.addEventListener("pointerdown", () => {
      count = 0;
    }, true);

    window.addEventListener("scroll", () => {
      count = 0;
    }, true);

    setInterval(() => {
      count++;

      const isLogin = this.router.url.startsWith("/login");
      const isScreensaver = this.router.url.startsWith("/screensaver");
      // Change this for timeout - needs to be 60 seconds in production
      if (count >= 60 && isLogin) {
        count = 0;

        this.router.navigate(["/screensaver"]);
        this.dialog.closeAll();
        this.snackbar.dismiss();
        // Change this for timeout - needs to be 30 seconds in production
      } else if (count >= 30 && !isLogin && !isScreensaver) {
        count = 0;

        this.router.navigate(["/login"]);
        this.dialog.closeAll();
        this.snackbar.dismiss();
      }
    }, 1000);
  }

  loadImages(src: string): Observable<string> {
    const headers = new HttpHeaders({
      'Content-Type': 'image/svg+xml'
    });

    return this.http.get(src, { 
      headers: headers,
      responseType: 'text' 
    });
  }
}



