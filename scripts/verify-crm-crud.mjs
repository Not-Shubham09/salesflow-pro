// verify-crm-crud.mjs
// Lightweight assert-based self-check for SalesFlow Pro CRM services and storage

import assert from 'node:assert/strict';
import { localCrmStorage } from '../src/utils/localCrmStorage.js';

console.log('--- RUNNING CRM STORAGE & CRUD VERIFICATION ---');

// 1. Initial Data Verification
const initialContacts = localCrmStorage.getContacts();
assert.equal(initialContacts.success, true, 'getContacts should return success');
assert.ok(initialContacts.data.length >= 6, `Expected at least 6 initial contacts, got ${initialContacts.data.length}`);
console.log('✓ Initial contacts verification passed');

// 2. Contact Creation
const testContact = {
  first_name: 'Alan',
  last_name: 'Turing',
  email: 'alan.turing@bletchley.ac.uk',
  phone: '+44 1908 640404',
  company: 'Enigma Computing',
  position: 'Chief Cryptanalyst',
  status: 'active',
  tags: ['enterprise', 'security', 'tech']
};
const createContactRes = localCrmStorage.createContact(testContact);
assert.equal(createContactRes.success, true, 'createContact should succeed');
assert.equal(createContactRes.data.first_name, 'Alan');
const newContactId = createContactRes.data.id;
console.log('✓ Contact creation passed:', newContactId);

// 3. Contact Retrieval & Detail
const getSingleContact = localCrmStorage.getContact(newContactId);
assert.equal(getSingleContact.success, true);
assert.equal(getSingleContact.data.company, 'Enigma Computing');
console.log('✓ Contact single retrieval passed');

// 4. Contact Update
const updateContactRes = localCrmStorage.updateContact(newContactId, { position: 'Director of AI' });
assert.equal(updateContactRes.success, true);
assert.equal(updateContactRes.data.position, 'Director of AI');
console.log('✓ Contact update passed');

// 5. Deals Verification & CRUD
const initialDeals = localCrmStorage.getDeals();
assert.equal(initialDeals.success, true);
assert.ok(initialDeals.data.length >= 6, 'Expected at least 6 initial deals');

const newDeal = {
  title: 'Quantum Computing Pilot',
  contact_id: newContactId,
  value: 250000,
  stage: 'qualified',
  probability: 40
};
const createDealRes = localCrmStorage.createDeal(newDeal);
assert.equal(createDealRes.success, true);
const newDealId = createDealRes.data.id;
assert.equal(createDealRes.data.value, 250000);
console.log('✓ Deal creation passed:', newDealId);

// 6. Deal Stage Transition (Drag & Drop behavior)
const stageUpdateRes = localCrmStorage.updateDealStage(newDealId, 'negotiation');
assert.equal(stageUpdateRes.success, true);
assert.equal(stageUpdateRes.data.stage, 'negotiation');
assert.equal(stageUpdateRes.data.probability, 85);
console.log('✓ Deal stage transition passed (85% probability set for negotiation)');

// 7. Pipeline Data Grouping
const pipelineRes = localCrmStorage.getPipelineDeals();
assert.equal(pipelineRes.success, true);
assert.ok(pipelineRes.data.negotiation.deals.some(d => d.id === newDealId));
console.log('✓ Pipeline grouping passed');

// 8. Tasks CRUD
const taskRes = localCrmStorage.createTask({
  title: 'Review encryption specifications',
  deal_id: newDealId,
  contact_id: newContactId,
  priority: 'high',
  status: 'pending'
});
assert.equal(taskRes.success, true);
const taskId = taskRes.data.id;
const completeTaskRes = localCrmStorage.updateTask(taskId, { status: 'completed' });
assert.equal(completeTaskRes.success, true);
assert.equal(completeTaskRes.data.status, 'completed');
console.log('✓ Task creation and completion passed');

// 9. Activity Feed
const actRes = localCrmStorage.createActivity({
  type: 'meeting',
  subject: 'Architecture review call',
  content: 'Presented cryptographic validation architecture to engineering lead.',
  deal_id: newDealId,
  contact_id: newContactId
});
assert.equal(actRes.success, true);
const activities = localCrmStorage.getActivities(10);
assert.equal(activities.success, true);
assert.ok(activities.data.length > 0);
console.log('✓ Activity timeline creation and retrieval passed');

// 10. Auth Verification
const authRes = localCrmStorage.signIn('sales.manager@salesflow.com', 'Manager456!');
assert.equal(authRes.success, true);
assert.equal(authRes.data.user.email, 'sales.manager@salesflow.com');
const userProfile = localCrmStorage.getUserProfile(authRes.data.user.id);
assert.equal(userProfile.success, true);
assert.equal(userProfile.data.role, 'sales_manager');
console.log('✓ Demo authentication passed (Jordan Hayes, sales_manager)');

// 11. Cleanup Deletions
const delDealRes = localCrmStorage.deleteDeal(newDealId);
assert.equal(delDealRes.success, true);
const delContactRes = localCrmStorage.deleteContact(newContactId);
assert.equal(delContactRes.success, true);
console.log('✓ Deletions and record cleanup passed');

console.log('----------------------------------------------------');
console.log('ALL CRM CRUD SELF-CHECKS PASSED SUCCESSFULLY (11/11)');
console.log('----------------------------------------------------');
