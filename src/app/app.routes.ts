import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PaginationComponent } from './components/pagination/pagination.component';

export const routes: Routes = [
  { path: 'page/:page', component: PaginationComponent },
  { path: 'pagination', component: PaginationComponent },
  { path: '', redirectTo: '/page/1', pathMatch: 'full' },
  { path: '**', redirectTo: '/page/1' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
