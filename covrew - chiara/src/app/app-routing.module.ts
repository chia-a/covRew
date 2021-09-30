import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DemoComponent } from './demo/demo.component';
import { DatasetComponent } from './dataset/dataset.component';
import { ScriptComponent } from './script/script.component';
import { VincoliComponent } from './vincoli/vincoli.component';
import { StatisticheComponent } from './statistiche/statistiche.component';
import { FinaleComponent } from './finale/finale.component';


const routes: Routes = [{ path: 'demo', component: DemoComponent},
                        { path: 'dataset', component: DatasetComponent},
                        { path: 'script', component: ScriptComponent},
                        { path: 'vincoli', component: VincoliComponent},
                        { path: 'statistiche', component: StatisticheComponent},
                        { path: 'finale', component: FinaleComponent},
                        { path: '', redirectTo: '/demo', pathMatch: 'full' }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
