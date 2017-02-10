varying vec3 v_normal;

void main() {
    v_normal = normalMatrix * normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}