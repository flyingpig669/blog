const test=require('node:test'),assert=require('node:assert/strict');
test('reading positions persist, recent entries are ordered, and settings are constrained',async(t)=>{
  const memory=new Map(),original=global.localStorage;
  global.localStorage={getItem:key=>memory.get(key),setItem:(key,value)=>memory.set(key,value)};
  t.after(()=>{global.localStorage=original;});
  const services=await import('../src/lib/reading.js?test=positions');
  services.recordReading('first',{top:420,progress:0.5},1);
  services.recordReading('second',{top:90,progress:0.1},2);
  services.recordReading('first',undefined,3);
  assert.equal(services.reading.entries.first.top,420);
  assert.deepEqual(services.recentlyRead([{slug:'first'},{slug:'second'},{slug:'unknown'}]).map(p=>p.slug),['first','second']);
  services.setReadingSettings(22,2.2);
  const restored=await import('../src/lib/reading.js?test=restored');
  assert.equal(restored.reading.fontSize,22);
  assert.equal(restored.reading.entries.first.top,420);
  restored.setReadingSettings(999,'bad');
  assert.equal(restored.reading.fontSize,17);
  assert.equal(restored.reading.lineHeight,1.8);
  services.recordReading('first',{top:-100,progress:1.5});
  assert.equal(services.reading.entries.first.top,0);
  assert.equal(services.reading.entries.first.progress,1);
});
test('broken local storage does not prevent reading',async(t)=>{
  const original=global.localStorage;global.localStorage={getItem:()=>'{broken',setItem:()=>{throw Error('full');}};
  t.after(()=>{global.localStorage=original;});
  const services=await import('../src/lib/reading.js?test=broken');
  assert.deepEqual(Object.keys(services.reading.entries),[]);
  assert.doesNotThrow(()=>services.persistReading());
});
test('attachment metadata formats byte sizes without downloading the file',async()=>{
  const {fileSize,fileKind}=await import('../src/lib/attachments.js');
  assert.equal(fileSize(2048),'2.0 KB');assert.equal(fileSize(undefined),'外部文件');
  assert.equal(fileKind('attachments/课件.PPTX?download=1'),'PPT');
});
