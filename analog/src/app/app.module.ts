import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HttpClientModule } from "@angular/common/http";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MatDialogModule } from "@angular/material/dialog";
import { MAT_DIALOG_DEFAULT_OPTIONS } from "@angular/material/dialog";
import { MatSelectModule } from "@angular/material/select";
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from "@angular/material/tabs";
import { MatRadioModule } from "@angular/material/radio";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatBadgeModule } from "@angular/material/badge";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatRippleModule } from "@angular/material/core";
import { OverlayModule } from "@angular/cdk/overlay";
import "hammerjs";

import { AppRoutingModule } from "./app-routing.module";

import { APIService } from "./services/api.service";
import { ByuIDPipe } from "./pipes/byu-id.pipe";
import { AppComponent } from "./components/app.component";
import { ClockComponent } from "./components/clock/clock.component";
import { LoginComponent } from "./components/login/login.component";
import { HoursPipe } from "./pipes/hours.pipe";
import { WoTrcDialog } from "./dialogs/wo-trc/wo-trc.dialog";
import { ActivityButton } from "./components/activity-button/activity-button.component";
import { JobSelectComponent } from "./components/job-select/job-select.component";
import { DateSelectComponent } from "./components/date-select/date-select.component";
import { DayOverviewComponent } from "./components/day-overview/day-overview.component";
import { WoSelectComponent } from "./components/wo-select/wo-select.component";
import { ErrorDialog } from "./dialogs/error/error.dialog";
import { ManagementComponent } from './components/management/management.component';
import { PunchesComponent } from "./components/punches/punches.component";
import { WoSrComponent } from "./components/wo-sr/wo-sr.component";
import { SickVacationComponent } from "./components/sick-vacation/sick-vacation.component";
import { ScreenSaverComponent } from "./components/screen-saver/screen-saver.component";
import { TimeEntryComponent } from "./components/time-entry/time-entry.component";
import { LunchPunchDialog } from "./dialogs/lunch-punch/lunch-punch.dialog";
import { ToastService } from "./services/toast.service";
import { ConfirmDialog } from './dialogs/confirm/confirm.dialog';
import { DeletePunchDialog } from './dialogs/delete-punch/delete-punch.dialog';
@NgModule({
  declarations: [
    AppComponent,
    ClockComponent,
    ByuIDPipe,
    LoginComponent,
    HoursPipe,
    WoTrcDialog,
    ActivityButton,
    JobSelectComponent,
    DateSelectComponent,
    DayOverviewComponent,
    WoSelectComponent,
    ErrorDialog,
    PunchesComponent,
    WoSrComponent,
    SickVacationComponent,
    ScreenSaverComponent,
    TimeEntryComponent,
    LunchPunchDialog,
    ConfirmDialog,
    DeletePunchDialog,
    ManagementComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatGridListModule,
    MatFormFieldModule,
    MatInputModule,
    MatSidenavModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatDialogModule,
    MatSelectModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatTabsModule,
    MatRadioModule,
    OverlayModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatSnackBarModule,
    MatRippleModule
  ],
  providers: [
    APIService,
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: {
        hasBackdrop: true
      }
    },
    ToastService
  ],
  entryComponents: [
    WoTrcDialog,
    WoSelectComponent,
    ErrorDialog,
    TimeEntryComponent,
    LunchPunchDialog,
    ConfirmDialog,
    DeletePunchDialog
  ],
  bootstrap: [AppComponent]
})

export class AppModule {}
