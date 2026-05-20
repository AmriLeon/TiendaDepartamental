import { useState } from 'react';

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const params = new URLSearchParams();
        params.append('username', formData.username);
        params.append('password', formData.password);

        const response = await fetch('http://localhost:8000/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params
        });

        if (!response.ok) throw new Error('Usuario o contraseña incorrectos');
        
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('rol', data.rol);
        onLogin(data.rol);
      } else {
        // Registro
        const response = await fetch('http://localhost:8000/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error al registrar');
        }
        
        // Registro exitoso, cambiar a login
        setIsLogin(true);
        setError('Registro exitoso. Ahora puedes iniciar sesión.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <span className="bg-brand-100 text-brand-800 p-3 rounded-full text-4xl inline-block mb-4 shadow-sm">🏢</span>
        </div>
        <h2 className="text-center text-4xl font-extrabold text-brand-900 tracking-tight">
          EDMIRS
        </h2>
        <h3 className="mt-3 text-center text-lg text-brand-600 font-medium">
          {isLogin ? 'Inicia sesión en tu cuenta' : 'Crea una nueva cuenta'}
        </h3>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-brand-200/50 sm:rounded-2xl sm:px-10 border border-brand-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-brand-800 mb-1">Usuario</label>
              <input
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-brand-200 rounded-xl shadow-sm placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm text-brand-900 bg-brand-50/50 transition-all"
                placeholder="Tu nombre de usuario"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-brand-800 mb-1">Correo Electrónico</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border border-brand-200 rounded-xl shadow-sm placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm text-brand-900 bg-brand-50/50 transition-all"
                  placeholder="ejemplo@correo.com"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-brand-800 mb-1">Contraseña</label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-brand-200 rounded-xl shadow-sm placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm text-brand-900 bg-brand-50/50 transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className={`p-3 rounded-lg text-sm font-medium ${error.includes('exitoso') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-brand-600 hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-600 disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
              >
                {loading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-brand-400 font-medium">o continua con</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="text-brand-600 hover:text-brand-800 font-bold transition-colors"
              >
                {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
