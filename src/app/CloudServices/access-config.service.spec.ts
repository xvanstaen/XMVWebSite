import { TestBed } from '@angular/core/testing';

import { AccessConfigService } from './access-config.service';

describe('AccessConfigService', () => {
  let service: AccessConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccessConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
