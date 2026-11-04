import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

test('Productividad no renombra ni oculta la esfera del catálogo', () => {
  const button = { id: 'btn-arriba', style: {} };
  const document = {
    readyState: 'complete',
    head: { appendChild() {} },
    createElement: () => ({}),
    getElementById: id => id === 'btn-arriba' ? button : null,
    addEventListener() {},
  };
  runInNewContext(readFileSync('public/tienda-productividad.js', 'utf8'), {
    window: {}, document, requestAnimationFrame: () => 1,
  });
  assert.equal(button.id, 'btn-arriba');
  assert.equal(button.style.display, undefined);
});

test('Volver arriba desplaza suavemente el panel y la página', () => {
  const html = readFileSync('public/index.html', 'utf8');
  const source = html.slice(html.indexOf('function volverArriba(){'), html.indexOf('(function(){', html.indexOf('function volverArriba(){')));
  const calls = [];
  const tab = { scrollTop: 800, scrollTo: options => calls.push(['panel', options]) };
  const context = { document: { getElementById: () => tab }, window: { scrollTo: options => calls.push(['page', options]) } };
  runInNewContext(source + '\nvolverArriba();', context);
  assert.equal(calls.length, 2);
  for (const [, options] of calls) {
    assert.equal(options.top, 0);
    assert.equal(options.behavior, 'smooth');
  }
});
