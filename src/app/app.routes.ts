import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
export const routes: Routes = [
{ path: '**', redirectTo: '' }
];

@NgModule({
imports: [RouterModule.forRoot(routes)],
exports: [RouterModule]
})
export class AppRoutingModule { 


    
}
