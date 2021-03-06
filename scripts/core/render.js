// iVisDesigner - scripts/core/render.js
// Author: Donghao Ren
//
// LICENSE
//
// Copyright (c) 2014, The Regents of the University of California
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification,
// are permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this
//    list of conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors
//    may be used to endorse or promote products derived from this software without
//    specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
// IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
// INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
// BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
// LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
// OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
// OF THE POSSIBILITY OF SUCH DAMAGE.

if(IV.isBrowser) {
    IV.getOptimalRatio = function() {
        var canvas = document.createElement("canvas");
        var g = canvas.getContext("2d");
        var dev_ratio = window.devicePixelRatio || 1;
        var backing_ratio = g.webkitBackingStorePixelRatio ||
                            g.mozBackingStorePixelRatio ||
                            g.msBackingStorePixelRatio ||
                            g.oBackingStorePixelRatio ||
                            g.backingStorePixelRatio || 1;
        return dev_ratio / backing_ratio;
    };
} else {
    IV.getOptimalRatio = function() { return 1; }
}

// Class: IV.CanvasManager
// Class to manage canvases.
// Helps adding canvas, and maintain heights.

IV.CanvasManager = function(width, height) {
    this.width = width ? width : 600;
    this.height = height ? height : 400;
    this.ratio = IV.getOptimalRatio();
    this.canvas = { };
};

IV.CanvasManager.prototype.getResolutionRatio = function() {
    return this.ratio;
};

IV.CanvasManager.prototype.setResolutionRatio = function(ratio) {
    this.ratio = ratio;
    this.resize(this.width, this.height, false);
};

// Add a canvas.
IV.CanvasManager.prototype.add = function(key, canvas, set_css) {
    this.canvas[key] = canvas;
    canvas.width = this.ratio * this.width;
    canvas.height = this.ratio * this.height;
};

// Get a canvas by name.
IV.CanvasManager.prototype.get = function(key) {
    return this.canvas[key];
};

// Resize the canvases.
IV.CanvasManager.prototype.resize = function(width, height, set_css) {
    this.width = width;
    this.height = height;
    for(var key in this.canvas) {
        var c = this.canvas[key];
        c.width = this.ratio * this.width;
        c.height = this.ratio * this.height;
        if(set_css) {
            $(c).css("width", this.width + "px");
            $(c).css("height", this.height + "px");
        }
    }
};

// Class: IV.Renderer
// Visualization renderer.

IV.Renderer = function() {
    this.data = null;
    this.vis = null;
    this.view = null;
    this.manager = null;
    this.center = new IV.Vector(0, 0);
    this.scale = 1;
    this.needs_render = { };
    this.frame_origin = false;
    this.frame_grid = false;
    this.grid_size = 10;
    this.show_guide = true;
    var $this = this;

    IV.EventSource.call(this);

    this.bind("main", function(data, g) {
        if($this.vis) {
            $this.vis.render(data, g);
        }
    });
    this.bind("front", function(data, g) {
        if($this.vis && $this.show_guide) {
            $this.vis.renderGuideSelected(data, g);
        }
        if($this.vis) {
            $this.vis.renderSelection(data, g);
        }
    });
    this.bind("back", function(data, g) {
        if($this.vis && $this.show_guide) {
            g.strokeStyle = "gray";
            var w = g.ivGuideLineWidth();
            g.strokeRect($this.vis.artboard.x0, $this.vis.artboard.y0, $this.vis.artboard.width, $this.vis.artboard.height);
        }
        if($this.frame_grid) {
            var gs = this.grid_size;
            while(gs * this.scale < 5) {
                gs *= 10;
            }
            while(gs * this.scale > 50) {
                gs /= 10;
            }
            var render_grid = function(gs) {
                var w = g.ivGuideLineWidth();
                var nx = Math.ceil($this.manager.width / $this.scale / 2 / gs);
                var kx = Math.round(-$this.center.x / gs / $this.scale);
                var ny = Math.ceil($this.manager.height / $this.scale / 2 / gs);
                var ky = Math.round(-$this.center.y / gs / $this.scale);
                g.beginPath();
                for(var i = -nx; i<= nx; i++) {
                    g.moveTo((i + kx) * gs, (ny + ky) * gs);
                    g.lineTo((i + kx) * gs, (ky - ny) * gs);
                }
                for(var i = -ny; i<= ny; i++) {
                    g.moveTo((nx + kx) * gs, (i + ky) * gs);
                    g.lineTo((kx - nx) * gs, (i + ky) * gs);
                }
                g.strokeStyle = IV.colors.guide.toRGBA();
                g.lineCap = "butt";
                g.stroke();
            };
            render_grid(gs);
            render_grid(gs * 10);
        }
        if($this.frame_origin) {
            var w = g.ivGuideLineWidth();
            var l = 10 * w;
            g.beginPath();
            g.moveTo(-l, 0);
            g.lineTo(l, 0);
            g.moveTo(0, -l);
            g.lineTo(0, l);
            g.strokeStyle = "gray";
            g.stroke();
        }
        if($this.vis && $this.show_guide) {
            $this.vis.renderGuide(data, g);
        }
    });
};

