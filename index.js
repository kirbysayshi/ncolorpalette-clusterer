var ADTA = require('allocated-dynamic-typedarray');

function Clusterer(pixels, opts) {
  opts = opts || {};
  var count = opts.clusters || 4;

  this.dataFactor = opts.dataFactor || 4;
  this.async = opts.async === false ? false : true;
  this.dist = opts.comparator || rgbaDist2;

  this.pixels = pixels;
  this.clusters = [];
  this.means = this.defaultInitialMeans(count);

  // Each value in the cluster will point to the index of a value
  // within the sourceData. A.K.A. each cluster is a list of pointers
  // to the "memory" that is the sourceData.

  var maxClusterSize = this.pixels.length / this.dataFactor;

  for (var i = 0; i < count; i++) {
    this.clusters.push(new ADTA(maxClusterSize));
  }

  // Place each offset of the first component of each pixel
  // into an initial cluster.
  for (var i = 0; i < pixels.length; i+= this.dataFactor) {
    this.clusterForPixel(i).push(i);
  }
}

module.exports = Clusterer;

Clusterer.prototype.clusterForPixel = function(dataIdx) {
  var min = Number.MAX_VALUE;
  var target = -1;
  for (var i = 0; i < this.means.length; i += 4) {
    var dist = this.dist(
      this.means[i+0],
      this.means[i+1],
      this.means[i+2],
      this.means[i+3],

      this.pixels[dataIdx+0],
      this.pixels[dataIdx+1],
      this.pixels[dataIdx+2],
      this.pixels[dataIdx+3]
    )

    if (dist < min) {
      min = dist;
      target = i;
    }
  }

  return this.clusters[target / this.dataFactor];
}

Clusterer.prototype.updateMeans = function() {
  var means = this.means;
  var clusters = this.clusters;
  var sourceData = this.pixels;

  clusters.forEach(function(cluster, meanIdx) {
    var r = 0, g = 0, b = 0;

    for (var i = 0; i < cluster.length(); i++) {
      var sourceIdx = cluster.get(i);
      r += sourceData[sourceIdx+0];
      g += sourceData[sourceIdx+1];
      b += sourceData[sourceIdx+2];
    }

    // cluster length of 0 means NaN.
    var meanR = Math.floor(r / cluster.length()) || 0;
    var meanG = Math.floor(g / cluster.length()) || 0;
    var meanB = Math.floor(b / cluster.length()) || 0;

    means[meanIdx*this.dataFactor+0] = meanR;
    means[meanIdx*this.dataFactor+1] = meanG;
    means[meanIdx*this.dataFactor+2] = meanB;
  });
}

Clusterer.prototype.updateClusters = function() {
  var clusters = this.clusters;
  var means = this.means;
  var sourceData = this.pixels;

  var movementCount = 0;
  for (var i = 0; i < clusters.length; i++) {
    var cluster = clusters[i];
    for (var j = 0; j < cluster.length(); j++) {
      var didx = cluster.get(j);

      var targetCluster = this.clusterForPixel(didx);

      if (targetCluster !== cluster) {
        targetCluster.push(cluster.get(j));
        cluster.remove(j);
        movementCount += 1;
        // If we removed an element from this cluster, ensure
        // we don't skip the next element.
        j--;
      }
    }
  }

  return movementCount;
}

Clusterer.prototype.solve = function(progress, complete) {
  var means = this.updateMeans.bind(this);
  var clusters = this.updateClusters.bind(this);
  var self = this;
  var count = 0;

  if (this.async) {
    (function next() {
      setTimeout(function() {
        means();
        var moved = clusters();
        count += 1;
        if (moved > 0) {
          progress(self, count);
          next();
        } else {
          complete(self, count);
        }
      }, 0)
    }())
  } else {
    var moved = 1;
    while (moved > 0) {
      means();
      moved = clusters();
      count += 1;
      progress(self, count);
    }
    complete(self, count);
  }
}

Clusterer.prototype.defaultInitialMeans = function(count) {
  var means = [];

  for (var i = 0; i < count; i++) {
    var ratio = i / count;
    var r = ratio * 255;
    var g = ratio * 255;
    var b = ratio * 255;
    var a = 1;
    means.push(r, g, b, a);
  }

  return means;
}

// Given an array of palette pixels, assume the order matches that of
// the clusters, and create a new array of pixel data using the palette
// pixels in the same arrangement as the clusters.
Clusterer.prototype.applyPalette = function(palette, opt_output) {
  var out = opt_output || new Uint8ClampedArray(this.pixels.length);

  for (var i = 0; i < this.clusters.length; i++) {
    var cluster = this.clusters[i];
    var colorIdx = (i % palette.length) * this.dataFactor;
    for (var j = 0; j < cluster.length(); j++) {
      var p = cluster.get(j);
      for (var k = 0; k < this.dataFactor; k++) {
        out[p+k] = palette[colorIdx+k];
      }
    }
  }

  return out;
}

function rgbaDist2(r1, g1, b1, a1, r2, g2, b2, a2) {
  var r = r1 - r2;
  var g = g1 - g2;
  var b = b1 - b2;
  var a = a1 - a2;

  return r*r + g*g + b*b + a*a;
}