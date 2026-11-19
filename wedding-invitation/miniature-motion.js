// Give the still miniature subtle independent character movement using a
// lightweight image warp. If WebGL is unavailable, the original image stays visible.
(() => {
  const artwork = document.getElementById('miniature-art');
  const picture = artwork && artwork.querySelector('img');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!artwork || !picture || reducedMotion.matches) return;

  function startMotion() {
    if (!picture.naturalWidth || !picture.naturalHeight) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'miniature-motion-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.width = Math.min(640, picture.naturalWidth);
    canvas.height = Math.round(canvas.width * picture.naturalHeight / picture.naturalWidth);
    let gl;
    try { gl = canvas.getContext('webgl', { alpha: false, antialias: false }); } catch (_) { return; }
    if (!gl) return;

    const vertexSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = (a_position + 1.0) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
    const fragmentSource = `
      precision mediump float;
      varying vec2 v_uv;
      uniform sampler2D u_picture;
      uniform float u_time;
      float influence(vec2 p, vec2 center, vec2 spread) {
        vec2 d = (p - center) / spread;
        return exp(-dot(d, d) * 2.0);
      }
      void main() {
        // Work in coordinates measured from the top of the picture.
        vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
        float groomHead = influence(p, vec2(0.34, 0.34), vec2(0.18, 0.14));
        float brideHead = influence(p, vec2(0.69, 0.39), vec2(0.16, 0.14));
        float groomBody = influence(p, vec2(0.30, 0.57), vec2(0.23, 0.20));
        float brideBody = influence(p, vec2(0.71, 0.59), vec2(0.21, 0.20));
        float groomHands = influence(p, vec2(0.32, 0.56), vec2(0.15, 0.10));
        float brideHands = influence(p, vec2(0.69, 0.62), vec2(0.16, 0.10));
        // Independent gentle swaying and nodding; the figures remain illustrations.
        p.x += groomHead * (0.015 * sin(u_time * 0.95));
        p.y += groomHead * (0.008 * sin(u_time * 1.15));
        p.x += brideHead * (0.014 * sin(u_time * 0.86 + 0.9));
        p.y += brideHead * (0.008 * sin(u_time * 1.05 + 0.6));
        p.x += groomBody * (0.004 * sin(u_time * 0.95));
        p.x += brideBody * (0.004 * sin(u_time * 0.86 + 0.9));
        p.y += groomHands * (0.007 * sin(u_time * 0.85 + 1.0));
        p.y += brideHands * (0.007 * sin(u_time * 0.92 + 2.0));
        vec2 sampleUV = vec2(clamp(p.x, 0.0, 1.0), 1.0 - clamp(p.y, 0.0, 1.0));
        gl_FragColor = texture2D(u_picture, sampleUV);
      }
    `;
    function makeShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
      return shader;
    }
    try {
      const vertex = makeShader(gl.VERTEX_SHADER, vertexSource);
      const fragment = makeShader(gl.FRAGMENT_SHADER, fragmentSource);
      if (!vertex || !fragment) return;
      const program = gl.createProgram();
      gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
      gl.useProgram(program);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, picture);
      gl.uniform1i(gl.getUniformLocation(program, 'u_picture'), 0);
      const clock = gl.getUniformLocation(program, 'u_time');
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(clock, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      picture.insertAdjacentElement('afterend', canvas);
      let frame = 0, lastDraw = 0, visible = false, broken = false;
      function draw(now) {
        if (!visible || broken) { frame = 0; return; }
        if (now - lastDraw >= 33) {
          gl.uniform1f(clock, now / 1000);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          lastDraw = now;
        }
        frame = requestAnimationFrame(draw);
      }
      function setVisible(value) {
        visible = value && !document.hidden && !reducedMotion.matches;
        if (visible && !frame && !broken) frame = requestAnimationFrame(draw);
        if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; }
      }
      let inView = !('IntersectionObserver' in window);
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
          inView = entries[0].isIntersecting;
          setVisible(inView);
        }, { threshold: .05 });
        observer.observe(artwork);
      }
      document.addEventListener('visibilitychange', () => setVisible(inView));
      reducedMotion.addEventListener('change', () => {
        canvas.hidden = reducedMotion.matches;
        setVisible(inView);
      });
      canvas.addEventListener('webglcontextlost', event => {
        event.preventDefault(); broken = true; canvas.hidden = true;
        if (frame) cancelAnimationFrame(frame);
      });
      setVisible(inView);
    } catch (_) {
      canvas.remove(); // Keep the original illustration if setup fails.
    }
  }
  if (picture.complete) startMotion();
  else picture.addEventListener('load', startMotion, { once: true });
})();
