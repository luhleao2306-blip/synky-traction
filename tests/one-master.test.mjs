import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasMasterAccess } from '../lib/one-master.ts';
test('verified One administrator receives the master surface',()=>assert.equal(hasMasterAccess({userId:'one-mapped',oneAdministrator:true},'native-owner'),true));
test('One client and company administrator remain restricted',()=>{
 for(const oneAdministrator of [undefined,false,'true',1]) assert.equal(hasMasterAccess({userId:'client',oneAdministrator},'native-owner'),false);
});
test('native pinned master remains valid',()=>assert.equal(hasMasterAccess({userId:'native-owner'},'native-owner'),true));
test('unconfigured native identity has no master access',()=>assert.equal(hasMasterAccess({userId:'client'}),false));
