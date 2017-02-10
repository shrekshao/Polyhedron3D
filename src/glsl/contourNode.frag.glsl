uniform vec3 color;
uniform vec3 outlineColor;

varying vec3 v_normal;

void main() {
    if ( dot( v_normal, vec3(0.0, 0.0, 1.0) ) < 0.5 )
    {
        gl_FragColor = vec4(outlineColor, 1.0);
    }
    else
    {
        gl_FragColor = vec4(color, 1.0);
    }
    
}