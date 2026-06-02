import { describe, it, expect } from 'vitest';
import { dnsRouter } from './dns';

describe('DNS Router', () => {
  it('should have all required procedures', () => {
    expect(dnsRouter.createCaller).toBeDefined();
    
    // Check that all procedures exist
    const procedures = ['getRecords', 'addRecord', 'deleteRecord', 'checkHealth', 'setupMicrosoft365', 'updateRecords'];
    
    procedures.forEach(proc => {
      expect(dnsRouter._def.record[proc]).toBeDefined();
    });
  });

  it('should have getRecords as a query', () => {
    const getRecords = dnsRouter._def.record.getRecords;
    expect(getRecords).toBeDefined();
    expect(getRecords._def.meta?.type).toBe('query');
  });

  it('should have addRecord as a mutation', () => {
    const addRecord = dnsRouter._def.record.addRecord;
    expect(addRecord).toBeDefined();
    expect(addRecord._def.meta?.type).toBe('mutation');
  });

  it('should have deleteRecord as a mutation', () => {
    const deleteRecord = dnsRouter._def.record.deleteRecord;
    expect(deleteRecord).toBeDefined();
    expect(deleteRecord._def.meta?.type).toBe('mutation');
  });

  it('should have checkHealth as a query', () => {
    const checkHealth = dnsRouter._def.record.checkHealth;
    expect(checkHealth).toBeDefined();
    expect(checkHealth._def.meta?.type).toBe('query');
  });

  it('should have setupMicrosoft365 as a mutation', () => {
    const setupMicrosoft365 = dnsRouter._def.record.setupMicrosoft365;
    expect(setupMicrosoft365).toBeDefined();
    expect(setupMicrosoft365._def.meta?.type).toBe('mutation');
  });

  it('should have updateRecords as a mutation', () => {
    const updateRecords = dnsRouter._def.record.updateRecords;
    expect(updateRecords).toBeDefined();
    expect(updateRecords._def.meta?.type).toBe('mutation');
  });
});
