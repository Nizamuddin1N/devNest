import React, { useState, useRef, useEffect } from "react";
import { login, registerUser, googleLogin } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { Shield } from "lucide-react";
import "../styles/auth-styles.css";
import { useGoogleLogin } from "@react-oauth/google";

const vertexShaderSource = `
  attribute vec4 a_position;
  void main() {
    gl_Position = a_position;
  }
`;

const fragmentShaderSource = `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform vec3 u_color;

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 uv = (1.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);
    float t = iTime * 0.5;

    vec2 mouse_uv = (4.0 * iMouse - iResolution.xy) / min(iResolution.x, iResolution.y);

    float mouseInfluence = 0.0;
    if (length(iMouse) > 0.0) {
        float dist_to_mouse = distance(uv, mouse_uv);
        mouseInfluence = smoothstep(0.8, 0.0, dist_to_mouse);
    }

    for(float i = 8.0; i < 20.0; i++) {
        uv.x += 0.6 / i * cos(i * 2.5 * uv.y + t);
        uv.y += 0.6 / i * cos(i * 1.5 * uv.x + t);
    }

    float wave = abs(sin(t - uv.y - uv.x + mouseInfluence * 8.0));
    float glow = smoothstep(0.9, 0.0, wave);

    vec3 color = glow * u_color;

    fragColor = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

interface ShaderBackgroundProps {
  color?: string;
}

function ShaderBackground({ color = "#07eae6" }: ShaderBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const hexToRgb = (hex: string): [number, number, number] => {
    const r = parseInt(hex.substring(1, 3), 16) / 255;
    const g = parseInt(hex.substring(3, 5), 16) / 255;
    const b = parseInt(hex.substring(5, 7), 16) / 255;
    return [r, g, b];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program linking error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
    const iTimeLocation = gl.getUniformLocation(program, "iTime");
    const iMouseLocation = gl.getUniformLocation(program, "iMouse");
    const uColorLocation = gl.getUniformLocation(program, "u_color");

    let startTime = Date.now();

    const [r, g, b] = hexToRgb(color);
    gl.uniform3f(uColorLocation, r, g, b);

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);

      const currentTime = (Date.now() - startTime) / 1000;

      gl.uniform2f(iResolutionLocation, width, height);
      gl.uniform1f(iTimeLocation, currentTime);
      gl.uniform2f(
        iMouseLocation,
        isHovering ? mousePosition.x : 0,
        isHovering ? height - mousePosition.y : 0
      );

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      setMousePosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => {
      setIsHovering(false);
      setMousePosition({ x: 0, y: 0 });
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseenter", handleMouseEnter);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    render();

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseenter", handleMouseEnter);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isHovering, mousePosition, color]);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      />
      <div className="absolute inset-0 backdrop-blur-sm"></div>
    </div>
  );
}

export default function Auth() {
    const { setAuth } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const redirect = location.search.replace("?redirect=", "") || "/dashboard";
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [passwordStrength, setPasswordStrength] = useState<"empty" | "weak" | "medium" | "strong" | "very-strong">("empty");

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (!isLogin && passwordStrength === "weak") {
                setError("Password is too weak. Please use a stronger password.");
                setLoading(false);
                return;
            }

            let res;
            if (isLogin) {
                res = await login({ email: form.email, password: form.password });
            } else {
                if (!form.name) {
                    setError("Name is required");
                    setLoading(false);
                    return;
                }
                res = await registerUser(form);
            }

            if (res.token && res.user) {
                setAuth(res.user, res.token);
                navigate(redirect, { replace: true });
            } else {
                setError(res.message || "Authentication failed");
            }
        } catch (err: any) {
            console.error("Auth error:", err);
            setError(err.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

const googleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
        try {
            const data = await googleLogin(tokenResponse.access_token);
            if (data.token && data.user) {
                setAuth(data.user, data.token);
                navigate(redirect, { replace: true });
            }
        } catch {
            setError("Google login failed");
        }
    },
    onError: () => setError("Google Login Failed"),
});

    return (
        <>
            <ShaderBackground color="#07eae6" />
            <div className="relative flex justify-center items-center min-h-screen p-4 z-10">
                <div className="auth-card w-full max-w-md">
                    {/* Card Header */}
                    <div className="auth-card-header">
                        <h1 className="auth-card-title">
                            {isLogin ? "Login" : "Register"}
                        </h1>
                    </div>

                    {/* Card Content */}
                    <div className="auth-card-content">
                        {/* Error Message */}
                        {error && (
                            <div className="auth-error" role="alert">
                                {error}
                            </div>
                        )}

                        {/* Form Fields */}
                        <form onSubmit={submit} className="space-y-4">
                            {/* Name Input (Register Only) */}
                            {!isLogin && (
                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    required
                                    className="auth-input w-full"
                                    aria-label="Full Name"
                                />
                            )}

                            {/* Email Input */}
                            <input
                                type="email"
                                placeholder="Email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                required
                                className="auth-input w-full"
                                aria-label="Email Address"
                            />

                            {/* Password Input */}
                            {!isLogin ? (
                                <div className="auth-password-wrapper">
                                    <PasswordStrengthIndicator
                                        value={form.password}
                                        onChange={(value) => setForm({ ...form, password: value })}
                                        onStrengthChange={setPasswordStrength}
                                        label="Password"
                                        placeholder="Enter a strong password"
                                        showScore={true}
                                        showScoreNumber={true}
                                        showVisibilityToggle={true}
                                    />
                                </div>
                            ) : (
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    required
                                    className="auth-input w-full"
                                    aria-label="Password"
                                />
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="auth-submit-btn"
                                disabled={loading || (!isLogin && passwordStrength === "weak")}
                                aria-label={isLogin ? "Login to your account" : "Create new account"}
                            >
                                {loading ? "Please wait..." : (isLogin ? "Login" : "Register")}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="auth-divider">
                            <div className="auth-divider-line" />
                            <div className="auth-divider-text">
                                <span>Or continue with</span>
                            </div>
                        </div>

                        {/* Google Login */}
<div className="auth-google-wrapper">
    <button
        type="button"
        className="auth-google-btn"
        onClick={() => googleAuth()}
        aria-label="Sign in with Google"
    >
        <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign in with Google
    </button>
</div>

                        {/* Toggle Auth Mode */}
                        <div className="text-center">
                            <button
                                type="button"
                                className="auth-toggle-btn"
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError("");
                                    setForm({ name: "", email: "", password: "" });
                                }}
                                aria-label={isLogin ? "Switch to registration" : "Switch to login"}
                            >
                                {isLogin ? "Create account" : "Already have an account?"}
                            </button>
                        </div>

                        {/* Forgot Password */}
                        <div className="text-center">
                            <Link 
                                to="/send-otp" 
                                className="auth-link"
                                title="Reset your password"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Admin Registration Section */}
                        <div className="auth-admin-section">
                            <p className="auth-admin-text">Are you an administrator?</p>
                            <Link 
                                to="/admin-register"
                                className="auth-admin-btn"
                                title="Access admin registration"
                            >
                                <Shield className="w-4 h-4" />
                                Admin Registration
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}