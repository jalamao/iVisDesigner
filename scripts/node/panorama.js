function EquirectangularTexture(allosphere) {
    this.allosphere = allosphere;
    var texture_left = allosphere.textureCreate();
    var texture_right = allosphere.textureCreate();
    this.textures = [ texture_left, texture_right ];
}

EquirectangularTexture.prototype.submit = function(image, is_stereo) {
    this.is_stereo = is_stereo ? true : false;
    if(this.is_stereo) {
        this.allosphere.textureBind(this.textures[0], 0);
        this.allosphere.textureSubmit(image.width(), image.height() / 2, image.pixels());
        this.allosphere.textureBind(this.textures[1], 0);
        this.allosphere.textureSubmit(image.width(), image.height() / 2, image.pixels().slice(image.width() * image.height() / 2 * 4));
    } else {
        this.allosphere.textureBind(this.textures[0], 0);
        this.allosphere.textureSubmit(image.width(), image.height(), image.pixels());
    }
};

EquirectangularTexture.prototype.submitImageFile = function(filename, is_stereo) {
    var fs = require("fs");
    if(!fs.existsSync(filename)) return;
    var image = graphics.loadImageData(fs.readFileSync(filename));
    this.submit(image, is_stereo);
};

EquirectangularTexture.prototype.get = function(eye) {
    if(this.is_stereo) {
        return this.textures[eye > 0 ? 1 : 0];
    } else {
        return this.textures[0];
    }
}

EquirectangularTexture.prototype.free = function() {
    this.allosphere.textureDelete(this.textures[0]);
    this.allosphere.textureDelete(this.textures[1]);
};

function EquirectangularRenderer(allosphere) {
    var vertex_shader = [
    "    void main() {",
    "        vec4 vertex = gl_ModelViewMatrix * gl_Vertex;",
    "        gl_TexCoord[0] = gl_MultiTexCoord0;",
    "        gl_Position = omni_render(vertex);",
    "    }"
    ].join("\n");
    var fragment_shader = [
    "    uniform sampler2D texture0;",
    "    const float PI = 3.141592653589793238462643383;",
    "    void main() {",
    "        vec3 position = -gl_TexCoord[0].zxy;",
    "        float phi = atan(position.y, position.x);",
    "        float theta = atan(position.z, length(position.xy));",
    "        vec2 st;",
    "        st.x = -phi / PI / 2.0 + 0.5;",
    "        st.y = theta / PI + 0.5;",
    "        vec4 textureColor = texture2D(texture0, st);",
    "        gl_FragColor = textureColor;",
    "    }"
    ].join("\n");

    this.shader_id = allosphere.shaderCreate(vertex_shader, fragment_shader);
}

EquirectangularRenderer.prototype.render = function(texture, info) {
    var texture = texture.get(info.eye);
    allosphere.shaderBegin(this.shader_id);
    allosphere.shaderUniformi("texture0", 2);
    allosphere.shaderUniformf("omni_eye", 0);
    allosphere.textureBind(texture, 2);
    var s = 10;
    var vertices = [    //           7------4      z
        [ +s, +s, +s ], // 0        /|     /|      ^
        [ +s, +s, -s ], // 1       3-|----0 |      + > y
        [ +s, -s, -s ], // 2       | 6----|-5
        [ +s, -s, +s ], // 3       |/     |/
        [ -s, +s, +s ], // 4       2------1
        [ -s, +s, -s ], // 5
        [ -s, -s, -s ], // 6
        [ -s, -s, +s ]  // 7
    ];
    var faces = [
        [ 0, 1, 2, 3 ],
        [ 4, 0, 3, 7 ],
        [ 4, 5, 1, 0 ],
        [ 3, 2, 6, 7 ],
        [ 7, 6, 5, 4 ],
        [ 1, 5, 6, 2 ]
    ];

    GL.begin(GL.QUADS);
    for(var i = 0; i < faces.length; i++) {
        var f = faces[i];
        for(var j = 0; j < 4; j++) {
            var v = vertices[f[j]];
            GL.texCoord3f(v[0], v[1], v[2]);
            GL.normal3f(-v[0], -v[1], -v[2]);
            GL.vertex3f(v[0], v[1], v[2]);
        }
    }
    GL.end();

    allosphere.textureUnbind(texture, 2);
    allosphere.shaderEnd(this.shader_id);
};
