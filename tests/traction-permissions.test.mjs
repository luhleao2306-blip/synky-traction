import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canCreateRecord,canWriteRecord} from '../lib/traction-permissions.ts';

const scope={role:'responsavel',email:'responsavel@example.test',area_id:null};
const record=(id,kind,data)=>({id,kind,data,organization_id:'test',created_at:'',updated_at:'',version:1,archived_at:null});
const own=record('own','initiative',{areaId:'people',ownerEmail:scope.email});
const other=record('other','initiative',{areaId:'people',ownerEmail:'other@example.test'});
const request=record('request','updateRequest',{ownerEmail:scope.email});
const byId=new Map([own,other,request].map(r=>[r.id,r]));

test('Responsible person cannot create an initiative assigned to themselves',()=>assert.equal(canCreateRecord(scope,own,byId),false));
test('Responsible person can still update their assigned initiative',()=>assert.equal(canWriteRecord(scope,own,byId),true));
test('Responsible person cannot create their own update request',()=>assert.equal(canCreateRecord(scope,request,byId),false));
test('Responsible person can still answer their assigned update request',()=>assert.equal(canWriteRecord(scope,request,byId),true));
test('Responsible person can register progress for assigned work',()=>assert.equal(canCreateRecord(scope,record('progress','progress',{initiativeId:own.id}),byId),true));
test('Responsible person cannot register progress for someone else',()=>assert.equal(canCreateRecord(scope,record('progress','progress',{initiativeId:other.id}),byId),false));
test('Reader cannot create an initiative',()=>assert.equal(canCreateRecord({...scope,role:'leitor'},own,byId),false));
test('Administrator can create and assign an initiative',()=>assert.equal(canCreateRecord({...scope,role:'admin'},own,byId),true));
test('Area manager can create an initiative for their area',()=>assert.equal(canCreateRecord({...scope,role:'gestor',area_id:'people'},own,byId),true));
test('Direction can create strategy objectives',()=>assert.equal(canCreateRecord({...scope,role:'direcao'},record('objective','objective',{}),byId),true));
