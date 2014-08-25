var test = require('tape');
var Clusterer = require('./');

// Typically you'd get this as ImageData.data.
var input = [254, 255, 255, 255, 235, 235, 235, 255, 213, 213, 213, 255, 197, 0, 0, 255, 179, 179, 179, 255, 179, 179, 179, 255, 42, 78, 182, 255, 42, 78, 182, 255, 42, 78, 182, 255, 0, 185, 50, 255, 0, 185, 50, 255];
var palette3 = [
  0, 0, 0, 255,
  1, 1, 1, 255,
  2, 2, 2, 255
]
var palette4 = [
  0, 0, 0, 255,
  1, 1, 1, 255,
  2, 2, 2, 255,
  3, 3, 3, 255
]
var palette6 = [
  0, 0, 0, 255,
  1, 1, 1, 255,
  2, 2, 2, 255,
  3, 3, 3, 255,
  4, 4, 4, 255,
  5, 5, 5, 255
]

test('Clusterer: makes 4 clusters', function(t) {
  var c = new Clusterer(input);

  c.solve(
    function progress(iterationCount) {},
    function complete(iterationCount) {
      t.ok(iterationCount > 0, 'took more than one iteration to converge');

      var output = c.applyPalette(palette4);
      t.deepEqual(output, new Uint8ClampedArray([
        3, 3, 3, 255,
        3, 3, 3, 255,
        3, 3, 3, 255,
        1, 1, 1, 255,
        3, 3, 3, 255,
        3, 3, 3, 255,
        2, 2, 2, 255,
        2, 2, 2, 255,
        2, 2, 2, 255,
        1, 1, 1, 255,
        1, 1, 1, 255
      ]))

      t.end();
    }
  )
})

test('Clusterer: makes 6 clusters', function(t) {
  var c = new Clusterer(input, {clusters: 6});

  c.solve(
    function progress(iterationCount) {},
    function complete(iterationCount) {
      t.ok(iterationCount > 0, 'took more than one iteration to converge');

      var output = Array.apply([], c.applyPalette(palette6));
      var expected = [
        5, 5, 5, 255,
        5, 5, 5, 255,
        5, 5, 5, 255,
        2, 2, 2, 255,
        4, 4, 4, 255,
        4, 4, 4, 255,
        2, 2, 2, 255,
        2, 2, 2, 255,
        2, 2, 2, 255,
        2, 2, 2, 255,
        2, 2, 2, 255
      ];

      var expectedClusters = [
        [0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0],
        [12,24,28,32,36,40,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0],
        [16,20,0,0,0,0,0,0,0,0,0],
        [0,4,8,0,0,0,0,0,0,0,0]
      ];

      c.clusters.forEach(function(cluster, i) {
        t.deepEqual(Array.apply([], cluster.data), expectedClusters[i],
          'Cluster ' + i + ' has expected pixel offsets');
      })

      t.deepEqual(output, expected, 'pixel data matches')
      t.end();
    }
  )
})