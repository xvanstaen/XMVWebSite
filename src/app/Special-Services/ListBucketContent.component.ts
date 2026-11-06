import {
  Component, signal, Input, Output, EventEmitter, OnInit, DestroyRef, inject,
} from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { classTabMetaPerso, Bucket_List_Info, OneBucketInfo, configServer } from '../JsonServerClass';
import { ManageGoogleService } from '../CloudServices/ManageGoogle.service';

@Component({
  selector: 'app-ListBucketContent',
  templateUrl: './ListBucketContent.component.html',
  styleUrls: ['./ListBucketContent.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class ListBucketContentComponent implements OnInit {
  private readonly scroller = inject(ViewportScroller);
  private readonly google = inject(ManageGoogleService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() configServer = new configServer();
  @Input() NbRefresh_Bucket = 0;
  @Input() Bucket_Name = '';
  @Input() tabMetaPerso: Array<classTabMetaPerso> = [];

  @Output() Return_SelectedBucketInfo = new EventEmitter<OneBucketInfo>();
  @Output() Return_Data = new EventEmitter<any>();

  debug = false;

  message = signal('');
  isRetrievedFile = signal(false);
  DisplayListOfObjects = signal(false);

  myListOfObjects = new Bucket_List_Info();

  ngOnInit(): void {
    this.RetrieveAllObjects();
  }

  RetrieveAllObjects(): void {
    const meta = this.tabMetaPerso[0];
    this.log('RetrieveAllObjects()', this.Bucket_Name);

    this.google.getListMetaObjects(this.configServer, this.Bucket_Name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any[]) => {
          this.log('RetrieveAllObjects() - data received');

          this.myListOfObjects.items = data
            .filter(d => !meta || d.items.metadata?.[meta.key] === meta.value)
            .map(d => {
              const o = new OneBucketInfo();
              o.name = d.items.name;
              o.mediaLink = d.items.url;
              o.bucket = this.Bucket_Name;
              return o;
            });

          this.DisplayListOfObjects.set(true);
          this.scroller.scrollToAnchor('targetTopObjects');
        },
        error: () => {
          this.log('Error to retrieve all objects()');
          this.message.set('Error to retrieve all objects()');
        },
      });
  }

  RetrieveSelectedFile(event: OneBucketInfo): void {
    this.message.set('');

    this.google.getContentObject(this.configServer, event.bucket, event.name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.log('ListBucket - RetrieveSelectedFile=', event.mediaLink);
          this.Return_SelectedBucketInfo.emit(event);
          this.isRetrievedFile.set(true);
          this.scroller.scrollToAnchor('SelectedObjectsFile');
          this.Return_Data.emit(data);
        },
        error: () => this.message.set(`Selected file '${event.name}' not found`),
      });
  }

  private log(...args: unknown[]): void {
    if (this.debug) console.log('[ListBucketContent]', ...args);
  }
}