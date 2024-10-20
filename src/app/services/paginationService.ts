import { Injectable } from '@angular/core';
import { Firestore, collection, query, orderBy, limit, startAfter, getDocs } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestorePaginationService {

  public pageSize = 3;
  private cachedPages: any[][] = [];

  constructor(private firestore: Firestore) {}

  getFirstPage(collectionName: string): Observable<any[]> {
    const colRef = collection(this.firestore, collectionName);
    const q = query(colRef, orderBy('createdAt'), limit(this.pageSize));

    return from(getDocs(q).then(snapshot => {
      this.cachePage(0, snapshot.docs);  // Cache the first page
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }));
  }

  // Fetch the total count of documents to calculate the total number of pages
  getTotalDocumentCount(collectionName: string): Observable<number> {
    const colRef = collection(this.firestore, collectionName);
    const q = query(colRef);
    return from(getDocs(q).then(snapshot => snapshot.size)); // Get the size of the query result
  }

  // Fetch a specific page, checking if it's cached or needs to be loaded
  getPage(collectionName: string, pageNumber: number): Observable<any[]> {
    if (this.cachedPages[pageNumber]) {
      return from(Promise.resolve(this.cachedPages[pageNumber].map(doc => ({ id: doc.id, ...doc.data() }))));
    }
    if (pageNumber === 0) {
      return this.getFirstPage(collectionName);
    }
    return this.loadPageByIteration(collectionName, pageNumber);
  }

  private loadPageByIteration(collectionName: string, pageNumber: number): Observable<any[]> {
    const colRef = collection(this.firestore, collectionName);
    let q = query(colRef, orderBy('createdAt'), limit(this.pageSize));

    return from(getDocs(q).then(async snapshot => {
      let lastDoc = snapshot.docs[snapshot.docs.length - 1];
      for (let i = 1; i <= pageNumber; i++) {
        q = query(colRef, orderBy('createdAt'), startAfter(lastDoc), limit(this.pageSize));
        const nextSnapshot = await getDocs(q);
        if (nextSnapshot.docs.length === 0) {
          throw new Error('No more pages available');
        }
        lastDoc = nextSnapshot.docs[nextSnapshot.docs.length - 1];
        this.cachePage(i, nextSnapshot.docs);
      }
      return this.cachedPages[pageNumber].map(doc => ({ id: doc.id, ...doc.data() }));
    }));
  }

  private cachePage(pageNumber: number, docs: any[]) {
    this.cachedPages[pageNumber] = docs;
  }
}
