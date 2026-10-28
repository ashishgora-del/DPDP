import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../shared/auth';
import { Home } from 'lucide-react';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/learning-platform/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/learning-platform')}
              className="text-2xl font-bold text-primary-600 hover:text-primary-700"
            >
              Learning Platform
            </button>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-700 hover:text-primary-600 font-medium"
              title="Back to Main Home"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
            <button
              onClick={() => navigate('/learning-platform/catalog')}
              className="text-gray-700 hover:text-primary-600 font-medium"
            >
              Catalog
            </button>
            {isAuthenticated && (
              <>
                <button
                  onClick={() => navigate('/learning-platform/my-learning')}
                  className="text-gray-700 hover:text-primary-600 font-medium"
                >
                  My Learning
                </button>
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => navigate('/learning-platform/admin')}
                    className="text-gray-700 hover:text-primary-600 font-medium"
                  >
                    Admin
                  </button>
                )}
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/learning-platform/profile')}
                  className="text-gray-700 hover:text-primary-600 font-medium"
                >
                  {user?.name}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/learning-platform/login')}
                  className="px-4 py-2 text-gray-700 font-medium hover:text-primary-600"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/learning-platform/register')}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
