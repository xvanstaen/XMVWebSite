import { Component, EventEmitter, Input, Output, effect, input, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { configServer, LoginIdentif, classCredentials } from '../JsonServerClass';
import { ManageGoogleService } from '../CloudServices/ManageGoogle.service';
import { classAccessFile, classHeaderReturnDataFS, classRetrieveFile } from '../classFileSystem';

const RETRY_DELAY_MS = 2000;

@Component({
  selector: 'app-file-system-service',
  templateUrl: './file-system-service.component.html',
  styleUrls: ['./file-system-service.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class FileSystemServiceComponent {
  @Input() iWait = 0;
  @Input() tabLock: Array<classAccessFile> = []; // 0=unlocked; 1=locked by user; 2=locked by other user; 3=must be checked
  @Input() configServer = new configServer();
  @Input() identification = new LoginIdentif();
  @Input() onInputAction = '';
  @Input() credentialsFS = new classCredentials();
  @Input() iWaitToRetrieve: Array<classRetrieveFile> = [];
  readonly nbCallFileSystem = input.required<number>();

  @Output() resultFileSystem = new EventEmitter<any>();

  returnDataFS = new classHeaderReturnDataFS();

  private previousNbCallFileSystem = -1;
  private readonly debug = false;

  constructor(private readonly manageGoogleService: ManageGoogleService) {
    effect(() => {
      // Only nbCallFileSystem is tracked; everything else runs untracked
      const nb = this.nbCallFileSystem();
      untracked(() => {
        if (this.previousNbCallFileSystem !== nb) {
          this.previousNbCallFileSystem = nb;
          this.processCallFS();
        }
      });
    });
  }

  private log(...args: unknown[]) {
    if (this.debug) console.log(...args);
  }

  processCallFS() {
    this.returnDataFS.onInputAction = this.onInputAction;
    for (const item of this.iWaitToRetrieve) {
      if (item.accessFS !== true) continue;
      this.log('nbCallFileSystem iWait=' + item.iWait);
      this.returnDataFS.iWait = item.iWait;
      this.iWait = item.iWait;
      this.onFileSystem(item.iWait);
    }
  }

  onFileSystem(iWait: number) {
    const lockItem = this.tabLock[iWait];
    const action = lockItem.action;
    const result = this.returnDataFS;

    lockItem.status = 0;
    result.errorMsg = '';

    if (this.identification.triggerFileSystem.toUpperCase() !== 'YES') {
      lockItem.lock = 1;
      lockItem.action = '';
      result.errorCode = 0;
      this.resultFileSystem.emit(result);
      return;
    }

    this.manageGoogleService
      .onFileSystem(
        this.configServer,
        this.configServer.bucketFileSystem,
        lockItem.objectName,
        this.tabLock,
        iWait.toString()
      )
      .subscribe({
        next: (data) => this.handleResponse(data, iWait, action, false),
        error: (err) => this.handleResponse(err, iWait, action, true),
      });
  }

  private handleResponse(payload: any, iWait: number, action: string, isError: boolean) {
    const result = this.returnDataFS;
    result.iWait = iWait;
    this.log('return from server iWait=' + iWait);

    if (action === 'onDestroy') {
      if (!isError) {
        this.tabLock[iWait].status = 0;
      } else if (payload?.status !== 900) { // 900 = destroy is fine
        console.log('Google updateFileSystem general error=' + payload?.status +
          '  specific error= ' + payload?.error?.error + ' & message= ' + payload?.error?.message);
        result.errorMsg += '   update FileSystem =' + payload?.status;
      }
      this.resultFileSystem.emit(result);
      return;
    }

    this.returnOnFileSystem(payload, iWait, result);

    if (payload?.status === 666) {
      // Server busy: non-blocking delay before notifying the parent (replaces the old busy-wait loop)
      setTimeout(() => this.resultFileSystem.emit(result), RETRY_DELAY_MS);
    } else {
      this.resultFileSystem.emit(result);
    }
  }

  unlockFile(iWait: number) { this.runAction(iWait, 'unlock'); }
  lockFile(iWait: number) { this.runAction(iWait, 'lock'); }
  checkFile(iWait: number) { this.runAction(iWait, 'check'); }
  checkUpdateFile(iWait: number) { this.runAction(iWait, 'check&update'); }
  updateLockFile(iWait: number) { this.runAction(iWait, 'updatedAt'); }

  private runAction(iWait: number, action: string) {
    this.tabLock[iWait].action = action;
    this.onFileSystem(iWait);
  }

  private isHttpFailure(data: any): boolean {
    return typeof data?.message === 'string' && data.message.startsWith('Http failure response');
  }

  returnOnFileSystem(data: any, iWait: number, dataFromFS: any) {
    const current = this.tabLock[iWait];
    const status = data?.status;
    const tabLockItem = status?.tabLockItem;
    const action = current.action;

    dataFromFS.reAccessFile = false;

    // 1. Server returned the tabLock array
    if (status === 200 && data.tabLock !== undefined) {
      const server = data.tabLock[iWait];
      let statusCode: any;

      if (server.lock === 1 && current.lock !== 1) {
        // now locked for this user: must retrieve the latest version of the file
        statusCode = iWait === 5 ? tabLockItem : 220;
      } else if (server.lock !== 1 && current.lock === 1) {
        // now locked by another user: reaccess the file in locked mode
        statusCode = iWait !== 0 ? 300 : 230;
      } else {
        statusCode = 200;
      }

      this.tabLock[iWait] = server;
      dataFromFS.status = statusCode;
      dataFromFS.onInputAction = '';
      dataFromFS.reAccessFile = true;
      dataFromFS.errorMsg = ` data returned on file ${server.objectName} ==> action = ${server.action}  lock = ${server.lock}  & status = ${server.status}`;
      this.log(dataFromFS.errorMsg);
      return dataFromFS;
    }

    // 2. Server returned a single tabLockItem for check / check&update
    if (tabLockItem !== undefined &&
        (action === 'check' || action === 'check&update') &&
        tabLockItem.createdAt !== undefined) {
      if (tabLockItem.status === 810 || tabLockItem.status === 800) {
        // 810: record belongs to same user; 800: no record / empty file
        if (tabLockItem.status === 800) {
          this.lockFile(iWait); // TODO: review this process
        }
        current.status = tabLockItem;
      } else if (tabLockItem.status === 820) { // record belongs to another user
        current.lock = 2;
        dataFromFS.onInputAction = '';
        dataFromFS.reAccessFile = true;
      }
      return dataFromFS;
    }

    // 3. Known status codes / generic errors
    if (status !== undefined) {
      switch (status) {
        case 300: // record already locked
        case 720: // updatedAt on record locked by another user
          current.lock = 3;
          dataFromFS.onInputAction = '';
          if (status === 720) {
            current.status = 720;
            dataFromFS.reAccessFile = true;
          } else {
            current.status = 300;
            dataFromFS.errorCode = 300;
          }
          break;

        case 700:
        case 710:
        case 712: // unlock requested on a record that doesn't exist / belongs to another user
          current.lock = 0;
          current.status = status;
          dataFromFS.onInputAction = '';
          dataFromFS.errorMsg =
            status === 712 ? 'Access to get credentials is forbidden, updates are not possible'
            : status === 700 ? 'System failure, updates are not possible'
            : 'Record cannot be unlocked, updates are not possible';
          dataFromFS.errorCode = status;
          break;

        case 666:
          dataFromFS.errorMsg = 'server cannot process file system because it is already processed by another user; apps will retry once more after 2 seconds';
          dataFromFS.nbRecall++;
          dataFromFS.status = 666;
          break;

        case 955:
          dataFromFS.errorMsg += 'status error=' + status;
          dataFromFS.theResetServer = true;
          dataFromFS.errorCode = 955;
          current.lock = 3;
          break;

        case 404:
          dataFromFS.errorMsg += 'status error=' + status;
          dataFromFS.errorCode = 404;
          break;

        case 956: // record is locked by another user
          dataFromFS.errorMsg = 'status ' + status + ' ' + data.msg;
          dataFromFS.theResetServer = true;
          dataFromFS.onInputAction = '';
          dataFromFS.errorCode = 720;
          dataFromFS.reAccessFile = true;
          current.lock = 3;
          current.status = 720;
          break;

        case 'err-0': // file system was empty and no action was taken
          this.log('data received:', data, 'on action ' + action);
          break;

        default:
          dataFromFS.onInputAction = '';
          if (action === 'lock' || action === 'unlock') {
            current.status = 0;
            if (action === 'lock') {
              current.lock = 2;
              dataFromFS.errorMsg = 'status ' + status + ' - record is locked ';
            } else {
              current.lock = 3;
            }
          } else {
            current.status = 999;
            dataFromFS.errorCode = 999;
            dataFromFS.errorMsg = this.isHttpFailure(data)
              ? 'FS Server HTTP failure'
              : 'status ' + status + ' - unknown error ';
          }
      }
      return dataFromFS;
    }

    // 4. No status at all
    dataFromFS.errorMsg = this.isHttpFailure(data) ? 'FS Server HTTP failure' : '';
    current.status = 999;
    dataFromFS.errorCode = 999;
    if (action === 'lock') {
      dataFromFS.errorMsg += ' status  999 - record is locked ';
      current.lock = 2;
    }
    return dataFromFS;
  }
}
