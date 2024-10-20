import { Component, OnInit } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map, switchMap, tap } from 'rxjs';

import { FirestorePaginationService } from '../../services/paginationService';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss'
})
export class PaginationComponent implements OnInit {

  collectionName: string = 'testEntries';
  items: {
    createdAt: any;
    title: string;
    content: string;
  }[] = [];
  currentPage: number = 0;
  totalPages: number = 0;
  disableNext: boolean = false;
  disablePrev: boolean = true;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paginationService: FirestorePaginationService
  ) {}

  ngOnInit(): void {
    this.paginationService.getTotalDocumentCount(this.collectionName).pipe(
      switchMap((totalCount) => {
        this.totalPages = Math.ceil(totalCount / this.paginationService.pageSize);
        return this.route.params;
      }),
      map((params) => {
        return params['page'] ? parseInt(params['page'], 10) : 1;
      }),
      filter((page) => {
        if (isNaN(page) || page < 1) {
          // Handle invalid page numbers (e.g., non-integer or negative numbers)
          this.errorMessage = 'Invalid page number. Redirecting to page 1...';
          this.router.navigate(['/page/1']);
          return false;
        }

        if (page > this.totalPages) {
          // Handle when the page number is too high
          this.errorMessage = `Page ${page} doesn't exist. Redirecting to the last page...`;
          this.router.navigate(['/page', this.totalPages]);
          return false;
        }
        return true;
      }),
      tap((page) => {
        this.currentPage = page - 1;
      }),
      switchMap((page) => {
        return this.paginationService.getPage(this.collectionName, page - 1);
      })
    ).subscribe({
      next: items => {
        this.items = items;
        this.disableNext = this.currentPage >= this.totalPages - 1; // Disable next if on the last page
        this.disablePrev = this.currentPage === 0; // Disable previous if on the first page
        this.errorMessage = ''; // Clear any previous error messages
      },
      error: (err) => {
        // Handle error during page loading (e.g., if no more pages)
        this.errorMessage = 'Error loading the page. Please try again.';
      }
    });
  }

  nextPage() {
    const nextPageNumber = this.currentPage + 1;
    if (nextPageNumber < this.totalPages) {
      this.router.navigate(['/page', nextPageNumber + 1]);
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      const prevPageNumber = this.currentPage - 1;
      this.router.navigate(['/page', prevPageNumber + 1]);
    }
  }
}
