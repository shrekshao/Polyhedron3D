uniform vec3 color;

varying vec3 v_normal;

void main() {
    if ( dot( v_normal, vec3(0.0, 0.0, 1.0) ) < 0.5 )
    {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
    else
    {
        gl_FragColor = vec4(color, 1.0);
    }
    
}