IV.implement(IV.EventSource, IV.Renderer);

// Set dataset.
// Note that the schema is only needed for editing, not rendering.
IV.Renderer.prototype.setData = function(data) {
    this.data = data;
};

// Set visualzation to render, attach event handlers.
IV.Renderer.prototype.setVisualization = function(vis) {
    this.vis = vis;
};

// Set view transform, given center and scale.
IV.Renderer.prototype.setView = function(center, scale) {
    this.center = center;
    this.scale = scale;
};

IV.Renderer.prototype.getView = function() {
    return {
        center: this.center,
        scale: this.scale
    };
};

IV.Renderer.prototype.autoView = function(vis) {
    var ab = vis.artboard;
    var w = this.manager.width;
    var h = this.manager.height;
    this.scale = Math.min(
        (w - 10) / ab.width,
        (h - 10) / ab.height
    );
    this.center = new IV.Vector(-(ab.x0 + ab.width / 2) * this.scale,
                                -(ab.y0 + ab.height / 2) * this.scale);
};

IV.Renderer.prototype.getConfig = function() {
    return {
        view: this.getView(),
        frame_origin: this.frame_origin,
        frame_grid: this.frame_grid,
        grid_size: this.grid_size
    };
};

IV.Renderer.prototype.setConfig = function(config) {
    this.setView(config.view.center, config.view.scale);
    this.frame_origin = config.frame_origin;
    this.frame_grid = config.frame_grid;
    this.grid_size = config.grid_size;
};



IV.Renderer.prototype.getOffsetFromScreen = function(pt) {
    var x = (pt.x - this.manager.width / 2 - this.center.x) / this.scale;
    var y = -(pt.y - this.manager.height / 2 + this.center.y) / this.scale;
    var r = new IV.Vector(x, y);
    r.view_det = [ this.scale, 0, 0, this.scale ];
    r.view_scale = this.scale;
    return r;
};

// Set the CanvasManager.
IV.Renderer.prototype.setCanvasManager = function(manager) {
    this.manager = manager;
};

// Trigger render for layers.
IV.Renderer.prototype.trigger = function(items) {
    if(items === null || items === undefined) {
        items = [ "front", "back", "main", "overlay" ];
    }
    if(typeof(items) == "string") items = items.split(",");
    for(var i = 0; i < items.length; i++)
        this.needs_render[items[i]] = true;
};

