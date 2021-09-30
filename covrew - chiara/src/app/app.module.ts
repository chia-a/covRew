import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DemoComponent } from './demo/demo.component';
import { DatasetComponent } from './dataset/dataset.component';
import { ScriptComponent } from './script/script.component';
import { StatisticheComponent } from './statistiche/statistiche.component';
import { FinaleComponent } from './finale/finale.component';
import { VincoliComponent } from './vincoli/vincoli.component';

@NgModule({
  declarations: [
    AppComponent,
    DemoComponent,
    DatasetComponent,
    ScriptComponent,
    StatisticheComponent,
    FinaleComponent
    // VincoliComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
