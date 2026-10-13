import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readBrandLogo} from '../lib/traction-logo.ts';

const fixtures=JSON.parse(readFileSync(new URL('./logo-fixtures.json',import.meta.url),'utf8'));
for(const [name,{type,base64}] of Object.entries(fixtures)) {
  const bytes=Buffer.from(base64,'base64');
  test('Accepts complete '+name,async()=>{
    const image=await readBrandLogo(new File([bytes],name,{type}));
    assert.equal(image.contentType,type);
    assert.deepEqual(Buffer.from(image.bytes),bytes);
  });
  test('Rejects truncated '+name,async()=>{
    for(const payload of [bytes.subarray(0,8),bytes.subarray(0,-8),bytes.subarray(0,Math.floor(bytes.length/2))]) {
      assert.ok((await readBrandLogo(new File([payload],name,{type}))).error);
    }
  });
  test('Rejects misleading MIME for '+name,async()=>{
    assert.ok((await readBrandLogo(new File([bytes],name,{type:'image/svg+xml'}))).error);
  });
}
test('Rejects damaged PNG data',async()=>{
  const bytes=Buffer.from(fixtures['valid.png'].base64,'base64');bytes[45]^=255;
  assert.ok((await readBrandLogo(new File([bytes],'damaged.png',{type:'image/png'}))).error);
});
test('Rejects empty uploads',async()=>assert.ok((await readBrandLogo(new File([],'empty.png',{type:'image/png'}))).error));
test('Rejects uploads above 2 MB',async()=>assert.ok((await readBrandLogo(new File([new Uint8Array(2*1024*1024+1)],'large.png',{type:'image/png'}))).error));
