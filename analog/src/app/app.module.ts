import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HttpClientModule } from "@angular/common/http";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {
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
  MAT_DIALOG_DEFAULT_OPTIONS,
  MatSelectModule,
  MatNativeDateModule,
  MatDatepickerModule,
  MatTabsModule,
  MatRadioModule
} from "@angular/material";
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
import { WorkOrdersComponent } from "./components/work-orders/work-orders.component";
import { JobSelectComponent } from "./components/job-select/job-select.component";
import { DateSelectComponent } from "./components/date-select/date-select.component";
import { DayOverviewComponent } from "./components/day-overview/day-overview.component";
import { WoSelectComponent } from "./components/wo-select/wo-select.component";
import { ErrorDialog } from "./dialogs/error/error.dialog";

@NgModule({
  declarations: [
    AppComponent,
    ClockComponent,
    ByuIDPipe,
    LoginComponent,
    HoursPipe,
    WoTrcDialog,
    WorkOrdersComponent,
    // JobTimeSelectComponent,
    JobSelectComponent,
    DateSelectComponent,
    DayOverviewComponent,
    WoSelectComponent,
    ErrorDialog
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
    OverlayModule
  ],
  providers: [
    APIService,
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: {
        hasBackdrop: true
      }
    }
  ],
  entryComponents: [WoTrcDialog, WoSelectComponent, ErrorDialog],
  bootstrap: [AppComponent]
})
export class AppModule {}
