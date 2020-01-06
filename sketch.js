function Node(x, y) {
  this.x = x;
  this.y = y;
  this.wall = false;

  /*
  if (random() < 0.25) {
    this.wall = true;
  }
  */

  this.g = Infinity;
  this.h = Infinity;
  this.prev = undefined;
  this.visited = false;

  this.f = function() {
    return this.g + this.h;
  };

  this.distance = function(end_node) {
    var dx = abs(this.x - end_node.x);
    var dy = abs(this.y - end_node.y);
    return min(dx, dy) * 14 + abs(dx - dy) * 10;
  };

  this.heuristic = function(end_node) {
    this.h = this.distance(end_node);
  };

  this.show = function(col, w, h) {
    fill(col);
    noStroke();
    rect(this.x * w, this.y * h, w - 1, h - 1);
    // ellipse(this.x * w + w / 2, this.y * h + h / 2, w / 2, h / 2);
  };
}


function Grid(xdim, ydim) {
  this.xdim = xdim;
  this.ydim = ydim;
  this.nodes = new Array(this.xdim * this.ydim);

  this.open = [];
  this.close = [];
  this.path = [];

  this.start_node = undefined;
  this.end_node = undefined;

  // populate the grid
  for (var y = 0; y < this.ydim; y++) {
    var yidx = y * this.xdim;
    for (var x = 0; x < this.xdim; x++) {
      this.nodes[yidx + x] = new Node(x, y);
    }
  }

  this.neighbors = function(cur_node) {
    // local variables
    var xcur = cur_node.x;
    var ycur = cur_node.y;
    var neighbors = [];
    var cur_idx = ycur * this.xdim + xcur;
    var dx = 1; 
    var dy = this.xdim;
    
    // direct neighbors
    if (xcur > 0) {
      neighbors.push(this.nodes[cur_idx - dx]);
    }
    if (xcur < this.xdim - 1) {
      neighbors.push(this.nodes[cur_idx + dx]);
    }
    if (ycur > 0) {
      neighbors.push(this.nodes[cur_idx - dy]);
    }
    if (ycur < this.ydim - 1) {
      neighbors.push(this.nodes[cur_idx + dy]);
    }

    // diagonal neighbors
    if (xcur > 0 && ycur > 0) {
      neighbors.push(this.nodes[cur_idx - dx - dy]);
    }
    if (xcur < this.xdim - 1 && ycur > 0) {
      neighbors.push(this.nodes[cur_idx + dx - dy]);
    }
    if (xcur > 0 && ycur < this.ydim - 1) {
      neighbors.push(this.nodes[cur_idx - dx + dy]);
    }
    if (xcur < this.xdim - 1 && ycur < this.ydim - 1) {
      neighbors.push(this.nodes[cur_idx + dx + dy]);
    }
    return neighbors;
  };


  this.update_path = function(cur_node) {
    this.path = [];
    var temp = cur_node;
    while (temp) {
      this.path.push(temp);
      temp = temp.prev;
    }
  };

  this.get_path = function(start_node, end_node) {
    // clear resulting path
    this.open = [];
    this.close = [];
    this.path = [];

    // clear all previous scores
    for (var j = 0; j < this.nodes.length; j++) {
      this.nodes[j].g = Infinity;
      this.nodes[j].h = Infinity;
      this.nodes[j].prev = undefined;
      this.nodes[j].visited = false;
    }

    // define end node
    this.end_node = end_node;
    this.end_node.wall = false;
    
    // define start node
    this.start_node = start_node;
    this.start_node.g = 0;
    this.start_node.heuristic(this.end_node);
    this.start_node.wall = false;

    // push the start node to the open list
    this.open.push(this.start_node);

    // check if there are any nodes in the open list
    while (this.open.length > 0) {
      // sort the open list by score
      this.open.sort((a, b) => (a.f() > b.f()) ? 1 : -1);

      // get node with lowest f score
      var cur_node = this.open[0];

      // remove from open list and add to closed list (optional)
      this.open.splice(0, 1);
      this.close.push(cur_node);

      // exit condition
      if (cur_node === this.end_node) {
        // compute the path
        this.update_path(cur_node);
        return this.path;
      }

      // get all neighbors
      var neighbors = this.neighbors(cur_node);

      // loop through the neighbours to find the next node
      for (var i = 0; i < neighbors.length; i++) {
        var temp_score = cur_node.g + cur_node.distance(neighbors[i]);
        if (temp_score < neighbors[i].g) {
          neighbors[i].prev = cur_node;
          neighbors[i].g = temp_score;
          neighbors[i].heuristic(this.end_node);

          if (!neighbors[i].visited) {
            if (neighbors[i].wall === false) {
              neighbors[i].visited = true;
              this.open.push(neighbors[i]);
            }
          }
        }
      }
    }

    return this.path;
  };

  this.show = function(width, height) {
    // compute dimensions for display purpose
    var w = width / this.xdim;
    var h = height / this.ydim;
    var i = 0;

    // draw grid and walls
    background(255);
    for (i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i].wall) {
        this.nodes[i].show(color(0, 0, 0), w, h);
      } else {
        this.nodes[i].show(color(220, 220, 220), w, h);
      }
    }

    // draw visited nodes
    for (i = 0; i < this.close.length; i++) {
      this.close[i].show(color(255, 200, 200), w, h);
    }
    
    this.start_node.show(color(255, 0, 0), w, h);
    this.end_node.show(color(0, 255, 0), w, h);
    
    // draw path
    noFill();
    stroke(255, 0, 200);
    strokeWeight(w / 3);
    beginShape();
    for (i = 0; i < this.path.length; i++) {
      vertex(this.path[i].x * w + w / 2, this.path[i].y * h + h / 2);
    }
    endShape();
  };
}

var grid;

function setup() {
  createCanvas(375, 375);

  // create grid
  grid = new Grid(35, 35);
  
  // set default start and end nodes
  grid.start_node = grid.nodes[0];
  grid.end_node = grid.nodes[grid.nodes.length - 1];
}

var update_grid = true;

function mousePressed() {
  var x = floor(mouseX * grid.xdim / width);
  if (x >= grid.xdim)
    return;
  var y = floor(mouseY * grid.ydim / height);
  if (y >= grid.ydim)
    return;
  var idx = x + y * grid.xdim;
  
  if (keyIsDown(LEFT_ARROW)) { 
    // set start node
    grid.start_node = grid.nodes[idx];
  } else if (keyIsDown(RIGHT_ARROW)) {
    // set end node
    grid.end_node = grid.nodes[idx];
  } else {
    // toggle wall
    grid.nodes[idx].wall = !grid.nodes[idx].wall;
  }
  // set grid update flag
  update_grid = true;
}

function draw() {
  // compute new path if the grid has changed
  if (update_grid) {
    // compute new path
    var path = grid.get_path(grid.start_node, grid.end_node);
    // draw the grid and path
    grid.show(width, height);
    // reset grid update flag
    update_grid = false;
  }
  
  // noLoop();
}