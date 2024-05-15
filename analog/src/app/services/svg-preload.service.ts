import { SafeHtml } from '@angular/platform-browser';
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class SvgPreloadService {
  byuLogo: SafeHtml;
  byuMedallion: SafeHtml;
}