if(IV.isBrowser) {
    CanvasRenderingContext2D.prototype.ivSave = function() {
        this.save();
        if(!this.iv_transform_stack) this.iv_transform_stack = [];
        this.iv_transform_stack.push(this.iv_transform);
    };

    CanvasRenderingContext2D.prototype.ivRestore = function() {
        this.restore();
        if(!this.iv_transform_stack) this.iv_transform_stack = [];
        this.iv_transform = this.iv_transform_stack.pop();
    };

    // CanvasRenderingContext2D.prototype.ivSetTransform = function(tr) {
    //     if(!tr) tr = new IV.affineTransform();
    //     var r = this.iv_pre_ratio;
    //     this.setTransform(r * tr.m[0], r * tr.m[1], r * tr.m[3], r * tr.m[4], r * tr.m[2], r * tr.m[5]);
    //     this.iv_transform = tr;
    // };

    CanvasRenderingContext2D.prototype.ivAppendTransform = function(tr) {
        if(this.iv_transform)
            this.iv_transform = this.iv_transform.concat(tr);
        else
            this.iv_transform = tr;
        this.transform(tr.m[0], tr.m[1], tr.m[3], tr.m[4], tr.m[2], tr.m[5]);
    };

    CanvasRenderingContext2D.prototype.ivGetTransform = function(tr) {
        if(this.iv_transform)
            return this.iv_transform;
        return new IV.affineTransform();
    };

    CanvasRenderingContext2D.prototype.ivGetGuideWidth = function() {
        return 1.0 / Math.sqrt(Math.abs(this.ivGetTransform().det()));
    };

    CanvasRenderingContext2D.prototype.ivGuideLineWidth = function(scale) {
        return this.lineWidth = this.ivGetGuideWidth() * (scale !== undefined ? scale : 1);
    };

    CanvasRenderingContext2D.prototype.ivSetFont = function(font_info) {
        var sz = font_info.size ? font_info.size : 12;
        var f = font_info.family ? font_info.family : "Arial";
        this.font = "36px " + f;
        this._font_size = sz;
    };

    CanvasRenderingContext2D.prototype.ivMeasureText = function(s) {
        var r = this.measureText(s);
        return { width: r.width / 36 * this._font_size };
    };

    CanvasRenderingContext2D.prototype.ivFillText = function(s, x, y) {
        this.save();
        var scale = 1.0 / 36.0 * this._font_size;
        this.translate(x, y);
        this.scale(scale, -scale);
        this.fillText(s, 0, 0);
        this.restore();
    };
    CanvasRenderingContext2D.prototype.ivStrokeText = function(s, x, y) {
        this.save();
        var scale = 1.0 / 36.0 * this._font_size;
        this.translate(x, y);
        this.lineWidth /= this._font_size / 36;
        this.scale(scale, -scale);
        this.strokeText(s, 0, 0);
        this.restore();
    };
}

IV.Renderer.prototype._set_transform = function(ctx) {
    //ctx.iv_pre_ratio = this.manager.ratio;
    if(IV.isBrowser) {
        ctx.ivAppendTransform(new IV.affineTransform([
            this.manager.ratio, 0, 0,
            0, this.manager.ratio, 0,
            0, 0, 1
        ]));
        ctx.ivAppendTransform(new IV.affineTransform([
            this.scale, 0, this.center.x + this.manager.width / 2,
            0, -this.scale, -this.center.y + this.manager.height / 2,
            0, 0, 1
        ]));
    } else {
        ctx.ivAppendTransform(new IV.affineTransform([
            this.scale, 0, this.center.x + this.manager.width / 2,
            0, -this.scale, -this.center.y + this.manager.height / 2,
            0, 0, 1
        ]));
    }
};

IV.Renderer.prototype._perform_render = function(key) {
    var canvas = this.manager.get(key);
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, this.manager.width * this.manager.ratio, this.manager.height * this.manager.ratio);

    ctx.ivSave();
    this._set_transform(ctx);

    this.raise(key + ":before", this.data, ctx);
    this.raise(key, this.data, ctx);
    this.raise(key + ":after", this.data, ctx);

    ctx.ivRestore();
};

// Render the visualizaion.
IV.Renderer.prototype.render = function() {
    var rendered = false;
    for(var key in this.needs_render) {
        if(!this.needs_render[key]) continue;
        this._perform_render(key);
        rendered = true;
        this.needs_render[key] = false;
    }
    return rendered;
};

IV.Renderer.prototype.renderSVG = function() {
    var ab = this.vis.artboard;
    var ctx = new C2S(ab.width, ab.height);
    // Copy extended methods.
    for(var name in CanvasRenderingContext2D.prototype) {
        if(name.substr(0, 2) != "iv") continue;
        ctx[name] = CanvasRenderingContext2D.prototype[name];
    }
    // Render stuff.
    ctx.ivAppendTransform(new IV.affineTransform([
        1, 0, -ab.x0,
        0, -1, ab.y0 + ab.height,
        0, 0, 1
    ]));
    this.vis.render(this.data, ctx);
    var svg = ctx.getSerializedSvg();
    return svg;
};

IV.Renderer.prototype.renderBitmap = function(ratio) {
    var canvas = document.createElement("canvas");
    var ab = this.vis.artboard;
    canvas.width = ab.width * ratio;
    canvas.height = ab.height * ratio;
    var ctx = canvas.getContext("2d");
    ctx.ivAppendTransform(new IV.affineTransform([
        ratio, 0, 0,
        0, ratio, 0,
        0, 0, 1
    ]));
    ctx.ivAppendTransform(new IV.affineTransform([
        1, 0, -ab.x0,
        0, -1, ab.y0 + ab.height,
        0, 0, 1
    ]));
    this.vis.render(this.data, ctx);
    return canvas.toDataURL("image/png").split(",")[1];
};
