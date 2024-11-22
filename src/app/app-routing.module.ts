import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RespondContactComponent } from './Special-Services/Respond-Contact.component';
import { LoginComponent } from './Login/login.component';

const routes: Routes = [
  { path: 'GoRespondContact', component: RespondContactComponent},
  { path: 'GoLogin', component: LoginComponent},
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
