(async function(){
  var parts = ['./c0.js','./c1.js','./c2.js','./c3.js'];
  var code = '';
  for (var i=0;i<parts.length;i++){
    var r = await fetch(parts[i]);
    code += await r.text();
  }
  (0,eval)(code);
})();
