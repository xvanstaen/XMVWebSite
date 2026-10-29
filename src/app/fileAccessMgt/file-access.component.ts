import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy,
  input, effect, signal, untracked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { timeout } from 'rxjs';

import { FileSystemServiceComponent } from '../file-system-service/file-system-service.component';
import { msginLogConsole } from '../consoleLog';
import { configServer, LoginIdentif, msgConsole, classCredentials, classtheEvent, classGetRecord } from '../JsonServerClass';
import { classAccessFile, classHeaderReturnDataFS, classRetrieveFile } from '../classFileSystem';
import { ManageGoogleService } from '../CloudServices/ManageGoogle.service';
import { fnCheckLockLimit } from '../MyStdFunctions';

const GET_TIMEOUT_MS = 100_000;
const MAX_RECALL_FS = 4;

@Component({
  selector: 'app-file-access',
  templateUrl: './file-access.component.html',
  styleUrls: ['./file-access.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FileSystemServiceComponent],
})
export class MainManageFileComponent {

  @Input() configServer = new configServer;
  @Input() identification = new LoginIdentif;

  @Input() credentials = new classCredentials;
  @Input() credentialsMongo = new classCredentials;
  @Input() credentialsFS = new classCredentials;

  @Input() iWaitToRetrieve: Array<classRetrieveFile> = [];
  @Input() eventCheckToLimit = new classtheEvent;
  @Input() tabLock: Array<classAccessFile> = []; // 0=unlocked; 1=locked by user; 2=locked by other user; 3=must be checked

  triggerCheckToLimit = input.required<number>();
  triggerReadFile = input.required<number>();
  triggerSaveFile = input.required<number>();
  triggerFileSystem = input.required<number>();

  @Output() returnFile = new EventEmitter<classGetRecord>();
  @Output() returnSaveFn = new EventEmitter<classGetRecord>();
  @Output() resultFileSystem = new EventEmitter<any>();

  returnDataFS = new classHeaderReturnDataFS;

  nbCallFileSystem = signal<number>(0);
  isCallFS = signal<boolean>(false);

  theEvent = new classtheEvent;

  counterActions = 0;
  returnActionFile = 0;

  myLogConsole = false;
  myConsole: Array<msgConsole> = [];
  SaveConsoleFinished = false;
  type = '';
  HTTP_Address = '';

  iWait = 0;
  loopCheckToLimit = 0;
  nbRecallFS = 0;
  nbAccessFS = -1;
  previoustriggerFileSystem:number=-1;
  previoustriggerCheckToLimit:number=-1;
  previoustriggerReadFile:number=-1;
  previoustriggerSaveFile:number=-1;

  /** Set to true to enable verbose tracing. */
  private debug = false;

  constructor(private manageGoogleService: ManageGoogleService) {
    // One effect per trigger: each only depends on its own input.
    // Handlers run untracked so signals they read/write never become dependencies.
    effect(() => {
      if (this.previoustriggerFileSystem!==this.triggerFileSystem()){
        this.previoustriggerFileSystem=this.triggerFileSystem();
        const t = this.triggerFileSystem();
        untracked(() => this.processTriggerFS(t));
      }
    });

    effect(() => {
       if (this.previoustriggerReadFile!==this.triggerReadFile()){
        this.previoustriggerReadFile=this.triggerReadFile();
        const t = this.triggerReadFile();
        untracked(() => this.processReadFile(t));
       }
    });

    effect(() => {
      if (this.previoustriggerCheckToLimit!==this.triggerCheckToLimit()){
        this.previoustriggerCheckToLimit=this.triggerCheckToLimit();
            this.triggerCheckToLimit();
            untracked(() => {
              this.loopCheckToLimit = 0;
              this.processCheckToLimit();
            });
        }
    });

    effect(() => {
      if (this.previoustriggerSaveFile!==this.triggerSaveFile()){
        this.previoustriggerSaveFile=this.triggerSaveFile();
        this.triggerSaveFile();
        untracked(() => {
          const e = this.eventCheckToLimit;
          this.saveNewRecord(e.bucket, e.object, e.fileContent, e.iWait);
        });
      }
    });
  }

  // ---------------------------------------------------------------- triggers

  processTriggerFS(trigger: number) {
    this.log('processTriggerFS --', trigger);
    if (this.iWaitToRetrieve.length > 0) {
      this.requestFileSystemCall();
    }
  }

  processReadFile(trigger: number) {
    this.log('processReadFile --', trigger);
    for (const item of this.iWaitToRetrieve) {
      this.retrieveRecord(item.iWait);
    }
    this.log('processReadFile nb of files read --', this.iWaitToRetrieve.length);
    this.nbCallFileSystem.update(n => n + 1);
  }

  processCheckToLimit() {
    if (this.eventCheckToLimit.checkLock.iCheck === true) {
      this.nbRecallFS = 0;
      this.loopCheckToLimit++;
      this.log('processCheckToLimit iWait=', this.eventCheckToLimit.iWait);
      this.checkLockLimit(this.eventCheckToLimit);
    }
  }

  // ------------------------------------------------------------- file system

  resultFileSystemFn(event: any) {
    this.log('resultFileSystemFn iWait=', event.iWait, 'errorCode=', event.errorCode);

    if (event.errorCode === 666) {
      if (this.nbRecallFS < MAX_RECALL_FS) {
        this.nbRecallFS++;
        this.requestFileSystemCall();
      } else {
        this.nbRecallFS = 0;
      }
      return;
    }

    this.returnDataFS = event;
    this.resultFileSystem.emit(this.returnDataFS);
  }

  checkLockLimit(event: any) {
    this.nbCallFileSystem.set(0);
    this.log('start checkLockLimit nbCallFileSystem=', this.nbCallFileSystem(), 'nbRecall=', this.returnDataFS.nbRecall);

    const check = event.checkLock;
    let valueCheck = { action: '', lockValue: 0, lockAction: '' };

    if (this.identification.triggerFileSystem.toUpperCase() !== 'YES') {
      valueCheck.action = this.eventCheckToLimit.checkLock.isSaveFile === true ? 'ProcessSave' : 'noAction';
    } else {
      valueCheck = fnCheckLockLimit(
        this.configServer, this.tabLock, check.iWait, check.lastInputAt, check.isDataModified, check.isSaveFile
      );
    }

    switch (valueCheck.action) {
      case 'noAction':
        this.counterActions++;
        this.returnActionFile = this.counterActions;
        this.returnDataFS.nbRecall++;
        this.returnDataFS.iWait = check.iWait;
        this.returnDataFS.errorCode = 0;
        this.returnDataFS.errorMsg = '';
        this.returnDataFS.checkToLimit = 0; // no action needed; process should continue
        this.resultFileSystem.emit(this.returnDataFS);
        break;

      case 'changeTabLock':
        this.tabLock[check.iWait].lock = valueCheck.lockValue;
        break;

      case 'ProcessSave':
        this.mainSaveProcess(this.eventCheckToLimit);
        break;

      default: {
        const toRetrieve = new classRetrieveFile;
        toRetrieve.iWait = check.iWait;
        toRetrieve.accessFS = true;
        // Replace rather than mutate the @Input array in place.
        this.iWaitToRetrieve = [toRetrieve];

        if (this.loopCheckToLimit <= 2) {
          this.requestFileSystemCall();
        }

        if (valueCheck.action === 'updateSystemFile') {
          this.tabLock[check.iWait].action = valueCheck.lockAction;
        } else if (valueCheck.action === 'checkFile') {
          this.tabLock[check.iWait].action = check.isSaveFile === false ? 'check&update' : 'check';
        }
      }
    }

    this.log('end checkLockLimit nbCallFileSystem=', this.nbCallFileSystem(), 'nbRecall=', this.returnDataFS.nbRecall);
  }

  private requestFileSystemCall() {
    this.nbCallFileSystem.update(n => n + 1);
    this.isCallFS.set(true);
  }

  // --------------------------------------------------------------- read file

  private fileMap(): Record<number, [string, string]> {
    const { fitness: f, configFitness: c } = this.identification;
    return {
      0: [f.bucket, f.files.fileHealth],
      1: [c.bucket, c.files.calories],
      2: [c.bucket, c.files.convertUnit],
      3: [c.bucket, c.files.confHTML],
      4: [c.bucket, c.files.confChart],
      5: [f.bucket, f.files.myChartConfig],
      6: [f.bucket, f.files.recipe],
      10: [c.bucket, c.files.convToDisplay],
    };
  }

  retrieveRecord(iWait: number) {
    const target = this.fileMap()[iWait];
    if (!target) return;

    this.getRecord(target[0], target[1], iWait);
    this.iWait = iWait;
    if (this.tabLock[iWait]) {
      this.tabLock[iWait].action = 'check&update';
    }
  }

  getRecord(bucket: string, object: string, iWait: number) {
    this.log('getRecord iWait=', iWait);

    this.manageGoogleService.getContentObject(this.configServer, bucket, object)
      .pipe(timeout(GET_TIMEOUT_MS))
      .subscribe({
        next: data => {
          const failed = data.status !== undefined && data.status !== 200;
          this.returnFile.emit(this.buildRecord(
            iWait,
            failed ? '' : data,
            failed ? data.status : 0,
            failed ? data.msg : ''
          ));
        },
        error: err => {
          const httpFail = typeof err?.message === 'string' && err.message.startsWith('Http failure response');
          this.log('getRecord error iWait=', iWait, err);
          this.returnFile.emit(this.buildRecord(
            iWait, '', 700, httpFail ? 'Server HTTP failure' : err
          ));
        },
      });
  }

  /** A fresh object per emission, so concurrent requests never overwrite each other. */
  private buildRecord(iWait: number, content: any, status: number, err: any = ''): classGetRecord {
    const rec = new classGetRecord;
    rec.iWait = iWait;
    rec.content = content;
    rec.status = status;
    rec.err = err;
    return rec;
  }

  // --------------------------------------------------------------- save file

  mainSaveProcess(event: any) {
    this.saveNewRecord(event.bucket, event.object, event.fileContent, event.iWait);
  }

  saveNewRecord(bucket: string, object: string, record: any, iWait: number) {
    let content: any = record;

    if (object === 'ConsoleLog.json') {
      object = 'ConsoleLog.json-' + new Date().toString().substring(4, 21);
      content = this.myConsole;
    }
    const file = new File([JSON.stringify(content)], object, { type: 'application/json' });

    this.nbCallFileSystem.set(0);
    if (this.identification.triggerFileSystem.toUpperCase() === 'YES') {
      if (this.tabLock[iWait]) {
        this.tabLock[iWait].action = 'updatedAt';
      }
      this.requestFileSystemCall();
    }
    this.log('saveNewRecord object=', object);

    this.manageGoogleService.uploadObject(this.configServer, bucket, file, object)
      .subscribe({
        next: res => {
          if (res.type !== HttpEventType.Response) return;
          this.log('saveNewRecord success object=', object);
          this.counterActions++;
          this.returnActionFile = this.counterActions;
          if (this.tabLock[iWait]) {
            this.tabLock[iWait].status = 0;
          }
          this.returnSaveFn.emit(this.buildRecord(iWait, '', 200));
        },
        error: e => {
          this.counterActions++;
          this.returnActionFile = -this.counterActions;
          this.returnSaveFn.emit(this.buildRecord(
            iWait, '', 700, `File ${object} *** Save action failed - status is ${e.status}`
          ));
        },
      });
  }

  // ----------------------------------------------------------------- console

  LogMsgConsole(msg: string) {
    if (this.myConsole.length > 40) {
      this.saveNewRecord('logconsole', 'ConsoleLog.json', this.myConsole, -1);
    }
    this.SaveConsoleFinished = false;
    this.myLogConsole = true;
    msginLogConsole(msg, this.myConsole, this.myLogConsole, this.SaveConsoleFinished, this.HTTP_Address, this.type);
  }

  private log(...args: unknown[]) {
    if (this.debug) console.log('[file-access]', ...args);
  }
}
