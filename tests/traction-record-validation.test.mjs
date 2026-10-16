import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createsCircularLink,isFutureObservation} from '../lib/traction-record-validation.ts';

const records=new Map([
 ['root',{data:{parentAreaId:''}}],
 ['child',{data:{parentAreaId:'root'}}],
 ['grandchild',{data:{parentAreaId:'child'}}],
]);
test('A record cannot reference itself',()=>assert.equal(createsCircularLink('root','root','parentAreaId',records),true));
test('A record cannot reference a descendant',()=>assert.equal(createsCircularLink('root','grandchild','parentAreaId',records),true));
test('A descendant can keep a valid ancestor',()=>assert.equal(createsCircularLink('grandchild','root','parentAreaId',records),false));
test('Clearing the parent remains possible',()=>assert.equal(createsCircularLink('root','','parentAreaId',records),false));
test('Existing dependency loops are rejected without hanging',()=>{
 const loop=new Map([['a',{data:{dependsOnId:'b'}}],['b',{data:{dependsOnId:'a'}}]]);
 assert.equal(createsCircularLink('new','a','dependsOnId',loop),true);
});
test('Long acyclic dependency chains are accepted',()=>{
 const chain=new Map(Array.from({length:80},(_,i)=>[String(i),{data:{dependsOnId:i?String(i-1):''}}]));
 assert.equal(createsCircularLink('new','79','dependsOnId',chain),false);
});
test('Future observations are rejected',()=>assert.equal(isFutureObservation('2026-10-17','2026-10-16'),true));
test('Today and past observations remain valid',()=>{
 assert.equal(isFutureObservation('2026-10-16','2026-10-16'),false);
 assert.equal(isFutureObservation('2026-10-15','2026-10-16'),false);
});
test('Invalid dates are left to the date format validation',()=>{
 for(const value of ['', 'texto', '2026-13-99', '2026-02-31'])assert.equal(isFutureObservation(value,'2026-10-16'),false);
});
