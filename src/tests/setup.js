// Test setup file for Vitest
import { beforeAll, afterAll } from 'vitest';
import FDBFactory from 'fake-indexeddb/lib/FDBFactory.js';
import FDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange.js';

// Mock IndexedDB for testing environment
beforeAll(() => {
  // Setup fake IndexedDB
  global.indexedDB = new FDBFactory();
  global.IDBKeyRange = FDBKeyRange;
  global.IDBCursor = require('fake-indexeddb/lib/FDBCursor.js');
  global.IDBDatabase = require('fake-indexeddb/lib/FDBDatabase.js');
  global.IDBIndex = require('fake-indexeddb/lib/FDBIndex.js');
  global.IDBObjectStore = require('fake-indexeddb/lib/FDBObjectStore.js');
  global.IDBOpenDBRequest = require('fake-indexeddb/lib/FDBOpenDBRequest.js');
  global.IDBRequest = require('fake-indexeddb/lib/FDBRequest.js');
  global.IDBTransaction = require('fake-indexeddb/lib/FDBTransaction.js');
  global.IDBVersionChangeEvent = require('fake-indexeddb/lib/FDBVersionChangeEvent.js');
});

afterAll(() => {
  // Cleanup after all tests
});