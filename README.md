ncolorpalette-clusterer
=======================

Group an array of pixels using [k-means clustering][] as efficiently as possible.

[k-means clustering]: http://en.wikipedia.org/wiki/K-means_clustering

Usage
-----

```js
var Clusterer = require('ncolorpalette-clusterer');

// Input can be any array-like object.
var cvs = document.querySelector('canvas')
var ctx = cvs.getContext('2d');
var input = ctx.getImageData(0, 0, cvs.width, cvs.height);

var c = new Clusterer(input.data, {
  // listing defaults:

  // how many clusters to find
  clusters: 4,

  // input data is logically grouped by 4 indices (r,g,b,a)
  dataFactor: 4,

  // `false` is faster, but will lock the event loop on large images
  async: true,

  // what function to use when computing pixel difference, default
  // is rgba distance (which is not ideal)
  comparator: function rgbdist2(r1, g1, b1, a1, r2, g2, b2, a2) {}
});

c.solve(
  function progress(iterationCount) {},
  function complete(iterationCount) {
    var palette = [
      0, 0, 0, 255,
      63, 0, 0, 255,
      126, 0, 0, 255,
      255, 0, 0, 255
    ]

    // Return a new array of pixel data.
    var output = c.applyPalette(palette);

    // Or, update in place:
    c.applyPalette(palette, input.data);

    // Then do something with it:
    ctx.putImageData(input, 0, 0);

    // You could also manually access the clustered pixels.
    // Each cluster is an allocated-dynamic-array
    // http://npmjs.org/package/allocated-dynamic-array
    var index = c.clusters[0].get(0);
    var r = input.data[index+0];
    var g = input.data[index+1];
    var b = input.data[index+2];
    var a = input.data[index+3];
  });
```

Efficiency
----------

The clusterer uses several primary techniques to be as efficient as possible in terms of execution speed and garbage creation:

- A pixel is always represented as 4 uint8 integer values in contiguous TypedArrays, never as intermediate objects (like `{r: 0, g: 0, b: 0, a: 255}` or `[0, 0, 0, 255]`).
- "Pointers" to pixels are stored in preallocated TypedArrays that simply point at the index of the `r` (red) value in the original input data.

The speed of this package could be improved in a few ways, but primarily through algorithm changes, such as creating an index of unique pixel colors for large images.

License
-------

MIT



